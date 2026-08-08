import { useState, useEffect, useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertTriangle } from "lucide-react";
import { SiPaypal, SiApplepay, SiGooglepay } from "react-icons/si";
import ApplePayButton from "./ApplePayButton";
import GooglePayButton from "./GooglePayButton";

interface PaymentProviderProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentDetails: PaymentResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  buttonText?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  method: "stripe" | "paypal";
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
}

let stripePromise: Promise<Stripe | null> | null = null;

async function getStripePromise() {
  if (!stripePromise) {
    try {
      const response = await fetch("/api/stripe/config");
      const { publishableKey } = await response.json();
      if (publishableKey) {
        stripePromise = loadStripe(publishableKey);
      }
    } catch (error) {
      console.error("Failed to load Stripe config:", error);
    }
  }
  return stripePromise;
}

function StripePaymentForm({
  amount,
  currency,
  onSuccess,
  onError,
  onStripeFailed,
  disabled,
  buttonText,
}: PaymentProviderProps & { onStripeFailed: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onStripeFailed();
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError) {
        if (pmError.type === "api_connection_error" || pmError.type === "api_error") {
          onStripeFailed();
          return;
        }
        throw new Error(pmError.message);
      }

      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "payment", quantity: 1, price: amount }],
          currency: currency || "gbp",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status >= 500) {
          onStripeFailed();
          return;
        }
        throw new Error(errorData.error || "Payment failed");
      }

      const { clientSecret, paymentIntentId } = await response.json();

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

      if (confirmError) {
        if (confirmError.type === "api_connection_error" || confirmError.type === "api_error") {
          onStripeFailed();
          return;
        }
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess({
          method: "stripe",
          paymentId: paymentIntentId,
          status: "succeeded",
          amount,
          currency: currency || "gbp",
        });
      }
    } catch (error: any) {
      setCardError(error.message || "Payment failed");
      onError?.(error.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-background">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#ffffff",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      {cardError && (
        <Alert variant="destructive">
          <AlertDescription>{cardError}</AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || processing || disabled}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {buttonText || `Pay £${amount.toFixed(2)}`}
          </>
        )}
      </Button>
    </form>
  );
}

function PayPalPaymentButton({
  amount,
  currency,
  onSuccess,
  onError,
  disabled,
  buttonText,
}: PaymentProviderProps) {
  const [processing, setProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/sdk/js/core.js";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
        setPaypalError("Failed to load PayPal");
      }
    };

    const initPayPal = async () => {
      try {
        const clientToken: string = await fetch("/paypal/setup")
          .then((res) => res.json())
          .then((data) => data.clientToken);

        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove: async (data: any) => {
            try {
              const response = await fetch(`/paypal/order/${data.orderId}/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });
              const orderData = await response.json();
              
              onSuccess({
                method: "paypal",
                paymentId: data.orderId,
                status: orderData.status || "COMPLETED",
                amount,
                currency: currency || "GBP",
              });
            } catch (error: any) {
              setPaypalError(error.message || "Payment capture failed");
              onError?.(error.message || "Payment capture failed");
            }
            setProcessing(false);
          },
          onCancel: () => {
            setProcessing(false);
            setPaypalError("Payment cancelled");
          },
          onError: (error: any) => {
            setProcessing(false);
            setPaypalError(error?.message || "PayPal error occurred");
            onError?.(error?.message || "PayPal error occurred");
          },
        });

        const paypalButton = document.getElementById("paypal-pay-button");
        if (paypalButton) {
          paypalButton.onclick = async () => {
            setProcessing(true);
            setPaypalError(null);
            try {
              const checkoutOptionsPromise = (async () => {
                const orderPayload = {
                  amount: amount.toFixed(2),
                  currency: currency || "GBP",
                  intent: "CAPTURE",
                };
                const response = await fetch("/paypal/order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(orderPayload),
                });
                const output = await response.json();
                return { orderId: output.id };
              })();

              await paypalCheckout.start(
                { paymentFlow: "auto" },
                checkoutOptionsPromise
              );
            } catch (e: any) {
              setProcessing(false);
              setPaypalError(e?.message || "Failed to start PayPal checkout");
            }
          };
        }

        setInitialized(true);
      } catch (e: any) {
        console.error("PayPal init error:", e);
        setPaypalError("Failed to initialize PayPal");
      }
    };

    loadPayPalSDK();
  }, [amount, currency, onSuccess, onError]);

  if (paypalError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{paypalError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Button
      id="paypal-pay-button"
      className="w-full bg-[#0070ba] hover:bg-[#003087] text-white"
      size="lg"
      disabled={!initialized || processing || disabled}
    >
      {processing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <SiPaypal className="mr-2 h-4 w-4" />
          {buttonText || `Pay £${amount.toFixed(2)} with PayPal`}
        </>
      )}
    </Button>
  );
}

export default function PaymentProvider({
  amount,
  currency = "gbp",
  onSuccess,
  onError,
  disabled,
  buttonText,
}: PaymentProviderProps) {
  const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null);
  const [paypalAvailable, setPaypalAvailable] = useState<boolean | null>(null);
  const [stripeFailed, setStripeFailed] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [activeMethod, setActiveMethod] = useState<"stripe" | "paypal">("stripe");

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const stripe = await getStripePromise();
        setStripeInstance(stripe);
        setStripeAvailable(!!stripe);
      } catch {
        setStripeAvailable(false);
      }

      try {
        const response = await fetch("/api/paypal/config");
        const { configured } = await response.json();
        setPaypalAvailable(configured);
      } catch {
        setPaypalAvailable(false);
      }
    };

    checkAvailability();
  }, []);

  const handleStripeFailed = useCallback(() => {
    setStripeFailed(true);
    if (paypalAvailable) {
      setActiveMethod("paypal");
    }
  }, [paypalAvailable]);

  if (stripeAvailable === null || paypalAvailable === null) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading payment options...
      </Card>
    );
  }

  const showMethodSelector = stripeAvailable && paypalAvailable && !stripeFailed;

  return (
    <div className="space-y-4">
      {stripeFailed && paypalAvailable && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Card payment is temporarily unavailable. Please use PayPal instead.
          </AlertDescription>
        </Alert>
      )}

      {showMethodSelector && (
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={activeMethod === "stripe" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setActiveMethod("stripe")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Card
          </Button>
          <Button
            type="button"
            variant={activeMethod === "paypal" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setActiveMethod("paypal")}
          >
            <SiPaypal className="mr-2 h-4 w-4" />
            PayPal
          </Button>
        </div>
      )}

      {activeMethod === "stripe" && stripeAvailable && !stripeFailed && stripeInstance && (
        <Elements stripe={stripeInstance}>
          <StripePaymentForm
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onError={onError}
            onStripeFailed={handleStripeFailed}
            disabled={disabled}
            buttonText={buttonText}
          />
        </Elements>
      )}

      {(activeMethod === "paypal" || (stripeFailed && paypalAvailable)) && paypalAvailable && (
        <PayPalPaymentButton
          amount={amount}
          currency={currency}
          onSuccess={onSuccess}
          onError={onError}
          disabled={disabled}
          buttonText={buttonText}
        />
      )}

      {paypalAvailable && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or pay with</span>
            </div>
          </div>

          <div className="space-y-3">
            <ApplePayButton
              amount={amount}
              currency={currency.toUpperCase()}
              onSuccess={onSuccess}
              onError={onError}
              disabled={disabled}
            />
            <GooglePayButton
              amount={amount}
              currency={currency.toUpperCase()}
              onSuccess={onSuccess}
              onError={onError}
              disabled={disabled}
            />
          </div>
        </>
      )}

      {!stripeAvailable && !paypalAvailable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No payment methods are currently available. Please contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
