/**
 * Square Tap to Pay / Point of Sale -> portal.
 *
 * Every minute the portal looks at completed in-person Square payments (Square Point of Sale / Retail app,
 * which is what Tap to Pay on iPhone/Android runs inside) and turns each one into a normal portal order:
 *   - channel "shop_square_pos" (shown as "Shop - Tap to Pay"), status Delivered by default (customer walks out with it)
 *   - items are matched to the exact size/colour through the Square variation id saved by squareCatalogLoad.ts
 *   - stock is taken off the matched variants, then the portal's number is written back to Square
 *   - anything that can't be matched (custom amount, new Square item, short stock) still creates the order and raises
 *     an admin notification, so a payment is never lost
 *   - refunds made in Square mark the order refunded and put the items back into stock
 * Every Square payment id is recorded once in square_pos_payments, so nothing is ever counted twice.
 *
 * Online / reseller EPOS payments (ECOMMERCE_API, TERMINAL_API...) are ignored here - they have their own flows.
 */
import crypto from "crypto";
import { SquareClient, SquareEnvironment } from "square";
import { db } from "./db";
import { sql } from "drizzle-orm";

const POS_PRODUCTS = new Set(["RETAIL", "SQUARE_POS"]);
export const SHOP_CHANNEL = "shop_square_pos";

let running = false;
let stockSyncRunning = false;
let lastStockSync = 0;

const client = () => new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN, environment: SquareEnvironment.Production });
const money = (m: any): number => (m?.amount !== undefined && m?.amount !== null ? Number(m.amount) / 100 : 0);
const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export async function ensurePosSyncTables(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS square_pos_sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    order_status TEXT NOT NULL DEFAULT 'delivered',
    last_polled_at TIMESTAMPTZ,
    last_error TEXT
  )`);
  await db.execute(sql`INSERT INTO square_pos_sync_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS square_pos_payments (
    payment_id TEXT PRIMARY KEY,
    order_id VARCHAR,
    order_number TEXT,
    result TEXT,
    flags TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS square_pos_refunds (
    refund_id TEXT PRIMARY KEY,
    payment_id TEXT,
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS square_item_id TEXT`);
  await db.execute(sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS square_variation_id TEXT`);
}

async function notifyAdmin(title: string, message: string, orderNumber?: string) {
  try {
    await db.execute(sql`INSERT INTO admin_notifications (type, title, message, link, is_read)
      VALUES ('system', ${title}, ${message}, ${orderNumber ? `/admin/orders?search=${orderNumber}` : "/admin/orders"}, false)`);
  } catch (err) {
    console.error("[SquarePOS] notification failed:", err);
  }
}

/** Write the portal's stock number for these variants into Square (absolute counts, never +/-). */
export async function pushStockToSquare(variantIds: string[]): Promise<number> {
  if (!variantIds.length) return 0;
  const locationId = process.env.SQUARE_LOCATION_ID!;
  const rows = (await db.execute(sql`
    SELECT square_variation_id AS sid, GREATEST(stock_quantity, 0) AS stock
      FROM product_variants
     WHERE id IN (${sql.join(variantIds.map((i) => sql`${i}`), sql`, `)}) AND square_variation_id IS NOT NULL
  `)).rows as any[];
  let pushed = 0;
  for (const part of chunk(rows, 100)) {
    await client().inventory.batchCreateChanges({
      idempotencyKey: crypto.randomUUID(),
      changes: part.map((r) => ({
        type: "PHYSICAL_COUNT",
        physicalCount: { catalogObjectId: r.sid, state: "IN_STOCK", locationId, quantity: String(r.stock), occurredAt: new Date().toISOString() },
      })),
    } as any);
    pushed += part.length;
  }
  return pushed;
}

/** Keep Square's counts equal to the portal's (website sales, returns, restocks, amendments change the portal). */
export async function syncPortalStockToSquare(): Promise<{ checked: number; corrected: number }> {
  const locationId = process.env.SQUARE_LOCATION_ID!;
  const mapped = (await db.execute(sql`
    SELECT id, square_variation_id AS sid, GREATEST(stock_quantity, 0) AS stock FROM product_variants WHERE square_variation_id IS NOT NULL
  `)).rows as any[];
  if (!mapped.length) return { checked: 0, corrected: 0 };

  const squareCounts = new Map<string, number>();
  for (const part of chunk(mapped, 100)) {
    const res: any = await client().inventory.batchGetCounts({
      catalogObjectIds: part.map((m) => m.sid), locationIds: [locationId], states: ["IN_STOCK"],
    } as any);
    for await (const c of res) squareCounts.set(c.catalogObjectId, Number(c.quantity));
  }
  const wrong = mapped.filter((m) => (squareCounts.get(m.sid) ?? 0) !== Number(m.stock));
  if (wrong.length) await pushStockToSquare(wrong.map((w) => w.id));
  return { checked: mapped.length, corrected: wrong.length };
}

type Match = { variantId: string | null; productId: string | null; productName: string | null; sku: string | null; size: string | null; color: string | null; imageUrl: string | null; locationNote: string | null; barcode: string | null };

async function matchLine(line: any): Promise<Match | null> {
  const catalogId: string | undefined = line.catalogObjectId;
  if (!catalogId) return null;
  const q = async (where: any) => (await db.execute(sql`
    SELECT v.id AS variant_id, v.product_id, trim(p.name) AS product_name, v.sku, v.size, v.color, p.image_url, v.location_note, v.barcode_descriptor
      FROM product_variants v JOIN products p ON p.id = v.product_id WHERE ${where} LIMIT 1`)).rows[0] as any;
  let row = await q(sql`v.square_variation_id = ${catalogId}`);
  if (!row) {
    // New item created inside Square: look its SKU up and match on that
    try {
      const obj: any = await client().catalog.batchGet({ objectIds: [catalogId] } as any);
      const sku = (obj.objects ?? obj.data?.objects ?? [])[0]?.itemVariationData?.sku;
      if (sku) row = await q(sql`v.sku = ${sku}`);
      if (row) await db.execute(sql`UPDATE product_variants SET square_variation_id = ${catalogId} WHERE id = ${row.variant_id}`);
    } catch { /* leave unmatched */ }
  }
  if (!row) return null;
  return { variantId: row.variant_id, productId: row.product_id, productName: row.product_name, sku: row.sku, size: row.size, color: row.color, imageUrl: row.image_url, locationNote: row.location_note, barcode: row.barcode_descriptor };
}

export async function importPayment(payment: any, orderStatus: string, orderOverride?: any): Promise<void> {
  const paymentId: string = payment.id;
  // Claim the payment id first - whoever inserts it owns the import (guards against double processing)
  const claim = await db.execute(sql`INSERT INTO square_pos_payments (payment_id, result) VALUES (${paymentId}, 'processing') ON CONFLICT (payment_id) DO NOTHING RETURNING payment_id`);
  if (claim.rows.length === 0) return;

  try {
    let order: any = orderOverride ?? null;
    if (!order && payment.orderId) {
      const r: any = await client().orders.get({ orderId: payment.orderId });
      order = r.order ?? r.data?.order ?? null;
    }
    const lines: any[] = order?.lineItems ?? [];
    const flags: string[] = [];

    const total = money(order?.totalMoney ?? payment.totalMoney);
    const tax = money(order?.totalTaxMoney);
    const tip = money(order?.totalTipMoney ?? payment.tipMoney);
    const discount = money(order?.totalDiscountMoney);
    const subtotal = Math.max(total - tax - tip + discount, 0);

    const items: Array<{ m: Match | null; line: any; qty: number }> = [];
    for (const line of lines) {
      const qty = Math.max(1, Math.round(Number(line.quantity) || 1));
      items.push({ m: await matchLine(line), line, qty });
    }
    if (lines.length === 0) flags.push(`No items on this payment (custom amount of £${total.toFixed(2)}) - stock NOT changed`);
    for (const it of items) {
      if (!it.m) flags.push(`"${it.line.name || "Custom amount"}${it.line.variationName ? " / " + it.line.variationName : ""}" x${it.qty} is not matched to a portal size/colour - stock NOT changed`);
    }

    const method = payment.sourceType === "CASH" ? "cash" : payment.cardDetails?.entryMethod === "CONTACTLESS" ? "square_tap_to_pay" : "square_card_in_person";
    const email = payment.buyerEmailAddress && String(payment.buyerEmailAddress).includes("@") ? String(payment.buyerEmailAddress) : "no-email@epos.local";
    const orderNumber = `SQ-${paymentId.replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase()}`;
    const when = new Date(payment.createdAt || Date.now());
    const delivered = orderStatus === "delivered";

    const inserted = (await db.execute(sql`
      INSERT INTO customer_orders (order_number, status, customer_email, customer_first_name, customer_last_name,
        shipping_address, shipping_city, shipping_postal_code, shipping_country,
        subtotal, shipping_cost, tax_amount, total_amount, discount_amount,
        payment_method, payment_intent_id, is_paid, channel, notes, order_date, paid_at, delivered_at)
      VALUES (${orderNumber}, ${orderStatus}::customer_order_status, ${email}, 'Shop', 'Customer',
        'In-Store Pickup', 'Store Collection', 'N/A', 'UK',
        ${subtotal.toFixed(2)}, '0.00', ${tax.toFixed(2)}, ${total.toFixed(2)}, ${discount.toFixed(2)},
        ${method}, ${paymentId}, true, ${SHOP_CHANNEL},
        ${`Square in-person payment ${paymentId}${flags.length ? " | NEEDS ATTENTION: " + flags.join("; ") : ""}`},
        ${when}, ${when}, ${delivered ? when : null})
      RETURNING id`)).rows[0] as any;
    const orderId: string = inserted.id;

    const touched: string[] = [];
    for (const it of items) {
      const unit = money(it.line.basePriceMoney);
      const lineTotal = money(it.line.totalMoney);
      await db.execute(sql`
        INSERT INTO customer_order_items (order_id, product_id, product_name, sku, barcode_descriptor, location_note, size, color, quantity, unit_price, total_price, image_url)
        VALUES (${orderId}, ${it.m?.productId ?? null}, ${it.m?.productName ?? (it.line.name || "Custom amount")}, ${it.m?.sku ?? null},
                ${it.m?.barcode ?? null}, ${it.m?.locationNote ?? null},
                ${it.m ? it.m.size : it.line.variationName || null}, ${it.m ? it.m.color : null},
                ${it.qty}, ${unit.toFixed(2)}, ${lineTotal.toFixed(2)}, ${it.m?.imageUrl ?? null})`);
      if (it.m?.variantId) {
        const before = (await db.execute(sql`SELECT stock_quantity FROM product_variants WHERE id = ${it.m.variantId}`)).rows[0] as any;
        await db.execute(sql`
          UPDATE product_variants SET stock_quantity = GREATEST(stock_quantity - ${it.qty}, 0), updated_at = NOW()
           WHERE id = ${it.m.variantId}`);
        touched.push(it.m.variantId);
        // Sold something the portal thought we did not have: it still happened, so tell the team to check the shelf count
        if (Number(before?.stock_quantity ?? 0) < it.qty) {
          flags.push(`${it.m.productName} ${it.m.size}/${it.m.color}: portal showed ${Number(before?.stock_quantity ?? 0)} in stock but ${it.qty} sold - check the shelf count`);
        }
      }
    }

    await db.execute(sql`INSERT INTO customer_order_status_history (order_id, previous_status, new_status, changed_by_name, notes)
      VALUES (${orderId}, NULL, ${orderStatus}::customer_order_status, 'Square Tap to Pay', ${`Created automatically from Square payment ${paymentId}`})`);

    await db.execute(sql`UPDATE square_pos_payments SET order_id = ${orderId}, order_number = ${orderNumber}, result = ${flags.length ? "needs_attention" : "ok"}, flags = ${flags.join(" | ") || null} WHERE payment_id = ${paymentId}`);
    if (touched.length) await pushStockToSquare(Array.from(new Set(touched)));
    if (flags.length) await notifyAdmin("Shop sale needs attention", `Order ${orderNumber} (£${total.toFixed(2)}): ${flags.join("; ")}`, orderNumber);
    console.log(`[SquarePOS] ${orderNumber} created from payment ${paymentId}: £${total.toFixed(2)}, ${items.length} line(s)${flags.length ? " - needs attention" : ""}`);
  } catch (err: any) {
    // Release the claim so the next pass retries this payment
    await db.execute(sql`DELETE FROM square_pos_payments WHERE payment_id = ${paymentId} AND result = 'processing'`);
    throw err;
  }
}

async function importRefunds(since: Date): Promise<void> {
  const res: any = await client().refunds.list({ beginTime: since.toISOString(), status: "COMPLETED", limit: 100 } as any);
  for await (const refund of res) await processRefund(refund);
}

export async function processRefund(refund: any): Promise<void> {
  {
    const refundId: string = refund.id;
    const paymentId: string = refund.paymentId;
    const known = (await db.execute(sql`SELECT order_id FROM square_pos_payments WHERE payment_id = ${paymentId} AND order_id IS NOT NULL`)).rows[0] as any;
    if (!known) return; // not a shop payment
    const claim = await db.execute(sql`INSERT INTO square_pos_refunds (refund_id, payment_id, result) VALUES (${refundId}, ${paymentId}, 'processing') ON CONFLICT (refund_id) DO NOTHING RETURNING refund_id`);
    if (claim.rows.length === 0) return;

    const ord = (await db.execute(sql`SELECT id, order_number, total_amount::numeric AS total, status FROM customer_orders WHERE id = ${known.order_id}`)).rows[0] as any;
    const refunded = money(refund.amountMoney);
    if (Math.abs(refunded - Number(ord.total)) < 0.011 && ord.status !== "refunded") {
      const items = (await db.execute(sql`SELECT product_id, size, color, quantity FROM customer_order_items WHERE order_id = ${ord.id} AND product_id IS NOT NULL`)).rows as any[];
      const touched: string[] = [];
      for (const it of items) {
        const v = (await db.execute(sql`
          UPDATE product_variants SET stock_quantity = stock_quantity + ${Number(it.quantity)}, updated_at = NOW()
           WHERE product_id = ${it.product_id} AND size IS NOT DISTINCT FROM ${it.size} AND color IS NOT DISTINCT FROM ${it.color} RETURNING id`)).rows[0] as any;
        if (v) touched.push(v.id);
      }
      await db.execute(sql`UPDATE customer_orders SET status = 'refunded' WHERE id = ${ord.id}`);
      await db.execute(sql`INSERT INTO customer_order_status_history (order_id, previous_status, new_status, changed_by_name, notes)
        VALUES (${ord.id}, ${ord.status}::customer_order_status, 'refunded', 'Square Tap to Pay', ${`Full refund £${refunded.toFixed(2)} made in Square (${refundId}); items put back in stock`})`);
      if (touched.length) await pushStockToSquare(touched);
      await db.execute(sql`UPDATE square_pos_refunds SET result = 'full_refund_restocked' WHERE refund_id = ${refundId}`);
      await notifyAdmin("Shop refund processed", `Order ${ord.order_number}: £${refunded.toFixed(2)} refunded in Square, order marked refunded and items put back in stock.`, ord.order_number);
    } else {
      await db.execute(sql`UPDATE square_pos_refunds SET result = 'partial_needs_manual' WHERE refund_id = ${refundId}`);
      await notifyAdmin("Shop partial refund - check stock", `Order ${ord.order_number}: £${refunded.toFixed(2)} of £${Number(ord.total).toFixed(2)} was refunded in Square. Please adjust stock for any returned item by hand.`, ord.order_number);
    }
  }
}

export async function runPosSyncOnce(): Promise<{ imported: number }> {
  const state = (await db.execute(sql`SELECT started_at, order_status FROM square_pos_sync_state WHERE id = 1`)).rows[0] as any;
  const begin = new Date(Math.max(new Date(state.started_at).getTime(), Date.now() - 72 * 3600 * 1000));
  const locationId = process.env.SQUARE_LOCATION_ID!;

  const res: any = await client().payments.list({ beginTime: begin.toISOString(), locationId, sortOrder: "ASC", limit: 100 } as any);
  let imported = 0;
  for await (const p of res) {
    if (p.status !== "COMPLETED") continue;
    if (!POS_PRODUCTS.has(String(p.applicationDetails?.squareProduct))) continue;
    const exists = (await db.execute(sql`SELECT 1 FROM square_pos_payments WHERE payment_id = ${p.id}`)).rows.length > 0;
    if (exists) continue;
    await importPayment(p, state.order_status || "delivered");
    imported++;
  }
  await importRefunds(begin);
  await db.execute(sql`UPDATE square_pos_sync_state SET last_polled_at = NOW(), last_error = NULL WHERE id = 1`);
  return { imported };
}

export function startSquarePosSync(intervalMs = 60 * 1000) {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await ensurePosSyncTables();
      const { imported } = await runPosSyncOnce();
      // Every 5 minutes, make Square's counts match the portal (covers website sales, returns, restocks)
      if (Date.now() - lastStockSync > 5 * 60 * 1000 && !stockSyncRunning) {
        stockSyncRunning = true;
        try {
          const r = await syncPortalStockToSquare();
          lastStockSync = Date.now();
          if (r.corrected) console.log(`[SquarePOS] stock sync: ${r.corrected} of ${r.checked} counts corrected in Square`);
        } finally {
          stockSyncRunning = false;
        }
      }
      if (imported) console.log(`[SquarePOS] imported ${imported} shop payment(s)`);
    } catch (err: any) {
      console.error("[SquarePOS] sync failed:", err?.message || err);
      try { await db.execute(sql`UPDATE square_pos_sync_state SET last_error = ${String(err?.message || err).slice(0, 300)} WHERE id = 1`); } catch { /* ignore */ }
    } finally {
      running = false;
    }
  };
  setTimeout(tick, 30 * 1000);
  setInterval(tick, intervalMs);
  console.log(`🛍️  Square shop (Tap to Pay) sync started - every ${Math.round(intervalMs / 1000)}s`);
}
