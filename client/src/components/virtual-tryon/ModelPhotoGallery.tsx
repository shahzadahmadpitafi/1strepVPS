import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ModelPhotoGalleryProps {
  productName: string;
  productColor: string;
  productImageUrl?: string;
  garmentType: "tshirt" | "leggings" | "jacket" | "sportsbra";
  userMeasurements?: {
    heightCm?: number;
    chestCm?: number;
    waistCm?: number;
    hipsCm?: number;
  };
}

interface ModelSize {
  size: string;
  label: string;
  height: string;
  chest: string;
  waist: string;
  hips: string;
  measurements: {
    heightCm: number;
    chestCm: number;
    waistCm: number;
    hipsCm: number;
  };
}

const MODEL_SIZES: ModelSize[] = [
  {
    size: "XS",
    label: "Extra Small",
    height: "165cm",
    chest: "86cm",
    waist: "71cm",
    hips: "91cm",
    measurements: { heightCm: 165, chestCm: 86, waistCm: 71, hipsCm: 91 },
  },
  {
    size: "S",
    label: "Small",
    height: "170cm",
    chest: "91cm",
    waist: "76cm",
    hips: "96cm",
    measurements: { heightCm: 170, chestCm: 91, waistCm: 76, hipsCm: 96 },
  },
  {
    size: "M",
    label: "Medium",
    height: "175cm",
    chest: "96cm",
    waist: "81cm",
    hips: "101cm",
    measurements: { heightCm: 175, chestCm: 96, waistCm: 81, hipsCm: 101 },
  },
  {
    size: "L",
    label: "Large",
    height: "180cm",
    chest: "101cm",
    waist: "86cm",
    hips: "106cm",
    measurements: { heightCm: 180, chestCm: 101, waistCm: 86, hipsCm: 106 },
  },
  {
    size: "XL",
    label: "Extra Large",
    height: "185cm",
    chest: "106cm",
    waist: "91cm",
    hips: "111cm",
    measurements: { heightCm: 185, chestCm: 106, waistCm: 91, hipsCm: 111 },
  },
  {
    size: "XXL",
    label: "2X Large",
    height: "190cm",
    chest: "112cm",
    waist: "97cm",
    hips: "117cm",
    measurements: { heightCm: 190, chestCm: 112, waistCm: 97, hipsCm: 117 },
  },
];

export function ModelPhotoGallery({
  productName,
  productColor,
  productImageUrl,
  garmentType,
  userMeasurements,
}: ModelPhotoGalleryProps) {
  const recommendedSize = getRecommendedSize(userMeasurements);
  const [viewMode, setViewMode] = useState<"comparison" | "single">("comparison");
  const [selectedSize, setSelectedSize] = useState(recommendedSize || "M");

  // Dynamically select 4 sizes for comparison, always including the recommended size
  const sizesToShow = getSizesToCompare(recommendedSize);

  if (viewMode === "single") {
    const currentModel = MODEL_SIZES.find((m) => m.size === selectedSize) || MODEL_SIZES[2];
    
    return (
      <div className="w-full h-full flex flex-col" data-testid="model-photo-gallery">
        {/* Toggle View Mode */}
        <div className="mb-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("comparison")}
            data-testid="button-comparison-view"
          >
            Show Size Comparison
          </Button>
        </div>

        {/* Single Size View */}
        <div className="flex-1 relative bg-gradient-to-br from-muted/30 to-background rounded-lg overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative flex flex-col items-center justify-center text-center max-w-md">
              <div 
                className="relative mb-6 flex items-center justify-center transition-all duration-300"
                style={{
                  transform: `scale(${getSizeScale(currentModel.size)})`,
                }}
              >
                {productImageUrl ? (
                  <div className="relative">
                    <img
                      src={productImageUrl}
                      alt={`${productName} - Size ${currentModel.size}`}
                      className="w-64 h-80 object-cover rounded-lg shadow-lg"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="text-lg font-bold shadow-md">
                        Size {currentModel.size}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-64 h-80 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Badge className="text-lg font-bold">
                        Size {currentModel.size}
                      </Badge>
                      <p className="text-sm text-muted-foreground px-4">
                        {productName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="font-semibold text-base mb-3">Model Measurements (Size {currentModel.size})</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-left">
                  <div>
                    <span className="text-muted-foreground">Height:</span>
                    <span className="ml-2 font-medium">{currentModel.height}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Chest:</span>
                    <span className="ml-2 font-medium">{currentModel.chest}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Waist:</span>
                    <span className="ml-2 font-medium">{currentModel.waist}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hips:</span>
                    <span className="ml-2 font-medium">{currentModel.hips}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Size selector */}
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {MODEL_SIZES.map((model) => (
            <Button
              key={model.size}
              variant={selectedSize === model.size ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSize(model.size)}
              className="min-w-[60px]"
              data-testid={`button-size-${model.size.toLowerCase()}`}
            >
              {model.size}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto" data-testid="model-photo-gallery">
      {/* Header with recommendation */}
      {recommendedSize && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">We recommend Size {recommendedSize}</span>
              <span className="text-muted-foreground ml-2">based on your measurements</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle View Mode */}
      <div className="mb-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode("single")}
          data-testid="button-single-view"
        >
          View Individual Size
        </Button>
      </div>

      {/* Multi-Size Comparison Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {sizesToShow.map((model) => {
            const isRecommended = recommendedSize === model.size;
            const scale = getSizeScale(model.size);
            
            return (
              <Card 
                key={model.size} 
                className={`relative transition-all ${
                  isRecommended 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover-elevate'
                }`}
                data-testid={`size-comparison-${model.size.toLowerCase()}`}
              >
                <CardContent className="p-4 flex flex-col items-center">
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Your Size
                      </Badge>
                    </div>
                  )}

                  {/* Size Label */}
                  <div className="text-center mb-3">
                    <div className="text-lg font-bold">{model.size}</div>
                    <div className="text-xs text-muted-foreground">{model.label}</div>
                  </div>

                  {/* Product Image with Size Scaling */}
                  <div 
                    className="relative mb-3 flex items-center justify-center transition-all duration-300"
                    style={{
                      transform: `scale(${scale})`,
                    }}
                  >
                    {productImageUrl ? (
                      <img
                        src={productImageUrl}
                        alt={`${productName} - Size ${model.size}`}
                        className="w-32 h-40 object-cover rounded-md shadow-md"
                      />
                    ) : (
                      <div className="w-32 h-40 bg-muted rounded-md flex items-center justify-center">
                        <div className="text-center px-2">
                          <p className="text-xs text-muted-foreground">
                            {productName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Model Measurements */}
                  <div className="w-full space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Height:</span>
                      <span className="font-medium">{model.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chest:</span>
                      <span className="font-medium">{model.chest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Waist:</span>
                      <span className="font-medium">{model.waist}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hips:</span>
                      <span className="font-medium">{model.hips}</span>
                    </div>
                  </div>

                  {/* Fit Description */}
                  <div className="mt-3 pt-3 border-t w-full">
                    <p className="text-xs text-center text-muted-foreground">
                      {getFitDescription(model.size, garmentType)} fit
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Sizes */}
        {MODEL_SIZES.length > 4 && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2 text-center">More Sizes Available</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {MODEL_SIZES.slice(4).map((model) => (
                <Button
                  key={model.size}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSize(model.size);
                    setViewMode("single");
                  }}
                  className="min-w-[60px]"
                  data-testid={`button-size-${model.size.toLowerCase()}`}
                >
                  {model.size}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Helpful tips */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">💡 How to Choose:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Compare model measurements to your own</li>
                  <li>Notice how size affects garment fit and coverage</li>
                  <li>Size up for looser fit, down for compression</li>
                  <li>1stRep apparel is designed for athletic builds</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getRecommendedSize(measurements?: {
  heightCm?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
}): string | null {
  if (!measurements || !measurements.chestCm) return null;

  const { heightCm = 175, chestCm, waistCm = 81, hipsCm = 101 } = measurements;

  // Calculate size based on chest measurement (most important for tops)
  // and overall proportions
  const avgMeasurement = (chestCm + waistCm + hipsCm) / 3;

  if (avgMeasurement < 87) return "XS";
  if (avgMeasurement < 92) return "S";
  if (avgMeasurement < 97) return "M";
  if (avgMeasurement < 102) return "L";
  if (avgMeasurement < 108) return "XL";
  return "XXL";
}

function getFitDescription(size: string, garmentType: string): string {
  const fits: Record<string, string> = {
    XS: "Athletic, close",
    S: "Fitted, performance",
    M: "Regular, comfortable",
    L: "Relaxed, comfortable",
    XL: "Loose, comfortable",
    XXL: "Very relaxed",
  };
  return fits[size] || "Regular";
}

function getSizeScale(size: string): number {
  const scales: Record<string, number> = {
    XS: 0.85,
    S: 0.92,
    M: 1.0,
    L: 1.08,
    XL: 1.15,
    XXL: 1.22,
  };
  return scales[size] || 1.0;
}

function getSizesToCompare(recommendedSize: string | null): ModelSize[] {
  // If no recommendation, show the first 4 sizes (XS, S, M, L)
  if (!recommendedSize) {
    return MODEL_SIZES.slice(0, 4);
  }

  // Find the index of the recommended size
  const recommendedIndex = MODEL_SIZES.findIndex(m => m.size === recommendedSize);
  
  // If not found, default to first 4
  if (recommendedIndex === -1) {
    return MODEL_SIZES.slice(0, 4);
  }

  // Strategy: Show recommended size and 3 neighbouring sizes
  // Try to center the recommended size, but adjust for edges
  
  if (recommendedIndex === 0) {
    // Recommended is XS, show XS, S, M, L
    return MODEL_SIZES.slice(0, 4);
  } else if (recommendedIndex === 1) {
    // Recommended is S, show XS, S, M, L
    return MODEL_SIZES.slice(0, 4);
  } else if (recommendedIndex >= MODEL_SIZES.length - 2) {
    // Recommended is XL or XXL, show last 4 sizes
    return MODEL_SIZES.slice(-4);
  } else {
    // Recommended is M or other middle size, show size before, recommended, and 2 after
    return MODEL_SIZES.slice(recommendedIndex - 1, recommendedIndex + 3);
  }
}
