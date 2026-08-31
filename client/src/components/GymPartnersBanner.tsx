import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

interface DirectoryReseller {
  id: string;
  businessName: string;
  businessAddress: string;
  logoUrl?: string | null;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "1R";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function GymPartnersBanner() {
  const { data: resellers = [] } = useQuery<DirectoryReseller[]>({
    queryKey: ["/api/resellers/directory"],
  });

  if (resellers.length === 0) return null;

  const loop = [...resellers, ...resellers];

  return (
    <div className="w-full bg-black border-b border-white/10 flex items-stretch overflow-hidden" data-testid="gym-partners-banner">
      <div className="hidden sm:flex shrink-0 items-center gap-2 pl-4 pr-4 border-r border-white/10 bg-black z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-[#3C83F6]" />
        <span className="text-white text-[10.5px] font-bold tracking-[0.14em] uppercase whitespace-nowrap">
          Official Partners
        </span>
      </div>
      <div className="flex-1 overflow-hidden py-2">
        <div className="flex items-center animate-marquee whitespace-nowrap">
          {loop.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              className="inline-flex items-center gap-2 mx-2.5 shrink-0 pl-1.5 pr-3.5 py-1 rounded-full border border-white/15 bg-white/[0.03]"
            >
              {r.logoUrl ? (
                <img
                  src={r.logoUrl}
                  alt={r.businessName}
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <span className="h-6 w-6 rounded-full bg-[#3C83F6] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {initials(r.businessName)}
                </span>
              )}
              <span className="text-white/85 text-[12.5px] font-semibold tracking-wide uppercase">
                {r.businessName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
