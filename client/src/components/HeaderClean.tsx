import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, User, Menu, Heart, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Link, useLocation } from "wouter";
import CartSheet from "./CartSheet";
import WishlistSheet from "./WishlistSheet";
import SearchDialog from "./SearchDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserData {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ProductSection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  retailPrice: string;
  imageUrl: string;
  section?: string;
  salesCount?: number;
  viewCount?: number;
  isActive?: boolean;
  isHeroProduct?: boolean;
}

export default function HeaderClean() {
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Check if user is logged in
  const { data: authData } = useQuery<UserData>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Fetch announcement banner
  const { data: banner } = useQuery<{
    message: string;
    isVisible: boolean;
    backgroundColor?: string;
    textColor?: string;
  }>({
    queryKey: ['/api/announcement-banner'],
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch dynamic product sections
  const { data: productSections = [] } = useQuery<ProductSection[]>({
    queryKey: ['/api/product-sections'],
  });

  // Fetch products for featured display (top performing from Active Range)
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Get top 2 performing products from Active Range (products with images and highest sales/views)
  // Prioritize hero products, then sort by sales/views
  const featuredActiveProducts = allProducts
    .filter(p => p.isActive !== false && p.imageUrl)
    .sort((a, b) => {
      // Hero products first
      if (a.isHeroProduct && !b.isHeroProduct) return -1;
      if (!a.isHeroProduct && b.isHeroProduct) return 1;
      // Then by performance
      return ((b.salesCount || 0) + (b.viewCount || 0)) - ((a.salesCount || 0) + (a.viewCount || 0));
    })
    .slice(0, 2);

  // Helper to create section anchor ID (matches Active Range page pattern)
  const getSectionAnchorId = (sectionName: string): string => {
    const slug = sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return `${slug}-active-range`;
  };

  // Handle section click - navigate to shop page with category filter
  const handleSectionClick = (sectionName: string) => {
    setMegaMenuOpen(null);
    // Navigate to shop page with the category as a filter
    setLocation(`/shop-clean?category=${encodeURIComponent(sectionName)}`);
  };
  
  const navigationItems = [
    { label: "ACTIVE RANGE", href: "/training", hasMegaMenu: true, menuKey: "training" },
    { label: "1R COLLECTION", href: "/1r-collection" },
    { label: "COMPETITIONS", href: "/competitions" },
    { label: "RESELLERS", href: "/reseller/login" },
    { label: "INFLUENCER PROGRAMME", href: "/athletes" },
    { label: "ABOUT US", href: "/about" }
  ];

  // Use all sections in a single organized list for the mega menu
  const activeSections = productSections.filter(s => s.isActive);


  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-[999] bg-black">
      {/* Admin-Controlled Announcement Banner with Scrolling Animation */}
      {banner?.isVisible && banner?.message && (
        <Link href="/shop-clean">
          <div 
            className="w-full py-2 overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity bg-white/90 backdrop-blur-md text-black border-b border-white/20"
            data-testid="announcement-banner"
          >
            <div className="flex animate-marquee whitespace-nowrap">
              <span className="inline-flex items-center text-xs font-medium tracking-wider uppercase mx-6">
                {banner.message}
                <span className="mx-6 text-sm opacity-40">•</span>
              </span>
              <span className="inline-flex items-center text-xs font-medium tracking-wider uppercase mx-6">
                {banner.message}
                <span className="mx-6 text-sm opacity-40">•</span>
              </span>
              <span className="inline-flex items-center text-xs font-medium tracking-wider uppercase mx-6">
                {banner.message}
                <span className="mx-6 text-sm opacity-40">•</span>
              </span>
              <span className="inline-flex items-center text-xs font-medium tracking-wider uppercase mx-6">
                {banner.message}
                <span className="mx-6 text-sm opacity-40">•</span>
              </span>
            </div>
          </div>
        </Link>
      )}
      
      {/* Main Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
          {/* Logo - Left aligned */}
          <div className="flex items-center shrink-0">
            <Link 
              href="/" 
              className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-flex items-center"
              data-testid="link-home-logo-clean"
            >
              <img 
                src="/1strep-header-logo.png" 
                alt="1stRep" 
                className="h-14 md:h-16 w-auto object-contain"
                data-testid="logo-image-clean"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Left aligned, close to logo */}
          <nav className="hidden lg:flex items-center justify-start gap-6 xl:gap-8 flex-1 ml-12">
            {navigationItems.map((item) => (
              <div 
                key={item.label}
                className="relative"
                onMouseEnter={() => item.hasMegaMenu && item.menuKey && setMegaMenuOpen(item.menuKey)}
                onMouseLeave={() => item.hasMegaMenu && setMegaMenuOpen(null)}
              >
                <Link 
                  href={item.href}
                  className="text-white hover:text-gray-300 transition-colors duration-200 font-medium text-sm whitespace-nowrap relative group/nav pb-1"
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}-clean`}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover/nav:w-full transition-all duration-300 ease-out"></span>
                </Link>

                {/* Mega Menu for ACTIVE RANGE */}
                {item.menuKey === 'training' && megaMenuOpen === 'training' && (
                  <div 
                    className="absolute left-0 top-full w-[700px] bg-white/20 backdrop-blur-2xl border border-white/40 shadow-2xl z-[100] pointer-events-auto pt-4"
                    style={{ marginTop: '-1px' }}
                    onMouseEnter={() => setMegaMenuOpen('training')}
                    onMouseLeave={() => setMegaMenuOpen(null)}
                    data-testid="mega-menu-training"
                  >
                    <div className="grid grid-cols-12 gap-0">
                      {/* Featured Products - Left Side */}
                      <div className="col-span-5 bg-white/10 backdrop-blur-md p-6 border-r border-white/30">
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Top Performers</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {featuredActiveProducts.length > 0 ? (
                            featuredActiveProducts.map((product) => (
                              <Link key={product.id} href={`/product/${product.id}`}>
                                <div className="group cursor-pointer">
                                  <div className="aspect-square overflow-hidden rounded-lg mb-2 bg-white/90 backdrop-blur-sm">
                                    <img 
                                      src={product.imageUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('dl=0', 'dl=1')} 
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <p className="text-sm font-medium text-black group-hover:text-gray-600 transition-colors line-clamp-1">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    £{product.retailPrice}
                                  </p>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <>
                              <Link href="/shop-clean">
                                <div className="group cursor-pointer">
                                  <div className="aspect-square overflow-hidden rounded-lg mb-2 bg-gray-200 animate-pulse" />
                                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                </div>
                              </Link>
                              <Link href="/shop-clean">
                                <div className="group cursor-pointer">
                                  <div className="aspect-square overflow-hidden rounded-lg mb-2 bg-gray-200 animate-pulse" />
                                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                </div>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                      {/* All Categories - Right Side */}
                      <div className="col-span-7 p-6">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Shop by Category</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                          {activeSections.map((section) => (
                            <button 
                              key={section.id}
                              onClick={() => handleSectionClick(section.name)}
                              className="text-sm text-black hover:text-gray-600 transition-colors flex items-center justify-between group text-left"
                              data-testid={`menu-section-${section.slug}`}
                            >
                              <span>{section.name}</span>
                              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                        <Link href="/shop-clean">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-6"
                            data-testid="button-shop-all-active"
                          >
                            Shop All Active Range
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </nav>

          {/* Right side actions - Search, Icons */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Writable Search Input - Desktop (responsive width) */}
            <div 
              className="hidden lg:flex items-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-md px-3 py-2 cursor-text transition-colors w-[180px] xl:w-[220px] 2xl:w-[260px]"
              onClick={() => setSearchOpen(true)}
              data-testid="search-input-field"
            >
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-400 truncate">What are you looking for...</span>
            </div>
            
            {/* Mobile Search Icon */}
            <Button 
              variant="ghost" 
              size="icon"
              className="lg:hidden text-white hover:bg-gray-800"
              onClick={() => setSearchOpen(true)}
              data-testid="button-search-clean"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Wishlist - Hidden on mobile/tablet via CSS (available in bottom nav), Sheet on desktop */}
            <div className="hidden lg:block">
              <WishlistSheet>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative text-white hover:bg-gray-800"
                  data-testid="button-wishlist-clean"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white text-black"
                      data-testid="badge-wishlist-count-clean"
                    >
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>
              </WishlistSheet>
            </div>

            {/* User Account - Hidden on mobile/tablet via CSS (available in bottom nav) */}
            <div className="hidden lg:block">
              {authData ? (
                <Link href={
                  authData.role === 'admin' ? '/admin' : 
                  authData.role === 'vendor' ? '/vendor/dashboard' : 
                  authData.role === 'reseller' ? '/reseller/dashboard' : 
                  authData.role === 'athlete' ? '/athlete/dashboard' :
                  '/profile'
                }>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 text-white hover:bg-gray-800"
                    data-testid="button-account-logged-in-clean"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium" data-testid="text-header-user-name-clean">
                        {authData.firstName && authData.lastName 
                          ? `${authData.firstName} ${authData.lastName}` 
                          : authData.username || authData.email.split('@')[0]}
                      </p>
                    </div>
                  </Button>
                </Link>
              ) : (
                <Link href="/account">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-white hover:bg-gray-800"
                    data-testid="button-account-clean"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Shopping Cart - Hidden on mobile/tablet via CSS (available in bottom nav) */}
            <div className="hidden lg:block">
              <CartSheet>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-white hover:bg-gray-800"
                  data-testid="button-cart-clean"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-white text-black"
                      data-testid="badge-cart-count-clean"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </CartSheet>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden text-white hover:bg-gray-800"
                  data-testid="button-mobile-menu-clean"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white p-0 flex flex-col">
                <div className="flex-1 overflow-y-auto pt-24 pb-8 px-6">
                  <div className="flex flex-col space-y-6">
                    {/* Mobile Navigation */}
                    <nav className="flex flex-col space-y-6">
                      {navigationItems.map((item) => (
                        <Link 
                          key={item.label} 
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-black hover:text-gray-600 transition-colors duration-200 font-medium text-lg py-3"
                          data-testid={`nav-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile Account Links */}
                    {authData ? (
                      <Link 
                        href={
                          authData.role === 'admin' ? '/admin' : 
                          authData.role === 'vendor' ? '/vendor/dashboard' : 
                          authData.role === 'reseller' ? '/reseller/dashboard' : 
                          authData.role === 'athlete' ? '/athlete/dashboard' :
                          '/profile'
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          data-testid="button-mobile-account"
                        >
                          <User className="h-5 w-5 mr-2" />
                          My Account
                        </Button>
                      </Link>
                    ) : (
                      <Link 
                        href="/account"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          data-testid="button-mobile-login"
                        >
                          <User className="h-5 w-5 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
    {/* Spacer for fixed header - prevents content from being hidden behind header */}
    <div className="h-16 md:h-20" />
    </>
  );
}
