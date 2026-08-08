import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import { Sparkles } from "lucide-react";

export default function PersonalizedRecommendations() {
  const { data: recommendations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/recommendations"],
  });

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show section if no recommendations
  }

  return (
    <section className="py-12" data-testid="section-recommendations">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold text-center">
            Recommended For You
          </h2>
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Based on your browsing history, we think you'll love these products
        </p>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((rec: any) => (
            <ProductCard
              key={rec.productId}
              id={rec.product.id}
              name={rec.product.name}
              price={parseFloat(rec.product.retailPrice)}
              image={rec.product.imageUrl || "/placeholder-product.jpg"}
              category={rec.product.category}
              colors={rec.product.colors || []}
              sizes={rec.product.sizes || []}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
