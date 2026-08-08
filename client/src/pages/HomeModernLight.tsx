import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import CategorySection from "@/components/CategorySection";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Star } from "lucide-react";
import { Link } from "wouter";

// Background images will be loaded from database/uploads
const backgroundImages: string[] = [];
const heroImage2 = '';
const heroImage3 = '';

export default function HomeModernLight() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Editorial Magazine-Style Hero */}
        <section className="relative h-screen overflow-hidden">
          {/* Rotating Backgrounds */}
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-2000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={image} 
                alt={`Urban fitness ${index + 1}`} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Light Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/70 to-transparent z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/60 z-[1]" />

          {/* Magazine-Style Grid Layout */}
          <div className="relative z-10 h-full max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-12 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="md:col-span-7 space-y-8">
              {/* Accent Tag */}
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                  New Arrivals
                </span>
              </div>

              {/* Large Editorial Headline */}
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tighter">
                <span className="block text-foreground">MOVE WITH</span>
                <span className="block text-foreground">CONFIDENCE</span>
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  & PURPOSE
                </span>
              </h1>

              {/* Stylized Subheading */}
              <div className="flex items-start gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent mt-3" />
                <p className="text-xl md:text-2xl max-w-md leading-relaxed text-muted-foreground">
                  Expertly crafted athletic wear that supports your every move. 
                  Designed for all bodies, including modest and hijab-friendly styles that never compromise on performance or comfort.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex gap-5 flex-wrap items-center pt-4">
                <Button 
                  size="lg" 
                  className="text-lg px-10 rounded-full shadow-lg hover:shadow-xl transition-shadow" 
                  asChild 
                  data-testid="button-shop-collection"
                >
                  <Link href="/products">
                    Explore Collection <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 rounded-full border-2" 
                  asChild 
                  data-testid="button-new-arrivals"
                >
                  <Link href="/products">
                    New Arrivals
                  </Link>
                </Button>
              </div>

              {/* Trending Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent/10 border border-accent/20 rounded-full">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-accent">
                  Popular: High-Performance Fabrics
                </span>
              </div>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="md:col-span-5 space-y-6">
              {/* Feature Card 1 */}
              <div className="bg-card/80 backdrop-blur-lg border border-border p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-primary">01</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Quality Materials</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Made with high-performance fabrics designed for breathability, flexibility, and long-lasting durability.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-card/80 backdrop-blur-lg border border-border p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-accent" />
                  </div>
                  <span className="text-sm font-semibold text-accent">02</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Inclusive Designs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Athletic wear for everyone, including modest and hijab-friendly options that provide full coverage without compromising on style or performance.
                </p>
              </div>
            </div>
          </div>

          {/* Image Indicators */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {backgroundImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? 'w-12 bg-primary' : 'w-2 bg-foreground/20 hover:bg-foreground/40'
                }`}
                data-testid={`modern-indicator-${index}`}
              />
            ))}
          </div>
        </section>

        {/* Visual Break - Overlapping Image Section */}
        <section className="relative -mt-20 pb-32">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl rotate-3" />
                <div className="absolute inset-0 translate-x-4 translate-y-4">
                  <img 
                    src={heroImage3} 
                    alt="Performance" 
                    className="h-full w-full object-cover rounded-3xl shadow-2xl"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="inline-block px-4 py-1 bg-primary/10 rounded-full">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Featured</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black leading-tight">
                  Performance
                  <span className="block text-primary">That Lasts</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Explore our latest collection featuring advanced athletic fabrics and timeless designs. 
                  High-quality pieces built for comfort and durability.
                </p>
                <Button size="lg" variant="outline" className="rounded-full" asChild data-testid="button-discover">
                  <Link href="/products">
                    Discover More <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <div className="py-16">
          <ProductGrid 
            title="Latest Drops" 
            subtitle="Fresh styles for your active lifestyle"
          />
        </div>

        {/* Personalised */}
        <PersonalizedRecommendations />

        {/* Categories */}
        <CategorySection />

        {/* Final CTA - Full Width Image */}
        <section className="relative h-[70vh] overflow-hidden">
          <img 
            src={heroImage2} 
            alt="Join us" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
          
          <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-8">
            <div className="max-w-2xl">
              <h2 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
                Quality Athletic Wear
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  For Your Goals
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Browse our complete range of high-quality athletic clothing designed to support your active lifestyle
              </p>
              <Button size="lg" className="text-lg px-10 rounded-full shadow-xl" asChild data-testid="button-shop-all">
                <Link href="/products">
                  Shop All Products <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
