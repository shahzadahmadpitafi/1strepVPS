import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PoundSterling,
  Package,
  Users,
  Loader2,
  Plus,
  Minus,
  CheckCircle,
  ArrowUpDown,
  Gift,
  Tag,
  MousePointerClick,
  RotateCcw,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  BarChart2,
  Instagram,
  Youtube,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const GOLD = "#C9A84C";

type InfluencerSummary = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  tier: string;
  credit_balance: string;
  active_code: string | null;
  tracking_link: string | null;
  tracking_link_clicks: number;
  garment_drop_eligible: boolean;
  total_sales_generated: string;
  total_orders_generated: number;
  transaction_count: string;
  pending_redemptions: string;
};

type Redemption = {
  id: string;
  athlete_profile_id: string;
  first_name: string;
  last_name: string;
  email: string;
  tracking_link: string | null;
  type: string;
  credit_amount: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
};

type InfluencerDetail = {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    tier: string;
    credit_balance: string;
    tracking_link: string | null;
    tracking_link_clicks: number;
    garment_drop_eligible: boolean;
    total_sales_generated: string;
    total_orders_generated: number;
    welcome_credit_granted: boolean;
    joined_at: string;
  };
  variants: Array<{
    id: string;
    full_code: string;
    customer_discount_pct: number;
    influencer_credit_pct: number;
    is_active: boolean;
    use_count: number;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: string;
    description: string;
    created_at: string;
  }>;
  redemptions: Array<{
    id: string;
    type: string;
    credit_amount: string;
    status: string;
    notes: string | null;
    admin_notes: string | null;
    created_at: string;
  }>;
};

type ContentSubmission = {
  id: string;
  athlete_profile_id: string;
  first_name: string;
  last_name: string;
  athlete_name: string | null;
  discount_code: string;
  content_type: string;
  platform: string;
  content_url: string | null;
  description: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reach: number;
  metrics_updated_at: string | null;
  metrics_notes: string | null;
};

type PerformanceStat = {
  athlete_profile_id: string;
  first_name: string;
  last_name: string;
  tracking_link: string | null;
  tier: string;
  approved_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_clicks: number;
  total_reach: number;
  avg_engagement_rate: number;
};

function transactionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    welcome: "Welcome Credit",
    post_approved: "Post Approved",
    referral_sale: "Referral Sale",
    manual_adjust: "Manual Adjustment",
    redemption: "Redemption",
  };
  return labels[type] || type;
}

function redemptionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    cash_drawdown: "Cash Draw-down",
    store_credit: "Store Credit",
    clothing_credit: "Clothing Credit",
    gift_voucher: "Gift Voucher",
    giveaway_code: "Giveaway Code",
  };
  return labels[type] || type;
}

function redemptionCashValue(type: string, credits: number): string {
  if (type === "cash_drawdown") return `£${(credits * 0.5).toFixed(2)} cash`;
  if (type === "store_credit") return `£${credits.toFixed(2)} store credit`;
  return `${credits} credits`;
}

const tierColors: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  elite: "bg-purple-600",
};

export default function AdminInfluencerCredits() {
  const { toast } = useToast();
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showRedemptionDialog, setShowRedemptionDialog] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [redemptionStatus, setRedemptionStatus] = useState("approved");
  const [redemptionAdminNotes, setRedemptionAdminNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [metricsDialog, setMetricsDialog] = useState<ContentSubmission | null>(null);
  const [metricsForm, setMetricsForm] = useState({ views: "", likes: "", comments: "", shares: "", clicks: "", reach: "", metricsNotes: "" });
  const [contentFilter, setContentFilter] = useState<"all" | "approved" | "pending" | "featured">("all");
  const [contentSearch, setContentSearch] = useState("");

  const { data: influencers = [], isLoading: loadingInfluencers } = useQuery<InfluencerSummary[]>({
    queryKey: ["/api/admin/influencers"],
  });

  const { data: contentSubmissions = [], isLoading: loadingContent } = useQuery<ContentSubmission[]>({
    queryKey: ["/api/admin/athlete-content-submissions"],
  });

  const { data: performanceStats = [], isLoading: loadingPerformance } = useQuery<PerformanceStat[]>({
    queryKey: ["/api/admin/influencer-performance"],
  });

  const updateMetricsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof metricsForm }) => {
      const res = await apiRequest("PATCH", `/api/admin/athlete-content-submissions/${id}/metrics`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/athlete-content-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/influencer-performance"] });
      setMetricsDialog(null);
      toast({ title: "Metrics Updated", description: "Post performance metrics saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save metrics", variant: "destructive" });
    },
  });

  const { data: redemptions = [], isLoading: loadingRedemptions } = useQuery<Redemption[]>({
    queryKey: ["/api/admin/influencer-redemptions", "all"],
    queryFn: () => fetch("/api/admin/influencer-redemptions?status=all", { credentials: "include" }).then(r => r.json()),
  });

  const { data: detail, isLoading: loadingDetail } = useQuery<InfluencerDetail>({
    queryKey: ["/api/admin/influencers", selectedInfluencer],
    enabled: !!selectedInfluencer,
  });

  const creditAdjustMutation = useMutation({
    mutationFn: async ({ id, amount, description }: { id: string; amount: number; description: string }) => {
      const res = await apiRequest("POST", `/api/admin/influencers/${id}/credit-adjust`, { amount, description });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/influencers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/influencers", selectedInfluencer] });
      setShowCreditDialog(false);
      setCreditAmount("");
      setCreditDescription("");
      toast({ title: "Credit Adjusted", description: "Credit balance updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to adjust credit", variant: "destructive" });
    },
  });

  const garmentDropMutation = useMutation({
    mutationFn: async ({ id, eligible }: { id: string; eligible: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/influencers/${id}/garment-drop`, { eligible });
      return res.json();
    },
    onSuccess: (_, { eligible }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/influencers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/influencers", selectedInfluencer] });
      toast({ title: eligible ? "Garment Drop Enabled" : "Garment Drop Removed", description: "Status updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update garment drop", variant: "destructive" });
    },
  });

  const updateRedemptionMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/influencer-redemptions/${id}`, { status, adminNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/influencer-redemptions", "all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/influencers", selectedInfluencer] });
      setShowRedemptionDialog(null);
      setRedemptionStatus("approved");
      setRedemptionAdminNotes("");
      toast({ title: "Redemption Updated", description: "Redemption status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update redemption", variant: "destructive" });
    },
  });

  const filtered = influencers.filter(inf =>
    `${inf.first_name} ${inf.last_name} ${inf.email} ${inf.tracking_link || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRedemptionsCount = redemptions.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Influencer Credits</h1>
          <p className="text-muted-foreground text-sm">Manage credit balances, discount variants, and redemptions</p>
        </div>
        {pendingRedemptionsCount > 0 && (
          <Badge className="text-white" style={{ backgroundColor: GOLD }}>
            {pendingRedemptionsCount} pending redemption{pendingRedemptionsCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total Influencers</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{influencers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total Credits Held</span>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {Math.round(influencers.reduce((sum, i) => sum + parseFloat(i.credit_balance || "0"), 0))} credits
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Pending Redemptions</span>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{pendingRedemptionsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Garment Drop Eligible</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{influencers.filter(i => i.garment_drop_eligible).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="influencers">
        <TabsList className="flex-wrap">
          <TabsTrigger value="influencers">All Influencers</TabsTrigger>
          <TabsTrigger value="redemptions">
            Redemptions
            {pendingRedemptionsCount > 0 && (
              <Badge className="ml-2 text-white text-xs" style={{ backgroundColor: GOLD }}>
                {pendingRedemptionsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content-performance">
            Content Performance
            {contentSubmissions.filter(c => !c.metrics_updated_at && (c.status === "approved" || c.status === "featured")).length > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white text-xs">
                {contentSubmissions.filter(c => !c.metrics_updated_at && (c.status === "approved" || c.status === "featured")).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* INFLUENCERS TAB */}
        <TabsContent value="influencers" className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search influencers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-influencers"
            />
          </div>

          {loadingInfluencers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Influencer List */}
              <div className="xl:col-span-2 space-y-2">
                {filtered.map((inf) => (
                  <Card
                    key={inf.id}
                    className={`cursor-pointer hover-elevate ${selectedInfluencer === inf.id ? "ring-2" : ""}`}
                    style={selectedInfluencer === inf.id ? { ringColor: GOLD } : {}}
                    onClick={() => setSelectedInfluencer(inf.id)}
                    data-testid={`card-influencer-${inf.id}`}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold">{inf.first_name} {inf.last_name}</p>
                          <p className="text-xs text-muted-foreground">{inf.tracking_link ? `/${inf.tracking_link}` : inf.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" style={{ color: GOLD }}>{Math.round(parseFloat(inf.credit_balance || "0"))} cr</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Badge className={`${tierColors[inf.tier]} text-white text-xs`}>{inf.tier}</Badge>
                            {inf.garment_drop_eligible && <Package className="h-3 w-3" style={{ color: GOLD }} />}
                            {parseInt(inf.pending_redemptions || "0") > 0 && (
                              <Badge variant="destructive" className="text-xs">{inf.pending_redemptions}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No influencers found</p>
                )}
              </div>

              {/* Detail Panel */}
              <div className="xl:col-span-3">
                {!selectedInfluencer ? (
                  <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Select an influencer to view details</p>
                    </CardContent>
                  </Card>
                ) : loadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : detail ? (
                  <div className="space-y-4">
                    {/* Profile Header */}
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-bold">{detail.profile.first_name} {detail.profile.last_name}</h2>
                            <p className="text-sm text-muted-foreground">{detail.profile.email}</p>
                            {detail.profile.tracking_link && (
                              <p className="text-sm mt-1 flex items-center gap-1">
                                <MousePointerClick className="h-3 w-3" />
                                {detail.profile.tracking_link_clicks.toLocaleString()} clicks · 1strep.com/?ref={detail.profile.tracking_link}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: GOLD }}>
                              {Math.round(parseFloat(detail.profile.credit_balance || "0"))} credits
                            </div>
                            <p className="text-xs text-muted-foreground">Credit Balance</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => setShowCreditDialog(true)}
                            data-testid="button-adjust-credit"
                          >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Adjust Credit
                          </Button>
                          <Button
                            size="sm"
                            variant={detail.profile.garment_drop_eligible ? "destructive" : "outline"}
                            onClick={() => garmentDropMutation.mutate({ id: selectedInfluencer, eligible: !detail.profile.garment_drop_eligible })}
                            disabled={garmentDropMutation.isPending}
                            data-testid="button-toggle-garment-drop"
                          >
                            <Package className="h-4 w-4 mr-1" />
                            {detail.profile.garment_drop_eligible ? "Remove Garment Drop" : "Mark Garment Drop"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Discount Variants */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Discount Variants</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {detail.variants.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No variants</p>
                        ) : (
                          <div className="space-y-2">
                            {detail.variants.map(v => (
                              <div key={v.id} className="flex items-center justify-between gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <code className="font-semibold">{v.full_code}</code>
                                  {v.is_active && <Badge className="text-white text-xs" style={{ backgroundColor: GOLD }}>Active</Badge>}
                                </div>
                                <span className="text-muted-foreground">
                                  {v.customer_discount_pct}% off ·{" "}
                                  {(v as any).fixed_credits_per_order > 0
                                    ? `${(v as any).fixed_credits_per_order} credits/sale`
                                    : v.influencer_credit_pct > 0
                                    ? `${v.influencer_credit_pct}% credit`
                                    : "0 credits"}
                                  {" "}· {v.use_count} uses
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Transactions */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Credit History ({detail.transactions.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-64 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {detail.transactions.map(tx => {
                                const amt = parseFloat(tx.amount);
                                return (
                                  <TableRow key={tx.id}>
                                    <TableCell>
                                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                        {transactionTypeLabel(tx.type)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {new Date(tx.created_at).toLocaleDateString("en-GB")}
                                    </TableCell>
                                    <TableCell className={`text-right text-sm font-semibold ${amt > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                                      {amt > 0 ? "+" : ""}{Math.round(Math.abs(amt))} cr
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {detail.transactions.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No transactions</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Redemptions */}
                    {detail.redemptions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Redemption Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {detail.redemptions.map(r => (
                              <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
                                <div>
                                  <p className="font-medium">{redemptionTypeLabel(r.type)} — {Math.round(parseFloat(r.credit_amount))} credits ({redemptionCashValue(r.type, Math.round(parseFloat(r.credit_amount)))})</p>
                                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-GB")}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={r.status === "fulfilled" ? "default" : r.status === "approved" ? "secondary" : "outline"}>
                                    {r.status}
                                  </Badge>
                                  {r.status !== "fulfilled" && (
                                    <Button size="sm" variant="outline" onClick={() => setShowRedemptionDialog(r.id)}>
                                      Review
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </TabsContent>

        {/* REDEMPTIONS TAB */}
        <TabsContent value="redemptions" className="space-y-4">
          {loadingRedemptions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-medium">{r.first_name} {r.last_name}</p>
                          <p className="text-xs text-muted-foreground">{r.tracking_link ? `/${r.tracking_link}` : r.email}</p>
                        </TableCell>
                        <TableCell>{redemptionTypeLabel(r.type)}</TableCell>
                        <TableCell className="font-semibold">
                          {Math.round(parseFloat(r.credit_amount))} credits{" "}
                          <span className="text-muted-foreground font-normal text-xs">({redemptionCashValue(r.type, Math.round(parseFloat(r.credit_amount)))})</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "fulfilled" ? "default" : r.status === "approved" ? "secondary" : "outline"}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.status !== "fulfilled" && (
                            <Button size="sm" variant="outline" onClick={() => {
                              setShowRedemptionDialog(r.id);
                              setRedemptionStatus(r.status === "pending" ? "approved" : "fulfilled");
                              setRedemptionAdminNotes(r.admin_notes || "");
                            }} data-testid={`button-review-redemption-${r.id}`}>
                              Review
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {redemptions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No redemption requests yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CONTENT PERFORMANCE TAB */}
        <TabsContent value="content" className="space-y-6">
          {/* Per-influencer aggregate leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: GOLD }} />
                Influencer Performance Leaderboard
              </CardTitle>
              <CardDescription>Aggregate metrics across all approved posts per influencer</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerformance ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : performanceStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No performance data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead className="text-right">Posts</TableHead>
                      <TableHead className="text-right">Total Views</TableHead>
                      <TableHead className="text-right">Total Likes</TableHead>
                      <TableHead className="text-right">Total Reach</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceStats.map((stat, idx) => (
                      <TableRow key={stat.athlete_profile_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {idx === 0 && <span style={{ color: GOLD }}>★</span>}
                            <div>
                              <p className="font-semibold">{stat.first_name} {stat.last_name}</p>
                              {stat.tracking_link && <p className="text-xs text-muted-foreground">/{stat.tracking_link}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{Number(stat.approved_posts)}</TableCell>
                        <TableCell className="text-right">{Number(stat.total_views).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(stat.total_likes).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(stat.total_reach).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {Number(stat.total_reach) > 0 ? (
                            <span style={{ color: GOLD }} className="font-semibold">{Number(stat.avg_engagement_rate)}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Individual post metrics */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Input
                placeholder="Search posts by influencer or platform..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="max-w-sm"
                data-testid="input-content-search"
              />
              <Select value={contentFilter} onValueChange={(v) => setContentFilter(v as typeof contentFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingContent ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {contentSubmissions
                  .filter(c => contentFilter === "all" || c.status === contentFilter)
                  .filter(c => {
                    const q = contentSearch.toLowerCase();
                    return !q || `${c.first_name} ${c.last_name} ${c.platform} ${c.content_type}`.toLowerCase().includes(q);
                  })
                  .map((sub) => {
                    const hasMetrics = !!sub.metrics_updated_at;
                    const engRate = sub.reach > 0
                      ? (((sub.likes + sub.comments + sub.shares) / sub.reach) * 100).toFixed(1)
                      : null;
                    return (
                      <Card key={sub.id} data-testid={`card-content-${sub.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              {sub.platform === "instagram" && <Instagram className="h-4 w-4 text-pink-500 flex-shrink-0" />}
                              {sub.platform === "tiktok" && <SiTiktok className="h-4 w-4 flex-shrink-0" />}
                              {sub.platform === "youtube" && <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />}
                              <div>
                                <p className="font-semibold">{sub.first_name} {sub.last_name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{sub.content_type} · {sub.platform} · {new Date(sub.created_at).toLocaleDateString("en-GB")}</p>
                                {sub.description && <p className="text-xs text-muted-foreground mt-0.5">{sub.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {sub.status === "approved" && <Badge className="bg-green-600 text-white">Approved</Badge>}
                              {sub.status === "featured" && <Badge style={{ backgroundColor: GOLD }} className="text-white">Featured</Badge>}
                              {sub.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                              {sub.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                              {sub.content_url && (
                                <a href={sub.content_url} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="ghost">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </a>
                              )}
                              {(sub.status === "approved" || sub.status === "featured") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setMetricsDialog(sub);
                                    setMetricsForm({
                                      views: String(sub.views || 0),
                                      likes: String(sub.likes || 0),
                                      comments: String(sub.comments || 0),
                                      shares: String(sub.shares || 0),
                                      clicks: String(sub.clicks || 0),
                                      reach: String(sub.reach || 0),
                                      metricsNotes: sub.metrics_notes || "",
                                    });
                                  }}
                                  data-testid={`button-metrics-${sub.id}`}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  {hasMetrics ? "Edit Metrics" : "Add Metrics"}
                                </Button>
                              )}
                            </div>
                          </div>

                          {hasMetrics && (
                            <div className="mt-3">
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                {[
                                  { icon: Eye, label: "Views", value: sub.views },
                                  { icon: Heart, label: "Likes", value: sub.likes },
                                  { icon: MessageCircle, label: "Comments", value: sub.comments },
                                  { icon: Share2, label: "Shares", value: sub.shares },
                                  { icon: MousePointerClick, label: "Clicks", value: sub.clicks },
                                  { icon: Users, label: "Reach", value: sub.reach },
                                ].map(({ icon: Icon, label, value }) => (
                                  <div key={label} className="text-center p-2 rounded-md bg-muted/50">
                                    <Icon className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-xs font-semibold">{Number(value).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                {engRate && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" style={{ color: GOLD }} />
                                    <span style={{ color: GOLD }} className="font-semibold">{engRate}%</span> engagement
                                  </span>
                                )}
                                {sub.metrics_notes && <span>· {sub.metrics_notes}</span>}
                                <span className="text-muted-foreground">Updated {new Date(sub.metrics_updated_at!).toLocaleDateString("en-GB")}</span>
                              </div>
                            </div>
                          )}

                          {!hasMetrics && (sub.status === "approved" || sub.status === "featured") && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <BarChart2 className="h-3 w-3" />
                              No metrics recorded yet — click "Add Metrics" to enter performance data
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                {contentSubmissions.filter(c => contentFilter === "all" || c.status === contentFilter).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No posts found</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Metrics Editor Dialog */}
      <Dialog open={!!metricsDialog} onOpenChange={() => setMetricsDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post Performance Metrics</DialogTitle>
            <DialogDescription>
              {metricsDialog && `${metricsDialog.first_name} ${metricsDialog.last_name} · ${metricsDialog.content_type} on ${metricsDialog.platform}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {[
              { key: "views", label: "Views", icon: Eye },
              { key: "likes", label: "Likes", icon: Heart },
              { key: "comments", label: "Comments", icon: MessageCircle },
              { key: "shares", label: "Shares", icon: Share2 },
              { key: "clicks", label: "Clicks", icon: MousePointerClick },
              { key: "reach", label: "Reach", icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="space-y-1">
                <Label className="flex items-center gap-1">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  {label}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={metricsForm[key as keyof typeof metricsForm]}
                  onChange={(e) => setMetricsForm(f => ({ ...f, [key]: e.target.value }))}
                  data-testid={`input-metric-${key}`}
                />
              </div>
            ))}
            <div className="col-span-2 space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about this post's performance..."
                value={metricsForm.metricsNotes}
                onChange={(e) => setMetricsForm(f => ({ ...f, metricsNotes: e.target.value }))}
                data-testid="input-metrics-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricsDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!metricsDialog) return;
                updateMetricsMutation.mutate({ id: metricsDialog.id, data: metricsForm });
              }}
              disabled={updateMetricsMutation.isPending}
              data-testid="button-save-metrics"
            >
              {updateMetricsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Metrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Adjust Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credit Balance</DialogTitle>
            <DialogDescription>
              Enter a positive number to add credits, negative to deduct.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (£)</Label>
              <Input
                type="number"
                step={0.01}
                placeholder="e.g. 50 or -25"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                data-testid="input-credit-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason / Description</Label>
              <Textarea
                placeholder="Reason for adjustment..."
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                data-testid="input-credit-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedInfluencer) return;
                creditAdjustMutation.mutate({
                  id: selectedInfluencer,
                  amount: parseFloat(creditAmount),
                  description: creditDescription,
                });
              }}
              disabled={!creditAmount || !creditDescription || creditAdjustMutation.isPending}
              data-testid="button-confirm-credit-adjust"
            >
              {creditAdjustMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemption Review Dialog */}
      <Dialog open={!!showRedemptionDialog} onOpenChange={() => setShowRedemptionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Redemption</DialogTitle>
            <DialogDescription>Update the status of this redemption request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={redemptionStatus} onValueChange={setRedemptionStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Any notes for the influencer..."
                value={redemptionAdminNotes}
                onChange={(e) => setRedemptionAdminNotes(e.target.value)}
                data-testid="input-admin-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRedemptionDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!showRedemptionDialog) return;
                updateRedemptionMutation.mutate({
                  id: showRedemptionDialog,
                  status: redemptionStatus,
                  adminNotes: redemptionAdminNotes,
                });
              }}
              disabled={updateRedemptionMutation.isPending}
              data-testid="button-confirm-redemption"
            >
              {updateRedemptionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
