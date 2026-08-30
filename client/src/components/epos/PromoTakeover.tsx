import { useEffect, useMemo, useState } from "react";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { formatCurrency } from "@/lib/utils";

// ─── Promo window ───────────────────────────────────────────────────────────
const PROMO_START = new Date("2026-09-12T00:00:00");
const PROMO_END = new Date("2026-10-11T23:59:59");
const DISCOUNT_PCT = 25;

// Master switch — flip to true once the design has been approved and the
// takeover should go live for every reseller. Until then it only renders
// when a URL carries ?promoPreview=1, so real resellers never see it.
const PROMO_LIVE = false;

const ANTON = { fontFamily: "'Anton', 'Barlow Condensed', sans-serif" } as const;

interface PromoProduct {
  id: string;
  name: string;
  retailPrice: string;
  imageUrl?: string;
  productType?: string;
}

interface PromoTakeoverProps {
  storeName: string;
  products: PromoProduct[];
  onExit: () => void;
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

function ClockTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="min-w-[4.2rem] xl:min-w-[5.5rem] px-3 py-2 bg-black border border-amber-400/40 rounded-lg text-center shadow-[0_0_30px_rgba(245,158,11,0.08)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span className="text-3xl xl:text-5xl text-white leading-none" style={ANTON}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-[0.65rem] xl:text-xs tracking-[0.25em] uppercase text-amber-200/70 font-semibold">
        {label}
      </span>
    </div>
  );
}

export default function PromoTakeover({ storeName, products, onExit }: PromoTakeoverProps) {
  const now = useNow();

  const isPreview = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("promoPreview") === "1";
  }, []);

  const promoActive = now >= PROMO_START && now <= PROMO_END;
  const promoUpcoming = now < PROMO_START;
  const shouldRender = (PROMO_LIVE || isPreview) && (promoActive || promoUpcoming);
  if (!shouldRender) return null;

  const targetDate = promoActive ? PROMO_END : PROMO_START;
  const { days, hours, minutes, seconds } = splitDuration(targetDate.getTime() - now.getTime());

  const gridProducts = useMemo(
    () => products.filter((p) => p.imageUrl && p.productType !== "own_product").slice(0, 9),
    [products],
  );

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] overflow-y-auto cursor-pointer select-none"
      onClick={onExit}
      data-testid="promo-takeover"
    >
      {isPreview && (
        <div className="fixed top-2 right-2 z-10 text-[0.6rem] tracking-[0.15em] uppercase font-bold text-black bg-amber-400 px-2 py-0.5 rounded-sm">
          Preview
        </div>
      )}

      {/* Amber gym-light glow, standing in for the team's photo until a clean one is supplied */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(90% 60% at 10% 0%, rgba(245,158,11,0.20) 0%, transparent 55%), " +
            "radial-gradient(80% 50% at 100% 30%, rgba(245,158,11,0.12) 0%, transparent 55%), " +
            "radial-gradient(70% 40% at 20% 100%, rgba(245,158,11,0.10) 0%, transparent 55%)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 xl:px-10 pt-10 pb-16">
        {/* Dual-brand header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 xl:w-14 xl:h-14 rounded-lg bg-white text-black flex items-center justify-center shrink-0" style={ANTON}>
              <span className="text-lg xl:text-2xl">1<sup className="text-[0.5em]">st</sup></span>
            </div>
            <span className="text-white text-xl xl:text-2xl" style={ANTON}>REP</span>
          </div>
          <div className="text-right">
            <p className="text-white text-lg xl:text-2xl uppercase leading-tight" style={ANTON}>
              {storeName}
            </p>
            <p className="text-amber-200/50 text-[0.65rem] xl:text-xs tracking-[0.2em] uppercase font-semibold mt-1">
              Official Retail Partner
            </p>
          </div>
        </div>

        {/* Live countdown */}
        <p
          className="text-white text-center uppercase text-lg xl:text-2xl mb-5"
          style={{ ...ANTON, fontStyle: "italic" }}
        >
          The Exclusive Offer {promoActive ? "Ends In" : "Starts In"}
        </p>
        <div className="flex items-center justify-center gap-2 xl:gap-4 mb-10">
          <ClockTile value={days} label="Days" />
          <span className="text-amber-400/40 pb-6" style={ANTON}>:</span>
          <ClockTile value={hours} label="Hrs" />
          <span className="text-amber-400/40 pb-6" style={ANTON}>:</span>
          <ClockTile value={minutes} label="Mins" />
          <span className="text-amber-400/40 pb-6" style={ANTON}>:</span>
          <ClockTile value={seconds} label="Secs" />
        </div>

        {/* Big diagonal 25% OFF card */}
        <div className="mb-6">
          <div
            className="bg-white text-black px-6 py-4 mb-1"
            style={{ transform: "skewX(-6deg)" }}
          >
            <p className="text-5xl xl:text-7xl leading-none" style={{ ...ANTON, transform: "skewX(6deg)" }}>
              {DISCOUNT_PCT}% OFF
            </p>
          </div>
          <div
            className="bg-white/95 text-black px-6 py-3"
            style={{ transform: "skewX(-6deg)" }}
          >
            <p className="text-sm xl:text-lg uppercase font-bold" style={{ transform: "skewX(6deg)" }}>
              Only available through this gym's 1st REP POS
            </p>
          </div>
        </div>

        <p className="text-white text-xl xl:text-3xl mb-6" style={ANTON}>
          12 September &mdash; 11 October
        </p>

        {/* Bullets */}
        <div className="space-y-3 mb-8">
          {[
            `Exclusive to ${storeName} members`,
            "Available only via your in-gym 1st REP retail hub",
            "New products, exclusive offers, just for you",
          ].map((line) => (
            <div key={line} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-white/85 text-sm xl:text-base uppercase tracking-wide">{line}</span>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="border border-amber-400/40 px-5 py-4 mb-10 flex items-center justify-center">
          <p className="text-white text-center text-sm xl:text-lg uppercase" style={ANTON}>
            Shop at the 1st Rep POS &mdash; Right Here In Your Gym
          </p>
        </div>

        {/* Real, discounted inventory grid */}
        {gridProducts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 xl:gap-4 mb-10">
            {gridProducts.map((p) => {
              const retail = parseFloat(p.retailPrice);
              const discounted = retail * (1 - DISCOUNT_PCT / 100);
              return (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <img
                    src={convertToDirectUrl(p.imageUrl!)}
                    alt={p.name}
                    className="w-full aspect-square object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
                  />
                  <div className="p-2">
                    <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-white/35 text-[0.65rem] line-through">{formatCurrency(retail)}</span>
                      <span className="text-amber-400 text-xs font-bold">{formatCurrency(discounted)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-amber-200/40 text-xs tracking-[0.3em] uppercase">
          Tap anywhere to shop
        </p>
      </div>
    </div>
  );
}
