import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
  category: string;
  cartId: string;
  createdAt: string;
  updatedAt: string;
  storefrontSlug?: string;
  resellerId?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: {
    id: string;
    name: string;
    price: number;
    size: string;
    color: string;
    image: string;
    category: string;
    storefrontSlug?: string;
    resellerId?: string;
  }) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  shipping: number;
  total: number;
  isLoading: boolean;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  standardShippingCost: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const { toast } = useToast();
  
  // Fetch cart from API
  const { data, isLoading } = useQuery<{ cart: any; items: CartItem[] }>({
    queryKey: ['/api/cart'],
  });

  // Fetch shipping settings from API
  const { data: siteSettings } = useQuery<{
    freeShippingEnabled?: boolean;
    freeShippingThreshold?: string;
    standardShippingCost?: string;
  }>({
    queryKey: ['/api/site-settings'],
  });

  const cartItems = data?.items || [];
  
  // Parse shipping settings with fallback defaults
  // Using nullish coalescing (??) to allow zero values - || would treat 0 as falsy
  const freeShippingEnabled = siteSettings?.freeShippingEnabled ?? true;
  const freeShippingThreshold = parseFloat(siteSettings?.freeShippingThreshold ?? "75.00");
  const standardShippingCost = parseFloat(siteSettings?.standardShippingCost ?? "4.99");

  // Add to cart mutation
  const addMutation = useMutation({
    mutationFn: async (product: {
      id: string;
      name: string;
      price: number;
      size: string;
      color: string;
      image: string;
      category: string;
      storefrontSlug?: string;
      resellerId?: string;
    }) => {
      console.log('CartContext: Adding to cart', { productId: product.id, size: product.size, color: product.color });
      // Only send product ID, size, color, and reseller info - server will fetch authoritative data
      const response = await apiRequest('POST', '/api/cart/items', {
        productId: product.id,
        size: product.size,
        color: product.color,
        quantity: 1,
        storefrontSlug: product.storefrontSlug,
        resellerId: product.resellerId,
      });
      console.log('CartContext: Add to cart response', response.status);
      return response;
    },
    onSuccess: () => {
      console.log('CartContext: Invalidating cart query');
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      console.error('CartContext: Add to cart error', error);
    },
  });

  // Update quantity mutation
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return apiRequest('PATCH', `/api/cart/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest('DELETE', `/api/cart/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  // Clear cart mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const addToCart = async (product: {
    id: string;
    name: string;
    price: number;
    size: string;
    color: string;
    image: string;
    category: string;
    storefrontSlug?: string;
    resellerId?: string;
  }) => {
    try {
      await addMutation.mutateAsync(product);
    } catch (error: any) {
      // Parse error message to extract user-friendly info
      let errorMessage = "Failed to add item to cart";
      try {
        const errorString = error?.message || String(error);
        const jsonMatch = errorString.match(/\{.*\}/);
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } catch {
        // Keep default error message
      }
      
      toast({
        title: "Unable to add to cart",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeMutation.mutateAsync(itemId);
    } else {
      await updateMutation.mutateAsync({ itemId, quantity: newQuantity });
    }
  };

  const removeItem = async (itemId: string) => {
    await removeMutation.mutateAsync(itemId);
  };

  const clearCart = async () => {
    await clearMutation.mutateAsync();
  };

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  // Calculate shipping based on dynamic settings
  const shipping = freeShippingEnabled && subtotal >= freeShippingThreshold ? 0 : standardShippingCost;
  const total = subtotal + shipping;

  const value: CartContextType = {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotal,
    shipping,
    total,
    isLoading,
    freeShippingEnabled,
    freeShippingThreshold,
    standardShippingCost,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
