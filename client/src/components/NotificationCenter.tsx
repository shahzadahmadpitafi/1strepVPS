import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, X, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  resellerId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationCenterProps {
  resellerId: string;
}

const notificationTypeColors: Record<string, string> = {
  order_update: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  message: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  stock_alert: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  approval: "bg-green-500/10 text-green-500 border-green-500/20",
  system: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const notificationTypeLabels: Record<string, string> = {
  order_update: "Order Update",
  message: "Message",
  stock_alert: "Stock Alert",
  approval: "Approval",
  system: "System",
};

export default function NotificationCenter({ resellerId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch all notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/resellers/${resellerId}/notifications`],
    enabled: !!resellerId,
  });

  // Fetch unread count
  const { data: unreadNotifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/resellers/${resellerId}/notifications/unread`],
    enabled: !!resellerId,
  });

  const unreadCount = unreadNotifications.length;

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest('PATCH', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/notifications`] });
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/notifications/unread`] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/resellers/${resellerId}/notifications/read-all`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/notifications`] });
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/notifications/unread`] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to link if provided
    if (notification.link) {
      setIsOpen(false);
      setLocation(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" data-testid="popover-notifications">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
              data-testid="button-close-notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-pulse">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center" data-testid="text-no-notifications">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const typeColor = notificationTypeColors[notification.type] || notificationTypeColors.system;
                const typeLabel = notificationTypeLabels[notification.type] || notification.type;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover-elevate cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${typeColor} text-xs`} data-testid={`badge-type-${notification.id}`}>
                            {typeLabel}
                          </Badge>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary" data-testid={`dot-unread-${notification.id}`} />
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-foreground mb-1" data-testid={`text-title-${notification.id}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-message-${notification.id}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-muted-foreground" data-testid={`text-time-${notification.id}`}>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                          {notification.link && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(notification.id);
                          }}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  // Future: navigate to full notifications page
                }}
                data-testid="button-view-all-notifications"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
