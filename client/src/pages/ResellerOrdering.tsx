import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Plus, 
  Minus,
  Package,
  CreditCard,
  Check
} from "lucide-react";

interface OrderItem {
  productId: string;
  productName: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  discountedPrice: number;
}

export default function ResellerOrdering() {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const { toast } = useToast();

  // Fetch reseller data
  const { data: dashboardData } = useQuery<any>({
    queryKey: ["/api/reseller/dashboard"],
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const reseller = dashboardData?.reseller || {};
  const discountPercentage = reseller.discountPercentage || 0;

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const totalAmount = cart.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0);
      
      // Validate credit limit before placing order
      if (totalAmount > reseller.creditAvailable) {
        throw new Error(`Insufficient credit. Available: £${reseller.creditAvailable?.toFixed(2) || '0.00'}`);
      }

      const orderItems = cart.map(item => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.discountedPrice
      }));

      return apiRequest("POST", "/api/reseller/orders", {
        items: orderItems,
        totalAmount,
        shippingAddress: reseller.businessAddress || "Default Address"
      });
    },
    onSuccess: () => {
      toast({ title: "Order placed successfully!" });
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/dashboard"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Order failed", 
        description: error.message || "Failed to place order",
        variant: "destructive" 
      });
    }
  });

  const addToCart = (product: any, size?: string, color?: string) => {
    const wholesalePrice = parseFloat(product.wholesalePrice);
    const discountedPrice = wholesalePrice * (1 - discountPercentage / 100);

    const existingItemIndex = cart.findIndex(
      item => item.productId === product.id && item.size === size && item.color === color
    );

    if (existingItemIndex > -1) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        size,
        color,
        quantity: 1,
        unitPrice: wholesalePrice,
        discountedPrice
      }]);
    }

    toast({ title: `Added ${product.name} to cart` });
  };

  const updateQuantity = (index: number, change: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + change);
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
    toast({ title: "Item removed from cart" });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Order Products</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {discountPercentage}% Tier Discount
              </Badge>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">{cartItems} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Catalogue */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Product Catalogue</h2>
            
            {productsLoading ? (
              <Card className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-muted-foreground">Loading products...</p>
              </Card>
            ) : products.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Products Available</h3>
                <p className="text-muted-foreground">Check back later for new products</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product: any) => {
                  const wholesalePrice = parseFloat(product.wholesalePrice);
                  const discountedPrice = wholesalePrice * (1 - discountPercentage / 100);
                  
                  return (
                    <Card key={product.id} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Wholesale:</span>
                            <span className="font-medium line-through">£{wholesalePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Your Price:</span>
                            <span className="font-bold text-primary text-lg">£{discountedPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        {product.sizes && product.sizes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Sizes:</p>
                            <div className="flex flex-wrap gap-2">
                              {product.sizes.map((size: string) => (
                                <Button
                                  key={size}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addToCart(product, size, product.colors?.[0])}
                                  data-testid={`button-add-size-${size}`}
                                >
                                  {size}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {!product.sizes || product.sizes.length === 0 && (
                          <Button
                            className="w-full"
                            onClick={() => addToCart(product)}
                            data-testid={`button-add-${product.id}`}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Order Cart</h2>
                  <ShoppingCart className="h-5 w-5" />
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            {(item.size || item.color) && (
                              <p className="text-xs text-muted-foreground">
                                {item.size} {item.color && `• ${item.color}`}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-primary">£{item.discountedPrice.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(index, -1)}
                              data-testid={`button-decrease-${index}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(index, 1)}
                              data-testid={`button-increase-${index}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">£{cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Discount Applied:</span>
                        <span className="font-semibold text-green-600">{discountPercentage}%</span>
                      </div>
                      <div className="flex items-center justify-between text-lg">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-primary">£{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {reseller.creditAvailable < cartTotal && (
                      <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Insufficient credit. Available: £{reseller.creditAvailable?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => placeOrderMutation.mutate()}
                      disabled={placeOrderMutation.isPending || reseller.creditAvailable < cartTotal}
                      data-testid="button-place-order"
                    >
                      {placeOrderMutation.isPending ? (
                        <>
                          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
