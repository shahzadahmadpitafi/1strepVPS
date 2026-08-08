import { FitAssistant } from "./FitAssistant";

interface VirtualTryOnViewerProps {
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
  userMeasurements?: {
    heightCm?: number;
    chestCm?: number;
    waistCm?: number;
    hipsCm?: number;
    shoulderWidthCm?: number;
    inseamCm?: number;
    preferredSize?: string;
  };
  onSaveMeasurements?: (measurements: any) => void;
  onAddToCart?: (size: string) => void;
}

export function VirtualTryOnViewer({
  open,
  onClose,
  product,
  onAddToCart,
}: VirtualTryOnViewerProps) {
  return (
    <FitAssistant
      open={open}
      onClose={onClose}
      product={product}
      onAddToCart={onAddToCart}
    />
  );
}
