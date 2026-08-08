import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Package, ShoppingBag, LogOut, Mail, Calendar, MapPin, CreditCard, Truck, CheckCircle, Clock, Edit, Crown, Star, Gift, Zap, Tag, Trophy, Dumbbell, ExternalLink, AlertCircle, Users, Shirt } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import Header from '@/components/Header';
import HeaderClean from '@/components/HeaderClean';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  trackingNumber?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    size?: string;
    color?: string;
  }>;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

type SiteSettings = {
  activeTheme: "tactical_dark" | "modern_light" | "dynamic_gradient" | "clean_minimal";
};

type LoyaltyTierBenefit = {
  id: string;
  tier: string;
  discountPercentage: string;
  freeShippingThreshold: string | null;
  freeShippingUnlimited: boolean;
  earlyAccessDays: number;
  exclusiveProducts: boolean;
  birthdayBonus: number;
  pointsMultiplier: string;
  prioritySupport: boolean;
  referralBonus: number;
  quarterlyReward: string | null;
  customBenefits: string | null;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const getTrackingSteps = (status: string) => {
  const steps = [
    { label: 'Order Placed', status: 'pending', icon: Package },
    { label: 'Processing', status: 'processing', icon: Clock },
    { label: 'Shipped', status: 'shipped', icon: Truck },
    { label: 'Delivered', status: 'delivered', icon: CheckCircle },
  ];

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(status);

  return steps.map((step, index) => ({
    ...step,
    completed: index < currentIndex,
    active: index === currentIndex,
  }));
};

export default function CustomerProfile() {
  const [, setLocation] = useLocation();
  const [trackingOrder, setTrackingOrder] = useState<CustomerOrder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '' });
  const { toast } = useToast();

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
  });

  const { data: user } = useQuery<UserData>({
    queryKey: ['/api/auth/me'],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<CustomerOrder[]>({
    queryKey: ['/api/customer-orders'],
  });

  const { data: loyaltyTiers = [], isLoading: loyaltyLoading } = useQuery<LoyaltyTierBenefit[]>({
    queryKey: ['/api/loyalty-tiers'],
  });

  const { data: myCompetitions = [], isLoading: competitionsLoading } = useQuery<any[]>({
    queryKey: ['/api/competitions/my/registrations'],
    enabled: !!user,
  });

  const [editingShirtSize, setEditingShirtSize] = useState<string | null>(null);
  const [pendingShirtSize, setPendingShirtSize] = useState<string>("");
  const [waiverReg, setWaiverReg] = useState<{ id: string; name: string; text: string } | null>(null);
  const [waiverAgreed, setWaiverAgreed] = useState(false);

  const signWaiverMutation = useMutation({
    mutationFn: (regId: string) =>
      apiRequest("POST", `/api/competitions/registrations/${regId}/sign-waiver`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions/my/registrations'] });
      setWaiverReg(null);
      setWaiverAgreed(false);
      toast({ title: "Waiver signed", description: "Your waiver has been recorded. You're all set!" });
    },
    onError: () => {
      toast({ title: "Failed to sign waiver", description: "Please try again.", variant: "destructive" });
    },
  });

  const updateShirtSizeMutation = useMutation({
    mutationFn: ({ regId, shirtSize }: { regId: string; shirtSize: string }) =>
      apiRequest("PATCH", `/api/competitions/registrations/${regId}/shirt-size`, { shirtSize }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions/my/registrations'] });
      setEditingShirtSize(null);
      toast({ title: "T-shirt size saved", description: "Your size preference has been updated." });
    },
    onError: () => {
      toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
    },
  });

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      setLocation('/admin');
    }
  }, [user, setLocation]);

  // Don't render customer profile for admins
  if (user?.role === 'admin') {
    return null;
  }

  const activeTheme = siteSettings?.activeTheme || 'tactical_dark';
  const isCleanTheme = activeTheme === 'clean_minimal';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear the entire query cache to ensure user state is reset
      queryClient.clear();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return await apiRequest('PATCH', '/api/auth/profile', data);
    },
    onSuccess: async () => {
      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      await queryClient.refetchQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Profile updated!",
        description: "Your profile information has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = () => {
    if (user) {
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateProfile = () => {
    if (editFormData.firstName.trim() && editFormData.lastName.trim()) {
      updateProfileMutation.mutate(editFormData);
    } else {
      toast({
        title: "Validation error",
        description: "Please fill in both first and last name.",
        variant: "destructive",
      });
    }
  };

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const recentOrders = orders.slice(0, 5);

  // Calculate loyalty points (1 point per £1 spent)
  const loyaltyPoints = Math.floor(totalSpent);
  
  // Determine current tier based on lifetime points
  const getCurrentTier = (points: number) => {
    if (points >= 10000) return 'VIP';
    if (points >= 5000) return 'Platinum';
    if (points >= 2500) return 'Gold';
    if (points >= 1000) return 'Silver';
    return 'Bronze';
  };

  const getNextTier = (points: number) => {
    if (points >= 10000) return null;
    if (points >= 5000) return { tier: 'VIP', pointsNeeded: 10000 - points };
    if (points >= 2500) return { tier: 'Platinum', pointsNeeded: 5000 - points };
    if (points >= 1000) return { tier: 'Gold', pointsNeeded: 2500 - points };
    return { tier: 'Silver', pointsNeeded: 1000 - points };
  };

  const currentTier = getCurrentTier(loyaltyPoints);
  const nextTier = getNextTier(loyaltyPoints);
  const currentTierBenefits = loyaltyTiers.find(t => t.tier.toLowerCase() === currentTier.toLowerCase());

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-amber-700 text-white';
      case 'silver': return 'bg-slate-400 text-white';
      case 'gold': return 'bg-yellow-500 text-black';
      case 'platinum': return 'bg-slate-700 text-white';
      case 'vip': return 'bg-purple-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={isCleanTheme ? "min-h-screen bg-gray-900" : "min-h-screen bg-gray-50 dark:bg-gray-900"}>
      {isCleanTheme ? <HeaderClean /> : <Header />}
      
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        <div className="mb-6 md:mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isCleanTheme ? 'text-white' : ''}`} data-testid="text-profile-title">My Account</h1>
          <p className={`text-sm md:text-base ${isCleanTheme ? 'text-gray-400' : 'text-muted-foreground'}`}>Manage your profile and view your order history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className={isCleanTheme ? "bg-gray-800 border-gray-700" : ""} data-testid="card-profile-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold" data-testid="text-user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username || user?.email}
                  </p>
                  <Badge variant="secondary" className="mt-1">Customer</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium" data-testid="text-user-fullname">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium" data-testid="text-user-email">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="font-medium">2025</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full min-h-11" 
                  onClick={handleEditProfile}
                  data-testid="button-edit-profile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full min-h-11" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={isCleanTheme ? "bg-gray-800 border-gray-700" : ""} data-testid="card-order-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Order Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-total-orders">
                    {totalOrders}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-spent">
                    £{totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>

              {orders.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Recent Activity</p>
                    <div className="space-y-2">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{order.orderNumber}</span>
                          <Badge className={statusColors[order.status]} data-testid={`badge-status-${order.id}`}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={isCleanTheme ? "bg-gray-800 border-gray-700" : ""} data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start min-h-11" 
                onClick={() => setLocation('/orders')}
                data-testid="button-view-all-orders"
              >
                <Package className="w-4 h-4 mr-2" />
                View All Orders
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start min-h-11" 
                onClick={() => setLocation('/shop')}
                data-testid="button-browse-products"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start min-h-11"
                onClick={() => setLocation('/cart')}
                data-testid="button-view-cart"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                View Cart
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className={`mb-6 md:mb-8 ${isCleanTheme ? "bg-gray-800 border-gray-700" : ""}`} data-testid="card-loyalty">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-500" />
              Loyalty Program
            </CardTitle>
            <CardDescription>Your rewards and exclusive benefits</CardDescription>
          </CardHeader>
          <CardContent>
            {loyaltyLoading ? (
              <div className="text-center py-6 text-muted-foreground">Loading loyalty benefits...</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={`text-sm px-3 py-1 ${getTierColor(currentTier)}`} data-testid="badge-current-tier">
                    {currentTier === 'VIP' && <Crown className="w-3 h-3 mr-1" />}
                    {currentTier}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Current Tier</span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary" data-testid="text-loyalty-points">{loyaltyPoints.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Lifetime Points</p>
                </div>
                {nextTier && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">{nextTier.pointsNeeded.toLocaleString()} more points</span>
                      <span className="text-muted-foreground"> to reach </span>
                      <Badge className={`text-xs ${getTierColor(nextTier.tier)}`}>{nextTier.tier}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Earn 1 point per £1 spent</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Your {currentTier} Benefits
                </h4>
                {currentTierBenefits ? (
                  <div className="grid grid-cols-2 gap-3">
                    {parseFloat(currentTierBenefits.discountPercentage) > 0 && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-950 rounded">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span>{currentTierBenefits.discountPercentage}% discount on all orders</span>
                      </div>
                    )}
                    {(currentTierBenefits.freeShippingUnlimited || currentTierBenefits.freeShippingThreshold !== null) && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        <Gift className="w-4 h-4 text-blue-600" />
                        <span>
                          {currentTierBenefits.freeShippingUnlimited 
                            ? 'Free shipping on all orders' 
                            : `Free shipping over £${currentTierBenefits.freeShippingThreshold}`}
                        </span>
                      </div>
                    )}
                    {parseFloat(currentTierBenefits.pointsMultiplier) > 1 && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span>{currentTierBenefits.pointsMultiplier}x points on purchases</span>
                      </div>
                    )}
                    {currentTierBenefits.birthdayBonus > 0 && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-pink-50 dark:bg-pink-950 rounded">
                        <Gift className="w-4 h-4 text-pink-600" />
                        <span>{currentTierBenefits.birthdayBonus} birthday bonus points</span>
                      </div>
                    )}
                    {currentTierBenefits.earlyAccessDays > 0 && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-purple-50 dark:bg-purple-950 rounded">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span>{currentTierBenefits.earlyAccessDays}-day early access to sales</span>
                      </div>
                    )}
                    {currentTierBenefits.exclusiveProducts && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-indigo-50 dark:bg-indigo-950 rounded">
                        <Crown className="w-4 h-4 text-indigo-600" />
                        <span>Exclusive products</span>
                      </div>
                    )}
                    {currentTierBenefits.referralBonus > 0 && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-teal-50 dark:bg-teal-950 rounded">
                        <Gift className="w-4 h-4 text-teal-600" />
                        <span>{currentTierBenefits.referralBonus} referral bonus points</span>
                      </div>
                    )}
                    {currentTierBenefits.prioritySupport && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-orange-50 dark:bg-orange-950 rounded">
                        <Star className="w-4 h-4 text-orange-600" />
                        <span>Priority customer support</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                    <p>Keep shopping to unlock amazing rewards!</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>Reach Silver (1,000 pts) for member discounts</li>
                      <li>Reach Gold (2,500 pts) for free shipping</li>
                      <li>Reach Platinum (5,000 pts) for exclusive perks</li>
                      <li>Reach VIP (10,000 pts) for maximum benefits</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3 min-h-12">
            <TabsTrigger value="orders" className="min-h-11 text-sm md:text-base" data-testid="tab-orders">Orders</TabsTrigger>
            <TabsTrigger value="competitions" className="min-h-11 text-sm md:text-base" data-testid="tab-competitions">My Competitions</TabsTrigger>
            <TabsTrigger value="addresses" className="min-h-11 text-sm md:text-base" data-testid="tab-addresses">Addresses</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card className={isCleanTheme ? "bg-gray-800 border-gray-700" : ""}>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>View and track all your orders</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Button onClick={() => setLocation('/shop')} className="min-h-11" data-testid="button-start-shopping">
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className={`hover-elevate ${isCleanTheme ? 'bg-gray-800 border-gray-700' : ''}`} data-testid={`card-order-${order.id}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div>
                              <p className="font-semibold text-lg" data-testid={`text-order-number-${order.id}`}>
                                Order {order.orderNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.orderDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={statusColors[order.status]} data-testid={`badge-order-status-${order.id}`}>
                                {statusLabels[order.status]}
                              </Badge>
                              <p className="font-bold text-lg" data-testid={`text-order-total-${order.id}`}>
                                £{parseFloat(order.totalAmount).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                              <div className="text-sm">
                                <p className="font-medium">Shipping Address</p>
                                <p className="text-muted-foreground">
                                  {order.shippingAddress}, {order.shippingCity} {order.shippingPostalCode}
                                </p>
                              </div>
                            </div>

                            {order.trackingNumber && (
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <div className="text-sm">
                                  <span className="font-medium">Tracking: </span>
                                  <span className="text-muted-foreground" data-testid={`text-tracking-${order.id}`}>
                                    {order.trackingNumber}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div>
                              <p className="text-sm font-medium mb-2">Items:</p>
                              <div className="space-y-1">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                                    <span>
                                      {item.productName}
                                      {item.size && ` (${item.size})`}
                                      {item.color && ` - ${item.color}`}
                                      {' x '}{item.quantity}
                                    </span>
                                    <span>£{parseFloat(item.unitPrice).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <Button 
                            variant="outline" 
                            className="w-full min-h-11"
                            onClick={() => setTrackingOrder(order)}
                            data-testid={`button-track-order-${order.id}`}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Track Order
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── MY COMPETITIONS TAB ─────────────────────────────────────── */}
          <TabsContent value="competitions" className="space-y-4">
            <Card className={isCleanTheme ? "bg-gray-800 border-gray-700" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  My Competitions
                </CardTitle>
                <CardDescription>Your competition registrations and heat assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {competitionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading competitions…</div>
                ) : myCompetitions.length === 0 ? (
                  <div className="text-center py-12">
                    <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">You haven't registered for any competitions yet.</p>
                    <Button onClick={() => setLocation('/competitions')} className="mt-2 min-h-11" data-testid="button-browse-competitions">
                      <Trophy className="w-4 h-4 mr-2" /> Browse Competitions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myCompetitions.map((reg: any) => {
                      const isPaid = reg.payment_status === 'paid';
                      return (
                        <Card key={reg.id} className={isCleanTheme ? 'bg-gray-700 border-gray-600' : ''} data-testid={`card-comp-${reg.id}`}>
                          <CardContent className="p-5">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="font-semibold text-base truncate" data-testid={`text-comp-name-${reg.id}`}>{reg.competition_name}</p>
                                  {reg.competition_status === 'live' && (
                                    <Badge className="bg-red-600 text-white text-xs">Live</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(reg.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  {reg.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {reg.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 shrink-0">
                                <Badge variant="outline" data-testid={`badge-comp-category-${reg.id}`}>{reg.category_name}</Badge>
                                {isPaid ? (
                                  <Badge className="bg-green-600 text-white" data-testid={`badge-comp-paid-${reg.id}`}>
                                    <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-600 text-white" data-testid={`badge-comp-pending-${reg.id}`}>
                                    <AlertCircle className="w-3 h-3 mr-1" /> Payment Pending
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Waiver warning */}
                            {reg.waiver_text && !reg.my_waiver_signed && (
                              <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-md flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 shrink-0" /> Waiver signature required
                                </p>
                                <Button
                                  size="sm"
                                  className="shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-0"
                                  onClick={() => {
                                    setWaiverReg({ id: reg.id, name: reg.competition_name, text: reg.waiver_text });
                                    setWaiverAgreed(false);
                                  }}
                                >
                                  Sign Waiver
                                </Button>
                              </div>
                            )}
                            {reg.waiver_text && reg.my_waiver_signed && (
                              <div className="mb-3 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3.5 h-3.5" /> Waiver signed
                              </div>
                            )}

                            {/* Heat assignment */}
                            {reg.heat_number && (
                              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" /> Heat Assignment
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-blue-700 dark:text-blue-300">
                                  <span>Heat {reg.heat_number}</span>
                                  {reg.heat_start_time && (
                                    <span>{new Date(reg.heat_start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
                                  {reg.lane_number && <span>Lane {reg.lane_number}</span>}
                                  {reg.workout_name && <span className="text-muted-foreground">{reg.workout_name}</span>}
                                </div>
                              </div>
                            )}

                            {/* Team members */}
                            {reg.team_members && reg.team_members.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                                  <Users className="w-4 h-4" /> Team Members
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {reg.team_members.map((m: any) => (
                                    <Badge key={m.id} variant="outline" className="text-xs gap-1">
                                      {m.first_name} {m.last_name}
                                      {m.invite_status === 'accepted' && <CheckCircle className="w-3 h-3 text-green-500" />}
                                      {m.invite_status === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* T-shirt size */}
                            <div className="mb-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                                  <Shirt className="w-3.5 h-3.5" /> T-Shirt Size:
                                </span>
                                {editingShirtSize === reg.id ? (
                                  <>
                                    <Select
                                      value={pendingShirtSize}
                                      onValueChange={setPendingShirtSize}
                                    >
                                      <SelectTrigger className="h-8 w-28 text-xs">
                                        <SelectValue placeholder="Select size" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map(s => (
                                          <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      className="h-8 text-xs"
                                      disabled={!pendingShirtSize || updateShirtSizeMutation.isPending}
                                      onClick={() => updateShirtSizeMutation.mutate({ regId: reg.id, shirtSize: pendingShirtSize })}
                                    >
                                      {updateShirtSizeMutation.isPending ? "Saving…" : "Save"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 text-xs"
                                      onClick={() => setEditingShirtSize(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {reg.shirt_size ? (
                                      <Badge variant="outline" className="text-xs font-mono">{reg.shirt_size}</Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic">Not set</span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs gap-1 px-2"
                                      onClick={() => {
                                        setPendingShirtSize(reg.shirt_size || "");
                                        setEditingShirtSize(reg.id);
                                      }}
                                    >
                                      <Edit className="w-3 h-3" />
                                      {reg.shirt_size ? "Change" : "Add size"}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLocation(`/competitions/${reg.slug}`)}
                                data-testid={`button-view-comp-${reg.id}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Competition
                              </Button>
                              <span className="text-xs text-muted-foreground self-center capitalize">
                                Status: {reg.status?.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── WAIVER SIGN MODAL ─────────────────────────────────────────── */}
          <Dialog open={!!waiverReg} onOpenChange={open => { if (!open) { setWaiverReg(null); setWaiverAgreed(false); } }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Competition Waiver</DialogTitle>
                <DialogDescription>{waiverReg?.name}</DialogDescription>
              </DialogHeader>
              <div className="max-h-60 overflow-y-auto rounded-md border p-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {waiverReg?.text}
              </div>
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="waiver-agree"
                  checked={waiverAgreed}
                  onChange={e => setWaiverAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
                />
                <label htmlFor="waiver-agree" className="text-sm leading-snug cursor-pointer select-none">
                  I have read and agree to the above waiver. I understand the risks involved and accept the terms.
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setWaiverReg(null); setWaiverAgreed(false); }}>
                  Cancel
                </Button>
                <Button
                  disabled={!waiverAgreed || signWaiverMutation.isPending}
                  onClick={() => waiverReg && signWaiverMutation.mutate(waiverReg.id)}
                >
                  {signWaiverMutation.isPending ? "Signing…" : "Confirm & Sign"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <TabsContent value="addresses" className="space-y-4">
            <Card className={isCleanTheme ? "bg-gray-800 border-gray-700" : ""}>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
                <CardDescription>Manage your shipping addresses</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {Array.from(new Set(orders.map(o => `${o.shippingAddress}, ${o.shippingCity} ${o.shippingPostalCode}`))).map((address, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{orders[0].customerFirstName} {orders[0].customerLastName}</p>
                            <p className="text-sm text-muted-foreground">{address}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No saved addresses</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Order Tracking Modal */}
        <Dialog open={!!trackingOrder} onOpenChange={() => setTrackingOrder(null)}>
          <DialogContent className="max-w-2xl" data-testid="dialog-track-order">
            <DialogHeader>
              <DialogTitle>Track Your Order</DialogTitle>
              <DialogDescription>
                Order {trackingOrder?.orderNumber} - {trackingOrder && new Date(trackingOrder.orderDate).toLocaleDateString('en-GB')}
              </DialogDescription>
            </DialogHeader>

            {trackingOrder && (
              <div className="space-y-6 py-4">
                {/* Status Timeline */}
                <div className="relative">
                  <div className="flex justify-between items-start">
                    {getTrackingSteps(trackingOrder.status).map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1 relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            step.completed 
                              ? 'bg-green-500 text-white' 
                              : step.active 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <p className={`text-xs text-center font-medium ${
                            step.completed || step.active ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </p>
                          {index < 3 && (
                            <div className={`absolute top-6 left-1/2 w-full h-0.5 ${
                              step.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                            }`} style={{ transform: 'translateY(-50%)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Current Status</p>
                      <Badge className={statusColors[trackingOrder.status]}>
                        {statusLabels[trackingOrder.status]}
                      </Badge>
                    </div>

                    {trackingOrder.trackingNumber && (
                      <div>
                        <p className="text-sm font-medium mb-1">Tracking Number</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded" data-testid="text-tracking-number-modal">
                            {trackingOrder.trackingNumber}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(trackingOrder.trackingNumber!)}
                            data-testid="button-copy-tracking"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-1">Order Total</p>
                      <p className="text-lg font-bold">£{parseFloat(trackingOrder.totalAmount).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Shipping Address</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{trackingOrder.customerFirstName} {trackingOrder.customerLastName}</p>
                        <p>{trackingOrder.shippingAddress}</p>
                        <p>{trackingOrder.shippingCity} {trackingOrder.shippingPostalCode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <p className="text-sm font-medium mb-3">Items in this order</p>
                  <div className="space-y-2">
                    {trackingOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && ' • '}
                            {item.color && `Colour: ${item.color}`}
                            {' • '}Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">£{parseFloat(item.unitPrice).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {trackingOrder.status === 'delivered' && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">Order Delivered!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">Your order has been successfully delivered.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent data-testid="dialog-edit-profile">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  placeholder="Enter your first name"
                  className="min-h-11"
                  data-testid="input-edit-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  placeholder="Enter your last name"
                  className="min-h-11"
                  data-testid="input-edit-lastname"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="min-h-11"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                  className="min-h-11"
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
