import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

// Hero images will be uploaded through admin dashboard
// Empty array - ready for real hero images
const heroMedia: { type: "image"; url: string; alt: string }[] = [];

export default function HeroSection() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 1500, stopOnInteraction: false })
  );

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Carousel */}
      <Carousel
        opts={{ 
          loop: true,
          duration: 20
        }}
        plugins={[autoplayPlugin.current]}
        className="absolute inset-0"
      >
        <CarouselContent className="h-screen -ml-0">
          {heroMedia.map((media, index) => (
            <CarouselItem key={index} className="h-screen pl-0 hero-carousel-item">
              {media.type === "image" ? (
                <div className="relative h-full w-full">
                  <img
                    src={media.url}
                    alt={media.alt}
                    className="absolute inset-0 w-full h-full hero-image"
                  />
                </div>
              ) : (
                <video
                  className="absolute inset-0 w-full h-full hero-image"
                  autoPlay
                  muted
                  loop
                  playsInline
                  src={media.url}
                />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      
      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight" data-testid="hero-title">
          BUILD YOUR
          <br />
          <span className="text-primary">IMPOSSIBLE</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed" data-testid="hero-subtitle">
          It all starts with your 1st Rep. Performance range designed for athletes who never settle for ordinary.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold"
            onClick={() => window.location.href = '/shop'}
            data-testid="button-shop-now"
          >
            Shop Now
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
            onClick={() => console.log('Learn more clicked')}
            data-testid="button-learn-more"
          >
            Learn More
          </Button>
        </div>
        
        {/* Featured Stats */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-12 mt-16 text-white/80">
          <div className="text-center" data-testid="stat-products">
            <div className="text-2xl font-bold text-white">500+</div>
            <div className="text-sm uppercase tracking-wide">Products</div>
          </div>
          <div className="text-center" data-testid="stat-athletes">
            <div className="text-2xl font-bold text-white">10K+</div>
            <div className="text-sm uppercase tracking-wide">Athletes</div>
          </div>
          <div className="text-center" data-testid="stat-countries">
            <div className="text-2xl font-bold text-white">25+</div>
            <div className="text-sm uppercase tracking-wide">Countries</div>
          </div>
        </div>
      </div>
    </section>
  );
}