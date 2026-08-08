import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/contexts/WishlistContext";
import { useQuery } from "@tanstack/react-query";
import { X, ShoppingCart, Heart, ArrowLeft, ChevronLeft, Sparkles, Trash2, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  retailPrice: string;
  imageUrl: string | null;
  category: string;
}

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useSEO({
    title: 'My Wishlist - Saved Items',
    description: 'View and manage your saved items. Add your favourite products to cart or continue browsing our premium fitness apparel collection.',
    url: 'https://1strep.com/wishlist',
  });

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
      title: "All items added to cart",
      description: `${wishlistProducts.length} items have been added to your cart`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Show Header only on desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      <main className="px-4 py-4 pb-24 md:container md:mx-auto md:py-8 md:pb-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Mobile Header - Gradient style */}
          <div className="md:hidden mb-6">
            <div className="bg-gradient-to-r from-pink-500/10 via-primary/10 to-purple-500/10 rounded-2xl p-4 border">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => setLocation('/')}
                  className="h-9 w-9 rounded-full bg-background/80"
                  data-testid="button-close-wishlist-mobile"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                    <h1 className="text-lg font-bold">My Wishlist</h1>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {wishlist.size} {wishlist.size === 1 ? 'item' : 'items'} saved
                  </p>
                </div>
                {wishlistProducts.length > 0 && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => clearWishlist()}
                    className="h-8 text-muted-foreground hover:text-destructive"
                    data-testid="button-clear-mobile"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Header - Enhanced */}
          <div className="hidden md:block mb-8">
            <div className="bg-gradient-to-r from-pink-500/10 via-primary/10 to-purple-500/10 rounded-2xl p-6 border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setLocation('/shop-clean')}
                    className="rounded-full bg-background/80"
                    data-testid="button-back-to-shop"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
                      <h1 className="text-2xl md:text-3xl font-bold" data-testid="wishlist-page-title">
                        My Wishlist
                      </h1>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {wishlist.size} {wishlist.size === 1 ? 'item' : 'items'} saved for later
                    </p>
                  </div>
                </div>
                {wishlistProducts.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => clearWishlist()}
                      className="bg-background/80"
                      data-testid="button-clear-wishlist"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleAddAllToCart}
                      data-testid="button-add-all-to-cart"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add All to Cart
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {wishlistProducts.length === 0 ? (
            <motion.div 
              className="text-center py-16 md:py-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-xl" />
                <div className="relative w-full h-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full flex items-center justify-center border">
                  <Heart className="w-10 h-10 text-pink-500/50" />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2" data-testid="empty-wishlist-title">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto px-4">
                Save your favourite items here by tapping the heart icon on any product you love.
              </p>
              <Button 
                size="lg"
                onClick={() => setLocation('/shop-clean')}
                data-testid="button-start-shopping"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Explore Products
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Mobile: List layout - Enhanced */}
              <div className="md:hidden">
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {wishlistProducts.map((product, index) => (
                      <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex gap-3 bg-card rounded-xl p-3 border shadow-sm"
                        data-testid={`wishlist-item-mobile-${product.id}`}
                      >
                        <Link href={`/product/${product.id}`} className="shrink-0">
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={product.imageUrl || ""}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              data-testid={`img-wishlist-mobile-${product.id}`}
                            />
                            <div className="absolute top-1.5 left-1.5">
                              <Heart className="h-4 w-4 text-pink-500 fill-pink-500 drop-shadow-md" />
                            </div>
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <Link href={`/product/${product.id}`}>
                              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                            </Link>
                            <p className="font-bold text-lg text-primary">
                              £{parseFloat(product.retailPrice).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="flex-1 h-9"
                              onClick={() => handleAddToCart(product)}
                              data-testid={`button-add-cart-mobile-${product.id}`}
                            >
                              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                              Add to Cart
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                              onClick={() => removeFromWishlist(product.id)}
                              data-testid={`button-remove-mobile-${product.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
                
                {/* Mobile Add All Button */}
                <div className="sticky bottom-20 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
                  <Button 
                    className="w-full h-12 shadow-lg"
                    onClick={handleAddAllToCart}
                    data-testid="button-add-all-mobile"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add All {wishlistProducts.length} Items to Cart
                  </Button>
                </div>
              </div>

              {/* Desktop: Grid layout - Enhanced */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence mode="popLayout">
                  {wishlistProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="overflow-hidden group hover:shadow-lg transition-shadow duration-300"
                        data-testid={`wishlist-item-${product.id}`}
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <Link href={`/product/${product.id}`}>
                            <img
                              src={product.imageUrl || ""}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              data-testid={`img-wishlist-product-${product.id}`}
                            />
                          </Link>
                          <div className="absolute top-3 left-3">
                            <div className="p-1.5 bg-white/90 dark:bg-black/80 rounded-full shadow-md">
                              <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 right-3 h-8 w-8 bg-white/90 dark:bg-black/80 backdrop-blur-sm hover:bg-destructive hover:text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFromWishlist(product.id)}
                            data-testid={`button-remove-wishlist-${product.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              className="w-full"
                              size="sm"
                              onClick={() => handleAddToCart(product)}
                              data-testid={`button-add-to-cart-${product.id}`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <Link href={`/product/${product.id}`}>
                            <h3 
                              className="font-semibold text-sm line-clamp-2 hover:text-primary cursor-pointer mb-2 min-h-[2.5rem]"
                              data-testid={`text-wishlist-product-name-${product.id}`}
                            >
                              {product.name}
                            </h3>
                          </Link>
                          <p 
                            className="text-lg font-bold text-primary"
                            data-testid={`text-wishlist-product-price-${product.id}`}
                          >
                            £{parseFloat(product.retailPrice).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
