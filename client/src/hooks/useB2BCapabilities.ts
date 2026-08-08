import { useQuery } from "@tanstack/react-query";

export interface B2BCapabilities {
  partnerType: 'reseller' | 'vendor' | null;
  partnerId: string | null;
  capabilities: string[];
  canRequestStock: boolean;
}

const DEFAULT_CAPABILITIES: B2BCapabilities = {
  partnerType: null,
  partnerId: null,
  capabilities: [],
  canRequestStock: false,
};

export function useB2BCapabilities() {
  const { data, isLoading, error } = useQuery<B2BCapabilities>({
    queryKey: ['/api/b2b/my-capabilities'],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const capabilities = data || DEFAULT_CAPABILITIES;

  return {
    ...capabilities,
    isLoading,
    error,
    hasCapability: (cap: string) => capabilities.capabilities.includes(cap),
    canSell1stRepProducts: capabilities.capabilities.includes('sell_1strep_products'),
    canAddOwnProducts: capabilities.capabilities.includes('add_own_products'),
    canRequestStock: capabilities.capabilities.includes('request_stock'),
    canManageStorefront: capabilities.capabilities.includes('manage_storefront'),
    canViewAnalytics: capabilities.capabilities.includes('view_analytics'),
    canProcessEpos: capabilities.capabilities.includes('process_epos'),
  };
}
