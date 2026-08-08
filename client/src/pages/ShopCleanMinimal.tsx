import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import HeaderClean from "@/components/HeaderClean";
import ProductCardClean from "@/components/ProductCardClean";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SlidersHorizontal, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { fadeIn, staggerItem } from "@/lib/animations";
import { type Product } from "@shared/schema";

// Static fallback categories - merged with dynamic categories from API
const fallbackCategories = ["Hoodies and Jumpers", "T-Shirts", "Leggings", "Vests & Crop Tops", "Shorts", "Jackets", "Hats", "Accessories"];

// Hero content configuration for different categories and genders
type HeroConfig = {
  badge: string;
  title: string;
  subtitle: string;
  gradient: string;
};

const heroConfigs: Record<string, HeroConfig> = {
  // Gender-specific heroes
  men: {
    badge: "MEN'S COLLECTION",
    title: "Built for\nPerformance",
    subtitle: "Premium athletic wear engineered for men who push their limits.",
    gradient: "from-slate-900 via-zinc-800 to-slate-900",
  },
  women: {
    badge: "WOMEN'S COLLECTION", 
    title: "Strength\nMeets Style",
    subtitle: "Athletic wear designed for women who demand both performance and elegance.",
    gradient: "from-slate-900 via-purple-950/30 to-slate-900",
  },
  // Category-specific heroes
  "T-Shirts": {
    badge: "T-SHIRTS",
    title: "Essential\nT-Shirts",
    subtitle: "Premium cotton and performance fabrics for everyday training and lifestyle.",
    gradient: "from-slate-900 via-blue-950/30 to-slate-900",
  },
  "Hoodies and Jumpers": {
    badge: "HOODIES & JUMPERS",
    title: "Stay Warm\nStay Ready",
    subtitle: "Cozy layers built for cold weather training and casual comfort.",
    gradient: "from-slate-900 via-amber-950/20 to-slate-900",
  },
  "Outdoor Training": {
    badge: "OUTDOOR TRAINING",
    title: "Train\nAnywhere",
    subtitle: "Weather-resistant gear for athletes who don't let conditions stop them.",
    gradient: "from-slate-900 via-green-950/30 to-slate-900",
  },
  "Accessories": {
    badge: "ACCESSORIES",
    title: "Complete\nYour Kit",
    subtitle: "Essential accessories to enhance your training and complete your look.",
    gradient: "from-slate-900 via-rose-950/20 to-slate-900",
  },
  "New Arrivals": {
    badge: "JUST DROPPED",
    title: "New\nArrivals",
    subtitle: "The latest additions to our collection. Be the first to rock them.",
    gradient: "from-slate-900 via-indigo-950/30 to-slate-900",
  },
  default: {
    badge: "SHOP ALL",
    title: "Elevate Your\nPerformance",
    subtitle: "Premium athletic wear engineered for athletes who demand excellence.",
    gradient: "from-slate-900 via-slate-800 to-slate-900",
  },
};

// Helper function to determine product type from name (matches backend logic)
const getProductType = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('hoodie')) return 'Hoodies';
  if (lowerName.includes('t-shirt') || lowerName.includes('tshirt')) return 'T-Shirts';
  if (lowerName.includes('sports bra') || lowerName.includes('bra')) return 'Sports Bras';
  if (lowerName.includes('legging')) return 'Leggings';
  if (lowerName.includes('tank')) return 'Tanks';
  if (lowerName.includes('hat') || lowerName.includes('jacket')) return 'Accessories';
  return 'General';
};

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
];

export default function ShopCleanMinimal() {
  const [location] = useLocation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("featured");

  // Get category and gender from URL parameters - update when location changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const genderParam = params.get('gender');
    
    // Accept any category from URL - will filter products accordingly
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("all");
    }
    
    // Apply gender filter if provided - works with any category
    if (genderParam) {
      setSelectedGender(genderParam.toLowerCase());
    } else {
      setSelectedGender(null);
    }
  }, [location]);

  // Fetch site settings to check if colors should be shown as separate products
  const { data: siteSettings } = useQuery<{ showColorsAsSeparateProducts?: boolean }>({
    queryKey: ["/api/site-settings"],
  });
  
  const showColorsAsSeparateProducts = siteSettings?.showColorsAsSeparateProducts ?? true;

  // Fetch products from API - use color-expanded products when setting is enabled
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<(Product & { displayColor?: string | null; displayName?: string })[]>({
    queryKey: showColorsAsSeparateProducts ? ["/api/products/by-color"] : ["/api/products"],
    enabled: siteSettings !== undefined,
  });

  // Fetch product sections to get dynamic categories with display order and gender filter
  const { data: productSections = [] } = useQuery<{ name: string; category?: string; isActive: boolean; displayOrder: number; genderFilter?: string }[]>({
    queryKey: ["/api/product-sections"],
  });

  // Build dynamic category list from active sections only, sorted by displayOrder
  // When a gender filter is active, prioritize gender-specific sections
  const availableCategories = useMemo(() => {
    // Only use active product sections as the source of truth for categories
    // This ensures renamed sections don't show duplicate entries
    let activeSections = productSections.filter(s => s.isActive);
    
    // Sort: first by gender match (gender-specific first when filter active), then by displayOrder
    activeSections.sort((a, b) => {
      // If gender filter is active, prioritize matching gender sections
      if (selectedGender) {
        const aMatchesGender = a.genderFilter === selectedGender;
        const bMatchesGender = b.genderFilter === selectedGender;
        if (aMatchesGender && !bMatchesGender) return -1;
        if (!aMatchesGender && bMatchesGender) return 1;
      }
      // Then sort by displayOrder
      return a.displayOrder - b.displayOrder;
    });
    
    return ["all", ...activeSections.map(s => s.name)];
  }, [productSections, selectedGender]);

  // Fetch category sales data for sorting categories by sales performance
  const { data: categorySalesData = [] } = useQuery<{ category: string; totalSales: number }[]>({
    queryKey: ["/api/category-sales"],
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.availabilityStatus === 'available');

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply gender filter using the product's gender field
    // Products with 'unisex' gender appear in both men's and women's sections
    if (selectedGender) {
      filtered = filtered.filter((p) => {
        const productGender = p.gender || 'unisex';
        return productGender === selectedGender || productGender === 'unisex';
      });
    }

    // Apply category filter - use flexible matching to handle slight naming variations
    if (selectedCategory !== "all") {
      const selectedLower = selectedCategory.toLowerCase();
      filtered = filtered.filter((p) => {
        const productCategory = (p.category || '').toLowerCase();
        // Exact match first
        if (productCategory === selectedLower) return true;
        // Check if the product category contains key words from the selected category
        // e.g., "Hoodie" should match "Hoodies and Jumpers"
        const keywords = selectedLower.split(/\s+and\s+|\s+&\s+|\s+/);
        return keywords.some(keyword => 
          keyword.length > 2 && productCategory.includes(keyword.replace(/s$/, ''))
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.retailPrice) || 0;
          const priceB = parseFloat(b.retailPrice) || 0;
          return priceA - priceB;
        });
        break;
      case "price-desc":
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.retailPrice) || 0;
          const priceB = parseFloat(b.retailPrice) || 0;
          return priceB - priceA;
        });
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // Keep original order for "featured"
        break;
    }

    // Reorder to show paired products together (e.g., bra + leggings)
    // This ensures matching outfits appear side by side (bi-directional pairing)
    const reorderedProducts: typeof filtered = [];
    const processedKeys = new Set<string>();

    // Helper to get unique key for a product (considering color variants)
    const getProductKey = (p: typeof filtered[0]) => {
      const displayColor = (p as any).displayColor;
      return displayColor ? `${p.id}-${displayColor}` : p.id;
    };

    // Build reverse lookup: which products point to each product
    const reverseLinks: Record<string, string> = {};
    filtered.forEach(p => {
      const pairedId = (p as any).pairedProductId;
      if (pairedId) {
        reverseLinks[pairedId] = p.id;
      }
    });

    filtered.forEach(product => {
      const productKey = getProductKey(product);
      if (processedKeys.has(productKey)) return;

      reorderedProducts.push(product);
      processedKeys.add(productKey);

      // Check for forward link: this product points to another
      const forwardPairedId = (product as any).pairedProductId;
      if (forwardPairedId) {
        const pairedProduct = filtered.find(p => p.id === forwardPairedId && !processedKeys.has(getProductKey(p)));
        if (pairedProduct) {
          reorderedProducts.push(pairedProduct);
          processedKeys.add(getProductKey(pairedProduct));
        }
      }

      // Check for reverse link: another product points to this one
      const reverseLinkedId = reverseLinks[product.id];
      if (reverseLinkedId) {
        const reverseLinkedProduct = filtered.find(p => p.id === reverseLinkedId && !processedKeys.has(getProductKey(p)));
        if (reverseLinkedProduct) {
          reorderedProducts.push(reverseLinkedProduct);
          processedKeys.add(getProductKey(reverseLinkedProduct));
        }
      }
    });

    return reorderedProducts;
  }, [products, searchQuery, selectedCategory, selectedGender, sortBy]);

  // Group products by actual category from database and sort by sales performance
  const productsByCategory = useMemo(() => {
    // Create a map of category to products (using actual database category)
    const categoryMap: Record<string, typeof filteredProducts> = {};
    
    filteredProducts.forEach(product => {
      // Use the actual category from the database instead of deriving from name
      const category = product.category || 'General';
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(product);
    });

    // Create sales ranking map from API data
    const salesRanking: Record<string, number> = {};
    categorySalesData.forEach((item) => {
      salesRanking[item.category] = item.totalSales;
    });

    // Sort categories by sales (descending), put categories with no sales data at the end
    const sortedCategories = Object.keys(categoryMap).sort((a, b) => {
      const salesA = salesRanking[a] ?? -1;
      const salesB = salesRanking[b] ?? -1;
      return salesB - salesA;
    });

    return sortedCategories.map(category => ({
      category,
      products: categoryMap[category],
      totalSales: salesRanking[category] ?? 0
    }));
  }, [filteredProducts, categorySalesData]);

  const handleAddToCartWithProduct = (product: any, size?: string, color?: string) => {
    // Use sale price if available, otherwise use retail price
    const price = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.retailPrice);
    if (!isNaN(price)) {
      // Use the actual product ID (not the color-variant key) for the backend
      // The backend will look up the product by its real ID
      addToCart({
        id: product.id,
        name: product.displayName || product.name,
        price: price,
        size: size || 'M',
        color: color || product.displayColor || 'Black',
        image: product.imageUrl || '',
        category: product.category
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClean />

      <div className="container mx-auto px-4 py-6 md:py-8" data-products-section>
        {/* Filters and Search - Mobile Optimized */}
        <div className="space-y-4 mb-6 md:mb-8">
          {/* Search - Full width on all screens */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10 bg-white border-gray-300 text-black placeholder:text-gray-400 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-products-clean"
            />
          </div>

          {/* Filters Row - 2x2 grid on mobile, single row on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4">
            {/* Gender Filter */}
            <Select value={selectedGender || "all"} onValueChange={(value) => setSelectedGender(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-[140px] bg-white border-gray-300 text-black h-11 text-sm" data-testid="select-gender-clean">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="all" className="text-black hover:bg-gray-100">All Genders</SelectItem>
                <SelectItem value="men" className="text-black hover:bg-gray-100">Men</SelectItem>
                <SelectItem value="women" className="text-black hover:bg-gray-100">Women</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-300 text-black h-11 text-sm" data-testid="select-category-clean">
                <Filter className="h-4 w-4 mr-1 sm:mr-2 text-gray-600 flex-shrink-0" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300 max-h-[300px]">
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category} className="text-black hover:bg-gray-100">
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort - Spans full width on mobile */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full col-span-2 sm:col-span-1 sm:w-[180px] bg-white border-gray-300 text-black h-11 text-sm" data-testid="select-sort-clean">
                <SlidersHorizontal className="h-4 w-4 mr-1 sm:mr-2 text-gray-600 flex-shrink-0" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-black hover:bg-gray-100">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600" data-testid="results-count-clean">
            Showing {filteredProducts.length} of {products.filter(p => p.availabilityStatus === 'available').length} products
            {selectedGender && ` for ${selectedGender === 'men' ? 'Men' : 'Women'}`}
            {selectedCategory !== "all" && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Product Grid - Grouped by Category when showing all */}
        {isLoadingProducts ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          selectedCategory === "all" && !searchQuery ? (
            // Show products grouped by category, sorted by sales performance
            <div className="space-y-12">
              {productsByCategory.map(({ category, products: categoryProducts }) => (
                <div key={category} data-testid={`category-section-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">{category}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    {categoryProducts.map((product) => {
                      const uniqueKey = product.displayColor 
                        ? `${product.id}-${product.displayColor}` 
                        : product.id;
                      
                      return (
                        <ProductCardClean
                          key={uniqueKey}
                          id={product.id}
                          name={product.displayName || product.name}
                          price={(product as any).salePrice ? parseFloat((product as any).salePrice) : parseFloat(product.retailPrice) || 0}
                          originalPrice={(product as any).salePrice ? parseFloat(product.retailPrice) : undefined}
                          image={product.imageUrl || ''}
                          hoverImage={product.hoverImageUrl || undefined}
                          category={product.category}
                          sizes={product.sizes ?? undefined}
                          colors={product.displayColor ? [product.displayColor] : (product.colors ?? undefined)}
                          onAddToCart={(id, size, color) => handleAddToCartWithProduct(product, size, color)}
                          onToggleWishlist={() => toggleWishlist(product.id)}
                          isWishlisted={isInWishlist(product.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show flat grid when filtering by category or searching
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const uniqueKey = product.displayColor 
                  ? `${product.id}-${product.displayColor}` 
                  : product.id;
                
                return (
                  <ProductCardClean
                    key={uniqueKey}
                    id={product.id}
                    name={product.displayName || product.name}
                    price={(product as any).salePrice ? parseFloat((product as any).salePrice) : parseFloat(product.retailPrice) || 0}
                    originalPrice={(product as any).salePrice ? parseFloat(product.retailPrice) : undefined}
                    image={product.imageUrl || ''}
                    hoverImage={product.hoverImageUrl || undefined}
                    category={product.category}
                    sizes={product.sizes ?? undefined}
                    colors={product.displayColor ? [product.displayColor] : (product.colors ?? undefined)}
                    onAddToCart={(id, size, color) => handleAddToCartWithProduct(product, size, color)}
                    onToggleWishlist={() => toggleWishlist(product.id)}
                    isWishlisted={isInWishlist(product.id)}
                  />
                );
              })}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg" data-testid="no-results-clean">
              No products found matching your criteria.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSortBy("featured");
              }}
              data-testid="button-clear-filters-clean"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-gray-600 mb-6">
              Contact our team for custom orders or specific size requirements.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = 'mailto:info@1strep.com'}
              data-testid="button-contact-us-clean"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
