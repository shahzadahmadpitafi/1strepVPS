import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import ProductSection from '@/components/ProductSection';
import HeaderClean from '@/components/HeaderClean';
import ProductCardClean from '@/components/ProductCardClean';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wind, Zap, Shield, Target, ArrowRight, Dumbbell, Activity } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

// Videos and images will be uploaded through admin dashboard
const trainingVideo = '';
const runningHero = '';
const strengthHero = '';
const hiitHero = '';

type Product = {
  id: string;
  name: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  gender?: 'men' | 'women' | 'unisex';
  retailPrice: string;
  imageUrl: string;
  availabilityStatus?: string;
};

type ProductSectionType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  genderFilter: string;
  viewAllLink: string | null;
};

export default function TrainingPageClean() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [location] = useLocation();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [hoveredSections, setHoveredSections] = useState<Record<string, boolean>>({});

  // Get gender from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genderParam = params.get('gender');
    if (genderParam) {
      setSelectedGender(genderParam.toLowerCase());
    } else {
      setSelectedGender(null);
    }
  }, [location]);

  // Fetch product sections from database
  const { data: productSectionsRaw = [] } = useQuery<ProductSectionType[]>({
    queryKey: ["/api/product-sections"],
  });

  // Defensive sort to ensure sections always display in correct displayOrder
  // (other components may mutate the shared React Query cache)
  const productSections = useMemo(() => 
    [...productSectionsRaw].sort((a, b) => a.displayOrder - b.displayOrder),
    [productSectionsRaw]
  );

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Helper to toggle hover state for a section
  const setSectionHovered = (sectionId: string, hovered: boolean) => {
    setHoveredSections(prev => ({ ...prev, [sectionId]: hovered }));
  };

  // Apply gender filter first - products with 'unisex' appear in both sections
  const genderFilteredProducts = selectedGender
    ? products.filter(p => {
        const productGender = p.gender || 'unisex';
        return productGender === selectedGender || productGender === 'unisex';
      })
    : products;

  // Filter training products from gender-filtered list
  const trainingProducts = genderFilteredProducts.filter(p => 
    p.availabilityStatus === 'available' && 
    (p.activityType === 'training' || (p.activityType === 'general' && 
      p.category?.toLowerCase().includes('training')
    ))
  ).slice(0, 2);

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
    <div className="min-h-screen bg-black">
      <HeaderClean />
      
      {/* Dynamic Hero Section - High Energy */}
      <motion.section 
        className="relative h-[50vh] md:h-[70vh] lg:h-screen overflow-hidden"
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
          <source src={trainingVideo} type="video/mp4" />
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
                PERFORMANCE REDEFINED
              </Badge>
            </motion.div>
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight" 
              data-testid="text-active-range-hero-title"
              variants={staggerItem}
            >
              Active Range
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed"
              variants={staggerItem}
            >
              Premium performance apparel engineered for athletes who demand excellence in every workout
            </motion.p>
            <motion.div className="flex gap-4 justify-center flex-wrap" variants={staggerItem}>
              <Link href="/shop-clean?gender=men">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6"
                  data-testid="button-shop-men"
                >
                  Men
                </Button>
              </Link>
              <Link href="/shop-clean?gender=women">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6"
                  data-testid="button-shop-women"
                >
                  Women
                </Button>
              </Link>
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

      {/* Product Sections - Dynamically rendered from database */}
      {productSections.map((section, index) => {
        const position = index % 2 === 0 ? 'left' : 'right';
        const animations = [
          { initial: { opacity: 0, x: -100 }, direction: 'left' as const },
          { initial: { opacity: 0, x: 100 }, direction: 'right' as const },
          { initial: { opacity: 0, y: 100 }, direction: 'up' as const },
        ];
        const animation = animations[index % 3];
        
        return (
          <ProductSection
            key={section.id}
            id={`${section.slug}-active-range`}
            sectionName={section.name}
            category={section.name}
            image=""
            title={section.name}
            subtitle={section.description || `Explore our ${section.name.toLowerCase()} collection.\nPremium quality for every occasion.`}
            badge="PERFORMANCE RANGE"
            hovered={hoveredSections[section.id] || false}
            setHovered={(hovered) => setSectionHovered(section.id, hovered)}
            position={position}
            animation={animation}
          />
        );
      })}

      {/* Our Hero Products Divider Section */}
      <section className="py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:text-white">
                Our Hero Products
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Discover our flagship performance collections engineered for peak athletic achievement
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Running Performance Collection */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-black"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={runningHero} alt="Running Performance" className="w-full h-full object-cover opacity-60" />
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
                RUNNING PERFORMANCE
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Engineered<br />for Speed
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Aerodynamic cuts, moisture-wicking fabric, and strategic ventilation zones keep you cool and fast
              </p>
              
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
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Chafe-Free Construction</h4>
                    <p className="text-white/70">Flatlock seams for friction-free comfort</p>
                  </div>
                </div>
              </div>

              <Link href="/shop-clean?category=running">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-running"
                >
                  Shop Running
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {trainingProducts[0] && (
              <motion.div
                className="lg:ml-auto"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 max-w-md">
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
          </div>
        </div>
      </motion.section>

      {/* Strength Training Collection */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-gray-900"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={strengthHero} alt="Strength Training" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-gray-900/60 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div></div>
            <motion.div
              className="text-left"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-white/10 backdrop-blur-sm text-white border-white/20">
                STRENGTH TRAINING
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Built<br />for Power
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Durable fabrics with enhanced flexibility designed to support every lift, press, and pull
              </p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Enhanced Mobility</h4>
                    <p className="text-white/70">Four-way stretch for unrestricted movement</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Reinforced Seams</h4>
                    <p className="text-white/70">Built to withstand intense training sessions</p>
                  </div>
                </div>
              </div>

              <Link href="/shop-clean?category=strength">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-strength"
                >
                  Shop Strength
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* High-Intensity Training Collection */}
      <motion.section 
        className="relative min-h-screen flex items-center overflow-hidden bg-black"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-200px" }}
        variants={fadeIn}
      >
        <div className="absolute inset-0">
          <img src={hiitHero} alt="HIIT Training" className="w-full h-full object-cover opacity-60" />
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
                HIGH-INTENSITY TRAINING
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Maximum<br />Performance
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Advanced moisture management and compression technology for demanding workouts
              </p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Quick-Dry Technology</h4>
                    <p className="text-white/70">Keeps you dry during intense intervals</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Precision Fit</h4>
                    <p className="text-white/70">Compression zones for optimal support</p>
                  </div>
                </div>
              </div>

              <Link href="/shop-clean?category=hiit">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-base px-8"
                  data-testid="button-shop-hiit"
                >
                  Shop HIIT
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {trainingProducts[1] && (
              <motion.div
                className="lg:ml-auto"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 max-w-md">
                  <ProductCardClean
                    id={trainingProducts[1].id}
                    name={trainingProducts[1].name}
                    price={parseFloat(trainingProducts[1].retailPrice)}
                    image={trainingProducts[1].imageUrl || ''}
                    sizes={['XS', 'S', 'M', 'L', 'XL']}
                    colors={['Black', 'White', 'Navy', 'Grey']}
                    isWishlisted={isInWishlist(trainingProducts[1].id)}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
