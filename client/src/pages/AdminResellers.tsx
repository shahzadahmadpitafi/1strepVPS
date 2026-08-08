import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, X, Edit, Store, Package, Clock, Loader2, Trash2, AlertTriangle } from "lucide-react";

export default function AdminResellers() {
  const [activeTab, setActiveTab] = useState("resellers");
  const [editingReseller, setEditingReseller] = useState<any | null>(null);
  const [rejectDialog, setRejectDialog] = useState<any | null>(null);
  const [rejectVendorDialog, setRejectVendorDialog] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveResellerDialog, setApproveResellerDialog] = useState<any | null>(null);
  const [approveVendorDialog, setApproveVendorDialog] = useState<any | null>(null);
  const [approveTrialDialog, setApproveTrialDialog] = useState<{ id: string; name: string } | null>(null);
  const [trialDaysInput, setTrialDaysInput] = useState("30");
  const [resellerCommissionRate, setResellerCommissionRate] = useState("");
  const [vendorCommissionRate, setVendorCommissionRate] = useState("");
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [deleteResellerDialog, setDeleteResellerDialog] = useState<any | null>(null);
  const { toast } = useToast();

  const { data: resellers = [], isLoading: resellersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, commissionRate }: { id: string; commissionRate?: string }) => 
      apiRequest("POST", `/api/admin/resellers/${id}/approve`, { commissionRate: commissionRate || undefined }),
    onSuccess: () => {
      toast({ title: "Reseller approved successfully" });
      setApproveResellerDialog(null);
      setResellerCommissionRate("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("POST", `/api/admin/resellers/${id}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Reseller rejected" });
      setRejectDialog(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiRequest("PATCH", `/api/admin/resellers/${id}`, updates),
    onSuccess: () => {
      toast({ title: "Reseller updated successfully" });
      setEditingReseller(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update reseller", description: error.message, variant: "destructive" });
    }
  });

  const toggleResellerStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/resellers/${id}/status`, { isActive }),
    onSuccess: (_, variables) => {
      toast({ title: `Reseller ${variables.isActive ? 'activated' : 'deactivated'} successfully` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update reseller status", description: error.message, variant: "destructive" });
    }
  });

  const deleteResellerMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/resellers/${id}`),
    onSuccess: () => {
      toast({ title: "Reseller account deleted successfully" });
      setDeleteResellerDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete reseller", description: error.message, variant: "destructive" });
    }
  });

  const updateResellerCommissionMutation = useMutation({
    mutationFn: ({ id, commissionRate }: { id: string; commissionRate?: string }) =>
      apiRequest("PATCH", `/api/admin/resellers/${id}/commission`, { commissionRate }),
    onSuccess: () => {
      toast({ title: "Reseller commission rate updated successfully" });
      setEditingReseller(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update commission rate", description: error.message, variant: "destructive" });
    }
  });

  const approveVendorMutation = useMutation({
    mutationFn: ({ id, commissionRate }: { id: string; commissionRate?: string }) => 
      apiRequest("POST", `/api/admin/vendors/${id}/approve`, { commissionRate: commissionRate || undefined }),
    onSuccess: () => {
      toast({ title: "Wholesaler approved successfully" });
      setApproveVendorDialog(null);
      setVendorCommissionRate("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, commissionRate, canAddOwnProducts }: { id: string; commissionRate?: string; canAddOwnProducts?: boolean }) =>
      apiRequest("PATCH", `/api/admin/vendors/${id}/commission`, { commissionRate, canAddOwnProducts }),
    onSuccess: () => {
      toast({ title: "Wholesaler settings updated successfully" });
      setEditingVendor(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update wholesaler settings", description: error.message, variant: "destructive" });
    }
  });

  const rejectVendorMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("POST", `/api/admin/vendors/${id}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Wholesaler rejected" });
      setRejectVendorDialog(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
  });

  // Fetch pending trial requests
  const { data: pendingTrials = [], isLoading: trialsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/reseller-licences/pending-trials"],
  });

  // Approve trial mutation
  const approveTrialMutation = useMutation({
    mutationFn: ({ licenceId, trialDays }: { licenceId: string; trialDays: number }) =>
      apiRequest("POST", `/api/admin/reseller-licences/${licenceId}/approve-trial`, { trialDays }),
    onSuccess: (_data, variables) => {
      toast({ title: "Trial approved", description: `Reseller now has ${variables.trialDays} days free trial to add products.` });
      setApproveTrialDialog(null);
      setTrialDaysInput("30");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reseller-licences/pending-trials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reseller-licences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to approve trial", description: error.message, variant: "destructive" });
    }
  });

  // Reject trial mutation
  const rejectTrialMutation = useMutation({
    mutationFn: (licenceId: string) =>
      apiRequest("POST", `/api/admin/reseller-licences/${licenceId}/reject-trial`),
    onSuccess: () => {
      toast({ title: "Trial request rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reseller-licences/pending-trials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reseller-licences"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reject trial", description: error.message, variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      approved: { variant: "secondary", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      rejected: { variant: "secondary", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };
    return variants[status] || variants.pending;
  };

  const isLoading = resellersLoading || vendorsLoading || trialsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingResellers = resellers.filter(r => r.approvalStatus === "pending");
  const pendingVendors = vendors.filter(v => v.approvalStatus === "pending");
  const pendingTrialCount = pendingTrials.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">B2B Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Resellers: {resellers.length} | Vendors: {vendors.length} | Pending: {pendingResellers.length + pendingVendors.length}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="resellers" className="flex items-center gap-2" data-testid="tab-resellers">
            <Store className="h-4 w-4" />
            Resellers {pendingResellers.length > 0 && <Badge variant="destructive" className="ml-1">{pendingResellers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2" data-testid="tab-vendors">
            <Package className="h-4 w-4" />
            Wholesalers {pendingVendors.length > 0 && <Badge variant="destructive" className="ml-1">{pendingVendors.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="trials" className="flex items-center gap-2" data-testid="tab-trials">
            <Clock className="h-4 w-4" />
            Trial Requests {pendingTrialCount > 0 && <Badge variant="destructive" className="ml-1">{pendingTrialCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resellers" className="space-y-6 mt-6">
          {pendingResellers.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Reseller Approvals</h3>
              <div className="space-y-3">
                {pendingResellers.map((reseller: any) => (
                  <div key={reseller.id} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{reseller.businessName}</p>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Applying as Reseller</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Contact: {reseller.contactPerson}</p>
                      <p className="text-sm text-muted-foreground">Email: {reseller.email} | Phone: {reseller.phoneNumber}</p>
                      <p className="text-sm text-muted-foreground">Address: {reseller.businessAddress}</p>
                      <p className="text-xs text-muted-foreground mt-1">Applied: {new Date(reseller.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setApproveResellerDialog(reseller);
                          setResellerCommissionRate("");
                        }}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-reseller-${reseller.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejectDialog(reseller)}
                        data-testid={`button-reject-reseller-${reseller.id}`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">Business</th>
                    <th className="text-left p-4 font-semibold">Contact</th>
                    <th className="text-left p-4 font-semibold">Tier</th>
                    <th className="text-left p-4 font-semibold">Commission</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Active</th>
                    <th className="text-left p-4 font-semibold">Credit</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resellers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No resellers found
                      </td>
                    </tr>
                  ) : (
                    resellers.map((reseller: any) => (
                      <tr key={reseller.id} className={`border-b border-border ${!reseller.isActive ? 'opacity-60' : ''}`}>
                        <td className="p-4">
                          <p className="font-medium">{reseller.businessName}</p>
                          <p className="text-sm text-muted-foreground">{reseller.businessAddress}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{reseller.contactPerson}</p>
                          <p className="text-xs text-muted-foreground">{reseller.phoneNumber}</p>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{reseller.tier?.toUpperCase()}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{reseller.discountPercentage}% discount</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium">
                            {reseller.commissionRate ? `${parseFloat(reseller.commissionRate).toFixed(2)}%` : 'Default'}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusBadge(reseller.approvalStatus).className}>
                            {reseller.approvalStatus}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Switch
                            checked={reseller.isActive}
                            onCheckedChange={(checked) => toggleResellerStatusMutation.mutate({ id: reseller.id, isActive: checked })}
                            disabled={toggleResellerStatusMutation.isPending}
                            data-testid={`switch-reseller-active-${reseller.id}`}
                          />
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium">£{parseFloat(reseller.creditLimit || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Used: £{parseFloat(reseller.currentCredit || 0).toFixed(2)}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingReseller(reseller)}
                              data-testid={`button-edit-reseller-${reseller.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setDeleteResellerDialog(reseller)}
                              data-testid={`button-delete-reseller-${reseller.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6 mt-6">
          {pendingVendors.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Wholesaler Approvals</h3>
              <div className="space-y-3">
                {pendingVendors.map((vendor: any) => (
                  <div key={vendor.id} className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{vendor.businessName}</p>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Applying as Wholesaler</Badge>
                      </div>
                      {vendor.businessDescription && (
                        <p className="text-sm text-muted-foreground mt-1">{vendor.businessDescription}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Phone: {vendor.phoneNumber || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Address: {vendor.businessAddress || 'N/A'}</p>
                      {vendor.website && (
                        <p className="text-sm text-muted-foreground">Website: {vendor.website}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Applied: {new Date(vendor.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setApproveVendorDialog(vendor);
                          setVendorCommissionRate("");
                        }}
                        disabled={approveVendorMutation.isPending}
                        data-testid={`button-approve-vendor-${vendor.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejectVendorDialog(vendor)}
                        data-testid={`button-reject-vendor-${vendor.id}`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">Business</th>
                    <th className="text-left p-4 font-semibold">Description</th>
                    <th className="text-left p-4 font-semibold">Contact</th>
                    <th className="text-left p-4 font-semibold">Commission</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Active</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No vendors found
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor: any) => (
                      <tr key={vendor.id} className="border-b border-border">
                        <td className="p-4">
                          <p className="font-medium">{vendor.businessName}</p>
                          <p className="text-sm text-muted-foreground">{vendor.businessAddress || 'No address'}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm line-clamp-2">{vendor.businessDescription || 'No description'}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{vendor.phoneNumber || 'N/A'}</p>
                          {vendor.website && (
                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              {vendor.website}
                            </a>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium">
                            {vendor.commissionRate ? `${parseFloat(vendor.commissionRate).toFixed(2)}%` : 'Default'}
                          </p>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusBadge(vendor.approvalStatus).className}>
                            {vendor.approvalStatus}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={vendor.isActive ? "default" : "secondary"}>
                            {vendor.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingVendor(vendor)}
                            data-testid={`button-edit-vendor-${vendor.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Trial Requests Tab */}
        <TabsContent value="trials" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pending Trial Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Resellers request a 30-day free trial to add their own products. Approve to grant access.
            </p>
            
            {pendingTrials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No pending trial requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTrials.map((trial: any) => (
                  <div 
                    key={trial.id} 
                    className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{trial.reseller?.businessName || 'Unknown Business'}</p>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          Trial Request
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Contact: {trial.reseller?.contactName || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Email: {trial.reseller?.email || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {trial.trialRequestedAt ? new Date(trial.trialRequestedAt).toLocaleDateString('en-GB') : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setTrialDaysInput("30");
                          setApproveTrialDialog({ id: trial.id, name: trial.reseller?.businessName || trial.reseller?.contactName || 'this reseller' });
                        }}
                        disabled={approveTrialMutation.isPending || rejectTrialMutation.isPending}
                        data-testid={`button-approve-trial-${trial.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve Trial
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectTrialMutation.mutate(trial.id)}
                        disabled={approveTrialMutation.isPending || rejectTrialMutation.isPending}
                        data-testid={`button-reject-trial-${trial.id}`}
                      >
                        {rejectTrialMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Reseller Dialog */}
      <Dialog open={!!editingReseller} onOpenChange={() => setEditingReseller(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reseller</DialogTitle>
            <DialogDescription>Update reseller tier and credit limit</DialogDescription>
          </DialogHeader>
          {editingReseller && (
            <div className="space-y-4">
              <div>
                <Label>Business Name</Label>
                <Input value={editingReseller.businessName} disabled />
              </div>
              <div>
                <Label>Tier</Label>
                <Select
                  value={editingReseller.tier}
                  onValueChange={(value) => setEditingReseller({ ...editingReseller, tier: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze (10%)</SelectItem>
                    <SelectItem value="silver">Silver (15%)</SelectItem>
                    <SelectItem value="gold">Gold (25%)</SelectItem>
                    <SelectItem value="platinum">Platinum (35%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credit Limit (£)</Label>
                <Input
                  type="number"
                  value={editingReseller.creditLimit}
                  onChange={(e) => setEditingReseller({ ...editingReseller, creditLimit: e.target.value })}
                />
              </div>
              <div>
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Leave empty for default rate"
                  value={editingReseller.commissionRate || ""}
                  onChange={(e) => setEditingReseller({ ...editingReseller, commissionRate: e.target.value })}
                  data-testid="input-edit-reseller-commission"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Platform commission on reseller sales (0-100%)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateMutation.mutate({
                    id: editingReseller.id,
                    updates: { 
                      tier: editingReseller.tier, 
                      creditLimit: editingReseller.creditLimit
                    }
                  })}
                  disabled={updateMutation.isPending || updateResellerCommissionMutation.isPending}
                  className="flex-1"
                  variant="outline"
                >
                  Save Tier & Credit
                </Button>
                <Button
                  onClick={() => updateResellerCommissionMutation.mutate({
                    id: editingReseller.id,
                    commissionRate: editingReseller.commissionRate || undefined
                  })}
                  disabled={updateMutation.isPending || updateResellerCommissionMutation.isPending}
                  className="flex-1"
                >
                  Save Commission
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reseller Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reseller Application</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              data-testid="input-rejection-reason"
            />
            <Button
              variant="destructive"
              onClick={() => rejectDialog && rejectMutation.mutate({ id: rejectDialog.id, reason: rejectionReason })}
              disabled={!rejectionReason || rejectMutation.isPending}
              className="w-full"
              data-testid="button-confirm-reject"
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Vendor Dialog */}
      <Dialog open={!!rejectVendorDialog} onOpenChange={() => setRejectVendorDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              data-testid="input-vendor-rejection-reason"
            />
            <Button
              variant="destructive"
              onClick={() => rejectVendorDialog && rejectVendorMutation.mutate({ id: rejectVendorDialog.id, reason: rejectionReason })}
              disabled={!rejectionReason || rejectVendorMutation.isPending}
              className="w-full"
              data-testid="button-confirm-vendor-reject"
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Reseller Dialog */}
      <Dialog open={!!approveResellerDialog} onOpenChange={() => {
        setApproveResellerDialog(null);
        setResellerCommissionRate("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reseller Application</DialogTitle>
            <DialogDescription>Set commission rate for {approveResellerDialog?.businessName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reseller-commission">Commission Rate (%)</Label>
              <Input
                id="reseller-commission"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 15.00 (optional)"
                value={resellerCommissionRate}
                onChange={(e) => setResellerCommissionRate(e.target.value)}
                data-testid="input-reseller-commission-rate"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Platform commission on reseller sales (0-100%). Leave empty for default rate.
              </p>
            </div>
            <Button
              onClick={() => approveResellerDialog && approveMutation.mutate({ 
                id: approveResellerDialog.id, 
                commissionRate: resellerCommissionRate || undefined 
              })}
              disabled={approveMutation.isPending}
              className="w-full"
              data-testid="button-confirm-approve-reseller"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve Reseller
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Vendor Dialog */}
      <Dialog open={!!approveVendorDialog} onOpenChange={() => {
        setApproveVendorDialog(null);
        setVendorCommissionRate("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Vendor Application</DialogTitle>
            <DialogDescription>Set commission rate for {approveVendorDialog?.businessName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vendor-commission">Commission Rate (%)</Label>
              <Input
                id="vendor-commission"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 15.00 (optional)"
                value={vendorCommissionRate}
                onChange={(e) => setVendorCommissionRate(e.target.value)}
                data-testid="input-vendor-commission-rate"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Platform commission on vendor sales (0-100%). Leave empty for default rate.
              </p>
            </div>
            <Button
              onClick={() => approveVendorDialog && approveVendorMutation.mutate({ 
                id: approveVendorDialog.id, 
                commissionRate: vendorCommissionRate || undefined 
              })}
              disabled={approveVendorMutation.isPending}
              className="w-full"
              data-testid="button-confirm-approve-vendor"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Reseller Confirmation */}
      <Dialog open={!!deleteResellerDialog} onOpenChange={() => setDeleteResellerDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Reseller Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the reseller account for <strong>{deleteResellerDialog?.businessName}</strong>? 
              This will deactivate their account, revoke their reseller access, and they will no longer be able to log in as a reseller. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteResellerDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteResellerDialog && deleteResellerMutation.mutate(deleteResellerDialog.id)}
              disabled={deleteResellerMutation.isPending}
              data-testid="button-confirm-delete-reseller"
            >
              {deleteResellerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Reseller
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={!!editingVendor} onOpenChange={() => setEditingVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wholesaler Settings</DialogTitle>
            <DialogDescription>Update settings for {editingVendor?.businessName}</DialogDescription>
          </DialogHeader>
          {editingVendor && (
            <div className="space-y-4">
              <div>
                <Label>Business Name</Label>
                <Input value={editingVendor.businessName} disabled />
              </div>
              <div>
                <Label htmlFor="edit-vendor-commission">Commission Rate (%)</Label>
                <Input
                  id="edit-vendor-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Leave empty for default rate"
                  value={editingVendor.commissionRate || ""}
                  onChange={(e) => setEditingVendor({ ...editingVendor, commissionRate: e.target.value })}
                  data-testid="input-edit-vendor-commission"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Platform commission on wholesaler sales (0-100%)
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="can-add-products">Can Add Own Products</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow this wholesaler to add and sell their own products on the marketplace
                  </p>
                </div>
                <Switch
                  id="can-add-products"
                  checked={editingVendor.canAddOwnProducts || false}
                  onCheckedChange={(checked) => setEditingVendor({ ...editingVendor, canAddOwnProducts: checked })}
                  data-testid="switch-can-add-products"
                />
              </div>
              <Button
                onClick={() => updateVendorMutation.mutate({
                  id: editingVendor.id,
                  commissionRate: editingVendor.commissionRate || undefined,
                  canAddOwnProducts: editingVendor.canAddOwnProducts || false
                })}
                disabled={updateVendorMutation.isPending}
                className="w-full"
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Trial — set custom days dialog */}
      <Dialog open={!!approveTrialDialog} onOpenChange={(open) => { if (!open) setApproveTrialDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve Free Trial</DialogTitle>
            <DialogDescription>
              Set how many days of free trial to grant to <strong>{approveTrialDialog?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="trial-days">Trial Duration (days)</Label>
              <Input
                id="trial-days"
                type="number"
                min="1"
                max="365"
                value={trialDaysInput}
                onChange={(e) => setTrialDaysInput(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">Common options: 7, 14, 30, 60, 90 days</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setApproveTrialDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={approveTrialMutation.isPending || !trialDaysInput || parseInt(trialDaysInput) < 1}
                onClick={() => {
                  if (approveTrialDialog) {
                    approveTrialMutation.mutate({ licenceId: approveTrialDialog.id, trialDays: parseInt(trialDaysInput) || 30 });
                  }
                }}
                data-testid="button-confirm-approve-trial"
              >
                {approveTrialMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Approve {trialDaysInput || '30'}-Day Trial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
