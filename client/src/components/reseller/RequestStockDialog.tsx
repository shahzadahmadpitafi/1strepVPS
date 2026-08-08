import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { sortSizes } from "@/lib/utils";
import { Search, Plus, Minus, Trash2, ShoppingCart, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  wholesalePrice: string;
  sku: string;
  sizes: string[];
  colors: string[];
  imageUrl?: string;
}

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface RequestStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: {
    id: string;
    businessName: string;
    tier: string;
    discountPercentage: number;
    creditLimit: number;
    currentCredit: number;
    allowedPaymentMethods?: string;
  };
}

export default function RequestStockDialog({ open, onOpenChange, reseller }: RequestStockDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  
  // Determine allowed payment methods and set default
  const allowedMethods = reseller.allowedPaymentMethods || "both";
  const canUseCredit = allowedMethods === "both" || allowedMethods === "credit";
  const canPayNow = allowedMethods === "both" || allowedMethods === "pay_now";
  
  // Set default payment method based on what's allowed
  const getDefaultPaymentMethod = (): "credit" | "pay_now" => {
    if (allowedMethods === "credit") return "credit";
    if (allowedMethods === "pay_now") return "pay_now";
    return "credit"; // Default to credit for "both"
  };
  
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pay_now">(getDefaultPaymentMethod());
  const { toast } = useToast();

  // Fetch all products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: open,
  });

  const placedOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/reseller/orders', orderData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log('Order response received:', data);
      console.log('Payment method:', data.paymentMethod);
      console.log('Checkout URL:', data.checkoutUrl);
      
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/b2b-orders'] });
      
      // If payment method is pay_now and we have a checkout URL, redirect to Stripe
      if (data.paymentMethod === "pay_now" && data.checkoutUrl) {
        console.log('Redirecting to Stripe checkout:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        console.log('Not redirecting - showing success message instead');
        // For credit orders, show success message and close dialog
        toast({
          title: "Order placed successfully!",
          description: data.paymentMethod === "credit" 
            ? `£${data.creditUsed} credit used. Remaining: £${data.creditRemaining}`
            : "Your stock request has been submitted for processing.",
        });
        setCart([]);
        setSelectedProduct(null);
        onOpenChange(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate prices with tier discount
  const calculatePrice = (wholesalePrice: string) => {
    const price = parseFloat(wholesalePrice);
    return price * (1 - reseller.discountPercentage / 100);
  };

  // Add to cart
  const addToCart = () => {
    if (!selectedProduct || !selectedSize || !selectedColor || quantity < 1) {
      toast({
        title: "Invalid selection",
        description: "Please select a product, size, color, and quantity.",
        variant: "destructive",
      });
      return;
    }

    const unitPrice = calculatePrice(selectedProduct.wholesalePrice);
    const totalPrice = unitPrice * quantity;

    const cartItem: CartItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      size: selectedSize,
      color: selectedColor,
      quantity,
      unitPrice,
      totalPrice,
    };

    setCart([...cart, cartItem]);
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
    
    toast({
      title: "Added to cart",
      description: `${quantity}x ${selectedProduct.name} added to your order.`,
    });
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Update quantity in cart
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].totalPrice = updatedCart[index].unitPrice * newQuantity;
    setCart(updatedCart);
  };

  // Calculate order totals (prices already include tier discount)
  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const creditAvailable = reseller.creditLimit - reseller.currentCredit;
  const creditAfterOrder = reseller.currentCredit + total;

  // Place order
  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add products to your cart before placing an order.",
        variant: "destructive",
      });
      return;
    }

    // Only check credit if using credit payment method
    if (paymentMethod === "credit" && total > creditAvailable) {
      toast({
        title: "Insufficient credit",
        description: `You need £${total.toFixed(2)} but only have £${creditAvailable.toFixed(2)} available credit.`,
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      items: cart.map(item => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      })),
      shippingAddress: "Will be updated by admin", // This should come from reseller profile
      notes: `Stock request for ${reseller.businessName}`,
      paymentMethod: paymentMethod, // Include payment method
      totalAmount: total.toFixed(2), // Include total for payment processing
    };

    placedOrderMutation.mutate(orderData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-request-stock">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request Stock</DialogTitle>
          <DialogDescription>
            Browse products and add them to your order. Your tier discount ({reseller.discountPercentage}%) is automatically applied.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Product Selection */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-products"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {productsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id ? 'border-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedSize(product.sizes[0] || "");
                        setSelectedColor(product.colors[0] || "");
                      }}
                      data-testid={`card-product-${product.id}`}
                    >
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground line-through">
                              £{parseFloat(product.wholesalePrice).toFixed(2)}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              £{calculatePrice(product.wholesalePrice).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {reseller.discountPercentage}% discount applied
                            </p>
                          </div>
                          {selectedProduct?.id === product.id && (
                            <Badge variant="default">Selected</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Product details and add to cart */}
            {selectedProduct && (
              <Card className="mt-4 p-4">
                <h3 className="font-semibold mb-3">Add to Order</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm font-medium">Size</label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      data-testid="select-size"
                    >
                      {sortSizes(selectedProduct.sizes).map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Colour</label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      data-testid="select-color"
                    >
                      {selectedProduct.colors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      data-testid="input-quantity"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addToCart} className="w-full" data-testid="button-add-to-cart">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Cart and Order Summary */}
          <div className="flex flex-col overflow-hidden border-l pl-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Cart ({cart.length})
              </h3>
            </div>

            <ScrollArea className="flex-1 mb-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.size} • {item.color}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFromCart(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              data-testid={`button-decrease-${index}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              data-testid={`button-increase-${index}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-semibold">
                            £{item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Order Summary */}
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Your tier discount ({reseller.discountPercentage}%) is already applied to all prices</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Order Total:</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                {canUseCredit && canPayNow ? (
                  // Show both options if allowed
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === "credit" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setPaymentMethod("credit")}
                      data-testid="button-payment-credit"
                    >
                      Use Credit
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "pay_now" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setPaymentMethod("pay_now")}
                      data-testid="button-payment-now"
                    >
                      Pay Now
                    </Button>
                  </div>
                ) : canUseCredit ? (
                  // Only credit is allowed
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">Credit payment is your only available option.</p>
                  </div>
                ) : canPayNow ? (
                  // Only pay now is allowed
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">Upfront payment is your only available option.</p>
                  </div>
                ) : null}
              </div>

              {/* Credit Information - Only show if using credit */}
              {paymentMethod === "credit" && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Available:</span>
                    <span className={creditAvailable >= total ? "text-green-600" : "text-red-600"}>
                      £{creditAvailable.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After Order:</span>
                    <span>£{Math.max(0, creditAvailable - total).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Pay Now Information */}
              {paymentMethod === "pay_now" && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    You'll be redirected to secure payment after placing your order.
                  </p>
                </div>
              )}

              <Button
                onClick={handlePlaceOrder}
                className="w-full"
                disabled={cart.length === 0 || placedOrderMutation.isPending || (paymentMethod === "credit" && total > creditAvailable)}
                data-testid="button-place-order"
              >
                {placedOrderMutation.isPending ? "Placing Order..." : paymentMethod === "pay_now" ? "Continue to Payment" : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
