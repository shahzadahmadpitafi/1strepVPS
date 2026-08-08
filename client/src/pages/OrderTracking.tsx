import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Package, Truck, CheckCircle, MapPin, Calendar, Loader2, ExternalLink, Clock, ShoppingBag, History, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrderItem {
  name: string;
  quantity: number;
  variant: string | null;
  price: string;
}

interface StatusHistoryEntry {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  notes: string | null;
  createdAt: string;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  orderDate: string;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  shippingAddress: {
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: string;
  shippingCost: string;
  discountAmount: string | null;
  totalAmount: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  statusHistory?: StatusHistoryEntry[];
}

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const { toast } = useToast();

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber || !email) {
      toast({
        title: "Missing Information",
        description: "Please enter both your order number and email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/orders/track", {
        orderNumber: orderNumber.trim(),
        email: email.trim(),
      });
      const data = await response.json();
      setTrackedOrder(data);
    } catch (error: any) {
      toast({
        title: "Order Not Found",
        description: error.message || "Please check your order number and email address and try again.",
        variant: "destructive"
      });
      setTrackedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const statusOrder = ['pending', 'processing', 'paid', 'shipped', 'delivered'];
    return statusOrder.indexOf(status.toLowerCase());
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'processing':
      case 'paid': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const trackingSteps = [
    {
      icon: Package,
      title: "Order Received",
      description: "Your order has been confirmed and is being prepared",
      status: ['pending', 'processing', 'paid', 'shipped', 'delivered']
    },
    {
      icon: Clock,
      title: "Processing",
      description: "We're preparing your order for shipment",
      status: ['processing', 'paid', 'shipped', 'delivered']
    },
    {
      icon: Truck,
      title: "Shipped",
      description: "Your order is on its way",
      status: ['shipped', 'delivered']
    },
    {
      icon: CheckCircle,
      title: "Delivered",
      description: "Your order has been delivered",
      status: ['delivered']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" asChild className="mb-6" data-testid="button-back-to-shop">
              <Link href="/shop-clean">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Link>
            </Button>
            <div className="text-center">
              <Search className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-5xl font-bold mb-4" data-testid="heading-order-tracking">
                Track Your Order
              </h1>
              <p className="text-xl text-muted-foreground">
                Enter your order details to see real-time tracking updates
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <Card>
            <CardHeader>
              <CardTitle>Track Your Package</CardTitle>
              <CardDescription>
                Enter your order number and email address to track your shipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackOrder} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number</Label>
                    <Input
                      id="orderNumber"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g., ORD-123456"
                      data-testid="input-order-number"
                      className="min-h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Found in your order confirmation email
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      data-testid="input-email"
                      className="min-h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      The email used when placing your order
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-track-order"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Looking up order...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {trackedOrder && (
            <Card className="border-primary/30" data-testid="card-order-details">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{trackedOrder.orderNumber}</CardTitle>
                    <CardDescription>
                      Ordered on {formatDate(trackedOrder.orderDate)}
                    </CardDescription>
                  </div>
                  <Badge 
                    className={`${getStatusColor(trackedOrder.status)} text-white px-3 py-1 text-sm`}
                    data-testid="badge-order-status"
                  >
                    {trackedOrder.status.charAt(0).toUpperCase() + trackedOrder.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {trackingSteps.map((step, index) => {
                    const isActive = step.status.includes(trackedOrder.status.toLowerCase());
                    const isCompleted = getStatusStep(trackedOrder.status) > index;
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex-1 text-center ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}
                      >
                        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                          isActive ? 'bg-primary text-primary-foreground' : 
                          isCompleted ? 'bg-green-500 text-white' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          <step.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-medium text-sm">{step.title}</h4>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {trackedOrder.trackingNumber && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                        <p className="font-mono font-medium text-lg" data-testid="text-tracking-number">
                          {trackedOrder.trackingNumber}
                        </p>
                        {trackedOrder.carrier && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Carrier: {trackedOrder.carrier}
                          </p>
                        )}
                      </div>
                      {trackedOrder.trackingUrl && (
                        <a
                          href={trackedOrder.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover-elevate active-elevate-2"
                          data-testid="link-track-carrier"
                        >
                          Track with {trackedOrder.carrier}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Delivery Address
                    </h4>
                    <p className="text-muted-foreground">
                      {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.postalCode}
                      <br />
                      {trackedOrder.shippingAddress.country}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Key Dates
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {trackedOrder.paidAt && (
                        <p>Paid: {formatDate(trackedOrder.paidAt)}</p>
                      )}
                      {trackedOrder.shippedAt && (
                        <p>Shipped: {formatDate(trackedOrder.shippedAt)}</p>
                      )}
                      {trackedOrder.deliveredAt && (
                        <p>Delivered: {formatDate(trackedOrder.deliveredAt)}</p>
                      )}
                      {trackedOrder.estimatedDelivery && !trackedOrder.deliveredAt && (
                        <p className="text-primary font-medium">
                          Est. Delivery: {formatDate(trackedOrder.estimatedDelivery)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Order Items
                  </h4>
                  <div className="space-y-3">
                    {trackedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <div>
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

                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>£{parseFloat(trackedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>£{parseFloat(trackedOrder.shippingCost).toFixed(2)}</span>
                    </div>
                    {trackedOrder.discountAmount && parseFloat(trackedOrder.discountAmount) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-£{parseFloat(trackedOrder.discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>£{parseFloat(trackedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Status History Timeline */}
                {trackedOrder.statusHistory && trackedOrder.statusHistory.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Order Timeline
                      </h4>
                      <div className="space-y-4">
                        {trackedOrder.statusHistory.map((entry, index) => {
                          const statusLabels: Record<string, string> = {
                            pending: 'Order Placed',
                            confirmed: 'Order Confirmed',
                            processing: 'Processing',
                            paid: 'Payment Received',
                            shipped: 'Shipped',
                            delivered: 'Delivered',
                            refunded: 'Refunded',
                            cancelled: 'Cancelled',
                          };
                          
                          return (
                            <div key={entry.id} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                {index < trackedOrder.statusHistory!.length - 1 && (
                                  <div className="w-0.5 h-8 bg-muted-foreground/20" />
                                )}
                              </div>
                              <div className="flex-1 -mt-0.5">
                                <p className="font-medium text-sm">
                                  {statusLabels[entry.newStatus] || entry.newStatus.charAt(0).toUpperCase() + entry.newStatus.slice(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(entry.createdAt)}
                                </p>
                                {entry.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!trackedOrder && (
            <>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">Already have an account?</h3>
                      <p className="text-sm text-muted-foreground">
                        View all your orders and track them from your dashboard
                      </p>
                    </div>
                    <a 
                      href="/customer/login" 
                      className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground font-medium hover-elevate active-elevate-2 whitespace-nowrap"
                      data-testid="link-login"
                    >
                      Sign In
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-2xl font-bold mb-6">Order Status Timeline</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trackingSteps.map((step, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="p-3 rounded-full bg-primary/10">
                            <step.icon className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-semibold">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Common Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Where can I find my order number?</h4>
                <p className="text-sm text-muted-foreground">
                  Your order number is included in the confirmation email sent immediately after your purchase. It starts with "ORD-" followed by numbers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">When will I receive tracking information?</h4>
                <p className="text-sm text-muted-foreground">
                  Tracking information is sent within 1-2 business days after your order is placed, once it's been shipped from our warehouse.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">My tracking hasn't updated in days</h4>
                <p className="text-sm text-muted-foreground">
                  Sometimes tracking updates may be delayed by the carrier. If it's been more than 3 days without updates, please contact our support team.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I change my delivery address?</h4>
                <p className="text-sm text-muted-foreground">
                  Contact us immediately if you need to change your delivery address. Changes can only be made before the order ships.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="py-8">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Need Additional Help?</h3>
                <p className="text-muted-foreground mb-4">
                  Our customer care team is available Monday-Friday, 9am-6pm GMT
                </p>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground font-medium hover-elevate active-elevate-2"
                  data-testid="link-contact-support"
                >
                  Contact Support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
