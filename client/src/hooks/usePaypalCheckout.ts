import { useState, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PayPalCheckoutOptions {
  amount: number;
  currency?: string;
  onSuccess: (orderId: string, captureData: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

interface PayPalSession {
  start: (options: { paymentFlow: string }, checkoutOptionsPromise: Promise<{ orderId: string }>) => Promise<void>;
}

export function usePaypalCheckout() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const paypalSessionRef = useRef<PayPalSession | null>(null);
  const optionsRef = useRef<PayPalCheckoutOptions | null>(null);

  const initializePayPal = useCallback(async (options: PayPalCheckoutOptions) => {
    optionsRef.current = options;
    
    if (isInitialized && paypalSessionRef.current) {
      return true;
    }

    setIsLoading(true);
    
    try {
      if (!(window as any).paypal) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/sdk/js/core.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
          document.body.appendChild(script);
        });
      }

      const setupResponse = await apiRequest("GET", "/api/paypal/setup");
      const setupData = await setupResponse.json();
      const clientToken = setupData.clientToken;

      if (!clientToken) {
        throw new Error("Failed to get PayPal client token");
      }

      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
        onApprove: async (data: any) => {
          setIsProcessing(true);
          try {
            const captureResponse = await apiRequest(
              "POST",
              `/api/paypal/order/${data.orderId}/capture`
            );
            const captureData = await captureResponse.json();

            if (captureData.status === "COMPLETED") {
              optionsRef.current?.onSuccess(data.orderId, captureData);
            } else {
              throw new Error("Payment not completed");
            }
          } catch (error: any) {
            console.error("PayPal capture error:", error);
            toast({
              title: "Payment Error",
              description: error.message || "Failed to complete PayPal payment",
              variant: "destructive",
            });
            optionsRef.current?.onError?.(error);
          } finally {
            setIsProcessing(false);
          }
        },
        onCancel: () => {
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the PayPal payment.",
          });
          optionsRef.current?.onCancel?.();
          setIsProcessing(false);
        },
        onError: (error: any) => {
          console.error("PayPal error:", error);
          toast({
            title: "PayPal Error",
            description: "An error occurred with PayPal. Please try again.",
            variant: "destructive",
          });
          optionsRef.current?.onError?.(error);
          setIsProcessing(false);
        },
      });

      paypalSessionRef.current = paypalCheckout;
      setIsInitialized(true);
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("PayPal init error:", error);
      toast({
        title: "PayPal Error",
        description: "Failed to initialize PayPal. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  }, [isInitialized, toast]);

  const startPayment = useCallback(async (amount: number, currency: string = "GBP") => {
    if (!paypalSessionRef.current) {
      toast({
        title: "PayPal Not Ready",
        description: "PayPal is still loading. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const checkoutOptionsPromise = (async () => {
        const response = await apiRequest("POST", "/api/paypal/order", {
          amount: amount.toFixed(2),
          currency,
          intent: "CAPTURE",
        });
        const output = await response.json();
        return { orderId: output.id };
      })();

      await paypalSessionRef.current.start(
        { paymentFlow: "auto" },
        checkoutOptionsPromise
      );
    } catch (error: any) {
      console.error("PayPal start error:", error);
      toast({
        title: "PayPal Error",
        description: error?.message || "Failed to start PayPal checkout",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    initializePayPal,
    startPayment,
    isLoading,
    isProcessing,
    isInitialized,
  };
}
