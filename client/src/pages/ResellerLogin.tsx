import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Lock, Mail, User, Phone, MapPin, TrendingUp, CreditCard, Package, HeadphonesIcon, ChevronRight, Zap, Store, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

export default function ResellerLogin() {
  const { toast } = useToast();
  const [location] = useLocation();
  // Default to showing role selection (isLogin = false) unless coming from login link
  const [isLogin, setIsLogin] = useState(false);
  const [applicationFor, setApplicationFor] = useState<"reseller" | "vendor" | null>(null);

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const apply = params.get("apply");
    const mode = params.get("mode");
    
    if (mode === "login") {
      // Show login form if explicitly requested
      setIsLogin(true);
      setApplicationFor(null);
    } else if (apply === "reseller" || apply === "vendor") {
      // Show registration form with pre-selected role
      setIsLogin(false);
      setApplicationFor(apply as "reseller" | "vendor");
    } else {
      // Default: show role selection
      setIsLogin(false);
      setApplicationFor(null);
    }
  }, [location]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    contactPerson: "",
    phoneNumber: "",
    businessAddress: "",
    businessDescription: "",
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
        // Use unified B2B login - automatically detects Reseller or Wholesaler
        const response = await fetch("/api/auth/b2b/login", {
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

        // Auto-redirect based on account type (Reseller or Wholesaler)
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
        } else {
          // Fallback for reseller dashboard
          window.location.href = "/reseller/dashboard";
        }
      } else {
        // Determine which endpoint to use based on application type
        const endpoint = applicationFor === "vendor" ? "/api/auth/vendor/register" : "/api/auth/reseller/register";
        
        // Build the request body based on application type
        const body: any = {
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          phoneNumber: formData.phoneNumber,
          businessAddress: formData.businessAddress,
        };

        // Add role-specific fields
        if (applicationFor === "reseller") {
          body.contactPerson = formData.contactPerson;
        } else if (applicationFor === "vendor") {
          body.businessDescription = formData.businessDescription;
          body.website = formData.website;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Registration failed. Please try again.");
          return;
        }

        setSuccess(true);
        const typeText = applicationFor === "vendor" ? "Wholesaler" : "Reseller";
        toast({
          title: "Application Submitted!",
          description: `Your ${typeText} application has been received. Our team will review it and notify you via email within 2-3 business days.`,
          duration: 6000,
        });

        setFormData({
          email: "",
          password: "",
          businessName: "",
          contactPerson: "",
          phoneNumber: "",
          businessAddress: "",
          businessDescription: "",
          website: ""
        });
        setApplicationFor(null);
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

  const resellerBenefits = [
    { icon: TrendingUp, title: "Wholesale Pricing", description: "Tier-based volume discounts" },
    { icon: CreditCard, title: "Flexible Terms", description: "Credit options & payment plans" },
    { icon: Package, title: "Real-Time Inventory", description: "Live stock management" },
    { icon: HeadphonesIcon, title: "Priority Support", description: "Dedicated account manager" }
  ];

  const vendorBenefits = [
    { icon: Store, title: "Your Own Products", description: "Create & manage your product line" },
    { icon: Zap, title: "Marketplace Access", description: "Reach thousands of resellers" },
    { icon: TrendingUp, title: "Commission Model", description: "Earn from your sales" },
    { icon: HeadphonesIcon, title: "Dedicated Support", description: "Wholesaler success team" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - B2B Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2070')"
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-blue-900/50 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link 
            href="/" 
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-flex items-start min-h-11"
            data-testid="link-home-logo-reseller"
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
              B2B Platform
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Grow Your Business <br />With 1stRep
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed max-w-md">
                Join as a Reseller or Wholesaler. Resellers sell our products at wholesale pricing. Wholesalers add their own products to our marketplace.
              </p>
            </div>

            {/* B2B Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold">30%+</div>
                <div className="text-sm text-blue-200">Avg. Margins</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-blue-200">Active Partners</div>
              </div>
              <div>
                <div className="text-3xl font-bold">48hr</div>
                <div className="text-sm text-blue-200">Order Processing</div>
              </div>
            </div>
          </div>

          {/* Bottom Testimonial */}
          <div className="space-y-2">
            <p className="text-lg italic text-blue-100">
              "1stRep's platform transformed how we do business. Great margins and incredible support."
            </p>
            <p className="text-sm text-blue-200">- Sarah T., Business Owner</p>
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
              {isLogin ? "B2B Portal" : "Choose Your Role"}
            </h2>
            <p className="text-gray-400">
              {isLogin 
                ? "Access your account" 
                : isLogin || applicationFor ? "Complete your profile" : "Select how you want to grow your business"
              }
            </p>
          </div>

          {/* Application Type Selection (only on signup, if not selected) */}
          {!isLogin && !applicationFor && (
            <div className="space-y-4">
              {/* Reseller Option */}
              <Card 
                className={`p-6 bg-gray-900 border-gray-700 cursor-pointer transition-all ${applicationFor === "reseller" ? "ring-2 ring-white" : "hover:border-gray-500"}`}
                onClick={() => setApplicationFor("reseller")}
                data-testid="card-reseller-option"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-bold text-white">Apply as Reseller</h3>
                  </div>
                  <p className="text-sm text-gray-300">Sell the full 1stRep range of clothing and accessories and earn commission for each sale.</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>✓ Earn between 10-20% commission rates</li>
                    <li>✓ Flexible payment terms</li>
                    <li>✓ Dedicated accounts manager</li>
                    <li>✓ Sell your own items via the POS</li>
                  </ul>
                  <Button 
                    type="button"
                    className="w-full mt-3 bg-white hover:bg-gray-100 text-black"
                    data-testid="button-select-reseller"
                  >
                    Apply as Reseller
                  </Button>
                </div>
              </Card>

              {/* Wholesaler Option */}
              <Card 
                className={`p-6 bg-gray-900 border-gray-700 cursor-pointer transition-all ${applicationFor === "vendor" ? "ring-2 ring-white" : "hover:border-gray-500"}`}
                onClick={() => setApplicationFor("vendor")}
                data-testid="card-vendor-option"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-bold text-white">Apply as Wholesaler</h3>
                  </div>
                  <p className="text-sm text-gray-300">Sell our premium athleisure range via wholesale pricing, with flexible credit terms and tiered discounts.</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>✓ Up to 35% wholesale discounts</li>
                    <li>✓ Tiered wholesale structures</li>
                    <li>✓ Dedicated accounts manager</li>
                  </ul>
                  <Button 
                    type="button"
                    className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-black"
                    data-testid="button-select-vendor"
                  >
                    Apply as Wholesaler
                  </Button>
                </div>
              </Card>

              <div className="text-center pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Already have an account?
                  <button
                    type="button"
                    className="ml-2 text-white font-semibold hover:underline"
                    onClick={() => setIsLogin(true)}
                    data-testid="button-toggle-login"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Form (shown when logged in or after application type selected) */}
          {isLogin || applicationFor ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>
                    Application submitted successfully! Check your email for updates.
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
                        placeholder="Your Business Name"
                        className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        required
                        data-testid="input-business-name"
                      />
                    </div>
                  </div>

                  {/* Reseller-specific fields */}
                  {applicationFor === "reseller" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson" className="text-gray-300 font-medium">Contact Person</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <Input
                            id="contactPerson"
                            name="contactPerson"
                            placeholder="Full Name"
                            className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                            value={formData.contactPerson}
                            onChange={handleInputChange}
                            required
                            data-testid="input-contact-person"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Vendor-specific fields */}
                  {applicationFor === "vendor" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="businessDescription" className="text-gray-300 font-medium">Business Description</Label>
                        <textarea
                          id="businessDescription"
                          name="businessDescription"
                          placeholder="Describe your business and products"
                          className="w-full h-24 px-3 py-2 border border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 rounded-md focus:border-white focus:outline-none"
                          value={formData.businessDescription}
                          onChange={handleInputChange}
                          required
                          data-testid="textarea-business-description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-gray-300 font-medium">Website (Optional)</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                          <Input
                            id="website"
                            name="website"
                            type="url"
                            placeholder="https://yourbusiness.com"
                            className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                            value={formData.website}
                            onChange={handleInputChange}
                            data-testid="input-website"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common fields for both */}
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
          ) : null}

          {/* Benefits Grid - shown after type selection */}
          {applicationFor && !isLogin && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">What You Get:</h3>
              <div className="grid grid-cols-2 gap-3">
                {(applicationFor === "reseller" ? resellerBenefits : vendorBenefits).map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-900 rounded">
                      <Icon className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-xs text-white">{benefit.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Link */}
          {!applicationFor && (
            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Not a business customer?
                <Link
                  href="/account"
                  className="ml-2 text-white font-semibold hover:underline text-sm"
                  data-testid="link-customer"
                >
                  Shop as Individual Customer
                </Link>
              </p>
            </div>
          )}

          {/* Back button when applicationFor is selected */}
          {applicationFor && !isLogin && (
            <div className="text-center pt-2">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white transition-colors"
                onClick={() => setApplicationFor(null)}
                data-testid="button-change-role"
              >
                Change Role Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
