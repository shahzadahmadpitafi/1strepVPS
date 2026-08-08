import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Gift, 
  Users, 
  Settings, 
  TrendingUp, 
  Award,
  Check,
  Save,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Lightbulb,
  AlertCircle
} from "lucide-react";

export default function AdminReferralProgram() {
  const { toast } = useToast();
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    totalReferralCodes: number;
    totalReferrals: number;
    successfulReferrals: number;
    totalRewardsGiven: number;
    topReferrers: any[];
  }>({
    queryKey: ["/api/admin/referrals/stats"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<{
    id?: string;
    isActive: boolean;
    referrerRewardType: string;
    referrerRewardValue: string;
    refereeDiscountType: string;
    refereeDiscountValue: string;
    minPurchaseAmount: string;
    maxReferralsPerMonth: number;
    rewardExpiryDays: number;
    requirePurchaseForReward: boolean;
  }>({
    queryKey: ["/api/admin/referrals/settings"],
  });

  const [formData, setFormData] = useState({
    isActive: true,
    referrerRewardType: 'points',
    referrerRewardValue: '500',
    refereeDiscountType: 'percentage',
    refereeDiscountValue: '10',
    minPurchaseAmount: '25',
    maxReferralsPerMonth: 10,
    rewardExpiryDays: 90,
    requirePurchaseForReward: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/admin/referrals/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Referral program settings have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals/settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateMutation.mutate({
      isActive: formData.isActive,
      referrerRewardType: formData.referrerRewardType,
      referrerRewardValue: formData.referrerRewardValue,
      refereeDiscountType: formData.refereeDiscountType,
      refereeDiscountValue: formData.refereeDiscountValue,
      minPurchaseAmount: formData.minPurchaseAmount,
      maxReferralsPerMonth: formData.maxReferralsPerMonth,
      rewardExpiryDays: formData.rewardExpiryDays,
      requirePurchaseForReward: formData.requirePurchaseForReward,
    });
  };

  useEffect(() => {
    if (settings && !settingsLoading) {
      setFormData({
        isActive: settings.isActive ?? true,
        referrerRewardType: settings.referrerRewardType || 'points',
        referrerRewardValue: settings.referrerRewardValue || '500',
        refereeDiscountType: settings.refereeDiscountType || 'percentage',
        refereeDiscountValue: settings.refereeDiscountValue || '10',
        minPurchaseAmount: settings.minPurchaseAmount || '25',
        maxReferralsPerMonth: settings.maxReferralsPerMonth ?? 10,
        rewardExpiryDays: settings.rewardExpiryDays ?? 90,
        requirePurchaseForReward: settings.requirePurchaseForReward ?? true,
      });
    }
  }, [settings, settingsLoading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Referral Program</h1>
          <p className="text-muted-foreground">
            Manage your customer referral program and track performance
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetchStats()}
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-total-codes">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.totalReferralCodes || 0}</p>
                <p className="text-xs text-muted-foreground">Referral Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-referrals">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.totalReferrals || 0}</p>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-successful-referrals">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.successfulReferrals || 0}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-rewards">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsLoading ? "-" : stats?.totalRewardsGiven?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Rewards Given</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="top-referrers" data-testid="tab-top-referrers">
            <TrendingUp className="w-4 h-4 mr-2" />
            Top Referrers
          </TabsTrigger>
          <TabsTrigger value="guide" data-testid="tab-guide">
            <BookOpen className="w-4 h-4 mr-2" />
            How It Works
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>
                Configure how your referral program works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Program Active</p>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable the referral program
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-program-active"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Referrer Reward (What they earn)</h3>
                  <div>
                    <Label htmlFor="referrer-reward-type">Reward Type</Label>
                    <Select
                      value={formData.referrerRewardType}
                      onValueChange={(value) => setFormData({ ...formData, referrerRewardType: value })}
                    >
                      <SelectTrigger id="referrer-reward-type" data-testid="select-referrer-reward-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Loyalty Points</SelectItem>
                        <SelectItem value="percentage">Percentage Discount</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referrer-reward-value">Reward Value</Label>
                    <Input
                      id="referrer-reward-value"
                      type="number"
                      value={formData.referrerRewardValue}
                      onChange={(e) => setFormData({ ...formData, referrerRewardValue: e.target.value })}
                      data-testid="input-referrer-reward-value"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.referrerRewardType === 'points' ? 'Points earned per successful referral' : 
                       formData.referrerRewardType === 'percentage' ? 'Discount percentage' : 
                       'Amount in GBP'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Referee Discount (What they get)</h3>
                  <div>
                    <Label htmlFor="referee-discount-type">Discount Type</Label>
                    <Select
                      value={formData.refereeDiscountType}
                      onValueChange={(value) => setFormData({ ...formData, refereeDiscountType: value })}
                    >
                      <SelectTrigger id="referee-discount-type" data-testid="select-referee-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Discount</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referee-discount-value">Discount Value</Label>
                    <Input
                      id="referee-discount-value"
                      type="number"
                      value={formData.refereeDiscountValue}
                      onChange={(e) => setFormData({ ...formData, refereeDiscountValue: e.target.value })}
                      data-testid="input-referee-discount-value"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.refereeDiscountType === 'percentage' ? 'Discount percentage for referred customers' : 
                       'Fixed discount amount in GBP'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold">Additional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min-purchase">Minimum Purchase Amount (£)</Label>
                    <Input
                      id="min-purchase"
                      type="number"
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                      data-testid="input-min-purchase"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum order value to qualify
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="max-referrals">Max Referrals Per Month</Label>
                    <Input
                      id="max-referrals"
                      type="number"
                      value={formData.maxReferralsPerMonth}
                      onChange={(e) => setFormData({ ...formData, maxReferralsPerMonth: parseInt(e.target.value) || 10 })}
                      data-testid="input-max-referrals"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Limit per referrer per month
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="expiry-days">Reward Expiry (Days)</Label>
                    <Input
                      id="expiry-days"
                      type="number"
                      value={formData.rewardExpiryDays}
                      onChange={(e) => setFormData({ ...formData, rewardExpiryDays: parseInt(e.target.value) || 90 })}
                      data-testid="input-expiry-days"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Days until pending referral expires
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Require Purchase for Reward</p>
                    <p className="text-sm text-muted-foreground">
                      Referrer only earns reward after referee makes a purchase
                    </p>
                  </div>
                  <Switch
                    checked={formData.requirePurchaseForReward}
                    onCheckedChange={(checked) => setFormData({ ...formData, requirePurchaseForReward: checked })}
                    data-testid="switch-require-purchase"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-referrers">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
              <CardDescription>
                Customers with the most successful referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : stats?.topReferrers && stats.topReferrers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead className="text-right">Successful Referrals</TableHead>
                      <TableHead className="text-right">Total Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topReferrers.map((referrer, index) => (
                      <TableRow key={referrer.userId} data-testid={`row-referrer-${referrer.userId}`}>
                        <TableCell>
                          {index < 3 ? (
                            <Badge className={
                              index === 0 ? "bg-yellow-500" : 
                              index === 1 ? "bg-gray-400" : 
                              "bg-amber-700"
                            }>
                              #{index + 1}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">#{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{referrer.userName}</p>
                            <p className="text-sm text-muted-foreground">{referrer.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{referrer.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {referrer.successfulReferrals}
                        </TableCell>
                        <TableCell className="text-right text-green-500 font-medium">
                          {parseFloat(referrer.totalEarned).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No referrers yet</p>
                  <p className="text-sm">Top referrers will appear here once customers start referring friends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  How the Referral Programme Works
                </CardTitle>
                <CardDescription>
                  A complete guide to understanding and managing your customer referral programme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">The Customer Journey</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="font-bold text-primary">1</span>
                      </div>
                      <p className="font-medium text-sm">Customer Gets Code</p>
                      <p className="text-xs text-muted-foreground mt-1">Logged-in customers visit their Referral Dashboard to get a unique link</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="font-bold text-primary">2</span>
                      </div>
                      <p className="font-medium text-sm">They Share</p>
                      <p className="text-xs text-muted-foreground mt-1">They share their referral link via social media, email, or word of mouth</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="font-bold text-primary">3</span>
                      </div>
                      <p className="font-medium text-sm">Friend Buys</p>
                      <p className="text-xs text-muted-foreground mt-1">The friend uses the link and receives a discount on their first order</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="font-bold text-primary">4</span>
                      </div>
                      <p className="font-medium text-sm">Reward Issued</p>
                      <p className="text-xs text-muted-foreground mt-1">After payment confirms, the original customer earns their reward</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Two-Way Benefit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium">Referrer (Existing Customer)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Earns rewards (loyalty points, percentage discount, or fixed amount) for each successful referral that results in a purchase.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Referee (New Customer)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Gets a discount (percentage or fixed amount) on their first purchase when using a referral link.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings Explained
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Referrer Reward Options</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Reward Type</th>
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Example</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Loyalty Points</td>
                          <td className="py-2 text-muted-foreground">Points added to their account</td>
                          <td className="py-2">500 points per referral</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Percentage Discount</td>
                          <td className="py-2 text-muted-foreground">A percentage off their next order</td>
                          <td className="py-2">10% off next purchase</td>
                        </tr>
                        <tr>
                          <td className="py-2">Fixed Amount</td>
                          <td className="py-2 text-muted-foreground">A set pound amount off their next order</td>
                          <td className="py-2">£5 off next purchase</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Additional Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm">Minimum Purchase</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The minimum order value required for a referral to count as successful. Set this above your average product price.
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm">Max Referrals/Month</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Limits how many rewards a single customer can earn per month. Prevents abuse of the programme.
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm">Reward Expiry</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        How long a pending referral remains valid. 60-90 days is typical for e-commerce.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Recommended Starting Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Setting</th>
                        <th className="text-left py-2 font-medium">Recommended Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Programme Active</td>
                        <td className="py-2"><Badge variant="outline" className="bg-green-500/10 text-green-600">On</Badge></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Referrer Reward Type</td>
                        <td className="py-2">Loyalty Points</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Referrer Reward Value</td>
                        <td className="py-2">500 points</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Referee Discount Type</td>
                        <td className="py-2">Percentage Discount</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Referee Discount Value</td>
                        <td className="py-2">10%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Minimum Purchase</td>
                        <td className="py-2">£30</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Max Referrals/Month</td>
                        <td className="py-2">15</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Reward Expiry</td>
                        <td className="py-2">90 days</td>
                      </tr>
                      <tr>
                        <td className="py-2">Require Purchase for Reward</td>
                        <td className="py-2"><Badge variant="outline" className="bg-green-500/10 text-green-600">On</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Troubleshooting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Referral Not Working?</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Check that the programme is Active</li>
                      <li>Verify the referred customer's order meets the minimum purchase amount</li>
                      <li>Ensure the referrer hasn't exceeded their monthly referral limit</li>
                      <li>Confirm the referral link hasn't expired</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Reward Not Issued?</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>For card/Klarna/Clearpay payments: Wait for payment confirmation (can take a few minutes)</li>
                      <li>Check the order status is confirmed/paid</li>
                      <li>Verify "Require Purchase for Reward" setting matches your expectations</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Customer Can't Find Their Code?</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Direct customers to: Log into their account → Visit the Referral Dashboard page → Their unique code and sharing link will be displayed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
