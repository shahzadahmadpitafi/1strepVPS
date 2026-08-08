import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";

// Product images will be loaded from database
const tshirtImage = '';
const hoodieImage = '';
const leggingsImage = '';
const sportsbraImage = '';

interface ProductGridProps {
  title: string;
  subtitle?: string;
  showLoadMore?: boolean;
}

export default function ProductGrid({ title, subtitle, showLoadMore = true }: ProductGridProps) {
  // Authentic 1stRep products based on actual website
  const mockProducts = [
    {
      id: "1",
      name: "1st Rep Classic T-Shirt",
      price: 22.00,
      image: tshirtImage,
      category: "Men's T-Shirts",
      colors: ['#000000', '#808080'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
      id: "2",
      name: "1st Rep Classic Hoodie",
      price: 40.00,
      image: hoodieImage,
      category: "Men's Hoodies",
      colors: ['#808080', '#000000'],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: "3",
      name: "High Neck Sports Bra",
      price: 30.00,
      image: sportsbraImage,
      category: "Women's Vests",
      colors: ['#000000', '#CD853F', '#FF1493'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: "4",
      name: "High Impact Sports Bra",
      price: 30.00,
      image: sportsbraImage,
      category: "Women's Vests",
      isNew: true,
      colors: ['#000000', '#4169E1'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: "5",
      name: "1st Rep Organic Cropped Tank",
      price: 25.00,
      image: leggingsImage,
      category: "Women's Vests",
      colors: ['#FFB6C1', '#D2B48C'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: "6",
      name: "1st Rep Classic Tank",
      price: 25.00,
      image: leggingsImage,
      category: "Women's Vests",
      colors: ['#008080', '#000000'],
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: "7",
      name: "1st Rep Hoodie - Lime",
      price: 55.00,
      image: hoodieImage,
      category: "Unisex Hoodies",
      isNew: true,
      colors: ['#32CD32'],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      id: "8",
      name: "1st Rep Batwing Jacket",
      price: 38.00,
      image: hoodieImage,
      category: "Women's Outerwear",
      colors: ['#000000'],
      sizes: ['XS', 'S', 'M', 'L']
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" data-testid="product-grid-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="product-grid-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {mockProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              originalPrice={(product as any).originalPrice}
              image={product.image}
              category={product.category}
              isNew={product.isNew}
              colors={product.colors}
              sizes={product.sizes}
            />
          ))}
        </div>

        {/* Load More Button */}
        {showLoadMore && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => console.log('Load more products clicked')}
              data-testid="button-load-more"
            >
              Load More Products
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}