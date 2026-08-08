import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { SiVisa, SiMastercard, SiAmericanexpress, SiApplepay, SiGooglepay } from 'react-icons/si';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
  category?: string;
  storefrontSlug?: string | null;
  resellerId?: string | null;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderData {
  customerInfo: CustomerInfo;
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  coupon?: {
    id: string;
    code: string;
    discountAmount: number;
    shippingDiscountAmount?: number;
  };
  termsAcceptedAt?: string;
}

interface SquarePaymentProps {
  amount: number;
  currency?: string;
  customerEmail?: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  isFormValid: boolean;
  onFormInvalid: () => void;
  disabled?: boolean;
  orderData?: OrderData;
}

export default function SquarePayment({
  amount,
  currency = 'GBP',
  customerEmail,
  onPaymentSuccess,
  onPaymentError,
  isFormValid,
  onFormInvalid,
  disabled = false,
  orderData,
}: SquarePaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckoutRedirect = async () => {
    if (!isFormValid) {
      onFormInvalid();
      return;
    }

    if (!orderData) {
      onPaymentError('Order information is missing. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const lineItems = orderData.cartItems.map(item => ({
        name: `${item.name}${item.size ? ` - ${item.size}` : ''}${item.color ? ` - ${item.color}` : ''}`,
        quantity: item.quantity,
        basePriceMoney: {
          amount: Math.round(item.price * 100),
          currency,
        },
      }));

      if (orderData.shipping > 0) {
        lineItems.push({
          name: 'Shipping',
          quantity: 1,
          basePriceMoney: {
            amount: Math.round(orderData.shipping * 100),
            currency,
          },
        });
      }

      // Calculate total discount including both product and shipping discounts
      const totalDiscount = (orderData.coupon?.discountAmount || 0) + (orderData.coupon?.shippingDiscountAmount || 0);

      const response = await fetch('/api/square/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          customerEmail,
          lineItems,
          redirectUrl: `${window.location.origin}/checkout/complete`,
          discount: totalDiscount > 0 ? {
            name: orderData.coupon?.code ? `Promo: ${orderData.coupon.code}` : 'Discount',
            amount: totalDiscount,
          } : undefined,
          // ── Ghost-payment prevention ───────────────────────────────────────
          // Full order data saved server-side so it can be recovered if the
          // browser crashes or the user pays from a different device/tab.
          customerInfo: orderData.customerInfo,
          cartItems: orderData.cartItems,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          total: orderData.total,
          coupon: orderData.coupon,
          termsAcceptedAt: orderData.termsAcceptedAt,
        }),
      });

      const result = await response.json();
      
      if (result.checkoutUrl) {
        sessionStorage.setItem('pendingSquareOrder', JSON.stringify({
          ...orderData,
          paymentMethod: 'square',
          squareOrderId: result.orderId,
          squareCheckoutId: result.paymentLinkId,
        }));
        
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      onPaymentError(err.message || 'Failed to start checkout');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Secure Card Payment</h3>
            <p className="text-sm text-muted-foreground">
              Complete your payment securely with Square
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4 px-1">
          <SiVisa className="w-8 h-5 text-[#1a1f71]" />
          <SiMastercard className="w-8 h-5 text-[#eb001b]" />
          <SiAmericanexpress className="w-8 h-5 text-[#006fcf]" />
          <SiApplepay className="w-8 h-5" />
          <SiGooglepay className="w-8 h-5" />
        </div>
        
        <Button
          onClick={handleCheckoutRedirect}
          disabled={isProcessing || disabled}
          size="lg"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Connecting to Square...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay £{amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        Payments securely processed by Square
      </p>
    </div>
  );
}
