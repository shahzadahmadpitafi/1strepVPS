import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Warehouse as WarehouseIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  Loader2,
  Building2,
  Star,
  Search,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Warehouse, WarehouseInventory, StockTransfer, Product } from "@shared/schema";

interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  capacity: number | null;
  isActive: boolean;
  isPrimary: boolean;
  notes: string;
}

interface InventoryWithProduct extends WarehouseInventory {
  productName?: string;
  productSku?: string;
  productImage?: string;
}

interface TransferWithDetails extends StockTransfer {
  fromWarehouseName?: string;
  toWarehouseName?: string;
}

const defaultFormData: WarehouseFormData = {
  name: "",
  code: "",
  address: "",
  city: "",
  postalCode: "",
  country: "UK",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  capacity: null,
  isActive: true,
  isPrimary: false,
  notes: "",
};

export default function AdminWarehouses() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("warehouses");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteWarehouse, setDeleteWarehouse] = useState<Warehouse | null>(null);
  const [viewingInventory, setViewingInventory] = useState<string | null>(null);
  const [formData, setFormData] = useState<WarehouseFormData>(defaultFormData);
  const [searchTerm, setSearchTerm] = useState("");

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    notes: "",
    items: [] as { productId: string; variantId: string; size: string; color: string; quantity: number }[]
  });
  const [productVariantsCache, setProductVariantsCache] = useState<Record<string, any[]>>({});

  const { data: warehouses, isLoading: warehousesLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/admin/warehouses"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stockTransfers, isLoading: transfersLoading } = useQuery<TransferWithDetails[]>({
    queryKey: ["/api/admin/stock-transfers"],
  });

  const { data: warehouseInventory, isLoading: inventoryLoading } = useQuery<InventoryWithProduct[]>({
    queryKey: [`/api/admin/warehouses/${viewingInventory}/inventory`],
    enabled: !!viewingInventory,
  });

  // Fetch source warehouse inventory for stock transfers
  const { data: sourceWarehouseInventory } = useQuery<InventoryWithProduct[]>({
    queryKey: [`/api/admin/warehouses/${transferData.fromWarehouseId}/inventory`],
    enabled: !!transferData.fromWarehouseId,
  });

  // Fetch real variants for a product and cache them
  const fetchProductVariants = async (productId: string) => {
    if (!productId || productVariantsCache[productId]) return;
    try {
      const res = await fetch(`/api/products/${productId}/variants`);
      if (res.ok) {
        const variants = await res.json();
        setProductVariantsCache(prev => ({ ...prev, [productId]: variants }));
      }
    } catch (e) {
      console.error('Failed to fetch variants for product', productId, e);
    }
  };

  // Helper to get available quantity for a product/variantId/size/color combo in source warehouse
  const getAvailableStock = (productId: string, variantId: string, size: string, color: string): number => {
    if (!sourceWarehouseInventory) return 0;
    const rows = sourceWarehouseInventory.filter(inv => inv.productId === productId);
    if (!rows.length) return 0;

    // Try exact match by size + colour first
    if (size || color) {
      const match = rows.find(inv => (inv.size || '') === size && (inv.color || '') === color);
      if (match) return (match.quantity || 0) - (match.reservedQuantity || 0);
    }

    // If inventory rows have no size/colour breakdown, return the total pool
    const hasBreakdown = rows.some(inv => inv.size || inv.color);
    if (!hasBreakdown) {
      return rows.reduce((sum, inv) => sum + (inv.quantity || 0) - (inv.reservedQuantity || 0), 0);
    }

    return 0;
  };

  // Get unique products available in source warehouse
  const availableProducts = sourceWarehouseInventory?.reduce((acc, inv) => {
    if (!acc.find(p => p.productId === inv.productId)) {
      const product = products?.find(p => p.id === inv.productId);
      if (product) {
        acc.push({
          productId: inv.productId,
          productName: product.name,
          totalQuantity: sourceWarehouseInventory
            .filter(i => i.productId === inv.productId)
            .reduce((sum, i) => sum + (i.quantity || 0) - (i.reservedQuantity || 0), 0)
        });
      }
    }
    return acc;
  }, [] as { productId: string; productName: string; totalQuantity: number }[]) || [];

  // Get available sizes/variants for a product in source warehouse.
  // When the inventory has no per-variant breakdown (size/colour both empty),
  // fall back to the product's real variants from the product_variants table.
  const getAvailableSizesForProduct = (productId: string) => {
    if (!sourceWarehouseInventory) return [];
    const rows = sourceWarehouseInventory.filter(
      inv => inv.productId === productId && (inv.quantity || 0) > (inv.reservedQuantity || 0)
    );

    const hasBreakdown = rows.some(inv => inv.size || inv.color);

    if (hasBreakdown) {
      // Normal case: inventory is already split by variant
      return rows.map(inv => ({
        variantId: (inv as any).variantId || '',
        size: inv.size || '',
        color: inv.color || '',
        available: (inv.quantity || 0) - (inv.reservedQuantity || 0)
      }));
    }

    // No variant breakdown — use real product variants if fetched
    const totalAvailable = rows.reduce(
      (sum, inv) => sum + (inv.quantity || 0) - (inv.reservedQuantity || 0), 0
    );
    const variants = productVariantsCache[productId];
    if (variants && variants.length > 0) {
      return variants.map((v: any) => ({
        variantId: v.id || '',
        size: v.size || '',
        color: v.color || '',
        available: totalAvailable
      }));
    }

    // Fallback: show a single "All stock" row until variants load
    return rows.map(inv => ({
      variantId: '',
      size: inv.size || '',
      color: inv.color || '',
      available: totalAvailable
    }));
  };

  const { data: warehouseStats } = useQuery<any[]>({
    queryKey: ["/api/admin/warehouses/stats/summary"],
  });

  const createMutation = useMutation({
    mutationFn: (data: WarehouseFormData) => apiRequest("POST", "/api/admin/warehouses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warehouses"] });
      setIsCreateOpen(false);
      setFormData(defaultFormData);
      toast({ title: "Warehouse created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create warehouse", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarehouseFormData> }) => 
      apiRequest("PATCH", `/api/admin/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warehouses"] });
      setEditingWarehouse(null);
      setFormData(defaultFormData);
      toast({ title: "Warehouse updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update warehouse", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warehouses"] });
      setDeleteWarehouse(null);
      toast({ title: "Warehouse deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete warehouse", variant: "destructive" });
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: typeof transferData) => apiRequest("POST", "/api/admin/stock-transfers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-transfers"] });
      setIsTransferOpen(false);
      setTransferData({ fromWarehouseId: "", toWarehouseId: "", notes: "", items: [] });
      toast({ title: "Stock transfer created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create transfer", variant: "destructive" });
    }
  });

  const updateTransferStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest("PATCH", `/api/admin/stock-transfers/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warehouses"] });
      toast({ title: "Transfer status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update transfer", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      city: warehouse.city,
      postalCode: warehouse.postalCode,
      country: warehouse.country,
      contactName: warehouse.contactName || "",
      contactPhone: warehouse.contactPhone || "",
      contactEmail: warehouse.contactEmail || "",
      capacity: warehouse.capacity,
      isActive: warehouse.isActive,
      isPrimary: warehouse.isPrimary,
      notes: warehouse.notes || "",
    });
  };

  const filteredWarehouses = warehouses?.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      in_transit: { variant: "outline", label: "In Transit" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" }
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Warehouse Management</h1>
          <p className="text-muted-foreground">Manage warehouse locations and inventory distribution</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="warehouses" data-testid="tab-warehouses">
            <WarehouseIcon className="w-4 h-4 mr-2" />
            Warehouses
          </TabsTrigger>
          <TabsTrigger value="transfers" data-testid="tab-transfers">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Stock Transfers
          </TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Package className="w-4 h-4 mr-2" />
            Inventory Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-warehouses"
              />
            </div>
            <Dialog open={isCreateOpen || !!editingWarehouse} onOpenChange={(open) => {
              if (!open) {
                setIsCreateOpen(false);
                setEditingWarehouse(null);
                setFormData(defaultFormData);
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-warehouse">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Warehouse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
                  <DialogDescription>
                    {editingWarehouse ? "Update warehouse details" : "Create a new warehouse location"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Warehouse Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Main Warehouse"
                        data-testid="input-warehouse-name"
                      />
                    </div>
                    <div>
                      <Label>Warehouse Code *</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="WH-LON"
                        data-testid="input-warehouse-code"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Address *</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Industrial Estate"
                      data-testid="input-warehouse-address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="London"
                        data-testid="input-warehouse-city"
                      />
                    </div>
                    <div>
                      <Label>Postal Code *</Label>
                      <Input
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="SW1A 1AA"
                        data-testid="input-warehouse-postal-code"
                      />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="UK"
                        data-testid="input-warehouse-country"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="John Smith"
                        data-testid="input-warehouse-contact-name"
                      />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+44 20 1234 5678"
                        data-testid="input-warehouse-contact-phone"
                      />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="warehouse@example.com"
                        data-testid="input-warehouse-contact-email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Capacity (max units)</Label>
                    <Input
                      type="number"
                      value={formData.capacity || ""}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="10000"
                      data-testid="input-warehouse-capacity"
                    />
                  </div>
                  
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about this warehouse..."
                      data-testid="input-warehouse-notes"
                    />
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        data-testid="switch-warehouse-active"
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.isPrimary}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                        data-testid="switch-warehouse-primary"
                      />
                      <Label>Primary Warehouse</Label>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingWarehouse(null);
                      setFormData(defaultFormData);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-warehouse"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingWarehouse ? "Update Warehouse" : "Create Warehouse"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {warehousesLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredWarehouses && filteredWarehouses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredWarehouses.map((warehouse) => {
                const stats = warehouseStats?.find(s => s.warehouseId === warehouse.id);
                return (
                  <Card key={warehouse.id} className={`${!warehouse.isActive ? 'opacity-60' : ''}`} data-testid={`card-warehouse-${warehouse.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                            {warehouse.isPrimary && (
                              <Badge variant="default" className="bg-amber-500">
                                <Star className="w-3 h-3 mr-1" />
                                Primary
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="font-mono text-xs mt-1">{warehouse.code}</CardDescription>
                        </div>
                        <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                          {warehouse.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">
                          {warehouse.address}, {warehouse.city}, {warehouse.postalCode}
                        </span>
                      </div>
                      
                      {warehouse.contactPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{warehouse.contactPhone}</span>
                        </div>
                      )}
                      
                      {warehouse.contactEmail && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{warehouse.contactEmail}</span>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-lg font-semibold">{stats?.totalItems || 0}</div>
                            <div className="text-xs text-muted-foreground">Products</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{stats?.totalQuantity || 0}</div>
                            <div className="text-xs text-muted-foreground">Units</div>
                          </div>
                          <div>
                            <div className={`text-lg font-semibold ${parseInt(stats?.lowStockItems || 0) > 0 ? 'text-amber-500' : ''}`}>
                              {stats?.lowStockItems || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Low Stock</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setViewingInventory(warehouse.id)}
                          data-testid={`button-view-inventory-${warehouse.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Stock
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openEditDialog(warehouse)}
                          data-testid={`button-edit-warehouse-${warehouse.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setDeleteWarehouse(warehouse)}
                          data-testid={`button-delete-warehouse-${warehouse.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No warehouses yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first warehouse to start tracking inventory locations
                </p>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-first-warehouse">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Warehouse
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Stock Transfers</h2>
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-transfer">
                  <Plus className="w-4 h-4 mr-2" />
                  New Transfer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create Stock Transfer</DialogTitle>
                  <DialogDescription>Move inventory between warehouses</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>From Warehouse *</Label>
                      <Select
                        value={transferData.fromWarehouseId}
                        onValueChange={(value) => setTransferData({ ...transferData, fromWarehouseId: value, items: [] })}
                      >
                        <SelectTrigger data-testid="select-from-warehouse">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses?.filter(w => w.isActive).map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>To Warehouse *</Label>
                      <Select
                        value={transferData.toWarehouseId}
                        onValueChange={(value) => setTransferData({ ...transferData, toWarehouseId: value })}
                      >
                        <SelectTrigger data-testid="select-to-warehouse">
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses?.filter(w => w.isActive && w.id !== transferData.fromWarehouseId).map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={transferData.notes}
                      onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                      placeholder="Transfer notes..."
                      data-testid="input-transfer-notes"
                    />
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Transfer Items</Label>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setTransferData({
                          ...transferData,
                          items: [...transferData.items, { productId: "", variantId: "", size: "", color: "", quantity: 1 }]
                        })}
                        disabled={!transferData.fromWarehouseId || availableProducts.length === 0}
                        data-testid="button-add-transfer-item"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    {!transferData.fromWarehouseId && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Select a source warehouse first to see available products.
                      </p>
                    )}
                    
                    {transferData.fromWarehouseId && availableProducts.length === 0 && (
                      <p className="text-sm text-amber-600 text-center py-4">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        No products available in the selected source warehouse.
                      </p>
                    )}
                    
                    {transferData.items.map((item, index) => {
                      const availableSizes = item.productId ? getAvailableSizesForProduct(item.productId) : [];
                      const currentAvailable = getAvailableStock(item.productId, item.variantId || '', item.size, item.color);
                      const isOverLimit = item.quantity > currentAvailable && currentAvailable > 0;
                      
                      return (
                        <div key={index} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Product</Label>
                              <Select
                                value={item.productId}
                                onValueChange={(value) => {
                                  const newItems = [...transferData.items];
                                  newItems[index] = { productId: value, variantId: "", size: "", color: "", quantity: 1 };
                                  setTransferData({ ...transferData, items: newItems });
                                  fetchProductVariants(value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableProducts.map((p) => (
                                    <SelectItem key={p.productId} value={p.productId}>
                                      {p.productName} ({p.totalQuantity} available)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Size/Variant</Label>
                              <Select
                                value={`${item.variantId || ''}|${item.size}|${item.color}`}
                                onValueChange={(value) => {
                                  const parts = value.split('|');
                                  const variantId = parts[0];
                                  const size = parts[1];
                                  const color = parts[2];
                                  const newItems = [...transferData.items];
                                  newItems[index].variantId = variantId;
                                  newItems[index].size = size;
                                  newItems[index].color = color;
                                  newItems[index].quantity = 1;
                                  setTransferData({ ...transferData, items: newItems });
                                }}
                                disabled={!item.productId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select size/variant" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSizes.map((s, i) => (
                                    <SelectItem key={i} value={`${s.variantId}|${s.size}|${s.color}`}>
                                      {s.size || 'All sizes'}{s.color ? ` / ${s.color}` : ''} ({s.available} available)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <Label className="text-xs">
                                Quantity 
                                {currentAvailable > 0 && (
                                  <span className="text-muted-foreground ml-1">(max: {currentAvailable})</span>
                                )}
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={currentAvailable || undefined}
                                value={item.quantity}
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value) || 1;
                                  const newItems = [...transferData.items];
                                  newItems[index].quantity = Math.min(qty, currentAvailable || qty);
                                  setTransferData({ ...transferData, items: newItems });
                                }}
                                className={isOverLimit ? "border-destructive" : ""}
                              />
                              {isOverLimit && (
                                <p className="text-xs text-destructive mt-1">
                                  Exceeds available stock ({currentAvailable})
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newItems = transferData.items.filter((_, i) => i !== index);
                                setTransferData({ ...transferData, items: newItems });
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {transferData.fromWarehouseId && availableProducts.length > 0 && transferData.items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No items added yet. Click "Add Item" to add products to this transfer.
                      </p>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createTransferMutation.mutate(transferData)}
                    disabled={createTransferMutation.isPending || !transferData.fromWarehouseId || !transferData.toWarehouseId || transferData.items.length === 0}
                    data-testid="button-create-transfer"
                  >
                    {createTransferMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Transfer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {transfersLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : stockTransfers && stockTransfers.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer #</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockTransfers.map((transfer) => (
                    <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`}>
                      <TableCell className="font-mono text-sm">{transfer.transferNumber}</TableCell>
                      <TableCell>{transfer.fromWarehouseName || transfer.fromWarehouseId}</TableCell>
                      <TableCell>{transfer.toWarehouseName || transfer.toWarehouseId}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {transfer.status === "pending" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateTransferStatusMutation.mutate({ id: transfer.id, status: "approved" })}
                              data-testid={`button-approve-transfer-${transfer.id}`}
                            >
                              Approve
                            </Button>
                          )}
                          {transfer.status === "approved" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateTransferStatusMutation.mutate({ id: transfer.id, status: "in_transit" })}
                              data-testid={`button-ship-transfer-${transfer.id}`}
                            >
                              Ship
                            </Button>
                          )}
                          {transfer.status === "in_transit" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateTransferStatusMutation.mutate({ id: transfer.id, status: "completed" })}
                              data-testid={`button-complete-transfer-${transfer.id}`}
                            >
                              Complete
                            </Button>
                          )}
                          {(transfer.status === "pending" || transfer.status === "approved") && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updateTransferStatusMutation.mutate({ id: transfer.id, status: "cancelled" })}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowRightLeft className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No stock transfers</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create a transfer to move inventory between warehouses
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-lg font-semibold">Inventory Overview by Warehouse</h2>
          
          {warehouseStats && warehouseStats.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {warehouseStats.map((stat) => (
                <Card key={stat.warehouseId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{stat.warehouseName}</CardTitle>
                    <CardDescription className="font-mono text-xs">{stat.warehouseCode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{stat.totalQuantity || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Units</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stat.totalItems || 0}</div>
                        <div className="text-xs text-muted-foreground">Product Lines</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stat.reservedQuantity || 0}</div>
                        <div className="text-xs text-muted-foreground">Reserved</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${parseInt(stat.lowStockItems || 0) > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                          {stat.lowStockItems || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Low Stock Alerts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No inventory data</h3>
                <p className="text-muted-foreground text-center">
                  Add inventory to your warehouses to see the overview
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingInventory} onOpenChange={(open) => !open && setViewingInventory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Warehouse Inventory</DialogTitle>
            <DialogDescription>
              View and manage stock in {warehouses?.find(w => w.id === viewingInventory)?.name}
            </DialogDescription>
          </DialogHeader>
          
          {inventoryLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : warehouseInventory && warehouseInventory.filter(item => item.productName).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseInventory.filter(item => item.productName).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.size || "-"}</TableCell>
                    <TableCell>{item.color || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{item.location || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.reservedQuantity}</TableCell>
                    <TableCell>
                      {item.quantity <= item.minStockLevel ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No inventory in this warehouse</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteWarehouse} onOpenChange={(open) => !open && setDeleteWarehouse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteWarehouse?.name}"? This action cannot be undone.
              Make sure there is no inventory in this warehouse before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteWarehouse && deleteMutation.mutate(deleteWarehouse.id)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
