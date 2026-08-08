import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeaderClean from "@/components/HeaderClean";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  retailPrice: string;
  sku: string;
  category: string;
  imageUrl?: string;
  sizes: string[];
  colors: string[];
}

type SiteSettings = {
  activeTheme: "tactical_dark" | "modern_light" | "dynamic_gradient" | "clean_minimal";
};

export default function SearchResults() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(searchString);
  const initialQuery = urlParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Sync state with URL parameter changes
  useEffect(() => {
    const urlParams = new URLSearchParams(searchString);
    const queryFromUrl = urlParams.get('q') || '';
    setSearchQuery(queryFromUrl);
  }, [searchString]);

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  const activeTheme = siteSettings?.activeTheme || 'tactical_dark';
  const isCleanTheme = activeTheme === 'clean_minimal';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={isCleanTheme ? "min-h-screen bg-gray-900" : "min-h-screen bg-background"}>
      {isCleanTheme ? <HeaderClean /> : <Header />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-24 h-14 text-lg"
                data-testid="input-search-query"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                data-testid="button-search"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div>
          {searchQuery.trim() && (
            <h1 className={`text-2xl font-bold mb-6 ${isCleanTheme ? 'text-white' : ''}`}>
              Search Results for "{searchQuery}"
            </h1>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            </div>
          ) : searchQuery.trim() && products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className={`text-xl font-semibold mb-2 ${isCleanTheme ? 'text-white' : ''}`}>
                No products found
              </h2>
              <p className="text-muted-foreground">
                Try searching with different keywords
              </p>
            </div>
          ) : products.length > 0 ? (
            <>
              <p className="text-muted-foreground mb-6">
                Found {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={parseFloat(product.retailPrice)}
                    image={product.imageUrl || "/placeholder-product.jpg"}
                    category={product.category}
                    colors={product.colors || []}
                    sizes={product.sizes || []}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className={`text-xl font-semibold mb-2 ${isCleanTheme ? 'text-white' : ''}`}>
                Start searching
              </h2>
              <p className="text-muted-foreground">
                Enter a product name, SKU, or category above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
