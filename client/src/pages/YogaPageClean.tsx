import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import HeaderClean from '@/components/HeaderClean';
import ProductCardClean from '@/components/ProductCardClean';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flower2, Heart, Leaf, Sparkles, ArrowRight, Wind, Moon, Sun } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

// Videos and images will be uploaded through admin dashboard
const runningVideo = '';
const yogaHero = '';
const athleteYoga = '';
const athletePlank = '';
const athleteBattleRopes = '';
const trainingHubHero = '';

type Product = {
  id: string;
  name: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  retailPrice: string;
  imageUrl: string;
  availabilityStatus?: string;
};

export default function YogaPageClean() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter yoga products - fallback to general if no yoga-specific products
  const yogaProducts = products.filter(p => 
    p.availabilityStatus === 'available' && 
    (p.activityType === 'yoga' || (p.activityType === 'general' && (
      p.category?.toLowerCase().includes('yoga') ||
      p.category?.toLowerCase().includes('studio') ||
      p.category?.toLowerCase().includes('meditation')
    )))
  );

  // Filter studio products for cross-promotion
  const studioProducts = products.filter(p => 
    p.availabilityStatus === 'available' && 
    (p.activityType === 'studio' || (p.activityType === 'general' && 
      p.category?.toLowerCase().includes('studio')
    ))
  ).slice(0, 1);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
      
      {/* Dynamic Hero Section - Mindful Energy */}
      <motion.section 
        className="relative h-screen overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={runningVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <motion.div 
            className="max-w-5xl"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem}>
              <Badge className="mb-6 bg-white/10 backdrop-blur-sm text-white border-white/20 text-sm px-4 py-2">
                MINDFUL MOVEMENT
              </Badge>
            </motion.div>
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight" 
              data-testid="text-yoga-hero-title"
              variants={staggerItem}
            >
              Move with<br />Intention
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed"
              variants={staggerItem}
            >
              Buttery-soft, breathable fabrics designed for flow, flexibility, and finding your center
            </motion.p>
            <motion.div className="flex gap-4 justify-center flex-wrap" variants={staggerItem}>
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 border-white text-base px-8 py-6"
                onClick={() => scrollToSection('shop-collection')}
                data-testid="button-shop-yoga"
              >
                Explore Collection
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6"
                onClick={() => scrollToSection('practice-showcase')}
                data-testid="button-discover-practice"
              >
                Discover Your Practice
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </motion.section>

      {/* Practice Showcase - Dynamic Showcase */}
      <motion.section 
        id="practice-showcase"
        className="py-24 bg-gray-50 dark:bg-gray-900"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
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
              Flow Meets Function
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              From sunrise meditation to power vinyasa, designed to move with your practice
            </motion.p>
          </div>

          {/* Practice Grid - All clickable */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {yogaProducts[0] && (
              <Link href={`/product/${yogaProducts[0].id}`}>
                <motion.div className="relative h-96 md:h-[600px] overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                  <img src={athleteYoga} alt="Yoga Flow" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <h3 className="text-3xl font-bold mb-2">Power Flow</h3>
                    <p className="text-white/90 mb-4">High-performance yoga essentials</p>
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {yogaProducts[0].name}
                    </p>
                  </div>
                </motion.div>
              </Link>
            )}
            
            {yogaProducts[1] && (
              <Link href={`/product/${yogaProducts[1].id}`}>
                <motion.div className="relative h-96 md:h-[600px] overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                  <img src={trainingHubHero} alt="Restorative practice" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <h3 className="text-3xl font-bold mb-2">Restorative</h3>
                    <p className="text-white/90 mb-4">Ultra-soft comfort layers</p>
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {yogaProducts[1].name}
                    </p>
                  </div>
                </motion.div>
              </Link>
            )}
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {yogaProducts[2] && (
              <Link href={`/product/${yogaProducts[2].id}`}>
                <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                  <img src={athletePlank} alt="Morning practice" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                      SUNRISE
                    </Badge>
                    <h4 className="text-xl font-bold mb-2">Morning Flow</h4>
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {yogaProducts[2].name}
                    </p>
                  </div>
                </motion.div>
              </Link>
            )}
            
            {yogaProducts[3] && (
              <Link href={`/product/${yogaProducts[3].id}`}>
                <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                  <img src={athleteBattleRopes} alt="Hot yoga" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                      HOT YOGA
                    </Badge>
                    <h4 className="text-xl font-bold mb-2">Heat Ready</h4>
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {yogaProducts[3].name}
                    </p>
                  </div>
                </motion.div>
              </Link>
            )}
            
            {yogaProducts[4] && (
              <Link href={`/product/${yogaProducts[4].id}`}>
                <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                  <img src={yogaHero} alt="Evening practice" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                      MEDITATION
                    </Badge>
                    <h4 className="text-xl font-bold mb-2">Calm & Centered</h4>
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {yogaProducts[4].name}
                    </p>
                  </div>
                </motion.div>
              </Link>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Studio Category Hero */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-black"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={athletePlank} alt="Studio practice hero" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-white/10 backdrop-blur-sm text-white border-white/20">
                STUDIO COLLECTION
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Designed for<br />Every Practice
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Moisture-wicking, four-way stretch fabrics that support you from downward dog to savasana
              </p>
              
              {/* Material highlights */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Flower2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Buttery Soft Fabric</h4>
                    <p className="text-white/70">Second-skin comfort for deep stretches</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Wind className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Breathable Mesh</h4>
                    <p className="text-white/70">Strategic ventilation for hot yoga sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Eco-Friendly Materials</h4>
                    <p className="text-white/70">Sustainable fabrics for mindful movement</p>
                  </div>
                </div>
              </div>

              <Link href="/shop?category=yoga">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-studio"
                >
                  Shop Yoga Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Hero Product Card */}
            {studioProducts[0] && (
              <motion.div
                className="lg:ml-auto"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 max-w-md">
                  <ProductCardClean
                    id={studioProducts[0].id}
                    name={studioProducts[0].name}
                    price={parseFloat(studioProducts[0].retailPrice)}
                    image={studioProducts[0].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(studioProducts[0].id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Meditation & Recovery Category Hero */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-gray-900"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={yogaHero} alt="Meditation hero" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-gray-900/60 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Product Card - Left side */}
            {yogaProducts[0] && (
              <motion.div
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-950 rounded-lg p-2 max-w-md mx-auto lg:mx-0">
                  <ProductCardClean
                    id={yogaProducts[0].id}
                    name={yogaProducts[0].name}
                    price={parseFloat(yogaProducts[0].retailPrice)}
                    image={yogaProducts[0].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(yogaProducts[0].id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-white/10 backdrop-blur-sm text-white border-white/20">
                MINDFULNESS COLLECTION
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Find Your<br />Inner Balance
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Ultra-comfortable layers designed for meditation, recovery, and restorative practices
              </p>
              
              {/* Material highlights */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Moon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Calming Comfort</h4>
                    <p className="text-white/70">Soft-touch fabrics for deep relaxation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Seamless Design</h4>
                    <p className="text-white/70">Zero distractions during meditation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">All-Day Wear</h4>
                    <p className="text-white/70">From mat to life transitions</p>
                  </div>
                </div>
              </div>

              <Link href="/shop?category=studio">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-mindfulness"
                >
                  Shop Mindfulness Wear
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Shop Collection Section */}
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
              Yoga Essentials
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Complete your practice with our full collection
            </motion.p>
          </div>

          {yogaProducts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {yogaProducts.slice(0, 12).map((product, index) => (
                <motion.div key={product.id} variants={staggerItem}>
                  <ProductCardClean
                    id={product.id}
                    name={product.name}
                    price={parseFloat(product.retailPrice)}
                    image={product.imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No yoga products available at the moment</p>
            </div>
          )}

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/shop?category=yoga">
              <Button 
                size="lg"
                variant="outline"
                className="text-base px-8"
                data-testid="button-view-all-yoga"
              >
                View All Yoga Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
