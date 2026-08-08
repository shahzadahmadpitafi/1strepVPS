import { useEffect, useState, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Package, Mail, ArrowRight, Home, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function CheckoutComplete() {
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Prevent duplicate processing
  const processingRef = useRef(false);
  const processedRef = useRef(false);
  
  useEffect(() => {
    const processPaymentCompletion = async () => {
      // Prevent duplicate processing from React StrictMode or re-renders
      if (processingRef.current || processedRef.current) {
        return;
      }
      processingRef.current = true;
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const transactionId = urlParams.get('transactionId');
        const orderId = urlParams.get('orderId');
        const checkoutId = urlParams.get('checkoutId');
        
        // Check if order was already completed (stored after successful processing)
        const completedOrder = sessionStorage.getItem('completedSquareOrder');
        if (completedOrder) {
          const completed = JSON.parse(completedOrder);
          setOrderNumber(completed.orderNumber);
          setStatus('success');
          processingRef.current = false;
          processedRef.current = true;
          return;
        }
        
        const pendingOrderData = sessionStorage.getItem('pendingSquareOrder');
        
        let orderData: any;
        
        if (!pendingOrderData) {
          // ── Ghost-payment recovery ─────────────────────────────────────────
          // sessionStorage is empty — the browser may have crashed, the user
          // returned on a different device, or they used a private tab.
          // Try to recover the order data from the server using the Square
          // payment link ID that Square always appends to the redirect URL.
          if (checkoutId) {
            try {
              const recoveryResp = await fetch(`/api/square/recover-pending-checkout?paymentLinkId=${encodeURIComponent(checkoutId)}`);
              const recoveryData = await recoveryResp.json();
              if (recoveryData.alreadyCompleted) {
                setOrderNumber(recoveryData.orderNumber);
                setStatus('success');
                processingRef.current = false;
                processedRef.current = true;
                return;
              }
              if (recoveryData.found && recoveryData.orderData) {
                orderData = recoveryData.orderData;
              }
            } catch {
              // fall through to error state below
            }
          }
          if (!orderData) {
            setStatus('error');
            setErrorMessage('Order information not found. If you completed a payment, please contact support with your payment reference.');
            processingRef.current = false;
            return;
          }
        } else {
          orderData = JSON.parse(pendingOrderData);
        }
        
        const verifyResponse = await fetch('/api/square/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId,
            orderId: orderId || orderData.squareOrderId,
            checkoutId,
          }),
        });
        
        const verifyResult = await verifyResponse.json();
        
        if (!verifyResult.paid) {
          if (verifyResult.status === 'PENDING' || verifyResult.status === 'OPEN') {
            setStatus('loading');
            // Reset the processing lock so the retry can actually run
            processingRef.current = false;
            setTimeout(processPaymentCompletion, 3000);
            return;
          }
          if (!verifyResult.success) {
            setStatus('error');
            setErrorMessage(verifyResult.error || 'Payment verification failed');
            return;
          }
        }
        
        const createResponse = await apiRequest('POST', '/api/orders/create-confirmed', {
          ...orderData,
          squarePaymentId: transactionId || verifyResult.paymentId,
          squareOrderId: orderId || orderData.squareOrderId,
        });
        
        const createResult = await createResponse.json();
        
        if (createResult.success) {
          // Store completed order info before clearing pending data
          sessionStorage.setItem('completedSquareOrder', JSON.stringify({
            orderNumber: createResult.order.orderNumber,
            completedAt: new Date().toISOString(),
          }));
          sessionStorage.removeItem('pendingSquareOrder');
          clearCart();
          setOrderNumber(createResult.order.orderNumber);
          setStatus('success');
          processedRef.current = true;
          
          toast({
            title: 'Order Confirmed!',
            description: `Your order #${createResult.order.orderNumber} has been placed successfully.`,
          });
        } else {
          throw new Error(createResult.error || 'Failed to create order');
        }
      } catch (error: any) {
        console.error('Checkout completion error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An error occurred while processing your order');
      } finally {
        processingRef.current = false;
      }
    };
    
    processPaymentCompletion();
  }, []); // Empty dependency array - run once on mount only
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Processing Your Order</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment and create your order...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Something Went Wrong</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => setLocation('/checkout')}>
                Return to Checkout
              </Button>
              <Button variant="outline" onClick={() => setLocation('/contact-support')}>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Thank You for Your Order!</h1>
              <p className="text-muted-foreground">
                Your payment has been processed successfully.
              </p>
            </div>
            
            {orderNumber && (
              <div className="bg-muted rounded-lg p-4 inline-block">
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-2xl font-bold font-mono">{orderNumber}</p>
              </div>
            )}
            
            <div className="grid gap-4 text-left bg-card border rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Confirmation Email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation email with your order details.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Order Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Your order is being prepared. You'll receive a shipping notification soon.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={() => {
                sessionStorage.removeItem('completedSquareOrder');
                setLocation('/orders');
              }}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => {
                sessionStorage.removeItem('completedSquareOrder');
                setLocation('/');
              }}>
                <Home className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
