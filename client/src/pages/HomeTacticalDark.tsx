import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { HoverProductCarousel } from "@/components/HoverProductCarousel";
import CategorySection from "@/components/CategorySection";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { staggerContainer, staggerItem, counterAnimation } from "@/lib/animations";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

type HeroImage = {
  id: string;
  title: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
};

export default function HomeTacticalDark() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Fetch hero images from database
  const { data: heroImages = [], isLoading: isLoadingImages } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
  });
  
  // Fetch site settings for slide duration
  const { data: siteSettings } = useQuery<{ heroSlideDuration?: number }>({
    queryKey: ["/api/site-settings"],
  });
  
  const slideDuration = (siteSettings?.heroSlideDuration ?? 6) * 1000;
  
  // Homepage SEO
  useSEO({
    title: 'Premium Fitness Apparel UK - Athletic Wear for Performance',
    description: 'Shop premium fitness apparel at 1stRep UK. High-quality athletic wear designed for performance, comfort and style. Free UK shipping on orders over £50.',
    url: 'https://1strep.com',
    type: 'website',
  });
  
  // Get sorted hero images with fallback
  const backgroundImages = useMemo(() => {
    const images = heroImages
      .filter(img => img.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(img => img.imageUrl);
    
    // Provide a fallback gradient placeholder if no images and still loading
    if (images.length === 0 && isLoadingImages) {
      return [];
    }
    
    return images;
  }, [heroImages, isLoadingImages]);

  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, slideDuration);
    return () => clearInterval(interval);
  }, [backgroundImages.length, slideDuration]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative bg-black">
        {/* Full-Screen Campaign Hero with Rotating Backgrounds */}
        <section className="relative min-h-[calc(100vh-56px)] md:min-h-screen flex items-center overflow-hidden">
          {/* Loading State / Fallback Background */}
          {(isLoadingImages || backgroundImages.length === 0) && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            </div>
          )}
          
          {/* Optimized Hero Image - Only load current and prefetch next */}
          {backgroundImages.length > 0 && (
            <>
              {/* Current active image */}
              <div className="absolute inset-0">
                <img 
                  src={backgroundImages[currentImageIndex]} 
                  alt="Premium Fitness Apparel"
                  className="absolute inset-0 w-full h-full object-cover"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              {/* Prefetch next image in background (hidden) */}
              {backgroundImages.length > 1 && (
                <link 
                  rel="prefetch" 
                  href={backgroundImages[(currentImageIndex + 1) % backgroundImages.length]} 
                  as="image"
                />
              )}
            </>
          )}
          
          {/* Dynamic Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 md:via-black/80 to-black/70 md:to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 z-[1]" />

          {/* Asymmetric Content Layout - Left Aligned */}
          <motion.div 
            className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full py-12 md:py-0"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <div className="max-w-3xl">
              {/* Minimal Badge */}
              <motion.div 
                className="inline-flex items-center gap-2 md:gap-3 mb-6 md:mb-8 group cursor-pointer" 
                data-testid="badge-performance"
                variants={staggerItem}
              >
                <div className="h-px w-8 md:w-12 bg-primary group-hover:w-16 md:group-hover:w-20 transition-all duration-300" />
                <span className="text-xs md:text-sm font-medium text-primary uppercase tracking-wider md:tracking-[0.3em]">
                  Premium Athletic Wear
                </span>
              </motion.div>
              
              {/* Ultra-Large, Bold Typography - Responsive */}
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-6 md:mb-8 leading-[0.95] md:leading-[0.9] tracking-tight"
                variants={staggerItem}
              >
                <span className="block text-white">TRAIN IN</span>
                <span className="block text-white">COMFORT</span>
                <span className="block bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                  & STYLE
                </span>
              </motion.h1>
              
              {/* Refined Description - Responsive */}
              <motion.p 
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-12 max-w-xl leading-relaxed"
                variants={staggerItem}
              >
                Premium athletic apparel built for performance and inclusivity. From gym sessions to outdoor training, our collection offers the perfect blend of functionality and modern design.
                <span className="block mt-2 text-primary font-medium text-sm sm:text-base">Inclusive sizing • Modest options • Superior quality</span>
              </motion.p>

              {/* Interactive CTAs - Responsive */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 md:gap-6 items-stretch sm:items-center"
                variants={staggerItem}
              >
                <Button 
                  size="lg" 
                  className="text-base md:text-lg px-8 md:px-10 py-6 md:py-7 rounded-none hover:scale-105 transition-transform min-h-12 md:min-h-14" 
                  asChild 
                  data-testid="button-shop-now"
                >
                  <Link href="/shop-clean">
                    Shop Now <ArrowRight className="ml-2 md:ml-3 h-5 md:h-6 w-5 md:w-6" />
                  </Link>
                </Button>
                
                <button className="flex items-center justify-center sm:justify-start gap-3 text-white hover:text-primary transition-colors group min-h-12 md:min-h-14" data-testid="button-watch-story">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-full border-2 border-white group-hover:border-primary flex items-center justify-center transition-colors">
                    <Play className="h-5 w-5 md:h-6 md:w-6 ml-1" />
                  </div>
                  <span className="text-base md:text-lg font-medium">Watch Our Story</span>
                </button>
              </motion.div>

              {/* Modern Stats - Responsive Grid */}
              <motion.div 
                className="grid grid-cols-3 gap-4 md:gap-8 lg:gap-16 mt-8 md:mt-16"
                variants={staggerItem}
              >
                <motion.div variants={counterAnimation}>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-primary mb-1">50K+</div>
                  <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">Athletes</div>
                </motion.div>
                <motion.div variants={counterAnimation}>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-primary mb-1">100%</div>
                  <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">Performance</div>
                </motion.div>
                <motion.div variants={counterAnimation}>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-primary mb-1">24/7</div>
                  <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">Comfort</div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Image Progress Indicators - Responsive Position */}
          <div className="absolute bottom-6 md:bottom-12 right-4 md:right-12 z-10 flex gap-2 md:gap-3">
            {backgroundImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-1 transition-all duration-300 min-h-11 ${
                  index === currentImageIndex ? 'w-12 md:w-16 bg-primary' : 'w-6 md:w-8 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`View image ${index + 1}`}
                data-testid={`image-indicator-${index}`}
              />
            ))}
          </div>

          {/* Scroll Indicator - Hidden on Mobile */}
          <div className="hidden md:flex absolute bottom-12 left-12 z-10 flex-col items-center gap-3 animate-bounce">
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
            <span className="text-xs text-gray-400 uppercase tracking-wider rotate-180" style={{ writingMode: 'vertical-rl' }}>
              Scroll
            </span>
          </div>
        </section>

        {/* Featured Collection - Split Layout */}
        <section className="relative py-16 md:py-20 lg:py-28 bg-black">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center mb-12 md:mb-16 lg:mb-20">
              <div>
                <div className="h-px w-12 md:w-16 bg-primary mb-4 md:mb-6" />
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight">
                  Our Premium
                  <span className="block text-primary">Collection</span>
                </h2>
                <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
                  Experience superior gymwear crafted with advanced fabric technology. Each piece is designed for maximum comfort, durability, and performance in every workout.
                </p>
                <Button variant="outline" size="lg" className="rounded-none min-h-11 w-full sm:w-auto" asChild data-testid="button-view-collection">
                  <Link href="/shop-clean">
                    View Collection <ShoppingBag className="ml-2 h-4 md:h-5 w-4 md:w-5" />
                  </Link>
                </Button>
              </div>
              
              {backgroundImages.length > 0 && (
                <div className="relative h-64 sm:h-80 md:h-96 group">
                  <div className="absolute inset-0 bg-primary/20 translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6 group-hover:translate-x-6 group-hover:translate-y-6 md:group-hover:translate-x-8 md:group-hover:translate-y-8 transition-transform" />
                  <div className="relative h-full bg-card border border-border overflow-hidden">
                    <img 
                      src={backgroundImages[0]} 
                      alt="Collection preview" 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Products - Seamless flow */}
        <section className="py-12 md:py-16 lg:py-20 relative bg-black">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <div className="h-px w-12 md:w-16 bg-primary mx-auto mb-4 md:mb-6" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 md:mb-4 text-white">New Arrivals</h2>
              <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">Discover the latest in performance athletic wear</p>
            </div>
            <div className="relative">
              <HoverProductCarousel 
                category="all" 
                isVisible={true} 
                position="center" 
                alwaysVisibleOnMobile={true}
              />
            </div>
          </div>
        </section>

        {/* Personalised - Continues the flow */}
        <div className="relative">
          <PersonalizedRecommendations />
        </div>

        {/* Categories - Unified appearance */}
        <div className="relative">
          <CategorySection />
        </div>

        {/* Campaign CTA - Full bleed */}
        <section className="relative min-h-[60vh] md:min-h-[80vh] flex items-center overflow-hidden">
          {backgroundImages.length > 1 && (
            <img 
              src={backgroundImages[backgroundImages.length - 1]} 
              alt="Join the movement" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/80" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 text-center w-full py-12">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 md:mb-8 text-white leading-tight">
              READY TO
              <span className="block text-primary">START TRAINING?</span>
            </h2>
            <p className="text-lg md:text-2xl text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto">
              Browse our complete collection of premium athletic wear designed for your active lifestyle
            </p>
            <Button size="lg" className="text-base md:text-xl px-8 md:px-12 py-6 md:py-8 rounded-none" asChild data-testid="button-get-started">
              <Link href="/shop-clean">
                Get Started <ArrowRight className="ml-2 md:ml-3 h-5 md:h-6 w-5 md:w-6" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
