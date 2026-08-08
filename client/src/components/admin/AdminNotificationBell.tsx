import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSocket } from "@/hooks/useSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Check, CheckCheck, Trash2, ShoppingBag, AlertTriangle, Ticket, Users, Store, Package, CreditCard, Star, Loader2, RotateCcw, Filter, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  isRecovered: boolean;
  metadata: string | null;
  createdAt: string;
};

const notificationIcons: Record<string, typeof Bell> = {
  new_order: ShoppingBag,
  low_stock: AlertTriangle,
  support_ticket: Ticket,
  new_reseller: Store,
  new_vendor: Store,
  reseller_application: Users,
  vendor_application: Users,
  order_cancelled: ShoppingBag,
  payment_failed: CreditCard,
  review_submitted: Star,
  stock_alert: Package,
  system: Bell,
  licence_request: Users,
  wholesale_order: Package,
};

const notificationColors: Record<string, string> = {
  new_order: "text-green-500",
  low_stock: "text-amber-500",
  support_ticket: "text-blue-500",
  new_reseller: "text-purple-500",
  new_vendor: "text-purple-500",
  reseller_application: "text-indigo-500",
  vendor_application: "text-indigo-500",
  order_cancelled: "text-red-500",
  payment_failed: "text-red-500",
  review_submitted: "text-yellow-500",
  stock_alert: "text-orange-500",
  system: "text-gray-500",
  licence_request: "text-cyan-500",
  wholesale_order: "text-emerald-500",
};

export function AdminNotificationBell() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const push = usePushNotifications();

  const { data: notifications = [], isLoading } = useQuery<AdminNotification[]>({
    queryKey: ["/api/admin/notifications"],
    refetchInterval: 30000,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/notifications/unread-count"],
    refetchInterval: 15000,
  });

  // Real-time: immediately refresh notifications when any order event fires via WebSocket
  useSocket({
    room: "admin",
    onOrderEvent: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/admin/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const parseGhostMetadata = (notification: AdminNotification) => {
    // Try structured metadata first (new format)
    if (notification.metadata) {
      try {
        const meta = JSON.parse(notification.metadata);
        if (meta.isGhostPayment) return meta;
      } catch {}
    }
    // Legacy fallback: detect by title and extract what we can from the message
    if (notification.title && /ghost payment/i.test(notification.title)) {
      const msg = notification.message || "";
      // Extract email: "from Name (email@domain.com)"
      const emailMatch = msg.match(/\(([^\s)]+@[^\s)]+)\)/);
      // Extract amount: "Payment of £X"
      const amountMatch = msg.match(/Payment of [£$€]?([\d.,]+)/i);
      // Extract payment ID: "Payment ID: XXXXX"
      const paymentIdMatch = msg.match(/Payment ID:\s*([^\s,.]+)/i);
      // Extract name: "from Name (email)"
      const nameMatch = msg.match(/from\s+(.+?)\s+\(/);
      return {
        isGhostPayment: true,
        customerEmail: emailMatch ? emailMatch[1] : "",
        customerName: nameMatch ? nameMatch[1] : "",
        totalAmount: amountMatch ? amountMatch[1] : "",
        paymentId: paymentIdMatch ? paymentIdMatch[1] : "",
        cartItemsRaw: [],
      };
    }
    return null;
  };

  const triggerGhostRecover = (notification: AdminNotification) => {
    const meta = parseGhostMetadata(notification);
    if (!meta) return;
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    // Include the notification ID so AdminOrders can mark it as recovered on success
    sessionStorage.setItem('ghostRecoverData', JSON.stringify({ ...meta, notificationId: notification.id }));
    setIsOpen(false);
    setLocation('/admin/orders');
    // Dispatch custom event so AdminOrders picks it up immediately if already mounted
    window.dispatchEvent(new CustomEvent('ghostRecover'));
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    const ghostMeta = parseGhostMetadata(notification);
    if (ghostMeta) {
      if (notification.isRecovered) {
        // Already recovered — just mark read if needed, do not re-open recovery
        if (!notification.isRead) {
          markReadMutation.mutate(notification.id);
        }
        return;
      }
      // triggerGhostRecover handles mark-read internally
      triggerGhostRecover(notification);
      return;
    }
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
      setLocation(notification.link);
    }
  };

  const handleRecoverOrder = (e: React.MouseEvent, notification: AdminNotification) => {
    e.stopPropagation();
    if (notification.isRecovered) return;
    triggerGhostRecover(notification);
  };

  const getIcon = (type: string) => {
    const Icon = notificationIcons[type] || Bell;
    return Icon;
  };

  const hasRecoveredGhostPayments = notifications.some(
    (n) => parseGhostMetadata(n) && n.isRecovered
  );

  const visibleNotifications = showOpenOnly
    ? notifications.filter((n) => {
        const ghost = parseGhostMetadata(n);
        return !ghost || !n.isRecovered;
      })
    : notifications;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10"
          data-testid="button-admin-notifications"
        >
          <Bell className="h-5 w-5" />
          {(unreadCount?.count || 0) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
            >
              {unreadCount?.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between gap-2 p-4 border-b flex-wrap">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            {hasRecoveredGhostPayments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOpenOnly((v) => !v)}
                className={`text-xs gap-1.5 toggle-elevate ${showOpenOnly ? "toggle-elevated" : ""}`}
                data-testid="button-filter-open-only"
              >
                <Filter className="h-3.5 w-3.5" />
                {showOpenOnly ? "All" : "Open only"}
              </Button>
            )}
            {(unreadCount?.count || 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs"
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Push notification toggle — always visible */}
        {push.needsPwaInstall ? (
          /* iOS Safari — needs Add to Home Screen first */
          <div className="px-4 py-3 border-b bg-muted/30 space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <p className="text-xs font-medium">Mobile push alerts</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To get order notifications on iPhone, install this site to your Home Screen first:
            </p>
            <ol className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0 h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                <span>Tap the <Share className="inline h-3 w-3 mx-0.5 text-blue-500" /> Share button at the bottom of Safari</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0 h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                <span>Tap <strong className="text-foreground">"Add to Home Screen"</strong> <Plus className="inline h-3 w-3 mx-0.5" /></span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="flex-shrink-0 h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                <span>Open the app from your Home Screen and come back here to enable alerts</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs font-medium">Mobile push alerts</p>
                {push.permission === "denied" && (
                  <p className="text-xs text-muted-foreground">Blocked — allow in browser settings</p>
                )}
                {push.isSubscribed && push.permission === "granted" && (
                  <p className="text-xs text-green-600 dark:text-green-500">Active on this device</p>
                )}
                {!push.supported && !push.needsPwaInstall && (
                  <p className="text-xs text-muted-foreground">Not supported on this browser</p>
                )}
              </div>
            </div>
            {push.permission !== "denied" && push.supported && (
              <Button
                variant={push.isSubscribed ? "outline" : "default"}
                size="sm"
                className="h-7 text-xs gap-1.5 flex-shrink-0"
                disabled={push.isLoading}
                onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
              >
                {push.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : push.isSubscribed ? (
                  <>
                    <BellOff className="h-3.5 w-3.5" />
                    Turn off
                  </>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5" />
                    Enable
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              {showOpenOnly ? (
                <>
                  <p className="text-sm text-muted-foreground">No open alerts</p>
                  <p className="text-xs text-muted-foreground/70">
                    All ghost payment alerts have been recovered
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/70">
                    You'll see updates about orders, stock, and more here
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {visibleNotifications.map((notification, index) => {
                const Icon = getIcon(notification.type);
                const colorClass = notificationColors[notification.type] || "text-gray-500";
                const ghostMeta = parseGhostMetadata(notification);
                
                return (
                  <div key={notification.id}>
                    <div
                      className={`
                        flex items-start gap-3 p-4 transition-colors
                        ${ghostMeta && notification.isRecovered ? "cursor-default" : "cursor-pointer"}
                        ${notification.isRead ? "bg-background" : "bg-primary/5"}
                        hover:bg-accent/50
                      `}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className={`mt-0.5 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${notification.isRead ? "text-muted-foreground" : ""}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {ghostMeta && (
                          notification.isRecovered ? (
                            (() => {
                              let recoveredOrderNumber: string | null = null;
                              if (notification.metadata) {
                                try {
                                  const m = JSON.parse(notification.metadata);
                                  recoveredOrderNumber = m.recoveredOrderNumber ?? null;
                                } catch {}
                              }
                              return (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <Badge
                                    variant="secondary"
                                    className="gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30"
                                    data-testid={`badge-recovered-${notification.id}`}
                                  >
                                    <CheckCheck className="h-3 w-3" />
                                    {recoveredOrderNumber ? (
                                      <button
                                        className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsOpen(false);
                                          sessionStorage.setItem('highlightOrderNumber', recoveredOrderNumber);
                                          setLocation('/admin/orders');
                                          window.dispatchEvent(new CustomEvent('orderHighlight', { detail: { orderNumber: recoveredOrderNumber } }));
                                        }}
                                        data-testid={`link-recovered-order-${notification.id}`}
                                      >
                                        Recovered — Order {recoveredOrderNumber}
                                      </button>
                                    ) : (
                                      "Recovered"
                                    )}
                                  </Badge>
                                </div>
                              );
                            })()
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="mt-2 h-7 text-xs gap-1.5"
                              onClick={(e) => handleRecoverOrder(e, notification)}
                              data-testid={`button-recover-order-${notification.id}`}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Recover Order
                            </Button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate(notification.id);
                            }}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(notification.id);
                          }}
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {index < visibleNotifications.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
