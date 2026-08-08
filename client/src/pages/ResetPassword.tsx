import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [paramsError, setParamsError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Extract email and OTP from URL query params
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const otpParam = params.get("otp");
    
    if (emailParam && otpParam) {
      setEmail(emailParam);
      setOtp(otpParam);
    } else {
      setParamsError("Invalid reset link. Please request a new password reset.");
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password-with-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <img 
              src="/1strep-header-logo.png" 
              alt="1stRep" 
              className="h-20 w-auto mx-auto" 
            />
            <div>
              <h1 className="text-3xl font-bold text-white" data-testid="text-password-reset-success">
                Password Reset Successful
              </h1>
              <p className="text-gray-400 mt-2">
                Your password has been updated successfully
              </p>
            </div>
          </div>

          {/* Success Message */}
          <Card className="p-6 bg-gray-900 border-gray-700">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-gray-300">
                Redirecting you to login...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!email || !otp || paramsError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <img 
              src="/1strep-header-logo.png" 
              alt="1stRep" 
              className="h-20 w-auto mx-auto" 
            />
            <div>
              <h1 className="text-3xl font-bold text-white">Invalid Link</h1>
              <p className="text-gray-400 mt-2">
                This password reset link is invalid or has expired
              </p>
            </div>
          </div>

          <Card className="p-6 bg-gray-900 border-gray-700">
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {paramsError || "Invalid reset link. Please request a new password reset."}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setLocation("/forgot-password")}
                className="w-full bg-white hover:bg-gray-100 text-black"
                data-testid="button-request-new-link"
              >
                Request New Reset Link
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <img 
            src="/1strep-header-logo.png" 
            alt="1stRep" 
            className="h-20 w-auto mx-auto" 
          />
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="text-reset-password">
              Reset Password
            </h1>
            <p className="text-gray-400 mt-2">
              Enter your new password below
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  data-testid="input-confirm-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-white hover:bg-gray-100 text-black"
              disabled={isLoading}
              data-testid="button-reset-password"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
