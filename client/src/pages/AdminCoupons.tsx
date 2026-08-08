import { useState, useRef, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Tag, TrendingUp, ChevronDown, Check, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Coupon = {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: string;
  minimumOrderTotal: string;
  startDate: string;
  endDate: string;
  maxGlobalUses: number | null;
  maxUsesPerCustomer: number;
  currentUses: number;
  firstOrderOnly: boolean;
  vendorId: string | null;
  vendorName?: string;
  productId: string | null;
  productName?: string;
  productIds: string[] | null;
  productNames?: string[];
  isActive: boolean;
  createdAt: string;
};

type Vendor = {
  id: string;
  businessName: string;
  approvalStatus: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
};

export default function AdminCoupons() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({
        title: "Coupon deleted",
        description: "Coupon has been permanently deleted.",
      });
    },
  });

  const getCouponTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Percentage";
      case "fixed_amount":
        return "Fixed Amount";
      case "free_shipping":
        return "Free Shipping";
      default:
        return type;
    }
  };

  const getCouponValueDisplay = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
      return `${parseFloat(coupon.value)}%`;
    } else if (coupon.type === "fixed_amount") {
      return `£${parseFloat(coupon.value).toFixed(2)}`;
    } else {
      return "Free Shipping";
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const isActive = (coupon: Coupon) => {
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    return coupon.isActive && now >= start && now <= end;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Coupon Management</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage discount codes and promotions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-coupon">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Set up a new discount code or promotion
              </DialogDescription>
            </DialogHeader>
            <CouponForm
              onSuccess={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-muted-foreground">Loading coupons...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No coupons found. Create your first coupon to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Restriction</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id} data-testid={`row-coupon-${coupon.id}`}>
                    <TableCell className="font-mono font-semibold" data-testid={`text-coupon-code-${coupon.id}`}>
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCouponTypeLabel(coupon.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {getCouponValueDisplay(coupon)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const ids = (coupon.productIds && coupon.productIds.length > 0) ? coupon.productIds : (coupon.productId ? [coupon.productId] : []);
                          const names = (coupon.productNames && coupon.productNames.length > 0) ? coupon.productNames : (coupon.productName ? [coupon.productName] : []);
                          if (ids.length > 0) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                {names.slice(0, 2).map((n, i) => (
                                  <Badge key={i} variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                    {n}
                                  </Badge>
                                ))}
                                {names.length > 2 && <span className="text-muted-foreground text-xs">+{names.length - 2} more</span>}
                                {names.length === 0 && <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">{ids.length} product{ids.length > 1 ? 's' : ''}</Badge>}
                              </div>
                            );
                          }
                          if (coupon.vendorId) {
                            return (
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {coupon.vendorName || 'Wholesaler'}
                              </Badge>
                            );
                          }
                          return <span className="text-muted-foreground text-sm">All products</span>;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <div>{format(new Date(coupon.startDate), "MMM d, yyyy")}</div>
                        <div className="text-muted-foreground">
                          to {format(new Date(coupon.endDate), "MMM d, yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {coupon.currentUses}
                        {coupon.maxGlobalUses && ` / ${coupon.maxGlobalUses}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isActive(coupon) ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      ) : isExpired(coupon.endDate) ? (
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          Expired
                        </Badge>
                      ) : !coupon.isActive ? (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Inactive
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Scheduled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCoupon(coupon)}
                              data-testid={`button-edit-${coupon.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Coupon</DialogTitle>
                              <DialogDescription>
                                Update coupon details and settings
                              </DialogDescription>
                            </DialogHeader>
                            <CouponForm
                              coupon={editingCoupon}
                              onSuccess={() => setEditingCoupon(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to permanently delete this coupon? This cannot be undone.")) {
                              deleteCouponMutation.mutate(coupon.id);
                            }
                          }}
                          data-testid={`button-delete-${coupon.id}`}
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
    </div>
  );
}

function CouponForm({ coupon, onSuccess }: { coupon?: Coupon | null; onSuccess: () => void }) {
  const initialProductIds = (() => {
    if (coupon?.productIds && coupon.productIds.length > 0) return coupon.productIds;
    if (coupon?.productId) return [coupon.productId];
    return [];
  })();

  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    description: coupon?.description || "",
    type: coupon?.type || "percentage",
    value: coupon?.value || "",
    minimumOrderTotal: coupon?.minimumOrderTotal || "0",
    startDate: coupon?.startDate ? format(new Date(coupon.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    endDate: coupon?.endDate ? format(new Date(coupon.endDate), "yyyy-MM-dd") : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    maxGlobalUses: coupon?.maxGlobalUses?.toString() || "",
    maxUsesPerCustomer: coupon?.maxUsesPerCustomer?.toString() || "1",
    firstOrderOnly: coupon?.firstOrderOnly ?? false,
    vendorId: coupon?.vendorId || "",
    productIds: initialProductIds as string[],
    isActive: coupon?.isActive ?? true,
  });
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch vendors for the dropdown
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  // Fetch products for the product restriction dropdown
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=500");
      const data = await res.json();
      return (data.products || data || []).filter((p: Product) => p.isActive !== false);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        ...data,
        value: data.value,
        minimumOrderTotal: data.minimumOrderTotal || "0",
        maxGlobalUses: data.maxGlobalUses ? parseInt(data.maxGlobalUses) : null,
        maxUsesPerCustomer: parseInt(data.maxUsesPerCustomer) || 1,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        vendorId: data.vendorId || null,
        productId: data.productIds.length === 1 ? data.productIds[0] : null, // keep legacy field in sync
        productIds: data.productIds.length > 0 ? data.productIds : null,
      };

      if (coupon) {
        return apiRequest("PATCH", `/api/admin/coupons/${coupon.id}`, payload);
      }
      return apiRequest("POST", "/api/admin/coupons", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({
        title: coupon ? "Coupon updated" : "Coupon created",
        description: coupon ? "Coupon has been updated successfully" : "New coupon has been created",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save coupon",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              placeholder="SUMMER25"
              data-testid="input-coupon-code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Discount Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger data-testid="select-coupon-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage Discount</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                <SelectItem value="free_shipping">Free Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="25% off summer collection"
            rows={2}
            data-testid="input-coupon-description"
          />
        </div>
      </div>

      {/* Discount Value */}
      {formData.type !== "free_shipping" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Discount Value</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                {formData.type === "percentage" ? "Percentage (%)" : "Amount (£)"} *
              </Label>
              <Input
                id="value"
                type="number"
                step={formData.type === "percentage" ? "1" : "0.01"}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
                placeholder={formData.type === "percentage" ? "25" : "10.00"}
                data-testid="input-coupon-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumOrderTotal">Minimum Order Value (£)</Label>
              <Input
                id="minimumOrderTotal"
                type="number"
                step="0.01"
                value={formData.minimumOrderTotal}
                onChange={(e) => setFormData({ ...formData, minimumOrderTotal: e.target.value })}
                placeholder="0.00"
                data-testid="input-minimum-order"
              />
            </div>
          </div>
        </div>
      )}

      {/* Validity Period */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Validity Period</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              data-testid="input-start-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              data-testid="input-end-date"
            />
          </div>
        </div>
      </div>

      {/* Usage Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Usage Limits</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxGlobalUses">Total Usage Limit</Label>
            <Input
              id="maxGlobalUses"
              type="number"
              value={formData.maxGlobalUses}
              onChange={(e) => setFormData({ ...formData, maxGlobalUses: e.target.value })}
              placeholder="Unlimited"
              data-testid="input-max-uses"
            />
            <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUsesPerCustomer">Uses Per Customer *</Label>
            <Input
              id="maxUsesPerCustomer"
              type="number"
              value={formData.maxUsesPerCustomer}
              onChange={(e) => setFormData({ ...formData, maxUsesPerCustomer: e.target.value })}
              required
              data-testid="input-max-per-customer"
            />
          </div>
        </div>
      </div>

      {/* Restrictions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Restrictions</h3>
        
        {/* Wholesaler-specific coupon */}
        <div className="space-y-2">
          <Label htmlFor="vendorId">Wholesaler Restriction (Optional)</Label>
          <Select
            value={formData.vendorId || "all"}
            onValueChange={(value) => setFormData({ ...formData, vendorId: value === "all" ? "" : value })}
          >
            <SelectTrigger data-testid="select-vendor-restriction">
              <SelectValue placeholder="Available to all customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Available to all customers</SelectItem>
              {vendors.filter((v: Vendor) => v.approvalStatus === "approved").map((vendor: Vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.businessName} (Wholesaler Only)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select a specific wholesaler to make this coupon exclusive to them. Only they will be able to use it.
          </p>
        </div>

        {/* Product-specific restriction — multi-select */}
        <div className="space-y-2">
          <Label>Product Restriction (Optional)</Label>
          <div className="relative" ref={productDropdownRef}>
            {/* Trigger */}
            <button
              type="button"
              data-testid="select-product-restriction"
              onClick={() => setProductDropdownOpen(o => !o)}
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <span className="truncate text-left">
                {formData.productIds.length === 0
                  ? "Applies to all products"
                  : formData.productIds.length === 1
                    ? (allProducts.find(p => p.id === formData.productIds[0])?.name || "1 product selected")
                    : `${formData.productIds.length} products selected`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>

            {/* Dropdown */}
            {productDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                {/* Search */}
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {/* Clear option */}
                <div className="max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, productIds: [] }))}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover-elevate"
                  >
                    <div className="flex h-4 w-4 items-center justify-center rounded border border-input">
                      {formData.productIds.length === 0 && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-muted-foreground">All products (no restriction)</span>
                  </button>
                  {allProducts
                    .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(product => {
                      const checked = formData.productIds.includes(product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setFormData(f => ({
                              ...f,
                              productIds: checked
                                ? f.productIds.filter(id => id !== product.id)
                                : [...f.productIds, product.id],
                            }));
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover-elevate"
                        >
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input">
                            {checked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="truncate">{product.name}{product.sku ? ` — ${product.sku}` : ""}</span>
                        </button>
                      );
                    })}
                </div>
                {/* Selected count footer */}
                {formData.productIds.length > 0 && (
                  <div className="border-t border-border px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formData.productIds.length} product{formData.productIds.length > 1 ? 's' : ''} selected</span>
                    <button
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, productIds: [] }))}
                      className="text-xs text-destructive hover:underline"
                    >Clear all</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Restrict this coupon to one or more products. The discount applies only to those products' line totals in the basket.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="firstOrderOnly"
            checked={formData.firstOrderOnly}
            onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
            className="rounded"
            data-testid="checkbox-first-order-only"
          />
          <Label htmlFor="firstOrderOnly">First order only (new customers only)</Label>
        </div>
        <p className="text-xs text-muted-foreground">When enabled, only customers placing their first order can use this coupon</p>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status</h3>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded"
            data-testid="checkbox-coupon-active"
          />
          <Label htmlFor="isActive">Active (coupon can be used)</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-coupon">
          {saveMutation.isPending ? "Saving..." : (coupon ? "Update Coupon" : "Create Coupon")}
        </Button>
      </DialogFooter>
    </form>
  );
}
