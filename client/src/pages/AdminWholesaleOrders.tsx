import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, ShoppingCart, Check, X, Eye, Clock, Truck, 
  CreditCard, Box, Loader2, AlertTriangle, CheckCircle, XCircle, Search
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface WholesaleOrderItem {
  id: string;
  productName: string;
  productSku: string;
  variantSize: string | null;
  variantColor: string | null;
  wholesalePrice: string;
  quantity: number;
  lineTotal: string;
}

interface Vendor {
  id: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string | null;
}

interface WholesaleOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  status: string;
  totalAmount: string;
  currency: string;
  notes: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  contactPhone: string | null;
  stripePaymentIntentId: string | null;
  stripePaymentStatus: string | null;
  paidAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: Vendor | null;
  items: WholesaleOrderItem[];
}

export default function AdminWholesaleOrders() {
  const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();

  const { data: orders = [], isLoading, refetch } = useQuery<WholesaleOrder[]>({
    queryKey: ["/api/admin/wholesale-orders"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ orderId, adminNotes }: { orderId: string; adminNotes: string }) => {
      return apiRequest("POST", `/api/admin/wholesale-orders/${orderId}/approve`, { adminNotes });
    },
    onSuccess: () => {
      toast({ title: "Order Approved", description: "Wholesaler can now proceed to payment." });
      setShowApproveDialog(false);
      setSelectedOrder(null);
      setAdminNotes("");
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to approve order", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, rejectionReason }: { orderId: string; rejectionReason: string }) => {
      return apiRequest("POST", `/api/admin/wholesale-orders/${orderId}/reject`, { rejectionReason });
    },
    onSuccess: () => {
      toast({ title: "Order Rejected", description: "Wholesaler has been notified." });
      setShowRejectDialog(false);
      setSelectedOrder(null);
      setRejectionReason("");
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reject order", variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, trackingNumber, trackingCarrier }: { 
      orderId: string; 
      status: string; 
      trackingNumber?: string; 
      trackingCarrier?: string 
    }) => {
      return apiRequest("PATCH", `/api/admin/wholesale-orders/${orderId}/status`, { 
        status, 
        trackingNumber, 
        trackingCarrier 
      });
    },
    onSuccess: () => {
      toast({ title: "Status Updated" });
      setShowShipDialog(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      setTrackingCarrier("");
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "paid":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700"><CreditCard className="h-3 w-3 mr-1" />Paid</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-purple-500/20 text-purple-700"><Box className="h-3 w-3 mr-1" />Processing</Badge>;
      case "shipped":
        return <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-700"><Truck className="h-3 w-3 mr-1" />Shipped</Badge>;
      case "delivered":
        return <Badge variant="secondary" className="bg-green-600/20 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "cancelled":
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendor?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const approvedCount = orders.filter(o => o.status === "approved").length;
  const paidCount = orders.filter(o => o.status === "paid").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Wholesale Orders</h1>
          <p className="text-muted-foreground">Manage wholesale order requests from approved wholesalers</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingCount} Pending Review
            </Badge>
          )}
          {approvedCount > 0 && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 text-sm">
              {approvedCount} Awaiting Payment
            </Badge>
          )}
          {paidCount > 0 && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-700 text-sm">
              {paidCount} Paid - Ready to Process
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No wholesale orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} data-testid={`card-order-${order.id}`}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {order.orderNumber}
                      {getStatusBadge(order.status)}
                    </CardTitle>
                    <CardDescription>
                      {order.vendor?.businessName || "Unknown Wholesaler"} • 
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">£{parseFloat(order.totalAmount).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Shipping To:</p>
                    <p>{order.shippingAddress}</p>
                    <p>{order.shippingCity}, {order.shippingPostcode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Items:</p>
                    <ul className="space-y-1">
                      {order.items.slice(0, 2).map((item) => (
                        <li key={item.id}>
                          {item.quantity}x {item.productName}
                          {item.variantSize && <span className="text-muted-foreground"> ({item.variantSize})</span>}
                        </li>
                      ))}
                      {order.items.length > 2 && (
                        <li className="text-muted-foreground">+{order.items.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetails(true);
                  }}
                  data-testid={`button-view-${order.id}`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                
                {order.status === "pending" && (
                  <>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowApproveDialog(true);
                      }}
                      data-testid={`button-approve-${order.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowRejectDialog(true);
                      }}
                      data-testid={`button-reject-${order.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                
                {order.status === "paid" && (
                  <Button 
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "processing" })}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-processing-${order.id}`}
                  >
                    <Box className="h-4 w-4 mr-1" />
                    Start Processing
                  </Button>
                )}
                
                {order.status === "processing" && (
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowShipDialog(true);
                    }}
                    data-testid={`button-ship-${order.id}`}
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Mark Shipped
                  </Button>
                )}
                
                {order.status === "shipped" && (
                  <Button 
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "delivered" })}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`button-delivered-${order.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Delivered
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>{selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Wholesaler</h4>
                  <p>{selectedOrder.vendor?.businessName || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.vendor?.contactEmail}</p>
                  {selectedOrder.vendor?.contactPhone && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.vendor.contactPhone}</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between p-2 bg-muted rounded text-sm">
                        <div>
                          <span className="font-medium">{item.productName}</span>
                          {(item.variantSize || item.variantColor) && (
                            <span className="text-muted-foreground ml-2">
                              ({[item.variantSize, item.variantColor].filter(Boolean).join(" / ")})
                            </span>
                          )}
                          <p className="text-muted-foreground">SKU: {item.productSku} • Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium">£{parseFloat(item.lineTotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t font-bold">
                    <span>Total</span>
                    <span>£{parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <p className="text-sm">
                    {selectedOrder.shippingAddress}<br />
                    {selectedOrder.shippingCity}, {selectedOrder.shippingPostcode}<br />
                    {selectedOrder.shippingCountry}
                  </p>
                  {selectedOrder.contactPhone && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Phone: {selectedOrder.contactPhone}
                    </p>
                  )}
                </div>

                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Order Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                {selectedOrder.adminNotes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Admin Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedOrder.adminNotes}</p>
                    </div>
                  </>
                )}

                {selectedOrder.rejectionReason && (
                  <>
                    <Separator />
                    <div className="p-3 bg-destructive/10 rounded">
                      <h4 className="font-semibold mb-2 text-destructive">Rejection Reason</h4>
                      <p className="text-sm">{selectedOrder.rejectionReason}</p>
                    </div>
                  </>
                )}

                {selectedOrder.trackingNumber && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Tracking Information</h4>
                      <p className="text-sm">
                        Carrier: {selectedOrder.trackingCarrier || "N/A"}<br />
                        Tracking: {selectedOrder.trackingNumber}
                      </p>
                    </div>
                  </>
                )}

                {selectedOrder.paidAt && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Payment Details</h4>
                      <p className="text-sm text-muted-foreground">
                        Paid on: {new Date(selectedOrder.paidAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order</DialogTitle>
            <DialogDescription>
              Approve {selectedOrder?.orderNumber} for payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes for this order..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedOrder) {
                  approveMutation.mutate({ orderId: selectedOrder.id, adminNotes });
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this order is being rejected..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedOrder && rejectionReason) {
                  rejectMutation.mutate({ orderId: selectedOrder.id, rejectionReason });
                }
              }}
              disabled={rejectMutation.isPending || !rejectionReason}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>
              Add tracking information for {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trackingCarrier">Carrier</Label>
              <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Royal Mail">Royal Mail</SelectItem>
                  <SelectItem value="DPD">DPD</SelectItem>
                  <SelectItem value="Hermes">Hermes</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedOrder) {
                  updateStatusMutation.mutate({ 
                    orderId: selectedOrder.id, 
                    status: "shipped",
                    trackingNumber,
                    trackingCarrier
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Mark Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
