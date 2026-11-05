/**
 * Stock smoke test - run after any deploy that touches orders, tills or stock:
 *   npx tsx server/tools/stockSmokeTest.ts
 *
 * It simulates one sale through each way an order can be created and checks the main stock number drops by exactly
 * the quantity sold (and that a cancellation gives it back), then deletes everything it made and restores the stock.
 * Prints PASS / FAIL per path and exits non-zero if any path fails.
 *   1. 1st Rep HQ till QR/card sale   (autoCreateEposOrderFromPending)
 *   2. Square Tap to Pay shop sale    (importPayment)
 *   3. Website/admin order cancelled and un-cancelled (adjustStockForStatusChange)
 */
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { autoCreateEposOrderFromPending } from "../squareRoutes";
import { importPayment } from "../squarePosSync";
import { adjustStockForStatusChange } from "../stockIntegrity";

const HQ = "4f4ac3a4-aa85-4cb4-8ec8-b0fcf5d13f73";
const results: string[] = [];
let failed = false;
const check = (name: string, ok: boolean, detail: string) => { results.push(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`); if (!ok) failed = true; };
const stockOf = async (id: string) => Number(((await db.execute(sql`SELECT stock_quantity s FROM product_variants WHERE id = ${id}`)).rows[0] as any).s);

(async () => {
  const v: any = (await db.execute(sql`
    SELECT v.id, v.product_id, v.size, v.color, v.stock_quantity AS stock, v.square_variation_id AS sid, trim(p.name) AS name
      FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.square_variation_id IS NOT NULL AND v.stock_quantity >= 10 AND p.is_active
     ORDER BY v.stock_quantity DESC LIMIT 1`)).rows[0];
  if (!v) { console.error("No suitable test variant (needs stock >= 10 and a Square id)"); process.exit(2); }
  const S = Number(v.stock);
  const tag = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.log(`Test variant: ${v.name} ${v.size}/${v.color} (stock ${S})`);

  try {
    // 1. HQ till QR/card sale
    const ref = "SMOKE" + tag;
    await db.execute(sql`INSERT INTO epos_pending_payments (reference_id, payment_link_id, reseller_id, items, total_amount, subtotal, status, own_square, delivery_method)
      VALUES (${ref}, ${"PL" + ref}, ${HQ}, ${JSON.stringify([{ productId: v.product_id, name: v.name, quantity: 2, size: v.size, color: v.color, unitPrice: "1.00", price: 1 }])}::jsonb, '2.00', '2.00', 'pending', false, 'collection')`);
    await autoCreateEposOrderFromPending({ referenceId: ref, squarePaymentId: "SMOKEPAY" + ref, sendEmail: false } as any);
    const afterQr = await stockOf(v.id);
    check("HQ till QR/card sale", afterQr === S - 2, `stock ${S} -> ${afterQr} (expected ${S - 2})`);

    // 2. Tap to Pay sale
    const payId = "SMOKETAP" + tag;
    await importPayment(
      { id: payId, status: "COMPLETED", createdAt: new Date().toISOString(), sourceType: "CARD", cardDetails: { entryMethod: "CONTACTLESS" }, totalMoney: { amount: BigInt(100) }, applicationDetails: { squareProduct: "RETAIL" } },
      "delivered",
      { totalMoney: { amount: BigInt(100) }, lineItems: [{ name: v.name, variationName: `${v.size} / ${v.color}`, quantity: "1", catalogObjectId: v.sid, basePriceMoney: { amount: BigInt(100) }, totalMoney: { amount: BigInt(100) } }] },
    );
    const afterTap = await stockOf(v.id);
    check("Tap to Pay sale", afterTap === afterQr - 1, `stock ${afterQr} -> ${afterTap} (expected ${afterQr - 1})`);

    // 3. Website order cancel / un-cancel
    const oid = "smoke-order-" + tag;
    await db.execute(sql`INSERT INTO customer_orders (id, order_number, status, customer_email, customer_first_name, customer_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country, subtotal, shipping_cost, tax_amount, total_amount, payment_method, is_paid, channel)
      VALUES (${oid}, ${"SMOKE-" + tag}, 'processing', 'smoke@1strep.internal', 'Smoke', 'Test', '1 Test St', 'Test', 'T1 1ST', 'UK', 3, 0, 0, 3, 'test', true, 'website')`);
    await db.execute(sql`INSERT INTO customer_order_items (order_id, product_id, product_name, size, color, quantity, unit_price, total_price) VALUES (${oid}, ${v.product_id}, ${v.name}, ${v.size}, ${v.color}, 3, 1, 3)`);
    await db.execute(sql`UPDATE product_variants SET stock_quantity = stock_quantity - 3 WHERE id = ${v.id}`); // what checkout does
    const beforeCancel = await stockOf(v.id);
    await adjustStockForStatusChange(oid, "processing", "cancelled");
    const afterCancel = await stockOf(v.id);
    check("Cancelled order gives stock back", afterCancel === beforeCancel + 3, `stock ${beforeCancel} -> ${afterCancel} (expected ${beforeCancel + 3})`);
    await adjustStockForStatusChange(oid, "cancelled", "processing");
    const afterUncancel = await stockOf(v.id);
    check("Un-cancelled order takes it off again", afterUncancel === afterCancel - 3, `stock ${afterCancel} -> ${afterUncancel} (expected ${afterCancel - 3})`);
  } finally {
    // Clean up everything the test created and put the stock back exactly as it was
    const orders = (await db.execute(sql`SELECT id FROM customer_orders WHERE payment_intent_id LIKE ${"SMOKE%" + tag} OR order_number = ${"SMOKE-" + tag} OR id = ${"smoke-order-" + tag}`)).rows as any[];
    for (const o of orders) {
      await db.execute(sql`DELETE FROM commissions WHERE order_id = ${o.id}`);
      await db.execute(sql`DELETE FROM customer_order_status_history WHERE order_id = ${o.id}`);
      await db.execute(sql`DELETE FROM customer_order_items WHERE order_id = ${o.id}`);
      await db.execute(sql`DELETE FROM customer_orders WHERE id = ${o.id}`);
    }
    await db.execute(sql`DELETE FROM epos_pending_payments WHERE reference_id = ${"SMOKE" + tag}`);
    await db.execute(sql`DELETE FROM square_pos_payments WHERE payment_id = ${"SMOKETAP" + tag}`);
    await db.execute(sql`DELETE FROM admin_notifications WHERE message LIKE ${"%SMOKE%" + tag + "%"}`);
    await db.execute(sql`UPDATE product_variants SET stock_quantity = ${S} WHERE id = ${v.id}`);
    await db.execute(sql`DELETE FROM stock_audit WHERE variant_id = ${v.id} AND changed_at > NOW() - INTERVAL '10 minutes'`);
    try { const m = await import("../squarePosSync"); await m.pushStockToSquare([v.id]); } catch { /* sync will fix it within 5 minutes */ }
    console.log(`Cleaned up. Stock restored to ${await stockOf(v.id)}.`);
  }

  console.log("\n" + results.join("\n"));
  console.log(failed ? "\nRESULT: FAIL - stock is NOT being handled correctly in at least one path" : "\nRESULT: ALL PASS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("SMOKE TEST ERROR:", e?.message || e); process.exit(2); });
