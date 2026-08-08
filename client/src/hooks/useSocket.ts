import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface InventoryUpdateEvent {
  type: 'stock_increase' | 'stock_decrease' | 'purchase' | 'transfer' | 'adjustment';
  variantId: number;
  productName: string;
  sku: string;
  color?: string;
  size?: string;
  quantityChange: number;
  newQuantity: number;
  source: 'epos' | 'online' | 'admin' | 'warehouse' | 'sync';
  timestamp: string;
  orderId?: number;
  customerName?: string;
}

interface OrderEvent {
  type: 'new_order' | 'order_updated' | 'order_completed';
  orderId: number;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  source: 'epos' | 'online' | 'reseller';
  timestamp: string;
  items: {
    productName: string;
    quantity: number;
    sku: string;
  }[];
}

interface StockAlert {
  variantId: number;
  productName: string;
  currentStock: number;
  threshold: number;
  timestamp: string;
}

interface ResellerLicenceEvent {
  type: 'trial_approved' | 'trial_rejected' | 'licence_activated' | 'licence_expired';
  resellerId: string;
  status: string;
  trialEndsAt?: string;
  tier?: string;
  timestamp: string;
}

interface UseSocketOptions {
  room?: 'admin' | 'epos';
  resellerId?: string;
  onInventoryUpdate?: (event: InventoryUpdateEvent) => void;
  onOrderEvent?: (event: OrderEvent) => void;
  onStockAlert?: (alert: StockAlert) => void;
  onLicenceUpdate?: (event: ResellerLicenceEvent) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { room, resellerId, onInventoryUpdate, onOrderEvent, onStockAlert, onLicenceUpdate } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastInventoryUpdate, setLastInventoryUpdate] = useState<InventoryUpdateEvent | null>(null);
  const [lastOrderEvent, setLastOrderEvent] = useState<OrderEvent | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<InventoryUpdateEvent[]>([]);
  
  // Store callbacks in refs to avoid stale closures
  const onLicenceUpdateRef = useRef(onLicenceUpdate);
  onLicenceUpdateRef.current = onLicenceUpdate;

  useEffect(() => {
    // Only create socket if there's a room or resellerId to join
    if (!room && !resellerId) {
      return;
    }
    
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
      
      if (room) {
        socket.emit(`join:${room}`);
      }
      
      // Join reseller room if resellerId is provided
      if (resellerId) {
        socket.emit('join:reseller', resellerId);
        console.log(`🏪 Joining reseller room: ${resellerId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('inventory:update', (event: InventoryUpdateEvent) => {
      console.log('📦 Inventory update received:', event);
      setLastInventoryUpdate(event);
      
      if (event.type === 'purchase' || event.type === 'stock_decrease') {
        setRecentPurchases(prev => [event, ...prev.slice(0, 49)]);
      }
      
      onInventoryUpdate?.(event);
    });

    socket.on('order:update', (event: OrderEvent) => {
      console.log('🛒 Order event received:', event);
      setLastOrderEvent(event);
      onOrderEvent?.(event);
    });

    socket.on('stock:alert', (alert: StockAlert) => {
      console.log('⚠️ Stock alert received:', alert);
      onStockAlert?.(alert);
    });
    
    // Listen for licence updates (for resellers)
    socket.on('licence:update', (event: ResellerLicenceEvent) => {
      console.log('📜 Licence update received:', event);
      onLicenceUpdateRef.current?.(event);
    });

    return () => {
      socket.disconnect();
    };
  }, [room, resellerId]);

  const clearRecentPurchases = useCallback(() => {
    setRecentPurchases([]);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    lastInventoryUpdate,
    lastOrderEvent,
    recentPurchases,
    clearRecentPurchases
  };
}

export type { InventoryUpdateEvent, OrderEvent, StockAlert, ResellerLicenceEvent };
