import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { 
  PoundSterling,
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowUpRight,
  TrendingUp,
  History,
  AlertCircle,
  Loader2,
  CreditCard,
  Building,
  Info,
  Store,
  Send,
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
  Key,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
} from "lucide-react";

interface EarningsPanelProps {
  resellerId: string;
}

export default function EarningsPanel({ resellerId }: EarningsPanelProps) {
  const [ownStripeDialogOpen, setOwnStripeDialogOpen] = useState(false);
  const [ownStripePk, setOwnStripePk] = useState("");
  const [ownStripeSk, setOwnStripeSk] = useState("");
  const [showSk, setShowSk] = useState(false);

  // EPOS Bank Account state (simple direct bank transfer)
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankAccName, setBankAccName] = useState("");
  const [bankAccSortCode, setBankAccSortCode] = useState("");
  const [bankAccNumber, setBankAccNumber] = useState("");
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankSortCode, setBankSortCode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [resellerNotes, setResellerNotes] = useState("");
  
  // Date range filter state - default to all time (undefined)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Stripe Connect status
  interface StripeConnectStatus {
    stripeAccountId: string | null;
    onboardingStatus: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    accountEmail: string | null;
  }

  const { data: stripeStatus, isLoading: stripeStatusLoading, refetch: refetchStripeStatus } = useQuery<StripeConnectStatus>({
    queryKey: ["/api/reseller/stripe-connect/status"],
    enabled: !!resellerId,
  });

  const createStripeAccountMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/reseller/stripe-connect/create-account", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/stripe-connect/status"] });
    },
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
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: (error: any) => {
      if (error.accountReset) {
        // Server cleared the stale test account — refresh status so UI shows "Connect Stripe"
        queryClient.invalidateQueries({ queryKey: ["/api/reseller/stripe-connect/status"] });
        toast({
          title: "Please reconnect your Stripe account",
          description: "Your previous Stripe connection needs to be reset. Click 'Connect Stripe' to set up your live account.",
        });
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
    onError: (error: any) => {
      toast({ title: "Failed to refresh status", description: error.message, variant: "destructive" });
    },
  });

  const getStripeDashboardLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reseller/stripe-connect/dashboard-link", {});
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: (error: any) => {
      toast({ title: "Failed to get dashboard link", description: error.message, variant: "destructive" });
    },
  });

  // Parse raw API error messages (e.g. "500: {"error":"..."}" → just the error string)
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

  const handleConnectStripe = async () => {
    if (!stripeStatus?.stripeAccountId) {
      try {
        await createStripeAccountMutation.mutateAsync();
      } catch (error: any) {
        const msg = parseStripeError(error);
        toast({
          title: "Stripe Connect not available",
          description: msg,
          variant: "destructive",
        });
        return;
      }
    }
    getOnboardingLinkMutation.mutate();
  };

  // Own Stripe (BYOS) status + mutations
  interface OwnStripeStatus {
    isSetup: boolean;
    publishableKey: string | null;
    setupAt: string | null;
  }
  const { data: ownStripeStatus, refetch: refetchOwnStripe } = useQuery<OwnStripeStatus>({
    queryKey: ["/api/reseller/own-stripe/status"],
    enabled: !!resellerId,
  });

  // EPOS bank account status
  interface EposBankStatus {
    isSetup: boolean;
    accountName: string | null;
    sortCode: string | null;
    accountNumber: string | null;
  }
  const { data: eposBankStatus, refetch: refetchEposBank } = useQuery<EposBankStatus>({
    queryKey: ["/api/reseller/epos-bank/status"],
    enabled: !!resellerId,
  });

  // Square OAuth status
  interface OwnSquareStatus { isSetup: boolean; locationId: string | null; setupAt: string | null; }
  const { data: ownSquareStatus, refetch: refetchOwnSquare } = useQuery<OwnSquareStatus>({
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

  const setupBankMutation = useMutation({
    mutationFn: async ({ accountName, sortCode, accountNumber }: { accountName: string; sortCode: string; accountNumber: string }) => {
      const res = await apiRequest("POST", "/api/reseller/epos-bank/setup", { accountName, sortCode, accountNumber });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/epos-bank/status"] });
      setBankDialogOpen(false);
      setBankAccName(""); setBankAccSortCode(""); setBankAccNumber("");
      toast({ title: "Bank account saved!", description: "Customers can now pay directly into your account via EPOS." });
    },
    onError: (error: any) => {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    },
  });

  const removeBankMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/reseller/epos-bank/remove", {});
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/epos-bank/status"] });
      toast({ title: "Bank account removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove bank account", variant: "destructive" });
    },
  });

  const setupOwnStripeMutation = useMutation({
    mutationFn: async ({ publishableKey, secretKey }: { publishableKey: string; secretKey: string }) => {
      const res = await apiRequest("POST", "/api/reseller/own-stripe/setup", { publishableKey, secretKey });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      return data as { accountName: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/own-stripe/status"] });
      setOwnStripeDialogOpen(false);
      setOwnStripePk(""); setOwnStripeSk("");
      toast({ title: "Stripe account connected!", description: data.accountName ? `Account: ${data.accountName}` : "Customers can now pay directly into your account via EPOS." });
    },
    onError: (error: any) => {
      toast({ title: "Connection failed", description: error.message, variant: "destructive" });
    },
  });

  const removeOwnStripeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/reseller/own-stripe/remove", {});
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/own-stripe/status"] });
      toast({ title: "Stripe account disconnected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disconnect Stripe account", variant: "destructive" });
    },
  });

  const { data: siteSettings } = useQuery<{ minimumPayoutAmount?: string }>({
    queryKey: ["/api/site-settings"],
  });

  interface EarningsBalance {
    totalEarned: number;
    totalPaidOut: number;
    pendingPayout: number;
    availableBalance: number;
    catalogueCommission: number;
    ownProductsRevenue: number;
  }

  interface EarningsData {
    balance: EarningsBalance;
    payoutRequests: any[];
    recentEarnings: any[];
  }

  interface PayoutRequest {
    id: string;
    requestNumber: string;
    amount: string;
    status: string;
    payoutMethod: string;
    createdAt: string;
    adminNotes?: string;
  }

  const { data: earningsData, isLoading: earningsLoading } = useQuery<EarningsData>({
    queryKey: ["/api/reseller/earnings", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      const response = await fetch(`/api/reseller/earnings?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch earnings');
      return response.json();
    },
    enabled: !!resellerId,
  });

  const { data: payoutRequests = [], isLoading: payoutsLoading } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/reseller/payouts"],
    enabled: !!resellerId,
  });


  const requestPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/reseller/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit payout request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/payouts"] });
      toast({
        title: "Payout Request Submitted",
        description: "Your payout request has been submitted for review.",
      });
      setPayoutDialogOpen(false);
      resetPayoutForm();
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit payout request",
        variant: "destructive",
      });
    },
  });

  const cancelPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await fetch(`/api/reseller/payouts/${payoutId}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel payout request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/payouts"] });
      toast({
        title: "Payout Cancelled",
        description: "Your payout request has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel payout request",
        variant: "destructive",
      });
    },
  });

  const resetPayoutForm = () => {
    setPayoutAmount("");
    setPayoutMethod("bank_transfer");
    setBankAccountName("");
    setBankAccountNumber("");
    setBankSortCode("");
    setPaypalEmail("");
    setResellerNotes("");
  };

  const handleSubmitPayoutRequest = () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payout amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount < minimumPayout) {
      toast({
        title: "Minimum Not Reached",
        description: `Minimum payout amount is £${minimumPayout}.`,
        variant: "destructive",
      });
      return;
    }

    if (amount > balance.availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You can only request up to £${balance.availableBalance.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }

    const requestData: any = {
      amount: amount.toFixed(2),
      payoutMethod,
      resellerNotes,
    };

    if (payoutMethod === "bank_transfer") {
      if (!bankAccountName || !bankAccountNumber || !bankSortCode) {
        toast({
          title: "Missing Details",
          description: "Please fill in all bank account details.",
          variant: "destructive",
        });
        return;
      }
      requestData.bankAccountName = bankAccountName;
      requestData.bankAccountNumber = bankAccountNumber;
      requestData.bankSortCode = bankSortCode;
    } else if (payoutMethod === "paypal") {
      if (!paypalEmail) {
        toast({
          title: "Missing Details",
          description: "Please enter your PayPal email address.",
          variant: "destructive",
        });
        return;
      }
      requestData.paypalEmail = paypalEmail;
    }

    requestPayoutMutation.mutate(requestData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "processing":
        return <Badge className="bg-purple-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "paid":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "cancelled":
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const balance = earningsData?.balance || { 
    totalEarned: 0, 
    totalPaidOut: 0, 
    pendingPayout: 0, 
    availableBalance: 0,
    catalogueCommission: 0,
    ownProductsRevenue: 0
  };
  const recentEarnings = earningsData?.recentEarnings || [];
  const minimumPayout = parseFloat(siteSettings?.minimumPayoutAmount || '50');
  const canRequestPayout = balance.availableBalance >= minimumPayout;
  const hasOwnProductsSales = balance.ownProductsRevenue > 0;

  if (earningsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading earnings data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">




      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Earnings & Payouts</h2>
          <p className="text-muted-foreground">Track your commission earnings and request payouts</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
          <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="min-h-11 w-full sm:w-auto" 
              disabled={!canRequestPayout}
              data-testid="button-request-payout"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Commission Payout</DialogTitle>
              <DialogDescription>
                Submit a request to withdraw your available earnings. Minimum payout is £{minimumPayout}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="text-xl font-bold text-green-600" data-testid="available-balance">
                    £{balance.availableBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Payout Amount (£)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={minimumPayout}
                  max={balance.availableBalance}
                  placeholder="Enter amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  data-testid="input-payout-amount"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: £{minimumPayout} | Maximum: £{balance.availableBalance.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger data-testid="select-payout-method">
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Bank Transfer (UK)
                      </div>
                    </SelectItem>
                    <SelectItem value="paypal">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        PayPal
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {payoutMethod === "bank_transfer" && (
                <div className="space-y-4 border rounded-lg p-4">
                  <h4 className="font-medium text-sm">Bank Account Details</h4>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="Account holder name"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      data-testid="input-bank-account-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sortCode">Sort Code</Label>
                      <Input
                        id="sortCode"
                        placeholder="XX-XX-XX"
                        value={bankSortCode}
                        onChange={(e) => setBankSortCode(e.target.value)}
                        data-testid="input-sort-code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        placeholder="8-digit number"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        data-testid="input-account-number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {payoutMethod === "paypal" && (
                <div className="space-y-2 border rounded-lg p-4">
                  <Label htmlFor="paypalEmail">PayPal Email</Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    placeholder="your@paypal.email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    data-testid="input-paypal-email"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes"
                  value={resellerNotes}
                  onChange={(e) => setResellerNotes(e.target.value)}
                  className="resize-none"
                  data-testid="textarea-payout-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitPayoutRequest}
                disabled={requestPayoutMutation.isPending}
                data-testid="button-submit-payout"
              >
                {requestPayoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Info box about own products revenue */}
      {hasOwnProductsSales && (
        <Card className="p-4 border-blue-500/50 bg-blue-500/10">
          <div className="flex items-start gap-3">
            <Store className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-600">Your Own Products Revenue: £{balance.ownProductsRevenue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                This amount was received directly via EPOS (cash/card) when you sold your own products. 
                It is not included in the payout balance below as you already have this money.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Catalogue Commission</p>
              <p className="text-2xl font-bold" data-testid="total-earnings">
                £{balance.totalEarned.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">From 1stRep product sales</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-green-600" data-testid="available-balance-card">
                £{balance.availableBalance.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ready to request</p>
            </div>
            <Wallet className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Payouts</p>
              <p className="text-2xl font-bold text-yellow-600" data-testid="pending-payouts">
                £{balance.pendingPayout.toFixed(2)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid Out</p>
              <p className="text-2xl font-bold" data-testid="total-paid">
                £{balance.totalPaidOut.toFixed(2)}
              </p>
            </div>
            <PoundSterling className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* How Payouts Work */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">How Payouts Work</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">1</div>
            <div>
              <p className="font-medium text-sm">Request your payout</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click "Request Payout" above, enter the amount, and provide your bank or PayPal details.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">2</div>
            <div>
              <p className="font-medium text-sm">Admin reviews & approves</p>
              <p className="text-xs text-muted-foreground mt-0.5">The 1stRep team will review your request and approve it — usually within 1–2 business days.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">3</div>
            <div>
              <p className="font-medium text-sm">Payment sent to you</p>
              <p className="text-xs text-muted-foreground mt-0.5">Once approved, the admin sends payment directly to your bank account or PayPal. You'll be notified when it's on its way.</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded-md flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Minimum payout is £{minimumPayout}. Payouts are processed via bank transfer or PayPal. Make sure your payment details are correct when submitting your request.
          </p>
        </div>
      </Card>

      {!canRequestPayout && balance.availableBalance > 0 && (
        <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-600">Minimum Payout Not Reached</p>
              <p className="text-sm text-muted-foreground">
                You need at least £{minimumPayout} to request a payout. 
                Current balance: £{balance.availableBalance.toFixed(2)} (£{(minimumPayout - balance.availableBalance).toFixed(2)} more needed)
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Recent Earnings</h3>
          </div>
          {recentEarnings.length === 0 ? (
            <div className="text-center py-8">
              <PoundSterling className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No earnings yet</p>
              <p className="text-sm text-muted-foreground">Earnings from completed orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEarnings.map((earning: any) => (
                <div key={earning.orderId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{earning.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(earning.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-medium text-green-600">
                    +£{parseFloat(earning.amount || "0").toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Payout History</h3>
          </div>
          {payoutsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payoutRequests.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payout requests yet</p>
              <p className="text-sm text-muted-foreground">Your payout history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payoutRequests.slice(0, 5).map((payout: any) => (
                <div key={payout.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{payout.requestNumber}</p>
                      {getStatusBadge(payout.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payout.createdAt).toLocaleDateString()} • {payout.payoutMethod.replace("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">£{parseFloat(payout.amount).toFixed(2)}</span>
                    {payout.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-6 text-xs"
                        onClick={() => cancelPayoutMutation.mutate(payout.id)}
                        disabled={cancelPayoutMutation.isPending}
                        data-testid={`button-cancel-payout-${payout.id}`}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
