/**
 * Sale campaign test:   npx tsx server/tools/saleCampaignTest.ts
 * Puts ONE product on a 10% test sale for a moment, checks the price is set and then restored by the scheduler logic,
 * and that no other product was touched. Everything it creates is removed.
 */
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { createCampaign, runSaleTick, previewCampaign } from "../saleCampaign";

let failed = false;
const out: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { out.push(`${ok ? "PASS" : "FAIL"}  ${name} ${detail}`); if (!ok) failed = true; };

(async () => {
  const prods = (await db.execute(sql`SELECT id, trim(name) AS name, retail_price, sale_price FROM products WHERE is_active ORDER BY name`)).rows as any[];
  const p = prods.find((x) => x.sale_price === null && Number(x.retail_price) >= 20) || prods[0];
  const overrides: Record<string, any> = {};
  for (const x of prods) overrides[x.name] = x.id === p.id ? 10 : "exclude";
  const before = Number(((await db.execute(sql`SELECT count(*) n FROM products WHERE sale_price IS NOT NULL`)).rows[0] as any).n);

  const start = new Date(Date.now() - 60000).toISOString(), end = new Date(Date.now() + 3600000).toISOString();
  const { id, unmatched } = await createCampaign({ name: "TEST sale", startsAt: start, endsAt: end, basePct: 20, overrides });
  check("every product name matched", unmatched.length === 0, JSON.stringify(unmatched));
  const prev: any = await previewCampaign(id);
  const row = prev.items.find((i: any) => i.productId === p.id);
  const expected = (Math.round(Number(p.retail_price) * 0.9 * 100) / 100).toFixed(2);
  check("preview shows the 10% price", row && row.salePrice.toFixed(2) === expected, `(${p.name} ${p.retail_price} -> ${expected})`);

  await runSaleTick();
  let st: any = (await db.execute(sql`SELECT status FROM sale_campaigns WHERE id = ${id}`)).rows[0];
  check("a draft does not start by itself", st.status === "draft" && Number(((await db.execute(sql`SELECT count(*) n FROM products WHERE sale_price IS NOT NULL`)).rows[0] as any).n) === before);

  await db.execute(sql`UPDATE sale_campaigns SET status = 'armed' WHERE id = ${id}`);
  await runSaleTick();
  const now: any = (await db.execute(sql`SELECT sale_price FROM products WHERE id = ${p.id}`)).rows[0];
  check("sale price set on the product at start", Number(now.sale_price).toFixed(2) === expected, `(${now.sale_price})`);
  const after = Number(((await db.execute(sql`SELECT count(*) n FROM products WHERE sale_price IS NOT NULL`)).rows[0] as any).n);
  check("no other product was touched", after === before + 1, `(${before} -> ${after})`);
  st = (await db.execute(sql`SELECT status FROM sale_campaigns WHERE id = ${id}`)).rows[0];
  check("campaign is active", st.status === "active");

  await db.execute(sql`UPDATE sale_campaigns SET ends_at = NOW() - INTERVAL '1 minute' WHERE id = ${id}`);
  await runSaleTick();
  const restored: any = (await db.execute(sql`SELECT sale_price FROM products WHERE id = ${p.id}`)).rows[0];
  check("old price restored at the end", restored.sale_price === null || restored.sale_price === p.sale_price, `(${restored.sale_price})`);
  st = (await db.execute(sql`SELECT status FROM sale_campaigns WHERE id = ${id}`)).rows[0];
  check("campaign ended", st.status === "ended");

  // an armed campaign whose end has already passed must never start
  const c2 = await createCampaign({ name: "TEST stale", startsAt: new Date(Date.now() - 7200000).toISOString(), endsAt: new Date(Date.now() - 3600000).toISOString(), basePct: 20, overrides });
  await db.execute(sql`UPDATE sale_campaigns SET status = 'armed' WHERE id = ${c2.id}`);
  await runSaleTick();
  const st2: any = (await db.execute(sql`SELECT status FROM sale_campaigns WHERE id = ${c2.id}`)).rows[0];
  const still = Number(((await db.execute(sql`SELECT count(*) n FROM products WHERE sale_price IS NOT NULL`)).rows[0] as any).n);
  check("an already-finished armed campaign never starts", st2.status === "ended" && still === before);

  await db.execute(sql`DELETE FROM sale_campaign_items WHERE campaign_id IN (${id}, ${c2.id})`);
  await db.execute(sql`DELETE FROM sale_campaigns WHERE id IN (${id}, ${c2.id})`);
  await db.execute(sql`DELETE FROM admin_notifications WHERE type = 'sale_campaign' AND title LIKE 'TEST %'`);
  console.log(out.join("\n"));
  console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: ALL PASS");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("TEST ERROR:", e?.message || e); process.exit(2); });
