import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { useQuery } from "@tanstack/react-query";
import { X, ShoppingCart, Heart, ShoppingBag, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  retailPrice: string;
  imageUrl: string | null;
  category: string;
}

interface WishlistSheetProps {
  children: React.ReactNode;
}

export default function WishlistSheet({ children }: WishlistSheetProps) {
  const [open, setOpen] = useState(false);
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const wishlistProducts = allProducts.filter((product) =>
    wishlist.has(product.id)
  );

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.retailPrice),
      size: "M",
      color: "Black",
      image: product.imageUrl || "",
      category: product.category,
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const handleAddAllToCart = () => {
    wishlistProducts.forEach((product) => {
      addToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.retailPrice),
        size: "M",
        color: "Black",
        image: product.imageUrl || "",
        category: product.category,
      });
    });
    toast({
      title: "All items added",
      description: `${wishlistProducts.length} items have been added to your cart`,
    });
  };

  const handleLinkClick = () => {
    setOpen(false);
  };

  const totalValue = wishlistProducts.reduce(
    (sum, p) => sum + parseFloat(p.retailPrice),
    0
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500/10 via-primary/5 to-purple-500/10 p-5 border-b">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2" data-testid="text-wishlist-title">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
              My Wishlist
              {wishlist.size > 0 && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  ({wishlist.size})
                </span>
              )}
            </SheetTitle>
            {wishlistProducts.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Total value: <span className="font-semibold text-foreground">£{totalValue.toFixed(2)}</span>
              </p>
            )}
          </SheetHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {wishlistProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-xl" />
                <div className="relative w-full h-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full flex items-center justify-center border">
                  <Heart className="w-8 h-8 text-pink-500/50" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground mb-6" data-testid="text-wishlist-empty">
                Save items you love by tapping the heart icon
              </p>
              <Link href="/shop-clean" onClick={handleLinkClick}>
                <Button data-testid="button-shop-wishlist">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Explore Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {wishlistProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex gap-3 p-3 bg-card border rounded-xl hover:shadow-sm transition-shadow"
                    data-testid={`wishlist-item-${product.id}`}
                  >
                    <Link href={`/product/${product.id}`} className="flex-shrink-0" onClick={handleLinkClick}>
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={product.imageUrl || ""}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          data-testid={`img-wishlist-product-${product.id}`}
                        />
                        <div className="absolute top-1 left-1">
                          <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500 drop-shadow" />
                        </div>
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link href={`/product/${product.id}`} onClick={handleLinkClick}>
                          <h3
                            className="font-semibold text-sm line-clamp-2 hover:text-primary cursor-pointer transition-colors"
                            data-testid={`text-wishlist-product-name-${product.id}`}
                          >
                            {product.name}
                          </h3>
                        </Link>
                        <p
                          className="font-bold text-primary mt-0.5"
                          data-testid={`text-wishlist-product-price-${product.id}`}
                        >
                          £{parseFloat(product.retailPrice).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => handleAddToCart(product)}
                          data-testid={`button-add-to-cart-wishlist-${product.id}`}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                          onClick={() => removeFromWishlist(product.id)}
                          data-testid={`button-remove-wishlist-${product.id}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        {wishlistProducts.length > 0 && (
          <div className="border-t bg-muted/30 p-4 space-y-3">
            <Button 
              className="w-full h-11"
              onClick={handleAddAllToCart}
              data-testid="button-add-all-wishlist"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add All to Cart · £{totalValue.toFixed(2)}
            </Button>
            <div className="flex gap-2">
              <Link href="/wishlist" onClick={handleLinkClick} className="flex-1">
                <Button variant="outline" className="w-full h-10" data-testid="button-view-wishlist">
                  View Full Wishlist
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                onClick={() => clearWishlist()}
                data-testid="button-clear-wishlist"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
