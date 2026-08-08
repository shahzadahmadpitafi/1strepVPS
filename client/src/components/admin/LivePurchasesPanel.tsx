import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket, type InventoryUpdateEvent } from '@/hooks/useSocket';
import { ShoppingCart, TrendingDown, Package, Clock, Trash2, Radio, Wifi, WifiOff } from 'lucide-react';

export default function LivePurchasesPanel() {
  const { isConnected, recentPurchases, clearRecentPurchases } = useSocket({
    room: 'admin',
  });
  const [isExpanded, setIsExpanded] = useState(true);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getSourceIcon = (source: InventoryUpdateEvent['source']) => {
    switch (source) {
      case 'epos':
        return <ShoppingCart className="w-4 h-4" />;
      case 'online':
        return <Package className="w-4 h-4" />;
      default:
        return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: InventoryUpdateEvent['source']) => {
    switch (source) {
      case 'epos':
        return 'EPOS';
      case 'online':
        return 'Online';
      case 'admin':
        return 'Admin';
      case 'warehouse':
        return 'Warehouse';
      default:
        return source;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          Live Purchases
        </CardTitle>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
              <Wifi className="w-3 h-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-600 gap-1">
              <WifiOff className="w-3 h-3" />
              Disconnected
            </Badge>
          )}
          {recentPurchases.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearRecentPurchases}
              className="h-8 w-8"
              data-testid="button-clear-purchases"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentPurchases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent purchases</p>
            <p className="text-xs mt-1">Purchases will appear here in real-time</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {recentPurchases.map((purchase, index) => (
                <div 
                  key={`${purchase.variantId}-${purchase.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border/50"
                  data-testid={`purchase-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-500">
                      {getSourceIcon(purchase.source)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{purchase.productName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {purchase.color && <span>Colour: {purchase.color}</span>}
                        {purchase.size && <span>Size: {purchase.size}</span>}
                        <span className="opacity-50">SKU: {purchase.sku}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getSourceLabel(purchase.source)}
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        -{Math.abs(purchase.quantityChange)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(purchase.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
