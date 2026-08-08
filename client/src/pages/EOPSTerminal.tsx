import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Wifi, WifiOff, LogOut, Eye, EyeOff, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import BarcodeScanner from "@/components/epos/BarcodeScanner";
import CartDisplay from "@/components/epos/CartDisplay";
import CustomerDisplay from "@/components/epos/CustomerDisplay";
import ReceiptPrinter from "@/components/epos/ReceiptPrinter";
import EOPSOfflineStorage from "@/lib/offlineStorage";
import { formatCurrency } from "@/lib/utils";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcodeDescriptor?: string;
  retailPrice: string;
  category: string;
  sizes: string[];
  colors: string[];
  imageUrl?: string;
}

export default function EOPSTerminal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const offlineStorage = EOPSOfflineStorage.getInstance();
  const receiptPrinterRef = useRef<any>(null);

  // State
  const [terminalId] = useState(() => sessionStorage.getItem("terminalId") || generateUUID());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [showCustomerDisplay, setShowCustomerDisplay] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "net_terms">("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [printTriggered, setPrintTriggered] = useState(false);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch reseller info (optional - for resellers only)
  const { data: resellerData } = useQuery<any>({
    queryKey: ["/api/reseller/dashboard"],
    retry: false,
  });

  // Save terminal ID to session
  useEffect(() => {
    sessionStorage.setItem("terminalId", terminalId);
  }, [terminalId]);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Back Online" });
      // Sync queued orders
      syncQueuedOrders();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: "Offline Mode", description: "Orders will be synced when back online" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-print receipt after order completes
  useEffect(() => {
    if (completedOrder && !printTriggered && receiptPrinterRef.current) {
      setPrintTriggered(true);
      // Wait a moment for component to render, then trigger print
      setTimeout(() => {
        receiptPrinterRef.current?.printReceipt();
      }, 500);
    }
  }, [completedOrder, printTriggered]);

  // Cache products on load
  useEffect(() => {
    if (products.length > 0) {
      offlineStorage.cacheProducts(products);
      offlineStorage.setLastSync();
    }
  }, [products]);

  const searchProduct = useCallback(
    (barcode: string): Product | undefined => {
      const normalizedBarcode = barcode.toUpperCase().trim();
      // Search by SKU first, then by barcodeDescriptor
      return products.find((p) => 
        p.sku.toUpperCase() === normalizedBarcode ||
        (p.barcodeDescriptor && p.barcodeDescriptor.toUpperCase() === normalizedBarcode)
      );
    },
    [products]
  );

  const handleBarcodeScan = (barcode: string) => {
    const product = searchProduct(barcode);

    if (!product) {
      toast({
        title: "Product not found",
        description: `No product found for barcode: ${barcode}`,
        variant: "destructive",
      });
      return;
    }

    // Ask for size if available
    if (product.sizes && product.sizes.length > 0) {
      const size = prompt(`Enter size for ${product.name}:\n${product.sizes.join(", ")}`);
      if (!size) return;
      setSelectedSizes({ ...selectedSizes, [product.id]: size });
    }

    // Ask for color if available
    if (product.colors && product.colors.length > 0) {
      const color = prompt(`Enter color for ${product.name}:\n${product.colors.join(", ")}`);
      if (color) {
        setSelectedColors({ ...selectedColors, [product.id]: color });
      }
    }

    addToCart(product);
  };

  const addToCart = (product: Product) => {
    const itemId = generateUUID();
    const size = selectedSizes[product.id];
    const color = selectedColors[product.id];

    const newItem: CartItem = {
      id: itemId,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      size,
      color,
      quantity: 1,
      unitPrice: product.retailPrice,
    };

    setCartItems([...cartItems, newItem]);
    toast({
      title: "Added to cart",
      description: `${product.name} ${size ? `(${size})` : ""} ${color ? `(${color})` : ""}`,
    });

    // Clear selections
    delete selectedSizes[product.id];
    delete selectedColors[product.id];
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  // Calculate totals
  const discount = resellerData?.reseller?.discountPercentage || 0;
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
    0
  );
  const discountAmount = subtotal * (discount / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = subtotalAfterDiscount * 0.2; // 20% UK VAT
  const total = subtotalAfterDiscount + tax;

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        items: cartItems,
        subtotal,
        discount: discountAmount,
        tax,
        total,
        paymentMethod,
        customerEmail: customerEmail || undefined,
        terminalId,
        terminalName: `Terminal ${terminalId.slice(0, 8)}`,
      };

      if (!isOnline) {
        // Queue for sync
        offlineStorage.queueOrderForSync(orderData);
        return { orderNumber: `OFFLINE-${Date.now()}`, ...orderData };
      }

      const response = await apiRequest("POST", "/api/epos/checkout", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setCompletedOrder(data);
      setCartItems([]);
      setCustomerEmail("");

      if (!isOnline) {
        toast({
          title: "Order Queued",
          description: "Your order will be synced when back online",
        });
      } else {
        toast({
          title: "Order Complete!",
          description: `Order #${data.orderNumber}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncQueuedOrders = async () => {
    const queue = offlineStorage.getSyncQueue();
    if (queue.length === 0) return;

    try {
      for (const order of queue) {
        await apiRequest("POST", "/api/epos/checkout", order);
      }
      offlineStorage.clearSyncQueue();
      toast({
        title: "Sync Complete",
        description: `${queue.length} orders synced`,
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Will retry when connection is stable",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    await checkoutMutation.mutateAsync();
    setIsProcessing(false);
  };

  const handleLogout = () => {
    // For guests, just go to home
    // For resellers, they'll need to login again
    navigate("/");
  };

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Order Complete</h1>
          <p className="text-xl mb-6">Order #{completedOrder.orderNumber}</p>

          <div className="bg-muted p-6 rounded-lg mb-6 text-left">
            <p className="font-medium mb-2">Order Summary:</p>
            <p>Items: {cartItems.length}</p>
            <p>Subtotal: {formatCurrency(completedOrder.subtotal)}</p>
            <p>Total: {formatCurrency(completedOrder.total)}</p>
          </div>

          <ReceiptPrinter
            ref={receiptPrinterRef}
            data={{
              orderNumber: completedOrder.orderNumber,
              terminalId,
              timestamp: new Date().toLocaleString(),
              items: cartItems.map((item) => ({
                name: item.name,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: (parseFloat(item.unitPrice) * item.quantity).toString(),
              })),
              subtotal: completedOrder.subtotal,
              discount: completedOrder.discount,
              tax: completedOrder.tax,
              total: completedOrder.total,
              paymentMethod,
              customerEmail,
              terminalName: `Terminal ${terminalId.slice(0, 8)}`,
            }}
            onPrintComplete={() => {
              setCompletedOrder(null);
              setPrintTriggered(false);
            }}
          />

          <Button
            onClick={() => setCompletedOrder(null)}
            className="min-h-11 w-full mt-6"
            data-testid="button-new-transaction"
          >
            New Transaction
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">
                <Zap className="inline h-6 w-6 mr-2" />
                EPOS Terminal
              </h1>
              <p className="text-sm text-muted-foreground">
                Terminal {terminalId.slice(0, 8)} •{" "}
                {resellerData?.reseller?.businessName || "In-Store Checkout"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isOnline ? (
                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-2 rounded-md">
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded-md">
                  <WifiOff className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}

              <Button
                onClick={() => setShowCustomerDisplay(!showCustomerDisplay)}
                variant="outline"
                size="icon"
                className="min-h-11"
                data-testid="button-toggle-customer-display"
              >
                {showCustomerDisplay ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="min-h-11"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scanner & Product Search */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-2 min-h-12">
              <TabsTrigger value="scanner" className="min-h-11">
                Barcode Scanner
              </TabsTrigger>
              <TabsTrigger value="search" className="min-h-11">
                Search Products
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="mt-6">
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onError={(error) =>
                  toast({
                    title: "Scanner error",
                    description: error,
                    variant: "destructive",
                  })
                }
              />
            </TabsContent>

            <TabsContent value="search" className="mt-6 space-y-4">
              {productsLoading ? (
                <Card className="p-6 text-center">Loading products...</Card>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="p-4 cursor-pointer hover-elevate transition-all"
                      onClick={() => addToCart(product)}
                      data-testid={`product-card-${product.id}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-bold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            {formatCurrency(parseFloat(product.retailPrice))}
                          </p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="min-h-10"
                          data-testid={`button-add-${product.id}`}
                        >
                          Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Cart & Checkout */}
        <div className="space-y-6">
          <CartDisplay
            items={cartItems}
            subtotal={subtotal}
            discount={discountAmount}
            tax={tax}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            isProcessing={isProcessing}
          />

          {/* Payment Section */}
          <Card className="p-6 bg-card border border-border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as "cash" | "card" | "net_terms")
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  data-testid="select-payment-method"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="net_terms">Net Terms</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Customer Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  data-testid="input-customer-email"
                />
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full min-h-12 text-lg font-bold"
                data-testid="button-complete-checkout"
              >
                {isProcessing ? "Processing..." : `Checkout ${formatCurrency(total)}`}
              </Button>

              {!isOnline && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-md flex gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Offline mode: Order will be queued and synced when online
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Customer Display */}
      {showCustomerDisplay && (
        <div className="fixed inset-0 z-50 bg-black">
          <CustomerDisplay
            items={cartItems}
            subtotal={subtotal}
            discount={discountAmount}
            tax={tax}
            total={total}
            message={
              cartItems.length === 0
                ? "Ready to Checkout"
                : `Total: ${formatCurrency(total)}`
            }
            isProcessing={isProcessing}
          />
        </div>
      )}
    </div>
  );
}
