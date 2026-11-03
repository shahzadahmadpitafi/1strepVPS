/**
 * Everything Square tells us about WHO paid and HOW, for a given payment, so shop orders can be matched to a
 * customer for returns:
 *   - email / phone: given by the customer on the receipt screen, on the Square payment page, or by Apple Pay on that page
 *   - name: from the shipping / billing contact on the payment page (or the Square customer card, or the cardholder name)
 *   - card brand + last 4, receipt number and receipt link (these exist even for an anonymous Apple Pay tap)
 * An in-person Apple Pay TAP on the shop phone returns no name/email/phone - that is how Apple Pay works - so for
 * those only the card brand/last 4 and receipt details are available unless the customer asks for a receipt.
 */
import type { SquareClient } from "square";

export interface BuyerDetails {
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  cardBrand: string | null;
  last4: string | null;
  receiptNumber: string | null;
  receiptUrl: string | null;
  customerId: string | null;
}

const clean = (v: any): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
};

function splitName(full: string | null): { first: string | null; last: string | null } {
  if (!full) return { first: null, last: null };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function addressLine(a: any): string | null {
  if (!a) return null;
  const bits = [a.addressLine1, a.addressLine2, a.locality, a.postalCode].map(clean).filter(Boolean);
  return bits.length ? bits.join(", ") : null;
}

export async function getBuyerDetails(client: SquareClient, paymentId: string, squareOrderId?: string | null): Promise<BuyerDetails> {
  const out: BuyerDetails = { email: null, phone: null, firstName: null, lastName: null, address: null, cardBrand: null, last4: null, receiptNumber: null, receiptUrl: null, customerId: null };

  let payment: any = null;
  try {
    const r: any = await client.payments.get({ paymentId });
    payment = r.payment ?? r.data?.payment ?? null;
  } catch (e: any) {
    console.warn("[SquareBuyer] payment lookup failed:", e?.message);
  }
  if (!payment) return out;

  out.email = clean(payment.buyerEmailAddress);
  out.phone = clean(payment.buyerPhoneNumber);
  out.cardBrand = clean(payment.cardDetails?.card?.cardBrand);
  out.last4 = clean(payment.cardDetails?.card?.last4);
  out.receiptNumber = clean(payment.receiptNumber);
  out.receiptUrl = clean(payment.receiptUrl);
  out.customerId = clean(payment.customerId);

  const shipping = payment.shippingAddress;
  const billing = payment.billingAddress;
  out.firstName = clean(shipping?.firstName) || clean(billing?.firstName);
  out.lastName = clean(shipping?.lastName) || clean(billing?.lastName);
  out.address = addressLine(shipping) || addressLine(billing);

  // The order carries the contact the customer gave on the payment page (fulfilment recipient)
  const orderId = squareOrderId || clean(payment.orderId);
  if (orderId) {
    try {
      const r: any = await client.orders.get({ orderId });
      const order = r.order ?? r.data?.order;
      for (const f of order?.fulfillments ?? []) {
        const rec = f.shipmentDetails?.recipient ?? f.pickupDetails?.recipient ?? f.deliveryDetails?.recipient;
        if (!rec) continue;
        out.email = out.email || clean(rec.emailAddress);
        out.phone = out.phone || clean(rec.phoneNumber);
        if (!out.firstName && !out.lastName) {
          const n = splitName(clean(rec.displayName));
          out.firstName = n.first;
          out.lastName = n.last;
        }
        out.address = out.address || addressLine(rec.address);
      }
    } catch (e: any) {
      console.warn("[SquareBuyer] order lookup failed:", e?.message);
    }
  }

  // A customer card attached to the sale in Square (name / email / phone)
  if (out.customerId && (!out.email || !out.firstName || !out.phone)) {
    try {
      const r: any = await client.customers.get({ customerId: out.customerId });
      const c = r.customer ?? r.data?.customer;
      out.email = out.email || clean(c?.emailAddress);
      out.phone = out.phone || clean(c?.phoneNumber);
      out.firstName = out.firstName || clean(c?.givenName);
      out.lastName = out.lastName || clean(c?.familyName);
    } catch (e: any) {
      console.warn("[SquareBuyer] customer lookup failed:", e?.message);
    }
  }

  // Last resort for the name: the cardholder name (usually blank for Apple Pay / contactless)
  if (!out.firstName && !out.lastName) {
    const n = splitName(clean(payment.cardDetails?.card?.cardholderName));
    out.firstName = n.first;
    out.lastName = n.last;
  }

  console.log(`[SquareBuyer] payment ${paymentId}: email=${!!out.email} phone=${!!out.phone} name=${!!(out.firstName || out.lastName)} address=${!!out.address} card=${out.cardBrand || "-"}${out.last4 ? " ****" + out.last4 : ""}`);
  return out;
}

/** One line for the order notes so a return can be matched to the card/receipt even with no customer details. */
export function buyerNotesLine(b: BuyerDetails): string {
  const bits: string[] = [];
  if (b.cardBrand || b.last4) bits.push(`Card: ${[b.cardBrand, b.last4 ? "ending " + b.last4 : ""].filter(Boolean).join(" ")}`);
  if (b.receiptNumber) bits.push(`Square receipt ${b.receiptNumber}`);
  if (b.receiptUrl) bits.push(b.receiptUrl);
  if (b.address) bits.push(`Address given: ${b.address}`);
  return bits.join(" | ");
}
