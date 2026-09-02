import { useEffect, useMemo, useState } from "react";
import { convertToDirectUrl, handleImageError } from "@/lib/imageUtils";
import { formatCurrency } from "@/lib/utils";
import { Search, User, ShoppingCart, Shirt, Smartphone, Sparkles } from "lucide-react";

// ─── Promo window ───────────────────────────────────────────────────────────
const PROMO_START = new Date("2026-09-12T00:00:00");
const PROMO_END = new Date("2026-10-11T23:59:59");
const DISCOUNT_PCT = 25;

// Master switch — live for every reseller.
const PROMO_LIVE = true;

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
  storeLogoUrl?: string | null;
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
        className="min-w-[5.5rem] xl:min-w-[7rem] px-4 py-3 bg-black border border-yellow-400/40 rounded-lg text-center shadow-[0_0_30px_rgba(250,204,21,0.1)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span className="text-6xl xl:text-7xl text-white leading-none" style={ANTON}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs xl:text-sm tracking-[0.22em] uppercase text-yellow-200/70 font-semibold">
        {label}
      </span>
    </div>
  );
}

export default function PromoTakeover({ storeName, storeLogoUrl, products, onExit }: PromoTakeoverProps) {
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

  const marqueeProducts = useMemo(
    () => products.filter((p) => p.imageUrl && p.productType !== "own_product").slice(0, 14),
    [products],
  );
  const loopProducts = marqueeProducts.length > 0 ? [...marqueeProducts, ...marqueeProducts] : [];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] overflow-y-auto cursor-pointer select-none flex flex-col"
      onClick={onExit}
      data-testid="promo-takeover"
    >
      {isPreview && (
        <div className="fixed top-2 right-2 z-20 text-[0.6rem] tracking-[0.15em] uppercase font-bold text-black bg-yellow-400 px-2 py-0.5 rounded-sm">
          Preview
        </div>
      )}

      {/* Full-height background — two real 1stRep campaign photos (not any one
          reseller's premises, so it works for every gym) slowly Ken-Burns and
          cross-fade behind the entire screen, not just the header band. */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://1strep.com/public-objects/013e23ef-a7d1-4eb8-a03e-bcfb0f8ca397.jpg"
          alt=""
          className="promo-bg-photo absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 20%", animation: "promoBgFadeA 16s ease-in-out infinite, promoBgKenA 16s ease-in-out infinite" }}
        />
        <img
          src="https://1strep.com/public-objects/Grey_1.jpg"
          alt=""
          className="promo-bg-photo absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 15%", opacity: 0, animation: "promoBgFadeB 16s ease-in-out infinite, promoBgKenB 16s ease-in-out infinite" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 88% 0%, rgba(250,204,21,0.14), transparent 55%), " +
              "linear-gradient(180deg, rgba(6,6,6,0.72) 0%, rgba(6,6,6,0.42) 16%, rgba(6,6,6,0.5) 40%, rgba(6,6,6,0.68) 62%, rgba(6,6,6,0.9) 82%, #0a0a0a 100%), " +
              "linear-gradient(90deg, rgba(6,6,6,0.35) 0%, transparent 26%, transparent 60%, rgba(6,6,6,0.55) 82%, #0a0a0a 100%)",
          }}
        />
      </div>

      <div className="relative z-10 shrink-0 overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-6 xl:px-10 pt-8 flex flex-col">
          {/* Dual-brand header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <img
              src="/1strep-header-logo.png"
              alt="1stRep"
              className="h-12 xl:h-16 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            />
            {storeLogoUrl ? (
              <div className="flex flex-col items-end gap-2 max-w-[60%]">
                <img
                  src={storeLogoUrl}
                  alt={storeName}
                  className="h-12 xl:h-16 w-auto max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-white/70 text-sm xl:text-base uppercase text-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" style={ANTON}>
                  {storeName}
                </p>
              </div>
            ) : (
              <p className="text-white text-4xl xl:text-5xl uppercase leading-[0.95] text-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] max-w-[60%]" style={ANTON}>
                {storeName}
              </p>
            )}
          </div>
          <div className="h-px w-40 bg-white/30 mb-5" />

          <p className="text-yellow-100/80 text-sm xl:text-base tracking-[0.25em] uppercase font-semibold mb-2">
            Official Retail Partner
          </p>
          <p
            className="text-white uppercase text-3xl xl:text-4xl mb-6"
            style={{ ...ANTON, fontStyle: "italic" }}
          >
            The Exclusive Offer {promoActive ? "Ends In" : "Starts In"}
          </p>

          <div className="flex items-center gap-3 xl:gap-4">
            <ClockTile value={days} label="Days" />
            <span className="text-yellow-400/40 pb-6 text-4xl xl:text-5xl" style={ANTON}>:</span>
            <ClockTile value={hours} label="Hrs" />
            <span className="text-yellow-400/40 pb-6 text-4xl xl:text-5xl" style={ANTON}>:</span>
            <ClockTile value={minutes} label="Mins" />
            <span className="text-yellow-400/40 pb-6 text-4xl xl:text-5xl" style={ANTON}>:</span>
            <ClockTile value={seconds} label="Secs" />
          </div>
        </div>
      </div>

      {/* Two-column body: offer details on the left, kiosk device on the right —
          same full-height photo behind it, no separate background of its own */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="relative w-full max-w-3xl mx-auto px-6 xl:px-10 py-8 flex gap-6 items-start flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-[15rem]">
            <div className="mb-7">
              <div className="bg-white text-black px-6 py-4 mb-1.5" style={{ transform: "skewX(-6deg)" }}>
                <p className="text-6xl xl:text-7xl leading-none" style={{ ...ANTON, transform: "skewX(6deg)" }}>
                  {DISCOUNT_PCT}% OFF
                </p>
              </div>
              <div className="bg-white/95 text-black px-6 py-3" style={{ transform: "skewX(-6deg)" }}>
                <p className="text-base xl:text-lg uppercase font-bold" style={{ transform: "skewX(6deg)" }}>
                  Only available through this gym&rsquo;s <span className="normal-case">1st</span> Rep POS
                </p>
              </div>
            </div>

            <p className="text-white text-2xl xl:text-3xl mb-6" style={ANTON}>
              12 September &mdash; 11 October
            </p>

            <div className="space-y-5">
              {[
                { key: "members", Icon: User, line: <>Exclusive to {storeName} members</> },
                { key: "pos", Icon: ShoppingCart, line: <>Available only through this gym&rsquo;s <span className="normal-case">1st</span> Rep POS</> },
                { key: "new", Icon: Shirt, line: <>New products, exclusive offers, just for you</> },
              ].map(({ key, Icon, line }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-full border border-white/50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 xl:w-6 xl:h-6 text-white" strokeWidth={1.75} />
                  </div>
                  <span className="text-white/85 text-base xl:text-lg uppercase tracking-wide leading-snug">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kiosk device mockup — the actual in-gym 1st REP POS, showing this store's real inventory */}
          {gridProducts.length > 0 && (
            <div className="w-[15.5rem] xl:w-[18rem] shrink-0">
              <div className="rounded-xl border-[3px] border-black bg-black shadow-[0_20px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10 overflow-hidden">
                <div className="bg-[#0d0d0d] px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm font-bold uppercase tracking-wide truncate">{storeName}</span>
                    <Search className="w-4 h-4 text-white/40 shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {gridProducts.slice(0, 6).map((p) => {
                      const retail = parseFloat(p.retailPrice);
                      const discounted = retail * (1 - DISCOUNT_PCT / 100);
                      return (
                        <div key={p.id} className="bg-white/5 rounded-md overflow-hidden">
                          <img
                            src={convertToDirectUrl(p.imageUrl!)}
                            alt={p.name}
                            className="w-full aspect-square object-cover"
                            onError={handleImageError}
                          />
                          <div className="px-1.5 py-1">
                            <p className="text-white text-[0.7rem] font-semibold truncate leading-tight">{p.name}</p>
                            <span className="text-yellow-400 text-xs font-bold">{formatCurrency(discounted)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-3 text-white/30">
                  <div className="w-1.5 h-1.5 rounded-full border border-current" />
                  <div className="w-2.5 h-2.5 rounded-full border border-current" />
                  <div className="w-4 h-4 rounded-full border border-current" />
                </div>
                <div className="bg-black pb-4 flex items-center justify-center">
                  <img src="/1strep-header-logo.png" alt="1st REP" className="h-7 xl:h-8 w-auto" />
                </div>
              </div>
              <p className="text-center text-yellow-200/40 text-xs tracking-[0.15em] uppercase mt-3 font-semibold leading-snug">
                Right here in your gym
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA banner */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 xl:px-10 pb-8 pt-6">
        <div className="border border-yellow-400/40 px-6 py-5 flex items-center justify-between gap-4">
          <Smartphone className="w-6 h-6 text-white/70 shrink-0" strokeWidth={1.5} />
          <p className="text-white text-center text-lg xl:text-xl uppercase" style={ANTON}>
            Shop at the <span className="normal-case">1st</span> Rep POS &mdash; Right Here In Your Gym
          </p>
          <Sparkles className="w-6 h-6 text-yellow-400/70 shrink-0" strokeWidth={1.5} />
        </div>
      </div>

      {/* Rolling reel of this store's real inventory at 25% off, edge-to-edge */}
      {loopProducts.length > 0 && (
        <div className="relative z-10 shrink-0 border-y border-yellow-400/15 py-4 overflow-hidden mb-8 bg-[#0a0a0a]/40">
          <div className="flex items-center gap-8 w-max animate-[promoScroll_32s_linear_infinite]">
            {loopProducts.map((p, i) => {
              const retail = parseFloat(p.retailPrice);
              const discounted = retail * (1 - DISCOUNT_PCT / 100);
              return (
                <div key={`${p.id}-${i}`} className="flex items-center gap-3 shrink-0 pr-8 border-r border-white/10 last:border-r-0">
                  <img
                    src={convertToDirectUrl(p.imageUrl!)}
                    alt={p.name}
                    className="w-16 h-16 object-cover rounded-md border border-white/10"
                    onError={handleImageError}
                  />
                  <div className="leading-tight">
                    <p className="text-white text-sm font-semibold whitespace-nowrap max-w-[12rem] truncate">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white/35 text-xs line-through">{formatCurrency(retail)}</span>
                      <span className="text-yellow-400 text-sm font-bold">{formatCurrency(discounted)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="relative z-10 text-center text-yellow-200/40 text-sm tracking-[0.3em] uppercase pb-16">
        Tap anywhere to shop
      </p>
    </div>
  );
}
