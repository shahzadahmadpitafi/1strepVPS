import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, Check, X, 
  CreditCard, Banknote, Store, ChevronRight, ChevronLeft, ArrowLeft,
  ShoppingBag, Tag, Grid3X3, LayoutGrid, Printer, Download, Mail, CheckCircle, Loader2,
  Lock, Shield, KeyRound, AlertTriangle, ZoomIn, AlertCircle
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, sortSizes } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SiApplepay, SiGooglepay } from "react-icons/si";

// Email validation helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Server-side PIN validation - no client-side defaults exposed

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

interface VendorProduct {
  id: string;
  name: string;
  displayName?: string;
  sku: string;
  retailPrice: string;
  category: string;
  sizes: string[];
  colors: string[];
  imageUrl?: string;
  hoverImageUrl?: string;
  description?: string;
  displayColor?: string | null;
  productType?: 'vendor' | 'storefront'; // vendor = own products, storefront = 1stRep products
  variants?: {
    id: string;
    size: string;
    color: string;
    price: string;
    stockQuantity: number;
  }[];
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
  productType?: 'vendor' | 'storefront'; // Track if this is vendor's own product or 1stRep product
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

interface VendorProfile {
  id: string;
  businessName: string;
  businessDescription?: string;
}

interface StoreLocation {
  id: string;
  businessName: string;
  businessAddress: string;
  phoneNumber?: string;
  storefrontSlug?: string | null;
}

export default function VendorEPOS() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  
  // Delivery address state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPostcode, setDeliveryPostcode] = useState("");
  const [deliveryCountry, setDeliveryCountry] = useState("United Kingdom");
  
  // Delivery method state (home delivery or in-store collection)
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "collection">("delivery");
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  
  const [cartOpen, setCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "large">("large");
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
  
  // Security: PIN lock state - fully server-side session management
  // No localStorage - session is entirely managed by server-side Express session
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
    valid: boolean;
    expiresAt?: string;
    vendorId?: string;
    reason?: string;
    requiresPinSetup?: boolean;
    weakPinBlocked?: boolean;
  }>({
    queryKey: ["/api/vendor/epos/session"],
    refetchInterval: 30000, // Check every 30 seconds for session expiry
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Derive isLocked from server session data only - no local state
  const isLocked = !sessionData?.valid;
  const sessionExpiry = sessionData?.expiresAt;
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
      const response = await apiRequest("POST", "/api/vendor/epos/set-pin", { newPin });
      return await response.json();
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
      // Refetch session to clear the requiresPinSetup flag
      refetchSession();
    },
    onError: (error: any) => {
      setPinSetupError(error.message || "Failed to set PIN");
      setIsSettingPin(false);
    },
  });

  const handleSetNewPin = () => {
    setPinSetupError("");
    
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinSetupError("PIN must be exactly 4 digits");
      return;
    }
    
    if (newPinInput !== confirmPinInput) {
      setPinSetupError("PINs do not match");
      return;
    }
    
    // Check for weak PINs
    const weakPins = ["1234", "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1212", "0123"];
    if (weakPins.includes(newPinInput)) {
      setPinSetupError("This PIN is too easy to guess. Please choose a more secure PIN.");
      return;
    }
    
    setIsSettingPin(true);
    setPinMutation.mutate(newPinInput);
  };

  // Refresh session on user activity (server-side timeout refresh)
  const refreshSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/vendor/epos/refresh-session");
      return await response.json();
    },
    onSuccess: () => {
      refetchSession();
    },
    onError: () => {
      // Session expired, refetch to update state
      refetchSession();
    },
  });

  // Refresh session every 5 minutes of activity
  useEffect(() => {
    if (isLocked || checkingSession) return;
    
    const refreshInterval = setInterval(() => {
      refreshSessionMutation.mutate();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isLocked, checkingSession]);

  // Checkout timeout - 5 minute limit
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

  // Server-validated PIN verification
  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest("POST", "/api/vendor/epos/verify-pin", { pin });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setPinInput("");
      setPinError(false);
      setIsVerifyingPin(false);
      
      // Check if this is a first-time login requiring PIN setup
      if (data.requiresPinSetup) {
        setShowPinSetupDialog(true);
        toast({
          title: "Welcome! Set Your PIN",
          description: "Please create a secure 4-digit PIN to protect your EPOS terminal.",
        });
      } else {
        toast({
          title: "EPOS Unlocked",
          description: "Welcome to your secure EPOS terminal",
        });
      }
      // Refetch session to update locked state from server
      refetchSession();
    },
    onError: (error: any) => {
      setPinError(true);
      setPinInput("");
      setIsVerifyingPin(false);
      toast({
        title: "Invalid PIN",
        description: error.message || "Please enter the correct PIN",
        variant: "destructive",
      });
    },
  });

  // Server-validated lock
  const lockMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/vendor/epos/lock");
      return await response.json();
    },
    onSuccess: () => {
      // Refetch session to update locked state from server
      refetchSession();
      toast({
        title: "EPOS Locked",
        description: "Terminal has been secured",
      });
    },
  });

  const lockEPOS = () => {
    lockMutation.mutate();
  };

  const handlePinKeyPress = (digit: string) => {
    if (pinInput.length < 4 && !isVerifyingPin) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      setPinError(false);
      if (newPin.length === 4) {
        setIsVerifyingPin(true);
        verifyPinMutation.mutate(newPin);
      }
    }
  };

  const clearPinInput = () => {
    setPinInput("");
    setPinError(false);
  };

  // Fetch vendor profile for branding
  const { data: vendorProfile } = useQuery<VendorProfile>({
    queryKey: ["/api/vendor/epos/profile"],
  });

  // Fetch vendor's own products expanded by color (each color as separate card)
  const { data: products = [], isLoading: productsLoading } = useQuery<VendorProduct[]>({
    queryKey: ["/api/vendor/epos/products/by-color"],
  });

  // Fetch store locations for in-store collection option
  const { data: storeLocations = [] } = useQuery<StoreLocation[]>({
    queryKey: ['/api/store-locator/resellers'],
  });

  // Fetch site settings for in-store collection toggle
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

  // Get unique categories from products
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
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

  // Get price for selected variant
  const getVariantPrice = (product: VendorProduct, size: string, color: string): string => {
    if (product.variants) {
      const variant = product.variants.find(v => v.size === size && v.color === color);
      if (variant) return variant.price;
    }
    return product.retailPrice;
  };

  // Get stock for selected variant
  const getVariantStock = (product: VendorProduct, size: string, color: string): number => {
    if (product.variants) {
      const variant = product.variants.find(v => v.size === size && v.color === color);
      if (variant) return variant.stockQuantity;
    }
    return 999;
  };

  // Get total stock for a product (all variants combined)
  const getTotalStock = (product: VendorProduct): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }
    return 999; // If no variants, assume in stock
  };

  // Check if product is out of stock
  const isProductOutOfStock = (product: VendorProduct): boolean => {
    return getTotalStock(product) <= 0;
  };

  const resetSelection = () => {
    setSelectedSize("");
    setSelectedColor("");
    setSelectedQuantity(1);
    setSelectedProduct(null);
  };

  const openProductModal = async (product: VendorProduct) => {
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

  const handleQuickAdd = (product: VendorProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.sizes.length <= 1 && product.colors.length <= 1) {
      const size = product.sizes[0] || "";
      const color = product.colors[0] || "";
      const price = getVariantPrice(product, size, color);
      
      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        size,
        color,
        quantity: 1,
        unitPrice: price,
        imageUrl: product.imageUrl,
        productType: product.productType || 'vendor',
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
    
    const price = getVariantPrice(selectedProduct, selectedSize, selectedColor);
    const stock = getVariantStock(selectedProduct, selectedSize, selectedColor);
    
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
      unitPrice: price,
      imageUrl: selectedProduct.imageUrl,
      productType: selectedProduct.productType || 'vendor',
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

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Check if cart contains any 1stRep (storefront) products - cash not allowed for these
  const hasStorefrontProducts = cartItems.some(item => item.productType === 'storefront');
  const cashPaymentAllowed = !hasStorefrontProducts;
  
  // Auto-switch to card payment if cart contains storefront products and cash was selected
  useEffect(() => {
    if (hasStorefrontProducts && paymentMethod === 'cash') {
      setPaymentMethod('card');
    }
  }, [hasStorefrontProducts, paymentMethod]);

  // Square payment state
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Handle Square checkout redirect for card payments
  const handleSquareCardPayment = async () => {
    if (!validateEmail(customerEmail)) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address for the receipt.",
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
      sessionStorage.setItem('vendorEposCartItems', JSON.stringify(cartItems));
      sessionStorage.setItem('vendorEposCustomerEmail', customerEmail);
      sessionStorage.setItem('vendorEposDeliveryMethod', deliveryMethod);
      if (deliveryMethod === 'delivery') {
        sessionStorage.setItem('vendorEposDeliveryAddress', JSON.stringify({
          address: deliveryAddress,
          city: deliveryCity,
          postcode: deliveryPostcode,
          country: deliveryCountry,
        }));
      } else if (selectedStore) {
        sessionStorage.setItem('vendorEposCollectionStore', JSON.stringify(selectedStore));
      }
      sessionStorage.setItem('vendorEposTotal', String(cartTotal));
      
      // Create Square checkout
      const response = await apiRequest("POST", "/api/square/create-epos-checkout", {
        amount: cartTotal,
        currency: 'GBP',
        customerEmail,
        orderType: 'vendor_epos',
        lineItems: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          color: item.color,
        })),
        redirectUrl: `${window.location.origin}/vendor/epos?payment=success`,
      });
      
      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        // Store Square reference for verification
        sessionStorage.setItem('vendorEposSquareOrderId', data.orderId || '');
        sessionStorage.setItem('vendorEposReferenceId', data.referenceId || '');
        
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

  // Handle return from Square checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment');
    const transactionId = urlParams.get('transactionId');
    
    if (paymentSuccess === 'success') {
      // Retrieve stored cart data
      const storedItems = sessionStorage.getItem('vendorEposCartItems');
      const storedEmail = sessionStorage.getItem('vendorEposCustomerEmail');
      const storedDeliveryMethod = sessionStorage.getItem('vendorEposDeliveryMethod');
      const storedDeliveryAddress = sessionStorage.getItem('vendorEposDeliveryAddress');
      const storedCollectionStore = sessionStorage.getItem('vendorEposCollectionStore');
      const storedTotal = sessionStorage.getItem('vendorEposTotal');
      const squareOrderId = sessionStorage.getItem('vendorEposSquareOrderId');
      
      if (storedItems && storedEmail) {
        const parsedItems = JSON.parse(storedItems);
        const parsedDeliveryAddress = storedDeliveryAddress ? JSON.parse(storedDeliveryAddress) : null;
        const parsedCollectionStore = storedCollectionStore ? JSON.parse(storedCollectionStore) : null;
        const total = parseFloat(storedTotal || '0');
        
        // Create order in backend
        apiRequest("POST", "/api/vendor/epos/checkout", {
          items: parsedItems.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          customerEmail: storedEmail,
          paymentMethod: "card_square",
          totalAmount: total,
          squarePaymentId: transactionId || squareOrderId,
          deliveryMethod: storedDeliveryMethod,
          collectionStoreId: parsedCollectionStore?.id,
          collectionStoreName: parsedCollectionStore?.businessName,
          deliveryAddress: parsedDeliveryAddress,
        }).then(async (response) => {
          const data = await response.json();
          
          setReceiptData({
            orderNumber: data.orderNumber,
            timestamp: new Date().toLocaleString("en-GB"),
            items: parsedItems.map((item: any) => ({
              name: item.name,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
            })),
            subtotal: total,
            total: total,
            paymentMethod: "Card (Square)",
            customerEmail: storedEmail,
          });
          
          setShowReceipt(true);
          queryClient.invalidateQueries({ queryKey: ["/api/vendor/epos/products/by-color"] });
          
          toast({
            title: "Order Complete!",
            description: `Order ${data.orderNumber} has been processed. Receipt sent to ${storedEmail}`,
          });
        }).catch((error) => {
          console.error('Order creation error:', error);
          toast({
            title: "Order Creation Issue",
            description: "Payment was successful but there was an issue creating the order. Please contact support.",
            variant: "destructive",
          });
        });
        
        // Clear stored data
        sessionStorage.removeItem('vendorEposCartItems');
        sessionStorage.removeItem('vendorEposCustomerEmail');
        sessionStorage.removeItem('vendorEposDeliveryMethod');
        sessionStorage.removeItem('vendorEposDeliveryAddress');
        sessionStorage.removeItem('vendorEposCollectionStore');
        sessionStorage.removeItem('vendorEposTotal');
        sessionStorage.removeItem('vendorEposSquareOrderId');
        sessionStorage.removeItem('vendorEposReferenceId');
        
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Complete purchase mutation - calls backend API to create order and send email
  const completePurchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/vendor/epos/checkout", {
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        customerEmail,
        paymentMethod,
        totalAmount: cartTotal,
        deliveryMethod,
        collectionStoreId: deliveryMethod === 'collection' ? selectedStore?.id : undefined,
        collectionStoreName: deliveryMethod === 'collection' ? selectedStore?.businessName : undefined,
        deliveryAddress: deliveryMethod === 'delivery' ? {
          address: deliveryAddress,
          city: deliveryCity,
          postcode: deliveryPostcode,
          country: deliveryCountry,
        } : undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
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
        paymentMethod: paymentMethod === "cash" ? "Cash" : "Card",
        customerEmail,
      });
      
      setShowReceipt(true);
      setCartItems([]);
      setShowCheckout(false);
      setCustomerEmail("");
      setDeliveryAddress("");
      setDeliveryCity("");
      setDeliveryPostcode("");
      setDeliveryCountry("United Kingdom");
      
      toast({
        title: "Order Complete!",
        description: `Order ${data.orderNumber} has been processed. Receipt sent to ${customerEmail}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    },
  });

  const printReceipt = () => {
    window.print();
  };

  const storeName = vendorProfile?.businessName || "Wholesaler Store";

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
              <p className="text-emerald-400/60 text-xs mt-1">Change PIN in vendor settings</p>
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
              <Link href="/vendor/dashboard" className="flex-1">
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
    <div className="min-h-screen bg-black">
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
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/60">Wholesaler EPOS</p>
                  <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-xs px-1.5 py-0">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure
                  </Badge>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                placeholder="Search your products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full text-lg"
                data-testid="input-search"
              />
            </div>

            {/* View Toggle, Lock & Cart */}
            <div className="flex items-center gap-3">
              {/* Security Lock Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={lockEPOS}
                className="h-10 w-10 text-white/60 hover:text-red-400 hover:bg-red-500/10"
                title="Lock EPOS"
                data-testid="button-lock-epos"
              >
                <Lock className="w-5 h-5" />
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
                                      className="w-20 h-20 object-contain rounded-lg bg-white/5"
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

                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-white/60">Subtotal</span>
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
            <ShoppingBag className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/60 text-xl">No products yet</p>
            <p className="text-white/40 mt-2">Add products from your wholesaler dashboard</p>
            <Link href="/vendor/dashboard">
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
          <>
            {/* Show grouped by category when "all" is selected and no search */}
            {selectedCategory === "all" && !searchTerm ? (
              <div className="space-y-12">
                {/* Vendor Brand Header */}
                {vendorProfile && (
                  <div className="mb-8 pb-4 border-b border-white/10">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Store className="w-6 h-6 text-emerald-400" />
                      {vendorProfile.businessName} Products
                    </h1>
                    <p className="text-white/60 mt-1">Your exclusive product catalogue</p>
                  </div>
                )}
                {productsByCategory.map(({ category, products: categoryProducts }) => (
                  <div key={category} data-testid={`category-section-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {category}
                    </h2>
                    <div className={`grid gap-6 ${
                      viewMode === "large" 
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    }`}>
                      {categoryProducts.map((product, index) => {
                        const uniqueKey = product.displayColor 
                          ? `${product.id}-${product.displayColor}` 
                          : `${product.id}-${index}`;
                        return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card
                              className="group bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-emerald-500/50"
                              onClick={() => openProductModal(product)}
                              onMouseEnter={() => setHoveredProductId(product.id)}
                              onMouseLeave={() => setHoveredProductId(null)}
                              data-testid={`product-card-${product.id}`}
                            >
                              <div className={`relative overflow-hidden bg-gradient-to-br from-white/5 to-white/0 ${
                                viewMode === "large" ? "aspect-[4/5]" : "aspect-[4/5]"
                              }`}>
                                {product.imageUrl ? (
                                  <>
                                    <img
                                      src={convertToDirectUrl(product.imageUrl)}
                                      alt={product.displayName || product.name}
                                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                        hoveredProductId === product.id && product.hoverImageUrl ? 'opacity-0' : 'opacity-100'
                                      }`}
                                    />
                                    {product.hoverImageUrl && (
                                      <img
                                        src={convertToDirectUrl(product.hoverImageUrl)}
                                        alt={`${product.displayName || product.name} alternate view`}
                                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                          hoveredProductId === product.id ? 'opacity-100' : 'opacity-0'
                                        }`}
                                      />
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingBag className="w-16 h-16 text-white/20" />
                                  </div>
                                )}
                                {!isProductOutOfStock(product) && (
                                  <Button
                                    size="icon"
                                    className="absolute bottom-3 right-3 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg bg-emerald-600 hover:bg-emerald-700"
                                    onClick={(e) => handleQuickAdd(product, e)}
                                    data-testid={`button-quick-add-${product.id}`}
                                  >
                                    <Plus className="w-6 h-6" />
                                  </Button>
                                )}
                                {isProductOutOfStock(product) && (
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
                                <p className="text-white/40 text-xs mb-2">{product.sku}</p>
                                <div className="flex items-center justify-between">
                                  <p className={`font-bold text-emerald-400 ${
                                    viewMode === "large" ? "text-2xl" : "text-lg"
                                  }`}>
                                    {formatCurrency(parseFloat(product.retailPrice))}
                                  </p>
                                  {viewMode === "large" && product.sizes && product.sizes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                                      {sortSizes(product.sizes).map((size, idx) => (
                                        <Badge 
                                          key={idx} 
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
              /* Flat grid when filtering or searching */
              <div className={`grid gap-6 ${
                viewMode === "large" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              }`}>
                {filteredProducts.map((product, index) => {
                  const uniqueKey = product.displayColor 
                    ? `${product.id}-${product.displayColor}` 
                    : `${product.id}-${index}`;
                  return (
                  <motion.div
                    key={uniqueKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="group bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-emerald-500/50"
                      onClick={() => openProductModal(product)}
                      onMouseEnter={() => setHoveredProductId(product.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                      data-testid={`product-card-${product.id}`}
                    >
                      <div className={`relative overflow-hidden bg-gradient-to-br from-white/5 to-white/0 ${
                        viewMode === "large" ? "aspect-[4/5]" : "aspect-[4/5]"
                      }`}>
                        {product.imageUrl ? (
                          <>
                            <img
                              src={convertToDirectUrl(product.imageUrl)}
                              alt={product.displayName || product.name}
                              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                hoveredProductId === product.id && product.hoverImageUrl ? 'opacity-0' : 'opacity-100'
                              }`}
                            />
                            {product.hoverImageUrl && (
                              <img
                                src={convertToDirectUrl(product.hoverImageUrl)}
                                alt={`${product.displayName || product.name} alternate view`}
                                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                                  hoveredProductId === product.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-16 h-16 text-white/20" />
                          </div>
                        )}
                        {!isProductOutOfStock(product) && (
                          <Button
                            size="icon"
                            className="absolute bottom-3 right-3 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => handleQuickAdd(product, e)}
                            data-testid={`button-quick-add-${product.id}`}
                          >
                            <Plus className="w-6 h-6" />
                          </Button>
                        )}
                        {isProductOutOfStock(product) && (
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
                        <p className="text-white/40 text-xs mb-2">{product.sku}</p>
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-emerald-400 ${
                            viewMode === "large" ? "text-2xl" : "text-lg"
                          }`}>
                            {formatCurrency(parseFloat(product.retailPrice))}
                          </p>
                          {viewMode === "large" && product.sizes && product.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                              {sortSizes(product.sizes).map((size, idx) => (
                                <Badge 
                                  key={idx} 
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

      {/* Mandatory PIN Setup Dialog (First-time login or weak PIN) */}
      <Dialog open={showPinSetupDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-black border-white/10" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${weakPinBlocked ? 'bg-red-600/20' : 'bg-emerald-600/20'}`}>
                <Shield className={`w-6 h-6 ${weakPinBlocked ? 'text-red-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <DialogTitle className="text-xl text-white">
                  {weakPinBlocked ? "Change Your PIN" : "Set Your EPOS PIN"}
                </DialogTitle>
                <DialogDescription className="text-white/60">
                  {weakPinBlocked 
                    ? "Your current PIN is too weak. Please set a more secure PIN." 
                    : "For security, please set a unique 4-digit PIN"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/60 text-xs uppercase tracking-wider">New PIN (4 digits)</Label>
              <Input
                type="password"
                maxLength={4}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit PIN"
                className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest"
                data-testid="input-new-pin"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Confirm PIN</Label>
              <Input
                type="password"
                maxLength={4}
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Confirm 4-digit PIN"
                className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest"
                data-testid="input-confirm-pin"
              />
            </div>
            
            {pinSetupError && (
              <p className="text-red-400 text-sm text-center">{pinSetupError}</p>
            )}
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-400 text-sm">
                Avoid common PINs like 1234, 0000, or repeating digits. Choose a unique PIN for security.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleSetNewPin}
              disabled={isSettingPin || newPinInput.length !== 4 || confirmPinInput.length !== 4}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-set-pin"
            >
              {isSettingPin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Setting PIN...
                </>
              ) : (
                "Set PIN & Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    {formatCurrency(parseFloat(getVariantPrice(selectedProduct, selectedSize, selectedColor)))}
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
                        const stock = getVariantStock(selectedProduct, size, selectedColor);
                        const isOutOfStock = stock <= 0;
                        
                        return (
                          <button
                            key={size}
                            onClick={() => !isOutOfStock && setSelectedSize(size)}
                            disabled={isOutOfStock}
                            className={`px-4 py-2 text-sm border rounded-md transition-colors min-h-10 min-w-[48px] ${
                              selectedSize === size
                                ? 'bg-emerald-600 text-white border-emerald-600'
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
                )}

                {/* Colour Selection */}
                {selectedProduct.colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      SELECT COLOUR
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.colors.map((color) => {
                        const stock = getVariantStock(selectedProduct, selectedSize, color);
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
                      const stock = getVariantStock(selectedProduct, selectedSize, selectedColor);
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

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md bg-black border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-500" />
                Checkout
              </DialogTitle>
              <Badge 
                variant={checkoutTimeRemaining <= 10 ? "destructive" : "secondary"}
                className={`text-sm font-mono ${checkoutTimeRemaining <= 10 ? "animate-pulse" : ""}`}
                data-testid="badge-checkout-timer"
              >
                {Math.floor(checkoutTimeRemaining / 60)}:{(checkoutTimeRemaining % 60).toString().padStart(2, '0')}
              </Badge>
            </div>
            <DialogDescription className="text-white/60">
              Complete your purchase before time expires
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Order Summary */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/60 text-sm mb-3">Order Summary</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-white truncate flex-1 mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-white/80">
                      {formatCurrency(parseFloat(item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-3 bg-white/10" />
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-emerald-400 text-xl font-bold">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>

            {/* Customer Email */}
            <div className="space-y-2">
              <Label className="text-white/60">Email for Receipt</Label>
              <Input
                type="email"
                placeholder="customer@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white"
                data-testid="input-checkout-email"
              />
            </div>

            {/* Delivery Method Selection */}
            {siteSettings?.inStoreCollectionEnabled && storeLocations.length > 0 && (
              <div className="space-y-3">
                <Label className="text-white/60">Delivery Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={deliveryMethod === "delivery" ? "default" : "outline"}
                    className={`h-14 gap-2 ${
                      deliveryMethod === "delivery"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setDeliveryMethod("delivery");
                      setSelectedStore(null);
                    }}
                    data-testid="button-delivery-method-home"
                  >
                    <Store className="w-5 h-5" />
                    Home Delivery
                  </Button>
                  <Button
                    type="button"
                    variant={deliveryMethod === "collection" ? "default" : "outline"}
                    className={`h-14 gap-2 ${
                      deliveryMethod === "collection"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                    onClick={() => setDeliveryMethod("collection")}
                    data-testid="button-delivery-method-collection"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    In-Store Collection
                  </Button>
                </div>

                {/* Store Selection for Collection */}
                {deliveryMethod === "collection" && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-white/60 text-sm">Select Collection Store</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {storeLocations.map((store) => (
                        <div
                          key={store.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedStore?.id === store.id
                              ? "bg-emerald-600/20 border-emerald-500"
                              : "bg-white/5 border-white/10 hover:border-white/30"
                          }`}
                          onClick={() => setSelectedStore(store)}
                          data-testid={`store-option-${store.id}`}
                        >
                          <p className="text-white font-medium text-sm">{store.businessName}</p>
                          <p className="text-white/60 text-xs">{store.businessAddress}</p>
                          {store.phoneNumber && (
                            <p className="text-white/40 text-xs mt-1">{store.phoneNumber}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {deliveryMethod === "collection" && !selectedStore && (
                      <p className="text-yellow-400 text-xs">Please select a store for collection</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Delivery Address - Only show for home delivery */}
            {deliveryMethod === "delivery" && (
              <div className="space-y-3">
                <Label className="text-white/60">Delivery Address</Label>
                <Input
                  type="text"
                  placeholder="Street address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="h-10 bg-white/5 border-white/10 text-white"
                  data-testid="input-delivery-address"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="City"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="h-10 bg-white/5 border-white/10 text-white"
                    data-testid="input-delivery-city"
                  />
                  <Input
                    type="text"
                    placeholder="Postcode"
                    value={deliveryPostcode}
                    onChange={(e) => setDeliveryPostcode(e.target.value)}
                    className="h-10 bg-white/5 border-white/10 text-white"
                    data-testid="input-delivery-postcode"
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Country"
                  value={deliveryCountry}
                  onChange={(e) => setDeliveryCountry(e.target.value)}
                  className="h-10 bg-white/5 border-white/10 text-white"
                  data-testid="input-delivery-country"
                />
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-white/60">Payment Method</Label>
              <div className={`grid gap-3 ${cashPaymentAllowed ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className={`h-14 gap-2 ${
                    paymentMethod === "card" 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "border-white/20 text-white hover:bg-white/10"
                  }`}
                  onClick={() => setPaymentMethod("card")}
                  data-testid="button-payment-card"
                >
                  <CreditCard className="w-5 h-5" />
                  Card
                </Button>
                {cashPaymentAllowed && (
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    className={`h-14 gap-2 ${
                      paymentMethod === "cash" 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                    onClick={() => setPaymentMethod("cash")}
                    data-testid="button-payment-cash"
                  >
                    <Banknote className="w-5 h-5" />
                    Cash
                  </Button>
                )}
              </div>
              {!cashPaymentAllowed && (
                <p className="text-xs text-white/40 mt-1">
                  Cash payment is only available for your own products
                </p>
              )}
            </div>

            {/* Card Payment with Square Checkout */}
            {paymentMethod === "card" && (
              <div className="space-y-3">
                {!validateEmail(customerEmail) && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <p className="text-yellow-400 text-sm">
                      Please enter a valid email address for the receipt
                    </p>
                  </div>
                )}
                
                {/* Square Payment Info */}
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span className="text-white text-sm">Secure Card Payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span>Accepts:</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <SiApplepay className="w-6 h-4" />
                      <SiGooglepay className="w-6 h-4" />
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleSquareCardPayment}
                  disabled={!validateEmail(customerEmail) || isPaymentProcessing || (deliveryMethod === 'collection' && !selectedStore)}
                  className="w-full h-14 text-lg gap-2 bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-square-pay"
                >
                  {isPaymentProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirecting to Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Pay {formatCurrency(cartTotal)} with Card
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Cash Payment Button */}
            {paymentMethod === "cash" && (
              <Button
                size="lg"
                className="w-full h-14 text-lg gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                disabled={!validateEmail(customerEmail) || completePurchaseMutation.isPending || (deliveryMethod === 'collection' && !selectedStore)}
                onClick={() => completePurchaseMutation.mutate()}
                data-testid="button-complete-order"
              >
                {completePurchaseMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {completePurchaseMutation.isPending ? "Processing..." : `Complete Order - ${formatCurrency(cartTotal)}`}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Order Complete
            </DialogTitle>
          </DialogHeader>

          {receiptData && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-white/60 text-sm">Order Number</p>
                <p className="text-2xl font-bold text-white">{receiptData.orderNumber}</p>
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
                  data-testid="button-new-order"
                >
                  New Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
