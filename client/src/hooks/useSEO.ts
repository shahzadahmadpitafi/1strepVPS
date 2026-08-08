import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  productData?: {
    name: string;
    price: string;
    currency?: string;
    availability?: string;
    image?: string;
    description?: string;
    sku?: string;
    brand?: string;
  };
}

const SITE_NAME = '1stRep';
const PRODUCTION_DOMAIN = 'https://1strep.com';
const DEFAULT_DESCRIPTION = 'Premium fitness apparel designed for performance, comfort and style. Free UK shipping on orders over £50.';
const DEFAULT_IMAGE = '/og-image.jpg';

export function useSEO({
  title,
  description,
  image,
  url,
  type = 'website',
  productData,
}: SEOProps) {
  useEffect(() => {
    // Build page title - avoid duplication if title already contains site name
    let pageTitle: string;
    if (!title) {
      pageTitle = `${SITE_NAME} | Premium Fitness Apparel UK`;
    } else if (title.includes(SITE_NAME)) {
      pageTitle = title;
    } else {
      pageTitle = `${title} | ${SITE_NAME}`;
    }
    
    const pageDescription = description || DEFAULT_DESCRIPTION;
    const pageImage = image || DEFAULT_IMAGE;
    // Always use production domain for canonical URLs to avoid dev hostnames
    const pageUrl = url || `${PRODUCTION_DOMAIN}${window.location.pathname}`;
    
    document.title = pageTitle;
    
    const updateMetaTag = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };
    
    updateMetaTag('meta[name="description"]', pageDescription);
    updateMetaTag('meta[property="og:title"]', pageTitle);
    updateMetaTag('meta[property="og:description"]', pageDescription);
    updateMetaTag('meta[property="og:image"]', pageImage);
    updateMetaTag('meta[property="og:url"]', pageUrl);
    updateMetaTag('meta[property="og:type"]', type);
    updateMetaTag('meta[name="twitter:title"]', pageTitle);
    updateMetaTag('meta[name="twitter:description"]', pageDescription);
    updateMetaTag('meta[name="twitter:image"]', pageImage);
    updateMetaTag('meta[name="twitter:url"]', pageUrl);
    
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', pageUrl);
    }
    
    const existingProductSchema = document.querySelector('script[data-schema="product"]');
    if (existingProductSchema) {
      existingProductSchema.remove();
    }
    
    if (productData && type === 'product') {
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productData.name,
        description: productData.description || pageDescription,
        image: productData.image || pageImage,
        sku: productData.sku,
        brand: {
          '@type': 'Brand',
          name: productData.brand || '1stRep',
        },
        offers: {
          '@type': 'Offer',
          price: productData.price,
          priceCurrency: productData.currency || 'GBP',
          availability: productData.availability === 'available' 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
          url: pageUrl,
        },
      };
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema', 'product');
      script.textContent = JSON.stringify(productSchema);
      document.head.appendChild(script);
    }
    
    return () => {
      const productSchemaScript = document.querySelector('script[data-schema="product"]');
      if (productSchemaScript) {
        productSchemaScript.remove();
      }
    };
  }, [title, description, image, url, type, productData]);
}
