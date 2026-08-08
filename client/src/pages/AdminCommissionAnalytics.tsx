import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, DollarSign, Users, Store, ArrowLeft,
  PieChart, BarChart3, Activity, Clock, CheckCircle, 
  AlertCircle, Building2, Calendar, X, Eye, Download,
  ArrowUpRight, ArrowDownRight, Target, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line
} from "recharts";

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num || 0);
}

function formatMonth(month: string): string {
  if (!month) return '';
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return format(date, 'MMM yyyy');
}

interface OverviewData {
  totalCommissions: string;
  totalCommissionCount: number;
  totalPaid: string;
  pendingPayouts: string;
  thisMonthCommissions: string;
  thisMonthCount: number;
  activeResellers: number;
  activeVendors: number;
  pendingPayoutRequests: number;
}

interface TrendsData {
  monthlyCommissions: Array<{
    month: string;
    totalAmount: string;
    count: number;
    resellerAmount: string;
    vendorAmount: string;
  }>;
  monthlyPayouts: Array<{
    month: string;
    totalPaid: string;
    count: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    total: string;
    count: number;
  }>;
}

interface TopEarnersData {
  topResellers: Array<{
    resellerId: string;
    totalEarned: string;
    totalOrders: number;
    paidAmount: string;
    pendingAmount: string;
    partnerType: string;
    businessName: string;
    tier?: string;
    commissionRate?: string;
  }>;
  topVendors: Array<{
    vendorId: string;
    totalEarned: string;
    totalOrders: number;
    paidAmount: string;
    pendingAmount: string;
    partnerType: string;
    businessName: string;
    commissionRate?: string;
  }>;
  topPartners: Array<any>;
}

interface PartnerDetailData {
  partner: {
    id: string;
    businessName: string;
    partnerType: string;
    tier?: string;
    commissionRate?: string;
    stripeConnectId?: string;
  };
  summary: {
    totalEarned: string;
    paidAmount: string;
    pendingAmount: string;
    totalOrders: number;
  };
  filteredSummary: {
    totalEarned: string;
    paidAmount: string;
    pendingAmount: string;
    totalOrders: number;
  };
  commissions: Array<{
    id: number;
    orderId: number;
    amount: string;
    status: string;
    createdAt: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    total: string;
    count: number;
  }>;
}

interface SelectedPartner {
  id: string;
  type: 'reseller' | 'vendor';
  name: string;
}

interface PartnerComparisonData {
  partners: Array<{
    partnerId: string;
    partnerType: string;
    businessName: string;
    currentPeriodAmount: string;
    previousPeriodAmount: string;
    growthPercent: number;
    orderCount: number;
    averageOrderValue: string;
  }>;
  summary: {
    totalCurrentPeriod: string;
    totalPreviousPeriod: string;
    overallGrowth: number;
  };
}

interface ForecastData {
  nextMonthForecast: string;
  next3MonthsForecast: string;
  confidenceLevel: string;
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  historicalData: Array<{
    month: string;
    actual: string;
  }>;
}

export default function AdminCommissionAnalytics() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<"3months" | "6months" | "12months">("6months");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPartner, setSelectedPartner] = useState<SelectedPartner | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date())
  });
  const { toast } = useToast();

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewData>({
    queryKey: ["/api/admin/commission-analytics/overview"],
    enabled: authUser?.role === "admin",
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<TrendsData>({
    queryKey: ["/api/admin/commission-analytics/trends", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/commission-analytics/trends?period=${period}`);
      return res.json();
    },
    enabled: authUser?.role === "admin",
  });

  const { data: topEarners, isLoading: earnersLoading } = useQuery<TopEarnersData>({
    queryKey: ["/api/admin/commission-analytics/top-earners"],
    enabled: authUser?.role === "admin",
  });

  const { data: partnerDetail, isLoading: partnerDetailLoading } = useQuery<PartnerDetailData>({
    queryKey: [
      "/api/admin/commission-analytics/partner",
      selectedPartner?.type,
      selectedPartner?.id,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString()
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.from) params.set('startDate', dateRange.from.toISOString());
      if (dateRange.to) params.set('endDate', dateRange.to.toISOString());
      const res = await fetch(
        `/api/admin/commission-analytics/partner/${selectedPartner!.type}/${selectedPartner!.id}?${params.toString()}`
      );
      return res.json();
    },
    enabled: !!selectedPartner && authUser?.role === "admin",
  });

  const { data: partnerComparison, isLoading: comparisonLoading, error: comparisonError } = useQuery<PartnerComparisonData>({
    queryKey: [`/api/admin/commission-analytics/partner-comparison?period=${period}`],
    enabled: authUser?.role === "admin",
  });

  const { data: forecast, isLoading: forecastLoading, error: forecastError } = useQuery<ForecastData>({
    queryKey: ["/api/admin/commission-analytics/forecast"],
    enabled: authUser?.role === "admin",
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/commission-analytics/export?period=${period}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Export failed: ${res.status} ${res.statusText}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commission-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast({
        title: "Export successful",
        description: "Your commission analytics CSV has been downloaded.",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "Unable to download the CSV file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePartnerClick = (id: string, type: 'reseller' | 'vendor', name: string) => {
    setSelectedPartner({ id, type, name });
  };

  const partnerTrendData = partnerDetail?.monthlyTrend?.map(item => ({
    month: formatMonth(item.month),
    total: parseFloat(item.total),
    count: item.count
  })) || [];

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

  const chartData = trends?.monthlyCommissions?.map(item => ({
    month: formatMonth(item.month),
    total: parseFloat(item.totalAmount),
    reseller: parseFloat(item.resellerAmount),
    vendor: parseFloat(item.vendorAmount),
    count: item.count
  })) || [];

  const payoutChartData = trends?.monthlyPayouts?.map(item => ({
    month: formatMonth(item.month),
    paid: parseFloat(item.totalPaid),
    count: item.count
  })) || [];

  const statusData = trends?.statusBreakdown?.map((item, index) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: parseFloat(item.total),
    count: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/admin/payouts")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Commission Analytics</h1>
            <p className="text-muted-foreground">Track partner earnings and payout performance</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card data-testid="card-total-commissions">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview?.totalCommissions || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {overview?.totalCommissionCount || 0} commission records
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-paid-out">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(overview?.totalPaid || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Successfully paid to partners
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(overview?.pendingPayouts || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {overview?.pendingPayoutRequests || 0} requests pending
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-this-month">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(overview?.thisMonthCommissions || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {overview?.thisMonthCount || 0} new commissions
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card data-testid="card-active-partners">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Resellers</span>
                  </div>
                  <p className="text-2xl font-bold">{overview?.activeResellers || 0}</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Wholesalers</span>
                  </div>
                  <p className="text-2xl font-bold">{overview?.activeVendors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild data-testid="button-manage-payouts">
                <Link href="/admin/payouts">Manage Payouts</Link>
              </Button>
              <Button variant="outline" size="sm" asChild data-testid="button-commission-tiers">
                <Link href="/admin/resellers">Commission Tiers</Link>
              </Button>
              <Button variant="outline" size="sm" asChild data-testid="button-partner-settings">
                <Link href="/admin/b2b-access">Partner Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
              <TabsTrigger value="comparison" data-testid="tab-comparison">Comparison</TabsTrigger>
              <TabsTrigger value="forecast" data-testid="tab-forecast">Forecast</TabsTrigger>
              <TabsTrigger value="top-earners" data-testid="tab-top-earners">Top Earners</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <SelectTrigger className="w-40" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                disabled={isExporting}
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Commission Breakdown
                  </CardTitle>
                  <CardDescription>Reseller vs Wholesaler commissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="reseller" name="Resellers" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="vendor" name="Wholesalers" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No commission data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Commission Status
                  </CardTitle>
                  <CardDescription>Distribution by status</CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${formatCurrency(value)} (${props.payload.count} records)`,
                            name
                          ]}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No status data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Commission Trend
                  </CardTitle>
                  <CardDescription>Total commissions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          name="Total Commission"
                          stroke="#3B82F6" 
                          fill="#3B82F6" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Payout History
                  </CardTitle>
                  <CardDescription>Completed payouts by month</CardDescription>
                </CardHeader>
                <CardContent>
                  {trendsLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : payoutChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={payoutChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="paid" 
                          name="Paid Out"
                          stroke="#10B981" 
                          strokeWidth={2}
                          dot={{ fill: '#10B981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No payout data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <Card data-testid="card-comparison-current">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(partnerComparison?.summary?.totalCurrentPeriod || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total commissions this period</p>
                </CardContent>
              </Card>
              <Card data-testid="card-comparison-previous">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Previous Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {formatCurrency(partnerComparison?.summary?.totalPreviousPeriod || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">For comparison</p>
                </CardContent>
              </Card>
              <Card data-testid="card-comparison-growth">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${
                    (partnerComparison?.summary?.overallGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(partnerComparison?.summary?.overallGrowth || 0) >= 0 ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                    {Math.abs(partnerComparison?.summary?.overallGrowth || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Period over period</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Partner Performance Comparison
                </CardTitle>
                <CardDescription>Growth rates and performance metrics by partner</CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : comparisonError ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p>Failed to load comparison data</p>
                  </div>
                ) : partnerComparison?.partners && partnerComparison.partners.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Previous</TableHead>
                        <TableHead className="text-right">Growth</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partnerComparison.partners.map((partner, index) => (
                        <TableRow key={partner.partnerId} data-testid={`row-comparison-${index}`}>
                          <TableCell className="font-medium">{partner.businessName}</TableCell>
                          <TableCell>
                            <Badge variant={partner.partnerType === 'reseller' ? 'default' : 'secondary'} className="capitalize">
                              {partner.partnerType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(partner.currentPeriodAmount)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(partner.previousPeriodAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`flex items-center justify-end gap-1 ${
                              partner.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {partner.growthPercent >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {Math.abs(partner.growthPercent).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{partner.orderCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(partner.averageOrderValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No comparison data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
              <Card data-testid="card-forecast-next-month">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Next Month Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {forecastLoading ? (
                    <div className="animate-pulse h-8 bg-muted rounded" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(forecast?.nextMonthForecast || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Projected commission</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card data-testid="card-forecast-3months">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    3-Month Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {forecastLoading ? (
                    <div className="animate-pulse h-8 bg-muted rounded" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(forecast?.next3MonthsForecast || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Projected total</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card data-testid="card-forecast-trend">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Trend Direction</CardTitle>
                </CardHeader>
                <CardContent>
                  {forecastLoading ? (
                    <div className="animate-pulse h-8 bg-muted rounded" />
                  ) : (
                    <>
                      <div className={`text-2xl font-bold flex items-center gap-2 ${
                        forecast?.trend === 'up' ? 'text-green-600' : 
                        forecast?.trend === 'down' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {forecast?.trend === 'up' && <ArrowUpRight className="h-5 w-5" />}
                        {forecast?.trend === 'down' && <ArrowDownRight className="h-5 w-5" />}
                        {forecast?.trend === 'stable' && <Activity className="h-5 w-5" />}
                        {forecast?.trend ? forecast.trend.charAt(0).toUpperCase() + forecast.trend.slice(1) : 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {forecast?.growthRate ? `${forecast.growthRate.toFixed(1)}% monthly rate` : 'Based on history'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card data-testid="card-forecast-confidence">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
                </CardHeader>
                <CardContent>
                  {forecastLoading ? (
                    <div className="animate-pulse h-8 bg-muted rounded" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold capitalize">
                        {forecast?.confidenceLevel || 'Low'}
                      </div>
                      <Progress 
                        value={
                          forecast?.confidenceLevel === 'high' ? 90 :
                          forecast?.confidenceLevel === 'medium' ? 60 : 30
                        } 
                        className="h-2 mt-2"
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Historical Data & Projection
                </CardTitle>
                <CardDescription>
                  Past performance used for forecasting future commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {forecastLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : forecastError ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p>Failed to load forecast data</p>
                  </div>
                ) : forecast?.historicalData && forecast.historicalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={forecast.historicalData.map(d => ({
                      month: formatMonth(d.month),
                      actual: parseFloat(d.actual)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual Commission"
                        stroke="#8B5CF6" 
                        fill="#8B5CF6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Not enough historical data for forecasting
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Forecast Methodology</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Forecasts are calculated using weighted moving averages based on recent commission trends.</p>
                  <p>Confidence levels reflect the consistency of historical data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>High:</strong> Consistent growth pattern with low variance</li>
                    <li><strong>Medium:</strong> Moderate variation in monthly data</li>
                    <li><strong>Low:</strong> High variance or insufficient data points</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-earners" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Top Resellers
                  </CardTitle>
                  <CardDescription>Highest earning reseller partners</CardDescription>
                </CardHeader>
                <CardContent>
                  {earnersLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : topEarners?.topResellers && topEarners.topResellers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead className="text-right">Total Earned</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topEarners.topResellers.slice(0, 5).map((reseller, index) => (
                          <TableRow 
                            key={reseller.resellerId} 
                            data-testid={`row-reseller-${index}`}
                            className="cursor-pointer hover-elevate"
                            onClick={() => handlePartnerClick(reseller.resellerId, 'reseller', reseller.businessName)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {reseller.businessName}
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {reseller.tier || 'bronze'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatCurrency(reseller.totalEarned)}
                            </TableCell>
                            <TableCell className="text-right text-amber-600">
                              {formatCurrency(reseller.pendingAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No reseller commission data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-purple-500" />
                    Top Wholesalers
                  </CardTitle>
                  <CardDescription>Highest earning wholesaler partners</CardDescription>
                </CardHeader>
                <CardContent>
                  {earnersLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : topEarners?.topVendors && topEarners.topVendors.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead className="text-right">Total Earned</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topEarners.topVendors.slice(0, 5).map((vendor, index) => (
                          <TableRow 
                            key={vendor.vendorId} 
                            data-testid={`row-vendor-${index}`}
                            className="cursor-pointer hover-elevate"
                            onClick={() => handlePartnerClick(vendor.vendorId, 'vendor', vendor.businessName)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {vendor.businessName}
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {vendor.commissionRate || '0'}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatCurrency(vendor.totalEarned)}
                            </TableCell>
                            <TableCell className="text-right text-amber-600">
                              {formatCurrency(vendor.pendingAmount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No vendor commission data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Partners Ranking</CardTitle>
                <CardDescription>Combined ranking of all partners by total earnings</CardDescription>
              </CardHeader>
              <CardContent>
                {earnersLoading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : topEarners?.topPartners && topEarners.topPartners.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Total Earned</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topEarners.topPartners.map((partner, index) => (
                        <TableRow 
                          key={partner.resellerId || partner.vendorId} 
                          data-testid={`row-partner-${index}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => handlePartnerClick(
                            partner.resellerId || partner.vendorId,
                            partner.partnerType as 'reseller' | 'vendor',
                            partner.businessName
                          )}
                        >
                          <TableCell className="font-bold">{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {partner.businessName}
                              <Eye className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={partner.partnerType === 'reseller' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {partner.partnerType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{partner.totalOrders}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(partner.totalEarned)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(partner.paidAmount)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600">
                            {formatCurrency(partner.pendingAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No partner data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-partner-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPartner?.type === 'reseller' ? (
                <Building2 className="h-5 w-5 text-blue-500" />
              ) : (
                <Store className="h-5 w-5 text-purple-500" />
              )}
              {selectedPartner?.name} - Commission Report
            </DialogTitle>
            <DialogDescription>
              Detailed commission history and analytics for this partner
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card className="p-4 bg-muted/30">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Filter by Date Range:</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-date-from">
                        {dateRange.from ? format(dateRange.from, 'dd MMM yyyy') : 'Start Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-date-to">
                        {dateRange.to ? format(dateRange.to, 'dd MMM yyyy') : 'End Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                    data-testid="button-clear-dates"
                  >
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Selected Period:</span>
                  {dateRange.from || dateRange.to ? (
                    <Badge variant="secondary" className="font-normal" data-testid="badge-selected-range">
                      {dateRange.from ? format(dateRange.from, 'dd MMM yyyy') : 'Any'} 
                      {' - '}
                      {dateRange.to ? format(dateRange.to, 'dd MMM yyyy') : 'Any'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal" data-testid="badge-all-time">
                      All Time
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {partnerDetailLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : partnerDetail ? (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">All-Time Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(partnerDetail.summary?.totalEarned || 0)}</div>
                      <p className="text-xs text-muted-foreground">{partnerDetail.summary?.totalOrders || 0} orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Filtered Period</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(partnerDetail.filteredSummary?.totalEarned || 0)}</div>
                      <p className="text-xs text-muted-foreground">{partnerDetail.filteredSummary?.totalOrders || 0} orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(partnerDetail.summary?.paidAmount || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{formatCurrency(partnerDetail.summary?.pendingAmount || 0)}</div>
                    </CardContent>
                  </Card>
                </div>

                {partnerTrendData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Monthly Commission Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={partnerTrendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={(v) => `£${v}`} tick={{ fontSize: 11 }} />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#3B82F6" 
                            fill="#3B82F6" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {partnerDetail.commissions && partnerDetail.commissions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Commission History</CardTitle>
                      <CardDescription>Recent commission records within the selected date range</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partnerDetail.commissions.slice(0, 10).map((commission) => (
                            <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                              <TableCell className="font-medium">#{commission.orderId}</TableCell>
                              <TableCell>{format(new Date(commission.createdAt), 'dd MMM yyyy')}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={commission.status === 'paid' ? 'default' : 'secondary'}
                                  className="capitalize"
                                >
                                  {commission.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(commission.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {partnerDetail.commissions.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center mt-4">
                          Showing 10 of {partnerDetail.commissions.length} records
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available for this partner
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
