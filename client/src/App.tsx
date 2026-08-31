import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense, useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import WelcomePopup from "@/components/WelcomePopup";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Home from "@/pages/Home";
import ShopCleanMinimal from "@/pages/ShopCleanMinimal";
import ProductDetailPageClean from "@/pages/ProductDetailPageClean";
import TrainingPageClean from "@/pages/TrainingPageClean";
import YogaPageClean from "@/pages/YogaPageClean";
import StudioPageClean from "@/pages/StudioPageClean";
import AboutUs from "@/pages/AboutUs";
import Sustainability from "@/pages/Sustainability";
import Careers from "@/pages/Careers";
import Press from "@/pages/Press";
import StoreLocatorPage from "@/pages/StoreLocatorPage";
import AthleteProgram from "@/pages/AthleteProgram";
import AthleteDashboard from "@/pages/AthleteDashboard";
import AthleteOnboarding from "@/pages/AthleteOnboarding";
import Community from "@/pages/Community";
import Events from "@/pages/Events";
import Competitions from "@/pages/Competitions";
import CompetitionsHost from "@/pages/CompetitionsHost";
import CompetitionPricing from "@/pages/CompetitionPricing";
import CompetitionDetail from "@/pages/CompetitionDetail";
import CompetitionLeaderboard from "@/pages/CompetitionLeaderboard";
import MyCompetitions from "@/pages/MyCompetitions";
import OrganiserDashboard from "@/pages/OrganiserDashboard";
import AdminCompetitions from "@/pages/AdminCompetitions";
import Blog from "@/pages/Blog";
import OneRCollection from "@/pages/OneRCollection";
import NewInPageClean from "@/pages/NewInPageClean";
import ModestClothesPage from "@/pages/ModestClothesPage";
import ModestClothesPageClean from "@/pages/ModestClothesPageClean";
import IndoorTrainingPage from "@/pages/IndoorTrainingPage";
import OutdoorTrainingPage from "@/pages/OutdoorTrainingPage";
import Cart from "@/pages/Cart";
import Wishlist from "@/pages/Wishlist";
import Checkout from "@/pages/Checkout";
import CheckoutComplete from "@/pages/CheckoutComplete";
import PaymentConfirmed from "@/pages/PaymentConfirmed";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerProfile from "@/pages/CustomerProfile";
import CustomerOrders from "@/pages/CustomerOrders";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminInitialize from "@/pages/AdminInitialize";
import AdminLogin from "@/pages/AdminLogin";
import ResellerLogin from "@/pages/ResellerLogin";
import B2BLogin from "@/pages/B2BLogin";
import ResellerDashboard from "@/pages/ResellerDashboard";
import B2BDashboard from "@/pages/B2BDashboard";
import VendorDashboard from "@/pages/VendorDashboard";
import WholesalerDashboard from "@/pages/WholesalerDashboard";
import ResellerOrdering from "@/pages/ResellerOrdering";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminB2BAccess from "@/pages/AdminB2BAccess";
import AdminReports from "@/pages/AdminReports";
import AdminDocuments from "@/pages/AdminDocuments";
import AdminDocViewer from "@/pages/AdminDocViewer";
import AdminInfluencerCreditsContent from "@/pages/AdminInfluencerCredits";
import AdminMarketing from "@/pages/AdminMarketing";
import AdminCustomer360 from "@/pages/AdminCustomer360";
import AdminCommissionAnalytics from "@/pages/AdminCommissionAnalytics";
import AdminPartnerManagement from "@/pages/AdminPartnerManagement";
import AdminResellerAds from "@/pages/AdminResellerAds";
import AdminSmartNotifications from "@/pages/AdminSmartNotifications";
import StorefrontPage from "@/pages/StorefrontPage";
import SearchResults from "@/pages/SearchResults";
import EOPSTerminal from "@/pages/EOPSTerminal";
import CustomerEPOS from "@/pages/CustomerEPOS";
import VendorEPOS from "@/pages/VendorEPOS";
import ResellerEPOS from "@/pages/ResellerEPOS";
import ResellerStorefrontEPOS from "@/pages/ResellerStorefrontEPOS";
import SizeGuide from "@/pages/SizeGuide";
import ShippingReturns from "@/pages/ShippingReturns";
import OrderTracking from "@/pages/OrderTracking";
import OrderFeedback from "@/pages/OrderFeedback";
import ReturnRequest from "@/pages/ReturnRequest";
import AdminReturns from "@/pages/AdminReturns";
import AdminReviews from "@/pages/AdminReviews";
import ContactSupport from "@/pages/ContactSupport";
import FAQ from "@/pages/FAQ";
import CookiePolicy from "@/pages/CookiePolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import ReferralDashboard from "@/pages/ReferralDashboard";
import TicketPortal from "@/pages/TicketPortal";
import InfluencerLogin from "@/pages/InfluencerLogin";
import NotFound from "@/pages/not-found";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import MobileBottomNav from "@/components/MobileBottomNav";

// Lazy load non-critical components for better initial page load
const CookieConsent = lazy(() => import("@/components/CookieConsent").then(m => ({ default: m.CookieConsent })));
const ChatbotWidget = lazy(() => import("@/components/ChatbotWidget").then(m => ({ default: m.ChatbotWidget })));

// Deferred components wrapper - loads after initial render
function DeferredComponents() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setMounted(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    } else {
      const timeout = setTimeout(() => setMounted(true), 1000);
      return () => clearTimeout(timeout);
    }
  }, []);
  
  if (!mounted) return null;
  
  return (
    <Suspense fallback={null}>
      <CookieConsent />
      <ChatbotWidget />
    </Suspense>
  );
}

function AdminInfluencerCreditsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card px-6 py-4 flex items-center gap-3">
        <a href="/admin" className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to Admin
        </a>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminInfluencerCreditsContent />
      </div>
    </div>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/" component={Home}/>
      <Route path="/shop" component={ShopCleanMinimal}/>
      <Route path="/shop-clean" component={ShopCleanMinimal}/>
      <Route path="/product/:id" component={ProductDetailPageClean}/>
      <Route path="/training" component={TrainingPageClean}/>
      <Route path="/yoga" component={YogaPageClean}/>
      <Route path="/studio" component={StudioPageClean}/>
      <Route path="/about" component={AboutUs}/>
      <Route path="/sustainability" component={Sustainability}/>
      <Route path="/careers" component={Careers}/>
      <Route path="/press" component={Press}/>
      <Route path="/store-locator" component={StoreLocatorPage}/>
      <Route path="/athletes" component={AthleteProgram}/>
      <Route path="/athlete-program" component={AthleteProgram}/>
      <Route path="/athlete/dashboard" component={AthleteDashboard}/>
      <Route path="/athlete/onboarding" component={AthleteOnboarding}/>
      <Route path="/influencer-login" component={InfluencerLogin}/>
      <Route path="/community" component={Community}/>
      <Route path="/events" component={Events}/>
      <Route path="/blog" component={Blog}/>
      <Route path="/1r-collection" component={OneRCollection}/>
      <Route path="/new-in" component={NewInPageClean}/>
      <Route path="/modest-clothes" component={ModestClothesPageClean}/>
      <Route path="/indoor-training" component={IndoorTrainingPage}/>
      <Route path="/outdoor-training" component={OutdoorTrainingPage}/>
      <Route path="/cart" component={Cart}/>
      <Route path="/wishlist" component={Wishlist}/>
      <Route path="/checkout" component={Checkout}/>
      <Route path="/checkout/complete" component={CheckoutComplete}/>
      <Route path="/payment-confirmed" component={PaymentConfirmed}/>
      <Route path="/collections/men" component={ShopCleanMinimal}/>
      <Route path="/collections/women" component={ShopCleanMinimal}/>
      <Route path="/collections/accessories" component={ShopCleanMinimal}/>
      <Route path="/search" component={SearchResults}/>
      <Route path="/size-guide" component={SizeGuide}/>
      <Route path="/shipping-returns" component={ShippingReturns}/>
      <Route path="/order-tracking" component={OrderTracking}/>
      <Route path="/feedback" component={OrderFeedback}/>
      <Route path="/returns" component={ReturnRequest}/>
      <Route path="/contact-support" component={ContactSupport}/>
      <Route path="/faq" component={FAQ}/>
      <Route path="/cookie-policy" component={CookiePolicy}/>
      <Route path="/privacy-policy" component={PrivacyPolicy}/>
      <Route path="/profile" component={CustomerProfile}/>
      <Route path="/orders" component={CustomerOrders}/>
      <Route path="/account" component={CustomerLogin}/>
      <Route path="/login" component={CustomerLogin}/>
      <Route path="/register" component={CustomerLogin}/>
      <Route path="/forgot-password" component={ForgotPassword}/>
      <Route path="/reset-password" component={ResetPassword}/>
      <Route path="/referrals" component={ReferralDashboard}/>
      <Route path="/admin/initialize" component={AdminInitialize}/>
      <Route path="/admin-portal-secure" component={AdminLogin}/>
      <Route path="/reseller" component={ResellerLogin}/>
      <Route path="/reseller-login" component={B2BLogin}/>
      <Route path="/reseller/login" component={B2BLogin}/>
      <Route path="/vendor" component={ResellerLogin}/>
      <Route path="/vendor-login" component={B2BLogin}/>
      <Route path="/vendor/login" component={B2BLogin}/>
      <Route path="/b2b-login" component={B2BLogin}/>
      <Route path="/reseller-dashboard" component={ResellerDashboard}/>
      <Route path="/reseller/dashboard" component={ResellerDashboard}/>
      <Route path="/b2b-dashboard" component={B2BDashboard}/>
      <Route path="/vendor/dashboard" component={VendorDashboard}/>
      <Route path="/wholesaler/dashboard" component={WholesalerDashboard}/>
      <Route path="/wholesaler" component={WholesalerDashboard}/>
      <Route path="/reseller/b2b-dashboard" component={B2BDashboard}/>
      <Route path="/reseller/order" component={ResellerOrdering}/>
      <Route path="/reseller/epos" component={ResellerEPOS}/>
      <Route path="/vendor/epos" component={VendorEPOS}/>
      <Route path="/epos" component={EOPSTerminal}/>
      <Route path="/customer/epos" component={CustomerEPOS}/>
      <Route path="/store-checkout" component={CustomerEPOS}/>
      <Route path="/admin" component={AdminDashboard}/>
      <Route path="/admin/overview" component={AdminDashboard}/>
      <Route path="/admin/crm" component={AdminDashboard}/>
      <Route path="/admin/payouts" component={AdminDashboard}/>
      <Route path="/admin/orders" component={AdminDashboard}/>
      <Route path="/admin/resellers" component={AdminDashboard}/>
      <Route path="/admin/products" component={AdminDashboard}/>
      <Route path="/admin/categories" component={AdminDashboard}/>
      <Route path="/admin/sections" component={AdminDashboard}/>
      <Route path="/admin/activity-types" component={AdminDashboard}/>
      <Route path="/admin/coupons" component={AdminDashboard}/>
      <Route path="/admin/inventory" component={AdminDashboard}/>
      <Route path="/admin/warehouses" component={AdminDashboard}/>
      <Route path="/admin/inventory-manager" component={AdminDashboard}/>
      <Route path="/admin/image-manager" component={AdminDashboard}/>
      <Route path="/admin/support" component={AdminDashboard}/>
      <Route path="/admin/chatbot" component={AdminDashboard}/>
      <Route path="/admin/popup-messages" component={AdminDashboard}/>
      <Route path="/admin/team" component={AdminDashboard}/>
      <Route path="/admin/athletes" component={AdminDashboard}/>
      <Route path="/admin/athlete-profiles" component={AdminDashboard}/>
      <Route path="/admin/athlete-content" component={AdminDashboard}/>
      <Route path="/admin/events" component={AdminDashboard}/>
      <Route path="/admin/settings" component={AdminDashboard}/>
      <Route path="/admin/b2b-access" component={AdminB2BAccess}/>
      <Route path="/admin/license-requests" component={AdminDashboard}/>
      <Route path="/admin/wholesale-orders" component={AdminDashboard}/>
      <Route path="/admin/reports" component={AdminReports}/>
      <Route path="/admin/documents" component={AdminDocuments}/>
      <Route path="/admin/docs/:slug" component={AdminDocViewer}/>
      <Route path="/guides/:slug" component={AdminDocViewer}/>
      <Route path="/admin/influencer-credits" component={AdminInfluencerCreditsPage}/>
      <Route path="/admin/marketing" component={AdminMarketing}/>
      <Route path="/admin/commission-analytics" component={AdminCommissionAnalytics}/>
      <Route path="/admin/partner-management" component={AdminPartnerManagement}/>
      <Route path="/admin/reseller-ads" component={AdminResellerAds}/>
      <Route path="/admin/smart-notifications" component={AdminSmartNotifications}/>
      <Route path="/admin/smart-inventory" component={AdminDashboard}/>
      <Route path="/admin/product-performance" component={AdminDashboard}/>
      <Route path="/admin/warehouse-intelligence" component={AdminDashboard}/>
      <Route path="/admin/store-locations" component={AdminDashboard}/>
      <Route path="/admin/returns" component={AdminDashboard}/>
      <Route path="/admin/reviews" component={AdminReviews}/>
      <Route path="/admin/competitions" component={AdminCompetitions}/>
      <Route path="/admin/customers/:id" component={AdminCustomer360}/>
      <Route path="/competitions" component={Competitions}/>
      <Route path="/competitions/host" component={CompetitionsHost}/>
      <Route path="/competitions/pricing" component={CompetitionPricing}/>
      <Route path="/competitions/:slug/leaderboard/display" component={CompetitionLeaderboard}/>
      <Route path="/competitions/:slug/leaderboard" component={CompetitionLeaderboard}/>
      <Route path="/competitions/:slug" component={CompetitionDetail}/>
      <Route path="/my-competitions" component={MyCompetitions}/>
      <Route path="/organiser" component={OrganiserDashboard}/>
      <Route path="/store/:slug" component={StorefrontPage}/>
      <Route path="/store/:slug/epos" component={ResellerStorefrontEPOS}/>
      <Route path="/support/ticket/:token" component={TicketPortal}/>
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

// Component to conditionally render Footer
function ConditionalFooter() {
  const [location] = useLocation();
  
  // Hide footer on EPOS pages
  const isEposPage = location.includes('/epos') || 
                     location === '/store-checkout' ||
                     location.includes('/store/') && location.endsWith('/epos');
  
  if (isEposPage) {
    return null;
  }
  
  return <Footer />;
}

function RefTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    // Skip if already tracked by /api/track/:slug redirect (it adds tracked=1)
    const alreadyTracked = params.get("tracked") === "1";
    if (ref && !alreadyTracked) {
      fetch("/api/track-ref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: ref }),
      }).catch(() => {});
    }
  }, []);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WishlistProvider>
          <CartProvider>
            <RefTracker />
            <div className="flex flex-col min-h-screen">
              <div className="flex-1">
                <Router />
              </div>
              <ConditionalFooter />
            </div>
            <DeferredComponents />
            <MobileBottomNav />
            <Toaster />
            <WelcomePopup />
          </CartProvider>
        </WishlistProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
