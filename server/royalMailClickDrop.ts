/**
 * Royal Mail Click & Drop integration (standard account).
 *
 *  1. Send an order to Click & Drop    -> POST /orders   (the team then prints the label in Click & Drop)
 *  2. Pull tracking numbers back       -> GET  /orders/{ids}, polled every 10 minutes. When Click & Drop shows a
 *     tracking number, the order gets it and moves to "shipped", which sends the normal shipping email + SMS.
 *  3. Delivery confirmation            -> not in the Click & Drop API; needs Royal Mail Tracking API v2 (see
 *     trackingDelivered() below, switched on once ROYAL_MAIL_TRACKING_CLIENT_ID / _SECRET exist).
 *
 * The API key lives only in the server environment: ROYAL_MAIL_CLICK_DROP_API_KEY. It is never logged or returned.
 * Optional: RM_BASE_WEIGHT_G (default 500), RM_EXTRA_ITEM_WEIGHT_G (default 250), RM_PACKAGE_FORMAT (default "parcel").
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

const BASE = "https://api.parcel.royalmail.com/api/v1";

export const isClickDropConfigured = () => !!process.env.ROYAL_MAIL_CLICK_DROP_API_KEY;

async function api(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
  const key = process.env.ROYAL_MAIL_CLICK_DROP_API_KEY;
  if (!key) throw new Error("Royal Mail Click & Drop API key is not set on the server");
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 500) }; }
  return { status: res.status, data };
}

export async function ensureClickDropColumns() {
  await db.execute(sql`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS click_drop_order_id TEXT`);
  await db.execute(sql`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS click_drop_sent_at TIMESTAMP`);
  await db.execute(sql`ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS click_drop_error TEXT`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_customer_orders_click_drop ON customer_orders (click_drop_order_id) WHERE click_drop_order_id IS NOT NULL`);
}

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

/** "SK136LQ" / "sk13 6lq" -> "SK13 6LQ" */
export function normalisePostcode(p: string): string {
  const c = String(p || "").toUpperCase().replace(/\s+/g, "");
  return c.length > 3 ? `${c.slice(0, -3)} ${c.slice(-3)}` : c;
}

function countryCode(c: string): string {
  const v = String(c || "").trim().toUpperCase();
  if (!v || ["UK", "UNITED KINGDOM", "GB", "GBR", "GREAT BRITAIN", "ENGLAND", "SCOTLAND", "WALES", "NORTHERN IRELAND"].includes(v)) return "GB";
  if (v.length === 2) return v;
  return v; // let Click & Drop validate anything else
}

export type ClickDropOrderRow = {
  id: string; order_number: string; status: string; customer_first_name: string; customer_last_name: string;
  customer_email: string | null; customer_phone: string | null; shipping_address: string | null; shipping_city: string | null;
  shipping_postal_code: string | null; shipping_country: string | null; subtotal: string; shipping_cost: string;
  total_amount: string; order_date: Date; click_drop_order_id: string | null; notes: string | null;
};
type ItemRow = { product_name: string; sku: string | null; size: string | null; color: string | null; quantity: number; unit_price: string };

export function buildClickDropOrder(o: ClickDropOrderRow, items: ItemRow[]) {
  const lines = String(o.shipping_address || "").split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
  const addressLine1 = lines[0] || "";
  const addressLine2 = lines[1] || "";
  const addressLine3 = lines.slice(2).join(", ");
  const base = Number(process.env.RM_BASE_WEIGHT_G || 500);
  const extra = Number(process.env.RM_EXTRA_ITEM_WEIGHT_G || 250);
  const units = items.reduce((n, i) => n + Number(i.quantity || 0), 0) || 1;
  const weightInGrams = Math.round(base + extra * (units - 1));
  const unitWeight = Math.round(weightInGrams / units);
  const phone = clip(o.customer_phone, 25);
  return {
    orderReference: clip(o.order_number, 40),
    isRecipientABusiness: false,
    recipient: {
      address: {
        fullName: clip(`${o.customer_first_name} ${o.customer_last_name}`, 210),
        addressLine1: clip(addressLine1, 100),
        addressLine2: clip(addressLine2, 100) || undefined,
        addressLine3: clip(addressLine3, 100) || undefined,
        city: clip(o.shipping_city, 100),
        postcode: clip(normalisePostcode(o.shipping_postal_code || ""), 20),
        countryCode: countryCode(o.shipping_country || ""),
      },
      phoneNumber: phone || undefined,
      emailAddress: clip(o.customer_email, 254) || undefined,
    },
    packages: [{
      weightInGrams,
      packageFormatIdentifier: process.env.RM_PACKAGE_FORMAT || "parcel",
      contents: items.map((i) => ({
        name: clip([i.product_name, i.size, i.color].filter(Boolean).join(" - "), 800),
        SKU: clip(i.sku, 100) || undefined,
        quantity: Number(i.quantity),
        unitValue: Number(i.unit_price),
        unitWeightInGrams: unitWeight,
      })),
    }],
    orderDate: new Date(o.order_date).toISOString(),
    subtotal: Number(o.subtotal),
    shippingCostCharged: Number(o.shipping_cost || 0),
    total: Number(o.total_amount),
    currencyCode: "GBP",
    // postageDetails left out on purpose: the shipping rule in Click & Drop picks the service (Tracked 48), and
    // no Royal Mail notification emails are sent - the portal sends its own shipping email + SMS.
  };
}

export type SendResult = { orderId: string; orderNumber: string; ok: boolean; clickDropOrderId?: string; error?: string };

async function loadOrder(orderId: string) {
  const o = (await db.execute(sql`SELECT * FROM customer_orders WHERE id = ${orderId}`)).rows[0] as any;
  if (!o) return null;
  const items = (await db.execute(sql`SELECT product_name, sku, size, color, quantity, unit_price FROM customer_order_items WHERE order_id = ${orderId} ORDER BY product_name`)).rows as any[];
  return { o: o as ClickDropOrderRow, items: items as ItemRow[] };
}

/** Send one portal order to Click & Drop. Safe to call twice: an order already sent is skipped. */
export async function sendOrderToClickDrop(orderId: string): Promise<SendResult> {
  const loaded = await loadOrder(orderId);
  if (!loaded) return { orderId, orderNumber: "?", ok: false, error: "Order not found" };
  const { o, items } = loaded;
  const fail = async (error: string): Promise<SendResult> => {
    await db.execute(sql`UPDATE customer_orders SET click_drop_error = ${error.slice(0, 500)} WHERE id = ${orderId}`);
    return { orderId, orderNumber: o.order_number, ok: false, error };
  };
  if (o.click_drop_order_id) return { orderId, orderNumber: o.order_number, ok: true, clickDropOrderId: o.click_drop_order_id, error: "Already sent" };
  if (["cancelled", "refunded", "pending"].includes(o.status)) return fail(`Order is ${o.status} - not sent`);
  if (!items.length) return fail("Order has no items");
  const payload = buildClickDropOrder(o, items);
  const a = payload.recipient.address;
  if (!a.addressLine1 || !a.city || !a.postcode) return fail("Delivery address is incomplete (needs street, town and postcode)");

  const { status, data } = await api("POST", "/orders", { items: [payload] });
  if (status >= 200 && status < 300 && data?.createdOrders?.length) {
    const id = String(data.createdOrders[0].orderIdentifier);
    const tn = data.createdOrders[0].trackingNumber || null;
    await db.execute(sql`UPDATE customer_orders SET click_drop_order_id = ${id}, click_drop_sent_at = NOW(), click_drop_error = NULL WHERE id = ${orderId}`);
    console.log(`[ClickDrop] Sent ${o.order_number} -> Click & Drop order ${id}`);
    if (tn) await applyTracking(orderId, tn, null);
    return { orderId, orderNumber: o.order_number, ok: true, clickDropOrderId: id };
  }
  const errs = data?.failedOrders?.[0]?.errors?.map((e: any) => `${e.fields?.map?.((f: any) => f.fieldName).join("/") || ""} ${e.errorMessage || e.errorCode}`.trim()).join("; ")
    || data?.message || data?.error || data?.raw || `Click & Drop replied ${status}`;
  console.error(`[ClickDrop] Send failed for ${o.order_number}: ${String(errs).slice(0, 300)}`);
  return fail(String(errs));
}

/** The shipped transition, same side effects as an admin changing the status to Shipped. */
async function applyTracking(orderId: string, trackingNumber: string, shippedOn: string | null) {
  const cur = (await db.execute(sql`SELECT status, tracking_number FROM customer_orders WHERE id = ${orderId}`)).rows[0] as any;
  if (!cur) return;
  const tn = trackingNumber.replace(/\s/g, "");
  const becomesShipped = cur.status === "processing"; // paid and waiting to be posted
  await db.execute(sql`UPDATE customer_orders SET tracking_number = ${tn},
      status = ${becomesShipped ? "shipped" : cur.status}::customer_order_status,
      shipped_at = CASE WHEN ${becomesShipped} THEN COALESCE(${shippedOn ? new Date(shippedOn) : null}, NOW()) ELSE shipped_at END
    WHERE id = ${orderId}`);
  if (!becomesShipped) { console.log(`[ClickDrop] Tracking ${tn} saved on order ${orderId} (status stays ${cur.status})`); return; }

  await db.execute(sql`INSERT INTO customer_order_status_history (order_id, previous_status, new_status, changed_by_name, notes)
    VALUES (${orderId}, ${cur.status}::customer_order_status, 'shipped'::customer_order_status, 'Royal Mail Click & Drop', ${"Tracking number " + tn + " received from Click & Drop"})`);

  const o = (await db.execute(sql`SELECT order_number, customer_first_name, customer_last_name, customer_email, customer_phone FROM customer_orders WHERE id = ${orderId}`)).rows[0] as any;
  const name = `${o.customer_first_name} ${o.customer_last_name}`;
  try {
    const { sendShippingNotification } = await import("./email-service");
    await sendShippingNotification({
      customerName: name, customerEmail: o.customer_email, orderNumber: o.order_number, trackingNumber: tn,
      carrier: "Royal Mail", trackingUrl: `https://www.royalmail.com/track-your-item#/tracking-results/${tn}`, estimatedDelivery: undefined,
    } as any);
  } catch (e) { console.error("[ClickDrop] Shipping email failed:", e); }
  try {
    const items = (await db.execute(sql`SELECT product_name, quantity FROM customer_order_items WHERE order_id = ${orderId}`)).rows as any[];
    const summary = items.map((i) => (i.quantity > 1 ? `${i.quantity}x ` : "") + i.product_name).join(", ").slice(0, 120);
    const { smsOrderShipped } = await import("./sms");
    smsOrderShipped(o.customer_phone || null, name, o.order_number, summary, tn, (message) => {
      db.execute(sql`UPDATE customer_orders SET sms_last_error = ${message}, sms_last_error_at = NOW() WHERE id = ${orderId}`).catch(() => {});
    });
  } catch (e) { console.error("[ClickDrop] Shipping SMS failed:", e); }
  console.log(`[ClickDrop] Order ${o.order_number} marked shipped, tracking ${tn}`);
}

let syncing = false;
/** Ask Click & Drop for tracking numbers on every order we sent that has none yet. */
export async function syncTrackingFromClickDrop(): Promise<{ checked: number; updated: number; error?: string }> {
  if (!isClickDropConfigured() || syncing) return { checked: 0, updated: 0 };
  syncing = true;
  try {
    const rows = (await db.execute(sql`SELECT id, click_drop_order_id FROM customer_orders
      WHERE click_drop_order_id IS NOT NULL AND (tracking_number IS NULL OR tracking_number = '')
        AND status NOT IN ('cancelled','refunded','delivered') AND click_drop_sent_at > NOW() - INTERVAL '60 days'`)).rows as any[];
    let updated = 0;
    for (let i = 0; i < rows.length; i += 25) {
      const part = rows.slice(i, i + 25);
      const { status, data } = await api("GET", `/orders/${part.map((r) => r.click_drop_order_id).join(";")}`);
      if (status !== 200 || !Array.isArray(data)) { return { checked: rows.length, updated, error: `Click & Drop replied ${status}` }; }
      for (const d of data) {
        const tn = d.trackingNumber || d.packages?.find((p: any) => p.trackingNumber)?.trackingNumber;
        if (!tn) continue;
        const row = part.find((r) => String(r.click_drop_order_id) === String(d.orderIdentifier));
        if (!row) continue;
        await applyTracking(row.id, String(tn), d.shippedOn || d.printedOn || null);
        updated++;
      }
    }
    return { checked: rows.length, updated };
  } catch (e: any) {
    console.error("[ClickDrop] Tracking sync failed:", e?.message || e);
    return { checked: 0, updated: 0, error: e?.message || String(e) };
  } finally { syncing = false; }
}

export function startClickDropSync() {
  if (!isClickDropConfigured()) { console.log("[ClickDrop] No API key set - integration is off"); return; }
  console.log("[ClickDrop] Tracking sync every 10 minutes");
  setTimeout(() => { syncTrackingFromClickDrop().catch(() => {}); }, 60 * 1000);
  setInterval(() => { syncTrackingFromClickDrop().catch(() => {}); }, 10 * 60 * 1000);
}
