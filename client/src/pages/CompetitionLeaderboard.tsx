import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import io from "socket.io-client";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-4xl font-black text-[#FAFAF8]">1</span>;
  if (rank === 2) return <span className="text-4xl font-black text-white/60">2</span>;
  if (rank === 3) return <span className="text-4xl font-black text-white/40">3</span>;
  return <span className="text-3xl font-black text-white/25">{rank}</span>;
}

export default function CompetitionLeaderboard() {
  const [, params1] = useRoute("/competitions/:slug/leaderboard");
  const [, params2] = useRoute("/competitions/:slug/leaderboard/display");
  const slug = params1?.slug ?? params2?.slug;
  const [selectedCategory, setSelectedCategory] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const socketRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: competition } = useQuery<any>({
    queryKey: ["/api/competitions", slug],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${slug}`);
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: workouts } = useQuery<any[]>({
    queryKey: ["/api/competitions", slug, "workouts"],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${slug}/workouts`);
      return res.json();
    },
    enabled: !!slug,
  });

  const publicWorkouts = workouts?.filter(w => w.is_public) ?? [];

  const fetchLeaderboard = async (catId: string) => {
    if (!catId || !slug) return;
    const res = await fetch(`/api/competitions/${slug}/leaderboard?categoryId=${catId}`);
    const data = await res.json();
    setLeaderboard(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (competition?.categories?.length > 0 && !selectedCategory) {
      setSelectedCategory(competition.categories[0].id);
    }
  }, [competition]);

  useEffect(() => {
    if (selectedCategory) fetchLeaderboard(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (!competition?.id) return;
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;
    socket.emit("join:competition", competition.id);
    socket.on("leaderboard:update", () => {
      if (selectedCategory) fetchLeaderboard(selectedCategory);
    });
    return () => { socket.disconnect(); };
  }, [competition?.id, selectedCategory]);

  useEffect(() => {
    if (leaderboard.length <= 8) return;
    const interval = setInterval(() => {
      setScrollOffset(prev => {
        const container = containerRef.current;
        if (!container) return prev;
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (prev >= maxScroll) return 0;
        return prev + 1.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [leaderboard.length]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollOffset;
    }
  }, [scrollOffset]);

  const categoryName = competition?.categories?.find((c: any) => c.id === selectedCategory)?.name ?? "";

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-hidden flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="bg-[#0F0F0F] border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <img src="/1strep-header-logo.png" alt="1stRep" className="h-10 w-auto" />
          <div className="w-px h-8 bg-white/15" />
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">Live Leaderboard</p>
            <p className="text-white font-black text-xl uppercase tracking-tight">{competition?.name ?? "Competition"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {competition?.location && <span className="text-white/40 text-sm">{competition.location}</span>}
          {competition?.start_date && <span className="text-white/40 text-sm">{formatDate(competition.start_date)}</span>}
          {competition?.categories?.length > 1 && (
            <div className="flex gap-2">
              {competition.categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-[#FAFAF8] text-[#080808]"
                      : "bg-white/8 text-white/50 hover:bg-white/15"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-white/50 text-xs font-bold uppercase">
            <span className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Category Title */}
      <div className="bg-white/5 border-b border-white/8 px-6 py-2 flex items-center justify-between shrink-0">
        <h2 className="text-white/60 font-bold uppercase tracking-[0.1em] text-sm">{categoryName}</h2>
        <span className="text-white/30 text-sm">{leaderboard.length} athletes</span>
      </div>

      {/* Table Header */}
      {leaderboard.length > 0 && (
        <div className="bg-white/3 border-b border-white/8 grid shrink-0" style={{ gridTemplateColumns: `80px 1fr ${publicWorkouts.map(() => "100px").join(" ")} 100px` }}>
          <div className="px-4 py-3 text-white/30 text-xs font-bold uppercase tracking-wider">Rank</div>
          <div className="px-4 py-3 text-white/30 text-xs font-bold uppercase tracking-wider">Athlete / Team</div>
          {publicWorkouts.map((w, i) => (
            <div key={w.id} className="px-2 py-3 text-center text-white/30 text-xs font-bold uppercase tracking-wider">WOD {i + 1}</div>
          ))}
          <div className="px-4 py-3 text-center text-white/30 text-xs font-bold uppercase tracking-wider">Points</div>
        </div>
      )}

      {/* Rows */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/20">
              <Trophy className="w-24 h-24 mx-auto mb-6 opacity-20" />
              <p className="text-3xl font-black uppercase tracking-widest">No Scores Yet</p>
              <p className="text-sm mt-2 opacity-50">Scores will appear here as they are entered</p>
            </div>
          </div>
        ) : (
          leaderboard.map((entry, idx) => {
            const isTop3 = entry.rank <= 3;
            return (
              <div
                key={entry.registrationId}
                className={`grid border-b transition-colors ${
                  isTop3 ? "border-white/8 bg-white/4" : "border-white/5"
                } ${entry.rank === 1 ? "bg-white/6" : ""}`}
                style={{ gridTemplateColumns: `80px 1fr ${publicWorkouts.map(() => "100px").join(" ")} 100px` }}
              >
                {/* Rank */}
                <div className="px-4 py-4 flex items-center">
                  <RankBadge rank={entry.rank} />
                </div>

                {/* Name */}
                <div className="px-4 py-4 flex items-center">
                  <span className={`font-bold text-lg ${isTop3 ? "text-white" : "text-white/70"}`}>
                    {entry.teamName || `Athlete`}
                  </span>
                </div>

                {/* Workout scores */}
                {publicWorkouts.map((w: any) => {
                  const ws = entry.workoutScores?.find((s: any) => s.workoutId === w.id);
                  return (
                    <div key={w.id} className="px-2 py-4 text-center flex flex-col items-center justify-center">
                      {ws?.score ? (
                        <>
                          <span className="text-white/80 text-sm font-medium">{ws.score}</span>
                          <span className="text-white/25 text-xs">#{ws.place}</span>
                        </>
                      ) : (
                        <span className="text-white/15 text-lg">—</span>
                      )}
                    </div>
                  );
                })}

                {/* Total points */}
                <div className="px-4 py-4 flex items-center justify-center">
                  <span className={`text-2xl font-black ${
                    entry.totalPoints < 999999
                      ? entry.rank === 1 ? "text-[#FAFAF8]" : "text-white/80"
                      : "text-white/20"
                  }`}>
                    {entry.totalPoints < 999999 ? entry.totalPoints : "—"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#0F0F0F] border-t border-white/8 px-6 py-2 flex items-center justify-between text-xs text-white/25 shrink-0">
        <span>1stRep Competition Platform</span>
        <span>Scores update in real-time · Lowest points wins</span>
        <span>{new Date().toLocaleTimeString("en-GB")}</span>
      </div>
    </div>
  );
}
