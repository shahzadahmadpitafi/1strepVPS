/**
 * SMS notifications via Twilio REST API.
 * Gracefully skips all sends when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM_NUMBER are not set — so the app works without credentials and
 * SMS is simply activated once the secrets are added.
 */

export function normalisePhone(raw: string): string {
  const trimmed = raw.replace(/\s+/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  // UK default: strip leading 0 and prepend +44
  if (trimmed.startsWith('0')) return `+44${trimmed.slice(1)}`;
  // Assume UK if no country code
  return `+44${trimmed}`;
}

/**
 * onError only fires for a genuine send failure (Twilio configured but the
 * API call failed) — never for the intentional "not configured" skip, so
 * callers can distinguish "nothing attempted" from "attempted and failed".
 */
export async function sendSMS(to: string, body: string, onError?: (message: string) => void): Promise<boolean> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    return false;
  }

  const phone = normalisePhone(to);
  const url   = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const creds = Buffer.from(`${sid}:${token}`).toString('base64');

  try {
    const res  = await fetch(url, {
      method : 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type' : 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: phone, Body: body }).toString(),
    });

    const data = await res.json() as any;
    if (data.sid) {
      console.log(`SMS sent to ${phone}: ${data.sid}`);
      return true;
    }
    const message = data.message || 'Unknown Twilio error';
    console.error(`Twilio error for ${phone}:`, message);
    onError?.(message);
    return false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('SMS send error:', err);
    onError?.(message);
    return false;
  }
}

/** Fire-and-forget helper — skips silently if phone is falsy */
export function smsAsync(to: string | null | undefined, body: string, onError?: (message: string) => void): void {
  if (!to) return;
  sendSMS(to, body, onError).catch(err => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('SMS async error:', err);
    onError?.(message);
  });
}

/**
 * Admin alert SMS — sends to whichever number(s) are set in ADMIN_ALERT_PHONE
 * (comma-separated for more than one). No-op if unset, so this stays opt-in.
 */
export function smsAdminAlert(body: string): void {
  const raw = process.env.ADMIN_ALERT_PHONE;
  if (!raw) return;
  for (const number of raw.split(',').map(n => n.trim()).filter(Boolean)) {
    smsAsync(number, body, (message) => {
      console.error(`[AdminAlert] SMS failed for ${number}: ${message}`);
    });
  }
}

// ─── Template functions ───────────────────────────────────────────────────────
// Copy is matched to the equivalent email in server/email.ts so the SMS reads
// like a shorter version of the same message, not a generic stand-in.

export function smsResellerApplicationReceived(phone: string | null | undefined, name: string, businessName: string, onError?: (message: string) => void): void {
  smsAsync(phone, `Hi ${name}, thanks for applying to become a 1stRep reseller! We've received your application for ${businessName} and will review it within 2-3 business days. – 1stRep`, onError);
}

export function smsResellerApproved(phone: string | null | undefined, name: string, tier: string, discountPercentage: number, onError?: (message: string) => void): void {
  smsAsync(phone, `Congratulations ${name}! Your 1stRep reseller application is approved — ${tier} tier, ${discountPercentage}% off. Log in at 1strep.com/reseller/login to start ordering. – 1stRep`, onError);
}

export function smsResellerRejected(phone: string | null | undefined, name: string, onError?: (message: string) => void): void {
  smsAsync(phone, `Hi ${name}, thanks for your interest in the 1stRep reseller programme. We're unable to approve your application right now, but you're welcome to reapply as your business grows — and to shop with us as a customer in the meantime. – 1stRep`, onError);
}

export function smsOrderConfirmed(phone: string | null | undefined, name: string, orderNumber: string, total: string | number, itemSummary: string, onError?: (message: string) => void): void {
  smsAsync(phone, `Hi ${name}, we've received your 1stRep order #${orderNumber} — ${itemSummary}. Total £${total}. We're preparing it now and will text you the moment it ships. – 1stRep`, onError);
}

export function smsOrderShipped(phone: string | null | undefined, name: string, orderNumber: string, itemSummary: string, trackingNumber?: string | null, onError?: (message: string) => void): void {
  const body = trackingNumber
    ? `Hi ${name}, great news — your 1stRep order #${orderNumber} (${itemSummary}) has shipped! Track it: ${trackingNumber}. – 1stRep`
    : `Hi ${name}, great news — your 1stRep order #${orderNumber} (${itemSummary}) is on its way! – 1stRep`;
  smsAsync(phone, body, onError);
}

export function buildReviewRequestSmsBody(name: string, orderNumber: string, feedbackUrl: string): string {
  return `Hi ${name}, how did your 1stRep order #${orderNumber} measure up? We'd love your feedback — it only takes 30 seconds: ${feedbackUrl} – 1stRep`;
}

export function smsReviewRequest(phone: string | null | undefined, name: string, orderNumber: string, feedbackUrl: string, onError?: (message: string) => void): void {
  smsAsync(phone, buildReviewRequestSmsBody(name, orderNumber, feedbackUrl), onError);
}

export function buildReviewReminderSmsBody(stage: 1 | 2, name: string, orderNumber: string, feedbackUrl: string): string {
  if (stage === 1) {
    return `Hi ${name}, just a quick nudge — got 30 seconds to rate your 1stRep order #${orderNumber}? ${feedbackUrl} – 1stRep`;
  }
  return `Hi ${name}, last call for feedback on your 1stRep order #${orderNumber} — we'd really value your thoughts: ${feedbackUrl} – 1stRep`;
}

export function buildReviewThankYouSmsBody(name: string): string {
  return `Hi ${name}, thanks again for leaving a review on your 1stRep order — your feedback is really important to us and helps other athletes shop with confidence. – 1stRep`;
}

export function smsWholesaleOrderPaid(phone: string | null | undefined, businessName: string, orderNumber: string, amount: string | number, itemCount: number, onError?: (message: string) => void): void {
  smsAsync(phone, `Hi ${businessName}, payment confirmed for wholesale order #${orderNumber} — £${amount} for ${itemCount} item${itemCount === 1 ? '' : 's'}. We'll text you again once it's dispatched. – 1stRep`, onError);
}

export function smsSubscriptionActivated(phone: string | null | undefined, businessName: string, tier: string, amount: string | number, nextBillingDate: string, onError?: (message: string) => void): void {
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  smsAsync(phone, `Hi ${businessName}, your 1stRep ${tierLabel} subscription is now active! You can start listing your own products right away. £${amount}/month, next billing ${nextBillingDate}. – 1stRep`, onError);
}

export function smsInfluencerApplicationReceived(phone: string | null | undefined, name: string, onError?: (message: string) => void): void {
  smsAsync(phone, `Hi ${name}, thanks for applying to the 1stRep Influencer Programme! We'll review your application within 7 days. If approved, you'll get your own discount code plus 100 welcome credits. – 1stRep`, onError);
}

export function smsInfluencerApproved(phone: string | null | undefined, name: string, discountCode: string, onError?: (message: string) => void): void {
  smsAsync(phone, `Congrats ${name} — you're in! Your 1stRep Influencer code is ${discountCode}, plus 100 welcome credits added to your account. Log in at 1strep.com/login to get started. – 1stRep`, onError);
}

export function smsAbandonedCart(phone: string | null | undefined, name: string, onError?: (message: string) => void): void {
  smsAsync(phone, `Hi ${name}, you left something behind! Your 1stRep cart is still saved — complete your order at 1strep.com before it sells out. – 1stRep`, onError);
}

export function smsPasswordReset(phone: string | null | undefined, otp: string, onError?: (message: string) => void): void {
  smsAsync(phone, `Your 1stRep password reset code is ${otp}. It expires in 10 minutes. Didn't request this? Contact info@1strep.com straight away. – 1stRep`, onError);
}
