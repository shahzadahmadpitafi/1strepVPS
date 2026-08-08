export type ImageSpecType = 
  | 'product-main'
  | 'product-hover'
  | 'hero-desktop'
  | 'hero-mobile'
  | 'category'
  | 'lifestyle'
  | 'carousel'
  | 'cart-thumbnail'
  | 'search-thumbnail'
  | 'logo';

export interface ImageSpec {
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  maxFileSize: number; // in bytes
  formats: string[];
  description: string;
}

export const imageSpecs: Record<ImageSpecType, ImageSpec> = {
  'product-main': {
    name: 'Product (Main)',
    aspectRatio: '2:3',
    width: 800,
    height: 1200,
    maxFileSize: 500 * 1024, // 500KB
    formats: ['jpg', 'jpeg', 'png', 'webp'],
    description: 'Main product image for product detail pages and cards'
  },
  'product-hover': {
    name: 'Product (Hover)',
    aspectRatio: '2:3',
    width: 800,
    height: 1200,
    maxFileSize: 500 * 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp'],
    description: 'Secondary product image shown on hover'
  },
  'hero-desktop': {
    name: 'Hero Image (Desktop)',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    maxFileSize: 300 * 1024,
    formats: ['jpg', 'jpeg', 'webp'],
    description: 'Hero section background image for desktop'
  },
  'hero-mobile': {
    name: 'Hero Image (Mobile)',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    maxFileSize: 300 * 1024,
    formats: ['jpg', 'jpeg', 'webp'],
    description: 'Hero section background image for mobile'
  },
  'category': {
    name: 'Category Card',
    aspectRatio: '1:1',
    width: 800,
    height: 800,
    maxFileSize: 200 * 1024,
    formats: ['jpg', 'jpeg', 'png', 'webp'],
    description: 'Category navigation card images'
  },
  'lifestyle': {
    name: 'Lifestyle/Editorial',
    aspectRatio: '16:9',
    width: 1600,
    height: 900,
    maxFileSize: 400 * 1024,
    formats: ['jpg', 'jpeg', 'webp'],
    description: 'Editorial and lifestyle section backgrounds'
  },
  'carousel': {
    name: 'Carousel Product',
    aspectRatio: '3:2',
    width: 480,
    height: 320,
    maxFileSize: 100 * 1024,
    formats: ['jpg', 'jpeg', 'webp'],
    description: 'Homepage carousel product images'
  },
  'cart-thumbnail': {
    name: 'Cart Thumbnail',
    aspectRatio: '1:1',
    width: 96,
    height: 96,
    maxFileSize: 30 * 1024,
    formats: ['jpg', 'jpeg', 'webp'],
    description: 'Shopping cart item thumbnails'
  },
  'search-thumbnail': {
    name: 'Search Thumbnail',
    aspectRatio: '1:1',
    width: 64,
    height: 64,
    maxFileSize: 20 * 1024,
    formats: ['jpg', 'jpeg', 'webp'],
    description: 'Search result thumbnails'
  },
  'logo': {
    name: 'Logo',
    aspectRatio: 'flexible',
    width: 300,
    height: 100,
    maxFileSize: 50 * 1024,
    formats: ['svg', 'png'],
    description: 'Brand logo (SVG preferred)'
  }
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    originalWidth: number;
    originalHeight: number;
    originalSize: number;
    format: string;
    aspectRatio: string;
  };
  suggestions?: {
    shouldCompress: boolean;
    shouldResize: boolean;
    targetWidth?: number;
    targetHeight?: number;
  };
}

export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

export function validateImageDimensions(
  width: number,
  height: number,
  spec: ImageSpec
): { valid: boolean; message?: string; isUndersized?: boolean; isOversized?: boolean } {
  const actualAspectRatio = calculateAspectRatio(width, height);
  
  if (spec.aspectRatio === 'flexible') {
    // For flexible specs (like logos), still check if dimensions are reasonable
    const maxWidth = spec.width * 1.5;
    const maxHeight = spec.height * 1.5;
    const minWidth = spec.width * 0.5;
    const minHeight = spec.height * 0.5;

    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        message: `Image is too small. Minimum recommended: ${Math.round(minWidth)}×${Math.round(minHeight)}px, Got: ${width}×${height}px`,
        isUndersized: true
      };
    }

    if (width > maxWidth || height > maxHeight) {
      return {
        valid: false,
        message: `Image is too large. Maximum recommended: ${Math.round(maxWidth)}×${Math.round(maxHeight)}px, Got: ${width}×${height}px`,
        isOversized: true
      };
    }

    return { valid: true };
  }

  // Check aspect ratio (allow 2% tolerance)
  const [expectedWidth, expectedHeight] = spec.aspectRatio.split(':').map(Number);
  const expectedRatio = expectedWidth / expectedHeight;
  const actualRatio = width / height;
  const tolerance = 0.02;

  if (Math.abs(expectedRatio - actualRatio) > tolerance) {
    return {
      valid: false,
      message: `Aspect ratio mismatch. Expected ${spec.aspectRatio}, got ${actualAspectRatio}`
    };
  }

  // Check if image is too small (strict requirement)
  const minWidth = spec.width * 0.9; // Allow 10% smaller
  const minHeight = spec.height * 0.9;

  if (width < minWidth || height < minHeight) {
    return {
      valid: false,
      message: `Image is too small. Required: at least ${Math.round(minWidth)}×${Math.round(minHeight)}px, Got: ${width}×${height}px`,
      isUndersized: true
    };
  }

  // Check if image is excessively oversized (2.5x the spec = error)
  const maxWidth = spec.width * 2.5;
  const maxHeight = spec.height * 2.5;

  if (width > maxWidth || height > maxHeight) {
    return {
      valid: false,
      message: `Image is excessively large. Maximum: ${Math.round(maxWidth)}×${Math.round(maxHeight)}px, Got: ${width}×${height}px. Please resize before uploading.`,
      isOversized: true
    };
  }

  return { valid: true };
}
