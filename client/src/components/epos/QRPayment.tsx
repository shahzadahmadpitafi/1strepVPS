import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, Check, X, RefreshCw, Smartphone, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

interface QRPaymentProps {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price?: number;
    size?: string;
    color?: string;
    sku?: string;
    isResellerProduct?: boolean;
    vendorProductId?: string;
  }>;
  totalAmount: number;
  customerEmail?: string;
  customerPhone?: string;
  customerFirstName?: string;
  customerLastName?: string;
  resellerId?: string;
  deliveryMethod?: string;
  deliveryAddress?: {
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  discount?: {
    amount: number;
    name: string;
  } | null;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

type PaymentStatus = 'idle' | 'generating' | 'waiting' | 'paid' | 'expired' | 'error';

export default function QRPayment({
  items,
  totalAmount,
  customerEmail,
  customerPhone,
  customerFirstName,
  customerLastName,
  resellerId,
  deliveryMethod,
  deliveryAddress,
  discount,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
}: QRPaymentProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Use refs for callbacks to avoid polling interval restarts on every render
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onPaymentErrorRef = useRef(onPaymentError);
  useEffect(() => { onPaymentSuccessRef.current = onPaymentSuccess; }, [onPaymentSuccess]);
  useEffect(() => { onPaymentErrorRef.current = onPaymentError; }, [onPaymentError]);

  const generateQRCode = useCallback(async () => {
    setStatus('generating');
    try {
      const response = await apiRequest("POST", "/api/square/create-qr-checkout", {
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
          sku: item.sku || undefined,
          isResellerProduct: item.isResellerProduct || false,
          vendorProductId: item.vendorProductId || undefined,
        })),
        totalAmount,
        customerEmail,
        customerPhone,
        customerFirstName,
        customerLastName,
        resellerId,
        channel: 'epos_qr',
        deliveryMethod: deliveryMethod || 'collection',
        deliveryAddress: deliveryMethod === 'delivery' && deliveryAddress ? deliveryAddress : null,
        discount: discount && discount.amount > 0 ? discount : undefined,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("QR checkout created:", { orderId: data.orderId, paymentLinkId: data.paymentLinkId, referenceId: data.referenceId });
      setCheckoutUrl(data.checkoutUrl);
      setQrSessionId(data.orderId || data.paymentLinkId);
      setPaymentLinkId(data.paymentLinkId || null);
      setReferenceId(data.referenceId || null);
      setExpiresAt(new Date(Date.now() + 30 * 60 * 1000));
      setStatus('waiting');

      toast({
        title: "QR Code Ready",
        description: "Customer can now scan to pay with Square",
      });
    } catch (error: any) {
      console.error("QR generation error:", error);
      setStatus('error');
      onPaymentErrorRef.current(error.message || "Failed to generate QR code");
    }
  }, [items, totalAmount, customerEmail, resellerId, deliveryMethod, deliveryAddress, discount, toast]);

  const prevTotalRef = useRef(totalAmount);
  useEffect(() => {
    if (prevTotalRef.current !== totalAmount && (status === 'waiting' || status === 'generating')) {
      prevTotalRef.current = totalAmount;
      setStatus('idle');
      setCheckoutUrl(null);
      setQrSessionId(null);
      setPaymentLinkId(null);
      setReferenceId(null);
      setExpiresAt(null);
    } else {
      prevTotalRef.current = totalAmount;
    }
  }, [totalAmount, status]);

  useEffect(() => {
    if (items.length > 0 && status === 'idle') {
      generateQRCode();
    }
  }, [items, status, generateQRCode]);

  // Stable polling effect - only depends on payment identifiers and status
  useEffect(() => {
    if (!qrSessionId || status !== 'waiting') return;

    let isActive = true;
    console.log("Starting QR payment polling for:", { qrSessionId, paymentLinkId, referenceId });

    const pollPayment = async () => {
      if (!isActive) return;
      try {
        const response = await fetch("/api/square/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            orderId: qrSessionId,
            checkoutId: paymentLinkId,
            referenceId: referenceId,
          }),
        });
        const data = await response.json();

        if (!isActive) return;

        if (data.success && (data.verified || data.paid) && 
            (data.status === 'COMPLETED' || data.status === 'completed')) {
          console.log("QR Payment confirmed!", data);
          setStatus('paid');
          toast({
            title: "Payment Successful",
            description: "Customer has completed payment via Square",
          });
          onPaymentSuccessRef.current(data.paymentId || data.orderId || qrSessionId);
          return;
        }
      } catch (error) {
        console.log("QR payment poll error (will retry):", error);
      }

      if (isActive) {
        setTimeout(pollPayment, 4000);
      }
    };

    // Start first poll after 3 seconds
    const initialTimeout = setTimeout(pollPayment, 3000);

    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
    };
  }, [qrSessionId, paymentLinkId, referenceId, status, toast]);

  useEffect(() => {
    if (!expiresAt || status !== 'waiting') return;

    const updateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setStatus('expired');
      }
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setStatus('idle');
    setCheckoutUrl(null);
    setQrSessionId(null);
    setExpiresAt(null);
    generateQRCode();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating QR code...</p>
          </div>
        )}

        {status === 'waiting' && checkoutUrl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG
                  value={checkoutUrl}
                  size={220}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="text-center space-y-2">
              <Badge variant="outline" className="text-lg px-4 py-1">
                {formatCurrency(totalAmount)}
              </Badge>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Expires in {formatTime(timeRemaining)}</span>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">Scan to Pay</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Customer opens camera app and scans this QR code to complete payment on their phone
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Waiting for payment...</span>
            </div>
          </div>
        )}

        {status === 'paid' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">Payment Successful</h3>
              <p className="text-muted-foreground">The customer has completed their payment</p>
            </div>
          </div>
        )}

        {status === 'expired' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">QR Code Expired</h3>
              <p className="text-muted-foreground">The payment link has expired</p>
            </div>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Generate New QR Code
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <X className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">Error</h3>
              <p className="text-muted-foreground">Failed to generate QR code</p>
            </div>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {status !== 'paid' && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
            data-testid="button-cancel-qr-payment"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
