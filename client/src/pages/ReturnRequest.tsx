import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, CheckCircle, Loader2, RotateCcw, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrderItem {
  name: string;
  quantity: number;
  variant: string | null;
  price: string;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  items: OrderItem[];
  deliveredAt: string | null;
}

const RETURN_REASONS = [
  { value: "wrong_size", label: "Wrong Size" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "damaged", label: "Item Damaged" },
  { value: "not_as_described", label: "Not as Described" },
  { value: "changed_mind", label: "Changed My Mind" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

export default function ReturnRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const { data: orderData, isLoading: isSearching, error: searchError } = useQuery<TrackedOrder>({
    queryKey: ["/api/orders/track", orderNumber, email],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/orders/track", {
        orderNumber: orderNumber.trim(),
        email: email.trim(),
      });
      return res.json();
    },
    enabled: searchTriggered && !!orderNumber && !!email,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/returns/request", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSubmitted(true);
      setAccessToken(data.accessToken);
      toast({
        title: "Return Request Submitted",
        description: "We'll review your request and get back to you soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit return request",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both order number and email address",
        variant: "destructive",
      });
      return;
    }
    setSearchTriggered(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for your return",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast({
        title: "Items Required",
        description: "Please select at least one item to return",
        variant: "destructive",
      });
      return;
    }

    const itemsToReturn = selectedItems.map((index) => orderData?.items[index]);

    submitMutation.mutate({
      orderNumber: orderNumber.trim().toUpperCase(),
      email: email.trim(),
      reason,
      reasonDetails: reasonDetails || undefined,
      itemsToReturn,
    });
  };

  const toggleItem = (index: number) => {
    setSelectedItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const canReturn = orderData?.status === 'delivered';
  const isWithinReturnWindow = orderData?.deliveredAt
    ? Math.floor((Date.now() - new Date(orderData.deliveredAt).getTime()) / (1000 * 60 * 60 * 24)) <= 30
    : true;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Return Request Submitted</h2>
            <p className="text-muted-foreground mb-4">
              We'll review your request and send you instructions within 1-2 business days.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-1">Reference Number</p>
              <p className="font-mono font-medium">{accessToken.split('-')[0]}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setLocation("/order-tracking")}>
                Track Order
              </Button>
              <Button onClick={() => setLocation("/shop-clean")} data-testid="button-continue-shopping">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-6" data-testid="button-back-to-shop">
          <Link href="/shop-clean">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Link>
        </Button>
        <div className="text-center mb-8">
          <RotateCcw className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Request a Return</h1>
          <p className="text-muted-foreground">
            Start your return within 30 days of delivery
          </p>
        </div>

        {!orderData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Find Your Order</CardTitle>
              <CardDescription>
                Enter your order details to start a return
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number</Label>
                    <Input
                      id="orderNumber"
                      placeholder="e.g. ORD-1234567890"
                      value={orderNumber}
                      onChange={(e) => {
                        setOrderNumber(e.target.value);
                        setSearchTriggered(false);
                      }}
                      data-testid="input-order-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setSearchTriggered(false);
                      }}
                      data-testid="input-email"
                    />
                  </div>
                </div>
                {searchTriggered && searchError && (
                  <p className="text-sm text-destructive">
                    {searchError instanceof Error ? searchError.message : "Order not found"}
                  </p>
                )}
                <Button type="submit" disabled={isSearching} data-testid="button-find-order">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Find Order
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {orderData && !canReturn && (
          <Card className="border-orange-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Returns Not Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Returns can only be requested for delivered orders. Your order status is: <Badge variant="outline">{orderData.status}</Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {orderData && canReturn && !isWithinReturnWindow && (
          <Card className="border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Return Window Expired</h3>
                  <p className="text-sm text-muted-foreground">
                    Returns must be requested within 30 days of delivery. Please contact customer support for assistance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {orderData && canReturn && isWithinReturnWindow && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order {orderData.orderNumber}
              </CardTitle>
              <CardDescription>
                Select items to return and provide a reason
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Items to Return *</Label>
                  <div className="space-y-2">
                    {orderData.items.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedItems.includes(index)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleItem(index);
                        }}
                      >
                        <Checkbox
                          checked={selectedItems.includes(index)}
                          onCheckedChange={() => toggleItem(index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">{item.variant}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">£{parseFloat(item.price).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Return *</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger data-testid="select-reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reasonDetails">Additional Details (Optional)</Label>
                  <Textarea
                    id="reasonDetails"
                    placeholder="Please provide any additional information about your return..."
                    value={reasonDetails}
                    onChange={(e) => setReasonDetails(e.target.value)}
                    rows={3}
                    data-testid="input-reason-details"
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Return Policy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Items must be unworn with original tags attached</li>
                    <li>• Returns must be requested within 30 days of delivery</li>
                    <li>• Refunds are processed within 5-7 business days</li>
                    <li>• Free returns on all orders over £50</li>
                  </ul>
                </div>

                {selectedItems.length === 0 && (
                  <p className="text-sm text-orange-500 text-center">
                    Please select at least one item above to return
                  </p>
                )}
                {!reason && selectedItems.length > 0 && (
                  <p className="text-sm text-orange-500 text-center">
                    Please select a reason for your return
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending || !reason || selectedItems.length === 0}
                  data-testid="button-submit-return"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {selectedItems.length === 0 
                    ? "Select Items to Continue" 
                    : !reason 
                    ? "Select a Reason to Continue"
                    : "Submit Return Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">How long does a refund take?</h4>
              <p className="text-sm text-muted-foreground">
                Once we receive your return, refunds are processed within 5-7 business days to your original payment method.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Can I exchange instead of return?</h4>
              <p className="text-sm text-muted-foreground">
                We currently process returns only. For exchanges, please return the item and place a new order.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Where can I find my order number?</h4>
              <p className="text-sm text-muted-foreground">
                Your order number is in your order confirmation email, starting with "ORD-".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
