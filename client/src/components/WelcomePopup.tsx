import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLocation } from "wouter";

type PopupMessage = {
  id: string;
  title: string;
  content: string;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  buttonColor: string | null;
  isActive: boolean;
  showOnce: boolean;
  displayDelay: number | null;
  targetPages: string[] | null;
};

function getCurrentPageType(path: string): string {
  if (path === "/" || path === "") return "homepage";
  if (path.startsWith("/products") || path.startsWith("/product/")) return "products";
  if (path.startsWith("/cart")) return "cart";
  if (path.startsWith("/checkout")) return "checkout";
  if (path.startsWith("/account") || path.startsWith("/profile")) return "account";
  if (path.startsWith("/wishlist")) return "wishlist";
  return "other";
}

const POPUP_DISMISSED_KEY = "1strep_popup_dismissed";

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const { data: popup } = useQuery<PopupMessage | null>({
    queryKey: ["/api/popup-message"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!popup) return;

    const targetPages = popup.targetPages || ["all"];
    const currentPage = getCurrentPageType(location);
    
    if (!targetPages.includes("all") && !targetPages.includes(currentPage)) {
      return;
    }

    if (popup.showOnce) {
      const dismissed = sessionStorage.getItem(POPUP_DISMISSED_KEY);
      if (dismissed === popup.id) {
        return;
      }
    }

    const delay = popup.displayDelay || 1000;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [popup, location]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (popup?.showOnce) {
      sessionStorage.setItem(POPUP_DISMISSED_KEY, popup.id);
    }
  };

  const handleButtonClick = () => {
    handleDismiss();
    if (popup?.buttonLink) {
      if (popup.buttonLink.startsWith("http")) {
        window.open(popup.buttonLink, "_blank");
      } else {
        setLocation(popup.buttonLink);
      }
    }
  };

  if (!popup) return null;

  const bgColor = popup.backgroundColor || "#1a1a2e";
  const textColor = popup.textColor || "#ffffff";
  const btnColor = popup.buttonColor || "#3b82f6";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent 
        className="p-0 border-0 overflow-hidden max-w-md"
        style={{ backgroundColor: bgColor }}
      >
        <DialogTitle className="sr-only">{popup.title}</DialogTitle>
        <DialogDescription className="sr-only">{popup.content}</DialogDescription>
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 transition-colors z-10"
          style={{ 
            backgroundColor: `${textColor}20`,
            color: textColor 
          }}
          aria-label="Close popup"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.imageUrl && (
          <div className="w-full h-40 overflow-hidden">
            <img 
              src={popup.imageUrl} 
              alt={popup.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <h2 
            className="text-xl font-bold mb-3"
            style={{ color: textColor }}
          >
            {popup.title}
          </h2>
          
          <p 
            className="text-sm mb-6 whitespace-pre-wrap"
            style={{ color: `${textColor}cc` }}
          >
            {popup.content}
          </p>

          <div className="flex gap-3">
            <Button
              onClick={handleButtonClick}
              className="flex-1"
              style={{ 
                backgroundColor: btnColor,
                color: "#ffffff"
              }}
            >
              {popup.buttonText || "Got it"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
