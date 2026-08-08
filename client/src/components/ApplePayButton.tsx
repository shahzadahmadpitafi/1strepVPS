import { useEffect, useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ApplePayButtonProps {
  amount: number;
  currency?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export default function ApplePayButton({
  amount,
  currency = "GBP",
  onSuccess,
  onError,
  disabled,
}: ApplePayButtonProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const sdkLoadedRef = useRef(false);

  useEffect(() => {
    if (sdkLoadedRef.current) return;

    const initApplePay = async () => {
      try {
        if (typeof window === "undefined" || !(window as any).ApplePaySession) {
          setIsAvailable(false);
          setIsLoading(false);
          return;
        }

        const canMakePayments = (window as any).ApplePaySession.canMakePayments();
        if (!canMakePayments) {
          setIsAvailable(false);
          setIsLoading(false);
          return;
        }

        const configResponse = await fetch("/api/paypal/config");
        const configData = await configResponse.json();
        
        if (!configData.configured) {
          setIsAvailable(false);
          setIsLoading(false);
          return;
        }

        const setupResponse = await fetch("/api/paypal/setup");
        const { clientToken } = await setupResponse.json();

        if (!clientToken) {
          setIsAvailable(false);
          setIsLoading(false);
          return;
        }

        const clientIdResponse = await fetch("/api/paypal/client-id");
        const { clientId } = await clientIdResponse.json();

        if (!clientId) {
          setIsAvailable(false);
          setIsLoading(false);
          return;
        }

        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"][src*="applepay"]');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=applepay&currency=${currency}&buyer-country=GB`;
        script.setAttribute("data-client-token", clientToken);
        script.async = true;

        script.onload = async () => {
          try {
            const paypal = (window as any).paypal;
            if (!paypal || !paypal.Applepay) {
              setIsAvailable(false);
              setIsLoading(false);
              return;
            }

            const applePayConfig = await paypal.Applepay().config();
            
            if (!applePayConfig.isEligible) {
              setIsAvailable(false);
              setIsLoading(false);
              return;
            }

            sdkLoadedRef.current = true;
            setIsAvailable(true);
            setIsLoading(false);

            if (buttonContainerRef.current) {
              buttonContainerRef.current.innerHTML = "";
              
              const applePayButton = document.createElement("apple-pay-button");
              applePayButton.setAttribute("buttonstyle", "black");
              applePayButton.setAttribute("type", "plain");
              applePayButton.setAttribute("locale", "en-GB");
              applePayButton.style.cssText = "width: 100%; height: 44px; cursor: pointer;";

              applePayButton.addEventListener("click", async () => {
                if (disabled) return;
                
                setError(null);
                
                try {
                  const orderResponse = await fetch("/api/paypal/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount: amount.toFixed(2),
                      currency: currency,
                      intent: "CAPTURE",
                    }),
                  });
                  const orderData = await orderResponse.json();

                  if (!orderData.id) {
                    throw new Error("Failed to create order");
                  }

                  const paymentRequest = {
                    countryCode: applePayConfig.countryCode || "GB",
                    currencyCode: currency,
                    merchantCapabilities: applePayConfig.merchantCapabilities || ["supports3DS"],
                    supportedNetworks: applePayConfig.supportedNetworks || ["visa", "masterCard", "amex"],
                    total: {
                      label: "1stRep",
                      amount: amount.toFixed(2),
                      type: "final",
                    },
                  };

                  const session = new (window as any).ApplePaySession(4, paymentRequest);

                  session.onvalidatemerchant = async (event: any) => {
                    try {
                      const { merchantSession } = await paypal.Applepay().validateMerchant({
                        validationUrl: event.validationURL,
                      });
                      session.completeMerchantValidation(merchantSession);
                    } catch (e) {
                      console.error("Merchant validation failed:", e);
                      session.abort();
                      setError("Payment validation failed");
                      onError?.(e);
                    }
                  };

                  session.onpaymentauthorized = async (event: any) => {
                    try {
                      const result = await paypal.Applepay().confirmOrder({
                        orderId: orderData.id,
                        token: event.payment.token,
                        billingContact: event.payment.billingContact,
                      });

                      if (result.approveApplePayPayment) {
                        const captureResponse = await fetch(`/api/paypal/order/${orderData.id}/capture`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        });
                        const captureData = await captureResponse.json();

                        session.completePayment((window as any).ApplePaySession.STATUS_SUCCESS);
                        onSuccess?.({
                          method: "apple_pay",
                          paymentId: orderData.id,
                          status: captureData.status || "COMPLETED",
                          amount,
                          currency,
                        });
                      } else {
                        session.completePayment((window as any).ApplePaySession.STATUS_FAILURE);
                        setError("Payment not approved");
                        onError?.({ message: "Payment not approved" });
                      }
                    } catch (e) {
                      console.error("Payment authorization failed:", e);
                      session.completePayment((window as any).ApplePaySession.STATUS_FAILURE);
                      setError("Payment failed");
                      onError?.(e);
                    }
                  };

                  session.oncancel = () => {
                    setError(null);
                  };

                  session.begin();
                } catch (e: any) {
                  console.error("Apple Pay error:", e);
                  setError(e.message || "Apple Pay failed");
                  onError?.(e);
                }
              });

              buttonContainerRef.current.appendChild(applePayButton);
            }
          } catch (e) {
            console.error("Apple Pay config error:", e);
            setIsAvailable(false);
            setIsLoading(false);
          }
        };

        script.onerror = () => {
          setIsAvailable(false);
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (e) {
        console.error("Apple Pay init error:", e);
        setIsAvailable(false);
        setIsLoading(false);
      }
    };

    initApplePay();
  }, [amount, currency, disabled, onSuccess, onError]);

  if (isLoading) {
    return null;
  }

  if (!isAvailable) {
    return null;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div 
      ref={buttonContainerRef} 
      className="w-full"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}
    />
  );
}
