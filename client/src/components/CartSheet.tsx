import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, X, Trash2, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLocation, Link } from "wouter";
import { staggerContainer, listItemAnimation } from "@/lib/animations";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { convertToDirectUrl } from "@/lib/imageUtils";

interface CartSheetProps {
  children?: React.ReactNode;
}

export default function CartSheet({ children }: CartSheetProps) {
  const [open, setOpen] = useState(false);
  const { cartItems, updateQuantity, removeItem, clearCart, totalItems, subtotal, shipping, total, freeShippingEnabled, freeShippingThreshold, addToCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch products for recommendations
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: open && cartItems.length > 0,
  });

  // Get recommended products (not already in cart, with valid price)
  const cartProductIds = new Set(cartItems.map(item => item.productId));
  const recommendedProducts = allProducts
    .filter(p => 
      p.availabilityStatus === 'available' && 
      p.imageUrl &&
      !isNaN(parseFloat(p.retailPrice)) &&
      parseFloat(p.retailPrice) > 0 &&
      !cartProductIds.has(p.id)
    )
    .slice(0, 4);

  const handleQuickAdd = async (product: Product) => {
    try {
      const defaultSize = product.sizes?.[0] || 'One Size';
      const defaultColor = product.colors?.[0] || 'Default';
      await addToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.retailPrice) || 0,
        size: defaultSize,
        color: defaultColor,
        image: product.imageUrl || '',
        category: product.category,
      });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            data-testid="button-cart-trigger"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                data-testid="badge-cart-count"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl font-semibold" data-testid="cart-title">
            Shopping Cart 
            {totalItems > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 px-8 py-16">
            <div className="relative mb-8">
              {/* Gradient orbs in background */}
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Cart icon with gradient background */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent rounded-2xl blur-xl" />
                <div className="relative bg-card border-2 rounded-2xl p-8 shadow-2xl">
                  <ShoppingCart className="h-16 w-16 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="text-center space-y-3 mb-8">
              <h3 className="text-2xl font-bold" data-testid="empty-cart-message">
                Your cart is empty
              </h3>
              <p className="text-muted-foreground max-w-[280px] leading-relaxed">
                Discover premium fitness apparel designed for peak performance and style
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <Button 
                size="lg"
                onClick={() => handleNavigate('/shop-clean')} 
                data-testid="button-continue-shopping"
                className="w-full font-semibold"
              >
                Explore Products
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => handleNavigate('/shop-clean')} 
                className="w-full"
                data-testid="button-view-collections"
              >
                View Collections
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-[320px] text-center">
              {freeShippingEnabled && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-primary">Free Shipping</div>
                  <div className="text-xs text-muted-foreground">Orders over £{freeShippingThreshold.toFixed(2)}</div>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-primary">Premium Quality</div>
                <div className="text-xs text-muted-foreground">Built to perform</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items - Clean compact design */}
            <div className="flex-1 overflow-y-auto py-3 -mx-2 px-2">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item, index) => (
                  <motion.div 
                    key={`${item.id}-${item.size}-${item.color}`} 
                    className="group flex gap-3 py-3 border-b last:border-b-0" 
                    data-testid={`cart-item-${item.id}`}
                    custom={index}
                    variants={listItemAnimation}
                    initial="initial"
                    animate="animate"
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    layout
                  >
                    {/* Product Image */}
                    <Link href={`/product/${item.productId || item.id}`} onClick={() => setOpen(false)}>
                      <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted border">
                        <img 
                          src={convertToDirectUrl(item.image)} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          data-testid={`cart-item-image-${item.id}`}
                        />
                      </div>
                    </Link>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2" data-testid={`cart-item-name-${item.id}`}>
                            {item.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mr-1 -mt-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-medium">
                            {item.size}
                          </span>
                          <span className="text-xs text-muted-foreground" data-testid={`cart-item-details-${item.id}`}>
                            {item.color}
                          </span>
                        </div>
                      </div>
                      
                      {/* Quantity & Price Row */}
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border rounded-full bg-muted/30">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm font-semibold min-w-[28px] text-center" data-testid={`quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-sm" data-testid={`cart-item-total-${item.id}`}>
                            £{(Number(item.price) * item.quantity).toFixed(2)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-[10px] text-muted-foreground">
                              £{Number(item.price).toFixed(2)} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* You Might Also Like - Product Recommendations (inside scroll area) */}
              {recommendedProducts.length > 0 && (
                <div className="border-t mt-4 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">You Might Also Like</h3>
                    <Link href="/shop-clean" onClick={() => setOpen(false)}>
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                        View All <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {recommendedProducts.map((product) => (
                      <div 
                        key={product.id} 
                        className="flex-shrink-0 w-24 group"
                        data-testid={`recommended-product-${product.id}`}
                      >
                        <Link href={`/product/${product.id}`} onClick={() => setOpen(false)}>
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-1.5 border">
                            <img 
                              src={convertToDirectUrl(product.imageUrl || '')} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>
                        <p className="text-xs font-medium line-clamp-1 mb-0.5">{product.name}</p>
                        <span className="text-xs font-bold text-primary">£{product.retailPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Summary - Compact clean design */}
            <div className="border-t bg-muted/30 -mx-6 px-6 pt-4 pb-5">
              {/* Free shipping progress */}
              {freeShippingEnabled && subtotal < freeShippingThreshold && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg" data-testid="free-shipping-message">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">Free shipping on orders over £{freeShippingThreshold.toFixed(0)}</span>
                    <span className="text-xs font-bold text-primary">{Math.round((subtotal / freeShippingThreshold) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Add £{(freeShippingThreshold - subtotal).toFixed(2)} more for free shipping
                  </p>
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground" data-testid="subtotal-label">Subtotal</span>
                  <span className="font-medium" data-testid="subtotal-amount">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground" data-testid="shipping-label">Shipping</span>
                  <span className="font-medium" data-testid="shipping-amount">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      `£${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold" data-testid="total-label">Total</span>
                  <span className="text-xl font-bold" data-testid="total-amount">£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full font-semibold h-11" 
                  onClick={() => handleNavigate('/checkout')}
                  data-testid="button-checkout"
                >
                  Checkout · £{total.toFixed(2)}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10"
                    onClick={() => handleNavigate('/cart')}
                    data-testid="button-view-cart"
                  >
                    View Full Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleClearCart}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                    data-testid="button-clear-cart"
                    title="Clear cart"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  <span>Free Returns</span>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}