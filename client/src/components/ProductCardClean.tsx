import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import SizeColorDialog from '@/components/SizeColorDialog';
import { VirtualTryOnViewer } from '@/components/virtual-tryon/VirtualTryOnViewer';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { convertToDirectUrl, FALLBACK_IMAGE as FALLBACK } from '@/lib/imageUtils';

const GUEST_MEASUREMENTS_KEY = 'guest_measurements';

interface ProductCardCleanProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  category?: string;
  sizes?: string[];
  colors?: string[];
  onAddToCart?: (id: string, size: string, color: string) => void;
  onToggleWishlist?: (id: string) => void;
  isWishlisted?: boolean;
}

// Thumbnail width for product cards (optimized for grid display)
const THUMBNAIL_WIDTH = 400;

export default function ProductCardClean({
  id,
  name,
  price,
  originalPrice,
  image,
  hoverImage,
  category,
  sizes,
  colors,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false
}: ProductCardCleanProps) {
  // Calculate discount percentage
  const discount = originalPrice && price && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;
  const [isHovered, setIsHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
  const [guestMeasurements, setGuestMeasurements] = useState<any>(null);
  const [imageError, setImageError] = useState(false);
  const [hoverImageError, setHoverImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toast } = useToast();

  // Check if user is authenticated
  const { data: authData } = useQuery<{ user: any }>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  const isAuthenticated = !!authData?.user;

  // Fetch user measurements for virtual try-on (only if authenticated)
  const { data: apiMeasurements } = useQuery<{
    heightCm?: number;
    chestCm?: number;
    waistCm?: number;
    hipsCm?: number;
    shoulderWidthCm?: number;
    inseamCm?: number;
    preferredSize?: string;
  }>({
    queryKey: ['/api/user-measurements'],
    enabled: showVirtualTryOn && isAuthenticated, // Only fetch when try-on is opened AND user is authenticated
  });

  // Load guest measurements from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem(GUEST_MEASUREMENTS_KEY);
      if (stored) {
        try {
          setGuestMeasurements(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse guest measurements', e);
        }
      }
    }
  }, [isAuthenticated]);

  // Use either API measurements (if authenticated) or guest measurements
  const userMeasurements = isAuthenticated ? apiMeasurements : guestMeasurements;

  // Track product view for CRM and recommendations
  useEffect(() => {
    const trackView = async () => {
      try {
        await apiRequest("POST", "/api/track-view", {
          productId: id,
          category: category || 'Uncategorized',
          source: 'shop'
        });
      } catch (error) {
        // Silently fail - tracking shouldn't break the UI
        console.debug("Product view tracking failed:", error);
      }
    };

    trackView();
  }, [id, category]);

  const [, navigate] = useLocation();

  const handleAddToCart = () => {
    if ((sizes && sizes.length > 0) || (colors && colors.length > 0)) {
      setDialogOpen(true);
    } else {
      // If no sizes/colors, add with defaults
      onAddToCart?.(id, 'One Size', 'Default');
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart.`,
        action: (
          <ToastAction altText="View Cart" onClick={() => navigate('/cart')} data-testid="button-view-cart-toast">
            View Cart
          </ToastAction>
        ),
      });
    }
  };

  const handleConfirmSelection = (size: string, color: string) => {
    console.log('ProductCardClean: handleConfirmSelection called', { id, size, color, hasOnAddToCart: !!onAddToCart });
    if (onAddToCart) {
      onAddToCart(id, size, color);
      toast({
        title: "Added to cart",
        description: `${name} (${size}, ${color}) has been added to your cart.`,
        action: (
          <ToastAction altText="View Cart" onClick={() => navigate('/cart')} data-testid="button-view-cart-toast">
            View Cart
          </ToastAction>
        ),
      });
    } else {
      console.error('ProductCardClean: onAddToCart is undefined');
    }
  };

  return (
    <>
      <div
        className="group relative bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`card-product-clean-${id}`}
      >
        <Link href={`/product/${id}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-gray-100 mb-3 cursor-pointer">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                </div>
              </div>
            )}
            <img
              src={imageError ? FALLBACK : convertToDirectUrl(image, THUMBNAIL_WIDTH)}
              alt={name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                !imageLoaded ? 'opacity-0' : ''
              } ${isHovered && hoverImage && !hoverImageError ? 'opacity-0' : 'opacity-100'}`}
            />
            {hoverImage && !hoverImageError && (
              <img
                src={convertToDirectUrl(hoverImage, THUMBNAIL_WIDTH)}
                alt={`${name} alternate view`}
                loading="lazy"
                decoding="async"
                onError={() => setHoverImageError(true)}
                className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-100'
                }`}
              />
            )}
            {/* Discount badge on image */}
            {discount > 0 && (
              <span className="absolute top-2 left-2 text-[10px] sm:text-xs font-bold text-white bg-red-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" data-testid={`badge-discount-${id}`}>
                {discount}% OFF
              </span>
            )}
          </div>
        </Link>

        <div className="flex-1 flex flex-col space-y-2">
          <Link href={`/product/${id}`} className="flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-black cursor-pointer hover:text-gray-700 line-clamp-2 leading-tight" data-testid={`text-product-name-clean-${id}`}>
              {name}
            </h3>
          </Link>
          
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-sm sm:text-base font-bold text-black" data-testid={`text-product-price-clean-${id}`}>
              £{price ? Number(price).toFixed(2) : '0.00'}
            </p>
            {discount > 0 && originalPrice && (
              <span className="text-xs text-gray-500 line-through" data-testid={`text-original-price-${id}`}>
                £{Number(originalPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Buttons - Always in a row */}
          <div className="flex gap-1.5 mt-auto">
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              size="sm"
              className="flex-1 bg-black text-white border-black hover:bg-gray-800 text-xs sm:text-sm h-8 sm:h-9 px-2"
              data-testid={`button-add-to-cart-clean-${id}`}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
              <span className="truncate">Add</span>
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                setShowVirtualTryOn(true);
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 bg-primary/10 border-primary/30 hover:bg-primary/20"
              data-testid={`button-virtual-tryon-clean-${id}`}
              title="Virtual Try-On"
            >
              <User className="h-3.5 w-3.5 text-primary" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onToggleWishlist?.(id);
              }}
              className={`h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 ${isWishlisted ? 'bg-red-50 border-red-300' : ''}`}
              data-testid={`button-wishlist-clean-${id}`}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-current text-red-500' : 'text-gray-700'}`} />
            </Button>
          </div>
        </div>
      </div>

      <SizeColorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productName={name}
        sizes={sizes}
        colors={colors}
        onConfirm={handleConfirmSelection}
      />

      {showVirtualTryOn && (
        <VirtualTryOnViewer
          open={showVirtualTryOn}
          onClose={() => setShowVirtualTryOn(false)}
          product={{
            id,
            name,
            category: category || 'Apparel',
            imageUrl: convertToDirectUrl(image),
            colors,
            sizes,
          }}
          userMeasurements={userMeasurements}
          onSaveMeasurements={async (measurements) => {
            if (isAuthenticated) {
              // Authenticated users: save to API
              try {
                await apiRequest('POST', '/api/user-measurements', measurements);
                toast({
                  title: "Measurements Saved",
                  description: "Your measurements have been saved to your account.",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to save measurements. Please try again.",
                  variant: "destructive",
                });
              }
            } else {
              // Guest users: save to localStorage
              try {
                localStorage.setItem(GUEST_MEASUREMENTS_KEY, JSON.stringify(measurements));
                setGuestMeasurements(measurements);
                toast({
                  title: "Measurements Saved",
                  description: "Your measurements have been saved locally. Log in to save them permanently.",
                });
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to save measurements locally.",
                  variant: "destructive",
                });
              }
            }
          }}
        />
      )}
    </>
  );
}
