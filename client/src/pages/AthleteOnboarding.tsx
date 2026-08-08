import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Gift,
  Camera,
  Users,
  Star,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import HeaderClean from "@/components/HeaderClean";

type AthleteProfile = {
  id: string;
  discount_code: string;
  discount_percentage: number;
  tracking_link: string | null;
  sport: string;
  onboarding_completed: boolean;
  first_name: string;
  last_name: string;
};

export default function AthleteOnboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const { toast } = useToast();

  const totalSteps = 3;

  const { data: profile, isLoading } = useQuery<AthleteProfile>({
    queryKey: ["/api/athlete/profile"],
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/athlete/profile", {
        bio,
        onboardingCompleted: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/profile"] });
      toast({ title: "Welcome to Team 1stRep!", description: "Your onboarding is complete." });
      navigate("/athlete/dashboard");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete onboarding", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    navigate("/athlete-program");
    return null;
  }

  if (profile.onboarding_completed) {
    navigate("/athlete/dashboard");
    return null;
  }

  const benefits = [
    { icon: Gift, title: "50% Product Discount", description: "Use your exclusive code on all products" },
    { icon: Camera, title: "Content Features", description: "Get featured on our social channels" },
    { icon: Users, title: "Community Access", description: "Join exclusive athlete events" },
    { icon: Star, title: "Early Access", description: "First to try new products" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <HeaderClean />
      
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
            <span className="text-sm font-medium">{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        {step === 1 && (
          <Card className="animate-in fade-in duration-500">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl" data-testid="text-welcome-title">
                Welcome to Team 1stRep, {profile.first_name}!
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Congratulations on becoming a 1stRep Athlete
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  You've been approved for the 1stRep Influencer Programme. Let's get you set up with everything you need to succeed.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Your Exclusive Benefits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{benefit.title}</p>
                          <p className="text-xs text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setStep(2)}
                data-testid="button-get-started"
              >
                Get Started
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-in fade-in duration-500">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Gift className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-3xl" data-testid="text-discount-title">
                Your Discount Codes
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                A personal code for you, plus a referral code to share
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Personal 50% first-order code */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">Your personal first-order code (50% off)</p>
                <code className="text-3xl font-bold tracking-wider" data-testid="text-discount-code">
                  {profile.tracking_link ? `${profile.tracking_link}50` : `${profile.discount_code}50`}
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  One-time use · for your own first order only
                </p>
              </div>

              {/* Referral code */}
              <div className="bg-muted/50 rounded-lg p-4 text-center mb-6">
                <p className="text-xs text-muted-foreground mb-1">Your shareable referral code (10% off for customers)</p>
                <code className="text-xl font-bold tracking-wider" data-testid="text-referral-code">
                  {profile.tracking_link ? `${profile.tracking_link}10` : `${profile.discount_code}10`}
                </code>
                <p className="text-xs text-muted-foreground mt-1">Share this with your audience — you earn credits every time it's used</p>
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="font-medium">How to use your personal code:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
                    <p className="text-sm">Shop your favourite 1stRep products</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
                    <p className="text-sm">Enter your personal code at checkout</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</div>
                    <p className="text-sm">Enjoy 50% off your first order!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  data-testid="button-back"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg" 
                  onClick={() => setStep(3)}
                  data-testid="button-continue"
                >
                  Continue
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="animate-in fade-in duration-500">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Camera className="h-8 w-8 text-purple-500" />
              </div>
              <CardTitle className="text-3xl" data-testid="text-profile-title">
                Complete Your Profile
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Tell us a bit about yourself
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="bio">Your Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your fitness journey, achievements, and what drives you..."
                    className="min-h-[120px]"
                    data-testid="input-bio"
                  />
                  <p className="text-xs text-muted-foreground">
                    This may be displayed on your athlete profile if featured.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Ready to go!
                </h4>
                <p className="text-sm text-muted-foreground">
                  After completing onboarding, you'll have access to your full influencer dashboard where you can track your performance, share your links, and manage your benefits.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
                  data-testid="button-back-step3"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  className="flex-1" 
                  size="lg" 
                  onClick={() => completeOnboardingMutation.mutate()}
                  disabled={completeOnboardingMutation.isPending}
                  data-testid="button-complete-onboarding"
                >
                  {completeOnboardingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Onboarding
                      <CheckCircle className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
