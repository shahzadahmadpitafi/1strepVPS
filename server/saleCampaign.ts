/**
 * Website sale campaigns (e.g. Black Friday): a base % off everything plus a different % (or "excluded") per product.
 *
 * It only ever writes products.sale_price, which the website shop, product pages and website checkout already honour
 * (shown as the old price crossed out; charged automatically, no discount code). Tills / EPOS do not read it, and
 * reseller storefront orders ignore it. At the start time each product's previous sale price is saved and the sale
 * price is set; at the end time the saved value is put back. A server restart does not matter: the check runs every
 * minute and is safe to repeat.
 *
 * Status: draft -> armed (will start by itself) -> active -> ended   (or cancelled)
 */
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function ensureSaleTables() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS sale_campaigns (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
    base_pct NUMERIC(5,2) NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_by VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), armed_at TIMESTAMPTZ, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS sale_campaign_items (
    id SERIAL PRIMARY KEY, campaign_id INTEGER NOT NULL, product_id VARCHAR NOT NULL, pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    excluded BOOLEAN NOT NULL DEFAULT FALSE, original_sale_price TEXT, applied_price TEXT, applied BOOLEAN NOT NULL DEFAULT FALSE)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS sale_campaign_items_uq ON sale_campaign_items (campaign_id, product_id)`);
}

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

/** Create a DRAFT campaign. overrides: product name or id -> percent, or "exclude". Unmatched names are returned. */
export async function createCampaign(p: { name: string; startsAt: string; endsAt: string; basePct: number; overrides?: Record<string, number | "exclude">; createdBy?: string }) {
  const start = new Date(p.startsAt), end = new Date(p.endsAt);
  if (isNaN(+start) || isNaN(+end) || end <= start) throw new Error("Start and end times are not valid");
  if (!(p.basePct >= 0 && p.basePct <= 90)) throw new Error("Base percent must be between 0 and 90");
  const c: any = (await db.execute(sql`INSERT INTO sale_campaigns (name, starts_at, ends_at, base_pct, created_by) VALUES (${p.name}, ${start.toISOString()}, ${end.toISOString()}, ${p.basePct}, ${p.createdBy || null}) RETURNING *`)).rows[0];
  const prods = (await db.execute(sql`SELECT id, trim(name) AS name FROM products WHERE is_active`)).rows as any[];
  const ov = new Map<string, number | "exclude">(Object.entries(p.overrides || {}).map(([k, v]) => [k.trim().toLowerCase(), v]));
  const used = new Set<string>();
  for (const pr of prods) {
    const key = pr.name.toLowerCase();
    const hit = ov.has(key) ? key : ov.has(String(pr.id).toLowerCase()) ? String(pr.id).toLowerCase() : null;
    if (hit) used.add(hit);
    const v = hit ? ov.get(hit)! : p.basePct;
    const excluded = v === "exclude";
    await db.execute(sql`INSERT INTO sale_campaign_items (campaign_id, product_id, pct, excluded) VALUES (${c.id}, ${pr.id}, ${excluded ? 0 : Number(v)}, ${excluded})`);
  }
  return { id: c.id as number, unmatched: Array.from(ov.keys()).filter((k) => !used.has(k)) };
}

export async function setItem(campaignId: number, productId: string, pct: number | "exclude") {
  const c: any = (await db.execute(sql`SELECT status FROM sale_campaigns WHERE id = ${campaignId}`)).rows[0];
  if (!c) throw new Error("Campaign not found");
  if (c.status === "active" || c.status === "ended") throw new Error("Cannot change a campaign that has started");
  const excluded = pct === "exclude";
  await db.execute(sql`UPDATE sale_campaign_items SET pct = ${excluded ? 0 : Number(pct)}, excluded = ${excluded} WHERE campaign_id = ${campaignId} AND product_id = ${productId}`);
}

export async function previewCampaign(id: number) {
  const camp: any = (await db.execute(sql`SELECT * FROM sale_campaigns WHERE id = ${id}`)).rows[0];
  if (!camp) return null;
  const items = (await db.execute(sql`
    SELECT i.product_id, trim(p.name) AS product, p.retail_price::numeric AS retail, p.cost_price::numeric AS cost, i.pct::numeric AS pct, i.excluded, i.applied, i.original_sale_price
      FROM sale_campaign_items i JOIN products p ON p.id = i.product_id WHERE i.campaign_id = ${id} ORDER BY trim(p.name)`)).rows as any[];
  const rows = items.map((r) => {
    const retail = Number(r.retail), cost = Number(r.cost), pct = Number(r.pct);
    const price = r.excluded ? retail : Number(money(retail * (1 - pct / 100)));
    return { productId: r.product_id, product: r.product, retail, cost, pct: r.excluded ? null : pct, excluded: r.excluded, salePrice: r.excluded ? null : price,
      profitBeforePostage: cost > 0 ? Number(money(price - cost)) : null, belowCost: !r.excluded && cost > 0 && price < cost, applied: r.applied };
  });
  return { campaign: camp, items: rows };
}

export async function applyCampaign(id: number) {
  const camp: any = (await db.execute(sql`SELECT * FROM sale_campaigns WHERE id = ${id}`)).rows[0];
  if (!camp || !["armed", "active"].includes(camp.status)) return 0;
  const items = (await db.execute(sql`
    SELECT i.id, i.product_id, i.pct::numeric AS pct, p.retail_price::numeric AS retail, p.sale_price
      FROM sale_campaign_items i JOIN products p ON p.id = i.product_id WHERE i.campaign_id = ${id} AND NOT i.excluded AND NOT i.applied AND i.pct > 0`)).rows as any[];
  for (const r of items) {
    const price = money(Number(r.retail) * (1 - Number(r.pct) / 100));
    await db.execute(sql`UPDATE sale_campaign_items SET original_sale_price = ${r.sale_price}, applied_price = ${price}, applied = TRUE WHERE id = ${r.id}`);
    await db.execute(sql`UPDATE products SET sale_price = ${price} WHERE id = ${r.product_id}`);
  }
  await db.execute(sql`UPDATE sale_campaigns SET status = 'active', started_at = COALESCE(started_at, NOW()) WHERE id = ${id}`);
  await db.execute(sql`INSERT INTO admin_notifications (type, title, message, link, is_read) VALUES ('system', ${camp.name + " has started"}, ${`${items.length} product(s) are now on sale on the website until ${new Date(camp.ends_at).toISOString()}.`}, '/admin/products', false)`).catch(() => {});
  console.log(`[Sale] "${camp.name}" started: ${items.length} product(s) on sale`);
  return items.length;
}

export async function revertCampaign(id: number, newStatus: "ended" | "cancelled" = "ended") {
  const camp: any = (await db.execute(sql`SELECT * FROM sale_campaigns WHERE id = ${id}`)).rows[0];
  if (!camp) return 0;
  const items = (await db.execute(sql`
    SELECT i.id, i.product_id, i.original_sale_price, i.applied_price, p.sale_price AS current_sale, p.retail_price::numeric AS retail
      FROM sale_campaign_items i JOIN products p ON p.id = i.product_id WHERE i.campaign_id = ${id} AND i.applied`)).rows as any[];
  for (const r of items) {
    // only put the old value back if nobody changed the sale price by hand in the meantime
    if (r.current_sale === r.applied_price) {
      const orig = r.original_sale_price;
      const keep = orig !== null && orig !== undefined && Number(orig) > 0 && Number(orig) < Number(r.retail) ? orig : null;
      await db.execute(sql`UPDATE products SET sale_price = ${keep} WHERE id = ${r.product_id}`);
    }
    await db.execute(sql`UPDATE sale_campaign_items SET applied = FALSE WHERE id = ${r.id}`);
  }
  await db.execute(sql`UPDATE sale_campaigns SET status = ${newStatus}, ended_at = NOW() WHERE id = ${id}`);
  await db.execute(sql`INSERT INTO admin_notifications (type, title, message, link, is_read) VALUES ('system', ${camp.name + (newStatus === "ended" ? " has ended" : " was cancelled")}, ${`${items.length} product(s) are back to their normal prices.`}, '/admin/products', false)`).catch(() => {});
  console.log(`[Sale] "${camp.name}" ${newStatus}: ${items.length} product(s) back to normal`);
  return items.length;
}

export async function runSaleTick() {
  const due = (await db.execute(sql`SELECT id, status FROM sale_campaigns WHERE (status = 'armed' AND starts_at <= NOW()) OR (status = 'active' AND ends_at <= NOW())`)).rows as any[];
  for (const c of due) {
    if (c.status === "armed") {
      // a campaign whose end already passed is never started
      const stale: any = (await db.execute(sql`SELECT 1 FROM sale_campaigns WHERE id = ${c.id} AND ends_at <= NOW()`)).rows[0];
      if (stale) { await db.execute(sql`UPDATE sale_campaigns SET status = 'ended', ended_at = NOW() WHERE id = ${c.id}`); continue; }
      await applyCampaign(c.id);
    } else await revertCampaign(c.id, "ended");
  }
}

export function startSaleScheduler() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await runSaleTick(); } catch (e: any) { console.error("[Sale] tick failed:", e?.message || e); } finally { running = false; }
  };
  setTimeout(tick, 15 * 1000);
  setInterval(tick, 60 * 1000);
  console.log("🏷️  Sale scheduler started (checks every minute)");
}

export function registerSaleCampaignRoutes(app: Express, auth: RequestHandler, admin: RequestHandler) {
  app.get("/api/admin/sale-campaigns", auth, admin, async (_req, res) => {
    const rows = (await db.execute(sql`SELECT * FROM sale_campaigns ORDER BY id DESC LIMIT 20`)).rows;
    res.json(rows);
  });
  app.get("/api/admin/sale-campaigns/:id", auth, admin, async (req, res) => {
    const p = await previewCampaign(parseInt(req.params.id));
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  });
  app.post("/api/admin/sale-campaigns", auth, admin, async (req, res) => {
    try {
      const b = req.body || {};
      const r = await createCampaign({ name: String(b.name || "Sale"), startsAt: b.startsAt, endsAt: b.endsAt, basePct: Number(b.basePct), overrides: b.overrides, createdBy: req.user!.id });
      res.json(r);
    } catch (e: any) { res.status(400).json({ error: e?.message || "Could not create" }); }
  });
  app.patch("/api/admin/sale-campaigns/:id/items/:productId", auth, admin, async (req, res) => {
    try {
      const v = req.body?.exclude ? "exclude" : Number(req.body?.pct);
      if (v !== "exclude" && !(v >= 0 && v <= 90)) return res.status(400).json({ error: "Percent must be 0-90" });
      await setItem(parseInt(req.params.id), req.params.productId, v as any);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e?.message || "Could not change" }); }
  });
  app.post("/api/admin/sale-campaigns/:id/arm", auth, admin, async (req, res) => {
    const id = parseInt(req.params.id);
    const r: any = await db.execute(sql`UPDATE sale_campaigns SET status = 'armed', armed_at = NOW() WHERE id = ${id} AND status = 'draft' AND ends_at > NOW()`);
    if (!r.rowCount) return res.status(409).json({ error: "Only a draft that has not already ended can be armed" });
    await runSaleTick().catch(() => {});
    res.json({ success: true });
  });
  app.post("/api/admin/sale-campaigns/:id/cancel", auth, admin, async (req, res) => {
    const id = parseInt(req.params.id);
    const c: any = (await db.execute(sql`SELECT status FROM sale_campaigns WHERE id = ${id}`)).rows[0];
    if (!c) return res.status(404).json({ error: "Not found" });
    if (c.status === "active") await revertCampaign(id, "cancelled");
    else if (["draft", "armed"].includes(c.status)) await db.execute(sql`UPDATE sale_campaigns SET status = 'cancelled', ended_at = NOW() WHERE id = ${id}`);
    res.json({ success: true });
  });
}
