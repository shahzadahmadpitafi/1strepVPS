import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, User, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { Link, useLocation } from "wouter";
import CartSheet from "./CartSheet";

// Wrapper component for Link that closes mobile menu
function NavLink({ href, children, onClick, className, "data-testid": testId }: { 
  href: string; 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <Link href={href} onClick={onClick} className={className} data-testid={testId}>
      {children}
    </Link>
  );
}

interface UserData {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function Header() {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);
  
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const navigationItems = [
    { label: "Men", href: "/collections/men" },
    { label: "Women", href: "/collections/women" },
    { label: "Accessories", href: "/collections/accessories" }
  ];

  return (
    <>
      {/* Announcement Banner with Scrolling Animation */}
      {banner?.isVisible && banner?.message && (
        <Link href="/shop">
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
      
      <header className="sticky top-0 z-50 bg-black border-b border-gray-800">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="cursor-pointer hover:opacity-80 transition-opacity duration-200 flex items-center"
              data-testid="link-home-logo"
            >
              <img 
                src="/1strep-header-logo.png" 
                alt="1stRep" 
                className="h-12 md:h-14 w-auto object-contain"
                data-testid="logo-image"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link 
                key={item.label} 
                href={item.href}
                className="text-white hover:text-gray-300 transition-colors duration-200 font-medium min-h-11 flex items-center"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                type="search" 
                placeholder="Search products..."
                className="pl-11 min-h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </form>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* User Account */}
            {authData ? (
              <Link href={
                authData.role === 'admin' ? '/admin' : 
                authData.role === 'vendor' ? '/vendor/dashboard' : 
                authData.role === 'reseller' ? '/reseller/dashboard' : 
                '/profile'
              }>
                <Button 
                  variant="ghost" 
                  className="hidden md:flex items-center gap-2 min-h-11 text-white hover:bg-gray-800"
                  data-testid="button-account-logged-in"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium" data-testid="text-header-user-name">
                      {authData.firstName && authData.lastName 
                        ? `${authData.firstName} ${authData.lastName}` 
                        : authData.username || authData.email.split('@')[0]}
                    </p>
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden min-h-11 min-w-11 text-white hover:bg-gray-800"
                  data-testid="button-account-mobile"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/account">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="min-h-11 min-w-11 text-white hover:bg-gray-800"
                  data-testid="button-account"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Shopping Cart */}
            <CartSheet>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative min-h-11 min-w-11 text-white hover:bg-gray-800"
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-white text-black"
                    data-testid="badge-cart-count"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </CartSheet>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden min-h-11 min-w-11 text-white hover:bg-gray-800"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm">
                <div className="flex flex-col space-y-8 pt-8">
                  {/* Mobile Search */}
                  <form onSubmit={(e) => { handleSearch(e); closeMobileMenu(); }} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search products..."
                      className="pl-11 min-h-11 text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-mobile"
                    />
                  </form>

                  {/* Mobile Navigation */}
                  <nav className="flex flex-col space-y-2">
                    {navigationItems.map((item) => (
                      <NavLink 
                        key={item.label} 
                        href={item.href}
                        onClick={closeMobileMenu}
                        className="text-xl font-semibold text-foreground hover:text-muted-foreground transition-colors py-3 px-2 rounded-md hover-elevate min-h-11 flex items-center"
                        data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>

                  {/* Mobile User Actions */}
                  {authData && (
                    <div className="pt-6 border-t border-border">
                      <NavLink 
                        href={
                          authData.role === 'admin' ? '/admin' : 
                          authData.role === 'vendor' ? '/vendor/dashboard' : 
                          authData.role === 'reseller' ? '/reseller/dashboard' : 
                          '/profile'
                        }
                        onClick={closeMobileMenu}
                      >
                        <Button 
                          variant="outline" 
                          className="w-full min-h-11 justify-start gap-3 text-base"
                          data-testid="button-profile-mobile"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span>
                            {authData.firstName && authData.lastName 
                              ? `${authData.firstName} ${authData.lastName}` 
                              : authData.username || authData.email.split('@')[0]}
                          </span>
                        </Button>
                      </NavLink>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}