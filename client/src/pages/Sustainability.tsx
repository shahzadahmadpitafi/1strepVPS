import HeaderClean from '@/components/HeaderClean';
import ScrollReveal from '@/components/ScrollReveal';
import { Leaf, Recycle, Droplets, Wind, TreePine, Globe, Heart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Sustainability() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const initiatives = [
    {
      icon: Recycle,
      title: "Recycled Materials",
      description: "Over 60% of our products now use recycled polyester and nylon, diverting plastic waste from landfills and oceans."
    },
    {
      icon: Droplets,
      title: "Water Conservation",
      description: "Our dyeing process uses 50% less water than traditional methods, saving millions of litres annually."
    },
    {
      icon: Wind,
      title: "Carbon Neutral Shipping",
      description: "We offset 100% of our shipping emissions through verified carbon offset projects worldwide."
    },
    {
      icon: TreePine,
      title: "Tree Planting Program",
      description: "For every order placed, we plant one tree. Over 50,000 trees planted and counting."
    }
  ];

  const goals = [
    { year: "2025", goal: "100% recycled packaging across all products" },
    { year: "2026", goal: "50% reduction in water usage across supply chain" },
    { year: "2027", goal: "Carbon neutral manufacturing operations" },
    { year: "2030", goal: "Fully circular product lifecycle" }
  ];

  const certifications = [
    "OEKO-TEX Standard 100",
    "Global Recycled Standard (GRS)",
    "bluesign Approved",
    "Fair Trade Certified"
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeaderClean />
      
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto py-20">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold tracking-wider uppercase">
              <Leaf className="w-4 h-4" />
              Our Commitment
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight" data-testid="sustainability-heading">
              Sustainability
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <p className="text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto text-gray-200">
              We believe premium performance gear and environmental responsibility go hand in hand.
            </p>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4">Our Initiatives</div>
              <h2 className="text-5xl font-bold mb-6 text-black">Making a Difference</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Every product we create considers its environmental impact from design to delivery.
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {initiatives.map((initiative, index) => {
              const Icon = initiative.icon;
              return (
                <ScrollReveal key={index} delay={index * 0.1} direction="up">
                  <div className="group bg-gray-50 p-8 hover:bg-green-900 hover:text-white transition-all duration-300">
                    <Icon className="w-12 h-12 mb-6 text-green-600 group-hover:text-white group-hover:scale-110 transition-all" />
                    <h3 className="text-xl font-bold mb-4">{initiative.title}</h3>
                    <p className="leading-relaxed opacity-80">{initiative.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-green-50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4">Roadmap</div>
              <h2 className="text-5xl font-bold text-black">Our Sustainability Goals</h2>
            </div>
          </ScrollReveal>
          
          <div className="space-y-6">
            {goals.map((item, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="flex items-center gap-8 bg-white p-6 shadow-sm">
                  <div className="text-4xl font-bold text-green-600 min-w-[100px]">{item.year}</div>
                  <div className="flex-1">
                    <p className="text-xl text-gray-800">{item.goal}</p>
                  </div>
                  <Globe className="w-8 h-8 text-green-400" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <div className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-4">Certifications</div>
            <h2 className="text-4xl font-bold mb-12 text-black">Verified & Certified</h2>
          </ScrollReveal>
          
          <div className="grid md:grid-cols-2 gap-6">
            {certifications.map((cert, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="flex items-center gap-4 p-6 bg-gray-50">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-lg font-medium text-gray-800">{cert}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-green-900 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <Heart className="w-16 h-16 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Join Our Mission</h2>
            <p className="text-xl leading-relaxed text-gray-200 mb-12">
              Every purchase you make supports our commitment to a more sustainable future. 
              Together, we can make a difference.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-green-900 hover:bg-gray-100 px-12 py-6 text-lg font-semibold"
              data-testid="button-shop-sustainable"
            >
              <a href="/shop-clean">Shop Sustainable Gear</a>
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}