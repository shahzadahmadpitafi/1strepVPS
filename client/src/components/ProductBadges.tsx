import { Badge } from "@/components/ui/badge";
import { Sparkles, Tag, Clock, AlertCircle } from "lucide-react";

interface ProductBadgesProps {
  isNew?: boolean;
  onSale?: boolean;
  discount?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "upcoming";
  stockQuantity?: number;
}

export default function ProductBadges({
  isNew,
  onSale,
  discount,
  stockStatus,
  stockQuantity,
}: ProductBadgesProps) {
  const getStockBadge = () => {
    if (stockStatus === "out_of_stock" || (stockQuantity !== undefined && stockQuantity === 0)) {
      return (
        <Badge 
          variant="destructive" 
          className="text-xs gap-1"
          data-testid="badge-out-of-stock"
          aria-label="Out of stock"
        >
          <AlertCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    }
    
    if (stockStatus === "low_stock" || (stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5)) {
      return (
        <Badge 
          variant="secondary" 
          className="text-xs gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          data-testid="badge-low-stock"
          aria-label={`Low stock - only ${stockQuantity} left`}
        >
          <Clock className="h-3 w-3" />
          Only {stockQuantity} Left
        </Badge>
      );
    }

    if (stockStatus === "upcoming") {
      return (
        <Badge 
          variant="secondary" 
          className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          data-testid="badge-coming-soon"
          aria-label="Coming soon"
        >
          <Clock className="h-3 w-3" />
          Coming Soon
        </Badge>
      );
    }

    return null;
  };

  const stockBadge = getStockBadge();

  return (
    <div className="absolute top-2 md:top-3 left-2 md:left-3 flex flex-col gap-2">
      {/* New Badge */}
      {isNew && (
        <Badge 
          className="bg-primary text-primary-foreground text-xs gap-1" 
          data-testid="badge-new"
          aria-label="New product"
        >
          <Sparkles className="h-3 w-3" />
          NEW
        </Badge>
      )}

      {/* Sale/Discount Badge */}
      {onSale && discount && discount > 0 && (
        <Badge 
          variant="destructive" 
          className="text-xs gap-1" 
          data-testid="badge-sale"
          aria-label={`${discount}% off`}
        >
          <Tag className="h-3 w-3" />
          -{discount}%
        </Badge>
      )}

      {/* Stock Status Badge */}
      {stockBadge}
    </div>
  );
}
