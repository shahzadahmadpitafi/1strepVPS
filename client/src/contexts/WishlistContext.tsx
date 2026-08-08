import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface WishlistContextType {
  wishlist: Set<string>;
  wishlistItems: any[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch wishlist
  const { data: wishlistData, isLoading } = useQuery<any[]>({
    queryKey: ['/api/wishlist'],
    retry: false,
  });

  const wishlistItems = Array.isArray(wishlistData) ? wishlistData : [];
  const wishlist = new Set<string>(wishlistItems.map((item: any) => item.productId));

  // Toggle wishlist mutation with optimistic updates
  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("POST", `/api/wishlist/toggle/${productId}`);
    },
    onMutate: async (productId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/wishlist'] });

      // Snapshot the previous value
      const previousWishlist = queryClient.getQueryData<any[]>(['/api/wishlist']);

      // Optimistically update cache
      queryClient.setQueryData<any[]>(['/api/wishlist'], (old) => {
        if (!Array.isArray(old)) return old;
        
        const isCurrentlyInWishlist = old.some((item: any) => item.productId === productId);
        
        if (isCurrentlyInWishlist) {
          // Remove from wishlist
          return old.filter((item: any) => item.productId !== productId);
        } else {
          // Add to wishlist (with minimal data for optimistic UI)
          return [...old, { productId, id: `temp-${productId}` }];
        }
      });

      // Return context with previous value
      return { previousWishlist };
    },
    onError: (error: any, productId: string, context: any) => {
      // Rollback to previous value on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['/api/wishlist'], context.previousWishlist);
      }

      // Check if this is a 401 authentication error
      const is401Error = 
        error?.message?.startsWith('401') || 
        error?.message?.includes('Not authenticated') ||
        error?.message?.includes('Unauthorized') ||
        (typeof error === 'object' && error !== null && error.status === 401);

      if (is401Error) {
        toast({
          title: "Sign in required",
          description: "Redirecting to sign up page...",
        });
        // Redirect to register page after a brief delay
        setTimeout(() => {
          setLocation('/register');
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to update wishlist. Please try again.",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
  });

  // Add to wishlist mutation with optimistic updates
  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("POST", "/api/wishlist", { productId });
    },
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/wishlist'] });
      const previousWishlist = queryClient.getQueryData<any[]>(['/api/wishlist']);

      // Optimistically add to wishlist
      queryClient.setQueryData<any[]>(['/api/wishlist'], (old) => {
        if (!Array.isArray(old)) return [{ productId, id: `temp-${productId}` }];
        // Don't add if already exists
        if (old.some((item: any) => item.productId === productId)) return old;
        return [...old, { productId, id: `temp-${productId}` }];
      });

      return { previousWishlist };
    },
    onSuccess: () => {
      toast({
        title: "Added to wishlist",
        description: "Product added to your wishlist successfully.",
      });
    },
    onError: (error: any, productId: string, context: any) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['/api/wishlist'], context.previousWishlist);
      }

      // Check if this is a 401 authentication error
      const is401Error = 
        error?.message?.startsWith('401') || 
        error?.message?.includes('Not authenticated') ||
        error?.message?.includes('Unauthorized') ||
        (typeof error === 'object' && error !== null && error.status === 401);

      if (is401Error) {
        toast({
          title: "Sign in required",
          description: "Redirecting to sign up page...",
        });
        // Redirect to register page after a brief delay
        setTimeout(() => {
          setLocation('/register');
        }, 1000);
      } else if (error.message?.includes('409') || error.message?.includes('duplicate')) {
        toast({
          title: "Already in wishlist",
          description: "This product is already in your wishlist.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to wishlist. Please try again.",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
  });

  // Remove from wishlist mutation with optimistic updates
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/wishlist/${productId}`);
    },
    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/wishlist'] });
      const previousWishlist = queryClient.getQueryData<any[]>(['/api/wishlist']);

      // Optimistically remove from wishlist
      queryClient.setQueryData<any[]>(['/api/wishlist'], (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item: any) => item.productId !== productId);
      });

      return { previousWishlist };
    },
    onSuccess: () => {
      toast({
        title: "Removed from wishlist",
        description: "Product removed from your wishlist.",
      });
    },
    onError: (error: any, productId: string, context: any) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['/api/wishlist'], context.previousWishlist);
      }

      toast({
        title: "Error",
        description: "Failed to remove from wishlist. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
    },
  });

  const isInWishlist = (productId: string): boolean => {
    return wishlist.has(productId);
  };

  const toggleWishlist = async (productId: string) => {
    try {
      await toggleMutation.mutateAsync(productId);
    } catch (error) {
      // Error is already handled in onError callback
      // Silently catch here to prevent error modal from showing
    }
  };

  const addToWishlist = async (productId: string) => {
    try {
      await addMutation.mutateAsync(productId);
    } catch (error) {
      // Error is already handled in onError callback
      // Silently catch here to prevent error modal from showing
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await removeMutation.mutateAsync(productId);
    } catch (error) {
      // Error is already handled in onError callback
      // Silently catch here to prevent error modal from showing
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistItems,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.size,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
