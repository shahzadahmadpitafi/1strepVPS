import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { sortSizes } from '@/lib/utils';

interface SizeColorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  sizes?: string[];
  colors?: string[];
  onConfirm: (size: string, color: string) => void;
}

export default function SizeColorDialog({
  open,
  onOpenChange,
  productName,
  sizes = [],
  colors = [],
  onConfirm,
}: SizeColorDialogProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Check if we have options
  const hasSizes = sizes && sizes.length > 0;
  const hasColors = colors && colors.length > 0;

  // Reset selections when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedSize('');
      setSelectedColor('');
    }
  }, [open]);

  const handleConfirm = () => {
    // Guard: ensure onConfirm exists
    if (!onConfirm) {
      console.error('SizeColorDialog: onConfirm callback is missing');
      return;
    }

    // For products without options, use defaults
    const finalSize = hasSizes ? selectedSize : 'One Size';
    const finalColor = hasColors ? selectedColor : 'Default';
    
    // Confirm with selected values, then close
    onConfirm(finalSize, finalColor);
    onOpenChange(false);
  };

  // Only allow confirmation if user has made selections (or if no options exist)
  const canConfirm = !!onConfirm && 
    (!hasSizes || selectedSize !== '') && 
    (!hasColors || selectedColor !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-size-color">
        <DialogHeader>
          <DialogTitle>Select Size & Colour</DialogTitle>
          <DialogDescription>
            Choose your preferred size and colour for <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Size Selection */}
          {sizes && sizes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Size</Label>
              <RadioGroup
                value={selectedSize}
                onValueChange={setSelectedSize}
                className="grid grid-cols-4 gap-2"
              >
                {sortSizes(sizes).map((size) => (
                  <div key={size}>
                    <RadioGroupItem
                      value={size}
                      id={`size-${size}`}
                      className="peer sr-only"
                      data-testid={`radio-size-${size}`}
                    />
                    <Label
                      htmlFor={`size-${size}`}
                      className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all min-h-11"
                      data-testid={`label-size-${size}`}
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Colour Selection */}
          {colors && colors.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Colour</Label>
              <RadioGroup
                value={selectedColor}
                onValueChange={setSelectedColor}
                className="grid grid-cols-2 gap-2"
              >
                {colors.map((color) => (
                  <div key={color}>
                    <RadioGroupItem
                      value={color}
                      id={`color-${color}`}
                      className="peer sr-only"
                      data-testid={`radio-color-${color}`}
                    />
                    <Label
                      htmlFor={`color-${color}`}
                      className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all min-h-11"
                      data-testid={`label-color-${color}`}
                    >
                      {color}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {hasSizes && !selectedSize && (
            <p className="text-sm text-muted-foreground">Please select a size to continue</p>
          )}
          
          {hasColors && !selectedColor && (
            <p className="text-sm text-muted-foreground">Please select a colour to continue</p>
          )}

          {(!sizes || sizes.length === 0) && (!colors || colors.length === 0) && (
            <div className="text-center py-4 text-muted-foreground">
              <p>This product has standard sizing.</p>
              <p className="text-sm mt-2">Click "Add to Cart" to continue.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11"
            data-testid="button-cancel-selection"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="min-h-11"
            data-testid="button-confirm-selection"
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
