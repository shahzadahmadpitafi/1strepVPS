import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { format } from "date-fns";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { 
  Package, 
  Search, 
  Filter,
  Download,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Globe,
  Store,
  Users,
  Monitor,
  Calendar,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Printer,
  Mail,
  Copy,
  History,
  RotateCcw,
  CircleDot,
  PlusCircle,
  Trash2,
  AlertTriangle,
  LayoutList,
  Reply,
  ChevronDown,
  ChevronUp,
  Inbox,
  Send,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { linkifyMessageBody } from "@/lib/linkify";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  productName: string;
  sku?: string;
  barcodeDescriptor?: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  isPreOrder?: boolean;
  imageUrl?: string;
  vendorProductId?: string | null;
  locationNote?: string | null;
}

interface StatusHistory {
  id: string;
  orderId: string;
  previousStatus: string | null;
  newStatus: string;
  changedBy: string | null;
  changedByName: string | null;
  notes: string | null;
  createdAt: string;
}

interface EmailLogEntry {
  id: string;
  orderId: string;
  sentBy: string | null;
  sentByName: string | null;
  recipientEmail: string;
  subject?: string;
  success: boolean;
  createdAt: string;
}

interface EmailThreadMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  snippet: string;
}

interface SmsThreadMessage {
  direction: 'inbound' | 'outbound';
  body: string;
  status: string;
  date: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  phoneNumber?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  totalAmount: string;
  couponCode?: string;
  discountAmount?: string;
  paymentMethod: string;
  isPaid: boolean;
  trackingNumber?: string;
  notes?: string;
  orderDate: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: OrderItem[];
  channel?: string;
  resellerId?: string;
  resellerName?: string;
  resellerBusinessAddress?: string;
  vendorId?: string;
  vendorName?: string;
  eposTerminalId?: string;
  customerPhone?: string;
  ownSquarePaid?: boolean;
  smsLastError?: string | null;
  smsLastErrorAt?: string | null;
}

interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  byChannel: {
    website: number;
    customer_epos: number;
    reseller_storefront: number;
    reseller_epos: number;
    vendor_storefront: number;
    vendor_epos: number;
    admin: number;
  };
  resellerBreakdown: Array<{
    resellerId: string;
    resellerName: string;
    count: number;
    revenue: number;
  }>;
  byStatus: {
    pending: number;
    paid: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

interface Reseller {
  id: string;
  businessName: string;
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightOrderNumber, setHighlightOrderNumber] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  // Real-time: auto-refresh orders list and show a toast when any EPOS/online order arrives
  useSocket({
    room: "admin",
    onOrderEvent: (event) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      if (event?.type === "new_order") {
        const isEpos = event.source === "epos" || event.source === "reseller";
        toast({
          title: isEpos ? "New EPOS Order Received" : "New Online Order",
          description: `${event.customerName ? `From ${event.customerName} — ` : ""}${event.itemCount} item${event.itemCount !== 1 ? "s" : ""} · £${Number(event.totalAmount).toFixed(2)}`,
          duration: 6000,
        });
      }
    },
  });

  const [resellerFilter, setResellerFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [preOrderFilter, setPreOrderFilter] = useState("all"); // all, preorder, regular
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [smsComposeText, setSmsComposeText] = useState("");
  const [activePanel, setActivePanel] = useState<'all' | '1strep' | 'own_products'>('all');

  // Manual order creation (for recovering ghost payments)
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [ghostNotificationId, setGhostNotificationId] = useState<string | null>(null);
  const [isPartialPreFill, setIsPartialPreFill] = useState(false);
  const [manualOrder, setManualOrder] = useState({
    customerEmail: '',
    customerFirstName: '',
    customerLastName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: 'UK',
    customerPhone: '',
    paymentMethod: 'square',
    subtotal: '',
    discountAmount: '',
    totalAmount: '',
    couponCode: '',
    notes: '',
    paidAt: '',
    items: [{ productId: '', productName: '', size: '', color: '', quantity: '1', unitPrice: '', sku: '' }],
  });

  // Pre-fill manual order form from ghost payment notification.
  // Data is delivered via sessionStorage + a custom 'ghostRecover' event so the
  // dialog opens correctly whether this page is freshly mounted or already active.
  useEffect(() => {
    const processGhostRecover = () => {
      const raw = sessionStorage.getItem('ghostRecoverData');
      if (!raw) return;
      sessionStorage.removeItem('ghostRecoverData');
      try {
        const meta = JSON.parse(raw);
        const nameParts = (meta.customerName || '').split(' ');
        const firstName = meta.customerFirstName || nameParts[0] || '';
        const lastName = meta.customerLastName || nameParts.slice(1).join(' ') || '';
        const hasCartItems = Array.isArray(meta.cartItemsRaw) && meta.cartItemsRaw.length > 0;
        const cartItems: Array<{ productId: string; productName: string; size: string; color: string; quantity: string; unitPrice: string; sku: string }> =
          hasCartItems
            ? meta.cartItemsRaw
            : [{ productId: '', productName: '', size: '', color: '', quantity: '1', unitPrice: '', sku: '' }];

        const hasCustomerFields = !!(meta.customerEmail) && !!(meta.customerName || meta.customerFirstName);
        setIsPartialPreFill(!hasCartItems || !hasCustomerFields);
        setGhostNotificationId(meta.notificationId || null);
        setManualOrder({
          customerEmail: meta.customerEmail || '',
          customerFirstName: firstName,
          customerLastName: lastName,
          shippingAddress: meta.shippingAddress || '',
          shippingCity: meta.shippingCity || '',
          shippingPostalCode: meta.shippingPostalCode || '',
          shippingCountry: 'UK',
          customerPhone: meta.customerPhone || '',
          paymentMethod: meta.paymentMethod || 'square',
          subtotal: meta.totalAmount || '',
          discountAmount: '',
          totalAmount: meta.totalAmount || '',
          couponCode: '',
          notes: `Ghost payment recovery — Payment ID: ${meta.paymentId || 'N/A'}. Original error: ${meta.error || 'Unknown'}.`,
          paidAt: '',
          items: cartItems,
        });
        setIsManualOrderOpen(true);
      } catch {
        // Ignore malformed data
      }
    };

    // Run on mount (in case navigation happened before mount)
    processGhostRecover();
    // Also listen for the event if the component is already mounted when triggered
    window.addEventListener('ghostRecover', processGhostRecover);
    return () => window.removeEventListener('ghostRecover', processGhostRecover);
  }, []);

  // Handle recovered-order highlight from the notification bell.
  // Supports both fresh navigation (sessionStorage) and in-page navigation (custom event).
  useEffect(() => {
    const applyHighlight = (orderNumber: string) => {
      setSearchQuery(orderNumber);
      setHighlightOrderNumber(orderNumber);
      const timer = setTimeout(() => setHighlightOrderNumber(null), 4000);
      return timer;
    };

    // On mount: check sessionStorage (set by notification bell before navigating here)
    const stored = sessionStorage.getItem('highlightOrderNumber');
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (stored) {
      sessionStorage.removeItem('highlightOrderNumber');
      timer = applyHighlight(stored);
    }

    // Also handle in-page navigation via custom event (user already on /admin/orders)
    const handleHighlightEvent = (e: Event) => {
      if (timer) clearTimeout(timer);
      const orderNumber = (e as CustomEvent<{ orderNumber: string }>).detail?.orderNumber;
      if (orderNumber) timer = applyHighlight(orderNumber);
    };
    window.addEventListener('orderHighlight', handleHighlightEvent);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('orderHighlight', handleHighlightEvent);
    };
  }, []);

  const createManualOrderMutation = useMutation({
    mutationFn: async (data: typeof manualOrder) => {
      const res = await apiRequest("POST", "/api/admin/orders/create-manual", {
        ...data,
        items: data.items.filter(i => i.productName && i.unitPrice),
        notificationId: ghostNotificationId ?? undefined,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
      toast({ title: "Order created", description: `Order ${data.orderNumber} created successfully.` });
      setIsManualOrderOpen(false);
      setGhostNotificationId(null);
      setIsPartialPreFill(false);
      setManualOrder({
        customerEmail: '', customerFirstName: '', customerLastName: '',
        shippingAddress: '', shippingCity: '', shippingPostalCode: '', shippingCountry: 'UK',
        customerPhone: '', paymentMethod: 'square', subtotal: '', discountAmount: '',
        totalAmount: '', couponCode: '', notes: '', paidAt: '',
        items: [{ productId: '', productName: '', size: '', color: '', quantity: '1', unitPrice: '', sku: '' }],
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Build query params for filtering
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate.toISOString());
  if (endDate) queryParams.set("endDate", endDate.toISOString());
  if (channelFilter !== "all") queryParams.set("channel", channelFilter);
  if (resellerFilter !== "all") queryParams.set("resellerId", resellerFilter);
  const queryString = queryParams.toString();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders${queryString ? `?${queryString}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const { data: orderSummary } = useQuery<OrderSummary>({
    queryKey: ["/api/admin/orders/summary", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate.toISOString());
      if (endDate) params.set("endDate", endDate.toISOString());
      const res = await fetch(`/api/admin/orders/summary${params.toString() ? `?${params.toString()}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: resellers = [] } = useQuery<Reseller[]>({
    queryKey: ["/api/admin/resellers"],
  });

  // Fetch status history when an order is selected
  const { data: statusHistory = [] } = useQuery<StatusHistory[]>({
    queryKey: ["/api/admin/orders", selectedOrder?.id, "history"],
    queryFn: async () => {
      if (!selectedOrder?.id) return [];
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/history`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch order history");
      return res.json();
    },
    enabled: !!selectedOrder?.id,
  });

  // Fetch email log when an order is selected
  const { data: emailLog = [] } = useQuery<EmailLogEntry[]>({
    queryKey: ["/api/admin/orders", selectedOrder?.id, "email-log"],
    queryFn: async () => {
      if (!selectedOrder?.id) return [];
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/email-log`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch email log");
      return res.json();
    },
    enabled: !!selectedOrder?.id,
  });

  // Fetch Gmail thread (includes customer replies) — polls every 30s
  const { data: emailThread, isLoading: threadLoading } = useQuery<{ messages: EmailThreadMessage[] }>({
    queryKey: ["/api/admin/orders", selectedOrder?.id, "email-thread"],
    queryFn: async () => {
      if (!selectedOrder?.id) return { messages: [] };
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/email-thread`, {
        credentials: "include",
      });
      if (!res.ok) return { messages: [] };
      return res.json();
    },
    enabled: !!selectedOrder?.id,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  // Fetch SMS thread (pulled live from Twilio — outbound sends aren't logged
  // locally, so there's no local table to query instead)
  const { data: smsThread, isLoading: smsThreadLoading } = useQuery<{ messages: SmsThreadMessage[]; configured: boolean }>({
    queryKey: ["/api/admin/orders", selectedOrder?.id, "sms-thread"],
    queryFn: async () => {
      if (!selectedOrder?.id) return { messages: [], configured: true };
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/sms-thread`, {
        credentials: "include",
      });
      if (!res.ok) return { messages: [], configured: true };
      return res.json();
    },
    enabled: !!selectedOrder?.id,
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: { id: string; status?: string; trackingNumber?: string; notes?: string }) =>
      apiRequest("PATCH", `/api/admin/orders/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order updated",
        description: "Order has been updated successfully",
      });
      setIsEditingStatus(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: { id: string; subject: string; message: string }) =>
      apiRequest("POST", `/api/admin/orders/${data.id}/email`, data),
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Email has been sent to the customer",
      });
      setIsEmailDialogOpen(false);
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: (data: { id: string; message: string }) =>
      apiRequest("POST", `/api/admin/orders/${data.id}/sms`, { message: data.message }),
    onSuccess: () => {
      setSmsComposeText("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", selectedOrder?.id, "sms-thread"] });
      toast({ title: "SMS sent", description: "Message has been sent to the customer" });
    },
    onError: (err: any) => {
      // Same pattern as the influencer discount-code fix — show the server's
      // actual reason instead of a generic message.
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

  const resendConfirmationMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest("POST", `/api/admin/orders/${orderId}/resend-confirmation`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", selectedOrder?.id, "email-log"] });
      toast({
        title: "Confirmation email resent",
        description: "The order confirmation has been resent to the customer",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resend confirmation email",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    if (!selectedOrder || !emailSubject.trim() || !emailMessage.trim()) return;
    sendEmailMutation.mutate({
      id: selectedOrder.id,
      subject: emailSubject,
      message: emailMessage,
    });
  };

  const openEmailDialog = (replySubject?: string, quoteBody?: string) => {
    if (selectedOrder) {
      const subject = replySubject ?? `Re: Your 1stRep Order ${selectedOrder.orderNumber}`;
      const quote = quoteBody
        ? `\n\n---\nCustomer wrote:\n${quoteBody.trim().split('\n').map(l => `> ${l}`).join('\n')}\n`
        : '';
      setEmailSubject(subject);
      setEmailMessage(`Dear ${selectedOrder.customerFirstName},\n\n${quote}`);
      setIsEmailDialogOpen(true);
    }
  };

  const printParcelLabel = () => {
    if (!selectedOrder) return;
    
    const labelContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parcel Label - ${selectedOrder.orderNumber}</title>
        <style>
          @page { size: 100mm 150mm; margin: 5mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
          .label { border: 2px solid #000; padding: 15px; max-width: 90mm; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }
          .order-number { font-size: 14px; font-weight: bold; margin-bottom: 15px; }
          .section { margin-bottom: 12px; }
          .section-title { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 3px; }
          .address { font-size: 16px; font-weight: bold; line-height: 1.4; }
          .phone { font-size: 14px; margin-top: 8px; }
          .postcode { font-size: 24px; font-weight: bold; margin-top: 10px; letter-spacing: 2px; }
          .items-summary { font-size: 11px; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="logo">1<sup>st</sup>REP</div>
          <div class="order-number">${selectedOrder.orderNumber}</div>
          
          <div class="section">
            <div class="section-title">Ship To:</div>
            <div class="address">
              ${selectedOrder.customerFirstName} ${selectedOrder.customerLastName}<br>
              ${selectedOrder.shippingAddress}<br>
              ${selectedOrder.shippingCity}
            </div>
            <div class="postcode">${selectedOrder.shippingPostalCode}</div>
            ${selectedOrder.shippingCountry ? `<div style="font-size: 12px; margin-top: 5px;">${selectedOrder.shippingCountry}</div>` : ''}
          </div>
          
          ${(selectedOrder.customerPhone || selectedOrder.phoneNumber) ? `<div class="phone">Tel: ${selectedOrder.customerPhone || selectedOrder.phoneNumber}</div>` : ''}
          
          <div class="items-summary">
            <strong>Items:</strong> ${selectedOrder.items?.length || 0} | 
            <strong>Total:</strong> £${parseFloat(selectedOrder.totalAmount).toFixed(2)}
          </div>
          
          ${selectedOrder.items && selectedOrder.items.length > 0 ? `
            <div class="products-list" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 11px;">
              <strong>Products:</strong>
              <ul style="margin: 5px 0 0 0; padding-left: 15px;">
                ${selectedOrder.items.map((item: any) => `
                  <li style="margin-bottom: 3px;">
                    ${item.productName}${item.size ? ` - ${item.size}` : ''}${item.colour ? ` (${item.colour})` : ''} x${item.quantity}
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(labelContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; className?: string }> = {
      pending: { variant: "secondary", icon: Clock, className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
      confirmed: { variant: "secondary", icon: CheckCircle, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
      processing: { variant: "secondary", icon: RefreshCw, className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
      paid: { variant: "default", icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
      shipped: { variant: "default", icon: Truck, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
      delivered: { variant: "default", icon: CheckCircle, className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
      refunded: { variant: "secondary", icon: RotateCcw, className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
      cancelled: { variant: "destructive", icon: XCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
    };
    
    const { variant, icon: Icon, className } = variants[status] || { variant: "secondary", icon: Clock, className: "" };
    return (
      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${className}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSourceBadge = (order: Order) => {
    const channel = order.channel || 'website';
    const configs: Record<string, { label: string; icon: any; className: string }> = {
      website: { label: '1stRep Website', icon: Globe, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
      customer_epos: { label: '1stRep EPOS', icon: Monitor, className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
      reseller_storefront: { label: 'Reseller Store', icon: Store, className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
      reseller_epos: { label: 'Reseller EPOS', icon: Store, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      reseller_epos_own: { label: "Reseller's Own Products", icon: Store, className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
      vendor_storefront: { label: 'Wholesaler Store', icon: Store, className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
      vendor_epos: { label: 'Wholesaler EPOS', icon: Monitor, className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
      admin: { label: 'Admin', icon: Users, className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
    };
    
    const config = configs[channel] || configs.website;
    const Icon = config.icon;
    
    const partnerName = order.resellerName || order.vendorName;
    
    return (
      <div className="space-y-1">
        <Badge variant="outline" className={`flex items-center gap-1 w-fit ${config.className}`} data-testid={`badge-source-${order.id}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        {partnerName && (
          <p className="text-xs text-muted-foreground font-medium" data-testid={`text-partner-name-${order.id}`}>{partnerName}</p>
        )}
      </div>
    );
  };

  // Helper to check if an order has pre-order items
  const hasPreOrderItems = (order: Order) => {
    return order.items?.some(item => item.isPreOrder) || false;
  };

  // Helper: does the order contain any reseller own-product items?
  // Checks both item-level vendorProductId AND order channel, because some
  // EPOS paths (e.g. auto-recovery) set channel='reseller_epos_own' without
  // populating vendorProductId on individual items.
  const isOwnProductOrder = (order: Order) => {
    if (order.channel === 'reseller_epos_own') return true;
    return order.items?.some(item => item.vendorProductId) || false;
  };

  // Helper: does the order contain BOTH own-product items AND 1stRep catalogue items?
  // A channel of 'reseller_epos_own' is purely own-product — never mixed.
  const isMixedOrder = (order: Order) => {
    if (order.channel === 'reseller_epos_own') return false;
    const hasOwn = order.items?.some(item => item.vendorProductId) || false;
    const hasCatalogue = order.items?.some(item => !item.vendorProductId) || false;
    return hasOwn && hasCatalogue;
  };

  // Panel split: own-product orders vs 1stRep catalogue orders
  // Mixed orders (both types) appear in BOTH panels
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${order.customerFirstName} ${order.customerLastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || 
      (paymentFilter === "paid" && order.isPaid) || 
      (paymentFilter === "unpaid" && !order.isPaid);
    const matchesPreOrder = preOrderFilter === "all" || 
      (preOrderFilter === "preorder" && hasPreOrderItems(order)) || 
      (preOrderFilter === "regular" && !hasPreOrderItems(order));

    const matchesPanel = activePanel === 'all'
      ? true
      : activePanel === 'own_products'
        ? isOwnProductOrder(order)   // includes pure own-product AND mixed orders
        : !isOwnProductOrder(order) || isMixedOrder(order); // includes catalogue-only AND mixed orders
    
    return matchesSearch && matchesStatus && matchesPayment && matchesPreOrder && matchesPanel;
  });

  const allOrdersCount = orders.length;
  const ownProductCount = orders.filter(isOwnProductOrder).length;   // own-product + mixed
  const catalogueCount = orders.filter(o => !isOwnProductOrder(o) || isMixedOrder(o)).length; // catalogue-only + mixed

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setOrderNotes(order.notes || "");
    setIsDetailsOpen(true);
    setIsEditingStatus(false);
  };

  const handleUpdateOrder = () => {
    if (!selectedOrder) return;
    
    updateOrderMutation.mutate({
      id: selectedOrder.id,
      status: newStatus !== selectedOrder.status ? newStatus : undefined,
      trackingNumber: trackingNumber !== selectedOrder.trackingNumber ? trackingNumber : undefined,
      notes: orderNotes !== selectedOrder.notes ? orderNotes : undefined,
    });
  };

  const handleCopyTracking = () => {
    if (selectedOrder?.trackingNumber) {
      navigator.clipboard.writeText(selectedOrder.trackingNumber);
      toast({
        title: "Copied",
        description: "Tracking number copied to clipboard",
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ["Order Number", "Date", "Customer", "Email", "Status", "Source", "Total", "Payment Status", "Tracking"];
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      format(new Date(order.orderDate), "yyyy-MM-dd HH:mm"),
      `${order.customerFirstName} ${order.customerLastName}`,
      order.customerEmail,
      order.status,
      order.channel || "website",
      `£${parseFloat(order.totalAmount).toFixed(2)}`,
      order.isPaid ? "Paid" : "Unpaid",
      order.trackingNumber || ""
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    
    toast({
      title: "Export Complete",
      description: `Exported ${filteredOrders.length} orders to CSV`,
    });
  };

  const getOrderTimeline = (order: Order) => {
    const timeline = [
      { status: "Order Placed", date: order.orderDate, completed: true },
    ];
    
    if (order.isPaid || order.paidAt) {
      timeline.push({ status: "Payment Received", date: order.paidAt || order.orderDate, completed: true });
    }
    
    if (order.status === "confirmed" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
      timeline.push({ status: "Confirmed", date: order.paidAt || order.orderDate, completed: true });
    }
    
    if (order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
      timeline.push({ status: "Processing", date: order.paidAt || order.orderDate, completed: true });
    }
    
    if (order.shippedAt || order.status === "shipped" || order.status === "delivered") {
      timeline.push({ status: "Shipped", date: order.shippedAt || order.orderDate, completed: true });
    }
    
    if (order.deliveredAt || order.status === "delivered") {
      timeline.push({ status: "Delivered", date: order.deliveredAt || order.orderDate, completed: true });
    }
    
    if (order.status === "refunded") {
      timeline.push({ status: "Refunded", date: order.orderDate, completed: true });
    }
    
    if (order.status === "cancelled") {
      timeline.push({ status: "Cancelled", date: order.orderDate, completed: true });
    }
    
    return timeline;
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    paid: orders.filter(o => o.isPaid === true).length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Dramatic Modern Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Order Management
        </h2>
        <p className="text-base text-muted-foreground font-medium">
          View and manage all customer orders
        </p>
      </div>

      {/* Stats Cards - DRAMATIC MODERN DESIGN - CLICKABLE */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card 
          className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => setStatusFilter("all")}
          data-testid="card-total-orders"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-sky-500/10 dark:from-blue-400/15 dark:via-cyan-400/15 dark:to-sky-400/15 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-background/95 via-card/95 to-background/95 dark:from-background/90 dark:via-card/90 dark:to-background/90 rounded-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Total Orders</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-400 dark:to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/40 dark:shadow-blue-400/20">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 dark:from-blue-400 dark:via-cyan-400 dark:to-sky-400 bg-clip-text text-transparent">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card 
          className="relative group border-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => setStatusFilter("pending")}
          data-testid="card-pending-orders"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-400/15 dark:via-orange-400/15 dark:to-yellow-400/15 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-background/95 via-card/95 to-background/95 dark:from-background/90 dark:via-card/90 dark:to-background/90 rounded-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/40 dark:shadow-amber-400/20">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400 bg-clip-text text-transparent">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card 
          className="relative group border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-emerald-500/20 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => setStatusFilter("paid")}
          data-testid="card-paid-orders"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 dark:from-emerald-400/15 dark:via-green-400/15 dark:to-teal-400/15 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-background/95 via-card/95 to-background/95 dark:from-background/90 dark:via-card/90 dark:to-background/90 rounded-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Paid</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-400 dark:to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 dark:shadow-emerald-400/20">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card 
          className="relative group border-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-violet-500/20 backdrop-blur-xl shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => setStatusFilter("shipped")}
          data-testid="card-shipped-orders"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 dark:from-violet-400/15 dark:via-purple-400/15 dark:to-fuchsia-400/15 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-background/95 via-card/95 to-background/95 dark:from-background/90 dark:via-card/90 dark:to-background/90 rounded-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Shipped</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-400 dark:to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/40 dark:shadow-violet-400/20">
              <Truck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card 
          className="relative group border-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-blue-500/20 backdrop-blur-xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
          onClick={() => setStatusFilter("delivered")}
          data-testid="card-delivered-orders"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-400/15 dark:via-indigo-400/15 dark:to-purple-400/15 rounded-xl blur-xl" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-background/95 via-card/95 to-background/95 dark:from-background/90 dark:via-card/90 dark:to-background/90 rounded-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Delivered</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/40 dark:shadow-blue-400/20">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Order Source Analytics - CLICKABLE */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="border-blue-500/20 bg-blue-500/5 cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/10 transition-all duration-200"
          onClick={() => setChannelFilter("website")}
          data-testid="card-website-orders"
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Website</p>
                <p className="text-2xl font-bold">{orderSummary?.byChannel?.website || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="border-purple-500/20 bg-purple-500/5 cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-200"
          onClick={() => setChannelFilter("customer_epos")}
          data-testid="card-customer-epos-orders"
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Customer EPOS</p>
                <p className="text-2xl font-bold">{orderSummary?.byChannel?.customer_epos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="border-orange-500/20 bg-orange-500/5 cursor-pointer hover:border-orange-500/40 hover:bg-orange-500/10 transition-all duration-200"
          onClick={() => setChannelFilter("reseller_epos")}
          data-testid="card-reseller-epos-orders"
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Reseller EPOS</p>
                <p className="text-2xl font-bold">{orderSummary?.byChannel?.reseller_epos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold">£{(orderSummary?.totalRevenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reseller Breakdown */}
      {orderSummary?.resellerBreakdown && orderSummary.resellerBreakdown.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Orders by Reseller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {orderSummary.resellerBreakdown.slice(0, 6).map((reseller) => (
                <div
                  key={reseller.resellerId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  data-testid={`reseller-breakdown-${reseller.resellerId}`}
                >
                  <div>
                    <p className="font-medium">{reseller.resellerName}</p>
                    <p className="text-sm text-muted-foreground">{reseller.count} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">£{reseller.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search - MODERNIZED */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-background/50">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-2xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Orders</CardTitle>
                <CardDescription className="text-base font-medium">
                  {activePanel === 'all'
                    ? 'Showing all orders across all channels'
                    : activePanel === '1strep'
                    ? 'Showing 1stRep catalogue orders — managed and fulfilled by 1stRep'
                    : 'Showing reseller own-product sales — paid and delivered on the spot by the reseller'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => { setGhostNotificationId(null); setIsManualOrderOpen(true); }}
                  variant="outline"
                  className="gap-2 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  data-testid="button-create-manual-order"
                >
                  <PlusCircle className="h-4 w-4" />
                  Manual Order
                </Button>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="gap-2"
                  disabled={filteredOrders.length === 0}
                  data-testid="button-export-csv"
                >
                  <Download className="h-4 w-4" />
                  Export CSV ({filteredOrders.length})
                </Button>
              </div>
            </div>

            {/* Panel Toggle */}
            <div className="flex items-center gap-2 border rounded-lg p-1 w-fit bg-muted/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActivePanel('all'); setStatusFilter('all'); setChannelFilter('all'); }}
                className={activePanel === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}
                data-testid="button-panel-all"
              >
                <LayoutList className="h-4 w-4 mr-2" />
                All Orders
                <Badge variant="secondary" className="ml-2">{allOrdersCount}</Badge>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActivePanel('1strep'); setStatusFilter('all'); setChannelFilter('all'); }}
                className={activePanel === '1strep' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}
                data-testid="button-panel-1strep"
              >
                <Package className="h-4 w-4 mr-2" />
                1stRep Orders
                <Badge variant="secondary" className="ml-2">{catalogueCount}</Badge>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActivePanel('own_products'); setStatusFilter('all'); setChannelFilter('all'); }}
                className={activePanel === 'own_products' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}
                data-testid="button-panel-own-products"
              >
                <Store className="h-4 w-4 mr-2" />
                Own Product Sales
                <Badge variant="secondary" className="ml-2">{ownProductCount}</Badge>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onDateChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row flex-wrap gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 dark:text-blue-400" />
              <Input
                placeholder="Search by order number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base font-medium border-border/50 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-44 h-12 text-base font-medium border-border/50" data-testid="select-status-filter">
                <Filter className="h-5 w-5 mr-2 text-violet-500 dark:text-violet-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full lg:w-40 h-12 text-base font-medium border-border/50" data-testid="select-payment-filter">
                <CircleDot className="h-5 w-5 mr-2 text-emerald-500 dark:text-emerald-400" />
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={preOrderFilter} onValueChange={setPreOrderFilter}>
              <SelectTrigger className="w-full lg:w-40 h-12 text-base font-medium border-border/50" data-testid="select-preorder-filter">
                <Clock className="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400" />
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="preorder">Pre-Orders</SelectItem>
                <SelectItem value="regular">Regular Orders</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full lg:w-44 h-12 text-base font-medium border-border/50" data-testid="select-channel-filter">
                <Globe className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">1stRep Website</SelectItem>
                <SelectItem value="customer_epos">1stRep EPOS</SelectItem>
                <SelectItem value="reseller_storefront">Reseller Storefront</SelectItem>
                <SelectItem value="reseller_epos">Reseller EPOS</SelectItem>
                <SelectItem value="vendor_storefront">Wholesaler Storefront</SelectItem>
                <SelectItem value="vendor_epos">Wholesaler EPOS</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {channelFilter === "reseller_epos" && resellers.length > 0 && (
              <Select value={resellerFilter} onValueChange={setResellerFilter}>
                <SelectTrigger className="w-full lg:w-48 h-12 text-base font-medium border-border/50" data-testid="select-reseller-filter">
                  <Store className="h-5 w-5 mr-2 text-orange-500 dark:text-orange-400" />
                  <SelectValue placeholder="Reseller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resellers</SelectItem>
                  {resellers.map((reseller) => (
                    <SelectItem key={reseller.id} value={reseller.id}>
                      {reseller.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Orders Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      data-testid={`row-order-${order.orderNumber}`}
                      className={highlightOrderNumber && order.orderNumber === highlightOrderNumber ? "bg-primary/10 transition-colors duration-1000" : ""}
                    >
                      <TableCell className="font-medium" data-testid={`text-order-number-${order.orderNumber}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.orderNumber}
                          {hasPreOrderItems(order) && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" data-testid={`badge-preorder-${order.orderNumber}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              Pre-Order
                            </Badge>
                          )}
                          {isMixedOrder(order) && (
                            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" data-testid={`badge-mixed-${order.orderNumber}`}>
                              Mixed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerFirstName} {order.customerLastName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-order-source-${order.orderNumber}`}>
                        <div className="flex flex-col gap-1">
                          {getSourceBadge(order)}
                          {order.resellerName && (
                            <span className="text-xs text-muted-foreground font-medium">{order.resellerName}</span>
                          )}
                          {(order.resellerId || order.vendorId) && order.paymentMethod !== 'cash' && (
                            <span
                              className={`text-xs font-medium ${order.ownSquarePaid ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                              data-testid={`text-square-destination-${order.orderNumber}`}
                            >
                              {order.ownSquarePaid ? '→ Their own Square' : '→ 1stRep Square'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.orderDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        £{parseFloat(order.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.isPaid ? "default" : "secondary"}>
                          {order.isPaid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          data-testid={`button-view-order-${order.orderNumber}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <DialogTitle className="text-xl">Order #{selectedOrder?.orderNumber}</DialogTitle>
                <DialogDescription>
                  {selectedOrder && format(new Date(selectedOrder.orderDate), "MMM dd, yyyy 'at' h:mm a")}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedOrder && hasPreOrderItems(selectedOrder) && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Pre-Order
                  </Badge>
                )}
                {selectedOrder && getStatusBadge(selectedOrder.status)}
                <Badge variant={selectedOrder?.isPaid ? "default" : "secondary"}>
                  {selectedOrder?.isPaid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => window.print()}
                  data-testid="button-print-order"
                >
                  <Printer className="h-4 w-4" />
                  Print Order
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={printParcelLabel}
                  data-testid="button-print-parcel-label"
                >
                  <Package className="h-4 w-4" />
                  Print Label
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={openEmailDialog}
                  data-testid="button-email-customer"
                >
                  <Mail className="h-4 w-4" />
                  Email Customer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => resendConfirmationMutation.mutate(selectedOrder.id)}
                  disabled={resendConfirmationMutation.isPending}
                  data-testid="button-resend-confirmation"
                >
                  <RotateCcw className="h-4 w-4" />
                  {resendConfirmationMutation.isPending ? "Sending..." : "Resend Confirmation"}
                </Button>
                {selectedOrder.trackingNumber && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={handleCopyTracking}
                    data-testid="button-copy-tracking"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Tracking
                  </Button>
                )}
              </div>

              {/* Order Timeline */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Order Timeline
                </h3>
                <div className="relative pl-4 border-l-2 border-muted space-y-3">
                  {getOrderTimeline(selectedOrder).map((step, index) => (
                    <div key={index} className="relative">
                      <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 ${
                        step.completed 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'bg-background border-muted-foreground'
                      }`} />
                      <div className="pl-4">
                        <p className="font-medium text-sm">{step.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(step.date), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Conversation Thread */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Conversation
                    {(() => {
                      const inboundCount = (emailThread?.messages ?? []).filter(m => m.direction === 'inbound').length;
                      const total = emailLog.length + inboundCount;
                      return total > 0 ? (
                        <span className="rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
                          {total}
                        </span>
                      ) : null;
                    })()}
                    {threadLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => openEmailDialog()}
                  >
                    <Reply className="h-3 w-3" />
                    Reply
                  </Button>
                </div>

                {(() => {
                  // Merge outbound (from emailLog) + inbound (from Gmail thread)
                  const inboundMessages = (emailThread?.messages ?? []).filter(m => m.direction === 'inbound');

                  type ConvoItem =
                    | { kind: 'sent'; entry: EmailLogEntry }
                    | { kind: 'received'; msg: EmailThreadMessage };

                  const items: ConvoItem[] = [
                    ...emailLog.map(e => ({ kind: 'sent' as const, entry: e, _ts: new Date(e.createdAt).getTime() })),
                    ...inboundMessages.map(m => ({ kind: 'received' as const, msg: m, _ts: new Date(m.date).getTime() || 0 })),
                  ].sort((a, b) => a._ts - b._ts);

                  if (items.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm italic">No emails yet for this order.</p>
                        <p className="text-xs mt-1">Use the Reply button above to start the conversation.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        if (item.kind === 'sent') {
                          const e = item.entry;
                          const expanded = expandedMessages.has(e.id);
                          return (
                            <div key={`sent-${e.id}`} className="flex flex-col items-end">
                              <div className="max-w-[90%] w-full">
                                <div className={`rounded-lg border px-3 py-2.5 text-sm ${e.success ? 'bg-muted/40 border-muted' : 'bg-destructive/5 border-destructive/20'}`}>
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Send className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                      <span className="font-medium text-xs truncate">{e.subject ?? "Order Confirmation"}</span>
                                      {!e.success && <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                                      {format(new Date(e.createdAt), "dd MMM ''yy, h:mm a")}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    You → {e.recipientEmail} · by {e.sentByName ?? "Admin"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          const m = item.msg;
                          const expanded = expandedMessages.has(m.id);
                          const senderName = m.from.replace(/<[^>]+>/, '').trim() || m.from;
                          const displayDate = (() => {
                            try { return format(new Date(m.date), "dd MMM ''yy, h:mm a"); } catch { return m.date; }
                          })();
                          return (
                            <div key={`recv-${m.id}`} className="flex flex-col items-start">
                              <div className="max-w-[90%] w-full">
                                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Inbox className="h-3.5 w-3.5 shrink-0 text-primary" />
                                      <span className="font-medium text-xs truncate text-primary">{m.subject || "Reply"}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{displayDate}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">From {senderName}</p>
                                  <p className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${expanded ? '' : 'line-clamp-3'}`}>
                                    {m.body || m.snippet}
                                  </p>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-primary/10">
                                    <button
                                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                      onClick={() => setExpandedMessages(prev => {
                                        const next = new Set(prev);
                                        expanded ? next.delete(m.id) : next.add(m.id);
                                        return next;
                                      })}
                                    >
                                      {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                      {expanded ? 'Show less' : 'Show more'}
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs gap-1 px-2"
                                      onClick={() => openEmailDialog(
                                        m.subject.startsWith('Re:') ? m.subject : `Re: ${m.subject}`,
                                        m.body || m.snippet
                                      )}
                                    >
                                      <Reply className="h-3 w-3" />
                                      Reply
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* EPOS Source Info — shown for all reseller/vendor EPOS orders */}
              {selectedOrder.channel && (selectedOrder.channel.includes('reseller') || selectedOrder.channel.includes('vendor')) && (
                <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Store className="h-4 w-4" />
                    Order Source
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Placed by</p>
                      <p className="font-semibold">
                        {selectedOrder.resellerName || selectedOrder.vendorName || (
                          <span className="text-muted-foreground italic">Not linked to a reseller account</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Channel</p>
                      <p className="font-medium">{getSourceBadge(selectedOrder)}</p>
                    </div>
                    {selectedOrder.channel.includes('epos') && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">POS / Collection point</p>
                        <p className="font-medium">
                          {selectedOrder.resellerName || selectedOrder.vendorName
                            ? `${selectedOrder.resellerName || selectedOrder.vendorName} — in-store EPOS`
                            : 'In-store EPOS (account not linked — early test order)'}
                        </p>
                      </div>
                    )}
                    {(selectedOrder.resellerId || selectedOrder.vendorId) && selectedOrder.paymentMethod !== 'cash' && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Payment received into</p>
                        <p className={`font-semibold ${selectedOrder.ownSquarePaid ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                          {selectedOrder.ownSquarePaid
                            ? `${selectedOrder.resellerName || selectedOrder.vendorName || 'Their'}'s own connected Square account`
                            : "1stRep's platform Square account"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedOrder.customerFirstName} {selectedOrder.customerLastName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedOrder.customerEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Phone (Primary Contact)</p>
                    <p className="font-medium text-lg">
                      {(selectedOrder.customerPhone || selectedOrder.phoneNumber) ? (
                        <a 
                          href={`tel:${selectedOrder.customerPhone || selectedOrder.phoneNumber}`} 
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          data-testid="link-customer-phone"
                        >
                          {selectedOrder.customerPhone || selectedOrder.phoneNumber}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No phone provided</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* SMS Thread — pulled live from Twilio, both directions */}
              {(selectedOrder.customerPhone || selectedOrder.phoneNumber) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">SMS Messages</h3>
                    {smsThreadLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  {selectedOrder.smsLastError && (
                    <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <span className="font-medium">Last automatic SMS failed to send:</span> {selectedOrder.smsLastError}
                      {selectedOrder.smsLastErrorAt && (
                        <span className="text-destructive/70"> &middot; {new Date(selectedOrder.smsLastErrorAt).toLocaleString("en-GB")}</span>
                      )}
                    </div>
                  )}
                  {(smsThread?.messages?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      {smsThread?.configured === false
                        ? "SMS isn't configured on this server."
                        : "No SMS messages sent or received for this order yet."}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto rounded-lg border p-3 bg-muted/30">
                      {smsThread!.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              m.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border'
                            }`}
                            data-testid={`sms-message-${i}`}
                          >
                            <p className="whitespace-pre-wrap">{linkifyMessageBody(m.body)}</p>
                            <p className={`text-[10px] mt-1 ${m.direction === 'outbound' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(m.date).toLocaleString("en-GB")} &middot; {m.direction === 'outbound' ? '1stRep' : 'Customer'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {smsThread?.configured !== false && (
                    <div className="flex gap-2 mt-2">
                      <Textarea
                        value={smsComposeText}
                        onChange={(e) => setSmsComposeText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (selectedOrder && smsComposeText.trim() && !sendSmsMutation.isPending) {
                              sendSmsMutation.mutate({ id: selectedOrder.id, message: smsComposeText.trim() });
                            }
                          }
                        }}
                        placeholder="Type a message to text the customer... (Enter to send, Shift+Enter for a new line)"
                        rows={2}
                        className="text-sm resize-none"
                        data-testid="textarea-sms-compose"
                      />
                      <Button
                        size="sm"
                        className="self-end"
                        disabled={!smsComposeText.trim() || sendSmsMutation.isPending}
                        onClick={() => selectedOrder && sendSmsMutation.mutate({ id: selectedOrder.id, message: smsComposeText.trim() })}
                        data-testid="button-send-sms"
                      >
                        {sendSmsMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Send"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Address */}
              {(() => {
                // Detect in-store / EPOS orders by sentinel shipping values or channel
                const inStoreSentinels = [
                  'Collect from Store', 'In-Store Pickup', 'In-Store EPOS Pickup',
                  'Not provided', 'N/A'
                ];
                const isCollectionOrder =
                  inStoreSentinels.includes(selectedOrder.shippingAddress) ||
                  selectedOrder.shippingCity === 'Store Collection' ||
                  selectedOrder.shippingCity === 'Store' ||
                  selectedOrder.channel === 'customer_epos' ||
                  !!selectedOrder.eposTerminalId;

                // A "real" address exists when none of the sentinel values are present
                const hasRealAddress =
                  selectedOrder.shippingAddress &&
                  !inStoreSentinels.includes(selectedOrder.shippingAddress) &&
                  selectedOrder.shippingCity &&
                  selectedOrder.shippingCity !== 'Store Collection' &&
                  selectedOrder.shippingCity !== 'Store';

                return (
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    {isCollectionOrder && !hasRealAddress ? (
                      <div className="text-sm space-y-0.5">
                        <p className="font-medium text-muted-foreground italic">
                          In-store purchase — no delivery address
                        </p>
                        {(selectedOrder.resellerName || selectedOrder.vendorName) && (
                          <p className="text-xs text-muted-foreground">
                            Store: {selectedOrder.resellerName || selectedOrder.vendorName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm space-y-0.5">
                        <p>{selectedOrder.shippingAddress}</p>
                        <p>
                          {selectedOrder.shippingCity}
                          {selectedOrder.shippingPostalCode && selectedOrder.shippingPostalCode !== 'N/A'
                            ? `, ${selectedOrder.shippingPostalCode}`
                            : ''}
                        </p>
                        {selectedOrder.shippingCountry &&
                          selectedOrder.shippingCountry !== 'N/A' &&
                          selectedOrder.shippingCountry !== 'Store Collection' && (
                            <p>{selectedOrder.shippingCountry}</p>
                          )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                  <div className="border rounded-md p-6 text-center text-muted-foreground bg-muted/30">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No item details available</p>
                    <p className="text-xs mt-1">Individual item data was not saved for this order. The order total of <span className="font-semibold text-foreground">£{parseFloat(selectedOrder.totalAmount).toFixed(2)}</span> was collected successfully.</p>
                  </div>
                ) : (() => {
                  const catalogueItems = selectedOrder.items.filter(i => !i.vendorProductId);
                  const ownItems = selectedOrder.items.filter(i => i.vendorProductId);
                  const mixed = catalogueItems.length > 0 && ownItems.length > 0;

                  const renderItemsTable = (itemList: typeof selectedOrder.items) => (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU / Barcode</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Size/Colour</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemList.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    className="w-10 h-10 object-cover rounded border"
                                  />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    {item.productName}
                                    {item.isPreOrder && (
                                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                                        Pre-Order
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {item.sku && (
                                  <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block" data-testid="text-item-sku">
                                    {item.sku}
                                  </div>
                                )}
                                {item.barcodeDescriptor && (
                                  <div className="text-xs text-muted-foreground" data-testid="text-item-barcode">
                                    {item.barcodeDescriptor}
                                  </div>
                                )}
                                {!item.sku && !item.barcodeDescriptor && (
                                  <span className="text-xs text-muted-foreground italic">N/A</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.locationNote ? (
                                <div className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded" data-testid="text-item-location">
                                  {item.locationNote}
                                </div>
                              ) : selectedOrder.channel?.includes('epos') ? (
                                <div className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                                  In-store
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">-</span>
                              )}
                            </TableCell>
                            <TableCell>{item.size} / {item.color}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">£{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                            <TableCell className="text-right">£{parseFloat(item.totalPrice).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  );

                  if (!mixed) {
                    return (
                      <div className="border rounded-md overflow-x-auto">
                        {renderItemsTable(selectedOrder.items)}
                      </div>
                    );
                  }

                  const catalogueSubtotal = catalogueItems.reduce((s, i) => s + parseFloat(i.totalPrice), 0);
                  const ownSubtotal = ownItems.reduce((s, i) => s + parseFloat(i.totalPrice), 0);

                  return (
                    <div className="space-y-4">
                      {/* 1stRep Catalogue Items */}
                      <div className="border rounded-md overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border-b">
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            1stRep Catalogue Products
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium">Subtotal: £{catalogueSubtotal.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground ml-2">· Commission applies</span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          {renderItemsTable(catalogueItems)}
                        </div>
                      </div>

                      {/* Reseller's Own Products */}
                      <div className="border rounded-md overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border-b">
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            Reseller's Own Products
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium">Subtotal: £{ownSubtotal.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground ml-2">· 100% revenue to reseller</span>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          {renderItemsTable(ownItems)}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>£{parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>£{parseFloat(selectedOrder.shippingCost).toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountAmount && parseFloat(selectedOrder.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount{selectedOrder.couponCode ? ` (${selectedOrder.couponCode})` : ''}</span>
                      <span>-£{parseFloat(selectedOrder.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>£{parseFloat(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order Status & Tracking */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Status & Tracking</h3>
                  {!isEditingStatus && (!isOwnProductOrder(selectedOrder) || isMixedOrder(selectedOrder)) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingStatus(true)}
                      data-testid="button-edit-status"
                    >
                      Update
                    </Button>
                  )}
                </div>

                {/* For pure own-product orders: reseller fulfilled everything */}
                {isOwnProductOrder(selectedOrder) && !isMixedOrder(selectedOrder) ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    This sale was fulfilled in person by the reseller — payment and delivery completed on the spot.
                  </div>
                ) : isEditingStatus ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger data-testid="select-new-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tracking Number</label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        data-testid="input-tracking-number"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Add notes about this order"
                        rows={3}
                        data-testid="textarea-order-notes"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleUpdateOrder}
                        disabled={updateOrderMutation.isPending}
                        data-testid="button-save-order"
                      >
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingStatus(false)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {/* For mixed orders: show reseller-fulfilled note for own product items */}
                    {isMixedOrder(selectedOrder) && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        Reseller's own product items were fulfilled in person. 1stRep catalogue items require shipping below.
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current Status:</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div>
                        <span className="text-muted-foreground">Tracking: </span>
                        <span className="font-medium">{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes: </span>
                        <p className="mt-1">{selectedOrder.notes}</p>
                      </div>
                    )}
                    <div className="pt-2 space-y-1">
                      {selectedOrder.paidAt && (
                        <p><span className="text-muted-foreground">Paid:</span> {format(new Date(selectedOrder.paidAt), "MMM dd, yyyy HH:mm")}</p>
                      )}
                      {selectedOrder.shippedAt && (
                        <p><span className="text-muted-foreground">Shipped:</span> {format(new Date(selectedOrder.shippedAt), "MMM dd, yyyy HH:mm")}</p>
                      )}
                      {selectedOrder.deliveredAt && (
                        <p><span className="text-muted-foreground">Delivered:</span> {format(new Date(selectedOrder.deliveredAt), "MMM dd, yyyy HH:mm")}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status History Timeline */}
              {statusHistory.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Status History
                  </h3>
                  <div className="space-y-3">
                    {statusHistory.map((entry, index) => (
                      <div 
                        key={entry.id} 
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                          {index < statusHistory.length - 1 && (
                            <div className="w-0.5 h-8 bg-muted-foreground/20" />
                          )}
                        </div>
                        <div className="flex-1 -mt-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.previousStatus && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {entry.previousStatus}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                              </>
                            )}
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {entry.newStatus}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm")}
                            {entry.changedByName && (
                              <span> by {entry.changedByName}</span>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Compose Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Customer
            </DialogTitle>
            <DialogDescription>
              Send an email to {selectedOrder?.customerFirstName} {selectedOrder?.customerLastName} ({selectedOrder?.customerEmail})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
                data-testid="input-email-subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Type your message..."
                rows={8}
                className="resize-none"
                data-testid="textarea-email-message"
              />
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Note:</p>
              <p>This email will be sent from the 1stRep email address. The customer can reply directly to this email.</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              data-testid="button-cancel-email"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!emailSubject.trim() || !emailMessage.trim() || sendEmailMutation.isPending}
              data-testid="button-send-email"
            >
              {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Order Creation Dialog */}
      <Dialog open={isManualOrderOpen} onOpenChange={(open) => { if (!open) { setGhostNotificationId(null); setIsPartialPreFill(false); } setIsManualOrderOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-500" />
              Create Manual Order
            </DialogTitle>
            <DialogDescription>
              Use this to recover a ghost payment — when a customer was charged but no order was created. The order will appear in the orders list immediately and stock will be adjusted.
            </DialogDescription>
          </DialogHeader>

          {isPartialPreFill && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Some fields could not be pre-filled from this alert — please review before submitting.</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Customer Email *</Label>
                <Input value={manualOrder.customerEmail} onChange={e => setManualOrder(p => ({ ...p, customerEmail: e.target.value }))} placeholder="customer@example.com" />
              </div>
              <div>
                <Label>First Name *</Label>
                <Input value={manualOrder.customerFirstName} onChange={e => setManualOrder(p => ({ ...p, customerFirstName: e.target.value }))} placeholder="Tim" />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={manualOrder.customerLastName} onChange={e => setManualOrder(p => ({ ...p, customerLastName: e.target.value }))} placeholder="Grahamslaw" />
              </div>
              <div className="col-span-2">
                <Label>Shipping Address</Label>
                <Input value={manualOrder.shippingAddress} onChange={e => setManualOrder(p => ({ ...p, shippingAddress: e.target.value }))} placeholder="Street address" />
              </div>
              <div>
                <Label>City</Label>
                <Input value={manualOrder.shippingCity} onChange={e => setManualOrder(p => ({ ...p, shippingCity: e.target.value }))} placeholder="Hadfield" />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input value={manualOrder.shippingPostalCode} onChange={e => setManualOrder(p => ({ ...p, shippingPostalCode: e.target.value }))} placeholder="SK13 1HA" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={manualOrder.customerPhone} onChange={e => setManualOrder(p => ({ ...p, customerPhone: e.target.value }))} placeholder="07700 900000" />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={manualOrder.paymentMethod} onValueChange={v => setManualOrder(p => ({ ...p, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Square / Card</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="klarna">Klarna</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="clearpay">Clearpay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Subtotal (£) *</Label>
                <Input type="number" step="0.01" value={manualOrder.subtotal} onChange={e => setManualOrder(p => ({ ...p, subtotal: e.target.value }))} placeholder="42.00" />
              </div>
              <div>
                <Label>Discount (£)</Label>
                <Input type="number" step="0.01" value={manualOrder.discountAmount} onChange={e => setManualOrder(p => ({ ...p, discountAmount: e.target.value }))} placeholder="21.00" />
              </div>
              <div>
                <Label>Total Paid (£) *</Label>
                <Input type="number" step="0.01" value={manualOrder.totalAmount} onChange={e => setManualOrder(p => ({ ...p, totalAmount: e.target.value }))} placeholder="21.00" />
              </div>
              <div>
                <Label>Coupon Code</Label>
                <Input value={manualOrder.couponCode} onChange={e => setManualOrder(p => ({ ...p, couponCode: e.target.value }))} placeholder="TIM150" />
              </div>
              <div className="col-span-2">
                <Label>Payment Date/Time</Label>
                <Input type="datetime-local" value={manualOrder.paidAt} onChange={e => setManualOrder(p => ({ ...p, paidAt: e.target.value }))} />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Order Items *</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setManualOrder(p => ({ ...p, items: [...p.items, { productId: '', productName: '', size: '', color: '', quantity: '1', unitPrice: '', sku: '' }] }))}
                >
                  <PlusCircle className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {manualOrder.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 p-3 border rounded-lg bg-muted/30">
                    <div className="col-span-2">
                      <Label className="text-xs">Product Name *</Label>
                      <Input value={item.productName} onChange={e => setManualOrder(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, productName: e.target.value } : it) }))} placeholder="Alpine Sweater" className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Input value={item.size} onChange={e => setManualOrder(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, size: e.target.value } : it) }))} placeholder="L" className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Colour</Label>
                      <Input value={item.color} onChange={e => setManualOrder(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, color: e.target.value } : it) }))} placeholder="Off White" className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" min="1" value={item.quantity} onChange={e => setManualOrder(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it) }))} className="h-8 text-sm" />
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="flex-1">
                        <Label className="text-xs">Unit Price *</Label>
                        <Input type="number" step="0.01" value={item.unitPrice} onChange={e => setManualOrder(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, unitPrice: e.target.value } : it) }))} placeholder="42.00" className="h-8 text-sm" />
                      </div>
                      {manualOrder.items.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-destructive" onClick={() => setManualOrder(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Product ID (optional — enables stock adjustment)</Label>
                      <Input value={item.productId} onChange={e => setManualOrder(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, productId: e.target.value } : it) }))} placeholder="960f1d5f-f788-4175-..." className="h-8 text-sm font-mono" />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">SKU (optional)</Label>
                      <Input value={item.sku} onChange={e => setManualOrder(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, sku: e.target.value } : it) }))} placeholder="1REP-BY075-OFF-L" className="h-8 text-sm font-mono" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Internal Notes</Label>
              <Textarea value={manualOrder.notes} onChange={e => setManualOrder(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Ghost payment on 16 Apr 2026 — £21 charged via Klarna, order creation failed." rows={2} className="resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setIsManualOrderOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createManualOrderMutation.mutate(manualOrder)}
              disabled={createManualOrderMutation.isPending || !manualOrder.customerEmail || !manualOrder.totalAmount || !manualOrder.items.some(i => i.productName && i.unitPrice)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createManualOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
