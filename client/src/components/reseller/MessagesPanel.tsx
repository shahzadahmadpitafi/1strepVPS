import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, User, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  resellerId: string;
  senderId: string;
  messageType: string;
  subject: string | null;
  content: string;
  orderId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

interface MessagesPanelProps {
  resellerId: string;
  currentUserId: string;
}

const messageTypeLabels: Record<string, string> = {
  general: "General",
  order_query: "Order Query",
  stock_inquiry: "Stock Inquiry",
  support: "Support",
  billing: "Billing",
};

const messageTypeColors: Record<string, string> = {
  general: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  order_query: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  stock_inquiry: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  support: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  billing: "bg-green-500/10 text-green-500 border-green-500/20",
};

export default function MessagesPanel({ resellerId, currentUserId }: MessagesPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [messageType, setMessageType] = useState("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/resellers/${resellerId}/messages`],
    enabled: !!resellerId,
  });

  // Fetch unread messages
  const { data: unreadMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/resellers/${resellerId}/messages/unread`],
    enabled: !!resellerId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { resellerId: string; messageType: string; subject?: string; content: string }) => {
      return await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/messages/unread`] });
      setNewMessage("");
      setSubject("");
      setMessageType("general");
      toast({ title: "Message sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('PATCH', `/api/messages/${messageId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/resellers/${resellerId}/messages/unread`] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark unread messages as read when viewing
  useEffect(() => {
    if (currentUserId && unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        if (msg.senderId !== currentUserId && !msg.isRead) {
          markAsReadMutation.mutate(msg.id);
        }
      });
    }
  }, [unreadMessages.length, currentUserId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({ title: "Please enter a message", variant: "destructive" });
      return;
    }

    sendMessageMutation.mutate({
      resellerId,
      messageType,
      subject: subject.trim() || undefined,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Messages</CardTitle>
            </div>
            {unreadMessages.length > 0 && (
              <Badge className="bg-primary" data-testid="badge-unread-messages">
                {unreadMessages.length} unread
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages List */}
          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12" data-testid="text-no-messages">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start a conversation with the admin</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => {
                  const isFromAdmin = message.sender?.role === 'admin';
                  const isFromMe = message.senderId === currentUserId;
                  const typeColor = messageTypeColors[message.messageType] || messageTypeColors.general;
                  const typeLabel = messageTypeLabels[message.messageType] || message.messageType;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${message.id}`}
                    >
                      <div className={`max-w-[80%] ${isFromMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className="flex items-center gap-2">
                          {isFromAdmin ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              <span>Admin</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>You</span>
                            </div>
                          )}
                          <Badge className={`${typeColor} text-xs`} data-testid={`badge-message-type-${message.id}`}>
                            {typeLabel}
                          </Badge>
                        </div>

                        {message.subject && (
                          <p className="text-sm font-medium text-foreground" data-testid={`text-subject-${message.id}`}>
                            {message.subject}
                          </p>
                        )}

                        <div
                          className={`rounded-lg p-3 ${
                            isFromMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                          data-testid={`text-content-${message.id}`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>

                        <p className="text-xs text-muted-foreground" data-testid={`text-time-${message.id}`}>
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Message Input */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="message-type" className="text-xs">Type</Label>
                <select
                  id="message-type"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
                  data-testid="select-message-type"
                >
                  <option value="general">General</option>
                  <option value="order_query">Order Query</option>
                  <option value="stock_inquiry">Stock Inquiry</option>
                  <option value="support">Support</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
              <div>
                <Label htmlFor="subject" className="text-xs">Subject (Optional)</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="mt-1"
                  data-testid="input-subject"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="resize-none"
                rows={3}
                data-testid="textarea-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                size="icon"
                className="h-full"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
