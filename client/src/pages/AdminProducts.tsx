import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Package, Download, Upload, RefreshCw, Search, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import BulkOperationsModal from "@/components/admin/BulkOperationsModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ModernProductForm from "@/components/admin/ModernProductForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { convertToDirectUrl } from "@/lib/imageUtils";

type Product = {
  id: string;
  name: string;
  description: string;
  retailPrice: string;
  wholesalePrice: string;
  costPrice: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  imageUrl: string;
  sku: string;
  sizes: string[];
  colors: string[];
  isActive: boolean;
  availabilityStatus: 'available' | 'upcoming' | 'out_of_stock' | 'discontinued';
};

type ProductImage = {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

type ProductVariant = {
  id: string;
  productId: string;
  size: string;
  color: string;
  price: string;
};

export default function AdminProducts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Hard delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [productToDelete, setProductToDelete] = useState<{id: string; name: string} | null>(null);
  
  const { toast } = useToast();

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedProductIds([]);
  };

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products/all"],
  });

  // Export products to JSON file
  const handleExport = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/admin/products/export", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export products");
      }
      
      const exportData = await response.json();
      
      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Exported ${exportData.productCount} products successfully. Use this file to import on your production site.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Import products from JSON
  const handleImport = async () => {
    try {
      setIsSyncing(true);
      
      let parsedData;
      try {
        parsedData = JSON.parse(importData);
      } catch (e) {
        throw new Error("Invalid JSON format. Please paste valid export data.");
      }
      
      if (!parsedData.data || !Array.isArray(parsedData.data)) {
        throw new Error("Invalid export format. Missing 'data' array.");
      }
      
      const response = await apiRequest("POST", "/api/admin/products/import", {
        data: parsedData.data,
      });
      
      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      // Also invalidate public products cache
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Show success or errors
      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Import Completed with Errors",
          description: `${result.message}\n\nErrors:\n${result.errors.join('\n')}`,
          variant: "destructive",
        });
        console.error("Import errors:", result.errors);
      } else {
        toast({
          title: "Import Complete",
          description: result.message,
        });
      }
      
      setShowImportDialog(false);
      setImportData("");
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle file upload for import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportData(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  // Filter products based on availability status
  const filteredProducts = products.filter(product => {
    // Filter by availability
    if (availabilityFilter !== 'all' && product.availabilityStatus !== availabilityFilter) {
      return false;
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Product has been removed successfully",
      });
      // Close dialog and reset state
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      setDeleteConfirmText("");
    },
  });

  // Opens the delete confirmation dialog
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete({ id: product.id, name: product.name });
    setDeleteConfirmText("");
    setDeleteConfirmOpen(true);
  };

  // Actually performs the deletion after confirmation
  const confirmDeleteProduct = () => {
    if (!productToDelete || deleteConfirmText !== "DELETE") return;
    deleteProductMutation.mutate(productToDelete.id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Product Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage your product catalogue with real-time updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync/Export/Import Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isSyncing} data-testid="button-sync-menu">
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport} data-testid="button-export-products">
                <Download className="w-4 h-4 mr-2" />
                Export Products
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowImportDialog(true)} data-testid="button-import-products">
                <Upload className="w-4 h-4 mr-2" />
                Import Products
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedProductIds.length > 0 && (
            <Button 
              onClick={() => setShowBulkModal(true)}
              variant="secondary"
              data-testid="button-bulk-operations"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Bulk Actions ({selectedProductIds.length})
            </Button>
          )}

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product with complete details, pricing, media, and variants
              </DialogDescription>
            </DialogHeader>
            <ModernProductForm
              onSuccess={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Import Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Import Products</AlertDialogTitle>
            <AlertDialogDescription>
              Import products from an export file. This will add new products and update existing ones (matched by SKU).
              Existing variants and images will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="import-file">Upload Export File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-2"
                data-testid="input-import-file"
              />
            </div>
            
            <div>
              <Label htmlFor="import-data">Or Paste Export JSON</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder='Paste the contents of your export file here...'
                className="mt-2 h-48 font-mono text-xs"
                data-testid="textarea-import-data"
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-import">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleImport} 
              disabled={!importData || isSyncing}
              data-testid="button-confirm-import"
            >
              {isSyncing ? "Importing..." : "Import Products"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Products</CardTitle>
              <CardDescription>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                {searchQuery.trim() && ` matching "${searchQuery}"`}
                {availabilityFilter !== 'all' && ` (filtered by ${availabilityFilter === 'available' ? 'Available' : availabilityFilter === 'upcoming' ? 'Upcoming' : availabilityFilter === 'out_of_stock' ? 'Out of Stock' : 'Discontinued'})`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                  data-testid="input-search-products"
                />
              </div>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-availability">
                  <SelectValue placeholder="Filter by availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {availabilityFilter !== 'all' 
                  ? `No ${availabilityFilter === 'available' ? 'available' : availabilityFilter === 'upcoming' ? 'upcoming' : availabilityFilter === 'out_of_stock' ? 'out of stock' : 'discontinued'} products found.`
                  : 'No products found. Create your first product to get started.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Retail</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        aria-label={`Select ${product.name}`}
                        data-testid={`checkbox-product-${product.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <img
                        src={convertToDirectUrl(product.imageUrl) || "https://via.placeholder.com/100"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        data-testid={`img-product-${product.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </TableCell>
                    <TableCell data-testid={`text-product-sku-${product.id}`}>
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-category-${product.id}`}>
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-retail-price-${product.id}`}>
                      £{parseFloat(product.retailPrice).toFixed(2)}
                    </TableCell>
                    <TableCell data-testid={`text-cost-price-${product.id}`} className="text-orange-600">
                      £{(parseFloat(product.costPrice) || 0).toFixed(2)}
                    </TableCell>
                    <TableCell data-testid={`text-margin-${product.id}`}>
                      {(() => {
                        const retail = parseFloat(product.retailPrice) || 0;
                        const cost = parseFloat(product.costPrice) || 0;
                        const margin = retail > 0 ? ((retail - cost) / retail) * 100 : 0;
                        return (
                          <Badge variant={margin >= 30 ? "default" : margin >= 15 ? "secondary" : "destructive"}>
                            {margin.toFixed(1)}%
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {product.sizes && product.sizes.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {product.sizes.length} sizes
                          </span>
                        )}
                        {product.colors && product.colors.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {product.colors.length} colors
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          product.availabilityStatus === 'available' 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : product.availabilityStatus === 'upcoming'
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : product.availabilityStatus === 'out_of_stock'
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }
                        data-testid={`badge-availability-${product.id}`}
                      >
                        {product.availabilityStatus === 'available' ? 'Available' 
                          : product.availabilityStatus === 'upcoming' ? 'Upcoming'
                          : product.availabilityStatus === 'out_of_stock' ? 'Out of Stock'
                          : 'Discontinued'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={product.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }
                        data-testid={`badge-status-${product.id}`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProduct(product)}
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>
                                Update product information, images, pricing, and media
                              </DialogDescription>
                            </DialogHeader>
                            <ModernProductForm
                              product={editingProduct}
                              onSuccess={() => setEditingProduct(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BulkOperationsModal
        open={showBulkModal}
        onOpenChange={setShowBulkModal}
        selectedProductIds={selectedProductIds}
        onSuccess={clearSelection}
      />

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Product Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to permanently delete{" "}
                <strong>"{productToDelete?.name}"</strong>.
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone. All variants, stock data, and order history references will be affected.
              </p>
              <p>
                To confirm, please type <strong>DELETE</strong> below:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE to confirm"
                className="mt-2"
                data-testid="input-delete-product-confirm"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteConfirmOpen(false);
                setProductToDelete(null);
                setDeleteConfirmText("");
              }}
              data-testid="button-cancel-delete-product"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={deleteConfirmText !== "DELETE" || deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-product"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
