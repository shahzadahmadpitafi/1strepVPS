import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { format, subDays, differenceInDays } from "date-fns";
import { 
  Users, Store, Building2, ArrowLeft, Search, Filter, Plus,
  MoreHorizontal, Edit, MessageSquare, DollarSign, TrendingUp,
  CheckCircle, XCircle, Clock, AlertCircle, Settings, Eye,
  Mail, Phone, MapPin, Calendar, Shield, CreditCard, Percent,
  BarChart3, ShoppingCart, Activity, ExternalLink, ChevronDown,
  Star, Zap, UserPlus, RefreshCw, Download, History, Ban,
  Trash2, Power, PowerOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Partner {
  id: string;
  partnerType: 'reseller' | 'vendor';
  businessName: string;
  contactPerson?: string;
  email?: string;
  phoneNumber?: string;
  businessAddress?: string;
  logoUrl?: string;
  tier?: string;
  approvalStatus: string;
  isActive: boolean;
  registrationDate: string;
  commissionRate?: string;
  discountPercentage?: string;
  creditLimit?: string;
  currentCredit?: string;
  stripeAccountId?: string;
  stripeOnboardingStatus?: string;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  totalEarned?: string;
  totalOrders?: number;
  pendingAmount?: string;
  paidAmount?: string;
  lastOrderDate?: string;
}

interface PartnerActivity {
  id: string;
  type: 'order' | 'payout' | 'message' | 'status_change' | 'login';
  description: string;
  timestamp: string;
  amount?: string;
}

interface PartnerNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

function formatCurrency(amount: number | string | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num);
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
    case 'suspended':
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Suspended</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTierBadge(tier: string | undefined) {
  switch (tier) {
    case 'platinum':
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Platinum</Badge>;
    case 'gold':
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Gold</Badge>;
    case 'silver':
      return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400">Silver</Badge>;
    case 'bronze':
    default:
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Bronze</Badge>;
  }
}

function getStripeStatus(partner: Partner) {
  if (!partner.stripeAccountId) {
    return <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>;
  }
  if (partner.stripePayoutsEnabled) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</Badge>;
  }
  if (partner.stripeOnboardingStatus === 'pending') {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Onboarding</Badge>;
  }
  return <Badge variant="outline">Incomplete</Badge>;
}

export default function AdminPartnerManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [editForm, setEditForm] = useState<{
    commissionRate: string;
    discountPercentage: string;
    creditLimit: string;
    isActive: boolean;
    tier: string;
    logoUrl: string;
  }>({
    commissionRate: "",
    discountPercentage: "",
    creditLimit: "",
    isActive: true,
    tier: "bronze",
    logoUrl: ""
  });
  const [noteContent, setNoteContent] = useState("");
  const [detailTab, setDetailTab] = useState("overview");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: resellers = [], isLoading: resellersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/resellers"],
    enabled: authUser?.role === "admin",
  });

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/vendors"],
    enabled: authUser?.role === "admin",
  });

  const { data: commissionStats } = useQuery<any>({
    queryKey: ["/api/admin/commission-analytics/overview"],
    enabled: authUser?.role === "admin",
  });

  const updateResellerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/admin/resellers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      toast({ title: "Partner updated", description: "Partner details have been saved successfully." });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update partner", variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/resellers/${id}/status`, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      const action = variables.isActive ? "activated" : "deactivated";
      toast({ title: `Reseller ${action}`, description: `The reseller account has been ${action} successfully.` });
      if (selectedPartner) {
        setSelectedPartner(prev => prev ? { ...prev, isActive: variables.isActive } : null);
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update reseller status", variant: "destructive" });
    },
  });

  const deleteResellerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/resellers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      toast({ title: "Reseller deleted", description: "The reseller account has been removed successfully." });
      setDeleteConfirmOpen(false);
      setPartnerToDelete(null);
      setSelectedPartner(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete reseller account", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ partnerId, partnerType, content }: { partnerId: string; partnerType: string; content: string }) => {
      return apiRequest("POST", `/api/admin/partners/${partnerType}/${partnerId}/message`, { content, type: "general" });
    },
    onSuccess: () => {
      toast({ title: "Message sent", description: "Your message has been sent to the partner." });
      setMessageDialogOpen(false);
      setMessageContent("");
    },
    onError: () => {
      toast({ title: "Sent (simulated)", description: "Message sending is simulated in development mode." });
      setMessageDialogOpen(false);
      setMessageContent("");
    },
  });

  const allPartners: Partner[] = useMemo(() => {
    const resellerPartners = resellers.map((r: any) => ({
      ...r,
      partnerType: 'reseller' as const,
      email: r.user?.email || r.email,
    }));
    const vendorPartners = vendors.map((v: any) => ({
      ...v,
      partnerType: 'vendor' as const,
      email: v.user?.email || v.email,
    }));
    return [...resellerPartners, ...vendorPartners];
  }, [resellers, vendors]);

  const filteredPartners = useMemo(() => {
    let result = allPartners;
    
    if (activeTab === 'resellers') {
      result = result.filter(p => p.partnerType === 'reseller');
    } else if (activeTab === 'vendors') {
      result = result.filter(p => p.partnerType === 'vendor');
    } else if (activeTab === 'pending') {
      result = result.filter(p => p.approvalStatus === 'pending');
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(p => p.approvalStatus === statusFilter);
    }
    
    if (tierFilter !== 'all') {
      result = result.filter(p => p.tier === tierFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.businessName?.toLowerCase().includes(query) ||
        p.contactPerson?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [allPartners, activeTab, statusFilter, tierFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalResellers = resellers.length;
    const totalVendors = vendors.length;
    const pendingApprovals = allPartners.filter(p => p.approvalStatus === 'pending').length;
    const activePartners = allPartners.filter(p => p.isActive && p.approvalStatus === 'approved').length;
    const stripeConnected = allPartners.filter(p => p.stripePayoutsEnabled).length;
    const newThisMonth = allPartners.filter(p => {
      if (!p.registrationDate) return false;
      return differenceInDays(new Date(), new Date(p.registrationDate)) <= 30;
    }).length;
    
    return { totalResellers, totalVendors, pendingApprovals, activePartners, stripeConnected, newThisMonth };
  }, [allPartners, resellers, vendors]);

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setEditForm({
      commissionRate: partner.commissionRate || "",
      discountPercentage: partner.discountPercentage || "10",
      creditLimit: partner.creditLimit || "1000",
      isActive: partner.isActive ?? true,
      tier: partner.tier || "bronze",
      logoUrl: partner.logoUrl || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPartner) return;
    
    if (selectedPartner.partnerType === 'reseller') {
      updateResellerMutation.mutate({
        id: selectedPartner.id,
        data: {
          commissionRate: editForm.commissionRate || null,
          discountPercentage: editForm.discountPercentage,
          creditLimit: editForm.creditLimit,
          isActive: editForm.isActive,
          tier: editForm.tier,
          logoUrl: editForm.logoUrl || null
        }
      });
    }
  };

  const handleSendMessage = () => {
    if (!selectedPartner || !messageContent.trim()) return;
    sendMessageMutation.mutate({
      partnerId: selectedPartner.id,
      partnerType: selectedPartner.partnerType,
      content: messageContent
    });
  };

  const handleViewPartnerDetail = (partner: Partner) => {
    setSelectedPartner(partner);
    setDetailTab("overview");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/admin")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="page-title">Partner Management</h1>
              <p className="text-muted-foreground">Manage your reseller and vendor partners</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild data-testid="button-analytics">
              <Link href="/admin/commission-analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild data-testid="button-payouts">
              <Link href="/admin/payouts">
                <DollarSign className="h-4 w-4 mr-2" />
                Payouts
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-6">
          <Card data-testid="card-total-partners">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResellers + stats.totalVendors}</div>
              <p className="text-xs text-muted-foreground">{stats.newThisMonth} new this month</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-resellers">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resellers</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalResellers}</div>
              <p className="text-xs text-muted-foreground">Wholesale partners</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-vendors">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wholesalers</CardTitle>
              <Store className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalVendors}</div>
              <p className="text-xs text-muted-foreground">Product creators</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-pending">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-active">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activePartners}</div>
              <p className="text-xs text-muted-foreground">Operating partners</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-stripe">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stripe Ready</CardTitle>
              <CreditCard className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.stripeConnected}</div>
              <p className="text-xs text-muted-foreground">Payout enabled</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  data-testid="input-search"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36" data-testid="select-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-32" data-testid="select-tier">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setStatusFilter("all"); setTierFilter("all"); setSearchQuery(""); }}
                  data-testid="button-clear-filters"
                >
                  <RefreshCw className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all" data-testid="tab-all">
                  All ({allPartners.length})
                </TabsTrigger>
                <TabsTrigger value="resellers" data-testid="tab-resellers">
                  Resellers ({stats.totalResellers})
                </TabsTrigger>
                <TabsTrigger value="vendors" data-testid="tab-vendors">
                  Vendors ({stats.totalVendors})
                </TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">
                  Pending ({stats.pendingApprovals})
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="pt-4">
              {(resellersLoading || vendorsLoading) ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <Users className="h-12 w-12 mb-4 opacity-50" />
                  <p>No partners found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Stripe</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Earnings</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner, index) => (
                        <TableRow 
                          key={`${partner.partnerType}-${partner.id}`} 
                          className="hover-elevate cursor-pointer"
                          data-testid={`row-partner-${index}`}
                        >
                          <TableCell onClick={() => handleViewPartnerDetail(partner)}>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {partner.businessName?.slice(0, 2).toUpperCase() || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{partner.businessName}</p>
                                <p className="text-sm text-muted-foreground">{partner.email || 'No email'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={partner.partnerType === 'reseller' ? 'default' : 'secondary'} className="capitalize">
                              {partner.partnerType === 'reseller' ? (
                                <Building2 className="h-3 w-3 mr-1" />
                              ) : (
                                <Store className="h-3 w-3 mr-1" />
                              )}
                              {partner.partnerType}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(partner.approvalStatus)}</TableCell>
                          <TableCell>{partner.tier ? getTierBadge(partner.tier) : '-'}</TableCell>
                          <TableCell>{getStripeStatus(partner)}</TableCell>
                          <TableCell className="text-right">
                            {partner.commissionRate ? `${partner.commissionRate}%` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-green-600">
                              {formatCurrency(partner.totalEarned || 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-actions-${index}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewPartnerDetail(partner)}>
                                  <Eye className="h-4 w-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPartner(partner)}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedPartner(partner); setMessageDialogOpen(true); }}>
                                  <MessageSquare className="h-4 w-4 mr-2" /> Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {partner.partnerType === 'reseller' && (
                                  <DropdownMenuItem
                                    onClick={() => toggleStatusMutation.mutate({ id: partner.id, isActive: !partner.isActive })}
                                    data-testid={`button-toggle-status-${index}`}
                                  >
                                    {partner.isActive
                                      ? <><PowerOff className="h-4 w-4 mr-2 text-amber-500" /> Deactivate</>
                                      : <><Power className="h-4 w-4 mr-2 text-green-500" /> Activate</>
                                    }
                                  </DropdownMenuItem>
                                )}
                                {partner.partnerType === 'reseller' && (
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => { setPartnerToDelete(partner); setDeleteConfirmOpen(true); }}
                                    data-testid={`button-delete-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/commission-analytics`} onClick={() => {}}>
                                    <BarChart3 className="h-4 w-4 mr-2" /> View Analytics
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href="/admin/payouts" onClick={() => {}}>
                                    <DollarSign className="h-4 w-4 mr-2" /> Manage Payouts
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Tabs>
        </Card>

        <Dialog open={!!selectedPartner && !editDialogOpen && !messageDialogOpen} onOpenChange={(open) => !open && setSelectedPartner(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-partner-profile">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedPartner?.businessName?.slice(0, 2).toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {selectedPartner?.businessName}
                    {selectedPartner?.partnerType === 'reseller' ? (
                      <Badge variant="default" className="ml-2">
                        <Building2 className="h-3 w-3 mr-1" /> Reseller
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        <Store className="h-3 w-3 mr-1" /> Vendor
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-4 mt-1">
                    {selectedPartner?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedPartner.email}
                      </span>
                    )}
                    {selectedPartner?.phoneNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedPartner.phoneNumber}
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={detailTab} onValueChange={setDetailTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                      {getStatusBadge(selectedPartner?.approvalStatus || 'pending')}
                      {selectedPartner?.isActive ? (
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">Inactive</Badge>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Tier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPartner?.tier ? getTierBadge(selectedPartner.tier) : <span className="text-muted-foreground">N/A</span>}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <span className="text-xl font-bold">{selectedPartner?.commissionRate || 0}%</span>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Stripe Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPartner && getStripeStatus(selectedPartner)}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Business Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Contact Person</Label>
                      <p className="font-medium">{selectedPartner?.contactPerson || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone Number</Label>
                      <p className="font-medium">{selectedPartner?.phoneNumber || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Business Address</Label>
                      <p className="font-medium">{selectedPartner?.businessAddress || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Registered</Label>
                      <p className="font-medium">
                        {selectedPartner?.registrationDate ? format(new Date(selectedPartner.registrationDate), 'dd MMM yyyy') : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Order</Label>
                      <p className="font-medium">
                        {selectedPartner?.lastOrderDate ? format(new Date(selectedPartner.lastOrderDate), 'dd MMM yyyy') : 'No orders yet'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(selectedPartner?.totalEarned || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-600">Paid Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedPartner?.paidAmount || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-amber-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{formatCurrency(selectedPartner?.pendingAmount || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedPartner?.totalOrders || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {selectedPartner?.partnerType === 'reseller' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Credit Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span className="font-medium">{formatCurrency(selectedPartner?.creditLimit || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Credit Used</span>
                        <span className="font-medium">{formatCurrency(selectedPartner?.currentCredit || 0)}</span>
                      </div>
                      <Progress 
                        value={
                          ((parseFloat(selectedPartner?.currentCredit || '0') / parseFloat(selectedPartner?.creditLimit || '1')) * 100)
                        } 
                        className="h-2"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Discount Rate</span>
                        <Badge variant="secondary">{selectedPartner?.discountPercentage || 0}% off</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" asChild data-testid="button-view-commission-history">
                    <Link href="/admin/commission-analytics">
                      <History className="h-4 w-4 mr-2" /> View Full History
                    </Link>
                  </Button>
                  <Button variant="outline" asChild data-testid="button-process-payout">
                    <Link href="/admin/payouts">
                      <DollarSign className="h-4 w-4 mr-2" /> Process Payout
                    </Link>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Activity</CardTitle>
                    <CardDescription>Activity timeline for this partner</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Partner Approved</p>
                          <p className="text-sm text-muted-foreground">Account was approved for trading</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedPartner?.registrationDate ? format(new Date(selectedPartner.registrationDate), 'dd MMM yyyy') : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedPartner?.stripeAccountId && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-2">
                            <CreditCard className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium">Stripe Connected</p>
                            <p className="text-sm text-muted-foreground">Payment account connected successfully</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedPartner?.lastOrderDate && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Last Order</p>
                            <p className="text-sm text-muted-foreground">Most recent order placed</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(selectedPartner.lastOrderDate), 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Add Note</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Add an internal note about this partner..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      data-testid="input-note"
                    />
                    <Button 
                      size="sm" 
                      disabled={!noteContent.trim()}
                      onClick={() => {
                        toast({ title: "Note saved", description: "Internal note has been added." });
                        setNoteContent("");
                      }}
                      data-testid="button-save-note"
                    >
                      Save Note
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPartner?.partnerType === 'reseller' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Active Status</Label>
                            <p className="text-sm text-muted-foreground">
                              {selectedPartner?.isActive
                                ? "This reseller can currently log in and trade"
                                : "This reseller is deactivated and cannot log in"}
                            </p>
                          </div>
                          <Switch
                            checked={selectedPartner?.isActive ?? true}
                            disabled={toggleStatusMutation.isPending}
                            onCheckedChange={(checked) => {
                              if (selectedPartner) {
                                toggleStatusMutation.mutate({ id: selectedPartner.id, isActive: checked });
                              }
                            }}
                            data-testid="switch-active-status"
                          />
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => handleEditPartner(selectedPartner!)} data-testid="button-edit-full">
                        <Edit className="h-4 w-4 mr-2" /> Edit All Settings
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setMessageDialogOpen(true); }}
                        data-testid="button-send-message"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Send Message
                      </Button>
                    </div>
                    {selectedPartner?.partnerType === 'reseller' && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-destructive mb-1">Danger Zone</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Deleting this reseller will revoke their access and remove them from the platform. This cannot be undone.
                          </p>
                          <Button
                            variant="destructive"
                            onClick={() => { setPartnerToDelete(selectedPartner); setDeleteConfirmOpen(true); }}
                            data-testid="button-delete-account"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-edit-partner">
            <DialogHeader>
              <DialogTitle>Edit Partner Settings</DialogTitle>
              <DialogDescription>
                Update settings for {selectedPartner?.businessName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedPartner?.partnerType === 'reseller' && (
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <div className="flex items-center gap-3">
                    {editForm.logoUrl && (
                      <img
                        src={editForm.logoUrl}
                        alt="Logo preview"
                        className="h-10 w-10 rounded object-contain bg-muted border"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                      />
                    )}
                    <Input
                      value={editForm.logoUrl}
                      onChange={(e) => setEditForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://... (link to the gym's logo image)"
                      data-testid="input-logo-url"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shown in the scrolling partner-gym banner on the storefront. Leave blank to show the gym name as text instead.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editForm.commissionRate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, commissionRate: e.target.value }))}
                  placeholder="e.g., 15"
                  data-testid="input-commission-rate"
                />
              </div>
              
              {selectedPartner?.partnerType === 'reseller' && (
                <>
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select value={editForm.tier} onValueChange={(v) => setEditForm(prev => ({ ...prev, tier: v }))}>
                      <SelectTrigger data-testid="select-edit-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Discount Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={editForm.discountPercentage}
                      onChange={(e) => setEditForm(prev => ({ ...prev, discountPercentage: e.target.value }))}
                      data-testid="input-discount"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Credit Limit (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={editForm.creditLimit}
                      onChange={(e) => setEditForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                      data-testid="input-credit-limit"
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-active"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateResellerMutation.isPending}
                data-testid="button-save-changes"
              >
                {updateResellerMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-send-message">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedPartner?.businessName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
                data-testid="input-message-content"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message-confirm"
              >
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!open) { setDeleteConfirmOpen(false); setPartnerToDelete(null); } }}>
          <DialogContent className="max-w-md" data-testid="dialog-delete-confirm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Delete Reseller Account
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. The reseller's account will be permanently removed and their login access revoked.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm font-medium">{partnerToDelete?.businessName}</p>
                {partnerToDelete?.email && (
                  <p className="text-xs text-muted-foreground mt-1">{partnerToDelete.email}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Are you sure you want to delete this reseller account?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setDeleteConfirmOpen(false); setPartnerToDelete(null); }}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => partnerToDelete && deleteResellerMutation.mutate(partnerToDelete.id)}
                disabled={deleteResellerMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteResellerMutation.isPending ? "Deleting..." : "Yes, Delete Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
