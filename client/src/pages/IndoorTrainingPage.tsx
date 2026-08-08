import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import HeaderClean from '@/components/HeaderClean';
import ProductCardClean from '@/components/ProductCardClean';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';

// Hero image will be uploaded through admin dashboard
const indoorHero = '';

type Product = {
  id: string;
  name: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  retailPrice: string;
  imageUrl: string;
  availabilityStatus?: string;
};

export default function IndoorTrainingPage() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const indoorProducts = products.filter(p => 
    p.availabilityStatus === 'available' && 
    (p.activityType === 'training' || p.activityType === 'yoga' || p.activityType === 'studio')
  ).slice(0, 12);

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.retailPrice),
        size: 'M',
        color: 'Black',
        image: product.imageUrl || '',
        category: product.category
      });
    }
  };

  const handleToggleWishlist = (productId: string) => {
    toggleWishlist(productId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClean />
      
      <section className="relative h-[70vh] overflow-hidden">
        <img
          src={indoorHero}
          alt="Indoor training"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4" data-testid="text-indoor-hero-title">
              Hoodies and Jumpers
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Premium comfort wear designed for training, recovery, and everyday style
            </p>
            <Button 
              size="lg"
              className="bg-white text-black border-white"
              data-testid="button-shop-indoor"
            >
              Shop Collection
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2" data-testid="text-indoor-products-title">
            Hoodies and Jumpers Collection
          </h2>
          <p className="text-gray-600">
            Premium layering pieces for training, recovery, and everyday comfort
          </p>
        </div>

        {indoorProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {indoorProducts.map((product) => (
              <ProductCardClean
                key={product.id}
                id={product.id}
                name={product.name}
                price={parseFloat(product.retailPrice)}
                image={product.imageUrl || ''}
                isWishlisted={isInWishlist(product.id)}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No indoor training products available at the moment</p>
          </div>
        )}
      </section>
    </div>
  );
}
