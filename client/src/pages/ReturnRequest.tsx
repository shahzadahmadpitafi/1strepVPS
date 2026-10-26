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
  id?: string;
  productId?: string | null;
  size?: string | null;
  color?: string | null;
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
  const [requestType, setRequestType] = useState<"return" | "exchange">("return");
  const [exchangeChoices, setExchangeChoices] = useState<Record<string, string>>({});

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

  // Other sizes/colours of the same items that are in stock right now (for exchanges)
  const { data: exchangeData } = useQuery<{ items: Array<{ orderItemId: string; options: Array<{ variantId: string; size: string; color: string }> }> }>({
    queryKey: ["/api/returns/exchange-options", orderNumber, email],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/returns/exchange-options", {
        orderNumber: orderNumber.trim(),
        email: email.trim(),
      });
      return res.json();
    },
    enabled: !!orderData && orderData.status === "delivered",
    retry: false,
  });
  const optionsFor = (item: OrderItem) => exchangeData?.items.find((i) => i.orderItemId === item.id)?.options ?? [];

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/returns/request", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSubmitted(true);
      setAccessToken(data.accessToken);
      toast({
        title: requestType === "exchange" ? "Exchange Request Submitted" : "Return Request Submitted",
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

    let exchangeItems: Array<{ orderItemId: string; newVariantId: string }> | undefined;
    if (requestType === "exchange") {
      const missing = selectedItems.find((index) => {
        const it = orderData?.items[index];
        return !it?.id || !exchangeChoices[it.id];
      });
      if (missing !== undefined) {
        toast({
          title: "Choose your new size or colour",
          description: "Please pick the size/colour you'd like instead for each item you're exchanging.",
          variant: "destructive",
        });
        return;
      }
      exchangeItems = selectedItems.map((index) => {
        const it = orderData!.items[index];
        return { orderItemId: it.id as string, newVariantId: exchangeChoices[it.id as string] };
      });
    }

    submitMutation.mutate({
      orderNumber: orderNumber.trim().toUpperCase(),
      email: email.trim(),
      reason,
      reasonDetails: reasonDetails || undefined,
      itemsToReturn,
      requestType,
      exchangeItems,
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
            <h2 className="text-2xl font-bold mb-2">{requestType === "exchange" ? "Exchange Request Submitted" : "Return Request Submitted"}</h2>
            <p className="text-muted-foreground mb-4">
              We'll review your request and send you instructions within 1-2 business days.
              {requestType === "exchange" && " Once we receive your item back, we'll send your replacement free of charge."}
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
          <h1 className="text-3xl font-bold mb-2">Return or Exchange</h1>
          <p className="text-muted-foreground">
            Return for a refund, or exchange for a different size or colour, within 30 days of delivery
          </p>
        </div>

        {!orderData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Find Your Order</CardTitle>
              <CardDescription>
                Enter your order details to start a return or exchange
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
                Choose what you'd like to do, select your items and tell us why
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRequestType("return")}
                    className={`rounded-lg border p-3 text-left transition-colors ${requestType === "return" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                    data-testid="button-type-return"
                  >
                    <p className="font-semibold">Return for a refund</p>
                    <p className="text-xs text-muted-foreground">Send it back and get your money back</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType("exchange")}
                    className={`rounded-lg border p-3 text-left transition-colors ${requestType === "exchange" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                    data-testid="button-type-exchange"
                  >
                    <p className="font-semibold">Exchange</p>
                    <p className="text-xs text-muted-foreground">Different size or colour, free of charge</p>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>{requestType === "exchange" ? "Select Items to Exchange *" : "Select Items to Return *"}</Label>
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
                    {requestType === "exchange" &&
                      selectedItems.map((index) => {
                        const item = orderData.items[index];
                        const options = optionsFor(item);
                        return (
                          <div key={`ex-${index}`} className="rounded-lg border border-dashed p-3 space-y-2" data-testid={`exchange-choice-${index}`}>
                            <Label className="text-sm">
                              Swap {item.name}
                              {item.size || item.color ? ` (${[item.size, item.color].filter(Boolean).join(" / ")})` : ""} for:
                            </Label>
                            {options.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No other sizes or colours of this item are in stock right now. You can return it for a refund instead.
                              </p>
                            ) : (
                              <Select
                                value={item.id ? exchangeChoices[item.id] || "" : ""}
                                onValueChange={(v) => item.id && setExchangeChoices((prev) => ({ ...prev, [item.id as string]: v }))}
                              >
                                <SelectTrigger data-testid={`select-exchange-${index}`}>
                                  <SelectValue placeholder="Choose new size / colour" />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((o) => (
                                    <SelectItem key={o.variantId} value={o.variantId}>
                                      {o.size} / {o.color}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">{requestType === "exchange" ? "Reason for Exchange *" : "Reason for Return *"}</Label>
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
                  <h4 className="font-semibold mb-2">Returns &amp; Exchanges Policy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Items must be unworn, unwashed, with original tags attached</li>
                    <li>• Requests must be made within 30 days of delivery</li>
                    <li>• Free returns and exchanges within the UK</li>
                    <li>• Refunds are processed within 5-7 business days of us receiving your return</li>
                    <li>• Exchanges are for a different size or colour of the same item. Your replacement is sent once we receive your return. If your new size has sold out, we'll refund you instead.</li>
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
                    : requestType === "exchange"
                    ? "Submit Exchange Request"
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
                Yes. Choose "Exchange" above to swap an item for a different size or colour, free of charge within the UK. We send your replacement as soon as your return reaches us. To swap for a different product, return the item for a refund and place a new order.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Need to change an order that hasn't arrived yet?</h4>
              <p className="text-sm text-muted-foreground">
                If your order hasn't been dispatched, we can change the size, colour or delivery address. Contact us as soon as possible with your order number. Once an order has been dispatched it can't be changed, but you can exchange or return it after delivery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Where can I find my order number?</h4>
              <p className="text-sm text-muted-foreground">
                Your order number is in your order confirmation email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
