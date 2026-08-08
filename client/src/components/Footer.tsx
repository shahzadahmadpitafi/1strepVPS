import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Twitter, Youtube, Mail, Loader2, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/newsletter/subscribe", { email, source: "footer" });
      return response.json();
    },
    onSuccess: (data) => {
      setSubscribed(true);
      setEmail("");
      toast({
        title: "Welcome to the 1stRep family!",
        description: data.message || "You've successfully subscribed to our newsletter.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again or check if you're already subscribed.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    subscribeMutation.mutate(email);
  };
  const footerSections = [
    {
      title: "Shop",
      links: [
        { label: "Men", href: "/shop-clean?gender=men" },
        { label: "Women", href: "/shop-clean?gender=women" },
        { label: "Accessories", href: "/shop-clean?category=Accessories" },
        { label: "T-Shirts", href: "/shop-clean?category=T-Shirts" },
        { label: "Hoodies", href: "/shop-clean?category=Hoodies%20and%20Jumpers" },
        { label: "Vests", href: "/shop-clean?category=Vests%20%26%20Crop%20Tops" },
        { label: "Bottoms & Leggings", href: "/shop-clean?category=Leggings" }
      ]
    },
    {
      title: "Customer Care",
      links: [
        { label: "Size Guide", href: "/size-guide" },
        { label: "Shipping & Returns", href: "/shipping-returns" },
        { label: "Order Tracking", href: "/order-tracking" },
        { label: "Request a Return", href: "/returns" },
        { label: "Leave Feedback", href: "/feedback" },
        { label: "Contact Support", href: "/contact-support" },
        { label: "FAQ", href: "/faq" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Sustainability", href: "/sustainability" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" },
        { label: "Reseller Portal", href: "/reseller/login" }
      ]
    },
    {
      title: "Connect",
      links: [
        { label: "Store Locator", href: "/store-locator" },
        { label: "Influencer Programme", href: "/athletes" },
        { label: "Community", href: "/community" },
        { label: "Events", href: "/events" },
        { label: "Blog", href: "/blog" }
      ]
    }
  ];

  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/1strep_/", label: "Instagram" },
    { icon: Facebook, href: "https://facebook.com/1strep", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/1strep", label: "Twitter" },
    { icon: Youtube, href: "https://youtube.com/1strep", label: "YouTube" }
  ];

  return (
    <footer className="bg-black border-t border-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-gray-900">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4" data-testid="newsletter-title">
              Stay in the Loop
            </h3>
            <p className="text-muted-foreground mb-6" data-testid="newsletter-subtitle">
              Get early access to new collections, exclusive offers, and training tips from our athletes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              {subscribed ? (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span>Thanks for subscribing!</span>
                </div>
              ) : (
                <>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                    disabled={subscribeMutation.isPending}
                    data-testid="input-newsletter-email"
                  />
                  <Button 
                    onClick={handleSubscribe}
                    disabled={subscribeMutation.isPending}
                    data-testid="button-newsletter-signup"
                  >
                    {subscribeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section - Full width on mobile, centered */}
            <div className="col-span-2 md:col-span-2 lg:col-span-1 text-center lg:text-left">
              <Link href="/" className="inline-block">
                <img 
                  src="/1strep-header-logo.png" 
                  alt="1stRep" 
                  className="h-20 md:h-32 w-auto mb-4 mx-auto lg:mx-0 cursor-pointer" 
                  data-testid="footer-logo"
                />
              </Link>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto lg:mx-0" data-testid="footer-brand-description">
                It all starts with your 1st Rep. Performance range designed for athletes who never settle for ordinary.
              </p>
              
              {/* Social Links */}
              <div className="flex justify-center lg:justify-start space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover-elevate inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors"
                    data-testid={`social-${social.label.toLowerCase()}`}
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links - 2 columns on mobile, centered text */}
            {footerSections.map((section) => (
              <div key={section.title} className="text-center md:text-left">
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider" data-testid={`footer-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                        data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col items-center md:items-start space-y-2">
              <div className="text-sm text-muted-foreground" data-testid="footer-copyright">
                © 2025 1stRep. All rights reserved.
              </div>
              <div className="text-xs text-muted-foreground" data-testid="footer-attribution">
                Built by{' '}
                <a 
                  href="https://qanzakglobal.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors font-semibold"
                  data-testid="link-qanzakglobal"
                >
                  Qanzak Global
                </a>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="/privacy-policy" className="hover:text-foreground transition-colors" data-testid="footer-privacy">
                Privacy Policy
              </a>
              <a href="/shipping-returns" className="hover:text-foreground transition-colors" data-testid="footer-terms">
                Terms of Service
              </a>
              <a href="/cookie-policy" className="hover:text-foreground transition-colors" data-testid="footer-cookies">
                Cookie Policy
              </a>
              <a href="/contact-support" className="hover:text-foreground transition-colors" data-testid="footer-accessibility">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}