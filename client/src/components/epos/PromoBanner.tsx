import { useEffect, useMemo, useState } from "react";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { formatCurrency } from "@/lib/utils";

// ─── Promo window ───────────────────────────────────────────────────────────
const PROMO_START = new Date("2026-09-12T00:00:00");
const PROMO_END = new Date("2026-10-11T23:59:59");
const DISCOUNT_PCT = 25;

// Master switch — the design has been approved; the banner is now live for
// every reseller (each shows their own business name/logo via storeName /
// storeLogoUrl, not a fixed store).
const PROMO_LIVE = true;

const ANTON = { fontFamily: "'Anton', 'Barlow Condensed', sans-serif" } as const;

interface PromoProduct {
  id: string;
  name: string;
  retailPrice: string;
  imageUrl?: string;
  productType?: string;
}

interface PromoBannerProps {
  storeName: string;
  storeLogoUrl?: string | null;
  products: PromoProduct[];
  onClick?: () => void;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function splitDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function CountdownTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="min-w-[2.75rem] px-2 py-1 bg-black border border-yellow-400/40 rounded-md text-center"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span className="text-lg xl:text-xl text-yellow-400 leading-none" style={ANTON}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1 text-[0.6rem] tracking-[0.18em] uppercase text-yellow-200/60 font-semibold">
        {label}
      </span>
    </div>
  );
}

export default function PromoBanner({ storeName, storeLogoUrl, products, onClick }: PromoBannerProps) {
  const now = useNow();

  const isPreview = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("promoPreview") === "1";
  }, []);

  const promoActive = now >= PROMO_START && now <= PROMO_END;
  const promoUpcoming = now < PROMO_START;

  // Preview mode ignores the live-window gate so it can be reviewed ahead of Sept 12,
  // but still respects the real dates for what phase (starts-in vs ends-in) it shows.
  const shouldRender = (PROMO_LIVE && (promoActive || promoUpcoming)) || (isPreview && (promoActive || promoUpcoming || now > PROMO_END));
  if (!shouldRender) return null;

  const targetDate = promoActive ? PROMO_END : PROMO_START;
  const { days, hours, minutes, seconds } = splitDuration(targetDate.getTime() - now.getTime());

  const marqueeProducts = useMemo(
    () => products.filter((p) => p.imageUrl && p.productType !== "own_product").slice(0, 14),
    [products],
  );
  const loopProducts = marqueeProducts.length > 0 ? [...marqueeProducts, ...marqueeProducts] : [];

  return (
    <div
      className={`relative z-40 border-y border-yellow-400/25 overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      style={{
        background:
          "radial-gradient(120% 220% at 12% -20%, rgba(250,204,21,0.20) 0%, transparent 55%), " +
          "radial-gradient(120% 220% at 88% 120%, rgba(250,204,21,0.14) 0%, transparent 55%), #0a0a0a",
      }}
      data-testid="promo-banner"
    >
      {/* Thin yellow highlight line, matching the poster's card treatment */}
      <div
        className="absolute left-6 right-6 top-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(250,204,21,0.55), transparent)" }}
      />

      {isPreview && (
        <div className="absolute top-1 right-2 z-10 text-[0.55rem] tracking-[0.15em] uppercase font-bold text-black bg-yellow-400 px-1.5 py-0.5 rounded-sm">
          Preview
        </div>
      )}

      {/* Top row — headline + live countdown */}
      <div className="flex items-center justify-between gap-4 px-4 xl:px-8 py-2.5 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 bg-white text-black text-xs xl:text-sm px-3 py-1"
            style={{ ...ANTON, fontStyle: "italic", transform: "skewX(-8deg)", letterSpacing: "0.01em" }}
          >
            <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>{DISCOUNT_PCT}% OFF</span>
          </div>
          {storeLogoUrl && (
            <img
              src={storeLogoUrl}
              alt={storeName}
              className="h-6 xl:h-8 w-auto max-w-[6rem] object-contain shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <p
            className="text-white uppercase text-sm xl:text-base truncate"
            style={{ ...ANTON, fontStyle: "italic", letterSpacing: "0.01em" }}
          >
            {storeName} Exclusive Sale
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-yellow-200/60 text-[0.65rem] tracking-[0.14em] uppercase font-semibold">
            {promoActive ? "Ends in" : "Starts in"}
          </span>
          <div className="flex items-center gap-1.5">
            <CountdownTile value={days} label="Days" />
            <span className="text-yellow-400/40 font-black pb-4">:</span>
            <CountdownTile value={hours} label="Hrs" />
            <span className="text-yellow-400/40 font-black pb-4">:</span>
            <CountdownTile value={minutes} label="Min" />
            <span className="text-yellow-400/40 font-black pb-4">:</span>
            <CountdownTile value={seconds} label="Sec" />
          </div>
        </div>
      </div>

      {/* Bottom row — rolling marquee of real, discounted inventory */}
      {loopProducts.length > 0 && (
        <div className="border-t border-yellow-400/15 py-2 overflow-hidden">
          <div
            className="promo-scroll-track flex items-center gap-6 w-max animate-[promoScroll_28s_linear_infinite]"
          >
            {loopProducts.map((p, i) => {
              const retail = parseFloat(p.retailPrice);
              const discounted = retail * (1 - DISCOUNT_PCT / 100);
              return (
                <div key={`${p.id}-${i}`} className="flex items-center gap-2.5 shrink-0 pr-6 border-r border-white/10 last:border-r-0">
                  {p.imageUrl && (
                    <img
                      src={convertToDirectUrl(p.imageUrl)}
                      alt={p.name}
                      className="w-9 h-9 object-cover rounded-md border border-white/10"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                    />
                  )}
                  <div className="leading-tight">
                    <p className="text-white text-xs font-semibold whitespace-nowrap max-w-[10rem] truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/35 text-[0.65rem] line-through">{formatCurrency(retail)}</span>
                      <span className="text-yellow-400 text-xs font-bold">{formatCurrency(discounted)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
