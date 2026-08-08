import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Trophy, BarChart3, Users, CreditCard, Monitor, Zap,
  CheckCircle, ArrowRight, Mail, Building2, ChevronDown, ChevronUp, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import HeaderClean from "@/components/HeaderClean";

const features = [
  {
    icon: <Users className="w-6 h-6 text-[#C9A84C]" />,
    title: "Athlete Registration",
    desc: "Online registration with category selection, waiver signing, and automated confirmation emails. Handle individuals, pairs, and teams of any size.",
  },
  {
    icon: <CreditCard className="w-6 h-6 text-[#C9A84C]" />,
    title: "Integrated Payments",
    desc: "Accept entry fees securely via Stripe. No cash handling. Automatic receipts sent to athletes. Revenue dashboard for organisers.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-[#C9A84C]" />,
    title: "Live Scoring & Leaderboards",
    desc: "Enter scores in real-time during the event. Rankings update instantly. Custom point systems, tiebreakers, and category filters.",
  },
  {
    icon: <Monitor className="w-6 h-6 text-[#C9A84C]" />,
    title: "TV Display Mode",
    desc: "Full-screen leaderboard display designed for projectors and big screens at your venue. Auto-scrolls, auto-refreshes, no interaction needed.",
  },
  {
    icon: <Zap className="w-6 h-6 text-[#C9A84C]" />,
    title: "Heat Scheduling",
    desc: "Auto-generate heats from registered athletes. Assign lanes, set start times, and publish the schedule for athletes to see online.",
  },
  {
    icon: <Trophy className="w-6 h-6 text-[#C9A84C]" />,
    title: "Multi-Format Support",
    desc: "Individual, teams of 2, 3, or 4. Single-day, multi-day, online, or hybrid events. AMRAP, For Time, Max Weight, Reps — all workout types supported.",
  },
];

const steps = [
  { num: "01", title: "Get in touch", desc: "Fill out the form below or email us. We'll discuss your event format, dates, and requirements." },
  { num: "02", title: "Build your competition", desc: "We configure your competition on the platform — categories, workouts, entry fees, and branding." },
  { num: "03", title: "Open registration", desc: "Athletes register online via your 1stRep competition page. Payments are handled automatically." },
  { num: "04", title: "Event day tools", desc: "Use our admin panel to check in athletes, enter scores, generate heats, and display the live leaderboard." },
];

const faqs = [
  { q: "How much does it cost to host a competition?", a: "Hosting fees depend on the size and duration of your event. We charge a small platform fee per registration, and take nothing from entry fees beyond that. Get in touch for a custom quote." },
  { q: "Can we use our own branding?", a: "Yes. Your competition page carries your event name, description, and banner image. The 1stRep platform powers it underneath, but your event is the focus." },
  { q: "What payment methods do athletes get?", a: "Athletes can pay via card (Visa, Mastercard, Amex), Apple Pay, and Google Pay through our Stripe integration. No PayPal or bank transfers needed." },
  { q: "Can we host online competitions or hybrid events?", a: "Absolutely. We support fully online events with video submission scoring, hybrid events (in-person + remote), and multi-day competitions across different venues." },
  { q: "Do athletes need a 1stRep account to register?", a: "Yes — athletes create a free 1stRep account to register. This lets them track their registrations, check their heat schedule, and view their competition results from any device." },
  { q: "Can I get help on the day?", a: "We offer remote on-day support for all hosted competitions. For larger events, we can arrange on-site presence. Let us know when you get in touch." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-md overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-white hover:bg-white/3 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-medium text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-white/55 text-sm leading-relaxed border-t border-white/8 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

const PLAN_LABELS: Record<string, string> = {
  single: "Single Event (£60 one-time)",
  pro: "Pro Monthly (£60/month)",
};

export default function CompetitionsHost() {
  const { toast } = useToast();
  const contactRef = useRef<HTMLElement>(null);

  const urlPlan = new URLSearchParams(window.location.search).get("plan") ?? "";
  const planLabel = PLAN_LABELS[urlPlan] ?? "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    organisation: "",
    eventName: "",
    message: planLabel ? `I'm interested in the ${planLabel} plan.` : "",
  });

  useEffect(() => {
    if (urlPlan && contactRef.current) {
      setTimeout(() => contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [urlPlan]);

  const enquiryMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/competitions/host-enquiry", data);
    },
    onSuccess: () => {
      toast({ title: "Enquiry sent!", description: "We'll be in touch within 1 business day." });
      setForm({ name: "", email: "", organisation: "", eventName: "", message: "" });
    },
    onError: () => {
      toast({ title: "Failed to send", description: "Please email us directly at competitions@1strep.com", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    enquiryMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <HeaderClean />

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)" }} />
        <div className="container mx-auto px-4 max-w-5xl relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#C9A84C] text-xs font-bold tracking-[0.2em] uppercase">1stRep Competitions</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight leading-none mb-5">
              Host Your<br />
              <span className="text-[#C9A84C]">Competition</span><br />
              With 1stRep
            </h1>
            <p className="text-white/55 text-lg leading-relaxed mb-8 max-w-xl">
              We power the full competition experience — from registration and payment processing to live scoring, heat scheduling, and real-time leaderboards on the day.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#contact">
                <Button className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold gap-2 h-11 px-6">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link href="/competitions">
                <Button variant="outline" className="border-white/20 text-white gap-2 h-11">
                  Browse Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/8 bg-white/2">
        <div className="container mx-auto px-4 max-w-5xl py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "10+", label: "Events hosted" },
              { value: "500+", label: "Athletes registered" },
              { value: "£0", label: "Setup fee" },
              { value: "24/7", label: "Platform uptime" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black text-[#C9A84C]">{s.value}</p>
                <p className="text-white/40 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Everything You Need</h2>
            <p className="text-white/45 max-w-lg mx-auto">All the tools to run a professional competition, without the complexity.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="p-5 bg-[#111111] border border-white/8 rounded-md">
                <div className="mb-3">{f.icon}</div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-white/8">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">How It Works</h2>
            <p className="text-white/45 max-w-lg mx-auto">From first conversation to leaderboard live — here's the process.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(s => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#C9A84C] font-black text-lg">{s.num}</span>
                </div>
                <h3 className="text-white font-bold mb-2">{s.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin only CTA */}
      <section className="py-12 bg-[#C9A84C]/8 border-y border-[#C9A84C]/20">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[#C9A84C]" />
            <div>
              <p className="text-white font-bold">Already a 1stRep partner or admin?</p>
              <p className="text-white/50 text-sm">Create and manage competitions directly from your admin dashboard.</p>
            </div>
          </div>
          <Link href="/admin/competitions">
            <Button className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold gap-2 shrink-0 h-11">
              Admin Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" ref={contactRef as any} className="py-20 border-t border-white/8 bg-[#080808]">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <Mail className="w-10 h-10 text-[#C9A84C] mx-auto mb-4" />
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Get in Touch</h2>
            <p className="text-white/45">Tell us about your event and we'll get back to you within 1 business day.</p>
          </div>

          {planLabel && (
            <div className="flex items-center gap-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-md px-4 py-3 mb-5">
              <Star className="w-4 h-4 text-[#C9A84C] shrink-0" />
              <p className="text-sm text-white/80">
                You selected the <span className="font-semibold text-[#C9A84C]">{planLabel}</span> plan. Fill in your details below and we'll get you set up.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 bg-[#111111] border border-white/8 rounded-md p-7">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Your Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Email Address *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@yourclub.com"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Organisation / Box / Club</Label>
                <Input
                  value={form.organisation}
                  onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
                  placeholder="CrossFit Manchester"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-sm">Event Name (if known)</Label>
                <Input
                  value={form.eventName}
                  onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
                  placeholder="Summer Throwdown 2026"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">Tell us about your event</Label>
              <Textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Expected number of athletes, format (individual/pairs/teams), event date, location, entry fee..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 min-h-[120px] resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Button
                type="submit"
                disabled={enquiryMutation.isPending || !form.name || !form.email}
                className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-black font-bold gap-2 h-11 px-6"
              >
                {enquiryMutation.isPending ? "Sending..." : <><Mail className="w-4 h-4" /> Send Enquiry</>}
              </Button>
              <p className="text-white/30 text-xs">Or email us directly at <a href="mailto:competitions@1strep.com" className="text-white/50 hover:text-white transition-colors underline">competitions@1strep.com</a></p>
            </div>

            {enquiryMutation.isSuccess && (
              <div className="flex items-center gap-2 text-green-400 text-sm pt-2">
                <CheckCircle className="w-4 h-4" /> Enquiry sent — we'll be in touch soon.
              </div>
            )}
          </form>

          <p className="text-white/25 text-xs text-center mt-6">
            Already have a 1stRep admin account?{" "}
            <Link href="/admin/competitions" className="text-white/40 hover:text-white transition-colors underline">
              Create competitions directly in the admin dashboard.
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
