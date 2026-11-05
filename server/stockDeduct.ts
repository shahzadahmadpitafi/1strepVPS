/**
 * Main-stock helpers.
 *
 *  - deductMainStock: take sold items off the MAIN stock (product_variants) - used by tills that sell from the
 *    shop's own stock (1st Rep HQ). Floors at 0 and returns the variant ids it changed so Square can be updated.
 *  - ensureStockAudit: a database-level log of EVERY change to a variant's stock number (old -> new, when), whichever
 *    part of the system or person made it. When a spot check disagrees with the system, this shows exactly what moved.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

export interface StockItem {
  productId?: string | null;
  size?: string | null;
  color?: string | null;
  quantity: number;
}

export async function deductMainStock(items: StockItem[]): Promise<string[]> {
  const touched: string[] = [];
  for (const it of items) {
    if (!it.productId) continue;
    const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
    const res = await db.execute(sql`
      UPDATE product_variants SET stock_quantity = GREATEST(stock_quantity - ${qty}, 0), updated_at = NOW()
       WHERE product_id = ${it.productId}
         AND size IS NOT DISTINCT FROM ${it.size ?? null}
         AND color IS NOT DISTINCT FROM ${it.color ?? null}
       RETURNING id`);
    for (const r of res.rows as any[]) touched.push(r.id);
  }
  return Array.from(new Set(touched));
}

export async function ensureStockAudit(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS stock_audit (
    id BIGSERIAL PRIMARY KEY,
    variant_id VARCHAR NOT NULL,
    old_qty INTEGER,
    new_qty INTEGER,
    delta INTEGER,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    app_name TEXT
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS stock_audit_variant_idx ON stock_audit (variant_id, changed_at DESC)`);
  await db.execute(sql`CREATE OR REPLACE FUNCTION log_variant_stock_change() RETURNS trigger AS $fn$
    BEGIN
      IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity THEN
        INSERT INTO stock_audit (variant_id, old_qty, new_qty, delta, app_name)
        VALUES (NEW.id, OLD.stock_quantity, NEW.stock_quantity, NEW.stock_quantity - OLD.stock_quantity, current_setting('application_name', true));
      END IF;
      RETURN NEW;
    END
  $fn$ LANGUAGE plpgsql`);
  await db.execute(sql`DROP TRIGGER IF EXISTS trg_variant_stock_audit ON product_variants`);
  await db.execute(sql`CREATE TRIGGER trg_variant_stock_audit AFTER UPDATE OF stock_quantity ON product_variants
    FOR EACH ROW EXECUTE FUNCTION log_variant_stock_change()`);
}
