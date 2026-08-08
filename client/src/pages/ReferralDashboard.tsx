import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Gift, 
  Users, 
  Copy, 
  Share2, 
  Mail, 
  Check, 
  Clock, 
  Award,
  TrendingUp,
  ArrowLeft,
  Link as LinkIcon,
  Star
} from "lucide-react";

export default function ReferralDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
    referralCode: string;
  }>({
    queryKey: ["/api/referrals/my-stats"],
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<any[]>({
    queryKey: ["/api/referrals/my-referrals"],
  });

  const { data: rewards, isLoading: rewardsLoading } = useQuery<any[]>({
    queryKey: ["/api/referrals/my-rewards"],
  });

  const { data: settings } = useQuery<{
    isActive: boolean;
    referrerRewardType: string;
    referrerRewardValue: string;
    refereeDiscountType: string;
    refereeDiscountValue: string;
    minPurchaseAmount: string;
  }>({
    queryKey: ["/api/referral-program/settings"],
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { recipientEmail: string; message: string }) => {
      return apiRequest("POST", "/api/referrals/invite", data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Your referral invitation has been recorded!",
      });
      setInviteEmail("");
      setInviteMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/my-stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const referralLink = stats?.referralCode 
    ? `${window.location.origin}?ref=${stats.referralCode}`
    : "";

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({ recipientEmail: inviteEmail, message: inviteMessage });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "registered":
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Registered</Badge>;
      case "converted":
        return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" />Converted</Badge>;
      case "rewarded":
        return <Badge className="bg-blue-600"><Award className="w-3 h-3 mr-1" />Rewarded</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatRewardValue = () => {
    if (!settings) return "";
    if (settings.referrerRewardType === "points") {
      return `${settings.referrerRewardValue} loyalty points`;
    } else if (settings.referrerRewardType === "percentage") {
      return `${settings.referrerRewardValue}% discount`;
    } else {
      return `£${settings.referrerRewardValue}`;
    }
  };

  const formatRefereeDiscount = () => {
    if (!settings) return "";
    if (settings.refereeDiscountType === "percentage") {
      return `${settings.refereeDiscountValue}% off`;
    } else {
      return `£${settings.refereeDiscountValue} off`;
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/account")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Account
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Refer a Friend</h1>
          <p className="text-muted-foreground">
            Share your referral link and earn rewards when friends make their first purchase!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card data-testid="card-total-referrals">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.successfulReferrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-referrals">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pendingReferrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-earned">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Award className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalEarned || 0}</p>
                  <p className="text-xs text-muted-foreground">Points Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8" data-testid="card-referral-link">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link with friends. When they make their first purchase, you both earn rewards!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="pr-10"
                  data-testid="input-referral-link"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => copyToClipboard(referralLink)}
                  data-testid="button-copy-link"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold">Your Code: {stats?.referralCode}</p>
                <p className="text-sm text-muted-foreground">
                  Friends can enter this at checkout
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(stats?.referralCode || "")}
                data-testid="button-copy-code"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="font-semibold">You Get</span>
                </div>
                <p className="text-lg font-bold text-primary">{formatRewardValue()}</p>
                <p className="text-xs text-muted-foreground">per successful referral</p>
              </div>
              <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">They Get</span>
                </div>
                <p className="text-lg font-bold text-green-500">{formatRefereeDiscount()}</p>
                <p className="text-xs text-muted-foreground">on their first order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="invite" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invite" data-testid="tab-invite">Invite Friends</TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="rewards" data-testid="tab-rewards">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="invite">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Email Invitation
                </CardTitle>
                <CardDescription>
                  Invite a friend via email with a personalised message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Friend's Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    data-testid="input-invite-email"
                  />
                </div>
                <div>
                  <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                  <Textarea
                    id="invite-message"
                    placeholder="Hey! I've been shopping at 1stRep and thought you'd love their fitness apparel..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    data-testid="input-invite-message"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSendInvite} 
                  disabled={inviteMutation.isPending}
                  data-testid="button-send-invite"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
                <CardDescription>
                  Track the status of all your referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                ) : referrals && referrals.length > 0 ? (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div 
                        key={referral.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        data-testid={`referral-item-${referral.id}`}
                      >
                        <div>
                          <p className="font-medium">{referral.refereeEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            Referred on {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(referral.status)}
                          {referral.referrerRewardAmount && (
                            <p className="text-sm text-green-500 mt-1">
                              +{referral.referrerRewardAmount} {referral.referrerRewardType}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No referrals yet</p>
                    <p className="text-sm">Share your link to start earning rewards!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <CardTitle>Reward History</CardTitle>
                <CardDescription>
                  View all rewards you've earned from referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rewardsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                ) : rewards && rewards.length > 0 ? (
                  <div className="space-y-3">
                    {rewards.map((reward) => (
                      <div 
                        key={reward.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        data-testid={`reward-item-${reward.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <Award className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">{reward.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(reward.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">+{reward.rewardValue}</p>
                          <p className="text-xs text-muted-foreground capitalize">{reward.rewardType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No rewards yet</p>
                    <p className="text-sm">Rewards appear here when your referrals make purchases</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
