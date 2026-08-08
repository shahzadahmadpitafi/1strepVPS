import { useState, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Trophy, Plus, ChevronRight, Users, Dumbbell, Tag, Calendar,
  MapPin, CheckCircle, Clock, AlertCircle, Eye, EyeOff, Pencil,
  Trash2, UserCheck, X, ChevronLeft, Globe, Lock, BarChart3,
  ArrowUpRight, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import HeaderClean from "@/components/HeaderClean";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "border-white/20 text-white/50" },
    registration_open: { label: "Open", className: "border-[#C9A84C]/50 text-[#C9A84C]" },
    registration_closed: { label: "Reg. Closed", className: "border-white/20 text-white/60" },
    in_progress: { label: "Live", className: "border-green-500/50 text-green-400" },
    completed: { label: "Completed", className: "border-white/10 text-white/40" },
    cancelled: { label: "Cancelled", className: "border-red-500/30 text-red-400" },
  };
  const s = map[status] ?? { label: status, className: "border-white/20 text-white/50" };
  return <Badge variant="outline" className={`text-xs capitalize ${s.className}`}>{s.label}</Badge>;
}

function regStatusIcon(status: string) {
  if (status === "confirmed" || status === "checked_in") return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
  if (status === "pending") return <Clock className="w-3.5 h-3.5 text-[#C9A84C]" />;
  return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
}

// ── Create Competition Dialog ────────────────────────────────────────────────
function CreateCompetitionDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", type: "single_day", format: "individual",
    location: "", venue: "", address: "",
    startDate: "", endDate: "", registrationOpenDate: "", registrationCloseDate: "",
    maxParticipants: "", entryFee: "0", isPublic: false, rules: "",
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/organiser/competitions", {
      ...form,
      maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
      entryFee: parseInt(form.entryFee) || 0,
    }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Competition created", description: "Your new competition is saved as a draft." });
      setOpen(false);
      setForm({ name: "", description: "", type: "single_day", format: "individual", location: "", venue: "", address: "", startDate: "", endDate: "", registrationOpenDate: "", registrationCloseDate: "", maxParticipants: "", entryFee: "0", isPublic: false, rules: "" });
      onCreated();
    },
    onError: async (err: any) => {
      const msg = err?.message || "Failed to create competition";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#C9A84C] text-black font-bold gap-2">
        <Plus className="w-4 h-4" /> New Competition
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black uppercase tracking-tight">Create Competition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Competition Name *</label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. 1stRep Summer Throwdown" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Type</label>
                <Select value={form.type} onValueChange={v => set("type", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="single_day">Single Day</SelectItem>
                    <SelectItem value="multi_day">Multi Day</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="league">League</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Format</label>
                <Select value={form.format} onValueChange={v => set("format", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="teams_of_2">Teams of 2</SelectItem>
                    <SelectItem value="teams_of_3">Teams of 3</SelectItem>
                    <SelectItem value="teams_of_4">Teams of 4</SelectItem>
                    <SelectItem value="mixed_team">Mixed Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Start Date *</label>
                <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">End Date *</label>
                <Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Reg. Opens</label>
                <Input type="date" value={form.registrationOpenDate} onChange={e => set("registrationOpenDate", e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Reg. Closes</label>
                <Input type="date" value={form.registrationCloseDate} onChange={e => set("registrationCloseDate", e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Location (City)</label>
                <Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. London" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Venue Name</label>
                <Input value={form.venue} onChange={e => set("venue", e.target.value)} placeholder="e.g. CrossFit East London" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Address</label>
                <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Max Athletes</label>
                <Input type="number" value={form.maxParticipants} onChange={e => set("maxParticipants", e.target.value)} placeholder="Unlimited" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Entry Fee (pence)</label>
                <Input type="number" value={form.entryFee} onChange={e => set("entryFee", e.target.value)} placeholder="0 = free" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Description</label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Tell athletes what this competition is about..." className="bg-white/5 border-white/10 text-white resize-none" rows={3} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Rules & Standards</label>
                <Textarea value={form.rules} onChange={e => set("rules", e.target.value)} placeholder="Competition rules, movement standards, equipment..." className="bg-white/5 border-white/10 text-white resize-none" rows={3} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/20 text-white" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.name || !form.startDate || !form.endDate}
              className="bg-[#C9A84C] text-black font-bold"
            >
              {createMutation.isPending ? "Creating..." : "Create as Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Category Dialog (add + edit) ─────────────────────────────────────────────
function CategoryDialog({ compId, existing, trigger, onDone }: {
  compId: string;
  existing?: any;
  trigger: ReactNode;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const isEdit = !!existing;

  const blank = { name: "", description: "", difficultyLevel: "open", gender: "any", ageMin: "", ageMax: "", maxParticipants: "" };
  const fromExisting = existing ? {
    name: existing.name ?? "",
    description: existing.description ?? "",
    difficultyLevel: existing.difficulty_level ?? "open",
    gender: existing.gender ?? "any",
    ageMin: existing.age_min != null ? String(existing.age_min) : "",
    ageMax: existing.age_max != null ? String(existing.age_max) : "",
    maxParticipants: existing.max_participants != null ? String(existing.max_participants) : "",
  } : blank;

  const [form, setForm] = useState(fromExisting);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const payload = () => ({
    ...form,
    ageMin: form.ageMin ? parseInt(form.ageMin) : null,
    ageMax: form.ageMax ? parseInt(form.ageMax) : null,
    maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
  });

  const mut = useMutation({
    mutationFn: () => isEdit
      ? apiRequest("PUT", `/api/organiser/competitions/${compId}/categories/${existing.id}`, payload()).then(r => r.json())
      : apiRequest("POST", `/api/organiser/competitions/${compId}/categories`, payload()).then(r => r.json()),
    onSuccess: () => {
      toast({ title: isEdit ? "Category updated" : "Category added" });
      setOpen(false);
      if (!isEdit) setForm(blank);
      onDone();
    },
    onError: () => toast({ title: "Error", description: isEdit ? "Failed to update category" : "Failed to add category", variant: "destructive" }),
  });

  return (
    <>
      <span onClick={() => { if (isEdit) setForm(fromExisting); setOpen(true); }}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111111] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white font-bold">{isEdit ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Name *</label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Rx, Scaled, Masters 35+" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Difficulty</label>
                <Select value={form.difficultyLevel} onValueChange={v => set("difficultyLevel", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="scaled">Scaled</SelectItem>
                    <SelectItem value="rx">Rx</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="masters">Masters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Gender</label>
                <Select value={form.gender} onValueChange={v => set("gender", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Min Age</label>
                <Input type="number" value={form.ageMin} onChange={e => set("ageMin", e.target.value)} placeholder="None" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Max Age</label>
                <Input type="number" value={form.ageMax} onChange={e => set("ageMax", e.target.value)} placeholder="None" className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Max Athletes (optional)</label>
              <Input type="number" value={form.maxParticipants} onChange={e => set("maxParticipants", e.target.value)} placeholder="Unlimited" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Who is this category for?" className="bg-white/5 border-white/10 text-white resize-none" rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/20 text-white" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.name} className="bg-[#C9A84C] text-black font-bold">
              {mut.isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Workout Dialog (add + edit) ──────────────────────────────────────────────
function WorkoutDialog({ compId, existing, trigger, onDone }: {
  compId: string;
  existing?: any;
  trigger: ReactNode;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const isEdit = !!existing;

  const blank = { name: "", description: "", type: "for_time", timeCap: "", sortOrder: "0", isPublic: true };
  const fromExisting = existing ? {
    name: existing.name ?? "",
    description: existing.description ?? "",
    type: existing.type ?? "for_time",
    timeCap: existing.time_cap != null ? String(existing.time_cap) : "",
    sortOrder: existing.sort_order != null ? String(existing.sort_order) : "0",
    isPublic: existing.is_public ?? true,
  } : blank;

  const [form, setForm] = useState(fromExisting);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        timeCap: form.timeCap ? parseInt(form.timeCap as string) : null,
        sortOrder: parseInt(form.sortOrder as string) || 0,
      };
      return isEdit
        ? apiRequest("PUT", `/api/organiser/competitions/${compId}/workouts/${existing.id}`, payload).then(r => r.json())
        : apiRequest("POST", `/api/organiser/competitions/${compId}/workouts`, payload).then(r => r.json());
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Workout updated" : "Workout added" });
      setOpen(false);
      if (!isEdit) setForm(blank);
      onDone();
    },
    onError: () => toast({ title: "Error", description: isEdit ? "Failed to update workout" : "Failed to add workout", variant: "destructive" }),
  });

  return (
    <>
      <span onClick={() => { if (isEdit) setForm(fromExisting); setOpen(true); }}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111111] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white font-bold">{isEdit ? "Edit Workout" : "Add Workout"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Workout Name *</label>
              <Input value={form.name as string} onChange={e => set("name", e.target.value)} placeholder="e.g. Event 1 — Cindy" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Type</label>
                <Select value={form.type as string} onValueChange={v => set("type", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    <SelectItem value="for_time">For Time</SelectItem>
                    <SelectItem value="amrap">AMRAP</SelectItem>
                    <SelectItem value="max_weight">Max Weight</SelectItem>
                    <SelectItem value="max_reps">Max Reps</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Time Cap (min)</label>
                <Input type="number" value={form.timeCap as string} onChange={e => set("timeCap", e.target.value)} placeholder="None" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Order</label>
                <Input type="number" value={form.sortOrder as string} onChange={e => set("sortOrder", e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id={`isPublic-${existing?.id ?? "new"}`} checked={form.isPublic as boolean} onChange={e => set("isPublic", e.target.checked)} className="w-4 h-4 accent-[#C9A84C]" />
                <label htmlFor={`isPublic-${existing?.id ?? "new"}`} className="text-sm text-white/70">Visible to athletes</label>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-widest mb-1 block">Description / Standards</label>
              <Textarea value={form.description as string} onChange={e => set("description", e.target.value)} placeholder="3 rounds for time: 5 pull-ups, 10 push-ups, 15 squats..." className="bg-white/5 border-white/10 text-white resize-none" rows={4} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/20 text-white" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.name} className="bg-[#C9A84C] text-black font-bold">
              {mut.isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Competition Management Panel ─────────────────────────────────────────────
function CompetitionManagePanel({ comp, onBack }: { comp: any; onBack: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("registrations");
  const [search, setSearch] = useState("");
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const regQ = useQuery<any[]>({
    queryKey: ["/api/organiser/competitions", comp.id, "registrations"],
    queryFn: async () => {
      const r = await fetch(`/api/organiser/competitions/${comp.id}/registrations`);
      if (!r.ok) throw new Error("Failed to fetch registrations");
      return r.json();
    },
    enabled: tab === "registrations",
  });

  const catQ = useQuery<any[]>({
    queryKey: ["/api/competitions", comp.slug, "categories"],
    queryFn: async () => {
      const r = await fetch(`/api/competitions/${comp.slug}`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.categories ?? [];
    },
    enabled: tab === "categories",
  });

  const workoutQ = useQuery<any[]>({
    queryKey: ["/api/competitions", comp.slug, "workouts"],
    queryFn: async () => {
      const r = await fetch(`/api/competitions/${comp.slug}/workouts`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: tab === "workouts",
  });

  const confirmMut = useMutation({
    mutationFn: (regId: string) => apiRequest("PUT", `/api/organiser/competitions/${comp.id}/registrations/${regId}/confirm`, {}).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Registration confirmed" });
      queryClient.invalidateQueries({ queryKey: ["/api/organiser/competitions", comp.id, "registrations"] });
    },
  });

  const checkinMut = useMutation({
    mutationFn: (regId: string) => apiRequest("PUT", `/api/organiser/competitions/${comp.id}/registrations/${regId}/check-in`, {}).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Athlete checked in" });
      queryClient.invalidateQueries({ queryKey: ["/api/organiser/competitions", comp.id, "registrations"] });
    },
  });

  const cancelRegMut = useMutation({
    mutationFn: (regId: string) => apiRequest("DELETE", `/api/organiser/competitions/${comp.id}/registrations/${regId}`).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Registration cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/organiser/competitions", comp.id, "registrations"] });
    },
  });

  const deleteCatMut = useMutation({
    mutationFn: (catId: string) => apiRequest("DELETE", `/api/organiser/competitions/${comp.id}/categories/${catId}`).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Category removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", comp.slug, "categories"] });
    },
  });

  const deleteWorkoutMut = useMutation({
    mutationFn: (wId: string) => apiRequest("DELETE", `/api/organiser/competitions/${comp.id}/workouts/${wId}`).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Workout removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions", comp.slug, "workouts"] });
    },
  });

  const publishMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/organiser/competitions/${comp.id}/publish`, {}).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Competition published!", description: "Athletes can now find and register for your competition." });
      setPublishConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/organiser/competitions"] });
      onBack();
    },
    onError: () => toast({ title: "Error", description: "Failed to publish", variant: "destructive" }),
  });

  const deleteCompMut = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/organiser/competitions/${comp.id}`).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Competition deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/organiser/competitions"] });
      onBack();
    },
    onError: async (err: any) => {
      toast({ title: "Cannot delete", description: "Only draft or cancelled competitions can be deleted.", variant: "destructive" });
    },
  });

  const filteredRegs = regQ.data?.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.first_name + " " + r.last_name).toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.category_name?.toLowerCase().includes(q);
  }) ?? [];

  const stats = {
    total: regQ.data?.length ?? 0,
    confirmed: regQ.data?.filter(r => r.status === "confirmed" || r.status === "checked_in").length ?? 0,
    pending: regQ.data?.filter(r => r.status === "pending").length ?? 0,
    checkedIn: regQ.data?.filter(r => r.status === "checked_in").length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button size="sm" variant="outline" className="border-white/20 text-white gap-1" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{comp.name}</h2>
            {statusBadge(comp.status)}
          </div>
          <div className="flex gap-4 text-sm text-white/40 mt-1 flex-wrap">
            {comp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{comp.location}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(comp.start_date)} – {fmt(comp.end_date)}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/competitions/${comp.slug}`} target="_blank">
            <Button size="sm" variant="outline" className="border-white/20 text-white gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> View Page
            </Button>
          </Link>
          {comp.status === "draft" && (
            <Button size="sm" onClick={() => setPublishConfirm(true)} className="bg-green-500/20 text-green-400 border border-green-500/30 gap-1">
              <Globe className="w-3.5 h-3.5" /> Publish
            </Button>
          )}
          {(comp.status === "draft" || comp.status === "cancelled") && (
            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(true)} className="text-red-400/60 hover:text-red-400 gap-1 border border-red-500/20">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Publish confirmation */}
      {publishConfirm && (
        <Card className="bg-[#111] border-green-500/30">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-bold">Ready to go live?</p>
              <p className="text-white/50 text-sm">This will make the competition publicly visible and open for registration.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/20 text-white" onClick={() => setPublishConfirm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => publishMut.mutate()} disabled={publishMut.isPending} className="bg-green-500 text-black font-bold">
                {publishMut.isPending ? "Publishing..." : "Confirm Publish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Card className="bg-[#111] border-red-500/30">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-bold">Delete this competition?</p>
              <p className="text-white/50 text-sm">This will permanently remove the competition, all its categories and workouts. This cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/20 text-white" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => deleteCompMut.mutate()} disabled={deleteCompMut.isPending} className="bg-red-500 text-white font-bold">
                {deleteCompMut.isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="registrations" className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black text-white/60 gap-1.5">
            <Users className="w-3.5 h-3.5" /> Athletes
            {stats.total > 0 && <span className="ml-1 text-xs opacity-70">({stats.total})</span>}
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black text-white/60 gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Categories
          </TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-[#C9A84C] data-[state=active]:text-black text-white/60 gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Workouts
          </TabsTrigger>
        </TabsList>

        {/* Registrations */}
        <TabsContent value="registrations" className="mt-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Confirmed", value: stats.confirmed, color: "text-green-400" },
              { label: "Pending", value: stats.pending, color: "text-[#C9A84C]" },
              { label: "Checked In", value: stats.checkedIn, color: "text-blue-400" },
            ].map(s => (
              <Card key={s.label} className="bg-white/5 border-white/10">
                <CardContent className="p-3 text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, category..."
            className="bg-white/5 border-white/10 text-white"
          />

          {regQ.isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 bg-white/5 rounded-md" />)}</div>
          ) : filteredRegs.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{search ? "No athletes match your search" : "No athletes registered yet"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRegs.map((reg: any) => (
                <div key={reg.id} className="bg-white/5 border border-white/10 rounded-md px-4 py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {regStatusIcon(reg.status)}
                      <span className="text-white font-medium text-sm">{reg.first_name} {reg.last_name}</span>
                      <span className="text-white/40 text-xs">{reg.email}</span>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-white/40 flex-wrap">
                      <span>{reg.category_name}</span>
                      <span className="capitalize">{reg.status.replace(/_/g, " ")}</span>
                      {reg.payment_status && <span className="capitalize">{reg.payment_status}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 flex-wrap">
                    {reg.status === "pending" && (
                      <Button size="sm" onClick={() => confirmMut.mutate(reg.id)} disabled={confirmMut.isPending} className="bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 text-xs gap-1">
                        <CheckCircle className="w-3 h-3" /> Confirm
                      </Button>
                    )}
                    {reg.status === "confirmed" && (
                      <Button size="sm" onClick={() => checkinMut.mutate(reg.id)} disabled={checkinMut.isPending} className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs gap-1">
                        <UserCheck className="w-3 h-3" /> Check In
                      </Button>
                    )}
                    {reg.status !== "withdrawn" && reg.status !== "checked_in" && (
                      <Button size="sm" variant="ghost" onClick={() => cancelRegMut.mutate(reg.id)} disabled={cancelRegMut.isPending} className="text-red-400/60 hover:text-red-400 text-xs gap-1">
                        <X className="w-3 h-3" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-sm">Define the divisions athletes register into</p>
            <CategoryDialog
              compId={comp.id}
              onDone={() => queryClient.invalidateQueries({ queryKey: ["/api/competitions", comp.slug, "categories"] })}
              trigger={
                <Button size="sm" className="bg-[#C9A84C] text-black font-bold gap-1 text-xs">
                  <Plus className="w-3 h-3" /> Add Category
                </Button>
              }
            />
          </div>
          {catQ.isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 bg-white/5 rounded-md" />)}</div>
          ) : !catQ.data?.length ? (
            <div className="text-center py-12 text-white/30">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No categories yet — add at least one before publishing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {catQ.data?.map((cat: any) => (
                <div key={cat.id} className="bg-white/5 border border-white/10 rounded-md px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{cat.name}</p>
                    <div className="flex gap-3 mt-0.5 text-xs text-white/40 flex-wrap">
                      <span className="capitalize">{cat.difficulty_level}</span>
                      {cat.gender !== "any" && <span className="capitalize">{cat.gender}</span>}
                      {(cat.age_min || cat.age_max) && <span>{cat.age_min ?? ""}–{cat.age_max ?? ""} yrs</span>}
                      {cat.max_participants && <span>Max {cat.max_participants}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <CategoryDialog
                      compId={comp.id}
                      existing={cat}
                      onDone={() => queryClient.invalidateQueries({ queryKey: ["/api/competitions", comp.slug, "categories"] })}
                      trigger={
                        <Button size="icon" variant="ghost" className="text-white/30 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button size="icon" variant="ghost" onClick={() => deleteCatMut.mutate(cat.id)} className="text-white/30 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workouts */}
        <TabsContent value="workouts" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-sm">Programme of events for your competition</p>
            <WorkoutDialog
              compId={comp.id}
              onDone={() => queryClient.invalidateQueries({ queryKey: ["/api/competitions", comp.slug, "workouts"] })}
              trigger={
                <Button size="sm" className="bg-[#C9A84C] text-black font-bold gap-1 text-xs">
                  <Plus className="w-3 h-3" /> Add Workout
                </Button>
              }
            />
          </div>
          {workoutQ.isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 bg-white/5 rounded-md" />)}</div>
          ) : !workoutQ.data?.length ? (
            <div className="text-center py-12 text-white/30">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No workouts yet — add your events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workoutQ.data?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((w: any) => (
                <div key={w.id} className="bg-white/5 border border-white/10 rounded-md px-4 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] font-bold text-xs shrink-0 mt-0.5">
                    {w.sort_order + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{w.name}</p>
                      <span className="text-xs text-white/40 capitalize">{w.type?.replace(/_/g, " ")}</span>
                      {w.time_cap && <span className="text-xs text-white/40">{w.time_cap} min cap</span>}
                      {w.is_public ? <Eye className="w-3 h-3 text-white/30" /> : <EyeOff className="w-3 h-3 text-white/20" />}
                    </div>
                    {w.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{w.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <WorkoutDialog
                      compId={comp.id}
                      existing={w}
                      onDone={() => queryClient.invalidateQueries({ queryKey: ["/api/competitions", comp.slug, "workouts"] })}
                      trigger={
                        <Button size="icon" variant="ghost" className="text-white/30 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button size="icon" variant="ghost" onClick={() => deleteWorkoutMut.mutate(w.id)} className="text-white/30 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function OrganiserDashboard() {
  const [selected, setSelected] = useState<any>(null);

  const subQ = useQuery<any>({
    queryKey: ["/api/competitions/my-subscription"],
  });

  const compsQ = useQuery<any[]>({
    queryKey: ["/api/organiser/competitions"],
  });

  const sub = subQ.data;
  const hasSub = !!sub;

  if (selected) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <HeaderClean />
        <div className="pt-24 container mx-auto px-4 max-w-5xl pb-16">
          <CompetitionManagePanel comp={selected} onBack={() => {
            setSelected(null);
            compsQ.refetch();
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <HeaderClean />

      <div className="pt-24 container mx-auto px-4 max-w-5xl pb-16">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase">Organiser</span>
            <h1 className="text-3xl font-black uppercase tracking-tight mt-1">My Competitions</h1>
            <p className="text-white/40 mt-1">Create and manage the competitions you host</p>
          </div>
          {hasSub && (
            <CreateCompetitionDialog onCreated={() => compsQ.refetch()} />
          )}
        </div>

        {/* Subscription plan banner */}
        {subQ.isLoading ? (
          <Skeleton className="h-20 bg-white/5 rounded-md mb-6" />
        ) : hasSub ? (
          <Card className="bg-[#111] border-[#C9A84C]/30 mb-8">
            <CardContent className="p-4 flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-md bg-[#C9A84C]/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#C9A84C] font-bold text-sm uppercase tracking-wider">{sub.tier_name ?? sub.tier} Plan</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {sub.max_competitions ? `Up to ${sub.max_competitions} competitions` : "Unlimited competitions"}
                  {sub.allow_payment_processing ? " · Entry fee processing enabled" : ""}
                </p>
              </div>
              <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs capitalize">
                {sub.status}
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#111] border-white/10 mb-8">
            <CardContent className="p-6 text-center">
              <Lock className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="text-white font-bold mb-1">Host Subscription Required</p>
              <p className="text-white/40 text-sm mb-4">You need an approved host subscription to create and manage competitions.</p>
              <Link href="/competitions/host">
                <Button className="bg-[#C9A84C] text-black font-bold">Apply to Host</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Competition list */}
        {hasSub && (
          <>
            {compsQ.isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-md" />)}
              </div>
            ) : !compsQ.data?.length ? (
              <div className="text-center py-20">
                <Trophy className="w-16 h-16 mx-auto mb-6 text-white/10" />
                <p className="text-xl text-white/40 font-bold">No competitions yet</p>
                <p className="text-white/30 text-sm mb-6">Create your first competition to get started</p>
                <CreateCompetitionDialog onCreated={() => compsQ.refetch()} />
              </div>
            ) : (
              <div className="space-y-3">
                {compsQ.data?.map((comp: any) => (
                  <div
                    key={comp.id}
                    onClick={() => setSelected(comp)}
                    className="group bg-[#111111] border border-white/10 rounded-md p-4 flex items-center gap-4 cursor-pointer hover-elevate transition-all"
                  >
                    <div className="w-12 h-12 rounded-md bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-[#C9A84C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-bold">{comp.name}</p>
                        {statusBadge(comp.status)}
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-white/40 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(comp.start_date)}</span>
                        {comp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{comp.location}</span>}
                      </div>
                    </div>
                    <div className="flex gap-5 text-center shrink-0 text-sm">
                      <div>
                        <p className="text-white font-bold">{comp.registration_count ?? 0}</p>
                        <p className="text-white/30 text-xs">Athletes</p>
                      </div>
                      <div>
                        <p className="text-white font-bold">{comp.category_count ?? 0}</p>
                        <p className="text-white/30 text-xs">Categories</p>
                      </div>
                      <div>
                        <p className="text-white font-bold">{comp.workout_count ?? 0}</p>
                        <p className="text-white/30 text-xs">Workouts</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
