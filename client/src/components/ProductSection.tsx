import { useState, useCallback, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useSectionAnalytics } from '@/hooks/useSectionAnalytics';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { convertToDirectUrl } from '@/lib/imageUtils';

function ImageWithLoader({ 
  src, 
  alt, 
  className, 
  loading = "lazy",
  fill = false,
  onLoad,
  onError,
  onDimensionsLoaded
}: { 
  src: string; 
  alt: string; 
  className?: string; 
  loading?: "eager" | "lazy";
  fill?: boolean;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onDimensionsLoaded?: (width: number, height: number) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const wrapperClass = fill ? "absolute inset-0" : "relative w-full h-full";

  return (
    <div className={wrapperClass}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={`w-full h-full ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={(e) => {
          setIsLoading(false);
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            onDimensionsLoaded?.(img.naturalWidth, img.naturalHeight);
          }
          onLoad?.();
        }}
        onError={(e) => {
          setIsLoading(false);
          setHasError(true);
          onError?.(e);
        }}
      />
    </div>
  );
}


interface ProductSectionProps {
  id: string;
  sectionName: string;
  category: string;
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  hovered?: boolean;
  setHovered?: (hovered: boolean) => void;
  position?: 'left' | 'right';
  genderFilter?: 'all' | 'men' | 'women';
  viewAllLink?: string | null;
}

type Product = {
  id: string;
  name: string;
  category: string;
  retailPrice: string;
  imageUrl: string;
  images?: string[];
  hoverImageUrl?: string | null;
  heroImageUrl?: string | null;
  heroHoverImageUrl?: string | null;
  displayColor?: string | null;
  displayName?: string;
  isHeroProduct?: boolean;
  gender?: string | null;
};

export default function ProductSection({
  id,
  sectionName,
  category,
  image,
  title,
  subtitle,
  badge,
  genderFilter = 'all',
  viewAllLink,
}: ProductSectionProps) {
  const { trackClick } = useSectionAnalytics(sectionName, id);
  
  // Fetch site settings to check if colors should be shown as separate products
  const { data: siteSettings } = useQuery<{ showColorsAsSeparateProducts?: boolean }>({
    queryKey: ["/api/site-settings"],
  });
  
  const showColorsAsSeparateProducts = siteSettings?.showColorsAsSeparateProducts ?? true;
  
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: showColorsAsSeparateProducts ? ["/api/products/by-color"] : ["/api/products"],
    enabled: siteSettings !== undefined,
  });

  // Filter products by category - simple exact match (case-insensitive)
  // Products must have their category field set to match the section name
  const products = allProducts.filter(p => {
    const sectionCategory = category.toLowerCase().trim();
    const productCategory = p.category.toLowerCase().trim();
    
    // Exact match between product category and section name
    return productCategory === sectionCategory;
  });

  // Find hero product in this category (isHeroProduct = true), or fall back to first product
  const heroProduct = products.find(p => p.isHeroProduct) || products[0];
  
  // Use hero product's main image for hero section
  // Prefer heroImageUrl (from by-color endpoint) over imageUrl, then fall back to image prop
  // Convert Dropbox/Google Drive URLs to direct download URLs
  const rawImage = heroProduct?.heroImageUrl || heroProduct?.imageUrl || (heroProduct?.images && heroProduct.images[0]) || image;
  const sectionImage = rawImage ? convertToDirectUrl(rawImage) : '';
  
  // Get hover image for the hero section
  // Prefer heroHoverImageUrl (from by-color endpoint) over hoverImageUrl
  const rawHoverImage = heroProduct?.heroHoverImageUrl || heroProduct?.hoverImageUrl;
  const sectionHoverImage = rawHoverImage ? convertToDirectUrl(rawHoverImage) : null;
  
  // Check if we have a valid image to display
  const hasValidImage = sectionImage && sectionImage.length > 0;

  // Filter products by gender based on section's genderFilter setting
  // Gender values from schema enum: 'men', 'women', 'unisex'
  const maleProducts = products.filter(p => p.gender?.toLowerCase() === 'men');
  const femaleProducts = products.filter(p => p.gender?.toLowerCase() === 'women');
  const unisexProducts = products.filter(p => p.gender?.toLowerCase() === 'unisex' || !p.gender);
  
  // Apply gender filter from section settings
  let displayedProducts: Product[] = [];
  
  if (genderFilter === 'men') {
    // Show only men's products + unisex
    displayedProducts = [...maleProducts, ...unisexProducts];
  } else if (genderFilter === 'women') {
    // Show only women's products + unisex
    displayedProducts = [...femaleProducts, ...unisexProducts];
  } else {
    // 'all' - Interleave male and female products for variety, then add unisex
    const maxLen = Math.max(maleProducts.length, femaleProducts.length);
    for (let i = 0; i < maxLen; i++) {
      if (maleProducts[i]) displayedProducts.push(maleProducts[i]);
      if (femaleProducts[i]) displayedProducts.push(femaleProducts[i]);
    }
    // Add unisex products at the end
    displayedProducts = [...displayedProducts, ...unisexProducts];
  }
  
  // Remove duplicates by id-color combination
  const seen = new Set<string>();
  displayedProducts = displayedProducts.filter(p => {
    const key = p.displayColor ? `${p.id}-${p.displayColor}` : p.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Compute the View All link - use custom viewAllLink if provided, otherwise build default
  const defaultViewAllLink = `/shop-clean?category=${encodeURIComponent(category)}`;
  const effectiveViewAllLink = viewAllLink || defaultViewAllLink;
  
  // State for hero section hover
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  
  // State for dynamic aspect ratio based on image dimensions
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(3/4); // Default portrait ratio
  
  // Carousel setup with autoplay
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      slidesToScroll: 1,
      containScroll: 'trimSnaps'
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section
      className="relative overflow-hidden w-full max-w-full"
      id={id}
    >
      {/* SECTION 1: HERO / FEATURED - Mixed Horizontal & Vertical Layout */}
      <div className="relative overflow-hidden bg-black w-full">
        {/* Mobile: Stacked Vertical Layout - Full width */}
        <div className="block lg:hidden w-full overflow-hidden">
          {/* Badge at top */}
          <div className="px-5 pt-6 pb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-md border border-primary/40 rounded-full text-[10px] font-semibold tracking-widest uppercase text-primary">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {badge}
            </div>
          </div>
          
          {/* Image in middle - full width, no gaps */}
          {hasValidImage ? (
            <div
              className="relative overflow-hidden bg-black w-full"
              style={{ 
                aspectRatio: imageAspectRatio,
                minHeight: '200px',
                maxHeight: '400px',
                marginLeft: '-1px',
                marginRight: '-1px',
                width: 'calc(100% + 2px)'
              }}
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={() => setIsHeroHovered(false)}
            >
              <ImageWithLoader
                src={sectionImage}
                alt={title}
                loading="eager"
                fill={true}
                onDimensionsLoaded={(w, h) => setImageAspectRatio(w / h)}
                className={`object-cover object-top transition-all duration-500 ${
                  isHeroHovered && sectionHoverImage ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {sectionHoverImage && (
                <img
                  src={sectionHoverImage}
                  alt={`${title} alternate view`}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ${
                    isHeroHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </div>
          ) : (
            <div className="relative min-h-[150px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
              <p className="text-sm text-gray-500">No products in this section yet</p>
            </div>
          )}
          
          {/* Title and buttons at bottom */}
          <div className="px-5 py-5">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-2">
              {title}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line font-light mb-4">
              {subtitle}
            </p>
            <div className="flex flex-row gap-3">
              {(genderFilter === 'all' || genderFilter === 'men') && (
                <Link href={`/shop-clean?category=${encodeURIComponent(category)}&gender=men`} onClick={trackClick}>
                  <button
                    className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-md border-2 border-white hover:bg-gray-100 transition-all duration-300"
                    data-testid="button-shop-men"
                  >
                    Shop Men
                  </button>
                </Link>
              )}
              {(genderFilter === 'all' || genderFilter === 'women') && (
                <Link href={`/shop-clean?category=${encodeURIComponent(category)}&gender=women`} onClick={trackClick}>
                  <button
                    className="px-5 py-2.5 bg-transparent text-white text-sm font-bold rounded-md border-2 border-white hover:bg-white hover:text-black transition-all duration-300"
                    data-testid="button-shop-women"
                  >
                    Shop Women
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Tight Two-Column Layout */}
        <div className="hidden lg:block">
          <div className="flex" style={{ height: 'min(520px, calc(100vh - 180px))' }}>
            {/* Left Column - Text Content */}
            <div className="flex-shrink-0 w-[42%] xl:w-[38%] relative bg-black flex flex-col justify-center pl-8 xl:pl-12 pr-4 py-6 z-20">
              <div className="space-y-4">
                {/* Badge */}
                <div className="inline-block">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary/15 to-primary/5 backdrop-blur-md border border-primary/40 rounded-full text-xs font-semibold tracking-widest uppercase text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {badge}
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight whitespace-nowrap">
                  {title}
                </h2>
                
                {/* Subtitle */}
                <p className="text-base text-gray-400 leading-relaxed whitespace-pre-line font-light">
                  {subtitle}
                </p>
                
                {/* Buttons - Same Width */}
                <div className="flex flex-col gap-3 pt-2 w-44">
                  {(genderFilter === 'all' || genderFilter === 'men') && (
                    <Link href={`/shop-clean?category=${encodeURIComponent(category)}&gender=men`} onClick={trackClick} className="w-full">
                      <button
                        className="w-full py-3 bg-white text-black text-sm font-bold rounded-md border-2 border-white hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
                        data-testid="button-shop-men"
                      >
                        Shop Men
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                  {(genderFilter === 'all' || genderFilter === 'women') && (
                    <Link href={`/shop-clean?category=${encodeURIComponent(category)}&gender=women`} onClick={trackClick} className="w-full">
                      <button
                        className="w-full py-3 bg-transparent text-white text-sm font-bold rounded-md border-2 border-white hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                        data-testid="button-shop-women"
                      >
                        Shop Women
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Two Images Side by Side, aligned right */}
            {hasValidImage ? (
              <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-end gap-0">
                {/* Main Image */}
                <img
                  src={sectionImage}
                  alt={title}
                  loading="eager"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                      setImageAspectRatio(img.naturalWidth / img.naturalHeight);
                    }
                  }}
                  className="h-full object-contain object-right"
                />
                {/* Secondary Image (Hover Image shown alongside) */}
                {sectionHoverImage && (
                  <img
                    src={sectionHoverImage}
                    alt={`${title} alternate view`}
                    loading="lazy"
                    decoding="async"
                    className="h-full object-contain object-left"
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 relative bg-black flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-sm">No products in this section yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: PRODUCT GRID */}
      {displayedProducts.length > 0 && (
        <div className="bg-black px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="mb-3 md:mb-4 lg:mb-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 bg-primary/10 backdrop-blur-md border border-primary/30 rounded-full">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-primary">Featured</p>
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Explore {title}
                </h3>
              </div>
              <Link href={effectiveViewAllLink} onClick={trackClick}>
                <button
                  className="hidden md:flex items-center gap-1.5 px-3 md:px-4 py-2 bg-white text-black text-sm font-bold rounded-md transition-all duration-300 hover:bg-gray-100"
                  data-testid="button-view-all"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Product Carousel */}
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                  {displayedProducts.map((product, idx) => {
                    const uniqueKey = product.displayColor 
                      ? `${product.id}-${product.displayColor}` 
                      : product.id;
                    
                    const productHoverImage = product.hoverImageUrl ? convertToDirectUrl(product.hoverImageUrl) : null;
                    
                    return (
                      <div 
                        key={uniqueKey} 
                        className="flex-shrink-0 w-[48%] sm:w-[48%] md:w-[32%] lg:w-[24%]"
                      >
                        <Link href={`/product/${product.id}`}>
                          <div
                            className="group relative h-52 sm:h-60 md:h-72 lg:h-80 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 hover-elevate cursor-pointer border border-gray-800 hover:border-primary/50 transition-all duration-300"
                            data-testid={`product-card-${product.id}`}
                          >
                            <img
                              src={convertToDirectUrl(product.imageUrl)}
                              alt={product.name}
                              loading={idx < 4 ? "eager" : "lazy"}
                              decoding="async"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"%3E%3Crect fill="%231f2937" width="400" height="500"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="system-ui" font-size="14"%3EImage loading...%3C/text%3E%3C/svg%3E';
                              }}
                              className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${
                                productHoverImage ? 'group-hover:opacity-0' : ''
                              }`}
                            />
                            {productHoverImage && (
                              <img
                                src={productHoverImage}
                                alt={`${product.name} alternate view`}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                                className="absolute inset-0 w-full h-full object-contain transition-all duration-500 opacity-0 group-hover:opacity-100"
                              />
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 text-center">
                              <h4 className="font-bold text-xs sm:text-sm line-clamp-2 mb-1 text-primary">
                                {product.name}
                              </h4>
                              <p className="text-primary font-black text-sm sm:text-base">
                                £{product.retailPrice}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 md:w-10 md:h-10 bg-black/80 hover:bg-primary text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                data-testid="carousel-prev"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 md:w-10 md:h-10 bg-black/80 hover:bg-primary text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                data-testid="carousel-next"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              {/* Dot Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {scrollSnaps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollTo(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === selectedIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-gray-600 hover:bg-gray-400'
                    }`}
                    data-testid={`carousel-dot-${idx}`}
                  />
                ))}
              </div>
            </div>

            {/* Mobile View All Button */}
            <div className="mt-8 md:hidden flex justify-center">
              <Link href={effectiveViewAllLink} onClick={trackClick}>
                <button
                  className="w-full sm:w-auto px-6 py-2.5 bg-white text-black text-sm font-bold rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="button-view-all-mobile"
                >
                  View All Products
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
