import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, ChevronRight, Store, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function B2BLogin() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/b2b/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      // Auto-redirect based on role
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - B2B Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2070')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-blue-900/50 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <Link 
            href="/" 
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-flex items-start min-h-11"
            data-testid="link-home-logo"
          >
            <img 
              src="/1strep-header-logo.png" 
              alt="1stRep" 
              className="h-16 w-auto pointer-events-none" 
            />
          </Link>

          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase mb-4">
              B2B Platform
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                Access Your Account
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed max-w-md">
                Sign in as a Reseller or Wholesaler. We automatically detect your account type.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  <h3 className="font-semibold">Resellers</h3>
                </div>
                <p className="text-sm text-blue-200">Sell our products at wholesale pricing</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-semibold">Wholesalers</h3>
                </div>
                <p className="text-sm text-blue-200">Create and manage your products</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-lg italic text-blue-100">
              "1stRep's platform transformed how we do business."
            </p>
            <p className="text-sm text-blue-200">- Sarah T., Business Owner</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-black">
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
              B2B Portal
            </h2>
            <p className="text-gray-400">
              Access your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="business@example.com"
                  className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  data-testid="link-forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 h-12 border-gray-700 bg-gray-900 text-white placeholder:text-gray-500 focus:border-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold text-base" 
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Signing in..." : "Sign In to Portal"}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          {/* Footer Links */}
          <div className="space-y-3 border-t border-gray-700 pt-6">
            <p className="text-sm text-gray-400">
              New to 1stRep? 
              <Link 
                href="/reseller" 
                className="ml-2 text-white font-semibold hover:underline"
                data-testid="link-apply"
              >
                Apply as Reseller or Wholesaler
              </Link>
            </p>
            <p className="text-sm text-gray-400">
              Looking to shop?
              <Link 
                href="/login" 
                className="ml-2 text-white font-semibold hover:underline"
                data-testid="link-customer"
              >
                Customer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
