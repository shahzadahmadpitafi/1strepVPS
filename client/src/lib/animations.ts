import { Variants } from "framer-motion";

// Animation duration constants
export const DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

// Easing curves
export const EASING = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  spring: { type: "spring", stiffness: 300, damping: 30 },
  softSpring: { type: "spring", stiffness: 100, damping: 20 },
} as const;

// Page transition animations
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    }
  },
};

// Fade in animation
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    }
  },
};

// Slide in from bottom
export const slideInFromBottom: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.easeOut,
    }
  },
};

// Slide in from right
export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: 40 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    x: 40,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    }
  },
};

// Slide in from left
export const slideInFromLeft: Variants = {
  initial: { opacity: 0, x: -40 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    x: -40,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    }
  },
};

// Scale animation
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    }
  },
};

// Stagger container
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  },
};

// Stagger item
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
};

// Card hover animation
export const cardHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeOut,
    }
  },
};

// Button tap animation
export const buttonTap = {
  scale: 0.98,
  transition: {
    duration: 0.1,
  }
};

// Modal/Dialog animation
export const modalAnimation: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    }
  },
};

// Backdrop animation
export const backdropAnimation: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: DURATION.fast,
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: DURATION.fast,
    }
  },
};

// Number counter animation (for stats)
export const counterAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.easeOut,
    }
  },
};

// Drawer animation (for mobile menus)
export const drawerAnimation: Variants = {
  initial: { x: "100%" },
  animate: { 
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  },
  exit: { 
    x: "100%",
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    }
  },
};

// List item animation (for lists that appear one by one)
export const listItemAnimation: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: (i: number) => ({ 
    opacity: 1, 
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: DURATION.normal,
      ease: EASING.easeOut,
    }
  }),
};

/**
 * Utility function to make animations respect prefers-reduced-motion
 * @param variants - The animation variants to apply
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns Modified variants with instant transitions if reduced motion is preferred
 */
export const applyReducedMotion = <T extends Variants>(
  variants: T, 
  prefersReducedMotion: boolean
): T => {
  if (!prefersReducedMotion) return variants;

  // Create new variants object with instant transitions
  const reducedVariants: any = {};
  
  for (const key in variants) {
    const variant = variants[key];
    if (typeof variant === 'object' && variant !== null) {
      reducedVariants[key] = {
        ...variant,
        transition: { duration: 0 }
      };
      
      // Remove transform properties for reduced motion
      if ('y' in variant || 'x' in variant || 'scale' in variant) {
        reducedVariants[key] = {
          opacity: (variant as any).opacity ?? 1,
          transition: { duration: 0 }
        };
      }
    } else {
      reducedVariants[key] = variant;
    }
  }
  
  return reducedVariants as T;
};
