import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  CreditCard,
  Store,
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
  Trash2,
  ShieldCheck,
  CheckCircle,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  UserPlus,
  LogIn,
  Smartphone,
  Zap,
  Package,
} from "lucide-react";

interface EposPaymentSetupProps {
  resellerId: string;
}

const GUIDE_STEPS = [
  {
    icon: UserPlus,
    title: "Create a free Square account (skip if you already have one)",
    detail: "Go to squareup.com and sign up for free. No monthly fee — Square only charges 1.75% per transaction. Use your business email and enter your bank account so payouts land automatically.",
    tag: "5 min",
  },
  {
    icon: LogIn,
    title: "Click Connect with Square below",
    detail: "This opens the Square authorisation page. Make sure you're already logged in to Square in the same browser, or log in when prompted. Do not close the window.",
    tag: "1 click",
  },
  {
    icon: ShieldCheck,
    title: "Authorise 1stRep on the Square screen",
    detail: "Square will ask you to allow 1stRep to process payments on your behalf. Click Allow. This only grants payment permissions — we cannot access your personal details or move money without a customer transaction.",
    tag: "1 click",
  },
  {
    icon: Zap,
    title: "You're redirected back — connection confirmed",
    detail: "After authorising, you'll land back on the Settings tab with a green Connected badge and a success notification. Your Square account and location are linked automatically — no location IDs or tokens to copy.",
    tag: "Automatic",
  },
  {
    icon: Package,
    title: "Add your own products to the EPOS",
    detail: "Go to My Products → add your items with prices. Only your own products trigger payment to your Square account. Platform catalogue products still route through the platform's account.",
    tag: "Important",
  },
  {
    icon: Smartphone,
    title: "Test it at the EPOS",
    detail: "Open the EPOS, add one of your own products to the cart, and tap Pay with Square. A QR code appears — scan it with a phone to complete a real payment. The money lands in your Square account within 1-2 business days.",
    tag: "Optional test",
  },
];

export default function EposPaymentSetup({ resellerId }: EposPaymentSetupProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [guideOpen, setGuideOpen] = useState(false);

  // Square OAuth status
  interface OwnSquareStatus { isSetup: boolean; locationId: string | null; setupAt: string | null; }
  const { data: ownSquareStatus } = useQuery<OwnSquareStatus>({
    queryKey: ["/api/reseller/own-square/status"],
    enabled: !!resellerId,
  });
  const removeOwnSquareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/reseller/own-square/remove", {});
      if (!res.ok) throw new Error("Failed to disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/own-square/status"] });
      toast({ title: "Square disconnected" });
    },
    onError: () => toast({ title: "Error", description: "Could not disconnect Square", variant: "destructive" }),
  });

  // Stripe Connect status + mutations
  interface StripeConnectStatus {
    stripeAccountId: string | null;
    onboardingStatus: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    accountEmail: string | null;
  }
  const { data: stripeStatus, isLoading: stripeStatusLoading } = useQuery<StripeConnectStatus>({
    queryKey: ["/api/reseller/stripe-connect/status"],
    enabled: !!resellerId,
  });

  const parseStripeError = (error: any): string => {
    const raw: string = error?.message || "An unexpected error occurred.";
    try {
      const jsonStart = raw.indexOf("{");
      if (jsonStart !== -1) {
        const parsed = JSON.parse(raw.slice(jsonStart));
        return parsed.error || raw;
      }
    } catch {}
    return raw;
  };

  const createStripeAccountMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/reseller/stripe-connect/create-account", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/reseller/stripe-connect/status"] }),
  });

  const getOnboardingLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reseller/stripe-connect/onboarding-link", {});
      const data = await res.json();
      if (!res.ok) {
        const err: any = new Error(data.error || "Failed to get onboarding link");
        err.accountReset = !!data.accountReset;
        throw err;
      }
      return data as { url: string };
    },
    onSuccess: (data) => window.open(data.url, "_blank", "noopener,noreferrer"),
    onError: (error: any) => {
      if (error.accountReset) {
        queryClient.invalidateQueries({ queryKey: ["/api/reseller/stripe-connect/status"] });
        toast({ title: "Please reconnect your Stripe account", description: "Your previous Stripe connection needs to be reset. Click 'Connect Stripe' to set up your live account." });
      } else {
        toast({ title: "Failed to get onboarding link", description: parseStripeError(error), variant: "destructive" });
      }
    },
  });

  const refreshStripeStatusMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/reseller/stripe-connect/refresh-status", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/stripe-connect/status"] });
      toast({ title: "Status updated", description: "Your Stripe account status has been refreshed." });
    },
    onError: (error: any) => toast({ title: "Failed to refresh status", description: error.message, variant: "destructive" }),
  });

  const getStripeDashboardLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reseller/stripe-connect/dashboard-link", {});
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => window.open(data.url, "_blank", "noopener,noreferrer"),
    onError: (error: any) => toast({ title: "Failed to get dashboard link", description: error.message, variant: "destructive" }),
  });

  const handleConnectStripe = async () => {
    if (!stripeStatus?.stripeAccountId) {
      try {
        await createStripeAccountMutation.mutateAsync();
      } catch (error: any) {
        toast({ title: "Stripe Connect not available", description: parseStripeError(error), variant: "destructive" });
        return;
      }
    }
    getOnboardingLinkMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Store className="h-5 w-5" />
          EPOS Payment Setup
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect a payment method so customers can pay at your EPOS terminal. Money goes directly to your account.
        </p>
      </div>

      <Separator />

      {/* Square Connect Card */}
      <Card className={`border-2 ${ownSquareStatus?.isSetup ? 'border-green-500 bg-green-950/40' : 'border-slate-500 bg-slate-800'}`}>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${ownSquareStatus?.isSetup ? 'bg-green-500/20' : 'bg-slate-500/20'}`}>
                <Store className={`w-8 h-8 ${ownSquareStatus?.isSetup ? 'text-green-400' : 'text-slate-300'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Square — EPOS Card Payments</h3>
                  {ownSquareStatus?.isSetup ? (
                    <Badge className="bg-green-600 text-white"><ShieldCheck className="h-3 w-3 mr-1" />Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not Connected</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {ownSquareStatus?.isSetup
                    ? "Your Square account is connected. Customers pay by card, Apple Pay, or Google Pay — money goes directly into your Square account and then your bank."
                    : "Connect your free Square account so customers can pay by card, Apple Pay, or Google Pay at your EPOS. Payment is auto-confirmed — no customer button tapping needed. 1.75% per transaction, no monthly fee."}
                </p>
                {ownSquareStatus?.isSetup && ownSquareStatus.setupAt && (
                  <p className="text-xs text-muted-foreground mt-1">Connected {new Date(ownSquareStatus.setupAt).toLocaleDateString("en-GB")}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!ownSquareStatus?.isSetup ? (
                <Button
                  className="bg-slate-100 hover:bg-white text-slate-900 font-semibold gap-2"
                  onClick={() => { window.location.href = '/api/reseller/own-square/oauth/start'; }}
                >
                  <Store className="h-4 w-4" />Connect with Square
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={() => removeOwnSquareMutation.mutate()}
                  disabled={removeOwnSquareMutation.isPending}
                >
                  {removeOwnSquareMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {/* How to Connect Guide — collapsible */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors w-full text-left"
              onClick={() => setGuideOpen(o => !o)}
            >
              <Info className="h-4 w-4 flex-shrink-0 text-blue-400" />
              <span className="font-medium">How to connect your Square account</span>
              {guideOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </button>

            {guideOpen && (
              <div className="mt-4 space-y-3">
                {GUIDE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const tagColors: Record<string, string> = {
                    "5 min":         "bg-blue-500/20 text-blue-300",
                    "1 click":       "bg-slate-500/20 text-slate-300",
                    "Automatic":     "bg-green-500/20 text-green-300",
                    "Important":     "bg-amber-500/20 text-amber-300",
                    "Optional test": "bg-purple-500/20 text-purple-300",
                  };
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-100">{step.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tagColors[step.tag] || 'bg-slate-600 text-slate-300'}`}>
                            {step.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                  <p className="font-semibold">⚠️ Important — when does payment go to YOUR account?</p>
                  <p>Payment only routes to your Square account when <strong>all items in the cart are your own products</strong> (added under "My Products"). If the cart includes any platform catalogue items, Square routes to the platform account instead.</p>
                </div>

                <div className="mt-2 p-3 rounded-lg bg-slate-700/50 text-xs text-slate-300 space-y-1">
                  <p className="font-semibold">💰 Fees &amp; payouts</p>
                  <p>Square charges <strong>1.75% per in-person transaction</strong> (UK). No monthly fee. Payouts arrive in your linked bank account within <strong>1–2 business days</strong>. You can view all transactions inside your Square Dashboard.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stripe Connect Card */}
      <Card className={`border-2 ${stripeStatus?.chargesEnabled ? 'border-green-500 bg-green-950/40' : 'border-violet-500 bg-violet-950/40'}`}>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${stripeStatus?.chargesEnabled ? 'bg-green-500/20' : 'bg-violet-500/20'}`}>
                <CreditCard className={`w-8 h-8 ${stripeStatus?.chargesEnabled ? 'text-green-400' : 'text-violet-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">Stripe Connect</h3>
                  {stripeStatus?.chargesEnabled && <Badge className="bg-green-600 text-white">Active</Badge>}
                  {stripeStatus?.stripeAccountId && !stripeStatus?.chargesEnabled && <Badge variant="secondary">Pending Verification</Badge>}
                  {!stripeStatus?.stripeAccountId && !stripeStatusLoading && <Badge variant="outline">Not Connected</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stripeStatus?.chargesEnabled
                    ? `Connected${stripeStatus.accountEmail ? ` · ${stripeStatus.accountEmail}` : ''} — customers can pay directly into your account via card`
                    : stripeStatus?.stripeAccountId
                    ? "Complete your Stripe onboarding to enable direct card payments on your EPOS."
                    : "Connect your Stripe account to accept direct card payments from customers via EPOS."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {stripeStatusLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              {!stripeStatusLoading && !stripeStatus?.stripeAccountId && (
                <Button onClick={handleConnectStripe} disabled={createStripeAccountMutation.isPending || getOnboardingLinkMutation.isPending}>
                  {(createStripeAccountMutation.isPending || getOnboardingLinkMutation.isPending)
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                    : <><LinkIcon className="h-4 w-4 mr-2" />Connect Stripe</>}
                </Button>
              )}
              {!stripeStatusLoading && stripeStatus?.stripeAccountId && !stripeStatus?.chargesEnabled && (
                <Button onClick={() => getOnboardingLinkMutation.mutate()} disabled={getOnboardingLinkMutation.isPending}>
                  {getOnboardingLinkMutation.isPending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                    : <><ExternalLink className="h-4 w-4 mr-2" />Complete Onboarding</>}
                </Button>
              )}
              {!stripeStatusLoading && stripeStatus?.stripeAccountId && (
                <Button variant="outline" onClick={() => refreshStripeStatusMutation.mutate()} disabled={refreshStripeStatusMutation.isPending}>
                  {refreshStripeStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              )}
              {!stripeStatusLoading && stripeStatus?.chargesEnabled && (
                <Button variant="outline" onClick={() => getStripeDashboardLinkMutation.mutate()} disabled={getStripeDashboardLinkMutation.isPending}>
                  {getStripeDashboardLinkMutation.isPending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                    : <><ExternalLink className="h-4 w-4 mr-2" />Stripe Dashboard</>}
                </Button>
              )}
            </div>
          </div>
          {stripeStatus?.stripeAccountId && (
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                {stripeStatus.chargesEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-yellow-500" />}
                <span className="text-muted-foreground">{stripeStatus.chargesEnabled ? "Payments Enabled" : "Payments Pending"}</span>
              </div>
              <div className="flex items-center gap-2">
                {stripeStatus.payoutsEnabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-yellow-500" />}
                <span className="text-muted-foreground">{stripeStatus.payoutsEnabled ? "Payouts Enabled" : "Payouts Pending"}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
