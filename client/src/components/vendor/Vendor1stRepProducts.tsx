import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { sortSizes } from "@/lib/utils";
import { 
  Plus, 
  Trash2, 
  Eye,
  EyeOff,
  ShoppingBag,
  Store
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  retailPrice: string;
  wholesalePrice: string;
  category: string;
  imageUrl: string | null;
  sku: string;
  availabilityStatus: string;
  colors?: string[];
  sizes?: string[];
  partnerCommissionRate?: string;
  partnerStorefrontPrice?: string;
  displayColor?: string | null;
  colorVariantId?: string | null;
}

interface VendorResellerProduct {
  id: string;
  productId: string;
  isActive: boolean;
  addedAt: string;
  product: Product;
}

export default function Vendor1stRepProducts() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch all 1stRep products (only platform products, not vendor products)
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/vendor/1strep-products"]
  });

  // Fetch vendor's added 1stRep partner products
  const { data: vendorProducts = [], isLoading: vendorProductsLoading } = useQuery<VendorResellerProduct[]>({
    queryKey: ["/api/vendor/partner-products"]
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("POST", "/api/vendor/partner-products", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/partner-products"] });
      toast({ title: "Product added to your catalogue!" });
      setSelectedProduct(null);
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    }
  });

  // Remove product mutation
  const removeProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vendor/partner-products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/partner-products"] });
      toast({ title: "Product removed from catalogue" });
    },
    onError: () => {
      toast({ title: "Failed to remove product", variant: "destructive" });
    }
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/vendor/partner-products/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/partner-products"] });
      toast({ title: "Product visibility updated" });
    },
    onError: () => {
      toast({ title: "Failed to update visibility", variant: "destructive" });
    }
  });

  // Filter available products (not yet added)
  const addedProductIds = new Set(vendorProducts.map(vp => vp.productId));
  const availableProducts = allProducts.filter(p => !addedProductIds.has(p.id) && p.availabilityStatus !== 'discontinued');

  const handleAddProduct = (product: Product) => {
    addProductMutation.mutate(product.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">1stRep Products</h2>
          <p className="text-muted-foreground">
            Add 1stRep products to your catalogue and earn commission on every sale
          </p>
        </div>
      </div>

      <Tabs defaultValue="my-products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my-products" data-testid="tab-my-1strep-products">
            <Store className="h-4 w-4 mr-2" />
            My 1stRep Products ({vendorProducts.length})
          </TabsTrigger>
          <TabsTrigger value="add-products" data-testid="tab-add-1strep-products">
            <Plus className="h-4 w-4 mr-2" />
            Add Products
          </TabsTrigger>
        </TabsList>

        {/* My 1stRep Products Tab */}
        <TabsContent value="my-products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your 1stRep Products</CardTitle>
              <CardDescription>
                Products from the 1stRep catalogue that you're selling
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendorProductsLoading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : vendorProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't added any 1stRep products yet.</p>
                  <p className="text-sm mt-2">Switch to the "Add Products" tab to browse and add products.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorProducts.map((vp) => (
                    <Card key={vp.id} className="overflow-hidden" data-testid={`card-vendor-product-${vp.id}`}>
                      {vp.product.imageUrl && (
                        <div className="aspect-[4/5] relative bg-muted">
                          <img
                            src={convertToDirectUrl(vp.product.imageUrl)}
                            alt={vp.product.name}
                            className="w-full h-full object-contain"
                          />
                          {!vp.isActive && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge variant="secondary">Hidden</Badge>
                            </div>
                          )}
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-1">{vp.product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{vp.product.category}</p>
                        
                        {/* Storefront Price */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-muted-foreground">Price:</span>
                          <span className="font-medium">
                            £{parseFloat(vp.product.partnerStorefrontPrice || vp.product.retailPrice).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Commission Info */}
                        <div className="p-2 bg-primary/5 rounded-lg mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Your commission:</span>
                            <span className="text-sm font-medium text-primary">
                              £{(parseFloat(vp.product.partnerStorefrontPrice || vp.product.retailPrice) * parseFloat(vp.product.partnerCommissionRate || "10") / 100).toFixed(2)} ({vp.product.partnerCommissionRate || "10"}%)
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={vp.isActive ? "outline" : "default"}
                            onClick={() => toggleVisibilityMutation.mutate({ id: vp.id, isActive: !vp.isActive })}
                            className="flex-1"
                            disabled={toggleVisibilityMutation.isPending || removeProductMutation.isPending}
                            data-testid={`button-toggle-${vp.id}`}
                          >
                            {toggleVisibilityMutation.isPending ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <>
                                {vp.isActive ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                {vp.isActive ? "Hide" : "Show"}
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeProductMutation.mutate(vp.id)}
                            disabled={removeProductMutation.isPending || toggleVisibilityMutation.isPending}
                            data-testid={`button-remove-${vp.id}`}
                          >
                            {removeProductMutation.isPending ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Products Tab */}
        <TabsContent value="add-products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add 1stRep Products</CardTitle>
              <CardDescription>
                Browse the 1stRep catalogue and add products to sell
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-8">Loading catalogue...</div>
              ) : availableProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  All available products have been added to your catalogue!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableProducts.map((product) => (
                    <Card key={product.id} className="hover-elevate" data-testid={`card-available-${product.id}`}>
                      {product.imageUrl && (
                        <div className="aspect-[4/5] relative bg-muted">
                          <img
                            src={convertToDirectUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-full h-full object-contain rounded-t-lg"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-1">{product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                        
                        {/* Colour */}
                        {product.displayColor && (
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              {product.displayColor}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Sizes:</p>
                            <div className="flex flex-wrap gap-1">
                              {sortSizes(product.sizes).map((size, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                                  {size}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Storefront Price */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold">
                            £{parseFloat(product.partnerStorefrontPrice || product.retailPrice).toFixed(2)}
                          </span>
                          <Badge variant="secondary">Storefront Price</Badge>
                        </div>
                        
                        {/* Commission Info */}
                        <div className="flex items-center justify-between mb-3 p-2 bg-primary/5 rounded-lg">
                          <span className="text-sm text-muted-foreground">Your commission:</span>
                          <span className="text-sm font-medium text-primary">
                            £{(parseFloat(product.partnerStorefrontPrice || product.retailPrice) * parseFloat(product.partnerCommissionRate || "10") / 100).toFixed(2)} ({product.partnerCommissionRate || "10"}%)
                          </span>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => setSelectedProduct(product)}
                              data-testid={`button-add-${product.id}`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Catalogue
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Product to Catalogue</DialogTitle>
                              <DialogDescription>
                                Add this 1stRep product to your EPOS and storefront
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Product</p>
                                <p className="font-medium">{product.name}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Storefront Price</p>
                                  <p className="font-medium text-lg">
                                    £{parseFloat(product.partnerStorefrontPrice || product.retailPrice).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Your Commission</p>
                                  <p className="font-medium text-lg text-primary">
                                    £{(parseFloat(product.partnerStorefrontPrice || product.retailPrice) * parseFloat(product.partnerCommissionRate || "10") / 100).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  Commission Rate: <span className="font-medium">{product.partnerCommissionRate || "10"}%</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  You earn this commission on every sale of this product
                                </p>
                              </div>
                              <Button
                                onClick={() => handleAddProduct(product)}
                                className="w-full"
                                disabled={addProductMutation.isPending}
                                data-testid="button-confirm-add"
                              >
                                {addProductMutation.isPending ? "Adding..." : "Add Product"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
