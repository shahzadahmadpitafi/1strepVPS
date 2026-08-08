import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  BarChart3, Download, Calendar, TrendingUp, TrendingDown, 
  DollarSign, Package, Users, ShoppingCart, Warehouse, 
  UserPlus, Building2, Store, ArrowLeft, FileSpreadsheet,
  PieChart, Activity, RefreshCw, Filter, Search, Tag, ArrowUpDown,
  ChevronDown, ChevronRight, Boxes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend
} from "recharts";
import { Link } from "wouter";

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

export default function AdminReports() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y" | "custom">("30d");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [showOnlyWithSales, setShowOnlyWithSales] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryHealthFilter, setInventoryHealthFilter] = useState("all");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [expandedInventoryRows, setExpandedInventoryRows] = useState<Set<string>>(new Set());
  const [ordersSection, setOrdersSection] = useState<"first_rep" | "reseller_own">("first_rep");
  const [resellerOrderFilter, setResellerOrderFilter] = useState("all");
  const [ordersSearch, setOrdersSearch] = useState("");
  // Resellers report filters
  const [resellerSearch, setResellerSearch] = useState("");
  const [resellerStatusFilter, setResellerStatusFilter] = useState("all");
  const [resellerLicenceTierFilter, setResellerLicenceTierFilter] = useState("all");
  const [expandedResellerRows, setExpandedResellerRows] = useState<Set<string>>(new Set());
  // Products expandable rows
  const [expandedProductRows, setExpandedProductRows] = useState<Set<string>>(new Set());
  // Commissions search
  const [commissionsSearch, setCommissionsSearch] = useState("");

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  // Update date range based on preset selection
  const handleDateRangeChange = (range: typeof dateRange) => {
    setDateRange(range);
    const now = new Date();
    switch (range) {
      case "7d":
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case "30d":
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case "90d":
        setStartDate(subDays(now, 90));
        setEndDate(now);
        break;
      case "1y":
        setStartDate(subMonths(now, 12));
        setEndDate(now);
        break;
    }
  };

  // Sales Report
  const { data: salesReport, isLoading: salesLoading, refetch: refetchSales } = useQuery<any>({
    queryKey: ["/api/admin/reports/sales", startDate.toISOString(), endDate.toISOString(), groupBy],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&groupBy=${groupBy}`);
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "sales",
  });

  // Orders Report
  const { data: ordersReport, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/orders", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "orders",
  });

  // Products Report
  const { data: productsReport, isLoading: productsLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/products", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/products?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "products",
  });

  // Inventory Report
  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports/inventory");
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "inventory",
  });

  // Customers Report
  const { data: customersReport, isLoading: customersLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/customers", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/customers?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "customers",
  });

  // Commissions Report
  const { data: commissionsReport, isLoading: commissionsLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/commissions", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/commissions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "commissions",
  });

  // Resellers Full Report (profile + subscription + all channel performance)
  const { data: resellersReport, isLoading: resellersLoading } = useQuery<any>({
    queryKey: ["/api/admin/reports/resellers", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/resellers?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "resellers",
  });

  // Vendors Report
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors");
      return res.json();
    },
    enabled: authUser?.role === "admin" && activeTab === "vendors",
  });

  const handleExport = async (reportType: string) => {
    try {
      // Inventory report doesn't use date filters
      const url = reportType === "inventory" 
        ? `/api/admin/reports/export/${reportType}`
        : `/api/admin/reports/export/${reportType}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const filename = reportType === "inventory"
        ? `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
        : `${reportType}-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authUser || authUser.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="reports-title">
                  <BarChart3 className="w-8 h-8 text-primary" />
                  Reports & Analytics
                </h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive business intelligence and reporting
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={dateRange} onValueChange={(v) => handleDateRangeChange(v as any)}>
                <SelectTrigger className="w-[140px]" data-testid="select-date-range">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === "custom" && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-start-date">
                        {format(startDate, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-end-date">
                        {format(endDate, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <Button variant="outline" onClick={() => refetchSales()} data-testid="button-refresh">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6" data-testid="report-tabs">
            <TabsTrigger value="sales" className="gap-2" data-testid="tab-sales">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Sales</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2" data-testid="tab-products">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2" data-testid="tab-inventory">
              <Warehouse className="w-4 h-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2" data-testid="tab-customers">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="resellers" className="gap-2" data-testid="tab-resellers">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Resellers</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2" data-testid="tab-vendors">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Wholesalers</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2" data-testid="tab-commissions">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Commissions</span>
            </TabsTrigger>
          </TabsList>

          {/* Sales Report */}
          <TabsContent value="sales">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Sales Report</h2>
                  <p className="text-muted-foreground">Revenue and order analytics for the selected period</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Daily</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleExport("sales")} data-testid="button-export-sales">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {salesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : salesReport ? (
                <>
                  {/* Revenue & Orders Row - DRAMATIC MODERN DESIGN */}
                  <div className="grid gap-6 md:grid-cols-4">
                    <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Revenue</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                          {formatCurrency(salesReport.summary?.totalRevenue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Orders</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                          <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">
                          {salesReport.summary?.totalOrders || 0}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Avg Order Value</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                          {formatCurrency(salesReport.summary?.avgOrderValue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Top Channel</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                          <PieChart className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-2xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent capitalize">
                          {Object.entries(salesReport.byChannel || {}).sort((a: any, b: any) => b[1].revenue - a[1].revenue)[0]?.[0]?.replace('_', ' ') || 'N/A'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Profit & Margins Row - Modern Design */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-orange-500/20 bg-orange-500/5">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Package className="h-4 w-4 text-orange-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(salesReport.summary?.totalCost || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cost of goods sold</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(salesReport.summary?.grossProfit || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Revenue minus cost</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${(salesReport.summary?.profitMargin || 0) >= 30 ? 'text-green-600' : (salesReport.summary?.profitMargin || 0) >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {(salesReport.summary?.profitMargin || 0).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(salesReport.summary?.profitMargin || 0) >= 30 ? 'Healthy margin' : (salesReport.summary?.profitMargin || 0) >= 15 ? 'Moderate margin' : 'Low margin - review pricing'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cost per Order</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency((salesReport.summary?.totalCost || 0) / Math.max(salesReport.summary?.totalOrders || 1, 1))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Average cost per order</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue Over Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={salesReport.salesByDate || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'MMM dd')} />
                            <YAxis tickFormatter={(v) => `£${v}`} />
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Sales by Channel</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPie>
                            <Pie
                              data={Object.entries(salesReport.byChannel || {}).map(([name, data]: any, idx) => ({
                                name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                                value: data.revenue,
                                count: data.count
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {Object.keys(salesReport.byChannel || {}).map((_, idx) => (
                                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Units Sold</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(salesReport.topProducts || []).map((product: any, idx: number) => (
                            <TableRow key={product.productId}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{idx + 1}</Badge>
                                  {product.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{product.quantity}</TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {formatCurrency(product.revenue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No sales data available for the selected period</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Orders Report */}
          <TabsContent value="orders">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Orders Report</h2>
                  <p className="text-muted-foreground">Order history split by 1stRep catalogue and resellers' own products</p>
                </div>
                <Button onClick={() => handleExport("orders")} data-testid="button-export-orders">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : ordersReport ? (
                <>
                  {/* Top summary KPIs */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* 1stRep Summary Card */}
                    <Card
                      className={`cursor-pointer border-2 transition-colors ${ordersSection === 'first_rep' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setOrdersSection('first_rep')}
                      data-testid="card-first-rep-orders"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">1stRep Catalogue Orders</CardTitle>
                          {ordersSection === 'first_rep' && <Badge className="ml-auto">Viewing</Badge>}
                        </div>
                        <CardDescription>Orders containing 1stRep catalogue products</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 pt-1">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Orders</p>
                            <p className="text-2xl font-black">{ordersReport.firstRepSummary?.orderCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Units Sold</p>
                            <p className="text-2xl font-black">{(ordersReport.firstRepSummary?.unitsSold || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                            <p className="text-2xl font-black text-green-600">{formatCurrency(ordersReport.firstRepSummary?.totalAmount || 0)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Reseller Own Summary Card */}
                    <Card
                      className={`cursor-pointer border-2 transition-colors ${ordersSection === 'reseller_own' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setOrdersSection('reseller_own')}
                      data-testid="card-reseller-own-orders"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Store className="h-5 w-5 text-violet-600" />
                          <CardTitle className="text-base">Resellers' Own Product Orders</CardTitle>
                          {ordersSection === 'reseller_own' && <Badge className="ml-auto">Viewing</Badge>}
                        </div>
                        <CardDescription>Orders containing resellers' custom products</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 pt-1">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Orders</p>
                            <p className="text-2xl font-black">{ordersReport.resellerOwnSummary?.orderCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Units Sold</p>
                            <p className="text-2xl font-black">{(ordersReport.resellerOwnSummary?.unitsSold || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                            <p className="text-2xl font-black text-violet-600">{formatCurrency(ordersReport.resellerOwnSummary?.totalAmount || 0)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 1stRep Catalogue Orders Section */}
                  {ordersSection === 'first_rep' && (() => {
                    const sectionOrders = (ordersReport.orders || []).filter((o: any) => o.productType === 'first_rep' || o.productType === 'mixed');
                    const filtered = sectionOrders.filter((o: any) => {
                      const q = ordersSearch.toLowerCase();
                      return !q || o.orderNumber?.toLowerCase().includes(q) || o.customerEmail?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q);
                    });
                    return (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <CardTitle>1stRep Catalogue Orders</CardTitle>
                              <CardDescription>{filtered.length} orders · {formatCurrency(filtered.reduce((s: number, o: any) => s + parseFloat(o.totalAmount || '0'), 0))} total</CardDescription>
                            </div>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search order / customer..."
                                value={ordersSearch}
                                onChange={(e) => setOrdersSearch(e.target.value)}
                                className="pl-9 w-56"
                                data-testid="input-orders-search"
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="max-h-[600px] overflow-auto">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                  <TableHead>Order #</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Channel</TableHead>
                                  <TableHead className="text-right">Items</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filtered.length === 0 ? (
                                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No 1stRep catalogue orders found</TableCell></TableRow>
                                ) : filtered.map((order: any) => (
                                  <TableRow key={order.id}>
                                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                                    <TableCell className="text-sm">{order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-sm">{order.customerEmail || 'Guest'}</TableCell>
                                    <TableCell>
                                      <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'shipped' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'}>
                                        {order.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize text-sm text-muted-foreground">{(order.channel || 'website').replace(/_/g, ' ')}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                      {order.items.filter((i: any) => !!i.productId).reduce((s: number, i: any) => s + (i.quantity || 0), 0)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold font-mono text-green-600">
                                      {formatCurrency(parseFloat(order.totalAmount || '0'))}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Resellers' Own Product Orders Section */}
                  {ordersSection === 'reseller_own' && (() => {
                    const sectionOrders = (ordersReport.orders || []).filter((o: any) => o.productType === 'reseller_own' || o.productType === 'mixed');
                    const resellerBreakdown: any[] = ordersReport.resellerOwnSummary?.resellerBreakdown || [];
                    const filtered = sectionOrders.filter((o: any) => {
                      const q = ordersSearch.toLowerCase();
                      const matchSearch = !q || o.orderNumber?.toLowerCase().includes(q) || o.customerEmail?.toLowerCase().includes(q);
                      const matchReseller = resellerOrderFilter === 'all' || o.resellerId === resellerOrderFilter || (!o.resellerId && resellerOrderFilter === 'unknown');
                      return matchSearch && matchReseller;
                    });
                    return (
                      <div className="space-y-4">
                        {/* Per-reseller breakdown */}
                        {resellerBreakdown.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Breakdown by Reseller</CardTitle>
                              <CardDescription>Total orders and revenue per reseller for their own products</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Reseller</TableHead>
                                    <TableHead className="text-right">Orders</TableHead>
                                    <TableHead className="text-right">Units Sold</TableHead>
                                    <TableHead className="text-right">Total Revenue</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {resellerBreakdown.map((r: any) => (
                                    <TableRow key={r.resellerId} className="cursor-pointer hover-elevate" onClick={() => setResellerOrderFilter(resellerOrderFilter === r.resellerId ? 'all' : r.resellerId)}>
                                      <TableCell className="font-semibold">{r.resellerName}</TableCell>
                                      <TableCell className="text-right">{r.orderCount}</TableCell>
                                      <TableCell className="text-right">{r.unitsSold}</TableCell>
                                      <TableCell className="text-right font-mono font-semibold text-violet-600">{formatCurrency(r.totalAmount)}</TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setResellerOrderFilter(resellerOrderFilter === r.resellerId ? 'all' : r.resellerId); }}>
                                          {resellerOrderFilter === r.resellerId ? 'Clear filter' : 'View orders'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {/* Orders table */}
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <CardTitle>
                                  {resellerOrderFilter !== 'all'
                                    ? `${resellerBreakdown.find((r: any) => r.resellerId === resellerOrderFilter)?.resellerName || 'Reseller'} — Own Product Orders`
                                    : "All Resellers' Own Product Orders"}
                                </CardTitle>
                                <CardDescription>{filtered.length} orders · {formatCurrency(filtered.reduce((s: number, o: any) => s + parseFloat(o.totalAmount || '0'), 0))} total</CardDescription>
                              </div>
                              <div className="flex flex-wrap gap-2 items-center">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search order / customer..."
                                    value={ordersSearch}
                                    onChange={(e) => setOrdersSearch(e.target.value)}
                                    className="pl-9 w-52"
                                    data-testid="input-reseller-orders-search"
                                  />
                                </div>
                                {resellerOrderFilter !== 'all' && (
                                  <Button variant="outline" size="sm" onClick={() => setResellerOrderFilter('all')}>
                                    Clear filter
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="max-h-[500px] overflow-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                  <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reseller</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead className="text-right">Items</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No reseller own product orders found</TableCell></TableRow>
                                  ) : filtered.map((order: any) => (
                                    <TableRow key={order.id}>
                                      <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                                      <TableCell className="text-sm">{order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                      <TableCell className="text-sm font-medium">{order.resellerName || '—'}</TableCell>
                                      <TableCell className="text-sm">{order.customerEmail || 'Guest'}</TableCell>
                                      <TableCell>
                                        <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'shipped' ? 'secondary' : order.status === 'cancelled' ? 'destructive' : 'outline'}>
                                          {order.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="capitalize text-sm text-muted-foreground">{(order.channel || 'website').replace(/_/g, ' ')}</TableCell>
                                      <TableCell className="text-right text-muted-foreground text-sm">
                                        {order.items.filter((i: any) => !i.productId).reduce((s: number, i: any) => s + (i.quantity || 0), 0)}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold font-mono text-violet-600">
                                        {formatCurrency(parseFloat(order.totalAmount || '0'))}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No orders found for the selected period</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Products Report */}
          <TabsContent value="products">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Product Performance</h2>
                  <p className="text-muted-foreground">Detailed 1stRep product sales, cost, profit & margin analysis</p>
                </div>
                <Button onClick={() => handleExport("products")} data-testid="button-export-products">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : productsReport ? (
                <>
                  {/* Modern Gradient KPI Cards */}
                  <div className="grid gap-6 md:grid-cols-4">
                    <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Products</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{productsReport.summary?.totalProducts || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Products with Sales</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                          <ShoppingCart className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">{productsReport.summary?.productsWithSales || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Units Sold</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">{productsReport.summary?.totalUnits || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 relative z-10">
                        <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Revenue</CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                          {formatCurrency(productsReport.summary?.totalRevenue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Profit Metrics Row */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <Package className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(productsReport.summary?.totalCost || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cost of goods sold</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(productsReport.summary?.totalProfit || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Revenue minus cost</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${(productsReport.summary?.avgMargin || 0) >= 30 ? 'text-green-600' : (productsReport.summary?.avgMargin || 0) >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {(productsReport.summary?.avgMargin || 0).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(productsReport.summary?.avgMargin || 0) >= 30 ? 'Healthy margin' : (productsReport.summary?.avgMargin || 0) >= 15 ? 'Moderate' : 'Review pricing'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Profit per Unit</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency((productsReport.summary?.totalProfit || 0) / Math.max(productsReport.summary?.totalUnits || 1, 1))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Average profit per unit</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top 10 Products Bar Chart */}
                  {(() => {
                    const top10 = (productsReport.products || [])
                      .filter((p: any) => p.unitsSold > 0)
                      .slice(0, 10)
                      .map((p: any) => ({
                        name: p.name.length > 18 ? p.name.slice(0, 17) + '…' : p.name,
                        revenue: parseFloat(p.revenue?.toFixed(2) || '0'),
                        profit: parseFloat(p.profit?.toFixed(2) || '0'),
                        cost: parseFloat(p.cost?.toFixed(2) || '0'),
                      }));
                    if (top10.length === 0) return null;
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle>Top 10 Products by Revenue</CardTitle>
                          <CardDescription>Revenue, cost and profit breakdown for best-selling products</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={top10} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                <Legend verticalAlign="top" />
                                <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="cost" name="Cost" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Search + Filter Bar */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap gap-3 items-center justify-between">
                        <CardTitle className="text-base">All Products — Detailed Performance</CardTitle>
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search product..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="pl-9 w-48"
                              data-testid="input-product-search"
                            />
                          </div>
                          <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                            <SelectTrigger className="w-40" data-testid="select-product-category">
                              <Tag className="h-4 w-4 mr-1" /><SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {Array.from(new Set((productsReport.products || []).map((p: any) => p.category).filter(Boolean))).map((cat: any) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant={showOnlyWithSales ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowOnlyWithSales(!showOnlyWithSales)}
                            data-testid="button-filter-with-sales"
                          >
                            <Filter className="h-3 w-3 mr-1" />
                            With Sales Only
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {(() => {
                              const filtered = (productsReport.products || []).filter((p: any) => {
                                const matchSearch = !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase());
                                const matchCat = productCategoryFilter === "all" || p.category === productCategoryFilter;
                                const matchSales = !showOnlyWithSales || p.unitsSold > 0;
                                return matchSearch && matchCat && matchSales;
                              });
                              return `${filtered.length} products`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-[600px] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="min-w-[200px]">Product</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Units Sold</TableHead>
                              <TableHead className="text-right">Orders</TableHead>
                              <TableHead className="text-right">Avg Sell Price</TableHead>
                              <TableHead className="text-right">Revenue</TableHead>
                              <TableHead className="text-right">Total Cost</TableHead>
                              <TableHead className="text-right">Gross Profit</TableHead>
                              <TableHead className="text-right min-w-[120px]">Margin %</TableHead>
                              <TableHead className="text-right">Stock Left</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(productsReport.products || [])
                              .filter((p: any) => {
                                const matchSearch = !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase());
                                const matchCat = productCategoryFilter === "all" || p.category === productCategoryFilter;
                                const matchSales = !showOnlyWithSales || p.unitsSold > 0;
                                return matchSearch && matchCat && matchSales;
                              })
                              .flatMap((product: any) => {
                                const margin = product.margin || 0;
                                const avgSellPrice = product.unitsSold > 0 ? product.revenue / product.unitsSold : 0;
                                const isExpanded = expandedProductRows.has(product.productId);
                                const hasBreakdown = (product.colorSizeBreakdown?.length > 0) || (product.variantStock?.length > 0);
                                return [
                                  <TableRow
                                    key={product.productId}
                                    className={`${product.unitsSold === 0 ? "opacity-50" : ""} ${hasBreakdown ? "cursor-pointer hover:bg-muted/40" : ""}`}
                                    onClick={() => hasBreakdown && setExpandedProductRows(prev => {
                                      const next = new Set(prev);
                                      next.has(product.productId) ? next.delete(product.productId) : next.add(product.productId);
                                      return next;
                                    })}
                                  >
                                    <TableCell className="font-semibold">
                                      <div className="flex items-center gap-1">
                                        {hasBreakdown && (isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />)}
                                        {product.name}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{product.sku || "—"}</TableCell>
                                    <TableCell>
                                      {product.category ? <Badge variant="outline" className="text-xs">{product.category}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{product.unitsSold}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">{product.ordersCount || 0}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(avgSellPrice)}</TableCell>
                                    <TableCell className="text-right font-mono text-green-600 font-semibold">{formatCurrency(product.revenue)}</TableCell>
                                    <TableCell className="text-right font-mono text-orange-600">{formatCurrency(product.cost || 0)}</TableCell>
                                    <TableCell className={`text-right font-mono font-semibold ${(product.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(product.profit || 0)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex flex-col items-end gap-1">
                                        <span className={`text-sm font-bold ${margin >= 40 ? 'text-green-600' : margin >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                                          {margin.toFixed(1)}%
                                        </span>
                                        <Progress value={Math.min(100, margin)} className="h-1.5 w-20" />
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant={product.currentStock < 10 ? "destructive" : product.currentStock < 30 ? "default" : "secondary"}>
                                        {product.currentStock}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>,
                                  ...(isExpanded ? [
                                    <TableRow key={`${product.productId}-breakdown`} className="bg-muted/20">
                                      <TableCell colSpan={11} className="py-3 px-6">
                                        <div className="space-y-5">
                                          {/* Colour/size breakdown + stock chips */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {product.colorSizeBreakdown?.length > 0 && (
                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Sales by Colour &amp; Size</p>
                                                <div className="overflow-x-auto">
                                                  <table className="text-sm w-full">
                                                    <thead>
                                                      <tr className="border-b text-muted-foreground">
                                                        <th className="text-left py-1 pr-4 font-medium">Colour</th>
                                                        <th className="text-left py-1 pr-4 font-medium">Size</th>
                                                        <th className="text-right py-1 pr-4 font-medium">Units</th>
                                                        <th className="text-right py-1 font-medium">Revenue</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {product.colorSizeBreakdown.map((cs: any, i: number) => (
                                                        <tr key={i} className="border-b last:border-0">
                                                          <td className="py-1 pr-4">{cs.color}</td>
                                                          <td className="py-1 pr-4">{cs.size}</td>
                                                          <td className="py-1 pr-4 text-right font-bold">{cs.unitsSold}</td>
                                                          <td className="py-1 text-right text-green-600 font-semibold">{formatCurrency(cs.revenue)}</td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                            )}
                                            {product.variantStock?.length > 0 && (
                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Current Stock by Variant</p>
                                                <div className="flex flex-wrap gap-2">
                                                  {product.variantStock.map((v: any, i: number) => (
                                                    <div key={i} className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${v.stock === 0 ? 'border-red-500/40 bg-red-500/5 text-red-600' : v.stock < 10 ? 'border-amber-500/40 bg-amber-500/5 text-amber-700' : 'border-green-500/30 bg-green-500/5 text-green-700'}`}>
                                                      <span className="font-medium">{v.color} / {v.size}</span>
                                                      <span className="font-bold">{v.stock}</span>
                                                      {v.sku && <span className="text-muted-foreground font-mono">({v.sku})</span>}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          {/* Sales history timeline */}
                                          {product.salesHistory?.length > 0 && (
                                            <div>
                                              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                                                Sales History
                                                <span className="ml-2 font-normal normal-case text-muted-foreground">
                                                  {(product.salesHistory.length === 50 ? ' most recent 50 sales' : ` ${product.salesHistory.length} sale${product.salesHistory.length !== 1 ? 's' : ''}`)}
                                                </span>
                                              </p>
                                              <div className="overflow-x-auto rounded border">
                                                <table className="text-xs w-full">
                                                  <thead>
                                                    <tr className="border-b bg-muted/30 text-muted-foreground">
                                                      <th className="text-left py-1.5 px-3 font-medium">Date</th>
                                                      <th className="text-left py-1.5 px-3 font-medium">Order #</th>
                                                      <th className="text-left py-1.5 px-3 font-medium">Customer</th>
                                                      <th className="text-left py-1.5 px-3 font-medium">Colour</th>
                                                      <th className="text-left py-1.5 px-3 font-medium">Size</th>
                                                      <th className="text-right py-1.5 px-3 font-medium">Qty</th>
                                                      <th className="text-left py-1.5 px-3 font-medium">Channel</th>
                                                      <th className="text-right py-1.5 px-3 font-medium">Revenue</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {product.salesHistory.map((s: any, idx: number) => {
                                                      const channelLabel: Record<string, string> = {
                                                        website: 'Website', customer_epos: 'EPOS',
                                                        reseller_storefront: 'Reseller Store', reseller_epos: 'Reseller EPOS',
                                                        vendor_storefront: 'Vendor Store', vendor_epos: 'Vendor EPOS', admin: 'Admin',
                                                      };
                                                      const channelColor: Record<string, string> = {
                                                        website: 'bg-blue-100 text-blue-700', customer_epos: 'bg-purple-100 text-purple-700',
                                                        reseller_storefront: 'bg-teal-100 text-teal-700', reseller_epos: 'bg-indigo-100 text-indigo-700',
                                                        vendor_storefront: 'bg-orange-100 text-orange-700', vendor_epos: 'bg-amber-100 text-amber-700',
                                                        admin: 'bg-gray-100 text-gray-700',
                                                      };
                                                      const d = s.orderDate ? new Date(s.orderDate) : null;
                                                      const dateStr = d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
                                                      const timeStr = d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                                                      return (
                                                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                                          <td className="py-1.5 px-3 whitespace-nowrap">
                                                            <span className="font-medium">{dateStr}</span>
                                                            {timeStr && <span className="text-muted-foreground ml-1">{timeStr}</span>}
                                                          </td>
                                                          <td className="py-1.5 px-3 font-mono text-muted-foreground whitespace-nowrap">{s.orderNumber || '—'}</td>
                                                          <td className="py-1.5 px-3 whitespace-nowrap">{s.customerName}</td>
                                                          <td className="py-1.5 px-3">{s.color}</td>
                                                          <td className="py-1.5 px-3">{s.size}</td>
                                                          <td className="py-1.5 px-3 text-right font-bold">{s.quantity}</td>
                                                          <td className="py-1.5 px-3">
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${channelColor[s.channel] || 'bg-gray-100 text-gray-700'}`}>
                                                              {channelLabel[s.channel] || s.channel}
                                                            </span>
                                                          </td>
                                                          <td className="py-1.5 px-3 text-right font-semibold text-green-600">{formatCurrency(s.revenue)}</td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ] : [])
                                ];
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </div>
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Inventory Report</h2>
                  <p className="text-muted-foreground">Stock health, retail value and variant breakdown across all products</p>
                </div>
                <Button onClick={() => handleExport("inventory")} data-testid="button-export-inventory">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {inventoryLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : inventoryReport ? (
                <>
                  {/* KPI Cards — 7 total */}
                  <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
                    {[
                      { label: "Total Products", value: inventoryReport.summary?.totalProducts || 0, color: "blue" },
                      { label: "Total Variants", value: inventoryReport.summary?.totalVariants || 0, color: "violet" },
                      { label: "Total Units", value: (inventoryReport.summary?.totalStock || 0).toLocaleString(), color: "emerald" },
                      { label: "Healthy Stock", value: (inventoryReport.products || []).filter((p: any) => p.stockHealth === 'healthy').length, color: "green" },
                      { label: "Low Stock", value: inventoryReport.summary?.lowStockProducts || 0, color: "amber" },
                      { label: "Out of Stock", value: inventoryReport.summary?.outOfStockProducts || 0, color: "red" },
                      { label: "Retail Value", value: formatCurrency(inventoryReport.summary?.totalRetailValue || 0), color: "indigo" },
                    ].map((kpi) => (
                      <Card key={kpi.label}>
                        <CardHeader className="pb-1 pt-4 px-4">
                          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{kpi.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <div className="text-2xl font-black">{kpi.value}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Charts Row */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Stock Health Donut */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Stock Health Distribution</CardTitle>
                        <CardDescription>Products by stock status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={[
                                  { name: 'Healthy', value: (inventoryReport.products || []).filter((p: any) => p.stockHealth === 'healthy').length },
                                  { name: 'Low Stock', value: (inventoryReport.products || []).filter((p: any) => p.stockHealth === 'low').length },
                                  { name: 'Out of Stock', value: (inventoryReport.products || []).filter((p: any) => p.stockHealth === 'out').length },
                                ].filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {[{ fill: '#10B981' }, { fill: '#F59E0B' }, { fill: '#EF4444' }].map((entry, index) => (
                                  <Cell key={index} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stock by Category Bar Chart */}
                    {inventoryReport.categoryBreakdown && inventoryReport.categoryBreakdown.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Stock Units by Category</CardTitle>
                          <CardDescription>Total units held per product category</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={inventoryReport.categoryBreakdown.slice(0, 8)} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="totalStock" name="Units" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Warehouse Summary */}
                  {inventoryReport.warehouses && inventoryReport.warehouses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Warehouse Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          {inventoryReport.warehouses.map((wh: any) => (
                            <Card key={wh.warehouseId}>
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div>
                                    <p className="font-semibold">{wh.name}</p>
                                    <p className="text-sm text-muted-foreground">{wh.location}</p>
                                  </div>
                                  {wh.isPrimary && <Badge>Primary</Badge>}
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                  <div><p className="text-muted-foreground">Items</p><p className="font-bold">{wh.totalItems}</p></div>
                                  <div><p className="text-muted-foreground">SKUs</p><p className="font-bold">{wh.itemsCount}</p></div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Filters + Full Inventory Table */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap gap-3 items-center justify-between">
                        <CardTitle className="text-base">Full Inventory — Product Detail</CardTitle>
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search product or SKU..."
                              value={inventorySearch}
                              onChange={(e) => setInventorySearch(e.target.value)}
                              className="pl-9 w-48"
                              data-testid="input-inventory-search"
                            />
                          </div>
                          <Select value={inventoryHealthFilter} onValueChange={setInventoryHealthFilter}>
                            <SelectTrigger className="w-36" data-testid="select-inventory-health">
                              <SelectValue placeholder="Health" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Health</SelectItem>
                              <SelectItem value="healthy">Healthy</SelectItem>
                              <SelectItem value="low">Low Stock</SelectItem>
                              <SelectItem value="out">Out of Stock</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={inventoryCategoryFilter} onValueChange={setInventoryCategoryFilter}>
                            <SelectTrigger className="w-40" data-testid="select-inventory-category">
                              <Tag className="h-4 w-4 mr-1" /><SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {Array.from(new Set((inventoryReport.products || []).map((p: any) => p.category).filter(Boolean))).map((cat: any) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">
                            {(inventoryReport.products || []).filter((p: any) => {
                              const q = inventorySearch.toLowerCase();
                              const matchSearch = !q || p.productName?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
                              const matchHealth = inventoryHealthFilter === "all" || p.stockHealth === inventoryHealthFilter;
                              const matchCat = inventoryCategoryFilter === "all" || p.category === inventoryCategoryFilter;
                              return matchSearch && matchHealth && matchCat;
                            }).length} products
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-[600px] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead className="min-w-[180px]">Product</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Health</TableHead>
                              <TableHead className="text-right">Total Units</TableHead>
                              <TableHead className="text-right">Variants</TableHead>
                              <TableHead className="text-right">Low Stock</TableHead>
                              <TableHead className="text-right">Out of Stock</TableHead>
                              <TableHead className="text-right">Unit RRP</TableHead>
                              <TableHead className="text-right">Cost Price</TableHead>
                              <TableHead className="text-right">Retail Value</TableHead>
                              <TableHead className="text-right">Cost Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(inventoryReport.products || [])
                              .filter((p: any) => {
                                const q = inventorySearch.toLowerCase();
                                const matchSearch = !q || p.productName?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
                                const matchHealth = inventoryHealthFilter === "all" || p.stockHealth === inventoryHealthFilter;
                                const matchCat = inventoryCategoryFilter === "all" || p.category === inventoryCategoryFilter;
                                return matchSearch && matchHealth && matchCat;
                              })
                              .map((product: any) => {
                                const isExpanded = expandedInventoryRows.has(product.productId);
                                const toggleRow = () => {
                                  setExpandedInventoryRows(prev => {
                                    const next = new Set(prev);
                                    if (next.has(product.productId)) next.delete(product.productId);
                                    else next.add(product.productId);
                                    return next;
                                  });
                                };
                                return (
                                  <>
                                    <TableRow
                                      key={product.productId}
                                      className={`cursor-pointer hover-elevate ${product.stockHealth === 'out' ? 'opacity-60' : ''}`}
                                      onClick={toggleRow}
                                    >
                                      <TableCell className="text-muted-foreground">
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </TableCell>
                                      <TableCell className="font-semibold">{product.productName}</TableCell>
                                      <TableCell className="font-mono text-xs text-muted-foreground">{product.sku || "—"}</TableCell>
                                      <TableCell>
                                        {product.category
                                          ? <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                          : <span className="text-muted-foreground text-xs">—</span>}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge variant={product.stockHealth === 'healthy' ? 'default' : product.stockHealth === 'low' ? 'secondary' : 'destructive'}>
                                          {product.stockHealth === 'healthy' ? 'Healthy' : product.stockHealth === 'low' ? 'Low' : 'Out'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right font-bold">{product.totalStock.toLocaleString()}</TableCell>
                                      <TableCell className="text-right text-muted-foreground">{product.variantsCount}</TableCell>
                                      <TableCell className="text-right">
                                        {product.lowStockCount > 0
                                          ? <Badge variant="secondary" className="text-amber-600">{product.lowStockCount}</Badge>
                                          : <span className="text-muted-foreground text-xs">—</span>}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {product.outOfStockCount > 0
                                          ? <Badge variant="destructive">{product.outOfStockCount}</Badge>
                                          : <span className="text-muted-foreground text-xs">—</span>}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-sm">{formatCurrency(product.retailPrice)}</TableCell>
                                      <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(product.costPrice)}</TableCell>
                                      <TableCell className="text-right font-mono text-sm font-semibold text-green-600">{formatCurrency(product.retailValue)}</TableCell>
                                      <TableCell className="text-right font-mono text-sm text-orange-600">{formatCurrency(product.costValue)}</TableCell>
                                    </TableRow>
                                    {isExpanded && product.variants && product.variants.length > 0 && (
                                      <TableRow key={`${product.productId}-variants`} className="bg-muted/30">
                                        <TableCell colSpan={13} className="py-2 px-6">
                                          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Variant Breakdown</div>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {product.variants.map((v: any) => (
                                              <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 bg-background text-sm">
                                                <div className="flex flex-col">
                                                  <span className="font-mono text-xs text-muted-foreground">{v.sku || "—"}</span>
                                                  <span className="font-medium">{[v.color, v.size].filter(Boolean).join(" / ") || "Default"}</span>
                                                </div>
                                                <Badge variant={v.stock === 0 ? 'destructive' : v.stock < 10 ? 'secondary' : 'default'} className="ml-2">
                                                  {v.stock}
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
              ) : null}
            </div>
          </TabsContent>

          {/* Customers Report */}
          <TabsContent value="customers">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Customer Report</h2>
                  <p className="text-muted-foreground">Customer acquisition and spending analytics</p>
                </div>
                <Button onClick={() => handleExport("customers")} data-testid="button-export-customers">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {customersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : customersReport ? (
                <>
                  {/* Modern Gradient KPI Cards */}
                  <div className="grid gap-6 md:grid-cols-5">
                    <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Customers</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{customersReport.summary?.totalCustomers || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Customers</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">{customersReport.summary?.activeCustomers || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10 flex flex-row items-center gap-2">
                        <UserPlus className="w-4 h-4 text-violet-500" />
                        <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">New Customers</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">{customersReport.summary?.newCustomers || 0}</div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Revenue</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                          {formatCurrency(customersReport.summary?.totalRevenue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-rose-500/20 backdrop-blur-xl shadow-2xl shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-red-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Avg Customer Value</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                          {formatCurrency(customersReport.summary?.avgCustomerValue || 0)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Orders</TableHead>
                            <TableHead className="text-right">Total Spent</TableHead>
                            <TableHead className="text-right">Avg Order</TableHead>
                            <TableHead>Last Order</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(customersReport.topCustomers || []).map((customer: any) => (
                            <TableRow key={customer.userId}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{customer.ordersCount}</TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {formatCurrency(customer.totalSpent)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(customer.avgOrderValue)}
                              </TableCell>
                              <TableCell>
                                {customer.lastOrderDate ? format(new Date(customer.lastOrderDate), 'MMM dd, yyyy') : 'Never'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </div>
          </TabsContent>

          {/* Resellers Report */}
          <TabsContent value="resellers">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Resellers Report</h2>
                  <p className="text-muted-foreground">Full reseller profile, subscription, and performance across all order channels</p>
                </div>
                <Button onClick={() => handleExport("commissions")} variant="outline" data-testid="button-export-resellers">
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </Button>
              </div>

              {resellersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : resellersReport ? (
                <>
                  {/* KPI Summary */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      { label: "Total", value: resellersReport.summary?.total ?? 0, color: "blue" },
                      { label: "Approved", value: resellersReport.summary?.approved ?? 0, color: "emerald" },
                      { label: "Pending", value: resellersReport.summary?.pending ?? 0, color: "amber" },
                      { label: "With Orders", value: resellersReport.summary?.withOrders ?? 0, color: "violet" },
                      { label: "Total Commissions", value: formatCurrency(resellersReport.summary?.totalCommissions ?? 0), color: "green" },
                    ].map(({ label, value, color }) => (
                      <Card key={label} className="p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="text-2xl font-black mt-1">{value}</p>
                      </Card>
                    ))}
                  </div>

                  {/* Channel summary */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Wholesale (B2B) Sales", value: resellersReport.summary?.totalWholesaleSales ?? 0, icon: <Boxes className="h-4 w-4 text-blue-500" /> },
                      { label: "Storefront Sales", value: resellersReport.summary?.totalStorefrontSales ?? 0, icon: <Store className="h-4 w-4 text-emerald-500" /> },
                      { label: "EPOS Sales", value: resellersReport.summary?.totalEposSales ?? 0, icon: <Activity className="h-4 w-4 text-orange-500" /> },
                    ].map(({ label, value, icon }) => (
                      <Card key={label} className="p-4">
                        <div className="flex items-center gap-2 mb-1">{icon}<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p></div>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(value)}</p>
                      </Card>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search resellers…"
                        value={resellerSearch}
                        onChange={e => setResellerSearch(e.target.value)}
                        className="pl-8"
                        data-testid="input-reseller-search"
                      />
                    </div>
                    <Select value={resellerStatusFilter} onValueChange={setResellerStatusFilter}>
                      <SelectTrigger className="w-40" data-testid="select-reseller-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={resellerLicenceTierFilter} onValueChange={setResellerLicenceTierFilter}>
                      <SelectTrigger className="w-44" data-testid="select-reseller-licence">
                        <SelectValue placeholder="Licence Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Licences</SelectItem>
                        <SelectItem value="none">No Licence</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {(() => {
                        return (resellersReport.resellers || []).filter((r: any) => {
                          const ms = !resellerSearch || r.businessName?.toLowerCase().includes(resellerSearch.toLowerCase()) || r.email?.toLowerCase().includes(resellerSearch.toLowerCase());
                          const mst = resellerStatusFilter === 'all' || r.approvalStatus === resellerStatusFilter;
                          const ml = resellerLicenceTierFilter === 'all' || (resellerLicenceTierFilter === 'none' ? !r.licenceTier : r.licenceTier === resellerLicenceTierFilter);
                          return ms && mst && ml;
                        }).length;
                      })()} resellers
                    </span>
                  </div>

                  {/* Main table */}
                  <Card>
                    <CardContent className="p-0">
                      <div className="max-h-[700px] overflow-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="min-w-[180px]">Business</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Licence</TableHead>
                              <TableHead className="text-center">Rate</TableHead>
                              <TableHead className="text-right">B2B Orders</TableHead>
                              <TableHead className="text-right">B2B Sales</TableHead>
                              <TableHead className="text-right">Storefront</TableHead>
                              <TableHead className="text-right">EPOS</TableHead>
                              <TableHead className="text-right">Total Sales</TableHead>
                              <TableHead className="text-right">Commission</TableHead>
                              <TableHead>Joined</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(resellersReport.resellers || [])
                              .filter((r: any) => {
                                const ms = !resellerSearch || r.businessName?.toLowerCase().includes(resellerSearch.toLowerCase()) || r.email?.toLowerCase().includes(resellerSearch.toLowerCase()) || r.contactName?.toLowerCase().includes(resellerSearch.toLowerCase());
                                const mst = resellerStatusFilter === 'all' || r.approvalStatus === resellerStatusFilter;
                                const ml = resellerLicenceTierFilter === 'all' || (resellerLicenceTierFilter === 'none' ? !r.licenceTier : r.licenceTier === resellerLicenceTierFilter);
                                return ms && mst && ml;
                              })
                              .flatMap((r: any) => {
                                const isExpanded = expandedResellerRows.has(r.id);
                                return [
                                  <TableRow
                                    key={r.id}
                                    className="cursor-pointer hover:bg-muted/40"
                                    onClick={() => setExpandedResellerRows(prev => {
                                      const next = new Set(prev);
                                      next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                                      return next;
                                    })}
                                    data-testid={`row-reseller-${r.id}`}
                                  >
                                    <TableCell>
                                      <div className="flex items-start gap-1">
                                        {isExpanded ? <ChevronDown className="h-3 w-3 mt-1 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />}
                                        <div>
                                          <p className="font-semibold text-sm">{r.businessName || '—'}</p>
                                          <p className="text-xs text-muted-foreground">{r.email}</p>
                                          {r.contactName && r.contactName !== r.email && (
                                            <p className="text-xs text-muted-foreground">{r.contactName}</p>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={r.approvalStatus === 'approved' ? 'default' : r.approvalStatus === 'pending' ? 'secondary' : 'destructive'} className="capitalize text-xs">
                                        {r.approvalStatus}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {r.licenceTier ? (
                                        <div className="flex flex-col gap-0.5">
                                          <Badge variant="outline" className="capitalize text-xs w-fit">{r.licenceTier}</Badge>
                                          {r.licenceStatus && (
                                            <span className="text-xs text-muted-foreground capitalize">{r.licenceStatus.replace(/_/g, ' ')}</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center text-sm">{parseFloat(r.commissionRate || '0').toFixed(0)}%</TableCell>
                                    <TableCell className="text-right text-sm">{r.wholesaleOrders}</TableCell>
                                    <TableCell className="text-right font-mono text-sm text-blue-600">{formatCurrency(r.wholesaleSales)}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="text-sm">
                                        <p className="font-mono text-emerald-600">{formatCurrency(r.storefrontSales)}</p>
                                        <p className="text-xs text-muted-foreground">{r.storefrontOrders} orders</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="text-sm">
                                        <p className="font-mono text-orange-600">{formatCurrency(r.eposSales)}</p>
                                        <p className="text-xs text-muted-foreground">{r.eposOrders} orders</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold font-mono">{formatCurrency(r.totalSales)}</TableCell>
                                    <TableCell className="text-right font-bold font-mono text-primary">{formatCurrency(r.totalCommission)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                      {r.joinedAt ? format(new Date(r.joinedAt), 'dd MMM yyyy') : '—'}
                                    </TableCell>
                                  </TableRow>,
                                  ...(isExpanded ? [
                                    <TableRow key={`${r.id}-detail`} className="bg-muted/20">
                                      <TableCell colSpan={11} className="py-3 px-6">
                                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                                          <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Wholesale (B2B)</p>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Orders:</span><span className="font-medium">{r.wholesaleOrders}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Sales:</span><span className="font-medium text-blue-600">{formatCurrency(r.wholesaleSales)}</span></div>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Storefront</p>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Orders:</span><span className="font-medium">{r.storefrontOrders}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Sales:</span><span className="font-medium text-emerald-600">{formatCurrency(r.storefrontSales)}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Commission:</span><span className="font-semibold text-primary">{formatCurrency(r.storefrontCommission)}</span></div>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">EPOS</p>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Orders:</span><span className="font-medium">{r.eposOrders}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Sales:</span><span className="font-medium text-orange-600">{formatCurrency(r.eposSales)}</span></div>
                                            <div className="flex justify-between"><span className="text-muted-foreground">Commission ({r.commissionRate}%):</span><span className="font-semibold text-primary">{formatCurrency(r.eposCommission)}</span></div>
                                          </div>
                                        </div>
                                        {(r.licenceActivatedAt || r.licenceExpiresAt) && (
                                          <div className="mt-3 pt-3 border-t flex gap-6 text-xs text-muted-foreground">
                                            {r.licenceActivatedAt && <span>Activated: <strong>{format(new Date(r.licenceActivatedAt), 'dd MMM yyyy')}</strong></span>}
                                            {r.licenceExpiresAt && <span>Expires: <strong>{format(new Date(r.licenceExpiresAt), 'dd MMM yyyy')}</strong></span>}
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ] : [])
                                ];
                              })}
                            {(resellersReport.resellers || []).filter((r: any) => {
                              const ms = !resellerSearch || r.businessName?.toLowerCase().includes(resellerSearch.toLowerCase()) || r.email?.toLowerCase().includes(resellerSearch.toLowerCase());
                              const mst = resellerStatusFilter === 'all' || r.approvalStatus === resellerStatusFilter;
                              const ml = resellerLicenceTierFilter === 'all' || (resellerLicenceTierFilter === 'none' ? !r.licenceTier : r.licenceTier === resellerLicenceTierFilter);
                              return ms && mst && ml;
                            }).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No resellers match the current filters</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No reseller data available</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Wholesalers Report */}
          <TabsContent value="vendors">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Wholesalers Report</h2>
                  <p className="text-muted-foreground">Wholesaler performance and status overview</p>
                </div>
              </div>

              {vendorsData ? (
                <>
                  {/* Modern Gradient KPI Cards */}
                  <div className="grid gap-6 md:grid-cols-4">
                    <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Wholesalers</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{vendorsData.length}</div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                          {vendorsData.filter((v: any) => v.approvalStatus === 'approved').length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                          {vendorsData.filter((v: any) => v.approvalStatus === 'pending').length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Stripe Connected</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                          {vendorsData.filter((v: any) => v.stripeChargesEnabled).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>All Vendors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[500px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Business Name</TableHead>
                              <TableHead>Contact Email</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Stripe Status</TableHead>
                              <TableHead>Joined</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vendorsData.map((vendor: any) => (
                              <TableRow key={vendor.id}>
                                <TableCell className="font-medium">{vendor.businessName}</TableCell>
                                <TableCell>{vendor.contactEmail}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    vendor.approvalStatus === 'approved' ? 'default' :
                                    vendor.approvalStatus === 'pending' ? 'secondary' : 'destructive'
                                  }>
                                    {vendor.approvalStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {vendor.stripeChargesEnabled ? (
                                    <Badge className="bg-blue-500">Connected</Badge>
                                  ) : (
                                    <Badge variant="outline">Not Connected</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{vendor.registrationDate ? format(new Date(vendor.registrationDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Commissions Report */}
          <TabsContent value="commissions">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Commissions Report</h2>
                  <p className="text-muted-foreground">Reseller earnings and commission tracking by order source</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild data-testid="button-commission-analytics">
                    <Link href="/admin/commission-analytics">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Partner Analytics
                    </Link>
                  </Button>
                  <Button onClick={() => handleExport("commissions")} data-testid="button-export-commissions">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {commissionsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : commissionsReport ? (
                <>
                  {/* Modern Gradient KPI Cards */}
                  <div className="grid gap-6 md:grid-cols-5">
                    <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Resellers</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{commissionsReport.summary?.totalResellers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">{commissionsReport.summary?.activeResellers || 0} active</p>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Total Orders</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">{commissionsReport.summary?.totalOrders || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">All channels</p>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Sales</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                          {formatCurrency(commissionsReport.summary?.totalSales || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Commissions</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                          {formatCurrency(commissionsReport.summary?.totalCommissions || 0)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative group border-0 bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-rose-500/20 backdrop-blur-xl shadow-2xl shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-red-500/10 rounded-xl blur-xl" />
                      <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
                      <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">B2B Wholesale</CardTitle>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="text-3xl font-black bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 bg-clip-text text-transparent">{commissionsReport.summary?.wholesaleOrders || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(commissionsReport.summary?.wholesaleSales || 0)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Channel Breakdown */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-blue-500" />
                          <CardTitle className="text-sm font-medium">Storefront Orders</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Orders:</span>
                            <span className="font-medium">{commissionsReport.summary?.storefrontOrders || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sales:</span>
                            <span className="font-medium text-green-600">{formatCurrency(commissionsReport.summary?.storefrontSales || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission:</span>
                            <span className="font-medium text-primary">{formatCurrency(commissionsReport.summary?.storefrontCommissions || 0)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-orange-500" />
                          <CardTitle className="text-sm font-medium">EPOS Orders</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Orders:</span>
                            <span className="font-medium">{commissionsReport.summary?.eposOrders || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sales:</span>
                            <span className="font-medium text-green-600">{formatCurrency(commissionsReport.summary?.eposSales || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission:</span>
                            <span className="font-medium text-primary">{formatCurrency(commissionsReport.summary?.eposCommissions || 0)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Reseller Performance Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle>Reseller Performance by Channel</CardTitle>
                          <CardDescription>Detailed breakdown of orders from storefront vs EPOS</CardDescription>
                        </div>
                        <div className="relative w-56">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search reseller…"
                            value={commissionsSearch}
                            onChange={e => setCommissionsSearch(e.target.value)}
                            className="pl-8"
                            data-testid="input-commissions-search"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reseller</TableHead>
                              <TableHead className="text-center">Tier</TableHead>
                              <TableHead className="text-center">Rate</TableHead>
                              <TableHead className="text-right">Storefront</TableHead>
                              <TableHead className="text-right">EPOS</TableHead>
                              <TableHead className="text-right">B2B</TableHead>
                              <TableHead className="text-right">Total Sales</TableHead>
                              <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(commissionsReport.resellers || []).filter((r: any) => r.totalOrders > 0 && (!commissionsSearch || r.name?.toLowerCase().includes(commissionsSearch.toLowerCase()) || r.email?.toLowerCase().includes(commissionsSearch.toLowerCase()))).map((reseller: any) => (
                              <TableRow key={reseller.resellerId} data-testid={`row-reseller-${reseller.resellerId}`}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{reseller.name}</p>
                                    <p className="text-sm text-muted-foreground">{reseller.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="capitalize">{reseller.tier || 'standard'}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {parseFloat(reseller.commissionRate || '0').toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  <div>
                                    <p className="font-medium">{reseller.storefrontOrders || 0} orders</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(reseller.storefrontSales || 0)}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div>
                                    <p className="font-medium">{reseller.eposOrders || 0} orders</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(reseller.eposSales || 0)}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div>
                                    <p className="font-medium">{reseller.wholesaleOrders || 0} orders</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(reseller.wholesaleSales || 0)}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(reseller.totalSales || 0)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-primary">
                                  {formatCurrency(reseller.totalCommission || 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                            {(commissionsReport.resellers || []).filter((r: any) => r.totalOrders > 0).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                  No reseller orders in selected period
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
