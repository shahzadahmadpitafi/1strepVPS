import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Calendar, MapPin, Users, Trophy, Search, ChevronRight,
  User, UsersRound, ArrowRight, Zap, Medal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import HeaderClean from "@/components/HeaderClean";

const filters = [
  { key: "all", label: "All Events" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live Now" },
  { key: "past", label: "Past" },
];

function formatDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) return s.toLocaleDateString("en-GB", opts);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.toLocaleDateString("en-GB", opts)}`;
  }
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function formatFee(fee: number, currency: string) {
  if (fee === 0) return null;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 0 }).format(fee / 100);
}

function FormatLabel({ format }: { format: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string }> = {
    individual: { icon: <User className="w-3.5 h-3.5" />, label: "Individual" },
    teams_of_2: { icon: <UsersRound className="w-3.5 h-3.5" />, label: "Teams of 2" },
    teams_of_3: { icon: <UsersRound className="w-3.5 h-3.5" />, label: "Teams of 3" },
    teams_of_4: { icon: <UsersRound className="w-3.5 h-3.5" />, label: "Teams of 4" },
    mixed: { icon: <UsersRound className="w-3.5 h-3.5" />, label: "Mixed" },
  };
  const item = map[format] ?? { icon: <Users className="w-3.5 h-3.5" />, label: format?.replace(/_/g, " ") };
  return (
    <span className="flex items-center gap-1 text-white/40 text-xs">
      {item.icon} {item.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === "online") return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-white/8 text-white/50 rounded">Online</span>;
  if (type === "hybrid") return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-white/8 text-white/50 rounded">Hybrid</span>;
  if (type === "multi_day") return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-white/8 text-white/50 rounded">Multi Day</span>;
  return null;
}

function BannerPlaceholder({ comp }: { comp: any }) {
  const formatMap: Record<string, string> = {
    individual: "Individual",
    teams_of_2: "Teams of 2",
    teams_of_3: "Teams of 3",
    teams_of_4: "Teams of 4",
    mixed: "Mixed Teams",
  };
  const formatLabel = formatMap[comp.format] ?? comp.format?.replace(/_/g, " ") ?? "Open";

  return (
    <div className="absolute inset-0 bg-[#161616]">
      <div className="absolute inset-0 flex flex-col items-start justify-end p-4 pb-3">
        <p className="text-white/25 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">1stRep Competition</p>
        <h3 className="text-white font-black text-lg leading-tight line-clamp-2">{comp.name}</h3>
        {comp.format && (
          <span className="mt-2 px-2 py-0.5 bg-white/8 border border-white/15 text-white/50 text-[10px] font-bold uppercase tracking-wider rounded">
            {formatLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function CompetitionCard({ comp }: { comp: any }) {
  const [imgBroken, setImgBroken] = useState(false);
  const isLive = comp.status === "live";
  const isOpen = comp.status === "registration_open";
  const isFree = comp.entry_fee === 0;
  const feeStr = formatFee(comp.entry_fee, comp.currency);
  const showRealImage = comp.banner_image && !imgBroken;

  return (
    <Link href={`/competitions/${comp.slug}`}>
      <div className="group relative bg-[#111111] border border-white/8 rounded-md overflow-hidden hover-elevate cursor-pointer flex flex-col h-full transition-all duration-200">
        {/* Banner */}
        <div className="relative h-48 bg-[#0d0d0d] overflow-hidden shrink-0">
          {showRealImage ? (
            <img
              src={comp.banner_image}
              alt={comp.name}
              onError={() => setImgBroken(true)}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
            />
          ) : (
            <BannerPlaceholder comp={comp} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/20 to-transparent" />

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {isLive && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 text-white text-[10px] font-black rounded uppercase tracking-wider border border-white/20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
              </span>
            )}
            {isOpen && !isLive && (
              <span className="px-2.5 py-1 bg-[#FAFAF8] text-[#080808] text-[10px] font-black rounded uppercase tracking-wider">
                Open
              </span>
            )}
            <TypeBadge type={comp.type} />
          </div>

          {/* Fee — top right */}
          <div className="absolute top-3 right-3">
            {isFree ? (
              <span className="px-2.5 py-1 bg-[#FAFAF8] text-[#080808] text-[10px] font-black rounded uppercase tracking-wider">Free</span>
            ) : (
              <span className="px-2.5 py-1 bg-black/60 backdrop-blur text-[#FAFAF8] text-[10px] font-black rounded border border-white/20">{feeStr}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 pt-3">
          <div className="flex-1">
            <h3 className="text-white font-bold text-base leading-snug mb-2.5 line-clamp-2 group-hover:text-white transition-colors duration-200">
              {comp.name}
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <Calendar className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span>{formatDate(comp.start_date, comp.end_date)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="truncate">{comp.venue ? `${comp.venue}, ` : ""}{comp.location}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
            <FormatLabel format={comp.format} />
            <span className="flex items-center gap-1 text-white/25 text-xs group-hover:text-white/50 transition-colors">
              View <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-[#111111] border border-white/8 rounded-md overflow-hidden">
      <Skeleton className="h-48 bg-white/5" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 bg-white/5" />
        <Skeleton className="h-3.5 w-1/2 bg-white/5" />
        <Skeleton className="h-3.5 w-2/3 bg-white/5" />
      </div>
    </div>
  );
}

export default function Competitions() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: competitions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/competitions", activeFilter],
    queryFn: async () => {
      const url = activeFilter === "all" ? "/api/competitions" : `/api/competitions?filter=${activeFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const filtered = (competitions ?? []).filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
  );

  const liveCount = (competitions ?? []).filter(c => c.status === "live").length;

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <HeaderClean />

      {/* Hero */}
      <section className="pt-24 pb-10 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase">1stRep</span>
                {liveCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/15 rounded text-white/60 text-xs font-bold">
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />{liveCount} Live Now
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">
                Competitions & Events
              </h1>
              <p className="text-white/40 text-base max-w-lg">
                Register, compete, and track your performance across 1stRep-hosted fitness competitions and community events.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/competitions/pricing">
                <Button variant="outline" className="border-white/20 text-white gap-2 h-10">
                  <Zap className="w-4 h-4" /> Host a Competition
                </Button>
              </Link>
              <Link href="/my-competitions">
                <Button className="bg-[#FAFAF8] text-[#080808] font-bold gap-2 h-10">
                  <Medal className="w-4 h-4" /> My Competitions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-16 z-40 bg-[#080808]/96 backdrop-blur border-b border-white/8">
        <div className="container mx-auto px-4 max-w-6xl py-2.5 flex flex-wrap gap-3 items-center">
          <div className="flex gap-0.5 bg-white/5 rounded-md p-0.5">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                  activeFilter === f.key
                    ? "bg-[#FAFAF8] text-[#080808] shadow-sm"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <Input
              placeholder="Search by name or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 w-60 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="container mx-auto px-4 max-w-6xl pt-6 pb-2">
          <p className="text-white/25 text-sm">
            {filtered.length} {filtered.length === 1 ? "competition" : "competitions"}{search ? ` matching "${search}"` : ""}
          </p>
        </div>
      )}

      {/* Grid */}
      <section className="container mx-auto px-4 max-w-6xl pb-16 pt-3">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/25">
            <Trophy className="w-14 h-14 mx-auto mb-5 opacity-20" />
            <p className="text-xl font-medium">No competitions found</p>
            <p className="text-sm mt-1 opacity-70">
              {search ? `No results for "${search}" — try a different search` : "Check back soon for upcoming events"}
            </p>
            {search && (
              <Button variant="outline" onClick={() => setSearch("")} className="mt-5 border-white/20 text-white gap-2">
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(comp => <CompetitionCard key={comp.id} comp={comp} />)}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="border-t border-white/8">
        <div className="container mx-auto px-4 max-w-6xl py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-[#0F0F0F] rounded-md border border-white/8">
            <div>
              <h3 className="text-white font-bold text-xl mb-1">Want to host your own competition?</h3>
              <p className="text-white/40 text-sm">1stRep can power your event end-to-end — from registrations and payments to live leaderboards on the day.</p>
            </div>
            <Link href="/competitions/host">
              <Button className="bg-[#FAFAF8] text-[#080808] font-bold gap-2 shrink-0 h-11 px-6">
                Find Out More <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
