import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface BodyVisualiserProps {
  productImageUrl?: string;
  productName: string;
  selectedSize: string;
  userProfile: {
    height: number | null;
    weight: number | null;
    bodyType: "slim" | "athletic" | "average" | "curvy";
    fitPreference: "tight" | "regular" | "loose";
  };
  category: string;
}

const BODY_CONFIGS = {
  slim: { shoulderWidth: 0.85, chestWidth: 0.82, waistWidth: 0.75, hipWidth: 0.80 },
  athletic: { shoulderWidth: 1.0, chestWidth: 0.95, waistWidth: 0.80, hipWidth: 0.88 },
  average: { shoulderWidth: 0.92, chestWidth: 0.90, waistWidth: 0.88, hipWidth: 0.92 },
  curvy: { shoulderWidth: 0.88, chestWidth: 0.95, waistWidth: 0.85, hipWidth: 1.0 },
};

const SIZE_SCALES: Record<string, number> = {
  XS: 0.88,
  S: 0.94,
  M: 1.0,
  L: 1.06,
  XL: 1.12,
  XXL: 1.18,
};

export function BodyVisualiser({
  productImageUrl,
  productName,
  selectedSize,
  userProfile,
  category,
}: BodyVisualiserProps) {
  const [view, setView] = useState<"front" | "side">("front");
  const [showOverlay, setShowOverlay] = useState(true);

  const bodyConfig = BODY_CONFIGS[userProfile.bodyType] || BODY_CONFIGS.average;
  const sizeScale = SIZE_SCALES[selectedSize] || 1.0;
  
  const heightScale = userProfile.height ? Math.min(1.15, Math.max(0.85, userProfile.height / 175)) : 1;

  const isTop = category.toLowerCase().includes("t-shirt") || 
                category.toLowerCase().includes("top") ||
                category.toLowerCase().includes("vest") ||
                category.toLowerCase().includes("hoodie") ||
                category.toLowerCase().includes("jacket");
                
  const isBottom = category.toLowerCase().includes("legging") ||
                   category.toLowerCase().includes("bottom") ||
                   category.toLowerCase().includes("short") ||
                   category.toLowerCase().includes("pant");

  const getGarmentPosition = () => {
    if (isTop) {
      return { top: "18%", height: "35%" };
    } else if (isBottom) {
      return { top: "45%", height: "40%" };
    }
    return { top: "20%", height: "50%" };
  };

  const garmentPos = getGarmentPosition();

  const renderBodySilhouette = () => {
    const sw = bodyConfig.shoulderWidth * 100;
    const cw = bodyConfig.chestWidth * 100;
    const ww = bodyConfig.waistWidth * 100;
    const hw = bodyConfig.hipWidth * 100;

    if (view === "front") {
      return (
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full"
          style={{ transform: `scaleY(${heightScale})` }}
        >
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
              <stop offset="50%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="skinTone" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          <ellipse cx="100" cy="35" rx="22" ry="28" fill="url(#skinTone)" />
          
          <ellipse cx="100" cy="50" rx="8" ry="12" fill="url(#skinTone)" />
          
          <path
            d={`
              M ${100 - sw/2} 65
              Q ${100 - sw/2 - 15} 80, ${100 - sw/2 - 20} 140
              L ${100 - sw/2 - 18} 145
              Q ${100 - sw/2 - 10} 148, ${100 - sw/2} 145
              L ${100 - ww/2 - 5} 145
              L ${100 - ww/2} 180
              L ${100 - hw/2} 200
              L ${100 - hw/2 - 5} 320
              L ${100 - 12} 320
              L ${100 - 8} 380
              L ${100 - 18} 390
              L ${100 + 18} 390
              L ${100 + 8} 380
              L ${100 + 12} 320
              L ${100 + hw/2 + 5} 320
              L ${100 + hw/2} 200
              L ${100 + ww/2} 180
              L ${100 + ww/2 + 5} 145
              L ${100 + sw/2} 145
              Q ${100 + sw/2 + 10} 148, ${100 + sw/2 + 18} 145
              L ${100 + sw/2 + 20} 140
              Q ${100 + sw/2 + 15} 80, ${100 + sw/2} 65
              Q 100 58, ${100 - sw/2} 65
            `}
            fill="url(#bodyGradient)"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 200 400"
        className="w-full h-full"
        style={{ transform: `scaleY(${heightScale})` }}
      >
        <defs>
          <linearGradient id="sideBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        
        <ellipse cx="100" cy="35" rx="18" ry="28" fill="url(#skinTone)" />
        
        <path
          d={`
            M 85 60
            Q 75 70, 70 100
            Q 68 130, 72 160
            Q 75 190, 78 220
            Q 80 280, 82 320
            L 78 380
            L 90 390
            L 110 390
            L 106 380
            L 108 320
            Q 110 280, 112 220
            Q 118 190, 120 160
            Q 125 130, 122 100
            Q 118 70, 108 60
            Q 100 55, 85 60
          `}
          fill="url(#sideBodyGradient)"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        
        <path
          d={`
            M 70 80
            Q 50 90, 40 140
            L 45 145
            Q 55 142, 70 130
          `}
          fill="url(#sideBodyGradient)"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
      </svg>
    );
  };

  return (
    <div className="relative bg-gradient-to-b from-muted/20 to-muted/40 rounded-lg overflow-hidden" style={{ height: "320px" }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: "180px", height: "300px" }}>
          {renderBodySilhouette()}
          
          {showOverlay && productImageUrl && (
            <div
              className="absolute left-1/2 transition-all duration-300"
              style={{
                top: garmentPos.top,
                height: garmentPos.height,
                width: `${60 * sizeScale * bodyConfig.chestWidth}%`,
                transform: `translateX(-50%) scaleY(${heightScale}) ${view === "side" ? "perspective(200px) rotateY(-25deg)" : ""}`,
                transformOrigin: "center top",
              }}
            >
              <img
                src={productImageUrl}
                alt={productName}
                className="w-full h-full object-contain drop-shadow-lg"
                style={{
                  filter: view === "side" ? "brightness(0.95)" : "none",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-3 right-3">
        <Badge variant="secondary" className="shadow-sm">
          Size {selectedSize}
        </Badge>
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setView(view === "front" ? "side" : "front")}
          className="shadow-sm gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          {view === "front" ? "Side View" : "Front View"}
        </Button>
        <Button
          variant={showOverlay ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowOverlay(!showOverlay)}
          className="shadow-sm"
        >
          {showOverlay ? "Hide Product" : "Show Product"}
        </Button>
      </div>

      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {userProfile.bodyType.charAt(0).toUpperCase() + userProfile.bodyType.slice(1)} build
        {userProfile.height && ` • ${userProfile.height}cm`}
      </div>
    </div>
  );
}
