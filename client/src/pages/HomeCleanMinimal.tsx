import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import HeaderClean from '@/components/HeaderClean';
import HeroClean from '@/components/HeroClean';
import ProductCardClean from '@/components/ProductCardClean';
import CategoryCardClean from '@/components/CategoryCardClean';
import AnimatedCategoryCard from '@/components/AnimatedCategoryCard';
import ProductSection from '@/components/ProductSection';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useSectionAnalytics } from '@/hooks/useSectionAnalytics';

// Hero videos and images are now loaded from the database via /api/hero-videos
// Upload your real videos through the admin dashboard

type Product = {
  id: string;
  name: string;
  category: string;
  retailPrice: string;
  imageUrl: string;
  hoverImageUrl?: string | null;
  availabilityStatus?: string;
  displayColor?: string | null; // Color for color-expanded products
  displayName?: string; // Name with color for display
  colorVariantId?: string | null; // ID of the color variant
};

type HeroVideo = {
  id: string;
  title: string;
  videoUrl: string;
  displayOrder: number;
  isActive: boolean;
};

type HeroImage = {
  id: string;
  title: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
};

// No default hero image - wait for API data to load to show the correct image
const defaultHeroMedia: { type: 'video' | 'image'; src: string }[] = [];

export default function HomeCleanMinimal() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Fetch hero videos from database
  const { data: heroVideos = [] } = useQuery<HeroVideo[]>({
    queryKey: ["/api/hero-videos"],
  });
  
  // Fetch hero images from database
  const { data: heroImages = [] } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
  });
  
  // Fetch site settings for slide duration and color display preference
  const { data: siteSettings } = useQuery<{ heroSlideDuration?: number; showColorsAsSeparateProducts?: boolean }>({
    queryKey: ["/api/site-settings"],
  });
  
  const slideDuration = siteSettings?.heroSlideDuration ?? 6;
  const showColorsAsSeparateProducts = siteSettings?.showColorsAsSeparateProducts ?? true;
  
  // Combine videos and images, sorted by display order
  const heroMedia = useMemo(() => {
    const videos = heroVideos.map(v => ({ 
      type: 'video' as const, 
      src: v.videoUrl, 
      order: v.displayOrder 
    }));
    const images = heroImages.map(img => ({ 
      type: 'image' as const, 
      src: img.imageUrl, 
      order: img.displayOrder 
    }));
    
    const combined = [...videos, ...images].sort((a, b) => a.order - b.order);
    
    if (combined.length > 0) {
      return combined.map(({ type, src }) => ({ type, src }));
    }
    return defaultHeroMedia;
  }, [heroVideos, heroImages]);

  // Preload first hero image for faster LCP
  useEffect(() => {
    if (heroMedia.length > 0 && heroMedia[0].type === 'image') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = heroMedia[0].src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [heroMedia]);
  
  // Handle video end - move to next video (memoized to prevent interval resets)
  const handleVideoEnd = useCallback(() => {
    if (heroMedia.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % heroMedia.length);
    }
  }, [heroMedia.length]);
  
  const [, setLocation] = useLocation();

  // Fetch real products from API - use color-expanded products when setting is enabled
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: showColorsAsSeparateProducts ? ["/api/products/by-color"] : ["/api/products"],
    enabled: siteSettings !== undefined, // Wait for settings to load
  });

  // Filter only available products
  const availableProducts = products.filter(p => p.availabilityStatus === 'available').slice(0, 8);

  const handleAddToCart = (productId: string, selectedColor?: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        name: product.displayName || product.name,
        price: parseFloat(product.retailPrice),
        size: 'M', // Default size
        color: selectedColor || product.displayColor || 'Black', // Use color from the expanded product
        image: product.imageUrl || '',
        category: product.category
      });
    }
  };

  const handleToggleWishlist = (productId: string) => {
    toggleWishlist(productId);
  };

  const handleShopNowClick = () => {
    setLocation('/shop-clean');
  };

  // Fetch active product sections from database
  const { data: activeSections = [] } = useQuery<{ id: string; name: string; slug: string; description?: string; isActive: boolean; displayOrder: number; genderFilter?: 'all' | 'men' | 'women'; viewAllLink?: string | null }[]>({
    queryKey: ['/api/product-sections'],
  });

  // Animation patterns for dynamic sections
  const animationPatterns = [
    { initial: { opacity: 0, x: -100 }, direction: 'left' as const },
    { initial: { opacity: 0, x: 100 }, direction: 'right' as const },
    { initial: { opacity: 0, y: 100 }, direction: 'up' as const },
  ];

  // Badge options for dynamic sections
  const badgeOptions = [
    'Collection',
    'Essentials',
    'Performance Range',
    'Training Essentials',
    'New Arrival',
    'Featured',
  ];

  // Generate dynamic config for any section from database
  const generateSectionConfig = useCallback((section: { name: string; slug: string; description?: string }, index: number) => {
    const animation = animationPatterns[index % animationPatterns.length];
    const badge = badgeOptions[index % badgeOptions.length];
    
    return {
      id: section.slug,
      category: section.name,
      image: '',
      title: section.name,
      subtitle: section.description || `Explore our ${section.name.toLowerCase()} collection.\nPremium quality for every occasion.`,
      badge: badge,
      animation: animation
    };
  }, []);

  // Get ordered active sections directly from database - always respect displayOrder
  const orderedSections = useMemo(() => {
    // Filter to only active sections and sort by display order (admin-defined order)
    return [...activeSections]
      .filter(s => s.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [activeSections]);

  const currentMedia = heroMedia.length > 0 ? heroMedia[currentMediaIndex] : null;

  return (
    <div className="min-h-screen bg-gray-900 w-full max-w-full overflow-x-hidden">
      <HeaderClean />
      <HeroClean 
        image={currentMedia?.type === 'image' ? currentMedia.src : undefined}
        video={currentMedia?.type === 'video' ? currentMedia.src : undefined}
        title="Your 1st Rep Changes Everything"
        subtitle="Every champion started somewhere. Every record was once impossible. Make your move."
        onCtaClick={handleShopNowClick}
        onVideoEnd={handleVideoEnd}
        slideDuration={slideDuration}
      />

      {/* Dynamic Product Sections - Automatically Ordered by Popularity */}
      {orderedSections.map((section, index) => {
        // Generate config dynamically for any section from database
        const config = generateSectionConfig(section, index);
        
        return (
          <ProductSection
            key={section.id}
            id={config.id}
            sectionName={section.name}
            category={config.category}
            image={config.image}
            title={config.title}
            subtitle={config.subtitle}
            badge={config.badge}
            animation={config.animation}
            genderFilter={section.genderFilter || 'all'}
            viewAllLink={section.viewAllLink}
          />
        );
      })}

    </div>
  );
}
