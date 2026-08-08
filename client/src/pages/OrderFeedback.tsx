import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, Search, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrderData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveredAt: string;
  accessToken: string;
  alreadyReviewed?: boolean;
  review?: any;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 focus:outline-none"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hover || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderFeedback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [overallRating, setOverallRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<string>("");

  const { data: orderData, isLoading: isSearching, error: searchError } = useQuery<OrderData>({
    queryKey: ["/api/reviews/order", orderNumber, email],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/order/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Order not found");
      }
      return res.json();
    },
    enabled: searchTriggered && !!orderNumber && !!email,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/reviews/submit", data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
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
    
    if (overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      accessToken: orderData?.accessToken,
      overallRating,
      productQualityRating: productQualityRating || undefined,
      deliveryRating: deliveryRating || undefined,
      serviceRating: serviceRating || undefined,
      comment: comment || undefined,
      wouldRecommend: wouldRecommend === 'yes' ? true : wouldRecommend === 'no' ? false : undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback helps us improve our products and service.
            </p>
            <Button onClick={() => setLocation("/shop-clean")} data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
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
          <h1 className="text-3xl font-bold mb-2">Share Your Experience</h1>
          <p className="text-muted-foreground">
            We'd love to hear about your recent order
          </p>
        </div>

        {!orderData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Find Your Order</CardTitle>
              <CardDescription>
                Enter your order details to leave feedback
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

        {orderData?.alreadyReviewed && (
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">You've Already Reviewed This Order</h2>
              <p className="text-muted-foreground mb-4">
                Thank you for your feedback on order {orderData.orderNumber}
              </p>
              <div className="flex items-center justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= orderData.review.overallRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <Button variant="outline" onClick={() => setLocation("/shop-clean")}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        )}

        {orderData && !orderData.alreadyReviewed && (
          <Card>
            <CardHeader>
              <CardTitle>Rate Your Order</CardTitle>
              <CardDescription>
                Order {orderData.orderNumber} • Delivered on{" "}
                {new Date(orderData.deliveredAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <StarRating
                  value={overallRating}
                  onChange={setOverallRating}
                  label="Overall Experience *"
                />

                <StarRating
                  value={productQualityRating}
                  onChange={setProductQualityRating}
                  label="Product Quality"
                />

                <StarRating
                  value={deliveryRating}
                  onChange={setDeliveryRating}
                  label="Delivery Experience"
                />

                <StarRating
                  value={serviceRating}
                  onChange={setServiceRating}
                  label="Customer Service"
                />

                <div className="space-y-2">
                  <Label>Would you recommend us to a friend?</Label>
                  <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend}>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="recommend-yes" />
                        <Label htmlFor="recommend-yes" className="font-normal">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="recommend-no" />
                        <Label htmlFor="recommend-no" className="font-normal">No</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Additional Comments (Optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Tell us more about your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    data-testid="input-comment"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending || overallRating === 0}
                  data-testid="button-submit-feedback"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Submit Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
