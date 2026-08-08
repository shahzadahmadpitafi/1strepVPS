import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Trophy, Calendar, MapPin, CheckCircle, Clock, AlertCircle, ChevronRight, Users, UserCheck, UserX, Bell, LogIn } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import HeaderClean from "@/components/HeaderClean";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "confirmed":
    case "checked_in": return <CheckCircle className="w-4 h-4 text-white/60" />;
    case "pending": return <Clock className="w-4 h-4 text-white/40" />;
    default: return <AlertCircle className="w-4 h-4 text-white/30" />;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "confirmed": return "Confirmed";
    case "checked_in": return "Checked In";
    case "pending": return "Pending";
    case "withdrawn": return "Withdrawn";
    case "disqualified": return "Disqualified";
    default: return status;
  }
}

function paymentLabel(status: string) {
  switch (status) {
    case "paid": return { label: "Paid", color: "text-white/60" };
    case "unpaid": return { label: "Payment Required", color: "text-white/50" };
    case "refunded": return { label: "Refunded", color: "text-white/30" };
    default: return { label: status, color: "text-white/30" };
  }
}

function TeamInvites({ slug }: { slug: string }) {
  const { toast } = useToast();
  const { data: members, refetch } = useQuery<any[]>({
    queryKey: ["/api/competitions", slug, "team-members"],
    queryFn: async () => {
      const res = await fetch(`/api/competitions/${slug}/teams/members`);
      if (!res.ok) return [];
      return res.json();
    },
  });
  const respondMutation = useMutation({
    mutationFn: async (accept: boolean) =>
      apiRequest("POST", `/api/competitions/${slug}/teams/respond`, { accept }),
    onSuccess: (_data, accept) => {
      toast({ title: accept ? "Team invitation accepted!" : "Invitation declined." });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/competitions/my/registrations"] });
    },
  });

  const pendingInvites = members?.filter(m => m.invite_status === "pending") ?? [];
  if (pendingInvites.length === 0) return null;

  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="text-white/40 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Team invite pending</span>
      <Button size="sm" onClick={() => respondMutation.mutate(true)} className="bg-[#FAFAF8] text-[#080808] font-bold h-7 px-3 text-xs gap-1">
        <UserCheck className="w-3 h-3" /> Accept
      </Button>
      <Button size="sm" variant="outline" onClick={() => respondMutation.mutate(false)} className="border-white/20 text-white h-7 px-3 text-xs gap-1">
        <UserX className="w-3 h-3" /> Decline
      </Button>
    </div>
  );
}

function PendingTeamInvitations() {
  const { toast } = useToast();
  const { data: invites, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/competitions/my/team-invites"],
  });

  const [shirtSizes, setShirtSizes] = useState<Record<string, string>>({});
  const [waiverChecked, setWaiverChecked] = useState<Record<string, boolean>>({});

  const respondMutation = useMutation({
    mutationFn: async ({ slug, accept, shirtSize, waiverSigned }: { slug: string; accept: boolean; shirtSize?: string; waiverSigned?: boolean }) =>
      apiRequest("POST", `/api/competitions/${slug}/teams/respond`, { accept, shirtSize, waiverSigned }),
    onSuccess: (_data, vars) => {
      toast({ title: vars.accept ? "Team invitation accepted!" : "Invitation declined." });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/competitions/my/registrations"] });
    },
  });

  if (isLoading || !invites?.length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#C9A84C]" />
        Team Invitations
        <Badge className="bg-[#C9A84C] text-[#080808] font-bold text-xs ml-1">{invites.length}</Badge>
      </h2>
      <div className="space-y-3">
        {invites.map((invite: any) => (
          <div key={invite.member_id} className="bg-[#111111] border border-[#C9A84C]/20 rounded-md p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{invite.competition_name}</p>
                <p className="text-white/50 text-sm mt-0.5">
                  <span className="text-[#C9A84C]">{invite.captain_first_name} {invite.captain_last_name}</span>
                  {" "}has invited you to join their team
                  {invite.team_name && <> <span className="text-white font-semibold">"{invite.team_name}"</span></>}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(invite.start_date)}</span>
                  {invite.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{invite.location}</span>}
                </div>
                <div className="mt-3 max-w-[160px]">
                  <label className="text-white/40 text-xs block mb-1">T-shirt size</label>
                  <Select value={shirtSizes[invite.member_id] || ""} onValueChange={v => setShirtSizes(s => ({ ...s, [invite.member_id]: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/20">
                      {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {invite.waiver_text && (
                  <div className="mt-4 border border-white/10 rounded-md p-3 bg-white/3">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">Waiver &amp; Release</p>
                    <div className="max-h-32 overflow-y-auto mb-3">
                      <p className="text-white/40 text-xs whitespace-pre-wrap leading-relaxed">{invite.waiver_text}</p>
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-yellow-400 mt-0.5 w-4 h-4 shrink-0"
                        checked={!!waiverChecked[invite.member_id]}
                        onChange={e => setWaiverChecked(s => ({ ...s, [invite.member_id]: e.target.checked }))}
                      />
                      <span className="text-white/60 text-xs leading-snug">
                        I have read and agree to the waiver and release of liability
                      </span>
                    </label>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => respondMutation.mutate({ slug: invite.slug, accept: true, shirtSize: shirtSizes[invite.member_id], waiverSigned: waiverChecked[invite.member_id] })}
                  disabled={respondMutation.isPending || (!!invite.waiver_text && !waiverChecked[invite.member_id])}
                  className="bg-[#FAFAF8] text-[#080808] font-bold gap-1 disabled:opacity-40"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondMutation.mutate({ slug: invite.slug, accept: false })}
                  disabled={respondMutation.isPending}
                  className="border-white/20 text-white gap-1"
                >
                  <UserX className="w-3.5 h-3.5" /> Decline
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyCompetitions() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading: authLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: registrations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/competitions/my/registrations"],
    enabled: !!user,
  });

  const upcoming = registrations?.filter(r => new Date(r.end_date) >= new Date()) ?? [];
  const past = registrations?.filter(r => new Date(r.end_date) < new Date()) ?? [];

  // Not logged in — show login prompt
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
        <HeaderClean />
        <div className="pt-24 container mx-auto px-4 max-w-4xl pb-16">
          <div className="mb-8">
            <span className="text-white/30 text-xs font-bold tracking-[0.2em] uppercase">Dashboard</span>
            <h1 className="text-3xl font-black uppercase tracking-tight mt-1">My Competitions</h1>
          </div>
          <div className="text-center py-20 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-xl font-bold text-white mb-2">Log in to continue</p>
            <p className="text-white/40 text-sm mb-8">
              To view your competitions or accept a team invitation, please log in to your 1stRep account.
            </p>
            <Button
              className="bg-[#FAFAF8] text-[#080808] font-bold gap-2"
              onClick={() => setLocation("/account?redirect=/my-competitions")}
            >
              <LogIn className="w-4 h-4" /> Log In to Your Account
            </Button>
            <p className="text-white/25 text-xs mt-4">
              Don't have an account?{" "}
              <a href="/account?redirect=/my-competitions" className="text-white/50 underline">
                Create one free
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <HeaderClean />

      <div className="pt-24 container mx-auto px-4 max-w-4xl pb-16">
        <div className="mb-8">
          <span className="text-white/30 text-xs font-bold tracking-[0.2em] uppercase">Dashboard</span>
          <h1 className="text-3xl font-black uppercase tracking-tight mt-1">My Competitions</h1>
          <p className="text-white/40 mt-1">Your registered competitions and upcoming events</p>
        </div>

        {/* Pending team invitations — shown even if user has no own registrations */}
        <PendingTeamInvitations />

        {isLoading || authLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 bg-white/5 rounded-md" />
            ))}
          </div>
        ) : registrations?.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto mb-6 text-white/10" />
            <p className="text-xl text-white/40">No competitions yet</p>
            <p className="text-white/25 text-sm mb-6">Browse upcoming competitions and register to get started</p>
            <Link href="/competitions">
              <Button className="bg-[#FAFAF8] text-[#080808] font-bold">Browse Competitions</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white/40" /> Upcoming
                </h2>
                <div className="space-y-3">
                  {upcoming.map((reg: any) => {
                    const payment = paymentLabel(reg.payment_status);
                    const isTeam = ["teams_of_2", "teams_of_3", "teams_of_4"].includes(reg.competition_format);
                    return (
                      <div key={reg.id} className="bg-[#111111] border border-white/10 rounded-md overflow-hidden">
                        <Link href={`/competitions/${reg.slug}`}>
                          <div className="group flex items-center gap-4 p-4 hover-elevate cursor-pointer transition-all">
                            <div className="w-12 h-12 bg-white/5 rounded-md flex items-center justify-center shrink-0">
                              <Trophy className="w-6 h-6 text-white/30" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold truncate">{reg.competition_name}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-white/40">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(reg.start_date)}</span>
                                {reg.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{reg.location}</span>}
                                <span>{reg.category_name}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <StatusIcon status={reg.status} />
                                <span className="text-sm text-white/60">{statusLabel(reg.status)}</span>
                              </div>
                              <span className={`text-xs ${payment.color}`}>{payment.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                          </div>
                        </Link>
                        {isTeam && (
                          <div className="px-4 pb-3 border-t border-white/5">
                            <TeamInvites slug={reg.slug} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-white/40 font-bold text-lg mb-4">Past Competitions</h2>
                <div className="space-y-3">
                  {past.map((reg: any) => (
                    <Link key={reg.id} href={`/competitions/${reg.slug}`}>
                      <div className="group flex items-center gap-4 p-4 bg-[#0d0d0d] border border-white/5 rounded-md hover-elevate cursor-pointer transition-all opacity-60 hover:opacity-100">
                        <div className="w-12 h-12 bg-white/5 rounded-md flex items-center justify-center shrink-0">
                          <Trophy className="w-6 h-6 text-white/15" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/60 font-bold truncate">{reg.competition_name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-white/30">
                            <span>{formatDate(reg.start_date)}</span>
                            <span>{reg.category_name}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-white/10 text-white/25 text-xs capitalize">{reg.competition_status?.replace(/_/g, " ")}</Badge>
                        <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/35 transition-colors shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Link href="/competitions">
                <Button variant="outline" className="border-white/20 text-white gap-2">
                  <Trophy className="w-4 h-4" /> Browse All Competitions
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
