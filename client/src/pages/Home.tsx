import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import HomeTacticalDark from "./HomeTacticalDark";
import HomeModernLight from "./HomeModernLight";
import HomeDynamicGradient from "./HomeDynamicGradient";
import HomeCleanMinimal from "./HomeCleanMinimal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Mail, Truck, Phone, Copy, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SiteSettings {
  activeTheme: "tactical_dark" | "modern_light" | "dynamic_gradient" | "clean_minimal";
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      toast({
        title: "Order number copied!",
        description: orderNumber,
      });
    }
  };

  // Check for payment success in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const orderNum = params.get('order');

    if (paymentStatus === 'success') {
      setShowPaymentSuccess(true);
      setOrderNumber(orderNum);
      // Clear URL params without reload
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleCloseSuccess = () => {
    setShowPaymentSuccess(false);
    setOrderNumber(null);
  };

  const handleViewOrders = () => {
    setShowPaymentSuccess(false);
    setLocation('/customer/orders');
  };

  // Show loading state while fetching theme
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render the appropriate theme component - Clean Minimal is the permanent default
  const activeTheme = settings?.activeTheme || "clean_minimal";

  const renderTheme = () => {
    switch (activeTheme) {
      case "modern_light":
        return <HomeModernLight />;
      case "dynamic_gradient":
        return <HomeDynamicGradient />;
      case "tactical_dark":
        return <HomeTacticalDark />;
      case "clean_minimal":
      default:
        return <HomeCleanMinimal />;
    }
  };

  return (
    <>
      {renderTheme()}
      
      {/* Payment Success Dialog */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby="payment-success-description">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <PartyPopper className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              Order Placed Successfully!
            </DialogTitle>
            <DialogDescription id="payment-success-description" className="text-center pt-2">
              Thank you for shopping with 1stRep! Your order has been confirmed.
            </DialogDescription>
          </DialogHeader>
          
          {/* Order Number with Copy Button */}
          {orderNumber && (
            <div className="mt-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Order Number</p>
                  <p className="text-lg font-bold text-primary" data-testid="text-order-number">{orderNumber}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={copyOrderNumber}
                  className="h-8 w-8"
                  data-testid="button-copy-order"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Payment Confirmed</p>
                <p className="text-muted-foreground">
                  Your payment has been processed successfully.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Confirmation Email Sent</p>
                <p className="text-muted-foreground">
                  We've sent a receipt and order details to your email address.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Truck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Estimated Delivery: 3-5 Working Days</p>
                <p className="text-muted-foreground">
                  We'll send you tracking information once your order ships.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Need Help?</p>
                <p className="text-muted-foreground">
                  Our customer support team is ready to assist you with any questions.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleViewOrders} className="w-full" data-testid="button-view-orders">
              <Package className="w-4 h-4 mr-2" />
              View My Orders
            </Button>
            <Button variant="outline" onClick={handleCloseSuccess} className="w-full" data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
