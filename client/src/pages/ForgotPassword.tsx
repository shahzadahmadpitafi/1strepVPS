import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  // Pre-fill email if passed as ?email= query param (e.g. from approval email link)
  const prefillEmail = new URLSearchParams(location.split('?')[1] || '').get('email') || '';
  const [email, setEmail] = useState(prefillEmail);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code",
      });
      setStep('otp');
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Forgot password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      toast({
        title: "OTP Verified",
        description: "Redirecting to password reset...",
      });

      // Redirect to reset password page with email and OTP
      setLocation(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("OTP verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-white" data-testid="text-forgot-password">
              {step === 'email' ? 'Forgot Password' : 'Enter Verification Code'}
            </h1>
            <p className="text-gray-400 mt-2">
              {step === 'email' 
                ? "Enter your email address and we'll send you a verification code" 
                : "Enter the 6-digit code sent to your email"}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white"
                    placeholder="your@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-white hover:bg-gray-100 text-black"
                disabled={isLoading}
                data-testid="button-send-otp"
              >
                {isLoading ? "Sending..." : "Send Verification Code"}
              </Button>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-300 hover:text-white transition-colors w-full flex items-center justify-center"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-300">Verification Code</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    maxLength={6}
                    className="pl-10 border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus:border-white text-center text-lg tracking-widest"
                    placeholder="000000"
                    required
                    data-testid="input-otp"
                  />
                </div>
                <p className="text-xs text-gray-500">Enter the 6-digit code sent to {email}</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-white hover:bg-gray-100 text-black"
                disabled={isLoading || otp.length !== 6}
                data-testid="button-verify-otp"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp("");
                    setError("");
                  }}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  data-testid="button-back-to-email"
                >
                  Back to Email
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
