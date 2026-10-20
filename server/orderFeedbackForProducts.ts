/**
 * Order feedback -> product pages
 *
 * Customers leave feedback on the whole order (order_reviews). This module
 * turns good feedback into review-shaped entries on the products that were in
 * that order, so it appears on the product page automatically.
 *
 * Rules (conservative, so a comment is never shown on a product it isn't about):
 *  - rating 4 or 5, and the customer didn't say they would NOT recommend us
 *  - has a real written comment (10+ characters)
 *  - not hidden by an admin (order_reviews.hide_from_products)
 *  - order contains the product, and either
 *      * the order has only one distinct product, or
 *      * the comment names that product (e.g. "river pocket") or its type
 *        (e.g. "leggings", "hoodie"), so a comment about leggings only goes
 *        on the leggings in a mixed order.
 *  - only the customer's first name + last initial is shown, never the email.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";

export interface OrderFeedbackReview {
  id: string;
  productId: string;
  userId: null;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userFirstName: string;
  userLastName: string;
  source: "order_feedback";
}

// Words that identify the kind of garment; singular + plural + common variants.
const TYPE_WORDS: Array<{ type: string; pattern: RegExp }> = [
  { type: "leggings", pattern: /\b(leggings?|tights?)\b/i },
  { type: "bra", pattern: /\b(bras?|sports bras?)\b/i },
  { type: "hoodie", pattern: /\b(hoodies?|hoody|hoodys)\b/i },
  { type: "shorts", pattern: /\bshorts?\b/i },
  { type: "tank", pattern: /\b(tanks?|vests?)\b/i },
  { type: "tee", pattern: /\b(tees?|t-?shirts?)\b/i },
  { type: "sweater", pattern: /\b(sweaters?|sweatshirts?|jumpers?)\b/i },
  { type: "jacket", pattern: /\b(jackets?|pullovers?)\b/i },
  { type: "hat", pattern: /\b(hats?|caps?)\b/i },
  { type: "socks", pattern: /\bsocks?\b/i },
];

function productTypes(productName: string): string[] {
  const name = productName.toLowerCase();
  const types: string[] = [];
  for (const t of TYPE_WORDS) {
    if (t.pattern.test(name)) types.push(t.type);
  }
  // "Poly Tech T", "Atom Casual T", "Echo Cropped T": trailing single "T" = tee
  if (/\bt$/i.test(name.trim()) && !types.includes("tee")) types.push("tee");
  return types;
}

function commentMentionsProduct(comment: string, productName: string): boolean {
  const text = comment.toLowerCase();
  const name = productName.toLowerCase().replace(/^1r\s+/, "").trim();
  // Distinctive name words, e.g. "river pocket" from "River Pocket Leggings"
  const nameWords = name
    .split(/\s+/)
    .filter((w) => w.length > 3 && !TYPE_WORDS.some((t) => t.pattern.test(w)));
  if (nameWords.length > 0 && nameWords.every((w) => text.includes(w))) return true;
  const types = productTypes(productName);
  return TYPE_WORDS.some((t) => types.includes(t.type) && t.pattern.test(comment));
}

function displayName(first: string | null, last: string | null): { first: string; last: string } {
  const f = (first || "").trim();
  const l = (last || "").trim();
  const firstName = f ? f.charAt(0).toUpperCase() + f.slice(1) : "Verified";
  const lastInitial = l ? `${l.charAt(0).toUpperCase()}.` : f ? "" : "Customer";
  return { first: firstName, last: lastInitial };
}

/** Make sure the admin "hide from products" column exists (safe to run repeatedly). */
export async function ensureOrderFeedbackColumns(): Promise<void> {
  await db.execute(sql`ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS hide_from_products BOOLEAN NOT NULL DEFAULT FALSE`);
}

/** Good order feedback that qualifies to show on the given product's page. */
export async function getOrderFeedbackForProduct(productId: string): Promise<OrderFeedbackReview[]> {
  const result = await db.execute(sql`
    SELECT r.id, r.overall_rating, r.comment, r.created_at,
           o.customer_first_name, o.customer_last_name,
           i.product_name,
           (SELECT COUNT(DISTINCT COALESCE(x.product_id, x.product_name))
              FROM customer_order_items x WHERE x.order_id = r.order_id) AS distinct_products
      FROM order_reviews r
      JOIN customer_orders o ON o.id = r.order_id
      JOIN customer_order_items i ON i.order_id = r.order_id AND i.product_id = ${productId}
     WHERE r.overall_rating >= 4
       AND r.would_recommend IS DISTINCT FROM FALSE
       AND r.hide_from_products = FALSE
       AND LENGTH(TRIM(COALESCE(r.comment, ''))) >= 10
     ORDER BY r.created_at DESC
  `);

  const seen = new Set<string>();
  const out: OrderFeedbackReview[] = [];
  for (const row of result.rows as any[]) {
    if (seen.has(row.id)) continue;
    const comment = String(row.comment).trim();
    const single = Number(row.distinct_products) <= 1;
    if (!single && !commentMentionsProduct(comment, String(row.product_name))) continue;
    seen.add(row.id);
    const n = displayName(row.customer_first_name, row.customer_last_name);
    out.push({
      id: `of_${row.id}`,
      productId,
      userId: null,
      rating: Number(row.overall_rating),
      comment,
      isVerifiedPurchase: true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
      userName: `${n.first} ${n.last}`.trim(),
      userFirstName: n.first,
      userLastName: n.last,
      source: "order_feedback",
    });
  }
  return out;
}
