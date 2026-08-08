import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import StorefrontManagement from "@/components/reseller/StorefrontManagement";
import RequestStockDialog from "@/components/reseller/RequestStockDialog";
import NotificationCenter from "@/components/NotificationCenter";
import MessagesPanel from "@/components/reseller/MessagesPanel";
import { useSocket } from "@/hooks/useSocket";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  PoundSterling,
  Eye,
  Plus,
  LogOut,
  Clock,
  Store,
  MessageSquare,
  Users,
  Edit,
  X,
  Zap,
  Wallet,
  Key,
  CreditCard,
  Check,
  Loader2,
  Upload,
  RefreshCw,
  Layers,
  Trash2,
  Image,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  Lightbulb,
  ShieldCheck,
  Bell,
  BarChart3,
  Globe,
  Smartphone,
  HelpCircle,
  ExternalLink,
  FileText
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertToDirectUrl } from "@/lib/imageUtils";
import EarningsPanel from "@/components/reseller/EarningsPanel";
import EposPaymentSetup from "@/components/reseller/EposPaymentSetup";
import { useB2BCapabilities } from "@/hooks/useB2BCapabilities";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Textarea } from "@/components/ui/textarea";

// Initialize Stripe with runtime key fetch (for production compatibility)
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = (async () => {
      let publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        try {
          const response = await fetch('/api/stripe/config');
          const data = await response.json();
          publishableKey = data.publishableKey;
        } catch (error) {
          console.error('Failed to fetch Stripe config:', error);
        }
      }
      if (!publishableKey) {
        console.error('No Stripe publishable key available');
        return null;
      }
      return loadStripe(publishableKey);
    })();
  }
  return stripePromise;
};

// Licensing Panel Component
function LicensingPanel({ resellerId }: { resellerId: string }) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [businessJustification, setBusinessJustification] = useState("");
  const { toast } = useToast();

  // Fetch license settings
  const { data: licenseSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/license-settings'],
  });

  // Fetch existing license requests
  const { data: licenseRequests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ['/api/reseller/license-requests'],
    enabled: !!resellerId,
  });

  // Fetch B2B capabilities
  const { data: capabilities = [] } = useQuery<any[]>({
    queryKey: ['/api/reseller/capabilities'],
    enabled: !!resellerId,
  });

  // Check if reseller already has the add_own_products capability
  const hasLicense = capabilities.some(
    (cap: any) => cap.capability === 'add_own_products' && cap.enabled
  );

  // Get latest request
  const latestRequest = licenseRequests[0];

  // Get license fee
  const productLicenseSetting = licenseSettings.find(
    (s: any) => s.licenseType === 'reseller_product_license'
  );
  const licenseFee = productLicenseSetting?.fee || '49.99';

  // Create license request mutation
  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/reseller/license-requests', { businessJustification });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/license-requests'] });
      toast({ title: 'Licence request submitted', description: 'You can now proceed to payment.' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Request failed', 
        description: error.message || 'Failed to create licence request',
        variant: 'destructive'
      });
    }
  });

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest('POST', `/api/reseller/license-requests/${requestId}/create-payment`);
      return response.json();
    },
    onSuccess: (data: any) => {
      setClientSecret(data.clientSecret);
      setShowPaymentForm(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Payment setup failed',
        description: error.message || 'Failed to initialise payment',
        variant: 'destructive'
      });
    }
  });

  const handleCreateRequest = () => {
    createRequestMutation.mutate();
  };

  const handleStartPayment = () => {
    if (latestRequest?.id) {
      createPaymentMutation.mutate(latestRequest.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500">Payment Pending</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">Paid</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status || 'Not Started'}</Badge>;
    }
  };

  if (hasLicense) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-green-500/10 rounded-full">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Product Licence Active</h2>
            <p className="text-muted-foreground">You can add and sell your own products</p>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-muted-foreground">
          Your product licence is active. You can now add your own products to your storefront and earn 100% of the revenue (minus platform fees).
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-full">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Product Licence</h2>
            <p className="text-muted-foreground">Add and sell your own products</p>
          </div>
        </div>
        <Separator className="my-6" />

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">What's Included</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Add unlimited products to your storefront</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Keep 100% of revenue from your products</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Full inventory management tools</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Combined checkout with 1stRep products</span>
              </li>
            </ul>
          </div>

          <div>
            <Card className="p-6 bg-muted/50">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-primary">£{parseFloat(licenseFee).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">One-time licence fee</p>
              </div>
              
              {!latestRequest && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Brief description of products you plan to add (optional)"
                    value={businessJustification}
                    onChange={(e) => setBusinessJustification(e.target.value)}
                    rows={3}
                    className="w-full"
                    data-testid="input-license-justification"
                  />
                  <Button 
                    className="w-full min-h-11" 
                    onClick={handleCreateRequest}
                    disabled={createRequestMutation.isPending}
                    data-testid="button-request-license"
                  >
                    {createRequestMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Request Product Licence
                      </>
                    )}
                  </Button>
                </div>
              )}

              {latestRequest && latestRequest.paymentStatus !== 'paid' && latestRequest.status !== 'rejected' && (
                <Button 
                  className="w-full min-h-11"
                  onClick={handleStartPayment}
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-pay-license"
                >
                  {createPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay £{parseFloat(licenseFee).toFixed(2)}
                    </>
                  )}
                </Button>
              )}
            </Card>
          </div>
        </div>
      </Card>

      {/* Request History */}
      {licenseRequests.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Licence Request History</h3>
          <div className="space-y-4">
            {licenseRequests.map((request: any) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium">{request.licenseType.replace(/_/g, ' ')}</span>
                    {getStatusBadge(request.status)}
                    {getPaymentStatusBadge(request.paymentStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Requested on {new Date(request.createdAt).toLocaleDateString('en-GB')}
                  </p>
                  {request.rejectionReason && (
                    <p className="text-sm text-red-500 mt-2">
                      Rejection reason: {request.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold">£{parseFloat(request.requestedFee).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentForm && clientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Complete Payment</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowPaymentForm(false)}
                data-testid="button-close-payment"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Elements stripe={getStripe()} options={{ clientSecret }}>
              <LicensePaymentForm 
                requestId={latestRequest?.id}
                onSuccess={() => {
                  setShowPaymentForm(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/reseller/license-requests'] });
                }}
              />
            </Elements>
          </Card>
        </div>
      )}
    </>
  );
}

// Payment Form Component
function LicensePaymentForm({ requestId, onSuccess }: { requestId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: 'Payment failed',
          description: error.message,
          variant: 'destructive'
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update payment status
        await apiRequest(`/api/reseller/license-requests/${requestId}`, {
          method: 'PATCH',
          body: JSON.stringify({ paymentStatus: 'paid' }),
        });
        
        toast({
          title: 'Payment successful',
          description: 'Your licence request is now pending admin approval.'
        });
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: 'Payment error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full min-h-11" 
        disabled={!stripe || isProcessing}
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Confirm Payment
          </>
        )}
      </Button>
    </form>
  );
}

// Subscription Payment Form Component
function SubscriptionPaymentForm({ 
  clientSecret, 
  subscriptionId,
  tier,
  tierName,
  amount,
  onSuccess, 
  onCancel 
}: { 
  clientSecret: string; 
  subscriptionId: string;
  tier: string;
  tierName: string;
  amount: number;
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: 'Payment failed',
          description: error.message || 'Payment could not be processed',
          variant: 'destructive'
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm subscription with backend (tier is retrieved from Stripe metadata for security)
        const response = await apiRequest('POST', '/api/reseller/licence/confirm-subscription', {
          subscriptionId
        });
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: 'Subscription activated!',
            description: result.message || `Your ${tierName} subscription is now active.`
          });
          onSuccess();
        } else {
          toast({
            title: 'Activation pending',
            description: 'Payment received. Your subscription will be activated shortly.',
          });
          onSuccess();
        }
      }
    } catch (err: any) {
      toast({
        title: 'Payment error',
        description: err.message || 'Failed to process payment',
        variant: 'destructive'
      });
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Selected Plan</p>
            <p className="font-semibold text-lg">{tierName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">£{(amount / 100).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 min-h-11" 
            disabled={!stripe || isProcessing}
            data-testid="button-confirm-subscription"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Subscribe Now
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Your card will be charged £{(amount / 100).toFixed(2)} now and automatically each month. 
          You can cancel anytime from your dashboard.
        </p>
      </form>
    </div>
  );
}

// EPOS PIN Change Form Component
function EposPinChangeForm() {
  const { toast } = useToast();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(true);

  // Check if PIN exists
  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const response = await fetch('/api/reseller/epos/session');
        const data = await response.json();
        setHasExistingPin(!data.requiresPinSetup);
      } catch (err) {
        console.error('Failed to check PIN status:', err);
      }
    };
    checkPinStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "The new PIN and confirmation PIN must be the same.",
        variant: "destructive"
      });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', '/api/reseller/epos/set-pin', {
        currentPin: hasExistingPin ? currentPin : undefined,
        newPin
      });
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "PIN Updated",
          description: "Your EPOS PIN has been changed successfully."
        });
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setHasExistingPin(true);
      } else {
        toast({
          title: "Failed to update PIN",
          description: data.error || "Please try again.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update PIN",
        variant: "destructive"
      });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {hasExistingPin && (
        <div>
          <Label htmlFor="currentPin">Current PIN</Label>
          <Input
            id="currentPin"
            type="password"
            maxLength={4}
            placeholder="Enter current 4-digit PIN"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            className="font-mono tracking-widest"
          />
        </div>
      )}
      <div>
        <Label htmlFor="newPin">New PIN</Label>
        <Input
          id="newPin"
          type="password"
          maxLength={4}
          placeholder="Enter new 4-digit PIN"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
          className="font-mono tracking-widest"
        />
      </div>
      <div>
        <Label htmlFor="confirmPin">Confirm New PIN</Label>
        <Input
          id="confirmPin"
          type="password"
          maxLength={4}
          placeholder="Confirm new 4-digit PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          className="font-mono tracking-widest"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          hasExistingPin ? "Change PIN" : "Set PIN"
        )}
      </Button>
    </form>
  );
}

// Licence Tier Panel Component - New tier-based subscription system
function LicenceTierPanel({ resellerId }: { resellerId: string }) {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  // Fetch licence status
  const { data: licenceData, isLoading } = useQuery<{
    licence: any;
    canAddProduct: boolean;
    productCount: number;
    productLimit: number | null;
    reason?: string;
  }>({
    queryKey: ['/api/reseller/licence'],
    enabled: !!resellerId,
  });

  // Fetch tier pricing from database
  const { data: tierPricingData = [] } = useQuery<any[]>({
    queryKey: ['/api/subscription-tier-pricing'],
  });

  // Check URL params for subscription completion (redirect back from Square)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionComplete = params.get('subscription_complete');
    const tier = params.get('tier');
    const ref = params.get('ref');
    
    if (subscriptionComplete === 'true' && tier) {
      const confirmSubscription = async () => {
        try {
          const response = await apiRequest('POST', '/api/reseller/licence/confirm-subscription', { 
            tier, 
            referenceId: ref 
          });
          const result = await response.json();
          
          if (result.success) {
            toast({
              title: 'Subscription activated',
              description: result.message || `Your ${tier} subscription is now active.`
            });
            queryClient.invalidateQueries({ queryKey: ['/api/reseller/licence'] });
          }
        } catch (err: any) {
          toast({
            title: 'Activation pending',
            description: 'Payment received. Your subscription will be activated shortly.',
          });
          queryClient.invalidateQueries({ queryKey: ['/api/reseller/licence'] });
        }
        
        // Clean URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('subscription_complete');
        url.searchParams.delete('tier');
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url.pathname);
      };
      
      confirmSubscription();
    }
  }, []);

  // Build tier options from DB pricing
  const tierOptions = useMemo(() => {
    const paidTiers = tierPricingData.filter((t: any) => t.tierName !== 'trial' && t.isActive);
    if (paidTiers.length === 0) {
      return [
        { id: 'bronze', name: 'Bronze', price: 29.99, products: 25, color: 'amber' },
        { id: 'silver', name: 'Silver', price: 49.99, products: 100, color: 'slate' },
        { id: 'gold', name: 'Gold', price: 99.99, products: 'Unlimited', color: 'yellow' },
      ];
    }
    return paidTiers.map((t: any) => ({
      id: t.tierName,
      name: t.displayName,
      price: parseFloat(t.pricePerMonth),
      products: t.productLimit || 'Unlimited',
      color: t.tierName === 'bronze' ? 'amber' : t.tierName === 'silver' ? 'slate' : 'yellow',
    }));
  }, [tierPricingData]);

  // Create subscription via Square checkout
  const createSubscriptionMutation = useMutation({
    mutationFn: async (tier: string) => {
      const response = await apiRequest('POST', '/api/reseller/licence/create-subscription', { tier });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Subscription setup failed',
        description: error.message || 'Failed to create subscription',
        variant: 'destructive'
      });
      setSelectedTier(null);
    }
  });

  // Request trial mutation
  const requestTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/reseller/licence/request-trial');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/licence'] });
      toast({ 
        title: 'Trial request submitted', 
        description: data.message || 'Your trial request is pending admin approval.' 
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Request failed',
        description: error.message || 'Failed to request trial',
        variant: 'destructive'
      });
    }
  });

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    createSubscriptionMutation.mutate(tierId);
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading licence status...</p>
      </Card>
    );
  }

  const licence = licenceData?.licence;
  const productCount = licenceData?.productCount || 0;
  const productLimit = licenceData?.productLimit;
  
  // Calculate trial days remaining
  const trialEndsAt = licence?.trialEndsAt ? new Date(licence.trialEndsAt) : null;
  const now = new Date();
  const trialDaysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const isPendingTrial = licence?.status === 'pending_trial';
  const isTrialActive = licence?.status === 'trial' && trialDaysRemaining > 0;
  const isTrialExpired = licence?.status === 'trial' && trialDaysRemaining <= 0;
  const isActive = licence?.status === 'active';
  const hasNoLicence = !licence;

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-full ${
            isActive ? 'bg-green-500/10' : 
            isTrialActive ? 'bg-blue-500/10' : 
            isPendingTrial ? 'bg-orange-500/10' :
            'bg-yellow-500/10'
          }`}>
            {isActive ? (
              <Check className="h-6 w-6 text-green-500" />
            ) : isTrialActive ? (
              <Clock className="h-6 w-6 text-blue-500" />
            ) : isPendingTrial ? (
              <Clock className="h-6 w-6 text-orange-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold">
                {isActive ? `${licence?.tier?.charAt(0).toUpperCase()}${licence?.tier?.slice(1)} Tier` : 
                 isTrialActive ? 'Free Trial' : 
                 isPendingTrial ? 'Trial Request Pending' :
                 isTrialExpired ? 'Trial Expired' : 'No Licence'}
              </h2>
              {isActive && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500">Active</Badge>
              )}
              {isTrialActive && (
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500">Trial</Badge>
              )}
              {isPendingTrial && (
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-500">Awaiting Approval</Badge>
              )}
              {isTrialExpired && (
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500">Expired</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {isActive ? `Your subscription is active until ${new Date(licence.expiresAt).toLocaleDateString('en-GB')}` :
               isTrialActive ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining in your free trial` :
               isPendingTrial ? 'Your trial request is being reviewed by an admin. You will be notified once approved.' :
               isTrialExpired ? 'Please select a subscription tier to continue' :
               'Request a free 30-day trial to start adding your own products'}
            </p>
          </div>
        </div>

        {/* Product Usage */}
        <Separator className="my-4" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Products Added</span>
            <span className="font-medium">
              {productCount} {productLimit !== null && `/ ${productLimit}`}
              {productLimit === null && <span className="text-muted-foreground ml-1">(unlimited)</span>}
            </span>
          </div>
          {productLimit !== null && (
            <Progress 
              value={(productCount / productLimit) * 100} 
              className="h-2"
            />
          )}
          {!licenceData?.canAddProduct && licenceData?.reason && (
            <p className="text-sm text-yellow-600 bg-yellow-500/10 p-3 rounded-lg">
              {licenceData.reason}
            </p>
          )}
        </div>
      </Card>

      {/* No Licence - Show Request Trial Button AND Subscription Options */}
      {hasNoLicence && (
        <>
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">Start Your Free Trial</h3>
            <p className="text-muted-foreground mb-4">
              Request a free 30-day trial to start adding your own products. An admin will review and approve your request.
            </p>
            
            {/* Licence Benefits */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-2">What You Get With a Licence</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Unlock the ability to sell your own products through our EPOS system and online marketplace.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Add and sell your own products via the POS</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Keep 100% of profits on your own products</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Full inventory management for your products</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Priority support from your dedicated accounts manager</span>
                </li>
              </ul>
            </div>
            
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => requestTrialMutation.mutate()}
              disabled={requestTrialMutation.isPending}
              data-testid="button-request-trial"
            >
              {requestTrialMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Request 30-Day Free Trial
                </>
              )}
            </Button>
          </Card>

          {/* Subscription Options - Skip Trial */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">Or Choose a Subscription Plan</h3>
            <p className="text-muted-foreground mb-4">
              Skip the trial and get started immediately with a paid subscription.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {tierOptions.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`p-6 relative overflow-visible hover-elevate cursor-pointer transition-all ${
                    tier.id === 'gold' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                  }`}
                  onClick={() => handleSelectTier(tier.id)}
                >
                  {tier.id === 'gold' && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded-bl">
                      Best Value
                    </div>
                  )}
                  <div className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`mb-3 ${
                        tier.id === 'bronze' ? 'bg-amber-500/10 text-amber-600 border-amber-500' :
                        tier.id === 'silver' ? 'bg-slate-400/10 text-slate-400 border-slate-400' :
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500'
                      }`}
                    >
                      {tier.name}
                    </Badge>
                    <div className="text-3xl font-bold mb-1">£{tier.price}</div>
                    <p className="text-sm text-muted-foreground mb-4">per month</p>
                    <div className="text-sm font-medium">
                      {typeof tier.products === 'number' ? `Up to ${tier.products} products` : tier.products + ' products'}
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <Button 
                    className="w-full" 
                    variant={tier.id === 'gold' ? 'default' : 'outline'}
                    disabled={createSubscriptionMutation.isPending}
                    data-testid={`button-select-tier-${tier.id}`}
                  >
                    {createSubscriptionMutation.isPending && selectedTier === tier.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirecting to payment...
                      </>
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Trial Active or Expired - Show tier options */}
      {(isTrialActive || isTrialExpired) && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-2">
            {isTrialActive ? 'Choose Your Plan' : 'Select a Subscription Tier'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isTrialActive 
              ? 'Your trial ends soon. Select a plan to continue adding products.'
              : 'Your trial has expired. Choose a tier to continue adding your own products.'}
          </p>
          
          {/* Licence Benefits */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-2">Licence Benefits</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Keep selling your own products through our EPOS system and online marketplace.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Add and sell your own products via the POS</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Keep 100% of profits on your own products</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Full inventory management for your products</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Priority support from your dedicated accounts manager</span>
              </li>
            </ul>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {tierOptions.map((tier) => (
              <Card 
                key={tier.id} 
                className={`p-6 relative overflow-visible hover-elevate cursor-pointer transition-all ${
                  tier.id === 'gold' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                }`}
                onClick={() => handleSelectTier(tier.id)}
              >
                {tier.id === 'gold' && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded-bl">
                    Best Value
                  </div>
                )}
                <div className="text-center">
                  <Badge 
                    variant="outline" 
                    className={`mb-3 ${
                      tier.id === 'bronze' ? 'bg-amber-500/10 text-amber-600 border-amber-500' :
                      tier.id === 'silver' ? 'bg-slate-400/10 text-slate-400 border-slate-400' :
                      'bg-yellow-500/10 text-yellow-600 border-yellow-500'
                    }`}
                  >
                    {tier.name}
                  </Badge>
                  <div className="text-3xl font-bold mb-1">£{tier.price}</div>
                  <p className="text-sm text-muted-foreground mb-4">per month</p>
                  <div className="text-sm font-medium">
                    {typeof tier.products === 'number' ? `Up to ${tier.products} products` : tier.products + ' products'}
                  </div>
                </div>
                <Separator className="my-4" />
                <Button 
                  className="w-full" 
                  variant={tier.id === 'gold' ? 'default' : 'outline'}
                  disabled={createSubscriptionMutation.isPending}
                  data-testid={`button-select-tier-${tier.id}`}
                >
                  {createSubscriptionMutation.isPending && selectedTier === tier.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecting to payment...
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Active Subscription - Show upgrade options */}
      {isActive && licence?.tier !== 'gold' && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-2">Upgrade Your Plan</h3>
          <p className="text-muted-foreground mb-6">
            Need more products? Upgrade to a higher tier for increased limits.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {tierOptions
              .filter(tier => {
                const currentTierIndex = tierOptions.findIndex(t => t.id === licence.tier);
                const tierIndex = tierOptions.findIndex(t => t.id === tier.id);
                return tierIndex > currentTierIndex;
              })
              .map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`p-6 hover-elevate cursor-pointer ${
                    tier.id === 'gold' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                  }`}
                  onClick={() => handleSelectTier(tier.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge 
                        variant="outline" 
                        className={`mb-2 ${
                          tier.id === 'silver' ? 'bg-slate-400/10 text-slate-400 border-slate-400' :
                          'bg-yellow-500/10 text-yellow-600 border-yellow-500'
                        }`}
                      >
                        {tier.name}
                      </Badge>
                      <div className="text-2xl font-bold">£{tier.price}/mo</div>
                      <p className="text-sm text-muted-foreground">
                        {typeof tier.products === 'number' ? `Up to ${tier.products} products` : tier.products + ' products'}
                      </p>
                    </div>
                    <Button 
                      variant={tier.id === 'gold' ? 'default' : 'outline'}
                      disabled={createSubscriptionMutation.isPending}
                      data-testid={`button-upgrade-tier-${tier.id}`}
                    >
                      Upgrade
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </Card>
      )}

    </div>
  );
}

// Earnings Breakdown Panel - Differentiates own product revenue from catalogue commission
function EarningsBreakdownPanel() {
  const { data: breakdown, isLoading, isError, refetch } = useQuery<{
    hasVendorAccess: boolean;
    vendorTier: string | null;
    ownProducts: {
      totalRevenue: string;
      totalOrders: number;
      totalItemsSold: number;
      description: string;
    };
    catalogue: {
      totalCommission: string;
      totalRevenue: string;
      commissionRate: string;
      totalOrders: number;
      totalItemsSold: number;
      description: string;
    };
    combined: {
      totalEarnings: string;
      totalRevenue: string;
      totalOrders: number;
    };
  }>({
    queryKey: ['/api/reseller/earnings/breakdown'],
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading earnings breakdown...</span>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-semibold mb-1">Unable to load earnings breakdown</h3>
          <p className="text-sm text-muted-foreground mb-4">There was an issue fetching your earnings data.</p>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-retry-earnings">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  const ownRevenue = parseFloat(breakdown?.ownProducts?.totalRevenue || '0');
  const catalogueCommission = parseFloat(breakdown?.catalogue?.totalCommission || '0');
  const totalEarnings = parseFloat(breakdown?.combined?.totalEarnings || '0');
  
  // Calculate percentages
  const ownPercentage = totalEarnings > 0 ? (ownRevenue / totalEarnings) * 100 : 0;
  const commissionPercentage = totalEarnings > 0 ? (catalogueCommission / totalEarnings) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-full bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Earnings Breakdown</h2>
          <p className="text-sm text-muted-foreground">
            See how your earnings split between your own products and catalogue commission
          </p>
        </div>
      </div>

      {/* Total Earnings */}
      <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Earnings</span>
          <span className="text-2xl font-bold text-primary" data-testid="earnings-total">
            £{totalEarnings.toFixed(2)}
          </span>
        </div>
        {totalEarnings > 0 && (
          <div className="mt-3">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              {ownPercentage > 0 && (
                <div 
                  className="bg-green-500 transition-all" 
                  style={{ width: `${ownPercentage}%` }}
                />
              )}
              {commissionPercentage > 0 && (
                <div 
                  className="bg-blue-500 transition-all" 
                  style={{ width: `${commissionPercentage}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Own Products {ownPercentage.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Catalogue {commissionPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Own Products Revenue */}
        <Card className="p-4 border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold text-green-600">Your Products</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Revenue (100% yours)</span>
              <span className="font-bold text-green-600" data-testid="earnings-own-revenue">
                £{ownRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Orders</span>
              <span data-testid="earnings-own-orders">{breakdown?.ownProducts?.totalOrders || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items Sold</span>
              <span data-testid="earnings-own-items">{breakdown?.ownProducts?.totalItemsSold || 0}</span>
            </div>
          </div>
        </Card>

        {/* Catalogue Commission */}
        <Card className="p-4 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Store className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-blue-600">Catalogue Commission</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Commission Earned</span>
              <span className="font-bold text-blue-600" data-testid="earnings-catalogue-commission">
                £{catalogueCommission.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sales Value</span>
              <span data-testid="earnings-catalogue-sales">
                £{parseFloat(breakdown?.catalogue?.totalRevenue || '0').toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commission Rate</span>
              <span data-testid="earnings-catalogue-rate">{breakdown?.catalogue?.commissionRate || '10'}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Orders</span>
              <span data-testid="earnings-catalogue-orders">{breakdown?.catalogue?.totalOrders || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items Sold</span>
              <span data-testid="earnings-catalogue-items">{breakdown?.catalogue?.totalItemsSold || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Your products = 100% revenue to you | Catalogue products = commission after platform fees
      </p>
    </Card>
  );
}

export default function ResellerDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [requestStockOpen, setRequestStockOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch authenticated user
  // (useEffect for auth redirect is below, after all hooks are declared)
  const { data: authUser } = useQuery<{ user: { id: string; email: string; role: string } }>({
    queryKey: ['/api/auth/me'],
  });

  // Fetch B2B capabilities
  const { 
    canRequestStock, 
    canViewAnalytics, 
    canProcessEpos,
    canManageStorefront 
  } = useB2BCapabilities();

  // Fetch reseller dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery<any>({
    queryKey: ["/api/reseller/dashboard"],
  });

  // Redirect to login on 401 — must be in useEffect, NOT during render, to avoid React warnings
  useEffect(() => {
    if (!dashboardError) return;
    const msg = (dashboardError as any)?.message || "";
    if (msg.includes("401") || msg.includes("Not authenticated")) {
      navigate("/reseller/login");
    }
  }, [dashboardError, navigate]);

  // Handle return redirects from OAuth / Stripe Connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");

    // Auto-switch tab if specified in URL
    if (tab) setSelectedTab(tab);

    // Square OAuth result
    if (params.get("square_connected") === "1") {
      toast({
        title: "Square connected! 🎉",
        description: "Your Square account is linked. Customers can now pay by card at your EPOS.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("square_error")) {
      const err = params.get("square_error");
      toast({
        title: "Square connection failed",
        description: err === "access_denied" ? "You cancelled the Square authorisation." : `Error: ${err}`,
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Stripe Connect result
    if (params.get("stripe_success") === "true") {
      toast({
        title: "Stripe onboarding complete",
        description: "Your Stripe account has been connected. Refreshing status…",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("stripe_refresh") === "true") {
      toast({
        title: "Stripe onboarding not complete",
        description: "Please complete the Stripe onboarding to enable direct card payments.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Fetch inventory
  const { data: inventory = [], isLoading: inventoryLoading, error: inventoryError } = useQuery<any[]>({
    queryKey: ["/api/reseller/inventory"],
    enabled: !!dashboardData && !dashboardData.error, // Only fetch if dashboard loaded successfully
  });

  // Fetch B2B orders (stock requests to 1stRep)
  const { data: b2bOrders = [], isLoading: b2bOrdersLoading, error: b2bOrdersError } = useQuery<any[]>({
    queryKey: ["/api/reseller/b2b-orders"],
    enabled: !!dashboardData && !dashboardData.error,
  });

  // Fetch reseller customer orders (storefront sales)
  const { data: customerOrders = [], isLoading: ordersLoading, error: ordersError } = useQuery<any[]>({
    queryKey: ["/api/reseller/orders"],
    enabled: !!dashboardData && !dashboardData.error,
  });

  // Fetch order stats
  const { data: orderStats } = useQuery<any>({
    queryKey: ["/api/reseller/orders/stats/summary"],
    enabled: !!dashboardData && !dashboardData.error,
  });

  // Fetch stock alerts
  const { data: alerts = [], isLoading: alertsLoading, error: alertsError } = useQuery<any[]>({
    queryKey: ["/api/reseller/alerts"],
    enabled: !!dashboardData && !dashboardData.error, // Only fetch if dashboard loaded successfully
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery<any>({
    queryKey: ["/api/reseller/analytics"],
    enabled: !!dashboardData && !dashboardData.error,
  });

  // Fetch vendor dashboard data (if reseller has vendor access)
  const { data: vendorDashboardData, isLoading: vendorDashboardLoading } = useQuery<any>({
    queryKey: ["/api/vendor/dashboard"],
    enabled: !!dashboardData && !dashboardData.error,
  });

  // Check if reseller has vendor access
  const hasVendorAccess = vendorDashboardData && !vendorDashboardData.error;

  // Fetch vendor products if they have vendor access
  const { data: vendorProducts = [], isLoading: vendorProductsLoading } = useQuery<any[]>({
    queryKey: ["/api/vendor/products"],
    enabled: hasVendorAccess,
  });

  // Fetch 1stRep storefront products (products available to resell)
  const { data: storefrontProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/reseller/storefront/products"],
    enabled: !!dashboardData && !dashboardData.error,
  });

  // Fetch categories for product creation (if reseller has vendor access)
  const { data: categories = [], refetch: refetchCategories } = useQuery<any[]>({
    queryKey: ["/api/vendor/categories"],
    enabled: hasVendorAccess,
  });

  // Category management state
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });

  // Reset category form
  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', imageUrl: '' });
  };

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      const response = await apiRequest('POST', '/api/vendor/categories', data);
      return response.json();
    },
    onSuccess: () => {
      refetchCategories();
      setShowCreateCategory(false);
      resetCategoryForm();
      toast({
        title: 'Category Created!',
        description: 'Your category has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create category',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Product management state
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [showVariantsDialog, setShowVariantsDialog] = useState(false);
  const [showAddVariantDialog, setShowAddVariantDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    basePrice: '',
    imageUrl: ''
  });
  const [variantForm, setVariantForm] = useState({
    size: '',
    color: '',
    sku: '',
    price: '',
    stock: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch variants for selected product
  const { data: variants = [], refetch: refetchVariants } = useQuery<any[]>({
    queryKey: ['/api/vendor/products', selectedProduct?.id, 'variants'],
    enabled: !!selectedProduct,
  });

  // Reset product form
  const resetProductForm = () => {
    setProductForm({ name: '', description: '', category: '', basePrice: '', imageUrl: '' });
    setImagePreview(null);
  };

  // Handle image file upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive"
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/vendor/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setProductForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
      toast({
        title: "Image uploaded",
        description: "Your product image has been uploaded successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Create vendor product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      const response = await apiRequest('POST', '/api/vendor/products', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/licence'] });
      setShowAddProductDialog(false);
      resetProductForm();
      toast({
        title: 'Product Added!',
        description: 'Your product has been added to the marketplace.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add product',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.basePrice) {
      toast({
        title: 'Missing required fields',
        description: 'Please enter at least a product name and price.',
        variant: 'destructive'
      });
      return;
    }
    createProductMutation.mutate(productForm);
  };

  // Reset variant form
  const resetVariantForm = () => {
    setVariantForm({ size: '', color: '', sku: '', price: '', stock: '' });
  };

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/vendor/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      setShowEditProductDialog(false);
      setSelectedProduct(null);
      resetProductForm();
      toast({ title: 'Product Updated!', description: 'Your product has been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update product', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/vendor/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      toast({ title: 'Product Deleted', description: 'The product has been removed.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete product', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/vendor/products/${data.vendorProductId}/variants`, {
        size: data.size || null,
        color: data.color || null,
        sku: data.sku || null,
        price: data.price,
        stockQuantity: parseInt(data.stock) || 0
      });
      return response.json();
    },
    onSuccess: () => {
      refetchVariants();
      setShowAddVariantDialog(false);
      resetVariantForm();
      toast({ title: 'Variant Added!', description: 'The product variant has been created.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add variant', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/vendor/products/variants/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchVariants();
      toast({ title: 'Variant Updated', description: 'The variant has been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update variant', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/vendor/products/variants/${id}`);
      return response.json();
    },
    onSuccess: () => {
      refetchVariants();
      toast({ title: 'Variant Deleted', description: 'The variant has been removed.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete variant', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  });

  // Open variants dialog
  const openVariantsDialog = (product: any) => {
    setSelectedProduct(product);
    setShowVariantsDialog(true);
  };

  // Open edit product dialog
  const openEditProductDialog = (product: any) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      basePrice: product.basePrice,
      imageUrl: product.imageUrl || ''
    });
    setShowEditProductDialog(true);
  };

  // Real-time socket connection for licence updates
  const resellerId = dashboardData?.reseller?.id;
  useSocket({
    resellerId: resellerId,
    onLicenceUpdate: (event) => {
      console.log('📜 Licence update received:', event);
      // Refresh licence data when we receive an update
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/licence'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/capabilities'] });
      
      if (event.type === 'trial_approved') {
        toast({
          title: 'Trial Approved!',
          description: 'Your 30-day free trial has been approved. You can now add your own products!',
        });
      } else if (event.type === 'trial_rejected') {
        toast({
          title: 'Trial Request Rejected',
          description: 'Your trial request was not approved. Please contact support for more information.',
          variant: 'destructive'
        });
      }
    }
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        // Clear the entire query cache to ensure user state is reset
        queryClient.clear();
        toast({ title: "Logged out successfully" });
        navigate("/reseller/login");
      }
    } catch (error) {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-blue-500";
      case "shipped": return "bg-purple-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getLowStockItems = () => {
    return inventory.filter((item: any) => item.quantity <= item.reorderLevel);
  };

  // Handle authentication errors
  if (dashboardError) {
    const errorMessage = (dashboardError as any)?.message || "An error occurred";
    const is401 = errorMessage.includes("401") || errorMessage.includes("Not authenticated");
    const is403 = errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("rejected");
    
    if (is401) {
      return null; // navigation handled by useEffect above
    }

    if (is403) {
      return (
        <div className="min-h-screen bg-background">
          <div className="border-b border-border bg-card">
            <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">Reseller Portal</h1>
                <Button onClick={handleLogout} variant="outline" className="min-h-11 w-full md:w-auto" data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
          
          <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
            <Card className="p-8 md:p-12 text-center border-red-500">
              <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-red-500">Application Rejected</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Your reseller application has been rejected. Please contact support for more information.
              </p>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold">Reseller Portal</h1>
              <Button onClick={handleLogout} variant="outline" className="min-h-11 w-full md:w-auto" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <Card className="p-8 md:p-12 text-center">
            <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">Error Loading Dashboard</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-4">
              {errorMessage}
            </p>
            <Button onClick={() => window.location.reload()} className="min-h-11">Retry</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if reseller is pending approval
  if (dashboardData?.error === "Reseller pending approval") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold">Reseller Portal</h1>
              <Button onClick={handleLogout} variant="outline" className="min-h-11 w-full md:w-auto" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <Card className="p-8 md:p-12 text-center">
            <Clock className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">Application Pending</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              Your reseller application is currently under review. You will receive an email once your application has been approved.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const reseller = dashboardData?.reseller || {};
  const metrics = dashboardData?.metrics || {};

  // Use dark theme when reseller has vendor access (licensed)
  const useDarkTheme = hasVendorAccess;

  return (
    <div className={`min-h-screen ${useDarkTheme ? 'bg-black text-white' : 'bg-background'}`}>
      {/* Header - Vendor-style when licensed */}
      <div className={`border-b ${useDarkTheme ? 'border-zinc-800 bg-zinc-900/50 backdrop-blur-xl' : 'border-border bg-card'} sticky top-0 z-50`}>
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl md:text-4xl font-bold ${useDarkTheme ? 'bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent' : ''}`} data-testid="dashboard-title">
                {reseller.businessName || "Reseller Portal"}
              </h1>
              <p className={`mt-1 ${useDarkTheme ? 'text-zinc-400' : 'text-muted-foreground'}`} data-testid="business-name">
                Manage your products and reseller network
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="default" className="min-h-8" data-testid="status-badge">
                approved
              </Badge>
              <Badge variant="secondary" className={`text-base px-3 py-1 min-h-8 ${useDarkTheme ? 'bg-emerald-600 text-white' : ''}`} data-testid="tier-badge">
                {reseller.tier?.charAt(0).toUpperCase() + reseller.tier?.slice(1)} Tier
              </Badge>
              <NotificationCenter resellerId={reseller.id} />
              {canProcessEpos ? (
                <Link href="/reseller/epos">
                  <Button variant="default" className={`min-h-11 ${useDarkTheme ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'}`} data-testid="button-epos-terminal">
                    <Zap className="h-4 w-4 mr-2" />
                    Reseller EPOS
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="min-h-11 opacity-50 cursor-not-allowed" disabled data-testid="button-epos-terminal-disabled">
                  <Zap className="h-4 w-4 mr-2" />
                  EPOS Access Not Granted
                </Button>
              )}
              <Button onClick={handleLogout} variant="outline" className="min-h-11" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="overflow-x-auto mb-8">
            <TabsList className={`inline-flex lg:grid lg:w-full ${hasVendorAccess ? "lg:grid-cols-13" : "lg:grid-cols-11"} min-h-12 w-max lg:w-full ${useDarkTheme ? 'bg-zinc-900 border border-zinc-800' : ''}`}>
              <TabsTrigger value="overview" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="storefront" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-storefront">
                <Store className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Storefront</span>
                <span className="sm:hidden">Store</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-inventory">Inventory</TabsTrigger>
              <TabsTrigger value="orders" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-orders">Orders</TabsTrigger>
              <TabsTrigger value="earnings" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-earnings">
                <Wallet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Earnings</span>
                <span className="sm:hidden">Earn</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-pricing">Pricing</TabsTrigger>
              <TabsTrigger value="messages" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Messages</span>
                <span className="sm:hidden">Msgs</span>
              </TabsTrigger>
              <TabsTrigger value="licensing" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-licensing">
                <Key className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Licensing</span>
                <span className="sm:hidden">Licence</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-settings">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </TabsTrigger>
              <TabsTrigger value="guide" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-guide">
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Guide</span>
                <span className="sm:hidden">Help</span>
              </TabsTrigger>
              {hasVendorAccess && (
                <>
                  <TabsTrigger value="vendor-products" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-vendor-products">
                    <Package className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">My Products</span>
                    <span className="sm:hidden">Products</span>
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="min-h-11 text-sm md:text-base whitespace-nowrap" data-testid="tab-categories">
                    <Store className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Categories</span>
                    <span className="sm:hidden">Cats</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics - Vendor style when licensed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className={`p-6 ${useDarkTheme ? 'bg-zinc-900 border-zinc-800' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${useDarkTheme ? 'text-zinc-400' : 'text-muted-foreground'}`}>Catalogue Products</p>
                    <p className="text-3xl font-bold" data-testid="total-products">
                      {(storefrontProducts?.length || 0) + (vendorProducts?.length || 0)}
                    </p>
                    <p className={`text-xs mt-1 ${useDarkTheme ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                      {storefrontProducts?.length || 0} 1stRep • {vendorProducts?.length || 0} own
                    </p>
                  </div>
                  <Package className="w-10 h-10 text-blue-500" />
                </div>
              </Card>

              <Card className={`p-6 ${useDarkTheme ? 'bg-zinc-900 border-zinc-800' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${useDarkTheme ? 'text-zinc-400' : 'text-muted-foreground'}`}>Commission Earned</p>
                    <p className="text-3xl font-bold text-green-500" data-testid="commission-earned">
                      £{parseFloat(orderStats?.totalEarnings || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs mt-1 ${useDarkTheme ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                      From storefront & EPOS sales
                    </p>
                  </div>
                  <PoundSterling className="w-10 h-10 text-green-500" />
                </div>
              </Card>

              <Card className={`p-6 ${useDarkTheme ? 'bg-zinc-900 border-zinc-800' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${useDarkTheme ? 'text-zinc-400' : 'text-muted-foreground'}`}>Total Orders</p>
                    <p className="text-3xl font-bold" data-testid="total-orders">
                      {orderStats?.totalOrders ?? metrics.totalOrders ?? 0}
                    </p>
                  </div>
                  <ShoppingCart className="w-10 h-10 text-purple-500" />
                </div>
              </Card>

              <Card className={`p-6 ${useDarkTheme ? 'bg-zinc-900 border-zinc-800' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${useDarkTheme ? 'text-zinc-400' : 'text-muted-foreground'}`}>Stock Alerts</p>
                    <p className="text-3xl font-bold text-yellow-500" data-testid="stock-alerts">
                      {getLowStockItems().length}
                    </p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-yellow-500" />
                </div>
              </Card>
            </div>

            {/* Licence Access Active Card */}
            {hasVendorAccess && (
              <Card className={`border-2 ${useDarkTheme ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-700/50' : 'border-green-500/20'}`}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${useDarkTheme ? 'bg-emerald-500/20' : 'bg-green-500/10'}`}>
                        <Store className={`w-8 h-8 ${useDarkTheme ? 'text-emerald-400' : 'text-green-500'}`} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${useDarkTheme ? 'text-white' : ''}`}>
                          Reseller Access Active
                        </h3>
                        <p className={useDarkTheme ? 'text-zinc-400 mt-1' : 'text-muted-foreground mt-1'}>
                          You have full access to sell 1stRep products at wholesale prices
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white" data-testid="badge-access-active">
                      <Check className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </Card>
            )}

            {/* Features Row */}
            {hasVendorAccess && (
              <div className={`flex flex-wrap items-center justify-center gap-4 md:gap-8 py-4 px-6 rounded-lg ${useDarkTheme ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-muted/50'}`} data-testid="features-row">
                <div className="flex items-center gap-2" data-testid="feature-wholesale-pricing">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className={useDarkTheme ? 'text-zinc-300' : ''}>Wholesale Pricing</span>
                </div>
                <div className="flex items-center gap-2" data-testid="feature-epos-terminal">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className={useDarkTheme ? 'text-zinc-300' : ''}>EPOS Terminal</span>
                </div>
                <div className="flex items-center gap-2" data-testid="feature-storefront">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className={useDarkTheme ? 'text-zinc-300' : ''}>Your Own Storefront</span>
                </div>
                <div className="flex items-center gap-2" data-testid="feature-stock-management">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className={useDarkTheme ? 'text-zinc-300' : ''}>Stock Management</span>
                </div>
                {hasVendorAccess && (
                  <div className="flex items-center gap-2" data-testid="feature-add-own-products">
                    <Check className="w-4 h-4 text-purple-500" />
                    <span className={useDarkTheme ? 'text-purple-300' : 'text-purple-600'}>Add Own Products</span>
                  </div>
                )}
              </div>
            )}

            {/* Credit Usage */}
            <Card className={`p-6 ${useDarkTheme ? 'bg-zinc-900 border-zinc-800' : ''}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${useDarkTheme ? 'text-white' : ''}`}>Credit Usage</h3>
                  <span className={`text-sm ${useDarkTheme ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                    £{(reseller.currentCredit || 0).toFixed(2)} / £{(reseller.creditLimit || 0).toFixed(2)}
                  </span>
                </div>
                <Progress 
                  value={reseller.creditLimit > 0 ? (reseller.currentCredit / reseller.creditLimit) * 100 : 0} 
                  className="w-full"
                  data-testid="credit-progress"
                />
              </div>
            </Card>

          </TabsContent>

          {/* Storefront Tab */}
          <TabsContent value="storefront" className="space-y-6">
            {canManageStorefront ? (
              <StorefrontManagement />
            ) : (
              <Card className="p-12 text-center border-amber-500/50" data-testid="card-storefront-no-access">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-xl font-semibold mb-2">Storefront Access Not Granted</h3>
                <p className="text-muted-foreground">
                  You don't have permission to manage your storefront. Please contact the admin to request access.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-xl md:text-2xl font-bold">Inventory Management</h2>
              {canRequestStock ? (
                <Button onClick={() => setRequestStockOpen(true)} className="min-h-11 w-full sm:w-auto" data-testid="button-request-stock">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Stock
                </Button>
              ) : (
                <Badge variant="outline" className="border-amber-500 text-amber-500 px-3 py-1" data-testid="no-request-stock-access">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Stock Request Access Not Granted
                </Badge>
              )}
            </div>

            {/* Pending Stock Requests Section */}
            {b2bOrdersLoading ? (
              <Card className="p-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-muted-foreground">Loading stock requests...</p>
              </Card>
            ) : b2bOrders.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Pending Stock Requests</h3>
                  <p className="text-sm text-muted-foreground">Track your inventory orders from 1stRep</p>
                </div>
                {b2bOrders.map((order: any) => (
                  <Card key={order.id} className="p-6 hover-elevate" data-testid={`b2b-order-${order.id}`}>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-lg" data-testid={`order-number-${order.id}`}>
                              {order.orderNumber}
                            </p>
                            <Badge 
                              className={`${
                                order.status === "delivered" ? "bg-green-500" :
                                order.status === "shipped" ? "bg-blue-500" :
                                order.status === "confirmed" ? "bg-yellow-600" :
                                "bg-gray-500"
                              } text-white`}
                              data-testid={`order-status-${order.id}`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            {order.paymentMethod === "pay_now" && (
                              <Badge variant="outline" className="border-blue-500 text-blue-600">
                                Paid Upfront
                              </Badge>
                            )}
                            {order.paymentMethod === "credit" && (
                              <Badge variant="outline" className="border-purple-500 text-purple-600">
                                Credit
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Ordered: {new Date(order.orderDate).toLocaleDateString()}</p>
                            {order.trackingNumber && (
                              <p>Tracking: <span className="font-medium text-foreground">{order.trackingNumber}</span></p>
                            )}
                            {order.shippedDate && (
                              <p>Shipped: {new Date(order.shippedDate).toLocaleDateString()}</p>
                            )}
                            {order.deliveredDate && (
                              <p>Delivered: {new Date(order.deliveredDate).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-muted-foreground">Order Total</p>
                          <p className="text-2xl font-bold" data-testid={`order-total-${order.id}`}>
                            £{parseFloat(order.totalAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Order Status Timeline */}
                      <div className="flex items-center gap-2 pt-2">
                        <div className={`flex items-center gap-2 ${order.status !== "pending" ? "text-green-600" : "text-muted-foreground"}`}>
                          <div className={`h-3 w-3 rounded-full ${order.status !== "pending" ? "bg-green-600" : "bg-muted"}`}></div>
                          <span className="text-xs font-medium">Pending</span>
                        </div>
                        <div className={`flex-1 h-0.5 ${order.status === "confirmed" || order.status === "shipped" || order.status === "delivered" ? "bg-green-600" : "bg-muted"}`}></div>
                        <div className={`flex items-center gap-2 ${order.status === "confirmed" || order.status === "shipped" || order.status === "delivered" ? "text-green-600" : "text-muted-foreground"}`}>
                          <div className={`h-3 w-3 rounded-full ${order.status === "confirmed" || order.status === "shipped" || order.status === "delivered" ? "bg-green-600" : "bg-muted"}`}></div>
                          <span className="text-xs font-medium">Confirmed</span>
                        </div>
                        <div className={`flex-1 h-0.5 ${order.status === "shipped" || order.status === "delivered" ? "bg-green-600" : "bg-muted"}`}></div>
                        <div className={`flex items-center gap-2 ${order.status === "shipped" || order.status === "delivered" ? "text-green-600" : "text-muted-foreground"}`}>
                          <div className={`h-3 w-3 rounded-full ${order.status === "shipped" || order.status === "delivered" ? "bg-green-600" : "bg-muted"}`}></div>
                          <span className="text-xs font-medium">Shipped</span>
                        </div>
                        <div className={`flex-1 h-0.5 ${order.status === "delivered" ? "bg-green-600" : "bg-muted"}`}></div>
                        <div className={`flex items-center gap-2 ${order.status === "delivered" ? "text-green-600" : "text-muted-foreground"}`}>
                          <div className={`h-3 w-3 rounded-full ${order.status === "delivered" ? "bg-green-600" : "bg-muted"}`}></div>
                          <span className="text-xs font-medium">Delivered</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Separator />
              </div>
            )}

            {/* Current Inventory Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Inventory</h3>
              {inventoryError ? (
              <Card className="p-8 md:p-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-base md:text-lg font-semibold mb-2">Error Loading Inventory</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4">Failed to load inventory data</p>
                <Button onClick={() => window.location.reload()} className="min-h-11">Retry</Button>
              </Card>
            ) : inventoryLoading ? (
              <Card className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-muted-foreground">Loading inventory...</p>
              </Card>
            ) : inventory.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Inventory Yet</h3>
                <p className="text-muted-foreground">Request stock to start managing your inventory</p>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-semibold">Product</th>
                        <th className="text-left p-4 font-semibold">SKU</th>
                        <th className="text-left p-4 font-semibold">Variant</th>
                        <th className="text-left p-4 font-semibold">Stock</th>
                        <th className="text-left p-4 font-semibold">Wholesale Price</th>
                        <th className="text-left p-4 font-semibold">Your Price</th>
                        <th className="text-left p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item: any) => {
                        const yourPrice = parseFloat(item.wholesalePrice) * (1 - reseller.discountPercentage / 100);
                        return (
                          <tr key={item.id} className="border-b border-border">
                            <td className="p-4">
                              <div>
                                <p className="font-medium" data-testid={`product-name-${item.id}`}>
                                  {item.productName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
                                </p>
                              </div>
                            </td>
                            <td className="p-4 text-sm font-mono">{item.sku}</td>
                            <td className="p-4">
                              <div className="text-sm">
                                <div>{item.size}</div>
                                <div className="text-muted-foreground">{item.color}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <span 
                                  className={`font-medium ${item.quantity <= item.reorderLevel ? 'text-red-500' : 'text-foreground'}`}
                                  data-testid={`stock-quantity-${item.id}`}
                                >
                                  {item.quantity}
                                </span>
                                {item.quantity <= item.reorderLevel && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Reorder at {item.reorderLevel}
                              </p>
                            </td>
                            <td className="p-4 font-medium">£{parseFloat(item.wholesalePrice).toFixed(2)}</td>
                            <td className="p-4 font-medium text-primary">£{yourPrice.toFixed(2)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="min-h-11 min-w-11"
                                  onClick={() => toast({ title: "View details feature coming soon" })}
                                  data-testid={`button-view-${item.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  className="min-h-11 min-w-11"
                                  onClick={() => toast({ title: "Reorder feature coming soon" })}
                                  data-testid={`button-reorder-${item.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            </div>
          </TabsContent>

          {/* Orders Tab - Storefront Sales */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Storefront Sales</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Orders placed through your reseller storefront
                </p>
              </div>
            </div>

            {/* Order Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold" data-testid="stats-total-orders">
                    {orderStats?.totalOrders ?? 0}
                  </p>
                </div>
              </Card>
              <Card className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="stats-total-revenue">
                    £{parseFloat(orderStats?.totalRevenue || "0").toFixed(2)}
                  </p>
                </div>
              </Card>
              <Card className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Your Earnings</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="stats-total-earnings">
                    £{parseFloat(orderStats?.totalEarnings || "0").toFixed(2)}
                  </p>
                </div>
              </Card>
              <Card className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-yellow-600" data-testid="stats-pending-orders">
                    {orderStats?.pendingOrders ?? 0}
                  </p>
                </div>
              </Card>
            </div>

            {ordersError ? (
              <Card className="p-8 md:p-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-base md:text-lg font-semibold mb-2">Error Loading Orders</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4">Failed to load order history</p>
                <Button onClick={() => window.location.reload()} className="min-h-11" data-testid="button-retry">
                  Retry
                </Button>
              </Card>
            ) : ordersLoading ? (
              <Card className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-muted-foreground">Loading orders...</p>
              </Card>
            ) : customerOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground">
                  Share your storefront link with customers to start receiving orders
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {customerOrders.map((order: any) => (
                  <Card key={order.id} className="p-6 hover-elevate">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="font-semibold text-lg" data-testid={`order-number-${order.id}`}>
                              {order.orderNumber}
                            </p>
                            <Badge 
                              className={`${getStatusColor(order.status)} text-white`}
                              data-testid={`order-status-${order.id}`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {order.orderType === 'epos' ? 'EPOS' : 'Storefront'}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Customer: <span className="font-medium text-foreground">{order.customerName}</span></p>
                            <p>Email: <span className="text-foreground">{order.customerEmail}</span></p>
                            {order.phoneNumber && (
                              <p>Phone: <span className="text-foreground">{order.phoneNumber}</span></p>
                            )}
                            {order.shippingAddress && (
                              <p>Ship to: <span className="text-foreground">{order.shippingAddress}</span></p>
                            )}
                            {order.billingAddress && order.billingAddress !== order.shippingAddress && (
                              <p>Bill to: <span className="text-foreground">{order.billingAddress}</span></p>
                            )}
                            <p>Order Date: {new Date(order.orderDate).toLocaleDateString('en-GB')}</p>
                            {order.trackingNumber && (
                              <p>Tracking: <span className="font-medium text-foreground">{order.trackingNumber}</span></p>
                            )}
                            {order.notes && (
                              <p>Notes: <span className="text-foreground">{order.notes}</span></p>
                            )}
                            {(() => {
                              const subtotal = parseFloat(order.subtotal || order.totalAmount || "0");
                              const total = parseFloat(order.totalAmount || "0");
                              const discount = subtotal - total;
                              if (discount > 0.005) {
                                return (
                                  <p className="text-green-600 font-medium">
                                    Discount applied: -£{discount.toFixed(2)}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {order.items && order.items.length > 0 && (() => {
                            const catalogueItems = order.items.filter((i: any) => !i.vendorProductId);
                            const ownItems = order.items.filter((i: any) => i.vendorProductId);
                            const isMixed = catalogueItems.length > 0 && ownItems.length > 0;

                            const renderItems = (itemList: any[]) => itemList.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-cover rounded-md border border-border flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{item.productName}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {[item.size, item.color].filter(Boolean).join(' · ')}{item.size || item.color ? ' · ' : ''}Qty: {item.quantity}
                                  </p>
                                </div>
                                <p className="font-medium text-foreground flex-shrink-0">
                                  £{parseFloat(item.totalPrice).toFixed(2)}
                                </p>
                              </div>
                            ));

                            return (
                              <div className="mt-3 pt-3 border-t border-border space-y-3">
                                {isMixed ? (
                                  <>
                                    <div>
                                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">1stRep Catalogue</p>
                                      <div className="space-y-2">{renderItems(catalogueItems)}</div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wide">Your Own Products</p>
                                      <div className="space-y-2">{renderItems(ownItems)}</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Items Ordered</p>
                                    <div className="space-y-2">{renderItems(order.items)}</div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-right space-y-2 flex-shrink-0">
                          <div>
                            <p className="text-sm text-muted-foreground">Order Total</p>
                            <p className="text-xl font-bold" data-testid={`order-total-${order.id}`}>
                              £{parseFloat(order.totalAmount).toFixed(2)}
                            </p>
                          </div>
                          {(() => {
                            const catalogueItems = (order.items || []).filter((i: any) => !i.vendorProductId);
                            const ownItems = (order.items || []).filter((i: any) => i.vendorProductId);
                            const isMixed = catalogueItems.length > 0 && ownItems.length > 0;
                            const ownTotal = ownItems.reduce((s: number, i: any) => s + parseFloat(i.totalPrice || '0'), 0);
                            const totalEarnings = parseFloat(order.resellerEarnings || '0');
                            const catalogueEarnings = totalEarnings - ownTotal;

                            if (isMixed) {
                              return (
                                <>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Your Earnings</p>
                                    <p className="text-lg font-semibold text-green-600" data-testid={`order-earnings-${order.id}`}>
                                      £{totalEarnings.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-0.5">
                                    <p className="text-emerald-600 dark:text-emerald-400">Own products: £{ownTotal.toFixed(2)} (100%)</p>
                                    <p className="text-blue-600 dark:text-blue-400">Catalogue: £{Math.max(0, catalogueEarnings).toFixed(2)} commission</p>
                                  </div>
                                  {order.platformCommission && parseFloat(order.platformCommission) > 0 && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Platform Fee</p>
                                      <p className="text-sm" data-testid={`order-commission-${order.id}`}>
                                        £{parseFloat(order.platformCommission).toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                </>
                              );
                            }

                            return (
                              <>
                                <div>
                                  <p className="text-sm text-muted-foreground">Your Earnings</p>
                                  <p className="text-lg font-semibold text-green-600" data-testid={`order-earnings-${order.id}`}>
                                    £{totalEarnings.toFixed(2)}
                                  </p>
                                </div>
                                {order.platformCommission && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Platform Fee</p>
                                    <p className="text-sm" data-testid={`order-commission-${order.id}`}>
                                      £{parseFloat(order.platformCommission).toFixed(2)}
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Sales Analytics</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Track your storefront performance, commission earnings, and top-selling products
              </p>
            </div>

            {!canViewAnalytics ? (
              <Card className="p-12 text-center border-amber-500/50" data-testid="card-analytics-no-access">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <h3 className="text-xl font-semibold mb-2">Analytics Access Not Granted</h3>
                <p className="text-muted-foreground">
                  You don't have permission to view analytics. Please contact the admin to request access.
                </p>
              </Card>
            ) : analyticsError ? (
              <Card className="p-12 text-center" data-testid="card-analytics-error">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" data-testid="icon-analytics-error" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-analytics-error-title">Failed to Load Analytics</h3>
                <p className="text-muted-foreground" data-testid="text-analytics-error-message">
                  Unable to load analytics data. Please try again later.
                </p>
              </Card>
            ) : analyticsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              </div>
            ) : analyticsData ? (
              <>
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card className="p-4" data-testid="card-analytics-total-orders">
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold" data-testid="value-analytics-total-orders">
                      {analyticsData.summary?.totalOrders ?? 0}
                    </p>
                  </Card>
                  <Card className="p-4" data-testid="card-analytics-total-revenue">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="value-analytics-total-revenue">
                      £{parseFloat(analyticsData.summary?.totalRevenue || "0").toFixed(2)}
                    </p>
                  </Card>
                  <Card className="p-4" data-testid="card-analytics-total-earnings">
                    <p className="text-sm text-muted-foreground">Your Earnings</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="value-analytics-total-earnings">
                      £{parseFloat(analyticsData.summary?.totalEarnings || "0").toFixed(2)}
                    </p>
                  </Card>
                  <Card className="p-4" data-testid="card-analytics-avg-order">
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold" data-testid="value-analytics-avg-order">
                      £{parseFloat(analyticsData.summary?.averageOrderValue || "0").toFixed(2)}
                    </p>
                  </Card>
                  <Card className="p-4" data-testid="card-analytics-unique-customers">
                    <p className="text-sm text-muted-foreground">Unique Customers</p>
                    <p className="text-2xl font-bold" data-testid="value-analytics-unique-customers">
                      {analyticsData.summary?.uniqueCustomers ?? 0}
                    </p>
                  </Card>
                </div>

                {/* Commission Breakdown */}
                <Card className="p-6" data-testid="card-commission-breakdown">
                  <h3 className="text-lg font-semibold mb-4">Commission Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div data-testid="metric-commission-total-container">
                      <p className="text-sm text-muted-foreground">Total Commission</p>
                      <p className="text-xl font-bold text-green-600" data-testid="value-commission-total">
                        £{parseFloat(analyticsData.commissionBreakdown?.totalCommission || "0").toFixed(2)}
                      </p>
                    </div>
                    <div data-testid="metric-commission-rate-container">
                      <p className="text-sm text-muted-foreground">Average Commission Rate</p>
                      <p className="text-xl font-bold" data-testid="value-commission-rate">
                        {analyticsData.commissionBreakdown?.averageCommissionRate || "0"}%
                      </p>
                    </div>
                    <div data-testid="metric-highest-commission-container">
                      <p className="text-sm text-muted-foreground">Highest Commission Order</p>
                      <p className="text-xl font-bold text-blue-600" data-testid="value-highest-commission">
                        £{parseFloat(analyticsData.commissionBreakdown?.highestCommissionOrder || "0").toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Sales Trend */}
                {analyticsData.salesTrend && analyticsData.salesTrend.length > 0 && (
                  <Card className="p-6" data-testid="card-sales-trend">
                    <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
                    <div className="space-y-3">
                      {analyticsData.salesTrend.map((day: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`row-sales-trend-${index}`}>
                          <div className="flex-1">
                            <p className="font-medium" data-testid={`text-trend-date-${index}`}>{new Date(day.date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-trend-orders-${index}`}>{day.orders} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600" data-testid={`text-trend-revenue-${index}`}>£{parseFloat(day.revenue).toFixed(2)}</p>
                            <p className="text-sm text-blue-600" data-testid={`text-trend-earnings-${index}`}>£{parseFloat(day.earnings).toFixed(2)} earned</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Top Products */}
                {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
                  <Card className="p-6" data-testid="card-top-products">
                    <h3 className="text-lg font-semibold mb-4">Top-Selling Products</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4">Product</th>
                            <th className="text-left py-3 px-4">Units Sold</th>
                            <th className="text-right py-3 px-4">Revenue</th>
                            <th className="text-right py-3 px-4">Your Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.topProducts.map((product: any, index: number) => (
                            <tr key={index} className="border-b border-border last:border-0 hover-elevate" data-testid={`row-top-product-${index}`}>
                              <td className="py-3 px-4 font-medium" data-testid={`text-product-name-${index}`}>{product.productName}</td>
                              <td className="py-3 px-4" data-testid={`text-product-sold-${index}`}>{product.totalSold}</td>
                              <td className="text-right py-3 px-4 text-green-600 font-semibold" data-testid={`text-product-revenue-${index}`}>
                                £{parseFloat(product.revenue).toFixed(2)}
                              </td>
                              <td className="text-right py-3 px-4 text-blue-600 font-semibold" data-testid={`text-product-earnings-${index}`}>
                                £{parseFloat(product.earnings).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Empty State */}
                {(!analyticsData.salesTrend || analyticsData.salesTrend.length === 0) && 
                 (!analyticsData.topProducts || analyticsData.topProducts.length === 0) && (
                  <Card className="p-12 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Sales Data Yet</h3>
                    <p className="text-muted-foreground">
                      Start selling through your storefront to see analytics data
                    </p>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>


          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Wholesale Pricing & Credit</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Your wholesale tier determines your discount when ordering 1stRep products and your credit limit for Net Terms orders.
              </p>
            </div>

            {/* Current Account Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Tier</p>
                    <p className="text-xl font-bold text-primary" data-testid="current-tier">
                      {reseller.tier?.charAt(0).toUpperCase() + reseller.tier?.slice(1) || 'Bronze'}
                    </p>
                  </div>
                  <Badge className="text-xs">{reseller.discountPercentage}% off</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Available</p>
                  <p className="text-xl font-bold text-green-600" data-testid="credit-available">
                    £{(parseFloat(reseller.creditLimit || '0') - parseFloat(reseller.currentCredit || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of £{parseFloat(reseller.creditLimit || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} limit
                  </p>
                </div>
              </Card>
              <Card className="p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Used</p>
                  <p className="text-xl font-bold" data-testid="credit-used">
                    £{parseFloat(reseller.currentCredit || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Net Terms outstanding balance
                  </p>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Wholesale Tier Benefits</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Discounts apply to wholesale prices when ordering 1stRep products. Credit limits apply to Net Terms B2B orders.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 border rounded-lg ${reseller.tier === 'bronze' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <h4 className="font-medium text-yellow-600">Bronze Tier</h4>
                    <p className="text-sm font-semibold">10% wholesale discount</p>
                    <p className="text-xs text-muted-foreground mt-1">£1,000 credit limit</p>
                    <p className="text-xs text-muted-foreground">Standard processing</p>
                  </div>
                  <div className={`p-4 border rounded-lg ${reseller.tier === 'silver' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <h4 className="font-medium text-gray-400">Silver Tier</h4>
                    <p className="text-sm font-semibold">15% wholesale discount</p>
                    <p className="text-xs text-muted-foreground mt-1">£2,500 credit limit</p>
                    <p className="text-xs text-muted-foreground">Priority processing</p>
                  </div>
                  <div className={`p-4 border rounded-lg ${reseller.tier === 'gold' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <h4 className="font-medium text-yellow-500">Gold Tier</h4>
                    <p className="text-sm font-semibold">25% wholesale discount</p>
                    <p className="text-xs text-muted-foreground mt-1">£5,000 credit limit</p>
                    <p className="text-xs text-muted-foreground">Dedicated support</p>
                  </div>
                  <div className={`p-4 border rounded-lg ${reseller.tier === 'platinum' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <h4 className="font-medium text-purple-600">Platinum Tier</h4>
                    <p className="text-sm font-semibold">35% wholesale discount</p>
                    <p className="text-xs text-muted-foreground mt-1">£10,000 credit limit</p>
                    <p className="text-xs text-muted-foreground">VIP account manager</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* No inventory message */}
            {inventory.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Wholesale Stock Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Request stock from the Inventory tab to see your wholesale pricing breakdown.
                </p>
                <Button variant="outline" onClick={() => setSelectedTab("inventory")}>
                  View Inventory
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            {reseller.id ? (
              <>
                {/* Earnings Breakdown - Own Products vs Catalogue Commission */}
                <EarningsBreakdownPanel />
                <Separator className="my-6" />
                <EarningsPanel resellerId={reseller.id} />
              </>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Unable to load earnings. Reseller ID not found.</p>
              </Card>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            {reseller.id ? (
              <MessagesPanel resellerId={reseller.id} currentUserId={authUser?.user?.id || ""} />
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Unable to load messages. Reseller ID not found.</p>
              </Card>
            )}
          </TabsContent>

          {/* Licensing Tab */}
          <TabsContent value="licensing" className="space-y-6">
            <LicenceTierPanel resellerId={reseller.id} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">

            {/* EPOS Payment Setup — Square & Stripe Connect */}
            {reseller.id && <EposPaymentSetup resellerId={reseller.id} />}

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
              
              {/* EPOS PIN Settings */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    EPOS PIN Security
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Change your EPOS PIN to secure your point of sale terminal.
                  </p>
                  <EposPinChangeForm />
                </div>
                
                <Separator />
                
                {/* Business Information (Read Only) */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Business Name</Label>
                      <p className="font-medium">{reseller.businessName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contact Person</Label>
                      <p className="font-medium">{reseller.contactPerson}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone Number</Label>
                      <p className="font-medium">{reseller.phoneNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Business Address</Label>
                      <p className="font-medium">{reseller.businessAddress}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-4">
                    To update your business information, please contact support.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-1">Reseller Portal Guide</h2>
              <p className="text-muted-foreground">Everything you need to know to get the most from your 1stRep reseller account.</p>
            </div>

            {/* Platform Web Guides */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Platform Guides</h3>
                  <p className="text-sm text-muted-foreground">Read the full interactive guides for any part of the 1stRep platform</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { slug: "platform-overview", title: "Platform Overview", desc: "Introduction to 1stRep, roles & first-time setup", icon: Globe },
                  { slug: "reseller-b2b", title: "Reseller & Licence Guide", desc: "Reseller programme, EPOS terminal & licensing", icon: ShieldCheck },
                  { slug: "orders-fulfilment", title: "Orders & Fulfilment", desc: "How orders are processed and fulfilled", icon: ShoppingCart },
                  { slug: "products-inventory", title: "Products & Inventory", desc: "Catalogue, stock levels & warehouse ops", icon: Package },
                  { slug: "customer-storefront", title: "Customer Storefront", desc: "How your storefront works for customers", icon: Store },
                  { slug: "influencer-programme", title: "Influencer Programme", desc: "Influencer partnerships & content credits", icon: Users },
                  { slug: "crm-marketing", title: "CRM & Marketing", desc: "Customer management & marketing tools", icon: BarChart3 },
                  { slug: "platform-admin-settings", title: "Admin & Settings", desc: "Platform configuration & team management", icon: Settings },
                ].map(({ slug, title, desc, icon: Icon }) => (
                  <Link key={slug} href={`/guides/${slug}`}>
                    <a className="flex items-start gap-3 p-3 rounded-md border border-border hover-elevate cursor-pointer group">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate">{title}</p>
                          <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Quick Start */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Quick Start — Getting Set Up</h3>
                  <p className="text-sm text-muted-foreground">Complete these steps to start selling</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Check your approval status", desc: "Your account must be Approved before you can sell. Look for the green 'approved' badge at the top of your dashboard." },
                  { step: "2", title: "Set up your storefront", desc: "Go to the Storefront tab. Add your store name, logo, banner, and a custom colour. This is the public-facing shop your customers see." },
                  { step: "3", title: "Browse catalogue products", desc: "In the Inventory tab you'll find all 1stRep products available to you. Products are already priced — your commission is built in." },
                  { step: "4", title: "Share your storefront link", desc: "Your unique storefront URL is shown in the Storefront tab. Share it via WhatsApp, Instagram, email, or anywhere online." },
                  { step: "5", title: "Start selling in-person (optional)", desc: "Use the Reseller EPOS button in the top-right to open the point-of-sale terminal for face-to-face sales." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {step}
                    </div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Dashboard Overview */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Overview Tab — Your Dashboard at a Glance</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">The Overview tab is your home screen. Here's what everything means:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Catalogue Products", desc: "Total number of 1stRep products you can sell, split between platform products and your own." },
                    { label: "Commission Earned", desc: "Your total earnings from both storefront sales and EPOS (face-to-face) sales combined." },
                    { label: "Total Orders", desc: "How many orders have come through your storefront or EPOS terminal to date." },
                    { label: "Stock Alerts", desc: "Products that are low on stock or out of stock. Click to view and subscribe to back-in-stock alerts." },
                    { label: "Reseller Access Active", desc: "Confirms your account is fully enabled. If this shows inactive, contact 1stRep admin." },
                    { label: "Credit Usage", desc: "Shows how much of your available credit limit you have used on wholesale orders." },
                  ].map(({ label, desc }) => (
                    <div key={label} className="p-3 rounded-md bg-muted/40 border border-border">
                      <p className="font-medium">{label}</p>
                      <p className="text-muted-foreground mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Storefront */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Storefront Tab — Your Online Shop</h3>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">Your storefront is a branded online shop unique to you. Customers can browse and buy without needing to contact you directly.</p>
                <div className="space-y-3">
                  {[
                    { title: "Store Branding", desc: "Upload a logo, set a banner image, pick your brand colour, and write a short description. Make it feel like your business." },
                    { title: "Your Storefront URL", desc: "You'll see a link like 1strep.com/store/your-store-name. Share this link with customers anywhere — social media, WhatsApp, email, printed materials." },
                    { title: "Product Visibility", desc: "All 1stRep catalogue products are automatically available in your storefront at your set prices. You can also add your own products if you have a licence." },
                    { title: "Custom Pricing", desc: "In the Pricing tab you can mark products up from their base price. You keep anything above the base — that's your commission." },
                    { title: "Discount Codes", desc: "You can create discount codes for your customers that apply on checkout. Great for promotions and repeat customers." },
                    { title: "QR Code Payments", desc: "Generate a QR code from the EPOS terminal that customers can scan with their phone to pay instantly on your storefront." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Inventory */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold">Inventory Tab — Products &amp; Stock</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">The Inventory tab shows all products available to you from the 1stRep catalogue.</p>
                <div className="space-y-3">
                  {[
                    { title: "Viewing Products", desc: "Browse all available products. Each shows the retail price, your cost, and your profit margin per sale." },
                    { title: "Stock Status", desc: "Products marked 'Out of Stock' cannot be sold until replenished. 'Coming Soon' and 'Pre-Order' products can still be shown to customers." },
                    { title: "Stock Alerts", desc: "Subscribe to back-in-stock notifications for any product. You'll receive an email as soon as stock is replenished." },
                    { title: "Requesting Stock", desc: "If you need products held for you (wholesale), use the Request Stock button. This creates a wholesale order for admin to approve." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Orders */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Orders Tab — Tracking Your Sales</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">Every sale made through your storefront or EPOS terminal appears here.</p>
                <div className="space-y-3">
                  {[
                    { title: "Order Sources", desc: "Orders are labelled as either 'Storefront' (placed online by a customer) or 'EPOS' (processed by you face-to-face). Both count towards your earnings." },
                    { title: "Order Status", desc: "Each order moves through: Pending → Processing → Shipped → Delivered. You can track where every order is at any time." },
                    { title: "Items Ordered", desc: "Click any order to see exactly which products were ordered, the size, colour, quantity, and price for each item." },
                    { title: "Your Earnings Per Order", desc: "Each order card shows your earnings (commission) and the platform fee. Your total is always what's shown as 'Your Earnings'." },
                    { title: "Tracking Numbers", desc: "Once an order is shipped, a tracking number appears on the order card. Share this with your customer so they can follow their delivery." },
                    { title: "Customer Notifications", desc: "Customers receive automatic emails at each stage — order confirmation, despatch, and delivery." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Earnings */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <PoundSterling className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold">Earnings Tab — Getting Paid</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">Track your commission earnings and request payouts from this tab.</p>
                <div className="space-y-3">
                  {[
                    { title: "Available Balance", desc: "Your earnings from all completed (delivered) orders. This is the amount you can request as a payout." },
                    { title: "Requesting a Payout", desc: "Click 'Request Payout' to submit a withdrawal request. Payouts are reviewed and approved by the 1stRep admin team." },
                    { title: "Payout Methods", desc: "You can receive payouts by Bank Transfer (UK) or PayPal. Provide your bank details or PayPal email when submitting your request." },
                    { title: "How Payouts Are Sent", desc: "Once your request is approved by the 1stRep team, payment is sent manually to your bank account or PayPal — usually within 1–2 business days. You'll be notified when it's on its way." },
                    { title: "Commission Rate", desc: "Your commission rate is set by the 1stRep admin. It's the percentage of each sale you keep after the platform fee." },
                    { title: "EPOS Earnings", desc: "For face-to-face sales via your EPOS terminal, you earn commission on catalogue products and keep 100% of your own product sales." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Analytics */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Analytics Tab — Sales Performance</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">Analytics must be enabled by admin. Once active, you'll see detailed performance data.</p>
                <div className="space-y-3">
                  {[
                    { title: "Revenue Over Time", desc: "See a chart of your sales revenue day by day, week by week, or month by month." },
                    { title: "Top Products", desc: "Find out which products are selling best on your storefront so you can focus your marketing." },
                    { title: "Order Trends", desc: "Understand when your busiest selling periods are so you can plan promotions and stock." },
                    { title: "Commission Breakdown", desc: "See how much commission you've earned, broken down by product and time period." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* EPOS Terminal */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold">EPOS Terminal — Face-to-Face Sales</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">The EPOS (Electronic Point of Sale) terminal lets you sell in person — at markets, pop-ups, gyms, or anywhere you meet customers.</p>
                <div className="space-y-3">
                  {[
                    { title: "Opening the Terminal", desc: "Click 'Reseller EPOS' in the top-right of your dashboard. You'll enter a PIN to unlock the terminal. The first time, you set the PIN yourself." },
                    { title: "Browsing Products", desc: "Browse or search all available products. Tap a product to select it, choose the size and colour, then add it to the cart." },
                    { title: "Processing a Sale", desc: "Once items are in the cart, tap Checkout. Enter the customer's name, email, and phone number. Then select a payment method." },
                    { title: "Payment Methods at EPOS", desc: "Cash: Record a cash payment manually. Card: Enter card details directly or use a physical card reader. QR Code: Generate a QR code for the customer to scan and pay on their phone." },
                    { title: "QR Code Payments", desc: "The QR code sends the customer to your storefront pre-loaded with their basket. They complete payment on their own device. The sale is recorded automatically." },
                    { title: "Receipts", desc: "After every sale, a receipt is emailed to the customer automatically. You can also view all completed sales in the Orders tab." },
                    { title: "PIN Security", desc: "The EPOS is PIN-protected. You set the PIN on first login. If you forget it, contact 1stRep admin. The terminal stays logged in after the initial PIN entry so you won't need to re-enter it constantly." },
                    { title: "Screen Always-On", desc: "The EPOS terminal prevents the screen from sleeping so you're always ready to serve a customer without waking the device." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Pricing Tab */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Pricing Tab — Setting Your Prices</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">You control the prices customers see on your storefront. You always keep the difference above the base (cost) price.</p>
                <div className="space-y-3">
                  {[
                    { title: "Base Price", desc: "This is what 1stRep charges you. You cannot sell below this price." },
                    { title: "Your Retail Price", desc: "Set this to whatever you want to charge your customers. The higher above base you go, the more commission you earn per sale." },
                    { title: "Commission Calculation", desc: "If base price is £25 and you sell for £35, you earn £10 per unit sold (minus any platform percentage if applicable)." },
                    { title: "Bulk Pricing", desc: "You can set different prices for different quantities if you offer bulk discounts to B2B customers." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Licensing */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold">Licensing Tab — Selling Your Own Products</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">With a licence, you can add your own products to sell alongside the 1stRep catalogue on your storefront.</p>
                <div className="space-y-3">
                  {[
                    { title: "Trial Tier", desc: "Free for 30 days. Lets you list up to 5 of your own products to test the feature." },
                    { title: "Bronze Tier", desc: "Paid monthly. List up to 25 of your own products." },
                    { title: "Silver Tier", desc: "Paid monthly. List up to 100 of your own products." },
                    { title: "Gold Tier", desc: "Paid monthly. Unlimited product listings." },
                    { title: "Applying for a Licence", desc: "Click 'Apply for Licence' in the Licensing tab. Your application goes to the 1stRep admin for review. You'll be notified by email when approved." },
                    { title: "Managing Your Products", desc: "Once licensed, the 'My Products' and 'Categories' tabs appear. From there you can add, edit, and organise your own product range." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Messaging */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold">Messages Tab — Direct Communication</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">Use the Messages tab to communicate directly with the 1stRep admin team.</p>
                <div className="space-y-3">
                  {[
                    { title: "Sending a Message", desc: "Type your message and hit Send. The admin team will receive it and reply as soon as possible." },
                    { title: "Support Questions", desc: "Use messages for stock queries, commission questions, technical issues, or anything else you need help with." },
                    { title: "Notifications", desc: "You'll see a badge on the Messages tab whenever you have an unread reply from the admin team." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold">Notifications — Staying Up to Date</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">The bell icon in the top-right shows real-time alerts about your account.</p>
                <div className="space-y-3">
                  {[
                    { title: "New Order Alerts", desc: "Notified instantly whenever a customer places an order on your storefront." },
                    { title: "Stock Alerts", desc: "If you've subscribed to back-in-stock alerts on a product, you'll be notified here (and by email) when stock is replenished." },
                    { title: "Payout Updates", desc: "Notified when a payout request is approved and processed." },
                    { title: "Licence Approvals", desc: "Notified when your licence application is approved or rejected." },
                    { title: "Admin Messages", desc: "When the admin team replies to your message, you'll receive a notification." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Settings Tab — Your Account Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">The Settings tab shows your account and business information.</p>
                <div className="space-y-3">
                  {[
                    { title: "Business Details", desc: "Your registered business name, contact email, and phone number as provided during application." },
                    { title: "EPOS PIN", desc: "Change your EPOS terminal PIN here at any time. Your PIN must be at least 4 digits and should not be simple sequences like 1234." },
                    { title: "Account Tier", desc: "Shows your current tier (Bronze, Silver, Gold) and what's included. Tier upgrades are managed by the admin team." },
                    { title: "Updating Information", desc: "To update your business name or contact details, send a message to the admin team via the Messages tab." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Tips & Best Practices */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold">Tips &amp; Best Practices</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="space-y-3">
                  {[
                    { title: "Brand your storefront properly", desc: "A logo and banner make a huge difference. Customers trust a professional-looking store far more than a blank one." },
                    { title: "Share your link everywhere", desc: "Put your storefront link in your Instagram bio, WhatsApp status, email signature, and anywhere else your audience is." },
                    { title: "Price competitively but profitably", desc: "Don't undercut yourself. Factor in any marketing costs and aim for a healthy margin above the base price." },
                    { title: "Respond to stock alerts quickly", desc: "When a popular product comes back in stock, notify your customers immediately to capitalise on demand." },
                    { title: "Use EPOS for events", desc: "Markets, pop-ups, and gym events are great revenue opportunities. The EPOS terminal lets you take orders on the spot." },
                    { title: "Keep customer details accurate", desc: "Always enter the correct email and phone number at EPOS checkout so customers receive their receipts and can be contacted about their order." },
                    { title: "Monitor your commission rate", desc: "Check the Earnings tab regularly. If you're consistently high-volume, you may be able to negotiate a better rate with the admin team." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Contact / Support */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Need Help?</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>If you run into any issues or have questions not covered in this guide, there are a few ways to get support:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-foreground">Messages tab</span> — Send a message directly to the 1stRep admin team from within your dashboard.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-foreground">Email</span> — Contact the team at the email address provided during your onboarding.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p><span className="font-medium text-foreground">Phone</span> — Call the number on file for urgent issues, particularly around EPOS or payment problems.</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Vendor Products Tab */}
          {hasVendorAccess && (
            <TabsContent value="vendor-products" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">My Products</h2>
                    <p className="text-muted-foreground">Manage products you've added to the marketplace</p>
                  </div>
                  <Button className="min-h-11" data-testid="button-add-vendor-product" onClick={() => setShowAddProductDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {vendorProductsLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                    <p className="mt-4 text-muted-foreground">Loading products...</p>
                  </div>
                ) : vendorProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No products added yet</p>
                    <Button variant="outline" className="mt-4 min-h-11" data-testid="button-add-first-product" onClick={() => setShowAddProductDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendorProducts.map((product: any) => (
                      <Card key={product.id} className="overflow-hidden hover-elevate">
                        {/* Product Image */}
                        <div className="aspect-video bg-muted relative">
                          {product.imageUrl ? (
                            <img 
                              src={convertToDirectUrl(product.imageUrl)} 
                              alt={product.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          <Badge 
                            className="absolute top-2 right-2"
                            variant={product.isActive ? "default" : "outline"}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        {/* Product Details */}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg" data-testid={`vendor-product-name-${product.id}`}>
                            {product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {product.description || "No description"}
                          </p>
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-xl font-bold" data-testid={`vendor-product-price-${product.id}`}>
                              £{parseFloat(product.retailPrice || '0').toFixed(2)}
                            </p>
                            {product.category && (
                              <Badge variant="outline">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => openVariantsDialog(product)}
                              data-testid={`button-variants-${product.id}`}
                            >
                              <Layers className="w-4 h-4 mr-1" />
                              Variants
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditProductDialog(product)}
                              data-testid={`button-edit-product-${product.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this product?")) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                              data-testid={`button-delete-product-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          )}

          {/* Categories Tab */}
          {hasVendorAccess && (
            <TabsContent value="categories" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Product Categories</h2>
                    <p className="text-muted-foreground">Manage categories for your products</p>
                  </div>
                  <Button className="min-h-11" data-testid="button-create-category" onClick={() => setShowCreateCategory(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>

                {/* Global Categories */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Store className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-lg font-semibold">Global Categories</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    These categories are available to all sellers on the platform.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories
                      .filter((cat: any) => cat.scope === 'global')
                      .map((cat: any) => (
                        <Card key={cat.id} className="p-4 hover-elevate" data-testid={`category-global-${cat.id}`}>
                          <div className="flex items-center gap-3">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Store className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{cat.name}</h4>
                              {cat.description && (
                                <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    {categories.filter((cat: any) => cat.scope === 'global').length === 0 && (
                      <p className="text-muted-foreground col-span-full">No global categories available.</p>
                    )}
                  </div>
                </div>

                {/* Custom Categories */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Your Custom Categories</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Categories you've created for your products.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories
                      .filter((cat: any) => cat.scope === 'vendor')
                      .map((cat: any) => (
                        <Card key={cat.id} className="p-4 hover-elevate" data-testid={`category-custom-${cat.id}`}>
                          <div className="flex items-center gap-3">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{cat.name}</h4>
                              {cat.description && (
                                <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    {categories.filter((cat: any) => cat.scope === 'vendor').length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No custom categories yet</p>
                        <Button 
                          variant="outline" 
                          className="mt-3"
                          onClick={() => setShowCreateCategory(true)}
                          data-testid="button-create-first-category"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Category
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}

        </Tabs>
      </div>

      {/* Request Stock Dialog */}
      {reseller && canRequestStock && (
        <RequestStockDialog
          open={requestStockOpen}
          onOpenChange={setRequestStockOpen}
          reseller={{
            id: reseller.id,
            businessName: reseller.businessName,
            tier: reseller.tier,
            discountPercentage: reseller.discountPercentage,
            creditLimit: reseller.creditLimit,
            currentCredit: reseller.currentCredit,
            allowedPaymentMethods: reseller.allowedPaymentMethods || "both",
          }}
        />
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={(open) => { setShowAddProductDialog(open); if (!open) resetProductForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>Add a new product to your catalogue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                data-testid="input-product-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                data-testid="input-product-description"
              />
            </div>
            <div>
              <Label>Base Price (£) *</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.basePrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="0.00"
                data-testid="input-product-price"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={productForm.category}
                onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="select-product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="uncategorized">Uncategorised</SelectItem>
                  ) : (
                    categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name} {cat.scope === 'vendor' ? '(Custom)' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Image</Label>
              <div className="space-y-3">
                {/* Image Preview */}
                {(imagePreview || productForm.imageUrl) && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img 
                      src={imagePreview || convertToDirectUrl(productForm.imageUrl)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setProductForm(prev => ({ ...prev, imageUrl: "" }));
                      }}
                      className="absolute top-1 right-1 bg-red-600 rounded-full p-1 hover:bg-red-700"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-product-image-upload"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors">
                      {uploadingImage ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </>
                      )}
                    </span>
                  </label>
                  <span className="text-muted-foreground text-sm">or</span>
                </div>

                {/* URL Input */}
                <Input
                  value={productForm.imageUrl}
                  onChange={(e) => {
                    setProductForm(prev => ({ ...prev, imageUrl: e.target.value }));
                    setImagePreview(null);
                  }}
                  placeholder="Paste image URL..."
                  data-testid="input-product-image"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowAddProductDialog(false); resetProductForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createProductMutation.mutate(productForm)}
                disabled={!productForm.name || !productForm.basePrice || createProductMutation.isPending || uploadingImage}
                data-testid="button-save-product"
              >
                {createProductMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategory} onOpenChange={(open) => { setShowCreateCategory(open); if (!open) resetCategoryForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a custom category for your products</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                data-testid="input-category-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description (optional)"
                data-testid="input-category-description"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={categoryForm.imageUrl}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="Paste image URL (optional)"
                data-testid="input-category-image"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCreateCategory(false); resetCategoryForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createCategoryMutation.mutate(categoryForm)}
                disabled={!categoryForm.name || createCategoryMutation.isPending}
                data-testid="button-save-category"
              >
                {createCategoryMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variants Dialog */}
      <Dialog open={showVariantsDialog} onOpenChange={(open) => { setShowVariantsDialog(open); if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Variants - {selectedProduct?.name}</DialogTitle>
            <DialogDescription>Manage sizes, colours, and stock for this product</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Variants ({variants.length})</h4>
              <Button size="sm" onClick={() => setShowAddVariantDialog(true)} data-testid="button-add-variant">
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <div className="text-center py-8 border border-border rounded-lg">
                <Layers className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No variants yet. Add sizes and colours for this product.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {variants.map((variant: any) => (
                  <div key={variant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {variant.size && `Size: ${variant.size}`}
                          {variant.size && variant.color && " / "}
                          {variant.color && `Colour: ${variant.color}`}
                          {!variant.size && !variant.color && "Default Variant"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {variant.sku || "N/A"} | £{variant.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-medium ${variant.stockQuantity < 10 ? 'text-yellow-500' : ''}`}>
                          {variant.stockQuantity} in stock
                        </p>
                        <Badge variant={variant.isActive ? "default" : "outline"} className="text-xs">
                          {variant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateVariantMutation.mutate({
                            id: variant.id,
                            data: { isActive: !variant.isActive }
                          })}
                        >
                          {variant.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this variant?")) {
                              deleteVariantMutation.mutate(variant.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Variant Dialog */}
      <Dialog open={showAddVariantDialog} onOpenChange={setShowAddVariantDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Variant</DialogTitle>
            <DialogDescription>Add a new size/colour variant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Size</Label>
              <Select
                value={variantForm.size}
                onValueChange={(value) => setVariantForm(prev => ({ ...prev, size: value }))}
              >
                <SelectTrigger data-testid="select-variant-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                  <SelectItem value="3XL">3XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Colour</Label>
              <Input
                value={variantForm.color}
                onChange={(e) => setVariantForm(prev => ({ ...prev, color: e.target.value }))}
                placeholder="e.g., Black, Navy Blue"
                data-testid="input-variant-colour"
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                value={variantForm.sku}
                onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g., PROD-001-BLK-M"
                data-testid="input-variant-sku"
              />
            </div>
            <div>
              <Label>Price (£) *</Label>
              <Input
                type="number"
                step="0.01"
                value={variantForm.price}
                onChange={(e) => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                data-testid="input-variant-price"
              />
            </div>
            <div>
              <Label>Initial Stock *</Label>
              <Input
                type="number"
                value={variantForm.stock}
                onChange={(e) => setVariantForm(prev => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                data-testid="input-variant-stock"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowAddVariantDialog(false); resetVariantForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedProduct) {
                    createVariantMutation.mutate({
                      ...variantForm,
                      vendorProductId: selectedProduct.id
                    });
                  }
                }}
                disabled={!variantForm.price || createVariantMutation.isPending}
                data-testid="button-save-variant"
              >
                {createVariantMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Variant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProductDialog} onOpenChange={(open) => { setShowEditProductDialog(open); if (!open) { setSelectedProduct(null); resetProductForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update your product details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
                data-testid="input-edit-product-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                data-testid="input-edit-product-description"
              />
            </div>
            <div>
              <Label>Base Price (£) *</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.basePrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="0.00"
                data-testid="input-edit-product-price"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={productForm.category}
                onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="select-edit-product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="uncategorized">Uncategorised</SelectItem>
                  ) : (
                    categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name} {cat.scope === 'vendor' ? '(Custom)' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={productForm.imageUrl}
                onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="Paste image URL"
                data-testid="input-edit-product-image"
              />
              {productForm.imageUrl && (
                <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                  <img 
                    src={convertToDirectUrl(productForm.imageUrl)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowEditProductDialog(false); setSelectedProduct(null); resetProductForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedProduct) {
                    updateProductMutation.mutate({
                      id: selectedProduct.id,
                      data: {
                        name: productForm.name,
                        description: productForm.description || null,
                        basePrice: productForm.basePrice,
                        category: productForm.category || null,
                        imageUrl: productForm.imageUrl || null
                      }
                    });
                  }
                }}
                disabled={!productForm.name || !productForm.basePrice || updateProductMutation.isPending}
                data-testid="button-update-product"
              >
                {updateProductMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Update Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
