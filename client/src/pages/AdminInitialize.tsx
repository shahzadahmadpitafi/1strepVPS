import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle } from "lucide-react";

export default function AdminInitialize() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [needsInitialization, setNeedsInitialization] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if initialization is needed
    fetch("/api/admin/initialization-required")
      .then(res => res.json())
      .then(data => {
        setNeedsInitialization(data.needsInitialization);
        if (!data.needsInitialization) {
          // Admin already exists, redirect to login
          setTimeout(() => setLocation("/account"), 2000);
        }
      })
      .catch(err => {
        console.error("Failed to check initialization status:", err);
        setError("Failed to check system status");
      });
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create admin account");
        return;
      }

      setIsSuccess(true);
      
      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        setLocation("/admin");
      }, 2000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Admin initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (needsInitialization === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (needsInitialization === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">Admin Already Exists</h2>
          <p className="text-muted-foreground mb-4">
            Your system has already been initialized. Redirecting to login...
          </p>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2" data-testid="text-success-heading">
            Admin Account Created!
          </h2>
          <p className="text-muted-foreground mb-4">
            Your admin account has been successfully created. Redirecting to admin dashboard...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <img 
            src="/1strep-header-logo.png" 
            alt="1stRep" 
            className="h-20 w-auto mx-auto" 
          />
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold" data-testid="text-admin-initialize">
                Admin Setup
              </h1>
            </div>
            <p className="text-muted-foreground">
              Create your admin account to manage 1stRep
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              This is a one-time setup. You can only create one admin account.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@1strep.com"
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                data-testid="input-password"
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                data-testid="input-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-create-admin"
            >
              {isLoading ? "Creating Account..." : "Create Admin Account"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => setLocation("/account")}
            className="text-primary hover:underline"
            data-testid="link-login"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
