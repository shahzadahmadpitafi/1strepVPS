import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Lock, Mail, Globe, Phone, MapPin, TrendingUp, Package, Zap, Users, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function VendorLogin() {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    businessDescription: "",
    businessAddress: "",
    phoneNumber: "",
    website: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await fetch("/api/auth/vendor/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Login failed. Please try again.");
          return;
        }

        // Use the redirect URL from the server response (wholesalers go to /wholesaler/dashboard)
        window.location.href = data.redirectTo || "/wholesaler/dashboard";
      } else {
        const response = await fetch("/api/auth/vendor/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            businessName: formData.businessName,
            businessDescription: formData.businessDescription,
            businessAddress: formData.businessAddress,
            phoneNumber: formData.phoneNumber,
            website: formData.website,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Registration failed. Please try again.");
          return;
        }

        setSuccess(true);
        toast({
          title: "Application Submitted!",
          description: "Your wholesaler application has been received. Our team will review it and notify you via email within 2-3 business days.",
          duration: 6000,
        });

        setFormData({
          email: "",
          password: "",
          businessName: "",
          businessDescription: "",
          businessAddress: "",
          phoneNumber: "",
          website: ""
        });
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const benefits = [
    { icon: TrendingUp, title: "Premium Exposure", description: "Showcase products to thousands of resellers" },
    { icon: Package, title: "Easy Management", description: "Manage products and permissions easily" },
    { icon: Zap, title: "Commission Tracking", description: "Real-time sales and commission reports" },
    { icon: Users, title: "Reseller Network", description: "Connect with growing reseller partners" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Vendor Program Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-gray-900 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070')"
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-emerald-900/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link 
            href="/" 
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-flex items-start min-h-11"
            data-testid="link-home-logo-vendor"
          >
            <img 
              src="/1strep-header-logo.png" 
              alt="1stRep" 
              className="h-16 w-auto pointer-events-none" 
            />
          </Link>

          {/* Main Message */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase mb-4">
              Wholesaler Programme
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Expand Your Reach <br />Through 1stRep
              </h1>
              <p className="text-xl text-emerald-100 leading-relaxed max-w-md">
                List your products on our platform and reach a network of verified resellers across the UK. Grow your B2B business with our partner network.
              </p>
            </div>

            {/* Wholesaler Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-emerald-200">Active Wholesalers</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-emerald-200">Reseller Partners</div>
              </div>
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-emerald-200">Wholesaler Support</div>
              </div>
            </div>
          </div>

          {/* Bottom Testimonial */}
          <div className="space-y-2">
            <p className="text-lg italic text-emerald-100">
              "1stRep's wholesaler programme opened doors to B2B opportunities I never imagined. Fantastic platform and support."
            </p>
            <p className="text-sm text-emerald-200">- Sarah M., Apparel Manufacturer</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-black overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
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
              {isLogin ? "Wholesaler Portal" : "Apply as Wholesaler"}
            </h2>
            <p className="text-gray-400">
              {isLogin 
                ? "Access your wholesaler dashboard" 
                : "Join our B2B wholesaler network"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>
                  Application submitted successfully! Check your email for updates on your wholesaler application status.
                </AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="business@example.com"
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
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                    data-testid="link-forgot-password"
                  >
                    Forgot Password?
                  </Link>
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
                  data-testid="input-password"
                />
              </div>
            </div>

            {/* Registration Fields */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-gray-300 font-medium">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Your Company Name"
                      className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                      data-testid="input-business-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription" className="text-gray-300 font-medium">Business Description</Label>
                  <textarea
                    id="businessDescription"
                    name="businessDescription"
                    placeholder="Tell us about your business and products"
                    className="w-full h-20 px-4 py-2 border border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 rounded-md focus:outline-none focus:border-white text-sm resize-none"
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    data-testid="textarea-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-gray-300 font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="+44 7XXX XXXXXX"
                      className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress" className="text-gray-300 font-medium">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      id="businessAddress"
                      name="businessAddress"
                      placeholder="Full business address"
                      className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      required
                      data-testid="input-address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-gray-300 font-medium">Website (Optional)</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://yourwebsite.com"
                      className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                      value={formData.website}
                      onChange={handleInputChange}
                      data-testid="input-website"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold text-base" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading 
                ? "Processing..." 
                : isLogin 
                  ? "Sign In to Portal" 
                  : "Submit Application"
              }
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-gray-400">
              {isLogin ? "New wholesaler?" : "Already have an account?"}
              <button
                type="button"
                className="ml-2 text-white font-semibold hover:underline"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="button-toggle-mode"
              >
                {isLogin ? "Apply for Wholesaler Account" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Customer Link */}
          <div className="text-center pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Looking for reseller opportunities?
              <Link
                href="/reseller-login"
                className="ml-2 text-white font-semibold hover:underline text-sm"
                data-testid="link-reseller"
              >
                Apply as Reseller
              </Link>
            </p>
          </div>

          {/* Benefits Grid */}
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
        </div>
      </div>
    </div>
  );
}
