import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ruler, Check, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SizeFitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productImage: string;
  productId: string;
  category?: string;
}

export default function SizeFitModal({
  open,
  onOpenChange,
  productName,
  productImage,
  productId,
  category = "apparel"
}: SizeFitModalProps) {
  const [measurements, setMeasurements] = useState({
    height: "",
    weight: "",
    chest: "",
    waist: "",
    hips: "",
    gender: "male"
  });
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);
  type FitStatus = "perfect" | "tight" | "loose" | "short" | "long" | null;
  
  const [fitDetails, setFitDetails] = useState<{
    chest: FitStatus;
    waist: FitStatus;
    length: FitStatus;
  }>({
    chest: null,
    waist: null,
    length: null
  });

  const handleMeasurementChange = (field: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const calculateRecommendedSize = () => {
    const height = parseInt(measurements.height);
    const chest = parseInt(measurements.chest);
    const waist = parseInt(measurements.waist);
    const hips = parseInt(measurements.hips);

    if (!height || !chest || !waist) {
      return;
    }

    // Size recommendation logic
    let size = "";
    let chestFit: "perfect" | "tight" | "loose" = "perfect";
    let waistFit: "perfect" | "tight" | "loose" = "perfect";
    let lengthFit: "perfect" | "short" | "long" = "perfect";

    if (measurements.gender === "male") {
      if (chest < 90) {
        size = "S";
        chestFit = chest < 86 ? "loose" : "perfect";
      } else if (chest < 98) {
        size = "M";
        chestFit = chest < 93 ? "loose" : chest > 97 ? "tight" : "perfect";
      } else if (chest < 106) {
        size = "L";
        chestFit = chest < 100 ? "loose" : chest > 105 ? "tight" : "perfect";
      } else if (chest < 114) {
        size = "XL";
        chestFit = chest < 107 ? "loose" : chest > 113 ? "tight" : "perfect";
      } else {
        size = "XXL";
        chestFit = chest > 120 ? "tight" : "perfect";
      }

      // Waist fit
      if (waist < 76) waistFit = "loose";
      else if (waist > 90) waistFit = "tight";

      // Length based on height
      if (height < 170) lengthFit = "long";
      else if (height > 190) lengthFit = "short";

    } else {
      // Female sizing
      if (chest < 85) {
        size = "S";
        chestFit = chest < 81 ? "loose" : "perfect";
      } else if (chest < 93) {
        size = "M";
        chestFit = chest < 88 ? "loose" : chest > 92 ? "tight" : "perfect";
      } else if (chest < 101) {
        size = "L";
        chestFit = chest < 95 ? "loose" : chest > 100 ? "tight" : "perfect";
      } else if (chest < 109) {
        size = "XL";
        chestFit = chest < 102 ? "loose" : chest > 108 ? "tight" : "perfect";
      } else {
        size = "XXL";
        chestFit = chest > 115 ? "tight" : "perfect";
      }

      // Waist fit
      if (waist < 66) waistFit = "loose";
      else if (waist > 80) waistFit = "tight";

      // Length based on height
      if (height < 160) lengthFit = "long";
      else if (height > 180) lengthFit = "short";
    }

    setRecommendedSize(size);
    setFitDetails({
      chest: chestFit,
      waist: waistFit,
      length: lengthFit
    });
  };

  const getFitColor = (fit: FitStatus) => {
    if (fit === "perfect") return "bg-green-100 text-green-800 border-green-300";
    if (fit === "tight" || fit === "short") return "bg-orange-100 text-orange-800 border-orange-300";
    if (fit === "loose" || fit === "long") return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getFitIcon = (fit: FitStatus) => {
    if (fit === "perfect") return <Check className="w-4 h-4" />;
    if (fit === "tight" || fit === "loose" || fit === "short" || fit === "long") {
      return <AlertCircle className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[90vh]">
          {/* Left Side - Product Preview */}
          <div className="bg-gray-50 p-6 flex flex-col overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold" data-testid="sizefit-title">
                Size & Fit Guide
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {productName} - Enter your measurements for personalised size recommendation
              </DialogDescription>
            </DialogHeader>

            {/* Product Image */}
            <div className="flex-1 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center p-8 mb-4">
              <img 
                src={productImage} 
                alt={productName}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Fit Visualization */}
            {recommendedSize && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Fit Prediction</h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-3 rounded-lg border ${getFitColor(fitDetails.chest)} flex flex-col items-center gap-1`}>
                    {getFitIcon(fitDetails.chest)}
                    <span className="font-medium">Chest</span>
                    <span className="capitalize">{fitDetails.chest}</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${getFitColor(fitDetails.waist)} flex flex-col items-center gap-1`}>
                    {getFitIcon(fitDetails.waist)}
                    <span className="font-medium">Waist</span>
                    <span className="capitalize">{fitDetails.waist}</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${getFitColor(fitDetails.length)} flex flex-col items-center gap-1`}>
                    {getFitIcon(fitDetails.length)}
                    <span className="font-medium">Length</span>
                    <span className="capitalize">{fitDetails.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Measurements */}
          <div className="p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Size Recommendation */}
              {recommendedSize && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Recommended Size</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-900" data-testid="recommended-size">
                      {recommendedSize}
                    </span>
                    <span className="text-sm text-green-700">Based on your measurements</span>
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <Alert>
                <Ruler className="w-4 h-4" />
                <AlertDescription>
                  Enter your body measurements below to get a personalised size recommendation
                  and see how this item will fit you.
                </AlertDescription>
              </Alert>

              {/* Gender Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Gender</Label>
                <Select 
                  value={measurements.gender} 
                  onValueChange={(value) => handleMeasurementChange("gender", value)}
                >
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Measurements Input */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Body Measurements (cm)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={measurements.height}
                      onChange={(e) => handleMeasurementChange("height", e.target.value)}
                      data-testid="input-height"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={measurements.weight}
                      onChange={(e) => handleMeasurementChange("weight", e.target.value)}
                      data-testid="input-weight"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chest">Chest</Label>
                    <Input
                      id="chest"
                      type="number"
                      placeholder="95"
                      value={measurements.chest}
                      onChange={(e) => handleMeasurementChange("chest", e.target.value)}
                      data-testid="input-chest"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="waist">Waist</Label>
                    <Input
                      id="waist"
                      type="number"
                      placeholder="80"
                      value={measurements.waist}
                      onChange={(e) => handleMeasurementChange("waist", e.target.value)}
                      data-testid="input-waist"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="hips">Hips</Label>
                    <Input
                      id="hips"
                      type="number"
                      placeholder="95"
                      value={measurements.hips}
                      onChange={(e) => handleMeasurementChange("hips", e.target.value)}
                      data-testid="input-hips"
                    />
                  </div>
                </div>

                <Button 
                  onClick={calculateRecommendedSize} 
                  className="w-full"
                  data-testid="button-get-recommendation"
                >
                  Get Size Recommendation
                </Button>
              </div>

              {/* Size Chart Reference */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Size Chart (Chest cm)</h4>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {["S", "M", "L", "XL", "XXL"].map((size, idx) => {
                    const ranges = measurements.gender === "male" 
                      ? ["86-92", "93-99", "100-106", "107-113", "114-120"]
                      : ["81-87", "88-94", "95-101", "102-108", "109-115"];
                    return (
                      <div key={size} className="text-center p-2 bg-white rounded border">
                        <div className="font-bold mb-1">{size}</div>
                        <div className="text-gray-600">{ranges[idx]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* How to Measure */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">How to Measure</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li><strong>Chest:</strong> Measure around the fullest part</li>
                  <li><strong>Waist:</strong> Measure around natural waistline</li>
                  <li><strong>Hips:</strong> Measure around the fullest part</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
