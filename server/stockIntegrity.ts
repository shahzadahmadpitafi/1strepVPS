/**
 * Safeguards so stock numbers can't silently drift again.
 *
 * 1. adjustStockForStatusChange: cancelling a website/admin/exchange order puts its items back into stock
 *    (once); un-cancelling it takes them off again. (The Cancel button used to leave stock deducted.)
 *
 * 2. startStockIntegrityMonitor: every 15 minutes, looks at orders that SHOULD have reduced main stock (website,
 *    admin, exchange, shop Tap to Pay, and any till flagged "sells from main stock") and checks the stock history log
 *    for a matching reduction around the time of the order. If an order has none, an admin notification says exactly
 *    which order and items to check - so a gap like the HQ till one is caught within minutes, not weeks.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const DEDUCTING = ["website", "admin", "exchange"];

export async function ensureStockIntegrityTables(): Promise<void> {
  await db.execute(sql`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS stock_restored_at TIMESTAMPTZ`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS stock_integrity_state (id INTEGER PRIMARY KEY DEFAULT 1, started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_run_at TIMESTAMPTZ, last_summary TEXT)`);
  await db.execute(sql`INSERT INTO stock_integrity_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS stock_integrity_checked (order_id VARCHAR PRIMARY KEY, result TEXT NOT NULL, detail TEXT, checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}

/** Cancel gives stock back (once); un-cancel takes it off again. Returns the variant ids it changed. */
export async function adjustStockForStatusChange(orderId: string, previousStatus: string | null | undefined, newStatus: string | null | undefined): Promise<string[]> {
  if (!newStatus || newStatus === previousStatus) return [];
  const order = (await db.execute(sql`SELECT channel, stock_restored_at FROM customer_orders WHERE id = ${orderId}`)).rows[0] as any;
  if (!order) return [];
  const channel = order.channel || "website";
  if (!DEDUCTING.includes(channel)) return [];

  let sign = 0;
  if (newStatus === "cancelled" && previousStatus !== "cancelled" && !order.stock_restored_at) sign = 1;
  else if (previousStatus === "cancelled" && newStatus !== "cancelled" && order.stock_restored_at) sign = -1;
  if (sign === 0) return [];

  const items = (await db.execute(sql`SELECT product_id, size, color, quantity FROM customer_order_items WHERE order_id = ${orderId} AND product_id IS NOT NULL`)).rows as any[];
  const touched: string[] = [];
  for (const it of items) {
    const q = Number(it.quantity) || 1;
    const r = await db.execute(sql`
      UPDATE product_variants SET stock_quantity = GREATEST(stock_quantity + ${sign * q}, 0), updated_at = NOW()
       WHERE product_id = ${it.product_id} AND size IS NOT DISTINCT FROM ${it.size} AND color IS NOT DISTINCT FROM ${it.color}
       RETURNING id`);
    for (const row of r.rows as any[]) touched.push(row.id);
  }
  await db.execute(sql`UPDATE customer_orders SET stock_restored_at = ${sign === 1 ? sql`NOW()` : sql`NULL`} WHERE id = ${orderId}`);
  console.log(`📦 Order ${orderId} ${newStatus}: stock ${sign === 1 ? "returned" : "taken off again"} (${items.length} line(s))`);
  const ids = Array.from(new Set(touched));
  if (ids.length) import("./squarePosSync").then((m) => m.pushStockToSquare(ids)).catch(() => {});
  return ids;
}

export async function runStockIntegrityCheck(): Promise<{ checked: number; flagged: number }> {
  const orders = (await db.execute(sql`
    SELECT o.id, o.order_number, o.order_date
      FROM customer_orders o, stock_integrity_state s
     WHERE o.order_date > s.started_at
       AND o.order_date < NOW() - INTERVAL '15 minutes'
       AND o.order_date > NOW() - INTERVAL '48 hours'
       AND o.status NOT IN ('cancelled', 'refunded')
       AND (COALESCE(o.channel, 'website') IN ('website', 'admin', 'exchange', 'shop_square_pos')
            OR o.reseller_id IN (SELECT id FROM resellers WHERE epos_uses_main_stock))
       AND NOT EXISTS (SELECT 1 FROM stock_integrity_checked c WHERE c.order_id = o.id)
     LIMIT 200`)).rows as any[];

  let flagged = 0;
  for (const o of orders) {
    const missing = (await db.execute(sql`
      SELECT trim(p.name) AS product, i.size, i.color, i.quantity
        FROM customer_order_items i
        JOIN product_variants v ON v.product_id = i.product_id AND v.size IS NOT DISTINCT FROM i.size AND v.color IS NOT DISTINCT FROM i.color
        JOIN products p ON p.id = v.product_id
       WHERE i.order_id = ${o.id} AND i.product_id IS NOT NULL
         AND v.stock_quantity > 0
         AND NOT EXISTS (
           SELECT 1 FROM stock_audit a
            WHERE a.variant_id = v.id AND a.delta < 0
              AND a.changed_at BETWEEN ${o.order_date}::timestamptz - INTERVAL '10 minutes' AND ${o.order_date}::timestamptz + INTERVAL '30 minutes')`)).rows as any[];
    if (missing.length === 0) {
      await db.execute(sql`INSERT INTO stock_integrity_checked (order_id, result) VALUES (${o.id}, 'ok') ON CONFLICT DO NOTHING`);
      continue;
    }
    flagged++;
    const detail = missing.map((m) => `${m.quantity} x ${m.product} ${m.size || ""}/${m.color || ""}`.replace(/\s+/g, " ").trim()).join("; ");
    await db.execute(sql`INSERT INTO stock_integrity_checked (order_id, result, detail) VALUES (${o.id}, 'flagged', ${detail}) ON CONFLICT DO NOTHING`);
    try {
      await db.execute(sql`INSERT INTO admin_notifications (type, title, message, link, is_read)
        VALUES ('stock_alert', 'Stock may not have been taken off for an order', ${`Order ${o.order_number}: no stock reduction found for ${detail}. Check the shelf count and adjust Inventory if needed.`}, '/admin/inventory', false)`);
    } catch (err) {
      console.error("[StockIntegrity] notification failed:", err);
    }
    console.warn(`[StockIntegrity] order ${o.order_number}: no stock reduction found for ${detail}`);
  }
  await db.execute(sql`UPDATE stock_integrity_state SET last_run_at = NOW(), last_summary = ${`checked ${orders.length}, flagged ${flagged}`} WHERE id = 1`);
  return { checked: orders.length, flagged };
}

export function startStockIntegrityMonitor(intervalMs = 15 * 60 * 1000) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await ensureStockIntegrityTables();
      const r = await runStockIntegrityCheck();
      if (r.checked) console.log(`[StockIntegrity] checked ${r.checked} order(s), flagged ${r.flagged}`);
    } catch (err: any) {
      console.error("[StockIntegrity] check failed:", err?.message || err);
    } finally {
      running = false;
    }
  };
  setTimeout(tick, 2 * 60 * 1000);
  setInterval(tick, intervalMs);
  console.log("🔎 Stock integrity monitor started (every 15 minutes)");
}
