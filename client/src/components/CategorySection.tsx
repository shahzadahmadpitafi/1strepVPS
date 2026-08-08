import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Category images will be uploaded through admin dashboard
const womenImage = '';
const menImage = '';

export default function CategorySection() {
  const categories = [
    {
      id: "womens",
      title: "Women's Collection",
      subtitle: "Performance meets style",
      description: "Engineered for the modern athlete who demands both function and form",
      image: womenImage,
      href: "/collections/women",
      ctaText: "Shop Women's"
    },
    {
      id: "mens", 
      title: "Men's Collection",
      subtitle: "Built for performance",
      description: "Technical apparel designed to withstand your toughest training sessions",
      image: menImage,
      href: "/collections/men", 
      ctaText: "Shop Men's"
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" data-testid="category-section-title">
            Performance Collections
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="category-section-subtitle">
            Discover apparel engineered for peak performance, designed by athletes, for athletes.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="group relative overflow-hidden hover-elevate border-card-border bg-card min-h-[500px]"
              data-testid={`category-card-${category.id}`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col justify-end h-full p-8 text-white">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-gray-300 mb-2" data-testid={`category-subtitle-${category.id}`}>
                      {category.subtitle}
                    </p>
                    <h3 className="text-3xl font-bold mb-3" data-testid={`category-title-${category.id}`}>
                      {category.title}
                    </h3>
                    <p className="text-lg text-gray-200 mb-6 max-w-md" data-testid={`category-description-${category.id}`}>
                      {category.description}
                    </p>
                  </div>
                  
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 backdrop-blur-sm w-fit"
                    onClick={() => console.log(`Navigate to ${category.href}`)}
                    data-testid={`button-${category.id}`}
                  >
                    {category.ctaText}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold" data-testid="bottom-cta-title">
              Can't decide? Explore all collections
            </h3>
            <p className="text-muted-foreground" data-testid="bottom-cta-description">
              From technical base layers to high-performance outerwear, find everything you need to elevate your training.
            </p>
            <Button 
              size="lg"
              onClick={() => console.log('View all collections clicked')}
              data-testid="button-all-collections"
            >
              View All Collections
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}