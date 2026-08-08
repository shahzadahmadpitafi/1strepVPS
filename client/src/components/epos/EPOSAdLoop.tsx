import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { convertToDirectUrl } from "@/lib/imageUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  productType?: string;
}

interface EPOSAdLoopProps {
  products: AdProduct[];
  storeName?: string;
  onExit: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDE_MS = 6000;
const ATTRACT_MS = 7000;

const TAGLINES = [
  "Performance. Style. Edge.",
  "Engineered for Every Rep.",
  "Train Hard. Look the Part.",
  "Wear What Works.",
  "Forged in the Gym.",
  "Lift Higher. Go Further.",
];

const BRAND_COPY = [
  {
    headline: "Built for Performance",
    body: "Every piece in the 1stRep collection is engineered to move with you — session after session, set after set.",
  },
  {
    headline: "Train Different",
    body: "Tactical aesthetics meet technical fabric. The range built for those who don't stop.",
  },
  {
    headline: "The 1stRep Collection",
    body: "Explore the full range in-store today. Ask a team member for sizing and availability.",
  },
];

// ─── Accent colour palette (used on decorative elements, NEVER text) ──────────
// Each entry: [primary hex, rgb for rgba()]
const ACCENT_PALETTE: Array<{ hex: string; rgb: string; label: string }> = [
  { hex: "#3B82F6", rgb: "59,130,246",  label: "electric-blue"  },
  { hex: "#06B6D4", rgb: "6,182,212",   label: "cyan"           },
  { hex: "#34D399", rgb: "52,211,153",  label: "emerald"        },
  { hex: "#F59E0B", rgb: "245,158,11",  label: "amber"          },
  { hex: "#A78BFA", rgb: "167,139,250", label: "violet"         },
  { hex: "#F472B6", rgb: "244,114,182", label: "rose"           },
  { hex: "#FB923C", rgb: "251,146,60",  label: "orange"         },
  { hex: "#38BDF8", rgb: "56,189,248",  label: "sky"            },
];

function categoryAccent(category: string, categories: string[]): typeof ACCENT_PALETTE[0] {
  const idx = categories.indexOf(category);
  return ACCENT_PALETTE[(idx < 0 ? 0 : idx) % ACCENT_PALETTE.length];
}

// ─── Playlist types ───────────────────────────────────────────────────────────

type Slide =
  | { type: "category-header"; category: string; count: number; accent: typeof ACCENT_PALETTE[0] }
  | { type: "product"; product: AdProduct; tagline: string; accent: typeof ACCENT_PALETTE[0] }
  | { type: "brand"; copy: (typeof BRAND_COPY)[0] };

// ─── Utilities ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPlaylist(products: AdProduct[], categories: string[]): Slide[] {
  const grouped = new Map<string, AdProduct[]>();
  for (const p of products) {
    const cat = p.category || "Collection";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(p);
  }

  const tagPool = shuffle([...TAGLINES, ...TAGLINES, ...TAGLINES]);
  let tagIdx = 0;
  let brandIdx = 0;
  const slides: Slide[] = [];
  let catNum = 0;

  for (const [category, prods] of grouped) {
    const accent = categoryAccent(category, categories);

    slides.push({ type: "category-header", category, count: prods.length, accent });

    for (const p of prods.slice(0, 4)) {
      slides.push({ type: "product", product: p, tagline: tagPool[tagIdx++ % tagPool.length], accent });
    }

    if ((catNum + 1) % 2 === 0) {
      slides.push({ type: "brand", copy: BRAND_COPY[brandIdx++ % BRAND_COPY.length] });
    }
    catNum++;
  }

  if (slides.length > 0 && !slides.some(s => s.type === "brand")) {
    slides.push({ type: "brand", copy: BRAND_COPY[0] });
  }

  return slides;
}

// ─── Brand mark ───────────────────────────────────────────────────────────────

function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const [failed, setFailed] = useState(false);
  const h = { sm: "h-8 xl:h-10", md: "h-12 xl:h-16", lg: "h-20 xl:h-28 2xl:h-32" };
  const t = { sm: "text-2xl", md: "text-4xl", lg: "text-6xl xl:text-7xl 2xl:text-8xl" };
  return failed ? (
    <span className={`font-black text-white tracking-tight uppercase ${t[size]}`}>1stRep</span>
  ) : (
    <img
      src="/1strep-header-logo.png"
      alt="1stRep"
      className={`${h[size]} w-auto drop-shadow-2xl`}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Shared decorative elements ───────────────────────────────────────────────

function CornerBrackets({ accent }: { accent?: typeof ACCENT_PALETTE[0] }) {
  const color = accent ? `rgba(${accent.rgb},0.45)` : "rgba(255,255,255,0.2)";
  return (
    <>
      {[
        { pos: "top-10 left-10", b: "border-t border-l" },
        { pos: "top-10 right-10", b: "border-t border-r" },
        { pos: "bottom-10 left-10", b: "border-b border-l" },
        { pos: "bottom-10 right-10", b: "border-b border-r" },
      ].map(({ pos, b }, i) => (
        <motion.div
          key={i}
          className={`absolute w-12 h-12 ${pos} ${b}`}
          style={{ borderColor: color }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 + 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </>
  );
}

function ScanLine({ accent }: { accent?: typeof ACCENT_PALETTE[0] }) {
  const c = accent ? `rgba(${accent.rgb},0.5)` : "rgba(255,255,255,0.18)";
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none"
      style={{ background: `linear-gradient(to right, transparent, ${c}, transparent)` }}
      initial={{ top: "-2%" }}
      animate={{ top: "102%" }}
      transition={{ duration: 4, ease: "linear" }}
    />
  );
}

function FloatingDiamonds({ accent }: { accent?: typeof ACCENT_PALETTE[0] }) {
  const c = accent ? `rgba(${accent.rgb},0.35)` : "rgba(255,255,255,0.18)";
  return (
    <>
      {[{ x: "13%", y: "28%", s: 22, d: 0.7 }, { x: "82%", y: "23%", s: 14, d: 0.95 }, { x: "78%", y: "67%", s: 19, d: 1.2 }].map((dm, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: dm.x, top: dm.y, width: dm.s, height: dm.s, rotate: "45deg", border: `1px solid ${c}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0.4, 0.8] }}
          transition={{ delay: dm.d, duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function EPOSAdLoop({ products, storeName = "1stRep", onExit }: EPOSAdLoopProps) {
  const [phase, setPhase] = useState<"attract" | "loop">("attract");
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const wakeLockRef = useRef<any>(null);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);

  const adProducts = useMemo(
    () => products.filter(p => p.productType !== "own_product" && p.imageUrl),
    [products],
  );

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of adProducts) {
      const c = p.category || "Collection";
      if (!seen.has(c)) { seen.add(c); out.push(c); }
    }
    return out;
  }, [adProducts]);

  const playlist = useMemo(() => buildPlaylist(adProducts, categories), [adProducts, categories]);

  // Wake lock
  useEffect(() => {
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator)
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      } catch {}
    };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); wakeLockRef.current?.release(); };
  }, []);

  useEffect(() => {
    if (phase !== "attract") return;
    const t = setTimeout(() => {
      setPhase("loop"); setSlideIndex(0); setProgress(0); startRef.current = Date.now();
    }, ATTRACT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "loop" || playlist.length === 0) return;
    startRef.current = Date.now();
    setProgress(0);
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min((elapsed / SLIDE_MS) * 100, 100));
      if (elapsed >= SLIDE_MS) { startRef.current = Date.now(); setSlideIndex(prev => (prev + 1) % playlist.length); }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, slideIndex, playlist.length]);

  const handleExit = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    onExit();
  }, [onExit]);

  const current = playlist[slideIndex];
  const currentAccent = (current as any)?.accent as typeof ACCENT_PALETTE[0] | undefined;
  const progressColor = currentAccent ? currentAccent.hex : "rgba(255,255,255,0.7)";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0D0D0D] overflow-hidden cursor-none select-none"
      onClick={handleExit}
      onTouchStart={handleExit}
    >
      <AnimatePresence>
        {phase === "attract" && (
          <motion.div key="attract" className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <AttractScreen storeName={storeName} categories={categories} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "loop" && current?.type === "category-header" && (
          <motion.div key={`cat-${slideIndex}`} className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          >
            <CategoryHeaderSlide
              category={(current as any).category}
              count={(current as any).count}
              accent={(current as any).accent}
              storeName={storeName}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "loop" && current?.type === "product" && (
          <motion.div key={`prod-${slideIndex}`} className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <ProductSlide
              product={(current as any).product}
              tagline={(current as any).tagline}
              accent={(current as any).accent}
              storeName={storeName}
              slideNumber={slideIndex}
              totalSlides={adProducts.length}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "loop" && current?.type === "brand" && (
          <motion.div key={`brand-${slideIndex}`} className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <BrandSlide copy={(current as any).copy} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent TAP ANYWHERE TO SHOP — always visible on every slide and phase */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
        <motion.div
          className="flex items-center gap-4 mb-5"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="h-px w-10"
            animate={{ background: currentAccent
              ? [`rgba(${currentAccent.rgb},0.5)`, `rgba(${currentAccent.rgb},1)`, `rgba(${currentAccent.rgb},0.5)`]
              : ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.3)"]
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <p
            className="text-white font-bold uppercase tracking-[0.36em]"
            style={{ fontSize: "clamp(0.7rem, 1.3vw, 1rem)" }}
          >
            Tap Anywhere to Shop
          </p>
          <motion.div
            className="h-px w-10"
            animate={{ background: currentAccent
              ? [`rgba(${currentAccent.rgb},0.5)`, `rgba(${currentAccent.rgb},1)`, `rgba(${currentAccent.rgb},0.5)`]
              : ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.3)"]
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Progress bar — accent coloured, sits flush at very bottom */}
        {phase === "loop" && (
          <div className="w-full h-[3px] bg-white/10">
            <motion.div
              className="h-full"
              style={{ width: `${progress}%`, background: progressColor, transition: "width 0.08s linear" }}
              animate={{ opacity: currentAccent ? [0.8, 1, 0.8] : 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}
        {phase === "attract" && <div className="w-full h-[3px]" />}
      </div>
    </div>
  );
}

// ─── Attract Screen ───────────────────────────────────────────────────────────

function AttractScreen({ storeName, categories }: { storeName: string; categories: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (categories.length === 0) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % ACCENT_PALETTE.length), 2200);
    return () => clearInterval(t);
  }, [categories.length]);

  const cycleAccent = ACCENT_PALETTE[activeIdx % ACCENT_PALETTE.length];

  return (
    <div className="relative w-full h-full bg-[#0D0D0D] flex flex-col items-center justify-center overflow-hidden">

      {/* Cycling colour ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(ellipse 80% 60% at 50% 55%, rgba(${cycleAccent.rgb},0.14) 0%, transparent 70%)` }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />

      {/* Rotating outer ring — accent tinted */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "70vmin", height: "70vmin", border: `1px solid rgba(${cycleAccent.rgb},0.2)` }}
        animate={{ rotate: 360, borderColor: `rgba(${cycleAccent.rgb},0.2)` }}
        transition={{ rotate: { duration: 22, repeat: Infinity, ease: "linear" }, borderColor: { duration: 1.8, ease: "easeInOut" } }}
      >
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full blur-[2px]"
          animate={{ background: cycleAccent.hex }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Inner counter-ring */}
      <motion.div
        className="absolute rounded-full border border-white/06 pointer-events-none"
        style={{ width: "48vmin", height: "48vmin" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30 blur-[1px]" />
      </motion.div>

      <ScanLine accent={cycleAccent} />
      <CornerBrackets accent={cycleAccent} />

      {/* Website top */}
      <motion.p
        className="absolute top-12 z-10 text-white/35 text-sm tracking-[0.45em] uppercase font-medium"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        1stRep.com
      </motion.p>

      {/* Logo breathing */}
      <motion.div className="mb-10 z-10"
        initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <BrandMark size="lg" />
        </motion.div>
      </motion.div>

      {/* Accent rule */}
      <motion.div
        className="z-10 h-[2px] mb-8"
        animate={{ background: `linear-gradient(to right, transparent, ${cycleAccent.hex}, transparent)`, width: "10rem" }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
        initial={{ width: 0 }}
      />

      {/* Headline */}
      <div className="z-10 overflow-hidden mb-4">
        <motion.h1
          className="text-center font-black text-white uppercase tracking-[0.16em]"
          style={{ fontSize: "clamp(2rem, 5.5vw, 5.5rem)" }}
          initial={{ y: "110%" }} animate={{ y: "0%" }}
          transition={{ duration: 0.85, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          Discover the Collection
        </motion.h1>
      </div>

      <motion.p
        className="z-10 text-white/40 text-center tracking-wider mb-8 max-w-lg"
        style={{ fontSize: "clamp(0.85rem, 1.4vw, 1.2rem)" }}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.85 }}
      >
        Premium gymwear engineered for performance and built to last.
      </motion.p>

      {/* Category pills — each in their accent colour */}
      {categories.length > 0 && (
        <motion.div
          className="z-10 flex flex-wrap items-center justify-center gap-3 mb-10 px-16 max-w-4xl"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          {categories.map((cat, i) => {
            const a = ACCENT_PALETTE[i % ACCENT_PALETTE.length];
            return (
              <motion.span
                key={cat}
                className="px-4 py-1.5 text-white text-xs tracking-[0.2em] uppercase font-semibold"
                style={{ border: `1px solid rgba(${a.rgb},0.55)`, background: `rgba(${a.rgb},0.1)` }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.07, duration: 0.4 }}
              >
                {cat}
              </motion.span>
            );
          })}
        </motion.div>
      )}

      <motion.p
        className="absolute bottom-12 z-10 text-white/20 text-xs tracking-[0.35em] uppercase"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        {storeName}
      </motion.p>
    </div>
  );
}

// ─── Category Header Slide ────────────────────────────────────────────────────

function CategoryHeaderSlide({
  category, count, accent, storeName,
}: {
  category: string; count: number; accent: typeof ACCENT_PALETTE[0]; storeName: string;
}) {
  return (
    <div className="relative w-full h-full bg-[#0D0D0D] flex flex-col items-center justify-center overflow-hidden">

      {/* Accent ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(ellipse 75% 60% at 50% 50%, rgba(${accent.rgb},0.16) 0%, transparent 70%)` }}
      />

      {/* Accent rotating ring */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "72vmin", height: "72vmin", border: `1px solid rgba(${accent.rgb},0.2)` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full blur-[3px]"
          style={{ background: accent.hex }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
        backgroundSize: "60px 60px",
      }} />

      <ScanLine accent={accent} />
      <CornerBrackets accent={accent} />
      <FloatingDiamonds accent={accent} />

      <motion.p
        className="absolute top-12 z-10 text-white/30 text-sm tracking-[0.45em] uppercase font-medium"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        1stRep.com
      </motion.p>

      <div className="z-10 flex flex-col items-center text-center px-16">
        <motion.div className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <BrandMark size="md" />
        </motion.div>

        {/* Accent rule */}
        <motion.div
          className="mb-8 h-[2px]"
          style={{ background: `linear-gradient(to right, transparent, ${accent.hex}, transparent)` }}
          initial={{ width: 0 }} animate={{ width: "6rem" }}
          transition={{ duration: 0.7, delay: 0.2 }}
        />

        <div className="overflow-hidden mb-3">
          <motion.p
            className="text-white/40 tracking-[0.4em] uppercase text-xs xl:text-sm font-medium"
            initial={{ y: "110%" }} animate={{ y: "0%" }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            Now Featuring
          </motion.p>
        </div>

        {/* Category name — clip-path wipe */}
        <motion.h2
          className="font-black text-white uppercase tracking-[0.1em]"
          style={{
            fontSize: "clamp(3rem, 9vw, 10rem)",
            lineHeight: 1,
            clipPath: "inset(0 100% 0 0)",
          }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {category}
        </motion.h2>

        {/* Accent underline that draws after the name */}
        <motion.div
          className="mt-4 h-[3px]"
          style={{ background: accent.hex }}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.p
          className="text-white/35 mt-5 tracking-[0.25em] uppercase text-sm"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.65 }}
        >
          {count} {count === 1 ? "style" : "styles"} available in-store
        </motion.p>
      </div>

      <motion.p
        className="absolute bottom-12 z-10 text-white/20 text-xs tracking-[0.32em] uppercase"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.5 }}
      >
        {storeName}
      </motion.p>
    </div>
  );
}

// ─── Product Slide ─────────────────────────────────────────────────────────────

function ProductSlide({
  product, tagline, accent, storeName, slideNumber, totalSlides,
}: {
  product: AdProduct; tagline: string; accent: typeof ACCENT_PALETTE[0];
  storeName: string; slideNumber: number; totalSlides: number;
}) {
  return (
    <div className="relative w-full h-full bg-[#0D0D0D] overflow-hidden">

      {/* Ken Burns + horizontal drift */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.15, x: "1.5%" }}
        animate={{ scale: 1.0, x: "-1%" }}
        transition={{ duration: (SLIDE_MS / 1000) + 2, ease: "linear" }}
      >
        <img
          src={convertToDirectUrl(product.imageUrl!)}
          alt={product.name}
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.55) contrast(1.08)" }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
        />
      </motion.div>

      {/* Accent colour tint wash over image — subtle top-left glow in category colour */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 55% 50% at 0% 0%, rgba(${accent.rgb},0.18) 0%, transparent 60%)` }}
      />

      {/* Light sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.055) 48%, rgba(255,255,255,0.03) 52%, transparent 70%)" }}
        initial={{ x: "-120%" }} animate={{ x: "160%" }}
        transition={{ duration: 2.2, delay: 0.8, ease: "easeInOut" }}
      />

      {/* Gradients */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to top, rgba(13,13,13,1) 0%, rgba(13,13,13,0.82) 28%, rgba(13,13,13,0.18) 58%, transparent 100%)"
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to right, rgba(13,13,13,0.88) 0%, rgba(13,13,13,0.42) 40%, transparent 70%)"
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to bottom, rgba(13,13,13,0.5) 0%, transparent 20%)"
      }} />

      {/* Left vertical accent line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px] origin-top z-10"
        style={{ background: `linear-gradient(to bottom, ${accent.hex} 0%, rgba(${accent.rgb},0.4) 60%, transparent 100%)` }}
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
        transition={{ duration: 1.1, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Floating accent diamonds */}
      <motion.div
        className="absolute right-16 xl:right-24 z-10"
        style={{ top: "40%", width: 24, height: 24, rotate: "45deg", border: `1px solid rgba(${accent.rgb},0.5)` }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.75, 0.4, 0.75], scale: 1 }}
        transition={{ duration: 1.5, delay: 1.2, opacity: { repeat: Infinity, duration: 3.2, ease: "easeInOut" } }}
      />
      <motion.div
        className="absolute right-24 xl:right-36 z-10"
        style={{ top: "45%", width: 14, height: 14, rotate: "45deg", border: `1px solid rgba(${accent.rgb},0.35)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0.2, 0.45] }}
        transition={{ delay: 1.6, opacity: { repeat: Infinity, duration: 3.8, ease: "easeInOut" } }}
      />

      {/* Breathing accent glow behind text */}
      <motion.div
        className="absolute bottom-0 left-0 pointer-events-none z-10"
        style={{
          width: "65%", height: "55%",
          background: `radial-gradient(ellipse at 20% 80%, rgba(${accent.rgb},0.12) 0%, transparent 65%)`
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top-corner brackets */}
      {[{ cls: "top-6 left-6", b: "border-t border-l" }, { cls: "top-6 right-6", b: "border-t border-r" }].map(({ cls, b }, i) => (
        <motion.div key={i}
          className={`absolute w-8 h-8 z-20 ${cls} ${b}`}
          style={{ borderColor: `rgba(${accent.rgb},0.4)` }}
          initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 + 0.5, duration: 0.5 }}
        />
      ))}

      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 pt-10 xl:px-16 xl:pt-14">
        <motion.div className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <BrandMark size="sm" />
          <div className="h-5 w-px bg-white/20" />
          <motion.span
            className="text-white/50 text-xs tracking-[0.28em] uppercase font-medium"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          >
            {product.category || "Collection"}
          </motion.span>
        </motion.div>

        <motion.div className="text-right"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-white/60 text-xs tracking-[0.28em] uppercase font-semibold">1stRep.com</p>
          <p className="text-white/25 text-xs tracking-[0.2em] uppercase mt-0.5">{storeName}</p>
        </motion.div>
      </div>

      {/* ── BOTTOM CONTENT ─────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 z-20 px-10 pb-14 xl:px-16 xl:pb-18 2xl:px-24 2xl:pb-20 w-full max-w-5xl">

        <div className="overflow-hidden mb-1">
          <motion.p
            className="text-white/45 font-semibold tracking-[0.32em] uppercase text-xs xl:text-sm"
            initial={{ y: "110%" }} animate={{ y: "0%" }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            {tagline}
          </motion.p>
        </div>

        {/* Product name — clip-path wipe */}
        <motion.h2
          className="font-black text-white leading-none"
          style={{
            fontSize: "clamp(2.8rem, 7.5vw, 9rem)",
            lineHeight: 1.02,
            textShadow: "0 4px 60px rgba(0,0,0,0.8)",
            clipPath: "inset(0 100% 0 0)",
          }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.95, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {product.name}
        </motion.h2>

        {/* Accent rule under name */}
        <motion.div
          className="mt-5 mb-4 h-[2px] origin-left"
          style={{ background: `linear-gradient(to right, ${accent.hex}, rgba(${accent.rgb},0))`, width: "6rem" }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {product.description && (
          <motion.p
            className="text-white/45 leading-relaxed line-clamp-2 max-w-2xl"
            style={{ fontSize: "clamp(0.88rem, 1.35vw, 1.3rem)" }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.65 }}
          >
            {product.description}
          </motion.p>
        )}

        <motion.div
          className="flex items-center justify-between mt-8 gap-4 flex-wrap"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.78, duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="h-px"
              style={{ background: accent.hex }}
              initial={{ width: 0 }} animate={{ width: "1.75rem" }}
              transition={{ duration: 0.5, delay: 0.85 }}
            />
            <span className="text-white/50 text-xs tracking-[0.28em] uppercase font-medium whitespace-nowrap">
              In-Store &amp; Online · 1stRep.com
            </span>
          </div>

          {/* Dots — accent active dot */}
          <div className="flex items-center gap-[5px]">
            {Array.from({ length: Math.min(totalSlides, 10) }).map((_, i) => {
              const active = slideNumber % Math.min(totalSlides, 10) === i;
              return (
                <div key={i} style={{
                  transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
                  width: active ? "2rem" : "6px",
                  height: "5px",
                  borderRadius: "999px",
                  background: active ? accent.hex : "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }} />
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Brand Interstitial ────────────────────────────────────────────────────────

function BrandSlide({ copy }: { copy: (typeof BRAND_COPY)[0] }) {
  const accent = ACCENT_PALETTE[0]; // electric blue for brand slide
  return (
    <div className="relative w-full h-full bg-[#0D0D0D] flex items-center justify-center overflow-hidden">

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(ellipse 80% 55% at 50% 55%, rgba(${accent.rgb},0.10) 0%, transparent 72%)` }}
      />

      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "80vmin", height: "80vmin", border: `1px solid rgba(${accent.rgb},0.15)` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full blur-[2px]"
          style={{ background: accent.hex }} />
      </motion.div>

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
        backgroundSize: "60px 60px",
      }} />

      <ScanLine accent={accent} />
      <CornerBrackets accent={accent} />
      <FloatingDiamonds accent={accent} />

      <motion.p
        className="absolute top-12 text-white/30 text-sm tracking-[0.45em] uppercase font-medium z-10"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        1stRep.com
      </motion.p>

      <div className="z-10 flex flex-col items-center text-center px-16 max-w-5xl">
        <motion.div className="mb-10"
          initial={{ opacity: 0, scale: 0.78, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div animate={{ scale: [1, 1.025, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
            <BrandMark size="lg" />
          </motion.div>
        </motion.div>

        <motion.div
          className="mb-10 h-[2px]"
          style={{ background: `linear-gradient(to right, transparent, ${accent.hex}, transparent)` }}
          initial={{ width: 0 }} animate={{ width: "8rem" }}
          transition={{ duration: 0.75, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="overflow-hidden mb-6">
          <motion.h2
            className="font-black text-white uppercase tracking-[0.2em]"
            style={{ fontSize: "clamp(2rem, 5.5vw, 6rem)", lineHeight: 1.08, clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {copy.headline}
          </motion.h2>
        </div>

        <motion.p
          className="text-white/45 leading-relaxed max-w-2xl"
          style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.4rem)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.5 }}
        >
          {copy.body}
        </motion.p>

        <motion.div
          className="mt-10 h-px"
          style={{ background: `rgba(${accent.rgb},0.4)` }}
          initial={{ width: 0 }} animate={{ width: "4rem" }}
          transition={{ duration: 0.55, delay: 0.65 }}
        />

        <motion.p
          className="text-white/35 mt-6 tracking-[0.32em] uppercase font-semibold"
          style={{ fontSize: "clamp(0.7rem, 1.1vw, 1.05rem)" }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.75 }}
        >
          Premium Gymwear · Est. UK · 1stRep.com
        </motion.p>
      </div>

      <motion.p
        className="absolute bottom-12 text-white/20 text-xs tracking-[0.32em] uppercase z-10"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        Ask a team member for assistance
      </motion.p>
    </div>
  );
}
