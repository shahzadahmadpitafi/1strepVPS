import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import HeaderClean from '@/components/HeaderClean';
import ProductCardClean from '@/components/ProductCardClean';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Heart, Wind, Shield, Star, Zap, Droplets } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

// Videos and images will be uploaded through admin dashboard
const gymConfidence = '';
const modestGymStyle = '';
const runnersOutdoor = '';
const trackRunner = '';
const beachRunner = '';
const startingPosition = '';
const athleteWarmup = '';
const restingAthlete = '';
const powerfulMovement = '';
const modestVideo = '';
const heroVideo = '';

type Product = {
  id: string;
  name: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  retailPrice: string;
  imageUrl: string;
  availabilityStatus?: string;
};

export default function ModestClothesPageClean() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products for modest activewear (exclude bras)
  const modestProducts = products.filter(p => 
    p.availabilityStatus === 'available' && 
    // Exclude bra products
    !p.category?.toLowerCase()?.includes('bra') &&
    !p.name?.toLowerCase()?.includes('bra') &&
    (
      p.category?.toLowerCase()?.includes('modest') || 
      p.name?.toLowerCase()?.includes('modest') ||
      p.activityType === 'general' && (
        p.category?.toLowerCase()?.includes('women') ||
        p.category?.toLowerCase()?.includes('top') ||
        p.category?.toLowerCase()?.includes('bottom') ||
        p.category?.toLowerCase()?.includes('legging')
      )
    )
  );

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
      
      {/* Dynamic Hero Section - Full Screen */}
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
          <source src={heroVideo} type="video/mp4" />
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
                EMPOWERED PERFORMANCE
              </Badge>
            </motion.div>
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight" 
              data-testid="text-modest-hero-title"
              variants={staggerItem}
            >
              Modest Activewear
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed"
              variants={staggerItem}
            >
              Where confidence meets comfort, and modesty meets performance
            </motion.p>
            <motion.p 
              className="text-lg text-white/80 mb-10 max-w-2xl mx-auto"
              variants={staggerItem}
            >
              Designed for the modern athlete who values both coverage and capability
            </motion.p>
            <motion.div className="flex gap-4 justify-center flex-wrap" variants={staggerItem}>
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 border-white text-base px-8 py-6"
                onClick={() => scrollToSection('shop-collection')}
                data-testid="button-explore-collection"
              >
                Explore Collection
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6"
                onClick={() => scrollToSection('our-purpose')}
                data-testid="button-our-story"
              >
                Our Story
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

      {/* Empowered Athletes - Dynamic Showcase */}
      <motion.section 
        id="our-purpose"
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
              Confidence in Every Move
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Modesty and performance aren't just compatible—they're powerful together
            </motion.p>
          </div>

          {/* Athletes Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Link href={modestProducts[0] ? `/product/${modestProducts[0].id}` : '#'}>
              <motion.div className="relative h-96 md:h-[600px] overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={trackRunner} alt="Track runner in hijab" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">Track Performance</h3>
                  <p className="text-white/90 mb-4">Breathable coverage for speed</p>
                  {modestProducts[0] && (
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {modestProducts[0].name}
                    </p>
                  )}
                </div>
              </motion.div>
            </Link>
            
            <Link href={modestProducts[1] ? `/product/${modestProducts[1].id}` : '#'}>
              <motion.div className="relative h-96 md:h-[600px] overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={gymConfidence} alt="Gym training confidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">Gym Ready</h3>
                  <p className="text-white/90 mb-4">Full coverage, full confidence</p>
                  {modestProducts[1] && (
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {modestProducts[1].name}
                    </p>
                  )}
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
            <Link href={modestProducts[2] ? `/product/${modestProducts[2].id}` : '#'}>
              <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={runnersOutdoor} alt="Outdoor running group" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                    COMMUNITY
                  </Badge>
                  <h4 className="text-xl font-bold mb-2">Run Together</h4>
                  {modestProducts[2] && (
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {modestProducts[2].name}
                    </p>
                  )}
                </div>
              </motion.div>
            </Link>
            
            <Link href={modestProducts[3] ? `/product/${modestProducts[3].id}` : '#'}>
              <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={startingPosition} alt="Sprint start position" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                    EXPLOSIVE
                  </Badge>
                  <h4 className="text-xl font-bold mb-2">Ready to Sprint</h4>
                  {modestProducts[3] && (
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {modestProducts[3].name}
                    </p>
                  )}
                </div>
              </motion.div>
            </Link>
            
            <Link href={modestProducts[4] ? `/product/${modestProducts[4].id}` : '#'}>
              <motion.div className="relative h-64 md:h-80 overflow-hidden rounded-lg group cursor-pointer" variants={staggerItem}>
                <img src={powerfulMovement} alt="Powerful movement" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition-colors duration-500" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-2">
                    STRENGTH
                  </Badge>
                  <h4 className="text-xl font-bold mb-2">Dynamic Power</h4>
                  {modestProducts[4] && (
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Click to shop {modestProducts[4].name}
                    </p>
                  )}
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Full-Sleeve Performance Category Hero */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-black"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={modestGymStyle} alt="Full-sleeve performance top" className="w-full h-full object-cover opacity-60" />
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
                FULL-SLEEVE COLLECTION
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Complete<br />Coverage
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Full-sleeve performance tops offer complete coverage without sacrificing flexibility or breathability
              </p>
              
              {/* Material highlights */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Wind className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Ultra-Soft Fabric</h4>
                    <p className="text-white/70">Breathable four-way stretch for unrestricted movement</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Chafe-Free Design</h4>
                    <p className="text-white/70">Flatlock seams prevent irritation during long sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Extended Length</h4>
                    <p className="text-white/70">Extra coverage for confidence in every pose</p>
                  </div>
                </div>
              </div>

              <Link href="/shop?category=modest">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-tops"
                >
                  Shop Full-Sleeve Tops
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Hero Product Card */}
            {modestProducts[0] && (
              <motion.div
                className="lg:ml-auto"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 max-w-md">
                  <ProductCardClean
                    id={modestProducts[0].id}
                    name={modestProducts[0].name}
                    price={parseFloat(modestProducts[0].retailPrice)}
                    image={modestProducts[0].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(modestProducts[0].id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Hijab-Friendly Sets Category Hero */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-gray-900"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-50"
          >
            <source src={modestVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-gray-900/60 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Product Card - Left side */}
            {modestProducts[1] && (
              <motion.div
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-950 rounded-lg p-2 max-w-md mx-auto lg:mx-0">
                  <ProductCardClean
                    id={modestProducts[1].id}
                    name={modestProducts[1].name}
                    price={parseFloat(modestProducts[1].retailPrice)}
                    image={modestProducts[1].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(modestProducts[1].id)}
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
                HIJAB-FRIENDLY SETS
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Modesty<br />Meets Power
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Complete performance sets specifically designed with hijab wearers in mind—secure coverage and freedom of movement
              </p>
              
              {/* Material highlights */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Moisture-Wicking</h4>
                    <p className="text-white/70">Advanced technology keeps you cool and dry</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Coordinated Sets</h4>
                    <p className="text-white/70">Perfectly matched tops and bottoms for seamless style</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Built with Love</h4>
                    <p className="text-white/70">Designed by athletes who understand your needs</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 mb-8">
                <p className="text-base italic text-white/90">
                  "Finally, activewear that understands my needs. I can focus on my training, not my outfit."
                </p>
                <p className="text-sm text-white/70 mt-2">— Aaliyah, Marathon Runner</p>
              </div>

              <Link href="/shop?category=modest">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-sets"
                >
                  Shop Performance Sets
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Leggings Category Hero */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-black"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={beachRunner} alt="Modest leggings in action" className="w-full h-full object-cover opacity-60" />
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
                MODEST LEGGINGS
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Strength in<br />Every Step
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                High-waisted, full-length leggings engineered for modesty and peak performance with squat-proof fabric
              </p>
              
              {/* Material highlights */}
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Squat-Proof Fabric</h4>
                    <p className="text-white/70">Opaque, durable material for complete confidence</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Compression Support</h4>
                    <p className="text-white/70">Muscle support for long-distance endurance</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">High-Waisted Design</h4>
                    <p className="text-white/70">Secure coverage that stays in place</p>
                  </div>
                </div>
              </div>

              <Link href="/shop?category=modest">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-leggings"
                >
                  Shop Leggings
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Hero Product Card */}
            {modestProducts[2] && (
              <motion.div
                className="lg:ml-auto"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 max-w-md">
                  <ProductCardClean
                    id={modestProducts[2].id}
                    name={modestProducts[2].name}
                    price={parseFloat(modestProducts[2].retailPrice)}
                    image={modestProducts[2].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(modestProducts[2].id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            )}
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
              Complete Collection
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Discover your perfect modest activewear
            </motion.p>
          </div>

          {modestProducts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {modestProducts.slice(0, 12).map((product) => (
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
              <p className="text-gray-500">No modest activewear products available at the moment</p>
            </div>
          )}

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/shop?category=modest">
              <Button 
                size="lg"
                variant="outline"
                className="text-base px-8"
                data-testid="button-view-all-modest"
              >
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
