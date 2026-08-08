import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRoute, Link } from "wouter";
import {
  Trophy, Plus, Edit, Trash2, Users, Eye, EyeOff, Calendar,
  Download, CheckCircle, XCircle, BarChart3, Settings, Dumbbell,
  ListOrdered, Clock, ChevronDown, ChevronUp, MapPin, RefreshCw,
  ArrowLeft, Save, AlertTriangle, Ban, Timer, Weight, MoveHorizontal, Flame,
  Search, Tag, X, DollarSign, AlertCircle, UserCheck, Mail, Inbox, Building2,
  Crown, UserX, Pencil, UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function statusColor(s: string) {
  switch (s) {
    case "live": return "bg-red-600/20 text-red-300 border-red-600/30";
    case "registration_open": return "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30";
    case "completed": return "bg-white/10 text-white/50 border-white/10";
    case "cancelled": return "bg-red-900/20 text-red-400 border-red-800/30";
    case "draft": return "bg-white/5 text-white/40 border-white/10";
    default: return "bg-white/5 text-white/50 border-white/10";
  }
}

// ─── Create Competition Dialog ───────────────────────────────────────────────
function CreateCompetitionDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", type: "single_day", format: "individual",
    location: "", venue: "", address: "", startDate: "", endDate: "",
    registrationOpenDate: "", registrationCloseDate: "",
    maxParticipants: "", entryFee: "0", isPublic: false, rules: "", waiverText: "",
  });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/competitions", {
      ...form,
      maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
      entryFee: parseInt(form.entryFee || "0"),
    }),
    onSuccess: () => {
      toast({ title: "Competition created" });
      setOpen(false);
      onCreated();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const f = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold gap-2">
          <Plus className="w-4 h-4" /> New Competition
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Competition</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-white/60 text-xs">Competition Name *</Label>
              <Input value={form.name} onChange={e => f("name", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="e.g. 1stRep Open 2025" /></div>
            <div><Label className="text-white/60 text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => f("type", v)}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  <SelectItem value="single_day" className="text-white">Single Day</SelectItem>
                  <SelectItem value="multi_day" className="text-white">Multi Day</SelectItem>
                  <SelectItem value="online" className="text-white">Online</SelectItem>
                  <SelectItem value="hybrid" className="text-white">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-white/60 text-xs">Format</Label>
              <Select value={form.format} onValueChange={v => f("format", v)}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  <SelectItem value="individual" className="text-white">Individual</SelectItem>
                  <SelectItem value="teams_of_2" className="text-white">Teams of 2</SelectItem>
                  <SelectItem value="teams_of_3" className="text-white">Teams of 3</SelectItem>
                  <SelectItem value="teams_of_4" className="text-white">Teams of 4</SelectItem>
                  <SelectItem value="mixed" className="text-white">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-white/60 text-xs">Entry Fee (pence)</Label>
              <Input type="number" value={form.entryFee} onChange={e => f("entryFee", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="0 = free" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-white/60 text-xs">Start Date *</Label>
              <Input type="datetime-local" value={form.startDate} onChange={e => f("startDate", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" /></div>
            <div><Label className="text-white/60 text-xs">End Date *</Label>
              <Input type="datetime-local" value={form.endDate} onChange={e => f("endDate", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-white/60 text-xs">Registration Opens</Label>
              <Input type="datetime-local" value={form.registrationOpenDate} onChange={e => f("registrationOpenDate", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" /></div>
            <div><Label className="text-white/60 text-xs">Registration Closes</Label>
              <Input type="datetime-local" value={form.registrationCloseDate} onChange={e => f("registrationCloseDate", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-white/60 text-xs">Location</Label>
              <Input value={form.location} onChange={e => f("location", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="City, Country" /></div>
            <div><Label className="text-white/60 text-xs">Venue</Label>
              <Input value={form.venue} onChange={e => f("venue", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="Venue name" /></div>
          </div>
          <div><Label className="text-white/60 text-xs">Max Participants</Label>
            <Input type="number" value={form.maxParticipants} onChange={e => f("maxParticipants", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="Leave blank for unlimited" /></div>
          <div><Label className="text-white/60 text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => f("description", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1 min-h-20" placeholder="Competition description..." /></div>
          <div><Label className="text-white/60 text-xs">Rules & Guidelines</Label>
            <Textarea value={form.rules} onChange={e => f("rules", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1 min-h-20" placeholder="Competition rules..." /></div>
          <div>
            <Label className="text-white/60 text-xs">Liability Waiver Text</Label>
            <p className="text-white/30 text-xs mb-1">If filled in, athletes must read and tick this waiver before registering.</p>
            <Textarea value={form.waiverText} onChange={e => f("waiverText", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1 min-h-24" placeholder="By participating in this event, I acknowledge that..." />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isPublic} onCheckedChange={v => f("isPublic", v)} className="data-[state=checked]:bg-[#C9A84C]" />
            <Label className="text-white/70">Make competition public</Label>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.startDate || !form.endDate}
            className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold">
            {mutation.isPending ? "Creating..." : "Create Competition"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage single competition ───────────────────────────────────────────────
function CompetitionManageView({ compId, compSlug }: { compId: string; compSlug: string }) {
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState({ name: "", difficultyLevel: "open", gender: "any", maxParticipants: "" });
  const [newWorkout, setNewWorkout] = useState({ name: "", description: "", type: "for_time", timeCap: "", sortOrder: "0", isPublic: false });
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editWorkoutForm, setEditWorkoutForm] = useState({ name: "", description: "", type: "for_time", timeCap: "", sortOrder: "0", isPublic: false });
  const [heatForm, setHeatForm] = useState({ workoutId: "", heatSize: "10", startTime: "", intervalMinutes: "20" });
  const [editingHeatTime, setEditingHeatTime] = useState<{ heatId: string; value: string } | null>(null);
  const [addingAthleteToHeatId, setAddingAthleteToHeatId] = useState<string | null>(null);
  const [manualHeatWorkoutId, setManualHeatWorkoutId] = useState<string>("");
  const [scoringWorkoutId, setScoringWorkoutId] = useState<string>("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { score: string; isDnf: boolean; dnfReps: string; status: string }>>({});
  const [savingScores, setSavingScores] = useState(false);
  // Registration search/filter/selection
  const [regSearch, setRegSearch] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState("all");
  const [regPaymentFilter, setRegPaymentFilter] = useState("all");
  const [selectedRegs, setSelectedRegs] = useState<Set<string>>(new Set());
  const [teamView, setTeamView] = useState(false);
  // Promo codes
  const [newPromo, setNewPromo] = useState({ code: "", discountType: "percentage", discountValue: "", maxUses: "", expiresAt: "" });
  // Registration detail modal
  const [selectedRegDetail, setSelectedRegDetail] = useState<any>(null);
  // Category editing
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name: "", difficultyLevel: "open", gender: "any", maxParticipants: "", description: "" });
  const [detailsForm, setDetailsForm] = useState<any>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  // Form Team (from individual selection)
  const [formTeamOpen, setFormTeamOpen] = useState(false);
  const [formTeamCaptainId, setFormTeamCaptainId] = useState("");
  const [formTeamName, setFormTeamName] = useState("");
  // Create Team (from team view — no pre-selection needed)
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createTeamName, setCreateTeamName] = useState("");
  const [createTeamCaptainId, setCreateTeamCaptainId] = useState("");
  const [createTeamMemberIds, setCreateTeamMemberIds] = useState<Set<string>>(new Set());
  // Add member to existing team
  const [addMemberToCaptainId, setAddMemberToCaptainId] = useState<string | null>(null);
  const [addMemberRegId, setAddMemberRegId] = useState("");

  const { data: competition, refetch: refetchComp } = useQuery<any>({
    queryKey: ["/api/admin/competitions", compId],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${compSlug}`);
      return res.json();
    },
  });

  const { data: registrations, refetch: refetchRegs } = useQuery<any[]>({
    queryKey: ["/api/competitions", compId, "registrations"],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${compId}/registrations`);
      return res.json();
    },
  });

  const { data: workouts, refetch: refetchWorkouts } = useQuery<any[]>({
    queryKey: ["/api/competitions", compId, "workouts", "admin"],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${compSlug}/workouts`);
      return res.json();
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (regId: string) => apiRequest("PUT", `/api/competitions/${compId}/registrations/${regId}/check-in`, {}),
    onSuccess: () => { toast({ title: "Athlete checked in" }); refetchRegs(); },
  });

  const bulkCheckInMutation = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", `/api/competitions/${compId}/registrations/bulk-checkin`, { registrationIds: ids }).then(r => r.json()),
    onSuccess: (data: any) => { toast({ title: `${data.count ?? 0} athlete${(data.count ?? 0) !== 1 ? "s" : ""} checked in` }); setSelectedRegs(new Set()); refetchRegs(); },
    onError: (err: any) => toast({ title: "Bulk check-in failed", description: err.message, variant: "destructive" }),
  });

  const confirmRegMutation = useMutation({
    mutationFn: (regId: string) => apiRequest("PUT", `/api/competitions/${compId}/registrations/${regId}/confirm`, {}),
    onSuccess: () => { toast({ title: "Registration confirmed" }); refetchRegs(); },
    onError: (err: any) => toast({ title: "Failed to confirm", description: err.message, variant: "destructive" }),
  });

  const cancelRegMutation = useMutation({
    mutationFn: (regId: string) => apiRequest("DELETE", `/api/competitions/${compId}/registrations/${regId}`, { reason: "Cancelled by admin" }),
    onSuccess: () => { toast({ title: "Registration cancelled" }); refetchRegs(); },
    onError: (err: any) => toast({ title: "Failed to cancel", description: err.message, variant: "destructive" }),
  });

  const purgeRegMutation = useMutation({
    mutationFn: (regId: string) => apiRequest("DELETE", `/api/competitions/${compId}/registrations/${regId}/purge`),
    onSuccess: () => { toast({ title: "Registration permanently deleted" }); setSelectedRegDetail(null); refetchRegs(); },
    onError: (err: any) => toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  // Dedicated team-view query — fetches properly grouped team data from the server
  const { data: teamsData, refetch: refetchTeams } = useQuery<{ teams: any[]; noTeam: any[] }>({
    queryKey: ["/api/admin/competitions", compId, "teams"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/competitions/${compId}/teams`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
    enabled: !!compId,
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ regId, memberId }: { regId: string; memberId: string }) =>
      apiRequest("DELETE", `/api/admin/competitions/${compId}/registrations/${regId}/members/${memberId}`),
    onSuccess: (_data, { regId, memberId }) => {
      toast({ title: "Team member removed" });
      setSelectedRegDetail((prev: any) => prev ? {
        ...prev,
        team_members: prev.team_members.filter((m: any) => m.id !== memberId),
      } : prev);
      refetchRegs();
      refetchTeams();
    },
    onError: (err: any) => toast({ title: "Failed to remove member", description: err.message, variant: "destructive" }),
  });

  const makeCaptainMutation = useMutation({
    mutationFn: ({ regId, memberId }: { regId: string; memberId: string }) =>
      apiRequest("POST", `/api/admin/competitions/${compId}/registrations/${regId}/members/${memberId}/make-captain`),
    onSuccess: () => {
      toast({ title: "Captain updated" });
      setSelectedRegDetail(null);
      refetchRegs();
      refetchTeams();
    },
    onError: (err: any) => toast({ title: "Failed to transfer captaincy", description: err.message, variant: "destructive" }),
  });

  // Swap captain between two registrations that share a team_name (works even with no CTM records)
  const swapCaptainMutation = useMutation({
    mutationFn: ({ currentCaptainRegId, newCaptainRegId }: { currentCaptainRegId: string; newCaptainRegId: string }) =>
      apiRequest("POST", `/api/admin/competitions/${compId}/swap-captain`, { currentCaptainRegId, newCaptainRegId }),
    onSuccess: () => { toast({ title: "Captain updated" }); refetchRegs(); refetchTeams(); },
    onError: (err: any) => toast({ title: "Failed to transfer captaincy", description: err.message, variant: "destructive" }),
  });

  // Remove a registration from its team (clears team_name, no CTM record needed)
  const removeFromTeamMutation = useMutation({
    mutationFn: (regId: string) =>
      apiRequest("DELETE", `/api/admin/competitions/${compId}/registrations/${regId}/remove-from-team`),
    onSuccess: () => { toast({ title: "Removed from team" }); refetchRegs(); refetchTeams(); },
    onError: (err: any) => toast({ title: "Failed to remove from team", description: err.message, variant: "destructive" }),
  });

  const formTeamMutation = useMutation({
    mutationFn: ({ captainRegId, memberRegIds, teamName }: { captainRegId: string; memberRegIds: string[]; teamName: string }) =>
      apiRequest("POST", `/api/admin/competitions/${compId}/form-team`, { captainRegId, memberRegIds, teamName }),
    onSuccess: () => {
      toast({ title: "Team formed successfully" });
      setFormTeamOpen(false);
      setFormTeamCaptainId("");
      setFormTeamName("");
      setSelectedRegs(new Set());
      refetchRegs();
      refetchTeams();
    },
    onError: (err: any) => toast({ title: "Failed to form team", description: err.message, variant: "destructive" }),
  });

  const createTeamMutation = useMutation({
    mutationFn: ({ captainRegId, memberRegIds, teamName }: { captainRegId: string; memberRegIds: string[]; teamName: string }) =>
      apiRequest("POST", `/api/admin/competitions/${compId}/form-team`, { captainRegId, memberRegIds, teamName }),
    onSuccess: () => {
      toast({ title: "Team created successfully" });
      setCreateTeamOpen(false);
      setCreateTeamName("");
      setCreateTeamCaptainId("");
      setCreateTeamMemberIds(new Set());
      refetchRegs();
      refetchTeams();
    },
    onError: (err: any) => toast({ title: "Failed to create team", description: err.message, variant: "destructive" } as any),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ captainRegId, memberRegId }: { captainRegId: string; memberRegId: string }) =>
      apiRequest("POST", `/api/admin/competitions/${compId}/registrations/${captainRegId}/add-member`, { memberRegId }),
    onSuccess: () => {
      toast({ title: "Member added to team" });
      setAddMemberToCaptainId(null);
      setAddMemberRegId("");
      refetchRegs();
      refetchTeams();
    },
    onError: (err: any) => toast({ title: "Failed to add member", description: err.message, variant: "destructive" } as any),
  });

  const { data: promoCodes, refetch: refetchPromos } = useQuery<any[]>({
    queryKey: ["/api/competitions", compId, "promo-codes"],
    queryFn: async () => { const res = await fetch(`/api/competitions/${compId}/promo-codes`); return res.json(); },
  });

  const { data: heatSchedule, refetch: refetchSchedule } = useQuery<any[]>({
    queryKey: ["/api/competitions", compSlug, "schedule"],
    queryFn: async () => { const res = await fetch(`/api/competitions/${compSlug}/schedule`); if (!res.ok) return []; return res.json(); },
  });

  const createPromoMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/competitions/${compId}/promo-codes`, newPromo),
    onSuccess: () => { toast({ title: "Promo code created" }); refetchPromos(); setNewPromo({ code: "", discountType: "percentage", discountValue: "", maxUses: "", expiresAt: "" }); },
    onError: (err: any) => toast({ title: "Failed to create promo code", description: err.message, variant: "destructive" }),
  });

  const togglePromoMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiRequest("PUT", `/api/competitions/${compId}/promo-codes/${id}`, { isActive }),
    onSuccess: () => refetchPromos(),
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/competitions/${compId}/promo-codes/${id}`),
    onSuccess: () => { toast({ title: "Promo code deleted" }); refetchPromos(); },
  });

  const toggleScoresVisibleMutation = useMutation({
    mutationFn: ({ id, scoresVisible }: any) => apiRequest("PUT", `/api/competitions/${compId}/workouts/${id}`, { scoresVisible }),
    onSuccess: () => refetchWorkouts(),
  });

  const handleSaveScores = async () => {
    const selectedWorkout = workouts?.find((w: any) => w.id === scoringWorkoutId);
    if (!selectedWorkout) return;
    setSavingScores(true);
    let saved = 0;
    let failed = 0;
    for (const [regId, draft] of Object.entries(scoreDrafts)) {
      if (!draft.score && !draft.isDnf && draft.status === "validated") continue;
      try {
        let scoreNumeric: number | null = null;
        let scoreDisplay = draft.score;
        let status = draft.isDnf ? "dnf" : (draft.status || "validated");
        if (draft.isDnf) {
          scoreNumeric = draft.dnfReps ? parseInt(draft.dnfReps) : 0;
          scoreDisplay = `DNF (${scoreNumeric} reps)`;
          scoreNumeric = null;
        } else if (status === "dns" || status === "dq") {
          scoreNumeric = null;
          scoreDisplay = status.toUpperCase();
        } else if (selectedWorkout.type === "for_time") {
          // Parse MM:SS
          const parts = draft.score.split(":").map(Number);
          scoreNumeric = parts.length === 2 ? parts[0] * 60 + parts[1] : parseInt(draft.score) || 0;
          scoreDisplay = draft.score;
        } else {
          scoreNumeric = parseFloat(draft.score) || null;
          scoreDisplay = draft.score;
        }
        await apiRequest("POST", `/api/competitions/${compId}/scores`, {
          registrationId: regId,
          workoutId: scoringWorkoutId,
          score: scoreDisplay,
          scoreNumeric,
          status,
          dnfReps: draft.isDnf ? (parseInt(draft.dnfReps) || 0) : null,
        });
        saved++;
      } catch {
        failed++;
      }
    }
    setSavingScores(false);
    if (failed > 0) {
      toast({ title: `Saved ${saved}, ${failed} failed`, variant: "destructive" });
    } else {
      toast({ title: `${saved} score${saved !== 1 ? "s" : ""} saved` });
    }
    setScoreDrafts({});
    // Refresh leaderboard
    try { await apiRequest("POST", `/api/competitions/${compId}/leaderboard/refresh`, {}); } catch {}
  };

  const addCategoryMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/competitions/${compId}/categories`, {
      ...newCategory, maxParticipants: newCategory.maxParticipants ? parseInt(newCategory.maxParticipants) : null,
    }),
    onSuccess: () => { toast({ title: "Category added" }); refetchComp(); setNewCategory({ name: "", difficultyLevel: "open", gender: "any", maxParticipants: "" }); },
  });

  const editCategoryMutation = useMutation({
    mutationFn: ({ catId, data }: { catId: string; data: any }) => apiRequest("PUT", `/api/competitions/${compId}/categories/${catId}`, {
      ...data, maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants) : null,
    }),
    onSuccess: () => { toast({ title: "Category updated" }); refetchComp(); setEditingCategoryId(null); },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" } as any),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (catId: string) => apiRequest("DELETE", `/api/competitions/${compId}/categories/${catId}`),
    onSuccess: () => { toast({ title: "Category deleted" }); refetchComp(); },
    onError: () => toast({ title: "Failed to delete category", variant: "destructive" } as any),
  });

  const addWorkoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/competitions/${compId}/workouts`, {
      ...newWorkout, timeCap: newWorkout.timeCap ? parseInt(newWorkout.timeCap) : null, sortOrder: parseInt(newWorkout.sortOrder),
    }),
    onSuccess: () => { toast({ title: "Workout added" }); refetchWorkouts(); setNewWorkout({ name: "", description: "", type: "for_time", timeCap: "", sortOrder: "0", isPublic: false }); },
  });

  const toggleWorkoutMutation = useMutation({
    mutationFn: ({ id, isPublic }: any) => apiRequest("PATCH", `/api/competitions/${compId}/workouts/${id}/visibility`, { isPublic }),
    onSuccess: () => refetchWorkouts(),
    onError: () => toast({ title: "Failed to update visibility", variant: "destructive" } as any),
  });

  const updateWorkoutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/competitions/${compId}/workouts/${id}`, {
      ...data,
      timeCap: data.timeCap ? parseInt(data.timeCap) : null,
      sortOrder: parseInt(data.sortOrder),
    }),
    onSuccess: () => { toast({ title: "Workout updated" }); refetchWorkouts(); setEditingWorkoutId(null); },
    onError: () => toast({ title: "Failed to update workout", variant: "destructive" } as any),
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/competitions/${compId}/workouts/${id}`),
    onSuccess: () => { toast({ title: "Workout deleted" }); refetchWorkouts(); },
    onError: () => toast({ title: "Failed to delete workout", variant: "destructive" } as any),
  });

  const createEmptyHeatMutation = useMutation({
    mutationFn: ({ workoutId }: { workoutId: string }) => apiRequest("POST", `/api/competitions/${compId}/heats`, { workoutId }),
    onSuccess: () => { toast({ title: "Empty heat created" }); refetchSchedule(); },
    onError: () => toast({ title: "Failed to create heat", variant: "destructive" } as any),
  });

  const addHeatAssignmentMutation = useMutation({
    mutationFn: ({ heatId, registrationId }: { heatId: string; registrationId: string }) =>
      apiRequest("POST", `/api/competitions/${compId}/heats/${heatId}/assignments`, { registrationId }),
    onSuccess: () => { toast({ title: "Athlete added to heat" }); setAddingAthleteToHeatId(null); refetchSchedule(); },
    onError: () => toast({ title: "Failed to add athlete", variant: "destructive" } as any),
  });

  const removeHeatAssignmentMutation = useMutation({
    mutationFn: ({ heatId, assignmentId }: { heatId: string; assignmentId: string }) =>
      apiRequest("DELETE", `/api/competitions/${compId}/heats/${heatId}/assignments/${assignmentId}`),
    onSuccess: () => { toast({ title: "Athlete removed" }); refetchSchedule(); },
    onError: () => toast({ title: "Failed to remove athlete", variant: "destructive" } as any),
  });

  const deleteHeatMutation = useMutation({
    mutationFn: (heatId: string) => apiRequest("DELETE", `/api/competitions/${compId}/heats/${heatId}`),
    onSuccess: () => { toast({ title: "Heat deleted" }); refetchSchedule(); },
    onError: () => toast({ title: "Failed to delete heat", variant: "destructive" } as any),
  });

  const heatMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/competitions/${compId}/heats/generate`, {
      workoutId: heatForm.workoutId, heatSize: parseInt(heatForm.heatSize),
      startTime: heatForm.startTime, intervalMinutes: parseInt(heatForm.intervalMinutes) || 20,
    }).then(r => r.json()),
    onSuccess: (data: any) => { toast({ title: `${data.heatsGenerated ?? 0} heat${(data.heatsGenerated ?? 0) !== 1 ? "s" : ""} generated` }); refetchSchedule(); },
  });

  const updateHeatTimeMutation = useMutation({
    mutationFn: ({ heatId, startTime }: { heatId: string; startTime: string }) =>
      apiRequest("PATCH", `/api/competitions/${compId}/heats/${heatId}/start-time`, { startTime }),
    onSuccess: () => { toast({ title: "Heat time updated" }); setEditingHeatTime(null); refetchSchedule(); },
    onError: () => toast({ title: "Failed to update heat time", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => apiRequest("PUT", `/api/competitions/${compId}`, { status }),
    onSuccess: () => { toast({ title: "Status updated" }); refetchComp(); },
  });

  const refreshLeaderboardMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/competitions/${compId}/leaderboard/refresh`, {}),
    onSuccess: () => toast({ title: "Leaderboard refreshed" }),
  });

  const exportAthletes = () => window.open(`/api/competitions/${compId}/export/athletes`, "_blank");

  const confirmed = registrations?.filter(r => ["confirmed", "checked_in"].includes(r.status)).length ?? 0;
  const checkedIn = registrations?.filter(r => r.status === "checked_in").length ?? 0;
  const revenueCollected = registrations?.filter(r => r.payment_status === "paid").reduce((s: number, r: any) => s + (r.amount_paid || competition?.entry_fee || 0), 0) ?? 0;
  const pendingPayment = registrations?.filter(r => r.payment_status === "unpaid" && r.status !== "withdrawn").length ?? 0;

  // Filtered registrations
  const filteredRegs = (registrations ?? []).filter(r => {
    const q = regSearch.toLowerCase();
    const matchSearch = !q || `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(q);
    const matchStatus = regStatusFilter === "all" || r.status === regStatusFilter;
    const matchPayment = regPaymentFilter === "all" || r.payment_status === regPaymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  // teamsData comes from the dedicated /api/admin/competitions/:compId/teams endpoint
  // Filter teams/noTeam by the search + status + payment filters
  const filteredTeamsData = useMemo(() => {
    if (!teamsData) return { teams: [], noTeam: [] };
    const q = regSearch.toLowerCase();
    const matchReg = (r: any) => {
      const matchSearch = !q || `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(q);
      const matchStatus = regStatusFilter === "all" || r.status === regStatusFilter;
      const matchPayment = regPaymentFilter === "all" || r.payment_status === regPaymentFilter;
      return matchSearch && matchStatus && matchPayment;
    };
    const matchMember = (m: any) => !q || `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q);
    const teams = teamsData.teams.filter(t =>
      (t.captain && matchReg(t.captain)) || t.members.some(matchMember) || t.noTeamRegs.some(matchReg)
    );
    const noTeam = teamsData.noTeam.filter(matchReg);
    return { teams, noTeam };
  }, [teamsData, regSearch, regStatusFilter, regPaymentFilter]);

  if (!competition) return <div className="py-16 text-center text-white/40">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#111111] rounded-md border border-white/10">
        <div>
          <h2 className="text-white font-bold text-xl">{competition.name}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${statusColor(competition.status)}`}>
              {competition.status?.replace(/_/g, " ")}
            </span>
            <span className="text-white/40 text-xs">{formatDate(competition.start_date)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["draft", "registration_open", "live", "completed", "cancelled"].map(s => (
            <Button key={s} variant="outline" size="sm"
              onClick={() => updateStatusMutation.mutate(s)}
              className={`border-white/20 text-xs capitalize h-8 ${competition.status === s ? "border-[#C9A84C] text-[#C9A84C]" : "text-white/60"}`}>
              {s.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-1"><Users className="w-3.5 h-3.5" /> Registered</div>
            <div className="text-2xl font-black text-white">{registrations?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-1"><UserCheck className="w-3.5 h-3.5" /> Checked In</div>
            <div className="text-2xl font-black text-white">{checkedIn}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-1"><DollarSign className="w-3.5 h-3.5" /> Revenue</div>
            <div className="text-2xl font-black text-[#C9A84C]">£{(revenueCollected / 100).toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-1"><AlertCircle className="w-3.5 h-3.5" /> Pending Pay</div>
            <div className={`text-2xl font-black ${pendingPayment > 0 ? "text-[#C9A84C]" : "text-white"}`}>{pendingPayment}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registrations">
        <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-0.5 p-1">
          {["registrations", "categories", "workouts", "scoring", "heats", "promo-codes", "details"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black text-white/60 capitalize">{tab.replace(/-/g, " ")}</TabsTrigger>
          ))}
        </TabsList>

        {/* Registrations */}
        <TabsContent value="registrations">
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input value={regSearch} onChange={e => setRegSearch(e.target.value)} placeholder="Search by name or email..." className="bg-white/5 border-white/20 text-white pl-9 h-9 text-sm" />
                {regSearch && <button onClick={() => setRegSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="w-4 h-4" /></button>}
              </div>
              <Select value={regStatusFilter} onValueChange={setRegStatusFilter}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-9 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  {["all", "pending", "confirmed", "checked_in", "withdrawn"].map(s => <SelectItem key={s} value={s} className="text-white text-xs capitalize">{s === "all" ? "All Statuses" : s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={regPaymentFilter} onValueChange={setRegPaymentFilter}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  <SelectItem value="all" className="text-white text-xs">All Payments</SelectItem>
                  <SelectItem value="paid" className="text-white text-xs">Paid</SelectItem>
                  <SelectItem value="unpaid" className="text-white text-xs">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 ml-auto flex-wrap">
                <Button size="sm" variant="outline"
                  onClick={() => setTeamView(v => !v)}
                  className={`h-9 gap-1.5 text-xs ${teamView ? "border-[#C9A84C]/60 text-[#C9A84C] bg-[#C9A84C]/10" : "border-white/20 text-white/60"}`}>
                  <Users className="w-3.5 h-3.5" /> {teamView ? "Individual View" : "Team View"}
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => { setCreateTeamOpen(true); setCreateTeamName(""); setCreateTeamCaptainId(""); setCreateTeamMemberIds(new Set()); }}
                  className="border-green-500/40 text-green-400 h-9 gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Create Team
                </Button>
                {selectedRegs.size >= 2 && (
                  <Button size="sm" variant="outline" onClick={() => { setFormTeamOpen(true); setFormTeamCaptainId(""); setFormTeamName(""); }} className="border-[#C9A84C]/40 text-[#C9A84C] h-9 gap-1.5 text-xs">
                    <Crown className="w-3.5 h-3.5" /> Form Team ({selectedRegs.size})
                  </Button>
                )}
                {selectedRegs.size > 0 && (
                  <Button size="sm" onClick={() => bulkCheckInMutation.mutate(Array.from(selectedRegs))} disabled={bulkCheckInMutation.isPending} className="bg-[#C9A84C] text-black font-bold h-9 gap-1.5 text-xs">
                    <UserCheck className="w-3.5 h-3.5" /> Bulk Check-In ({selectedRegs.size})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={exportAthletes} className="border-white/20 text-white gap-1.5 h-9 text-xs">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
              </div>

              {/* Create Team Dialog */}
              <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
                <DialogContent className="bg-[#111111] border border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2"><Crown className="w-4 h-4 text-green-400" /> Create New Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5 mt-2">
                    {/* Team name */}
                    <div>
                      <Label className="text-white/60 text-xs mb-1.5 block">Team Name <span className="text-white/30">(optional — defaults to captain's name)</span></Label>
                      <Input
                        value={createTeamName}
                        onChange={e => setCreateTeamName(e.target.value)}
                        placeholder="e.g. CrossFit Buxton"
                        className="bg-white/5 border-white/20 text-white h-9 text-sm"
                      />
                    </div>
                    {/* Captain picker */}
                    <div>
                      <Label className="text-white/60 text-xs mb-2 block">Select Captain <span className="text-red-400">*</span></Label>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {(registrations ?? [])
                          .filter((r: any) => !r.team_name || r.team_name === "")
                          .map((r: any) => (
                            <label key={r.id}
                              className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${createTeamCaptainId === r.id ? "border-[#C9A84C]/60 bg-[#C9A84C]/5" : "border-white/10 hover:border-white/20"}`}>
                              <input type="radio" name="createCaptain" value={r.id} checked={createTeamCaptainId === r.id}
                                onChange={() => { setCreateTeamCaptainId(r.id); setCreateTeamMemberIds(prev => { const s = new Set(prev); s.delete(r.id); return s; }); }}
                                className="accent-yellow-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white text-sm font-medium">{r.first_name} {r.last_name}</span>
                                  {createTeamCaptainId === r.id && <Badge variant="outline" className="text-xs border-[#C9A84C]/40 text-[#C9A84C]">Captain</Badge>}
                                </div>
                                <p className="text-white/40 text-xs truncate">{r.email} · {r.category_name}</p>
                              </div>
                            </label>
                          ))}
                        {!(registrations ?? []).filter((r: any) => !r.team_name).length && (
                          <p className="text-white/30 text-sm text-center py-4">All registrations are already in teams.</p>
                        )}
                      </div>
                    </div>
                    {/* Members picker (optional) */}
                    {createTeamCaptainId && (
                      <div>
                        <Label className="text-white/60 text-xs mb-2 block">Add Members <span className="text-white/30">(optional — tick to include)</span></Label>
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {(registrations ?? [])
                            .filter((r: any) => r.id !== createTeamCaptainId && (!r.team_name || r.team_name === ""))
                            .map((r: any) => (
                              <label key={r.id}
                                className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${createTeamMemberIds.has(r.id) ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-white/10 hover:border-white/20"}`}>
                                <input type="checkbox" checked={createTeamMemberIds.has(r.id)}
                                  onChange={e => {
                                    setCreateTeamMemberIds(prev => {
                                      const s = new Set(prev);
                                      if (e.target.checked) s.add(r.id); else s.delete(r.id);
                                      return s;
                                    });
                                  }}
                                  className="accent-yellow-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm">{r.first_name} {r.last_name}</p>
                                  <p className="text-white/40 text-xs truncate">{r.email} · {r.category_name}</p>
                                </div>
                              </label>
                            ))}
                          {!(registrations ?? []).filter((r: any) => r.id !== createTeamCaptainId && !r.team_name).length && (
                            <p className="text-white/30 text-xs text-center py-3">No other unassigned registrations available.</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-600/90 text-white font-bold gap-1.5"
                        disabled={!createTeamCaptainId || createTeamMutation.isPending}
                        onClick={() => createTeamMutation.mutate({
                          captainRegId: createTeamCaptainId,
                          memberRegIds: Array.from(createTeamMemberIds),
                          teamName: createTeamName,
                        })}>
                        <Crown className="w-3.5 h-3.5" /> {createTeamMutation.isPending ? "Creating..." : `Create Team${createTeamMemberIds.size ? ` (${createTeamMemberIds.size + 1} members)` : ""}`}
                      </Button>
                      <Button variant="outline" className="border-white/20 text-white" onClick={() => setCreateTeamOpen(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Form Team Dialog */}
              <Dialog open={formTeamOpen} onOpenChange={setFormTeamOpen}>
                <DialogContent className="bg-[#111111] border border-white/10 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2"><Crown className="w-4 h-4 text-[#C9A84C]" /> Form Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <p className="text-white/50 text-sm">
                      You have selected {selectedRegs.size} registrations. Choose who will be the <span className="text-[#C9A84C] font-semibold">captain</span> — the others will become team members under them.
                    </p>
                    <div>
                      <Label className="text-white/60 text-xs mb-1.5 block">Team Name <span className="text-white/30">(optional)</span></Label>
                      <Input
                        value={formTeamName}
                        onChange={e => setFormTeamName(e.target.value)}
                        placeholder="e.g. Team Alpha"
                        className="bg-white/5 border-white/20 text-white h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60 text-xs mb-1.5 block">Select Captain</Label>
                      <div className="space-y-2">
                        {(registrations ?? []).filter(r => selectedRegs.has(r.id)).map((r: any) => (
                          <label key={r.id} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${formTeamCaptainId === r.id ? "border-[#C9A84C]/60 bg-[#C9A84C]/5" : "border-white/10 bg-white/3 hover:border-white/20"}`}>
                            <input
                              type="radio"
                              name="captain"
                              value={r.id}
                              checked={formTeamCaptainId === r.id}
                              onChange={() => setFormTeamCaptainId(r.id)}
                              className="accent-yellow-400"
                            />
                            <div>
                              <p className="text-white text-sm font-medium">{r.first_name} {r.last_name}</p>
                              <p className="text-white/40 text-xs">{r.email} · {r.category_name}</p>
                            </div>
                            {formTeamCaptainId === r.id && <Crown className="w-4 h-4 text-[#C9A84C] ml-auto shrink-0" />}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        className="flex-1 bg-[#C9A84C] text-black font-bold gap-1.5"
                        disabled={!formTeamCaptainId || formTeamMutation.isPending}
                        onClick={() => {
                          const memberRegIds = Array.from(selectedRegs).filter(id => id !== formTeamCaptainId);
                          formTeamMutation.mutate({ captainRegId: formTeamCaptainId, memberRegIds, teamName: formTeamName });
                        }}
                      >
                        <Crown className="w-3.5 h-3.5" /> {formTeamMutation.isPending ? "Forming..." : "Form Team"}
                      </Button>
                      <Button variant="outline" className="border-white/20 text-white" onClick={() => setFormTeamOpen(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* ── TEAM VIEW ──────────────────────────────────────────── */}
            {teamView ? (
              <div className="space-y-4">
                {!teamsData ? (
                  <div className="py-10 text-center text-white/30 text-sm">Loading teams…</div>
                ) : filteredTeamsData.teams.length === 0 && filteredTeamsData.noTeam.length === 0 ? (
                  <div className="py-10 text-center text-white/30 text-sm">
                    {teamsData.teams.length || teamsData.noTeam.length ? "No results match your filters" : "No registrations yet"}
                  </div>
                ) : null}

                {filteredTeamsData.teams.map((grp: any) => {
                  const captainRegId = grp.captain?.id;
                  // Registrations not in any team — available to add
                  const availableToAdd = (registrations ?? []).filter((r: any) => !r.team_name);
                  return (
                  <div key={grp.teamName} className="border border-white/10 rounded-md overflow-hidden">
                    {/* Team header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C]/8 border-b border-white/10">
                      <Crown className="w-4 h-4 text-[#C9A84C] shrink-0" />
                      <span className="text-[#C9A84C] font-bold text-sm">{grp.teamName}</span>
                      <span className="text-white/30 text-xs ml-1">
                        {1 + grp.members.length + (grp.noTeamRegs?.length ?? 0)} member{(grp.members.length + (grp.noTeamRegs?.length ?? 0)) !== 0 ? "s" : ""}
                      </span>
                      {captainRegId && (
                        <div className="ml-auto flex items-center gap-2">
                          {addMemberToCaptainId === captainRegId ? (
                            <>
                              <Select value={addMemberRegId} onValueChange={setAddMemberRegId}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white h-7 text-xs w-52">
                                  <SelectValue placeholder="Select athlete…" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/20">
                                  {availableToAdd.map((r: any) => (
                                    <SelectItem key={r.id} value={r.id} className="text-white text-xs">
                                      {r.first_name} {r.last_name} · {r.category_name}
                                    </SelectItem>
                                  ))}
                                  {!availableToAdd.length && (
                                    <SelectItem value="__none" disabled className="text-white/30 text-xs">No unassigned athletes</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <Button size="sm" className="h-7 text-xs bg-[#C9A84C] text-black font-bold"
                                disabled={!addMemberRegId || addMemberMutation.isPending}
                                onClick={() => addMemberMutation.mutate({ captainRegId, memberRegId: addMemberRegId })}>
                                {addMemberMutation.isPending ? "…" : "Add"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-white/40"
                                onClick={() => { setAddMemberToCaptainId(null); setAddMemberRegId(""); }}>Cancel</Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-white/50 gap-1 hover:text-white"
                              onClick={() => { setAddMemberToCaptainId(captainRegId); setAddMemberRegId(""); }}>
                              <UserPlus className="w-3 h-3" /> Add Member
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Captain row */}
                    {grp.captain && (() => {
                      // Build the full team_members list for the modal:
                      // CTM-based members first, then noTeamRegs converted to the same shape
                      const allTeamMembers = [
                        ...grp.members,
                        ...(grp.noTeamRegs ?? []).map((r: any) => ({
                          id: r.id,
                          user_id: r.user_id,
                          first_name: r.first_name,
                          last_name: r.last_name,
                          email: r.email,
                          invite_status: "accepted",
                          role: "member",
                          shirt_size: r.shirt_size,
                          waiver_signed: false,
                        })),
                      ];
                      const captainWithMembers = { ...grp.captain, team_members: allTeamMembers };
                      return (
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                          onClick={() => setSelectedRegDetail(captainWithMembers)}>
                          <Crown className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" title="Captain" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-white font-semibold text-sm">{grp.captain.first_name} {grp.captain.last_name}</span>
                              <Badge variant="outline" className="text-xs border-[#C9A84C]/40 text-[#C9A84C]">Captain</Badge>
                              <Badge variant="outline" className={`text-xs capitalize ${grp.captain.status === "checked_in" ? "border-green-500/30 text-green-400" : grp.captain.status === "confirmed" ? "border-[#C9A84C]/30 text-[#C9A84C]" : "border-white/20 text-white/50"}`}>
                                {grp.captain.status?.replace(/_/g, " ")}
                              </Badge>
                              {grp.captain.shirt_size
                                ? <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{grp.captain.shirt_size}</Badge>
                                : <span className="text-white/20 text-xs italic">No shirt size</span>}
                            </div>
                            <p className="text-white/40 text-xs mt-0.5">{grp.captain.email}</p>
                          </div>
                          <div className="text-white/30 text-xs shrink-0">{formatDate(grp.captain.registered_at)}</div>
                          <Button variant="outline" size="sm" title="View details"
                            onClick={e => { e.stopPropagation(); setSelectedRegDetail(captainWithMembers); }}
                            className="border-white/20 text-white/60 h-7 text-xs shrink-0">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })()}

                    {/* Members (from competition_team_members) — always have crown + remove buttons */}
                    {grp.members.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/1">
                        <Users className="w-3.5 h-3.5 text-white/30 shrink-0 ml-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-white/80 text-sm">{m.first_name} {m.last_name}</span>
                            <Badge variant="outline" className="text-xs border-white/20 text-white/40 capitalize">{m.invite_status}</Badge>
                            {m.shirt_size
                              ? <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{m.shirt_size}</Badge>
                              : <span className="text-white/20 text-xs italic">No shirt size</span>}
                            {m.invite_status === "accepted" && (
                              m.waiver_signed
                                ? <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Waiver signed</Badge>
                                : <Badge variant="outline" className="text-xs border-orange-400/30 text-orange-300">No waiver</Badge>
                            )}
                          </div>
                          <p className="text-white/30 text-xs mt-0.5">{m.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {m.invite_status === "accepted" && (
                            <Button size="icon" variant="ghost" title="Promote to captain"
                              className="h-7 w-7 text-[#C9A84C]/50 hover:text-[#C9A84C]"
                              onClick={() => { if (confirm(`Make ${m.first_name} ${m.last_name} the captain?`)) makeCaptainMutation.mutate({ regId: grp.captain.id, memberId: m.id }); }}
                              disabled={makeCaptainMutation.isPending}>
                              <Crown className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title="Remove from team"
                            className="h-7 w-7 text-red-400/50 hover:text-red-400"
                            onClick={() => { if (confirm(`Remove ${m.first_name} ${m.last_name} from the team?`)) removeMemberMutation.mutate({ regId: grp.captain.id, memberId: m.id }); }}
                            disabled={removeMemberMutation.isPending}>
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Extra regs sharing team_name but not in anyone's team_members — swap-captain flow */}
                    {(grp.noTeamRegs ?? []).map((reg: any) => (
                      <div key={reg.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/1 hover:bg-white/3 cursor-pointer transition-colors"
                        onClick={() => setSelectedRegDetail(reg)}>
                        <Users className="w-3.5 h-3.5 text-white/30 shrink-0 ml-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-white/80 text-sm">{reg.first_name} {reg.last_name}</span>
                            <Badge variant="outline" className={`text-xs capitalize ${reg.status === "checked_in" ? "border-green-500/30 text-green-400" : reg.status === "confirmed" ? "border-[#C9A84C]/30 text-[#C9A84C]" : "border-white/20 text-white/50"}`}>
                              {reg.status?.replace(/_/g, " ")}
                            </Badge>
                            {reg.shirt_size
                              ? <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{reg.shirt_size}</Badge>
                              : <span className="text-white/20 text-xs italic">No shirt size</span>}
                          </div>
                          <p className="text-white/30 text-xs mt-0.5">{reg.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" title="Promote to captain"
                            className="h-7 w-7 text-[#C9A84C]/50 hover:text-[#C9A84C]"
                            onClick={() => { if (confirm(`Make ${reg.first_name} ${reg.last_name} the captain of ${grp.teamName}?`)) swapCaptainMutation.mutate({ currentCaptainRegId: grp.captain.id, newCaptainRegId: reg.id }); }}
                            disabled={swapCaptainMutation.isPending}>
                            <Crown className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Remove from team"
                            className="h-7 w-7 text-red-400/50 hover:text-red-400"
                            onClick={() => { if (confirm(`Remove ${reg.first_name} ${reg.last_name} from ${grp.teamName}?`)) removeFromTeamMutation.mutate(reg.id); }}
                            disabled={removeFromTeamMutation.isPending}>
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRegDetail(reg)}
                            className="border-white/20 text-white/60 h-7 text-xs">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                })}

                {/* Unassigned / solo registrations */}
                {filteredTeamsData.noTeam.length > 0 && (
                  <div className="border border-white/10 rounded-md overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/3 border-b border-white/10">
                      <Users className="w-4 h-4 text-white/30 shrink-0" />
                      <span className="text-white/40 font-bold text-sm">No Team Assigned</span>
                      <span className="text-white/20 text-xs ml-1">{filteredTeamsData.noTeam.length}</span>
                    </div>
                    {filteredTeamsData.noTeam.map((reg: any) => (
                      <div key={reg.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                        onClick={() => setSelectedRegDetail(reg)}>
                        <div className="w-3.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-white/80 text-sm">{reg.first_name} {reg.last_name}</span>
                            <Badge variant="outline" className={`text-xs capitalize ${reg.status === "checked_in" ? "border-green-500/30 text-green-400" : reg.status === "confirmed" ? "border-[#C9A84C]/30 text-[#C9A84C]" : "border-white/20 text-white/50"}`}>
                              {reg.status?.replace(/_/g, " ")}
                            </Badge>
                            {reg.shirt_size && <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{reg.shirt_size}</Badge>}
                          </div>
                          <p className="text-white/30 text-xs mt-0.5">{reg.email}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSelectedRegDetail(reg); }}
                          className="border-white/20 text-white/60 h-7 text-xs shrink-0">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
            /* ── INDIVIDUAL VIEW (flat table) ─────────────────────── */
            <div className="rounded-md border border-white/10 overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-3 py-3 w-8">
                      <input type="checkbox" className="accent-yellow-400 w-4 h-4 cursor-pointer" checked={filteredRegs.length > 0 && filteredRegs.every(r => selectedRegs.has(r.id))}
                        onChange={e => {
                          if (e.target.checked) setSelectedRegs(new Set(filteredRegs.map(r => r.id)));
                          else setSelectedRegs(new Set());
                        }} />
                    </th>
                    <th className="text-left px-3 py-3 text-white/40 font-medium">Athlete</th>
                    <th className="text-left px-3 py-3 text-white/40 font-medium">Category</th>
                    <th className="text-left px-3 py-3 text-white/40 font-medium">Shirt</th>
                    <th className="text-left px-3 py-3 text-white/40 font-medium">Status</th>
                    <th className="text-left px-3 py-3 text-white/40 font-medium">Payment</th>
                    <th className="text-left px-3 py-3 text-white/40 font-medium">Registered</th>
                    <th className="px-3 py-3 text-white/40 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map(reg => (
                    <tr key={reg.id} className={`border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedRegs.has(reg.id) ? "bg-[#C9A84C]/5" : ""}`}
                      onClick={() => setSelectedRegDetail(reg)}>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="accent-yellow-400 w-4 h-4 cursor-pointer" checked={selectedRegs.has(reg.id)}
                          onChange={e => {
                            const s = new Set(selectedRegs);
                            if (e.target.checked) s.add(reg.id); else s.delete(reg.id);
                            setSelectedRegs(s);
                          }} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-white font-medium">{reg.first_name} {reg.last_name}</div>
                        <div className="text-white/40 text-xs">{reg.email}</div>
                        {reg.team_name && <div className="text-[#C9A84C]/70 text-xs mt-0.5">{reg.team_name}</div>}
                      </td>
                      <td className="px-3 py-3 text-white/70 text-xs">{reg.category_name}</td>
                      <td className="px-3 py-3">
                        {reg.shirt_size
                          ? <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{reg.shirt_size}</Badge>
                          : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={`text-xs capitalize ${reg.status === "checked_in" ? "border-green-500/30 text-green-400" : reg.status === "confirmed" ? "border-[#C9A84C]/30 text-[#C9A84C]" : reg.status === "withdrawn" ? "border-red-500/30 text-red-400" : "border-white/20 text-white/50"}`}>
                          {reg.status?.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className={`text-xs ${reg.payment_status === "paid" ? "border-green-500/30 text-green-400" : "border-[#C9A84C]/30 text-[#C9A84C]"}`}>
                          {reg.payment_status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-white/40 text-xs">{formatDate(reg.registered_at)}</td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          {reg.status === "pending" && (
                            <Button variant="outline" size="sm" onClick={() => confirmRegMutation.mutate(reg.id)} disabled={confirmRegMutation.isPending} className="border-green-500/30 text-green-400 h-7 text-xs gap-1">
                              <CheckCircle className="w-3 h-3" /> Confirm
                            </Button>
                          )}
                          {reg.status !== "checked_in" && reg.status !== "withdrawn" && (
                            <Button variant="outline" size="sm" onClick={() => checkInMutation.mutate(reg.id)} disabled={checkInMutation.isPending} className="border-white/20 text-white h-7 text-xs gap-1">
                              <UserCheck className="w-3 h-3" />
                            </Button>
                          )}
                          {reg.status !== "withdrawn" && (
                            <Button variant="outline" size="sm" onClick={() => { if (confirm(`Cancel registration for ${reg.first_name} ${reg.last_name}?`)) cancelRegMutation.mutate(reg.id); }} disabled={cancelRegMutation.isPending} className="border-red-500/30 text-red-400 h-7 text-xs gap-1">
                              <XCircle className="w-3 h-3" />
                            </Button>
                          )}
                          {reg.status === "withdrawn" && (
                            <Button variant="outline" size="sm" onClick={() => { if (confirm(`Permanently delete registration for ${reg.first_name} ${reg.last_name}? This cannot be undone.`)) purgeRegMutation.mutate(reg.id); }} disabled={purgeRegMutation.isPending} className="border-red-800/40 text-red-500 h-7 text-xs gap-1" title="Permanently delete">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" title="View details & manage team"
                            onClick={() => setSelectedRegDetail(reg)}
                            className="border-white/20 text-white/60 h-7 text-xs gap-1">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredRegs.length && (
                <div className="py-10 text-center text-white/30 text-sm">
                  {registrations?.length ? "No results match your filters" : "No registrations yet"}
                </div>
              )}
            </div>
            )}
            {filteredRegs.length > 0 && (
              <p className="text-white/30 text-xs">Showing {filteredRegs.length} of {registrations?.length ?? 0} registration{(registrations?.length ?? 0) !== 1 ? "s" : ""}</p>
            )}
          </div>
        </TabsContent>

        {/* Registration Detail Modal */}
        <Dialog open={!!selectedRegDetail} onOpenChange={open => { if (!open) setSelectedRegDetail(null); }}>
          <DialogContent className="bg-[#111111] border border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">Registration Details</DialogTitle>
            </DialogHeader>
            {selectedRegDetail && (
              <div className="space-y-5 mt-1">
                {/* Athlete */}
                <div className="space-y-1">
                  <p className="text-white/40 text-xs uppercase tracking-wider">Athlete</p>
                  <p className="text-white font-semibold text-base">{selectedRegDetail.first_name} {selectedRegDetail.last_name}</p>
                  <p className="text-white/50 text-sm">{selectedRegDetail.email}</p>
                </div>

                {/* Shirt Sizes Summary */}
                {(selectedRegDetail.shirt_size || (Array.isArray(selectedRegDetail.team_members) && selectedRegDetail.team_members.some((m: any) => m.shirt_size))) && (
                  <div className="bg-white/5 border border-white/10 rounded-md p-3">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Shirt Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegDetail.shirt_size && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/50 text-xs">{selectedRegDetail.first_name}:</span>
                          <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{selectedRegDetail.shirt_size}</Badge>
                        </div>
                      )}
                      {Array.isArray(selectedRegDetail.team_members) && selectedRegDetail.team_members.filter((m: any) => m.shirt_size).map((m: any) => (
                        <div key={m.id} className="flex items-center gap-1.5">
                          <span className="text-white/50 text-xs">{m.first_name || m.email?.split("@")[0]}:</span>
                          <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{m.shirt_size}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Category</p>
                    <p className="text-white text-sm">{selectedRegDetail.category_name}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status</p>
                    <Badge variant="outline" className={`text-xs capitalize ${selectedRegDetail.status === "checked_in" ? "border-green-500/30 text-green-400" : selectedRegDetail.status === "confirmed" ? "border-[#C9A84C]/30 text-[#C9A84C]" : selectedRegDetail.status === "withdrawn" ? "border-red-500/30 text-red-400" : "border-white/20 text-white/50"}`}>
                      {selectedRegDetail.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                {/* Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Payment</p>
                    <Badge variant="outline" className={`text-xs ${selectedRegDetail.payment_status === "paid" ? "border-green-500/30 text-green-400" : "border-[#C9A84C]/30 text-[#C9A84C]"}`}>
                      {selectedRegDetail.payment_status}
                    </Badge>
                  </div>
                  {selectedRegDetail.amount_paid > 0 && (
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Amount Paid</p>
                      <p className="text-white text-sm">£{(selectedRegDetail.amount_paid / 100).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                {/* Team */}
                {(selectedRegDetail.team_name || (Array.isArray(selectedRegDetail.team_members) && selectedRegDetail.team_members.length > 0)) && (
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Team Members</p>
                    {selectedRegDetail.team_name && <p className="text-[#C9A84C] font-medium text-sm mb-3">{selectedRegDetail.team_name}</p>}
                    {Array.isArray(selectedRegDetail.team_members) && selectedRegDetail.team_members.length > 0 ? (
                      <div className="space-y-2">
                        {selectedRegDetail.team_members.map((m: any) => (
                          <div key={m.id} className="flex items-start justify-between gap-2 py-2 px-3 bg-white/5 rounded-md">
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium">{m.first_name || m.email} {m.last_name || ""}</p>
                              <p className="text-white/40 text-xs">{m.email}</p>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs border-white/20 text-white/50 capitalize">{m.role}</Badge>
                                {m.shirt_size && (
                                  <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300 font-mono">{m.shirt_size}</Badge>
                                )}
                                {m.invite_status === "accepted" ? (
                                  m.waiver_signed
                                    ? <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Waiver signed</Badge>
                                    : <Badge variant="outline" className="text-xs border-orange-400/30 text-orange-300">No waiver</Badge>
                                ) : (
                                  <Badge variant="outline" className={`text-xs capitalize ${m.invite_status === "pending" ? "border-[#C9A84C]/30 text-[#C9A84C]/70" : "border-red-500/30 text-red-400"}`}>
                                    {m.invite_status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              {m.user_id && m.invite_status === "accepted" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-[#C9A84C]/60 hover:text-[#C9A84C]"
                                  title="Make captain"
                                  onClick={() => {
                                    if (confirm(`Make ${m.first_name} ${m.last_name} the captain? The current captain will become a regular member.`)) {
                                      makeCaptainMutation.mutate({ regId: selectedRegDetail.id, memberId: m.id });
                                    }
                                  }}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-400/60 hover:text-red-400"
                                title="Remove from team"
                                onClick={() => {
                                  if (confirm(`Remove ${m.first_name} ${m.last_name} from the team?`)) {
                                    removeMemberMutation.mutate({ regId: selectedRegDetail.id, memberId: m.id });
                                  }
                                }}
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/30 text-sm italic">No team members added yet.</p>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Registered</p>
                    <p className="text-white/70 text-sm">{formatDate(selectedRegDetail.registered_at)}</p>
                  </div>
                  {selectedRegDetail.checked_in_at && (
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Checked In</p>
                      <p className="text-white/70 text-sm">{formatDate(selectedRegDetail.checked_in_at)}</p>
                    </div>
                  )}
                </div>

                {/* Cancellation reason */}
                {selectedRegDetail.cancellation_reason && (
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Cancellation Reason</p>
                    <p className="text-white/60 text-sm">{selectedRegDetail.cancellation_reason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  {selectedRegDetail.status === "withdrawn" && (
                    <Button variant="outline" className="border-red-800/40 text-red-500 gap-2"
                      onClick={() => { if (confirm(`Permanently delete registration for ${selectedRegDetail.first_name} ${selectedRegDetail.last_name}? This cannot be undone.`)) purgeRegMutation.mutate(selectedRegDetail.id); }}
                      disabled={purgeRegMutation.isPending}>
                      <Trash2 className="w-4 h-4" /> Permanently Delete
                    </Button>
                  )}
                  {selectedRegDetail.status === "pending" && (
                    <Button variant="outline" className="border-green-500/30 text-green-400 gap-2"
                      onClick={() => { confirmRegMutation.mutate(selectedRegDetail.id); setSelectedRegDetail(null); }}>
                      <CheckCircle className="w-4 h-4" /> Confirm
                    </Button>
                  )}
                  {selectedRegDetail.status !== "withdrawn" && selectedRegDetail.status !== "checked_in" && (
                    <Button variant="outline" className="border-white/20 text-white gap-2"
                      onClick={() => { checkInMutation.mutate(selectedRegDetail.id); setSelectedRegDetail(null); }}>
                      <UserCheck className="w-4 h-4" /> Check In
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Categories */}
        <TabsContent value="categories">
          <div className="space-y-3">
            {competition.categories?.map((cat: any) => (
              <div key={cat.id} className="bg-[#111111] border border-white/10 rounded-md overflow-hidden">
                {editingCategoryId === cat.id ? (
                  /* Inline edit form */
                  <div className="p-4 space-y-3">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Editing: {cat.name}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label className="text-white/50 text-xs">Name *</Label>
                        <Input value={editCategoryForm.name} onChange={e => setEditCategoryForm(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" /></div>
                      <div><Label className="text-white/50 text-xs">Max Participants</Label>
                        <Input type="number" value={editCategoryForm.maxParticipants} onChange={e => setEditCategoryForm(p => ({ ...p, maxParticipants: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" placeholder="Unlimited" /></div>
                      <div><Label className="text-white/50 text-xs">Difficulty</Label>
                        <Select value={editCategoryForm.difficultyLevel} onValueChange={v => setEditCategoryForm(p => ({ ...p, difficultyLevel: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/20">
                            {["rx", "scaled", "intermediate", "open", "custom"].map(d => <SelectItem key={d} value={d} className="text-white capitalize">{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-white/50 text-xs">Gender</Label>
                        <Select value={editCategoryForm.gender} onValueChange={v => setEditCategoryForm(p => ({ ...p, gender: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/20">
                            {["male", "female", "mixed", "any"].map(g => <SelectItem key={g} value={g} className="text-white capitalize">{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2"><Label className="text-white/50 text-xs">Description</Label>
                        <Input value={editCategoryForm.description} onChange={e => setEditCategoryForm(p => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" placeholder="Optional description" /></div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => editCategoryMutation.mutate({ catId: cat.id, data: editCategoryForm })}
                        disabled={!editCategoryForm.name || editCategoryMutation.isPending}
                        className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold h-8 text-xs gap-1">
                        <Save className="w-3 h-3" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingCategoryId(null)} className="border-white/20 text-white h-8 text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Normal view */
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-white font-medium">{cat.name}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs border-[#C9A84C]/30 text-[#C9A84C] capitalize">{cat.difficulty_level}</Badge>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/50 capitalize">{cat.gender}</Badge>
                        {cat.description && <span className="text-white/30 text-xs self-center">{cat.description}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-sm">{cat.current_participants}{cat.max_participants ? `/${cat.max_participants}` : ""}</span>
                      <Button size="icon" variant="outline" className="border-white/20 text-white/70 h-7 w-7"
                        onClick={() => {
                          setEditCategoryForm({
                            name: cat.name,
                            difficultyLevel: cat.difficulty_level,
                            gender: cat.gender,
                            maxParticipants: cat.max_participants ? String(cat.max_participants) : "",
                            description: cat.description || "",
                          });
                          setEditingCategoryId(cat.id);
                        }}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="border-red-800/40 text-red-500 h-7 w-7"
                        onClick={() => { if (confirm(`Delete category "${cat.name}"? This will also remove all registrations in this category.`)) deleteCategoryMutation.mutate(cat.id); }}
                        disabled={deleteCategoryMutation.isPending}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Card className="bg-[#0d0d0d] border-white/10">
              <CardHeader><CardTitle className="text-white text-sm">Add Category</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <div><Label className="text-white/50 text-xs">Name *</Label>
                  <Input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" placeholder="e.g. Male Rx" /></div>
                <div><Label className="text-white/50 text-xs">Difficulty</Label>
                  <Select value={newCategory.difficultyLevel} onValueChange={v => setNewCategory(p => ({ ...p, difficultyLevel: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      {["rx", "scaled", "intermediate", "open", "custom"].map(d => <SelectItem key={d} value={d} className="text-white capitalize">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-white/50 text-xs">Gender</Label>
                  <Select value={newCategory.gender} onValueChange={v => setNewCategory(p => ({ ...p, gender: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      {["male", "female", "mixed", "any"].map(g => <SelectItem key={g} value={g} className="text-white capitalize">{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-white/50 text-xs">Max Participants</Label>
                  <Input type="number" value={newCategory.maxParticipants} onChange={e => setNewCategory(p => ({ ...p, maxParticipants: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" placeholder="Unlimited" /></div>
                <div className="sm:col-span-2">
                  <Button onClick={() => addCategoryMutation.mutate()} disabled={!newCategory.name || addCategoryMutation.isPending}
                    className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold h-9 gap-2">
                    <Plus className="w-4 h-4" /> Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workouts */}
        <TabsContent value="workouts">
          <div className="space-y-4">
            {workouts?.map((w: any, i: number) => (
              <div key={w.id} className="bg-[#111111] border border-white/10 rounded-md overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <span className="text-[#C9A84C] font-black w-6 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{w.name}</p>
                    <p className="text-white/40 text-xs capitalize">{w.type?.replace(/_/g, " ")}{w.time_cap ? ` — ${Math.floor(w.time_cap / 60)} min cap` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white/30 text-xs hidden sm:inline">{w.is_public ? "Public" : "Hidden"}</span>
                    <Switch
                      checked={!!w.is_public}
                      onCheckedChange={val => toggleWorkoutMutation.mutate({ id: w.id, isPublic: val })}
                      className="data-[state=checked]:bg-[#C9A84C]"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40 hover:text-white"
                      onClick={() => {
                        if (editingWorkoutId === w.id) { setEditingWorkoutId(null); return; }
                        setEditingWorkoutId(w.id);
                        setEditWorkoutForm({
                          name: w.name ?? "",
                          description: w.description ?? "",
                          type: w.type ?? "for_time",
                          timeCap: w.time_cap ? String(w.time_cap) : "",
                          sortOrder: String(w.sort_order ?? i + 1),
                          isPublic: !!w.is_public,
                        });
                      }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white/30 hover:text-red-400"
                      onClick={() => { if (confirm("Delete this workout? This cannot be undone.")) deleteWorkoutMutation.mutate(w.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {editingWorkoutId === w.id && (
                  <div className="border-t border-white/10 bg-[#0d0d0d] p-4 space-y-3">
                    <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider">Edit Workout</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label className="text-white/50 text-xs">Name *</Label>
                        <Input value={editWorkoutForm.name} onChange={e => setEditWorkoutForm(p => ({ ...p, name: e.target.value }))}
                          className="bg-white/5 border-white/20 text-white mt-1 h-9" /></div>
                      <div><Label className="text-white/50 text-xs">Type</Label>
                        <Select value={editWorkoutForm.type} onValueChange={v => setEditWorkoutForm(p => ({ ...p, type: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/20">
                            {["amrap", "for_time", "max_reps", "max_weight", "max_distance", "max_calories"].map(t => (
                              <SelectItem key={t} value={t} className="text-white capitalize">{t.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-white/50 text-xs">Time Cap (seconds)</Label>
                        <Input type="number" value={editWorkoutForm.timeCap} onChange={e => setEditWorkoutForm(p => ({ ...p, timeCap: e.target.value }))}
                          className="bg-white/5 border-white/20 text-white mt-1 h-9" placeholder="e.g. 600 = 10 min" /></div>
                      <div><Label className="text-white/50 text-xs">Sort Order</Label>
                        <Input type="number" value={editWorkoutForm.sortOrder} onChange={e => setEditWorkoutForm(p => ({ ...p, sortOrder: e.target.value }))}
                          className="bg-white/5 border-white/20 text-white mt-1 h-9" /></div>
                      <div className="sm:col-span-2"><Label className="text-white/50 text-xs">Description</Label>
                        <Textarea value={editWorkoutForm.description} onChange={e => setEditWorkoutForm(p => ({ ...p, description: e.target.value }))}
                          className="bg-white/5 border-white/20 text-white mt-1 min-h-16" placeholder="Workout description, movements, standards..." /></div>
                      <div className="flex items-center gap-2">
                        <Switch checked={editWorkoutForm.isPublic} onCheckedChange={v => setEditWorkoutForm(p => ({ ...p, isPublic: v }))} className="data-[state=checked]:bg-[#C9A84C]" />
                        <Label className="text-white/60 text-sm">Public (visible to athletes)</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-white/50 h-9" onClick={() => setEditingWorkoutId(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => updateWorkoutMutation.mutate({ id: w.id, data: editWorkoutForm })}
                          disabled={!editWorkoutForm.name || updateWorkoutMutation.isPending}
                          className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold h-9 gap-1.5">
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Card className="bg-[#0d0d0d] border-white/10">
              <CardHeader><CardTitle className="text-white text-sm">Add Workout</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <div><Label className="text-white/50 text-xs">Name *</Label>
                  <Input value={newWorkout.name} onChange={e => setNewWorkout(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" placeholder="e.g. Workout 1 — Grace" /></div>
                <div><Label className="text-white/50 text-xs">Type</Label>
                  <Select value={newWorkout.type} onValueChange={v => setNewWorkout(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      {["amrap", "for_time", "max_reps", "max_weight", "max_distance", "max_calories"].map(t => (
                        <SelectItem key={t} value={t} className="text-white capitalize">{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-white/50 text-xs">Time Cap (seconds)</Label>
                  <Input type="number" value={newWorkout.timeCap} onChange={e => setNewWorkout(p => ({ ...p, timeCap: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" placeholder="e.g. 600 = 10 min" /></div>
                <div><Label className="text-white/50 text-xs">Sort Order</Label>
                  <Input type="number" value={newWorkout.sortOrder} onChange={e => setNewWorkout(p => ({ ...p, sortOrder: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" /></div>
                <div className="sm:col-span-2"><Label className="text-white/50 text-xs">Description</Label>
                  <Textarea value={newWorkout.description} onChange={e => setNewWorkout(p => ({ ...p, description: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 min-h-16" placeholder="Workout description, movements, standards..." /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={newWorkout.isPublic} onCheckedChange={v => setNewWorkout(p => ({ ...p, isPublic: v }))} className="data-[state=checked]:bg-[#C9A84C]" />
                  <Label className="text-white/60 text-sm">Make public immediately</Label>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => addWorkoutMutation.mutate()} disabled={!newWorkout.name || addWorkoutMutation.isPending}
                    className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold h-9 gap-2">
                    <Plus className="w-4 h-4" /> Add Workout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scoring */}
        <TabsContent value="scoring">
          <div className="space-y-4">
            {/* Workout Selector + Publish Toggle */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-48">
                <Label className="text-white/50 text-xs mb-1 block">Select Workout to Score</Label>
                <Select value={scoringWorkoutId} onValueChange={v => { setScoringWorkoutId(v); setScoreDrafts({}); }}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white h-9">
                    <SelectValue placeholder="Choose a workout..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/20">
                    {workouts?.map((w: any, i: number) => (
                      <SelectItem key={w.id} value={w.id} className="text-white">
                        WOD {i + 1} — {w.name} ({w.type?.replace(/_/g, " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {scoringWorkoutId && (() => {
                const sw = workouts?.find((w: any) => w.id === scoringWorkoutId);
                if (!sw) return null;
                return (
                  <div className="flex items-center gap-2 pb-0.5">
                    <span className="text-white/40 text-xs">{sw.scores_visible ? "Scores Visible" : "Scores Hidden"}</span>
                    <Switch
                      checked={!!sw.scores_visible}
                      onCheckedChange={val => toggleScoresVisibleMutation.mutate({ id: sw.id, scoresVisible: val })}
                      className="data-[state=checked]:bg-[#C9A84C]"
                    />
                    <Button variant="outline" size="sm" onClick={() => refreshLeaderboardMutation.mutate()}
                      disabled={refreshLeaderboardMutation.isPending}
                      className="border-white/20 text-white gap-1.5 h-9">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                  </div>
                );
              })()}
            </div>

            {/* Score Legend */}
            {scoringWorkoutId && (
              <div className="flex flex-wrap gap-3 text-xs text-white/40">
                {(() => {
                  const sw = workouts?.find((w: any) => w.id === scoringWorkoutId);
                  if (!sw) return null;
                  return (
                    <>
                      {sw.type === "for_time" && <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Enter time as MM:SS (e.g. 5:23). Tick DNF if athlete hit time cap.</span>}
                      {sw.type === "amrap" && <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Enter total reps completed.</span>}
                      {sw.type === "max_reps" && <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> Enter max reps.</span>}
                      {sw.type === "max_weight" && <span className="flex items-center gap-1"><Weight className="w-3 h-3" /> Enter max lift in kg.</span>}
                      {sw.type === "max_distance" && <span className="flex items-center gap-1"><MoveHorizontal className="w-3 h-3" /> Enter distance in metres.</span>}
                      {sw.type === "max_calories" && <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Enter calories.</span>}
                      <span>| <span className="text-red-400">DNS</span> = Did Not Start &nbsp; <span className="text-orange-400">DQ</span> = Disqualified &nbsp; <span className="text-yellow-400">DNF</span> = Did Not Finish (time cap)</span>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Inline Scoring Table */}
            {scoringWorkoutId ? (
              <>
                <div className="rounded-md border border-white/10 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="text-left px-4 py-3 text-white/40 font-medium w-48">Athlete</th>
                        <th className="text-left px-3 py-3 text-white/40 font-medium w-28">Category</th>
                        <th className="text-left px-3 py-3 text-white/40 font-medium">Score</th>
                        {(() => {
                          const sw = workouts?.find((w: any) => w.id === scoringWorkoutId);
                          return sw?.type === "for_time" ? (
                            <th className="text-center px-3 py-3 text-white/40 font-medium w-20">DNF</th>
                          ) : null;
                        })()}
                        <th className="text-left px-3 py-3 text-white/40 font-medium w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const sw = workouts?.find((w: any) => w.id === scoringWorkoutId);
                        const athletes = registrations?.filter((r: any) => ["confirmed", "checked_in"].includes(r.status)) ?? [];
                        if (!sw || !athletes.length) return (
                          <tr><td colSpan={5} className="py-8 text-center text-white/30">No confirmed athletes</td></tr>
                        );
                        return athletes.map((reg: any) => {
                          const draft = scoreDrafts[reg.id] ?? { score: "", isDnf: false, dnfReps: "", status: "validated" };
                          const isDnf = draft.isDnf;
                          const isSpecial = draft.status === "dns" || draft.status === "dq";
                          return (
                            <tr key={reg.id} className="border-b border-white/5 hover:bg-white/2">
                              <td className="px-4 py-2.5">
                                <div className="text-white font-medium">{reg.first_name} {reg.last_name}</div>
                              </td>
                              <td className="px-3 py-2.5 text-white/40 text-xs">{reg.category_name}</td>
                              <td className="px-3 py-2.5">
                                {isDnf ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-yellow-400 text-xs font-bold">DNF</span>
                                    <Input
                                      type="number"
                                      placeholder="reps at cap"
                                      value={draft.dnfReps}
                                      onChange={e => setScoreDrafts(p => ({ ...p, [reg.id]: { ...draft, dnfReps: e.target.value } }))}
                                      className="bg-white/5 border-white/20 text-white h-8 text-xs w-28"
                                    />
                                  </div>
                                ) : isSpecial ? (
                                  <span className={`text-xs font-bold ${draft.status === "dns" ? "text-red-400" : "text-orange-400"}`}>{draft.status.toUpperCase()}</span>
                                ) : (
                                  <Input
                                    placeholder={sw.type === "for_time" ? "MM:SS" : sw.type === "max_weight" ? "kg" : sw.type === "max_distance" ? "m" : "score"}
                                    value={draft.score}
                                    onChange={e => setScoreDrafts(p => ({ ...p, [reg.id]: { ...draft, score: e.target.value } }))}
                                    className="bg-white/5 border-white/20 text-white h-8 text-xs w-28"
                                    type={sw.type === "for_time" ? "text" : "number"}
                                    step={sw.type === "max_weight" ? "0.5" : "1"}
                                  />
                                )}
                              </td>
                              {sw.type === "for_time" && (
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isDnf}
                                    onChange={e => setScoreDrafts(p => ({ ...p, [reg.id]: { ...draft, isDnf: e.target.checked, score: "" } }))}
                                    className="accent-yellow-400 w-4 h-4 cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className="px-3 py-2.5">
                                <Select
                                  value={isDnf ? "dnf" : draft.status}
                                  onValueChange={v => setScoreDrafts(p => ({ ...p, [reg.id]: { ...draft, status: v, isDnf: v === "dnf", score: v === "dns" || v === "dq" ? "" : draft.score } }))}
                                >
                                  <SelectTrigger className="bg-white/5 border-white/20 text-white h-8 text-xs w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1a1a1a] border-white/20">
                                    <SelectItem value="validated" className="text-green-400 text-xs">Validated</SelectItem>
                                    <SelectItem value="pending" className="text-[#C9A84C] text-xs">Pending</SelectItem>
                                    {sw.type === "for_time" && <SelectItem value="dnf" className="text-yellow-400 text-xs">DNF</SelectItem>}
                                    <SelectItem value="dns" className="text-red-400 text-xs">DNS</SelectItem>
                                    <SelectItem value="dq" className="text-orange-400 text-xs">DQ</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Save Bar */}
                <div className="flex items-center justify-between gap-3 p-3 bg-[#111111] border border-white/10 rounded-md">
                  <span className="text-white/40 text-xs">
                    {Object.keys(scoreDrafts).length > 0
                      ? `${Object.keys(scoreDrafts).length} score${Object.keys(scoreDrafts).length !== 1 ? "s" : ""} modified`
                      : "No changes — enter scores above"}
                  </span>
                  <div className="flex gap-2">
                    {Object.keys(scoreDrafts).length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => setScoreDrafts({})} className="border-white/20 text-white/60 h-9">
                        Clear
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveScores}
                      disabled={savingScores || Object.keys(scoreDrafts).length === 0}
                      className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold gap-2 h-9"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingScores ? "Saving..." : "Save All Scores"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center border border-dashed border-white/10 rounded-md">
                <Dumbbell className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Select a workout above to begin scoring</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Heats */}
        <TabsContent value="heats">
          <div className="space-y-5">
            {/* Auto-generate */}
            <Card className="bg-[#111111] border-white/10">
              <CardHeader><CardTitle className="text-white text-sm">Auto-Generate Heats</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/40 text-xs">Automatically assigns all confirmed registrations for a workout into heats. Re-generating will overwrite existing heats for that workout.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label className="text-white/50 text-xs">Workout *</Label>
                    <Select value={heatForm.workoutId} onValueChange={v => setHeatForm(p => ({ ...p, workoutId: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue placeholder="Select workout" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        {workouts?.map(w => <SelectItem key={w.id} value={w.id} className="text-white">{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-white/50 text-xs">Athletes per heat</Label>
                    <Input type="number" value={heatForm.heatSize} onChange={e => setHeatForm(p => ({ ...p, heatSize: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" /></div>
                  <div><Label className="text-white/50 text-xs">First heat start time</Label>
                    <Input type="datetime-local" value={heatForm.startTime} onChange={e => setHeatForm(p => ({ ...p, startTime: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" /></div>
                  <div><Label className="text-white/50 text-xs">Minutes between heats</Label>
                    <Input type="number" min="1" value={heatForm.intervalMinutes} onChange={e => setHeatForm(p => ({ ...p, intervalMinutes: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" /></div>
                </div>
                <Button onClick={() => heatMutation.mutate()} disabled={!heatForm.workoutId || heatMutation.isPending}
                  className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold h-9 gap-2">
                  <RefreshCw className="w-4 h-4" /> Generate Heats
                </Button>
                {heatMutation.isSuccess && <p className="text-green-400 text-sm">Heats generated successfully — see schedule below.</p>}
              </CardContent>
            </Card>

            {/* Manual heat management */}
            <Card className="bg-[#111111] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-[#C9A84C]" /> Manual Heat Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white/40 text-xs">Create an empty heat and manually assign specific athletes or teams to it.</p>
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-40">
                    <Label className="text-white/50 text-xs">Workout</Label>
                    <Select value={manualHeatWorkoutId} onValueChange={setManualHeatWorkoutId}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue placeholder="Select workout" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        {workouts?.map((w: any) => <SelectItem key={w.id} value={w.id} className="text-white">{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => manualHeatWorkoutId && createEmptyHeatMutation.mutate({ workoutId: manualHeatWorkoutId })}
                    disabled={!manualHeatWorkoutId || createEmptyHeatMutation.isPending}
                    className="bg-white/10 hover:bg-white/15 text-white font-medium h-9 gap-2 border border-white/20">
                    <Plus className="w-3.5 h-3.5" /> Add Empty Heat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Schedule View */}
            <Card className="bg-[#111111] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-white text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-[#C9A84C]" /> Current Schedule</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => refetchSchedule()} className="text-white/50 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!heatSchedule?.length ? (
                  <div className="text-center py-10 text-white/30 text-sm">
                    <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    No heats generated yet. Select a workout above and click Generate Heats.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      heatSchedule.reduce((acc: Record<string, any[]>, h: any) => {
                        const key = h.workout_name;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(h);
                        return acc;
                      }, {})
                    ).map(([workoutName, heats]) => {
                      const workoutObj = workouts?.find((w: any) => w.name === workoutName);
                      const assignedRegIds = new Set((heats as any[]).flatMap((h: any) => h.assignments?.map((a: any) => a.registrationId) ?? []));
                      const unassignedRegs = (registrations ?? []).filter((r: any) =>
                        r.status === "confirmed" || r.status === "checked_in"
                          ? !assignedRegIds.has(r.id)
                          : false
                      );
                      return (
                        <div key={workoutName} className="space-y-2">
                          <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider pt-1">{workoutName}</p>
                          {(heats as any[]).map((heat: any) => (
                            <div key={heat.id} className="bg-white/5 rounded-md p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="text-white font-semibold text-sm">Heat {heat.heat_number}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {editingHeatTime?.heatId === heat.id ? (
                                    <>
                                      <Input
                                        type="datetime-local"
                                        value={editingHeatTime.value}
                                        onChange={e => setEditingHeatTime({ heatId: heat.id, value: e.target.value })}
                                        className="bg-white/10 border-white/20 text-white h-7 text-xs w-44"
                                      />
                                      <Button size="sm" className="h-7 text-xs bg-[#C9A84C] text-black font-bold"
                                        disabled={updateHeatTimeMutation.isPending}
                                        onClick={() => updateHeatTimeMutation.mutate({ heatId: heat.id, startTime: editingHeatTime.value })}>
                                        {updateHeatTimeMutation.isPending ? "…" : "Save"}
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-7 text-xs text-white/50"
                                        onClick={() => setEditingHeatTime(null)}>
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      {heat.start_time && (
                                        <p className="text-white/50 text-xs">
                                          {new Date(heat.start_time).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                      )}
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white/30 hover:text-white/70"
                                        title="Edit heat time"
                                        onClick={() => {
                                          const iso = heat.start_time ? new Date(heat.start_time).toISOString().slice(0, 16) : "";
                                          setEditingHeatTime({ heatId: heat.id, value: iso });
                                        }}>
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-white/20 hover:text-red-400"
                                        title="Delete heat"
                                        onClick={() => { if (confirm("Delete this heat and all its assignments?")) deleteHeatMutation.mutate(heat.id); }}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Athlete assignments */}
                              {heat.assignments?.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                                  {heat.assignments.map((a: any) => (
                                    <div key={a.assignmentId} className="bg-white/5 rounded p-2 flex items-center justify-between gap-1">
                                      <div className="min-w-0">
                                        <p className="text-[#C9A84C] text-xs font-bold">Lane {a.laneNumber}</p>
                                        <p className="text-white text-xs truncate">{a.teamName || a.userName}</p>
                                      </div>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-white/20 hover:text-red-400"
                                        onClick={() => removeHeatAssignmentMutation.mutate({ heatId: heat.id, assignmentId: a.assignmentId })}>
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-white/30 text-xs">No athletes assigned</p>
                              )}

                              {/* Add athlete to this heat */}
                              {addingAthleteToHeatId === heat.id ? (
                                <div className="flex gap-2 items-center pt-1">
                                  <Select onValueChange={regId => { addHeatAssignmentMutation.mutate({ heatId: heat.id, registrationId: regId }); }}>
                                    <SelectTrigger className="bg-white/5 border-white/20 text-white h-8 text-xs flex-1">
                                      <SelectValue placeholder="Select athlete / team…" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                                      {(registrations ?? [])
                                        .filter((r: any) => r.status === "confirmed" || r.status === "checked_in")
                                        .map((r: any) => (
                                          <SelectItem key={r.id} value={r.id} className="text-white text-xs">
                                            {r.team_name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="ghost" className="h-8 text-xs text-white/50 shrink-0"
                                    onClick={() => setAddingAthleteToHeatId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-white/40 gap-1 px-2 mt-1"
                                  onClick={() => setAddingAthleteToHeatId(heat.id)}>
                                  <Plus className="w-3 h-3" /> Add Athlete / Team
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Promo Codes */}
        <TabsContent value="promo-codes">
          <div className="space-y-4">
            <Card className="bg-[#0d0d0d] border-white/10">
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2"><Tag className="w-4 h-4 text-[#C9A84C]" /> Create Promo Code</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/50 text-xs">Code *</Label>
                  <Input value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. EARLYBIRD20" className="bg-white/5 border-white/20 text-white mt-1 h-9 uppercase" />
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Discount Type</Label>
                  <Select value={newPromo.discountType} onValueChange={v => setNewPromo(p => ({ ...p, discountType: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      <SelectItem value="percentage" className="text-white">Percentage (%)</SelectItem>
                      <SelectItem value="fixed" className="text-white">Fixed Amount (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/50 text-xs">{newPromo.discountType === "percentage" ? "Discount %" : "Discount Amount (pence)"} *</Label>
                  <Input type="number" value={newPromo.discountValue} onChange={e => setNewPromo(p => ({ ...p, discountValue: e.target.value }))} placeholder={newPromo.discountType === "percentage" ? "20" : "500"} className="bg-white/5 border-white/20 text-white mt-1 h-9" />
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Max Uses (blank = unlimited)</Label>
                  <Input type="number" value={newPromo.maxUses} onChange={e => setNewPromo(p => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" className="bg-white/5 border-white/20 text-white mt-1 h-9" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-white/50 text-xs">Expiry Date (optional)</Label>
                  <Input type="datetime-local" value={newPromo.expiresAt} onChange={e => setNewPromo(p => ({ ...p, expiresAt: e.target.value }))} className="bg-white/5 border-white/20 text-white mt-1 h-9" />
                </div>
                <div className="sm:col-span-2">
                  <Button onClick={() => createPromoMutation.mutate()} disabled={!newPromo.code || !newPromo.discountValue || createPromoMutation.isPending} className="bg-[#C9A84C] text-black font-bold h-9 gap-2">
                    <Plus className="w-4 h-4" /> Create Promo Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing codes */}
            {!promoCodes?.length ? (
              <div className="py-12 text-center border border-dashed border-white/10 rounded-md">
                <Tag className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No promo codes yet. Create one above.</p>
              </div>
            ) : (
              <div className="rounded-md border border-white/10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="text-left px-4 py-3 text-white/40 font-medium">Code</th>
                      <th className="text-left px-4 py-3 text-white/40 font-medium">Discount</th>
                      <th className="text-left px-4 py-3 text-white/40 font-medium">Uses</th>
                      <th className="text-left px-4 py-3 text-white/40 font-medium">Expires</th>
                      <th className="text-left px-4 py-3 text-white/40 font-medium">Active</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((promo: any) => (
                      <tr key={promo.id} className="border-b border-white/5">
                        <td className="px-4 py-3 text-white font-mono font-bold">{promo.code}</td>
                        <td className="px-4 py-3 text-[#C9A84C] font-medium">
                          {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `£${(promo.discount_value / 100).toFixed(2)}`}
                        </td>
                        <td className="px-4 py-3 text-white/60">
                          {promo.uses_count ?? 0}{promo.max_uses ? `/${promo.max_uses}` : " / ∞"}
                        </td>
                        <td className="px-4 py-3 text-white/40 text-xs">
                          {promo.expires_at ? formatDate(promo.expires_at) : "No expiry"}
                        </td>
                        <td className="px-4 py-3">
                          <Switch checked={!!promo.is_active} onCheckedChange={val => togglePromoMutation.mutate({ id: promo.id, isActive: val })} className="data-[state=checked]:bg-[#C9A84C]" />
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="outline" size="sm" onClick={() => { if (confirm(`Delete promo code ${promo.code}?`)) deletePromoMutation.mutate(promo.id); }} className="border-red-500/30 text-red-400 h-7 text-xs gap-1">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Details / Edit */}
        <TabsContent value="details">
          <div className="space-y-4 p-4 bg-[#111111] rounded-md border border-white/10">
            <h3 className="text-white font-semibold text-sm">Edit Competition Details</h3>
            {(() => {
              const comp = competition?.competition ?? competition;
              const df = detailsForm ?? {
                name: comp?.name ?? "",
                description: comp?.description ?? "",
                location: comp?.location ?? "",
                venue: comp?.venue ?? "",
                address: comp?.address ?? "",
                maxParticipants: comp?.max_participants ?? "",
                entryFee: comp?.entry_fee ?? 0,
                rules: comp?.rules ?? "",
                waiverText: comp?.waiver_text ?? "",
                isPublic: comp?.is_public ?? false,
              };
              const set = (k: string, v: any) => setDetailsForm((p: any) => ({ ...(p ?? df), [k]: v }));
              const save = async () => {
                setSavingDetails(true);
                try {
                  await apiRequest("PUT", `/api/competitions/${compId}`, {
                    name: df.name,
                    description: df.description || null,
                    location: df.location || null,
                    venue: df.venue || null,
                    address: df.address || null,
                    maxParticipants: df.maxParticipants ? parseInt(String(df.maxParticipants)) : null,
                    entryFee: parseInt(String(df.entryFee ?? 0)),
                    rules: df.rules || null,
                    waiverText: df.waiverText || null,
                    isPublic: df.isPublic,
                  });
                  toast({ title: "Competition details saved" });
                  refetchComp();
                  setDetailsForm(null);
                } catch (e: any) {
                  toast({ title: "Save failed", description: e.message, variant: "destructive" });
                } finally {
                  setSavingDetails(false);
                }
              };
              return (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label className="text-white/60 text-xs">Competition Name</Label>
                      <Input value={df.name} onChange={e => set("name", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" /></div>
                    <div><Label className="text-white/60 text-xs">Entry Fee (pence, 0 = free)</Label>
                      <Input type="number" value={df.entryFee} onChange={e => set("entryFee", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label className="text-white/60 text-xs">Location</Label>
                      <Input value={df.location} onChange={e => set("location", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="City, Country" /></div>
                    <div><Label className="text-white/60 text-xs">Venue</Label>
                      <Input value={df.venue} onChange={e => set("venue", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="Venue name" /></div>
                  </div>
                  <div><Label className="text-white/60 text-xs">Max Participants</Label>
                    <Input type="number" value={df.maxParticipants} onChange={e => set("maxParticipants", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1" placeholder="Leave blank for unlimited" /></div>
                  <div><Label className="text-white/60 text-xs">Description</Label>
                    <Textarea value={df.description} onChange={e => set("description", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1 min-h-20" placeholder="Competition description..." /></div>
                  <div><Label className="text-white/60 text-xs">Rules & Guidelines</Label>
                    <Textarea value={df.rules} onChange={e => set("rules", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1 min-h-20" placeholder="Competition rules..." /></div>
                  <div>
                    <Label className="text-white/60 text-xs">Liability Waiver Text</Label>
                    <p className="text-white/30 text-xs mb-1">If filled in, athletes must read and tick this waiver before registering. Leave blank for no waiver.</p>
                    <Textarea value={df.waiverText} onChange={e => set("waiverText", e.target.value)} className="bg-white/5 border-white/20 text-white mt-1 min-h-28" placeholder="By participating in this event, I acknowledge that..." />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={df.isPublic} onCheckedChange={v => set("isPublic", v)} className="data-[state=checked]:bg-[#C9A84C]" />
                    <Label className="text-white/70">Make competition public</Label>
                  </div>
                  <Button onClick={save} disabled={savingDetails} className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold">
                    {savingDetails ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              );
            })()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const TIER_OPTIONS = [
  { value: "starter", label: "Starter — Free" },
  { value: "single", label: "Single Event — £60 one-time" },
  { value: "pro", label: "Pro Monthly — £60/month" },
  { value: "white_label", label: "White Label — Custom" },
];

function enquiryStatusBadge(status: string) {
  if (status === "approved") return "bg-green-600/20 text-green-300 border-green-600/30";
  if (status === "rejected") return "bg-red-600/20 text-red-300 border-red-600/30";
  return "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30";
}

function ApproveDialog({ enquiry, onDone }: { enquiry: any; onDone: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState(enquiry.plan || "single");
  const [notes, setNotes] = useState("");

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/competition-enquiries/${enquiry.id}/approve`, { tier, adminNotes: notes }).then(r => r.json()),
    onSuccess: (data: any) => {
      const msg = data?.userFound ? "Subscription granted and approval email sent." : "Approved — user must create an account to activate. Approval email sent.";
      toast({ title: "Enquiry approved", description: msg });
      setOpen(false);
      onDone();
    },
    onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-700/80 text-white h-7 text-xs gap-1 px-2">
          <CheckCircle className="w-3 h-3" /> Approve
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111111] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Approve Host Enquiry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm text-white/60 mb-1">Applicant</p>
            <p className="text-white font-medium">{enquiry.name}</p>
            <p className="text-white/50 text-sm">{enquiry.email}</p>
            {enquiry.organisation && <p className="text-white/40 text-xs">{enquiry.organisation}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Grant plan access</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {TIER_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Note to applicant (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Your account has been set up. Contact us if you need any help getting started."
              className="bg-white/5 border-white/20 text-white text-sm min-h-20"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/60 h-9">Cancel</Button>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-700 text-white h-9 gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ enquiry, onDone }: { enquiry: any; onDone: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/competition-enquiries/${enquiry.id}/reject`, { adminNotes: notes }),
    onSuccess: () => {
      toast({ title: "Enquiry rejected", description: "A notification email has been sent." });
      setOpen(false);
      onDone();
    },
    onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 h-7 text-xs gap-1 px-2">
          <XCircle className="w-3 h-3" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111111] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Reject Enquiry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-white/60 text-sm">
            Rejecting <span className="text-white font-medium">{enquiry.name}</span>'s hosting enquiry. An email notification will be sent to them.
          </p>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Reason / note to applicant (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. We're not currently taking on new organisers in your region."
              className="bg-white/5 border-white/20 text-white text-sm min-h-20"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/60 h-9">Cancel</Button>
            <Button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="bg-red-700 text-white h-9 gap-1"
            >
              <XCircle className="w-4 h-4" />
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HostEnquiriesPanel() {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const { data: enquiries, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/competition-enquiries"],
  });

  const filtered = (enquiries ?? []).filter(e => statusFilter === "all" || e.status === statusFilter);
  const pendingCount = (enquiries ?? []).filter(e => e.status === "pending").length;

  return (
    <div className="bg-[#111111] border border-white/10 rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[#C9A84C]" />
          <h2 className="text-white font-bold text-sm uppercase tracking-wide">Host Enquiries</h2>
          {pendingCount > 0 && (
            <span className="bg-[#C9A84C] text-black text-[10px] font-black px-1.5 py-0.5 rounded">
              {pendingCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {(["pending", "approved", "rejected", "all"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded transition-colors capitalize ${statusFilter === s ? "bg-[#C9A84C] text-black font-bold" : "text-white/40 hover:text-white/70"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 bg-white/5" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-white/30 text-sm">
          {statusFilter === "pending" ? "No pending enquiries" : `No ${statusFilter} enquiries`}
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {filtered.map(e => (
            <div key={e.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm">{e.name}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${enquiryStatusBadge(e.status)}`}>
                      {e.status}
                    </span>
                    {e.plan && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-white/50 border border-white/10 uppercase">
                        {e.plan}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <p className="text-white/50 text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{e.email}</p>
                    {e.organisation && <p className="text-white/40 text-xs flex items-center gap-1"><Building2 className="w-3 h-3" />{e.organisation}</p>}
                    {e.event_name && <p className="text-white/40 text-xs flex items-center gap-1"><Trophy className="w-3 h-3" />{e.event_name}</p>}
                  </div>
                  {e.message && (
                    <p className="text-white/35 text-xs mt-1.5 line-clamp-2 italic">"{e.message}"</p>
                  )}
                  {e.admin_notes && (
                    <p className="text-white/30 text-xs mt-1">Admin note: {e.admin_notes}</p>
                  )}
                  <p className="text-white/25 text-xs mt-1.5">
                    {new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {e.user_id && <span className="ml-2 text-green-400/60">Account found</span>}
                  </p>
                </div>
                {e.status === "pending" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ApproveDialog enquiry={e} onDone={() => { queryClient.invalidateQueries({ queryKey: ["/api/admin/competition-enquiries"] }); }} />
                    <RejectDialog enquiry={e} onDone={() => { queryClient.invalidateQueries({ queryKey: ["/api/admin/competition-enquiries"] }); }} />
                  </div>
                )}
                {e.status === "approved" && e.approved_tier && (
                  <span className="text-xs text-green-400/70 shrink-0">Granted: {e.approved_tier}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main AdminCompetitions page ─────────────────────────────────────────────
export default function AdminCompetitions() {
  const [selectedComp, setSelectedComp] = useState<{ id: string; slug: string } | null>(null);

  const { data: competitions, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/competitions"],
  });

  if (selectedComp) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => setSelectedComp(null)} className="text-white/60 hover:text-white gap-2 -ml-2 h-9">
          <ArrowLeft className="w-4 h-4" /> Back to all competitions
        </Button>
        <CompetitionManageView compId={selectedComp.id} compSlug={selectedComp.slug} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" data-testid="button-back-admin">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-white font-black text-2xl uppercase">Competition Management</h1>
            <p className="text-white/40 text-sm">Create and manage fitness competitions and events</p>
          </div>
        </div>
        <CreateCompetitionDialog onCreated={refetch} />
      </div>

      <HostEnquiriesPanel />

      <div>
        <h2 className="text-white/60 text-xs uppercase tracking-widest font-bold mb-3">All Competitions</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 bg-white/5" />)}</div>
      ) : !competitions || competitions.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No competitions yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {competitions.map(comp => (
            <div key={comp.id} className="flex items-center gap-4 p-4 bg-[#111111] border border-white/10 rounded-md hover-elevate cursor-pointer" onClick={() => setSelectedComp({ id: comp.id, slug: comp.slug })}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold truncate">{comp.name}</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${statusColor(comp.status)}`}>
                    {comp.status?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-1 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(comp.start_date)}</span>
                  {comp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{comp.location}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{comp.registration_count} registered</span>
                  <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{comp.category_count} categories</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-white/20 text-white shrink-0 h-8 text-xs">
                Manage
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
