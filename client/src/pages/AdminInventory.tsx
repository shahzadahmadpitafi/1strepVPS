import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Pencil, Barcode, RefreshCw, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import InventoryManager from "@/components/InventoryManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type InventoryItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  category: string;
  size: string;
  color: string;
  sku: string | null;
  barcodeDescriptor: string | null;
  locationNote: string | null;
  stockQuantity: number;
  retailPrice: string;
  wholesalePrice: string;
  isActive: boolean;
};

export default function AdminInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVariant, setEditingVariant] = useState<InventoryItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [barcodeDescriptor, setBarcodeDescriptor] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const { toast } = useToast();

  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: allProducts = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ["/api/admin/products/all"],
  });

  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, stockQuantity, barcodeDescriptor, locationNote, retailPrice, wholesalePrice }: { 
      id: string; 
      stockQuantity: number; 
      barcodeDescriptor?: string;
      locationNote?: string;
      retailPrice?: string;
      wholesalePrice?: string;
    }) => {
      return await apiRequest("PATCH", `/api/product-variants/${id}`, { stockQuantity, barcodeDescriptor, locationNote, retailPrice, wholesalePrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Variant Updated",
        description: "Stock and barcode descriptor have been updated successfully.",
      });
      setEditDialogOpen(false);
      setEditingVariant(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update variant",
        variant: "destructive",
      });
    },
  });

  const syncInventoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/sync-inventory-to-variants");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Inventory Synced",
        description: data.message || `Successfully synced ${data.synced} products to their variants`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync inventory",
        variant: "destructive",
      });
    },
  });

  const filteredInventory = inventory.filter((item) =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.size.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by product
  const groupedInventory = filteredInventory.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        productImage: item.productImage,
        category: item.category,
        variants: [],
        totalStock: 0,
        lowStockCount: 0,
      };
    }
    acc[item.productId].variants.push(item);
    acc[item.productId].totalStock += item.stockQuantity;
    if (item.stockQuantity <= 10) {
      acc[item.productId].lowStockCount++;
    }
    return acc;
  }, {} as Record<string, any>);

  const productsWithInventory = Object.values(groupedInventory);

  const handleEditStock = (variant: InventoryItem) => {
    setEditingVariant(variant);
    setStockQuantity(variant.stockQuantity.toString());
    setBarcodeDescriptor(variant.barcodeDescriptor || "");
    setLocationNote(variant.locationNote || "");
    setRetailPrice(variant.retailPrice || "");
    setWholesalePrice(variant.wholesalePrice || "");
    setEditDialogOpen(true);
  };

  const handleUpdateStock = () => {
    if (!editingVariant) return;
    
    const quantity = parseInt(stockQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid stock quantity",
        variant: "destructive",
      });
      return;
    }

    const retail = parseFloat(retailPrice);
    const wholesale = parseFloat(wholesalePrice);
    
    if (isNaN(retail) || retail < 0) {
      toast({
        title: "Invalid Retail Price",
        description: "Please enter a valid retail price",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(wholesale) || wholesale < 0) {
      toast({
        title: "Invalid Wholesale Price",
        description: "Please enter a valid wholesale price",
        variant: "destructive",
      });
      return;
    }

    updateVariantMutation.mutate({
      id: editingVariant.id,
      stockQuantity: quantity,
      barcodeDescriptor: barcodeDescriptor || undefined,
      locationNote: locationNote || undefined,
      retailPrice: retailPrice,
      wholesalePrice: wholesalePrice,
    });
  };

  if (isLoading || loadingProducts) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get products with variants
  const productsWithVariantsIds = new Set(inventory.map(item => item.productId));
  const productsWithoutVariants = allProducts.filter(p => !productsWithVariantsIds.has(p.id));
  const totalProductCount = allProducts.length;
  const productsWithVariantsCount = productsWithVariantsIds.size;
  const totalVariantCount = inventory.length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Inventory Management</h2>
          <div className="flex gap-4 mt-2">
            <p className="text-sm text-muted-foreground" data-testid="text-total-products">
              Total Products: <span className="font-semibold text-foreground">{totalProductCount}</span>
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-products-with-variants">
              With Variants: <span className="font-semibold text-foreground">{productsWithVariantsCount}</span>
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-total-variants">
              Total Variants: <span className="font-semibold text-foreground">{totalVariantCount}</span>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Levels</TabsTrigger>
          <TabsTrigger value="barcode" className="flex items-center gap-2">
            <Barcode className="w-4 h-4" />
            Generate Barcodes
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Barcode className="w-4 h-4" />
            Scan Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-inventory"
              />
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  data-testid="button-sync-inventory"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync All Inventory
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sync Warehouse Inventory to Product Variants</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will update all product variant stock quantities based on the total warehouse inventory for each product. 
                    This ensures the EPOS and storefront show correct stock availability.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => syncInventoryMutation.mutate()}
                    disabled={syncInventoryMutation.isPending}
                    data-testid="button-confirm-sync"
                  >
                    {syncInventoryMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Sync Inventory'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

      {productsWithoutVariants.length > 0 && (
        <Card className="mb-6 border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="destructive">{productsWithoutVariants.length}</Badge>
              Products Missing Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These products don't have any size/colour variants configured yet. Add variants from the Products page to track inventory.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {productsWithoutVariants.slice(0, 12).map((product: any) => (
                <div key={product.id} className="text-sm p-2 bg-muted rounded">
                  {product.name}
                </div>
              ))}
              {productsWithoutVariants.length > 12 && (
                <div className="text-sm p-2 bg-muted rounded text-center text-muted-foreground">
                  +{productsWithoutVariants.length - 12} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {productsWithInventory.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No inventory found</p>
              <p className="text-sm text-muted-foreground">
                Add product variants from the Products page to track inventory
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {productsWithInventory.map((product: any) => (
            <Card key={product.productId} data-testid={`inventory-card-${product.productId}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.productImage || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"}
                      alt={product.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <CardTitle>{product.productName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.productSku}</p>
                      <Badge variant="outline" className="mt-1">{product.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{product.totalStock}</p>
                    <p className="text-sm text-muted-foreground">Total Stock</p>
                    {product.lowStockCount > 0 && (
                      <Badge variant="destructive" className="mt-2">
                        {product.lowStockCount} Low Stock
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Colour</TableHead>
                      <TableHead>Stock Quantity</TableHead>
                      <TableHead>Retail Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((variant: InventoryItem) => (
                      <TableRow key={variant.id}>
                        <TableCell className="font-medium">{variant.size || "-"}</TableCell>
                        <TableCell>{variant.color || "-"}</TableCell>
                        <TableCell className="font-medium">{variant.stockQuantity}</TableCell>
                        <TableCell>£{parseFloat(variant.retailPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          {variant.stockQuantity === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : variant.stockQuantity <= 10 ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : variant.stockQuantity <= 25 ? (
                            <Badge variant="secondary">Medium Stock</Badge>
                          ) : (
                            <Badge className="bg-green-600">Good Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {variant.locationNote || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStock(variant)}
                            data-testid={`button-edit-stock-${variant.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="barcode">
          <BarcodeGenerator />
        </TabsContent>

        <TabsContent value="scanner">
          <InventoryManager />
        </TabsContent>
      </Tabs>

      {/* Edit Variant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
          </DialogHeader>
          {editingVariant && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{editingVariant.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Size: {editingVariant.size} | Colour: {editingVariant.color || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  SKU: {editingVariant.sku || "Auto-generated"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  data-testid="input-stock-quantity"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retailPrice">Retail Price (£)</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    data-testid="input-retail-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Wholesale Price (£)</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    data-testid="input-wholesale-price"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Set different prices for this size/colour combination. For example, larger sizes or special colours can have different pricing.
              </p>
              <div className="space-y-2">
                <Label htmlFor="barcodeDescriptor">Barcode Descriptor</Label>
                <Input
                  id="barcodeDescriptor"
                  type="text"
                  placeholder="Custom barcode code for this variant (e.g., HOODY-LILAC-L)"
                  value={barcodeDescriptor}
                  onChange={(e) => setBarcodeDescriptor(e.target.value)}
                  data-testid="input-barcode-descriptor"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a unique barcode code for this specific size/colour variant. This will be used when generating barcodes.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationNote">Storage Location</Label>
                <Input
                  id="locationNote"
                  type="text"
                  placeholder="e.g., Shelf A3, Box 2 or Warehouse B - Aisle 5"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  data-testid="input-location-note"
                />
                <p className="text-xs text-muted-foreground">
                  Where is this product stored? This note will appear on order printouts to help locate items.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateStock}
                  disabled={updateVariantMutation.isPending}
                  data-testid="button-save-variant"
                >
                  {updateVariantMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
