import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Users, 
  LogOut,
  Settings,
  Plus,
  Store,
  Tag,
  MessageCircle,
  ShoppingBag,
  Loader2,
  Ticket,
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
  Bell,
  ArrowRight,
  PackageX,
  ChevronRight,
  ShoppingCart,
  DollarSign,
  Activity,
  Image,
  Layers,
  Wallet,
  Shield,
  BarChart3,
  Mail,
  Trophy,
  Zap,
  MapPin,
  RotateCcw,
  Key,
  Check,
  X,
  CreditCard,
  Edit,
  Star,
  FolderOpen,
  PoundSterling,
  KeyRound,
  Trash2,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { staggerContainer, staggerItem } from "@/lib/animations";
import AdminCRM from "./AdminCRM";
import AdminProducts from "./AdminProducts";
import AdminInventory from "./AdminInventory";
import AdminResellerManagement from "./AdminResellerManagement";
import AdminCoupons from "./AdminCoupons";
import AdminChatbot from "./AdminChatbot";
import AdminPopupMessages from "./AdminPopupMessages";
import AdminOrders from "./AdminOrders";
import AdminSupportTickets from "./AdminSupportTickets";
import AdminTeamManagement from "@/components/admin/AdminTeamManagement";
import AdminPayouts from "@/components/admin/AdminPayouts";
import AdminWarehouses from "./AdminWarehouses";
import AdminStoreLocations from "./AdminStoreLocations";
import AdminB2BAccess from "./AdminB2BAccess";
import { ImageUploadValidator } from "@/components/ImageUploadValidator";
import InventoryManager from "@/components/InventoryManager";
import AdminReturns from "./AdminReturns";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import LivePurchasesPanel from "@/components/admin/LivePurchasesPanel";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminSmartInventory from "./AdminSmartInventory";
import AdminProductPerformance from "./AdminProductPerformance";
import AdminWarehouseIntelligence from "./AdminWarehouseIntelligence";
import AdminWholesaleOrders from "./AdminWholesaleOrders";
import { useSocket } from "@/hooks/useSocket";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  
  // Determine initial tab from URL path
  const getTabFromPath = (path: string) => {
    if (path.startsWith("/admin/")) {
      const tabName = path.replace("/admin/", "").split("/")[0];
      return tabName || "overview";
    }
    return "overview";
  };
  
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(window.location.pathname));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Sync tab state with URL on navigation
  useEffect(() => {
    const tabFromPath = getTabFromPath(location);
    if (tabFromPath !== activeTab) {
      setActiveTab(tabFromPath);
    }
  }, [location]);

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; email: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== "admin")) {
      // Redirect non-admin users to home
      setLocation("/");
    }
  }, [authUser, authLoading, setLocation]);

  // Verify admin session is properly authenticated via admin portal
  // This prevents bypass through customer login
  const { error: adminVerifyError } = useQuery({
    queryKey: ["/api/admin/verify-session"],
    enabled: !!authUser && authUser.role === "admin",
    retry: false,
  });

  useEffect(() => {
    // If admin session verification fails with requireAdminLogin, redirect to admin login
    if (adminVerifyError) {
      const errorMessage = adminVerifyError.message || "";
      if (errorMessage.includes("requireAdminLogin") || errorMessage.includes("Admin authentication required")) {
        toast({
          title: "Admin Login Required",
          description: "Please login through the secure admin portal.",
          variant: "destructive",
        });
        // Clear any existing session
        queryClient.clear();
        setLocation("/admin-portal-secure");
      }
    }
  }, [adminVerifyError, setLocation, toast]);

  if (authLoading || !authUser || authUser.role !== "admin") {
    return null;
  }

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "reports", label: "Reports", icon: BarChart3, external: "/admin/reports" },
    { id: "resellers", label: "B2B Partners", icon: Store },
    { id: "b2b-access", label: "B2B Access", icon: Shield },
    { id: "license-requests", label: "Licence Requests", icon: Key },
    { id: "wholesale-orders", label: "Wholesale Orders", icon: ShoppingCart },
    { id: "payouts", label: "Commission Payouts", icon: Wallet },
    { id: "commission-analytics", label: "Partner Analytics", icon: TrendingUp, external: "/admin/commission-analytics" },
    { id: "partner-management", label: "Partner Management", icon: Users, external: "/admin/partner-management" },
    { id: "reseller-ads", label: "Reseller EPOS Ads", icon: Video, external: "/admin/reseller-ads" },
    { id: "smart-notifications", label: "Smart Notifications", icon: Bell, external: "/admin/smart-notifications" },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "sections", label: "Product Sections", icon: Layers },
    { id: "activity-types", label: "Activity Types", icon: Activity },
    { id: "coupons", label: "Coupons", icon: Tag },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "smart-inventory", label: "Smart Inventory", icon: Zap, external: "/admin/smart-inventory" },
    { id: "product-performance", label: "Product Performance", icon: TrendingUp, external: "/admin/product-performance" },
    { id: "warehouse-intelligence", label: "Warehouse Intelligence", icon: Warehouse, external: "/admin/warehouse-intelligence" },
    { id: "warehouses", label: "Warehouses", icon: Warehouse },
    { id: "store-locations", label: "Store Locations", icon: MapPin },
    { id: "inventory-manager", label: "Add Inventory", icon: PackageX },
    { id: "image-manager", label: "Image Manager", icon: Image },
    { id: "crm", label: "Customers", icon: Users },
    { id: "marketing", label: "Marketing", icon: Mail, external: "/admin/marketing" },
    { id: "support", label: "Support Tickets", icon: Ticket },
    { id: "returns", label: "Return Requests", icon: RotateCcw },
    { id: "reviews", label: "Reviews", icon: Star, external: "/admin/reviews" },
    { id: "chatbot", label: "Chatbot", icon: MessageCircle },
    { id: "popup-messages", label: "Popup Messages", icon: MessageCircle },
    { id: "athletes", label: "Influencer Applications", icon: Trophy },
    { id: "athlete-profiles", label: "Manage Influencers", icon: Trophy },
    { id: "athlete-content", label: "Influencer Content", icon: Image },
    { id: "influencer-credits", label: "Influencer Credits", icon: PoundSterling, external: "/admin/influencer-credits" },
    { id: "events", label: "Community Events", icon: Calendar },
    { id: "competitions", label: "Competition Management", icon: Trophy, external: "/admin/competitions" },
  ];

  const accountMenuItems = [
    { id: "team", label: "Team", icon: Users },
    { id: "documents", label: "Document Library", icon: FolderOpen, external: "/admin/documents" },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleMenuItemClick = (itemId: string, external?: string) => {
    setMobileMenuOpen(false); // Close mobile menu on selection
    // Set active tab regardless of whether it's external or internal
    setActiveTab(itemId);
    // Handle external links (like Reports page)
    if (external) {
      setLocation(external);
      return;
    }
    // Update URL to reflect active tab
    const newPath = itemId === "overview" ? "/admin" : `/admin/${itemId}`;
    if (location !== newPath) {
      setLocation(newPath);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div>
            <h1 className="text-lg md:text-xl font-bold" data-testid="admin-dashboard-title-mobile">
              Admin Dashboard
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {authUser.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AdminNotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Desktop and Mobile Overlay - MODERN CLEAN DESIGN */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 border-r border-border/50
        bg-card/95 backdrop-blur-xl
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen
      `}>
        {/* Header */}
        <div className="p-5 hidden lg:block border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground" data-testid="admin-dashboard-title">
                  Admin Portal
                </h1>
              </div>
            </div>
            <AdminNotificationBell />
          </div>
          <p className="text-xs text-muted-foreground ml-13">
            {authUser.email}
          </p>
        </div>

        {/* Main Navigation - Scrollable area */}
        <nav className="px-3 py-4 space-y-1 mt-16 lg:mt-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuItemClick(item.id, (item as any).external)}
                data-testid={`nav-${item.id}`}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary/10 dark:bg-primary/20' 
                    : 'hover:bg-accent/50'
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                
                {/* Icon */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                  }
                `}>
                  <item.icon className="w-4 h-4" />
                </div>
                
                {/* Label */}
                <span className={`
                  font-medium text-sm transition-colors duration-200
                  ${isActive 
                    ? 'text-foreground' 
                    : 'text-muted-foreground group-hover:text-foreground'
                  }
                `}>
                  {item.label}
                </span>
                
                {/* Arrow for active item */}
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom Section: Account Settings */}
        <div className="flex-shrink-0 border-t border-border/50 bg-card/50">
          {/* Account Menu Items */}
          <div className="px-3 py-3 space-y-1">
            {accountMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMenuItemClick(item.id)}
                  data-testid={`nav-${item.id}`}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-primary/10 dark:bg-primary/20' 
                      : 'hover:bg-accent/50'
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  
                  {/* Icon */}
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                    }
                  `}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  
                  {/* Label */}
                  <span className={`
                    font-medium text-sm transition-colors duration-200
                    ${isActive 
                      ? 'text-foreground' 
                      : 'text-muted-foreground group-hover:text-foreground'
                    }
                  `}>
                    {item.label}
                  </span>
                  
                  {/* Arrow for active item */}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="px-3 pb-3 pt-2">
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
              className="
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 group
                bg-red-500/10 hover:bg-red-500/20
                dark:bg-red-400/10 dark:hover:bg-red-400/20
              "
            >
              <div className="w-8 h-8 rounded-lg bg-red-500 dark:bg-red-500 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-sm text-red-600 dark:text-red-400">
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-20 lg:pt-0">
        {activeTab === "overview" && <OverviewTab setActiveTab={setActiveTab} />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "resellers" && <AdminResellerManagement />}
        {activeTab === "payouts" && <AdminPayouts />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "sections" && <AdminProductSections />}
        {activeTab === "activity-types" && <AdminActivityTypes />}
        {activeTab === "coupons" && <AdminCoupons />}
        {activeTab === "inventory" && <AdminInventory />}
        {activeTab === "smart-inventory" && <AdminSmartInventory />}
        {activeTab === "product-performance" && <AdminProductPerformance />}
        {activeTab === "warehouse-intelligence" && <AdminWarehouseIntelligence />}
        {activeTab === "warehouses" && <AdminWarehouses />}
        {activeTab === "store-locations" && <AdminStoreLocations />}
        {activeTab === "b2b-access" && <AdminB2BAccess />}
        {activeTab === "license-requests" && <AdminLicenseRequests />}
        {activeTab === "wholesale-orders" && <AdminWholesaleOrders />}
        {activeTab === "image-manager" && (
          <div className="p-4 md:p-6">
            <ImageUploadValidator />
          </div>
        )}
        {activeTab === "inventory-manager" && <InventoryManager />}
        {activeTab === "crm" && <AdminCRM />}
        {activeTab === "support" && <AdminSupportTickets />}
        {activeTab === "returns" && (
          <div className="p-4 md:p-6">
            <AdminReturns />
          </div>
        )}
        {activeTab === "chatbot" && <AdminChatbot />}
        {activeTab === "popup-messages" && <AdminPopupMessages />}
        {activeTab === "athletes" && <AdminAthleteApplications />}
        {activeTab === "athlete-profiles" && <AdminAthleteProfiles />}
        {activeTab === "athlete-content" && <AdminAthleteContent />}
        {activeTab === "events" && <AdminEvents />}
        {activeTab === "team" && (
          <div className="p-4 md:p-6">
            <AdminTeamManagement />
          </div>
        )}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

function OverviewTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Fetch comprehensive data
  const { data: products = [] } = useQuery<any[]>({ queryKey: ['/api/products'] });
  const { data: inventory = [] } = useQuery<any[]>({ queryKey: ['/api/inventory'] });
  const { data: resellers = [] } = useQuery<any[]>({ queryKey: ['/api/admin/resellers'] });
  const { data: vendors = [] } = useQuery<any[]>({ queryKey: ['/api/admin/vendors'] });
  const { data: supportTickets = [] } = useQuery<any[]>({ queryKey: ['/api/admin/support-tickets'] });
  const { data: customerOrders = [] } = useQuery<any[]>({ queryKey: ['/api/admin/orders'] });
  const { data: resellerOrders = [] } = useQuery<any[]>({ queryKey: ['/api/admin/reseller-orders'] });

  // Real-time: refresh orders query when new orders arrive via WebSocket (EPOS or online)
  useSocket({
    room: "admin",
    onOrderEvent: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
  });

  // Helper function to filter by date
  const filterByDate = (items: any[], dateField: string = 'createdAt') => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField] || item.orderDate || item.createdAt);
      
      // If no dates are selected, show all
      if (!startDate && !endDate) {
        return true;
      }
      
      // If only start date is set
      if (startDate && !endDate) {
        return itemDate >= startDate;
      }
      
      // If only end date is set
      if (!startDate && endDate) {
        return itemDate <= endDate;
      }
      
      // If both dates are set
      if (startDate && endDate) {
        return itemDate >= startDate && itemDate <= endDate;
      }
      
      return true;
    });
  };

  // Quick filter options
  const applyQuickFilter = (option: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(option) {
      case 'today':
        setStartDate(today);
        setEndDate(new Date());
        break;
      case '7days':
        setStartDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        setEndDate(new Date());
        break;
      case '30days':
        setStartDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        setEndDate(new Date());
        break;
      case 'month':
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(new Date());
        break;
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  };

  // Get filter label
  const getFilterLabel = () => {
    if (!startDate && !endDate) {
      return 'All Time';
    }
    if (startDate && endDate) {
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    if (startDate) {
      return `From ${format(startDate, 'MMM d, yyyy')}`;
    }
    if (endDate) {
      return `Until ${format(endDate, 'MMM d, yyyy')}`;
    }
    return 'All Time';
  };

  // Calculate filtered metrics
  // 1stRep catalogue orders — matches the "1stRep Orders" tab in the Orders page
  // Excludes vendor own-product channels and reseller own-product EPOS
  const OWN_PRODUCT_CHANNELS = ['vendor_storefront', 'vendor_epos', 'reseller_epos_own'];
  const isOwnProductOrder = (o: any) => {
    if (OWN_PRODUCT_CHANNELS.includes(o.channel)) return true;
    return o.items?.some((item: any) => item.vendorProductId) || false;
  };
  const isMixedOrder = (o: any) => {
    if (OWN_PRODUCT_CHANNELS.includes(o.channel)) return false;
    const hasOwn = o.items?.some((item: any) => item.vendorProductId) || false;
    const hasCatalogue = o.items?.some((item: any) => !item.vendorProductId) || false;
    return hasOwn && hasCatalogue;
  };
  const firstRepOrders = customerOrders.filter((o: any) => !isOwnProductOrder(o) || isMixedOrder(o));
  const allOrders = filterByDate(firstRepOrders, 'orderDate');
  
  const activeProducts = products.filter((p: any) => p.isActive).length;
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum: number, order: any) => {
    const amount = parseFloat(order.finalAmount || order.totalAmount || '0');
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const lowStockItems = inventory.filter((item: any) => {
    const stock = parseInt(item.stockQuantity || '0');
    const reorder = parseInt(item.reorderPoint || '10');
    return stock > 0 && stock <= reorder;
  }).length;

  const activeResellers = resellers.filter((r: any) => r.approvalStatus === 'approved').length;
  const openTickets = supportTickets.filter((t: any) => t.status !== 'closed' && t.status !== 'resolved').length;

  // Get important notifications
  const pendingResellers = resellers.filter((r: any) => r.approvalStatus === 'pending');
  const pendingVendors = vendors.filter((v: any) => v.approvalStatus === 'pending');
  const urgentTickets = supportTickets.filter((t: any) => t.priority === 'urgent' && t.status === 'open');
  const outOfStockItems = inventory.filter((item: any) => parseInt(item.stockQuantity || '0') === 0);
  // Show ALL recent orders (including reseller EPOS) — sorted by most recent
  const recentOrders = [...customerOrders]
    .sort((a: any, b: any) => new Date(b.orderDate || b.createdAt).getTime() - new Date(a.orderDate || a.createdAt).getTime())
    .slice(0, 5);

  // Top products by sales
  const productSales = new Map<string, { name: string; sales: number; revenue: number }>();
  firstRepOrders.forEach((order: any) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        const existing = productSales.get(item.productId) || { name: item.productName || 'Unknown', sales: 0, revenue: 0 };
        existing.sales += parseInt(item.quantity || '1');
        existing.revenue += parseFloat(item.totalPrice || item.total_price || item.subtotal || item.unitPrice || item.unit_price || item.price || '0');
        productSales.set(item.productId, existing);
      });
    }
  });
  const topProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.h2 
          className="text-2xl md:text-3xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Dashboard Overview
        </motion.h2>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover-elevate"
              data-testid="date-filter-button"
            >
              <Calendar className="w-4 h-4" />
              <span>{getFilterLabel()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 space-y-4" align="end">
            {/* Quick Filter Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Filters</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={!startDate && !endDate ? "default" : "outline"}
                  onClick={() => applyQuickFilter('all')}
                  data-testid="filter-all-time"
                >
                  All Time
                </Button>
                <Button
                  size="sm"
                  variant={startDate && new Date(new Date().toDateString()) === new Date(startDate.toDateString()) ? "default" : "outline"}
                  onClick={() => applyQuickFilter('today')}
                  data-testid="filter-today"
                >
                  Today
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickFilter('7days')}
                  data-testid="filter-7days"
                >
                  Last 7 Days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickFilter('30days')}
                  data-testid="filter-30days"
                >
                  Last 30 Days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="col-span-2"
                  onClick={() => applyQuickFilter('month')}
                  data-testid="filter-month"
                >
                  This Month
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Custom Range</p>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      data-testid="start-date-picker"
                    >
                      {startDate ? format(startDate, 'MMM d, yyyy') : 'Select start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => endDate ? date > endDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">End Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      data-testid="end-date-picker"
                    >
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'Select end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                data-testid="clear-dates"
              >
                Clear Dates
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Key Metrics Grid - 6 Cards with DRAMATIC Modern Design */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div variants={staggerItem}>
          <Card 
            className="cursor-pointer transition-all duration-300 relative group border-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]"
            onClick={() => setActiveTab('products')}
            data-testid="metric-card-products"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Products
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/50 ring-2 ring-blue-400/20 relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
                  <Package className="w-8 h-8 text-white relative z-10" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight leading-none">
                  {activeProducts}
                </p>
                <p className="text-sm text-slate-400 font-medium">Active in catalogue</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="cursor-pointer transition-all duration-300 relative group border-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02]"
            onClick={() => setActiveTab('orders')}
            data-testid="metric-card-orders"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-sky-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Orders
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/50 ring-2 ring-cyan-400/20 relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
                  <ShoppingCart className="w-8 h-8 text-white relative z-10" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-sky-400 bg-clip-text text-transparent tracking-tight leading-none">
                  {totalOrders}
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  {!startDate && !endDate ? 'All time' : 'Period orders'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="cursor-pointer transition-all duration-300 relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02]"
            onClick={() => setActiveTab('orders')}
            data-testid="metric-card-revenue"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Revenue
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/50 ring-2 ring-emerald-400/20 relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
                  <DollarSign className="w-8 h-8 text-white relative z-10" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-black bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent tracking-tight leading-none">
                  £{totalRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  {!startDate && !endDate ? 'Total earnings' : 'Period revenue'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="cursor-pointer transition-all duration-300 relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02]"
            onClick={() => setActiveTab('resellers')}
            data-testid="metric-card-resellers"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    Resellers
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/50 ring-2 ring-violet-400/20 relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
                  <Store className="w-8 h-8 text-white relative z-10" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight leading-none">
                  {activeResellers}
                </p>
                <p className="text-sm text-slate-400 font-medium">Active partners</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="cursor-pointer transition-all duration-300 relative group border-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02]"
            onClick={() => setActiveTab('support')}
            data-testid="metric-card-tickets"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Support
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/50 ring-2 ring-amber-400/20 relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
                  <Ticket className="w-8 h-8 text-white relative z-10" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent tracking-tight leading-none">
                  {openTickets}
                </p>
                <p className="text-sm text-slate-400 font-medium">Open tickets</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card 
            className="cursor-pointer transition-all duration-300 relative group border-0 bg-gradient-to-br from-rose-500/20 via-red-500/20 to-rose-500/20 backdrop-blur-xl shadow-2xl shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02]"
            onClick={() => setActiveTab('inventory')}
            data-testid="metric-card-low-stock"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-red-500/10 to-pink-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 rounded-xl" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    Low Stock
                  </p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-xl shadow-rose-500/50 ring-2 ring-rose-400/20 relative group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm" />
                  <PackageX className="w-8 h-8 text-white relative z-10" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-6xl font-black bg-gradient-to-r from-rose-400 via-red-400 to-pink-400 bg-clip-text text-transparent tracking-tight leading-none">
                  {lowStockItems}
                </p>
                <p className="text-sm text-slate-400 font-medium">Need reorder</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Important Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Important Notifications
              </CardTitle>
              <Badge variant="secondary">{pendingResellers.length + pendingVendors.length + urgentTickets.length + outOfStockItems.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingResellers.length > 0 && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  <strong>{pendingResellers.length} pending reseller application{pendingResellers.length > 1 ? 's' : ''}</strong> waiting for approval
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setActiveTab('resellers')}
                    data-testid="link-view-resellers"
                  >
                    View →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {pendingVendors.length > 0 && (
              <Alert>
                <AlertCircle className="w-4 h-4 text-purple-500" />
                <AlertDescription className="text-sm">
                  <strong className="text-purple-500">{pendingVendors.length} pending wholesaler application{pendingVendors.length > 1 ? 's' : ''}</strong> waiting for approval
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setActiveTab('resellers')}
                    data-testid="link-view-vendors"
                  >
                    View →
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {urgentTickets.length > 0 && (
              <Alert>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <AlertDescription className="text-sm">
                  <strong className="text-red-500">{urgentTickets.length} urgent support ticket{urgentTickets.length > 1 ? 's' : ''}</strong> require immediate attention
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setActiveTab('support')}
                    data-testid="link-view-tickets"
                  >
                    View →
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {outOfStockItems.length > 0 && (
              <Alert>
                <PackageX className="w-4 h-4 text-orange-500" />
                <AlertDescription className="text-sm">
                  <strong className="text-orange-500">{outOfStockItems.length} product{outOfStockItems.length > 1 ? 's' : ''} out of stock</strong> and unavailable for purchase
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setActiveTab('inventory')}
                    data-testid="link-view-inventory"
                  >
                    Restock →
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {pendingResellers.length === 0 && pendingVendors.length === 0 && urgentTickets.length === 0 && outOfStockItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No urgent notifications at this time
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => { setActiveTab('products'); }}
              data-testid="quick-add-product"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">Add Product</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => { setActiveTab('orders'); }}
              data-testid="quick-view-orders"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm">View Orders</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => { setActiveTab('inventory'); }}
              data-testid="quick-manage-inventory"
            >
              <Warehouse className="w-5 h-5" />
              <span className="text-sm">Inventory</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => { setActiveTab('crm'); }}
              data-testid="quick-view-customers"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm">Customers</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Live Purchases - Real-time feed */}
      <LivePurchasesPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Orders
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActiveTab('orders'); }}
                data-testid="link-all-orders"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`recent-order-${idx}`}>
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber || `#${order.id?.slice(0, 8)}`}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                        </p>
                        {order.channel && order.channel !== 'online' && (
                          <Badge variant="secondary" className="text-xs py-0 h-4">
                            {order.channel === 'reseller_epos' ? 'EPOS' : order.channel === 'reseller_storefront' ? 'Reseller' : order.channel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">£{parseFloat(order.finalAmount || order.totalAmount || '0').toFixed(2)}</p>
                      <Badge variant={order.status === 'pending' ? 'secondary' : 'default'} className="text-xs">
                        {order.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Products
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActiveTab('products'); }}
                data-testid="link-all-products"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`top-product-${idx}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold">#{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold">£{product.revenue.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminAthleteApplications() {
  const { toast } = useToast();
  
  const { data: applications = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/admin/athlete-applications'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/athlete-applications/${id}`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/athlete-applications'] });
      toast({ title: "Application Updated", description: "The application status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update application.", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="athletes-title">Influencer Applications</h2>
          <p className="text-muted-foreground">Manage applications for the 1stRep Influencer Programme</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {applications.length} Applications
        </Badge>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No influencer applications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card key={app.id} data-testid={`athlete-application-${app.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{app.full_name}</CardTitle>
                    <CardDescription>{app.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(app.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sport/Discipline</p>
                    <p className="font-medium">{app.sport}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Followers</p>
                    <p className="font-medium">{app.follower_count || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{app.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Social Media</p>
                    <div className="flex flex-wrap gap-1">
                      {app.instagram && <Badge variant="outline" className="text-xs">IG: {app.instagram}</Badge>}
                      {app.tiktok && <Badge variant="outline" className="text-xs">TT: {app.tiktok}</Badge>}
                      {app.youtube && <Badge variant="outline" className="text-xs">YT: {app.youtube}</Badge>}
                      {!app.instagram && !app.tiktok && !app.youtube && <span>None provided</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Message</p>
                  <p className="text-sm bg-muted/50 p-3 rounded">{app.message}</p>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateMutation.mutate({ id: app.id, status: 'approved' })}
                      disabled={updateMutation.isPending}
                      data-testid={`approve-athlete-${app.id}`}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => updateMutation.mutate({ id: app.id, status: 'rejected' })}
                      disabled={updateMutation.isPending}
                      data-testid={`reject-athlete-${app.id}`}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Admin: Manage approved athlete profiles
function AdminAthleteProfiles() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [resetPasswordProfile, setResetPasswordProfile] = useState<any>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState<any>(null);
  const [newAthlete, setNewAthlete] = useState({
    email: '', first_name: '', last_name: '', sport: '', tier: 'bronze',
    discount_percentage: '50', instagram: '', tiktok: '', youtube: '', bio: ''
  });

  const { data: profiles = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/athlete-profiles'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest('PATCH', `/api/admin/athlete-profiles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/athlete-profiles'] });
      setEditingProfile(null);
      toast({ title: "Influencer Updated", description: "Profile has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update athlete profile.", variant: "destructive" });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/athlete-profiles', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/athlete-profiles'] });
      setShowCreateDialog(false);
      setNewAthlete({ email: '', first_name: '', last_name: '', sport: '', tier: 'bronze', discount_percentage: '50', instagram: '', tiktok: '', youtube: '', bio: '' });
      toast({ title: "Influencer Created", description: "New influencer profile has been created." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create athlete profile.", variant: "destructive" });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/admin/athlete-profiles/${id}/reset-password`, {});
      return response.json();
    },
    onSuccess: (data: any) => {
      setResetPasswordResult(data.tempPassword || null);
      toast({ title: "Password Reset", description: "A new temporary password has been emailed to the influencer." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reset password.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/athlete-profiles/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/athlete-profiles'] });
      setDeleteConfirmProfile(null);
      toast({ title: "Influencer Removed", description: "Influencer profile deleted. User account retained as a customer." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete influencer profile.", variant: "destructive" });
    }
  });

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
      silver: 'bg-slate-400/20 text-slate-600 border-slate-500/30',
      gold: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      elite: 'bg-purple-500/20 text-purple-600 border-purple-500/30'
    };
    return <Badge className={colors[tier] || 'bg-muted'}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold" data-testid="athlete-profiles-title">Manage Influencers</h2>
          <p className="text-muted-foreground">View and manage approved influencer profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">{profiles.length} Influencers</Badge>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-athlete"><Plus className="w-4 h-4 mr-2" />Add Influencer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Influencer</DialogTitle>
                <DialogDescription>Manually add a new influencer to the programme</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>First Name *</Label><Input value={newAthlete.first_name} onChange={e => setNewAthlete({...newAthlete, first_name: e.target.value})} data-testid="input-athlete-firstname" /></div>
                  <div><Label>Last Name *</Label><Input value={newAthlete.last_name} onChange={e => setNewAthlete({...newAthlete, last_name: e.target.value})} data-testid="input-athlete-lastname" /></div>
                </div>
                <div><Label>Email *</Label><Input type="email" value={newAthlete.email} onChange={e => setNewAthlete({...newAthlete, email: e.target.value})} data-testid="input-athlete-email" /></div>
                <div><Label>Sport/Discipline *</Label><Input value={newAthlete.sport} onChange={e => setNewAthlete({...newAthlete, sport: e.target.value})} data-testid="input-athlete-sport" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tier</Label>
                    <Select value={newAthlete.tier} onValueChange={v => setNewAthlete({...newAthlete, tier: v})}>
                      <SelectTrigger data-testid="select-athlete-tier"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Discount %</Label><Input type="number" value={newAthlete.discount_percentage} onChange={e => setNewAthlete({...newAthlete, discount_percentage: e.target.value})} data-testid="input-athlete-discount" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Instagram</Label><Input value={newAthlete.instagram} onChange={e => setNewAthlete({...newAthlete, instagram: e.target.value})} placeholder="@handle" /></div>
                  <div><Label>TikTok</Label><Input value={newAthlete.tiktok} onChange={e => setNewAthlete({...newAthlete, tiktok: e.target.value})} placeholder="@handle" /></div>
                  <div><Label>YouTube</Label><Input value={newAthlete.youtube} onChange={e => setNewAthlete({...newAthlete, youtube: e.target.value})} placeholder="channel" /></div>
                </div>
                <div><Label>Bio</Label><Textarea value={newAthlete.bio} onChange={e => setNewAthlete({...newAthlete, bio: e.target.value})} rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate(newAthlete)} disabled={createMutation.isPending || !newAthlete.email || !newAthlete.first_name || !newAthlete.last_name || !newAthlete.sport} data-testid="button-submit-create-athlete">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Influencer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {profiles.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">No influencer profiles yet. Approve applications or create influencers manually.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile: any) => (
            <Card key={profile.id} data-testid={`athlete-profile-${profile.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {profile.application_name || `${profile.first_name} ${profile.last_name}`}
                      {getTierBadge(profile.tier)}
                      {profile.is_featured && <Badge className="bg-blue-500/20 text-blue-600">Featured</Badge>}
                      {!profile.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </CardTitle>
                    <CardDescription>{profile.email} · {profile.sport}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{profile.discount_code}</code>
                    <span className="text-sm font-medium">{profile.discount_percentage}% off</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Sales Generated</p><p className="font-medium">£{parseFloat(profile.total_sales_generated || '0').toFixed(2)}</p></div>
                  <div><p className="text-muted-foreground">Orders</p><p className="font-medium">{profile.total_orders_generated || 0}</p></div>
                  <div><p className="text-muted-foreground">Link Clicks</p><p className="font-medium text-[#C9A84C]">{(profile.tracking_link_clicks || 0).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Followers</p><p className="font-medium">{profile.follower_count || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground">Joined</p><p className="font-medium">{new Date(profile.joined_at).toLocaleDateString('en-GB')}</p></div>
                  <div><p className="text-muted-foreground">Onboarding</p><p className="font-medium">{profile.onboarding_completed ? 'Complete' : 'Pending'}</p></div>
                </div>
                {profile.bio && <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{profile.bio}</p>}
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setEditingProfile(profile)} data-testid={`edit-athlete-${profile.id}`}><Settings className="w-4 h-4 mr-1" />Edit</Button>
                  <Button size="sm" variant={profile.is_active ? "destructive" : "default"} onClick={() => updateMutation.mutate({ id: profile.id, is_active: !profile.is_active })} data-testid={`toggle-athlete-${profile.id}`}>
                    {profile.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: profile.id, is_featured: !profile.is_featured })}>
                    {profile.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setResetPasswordProfile(profile); setResetPasswordResult(null); }} data-testid={`reset-password-athlete-${profile.id}`}>
                    <KeyRound className="w-4 h-4 mr-1" />Reset Password
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmProfile(profile)} data-testid={`delete-athlete-${profile.id}`}>
                    <Trash2 className="w-4 h-4 mr-1" />Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordProfile} onOpenChange={(open) => { if (!open) { setResetPasswordProfile(null); setResetPasswordResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Generate a new temporary password for{" "}
              <span className="font-semibold">
                {resetPasswordProfile?.application_name || `${resetPasswordProfile?.first_name} ${resetPasswordProfile?.last_name}`}
              </span>{" "}
              ({resetPasswordProfile?.email}). The new password will be emailed to them automatically.
            </DialogDescription>
          </DialogHeader>
          {resetPasswordResult ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-md bg-muted text-center space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Temporary Password</p>
                <p className="text-xl font-mono font-bold tracking-widest">{resetPasswordResult}</p>
              </div>
              <p className="text-sm text-muted-foreground">This password has been emailed to the influencer. They should use "Forgot / Set password" on the login page to set their own password.</p>
              <DialogFooter>
                <Button onClick={() => { setResetPasswordProfile(null); setResetPasswordResult(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setResetPasswordProfile(null)}>Cancel</Button>
              <Button
                onClick={() => resetPasswordMutation.mutate(resetPasswordProfile.id)}
                disabled={resetPasswordMutation.isPending}
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                Reset &amp; Send Email
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmProfile} onOpenChange={(open) => { if (!open) setDeleteConfirmProfile(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Influencer Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {deleteConfirmProfile?.application_name || `${deleteConfirmProfile?.first_name} ${deleteConfirmProfile?.last_name}`}
              </span>{" "}
              from the influencer programme? Their user account will be kept as a regular customer, but they will lose all influencer access, credits, and their discount code will stop working.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 px-1">
            <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              This action cannot be undone.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmProfile(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteConfirmProfile.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-athlete"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Influencer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Influencer Profile</DialogTitle></DialogHeader>
          {editingProfile && (
            <div className="grid gap-4 py-4">
              <div>
                <Label>Tier</Label>
                <Select value={editingProfile.tier} onValueChange={v => setEditingProfile({...editingProfile, tier: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Percentage</Label>
                <Input type="number" min="0" max="100" value={editingProfile.discount_percentage} onChange={e => setEditingProfile({...editingProfile, discount_percentage: e.target.value})} />
              </div>
              <div>
                <Label>Bio / Description</Label>
                <Textarea value={editingProfile.bio || ''} onChange={e => setEditingProfile({...editingProfile, bio: e.target.value})} rows={3} placeholder="Short description shown on the /athletes page" />
              </div>
              <div>
                <Label>Profile Image URL</Label>
                <Input value={editingProfile.profile_image_url || ''} onChange={e => setEditingProfile({...editingProfile, profile_image_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Instagram Handle</Label>
                  <Input value={editingProfile.instagram || ''} onChange={e => setEditingProfile({...editingProfile, instagram: e.target.value})} placeholder="@handle" />
                </div>
                <div>
                  <Label>TikTok Handle</Label>
                  <Input value={editingProfile.tiktok || ''} onChange={e => setEditingProfile({...editingProfile, tiktok: e.target.value})} placeholder="@handle" />
                </div>
                <div>
                  <Label>YouTube Handle</Label>
                  <Input value={editingProfile.youtube || ''} onChange={e => setEditingProfile({...editingProfile, youtube: e.target.value})} placeholder="@handle or channel" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: editingProfile.id, tier: editingProfile.tier, discount_percentage: editingProfile.discount_percentage, bio: editingProfile.bio, instagram: editingProfile.instagram, tiktok: editingProfile.tiktok, youtube: editingProfile.youtube, profile_image_url: editingProfile.profile_image_url })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin: Review athlete content submissions
function AdminAthleteContent() {
  const { toast } = useToast();

  const { data: submissions = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/athlete-content-submissions'],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/athlete-content-submissions/${id}`, { status, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/athlete-content-submissions'] });
      toast({ title: "Content Reviewed", description: "Submission has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to review submission.", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return <span className="text-pink-500">IG</span>;
      case 'tiktok': return <span className="text-purple-500">TT</span>;
      case 'youtube': return <span className="text-red-500">YT</span>;
      default: return <span>{platform}</span>;
    }
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="athlete-content-title">Influencer Content</h2>
          <p className="text-muted-foreground">Review and approve content from influencers</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">{submissions.filter((s: any) => s.status === 'pending').length} Pending</Badge>
      </div>

      {submissions.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">No content submissions yet</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub: any) => (
            <Card key={sub.id} data-testid={`content-submission-${sub.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {sub.athlete_name || `${sub.first_name} ${sub.last_name}`}
                      {getStatusBadge(sub.status)}
                    </CardTitle>
                    <CardDescription>{sub.email} · Code: {sub.discount_code}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getPlatformIcon(sub.platform)} {sub.content_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sub.content_url && (
                  <a href={sub.content_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{sub.content_url}</a>
                )}
                {sub.description && <p className="text-sm bg-muted/50 p-3 rounded">{sub.description}</p>}
                {sub.notes && <p className="text-sm text-muted-foreground"><strong>Notes:</strong> {sub.notes}</p>}
                {sub.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => reviewMutation.mutate({ id: sub.id, status: 'approved' })} disabled={reviewMutation.isPending} data-testid={`approve-content-${sub.id}`}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => reviewMutation.mutate({ id: sub.id, status: 'rejected' })} disabled={reviewMutation.isPending} data-testid={`reject-content-${sub.id}`}>Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { toast } = useToast();
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerVisible, setBannerVisible] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newImageTitle, setNewImageTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("75.00");
  const [standardShippingCost, setStandardShippingCost] = useState("4.99");
  const [heroSlideDuration, setHeroSlideDuration] = useState(6);
  const [showHeroProducts, setShowHeroProducts] = useState(true);
  const [minimumPayoutAmount, setMinimumPayoutAmount] = useState("50.00");
  
  const { data: settings, isLoading } = useQuery<{ 
    activeTheme: string;
    chatbotVisible?: boolean;
    freeShippingEnabled?: boolean;
    freeShippingThreshold?: string;
    standardShippingCost?: string;
    heroSlideDuration?: number;
    showHeroProducts?: boolean;
    minimumPayoutAmount?: string;
  }>({
    queryKey: ["/api/site-settings"],
  });

  const { data: banner, isLoading: bannerLoading } = useQuery<{
    message: string;
    isVisible: boolean;
    backgroundColor?: string;
    textColor?: string;
  }>({
    queryKey: ["/api/announcement-banner"],
  });

  const { data: heroVideos = [], isLoading: heroVideosLoading } = useQuery<{
    id: string;
    title: string;
    videoUrl: string;
    displayOrder: number;
    isActive: boolean;
  }[]>({
    queryKey: ["/api/admin/hero-videos"],
  });

  const { data: heroImages = [], isLoading: heroImagesLoading } = useQuery<{
    id: string;
    title: string;
    imageUrl: string;
    displayOrder: number;
    isActive: boolean;
  }[]>({
    queryKey: ["/api/admin/hero-images"],
  });

  const createHeroVideoMutation = useMutation({
    mutationFn: (data: { title: string; videoUrl: string }) => 
      apiRequest("POST", "/api/admin/hero-videos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      setNewVideoTitle("");
      setNewVideoUrl("");
      toast({
        title: "Video added",
        description: "Hero video has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const deleteHeroVideoMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/admin/hero-videos/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      toast({
        title: "Video deleted",
        description: "Hero video has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const toggleHeroVideoMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest("PATCH", `/api/admin/hero-videos/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos"] });
      toast({
        title: "Video updated",
        description: "Video visibility has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update video",
        variant: "destructive",
      });
    },
  });

  // Hero Image mutations
  const createHeroImageMutation = useMutation({
    mutationFn: (data: { title: string; imageUrl: string }) => 
      apiRequest("POST", "/api/admin/hero-images", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      setNewImageTitle("");
      setNewImageUrl("");
      toast({
        title: "Image added",
        description: "Hero background image has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add image",
        variant: "destructive",
      });
    },
  });

  const deleteHeroImageMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/admin/hero-images/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Image deleted",
        description: "Hero background image has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const toggleHeroImageMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest("PATCH", `/api/admin/hero-images/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Image updated",
        description: "Image visibility has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update image",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (banner) {
      setBannerMessage(banner.message || "");
      setBannerVisible(banner.isVisible || false);
    }
  }, [banner]);

  useEffect(() => {
    if (settings) {
      setFreeShippingEnabled(settings.freeShippingEnabled ?? true);
      setFreeShippingThreshold(settings.freeShippingThreshold || "75.00");
      setStandardShippingCost(settings.standardShippingCost || "4.99");
      setHeroSlideDuration(settings.heroSlideDuration ?? 6);
      setShowHeroProducts(settings.showHeroProducts ?? true);
      setMinimumPayoutAmount(settings.minimumPayoutAmount || "50.00");
    }
  }, [settings]);

  const updateThemeMutation = useMutation({
    mutationFn: (activeTheme: string) => 
      apiRequest("PATCH", "/api/admin/site-settings", { activeTheme }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Theme updated",
        description: "Homepage theme has been changed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update theme",
        variant: "destructive",
      });
    },
  });

  const updateChatbotVisibilityMutation = useMutation({
    mutationFn: (chatbotVisible: boolean) => 
      apiRequest("PATCH", "/api/admin/site-settings", { chatbotVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Chatbot updated",
        description: "Chatbot visibility has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update chatbot visibility",
        variant: "destructive",
      });
    },
  });

  const updateShippingSettingsMutation = useMutation({
    mutationFn: (data: { 
      freeShippingEnabled?: boolean; 
      freeShippingThreshold?: string;
      standardShippingCost?: string;
    }) => apiRequest("PATCH", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Shipping settings updated",
        description: "Your shipping configuration has been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shipping settings",
        variant: "destructive",
      });
    },
  });

  const updateHeroSlideDurationMutation = useMutation({
    mutationFn: (heroSlideDuration: number) => 
      apiRequest("PATCH", "/api/admin/site-settings", { heroSlideDuration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Slide duration updated",
        description: "Hero slide duration has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update slide duration",
        variant: "destructive",
      });
    },
  });

  const updateShowHeroProductsMutation = useMutation({
    mutationFn: (showHeroProducts: boolean) => 
      apiRequest("PATCH", "/api/admin/site-settings", { showHeroProducts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Hero products setting updated",
        description: showHeroProducts ? "Hero products will now appear in the slideshow" : "Hero products will no longer appear in the slideshow",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const updatePayoutSettingsMutation = useMutation({
    mutationFn: (data: { minimumPayoutAmount: string }) => 
      apiRequest("PATCH", "/api/admin/site-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Payout settings updated",
        description: "Minimum payout amount has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payout settings",
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: (data: { message: string; isVisible: boolean }) => 
      apiRequest("PATCH", "/api/admin/announcement-banner", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcement-banner"] });
      toast({
        title: "Banner updated",
        description: "Announcement banner has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update banner",
        variant: "destructive",
      });
    },
  });

  const seedProductsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/seed-products", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Products seeded successfully!",
        description: `${data.created} products created, ${data.skipped} skipped (already exist)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error seeding products",
        description: error.message || "Failed to seed products",
        variant: "destructive",
      });
    },
  });

  const fixActivityTypesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/fix-product-activity-types", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Products updated successfully!",
        description: `${data.updated} products updated with activity types`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating products",
        description: error.message || "Failed to update products",
        variant: "destructive",
      });
    },
  });

  // Only Clean Minimal theme is currently enabled
  // To enable other themes, add them back to this array:
  // - tactical_dark: Dark theme with tactical/outdoor aesthetics
  // - modern_light: Bright, minimal, and airy design  
  // - dynamic_gradient: Bold colors with gradient overlays
  const themes = [
    {
      id: "clean_minimal",
      name: "Clean Minimal",
      description: "Minimalist e-commerce design with clean aesthetics",
      preview: "Oysho-inspired layout, video backgrounds, elegant product cards",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Settings</h2>
      <div className="max-w-4xl space-y-4 md:space-y-6">
        {/* Homepage Theme Selector */}
        <div className="p-4 md:p-6 border border-border rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">Homepage Theme</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Choose the homepage theme for your store. Changes apply immediately.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover-elevate ${
                    settings?.activeTheme === theme.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => updateThemeMutation.mutate(theme.id)}
                  data-testid={`theme-option-${theme.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{theme.name}</h4>
                        {settings?.activeTheme === theme.id && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {theme.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {theme.preview}
                      </p>
                    </div>
                    {updateThemeMutation.isPending && settings?.activeTheme !== theme.id && (
                      <div className="ml-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hero Background Videos */}
        <div className="p-4 md:p-6 border border-border rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">Hero Background Videos</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Manage the background videos that rotate on the homepage hero section. Videos play in sequence with smooth transitions.
          </p>

          {heroVideosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add New Video Form */}
              <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30">
                <h4 className="text-sm font-medium mb-3">Add New Video</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Video Title</label>
                    <input
                      type="text"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      placeholder="e.g., Fitness Training, Running Scene"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                      data-testid="input-hero-video-title"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Video URL</label>
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                      data-testid="input-hero-video-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste a direct URL to an MP4 video file. Use external hosting like AWS S3, Cloudinary, or CDN links.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (newVideoTitle.trim() && newVideoUrl.trim()) {
                        createHeroVideoMutation.mutate({ 
                          title: newVideoTitle.trim(), 
                          videoUrl: newVideoUrl.trim() 
                        });
                      }
                    }}
                    disabled={createHeroVideoMutation.isPending || !newVideoTitle.trim() || !newVideoUrl.trim()}
                    className="min-h-11"
                    data-testid="button-add-hero-video"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createHeroVideoMutation.isPending ? "Adding..." : "Add Video"}
                  </Button>
                </div>
              </div>

              {/* Current Videos List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Videos ({heroVideos.length})</h4>
                {heroVideos.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border border-border rounded-md">
                    No hero videos configured. Add some videos above to display on the homepage.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {heroVideos.map((video, index) => (
                      <div 
                        key={video.id}
                        className={`flex items-center justify-between p-3 border rounded-md ${
                          video.isActive ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30"
                        }`}
                        data-testid={`hero-video-item-${video.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{video.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{video.videoUrl}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Badge variant={video.isActive ? "default" : "secondary"}>
                            {video.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleHeroVideoMutation.mutate({ 
                              id: video.id, 
                              isActive: !video.isActive 
                            })}
                            disabled={toggleHeroVideoMutation.isPending}
                            data-testid={`button-toggle-video-${video.id}`}
                          >
                            {video.isActive ? "Hide" : "Show"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
                                deleteHeroVideoMutation.mutate(video.id);
                              }
                            }}
                            disabled={deleteHeroVideoMutation.isPending}
                            data-testid={`button-delete-video-${video.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Active videos and images will rotate on the homepage hero section with smooth fade transitions.
                  Adjust the slide duration below to control how long each slide displays.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Hero Slide Duration */}
        <div className="p-4 md:p-6 border border-border rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">Hero Slide Duration</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Control how long each hero background (video or image) displays before transitioning to the next.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Duration:</label>
              <select
                value={heroSlideDuration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value);
                  setHeroSlideDuration(newDuration);
                  updateHeroSlideDurationMutation.mutate(newDuration);
                }}
                className="px-3 py-2 text-sm border border-border rounded-md bg-background min-w-[120px]"
                data-testid="select-hero-slide-duration"
              >
                <option value={2}>2 seconds</option>
                <option value={3}>3 seconds</option>
                <option value={4}>4 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={6}>6 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>
            {updateHeroSlideDurationMutation.isPending && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            Current setting: Each slide displays for {heroSlideDuration} seconds before transitioning.
          </p>
        </div>

        {/* Show Hero Products Setting */}
        <div className="p-4 md:p-6 border border-border rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">Hero Products in Slideshow</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Control whether products marked as "Hero Section" automatically appear in the homepage hero slideshow.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="show-hero-products"
                checked={showHeroProducts}
                onCheckedChange={(checked) => {
                  setShowHeroProducts(checked);
                  updateShowHeroProductsMutation.mutate(checked);
                }}
                data-testid="switch-show-hero-products"
              />
              <label htmlFor="show-hero-products" className="text-sm font-medium cursor-pointer">
                {showHeroProducts ? "Enabled" : "Disabled"}
              </label>
            </div>
            {updateShowHeroProductsMutation.isPending && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            {showHeroProducts 
              ? "Products marked as 'Hero Section' will appear in the homepage slideshow along with your uploaded hero images/videos." 
              : "Only your manually uploaded hero images and videos will appear in the slideshow. Hero products are disabled."}
          </p>
        </div>

        {/* Hero Background Images */}
        <div className="p-4 md:p-6 border border-border rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">Hero Background Images</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Add background images to the homepage hero section. Images rotate alongside videos with smooth transitions.
          </p>

          {heroImagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add New Image Form */}
              <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30">
                <h4 className="text-sm font-medium mb-3">Add New Background Image</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Image Title</label>
                    <input
                      type="text"
                      value={newImageTitle}
                      onChange={(e) => setNewImageTitle(e.target.value)}
                      placeholder="e.g., Fitness Model, Training Scene"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                      data-testid="input-hero-image-title"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Image URL</label>
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                      data-testid="input-hero-image-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste a direct URL to an image file (JPG, PNG, WebP). Use external hosting like AWS S3, Cloudinary, or CDN links.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (newImageTitle.trim() && newImageUrl.trim()) {
                        createHeroImageMutation.mutate({ 
                          title: newImageTitle.trim(), 
                          imageUrl: newImageUrl.trim() 
                        });
                      }
                    }}
                    disabled={createHeroImageMutation.isPending || !newImageTitle.trim() || !newImageUrl.trim()}
                    className="min-h-11"
                    data-testid="button-add-hero-image"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createHeroImageMutation.isPending ? "Adding..." : "Add Image"}
                  </Button>
                </div>
              </div>

              {/* Current Images List */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Images ({heroImages.length})</h4>
                {heroImages.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border border-border rounded-md">
                    No hero images configured. Add some images above to display on the homepage.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {heroImages.map((image, index) => (
                      <div 
                        key={image.id}
                        className={`flex items-center justify-between p-3 border rounded-md ${
                          image.isActive ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30"
                        }`}
                        data-testid={`hero-image-item-${image.id}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                          {image.imageUrl && (
                            <img 
                              src={image.imageUrl} 
                              alt={image.title}
                              className="w-12 h-8 object-cover rounded border border-border"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{image.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{image.imageUrl}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Badge variant={image.isActive ? "default" : "secondary"}>
                            {image.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleHeroImageMutation.mutate({ 
                              id: image.id, 
                              isActive: !image.isActive 
                            })}
                            disabled={toggleHeroImageMutation.isPending}
                            data-testid={`button-toggle-image-${image.id}`}
                          >
                            {image.isActive ? "Hide" : "Show"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${image.title}"?`)) {
                                deleteHeroImageMutation.mutate(image.id);
                              }
                            }}
                            disabled={deleteHeroImageMutation.isPending}
                            data-testid={`button-delete-image-${image.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Background images will display alongside videos on the homepage hero section.
                  Images display for 6 seconds before transitioning. Use high-quality images (1920x1080 recommended).
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Chatbot Visibility */}
        <div className="p-4 md:p-6 border border-border rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">AI Chatbot Assistant</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Show or hide the AI chatbot widget on your website. The chatbot helps customers with instant answers to their questions.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-3 px-4 border border-border rounded-md">
              <div>
                <p className="text-sm font-medium">Chatbot Widget Visibility</p>
                <p className="text-xs text-muted-foreground">
                  {(settings as any)?.chatbotVisible !== false
                    ? "Chatbot is currently visible on your site"
                    : "Chatbot is currently hidden from your site"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {(settings as any)?.chatbotVisible !== false ? "ON" : "OFF"}
                </span>
                <Button
                  variant={(settings as any)?.chatbotVisible !== false ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newVisibility = !((settings as any)?.chatbotVisible !== false);
                    updateChatbotVisibilityMutation.mutate(newVisibility);
                  }}
                  disabled={updateChatbotVisibilityMutation.isPending}
                  data-testid="button-toggle-chatbot"
                >
                  {updateChatbotVisibilityMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (settings as any)?.chatbotVisible !== false ? (
                    "Hide"
                  ) : (
                    "Show"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Announcement Banner */}
        <div className="p-4 md:p-6 border border-border rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">Announcement Banner</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Display promotional messages, shipping offers, or seasonal announcements at the top of your site
          </p>

          {bannerLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Banner Message</label>
                <textarea
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="Free shipping on orders over $100 | New Collection: Spring Summer 2025"
                  className="w-full min-h-20 px-3 py-2 text-sm border border-border rounded-md bg-background resize-none"
                  data-testid="input-banner-message"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your announcement message. Example: "Free shipping on orders over $100 | New Collection: Spring Summer 2025"
                </p>
              </div>

              <div className="flex items-center justify-between py-3 px-4 border border-border rounded-md">
                <div>
                  <p className="text-sm font-medium">Banner Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {bannerVisible ? "Banner is currently visible on your site" : "Banner is currently hidden from your site"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {bannerVisible ? "ON" : "OFF"}
                  </span>
                  <Button
                    variant={bannerVisible ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newVisibility = !bannerVisible;
                      setBannerVisible(newVisibility);
                      updateBannerMutation.mutate({
                        message: bannerMessage,
                        isVisible: newVisibility,
                      });
                    }}
                    disabled={updateBannerMutation.isPending}
                    data-testid="button-toggle-banner"
                    className="min-h-11 min-w-[100px]"
                  >
                    {updateBannerMutation.isPending ? "Saving..." : bannerVisible ? "✓ Visible" : "Hidden"}
                  </Button>
                </div>
              </div>

              {bannerMessage && (
                <div className="p-4 border border-border rounded-md bg-muted/30">
                  <p className="text-xs font-medium mb-2">Preview:</p>
                  <div 
                    className="w-full py-2 px-4 text-sm text-center text-white rounded"
                    style={{ backgroundColor: banner?.backgroundColor || "#000000" }}
                  >
                    {bannerMessage}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  updateBannerMutation.mutate({
                    message: bannerMessage,
                    isVisible: bannerVisible,
                  });
                }}
                disabled={updateBannerMutation.isPending || !bannerMessage.trim()}
                className="min-h-11"
                data-testid="button-save-banner"
              >
                {updateBannerMutation.isPending ? "Saving..." : "Save Banner"}
              </Button>
            </div>
          )}
        </div>

        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Store Settings</CardTitle>
            <CardDescription>Current store configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Store Name:</strong> 1stRep - Premium Fitness Apparel<br />
                <strong>Target Market:</strong> United Kingdom<br />
                <strong>Currency:</strong> GBP (£)<br />
                <strong>Tax Settings:</strong> UK VAT applicable at checkout
              </AlertDescription>
            </Alert>
            <p className="text-xs text-muted-foreground">
              Store branding and announcements are managed through the Announcement Banner section above. Additional store settings like contact information and business details can be configured through your Replit environment variables.
            </p>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Payment Settings</CardTitle>
            <CardDescription>Payment processing configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Payment Provider</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Stripe</Badge>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Accepted Payment Methods</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Card Payments</Badge>
                  <Badge variant="outline">Apple Pay</Badge>
                  <Badge variant="outline">Google Pay</Badge>
                  <Badge variant="outline">Link</Badge>
                </div>
              </div>
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                Stripe API keys and webhook configuration are managed through Replit integrations and environment variables. Payment processing is handled securely through Stripe's checkout system.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Shipping Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Shipping Settings</CardTitle>
            <CardDescription>Configure shipping costs and free shipping thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Free Shipping Toggle */}
            <div className="flex items-center justify-between py-3 px-4 border border-border rounded-md">
              <div>
                <p className="text-sm font-medium">Free Shipping Offer</p>
                <p className="text-xs text-muted-foreground">
                  {freeShippingEnabled 
                    ? `Free shipping on orders over £${parseFloat(freeShippingThreshold).toFixed(2)}`
                    : "Free shipping is currently disabled"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {freeShippingEnabled ? "ON" : "OFF"}
                </span>
                <Button
                  variant={freeShippingEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newValue = !freeShippingEnabled;
                    setFreeShippingEnabled(newValue);
                    updateShippingSettingsMutation.mutate({ freeShippingEnabled: newValue });
                  }}
                  disabled={updateShippingSettingsMutation.isPending}
                  data-testid="button-toggle-free-shipping"
                >
                  {updateShippingSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : freeShippingEnabled ? (
                    "Enabled"
                  ) : (
                    "Disabled"
                  )}
                </Button>
              </div>
            </div>

            {/* Shipping Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free Shipping Threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Free Shipping Threshold (£)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
                    disabled={!freeShippingEnabled}
                    data-testid="input-free-shipping-threshold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum order amount for free shipping
                </p>
              </div>

              {/* Standard Shipping Cost */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Standard Shipping Cost (£)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={standardShippingCost}
                    onChange={(e) => setStandardShippingCost(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
                    data-testid="input-standard-shipping-cost"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cost for orders below the free shipping threshold
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 border border-border rounded-md bg-muted/30">
              <p className="text-xs font-medium mb-2">Preview:</p>
              <div className="text-sm space-y-1">
                <p><strong>Standard Delivery:</strong> £{parseFloat(standardShippingCost || "0").toFixed(2)}</p>
                {freeShippingEnabled && (
                  <p className="text-green-600 dark:text-green-400">
                    <strong>Free Shipping:</strong> Orders over £{parseFloat(freeShippingThreshold || "0").toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => {
                updateShippingSettingsMutation.mutate({
                  freeShippingEnabled,
                  freeShippingThreshold,
                  standardShippingCost,
                });
              }}
              disabled={updateShippingSettingsMutation.isPending}
              className="min-h-11"
              data-testid="button-save-shipping-settings"
            >
              {updateShippingSettingsMutation.isPending ? "Saving..." : "Save Shipping Settings"}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> These settings apply to the UK delivery zone. Changes take effect immediately across your store, cart, and checkout pages.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payout Settings
            </CardTitle>
            <CardDescription>Configure payout rules for resellers and vendors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Payout Amount (£)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="1000"
                  value={minimumPayoutAmount}
                  onChange={(e) => setMinimumPayoutAmount(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
                  data-testid="input-minimum-payout-amount"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The minimum balance required for resellers and vendors to request a payout (£1 - £1000)
              </p>
            </div>

            <div className="p-4 border border-border rounded-md bg-muted/30">
              <p className="text-xs font-medium mb-2">Current Setting:</p>
              <p className="text-sm">
                <strong>Minimum Payout:</strong> £{parseFloat(minimumPayoutAmount || "50").toFixed(2)}
              </p>
            </div>

            <Button
              onClick={() => {
                updatePayoutSettingsMutation.mutate({
                  minimumPayoutAmount,
                });
              }}
              disabled={updatePayoutSettingsMutation.isPending}
              className="min-h-11"
              data-testid="button-save-payout-settings"
            >
              {updatePayoutSettingsMutation.isPending ? "Saving..." : "Save Payout Settings"}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> Changes take effect immediately. Resellers and vendors will see the new minimum when requesting payouts.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Database Seeding */}
        <div className="p-4 md:p-6 border border-border rounded-lg bg-primary/5">
          <h3 className="text-base md:text-lg font-semibold mb-2">Initial Product Setup</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Populate your store with 39 initial products including Men's, Women's, Training, Yoga, Running, Studio, and Modest Activewear collections.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                if (confirm("This will add 39 products to your store. Products already in the database will be skipped. Continue?")) {
                  seedProductsMutation.mutate();
                }
              }}
              disabled={seedProductsMutation.isPending}
              className="min-h-11 w-full sm:w-auto"
              data-testid="button-seed-products"
            >
              <Plus className="w-4 h-4 mr-2" />
              {seedProductsMutation.isPending ? "Adding Products..." : "Add Initial Products"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("This will fix existing products by adding activity types for collection page filtering. Continue?")) {
                  fixActivityTypesMutation.mutate();
                }
              }}
              disabled={fixActivityTypesMutation.isPending}
              className="min-h-11 w-full sm:w-auto"
              data-testid="button-fix-activity-types"
            >
              {fixActivityTypesMutation.isPending ? "Fixing..." : "Fix Existing Products"}
            </Button>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-3">
            <strong>Note:</strong> If products aren't showing on Training/Yoga/Running/Studio pages, click "Fix Existing Products" to add activity types.
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminCategories() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    displayOrder: 0
  });
  const { toast } = useToast();

  const { data: categories = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/categories"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => apiRequest("POST", "/api/admin/categories", data),
    onSuccess: () => {
      toast({ title: "Category created successfully" });
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create category", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/categories/${id}`, data),
    onSuccess: () => {
      toast({ title: "Category updated successfully" });
      setShowEditDialog(false);
      setSelectedCategory(null);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update category", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => {
      toast({ title: "Category deleted successfully" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete category", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", imageUrl: "", displayOrder: 0 });
  };

  const openEdit = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      displayOrder: category.displayOrder || 0
    });
    setShowEditDialog(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">Manage global product categories</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-admin-create-category">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any) => (
            <Card key={category.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Tag className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{category.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{category.description || "No description"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={category.scope === 'global' ? 'default' : 'outline'}>
                          {category.scope === 'global' ? 'Global' : 'Wholesaler'}
                        </Badge>
                        <Badge variant={category.isActive ? 'default' : 'outline'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEdit(category)}
                      data-testid={`button-edit-admin-category-${category.id}`}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this category?")) {
                          deleteMutation.mutate(category.id);
                        }
                      }}
                      data-testid={`button-delete-admin-category-${category.id}`}
                    >
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Category Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Global Category</CardTitle>
              <CardDescription>Add a new category available to all vendors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Activewear"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-admin-category-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-admin-category-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-admin-category-image"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-admin-category-order"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.name || createMutation.isPending}
                  data-testid="button-save-admin-category"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Category
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Category Dialog */}
      {showEditDialog && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Category</CardTitle>
              <CardDescription>Update category details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Activewear"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-admin-category-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-admin-category-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-admin-category-image"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-admin-category-order"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedCategory(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateMutation.mutate({
                      id: selectedCategory.id,
                      data: {
                        name: formData.name,
                        description: formData.description || null,
                        imageUrl: formData.imageUrl || null,
                        displayOrder: formData.displayOrder
                      }
                    });
                  }}
                  disabled={!formData.name || updateMutation.isPending}
                  data-testid="button-update-admin-category"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  Update Category
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AdminProductSections() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: 0,
    genderFilter: "all" as "all" | "men" | "women",
    viewAllLink: ""
  });
  const { toast } = useToast();

  const { data: sections = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/product-sections"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => apiRequest("POST", "/api/admin/product-sections", data),
    onSuccess: () => {
      toast({ title: "Product section created successfully" });
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create section", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/product-sections/${id}`, data),
    onSuccess: () => {
      toast({ title: "Product section updated successfully" });
      setShowEditDialog(false);
      setSelectedSection(null);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update section", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/product-sections/${id}`),
    onSuccess: () => {
      toast({ title: "Product section deleted successfully" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete section", description: error.message, variant: "destructive" });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest("PATCH", `/api/admin/product-sections/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      toast({ title: `Product section ${variables.isActive ? 'activated' : 'deactivated'} successfully` });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update section status", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", displayOrder: 0, genderFilter: "all", viewAllLink: "" });
  };

  const openEdit = (section: any) => {
    setSelectedSection(section);
    setFormData({
      name: section.name,
      description: section.description || "",
      displayOrder: section.displayOrder || 0,
      genderFilter: section.genderFilter || "all",
      viewAllLink: section.viewAllLink || ""
    });
    setShowEditDialog(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Product Sections</h2>
          <p className="text-muted-foreground">Manage product categories/sections that appear in the product form</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-admin-create-section">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section: any) => (
            <Card key={section.id} className={`relative ${!section.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Layers className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{section.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{section.description || "No description"}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">Order: {section.displayOrder}</Badge>
                        <Badge variant={section.genderFilter === 'men' ? 'default' : section.genderFilter === 'women' ? 'secondary' : 'outline'}>
                          {section.genderFilter === 'men' ? 'Men' : section.genderFilter === 'women' ? 'Women' : 'All Genders'}
                        </Badge>
                      </div>
                      {section.viewAllLink && (
                        <p className="text-xs text-muted-foreground mt-1 truncate" title={section.viewAllLink}>
                          Link: {section.viewAllLink}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{section.isActive ? 'Active' : 'Inactive'}</span>
                      <Switch
                        checked={section.isActive}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: section.id, isActive: checked })}
                        disabled={toggleActiveMutation.isPending}
                        data-testid={`switch-section-active-${section.id}`}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEdit(section)}
                        data-testid={`button-edit-section-${section.id}`}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this section?")) {
                            deleteMutation.mutate(section.id);
                          }
                        }}
                        data-testid={`button-delete-section-${section.id}`}
                      >
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Section Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Product Section</CardTitle>
              <CardDescription>Add a new section for organizing products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Section Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Hoodies and Jumpers"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-section-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-section-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-section-order"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Gender Filter</label>
                <select
                  value={formData.genderFilter}
                  onChange={(e) => setFormData(prev => ({ ...prev, genderFilter: e.target.value as "all" | "men" | "women" }))}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="select-section-gender"
                >
                  <option value="all">All Genders (Both + Unisex)</option>
                  <option value="men">Men Only (+ Unisex)</option>
                  <option value="women">Women Only (+ Unisex)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Filter which products show in this section</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Custom View All Link</label>
                <input
                  type="text"
                  value={formData.viewAllLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, viewAllLink: e.target.value }))}
                  placeholder="/shop-clean?category=Hoodies&gender=men"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-section-viewall-link"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to use default category link</p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.name || createMutation.isPending}
                  data-testid="button-save-section"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Section Dialog */}
      {showEditDialog && selectedSection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Product Section</CardTitle>
              <CardDescription>Update section details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Section Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Hoodies and Jumpers"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-section-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-section-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-section-order"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Gender Filter</label>
                <select
                  value={formData.genderFilter}
                  onChange={(e) => setFormData(prev => ({ ...prev, genderFilter: e.target.value as "all" | "men" | "women" }))}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="select-edit-section-gender"
                >
                  <option value="all">All Genders (Both + Unisex)</option>
                  <option value="men">Men Only (+ Unisex)</option>
                  <option value="women">Women Only (+ Unisex)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Filter which products show in this section</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Custom View All Link</label>
                <input
                  type="text"
                  value={formData.viewAllLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, viewAllLink: e.target.value }))}
                  placeholder="/shop-clean?category=Hoodies&gender=men"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-section-viewall-link"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to use default category link</p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedSection(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateMutation.mutate({
                      id: selectedSection.id,
                      data: {
                        name: formData.name,
                        description: formData.description || null,
                        displayOrder: formData.displayOrder,
                        genderFilter: formData.genderFilter,
                        viewAllLink: formData.viewAllLink || null
                      }
                    });
                  }}
                  disabled={!formData.name || updateMutation.isPending}
                  data-testid="button-update-section"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  Update Section
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AdminActivityTypes() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: 0
  });
  const { toast } = useToast();

  const { data: activityTypes = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/activity-types"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => apiRequest("POST", "/api/admin/activity-types", data),
    onSuccess: () => {
      toast({ title: "Activity type created successfully" });
      setShowCreateDialog(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create activity type", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/activity-types/${id}`, data),
    onSuccess: () => {
      toast({ title: "Activity type updated successfully" });
      setShowEditDialog(false);
      setSelectedType(null);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update activity type", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/activity-types/${id}`),
    onSuccess: () => {
      toast({ title: "Activity type deleted successfully" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete activity type", description: error.message, variant: "destructive" });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest("PATCH", `/api/admin/activity-types/${id}`, { isActive }),
    onSuccess: (_, variables) => {
      toast({ title: `Activity type ${variables.isActive ? 'activated' : 'deactivated'} successfully` });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update activity type status", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", displayOrder: 0 });
  };

  const openEdit = (type: any) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      description: type.description || "",
      displayOrder: type.displayOrder || 0
    });
    setShowEditDialog(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Activity Types</h2>
          <p className="text-muted-foreground">Manage activity types for product categorization (Training, Yoga, Running, etc.)</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-admin-create-activity-type">
          <Plus className="w-4 h-4 mr-2" />
          Add Activity Type
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activityTypes.map((type: any) => (
            <Card key={type.id} className={`relative ${!type.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Activity className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{type.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{type.description || "No description"}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">Order: {type.displayOrder}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{type.isActive ? 'Active' : 'Inactive'}</span>
                      <Switch
                        checked={type.isActive}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: type.id, isActive: checked })}
                        disabled={toggleActiveMutation.isPending}
                        data-testid={`switch-activity-type-active-${type.id}`}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEdit(type)}
                        data-testid={`button-edit-activity-type-${type.id}`}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this activity type?")) {
                            deleteMutation.mutate(type.id);
                          }
                        }}
                        data-testid={`button-delete-activity-type-${type.id}`}
                      >
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Activity Type Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Activity Type</CardTitle>
              <CardDescription>Add a new activity type for product categorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Activity Type Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pilates"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-activity-type-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-activity-type-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-activity-type-order"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.name || createMutation.isPending}
                  data-testid="button-save-activity-type"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Activity Type
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Activity Type Dialog */}
      {showEditDialog && selectedType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Activity Type</CardTitle>
              <CardDescription>Update activity type details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Activity Type Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pilates"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-activity-type-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-activity-type-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded border border-border bg-background"
                  data-testid="input-edit-activity-type-order"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedType(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateMutation.mutate({
                      id: selectedType.id,
                      data: {
                        name: formData.name,
                        description: formData.description || null,
                        displayOrder: formData.displayOrder
                      }
                    });
                  }}
                  disabled={!formData.name || updateMutation.isPending}
                  data-testid="button-update-activity-type"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                  Update Activity Type
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Admin License Requests Component
function AdminLicenseRequests() {
  const [selectedTab, setSelectedTab] = useState<'subscribers' | 'reseller' | 'vendor'>('subscribers');
  const { toast } = useToast();
  const [editingFees, setEditingFees] = useState(false);
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({});
  const [editingTiers, setEditingTiers] = useState(false);
  const [tierInputs, setTierInputs] = useState<Record<string, { price: string; productLimit: string; displayName: string; isActive: boolean }>>({});
  const [approveTrialDialog, setApproveTrialDialog] = useState<{ id: string; name: string } | null>(null);
  const [trialDaysInput, setTrialDaysInput] = useState("30");
  const [editTrialDialog, setEditTrialDialog] = useState<{ licenceId: string; name: string; currentDays: number } | null>(null);
  const [editTrialDaysInput, setEditTrialDaysInput] = useState("30");

  // Fetch subscription tier pricing
  const { data: subscriptionTiers = [], isLoading: tiersLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/subscription-tiers'],
  });

  // Fetch reseller license requests (pending trial requests from reseller_licences table)
  const { data: resellerRequests = [], isLoading: resellerLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/reseller-licences/pending-trials'],
  });

  // Fetch vendor wholesale requests
  const { data: vendorRequests = [], isLoading: vendorLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/vendor-wholesale-requests'],
  });

  // Fetch license settings
  const { data: licenseSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/license-settings'],
  });

  // Fetch active licensed resellers with metrics
  const { data: activeLicences = [], isLoading: activeLicencesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/reseller-licences/active-metrics'],
  });

  // Approve reseller trial request mutation
  const approveResellerMutation = useMutation({
    mutationFn: async ({ id, trialDays, notes }: { id: string; trialDays?: number; notes?: string }) => {
      return apiRequest('POST', `/api/admin/reseller-licences/${id}/approve-trial`, { trialDays: trialDays ?? 30, notes });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reseller-licences/pending-trials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reseller-licences/active-metrics'] });
      toast({ title: 'Trial request approved', description: `The reseller can now add their own products for ${variables.trialDays ?? 30} days.` });
      setApproveTrialDialog(null);
      setTrialDaysInput("30");
    },
    onError: (error: any) => {
      toast({ title: 'Approval failed', description: error.message, variant: 'destructive' });
    }
  });

  // Update trial days for an active licence mutation
  const updateTrialMutation = useMutation({
    mutationFn: async ({ licenceId, trialDays }: { licenceId: string; trialDays: number }) => {
      return apiRequest('PATCH', `/api/admin/reseller-licences/${licenceId}/update-trial`, { trialDays });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reseller-licences/active-metrics'] });
      toast({ title: 'Trial updated', description: `Trial duration updated to ${variables.trialDays} days.` });
      setEditTrialDialog(null);
      setEditTrialDaysInput("30");
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  });

  // Reject reseller trial request mutation
  const rejectResellerMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest('POST', `/api/admin/reseller-licences/${id}/reject-trial`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reseller-licences/pending-trials'] });
      toast({ title: 'Trial request rejected' });
    },
    onError: (error: any) => {
      toast({ title: 'Rejection failed', description: error.message, variant: 'destructive' });
    }
  });

  // Approve vendor wholesale mutation
  const approveVendorMutation = useMutation({
    mutationFn: async ({ id, notes, commissionRate }: { id: string; notes?: string; commissionRate?: number }) => {
      return apiRequest('POST', `/api/admin/vendor-wholesale-requests/${id}/approve`, { notes, commissionRate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-wholesale-requests'] });
      toast({ title: 'Wholesale access approved', description: 'The wholesaler can now sell 1stRep products.' });
    },
    onError: (error: any) => {
      toast({ title: 'Approval failed', description: error.message, variant: 'destructive' });
    }
  });

  // Reject vendor wholesale mutation
  const rejectVendorMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest('POST', `/api/admin/vendor-wholesale-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-wholesale-requests'] });
      toast({ title: 'Wholesale request rejected' });
    },
    onError: (error: any) => {
      toast({ title: 'Rejection failed', description: error.message, variant: 'destructive' });
    }
  });

  // Update license settings mutation
  const updateLicenseSettingsMutation = useMutation({
    mutationFn: async ({ id, feeAmount }: { id: string; feeAmount: string }) => {
      return apiRequest("PATCH", `/api/admin/license-settings/${id}`, { feeAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/license-settings"] });
      toast({ title: "Fee updated", description: "Licence fee has been updated successfully." });
      setEditingFees(false);
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const updateSubscriptionTierMutation = useMutation({
    mutationFn: async ({ id, pricePerMonth, productLimit, displayName, isActive }: { id: string; pricePerMonth: string; productLimit: number | null; displayName?: string; isActive?: boolean }) => {
      return apiRequest("PATCH", `/api/admin/subscription-tiers/${id}`, { pricePerMonth, productLimit, displayName, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-tiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-tiers"] });
      toast({ title: "Tiers saved", description: "Subscription tier settings have been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const saveAllTiers = () => {
    Object.entries(tierInputs).forEach(([id, values]) => {
      const productLimit = values.productLimit === '' || values.productLimit === 'unlimited' ? null : parseInt(values.productLimit);
      updateSubscriptionTierMutation.mutate({ id, pricePerMonth: values.price, productLimit, displayName: values.displayName, isActive: values.isActive });
    });
    setEditingTiers(false);
  };

  const toggleTierActive = (id: string) => {
    const tier = subscriptionTiers.find((t: any) => t.id === id);
    if (!tier) return;
    updateSubscriptionTierMutation.mutate({
      id,
      pricePerMonth: tier.pricePerMonth || '0',
      productLimit: tier.productLimit,
      isActive: !tier.isActive,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Awaiting Payment</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Not Started'}</Badge>;
    }
  };

  const pendingResellerCount = resellerRequests.filter((r: any) => r.status === 'pending' && r.paymentStatus === 'paid').length;
  const pendingVendorCount = vendorRequests.filter((v: any) => v.status === 'pending').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Licence & Wholesale Requests</h1>
          <p className="text-muted-foreground">Manage reseller product licences and wholesaler access</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingResellerCount > 0 && (
            <Badge className="bg-primary">{pendingResellerCount} pending licence</Badge>
          )}
          {pendingVendorCount > 0 && (
            <Badge className="bg-purple-500">{pendingVendorCount} pending wholesale</Badge>
          )}
        </div>
      </div>

      {/* Subscription Tier Pricing Card */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center gap-4 flex-wrap">
          <CreditCard className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-semibold">Subscription Tier Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Set the monthly price and product limits for each subscription tier. Gold tier has unlimited products.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!editingTiers ? (
              <Button variant="outline" size="sm" onClick={() => {
                const inputs: Record<string, { price: string; productLimit: string; displayName: string; isActive: boolean }> = {};
                subscriptionTiers.forEach((tier: any) => {
                  inputs[tier.id] = {
                    price: tier.pricePerMonth || '0',
                    productLimit: tier.productLimit === null ? 'unlimited' : tier.productLimit.toString(),
                    displayName: tier.displayName || tier.tierName,
                    isActive: tier.isActive !== false,
                  };
                });
                setTierInputs(inputs);
                setEditingTiers(true);
              }}>
                <Edit className="h-4 w-4 mr-1" /> Edit Tiers
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditingTiers(false)}>Cancel</Button>
                <Button size="sm" onClick={saveAllTiers} disabled={updateSubscriptionTierMutation.isPending}>
                  {updateSubscriptionTierMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save All'}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {tiersLoading && (
          <div className="mt-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading tiers...</span>
          </div>
        )}
        
        {!tiersLoading && editingTiers && subscriptionTiers.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subscriptionTiers.map((tier: any) => {
              const inp = tierInputs[tier.id];
              const isActive = inp?.isActive !== false;
              return (
                <div key={tier.id} className={`p-3 rounded-lg border space-y-3 transition-opacity ${isActive ? 'bg-background' : 'bg-muted/40 opacity-60'}`}>
                  {/* Header row: active toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{tier.tierName}</span>
                    <button
                      type="button"
                      onClick={() => setTierInputs(prev => ({
                        ...prev,
                        [tier.id]: { ...prev[tier.id], isActive: !prev[tier.id]?.isActive }
                      }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {/* Editable display name */}
                  <div>
                    <label className="text-xs text-muted-foreground">Tier Name</label>
                    <Input
                      value={inp?.displayName || ''}
                      onChange={(e) => setTierInputs(prev => ({
                        ...prev,
                        [tier.id]: { ...prev[tier.id], displayName: e.target.value }
                      }))}
                      className="h-8 text-sm mt-1"
                      placeholder="Display name"
                    />
                  </div>
                  {/* Price */}
                  <div>
                    <label className="text-xs text-muted-foreground">Monthly Price (£)</label>
                    <div className="flex items-center mt-1">
                      <span className="text-sm mr-1">£</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={inp?.price || ''}
                        onChange={(e) => setTierInputs(prev => ({
                          ...prev,
                          [tier.id]: { ...prev[tier.id], price: e.target.value }
                        }))}
                        className="h-8 text-sm"
                        disabled={tier.tierName === 'trial'}
                      />
                    </div>
                  </div>
                  {/* Product limit */}
                  <div>
                    <label className="text-xs text-muted-foreground">Product Limit</label>
                    <Input
                      type={tier.tierName === 'gold' ? 'text' : 'number'}
                      min="1"
                      value={tier.tierName === 'gold' ? 'Unlimited' : (inp?.productLimit || '')}
                      onChange={(e) => setTierInputs(prev => ({
                        ...prev,
                        [tier.id]: { ...prev[tier.id], productLimit: e.target.value }
                      }))}
                      className="h-8 text-sm mt-1"
                      disabled={tier.tierName === 'gold'}
                      placeholder={tier.tierName === 'gold' ? 'Unlimited' : 'Enter limit'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {!tiersLoading && !editingTiers && subscriptionTiers.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {subscriptionTiers.map((tier: any) => (
              <div key={tier.id} className={`p-3 rounded border transition-opacity ${tier.isActive ? 'bg-background' : 'bg-muted/40 opacity-55'}`}>
                {/* Name + status row */}
                <div className="flex items-center justify-between mb-2 gap-1">
                  <span className="font-semibold text-sm truncate">{tier.displayName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {tier.isActive ? (
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-500 bg-green-500/10 px-1.5 py-0">On</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">Off</Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleTierActive(tier.id)}
                      disabled={updateSubscriptionTierMutation.isPending}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${tier.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition-transform ${tier.isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                {/* Internal key label */}
                <div className="text-[10px] text-muted-foreground font-mono mb-2 uppercase tracking-wide">{tier.tierName}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">
                    {tier.tierName === 'trial' ? 'Free' : `£${parseFloat(tier.pricePerMonth || '0').toFixed(2)}/mo`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="font-medium">
                    {tier.productLimit === null ? 'Unlimited' : tier.productLimit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b pb-4 flex-wrap">
        <Button
          variant={selectedTab === 'subscribers' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('subscribers')}
          className="min-h-11"
          data-testid="tab-subscribers"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Subscribers ({activeLicences.filter((l: any) => !l.isOnTrial && l.licence?.status !== 'trial').length})
        </Button>
        <Button
          variant={selectedTab === 'reseller' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('reseller')}
          className="min-h-11"
          data-testid="tab-reseller-licenses"
        >
          <Key className="h-4 w-4 mr-2" />
          Trial Requests ({resellerRequests.length})
        </Button>
        <Button
          variant={selectedTab === 'vendor' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('vendor')}
          className="min-h-11"
          data-testid="tab-vendor-wholesale"
        >
          <Store className="h-4 w-4 mr-2" />
          Wholesaler Access ({vendorRequests.length})
        </Button>
      </div>

      {/* Subscribers Tab */}
      {selectedTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Summary bar */}
          {!activeLicencesLoading && activeLicences.length > 0 && (() => {
            const paid = activeLicences.filter((l: any) => !l.isOnTrial && l.licence?.status !== 'trial');
            const trials = activeLicences.filter((l: any) => l.isOnTrial || l.licence?.status === 'trial');
            const totalRevenue = paid.reduce((sum: number, l: any) => sum + (parseFloat(l.licence?.priceAmount || '0')), 0);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-green-500">{paid.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Paid Subscribers</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-blue-500">{trials.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">On Trial</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Monthly Revenue</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold">{paid.reduce((s: number, l: any) => s + (l.productCount || 0), 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Products Listed</p>
                </Card>
              </div>
            );
          })()}

          {activeLicencesLoading ? (
            <Card className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading subscribers...</p>
            </Card>
          ) : activeLicences.length === 0 ? (
            <Card className="p-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No subscribers yet</p>
              <p className="text-sm text-muted-foreground mt-1">Paid subscribers and active trials will appear here.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Paid subscribers first */}
              {activeLicences.filter((l: any) => !l.isOnTrial && l.licence?.status !== 'trial').length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide px-1">Paid Subscriptions</h3>
                  {activeLicences
                    .filter((l: any) => !l.isOnTrial && l.licence?.status !== 'trial')
                    .map((item: any) => (
                      <Card key={item.licence.id} className="p-4 border-green-500/20">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* Left: identity */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-lg">{item.reseller?.businessName || 'Unknown Reseller'}</span>
                              <Badge className="bg-green-500/20 text-green-700 border-green-500/30 border">
                                {item.subscriptionTier ? item.subscriptionTier.charAt(0).toUpperCase() + item.subscriptionTier.slice(1) : 'Active'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                              {item.reseller?.email && (
                                <div className="flex gap-1">
                                  <span className="text-muted-foreground w-20 shrink-0">Email:</span>
                                  <span className="font-medium break-all">{item.reseller.email}</span>
                                </div>
                              )}
                              {(item.reseller?.firstName || item.reseller?.lastName) && (
                                <div className="flex gap-1">
                                  <span className="text-muted-foreground w-20 shrink-0">Contact:</span>
                                  <span className="font-medium">{[item.reseller.firstName, item.reseller.lastName].filter(Boolean).join(' ')}</span>
                                </div>
                              )}
                              {item.reseller?.phoneNumber && (
                                <div className="flex gap-1">
                                  <span className="text-muted-foreground w-20 shrink-0">Phone:</span>
                                  <span className="font-medium">{item.reseller.phoneNumber}</span>
                                </div>
                              )}
                              {item.reseller?.website && (
                                <div className="flex gap-1">
                                  <span className="text-muted-foreground w-20 shrink-0">Website:</span>
                                  <a href={item.reseller.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate">{item.reseller.website}</a>
                                </div>
                              )}
                            </div>

                            {/* Subscription details */}
                            <div className="mt-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Monthly Price</p>
                                <p className="font-bold text-green-600">
                                  {item.licence?.priceAmount
                                    ? `£${parseFloat(item.licence.priceAmount).toFixed(2)}/mo`
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Activated</p>
                                <p className="font-medium">
                                  {item.licence?.activatedAt
                                    ? new Date(item.licence.activatedAt).toLocaleDateString('en-GB')
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Renews / Expires</p>
                                <p className="font-medium">
                                  {item.licence?.expiresAt
                                    ? new Date(item.licence.expiresAt).toLocaleDateString('en-GB')
                                    : 'Ongoing'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Products Listed</p>
                                <p className="font-medium">{item.productCount ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Sales Orders</p>
                                <p className="font-medium">{item.orderCount ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Own-Product Revenue</p>
                                <p className="font-medium text-green-600">
                                  £{(item.ownProductsRevenue ?? 0).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Product limit */}
                            {item.licence?.productLimit && (
                              <p className="text-xs text-muted-foreground">
                                Product limit: <span className="font-medium">{item.licence.productLimit === 9999 ? 'Unlimited' : item.licence.productLimit}</span>
                              </p>
                            )}

                            {/* Stripe reference */}
                            {item.licence?.stripeSubscriptionId && (
                              <p className="text-xs text-muted-foreground">
                                Stripe sub: <span className="font-mono">{item.licence.stripeSubscriptionId}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                </>
              )}

              {/* Trials section */}
              {activeLicences.filter((l: any) => l.isOnTrial || l.licence?.status === 'trial').length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide px-1 mt-4">Active Trials</h3>
                  {activeLicences
                    .filter((l: any) => l.isOnTrial || l.licence?.status === 'trial')
                    .map((item: any) => (
                      <Card key={item.licence.id} className="p-4 border-blue-500/20">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-lg">{item.reseller?.businessName || 'Unknown Reseller'}</span>
                              <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 border">Trial</Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                              {item.reseller?.email && (
                                <div className="flex gap-1">
                                  <span className="text-muted-foreground w-20 shrink-0">Email:</span>
                                  <span className="font-medium break-all">{item.reseller.email}</span>
                                </div>
                              )}
                              {(item.reseller?.firstName || item.reseller?.lastName) && (
                                <div className="flex gap-1">
                                  <span className="text-muted-foreground w-20 shrink-0">Contact:</span>
                                  <span className="font-medium">{[item.reseller.firstName, item.reseller.lastName].filter(Boolean).join(' ')}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Trial Day</p>
                                <p className="font-bold text-blue-600">
                                  {item.trialDaysPassed !== null ? `Day ${item.trialDaysPassed + 1}` : '—'}
                                  {item.trialDaysRemaining !== null && (
                                    <span className="text-xs font-normal text-muted-foreground ml-1">({item.trialDaysRemaining}d left)</span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Started</p>
                                <p className="font-medium">
                                  {item.licence?.trialStartedAt
                                    ? new Date(item.licence.trialStartedAt).toLocaleDateString('en-GB')
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Trial Ends</p>
                                <p className="font-medium">
                                  {item.licence?.trialEndsAt
                                    ? new Date(item.licence.trialEndsAt).toLocaleDateString('en-GB')
                                    : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Products Listed</p>
                                <p className="font-medium">{item.productCount ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Sales Orders</p>
                                <p className="font-medium">{item.orderCount ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Own-Product Revenue</p>
                                <p className="font-medium">£{(item.ownProductsRevenue ?? 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reseller License Requests */}
      {selectedTab === 'reseller' && (
        <div className="space-y-4">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-4 flex-wrap">
              <Key className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-semibold">Product Licence Subscriptions</h3>
                <p className="text-sm text-muted-foreground">
                  Resellers can request a 30-day free trial or subscribe to a tier (Bronze, Silver, Gold) to add and sell their own products.
                </p>
              </div>
            </div>
          </Card>

          {resellerLoading ? (
            <Card className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading requests...</p>
            </Card>
          ) : resellerRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No licence requests yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {resellerRequests.map((request: any) => (
                <Card key={request.id} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-semibold text-lg">{request.reseller?.businessName || 'Unknown Reseller'}</span>
                        {getStatusBadge(request.status)}
                        {getPaymentBadge(request.paymentStatus)}
                      </div>
                      <p className="text-sm text-muted-foreground">{request.reseller?.email}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested: {new Date(request.trialRequestedAt || request.createdAt).toLocaleDateString('en-GB')}
                      </p>
                      {request.businessJustification && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">
                          <strong>Justification:</strong> {request.businessJustification}
                        </p>
                      )}
                      {request.rejectionReason && (
                        <p className="text-sm mt-2 text-red-500">
                          <strong>Rejected:</strong> {request.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {request.requestedFee && (
                        <span className="text-xl font-bold">£{parseFloat(request.requestedFee).toFixed(2)}</span>
                      )}
                      {request.status === 'pending_trial' && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500">
                          Free Trial Request
                        </Badge>
                      )}
                      {(request.status === 'pending_trial' || (request.status === 'pending' && request.paymentStatus === 'paid')) && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setTrialDaysInput("30");
                              setApproveTrialDialog({ id: request.id, name: request.reseller?.businessName || request.reseller?.contactName || 'this reseller' });
                            }}
                            disabled={approveResellerMutation.isPending}
                            className="min-h-9"
                            data-testid={`button-approve-reseller-${request.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) {
                                rejectResellerMutation.mutate({ id: request.id, reason });
                              }
                            }}
                            disabled={rejectResellerMutation.isPending}
                            className="min-h-9"
                            data-testid={`button-reject-reseller-${request.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Active Licences Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-green-500" />
              Active Licences ({activeLicences.length})
            </h3>
            
            {activeLicencesLoading ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Loading active licences...</p>
              </Card>
            ) : activeLicences.length === 0 ? (
              <Card className="p-8 text-center">
                <Key className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No active licences yet</p>
                <p className="text-sm text-muted-foreground">When resellers activate trials or subscriptions, they will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-3" data-testid="active-licences-list">
                {activeLicences.map((item: any) => (
                  <Card key={item.licence.id} className="p-4" data-testid={`card-active-licence-${item.licence.id}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="font-semibold text-lg" data-testid={`text-reseller-name-${item.licence.id}`}>{item.reseller?.businessName || 'Unknown Reseller'}</span>
                          {(item.isOnTrial || item.licence?.status === 'trial') ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500" data-testid={`badge-trial-${item.licence.id}`}>
                              Trial
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500" data-testid={`badge-tier-${item.licence.id}`}>
                              {item.subscriptionTier ? item.subscriptionTier.charAt(0).toUpperCase() + item.subscriptionTier.slice(1) : 'Active'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-reseller-email-${item.licence.id}`}>{item.reseller?.email}</p>
                        
                        {/* Trial Info */}
                        {(item.isOnTrial || item.licence?.status === 'trial') && (
                          <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/30" data-testid={`trial-info-${item.licence.id}`}>
                            <p className="text-sm text-blue-600">
                              <strong>Trial Status:</strong> Day {item.trialDaysPassed !== null ? item.trialDaysPassed + 1 : '?'} of {(() => {
                                // Use backend-provided metrics for accurate total
                                if (item.trialDaysPassed !== null && item.trialDaysRemaining !== null) {
                                  return item.trialDaysPassed + item.trialDaysRemaining;
                                }
                                return 30; // Default fallback
                              })()}
                              {item.trialDaysRemaining !== null && (
                                <span className="ml-2" data-testid={`text-trial-remaining-${item.licence.id}`}>
                                  ({item.trialDaysRemaining} day{item.trialDaysRemaining !== 1 ? 's' : ''} remaining)
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {/* Subscription Tier */}
                        {!item.isOnTrial && item.licence?.status !== 'trial' && item.subscriptionTier && (
                          <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/30" data-testid={`subscription-info-${item.licence.id}`}>
                            <p className="text-sm text-green-600">
                              <strong>Plan:</strong> {item.subscriptionTier.charAt(0).toUpperCase() + item.subscriptionTier.slice(1)} Tier
                            </p>
                          </div>
                        )}

                        {/* Edit trial button for active trial licences */}
                        {(item.isOnTrial || item.licence?.status === 'trial') && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-edit-trial-${item.licence.id}`}
                              onClick={() => {
                                const currentTotal = (item.trialDaysPassed ?? 0) + (item.trialDaysRemaining ?? 30);
                                setEditTrialDaysInput(String(currentTotal));
                                setEditTrialDialog({ licenceId: item.licence.id, name: item.reseller?.businessName || 'Reseller', currentDays: currentTotal });
                              }}
                            >
                              Edit Trial Days
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        <div className="p-3 rounded bg-muted/50 text-center min-w-[100px]" data-testid={`metric-products-${item.licence.id}`}>
                          <p className="text-2xl font-bold text-primary">{item.productCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Own Products</p>
                        </div>
                        <div className="p-3 rounded bg-muted/50 text-center min-w-[100px]" data-testid={`metric-revenue-${item.licence.id}`}>
                          <p className="text-2xl font-bold text-green-600">£{(item.ownProductsRevenue || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Own Products Revenue</p>
                        </div>
                        <div className="p-3 rounded bg-muted/50 text-center min-w-[100px]" data-testid={`metric-orders-${item.licence.id}`}>
                          <p className="text-2xl font-bold">{item.orderCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Orders</p>
                        </div>
                        <div className="p-3 rounded bg-muted/50 text-center min-w-[100px]" data-testid={`metric-start-date-${item.licence.id}`}>
                          <p className="text-sm font-medium text-muted-foreground">
                            {item.licence.trialStartedAt ? new Date(item.licence.trialStartedAt).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">Started</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wholesaler Requests */}
      {selectedTab === 'vendor' && (
        <div className="space-y-4">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-4">
              <Store className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold">Wholesale Access</h3>
                <p className="text-sm text-muted-foreground">
                  Wholesalers can request access to order 1stRep products at wholesale prices. No payment required.
                </p>
              </div>
            </div>
          </Card>

          {vendorLoading ? (
            <Card className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading requests...</p>
            </Card>
          ) : vendorRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No wholesale access requests yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {vendorRequests.map((request: any) => (
                <Card key={request.id} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-semibold text-lg">{request.vendor?.businessName || 'Unknown Wholesaler'}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{request.vendor?.email}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested: {new Date(request.createdAt).toLocaleDateString('en-GB')}
                      </p>
                      {request.businessJustification && (
                        <p className="text-sm mt-2 p-2 bg-muted rounded">
                          <strong>Justification:</strong> {request.businessJustification}
                        </p>
                      )}
                      {request.proposedCategories && (
                        <p className="text-sm mt-1 text-muted-foreground">
                          <strong>Categories:</strong> {request.proposedCategories}
                        </p>
                      )}
                      {request.estimatedMonthlyVolume && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Est. Monthly Volume:</strong> £{request.estimatedMonthlyVolume}
                        </p>
                      )}
                      {request.rejectionReason && (
                        <p className="text-sm mt-2 text-red-500">
                          <strong>Rejected:</strong> {request.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveVendorMutation.mutate({ id: request.id })}
                            disabled={approveVendorMutation.isPending}
                            className="min-h-9"
                            data-testid={`button-approve-vendor-${request.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) {
                                rejectVendorMutation.mutate({ id: request.id, reason });
                              }
                            }}
                            disabled={rejectVendorMutation.isPending}
                            className="min-h-9"
                            data-testid={`button-reject-vendor-${request.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approve Trial — custom days dialog */}
      <Dialog open={!!approveTrialDialog} onOpenChange={(open) => { if (!open) setApproveTrialDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve Free Trial</DialogTitle>
            <DialogDescription>
              Set how many days of free trial to grant to <strong>{approveTrialDialog?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="admin-trial-days">Trial Duration (days)</Label>
              <Input
                id="admin-trial-days"
                type="number"
                min="1"
                max="365"
                value={trialDaysInput}
                onChange={(e) => setTrialDaysInput(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">Common options: 7, 14, 30, 60, 90 days</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setApproveTrialDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={approveResellerMutation.isPending || !trialDaysInput || parseInt(trialDaysInput) < 1}
                onClick={() => {
                  if (approveTrialDialog) {
                    approveResellerMutation.mutate({ id: approveTrialDialog.id, trialDays: parseInt(trialDaysInput) || 30 });
                  }
                }}
                data-testid="button-confirm-approve-trial"
              >
                {approveResellerMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Approve {trialDaysInput || '30'}-Day Trial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Trial Days Dialog */}
      <Dialog open={!!editTrialDialog} onOpenChange={(open) => { if (!open) setEditTrialDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Trial Duration</DialogTitle>
            <DialogDescription>
              Change the total number of trial days for <strong>{editTrialDialog?.name}</strong>. The trial end date will be recalculated from when the trial started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-trial-days">Total Trial Duration (days)</Label>
              <Input
                id="edit-trial-days"
                type="number"
                min="1"
                max="365"
                value={editTrialDaysInput}
                onChange={(e) => setEditTrialDaysInput(e.target.value)}
                placeholder="30"
                data-testid="input-edit-trial-days"
              />
              <p className="text-xs text-muted-foreground">
                Current total: {editTrialDialog?.currentDays} days. Common options: 7, 14, 30, 60, 90 days.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditTrialDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updateTrialMutation.isPending || !editTrialDaysInput || parseInt(editTrialDaysInput) < 1}
                onClick={() => {
                  if (editTrialDialog) {
                    updateTrialMutation.mutate({ licenceId: editTrialDialog.licenceId, trialDays: parseInt(editTrialDaysInput) || 30 });
                  }
                }}
                data-testid="button-confirm-edit-trial"
              >
                {updateTrialMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Update to {editTrialDaysInput || '30'} Days
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
