import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ShoppingBag, Heart, TrendingUp, Award, ChevronRight } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function CustomerLogin() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  // wouter's useLocation returns pathname only — use window.location.search for query params
  const redirectTo = new URLSearchParams(window.location.search).get('redirect') || null;
  // Default to registration mode when the path is /register
  const [isLogin, setIsLogin] = useState(!location.startsWith('/register'));
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const endpoint = isLogin ? "/api/auth/customer/login" : "/api/auth/customer/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
        return;
      }

      toast({
        title: isLogin ? "Welcome back!" : "Account created!",
        description: isLogin ? "You have been logged in successfully." : "Your account has been created successfully.",
      });

      // Redirect priority: explicit redirect param → role-based → default
      if (redirectTo) {
        setLocation(redirectTo);
      } else if (data.user?.role === "admin") {
        setLocation("/admin");
      } else if (data.user?.role === "athlete") {
        setLocation("/athlete/dashboard");
      } else if (data.user?.role === "reseller") {
        setLocation("/reseller/dashboard");
      } else if (data.user?.role === "vendor") {
        setLocation("/vendor/dashboard");
      } else if (!isLogin) {
        setLocation("/profile");
      } else {
        setLocation("/");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google/login';
  };

  const benefits = [
    { icon: ShoppingBag, title: "Track Orders", description: "Real-time delivery updates" },
    { icon: Heart, title: "Saved Items", description: "Never lose your favourites" },
    { icon: TrendingUp, title: "Exclusive Access", description: "Early product launches" },
    { icon: Award, title: "Member Rewards", description: "Special offers & discounts" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070')"
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link 
            href="/" 
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-flex items-start min-h-11"
            data-testid="link-home-logo-customer"
          >
            <img 
              src="/1strep-header-logo.png" 
              alt="1stRep" 
              className="h-16 w-auto pointer-events-none" 
            />
          </Link>

          {/* Main Message */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Elevate Your <br />Performance
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-md">
                Join thousands of athletes who trust 1stRep for premium activewear that delivers results.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-gray-400">Active Members</div>
              </div>
              <div>
                <div className="text-3xl font-bold">100+</div>
                <div className="text-sm text-gray-400">Products</div>
              </div>
              <div>
                <div className="text-3xl font-bold">4.9★</div>
                <div className="text-sm text-gray-400">Rating</div>
              </div>
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="space-y-2">
            <p className="text-lg italic text-gray-300">
              "The best activewear I've ever owned. Quality and performance unmatched."
            </p>
            <p className="text-sm text-gray-400">- Sarah M., Professional Athlete</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-start justify-center p-6 bg-black overflow-y-auto">
        <div className="w-full max-w-md space-y-8 mt-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <Link 
              href="/" 
              className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-flex items-center justify-center min-h-11"
              data-testid="link-home-logo-mobile"
            >
              <img 
                src="/1strep-header-logo.png" 
                alt="1stRep" 
                className="h-16 w-auto pointer-events-none" 
              />
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white" data-testid="auth-title">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-400">
              {isLogin 
                ? "Sign in to access your account" 
                : "Join the 1stRep community today"
              }
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full h-14 bg-white border-2 border-white text-black hover:bg-gray-100 font-semibold text-base shadow-sm"
              onClick={handleGoogleLogin}
              data-testid="button-google-login"
            >
              <SiGoogle className="mr-3 h-6 w-6 text-red-500" />
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name Fields (Registration) */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300 font-medium">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      data-testid="input-firstname"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300 font-medium">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      data-testid="input-lastname"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setLocation("/forgot-password")}
                    className="text-sm text-gray-300 hover:text-white hover:underline font-medium"
                    data-testid="link-forgot-password"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>
            </div>

            {/* Confirm Password (Registration) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={!isLogin}
                    minLength={6}
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold text-base" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading 
                ? "Processing..." 
                : isLogin 
                  ? "Sign In" 
                  : "Create Account"
              }
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                className="ml-2 text-white font-semibold hover:underline"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="button-toggle-mode"
              >
                {isLogin ? "Create Account" : "Sign In"}
              </button>
            </p>
          </div>

          {/* B2B Link */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Looking to grow your business?
              <button
                type="button"
                className="ml-2 text-white font-semibold hover:underline text-sm"
                onClick={() => setLocation("/reseller")}
                data-testid="link-reseller"
              >
                Join Our B2B Platform
              </button>
            </p>
          </div>

          {/* Benefits Grid */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4 pt-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-900 rounded">
                    <Icon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-white">{benefit.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
