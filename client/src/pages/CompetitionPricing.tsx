import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Check, X, Star, ArrowRight, Zap, Shield, Globe, Mail,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import HeaderClean from "@/components/HeaderClean";

const FALLBACK_TIERS = [
  {
    tier: "starter",
    name: "Starter",
    price: 0,
    billing_period: "free",
    sort_order: 1,
    features: [
      "1 competition",
      "Up to 30 participants",
      "Basic leaderboard",
      "Manual scoring",
      "1stRep branding on leaderboard",
      "Free events only (no payment processing)",
    ],
    notIncluded: [
      "Stripe payment processing",
      "Online qualifiers",
      "Custom branding",
      "Unlimited participants",
    ],
  },
  {
    tier: "single",
    name: "Single Event",
    price: 6000,
    billing_period: "one_time",
    sort_order: 2,
    features: [
      "1 competition",
      "Unlimited participants",
      "Full live leaderboard",
      "Live scoring & heat management",
      "Stripe payment processing for entries",
      "CSV exports",
      "Custom categories",
    ],
    notIncluded: [
      "Online qualifiers",
      "Custom branding",
      "Multiple competitions",
    ],
  },
  {
    tier: "pro",
    name: "Pro Monthly",
    price: 6000,
    billing_period: "monthly",
    sort_order: 3,
    popular: true,
    features: [
      "Unlimited competitions",
      "All Single Event features",
      "Online qualifiers & remote scoring",
      "Scheduled workout release",
      "Spectator ticketing",
      "Custom leaderboard branding",
      "Volunteer management",
      "Priority support",
    ],
    notIncluded: [
      "Remove 1stRep branding",
      "Custom domain",
    ],
  },
  {
    tier: "white_label",
    name: "White Label",
    price: 0,
    billing_period: "contact",
    sort_order: 4,
    features: [
      "Everything in Pro",
      "Remove 1stRep branding entirely",
      "Custom domain support",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom integrations on request",
    ],
    notIncluded: [],
  },
];

function formatPrice(price: number, period: string) {
  if (period === "free") return { main: "Free", sub: "Forever" };
  if (period === "contact") return { main: "Contact us", sub: "Custom pricing" };
  const formatted = `£${price / 100}`;
  if (period === "monthly") return { main: formatted, sub: "per month" };
  return { main: formatted, sub: "one-time" };
}

function TierIcon({ tier }: { tier: string }) {
  if (tier === "starter") return <Zap className="w-6 h-6 text-white/50" />;
  if (tier === "single") return <Star className="w-6 h-6 text-[#C9A84C]" />;
  if (tier === "pro") return <Shield className="w-6 h-6 text-[#C9A84C]" />;
  return <Globe className="w-6 h-6 text-[#C9A84C]" />;
}

export default function CompetitionPricing() {
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const { data: pricingConfig } = useQuery<any[]>({
    queryKey: ["/api/competitions/pricing-config"],
    queryFn: async () => {
      const res = await fetch("/api/competitions/pricing-config");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const tiers = (pricingConfig && pricingConfig.length > 0) ? pricingConfig : FALLBACK_TIERS;

  const handleGetStarted = async (tier: any) => {
    if (tier.tier === "white_label" || tier.billing_period === "contact") {
      window.location.href = "mailto:competitions@1strep.com?subject=White Label Enquiry";
      return;
    }

    setLoadingTier(tier.tier);
    try {
      const res = await fetch("/api/competitions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.tier }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || err.error === "Not authenticated") {
          window.location.href = `/customer-login?redirect=${encodeURIComponent("/competitions/pricing")}`;
          return;
        }
        toast({ title: "Something went wrong", description: err.error || "Please try again.", variant: "destructive" });
        return;
      }
      const data = await res.json();
      if (data.redirectUrl) {
        toast({ title: "You're on the Starter plan!", description: "Set up your first competition now." });
        setTimeout(() => { window.location.href = data.redirectUrl; }, 1200);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: "Subscribed!", description: "Your subscription is now active." });
      }
    } catch {
      toast({ title: "Failed to continue", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <HeaderClean />

      {/* Hero */}
      <section className="pt-32 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)" }} />
        <div className="container mx-auto px-4 max-w-4xl relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase">1stRep Competitions</span>
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Start free. Pay only when you need more. Power your next competition with 1stRep.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((tier: any) => {
              const priceDisplay = formatPrice(tier.price, tier.billing_period);
              const isPopular = tier.popular || tier.tier === "pro";
              const isContact = tier.billing_period === "contact";
              const features = Array.isArray(tier.features)
                ? tier.features
                : typeof tier.features === "string"
                  ? JSON.parse(tier.features)
                  : [];

              return (
                <div
                  key={tier.tier}
                  className={`relative flex flex-col rounded-md border overflow-hidden transition-all ${
                    isPopular
                      ? "border-[#C9A84C]/60 bg-[#111111]"
                      : "border-white/10 bg-[#0f0f0f]"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-5">
                      <div>
                        <TierIcon tier={tier.tier} />
                        <h3 className="text-white font-bold text-lg mt-2">{tier.name}</h3>
                      </div>
                      {isPopular && (
                        <Badge className="bg-[#C9A84C] text-black font-bold text-[10px] px-2 py-0.5 no-default-active-elevate">
                          Most Popular
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className={`text-3xl font-black ${isContact ? "text-white/80" : "text-white"}`}>
                        {priceDisplay.main}
                      </div>
                      <div className="text-white/40 text-sm mt-0.5">{priceDisplay.sub}</div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                          <Check className="w-3.5 h-3.5 text-[#C9A84C] shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                      {(tier.notIncluded ?? []).map((f: string, i: number) => (
                        <li key={`x-${i}`} className="flex items-start gap-2.5 text-sm text-white/25 line-through">
                          <X className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={() => handleGetStarted(tier)}
                      disabled={loadingTier === tier.tier}
                      className={
                        isPopular
                          ? "w-full bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold gap-2"
                          : "w-full bg-white/8 hover:bg-white/12 text-white font-medium gap-2"
                      }
                    >
                      {loadingTier === tier.tier ? "Loading..." : (
                        <>
                          {isContact ? (
                            <><Mail className="w-4 h-4" /> Contact Sales</>
                          ) : tier.billing_period === "free" ? (
                            <>Get Started Free <ChevronRight className="w-4 h-4" /></>
                          ) : (
                            <>Get Started <ArrowRight className="w-4 h-4" /></>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fine print */}
          <p className="text-center text-white/25 text-sm mt-8">
            All prices shown in GBP. VAT may apply. Platform fee of 5% applies to entry fee revenue processed through 1stRep.{" "}
            <Link href="/competitions/host" className="underline hover:text-white/40 transition-colors">Questions? See our FAQ.</Link>
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-t border-white/8 py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-10">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/50 font-medium w-48">Feature</th>
                  {tiers.map((t: any) => (
                    <th key={t.tier} className={`text-center py-3 px-4 font-bold ${t.tier === "pro" ? "text-[#C9A84C]" : "text-white/70"}`}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Competitions", starter: "1", single: "1", pro: "Unlimited", white_label: "Unlimited" },
                  { label: "Participants per comp", starter: "30", single: "Unlimited", pro: "Unlimited", white_label: "Unlimited" },
                  { label: "Live leaderboard", starter: "Basic", single: "Full", pro: "Full", white_label: "Full" },
                  { label: "Entry fee processing", starter: false, single: true, pro: true, white_label: true },
                  { label: "Heat management", starter: false, single: true, pro: true, white_label: true },
                  { label: "Online qualifiers", starter: false, single: false, pro: true, white_label: true },
                  { label: "Custom leaderboard branding", starter: false, single: false, pro: true, white_label: true },
                  { label: "Remove 1stRep branding", starter: false, single: false, pro: false, white_label: true },
                  { label: "Custom domain", starter: false, single: false, pro: false, white_label: true },
                  { label: "Dedicated account manager", starter: false, single: false, pro: false, white_label: true },
                  { label: "CSV exports", starter: false, single: true, pro: true, white_label: true },
                  { label: "Priority support", starter: false, single: false, pro: true, white_label: true },
                ].map(row => (
                  <tr key={row.label} className="border-b border-white/5">
                    <td className="py-3 px-4 text-white/60">{row.label}</td>
                    {(["starter", "single", "pro", "white_label"] as const).map(tier => {
                      const val = (row as any)[tier];
                      return (
                        <td key={tier} className="py-3 px-4 text-center">
                          {val === true ? (
                            <Check className="w-4 h-4 text-[#C9A84C] mx-auto" />
                          ) : val === false ? (
                            <X className="w-4 h-4 text-white/20 mx-auto" />
                          ) : (
                            <span className="text-white/70 text-xs">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/8 py-16 text-center">
        <div className="container mx-auto px-4 max-w-xl">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Not sure which plan?</h3>
          <p className="text-white/45 mb-6">Talk to us and we'll recommend the right tier for your event.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/competitions/host#contact">
              <Button className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold gap-2 h-11 px-6">
                <Mail className="w-4 h-4" /> Get in Touch
              </Button>
            </Link>
            <Link href="/competitions">
              <Button variant="outline" className="border-white/20 text-white gap-2 h-11">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
