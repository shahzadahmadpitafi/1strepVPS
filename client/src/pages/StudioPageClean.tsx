import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import HeaderClean from '@/components/HeaderClean';
import ProductCardClean from '@/components/ProductCardClean';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Activity, Sparkles, Waves, Shield } from 'lucide-react';

// Videos and images will be uploaded through admin dashboard
const studioHero = '';
const studioVideo = '';

type Product = {
  id: string;
  name: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  retailPrice: string;
  imageUrl: string;
  availabilityStatus?: string;
};

export default function StudioPageClean() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const studioProducts = products.filter(p => 
    p.availabilityStatus === 'available' && 
    p.activityType === 'studio'
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
      
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={studioVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4" data-testid="text-studio-hero-title">
              Studio Ready
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Versatile pieces designed for Pilates, barre, and studio workouts
            </p>
            <Button 
              size="lg"
              className="bg-white text-black border-white"
              data-testid="button-shop-studio"
            >
              Shop Studio
            </Button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2" data-testid="text-studio-products-title">
            Studio Essentials
          </h2>
          <p className="text-gray-600">
            Graceful performance wear for every movement
          </p>
        </div>

        {studioProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {studioProducts.map((product) => (
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
            <p className="text-gray-500">No studio products available at the moment</p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Studio Performance</h2>
            <p className="text-gray-600">Designed for controlled movement</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="font-semibold mb-2">Sculpting Support</h3>
              <p className="text-sm text-gray-600">Gentle compression for definition</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Fit</h3>
              <p className="text-sm text-gray-600">Move freely through every pose</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="font-semibold mb-2">Second-Skin Feel</h3>
              <p className="text-sm text-gray-600">Barely-there comfort</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Waves className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="font-semibold mb-2">Sweat-Resistant</h3>
              <p className="text-sm text-gray-600">Stay fresh through intense sessions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
