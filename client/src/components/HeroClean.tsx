import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { convertToDirectUrl } from '@/lib/imageUtils';

interface HeroCleanProps {
  image?: string;
  video?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  onCtaClick?: () => void;
  onVideoEnd?: () => void;
  slideDuration?: number;
}

// Check if URL is a YouTube video and extract video ID
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

const slideVariants = [
  {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
  {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  {
    initial: { scale: 1.3, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  {
    initial: { scale: 0.8, opacity: 0, rotate: -5 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    exit: { scale: 1.2, opacity: 0, rotate: 5 },
  },
  {
    initial: { x: '50%', y: '50%', opacity: 0, scale: 0.5 },
    animate: { x: 0, y: 0, opacity: 1, scale: 1 },
    exit: { x: '-50%', y: '-50%', opacity: 0, scale: 0.5 },
  },
];

const kenBurnsVariants = {
  initial: { scale: 1 },
  animate: { 
    scale: 1.1,
    transition: { 
      duration: 10, 
      ease: "linear",
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }
};

export default function HeroClean({ image, video, title, subtitle, onVideoEnd, slideDuration = 6 }: HeroCleanProps) {
  const [currentMedia, setCurrentMedia] = useState<{type: 'video' | 'image', src: string, key: number} | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [animationVariant, setAnimationVariant] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentSrc = video || image;
  const currentType = video ? 'video' : 'image';

  // Dynamically preload hero image for faster display
  useEffect(() => {
    if (!image) return;
    
    const processedImageSrc = convertToDirectUrl(image);
    
    // Check if preload link already exists
    const existingPreload = document.querySelector(`link[rel="preload"][href="${processedImageSrc}"]`);
    if (existingPreload) return;
    
    // Create and inject preload link for the hero image
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = processedImageSrc;
    preloadLink.setAttribute('fetchpriority', 'high');
    document.head.appendChild(preloadLink);
    
    // Also preload via Image object for immediate browser cache
    const img = new Image();
    img.src = processedImageSrc;
    
    return () => {
      // Clean up preload link when component unmounts or image changes
      if (preloadLink.parentNode) {
        preloadLink.parentNode.removeChild(preloadLink);
      }
    };
  }, [image]);

  useEffect(() => {
    if (!currentSrc) return;
    
    // Convert both images and videos (Dropbox/Google Drive URLs need conversion)
    const processedSrc = convertToDirectUrl(currentSrc);
    
    if (!currentMedia || processedSrc !== currentMedia.src) {
      // Reset all ready states when media changes
      setIsVideoReady(false);
      setIsYouTubeReady(false);
      setIsImageLoaded(false);
      setAnimationVariant(prev => (prev + 1) % slideVariants.length);
      setCurrentMedia({ 
        type: currentType as 'video' | 'image', 
        src: processedSrc,
        key: Date.now()
      });
      setSlideIndex(prev => prev + 1);
    }
  }, [currentSrc, currentType]);

  // Handle video canplaythrough event - play only when ready
  const handleVideoCanPlay = useCallback(() => {
    setIsVideoReady(true);
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Video play failed:', err));
    }
  }, []);

  // Handle YouTube iframe load
  const handleYouTubeLoad = useCallback(() => {
    // Small delay to ensure YouTube player is fully initialized
    setTimeout(() => {
      setIsYouTubeReady(true);
    }, 500);
  }, []);

  const handleVideoEnd = useCallback(() => {
    if (onVideoEnd) {
      onVideoEnd();
    }
  }, [onVideoEnd]);

  useEffect(() => {
    if (!onVideoEnd) return;

    const durationMs = slideDuration * 1000;
    const interval = setInterval(() => {
      handleVideoEnd();
    }, durationMs);

    return () => {
      clearInterval(interval);
    };
  }, [handleVideoEnd, slideDuration]);

  const currentVariant = slideVariants[animationVariant];

  return (
    <section 
      className="relative w-full max-w-full overflow-hidden" 
      style={{ 
        backgroundColor: '#3a4a3a',
        aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : '16/9',
        minHeight: 'clamp(380px, 50vw, 600px)',
      }} 
      data-testid="section-hero-clean"
    >
      <AnimatePresence mode="wait">
        {currentMedia && (
          <motion.div
            key={currentMedia.key}
            initial={currentVariant.initial}
            animate={currentVariant.animate}
            exit={currentVariant.exit}
            transition={{ 
              duration: 0.8, 
              ease: [0.43, 0.13, 0.23, 0.96]
            }}
            className="absolute inset-0"
          >
            {currentMedia.type === 'video' && (
              (() => {
                const youtubeId = getYouTubeVideoId(currentMedia.src);
                if (youtubeId) {
                  return (
                    <>
                      {/* Loading placeholder while YouTube loads */}
                      {!isYouTubeReady && (
                        <div className="absolute inset-0 bg-black flex items-center justify-center">
                          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                      <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={handleYouTubeLoad}
                        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${isYouTubeReady ? 'opacity-100' : 'opacity-0'}`}
                        style={{ 
                          border: 'none',
                          transform: 'scale(1.5)',
                          transformOrigin: 'center center'
                        }}
                      />
                    </>
                  );
                }
                return (
                  <>
                    {/* Loading placeholder while video loads */}
                    {!isVideoReady && (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      muted
                      loop
                      playsInline
                      preload="auto"
                      onCanPlayThrough={handleVideoCanPlay}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <source src={currentMedia.src} type="video/mp4" />
                    </video>
                  </>
                );
              })()
            )}
            {currentMedia.type === 'image' && (
              <>
                {/* Loading skeleton while image loads - matches hero image background */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: '#3a4a3a' }} />
                )}
                <motion.img
                  src={currentMedia.src}
                  alt="Hero background"
                  loading={isFirstLoad ? "eager" : "lazy"}
                  decoding={isFirstLoad ? "sync" : "async"}
                  {...(isFirstLoad ? { fetchpriority: "high" } : {})}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                      setImageAspectRatio(img.naturalWidth / img.naturalHeight);
                    }
                    setIsImageLoaded(true);
                    if (isFirstLoad) {
                      setIsFirstLoad(false);
                    }
                  }}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  initial={{ scale: 1.05 }}
                  animate={{ 
                    scale: 1, 
                    transition: { duration: 0.6, ease: "easeOut" }
                  }}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20 z-20"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      
      <div className="relative h-full flex items-end justify-center text-center px-4 sm:px-6 pb-2 sm:pb-16 z-40">
        <div className="max-w-3xl w-full">
          <AnimatePresence mode="wait">
            <motion.div 
              key={slideIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center gap-2 sm:gap-3"
            >
              <Link href="/shop-clean?gender=men">
                <Button 
                  size="sm"
                  className="bg-white/10 backdrop-blur-md text-white border-2 border-white/20 hover:bg-white/20 text-xs sm:text-sm px-4 sm:px-6 h-8 sm:h-10"
                  data-testid="button-hero-men"
                >
                  Men
                </Button>
              </Link>
              <Link href="/shop-clean?gender=women">
                <Button 
                  size="sm"
                  className="bg-white/10 backdrop-blur-md text-white border-2 border-white/20 hover:bg-white/20 text-xs sm:text-sm px-4 sm:px-6 h-8 sm:h-10"
                  data-testid="button-hero-women"
                >
                  Women
                </Button>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
