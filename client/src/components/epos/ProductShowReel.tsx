import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertToDirectUrl } from "@/lib/imageUtils";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  category?: string;
  images?: string[];
}

interface ProductShowReelProps {
  products: Product[];
  storeName?: string;
  intervalSeconds?: number;
  onClose: () => void;
}

export default function ProductShowReel({
  products,
  storeName = "1stRep",
  intervalSeconds = 8,
  onClose,
}: ProductShowReelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const lastTickRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  const currentProduct = products[currentIndex];

  const goToNext = useCallback(() => {
    accumulatedRef.current = 0;
    lastTickRef.current = Date.now();
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % products.length);
  }, [products.length]);

  const goToPrevious = useCallback(() => {
    accumulatedRef.current = 0;
    lastTickRef.current = Date.now();
    setProgress(0);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  }, [products.length]);

  // Request Wake Lock to prevent screen from sleeping (keeps show reel running indefinitely)
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock acquired - Show Reel will run indefinitely');
          
          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake Lock released');
          });
        }
      } catch (err) {
        console.log('Wake Lock not available:', err);
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  // Main slideshow timer — time-based, no state setters inside updaters
  useEffect(() => {
    if (!isPlaying || products.length === 0) return;

    const intervalMs = intervalSeconds * 1000;

    lastTickRef.current = Date.now();
    accumulatedRef.current = 0;

    const progressInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      // Skip anomalous ticks (browser was heavily suspended)
      if (elapsed > 2000) return;

      accumulatedRef.current += elapsed;

      if (accumulatedRef.current >= intervalMs) {
        accumulatedRef.current = 0;
        setProgress(0);
        setCurrentIndex((prev) => (prev + 1) % products.length);
      } else {
        const pct = (accumulatedRef.current / intervalMs) * 100;
        setProgress(pct);
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, [isPlaying, products.length, intervalSeconds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToNext, goToPrevious]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-2xl">No products to display</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden cursor-none"
      onClick={() => setShowControls(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProduct.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          {currentProduct.imageUrl ? (
            <img
              src={convertToDirectUrl(currentProduct.imageUrl)}
              alt={currentProduct.name}
              className="w-full h-full object-cover"
              style={{ 
                filter: "brightness(0.7)",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/1920x1080/1a1a1a/666666?text=Product";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <Tag className="w-48 h-48 text-gray-700" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

      <motion.div 
        className="absolute top-8 left-8 xl:top-12 xl:left-12 2xl:top-16 2xl:left-16 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <img 
          src="/1strep-header-logo.png" 
          alt="1stRep" 
          className="h-12 lg:h-16 xl:h-20 2xl:h-28 w-auto drop-shadow-2xl"
        />
      </motion.div>

      <motion.div
        className={`absolute top-8 right-8 xl:top-12 xl:right-12 z-30 flex items-center gap-3 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
          className="w-12 h-12 xl:w-14 xl:h-14 rounded-full text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
        >
          {isPlaying ? <Pause className="w-5 h-5 xl:w-6 xl:h-6" /> : <Play className="w-5 h-5 xl:w-6 xl:h-6" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-12 h-12 xl:w-14 xl:h-14 rounded-full text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20"
        >
          <X className="w-6 h-6 xl:w-7 xl:h-7" />
        </Button>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="px-8 pb-8 xl:px-16 xl:pb-12 2xl:px-24 2xl:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProduct.id + "-content"}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-4xl 2xl:max-w-6xl"
            >
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-[10rem] font-black text-white leading-none mb-4 xl:mb-6 2xl:mb-10 drop-shadow-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
              >
                {currentProduct.name}
              </motion.h1>

              {currentProduct.description && (
                <motion.p 
                  className="text-lg xl:text-xl 2xl:text-3xl text-gray-300 leading-relaxed max-w-2xl 2xl:max-w-4xl line-clamp-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {currentProduct.description}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 xl:mt-12 2xl:mt-16 flex items-center gap-6 xl:gap-8">
            <div className="flex gap-2 xl:gap-3 2xl:gap-4">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    accumulatedRef.current = 0;
                    lastTickRef.current = Date.now();
                    setCurrentIndex(idx);
                    setProgress(0);
                  }}
                  className={`h-1.5 xl:h-2 2xl:h-3 rounded-full transition-all duration-500 ${
                    idx === currentIndex 
                      ? 'w-12 xl:w-16 2xl:w-24 bg-emerald-500' 
                      : 'w-6 xl:w-8 2xl:w-12 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex-1 max-w-xs xl:max-w-md 2xl:max-w-lg">
              <div className="h-1 xl:h-1.5 2xl:h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent z-30">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}
