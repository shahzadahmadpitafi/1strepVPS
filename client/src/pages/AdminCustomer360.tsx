import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  ShoppingBag,
  Crown,
  Star,
  Heart,
  MessageSquare,
  Tag,
  Plus,
  Send,
  Clock,
  TrendingUp,
  DollarSign,
  Gift,
  User,
  Loader2,
  X,
} from "lucide-react";

type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  isVip?: boolean;
  loyaltyTier?: string;
  loyaltyPoints?: number;
};

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  orderDate: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: string;
  }>;
};

type CustomerNote = {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  type: string;
};

type CustomerTag = {
  id: string;
  name: string;
  color: string;
};

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  processing: "bg-blue-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  refunded: "bg-gray-500",
};

const tierColors: Record<string, string> = {
  bronze: "bg-amber-700 text-white",
  silver: "bg-slate-400 text-white",
  gold: "bg-yellow-500 text-black",
  platinum: "bg-slate-700 text-white",
  vip: "bg-purple-600 text-white",
};

export default function AdminCustomer360() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/customers/:id");
  const customerId = params?.id;
  const { toast } = useToast();
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== "admin")) {
      setLocation("/");
    }
  }, [authUser, authLoading, setLocation]);

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/admin/customers", customerId],
    enabled: !!customerId && authUser?.role === "admin",
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<CustomerOrder[]>({
    queryKey: ["/api/admin/customers", customerId, "orders"],
    enabled: !!customerId && authUser?.role === "admin",
  });

  const { data: notes = [] } = useQuery<CustomerNote[]>({
    queryKey: ["/api/admin/customers", customerId, "notes"],
    enabled: !!customerId && authUser?.role === "admin",
  });

  const { data: customerTags = [] } = useQuery<CustomerTag[]>({
    queryKey: ["/api/admin/customers", customerId, "tags"],
    enabled: !!customerId && authUser?.role === "admin",
  });

  const { data: activity = [] } = useQuery<ActivityItem[]>({
    queryKey: ["/api/admin/customers", customerId, "activity"],
    enabled: !!customerId && authUser?.role === "admin",
  });

  const { data: allTags = [] } = useQuery<CustomerTag[]>({
    queryKey: ["/api/admin/marketing-tags"],
    enabled: authUser?.role === "admin",
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/admin/customers/${customerId}/notes`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", customerId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", customerId, "activity"] });
      setNewNote("");
      toast({ title: "Note added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest("POST", `/api/admin/customers/${customerId}/tags`, { tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", customerId, "tags"] });
      toast({ title: "Tag added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add tag", variant: "destructive" });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest("DELETE", `/api/admin/customers/${customerId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", customerId, "tags"] });
      toast({ title: "Tag removed" });
    },
  });

  const toggleVipMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/admin/customers/${customerId}`, { isVip: !customer?.isVip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", customerId] });
      toast({ title: customer?.isVip ? "VIP status removed" : "Customer marked as VIP" });
    },
  });

  if (authLoading || customerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => setLocation("/admin")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || "0"), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const customerName = customer.firstName && customer.lastName
    ? `${customer.firstName} ${customer.lastName}`
    : customer.email.split("@")[0];
  const initials = customerName.slice(0, 2).toUpperCase();
  const currentTier = customer.loyaltyTier || "Bronze";

  const availableTags = allTags.filter(
    (tag) => !customerTags.some((ct) => ct.id === tag.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/admin")} className="mb-4" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card data-testid="card-customer-profile">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {customerName}
                  {customer.isVip && (
                    <Badge className="bg-purple-600 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{customer.email}</CardDescription>
                <Badge className={tierColors[currentTier.toLowerCase()] || "bg-muted"}>
                  {currentTier}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Member since {new Date(customer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{customer.loyaltyPoints || 0}</p>
                    <p className="text-xs text-muted-foreground">Loyalty Points</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">£{totalSpent.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={customer.isVip ? "destructive" : "default"}
                    className="flex-1"
                    onClick={() => toggleVipMutation.mutate()}
                    disabled={toggleVipMutation.isPending}
                    data-testid="button-toggle-vip"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {customer.isVip ? "Remove VIP" : "Mark as VIP"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-customer-tags">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {customerTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags assigned</p>
                  ) : (
                    customerTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color }}
                        className="text-white cursor-pointer hover:opacity-80"
                        onClick={() => removeTagMutation.mutate(tag.id)}
                      >
                        {tag.name}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))
                  )}
                </div>
                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Add Tag</Label>
                    <div className="flex flex-wrap gap-1">
                      {availableTags.slice(0, 5).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => addTagMutation.mutate(tag.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-quick-stats">
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Orders</span>
                  </div>
                  <span className="font-medium">{totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Avg. Order Value</span>
                  </div>
                  <span className="font-medium">£{averageOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Lifetime Value</span>
                  </div>
                  <span className="font-medium text-green-600">£{totalSpent.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Loyalty Points</span>
                  </div>
                  <span className="font-medium">{customer.loyaltyPoints || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="orders" data-testid="tab-orders">
                  <Package className="h-4 w-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">
                  <Clock className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="notes" data-testid="tab-notes">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="communications" data-testid="tab-communications">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>{totalOrders} orders totaling £{totalSpent.toFixed(2)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="p-4 border rounded-lg hover-elevate cursor-pointer"
                            onClick={() => setLocation(`/admin/orders/${order.id}`)}
                            data-testid={`card-order-${order.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{order.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.orderDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={statusColors[order.status] || "bg-gray-500"}>
                                  {order.status}
                                </Badge>
                                <p className="text-lg font-bold mt-1">£{parseFloat(order.totalAmount).toFixed(2)}</p>
                              </div>
                            </div>
                            {order.items && order.items.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {order.items.length} item{order.items.length > 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                    <CardDescription>Recent customer interactions and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activity.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No activity recorded</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                        <div className="space-y-6">
                          {activity.map((item) => (
                            <div key={item.id} className="flex gap-4 relative">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10">
                                {item.type === "order" && <Package className="h-4 w-4 text-primary-foreground" />}
                                {item.type === "login" && <User className="h-4 w-4 text-primary-foreground" />}
                                {item.type === "note" && <MessageSquare className="h-4 w-4 text-primary-foreground" />}
                                {item.type === "email" && <Mail className="h-4 w-4 text-primary-foreground" />}
                                {!["order", "login", "note", "email"].includes(item.type) && (
                                  <Star className="h-4 w-4 text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Notes</CardTitle>
                    <CardDescription>Internal notes about this customer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a note about this customer..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                        data-testid="textarea-new-note"
                      />
                      <Button
                        onClick={() => newNote.trim() && addNoteMutation.mutate(newNote.trim())}
                        disabled={!newNote.trim() || addNoteMutation.isPending}
                        data-testid="button-add-note"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>

                    <Separator />

                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No notes yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notes.map((note) => (
                          <div key={note.id} className="p-4 bg-muted/50 rounded-lg" data-testid={`note-${note.id}`}>
                            <p className="whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{note.createdBy}</span>
                              <span>•</span>
                              <span>{new Date(note.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="communications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Communications</CardTitle>
                    <CardDescription>Emails sent to this customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No emails sent yet</p>
                        <Button className="mt-4" variant="outline">
                          <Send className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={`email-${order.id}`} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="p-2 rounded-full bg-green-500/10">
                              <Mail className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">Order Confirmation</p>
                                <Badge variant="outline" className="text-green-600 border-green-600">Sent</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Confirmation email for order #{order.orderNumber}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {new Date(order.orderDate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 border-t">
                          <Button variant="outline" className="w-full">
                            <Send className="h-4 w-4 mr-2" />
                            Send Custom Email
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
