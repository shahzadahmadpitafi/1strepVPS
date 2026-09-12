// Single source of truth for the reseller-EPOS catalogue promo — imported by
// the marketing display (PromoTakeover/PromoBanner), the EPOS cart/checkout
// pricing (ResellerEPOS), and the server-side checkout route, so the
// advertised discount and the one actually charged can never drift apart.

export const PROMO_START = new Date("2026-09-12T00:00:00");
export const PROMO_END = new Date("2026-10-11T23:59:59");
export const DISCOUNT_PCT = 25;

// Master switch — live for every reseller.
export const PROMO_LIVE = true;

export function isPromoActive(now: Date = new Date()): boolean {
  return PROMO_LIVE && now >= PROMO_START && now <= PROMO_END;
}

// Percentage off 1stRep catalogue products right now (0 outside the window).
// Never applies to a reseller's own products.
export function getActivePromoDiscountPct(now: Date = new Date()): number {
  return isPromoActive(now) ? DISCOUNT_PCT : 0;
}
