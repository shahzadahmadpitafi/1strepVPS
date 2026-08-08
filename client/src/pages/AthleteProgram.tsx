import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import {
  Trophy, CheckCircle, ChevronRight, Loader2, UserCircle2,
  Wallet, Banknote, Tag, Zap, ArrowRight, LogIn
} from 'lucide-react';
import { SiInstagram, SiTiktok, SiYoutube } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const GOLD = '#C9A84C';

interface FeaturedAthlete {
  id: string;
  name: string;
  sport: string;
  bio: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  profile_image_url: string | null;
  tier: 'bronze' | 'silver' | 'gold' | 'elite';
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { label: string; style: string }> = {
    elite:  { label: 'Elite',   style: 'bg-purple-900/80 text-purple-200 border-purple-700' },
    gold:   { label: 'Gold',    style: 'bg-yellow-900/80 text-yellow-200 border-yellow-700' },
    silver: { label: 'Silver',  style: 'bg-zinc-700/80 text-zinc-200 border-zinc-600' },
    bronze: { label: 'Bronze',  style: 'bg-amber-900/80 text-amber-200 border-amber-700' },
  };
  const { label, style } = map[tier] ?? map.bronze;
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-sm ${style}`}>
      {label}
    </span>
  );
}

function SocialLink({ handle, platform }: { handle: string; platform: 'instagram' | 'tiktok' | 'youtube' }) {
  const clean = handle.replace(/^@/, '');
  const urls: Record<string, string> = {
    instagram: `https://instagram.com/${clean}`,
    tiktok: `https://tiktok.com/@${clean}`,
    youtube: `https://youtube.com/@${clean}`,
  };
  const icons = {
    instagram: <SiInstagram className="w-3.5 h-3.5" />,
    tiktok: <SiTiktok className="w-3.5 h-3.5" />,
    youtube: <SiYoutube className="w-4 h-4" />,
  };
  const colours: Record<string, string> = {
    instagram: 'text-pink-400 hover:text-pink-300',
    tiktok: 'text-zinc-300 hover:text-white',
    youtube: 'text-red-400 hover:text-red-300',
  };
  const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;
  return (
    <a
      href={urls[platform]}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${colours[platform]}`}
    >
      {icons[platform]}
      {displayHandle}
    </a>
  );
}

export default function AthleteProgram() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', instagram: '', tiktok: '',
    youtube: '', sport: '', followerCount: '', message: ''
  });

  const { data: featuredAthletes = [], isLoading: athletesLoading } = useQuery<FeaturedAthlete[]>({
    queryKey: ['/api/athletes/featured'],
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/athlete-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        toast({ title: "Application Submitted!", description: "We'll be in touch within 7 days." });
      } else {
        toast({
          title: response.status === 409 ? "Already Applied" : "Submission Error",
          description: data.error || "Please try again.",
          variant: "destructive"
        });
      }
    } catch {
      toast({ title: "Submission Error", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openApplicationForm = () => {
    setIsSuccess(false);
    setFormData({ fullName: '', email: '', phone: '', instagram: '', tiktok: '', youtube: '', sport: '', followerCount: '', message: '' });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D', color: '#F5F5F0' }}>
      <HeaderClean />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070')", filter: 'brightness(0.3)' }}
        />
        {/* Gold gradient wash at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to top, #0D0D0D, transparent)' }} />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-32">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 border text-xs font-bold tracking-widest uppercase"
              style={{ borderColor: GOLD, color: GOLD }}>
              <Trophy className="w-3.5 h-3.5" />
              Official Influencer Programme
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-6 leading-none tracking-tight" style={{ color: '#F5F5F0' }}
              data-testid="athlete-program-heading">
              Join<br />
              <span style={{ color: GOLD }}>Team</span><br />
              1stRep
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <p className="text-lg md:text-xl font-light max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#a0a0a0' }}>
              Become an official 1stRep influencer. Earn store credits for every post, unlock your personal discount code,
              and get rewarded from day one.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={openApplicationForm}
                className="text-base font-bold px-10 py-6"
                style={{ background: GOLD, color: '#0D0D0D' }}
                data-testid="button-apply-now"
              >
                Apply Now
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Link href="/influencer-login">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base font-bold px-10 py-6 border-white/30 text-white/80 hover:text-white hover:border-white/60"
                  data-testid="button-influencer-login-hero"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Log In to Dashboard
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 w-full border-t border-b py-6"
          style={{ borderColor: '#2a2a2a', background: 'rgba(13,13,13,0.85)' }}>
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
            {[
              { value: '£100', label: 'Welcome Credit' },
              { value: 'Credits', label: 'Per Approved Post' },
              { value: '50%', label: 'Product Discount' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-black" style={{ color: GOLD }}>{stat.value}</div>
                <div className="text-xs uppercase tracking-widest mt-1" style={{ color: '#808080' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU EARN ── */}
      <section className="py-28 px-4" style={{ background: '#111111' }}>
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>Benefits</p>
              <h2 className="text-5xl md:text-6xl font-black mb-4" style={{ color: '#F5F5F0' }}>What You Earn</h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: '#808080' }}>
                Real financial rewards — not just exposure.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: '#2a2a2a' }}>
            {[
              {
                icon: Wallet,
                title: '£100 Welcome Credit',
                desc: 'Credited to your account immediately on approval. Spend it on any 1stRep product.'
              },
              {
                icon: Banknote,
                title: 'Credits Per Post',
                desc: 'Every piece of content our team approves earns you store credits — instantly added to your balance.'
              },
              {
                icon: Tag,
                title: 'Up to 50% Discount',
                desc: 'Your personal influencer code gives you up to 50% off — and earns credits every time a customer uses it.'
              },
              {
                icon: Zap,
                title: 'Early Access',
                desc: 'Receive and review new 1stRep products before they launch publicly.'
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="p-8 flex flex-col gap-4 h-full" style={{ background: '#0D0D0D' }}>
                    <div className="w-12 h-12 flex items-center justify-center border" style={{ borderColor: GOLD }}>
                      <Icon className="w-5 h-5" style={{ color: GOLD }} />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: '#F5F5F0' }}>{benefit.title}</h3>
                    <p className="text-sm leading-relaxed flex-1" style={{ color: '#808080' }}>{benefit.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED INFLUENCERS ── */}
      <section className="py-28 px-4" style={{ background: '#0D0D0D' }}>
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>The Team</p>
              <h2 className="text-5xl md:text-6xl font-black mb-4" style={{ color: '#F5F5F0' }}>Featured Influencers</h2>
              <p className="text-lg" style={{ color: '#808080' }}>The athletes and creators who represent 1stRep.</p>
            </div>
          </ScrollReveal>

          {athletesLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
            </div>
          ) : featuredAthletes.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-20 border border-dashed" style={{ borderColor: '#2a2a2a' }}>
                <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: GOLD, opacity: 0.5 }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: '#F5F5F0' }}>Influencers Coming Soon</h3>
                <p className="mb-8" style={{ color: '#808080' }}>
                  We're building the team. Apply to be among the first featured influencers.
                </p>
                <Button onClick={openApplicationForm} style={{ background: GOLD, color: '#0D0D0D' }} className="font-bold">
                  Apply Now
                </Button>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: '#2a2a2a' }}>
              {featuredAthletes.map((athlete, index) => (
                <ScrollReveal key={athlete.id} delay={index * 0.1}>
                  <div className="group overflow-hidden" style={{ background: '#0D0D0D' }}>
                    {/* Image */}
                    <div className="relative h-80 overflow-hidden" style={{ background: '#1a1a1a' }}>
                      {athlete.profile_image_url ? (
                        <img
                          src={athlete.profile_image_url}
                          alt={athlete.name}
                          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${athlete.profile_image_url ? 'hidden' : ''}`}>
                        <UserCircle2 className="w-20 h-20" style={{ color: '#3a3a3a' }} />
                      </div>
                      {/* Gradient overlay */}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0D0D0D 0%, transparent 60%)' }} />
                      {/* Tier badge */}
                      <div className="absolute top-3 right-3">
                        <TierBadge tier={athlete.tier} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: '#F5F5F0' }}>{athlete.name}</h3>
                        <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: GOLD }}>
                          {athlete.sport}
                        </p>
                      </div>
                      {athlete.bio && (
                        <p className="text-sm leading-relaxed line-clamp-3 italic" style={{ color: '#808080' }}>
                          "{athlete.bio}"
                        </p>
                      )}
                      {(athlete.instagram || athlete.tiktok || athlete.youtube) && (
                        <div className="flex flex-wrap gap-3 pt-2 border-t" style={{ borderColor: '#2a2a2a' }}>
                          {athlete.instagram && <SocialLink handle={athlete.instagram} platform="instagram" />}
                          {athlete.tiktok && <SocialLink handle={athlete.tiktok} platform="tiktok" />}
                          {athlete.youtube && <SocialLink handle={athlete.youtube} platform="youtube" />}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHO WE'RE LOOKING FOR ── */}
      <section className="py-28 px-4" style={{ background: '#111111' }}>
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>Requirements</p>
              <h2 className="text-5xl md:text-6xl font-black" style={{ color: '#F5F5F0' }}>Who We're Looking For</h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {[
              "Active social media presence on Instagram, TikTok, or YouTube",
              "Genuine passion for fitness, sport, or an active lifestyle",
              "Consistent content creation within the health and fitness niche",
              "Alignment with the 1stRep brand values and aesthetic",
              "Commitment to posting at least one piece of branded content per month",
            ].map((req, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="flex items-center gap-4 p-5 border-l-2" style={{ background: '#0D0D0D', borderLeftColor: GOLD }}>
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: GOLD }} />
                  <span className="text-base" style={{ color: '#e0e0e0' }}>{req}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO JOIN ── */}
      <section className="py-28 px-4" style={{ background: '#0D0D0D' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>Process</p>
              <h2 className="text-5xl md:text-6xl font-black" style={{ color: '#F5F5F0' }}>How to Join</h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px" style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />

            {[
              { step: '01', title: 'Apply Online', desc: 'Fill out our application with your social handles and a short message about yourself.' },
              { step: '02', title: 'We Review', desc: 'Our team reviews every application within 7 days and contacts you with a decision.' },
              { step: '03', title: 'Get Rewarded', desc: 'Approved influencers receive £100 store credit and a personal discount code immediately.' },
              { step: '04', title: 'Create & Earn', desc: 'Post content, submit it through your portal, and earn store credits for every approved post.' },
            ].map((s, i) => (
              <ScrollReveal key={i} delay={i * 0.12}>
                <div className="text-center relative">
                  <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center text-sm font-black border-2"
                    style={{ borderColor: GOLD, color: GOLD }}>
                    {s.step}
                  </div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: '#F5F5F0' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#808080' }}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-4 text-center relative overflow-hidden" style={{ background: '#111111' }}>
        {/* Gold glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${GOLD}15 0%, transparent 70%)` }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <ScrollReveal>
            <Trophy className="w-14 h-14 mx-auto mb-8" style={{ color: GOLD }} />
            <h2 className="text-5xl md:text-6xl font-black mb-6" style={{ color: '#F5F5F0' }}>Ready to Join?</h2>
            <p className="text-lg mb-12 leading-relaxed" style={{ color: '#808080' }}>
              Apply today and unlock your £100 welcome credit, a personal discount code,
              and store credits for every piece of content you create.
            </p>
            <Button
              size="lg"
              onClick={openApplicationForm}
              className="text-lg font-bold px-14 py-7"
              style={{ background: GOLD, color: '#0D0D0D' }}
              data-testid="button-submit-application"
            >
              Submit Application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* ── APPLICATION DIALOG ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Influencer Application</DialogTitle>
            <DialogDescription>
              Complete the form below to apply for the 1stRep Influencer Programme.
            </DialogDescription>
          </DialogHeader>

          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: GOLD }} />
              <h3 className="text-xl font-bold mb-2">Application Submitted!</h3>
              <p className="text-muted-foreground mb-6">
                Thank you for applying. We'll review your application and get back to you within 7 days.
              </p>
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Your full name" required data-testid="input-athlete-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="your@email.com" required data-testid="input-athlete-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+44 7XXX XXXXXX" data-testid="input-athlete-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sport">Sport / Fitness Discipline *</Label>
                <Input id="sport" name="sport" value={formData.sport} onChange={handleInputChange} placeholder="e.g., CrossFit, Running, Personal Training" required data-testid="input-athlete-sport" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followerCount">Combined Social Media Followers</Label>
                <Input id="followerCount" name="followerCount" value={formData.followerCount} onChange={handleInputChange} placeholder="e.g., 10,000" data-testid="input-athlete-followers" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" name="instagram" value={formData.instagram} onChange={handleInputChange} placeholder="@handle" data-testid="input-athlete-instagram" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input id="tiktok" name="tiktok" value={formData.tiktok} onChange={handleInputChange} placeholder="@handle" data-testid="input-athlete-tiktok" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input id="youtube" name="youtube" value={formData.youtube} onChange={handleInputChange} placeholder="@channel" data-testid="input-athlete-youtube" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Why do you want to join Team 1stRep? *</Label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange}
                  placeholder="Tell us about yourself, your fitness journey, and why you'd be a great fit..."
                  className="min-h-[100px]" required data-testid="input-athlete-message" />
              </div>
              <Button type="submit" className="w-full font-bold" disabled={isSubmitting} data-testid="button-submit-athlete-form"
                style={{ background: GOLD, color: '#0D0D0D' }}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit Application'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
