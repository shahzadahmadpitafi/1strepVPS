import { Home, ShoppingBag, Heart, User, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Badge } from '@/components/ui/badge';

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();

  // Hide on admin, reseller, vendor, epos, and b2b routes
  const hiddenRoutes = ['/admin', '/reseller', '/vendor', '/epos', '/b2b', '/store-checkout'];
  const shouldHide = hiddenRoutes.some(route => location.startsWith(route));
  
  if (shouldHide) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: ShoppingBag, label: 'Shop', href: '/shop-clean' },
    { icon: Heart, label: 'Wishlist', href: '/wishlist', badge: wishlistCount },
    { icon: User, label: 'Account', href: '/account' },
    { icon: ShoppingCart, label: 'Cart', href: '/cart', badge: totalItems },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    if (href === '/shop-clean') return location.startsWith('/shop') || location.startsWith('/training') || location.startsWith('/product');
    return location.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-slate-900 border-t border-border shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div className="relative">
                <Icon 
                  className={`h-5 w-5 transition-colors ${
                    active 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`} 
                />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span 
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  active 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
