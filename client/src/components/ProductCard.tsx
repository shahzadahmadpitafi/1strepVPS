import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Scan } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { fadeIn, applyReducedMotion } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import ProductBadges from "@/components/ProductBadges";
import SizeColorDialog from "@/components/SizeColorDialog";
import SizeFitModal from "@/components/SizeFitModal";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  colors?: string[];
  sizes?: string[];
}

export default function ProductCard({ 
  id, 
  name, 
  price = 0, 
  originalPrice, 
  image, 
  category, 
  isNew = false,
  colors = [],
  sizes = []
}: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sizeFitModalOpen, setSizeFitModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  
  const safePrice = price || 0;
  const discount = originalPrice && safePrice ? Math.round(((originalPrice - safePrice) / originalPrice) * 100) : 0;
  const isWishlisted = isInWishlist(id);

  // Apply reduced motion to animations
  const cardVariants = applyReducedMotion(fadeIn, prefersReducedMotion);

  // Default sizes if none provided
  const availableSizes = sizes.length > 0 ? sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const defaultColor = colors.length > 0 ? colors[0] : 'Default';

  // Track product view when component mounts
  useEffect(() => {
    const trackView = async () => {
      try {
        await apiRequest("POST", "/api/track-view", {
          productId: id,
          category,
          source: "category"
        });
      } catch (error) {
        console.debug("View tracking failed:", error);
      }
    };

    trackView();
  }, [id, category]);

  const handleQuickAdd = () => {
    setDialogOpen(true);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    // Add to cart immediately
    addToCart({
      id,
      name,
      price,
      size,
      color: defaultColor,
      image,
      category
    });
    toast({
      title: "Added to cart",
      description: `${name} (${size}) has been added to your cart.`,
    });
    // Reset after a moment
    setTimeout(() => setSelectedSize(null), 1000);
  };

  const handleConfirmSelection = (size: string, color: string) => {
    addToCart({
      id,
      name,
      price,
      size,
      color,
      image,
      category
    });
    toast({
      title: "Added to cart",
      description: `${name} (${size}, ${color}) has been added to your cart.`,
    });
  };

  const handleWishlistToggle = () => {
    toggleWishlist(id);
  };

  return (
    <>
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
      variants={cardVariants}
    >
      <div 
        className="group relative overflow-visible rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover-elevate flex flex-col" 
        data-testid={`product-card-${id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image - Clickable to navigate to product details */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
          {/* Clickable image link */}
          <Link href={`/product/${id}`} className="block h-full w-full cursor-pointer">
            <motion.img 
              src={image} 
              alt={name}
              className="w-full h-full object-contain"
              data-testid={`product-image-${id}`}
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            />
          </Link>
        
          {/* Product Badges */}
          <ProductBadges
            isNew={isNew}
            onSale={discount > 0}
            discount={discount}
          />

          {/* Wishlist Button - positioned absolutely, outside Link */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 md:top-3 right-2 md:right-3 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white min-h-11 min-w-11 z-20"
            onClick={(e) => {
              e.stopPropagation();
              handleWishlistToggle();
            }}
            data-testid={`button-wishlist-${id}`}
          >
            <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
          </Button>

          {/* Desktop: Hover Overlay with Size Selection (Thrudark-style) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden md:flex absolute inset-0 bg-black/80 backdrop-blur-sm flex-col items-center justify-center p-4 z-10"
                data-testid={`hover-overlay-${id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <p className="text-white text-sm font-semibold tracking-wider uppercase mb-1">Quick Add</p>
                  <p className="text-white/70 text-xs">Select Size</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 max-w-xs">
                  {availableSizes.map((size) => (
                    <motion.button
                      key={size}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSizeSelect(size);
                      }}
                      className={`
                        px-4 py-2.5 rounded-md text-sm font-medium transition-all
                        ${selectedSize === size 
                          ? 'bg-white text-black' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/30'
                        }
                      `}
                      data-testid={`size-button-${size}-${id}`}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSizeFitModalOpen(true);
                    }}
                    className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                    data-testid={`button-try-on-${id}`}
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Try It On
                  </Button>
                  {colors.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd();
                      }}
                      className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                      data-testid={`button-more-options-${id}`}
                    >
                      More Options
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile: Quick Add & Try On Buttons (always visible) */}
          <div className="md:hidden absolute bottom-2 left-2 right-2 flex gap-2 z-20">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground min-h-11 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAdd();
              }}
              data-testid={`button-quick-add-${id}`}
            >
              Quick Add
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11 bg-white/90 backdrop-blur-sm hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                setSizeFitModalOpen(true);
              }}
              data-testid={`button-try-on-mobile-${id}`}
            >
              <Scan className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Product Info - Clickable to navigate to product details */}
        <Link href={`/product/${id}`} className="p-3 md:p-4 flex-1 flex flex-col cursor-pointer text-center" style={{ backgroundColor: '#ffffff' }}>
          <h3 
            className="font-semibold text-sm md:text-base mb-1 md:mb-2 line-clamp-2 hover:text-primary transition-colors" 
            data-testid={`product-name-${id}`}
            style={{ color: 'rgb(0, 0, 0)' }}
          >
            {name}
          </h3>
          
          <div className="flex items-baseline gap-2 mt-auto justify-center">
            <span 
              className="text-base md:text-lg font-bold" 
              data-testid={`product-price-${id}`}
              style={{ color: 'rgb(0, 0, 0)' }}
            >
              £{safePrice.toFixed(2)}
            </span>
            {discount > 0 && originalPrice && (
              <span 
                className="text-xs md:text-sm line-through" 
                data-testid={`product-original-price-${id}`}
                style={{ color: 'rgb(100, 100, 100)' }}
              >
                £{originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </Link>
      </div>
    </motion.div>

    {/* Size/Color Selection Dialog (for mobile or multiple colors) */}
    <SizeColorDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      productName={name}
      sizes={sizes}
      colors={colors}
      onConfirm={handleConfirmSelection}
    />

    {/* Size & Fit Modal */}
    <SizeFitModal
      open={sizeFitModalOpen}
      onOpenChange={setSizeFitModalOpen}
      productName={name}
      productImage={image}
      productId={id}
      category={category}
    />
    </>
  );
}
