// Single source of truth for the reseller-EPOS catalogue promo — imported by
// the marketing display (PromoTakeover/PromoBanner), the EPOS cart/checkout
// pricing (ResellerEPOS), and the server-side checkout route, so the
// advertised discount and the one actually charged can never drift apart.

export const PROMO_START = new Date("2026-09-12T00:00:00");
export const PROMO_END = new Date("2026-10-11T23:59:59");
export const DISCOUNT_PCT = 25;

// Master switch — live for every reseller except those listed below.
export const PROMO_LIVE = true;

// Resellers that never get the promo (display, cart price or charge). Both the
// reseller id and its login user id are listed because different EPOS
// endpoints identify the same reseller by one or the other.
export const PROMO_EXCLUDED_RESELLER_IDS: ReadonlySet<string> = new Set([
  "de641ddb-254f-4c47-9a39-94ac1e0ee3b8", // First Rep Dummy_Form (reseller id)
  "f58826b2-f523-442d-a52a-e22c6fb48188", // First Rep Dummy_Form (user id)
]);

export function isPromoExcluded(
  resellerIds: ReadonlyArray<string | null | undefined>,
): boolean {
  return resellerIds.some((id) => !!id && PROMO_EXCLUDED_RESELLER_IDS.has(id));
}

export function isPromoActive(
  now: Date = new Date(),
  resellerIds: ReadonlyArray<string | null | undefined> = [],
): boolean {
  if (isPromoExcluded(resellerIds)) return false;
  return PROMO_LIVE && now >= PROMO_START && now <= PROMO_END;
}

// Percentage off 1stRep catalogue products right now (0 outside the window).
// Never applies to a reseller's own products.
export function getActivePromoDiscountPct(
  now: Date = new Date(),
  resellerIds: ReadonlyArray<string | null | undefined> = [],
): number {
  return isPromoActive(now, resellerIds) ? DISCOUNT_PCT : 0;
}
