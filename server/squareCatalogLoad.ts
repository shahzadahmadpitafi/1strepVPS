/**
 * Load the portal's inventory into the Square item library (so the shop can sell it with Tap to Pay).
 *
 *   npx tsx server/squareCatalogLoad.ts                 -> DRY RUN: shows exactly what would be created, writes nothing
 *   npx tsx server/squareCatalogLoad.ts --apply         -> creates categories, items, variations (SKU + price) and stock counts in Square
 *   add --include-hidden to also load products switched off on the website (still excludes discontinued items)
 *
 * Safe to re-run: variations already in Square (matched by SKU, or by the saved Square id) are skipped.
 * The Square ids are saved in the portal (products.square_item_id / product_variants.square_variation_id)
 * so Tap to Pay sales can later be matched to the exact size/colour.
 */
import "dotenv/config";
import crypto from "crypto";
import { SquareClient, SquareEnvironment } from "square";
import { db } from "./db";
import { sql } from "drizzle-orm";

const APPLY = process.argv.includes("--apply");
const INCLUDE_HIDDEN = process.argv.includes("--include-hidden");

type Row = {
  product_id: string; product_name: string; category: string | null; product_sku: string | null;
  variant_id: string; size: string; color: string; sku: string | null; retail_price: string; stock: number;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

async function main() {
  if (APPLY) {
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS square_item_id TEXT`);
    await db.execute(sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS square_variation_id TEXT`);
  }

  const res = await db.execute(sql`
    SELECT p.id AS product_id, trim(p.name) AS product_name, p.category, p.sku AS product_sku,
           v.id AS variant_id, v.size, v.color, v.sku, v.retail_price::text, GREATEST(COALESCE(v.stock_quantity,0),0) AS stock
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
     WHERE v.is_active AND NOT p.is_deleted
       AND p.availability_status <> 'discontinued'
       AND v.retail_price > 0
       AND v.sku IS NOT NULL AND trim(v.sku) <> ''
       AND v.stock_quantity < 100000
       ${INCLUDE_HIDDEN ? sql`` : sql`AND p.is_active`}
     ORDER BY trim(p.name), v.color, v.size
  `);
  const rows = res.rows as unknown as Row[];

  // Item names must be unique at the till; add the product SKU if two included products share a name.
  const nameCount = new Map<string, number>();
  const products = new Map<string, Row[]>();
  for (const r of rows) {
    if (!products.has(r.product_id)) {
      products.set(r.product_id, []);
      nameCount.set(r.product_name, (nameCount.get(r.product_name) || 0) + 1);
    }
    products.get(r.product_id)!.push(r);
  }
  const itemName = (r: Row) => (nameCount.get(r.product_name)! > 1 ? `${r.product_name} (${r.product_sku})` : r.product_name);

  const categories = Array.from(new Set(rows.map((r) => r.category || "Other")));
  const units = rows.reduce((s, r) => s + Number(r.stock), 0);

  const excluded = await db.execute(sql`
    SELECT trim(p.name) AS name, p.availability_status AS status, p.is_active, count(*) AS variants,
           CASE WHEN p.availability_status = 'discontinued' THEN 'discontinued'
                WHEN NOT p.is_active AND ${INCLUDE_HIDDEN ? sql`false` : sql`true`} THEN 'hidden on website'
                WHEN bool_or(v.retail_price <= 0) THEN 'price is £0'
                WHEN bool_or(v.stock_quantity >= 100000) THEN 'placeholder stock level'
                ELSE 'other' END AS reason
      FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.is_active AND NOT p.is_deleted
       AND NOT (v.retail_price > 0 AND v.sku IS NOT NULL AND trim(v.sku) <> '' AND v.stock_quantity < 100000
                AND p.availability_status <> 'discontinued' ${INCLUDE_HIDDEN ? sql`` : sql`AND p.is_active`})
     GROUP BY 1, 2, 3 ORDER BY 1
  `);

  console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"}: ${products.size} items, ${rows.length} variations (size/colour), ${categories.length} categories, ${units} units of stock`);
  console.log(`Scope: ${INCLUDE_HIDDEN ? "all live products incl. hidden-on-website (not discontinued)" : "products live on the website"}`);
  console.log(`Left out (${excluded.rows.length} products):`);
  for (const e of excluded.rows as any[]) console.log(`  - ${e.name} [${e.status}, ${e.variants} variations]: ${e.reason}`);

  if (!APPLY) {
    const [first] = Array.from(products.values());
    console.log("\nSample item that would be created:");
    console.log(JSON.stringify({ item: itemName(first[0]), category: first[0].category, variations: first.slice(0, 3).map((r) => ({ name: `${r.size} / ${r.color}`, sku: r.sku, price: `£${Number(r.retail_price).toFixed(2)}`, stock: r.stock })) }, null, 2));
    console.log("\nNothing was written to Square. Re-run with --apply to create it.");
    process.exit(0);
  }

  const client = new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN, environment: SquareEnvironment.Production });
  const locationId = process.env.SQUARE_LOCATION_ID!;

  // Existing Square library (so a re-run never duplicates)
  const existingBySku = new Map<string, string>();
  const existingItemByName = new Map<string, string>();
  const existingCategoryByName = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const page: any = await client.catalog.list({ types: "ITEM,CATEGORY", cursor } as any);
    for (const o of page.data ?? []) {
      if (o.type === "CATEGORY") existingCategoryByName.set(o.categoryData?.name, o.id);
      if (o.type === "ITEM") {
        existingItemByName.set(o.itemData?.name, o.id);
        for (const v of o.itemData?.variations || []) if (v.itemVariationData?.sku) existingBySku.set(v.itemVariationData.sku, v.id);
      }
    }
    cursor = page.response?.cursor ?? page.cursor;
  } while (cursor);
  console.log(`Square already has ${existingItemByName.size} items / ${existingBySku.size} SKUs`);

  // 1) categories
  const categoryId = new Map<string, string>();
  const newCats = categories.filter((c) => !existingCategoryByName.has(c));
  for (const c of categories) if (existingCategoryByName.has(c)) categoryId.set(c, existingCategoryByName.get(c)!);
  if (newCats.length) {
    const r: any = await client.catalog.batchUpsert({
      idempotencyKey: crypto.randomUUID(),
      batches: [{ objects: newCats.map((c) => ({ type: "CATEGORY", id: `#cat-${slug(c)}`, presentAtAllLocations: true, categoryData: { name: c } })) }],
    } as any);
    for (const m of r.idMappings ?? r.data?.idMappings ?? []) {
      const name = newCats.find((c) => `#cat-${slug(c)}` === m.clientObjectId);
      if (name) categoryId.set(name, m.objectId);
    }
  }

  // 2) items + variations (new ones only)
  const variationIds = new Map<string, string>(); // portal variant id -> square variation id
  const itemIds = new Map<string, string>(); // portal product id -> square item id
  let createdItems = 0, createdVariations = 0, skipped = 0;
  const pending = Array.from(products.entries());
  for (const group of chunk(pending, 15)) {
    const objects: any[] = [];
    for (const [productId, vars] of group) {
      const fresh = vars.filter((v) => !existingBySku.has(v.sku!));
      for (const v of vars) if (existingBySku.has(v.sku!)) { variationIds.set(v.variant_id, existingBySku.get(v.sku!)!); skipped++; }
      if (fresh.length === 0) continue;
      const name = itemName(vars[0]);
      if (existingItemByName.has(name)) { itemIds.set(productId, existingItemByName.get(name)!); }
      const catId = categoryId.get(vars[0].category || "Other");
      objects.push({
        type: "ITEM",
        id: `#item-${productId}`,
        presentAtAllLocations: true,
        itemData: {
          name,
          productType: "REGULAR",
          ...(catId ? { categories: [{ id: catId }], reportingCategory: { id: catId } } : {}),
          variations: fresh.map((v, i) => ({
            type: "ITEM_VARIATION",
            id: `#var-${v.variant_id}`,
            presentAtAllLocations: true,
            itemVariationData: {
              itemId: `#item-${productId}`,
              name: `${v.size} / ${v.color}`,
              sku: v.sku,
              ordinal: i,
              pricingType: "FIXED_PRICING",
              priceMoney: { amount: BigInt(Math.round(Number(v.retail_price) * 100)), currency: "GBP" },
              trackInventory: true,
              sellable: true,
              stockable: true,
            },
          })),
        },
      });
    }
    if (!objects.length) continue;
    const r: any = await client.catalog.batchUpsert({ idempotencyKey: crypto.randomUUID(), batches: [{ objects }] } as any);
    for (const m of r.idMappings ?? r.data?.idMappings ?? []) {
      if (m.clientObjectId.startsWith("#item-")) { itemIds.set(m.clientObjectId.slice(6), m.objectId); createdItems++; }
      if (m.clientObjectId.startsWith("#var-")) { variationIds.set(m.clientObjectId.slice(5), m.objectId); createdVariations++; }
    }
    console.log(`  created ${createdItems} items / ${createdVariations} variations so far`);
  }

  // 3) save the Square ids in the portal
  for (const [pid, sid] of itemIds) await db.execute(sql`UPDATE products SET square_item_id = ${sid} WHERE id = ${pid}`);
  for (const [vid, sid] of variationIds) await db.execute(sql`UPDATE product_variants SET square_variation_id = ${sid} WHERE id = ${vid}`);

  // 4) stock counts (portal is the master)
  const counts = rows
    .filter((r) => variationIds.has(r.variant_id) && Number(r.stock) > 0)
    .map((r) => ({ type: "PHYSICAL_COUNT", physicalCount: { catalogObjectId: variationIds.get(r.variant_id), state: "IN_STOCK", locationId, quantity: String(r.stock), occurredAt: new Date().toISOString() } }));
  let stockSet = 0;
  for (const part of chunk(counts, 100)) {
    await client.inventory.batchCreateChanges({ idempotencyKey: crypto.randomUUID(), changes: part } as any);
    stockSet += part.length;
  }

  console.log(`\nDONE. Items created: ${createdItems}, variations created: ${createdVariations}, already in Square (skipped): ${skipped}, stock counts set: ${stockSet}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("FAILED:", e?.message || e, e?.errors ? JSON.stringify(e.errors) : "");
  process.exit(1);
});
