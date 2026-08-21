import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Gift,
  Users,
  Star,
  Copy,
  CheckCircle,
  Loader2,
  PoundSterling,
  ShoppingBag,
  Instagram,
  Youtube,
  Share2,
  Plus,
  Award,
  LogOut,
  Link2,
  Tag,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  ChevronRight,
  UserCircle2,
  Pencil,
  Upload,
  MousePointerClick,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import HeaderClean from "@/components/HeaderClean";

type AthleteProfile = {
  id: string;
  user_id: string;
  tier: string;
  discount_code: string;
  discount_percentage: number;
  sport: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  onboarding_completed: boolean;
  total_sales_generated: string;
  total_orders_generated: number;
  credit_balance: string;
  tracking_link: string | null;
  tracking_link_clicks: number;
  welcome_credit_granted: boolean;
  garment_drop_eligible: boolean;
  joined_at: string;
  email: string;
  first_name: string;
  last_name: string;
};

type DiscountVariant = {
  id: string;
  athlete_profile_id: string;
  code_suffix: string;
  full_code: string;
  customer_discount_pct: number;
  influencer_credit_pct: number;
  is_active: boolean;
  use_count: number;
  created_at: string;
};

type CreditTransaction = {
  id: string;
  athlete_profile_id: string;
  type: string;
  amount: string;
  description: string;
  order_id: string | null;
  created_at: string;
};

type Redemption = {
  id: string;
  type: string;
  credit_amount: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
};

type InfluencerData = {
  profile: AthleteProfile;
  variants: DiscountVariant[];
  transactions: CreditTransaction[];
  redemptions: Redemption[];
  personalDiscountCode: string | null;
  personalDiscountUsed: boolean;
};


const GOLD = "#C9A84C";

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

function redemptionValue(type: string, credits: number): string {
  if (type === "cash_drawdown") return `£${(credits * 0.5).toFixed(2)} cash`;
  if (type === "store_credit") return `£${credits.toFixed(2)} store credit`;
  return `${credits} credits`;
}

export default function AthleteDashboard() {
  const [, navigate] = useLocation();

  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [redemptionType, setRedemptionType] = useState<string>("");
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionNotes, setRedemptionNotes] = useState("");
  const [profileForm, setProfileForm] = useState({ bio: "", sport: "", instagram: "", tiktok: "", youtube: "" });
  const [profileFormInit, setProfileFormInit] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();


  const [variantForm, setVariantForm] = useState({
    codeSuffix: "",
    customerDiscountPct: "",
    fixedCreditsPerOrder: "",
  });
  // Credits per sale can't exceed the discount % — keeps payouts from ever
  // costing more than the discount itself.
  const creditsExceedCap =
    !!variantForm.fixedCreditsPerOrder &&
    !!variantForm.customerDiscountPct &&
    parseInt(variantForm.fixedCreditsPerOrder) > parseInt(variantForm.customerDiscountPct);

  const { data: influencerData, isLoading: loadingProfile, isError } = useQuery<InfluencerData>({
    queryKey: ["/api/influencer/profile"],
  });

  const { data: authUser, isLoading: loadingAuth } = useQuery<{ id: string; email: string; role: string } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Redirect to login (with return URL) if not authenticated
  useEffect(() => {
    if (!loadingAuth && !loadingProfile && isError && !authUser) {
      navigate("/influencer-login?redirect=/athlete/dashboard");
    }
  }, [loadingAuth, loadingProfile, isError, authUser, navigate]);


  useEffect(() => {
    if (influencerData?.profile && !profileFormInit) {
      const p = influencerData.profile;
      setProfileForm({
        bio: p.bio || "",
        sport: p.sport || "",
        instagram: p.instagram || "",
        tiktok: p.tiktok || "",
        youtube: p.youtube || "",
      });
      setProfileFormInit(true);
    }
  }, [influencerData, profileFormInit]);



  const createVariantMutation = useMutation({
    mutationFn: async (data: typeof variantForm) => {
      const response = await apiRequest("POST", "/api/influencer/discount-variants", {
        codeSuffix: data.codeSuffix,
        customerDiscountPct: parseInt(data.customerDiscountPct),
        fixedCreditsPerOrder: parseInt(data.fixedCreditsPerOrder) || 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/profile"] });
      setShowVariantDialog(false);
      setVariantForm({ codeSuffix: "", customerDiscountPct: "", fixedCreditsPerOrder: "" });
      toast({ title: "Variant Created", description: "New discount code variant created." });
    },
    onError: async (err: any) => {
      // err.message is "<status>: <raw response text>" (see throwIfResNotOk in
      // queryClient.ts) — the server already sends a specific, useful reason
      // (e.g. "This code suffix is already in use"); show that instead of a
      // generic message so the influencer knows what to actually fix.
      let description = "Failed to create variant";
      const raw = typeof err?.message === "string" ? err.message.replace(/^\d+:\s*/, "") : "";
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          description = parsed?.error || raw;
        } catch {
          description = raw;
        }
      }
      toast({ title: "Error", description, variant: "destructive" });
    },
  });

  const activateVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/influencer/discount-variants/${id}/activate`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/profile"] });
      toast({ title: "Variant Activated", description: `${data.activatedCode} is now your active code.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate variant", variant: "destructive" });
    },
  });

  const submitRedemptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/influencer/redemptions", {
        type: redemptionType,
        creditAmount: parseFloat(redemptionAmount),
        notes: redemptionNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/profile"] });
      setShowRedemptionDialog(false);
      setRedemptionType("");
      setRedemptionAmount("");
      setRedemptionNotes("");
      toast({ title: "Redemption Submitted", description: "Your redemption request has been sent for review." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit redemption", variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const response = await apiRequest("PATCH", "/api/athlete/profile", {
        bio: data.bio || null,
        sport: data.sport || null,
        instagram: data.instagram || null,
        tiktok: data.tiktok || null,
        youtube: data.youtube || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/profile"] });
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch("/api/influencer/upload-avatar", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      queryClient.invalidateQueries({ queryKey: ["/api/influencer/profile"] });
      toast({ title: "Photo Updated", description: "Your profile photo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message || "Failed to upload photo", variant: "destructive" });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied!", description: "Code copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyTrackingLink = () => {
    if (!influencerData?.profile?.tracking_link) return;
    // Use /api/track/:slug which auto-increments clicks and redirects to home
    const link = `https://1strep.com/api/track/${influencerData.profile.tracking_link}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast({ title: "Link Copied!", description: "Tracking link copied to clipboard" });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      queryClient.clear();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !influencerData) {
    // useEffect above handles redirect to login if unauthenticated
    const isWrongAccount = authUser && ['admin', 'reseller', 'vendor'].includes(authUser.role);

    const handleLogout = async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      navigate("/influencer-login?redirect=/athlete/dashboard");
    };

    return (
      <div className="min-h-screen bg-background">
        <HeaderClean />
        <div className="container mx-auto py-20 text-center max-w-md">
          <Trophy className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Influencer Dashboard</h1>

          {isWrongAccount ? (
            <>
              <p className="text-muted-foreground mb-2">
                You're logged in as:
              </p>
              <p className="font-semibold mb-4">{authUser.email}</p>
              <p className="text-muted-foreground mb-6 text-sm">
                This account is a{authUser.role === 'admin' ? 'n' : ''} <strong>{authUser.role}</strong> account — not an influencer account.
                Please log out and sign in with the email address your influencer approval was sent to.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleLogout} data-testid="button-logout-wrong-account">
                  Log Out &amp; Switch Account
                </Button>
              </div>
            </>
          ) : authUser ? (
            <>
              <p className="text-muted-foreground mb-6">
                The account <strong>{authUser.email}</strong> doesn't have an active influencer profile yet.
                If you've been approved, try logging out and back in.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate("/athlete-program")} data-testid="button-apply-athlete">
                  Apply for Influencer Programme
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Log Out &amp; Switch Account
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </div>
      </div>
    );
  }

  const { profile, variants, transactions, redemptions, personalDiscountCode, personalDiscountUsed } = influencerData;

  if (!profile.onboarding_completed) {
    navigate("/athlete/onboarding");
    return null;
  }

  const tierColors: Record<string, string> = {
    bronze: "bg-amber-600",
    silver: "bg-gray-400",
    gold: "bg-yellow-500",
    elite: "bg-purple-600",
  };

  const creditBalance = parseFloat(profile.credit_balance || "0");
  const activeVariant = variants.find(v => v.is_active);
  const pendingRedemptions = redemptions.filter(r => r.status === "pending").length;

  const trackingUrl = profile.tracking_link ? `1strep.com/api/track/${profile.tracking_link}` : null;
  const trackingUrlFull = profile.tracking_link ? `https://1strep.com/api/track/${profile.tracking_link}` : null;

  return (
    <div className="min-h-screen bg-background">
      <HeaderClean />

      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold" data-testid="text-athlete-dashboard-title">
                Welcome back, {profile.first_name}!
              </h1>
              <Badge className={`${tierColors[profile.tier]} text-white`}>
                {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Influencer
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{profile.sport}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>

        {/* Garment Drop Eligibility Banner */}
        {profile.garment_drop_eligible && (
          <div
            className="flex items-center gap-3 p-4 rounded-md border"
            style={{ borderColor: GOLD, backgroundColor: `${GOLD}18` }}
            data-testid="banner-garment-drop"
          >
            <Package className="h-5 w-5 flex-shrink-0" style={{ color: GOLD }} />
            <div>
              <p className="font-semibold" style={{ color: GOLD }}>You're eligible for a Garment Drop!</p>
              <p className="text-sm text-muted-foreground">Our team will be in touch shortly to arrange your exclusive garment drop.</p>
            </div>
          </div>
        )}

        {/* Personal 50% First-Order Discount Banner */}
        {personalDiscountCode && (
          <div
            className="flex items-center justify-between gap-4 p-4 rounded-md border flex-wrap"
            style={{ borderColor: GOLD, backgroundColor: `${GOLD}12` }}
            data-testid="banner-personal-discount"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 flex-shrink-0" style={{ color: GOLD }} />
              <div>
                <p className="font-semibold" style={{ color: GOLD }}>
                  Your Personal 50% Influencer Discount
                </p>
                {personalDiscountUsed ? (
                  <p className="text-sm text-muted-foreground">You have already used your one-time first-order discount — enjoy!</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Use code <strong style={{ color: GOLD }}>{personalDiscountCode}</strong> at checkout for 50% off your first order. One-time use only.
                  </p>
                )}
              </div>
            </div>
            {!personalDiscountUsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyCode(personalDiscountCode)}
                data-testid="button-copy-personal-discount"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            )}
            {personalDiscountUsed && (
              <Badge variant="secondary" data-testid="badge-personal-discount-used">Used</Badge>
            )}
          </div>
        )}

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Credit Balance — Prominent */}
          <Card className="lg:col-span-1 border-0 text-white" style={{ background: `linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)` }} data-testid="card-credit-balance">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: "#a0a0a0" }}>Credit Balance</span>
                <PoundSterling className="h-4 w-4" style={{ color: GOLD }} />
              </div>
              <div className="text-4xl font-bold" style={{ color: GOLD }} data-testid="text-credit-balance">
                {Math.round(creditBalance)}
              </div>
              <p className="text-xs mt-1" style={{ color: GOLD, opacity: 0.7 }}>credits</p>
              <p className="text-xs mt-1" style={{ color: "#808080" }}>
                100 cr = £50 cash &nbsp;·&nbsp; 100 cr = £100 store credit
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#606060" }}>
                {pendingRedemptions > 0 ? `${pendingRedemptions} redemption${pendingRedemptions > 1 ? "s" : ""} pending` : "Available to redeem"}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-code">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Active Code</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {activeVariant ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="text-xl font-bold" data-testid="text-active-code">{activeVariant.full_code}</code>
                    <Button size="icon" variant="ghost" onClick={() => copyCode(activeVariant.full_code)} data-testid="button-copy-active-code">
                      {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeVariant.customer_discount_pct}% off for customers
                    {(activeVariant as any).fixed_credits_per_order > 0
                      ? ` · you earn ${(activeVariant as any).fixed_credits_per_order} credits per sale`
                      : activeVariant.influencer_credit_pct > 0
                      ? ` · you earn ${activeVariant.influencer_credit_pct}% per sale`
                      : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No active code</p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-sales-generated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Sales Generated</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{parseFloat(profile.total_sales_generated).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile.total_orders_generated} orders via your codes
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-link-clicks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Tracking Link Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.tracking_link_clicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {trackingUrl ? `/${profile.tracking_link}` : "No tracking link yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="credits" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="credits" data-testid="tab-credits">Credits</TabsTrigger>
            <TabsTrigger value="codes" data-testid="tab-codes">Discount Codes</TabsTrigger>
            <TabsTrigger value="tracking" data-testid="tab-tracking">Tracking Link</TabsTrigger>

            <TabsTrigger value="profile" data-testid="tab-profile">My Profile</TabsTrigger>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          </TabsList>

          {/* ===== CREDITS TAB ===== */}
          <TabsContent value="credits" className="space-y-6">
            {/* Redeem buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  type: "cash_drawdown",
                  label: "Cash Draw-down",
                  icon: PoundSterling,
                  desc: "Request cash — 100 credits = £50 paid to you",
                  highlight: true,
                },
                {
                  type: "store_credit",
                  label: "Store Credit",
                  icon: ShoppingBag,
                  desc: "Spend on 1stRep products — 100 credits = £100 store credit",
                  highlight: true,
                },
                {
                  type: "clothing_credit",
                  label: "Clothing Credit",
                  icon: Gift,
                  desc: "Exchanged for 1stRep garments (admin arranges)",
                  highlight: false,
                },
              ].map(({ type, label, icon: Icon, desc, highlight }) => (
                <Card
                  key={type}
                  className="hover-elevate cursor-pointer"
                  style={highlight ? { borderColor: `${GOLD}50` } : {}}
                  onClick={() => {
                    setRedemptionType(type);
                    setShowRedemptionDialog(true);
                  }}
                  data-testid={`card-redeem-${type}`}
                >
                  <CardContent className="pt-6">
                    <Icon className="h-8 w-8 mb-3" style={highlight ? { color: GOLD } : { color: "var(--muted-foreground)" }} />
                    <h3 className="font-semibold mb-1">{label}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: GOLD }}>
                      Redeem <ChevronRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transaction History */}
            <Card data-testid="card-transactions">
              <CardHeader>
                <CardTitle>Credit History</CardTitle>
                <CardDescription>All your credit transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No transactions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => {
                          const amount = parseFloat(tx.amount);
                          const isPositive = amount > 0;
                          return (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <Badge variant="secondary" className="whitespace-nowrap">
                                  {transactionTypeLabel(tx.type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                {tx.description}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(tx.created_at).toLocaleDateString("en-GB")}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                                  {isPositive ? "+" : ""}{Math.round(Math.abs(amount))} cr
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Redemption History */}
            {redemptions.length > 0 && (
              <Card data-testid="card-redemptions">
                <CardHeader>
                  <CardTitle>Redemption Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {redemptions.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{redemptionTypeLabel(r.type)}</TableCell>
                            <TableCell className="font-semibold">
                              {Math.round(parseFloat(r.credit_amount))} credits
                              <span className="text-muted-foreground font-normal text-xs ml-1">
                                ({redemptionValue(r.type, Math.round(parseFloat(r.credit_amount)))})
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === "fulfilled" ? "default" : r.status === "approved" ? "secondary" : "outline"}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(r.created_at).toLocaleDateString("en-GB")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== DISCOUNT CODES TAB ===== */}
          <TabsContent value="codes" className="space-y-6">

            {/* Personal 50% First-Order Section */}
            {personalDiscountCode && (
              <Card data-testid="card-personal-discount">
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                  <Tag className="h-5 w-5 flex-shrink-0" style={{ color: GOLD }} />
                  <div>
                    <CardTitle className="text-base">Your Personal Discount</CardTitle>
                    <p className="text-sm text-muted-foreground">Exclusive 50% off your first order — not for sharing</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {personalDiscountUsed ? (
                    <div className="flex items-center gap-3">
                      <code className="text-xl font-bold text-muted-foreground line-through">{personalDiscountCode}</code>
                      <Badge variant="secondary">Used</Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="text-xl font-bold" style={{ color: GOLD }}>{personalDiscountCode}</code>
                      <Button size="sm" variant="outline" onClick={() => copyCode(personalDiscountCode)} data-testid="button-copy-personal-discount-codes-tab">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Badge variant="secondary">First Order Only · One-Time Use</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold">Your Discount Code Variants</h2>
                <p className="text-sm text-muted-foreground">Switch between variants to offer different discounts to your audience</p>
              </div>
              <Button onClick={() => setShowVariantDialog(true)} data-testid="button-new-variant">
                <Plus className="h-4 w-4 mr-2" />
                New Variant
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variants.map((variant) => (
                <Card key={variant.id} className={variant.is_active ? "ring-2" : ""} style={variant.is_active ? { ringColor: GOLD } : {}} data-testid={`card-variant-${variant.full_code}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                      <code className="text-2xl font-bold" style={variant.is_active ? { color: GOLD } : {}}>{variant.full_code}</code>
                      {variant.is_active && (
                        <Badge className="text-white" style={{ backgroundColor: GOLD }}>Active</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      <p>{variant.customer_discount_pct}% off for customers</p>
                      {(variant as any).fixed_credits_per_order > 0
                        ? <p>You earn <strong style={{ color: GOLD }}>{(variant as any).fixed_credits_per_order} credits</strong> per sale</p>
                        : variant.influencer_credit_pct > 0
                        ? <p>You earn {variant.influencer_credit_pct}% per sale</p>
                        : null}
                      <p>{variant.use_count} total uses</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="icon" variant="ghost" onClick={() => copyCode(variant.full_code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {!variant.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateVariantMutation.mutate(variant.id)}
                          disabled={activateVariantMutation.isPending}
                          data-testid={`button-activate-${variant.full_code}`}
                        >
                          {activateVariantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                          Activate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {variants.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="py-12 text-center">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">No discount variants yet</p>
                    <Button onClick={() => setShowVariantDialog(true)}>Create Your First Variant</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">How Variants Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Only one variant can be active at a time — share your active code in posts with a message like <em>"Use code MYCODE for 10% off"</em>.</p>
                <p>• Every time a customer checks out using your code, you earn the agreed number of credits automatically — no need to request them.</p>
                <p>• Credits accumulate and can be drawn down as cash (50p per credit) or exchanged for store credit at full value.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TRACKING LINK TAB ===== */}
          <TabsContent value="tracking" className="space-y-6">
            <Card data-testid="card-tracking-link">
              <CardHeader>
                <CardTitle>Your Tracking Link</CardTitle>
                <CardDescription>Share this link to track referrals and clicks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {trackingUrl ? (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md flex-wrap">
                      <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <code className="text-sm flex-1 min-w-0 break-all" data-testid="text-tracking-url">{trackingUrl}</code>
                      <Button size="sm" variant="outline" onClick={copyTrackingLink} data-testid="button-copy-tracking-link">
                        {linkCopied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-1">Copy</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-3xl font-bold">{profile.tracking_link_clicks.toLocaleString()}</div>
                          <p className="text-sm text-muted-foreground">Total Clicks</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-3xl font-bold">{profile.total_orders_generated}</div>
                          <p className="text-sm text-muted-foreground">Orders Generated</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        Share this link on your social media. Every click is counted and when your followers use your discount code at checkout, you earn credits automatically.
                      </p>
                    </div>

                    <Button variant="outline" className="w-full" onClick={copyTrackingLink}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Tracking Link
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No tracking link assigned yet. Contact your 1stRep account manager.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* ===== MY PROFILE TAB ===== */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Avatar card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                  <CardDescription>This photo appears on the 1stRep influencer page</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {(avatarPreview || profile.profile_image_url) ? (
                      <img
                        src={avatarPreview || profile.profile_image_url!}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover object-top border-2 border-border"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <UserCircle2 className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {avatarUploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">JPEG, PNG or WebP · max 5MB</p>
                </CardContent>
              </Card>

              {/* Profile details card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>Update your bio, sport, and social handles — these show on your public influencer card</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pf-sport">Sport / Discipline</Label>
                      <Input
                        id="pf-sport"
                        value={profileForm.sport}
                        onChange={e => setProfileForm(p => ({ ...p, sport: e.target.value }))}
                        placeholder="e.g. CrossFit, Running, Weightlifting"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      {/* spacer */}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pf-bio">Bio</Label>
                    <Textarea
                      id="pf-bio"
                      value={profileForm.bio}
                      onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder="A short description about yourself shown on the influencer page..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pf-instagram" className="flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
                      </Label>
                      <Input
                        id="pf-instagram"
                        value={profileForm.instagram}
                        onChange={e => setProfileForm(p => ({ ...p, instagram: e.target.value }))}
                        placeholder="@handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-tiktok" className="flex items-center gap-1.5">
                        <SiTiktok className="w-3.5 h-3.5" /> TikTok
                      </Label>
                      <Input
                        id="pf-tiktok"
                        value={profileForm.tiktok}
                        onChange={e => setProfileForm(p => ({ ...p, tiktok: e.target.value }))}
                        placeholder="@handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-youtube" className="flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube
                      </Label>
                      <Input
                        id="pf-youtube"
                        value={profileForm.youtube}
                        onChange={e => setProfileForm(p => ({ ...p, youtube: e.target.value }))}
                        placeholder="@channel"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => updateProfileMutation.mutate(profileForm)}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visibility note */}
            {!profile.is_featured && (
              <Card className="border-dashed">
                <CardContent className="py-4 flex items-start gap-3">
                  <Star className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Not yet featured publicly</p>
                    <p className="text-sm text-muted-foreground">Your profile is set up but not yet shown on the public /athletes page. The 1stRep team will feature you once your profile is complete.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/shop-clean")} data-testid="button-shop">
                    <ShoppingBag className="h-4 w-4 mr-2" />Shop with Your Discount
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={copyTrackingLink} data-testid="button-share-link">
                    <Share2 className="h-4 w-4 mr-2" />Share Tracking Link
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => { setShowRedemptionDialog(true); }} data-testid="button-redeem">
                    <Gift className="h-4 w-4 mr-2" />Redeem Credits
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.instagram && (
                    <div className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-pink-500" />
                      <span>{profile.instagram}</span>
                    </div>
                  )}
                  {profile.tiktok && (
                    <div className="flex items-center gap-3">
                      <SiTiktok className="h-5 w-5" />
                      <span>{profile.tiktok}</span>
                    </div>
                  )}
                  {profile.youtube && (
                    <div className="flex items-center gap-3">
                      <Youtube className="h-5 w-5 text-red-500" />
                      <span>{profile.youtube}</span>
                    </div>
                  )}
                  {!profile.instagram && !profile.tiktok && !profile.youtube && (
                    <p className="text-muted-foreground">No social accounts linked</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>


      {/* Variant Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Discount Code</DialogTitle>
            <DialogDescription>
              Set the discount your followers get and how many credits you earn per sale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code Suffix</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">{profile.tracking_link || "CODE"}</span>
                <Input
                  placeholder="e.g. 10"
                  value={variantForm.codeSuffix}
                  onChange={(e) => setVariantForm(p => ({ ...p, codeSuffix: e.target.value.toUpperCase() }))}
                  data-testid="input-variant-suffix"
                  className="max-w-[100px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Full code: <strong>{profile.tracking_link || "CODE"}{variantForm.codeSuffix || "???"}</strong> — share this in your posts
              </p>
            </div>
            <div className="space-y-2">
              <Label>Customer Discount %</Label>
              <Input
                type="number" min={1} max={50} placeholder="e.g. 10"
                value={variantForm.customerDiscountPct}
                onChange={(e) => setVariantForm(p => ({ ...p, customerDiscountPct: e.target.value }))}
                data-testid="input-customer-pct"
              />
              <p className="text-xs text-muted-foreground">e.g. 10 = "use code X for 10% off"</p>
            </div>
            <div className="space-y-2">
              <Label>Your Credits Per Sale (fixed)</Label>
              <Input
                type="number" min={0} max={parseInt(variantForm.customerDiscountPct) || undefined} placeholder="e.g. 10"
                value={variantForm.fixedCreditsPerOrder}
                onChange={(e) => setVariantForm(p => ({ ...p, fixedCreditsPerOrder: e.target.value }))}
                data-testid="input-credits-per-order"
              />
              <p className={`text-xs ${creditsExceedCap ? "text-destructive" : "text-muted-foreground"}`}>
                {creditsExceedCap
                  ? `Can't exceed your discount % — max ${variantForm.customerDiscountPct} for a ${variantForm.customerDiscountPct}% discount`
                  : `Flat credits you earn each time someone uses this code. Capped at your discount % (max ${variantForm.customerDiscountPct || "?"} here) so credits never cost more than the discount. 100 credits = £50 cash or £100 store credit.`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVariantDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createVariantMutation.mutate(variantForm)}
              disabled={!variantForm.codeSuffix || !variantForm.customerDiscountPct || creditsExceedCap || createVariantMutation.isPending}
              data-testid="button-create-variant"
            >
              {createVariantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemption Dialog */}
      <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Credits</DialogTitle>
            <DialogDescription>
              Balance: <strong style={{ color: GOLD }}>{Math.round(creditBalance)} credits</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Redemption Type</Label>
              <Select value={redemptionType} onValueChange={setRedemptionType}>
                <SelectTrigger data-testid="select-redemption-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_drawdown">💰 Cash Draw-down (100 credits = £50)</SelectItem>
                  <SelectItem value="store_credit">🛍️ Store Credit (100 credits = £100)</SelectItem>
                  <SelectItem value="clothing_credit">👕 Clothing Credit (admin arranges)</SelectItem>
                </SelectContent>
              </Select>
              {redemptionType === "cash_drawdown" && (
                <p className="text-xs text-muted-foreground p-2 rounded bg-muted">Cash draw-down is paid at 50% of credit value — 100 credits = £50.</p>
              )}
              {redemptionType === "store_credit" && (
                <p className="text-xs text-muted-foreground p-2 rounded bg-muted">Store credit is applied at full value — 100 credits = £100 to spend on 1stRep products.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Credits to redeem <span className="text-muted-foreground font-normal">(multiples of 50)</span></Label>
              <Input
                type="number"
                min={50}
                max={Math.floor(creditBalance / 50) * 50}
                step={50}
                placeholder="50"
                value={redemptionAmount}
                onChange={(e) => setRedemptionAmount(e.target.value)}
                data-testid="input-redemption-amount"
              />
              {redemptionAmount && parseFloat(redemptionAmount) >= 50 && parseFloat(redemptionAmount) % 50 === 0 && redemptionType && (
                <p className="text-sm font-semibold" style={{ color: GOLD }}>
                  = {redemptionValue(redemptionType, parseFloat(redemptionAmount))}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Any specific requests or details..." value={redemptionNotes} onChange={(e) => setRedemptionNotes(e.target.value)} data-testid="input-redemption-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRedemptionDialog(false)}>Cancel</Button>
            <Button
              onClick={() => submitRedemptionMutation.mutate()}
              disabled={!redemptionType || !redemptionAmount || parseFloat(redemptionAmount) < 50 || parseFloat(redemptionAmount) % 50 !== 0 || parseFloat(redemptionAmount) > creditBalance || submitRedemptionMutation.isPending}
              data-testid="button-submit-redemption"
            >
              {submitRedemptionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
