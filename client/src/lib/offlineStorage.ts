// Offline Storage Management for EPOS
// Caches products, inventory, and cart data for offline functionality

interface CachedProduct {
  id: string;
  name: string;
  sku: string;
  retailPrice: string;
  category: string;
  sizes: string[];
  colors: string[];
  imageUrl?: string;
}

interface CachedInventory {
  resellerId: string;
  productId: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface OfflineCart {
  terminalId: string;
  items: Array<{
    id: string;
    productId: string;
    sku: string;
    name: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: string;
  }>;
  timestamp: number;
}

const CACHE_KEYS = {
  PRODUCTS: 'epos_products_cache',
  INVENTORY: 'epos_inventory_cache',
  CART: 'epos_cart_',
  SYNC_QUEUE: 'epos_sync_queue',
  LAST_SYNC: 'epos_last_sync',
  ONLINE_STATUS: 'epos_online_status',
};

export class EOPSOfflineStorage {
  private static instance: EOPSOfflineStorage;

  private constructor() {}

  static getInstance(): EOPSOfflineStorage {
    if (!this.instance) {
      this.instance = new EOPSOfflineStorage();
    }
    return this.instance;
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Cache products locally
  cacheProducts(products: CachedProduct[]): void {
    try {
      localStorage.setItem(
        CACHE_KEYS.PRODUCTS,
        JSON.stringify({
          data: products,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to cache products:', error);
    }
  }

  // Get cached products
  getCachedProducts(): CachedProduct[] {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
    } catch (error) {
      console.error('Failed to get cached products:', error);
    }
    return [];
  }

  // Cache inventory
  cacheInventory(inventory: CachedInventory[]): void {
    try {
      localStorage.setItem(
        CACHE_KEYS.INVENTORY,
        JSON.stringify({
          data: inventory,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to cache inventory:', error);
    }
  }

  // Get cached inventory
  getCachedInventory(): CachedInventory[] {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.INVENTORY);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
    } catch (error) {
      console.error('Failed to get cached inventory:', error);
    }
    return [];
  }

  // Save cart locally
  saveCartLocal(terminalId: string, cart: OfflineCart): void {
    try {
      localStorage.setItem(CACHE_KEYS.CART + terminalId, JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart locally:', error);
    }
  }

  // Get local cart
  getCartLocal(terminalId: string): OfflineCart | null {
    try {
      const cart = localStorage.getItem(CACHE_KEYS.CART + terminalId);
      return cart ? JSON.parse(cart) : null;
    } catch (error) {
      console.error('Failed to get local cart:', error);
    }
    return null;
  }

  // Queue order for sync when back online
  queueOrderForSync(order: any): void {
    try {
      const queue = localStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
      const syncQueue = queue ? JSON.parse(queue) : [];
      syncQueue.push({
        ...order,
        queuedAt: Date.now(),
      });
      localStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(syncQueue));
    } catch (error) {
      console.error('Failed to queue order:', error);
    }
  }

  // Get queued orders
  getSyncQueue(): any[] {
    try {
      const queue = localStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
    }
    return [];
  }

  // Clear sync queue
  clearSyncQueue(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.SYNC_QUEUE);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  // Clear all offline data
  clearAll(): void {
    try {
      Object.values(CACHE_KEYS).forEach((key) => {
        if (key !== CACHE_KEYS.CART) {
          localStorage.removeItem(key);
        }
      });
      // Also clear terminal-specific carts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEYS.CART)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  // Update last sync timestamp
  setLastSync(): void {
    try {
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Failed to set last sync:', error);
    }
  }

  // Get last sync time
  getLastSync(): number {
    try {
      const lastSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return lastSync ? parseInt(lastSync) : 0;
    } catch (error) {
      console.error('Failed to get last sync:', error);
    }
    return 0;
  }

  // Check if cache is stale (older than specified minutes)
  isCacheStale(minutes: number = 60): boolean {
    const lastSync = this.getLastSync();
    if (!lastSync) return true;
    const now = Date.now();
    return now - lastSync > minutes * 60 * 1000;
  }
}

export default EOPSOfflineStorage;
