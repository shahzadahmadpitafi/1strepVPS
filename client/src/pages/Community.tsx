import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import { Users, Heart, MessageCircle, Camera, MapPin, Calendar, Instagram, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Community() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const communityFeatures = [
    { icon: Users, title: "50K+ Members", description: "Join a thriving community of fitness enthusiasts" },
    { icon: MessageCircle, title: "Connect & Share", description: "Exchange tips, motivation, and success stories" },
    { icon: Calendar, title: "Exclusive Events", description: "Access to community workouts and meetups" },
    { icon: Camera, title: "Get Featured", description: "Share your journey and inspire others" }
  ];

  const testimonials = [
    {
      name: "Michael B.",
      location: "London",
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200",
      quote: "The 1stRep community has been incredible for my fitness journey. The support and motivation I get here is unmatched.",
      rating: 5
    },
    {
      name: "Lisa K.",
      location: "Manchester",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
      quote: "Found my workout buddies through community events. We now train together three times a week!",
      rating: 5
    },
    {
      name: "David R.",
      location: "Birmingham",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
      quote: "The early access to new products is amazing. Being part of this community feels like being part of a family.",
      rating: 5
    }
  ];

  const communityStats = [
    { number: "50K+", label: "Active Members" },
    { number: "100+", label: "Events Hosted" },
    { number: "15", label: "Countries" },
    { number: "1M+", label: "Social Engagements" }
  ];

  const communityWays = [
    {
      title: "Join Our Discord",
      description: "Connect with fellow athletes in real-time, share workouts, and get advice.",
      action: "Join Server"
    },
    {
      title: "Follow on Instagram",
      description: "Get inspired by our community's achievements and share your own journey.",
      action: "Follow @1stRep"
    },
    {
      title: "Attend Events",
      description: "Join us for community workouts, product launches, and athlete meetups.",
      action: "View Events"
    },
    {
      title: "Become an Ambassador",
      description: "Take your involvement to the next level as a 1stRep ambassador.",
      action: "Apply Now"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2070')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              <Heart className="w-4 h-4" />
              Community
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" data-testid="community-heading">
              Stronger Together
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-gray-200">
              Join a global community of athletes who share your passion for fitness and performance.
            </p>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {communityStats.map((stat, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Benefits</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Why Join Our Community</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {communityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={index} delay={index * 0.1} direction="up">
                  <div className="bg-gray-50 p-8 text-center">
                    <Icon className="w-12 h-12 mx-auto mb-6 text-black" />
                    <h3 className="text-xl font-bold mb-3 text-black">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Testimonials</div>
              <h2 className="text-5xl font-bold mb-6 text-black">What Our Community Says</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 0.15}>
                <div className="bg-white p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-black">{testimonial.name}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MapPin className="w-3 h-3" />
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Get Involved</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Ways to Connect</h2>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 gap-8">
            {communityWays.map((way, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="bg-gray-50 p-8 flex flex-col h-full">
                  <h3 className="text-xl font-bold mb-3 text-black">{way.title}</h3>
                  <p className="text-gray-600 mb-6 flex-1">{way.description}</p>
                  <Button variant="outline" className="w-full">
                    {way.action}
                  </Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <Instagram className="w-16 h-16 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Share Your Journey</h2>
            <p className="text-xl leading-relaxed text-gray-200 mb-8">
              Tag us @1stRep_ and use #1stRepCrew for a chance to be featured on our channels.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-12 py-6 text-lg font-semibold"
              data-testid="button-follow-instagram"
            >
              <a href="https://www.instagram.com/1strep_/" target="_blank" rel="noopener noreferrer">
                Follow @1stRep_
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}