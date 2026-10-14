// ─────────────────────────────────────────────────────────────────────────────
// Payment reconciler — the safety net behind the safety net.
//
// Why this exists: a QR/EPOS sale is only turned into a portal order when the
// till (or the customer's return page) polls /api/square/verify-payment while
// the payment is in flight. If that polling stops before the customer pays —
// tab refreshed, page closed, phone slow, three links generated in a row and the
// pollers timing out — the money lands in Square and no order is ever created.
// (Real case: Chris Garrett, 5 Oct 2026, £21, paid 10s after the till stopped
// polling. The old 48h recovery only ran when that store happened to reopen its
// EPOS, so it was never recovered.)
//
// This job does not depend on any browser. Every few minutes it looks at every
// still-unfinished EPOS payment record and asks Square directly whether it was
// paid. If so it creates the order exactly as the normal flow would.
// ─────────────────────────────────────────────────────────────────────────────
import { SquareClient, SquareEnvironment } from 'square';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from './db';
import { eposPendingPayments, pendingWebsiteCheckouts, resellers } from '../shared/schema';
import { storage } from './storage';
import { autoCreateEposOrderFromPending, makeOwnSquareClient } from './squareRoutes';

export interface ReconcileOptions {
  /** Only look at records younger than this. Default 7 days. */
  maxAgeHours?: number;
  /** Skip records younger than this so live polling gets first go. Default 3 min. */
  minAgeMinutes?: number;
  /** Restrict to specific EPOS reference ids (used for one-off recoveries). */
  referenceIds?: string[];
  /** false = create the order silently, no customer confirmation email. Default true. */
  sendEmail?: boolean;
  /** Report what would be recovered without creating anything. */
  dryRun?: boolean;
  limit?: number;
}

export interface ReconcileResult {
  checked: number;
  recovered: { referenceId: string; orderNumber: string; squarePaymentId: string; amount: string }[];
  alreadyHandled: number;
  wouldRecover: { referenceId: string; squarePaymentId: string; amount: string }[];
  warnings: string[];
  errors: string[];
}

let running = false;
const lastChecked = new Map<string, number>();

export async function reconcileEposPendingPayments(opts: ReconcileOptions = {}): Promise<ReconcileResult> {
  const result: ReconcileResult = { checked: 0, recovered: [], alreadyHandled: 0, wouldRecover: [], warnings: [], errors: [] };
  const maxAgeHours = opts.maxAgeHours ?? 24 * 7;
  const minAgeMinutes = opts.minAgeMinutes ?? 3;
  const now = Date.now();
  const oldest = new Date(now - maxAgeHours * 3600 * 1000);
  const newest = new Date(now - minAgeMinutes * 60 * 1000);

  const platformClient = new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN, environment: SquareEnvironment.Production });

  const conditions = [
    inArray(eposPendingPayments.status, ['pending', 'expired']),
    gte(eposPendingPayments.createdAt, oldest),
    lte(eposPendingPayments.createdAt, newest),
  ];
  if (opts.referenceIds?.length) conditions.push(inArray(eposPendingPayments.referenceId, opts.referenceIds));

  const rows = await db.select().from(eposPendingPayments)
    .where(and(...conditions))
    .orderBy(desc(eposPendingPayments.createdAt))
    .limit(opts.limit ?? 300);

  const ownClients = new Map<string, SquareClient | null>();
  const recheckAfterMs = 20 * 60 * 1000;

  for (const row of rows) {
    const ageMs = now - new Date(row.createdAt).getTime();
    const last = lastChecked.get(row.referenceId) || 0;
    if (!opts.referenceIds && ageMs > 3600 * 1000 && now - last < recheckAfterMs) continue;
    lastChecked.set(row.referenceId, now);
    result.checked++;
    try {
      // Which Square account took the money?
      let client = platformClient;
      if (row.ownSquare && row.resellerId) {
        if (!ownClients.has(row.resellerId)) {
          const r = (await db.select().from(resellers).where(eq(resellers.id, row.resellerId)).limit(1))[0];
          ownClients.set(row.resellerId, r ? makeOwnSquareClient(r) : null);
        }
        const own = ownClients.get(row.resellerId);
        if (!own) { result.warnings.push(`${row.referenceId}: paid via reseller's own Square but its credentials are not usable — check manually`); continue; }
        client = own;
      }

      // Find the Square order behind this payment link.
      let squareOrderId = row.squareOrderId || null;
      if (!squareOrderId && row.paymentLinkId) {
        const link = await client.checkout.paymentLinks.get({ id: row.paymentLinkId });
        squareOrderId = link.paymentLink?.orderId || null;
      }
      if (!squareOrderId) continue;

      const order = (await client.orders.get({ orderId: squareOrderId })).order;
      const tenders = order?.tenders || [];
      if (!tenders.length) continue; // never paid (abandoned link) — the normal case

      // A tender is not proof of payment on its own (declined cards create one).
      // Confirm each against the Payments API: COMPLETED and not fully refunded.
      const completed: { id: string; amount: bigint; at?: Date }[] = [];
      for (const t of tenders) {
        const paymentId = (t as any).paymentId || t.id;
        if (!paymentId) continue;
        const p = (await client.payments.get({ paymentId })).payment;
        if (!p || p.status !== 'COMPLETED') continue;
        const paid = BigInt(p.amountMoney?.amount ?? 0);
        const refunded = BigInt(p.refundedMoney?.amount ?? 0);
        if (paid > BigInt(0) && refunded >= paid) continue; // fully refunded — no order to make
        completed.push({ id: p.id!, amount: paid, at: p.createdAt ? new Date(p.createdAt) : undefined });
      }
      if (!completed.length) continue;

      const first = completed[0];
      const amount = (Number(first.amount) / 100).toFixed(2);

      if (completed.length > 1) {
        if (!opts.dryRun) try { await storage.createAdminNotification({ type: 'payment_failed', title: 'Customer paid twice on one till link', message: `${row.customerFirstName || ''} ${row.customerLastName || ''} ${row.customerEmail || ''} paid ${completed.length} times (£${(Number(first.amount) / 100).toFixed(2)} each) for one sale. One order is being created - the extra payment(s) probably need refunding in Square.`.replace(/\s+/g, ' '), link: '/admin/orders', isRead: false }); } catch { /* best-effort */ }
        result.warnings.push(`${row.referenceId}: customer paid ${completed.length} times on one link (${completed.map(c => c.id.slice(0, 6)).join(', ')}) — one order created, the extra payment(s) likely need refunding`);
      }

      if (opts.dryRun) { result.wouldRecover.push({ referenceId: row.referenceId, squarePaymentId: first.id, amount }); continue; }

      const created = await autoCreateEposOrderFromPending({
        referenceId: row.referenceId,
        paymentLinkId: row.paymentLinkId,
        squarePaymentId: first.id,
        sendEmail: opts.sendEmail,
        paidAt: first.at,
      });
      if (!created) { result.errors.push(`${row.referenceId}: paid in Square (${first.id}) but the order could not be created — see server log`); continue; }
      if (!created.created) { result.alreadyHandled++; continue; }

      result.recovered.push({ referenceId: row.referenceId, orderNumber: created.orderNumber, squarePaymentId: first.id, amount });
      console.warn(`🛟 [Reconciler] Recovered unrecorded payment: ${row.referenceId} → ${created.orderNumber} (£${amount}, Square ${first.id})`);
    } catch (err: any) {
      result.errors.push(`${row.referenceId}: ${err?.message || err}`);
    }
  }

  if (result.warnings.length) for (const w of result.warnings) console.warn(`⚠️ [Reconciler] ${w}`);
  if (result.errors.length) for (const e of result.errors) console.error(`❌ [Reconciler] ${e}`);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Website checkouts (card / Apple Pay / Google Pay on 1strep.com).
// Same failure mode: the order is only created when the customer's browser lands
// back on /checkout/complete. If they close Square's page after paying, or lose
// signal, the money is taken but no order exists. The full cart is saved server-side
// in pending_website_checkouts before the customer leaves, so we can finish the job.
// The order is created through the very same endpoint the browser would have used
// (/api/orders/create-confirmed), so stock, emails, coupons and commissions behave
// identically — and it is idempotent on the Square payment id.
// ─────────────────────────────────────────────────────────────────────────────
export async function reconcileWebsitePendingCheckouts(opts: ReconcileOptions = {}): Promise<ReconcileResult> {
  const result: ReconcileResult = { checked: 0, recovered: [], alreadyHandled: 0, wouldRecover: [], warnings: [], errors: [] };
  const now = Date.now();
  const oldest = new Date(now - (opts.maxAgeHours ?? 24 * 7) * 3600 * 1000);
  const newest = new Date(now - (opts.minAgeMinutes ?? 10) * 60 * 1000); // customers can take a while on the Square page
  const client = new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN, environment: SquareEnvironment.Production });

  const conditions = [eq(pendingWebsiteCheckouts.status, 'pending'), gte(pendingWebsiteCheckouts.createdAt, oldest), lte(pendingWebsiteCheckouts.createdAt, newest)];
  if (opts.referenceIds?.length) conditions.push(inArray(pendingWebsiteCheckouts.paymentLinkId, opts.referenceIds));
  const rows = await db.select().from(pendingWebsiteCheckouts).where(and(...conditions)).orderBy(desc(pendingWebsiteCheckouts.createdAt)).limit(opts.limit ?? 200);

  for (const row of rows) {
    const ageMs = now - new Date(row.createdAt as any).getTime();
    const last = lastChecked.get(row.paymentLinkId) || 0;
    if (!opts.referenceIds && ageMs > 3600 * 1000 && now - last < 20 * 60 * 1000) continue;
    lastChecked.set(row.paymentLinkId, now);
    result.checked++;
    try {
      let squareOrderId = row.squareOrderId || null;
      if (!squareOrderId) squareOrderId = (await client.checkout.paymentLinks.get({ id: row.paymentLinkId })).paymentLink?.orderId || null;
      if (!squareOrderId) continue;
      const order = (await client.orders.get({ orderId: squareOrderId })).order;
      const tenders = order?.tenders || [];
      if (!tenders.length) continue;

      const completed: { id: string; amount: bigint }[] = [];
      for (const t of tenders) {
        const paymentId = (t as any).paymentId || t.id;
        if (!paymentId) continue;
        const p = (await client.payments.get({ paymentId })).payment;
        if (!p || p.status !== 'COMPLETED') continue;
        const paid = BigInt(p.amountMoney?.amount ?? 0);
        const refunded = BigInt(p.refundedMoney?.amount ?? 0);
        if (paid > BigInt(0) && refunded >= paid) continue;
        completed.push({ id: p.id!, amount: paid });
      }
      if (!completed.length) continue;
      const first = completed[0];
      const amount = (Number(first.amount) / 100).toFixed(2);
      const ci: any = row.customerInfo || {};
      if (completed.length > 1) {
        result.warnings.push(`website ${row.paymentLinkId}: customer paid ${completed.length} times (£${amount} each) — one order created, extra payment(s) likely need refunding`);
        if (!opts.dryRun) try {
          await storage.createAdminNotification({
            type: 'payment_failed',
            title: 'Customer paid twice at website checkout',
            message: `${ci.firstName || ''} ${ci.lastName || ''} ${ci.email || ''} paid ${completed.length} times (£${amount} each) for one order. One order is being created - the extra payment(s) probably need refunding in Square.`.replace(/\s+/g, ' '),
            link: '/admin/orders',
            isRead: false,
          });
        } catch { /* best-effort */ }
      }
      if (opts.dryRun) { result.wouldRecover.push({ referenceId: row.paymentLinkId, squarePaymentId: first.id, amount }); continue; }

      const port = process.env.PORT || '5000';
      const resp = await fetch(`http://127.0.0.1:${port}/api/orders/create-confirmed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: row.customerInfo,
          cartItems: row.cartItems,
          subtotal: row.subtotal != null ? parseFloat(row.subtotal as any) : undefined,
          shipping: row.shipping != null ? parseFloat(row.shipping as any) : undefined,
          total: row.total != null ? parseFloat(row.total as any) : undefined,
          coupon: row.coupon,
          termsAcceptedAt: row.termsAcceptedAt,
          paymentMethod: 'square',
          squareOrderId,
          squareCheckoutId: row.paymentLinkId,
          squarePaymentId: first.id,
        }),
      });
      const body: any = await resp.json().catch(() => ({}));
      if (!resp.ok || !body?.success) { result.errors.push(`website ${row.paymentLinkId}: paid in Square (${first.id}) but order creation failed: ${body?.error || resp.status}`); continue; }
      if (body.duplicate) {
        result.alreadyHandled++;
        await db.update(pendingWebsiteCheckouts).set({ status: 'completed', orderNumber: body.order?.orderNumber, completedAt: new Date() }).where(eq(pendingWebsiteCheckouts.id, row.id));
        continue;
      }
      result.recovered.push({ referenceId: row.paymentLinkId, orderNumber: body.order?.orderNumber, squarePaymentId: first.id, amount });
      console.warn(`🛟 [Reconciler] Recovered unrecorded website payment: ${row.paymentLinkId} → ${body.order?.orderNumber} (£${amount}, Square ${first.id})`);
    } catch (err: any) {
      result.errors.push(`website ${row.paymentLinkId}: ${err?.message || err}`);
    }
  }
  for (const w of result.warnings) console.warn(`⚠️ [Reconciler] ${w}`);
  for (const e of result.errors) console.error(`❌ [Reconciler] ${e}`);
  return result;
}

/** Runs the reconciler every few minutes for the life of the server. */
export function startPaymentReconciler(intervalMs = 2 * 60 * 1000) {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const r = await reconcileEposPendingPayments();
      const w = await reconcileWebsitePendingCheckouts();
      if (r.recovered.length || r.errors.length || w.recovered.length || w.errors.length) console.log(`[Reconciler] till: checked ${r.checked}, recovered ${r.recovered.length}, errors ${r.errors.length} | website: checked ${w.checked}, recovered ${w.recovered.length}, errors ${w.errors.length}`);
    } catch (err: any) {
      console.error('[Reconciler] run failed:', err?.message || err);
    } finally {
      running = false;
    }
  };
  setTimeout(tick, 45 * 1000); // first pass shortly after boot, catches anything missed while the server was down
  setInterval(tick, intervalMs);
  console.log(`🛟 Payment reconciler started (every ${Math.round(intervalMs / 1000)}s, looks back 7 days)`);
}
