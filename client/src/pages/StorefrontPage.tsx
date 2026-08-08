import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { ShoppingCart, Store, Zap } from "lucide-react";

interface Storefront {
  id: string;
  resellerId: string;
  slug: string;
  storeName: string;
  storeDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
  reseller: {
    businessName: string;
    contactPerson: string;
  } | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  imageUrl: string | null;
  sizes: string[] | null;
  colors: string[] | null;
  availabilityStatus: string;
  resellerProductId: string;
  colorImages?: Record<string, string>;
  colorHoverImages?: Record<string, string>;
  additionalImages?: string[];
}

export default function StorefrontPage() {
  const [, params] = useRoute("/store/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";
  const { totalItems } = useCart();

  // Fetch storefront data
  const { data: storefront, isLoading: storefrontLoading } = useQuery<Storefront>({
    queryKey: ["/api/storefronts", slug],
    enabled: !!slug
  });

  // Fetch storefront products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/storefronts", slug, "products"],
    enabled: !!slug && !!storefront
  });

  // Apply custom colors if available
  useEffect(() => {
    if (storefront?.primaryColor) {
      document.documentElement.style.setProperty('--storefront-primary', storefront.primaryColor);
    }
    if (storefront?.accentColor) {
      document.documentElement.style.setProperty('--storefront-accent', storefront.accentColor);
    }

    return () => {
      document.documentElement.style.removeProperty('--storefront-primary');
      document.documentElement.style.removeProperty('--storefront-accent');
    };
  }, [storefront]);

  if (storefrontLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-8" data-testid="skeleton-banner" />
          <Skeleton className="h-12 w-64 mb-4" data-testid="skeleton-title" />
          <Skeleton className="h-6 w-96 mb-8" data-testid="skeleton-description" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96" data-testid={`skeleton-product-${i}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!storefront) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4" data-testid="card-not-found">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              Storefront Not Found
            </CardTitle>
            <CardDescription>
              The storefront you're looking for doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" data-testid="button-back-home">
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              data-testid="button-home"
            >
              ← Back to 1stRep
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={() => navigate(`/store/${slug}/epos`)}
                data-testid="button-self-checkout"
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Self-Checkout
              </Button>
              <Button
                variant="outline"
                className="relative"
                onClick={() => navigate("/cart")}
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {totalItems > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0"
                    data-testid="badge-cart-count"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      {storefront.bannerUrl && (
        <div 
          className="w-full relative overflow-hidden"
          data-testid="img-banner"
        >
          <img
            src={convertToDirectUrl(storefront.bannerUrl)}
            alt="Store banner"
            className="w-full h-auto max-h-80 object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Storefront Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          {storefront.logoUrl && (
            <div className="flex-shrink-0">
              <img
                src={convertToDirectUrl(storefront.logoUrl)}
                alt={`${storefront.storeName} logo`}
                className="h-20 w-auto max-w-[120px] rounded-lg object-contain shadow-lg bg-white p-2"
                data-testid="img-logo"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2" data-testid="text-store-name">
              {storefront.storeName}
            </h1>
            {storefront.storeDescription && (
              <p className="text-muted-foreground text-lg mb-4" data-testid="text-store-description">
                {storefront.storeDescription}
              </p>
            )}
            {storefront.reseller && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-reseller-info">
                <Store className="h-4 w-4" />
                <span>Operated by {storefront.reseller.businessName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96" data-testid={`skeleton-loading-${i}`} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card data-testid="card-no-products">
            <CardHeader>
              <CardTitle>No Products Available</CardTitle>
              <CardDescription>
                This storefront doesn't have any products listed yet. Check back soon!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="hover-elevate overflow-hidden cursor-pointer group"
                data-testid={`card-product-${product.id}`}
                onClick={() => navigate(`/product/${product.id}?storefront=${storefront.id}&storefrontSlug=${slug}&resellerId=${storefront.resellerId}`)}
              >
                {product.imageUrl && (
                  <div className="aspect-[4/5] relative bg-muted overflow-hidden">
                    <img
                      src={convertToDirectUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      data-testid={`img-product-${product.id}`}
                    />
                    {product.availabilityStatus !== 'available' && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          {product.availabilityStatus === 'upcoming' && 'Coming Soon'}
                          {product.availabilityStatus === 'out_of_stock' && 'Out of Stock'}
                          {product.availabilityStatus === 'discontinued' && 'Discontinued'}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 
                    className="font-semibold text-lg mb-1 line-clamp-1"
                    data-testid={`text-product-name-${product.id}`}
                  >
                    {product.name}
                  </h3>
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: storefront.primaryColor }}
                    data-testid={`text-product-price-${product.id}`}
                  >
                    £{parseFloat(product.price).toFixed(2)}
                  </p>
                  
                  {/* Size badges */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {product.sizes.slice(0, 5).map((size) => (
                        <span
                          key={size}
                          className="px-2 py-0.5 text-xs border rounded bg-muted/50"
                          data-testid={`badge-size-${size}`}
                        >
                          {size}
                        </span>
                      ))}
                      {product.sizes.length > 5 && (
                        <span className="px-2 py-0.5 text-xs text-muted-foreground">
                          +{product.sizes.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Colour swatches */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.colors.slice(0, 4).map((color) => (
                        <span
                          key={color}
                          className="px-2 py-0.5 text-xs border rounded bg-muted/50"
                          data-testid={`badge-color-${color}`}
                        >
                          {color}
                        </span>
                      ))}
                      {product.colors.length > 4 && (
                        <span className="px-2 py-0.5 text-xs text-muted-foreground">
                          +{product.colors.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

