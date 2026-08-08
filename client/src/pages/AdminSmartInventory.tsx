import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, Bell, TrendingUp, TrendingDown, Package, RefreshCw,
  CheckCircle2, Clock, Loader2, Search, ArrowUpRight, ArrowDownRight,
  Minus, ShoppingCart, AlertCircle, Zap, Warehouse, BarChart3,
  ChevronDown, ChevronRight, DollarSign, Activity, Filter, Tag,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type AlertEvent = {
  id: string; ruleId: string; alertType: string; severity: string;
  productId: string; variantId?: string; warehouseId?: string;
  title: string; message: string; currentValue: number; thresholdValue: number;
  suggestedAction?: string; isResolved: boolean; resolvedAt?: string;
  snoozedUntil?: string; createdAt: string;
};

type VelocityMetric = {
  metric: {
    id: string; productId: string; salesLast7Days: number; salesLast30Days: number;
    salesLast90Days: number; avgDailySales: string; daysOfStock: string;
    demandClass: string; velocityTrend: string; lastSaleDate: string;
  };
  product: { id: string; name: string; sku: string; imageUrl: string; category: string; };
};

type ReorderSuggestion = {
  suggestion: {
    id: string; productId: string; warehouseId: string; currentStock: number;
    suggestedOrderQuantity: number; reorderPoint: number; safetyStock: number;
    estimatedCost: string; avgDailySales: string; leadTimeDays: number;
    daysOfStockRemaining: string; priority: string; urgencyScore: number; status: string;
  };
  product: { id: string; name: string; sku: string; imageUrl: string; category: string; wholesalePrice: string; };
  warehouse: { id: string; name: string; code: string; };
};

type InventoryOverviewItem = {
  product: { id: string; name: string; sku: string; imageUrl: string; category: string; };
  totalStock: number; stockCostValue: number; stockRetailValue: number;
  potentialProfit: number; margin: number; costPrice: number; retailPrice: number;
  stockHealth: 'healthy' | 'warning' | 'critical' | 'out_of_stock';
  demandClass: string; velocityTrend: string; avgDailySales: number;
  daysOfStock: number | null; lastSaleDate: string | null;
  variantCount: number;
  variantBreakdown: { id: string; size: string; color: string; sku: string; stock: number; costPrice: number; retailPrice: number; }[];
};

type InventoryOverview = {
  products: InventoryOverviewItem[];
  summary: {
    totalProducts: number; healthy: number; warning: number; critical: number;
    outOfStock: number; totalCostValue: number; totalRetailValue: number;
    totalPotentialProfit: number; totalUnits: number;
  };
};

type DashboardSummary = {
  alerts: { critical: number; warning: number; info: number; total: number; };
  reorderSuggestions: { pending: number; totalValue: string; };
  inventory: { totalStockValue: string; totalCostValue: string; lowStockItems: number; };
  demandClassification: Record<string, number>;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

export default function AdminSmartInventory() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [alertStatusFilter, setAlertStatusFilter] = useState("active");
  const [selectedAlert, setSelectedAlert] = useState<AlertEvent | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [overviewSearch, setOverviewSearch] = useState("");
  const [overviewCategory, setOverviewCategory] = useState("all");
  const [overviewHealth, setOverviewHealth] = useState("all");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery<DashboardSummary>({
    queryKey: ["/api/admin/smart-inventory/dashboard"],
  });

  const { data: alertsData, isLoading: loadingAlerts, isError: alertsError, refetch: refetchAlerts } = useQuery<{
    alerts: Array<{ alert: AlertEvent; product: any; warehouse: any }>;
    summary: any;
  }>({
    queryKey: ["/api/admin/smart-inventory/alerts", alertStatusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/smart-inventory/alerts?status=${alertStatusFilter}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
  });

  const { data: velocityData, isLoading: loadingVelocity } = useQuery<VelocityMetric[]>({
    queryKey: ["/api/admin/smart-inventory/velocity"],
  });

  const { data: reorderData, isLoading: loadingReorders } = useQuery<ReorderSuggestion[]>({
    queryKey: ["/api/admin/smart-inventory/reorder-suggestions"],
  });

  const { data: inventoryOverview, isLoading: loadingOverview } = useQuery<InventoryOverview>({
    queryKey: ["/api/admin/smart-inventory/inventory-overview"],
    enabled: activeTab === "products",
  });

  const scanAlertsMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/admin/smart-inventory/scan-alerts"); return r.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/dashboard"] });
      toast({ title: "Scan Complete", description: `Created ${data.newAlertsCreated} new alerts` });
    },
    onError: (error: any) => toast({ title: "Scan Failed", description: error.message, variant: "destructive" }),
  });

  const calculateVelocityMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/admin/smart-inventory/velocity/calculate"); return r.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/velocity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/inventory-overview"] });
      toast({ title: "Velocity Calculated", description: `Updated metrics for ${data.productsUpdated} products` });
    },
    onError: (error: any) => toast({ title: "Calculation Failed", description: error.message, variant: "destructive" }),
  });

  const generateReordersMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/admin/smart-inventory/reorder-suggestions/generate", { leadTimeDays: 7 }); return r.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/reorder-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/dashboard"] });
      toast({ title: "Suggestions Generated", description: `Created ${data.suggestionsGenerated} reorder suggestions` });
    },
    onError: (error: any) => toast({ title: "Generation Failed", description: error.message, variant: "destructive" }),
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const r = await apiRequest("PATCH", `/api/admin/smart-inventory/alerts/${id}/resolve`, { resolutionNotes: notes });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/dashboard"] });
      toast({ title: "Alert Resolved" });
      setResolveDialogOpen(false); setSelectedAlert(null); setResolutionNotes("");
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const snoozeAlertMutation = useMutation({
    mutationFn: async ({ id, hours }: { id: string; hours: number }) => {
      const r = await apiRequest("PATCH", `/api/admin/smart-inventory/alerts/${id}/snooze`, { hours });
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/alerts"] }); toast({ title: "Alert Snoozed" }); },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await apiRequest("PATCH", `/api/admin/smart-inventory/reorder-suggestions/${id}`, { status });
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-inventory/reorder-suggestions"] }); toast({ title: "Suggestion Updated" }); },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "warning": return <Badge className="bg-amber-500">Warning</Badge>;
      default: return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getDemandClassBadge = (demandClass: string) => {
    switch (demandClass) {
      case "fast_mover": return <Badge className="bg-green-500">Fast Mover</Badge>;
      case "steady": return <Badge className="bg-blue-500">Steady</Badge>;
      case "slow_mover": return <Badge className="bg-amber-500">Slow Mover</Badge>;
      case "dead_stock": return <Badge variant="destructive">Dead Stock</Badge>;
      default: return <Badge variant="outline">New</Badge>;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "healthy": return <Badge className="bg-green-500">Healthy</Badge>;
      case "warning": return <Badge className="bg-amber-500">Low</Badge>;
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "out_of_stock": return <Badge variant="destructive">Out of Stock</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing": return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "decreasing": return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredVelocity = velocityData?.filter(v =>
    v.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const categories = ["all", ...Array.from(new Set((inventoryOverview?.products || []).map(p => p.product.category).filter(Boolean)))];

  const filteredOverview = (inventoryOverview?.products || []).filter(p => {
    const matchSearch = !overviewSearch ||
      p.product.name.toLowerCase().includes(overviewSearch.toLowerCase()) ||
      p.product.sku?.toLowerCase().includes(overviewSearch.toLowerCase());
    const matchCategory = overviewCategory === "all" || p.product.category === overviewCategory;
    const matchHealth = overviewHealth === "all" || p.stockHealth === overviewHealth;
    return matchSearch && matchCategory && matchHealth;
  }).sort((a, b) => {
    const healthOrder = { out_of_stock: 0, critical: 1, warning: 2, healthy: 3 };
    return (healthOrder[a.stockHealth] ?? 4) - (healthOrder[b.stockHealth] ?? 4);
  });

  const toggleExpand = (id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Smart Inventory</h1>
          <p className="text-muted-foreground">AI-powered inventory management and analytics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => scanAlertsMutation.mutate()} disabled={scanAlertsMutation.isPending} data-testid="button-scan-alerts">
            {scanAlertsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
            Scan Alerts
          </Button>
          <Button variant="outline" onClick={() => calculateVelocityMutation.mutate()} disabled={calculateVelocityMutation.isPending} data-testid="button-calculate-velocity">
            {calculateVelocityMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Calculate Velocity
          </Button>
          <Button onClick={() => generateReordersMutation.mutate()} disabled={generateReordersMutation.isPending} data-testid="button-generate-reorders">
            {generateReordersMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Generate Reorders
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="h-4 w-4 mr-2" />Products
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />Alerts
            {dashboardData?.alerts?.total ? <Badge className="ml-2" variant="destructive">{dashboardData.alerts.total}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="velocity" data-testid="tab-velocity">
            <TrendingUp className="h-4 w-4 mr-2" />Velocity
          </TabsTrigger>
          <TabsTrigger value="reorders" data-testid="tab-reorders">
            <ShoppingCart className="h-4 w-4 mr-2" />Reorders
            {dashboardData?.reorderSuggestions?.pending ? <Badge className="ml-2">{dashboardData.reorderSuggestions.pending}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD TAB ── */}
        <TabsContent value="dashboard" className="space-y-6">
          {loadingDashboard ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <Card data-testid="card-total-stock-value">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Wholesale Value</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      £{parseFloat(dashboardData?.inventory?.totalStockValue || "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">Total stock at wholesale</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-total-cost-value">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Cost Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      £{parseFloat(dashboardData?.inventory?.totalCostValue || "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">Total stock at cost price</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-active-alerts">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.alerts?.total || 0}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {dashboardData?.alerts?.critical ? <Badge variant="destructive" className="text-xs">{dashboardData.alerts.critical} Critical</Badge> : null}
                      {dashboardData?.alerts?.warning ? <Badge className="bg-amber-500 text-xs">{dashboardData.alerts.warning} Warning</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-low-stock">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.inventory?.lowStockItems || 0}</div>
                    <p className="text-xs text-muted-foreground">Below minimum stock level</p>
                  </CardContent>
                </Card>
                <Card data-testid="card-pending-reorders">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">Pending Reorders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.reorderSuggestions?.pending || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Est. £{parseFloat(dashboardData?.reorderSuggestions?.totalValue || "0").toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-demand-classification">
                  <CardHeader>
                    <CardTitle>Demand Classification</CardTitle>
                    <CardDescription>Products by sales velocity category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dashboardData?.demandClassification || {}).map(([cls, count]) => {
                        const total = Object.values(dashboardData?.demandClassification || {}).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={cls} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getDemandClassBadge(cls)}
                              </div>
                              <span className="text-sm font-semibold">{count} ({pct}%)</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        );
                      })}
                      {Object.keys(dashboardData?.demandClassification || {}).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No velocity data available. Click "Calculate Velocity" to generate.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-quick-actions">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common inventory management tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("products")} data-testid="button-view-products">
                      <Package className="h-4 w-4 mr-2" />View Products Overview
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("alerts")} data-testid="button-view-alerts">
                      <AlertTriangle className="h-4 w-4 mr-2" />View Active Alerts
                      {dashboardData?.alerts?.critical ? <Badge variant="destructive" className="ml-auto">{dashboardData.alerts.critical}</Badge> : null}
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("reorders")} data-testid="button-view-reorders">
                      <ShoppingCart className="h-4 w-4 mr-2" />Review Reorder Suggestions
                    </Button>
                    <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = "/admin/warehouses"} data-testid="button-manage-warehouses">
                      <Warehouse className="h-4 w-4 mr-2" />Manage Warehouses
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── PRODUCTS OVERVIEW TAB ── */}
        <TabsContent value="products" className="space-y-6">
          {loadingOverview ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : inventoryOverview ? (
            <>
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventoryOverview.summary.totalUnits.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{inventoryOverview.summary.totalProducts} products</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Stock Cost Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{fmt(inventoryOverview.summary.totalCostValue)}</div>
                    <p className="text-xs text-muted-foreground">At cost price</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Retail Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{fmt(inventoryOverview.summary.totalRetailValue)}</div>
                    <p className="text-xs text-muted-foreground">At retail price</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{fmt(inventoryOverview.summary.totalPotentialProfit)}</div>
                    <p className="text-xs text-muted-foreground">If all stock sold at retail</p>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Health Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Healthy", key: "healthy", count: inventoryOverview.summary.healthy, color: "bg-green-500" },
                  { label: "Low Stock", key: "warning", count: inventoryOverview.summary.warning, color: "bg-amber-500" },
                  { label: "Critical", key: "critical", count: inventoryOverview.summary.critical, color: "bg-red-500" },
                  { label: "Out of Stock", key: "out_of_stock", count: inventoryOverview.summary.outOfStock, color: "bg-gray-400" },
                ].map(({ label, key, count, color }) => (
                  <button
                    key={key}
                    onClick={() => setOverviewHealth(overviewHealth === key ? "all" : key)}
                    className={`rounded-md border p-3 text-left transition-all hover-elevate ${overviewHealth === key ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                  </button>
                ))}
              </div>

              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by name or SKU..." value={overviewSearch} onChange={(e) => setOverviewSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={overviewCategory} onValueChange={setOverviewCategory}>
                      <SelectTrigger className="w-44">
                        <Tag className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={overviewHealth} onValueChange={setOverviewHealth}>
                      <SelectTrigger className="w-44">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Stock Health" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Health</SelectItem>
                        <SelectItem value="healthy">Healthy</SelectItem>
                        <SelectItem value="warning">Low Stock</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">{filteredOverview.length} products</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead className="text-right">Cost / Unit</TableHead>
                          <TableHead className="text-right">Retail / Unit</TableHead>
                          <TableHead className="text-right">Margin %</TableHead>
                          <TableHead className="text-right">Cost Value</TableHead>
                          <TableHead className="text-right">Retail Value</TableHead>
                          <TableHead className="text-right">Potential Profit</TableHead>
                          <TableHead>Demand</TableHead>
                          <TableHead>Days of Stock</TableHead>
                          <TableHead>Last Sold</TableHead>
                          <TableHead>Health</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOverview.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
                              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              No products match your filters
                            </TableCell>
                          </TableRow>
                        ) : filteredOverview.map((item) => {
                          const isExpanded = expandedProducts.has(item.product.id);
                          return (
                            <>
                              <TableRow
                                key={item.product.id}
                                className={`cursor-pointer hover:bg-muted/50 ${item.stockHealth === 'out_of_stock' ? 'opacity-60' : ''}`}
                                onClick={() => toggleExpand(item.product.id)}
                                data-testid={`row-product-${item.product.id}`}
                              >
                                <TableCell className="text-center">
                                  {item.variantCount > 0 ? (
                                    isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  ) : null}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {item.product.imageUrl && (
                                      <img src={item.product.imageUrl} alt={item.product.name} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                                    )}
                                    <div>
                                      <p className="font-semibold text-sm leading-tight">{item.product.name}</p>
                                      <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{item.product.category || "—"}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="font-bold">{item.totalStock}</span>
                                    <span className="text-xs text-muted-foreground">{item.variantCount} variants</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">{fmt(item.costPrice)}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{fmt(item.retailPrice)}</TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-semibold text-sm ${item.margin >= 40 ? 'text-green-600' : item.margin >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {item.margin.toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-orange-600">{fmt(item.stockCostValue)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-blue-600">{fmt(item.stockRetailValue)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-green-600 font-semibold">{fmt(item.potentialProfit)}</TableCell>
                                <TableCell>{getDemandClassBadge(item.demandClass)}</TableCell>
                                <TableCell>
                                  {item.daysOfStock !== null ? (
                                    <div className="flex flex-col gap-1 min-w-[80px]">
                                      <Progress value={Math.min(100, (item.daysOfStock / 60) * 100)} className="h-1.5" />
                                      <span className={`text-xs font-mono ${item.daysOfStock < 14 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                        {item.daysOfStock.toFixed(0)}d
                                      </span>
                                    </div>
                                  ) : <span className="text-xs text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {item.lastSaleDate ? formatDistanceToNow(new Date(item.lastSaleDate), { addSuffix: true }) : "Never"}
                                </TableCell>
                                <TableCell>{getHealthBadge(item.stockHealth)}</TableCell>
                              </TableRow>
                              {isExpanded && item.variantBreakdown.length > 0 && (
                                <TableRow key={`${item.product.id}-variants`} className="bg-muted/30">
                                  <TableCell />
                                  <TableCell colSpan={13} className="py-2 px-4">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Variant Breakdown</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {item.variantBreakdown.map(v => (
                                        <div key={v.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                                          <div>
                                            <p className="text-xs font-semibold">{[v.size, v.color].filter(Boolean).join(" / ") || v.sku}</p>
                                            {v.sku && <p className="text-xs text-muted-foreground">{v.sku}</p>}
                                          </div>
                                          <Badge variant={v.stock === 0 ? "destructive" : v.stock <= 5 ? "default" : "secondary"} className="text-xs ml-2">
                                            {v.stock} units
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No inventory data available</p>
            </div>
          )}
        </TabsContent>

        {/* ── ALERTS TAB ── */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory Alerts</CardTitle>
                <Select value={alertStatusFilter} onValueChange={setAlertStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-alert-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : alertsError ? (
                <div className="text-center py-12 text-muted-foreground" data-testid="alerts-error-state">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
                  <p>Failed to load alerts</p>
                  <Button variant="outline" onClick={() => refetchAlerts()} className="mt-4" data-testid="button-retry-alerts">
                    <RefreshCw className="h-4 w-4 mr-2" />Retry
                  </Button>
                </div>
              ) : alertsData?.alerts?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts found</p>
                  <p className="text-sm">Click "Scan Alerts" to check for inventory issues</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Alert</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Current / Threshold</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertsData?.alerts?.map(({ alert, product }) => (
                      <TableRow key={alert.id} data-testid={`row-alert-${alert.id}`}>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product?.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded object-cover" />}
                            <div>
                              <p className="font-medium">{product?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{product?.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><span className="font-mono">{alert.currentValue} / {alert.thresholdValue}</span></TableCell>
                        <TableCell>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {!alert.isResolved && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => snoozeAlertMutation.mutate({ id: alert.id, hours: 24 })} data-testid={`button-snooze-${alert.id}`}>
                                <Clock className="h-3 w-3 mr-1" />Snooze
                              </Button>
                              <Button size="sm" onClick={() => { setSelectedAlert(alert); setResolveDialogOpen(true); }} data-testid={`button-resolve-${alert.id}`}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />Resolve
                              </Button>
                            </>
                          )}
                          {alert.isResolved && <Badge variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── VELOCITY TAB ── */}
        <TabsContent value="velocity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Velocity Metrics</CardTitle>
                  <CardDescription>Product demand analysis and stock predictions</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" data-testid="input-search-velocity" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingVelocity ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : filteredVelocity.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No velocity data available</p>
                  <p className="text-sm">Click "Calculate Velocity" to analyse sales patterns</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Demand Class</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead className="text-right">7d Sales</TableHead>
                      <TableHead className="text-right">30d Sales</TableHead>
                      <TableHead className="text-right">90d Sales</TableHead>
                      <TableHead className="text-right">Avg Daily</TableHead>
                      <TableHead>Days of Stock</TableHead>
                      <TableHead>Last Sale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVelocity.map(({ metric, product }) => (
                      <TableRow key={metric.id} data-testid={`row-velocity-${metric.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product?.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded object-cover" />}
                            <div>
                              <p className="font-medium">{product?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{product?.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getDemandClassBadge(metric.demandClass)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(metric.velocityTrend)}
                            <span className="text-sm capitalize">{metric.velocityTrend}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">{metric.salesLast7Days}</TableCell>
                        <TableCell className="text-right font-mono">{metric.salesLast30Days}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{metric.salesLast90Days}</TableCell>
                        <TableCell className="text-right font-mono">{parseFloat(metric.avgDailySales).toFixed(2)}</TableCell>
                        <TableCell>
                          {metric.daysOfStock ? (
                            <div className="flex flex-col gap-1">
                              <Progress value={Math.min(100, (parseFloat(metric.daysOfStock) / 60) * 100)} className="h-1.5 w-20" />
                              <span className={`text-xs font-mono ${parseFloat(metric.daysOfStock) < 14 ? 'text-red-500 font-bold' : ''}`}>
                                {parseFloat(metric.daysOfStock).toFixed(0)} days
                                {parseFloat(metric.daysOfStock) < 14 && <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />}
                              </span>
                            </div>
                          ) : <span className="text-muted-foreground text-sm">N/A</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {metric.lastSaleDate ? formatDistanceToNow(new Date(metric.lastSaleDate), { addSuffix: true }) : <span className="text-muted-foreground">Never</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REORDERS TAB ── */}
        <TabsContent value="reorders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reorder Suggestions</CardTitle>
              <CardDescription>AI-generated restocking recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReorders ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : reorderData?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reorder suggestions</p>
                  <p className="text-sm">Click "Generate Reorders" to create suggestions based on velocity data</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Suggested Order</TableHead>
                      <TableHead className="text-right">Est. Cost</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reorderData?.map(({ suggestion, product, warehouse }) => (
                      <TableRow key={suggestion.id} data-testid={`row-reorder-${suggestion.id}`}>
                        <TableCell>
                          {suggestion.priority === "critical" && <Badge variant="destructive">Critical</Badge>}
                          {suggestion.priority === "warning" && <Badge className="bg-amber-500">Warning</Badge>}
                          {suggestion.priority === "info" && <Badge variant="secondary">Info</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product?.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded object-cover" />}
                            <div>
                              <p className="font-medium">{product?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{product?.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{warehouse?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{warehouse?.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-mono">{suggestion.currentStock}</span>
                            {suggestion.currentStock <= suggestion.safetyStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">{suggestion.suggestedOrderQuantity}</TableCell>
                        <TableCell className="text-right font-mono">
                          £{parseFloat(suggestion.estimatedCost).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(100, (parseFloat(suggestion.daysOfStockRemaining) / 30) * 100)} className="w-16 h-2" />
                            <span className="font-mono text-sm">{parseFloat(suggestion.daysOfStockRemaining).toFixed(0)}d</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {suggestion.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => updateSuggestionMutation.mutate({ id: suggestion.id, status: "approved" })} data-testid={`button-approve-${suggestion.id}`}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateSuggestionMutation.mutate({ id: suggestion.id, status: "dismissed" })} data-testid={`button-dismiss-${suggestion.id}`}>
                                Dismiss
                              </Button>
                            </>
                          )}
                          {suggestion.status === "approved" && <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>}
                          {suggestion.status === "dismissed" && <Badge variant="outline">Dismissed</Badge>}
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

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Alert</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAlert && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedAlert.title}</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Resolution Notes</label>
              <Textarea placeholder="Describe how this was resolved..." value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} className="mt-2" data-testid="input-resolution-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => { if (selectedAlert) resolveAlertMutation.mutate({ id: selectedAlert.id, notes: resolutionNotes }); }}
              disabled={resolveAlertMutation.isPending}
              data-testid="button-confirm-resolve"
            >
              {resolveAlertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
