import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeaderClean from "@/components/HeaderClean";
import ProductCardClean from "@/components/ProductCardClean";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  retailPrice?: string;
  category: string;
  imageUrl: string;
  hoverImageUrl?: string;
  inStock: boolean;
  featured?: boolean;
  collections?: string[];
  availabilityStatus?: string;
  displayColor?: string | null;
  displayName?: string;
  colorVariantId?: string;
}

export default function OneRCollection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

  // Use the color-expanded API to show each color as a separate product card
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/by-color']
  });

  // Filter to only show products assigned to '1r-collection'
  const collectionProducts = products.filter(product => 
    product.collections?.includes('1r-collection') && 
    product.availabilityStatus !== 'discontinued'
  );

  const filteredProducts = collectionProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const priceA = parseFloat(a.retailPrice || String(a.price)) || 0;
      const priceB = parseFloat(b.retailPrice || String(b.price)) || 0;
      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const categories = ["all", ...Array.from(new Set(collectionProducts.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1556906781-9cba4a8a9a92?q=80&w=2070')",
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
            Affiliated Brand
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6" data-testid="collection-heading">
            1 R Collection
          </h1>
          <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-200">
            Premium athletic wear engineered for athletes who demand excellence.
            <br className="hidden md:block" />
            Tactical design meets uncompromising performance.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name: A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span data-testid="product-count">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square mb-4" />
                  <div className="h-4 bg-gray-200 mb-2" />
                  <div className="h-4 bg-gray-200 w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCardClean 
                  key={`${product.id}-${product.displayColor || index}`} 
                  id={product.id}
                  name={product.displayName || product.name}
                  price={parseFloat(product.retailPrice || String(product.price)) || 0}
                  image={product.imageUrl}
                  hoverImage={product.hoverImageUrl}
                  category={product.category}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-black">About 1 R Collection</h2>
          <p className="text-xl text-gray-700 leading-relaxed mb-8">
            1 R Collection is an affiliated brand partnered with 1stRep, bringing together cutting-edge 
            athletic wear technology with tactical-inspired design. Every piece is crafted for athletes 
            who demand both performance and style.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Our partnership combines 1stRep's commitment to quality with 1 R Collection's innovative 
            approach to activewear, creating a unique line that stands out in both the gym and on the street.
          </p>
        </div>
      </section>
    </div>
  );
}
