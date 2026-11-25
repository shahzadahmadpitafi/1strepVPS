/**
 * Stock lock: only the people listed as stock editors can change a stock NUMBER by hand.
 *
 *  - Everyone else (other admin accounts) can still do their normal work: sales, returns, product text/prices,
 *    and RECEIVING a delivery (a positive "add stock" is allowed and is logged with their name).
 *  - Anything that sets, lowers or deletes stock (stock-take edits, bulk imports/adjustments, transfers, deleting a
 *    variant, the warehouse totals that overwrite variant stock) is refused with a clear message, and every refused
 *    attempt raises an admin notification with the person's name.
 *  - A watcher flags any stock DECREASE that has no matching sale, return, cancellation or recorded editor action
 *    (so a change made behind the app's back, e.g. straight in the database, still shows up).
 *
 * Who may edit: env STOCK_EDITOR_USER_IDS (comma separated user ids). Default: Dennis's admin account only.
 * Alerts: an admin-bell notification (every admin sees it) AND an email to STOCK_ALERT_EMAILS (comma separated),
 * default = the email of each stock editor account.
 */
import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Dennis's admin account. Change with the STOCK_EDITOR_USER_IDS environment variable (comma separated user ids).
const DEFAULT_EDITORS = ["6260f553-2058-412b-8144-0f4b31c42cf9"];

export function stockEditors(): string[] {
  const v = (process.env.STOCK_EDITOR_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return v.length ? v : DEFAULT_EDITORS;
}

export async function ensureStockGuardTables() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS stock_manual_edits (
    id SERIAL PRIMARY KEY, user_id VARCHAR, user_label TEXT, method TEXT, route TEXT, allowed BOOLEAN NOT NULL, detail TEXT,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS stock_manual_edits_at_idx ON stock_manual_edits (at DESC)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS stock_watch_state (id INTEGER PRIMARY KEY DEFAULT 1, last_audit_id BIGINT NOT NULL DEFAULT 0, last_run_at TIMESTAMPTZ, last_summary TEXT)`);
  await db.execute(sql`INSERT INTO stock_watch_state (id, last_audit_id) SELECT 1, COALESCE(MAX(id), 0) FROM stock_audit ON CONFLICT (id) DO NOTHING`);
}

/** Admin bell notification + email to the stock editors (or STOCK_ALERT_EMAILS). Never throws. */
export async function alertAdmins(title: string, message: string) {
  try {
    await db.execute(sql`INSERT INTO admin_notifications (type, title, message, link, is_read) VALUES ('stock_alert', ${title}, ${message.slice(0, 480)}, '/admin/inventory', false)`);
  } catch (e) { console.error("[StockGuard] bell notification failed:", e); }
  if (process.env.STOCK_ALERT_EMAIL_DISABLED) return; // used by the test script
  try {
    let to = (process.env.STOCK_ALERT_EMAILS || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (!to.length) {
      const r = (await db.execute(sql`SELECT email FROM users WHERE id = ANY(${"{" + stockEditors().join(",") + "}"}::text[]) AND email IS NOT NULL`)).rows as any[];
      to = r.map((x) => x.email);
    }
    if (!to.length) return;
    const { sendEmail } = await import("./email");
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222"><h3 style="margin:0 0 8px">${title}</h3><p>${message.replace(/</g, "&lt;")}</p><p style="color:#666;font-size:13px">1stRep stock lock. Open the admin portal, Inventory, to check.</p></div>`;
    for (const addr of to) await sendEmail(addr, `1stRep stock alert: ${title}`, html).catch((e) => console.error("[StockGuard] alert email failed:", e));
  } catch (e) { console.error("[StockGuard] alert email error:", e); }
}

async function userLabel(req: Request): Promise<string> {
  try {
    const r: any = (await db.execute(sql`SELECT first_name, last_name, username, email FROM users WHERE id = ${req.user!.id}`)).rows[0];
    const name = `${r?.first_name || ""} ${r?.last_name || ""}`.trim();
    return name || r?.username || r?.email || req.user!.id;
  } catch { return req.user?.id || "unknown"; }
}

async function record(req: Request, allowed: boolean, detail: string, label?: string) {
  try {
    const who = label ?? (await userLabel(req));
    const route = req.originalUrl.split("?")[0];
    await db.execute(sql`INSERT INTO stock_manual_edits (user_id, user_label, method, route, allowed, detail)
      VALUES (${req.user?.id || null}, ${who}, ${req.method}, ${route}, ${allowed}, ${detail.slice(0, 500)})`);
    if (!allowed) await alertAdmins("Stock change blocked", `${who} tried to change stock by hand (${req.method} ${route}). ${detail}`);
  } catch (e) { console.error("[StockGuard] could not record edit:", e); }
}

const STOCK_KEYS = ["stockQuantity", "stock", "warehouseStock"];
const hasStockFields = (b: any): boolean => !!b && typeof b === "object" && (STOCK_KEYS.some((k) => k in b) || (Array.isArray(b.variants) && b.variants.some(hasStockFields)));
function stripStockFields(b: any) {
  if (!b || typeof b !== "object") return;
  for (const k of STOCK_KEYS) delete b[k];
  if (Array.isArray(b.variants)) b.variants.forEach(stripStockFields);
}

export type GuardMode = "block" | "strip" | "variantEdit" | "receive";

const LOCKED_MESSAGE = "Changing stock numbers by hand is locked. Please ask Shahzad to make the change. (Receiving a delivery with Add Stock still works.)";

export function stockEditGuard(mode: GuardMode) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const editor = !!req.user && stockEditors().includes(req.user.id);
      if (editor) {
        // owner: allowed, but every stock edit is written down with the name
        if (mode === "block" || mode === "receive" || hasStockFields(req.body)) {
          await record(req, true, `${mode}: ${JSON.stringify(req.body ?? {}).slice(0, 300)}`);
        }
        return next();
      }
      if (mode === "strip") {
        if (hasStockFields(req.body)) { stripStockFields(req.body); await record(req, false, "Stock fields were removed from this save; the rest was saved."); }
        return next();
      }
      if (mode === "receive") {
        const qty = parseInt(req.body?.quantity);
        if (Number.isFinite(qty) && qty > 0) { await record(req, true, `received +${qty} on variant ${req.body?.variantId}`); return next(); }
        await record(req, false, `Refused: quantity ${req.body?.quantity} (only a positive delivery can be added).`);
        return res.status(403).json({ error: LOCKED_MESSAGE });
      }
      if (mode === "variantEdit") {
        const b = req.body || {};
        const wanted = b.stockQuantity ?? b.stock;
        if (wanted === undefined) return next();
        const id = req.params.id;
        const cur: any = (await db.execute(sql`SELECT stock_quantity FROM product_variants WHERE id = ${id}`)).rows[0];
        if (cur && Number(wanted) === Number(cur.stock_quantity)) { delete b.stockQuantity; delete b.stock; return next(); } // unchanged: other fields still save
        await record(req, false, `Tried to set a variant from ${cur?.stock_quantity} to ${wanted}.`);
        return res.status(403).json({ error: LOCKED_MESSAGE });
      }
      await record(req, false, `Refused (${mode}).`);
      return res.status(403).json({ error: LOCKED_MESSAGE });
    } catch (e) {
      console.error("[StockGuard] error - refusing to be safe:", e);
      return res.status(500).json({ error: "Stock check failed, nothing was changed." });
    }
  };
}

/** Flags stock DECREASES that no sale / return / cancellation / recorded owner edit explains. */
export async function runManualStockWatch(): Promise<{ checked: number; flagged: number }> {
  const rows = (await db.execute(sql`
    SELECT a.id, a.variant_id, a.old_qty, a.new_qty, a.delta, a.changed_at, v.product_id, v.size, v.color, trim(p.name) AS product
      FROM stock_audit a, stock_watch_state s, product_variants v, products p
     WHERE a.id > s.last_audit_id AND a.delta < 0 AND a.changed_at < NOW() - INTERVAL '2 minutes'
       AND v.id = a.variant_id AND p.id = v.product_id
     ORDER BY a.id LIMIT 200`)).rows as any[];
  let flagged = 0;
  for (const r of rows) {
    const linked = (await db.execute(sql`
      SELECT 1 WHERE EXISTS (
          SELECT 1 FROM customer_order_items i JOIN customer_orders o ON o.id = i.order_id
           WHERE i.product_id = ${r.product_id} AND i.size IS NOT DISTINCT FROM ${r.size} AND i.color IS NOT DISTINCT FROM ${r.color}
             AND ABS(EXTRACT(EPOCH FROM (${r.changed_at}::timestamptz - o.order_date::timestamptz))) <= 1800)
        OR EXISTS (
          SELECT 1 FROM customer_order_status_history h JOIN customer_order_items i ON i.order_id = h.order_id
           WHERE i.product_id = ${r.product_id} AND i.size IS NOT DISTINCT FROM ${r.size} AND i.color IS NOT DISTINCT FROM ${r.color}
             AND ABS(EXTRACT(EPOCH FROM (${r.changed_at}::timestamptz - h.created_at::timestamptz))) <= 600)
        OR EXISTS (
          SELECT 1 FROM stock_manual_edits m WHERE m.allowed AND ABS(EXTRACT(EPOCH FROM (${r.changed_at}::timestamptz - m.at))) <= 180)`)).rows.length > 0;
    if (linked) continue;
    flagged++;
    const msg = `${r.product} ${r.size || ""}/${r.color || ""}: stock went ${r.old_qty} -> ${r.new_qty} with no sale, return or recorded owner edit. It was not made through the admin screens.`.replace(/\s+/g, " ");
    await alertAdmins("Unexplained stock decrease", msg);
    console.warn("[StockWatch]", msg);
  }
  if (rows.length) {
    await db.execute(sql`UPDATE stock_watch_state SET last_audit_id = ${rows[rows.length - 1].id}, last_run_at = NOW(), last_summary = ${`checked ${rows.length}, flagged ${flagged}`} WHERE id = 1`);
  } else {
    await db.execute(sql`UPDATE stock_watch_state SET last_run_at = NOW(), last_summary = 'nothing new' WHERE id = 1`);
  }
  return { checked: rows.length, flagged };
}

export function startManualStockWatch(intervalMs = 5 * 60 * 1000) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { const r = await runManualStockWatch(); if (r.flagged) console.log(`[StockWatch] flagged ${r.flagged} unexplained decrease(s)`); }
    catch (e: any) { console.error("[StockWatch] failed:", e?.message || e); }
    finally { running = false; }
  };
  setTimeout(tick, 90 * 1000);
  setInterval(tick, intervalMs);
  console.log("🔒 Stock lock + unexplained-decrease watch started (every 5 minutes)");
}
