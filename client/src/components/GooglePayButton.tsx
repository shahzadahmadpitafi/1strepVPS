import { useEffect, useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GooglePayButtonProps {
  amount: number;
  currency?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export default function GooglePayButton({
  amount,
  currency = "GBP",
  onSuccess,
  onError,
  disabled,
}: GooglePayButtonProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const sdkLoadedRef = useRef(false);

  useEffect(() => {
    if (sdkLoadedRef.current) return;

    const initGooglePay = async () => {
      try {
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

        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"][src*="googlepay"]');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=googlepay&currency=${currency}&buyer-country=GB`;
        script.setAttribute("data-client-token", clientToken);
        script.async = true;

        script.onload = async () => {
          try {
            const paypal = (window as any).paypal;
            if (!paypal || !paypal.Googlepay) {
              setIsAvailable(false);
              setIsLoading(false);
              return;
            }

            const googlePayConfig = await paypal.Googlepay().config();
            
            if (!googlePayConfig.isEligible) {
              setIsAvailable(false);
              setIsLoading(false);
              return;
            }

            sdkLoadedRef.current = true;
            setIsAvailable(true);
            setIsLoading(false);

            if (buttonContainerRef.current) {
              buttonContainerRef.current.innerHTML = "";
              
              const googlePayButton = await paypal.Googlepay().renderButton(buttonContainerRef.current, {
                buttonColor: "default",
                buttonType: "pay",
                buttonLocale: "en",
                buttonSizeMode: "fill",
                onClick: async () => {
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

                    const paymentDataRequest = await paypal.Googlepay().createPaymentDataRequest({
                      merchantInfo: {
                        merchantName: "1stRep",
                      },
                      transactionInfo: {
                        totalPriceStatus: "FINAL",
                        totalPriceLabel: "Total",
                        totalPrice: amount.toFixed(2),
                        currencyCode: currency,
                        countryCode: "GB",
                      },
                      callbackIntents: ["PAYMENT_AUTHORIZATION"],
                    });

                    const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
                      environment: import.meta.env.PROD ? "PRODUCTION" : "TEST",
                      paymentDataCallbacks: {
                        onPaymentAuthorized: async (paymentData: any) => {
                          try {
                            const result = await paypal.Googlepay().confirmOrder({
                              orderId: orderData.id,
                              paymentMethodData: paymentData.paymentMethodData,
                            });

                            if (result.status === "APPROVED") {
                              const captureResponse = await fetch(`/api/paypal/order/${orderData.id}/capture`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                              });
                              const captureData = await captureResponse.json();

                              onSuccess?.({
                                method: "google_pay",
                                paymentId: orderData.id,
                                status: captureData.status || "COMPLETED",
                                amount,
                                currency,
                              });

                              return { transactionState: "SUCCESS" };
                            } else {
                              setError("Payment not approved");
                              onError?.({ message: "Payment not approved" });
                              return { transactionState: "ERROR", error: { reason: "PAYMENT_DATA_INVALID" } };
                            }
                          } catch (e) {
                            console.error("Payment confirmation failed:", e);
                            setError("Payment failed");
                            onError?.(e);
                            return { transactionState: "ERROR", error: { reason: "PAYMENT_DATA_INVALID" } };
                          }
                        },
                      },
                    });

                    await paymentsClient.loadPaymentData(paymentDataRequest);
                  } catch (e: any) {
                    if (e.statusCode === "CANCELED") {
                      setError(null);
                    } else {
                      console.error("Google Pay error:", e);
                      setError(e.message || "Google Pay failed");
                      onError?.(e);
                    }
                  }
                },
              });
            }
          } catch (e) {
            console.error("Google Pay config error:", e);
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
        console.error("Google Pay init error:", e);
        setIsAvailable(false);
        setIsLoading(false);
      }
    };

    initGooglePay();
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
      style={{ 
        opacity: disabled ? 0.5 : 1, 
        pointerEvents: disabled ? "none" : "auto",
        minHeight: "44px"
      }}
    />
  );
}
