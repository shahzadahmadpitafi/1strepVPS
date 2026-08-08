import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: string;
  discountedPrice?: string;
}

interface CartDisplayProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  isProcessing?: boolean;
}

export default function CartDisplay({
  items,
  subtotal,
  discount,
  tax,
  total,
  onUpdateQuantity,
  onRemoveItem,
  isProcessing = false,
}: CartDisplayProps) {
  return (
    <Card className="p-6 bg-card border border-border h-full flex flex-col">
      <div className="flex-1 overflow-y-auto mb-6 space-y-3">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">No items in cart</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-muted rounded-lg border border-border flex gap-3"
              data-testid={`cart-item-${item.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {item.size && (
                    <Badge variant="outline" className="text-xs">
                      {item.size}
                    </Badge>
                  )}
                  {item.color && (
                    <Badge variant="outline" className="text-xs">
                      {item.color}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {formatCurrency(parseFloat(item.unitPrice))}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                  }
                  disabled={isProcessing}
                  className="h-8 w-8"
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium text-sm">
                  {item.quantity}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={isProcessing}
                  className="h-8 w-8"
                  data-testid={`button-increase-${item.id}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isProcessing}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  data-testid={`button-remove-${item.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals Section */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="text-muted-foreground">Discount:</span>
            <span className="font-medium">-{formatCurrency(discount)}</span>
          </div>
        )}

        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (20%):</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
        )}

        <div className="border-t border-border pt-2 flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-green-600">{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  );
}
