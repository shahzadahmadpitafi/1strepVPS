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

export async function sendSMS(to: string, body: string): Promise<boolean> {
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
    console.error(`Twilio error for ${phone}:`, data.message || data);
    return false;
  } catch (err) {
    console.error('SMS send error:', err);
    return false;
  }
}

/** Fire-and-forget helper — skips silently if phone is falsy */
export function smsAsync(to: string | null | undefined, body: string): void {
  if (!to) return;
  sendSMS(to, body).catch(err => console.error('SMS async error:', err));
}

// ─── Template functions ───────────────────────────────────────────────────────

export function smsResellerApplicationReceived(phone: string | null | undefined, name: string): void {
  smsAsync(phone, `Hi ${name}, your 1stRep reseller application has been received. We'll review it and get back to you within 3–5 business days. – 1stRep`);
}

export function smsResellerApproved(phone: string | null | undefined, name: string, tier: string): void {
  smsAsync(phone, `Great news ${name}! Your 1stRep ${tier} reseller account is APPROVED. Log in at 1strep.com/login to access your dashboard and start selling. – 1stRep`);
}

export function smsResellerRejected(phone: string | null | undefined, name: string): void {
  smsAsync(phone, `Hi ${name}, thank you for applying to the 1stRep reseller programme. Unfortunately your application was not successful at this time. Contact us at info@1strep.com for more information. – 1stRep`);
}

export function smsOrderConfirmed(phone: string | null | undefined, name: string, orderNumber: string, total: string | number): void {
  smsAsync(phone, `Hi ${name}, your 1stRep order #${orderNumber} is confirmed! Total: £${total}. We'll text you again when it ships. – 1stRep`);
}

export function smsOrderShipped(phone: string | null | undefined, name: string, orderNumber: string, trackingNumber?: string | null): void {
  const tracking = trackingNumber ? ` Tracking: ${trackingNumber}.` : '';
  smsAsync(phone, `Good news ${name}! Your 1stRep order #${orderNumber} is on its way.${tracking} – 1stRep`);
}

export function smsWholesaleOrderPaid(phone: string | null | undefined, businessName: string, orderNumber: string, amount: string | number): void {
  smsAsync(phone, `Hi ${businessName}, your wholesale order #${orderNumber} payment of £${amount} has been received and is being processed. – 1stRep`);
}

export function smsSubscriptionActivated(phone: string | null | undefined, businessName: string, tier: string): void {
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  smsAsync(phone, `Hi ${businessName}, your 1stRep ${tierLabel} licence is now active! Log in at 1strep.com/reseller/dashboard to manage your account. – 1stRep`);
}

export function smsInfluencerApplicationReceived(phone: string | null | undefined, name: string): void {
  smsAsync(phone, `Hi ${name}, we've received your 1stRep Influencer application! Our team will review it within 7 days. – 1stRep`);
}

export function smsInfluencerApproved(phone: string | null | undefined, name: string, discountCode: string): void {
  smsAsync(phone, `Congrats ${name}! You're approved for the 1stRep Influencer Programme. Your discount code: ${discountCode}. 100 welcome credits added. Log in at 1strep.com/login – 1stRep`);
}

export function smsAbandonedCart(phone: string | null | undefined, name: string): void {
  smsAsync(phone, `Hi ${name}, you left something in your 1stRep cart! Complete your order at 1strep.com before it sells out. – 1stRep`);
}

export function smsPasswordReset(phone: string | null | undefined): void {
  smsAsync(phone, `Your 1stRep password reset link has been sent to your email. If you did not request this, contact us at info@1strep.com immediately. – 1stRep`);
}
