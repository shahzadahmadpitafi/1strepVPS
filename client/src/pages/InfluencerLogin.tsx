import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Mail, Lock, Eye, EyeOff, ChevronRight, ArrowRight, Loader2, CheckCircle, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const GOLD = "#C9A84C";

type Mode = "login" | "apply" | "reset";
type ResetStep = "email" | "otp" | "newpass" | "done";

export default function InfluencerLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/athlete/dashboard";

  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [applyForm, setApplyForm] = useState({
    fullName: "", email: "", phone: "", instagram: "", tiktok: "",
    youtube: "", sport: "", followerCount: "", message: ""
  });
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  // Password reset state
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setResetError("");
    setResetStep("email");
    setResetEmail(loginForm.email);
    setResetOtp("");
    setResetPassword("");
    setResetConfirm("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/influencer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Welcome back!", description: "Redirecting to your dashboard…" });
      navigate(redirectTo);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      const res = await fetch("/api/athlete-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applyForm),
      });
      const data = await res.json();
      if (res.ok) {
        setApplySuccess(true);
      } else {
        toast({
          title: res.status === 409 ? "Already Applied" : "Submission Error",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Submission Error", description: "Please try again.", variant: "destructive" });
    } finally {
      setApplyLoading(false);
    }
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      await res.json();
      // Always advance to OTP step (prevents email enumeration)
      setResetStep("otp");
      toast({ title: "Code sent", description: "Check your email for a 6-digit verification code." });
    } catch {
      setResetError("Failed to send code. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Invalid or expired code. Please try again.");
        return;
      }
      setResetStep("newpass");
    } catch {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Step 3: Set new password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Failed to set password. Please start again.");
        return;
      }
      setResetStep("done");
    } catch {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0D0D0D", color: "#F5F5F0" }}>
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="/1strep-header-logo.png" alt="1stRep" className="h-10 w-auto object-contain cursor-pointer" />
        </Link>
        <Link href="/athletes">
          <Button variant="ghost" className="text-white/60 hover:text-white text-sm gap-1">
            Learn about the programme
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Gold badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 border text-xs font-bold tracking-widest uppercase"
              style={{ borderColor: GOLD, color: GOLD }}>
              <Trophy className="w-3.5 h-3.5" />
              Influencer Portal
            </div>
          </div>

          {/* Tab switcher — hide when in reset mode */}
          {mode !== "reset" && (
            <div className="flex border-b mb-8" style={{ borderColor: "#2a2a2a" }}>
              <button
                onClick={() => switchMode("login")}
                className="flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors"
                style={{
                  borderBottom: mode === "login" ? `2px solid ${GOLD}` : "2px solid transparent",
                  color: mode === "login" ? GOLD : "#808080",
                }}
                data-testid="tab-login"
              >
                Log In
              </button>
              <button
                onClick={() => switchMode("apply")}
                className="flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors"
                style={{
                  borderBottom: mode === "apply" ? `2px solid ${GOLD}` : "2px solid transparent",
                  color: mode === "apply" ? GOLD : "#808080",
                }}
                data-testid="tab-apply"
              >
                Apply Now
              </button>
            </div>
          )}

          {/* LOGIN MODE */}
          {mode === "login" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-black mb-2" style={{ color: "#F5F5F0" }}>Welcome back</h1>
                <p style={{ color: "#808080" }} className="text-sm">
                  Log in to access your influencer dashboard, check your credits, and manage your content.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 border text-sm" style={{ borderColor: "#7f1d1d", background: "#1f0a0a", color: "#fca5a5" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a4a" }} />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                      className="pl-10 bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                      style={{ borderColor: "#2a2a2a" }}
                      data-testid="input-influencer-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => switchMode("reset")}
                      className="text-xs hover:underline"
                      style={{ color: GOLD }}
                      data-testid="link-forgot-password"
                    >
                      Forgot / Set password
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a4a" }} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      className="pl-10 pr-10 bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                      style={{ borderColor: "#2a2a2a" }}
                      data-testid="input-influencer-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-bold"
                  style={{ background: GOLD, color: "#0D0D0D" }}
                  data-testid="button-influencer-login"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Log In to Dashboard <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>

              {/* First-time info box */}
              <div className="mt-6 p-4 border rounded-md text-sm" style={{ borderColor: "#2a2a2a", background: "#111" }}>
                <p className="font-semibold mb-1" style={{ color: GOLD }}>First time logging in?</p>
                <p style={{ color: "#808080" }}>
                  When your application is approved, you'll receive a temporary password by email.
                  Use the{" "}
                  <button onClick={() => switchMode("reset")} className="underline font-semibold" style={{ color: GOLD }}>
                    "Forgot / Set password"
                  </button>{" "}
                  link above to create your own password at any time.
                </p>
              </div>

              <p className="mt-6 text-center text-sm" style={{ color: "#606060" }}>
                Not yet part of the programme?{" "}
                <button onClick={() => switchMode("apply")} className="font-semibold hover:underline" style={{ color: GOLD }}>
                  Apply here
                </button>
              </p>

              <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "#1a1a1a" }}>
                <p className="text-xs" style={{ color: "#404040" }}>
                  Not an influencer?{" "}
                  <Link href="/account" className="hover:underline" style={{ color: "#606060" }}>
                    Customer login
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* RESET PASSWORD MODE */}
          {mode === "reset" && (
            <div>
              {/* Back button */}
              <button
                onClick={() => switchMode("login")}
                className="flex items-center gap-2 text-sm mb-8 hover:underline"
                style={{ color: "#808080" }}
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>

              {/* Step: email */}
              {resetStep === "email" && (
                <div>
                  <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}40` }}>
                      <KeyRound className="w-6 h-6" style={{ color: GOLD }} />
                    </div>
                  </div>
                  <h1 className="text-2xl font-black mb-2 text-center" style={{ color: "#F5F5F0" }}>Set Your Password</h1>
                  <p className="text-sm text-center mb-8" style={{ color: "#808080" }}>
                    Enter your approved influencer email. We'll send you a 6-digit code to verify your identity and set a new password.
                  </p>
                  {resetError && (
                    <div className="mb-5 p-4 border text-sm" style={{ borderColor: "#7f1d1d", background: "#1f0a0a", color: "#fca5a5" }}>
                      {resetError}
                    </div>
                  )}
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a4a" }} />
                        <Input
                          type="email"
                          required
                          placeholder="your@email.com"
                          value={resetEmail}
                          onChange={e => setResetEmail(e.target.value)}
                          className="pl-10 bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-reset-email"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full h-12 text-base font-bold"
                      style={{ background: GOLD, color: "#0D0D0D" }}
                      data-testid="button-send-otp"
                    >
                      {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Send Verification Code <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Step: OTP verification */}
              {resetStep === "otp" && (
                <div>
                  <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}40` }}>
                      <ShieldCheck className="w-6 h-6" style={{ color: GOLD }} />
                    </div>
                  </div>
                  <h1 className="text-2xl font-black mb-2 text-center" style={{ color: "#F5F5F0" }}>Enter Your Code</h1>
                  <p className="text-sm text-center mb-2" style={{ color: "#808080" }}>
                    We've sent a 6-digit code to
                  </p>
                  <p className="text-sm text-center font-semibold mb-8" style={{ color: GOLD }}>{resetEmail}</p>
                  {resetError && (
                    <div className="mb-5 p-4 border text-sm" style={{ borderColor: "#7f1d1d", background: "#1f0a0a", color: "#fca5a5" }}>
                      {resetError}
                    </div>
                  )}
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>
                        6-Digit Code
                      </Label>
                      <Input
                        required
                        maxLength={6}
                        placeholder="000000"
                        value={resetOtp}
                        onChange={e => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0 text-center text-2xl tracking-widest"
                        style={{ borderColor: "#2a2a2a" }}
                        data-testid="input-reset-otp"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={resetLoading || resetOtp.length < 6}
                      className="w-full h-12 text-base font-bold"
                      style={{ background: GOLD, color: "#0D0D0D" }}
                      data-testid="button-verify-otp"
                    >
                      {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Verify Code <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                    <p className="text-center text-xs" style={{ color: "#505050" }}>
                      Didn't receive it?{" "}
                      <button type="button" onClick={() => setResetStep("email")} className="underline" style={{ color: GOLD }}>
                        Try again
                      </button>
                    </p>
                  </form>
                </div>
              )}

              {/* Step: set new password */}
              {resetStep === "newpass" && (
                <div>
                  <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}40` }}>
                      <Lock className="w-6 h-6" style={{ color: GOLD }} />
                    </div>
                  </div>
                  <h1 className="text-2xl font-black mb-2 text-center" style={{ color: "#F5F5F0" }}>Create Your Password</h1>
                  <p className="text-sm text-center mb-8" style={{ color: "#808080" }}>
                    Choose a strong password for your influencer account.
                  </p>
                  {resetError && (
                    <div className="mb-5 p-4 border text-sm" style={{ borderColor: "#7f1d1d", background: "#1f0a0a", color: "#fca5a5" }}>
                      {resetError}
                    </div>
                  )}
                  <form onSubmit={handleSetPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a4a" }} />
                        <Input
                          type={showResetPassword ? "text" : "password"}
                          required
                          minLength={8}
                          placeholder="Min. 8 characters"
                          value={resetPassword}
                          onChange={e => setResetPassword(e.target.value)}
                          className="pl-10 pr-10 bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4a4a4a" }} />
                        <Input
                          type={showResetPassword ? "text" : "password"}
                          required
                          placeholder="Repeat your password"
                          value={resetConfirm}
                          onChange={e => setResetConfirm(e.target.value)}
                          className="pl-10 bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full h-12 text-base font-bold"
                      style={{ background: GOLD, color: "#0D0D0D" }}
                      data-testid="button-set-password"
                    >
                      {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Save Password <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Step: done */}
              {resetStep === "done" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
                    <CheckCircle className="w-8 h-8" style={{ color: GOLD }} />
                  </div>
                  <h2 className="text-2xl font-black mb-3" style={{ color: "#F5F5F0" }}>Password Set!</h2>
                  <p className="mb-8" style={{ color: "#808080" }}>
                    Your password has been saved. You can now log in to your influencer dashboard.
                  </p>
                  <Button
                    onClick={() => {
                      setLoginForm(p => ({ ...p, email: resetEmail, password: "" }));
                      switchMode("login");
                    }}
                    className="w-full h-12 text-base font-bold"
                    style={{ background: GOLD, color: "#0D0D0D" }}
                    data-testid="button-go-login"
                  >
                    Log In to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* APPLY MODE */}
          {mode === "apply" && (
            <div>
              {applySuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
                    <CheckCircle className="w-8 h-8" style={{ color: GOLD }} />
                  </div>
                  <h2 className="text-2xl font-black mb-3" style={{ color: "#F5F5F0" }}>Application Submitted!</h2>
                  <p className="mb-2" style={{ color: "#808080" }}>
                    Thank you for applying. Our team will review your application and get back to you within 7 days.
                  </p>
                  <p className="text-sm mb-8" style={{ color: "#505050" }}>
                    If approved, you'll receive an email with a temporary password. Use the "Forgot / Set password" option on the login page to create your own password.
                  </p>
                  <Button
                    onClick={() => { setApplySuccess(false); setMode("login"); setApplyForm({ fullName: "", email: "", phone: "", instagram: "", tiktok: "", youtube: "", sport: "", followerCount: "", message: "" }); }}
                    variant="outline"
                    className="border-gray-700 text-white"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h1 className="text-3xl font-black mb-2" style={{ color: "#F5F5F0" }}>Join Team 1stRep</h1>
                    <p style={{ color: "#808080" }} className="text-sm">
                      Apply to become a 1stRep Influencer. Earn credits, unlock your personal discount code, and get rewarded.
                    </p>
                  </div>

                  <form onSubmit={handleApply} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Full Name *</Label>
                        <Input
                          required
                          placeholder="Your full name"
                          value={applyForm.fullName}
                          onChange={e => setApplyForm(p => ({ ...p, fullName: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Email *</Label>
                        <Input
                          required
                          type="email"
                          placeholder="your@email.com"
                          value={applyForm.email}
                          onChange={e => setApplyForm(p => ({ ...p, email: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-email"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Phone</Label>
                        <Input
                          placeholder="+44 7XXX XXXXXX"
                          value={applyForm.phone}
                          onChange={e => setApplyForm(p => ({ ...p, phone: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-phone"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Sport / Fitness Discipline *</Label>
                        <Input
                          required
                          placeholder="e.g. CrossFit, Running, Powerlifting"
                          value={applyForm.sport}
                          onChange={e => setApplyForm(p => ({ ...p, sport: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-sport"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Combined Social Followers</Label>
                        <Input
                          placeholder="e.g. 10,000"
                          value={applyForm.followerCount}
                          onChange={e => setApplyForm(p => ({ ...p, followerCount: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-followers"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Instagram</Label>
                        <Input
                          placeholder="@handle"
                          value={applyForm.instagram}
                          onChange={e => setApplyForm(p => ({ ...p, instagram: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-instagram"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>TikTok</Label>
                        <Input
                          placeholder="@handle"
                          value={applyForm.tiktok}
                          onChange={e => setApplyForm(p => ({ ...p, tiktok: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-tiktok"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>YouTube</Label>
                        <Input
                          placeholder="@channel"
                          value={applyForm.youtube}
                          onChange={e => setApplyForm(p => ({ ...p, youtube: e.target.value }))}
                          className="bg-transparent border text-white placeholder:text-gray-600 focus-visible:ring-0"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-youtube"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Why do you want to join? *</Label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Tell us about your fitness journey and what you'd bring to Team 1stRep…"
                          value={applyForm.message}
                          onChange={e => setApplyForm(p => ({ ...p, message: e.target.value }))}
                          className="w-full rounded-md px-3 py-2 text-sm bg-transparent border text-white placeholder:text-gray-600 focus:outline-none resize-none"
                          style={{ borderColor: "#2a2a2a" }}
                          data-testid="input-apply-message"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={applyLoading}
                      className="w-full h-12 text-base font-bold"
                      style={{ background: GOLD, color: "#0D0D0D" }}
                      data-testid="button-submit-apply"
                    >
                      {applyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Submit Application <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-sm" style={{ color: "#606060" }}>
                    Already have an account?{" "}
                    <button onClick={() => switchMode("login")} className="font-semibold hover:underline" style={{ color: GOLD }}>
                      Log in
                    </button>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div className="border-t px-6 py-4 flex items-center justify-between" style={{ borderColor: "#1a1a1a" }}>
        <p className="text-xs" style={{ color: "#404040" }}>© {new Date().getFullYear()} 1stRep. All rights reserved.</p>
        <div className="flex gap-4 text-xs" style={{ color: "#404040" }}>
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  );
}
