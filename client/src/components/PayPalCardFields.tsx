import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertCircle, Shield, Lock } from "lucide-react";

interface OrderData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country?: string;
    phone?: string;
  };
  cartItems: any[];
  subtotal: number;
  shipping: number;
  total: number;
  coupon?: any;
  termsAcceptedAt?: string;
}

interface PayPalCardFieldsProps {
  amount: string;
  currency: string;
  intent: string;
  orderData?: OrderData;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export default function PayPalCardFields({
  amount,
  currency,
  intent,
  orderData,
  onSuccess,
  onError,
  disabled = false,
}: PayPalCardFieldsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayPalCardPayment = async () => {
    if (isProcessing || disabled) return;

    // Check if order data is provided
    if (!orderData) {
      setError("Please fill in your details before proceeding to payment.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      
      const paypalOrderPayload = {
        amount: amount,
        currency: currency,
        intent: intent.toUpperCase(),
        returnUrl: `${baseUrl}/checkout?paypal_success=true`,
        cancelUrl: `${baseUrl}/checkout?paypal_cancelled=true`,
      };

      const response = await fetch("/api/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paypalOrderPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment");
      }

      const paypalResponse = await response.json();
      console.log("PayPal order created:", paypalResponse);

      const approvalLink = paypalResponse.links?.find(
        (link: any) => link.rel === "payer-action" || link.rel === "approve"
      );

      if (approvalLink?.href) {
        // Save order data to sessionStorage BEFORE redirecting to PayPal
        const pendingOrder = {
          orderId: paypalResponse.id,
          customerInfo: orderData.customerInfo,
          cartItems: orderData.cartItems,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          total: orderData.total,
          coupon: orderData.coupon,
          termsAcceptedAt: orderData.termsAcceptedAt,
        };
        
        console.log("Saving pending order to sessionStorage:", pendingOrder);
        sessionStorage.setItem('pendingPayPalOrder', JSON.stringify(pendingOrder));
        
        // Redirect to PayPal
        window.location.href = approvalLink.href;
      } else {
        throw new Error("Unable to redirect to payment page");
      }
    } catch (e: any) {
      console.error("Payment error:", e);
      setError(e.message || "Payment failed. Please try again.");
      if (onError) {
        onError(e);
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Lock className="h-4 w-4" />
        <span>Pay securely with your debit or credit card</span>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">VISA</div>
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">MC</div>
            <div className="bg-blue-400 text-white text-xs font-bold px-2 py-1 rounded">AMEX</div>
          </div>
          <span className="text-sm text-muted-foreground">All major cards accepted</span>
        </div>
        
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            No PayPal account required
          </li>
          <li className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            Your card details stay secure with PayPal
          </li>
          <li className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            PayPal Buyer Protection included
          </li>
        </ul>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="button"
        className="w-full min-h-12 text-base font-semibold"
        onClick={handlePayPalCardPayment}
        disabled={isProcessing || disabled}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting to secure payment...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pay £{parseFloat(amount).toFixed(2)} with Card
          </span>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        You'll enter your card details on PayPal's secure payment page
      </p>
    </div>
  );
}
