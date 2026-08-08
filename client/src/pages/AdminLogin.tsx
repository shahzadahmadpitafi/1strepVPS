import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Shield } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
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
        setError(data.error || "Authentication failed");
        return;
      }

      toast({
        title: "Welcome back, Admin!",
        description: "You have been logged in successfully.",
      });

      // Redirect to admin dashboard
      setLocation("/admin");
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link 
            href="/" 
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 inline-flex items-center justify-center min-h-11"
            data-testid="link-home-logo-admin"
          >
            <img 
              src="/1strep-header-logo.png" 
              alt="1stRep" 
              className="h-20 w-auto pointer-events-none" 
            />
          </Link>
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white" data-testid="admin-login-title">
                Admin Access
              </h1>
            </div>
            <p className="text-gray-400">
              Secure administrator login portal
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@1strep.com"
                  className="pl-10 border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  data-testid="input-admin-email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-sm text-gray-300 hover:text-white hover:underline"
                  data-testid="link-forgot-password"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter admin password"
                  className="pl-10 border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  data-testid="input-admin-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-white hover:bg-gray-100 text-black"
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? "Signing in..." : "Sign in as Admin"}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Not an admin?{" "}
            <button
              onClick={() => setLocation("/account")}
              className="text-white hover:underline"
              data-testid="link-customer-login"
            >
              Customer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
