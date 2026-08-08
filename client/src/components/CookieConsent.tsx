import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, Cookie, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = "cookie_consent_1strep";
const COOKIE_CONSENT_VERSION = "1.0";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be changed
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      try {
        const consent = JSON.parse(savedConsent);
        if (consent.version === COOKIE_CONSENT_VERSION) {
          setPreferences(consent.preferences);
          // Apply consent preferences
          applyConsent(consent.preferences);
        } else {
          // Version changed, show banner again
          setTimeout(() => setShowBanner(true), 1000);
        }
      } catch (e) {
        setTimeout(() => setShowBanner(true), 1000);
      }
    }
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    // Store in window object so other components can check
    (window as any).cookieConsent = prefs;
    
    // Dispatch event so components can react
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: prefs }));
  };

  const saveConsent = async (prefs: CookiePreferences) => {
    const consentData = {
      version: COOKIE_CONSENT_VERSION,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));

    // Apply consent
    applyConsent(prefs);

    // Try to save to database if user is logged in
    try {
      await apiRequest("POST", "/api/cookie-consent", {
        ...prefs,
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      // Silent fail - localStorage is primary storage
      console.log("Could not save cookie consent to server");
    }

    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("session_id", sessionId);
    }
    return sessionId;
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-300"
      data-testid="cookie-consent-banner"
    >
      <Card className="max-w-4xl mx-auto border-2 shadow-2xl">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              <h2 className="text-lg md:text-xl font-bold">Cookie Settings</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRejectAll}
              className="shrink-0"
              data-testid="button-close-cookie-banner"
              title="Reject all non-essential cookies"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Message */}
          <p className="text-sm text-muted-foreground mb-4">
            We use cookies to enhance your browsing experience, serve personalised content, and analyse our traffic. 
            By clicking "Accept All", you consent to our use of cookies. You can also customise your preferences or reject non-essential cookies.
          </p>

          {/* Detailed Settings */}
          {showDetails && (
            <div className="space-y-3 mb-4 pt-4 border-t">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Strictly Necessary</h3>
                    <span className="text-xs text-muted-foreground">(Always Active)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Essential cookies for website functionality, including your shopping cart, authentication, and checkout process.
                  </p>
                </div>
                <Switch checked={true} disabled={true} />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Analytics & Performance</h3>
                  <p className="text-xs text-muted-foreground">
                    Help us understand how visitors interact with our website to improve your experience.
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                  data-testid="switch-analytics-cookies"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Marketing & Advertising</h3>
                  <p className="text-xs text-muted-foreground">
                    Used to deliver relevant advertisements and track marketing campaign effectiveness.
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                  data-testid="switch-marketing-cookies"
                />
              </div>

              {/* Functional Cookies */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Functional</h3>
                  <p className="text-xs text-muted-foreground">
                    Remember your preferences like language, region, and display settings for a personalised experience.
                  </p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, functional: checked })
                  }
                  data-testid="switch-functional-cookies"
                />
              </div>
            </div>
          )}

          {/* Toggle Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="mb-4 text-xs"
            data-testid="button-toggle-cookie-details"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Manage Preferences
              </>
            )}
          </Button>

          {/* Action Buttons - Equal Prominence */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {showDetails ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleRejectAll}
                  className="flex-1"
                  data-testid="button-reject-all-cookies"
                >
                  Reject All
                </Button>
                <Button
                  variant="default"
                  onClick={handleSavePreferences}
                  className="flex-1"
                  data-testid="button-save-cookie-preferences"
                >
                  Save Preferences
                </Button>
                <Button
                  variant="default"
                  onClick={handleAcceptAll}
                  className="flex-1"
                  data-testid="button-accept-all-cookies"
                >
                  Accept All
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleRejectAll}
                  className="flex-1"
                  data-testid="button-reject-all-cookies"
                >
                  Reject All
                </Button>
                <Button
                  variant="default"
                  onClick={handleAcceptAll}
                  className="flex-1"
                  data-testid="button-accept-all-cookies"
                >
                  Accept All
                </Button>
              </>
            )}
          </div>

          {/* Privacy Policy Link */}
          <p className="text-xs text-center text-muted-foreground mt-3">
            Read our{" "}
            <Link href="/cookie-policy" className="underline hover:text-primary">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline hover:text-primary">
              Privacy Policy
            </Link>{" "}
            for more information.
          </p>
        </div>
      </Card>
    </div>
  );
}

// Export helper function to check if consent is given for a specific category
export function hasCookieConsent(category: keyof CookiePreferences): boolean {
  // Necessary cookies are always allowed
  if (category === "necessary") return true;

  // Check window object first (set by banner)
  if ((window as any).cookieConsent) {
    return (window as any).cookieConsent[category] || false;
  }

  // Check localStorage
  try {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent) {
      const consent = JSON.parse(savedConsent);
      return consent.preferences[category] || false;
    }
  } catch (e) {
    return false;
  }

  return false;
}
