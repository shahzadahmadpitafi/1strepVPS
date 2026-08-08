import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Minus, Plus, Trash2, Ruler, ArrowRight, ArrowLeft, ShoppingBag, Package, Truck, Info } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { sortSizes } from "@/lib/utils";
import { convertToDirectUrl } from "@/lib/imageUtils";

const sizeCharts = {
  tops: {
    title: "Tops (T-Shirts, Hoodies, Vests)",
    headers: ["Size", "UK", "Chest (cm)", "Waist (cm)"],
    rows: [
      ["XS", "6-8", "81-86", "66-71"],
      ["S", "8-10", "86-91", "71-76"],
      ["M", "10-12", "91-97", "76-81"],
      ["L", "12-14", "97-102", "81-86"],
      ["XL", "14-16", "102-109", "86-94"],
      ["XXL", "16-18", "109-117", "94-102"]
    ]
  },
  bottoms: {
    title: "Bottoms (Leggings, Shorts)",
    headers: ["Size", "UK", "Waist (cm)", "Hips (cm)"],
    rows: [
      ["XS", "6-8", "61-66", "86-91"],
      ["S", "8-10", "66-71", "91-97"],
      ["M", "10-12", "71-76", "97-102"],
      ["L", "12-14", "76-81", "102-107"],
      ["XL", "14-16", "81-89", "107-112"],
      ["XXL", "16-18", "89-97", "112-119"]
    ]
  }
};

export default function Cart() {
  const { cartItems, updateQuantity, removeItem, clearCart, subtotal, shipping, total, freeShippingEnabled, freeShippingThreshold, isLoading } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart for your privacy.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      });
    }
  };
  // Track editing state per item (keyed by item ID)
  const [editingItems, setEditingItems] = useState<Record<string, { size: string; color: string }>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  const startEditing = (itemId: string, currentSize: string, currentColor: string) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: { size: currentSize, color: currentColor }
    }));
  };
  
  const cancelEditing = (itemId: string) => {
    setEditingItems(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };
  
  const updateEditingSize = (itemId: string, size: string) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], size }
    }));
  };
  
  const updateEditingColor = (itemId: string, color: string) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], color }
    }));
  };

  // Fetch all products to get available sizes/colors
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['/api/products'],
  });

  const handleUpdateItem = async (itemId: string) => {
    const editState = editingItems[itemId];
    if (!editState) {
      cancelEditing(itemId);
      return;
    }

    const currentItem = cartItems.find(item => item.id === itemId);
    if (!currentItem) return;

    // Don't update if nothing changed
    if (editState.size === currentItem.size && editState.color === currentItem.color) {
      cancelEditing(itemId);
      return;
    }

    setIsUpdating(itemId);
    try {
      await apiRequest('PATCH', `/api/cart/items/${itemId}`, {
        size: editState.size,
        color: editState.color,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      toast({
        title: "Item updated",
        description: "Your cart has been updated successfully.",
      });
      
      cancelEditing(itemId);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update the item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const getProductDetails = (productId: string) => {
    return products.find((p: any) => p.id === productId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="empty-cart-title">Your Cart is Empty</h1>
            <p className="text-muted-foreground">
              Looks like you haven't added anything to your cart yet. Start shopping to find premium fitness apparel.
            </p>
            <Button 
              size="lg" 
              onClick={() => setLocation('/shop-clean')}
              data-testid="button-start-shopping"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation('/shop')}
                data-testid="button-back-to-shop"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold" data-testid="cart-page-title">Shopping Cart</h1>
                <p className="text-muted-foreground mt-1">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </div>
            
            {/* Size Guide Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-size-guide">
                  <Ruler className="w-4 h-4 mr-2" />
                  Size Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-b">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Ruler className="w-5 h-5 text-primary" />
                      </div>
                      Size Guide
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Find your perfect fit with our measurement guide</p>
                  </DialogHeader>
                </div>
                <div className="p-6 space-y-8">
                  {Object.entries(sizeCharts).map(([key, chart], chartIndex) => (
                    <div key={key} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-6 rounded-full ${chartIndex === 0 ? 'bg-primary' : 'bg-blue-500'}`} />
                        <h3 className="font-semibold text-lg">{chart.title}</h3>
                      </div>
                      <div className="overflow-x-auto rounded-xl border bg-card">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              {chart.headers.map((header, i) => (
                                <th key={i} className={`py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {chart.rows.map((row, i) => (
                              <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                                {row.map((cell, j) => (
                                  <td key={j} className={`py-3 px-4 ${j === 0 ? 'font-bold text-primary bg-primary/5' : 'text-foreground'}`}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-muted/30 rounded-xl p-4 border">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <Info className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Measuring Tips</p>
                        <p className="text-muted-foreground">For the best fit, measure yourself wearing light clothing. If you're between sizes, we recommend sizing up for a more relaxed fit.</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/size-guide">
                    <Button variant="outline" className="w-full h-11" data-testid="button-full-size-guide">
                      View Full Size Guide
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = getProductDetails(item.productId);
                // Use product sizes if available, else use default sizes. Always include current item's size
                const productSizes = product?.sizes?.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                const availableSizes = productSizes.includes(item.size) ? productSizes : [item.size, ...productSizes];
                // Use product colors if available. Always include current item's color
                const productColors = product?.colors || [];
                const availableColors = productColors.length > 0 
                  ? (productColors.includes(item.color) ? productColors : [item.color, ...productColors])
                  : [item.color];
                const editState = editingItems[item.id];
                const isEditing = !!editState;

                return (
                  <Card key={item.id} className="overflow-hidden" data-testid={`cart-item-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link href={`/product/${item.productId}`}>
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                            <img
                              src={convertToDirectUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link href={`/product/${item.productId}`}>
                                <h3 className="font-semibold text-base md:text-lg line-clamp-2 hover:text-primary transition-colors cursor-pointer" data-testid={`item-name-${item.id}`}>
                                  {item.name}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={() => removeItem(item.id)}
                              data-testid={`button-remove-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Size and Colour */}
                          {isEditing ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap gap-3">
                                <div className="w-32">
                                  <label className="text-xs text-muted-foreground block mb-1">Size</label>
                                  <Select 
                                    value={editState.size} 
                                    onValueChange={(value) => updateEditingSize(item.id, value)}
                                  >
                                    <SelectTrigger className="h-9" data-testid={`select-size-${item.id}`}>
                                      <SelectValue placeholder={item.size} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sortSizes(availableSizes).map((size: string) => (
                                        <SelectItem key={size} value={size}>{size}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-32">
                                  <label className="text-xs text-muted-foreground block mb-1">Colour</label>
                                  <Select 
                                    value={editState.color} 
                                    onValueChange={(value) => updateEditingColor(item.id, value)}
                                  >
                                    <SelectTrigger className="h-9" data-testid={`select-color-${item.id}`}>
                                      <SelectValue placeholder={item.color} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableColors.map((color: string) => (
                                        <SelectItem key={color} value={color}>{color}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleUpdateItem(item.id)}
                                  disabled={isUpdating === item.id}
                                  data-testid={`button-save-${item.id}`}
                                >
                                  {isUpdating === item.id ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => cancelEditing(item.id)}
                                  data-testid={`button-cancel-${item.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                Size: {item.size}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Colour: {item.color}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto p-0 text-primary hover:bg-transparent hover:underline"
                                onClick={() => startEditing(item.id, item.size, item.color)}
                                data-testid={`button-edit-${item.id}`}
                              >
                                Edit
                              </Button>
                            </div>
                          )}

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                data-testid={`button-decrease-${item.id}`}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                data-testid={`button-increase-${item.id}`}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-primary" data-testid={`price-${item.id}`}>
                                £{(parseFloat(String(item.price)) * item.quantity).toFixed(2)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  £{parseFloat(String(item.price)).toFixed(2)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Free Shipping Progress */}
                  {freeShippingEnabled && subtotal < freeShippingThreshold && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Free shipping progress</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add <span className="font-semibold text-foreground">£{(freeShippingThreshold - subtotal).toFixed(2)}</span> more for free shipping
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium" data-testid="summary-subtotal">£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      {shipping === 0 ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">FREE</Badge>
                      ) : (
                        <span className="font-medium" data-testid="summary-shipping">£{shipping.toFixed(2)}</span>
                      )}
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary" data-testid="summary-total">£{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setLocation('/checkout')}
                      data-testid="button-proceed-checkout"
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation('/shop-clean')}
                      data-testid="button-continue-shopping"
                    >
                      Continue Shopping
                    </Button>
                    
                    {/* Privacy protection: Clear cart for shared devices */}
                    <Button 
                      variant="ghost" 
                      className="w-full text-muted-foreground hover:text-destructive"
                      onClick={handleClearCart}
                      data-testid="button-clear-cart"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cart
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Using a shared device? Clear your cart to protect your privacy.
                    </p>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex justify-center gap-4 pt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span>Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>Easy Returns</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
