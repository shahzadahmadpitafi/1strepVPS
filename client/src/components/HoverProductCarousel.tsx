import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'wouter';

type Product = {
  id: string;
  name: string;
  retailPrice: string;
  imageUrl: string;
  category: string;
  hoverImageUrl?: string;
};

interface HoverProductCarouselProps {
  category: string;
  isVisible: boolean;
  position?: 'right' | 'left' | 'center';
  alwaysVisibleOnMobile?: boolean;
}

export function HoverProductCarousel({ category, isVisible, position = 'right', alwaysVisibleOnMobile = false }: HoverProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Determine if carousel should be shown
  const shouldShowCarousel = isVisible || (alwaysVisibleOnMobile && isMobile);

  // Filter products by category
  // Map display names to actual products - show ALL products if no specific match
  const products = allProducts.filter(p => {
    const normalizedCategory = category.toLowerCase();
    const productCategory = p.category.toLowerCase();
    const productName = p.name.toLowerCase();
    
    // For "all" category, show all products
    if (normalizedCategory === 'all' || normalizedCategory === '') {
      return true;
    }
    
    // For "Hoodies and Jumpers" or "Hoodies & Sweatshirts", search by product name
    if (normalizedCategory === 'hoodies and jumpers' || normalizedCategory === 'hoodies & sweatshirts') {
      return /\bhoodie|hoodies|jumper|jumpers|sweatshirt|pullover\b/i.test(productName);
    }
    // For "T-Shirts" or "T-Shirts & Tees", search by product name with word boundaries (handles singular/plural, hyphenated, spaced)
    if (normalizedCategory === 't-shirts' || normalizedCategory === 't-shirts & tees') {
      return /\bt[\s-]?shirts?\b|\btee[\s]?shirts?\b|\btees?\b/i.test(productName);
    }
    // For "Leggings", search by product name with word boundaries
    if (normalizedCategory === 'leggings') {
      return /\bleggings?\b|\btights?\b/i.test(productName);
    }
    // For "Vests & Crops" or "Vests & Crop Tops", search by product name with word boundaries
    if (normalizedCategory === 'vests & crops' || normalizedCategory === 'vests & crop tops') {
      return /\bvests?\b|\bcrops?\b|\btanks?\b|\bsports?\sbras?\b/i.test(productName);
    }
    // For "Shorts" or "Casual Shorts", search by product name with word boundaries
    if (normalizedCategory === 'shorts' || normalizedCategory === 'casual shorts') {
      return /\bshorts?\b/i.test(productName);
    }
    // For "Jackets" or "Jackets & Windbreakers", search by product name with word boundaries
    if (normalizedCategory === 'jackets' || normalizedCategory === 'jackets & windbreakers') {
      return /\bjackets?\b|\bcoats?\b|\bwindbrea?ker/i.test(productName);
    }
    // For "Hats", search by product name with word boundaries
    if (normalizedCategory === 'hats') {
      return /\bhats?\b|\bcaps?\b|\bbeanie\b|\bbeanies\b/i.test(productName);
    }
    // For "Joggers" or "Joggers & Track Pants", search by product name with word boundaries
    if (normalizedCategory === 'joggers' || normalizedCategory === 'joggers & track pants') {
      return /\bjogger|joggers|track\spant|sweatpant|pants?\b/i.test(productName);
    }
    // For "Accessories", match category or search by product name
    if (normalizedCategory === 'accessories') {
      return productCategory === 'accessories' || 
             /\baccessor/i.test(productName) ||
             /\bbag\b|\bbags\b|\bbottle\b|\btowel\b|\bglove/i.test(productName);
    }
    // For "Outdoor Training", match category
    if (normalizedCategory === 'outdoor training') {
      return productCategory === 'outdoor training';
    }
    // For "New Arrivals", match category
    if (normalizedCategory === 'new arrivals') {
      return productCategory === 'new arrivals';
    }
    // Default: try to match category, or return true to show all products
    return productCategory === normalizedCategory || productCategory.includes(normalizedCategory) || normalizedCategory.includes(productCategory);
  });
  
  // If no products matched the filter, show all products as fallback
  const finalProducts = products.length > 0 ? products : allProducts;
  
  // Limit to 6 products
  const displayProducts = finalProducts.slice(0, 6);

  // Auto-play carousel
  useEffect(() => {
    if (!shouldShowCarousel || !isAutoPlaying || displayProducts.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayProducts.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [shouldShowCarousel, isAutoPlaying, displayProducts.length]);

  // Reset index when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentIndex(0);
      setIsAutoPlaying(true);
    }
  }, [isVisible]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % displayProducts.length);
  };

  if (displayProducts.length === 0) return null;

  // Get visible products (show 3 at a time)
  const getVisibleProducts = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % displayProducts.length;
      visible.push(displayProducts[index]);
    }
    return visible;
  };

  const positionClasses = {
    right: isMobile ? 'right-4 bottom-8' : 'right-16 bottom-8',
    left: isMobile ? 'left-4 bottom-8' : 'left-16 bottom-8',
    center: 'left-1/2 -translate-x-1/2 bottom-8'
  };

  return (
    <AnimatePresence>
      {shouldShowCarousel && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`absolute ${positionClasses[position]} z-10`}
          data-testid="hover-product-carousel"
        >
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-6 shadow-2xl border border-white/10">
            <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
              {category}
            </h3>
            
            <div className="flex flex-col items-center gap-3">
              {/* Previous Button (Up) */}
              <button
                onClick={handlePrevious}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                data-testid="button-carousel-prev"
                aria-label="Previous product"
              >
                <ChevronUp className="w-5 h-5 text-white" />
              </button>

              {/* Product Cards - Vertical Stack */}
              <div className="flex flex-col gap-3">
                {getVisibleProducts().map((product, idx) => (
                  <Link key={`${product.id}-${idx}`} href={`/product/${product.id}`}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative w-48 h-32 rounded-md overflow-hidden cursor-pointer hover-elevate"
                      data-testid={`carousel-product-${product.id}`}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Product Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {product.name}
                        </p>
                        <p className="text-white/90 text-xs font-semibold">
                          £{product.retailPrice}
                        </p>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Next Button (Down) */}
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                data-testid="button-carousel-next"
                aria-label="Next product"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Indicator Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {displayProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex 
                      ? 'w-6 bg-white' 
                      : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  data-testid={`carousel-dot-${idx}`}
                  aria-label={`Go to product ${idx + 1}`}
                />
              ))}
            </div>

            {/* Auto-play indicator */}
            {isAutoPlaying && (
              <p className="text-white/50 text-xs text-center mt-2">
                Auto-playing
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
