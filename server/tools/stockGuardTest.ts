/**
 * Stock lock test - run after any deploy:   npx tsx server/tools/stockGuardTest.ts
 * Pretends to be a normal admin (not a stock editor) and the owner, calls the guard directly, and checks:
 *   - a stock-take edit / bulk import / delete is refused (403) and raises a notification
 *   - receiving a delivery (positive add) is allowed, a negative one is refused
 *   - a variant save with an unchanged stock number still saves the other fields
 *   - product saves lose their stock fields (warehouseStock etc.) but still go through
 *   - the owner is allowed and the edit is written down
 * Everything it writes is removed again.
 */
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { stockEditGuard, stockEditors } from "../stockGuard";

const OWNER = stockEditors()[0];
let failed = false;
const out: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { out.push(`${ok ? "PASS" : "FAIL"}  ${name} ${detail}`); if (!ok) failed = true; };

async function run(mode: any, userId: string, body: any, params: any = {}) {
  let status = 200; let nexted = false;
  const req: any = { user: { id: userId, email: "x", role: "admin" }, body, params, method: "POST", originalUrl: "/api/test-stock-guard" };
  const res: any = { status(c: number) { status = c; return this; }, json() { return this; } };
  await stockEditGuard(mode)(req, res, () => { nexted = true; });
  return { status, nexted, body: req.body };
}

(async () => {
  const other: any = (await db.execute(sql`SELECT id FROM users WHERE role = 'admin' AND id <> ${OWNER} LIMIT 1`)).rows[0];
  const v: any = (await db.execute(sql`SELECT id, stock_quantity FROM product_variants WHERE stock_quantity > 0 LIMIT 1`)).rows[0];
  if (!other || !v) { console.error("Need a second admin account and one variant to test"); process.exit(2); }
  const notifBefore = Number(((await db.execute(sql`SELECT count(*) n FROM admin_notifications WHERE type='stock_alert'`)).rows[0] as any).n);

  let r = await run("block", other.id, {});
  check("other admin: bulk change refused", r.status === 403 && !r.nexted);
  r = await run("variantEdit", other.id, { stockQuantity: Number(v.stock_quantity) + 5, retailPrice: "9" }, { id: v.id });
  check("other admin: changing a stock number refused", r.status === 403 && !r.nexted);
  r = await run("variantEdit", other.id, { stockQuantity: Number(v.stock_quantity), barcodeDescriptor: "x" }, { id: v.id });
  check("other admin: unchanged stock + other fields still saves", r.nexted && r.body.stockQuantity === undefined && r.body.barcodeDescriptor === "x");
  r = await run("receive", other.id, { variantId: v.id, quantity: 4 });
  check("other admin: receiving a delivery (+4) allowed", r.nexted);
  r = await run("receive", other.id, { variantId: v.id, quantity: -4 });
  check("other admin: removing stock via Add Stock refused", r.status === 403 && !r.nexted);
  r = await run("strip", other.id, { name: "T", warehouseStock: { a: { quantity: 99 } }, variants: [{ size: "S", stockQuantity: 50 }] });
  check("other admin: product save loses stock fields but goes through", r.nexted && r.body.warehouseStock === undefined && r.body.variants[0].stockQuantity === undefined && r.body.name === "T");
  r = await run("block", OWNER, {});
  check("owner: allowed", r.nexted);

  const rows = Number(((await db.execute(sql`SELECT count(*) n FROM stock_manual_edits WHERE route = '/api/test-stock-guard'`)).rows[0] as any).n);
  const notifAfter = Number(((await db.execute(sql`SELECT count(*) n FROM admin_notifications WHERE type='stock_alert'`)).rows[0] as any).n);
  check("every attempt written down", rows >= 7, `(${rows} rows)`);
  check("refusals raised notifications", notifAfter - notifBefore >= 4, `(+${notifAfter - notifBefore})`);

  await db.execute(sql`DELETE FROM stock_manual_edits WHERE route = '/api/test-stock-guard'`);
  await db.execute(sql`DELETE FROM admin_notifications WHERE type='stock_alert' AND title='Stock change blocked' AND message LIKE '%/api/test-stock-guard%'`);
  console.log(out.join("\n"));
  console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: ALL PASS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST ERROR:", e?.message || e); process.exit(2); });
