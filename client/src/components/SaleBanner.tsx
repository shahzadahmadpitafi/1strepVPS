import { useQuery } from "@tanstack/react-query";

/**
 * Black Friday banner. It only shows while a sale campaign is running (the server switches it on at the start time
 * and off at the end time, see server/saleCampaign.ts), so nothing has to be changed by hand.
 * The artwork says "up to 40% off", so the banner hides itself if the biggest discount is ever above 40%.
 */
const BANNER_MAX_PCT = 40;

interface SaleStatus { active: boolean; name?: string; endsAt?: string; maxPct?: number }

export function useActiveSale() {
  const { data } = useQuery<SaleStatus>({
    queryKey: ["/api/sale-banner"],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  let preview = false;
  try { preview = typeof window !== "undefined" && window.localStorage.getItem("saleBannerPreview") === "1"; } catch { /* ignore */ }
  const on = preview || (!!data?.active && (data.maxPct ?? 0) <= BANNER_MAX_PCT);
  return { on, data };
}

export function SaleOrHero({ children }: { children: React.ReactNode }) {
  const { on } = useActiveSale();
  return on ? <SaleBanner /> : <>{children}</>;
}

export default function SaleBanner({ compact = false }: { compact?: boolean }) {
  const { on } = useActiveSale();
  if (!on) return null;
  return (
    <a
      href="/shop-clean"
      className="block w-full bg-black"
      aria-label="Black Friday sale now on, up to 40% off selected items. Shop the sale"
      data-testid="sale-banner"
    >
      <picture>
        <source media="(max-width: 767px)" srcSet="/sale/black-friday-mobile.jpg" />
        <img
          src="/sale/black-friday-desktop.jpg"
          alt="Black Friday. Sale now on. Up to 40% off selected items."
          className={compact
            ? "block w-full h-[320px] md:h-[360px] object-cover object-center"
            : "block w-full max-h-[88vh] object-cover object-top"}
        />
      </picture>
    </a>
  );
}
