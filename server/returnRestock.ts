/**
 * Put returned items back into stock.
 *
 * Called when an admin marks a return as "received" or "refunded" (the first of the two).
 * Each returned line is matched to the exact size/colour variant from the original order, and
 * that variant's stock goes up by the returned quantity. Anything that can't be matched with
 * certainty is NOT guessed: it is reported back so it can be restocked by hand.
 */
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { customerOrderItems, productVariants } from "@shared/schema";

export interface RestockResult {
  restocked: Array<{ name: string; size: string | null; color: string | null; quantity: number }>;
  skipped: Array<{ name: string; quantity: number; reason: string }>;
}

/** Adds the "stock handled" marker to return_requests. Existing finished returns are left alone. */
export async function ensureReturnStockColumn(): Promise<void> {
  const exists = await db.execute(sql`
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'return_requests' AND column_name = 'stock_handled_at'
  `);
  if (exists.rows.length > 0) return;
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS stock_handled_at TIMESTAMP`);
  // Returns already received/refunded before this feature existed were handled by hand: don't touch them.
  await db.execute(sql`
    UPDATE return_requests SET stock_handled_at = NOW()
     WHERE stock_handled_at IS NULL AND status IN ('received', 'refunded', 'completed')
  `);
}

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

export async function restockReturnedItems(orderId: string, itemsToReturnJson: string): Promise<RestockResult> {
  const result: RestockResult = { restocked: [], skipped: [] };

  let items: any[] = [];
  try {
    items = JSON.parse(itemsToReturnJson);
  } catch {
    return result;
  }
  if (!Array.isArray(items)) return result;

  const orderItems = await db.select().from(customerOrderItems).where(eq(customerOrderItems.orderId, orderId));

  for (const item of items) {
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    const name = String(item?.name ?? "").trim();

    let candidates = orderItems.filter((oi) => oi.productId && norm(oi.productName) === norm(name));
    if (item?.size) candidates = candidates.filter((oi) => norm(oi.size) === norm(item.size));
    if (item?.color) candidates = candidates.filter((oi) => norm(oi.color) === norm(item.color));

    // One distinct size/colour = certain. Several = the customer bought the same product in different sizes.
    const distinct = new Map(candidates.map((oi) => [`${oi.productId}|${norm(oi.size)}|${norm(oi.color)}`, oi]));
    if (distinct.size === 0) {
      result.skipped.push({ name, quantity, reason: "not found on the original order (or a vendor product)" });
      continue;
    }
    if (distinct.size > 1) {
      result.skipped.push({ name, quantity, reason: "bought in more than one size/colour, so the size returned is unclear" });
      continue;
    }

    const oi = Array.from(distinct.values())[0];
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, oi.productId as string),
          sql`${productVariants.size} IS NOT DISTINCT FROM ${oi.size}`,
          sql`${productVariants.color} IS NOT DISTINCT FROM ${oi.color}`,
        ),
      );
    if (!variant) {
      result.skipped.push({ name, quantity, reason: `no ${oi.size ?? ""} ${oi.color ?? ""} variant exists any more`.replace(/\s+/g, " ") });
      continue;
    }

    await db
      .update(productVariants)
      .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${quantity}`, updatedAt: new Date() })
      .where(eq(productVariants.id, variant.id));
    result.restocked.push({ name, size: oi.size ?? null, color: oi.color ?? null, quantity });
    console.log(`↩️  Return restock: ${name} (${oi.size}, ${oi.color}) +${quantity}`);
  }

  return result;
}
