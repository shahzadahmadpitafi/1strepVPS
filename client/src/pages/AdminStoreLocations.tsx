import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  Clock,
  Loader2,
  Store,
  Eye,
  EyeOff,
  GripVertical
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompanyStore {
  id: string;
  name: string;
  address: string;
  phone?: string;
  hours?: string;
  features?: string[];
  imageUrl?: string;
  mapUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoreFormData {
  name: string;
  address: string;
  phone: string;
  hours: string;
  features: string[];
  imageUrl: string;
  mapUrl: string;
  displayOrder: number;
  isActive: boolean;
}

const defaultFormData: StoreFormData = {
  name: "",
  address: "",
  phone: "",
  hours: "",
  features: [],
  imageUrl: "",
  mapUrl: "",
  displayOrder: 0,
  isActive: true,
};

export default function AdminStoreLocations() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<CompanyStore | null>(null);
  const [deleteStore, setDeleteStore] = useState<CompanyStore | null>(null);
  const [formData, setFormData] = useState<StoreFormData>(defaultFormData);
  const [featureInput, setFeatureInput] = useState("");

  const { data: stores = [], isLoading } = useQuery<CompanyStore[]>({
    queryKey: ["/api/admin/company-stores"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      const res = await apiRequest("POST", "/api/admin/company-stores", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-stores"] });
      toast({ title: "Store created successfully" });
      setIsCreateOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create store", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StoreFormData> }) => {
      const res = await apiRequest("PATCH", `/api/admin/company-stores/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-stores"] });
      toast({ title: "Store updated successfully" });
      setEditingStore(null);
      setFormData(defaultFormData);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update store", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/company-stores/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-stores"] });
      toast({ title: "Store deleted successfully" });
      setDeleteStore(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete store", description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/company-stores/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-stores"] });
    },
  });

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setFeatureInput("");
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (store: CompanyStore) => {
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone || "",
      hours: store.hours || "",
      features: store.features || [],
      imageUrl: store.imageUrl || "",
      mapUrl: store.mapUrl || "",
      displayOrder: store.displayOrder,
      isActive: store.isActive,
    });
    setFeatureInput("");
    setEditingStore(store);
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((f) => f !== feature),
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      toast({ title: "Name and address are required", variant: "destructive" });
      return;
    }

    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Store Locations</h2>
          <p className="text-muted-foreground">
            Manage your 1stRep retail store locations displayed on the Store Locator page
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-store">
          <Plus className="mr-2 h-4 w-4" />
          Add Store
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Company Stores ({stores.length})
          </CardTitle>
          <CardDescription>
            These are your own retail locations, separate from reseller stores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stores.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No stores yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first store location to display on the Store Locator page
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Store
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id} data-testid={`row-store-${store.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span>{store.displayOrder}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{store.address}</TableCell>
                    <TableCell>{store.phone || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{store.hours || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={store.isActive}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: store.id, isActive: checked })
                          }
                          data-testid={`switch-store-active-${store.id}`}
                        />
                        <Badge variant={store.isActive ? "default" : "secondary"}>
                          {store.isActive ? (
                            <><Eye className="h-3 w-3 mr-1" /> Visible</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" /> Hidden</>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(store)}
                          data-testid={`button-edit-store-${store.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteStore(store)}
                          data-testid={`button-delete-store-${store.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={isCreateOpen || !!editingStore} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingStore(null);
          setFormData(defaultFormData);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStore ? "Edit Store" : "Add New Store"}</DialogTitle>
            <DialogDescription>
              {editingStore 
                ? "Update the store location details" 
                : "Add a new retail store location to display on the Store Locator page"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 1stRep London Flagship"
                  data-testid="input-store-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +44 20 1234 5678"
                  data-testid="input-store-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 123 Oxford Street, London, W1D 1BT"
                rows={2}
                data-testid="input-store-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Opening Hours</Label>
              <Input
                id="hours"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="e.g. Mon-Sat: 9am-7pm, Sun: 11am-5pm"
                data-testid="input-store-hours"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Store Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-store-image"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapUrl">Google Maps URL</Label>
                <Input
                  id="mapUrl"
                  value={formData.mapUrl}
                  onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  data-testid="input-store-map"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Store Features</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="e.g. Click & Collect, Free Parking"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                  data-testid="input-store-feature"
                />
                <Button type="button" variant="secondary" onClick={handleAddFeature}>
                  Add
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature) => (
                    <Badge
                      key={feature}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveFeature(feature)}
                    >
                      {feature} &times;
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-store-order"
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-store-form-active"
                />
                <Label htmlFor="isActive">Visible on Store Locator</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingStore(null);
                setFormData(defaultFormData);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-store"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingStore ? "Update Store" : "Create Store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteStore} onOpenChange={(open) => !open && setDeleteStore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteStore?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStore && deleteMutation.mutate(deleteStore.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
