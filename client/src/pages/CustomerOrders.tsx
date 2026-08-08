import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/Header";
import HeaderClean from "@/components/HeaderClean";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

type SiteSettings = {
  activeTheme: "tactical_dark" | "modern_light" | "dynamic_gradient" | "clean_minimal";
};

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  discountAmount: number | null;
  paymentMethod: string;
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  orderDate: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  processing: { label: "Processing", icon: Package, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  cancelled: { label: "Cancelled", icon: Package, color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export default function CustomerOrders() {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
  });

  const { data: orders = [], isLoading } = useQuery<CustomerOrder[]>({
    queryKey: ['/api/customer-orders'],
  });

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const isCleanTheme = siteSettings?.activeTheme === "clean_minimal";

  return (
    <div className="min-h-screen bg-background">
      {isCleanTheme ? <HeaderClean /> : <Header />}
      
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="heading-orders">My Orders</h1>
            <p className="text-sm md:text-base text-muted-foreground">Track and manage your order history</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-orders">No orders yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  You haven't placed any orders yet. Start shopping to see your orders here.
                </p>
                <Button asChild className="min-h-11" data-testid="button-shop-now">
                  <a href="/shop">Start Shopping</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isExpanded = expandedOrders.has(order.id);

                return (
                  <Card key={order.id} data-testid={`card-order-${order.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg" data-testid={`text-order-number-${order.id}`}>
                              {order.orderNumber}
                            </CardTitle>
                            <Badge className={status.color} data-testid={`badge-status-${order.id}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <CardDescription>
                            <span data-testid={`text-order-date-${order.id}`}>
                              Ordered on {format(new Date(order.orderDate), "MMMM d, yyyy")}
                            </span>
                            {order.shippedAt && (
                              <span className="ml-4" data-testid={`text-shipped-date-${order.id}`}>
                                • Shipped on {format(new Date(order.shippedAt), "MMMM d, yyyy")}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground" data-testid={`text-total-${order.id}`}>
                            £{order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Tracking Information */}
                      {order.trackingNumber && (
                        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">Tracking Information</span>
                          </div>
                          {order.carrier && (
                            <p className="text-sm text-muted-foreground mb-1">Carrier: {order.carrier}</p>
                          )}
                          <p className="text-sm text-muted-foreground mb-1">Tracking Number:</p>
                          {order.trackingUrl ? (
                            <a 
                              href={order.trackingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 font-mono text-sm text-primary hover:underline"
                              data-testid={`link-tracking-${order.id}`}
                            >
                              {order.trackingNumber}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="font-mono text-sm text-foreground" data-testid={`text-tracking-${order.id}`}>
                              {order.trackingNumber}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Shipping Address */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Shipping Address</span>
                        </div>
                        <div className="text-sm text-muted-foreground pl-6" data-testid={`text-shipping-address-${order.id}`}>
                          <p>{order.customerFirstName} {order.customerLastName}</p>
                          <p>{order.shippingAddress}</p>
                          <p>{order.shippingCity}, {order.shippingPostalCode}</p>
                          <p>{order.shippingCountry}</p>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Order Items Toggle */}
                      <Button
                        variant="ghost"
                        className="w-full justify-between min-h-11"
                        onClick={() => toggleOrderExpansion(order.id)}
                        data-testid={`button-toggle-items-${order.id}`}
                      >
                        <span className="font-medium text-sm md:text-base">Order Items ({order.items.length})</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>

                      {isExpanded && (
                        <div className="mt-4 space-y-3" data-testid={`div-order-items-${order.id}`}>
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-foreground" data-testid={`text-item-name-${item.id}`}>
                                  {item.productName}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  {item.size && <span>Size: {item.size}</span>}
                                  {item.color && <span>Colour: {item.color}</span>}
                                  <span data-testid={`text-item-quantity-${item.id}`}>Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-foreground" data-testid={`text-item-total-${item.id}`}>
                                  £{item.totalPrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  £{item.unitPrice.toFixed(2)} each
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Order Summary */}
                          <div className="pt-3 border-t border-border">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="text-foreground" data-testid={`text-subtotal-${order.id}`}>
                                  £{order.subtotal.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="text-foreground" data-testid={`text-shipping-cost-${order.id}`}>
                                  £{order.shippingCost.toFixed(2)}
                                </span>
                              </div>
                              {order.discountAmount && order.discountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Discount</span>
                                  <span className="text-green-500" data-testid={`text-discount-${order.id}`}>
                                    -£{order.discountAmount.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <Separator className="my-2" />
                              <div className="flex justify-between font-semibold">
                                <span className="text-foreground">Total</span>
                                <span className="text-foreground" data-testid={`text-order-total-${order.id}`}>
                                  £{order.totalAmount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
