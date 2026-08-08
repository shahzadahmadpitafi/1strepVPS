import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Loader2, MapPin, AlertCircle, ArrowLeft, Truck, Wifi, WifiOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useOnScreenKeyboard } from "@/hooks/useOnScreenKeyboard";
import OnScreenKeyboard from "@/components/epos/OnScreenKeyboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, Check, X, 
  CreditCard, Banknote, Store, ChevronRight, ChevronLeft, Sparkles,
  ShoppingBag, Tag, Filter, Grid3X3, LayoutGrid, Printer, Download, Mail, CheckCircle, ZoomIn,
  Clock, Lock, Package, User, Award, ScanLine, Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSocket, type InventoryUpdateEvent } from "@/hooks/useSocket";
import { formatCurrency, sortSizes } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SquareCardReader from "@/components/SquareCardReader";
import QRPayment from "@/components/epos/QRPayment";
import { SiApplepay, SiGooglepay } from "react-icons/si";

// Validation helpers (matching website checkout)
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

const validateAddress = (address: string): boolean => {
  return address.trim().length >= 5;
};

const validateCity = (city: string): boolean => {
  return city.trim().length >= 2;
};

const validatePostalCode = (postalCode: string): boolean => {
  const ukPostalRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return ukPostalRegex.test(postalCode.trim()) || postalCode.trim().length >= 3;
};

const validatePhone = (phone: string): boolean => {
  // UK phone validation (accepts mobiles and landlines)
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned) return false;
  // UK formats: 07XXX, 01XXX, 02XXX, 03XXX, +44
  const ukPhoneRegex = /^(\+44|0044)?0?[1-37]\d{8,9}$/;
  return ukPhoneRegex.test(cleaned);
};

// Get display category from product - prefer actual category field over name-based inference
const getProductCategory = (product: { name: string; category?: string }): string => {
  // Use actual category from database if available
  if (product.category && product.category.trim()) {
    return product.category;
  }
  
  // Fallback to name-based inference only if no category set
  const lowerName = product.name.toLowerCase();
  if (lowerName.includes('hoodie') || lowerName.includes('jumper')) return 'Hoodies and Jumpers';
  if (lowerName.includes('t-shirt') || lowerName.includes('tshirt')) return 'T-Shirts';
  if (lowerName.includes('sports bra') || lowerName.includes('bra')) return 'Sports Bras';
  if (lowerName.includes('legging')) return 'Leggings';
  if (lowerName.includes('tank')) return 'Tanks';
  if (lowerName.includes('jacket')) return 'Jackets';
  if (lowerName.includes('shorts')) return 'Shorts';
  if (lowerName.includes('hat') || lowerName.includes('cap')) return 'Accessories';
  return 'General';
};

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23374151" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="system-ui" font-size="14"%3EImage unavailable%3C/text%3E%3C/svg%3E';

function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_IMAGE) {
    img.src = FALLBACK_IMAGE;
  }
}

interface Product {
  id: string;
  name: string;
  sku: string;
  retailPrice: string;
  category: string;
  gender?: 'men' | 'women' | 'unisex';
  collections?: string[];
  sizes: string[];
  colors: string[];
  imageUrl?: string;
  hoverImageUrl?: string;
  heroImageUrl?: string;
  description?: string;
  detailedDescription?: string;
  features?: string[];
  materials?: string;
  careInstructions?: string;
  modelInfo?: string;
  displayColor?: string | null;
  displayName?: string;
  colorImages?: Record<string, string>;
  colorHoverImages?: Record<string, string>;
  colorAdditionalImages?: Record<string, string[]>;
  additionalImages?: string[];
}

interface CartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: string;
  imageUrl?: string;
}

interface ReceiptData {
  orderNumber: string;
  timestamp: string;
  items: {
    name: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  customerEmail: string;
}

interface StoreLocation {
  id: string;
  businessName: string;
  businessAddress: string;
  phoneNumber?: string;
  storefrontSlug?: string | null;
}

export default function CustomerEOPS() {
  const { toast } = useToast();
  useWakeLock();
  const { activeInputId, closeKeyboard, containerRef: oskContainerRef } = useOnScreenKeyboard();
  
  // Real-time inventory updates via WebSocket
  const handleInventoryUpdate = useCallback((event: InventoryUpdateEvent) => {
    // Invalidate product queries to refresh stock levels
    queryClient.invalidateQueries({ queryKey: ['/api/products/by-color'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    
    // Show toast notification for low stock alerts
    if (event.newQuantity <= 5 && event.type === 'purchase') {
      toast({
        title: "Low Stock Alert",
        description: `${event.productName} ${event.size ? `(${event.size})` : ''} now has only ${event.newQuantity} remaining`,
        variant: "destructive"
      });
    }
  }, [toast]);
  
  const { isConnected } = useSocket({
    room: 'epos',
    onInventoryUpdate: handleInventoryUpdate
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "large">("large");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [checkoutTimeRemaining, setCheckoutTimeRemaining] = useState(300);
  const [modalImageUrl, setModalImageUrl] = useState<string>("");
  const [colorImagesMap, setColorImagesMap] = useState<Record<string, string>>({});
  
  // Delivery information state (matching website checkout)
  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "UK"
  });
  
  // Coupon code state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ valid: boolean; discountAmount?: number; error?: string; coupon?: any } | null>(null);
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Delivery method state (home delivery or in-store collection)
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "collection">("delivery");
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  
  // Enhanced modal state for zoom and gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 });
  const [showLens, setShowLens] = useState(false);
  const [viewerZoomed, setViewerZoomed] = useState(false);
  const [viewerPosition, setViewerPosition] = useState({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fullProductData, setFullProductData] = useState<Product | null>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingClickPosition = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  
  // Stock availability state
  interface ProductVariant {
    id: string;
    productId: string;
    size: string;
    color: string;
    stock: number;
    sku?: string;
  }
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);

  // Stripe payment state (matching website checkout)
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoadingPaymentIntent, setIsLoadingPaymentIntent] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [intentAmount, setIntentAmount] = useState<number | null>(null);
  
  // Payment method type: manual_entry for typed card details, qr_pay for QR code
  const [paymentMethodType, setPaymentMethodType] = useState<"card_reader" | "manual_entry" | "qr_pay">("qr_pay");
  
  // Loyalty card scanning state
  interface LoyaltyMember {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tier: string;
    currentPoints: number;
    lifetimePoints: number;
  }
  const [showMemberScan, setShowMemberScan] = useState(false);
  const [memberScanInput, setMemberScanInput] = useState("");
  const [memberSearching, setMemberSearching] = useState(false);
  const [linkedMember, setLinkedMember] = useState<LoyaltyMember | null>(null);
  const memberInputRef = useRef<HTMLInputElement>(null);

  // Calculate cart total early for use in payment intent creation
  const cartTotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0),
    [cartItems]
  );

  // Validation errors computed from delivery form state
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!validateName(customerInfo.firstName)) {
      errors.firstName = "First name must be at least 2 characters";
    }
    if (!validateName(customerInfo.lastName)) {
      errors.lastName = "Last name must be at least 2 characters";
    }
    if (!validateEmail(customerInfo.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!validatePhone(customerInfo.phone)) {
      errors.phone = "Please enter a valid UK phone number";
    }
    // Only validate address fields for home delivery, not for collection
    if (deliveryMethod === "delivery") {
      if (!validateAddress(customerInfo.address)) {
        errors.address = "Please enter your full address";
      }
      if (!validateCity(customerInfo.city)) {
        errors.city = "Please enter your city";
      }
      if (!validatePostalCode(customerInfo.postalCode)) {
        errors.postalCode = "Please enter a valid postal code";
      }
    }
    return errors;
  }, [customerInfo, deliveryMethod]);

  // For collection, also need to validate store selection
  const isDeliveryFormValid = deliveryMethod === "collection" 
    ? (Object.keys(validationErrors).length === 0 && selectedStore !== null)
    : Object.keys(validationErrors).length === 0;

  // Mark a field as touched when user leaves it
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  // Lookup postal code to get city and address suggestions (using server-side proxy)
  const lookupPostalCode = async (postalCode: string) => {
    const cleaned = postalCode.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!validatePostalCode(cleaned)) return;
    
    setIsLookingUpPostcode(true);
    try {
      // Use server-side proxy to avoid CORS issues
      const response = await fetch(`/api/postcode-lookup/${encodeURIComponent(cleaned.replace(/\s/g, ''))}`);
      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        const result = data.result;
        const city = result.admin_district || result.admin_county || result.region || '';
        if (city) {
          setCustomerInfo(prev => ({ ...prev, city }));
        }
        
        const suggestions: string[] = [];
        const parish = result.parish || '';
        const ward = result.admin_ward || '';
        const locality = result.admin_district || '';
        
        if (ward && locality) {
          suggestions.push(`${ward}, ${locality}`);
        }
        if (parish && parish !== ward) {
          suggestions.push(`${parish}, ${locality || city}`);
        }
        if (result.nuts && result.nuts !== locality) {
          suggestions.push(`${result.nuts}`);
        }
        
        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('Postal code lookup failed:', error);
    } finally {
      setIsLookingUpPostcode(false);
    }
  };

  const handlePostalCodeChange = (value: string) => {
    setCustomerInfo(prev => ({ ...prev, postalCode: value }));
    setShowAddressSuggestions(false);
  };

  const handlePostalCodeBlur = () => {
    handleFieldBlur('postalCode');
    if (customerInfo.postalCode.trim().length >= 5) {
      lookupPostalCode(customerInfo.postalCode);
    }
  };

  const selectAddressSuggestion = (suggestion: string) => {
    setCustomerInfo(prev => ({ ...prev, address: suggestion }));
    setShowAddressSuggestions(false);
  };

  // Member card scanning - lookup customer by email/ID
  const handleMemberScan = async (input: string) => {
    if (!input.trim()) return;
    
    setMemberSearching(true);
    try {
      const response = await fetch(`/api/epos/member-lookup?query=${encodeURIComponent(input.trim())}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.member) {
          setLinkedMember(data.member);
          setCustomerInfo(prev => ({
            ...prev,
            email: data.member.email,
            firstName: data.member.firstName || prev.firstName,
            lastName: data.member.lastName || prev.lastName,
          }));
          toast({
            title: "Member Found!",
            description: `${data.member.firstName} ${data.member.lastName} - ${data.member.tier} tier with ${data.member.currentPoints} points`,
          });
          setShowMemberScan(false);
          setMemberScanInput("");
        } else {
          toast({
            title: "Member Not Found",
            description: "No loyalty member found with that email or ID",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Lookup Failed",
          description: "Could not search for member",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Member lookup error:", error);
      toast({
        title: "Error",
        description: "Failed to look up member",
        variant: "destructive"
      });
    } finally {
      setMemberSearching(false);
    }
  };

  // Handle card scanner input (keyboard wedge mode)
  const handleMemberInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMemberScan(memberScanInput);
    }
  };

  // Clear linked member
  const clearLinkedMember = () => {
    setLinkedMember(null);
  };

  // Handle URL params for payment redirect success (Square/QR Pay)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const orderNumber = urlParams.get("order");
    
    if (success === "true" && orderNumber) {
      // This is a QR Pay or legacy redirect success - show receipt directly
      const storedItems = sessionStorage.getItem("eposCartItems");
      const storedEmail = sessionStorage.getItem("eposCustomerEmail");
      let items: ReceiptData["items"] = [];
      let subtotal = 0;
      
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        items = parsedItems.map((item: CartItem) => ({
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
        }));
        subtotal = parsedItems.reduce(
          (sum: number, item: CartItem) => sum + parseFloat(item.unitPrice) * item.quantity,
          0
        );
        sessionStorage.removeItem("eposCartItems");
        sessionStorage.removeItem("eposCustomerEmail");
      }
      
      setReceiptData({
        orderNumber,
        timestamp: new Date().toLocaleString("en-GB"),
        items,
        subtotal,
        total: subtotal,
        paymentMethod: "Card (Square)",
        customerEmail: storedEmail || "",
      });
      setShowReceipt(true);
      window.history.replaceState({}, "", window.location.pathname);
      
      toast({
        title: "Payment Successful!",
        description: `Order ${orderNumber} has been confirmed`,
      });
    }
  }, []);

  // Fetch products expanded by color - each color variant appears as separate product card
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/by-color"],
  });

  // Fetch stores for in-store collection
  const { data: storeLocations = [] } = useQuery<StoreLocation[]>({
    queryKey: ['/api/store-locator/resellers'],
  });

  // Fetch site settings for in-store collection
  const { data: siteSettings } = useQuery<{
    inStoreCollectionEnabled?: boolean;
  }>({
    queryKey: ['/api/site-settings'],
  });

  // Fetch category sales data for sorting categories by sales performance
  const { data: categorySalesData = [] } = useQuery<{ category: string; totalSales: number }[]>({
    queryKey: ["/api/category-sales"],
  });

  // Fetch product sections to use their displayOrder for sorting
  const { data: productSections = [] } = useQuery<{ id: string; name: string; slug: string; displayOrder: number; isActive: boolean }[]>({
    queryKey: ["/api/product-sections"],
  });

  // Fetch reseller profile for phone number and coupon code display
  interface ResellerProfile {
    id: string;
    businessName: string;
    contactPerson: string;
    phoneNumber: string;
    businessAddress: string;
    tier: string;
    discountPercentage: string;
    couponCode: string | null;
  }
  
  const { data: resellerProfile } = useQuery<ResellerProfile>({
    queryKey: ["/api/reseller/epos/profile"],
  });

  // Track stock per product-color combination for accurate out-of-stock indicators
  const [productColorStockMap, setProductColorStockMap] = useState<Record<string, number>>({});
  
  // Fetch stock totals for all products, grouped by color
  useEffect(() => {
    const fetchProductStock = async () => {
      if (products.length === 0) return;
      
      // Get unique product IDs
      const uniqueProductIds = Array.from(new Set(products.map(p => p.id)));
      
      const stockTotals: Record<string, number> = {};
      
      // Fetch variants for each unique product
      await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const response = await fetch(`/api/products/${productId}/variants`);
            if (response.ok) {
              const variants = await response.json();
              
              // Group stock by color for color-specific cards
              const colorStocks: Record<string, number> = {};
              variants.forEach((v: { color?: string; stock: number }) => {
                const colorKey = (v.color || '').toLowerCase().trim();
                colorStocks[colorKey] = (colorStocks[colorKey] || 0) + (v.stock || 0);
              });
              
              // Store color-specific stock
              Object.entries(colorStocks).forEach(([color, stock]) => {
                stockTotals[`${productId}|${color}`] = stock;
              });
              
              // Also store total product stock
              const totalStock = variants.reduce((sum: number, v: { stock: number }) => sum + (v.stock || 0), 0);
              stockTotals[productId] = totalStock;
            }
          } catch (error) {
            console.log(`Could not fetch stock for product ${productId}`);
          }
        })
      );
      
      setProductColorStockMap(stockTotals);
    };
    
    fetchProductStock();
  }, [products]);

  // Helper to check if a product (or specific color) is out of stock
  const isProductOutOfStock = (productId: string, displayColor?: string | null): boolean => {
    // If we haven't loaded stock info yet, assume in stock
    if (Object.keys(productColorStockMap).length === 0) return false;
    
    // If displayColor is provided, check color-specific stock
    if (displayColor) {
      const colorKey = `${productId}|${displayColor.toLowerCase().trim()}`;
      return (productColorStockMap[colorKey] || 0) === 0;
    }
    
    // Fallback to total product stock
    return (productColorStockMap[productId] || 0) === 0;
  };

  // Checkout timeout - 5 minute limit (matching main website checkout)
  useEffect(() => {
    if (showCheckout) {
      setCheckoutTimeRemaining(300);
      const interval = setInterval(() => {
        setCheckoutTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowCheckout(false);
            toast({
              title: "Checkout Timed Out",
              description: "The checkout session has expired. Please try again.",
              variant: "destructive",
            });
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showCheckout, toast]);

  // Reset zoom/lens state when modal closes
  useEffect(() => {
    if (!showProductModal) {
      setShowLens(false);
      setLensPosition({ x: 50, y: 50 });
    }
  }, [showProductModal]);

  // Define clean customer-friendly categories matching main theme
  const displayCategories = [
    { key: "all", label: "All Products" },
    { key: "women", label: "Women" },
    { key: "men", label: "Men" },
    { key: "accessories", label: "Accessories" },
    { key: "active", label: "Active Range" },
    { key: "1r", label: "1R Collection" },
    { key: "new", label: "New Arrivals" },
  ];

  // Category matching logic for filtering
  const categoryMatches = (product: Product, filterKey: string): boolean => {
    if (filterKey === "all") return true;
    const cat = product.category?.toLowerCase() || "";
    const gender = product.gender?.toLowerCase() || "";
    const collections = product.collections || [];
    
    switch (filterKey) {
      case "women":
        // Show products that are specifically for women OR unisex
        return gender === "women" || gender === "unisex";
      case "men":
        // Show products that are specifically for men OR unisex
        return gender === "men" || gender === "unisex";
      case "accessories":
        return cat.includes("accessor") || cat.includes("bag") || cat.includes("hat") || cat.includes("cap");
      case "active":
        // Check if product is in Active Range collection
        return collections.some(c => c.toLowerCase().includes("active"));
      case "1r":
        // Check if product is in 1R Collection
        return collections.some(c => c.toLowerCase().includes("1r") || c.toLowerCase().includes("1st rep") || c.toLowerCase().includes("firstep"));
      case "new":
        // Check if product is in New Arrivals collection or has "new" in category
        return collections.some(c => c.toLowerCase().includes("new")) || cat.includes("new") || cat.includes("arrival");
      default:
        return cat.includes(filterKey.toLowerCase());
    }
  };

  // Filter products - keep out of stock visible, but exclude deleted/inactive products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryMatches(p, selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Group products by their actual category and sort by product section displayOrder
  const productsByCategory = useMemo(() => {
    const categoryMap: Record<string, typeof filteredProducts> = {};
    
    filteredProducts.forEach(product => {
      const productCategory = getProductCategory(product);
      if (!categoryMap[productCategory]) {
        categoryMap[productCategory] = [];
      }
      categoryMap[productCategory].push(product);
    });

    // Create displayOrder ranking from product sections
    const sectionOrderMap: Record<string, number> = {};
    productSections.forEach((section, index) => {
      // Match section name to category (case-insensitive)
      sectionOrderMap[section.name.toLowerCase()] = section.displayOrder;
    });

    // Sort categories by section displayOrder (ascending), then alphabetically for unmatched
    const sortedCategories = Object.keys(categoryMap).sort((a, b) => {
      const orderA = sectionOrderMap[a.toLowerCase()] ?? 999;
      const orderB = sectionOrderMap[b.toLowerCase()] ?? 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // For categories with same or no displayOrder, sort alphabetically
      return a.localeCompare(b);
    });

    return sortedCategories.map(category => ({
      category,
      products: categoryMap[category]
    }));
  }, [filteredProducts, productSections]);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cart/items", {
        productId: selectedProduct!.id,
        size: selectedSize,
        color: selectedColor,
        quantity: selectedQuantity,
      });
      return response.json();
    },
    onSuccess: () => {
      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        productId: selectedProduct!.id,
        sku: selectedProduct!.sku,
        name: selectedProduct!.name,
        size: selectedSize,
        color: selectedColor,
        quantity: selectedQuantity,
        unitPrice: selectedProduct!.retailPrice,
        imageUrl: selectedProduct!.imageUrl,
      };
      setCartItems(prev => [...prev, newItem]);
      
      toast({
        title: "Added to cart!",
        description: `${selectedProduct?.name} x${selectedQuantity}`,
      });
      
      resetSelection();
      setShowProductModal(false);
      currentLoadingProductId.current = null; // Clear to prevent stale responses
      setCartOpen(true);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  // Complete purchase mutation with delivery information
  const completePurchaseMutation = useMutation({
    mutationFn: async () => {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
        0
      );

      const response = await apiRequest("POST", "/api/epos/complete-purchase", {
        items: cartItems,
        customerEmail: customerInfo.email,
        paymentMethod: "card",
        totalAmount,
        channel: 'customer_epos',
        deliveryMethod,
        collectionStoreId: deliveryMethod === 'collection' ? selectedStore?.id : undefined,
        collectionStoreName: deliveryMethod === 'collection' ? selectedStore?.businessName : undefined,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone || undefined,
          address: deliveryMethod === 'delivery' ? customerInfo.address : undefined,
          city: deliveryMethod === 'delivery' ? customerInfo.city : undefined,
          postalCode: deliveryMethod === 'delivery' ? customerInfo.postalCode : undefined,
          country: deliveryMethod === 'delivery' ? customerInfo.country : undefined,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        sessionStorage.setItem("eposCartItems", JSON.stringify(cartItems));
        sessionStorage.setItem("eposCustomerEmail", customerInfo.email);
        window.location.href = data.checkoutUrl;
      } else {
        const subtotal = cartItems.reduce(
          (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
          0
        );
        
        setReceiptData({
          orderNumber: data.orderNumber,
          timestamp: new Date().toLocaleString("en-GB"),
          items: cartItems.map(item => ({
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
          })),
          subtotal,
          total: subtotal,
          paymentMethod: "Card",
          customerEmail: customerInfo.email,
        });
        
        setShowReceipt(true);
        setCartItems([]);
        setShowCheckout(false);
        setCustomerInfo({
          email: "",
          firstName: "",
          lastName: "",
          phone: "",
          address: "",
          city: "",
          postalCode: "",
          country: "UK"
        });
        setTouchedFields({});
        setCouponCode("");
        setAppliedCoupon(null);
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete purchase",
        variant: "destructive",
      });
    },
  });

  // Coupon validation mutation
  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/coupons/validate", { 
        code, 
        subtotal: cartTotal 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setAppliedCoupon(data);
        toast({
          title: "Coupon applied!",
          description: `Coupon "${couponCode}" has been applied to your order.`,
        });
      } else {
        toast({
          title: "Invalid coupon",
          description: data.error || "This coupon code is not valid.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to validate coupon. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter coupon code",
        description: "Please enter a coupon code to apply.",
        variant: "destructive",
      });
      return;
    }
    validateCouponMutation.mutate(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order.",
    });
  };

  // Calculate discount and final total
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const finalTotal = cartTotal - discountAmount;

  // Create PaymentIntent for embedded card form
  // SECURITY: Sends items to server which calculates amount from authoritative database prices
  const createPaymentIntent = async () => {
    if (isLoadingPaymentIntent) return;
    if (cartItems.length === 0) return;
    
    setIsLoadingPaymentIntent(true);
    
    try {
      // Send items to server - server will look up authoritative prices from database
      // Include coupon code if one is applied
      const response = await apiRequest("POST", "/api/payments/create-intent", {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        currency: 'gbp',
        couponCode: appliedCoupon?.coupon?.code || undefined,
        shippingCost: 0, // EPOS is always free shipping
        deliveryMethod: 'collection',
        metadata: { source: 'epos' }
      });
      
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        // Use server-calculated amount (authoritative)
        setIntentAmount(data.serverCalculatedAmount || cartTotal);
      } else {
        throw new Error('No client secret received');
      }
    } catch (error: any) {
      console.error('Failed to create payment intent:', error);
      toast({
        title: "Payment setup failed",
        description: "Please try again or refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPaymentIntent(false);
    }
  };

  // Track cart signature to detect changes
  const [lastCartSignature, setLastCartSignature] = useState<string>("");
  
  // Auto-load PaymentIntent when checkout opens, cart changes, or coupon changes
  // SECURITY: Regenerates intent when cart items or coupon change to ensure amount matches
  useEffect(() => {
    if (showCheckout && cartItems.length > 0) {
      // Create a signature of current cart state including applied coupon
      const currentCartSignature = JSON.stringify({
        items: cartItems.map(i => ({ id: i.productId, qty: i.quantity, size: i.size, color: i.color }))
          .sort((a, b) => a.id.localeCompare(b.id)),
        coupon: appliedCoupon?.coupon?.code || null
      });
      
      // Regenerate payment intent if cart has changed or no intent exists
      const cartHasChanged = currentCartSignature !== lastCartSignature;
      const needsNewIntent = !clientSecret || !paymentIntentId || cartHasChanged;
      
      if (needsNewIntent) {
        console.log('Regenerating PaymentIntent - cart/coupon changed or no intent exists');
        setClientSecret(null);
        setPaymentIntentId(null);
        setLastCartSignature(currentCartSignature);
        createPaymentIntent();
      }
    }
  }, [showCheckout, cartItems, appliedCoupon]);

  // Handle successful card payment (for both Stripe and Square)
  const handleCardPaymentSuccess = async (intentId: string, isSquare: boolean = false) => {
    try {
      const isDelivery = deliveryMethod === 'delivery';
      const orderData = {
        items: cartItems,
        customerEmail: customerInfo.email,
        paymentMethod: isSquare ? "square_checkout" : "card_embedded",
        totalAmount: cartTotal,
        channel: 'customer_epos',
        paymentIntentId: intentId,
        couponCode: appliedCoupon?.coupon?.code || undefined,
        shippingCost: 0, // EPOS is always free shipping
        deliveryMethod,
        collectionStoreId: !isDelivery ? selectedStore?.id : undefined,
        collectionStoreName: !isDelivery ? selectedStore?.businessName : undefined,
        customerInfo: {
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim(),
          address: isDelivery ? customerInfo.address.trim() : undefined,
          city: isDelivery ? customerInfo.city.trim() : undefined,
          postalCode: isDelivery ? customerInfo.postalCode.trim() : undefined,
          country: isDelivery ? customerInfo.country : undefined,
        },
      };

      const response = await apiRequest("POST", "/api/epos/complete-purchase", orderData);
      const data = await response.json();
      
      setReceiptData({
        orderNumber: data.orderNumber,
        timestamp: new Date().toLocaleString("en-GB"),
        items: cartItems.map(item => ({
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
        })),
        subtotal: cartTotal,
        total: cartTotal,
        paymentMethod: "Card",
        customerEmail: customerInfo.email,
      });
      
      setShowReceipt(true);
      setCartItems([]);
      setShowCheckout(false);
      setClientSecret(null);
      setPaymentIntentId(null);
      setCustomerInfo({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        country: "UK"
      });
      setTouchedFields({});
      setIsPaymentProcessing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast({
        title: "Order creation failed",
        description: error?.message || "Payment was successful but order creation failed. Please contact support.",
        variant: "destructive",
      });
      setIsPaymentProcessing(false);
    }
  };

  // Handle card payment error
  const handleCardPaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
    setIsPaymentProcessing(false);
  };

  // Handle Square hosted checkout redirect
  const handleSquareCheckout = async () => {
    if (!isDeliveryFormValid || cartItems.length === 0) {
      handleFormInvalid();
      return;
    }

    setIsPaymentProcessing(true);

    try {
      // Store customer data and cart for retrieval after Square redirect
      const isDeliveryOrder = deliveryMethod === 'delivery';
      const orderData = {
        items: cartItems,
        customerEmail: customerInfo.email,
        deliveryMethod,
        collectionStoreId: !isDeliveryOrder ? selectedStore?.id : undefined,
        collectionStoreName: !isDeliveryOrder ? selectedStore?.businessName : undefined,
        customerInfo: {
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim(),
          address: isDeliveryOrder ? customerInfo.address.trim() : undefined,
          city: isDeliveryOrder ? customerInfo.city.trim() : undefined,
          postalCode: isDeliveryOrder ? customerInfo.postalCode.trim() : undefined,
          country: isDeliveryOrder ? customerInfo.country : undefined,
        },
        couponCode: appliedCoupon?.coupon?.code || null,
        linkedMemberId: linkedMember?.id || null,
      };
      sessionStorage.setItem('customerEposOrderData', JSON.stringify(orderData));

      // Create Square checkout
      const response = await apiRequest("POST", "/api/square/create-epos-checkout", {
        amount: cartTotal,
        currency: 'GBP',
        orderType: 'customer_epos',
        lineItems: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          color: item.color,
        })),
        customerEmail: customerInfo.email,
        redirectUrl: `${window.location.origin}/customer/epos?payment=success`,
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Store Square order ID and payment link ID for verification
        sessionStorage.setItem('customerEposSquareOrderId', data.orderId || '');
        sessionStorage.setItem('customerEposPaymentLinkId', data.paymentLinkId || '');
        sessionStorage.setItem('customerEposReferenceId', data.referenceId || '');
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error: any) {
      console.error('Square checkout error:', error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setIsPaymentProcessing(false);
    }
  };

  // Handle return from Square checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const transactionId = urlParams.get('transactionId');
    
    if (paymentStatus === 'success') {
      const storedOrderData = sessionStorage.getItem('customerEposOrderData');
      const squareOrderId = sessionStorage.getItem('customerEposSquareOrderId');
      const referenceId = sessionStorage.getItem('customerEposReferenceId');
      
      if (storedOrderData && squareOrderId) {
        const orderData = JSON.parse(storedOrderData);
        
        // Verify Square payment first, then complete order
        apiRequest("POST", "/api/square/verify-payment", {
          orderId: squareOrderId,
          referenceId: referenceId,
        }).then(async (verifyResponse) => {
          const verifyData = await verifyResponse.json();
          
          if (!verifyData.success) {
            throw new Error('Payment verification failed');
          }
          
          // Payment verified, now create the order
          const response = await apiRequest("POST", "/api/epos/complete-purchase", {
            ...orderData,
            paymentMethod: "square",
            squarePaymentId: transactionId || verifyData.paymentId || squareOrderId,
            squareOrderId: squareOrderId,
            totalAmount: orderData.items.reduce((sum: number, item: any) => sum + parseFloat(item.unitPrice) * item.quantity, 0),
            channel: 'customer_epos',
            shippingCost: 0,
            deliveryMethod: orderData.deliveryMethod || 'delivery',
            collectionStoreId: orderData.collectionStoreId,
            collectionStoreName: orderData.collectionStoreName,
          });
          const data = await response.json();
          
          setReceiptData({
            orderNumber: data.orderNumber,
            timestamp: new Date().toLocaleString("en-GB"),
            items: orderData.items.map((item: any) => ({
              name: item.name,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
            })),
            subtotal: orderData.items.reduce((sum: number, item: any) => sum + parseFloat(item.unitPrice) * item.quantity, 0),
            total: orderData.items.reduce((sum: number, item: any) => sum + parseFloat(item.unitPrice) * item.quantity, 0),
            paymentMethod: "Card (Square)",
            customerEmail: orderData.customerEmail,
          });
          
          setShowReceipt(true);
          setCartItems([]);
          setShowCheckout(false);
          
          toast({
            title: "Payment Successful!",
            description: `Order ${data.orderNumber} has been created.`,
          });
        }).catch((error) => {
          console.error('Payment verification or order creation failed:', error);
          toast({
            title: "Payment Verification Issue",
            description: "Could not verify your payment. Please contact support with your reference: " + (referenceId || 'N/A'),
            variant: "destructive",
          });
        });
        
        // Clear stored data
        sessionStorage.removeItem('customerEposOrderData');
        sessionStorage.removeItem('customerEposSquareOrderId');
        sessionStorage.removeItem('customerEposPaymentLinkId');
        sessionStorage.removeItem('customerEposReferenceId');
      }
      
      // Clear URL params
      window.history.replaceState({}, '', '/customer/epos');
    }
  }, []);

  // Handle form invalid (user tries to pay without valid form)
  const handleFormInvalid = () => {
    // Mark all fields as touched to show errors
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      address: true,
      city: true,
      postalCode: true,
    });
    toast({
      title: "Please complete all fields",
      description: "Fill in all required delivery information before paying.",
      variant: "destructive",
    });
  };

  const resetSelection = () => {
    setSelectedSize("");
    setSelectedColor("");
    setSelectedQuantity(1);
    setSelectedProduct(null);
    setModalImageUrl("");
    setColorImagesMap({});
    setActiveImageIndex(0);
    setFullProductData(null);
    setIsZoomOpen(false);
    setZoomLevel(1);
    setViewerZoomed(false);
    setProductVariants([]);
  };

  // Helper function to check stock availability for a size/color combination
  const getStockForVariant = (size: string, color: string): number => {
    const variant = productVariants.find(
      v => v.size.toLowerCase().trim() === size.toLowerCase().trim() && 
           v.color.toLowerCase().trim() === color.toLowerCase().trim()
    );
    return variant?.stock ?? 0;
  };

  // Check if a specific size has any stock across all colors
  const sizeHasStock = (size: string): boolean => {
    if (productVariants.length === 0) return true; // No variants loaded yet, assume available
    return productVariants.some(
      v => v.size.toLowerCase().trim() === size.toLowerCase().trim() && v.stock > 0
    );
  };

  // Check if a specific color has any stock across all sizes
  const colorHasStock = (color: string): boolean => {
    if (productVariants.length === 0) return true; // No variants loaded yet, assume available
    return productVariants.some(
      v => v.color.toLowerCase().trim() === color.toLowerCase().trim() && v.stock > 0
    );
  };

  // Get current stock for selected combination
  const currentStock = selectedSize && selectedColor ? getStockForVariant(selectedSize, selectedColor) : 0;

  // Track the current product ID being loaded to prevent stale responses
  const currentLoadingProductId = useRef<string | null>(null);
  
  const openProductModal = (product: Product) => {
    // Clear any pending click timeout to prevent stale zoom interactions
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    // Reset all zoom/gallery state before opening new product
    setActiveImageIndex(0);
    setIsZoomOpen(false);
    setZoomLevel(1);
    setViewerZoomed(false);
    setViewerPosition({ x: 50, y: 50 });
    setShowLens(false);
    setLensPosition({ x: 50, y: 50 });
    setFullProductData(null);
    setColorImagesMap({});
    setProductVariants([]);
    
    // Track this product as the currently loading one
    const productId = product.id;
    currentLoadingProductId.current = productId;
    
    setSelectedProduct(product);
    setModalImageUrl(product.imageUrl || "");
    
    // Pre-select the color if this is a color-expanded product
    if (product.displayColor) {
      setSelectedColor(product.displayColor);
    } else if (product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    
    // Show modal immediately for instant feedback
    setShowProductModal(true);
    
    // Fetch full product data and variants in the background (non-blocking)
    Promise.all([
      fetch(`/api/products/${product.id}`),
      fetch(`/api/products/${product.id}/variants`)
    ]).then(async ([productResponse, variantsResponse]) => {
      // Guard: only update state if this product is still the active one
      if (currentLoadingProductId.current !== productId) {
        return; // Stale response, ignore
      }
      
      if (productResponse.ok) {
        const productData = await productResponse.json();
        setFullProductData(productData);
        if (productData.colorImages) {
          setColorImagesMap(productData.colorImages);
          // If there's a color-specific image for the selected color, use it
          const initialColor = product.displayColor || product.colors[0];
          if (initialColor && productData.colorImages[initialColor]) {
            setModalImageUrl(productData.colorImages[initialColor]);
          }
        }
      }
      
      if (variantsResponse.ok) {
        const variantsData = await variantsResponse.json();
        setProductVariants(variantsData);
      }
    }).catch((error) => {
      console.log("Could not fetch product data:", error);
      // On error, keep using the product's base image - already set above
    });
  };

  // Build gallery images array from full product data (always includes at least main image)
  const galleryImages = useMemo(() => {
    const product = fullProductData || selectedProduct;
    if (!product) return [];
    
    const images: { url: string; label: string; color?: string }[] = [];
    const addedUrls = new Set<string>();
    
    const addImage = (url: string, label: string, color?: string) => {
      if (!url || addedUrls.has(url)) return;
      addedUrls.add(url);
      images.push({ url, label, color });
    };
    
    // Add main image (ensures we always have at least one image)
    if (product.imageUrl) addImage(product.imageUrl, 'Main');
    
    // Add hover image
    if (product.hoverImageUrl) addImage(product.hoverImageUrl, 'Alternate');
    
    // Add color-specific primary images
    if (fullProductData?.colorImages) {
      Object.entries(fullProductData.colorImages).forEach(([color, url]) => {
        addImage(url, color, color);
      });
    }
    
    // Add color-specific additional images (multiple images per color)
    if (fullProductData?.colorAdditionalImages) {
      Object.entries(fullProductData.colorAdditionalImages).forEach(([color, urls]) => {
        urls.forEach((url, index) => {
          addImage(url, `${color} ${index + 2}`, color);
        });
      });
    }
    
    // Add additional product images (non-color specific)
    if (fullProductData?.additionalImages) {
      fullProductData.additionalImages.forEach((url, index) => {
        addImage(url, `Gallery ${index + 1}`);
      });
    }
    
    return images;
  }, [fullProductData, selectedProduct]);

  // Filter gallery images based on selected color
  const filteredGalleryImages = useMemo(() => {
    if (!selectedColor || galleryImages.length === 0) {
      return galleryImages;
    }
    
    const normalizedSelected = selectedColor.toLowerCase().trim();
    
    // Get images that match the selected color
    const colorImages = galleryImages.filter(img => 
      img.color && img.color.toLowerCase().trim() === normalizedSelected
    );
    
    // If we have color-specific images, return only those
    if (colorImages.length > 0) {
      return colorImages;
    }
    
    // Fallback: if no color-specific images, show all
    return galleryImages;
  }, [selectedColor, galleryImages]);

  // Reset active image index when filtered gallery changes
  useEffect(() => {
    if (activeImageIndex >= filteredGalleryImages.length && filteredGalleryImages.length > 0) {
      setActiveImageIndex(0);
    }
  }, [filteredGalleryImages.length, activeImageIndex]);

  // Safe active image index (always within bounds)
  const safeActiveIndex = filteredGalleryImages.length > 0 ? Math.min(activeImageIndex, filteredGalleryImages.length - 1) : 0;
  const currentImage = filteredGalleryImages[safeActiveIndex]?.url || selectedProduct?.imageUrl || '';

  // Similar products - same category or gender, different product, in stock, limit to 4
  const similarProducts = useMemo(() => {
    if (!selectedProduct) return [];
    
    // Helper to check availability
    const isAvailable = (productId: string, displayColor?: string | null) => !isProductOutOfStock(productId, displayColor);
    
    // First try same category, in stock
    let similar = products.filter(p => 
      p.category === selectedProduct.category && 
      p.id !== selectedProduct.id &&
      isAvailable(p.id, p.displayColor)
    );
    
    // If no category matches, try same gender, in stock
    if (similar.length === 0 && selectedProduct.gender) {
      similar = products.filter(p => 
        p.gender === selectedProduct.gender && 
        p.id !== selectedProduct.id &&
        isAvailable(p.id, p.displayColor)
      );
    }
    
    // If still empty, show any other products in stock
    if (similar.length === 0) {
      similar = products.filter(p => p.id !== selectedProduct.id && isAvailable(p.id, p.displayColor));
    }
    
    return similar.slice(0, 4);
  }, [selectedProduct, products, productColorStockMap]);

  // Zoom helper functions
  const handleMainImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleViewerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    pendingClickPosition.current = { x, y };
    setViewerPosition({ x, y });
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      // Double-click: toggle to 4x or back to 1x
      if (zoomLevel === 4) {
        setZoomLevel(1);
        setViewerZoomed(false);
      } else {
        setZoomLevel(4);
        setViewerZoomed(true);
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        // Single click: toggle between 1x and 2.5x
        if (zoomLevel === 1) {
          setZoomLevel(2.5);
          setViewerZoomed(true);
        } else {
          setZoomLevel(1);
          setViewerZoomed(false);
        }
      }, 200);
    }
  };

  const handleViewerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewerZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setViewerPosition({ x, y });
  };

  const goToPrevImage = () => {
    // Guard against empty gallery
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    setZoomLevel(1);
    setViewerZoomed(false);
  };

  const goToNextImage = () => {
    // Guard against empty gallery
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
    setViewerZoomed(false);
  };

  // Reset viewer state when closing
  useEffect(() => {
    if (!isZoomOpen) {
      setViewerZoomed(false);
      setViewerPosition({ x: 50, y: 50 });
      setZoomLevel(1);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    }
  }, [isZoomOpen]);

  // Update active image when color changes
  useEffect(() => {
    if (selectedColor && galleryImages.length > 0) {
      const colorImageIndex = galleryImages.findIndex(img => 
        img.color && img.color.toLowerCase().trim() === selectedColor.toLowerCase().trim()
      );
      if (colorImageIndex !== -1) {
        setActiveImageIndex(colorImageIndex);
      }
    }
  }, [selectedColor, galleryImages]);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.sizes.length === 1 && product.colors.length === 1) {
      // Quick add if only one size/color option
      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        size: product.sizes[0],
        color: product.colors[0],
        quantity: 1,
        unitPrice: product.retailPrice,
        imageUrl: product.imageUrl,
      };
      setCartItems(prev => [...prev, newItem]);
      toast({
        title: "Added to cart!",
        description: product.name,
      });
    } else {
      openProductModal(product);
    }
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast({ title: "Item removed" });
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div ref={oskContainerRef} className={`min-h-screen bg-black overflow-y-auto ${activeInputId ? "pb-72" : ""}`}>
      {/* Header - Fixed at top when scrolling */}
      <header className="fixed top-0 left-0 right-0 z-[300] bg-black border-b border-white/10 shadow-lg shadow-black/50">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Branding */}
            <div className="flex items-center gap-4">
              <img 
                src="/1strep-header-logo.png" 
                alt="1stRep" 
                className="h-12 w-auto object-contain"
                data-testid="epos-logo"
              />
              <div className="hidden sm:block border-l border-white/20 pl-4">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-white">EPOS</span>
                  {isConnected ? (
                    <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-400 gap-1">
                      <Wifi className="w-3 h-3" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-red-500/50 text-red-400 gap-1">
                      <WifiOff className="w-3 h-3" />
                      Offline
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-white/60">Self-Checkout Terminal</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full text-lg"
                data-testid="input-search"
              />
            </div>

            {/* Member Card & View Toggle & Cart */}
            <div className="flex items-center gap-3">
              {/* Member Card Scan Button */}
              {linkedMember ? (
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 text-sm font-medium capitalize">{linkedMember.tier}</span>
                  <span className="text-white text-sm">{linkedMember.firstName}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white/60 hover:text-white"
                    onClick={clearLinkedMember}
                    data-testid="button-clear-member"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2 h-10 border-white/20 text-white hover:bg-white/10 rounded-full"
                  onClick={() => setShowMemberScan(true)}
                  data-testid="button-scan-card"
                >
                  <ScanLine className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan Card</span>
                </Button>
              )}

              <div className="flex bg-white/5 rounded-lg p-1">
                <Button
                  size="icon"
                  variant={viewMode === "large" ? "default" : "ghost"}
                  onClick={() => setViewMode("large")}
                  className="h-9 w-9"
                  data-testid="button-view-large"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9"
                  data-testid="button-view-grid"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>

              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="lg" 
                    className="gap-2 h-12 px-6 rounded-full relative"
                    data-testid="button-open-cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-semibold">Cart</span>
                    {cartCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center bg-red-500 text-white">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg bg-black border-white/10">
                  <SheetHeader>
                    <SheetTitle className="text-white text-2xl flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6" />
                      Your Cart
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
                    {cartItems.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <ShoppingCart className="w-16 h-16 text-white/20 mb-4" />
                        <p className="text-white/60 text-lg">Your cart is empty</p>
                        <p className="text-white/40 text-sm mt-2">Add some products to get started</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                          <AnimatePresence>
                            {cartItems.map((item) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-4 bg-white/5 rounded-xl border border-white/10"
                              >
                                <div className="flex gap-4">
                                  {item.imageUrl && (
                                    <img 
                                      src={convertToDirectUrl(item.imageUrl)} 
                                      alt={item.name}
                                      onError={handleImageError}
                                      className="w-20 h-20 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white truncate">{item.name}</p>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                      {item.size && (
                                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                                          {item.size}
                                        </Badge>
                                      )}
                                      {item.color && (
                                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                                          {item.color}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-primary font-bold mt-2">
                                      {formatCurrency(parseFloat(item.unitPrice))}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                      onClick={() => removeFromCart(item.id)}
                                      data-testid={`button-remove-${item.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                    
                                    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => updateCartQuantity(item.id, -1)}
                                        data-testid={`button-decrease-${item.id}`}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="w-8 text-center text-white font-medium">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => updateCartQuantity(item.id, 1)}
                                        data-testid={`button-increase-${item.id}`}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-white/60">Subtotal</span>
                            <span className="text-2xl font-bold text-white">
                              {formatCurrency(cartTotal)}
                            </span>
                          </div>
                          
                          <Button
                            size="lg"
                            className="w-full h-14 text-lg gap-2 rounded-xl"
                            onClick={() => {
                              setCartOpen(false);
                              setShowCheckout(true);
                            }}
                            data-testid="button-proceed-checkout"
                          >
                            <CreditCard className="w-5 h-5" />
                            Proceed to Checkout
                            <ChevronRight className="w-5 h-5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {displayCategories.map((category) => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? "default" : "ghost"}
                className={`rounded-full whitespace-nowrap ${
                  selectedCategory === category.key 
                    ? "" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => {
                  setSelectedCategory(category.key);
                  setShowCheckout(false);
                }}
                data-testid={`button-category-${category.key}`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="w-full px-4 py-8 pt-40">
        {productsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/60 text-xl">No products found</p>
            <p className="text-white/40 mt-2">Try adjusting your search or category</p>
          </div>
        ) : (
          <>
            {/* Show grouped by category when "all", "women", "men", or "1r" is selected and no search */}
            {(selectedCategory === "all" || selectedCategory === "women" || selectedCategory === "men" || selectedCategory === "1r") && !searchTerm ? (
              <div className="space-y-12">
                {productsByCategory.map(({ category, products: categoryProducts }) => (
                  <div key={category} data-testid={`category-section-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                    <h2 className="text-xl font-bold text-white mb-6">{category}</h2>
                    <div className={`grid gap-6 ${
                      viewMode === "large" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    }`}>
                      {categoryProducts.map((product, index) => {
                        const uniqueKey = product.displayColor 
                          ? `${product.id}-${product.displayColor}` 
                          : product.id;
                        return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card
                              className="group bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-primary/50"
                              onClick={() => openProductModal(product)}
                              onMouseEnter={() => setHoveredProductId(uniqueKey)}
                              onMouseLeave={() => setHoveredProductId(null)}
                              data-testid={`product-card-${uniqueKey}`}
                            >
                              <div className={`relative overflow-hidden bg-neutral-100 ${
                                viewMode === "large" ? "aspect-[4/5]" : "aspect-square"
                              }`}>
                                {product.imageUrl ? (
                                  <>
                                    <img
                                      src={convertToDirectUrl(product.imageUrl)}
                                      alt={product.displayName || product.name}
                                      onError={handleImageError}
                                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                        hoveredProductId === uniqueKey && product.hoverImageUrl ? 'opacity-0' : 'opacity-100'
                                      }`}
                                    />
                                    {product.hoverImageUrl && (
                                      <img
                                        src={convertToDirectUrl(product.hoverImageUrl)}
                                        alt={`${product.displayName || product.name} alternate view`}
                                        onError={handleImageError}
                                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                          hoveredProductId === uniqueKey ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingBag className="w-16 h-16 text-white/20" />
                                  </div>
                                )}
                                {!isProductOutOfStock(product.id, product.displayColor) && (
                                  <Button
                                    size="icon"
                                    className="absolute bottom-3 right-3 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    onClick={(e) => handleQuickAdd(product, e)}
                                    data-testid={`button-quick-add-${product.id}`}
                                  >
                                    <Plus className="w-6 h-6" />
                                  </Button>
                                )}
                                {isProductOutOfStock(product.id, product.displayColor) && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Badge className="bg-red-600 text-white border-0 text-sm px-3 py-1">
                                      Out of Stock
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              <CardContent className={`${viewMode === "large" ? "p-5" : "p-3"}`}>
                                <h3 className={`font-semibold text-white mb-1 line-clamp-2 ${
                                  viewMode === "large" ? "text-lg" : "text-sm"
                                }`}>
                                  {product.displayName || product.name}
                                </h3>
                                <div className="flex items-center justify-between mt-2">
                                  <p className={`font-bold text-primary ${
                                    viewMode === "large" ? "text-2xl" : "text-lg"
                                  }`}>
                                    {formatCurrency(parseFloat(product.retailPrice))}
                                  </p>
                                  {viewMode === "large" && product.sizes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                                      {sortSizes(product.sizes).map(size => (
                                        <Badge 
                                          key={size} 
                                          variant="outline" 
                                          className="text-xs border-white/20 text-white/60"
                                        >
                                          {size}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === "large" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              }`}>
                {filteredProducts.map((product, index) => {
                  const uniqueKey = product.displayColor 
                    ? `${product.id}-${product.displayColor}` 
                    : product.id;
                  
                  return (
                  <motion.div
                    key={uniqueKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="group bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-primary/50"
                      onClick={() => openProductModal(product)}
                      onMouseEnter={() => setHoveredProductId(uniqueKey)}
                      onMouseLeave={() => setHoveredProductId(null)}
                      data-testid={`product-card-${uniqueKey}`}
                    >
                      <div className={`relative overflow-hidden bg-neutral-100 ${
                        viewMode === "large" ? "aspect-[4/5]" : "aspect-square"
                      }`}>
                        {product.imageUrl ? (
                          <>
                            <img
                              src={convertToDirectUrl(product.imageUrl)}
                              alt={product.displayName || product.name}
                              onError={handleImageError}
                              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                hoveredProductId === uniqueKey && product.hoverImageUrl ? 'opacity-0' : 'opacity-100'
                              }`}
                            />
                            {product.hoverImageUrl && (
                              <img
                                src={convertToDirectUrl(product.hoverImageUrl)}
                                alt={`${product.displayName || product.name} alternate view`}
                                onError={handleImageError}
                                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                  hoveredProductId === uniqueKey ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-16 h-16 text-white/20" />
                          </div>
                        )}
                        {!isProductOutOfStock(product.id, product.displayColor) && (
                          <Button
                            size="icon"
                            className="absolute bottom-3 right-3 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={(e) => handleQuickAdd(product, e)}
                            data-testid={`button-quick-add-${product.id}`}
                          >
                            <Plus className="w-6 h-6" />
                          </Button>
                        )}
                        {isProductOutOfStock(product.id, product.displayColor) && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge className="bg-red-600 text-white border-0 text-sm px-3 py-1">
                              Out of Stock
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className={`${viewMode === "large" ? "p-5" : "p-3"}`}>
                        <h3 className={`font-semibold text-white mb-1 line-clamp-2 ${
                          viewMode === "large" ? "text-lg" : "text-sm"
                        }`}>
                          {product.displayName || product.name}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`font-bold text-primary ${
                            viewMode === "large" ? "text-2xl" : "text-lg"
                          }`}>
                            {formatCurrency(parseFloat(product.retailPrice))}
                          </p>
                          {viewMode === "large" && product.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                              {sortSizes(product.sizes).map(size => (
                                <Badge 
                                  key={size} 
                                  variant="outline" 
                                  className="text-xs border-white/20 text-white/60"
                                >
                                  {size}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Full-Screen Zoom Viewer - only show if we have an image */}
      {isZoomOpen && selectedProduct && currentImage && (
        <div className="fixed inset-0 z-[200] bg-black" data-testid="zoom-viewer">
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 z-50 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
            data-testid="button-close-zoom"
          >
            <X className="w-6 h-6" />
          </button>
          
          {galleryImages.length > 1 && (
            <div className="absolute top-4 left-4 z-50 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
              <span className="text-white text-sm font-medium">
                {safeActiveIndex + 1} / {galleryImages.length}
              </span>
            </div>
          )}
          
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={goToPrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full transition-opacity duration-300"
            style={{ opacity: viewerZoomed ? 0 : 1 }}
          >
            <span className="text-white/80 text-sm">Click to zoom • Double-click for max zoom</span>
          </div>
          
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden relative"
            onClick={handleViewerClick}
            onMouseMove={handleViewerMouseMove}
            style={{ cursor: viewerZoomed ? 'zoom-out' : 'zoom-in' }}
          >
            <img
              src={convertToDirectUrl(currentImage)}
              alt={`${selectedProduct.name} - Full View`}
              onError={handleImageError}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${viewerPosition.x}% ${viewerPosition.y}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Enhanced Product Modal */}
      <Dialog modal={false} open={showProductModal} onOpenChange={(open) => {
        setShowProductModal(open);
        if (!open) {
          // Clear loading ID when modal closes to prevent stale responses
          currentLoadingProductId.current = null;
        }
      }}>
        <DialogContent className="max-w-4xl lg:max-w-6xl bg-black border-white/10 p-0 overflow-hidden max-h-[calc(100vh-8rem)] overflow-y-auto top-[8rem] translate-y-0">
          {selectedProduct && (
            <div className="grid md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-0">
              {/* Left: Image Gallery with Zoom */}
              <div className="p-4 space-y-3 relative overflow-visible min-h-0">
                {/* Main Image with Hover Lens */}
                <div 
                  ref={mainImageRef}
                  className={`relative rounded-lg bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center ${currentImage ? 'cursor-zoom-in' : ''}`}
                  onClick={() => currentImage && setIsZoomOpen(true)}
                  onMouseEnter={() => currentImage && setShowLens(true)}
                  onMouseLeave={() => setShowLens(false)}
                  onMouseMove={handleMainImageMouseMove}
                >
                  {currentImage ? (
                    <img
                      src={convertToDirectUrl(currentImage)}
                      alt={selectedProduct.displayName || selectedProduct.name}
                      onError={handleImageError}
                      className="max-w-full max-h-[70vh] object-contain transition-all duration-300"
                      data-testid="img-product-modal-main"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-24 h-24 text-white/20" />
                    </div>
                  )}
                  
                  {/* Hover lens indicator - only show if there's an image */}
                  {showLens && currentImage && (
                    <div 
                      className="absolute w-24 h-24 border-2 border-white/50 rounded-lg pointer-events-none transition-opacity duration-150 bg-white/10"
                      style={{
                        left: `calc(${lensPosition.x}% - 48px)`,
                        top: `calc(${lensPosition.y}% - 48px)`,
                      }}
                    />
                  )}
                  
                  {/* Zoom icon overlay - only show if there's an image */}
                  {currentImage && (
                    <div className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full">
                      <ZoomIn className="w-4 h-4 text-white/70" />
                    </div>
                  )}
                  
                  {/* Magnified preview panel - floating overlay on hover */}
                  {showLens && currentImage && (
                    <div className="hidden lg:block fixed top-1/2 right-8 -translate-y-1/2 w-72 h-72 rounded-md overflow-hidden bg-gray-900 border border-gray-700 shadow-2xl z-[150] pointer-events-none">
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${convertToDirectUrl(currentImage)})`,
                          backgroundSize: '300%',
                          backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
                        }}
                      />
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">Click for full view</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Gallery - filtered by selected color */}
                {filteredGalleryImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {filteredGalleryImages.map((image, index) => (
                      <button
                        key={`thumb-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                          safeActiveIndex === index 
                            ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-black' 
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        data-testid={`button-thumbnail-${index}`}
                      >
                        <img
                          src={convertToDirectUrl(image.url)}
                          alt={`${selectedProduct.name} - ${image.label}`}
                          onError={handleImageError}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Details - Website-style layout */}
              <div className="p-6 flex flex-col space-y-4">
                {/* Category Badge */}
                <Badge className="w-fit text-xs bg-primary/20 text-primary border-primary/30">
                  {selectedProduct.category}
                </Badge>
                
                {/* Product Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-product-name">
                  {selectedProduct.displayName || selectedProduct.name}
                </h2>

                {/* Price - Large and prominent like website */}
                <p className="text-2xl md:text-3xl font-semibold text-primary" data-testid="text-product-price">
                  {formatCurrency(parseFloat(selectedProduct.retailPrice))}
                </p>

                {/* Description */}
                {selectedProduct.description && (
                  <p className="text-gray-400 leading-relaxed text-sm" data-testid="text-product-description">
                    {selectedProduct.description}
                  </p>
                )}

                {/* Size Selection - Website style */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    SELECT SIZE
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {sortSizes(selectedProduct.sizes).map((size) => {
                      const hasStock = sizeHasStock(size);
                      const isOutOfStock = productVariants.length > 0 && !hasStock;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 text-sm border rounded-md transition-colors min-h-10 min-w-[48px] ${
                            selectedSize === size
                              ? 'bg-white text-black border-white'
                              : isOutOfStock
                                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed line-through'
                                : 'bg-gray-900 text-white border-gray-600 hover:border-white'
                          }`}
                          data-testid={`button-size-${size}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colour Selection - Website style */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    SELECT COLOUR
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProduct.colors.map((color) => {
                      const hasStock = colorHasStock(color);
                      const isOutOfStock = productVariants.length > 0 && !hasStock;
                      
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            if (isOutOfStock) return;
                            setSelectedColor(color);
                            if (colorImagesMap[color]) {
                              setModalImageUrl(colorImagesMap[color]);
                            } else {
                              setModalImageUrl(selectedProduct.imageUrl || "");
                            }
                          }}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 text-sm border rounded-md transition-colors min-h-10 ${
                            selectedColor === color
                              ? 'bg-white text-black border-white'
                              : isOutOfStock
                                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed line-through'
                                : 'bg-gray-900 text-white border-gray-600 hover:border-white'
                          }`}
                          data-testid={`button-color-${color}`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock Status - Only show when variant is selected */}
                {selectedSize && selectedColor && productVariants.length > 0 && (
                  <p className={`text-sm font-medium ${currentStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {currentStock > 0 ? (
                      <span>{currentStock} in stock</span>
                    ) : (
                      <span>Out of stock for this combination</span>
                    )}
                  </p>
                )}

                {/* Quantity - Website style */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    QUANTITY
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      className="w-10 h-10 flex items-center justify-center border border-gray-600 rounded-md text-white hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      disabled={currentStock === 0}
                      data-testid="button-qty-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-bold text-white w-10 text-center">
                      {selectedQuantity}
                    </span>
                    <button
                      className="w-10 h-10 flex items-center justify-center border border-gray-600 rounded-md text-white hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setSelectedQuantity(Math.min(currentStock || 99, selectedQuantity + 1))}
                      disabled={currentStock === 0 || selectedQuantity >= currentStock}
                      data-testid="button-qty-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart - Website style with prominent button */}
                <Button
                  size="lg"
                  onClick={() => addToCartMutation.mutate()}
                  disabled={!selectedSize || !selectedColor || currentStock === 0 || addToCartMutation.isPending}
                  className="w-full bg-white text-black hover:bg-gray-200 min-h-12 text-base font-semibold rounded-md gap-2"
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {currentStock === 0 ? "Out of Stock" : addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>

                {/* Model Info - Box format like website, above Features */}
                {fullProductData?.modelInfo && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Model Info</h3>
                    <p className="text-gray-400 text-sm">{fullProductData.modelInfo}</p>
                  </div>
                )}

                {/* Features - with checkmarks like website */}
                {fullProductData?.features && fullProductData.features.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Features</h3>
                    <ul className="space-y-2">
                      {fullProductData.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-gray-400">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Description */}
                {fullProductData?.detailedDescription && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold text-white mb-2">About This Product</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{fullProductData.detailedDescription}</p>
                  </div>
                )}

                {/* Materials */}
                {fullProductData?.materials && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Materials</h3>
                    <p className="text-gray-400 text-sm">{fullProductData.materials}</p>
                  </div>
                )}

                {/* Care Instructions */}
                {fullProductData?.careInstructions && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Care Instructions</h3>
                    <p className="text-gray-400 text-sm">{fullProductData.careInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similar Products Section */}
          {selectedProduct && similarProducts.length > 0 && (
            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">You May Also Like</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {similarProducts.map((product) => {
                  const uniqueKey = product.displayColor 
                    ? `similar-${product.id}-${product.displayColor}` 
                    : `similar-${product.id}`;
                  return (
                    <div 
                      key={uniqueKey}
                      className="group cursor-pointer"
                      onClick={() => openProductModal(product)}
                      data-testid={`similar-product-${product.id}`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-white/5 mb-2">
                        {product.imageUrl ? (
                          <img
                            src={convertToDirectUrl(product.imageUrl)}
                            alt={product.displayName || product.name}
                            onError={handleImageError}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-white/20" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-white truncate group-hover:text-primary transition-colors">
                        {product.displayName || product.name}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {formatCurrency(parseFloat(product.retailPrice))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-Page Checkout View - Matching website checkout exactly */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowCheckout(false)}
                      data-testid="button-back-to-store"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold" data-testid="checkout-title">Checkout</h1>
                      <p className="text-sm md:text-base text-muted-foreground">Complete your order with 1stRep</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${checkoutTimeRemaining <= 30 ? 'bg-red-500/10 border-red-500 animate-pulse' : 'bg-muted/50 border-border'}`} data-testid="checkout-timer">
                    <Clock className={`h-5 w-5 ${checkoutTimeRemaining <= 30 ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <span className={`font-mono text-lg font-semibold ${checkoutTimeRemaining <= 30 ? 'text-red-500' : ''}`}>
                      {Math.floor(checkoutTimeRemaining / 60)}:{(checkoutTimeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Delivery Form */}
                <div className="space-y-6">
                  {/* Delivery Method Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Delivery Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3">
                        {/* Home Delivery Option */}
                        <div
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
                          onClick={() => {
                            setDeliveryMethod('delivery');
                            setSelectedStore(null);
                          }}
                          data-testid="delivery-option-delivery"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="deliveryMethod"
                              id="delivery"
                              checked={deliveryMethod === 'delivery'}
                              onChange={() => {
                                setDeliveryMethod('delivery');
                                setSelectedStore(null);
                              }}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                <span className="font-medium">Home Delivery</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Delivered to your address</p>
                            </Label>
                          </div>
                        </div>

                        {/* In-Store Collection Option */}
                        {(siteSettings?.inStoreCollectionEnabled !== false && storeLocations.length > 0) && (
                          <div
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${deliveryMethod === 'collection' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
                            onClick={() => setDeliveryMethod('collection')}
                            data-testid="delivery-option-collection"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="deliveryMethod"
                                id="collection"
                                checked={deliveryMethod === 'collection'}
                                onChange={() => setDeliveryMethod('collection')}
                                className="h-4 w-4"
                              />
                              <Label htmlFor="collection" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4" />
                                  <span className="font-medium">In-Store Collection</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Collect from a store near you</p>
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Store Selection for In-Store Collection */}
                      {deliveryMethod === 'collection' && storeLocations.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <Label className="text-sm font-medium">Select Collection Store</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {storeLocations.map((store) => (
                              <div
                                key={store.id}
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedStore?.id === store.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
                                onClick={() => setSelectedStore(store)}
                                data-testid={`store-option-${store.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name="storeSelection"
                                    checked={selectedStore?.id === store.id}
                                    onChange={() => setSelectedStore(store)}
                                    className="h-4 w-4"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{store.businessName}</p>
                                    <p className="text-xs text-muted-foreground">{store.businessAddress}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {!selectedStore && (
                            <p className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1 mt-2">
                              <AlertCircle className="w-3 h-3" />
                              Please select a collection store
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Delivery Information Card - Only show for home delivery */}
                  {deliveryMethod === 'delivery' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Delivery Address
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Where should we send your order?</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Postal Code */}
                      <div className="relative">
                        <Label htmlFor="postalCode" className="flex items-center gap-2">
                          Postal Code *
                          {isLookingUpPostcode && <Loader2 className="h-3 w-3 animate-spin" />}
                        </Label>
                        <Input
                          id="postalCode"
                          placeholder="e.g. SW1A 1AA"
                          value={customerInfo.postalCode}
                          onChange={(e) => handlePostalCodeChange(e.target.value)}
                          onBlur={handlePostalCodeBlur}
                          required
                          autoComplete="one-time-code"
                          className={`min-h-11 ${touchedFields.postalCode && validationErrors.postalCode ? 'border-red-500 focus:ring-red-500' : ''}`}
                          data-testid="input-postal-code"
                        />
                        {touchedFields.postalCode && validationErrors.postalCode && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors.postalCode}
                          </p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                          onBlur={() => handleFieldBlur('city')}
                          required
                          autoComplete="one-time-code"
                          placeholder={isLookingUpPostcode ? "Looking up..." : "Will be auto-filled from postal code"}
                          className={`min-h-11 ${touchedFields.city && validationErrors.city ? 'border-red-500 focus:ring-red-500' : ''}`}
                          data-testid="input-city"
                        />
                        {touchedFields.city && validationErrors.city && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors.city}
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      <div className="relative">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          placeholder="House number and street name"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                          onBlur={() => handleFieldBlur('address')}
                          onFocus={() => addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                          required
                          autoComplete="one-time-code"
                          className={`min-h-11 ${touchedFields.address && validationErrors.address ? 'border-red-500 focus:ring-red-500' : ''}`}
                          data-testid="input-address"
                        />
                        {touchedFields.address && validationErrors.address && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {validationErrors.address}
                          </p>
                        )}
                        {showAddressSuggestions && addressSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                            <div className="p-2 border-b">
                              <p className="text-xs text-muted-foreground">Suggested areas in {customerInfo.postalCode}:</p>
                            </div>
                            {addressSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                                onClick={() => selectAddressSuggestion(suggestion)}
                                data-testid={`address-suggestion-${index}`}
                              >
                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                {suggestion}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted transition-colors border-t"
                              onClick={() => setShowAddressSuggestions(false)}
                            >
                              Enter address manually instead
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  )}

                  {/* Customer Information Card - Always shown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Contact Information
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">How can we contact you about your order?</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* First and Last Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={customerInfo.firstName}
                            onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                            onBlur={() => handleFieldBlur('firstName')}
                            required
                            autoComplete="one-time-code"
                            className={`min-h-11 ${touchedFields.firstName && validationErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                            data-testid="input-first-name"
                          />
                          {touchedFields.firstName && validationErrors.firstName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.firstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={customerInfo.lastName}
                            onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                            onBlur={() => handleFieldBlur('lastName')}
                            required
                            autoComplete="one-time-code"
                            className={`min-h-11 ${touchedFields.lastName && validationErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                            data-testid="input-last-name"
                          />
                          {touchedFields.lastName && validationErrors.lastName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email and Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="text"
                            inputMode="email"
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                            onBlur={() => handleFieldBlur('email')}
                            required
                            autoComplete="one-time-code"
                            className={`min-h-11 ${touchedFields.email && validationErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                            data-testid="input-checkout-email"
                          />
                          {touchedFields.email && validationErrors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="text"
                            inputMode="tel"
                            placeholder="07XXX XXXXXX"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                            onBlur={() => handleFieldBlur('phone')}
                            required
                            autoComplete="one-time-code"
                            className={`min-h-11 ${touchedFields.phone && validationErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                            data-testid="input-phone"
                          />
                          {touchedFields.phone && validationErrors.phone && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {validationErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Section with Square Checkout or Card Reader */}
                  <Card className={!isDeliveryFormValid ? "opacity-60" : ""}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isDeliveryFormValid 
                          ? "Choose how to accept card payment" 
                          : "Please complete all required fields above before paying"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Payment Method Toggle */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={paymentMethodType === "manual_entry" ? "default" : "outline"}
                          onClick={() => setPaymentMethodType("manual_entry")}
                          className="flex-1 gap-2 min-w-[120px]"
                          data-testid="button-payment-manual"
                        >
                          <CreditCard className="w-4 h-4" />
                          Enter Card Details
                        </Button>
                        <Button
                          variant={paymentMethodType === "qr_pay" ? "default" : "outline"}
                          onClick={() => setPaymentMethodType("qr_pay")}
                          className="flex-1 gap-2 min-w-[120px]"
                          data-testid="button-payment-qr"
                        >
                          <Grid3X3 className="w-4 h-4" />
                          QR Pay
                        </Button>
                      </div>

                      <Separator />

                      {!isDeliveryFormValid ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                          <AlertCircle className="w-5 h-5" />
                          <p>Complete your details above to proceed with payment</p>
                        </div>
                      ) : (
                      <>
                      {/* Card Reader Payment - Square */}
                      {paymentMethodType === "card_reader" && (
                        <SquareCardReader
                          onPaymentSuccess={(paymentId, isSquare) => handleCardPaymentSuccess(paymentId, isSquare)}
                          onPaymentError={handleCardPaymentError}
                          totalAmount={cartTotal}
                          cartItems={cartItems.map(item => ({ 
                            productId: item.productId, 
                            name: item.productName || 'Product',
                            quantity: item.quantity,
                            size: item.size,
                            color: item.color,
                            price: item.price
                          }))}
                          customerEmail={customerInfo.email}
                          orderType="customer_epos"
                          isProcessing={isPaymentProcessing}
                          setIsProcessing={setIsPaymentProcessing}
                        />
                      )}

                      {/* Manual Card Entry - Square Checkout */}
                      {paymentMethodType === "manual_entry" && (
                        <div className="space-y-4">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-sm text-center text-muted-foreground mb-4">
                              Secure card payment via Square. Supports:
                            </p>
                            <div className="flex justify-center gap-4 mb-4">
                              <div className="flex items-center gap-1 text-xs">
                                <CreditCard className="h-4 w-4" />
                                <span>Cards</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <SiApplepay className="h-5 w-5" />
                                <span>Apple Pay</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <SiGooglepay className="h-5 w-5" />
                                <span>Google Pay</span>
                              </div>
                            </div>
                          </div>
                          
                          {!isDeliveryFormValid && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Complete your delivery details above to pay
                            </p>
                          )}
                          
                          <Button 
                            onClick={handleSquareCheckout}
                            disabled={isPaymentProcessing || !isDeliveryFormValid || cartItems.length === 0}
                            className="w-full h-14 text-lg gap-2"
                            data-testid="button-complete-order"
                          >
                            {isPaymentProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Redirecting to Payment...
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5" />
                                Pay {formatCurrency(cartTotal)} with Square
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* QR Code Payment */}
                      {paymentMethodType === "qr_pay" && (
                        <QRPayment
                          items={cartItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            size: item.size,
                            color: item.color,
                            name: item.name,
                            price: parseFloat(item.unitPrice),
                          }))}
                          totalAmount={finalTotal}
                          customerEmail={customerInfo.email}
                          discount={appliedCoupon?.discountAmount ? { amount: appliedCoupon.discountAmount, name: appliedCoupon.coupon?.code || 'Discount' } : undefined}
                          onPaymentSuccess={async (paymentId) => {
                            try {
                              console.log('QR payment success, creating order with paymentId:', paymentId);
                              await handleCardPaymentSuccess(paymentId, true);
                            } catch (err: any) {
                              console.error('QR payment order creation failed:', err);
                              toast({
                                title: "Order Creation Failed",
                                description: err?.message || "Payment was successful but order could not be created. Please contact support.",
                                variant: "destructive",
                              });
                            }
                          }}
                          onPaymentError={(error) => {
                            toast({
                              title: "Payment Error",
                              description: error,
                              variant: "destructive",
                            });
                          }}
                          onCancel={() => setPaymentMethodType("manual_entry")}
                        />
                      )}
                      </>
                      )}
                    </CardContent>
                  </Card>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Secure checkout powered by Square
                  </p>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:order-2">
                  {/* Reseller Contact Info */}
                  {resellerProfile?.phoneNumber && (
                    <Card className="mb-4 bg-muted/30">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Store Contact:</span>
                          <a href={`tel:${resellerProfile.phoneNumber}`} className="font-medium hover:underline">
                            {resellerProfile.phoneNumber}
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-3 py-2">
                            {item.imageUrl && (
                              <img 
                                src={convertToDirectUrl(item.imageUrl)} 
                                alt={item.name}
                                onError={handleImageError}
                                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.color && <span>{item.color}</span>}
                                {item.color && item.size && <span> • </span>}
                                {item.size && <span>{item.size}</span>}
                                <span> • Qty: {item.quantity}</span>
                              </p>
                              <p className="font-medium text-sm mt-1">
                                {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
                                <span className="text-xs text-muted-foreground ml-1">(Inc. VAT)</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      {/* Coupon Code Section */}
                      <div className="space-y-3 mb-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Coupon Code
                        </Label>
                        {!appliedCoupon ? (
                          <>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                className="flex-1 min-h-10"
                                data-testid="input-coupon-code"
                              />
                              <Button
                                variant="outline"
                                onClick={handleApplyCoupon}
                                disabled={validateCouponMutation.isPending || !couponCode.trim()}
                                className="min-h-10"
                                data-testid="button-apply-coupon"
                              >
                                {validateCouponMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Apply"
                                )}
                              </Button>
                            </div>
                            {/* Suggest reseller's coupon code if available */}
                            {resellerProfile?.couponCode && !couponCode && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">Store discount available:</p>
                                <Button
                                  variant="link"
                                  className="h-auto p-0 text-primary font-mono"
                                  onClick={() => setCouponCode(resellerProfile.couponCode!)}
                                >
                                  {resellerProfile.couponCode}
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="font-medium text-green-600">{appliedCoupon.coupon?.code}</span>
                              <span className="text-sm text-muted-foreground">
                                (-{formatCurrency(discountAmount)})
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleRemoveCoupon}
                              className="h-8 w-8"
                              data-testid="button-remove-coupon"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(cartTotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Coupon Discount</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="text-green-600">
                            {deliveryMethod === 'collection' ? 'Free (Collection)' : 'Free'}
                          </span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(finalTotal)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-black border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              Order Complete!
            </DialogTitle>
          </DialogHeader>
          
          {receiptData && (
            <div className="space-y-4">
              {/* Order Header */}
              <div className="text-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-primary">1stRep</h2>
                <p className="text-sm text-white/60">Premium Fitness Apparel</p>
              </div>
              
              {/* Order Details */}
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Order Number</span>
                  <span className="font-mono font-bold text-primary">{receiptData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Date & Time</span>
                  <span className="text-white/80">{receiptData.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Payment Method</span>
                  <span className="text-white/80">{receiptData.paymentMethod}</span>
                </div>
                {receiptData.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Email</span>
                    <span className="text-white/80 truncate ml-2">{receiptData.customerEmail}</span>
                  </div>
                )}
              </div>
              
              {/* Items List */}
              {receiptData.items.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 border-b border-white/10 pb-2">Items Purchased</h3>
                  <div className="space-y-3">
                    {receiptData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-sm text-white/60">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && " | "}
                            {item.color && `Colour: ${item.color}`}
                          </p>
                          <p className="text-sm text-white/60">
                            Qty: {item.quantity} × {formatCurrency(parseFloat(item.unitPrice))}
                          </p>
                        </div>
                        <span className="font-bold text-primary">
                          {formatCurrency(parseFloat(item.totalPrice))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Totals */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between text-lg">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-white">{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <Separator className="my-2 bg-white/10" />
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-primary">{formatCurrency(receiptData.total)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 gap-2"
                  onClick={() => {
                    window.print();
                  }}
                  data-testid="button-print-receipt"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => setShowReceipt(false)}
                  data-testid="button-close-receipt"
                >
                  <Check className="w-4 h-4" />
                  Done
                </Button>
              </div>
              
              {/* Footer */}
              <div className="text-center text-sm text-white/40 pt-2 border-t border-white/10">
                <p>Thank you for your purchase!</p>
                <p className="text-xs mt-1">Built by Qanzak Global</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button (Mobile) */}
      {cartCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 md:hidden z-50"
        >
          <Button
            size="lg"
            className="h-16 w-16 rounded-full shadow-2xl"
            onClick={() => setCartOpen(true)}
            data-testid="button-floating-cart"
          >
            <ShoppingCart className="w-6 h-6" />
            <Badge className="absolute -top-2 -right-2 h-7 w-7 p-0 flex items-center justify-center bg-red-500">
              {cartCount}
            </Badge>
          </Button>
        </motion.div>
      )}

      {/* Member Card Scan Dialog */}
      <Dialog open={showMemberScan} onOpenChange={setShowMemberScan}>
        <DialogContent className="bg-black border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Scan Member Card
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Scan customer's loyalty card or enter their email address to look up their account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                ref={memberInputRef}
                placeholder="Scan card or enter email..."
                value={memberScanInput}
                onChange={(e) => setMemberScanInput(e.target.value)}
                onKeyDown={handleMemberInputKeyDown}
                className="pl-10 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                autoFocus
                data-testid="input-member-scan"
              />
            </div>
            
            <p className="text-xs text-white/40 text-center">
              Point the barcode scanner at the customer's member card, or type their email address
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  setShowMemberScan(false);
                  setMemberScanInput("");
                }}
                data-testid="button-cancel-scan"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => handleMemberScan(memberScanInput)}
                disabled={memberSearching || !memberScanInput.trim()}
                data-testid="button-lookup-member"
              >
                {memberSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Look Up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <OnScreenKeyboard activeInputId={activeInputId} onClose={closeKeyboard} />
    </div>
  );
}
