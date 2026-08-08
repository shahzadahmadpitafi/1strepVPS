import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import CategorySection from "@/components/CategorySection";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Zap, Target } from "lucide-react";
import { Link } from "wouter";

// Background images will be loaded from database/uploads
const backgroundImages: string[] = [];
const heroImage2 = '';

export default function HomeDynamicGradient() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovering) {
        setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovering]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Explosive Full-Screen Campaign Hero */}
        <section 
          className="relative h-screen flex items-center justify-center overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Rotating Explosive Backgrounds */}
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={image} 
                alt={`Dynamic ${index + 1}`} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Multi-Layer Gradient Overlay - Lighter for visible backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/25 via-primary/20 to-pink-900/25 z-[1] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-[1]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgb(0_0_0_/_0.4)_70%)] z-[1]" />

          {/* Animated Energy Particles */}
          <div className="absolute inset-0 z-[2]">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/30 to-primary/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Center-Aligned Explosive Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-8 text-center">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-3 mb-8 px-8 py-4 bg-gradient-to-r from-primary/20 to-purple-500/20 border-2 border-primary/40 rounded-full backdrop-blur-md animate-pulse">
              <Flame className="h-6 w-6 text-primary" />
              <span className="text-sm font-black bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent uppercase tracking-[0.3em]">
                Premium Collection
              </span>
            </div>

            {/* Hero Typography */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-10 leading-[0.9] tracking-tight">
              <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                PERFORMANCE
              </span>
              <span className="block text-white mt-4">
                MEETS COMFORT
              </span>
            </h1>

            {/* Dynamic Subheading */}
            <p className="text-2xl md:text-4xl font-bold mb-16 max-w-4xl mx-auto leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                Where innovation meets everyday comfort. 
                <span className="block mt-3 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Athletic wear designed to move with you, whatever your fitness journey
                </span>
              </span>
            </p>

            {/* Bold CTAs */}
            <div className="flex gap-6 justify-center flex-wrap mb-20">
              <Button 
                size="lg" 
                className="text-xl px-16 py-8 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all shadow-2xl hover:shadow-primary/50 hover:scale-105" 
                asChild 
                data-testid="button-ignite-performance"
              >
                <Link href="/products">
                  Shop Collection <Flame className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-xl px-16 py-8 rounded-full border-2 border-white/30 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/60 transition-all" 
                asChild 
                data-testid="button-explore-collection"
              >
                <Link href="/products">
                  Explore Collection
                </Link>
              </Button>
            </div>

            {/* Power Metrics */}
            <div className="grid grid-cols-3 gap-12 max-w-4xl mx-auto">
              <div className="group">
                <div className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  100%
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  Quality Guarantee
                </div>
              </div>
              
              <div className="group">
                <div className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  24/7
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  All-Day Comfort
                </div>
              </div>
              
              <div className="group">
                <div className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-pink-500 to-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  ∞
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  Lasting Durability
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Progress */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-4">
            {backgroundImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative h-3 transition-all duration-500 ${
                  index === currentImageIndex ? 'w-20' : 'w-3'
                }`}
                data-testid={`gradient-indicator-${index}`}
              >
                <div className={`absolute inset-0 rounded-full ${
                  index === currentImageIndex 
                    ? 'bg-gradient-to-r from-primary via-purple-500 to-pink-500' 
                    : 'bg-white/20 hover:bg-white/40'
                }`} />
              </button>
            ))}
          </div>
        </section>

        {/* Explosive Feature Section */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-primary/10 to-pink-900/20" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-8">
            <div className="text-center mb-20">
              <h2 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                QUALITY ATHLETIC WEAR
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                High-performance gymwear designed for comfort, durability, and style in every workout
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group relative p-8 bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-2xl hover:border-primary/60 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Stay Dry</h3>
                  <p className="text-muted-foreground">
                    Advanced moisture-wicking fabric technology keeps you comfortable during intense workouts
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative p-8 bg-gradient-to-br from-card to-card/50 border border-purple-500/20 rounded-2xl hover:border-purple-500/60 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Flame className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Move Freely</h3>
                  <p className="text-muted-foreground">
                    Four-way stretch fabric provides complete freedom of movement for all activities
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative p-8 bg-gradient-to-br from-card to-card/50 border border-pink-500/20 rounded-2xl hover:border-pink-500/60 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Perfect Fit</h3>
                  <p className="text-muted-foreground">
                    Expertly designed fit that provides support and comfort throughout your entire workout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <div className="py-16">
          <ProductGrid 
            title="Latest Collection" 
            subtitle="Quality athletic wear designed for your active lifestyle"
          />
        </div>

        {/* Personalised */}
        <PersonalizedRecommendations />

        {/* Categories */}
        <CategorySection />

        {/* Final Explosive CTA */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <img 
            src={heroImage2} 
            alt="Join the elite" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/25 to-black/40" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
            <h2 className="text-6xl md:text-7xl font-black mb-10 leading-none">
              <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                ELEVATE YOUR
              </span>
              <span className="block text-white mt-4">
                TRAINING
              </span>
            </h2>
            <p className="text-2xl text-gray-300 mb-14 max-w-3xl mx-auto">
              Browse our complete range of premium athletic clothing designed to support your fitness journey
            </p>
            <Button 
              size="lg" 
              className="text-2xl px-20 py-10 rounded-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:scale-105 transition-transform shadow-2xl" 
              asChild 
              data-testid="button-start-journey"
            >
              <Link href="/products">
                Shop Now <ArrowRight className="ml-4 h-7 w-7" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
