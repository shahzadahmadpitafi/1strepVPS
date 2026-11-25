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
  await db.execute(sql`CREATE TABLE IF NOT EXISTS stock_add_requests (
    id SERIAL PRIMARY KEY, variant_id VARCHAR NOT NULL, quantity INTEGER NOT NULL, batch_number TEXT, supplier TEXT, location TEXT,
    cost_per_unit TEXT, notes TEXT, requested_by VARCHAR, requested_by_label TEXT, status TEXT NOT NULL DEFAULT 'pending',
    approved_quantity INTEGER, decided_by VARCHAR, decided_by_label TEXT, decided_at TIMESTAMPTZ, decision_note TEXT,
    notified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS stock_watch_state (id INTEGER PRIMARY KEY DEFAULT 1, last_audit_id BIGINT NOT NULL DEFAULT 0, last_run_at TIMESTAMPTZ, last_summary TEXT)`);
  await db.execute(sql`INSERT INTO stock_watch_state (id, last_audit_id) SELECT 1, COALESCE(MAX(id), 0) FROM stock_audit ON CONFLICT (id) DO NOTHING`);
}

/** Admin bell notification + email to the stock editors (or STOCK_ALERT_EMAILS). Never throws. */
export async function alertAdmins(title: string, message: string, extraHtml = "", link = "/admin/inventory") {
  try {
    await db.execute(sql`INSERT INTO admin_notifications (type, title, message, link, is_read) VALUES ('stock_alert', ${title}, ${message.slice(0, 480)}, ${link}, false)`);
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
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222"><h3 style="margin:0 0 8px">${title}</h3><p>${message.replace(/</g, "&lt;")}</p>${extraHtml}<p style="color:#666;font-size:13px">1stRep stock lock. Open the admin portal at https://1strep.com/admin/inventory to check.</p></div>`;
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

const LOCKED_MESSAGE = "Changing stock numbers by hand is locked. Please ask Dennis to make the change. (Add Stock still works: it sends the delivery to Dennis to check and approve.)";

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
        const vid = String(req.body?.variantId || "");
        const v: any = vid ? (await db.execute(sql`SELECT id FROM product_variants WHERE id = ${vid}`)).rows[0] : null;
        if (Number.isFinite(qty) && qty > 0 && v) {
          // not added yet: it waits for Dennis to check the amount and approve
          const b = req.body || {};
          const who = await userLabel(req);
          await db.execute(sql`INSERT INTO stock_add_requests (variant_id, quantity, batch_number, supplier, location, cost_per_unit, notes, requested_by, requested_by_label)
            VALUES (${vid}, ${qty}, ${b.batchNumber || null}, ${b.supplier || null}, ${b.location || null}, ${b.costPerUnit ? String(b.costPerUnit) : null}, ${b.notes || null}, ${req.user!.id}, ${who})`);
          scheduleRequestDigest();
          return res.status(202).json({ success: true, pending: true, message: "Sent to Dennis to check and approve. The stock is added once he approves." });
        }
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

export type DecideResult = { ok: boolean; status: number; error?: string };

/** Approve one Add Stock request (optionally with a corrected amount). `apply` actually adds the stock. */
export async function approveStockRequest(id: number, actor: { id: string; label: string }, override: number | null, apply: (r: any) => Promise<void>): Promise<DecideResult> {
  if (!stockEditors().includes(actor.id)) return { ok: false, status: 403, error: "Only the stock editor can approve" };
  if (override !== null && !(override > 0)) return { ok: false, status: 400, error: "Quantity must be 1 or more" };
  const claimed: any = (await db.execute(sql`UPDATE stock_add_requests SET status = 'approved', approved_quantity = COALESCE(${override}::int, quantity),
      decided_by = ${actor.id}, decided_by_label = ${actor.label}, decided_at = NOW() WHERE id = ${id} AND status = 'pending' RETURNING *`)).rows[0];
  if (!claimed) return { ok: false, status: 409, error: "This request was already decided" };
  try {
    await apply(claimed);
  } catch (e) {
    await db.execute(sql`UPDATE stock_add_requests SET status = 'pending', approved_quantity = NULL, decided_by = NULL, decided_by_label = NULL, decided_at = NULL WHERE id = ${id}`);
    throw e;
  }
  await db.execute(sql`INSERT INTO stock_manual_edits (user_id, user_label, method, route, allowed, detail) VALUES (${actor.id}, ${actor.label}, 'POST', '/api/admin/stock-requests/approve', true, ${`approved request ${id}: +${claimed.approved_quantity} (asked ${claimed.quantity}) by ${claimed.requested_by_label}`})`);
  if (claimed.approved_quantity !== claimed.quantity) await alertAdmins("Stock request approved with a different amount", `${actor.label} approved ${claimed.approved_quantity} instead of ${claimed.quantity} requested by ${claimed.requested_by_label}.`);
  return { ok: true, status: 200 };
}

export async function rejectStockRequest(id: number, actor: { id: string; label: string }, note: string): Promise<DecideResult> {
  if (!stockEditors().includes(actor.id)) return { ok: false, status: 403, error: "Only the stock editor can reject" };
  const r: any = await db.execute(sql`UPDATE stock_add_requests SET status = 'rejected', decided_by = ${actor.id}, decided_by_label = ${actor.label}, decided_at = NOW(), decision_note = ${note.slice(0, 300) || null} WHERE id = ${id} AND status = 'pending'`);
  if (!r.rowCount) return { ok: false, status: 409, error: "This request was already decided" };
  return { ok: true, status: 200 };
}

let digestTimer: NodeJS.Timeout | null = null;
export function scheduleRequestDigest() {
  if (digestTimer) return;
  digestTimer = setTimeout(() => { digestTimer = null; sendRequestDigest().catch((e) => console.error("[StockRequests] digest failed:", e)); }, 90 * 1000);
}

/** One email + bell alert for all new add-stock requests (a scanned delivery of 30 items is ONE email). */
export async function sendRequestDigest() {
  const rows = (await db.execute(sql`
    SELECT r.id, r.quantity, r.supplier, r.notes, r.requested_by_label, r.created_at, trim(p.name) AS product, v.size, v.color, v.stock_quantity
      FROM stock_add_requests r JOIN product_variants v ON v.id = r.variant_id JOIN products p ON p.id = v.product_id
     WHERE r.status = 'pending' AND r.notified_at IS NULL ORDER BY r.id`)).rows as any[];
  if (!rows.length) return;
  await db.execute(sql`UPDATE stock_add_requests SET notified_at = NOW() WHERE id = ANY(${"{" + rows.map((r) => r.id).join(",") + "}"}::int[])`);
  const esc = (x: any) => String(x ?? "").replace(/</g, "&lt;");
  const total = rows.reduce((n, r) => n + Number(r.quantity), 0);
  const who = Array.from(new Set(rows.map((r) => r.requested_by_label))).join(", ");
  const td = 'style="padding:5px 8px;border-top:1px solid #ddd"';
  const lines = rows.map((r) => `<tr><td ${td}>${esc(r.product)} ${esc(r.size)} / ${esc(r.color)}</td><td align="center" ${td}><b>+${r.quantity}</b></td><td align="center" ${td}>${r.stock_quantity}</td><td align="center" ${td}>${Number(r.stock_quantity) + Number(r.quantity)}</td><td ${td}>${esc([r.supplier, r.notes].filter(Boolean).join(" - "))}</td></tr>`).join("");
  const table = `<table style="border-collapse:collapse;font-size:14px;margin:10px 0"><tr style="background:#f3f4f6"><th align="left" style="padding:5px 8px">Item</th><th style="padding:5px 8px">Adding</th><th style="padding:5px 8px">Stock now</th><th style="padding:5px 8px">After approval</th><th align="left" style="padding:5px 8px">Notes</th></tr>${lines}</table><p><b>Please check the amounts against the delivery</b>, then approve or reject each line in the admin portal (Inventory, top of the page): <a href="https://1strep.com/admin/inventory">https://1strep.com/admin/inventory</a>. Nothing is added to the stock until you approve.</p>`;
  await alertAdmins("Stock additions waiting for your approval", `${who} added ${rows.length} line(s), ${total} unit(s) in total. Check the amounts and approve.`, table);
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
    try { await sendRequestDigest(); const r = await runManualStockWatch(); if (r.flagged) console.log(`[StockWatch] flagged ${r.flagged} unexplained decrease(s)`); }
    catch (e: any) { console.error("[StockWatch] failed:", e?.message || e); }
    finally { running = false; }
  };
  setTimeout(tick, 90 * 1000);
  setInterval(tick, intervalMs);
  console.log("🔒 Stock lock + unexplained-decrease watch started (every 5 minutes)");
}
