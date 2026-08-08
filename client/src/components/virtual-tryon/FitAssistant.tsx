import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Sparkles,
} from "lucide-react";
import { BodyVisualiser } from "./BodyVisualiser";

interface FitAssistantProps {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
    colors?: string[];
    sizes?: string[];
  };
  onAddToCart?: (size: string) => void;
}

interface UserProfile {
  height: number | null;
  weight: number | null;
  fitPreference: "tight" | "regular" | "loose";
  bodyType: "slim" | "athletic" | "average" | "curvy";
}

interface SizeRecommendation {
  recommendedSize: string;
  confidence: number;
  alternativeSize: string | null;
  fitNotes: string[];
}

const UK_SIZE_DATA: Record<string, { minChest: number; maxChest: number; minWaist: number; maxWaist: number; minWeight: number; maxWeight: number }> = {
  XS: { minChest: 82, maxChest: 88, minWaist: 68, maxWaist: 74, minWeight: 50, maxWeight: 60 },
  S: { minChest: 88, maxChest: 94, minWaist: 74, maxWaist: 80, minWeight: 58, maxWeight: 70 },
  M: { minChest: 94, maxChest: 100, minWaist: 80, maxWaist: 86, minWeight: 68, maxWeight: 80 },
  L: { minChest: 100, maxChest: 106, minWaist: 86, maxWaist: 92, minWeight: 78, maxWeight: 90 },
  XL: { minChest: 106, maxChest: 114, minWaist: 92, maxWaist: 100, minWeight: 88, maxWeight: 102 },
  XXL: { minChest: 114, maxChest: 124, minWaist: 100, maxWaist: 110, minWeight: 100, maxWeight: 120 },
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function calculateRecommendation(profile: UserProfile, category: string, availableSizes: string[]): SizeRecommendation {
  const { height, weight, fitPreference, bodyType } = profile;
  
  const validSizes = availableSizes.filter(s => SIZE_ORDER.includes(s));
  
  if (validSizes.length === 0) {
    return {
      recommendedSize: availableSizes[0] || "M",
      confidence: 30,
      alternativeSize: availableSizes[1] || null,
      fitNotes: ["Please check the size guide for this product"],
    };
  }
  
  const defaultSize = validSizes.includes("M") ? "M" : validSizes[Math.floor(validSizes.length / 2)];
  
  if (!height || !weight) {
    return {
      recommendedSize: defaultSize,
      confidence: 50,
      alternativeSize: validSizes.find(s => s !== defaultSize) || null,
      fitNotes: ["Please enter your measurements for a personalised recommendation"],
    };
  }

  let estimatedWeight = weight;
  if (bodyType === "athletic") estimatedWeight += 3;
  if (bodyType === "curvy") estimatedWeight += 5;
  if (bodyType === "slim") estimatedWeight -= 3;

  let bestSize = validSizes[0];
  let bestScore = -Infinity;

  for (const size of SIZE_ORDER) {
    if (!validSizes.includes(size)) continue;
    
    const sizeData = UK_SIZE_DATA[size];
    if (!sizeData) continue;

    const midWeight = (sizeData.minWeight + sizeData.maxWeight) / 2;
    const weightDiff = Math.abs(estimatedWeight - midWeight);
    const weightRange = sizeData.maxWeight - sizeData.minWeight;
    
    let score = 100 - (weightDiff / weightRange) * 50;
    
    if (fitPreference === "tight") {
      const sizeIndex = SIZE_ORDER.indexOf(size);
      if (sizeIndex > 0) score += 10;
    } else if (fitPreference === "loose") {
      const sizeIndex = SIZE_ORDER.indexOf(size);
      if (sizeIndex < SIZE_ORDER.length - 1) score += 10;
    }

    if (height > 185 && SIZE_ORDER.indexOf(size) >= 3) score += 5;
    if (height < 165 && SIZE_ORDER.indexOf(size) <= 2) score += 5;

    if (score > bestScore) {
      bestScore = score;
      bestSize = size;
    }
  }

  const sizeIndex = SIZE_ORDER.indexOf(bestSize);
  let alternativeSize: string | null = null;
  
  if (fitPreference === "tight" && sizeIndex > 0 && validSizes.includes(SIZE_ORDER[sizeIndex - 1])) {
    alternativeSize = SIZE_ORDER[sizeIndex - 1];
  } else if (fitPreference === "loose" && sizeIndex < SIZE_ORDER.length - 1 && validSizes.includes(SIZE_ORDER[sizeIndex + 1])) {
    alternativeSize = SIZE_ORDER[sizeIndex + 1];
  } else if (sizeIndex < SIZE_ORDER.length - 1 && validSizes.includes(SIZE_ORDER[sizeIndex + 1])) {
    alternativeSize = SIZE_ORDER[sizeIndex + 1];
  } else if (sizeIndex > 0 && validSizes.includes(SIZE_ORDER[sizeIndex - 1])) {
    alternativeSize = SIZE_ORDER[sizeIndex - 1];
  }

  const fitNotes: string[] = [];
  
  const isCompression = category.toLowerCase().includes("legging") || 
                        category.toLowerCase().includes("compression") ||
                        category.toLowerCase().includes("bra");
  const isHoodie = category.toLowerCase().includes("hoodie") || 
                   category.toLowerCase().includes("jacket");
  const isTop = category.toLowerCase().includes("t-shirt") || 
                category.toLowerCase().includes("vest") ||
                category.toLowerCase().includes("top");

  if (isCompression) {
    fitNotes.push("Compression fit - designed to be form-fitting for performance");
    if (fitPreference === "loose") {
      fitNotes.push("Consider sizing up if you prefer less compression");
    }
  } else if (isHoodie) {
    fitNotes.push("Relaxed fit - allows layering underneath");
    if (bodyType === "athletic") {
      fitNotes.push("Good choice for athletic builds - provides shoulder room");
    }
  } else if (isTop) {
    fitNotes.push("Regular athletic fit - slightly tapered at waist");
  }

  if (height > 185) {
    fitNotes.push("You're tall - check the length may suit you well");
  } else if (height < 165) {
    fitNotes.push("Consider the garment length - may run slightly longer");
  }

  const confidence = Math.min(95, Math.max(60, Math.round(bestScore)));

  return {
    recommendedSize: bestSize,
    confidence,
    alternativeSize,
    fitNotes,
  };
}

export function FitAssistant({ open, onClose, product, onAddToCart }: FitAssistantProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    height: null,
    weight: null,
    fitPreference: "regular",
    bodyType: "average",
  });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);

  const availableSizes = product.sizes?.length ? product.sizes : ["S", "M", "L", "XL"];
  
  useEffect(() => {
    if (open) {
      setStep(1);
      setProfile({
        height: null,
        weight: null,
        fitPreference: "regular",
        bodyType: "average",
      });
      setSelectedSize(null);
      setRecommendation(null);
    }
  }, [open, product.id]);

  useEffect(() => {
    if (step === 3 && profile.height && profile.weight) {
      const rec = calculateRecommendation(profile, product.category, availableSizes);
      setRecommendation(rec);
      setSelectedSize(rec.recommendedSize);
    }
  }, [step, profile, product.category]);

  const canProceed = () => {
    if (step === 1) return profile.height && profile.height > 100 && profile.height < 250;
    if (step === 2) return profile.weight && profile.weight > 30 && profile.weight < 200;
    return true;
  };

  const handleNext = () => {
    if (canProceed() && step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAddToCart = () => {
    if (selectedSize && onAddToCart && availableSizes.includes(selectedSize)) {
      onAddToCart(selectedSize);
      onClose();
    }
  };
  
  const isValidSelection = selectedSize && availableSizes.includes(selectedSize);

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Ruler className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">What's your height?</h3>
        <p className="text-sm text-muted-foreground">This helps us recommend the right size for you</p>
      </div>

      <div className="max-w-xs mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="height" className="text-center block">Height in centimetres</Label>
          <Input
            id="height"
            type="number"
            placeholder="e.g. 175"
            value={profile.height || ""}
            onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || null })}
            className="text-center text-lg h-14"
            min={100}
            max={250}
            data-testid="input-height"
          />
          <p className="text-xs text-muted-foreground text-center">
            Tip: Average UK height is around 175cm for men, 162cm for women
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">What's your weight?</h3>
        <p className="text-sm text-muted-foreground">This helps determine the best fit</p>
      </div>

      <div className="max-w-xs mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-center block">Weight in kilograms</Label>
          <Input
            id="weight"
            type="number"
            placeholder="e.g. 75"
            value={profile.weight || ""}
            onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || null })}
            className="text-center text-lg h-14"
            min={30}
            max={200}
            data-testid="input-weight"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-center block">Body type</Label>
          <RadioGroup
            value={profile.bodyType}
            onValueChange={(v) => setProfile({ ...profile, bodyType: v as UserProfile["bodyType"] })}
            className="grid grid-cols-2 gap-2"
          >
            {[
              { value: "slim", label: "Slim" },
              { value: "athletic", label: "Athletic" },
              { value: "average", label: "Average" },
              { value: "curvy", label: "Curvy" },
            ].map((type) => (
              <Label
                key={type.value}
                htmlFor={type.value}
                className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-all ${
                  profile.bodyType === type.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                <span className="text-sm font-medium">{type.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-center block">How do you like your fit?</Label>
          <RadioGroup
            value={profile.fitPreference}
            onValueChange={(v) => setProfile({ ...profile, fitPreference: v as UserProfile["fitPreference"] })}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { value: "tight", label: "Tight", icon: TrendingDown },
              { value: "regular", label: "Regular", icon: Minus },
              { value: "loose", label: "Loose", icon: TrendingUp },
            ].map((pref) => (
              <Label
                key={pref.value}
                htmlFor={pref.value}
                className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer transition-all ${
                  profile.fitPreference === pref.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={pref.value} id={pref.value} className="sr-only" />
                <pref.icon className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">{pref.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!recommendation) return null;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold">Your Perfect Size</h3>
          <p className="text-sm text-muted-foreground">Based on your measurements for {product.name}</p>
        </div>

        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="text-5xl font-bold text-primary mb-2">
              {recommendation.recommendedSize}
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Progress value={recommendation.confidence} className="w-24 h-2" />
              <span className="text-sm text-muted-foreground">{recommendation.confidence}% confident</span>
            </div>
            {recommendation.alternativeSize && (
              <p className="text-sm text-muted-foreground">
                Alternative: <span className="font-medium">{recommendation.alternativeSize}</span> 
                {profile.fitPreference === "loose" ? " for a more relaxed fit" : " if between sizes"}
              </p>
            )}
          </CardContent>
        </Card>

        {recommendation.fitNotes.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fit Notes</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {recommendation.fitNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedSize && (
          <BodyVisualiser
            productImageUrl={product.imageUrl}
            productName={product.name}
            selectedSize={selectedSize}
            userProfile={profile}
            category={product.category}
          />
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-center">Select your size</p>
          <div className="grid grid-cols-4 gap-2">
            {availableSizes.map((size) => (
              <Button
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                onClick={() => setSelectedSize(size)}
                className={`h-14 relative ${selectedSize === size ? "" : ""}`}
                data-testid={`button-select-size-${size.toLowerCase()}`}
              >
                {size}
                {size === recommendation.recommendedSize && (
                  <Badge className="absolute -top-2 -right-2 text-xs px-1">
                    <Check className="w-3 h-3" />
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] p-0 overflow-hidden" data-testid="dialog-fit-assistant">
        <DialogTitle className="sr-only">Fit Assistant - Find Your Perfect Size</DialogTitle>
        <DialogDescription className="sr-only">
          A step-by-step guide to find your perfect size for {product.name}
        </DialogDescription>
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
            data-testid="button-back-fit-assistant"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-sm font-medium">Fit Assistant</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-fit-assistant"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 py-3 border-b">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="sticky bottom-0 bg-background border-t p-4 flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1" data-testid="button-back-step">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed()} 
              className="flex-1"
              data-testid="button-next-step"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleAddToCart}
              disabled={!isValidSelection}
              className="flex-1"
              data-testid="button-add-to-cart-fit"
            >
              <Check className="w-4 h-4 mr-2" />
              Add Size {selectedSize} to Cart
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
