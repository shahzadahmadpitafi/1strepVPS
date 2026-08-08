import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { sortSizes } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";
import { 
  Store, 
  Plus, 
  Trash2, 
  Edit,
  ExternalLink,
  ShoppingBag,
  DollarSign,
  Eye,
  EyeOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Storefront {
  id: string;
  slug: string;
  storeName: string;
  storeDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
}

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
}

interface ResellerProduct {
  id: string;
  productId: string;
  customPrice: string | null;
  isActive: boolean;
  displayOrder: number;
  product: Product & {
    colors?: string[];
    sizes?: string[];
  };
}

export default function StorefrontManagement() {
  const { toast } = useToast();
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<ResellerProduct | null>(null);

  // Fetch storefront
  const { data: storefront, isLoading: storefrontLoading } = useQuery<Storefront | null>({
    queryKey: ["/api/reseller/storefront"]
  });

  // Fetch all products (main catalog)
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"]
  });

  // Fetch reseller's storefront products
  const { data: storefrontProducts = [], isLoading: storefrontProductsLoading } = useQuery<ResellerProduct[]>({
    queryKey: ["/api/reseller/storefront/products"],
    enabled: !!storefront
  });

  // Create storefront mutation
  const createStorefrontMutation = useMutation({
    mutationFn: async (data: Partial<Storefront>) => {
      return await apiRequest("POST", "/api/reseller/storefront", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/storefront"] });
      toast({ title: "Storefront created successfully!" });
      setIsSetupDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create storefront";
      toast({ 
        title: "Error", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  });

  // Update storefront mutation
  const updateStorefrontMutation = useMutation({
    mutationFn: async (data: Partial<Storefront>) => {
      return await apiRequest("PATCH", "/api/reseller/storefront", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/storefront"] });
      toast({ title: "Storefront updated successfully!" });
      setIsSetupDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to update storefront";
      toast({ 
        title: "Error", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  });

  // Add product to storefront
  const addProductMutation = useMutation({
    mutationFn: async (data: { productId: string; customPrice?: string }) => {
      return await apiRequest("POST", "/api/reseller/storefront/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/storefront/products"] });
      toast({ title: "Product added to storefront!" });
      setIsAddProductDialogOpen(false);
      setSelectedProduct(null);
      setCustomPrice("");
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    }
  });

  // Update product in storefront
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/reseller/storefront/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/storefront/products"] });
      toast({ title: "Product updated!" });
      setEditingProduct(null);
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    }
  });

  // Remove product from storefront
  const removeProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/reseller/storefront/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/storefront/products"] });
      toast({ title: "Product removed from storefront" });
    },
    onError: () => {
      toast({ title: "Failed to remove product", variant: "destructive" });
    }
  });

  const handleStorefrontSetup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      slug: formData.get("slug") as string,
      storeName: formData.get("storeName") as string,
      storeDescription: formData.get("storeDescription") as string || null,
      logoUrl: formData.get("logoUrl") as string || null,
      bannerUrl: formData.get("bannerUrl") as string || null,
      primaryColor: formData.get("primaryColor") as string || "#0073cf",
      accentColor: formData.get("accentColor") as string || "#005ba3",
      isActive: formData.get("isActive") === "true"
    };

    if (storefront) {
      updateStorefrontMutation.mutate(data);
    } else {
      createStorefrontMutation.mutate(data);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    addProductMutation.mutate({
      productId: selectedProduct.id
    });
  };

  const handleToggleProductVisibility = (product: ResellerProduct) => {
    updateProductMutation.mutate({
      id: product.id,
      data: { isActive: !product.isActive }
    });
  };

  // Get products not yet added to storefront
  const availableProducts = allProducts.filter(
    p => !storefrontProducts.some(sp => sp.productId === p.id)
  );

  if (storefrontLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Storefront Setup Card */}
      <Card data-testid="card-storefront-setup">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                My Storefront
              </CardTitle>
              <CardDescription>
                {storefront 
                  ? "Manage your branded storefront settings and products" 
                  : "Set up your personalised storefront to start selling"}
              </CardDescription>
            </div>
            {storefront && (
              <Button
                variant="outline"
                size="sm"
                asChild
                data-testid="button-view-storefront"
              >
                <a href={`/store/${storefront.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {storefront ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Store Name</p>
                  <p className="font-medium" data-testid="text-store-name">{storefront.storeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Store URL</p>
                  <p className="font-medium text-primary" data-testid="text-store-url">
                    /store/{storefront.slug}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={storefront.isActive ? "default" : "secondary"} data-testid="badge-status">
                    {storefront.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="font-medium" data-testid="text-product-count">{storefrontProducts.length}</p>
                </div>
              </div>
              <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" data-testid="button-edit-storefront">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Storefront Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-storefront">
                  <StorefrontSetupForm
                    storefront={storefront}
                    onSubmit={handleStorefrontSetup}
                    isLoading={updateStorefrontMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center py-8">
              <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Storefront Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your personalised storefront to showcase and sell products
              </p>
              <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-setup-storefront">
                    <Plus className="h-4 w-4 mr-2" />
                    Set Up Storefront
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-setup-storefront">
                  <StorefrontSetupForm
                    storefront={null}
                    onSubmit={handleStorefrontSetup}
                    isLoading={createStorefrontMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Management - Only show if storefront exists */}
      {storefront && (
        <Tabs defaultValue="my-products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-products" data-testid="tab-my-products">
              My Products ({storefrontProducts.length})
            </TabsTrigger>
            <TabsTrigger value="add-products" data-testid="tab-add-products">
              Add Products ({availableProducts.length} available)
            </TabsTrigger>
          </TabsList>

          {/* My Products Tab */}
          <TabsContent value="my-products">
            <Card data-testid="card-my-products">
              <CardHeader>
                <CardTitle>My Storefront Products</CardTitle>
                <CardDescription>
                  Manage products currently listed on your storefront
                </CardDescription>
              </CardHeader>
              <CardContent>
                {storefrontProductsLoading ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : storefrontProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products added yet. Go to "Add Products" tab to add some!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storefrontProducts.map((rp) => (
                      <Card key={rp.id} className={`${!rp.isActive ? 'opacity-60' : ''}`} data-testid={`card-product-${rp.id}`}>
                        {rp.product.imageUrl && (
                          <div className="aspect-[4/5] relative bg-muted">
                            <img
                              src={convertToDirectUrl(rp.product.imageUrl)}
                              alt={rp.product.name}
                              className="w-full h-full object-contain rounded-t-lg"
                              data-testid={`img-product-${rp.id}`}
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1" data-testid={`text-name-${rp.id}`}>{rp.product.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{rp.product.category}</p>
                          
                          {/* Colour swatches */}
                          {rp.product.colors && rp.product.colors.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-1">Colours ({rp.product.colors.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {rp.product.colors.map((color, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5"
                                    data-testid={`badge-color-${rp.id}-${idx}`}
                                  >
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Size badges */}
                          {rp.product.sizes && rp.product.sizes.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-1">Sizes ({rp.product.sizes.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {sortSizes(rp.product.sizes).map((size, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className="text-xs px-2 py-0.5"
                                    data-testid={`badge-size-${rp.id}-${idx}`}
                                  >
                                    {size}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Storefront Price */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">Storefront Price:</span>
                            <span className="font-medium" data-testid={`text-retail-${rp.id}`}>
                              £{parseFloat((rp.product as any).partnerStorefrontPrice || rp.product.retailPrice).toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Commission Info */}
                          <div className="p-2 bg-primary/5 rounded-lg mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Your commission:</span>
                              <span className="text-sm font-medium text-primary">
                                £{(parseFloat((rp.product as any).partnerStorefrontPrice || rp.product.retailPrice) * parseFloat((rp.product as any).partnerCommissionRate || "10") / 100).toFixed(2)} ({(rp.product as any).partnerCommissionRate || "10"}%)
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={rp.isActive ? "outline" : "default"}
                              onClick={() => handleToggleProductVisibility(rp)}
                              className="flex-1"
                              data-testid={`button-toggle-${rp.id}`}
                            >
                              {rp.isActive ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                              {rp.isActive ? "Hide" : "Show"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeProductMutation.mutate(rp.id)}
                              data-testid={`button-remove-${rp.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
          <TabsContent value="add-products">
            <Card data-testid="card-add-products">
              <CardHeader>
                <CardTitle>Add Products to Storefront</CardTitle>
                <CardDescription>
                  Browse the main catalogue and add products to your storefront
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-8">Loading catalogue...</div>
                ) : availableProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    All products from the catalogue have been added to your storefront!
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
                              data-testid={`img-available-${product.id}`}
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1" data-testid={`text-available-name-${product.id}`}>{product.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                          
                          {/* Colour swatches */}
                          {product.colors && product.colors.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground mb-1">Colours ({product.colors.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {product.colors.map((color, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {color}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Size badges */}
                          {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground mb-1">Sizes ({product.sizes.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {sortSizes(product.sizes).map((size, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="secondary" 
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {size}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Storefront Price */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold" data-testid={`text-available-price-${product.id}`}>
                              £{parseFloat(product.partnerStorefrontPrice || product.retailPrice).toFixed(2)}
                            </span>
                            <Badge variant="secondary">Storefront Price</Badge>
                          </div>
                          
                          {/* Commission Info */}
                          <div className="flex items-center justify-between mb-3 p-2 bg-primary/5 rounded-lg">
                            <span className="text-sm text-muted-foreground">Your commission:</span>
                            <span className="text-sm font-medium text-primary" data-testid={`text-commission-${product.id}`}>
                              £{(parseFloat(product.partnerStorefrontPrice || product.retailPrice) * parseFloat(product.partnerCommissionRate || "10") / 100).toFixed(2)} ({product.partnerCommissionRate || "10"}%)
                            </span>
                          </div>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedProduct(product);
                                }}
                                data-testid={`button-add-${product.id}`}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add to Storefront
                              </Button>
                            </DialogTrigger>
                            <DialogContent data-testid={`dialog-add-${product.id}`}>
                              <DialogHeader>
                                <DialogTitle>Add Product to Storefront</DialogTitle>
                                <DialogDescription>
                                  Add this product to your storefront at the preset price
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Product</Label>
                                  <p className="font-medium">{product.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Storefront Price</Label>
                                    <p className="font-medium text-lg">£{parseFloat(product.partnerStorefrontPrice || product.retailPrice).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label>Your Commission</Label>
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
                                  onClick={handleAddProduct}
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
      )}
    </div>
  );
}

// Storefront Setup Form Component
function StorefrontSetupForm({ 
  storefront, 
  onSubmit, 
  isLoading 
}: { 
  storefront: Storefront | null; 
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}) {
  const [isActive, setIsActive] = useState(storefront?.isActive ?? true);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {storefront ? "Edit Storefront Settings" : "Set Up Your Storefront"}
        </DialogTitle>
        <DialogDescription>
          Configure your branded storefront where customers can browse and purchase your products
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="storeName">Store Name *</Label>
          <Input
            id="storeName"
            name="storeName"
            defaultValue={storefront?.storeName || ""}
            required
            placeholder="My Fitness Store"
            data-testid="input-store-name"
          />
        </div>

        <div>
          <Label htmlFor="slug">Store URL Slug *</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/store/</span>
            <Input
              id="slug"
              name="slug"
              defaultValue={storefront?.slug || ""}
              required
              disabled={!!storefront}
              placeholder="my-fitness-store"
              pattern="[a-z0-9-]+"
              data-testid="input-slug"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {storefront ? "URL slug cannot be changed" : "Use lowercase letters, numbers, and hyphens only"}
          </p>
        </div>

        <div>
          <Label htmlFor="storeDescription">Store Description</Label>
          <Textarea
            id="storeDescription"
            name="storeDescription"
            defaultValue={storefront?.storeDescription || ""}
            placeholder="Welcome to my fitness store! We offer premium athletic wear..."
            rows={3}
            data-testid="textarea-description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploader
            label="Logo"
            name="logoUrl"
            defaultValue={storefront?.logoUrl || "/1strep-header-logo.png"}
            defaultImageUrl="/1strep-header-logo.png"
            testId="input-logo"
            description="Recommended: 400x400px square logo"
            useDefaultInitially={!storefront?.logoUrl}
          />

          <ImageUploader
            label="Banner"
            name="bannerUrl"
            defaultValue={storefront?.bannerUrl || "/1strep-header-logo.png"}
            defaultImageUrl="/1strep-header-logo.png"
            testId="input-banner"
            description="Recommended: 1200x400px banner image"
            useDefaultInitially={!storefront?.bannerUrl}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Colour</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                defaultValue={storefront?.primaryColor || "#0073cf"}
                className="w-20"
                data-testid="input-primary-color"
              />
              <Input
                type="text"
                defaultValue={storefront?.primaryColor || "#0073cf"}
                placeholder="#0073cf"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="accentColor">Accent Colour</Label>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                name="accentColor"
                type="color"
                defaultValue={storefront?.accentColor || "#005ba3"}
                className="w-20"
                data-testid="input-accent-color"
              />
              <Input
                type="text"
                defaultValue={storefront?.accentColor || "#005ba3"}
                placeholder="#005ba3"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="isActive" className="text-base">Store Status</Label>
            <p className="text-sm text-muted-foreground">
              {isActive ? "Your storefront is currently active and visible to customers" : "Your storefront is currently inactive and hidden from customers"}
            </p>
          </div>
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
            data-testid="switch-store-status"
          />
          <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit">
          {isLoading ? "Saving..." : storefront ? "Update Storefront" : "Create Storefront"}
        </Button>
      </form>
    </>
  );
}
