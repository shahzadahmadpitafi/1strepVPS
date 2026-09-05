import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { SiStripe } from "react-icons/si";
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  DollarSign,
  AlertTriangle,
  Eye,
  CreditCard,
  Building,
  Zap,
  Plus,
  Send,
  User,
  Store,
  Download,
  Search,
  RefreshCw,
  X,
  Check,
  TrendingUp,
  Package,
  BarChart3,
  ArrowUpRight,
  BadgeDollarSign,
  Copy,
  ExternalLink,
  TrendingDown
} from "lucide-react";

interface PayoutRequest {
  id: string;
  resellerId: string;
  vendorId?: string;
  recipientType?: string;
  requestType?: string;
  requestNumber: string;
  amount: string;
  status: string;
  payoutMethod: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankSortCode?: string;
  paypalEmail?: string;
  stripeAccountId?: string;
  stripeTransferId?: string;
  transferError?: string;
  adminNotes?: string;
  resellerNotes?: string;
  payoutReason?: string;
  isAdjustment?: boolean;
  processedBy?: string;
  initiatedByAdminId?: string;
  createdAt: string;
  reviewedAt?: string;
  processedAt?: string;
  paidAt?: string;
  transactionReference?: string;
  resellerName?: string;
  resellerEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  availableBalance?: number;
  resellerStripeConnected?: boolean;
  resellerStripeAccountId?: string;
  recipientStripeConnected?: boolean;
  recipientStripeAccountId?: string;
}

interface PayoutRecipient {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  stripeAccountId: string | null;
  stripeOnboardingStatus: string | null;
  stripeChargesEnabled: boolean | null;
  totalEarned: number;
  totalPaidOut: number;
  pendingPayout: number;
  availableBalance: number;
  catalogueCommission: number;
  ownProductsRevenue: number;
}

interface RecipientsData {
  resellers: PayoutRecipient[];
  vendors: PayoutRecipient[];
}

interface CommissionOverview {
  summary: {
    pendingCount: number;
    pendingAmount: string;
    approvedCount: number;
    approvedAmount: string;
    paidCount: number;
    paidAmount: string;
  };
  recentPayouts: PayoutRequest[];
}

interface PayoutAuditLog {
  id: string;
  payoutId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  performedBy?: string;
  performedByName?: string;
  performedByRole?: string;
  notes?: string;
  metadata?: string;
  createdAt: string;
}

export default function AdminPayouts() {
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // New Payment Dialog State
  const [newPaymentDialogOpen, setNewPaymentDialogOpen] = useState(false);
  const [newPaymentRecipientType, setNewPaymentRecipientType] = useState<"reseller" | "vendor">("reseller");
  const [newPaymentRecipientId, setNewPaymentRecipientId] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState<"bank_transfer" | "paypal" | "stripe_connect">("bank_transfer");
  const [newPaymentBankName, setNewPaymentBankName] = useState("");
  const [newPaymentBankNumber, setNewPaymentBankNumber] = useState("");
  const [newPaymentSortCode, setNewPaymentSortCode] = useState("");
  const [newPaymentPaypalEmail, setNewPaymentPaypalEmail] = useState("");
  const [newPaymentReason, setNewPaymentReason] = useState("");
  const [newPaymentIsAdjustment, setNewPaymentIsAdjustment] = useState(false);
  const [newPaymentPayImmediately, setNewPaymentPayImmediately] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  
  // Export to CSV function
  const exportToCSV = () => {
    if (filteredPayouts.length === 0) {
      toast({ title: "No Data", description: "No payouts to export", variant: "destructive" });
      return;
    }
    
    const headers = ["Request #", "Recipient", "Email", "Amount", "Method", "Status", "Date Requested", "Date Paid", "Transaction Ref"];
    const rows = filteredPayouts.map((p) => [
      p.requestNumber,
      p.recipientName || p.resellerName || "Unknown",
      p.recipientEmail || p.resellerEmail || "",
      `£${parseFloat(p.amount).toFixed(2)}`,
      p.payoutMethod === "stripe_connect" ? "Stripe" : p.payoutMethod === "bank_transfer" ? "Bank Transfer" : "PayPal",
      p.status,
      new Date(p.createdAt).toLocaleDateString(),
      p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "",
      p.transactionReference || ""
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${statusFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Export Complete", description: `Exported ${filteredPayouts.length} payout records to CSV` });
  };
  const queryClient = useQueryClient();

  const { data: overview, isLoading: overviewLoading } = useQuery<CommissionOverview>({
    queryKey: ["/api/admin/commission-overview"],
  });

  const { data: payouts = [], isLoading: payoutsLoading, refetch: refetchPayouts } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payouts", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" 
        ? "/api/admin/payouts" 
        : `/api/admin/payouts?status=${statusFilter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch payouts");
      return response.json();
    },
  });

  const { data: pendingPayouts = [], isLoading: pendingLoading } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payouts/pending"],
  });

  // Query for audit logs when payout is selected
  const { data: auditLogs = [], isLoading: auditLogsLoading } = useQuery<PayoutAuditLog[]>({
    queryKey: ["/api/admin/payouts", selectedPayout?.id, "audit-logs"],
    queryFn: async () => {
      if (!selectedPayout?.id) return [];
      const response = await fetch(`/api/admin/payouts/${selectedPayout.id}/audit-logs`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
    enabled: !!selectedPayout?.id && detailDialogOpen,
  });

  // Load balance for the reseller in the currently-open payout detail
  const { data: resellerBalance, isLoading: balanceLoading } = useQuery<{
    totalEarned: number; totalPaidOut: number; pendingPayout: number;
    availableBalance: number; catalogueCommission: number; ownProductsRevenue: number;
  }>({
    queryKey: ["/api/admin/payouts/reseller-balance", selectedPayout?.resellerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/payouts/reseller-balance/${selectedPayout!.resellerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    enabled: !!selectedPayout?.resellerId && detailDialogOpen,
  });

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} copied to clipboard` });
    });
  }, [toast]);

  // Filter payouts based on search query
  const filteredPayouts = payouts.filter((payout) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payout.requestNumber?.toLowerCase().includes(query) ||
      payout.recipientName?.toLowerCase().includes(query) ||
      payout.resellerName?.toLowerCase().includes(query) ||
      payout.recipientEmail?.toLowerCase().includes(query) ||
      payout.resellerEmail?.toLowerCase().includes(query) ||
      payout.transactionReference?.toLowerCase().includes(query)
    );
  });

  // Helper: get balance breakdown for a reseller from the recipients cache
  const getResellerBreakdown = (resellerId: number | null | undefined) => {
    if (!resellerId || !recipients?.resellers) return null;
    return recipients.resellers.find(r => r.id === resellerId) ?? null;
  };

  // Query for recipients (resellers and vendors with balances)
  const { data: recipients, isLoading: recipientsLoading, error: recipientsError } = useQuery<RecipientsData>({
    queryKey: ["/api/admin/payouts/recipients"],
    queryFn: async () => {
      const response = await fetch("/api/admin/payouts/recipients", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch recipients:", errorText);
        throw new Error("Failed to fetch recipients");
      }
      return response.json();
    },
    enabled: newPaymentDialogOpen || statusFilter === "balances",
  });

  // Mutation for creating manual payout
  const createManualPayoutMutation = useMutation({
    mutationFn: async (data: {
      recipientType: string;
      recipientId: string;
      amount: string;
      payoutMethod: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankSortCode?: string;
      paypalEmail?: string;
      payoutReason?: string;
      isAdjustment?: boolean;
      payImmediately?: boolean;
    }) => {
      const response = await fetch("/api/admin/payouts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payout");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.startsWith('/api/admin/payouts');
      }});
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commission-overview"] });
      
      const message = data.transfer 
        ? `Payment sent via Stripe. Transfer ID: ${data.transfer.id}` 
        : data.requiresManualPayment 
          ? "Payout created. Manual payment required."
          : "Payout created successfully.";
      
      toast({
        title: "Payment Created",
        description: message,
      });
      resetNewPaymentForm();
      setNewPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Payment",
        description: error.message || "Failed to create payout",
        variant: "destructive",
      });
    },
  });

  const approvePayoutMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/payouts/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve payout");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.startsWith('/api/admin/payouts');
      }});
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commission-overview"] });
      toast({
        title: "Payout Approved",
        description: "The payout request has been approved.",
      });
      setDetailDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve payout",
        variant: "destructive",
      });
    },
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/payouts/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject payout");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.startsWith('/api/admin/payouts');
      }});
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commission-overview"] });
      toast({
        title: "Payout Rejected",
        description: "The payout request has been rejected.",
      });
      setDetailDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject payout",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, transactionReference, adminNotes }: { id: string; transactionReference?: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/payouts/${id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionReference, adminNotes }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark payout as paid");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.startsWith('/api/admin/payouts');
      }});
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commission-overview"] });
      toast({
        title: "Payout Completed",
        description: "The payout has been marked as paid.",
      });
      setProcessDialogOpen(false);
      setDetailDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: error.message || "Failed to process payout",
        variant: "destructive",
      });
    },
  });

  const payWithStripeMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/payouts/${id}/pay-stripe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process Stripe transfer");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.startsWith('/api/admin/payouts');
      }});
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commission-overview"] });
      toast({
        title: "Stripe Transfer Complete",
        description: `Payout processed successfully. Transfer ID: ${data.transferId}`,
      });
      setDetailDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Stripe Transfer Failed",
        description: error.message || "Failed to process Stripe transfer",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
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

  const handleViewDetails = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setAdminNotes(payout.adminNotes || "");
    setDetailDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedPayout) {
      approvePayoutMutation.mutate({ id: selectedPayout.id, adminNotes });
    }
  };

  const handleReject = () => {
    if (selectedPayout) {
      rejectPayoutMutation.mutate({ id: selectedPayout.id, adminNotes });
    }
  };

  const handleMarkPaid = () => {
    if (selectedPayout) {
      markPaidMutation.mutate({ 
        id: selectedPayout.id, 
        transactionReference,
        adminNotes 
      });
    }
  };

  const handlePayWithStripe = () => {
    if (selectedPayout) {
      payWithStripeMutation.mutate({ 
        id: selectedPayout.id, 
        adminNotes 
      });
    }
  };

  // Reset new payment form
  const resetNewPaymentForm = () => {
    setNewPaymentRecipientType("reseller");
    setNewPaymentRecipientId("");
    setNewPaymentAmount("");
    setNewPaymentMethod("bank_transfer");
    setNewPaymentBankName("");
    setNewPaymentBankNumber("");
    setNewPaymentSortCode("");
    setNewPaymentPaypalEmail("");
    setNewPaymentReason("");
    setNewPaymentIsAdjustment(false);
    setNewPaymentPayImmediately(false);
  };

  // Get selected recipient details
  const getSelectedRecipient = (): PayoutRecipient | undefined => {
    if (!recipients || !newPaymentRecipientId) return undefined;
    const list = newPaymentRecipientType === "reseller" ? recipients.resellers : recipients.vendors;
    return list.find(r => r.id === newPaymentRecipientId);
  };

  const selectedRecipient = getSelectedRecipient();

  // Check if Stripe Connect is available for selected recipient
  const canUseStripeConnect = selectedRecipient?.stripeChargesEnabled === true;

  // Auto-coerce payment method when Stripe is no longer available for the selected recipient
  useEffect(() => {
    if (!canUseStripeConnect && newPaymentMethod === "stripe_connect") {
      setNewPaymentMethod("bank_transfer");
      setNewPaymentPayImmediately(false);
    }
  }, [canUseStripeConnect, newPaymentMethod]);

  // Parse amount for validation
  const parsedAmount = parseFloat(newPaymentAmount);
  const isValidAmount = newPaymentAmount !== "" && !isNaN(parsedAmount) && parsedAmount > 0;

  // Validation state
  const validationErrors = {
    recipient: !newPaymentRecipientId ? "Please select a recipient" : null,
    amount: !newPaymentAmount ? "Please enter an amount" 
      : isNaN(parsedAmount) ? "Please enter a valid number"
      : parsedAmount <= 0 ? "Amount must be greater than zero" 
      : null,
    bankName: newPaymentMethod === "bank_transfer" && !newPaymentBankName ? "Account name is required" : null,
    bankNumber: newPaymentMethod === "bank_transfer" && !newPaymentBankNumber ? "Account number is required" : null,
    sortCode: newPaymentMethod === "bank_transfer" && !newPaymentSortCode ? "Sort code is required" : null,
    paypalEmail: newPaymentMethod === "paypal" && !newPaymentPaypalEmail ? "PayPal email is required" : null,
  };

  const isFormValid = !validationErrors.recipient 
    && !validationErrors.amount 
    && !validationErrors.bankName 
    && !validationErrors.bankNumber 
    && !validationErrors.sortCode 
    && !validationErrors.paypalEmail;

  // Handle new payment submit
  const handleNewPaymentSubmit = () => {
    if (!isFormValid) {
      const errorMessages = Object.values(validationErrors).filter(Boolean);
      toast({
        title: "Missing Information",
        description: errorMessages[0] || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createManualPayoutMutation.mutate({
      recipientType: newPaymentRecipientType,
      recipientId: newPaymentRecipientId,
      amount: newPaymentAmount,
      payoutMethod: newPaymentMethod,
      bankAccountName: newPaymentMethod === "bank_transfer" ? newPaymentBankName : undefined,
      bankAccountNumber: newPaymentMethod === "bank_transfer" ? newPaymentBankNumber : undefined,
      bankSortCode: newPaymentMethod === "bank_transfer" ? newPaymentSortCode : undefined,
      paypalEmail: newPaymentMethod === "paypal" ? newPaymentPaypalEmail : undefined,
      payoutReason: newPaymentReason,
      isAdjustment: newPaymentIsAdjustment,
      payImmediately: newPaymentPayImmediately && newPaymentMethod === "stripe_connect" && canUseStripeConnect,
    });
  };

  
  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading payout data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Commission Payouts</h1>
          <p className="text-muted-foreground">Manage reseller and vendor payout requests</p>
        </div>
        <Button 
          onClick={() => setNewPaymentDialogOpen(true)}
          data-testid="button-new-payment"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </Button>
      </div>

      {/* Modern Gradient KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pending Approval Card */}
        <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
          <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Approval</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">{overview?.summary.pendingCount || 0}</div>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              £{parseFloat(overview?.summary.pendingAmount || "0").toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        {/* Approved Card */}
        <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
          <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Awaiting Payment</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{overview?.summary.approvedCount || 0}</div>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              £{parseFloat(overview?.summary.approvedAmount || "0").toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        {/* Paid Out Card */}
        <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
          <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Paid Out</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">{overview?.summary.paidCount || 0}</div>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              £{parseFloat(overview?.summary.paidAmount || "0").toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
          <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Quick Actions</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-2">
            <Button 
              size="sm" 
              className="w-full justify-start"
              onClick={() => setNewPaymentDialogOpen(true)}
              data-testid="button-quick-new-payment"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Payment
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full justify-start"
              onClick={() => setStatusFilter("pending")}
              data-testid="button-quick-pending"
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Review Pending ({overview?.summary.pendingCount || 0})
            </Button>
          </CardContent>
        </Card>
      </div>

      {pendingPayouts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-yellow-600">Pending Approval</CardTitle>
            </div>
            <CardDescription>These payout requests require your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayouts.map((payout) => {
                const breakdown = getResellerBreakdown(payout.resellerId);
                return (
                  <div key={payout.id} className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{payout.requestNumber}</span>
                          <Badge variant="secondary">{payout.resellerName || payout.recipientName || "Unknown"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payout.payoutMethod === "stripe_connect" ? "Stripe" : payout.payoutMethod === "bank_transfer" ? "Bank Transfer" : "PayPal"} ·{" "}
                          Requested: {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xl font-bold">£{parseFloat(payout.amount).toFixed(2)}</span>
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(payout)}
                          data-testid={`button-view-payout-${payout.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                    {breakdown && (
                      <div className="flex flex-wrap gap-3 pt-1 border-t border-yellow-500/20">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Package className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">Catalogue commission:</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">£{(breakdown.catalogueCommission ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Store className="h-3 w-3 text-violet-500" />
                          <span className="text-muted-foreground">Own product revenue:</span>
                          <span className="font-medium text-violet-600 dark:text-violet-400">£{(breakdown.ownProductsRevenue ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Wallet className="h-3 w-3 text-amber-500" />
                          <span className="text-muted-foreground">Available balance:</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">£{breakdown.availableBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>All Requests</TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setStatusFilter("pending")}>Pending</TabsTrigger>
          <TabsTrigger value="approved" onClick={() => setStatusFilter("approved")}>Approved</TabsTrigger>
          <TabsTrigger value="paid" onClick={() => setStatusFilter("paid")}>Paid</TabsTrigger>
          <TabsTrigger value="rejected" onClick={() => setStatusFilter("rejected")}>Rejected</TabsTrigger>
          <TabsTrigger value="balances" onClick={() => setStatusFilter("balances")} data-testid="tab-reseller-balances">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reseller Balances
          </TabsTrigger>
        </TabsList>

        {/* Reseller Balances Tab */}
        {statusFilter === "balances" && (
          <TabsContent value="balances" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-500" />
                    Reseller Earnings &amp; Balances
                  </CardTitle>
                  <CardDescription>
                    How much 1stRep owes each reseller — broken down by catalogue commission and own-product revenue
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {recipientsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !recipients?.resellers?.length ? (
                  <p className="text-center text-muted-foreground py-8">No approved resellers found.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Summary row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg border">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Owed</p>
                        <p className="text-2xl font-black text-foreground">
                          £{recipients.resellers.reduce((s, r) => s + r.availableBalance, 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Catalogue Commission</p>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          £{recipients.resellers.reduce((s, r) => s + (r.catalogueCommission ?? 0), 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Own Product Revenue</p>
                        <p className="text-2xl font-black text-violet-600 dark:text-violet-400">
                          £{recipients.resellers.reduce((s, r) => s + (r.ownProductsRevenue ?? 0), 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid Out</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          £{recipients.resellers.reduce((s, r) => s + r.totalPaidOut, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Per-reseller cards */}
                    {recipients.resellers
                      .slice()
                      .sort((a, b) => b.availableBalance - a.availableBalance)
                      .map((reseller) => (
                        <Card key={reseller.id} className="border-border/60">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              {/* Reseller info */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="font-bold text-lg">{reseller.businessName}</p>
                                  {reseller.stripeChargesEnabled && (
                                    <Badge className="bg-primary text-xs">
                                      <SiStripe className="h-3 w-3 mr-1" />
                                      Stripe
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{reseller.contactPerson} · {reseller.email}</p>
                              </div>

                              {/* Balance action */}
                              <div className="flex items-center gap-2 shrink-0">
                                {reseller.availableBalance > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setNewPaymentRecipientType("reseller");
                                      setNewPaymentRecipientId(reseller.id);
                                      setNewPaymentAmount(reseller.availableBalance.toFixed(2));
                                      setNewPaymentDialogOpen(true);
                                    }}
                                    data-testid={`button-pay-reseller-${reseller.id}`}
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    Pay Out
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Earnings breakdown */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div className="p-3 rounded-lg bg-blue-500/8 border border-blue-500/15">
                                <div className="flex items-center gap-1 mb-1">
                                  <Package className="h-3.5 w-3.5 text-blue-500" />
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Catalogue Commission</span>
                                </div>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                  £{(reseller.catalogueCommission ?? 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">from 1stRep products</p>
                              </div>

                              <div className="p-3 rounded-lg bg-violet-500/8 border border-violet-500/15">
                                <div className="flex items-center gap-1 mb-1">
                                  <Store className="h-3.5 w-3.5 text-violet-500" />
                                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">Own Product Revenue</span>
                                </div>
                                <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                                  £{(reseller.ownProductsRevenue ?? 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">online card payments</p>
                              </div>

                              <div className="p-3 rounded-lg bg-foreground/5 border">
                                <div className="flex items-center gap-1 mb-1">
                                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Earned</span>
                                </div>
                                <p className="text-lg font-bold">{`£${reseller.totalEarned.toFixed(2)}`}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">commission + own products</p>
                              </div>

                              <div className="p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                                <div className="flex items-center gap-1 mb-1">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Paid Out</span>
                                </div>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{`£${reseller.totalPaidOut.toFixed(2)}`}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">already transferred</p>
                              </div>

                              <div className={`p-3 rounded-lg border ${reseller.availableBalance > 0 ? 'bg-amber-500/8 border-amber-500/30' : 'bg-foreground/5'}`}>
                                <div className="flex items-center gap-1 mb-1">
                                  <Wallet className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Available Balance</span>
                                </div>
                                <p className={`text-lg font-bold ${reseller.availableBalance > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>
                                  £{reseller.availableBalance.toFixed(2)}
                                </p>
                                {reseller.pendingPayout > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5">£{reseller.pendingPayout.toFixed(2)} pending</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {statusFilter !== "balances" && <TabsContent value={statusFilter} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Payout Requests</CardTitle>
                  <CardDescription>
                    {statusFilter === "all" ? "All payout requests" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} requests`}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search payouts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                      data-testid="input-search-payouts"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchPayouts()}
                    data-testid="button-refresh-payouts"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    disabled={filteredPayouts.length === 0}
                    data-testid="button-export-csv"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {payoutsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPayouts.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? `No payouts found matching "${searchQuery}"` : "No payout requests found"}
                  </p>
                  {searchQuery && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="mt-2">
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">Request #</th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">Recipient</th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">Amount</th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">Method</th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                        <th className="text-left p-4 font-semibold text-xs uppercase tracking-wider">Date</th>
                        <th className="text-right p-4 font-semibold text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayouts.map((payout: PayoutRequest) => (
                        <tr key={payout.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-medium text-sm">{payout.requestNumber}</span>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{payout.recipientName || payout.resellerName || "Unknown"}</p>
                                {payout.recipientType === 'vendor' && (
                                  <Badge variant="outline" className="text-xs">Wholesaler</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{payout.recipientEmail || payout.resellerEmail}</p>
                            </div>
                          </td>
                          <td className="p-4 font-semibold">£{parseFloat(payout.amount).toFixed(2)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              {payout.payoutMethod === "stripe_connect" ? (
                                <>
                                  <Zap className="h-4 w-4 text-primary" />
                                  Stripe
                                </>
                              ) : payout.payoutMethod === "bank_transfer" ? (
                                <>
                                  <Building className="h-4 w-4" />
                                  Bank
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4" />
                                  PayPal
                                </>
                              )}
                              {payout.resellerStripeConnected && payout.payoutMethod !== "stripe_connect" && (
                                <Badge variant="outline" className="ml-1 text-xs">
                                  <SiStripe className="h-3 w-3 mr-1" />
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">{getStatusBadge(payout.status)}</td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(payout)}
                              data-testid={`button-view-details-${payout.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>}
      </Tabs>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, gap: 0 }}>
          {selectedPayout && (
            <>
              {/* ── Header ──────────────────────────────────────── */}
              <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <DialogTitle className="text-base font-mono text-muted-foreground mb-1">
                      {selectedPayout.requestNumber}
                    </DialogTitle>
                    <DialogDescription className="text-lg font-bold text-foreground">
                      {selectedPayout.resellerName || selectedPayout.recipientName || "Payout Request"}
                    </DialogDescription>
                    <p className="text-sm text-muted-foreground">{selectedPayout.resellerEmail || selectedPayout.recipientEmail}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(selectedPayout.status)}
                    <p className="text-2xl font-black mt-2 text-green-600 dark:text-green-400">
                      £{parseFloat(selectedPayout.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(selectedPayout.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 py-4 px-6 flex-1 overflow-y-auto">

                {/* ── Balance & Earnings Breakdown ─────────────── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reseller Balance</p>
                  {balanceLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
                    </div>
                  ) : resellerBalance ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-muted/40 border p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-0.5">Total Earned</p>
                          <p className="font-bold text-lg">£{resellerBalance.totalEarned.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-0.5">Catalogue Comm.</p>
                          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">£{resellerBalance.catalogueCommission.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-0.5">Own Products</p>
                          <p className="font-bold text-lg text-violet-600 dark:text-violet-400">£{resellerBalance.ownProductsRevenue.toFixed(2)}</p>
                        </div>
                        <div className={`rounded-lg border p-3 text-center ${
                          resellerBalance.availableBalance < -0.01
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          <p className="text-xs text-muted-foreground mb-0.5">Available Now</p>
                          <p className={`font-bold text-lg ${
                            resellerBalance.availableBalance < -0.01
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>£{resellerBalance.availableBalance.toFixed(2)}</p>
                        </div>
                      </div>
                      {resellerBalance.totalPaidOut > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5 text-right">
                          £{resellerBalance.totalPaidOut.toFixed(2)} already paid out · £{resellerBalance.pendingPayout.toFixed(2)} pending
                        </p>
                      )}
                      {resellerBalance.availableBalance < -0.01 && (
                        <div className="mt-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
                          <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5 text-sm">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Balance shortfall — £{Math.abs(resellerBalance.availableBalance).toFixed(2)} over
                          </p>
                          <p className="text-red-700/80 dark:text-red-400/80 text-xs mt-1 leading-relaxed">
                            Paid out (£{resellerBalance.totalPaidOut.toFixed(2)}) + pending (£{resellerBalance.pendingPayout.toFixed(2)}) exceeds
                            what this reseller has actually earned (£{resellerBalance.totalEarned.toFixed(2)}) by £{Math.abs(resellerBalance.availableBalance).toFixed(2)}.{' '}
                            {selectedPayout.status === 'paid'
                              ? "This specific payout has already been paid — flagging for your records, no action needed on it."
                              : "Review before approving this request — the reseller may not have enough earned balance to cover it."}
                          </p>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                {/* ── Payment Details ───────────────────────────── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment Details</p>
                  <div className="border rounded-lg p-4 space-y-3">
                    {selectedPayout.payoutMethod === "stripe_connect" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <SiStripe className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Stripe Connect — Automatic Transfer</span>
                          <Badge className="bg-green-600 text-xs">Instant</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Funds will be transferred automatically to the reseller's connected Stripe account when approved.
                        </p>
                        {(selectedPayout.resellerStripeAccountId || selectedPayout.stripeAccountId) && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-mono text-muted-foreground flex-1">
                              {selectedPayout.resellerStripeAccountId || selectedPayout.stripeAccountId}
                            </p>
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedPayout.resellerStripeAccountId || selectedPayout.stripeAccountId || '', "Stripe ID")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : selectedPayout.payoutMethod === "bank_transfer" ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span className="font-semibold">UK Bank Transfer (BACS)</span>
                        </div>
                        {(selectedPayout.status === "approved" || selectedPayout.status === "processing") && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm">
                            <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">Action Required — Send Bank Transfer</p>
                            <p className="text-muted-foreground text-xs">Transfer £{parseFloat(selectedPayout.amount).toFixed(2)} using the details below, then enter the reference and click "Confirm Sent".</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Account Name</p>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm flex-1">{selectedPayout.bankAccountName || "—"}</p>
                              {selectedPayout.bankAccountName && (
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedPayout.bankAccountName!, "Account name")}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Sort Code</p>
                            <div className="flex items-center gap-2">
                              <p className="font-medium font-mono text-sm flex-1">{selectedPayout.bankSortCode || "—"}</p>
                              {selectedPayout.bankSortCode && (
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedPayout.bankSortCode!, "Sort code")}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <p className="text-xs text-muted-foreground">Account Number</p>
                            <div className="flex items-center gap-2">
                              <p className="font-medium font-mono text-sm flex-1">{selectedPayout.bankAccountNumber || "—"}</p>
                              {selectedPayout.bankAccountNumber && (
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedPayout.bankAccountNumber!, "Account number")}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span className="font-semibold">PayPal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm flex-1">{selectedPayout.paypalEmail || "Not provided"}</p>
                          {selectedPayout.paypalEmail && (
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedPayout.paypalEmail!, "PayPal email")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Reseller Notes ──────────────────────────────── */}
                {selectedPayout.resellerNotes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reseller Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedPayout.resellerNotes}</p>
                  </div>
                )}

                {/* ── Admin Notes + Transaction Reference ──────── */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Admin Notes</p>
                    <Textarea
                      placeholder="Add notes (visible to admin only)"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="resize-none"
                      disabled={selectedPayout.status === "paid" || selectedPayout.status === "rejected"}
                      data-testid="textarea-admin-notes"
                    />
                  </div>

                  {(selectedPayout.status === "approved" || selectedPayout.status === "processing") && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Transaction Reference</p>
                      <Input
                        placeholder="Enter bank reference or transaction ID"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        data-testid="input-transaction-reference"
                      />
                    </div>
                  )}

                  {selectedPayout.transactionReference && (
                    <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Transaction Reference</p>
                        <p className="font-mono text-sm truncate">{selectedPayout.transactionReference}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(selectedPayout.transactionReference!, "Transaction reference")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {selectedPayout.stripeTransferId && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <SiStripe className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Stripe Transfer ID</p>
                        <p className="font-mono text-sm truncate">{selectedPayout.stripeTransferId}</p>
                      </div>
                    </div>
                  )}

                  {selectedPayout.transferError && (
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-xs font-semibold text-destructive mb-1">Transfer Error</p>
                      <p className="text-sm text-destructive">{selectedPayout.transferError}</p>
                    </div>
                  )}
                </div>

                {/* ── Audit History Timeline ───────────────────── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">History</p>
                  {auditLogsLoading ? (
                    <div className="space-y-2">
                      {[1,2].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center border rounded-lg bg-muted/20">No history yet</p>
                  ) : (
                    <div className="relative pl-6 space-y-0">
                      {/* Vertical line */}
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                      {auditLogs.map((log) => {
                        const iconMap: Record<string, JSX.Element> = {
                          submitted: <ArrowUpRight className="h-3 w-3 text-blue-500" />,
                          approved: <CheckCircle className="h-3 w-3 text-green-500" />,
                          rejected: <XCircle className="h-3 w-3 text-red-500" />,
                          paid: <DollarSign className="h-3 w-3 text-emerald-500" />,
                          processing: <Loader2 className="h-3 w-3 text-amber-500" />,
                        };
                        const icon = iconMap[log.action] || <Clock className="h-3 w-3 text-muted-foreground" />;
                        return (
                          <div key={log.id} className="relative pb-4 last:pb-0">
                            <div className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-border">
                              {icon}
                            </div>
                            <div className="ml-2 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm capitalize">{log.action === 'submitted' ? 'Request Submitted' : log.action}</span>
                                <span className="text-xs text-muted-foreground">
                                  by {log.performedByName || 'System'} ({log.performedByRole || 'system'})
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {log.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Action buttons ──────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
                <div className="flex flex-wrap gap-2">
                  {selectedPayout.status === "pending" && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleReject}
                        disabled={rejectPayoutMutation.isPending}
                        data-testid="button-reject-payout"
                      >
                        {rejectPayoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        disabled={approvePayoutMutation.isPending}
                        data-testid="button-approve-payout"
                      >
                        {approvePayoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Approve
                      </Button>
                    </>
                  )}
                  {(selectedPayout.status === "approved" || selectedPayout.status === "processing") && (
                    <>
                      {selectedPayout.payoutMethod === "stripe_connect" && (selectedPayout.resellerStripeConnected || selectedPayout.resellerStripeAccountId) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePayWithStripe}
                          disabled={payWithStripeMutation.isPending}
                        >
                          {payWithStripeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiStripe className="h-4 w-4" />}
                          Pay via Stripe
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-green-600"
                        onClick={handleMarkPaid}
                        disabled={markPaidMutation.isPending}
                        data-testid="button-mark-paid"
                      >
                        {markPaidMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        {selectedPayout.payoutMethod === "bank_transfer" ? "Confirm Transfer Sent" : "Mark as Paid"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Payment Dialog */}
      <Dialog open={newPaymentDialogOpen} onOpenChange={(open) => {
        setNewPaymentDialogOpen(open);
        if (!open) resetNewPaymentForm();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Payment
            </DialogTitle>
            <DialogDescription>
              Create an admin-initiated payment to a reseller or vendor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recipient Type */}
            <div className="space-y-2">
              <Label>Recipient Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newPaymentRecipientType === "reseller" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setNewPaymentRecipientType("reseller");
                    setNewPaymentRecipientId("");
                  }}
                  data-testid="button-recipient-reseller"
                >
                  <User className="h-4 w-4 mr-2" />
                  Reseller
                </Button>
                <Button
                  type="button"
                  variant={newPaymentRecipientType === "vendor" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setNewPaymentRecipientType("vendor");
                    setNewPaymentRecipientId("");
                  }}
                  data-testid="button-recipient-vendor"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Vendor
                </Button>
              </div>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label>Select {newPaymentRecipientType === "reseller" ? "Reseller" : "Vendor"}</Label>
              {recipientsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <Select
                  value={newPaymentRecipientId}
                  onValueChange={setNewPaymentRecipientId}
                >
                  <SelectTrigger data-testid="select-recipient">
                    <SelectValue placeholder={`Select a ${newPaymentRecipientType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(newPaymentRecipientType === "reseller" 
                      ? recipients?.resellers || [] 
                      : recipients?.vendors || []
                    ).map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        <div className="flex items-center gap-2">
                          <span>{recipient.businessName}</span>
                          {recipient.stripeChargesEnabled && (
                            <SiStripe className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    {((newPaymentRecipientType === "reseller" ? recipients?.resellers : recipients?.vendors) || []).length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No approved {newPaymentRecipientType}s found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Recipient Info */}
            {selectedRecipient && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedRecipient.businessName}</span>
                  {selectedRecipient.stripeChargesEnabled && (
                    <Badge className="bg-primary">
                      <SiStripe className="h-3 w-3 mr-1" />
                      Stripe Connected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Contact:</span>
                    <p>{selectedRecipient.contactPerson}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p>{selectedRecipient.email}</p>
                  </div>
                  {newPaymentRecipientType === "reseller" && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Total Earned:</span>
                        <p className="font-semibold">£{selectedRecipient.totalEarned.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Available Balance:</span>
                        <p className="font-semibold text-green-600">£{selectedRecipient.availableBalance.toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="newPaymentAmount">Amount (£)</Label>
              <Input
                id="newPaymentAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                data-testid="input-payment-amount"
              />
              {selectedRecipient && newPaymentRecipientType === "reseller" && !newPaymentIsAdjustment && (
                <p className="text-xs text-muted-foreground">
                  Max available: £{selectedRecipient.availableBalance.toFixed(2)}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={newPaymentMethod}
                onValueChange={(v) => setNewPaymentMethod(v as typeof newPaymentMethod)}
              >
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="paypal">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      PayPal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Transfer Details */}
            {newPaymentMethod === "bank_transfer" && (
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Account Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Account holder name"
                    value={newPaymentBankName}
                    onChange={(e) => setNewPaymentBankName(e.target.value)}
                    data-testid="input-bank-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="sortCode">Sort Code</Label>
                    <Input
                      id="sortCode"
                      placeholder="00-00-00"
                      value={newPaymentSortCode}
                      onChange={(e) => setNewPaymentSortCode(e.target.value)}
                      data-testid="input-sort-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="00000000"
                      value={newPaymentBankNumber}
                      onChange={(e) => setNewPaymentBankNumber(e.target.value)}
                      data-testid="input-account-number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PayPal Details */}
            {newPaymentMethod === "paypal" && (
              <div className="space-y-2">
                <Label htmlFor="paypalEmail">PayPal Email</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  placeholder="recipient@email.com"
                  value={newPaymentPaypalEmail}
                  onChange={(e) => setNewPaymentPaypalEmail(e.target.value)}
                  data-testid="input-paypal-email"
                />
              </div>
            )}


            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="payoutReason">Payment Reason</Label>
              <Textarea
                id="payoutReason"
                placeholder="Enter reason for this payment..."
                value={newPaymentReason}
                onChange={(e) => setNewPaymentReason(e.target.value)}
                className="resize-none"
                rows={2}
                data-testid="textarea-payment-reason"
              />
            </div>

            {/* Is Adjustment */}
            {newPaymentRecipientType === "reseller" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdjustment"
                  checked={newPaymentIsAdjustment}
                  onCheckedChange={(checked) => setNewPaymentIsAdjustment(checked as boolean)}
                  data-testid="checkbox-is-adjustment"
                />
                <label
                  htmlFor="isAdjustment"
                  className="text-sm cursor-pointer"
                >
                  <span className="font-medium">Bonus/Adjustment</span>
                  <span className="text-muted-foreground ml-1">(does not deduct from available balance)</span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetNewPaymentForm();
                setNewPaymentDialogOpen(false);
              }}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewPaymentSubmit}
              disabled={createManualPayoutMutation.isPending || !isFormValid}
              data-testid="button-submit-payment"
            >
              {createManualPayoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {newPaymentMethod === "stripe_connect" && newPaymentPayImmediately && canUseStripeConnect
                ? "Send Payment Now" 
                : "Create Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
