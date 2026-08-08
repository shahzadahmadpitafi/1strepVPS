import { useEffect, useRef } from 'react';

// Helper function to check cookie consent
function hasCookieConsent(category: 'analytics' | 'marketing' | 'functional'): boolean {
  // Necessary cookies are always allowed
  if (category === 'analytics') {
    // Check window object first (set by banner)
    if ((window as any).cookieConsent) {
      return (window as any).cookieConsent.analytics || false;
    }

    // Check localStorage
    try {
      const savedConsent = localStorage.getItem('cookie_consent_1strep');
      if (savedConsent) {
        const consent = JSON.parse(savedConsent);
        return consent.preferences?.analytics || false;
      }
    } catch (e) {
      return false;
    }
  }

  return false;
}

export function useSectionAnalytics(sectionName: string, elementId: string) {
  const hasTrackedView = useRef(false);

  // Track when section comes into view
  useEffect(() => {
    if (hasTrackedView.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView.current) {
            hasTrackedView.current = true;
            trackView(sectionName);
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of section is visible
    );

    const element = document.getElementById(elementId);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [sectionName, elementId]);

  const trackView = async (name: string) => {
    // Only track if user has consented to analytics cookies
    if (!hasCookieConsent('analytics')) {
      return;
    }

    try {
      await fetch('/api/section-analytics/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionName: name }),
      });
    } catch (error) {
      console.error('Failed to track section view:', error);
    }
  };

  const trackClick = async () => {
    // Only track if user has consented to analytics cookies
    if (!hasCookieConsent('analytics')) {
      return;
    }

    try {
      await fetch('/api/section-analytics/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionName }),
      });
    } catch (error) {
      console.error('Failed to track section click:', error);
    }
  };

  return { trackClick };
}
