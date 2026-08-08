import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler, User, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface MeasurementData {
  heightCm?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  shoulderWidthCm?: number;
  inseamCm?: number;
  preferredSize?: string;
}

interface MeasurementInputProps {
  open: boolean;
  onClose: () => void;
  onSave: (measurements: MeasurementData) => void;
  initialMeasurements?: MeasurementData;
}

// UK sizing chart data
const UK_SIZE_CHART = {
  XS: { chest: 86, waist: 71, hips: 91, height: 165 },
  S: { chest: 91, waist: 76, hips: 96, height: 170 },
  M: { chest: 96, waist: 81, hips: 101, height: 175 },
  L: { chest: 101, waist: 86, hips: 106, height: 180 },
  XL: { chest: 106, waist: 91, hips: 111, height: 185 },
  XXL: { chest: 112, waist: 97, hips: 117, height: 190 },
};

export function MeasurementInput({
  open,
  onClose,
  onSave,
  initialMeasurements,
}: MeasurementInputProps) {
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>(
    initialMeasurements?.preferredSize || ""
  );
  const [customMeasurements, setCustomMeasurements] = useState<MeasurementData>({
    heightCm: initialMeasurements?.heightCm,
    chestCm: initialMeasurements?.chestCm,
    waistCm: initialMeasurements?.waistCm,
    hipsCm: initialMeasurements?.hipsCm,
    shoulderWidthCm: initialMeasurements?.shoulderWidthCm,
    inseamCm: initialMeasurements?.inseamCm,
  });

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const sizeData = UK_SIZE_CHART[size as keyof typeof UK_SIZE_CHART];
    if (sizeData) {
      setCustomMeasurements({
        heightCm: sizeData.height,
        chestCm: sizeData.chest,
        waistCm: sizeData.waist,
        hipsCm: sizeData.hips,
        shoulderWidthCm: sizeData.chest * 0.4,
        inseamCm: sizeData.height * 0.45,
      });
    }
  };

  const handleCustomChange = (field: keyof MeasurementData, value: string) => {
    const numValue = parseFloat(value);
    setCustomMeasurements((prev) => ({
      ...prev,
      [field]: isNaN(numValue) ? undefined : numValue,
    }));
  };

  const handleSave = () => {
    const measurements: MeasurementData = {
      ...customMeasurements,
      preferredSize: selectedSize || undefined,
    };

    // Validate at least some measurements are provided
    if (
      !measurements.heightCm &&
      !measurements.chestCm &&
      !measurements.preferredSize
    ) {
      toast({
        title: "Measurements Required",
        description: "Please select a size or enter custom measurements",
        variant: "destructive",
      });
      return;
    }

    onSave(measurements);
    toast({
      title: "Measurements Saved",
      description: "Your measurements have been saved for virtual try-on",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-measurement-input">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Enter Your Measurements
          </DialogTitle>
          <DialogDescription>
            Choose a standard size or enter custom measurements for a personalised virtual try-on
            experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" data-testid="tab-quick-size">
              <User className="w-4 h-4 mr-2" />
              Quick Size
            </TabsTrigger>
            <TabsTrigger value="custom" data-testid="tab-custom-measurements">
              <Ruler className="w-4 h-4 mr-2" />
              Custom Measurements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Your UK Size</CardTitle>
                <CardDescription>
                  Choose the size that typically fits you best
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.keys(UK_SIZE_CHART).map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => handleSizeSelect(size)}
                      className="h-auto py-3"
                      data-testid={`button-size-${size.toLowerCase()}`}
                    >
                      {size}
                    </Button>
                  ))}
                </div>

                {selectedSize && (
                  <div className="mt-4 p-4 bg-accent/20 rounded-md space-y-2">
                    <p className="text-sm font-medium">Estimated Measurements for {selectedSize}:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Chest: {UK_SIZE_CHART[selectedSize as keyof typeof UK_SIZE_CHART].chest} cm</div>
                      <div>Waist: {UK_SIZE_CHART[selectedSize as keyof typeof UK_SIZE_CHART].waist} cm</div>
                      <div>Hips: {UK_SIZE_CHART[selectedSize as keyof typeof UK_SIZE_CHART].hips} cm</div>
                      <div>Height: {UK_SIZE_CHART[selectedSize as keyof typeof UK_SIZE_CHART].height} cm</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  UK Sizing Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="grid grid-cols-5 gap-2 font-medium border-b pb-2">
                    <div>Size</div>
                    <div>Chest</div>
                    <div>Waist</div>
                    <div>Hips</div>
                    <div>Height</div>
                  </div>
                  {Object.entries(UK_SIZE_CHART).map(([size, measurements]) => (
                    <div key={size} className="grid grid-cols-5 gap-2">
                      <div className="font-medium">{size}</div>
                      <div>{measurements.chest} cm</div>
                      <div>{measurements.waist} cm</div>
                      <div>{measurements.hips} cm</div>
                      <div>{measurements.height} cm</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enter Custom Measurements</CardTitle>
                <CardDescription>
                  Provide your exact measurements in centimeters for the most accurate fit
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={customMeasurements.heightCm || ""}
                    onChange={(e) => handleCustomChange("heightCm", e.target.value)}
                    data-testid="input-height"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chest">Chest (cm)</Label>
                  <Input
                    id="chest"
                    type="number"
                    placeholder="96"
                    value={customMeasurements.chestCm || ""}
                    onChange={(e) => handleCustomChange("chestCm", e.target.value)}
                    data-testid="input-chest"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waist">Waist (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    placeholder="81"
                    value={customMeasurements.waistCm || ""}
                    onChange={(e) => handleCustomChange("waistCm", e.target.value)}
                    data-testid="input-waist"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hips">Hips (cm)</Label>
                  <Input
                    id="hips"
                    type="number"
                    placeholder="101"
                    value={customMeasurements.hipsCm || ""}
                    onChange={(e) => handleCustomChange("hipsCm", e.target.value)}
                    data-testid="input-hips"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shoulder">Shoulder Width (cm)</Label>
                  <Input
                    id="shoulder"
                    type="number"
                    placeholder="42"
                    value={customMeasurements.shoulderWidthCm || ""}
                    onChange={(e) => handleCustomChange("shoulderWidthCm", e.target.value)}
                    data-testid="input-shoulder"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inseam">Inseam (cm)</Label>
                  <Input
                    id="inseam"
                    type="number"
                    placeholder="79"
                    value={customMeasurements.inseamCm || ""}
                    onChange={(e) => handleCustomChange("inseamCm", e.target.value)}
                    data-testid="input-inseam"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How to Measure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong>Height:</strong> Stand straight against a wall, measure from floor to top of
                  head
                </div>
                <div>
                  <strong>Chest:</strong> Measure around the fullest part of your chest, keeping the
                  tape horizontal
                </div>
                <div>
                  <strong>Waist:</strong> Measure around your natural waistline, where you normally wear
                  your pants
                </div>
                <div>
                  <strong>Hips:</strong> Measure around the fullest part of your hips
                </div>
                <div>
                  <strong>Shoulder Width:</strong> Measure from the edge of one shoulder to the other
                  across your back
                </div>
                <div>
                  <strong>Inseam:</strong> Measure from the crotch seam to the bottom of the ankle
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-measurements">
            Save Measurements
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
