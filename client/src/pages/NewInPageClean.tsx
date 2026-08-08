import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import HeaderClean from '@/components/HeaderClean';
import ProductCardClean from '@/components/ProductCardClean';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

type Product = {
  id: string;
  name: string;
  category: string;
  retailPrice: string;
  imageUrl: string;
  hoverImageUrl?: string;
  availabilityStatus?: string;
};

export default function NewInPageClean() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter available products and get newest ones (assuming last added are newest)
  const availableProducts = products.filter(p => p.availabilityStatus === 'available');
  const newestProducts = [...availableProducts].reverse(); // Reverse to get newest first
  const newestProduct = newestProducts[0];
  const featuredProducts = newestProducts.slice(1, 4); // Get next 3 products as featured
  
  // Filter products by category for the complete collection section
  const filteredProducts = selectedCategory === 'all' 
    ? newestProducts 
    : newestProducts.filter(p => p.category === selectedCategory);

  const handleAddToCart = (productId: string, size: string, color: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.retailPrice),
        size,
        color,
        image: product.imageUrl || '',
        category: product.category
      });
    }
  };

  const handleToggleWishlist = (productId: string) => {
    toggleWishlist(productId);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeaderClean />
      
      {/* Hero Section - Newest Product */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem}>
                <Badge className="mb-6 bg-white/10 backdrop-blur-sm text-white border-white/20 text-sm px-4 py-2">
                  NEW COLLECTION 2025
                </Badge>
              </motion.div>
              <motion.h1 
                className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight" 
                data-testid="text-newin-hero-title"
                variants={staggerItem}
              >
                Elevate Your<br />Performance
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-white/80 mb-10 max-w-xl leading-relaxed"
                variants={staggerItem}
              >
                Premium athletic wear engineered for athletes who demand excellence.
                Tactical design meets uncompromising performance.
              </motion.p>
              
              {/* Stats */}
              <motion.div 
                className="grid grid-cols-3 gap-8 mb-10"
                variants={staggerItem}
              >
                <div>
                  <div className="text-3xl font-bold text-white mb-1">50+</div>
                  <div className="text-white/60 text-sm">Products</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">UK</div>
                  <div className="text-white/60 text-sm">Based</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-white/60 text-sm">Support</div>
                </div>
              </motion.div>

              <motion.div className="flex gap-4 flex-wrap" variants={staggerItem}>
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 border-white text-base px-8 py-6"
                  asChild
                  data-testid="button-shop-now"
                >
                  <Link href="#shop-collection">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6"
                  asChild
                  data-testid="button-new-arrivals"
                >
                  <Link href="#featured">
                    <Sparkles className="mr-2 h-5 w-5" />
                    New Arrivals
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Product Card */}
            {newestProduct && (
              <motion.div
                className="lg:ml-auto"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 max-w-md">
                  <ProductCardClean
                    id={newestProduct.id}
                    name={newestProduct.name}
                    price={parseFloat(newestProduct.retailPrice)}
                    image={newestProduct.imageUrl || ''}
                    hoverImage={newestProduct.hoverImageUrl}
                    category={newestProduct.category}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(newestProduct.id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Featured Hero Products - 3 Products */}
      <motion.section 
        id="featured"
        className="py-24 bg-gray-50 dark:bg-gray-900"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-blue-600 text-white border-blue-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                TRENDING NOW
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Featured Arrivals
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Handpicked premium gear that defines the cutting edge of athletic performance
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {featuredProducts.map((product, index) => (
              <motion.div key={product.id} variants={staggerItem}>
                <div className="bg-white dark:bg-gray-950 rounded-lg p-2">
                  <ProductCardClean
                    id={product.id}
                    name={product.name}
                    price={parseFloat(product.retailPrice)}
                    image={product.imageUrl || ''}
                    hoverImage={product.hoverImageUrl}
                    category={product.category}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* All Products Showcase */}
      <motion.section 
        id="shop-collection"
        className="py-24 bg-white dark:bg-gray-950"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Complete Collection
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Explore our full range of premium athletic wear
            </motion.p>
            
            {/* Category Filters */}
            <motion.div 
              className="flex justify-center gap-3 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className="min-w-28"
                data-testid="filter-all"
              >
                All Products
              </Button>
              <Button
                variant={selectedCategory === 'Men' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('Men')}
                className="min-w-28"
                data-testid="filter-men"
              >
                Men
              </Button>
              <Button
                variant={selectedCategory === 'Women' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('Women')}
                className="min-w-28"
                data-testid="filter-women"
              >
                Women
              </Button>
            </motion.div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              key={selectedCategory}
            >
              {filteredProducts.map((product) => (
                <motion.div key={product.id} variants={staggerItem}>
                  <ProductCardClean
                    id={product.id}
                    name={product.name}
                    price={parseFloat(product.retailPrice)}
                    image={product.imageUrl || ''}
                    hoverImage={product.hoverImageUrl}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
