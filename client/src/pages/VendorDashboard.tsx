import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import StorefrontManagement from "@/components/reseller/StorefrontManagement";
import RequestStockDialog from "@/components/reseller/RequestStockDialog";
import Vendor1stRepProducts from "@/components/vendor/Vendor1stRepProducts";
import NotificationCenter from "@/components/NotificationCenter";
import MessagesPanel from "@/components/reseller/MessagesPanel";
import { 
  LogOut, Package, Users, TrendingUp, Plus, Edit, Trash2, 
  DollarSign, ShoppingCart, BarChart3, Settings, Check, X, Eye,
  AlertCircle, Box, RefreshCw, Tag, Image, Layers, Store, MessageSquare,
  Zap, Clock, AlertTriangle, KeyRound, Wallet, Loader2, Upload
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";
import { useB2BCapabilities } from "@/hooks/useB2BCapabilities";

interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  description: string | null;
  basePrice: string;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VendorProductVariant {
  id: string;
  vendorProductId: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price: string;
  stockQuantity: number;
  isActive: boolean;
}

interface VendorDashboardData {
  vendor: {
    id: string;
    businessName: string;
    businessDescription: string | null;
    approvalStatus: string;
    userId: string;
    canAddOwnProducts: boolean;
  };
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalSold: number;
    totalRevenue: string;
    activeResellers: number;
    pendingPermissions: number;
    averageRating: string;
  };
  totalProducts?: number;
  totalSales?: string;
  activeResellers?: number;
  recentProducts?: VendorProduct[];
  lowStockProducts?: any[];
}

interface VendorResellerPermission {
  id: string;
  vendorId: string;
  resellerId: string;
  vendorProductId: string;
  isApproved: boolean;
  approvedAt: string | null;
  createdAt: string;
  resellerName?: string;
  productName?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: 'global' | 'vendor';
  vendorId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function VendorDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [requestStockOpen, setRequestStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "",
    imageUrl: ""
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState({
    size: "",
    color: "",
    sku: "",
    price: "",
    stock: "0"
  });
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    imageUrl: ""
  });
  
  // EPOS PIN management state
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [isFirstTimePin, setIsFirstTimePin] = useState(false);
  
  // Payout request state
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankSortCode, setBankSortCode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; email: string; role: string }>({
    queryKey: ['/api/auth/me'],
  });

  const isVendor = Boolean(authUser && authUser.role === "vendor");
  
  const { 
    partnerType,
    canRequestStock, 
    canAddOwnProducts, 
    canViewAnalytics, 
    canProcessEpos,
    canManageStorefront,
    isLoading: capabilitiesLoading 
  } = useB2BCapabilities();
  
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<VendorDashboardData>({
    queryKey: ["/api/vendor/dashboard"],
    enabled: isVendor,
  });

  const { data: siteSettings } = useQuery<{ minimumPayoutAmount?: string }>({
    queryKey: ["/api/site-settings"],
  });

  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery<VendorProduct[]>({
    queryKey: ["/api/vendor/products"],
    enabled: isVendor,
  });

  // Fetch vendor's 1stRep partner products (products from catalogue they're selling)
  const { data: partnerProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/vendor/partner-products"],
    enabled: isVendor,
  });

  const { data: permissions = [], isLoading: permissionsLoading, refetch: refetchPermissions } = useQuery<VendorResellerPermission[]>({
    queryKey: ["/api/vendor/reseller-permissions"],
    enabled: isVendor,
  });

  const { data: variants = [], refetch: refetchVariants } = useQuery<VendorProductVariant[]>({
    queryKey: ["/api/vendor/products", selectedProduct?.id, "variants"],
    enabled: Boolean(selectedProduct),
  });

  // Fetch categories available to vendor (global + vendor's own)
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery<Category[]>({
    queryKey: ["/api/vendor/categories"],
    enabled: isVendor,
  });

  // Only fetch reseller-related data if user is a reseller (not a pure wholesaler)
  const isReseller = partnerType === 'reseller';
  
  // Fetch reseller access status - only for confirmed resellers (not wholesalers)
  const { data: resellerAccessStatus, isLoading: resellerAccessLoading, refetch: refetchResellerAccess } = useQuery<any>({
    queryKey: ["/api/vendor/reseller-access-status"],
    enabled: isReseller,
    retry: false,
  });

  // Fetch Stripe Connect status - only for resellers
  const { data: stripeConnectStatus, isLoading: stripeStatusLoading, refetch: refetchStripeStatus } = useQuery<{
    stripeAccountId: string | null;
    onboardingStatus: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    accountEmail: string | null;
  }>({
    queryKey: ["/api/vendor/stripe-connect/status"],
    enabled: isReseller,
  });

  // Compute if reseller access is confirmed from status check
  const resellerAccessConfirmed = Boolean(!resellerAccessLoading && resellerAccessStatus?.hasResellerAccess === true);

  // Fetch reseller data - only for resellers
  const { data: resellerData, isSuccess: resellerQuerySuccess, isLoading: resellerLoading } = useQuery<any>({
    queryKey: ["/api/reseller/dashboard"],
    enabled: isReseller && resellerAccessConfirmed,
    retry: false, // Don't retry if not a reseller
  });

  // Helper to check if vendor has reseller access - must be successful query with valid reseller data
  const hasResellerAccess = Boolean(resellerQuerySuccess && resellerData && !resellerData.error && resellerData.reseller?.id);
  const reseller = hasResellerAccess ? resellerData.reseller : null;
  const metrics = hasResellerAccess ? (resellerData.metrics || {}) : {};
  
  // Check pending reseller access request
  const hasPendingResellerRequest = resellerAccessStatus?.status === "pending";
  const hasNoResellerAccess = resellerAccessStatus?.status === "none" || !resellerAccessStatus;

  // Fetch inventory (reseller inventory) - only if has reseller access
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<any[]>({
    queryKey: ["/api/reseller/inventory"],
    enabled: hasResellerAccess === true,
    retry: false,
  });

  // Fetch B2B orders (stock requests to 1stRep) - only if has reseller access
  const { data: b2bOrders = [], isLoading: b2bOrdersLoading } = useQuery<any[]>({
    queryKey: ["/api/reseller/b2b-orders"],
    enabled: hasResellerAccess === true,
    retry: false,
  });

  // Fetch reseller customer orders (storefront sales) - only if has reseller access
  const { data: customerOrders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/reseller/orders"],
    enabled: hasResellerAccess === true,
    retry: false,
  });

  // Fetch order stats - only if has reseller access
  const { data: orderStats } = useQuery<any>({
    queryKey: ["/api/reseller/orders/stats/summary"],
    enabled: hasResellerAccess === true,
    retry: false,
  });

  // Fetch stock alerts - only if has reseller access
  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ["/api/reseller/alerts"],
    enabled: hasResellerAccess === true,
    retry: false,
  });

  // Fetch analytics - only if has reseller access
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/reseller/analytics"],
    enabled: hasResellerAccess === true,
    retry: false,
  });

  // Fetch reseller commission earnings - only if has reseller access
  const { data: earningsData, isLoading: earningsLoading } = useQuery<{
    balance: {
      totalEarned: number;
      totalPaidOut: number;
      pendingPayout: number;
      availableBalance: number;
    };
    recentEarnings: Array<{
      orderId: string;
      orderNumber: string;
      amount: string;
      orderDate: string;
    }>;
  }>({
    queryKey: ["/api/reseller/earnings"],
    enabled: hasResellerAccess === true,
    retry: false,
  });

  const getLowStockItems = () => {
    return inventory.filter((item: any) => item.quantity <= item.reorderLevel);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-blue-500";
      case "shipped": return "bg-purple-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      return await apiRequest("POST", "/api/vendor/products", {
        name: data.name,
        description: data.description || null,
        basePrice: data.basePrice,
        category: data.category || null,
        imageUrl: data.imageUrl || null
      });
    },
    onSuccess: () => {
      toast({ title: "Product created successfully" });
      setShowCreateProduct(false);
      resetProductForm();
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/dashboard"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VendorProduct> }) => {
      return await apiRequest("PATCH", `/api/vendor/products/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Product updated successfully" });
      setShowEditProduct(false);
      setSelectedProduct(null);
      resetProductForm();
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update product", description: error.message, variant: "destructive" });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vendor/products/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Product deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/dashboard"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete product", description: error.message, variant: "destructive" });
    }
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      return await apiRequest("POST", "/api/vendor/categories", data);
    },
    onSuccess: () => {
      toast({ title: "Category created successfully" });
      setShowCreateCategory(false);
      resetCategoryForm();
      refetchCategories();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create category", description: error.message, variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      return await apiRequest("PATCH", `/api/vendor/categories/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Category updated successfully" });
      setShowEditCategory(false);
      setSelectedCategory(null);
      resetCategoryForm();
      refetchCategories();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update category", description: error.message, variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vendor/categories/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Category deleted successfully" });
      refetchCategories();
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete category", description: error.message, variant: "destructive" });
    }
  });

  // Stripe Connect mutations
  const createStripeAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/vendor/stripe-connect/create-account", {});
    },
    onSuccess: () => {
      toast({ title: "Stripe account created!", description: "Now complete the onboarding to start accepting payments." });
      refetchStripeStatus();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create Stripe account", description: error.message, variant: "destructive" });
    }
  });

  const getOnboardingLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/vendor/stripe-connect/onboarding-link", {});
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to get onboarding link", description: error.message, variant: "destructive" });
    }
  });

  const refreshStripeStatusMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/vendor/stripe-connect/refresh-status", {});
    },
    onSuccess: () => {
      toast({ title: "Stripe status refreshed" });
      refetchStripeStatus();
    },
    onError: (error: any) => {
      toast({ title: "Failed to refresh status", description: error.message, variant: "destructive" });
    }
  });

  const getDashboardLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/vendor/stripe-connect/dashboard-link", {});
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to get dashboard link", description: error.message, variant: "destructive" });
    }
  });

  // Payout request mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async (data: {
      amount: string;
      payoutMethod: string;
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankSortCode?: string;
      paypalEmail?: string;
      resellerNotes?: string;
    }) => {
      return await apiRequest("POST", "/api/reseller/payouts/request", data);
    },
    onSuccess: () => {
      toast({ 
        title: "Payout Request Submitted", 
        description: "Your payout request has been submitted and is pending admin approval." 
      });
      setShowPayoutDialog(false);
      setPayoutAmount("");
      setPayoutMethod("bank_transfer");
      setBankAccountName("");
      setBankAccountNumber("");
      setBankSortCode("");
      setPaypalEmail("");
      setPayoutNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/analytics"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Payout Request Failed", 
        description: error.message || "Failed to submit payout request", 
        variant: "destructive" 
      });
    }
  });

  const minimumPayoutAmount = parseFloat(siteSettings?.minimumPayoutAmount || '50');
  
  const handlePayoutRequest = () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (amount < minimumPayoutAmount) {
      toast({ title: "Minimum Amount Required", description: `Minimum payout amount is £${minimumPayoutAmount}`, variant: "destructive" });
      return;
    }
    if (payoutMethod === "bank_transfer") {
      if (!bankAccountName || !bankAccountNumber || !bankSortCode) {
        toast({ title: "Bank Details Required", description: "Please enter all bank account details", variant: "destructive" });
        return;
      }
    } else if (payoutMethod === "paypal") {
      if (!paypalEmail) {
        toast({ title: "PayPal Email Required", description: "Please enter your PayPal email", variant: "destructive" });
        return;
      }
    }
    requestPayoutMutation.mutate({
      amount: payoutAmount,
      payoutMethod,
      bankAccountName,
      bankAccountNumber,
      bankSortCode,
      paypalEmail,
      resellerNotes: payoutNotes
    });
  };

  // Check if vendor has EPOS PIN set
  const { data: eposStatus, refetch: refetchEposStatus } = useQuery<{ hasPinSet: boolean }>({
    queryKey: ["/api/vendor/epos/status"],
    queryFn: async () => {
      const response = await fetch("/api/vendor/epos/check-session");
      const data = await response.json();
      return { hasPinSet: data.hasPinSet !== false };
    },
    enabled: isVendor,
  });

  // EPOS PIN management mutation
  const changePinMutation = useMutation({
    mutationFn: async (data: { currentPin?: string; newPin: string }) => {
      const response = await fetch("/api/vendor/epos/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update PIN");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "EPOS PIN Updated", description: "Your EPOS PIN has been changed successfully." });
      setShowPinChange(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmNewPin("");
      setIsFirstTimePin(false);
      // Refresh status so future PIN changes require the current PIN
      refetchEposStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/epos/status"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to Update PIN", description: error.message, variant: "destructive" });
    }
  });

  const handlePinChange = () => {
    // Validate new PIN is exactly 4 digits
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast({ title: "Invalid PIN", description: "PIN must be exactly 4 digits", variant: "destructive" });
      return;
    }
    // Validate current PIN is provided and is 4 digits when changing existing PIN
    if (!isFirstTimePin && (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin))) {
      toast({ title: "Current PIN Required", description: "Please enter your current 4-digit PIN", variant: "destructive" });
      return;
    }
    if (newPin !== confirmNewPin) {
      toast({ title: "PINs Don't Match", description: "New PIN and confirmation must match", variant: "destructive" });
      return;
    }
    const weakPins = ["1234", "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1212", "0123"];
    if (weakPins.includes(newPin)) {
      toast({ title: "Weak PIN", description: "Please choose a more secure PIN", variant: "destructive" });
      return;
    }
    changePinMutation.mutate({ 
      currentPin: isFirstTimePin ? undefined : currentPin, 
      newPin 
    });
  };

  // Request reseller access mutation
  const requestResellerAccessMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/vendor/request-reseller-access", {});
    },
    onSuccess: () => {
      toast({ 
        title: "Reseller Access Requested", 
        description: "Your request has been submitted. Please wait for admin approval." 
      });
      refetchResellerAccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Request Failed", 
        description: error.message || "Failed to request reseller access", 
        variant: "destructive" 
      });
    }
  });

  const createVariantMutation = useMutation({
    mutationFn: async (data: typeof variantForm & { vendorProductId: string }) => {
      return await apiRequest("POST", `/api/vendor/products/${data.vendorProductId}/variants`, {
        size: data.size || null,
        color: data.color || null,
        sku: data.sku || null,
        price: data.price,
        stockQuantity: parseInt(data.stock)
      });
    },
    onSuccess: () => {
      toast({ title: "Variant added successfully" });
      setShowAddVariant(false);
      resetVariantForm();
      refetchVariants();
    },
    onError: (error: any) => {
      toast({ title: "Failed to add variant", description: error.message, variant: "destructive" });
    }
  });

  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VendorProductVariant> }) => {
      return await apiRequest("PATCH", `/api/vendor/products/variants/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Variant updated successfully" });
      refetchVariants();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update variant", description: error.message, variant: "destructive" });
    }
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vendor/products/variants/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Variant deleted successfully" });
      refetchVariants();
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete variant", description: error.message, variant: "destructive" });
    }
  });

  const approvePermissionMutation = useMutation({
    mutationFn: async ({ resellerId, vendorProductId }: { resellerId: string; vendorProductId: string }) => {
      return await apiRequest("POST", "/api/vendor/reseller-permissions/approve", { resellerId, vendorProductId });
    },
    onSuccess: () => {
      toast({ title: "Permission approved" });
      refetchPermissions();
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve permission", description: error.message, variant: "destructive" });
    }
  });

  const revokePermissionMutation = useMutation({
    mutationFn: async ({ resellerId, vendorProductId }: { resellerId: string; vendorProductId: string }) => {
      return await apiRequest("DELETE", "/api/vendor/reseller-permissions/revoke", { resellerId, vendorProductId });
    },
    onSuccess: () => {
      toast({ title: "Permission revoked" });
      refetchPermissions();
    },
    onError: (error: any) => {
      toast({ title: "Failed to revoke permission", description: error.message, variant: "destructive" });
    }
  });

  const resetProductForm = () => {
    setProductForm({ name: "", description: "", basePrice: "", category: "", imageUrl: "" });
    setImagePreview(null);
  };

  // Handle image file upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/vendor/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setProductForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
      toast({
        title: "Image uploaded",
        description: "Your product image has been uploaded successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const resetVariantForm = () => {
    setVariantForm({ size: "", color: "", sku: "", price: "", stock: "0" });
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", imageUrl: "" });
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        // Clear the entire query cache to ensure user state is reset
        queryClient.clear();
        toast({ title: "Logged out successfully" });
        navigate("/vendor/login");
      }
    } catch (error) {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  const openEditProduct = (product: VendorProduct) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      basePrice: product.basePrice,
      category: product.category || "",
      imageUrl: product.imageUrl || ""
    });
    setShowEditProduct(true);
  };

  const openVariants = (product: VendorProduct) => {
    setSelectedProduct(product);
    setShowVariants(true);
  };

  // Auto-redirect resellers to their dashboard (must be before any returns per React rules)
  useEffect(() => {
    if (authUser?.role === "reseller" && !authLoading) {
      navigate("/reseller/dashboard");
    }
  }, [authUser, authLoading, navigate]);
  
  // Auto-redirect wholesalers (vendors) to their simple dashboard
  // Wholesalers should NOT have access to EPOS, storefronts, or reseller features
  useEffect(() => {
    if (!capabilitiesLoading && partnerType === 'vendor' && authUser?.role === "vendor") {
      navigate("/wholesaler/dashboard");
    }
  }, [partnerType, capabilitiesLoading, authUser, navigate]);

  if (authLoading || capabilitiesLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // If reseller, show loading while redirecting
  if (authUser?.role === "reseller") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }
  
  // If vendor (wholesaler) with no reseller access, show loading while redirecting to wholesaler dashboard
  if (authUser?.role === "vendor" && !capabilitiesLoading && partnerType === 'vendor') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!authUser || authUser?.role !== "vendor") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Access denied. Please log in as a wholesaler.</p>
          <Button className="w-full mt-4" onClick={() => navigate("/b2b-login")}>
            Go to Wholesaler Login
          </Button>
        </Card>
      </div>
    );
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const lowStockVariants = variants.filter(v => v.stockQuantity < 10);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 md:px-6 py-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent" data-testid="dashboard-title">
              {dashboardData?.vendor?.businessName || "Wholesaler Dashboard"}
            </h1>
            <p className="text-zinc-400 mt-1">Manage your products and wholesale operations</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={dashboardData?.vendor?.approvalStatus === "approved" ? "default" : "outline"} className="min-h-8">
              {dashboardData?.vendor?.approvalStatus || "pending"}
            </Badge>
            {hasResellerAccess && reseller?.tier && (
              <Badge variant="secondary" className="text-base px-3 py-1 min-h-8" data-testid="tier-badge">
                {reseller.tier.charAt(0).toUpperCase() + reseller.tier.slice(1)} Tier
              </Badge>
            )}
            {hasResellerAccess && reseller?.id && (
              <NotificationCenter resellerId={reseller.id} />
            )}
            {canProcessEpos ? (
              <>
                <Link href="/wholesaler/dashboard">
                  <Button variant="default" className="min-h-11 bg-emerald-600 hover:bg-emerald-700" data-testid="button-wholesale-orders">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Wholesale Orders
                  </Button>
                </Link>
                <Link href="/vendor/epos">
                  <Button variant="default" className="min-h-11 bg-purple-600 hover:bg-purple-700" data-testid="button-epos-terminal">
                    <Zap className="h-4 w-4 mr-2" />
                    Wholesaler EPOS
                  </Button>
                </Link>
              </>
            ) : (
              <Button variant="outline" className="min-h-11 opacity-50 cursor-not-allowed" disabled data-testid="button-epos-terminal-disabled">
                <Zap className="h-4 w-4 mr-2" />
                EPOS Access Not Granted
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="min-h-11" data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="overflow-x-auto mb-8">
            <TabsList className={`inline-flex lg:grid lg:w-full ${hasResellerAccess ? "lg:grid-cols-12" : "lg:grid-cols-6"} min-h-12 w-max lg:w-full bg-zinc-900 border border-zinc-800`}>
              <TabsTrigger value="overview" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-overview">
                <BarChart3 className="w-4 h-4 mr-2 hidden sm:inline" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="products" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-products">
                <Package className="w-4 h-4 mr-2 hidden sm:inline" />
                Products
              </TabsTrigger>
              <TabsTrigger value="categories" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-categories">
                <Layers className="w-4 h-4 mr-2 hidden sm:inline" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="inventory" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-inventory">
                <Box className="w-4 h-4 mr-2 hidden sm:inline" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="1strep-products" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-1strep-products">
                <ShoppingCart className="w-4 h-4 mr-2 hidden sm:inline" />
                1stRep Products
              </TabsTrigger>
              <TabsTrigger value="settings" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-settings">
                <Settings className="w-4 h-4 mr-2 hidden sm:inline" />
                Settings
              </TabsTrigger>
              {hasResellerAccess && (
                <>
                  <TabsTrigger value="storefront" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-storefront">
                    <Store className="w-4 h-4 mr-2 hidden sm:inline" />
                    Storefront
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-orders">
                    <ShoppingCart className="w-4 h-4 mr-2 hidden sm:inline" />
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-analytics">
                    <TrendingUp className="w-4 h-4 mr-2 hidden sm:inline" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-pricing">
                    <DollarSign className="w-4 h-4 mr-2 hidden sm:inline" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="min-h-11 text-sm whitespace-nowrap data-[state=active]:bg-zinc-800" data-testid="tab-messages">
                    <MessageSquare className="w-4 h-4 mr-2 hidden sm:inline" />
                    Messages
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Catalogue Products</p>
                    <p className="text-3xl font-bold">{partnerProducts.length + products.length}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {partnerProducts.length} 1stRep • {products.length} own
                    </p>
                  </div>
                  <Package className="w-10 h-10 text-blue-500" />
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Commission Earned</p>
                    <p className="text-3xl font-bold">£{parseFloat(analyticsData?.summary?.totalEarnings || earningsData?.balance?.totalEarned || "0").toFixed(2)}</p>
                    <p className="text-xs text-zinc-500 mt-1">From storefront sales</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-500" />
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Active Resellers</p>
                    <p className="text-3xl font-bold">{dashboardData?.activeResellers || permissions.filter(p => p.isApproved).length}</p>
                  </div>
                  <Users className="w-10 h-10 text-purple-500" />
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Pending Requests</p>
                    <p className="text-3xl font-bold">{permissions.filter(p => !p.isApproved).length}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-yellow-500" />
                </div>
              </Card>
            </motion.div>

            {/* Stripe Connect Payment Setup */}
            <Card className={`border-2 ${stripeConnectStatus?.chargesEnabled ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-700/50' : 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-700/50'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stripeConnectStatus?.chargesEnabled ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                      <DollarSign className={`w-8 h-8 ${stripeConnectStatus?.chargesEnabled ? 'text-green-400' : 'text-blue-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Payment Setup
                        {stripeConnectStatus?.chargesEnabled && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </h3>
                      <p className="text-zinc-400 mt-1">
                        {stripeConnectStatus?.chargesEnabled 
                          ? "Your Stripe account is fully connected. You can receive payments for your products."
                          : stripeConnectStatus?.stripeAccountId 
                            ? "Complete your Stripe onboarding to start receiving payments."
                            : "Connect your Stripe account to receive payments for your products."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!stripeConnectStatus?.stripeAccountId && (
                      <Button 
                        onClick={() => createStripeAccountMutation.mutate()}
                        disabled={createStripeAccountMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-create-stripe-account"
                      >
                        {createStripeAccountMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Connect Stripe
                      </Button>
                    )}
                    
                    {stripeConnectStatus?.stripeAccountId && !stripeConnectStatus?.chargesEnabled && (
                      <Button 
                        onClick={() => getOnboardingLinkMutation.mutate()}
                        disabled={getOnboardingLinkMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-complete-onboarding"
                      >
                        {getOnboardingLinkMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Complete Onboarding
                      </Button>
                    )}

                    {stripeConnectStatus?.stripeAccountId && (
                      <Button 
                        variant="outline"
                        onClick={() => refreshStripeStatusMutation.mutate()}
                        disabled={refreshStripeStatusMutation.isPending}
                        data-testid="button-refresh-stripe-status"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshStripeStatusMutation.isPending ? 'animate-spin' : ''}`} />
                        Refresh Status
                      </Button>
                    )}

                    {stripeConnectStatus?.chargesEnabled && (
                      <Button 
                        variant="outline"
                        onClick={() => getDashboardLinkMutation.mutate()}
                        disabled={getDashboardLinkMutation.isPending}
                        data-testid="button-stripe-dashboard"
                      >
                        {getDashboardLinkMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <BarChart3 className="w-4 h-4 mr-2" />
                        )}
                        Stripe Dashboard
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status indicators */}
                {stripeConnectStatus?.stripeAccountId && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-700/50">
                    <div className="flex items-center gap-2 text-sm">
                      {stripeConnectStatus.chargesEnabled ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-zinc-300">
                        {stripeConnectStatus.chargesEnabled ? "Payments Enabled" : "Payments Pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {stripeConnectStatus.payoutsEnabled ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-zinc-300">
                        {stripeConnectStatus.payoutsEnabled ? "Payouts Enabled" : "Payouts Pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className={`
                        ${stripeConnectStatus.onboardingStatus === 'complete' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/50'
                          : stripeConnectStatus.onboardingStatus === 'pending_verification'
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        }
                      `}>
                        {stripeConnectStatus.onboardingStatus === 'complete' 
                          ? 'Complete'
                          : stripeConnectStatus.onboardingStatus === 'pending_verification'
                            ? 'Verifying'
                            : 'In Progress'}
                      </Badge>
                    </div>
                    {stripeConnectStatus.accountEmail && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span className="truncate">{stripeConnectStatus.accountEmail}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reseller Features Card - Show included features */}
            {hasResellerAccess && (
              <>
              <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <Store className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Reseller Access Active</h3>
                        <p className="text-zinc-400 mt-1">
                          You have full access to sell 1stRep products at wholesale prices
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 px-4 py-2">
                      <Check className="w-4 h-4 mr-2" />
                      Active
                    </Badge>
                  </div>
                  
                  {/* Features list */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-green-700/30">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Wholesale Pricing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>EPOS Terminal</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Your Own Storefront</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Stock Management</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Earnings Card */}
              <Card className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <DollarSign className="w-8 h-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Commission Earnings</h3>
                        <p className="text-zinc-400 mt-1">
                          Your earnings from selling 1stRep products
                          {reseller?.commissionRate && (
                            <span className="ml-2 text-blue-400">
                              (Commission Rate: {reseller.commissionRate}%)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Earnings Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <p className="text-sm text-zinc-400">Total Earned</p>
                      <p className="text-2xl font-bold text-green-400" data-testid="value-total-earned">
                        £{earningsData?.balance?.totalEarned?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <p className="text-sm text-zinc-400">Available Balance</p>
                      <p className="text-2xl font-bold text-blue-400" data-testid="value-available-balance">
                        £{earningsData?.balance?.availableBalance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <p className="text-sm text-zinc-400">Pending Payout</p>
                      <p className="text-2xl font-bold text-yellow-400" data-testid="value-pending-payout">
                        £{earningsData?.balance?.pendingPayout?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                      <p className="text-sm text-zinc-400">Total Paid Out</p>
                      <p className="text-2xl font-bold text-zinc-300" data-testid="value-total-paid-out">
                        £{earningsData?.balance?.totalPaidOut?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Recent Earnings */}
                  {earningsData?.recentEarnings && earningsData.recentEarnings.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-zinc-700/50">
                      <h4 className="text-sm font-semibold text-zinc-300 mb-3">Recent Earnings</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {earningsData.recentEarnings.slice(0, 5).map((earning) => (
                          <div key={earning.orderId} className="flex justify-between items-center text-sm bg-zinc-900/30 rounded px-3 py-2">
                            <span className="text-zinc-400">Order #{earning.orderNumber}</span>
                            <span className="text-green-400 font-medium">+£{parseFloat(earning.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </>
            )}

            {/* Recent Products */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
                <CardDescription>Your latest product additions</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                    {dashboardData?.vendor?.canAddOwnProducts ? (
                      <>
                        <p className="text-zinc-400">No products yet. Create your first product!</p>
                        <Button className="mt-4" onClick={() => setShowCreateProduct(true)} data-testid="button-create-first-product">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Product
                        </Button>
                      </>
                    ) : (
                      <p className="text-zinc-400">You can browse and sell 1stRep products at wholesale prices. Contact admin to enable adding your own products.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          {product.imageUrl ? (
                            <img src={convertToDirectUrl(product.imageUrl)} alt={product.name} className="w-12 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-zinc-700 flex items-center justify-center">
                              <Image className="w-6 h-6 text-zinc-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-zinc-400">£{product.basePrice}</p>
                          </div>
                        </div>
                        <Badge variant={product.isActive ? "default" : "outline"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Products</h2>
              {dashboardData?.vendor?.canAddOwnProducts && (
                <Button onClick={() => setShowCreateProduct(true)} data-testid="button-create-product">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>

            {!dashboardData?.vendor?.canAddOwnProducts && (
              <Card className="bg-amber-900/20 border-amber-700/50 p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-300 mb-1">Wholesale Account</h3>
                    <p className="text-amber-200/80 text-sm">
                      Your account is set up to sell 1stRep products at wholesale prices. To add your own products to the marketplace, please contact the admin team.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {productsLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            ) : products.length === 0 && dashboardData?.vendor?.canAddOwnProducts ? (
              <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
                <p className="text-zinc-400 mb-6">Start building your catalogue by adding your first product.</p>
                <Button onClick={() => setShowCreateProduct(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Product
                </Button>
              </Card>
            ) : products.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Own Products</h3>
                <p className="text-zinc-400 mb-6">Visit the 1stRep Products tab to browse and sell products at wholesale prices.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden h-full flex flex-col">
                      <div className="aspect-video bg-zinc-800 relative">
                        {product.imageUrl ? (
                          <img src={convertToDirectUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-12 h-12 text-zinc-600" />
                          </div>
                        )}
                        <Badge 
                          className="absolute top-2 right-2"
                          variant={product.isActive ? "default" : "outline"}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-zinc-400 text-sm line-clamp-2 mt-1 flex-1">
                          {product.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-xl font-bold">£{product.basePrice}</p>
                          {product.category && (
                            <Badge variant="outline">
                              <Tag className="w-3 h-3 mr-1" />
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => openVariants(product)}
                            data-testid={`button-variants-${product.id}`}
                          >
                            <Layers className="w-4 h-4 mr-1" />
                            Variants
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditProduct(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this product?")) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Product Categories</h2>
                <p className="text-zinc-400 mt-1">Manage categories for organizing your products</p>
              </div>
              <Button onClick={() => setShowCreateCategory(true)} data-testid="button-create-category">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Global Categories */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-500" />
                      Global Categories
                    </CardTitle>
                    <CardDescription>Standard categories available to all vendors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categories.filter(c => c.scope === 'global').length === 0 ? (
                      <p className="text-zinc-500 text-center py-4">No global categories available</p>
                    ) : (
                      <div className="space-y-3">
                        {categories.filter(c => c.scope === 'global').map((category) => (
                          <div key={category.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {category.imageUrl ? (
                                <img src={convertToDirectUrl(category.imageUrl)} alt={category.name} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                  <Layers className="w-5 h-5 text-zinc-500" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{category.name}</p>
                                <p className="text-xs text-zinc-400">{category.description || "No description"}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                              Global
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Your Custom Categories */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-500" />
                      Your Custom Categories
                    </CardTitle>
                    <CardDescription>Categories you've created for your products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categories.filter(c => c.scope === 'vendor').length === 0 ? (
                      <div className="text-center py-6">
                        <Layers className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                        <p className="text-zinc-400 mb-4">No custom categories yet</p>
                        <Button size="sm" variant="outline" onClick={() => setShowCreateCategory(true)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Create Category
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categories.filter(c => c.scope === 'vendor').map((category) => (
                          <motion.div 
                            key={category.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {category.imageUrl ? (
                                <img src={convertToDirectUrl(category.imageUrl)} alt={category.name} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                  <Layers className="w-5 h-5 text-zinc-500" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{category.name}</p>
                                <p className="text-xs text-zinc-400">{category.description || "No description"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={category.isActive ? "default" : "outline"}>
                                {category.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setCategoryForm({
                                    name: category.name,
                                    description: category.description || "",
                                    imageUrl: category.imageUrl || ""
                                  });
                                  setShowEditCategory(true);
                                }}
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this category?")) {
                                    deleteCategoryMutation.mutate(category.id);
                                  }
                                }}
                                data-testid={`button-delete-category-${category.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Inventory Management</h2>
              {hasResellerAccess && canRequestStock && (
                <Button onClick={() => setRequestStockOpen(true)} className="min-h-11" data-testid="button-request-stock">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Stock
                </Button>
              )}
              {hasResellerAccess && !canRequestStock && (
                <Badge variant="outline" className="border-amber-500 text-amber-500 px-3 py-1" data-testid="no-request-stock-access">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Stock Request Access Not Granted
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Total Products</p>
                    <p className="text-3xl font-bold">{products.length}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-500" />
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Active Products</p>
                    <p className="text-3xl font-bold">{products.filter(p => p.isActive).length}</p>
                  </div>
                  <Check className="w-10 h-10 text-green-500" />
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Inactive Products</p>
                    <p className="text-3xl font-bold">{products.filter(p => !p.isActive).length}</p>
                  </div>
                  <X className="w-10 h-10 text-red-500" />
                </div>
              </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>Click on a product to manage its variants and stock</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Box className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400">No products to manage. Create products first.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {products.map((product) => (
                      <div 
                        key={product.id} 
                        className="py-4 flex items-center justify-between hover:bg-zinc-800/30 px-4 -mx-4 cursor-pointer rounded"
                        onClick={() => openVariants(product)}
                        data-testid={`inventory-row-${product.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {product.imageUrl ? (
                            <img src={convertToDirectUrl(product.imageUrl)} alt={product.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                              <Image className="w-5 h-5 text-zinc-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-zinc-400">£{product.basePrice}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={product.isActive ? "default" : "outline"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateProductMutation.mutate({
                                id: product.id,
                                data: { isActive: !product.isActive }
                              });
                            }}
                          >
                            {product.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 1stRep Products Tab */}
          <TabsContent value="1strep-products" className="space-y-6">
            <Vendor1stRepProducts />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">Wholesaler Settings</h2>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Your wholesaler profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Business Name</Label>
                  <p className="text-lg font-medium">{dashboardData?.vendor?.businessName || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Business Description</Label>
                  <p className="text-base">{dashboardData?.vendor?.businessDescription || "No description provided"}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Account Status</Label>
                  <div className="mt-1">
                    <Badge variant={dashboardData?.vendor?.approvalStatus === "approved" ? "default" : "outline"}>
                      {dashboardData?.vendor?.approvalStatus || "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EPOS PIN Management */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-500" />
                  EPOS Terminal Security
                </CardTitle>
                <CardDescription>Manage your EPOS terminal PIN for secure access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showPinChange ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-zinc-400">
                        Your EPOS PIN is used to securely access the point-of-sale terminal.
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        First-time users: Use PIN "1234" to access EPOS, then set a new secure PIN.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowPinChange(true);
                          setIsFirstTimePin(false);
                        }}
                        data-testid="button-change-pin"
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Change PIN
                      </Button>
                      <Button 
                        variant="default"
                        onClick={() => {
                          setShowPinChange(true);
                          setIsFirstTimePin(true);
                        }}
                        data-testid="button-set-first-pin"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Set New PIN
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                      <p className="text-yellow-400 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Avoid simple PINs like 1234, 0000, or repeated digits. Your PIN should be unique and memorable.</span>
                      </p>
                    </div>
                    
                    {!isFirstTimePin && (
                      <div className="space-y-2">
                        <Label htmlFor="currentPin">Current PIN</Label>
                        <Input
                          id="currentPin"
                          type="password"
                          maxLength={4}
                          value={currentPin}
                          onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter current 4-digit PIN"
                          className="bg-zinc-800 border-zinc-700"
                          data-testid="input-current-pin"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPin">New PIN (4 digits)</Label>
                      <Input
                        id="newPin"
                        type="password"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter new 4-digit PIN"
                        className="bg-zinc-800 border-zinc-700"
                        data-testid="input-new-pin"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPin">Confirm New PIN</Label>
                      <Input
                        id="confirmNewPin"
                        type="password"
                        maxLength={4}
                        value={confirmNewPin}
                        onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="Confirm new 4-digit PIN"
                        className="bg-zinc-800 border-zinc-700"
                        data-testid="input-confirm-new-pin"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowPinChange(false);
                          setCurrentPin("");
                          setNewPin("");
                          setConfirmNewPin("");
                        }}
                        data-testid="button-cancel-pin-change"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handlePinChange}
                        disabled={changePinMutation.isPending || newPin.length !== 4 || confirmNewPin.length !== 4 || (!isFirstTimePin && currentPin.length !== 4)}
                        data-testid="button-save-pin"
                      >
                        {changePinMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Save PIN
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storefront Tab (if has reseller access) */}
          {hasResellerAccess && (
            <TabsContent value="storefront" className="space-y-6">
              {canManageStorefront ? (
                <StorefrontManagement />
              ) : (
                <Card className="bg-zinc-900 border-amber-500/50 p-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-xl font-semibold mb-2">Storefront Access Not Granted</h3>
                  <p className="text-zinc-400">
                    You don't have permission to manage your storefront. Please contact the admin to request access.
                  </p>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Orders Tab (if has reseller access) */}
          {hasResellerAccess && (
            <TabsContent value="orders" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Storefront Sales</h2>
                  <p className="text-sm md:text-base text-zinc-400 mt-1">
                    Orders placed through your reseller storefront
                  </p>
                </div>
              </div>

              {/* Order Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400">Total Orders</p>
                  <p className="text-2xl font-bold" data-testid="stats-total-orders">
                    {orderStats?.totalOrders ?? 0}
                  </p>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-500" data-testid="stats-total-revenue">
                    £{parseFloat(orderStats?.totalRevenue || "0").toFixed(2)}
                  </p>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400">Your Earnings</p>
                  <p className="text-2xl font-bold text-blue-500" data-testid="stats-total-earnings">
                    £{parseFloat(orderStats?.totalEarnings || "0").toFixed(2)}
                  </p>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400">Pending Orders</p>
                  <p className="text-2xl font-bold text-yellow-500" data-testid="stats-pending-orders">
                    {orderStats?.pendingOrders ?? 0}
                  </p>
                </Card>
              </div>

              {ordersLoading ? (
                <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
                  <p className="mt-4 text-zinc-400">Loading orders...</p>
                </Card>
              ) : customerOrders.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                  <p className="text-zinc-400">
                    Share your storefront link with customers to start receiving orders
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order: any) => (
                    <Card key={order.id} className="bg-zinc-900 border-zinc-800 p-6 hover-elevate">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <p className="font-semibold text-lg" data-testid={`order-number-${order.id}`}>
                                {order.orderNumber}
                              </p>
                              <Badge className={`${getStatusColor(order.status)} text-white`} data-testid={`order-status-${order.id}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-zinc-400">
                              <p>Customer: <span className="font-medium text-white">{order.customerName}</span></p>
                              <p>Email: {order.customerEmail}</p>
                              <p>Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                              {order.trackingNumber && (
                                <p>Tracking: <span className="font-medium">{order.trackingNumber}</span></p>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div>
                              <p className="text-sm text-zinc-400">Order Total</p>
                              <p className="text-xl font-bold" data-testid={`order-total-${order.id}`}>
                                £{parseFloat(order.totalAmount).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-zinc-400">Your Earnings</p>
                              <p className="text-lg font-semibold text-green-500" data-testid={`order-earnings-${order.id}`}>
                                £{parseFloat(order.resellerEarnings || "0").toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Analytics Tab (if has reseller access) */}
          {hasResellerAccess && (
            <TabsContent value="analytics" className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">Sales Analytics</h2>
                <p className="text-sm md:text-base text-zinc-400">
                  Track your storefront performance, commission earnings, and top-selling products
                </p>
              </div>

              {!canViewAnalytics ? (
                <Card className="bg-zinc-900 border-amber-500/50 p-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-xl font-semibold mb-2">Analytics Access Not Granted</h3>
                  <p className="text-zinc-400">
                    You don't have permission to view analytics. Please contact the admin to request access.
                  </p>
                </Card>
              ) : analyticsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              ) : analyticsData ? (
                <>
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card className="bg-zinc-900 border-zinc-800 p-4" data-testid="card-analytics-total-orders">
                      <p className="text-sm text-zinc-400">Total Orders</p>
                      <p className="text-2xl font-bold" data-testid="value-analytics-total-orders">
                        {analyticsData.summary?.totalOrders ?? 0}
                      </p>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 p-4" data-testid="card-analytics-total-revenue">
                      <p className="text-sm text-zinc-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-500" data-testid="value-analytics-total-revenue">
                        £{parseFloat(analyticsData.summary?.totalRevenue || "0").toFixed(2)}
                      </p>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 p-4" data-testid="card-analytics-total-earnings">
                      <p className="text-sm text-zinc-400">Your Earnings</p>
                      <p className="text-2xl font-bold text-blue-500" data-testid="value-analytics-total-earnings">
                        £{parseFloat(analyticsData.summary?.totalEarnings || "0").toFixed(2)}
                      </p>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 p-4" data-testid="card-analytics-avg-order">
                      <p className="text-sm text-zinc-400">Avg Order Value</p>
                      <p className="text-2xl font-bold" data-testid="value-analytics-avg-order">
                        £{parseFloat(analyticsData.summary?.averageOrderValue || "0").toFixed(2)}
                      </p>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 p-4" data-testid="card-analytics-unique-customers">
                      <p className="text-sm text-zinc-400">Unique Customers</p>
                      <p className="text-2xl font-bold" data-testid="value-analytics-unique-customers">
                        {analyticsData.summary?.uniqueCustomers ?? 0}
                      </p>
                    </Card>
                  </div>

                  {/* Commission Breakdown */}
                  <Card className="bg-zinc-900 border-zinc-800 p-6" data-testid="card-commission-breakdown">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Commission Breakdown</h3>
                      <Button
                        onClick={() => setShowPayoutDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-request-payout"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Request Payout
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-zinc-400">Total Commission</p>
                        <p className="text-xl font-bold text-green-500" data-testid="value-commission-total">
                          £{parseFloat(analyticsData.commissionBreakdown?.totalCommission || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Average Commission Rate</p>
                        <p className="text-xl font-bold" data-testid="value-commission-rate">
                          {analyticsData.commissionBreakdown?.averageCommissionRate || "0"}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Highest Commission Order</p>
                        <p className="text-xl font-bold text-blue-500" data-testid="value-highest-commission">
                          £{parseFloat(analyticsData.commissionBreakdown?.highestCommissionOrder || "0").toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-4">
                      Minimum payout: £{minimumPayoutAmount} • Bank transfer or PayPal
                    </p>
                  </Card>

                  {/* Sales Trend */}
                  {analyticsData.salesTrend && analyticsData.salesTrend.length > 0 && (
                    <Card className="bg-zinc-900 border-zinc-800 p-6" data-testid="card-sales-trend">
                      <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
                      <div className="space-y-3">
                        {analyticsData.salesTrend.map((day: any, index: number) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                            <div className="flex-1">
                              <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                              <p className="text-sm text-zinc-400">{day.orders} orders</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-500">£{parseFloat(day.revenue).toFixed(2)}</p>
                              <p className="text-sm text-blue-500">£{parseFloat(day.earnings).toFixed(2)} earned</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Top Products */}
                  {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
                    <Card className="bg-zinc-900 border-zinc-800 p-6" data-testid="card-top-products">
                      <h3 className="text-lg font-semibold mb-4">Top-Selling Products</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              <th className="text-left py-3 px-4 text-zinc-400">Product</th>
                              <th className="text-left py-3 px-4 text-zinc-400">Units Sold</th>
                              <th className="text-left py-3 px-4 text-zinc-400">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyticsData.topProducts.map((product: any, index: number) => (
                              <tr key={index} className="border-b border-zinc-800 last:border-0">
                                <td className="py-3 px-4 font-medium">{product.productName}</td>
                                <td className="py-3 px-4">{product.unitsSold}</td>
                                <td className="py-3 px-4 text-green-500">£{parseFloat(product.revenue).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                  <p className="text-zinc-400">Start selling to see your analytics</p>
                </Card>
              )}
            </TabsContent>
          )}


          {/* Pricing Tab (if has reseller access) */}
          {hasResellerAccess && (
            <TabsContent value="pricing" className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold">Pricing & Tier Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <p className="text-sm text-zinc-400">Current Tier</p>
                  <p className="text-2xl font-bold mt-1">
                    {reseller.tier ? reseller.tier.charAt(0).toUpperCase() + reseller.tier.slice(1) : "Standard"}
                  </p>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <p className="text-sm text-zinc-400">Discount Rate</p>
                  <p className="text-2xl font-bold mt-1 text-green-500">
                    {reseller.discountPercentage || 0}%
                  </p>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <p className="text-sm text-zinc-400">Credit Limit</p>
                  <p className="text-2xl font-bold mt-1">
                    £{parseFloat(reseller.creditLimit || "0").toFixed(2)}
                  </p>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-6">
                  <p className="text-sm text-zinc-400">Credit Available</p>
                  <p className="text-2xl font-bold mt-1 text-blue-500">
                    £{parseFloat(reseller.creditAvailable || "0").toFixed(2)}
                  </p>
                </Card>
              </div>

              {/* Credit Usage Progress */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Credit Usage</h3>
                    <span className="text-sm text-zinc-400">
                      £{parseFloat(reseller.currentCredit || "0").toFixed(2)} / £{parseFloat(reseller.creditLimit || "0").toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={reseller.creditLimit > 0 ? (reseller.currentCredit / reseller.creditLimit) * 100 : 0} 
                    className="w-full"
                    data-testid="credit-progress"
                  />
                </div>
              </Card>

              {/* Payment Methods */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Allowed Payment Methods</h3>
                <div className="flex flex-wrap gap-2">
                  {reseller.allowedPaymentMethods?.map((method: string) => (
                    <Badge key={method} variant="secondary" className="text-sm">
                      {method.replace(/_/g, ' ').charAt(0).toUpperCase() + method.replace(/_/g, ' ').slice(1)}
                    </Badge>
                  )) || (
                    <p className="text-zinc-400">No payment methods configured</p>
                  )}
                </div>
              </Card>
            </TabsContent>
          )}

          {/* Messages Tab (if has reseller access) */}
          {hasResellerAccess && authUser && reseller?.id && (
            <TabsContent value="messages" className="space-y-6">
              <MessagesPanel resellerId={reseller.id} currentUserId={authUser.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Request Stock Dialog */}
      {hasResellerAccess && canRequestStock && reseller?.id && (
        <RequestStockDialog 
          open={requestStockOpen} 
          onOpenChange={setRequestStockOpen}
          reseller={{
            id: reseller.id,
            businessName: reseller.businessName || "",
            tier: reseller.tier || "standard",
            discountPercentage: reseller.discountPercentage || 0,
            creditLimit: parseFloat(reseller.creditLimit || "0"),
            currentCredit: parseFloat(reseller.currentCredit || "0"),
            allowedPaymentMethods: reseller.allowedPaymentMethods
          }}
        />
      )}

      {/* Create Product Dialog */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>Add a new product to your catalogue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-product-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-product-description"
              />
            </div>
            <div>
              <Label>Base Price (£) *</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.basePrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="0.00"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-product-price"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={productForm.category}
                onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name} {cat.scope === 'vendor' ? '(Custom)' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Image</Label>
              <div className="space-y-3">
                {/* Image Preview */}
                {(imagePreview || productForm.imageUrl) && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-700">
                    <img 
                      src={imagePreview || convertToDirectUrl(productForm.imageUrl)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setProductForm(prev => ({ ...prev, imageUrl: "" }));
                      }}
                      className="absolute top-1 right-1 bg-red-600 rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-product-image-upload"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors">
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </>
                      )}
                    </span>
                  </label>
                  <span className="text-zinc-400 text-sm">or</span>
                </div>

                {/* URL Input */}
                <Input
                  value={productForm.imageUrl}
                  onChange={(e) => {
                    setProductForm(prev => ({ ...prev, imageUrl: e.target.value }));
                    setImagePreview(null);
                  }}
                  placeholder="Paste image URL..."
                  className="bg-zinc-800 border-zinc-700"
                  data-testid="input-product-image"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCreateProduct(false); resetProductForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createProductMutation.mutate(productForm)}
                disabled={!productForm.name || !productForm.basePrice || createProductMutation.isPending || uploadingImage}
                data-testid="button-save-product"
              >
                {createProductMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProduct} onOpenChange={(open) => { setShowEditProduct(open); if (!open) { setSelectedProduct(null); resetProductForm(); } }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-edit-product-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-edit-product-description"
              />
            </div>
            <div>
              <Label>Base Price (£) *</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.basePrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="0.00"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-edit-product-price"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={productForm.category}
                onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-edit-product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name} {cat.scope === 'vendor' ? '(Custom)' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Image</Label>
              <div className="space-y-3">
                {/* Image Preview */}
                {(imagePreview || productForm.imageUrl) && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-700">
                    <img 
                      src={imagePreview || convertToDirectUrl(productForm.imageUrl)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setProductForm(prev => ({ ...prev, imageUrl: "" }));
                      }}
                      className="absolute top-1 right-1 bg-red-600 rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-edit-product-image-upload"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors">
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </>
                      )}
                    </span>
                  </label>
                  <span className="text-zinc-400 text-sm">or</span>
                </div>

                {/* URL Input */}
                <Input
                  value={productForm.imageUrl}
                  onChange={(e) => {
                    setProductForm(prev => ({ ...prev, imageUrl: e.target.value }));
                    setImagePreview(null);
                  }}
                  placeholder="Paste image URL..."
                  className="bg-zinc-800 border-zinc-700"
                  data-testid="input-edit-product-image"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowEditProduct(false); setSelectedProduct(null); resetProductForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedProduct) {
                    updateProductMutation.mutate({
                      id: selectedProduct.id,
                      data: {
                        name: productForm.name,
                        description: productForm.description || null,
                        basePrice: productForm.basePrice,
                        category: productForm.category || null,
                        imageUrl: productForm.imageUrl || null
                      }
                    });
                  }
                }}
                disabled={!productForm.name || !productForm.basePrice || updateProductMutation.isPending || uploadingImage}
                data-testid="button-update-product"
              >
                {updateProductMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Update Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variants Dialog */}
      <Dialog open={showVariants} onOpenChange={(open) => { setShowVariants(open); if (!open) setSelectedProduct(null); }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Variants - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>Manage sizes, colors, and stock for this product</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Variants ({variants.length})</h4>
              <Button size="sm" onClick={() => setShowAddVariant(true)} data-testid="button-add-variant">
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-8 border border-zinc-800 rounded-lg">
                <Layers className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                <p className="text-zinc-400">No variants yet. Add sizes and colors for this product.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {variant.size && `Size: ${variant.size}`}
                          {variant.size && variant.color && " / "}
                          {variant.color && `Colour: ${variant.color}`}
                          {!variant.size && !variant.color && "Default Variant"}
                        </p>
                        <p className="text-sm text-zinc-400">
                          SKU: {variant.sku || "N/A"} | £{variant.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-medium ${variant.stockQuantity < 10 ? 'text-yellow-500' : ''}`}>
                          {variant.stockQuantity} in stock
                        </p>
                        <Badge variant={variant.isActive ? "default" : "outline"} className="text-xs">
                          {variant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateVariantMutation.mutate({
                            id: variant.id,
                            data: { isActive: !variant.isActive }
                          })}
                        >
                          {variant.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this variant?")) {
                              deleteVariantMutation.mutate(variant.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Variant Dialog */}
      <Dialog open={showAddVariant} onOpenChange={setShowAddVariant}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Add Variant</DialogTitle>
            <DialogDescription>Add a new size/colour variant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Size</Label>
              <Select
                value={variantForm.size}
                onValueChange={(value) => setVariantForm(prev => ({ ...prev, size: value }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-variant-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                  <SelectItem value="3XL">3XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Colour</Label>
              <Input
                value={variantForm.color}
                onChange={(e) => setVariantForm(prev => ({ ...prev, color: e.target.value }))}
                placeholder="e.g., Black, Navy Blue"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-variant-colour"
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={variantForm.sku}
                onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g., PROD-001-BLK-M"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-variant-sku"
              />
            </div>
            <div>
              <Label>Price (£) *</Label>
              <Input
                type="number"
                step="0.01"
                value={variantForm.price}
                onChange={(e) => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-variant-price"
              />
            </div>
            <div>
              <Label>Initial Stock *</Label>
              <Input
                type="number"
                value={variantForm.stock}
                onChange={(e) => setVariantForm(prev => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-variant-stock"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowAddVariant(false); resetVariantForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedProduct) {
                    createVariantMutation.mutate({
                      ...variantForm,
                      vendorProductId: selectedProduct.id
                    });
                  }
                }}
                disabled={!variantForm.price || createVariantMutation.isPending}
                data-testid="button-save-variant"
              >
                {createVariantMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Variant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a custom category for organizing your products</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Performance Wear"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-category-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-category-description"
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={categoryForm.imageUrl}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/category-image.jpg"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-category-image"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCreateCategory(false); resetCategoryForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createCategoryMutation.mutate(categoryForm)}
                disabled={!categoryForm.name || createCategoryMutation.isPending}
                data-testid="button-save-category"
              >
                {createCategoryMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategory} onOpenChange={(open) => { setShowEditCategory(open); if (!open) { setSelectedCategory(null); resetCategoryForm(); } }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Performance Wear"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-edit-category-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-edit-category-description"
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={categoryForm.imageUrl}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/category-image.jpg"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-edit-category-image"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowEditCategory(false); setSelectedCategory(null); resetCategoryForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedCategory) {
                    updateCategoryMutation.mutate({
                      id: selectedCategory.id,
                      data: {
                        name: categoryForm.name,
                        description: categoryForm.description || null,
                        imageUrl: categoryForm.imageUrl || null
                      }
                    });
                  }
                }}
                disabled={!categoryForm.name || updateCategoryMutation.isPending}
                data-testid="button-update-category"
              >
                {updateCategoryMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Update Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-500" />
              Request Payout
            </DialogTitle>
            <DialogDescription>
              Request a payout of your earned commission. Minimum amount: £{minimumPayoutAmount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (£) *</Label>
              <Input
                type="number"
                min={minimumPayoutAmount}
                step="0.01"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder={minimumPayoutAmount.toFixed(2)}
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-payout-amount"
              />
              <p className="text-xs text-zinc-500 mt-1">Minimum payout: £{minimumPayoutAmount}</p>
            </div>
            
            <div>
              <Label>Payment Method *</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-payout-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payoutMethod === "bank_transfer" && (
              <>
                <div>
                  <Label>Account Holder Name *</Label>
                  <Input
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-zinc-800 border-zinc-700"
                    data-testid="input-bank-name"
                  />
                </div>
                <div>
                  <Label>Account Number *</Label>
                  <Input
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="12345678"
                    className="bg-zinc-800 border-zinc-700"
                    data-testid="input-bank-number"
                  />
                </div>
                <div>
                  <Label>Sort Code *</Label>
                  <Input
                    value={bankSortCode}
                    onChange={(e) => setBankSortCode(e.target.value)}
                    placeholder="12-34-56"
                    className="bg-zinc-800 border-zinc-700"
                    data-testid="input-bank-sort-code"
                  />
                </div>
              </>
            )}

            {payoutMethod === "paypal" && (
              <div>
                <Label>PayPal Email *</Label>
                <Input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-zinc-800 border-zinc-700"
                  data-testid="input-paypal-email"
                />
              </div>
            )}

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Any additional notes for this payout request"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-payout-notes"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayoutRequest}
                disabled={requestPayoutMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-submit-payout"
              >
                {requestPayoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4 mr-2" />
                )}
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
