import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { convertToDirectUrl } from "@/lib/imageUtils";
import { linkifyMessageBody } from "@/lib/linkify";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { 
  Check, 
  X, 
  Edit, 
  Store, 
  MessageSquare, 
  Package, 
  Bell,
  Truck,
  Clock,
  CheckCircle,
  Send,
  PackageOpen,
  Loader2,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Boxes,
  AlertTriangle,
  Printer,
  Download,
  RefreshCw
} from "lucide-react";

export default function AdminResellerManagement() {
  const [activeTab, setActiveTab] = useState("resellers");
  const [selectedReseller, setSelectedReseller] = useState<any | null>(null);
  const [manageResellerDialog, setManageResellerDialog] = useState(false);
  const [manageTab, setManageTab] = useState("overview");
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState<"general" | "order" | "support">("general");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [shipmentDialog, setShipmentDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editProfile, setEditProfile] = useState<any>({});
  const [notificationType, setNotificationType] = useState("general");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [newCommissionOverride, setNewCommissionOverride] = useState<{
    productId: string;
    commissionRate: string;
    storefrontPrice: string;
    notes: string;
  }>({ productId: "", commissionRate: "", storefrontPrice: "", notes: "" });
  
  // Password reset state
  const [passwordResetDialog, setPasswordResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  
  // Vendor password reset state
  const [vendorPasswordResetDialog, setVendorPasswordResetDialog] = useState(false);
  const [vendorNewPassword, setVendorNewPassword] = useState("");
  
  // Date range filter state for earnings/orders - default to all time (undefined)
  const [earningsStartDate, setEarningsStartDate] = useState<Date | undefined>(undefined);
  const [earningsEndDate, setEarningsEndDate] = useState<Date | undefined>(undefined);
  
  const { toast} = useToast();

  // Fetch resellers
  const { data: resellers = [], isLoading: resellersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/resellers"],
  });

  // Fetch reseller analytics (product counts and sales revenue)
  const { data: resellerAnalytics = [], isLoading: analyticsLoading } = useQuery<Array<{
    reseller: any;
    licence: any;
    productCount: number;
    salesTotal: number;
    orderCount: number;
  }>>({
    queryKey: ["/api/admin/resellers/analytics"],
  });

  // Fetch vendors to check which resellers have vendor access
  const { data: vendors = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/vendors"],
  });

  // Fetch all orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch inventory data
  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  // Helper function to check if a reseller is also a vendor
  const isResellerVendor = (resellerId: string, resellerUserId: string) => {
    return vendors.some(vendor => vendor.userId === resellerUserId);
  };

  // Fetch messages for selected reseller
  const { data: messages = [] } = useQuery<any[]>({
    queryKey: selectedReseller ? ["/api/resellers", selectedReseller.id, "messages"] : [],
    enabled: !!selectedReseller,
  });

  // Fetch reseller-specific inventory data
  const { data: resellerInventoryData, isLoading: inventoryLoading } = useQuery<any>({
    queryKey: ["/api/admin/resellers", selectedReseller?.id, "inventory"],
    enabled: !!selectedReseller?.id && manageResellerDialog,
  });

  // Fetch reseller-specific orders data
  const { data: resellerOrdersData, isLoading: resellerOrdersLoading } = useQuery<any>({
    queryKey: ["/api/admin/resellers", selectedReseller?.id, "orders"],
    enabled: !!selectedReseller?.id && manageResellerDialog,
  });

  // Fetch reseller earnings data with date filtering
  const { data: resellerEarningsData, isLoading: earningsLoading } = useQuery<any>({
    queryKey: ["/api/admin/resellers", selectedReseller?.id, "earnings", earningsStartDate?.toISOString(), earningsEndDate?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (earningsStartDate) params.append('startDate', earningsStartDate.toISOString());
      if (earningsEndDate) params.append('endDate', earningsEndDate.toISOString());
      const response = await fetch(`/api/admin/resellers/${selectedReseller?.id}/earnings?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch earnings');
      return response.json();
    },
    enabled: !!selectedReseller?.id && manageResellerDialog,
  });

  // Fetch comprehensive reseller stats
  const { data: resellerStatsData, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/admin/resellers", selectedReseller?.id, "stats"],
    enabled: !!selectedReseller?.id && manageResellerDialog,
  });

  // Fetch SMS thread with the reseller (pulled live from Twilio, both directions)
  const { data: resellerSmsThread, isLoading: resellerSmsThreadLoading } = useQuery<{ messages: Array<{ direction: string; body: string; status: string; date: string }>; configured: boolean }>({
    queryKey: ["/api/admin/resellers", selectedReseller?.id, "sms-thread"],
    queryFn: async () => {
      if (!selectedReseller?.id) return { messages: [], configured: true };
      const res = await fetch(`/api/admin/resellers/${selectedReseller.id}/sms-thread`, { credentials: "include" });
      if (!res.ok) return { messages: [], configured: true };
      return res.json();
    },
    enabled: !!selectedReseller?.id && manageResellerDialog,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const [resellerSmsComposeText, setResellerSmsComposeText] = useState("");

  const sendResellerSmsMutation = useMutation({
    mutationFn: (data: { id: string; message: string }) =>
      apiRequest("POST", `/api/admin/resellers/${data.id}/sms`, { message: data.message }),
    onSuccess: () => {
      setResellerSmsComposeText("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers", selectedReseller?.id, "sms-thread"] });
      toast({ title: "SMS sent", description: "Message has been sent to the reseller" });
    },
    onError: (err: any) => {
      let description = "Failed to send SMS";
      const raw = typeof err?.message === "string" ? err.message.replace(/^\d+:\s*/, "") : "";
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          description = parsed?.error || raw;
        } catch {
          description = raw;
        }
      }
      toast({ title: "Error", description, variant: "destructive" });
    },
  });

  // Fetch commission overrides for selected reseller
  const { data: commissionOverrides = [], isLoading: overridesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/partner-commission-overrides", "reseller", selectedReseller?.id],
    enabled: !!selectedReseller?.id && manageResellerDialog && manageTab === "commission",
  });

  // Fetch all products for commission override dropdown
  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Create commission override mutation
  const createOverrideMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/partner-commission-overrides", data),
    onSuccess: () => {
      toast({ title: "Commission override created" });
      setNewCommissionOverride({ productId: "", commissionRate: "", storefrontPrice: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-commission-overrides", "reseller", selectedReseller?.id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create override", variant: "destructive" });
    },
  });

  // Update commission override mutation
  const updateOverrideMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/admin/partner-commission-overrides/${id}`, data),
    onSuccess: () => {
      toast({ title: "Commission override updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-commission-overrides", "reseller", selectedReseller?.id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update override", variant: "destructive" });
    },
  });

  // Delete commission override mutation
  const deleteOverrideMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/partner-commission-overrides/${id}`),
    onSuccess: () => {
      toast({ title: "Commission override removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-commission-overrides", "reseller", selectedReseller?.id] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/messages", data),
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      setMessageDialog(false);
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/resellers", selectedReseller?.id, "messages"] });
    },
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: any }) =>
      apiRequest("POST", `/api/orders/${orderId}/shipment`, data),
    onSuccess: () => {
      toast({ title: "Shipment details added" });
      setShipmentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest("PATCH", `/api/orders/${orderId}`, { status }),
    onSuccess: () => {
      toast({ title: "Order status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
  });

  // Approve reseller mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/resellers/${id}/approve`, {}),
    onSuccess: () => {
      toast({ title: "Reseller approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
  });

  // Reject reseller mutation
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

  // Reset reseller password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      apiRequest("PATCH", `/api/admin/resellers/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      toast({ title: "Password reset successfully" });
      setPasswordResetDialog(false);
      setNewPassword("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reset password",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    },
  });

  // Reset vendor/wholesaler password mutation
  const resetVendorPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      apiRequest("PATCH", `/api/admin/vendors/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      toast({ title: "Vendor password reset successfully" });
      setVendorPasswordResetDialog(false);
      setVendorNewPassword("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reset vendor password",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    },
  });

  // Grant wholesaler access mutation
  const grantVendorAccessMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/resellers/${id}/grant-vendor-access`, {}),
    onSuccess: () => {
      toast({ 
        title: "Wholesaler access granted",
        description: "Reseller can now access the wholesaler dashboard"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error granting wholesaler access",
        description: error.message || "Failed to grant wholesaler access",
        variant: "destructive"
      });
    },
  });

  // Update reseller profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/resellers/${id}`, data),
    onSuccess: () => {
      toast({ title: "Reseller updated successfully" });
      setManageResellerDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/notifications", data),
    onSuccess: () => {
      toast({ 
        title: "Notification sent", 
        description: "The notification has been sent to the reseller successfully." 
      });
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationLink("");
      setNotificationType("general");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send notification", 
        description: error.message || "An error occurred while sending the notification.",
        variant: "destructive"
      });
    },
  });

  const downloadEarningsCSV = () => {
    if (!resellerEarningsData || !selectedReseller) return;
    const stats = resellerEarningsData.stats;
    const name = selectedReseller.businessName || selectedReseller.name || 'Reseller';
    const dateStr = new Date().toISOString().slice(0, 10);
    const rows: string[][] = [];

    // Summary header
    rows.push(['1stRep Earnings Report']);
    rows.push([`Reseller: ${name}`]);
    rows.push([`Generated: ${new Date().toLocaleString('en-GB')}`]);
    rows.push([]);
    rows.push(['SUMMARY']);
    rows.push(['Metric', 'Amount']);
    rows.push(['Total Revenue', `£${Number(stats.totalRevenue).toFixed(2)}`]);
    rows.push(['Reseller Earnings', `£${Number(stats.totalEarnings).toFixed(2)}`]);
    rows.push(['Platform Cut (Catalogue)', `£${Number(stats.platformCommission).toFixed(2)}`]);
    rows.push(['Catalogue Revenue', `£${Number(stats.catalogueRevenue).toFixed(2)}`]);
    rows.push(['Own Product Revenue', `£${Number(stats.ownProductRevenue).toFixed(2)}`]);
    rows.push(['Total Orders', String(stats.totalOrders)]);
    rows.push(['Commission Rate (Catalogue)', `${stats.commissionRate}%`]);
    rows.push([]);

    // Catalogue products
    if (stats.catalogueProductSales?.length > 0) {
      rows.push(['1STREP CATALOGUE PRODUCTS']);
      rows.push(['Product', 'Units Sold', 'Revenue', 'Reseller Earns', '1stRep Cut']);
      for (const p of stats.catalogueProductSales) {
        rows.push([p.productName, String(p.qty), `£${Number(p.revenue).toFixed(2)}`, `£${Number(p.earnings).toFixed(2)}`, `£${(Number(p.revenue) - Number(p.earnings)).toFixed(2)}`]);
      }
      const totQty = stats.catalogueProductSales.reduce((s: number, p: any) => s + p.qty, 0);
      const totRev = stats.catalogueProductSales.reduce((s: number, p: any) => s + Number(p.revenue), 0);
      const totEarn = stats.catalogueProductSales.reduce((s: number, p: any) => s + Number(p.earnings), 0);
      rows.push(['TOTAL', String(totQty), `£${totRev.toFixed(2)}`, `£${totEarn.toFixed(2)}`, `£${(totRev - totEarn).toFixed(2)}`]);
      rows.push([]);
    }

    // Own products
    if (stats.ownProductSales?.length > 0) {
      rows.push(["RESELLER'S OWN PRODUCTS"]);
      rows.push(['Product', 'Units Sold', 'Revenue', 'Reseller Keeps', '1stRep Cut']);
      for (const p of stats.ownProductSales) {
        rows.push([p.productName, String(p.qty), `£${Number(p.revenue).toFixed(2)}`, `£${Number(p.earnings).toFixed(2)}`, '£0.00']);
      }
      const totQty = stats.ownProductSales.reduce((s: number, p: any) => s + p.qty, 0);
      const totRev = stats.ownProductSales.reduce((s: number, p: any) => s + Number(p.revenue), 0);
      rows.push(['TOTAL', String(totQty), `£${totRev.toFixed(2)}`, `£${totRev.toFixed(2)}`, '£0.00']);
    }

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1stRep_Earnings_${name.replace(/\s+/g, '_')}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printEarningsReport = () => {
    if (!resellerEarningsData || !selectedReseller) return;
    const stats = resellerEarningsData.stats;
    const name = selectedReseller.businessName || selectedReseller.name || 'Reseller';
    const now = new Date().toLocaleString('en-GB');

    const tableStyle = 'width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;';
    const thStyle = 'border:1px solid #ddd;padding:8px 12px;background:#f5f5f5;text-align:left;font-weight:600;';
    const tdStyle = 'border:1px solid #ddd;padding:8px 12px;';
    const tdRStyle = 'border:1px solid #ddd;padding:8px 12px;text-align:right;';
    const tfStyle = 'border:1px solid #ddd;padding:8px 12px;background:#f5f5f5;font-weight:700;text-align:right;';

    const buildTable = (title: string, headers: string[], rows: string[][], totals: string[], accentColor: string) => `
      <h3 style="margin:24px 0 8px;color:${accentColor};font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">${title}</h3>
      <table style="${tableStyle}">
        <thead><tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td style="${i === 0 ? tdStyle : tdRStyle}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
        <tfoot><tr>${totals.map((c, i) => `<td style="${i === 0 ? tdStyle + 'font-weight:700;background:#f5f5f5;' : tfStyle}">${c}</td>`).join('')}</tr></tfoot>
      </table>`;

    let catTable = '';
    if (stats.catalogueProductSales?.length > 0) {
      const rows = stats.catalogueProductSales.map((p: any) => [p.productName, String(p.qty), `£${Number(p.revenue).toFixed(2)}`, `£${Number(p.earnings).toFixed(2)}`, `£${(Number(p.revenue) - Number(p.earnings)).toFixed(2)}`]);
      const totQty = stats.catalogueProductSales.reduce((s: number, p: any) => s + p.qty, 0);
      const totRev = stats.catalogueProductSales.reduce((s: number, p: any) => s + Number(p.revenue), 0);
      const totEarn = stats.catalogueProductSales.reduce((s: number, p: any) => s + Number(p.earnings), 0);
      catTable = buildTable('1stRep Catalogue Products', ['Product', 'Units Sold', 'Revenue', 'Reseller Earns', '1stRep Cut'], rows, ['Total', String(totQty), `£${totRev.toFixed(2)}`, `£${totEarn.toFixed(2)}`, `£${(totRev - totEarn).toFixed(2)}`], '#1d4ed8');
    }

    let ownTable = '';
    if (stats.ownProductSales?.length > 0) {
      const rows = stats.ownProductSales.map((p: any) => [p.productName, String(p.qty), `£${Number(p.revenue).toFixed(2)}`, `£${Number(p.earnings).toFixed(2)}`, '£0.00']);
      const totQty = stats.ownProductSales.reduce((s: number, p: any) => s + p.qty, 0);
      const totRev = stats.ownProductSales.reduce((s: number, p: any) => s + Number(p.revenue), 0);
      ownTable = buildTable("Reseller's Own Products", ['Product', 'Units Sold', 'Revenue', 'Reseller Keeps', '1stRep Cut'], rows, ['Total', String(totQty), `£${totRev.toFixed(2)}`, `£${totRev.toFixed(2)}`, '£0.00'], '#7c3aed');
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>1stRep Earnings Report — ${name}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#111;padding:32px;max-width:900px;margin:0 auto;}
        h1{font-size:22px;margin-bottom:4px;} h2{font-size:16px;color:#555;font-weight:400;margin:0 0 24px;}
        .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;}
        .kpi{border:1px solid #ddd;border-radius:6px;padding:14px;}
        .kpi-label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;}
        .kpi-value{font-size:20px;font-weight:700;}
        @media print{button{display:none;}}
      </style></head><body>
      <h1>1stRep Earnings Report</h1>
      <h2>${name} &mdash; Generated ${now}</h2>
      <div class="summary-grid">
        <div class="kpi"><div class="kpi-label">Total Revenue</div><div class="kpi-value" style="color:#16a34a">£${Number(stats.totalRevenue).toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Reseller Earnings</div><div class="kpi-value" style="color:#7c3aed">£${Number(stats.totalEarnings).toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Platform Cut</div><div class="kpi-value" style="color:#1d4ed8">£${Number(stats.platformCommission).toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Catalogue Revenue</div><div class="kpi-value">£${Number(stats.catalogueRevenue).toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Own Product Revenue</div><div class="kpi-value">£${Number(stats.ownProductRevenue).toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Total Orders</div><div class="kpi-value">${stats.totalOrders} <span style="font-size:13px;color:#666;">(${stats.storefrontOrders} storefront · ${stats.eposOrders} EPOS)</span></div></div>
      </div>
      ${catTable}${ownTable}
      </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleSendMessage = () => {
    if (!selectedReseller || !messageContent.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter a message", 
        variant: "destructive" 
      });
      return;
    }

    sendMessageMutation.mutate({
      resellerId: selectedReseller.id,
      messageType: messageType,
      subject: `Message from Admin`,
      content: messageContent,
    });
  };

  const handleSendNotification = () => {
    if (!selectedReseller) {
      toast({ 
        title: "Error", 
        description: "Please select a reseller", 
        variant: "destructive" 
      });
      return;
    }

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter title and message", 
        variant: "destructive" 
      });
      return;
    }

    sendNotificationMutation.mutate({
      resellerId: selectedReseller.id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      link: notificationLink || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string }> = {
      pending: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      approved: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      rejected: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      processing: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      shipped: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      delivered: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      cancelled: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };
    return variants[status] || variants.pending;
  };

  const pendingResellers = resellers.filter((r: any) => r.approvalStatus === "pending");
  const approvedResellers = resellers.filter((r: any) => r.approvalStatus === "approved");
  const pendingVendors = vendors.filter((v: any) => v.approvalStatus === "pending");
  const approvedVendors = vendors.filter((v: any) => v.approvalStatus === "approved");

  // Approve wholesaler mutation
  const approveVendorMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/vendors/${id}/approve`, {}),
    onSuccess: () => {
      toast({ title: "Wholesaler approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
  });

  // Reject vendor mutation
  const [rejectVendorDialog, setRejectVendorDialog] = useState<any | null>(null);
  const [vendorRejectionReason, setVendorRejectionReason] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [manageVendorDialog, setManageVendorDialog] = useState(false);
  const [vendorManageTab, setVendorManageTab] = useState("profile");

  // Fetch vendor products for selected vendor
  const { data: vendorProducts = [], isLoading: vendorProductsLoading } = useQuery<any[]>({
    queryKey: ["/api/vendor-products", selectedVendor?.id],
    enabled: !!selectedVendor?.id,
  });
  
  const rejectVendorMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("POST", `/api/admin/vendors/${id}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Wholesaler rejected" });
      setRejectVendorDialog(null);
      setVendorRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reseller Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage resellers, track orders, and handle communications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6" data-testid="tabs-reseller-management">
          <TabsTrigger value="resellers" data-testid="tab-resellers">
            <Store className="w-4 h-4 mr-2" />
            Resellers
            {pendingResellers.length > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1">{pendingResellers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="vendors" data-testid="tab-vendors">
            <PackageOpen className="w-4 h-4 mr-2" />
            Wholesalers
            {pendingVendors.length > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1">{pendingVendors.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <Package className="w-4 h-4 mr-2" />
            Orders & Shipping
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Resellers Tab */}
        <TabsContent value="resellers" className="space-y-6">
          {/* Modern Gradient KPI Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Resellers</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <Store className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{resellers.length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">{approvedResellers.length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">{pendingResellers.length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-red-500/20 via-rose-500/20 to-red-500/20 backdrop-blur-xl shadow-2xl shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Rejected</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/40">
                  <X className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">{resellers.filter((r: any) => r.approvalStatus === 'rejected').length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          {pendingResellers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve reseller applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingResellers.map((reseller: any) => (
                  <div 
                    key={reseller.id} 
                    className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    data-testid={`pending-reseller-${reseller.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-lg">{reseller.businessName}</p>
                            <p className="text-sm text-muted-foreground">Contact: {reseller.contactPerson}</p>
                          </div>
                          <Badge 
                            className={reseller.applicationFor === "vendor" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}
                            data-testid={`badge-application-type-${reseller.id}`}
                          >
                            {reseller.applicationFor === "vendor" ? "Applying as Wholesaler" : "Applying as Reseller"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Email:</span>{" "}
                            <span className="font-medium">{reseller.email}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone:</span>{" "}
                            <span className="font-medium">{reseller.phoneNumber}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Address:</span>{" "}
                            <span className="font-medium">{reseller.businessAddress}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Applied:</span>{" "}
                            <span className="font-medium">{new Date(reseller.registrationDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => approveMutation.mutate(reseller.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-${reseller.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRejectDialog(reseller)}
                          data-testid={`button-reject-${reseller.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* All Resellers */}
          <Card>
            <CardHeader>
              <CardTitle>All Resellers</CardTitle>
              <CardDescription>View and manage reseller accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {resellersLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="mt-4 text-muted-foreground">Loading resellers...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resellers.map((reseller: any) => (
                    <Card key={reseller.id} className="hover-elevate" data-testid={`card-reseller-${reseller.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header with badges */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg" data-testid={`text-business-name-${reseller.id}`}>
                                  {reseller.businessName}
                                </h3>
                                <Badge variant="outline" data-testid={`badge-tier-${reseller.id}`}>
                                  {reseller.tier}
                                </Badge>
                                <Badge 
                                  className={reseller.applicationFor === "vendor" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}
                                  data-testid={`badge-application-type-list-${reseller.id}`}
                                >
                                  {reseller.applicationFor === "vendor" ? "Wholesaler" : "Reseller"}
                                </Badge>
                                <Badge 
                                  className={getStatusBadge(reseller.approvalStatus).className}
                                  data-testid={`badge-status-${reseller.id}`}
                                >
                                  {reseller.approvalStatus}
                                </Badge>
                                {isResellerVendor(reseller.id, reseller.userId) && (
                                  <Badge
                                    className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    data-testid={`badge-vendor-${reseller.id}`}
                                  >
                                    Wholesaler
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className={reseller.ownSquareSetupAt
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                                    : "text-muted-foreground"}
                                  title={reseller.ownSquareSetupAt
                                    ? `Own Square connected ${new Date(reseller.ownSquareSetupAt).toLocaleDateString()}`
                                    : "Own-product sales go through 1stRep's platform Square account"}
                                  data-testid={`badge-own-square-${reseller.id}`}
                                >
                                  {reseller.ownSquareSetupAt ? "Own Square connected" : "Own Square not connected"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedReseller(reseller);
                                  setEditProfile({
                                    businessName: reseller.businessName,
                                    contactPerson: reseller.contactPerson,
                                    phoneNumber: reseller.phoneNumber,
                                    businessAddress: reseller.businessAddress,
                                    tier: reseller.tier,
                                    creditLimit: reseller.creditLimit,
                                    discountPercentage: reseller.discountPercentage,
                                    allowedPaymentMethods: reseller.allowedPaymentMethods || "both",
                                    commissionRate: reseller.commissionRate || "",
                                  });
                                  setManageResellerDialog(true);
                                  setManageTab("profile");
                                }}
                                data-testid={`button-manage-${reseller.id}`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Manage
                              </Button>
                              {reseller.approvalStatus === "approved" && (
                                <Button
                                  size="sm"
                                  variant={isResellerVendor(reseller.id, reseller.userId) ? "secondary" : "outline"}
                                  onClick={() => grantVendorAccessMutation.mutate(reseller.id)}
                                  disabled={grantVendorAccessMutation.isPending || isResellerVendor(reseller.id, reseller.userId)}
                                  data-testid={`button-grant-vendor-${reseller.id}`}
                                  title={isResellerVendor(reseller.id, reseller.userId) ? "This reseller already has wholesaler access" : "Grant this reseller wholesaler marketplace access"}
                                >
                                  <Store className="w-4 h-4 mr-2" />
                                  {isResellerVendor(reseller.id, reseller.userId) ? "Wholesaler Granted" : "Grant Wholesaler"}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedReseller(reseller);
                                  setMessageDialog(true);
                                }}
                                data-testid={`button-message-${reseller.id}`}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message
                              </Button>
                            </div>
                          </div>

                          {/* Profile Details */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Contact Person:</span>{" "}
                              <span className="font-medium" data-testid={`text-contact-${reseller.id}`}>
                                {reseller.contactPerson}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>{" "}
                              <span className="font-medium">{reseller.email}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone:</span>{" "}
                              <span className="font-medium">{reseller.phoneNumber}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Credit Limit:</span>{" "}
                              <span className="font-medium">£{reseller.creditLimit?.toLocaleString() || "0"}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Business Address:</span>{" "}
                              <span className="font-medium">{reseller.businessAddress}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Registered:</span>{" "}
                              <span className="font-medium">
                                {new Date(reseller.registrationDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          {/* Modern Gradient KPI Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Total Vendors</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
                  <PackageOpen className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">{vendors.length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">{vendors.filter((v: any) => v.approvalStatus === 'approved').length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">{pendingVendors.length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Stripe Connected</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{vendors.filter((v: any) => v.stripeChargesEnabled).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Vendor Approvals */}
          {pendingVendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Vendor Approvals</CardTitle>
                <CardDescription>Review and approve vendor applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingVendors.map((vendor: any) => (
                  <div 
                    key={vendor.id} 
                    className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
                    data-testid={`pending-vendor-${vendor.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-lg">{vendor.businessName}</p>
                            <p className="text-sm text-muted-foreground">Contact: {vendor.contactPerson}</p>
                          </div>
                          <Badge className="bg-purple-600 text-white">
                            Applying as Vendor
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <p><span className="text-muted-foreground">Email:</span> {vendor.email || 'N/A'}</p>
                          <p><span className="text-muted-foreground">Phone:</span> {vendor.phoneNumber || 'N/A'}</p>
                          {vendor.website && (
                            <p className="col-span-2"><span className="text-muted-foreground">Website:</span> {vendor.website}</p>
                          )}
                          <p className="col-span-2"><span className="text-muted-foreground">Address:</span> {vendor.businessAddress || 'N/A'}</p>
                          {vendor.businessDescription && (
                            <p className="col-span-2"><span className="text-muted-foreground">Description:</span> {vendor.businessDescription}</p>
                          )}
                          <p className="col-span-2"><span className="text-muted-foreground">Applied:</span> {vendor.registrationDate ? new Date(vendor.registrationDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => approveVendorMutation.mutate(vendor.id)}
                          disabled={approveVendorMutation.isPending}
                          data-testid={`approve-vendor-${vendor.id}`}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setRejectVendorDialog(vendor)}
                          data-testid={`reject-vendor-${vendor.id}`}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* All Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>All Vendors</CardTitle>
              <CardDescription>Manage all vendor accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No vendor applications yet</p>
              ) : (
                <div className="space-y-3">
                  {vendors.map((vendor: any) => (
                    <div 
                      key={vendor.id} 
                      className="p-4 bg-muted/50 rounded-lg border"
                      data-testid={`vendor-${vendor.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-lg">{vendor.businessName}</p>
                            <Badge className={getStatusBadge(vendor.approvalStatus).className}>
                              {vendor.approvalStatus}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                            <p><span className="text-muted-foreground">Contact:</span> {vendor.contactPerson || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Email:</span> {vendor.email || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Phone:</span> {vendor.phoneNumber || 'N/A'}</p>
                            {vendor.website && (
                              <p><span className="text-muted-foreground">Website:</span> {vendor.website}</p>
                            )}
                            <p><span className="text-muted-foreground">Address:</span> {vendor.businessAddress || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Applied:</span> {vendor.registrationDate ? new Date(vendor.registrationDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {vendor.approvalStatus === "approved" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setVendorManageTab("profile");
                                setManageVendorDialog(true);
                              }}
                              data-testid={`manage-vendor-${vendor.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" /> Manage
                            </Button>
                          )}
                          {vendor.approvalStatus === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => approveVendorMutation.mutate(vendor.id)}
                                disabled={approveVendorMutation.isPending}
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setRejectVendorDialog(vendor)}
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="relative group border-0 bg-gradient-to-br from-purple-500/20 via-violet-500/20 to-purple-500/20 backdrop-blur-xl shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total Reseller Products</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/40">
                  <Boxes className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                  {resellerAnalytics.reduce((sum, r) => sum + r.productCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Reseller Sales</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                  £{resellerAnalytics.reduce((sum, r) => sum + r.salesTotal, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Orders</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">
                  {resellerAnalytics.reduce((sum, r) => sum + r.orderCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Active Licences</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {resellerAnalytics.filter(r => r.licence?.status === 'active').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Reseller Performance
              </CardTitle>
              <CardDescription>Product counts and sales revenue per reseller</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : resellerAnalytics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No reseller data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Business Name</th>
                        <th className="text-left py-3 px-4 font-semibold">Contact</th>
                        <th className="text-center py-3 px-4 font-semibold">Licence Tier</th>
                        <th className="text-center py-3 px-4 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 font-semibold">Products</th>
                        <th className="text-right py-3 px-4 font-semibold">Total Sales</th>
                        <th className="text-center py-3 px-4 font-semibold">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resellerAnalytics
                        .filter(r => r.reseller.approvalStatus === 'approved')
                        .sort((a, b) => b.salesTotal - a.salesTotal)
                        .map(({ reseller, licence, productCount, salesTotal, orderCount }) => (
                          <tr key={reseller.id} className="border-b hover:bg-muted/50" data-testid={`analytics-row-${reseller.id}`}>
                            <td className="py-3 px-4 font-medium">{reseller.businessName}</td>
                            <td className="py-3 px-4 text-muted-foreground">{reseller.contactPerson}</td>
                            <td className="py-3 px-4 text-center">
                              {licence ? (
                                <Badge 
                                  variant={licence.tier === 'gold' ? 'default' : licence.tier === 'silver' ? 'secondary' : 'outline'}
                                  className={
                                    licence.tier === 'gold' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black' :
                                    licence.tier === 'silver' ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black' :
                                    licence.tier === 'bronze' ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white' :
                                    ''
                                  }
                                >
                                  {licence.tier ? licence.tier.charAt(0).toUpperCase() + licence.tier.slice(1) : 'Trial'}
                                </Badge>
                              ) : (
                                <Badge variant="outline">No Licence</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {licence ? (
                                <Badge 
                                  variant={licence.status === 'active' ? 'default' : licence.status === 'trial' ? 'secondary' : 'destructive'}
                                >
                                  {licence.status === 'trial' ? 'Trial' : licence.status.charAt(0).toUpperCase() + licence.status.slice(1)}
                                </Badge>
                              ) : (
                                <Badge variant="outline">N/A</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-semibold">{productCount}</span>
                                {licence && (
                                  <span className="text-xs text-muted-foreground">
                                    / {licence.productLimit === null ? '∞' : licence.productLimit}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              £{salesTotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">{orderCount}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Licence Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Licence Status Breakdown
              </CardTitle>
              <CardDescription>Overview of reseller licence statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Licences</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {resellerAnalytics.filter(r => r.licence?.status === 'active').length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Trial Period</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {resellerAnalytics.filter(r => r.licence?.status === 'trial').length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">Expired / Cancelled</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {resellerAnalytics.filter(r => r.licence?.status === 'expired' || r.licence?.status === 'cancelled').length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">No Licence</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {resellerAnalytics.filter(r => !r.licence).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messaging Center</CardTitle>
              <CardDescription>Communicate with resellers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-3">
                  <h3 className="font-semibold">Resellers</h3>
                  {resellers.map((reseller: any) => (
                    <Card
                      key={reseller.id}
                      className={`cursor-pointer hover-elevate ${
                        selectedReseller?.id === reseller.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedReseller(reseller)}
                      data-testid={`card-reseller-select-${reseller.id}`}
                    >
                      <CardContent className="p-3">
                        <p className="font-medium text-sm">{reseller.businessName}</p>
                        <p className="text-xs text-muted-foreground">{reseller.contactPerson}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="col-span-2">
                  {selectedReseller ? (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>{selectedReseller.businessName}</CardTitle>
                            <CardDescription>{selectedReseller.contactPerson}</CardDescription>
                          </div>
                          <Button
                            onClick={() => setMessageDialog(true)}
                            data-testid="button-send-message"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            New Message
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                        {messages.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No messages yet
                          </p>
                        ) : (
                          messages.map((message: any) => (
                            <Card key={message.id} data-testid={`card-message-${message.id}`}>
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <Badge variant="outline" data-testid={`badge-message-type-${message.id}`}>
                                    {message.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                                <p className="text-sm text-muted-foreground">{message.content}</p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Select a reseller to view messages</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders & Shipping Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Modern Gradient KPI Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Orders</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">{orders.length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">{orders.filter((o: any) => o.status === 'pending').length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Shipped</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
                  <Truck className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">{orders.filter((o: any) => o.status === 'shipped').length}</div>
              </CardContent>
            </Card>
            <Card className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl blur-xl" />
              <div className="absolute inset-[1px] pointer-events-none bg-gradient-to-br from-background/95 via-card/95 to-background/95 rounded-xl" />
              <CardHeader className="pb-2 relative z-10 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">{orders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Management & Shipping</CardTitle>
              <CardDescription>Track and manage reseller orders</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="mt-4 text-muted-foreground">Loading orders...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold" data-testid={`text-order-number-${order.id}`}>
                                Order #{order.orderNumber}
                              </h3>
                              <Badge
                                className={getStatusBadge(order.status).className}
                                data-testid={`badge-order-status-${order.id}`}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground" data-testid={`text-order-reseller-${order.id}`}>
                                {order.businessName || 'Unknown Reseller'}
                              </span>
                              <span>•</span>
                              <span data-testid={`text-order-amount-${order.id}`}>
                                £{parseFloat(order.finalAmount || '0').toFixed(2)}
                              </span>
                              <span>•</span>
                              <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(status) => 
                                updateOrderStatusMutation.mutate({ orderId: order.id, status })
                              }
                            >
                              <SelectTrigger className="w-36" data-testid={`select-order-status-${order.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShipmentDialog(true);
                              }}
                              data-testid={`button-add-shipment-${order.id}`}
                            >
                              <Truck className="w-4 h-4 mr-2" />
                              Add Shipping
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>Send system notifications to resellers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Reseller</Label>
                  <Select 
                    value={selectedReseller?.id || ""} 
                    onValueChange={(value) => {
                      const reseller = resellers.find((r: any) => r.id === value);
                      setSelectedReseller(reseller || null);
                    }}
                  >
                    <SelectTrigger data-testid="select-notification-reseller">
                      <SelectValue placeholder="Select a reseller" />
                    </SelectTrigger>
                    <SelectContent>
                      {resellers.filter((r: any) => r.approvalStatus === "approved").map((reseller: any) => (
                        <SelectItem key={reseller.id} value={reseller.id}>
                          {reseller.businessName} ({reseller.tier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedReseller && (
                  <>
                    <div className="space-y-2">
                      <Label>Notification Type</Label>
                      <Select value={notificationType} onValueChange={setNotificationType}>
                        <SelectTrigger data-testid="select-notification-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="order_update">Order Update</SelectItem>
                          <SelectItem value="stock_alert">Stock Alert</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        placeholder="Notification title"
                        data-testid="input-notification-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        placeholder="Type your notification message here..."
                        rows={4}
                        data-testid="textarea-notification-message"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Link (Optional)</Label>
                      <Input
                        value={notificationLink}
                        onChange={(e) => setNotificationLink(e.target.value)}
                        placeholder="/reseller-dashboard or external URL"
                        data-testid="input-notification-link"
                      />
                    </div>

                    <Button 
                      className="w-full"
                      onClick={handleSendNotification}
                      disabled={sendNotificationMutation.isPending}
                      data-testid="button-send-notification"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                    </Button>
                  </>
                )}

                {!selectedReseller && (
                  <p className="text-center text-muted-foreground py-8">
                    Select a reseller to send a notification
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Message Dialog */}
      <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
        <DialogContent data-testid="dialog-send-message">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedReseller?.businessName}</DialogTitle>
            <DialogDescription>
              Send a message to this reseller
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                <SelectTrigger data-testid="select-message-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="order">Order Related</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                data-testid="textarea-message-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessageDialog(false)}
              data-testid="button-cancel-message"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              data-testid="button-submit-message"
            >
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shipment Dialog */}
      <Dialog open={shipmentDialog} onOpenChange={setShipmentDialog}>
        <DialogContent data-testid="dialog-add-shipment">
          <DialogHeader>
            <DialogTitle>Add Shipping Details</DialogTitle>
            <DialogDescription>
              Add tracking and delivery information for Order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createShipmentMutation.mutate({
                orderId: selectedOrder.id,
                data: {
                  carrier: formData.get("carrier"),
                  trackingNumber: formData.get("trackingNumber"),
                  trackingUrl: formData.get("trackingUrl"),
                  estimatedDelivery: formData.get("estimatedDelivery"),
                  actualDelivery: formData.get("actualDelivery") || null,
                  shipmentNotes: formData.get("shipmentNotes") || null,
                },
              });
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Select name="carrier" required>
                <SelectTrigger data-testid="select-carrier">
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="royal_mail">Royal Mail</SelectItem>
                  <SelectItem value="dpd">DPD</SelectItem>
                  <SelectItem value="hermes">Hermes/Evri</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                name="trackingNumber"
                required
                data-testid="input-tracking-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingUrl">Tracking URL</Label>
              <Input
                id="trackingUrl"
                name="trackingUrl"
                type="url"
                placeholder="https://..."
                data-testid="input-tracking-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                id="estimatedDelivery"
                name="estimatedDelivery"
                type="date"
                required
                data-testid="input-estimated-delivery"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipmentNotes">Shipment Notes</Label>
              <Textarea
                id="shipmentNotes"
                name="shipmentNotes"
                rows={3}
                data-testid="textarea-shipment-notes"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShipmentDialog(false)}
                data-testid="button-cancel-shipment"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createShipmentMutation.isPending}
                data-testid="button-submit-shipment"
              >
                {createShipmentMutation.isPending ? "Adding..." : "Add Shipment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
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
              value={vendorRejectionReason}
              onChange={(e) => setVendorRejectionReason(e.target.value)}
              data-testid="input-vendor-rejection-reason"
            />
            <Button
              variant="destructive"
              onClick={() => rejectVendorDialog && rejectVendorMutation.mutate({ id: rejectVendorDialog.id, reason: vendorRejectionReason })}
              disabled={!vendorRejectionReason || rejectVendorMutation.isPending}
              className="w-full"
              data-testid="button-confirm-vendor-reject"
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Management Dialog */}
      <Dialog open={manageVendorDialog} onOpenChange={(open) => {
        setManageVendorDialog(open);
        if (!open) {
          setSelectedVendor(null);
          setVendorManageTab("profile");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Vendor: {selectedVendor?.businessName}</DialogTitle>
            <DialogDescription>View vendor profile, products, and orders</DialogDescription>
          </DialogHeader>

          <Tabs value={vendorManageTab} onValueChange={setVendorManageTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" data-testid="vendor-tab-profile">Profile</TabsTrigger>
              <TabsTrigger value="products" data-testid="vendor-tab-products">Products</TabsTrigger>
              <TabsTrigger value="inventory" data-testid="vendor-tab-inventory">Inventory</TabsTrigger>
              <TabsTrigger value="orders" data-testid="vendor-tab-orders">Orders</TabsTrigger>
            </TabsList>

            {/* Vendor Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Business Name:</span>{" "}
                      <span className="font-medium">{selectedVendor?.businessName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contact Person:</span>{" "}
                      <span className="font-medium">{selectedVendor?.contactPerson || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{selectedVendor?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium">{selectedVendor?.phoneNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span>{" "}
                      <span className="font-medium">{selectedVendor?.businessAddress || 'N/A'}</span>
                    </div>
                    {selectedVendor?.website && (
                      <div>
                        <span className="text-muted-foreground">Website:</span>{" "}
                        <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                          {selectedVendor.website}
                        </a>
                      </div>
                    )}
                    {selectedVendor?.businessDescription && (
                      <div>
                        <span className="text-muted-foreground">Description:</span>{" "}
                        <span className="font-medium">{selectedVendor.businessDescription}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Account Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge className={getStatusBadge(selectedVendor?.approvalStatus || "pending").className}>
                        {selectedVendor?.approvalStatus}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Active:</span>{" "}
                      <span className="font-medium">{selectedVendor?.isActive ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registered:</span>{" "}
                      <span className="font-medium">
                        {selectedVendor?.registrationDate && new Date(selectedVendor.registrationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Products:</span>{" "}
                      <span className="font-medium">{selectedVendor?.totalProductsCreated || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Average Rating:</span>{" "}
                      <span className="font-medium">{selectedVendor?.averageRating || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Password Reset Section for Vendor */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Password Management</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Reset the wholesaler's password to a new value. You can then share it with them securely.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setVendorPasswordResetDialog(true)}
                  data-testid="button-reset-vendor-password"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </TabsContent>

            {/* Vendor Products Tab */}
            <TabsContent value="products" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {vendorProductsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading products...</span>
                  </div>
                ) : vendorProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No products created yet</p>
                ) : (
                  vendorProducts.map((product: any) => (
                    <Card key={product.id} data-testid={`vendor-product-${product.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">£{parseFloat(product.price || '0').toFixed(2)}</p>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Stock:</span>{" "}
                            <span className="font-medium">{product.stockQuantity || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">SKU:</span>{" "}
                            <span className="font-medium">{product.sku || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>{" "}
                            <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Vendor Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">Inventory Overview</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {vendorProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No inventory data available</p>
                  ) : (
                    vendorProducts.map((product: any) => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-background rounded-lg border" data-testid={`vendor-inventory-${product.id}`}>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${(product.stockQuantity || 0) <= 10 ? 'text-red-500' : 'text-green-500'}`}>
                            {product.stockQuantity || 0} in stock
                          </p>
                          {(product.stockQuantity || 0) <= 10 && (
                            <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Vendor Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.filter((order: any) => order.userId === selectedVendor?.userId).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                ) : (
                  orders
                    .filter((order: any) => order.userId === selectedVendor?.userId)
                    .map((order: any) => (
                      <Card key={order.id} data-testid={`vendor-order-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusBadge(order.status).className}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold mt-2">£{parseFloat(order.totalAmount || '0').toFixed(2)}</p>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Reseller Management Dialog */}
      <Dialog open={manageResellerDialog} onOpenChange={setManageResellerDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Reseller: {selectedReseller?.businessName}</DialogTitle>
            <DialogDescription>Real-time inventory, orders, and earnings management</DialogDescription>
          </DialogHeader>

          <Tabs value={manageTab} onValueChange={setManageTab}>
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <BarChart3 className="w-4 h-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="inventory" data-testid="tab-inventory">
                <Boxes className="w-4 h-4 mr-1" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="earnings" data-testid="tab-earnings">
                <DollarSign className="w-4 h-4 mr-1" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="commission" data-testid="tab-commission">
                <DollarSign className="w-4 h-4 mr-1" />
                Commission
              </TabsTrigger>
              <TabsTrigger value="sms" data-testid="tab-sms">
                <MessageSquare className="w-4 h-4 mr-1" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
              <TabsTrigger value="tier" data-testid="tab-tier">Tier</TabsTrigger>
              <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
            </TabsList>

            {/* Overview Tab - Real-time Stats Dashboard */}
            <TabsContent value="overview" className="space-y-4">
              {(statsLoading || resellerOrdersLoading || earningsLoading) ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading real-time data...</span>
                </div>
              ) : (
                <>
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Orders</p>
                            <p className="text-2xl font-bold text-blue-500">
                              {(resellerOrdersData?.stats?.totalWholesaleOrders || 0) + (resellerOrdersData?.stats?.totalCustomerOrders || 0)}
                            </p>
                          </div>
                          <ShoppingCart className="w-8 h-8 text-blue-500/50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-500">
                              £{((resellerOrdersData?.stats?.totalWholesaleValue || 0) + (resellerOrdersData?.stats?.totalCustomerValue || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-500/50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Earnings</p>
                            <p className="text-2xl font-bold text-purple-500">
                              £{(resellerEarningsData?.stats?.totalEarnings || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                          </div>
                          <DollarSign className="w-8 h-8 text-purple-500/50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Inventory Items</p>
                            <p className="text-2xl font-bold text-orange-500">
                              {resellerStatsData?.inventoryStats?.totalItems || 0}
                            </p>
                          </div>
                          <Boxes className="w-8 h-8 text-orange-500/50" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Status Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Order Status Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="text-xl font-bold text-yellow-600">
                            {(resellerOrdersData?.stats?.pendingWholesale || 0) + (resellerOrdersData?.stats?.pendingCustomer || 0)}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">Processing</p>
                          <p className="text-xl font-bold text-blue-600">
                            {resellerOrdersData?.wholesaleOrders?.filter((o: any) => o.status === 'processing')?.length || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">Shipped</p>
                          <p className="text-xl font-bold text-purple-600">
                            {resellerOrdersData?.wholesaleOrders?.filter((o: any) => o.status === 'shipped')?.length || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">Delivered</p>
                          <p className="text-xl font-bold text-green-600">
                            {(resellerOrdersData?.stats?.completedWholesale || 0) + (resellerOrdersData?.stats?.completedCustomer || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inventory Alerts */}
                  {resellerStatsData?.inventoryStats?.lowStockItems > 0 && (
                    <Card className="border-orange-500/50 bg-orange-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-orange-500" />
                          <div>
                            <p className="font-semibold text-orange-500">Low Stock Alert</p>
                            <p className="text-sm text-muted-foreground">
                              {resellerStatsData.inventoryStats.lowStockItems} item(s) have low stock levels
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Inventory Tab - Real-time Stock Levels */}
            <TabsContent value="inventory" className="space-y-4">
              {inventoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Inventory Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Products</p>
                        <p className="text-2xl font-bold">{resellerInventoryData?.resellerInventory?.length || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Units</p>
                        <p className="text-2xl font-bold">
                          {resellerInventoryData?.resellerInventory?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                        <p className="text-2xl font-bold text-orange-500">
                          {resellerInventoryData?.resellerInventory?.filter((item: any) => (item.quantity || 0) < 10)?.length || 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Inventory List */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Inventory Items</CardTitle>
                      <CardDescription>Real-time stock levels for this reseller</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {!resellerInventoryData?.resellerInventory?.length ? (
                          <p className="text-center text-muted-foreground py-8">No inventory items yet</p>
                        ) : (
                          resellerInventoryData.resellerInventory.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`inventory-item-${item.id}`}>
                              <div className="flex items-center gap-3">
                                {item.productImage && (
                                  <img src={convertToDirectUrl(item.productImage)} alt={item.productName} className="w-12 h-12 rounded-md object-cover" />
                                )}
                                <div>
                                  <p className="font-medium">{item.productName || 'Unknown Product'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.size && `Size: ${item.size}`} {item.color && `| Colour: ${item.color}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={item.quantity < 10 ? "destructive" : item.quantity < 25 ? "secondary" : "default"}>
                                  {item.quantity || 0} in stock
                                </Badge>
                                {item.reorderLevel && item.quantity <= item.reorderLevel && (
                                  <p className="text-xs text-orange-500 mt-1">Below reorder level</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Available Products to Order */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Available Products</CardTitle>
                      <CardDescription>Products available for this reseller to order</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {!resellerInventoryData?.availableProducts?.length ? (
                          <p className="text-center text-muted-foreground py-4">No products available</p>
                        ) : (
                          resellerInventoryData.availableProducts.slice(0, 10).map((pv: any) => (
                            <div key={pv.product.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div>
                                <p className="font-medium text-sm">{pv.product.name}</p>
                                <p className="text-xs text-muted-foreground">{pv.variants.length} variant(s)</p>
                              </div>
                              <p className="text-sm font-semibold">£{parseFloat(pv.product.price || '0').toFixed(2)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Enhanced Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {resellerOrdersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Order Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Wholesale Orders</p>
                        <p className="text-2xl font-bold">{resellerOrdersData?.stats?.totalWholesaleOrders || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Customer Orders</p>
                        <p className="text-2xl font-bold">{resellerOrdersData?.stats?.totalCustomerOrders || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Wholesale Value</p>
                        <p className="text-2xl font-bold text-green-500">
                          £{(resellerOrdersData?.stats?.totalWholesaleValue || 0).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Customer Value</p>
                        <p className="text-2xl font-bold text-blue-500">
                          £{(resellerOrdersData?.stats?.totalCustomerValue || 0).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Wholesale Orders */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Wholesale Orders (From 1stRep)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {!resellerOrdersData?.wholesaleOrders?.length ? (
                          <p className="text-center text-muted-foreground py-4">No wholesale orders yet</p>
                        ) : (
                          resellerOrdersData.wholesaleOrders.map((order: any) => (
                            <Card key={order.id} className="hover-elevate" data-testid={`wholesale-order-${order.id}`}>
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">Order #{order.orderNumber || order.id.substring(0, 8)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {order.items?.length || 0} item(s)
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge className={getStatusBadge(order.status).className}>
                                      {order.status}
                                    </Badge>
                                    <p className="text-lg font-bold mt-1">£{parseFloat(order.totalAmount || '0').toFixed(2)}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Orders */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Customer Orders (Through Storefront)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {!resellerOrdersData?.customerOrders?.length ? (
                          <p className="text-center text-muted-foreground py-4">No customer orders yet</p>
                        ) : (
                          resellerOrdersData.customerOrders.map((order: any) => (
                            <Card key={order.id} className="hover-elevate" data-testid={`customer-order-${order.id}`}>
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold">Order #{order.id.substring(0, 8)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Customer: {order.customerEmail || 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge className={getStatusBadge(order.status).className}>
                                      {order.status}
                                    </Badge>
                                    <p className="text-lg font-bold mt-1">£{parseFloat(order.totalAmount || '0').toFixed(2)}</p>
                                    {order.resellerEarnings && (
                                      <p className="text-xs text-green-500">Earnings: £{parseFloat(order.resellerEarnings || '0').toFixed(2)}</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-4">
              {/* Date Range Filter */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Filter by Date Range</p>
                      <p className="text-xs text-muted-foreground">View earnings for a specific time period</p>
                    </div>
                    <DateRangeFilter
                      startDate={earningsStartDate}
                      endDate={earningsEndDate}
                      onDateChange={(start, end) => {
                        setEarningsStartDate(start);
                        setEarningsEndDate(end);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {earningsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Print / Download toolbar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      Earnings report for <span className="font-medium text-foreground">{selectedReseller?.businessName || selectedReseller?.name}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadEarningsCSV} disabled={!resellerEarningsData}>
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={printEarningsReport} disabled={!resellerEarningsData}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print / Save PDF
                      </Button>
                    </div>
                  </div>

                  {/* Earnings Summary — top 4 KPI cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-500">
                          £{(resellerEarningsData?.stats?.totalRevenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resellerEarningsData?.stats?.totalOrders || 0} orders
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Reseller Earnings</p>
                        <p className="text-2xl font-bold text-purple-500">
                          £{(resellerEarningsData?.stats?.totalEarnings || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resellerEarningsData?.stats?.commissionRate ?? '?'}% on catalogue · 100% on own
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Platform Cut</p>
                        <p className="text-2xl font-bold text-blue-500">
                          £{(resellerEarningsData?.stats?.platformCommission || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          1stRep catalogue commission
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                        <p className="text-2xl font-bold text-orange-500">
                          £{(resellerEarningsData?.stats?.averageOrderValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resellerEarningsData?.stats?.storefrontOrders || 0} storefront · {resellerEarningsData?.stats?.eposOrders || 0} EPOS
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Revenue Breakdown: Catalogue vs Own Products */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                      <CardDescription>How earnings split between 1stRep catalogue and reseller's own products</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-lg space-y-1">
                          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">1stRep Catalogue</p>
                          <p className="text-xl font-bold">£{(resellerEarningsData?.stats?.catalogueRevenue || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">revenue</p>
                          <div className="pt-1 border-t border-blue-500/10">
                            <p className="text-sm font-semibold text-blue-400">
                              £{(resellerEarningsData?.stats?.catalogueEarnings || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">reseller's {resellerEarningsData?.stats?.commissionRate ?? '?'}% cut</p>
                          </div>
                          <div className="pt-1">
                            <p className="text-sm font-semibold text-foreground">
                              £{(resellerEarningsData?.stats?.platformCommission || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">1stRep platform cut</p>
                          </div>
                        </div>
                        <div className="p-4 bg-violet-500/8 border border-violet-500/20 rounded-lg space-y-1">
                          <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide">Own Products</p>
                          <p className="text-xl font-bold">£{(resellerEarningsData?.stats?.ownProductRevenue || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">revenue (EPOS &amp; online)</p>
                          <div className="pt-1 border-t border-violet-500/10">
                            <p className="text-sm font-semibold text-violet-400">
                              £{(resellerEarningsData?.stats?.ownProductEarnings || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">reseller keeps 100%</p>
                          </div>
                          <div className="pt-1">
                            <p className="text-sm font-semibold text-muted-foreground">£0.00</p>
                            <p className="text-xs text-muted-foreground">platform cut (none)</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Sales Breakdown */}
                  {((resellerEarningsData?.stats?.catalogueProductSales?.length > 0) || (resellerEarningsData?.stats?.ownProductSales?.length > 0)) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Product Sales Breakdown</CardTitle>
                        <CardDescription>Individual products sold — 1stRep catalogue vs their own</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 1stRep Catalogue Products */}
                        {resellerEarningsData?.stats?.catalogueProductSales?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">1stRep Catalogue Products</p>
                            <div className="rounded-md border border-blue-500/20 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-blue-500/8">
                                  <tr>
                                    <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Product</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Units Sold</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Revenue</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Reseller Earns</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">1stRep Cut</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-500/10">
                                  {resellerEarningsData.stats.catalogueProductSales.map((p: any, i: number) => (
                                    <tr key={i} className="hover-elevate">
                                      <td className="px-3 py-2 font-medium">{p.productName}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{p.qty}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">£{Number(p.revenue).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-blue-400">£{Number(p.earnings).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">£{(Number(p.revenue) - Number(p.earnings)).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-blue-500/5 font-semibold">
                                    <td className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">Total</td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      {resellerEarningsData.stats.catalogueProductSales.reduce((s: number, p: any) => s + p.qty, 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      £{resellerEarningsData.stats.catalogueProductSales.reduce((s: number, p: any) => s + Number(p.revenue), 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums text-blue-400">
                                      £{resellerEarningsData.stats.catalogueProductSales.reduce((s: number, p: any) => s + Number(p.earnings), 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                      £{resellerEarningsData.stats.catalogueProductSales.reduce((s: number, p: any) => s + (Number(p.revenue) - Number(p.earnings)), 0).toFixed(2)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Own Products */}
                        {resellerEarningsData?.stats?.ownProductSales?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-2">Reseller's Own Products</p>
                            <div className="rounded-md border border-violet-500/20 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-violet-500/8">
                                  <tr>
                                    <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Product</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Units Sold</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Revenue</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Reseller Keeps</th>
                                    <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">1stRep Cut</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-violet-500/10">
                                  {resellerEarningsData.stats.ownProductSales.map((p: any, i: number) => (
                                    <tr key={i} className="hover-elevate">
                                      <td className="px-3 py-2 font-medium">{p.productName}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{p.qty}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">£{Number(p.revenue).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-violet-400">£{Number(p.earnings).toFixed(2)}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">£0.00</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-violet-500/5 font-semibold">
                                    <td className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">Total</td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      {resellerEarningsData.stats.ownProductSales.reduce((s: number, p: any) => s + p.qty, 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      £{resellerEarningsData.stats.ownProductSales.reduce((s: number, p: any) => s + Number(p.revenue), 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums text-violet-400">
                                      £{resellerEarningsData.stats.ownProductSales.reduce((s: number, p: any) => s + Number(p.earnings), 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">£0.00</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Payout Status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Payout Status</CardTitle>
                      <CardDescription>What 1stRep currently owes this reseller</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Available to Pay</p>
                          <p className="text-xl font-bold text-amber-500">
                            £{(resellerEarningsData?.stats?.availableBalance || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">earned, not yet paid</p>
                        </div>
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Requests</p>
                          <p className="text-xl font-bold text-yellow-600">
                            £{(resellerEarningsData?.stats?.pendingPayoutTotal || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">payout requests in progress</p>
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid Out</p>
                          <p className="text-xl font-bold text-green-600">
                            £{(resellerEarningsData?.stats?.paidCommission || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">successfully transferred</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Commission Rules */}
                  {resellerEarningsData?.commissionRules?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Commission Rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {resellerEarningsData.commissionRules.map((rule: any) => (
                            <div key={rule.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                              <span className="text-sm">{rule.name || 'Default Rule'}</span>
                              <Badge variant="outline">
                                {rule.commissionType === 'percentage' 
                                  ? `${rule.commissionValue}%` 
                                  : `£${rule.commissionValue}`}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Orders with Earnings */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Recent Orders with Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {!resellerEarningsData?.recentOrders?.length ? (
                          <p className="text-center text-muted-foreground py-4">No orders with earnings yet</p>
                        ) : (
                          resellerEarningsData.recentOrders.map((order: any) => (
                            <div key={order.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">Order #{order.id.substring(0, 8)}</p>
                                  {order.source && (
                                    <Badge variant="outline" className="text-xs py-0">
                                      {order.source === 'storefront' ? 'Storefront' : 'EPOS'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">£{parseFloat(order.totalAmount || '0').toFixed(2)}</p>
                                <p className="text-xs text-green-500">
                                  Earned: £{parseFloat(order.resellerEarnings || '0').toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={editProfile.businessName || ""}
                    onChange={(e) => setEditProfile({ ...editProfile, businessName: e.target.value })}
                    data-testid="input-business-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={editProfile.contactPerson || ""}
                    onChange={(e) => setEditProfile({ ...editProfile, contactPerson: e.target.value })}
                    data-testid="input-contact-person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={editProfile.phoneNumber || ""}
                    onChange={(e) => setEditProfile({ ...editProfile, phoneNumber: e.target.value })}
                    data-testid="input-phone-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={selectedReseller?.email || ""} disabled />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea
                    id="businessAddress"
                    value={editProfile.businessAddress || ""}
                    onChange={(e) => setEditProfile({ ...editProfile, businessAddress: e.target.value })}
                    rows={2}
                    data-testid="input-business-address"
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!selectedReseller) return;
                  updateProfileMutation.mutate({
                    id: selectedReseller.id,
                    data: editProfile,
                  });
                }}
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </TabsContent>

            {/* Tier & Credit Tab */}
            <TabsContent value="tier" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select
                    value={editProfile.tier || "bronze"}
                    onValueChange={(value) => setEditProfile({ ...editProfile, tier: value })}
                  >
                    <SelectTrigger data-testid="select-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Discount Percentage</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={editProfile.discountPercentage || 0}
                    onChange={(e) => setEditProfile({ ...editProfile, discountPercentage: parseFloat(e.target.value) })}
                    data-testid="input-discount-percentage"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit (£)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    min="0"
                    value={editProfile.creditLimit || 0}
                    onChange={(e) => setEditProfile({ ...editProfile, creditLimit: parseFloat(e.target.value) })}
                    data-testid="input-credit-limit"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="allowedPaymentMethods">Allowed Payment Methods</Label>
                  <Select
                    value={editProfile.allowedPaymentMethods || "both"}
                    onValueChange={(value) => setEditProfile({ ...editProfile, allowedPaymentMethods: value })}
                  >
                    <SelectTrigger data-testid="select-payment-methods">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both (Credit & Pay Now)</SelectItem>
                      <SelectItem value="credit">Credit Only</SelectItem>
                      <SelectItem value="pay_now">Pay Now Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Control which payment methods this reseller can use when placing orders.
                  </p>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Leave empty for default rate"
                    value={editProfile.commissionRate || ""}
                    onChange={(e) => setEditProfile({ ...editProfile, commissionRate: e.target.value })}
                    data-testid="input-commission-rate"
                  />
                  <p className="text-xs text-muted-foreground">
                    Platform commission on reseller sales (0-100%). Leave empty to use the default commission rate.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-semibold mb-2">Current Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Tier:</span>{" "}
                    <span className="font-medium">{selectedReseller?.tier}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Discount:</span>{" "}
                    <span className="font-medium">{selectedReseller?.discountPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credit Limit:</span>{" "}
                    <span className="font-medium">£{selectedReseller?.creditLimit?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Methods:</span>{" "}
                    <span className="font-medium">
                      {selectedReseller?.allowedPaymentMethods === "both" ? "Both" : 
                       selectedReseller?.allowedPaymentMethods === "credit" ? "Credit Only" : "Pay Now Only"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commission Rate:</span>{" "}
                    <span className="font-medium">
                      {selectedReseller?.commissionRate ? `${selectedReseller.commissionRate}%` : "Default"}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!selectedReseller) return;
                  updateProfileMutation.mutate({
                    id: selectedReseller.id,
                    data: {
                      tier: editProfile.tier,
                      discountPercentage: editProfile.discountPercentage,
                      creditLimit: editProfile.creditLimit,
                      allowedPaymentMethods: editProfile.allowedPaymentMethods,
                      commissionRate: editProfile.commissionRate || null,
                    },
                  });
                }}
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-tier"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Update Settings"}
              </Button>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.filter((order: any) => order.userId === selectedReseller?.userId).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                ) : (
                  orders
                    .filter((order: any) => order.userId === selectedReseller?.userId)
                    .map((order: any) => (
                      <Card key={order.id} data-testid={`card-order-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">Order #{order.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.orderDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusBadge(order.status).className}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold mt-2">£{parseFloat(order.totalAmount || '0').toFixed(2)}</p>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            {/* Commission Overrides Tab */}
            <TabsContent value="commission" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Commission Rate Overrides</CardTitle>
                  <CardDescription>
                    Set custom commission rates for specific products. Leave product empty for a global rate override.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Override Form */}
                  <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                    <h4 className="font-medium">Add Commission Override</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="overrideProduct">Product (optional)</Label>
                        <Select
                          value={newCommissionOverride.productId || "global"}
                          onValueChange={(value) => setNewCommissionOverride({ 
                            ...newCommissionOverride, 
                            productId: value === "global" ? "" : value 
                          })}
                        >
                          <SelectTrigger data-testid="select-override-product">
                            <SelectValue placeholder="Select product or leave for global" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global">Global (All Products)</SelectItem>
                            {allProducts.filter((p: any) => !p.vendorId).map((product: any) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overrideRate">Commission Rate (%)</Label>
                        <Input
                          id="overrideRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="e.g., 15"
                          value={newCommissionOverride.commissionRate}
                          onChange={(e) => setNewCommissionOverride({ 
                            ...newCommissionOverride, 
                            commissionRate: e.target.value 
                          })}
                          data-testid="input-override-commission-rate"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overrideStorefront">Storefront Price (optional)</Label>
                        <Input
                          id="overrideStorefront"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Leave empty for default"
                          value={newCommissionOverride.storefrontPrice}
                          onChange={(e) => setNewCommissionOverride({ 
                            ...newCommissionOverride, 
                            storefrontPrice: e.target.value 
                          })}
                          data-testid="input-override-storefront-price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="overrideNotes">Notes (optional)</Label>
                        <Input
                          id="overrideNotes"
                          placeholder="e.g., Special rate for VIP partner"
                          value={newCommissionOverride.notes}
                          onChange={(e) => setNewCommissionOverride({ 
                            ...newCommissionOverride, 
                            notes: e.target.value 
                          })}
                          data-testid="input-override-notes"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (!selectedReseller || !newCommissionOverride.commissionRate) {
                          toast({ title: "Commission rate is required", variant: "destructive" });
                          return;
                        }
                        createOverrideMutation.mutate({
                          partnerType: "reseller",
                          resellerId: selectedReseller.id,
                          productId: newCommissionOverride.productId || null,
                          commissionRate: parseFloat(newCommissionOverride.commissionRate),
                          storefrontPrice: newCommissionOverride.storefrontPrice ? parseFloat(newCommissionOverride.storefrontPrice) : null,
                          notes: newCommissionOverride.notes || null,
                        });
                      }}
                      disabled={createOverrideMutation.isPending}
                      data-testid="button-add-override"
                    >
                      {createOverrideMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Add Override
                    </Button>
                  </div>

                  {/* Existing Overrides List */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Active Overrides</h4>
                    {overridesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : commissionOverrides.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No custom commission rates set for this partner. Using default product rates.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {commissionOverrides.map((item: any) => (
                          <Card key={item.override.id} data-testid={`override-${item.override.id}`}>
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {item.product ? item.product.name : "Global Override (All Products)"}
                                </p>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                  <span>Commission: <strong className="text-foreground">{item.override.commissionRate}%</strong></span>
                                  {item.override.storefrontPrice && (
                                    <span>Storefront: <strong className="text-foreground">£{parseFloat(item.override.storefrontPrice).toFixed(2)}</strong></span>
                                  )}
                                </div>
                                {item.override.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{item.override.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newRate = prompt("Enter new commission rate (%):", item.override.commissionRate);
                                    if (newRate !== null) {
                                      updateOverrideMutation.mutate({
                                        id: item.override.id,
                                        commissionRate: parseFloat(newRate),
                                      });
                                    }
                                  }}
                                  data-testid={`button-edit-override-${item.override.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Remove this commission override?")) {
                                      deleteOverrideMutation.mutate(item.override.id);
                                    }
                                  }}
                                  data-testid={`button-delete-override-${item.override.id}`}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="font-semibold mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge className={getStatusBadge(selectedReseller?.approvalStatus || "pending").className}>
                        {selectedReseller?.approvalStatus}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registered:</span>{" "}
                      <span className="font-medium">
                        {selectedReseller?.registrationDate && new Date(selectedReseller.registrationDate).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User ID:</span>{" "}
                      <span className="font-medium">{selectedReseller?.userId}</span>
                    </div>
                  </div>
                </div>

                {/* Password Reset Section */}
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="font-semibold mb-2">Password Management</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Reset the reseller's password to a new value. You can then share it with them securely.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setPasswordResetDialog(true)}
                    data-testid="button-reset-password"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </div>

                {selectedReseller?.approvalStatus === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (!selectedReseller) return;
                        approveMutation.mutate(selectedReseller.id);
                        setManageResellerDialog(false);
                      }}
                      disabled={approveMutation.isPending}
                      data-testid="button-approve-reseller"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve Reseller
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setRejectDialog(selectedReseller);
                        setManageResellerDialog(false);
                      }}
                      data-testid="button-reject-reseller"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* SMS Tab — text the reseller directly, thread pulled live from Twilio */}
            <TabsContent value="sms" className="space-y-4">
              {!selectedReseller?.phoneNumber ? (
                <p className="text-sm text-muted-foreground italic">
                  No phone number on file for this reseller.
                </p>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">SMS Messages</h3>
                    {resellerSmsThreadLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  {(resellerSmsThread?.messages?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      {resellerSmsThread?.configured === false
                        ? "SMS isn't configured on this server."
                        : "No SMS messages sent or received with this reseller yet."}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto rounded-lg border p-3 bg-muted/30">
                      {resellerSmsThread!.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              m.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border'
                            }`}
                            data-testid={`reseller-sms-message-${i}`}
                          >
                            <p className="whitespace-pre-wrap">{linkifyMessageBody(m.body)}</p>
                            <p className={`text-[10px] mt-1 ${m.direction === 'outbound' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(m.date).toLocaleString("en-GB")} &middot; {m.direction === 'outbound' ? '1stRep' : selectedReseller?.businessName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {resellerSmsThread?.configured !== false && (
                    <div className="flex gap-2 mt-2">
                      <Textarea
                        value={resellerSmsComposeText}
                        onChange={(e) => setResellerSmsComposeText(e.target.value)}
                        placeholder="Type a message to text this reseller..."
                        rows={2}
                        className="text-sm resize-none"
                        data-testid="textarea-reseller-sms-compose"
                      />
                      <Button
                        size="sm"
                        className="self-end"
                        disabled={!resellerSmsComposeText.trim() || sendResellerSmsMutation.isPending}
                        onClick={() => selectedReseller && sendResellerSmsMutation.mutate({ id: selectedReseller.id, message: resellerSmsComposeText.trim() })}
                        data-testid="button-send-reseller-sms"
                      >
                        {sendResellerSmsMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Send"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialog} onOpenChange={setPasswordResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedReseller?.businessName}. You can share this password with them securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordResetDialog(false);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedReseller || !newPassword) return;
                resetPasswordMutation.mutate({
                  id: selectedReseller.id,
                  newPassword
                });
              }}
              disabled={!newPassword || newPassword.length < 6 || resetPasswordMutation.isPending}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Password Reset Dialog */}
      <Dialog open={vendorPasswordResetDialog} onOpenChange={setVendorPasswordResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Wholesaler Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedVendor?.businessName}. You can share this password with them securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorNewPassword">New Password</Label>
              <Input
                id="vendorNewPassword"
                type="text"
                value={vendorNewPassword}
                onChange={(e) => setVendorNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                data-testid="input-vendor-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVendorPasswordResetDialog(false);
                setVendorNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedVendor || !vendorNewPassword) return;
                resetVendorPasswordMutation.mutate({
                  id: selectedVendor.id,
                  newPassword: vendorNewPassword
                });
              }}
              disabled={!vendorNewPassword || vendorNewPassword.length < 6 || resetVendorPasswordMutation.isPending}
              data-testid="button-confirm-vendor-reset-password"
            >
              {resetVendorPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
