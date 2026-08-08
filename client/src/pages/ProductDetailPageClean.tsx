import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import HeaderClean from '@/components/HeaderClean';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Heart, ShoppingCart, Check, ZoomIn, X, ChevronLeft, ChevronRight, Clock, AlertCircle, Bell } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import ProductReviews from '@/components/ProductReviews';
import { useSEO } from '@/hooks/useSEO';
import { sortSizes } from '@/lib/utils';
import { convertToDirectUrl } from '@/lib/imageUtils';

type Product = {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  retailPrice: string;
  salePrice?: string;
  imageUrl: string;
  hoverImageUrl?: string;
  videoUrl?: string;
  sizes?: string[];
  colors?: string[];
  features?: string[];
  materials?: string;
  careInstructions?: string;
  modelInfo?: string;
  colorImages?: Record<string, string>;
  colorHoverImages?: Record<string, string>;
  colorAdditionalImages?: Record<string, string[]>;
  additionalImages?: string[];
};

type ProductVariant = {
  id: string;
  productId: string;
  size: string;
  color: string;
  retailPrice?: string;
  salePrice?: string;
  wholesalePrice?: string;
  wholesaleSalePrice?: string;
  isActive: boolean;
  status?: 'available' | 'coming_soon' | 'out_of_stock' | 'pre_order';
  expectedDate?: string;
};

export default function ProductDetailPageClean() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { addToCart, items: cartItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const cartItemCount = (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);
  const { toast } = useToast();
  
  // Extract storefront context from URL params (for commission tracking)
  const urlParams = new URLSearchParams(window.location.search);
  const storefrontId = urlParams.get('storefront');
  const storefrontSlug = urlParams.get('storefrontSlug');
  const resellerId = urlParams.get('resellerId');
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isMobileSizeSheetOpen, setIsMobileSizeSheetOpen] = useState(false);
  
  // Modern hover lens zoom state
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 });
  const [showLens, setShowLens] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);
  
  // Full-screen viewer state
  const [viewerZoomed, setViewerZoomed] = useState(false);
  const [viewerPosition, setViewerPosition] = useState({ x: 50, y: 50 });
  
  // Handle hover lens movement on main image
  const handleMainImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };
  
  // Handle click in full-screen viewer - click to zoom, move to pan
  const handleViewerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewerZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setViewerPosition({ x, y });
  };
  
  // Zoom level state
  const [zoomLevel, setZoomLevel] = useState<1 | 2.5 | 4>(1);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingClickPosition = useRef<{ x: number; y: number } | null>(null);
  
  const handleViewerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Store position for delayed single-click
    pendingClickPosition.current = { x, y };
    setViewerPosition({ x, y });
    
    // If there's already a pending click, this is a double-click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      
      // Double-click: toggle between current and 4x (or back to 1x)
      if (zoomLevel === 4) {
        setZoomLevel(1);
        setViewerZoomed(false);
      } else {
        setZoomLevel(4);
        setViewerZoomed(true);
      }
    } else {
      // Delay single-click to detect potential double-click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        // Single click: toggle between 1x and 2.5x
        if (zoomLevel === 1) {
          setZoomLevel(2.5);
          setViewerZoomed(true);
        } else {
          setZoomLevel(1);
          setViewerZoomed(false);
        }
      }, 200);
    }
  };
  
  // Reset viewer state when closing
  useEffect(() => {
    if (!isZoomOpen) {
      setViewerZoomed(false);
      setViewerPosition({ x: 50, y: 50 });
      setZoomLevel(1);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    }
  }, [isZoomOpen]);
  
  // Navigate between images in viewer
  const goToPrevImage = () => {
    setActiveImageIndex(prev => prev > 0 ? prev - 1 : filteredGalleryImages.length - 1);
    setViewerZoomed(false);
  };
  
  const goToNextImage = () => {
    setActiveImageIndex(prev => prev < filteredGalleryImages.length - 1 ? prev + 1 : 0);
    setViewerZoomed(false);
  };

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });
  
  // Dynamic SEO for product pages
  useSEO({
    title: product ? `${product.name} - ${product.category}` : 'Loading Product',
    description: product?.description || 'Premium fitness apparel from 1stRep',
    image: product?.imageUrl,
    url: product ? `https://1strep.com/product/${product.id}` : undefined,
    type: 'product',
    productData: product ? {
      name: product.name,
      price: product.retailPrice.replace('£', ''),
      currency: 'GBP',
      availability: 'available',
      image: product.imageUrl,
      description: product.description,
      sku: product.id,
      brand: '1stRep',
    } : undefined,
  });
  
  // Fetch product variants to determine available size-color combinations
  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: [`/api/products/${id}/variants`],
    enabled: !!id,
  });
  
  const { data: authData } = useQuery<{ id: string; email: string; role: string } | null>({
    queryKey: ['/api/auth/me'],
  });
  
  // Stock alert subscriptions for back-in-stock notifications
  const { data: stockAlerts = [] } = useQuery<{ id: string; productId: string; variantId?: string }[]>({
    queryKey: ['/api/stock-alerts'],
    enabled: !!authData?.id,
  });
  
  // Subscribe to stock alert mutation
  const subscribeToStockAlert = useMutation({
    mutationFn: async (data: { productId: string; variantId?: string }) => {
      return apiRequest('/api/stock-alerts/subscribe', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stock-alerts'] });
      toast({
        title: "Notification Set",
        description: "We'll email you when this item is back in stock.",
      });
    },
    onError: () => {
      toast({
        title: "Already Subscribed",
        description: "You're already signed up for this notification.",
        variant: "destructive",
      });
    },
  });
  
  // Fetch similar products from same category
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Filter similar products client-side (same category)
  const similarProducts = useMemo(() => {
    if (!product?.category || allProducts.length === 0) return [];
    return allProducts
      .filter(p => p.category === product.category && p.id !== id)
      .slice(0, 4);
  }, [allProducts, product?.category, id]);
  
  // Get other products from different categories
  const otherProducts = useMemo(() => {
    if (!product?.category || allProducts.length === 0) return [];
    return allProducts
      .filter(p => p.category !== product.category && p.id !== id)
      .slice(0, 8);
  }, [allProducts, product?.category, id]);
  
  // Build gallery images array for use throughout the component
  const galleryImages = useMemo(() => {
    if (!product) return [];
    
    const images: { url: string; label: string; color?: string }[] = [];
    const addedUrls = new Map<string, number>(); // Track URL to index for updating
    
    // Helper to add image without duplicates, but update color if URL exists
    const addImage = (url: string, label: string, color?: string) => {
      if (!url) return;
      
      const existingIndex = addedUrls.get(url);
      if (existingIndex !== undefined) {
        // URL already exists - if new one has color info, update it
        if (color && !images[existingIndex].color) {
          images[existingIndex].color = color;
          images[existingIndex].label = label;
        }
      } else {
        addedUrls.set(url, images.length);
        images.push({ url, label, color });
      }
    };
    
    // Add main image
    if (product.imageUrl) {
      addImage(product.imageUrl, 'Main');
    }
    
    // Add hover image if different from main
    if (product.hoverImageUrl) {
      addImage(product.hoverImageUrl, 'Alternate');
    }
    
    // Add color-specific images FIRST (so they get priority with color property)
    if (product.colorImages) {
      Object.entries(product.colorImages).forEach(([color, url]) => {
        addImage(url, color, color);
      });
    }
    
    // Add color-specific hover images
    if (product.colorHoverImages) {
      Object.entries(product.colorHoverImages).forEach(([color, url]) => {
        addImage(url, `${color} Alt`, color);
      });
    }
    
    // Add color-specific additional gallery images
    if (product.colorAdditionalImages) {
      Object.entries(product.colorAdditionalImages).forEach(([color, urls]) => {
        if (Array.isArray(urls)) {
          urls.forEach((url, index) => {
            addImage(url, `${color} ${index + 1}`, color);
          });
        }
      });
    }
    
    // Add additional product images (from product_images table) - after color images
    if (product.additionalImages) {
      product.additionalImages.forEach((url, index) => {
        addImage(url, `Gallery ${index + 1}`);
      });
    }
    
    return images;
  }, [product]);

  // Filter gallery images based on selected color
  const filteredGalleryImages = useMemo(() => {
    if (!selectedColor || galleryImages.length === 0) {
      // No color selected - show all images
      return galleryImages;
    }
    
    const normalizedSelected = selectedColor.toLowerCase().trim();
    
    // Get images that match the selected color
    const colorImages = galleryImages.filter(img => 
      img.color && img.color.toLowerCase().trim() === normalizedSelected
    );
    
    // If we have color-specific images, return only those
    if (colorImages.length > 0) {
      return colorImages;
    }
    
    // Fallback: if no color-specific images, show all
    return galleryImages;
  }, [selectedColor, galleryImages]);

  // Reset active image index when filtered gallery changes
  useEffect(() => {
    if (activeImageIndex >= filteredGalleryImages.length) {
      setActiveImageIndex(0);
    }
  }, [filteredGalleryImages.length, activeImageIndex]);

  // When color changes, reset to first image of that color
  useEffect(() => {
    if (selectedColor) {
      // Reset to first image when color changes (filtered gallery will have color-specific images)
      setActiveImageIndex(0);
    }
  }, [selectedColor]);
  
  // Compute available sizes for the selected color
  const availableSizesForColor = useMemo(() => {
    if (!selectedColor || !variants || variants.length === 0) {
      // If no variants or no color selected, show all product sizes
      return product?.sizes || [];
    }
    
    // Filter variants for the selected color that are active (case-insensitive)
    const normalizedSelected = selectedColor.toLowerCase().trim();
    const activeVariantsForColor = variants.filter(
      v => v.color && v.color.toLowerCase().trim() === normalizedSelected && v.isActive !== false
    );
    
    if (activeVariantsForColor.length === 0) {
      // No variants defined for this color, show all sizes
      return product?.sizes || [];
    }
    
    // Return the sizes available for this color
    return activeVariantsForColor.map(v => v.size);
  }, [selectedColor, variants, product?.sizes]);
  
  // When color changes, reset size if current size is not available for that color
  useEffect(() => {
    if (selectedSize && availableSizesForColor.length > 0) {
      if (!availableSizesForColor.includes(selectedSize)) {
        setSelectedSize('');
      }
    }
  }, [selectedColor, availableSizesForColor, selectedSize]);

  // Helper to get variant status for a specific size/color combination
  const getVariantStatus = (size: string, color: string): ProductVariant['status'] | undefined => {
    if (!variants || variants.length === 0) return 'available';
    
    const normalizedColor = color.toLowerCase().trim();
    const normalizedSize = size.toLowerCase().trim();
    
    const variant = variants.find(
      v => v.size.toLowerCase().trim() === normalizedSize && 
           v.color.toLowerCase().trim() === normalizedColor
    );
    
    // If variant exists and has 0 stock, treat as out_of_stock regardless of status field
    if (variant && variant.stockQuantity !== undefined && variant.stockQuantity <= 0) {
      return 'out_of_stock';
    }
    
    return variant?.status || 'available';
  };

  // Get expected date for a variant
  const getVariantExpectedDate = (size: string, color: string): string | undefined => {
    if (!variants || variants.length === 0) return undefined;
    
    const normalizedColor = color.toLowerCase().trim();
    const normalizedSize = size.toLowerCase().trim();
    
    const variant = variants.find(
      v => v.size.toLowerCase().trim() === normalizedSize && 
           v.color.toLowerCase().trim() === normalizedColor
    );
    
    return variant?.expectedDate;
  };

  // Get status for current selection
  const currentVariantStatus = useMemo(() => {
    if (!selectedSize || !selectedColor) return 'available';
    return getVariantStatus(selectedSize, selectedColor);
  }, [selectedSize, selectedColor, variants]);

  // Get current variant based on selection
  const currentVariant = useMemo(() => {
    if (!selectedSize || !selectedColor || !variants || variants.length === 0) return null;
    
    const normalizedColor = selectedColor.toLowerCase().trim();
    const normalizedSize = selectedSize.toLowerCase().trim();
    
    return variants.find(
      v => v.size.toLowerCase().trim() === normalizedSize && 
           v.color.toLowerCase().trim() === normalizedColor
    ) || null;
  }, [selectedSize, selectedColor, variants]);

  // Calculate effective prices based on selected variant (for retail customers)
  const effectivePrices = useMemo(() => {
    if (!product) return { retailPrice: 0, salePrice: null, isOnSale: false, discountPercent: 0 };
    
    // Priority: variant price → product price
    const retailPrice = currentVariant?.retailPrice 
      ? parseFloat(currentVariant.retailPrice)
      : parseFloat(product.retailPrice);
    
    // Sale price priority: variant salePrice → product salePrice → null
    const salePrice = currentVariant?.salePrice 
      ? parseFloat(currentVariant.salePrice)
      : product.salePrice 
        ? parseFloat(product.salePrice)
        : null;
    
    const isOnSale = salePrice !== null && salePrice > 0 && salePrice < retailPrice;
    const discountPercent = isOnSale && retailPrice > 0 
      ? Math.round(((retailPrice - salePrice!) / retailPrice) * 100)
      : 0;
    
    return { retailPrice, salePrice, isOnSale, discountPercent };
  }, [product, currentVariant]);

  const handleAddToCart = () => {
    if (product) {
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        toast({
          title: "Please select a size",
          variant: "destructive",
        });
        return;
      }
      
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast({
          title: "Please select a colour",
          variant: "destructive",
        });
        return;
      }

      const colorImage = selectedColor && product.colorImages?.[selectedColor]
        ? product.colorImages[selectedColor]
        : product.imageUrl;
        
      addToCart({
        id: product.id,
        name: product.name,
        price: effectivePrices.isOnSale ? effectivePrices.salePrice! : effectivePrices.retailPrice,
        size: selectedSize || 'One Size',
        color: selectedColor || 'Default',
        image: convertToDirectUrl(colorImage),
        category: product.category,
        // Pass storefront context for commission tracking
        storefrontSlug: storefrontSlug || undefined,
        resellerId: resellerId || undefined,
      });

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
        action: (
          <ToastAction altText="View Cart" onClick={() => setLocation('/cart')} data-testid="toast-action-view-cart">
            View Cart
          </ToastAction>
        ),
      });
      
      // Close mobile sheet if open
      setIsMobileSizeSheetOpen(false);
    }
  };
  
  // Handle mobile Add to Cart - opens sheet if size/color selection needed
  const handleMobileAddToCart = () => {
    if (product) {
      const needsSize = product.sizes && product.sizes.length > 0 && !selectedSize;
      const needsColor = product.colors && product.colors.length > 0 && !selectedColor;
      
      if (needsSize || needsColor) {
        setIsMobileSizeSheetOpen(true);
      } else {
        handleAddToCart();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <HeaderClean />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-800 rounded-md"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-800 rounded w-3/4"></div>
                <div className="h-6 bg-gray-800 rounded w-1/4"></div>
                <div className="h-24 bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black">
        <HeaderClean />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Product not found</h1>
          <Button onClick={() => setLocation('/shop-clean')}>
            Return to Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <HeaderClean />
      
      {/* Modern Full-Screen Image Viewer */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-[9999] bg-black" data-testid="zoom-viewer">
          {/* Close button - Large and visible */}
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 z-[100] p-4 bg-white text-black rounded-full hover:bg-gray-200 transition-all shadow-2xl border-2 border-gray-300"
            data-testid="button-close-zoom"
          >
            <X className="w-8 h-8" strokeWidth={2.5} />
          </button>
          
          {/* Image counter */}
          {filteredGalleryImages.length > 1 && (
            <div className="absolute top-4 left-4 z-50 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
              <span className="text-white text-sm font-medium">
                {activeImageIndex + 1} / {filteredGalleryImages.length}
              </span>
            </div>
          )}
          
          {/* Navigation arrows */}
          {filteredGalleryImages.length > 1 && (
            <>
              <button
                onClick={goToPrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
                data-testid="button-prev-image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
                data-testid="button-next-image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          {/* Zoom hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full transition-opacity duration-300"
            style={{ opacity: viewerZoomed ? 0 : 1 }}
          >
            <span className="text-white/80 text-sm">Click to zoom • Double-click for max zoom</span>
          </div>
          
          {/* Main image area - click to zoom, move to pan when zoomed */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden relative"
            onClick={handleViewerClick}
            onMouseMove={handleViewerMouseMove}
            style={{ cursor: viewerZoomed ? 'zoom-out' : 'zoom-in' }}
          >
            <img
              src={convertToDirectUrl(filteredGalleryImages[activeImageIndex]?.url || product.imageUrl)}
              alt={`${product.name} - Full View`}
              className="select-none transition-transform duration-200 ease-out"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                transformOrigin: `${viewerPosition.x}% ${viewerPosition.y}%`,
                transform: `scale(${zoomLevel})`,
              }}
              draggable={false}
              data-testid="img-zoomed"
            />
          </div>
          
          {/* Thumbnail strip at bottom - Larger thumbnails */}
          {filteredGalleryImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-3 bg-black/70 backdrop-blur-sm rounded-lg max-w-[90vw] overflow-x-auto">
              {filteredGalleryImages.map((image, index) => (
                <button
                  key={`viewer-thumb-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(index);
                    setViewerZoomed(false);
                  }}
                  className={`flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 rounded-md overflow-hidden border-2 transition-all ${
                    activeImageIndex === index 
                      ? 'border-white ring-2 ring-white' 
                      : 'border-gray-600 opacity-70 hover:opacity-100 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={convertToDirectUrl(image.url)}
                    alt={image.label}
                    className="w-full h-full object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-400 hover:text-white mb-4 md:mb-6 py-2"
          data-testid="button-back"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-6 items-start">
          {/* Left Column - Media */}
          <div className="space-y-3">
            {/* Main Image Display */}
            {product.videoUrl ? (
              <div className="aspect-[4/5] max-h-[45vh] lg:max-h-[55vh] rounded-md overflow-hidden bg-gray-900">
                <video
                  controls
                  className="w-full h-full object-contain"
                  data-testid="video-product-demo"
                >
                  <source src={product.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <>
                {/* Mobile: Swipeable Image Carousel */}
                <div 
                  className="md:hidden overflow-x-auto snap-x snap-mandatory rounded-md"
                  style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex">
                    {filteredGalleryImages.map((image, index) => (
                      <div 
                        key={`mobile-main-${index}`}
                        className="flex-shrink-0 w-full aspect-[4/5] max-h-[45vh] snap-center bg-gray-900"
                      >
                        <img
                          src={convertToDirectUrl(image.url)}
                          alt={`${product.name} - ${image.label || `View ${index + 1}`}`}
                          className="w-full h-full object-contain"
                          data-testid={`img-product-mobile-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desktop: Two Images Side by Side */}
                <div className="hidden md:grid grid-cols-2 gap-2">
                  {/* Main Image */}
                  <div 
                    ref={mainImageRef}
                    className="aspect-[3/4] rounded-md overflow-hidden bg-gray-900 relative cursor-zoom-in"
                    onClick={() => setIsZoomOpen(true)}
                    onMouseEnter={() => setShowLens(true)}
                    onMouseLeave={() => setShowLens(false)}
                    onMouseMove={handleMainImageMouseMove}
                  >
                    <img
                      src={convertToDirectUrl(filteredGalleryImages[activeImageIndex]?.url || product.imageUrl)}
                      alt={`${product.name} - ${filteredGalleryImages[activeImageIndex]?.label || 'Product'}`}
                      className="w-full h-full object-cover object-top transition-all duration-300"
                      data-testid="img-product-main"
                    />
                    
                    {/* Hover lens indicator */}
                    {showLens && (
                      <div 
                        className="absolute w-24 h-24 border-2 border-white/50 rounded-lg pointer-events-none transition-opacity duration-150 bg-white/10 backdrop-blur-[1px]"
                        style={{
                          left: `calc(${lensPosition.x}% - 48px)`,
                          top: `calc(${lensPosition.y}% - 48px)`,
                        }}
                      />
                    )}
                    
                    {/* Zoom icon overlay */}
                    <div className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white/80 pointer-events-none">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                  
                  {/* Second Image (Hover/Zoom Preview or Next Gallery Image) */}
                  <div 
                    className="aspect-[3/4] rounded-md overflow-hidden bg-gray-900 relative"
                  >
                    {showLens ? (
                      /* Magnified preview when hovering over main image */
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${convertToDirectUrl(filteredGalleryImages[activeImageIndex]?.url || product.imageUrl)})`,
                          backgroundSize: '300%',
                          backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
                        }}
                      />
                    ) : (
                      /* Show second gallery image when not hovering */
                      <img
                        src={convertToDirectUrl(filteredGalleryImages[1]?.url || product.hoverImageUrl || filteredGalleryImages[0]?.url || product.imageUrl)}
                        alt={`${product.name} - ${filteredGalleryImages[1]?.label || 'Alternate View'}`}
                        className="w-full h-full object-cover object-top cursor-pointer"
                        onClick={() => {
                          if (filteredGalleryImages.length > 1) {
                            setActiveImageIndex(1);
                          }
                          setIsZoomOpen(true);
                        }}
                        data-testid="img-product-secondary"
                      />
                    )}
                    {showLens && (
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                          Click main image for full view
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Mobile: Image indicator dots (shows current position in swipeable carousel) */}
            {filteredGalleryImages.length > 1 && (
              <div className="flex md:hidden justify-center gap-1.5 py-2">
                {filteredGalleryImages.map((_, index) => (
                  <div
                    key={`mobile-dot-${index}`}
                    className="w-2 h-2 rounded-full bg-gray-600"
                    data-testid={`indicator-dot-${index}`}
                  />
                ))}
              </div>
            )}
            
            {/* Desktop: Thumbnail Gallery */}
            {filteredGalleryImages.length > 1 && (
              <div className="hidden md:flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                {filteredGalleryImages.map((image, index) => (
                  <button
                    key={`${image.label}-${index}`}
                    onClick={() => setActiveImageIndex(index)}
                    className={`flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded overflow-hidden border-2 transition-all ${
                      activeImageIndex === index 
                        ? 'border-primary ring-1 ring-primary ring-offset-1 ring-offset-black' 
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={convertToDirectUrl(image.url)}
                      alt={`${product.name} - ${image.label}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Mobile: Product Info Section (Name, Price, Colors, Sizes) */}
            <div className="lg:hidden space-y-4 mt-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1" data-testid="text-product-name-mobile">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-2xl font-semibold text-primary" data-testid="text-product-price-mobile">
                    £{effectivePrices.isOnSale ? effectivePrices.salePrice!.toFixed(2) : effectivePrices.retailPrice.toFixed(2)}
                  </p>
                  {effectivePrices.isOnSale && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        £{effectivePrices.retailPrice.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-white bg-red-500 px-2 py-1 rounded">
                        {effectivePrices.discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Colour Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Colour {selectedColor && <span className="text-primary ml-1">• {selectedColor}</span>}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {product.colors.map((color) => (
                      <button
                        key={`mobile-color-${color}`}
                        onClick={() => setSelectedColor(color)}
                        className={`min-w-[48px] px-4 py-3 text-sm font-medium border rounded-lg transition-all active:scale-95 ${
                          selectedColor === color
                            ? 'bg-white text-black border-white shadow-lg'
                            : 'bg-gray-900 text-white border-gray-600 hover:border-white hover:bg-gray-800'
                        }`}
                        data-testid={`button-mobile-color-inline-${color}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Size {selectedColor && variants.length > 0 && (
                      <span className="text-gray-400 font-normal">
                        (Available for {selectedColor})
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {sortSizes(product.sizes).map((size) => {
                      const isAvailable = availableSizesForColor.includes(size);
                      const variantStatus = selectedColor ? getVariantStatus(size, selectedColor) : 'available';
                      const isComingSoon = variantStatus === 'coming_soon';
                      const isPreOrder = variantStatus === 'pre_order';
                      const isOutOfStock = variantStatus === 'out_of_stock';
                      
                      return (
                        <div key={`mobile-size-${size}`} className="relative">
                          <button
                            onClick={() => isAvailable && !isOutOfStock && setSelectedSize(size)}
                            disabled={!isAvailable || isOutOfStock}
                            className={`min-w-[48px] px-4 py-3 text-sm font-medium border rounded-lg transition-all active:scale-95 ${
                              selectedSize === size
                                ? isComingSoon
                                  ? 'bg-amber-500 text-black border-amber-500 shadow-lg'
                                  : isPreOrder
                                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                                    : 'bg-white text-black border-white shadow-lg'
                                : isOutOfStock || !isAvailable
                                  ? 'bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed line-through'
                                  : isComingSoon
                                    ? 'bg-amber-900/30 text-amber-400 border-amber-600 hover:border-amber-400 hover:bg-amber-900/50'
                                    : isPreOrder
                                      ? 'bg-blue-900/30 text-blue-400 border-blue-600 hover:border-blue-400 hover:bg-blue-900/50'
                                      : 'bg-gray-900 text-white border-gray-600 hover:border-white hover:bg-gray-800'
                            }`}
                            data-testid={`button-mobile-size-inline-${size}`}
                          >
                            {size}
                          </button>
                          {isComingSoon && isAvailable && (
                            <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              SOON
                            </span>
                          )}
                          {isPreOrder && isAvailable && (
                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              PRE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile Add to Cart Button - inline after sizes */}
              <div className="flex gap-2 mt-4">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || currentVariantStatus === 'out_of_stock'}
                  className="flex-1 bg-white text-black hover:bg-gray-200 py-6"
                  data-testid="button-add-to-cart-mobile-inline"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Basket
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => product && toggleWishlist(product.id)}
                  className="px-4 py-6 border-gray-600"
                  data-testid="button-wishlist-mobile-inline"
                >
                  <Heart className={`h-5 w-5 ${product && isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </Button>
              </div>

              {/* Mobile: Model Info */}
              {product.modelInfo && (
                <div className="bg-gray-900 border border-gray-700 rounded-md p-3">
                  <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Model Info
                  </h3>
                  <p className="text-gray-400 text-xs" data-testid="text-model-info-mobile">
                    {product.modelInfo}
                  </p>
                </div>
              )}

              {/* Mobile: Description */}
              {product.description && (
                <div>
                  <p className="text-gray-400 text-sm leading-relaxed" data-testid="text-product-description-mobile">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Mobile: Detailed Description */}
              {product.detailedDescription && (
                <div
                  className="prose prose-sm max-w-none text-gray-400 prose-headings:text-white prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-invert"
                  data-testid="text-detailed-description-mobile"
                  dangerouslySetInnerHTML={{ __html: product.detailedDescription }}
                />
              )}

              {/* Mobile: Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-white mb-2">Features</h3>
                  <ul className="space-y-1.5">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-400 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mobile: Materials */}
              {product.materials && (
                <div>
                  <h3 className="text-base font-semibold text-white mb-2">Materials</h3>
                  <p className="text-gray-400 text-sm" data-testid="text-materials-mobile">{product.materials}</p>
                </div>
              )}

              {/* Mobile: Care Instructions */}
              {product.careInstructions && (
                <div>
                  <h3 className="text-base font-semibold text-white mb-2">Care Instructions</h3>
                  <p className="text-gray-400 text-sm" data-testid="text-care-instructions-mobile">{product.careInstructions}</p>
                </div>
              )}
            </div>

            
            {/* Show static image below video if both exist */}
            {product.videoUrl && product.imageUrl && (
              <div className="aspect-square rounded-md overflow-hidden bg-gray-900">
                <img
                  src={convertToDirectUrl(filteredGalleryImages[activeImageIndex]?.url || product.imageUrl)}
                  alt={`${product.name}`}
                  className="w-full h-full object-cover object-top transition-all duration-300"
                  data-testid="img-product-secondary"
                />
              </div>
            )}
          </div>

          {/* Right Column - Product Info (Desktop/Tablet only - mobile has its own section in left column) */}
          <div className="hidden lg:block space-y-3 md:space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1" data-testid="text-product-name">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xl sm:text-2xl font-semibold text-primary" data-testid="text-product-price">
                  £{effectivePrices.isOnSale ? effectivePrices.salePrice!.toFixed(2) : effectivePrices.retailPrice.toFixed(2)}
                </p>
                {effectivePrices.isOnSale && (
                  <>
                    <span className="text-base sm:text-lg text-gray-500 line-through" data-testid="text-original-price">
                      £{effectivePrices.retailPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded" data-testid="badge-discount">
                      {effectivePrices.discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Size {selectedColor && variants.length > 0 && (
                    <span className="text-gray-400 font-normal">
                      (Available for {selectedColor})
                    </span>
                  )}
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {sortSizes(product.sizes).map((size) => {
                    const isAvailable = availableSizesForColor.includes(size);
                    const variantStatus = selectedColor ? getVariantStatus(size, selectedColor) : 'available';
                    const isComingSoon = variantStatus === 'coming_soon';
                    const isPreOrder = variantStatus === 'pre_order';
                    const isOutOfStock = variantStatus === 'out_of_stock';
                    
                    return (
                      <div key={size} className="relative">
                        <button
                          onClick={() => isAvailable && !isOutOfStock && setSelectedSize(size)}
                          disabled={!isAvailable || isOutOfStock}
                          className={`min-w-[40px] px-3 py-2 text-sm font-medium border rounded-md transition-all active:scale-95 ${
                            selectedSize === size
                              ? isComingSoon
                                ? 'bg-amber-500 text-black border-amber-500 shadow-lg'
                                : isPreOrder
                                  ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                                  : 'bg-white text-black border-white shadow-lg'
                              : isOutOfStock || !isAvailable
                                ? 'bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed line-through'
                                : isComingSoon
                                  ? 'bg-amber-900/30 text-amber-400 border-amber-600 hover:border-amber-400 hover:bg-amber-900/50'
                                  : isPreOrder
                                    ? 'bg-blue-900/30 text-blue-400 border-blue-600 hover:border-blue-400 hover:bg-blue-900/50'
                                    : 'bg-gray-900 text-white border-gray-600 hover:border-white hover:bg-gray-800'
                          }`}
                          data-testid={`button-size-${size}`}
                        >
                          {size}
                        </button>
                        {isComingSoon && isAvailable && (
                          <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            SOON
                          </span>
                        )}
                        {isPreOrder && isAvailable && (
                          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            PRE
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedColor && variants.length > 0 && availableSizesForColor.length === 0 && (
                  <p className="text-sm text-red-400 mt-2">
                    No sizes available for {selectedColor}
                  </p>
                )}
                {/* Show status message for selected variant */}
                {selectedSize && selectedColor && currentVariantStatus === 'coming_soon' && (
                  <div className="mt-4 flex items-start gap-3 text-amber-300 bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-600/40 rounded-xl px-4 py-3">
                    <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-200">Coming Soon</p>
                      <p className="text-sm text-amber-400/80">
                        This size and colour combination will be available shortly. Sign up for notifications to be the first to know.
                      </p>
                    </div>
                  </div>
                )}
                {selectedSize && selectedColor && currentVariantStatus === 'pre_order' && (
                  <div className="mt-4 flex items-start gap-3 text-blue-300 bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-600/40 rounded-xl px-4 py-3">
                    <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-200">Pre-Order Available</p>
                      <p className="text-sm text-blue-400/80">
                        Reserve yours now and be first in line when stock arrives. You'll only be charged when your order ships.
                      </p>
                    </div>
                  </div>
                )}
                {selectedSize && selectedColor && currentVariantStatus === 'out_of_stock' && (
                  <div className="mt-4 text-gray-400 bg-gradient-to-r from-gray-800/50 to-gray-700/30 border border-gray-600/40 rounded-xl px-4 py-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-300">Currently Out of Stock</p>
                        <p className="text-sm text-gray-500">
                          This size and colour is temporarily unavailable.
                        </p>
                      </div>
                    </div>
                    {authData?.id ? (
                      (() => {
                        const currentVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor);
                        const isSubscribed = stockAlerts.some(a => a.productId === id && (a.variantId === currentVariant?.id || !a.variantId));
                        return (
                          <Button
                            onClick={() => subscribeToStockAlert.mutate({ 
                              productId: id!, 
                              variantId: currentVariant?.id 
                            })}
                            disabled={isSubscribed || subscribeToStockAlert.isPending}
                            className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            size="sm"
                          >
                            <Bell className="h-4 w-4 mr-2" />
                            {isSubscribed ? 'Notification Set' : subscribeToStockAlert.isPending ? 'Setting up...' : 'Notify Me When Available'}
                          </Button>
                        );
                      })()
                    ) : (
                      <Button
                        onClick={() => setLocation('/login')}
                        className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="sm"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Sign In to Get Notified
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Colour Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Colour {selectedColor && <span className="text-primary ml-1">• {selectedColor}</span>}
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`min-w-[40px] px-3 py-2 text-sm font-medium border rounded-md transition-all active:scale-95 ${
                        selectedColor === color
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-gray-900 text-white border-gray-600 hover:border-white hover:bg-gray-800'
                      }`}
                      data-testid={`button-color-${color}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={currentVariantStatus === 'coming_soon' ? undefined : handleAddToCart}
                disabled={currentVariantStatus === 'coming_soon' || currentVariantStatus === 'out_of_stock'}
                className={`flex-1 h-10 text-sm ${
                  currentVariantStatus === 'coming_soon'
                    ? 'bg-amber-500 text-black hover:bg-amber-400 cursor-not-allowed'
                    : currentVariantStatus === 'pre_order'
                      ? 'bg-blue-500 text-white hover:bg-blue-400'
                      : currentVariantStatus === 'out_of_stock'
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-gray-200'
                }`}
                data-testid="button-add-to-cart"
              >
                {currentVariantStatus === 'coming_soon' ? (
                  <>
                    <Clock className="h-4 w-4 mr-1.5" />
                    Coming Soon
                  </>
                ) : currentVariantStatus === 'pre_order' ? (
                  <>
                    <Clock className="h-4 w-4 mr-1.5" />
                    Pre-Order
                  </>
                ) : currentVariantStatus === 'out_of_stock' ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    Out of Stock
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocation('/cart')}
                className="h-10 w-10 border-gray-600 text-white hover:bg-gray-800 relative overflow-visible"
                data-testid="button-view-cart"
                title="View Cart"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 z-10 shadow-md">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => product && toggleWishlist(product.id)}
                className={`h-10 w-10 border-gray-600 text-white hover:bg-gray-800 ${
                  product && isInWishlist(product.id) ? 'bg-gray-800' : ''
                }`}
                data-testid="button-wishlist"
              >
                <Heart
                  className={`h-4 w-4 ${
                    product && isInWishlist(product.id) ? 'fill-current text-destructive' : ''
                  }`}
                />
              </Button>
            </div>

            {/* Model Information */}
            {product.modelInfo && (
              <div className="bg-gray-900 border border-gray-700 rounded-md p-3">
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Model Info
                </h3>
                <p className="text-gray-400 text-xs" data-testid="text-model-info">
                  {product.modelInfo}
                </p>
              </div>
            )}

            {/* Short Description - Shown below Model Info */}
            {product.description && (
              <div>
                <p className="text-gray-400 text-sm leading-relaxed" data-testid="text-product-description">
                  {product.description}
                </p>
              </div>
            )}

            {/* Detailed Description - Shown directly after Short Description */}
            {product.detailedDescription && (
              <div>
                <div 
                  className="prose prose-sm max-w-none text-gray-400 prose-headings:text-white prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-ul:list-disc prose-ol:list-decimal prose-invert" 
                  data-testid="text-detailed-description"
                  dangerouslySetInnerHTML={{ __html: product.detailedDescription }}
                />
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Features
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-400">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Materials */}
            {product.materials && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Materials
                </h3>
                <p className="text-gray-400" data-testid="text-materials">
                  {product.materials}
                </p>
              </div>
            )}

            {/* Care Instructions */}
            {product.careInstructions && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Care Instructions
                </h3>
                <p className="text-gray-400 whitespace-pre-line" data-testid="text-care-instructions">
                  {product.careInstructions}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Product Reviews Section */}
        {product && (
          <ProductReviews 
            productId={product.id} 
            productName={product.name}
            currentUserId={authData?.id || null}
          />
        )}
        
        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800" data-testid="section-similar-products">
            <h2 className="text-2xl font-bold text-white mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((similarProduct) => (
                <a
                  key={similarProduct.id}
                  href={`/product/${similarProduct.id}`}
                  className="group block bg-gray-900 rounded-md overflow-hidden border border-gray-800 hover:border-gray-600 transition-all"
                  data-testid={`card-similar-${similarProduct.id}`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={convertToDirectUrl(similarProduct.imageUrl)}
                      alt={similarProduct.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white truncate">{similarProduct.name}</h3>
                    <p className="text-sm text-primary mt-1">
                      £{parseFloat(similarProduct.retailPrice).toFixed(2)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
        
        {/* You May Also Like Section - Products from other categories */}
        {otherProducts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800" data-testid="section-other-products">
            <h2 className="text-2xl font-bold text-white mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {otherProducts.map((otherProduct) => (
                <a
                  key={otherProduct.id}
                  href={`/product/${otherProduct.id}`}
                  className="group block bg-gray-900 rounded-md overflow-hidden border border-gray-800 hover:border-gray-600 transition-all"
                  data-testid={`card-other-${otherProduct.id}`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={convertToDirectUrl(otherProduct.imageUrl)}
                      alt={otherProduct.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 mb-1">{otherProduct.category}</p>
                    <h3 className="text-sm font-medium text-white truncate">{otherProduct.name}</h3>
                    <p className="text-sm text-primary mt-1">
                      £{parseFloat(otherProduct.retailPrice).toFixed(2)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
      
      
      {/* Mobile Size/Colour Selection Sheet */}
      <Sheet open={isMobileSizeSheetOpen} onOpenChange={setIsMobileSizeSheetOpen}>
        <SheetContent side="bottom" className="bg-gradient-to-b from-gray-900 to-black border-t border-gray-700 rounded-t-3xl max-h-[85vh] overflow-y-auto">
          {/* Handle bar indicator */}
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-12 h-1 bg-gray-600 rounded-full" />
          </div>
          
          <SheetHeader className="pb-4 px-2">
            <SheetTitle className="text-white text-xl font-bold text-left">Select Options</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 pb-8 px-2">
            {/* Colour Selection */}
            {product?.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Colour {selectedColor && <span className="text-primary font-normal">• {selectedColor}</span>}
                </label>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`min-w-[60px] px-5 py-3.5 text-sm font-medium border-2 rounded-xl transition-all active:scale-95 ${
                        selectedColor === color
                          ? 'bg-white text-black border-white shadow-lg shadow-white/20'
                          : 'bg-gray-800/80 text-white border-gray-600 hover:border-gray-400'
                      }`}
                      data-testid={`button-mobile-color-${color}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Size Selection */}
            {product?.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Size {selectedSize && <span className="text-primary font-normal">• {selectedSize}</span>}
                </label>
                <div className="flex gap-3 flex-wrap">
                  {sortSizes(availableSizesForColor.length > 0 ? availableSizesForColor : product.sizes).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] px-5 py-3.5 text-sm font-medium border-2 rounded-xl transition-all active:scale-95 ${
                        selectedSize === size
                          ? 'bg-white text-black border-white shadow-lg shadow-white/20'
                          : 'bg-gray-800/80 text-white border-gray-600 hover:border-gray-400'
                      }`}
                      data-testid={`button-mobile-size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add to Cart Button */}
            <Button
              size="lg"
              onClick={handleAddToCart}
              className="w-full bg-white text-black hover:bg-gray-100 py-7 text-base font-semibold rounded-xl mt-4"
              disabled={
                (product?.sizes && product.sizes.length > 0 && !selectedSize) ||
                (product?.colors && product.colors.length > 0 && !selectedColor)
              }
              data-testid="button-add-to-cart-sheet"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart • £{effectivePrices.isOnSale ? effectivePrices.salePrice!.toFixed(2) : effectivePrices.retailPrice.toFixed(2)}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
