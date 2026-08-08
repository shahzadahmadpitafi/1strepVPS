import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import ParallaxSection from '@/components/ParallaxSection';
import StoreLocator from '@/components/StoreLocator';
import { Target, Zap, Users, Shield, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: Target,
      title: "Performance First",
      description: "Engineered for athletes who demand excellence. Every product tested to ensure peak performance."
    },
    {
      icon: Zap,
      title: "Premium Quality",
      description: "Superior fabrics and precise construction. We never compromise on what goes into your gear."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Built by athletes, for athletes. We evolve continuously based on your feedback."
    },
    {
      icon: Shield,
      title: "Built to Last",
      description: "Durability meets sustainability. Designed to withstand intense training while protecting our planet."
    }
  ];

  const milestones = [
    { year: "2019", title: "Founded", description: "Started in a small gym in Manchester" },
    { year: "2020", title: "UK Expansion", description: "Opened distribution centres nationwide" },
    { year: "2022", title: "Global Reach", description: "Shipped to 15+ countries worldwide" },
    { year: "2024", title: "50K Athletes", description: "Community of dedicated fitness enthusiasts" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      {/* Hero Section with Dynamic Gradient */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <ParallaxSection speed={-30}>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070')",
            }}
          />
        </ParallaxSection>
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              Est. 2019
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight" data-testid="about-heading">
              Gear That <br />
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Performs
              </span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto mb-12 text-gray-200">
              Premium activewear for athletes who refuse to settle. 
              Your gear should work as hard as you do.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-base font-semibold scale-hover"
                data-testid="button-shop-collection"
              >
                <a href="/shop-clean">
                  Shop Collection
                  <ChevronRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-base font-semibold scale-hover"
                data-testid="button-our-story"
              >
                <a href="#story">Our Story</a>
              </Button>
            </div>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "50K+", label: "Active Athletes" },
              { number: "100+", label: "Products" },
              { number: "15", label: "Countries" },
              { number: "4.9★", label: "Rating" }
            ].map((stat, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-bold mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="right" className="order-2 lg:order-1">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Our Story</div>
              <h2 className="text-5xl font-bold mb-8 text-black leading-tight">
                Born From <br />Frustration
              </h2>
              <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                <p>
                  1stRep was founded in 2019 by a group of athletes tired of choosing between style and performance. 
                  We believed there had to be a better way.
                </p>
                <p>
                  Starting in a small Manchester gym, we obsessed over every detail. Moisture-wicking that actually works. 
                  Fabrics that move with you. Construction that survives thousands of workouts.
                </p>
                <p>
                  Today, we're proud to serve a global community of athletes who demand more. Every product we create 
                  is tested in real training environments by real athletes.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="left" delay={0.2} className="order-1 lg:order-2">
              <ParallaxSection speed={-20}>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-gray-200 to-gray-100 blur-2xl opacity-50" />
                  <img 
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070" 
                    alt="Athletes training" 
                    className="relative w-full h-[600px] object-cover shadow-2xl scale-hover"
                  />
                </div>
              </ParallaxSection>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Journey</div>
              <h2 className="text-5xl font-bold text-black">Our Milestones</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <ScrollReveal key={index} delay={index * 0.1} direction="up">
                <div className="relative">
                  <div className="bg-white p-8 h-full shadow-sm hover:shadow-lg transition-shadow product-card-hover">
                    <div className="text-6xl font-bold text-gray-200 mb-4">{milestone.year}</div>
                    <h3 className="text-2xl font-bold mb-3 text-black">{milestone.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Values</div>
              <h2 className="text-5xl font-bold mb-6 text-black">What Drives Us</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we create
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <ScrollReveal key={index} delay={index * 0.1} direction="up">
                  <div className="group bg-gray-50 p-8 hover:bg-black hover:text-white transition-all duration-300 scale-hover">
                    <Icon className="w-12 h-12 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                    <p className="leading-relaxed opacity-80">{value.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <Award className="w-20 h-20 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Our Mission</h2>
            <p className="text-2xl md:text-3xl leading-relaxed font-light text-gray-200">
              To empower athletes worldwide with premium gear that enhances every workout, 
              every rep, and every moment of progress.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Store Locator */}
      <StoreLocator />

      {/* Final CTA */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-black">
              Join the Movement
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Experience the difference that premium activewear makes. 
              Trusted by athletes, designed for performance.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 px-12 py-6 text-lg font-semibold scale-hover"
              data-testid="button-shop-now"
            >
              <a href="/shop-clean">
                Shop Now
                <ChevronRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
