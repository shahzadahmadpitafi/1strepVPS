import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import HeaderClean from '@/components/HeaderClean';
import ProductCardClean from '@/components/ProductCardClean';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wind, Zap, Eye, Droplets, ArrowRight, Shield, Heart, Target } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

// Videos and images will be uploaded through admin dashboard
const yogaVideo = '';
const runnerHijab = '';
const trackRunners = '';
const trackFromBehind = '';
const sprintStart = '';
const cityRunner = '';

type Product = {
  id: string;
  name: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  retailPrice: string;
  imageUrl: string;
  availabilityStatus?: string;
};

export default function RunningPageClean() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter running products - fallback to general if no running-specific products
  const runningProducts = products.filter(p => 
    p.availabilityStatus === 'available' && 
    (p.activityType === 'running' || (p.activityType === 'general' && (
      p.category?.toLowerCase().includes('running') ||
      p.category?.toLowerCase().includes('track') ||
      p.category?.toLowerCase().includes('marathon')
    )))
  );

  // Filter training products for cross-promotion
  const trainingProducts = products.filter(p => 
    p.availabilityStatus === 'available' && 
    (p.activityType === 'training' || (p.activityType === 'general' && 
      p.category?.toLowerCase().includes('training')
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
      
      {/* Dynamic Hero Section - High Energy */}
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
          <source src={yogaVideo} type="video/mp4" />
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
                SPEED REDEFINED
              </Badge>
            </motion.div>
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight" 
              data-testid="text-running-hero-title"
              variants={staggerItem}
            >
              Run Faster<br />Go Further
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed"
              variants={staggerItem}
            >
              Engineered with lightweight, aerodynamic fabrics designed to give you the competitive edge
            </motion.p>
            <motion.div className="flex gap-4 justify-center flex-wrap" variants={staggerItem}>
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 border-white text-base px-8 py-6"
                onClick={() => scrollToSection('shop-collection')}
                data-testid="button-shop-running"
              >
                Explore Collection
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6"
                onClick={() => scrollToSection('runners-showcase')}
                data-testid="button-watch-athletes"
              >
                Watch Athletes
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

      {/* Runners in Motion - Dynamic Showcase */}
      <motion.section 
        id="runners-showcase"
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
              Built for Every Stride
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              From track sprints to urban marathons, gear that moves with you
            </motion.p>
          </div>

          {/* Running Grid - All clickable */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Link href="/shop-clean?category=Men">
              <motion.div className="relative h-96 md:h-[600px] overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={trackFromBehind} alt="Track runners" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">Men</h3>
                  <p className="text-white/90 mb-4">Sprint-ready aerodynamics</p>
                  <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Click to shop Men's Collection
                  </p>
                </div>
              </motion.div>
            </Link>
            
            <Link href="/shop-clean?category=Women">
              <motion.div className="relative h-96 md:h-[600px] overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={runnerHijab} alt="Runner on track" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">Women</h3>
                  <p className="text-white/90 mb-4">Performance for everyone</p>
                  <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Click to shop Women's Collection
                  </p>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Link href="/shop-clean?category=Outdoor Training">
              <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={sprintStart} alt="Sprint start position" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                    EXPLOSIVE
                  </Badge>
                  <h4 className="text-xl font-bold mb-2">Sprint Power</h4>
                  <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Click to shop Outdoor Training
                  </p>
                </div>
              </motion.div>
            </Link>
            
            <Link href="/shop-clean?category=Outdoor Training">
              <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={trackRunners} alt="Multiple runners" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                    ENDURANCE
                  </Badge>
                  <h4 className="text-xl font-bold mb-2">Long Distance</h4>
                  <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Click to shop Outdoor Training
                  </p>
                </div>
              </motion.div>
            </Link>
            
            <Link href="/shop-clean?category=Women">
              <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={cityRunner} alt="Urban runner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                    WOMEN
                  </Badge>
                  <h4 className="text-xl font-bold mb-2">Women</h4>
                  <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    Click to shop Women's Collection
                  </p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Performance Category Hero */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-black"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={sprintStart} alt="Performance running" className="w-full h-full object-cover opacity-60" />
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
                PERFORMANCE COLLECTION
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Engineered<br />for Speed
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Aerodynamic cuts, moisture-wicking fabric, and strategic ventilation zones keep you cool and fast
              </p>
              
              {/* Material highlights */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Wind className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Breathable Mesh Panels</h4>
                    <p className="text-white/70">Strategic airflow exactly where you need it</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Lightweight Design</h4>
                    <p className="text-white/70">Minimal weight for maximum speed and agility</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Reflective Details</h4>
                    <p className="text-white/70">360° visibility for early morning and night runs</p>
                  </div>
                </div>
              </div>

              <Link href="/shop?category=running">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-performance"
                >
                  Shop Performance Gear
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Hero Product Card */}
            {runningProducts[0] && (
              <motion.div
                className="lg:ml-auto"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 max-w-md">
                  <ProductCardClean
                    id={runningProducts[0].id}
                    name={runningProducts[0].name}
                    price={parseFloat(runningProducts[0].retailPrice)}
                    image={runningProducts[0].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(runningProducts[0].id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Marathon & Distance Category Hero */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-gray-900"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={cityRunner} alt="Marathon running" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-gray-900/60 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Product Card - Left side */}
            {trainingProducts[0] && (
              <motion.div
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-950 rounded-lg p-2 max-w-md mx-auto lg:mx-0">
                  <ProductCardClean
                    id={trainingProducts[0].id}
                    name={trainingProducts[0].name}
                    price={parseFloat(trainingProducts[0].retailPrice)}
                    image={trainingProducts[0].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(trainingProducts[0].id)}
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
                DISTANCE COLLECTION
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Go the<br />Extra Mile
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Endurance-focused fabrics with compression support and moisture management for your longest runs
              </p>
              
              {/* Material highlights */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Moisture-Wicking Tech</h4>
                    <p className="text-white/70">Keeps you dry through every mile</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Chafe-Free Construction</h4>
                    <p className="text-white/70">Flatlock seams for friction-free comfort</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Compression Support</h4>
                    <p className="text-white/70">Muscle support for long-distance endurance</p>
                  </div>
                </div>
              </div>

              <Link href="/shop?category=running">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-distance"
                >
                  Shop Distance Gear
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
              Running Essentials
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Complete your training with our full collection
            </motion.p>
          </div>

          {runningProducts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {runningProducts.slice(0, 12).map((product, index) => (
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
              <p className="text-gray-500">No running products available at the moment</p>
            </div>
          )}

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/shop?category=running">
              <Button 
                size="lg"
                variant="outline"
                className="text-base px-8"
                data-testid="button-view-all-running"
              >
                View All Running Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
