import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield,
  Users,
  Store,
  Package,
  BarChart3,
  Receipt,
  Box,
  Megaphone,
  Edit,
  Trash2,
  Plus,
  Loader2,
  ChevronUp,
  Settings,
  Eye,
  Check,
  X,
  Clock,
  ArrowRight,
  Ticket,
} from "lucide-react";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Partner {
  id: string;
  businessName: string;
  userId: string;
  partnerType: 'reseller' | 'vendor';
  approvalStatus: string;
  capabilities: PartnerCapability[];
}

interface PartnerCapability {
  id: string;
  capability: string;
  enabled: boolean;
  notes?: string;
}

interface AdCampaign {
  id: string;
  name: string;
  description?: string;
  adContent: string;
  adType: 'banner' | 'video' | 'popup' | 'sidebar' | 'notification';
  status: 'draft' | 'active' | 'paused' | 'ended';
  createdAt: string;
  assignments: AdAssignment[];
}

interface AdAssignment {
  id: string;
  screenRegionId?: string;
  runMode: 'all_partners' | 'all_resellers' | 'all_vendors' | 'specific_partners';
  partnerType?: string;
  startAt: string;
  endAt?: string;
  isActive: boolean;
}

interface StockRequest {
  id: string;
  partnerType: string;
  partnerId: string;
  partnerName: string;
  requestedProducts: string;
  totalItems: number;
  estimatedValue: string;
  status: string;
  partnerNotes?: string;
  adminNotes?: string;
  createdAt: string;
}

interface PartnerCoupon {
  id: string;
  code: string;
  partnerType: 'reseller' | 'vendor';
  partnerId: string;
  partnerName?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: string;
  minOrderValue?: string;
  maxDiscount?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}

const CAPABILITY_OPTIONS = [
  { value: 'sell_1strep_products', label: 'Sell 1stRep Products', description: 'Can sell 1stRep products through their storefront', icon: Store },
  { value: 'add_own_products', label: 'Add Own Products', description: 'Can add and sell their own products (wholesaler only)', icon: Package },
  { value: 'request_stock', label: 'Request Stock', description: 'Can request stock from 1stRep', icon: Box },
  { value: 'manage_storefront', label: 'Manage Storefront', description: 'Can customise their storefront appearance', icon: Settings },
  { value: 'view_analytics', label: 'View Analytics', description: 'Access to sales and performance analytics', icon: BarChart3 },
  { value: 'process_epos', label: 'Process EPOS', description: 'Can use EPOS terminal for sales', icon: Receipt },
];

export default function AdminB2BAccess() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("partners");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [capabilitiesDialog, setCapabilitiesDialog] = useState(false);
  const [promoteDialog, setPromoteDialog] = useState<Partner | null>(null);
  const [adCampaignDialog, setAdCampaignDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [stockRequestDialog, setStockRequestDialog] = useState<StockRequest | null>(null);
  const [newCapabilities, setNewCapabilities] = useState<Record<string, boolean>>({});
  const [couponDialog, setCouponDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<PartnerCoupon | null>(null);
  
  const [couponForm, setCouponForm] = useState<{
    code: string;
    partnerType: 'reseller' | 'vendor';
    partnerId: string;
    discountType: string;
    discountValue: string;
    minOrderValue: string;
    maxDiscount: string;
    usageLimit: string;
    isActive: boolean;
    startsAt: string;
    expiresAt: string;
  }>({
    code: '',
    partnerType: 'reseller',
    partnerId: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: '',
    isActive: true,
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: '',
  });
  
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    adContent: '',
    adType: 'banner',
    status: 'draft',
    runMode: 'all_partners',
    displayLocation: 'both',
    startAt: '',
    endAt: '',
  });
  
  const { toast } = useToast();

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: partners = [], isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/b2b/partners"],
    enabled: !!authUser && authUser.role === "admin",
  });

  const { data: adCampaigns = [], isLoading: campaignsLoading } = useQuery<AdCampaign[]>({
    queryKey: ["/api/admin/b2b/ad-campaigns"],
    enabled: !!authUser && authUser.role === "admin",
  });

  const { data: stockRequests = [], isLoading: stockRequestsLoading } = useQuery<StockRequest[]>({
    queryKey: ["/api/admin/b2b/stock-requests"],
    enabled: !!authUser && authUser.role === "admin",
  });

  const { data: coupons = [], isLoading: couponsLoading } = useQuery<PartnerCoupon[]>({
    queryKey: ["/api/admin/b2b/coupons"],
    enabled: !!authUser && authUser.role === "admin",
  });

  const updateCapabilitiesMutation = useMutation({
    mutationFn: (data: { partnerType: string; partnerId: string; capabilities: any[] }) =>
      apiRequest("PUT", `/api/admin/b2b/partners/${data.partnerType}/${data.partnerId}/capabilities`, { 
        capabilities: data.capabilities 
      }),
    onSuccess: () => {
      toast({ title: "Capabilities updated successfully" });
      setCapabilitiesDialog(false);
      setSelectedPartner(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/partners"] });
    },
    onError: () => {
      toast({ title: "Failed to update capabilities", variant: "destructive" });
    }
  });

  const promoteToVendorMutation = useMutation({
    mutationFn: (resellerId: string) =>
      apiRequest("POST", `/api/admin/b2b/partners/promote/${resellerId}`, {}),
    onSuccess: () => {
      toast({ title: "Reseller promoted to wholesaler successfully" });
      setPromoteDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to promote reseller", variant: "destructive" });
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/b2b/ad-campaigns", data),
    onSuccess: () => {
      toast({ title: "Ad campaign created successfully" });
      setAdCampaignDialog(false);
      setCampaignForm({ name: '', description: '', adContent: '', adType: 'banner', status: 'draft', runMode: 'all_partners', displayLocation: 'both', startAt: '', endAt: '' });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/ad-campaigns"] });
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) =>
      apiRequest("PATCH", `/api/admin/b2b/ad-campaigns/${data.id}`, data.updates),
    onSuccess: () => {
      toast({ title: "Campaign updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/ad-campaigns"] });
    },
    onError: () => {
      toast({ title: "Failed to update campaign", variant: "destructive" });
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/b2b/ad-campaigns/${id}`, {}),
    onSuccess: () => {
      toast({ title: "Campaign deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/ad-campaigns"] });
    },
    onError: () => {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
    }
  });

  const updateStockRequestMutation = useMutation({
    mutationFn: (data: { id: string; status: string; adminNotes?: string }) =>
      apiRequest("PATCH", `/api/admin/b2b/stock-requests/${data.id}`, { status: data.status, adminNotes: data.adminNotes }),
    onSuccess: () => {
      toast({ title: "Stock request updated" });
      setStockRequestDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/stock-requests"] });
    },
    onError: () => {
      toast({ title: "Failed to update stock request", variant: "destructive" });
    }
  });

  const createCouponMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/b2b/coupons", data),
    onSuccess: () => {
      toast({ title: "Coupon created successfully" });
      setCouponDialog(false);
      setCouponForm({ code: '', partnerType: 'reseller', partnerId: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', isActive: true, startsAt: new Date().toISOString().slice(0, 16), expiresAt: '' });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/coupons"] });
    },
    onError: async (err: any) => {
      let msg = "Failed to create coupon";
      try { const j = await err?.response?.json?.(); if (j?.error) msg = j.error; } catch {}
      if (!msg || msg === "Failed to create coupon") {
        try { const t = err?.message || ""; if (t.includes(":")) msg = t.split(":").slice(1).join(":").trim() || msg; } catch {}
      }
      toast({ title: "Failed to create coupon", description: msg, variant: "destructive" });
    }
  });

  const updateCouponMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) =>
      apiRequest("PATCH", `/api/admin/b2b/coupons/${data.id}`, data.updates),
    onSuccess: () => {
      toast({ title: "Coupon updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/coupons"] });
    },
    onError: async (err: any) => {
      let msg = "Failed to update coupon";
      try { const j = await err?.response?.json?.(); if (j?.error) msg = j.error; } catch {}
      toast({ title: "Failed to update coupon", description: msg, variant: "destructive" });
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/b2b/coupons/${id}`, {}),
    onSuccess: () => {
      toast({ title: "Coupon deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/b2b/coupons"] });
    },
    onError: () => {
      toast({ title: "Failed to delete coupon", variant: "destructive" });
    }
  });

  const openCapabilitiesDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    const caps: Record<string, boolean> = {};
    CAPABILITY_OPTIONS.forEach(opt => {
      const existing = partner.capabilities.find(c => c.capability === opt.value);
      caps[opt.value] = existing?.enabled || false;
    });
    setNewCapabilities(caps);
    setCapabilitiesDialog(true);
  };

  const handleSaveCapabilities = () => {
    if (!selectedPartner) return;
    const capList = Object.entries(newCapabilities).map(([capability, enabled]) => ({ capability, enabled }));
    updateCapabilitiesMutation.mutate({
      partnerType: selectedPartner.partnerType,
      partnerId: selectedPartner.id,
      capabilities: capList,
    });
  };

  const handleEditCoupon = (coupon: PartnerCoupon) => {
    setSelectedCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      partnerType: coupon.partnerType as 'reseller' | 'vendor',
      partnerId: coupon.partnerId,
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue?.toString() || '',
      minOrderValue: coupon.minOrderValue?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      isActive: coupon.isActive,
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().split('T')[0] : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
    });
    setCouponDialog(true);
  };

  const handleSaveCoupon = () => {
    const couponData = {
      code: couponForm.code.toUpperCase(),
      partnerType: couponForm.partnerType,
      partnerId: couponForm.partnerId,
      discountType: couponForm.discountType,
      discountValue: couponForm.discountValue,
      minOrderValue: couponForm.minOrderValue || null,
      maxDiscount: couponForm.maxDiscount || null,
      usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
      isActive: couponForm.isActive,
      startsAt: couponForm.startsAt || null,
      expiresAt: couponForm.expiresAt || null,
    };

    if (selectedCoupon) {
      // Update existing coupon
      updateCouponMutation.mutate({ id: selectedCoupon.id, updates: couponData }, {
        onSuccess: () => {
          setCouponDialog(false);
          setSelectedCoupon(null);
          setCouponForm({ code: '', partnerType: 'reseller', partnerId: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', isActive: true, startsAt: new Date().toISOString().slice(0, 16), expiresAt: '' });
        }
      });
    } else {
      // Create new coupon
      createCouponMutation.mutate(couponData);
    }
  };

  const handleCloseCouponDialog = () => {
    setCouponDialog(false);
    setSelectedCoupon(null);
    setCouponForm({ code: '', partnerType: 'reseller', partnerId: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', isActive: true, startsAt: '', expiresAt: '' });
  };

  const handleCreateCampaign = () => {
    const assignments = [{
      runMode: campaignForm.runMode,
      isActive: true,
      startAt: campaignForm.startAt || new Date().toISOString(),
      endAt: campaignForm.endAt || null,
    }];
    createCampaignMutation.mutate({
      ...campaignForm,
      assignments,
    });
  };

  // Conditional returns after all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!authUser || authUser.role !== "admin") {
    setLocation("/");
    return null;
  }

  const resellers = partners.filter(p => p.partnerType === 'reseller');
  const vendors = partners.filter(p => p.partnerType === 'vendor');

  const pendingRequests = stockRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">B2B Access Management</h1>
            <p className="text-muted-foreground mt-1">Control partner capabilities, stock requests, and advertising</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" data-testid="button-back-admin">Back to Admin</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-reseller-count">{resellers.length}</div>
                <div className="text-sm text-muted-foreground">Resellers</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-vendor-count">{vendors.length}</div>
                <div className="text-sm text-muted-foreground">Wholesalers</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Box className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-pending-requests">{pendingRequests.length}</div>
                <div className="text-sm text-muted-foreground">Pending Requests</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Megaphone className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-active-campaigns">
                  {adCampaigns.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Campaigns</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="partners" data-testid="tab-partners">
              <Shield className="h-4 w-4 mr-2" />
              Partner Capabilities
            </TabsTrigger>
            <TabsTrigger value="stock-requests" data-testid="tab-stock-requests">
              <Box className="h-4 w-4 mr-2" />
              Stock Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <Megaphone className="h-4 w-4 mr-2" />
              Ad Campaigns
            </TabsTrigger>
            <TabsTrigger value="coupons" data-testid="tab-coupons">
              <Ticket className="h-4 w-4 mr-2" />
              Coupons
              {coupons.filter(c => c.isActive).length > 0 && (
                <Badge className="ml-2">{coupons.filter(c => c.isActive).length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <CardTitle>Partner Access Control</CardTitle>
                <CardDescription>
                  Manage what each B2B partner can do on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : partners.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No B2B partners registered yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Capabilities</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={`${partner.partnerType}-${partner.id}`}>
                          <TableCell className="font-medium">
                            {partner.businessName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={partner.partnerType === 'vendor' ? 'default' : 'secondary'}>
                              {partner.partnerType === 'vendor' ? 'Wholesaler' : 'Reseller'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={partner.approvalStatus === 'approved' ? 'outline' : 'destructive'}
                              className={partner.approvalStatus === 'approved' ? 'text-green-600 border-green-600' : ''}
                            >
                              {partner.approvalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {partner.capabilities.filter(c => c.enabled).length > 0 ? (
                                partner.capabilities.filter(c => c.enabled).slice(0, 3).map(cap => (
                                  <Badge key={cap.id} variant="outline" className="text-xs">
                                    {cap.capability.replace(/_/g, ' ')}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">Default</span>
                              )}
                              {partner.capabilities.filter(c => c.enabled).length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{partner.capabilities.filter(c => c.enabled).length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCapabilitiesDialog(partner)}
                                data-testid={`button-edit-capabilities-${partner.id}`}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Configure
                              </Button>
                              {partner.partnerType === 'reseller' && partner.approvalStatus === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setPromoteDialog(partner)}
                                  data-testid={`button-promote-${partner.id}`}
                                >
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Promote
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-requests">
            <Card>
              <CardHeader>
                <CardTitle>Stock Requests</CardTitle>
                <CardDescription>
                  Manage requests from partners to receive stock from 1stRep
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stockRequestsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : stockRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No stock requests yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Est. Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.partnerName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.partnerType}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.totalItems}</TableCell>
                          <TableCell>£{parseFloat(request.estimatedValue || '0').toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'rejected' ? 'destructive' :
                                request.status === 'pending' ? 'secondary' : 'outline'
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStockRequestDialog(request)}
                              data-testid={`button-view-request-${request.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Ad Campaigns</CardTitle>
                  <CardDescription>
                    Create and manage advertising content for partner screens
                  </CardDescription>
                </div>
                <Button onClick={() => setAdCampaignDialog(true)} data-testid="button-create-campaign">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : adCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No ad campaigns yet. Create one to display content on partner screens.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adCampaigns.map((campaign) => (
                      <Card key={campaign.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{campaign.name}</h3>
                                <Badge variant={
                                  campaign.status === 'active' ? 'default' :
                                  campaign.status === 'paused' ? 'secondary' :
                                  campaign.status === 'ended' ? 'outline' : 'secondary'
                                }>
                                  {campaign.status}
                                </Badge>
                                <Badge variant="outline">{campaign.adType}</Badge>
                              </div>
                              {campaign.description && (
                                <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                              )}
                              <div className="text-sm text-muted-foreground">
                                Created: {new Date(campaign.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {campaign.status === 'draft' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCampaignMutation.mutate({ 
                                    id: campaign.id, 
                                    updates: { status: 'active' }
                                  })}
                                  data-testid={`button-activate-campaign-${campaign.id}`}
                                >
                                  Activate
                                </Button>
                              )}
                              {campaign.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCampaignMutation.mutate({ 
                                    id: campaign.id, 
                                    updates: { status: 'paused' }
                                  })}
                                  data-testid={`button-pause-campaign-${campaign.id}`}
                                >
                                  Pause
                                </Button>
                              )}
                              {campaign.status === 'paused' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateCampaignMutation.mutate({ 
                                    id: campaign.id, 
                                    updates: { status: 'active' }
                                  })}
                                  data-testid={`button-resume-campaign-${campaign.id}`}
                                >
                                  Resume
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                                data-testid={`button-delete-campaign-${campaign.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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

          <TabsContent value="coupons">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Partner Coupons</CardTitle>
                  <CardDescription>
                    Create and manage promotional codes for B2B partners
                  </CardDescription>
                </div>
                <Button onClick={() => setCouponDialog(true)} data-testid="button-create-coupon">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Coupon
                </Button>
              </CardHeader>
              <CardContent>
                {couponsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No coupons created yet. Create one to offer discounts to partners.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell>
                            <code className="px-2 py-1 bg-muted rounded font-mono text-sm">{coupon.code}</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">{coupon.partnerType}</Badge>
                              <span className="text-sm">{coupon.partnerName || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : `£${coupon.discountValue}`}
                          </TableCell>
                          <TableCell>
                            {coupon.usageLimit 
                              ? `${coupon.usageCount}/${coupon.usageLimit}` 
                              : `${coupon.usageCount} uses`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={coupon.isActive ? "default" : "secondary"}>
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {coupon.expiresAt 
                              ? new Date(coupon.expiresAt).toLocaleDateString() 
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditCoupon(coupon)}
                                data-testid={`button-edit-coupon-${coupon.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCouponMutation.mutate({
                                  id: coupon.id,
                                  updates: { isActive: !coupon.isActive }
                                })}
                                data-testid={`button-toggle-coupon-${coupon.id}`}
                              >
                                {coupon.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteCouponMutation.mutate(coupon.id)}
                                data-testid={`button-delete-coupon-${coupon.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={capabilitiesDialog} onOpenChange={setCapabilitiesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Capabilities</DialogTitle>
            <DialogDescription>
              Set what {selectedPartner?.businessName} can do on the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {CAPABILITY_OPTIONS.map((option) => {
              if (option.value === 'add_own_products' && selectedPartner?.partnerType !== 'vendor') {
                return null;
              }
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                  <Switch
                    checked={newCapabilities[option.value] || false}
                    onCheckedChange={(checked) => setNewCapabilities(prev => ({ ...prev, [option.value]: checked }))}
                    data-testid={`switch-capability-${option.value}`}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCapabilitiesDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCapabilities}
              disabled={updateCapabilitiesMutation.isPending}
              data-testid="button-save-capabilities"
            >
              {updateCapabilitiesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!promoteDialog} onOpenChange={() => setPromoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to Wholesaler</DialogTitle>
            <DialogDescription>
              This will promote {promoteDialog?.businessName} from a reseller to a wholesaler. 
              They will gain the ability to add and sell their own products.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">What happens next:</h4>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  A new wholesaler account will be created
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  User role will be updated to wholesaler
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Default wholesaler capabilities will be granted
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Original reseller record will be marked as promoted
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => promoteDialog && promoteToVendorMutation.mutate(promoteDialog.id)}
              disabled={promoteToVendorMutation.isPending}
              data-testid="button-confirm-promote"
            >
              {promoteToVendorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Promote to Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adCampaignDialog} onOpenChange={setAdCampaignDialog}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Ad Campaign</DialogTitle>
            <DialogDescription>
              Create a new advertising campaign to display on partner screens
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-[350px] overflow-y-auto pr-2 border rounded-md">
            <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Summer Sale Promo"
                data-testid="input-campaign-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description (Optional)</Label>
              <Input
                id="campaign-description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the campaign"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-content">Ad Content</Label>
              <Textarea
                id="campaign-content"
                value={campaignForm.adContent}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, adContent: e.target.value }))}
                placeholder="Enter the ad text, HTML, or image URL"
                rows={4}
                data-testid="input-campaign-content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Type</Label>
                <Select
                  value={campaignForm.adType}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, adType: value }))}
                >
                  <SelectTrigger data-testid="select-ad-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={campaignForm.runMode}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, runMode: value }))}
                >
                  <SelectTrigger data-testid="select-run-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_partners">All Partners</SelectItem>
                    <SelectItem value="all_resellers">All Resellers</SelectItem>
                    <SelectItem value="all_vendors">All Wholesalers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Location</Label>
                <Select
                  value={campaignForm.displayLocation}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, displayLocation: value }))}
                >
                  <SelectTrigger data-testid="select-display-location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Website & EPOS</SelectItem>
                    <SelectItem value="website">Website Only</SelectItem>
                    <SelectItem value="epos">EPOS Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campaign Status</Label>
                <Select
                  value={campaignForm.status}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="select-campaign-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active (Live Now)</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-at">Start Date & Time</Label>
                <Input
                  id="start-at"
                  type="datetime-local"
                  value={campaignForm.startAt}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, startAt: e.target.value }))}
                  data-testid="input-start-at"
                />
                <p className="text-xs text-muted-foreground">Leave blank to start immediately</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-at">End Date & Time</Label>
                <Input
                  id="end-at"
                  type="datetime-local"
                  value={campaignForm.endAt}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, endAt: e.target.value }))}
                  data-testid="input-end-at"
                />
                <p className="text-xs text-muted-foreground">Leave blank to run indefinitely</p>
              </div>
            </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdCampaignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampaign}
              disabled={!campaignForm.name || !campaignForm.adContent || createCampaignMutation.isPending}
              data-testid="button-create-campaign-submit"
            >
              {createCampaignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!stockRequestDialog} onOpenChange={() => setStockRequestDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Stock Request Details</DialogTitle>
            <DialogDescription>
              Review the stock request from {stockRequestDialog?.partnerName}
            </DialogDescription>
          </DialogHeader>
          {stockRequestDialog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Partner</Label>
                  <div className="font-medium">{stockRequestDialog.partnerName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="font-medium capitalize">{stockRequestDialog.partnerType}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Items</Label>
                  <div className="font-medium">{stockRequestDialog.totalItems}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estimated Value</Label>
                  <div className="font-medium">£{parseFloat(stockRequestDialog.estimatedValue || '0').toFixed(2)}</div>
                </div>
              </div>
              {stockRequestDialog.partnerNotes && (
                <div>
                  <Label className="text-muted-foreground">Partner Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    {stockRequestDialog.partnerNotes}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Requested Products</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-40">
                  {stockRequestDialog.requestedProducts}
                </div>
              </div>
              {stockRequestDialog.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => updateStockRequestMutation.mutate({ id: stockRequestDialog.id, status: 'rejected' })}
                    disabled={updateStockRequestMutation.isPending}
                    data-testid="button-reject-request"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => updateStockRequestMutation.mutate({ id: stockRequestDialog.id, status: 'approved' })}
                    disabled={updateStockRequestMutation.isPending}
                    data-testid="button-approve-request"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={couponDialog} onOpenChange={(open) => { if (!open) handleCloseCouponDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCoupon ? 'Edit Partner Coupon' : 'Create Partner Coupon'}</DialogTitle>
            <DialogDescription>
              Create a promotional code for a B2B partner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Coupon Code</Label>
              <Input
                id="coupon-code"
                placeholder="e.g., PARTNER20"
                value={couponForm.code}
                onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                data-testid="input-coupon-code"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Partner Type</Label>
                <Select
                  value={couponForm.partnerType}
                  onValueChange={(value: 'reseller' | 'vendor') => setCouponForm(prev => ({ ...prev, partnerType: value, partnerId: '' }))}
                >
                  <SelectTrigger data-testid="select-partner-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reseller">Reseller</SelectItem>
                    <SelectItem value="vendor">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Partner</Label>
                <Select
                  value={couponForm.partnerId}
                  onValueChange={(value) => setCouponForm(prev => ({ ...prev, partnerId: value }))}
                >
                  <SelectTrigger data-testid="select-partner">
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.filter(p => p.partnerType === couponForm.partnerType).length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        No {couponForm.partnerType}s available
                      </div>
                    ) : (
                      partners
                        .filter(p => p.partnerType === couponForm.partnerType)
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.businessName}</SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={couponForm.discountType}
                  onValueChange={(value) => setCouponForm(prev => ({ ...prev, discountType: value }))}
                >
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value">Discount Value</Label>
                <Input
                  id="discount-value"
                  type="number"
                  placeholder={couponForm.discountType === 'percentage' ? '10' : '5.00'}
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))}
                  data-testid="input-discount-value"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-order">Minimum Order (£)</Label>
                <Input
                  id="min-order"
                  type="number"
                  placeholder="Optional"
                  value={couponForm.minOrderValue}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                  data-testid="input-min-order"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-discount">Max Discount (£)</Label>
                <Input
                  id="max-discount"
                  type="number"
                  placeholder="Optional"
                  value={couponForm.maxDiscount}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                  data-testid="input-max-discount"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage-limit">Usage Limit</Label>
              <Input
                id="usage-limit"
                type="number"
                placeholder="Leave blank for unlimited"
                value={couponForm.usageLimit}
                onChange={(e) => setCouponForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                data-testid="input-usage-limit"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-starts">Start Date</Label>
                <Input
                  id="coupon-starts"
                  type="datetime-local"
                  value={couponForm.startsAt}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, startsAt: e.target.value }))}
                  data-testid="input-coupon-starts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-expires">Expiry Date</Label>
                <Input
                  id="coupon-expires"
                  type="datetime-local"
                  value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  data-testid="input-coupon-expires"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCouponDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCoupon}
              disabled={!couponForm.code || !couponForm.partnerId || !couponForm.discountValue || createCouponMutation.isPending || updateCouponMutation.isPending}
              data-testid="button-save-coupon-submit"
            >
              {(createCouponMutation.isPending || updateCouponMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
