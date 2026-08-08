import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface CustomerDisplayProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  message?: string;
  isProcessing?: boolean;
}

export default function CustomerDisplay({
  items,
  subtotal,
  discount,
  tax,
  total,
  message = "Welcome to 1stRep EPOS",
  isProcessing = false,
}: CustomerDisplayProps) {
  return (
    <div className="w-full h-screen bg-black flex flex-col text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-8 text-center border-b-4 border-blue-600">
        <h1 className="text-5xl font-bold mb-2">1stRep</h1>
        <p className="text-xl text-blue-200">{message}</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center">
            <div className="text-8xl mb-6">🛍️</div>
            <p className="text-4xl font-light text-gray-400">
              Ready to Checkout
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Your Cart</h2>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-gray-900 border-2 border-blue-600 rounded-lg p-6 flex justify-between items-center"
                    data-testid={`customer-cart-item-${index}`}
                  >
                    <div className="flex-1">
                      <p className="text-2xl font-bold mb-2">{item.name}</p>
                      <div className="flex gap-3 text-lg">
                        {item.size && (
                          <Badge className="bg-blue-600 text-white">
                            {item.size}
                          </Badge>
                        )}
                        {item.color && (
                          <Badge className="bg-blue-600 text-white">
                            {item.color}
                          </Badge>
                        )}
                        <Badge className="bg-gray-700 text-white">
                          Qty: {item.quantity}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-400">
                        {formatCurrency(
                          parseFloat(item.unitPrice) * item.quantity
                        )}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatCurrency(parseFloat(item.unitPrice))} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-900 border-2 border-green-600 rounded-lg p-8">
              <div className="space-y-4 mb-6 text-xl">
                <div className="flex justify-between">
                  <span className="text-gray-300">Subtotal:</span>
                  <span className="font-bold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span className="text-gray-300">Savings:</span>
                    <span className="font-bold">
                      -{formatCurrency(discount)}
                    </span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tax:</span>
                    <span className="font-bold">{formatCurrency(tax)}</span>
                  </div>
                )}

                <div className="border-t border-gray-700 pt-4 flex justify-between text-3xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-400">{formatCurrency(total)}</span>
                </div>
              </div>

              {isProcessing && (
                <div className="text-center">
                  <div className="inline-block">
                    <div className="relative w-12 h-12 mx-auto mb-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="text-xl text-blue-400 animate-pulse">
                    Processing Payment...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-950 border-t-4 border-blue-600 p-4 text-center text-gray-500">
        <p className="text-sm">Built by Qanzak Global</p>
      </div>
    </div>
  );
}
