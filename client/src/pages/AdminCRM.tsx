import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Star,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Target,
  Heart,
  Crown,
  Zap,
  Activity,
  PieChart,
  BarChart3,
  Eye,
  Send,
  Gift,
  Award,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  Settings,
  MoreHorizontal,
  Tag,
  Bookmark,
  Bell,
  History,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInDays, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
};

type CustomerMetrics = {
  userId: string;
  totalOrders: number;
  totalSpent: string;
  averageOrderValue: string;
  lifetimeValue: string;
  lastPurchaseDate: string | null;
  isVip: boolean;
  churnRisk: string | null;
  acquisitionResellerId: string | null;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  orderDate: string;
  itemCount: number;
};

type CustomerInteraction = {
  id: string;
  interactionType: string;
  subject: string | null;
  content: string | null;
  createdAt: string;
  resellerId: string | null;
};

type CustomerNote = {
  id: string;
  userId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

type CustomerSegment = {
  id: string;
  name: string;
  description: string | null;
  criteria: string;
  memberCount: number;
  isActive: boolean;
};

type LoyaltyTier = {
  id: string;
  tier: string;
  discountPercent: number;
  pointsMultiplier: number;
};

type CustomerLifecycleStage = "new" | "active" | "at_risk" | "churned" | "vip" | "champion";

type RFMScore = {
  recency: number;
  frequency: number;
  monetary: number;
  totalScore: number;
  segment: string;
};

type CustomerHealthScore = {
  score: number;
  trend: "up" | "down" | "stable";
  factors: {
    engagement: number;
    purchaseHistory: number;
    loyalty: number;
    satisfaction: number;
  };
};

// Helper function to calculate customer lifecycle stage
function getCustomerLifecycleStage(customer: Customer, metrics: CustomerMetrics | null | undefined): CustomerLifecycleStage {
  if (!metrics) return "new";
  const daysSinceJoined = differenceInDays(new Date(), new Date(customer.createdAt));
  const daysSinceLastPurchase = metrics.lastPurchaseDate 
    ? differenceInDays(new Date(), new Date(metrics.lastPurchaseDate)) 
    : 999;
  const totalSpent = parseFloat(metrics.totalSpent || "0");
  
  if (metrics.isVip && totalSpent > 500) return "champion";
  if (metrics.isVip) return "vip";
  if (daysSinceLastPurchase > 90 || metrics.churnRisk === "high") return "churned";
  if (daysSinceLastPurchase > 60 || metrics.churnRisk === "medium") return "at_risk";
  if (daysSinceJoined < 30 && metrics.totalOrders <= 1) return "new";
  return "active";
}

// Helper function to calculate RFM score
function calculateRFMScore(metrics: CustomerMetrics | null | undefined): RFMScore {
  if (!metrics) return { recency: 0, frequency: 0, monetary: 0, totalScore: 0, segment: "Unknown" };
  
  const daysSinceLastPurchase = metrics.lastPurchaseDate 
    ? differenceInDays(new Date(), new Date(metrics.lastPurchaseDate)) 
    : 999;
  const totalSpent = parseFloat(metrics.totalSpent || "0");
  
  // Score 1-5 for each dimension
  const recency = daysSinceLastPurchase < 7 ? 5 : daysSinceLastPurchase < 30 ? 4 : daysSinceLastPurchase < 60 ? 3 : daysSinceLastPurchase < 90 ? 2 : 1;
  const frequency = metrics.totalOrders >= 10 ? 5 : metrics.totalOrders >= 5 ? 4 : metrics.totalOrders >= 3 ? 3 : metrics.totalOrders >= 1 ? 2 : 1;
  const monetary = totalSpent >= 1000 ? 5 : totalSpent >= 500 ? 4 : totalSpent >= 200 ? 3 : totalSpent >= 50 ? 2 : 1;
  const totalScore = recency + frequency + monetary;
  
  let segment = "Hibernating";
  if (recency >= 4 && frequency >= 4) segment = "Champion";
  else if (recency >= 4 && frequency >= 2) segment = "Loyal";
  else if (recency >= 3 && frequency >= 3) segment = "Potential Loyalist";
  else if (recency >= 4 && frequency === 1) segment = "New Customer";
  else if (recency <= 2 && frequency >= 3) segment = "At Risk";
  else if (recency <= 2 && frequency <= 2) segment = "Needs Attention";
  
  return { recency, frequency, monetary, totalScore, segment };
}

// Helper function to calculate health score
function calculateHealthScore(customer: Customer, metrics: CustomerMetrics | null | undefined): CustomerHealthScore {
  if (!metrics) return { score: 50, trend: "stable", factors: { engagement: 50, purchaseHistory: 50, loyalty: 50, satisfaction: 50 } };
  
  const rfm = calculateRFMScore(metrics);
  const engagement = Math.min(100, (rfm.recency / 5) * 100);
  const purchaseHistory = Math.min(100, (metrics.totalOrders / 10) * 100);
  const loyalty = metrics.isVip ? 100 : Math.min(100, (parseFloat(metrics.totalSpent || "0") / 500) * 100);
  const satisfaction = 70; // Placeholder - would come from reviews/feedback
  
  const score = Math.round((engagement + purchaseHistory + loyalty + satisfaction) / 4);
  const trend = rfm.recency >= 4 ? "up" : rfm.recency <= 2 ? "down" : "stable";
  
  return { score, trend, factors: { engagement, purchaseHistory, loyalty, satisfaction } };
}

export default function AdminCRM() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [vipFilter, setVipFilter] = useState<string>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("all");
  const [churnRiskFilter, setChurnRiskFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [mainTab, setMainTab] = useState<string>("customers");
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    interactionType: "email",
    subject: "",
    content: "",
    orderId: "",
  });
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditNote, setShowEditNote] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);
  const [noteForm, setNoteForm] = useState({ note: "" });
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagForm, setTagForm] = useState({ name: "", color: "#3B82F6", description: "" });
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string; description?: string } | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; email: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== "admin")) {
      setLocation("/");
    }
  }, [authUser, authLoading, setLocation]);

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
    enabled: authUser?.role === "admin",
  });

  const { data: dashboardMetrics } = useQuery<{
    totalCustomers: number;
    totalRevenue: number;
    avgOrderValue: number;
    vipCustomers: number;
  }>({
    queryKey: ["/api/admin/dashboard-metrics"],
    enabled: authUser?.role === "admin",
  });

  const { data: customerMetrics } = useQuery<CustomerMetrics | null>({
    queryKey: ["/api/admin/customers", selectedCustomer?.id, "metrics"],
    enabled: !!selectedCustomer && authUser?.role === "admin",
  });

  const { data: customerOrders = [] } = useQuery<CustomerOrder[]>({
    queryKey: ["/api/admin/customers", selectedCustomer?.id, "orders"],
    enabled: !!selectedCustomer && authUser?.role === "admin",
  });

  const { data: customerInteractions = [] } = useQuery<CustomerInteraction[]>({
    queryKey: ["/api/admin/customers", selectedCustomer?.id, "interactions"],
    enabled: !!selectedCustomer && authUser?.role === "admin",
  });

  const { data: customerNotes = [] } = useQuery<CustomerNote[]>({
    queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"],
    enabled: !!selectedCustomer && authUser?.role === "admin",
  });

  const { data: marketingTags = [], isLoading: tagsLoading } = useQuery<Array<{ id: string; name: string; color: string; description?: string; createdAt: string }>>({
    queryKey: ["/api/admin/marketing-tags"],
    enabled: authUser?.role === "admin",
  });

  const { data: segments = [] } = useQuery<CustomerSegment[]>({
    queryKey: ["/api/admin/segments"],
    enabled: authUser?.role === "admin",
  });

  const { data: loyaltyTiers = [] } = useQuery<LoyaltyTier[]>({
    queryKey: ["/api/admin/loyalty-tiers"],
    enabled: authUser?.role === "admin",
  });

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color: string; description?: string }) =>
      apiRequest("POST", "/api/admin/marketing-tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing-tags"] });
      setTagForm({ name: "", color: "#3B82F6", description: "" });
      toast({ title: "Tag Created", description: "Marketing tag created successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create tag.", variant: "destructive" });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: (data: { id: string; name: string; color: string; description?: string }) =>
      apiRequest("PATCH", `/api/admin/marketing-tags/${data.id}`, { name: data.name, color: data.color, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing-tags"] });
      setEditingTag(null);
      toast({ title: "Tag Updated", description: "Marketing tag updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update tag.", variant: "destructive" });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/marketing-tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing-tags"] });
      toast({ title: "Tag Deleted", description: "Marketing tag deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete tag.", variant: "destructive" });
    },
  });

  const { data: acquisitionReseller } = useQuery<{ id: string; businessName: string } | null>({
    queryKey: ["/api/resellers", customerMetrics?.acquisitionResellerId],
    enabled: !!customerMetrics?.acquisitionResellerId && authUser?.role === "admin",
  });

  const logInteractionMutation = useMutation({
    mutationFn: (data: { interactionType: string; subject: string; content: string; orderId?: string }) =>
      apiRequest("POST", `/api/admin/customers/${selectedCustomer?.id}/interactions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "interactions"] });
      setShowLogInteraction(false);
      setInteractionForm({
        interactionType: "email",
        subject: "",
        content: "",
        orderId: "",
      });
      toast({
        title: "Interaction Logged",
        description: "Customer interaction has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log interaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (data: { note: string }) =>
      apiRequest("POST", `/api/admin/customers/${selectedCustomer?.id}/notes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"] });
      setShowAddNote(false);
      setNoteForm({ note: "" });
      toast({
        title: "Note Added",
        description: "Customer note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: (data: { id: string; note: string }) =>
      apiRequest("PATCH", `/api/admin/customers/notes/${data.id}`, { note: data.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"] });
      setShowEditNote(false);
      setEditingNote(null);
      setNoteForm({ note: "" });
      toast({
        title: "Note Updated",
        description: "Customer note has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/customers/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "notes"] });
      toast({
        title: "Note Deleted",
        description: "Customer note has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleVipMutation = useMutation({
    mutationFn: (data: { userId: string; isVip: boolean }) =>
      apiRequest("PATCH", `/api/admin/customers/${data.userId}/vip`, { isVip: data.isVip }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomer?.id, "metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-customer-metrics"] });
      toast({
        title: "VIP Status Updated",
        description: "Customer VIP status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update VIP status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch all customer metrics for filtering
  const { data: allCustomerMetrics = [] } = useQuery<CustomerMetrics[]>({
    queryKey: ["/api/admin/all-customer-metrics"],
    enabled: authUser?.role === "admin",
  });

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = `${customer.firstName} ${customer.lastName} ${customer.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || customer.role === roleFilter;
    
    const customerMetric = allCustomerMetrics.find(m => m.userId === customer.id);
    const matchesVip = vipFilter === "all" || 
      (vipFilter === "vip" && customerMetric?.isVip) ||
      (vipFilter === "non-vip" && !customerMetric?.isVip);
    
    const lifecycle = getCustomerLifecycleStage(customer, customerMetric);
    const matchesLifecycle = lifecycleFilter === "all" || lifecycle === lifecycleFilter;
    
    const matchesChurnRisk = churnRiskFilter === "all" || 
      (churnRiskFilter === "high" && customerMetric?.churnRisk === "high") ||
      (churnRiskFilter === "medium" && customerMetric?.churnRisk === "medium") ||
      (churnRiskFilter === "low" && (customerMetric?.churnRisk === "low" || !customerMetric?.churnRisk));
    
    return matchesSearch && matchesRole && matchesVip && matchesLifecycle && matchesChurnRisk;
  });

  const hasActiveFilters = roleFilter !== "all" || vipFilter !== "all" || lifecycleFilter !== "all" || churnRiskFilter !== "all";

  // Calculate CRM analytics
  const crmAnalytics = {
    totalCustomers: customers.length,
    newCustomersThisMonth: customers.filter(c => differenceInDays(new Date(), new Date(c.createdAt)) <= 30).length,
    activeCustomers: customers.filter(c => {
      const m = allCustomerMetrics.find(m => m.userId === c.id);
      return getCustomerLifecycleStage(c, m) === "active";
    }).length,
    atRiskCustomers: customers.filter(c => {
      const m = allCustomerMetrics.find(m => m.userId === c.id);
      return getCustomerLifecycleStage(c, m) === "at_risk";
    }).length,
    churnedCustomers: customers.filter(c => {
      const m = allCustomerMetrics.find(m => m.userId === c.id);
      return getCustomerLifecycleStage(c, m) === "churned";
    }).length,
    vipCustomers: allCustomerMetrics.filter(m => m.isVip).length,
    championCustomers: customers.filter(c => {
      const m = allCustomerMetrics.find(m => m.userId === c.id);
      return getCustomerLifecycleStage(c, m) === "champion";
    }).length,
    avgLifetimeValue: allCustomerMetrics.length > 0 
      ? allCustomerMetrics.reduce((sum, m) => sum + parseFloat(m.lifetimeValue || "0"), 0) / allCustomerMetrics.length 
      : 0,
    totalRevenue: allCustomerMetrics.reduce((sum, m) => sum + parseFloat(m.totalSpent || "0"), 0),
  };

  // Lifecycle distribution
  const lifecycleDistribution = {
    new: customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "new").length,
    active: customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "active").length,
    at_risk: customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "at_risk").length,
    churned: customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "churned").length,
    vip: customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "vip").length,
    champion: customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "champion").length,
  };

  // Toggle customer selection for bulk actions
  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  // Select all filtered customers
  const selectAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  // Export customers to CSV
  const exportCustomersToCSV = () => {
    const headers = ["Name", "Email", "Role", "Joined", "Total Orders", "Total Spent", "Lifecycle Stage", "VIP Status"];
    const rows = filteredCustomers.map(c => {
      const m = allCustomerMetrics.find(m => m.userId === c.id);
      return [
        `${c.firstName} ${c.lastName}`,
        c.email,
        c.role,
        format(new Date(c.createdAt), "yyyy-MM-dd"),
        m?.totalOrders || 0,
        m?.totalSpent || "0.00",
        getCustomerLifecycleStage(c, m),
        m?.isVip ? "Yes" : "No"
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Complete", description: `Exported ${filteredCustomers.length} customers to CSV.` });
  };

  const clearFilters = () => {
    setRoleFilter("all");
    setVipFilter("all");
    setLifecycleFilter("all");
    setChurnRiskFilter("all");
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500",
      processing: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
      refunded: "bg-orange-500",
    };
    return statusColors[status] || "bg-gray-500";
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "support_ticket":
        return <MessageSquare className="w-4 h-4" />;
      case "purchase":
        return <ShoppingBag className="w-4 h-4" />;
      case "complaint":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getLifecycleBadge = (stage: CustomerLifecycleStage) => {
    const configs: Record<CustomerLifecycleStage, { color: string; icon: JSX.Element; label: string }> = {
      new: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <UserPlus className="w-3 h-3" />, label: "New" },
      active: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <Activity className="w-3 h-3" />, label: "Active" },
      at_risk: { color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: <AlertTriangle className="w-3 h-3" />, label: "At Risk" },
      churned: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <UserMinus className="w-3 h-3" />, label: "Churned" },
      vip: { color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: <Star className="w-3 h-3" />, label: "VIP" },
      champion: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Crown className="w-3 h-3" />, label: "Champion" },
    };
    const config = configs[stage];
    return (
      <Badge variant="outline" className={`${config.color} border gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold" data-testid="crm-title">
                Customer Relationship Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive 360-degree customer intelligence platform
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCustomersToCSV}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagManager(true)}
                data-testid="button-manage-tags"
              >
                <Tag className="w-4 h-4 mr-2" />
                Manage Tags
              </Button>
              <Button
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] })}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Badge variant="secondary" className="text-base px-3 py-1.5">
                <Users className="w-4 h-4 mr-2" />
                {crmAnalytics.totalCustomers} Customers
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Main CRM Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid gap-2">
            <TabsTrigger value="customers" className="flex items-center gap-2" data-testid="tab-customers">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="lifecycle" className="flex items-center gap-2" data-testid="tab-lifecycle">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Lifecycle</span>
            </TabsTrigger>
            <TabsTrigger value="segments" className="flex items-center gap-2" data-testid="tab-segments">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Segments</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card data-testid="card-total-customers">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{crmAnalytics.totalCustomers}</p>
                      <p className="text-xs text-muted-foreground">Total Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-new-customers">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{crmAnalytics.newCustomersThisMonth}</p>
                      <p className="text-xs text-muted-foreground">New This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-active-customers">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{crmAnalytics.activeCustomers}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-at-risk-customers">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{crmAnalytics.atRiskCustomers}</p>
                      <p className="text-xs text-muted-foreground">At Risk</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-vip-customers">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{crmAnalytics.vipCustomers}</p>
                      <p className="text-xs text-muted-foreground">VIP Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-churned-customers">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <UserMinus className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{crmAnalytics.churnedCustomers}</p>
                      <p className="text-xs text-muted-foreground">Churned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue and Lifetime Value */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Revenue Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="text-xl font-bold text-green-500">£{crmAnalytics.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Avg Lifetime Value</span>
                    <span className="text-xl font-bold">£{crmAnalytics.avgLifetimeValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Avg Order Value</span>
                    <span className="text-xl font-bold">£{dashboardMetrics?.avgOrderValue?.toFixed(2) || "0.00"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    Customer Lifecycle Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(lifecycleDistribution).map(([stage, count]) => (
                      <div key={stage} className="flex items-center gap-3">
                        <div className="w-24">{getLifecycleBadge(stage as CustomerLifecycleStage)}</div>
                        <div className="flex-1">
                          <Progress value={crmAnalytics.totalCustomers > 0 ? (count / crmAnalytics.totalCustomers) * 100 : 0} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">{count} ({crmAnalytics.totalCustomers > 0 ? ((count / crmAnalytics.totalCustomers) * 100).toFixed(0) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RFM Analysis Quick View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  RFM Analysis Overview
                </CardTitle>
                <CardDescription>Recency, Frequency, Monetary segmentation of your customer base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-500">Champions</span>
                    </div>
                    <p className="text-2xl font-bold">{customers.filter(c => {
                      const m = allCustomerMetrics.find(m => m.userId === c.id);
                      return calculateRFMScore(m).segment === "Champion";
                    }).length}</p>
                    <p className="text-xs text-muted-foreground">High value, frequent buyers</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-blue-500">Loyal</span>
                    </div>
                    <p className="text-2xl font-bold">{customers.filter(c => {
                      const m = allCustomerMetrics.find(m => m.userId === c.id);
                      return calculateRFMScore(m).segment === "Loyal";
                    }).length}</p>
                    <p className="text-xs text-muted-foreground">Regular repeat customers</p>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-orange-500">At Risk</span>
                    </div>
                    <p className="text-2xl font-bold">{customers.filter(c => {
                      const m = allCustomerMetrics.find(m => m.userId === c.id);
                      return calculateRFMScore(m).segment === "At Risk";
                    }).length}</p>
                    <p className="text-xs text-muted-foreground">Haven't purchased recently</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <UserPlus className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-purple-500">New</span>
                    </div>
                    <p className="text-2xl font-bold">{customers.filter(c => {
                      const m = allCustomerMetrics.find(m => m.userId === c.id);
                      return calculateRFMScore(m).segment === "New Customer";
                    }).length}</p>
                    <p className="text-xs text-muted-foreground">Recent first-time buyers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lifecycle Tab */}
          <TabsContent value="lifecycle" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* New Customers */}
              <Card className="border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-500">
                    <UserPlus className="h-5 w-5" />
                    New Customers ({lifecycleDistribution.new})
                  </CardTitle>
                  <CardDescription>Recently joined, need onboarding</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "new").slice(0, 5).map(c => (
                        <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover-elevate" onClick={() => setSelectedCustomer(c)}>
                          <div>
                            <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-muted-foreground">Joined {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* At Risk Customers */}
              <Card className="border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-500">
                    <AlertTriangle className="h-5 w-5" />
                    At Risk ({lifecycleDistribution.at_risk})
                  </CardTitle>
                  <CardDescription>Showing signs of churn</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {customers.filter(c => getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id)) === "at_risk").slice(0, 5).map(c => {
                        const m = allCustomerMetrics.find(m => m.userId === c.id);
                        return (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover-elevate" onClick={() => setSelectedCustomer(c)}>
                            <div>
                              <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                              <p className="text-xs text-muted-foreground">Last order: {m?.lastPurchaseDate ? formatDistanceToNow(new Date(m.lastPurchaseDate), { addSuffix: true }) : "Never"}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* VIP Customers */}
              <Card className="border-yellow-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                    <Crown className="h-5 w-5" />
                    VIP & Champions ({lifecycleDistribution.vip + lifecycleDistribution.champion})
                  </CardTitle>
                  <CardDescription>Your most valuable customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {customers.filter(c => {
                        const stage = getCustomerLifecycleStage(c, allCustomerMetrics.find(m => m.userId === c.id));
                        return stage === "vip" || stage === "champion";
                      }).slice(0, 5).map(c => {
                        const m = allCustomerMetrics.find(m => m.userId === c.id);
                        return (
                          <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover-elevate" onClick={() => setSelectedCustomer(c)}>
                            <div>
                              <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                              <p className="text-xs text-muted-foreground">£{m?.totalSpent || "0"} lifetime value</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="justify-start h-auto py-3" onClick={() => { setLifecycleFilter("at_risk"); setMainTab("customers"); }}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Win Back Campaign</p>
                        <p className="text-xs text-muted-foreground">Target at-risk customers</p>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" onClick={() => { setLifecycleFilter("new"); setMainTab("customers"); }}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Send className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Welcome Series</p>
                        <p className="text-xs text-muted-foreground">Onboard new customers</p>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" onClick={() => { setVipFilter("vip"); setMainTab("customers"); }}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Gift className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">VIP Rewards</p>
                        <p className="text-xs text-muted-foreground">Exclusive offers for VIPs</p>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3" onClick={exportCustomersToCSV}>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Download className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Export Data</p>
                        <p className="text-xs text-muted-foreground">Download customer list</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Customer Segments
                  </CardTitle>
                  <CardDescription>Manage and view your customer segments</CardDescription>
                </CardHeader>
                <CardContent>
                  {segments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No segments created yet</p>
                      <p className="text-sm">Create segments in Marketing & CRM to organise customers</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {segments.map(segment => (
                        <div key={segment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{segment.name}</p>
                            <p className="text-sm text-muted-foreground">{segment.description || "No description"}</p>
                          </div>
                          <Badge variant="secondary">{segment.memberCount || 0} members</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Marketing Tags
                  </CardTitle>
                  <CardDescription>Tags for customer categorisation</CardDescription>
                </CardHeader>
                <CardContent>
                  {marketingTags.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No tags created yet</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowTagManager(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Tag
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {marketingTags.map(tag => (
                        <Badge key={tag.id} style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" }} variant="outline">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Loyalty Tiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Loyalty Programme Tiers
                </CardTitle>
                <CardDescription>Customer loyalty levels and benefits</CardDescription>
              </CardHeader>
              <CardContent>
                {loyaltyTiers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No loyalty tiers configured</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {loyaltyTiers.map(tier => (
                      <div key={tier.id} className="p-4 rounded-lg bg-muted/50 text-center">
                        <Crown className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <p className="font-medium">{tier.tier}</p>
                        <p className="text-sm text-muted-foreground">{tier.discountPercent}% discount</p>
                        <p className="text-xs text-muted-foreground">{tier.pointsMultiplier}x points</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-blue-500/20" data-testid="stat-card-total">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-total-customers">{crmAnalytics.totalCustomers}</p>
                      <p className="text-xs text-muted-foreground">Total Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20" data-testid="stat-card-revenue">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500" data-testid="stat-total-revenue">£{crmAnalytics.totalRevenue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-500/20" data-testid="stat-card-avg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-avg-order">£{dashboardMetrics?.avgOrderValue?.toFixed(0) || 0}</p>
                      <p className="text-xs text-muted-foreground">Avg Order Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20" data-testid="stat-card-vip">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-500" data-testid="stat-vip-customers">{crmAnalytics.vipCustomers}</p>
                      <p className="text-xs text-muted-foreground">VIP Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Database Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Customer Database</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    className="pl-8 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-customers"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant={hasActiveFilters ? "default" : "outline"} 
                      size="sm" 
                      data-testid="button-filter"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                          {(roleFilter !== "all" ? 1 : 0) + (vipFilter !== "all" ? 1 : 0) + (lifecycleFilter !== "all" ? 1 : 0) + (churnRiskFilter !== "all" ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Filters</h4>
                        {hasActiveFilters && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearFilters}
                            data-testid="button-clear-filters"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Clear All
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Role</Label>
                          <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger data-testid="select-role-filter" className="h-8">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Roles</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="reseller">Reseller</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium">VIP Status</Label>
                          <Select value={vipFilter} onValueChange={setVipFilter}>
                            <SelectTrigger data-testid="select-vip-filter" className="h-8">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="vip">VIP Only</SelectItem>
                              <SelectItem value="non-vip">Non-VIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Lifecycle Stage</Label>
                          <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
                            <SelectTrigger data-testid="select-lifecycle-filter" className="h-8">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Stages</SelectItem>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="at_risk">At Risk</SelectItem>
                              <SelectItem value="churned">Churned</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="champion">Champion</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Churn Risk</Label>
                          <Select value={churnRiskFilter} onValueChange={setChurnRiskFilter}>
                            <SelectTrigger data-testid="select-churn-filter" className="h-8">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Levels</SelectItem>
                              <SelectItem value="high">High Risk</SelectItem>
                              <SelectItem value="medium">Medium Risk</SelectItem>
                              <SelectItem value="low">Low Risk</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No customers found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lifecycle</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const customerMetric = allCustomerMetrics.find(m => m.userId === customer.id);
                    const lifecycle = getCustomerLifecycleStage(customer, customerMetric);
                    const healthScore = calculateHealthScore(customer, customerMetric);
                    return (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {customer.firstName} {customer.lastName}
                          {customerMetric?.isVip && <Star className="w-3 h-3 text-yellow-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{customer.email}</TableCell>
                      <TableCell>
                        {getLifecycleBadge(lifecycle)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={healthScore.score} className="w-12 h-2" />
                          <span className={`text-sm font-medium ${getHealthScoreColor(healthScore.score)}`}>
                            {healthScore.score}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{customerMetric?.totalOrders || 0}</TableCell>
                      <TableCell className="font-medium">£{parseFloat(customerMetric?.totalSpent || "0").toFixed(2)}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          data-testid={`button-view-customer-${customer.id}`}
                        >
                          Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/customers/${customer.id}`)}
                          data-testid={`button-view-360-${customer.id}`}
                        >
                          360 View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span className="text-2xl">
                  {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                </span>
                {customerMetrics?.isVip && (
                  <Badge variant="secondary" className="ml-2">
                    <Star className="w-3 h-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              <Badge variant="outline">{selectedCustomer?.role}</Badge>
            </DialogTitle>
            <DialogDescription>
              Complete customer profile with order history, interactions, and metrics
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                Orders
              </TabsTrigger>
              <TabsTrigger value="interactions" data-testid="tab-interactions">
                Interactions
              </TabsTrigger>
              <TabsTrigger value="notes" data-testid="tab-notes">
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-customer-email">{selectedCustomer?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm" data-testid="text-customer-joined">
                        Joined {selectedCustomer && format(new Date(selectedCustomer.createdAt), "MMMM d, yyyy")}
                      </span>
                    </div>
                    {acquisitionReseller && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm" data-testid="text-acquisition-reseller">
                          Acquired by: <span className="font-medium">{acquisitionReseller.businessName}</span>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Customer Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Orders:</span>
                      <span className="text-sm font-medium" data-testid="text-total-orders">
                        {customerMetrics?.totalOrders || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Spent:</span>
                      <span className="text-sm font-medium" data-testid="text-total-spent">
                        £{customerMetrics?.totalSpent || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Order Value:</span>
                      <span className="text-sm font-medium" data-testid="text-avg-order-value">
                        £{customerMetrics?.averageOrderValue || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Lifetime Value:</span>
                      <span className="text-sm font-medium" data-testid="text-lifetime-value">
                        £{customerMetrics?.lifetimeValue || "0.00"}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">VIP Status:</span>
                        </div>
                        <Switch
                          checked={customerMetrics?.isVip || false}
                          onCheckedChange={(checked) => {
                            if (selectedCustomer) {
                              toggleVipMutation.mutate({ 
                                userId: selectedCustomer.id, 
                                isVip: checked 
                              });
                            }
                          }}
                          disabled={toggleVipMutation.isPending}
                          data-testid="switch-vip-status"
                        />
                      </div>
                      {customerMetrics?.isVip && (
                        <p className="text-xs text-muted-foreground mt-1">
                          This customer has VIP benefits
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {customerMetrics?.lastPurchaseDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Last Purchase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {format(new Date(customerMetrics.lastPurchaseDate), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              {customerOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found for this customer
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{order.orderNumber}</span>
                              <Badge className={getStatusBadge(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.orderDate), "MMM d, yyyy")} · {order.itemCount} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">£{order.totalAmount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setShowLogInteraction(true)}
                  data-testid="button-log-interaction"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Interaction
                </Button>
              </div>

              {customerInteractions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No interactions recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {customerInteractions.map((interaction) => (
                    <Card key={interaction.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">{getInteractionIcon(interaction.interactionType)}</div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">
                                {interaction.interactionType.replace("_", " ")}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(interaction.createdAt), "MMM d, yyyy h:mm a")}
                              </span>
                            </div>
                            {interaction.subject && (
                              <p className="text-sm font-medium">{interaction.subject}</p>
                            )}
                            {interaction.content && (
                              <p className="text-sm text-muted-foreground">{interaction.content}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setShowAddNote(true)}
                  data-testid="button-add-note"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>

              {customerNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notes added for this customer
                </div>
              ) : (
                <div className="space-y-3">
                  {customerNotes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
                              {note.createdAt !== note.updatedAt && " (edited)"}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingNote(note);
                                setNoteForm({ note: note.note });
                                setShowEditNote(true);
                              }}
                              data-testid={`button-edit-note-${note.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this note?")) {
                                  deleteNoteMutation.mutate(note.id);
                                }
                              }}
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Log Interaction Dialog */}
      <Dialog open={showLogInteraction} onOpenChange={setShowLogInteraction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Customer Interaction</DialogTitle>
            <DialogDescription>
              Record a new interaction with {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="interaction-type">Interaction Type</Label>
              <Select
                value={interactionForm.interactionType}
                onValueChange={(value) => setInteractionForm({ ...interactionForm, interactionType: value })}
              >
                <SelectTrigger id="interaction-type" data-testid="select-interaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="support_ticket">Support Ticket</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="cart_abandonment">Cart Abandonment</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of interaction"
                value={interactionForm.subject}
                onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                data-testid="input-interaction-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Details</Label>
              <Textarea
                id="content"
                placeholder="Detailed notes about the interaction..."
                rows={4}
                value={interactionForm.content}
                onChange={(e) => setInteractionForm({ ...interactionForm, content: e.target.value })}
                data-testid="textarea-interaction-content"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-id">Related Order ID (Optional)</Label>
              <Input
                id="order-id"
                placeholder="Enter order ID if applicable"
                value={interactionForm.orderId}
                onChange={(e) => setInteractionForm({ ...interactionForm, orderId: e.target.value })}
                data-testid="input-interaction-order"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowLogInteraction(false)}
              data-testid="button-cancel-interaction"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                logInteractionMutation.mutate({
                  interactionType: interactionForm.interactionType,
                  subject: interactionForm.subject,
                  content: interactionForm.content,
                  orderId: interactionForm.orderId || undefined,
                });
              }}
              disabled={logInteractionMutation.isPending || !interactionForm.subject}
              data-testid="button-submit-interaction"
            >
              {logInteractionMutation.isPending ? "Logging..." : "Log Interaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer Note</DialogTitle>
            <DialogDescription>
              Add an internal note about {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note here..."
                rows={5}
                value={noteForm.note}
                onChange={(e) => setNoteForm({ note: e.target.value })}
                data-testid="textarea-note"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddNote(false);
                setNoteForm({ note: "" });
              }}
              data-testid="button-cancel-note"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                addNoteMutation.mutate({ note: noteForm.note });
              }}
              disabled={addNoteMutation.isPending || !noteForm.note.trim()}
              data-testid="button-submit-note"
            >
              {addNoteMutation.isPending ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={showEditNote} onOpenChange={(open) => {
        setShowEditNote(open);
        if (!open) {
          setEditingNote(null);
          setNoteForm({ note: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer Note</DialogTitle>
            <DialogDescription>
              Update the note for {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note</Label>
              <Textarea
                id="edit-note"
                placeholder="Enter your note here..."
                rows={5}
                value={noteForm.note}
                onChange={(e) => setNoteForm({ note: e.target.value })}
                data-testid="textarea-edit-note"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditNote(false);
                setEditingNote(null);
                setNoteForm({ note: "" });
              }}
              data-testid="button-cancel-edit-note"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingNote) {
                  updateNoteMutation.mutate({ id: editingNote.id, note: noteForm.note });
                }
              }}
              disabled={updateNoteMutation.isPending || !noteForm.note.trim()}
              data-testid="button-submit-edit-note"
            >
              {updateNoteMutation.isPending ? "Updating..." : "Update Note"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTagManager} onOpenChange={setShowTagManager}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tag Management</DialogTitle>
            <DialogDescription>
              Create and manage customer tags for segmentation and marketing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">{editingTag ? "Edit Tag" : "Create New Tag"}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag Name</Label>
                  <Input
                    id="tag-name"
                    placeholder="e.g., VIP Customer"
                    value={editingTag ? editingTag.name : tagForm.name}
                    onChange={(e) => editingTag 
                      ? setEditingTag({ ...editingTag, name: e.target.value })
                      : setTagForm({ ...tagForm, name: e.target.value })}
                    data-testid="input-tag-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-color">Colour</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tag-color"
                      type="color"
                      className="w-14 h-9 p-1 cursor-pointer"
                      value={editingTag ? editingTag.color : tagForm.color}
                      onChange={(e) => editingTag
                        ? setEditingTag({ ...editingTag, color: e.target.value })
                        : setTagForm({ ...tagForm, color: e.target.value })}
                      data-testid="input-tag-color"
                    />
                    <Input
                      type="text"
                      placeholder="#3B82F6"
                      className="flex-1"
                      value={editingTag ? editingTag.color : tagForm.color}
                      onChange={(e) => editingTag
                        ? setEditingTag({ ...editingTag, color: e.target.value })
                        : setTagForm({ ...tagForm, color: e.target.value })}
                      data-testid="input-tag-color-text"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-description">Description (optional)</Label>
                <Input
                  id="tag-description"
                  placeholder="Describe this tag..."
                  value={editingTag ? (editingTag.description || "") : tagForm.description}
                  onChange={(e) => editingTag
                    ? setEditingTag({ ...editingTag, description: e.target.value })
                    : setTagForm({ ...tagForm, description: e.target.value })}
                  data-testid="input-tag-description"
                />
              </div>
              <div className="flex gap-2">
                {editingTag ? (
                  <>
                    <Button
                      onClick={() => updateTagMutation.mutate(editingTag)}
                      disabled={updateTagMutation.isPending || !editingTag.name.trim()}
                      data-testid="button-update-tag"
                    >
                      {updateTagMutation.isPending ? "Updating..." : "Update Tag"}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingTag(null)} data-testid="button-cancel-edit-tag">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => createTagMutation.mutate(tagForm)}
                    disabled={createTagMutation.isPending || !tagForm.name.trim()}
                    data-testid="button-create-tag"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createTagMutation.isPending ? "Creating..." : "Create Tag"}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Existing Tags ({marketingTags.length})</h4>
              {tagsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading tags...</div>
              ) : marketingTags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No tags created yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {marketingTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`tag-item-${tag.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full border-2"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div>
                          <p className="font-medium">{tag.name}</p>
                          {tag.description && (
                            <p className="text-sm text-muted-foreground">{tag.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingTag(tag)}
                          data-testid={`button-edit-tag-${tag.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this tag?")) {
                              deleteTagMutation.mutate(tag.id);
                            }
                          }}
                          data-testid={`button-delete-tag-${tag.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
