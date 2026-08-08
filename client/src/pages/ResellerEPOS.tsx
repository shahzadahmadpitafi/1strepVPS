import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { Card, CardContent } from "@/components/ui/card";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useOnScreenKeyboard } from "@/hooks/useOnScreenKeyboard";
import OnScreenKeyboard from "@/components/epos/OnScreenKeyboard";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, Check, X,
  CreditCard, Banknote, Store, ChevronRight, ChevronLeft, ArrowLeft, Truck,
  ShoppingBag, Grid3X3, LayoutGrid, Printer, CheckCircle, Package, Loader2, ZoomIn, Lock, AlertCircle,
  Shield, AlertTriangle, KeyRound, Phone, Tag, QrCode, Tv, Nfc, Building
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "wouter";
import { SiPaypal } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { usePaypalCheckout } from "@/hooks/usePaypalCheckout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, sortSizes } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SiApplepay, SiGooglepay } from "react-icons/si";
import QRPayment from "@/components/epos/QRPayment";
import ProductShowReel from "@/components/epos/ProductShowReel";
import EPOSAdLoop from "@/components/epos/EPOSAdLoop";
import SquareCardReader from "@/components/SquareCardReader";

// Email validation helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Helper function to determine product type from name (matches backend logic)
const getProductType = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('hoodie')) return 'Hoodies';
  if (lowerName.includes('t-shirt') || lowerName.includes('tshirt')) return 'T-Shirts';
  if (lowerName.includes('sports bra') || lowerName.includes('bra')) return 'Sports Bras';
  if (lowerName.includes('legging')) return 'Leggings';
  if (lowerName.includes('tank')) return 'Tanks';
  if (lowerName.includes('hat') || lowerName.includes('jacket')) return 'Accessories';
  return 'General';
};

interface InventoryItem {
  size?: string;
  color?: string;
  quantity: number;
  reservedQuantity: number;
}

interface ResellerProduct {
  id: string;
  name: string;
  sku: string;
  retailPrice: string;
  wholesalePrice: string;
  category: string;
  sizes: string[];
  colors: string[];
  imageUrl?: string;
  inventory: InventoryItem[];
  productType?: string;
  isResellerProduct?: boolean;
  resellerId?: string;
  resellerName?: string;
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
  isResellerProduct?: boolean;
  productType?: string;
}

interface ReceiptData {
  orderNumber: string;
  ownProductOrderNumber?: string | null;
  isMixed?: boolean;
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

interface ResellerProfile {
  id: string;
  businessName: string;
  contactPerson: string;
  phoneNumber: string;
  businessAddress: string;
  tier: string;
  discountPercentage: string;
  couponCode: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  ownSquareSetup: boolean;
  eposBankDetails: { accountName: string; sortCode: string; accountNumber: string } | null;
}

export default function ResellerEPOS() {
  const { toast } = useToast();
  useWakeLock();
  const { activeInputId, closeKeyboard, containerRef: oskContainerRef } = useOnScreenKeyboard();
  const { initializePayPal, startPayment, isLoading: isPaypalLoading, isProcessing: isPaypalProcessing, isInitialized: isPaypalInitialized } = usePaypalCheckout();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ResellerProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "card_reader" | "paypal" | "qr" | "stripe_direct" | "bank_transfer">("qr");
  const [isBankTransferProcessing, setIsBankTransferProcessing] = useState(false);
  const [bankTransferRef, setBankTransferRef] = useState("");
  const [showBankTransferConfirm, setShowBankTransferConfirm] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "collection">("delivery");
  
  // Delivery address state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPostcode, setDeliveryPostcode] = useState("");
  const [deliveryCountry, setDeliveryCountry] = useState("United Kingdom");
  const [cartOpen, setCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "large">("large");
  const [showShowReel, setShowShowReel] = useState(false);
  const [showAdLoop, setShowAdLoop] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [checkoutTimeRemaining, setCheckoutTimeRemaining] = useState(60);
  
  // Enhanced modal state for zoom and gallery
  const [fullProductData, setFullProductData] = useState<any>(null);
  const [colorImagesMap, setColorImagesMap] = useState<Record<string, string>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 });
  const [showLens, setShowLens] = useState(false);
  const [viewerZoomed, setViewerZoomed] = useState(false);
  const [viewerPosition, setViewerPosition] = useState({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingClickPosition = useRef<{ x: number; y: number }>({ x: 50, y: 50 });

  // Square payment state
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Stripe Direct payment state
  const [isStripeDirectProcessing, setIsStripeDirectProcessing] = useState(false);

  // Terminal (card machine) webhook payment session state
  const [terminalSessionId, setTerminalSessionId] = useState<string | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<"idle" | "pending" | "paid" | "expired" | "cancelled" | "error" | "order_error">("idle");
  const [terminalWebhookUrl, setTerminalWebhookUrl] = useState<string>("");
  const [terminalElapsed, setTerminalElapsed] = useState(0);
  const terminalPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const terminalElapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const terminalAutoCompleteRef = useRef(false);

  // Tracks whether the user has tried to submit checkout (for validation display)
  const [checkoutAttempted, setCheckoutAttempted] = useState(false);

  // Coupon code state (B2B Partner Coupons - reseller-specific)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon: { id: string; code: string; discountType: string; discountValue: string; maxDiscount: string | null }; discount: number } | null>(null);
  
  // Customer name state
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  
  // Customer phone number state
  const [customerPhone, setCustomerPhone] = useState("");

  // Security: PIN lock state - fully server-side session management
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [showPinSetupDialog, setShowPinSetupDialog] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinSetupError, setPinSetupError] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Server session check - this is the ONLY source of truth for session validity
  const { data: sessionData, isLoading: checkingSession, refetch: refetchSession } = useQuery<{
    authenticated: boolean;
    verified?: boolean;
    persistent?: boolean;
    requiresPinSetup?: boolean;
    weakPinBlocked?: boolean;
  }>({
    queryKey: ["/api/reseller/epos/session"],
    refetchInterval: 60000,
  });

  // Derive isLocked from server session data only - no local state
  const isLocked = !sessionData?.authenticated || !sessionData?.verified;
  const requiresPinSetup = sessionData?.requiresPinSetup || false;
  const weakPinBlocked = sessionData?.weakPinBlocked || false;

  // Show PIN setup dialog when first-time login detected OR weak PIN blocked
  useEffect(() => {
    if ((sessionData?.requiresPinSetup || sessionData?.weakPinBlocked) && !showPinSetupDialog) {
      setShowPinSetupDialog(true);
    }
  }, [sessionData?.requiresPinSetup, sessionData?.weakPinBlocked]);

  // Mutation to set new PIN
  const setPinMutation = useMutation({
    mutationFn: async (newPin: string) => {
      const response = await apiRequest("POST", "/api/reseller/epos/set-pin", { newPin });
      return response.json();
    },
    onSuccess: () => {
      setShowPinSetupDialog(false);
      setNewPinInput("");
      setConfirmPinInput("");
      setPinSetupError("");
      setIsSettingPin(false);
      toast({
        title: "PIN Set Successfully",
        description: "Your new EPOS PIN has been saved securely.",
      });
      refetchSession();
    },
    onError: (error: any) => {
      setIsSettingPin(false);
      setPinSetupError(error.message || "Failed to set PIN. Please try again.");
    }
  });

  // Handle setting new PIN
  const handleSetNewPin = () => {
    if (newPinInput.length !== 4) {
      setPinSetupError("PIN must be exactly 4 digits");
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinSetupError("PINs do not match");
      return;
    }
    // Check for weak PINs client-side
    const weakPins = ["1234", "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1212", "0123"];
    if (weakPins.includes(newPinInput)) {
      setPinSetupError("This PIN is too easy to guess. Please choose a more secure PIN.");
      return;
    }
    setPinSetupError("");
    setIsSettingPin(true);
    setPinMutation.mutate(newPinInput);
  };

  // Handle PIN input keypad press
  const handlePinKeyPress = async (digit: string) => {
    if (isVerifyingPin) return;
    
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError(false);
    
    // Auto-submit when 4 digits entered
    if (newPin.length === 4) {
      setIsVerifyingPin(true);
      
      try {
        const response = await fetch("/api/reseller/epos/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pin: newPin })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setPinInput("");
          setPinError(false);
          
          // Check if this was first-time login requiring PIN setup
          if (data.requiresPinSetup) {
            setShowPinSetupDialog(true);
          }
          
          // Refetch session to get latest state
          refetchSession();
        } else {
          // Show error and clear PIN for retry
          setPinError(true);
          setTimeout(() => {
            setPinInput("");
            setPinError(false);
          }, 1500);
          
          toast({
            title: "Invalid PIN",
            description: data.error || "Incorrect PIN. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setPinError(true);
        setTimeout(() => {
          setPinInput("");
          setPinError(false);
        }, 1500);
        
        toast({
          title: "Error",
          description: "Failed to verify PIN. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsVerifyingPin(false);
      }
    }
  };

  const clearPinInput = () => {
    setPinInput("");
    setPinError(false);
  };

  // Fetch reseller profile for branding
  const { data: resellerProfile } = useQuery<ResellerProfile>({
    queryKey: ["/api/reseller/epos/profile"],
  });

  // Fetch reseller's inventory products
  const { data: products = [], isLoading: productsLoading } = useQuery<ResellerProduct[]>({
    queryKey: ["/api/reseller/epos/products"],
    refetchInterval: 30000, // Auto-refresh every 30s as fallback alongside Socket.IO real-time sync
    staleTime: 20000,
  });

  // Fetch category sales data for sorting categories by sales performance
  const { data: categorySalesData = [] } = useQuery<{ category: string; totalSales: number }[]>({
    queryKey: ["/api/category-sales"],
  });

  // Fetch product sections to use their displayOrder for sorting
  const { data: productSections = [] } = useQuery<{ id: string; name: string; slug: string; displayOrder: number; isActive: boolean }[]>({
    queryKey: ["/api/product-sections"],
  });

  // Real-time sync — refresh products/inventory/orders when any EPOS event arrives
  const handleInventoryUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/epos/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/inventory"] });
  }, []);

  const handleOrderEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/epos/products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/orders"] });
  }, []);

  useSocket({
    room: "epos",
    resellerId: resellerProfile?.id,
    onInventoryUpdate: handleInventoryUpdate,
    onOrderEvent: handleOrderEvent,
  });

  // Ad loop disabled — was causing significant CPU/GPU load from RAF + Framer Motion
  // To re-enable: restore idle timer and EPOSAdLoop render below

  // Checkout timeout - 10 minute limit
  useEffect(() => {
    if (showCheckout) {
      setCheckoutTimeRemaining(600);
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
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showCheckout, toast]);

  // Get unique categories from products + add "Own Products" filter if any exist
  const hasOwnProducts = products.some(p => p.productType === 'own_product');
  const baseCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const categories = ["all", ...(hasOwnProducts ? ["Own Products"] : []), ...baseCategories];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           (selectedCategory === "Own Products" && p.productType === 'own_product') ||
                           p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group products by productType and sort by product section displayOrder
  const productsByCategory = useMemo(() => {
    const categoryMap: Record<string, typeof filteredProducts> = {};
    
    filteredProducts.forEach(product => {
      const productType = getProductType(product.name);
      if (!categoryMap[productType]) {
        categoryMap[productType] = [];
      }
      categoryMap[productType].push(product);
    });

    // Create displayOrder ranking from product sections
    const sectionOrderMap: Record<string, number> = {};
    productSections.forEach((section) => {
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

  // Get stock for selected variant from inventory
  const getInventoryStock = (product: ResellerProduct, size: string, color: string): number => {
    const inv = product.inventory.find(i => 
      (i.size === size || (!i.size && !size)) && 
      (i.color === color || (!i.color && !color))
    );
    return inv ? inv.quantity - (inv.reservedQuantity || 0) : 0;
  };

  // Get total stock for product
  const getTotalStock = (product: ResellerProduct): number => {
    return product.inventory.reduce((sum, inv) => sum + inv.quantity - (inv.reservedQuantity || 0), 0);
  };

  const resetSelection = () => {
    setSelectedSize("");
    setSelectedColor("");
    setSelectedQuantity(1);
    setSelectedProduct(null);
  };

  const openProductModal = async (product: ResellerProduct) => {
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
    
    setSelectedProduct(product);
    if (product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    
    // Fetch full product data for enhanced modal
    try {
      const response = await fetch(`/api/products/${product.id}`);
      if (response.ok) {
        const productData = await response.json();
        setFullProductData(productData);
        if (productData.colorImages) {
          setColorImagesMap(productData.colorImages);
        }
      }
    } catch (error) {
      console.log("Could not fetch product data:", error);
    }
    
    setShowProductModal(true);
  };

  // Build gallery images array from full product data
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
    
    // Add main image
    if (selectedProduct?.imageUrl) addImage(selectedProduct.imageUrl, 'Main');
    
    // Add color-specific primary images
    if (fullProductData?.colorImages) {
      Object.entries(fullProductData.colorImages).forEach(([color, url]) => {
        addImage(url as string, color, color);
      });
    }
    
    // Add color-specific additional images
    if (fullProductData?.colorAdditionalImages) {
      Object.entries(fullProductData.colorAdditionalImages).forEach(([color, urls]) => {
        (urls as string[]).forEach((url, index) => {
          addImage(url, `${color} ${index + 2}`, color);
        });
      });
    }
    
    // Add additional product images
    if (fullProductData?.additionalImages) {
      fullProductData.additionalImages.forEach((url: string, index: number) => {
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

  // Safe active image index (always within bounds)
  const safeActiveIndex = filteredGalleryImages.length > 0 ? Math.min(activeImageIndex, filteredGalleryImages.length - 1) : 0;
  const currentImage = filteredGalleryImages[safeActiveIndex]?.url || selectedProduct?.imageUrl || '';

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
    setActiveImageIndex(prev => (prev > 0 ? prev - 1 : filteredGalleryImages.length - 1));
  };

  const goToNextImage = () => {
    setActiveImageIndex(prev => (prev < filteredGalleryImages.length - 1 ? prev + 1 : 0));
  };

  const handleQuickAdd = (product: ResellerProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.sizes.length <= 1 && product.colors.length <= 1) {
      const size = product.sizes[0] || "";
      const color = product.colors[0] || "";
      const stock = getInventoryStock(product, size, color);
      
      if (stock < 1) {
        toast({
          title: "Out of Stock",
          description: "This item is currently unavailable",
          variant: "destructive",
        });
        return;
      }
      
      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        size,
        color,
        quantity: 1,
        unitPrice: product.retailPrice,
        imageUrl: product.imageUrl,
        isResellerProduct: product.isResellerProduct,
        productType: product.productType,
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

  const addToCart = () => {
    if (!selectedProduct) return;
    
    const stock = getInventoryStock(selectedProduct, selectedSize, selectedColor);
    
    if (selectedQuantity > stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${stock} available`,
        variant: "destructive",
      });
      return;
    }
    
    const newItem: CartItem = {
      id: `temp-${Date.now()}`,
      productId: selectedProduct.id,
      sku: selectedProduct.sku,
      name: selectedProduct.name,
      size: selectedSize,
      color: selectedColor,
      quantity: selectedQuantity,
      unitPrice: selectedProduct.retailPrice,
      imageUrl: selectedProduct.imageUrl,
      isResellerProduct: selectedProduct.isResellerProduct,
      productType: selectedProduct.productType,
    };
    
    setCartItems(prev => [...prev, newItem]);
    toast({
      title: "Added to cart!",
      description: `${selectedProduct.name} x${selectedQuantity}`,
    });
    
    resetSelection();
    setShowProductModal(false);
    setCartOpen(true);
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

  const resetSession = () => {
    setCartItems([]);
    setShowCheckout(false);
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerFirstName("");
    setCustomerLastName("");
    setAppliedCoupon(null);
    setCouponCode("");
    setDeliveryMethod("delivery");
    setDeliveryAddress("");
    setDeliveryCity("");
    setDeliveryPostcode("");
    setDeliveryCountry("United Kingdom");
    setPaymentMethod("qr");
    setIsPaymentProcessing(false);
    setCheckoutAttempted(false);
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/epos/products"] });
  };

  // 5-minute auto-clear timer for basket inactivity
  const basketTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [basketTimeLeft, setBasketTimeLeft] = useState<number | null>(null);
  const basketCountdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const cartHash = useMemo(() => 
    JSON.stringify(cartItems.map(i => ({ id: i.id, q: i.quantity }))), 
    [cartItems]
  );
  
  useEffect(() => {
    if (basketTimerRef.current) {
      clearTimeout(basketTimerRef.current);
      basketTimerRef.current = null;
    }
    if (basketCountdownRef.current) {
      clearInterval(basketCountdownRef.current);
      basketCountdownRef.current = null;
    }
    
    if (cartItems.length > 0 && !showReceipt) {
      const BASKET_TIMEOUT = 5 * 60 * 1000;
      setBasketTimeLeft(300);
      
      basketCountdownRef.current = setInterval(() => {
        setBasketTimeLeft(prev => {
          if (prev !== null && prev <= 1) return 0;
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      
      basketTimerRef.current = setTimeout(() => {
        resetSession();
        toast({ 
          title: "Basket cleared",
          description: "The basket has been automatically cleared after 5 minutes of inactivity.",
          variant: "destructive",
        });
        setBasketTimeLeft(null);
      }, BASKET_TIMEOUT);
    } else {
      setBasketTimeLeft(null);
    }
    
    return () => {
      if (basketTimerRef.current) clearTimeout(basketTimerRef.current);
      if (basketCountdownRef.current) clearInterval(basketCountdownRef.current);
    };
  }, [cartHash, showReceipt]);

  const isDeliveryAddressComplete = deliveryMethod === 'collection' || (
    deliveryAddress.trim().length > 0 &&
    deliveryCity.trim().length > 0 &&
    deliveryPostcode.trim().length > 0
  );

  // Check if cart contains any 1stRep catalogue products (not reseller's own products)
  // Cash payment is disabled for 1stRep products - card only
  const hasFirstRepProducts = cartItems.some(item => !item.isResellerProduct && item.productType !== 'own_product');

  // True when every item in the cart is the reseller's own product - email not required in this case
  const allOwnProducts = cartItems.length > 0 && cartItems.every(item => item.isResellerProduct || item.productType === 'own_product');

  const isCheckoutInfoComplete = allOwnProducts || (
    validateEmail(customerEmail) &&
    customerFirstName.trim().length > 0 &&
    customerPhone.trim().length >= 7 &&
    isDeliveryAddressComplete
  );

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
    0
  );

  // Subtotal of 1stRep catalogue items only — coupon discounts never apply to the reseller's own products
  const firstRepSubtotal = cartItems
    .filter(item => !item.isResellerProduct && item.productType !== 'own_product')
    .reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);

  // Whether the cart contains a mix of 1stRep and own products
  const hasMixedProducts = firstRepSubtotal > 0 && firstRepSubtotal < cartTotal;

  // Calculate the final total after applying any coupon discount
  const discountedTotal = appliedCoupon 
    ? Math.max(0, cartTotal - appliedCoupon.discount) 
    : cartTotal;

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Auto-switch to card payment if cart contains 1stRep products
  useEffect(() => {
    if (hasFirstRepProducts && paymentMethod === "cash") {
      setPaymentMethod("card");
    }
  }, [hasFirstRepProducts, paymentMethod]);

  // Auto-select payment method for own-product carts:
  // 1st priority: reseller's own Square (auto-confirmed, no customer action needed)
  // 2nd priority: bank transfer (if bank details set up)
  // 3rd priority: Stripe direct (if Stripe connected)
  // 4th priority: Square QR (platform Square)
  useEffect(() => {
    if (!allOwnProducts) return;
    // If reseller has own Square connected — always use QR (routes to their own Square automatically)
    if (resellerProfile?.ownSquareSetup && paymentMethod !== "qr") {
      setPaymentMethod("qr");
      return;
    }
    // No own Square — fall back to bank transfer if set up
    if (!resellerProfile?.ownSquareSetup && resellerProfile?.eposBankDetails && (paymentMethod === "qr" || paymentMethod === "stripe_direct")) {
      setPaymentMethod("bank_transfer");
      return;
    }
    // No own Square or bank — try Stripe direct
    if (!resellerProfile?.ownSquareSetup && !resellerProfile?.eposBankDetails && resellerProfile?.stripeChargesEnabled && paymentMethod === "qr") {
      setPaymentMethod("stripe_direct");
      return;
    }
    if (!resellerProfile?.ownSquareSetup && !resellerProfile?.eposBankDetails && !resellerProfile?.stripeChargesEnabled && paymentMethod === "stripe_direct") {
      setPaymentMethod("qr");
    }
  }, [allOwnProducts, resellerProfile?.ownSquareSetup, resellerProfile?.stripeChargesEnabled, resellerProfile?.eposBankDetails]);

  // Generate a unique reference whenever bank_transfer is selected
  useEffect(() => {
    if (paymentMethod === "bank_transfer" && !bankTransferRef) {
      setBankTransferRef(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    if (paymentMethod !== "bank_transfer") {
      setBankTransferRef("");
    }
  }, [paymentMethod]);

  // ── QR payment reconciliation on mount ────────────────────────────────────
  // If any QR payments were completed while the tab was closed, recover them now.
  useEffect(() => {
    let cancelled = false;
    const runReconciliation = async () => {
      try {
        const resp = await apiRequest("POST", "/api/square/reconcile-pending", {});
        if (cancelled) return;
        const data = await resp.json();
        if (data.recovered && data.recovered.length > 0) {
          toast({
            title: `${data.recovered.length} order${data.recovered.length > 1 ? 's' : ''} recovered`,
            description: `The following QR payment${data.recovered.length > 1 ? 's' : ''} were confirmed and saved: ${data.recovered.join(', ')}`,
            duration: 10000,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/reseller/orders'] });
        }
      } catch {
        // Reconciliation is non-critical — silently ignore errors
      }
    };
    runReconciliation();
    return () => { cancelled = true; };
  }, []);

  // Handle Square checkout redirect for card payments
  const handleSquareCardPayment = async () => {
    if (!isCheckoutInfoComplete) {
      toast({
        title: "Missing Information",
        description: allOwnProducts
          ? "Please fill in all required fields (name, phone, and delivery address)."
          : "Please fill in all required fields (name, email, phone, and delivery address).",
        variant: "destructive",
      });
      return;
    }
    
    if (deliveryMethod === 'collection' && !selectedStore) {
      toast({
        title: "Store Required",
        description: "Please select a collection store.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPaymentProcessing(true);
    
    try {
      // Store cart data in sessionStorage for retrieval after Square redirect
      sessionStorage.setItem('resellerEposCartItems', JSON.stringify(cartItems));
      sessionStorage.setItem('resellerEposCustomerEmail', customerEmail);
      sessionStorage.setItem('resellerEposCustomerPhone', customerPhone);
      sessionStorage.setItem('resellerEposCustomerFirstName', customerFirstName);
      sessionStorage.setItem('resellerEposCustomerLastName', customerLastName);
      sessionStorage.setItem('resellerEposDeliveryMethod', deliveryMethod);
      sessionStorage.setItem('resellerEposDeliveryAddress', JSON.stringify({
        address: deliveryAddress,
        city: deliveryCity,
        postcode: deliveryPostcode,
        country: deliveryCountry,
      }));
      if (deliveryMethod === 'collection' && selectedStore) {
        sessionStorage.setItem('resellerEposCollectionStore', JSON.stringify(selectedStore));
      }
      sessionStorage.setItem('resellerEposTotal', String(discountedTotal));
      sessionStorage.setItem('resellerEposSubtotal', String(cartTotal));
      if (appliedCoupon) {
        sessionStorage.setItem('resellerEposCoupon', JSON.stringify(appliedCoupon));
      }
      
      // Create Square checkout — pass full order data so the server can store
      // a backup record. This ensures the order can be recovered by the
      // reconcile-pending flow even if sessionStorage is lost on redirect.
      const response = await apiRequest("POST", "/api/square/create-epos-checkout", {
        amount: discountedTotal,
        subtotal: cartTotal,
        currency: 'GBP',
        customerEmail,
        customerPhone,
        customerFirstName,
        customerLastName,
        resellerId: resellerProfile?.id,
        orderType: 'reseller_epos',
        lineItems: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          color: item.color,
        })),
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isResellerProduct: item.isResellerProduct,
          productType: item.productType,
        })),
        couponCode: appliedCoupon?.coupon?.code || null,
        couponId: appliedCoupon?.coupon?.id || null,
        discountAmount: appliedCoupon?.discount || 0,
        deliveryMethod,
        deliveryAddress: {
          address: deliveryAddress,
          city: deliveryCity,
          postcode: deliveryPostcode,
          country: deliveryCountry,
        },
        redirectUrl: `${window.location.origin}/reseller/epos?payment=success`,
        discount: appliedCoupon ? {
          amount: appliedCoupon.discount,
          name: appliedCoupon.coupon.code
        } : undefined,
      });
      
      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        // Store Square reference for verification
        sessionStorage.setItem('resellerEposSquareOrderId', data.orderId || '');
        sessionStorage.setItem('resellerEposReferenceId', data.referenceId || '');
        
        // Redirect to Square hosted checkout
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

  // ── Stripe Direct payment — saves cart to sessionStorage, then redirects to
  // a Stripe Checkout Session created on the reseller's own Stripe account.
  // Money goes straight to the reseller; the platform never touches it.
  const handleStripeDirectPayment = async () => {
    setIsStripeDirectProcessing(true);
    try {
      // Save cart data to sessionStorage so we can reconstruct it on return
      sessionStorage.setItem('resellerEposStripeItems', JSON.stringify(cartItems));
      sessionStorage.setItem('resellerEposStripeFirstName', customerFirstName);
      sessionStorage.setItem('resellerEposStripeLastName', customerLastName);
      sessionStorage.setItem('resellerEposStripePhone', customerPhone);
      sessionStorage.setItem('resellerEposStripeTotal', String(discountedTotal));

      const response = await apiRequest("POST", "/api/reseller/epos/create-stripe-direct-checkout", {
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          color: item.color,
          isResellerProduct: item.isResellerProduct,
          productType: item.productType,
        })),
        totalAmount: discountedTotal,
        customerFirstName,
        customerLastName,
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error: any) {
      console.error('Stripe direct checkout error:', error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setIsStripeDirectProcessing(false);
    }
  };

  // Handle return from Square checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment');
    const transactionId = urlParams.get('transactionId');
    
    if (paymentSuccess === 'success') {
      // Retrieve stored cart data
      const storedItems = sessionStorage.getItem('resellerEposCartItems');
      const storedEmail = sessionStorage.getItem('resellerEposCustomerEmail');
      const storedPhone = sessionStorage.getItem('resellerEposCustomerPhone');
      const storedFirstName = sessionStorage.getItem('resellerEposCustomerFirstName') || 'EPOS';
      const storedLastName = sessionStorage.getItem('resellerEposCustomerLastName') || 'Customer';
      const storedDeliveryMethod = sessionStorage.getItem('resellerEposDeliveryMethod');
      const storedDeliveryAddress = sessionStorage.getItem('resellerEposDeliveryAddress');
      const storedCollectionStore = sessionStorage.getItem('resellerEposCollectionStore');
      const storedTotal = sessionStorage.getItem('resellerEposTotal');
      const storedSubtotal = sessionStorage.getItem('resellerEposSubtotal');
      const storedCoupon = sessionStorage.getItem('resellerEposCoupon');
      const squareOrderId = sessionStorage.getItem('resellerEposSquareOrderId');
      
      // Helper to wipe session storage after a successful order
      const clearSquareSessionData = () => {
        sessionStorage.removeItem('resellerEposCartItems');
        sessionStorage.removeItem('resellerEposCustomerEmail');
        sessionStorage.removeItem('resellerEposCustomerPhone');
        sessionStorage.removeItem('resellerEposCustomerFirstName');
        sessionStorage.removeItem('resellerEposCustomerLastName');
        sessionStorage.removeItem('resellerEposDeliveryMethod');
        sessionStorage.removeItem('resellerEposDeliveryAddress');
        sessionStorage.removeItem('resellerEposCollectionStore');
        sessionStorage.removeItem('resellerEposTotal');
        sessionStorage.removeItem('resellerEposSubtotal');
        sessionStorage.removeItem('resellerEposCoupon');
        sessionStorage.removeItem('resellerEposSquareOrderId');
        sessionStorage.removeItem('resellerEposReferenceId');
        window.history.replaceState({}, '', window.location.pathname);
      };

      // ── Fallback: if sessionStorage was lost, trigger reconcile-pending ─────
      // This happens when the Square redirect opens in a different tab context
      // or the browser tab was closed/refreshed before the return completes.
      // The server already saved a backup record, so reconcile will recover it.
      if (!storedItems) {
        console.warn('EPOS: sessionStorage cart data missing on Square return — triggering reconcile-pending to recover order.');
        (async () => {
          try {
            const recoverResp = await apiRequest("POST", "/api/square/reconcile-pending", {});
            const recoverData = await recoverResp.json();
            if (recoverData.recovered && recoverData.recovered.length > 0) {
              window.history.replaceState({}, '', window.location.pathname);
              queryClient.invalidateQueries({ queryKey: ['/api/reseller/orders'] });
              queryClient.invalidateQueries({ queryKey: ['/api/reseller/inventory'] });
              toast({
                title: "Order Recovered",
                description: `Payment confirmed and order ${recoverData.recovered.join(', ')} has been saved automatically.`,
              });
            } else {
              toast({
                title: "Payment Received — Order Pending",
                description: "Your Square payment was taken. The order is being reconciled — it will appear in your portal within a few minutes. If it does not appear, please contact support with the payment reference.",
                variant: "destructive",
                duration: 20000,
              });
            }
          } catch (reconcileErr) {
            console.error('Reconcile fallback failed:', reconcileErr);
            toast({
              title: "Payment Received — Manual Recovery Needed",
              description: "Payment was taken by Square but the order could not be saved automatically. Please contact support with the payment reference number.",
              variant: "destructive",
              duration: 20000,
            });
          }
        })();
        return;
      }

      // storedItems must exist; storedEmail is optional (own-product orders don't need it)
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        const parsedDeliveryAddress = storedDeliveryAddress ? JSON.parse(storedDeliveryAddress) : null;
        const parsedCollectionStore = storedCollectionStore ? JSON.parse(storedCollectionStore) : null;
        const parsedCoupon = storedCoupon ? JSON.parse(storedCoupon) : null;
        const total = parseFloat(storedTotal || '0');
        const subtotal = parseFloat(storedSubtotal || '0');
        
        // Create order in backend
        apiRequest("POST", "/api/reseller/epos/checkout", {
          items: parsedItems.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            isResellerProduct: item.isResellerProduct,
            productType: item.productType,
          })),
          customerEmail: storedEmail || null,
          customerPhone: storedPhone,
          customerFirstName: storedFirstName,
          customerLastName: storedLastName,
          paymentMethod: "card_square",
          totalAmount: total,
          subtotal: subtotal,
          discountAmount: parsedCoupon?.discount || 0,
          couponCode: parsedCoupon?.coupon?.code || null,
          couponId: parsedCoupon?.coupon?.id || null,
          squarePaymentId: transactionId || squareOrderId,
          fulfilmentMethod: storedDeliveryMethod,
          deliveryAddress: parsedDeliveryAddress,
        }).then(async (response) => {
          const data = await response.json();
          
          setReceiptData({
            orderNumber: data.orderNumber,
            ownProductOrderNumber: data.isMixed ? data.ownProductOrderNumber : null,
            isMixed: data.isMixed,
            timestamp: new Date().toLocaleString("en-GB"),
            items: parsedItems.map((item: any) => ({
              name: item.name,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
            })),
            subtotal: subtotal,
            total: total,
            paymentMethod: "Card (Square)",
            customerEmail: storedEmail,
          });
          
          // Only clear stored data AFTER order is successfully created
          clearSquareSessionData();
          
          setShowReceipt(true);
          queryClient.invalidateQueries({ queryKey: ["/api/reseller/epos/products"] });
          queryClient.invalidateQueries({ queryKey: ['/api/reseller/orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/reseller/inventory'] });
          
          toast({
            title: "Order Complete!",
            description: data.isMixed
              ? `Orders ${data.orderNumber} + ${data.ownProductOrderNumber} created. Receipt sent to ${storedEmail}`
              : `Order ${data.orderNumber} has been processed. Receipt sent to ${storedEmail}`,
          });
        }).catch((error) => {
          console.error('Order creation error:', error);
          // Do NOT clear session storage on failure — data is preserved so the
          // reseller can reload the page and retry, or admin can create manually.
          toast({
            title: "Order Creation Issue",
            description: "Payment was successful but there was an issue saving the order. Do not refresh — please contact support with the payment reference.",
            variant: "destructive",
            duration: 15000,
          });
        });
      }
    }
  }, []);

  // ── Handle return from Stripe Direct checkout ─────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeComplete = urlParams.get('stripe_direct_complete');
    const stripeCancelled = urlParams.get('stripe_direct_cancelled');
    const sessionId = urlParams.get('session_id');

    if (stripeCancelled === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      toast({ title: "Payment Cancelled", description: "The Stripe payment was cancelled. Your cart is still ready.", variant: "destructive" });
      return;
    }

    if (stripeComplete === '1' && sessionId) {
      window.history.replaceState({}, '', window.location.pathname);

      const storedItems = sessionStorage.getItem('resellerEposStripeItems');
      const storedFirstName = sessionStorage.getItem('resellerEposStripeFirstName') || 'EPOS';
      const storedLastName = sessionStorage.getItem('resellerEposStripeLastName') || 'Customer';
      const storedPhone = sessionStorage.getItem('resellerEposStripePhone') || '';
      const storedTotal = parseFloat(sessionStorage.getItem('resellerEposStripeTotal') || '0');

      const clearStripeSessionData = () => {
        sessionStorage.removeItem('resellerEposStripeItems');
        sessionStorage.removeItem('resellerEposStripeFirstName');
        sessionStorage.removeItem('resellerEposStripeLastName');
        sessionStorage.removeItem('resellerEposStripePhone');
        sessionStorage.removeItem('resellerEposStripeTotal');
      };

      if (!storedItems) {
        toast({ title: "Payment Received", description: "Stripe payment confirmed but cart data was not found. Please check your orders.", duration: 10000 });
        return;
      }

      const parsedItems = JSON.parse(storedItems);

      apiRequest("POST", "/api/reseller/epos/confirm-stripe-direct-payment", {
        sessionId,
        items: parsedItems,
        customerFirstName: storedFirstName,
        customerLastName: storedLastName,
        customerPhone: storedPhone,
        totalAmount: storedTotal,
      }).then(async (response) => {
        const data = await response.json();

        setReceiptData({
          orderNumber: data.orderNumber,
          ownProductOrderNumber: null,
          isMixed: false,
          timestamp: new Date().toLocaleString("en-GB"),
          items: parsedItems.map((item: any) => ({
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
          })),
          subtotal: storedTotal,
          total: storedTotal,
          paymentMethod: "Card (Stripe Direct)",
          customerEmail: '',
        });

        clearStripeSessionData();
        setShowReceipt(true);
        queryClient.invalidateQueries({ queryKey: ["/api/reseller/epos/products"] });
        queryClient.invalidateQueries({ queryKey: ['/api/reseller/orders'] });

        toast({ title: "Order Complete!", description: `Order ${data.orderNumber} processed — paid directly to your Stripe account.` });
      }).catch(() => {
        toast({
          title: "Order Creation Issue",
          description: "Payment was successful but the order could not be saved. Please contact support with your Stripe session ID.",
          variant: "destructive",
          duration: 15000,
        });
      });
    }
  }, []);

  // Initialize PayPal when PayPal payment method is selected
  useEffect(() => {
    if (showCheckout && paymentMethod === 'paypal' && cartItems.length > 0 && !isPaypalInitialized) {
      initializePayPal({
        amount: discountedTotal,
        currency: "GBP",
        onSuccess: async (orderId, captureData) => {
          // Handle successful PayPal payment - create order
          try {
            const response = await apiRequest("POST", "/api/reseller/epos/checkout", {
              items: cartItems.map(item => ({
                productId: item.productId,
                name: item.name,
                sku: item.sku,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                isResellerProduct: item.isResellerProduct,
              })),
              customerEmail,
              customerPhone,
              customerFirstName,
              customerLastName,
              fulfilmentMethod: deliveryMethod,
              deliveryAddress: {
                address: deliveryAddress,
                city: deliveryCity,
                postcode: deliveryPostcode,
                country: deliveryCountry,
              },
              paymentMethod: "PayPal",
              paypalOrderId: orderId,
              couponCode: appliedCoupon?.coupon?.code || null,
              discountAmount: appliedCoupon?.discount || 0,
            });

            const data = await response.json();

            // Show receipt
            setReceiptData({
              orderNumber: data.orderNumber || `EPOS-${Date.now()}`,
              ownProductOrderNumber: data.isMixed ? data.ownProductOrderNumber : null,
              isMixed: data.isMixed,
              timestamp: new Date().toLocaleString('en-GB'),
              items: cartItems.map(item => ({
                name: item.name,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
              })),
              subtotal: cartTotal,
              total: discountedTotal,
              paymentMethod: "PayPal",
              customerEmail,
            });

            resetSession();
            setShowReceipt(true);

            toast({
              title: "Payment Successful",
              description: data.isMixed
                ? `Orders ${data.orderNumber} + ${data.ownProductOrderNumber} created.`
                : "PayPal payment completed successfully.",
            });

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['/api/reseller/orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/reseller/inventory'] });
          } catch (error: any) {
            console.error("Order creation error:", error);
            toast({
              title: "Order Error",
              description: "Payment received but order creation failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        onError: () => {
          setIsPaymentProcessing(false);
        },
        onCancel: () => {
          setIsPaymentProcessing(false);
        },
      });
    }
  }, [showCheckout, paymentMethod, cartItems.length, isPaypalInitialized, discountedTotal]);

  // Validate coupon mutation (B2B Partner Coupons - reseller-specific, NOT main 1stRep coupons)
  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      // Use B2B partner coupon validation endpoint with reseller's ID
      if (!resellerProfile?.id) {
        throw new Error("Reseller profile not loaded");
      }
      
      const response = await apiRequest("POST", "/api/b2b/validate-coupon", {
        code,
        partnerId: resellerProfile.id,
        // Only count 1stRep catalogue items — coupon must never apply to the reseller's own products
        orderTotal: firstRepSubtotal,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid coupon code");
      }
      const data = await response.json();
      
      // Check validity in mutationFn so errors trigger onError handler
      if (!data.valid || !data.coupon) {
        throw new Error(data.error || "Invalid coupon code");
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Map B2B coupon response to frontend format
      const mappedCoupon = {
        coupon: data.coupon,
        discount: parseFloat(data.calculatedDiscount) || 0,
      };
      setAppliedCoupon(mappedCoupon);
      
      // Format discount message based on coupon type
      const discountText = data.coupon.discountType === 'percentage' 
        ? `${Number(data.coupon.discountValue)}% discount applied` 
        : `£${parseFloat(data.calculatedDiscount || 0).toFixed(2)} discount applied`;
      
      toast({
        title: "Coupon Applied!",
        description: discountText,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Coupon",
        description: error?.message || "This coupon code is not valid for this store",
        variant: "destructive",
      });
    },
  });

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      validateCouponMutation.mutate(couponCode.trim());
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // Complete purchase mutation - calls backend API to create order and send email (for cash)
  const completePurchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reseller/epos/checkout", {
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isResellerProduct: item.isResellerProduct,
          productType: item.productType,
        })),
        customerEmail,
        customerPhone,
        customerFirstName,
        customerLastName,
        paymentMethod,
        totalAmount: discountedTotal,
        subtotal: cartTotal,
        discountAmount: appliedCoupon?.discount || 0,
        couponCode: appliedCoupon?.coupon?.code || null,
        couponId: appliedCoupon?.coupon?.id || null,
        fulfilmentMethod: deliveryMethod,
        deliveryAddress: {
          address: deliveryAddress,
          city: deliveryCity,
          postcode: deliveryPostcode,
          country: deliveryCountry,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setReceiptData({
        orderNumber: data.orderNumber,
        ownProductOrderNumber: data.isMixed ? data.ownProductOrderNumber : null,
        isMixed: data.isMixed,
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
        total: discountedTotal,
        paymentMethod: paymentMethod === "cash" ? "Cash" : paymentMethod === "bank_transfer" ? "Bank Transfer" : paymentMethod === "card_reader" ? "Card (Terminal)" : "Card",
        customerEmail,
      });
      
      resetSession();
      setShowReceipt(true);
      
      toast({
        title: "Order Complete!",
        description: data.isMixed
          ? `Orders ${data.orderNumber} + ${data.ownProductOrderNumber} created. Receipt sent to ${customerEmail}`
          : `Order ${data.orderNumber} has been processed. Receipt sent to ${customerEmail}`,
      });
    },
    onError: (error: any) => {
      // Parse clean message from "STATUS: {json}" format
      let description = "Failed to complete purchase. Please try again.";
      try {
        const raw = error.message || "";
        const jsonStart = raw.indexOf("{");
        if (jsonStart !== -1) {
          const parsed = JSON.parse(raw.slice(jsonStart));
          if (parsed.error) description = parsed.error;
        } else if (raw) {
          description = raw;
        }
      } catch {}
      // If the terminal payment was taken but order creation failed, show recovery state
      if (terminalStatus === "paid") {
        setTerminalStatus("order_error");
      }
      toast({
        title: "Order Failed",
        description,
        variant: "destructive",
      });
    },
  });

  // ── Bank transfer confirmation ────────────────────────────────────────────
  const handleBankTransferConfirm = async () => {
    setIsBankTransferProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/reseller/epos/checkout", {
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isResellerProduct: item.isResellerProduct,
          productType: item.productType,
        })),
        customerEmail: customerEmail || null,
        customerPhone,
        customerFirstName,
        customerLastName,
        paymentMethod: "bank_transfer",
        totalAmount: discountedTotal,
        subtotal: cartTotal,
        discountAmount: appliedCoupon?.discount || 0,
        couponCode: appliedCoupon?.coupon?.code || null,
        couponId: appliedCoupon?.coupon?.id || null,
        fulfilmentMethod: deliveryMethod,
        deliveryAddress: {
          address: deliveryAddress,
          city: deliveryCity,
          postcode: deliveryPostcode,
          country: deliveryCountry,
        },
      });
      const data = await response.json();
      if (data.orderNumber || data.success) {
        setReceiptData({
          orderNumber: data.orderNumber,
          ownProductOrderNumber: data.isMixed ? data.ownProductOrderNumber : null,
          isMixed: data.isMixed,
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
          total: discountedTotal,
          paymentMethod: "Bank Transfer",
          customerEmail,
        });
        resetSession();
        setShowReceipt(true);
        setBankTransferRef("");
      }
    } catch (error: any) {
      toast({ title: "Failed to record payment", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsBankTransferProcessing(false);
    }
  };

  // ── Terminal session helpers ──────────────────────────────────────────────

  const stopTerminalPolling = () => {
    if (terminalPollingRef.current) clearInterval(terminalPollingRef.current);
    if (terminalElapsedRef.current) clearInterval(terminalElapsedRef.current);
    terminalPollingRef.current = null;
    terminalElapsedRef.current = null;
  };

  const cancelTerminalSession = async () => {
    stopTerminalPolling();
    if (terminalSessionId) {
      try {
        await apiRequest("DELETE", `/api/epos/terminal-session/${terminalSessionId}`);
      } catch {}
    }
    setTerminalSessionId(null);
    setTerminalStatus("idle");
    setTerminalWebhookUrl("");
    setTerminalElapsed(0);
    terminalAutoCompleteRef.current = false;
  };

  const createTerminalSessionMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/epos/create-terminal-session", { amount, currency: "GBP" });
      return res.json();
    },
    onSuccess: (data) => {
      setTerminalSessionId(data.sessionId);
      setTerminalStatus("pending");
      setTerminalWebhookUrl(data.webhookUrl);
      setTerminalElapsed(0);
      terminalAutoCompleteRef.current = false;

      // Elapsed timer
      terminalElapsedRef.current = setInterval(() => {
        setTerminalElapsed(prev => prev + 1);
      }, 1000);

      // Poll every 2 seconds
      terminalPollingRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/epos/terminal-session/${data.sessionId}`, { credentials: "include" });
          if (!r.ok) { return; }
          const s = await r.json();

          if (s.status === "paid" && !terminalAutoCompleteRef.current) {
            terminalAutoCompleteRef.current = true;
            stopTerminalPolling();
            setTerminalStatus("paid");
            // Auto-complete the purchase
            completePurchaseMutation.mutate();
          } else if (s.status === "expired" || s.status === "cancelled") {
            stopTerminalPolling();
            setTerminalStatus(s.status as any);
          }
        } catch {}
      }, 2000);
    },
    onError: () => {
      setTerminalStatus("error");
      toast({ title: "Session Error", description: "Could not create payment session. Try again.", variant: "destructive" });
    },
  });

  // When payment method changes away from card_reader, cancel any pending session
  // When switching TO card_reader, show validation hints immediately
  useEffect(() => {
    if (paymentMethod !== "card_reader") {
      cancelTerminalSession();
    } else {
      setCheckoutAttempted(true);
    }
  }, [paymentMethod]);

  // Auto-start terminal session when Tap/Insert is selected and checkout info is complete
  useEffect(() => {
    if (
      paymentMethod === "card_reader" &&
      isCheckoutInfoComplete &&
      terminalStatus === "idle" &&
      showCheckout &&
      !createTerminalSessionMutation.isPending
    ) {
      createTerminalSessionMutation.mutate(discountedTotal);
    }
  }, [paymentMethod, isCheckoutInfoComplete, terminalStatus, showCheckout, discountedTotal]);

  // When checkout closes, cancel any pending session
  useEffect(() => {
    if (!showCheckout) {
      cancelTerminalSession();
    }
  }, [showCheckout]);

  const printReceipt = () => {
    window.print();
  };

  const storeName = resellerProfile?.businessName || "Reseller Store";

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Checking session...</p>
        </div>
      </div>
    );
  }

  // PIN Lock Screen - shows either PIN entry or PIN setup form
  if (isLocked) {
    // Show PIN Setup form when required (first-time login or weak PIN blocked)
    if (showPinSetupDialog) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-8"
          >
            <Card className="bg-white/5 border-white/10 p-8">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${weakPinBlocked ? 'bg-red-600/20' : 'bg-emerald-600/20'}`}>
                  {weakPinBlocked ? (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  ) : (
                    <KeyRound className="w-8 h-8 text-emerald-400" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {weakPinBlocked ? "PIN Update Required" : "Welcome! Set Your PIN"}
                </h2>
                <p className="text-white/60 text-sm">
                  {weakPinBlocked 
                    ? "The PIN '1234' is not secure. Please create a new PIN."
                    : "Please create a secure 4-digit PIN for EPOS terminal access."
                  }
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm block mb-2">New PIN (4 digits)</label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit PIN"
                    className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-widest"
                    data-testid="input-new-pin"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm block mb-2">Confirm PIN</label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirm 4-digit PIN"
                    className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-widest"
                    data-testid="input-confirm-pin"
                  />
                </div>
                
                {pinSetupError && (
                  <p className="text-red-400 text-sm text-center">{pinSetupError}</p>
                )}
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Avoid simple PINs like 1234, 0000, or repeated digits. Your PIN should be unique and memorable.</span>
                  </p>
                </div>
                
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSetNewPin}
                  disabled={isSettingPin || newPinInput.length !== 4 || confirmPinInput.length !== 4}
                  data-testid="button-save-new-pin"
                >
                  {isSettingPin ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting PIN...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save PIN & Continue
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      );
    }
    
    // Regular PIN Entry screen
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8"
        >
          <Card className="bg-white/5 border-white/10 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Secure EPOS Access</h1>
              <p className="text-white/60">Enter your 4-digit PIN to unlock</p>
              <p className="text-white/40 text-xs mt-2">First time? Use: 1234</p>
              <p className="text-emerald-400/60 text-xs mt-1">Change PIN in reseller settings</p>
            </div>

            {/* PIN Display */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                    pinInput.length > i
                      ? pinError
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-emerald-500 bg-emerald-500/20'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  {pinInput.length > i && (
                    <div className={`w-3 h-3 rounded-full ${
                      pinError ? 'bg-red-400' : 'bg-emerald-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {pinError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-center text-sm mb-4"
              >
                Invalid PIN. Please try again.
              </motion.p>
            )}

            {/* PIN Verification Loading */}
            {isVerifyingPin && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="text-white/60 text-sm">Verifying PIN...</span>
              </div>
            )}

            {/* PIN Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map((digit, idx) => (
                digit ? (
                  <Button
                    key={digit}
                    variant="ghost"
                    className="h-14 text-2xl font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                    onClick={() => handlePinKeyPress(digit)}
                    disabled={isVerifyingPin}
                    data-testid={`button-pin-${digit}`}
                  >
                    {digit}
                  </Button>
                ) : (
                  <div key={`empty-${idx}`} />
                )
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={clearPinInput}
                data-testid="button-clear-pin"
              >
                Clear
              </Button>
              <Link href="/reseller/dashboard" className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full text-white/60 hover:text-white"
                  data-testid="button-back-dashboard"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={oskContainerRef} className={`min-h-screen bg-black ${activeInputId ? "pb-72" : ""}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              {/* 1stRep Logo */}
              <img 
                src="/1strep-header-logo.png" 
                alt="1stRep" 
                className="h-10 w-auto"
                data-testid="img-1strep-logo"
              />
              <div className="h-8 w-px bg-white/20" />
              <Store className="w-8 h-8 text-emerald-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">{storeName}</h1>
                <p className="text-xs text-white/60">Reseller EPOS</p>
              </div>
              {resellerProfile?.tier && (
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                  {resellerProfile.tier.toUpperCase()}
                </Badge>
              )}
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

            {/* View Toggle & Cart */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowShowReel(true)}
                className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                data-testid="button-show-reel"
              >
                <Tv className="w-4 h-4" />
                Show Reel
              </Button>
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
                    className="gap-2 h-12 px-6 rounded-full relative bg-emerald-600 hover:bg-emerald-700"
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
                    {basketTimeLeft !== null && basketTimeLeft > 0 && cartItems.length > 0 && (
                      <p className={`text-sm ${basketTimeLeft <= 60 ? 'text-red-400' : 'text-white/50'}`}>
                        Basket expires in {Math.floor(basketTimeLeft / 60)}:{String(basketTimeLeft % 60).padStart(2, '0')}
                      </p>
                    )}
                  </SheetHeader>
                  
                  <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
                    {cartItems.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <ShoppingCart className="w-16 h-16 text-white/20 mb-4" />
                        <p className="text-white/60 text-lg">Your cart is empty</p>
                        <p className="text-white/40 text-sm mt-2">Add products from your inventory</p>
                      </div>
                    ) : (
                      <>
                        <div className="pb-3 border-b border-white/10 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white/60">Subtotal ({cartCount} items)</span>
                            <span className="text-2xl font-bold text-white">
                              {formatCurrency(cartTotal)}
                            </span>
                          </div>
                          <Button
                            size="lg"
                            className="w-full h-14 text-lg gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
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
                                    <p className="text-emerald-400 font-bold mt-2">
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

                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                className={`rounded-full whitespace-nowrap ${
                  selectedCategory === category 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category}`}
              >
                {category === "all" ? "All Products" : category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {productsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/60 text-xl">No products yet</p>
            <p className="text-white/40 mt-2">Order products from the wholesale catalogue to stock your store</p>
            <Link href="/reseller/dashboard">
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/60 text-xl">No products found</p>
            <p className="text-white/40 mt-2">Try adjusting your search or category</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "large" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          }`}>
            {filteredProducts.map((product, index) => {
              const totalStock = getTotalStock(product);
              const isOutOfStock = totalStock <= 0;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`group bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-emerald-500/50 ${
                      isOutOfStock ? 'opacity-60' : ''
                    }`}
                    onClick={() => !isOutOfStock && openProductModal(product)}
                    onMouseEnter={() => setHoveredProductId(product.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className={`relative overflow-hidden ${
                      viewMode === "large" ? "aspect-[4/5]" : "aspect-square"
                    }`}>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                        <ShoppingBag className="w-12 h-12 text-white/25" />
                      </div>
                      {product.imageUrl && (
                        <img
                          src={convertToDirectUrl(product.imageUrl)}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      {!isOutOfStock && (
                        <Button
                          size="icon"
                          className="absolute bottom-3 right-3 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg bg-emerald-600 hover:bg-emerald-700"
                          onClick={(e) => handleQuickAdd(product, e)}
                          data-testid={`button-quick-add-${product.id}`}
                        >
                          <Plus className="w-6 h-6" />
                        </Button>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge className="bg-red-600 text-white border-0 text-sm px-3 py-1">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                      {product.productType === 'own_product' && (
                        <Badge className="absolute top-2 left-2 bg-purple-600 text-white border-0 text-xs px-2 py-0.5">
                          Own Product
                        </Badge>
                      )}
                    </div>
                    <CardContent className={`${viewMode === "large" ? "p-5" : "p-3"}`}>
                      <h3 className={`font-semibold text-white mb-1 line-clamp-2 ${
                        viewMode === "large" ? "text-lg" : "text-sm"
                      }`}>
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-white/40 text-xs">{product.sku}</p>
                        {product.productType === 'own_product' && product.category && (
                          <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className={`font-bold text-emerald-400 ${
                            viewMode === "large" ? "text-2xl" : "text-lg"
                          }`}>
                            {formatCurrency(parseFloat(product.retailPrice))}
                          </p>
                        </div>
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
      </main>

      {/* Full-screen Zoom Viewer */}
      {isZoomOpen && selectedProduct && currentImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center">
          <button
            onClick={() => {
              setIsZoomOpen(false);
              setZoomLevel(1);
              setViewerZoomed(false);
            }}
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
            data-testid="button-close-zoom"
          >
            <X className="w-6 h-6" />
          </button>
          
          {filteredGalleryImages.length > 1 && (
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
            <span className="text-white/80 text-sm">Click to zoom</span>
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
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-4xl lg:max-w-6xl bg-black border-white/10 p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedProduct?.name || 'Product Details'}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-0">
              {/* Left: Image Gallery with Zoom */}
              <div className="p-4 space-y-3 relative overflow-visible">
                {/* Main Image with Hover Lens */}
                <div 
                  ref={mainImageRef}
                  className={`relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-white/5 to-white/0 ${currentImage ? 'cursor-zoom-in' : ''}`}
                  onClick={() => currentImage && setIsZoomOpen(true)}
                  onMouseEnter={() => currentImage && setShowLens(true)}
                  onMouseLeave={() => setShowLens(false)}
                  onMouseMove={handleMainImageMouseMove}
                >
                  {currentImage ? (
                    <img
                      src={convertToDirectUrl(currentImage)}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain transition-all duration-300"
                      data-testid="img-product-modal-main"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-24 h-24 text-white/20" />
                    </div>
                  )}
                  
                  {/* Hover lens indicator */}
                  {showLens && currentImage && (
                    <div 
                      className="absolute w-24 h-24 border-2 border-white/50 rounded-lg pointer-events-none transition-opacity duration-150 bg-white/10"
                      style={{
                        left: `calc(${lensPosition.x}% - 48px)`,
                        top: `calc(${lensPosition.y}% - 48px)`,
                      }}
                    />
                  )}
                  
                  {/* Zoom icon overlay */}
                  {currentImage && (
                    <div className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full">
                      <ZoomIn className="w-4 h-4 text-white/70" />
                    </div>
                  )}
                  
                  {/* Magnified preview panel */}
                  {showLens && currentImage && (
                    <div className="hidden lg:block fixed top-1/2 right-8 -translate-y-1/2 w-72 h-72 rounded-md overflow-hidden bg-gray-900 border border-gray-700 shadow-2xl z-[100] pointer-events-none">
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
                
                {/* Thumbnail Gallery */}
                {filteredGalleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {filteredGalleryImages.map((image, index) => (
                      <button
                        key={`thumb-${index}`}
                        onClick={() => setActiveImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                          safeActiveIndex === index 
                            ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 ring-offset-black' 
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        data-testid={`button-thumbnail-${index}`}
                      >
                        <img
                          src={convertToDirectUrl(image.url)}
                          alt={`${selectedProduct.name} - ${image.label}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Details */}
              <div className="p-6 flex flex-col space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Category Badge */}
                <Badge className="w-fit text-xs bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                  {selectedProduct.category}
                </Badge>
                
                {/* Product Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-product-name">
                  {selectedProduct.name}
                </h2>
                
                {/* SKU */}
                <p className="text-sm text-white/50">
                  SKU: {selectedProduct.sku}
                </p>

                {/* Price */}
                <div className="space-y-1">
                  <p className="text-2xl md:text-3xl font-semibold text-emerald-400" data-testid="text-product-price">
                    {formatCurrency(parseFloat(selectedProduct.retailPrice))}
                  </p>
                  <p className="text-white/40 text-sm">
                    Your cost: {formatCurrency(parseFloat(selectedProduct.wholesalePrice))}
                  </p>
                </div>

                {/* Description */}
                {fullProductData?.description && (
                  <p className="text-gray-400 leading-relaxed text-sm" data-testid="text-product-description">
                    {fullProductData.description}
                  </p>
                )}

                <Separator className="bg-white/10" />

                {/* Size Selection */}
                {selectedProduct.sizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      SELECT SIZE
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {sortSizes(selectedProduct.sizes).map((size) => {
                        // Check stock with the current colour
                        const stockWithCurrentColor = getInventoryStock(selectedProduct, size, selectedColor);
                        // Check if ANY colour has stock for this size (so we never grey out a size that exists)
                        const hasStockInAnyColor = selectedProduct.colors.length === 0
                          ? stockWithCurrentColor > 0
                          : selectedProduct.colors.some(c => getInventoryStock(selectedProduct, size, c) > 0);
                        const isOutOfStock = !hasStockInAnyColor;
                        // Size is compatible with current colour selection
                        const compatibleWithColor = stockWithCurrentColor > 0;

                        return (
                          <button
                            key={size}
                            onClick={() => {
                              if (isOutOfStock) return;
                              setSelectedSize(size);
                              // If current colour has no stock for this size, auto-switch to first compatible colour
                              if (!compatibleWithColor) {
                                const firstCompatible = selectedProduct.colors.find(
                                  c => getInventoryStock(selectedProduct, size, c) > 0
                                );
                                if (firstCompatible) setSelectedColor(firstCompatible);
                              }
                            }}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 text-sm border rounded-md transition-colors min-h-10 min-w-[48px] ${
                              selectedSize === size
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isOutOfStock
                                  ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed line-through'
                                  : !compatibleWithColor
                                    ? 'bg-gray-900 text-amber-400 border-amber-600 hover:border-amber-400'
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
                )}

                {/* Colour Selection */}
                {selectedProduct.colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      SELECT COLOUR
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.colors.map((color) => {
                        const stock = getInventoryStock(selectedProduct, selectedSize, color);
                        const isOutOfStock = stock <= 0;
                        
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              if (isOutOfStock) return;
                              setSelectedColor(color);
                              setActiveImageIndex(0);
                            }}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 text-sm border rounded-md transition-colors min-h-10 ${
                              selectedColor === color
                                ? 'bg-emerald-600 text-white border-emerald-600'
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
                )}

                {/* Stock Status */}
                {(selectedSize || selectedProduct.sizes.length === 0) && (selectedColor || selectedProduct.colors.length === 0) && (
                  <div>
                    {(() => {
                      const stock = getInventoryStock(selectedProduct, selectedSize, selectedColor);
                      return (
                        <p className={`text-sm font-medium ${stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stock > 0 ? (
                            <span>{stock} in stock</span>
                          ) : (
                            <span>Out of stock for this combination</span>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    QUANTITY
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      className="w-10 h-10 flex items-center justify-center border border-gray-600 rounded-md text-white hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      data-testid="button-qty-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-bold text-white w-10 text-center">
                      {selectedQuantity}
                    </span>
                    <button
                      className="w-10 h-10 flex items-center justify-center border border-gray-600 rounded-md text-white hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                      data-testid="button-qty-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart */}
                <Button
                  size="lg"
                  onClick={addToCart}
                  disabled={(selectedProduct.sizes.length > 0 && !selectedSize) || (selectedProduct.colors.length > 0 && !selectedColor)}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 min-h-12 text-base font-semibold rounded-md gap-2"
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>

                {/* Features */}
                {fullProductData?.features && fullProductData.features.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Features</h3>
                    <ul className="space-y-2">
                      {fullProductData.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-gray-400">
                          <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
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
        </DialogContent>
      </Dialog>

      {/* Checkout Modal - rendered inline for on-screen keyboard compatibility */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/80 overflow-y-auto" data-testid="checkout-overlay">
          <div className={`relative w-full max-w-6xl bg-black border border-white/10 rounded-lg max-h-[95vh] overflow-y-auto p-8 mx-4 ${activeInputId ? "pb-80" : ""}`}>
            <button
              type="button"
              onClick={() => setShowCheckout(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 text-white hover:opacity-100 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex flex-col space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl text-white flex items-center gap-2 font-semibold">
                  <CreditCard className="w-8 h-8 text-emerald-500" />
                  Checkout
                </h2>
                <Badge 
                  variant={checkoutTimeRemaining <= 10 ? "destructive" : "secondary"}
                  className={`text-lg font-mono ${checkoutTimeRemaining <= 10 ? "animate-pulse" : ""}`}
                  data-testid="badge-checkout-timer"
                >
                  {Math.floor(checkoutTimeRemaining / 60)}:{(checkoutTimeRemaining % 60).toString().padStart(2, '0')}
                </Badge>
              </div>
              <p className="text-base text-white/60">
                Complete your sale before time expires
              </p>
            </div>

          <div className={`grid grid-cols-1 ${!allOwnProducts ? 'lg:grid-cols-2' : ''} gap-6 mt-2`}>
            {/* Left Column - Customer Details (hidden when all items are reseller's own products) */}
            {!allOwnProducts && (
            <div className="space-y-3">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Customer Name *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="First name"
                    value={customerFirstName}
                    onChange={(e) => setCustomerFirstName(e.target.value)}
                    className={`h-12 bg-white/5 border-white/10 text-white text-base ${checkoutAttempted && !customerFirstName.trim() ? 'border-amber-400' : ''}`}
                    data-testid="input-customer-first-name"
                  />
                  <Input
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="Last name"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white text-base"
                    data-testid="input-customer-last-name"
                  />
                </div>
                {checkoutAttempted && !customerFirstName.trim() && (
                  <p className="text-sm text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    First name is required
                  </p>
                )}
              </div>

              {/* Customer Email */}
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Customer Email for Receipt <span className="text-red-400">*</span></Label>
                <Input
                  type="text"
                  inputMode="email"
                  autoComplete="one-time-code"
                  placeholder="customer@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`h-12 bg-white/5 border-white/10 text-white text-base ${checkoutAttempted && !validateEmail(customerEmail) ? 'border-amber-400' : ''}`}
                  data-testid="input-checkout-email"
                />
              </div>

              {/* Customer Phone Number */}
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Customer Phone Number <span className="text-red-400">*</span></Label>
                <Input
                  type="text"
                  inputMode="tel"
                  autoComplete="one-time-code"
                  placeholder="07123 456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`h-12 bg-white/5 border-white/10 text-white text-base ${customerPhone.length > 0 && customerPhone.trim().length < 7 ? 'border-red-400' : ''}`}
                  data-testid="input-checkout-phone"
                />
                {customerPhone.length > 0 && customerPhone.trim().length < 7 && (
                  <p className="text-red-400 text-sm">Please enter a valid phone number</p>
                )}
              </div>

              {/* Coupon Code Section */}
              <div className="space-y-2">
                <Label className="text-white/60 text-sm flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  Coupon Code
                </Label>
                {!appliedCoupon ? (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-white/5 border-white/10 text-white text-base"
                        data-testid="input-coupon-code"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={validateCouponMutation.isPending || !couponCode.trim()}
                        className="border-white/20 text-white"
                        data-testid="button-apply-coupon"
                      >
                        {validateCouponMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-white/40">Enter B2B partner coupon codes created in your admin dashboard</p>
                  </>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="font-medium text-emerald-400">{appliedCoupon.coupon.code}</span>
                        <span className="text-sm text-white/60">({appliedCoupon.coupon.discountType === 'percentage' ? `${Number(appliedCoupon.coupon.discountValue)}% off` : `£${Number(appliedCoupon.coupon.discountValue).toFixed(2)} off`})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveCoupon}
                        className="text-white/60"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {hasMixedProducts && (
                      <p className="text-xs text-amber-400/80">
                        Discount applies to 1stRep catalogue items only — not your own products
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Fulfilment Method */}
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Fulfilment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={deliveryMethod === "delivery" ? "default" : "outline"}
                    className={`h-12 gap-2 ${
                      deliveryMethod === "delivery" 
                        ? "bg-emerald-600" 
                        : "border-white/20 text-white"
                    }`}
                    onClick={() => setDeliveryMethod("delivery")}
                    data-testid="button-fulfilment-delivery"
                  >
                    <Truck className="w-4 h-4" />
                    Delivery
                  </Button>
                  <Button
                    variant={deliveryMethod === "collection" ? "default" : "outline"}
                    className={`h-12 gap-2 ${
                      deliveryMethod === "collection" 
                        ? "bg-emerald-600" 
                        : "border-white/20 text-white"
                    }`}
                    onClick={() => setDeliveryMethod("collection")}
                    data-testid="button-fulfilment-collection"
                  >
                    <Store className="w-4 h-4" />
                    Collect from Store
                  </Button>
                </div>
              </div>

              {/* Delivery Address - only shown for delivery method */}
              {deliveryMethod === "delivery" && (
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">Delivery Address <span className="text-red-400">*</span></Label>
                  <Input
                    type="text"
                    placeholder="Street address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    autoComplete="off"
                    name="epos-addr-street"
                    className="h-12 bg-white/5 border-white/10 text-white text-base"
                    data-testid="input-delivery-address"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="text"
                      placeholder="City"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      autoComplete="off"
                      name="epos-addr-city"
                      className="h-12 bg-white/5 border-white/10 text-white text-base"
                      data-testid="input-delivery-city"
                    />
                    <Input
                      type="text"
                      placeholder="Postcode"
                      value={deliveryPostcode}
                      onChange={(e) => setDeliveryPostcode(e.target.value)}
                      autoComplete="off"
                      name="epos-addr-postcode"
                      className="h-12 bg-white/5 border-white/10 text-white text-base"
                      data-testid="input-delivery-postcode"
                    />
                    <Input
                      type="text"
                      placeholder="Country"
                      value={deliveryCountry}
                      onChange={(e) => setDeliveryCountry(e.target.value)}
                      autoComplete="off"
                      name="epos-addr-country"
                      className="h-12 bg-white/5 border-white/10 text-white text-base"
                      data-testid="input-delivery-country"
                    />
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Right Column - Order Summary & Payment */}
            <div className="space-y-3">
              {/* Optional Customer Name — own-product orders only */}
              {allOwnProducts && (
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">Customer Name <span className="text-white/30">(optional)</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      autoComplete="one-time-code"
                      placeholder="First name"
                      value={customerFirstName}
                      onChange={(e) => setCustomerFirstName(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 text-white text-base"
                    />
                    <Input
                      type="text"
                      autoComplete="one-time-code"
                      placeholder="Last name"
                      value={customerLastName}
                      onChange={(e) => setCustomerLastName(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 text-white text-base"
                    />
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/60 text-sm mb-2">Order Summary</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between gap-2 text-sm">
                      <span className="text-white truncate flex-1">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-white/80">
                        {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2 bg-white/10" />
                {appliedCoupon && (
                  <>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="text-white/60">Subtotal</span>
                      <span className="text-white/80">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-sm text-emerald-400">
                      <span>Discount ({appliedCoupon.coupon.discountType === 'percentage' ? `${Number(appliedCoupon.coupon.discountValue)}%` : `£${Number(appliedCoupon.coupon.discountValue).toFixed(2)}`})</span>
                      <span>-{formatCurrency(appliedCoupon.discount)}</span>
                    </div>
                    <Separator className="my-1 bg-white/10" />
                  </>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-white font-semibold text-sm">Total</span>
                  <span className="text-emerald-400 text-lg font-bold">
                    {formatCurrency(discountedTotal)}
                  </span>
                </div>
              </div>

              {/* Store Contact */}
              {resellerProfile?.phoneNumber && (
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                  <Phone className="w-3 h-3 text-white/60" />
                  <span className="text-white/60 text-sm">Store:</span>
                  <a href={`tel:${resellerProfile.phoneNumber}`} className="text-white hover:text-emerald-400 text-sm font-medium">
                    {resellerProfile.phoneNumber}
                  </a>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Payment Method</Label>
                {allOwnProducts && resellerProfile?.ownSquareSetup ? (
                  // Reseller has own Square connected — Square QR is primary (auto-confirms payment)
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="default"
                      onClick={() => setPaymentMethod("qr")}
                      className={`h-12 gap-2 px-4 ${paymentMethod === "qr" ? "bg-blue-600 text-white" : "bg-white/10 text-white/70"}`}
                      data-testid="button-payment-qr"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-sm font-semibold">Pay with Square</span>
                    </Button>
                    {resellerProfile?.eposBankDetails && (
                      <Button
                        variant="default"
                        onClick={() => setPaymentMethod("bank_transfer")}
                        className={`h-12 gap-2 px-4 ${paymentMethod === "bank_transfer" ? "bg-green-600 text-white" : "bg-white/10 text-white/70"}`}
                        data-testid="button-payment-bank-transfer"
                      >
                        <Building className="w-4 h-4" />
                        <span className="text-sm font-semibold">Bank Transfer</span>
                      </Button>
                    )}
                  </div>
                ) : allOwnProducts && resellerProfile?.eposBankDetails ? (
                  // No own Square — bank transfer is primary
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="default"
                      onClick={() => setPaymentMethod("bank_transfer")}
                      className={`h-12 gap-2 px-4 ${paymentMethod === "bank_transfer" ? "bg-green-600 text-white" : "bg-white/10 text-white/70"}`}
                      data-testid="button-payment-bank-transfer"
                    >
                      <Building className="w-4 h-4" />
                      <span className="text-sm font-semibold">Bank Transfer</span>
                    </Button>
                    {resellerProfile?.stripeChargesEnabled && (
                      <Button
                        variant="default"
                        onClick={() => setPaymentMethod("stripe_direct")}
                        className={`h-12 gap-2 px-4 ${paymentMethod === "stripe_direct" ? "bg-emerald-600 text-white" : "bg-white/10 text-white/70"}`}
                        data-testid="button-payment-stripe-direct"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-semibold">Direct Card (Stripe)</span>
                      </Button>
                    )}
                  </div>
                ) : allOwnProducts && resellerProfile?.stripeChargesEnabled ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="default"
                      onClick={() => setPaymentMethod("stripe_direct")}
                      className={`h-12 gap-2 px-4 ${paymentMethod === "stripe_direct" ? "bg-emerald-600 text-white" : "bg-white/10 text-white/70"}`}
                      data-testid="button-payment-stripe-direct"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm font-semibold">Direct Card (Your Stripe)</span>
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setPaymentMethod("qr")}
                      className={`h-12 gap-2 px-4 ${paymentMethod === "qr" ? "bg-blue-600 text-white" : "bg-white/10 text-white/70"}`}
                      data-testid="button-payment-qr"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-sm font-semibold">QR Pay (Square)</span>
                    </Button>
                  </div>
                ) : allOwnProducts ? (
                  <div className="space-y-2">
                    <Button
                      variant="default"
                      className="h-12 gap-2 px-6 bg-blue-600 text-white cursor-default"
                      data-testid="button-payment-qr"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-sm font-semibold">QR Pay (Square)</span>
                    </Button>
                    <div className="p-2 bg-amber-900/20 rounded-lg border border-amber-500/30 flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-amber-300/80 text-xs">Add your bank details in the Earnings section for instant direct payments — customers pay straight into your bank account, no middleman.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="h-12 gap-2 px-6 bg-blue-600 text-white cursor-default"
                      data-testid="button-payment-qr"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="text-sm font-semibold">QR Pay</span>
                    </Button>
                  </div>
                )}
              </div>

            {/* Tap/Insert Card Payment — Automatic Webhook Flow */}
            {paymentMethod === "card_reader" ? (
              <div className="space-y-3">
                {/* IDLE — waiting for checkout info to be complete (auto-starts when ready) */}
                {terminalStatus === "idle" && (
                  <>
                    <div className="p-4 bg-emerald-900/30 rounded-lg border border-emerald-700/50 text-center space-y-2">
                      {createTerminalSessionMutation.isPending ? (
                        <Loader2 className="w-10 h-10 text-emerald-400 mx-auto animate-spin" />
                      ) : (
                        <Nfc className="w-10 h-10 text-emerald-400 mx-auto" />
                      )}
                      <p className="text-emerald-300 font-semibold">
                        {createTerminalSessionMutation.isPending ? "Starting Card Reader…" : "Card Machine Ready"}
                      </p>
                      {!createTerminalSessionMutation.isPending && (
                        <p className="text-white/40 text-xs">
                          {isCheckoutInfoComplete
                            ? "Starting card reader session…"
                            : "Fill in the required fields above — the card reader will start automatically."}
                        </p>
                      )}
                      <div className="inline-flex items-center gap-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full px-3 py-1 mt-1">
                        <span className="text-emerald-300 font-bold text-lg">{formatCurrency(discountedTotal)}</span>
                      </div>
                    </div>
                    {!isCheckoutInfoComplete && (
                      <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                        <p className="text-amber-400 text-xs font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Please complete the required fields above — the card reader will start automatically once done
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* PENDING — waiting for card machine webhook */}
                {terminalStatus === "pending" && (
                  <div className="space-y-3">
                    <div className="p-5 bg-emerald-900/30 rounded-lg border border-emerald-600/50 text-center space-y-3">
                      <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                        <Nfc className="w-9 h-9 text-emerald-400 relative z-10" />
                      </div>
                      <div>
                        <p className="text-emerald-300 font-bold text-lg">Waiting for Payment</p>
                        <p className="text-white/50 text-sm">Present card or device on the machine now</p>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 rounded-full px-4 py-1.5">
                        <span className="text-emerald-300 font-black text-2xl">{formatCurrency(discountedTotal)}</span>
                      </div>
                      <p className="text-white/25 text-xs tabular-nums">{Math.floor(terminalElapsed / 60)}:{String(terminalElapsed % 60).padStart(2, "0")} elapsed · auto-expires in {Math.max(0, 5 - Math.floor(terminalElapsed / 60))} min</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white/60 gap-2"
                      onClick={() => cancelTerminalSession()}
                    >
                      <X className="w-4 h-4" /> Cancel Payment
                    </Button>
                  </div>
                )}

                {/* PAID — auto-completing order */}
                {(terminalStatus === "paid" || (completePurchaseMutation.isPending && terminalStatus !== "idle" && terminalStatus !== "order_error")) && (
                  <div className="p-5 bg-emerald-900/40 rounded-lg border border-emerald-500/50 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-emerald-300 font-bold text-lg">Payment Confirmed!</p>
                    <p className="text-white/50 text-sm">Creating order and sending receipt…</p>
                  </div>
                )}

                {/* ORDER ERROR — payment taken but order creation failed */}
                {terminalStatus === "order_error" && (
                  <div className="space-y-3">
                    <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-700/40 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-amber-300 font-semibold">Payment Taken — Order Not Created</p>
                      <p className="text-white/40 text-sm">The card was charged successfully, but the order could not be created. Tap "Retry Order" to try again, or note the amount and raise the order manually.</p>
                    </div>
                    <Button
                      className="w-full bg-emerald-600 gap-2"
                      disabled={completePurchaseMutation.isPending}
                      onClick={() => {
                        setTerminalStatus("paid");
                        completePurchaseMutation.mutate();
                      }}
                    >
                      {completePurchaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {completePurchaseMutation.isPending ? "Retrying..." : "Retry Order"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white/60 gap-2"
                      onClick={() => { setTerminalStatus("idle"); setCheckoutAttempted(false); }}
                    >
                      <X className="w-4 h-4" /> Discard & Start Over
                    </Button>
                  </div>
                )}

                {/* EXPIRED */}
                {terminalStatus === "expired" && (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/40 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                      <p className="text-red-300 font-semibold">Payment Session Expired</p>
                      <p className="text-white/40 text-sm">The 5-minute window elapsed. Please try again.</p>
                    </div>
                    <Button className="w-full bg-emerald-600 gap-2" onClick={() => { setTerminalStatus("idle"); setCheckoutAttempted(false); }}>
                      <Nfc className="w-4 h-4" /> Try Again
                    </Button>
                  </div>
                )}

                {/* ERROR */}
                {terminalStatus === "error" && (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/40 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                      <p className="text-red-300 font-semibold">Could not start session</p>
                      <p className="text-white/40 text-sm">Check your connection and try again.</p>
                    </div>
                    <Button className="w-full bg-emerald-600 gap-2" onClick={() => { setTerminalStatus("idle"); setCheckoutAttempted(false); }}>
                      <Nfc className="w-4 h-4" /> Retry
                    </Button>
                  </div>
                )}
              </div>
            ) : paymentMethod === "card" ? (
              <div className="space-y-2">
                {!allOwnProducts && !validateEmail(customerEmail) && (
                  <p className="text-sm text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Enter a valid email address to continue
                  </p>
                )}
                
                {/* Square Payment Info */}
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-sm">Secure Card Payment</span>
                    <div className="flex items-center gap-1 text-white/60 ml-auto">
                      <CreditCard className="w-3 h-3" />
                      <SiApplepay className="w-5 h-3" />
                      <SiGooglepay className="w-5 h-3" />
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleSquareCardPayment}
                  disabled={!isCheckoutInfoComplete || isPaymentProcessing || (deliveryMethod === 'collection' && !selectedStore)}
                  className="w-full h-14 text-lg gap-2 bg-emerald-600"
                  data-testid="button-square-pay"
                >
                  {isPaymentProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {formatCurrency(discountedTotal)} with Card
                    </>
                  )}
                </Button>
              </div>
            ) : paymentMethod === "stripe_direct" ? (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-700/40 text-center space-y-2">
                  <CreditCard className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-emerald-300 font-semibold text-sm">Direct Card Payment</p>
                  <p className="text-white/50 text-xs">Customer will be redirected to your Stripe checkout page. The money goes straight to your account.</p>
                  <div className="inline-flex items-center gap-1 bg-emerald-600/20 border border-emerald-500/30 rounded-full px-3 py-1">
                    <span className="text-emerald-300 font-bold text-lg">{formatCurrency(discountedTotal)}</span>
                  </div>
                </div>
                <Button
                  className="w-full h-14 text-base font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  onClick={handleStripeDirectPayment}
                  disabled={isStripeDirectProcessing}
                  data-testid="button-stripe-direct-pay"
                >
                  {isStripeDirectProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Stripe…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay {formatCurrency(discountedTotal)} — Direct to Your Account
                    </>
                  )}
                </Button>
              </div>
            ) : paymentMethod === "bank_transfer" ? (
              <div className="space-y-3">
                {/* ── Customer-facing payment panel ── */}
                {!showBankTransferConfirm ? (
                  <>
                    <div className="p-5 bg-green-900/20 rounded-xl border border-green-700/40 space-y-4">
                      {/* Amount + reference */}
                      <div className="text-center">
                        <p className="text-green-300 font-semibold text-sm mb-1">Bank Transfer — Pay Directly to Seller</p>
                        <p className="text-white font-bold text-5xl tracking-tight">{`£${discountedTotal.toFixed(2)}`}</p>
                        <p className="text-white/50 text-xs mt-2">
                          Reference: <span className="font-mono font-bold text-white/80 tracking-widest">{bankTransferRef}</span>
                        </p>
                      </div>

                      {/* QR code */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-white p-4 rounded-2xl shadow-xl">
                          <QRCodeSVG
                            value={[
                              `BeneficiaryName:${resellerProfile?.eposBankDetails?.accountName}`,
                              `SortCode:${(resellerProfile?.eposBankDetails?.sortCode || "").replace(/-/g, "")}`,
                              `AccountNumber:${resellerProfile?.eposBankDetails?.accountNumber}`,
                              `Amount:${discountedTotal.toFixed(2)}`,
                              `Reference:${bankTransferRef}`,
                              `Currency:GBP`,
                            ].join("\n")}
                            size={200}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <p className="text-white/40 text-xs text-center max-w-[260px]">
                          Open your <strong className="text-white/60">banking app</strong>, use{" "}
                          <strong className="text-white/60">Send Money → New Payee</strong> or scan the QR code
                        </p>
                      </div>

                      {/* Bank details */}
                      <div className="bg-black/30 rounded-xl p-4 text-center space-y-1">
                        <p className="text-white font-bold text-xl">{resellerProfile?.eposBankDetails?.accountName}</p>
                        <div className="flex justify-center gap-6 text-white/80 text-base mt-1">
                          <span>Sort code: <strong className="font-mono text-white">{resellerProfile?.eposBankDetails?.sortCode}</strong></span>
                          <span>Account: <strong className="font-mono text-white">{resellerProfile?.eposBankDetails?.accountNumber}</strong></span>
                        </div>
                        <p className="text-white/40 text-xs pt-2">
                          Use Faster Payments in your banking app · Apple Pay &amp; contactless are not supported for bank transfers
                        </p>
                      </div>
                    </div>

                    {/* Customer taps once they've sent the payment */}
                    <Button
                      className="w-full h-16 text-lg font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                      onClick={() => setShowBankTransferConfirm(true)}
                      data-testid="button-bank-transfer-sent"
                    >
                      <CheckCircle className="w-5 h-5" />
                      I've Sent the Payment
                    </Button>
                  </>
                ) : (
                  /* ── Step 2: confirmation screen before completing order ── */
                  <div className="rounded-xl border border-emerald-700/50 bg-gradient-to-b from-slate-900 to-slate-800 p-6 space-y-5 text-center">
                    <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-9 h-9 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-xl">Confirm Payment Sent</p>
                      <p className="text-white/60 text-sm mt-2">
                        Please confirm you have transferred{" "}
                        <strong className="text-white">{`£${discountedTotal.toFixed(2)}`}</strong> to{" "}
                        <strong className="text-white">{resellerProfile?.eposBankDetails?.accountName}</strong> with reference{" "}
                        <strong className="font-mono text-white">{bankTransferRef}</strong>.
                      </p>
                      <p className="text-white/40 text-xs mt-3">
                        Only confirm if the payment has been sent from your banking app. The seller will verify receipt.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                      <Button
                        className="w-full h-14 text-base font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={handleBankTransferConfirm}
                        disabled={isBankTransferProcessing}
                        data-testid="button-bank-transfer-confirm"
                      >
                        {isBankTransferProcessing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Completing order…</>
                        ) : (
                          <><CheckCircle className="w-4 h-4" />Yes, Payment Sent — Complete Order</>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-white/40 hover:text-white/70"
                        onClick={() => setShowBankTransferConfirm(false)}
                        disabled={isBankTransferProcessing}
                      >
                        Go back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : paymentMethod === "qr" ? (
              !isCheckoutInfoComplete ? (
                <div className="p-3 bg-white/5 rounded-xl border border-amber-500/30 text-center space-y-1">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-white text-sm font-medium">Complete customer details first</p>
                  <p className="text-white/60 text-sm">Please fill in customer name, {allOwnProducts ? '' : 'email, '}phone number{deliveryMethod === 'delivery' ? ', and delivery address' : ''} before generating a QR code</p>
                </div>
              ) : (
              <QRPayment
                items={cartItems.map(item => ({
                  productId: item.productId,
                  name: item.name,
                  quantity: item.quantity,
                  price: parseFloat(item.unitPrice),
                  size: item.size,
                  color: item.color,
                  sku: item.sku || undefined,
                  isResellerProduct: item.isResellerProduct || false,
                  vendorProductId: (item as any).vendorProductId || undefined,
                }))}
                totalAmount={discountedTotal}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                customerFirstName={customerFirstName}
                customerLastName={customerLastName}
                deliveryMethod={deliveryMethod}
                deliveryAddress={deliveryMethod === 'delivery' ? {
                  address: deliveryAddress,
                  city: deliveryCity,
                  postcode: deliveryPostcode,
                  country: deliveryCountry || 'United Kingdom',
                } : undefined}
                discount={appliedCoupon ? { amount: appliedCoupon.discount, name: appliedCoupon.coupon.code } : undefined}
                onPaymentSuccess={async (paymentId) => {
                  // Handle QR payment success with Square
                  try {
                    const response = await apiRequest("POST", "/api/reseller/epos/checkout", {
                      items: cartItems.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        sku: item.sku,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        isResellerProduct: item.isResellerProduct,
                        productType: item.productType,
                      })),
                      customerEmail,
                      customerPhone,
                      customerFirstName,
                      customerLastName,
                      paymentMethod: "card_qr",
                      totalAmount: discountedTotal,
                      squarePaymentId: paymentId,
                      fulfilmentMethod: deliveryMethod,
                      deliveryAddress: {
                        address: deliveryAddress,
                        city: deliveryCity,
                        postcode: deliveryPostcode,
                        country: deliveryCountry,
                      },
                      couponCode: appliedCoupon?.coupon?.code || null,
                      couponId: appliedCoupon?.coupon?.id || null,
                      discountAmount: appliedCoupon?.discount || 0,
                    });
                    const data = await response.json();
                    setReceiptData({
                      orderNumber: data.orderNumber,
                      ownProductOrderNumber: data.isMixed ? data.ownProductOrderNumber : null,
                      isMixed: data.isMixed,
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
                      total: discountedTotal,
                      paymentMethod: "Card (QR)",
                      customerEmail,
                    });
                    resetSession();
                    setShowReceipt(true);
                    toast({
                      title: "Order Complete!",
                      description: `Order ${data.orderNumber} has been processed.`,
                    });
                  } catch (error) {
                    toast({
                      title: "Order creation failed",
                      description: "Please contact support.",
                      variant: "destructive",
                    });
                  }
                }}
                onPaymentError={(error) => {
                  toast({
                    title: "Payment failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
                onCancel={() => setPaymentMethod("card")}
              />
              )
            ) : paymentMethod === "paypal" ? (
              <div className="space-y-2">
                {!allOwnProducts && !validateEmail(customerEmail) && (
                  <p className="text-sm text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Enter a valid email address to continue
                  </p>
                )}
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/60 text-sm mb-2">Pay securely with PayPal</p>
                  {isPaypalLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0070ba]" />
                      <span className="ml-2 text-white/60 text-sm">Loading PayPal...</span>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-14 text-lg gap-2 bg-[#0070ba]"
                      disabled={(!allOwnProducts && !validateEmail(customerEmail)) || isPaypalProcessing || !isPaypalInitialized}
                      onClick={() => {
                        if (!allOwnProducts && !validateEmail(customerEmail)) {
                          toast({
                            title: "Email Required",
                            description: "Please enter a valid email address",
                            variant: "destructive",
                          });
                          return;
                        }
                        startPayment(discountedTotal, "GBP");
                      }}
                      data-testid="button-paypal-checkout"
                    >
                      {isPaypalProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <SiPaypal className="w-4 h-4" />
                      )}
                      {isPaypalProcessing ? "Processing PayPal..." : `Pay ${formatCurrency(discountedTotal)} with PayPal`}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Button
                className="w-full h-14 text-lg gap-2 bg-emerald-600"
                disabled={!isCheckoutInfoComplete || completePurchaseMutation.isPending}
                onClick={() => completePurchaseMutation.mutate()}
                data-testid="button-complete-order"
              >
                {completePurchaseMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {completePurchaseMutation.isPending ? "Processing..." : `Complete Sale - ${formatCurrency(discountedTotal)}`}
              </Button>
            )}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Sale Complete
            </DialogTitle>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                {receiptData.isMixed ? (
                  <>
                    <p className="text-white/60 text-sm">Order Numbers (Split Sale)</p>
                    <p className="text-lg font-bold text-white leading-tight">{receiptData.orderNumber}</p>
                    <p className="text-white/50 text-xs">1stRep catalogue items</p>
                    <p className="text-lg font-bold text-white leading-tight mt-1">{receiptData.ownProductOrderNumber}</p>
                    <p className="text-white/50 text-xs">Your own products</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/60 text-sm">Order Number</p>
                    <p className="text-2xl font-bold text-white">{receiptData.orderNumber}</p>
                  </>
                )}
                <p className="text-white/40 text-sm mt-1">{receiptData.timestamp}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-2">
                  {receiptData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-white">
                        {item.name} {item.size && `(${item.size})`} x{item.quantity}
                      </span>
                      <span className="text-white/80">{formatCurrency(parseFloat(item.totalPrice))}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3 bg-white/10" />
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-emerald-400 text-xl font-bold">
                    {formatCurrency(receiptData.total)}
                  </span>
                </div>
                <p className="text-white/40 text-sm mt-2">
                  Paid by {receiptData.paymentMethod}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-white/20"
                  onClick={printReceipt}
                  data-testid="button-print-receipt"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowReceipt(false)}
                  data-testid="button-new-sale"
                >
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showShowReel && products && products.length > 0 && (
        <ProductShowReel
          products={products.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            price: p.retailPrice || "0",
            compareAtPrice: undefined,
            imageUrl: p.imageUrl,
            category: p.category || "",
          }))}
          storeName={resellerProfile?.businessName || "1stRep Reseller"}
          intervalSeconds={10}
          onClose={() => setShowShowReel(false)}
        />
      )}

      {/* Ad loop removed — re-enable via idle timer + EPOSAdLoop if desired */}
      {/* On-screen keyboard disabled - POS device has its own keyboard */}
    </div>
  );
}
