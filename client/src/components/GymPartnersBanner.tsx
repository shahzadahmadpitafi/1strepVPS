import { useQuery } from "@tanstack/react-query";

interface DirectoryReseller {
  id: string;
  businessName: string;
  businessAddress: string;
  logoUrl?: string | null;
}

export default function GymPartnersBanner() {
  const { data: resellers = [] } = useQuery<DirectoryReseller[]>({
    queryKey: ["/api/resellers/directory"],
  });

  if (resellers.length === 0) return null;

  const loop = [...resellers, ...resellers];

  return (
    <div className="w-full bg-black border-b border-white/10 py-3 overflow-hidden" data-testid="gym-partners-banner">
      <div className="flex items-center animate-marquee whitespace-nowrap">
        {loop.map((r, i) => (
          <div key={`${r.id}-${i}`} className="inline-flex items-center gap-2.5 mx-8 shrink-0">
            {r.logoUrl ? (
              <img
                src={r.logoUrl}
                alt={r.businessName}
                className="h-6 w-auto max-w-[100px] object-contain opacity-80"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <span className="text-white/70 text-sm font-semibold tracking-wide uppercase">
                {r.businessName}
              </span>
            )}
            <span className="text-white/20 text-xs">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
