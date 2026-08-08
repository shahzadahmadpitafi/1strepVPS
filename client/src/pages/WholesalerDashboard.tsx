import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  LogOut, Package, ShoppingCart, Box, Truck, CreditCard, Clock, 
  CheckCircle, XCircle, Plus, Minus, Trash2, Search, Filter, 
  AlertTriangle, Eye, ChevronRight, Loader2, Store, MessageSquare, Send, User, Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { motion } from "framer-motion";
import { SiApplepay, SiGooglepay } from "react-icons/si";

interface WholesaleProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  imageUrl: string;
  retailPrice: string;
  wholesalePrice: string;
  variants: WholesaleVariant[];
  colorImages: { color: string; url: string }[];
}

interface WholesaleVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  retailPrice: string;
  wholesalePrice: string;
  wholesaleSalePrice: string | null;
  stockQuantity: number;
  availabilityStatus: string;
}

interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantSize: string;
  variantColor: string;
  sku: string;
  wholesalePrice: number;
  quantity: number;
  imageUrl: string;
}

interface WholesaleOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  currency: string;
  notes: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  contactPhone: string | null;
  stripePaymentIntentId: string | null;
  stripePaymentStatus: string | null;
  paidAt: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    productSku: string;
    variantSize: string | null;
    variantColor: string | null;
    wholesalePrice: string;
    quantity: number;
    lineTotal: string;
  }>;
}

interface WholesalerMessageType {
  id: string;
  vendorId: string;
  senderId: string;
  messageType: string;
  subject: string | null;
  content: string;
  orderId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

// Square Payment redirect function - moved inside component to access order data

export default function WholesalerDashboard() {
  const [selectedTab, setSelectedTab] = useState("products");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null);
  
  const [shippingForm, setShippingForm] = useState({
    address: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    phone: "",
    notes: ""
  });
  
  // Track quantity selections for each variant (for quick add)
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; email: string; role: string }>({
    queryKey: ['/api/auth/me'],
  });

  const isVendor = Boolean(authUser && authUser.role === "vendor");

  const { data: vendorData } = useQuery<{ vendor: { businessName: string } }>({
    queryKey: ["/api/vendor/dashboard"],
    enabled: isVendor,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<WholesaleProduct[]>({
    queryKey: ["/api/wholesaler/products"],
    enabled: isVendor,
  });

  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery<WholesaleOrder[]>({
    queryKey: ["/api/wholesaler/orders"],
    enabled: isVendor,
  });

  // Messages state and queries
  const [newMessage, setNewMessage] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageType, setMessageType] = useState("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<WholesalerMessageType[]>({
    queryKey: ["/api/wholesaler/messages"],
    enabled: isVendor,
  });

  const unreadMessages = messages.filter(m => !m.isRead && m.sender?.role === 'admin');

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { messageType: string; subject?: string; content: string }) => {
      return await apiRequest('POST', '/api/wholesaler/messages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesaler/messages"] });
      setNewMessage("");
      setMessageSubject("");
      setMessageType("general");
      toast({ title: "Message sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const markMessageReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('PATCH', `/api/wholesaler/messages/${messageId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wholesaler/messages"] });
    },
  });

  // Mark unread admin messages as read when viewing messages tab
  useEffect(() => {
    if (selectedTab === 'messages' && authUser && unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        markMessageReadMutation.mutate(msg.id);
      });
    }
  }, [selectedTab, unreadMessages.length, authUser?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedTab]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({ title: "Please enter a message", variant: "destructive" });
      return;
    }
    sendMessageMutation.mutate({
      messageType,
      subject: messageSubject.trim() || undefined,
      content: newMessage.trim(),
    });
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/wholesaler/orders", orderData);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Order Submitted!", 
        description: "Your wholesale order has been submitted for review." 
      });
      setCart([]);
      setShowCheckout(false);
      setShippingForm({ address: "", city: "", postcode: "", country: "United Kingdom", phone: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/wholesaler/orders"] });
      setSelectedTab("orders");
    },
    onError: (error: any) => {
      toast({ 
        title: "Order Failed", 
        description: error.message || "Failed to submit order",
        variant: "destructive" 
      });
    }
  });

  // Handle Square checkout for wholesale orders
  const handleSquarePayment = async (orderId: string, order: WholesaleOrder) => {
    setIsPaymentProcessing(true);
    setSelectedOrderId(orderId);
    
    try {
      // Store order data in sessionStorage for retrieval after Square redirect
      sessionStorage.setItem('wholesaleOrderId', orderId);
      sessionStorage.setItem('wholesaleOrderNumber', order.orderNumber);
      
      // Create Square checkout for wholesale order
      const response = await apiRequest("POST", "/api/square/create-wholesale-checkout", {
        amount: parseFloat(order.totalAmount),
        currency: 'GBP',
        orderId: orderId,
        businessName: wholesaler?.businessName,
        lineItems: order.items?.map((item: any) => ({
          name: item.productName || 'Wholesale Item',
          quantity: item.quantity,
          unitPrice: item.wholesalePrice,
          size: item.variantSize || null,
          color: item.variantColor || null,
        })) || [{
          name: `Wholesale Order #${order.orderNumber}`,
          quantity: 1,
          unitPrice: order.totalAmount,
        }],
        redirectUrl: `${window.location.origin}/wholesaler?payment=success&orderId=${orderId}`,
      });
      
      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        // Store Square reference for verification
        sessionStorage.setItem('wholesaleSquareOrderId', data.squareOrderId || '');
        
        // Redirect to Square hosted checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error: any) {
      console.error('Square wholesale checkout error:', error);
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
    const orderId = urlParams.get('orderId');
    const transactionId = urlParams.get('transactionId');
    
    if (paymentSuccess === 'success' && orderId) {
      const storedOrderNumber = sessionStorage.getItem('wholesaleOrderNumber');
      const squareOrderId = sessionStorage.getItem('wholesaleSquareOrderId');
      
      // Confirm payment in backend
      apiRequest("POST", `/api/wholesaler/orders/${orderId}/confirm-payment`, {
        squarePaymentId: transactionId || squareOrderId,
        paymentMethod: 'square',
      }).then(() => {
        toast({
          title: "Payment Successful!",
          description: `Order ${storedOrderNumber || orderId} is now being processed.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/wholesaler/orders"] });
      }).catch((error) => {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Confirmation Issue",
          description: "Payment was received but confirmation had an issue. Please contact support.",
          variant: "destructive",
        });
      });
      
      // Clear stored data
      sessionStorage.removeItem('wholesaleOrderId');
      sessionStorage.removeItem('wholesaleOrderNumber');
      sessionStorage.removeItem('wholesaleSquareOrderId');
      
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.invalidateQueries();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const addToCart = (product: WholesaleProduct, variant: WholesaleVariant, quantity: number = 1) => {
    if (quantity < 1) return;
    
    const existingIndex = cart.findIndex(
      item => item.productId === product.id && item.variantId === variant.id
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      const wholesalePrice = parseFloat(variant.wholesaleSalePrice || variant.wholesalePrice);
      const colorImage = product.colorImages.find(ci => ci.color === variant.color);
      
      setCart([...cart, {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantSize: variant.size,
        variantColor: variant.color,
        sku: variant.sku || product.sku,
        wholesalePrice,
        quantity,
        imageUrl: colorImage?.url || product.imageUrl
      }]);
    }

    // Reset the quantity selector for this variant
    setVariantQuantities(prev => ({ ...prev, [variant.id]: 1 }));
    toast({ title: "Added to cart", description: `${quantity}x ${product.name} - ${variant.size} / ${variant.color}` });
  };
  
  const getVariantQuantity = (variantId: string) => variantQuantities[variantId] || 1;
  
  const updateVariantQuantity = (variantId: string, delta: number) => {
    const current = getVariantQuantity(variantId);
    const newQty = Math.max(1, current + delta);
    setVariantQuantities(prev => ({ ...prev, [variantId]: newQty }));
  };
  
  const setVariantQuantity = (variantId: string, qty: number) => {
    const newQty = Math.max(1, qty);
    setVariantQuantities(prev => ({ ...prev, [variantId]: newQty }));
  };

  const updateCartQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity = Math.max(1, updated[index].quantity + delta);
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.wholesalePrice * item.quantity, 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = () => {
    if (!shippingForm.address || !shippingForm.city || !shippingForm.postcode) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all shipping details",
        variant: "destructive" 
      });
      return;
    }

    createOrderMutation.mutate({
      items: cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      })),
      shippingAddress: shippingForm.address,
      shippingCity: shippingForm.city,
      shippingPostcode: shippingForm.postcode,
      shippingCountry: shippingForm.country,
      contactPhone: shippingForm.phone || null,
      notes: shippingForm.notes || null
    });
  };

  const handlePayOrder = (order: WholesaleOrder) => {
    handleSquarePayment(order.id, order);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved - Pay Now</Badge>;
      case "paid":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700"><CreditCard className="h-3 w-3 mr-1" />Paid</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-purple-500/20 text-purple-700"><Box className="h-3 w-3 mr-1" />Processing</Badge>;
      case "shipped":
        return <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-700"><Truck className="h-3 w-3 mr-1" />Shipped</Badge>;
      case "delivered":
        return <Badge variant="secondary" className="bg-green-600/20 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "cancelled":
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You must be an approved wholesaler to access this dashboard.</p>
            <Button onClick={() => navigate("/")}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Wholesale Portal</h1>
              <p className="text-sm text-muted-foreground">Wholesaler</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(true)}
              className="relative"
              disabled={cart.length === 0}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart ({cart.length})
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="h-4 w-4 mr-2" />
              Browse Products
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Box className="h-4 w-4 mr-2" />
              My Orders
              {orders.filter(o => o.status === "approved").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {orders.filter(o => o.status === "approved").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-category">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full flex flex-col hover-elevate" data-testid={`card-product-${product.id}`}>
                      <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted/30">
                        <img
                          src={convertToDirectUrl(product.imageUrl)}
                          alt={product.name}
                          className="w-full h-full object-contain p-2"
                        />
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          {product.category}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-xl font-bold text-primary">£{parseFloat(product.wholesalePrice).toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground line-through">RRP £{parseFloat(product.retailPrice).toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">SKU: {product.sku}</p>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Select Variant & Quantity:</p>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {product.variants.map((variant) => {
                              const price = parseFloat(variant.wholesaleSalePrice || variant.wholesalePrice);
                              const isAvailable = variant.stockQuantity > 0 && variant.availabilityStatus !== "out_of_stock";
                              const qty = getVariantQuantity(variant.id);
                              
                              return (
                                <div 
                                  key={variant.id}
                                  className="flex flex-col gap-2 p-2 rounded bg-muted/50 text-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium">{variant.size}</span>
                                      {variant.color && <span className="text-muted-foreground"> / {variant.color}</span>}
                                    </div>
                                    <span className="text-primary font-medium">£{price.toFixed(2)}</span>
                                  </div>
                                  {isAvailable ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center border rounded-md">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() => updateVariantQuantity(variant.id, -1)}
                                          data-testid={`button-qty-minus-${variant.id}`}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={qty}
                                          onChange={(e) => setVariantQuantity(variant.id, parseInt(e.target.value) || 1)}
                                          className="w-14 h-8 text-center border-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          data-testid={`input-qty-${variant.id}`}
                                        />
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() => updateVariantQuantity(variant.id, 1)}
                                          data-testid={`button-qty-plus-${variant.id}`}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => addToCart(product, variant, qty)}
                                        className="flex-1"
                                        data-testid={`button-add-variant-${variant.id}`}
                                      >
                                        <ShoppingCart className="h-3 w-3 mr-1" />
                                        Add {qty > 1 ? `(${qty})` : ""}
                                      </Button>
                                    </div>
                                  ) : (
                                    <Badge variant="secondary" className="self-start">Out of Stock</Badge>
                                  )}
                                  {isAvailable && (
                                    <p className="text-xs text-muted-foreground">
                                      {variant.stockQuantity} in stock
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                  <Button onClick={() => setSelectedTab("products")}>
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} data-testid={`card-order-${order.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <CardDescription>
                            {new Date(order.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </CardDescription>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Items</p>
                          <ul className="text-sm space-y-1">
                            {order.items.slice(0, 3).map((item) => (
                              <li key={item.id}>
                                {item.quantity}x {item.productName}
                                {item.variantSize && <span className="text-muted-foreground"> ({item.variantSize})</span>}
                              </li>
                            ))}
                            {order.items.length > 3 && (
                              <li className="text-muted-foreground">+{order.items.length - 3} more items</li>
                            )}
                          </ul>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Total</p>
                          <p className="text-2xl font-bold">£{parseFloat(order.totalAmount).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {order.status === "rejected" && order.rejectionReason && (
                        <div className="mt-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
                          <strong>Rejection Reason:</strong> {order.rejectionReason}
                        </div>
                      )}
                      
                      {order.status === "shipped" && order.trackingNumber && (
                        <div className="mt-4 p-3 rounded bg-muted text-sm">
                          <strong>Tracking:</strong> {order.trackingCarrier} - {order.trackingNumber}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        data-testid={`button-view-order-${order.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {order.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => handlePayOrder(order)}
                          disabled={isPaymentProcessing}
                          data-testid={`button-pay-order-${order.id}`}
                        >
                          {isPaymentProcessing && selectedOrderId === order.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-1" />
                          )}
                          Pay with Square
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <CardTitle>Messages</CardTitle>
                  </div>
                  {unreadMessages.length > 0 && (
                    <Badge className="bg-primary">
                      {unreadMessages.length} unread
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Contact our team with any questions about your orders or account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Start a conversation with our team</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isFromAdmin = message.sender?.role === 'admin';
                        const isFromMe = message.senderId === authUser?.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${isFromMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div className="flex items-center gap-2">
                                {isFromAdmin ? (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Shield className="h-3 w-3" />
                                    <span>1stRep Team</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>You</span>
                                  </div>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {message.messageType === 'order' ? 'Order Query' :
                                   message.messageType === 'product' ? 'Product Inquiry' :
                                   message.messageType === 'support' ? 'Support' : 'General'}
                                </Badge>
                              </div>

                              {message.subject && (
                                <p className="text-sm font-medium text-foreground">
                                  {message.subject}
                                </p>
                              )}

                              <div
                                className={`rounded-lg p-3 ${
                                  isFromMe
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="message-type" className="text-xs">Type</Label>
                      <Select value={messageType} onValueChange={setMessageType}>
                        <SelectTrigger className="mt-1" data-testid="select-message-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="order">Order Query</SelectItem>
                          <SelectItem value="product">Product Inquiry</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-xs">Subject (Optional)</Label>
                      <Input
                        id="subject"
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        placeholder="Enter subject..."
                        className="mt-1"
                        data-testid="input-message-subject"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !newMessage.trim()}
                      size="icon"
                      className="h-auto"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Review your order and provide shipping details</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Cart Items ({cart.length})</h3>
              <ScrollArea className="h-48">
                {cart.map((item, index) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <img
                      src={convertToDirectUrl(item.imageUrl)}
                      alt={item.productName}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{item.variantSize} / {item.variantColor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateCartQuantity(index, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateCartQuantity(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-medium w-20 text-right">£{(item.wholesalePrice * item.quantity).toFixed(2)}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
              <div className="flex justify-between items-center pt-4 border-t mt-2">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">£{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Items in cart:</span>
                <span className="text-green-600 font-medium">
                  {cartQuantity}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Shipping Details</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                    placeholder="123 Business Street"
                    data-testid="input-address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      placeholder="London"
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      value={shippingForm.postcode}
                      onChange={(e) => setShippingForm({ ...shippingForm, postcode: e.target.value })}
                      placeholder="SW1A 1AA"
                      data-testid="input-postcode"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    placeholder="+44 20 1234 5678"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes</Label>
                  <Textarea
                    id="notes"
                    value={shippingForm.notes}
                    onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                    placeholder="Any special instructions for your order..."
                    rows={2}
                    data-testid="input-notes"
                  />
                </div>
              </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Continue Shopping
            </Button>
            <Button 
              onClick={handleSubmitOrder}
              disabled={createOrderMutation.isPending || cart.length === 0}
              data-testid="button-submit-order"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Order for Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Square payment uses redirect - no dialog needed */}

      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>{selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedOrder.status)}
                <span className="text-muted-foreground text-sm">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString("en-GB")}
                </span>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        {(item.variantSize || item.variantColor) && (
                          <span className="text-muted-foreground ml-2">
                            ({[item.variantSize, item.variantColor].filter(Boolean).join(" / ")})
                          </span>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">£{parseFloat(item.lineTotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t font-bold">
                  <span>Total</span>
                  <span>£{parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Shipping Address</h4>
                <p className="text-sm">
                  {selectedOrder.shippingAddress}<br />
                  {selectedOrder.shippingCity}, {selectedOrder.shippingPostcode}<br />
                  {selectedOrder.shippingCountry}
                </p>
                {selectedOrder.contactPhone && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Phone: {selectedOrder.contactPhone}
                  </p>
                )}
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Order Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                </>
              )}

              {selectedOrder.status === "shipped" && selectedOrder.trackingNumber && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Tracking Information</h4>
                    <p className="text-sm">
                      Carrier: {selectedOrder.trackingCarrier || "N/A"}<br />
                      Tracking Number: {selectedOrder.trackingNumber}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
            {selectedOrder?.status === "approved" && (
              <Button onClick={() => {
                setShowOrderDetails(false);
                handlePayOrder(selectedOrder.id);
              }}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
