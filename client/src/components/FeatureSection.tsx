import { Truck, Shield, Recycle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function FeatureSection() {
  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free delivery on orders over £75. Fast, reliable shipping worldwide.",
      color: "text-blue-500"
    },
    {
      icon: Shield,
      title: "Performance Guarantee",
      description: "30-day performance guarantee. If it doesn't perform, return it.",
      color: "text-green-500"
    },
    {
      icon: Recycle,
      title: "Sustainable Materials",
      description: "Made from recycled and sustainable materials without compromising performance.",
      color: "text-emerald-500"
    },
    {
      icon: Users,
      title: "Athlete Tested",
      description: "Tested by professional athletes and fitness enthusiasts worldwide.",
      color: "text-purple-500"
    }
  ];

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" data-testid="features-title">
            Why Choose 1stRep
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="features-subtitle">
            We're committed to delivering exceptional quality and service in everything we do.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 text-center hover-elevate border-card-border bg-card"
              data-testid={`feature-card-${index}`}
            >
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full bg-muted/50 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-3" data-testid={`feature-title-${index}`}>
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground text-sm leading-relaxed" data-testid={`feature-description-${index}`}>
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}