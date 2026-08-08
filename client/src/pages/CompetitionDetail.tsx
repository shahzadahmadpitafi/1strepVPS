import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Users, Trophy, Clock, ChevronLeft,
  ExternalLink, CheckCircle, AlertCircle, Dumbbell, Target,
  Shield, Monitor, BarChart3, ListOrdered, UserPlus, Pencil,
  UserCheck, UserX, Send, Video, TimerReset, Tag, X, Loader2, Lock,
  CreditCard, ArrowRight, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeaderClean from "@/components/HeaderClean";
import io from "socket.io-client";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function formatFee(fee: number, currency: string) {
  if (fee === 0) return "Free Entry";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(fee / 100);
}
function statusColor(status: string) {
  switch (status) {
    case "live": return "bg-white/10 text-white border border-white/20";
    case "registration_open": return "bg-[#FAFAF8] text-[#080808]";
    case "completed": return "bg-white/10 text-white/60";
    case "cancelled": return "bg-white/5 text-white/40";
    default: return "bg-white/5 text-white/40";
  }
}
function workoutTypeIcon(type: string) {
  switch (type) {
    case "amrap": return <Clock className="w-4 h-4" />;
    case "for_time": return <Target className="w-4 h-4" />;
    case "max_weight": return <Dumbbell className="w-4 h-4" />;
    default: return <BarChart3 className="w-4 h-4" />;
  }
}

export default function CompetitionDetail() {
  const [, params] = useRoute("/competitions/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug;
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [teamName, setTeamName] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<any>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<"form" | "confirming" | "confirmed">("form");
  const [leaderboardCategory, setLeaderboardCategory] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingTeamName, setEditingTeamName] = useState("");
  const [showTeamNameEdit, setShowTeamNameEdit] = useState(false);
  const [scoreFormOpen, setScoreFormOpen] = useState<string | null>(null);
  const [scoreDraft, setScoreDraft] = useState<{ score: string; videoProof: string; isDnf: boolean; dnfReps: string }>({ score: "", videoProof: "", isDnf: false, dnfReps: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [heroImgBroken, setHeroImgBroken] = useState(false);
  const socketRef = useRef<any>(null);

  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const isLoggedIn = !!currentUser?.id;

  const { data: competition, isLoading } = useQuery<any>({
    queryKey: ["/api/competitions", slug],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: workouts } = useQuery<any[]>({
    queryKey: ["/api/competitions", slug, "workouts"],
    queryFn: async () => { const res = await fetch(`/api/competitions/${slug}/workouts`); return res.json(); },
    enabled: !!slug,
  });

  const { data: schedule } = useQuery<any[]>({
    queryKey: ["/api/competitions", slug, "schedule"],
    queryFn: async () => { const res = await fetch(`/api/competitions/${slug}/schedule`); return res.json(); },
    enabled: !!slug,
  });

  const { data: myRegistrations, refetch: refetchMyRegs } = useQuery<any[]>({
    queryKey: ["/api/competitions/my/registrations"],
    enabled: isLoggedIn,
  });

  const myReg = myRegistrations?.find((r: any) => r.slug === slug);
  const isRegistered = !!myReg;

  const { data: teamMembers, refetch: refetchTeam } = useQuery<any[]>({
    queryKey: ["/api/competitions", slug, "team-members"],
    queryFn: async () => { const res = await fetch(`/api/competitions/${slug}/teams/members`); if (!res.ok) return []; return res.json(); },
    enabled: !!slug && isRegistered,
  });

  useEffect(() => {
    if (competition?.categories?.length > 0) {
      setSelectedCategory(competition.categories[0].id);
      setLeaderboardCategory(competition.categories[0].id);
    }
  }, [competition]);

  // ── On return from Square checkout: read sessionStorage + confirm registration ──
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment_complete") !== "1") return;

    const pendingRaw = sessionStorage.getItem("pendingCompetitionPayment");
    if (!pendingRaw) return;

    let pending: any;
    try { pending = JSON.parse(pendingRaw); } catch { return; }

    if (pending.slug !== slug || !pending.squarePaymentLinkId) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("payment_complete");
    window.history.replaceState({}, "", url.toString());

    setActiveTab("register");
    setRegistrationStep("confirming");

    confirmSquareRegistrationMutation.mutate({
      squarePaymentLinkId: pending.squarePaymentLinkId,
      categoryId: pending.categoryId,
      teamName: pending.teamName || undefined,
      waiverSigned: true,
      promoCodeId: pending.promoCodeId || null,
      shirtSize: pending.shirtSize || undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchLeaderboard = async (catId: string) => {
    if (!catId || !slug) return;
    const res = await fetch(`/api/competitions/${slug}/leaderboard?categoryId=${catId}`);
    setLeaderboard(await res.json());
  };

  useEffect(() => { if (leaderboardCategory) fetchLeaderboard(leaderboardCategory); }, [leaderboardCategory]);

  useEffect(() => {
    if (!competition?.id) return;
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;
    socket.emit("join:competition", competition.id);
    socket.on("leaderboard:update", ({ competitionId }: any) => {
      if (competitionId === competition.id) fetchLeaderboard(leaderboardCategory);
    });
    return () => { socket.disconnect(); };
  }, [competition?.id]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const res = await apiRequest("POST", `/api/competitions/${slug}/promo/validate`, { code: promoCode });
      const data = await res.json();
      setPromoResult(data);
    } catch (err: any) {
      let msg = err.message || "Invalid promo code";
      try {
        const jsonPart = msg.indexOf("{");
        if (jsonPart !== -1) {
          const parsed = JSON.parse(msg.slice(jsonPart));
          msg = parsed.error || msg;
        }
      } catch { /* ignore */ }
      setPromoError(msg);
    } finally {
      setPromoLoading(false);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/competitions/${slug}/register`, {
        categoryId: selectedCategory,
        teamName: teamName || undefined,
        // If competition has no waiver text there is nothing to sign — treat as accepted
        waiverSigned: competition?.waiver_text ? waiverSigned : true,
        promoCodeId: promoResult?.promoCodeId || null,
        shirtSize: shirtSize || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      setRegistrationStep("confirmed");
      toast({ title: "Registration successful!", description: "You are confirmed for this competition." });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions/my/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", slug] });
    },
    onError: (err: any) => {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    },
  });

  const createSquareCheckoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/competitions/${slug}/create-square-checkout`, {
        categoryId: selectedCategory,
        promoCodeId: promoResult?.promoCodeId || null,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      const { checkoutUrl, squarePaymentLinkId } = data;
      if (!checkoutUrl || !squarePaymentLinkId) {
        toast({ title: "Could not start payment", description: "Invalid response from payment provider.", variant: "destructive" });
        return;
      }
      sessionStorage.setItem("pendingCompetitionPayment", JSON.stringify({
        slug,
        squarePaymentLinkId,
        categoryId: selectedCategory,
        teamName: teamName || "",
        waiverSigned: true,
        promoCodeId: promoResult?.promoCodeId || null,
        shirtSize: shirtSize || "",
      }));
      window.location.href = checkoutUrl;
    },
    onError: (err: any) => {
      toast({ title: "Could not start payment", description: err.message, variant: "destructive" });
    },
  });

  const confirmSquareRegistrationMutation = useMutation({
    mutationFn: async (payload: {
      squarePaymentLinkId: string;
      categoryId: string;
      teamName?: string;
      waiverSigned: boolean;
      promoCodeId: string | null;
      shirtSize?: string;
    }) => {
      const res = await apiRequest("POST", `/api/competitions/${slug}/confirm-square-registration`, payload);
      return res.json();
    },
    onSuccess: (data: any) => {
      sessionStorage.removeItem("pendingCompetitionPayment");
      if (data.alreadyConfirmed) {
        toast({ title: "Already registered", description: "Your registration is confirmed." });
      } else {
        toast({ title: "Payment confirmed!", description: "You are now registered for this competition." });
      }
      setRegistrationStep("confirmed");
      queryClient.invalidateQueries({ queryKey: ["/api/competitions/my/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", slug] });
    },
    onError: (err: any) => {
      sessionStorage.removeItem("pendingCompetitionPayment");
      setRegistrationStep("form");
      toast({ title: "Could not confirm payment", description: err.message || "Please contact support if payment was taken.", variant: "destructive" });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", `/api/competitions/${slug}/teams/invite`, { inviteEmail: email });
      return res as { success: boolean; newUser?: boolean; emailSent?: boolean };
    },
    onSuccess: (data) => {
      if (data?.emailSent === false) {
        toast({
          title: "Invite saved — email delivery failed",
          description: "The invitation has been recorded but we couldn't send the email right now. The invitee can still see it by logging in to their 1stRep account.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Invitation sent!", description: "Your teammate will receive an email notification." });
      }
      setInviteEmail("");
      refetchTeam();
    },
    onError: (err: any) => { toast({ title: "Could not send invite", description: err.message, variant: "destructive" }); },
  });

  const updateTeamNameMutation = useMutation({
    mutationFn: async (name: string) => apiRequest("PATCH", `/api/competitions/${slug}/teams/name`, { teamName: name }),
    onSuccess: () => {
      toast({ title: "Team name updated" });
      setShowTeamNameEdit(false);
      queryClient.invalidateQueries({ queryKey: ["/api/competitions/my/registrations"] });
    },
    onError: () => { toast({ title: "Failed to update team name", variant: "destructive" }); },
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => apiRequest("DELETE", `/api/competitions/${slug}/teams/members/${memberId}`),
    onSuccess: () => { toast({ title: "Teammate removed" }); refetchTeam(); },
    onError: (err: any) => { toast({ title: "Failed to remove", description: err.message, variant: "destructive" }); },
  });

  const submitScoreMutation = useMutation({
    mutationFn: async ({ workoutId, workout }: { workoutId: string; workout: any }) => {
      let scoreNumeric: number | null = null;
      const score = scoreDraft.score;
      if (!scoreDraft.isDnf) {
        if (workout.type === "for_time") {
          const parts = scoreDraft.score.split(":").map(Number);
          scoreNumeric = parts.length === 2 ? parts[0] * 60 + parts[1] : parseInt(scoreDraft.score) || 0;
        } else {
          scoreNumeric = parseFloat(scoreDraft.score) || null;
        }
      }
      return apiRequest("POST", `/api/competitions/${slug}/scores/submit`, {
        workoutId, score, scoreNumeric,
        videoProofUrl: scoreDraft.videoProof || null,
        isDnf: scoreDraft.isDnf,
        dnfReps: scoreDraft.isDnf ? parseInt(scoreDraft.dnfReps) || 0 : null,
      });
    },
    onSuccess: () => {
      toast({ title: "Score submitted!", description: "Your score is pending validation by the organiser." });
      setScoreFormOpen(null);
      setScoreDraft({ score: "", videoProof: "", isDnf: false, dnfReps: "" });
    },
    onError: (err: any) => { toast({ title: "Submission failed", description: err.message, variant: "destructive" }); },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] text-white">
        <HeaderClean />
        <div className="pt-20 container mx-auto px-4 max-w-5xl">
          <Skeleton className="h-64 bg-white/5 rounded-md mt-6" />
          <div className="mt-8 space-y-4">
            <Skeleton className="h-8 w-64 bg-white/5" />
            <Skeleton className="h-4 w-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p className="text-xl">Competition not found</p>
          <Link href="/competitions"><Button variant="outline" className="mt-4 border-white/20 text-white">Back to Competitions</Button></Link>
        </div>
      </div>
    );
  }

  const isTeam = ["teams_of_2", "teams_of_3", "teams_of_4"].includes(competition.format);
  const isFull = competition.max_participants && competition.current_participants >= competition.max_participants;
  const canRegister = competition.status === "registration_open" && !isRegistered && !isFull;
  const effectiveFee = promoResult ? promoResult.finalAmount : competition.entry_fee;

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <HeaderClean />

      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 mt-16 overflow-hidden">
        {competition.banner_image && !heroImgBroken ? (
          <img
            src={competition.banner_image}
            alt={competition.name}
            onError={() => setHeroImgBroken(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#161616]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <Link href="/competitions" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" /> All Competitions
          </Link>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${statusColor(competition.status)}`}>
                  {competition.status?.replace(/_/g, " ")}
                </span>
                <Badge variant="outline" className="border-white/20 text-white/60 capitalize text-xs">{competition.format?.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="border-white/20 text-white/60 capitalize text-xs">{competition.type?.replace(/_/g, " ")}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">{competition.name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-white/60 text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-white/35" />{formatDate(competition.start_date)}</span>
                {competition.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-white/35" />{competition.venue ? `${competition.venue}, ` : ""}{competition.location}</span>}
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-white/35" />{competition.current_participants} registered</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-[#FAFAF8]">{formatFee(competition.entry_fee, competition.currency)}</div>
              {competition.max_participants && (
                <div className={`text-sm ${isFull ? "text-white/50 font-bold" : "text-white/40"}`}>
                  {isFull ? "Registration Full" : `${competition.max_participants - competition.current_participants} spots left`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-5xl py-8" id="competition-tabs">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto gap-0.5 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#FAFAF8] data-[state=active]:text-[#080808] text-white/50">Overview</TabsTrigger>
            <TabsTrigger value="workouts" className="data-[state=active]:bg-[#FAFAF8] data-[state=active]:text-[#080808] text-white/50">Workouts</TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[#FAFAF8] data-[state=active]:text-[#080808] text-white/50">Leaderboard</TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#FAFAF8] data-[state=active]:text-[#080808] text-white/50">Schedule</TabsTrigger>
            {competition.status === "registration_open" && (
              <TabsTrigger value="register" className="data-[state=active]:bg-[#FAFAF8] data-[state=active]:text-[#080808] text-white/50">Register</TabsTrigger>
            )}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {competition.description && (
                  <Card className="bg-[#111111] border-white/10">
                    <CardHeader><CardTitle className="text-white">About This Competition</CardTitle></CardHeader>
                    <CardContent><p className="text-white/60 leading-relaxed whitespace-pre-wrap">{competition.description}</p></CardContent>
                  </Card>
                )}
                {competition.rules && (
                  <Card className="bg-[#111111] border-white/10">
                    <CardHeader><CardTitle className="text-white flex items-center gap-2"><Shield className="w-4 h-4 text-white/40" />Rules & Guidelines</CardTitle></CardHeader>
                    <CardContent><p className="text-white/60 leading-relaxed whitespace-pre-wrap">{competition.rules}</p></CardContent>
                  </Card>
                )}
                {competition.categories?.length > 0 && (
                  <Card className="bg-[#111111] border-white/10">
                    <CardHeader><CardTitle className="text-white">Categories</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {competition.categories.map((cat: any) => (
                          <div key={cat.id} className="p-3 bg-white/5 rounded-md border border-white/8">
                            <div className="font-semibold text-white">{cat.name}</div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <Badge variant="outline" className="text-xs border-white/20 text-white/50 capitalize">{cat.difficulty_level}</Badge>
                              <Badge variant="outline" className="text-xs border-white/20 text-white/50 capitalize">{cat.gender}</Badge>
                              {cat.age_min && <Badge variant="outline" className="text-xs border-white/20 text-white/50">Age {cat.age_min}{cat.age_max ? `-${cat.age_max}` : "+"}</Badge>}
                            </div>
                            {cat.description && <p className="text-white/40 text-sm mt-1.5">{cat.description}</p>}
                            <p className="text-white/30 text-xs mt-1.5">{cat.current_participants}{cat.max_participants ? `/${cat.max_participants}` : ""} registered</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="space-y-4">
                <Card className="bg-[#111111] border-white/10">
                  <CardContent className="pt-5 space-y-3">
                    <div>
                      <p className="text-white/35 text-xs uppercase tracking-wider mb-1">Dates</p>
                      <p className="text-white text-sm">{formatDate(competition.start_date)}</p>
                      {competition.start_date !== competition.end_date && <p className="text-white/50 text-sm">to {formatDate(competition.end_date)}</p>}
                    </div>
                    {competition.venue && <div><p className="text-white/35 text-xs uppercase tracking-wider mb-1">Venue</p><p className="text-white text-sm">{competition.venue}</p></div>}
                    {competition.address && <div><p className="text-white/35 text-xs uppercase tracking-wider mb-1">Address</p><p className="text-white text-sm">{competition.address}</p></div>}
                    {competition.registration_close_date && (
                      <div><p className="text-white/35 text-xs uppercase tracking-wider mb-1">Registration Closes</p><p className="text-white/70 text-sm font-medium">{formatDate(competition.registration_close_date)}</p></div>
                    )}
                  </CardContent>
                </Card>

                {isRegistered && (
                  <>
                    <Card className="bg-white/5 border-white/15">
                      <CardContent className="pt-5 space-y-2">
                        <div className="flex items-center gap-2 text-[#FAFAF8] font-semibold"><CheckCircle className="w-5 h-5" />Registered</div>
                        <p className="text-white/50 text-sm">Category: <span className="text-white">{myReg?.category_name}</span></p>
                        <p className="text-white/50 text-sm capitalize">Status: <span className="text-white">{myReg?.status?.replace(/_/g, " ")}</span></p>
                      </CardContent>
                    </Card>

                    {isTeam && (
                      <Card className="bg-[#111111] border-white/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white text-sm flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-white/40" /> Manage Team</span>
                            {myReg?.team_name && (
                              <button onClick={() => { setEditingTeamName(myReg.team_name); setShowTeamNameEdit(s => !s); }} className="text-white/25 hover:text-white/50 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </CardTitle>
                          {myReg?.team_name && !showTeamNameEdit && <p className="text-white/40 text-xs">{myReg.team_name}</p>}
                          {showTeamNameEdit && (
                            <div className="flex gap-2 mt-1">
                              <Input value={editingTeamName} onChange={e => setEditingTeamName(e.target.value)} placeholder="Team name" className="bg-white/5 border-white/20 text-white text-xs h-8 px-2" />
                              <Button size="sm" disabled={updateTeamNameMutation.isPending || !editingTeamName} onClick={() => updateTeamNameMutation.mutate(editingTeamName)} className="bg-[#FAFAF8] text-[#080808] font-bold h-8 px-3 text-xs shrink-0">Save</Button>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {teamMembers && teamMembers.length > 0 ? (
                            <div className="space-y-2">
                              {teamMembers.filter((m: any) => !m.removed_at).map((m: any) => (
                                <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                                  <span className="text-white truncate">{m.first_name} {m.last_name}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {m.invite_status === "accepted" ? (
                                      <span className="flex items-center gap-1 text-white/60 text-xs"><UserCheck className="w-3 h-3" /> Confirmed</span>
                                    ) : m.invite_status === "declined" ? (
                                      <span className="flex items-center gap-1 text-white/40 text-xs"><UserX className="w-3 h-3" /> Declined</span>
                                    ) : (
                                      <span className="text-white/25 text-xs">Pending</span>
                                    )}
                                    <button onClick={() => removeTeamMemberMutation.mutate(m.id)} className="text-white/20 hover:text-white/50 transition-colors" title="Remove teammate">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-white/25 text-xs">No teammates invited yet.</p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Teammate's email" className="bg-white/5 border-white/20 text-white text-xs h-8 px-2 placeholder:text-white/20" />
                            <Button size="sm" disabled={inviteMutation.isPending || !inviteEmail} onClick={() => inviteMutation.mutate(inviteEmail)} className="bg-[#FAFAF8] text-[#080808] font-bold h-8 px-3 text-xs shrink-0 gap-1">
                              <UserPlus className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-white/20 text-[11px]">Invitees must have a 1stRep account. An email notification will be sent.</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {!isRegistered && competition.status === "registration_open" && (
                  isFull ? (
                    <Button disabled className="w-full bg-white/8 text-white/30 font-bold h-11 cursor-not-allowed">Registration Full</Button>
                  ) : (
                    <Button
                      className="w-full bg-[#FAFAF8] text-[#080808] font-bold h-11"
                      onClick={() => {
                        if (!isLoggedIn) {
                          setLocation(`/login?redirect=/competitions/${slug}`);
                          return;
                        }
                        setActiveTab("register");
                        setTimeout(() => {
                          document.getElementById("competition-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 50);
                      }}
                    >
                      Register Now
                    </Button>
                  )
                )}

                <Link href={`/competitions/${slug}/leaderboard`} target="_blank">
                  <Button variant="outline" className="w-full border-white/20 text-white gap-2">
                    <Monitor className="w-4 h-4" /> Live Leaderboard Display
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>

          {/* Workouts */}
          <TabsContent value="workouts">
            {!workouts?.length ? (
              <div className="text-center py-16 text-white/35">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Workouts haven't been announced yet. Check back soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map((workout: any, idx: number) => {
                  const isFormOpen = scoreFormOpen === workout.id;
                  const deadlinePassed = workout.submission_deadline && new Date(workout.submission_deadline) < new Date();
                  const canSubmit = isRegistered && (competition.status === "live" || competition.status === "registration_open");

                  if (!workout.is_public) {
                    return (
                      <Card key={workout.id} className="bg-[#111111] border-white/10 opacity-50">
                        <CardContent className="pt-5">
                          <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-white/25 shrink-0" />
                            <div>
                              <span className="text-white/40 font-black text-sm">Workout {idx + 1}</span>
                              <h3 className="text-white/40 font-bold text-lg">To Be Revealed</h3>
                              <p className="text-white/25 text-xs mt-0.5">This workout will be announced closer to the event.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card key={workout.id} className="bg-[#111111] border-white/10">
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-white/70 font-black text-sm">Workout {idx + 1}</span>
                              <div className="flex items-center gap-1 text-white/40 text-xs">{workoutTypeIcon(workout.type)}<span className="capitalize">{workout.type?.replace(/_/g, " ")}</span></div>
                              {workout.time_cap && <span className="text-white/30 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{Math.floor(workout.time_cap / 60)} min cap</span>}
                            </div>
                            <h3 className="text-white font-bold text-lg">{workout.name}</h3>
                            {workout.description && <p className="text-white/55 text-sm mt-2 whitespace-pre-wrap">{workout.description}</p>}
                            {workout.submission_deadline && (
                              <p className={`text-xs mt-2 flex items-center gap-1 ${deadlinePassed ? "text-white/40" : "text-white/60"}`}>
                                <Clock className="w-3 h-3" />
                                {deadlinePassed ? "Submission closed: " : "Submit by: "}{formatDate(workout.submission_deadline)} at {formatTime(workout.submission_deadline)}
                              </p>
                            )}
                          </div>
                          {canSubmit && !deadlinePassed && (
                            <Button size="sm" variant="outline" onClick={() => { if (isFormOpen) { setScoreFormOpen(null); } else { setScoreFormOpen(workout.id); setScoreDraft({ score: "", videoProof: "", isDnf: false, dnfReps: "" }); } }} className="border-white/20 text-white/70 gap-1.5 shrink-0">
                              <Send className="w-3.5 h-3.5" />{isFormOpen ? "Cancel" : "Submit Score"}
                            </Button>
                          )}
                        </div>

                        {isFormOpen && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            <p className="text-white/60 text-sm font-medium">Submit your score for Workout {idx + 1}</p>
                            {workout.type === "for_time" && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={scoreDraft.isDnf} onChange={e => setScoreDraft(p => ({ ...p, isDnf: e.target.checked, score: "" }))} className="accent-white w-4 h-4" />
                                <span className="text-white/60 text-sm font-medium flex items-center gap-1"><TimerReset className="w-3.5 h-3.5" /> DNF (hit time cap)</span>
                              </label>
                            )}
                            <div className="grid sm:grid-cols-2 gap-3">
                              {scoreDraft.isDnf ? (
                                <div>
                                  <label className="text-white/40 text-xs block mb-1">Reps completed at time cap</label>
                                  <Input type="number" placeholder="e.g. 87" value={scoreDraft.dnfReps} onChange={e => setScoreDraft(p => ({ ...p, dnfReps: e.target.value }))} className="bg-white/5 border-white/20 text-white h-9" />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-white/40 text-xs block mb-1">{workout.type === "for_time" ? "Time (MM:SS)" : workout.type === "max_weight" ? "Weight (kg)" : workout.type === "max_distance" ? "Distance (m)" : "Score"}</label>
                                  <Input placeholder={workout.type === "for_time" ? "5:23" : workout.type === "max_weight" ? "100" : "Score"} value={scoreDraft.score} onChange={e => setScoreDraft(p => ({ ...p, score: e.target.value }))} className="bg-white/5 border-white/20 text-white h-9" type={workout.type === "for_time" ? "text" : "number"} />
                                </div>
                              )}
                              <div>
                                <label className="text-white/40 text-xs block mb-1 flex items-center gap-1"><Video className="w-3 h-3" /> Video Proof URL (optional)</label>
                                <Input placeholder="YouTube / Instagram link..." value={scoreDraft.videoProof} onChange={e => setScoreDraft(p => ({ ...p, videoProof: e.target.value }))} className="bg-white/5 border-white/20 text-white h-9" />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button onClick={() => submitScoreMutation.mutate({ workoutId: workout.id, workout })} disabled={submitScoreMutation.isPending || (!scoreDraft.isDnf && !scoreDraft.score)} className="bg-[#FAFAF8] text-[#080808] font-bold gap-2 h-9">
                                <Send className="w-3.5 h-3.5" />{submitScoreMutation.isPending ? "Submitting..." : "Submit Score"}
                              </Button>
                              <p className="text-white/25 text-xs self-center">Pending admin validation</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><ListOrdered className="w-5 h-5 text-white/40" /><h3 className="font-bold text-white text-lg">Live Standings</h3></div>
                <div className="flex items-center gap-3">
                  {competition.categories?.length > 1 && (
                    <Select value={leaderboardCategory} onValueChange={cat => { setLeaderboardCategory(cat); fetchLeaderboard(cat); }}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white w-48 h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        {competition.categories.map((cat: any) => <SelectItem key={cat.id} value={cat.id} className="text-white">{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <Link href={`/competitions/${slug}/leaderboard`} target="_blank">
                    <Button variant="outline" size="sm" className="border-white/20 text-white gap-1.5 h-9"><ExternalLink className="w-3.5 h-3.5" /> Full Display</Button>
                  </Link>
                </div>
              </div>
              {leaderboard.length === 0 ? (
                <div className="text-center py-16 text-white/35"><Trophy className="w-12 h-12 mx-auto mb-4 opacity-25" /><p>No scores yet. Check back once the competition begins.</p></div>
              ) : (
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="text-left px-4 py-3 text-white/40 font-medium">Rank</th>
                        <th className="text-left px-4 py-3 text-white/40 font-medium">Athlete / Team</th>
                        {workouts?.filter((w: any) => w.is_public).map((w: any, i: number) => (
                          <th key={w.id} className="text-center px-3 py-3 text-white/40 font-medium hidden md:table-cell">WOD {i + 1}</th>
                        ))}
                        <th className="text-center px-4 py-3 text-white/40 font-medium">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry: any) => (
                        <tr key={entry.registrationId} className={`border-b border-white/5 ${entry.rank <= 3 ? "bg-white/4" : ""}`}>
                          <td className="px-4 py-3">
                            <span className={`font-black text-lg ${entry.rank === 1 ? "text-[#FAFAF8]" : entry.rank === 2 ? "text-white/60" : entry.rank === 3 ? "text-white/40" : "text-white/25"}`}>{entry.rank}</span>
                          </td>
                          <td className="px-4 py-3 text-white font-medium">{entry.teamName || `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || `Athlete #${entry.registrationId?.slice(0, 6)}`}</td>
                          {workouts?.filter((w: any) => w.is_public).map((w: any) => {
                            const ws = entry.workoutScores?.find((s: any) => s.workoutId === w.id);
                            return (
                              <td key={w.id} className="text-center px-3 py-3 hidden md:table-cell">
                                {ws?.score ? <span className="text-white/70 text-xs">{ws.score}<br /><span className="text-white/25">({ws.place})</span></span> : <span className="text-white/15">—</span>}
                              </td>
                            );
                          })}
                          <td className="text-center px-4 py-3">
                            <span className={`font-bold ${entry.totalPoints < 999999 ? "text-[#FAFAF8]" : "text-white/25"}`}>{entry.totalPoints < 999999 ? entry.totalPoints : "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule">
            {!schedule?.length ? (
              <div className="text-center py-16 text-white/35"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-25" /><p>Schedule not yet published.</p></div>
            ) : (
              <div className="space-y-4">
                {schedule.map((heat: any) => (
                  <Card key={heat.id} className="bg-[#111111] border-white/10">
                    <CardContent className="pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white/50 text-xs font-bold uppercase tracking-wider">{heat.workout_name}</p>
                          <h3 className="text-white font-bold">Heat {heat.heat_number}</h3>
                          {heat.start_time && <p className="text-white/40 text-sm">{formatTime(heat.start_time)}</p>}
                        </div>
                        <Badge variant="outline" className="border-white/15 text-white/40">{heat.assignments?.length ?? 0} athletes</Badge>
                      </div>
                      {heat.assignments?.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {heat.assignments.map((a: any) => (
                            <div key={a.assignmentId} className="flex items-center gap-2 p-2 bg-white/5 rounded-md">
                              <span className="text-white/50 font-bold text-xs shrink-0">L{a.laneNumber}</span>
                              <span className="text-white text-xs truncate">{a.userName || a.teamName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Register */}
          {competition.status === "registration_open" && (
            <TabsContent value="register">
              <div className="max-w-lg mx-auto space-y-4">

                {/* Auth gate */}
                {!isLoggedIn && (
                  <Card className="bg-[#111111] border-white/10">
                    <CardContent className="pt-6 pb-6 text-center space-y-4">
                      <LogIn className="w-10 h-10 text-white/40 mx-auto" />
                      <div>
                        <h3 className="text-white font-bold text-lg">Sign in to Register</h3>
                        <p className="text-white/40 text-sm mt-1">You need a 1stRep account to register for this competition.</p>
                      </div>
                      <div className="flex gap-3 justify-center flex-wrap">
                        <Button
                          className="bg-[#FAFAF8] text-[#080808] font-bold gap-2"
                          onClick={() => setLocation(`/login?redirect=/competitions/${slug}`)}
                        >
                          <LogIn className="w-4 h-4" /> Sign In
                        </Button>
                        <Button variant="outline" className="border-white/20 text-white gap-2" onClick={() => setLocation(`/register?redirect=/competitions/${slug}`)}>
                          Create Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Registration confirmed */}
                {isLoggedIn && registrationStep === "confirmed" && (
                  <Card className="bg-white/5 border-white/15">
                    <CardContent className="pt-8 pb-8 text-center space-y-3">
                      <CheckCircle className="w-14 h-14 text-[#FAFAF8] mx-auto" />
                      <h3 className="text-white font-bold text-xl">Registration Confirmed!</h3>
                      <p className="text-white/50 text-sm">You're registered for <span className="text-white font-medium">{competition.name}</span>.</p>
                      {myReg?.category_name && (
                        <p className="text-white/40 text-sm">Category: <span className="text-white/70 font-semibold">{myReg.category_name}</span></p>
                      )}
                      <div className="flex gap-3 justify-center pt-1 flex-wrap">
                        <Button className="bg-[#FAFAF8] text-[#080808] font-bold gap-2" onClick={() => setActiveTab("overview")}>
                          <Trophy className="w-4 h-4" /> View Competition
                        </Button>
                        <Button variant="outline" className="border-white/20 text-white" onClick={() => setLocation("/account")}>
                          My Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Already registered */}
                {isLoggedIn && isRegistered && registrationStep !== "confirmed" && (
                  <Card className="bg-white/5 border-white/15">
                    <CardContent className="pt-6 text-center space-y-3">
                      <CheckCircle className="w-12 h-12 text-[#FAFAF8] mx-auto" />
                      <h3 className="text-white font-bold text-xl">You're Already Registered!</h3>
                      <p className="text-white/50 text-sm">Category: <span className="text-white">{myReg?.category_name}</span></p>
                      <Button className="bg-[#FAFAF8] text-[#080808] font-bold" onClick={() => setLocation("/account")}>View My Competitions</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Registration Full */}
                {isLoggedIn && !isRegistered && isFull && (
                  <Card className="bg-[#111111] border-white/10">
                    <CardContent className="pt-6 pb-6 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-white/25 mx-auto" />
                      <h3 className="text-white font-bold text-lg">Registration Full</h3>
                      <p className="text-white/40 text-sm">This competition has reached maximum capacity. Check back in case a spot opens up.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Confirming payment */}
                {isLoggedIn && registrationStep === "confirming" && (
                  <Card className="bg-[#111111] border-white/10">
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                      <Loader2 className="w-10 h-10 text-white/60 animate-spin mx-auto" />
                      <h3 className="text-white font-bold text-lg">Confirming your payment…</h3>
                      <p className="text-white/40 text-sm">Please wait while we verify your payment and confirm your entry.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Registration Form */}
                {isLoggedIn && !isRegistered && !isFull && registrationStep === "form" && (
                  <Card className="bg-[#111111] border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-white/40" /> Register for {competition.name}
                      </CardTitle>
                      <p className="text-white/40 text-sm">
                        Entry fee: <span className="text-white/80 font-semibold">{formatFee(competition.entry_fee, competition.currency || "GBP")}</span>
                        {competition.max_participants && ` · ${competition.max_participants - competition.current_participants} spots remaining`}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Category */}
                      <div>
                        <label className="text-white/50 text-xs block mb-1.5">Category *</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue placeholder="Select a category" /></SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/20">
                            {competition.categories?.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id} className="text-white">
                                {cat.name}
                                {cat.max_participants && ` (${cat.max_participants - cat.current_participants} spots left)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Team Name */}
                      {isTeam && (
                        <div>
                          <label className="text-white/50 text-xs block mb-1.5">Team Name (optional)</label>
                          <Input
                            placeholder="Enter your team name..."
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                            className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
                          />
                        </div>
                      )}

                      {/* Promo Code */}
                      {competition.entry_fee > 0 && (
                        <div>
                          <label className="text-white/50 text-xs block mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Promo Code (optional)</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter code..."
                              value={promoCode}
                              onChange={e => { setPromoCode(e.target.value); setPromoResult(null); setPromoError(""); }}
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/20"
                            />
                            <Button variant="outline" onClick={applyPromoCode} disabled={promoLoading || !promoCode.trim()} className="border-white/20 text-white shrink-0">
                              {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                            </Button>
                          </div>
                          {promoResult && (
                            <p className="text-white/60 text-xs mt-1.5 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {promoResult.discountType === "percentage"
                                ? `${promoResult.discountValue}% discount applied`
                                : `£${(promoResult.discountValue / 100).toFixed(2)} off`}
                              {" "}— New total: {formatFee(promoResult.finalAmount, competition.currency || "GBP")}
                            </p>
                          )}
                          {promoError && <p className="text-white/40 text-xs mt-1.5">{promoError}</p>}
                        </div>
                      )}

                      {/* Shirt size */}
                      <div>
                        <label className="text-white/50 text-xs block mb-1.5">T-Shirt Size (optional)</label>
                        <Select value={shirtSize} onValueChange={setShirtSize}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/20">
                            {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Waiver */}
                      {competition.waiver_text && (
                        <div className="space-y-2">
                          <label className="text-white/50 text-xs block mb-1">Liability Waiver *</label>
                          <div className="p-3 bg-white/5 rounded-md border border-white/10 max-h-32 overflow-y-auto">
                            <p className="text-white/50 text-xs whitespace-pre-wrap">{competition.waiver_text}</p>
                          </div>
                          <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                              checked={waiverSigned}
                              onCheckedChange={v => setWaiverSigned(!!v)}
                              className="mt-0.5 border-white/30 data-[state=checked]:bg-[#FAFAF8] data-[state=checked]:border-[#FAFAF8]"
                            />
                            <span className="text-white/60 text-sm">I have read and agree to the liability waiver</span>
                          </label>
                        </div>
                      )}

                      {/* Fee summary */}
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white/50 text-sm">Total due</span>
                          <span className="text-[#FAFAF8] font-black text-xl">
                            {promoResult ? formatFee(promoResult.finalAmount, competition.currency || "GBP") : formatFee(competition.entry_fee, competition.currency || "GBP")}
                          </span>
                        </div>

                        {competition.entry_fee === 0 || (promoResult && promoResult.finalAmount === 0) ? (
                          <Button
                            className="w-full bg-[#FAFAF8] text-[#080808] font-bold h-11"
                            disabled={registerMutation.isPending || (!!competition.waiver_text && !waiverSigned) || !selectedCategory}
                            onClick={() => registerMutation.mutate()}
                          >
                            {registerMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Registering…</> : "Complete Registration"}
                          </Button>
                        ) : (
                          <Button
                            className="w-full bg-[#FAFAF8] text-[#080808] font-bold h-11 gap-2"
                            disabled={createSquareCheckoutMutation.isPending || (!!competition.waiver_text && !waiverSigned) || !selectedCategory}
                            onClick={() => createSquareCheckoutMutation.mutate()}
                          >
                            {createSquareCheckoutMutation.isPending
                              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Preparing payment…</>
                              : <><CreditCard className="w-4 h-4" /> Pay & Register</>}
                          </Button>
                        )}
                        <p className="text-white/25 text-xs text-center mt-2">Secure payment powered by Square</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
