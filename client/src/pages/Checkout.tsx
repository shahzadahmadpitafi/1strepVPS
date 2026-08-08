import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Lock, ShoppingBag, Truck, Tag, X, Check, Shield, RotateCcw, Package, AlertCircle, Loader2, MapPin, Store, ArrowLeft, Gift, Home, Camera, Smartphone } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import PayPalCardFields from "@/components/PayPalCardFields";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { convertToDirectUrl } from "@/lib/imageUtils";
import SquarePayment from "@/components/SquarePayment";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

type StoreLocation = {
  id: string;
  businessName: string;
  contactPerson: string;
  businessAddress: string;
  phoneNumber: string;
  tier: string;
  storefrontSlug: string | null;
};

// Validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

const validateAddress = (address: string): boolean => {
  return address.trim().length >= 5;
};

const validateCity = (city: string): boolean => {
  return city.trim().length >= 2;
};

const validatePostalCode = (postalCode: string): boolean => {
  // UK postal code validation (flexible pattern)
  const ukPostalRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return ukPostalRegex.test(postalCode.trim()) || postalCode.trim().length >= 3;
};

const validatePhone = (phone: string): boolean => {
  // UK phone validation (accepts mobiles and landlines)
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Matches UK numbers: mobiles (07xxx), landlines (01xxx, 02xxx, 03xxx)
  // With or without country code (+44, 0044)
  const ukPhoneRegex = /^(\+44|0044)?0?[1-37]\d{8,9}$/;
  return ukPhoneRegex.test(cleaned);
};

type CouponValidation = {
  valid: boolean;
  coupon?: any;
  error?: string;
  discountAmount?: number;
  shippingDiscountAmount?: number;
};

export default function Checkout() {
  const { cartItems, total, subtotal, shipping, clearCart, freeShippingEnabled, freeShippingThreshold } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Delivery method: "delivery" or "collection"
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "collection">("delivery");
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  
  // Referral code state
  const [referralCode, setReferralCode] = useState("");
  const [appliedReferral, setAppliedReferral] = useState<{
    valid: boolean;
    referralId?: string;
    discountType?: string;
    discountValue?: number;
    minPurchaseAmount?: number;
    discountAmount?: number;
  } | null>(null);
  
  // Payment method selection - "square" (card + Apple Pay + Google Pay), "paypal", "klarna", "clearpay"
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"square" | "paypal" | "klarna" | "clearpay">("square");
  
  // Terms and conditions acceptance (auto-accepted at checkout)
  const [termsAccepted, setTermsAccepted] = useState(true);
  
  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "UK"
  });
  
  // Postal code lookup state
  const [isLookingUpPostcode, setIsLookingUpPostcode] = useState(false);
  
  // Track which fields have been touched (for showing errors)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Mark a field as touched when user leaves it
  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };
  
  // Lookup postal code to get city
  const lookupPostalCode = async (postalCode: string) => {
    const cleaned = postalCode.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!validatePostalCode(cleaned)) return;
    
    setIsLookingUpPostcode(true);
    try {
      // Use our server proxy to avoid CORS issues
      const response = await fetch(`/api/postcode-lookup/${encodeURIComponent(cleaned.replace(/\s/g, ''))}`);
      
      if (!response.ok) {
        console.error('Postal code lookup HTTP error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        const result = data.result;
        
        // Determine the best city value - prefer bua (Built-up Area), then admin_district, then admin_county
        // bua is the "built-up area" which gives the actual town name (e.g., "Glossop" instead of "High Peak")
        const builtUpArea = result.bua || '';
        const adminDistrict = result.admin_district || '';
        const adminCounty = result.admin_county || '';
        const region = result.region || '';
        
        // For UK postal addresses, bua gives the actual town name users expect
        // admin_district is the local government district which may differ from the postal town
        
        // Priority order for city:
        // 1. bua - Built-up Area (e.g., "Glossop", "Manchester", "Birmingham")
        // 2. admin_district (e.g., "High Peak", "Manchester", "Birmingham")
        // 3. admin_county (e.g., "Derbyshire", "Greater Manchester")  
        // 4. region (e.g., "East Midlands")
        const city = builtUpArea || adminDistrict || adminCounty || region || '';
        
        if (city) {
          setCustomerInfo(prev => ({ ...prev, city }));
        }
      }
    } catch (error: any) {
      console.error('Postal code lookup failed:', error?.message || error);
      // Silently fail - user can still manually enter their address
    } finally {
      setIsLookingUpPostcode(false);
    }
  };
  
  // Handle postal code change
  const handlePostalCodeChange = (value: string) => {
    setCustomerInfo(prev => ({ ...prev, postalCode: value }));
  };
  
  // Handle postal code blur - trigger lookup
  const handlePostalCodeBlur = () => {
    handleBlur('postalCode');
    if (customerInfo.postalCode.trim().length >= 5) {
      lookupPostalCode(customerInfo.postalCode);
    }
  };
  
  // Validation errors computed from current state
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (!validateName(customerInfo.firstName)) {
      errors.firstName = "First name must be at least 2 characters";
    }
    if (!validateName(customerInfo.lastName)) {
      errors.lastName = "Last name must be at least 2 characters";
    }
    if (!validateEmail(customerInfo.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!validatePhone(customerInfo.phone)) {
      errors.phone = "Please enter a valid UK phone number";
    }
    if (!validateAddress(customerInfo.address)) {
      errors.address = "Please enter your full address";
    }
    if (!validateCity(customerInfo.city)) {
      errors.city = "Please enter your city";
    }
    if (!validatePostalCode(customerInfo.postalCode)) {
      errors.postalCode = "Please enter a valid postal code";
    }
    
    return errors;
  }, [customerInfo]);
  
  // Check if form is valid (no errors)
  const isFormValid = Object.keys(validationErrors).length === 0;

  // Get logged-in user data to auto-fill customer info
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Fetch stores for in-store collection
  const { data: storeLocations = [] } = useQuery<StoreLocation[]>({
    queryKey: ['/api/store-locator/resellers'],
  });

  // Fetch site settings for in-store collection and radius settings
  const { data: siteSettings } = useQuery<{
    inStoreCollectionEnabled?: boolean;
    freeShippingRadiusMiles?: string;
    freeShippingPostcode?: string;
  }>({
    queryKey: ['/api/site-settings'],
  });

  // Auto-fill customer info when user data loads
  useEffect(() => {
    if (userData && typeof userData === 'object' && 'user' in userData) {
      const user = userData.user as any;
      setCustomerInfo(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
      }));
    }
  }, [userData]);

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: ""
  });

  // Coupon validation mutation
  const validateCouponMutation = useMutation({
    mutationFn: (code: string) =>
      apiRequest("POST", "/api/coupons/validate", {
        code,
        subtotal,
        cartItems: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
      }),
    onSuccess: (response: any) => {
      response.json().then((data: CouponValidation) => {
        if (data.valid) {
          setAppliedCoupon(data);
          toast({
            title: "Coupon applied!",
            description: `Coupon "${couponCode}" has been applied to your order.`,
          });
        } else {
          toast({
            title: "Invalid coupon",
            description: data.error || "This coupon code is not valid.",
            variant: "destructive",
          });
        }
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to validate coupon. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter coupon code",
        description: "Please enter a coupon code to apply.",
        variant: "destructive",
      });
      return;
    }
    validateCouponMutation.mutate(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order.",
    });
  };

  // Referral code validation mutation
  const validateReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("GET", `/api/referrals/validate/${code}`);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.valid) {
        let discountAmount = 0;
        if (data.discountType === 'percentage') {
          discountAmount = subtotal * (data.discountValue / 100);
        } else {
          discountAmount = data.discountValue;
        }
        
        if (subtotal < (data.minPurchaseAmount || 0)) {
          toast({
            title: "Minimum not met",
            description: `Referral discount requires a minimum order of £${data.minPurchaseAmount}`,
            variant: "destructive",
          });
          return;
        }
        
        setAppliedReferral({
          valid: true,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minPurchaseAmount: data.minPurchaseAmount,
          discountAmount,
        });
        toast({
          title: "Referral code applied!",
          description: `You'll receive ${data.discountType === 'percentage' ? `${data.discountValue}%` : `£${data.discountValue}`} off your order.`,
        });
      } else {
        toast({
          title: "Invalid referral code",
          description: "This referral code is not valid.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to validate referral code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyReferral = () => {
    if (!referralCode.trim()) {
      toast({
        title: "Enter referral code",
        description: "Please enter a referral code to apply.",
        variant: "destructive",
      });
      return;
    }
    validateReferralMutation.mutate(referralCode);
  };

  const handleRemoveReferral = () => {
    setAppliedReferral(null);
    setReferralCode("");
    toast({
      title: "Referral code removed",
      description: "The referral code has been removed from your order.",
    });
  };

  // Calculate final total with discounts (moved up for use in payment functions)
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const referralDiscountAmount = appliedReferral?.discountAmount || 0;
  const totalDiscountAmount = discountAmount + referralDiscountAmount;
  const shippingDiscountAmount = appliedCoupon?.shippingDiscountAmount || 0;
  const discountedShipping = Math.max(0, shipping - shippingDiscountAmount);
  const finalTotal = Math.max(0, subtotal - totalDiscountAmount + discountedShipping);

  // Terms acceptance timestamp (auto-accepted at checkout)
  const termsAcceptedAt = new Date();

  // Handle PayPal return from redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // PayPal order ID from return URL
    const payerId = urlParams.get('PayerID');
    const paypalCancelled = urlParams.get('paypal_cancelled');
    
    // Handle cancellation
    if (paypalCancelled) {
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the PayPal payment. Please try again when ready.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/checkout');
      sessionStorage.removeItem('pendingPayPalOrder');
      return;
    }
    
    if (token && payerId) {
      console.log("PayPal return detected - token:", token, "PayerID:", payerId);
      // User returned from PayPal approval
      const processPayPalReturn = async () => {
        setIsProcessing(true);
        try {
          console.log("PayPal: Capturing payment for order:", token);
          // Capture the payment
          const captureResponse = await fetch(`/api/paypal/order/${token}/capture`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const captureData = await captureResponse.json();
          console.log("PayPal capture response:", captureData);
          
          if (captureData.status === "COMPLETED") {
            console.log("PayPal: Payment completed, creating order...");
            // Get saved order info from session storage
            const pendingOrderStr = sessionStorage.getItem('pendingPayPalOrder');
            console.log("PayPal: Pending order from storage:", !!pendingOrderStr);
            if (pendingOrderStr) {
              const pendingOrder = JSON.parse(pendingOrderStr);
              
              // Create customer order
              const customerOrderData = {
                customerInfo: {
                  ...pendingOrder.customerInfo,
                  firstName: pendingOrder.customerInfo.firstName.trim(),
                  lastName: pendingOrder.customerInfo.lastName.trim(),
                  email: pendingOrder.customerInfo.email.trim().toLowerCase(),
                  address: pendingOrder.customerInfo.address.trim(),
                  city: pendingOrder.customerInfo.city.trim(),
                  postalCode: pendingOrder.customerInfo.postalCode.trim().toUpperCase(),
                },
                cartItems: pendingOrder.cartItems,
                subtotal: pendingOrder.subtotal,
                shipping: pendingOrder.shipping,
                total: pendingOrder.total,
                paymentMethod: 'paypal',
                paypalOrderId: token,
                coupon: pendingOrder.coupon,
                termsAcceptedAt: pendingOrder.termsAcceptedAt,
              };
              
              console.log("PayPal: Submitting order...");
              await createOrderMutation.mutateAsync(customerOrderData);
              sessionStorage.removeItem('pendingPayPalOrder');
              console.log("PayPal: Order created successfully!");
            } else {
              throw new Error("Order information not found. Please try your order again.");
            }
          } else {
            console.error("PayPal: Payment not completed, status:", captureData.status);
            throw new Error(`Payment not completed. Status: ${captureData.status}`);
          }
        } catch (error: any) {
          console.error("PayPal capture error:", error);
          toast({
            title: "Payment Error",
            description: error.message || "Failed to process PayPal payment",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
          // Clean up URL
          window.history.replaceState({}, '', '/checkout');
        }
      };
      
      processPayPalReturn();
    }
  }, []);

  // Initialize PayPal when PayPal is selected
  const [paypalInitialized, setPaypalInitialized] = useState(false);
  
  useEffect(() => {
    if (selectedPaymentMethod !== 'paypal' || cartItems.length === 0) {
      return;
    }

    const initPayPalButton = () => {
      console.log("PayPal: Initializing button...");
      const paypalButton = document.getElementById("paypal-checkout-button");
      console.log("PayPal: Button element found:", !!paypalButton);
      if (paypalButton) {
        paypalButton.onclick = async () => {
          console.log("PayPal: Button clicked");
          if (!isFormValid) {
            setTouchedFields({
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              postalCode: true,
            });
            toast({
              title: "Please complete all fields",
              description: "Fill in your delivery information to continue.",
              variant: "destructive",
            });
            return;
          }

          setIsProcessing(true);
          try {
            // Create PayPal order with return URLs for redirect flow
            const baseUrl = window.location.origin;
            const orderPayload = {
              amount: finalTotal.toFixed(2),
              currency: "GBP",
              intent: "CAPTURE",
              returnUrl: `${baseUrl}/checkout`,
              cancelUrl: `${baseUrl}/checkout?paypal_cancelled=true`,
            };
            console.log("PayPal: Creating order with returnUrl:", orderPayload.returnUrl);
            const response = await fetch("/api/paypal/order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(orderPayload),
            });
            const orderData = await response.json();
            console.log("PayPal: Order created:", orderData.id, "Links:", orderData.links?.length);
            
            if (!orderData.id) {
              throw new Error("Failed to create PayPal order");
            }

            // Find the approval URL from PayPal response
            const approvalLink = orderData.links?.find((link: any) => link.rel === "approve" || link.rel === "payer-action");
            
            if (approvalLink?.href) {
              // Store order info for when user returns
              sessionStorage.setItem('pendingPayPalOrder', JSON.stringify({
                orderId: orderData.id,
                customerInfo: {
                  ...customerInfo,
                  firstName: customerInfo.firstName.trim(),
                  lastName: customerInfo.lastName.trim(),
                  email: customerInfo.email.trim(),
                  address: customerInfo.address.trim(),
                  city: customerInfo.city.trim(),
                  postalCode: customerInfo.postalCode.trim(),
                  phone: customerInfo.phone.trim(),
                },
                cartItems: cartItems.map(item => ({
                  id: item.id,
                  productId: item.productId,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  size: item.size,
                  color: item.color,
                  image: item.image,
                  category: item.category,
                  storefrontSlug: item.storefrontSlug,
                  resellerId: item.resellerId,
                })),
                subtotal,
                shipping: discountedShipping,
                total: finalTotal,
                coupon: appliedCoupon?.valid ? {
                  id: appliedCoupon.coupon.id,
                  code: appliedCoupon.coupon.code,
                  discountAmount,
                  shippingDiscountAmount,
                } : undefined,
                termsAcceptedAt: termsAcceptedAt?.toISOString() || new Date().toISOString(),
              }));
              
              // Redirect to PayPal
              window.location.href = approvalLink.href;
            } else {
              throw new Error("No PayPal approval URL found");
            }
          } catch (e: any) {
            setIsProcessing(false);
            console.error("PayPal error:", e);
            toast({
              title: "PayPal Error",
              description: e?.message || "Failed to start PayPal checkout",
              variant: "destructive",
            });
          }
        };
        setPaypalInitialized(true);
      }
    };

    // Initialize PayPal button when component mounts with PayPal selected
    initPayPalButton();
  }, [selectedPaymentMethod, termsAccepted, cartItems.length, finalTotal, customerInfo, isFormValid]);

  // Handle successful Square payment
  const handleSquarePaymentSuccess = async (paymentId: string) => {
    console.log('handleSquarePaymentSuccess called with paymentId:', paymentId);
    setIsProcessing(true);
    try {
      const itemsMissingProductId = cartItems.filter(item => !item.productId);
      if (itemsMissingProductId.length > 0) {
        console.error('Cart items missing productId:', itemsMissingProductId);
        await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        setIsProcessing(false);
        toast({
          title: "Cart refreshed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      const orderCartItems = cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        category: item.category,
        storefrontSlug: item.storefrontSlug,
        resellerId: item.resellerId,
      }));

      const orderData = {
        customerInfo: {
          ...customerInfo,
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email.trim(),
          address: customerInfo.address.trim(),
          city: customerInfo.city.trim(),
          postalCode: customerInfo.postalCode.trim(),
          phone: customerInfo.phone.trim(),
        },
        cartItems: orderCartItems,
        subtotal,
        shipping: discountedShipping,
        total: finalTotal,
        paymentMethod: 'square',
        squarePaymentId: paymentId,
        coupon: appliedCoupon ? {
          id: appliedCoupon.coupon?.id,
          code: couponCode,
          discountAmount,
          shippingDiscountAmount
        } : undefined,
        termsAcceptedAt: termsAcceptedAt?.toISOString(),
      };

      console.log('Sending Square order creation request...');
      const response = await apiRequest("POST", "/api/orders/create-confirmed", orderData);
      console.log('Order creation response status:', response.status);
      const data = await response.json();
      console.log('Order creation response data:', data);

      if (data.success) {
        clearCart();
        toast({
          title: "Payment successful!",
          description: `Order ${data.order.orderNumber} has been placed.`,
        });
        setLocation(`/?payment=success&order=${data.order.orderNumber}`);
      } else {
        throw new Error(data.error || 'Order creation failed');
      }
    } catch (error: any) {
      console.error('Square order creation error:', error);
      toast({
        title: "Payment Received",
        description: "Your payment was successful but we encountered an issue creating your order. Please contact support with your payment ID: " + paymentId?.slice(-8),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Order creation mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders/create", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      // If we have a checkout URL (Stripe payment), redirect to it
      if (data.checkoutUrl) {
        console.log('Redirecting to Stripe checkout:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        // For non-Stripe payments, show success and redirect to home
        toast({
          title: "Order confirmed!",
          description: `Your order #${data.order.orderNumber} has been successfully created. You'll receive a confirmation email shortly.`,
        });
        clearCart();
        setLocation('/');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message || "There was an issue creating your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to show all errors
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      postalCode: true,
    });
    
    // Don't proceed if form is invalid
    if (!isFormValid) {
      toast({
        title: "Please complete all fields",
        description: "Fill in all required delivery information before placing your order.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Validate that all cart items have a valid productId
      const itemsMissingProductId = cartItems.filter(item => !item.productId);
      if (itemsMissingProductId.length > 0) {
        // Force refetch the cart to trigger server-side sanitization
        toast({
          title: "Refreshing cart",
          description: "Syncing your cart data, please wait...",
        });
        await queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        setIsProcessing(false);
        // Try again after a brief delay to allow state update
        setTimeout(() => {
          toast({
            title: "Cart refreshed",
            description: "Please try placing your order again.",
          });
        }, 1000);
        return;
      }
      
      // Map cart items with required fields for the backend
      // Include both id (cart item id) and productId (product reference) for backwards compatibility
      const orderCartItems = cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        category: item.category,
        storefrontSlug: item.storefrontSlug,
        resellerId: item.resellerId,
      }));
      
      const orderData = {
        customerInfo: {
          ...customerInfo,
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email.trim().toLowerCase(),
          address: customerInfo.address.trim(),
          city: customerInfo.city.trim(),
          postalCode: customerInfo.postalCode.trim().toUpperCase(),
        },
        cartItems: orderCartItems,
        subtotal,
        shipping: discountedShipping,
        total: finalTotal,
        paymentMethod: selectedPaymentMethod,
        coupon: appliedCoupon?.valid ? {
          id: appliedCoupon.coupon.id,
          code: appliedCoupon.coupon.code,
          discountAmount,
          shippingDiscountAmount,
        } : undefined,
        referral: appliedReferral?.valid && appliedReferral.referralId ? {
          referralId: appliedReferral.referralId,
          discountType: appliedReferral.discountType,
          discountValue: appliedReferral.discountValue,
          discountAmount: referralDiscountAmount,
        } : undefined,
        termsAcceptedAt: termsAcceptedAt?.toISOString() || new Date().toISOString(),
      };

      await createOrderMutation.mutateAsync(orderData);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground">Add some items to your cart before checking out.</p>
            <Button onClick={() => setLocation('/shop')} className="min-h-11">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLocation('/cart')}
                  data-testid="button-back-to-cart"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold" data-testid="checkout-title">Checkout</h1>
                  <p className="text-sm md:text-base text-muted-foreground">Complete your order with 1stRep</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Checkout Form */}
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                  <CardDescription>
                    Where should we send your order?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Postal Code First - for address lookup */}
                  <div className="relative">
                    <Label htmlFor="postalCode" className="flex items-center gap-2">
                      Postal Code *
                      {isLookingUpPostcode && <Loader2 className="h-3 w-3 animate-spin" />}
                    </Label>
                    <Input
                      id="postalCode"
                      placeholder="e.g. SW1A 1AA"
                      value={customerInfo.postalCode}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                      onBlur={handlePostalCodeBlur}
                      required
                      className={`min-h-11 ${touchedFields.postalCode && validationErrors.postalCode ? 'border-red-500 focus:ring-red-500' : ''}`}
                      data-testid="input-postal-code"
                    />
                    {touchedFields.postalCode && validationErrors.postalCode && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.postalCode}
                      </p>
                    )}
                    {!validationErrors.postalCode && customerInfo.postalCode.trim().length >= 5 && (
                      <p className="text-muted-foreground text-xs mt-1">
                        Enter your postal code to auto-fill city and get address suggestions
                      </p>
                    )}
                  </div>
                  
                  {/* City - auto-filled from postal code */}
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                      onBlur={() => handleBlur('city')}
                      required
                      placeholder={isLookingUpPostcode ? "Looking up..." : "Will be auto-filled from postal code"}
                      className={`min-h-11 ${touchedFields.city && validationErrors.city ? 'border-red-500 focus:ring-red-500' : ''}`}
                      data-testid="input-city"
                    />
                    {touchedFields.city && validationErrors.city && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.city}
                      </p>
                    )}
                  </div>
                  
                  {/* Address field - manual entry */}
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="House number and street name"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      onBlur={() => handleBlur('address')}
                      required
                      className={`min-h-11 ${touchedFields.address && validationErrors.address ? 'border-red-500 focus:ring-red-500' : ''}`}
                      data-testid="input-address"
                    />
                    {touchedFields.address && validationErrors.address && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.address}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        onBlur={() => handleBlur('firstName')}
                        required
                        className={`min-h-11 ${touchedFields.firstName && validationErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        data-testid="input-first-name"
                      />
                      {touchedFields.firstName && validationErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                        onBlur={() => handleBlur('lastName')}
                        required
                        className={`min-h-11 ${touchedFields.lastName && validationErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        data-testid="input-last-name"
                      />
                      {touchedFields.lastName && validationErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        onBlur={() => handleBlur('email')}
                        required
                        className={`min-h-11 ${touchedFields.email && validationErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                        data-testid="input-email"
                      />
                      {touchedFields.email && validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. 07XXX XXXXXX or 020 XXXX XXXX"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        onBlur={() => handleBlur('phone')}
                        required
                        className={`min-h-11 ${touchedFields.phone && validationErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                        data-testid="input-phone"
                      />
                      {touchedFields.phone && validationErrors.phone && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Delivery Method
                  </CardTitle>
                  <CardDescription>
                    Choose how you'd like to receive your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {/* Home Delivery Option */}
                    <div 
                      className={`border rounded-lg p-4 hover-elevate cursor-pointer ${deliveryMethod === 'delivery' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => {
                        setDeliveryMethod('delivery');
                        setSelectedStore(null);
                      }}
                      data-testid="delivery-option-delivery"
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="deliveryMethod" 
                          id="delivery" 
                          checked={deliveryMethod === 'delivery'}
                          onChange={() => {
                            setDeliveryMethod('delivery');
                            setSelectedStore(null);
                          }}
                          className="h-5 w-5 min-h-5 min-w-5" 
                        />
                        <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            <span className="font-medium">Home Delivery</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Free Next Day Delivery
                          </p>
                        </Label>
                      </div>
                    </div>

                    {/* In-Store Collection Option */}
                    {(siteSettings?.inStoreCollectionEnabled !== false && storeLocations.length > 0) && (
                      <div 
                        className={`border rounded-lg p-4 hover-elevate cursor-pointer ${deliveryMethod === 'collection' ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => setDeliveryMethod('collection')}
                        data-testid="delivery-option-collection"
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="deliveryMethod" 
                            id="collection" 
                            checked={deliveryMethod === 'collection'}
                            onChange={() => setDeliveryMethod('collection')}
                            className="h-5 w-5 min-h-5 min-w-5" 
                          />
                          <Label htmlFor="collection" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Store className="h-5 w-5" />
                              <span className="font-medium">In-Store Collection</span>
                              <Badge variant="secondary" className="text-xs">Free</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Collect from a nearby store • Usually ready same day
                            </p>
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Store Selection for In-Store Collection */}
                  {deliveryMethod === 'collection' && storeLocations.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-medium">Select Collection Store</Label>
                      <div className="grid gap-2 max-h-48 overflow-y-auto">
                        {storeLocations.map((store) => (
                          <div 
                            key={store.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedStore?.id === store.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
                            onClick={() => setSelectedStore(store)}
                            data-testid={`store-option-${store.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <input 
                                type="radio" 
                                name="store" 
                                checked={selectedStore?.id === store.id}
                                onChange={() => setSelectedStore(store)}
                                className="h-4 w-4 mt-1" 
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{store.businessName}</p>
                                <div className="flex items-start gap-1 mt-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground">{store.businessAddress}</p>
                                </div>
                                {store.phoneNumber && (
                                  <p className="text-xs text-muted-foreground mt-1">{store.phoneNumber}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!selectedStore && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Please select a collection store
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mobile Only: Discount & Referral Codes Section (shown before payment on mobile) */}
              <Card className="md:hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Discount & Referral Codes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon Code - Mobile */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Tag className="h-3.5 w-3.5" />
                      Discount Code
                    </Label>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="min-h-10"
                          data-testid="input-coupon-code-mobile"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={validateCouponMutation.isPending || !couponCode.trim()}
                          className="min-h-10 whitespace-nowrap px-3"
                          data-testid="button-apply-coupon-mobile"
                        >
                          {validateCouponMutation.isPending ? "..." : "Apply"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            {appliedCoupon.coupon?.code}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveCoupon}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Referral Code - Mobile */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Gift className="h-3.5 w-3.5" />
                      Referral Code
                    </Label>
                    {!appliedReferral ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          className="min-h-10"
                          data-testid="input-referral-code-mobile"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyReferral}
                          disabled={validateReferralMutation.isPending || !referralCode.trim()}
                          className="min-h-10 whitespace-nowrap px-3"
                          data-testid="button-apply-referral-mobile"
                        >
                          {validateReferralMutation.isPending ? "..." : "Apply"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {referralCode} - {appliedReferral.discountType === 'percentage' ? `${appliedReferral.discountValue}%` : `£${appliedReferral.discountValue}`} off
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveReferral}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Your payment information is secure and encrypted
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm md:text-base">Choose Payment Method</Label>
                    
                    {/* Square Card Payment - Most Popular (includes Apple Pay/Google Pay) */}
                    <div 
                      className={`border rounded-lg p-3 md:p-4 hover-elevate cursor-pointer min-h-11 ${selectedPaymentMethod === 'square' ? 'border-primary bg-primary/5' : ''}`} 
                      data-testid="payment-option-card"
                      onClick={() => setSelectedPaymentMethod('square')}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          id="square" 
                          checked={selectedPaymentMethod === 'square'}
                          onChange={() => setSelectedPaymentMethod('square')}
                          className="h-5 w-5 min-h-5 min-w-5" 
                        />
                        <Label htmlFor="square" className="flex-1 cursor-pointer">
                          <div className="flex flex-wrap items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            <span className="font-medium text-sm md:text-base">Card & Digital Wallets</span>
                            <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Visa, Mastercard, Amex, Apple Pay, Google Pay
                          </p>
                        </Label>
                      </div>
                    </div>

                    {/* PayPal Account */}
                    <div 
                      className={`border rounded-lg p-3 md:p-4 hover-elevate cursor-pointer min-h-11 ${selectedPaymentMethod === 'paypal' ? 'border-primary bg-primary/5' : ''}`} 
                      data-testid="payment-option-paypal"
                      onClick={() => setSelectedPaymentMethod('paypal')}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          id="paypal" 
                          checked={selectedPaymentMethod === 'paypal'}
                          onChange={() => setSelectedPaymentMethod('paypal')}
                          className="h-5 w-5 min-h-5 min-w-5" 
                        />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          <div className="flex flex-wrap items-center gap-2">
                            <SiPaypal className="h-5 w-5 text-[#0070ba]" />
                            <span className="font-medium text-sm md:text-base">PayPal Account</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pay with your PayPal balance or linked cards
                          </p>
                        </Label>
                      </div>
                    </div>

                    {/* Klarna - Buy Now Pay Later */}
                    <div 
                      className="border rounded-lg p-3 md:p-4 min-h-11 opacity-60 cursor-not-allowed"
                      data-testid="payment-option-klarna"
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          id="klarna" 
                          disabled
                          className="h-5 w-5 min-h-5 min-w-5" 
                        />
                        <Label htmlFor="klarna" className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm md:text-base">Klarna</span>
                            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pay in 3 instalments or within 30 days
                          </p>
                        </Label>
                      </div>
                    </div>

                    {/* Clearpay/Afterpay - Buy Now Pay Later */}
                    <div 
                      className="border rounded-lg p-3 md:p-4 min-h-11 opacity-60 cursor-not-allowed"
                      data-testid="payment-option-clearpay"
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          id="clearpay" 
                          disabled
                          className="h-5 w-5 min-h-5 min-w-5" 
                        />
                        <Label htmlFor="clearpay" className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm md:text-base">Clearpay</span>
                            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Pay in 4 interest-free instalments
                          </p>
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Info about selected payment method */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {selectedPaymentMethod === 'square' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">Secure Card Payment</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">Visa</span>
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">Mastercard</span>
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">Amex</span>
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">Apple Pay</span>
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">Google Pay</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          We accept all major cards and digital wallets
                        </p>
                        
                        {/* Square Payment Form */}
                        <SquarePayment
                          amount={finalTotal}
                          currency="GBP"
                          customerEmail={customerInfo.email}
                          orderData={{
                            customerInfo: {
                              ...customerInfo,
                              firstName: customerInfo.firstName.trim(),
                              lastName: customerInfo.lastName.trim(),
                              email: customerInfo.email.trim(),
                              address: customerInfo.address.trim(),
                              city: customerInfo.city.trim(),
                              postalCode: customerInfo.postalCode.trim(),
                              phone: customerInfo.phone.trim(),
                            },
                            cartItems: cartItems.map(item => ({
                              id: item.id,
                              productId: item.productId,
                              name: item.name,
                              price: item.price,
                              quantity: item.quantity,
                              size: item.size,
                              color: item.color,
                              image: item.image,
                              category: item.category,
                              storefrontSlug: item.storefrontSlug,
                              resellerId: item.resellerId,
                            })),
                            subtotal,
                            shipping: discountedShipping,
                            total: finalTotal,
                            coupon: appliedCoupon ? {
                              id: appliedCoupon.coupon?.id,
                              code: couponCode,
                              discountAmount,
                              shippingDiscountAmount
                            } : undefined,
                            termsAcceptedAt: termsAcceptedAt?.toISOString(),
                          }}
                          onPaymentSuccess={(paymentId) => {
                            handleSquarePaymentSuccess(paymentId);
                          }}
                          onPaymentError={(error) => {
                            toast({
                              title: "Payment Failed",
                              description: error || "Please try again or use a different payment method.",
                              variant: "destructive",
                            });
                          }}
                          isFormValid={isFormValid && termsAccepted}
                          onFormInvalid={() => {
                            if (!termsAccepted) {
                              toast({
                                title: "Accept Terms",
                                description: "Please accept the terms and conditions to continue.",
                                variant: "destructive",
                              });
                            } else {
                              setTouchedFields({
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                address: true,
                                city: true,
                                postalCode: true,
                              });
                              toast({
                                title: "Please complete all fields",
                                description: "Fill in your delivery information to continue.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={!termsAccepted || isProcessing}
                        />
                      </div>
                    )}
                    {selectedPaymentMethod === 'paypal' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <SiPaypal className="w-4 h-4 text-[#0070ba]" />
                          <span className="font-medium text-sm">Pay with PayPal Account</span>
                        </div>
                        <ul className="text-muted-foreground text-sm space-y-1">
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" /> Secure payment with PayPal</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" /> Use your PayPal balance or linked cards</li>
                          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-500" /> PayPal Buyer Protection included</li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-1">
                          You'll be redirected to PayPal to complete your payment securely.
                        </p>
                      </div>
                    )}
                    {selectedPaymentMethod === 'klarna' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Pay with Klarna</span>
                        </div>
                        <ul className="text-muted-foreground text-sm space-y-1">
                          <li>• Pay in 3 interest-free instalments</li>
                          <li>• Or pay in full within 30 days</li>
                          <li>• No fees when you pay on time</li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-1">
                          18+, T&Cs apply. Credit subject to status.
                        </p>
                      </div>
                    )}
                    {selectedPaymentMethod === 'clearpay' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Pay with Clearpay</span>
                        </div>
                        <ul className="text-muted-foreground text-sm space-y-1">
                          <li>• Pay in 4 interest-free instalments</li>
                          <li>• First payment today, then every 2 weeks</li>
                          <li>• No fees when you pay on time</li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-1">
                          18+, T&Cs apply. Late fees may apply.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* UK Trust Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>256-bit SSL</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>PCI Compliant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>Easy Returns</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3" data-testid={`order-item-${item.id}-${item.size}-${item.color}`}>
                        <img 
                          src={convertToDirectUrl(item.image)} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.color} • {item.size} • Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold">
                            £{(item.price * item.quantity).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">(inc. VAT)</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />

                  {/* Coupon Code - Desktop only (mobile has its own section above) */}
                  <div className="hidden md:block space-y-2">
                    <Label className="flex items-center gap-2 text-sm md:text-base">
                      <Tag className="h-4 w-4" />
                      Discount Code
                    </Label>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="min-h-11"
                          data-testid="input-coupon-code"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={validateCouponMutation.isPending || !couponCode.trim()}
                          className="min-h-11 whitespace-nowrap px-4"
                          data-testid="button-apply-coupon"
                        >
                          {validateCouponMutation.isPending ? "Checking..." : "Apply"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg min-h-11">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            {appliedCoupon.coupon?.code}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveCoupon}
                          className="min-h-11 min-w-11"
                          data-testid="button-remove-coupon"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Referral Code - Desktop only (mobile has its own section above) */}
                  <div className="hidden md:block space-y-2">
                    <Label className="flex items-center gap-2 text-sm md:text-base">
                      <Gift className="h-4 w-4" />
                      Referral Code
                    </Label>
                    {!appliedReferral ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter referral code"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          className="min-h-11"
                          data-testid="input-referral-code"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyReferral}
                          disabled={validateReferralMutation.isPending || !referralCode.trim()}
                          className="min-h-11 whitespace-nowrap px-4"
                          data-testid="button-apply-referral"
                        >
                          {validateReferralMutation.isPending ? "Checking..." : "Apply"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg min-h-11">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {referralCode} - {appliedReferral.discountType === 'percentage' ? `${appliedReferral.discountValue}%` : `£${appliedReferral.discountValue}`} off
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveReferral}
                          className="min-h-11 min-w-11"
                          data-testid="button-remove-referral"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Order Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal <span className="text-xs text-muted-foreground">(inc. VAT)</span></span>
                      <span data-testid="text-subtotal">£{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Coupon Discount</span>
                        <span data-testid="text-discount">-£{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {referralDiscountAmount > 0 && (
                      <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                        <span>Referral Discount</span>
                        <span data-testid="text-referral-discount">-£{referralDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span data-testid="text-shipping">
                        {deliveryMethod === 'collection' ? "Free (Collection)" : discountedShipping === 0 ? "Free" : `£${discountedShipping.toFixed(2)}`}
                        {shippingDiscountAmount > 0 && shipping > 0 && deliveryMethod !== 'collection' && (
                          <span className="ml-2 line-through text-muted-foreground">
                            £{shipping.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total <span className="text-xs font-normal text-muted-foreground">(inc. VAT)</span></span>
                      <span data-testid="order-total">£{(deliveryMethod === 'collection' ? subtotal - discountAmount : finalTotal).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {freeShippingEnabled && subtotal < freeShippingThreshold && !appliedCoupon?.coupon && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Add £{(freeShippingThreshold - subtotal).toFixed(2)} more for free shipping
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Trust Signals */}
              <Card className="bg-muted/30">
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {/* Secure Payment */}
                    <div className="flex items-start gap-2 md:gap-3">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-xs md:text-sm font-semibold">Secure Payment</p>
                        <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
                      </div>
                    </div>

                    {/* Free Shipping */}
                    {freeShippingEnabled && (
                      <div className="flex items-start gap-2 md:gap-3">
                        <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-xs md:text-sm font-semibold">Free Shipping</p>
                          <p className="text-xs text-muted-foreground">On orders over £{freeShippingThreshold.toFixed(2)}</p>
                        </div>
                      </div>
                    )}

                    {/* Easy Returns */}
                    <div className="flex items-start gap-2 md:gap-3">
                      <RotateCcw className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-xs md:text-sm font-semibold">Easy Returns</p>
                        <p className="text-xs text-muted-foreground">30-day return policy</p>
                      </div>
                    </div>

                    {/* Fast Delivery */}
                    <div className="flex items-start gap-2 md:gap-3">
                      <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-xs md:text-sm font-semibold">Fast Delivery</p>
                        <p className="text-xs text-muted-foreground">Next day delivery</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complete Order Button - Only show for non-card/Square payments (Square has its own button) */}
              {selectedPaymentMethod !== 'square' && selectedPaymentMethod !== 'paypal' && (
                <form onSubmit={handleSubmit}>
                  <Button 
                    type="submit" 
                    className="w-full min-h-12 text-base md:text-lg font-semibold" 
                    disabled={isProcessing}
                    data-testid="button-complete-order"
                  >
                    {isProcessing ? "Processing..." : `Complete Order - £${finalTotal.toFixed(2)}`}
                  </Button>
                </form>
              )}

              {/* PayPal Button */}
              {selectedPaymentMethod === 'paypal' && (
                <div className="space-y-3">
                  <Button
                    id="paypal-checkout-button"
                    data-testid="button-paypal-checkout"
                    className="w-full min-h-12 text-base md:text-lg font-semibold bg-[#0070ba] hover:bg-[#003087] text-white"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <SiPaypal className="w-5 h-5" />
                        Pay with PayPal - £{finalTotal.toFixed(2)}
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    You will be redirected to PayPal to complete your purchase securely
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
