import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, Search, Plus, Minus, Trash2, 
  CreditCard, Banknote, Store, ChevronRight,
  ShoppingBag, Grid3X3, LayoutGrid, Printer, Download, Mail, CheckCircle, ArrowLeft, Ticket, X, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, sortSizes } from "@/lib/utils";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Storefront {
  id: string;
  resellerId: string;
  slug: string;
  storeName: string;
  storeDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
  reseller: {
    id: string;
    businessName: string;
    contactPerson: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  imageUrl: string | null;
  sizes: string[] | null;
  colors: string[] | null;
  availabilityStatus: string;
  resellerProductId: string;
  sku?: string;
}

interface CartItem {
  id: string;
  productId: string;
  resellerProductId: string;
  name: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: string;
  imageUrl?: string;
}

interface ReceiptData {
  orderNumber: string;
  storeName: string;
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
  tax: number;
  total: number;
  paymentMethod: string;
  customerEmail?: string;
}

interface StoreLocation {
  id: string;
  businessName: string;
  businessAddress: string;
  phoneNumber?: string;
  storefrontSlug?: string | null;
}

export default function ResellerStorefrontEPOS() {
  const [, params] = useRoute("/store/:slug/epos");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [cartOpen, setCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "large">("large");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutTimeRemaining, setCheckoutTimeRemaining] = useState(60);
  
  // Delivery method state (home delivery or in-store collection)
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "collection">("delivery");
  const [selectedCollectionStore, setSelectedCollectionStore] = useState<StoreLocation | null>(null);

  // Coupon code state (B2B Partner Coupons - reseller-specific)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    coupon: { id: string; code: string; discountType: string; discountValue: string; maxDiscount: string | null }; 
    discount: number 
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const { data: storefront, isLoading: storefrontLoading } = useQuery<Storefront>({
    queryKey: ["/api/storefronts", slug],
    enabled: Boolean(slug)
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/storefronts", slug, "products"],
    enabled: Boolean(slug) && Boolean(storefront)
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

  useEffect(() => {
    if (storefront?.primaryColor) {
      document.documentElement.style.setProperty('--storefront-primary', storefront.primaryColor);
    }
    if (storefront?.accentColor) {
      document.documentElement.style.setProperty('--storefront-accent', storefront.accentColor);
    }

    return () => {
      document.documentElement.style.removeProperty('--storefront-primary');
      document.documentElement.style.removeProperty('--storefront-accent');
    };
  }, [storefront]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const orderNumber = urlParams.get("order");
    
    if (success === "true" && orderNumber) {
      const storedItems = sessionStorage.getItem("resellerEposCartItems");
      const storedEmail = sessionStorage.getItem("resellerEposCustomerEmail");
      const storedStoreName = sessionStorage.getItem("resellerEposStoreName");
      const storedOrderData = sessionStorage.getItem("resellerEposOrderData");
      let items: ReceiptData["items"] = [];
      let subtotal = 0;
      let tax = 0;
      let total = 0;
      
      if (storedOrderData) {
        const orderData = JSON.parse(storedOrderData);
        subtotal = parseFloat(orderData.subtotal);
        tax = parseFloat(orderData.tax);
        total = parseFloat(orderData.total);
      }
      
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
        sessionStorage.removeItem("resellerEposCartItems");
        sessionStorage.removeItem("resellerEposCustomerEmail");
        sessionStorage.removeItem("resellerEposStoreName");
        sessionStorage.removeItem("resellerEposOrderData");
      }
      
      setReceiptData({
        orderNumber,
        storeName: storedStoreName || storefront?.storeName || "Store",
        timestamp: new Date().toLocaleString("en-GB"),
        items,
        subtotal,
        tax,
        total,
        paymentMethod: "Card",
        customerEmail: storedEmail || "",
      });
      setShowReceipt(true);
      
      window.history.replaceState({}, "", window.location.pathname);
      
      toast({
        title: "Payment Successful!",
        description: `Order ${orderNumber} has been confirmed`,
      });
    }
  }, [storefront]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  const completePurchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reseller-storefront/checkout", {
        storefrontSlug: slug,
        resellerId: storefront?.resellerId,
        items: cartItems.map(item => ({
          resellerProductId: item.resellerProductId,
          productId: item.productId,
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
        customerEmail,
        paymentMethod,
        deliveryMethod,
        collectionStoreId: deliveryMethod === 'collection' ? selectedCollectionStore?.id : undefined,
        collectionStoreName: deliveryMethod === 'collection' ? selectedCollectionStore?.businessName : undefined,
        couponCode: appliedCoupon?.coupon?.code || null,
        couponId: appliedCoupon?.coupon?.id || null,
        discountAmount: appliedCoupon?.discount || 0,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        sessionStorage.setItem("resellerEposCartItems", JSON.stringify(cartItems));
        sessionStorage.setItem("resellerEposCustomerEmail", customerEmail);
        sessionStorage.setItem("resellerEposStoreName", storefront?.storeName || "Store");
        sessionStorage.setItem("resellerEposOrderData", JSON.stringify({
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
        }));
        window.location.href = data.checkoutUrl;
      } else {
        setReceiptData({
          orderNumber: data.orderNumber,
          storeName: storefront?.storeName || "Store",
          timestamp: new Date().toLocaleString("en-GB"),
          items: cartItems.map(item => ({
            name: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
          })),
          subtotal: parseFloat(data.subtotal),
          tax: parseFloat(data.tax),
          total: parseFloat(data.total),
          paymentMethod: paymentMethod === "cash" ? "Cash" : "Card",
          customerEmail,
        });
        
        setShowReceipt(true);
        setCartItems([]);
        setShowCheckout(false);
        setCustomerEmail("");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetSelection = () => {
    setSelectedSize("");
    setSelectedColor("");
    setSelectedQuantity(1);
    setSelectedProduct(null);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes?.[0] || "");
    setSelectedColor(product.colors?.[0] || "");
    setShowProductModal(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const newItem: CartItem = {
      id: `cart-${Date.now()}`,
      productId: selectedProduct.id,
      resellerProductId: selectedProduct.resellerProductId,
      name: selectedProduct.name,
      size: selectedSize,
      color: selectedColor,
      quantity: selectedQuantity,
      unitPrice: selectedProduct.price,
      imageUrl: selectedProduct.imageUrl || undefined,
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

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const sizes = product.sizes || [];
    const colors = product.colors || [];
    
    if (sizes.length <= 1 && colors.length <= 1) {
      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        productId: product.id,
        resellerProductId: product.resellerProductId,
        name: product.name,
        size: sizes[0],
        color: colors[0],
        quantity: 1,
        unitPrice: product.price,
        imageUrl: product.imageUrl || undefined,
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

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
    0
  );
  const cartTax = cartSubtotal * 0.2;
  const cartDiscount = appliedCoupon?.discount || 0;
  const cartTotal = Math.max(0, cartSubtotal + cartTax - cartDiscount);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Validate and apply coupon for this storefront's reseller
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !storefront?.resellerId) return;
    
    setCouponLoading(true);
    try {
      const response = await apiRequest("POST", "/api/b2b/validate-coupon", {
        code: couponCode.trim().toUpperCase(),
        orderTotal: cartSubtotal,
        partnerId: storefront.resellerId,
      });
      const data = await response.json();
      
      if (!data.valid || !data.coupon) {
        throw new Error(data.error || "Invalid coupon code");
      }
      
      const mappedCoupon = {
        coupon: data.coupon,
        discount: parseFloat(data.calculatedDiscount || data.discount || "0"),
      };
      setAppliedCoupon(mappedCoupon);
      
      const discountText = data.coupon.discountType === 'percentage' 
        ? `${Number(data.coupon.discountValue)}% discount applied` 
        : `£${data.calculatedDiscount || mappedCoupon.discount} discount applied`;
      
      toast({
        title: "Coupon Applied!",
        description: discountText,
      });
    } catch (error: any) {
      toast({
        title: "Invalid Coupon",
        description: error?.message || "This coupon code is not valid for this store",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({ title: "Coupon removed" });
  };

  const printReceipt = async () => {
    const receiptElement = document.getElementById('receipt-content');
    if (!receiptElement) return;

    try {
      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      pdf.autoPrint();
      pdf.output('dataurlnewwindow');
    } catch (error) {
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const downloadReceipt = async () => {
    const receiptElement = document.getElementById('receipt-content');
    if (!receiptElement) return;

    try {
      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height * 80) / canvas.width);
      pdf.save(`receipt-${receiptData?.orderNumber}.pdf`);
      toast({ title: "Receipt downloaded" });
    } catch (error) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  if (storefrontLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <Store className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Store Not Found</h2>
            <p className="text-white/60 mb-6">This store doesn't exist or is no longer available.</p>
            <Button onClick={() => navigate("/")} data-testid="button-back-home">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showReceipt && receiptData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div>
                <h2 className="text-2xl font-bold text-white">Order Complete!</h2>
                <p className="text-white/60">Thank you for your purchase</p>
              </div>
            </div>

            <div 
              id="receipt-content" 
              className="bg-white text-black p-4 rounded-lg mb-6"
              style={{ fontFamily: "'Courier New', monospace", fontSize: '12px' }}
            >
              <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h3 className="text-lg font-bold">{receiptData.storeName}</h3>
                <p className="text-xs text-gray-600">Powered by 1stRep</p>
              </div>

              <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <p><strong>Order:</strong> {receiptData.orderNumber}</p>
                <p className="text-xs">{receiptData.timestamp}</p>
              </div>

              <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.size && `${item.size}`}
                        {item.size && item.color && ' / '}
                        {item.color && `${item.color}`}
                        {' x '}{item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(parseFloat(item.totalPrice))}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (20%)</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-400 text-center">
                <p>Payment: {receiptData.paymentMethod}</p>
                {receiptData.customerEmail && (
                  <p className="text-xs mt-1">Receipt sent to: {receiptData.customerEmail}</p>
                )}
                <p className="text-xs mt-4 text-gray-500">Thank you for shopping with us!</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button variant="outline" onClick={printReceipt} className="gap-2" data-testid="button-print-receipt">
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button variant="outline" onClick={downloadReceipt} className="gap-2" data-testid="button-download-receipt">
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>

            <Button 
              className="w-full" 
              onClick={() => {
                setShowReceipt(false);
                setReceiptData(null);
              }}
              data-testid="button-new-order"
            >
              Start New Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {storefront.logoUrl ? (
                <img src={convertToDirectUrl(storefront.logoUrl)} alt={storefront.storeName} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <Store className="w-8 h-8 text-primary" />
              )}
              <div>
                <h1 className="text-xl font-bold text-white">{storefront.storeName}</h1>
                <p className="text-xs text-white/60">Self-Checkout</p>
              </div>
            </div>

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

            <div className="flex items-center gap-3">
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

                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          <div className="flex justify-between items-center text-white/60">
                            <span>Subtotal</span>
                            <span>{formatCurrency(cartSubtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-white/60">
                            <span>VAT (20%)</span>
                            <span>{formatCurrency(cartTax)}</span>
                          </div>
                          
                          {/* Coupon Code Section */}
                          <div className="pt-2">
                            {appliedCoupon ? (
                              <div className="flex items-center justify-between p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-4 h-4 text-green-500" />
                                  <span className="text-green-400 font-medium">{appliedCoupon.coupon.code}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    -{appliedCoupon.coupon.discountType === 'percentage' 
                                      ? `${appliedCoupon.coupon.discountValue}%` 
                                      : formatCurrency(parseFloat(appliedCoupon.coupon.discountValue))}
                                  </Badge>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-white/60 hover:text-white"
                                  onClick={handleRemoveCoupon}
                                  data-testid="button-remove-coupon"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Coupon code"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                  data-testid="input-coupon-code"
                                />
                                <Button
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10"
                                  onClick={handleApplyCoupon}
                                  disabled={!couponCode.trim() || couponLoading}
                                  data-testid="button-apply-coupon"
                                >
                                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {appliedCoupon && (
                            <div className="flex justify-between items-center text-green-400">
                              <span>Discount</span>
                              <span>-{formatCurrency(appliedCoupon.discount)}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <span className="text-white font-semibold">Total</span>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="aspect-[3/4] bg-white/5" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="w-16 h-16 text-white/20 mb-4" />
            <p className="text-white/60 text-xl">No products found</p>
            <p className="text-white/40 mt-2">Try adjusting your search</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "large" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          }`}>
            {filteredProducts.map((product, index) => {
              const isOutOfStock = product.availabilityStatus === 'out_of_stock';
              
              return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`group bg-white/5 border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-primary/50 ${
                    isOutOfStock ? 'opacity-60' : ''
                  }`}
                  onClick={() => !isOutOfStock && openProductModal(product)}
                  data-testid={`product-card-${product.id}`}
                >
                  <div className={`relative overflow-hidden bg-gradient-to-br from-white/5 to-white/0 ${
                    viewMode === "large" ? "aspect-[4/5]" : "aspect-square"
                  }`}>
                    {product.imageUrl ? (
                      <img
                        src={convertToDirectUrl(product.imageUrl)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    
                    {/* Quick Add Button - hide if out of stock */}
                    {!isOutOfStock && (
                      <Button
                        size="icon"
                        className="absolute bottom-3 right-3 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={(e) => handleQuickAdd(product, e)}
                        data-testid={`button-quick-add-${product.id}`}
                      >
                        <Plus className="w-6 h-6" />
                      </Button>
                    )}

                    {product.category && (
                      <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white border-0">
                        {product.category}
                      </Badge>
                    )}
                    
                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
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
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className={`font-bold text-primary ${
                        viewMode === "large" ? "text-2xl" : "text-lg"
                      }`}>
                        {formatCurrency(parseFloat(product.price))}
                      </p>
                      
                      {viewMode === "large" && product.sizes && product.sizes.length > 0 && (
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

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl bg-black border-white/10 p-0 overflow-hidden">
          {selectedProduct && (
            <div className="grid md:grid-cols-2">
              <div className="aspect-square bg-gradient-to-br from-white/5 to-white/0">
                {selectedProduct.imageUrl ? (
                  <img
                    src={convertToDirectUrl(selectedProduct.imageUrl)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-24 h-24 text-white/20" />
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col">
                <DialogHeader>
                  {selectedProduct.category && (
                    <Badge className="w-fit mb-2">{selectedProduct.category}</Badge>
                  )}
                  <DialogTitle className="text-2xl text-white">
                    {selectedProduct.name}
                  </DialogTitle>
                  <DialogDescription className="text-white/60">
                    {selectedProduct.sku && `SKU: ${selectedProduct.sku}`}
                  </DialogDescription>
                </DialogHeader>

                <p className="text-3xl font-bold text-primary mt-4">
                  {formatCurrency(parseFloat(selectedProduct.price))}
                </p>

                {selectedProduct.description && (
                  <p className="text-white/60 mt-4 text-sm">
                    {selectedProduct.description}
                  </p>
                )}

                <Separator className="my-6 bg-white/10" />

                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label className="text-white/60 text-xs uppercase tracking-wider">
                      Select Size
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {sortSizes(selectedProduct.sizes).map((size) => (
                        <Button
                          key={size}
                          variant={selectedSize === size ? "default" : "outline"}
                          className={`min-w-[48px] ${
                            selectedSize !== size && "border-white/20 text-white hover:bg-white/10"
                          }`}
                          onClick={() => setSelectedSize(size)}
                          data-testid={`button-size-${size}`}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label className="text-white/60 text-xs uppercase tracking-wider">
                      Select Colour
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.colors.map((color) => (
                        <Button
                          key={color}
                          variant={selectedColor === color ? "default" : "outline"}
                          className={`${
                            selectedColor !== color && "border-white/20 text-white hover:bg-white/10"
                          }`}
                          onClick={() => setSelectedColor(color)}
                          data-testid={`button-color-${color}`}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <Label className="text-white/60 text-xs uppercase tracking-wider">
                    Quantity
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-white/20"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      data-testid="button-qty-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold text-white w-12 text-center">
                      {selectedQuantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-white/20"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                      data-testid="button-qty-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-lg gap-2 mt-auto"
                  onClick={handleAddToCart}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart - {formatCurrency(parseFloat(selectedProduct.price) * selectedQuantity)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md bg-black border-white/10">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Complete Purchase
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
            <div className="space-y-2">
              <Label className="text-white/80">Email (optional - for receipt)</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-email"
              />
            </div>

            {/* Delivery Method Selection */}
            {siteSettings?.inStoreCollectionEnabled && storeLocations.length > 0 && (
              <div className="space-y-3">
                <Label className="text-white/80">Delivery Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={deliveryMethod === "delivery" ? "default" : "outline"}
                    className={`h-14 gap-2 ${
                      deliveryMethod === "delivery"
                        ? ""
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setDeliveryMethod("delivery");
                      setSelectedCollectionStore(null);
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
                        ? ""
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
                            selectedCollectionStore?.id === store.id
                              ? "bg-primary/20 border-primary"
                              : "bg-white/5 border-white/10 hover:border-white/30"
                          }`}
                          onClick={() => setSelectedCollectionStore(store)}
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
                    {deliveryMethod === "collection" && !selectedCollectionStore && (
                      <p className="text-yellow-400 text-xs">Please select a store for collection</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-white/80">Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className={`h-16 flex-col gap-1 ${
                    paymentMethod !== "card" && "border-white/20 text-white hover:bg-white/10"
                  }`}
                  onClick={() => setPaymentMethod("card")}
                  data-testid="button-payment-card"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Card</span>
                </Button>
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className={`h-16 flex-col gap-1 ${
                    paymentMethod !== "cash" && "border-white/20 text-white hover:bg-white/10"
                  }`}
                  onClick={() => setPaymentMethod("cash")}
                  data-testid="button-payment-cash"
                >
                  <Banknote className="w-6 h-6" />
                  <span>Cash</span>
                </Button>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-2">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>VAT (20%)</span>
                <span>{formatCurrency(cartTax)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-400">
                  <span className="flex items-center gap-1">
                    <Ticket className="w-4 h-4" />
                    Discount ({appliedCoupon.coupon.code})
                  </span>
                  <span>-{formatCurrency(appliedCoupon.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={() => completePurchaseMutation.mutate()}
              disabled={completePurchaseMutation.isPending || (deliveryMethod === 'collection' && !selectedCollectionStore)}
              data-testid="button-complete-purchase"
            >
              {completePurchaseMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {paymentMethod === "card" ? <CreditCard className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                  Pay {formatCurrency(cartTotal)}
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
