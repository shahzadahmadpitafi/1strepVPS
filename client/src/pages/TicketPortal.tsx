import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  User,
  Headphones
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { io, Socket } from "socket.io-client";

type SupportTicket = {
  id: string;
  ticketNumber: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: string;
  createdAt: string;
  updatedAt: string;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  senderName: string;
  senderEmail: string;
  isStaff: boolean;
  message: string;
  createdAt: string;
};

export default function TicketPortal() {
  const { token } = useParams<{ token: string }>();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();

  // WebSocket connection for real-time updates - join after ticket is loaded
  useEffect(() => {
    if (!token || !ticket?.id) return;

    const socket = io({
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Ticket portal socket connected');
      // Join ticket-specific room for secure messaging
      socket.emit('join_ticket_room', { ticketId: ticket.id, accessToken: token });
    });

    socket.on('ticket_message', (data: { ticketId: string; message: TicketMessage }) => {
      // Only process messages for this ticket (verified by room membership on server)
      if (data.ticketId === ticket.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/ticket-portal", token, "messages"] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, ticket?.id]);

  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useQuery<SupportTicket>({
    queryKey: ["/api/ticket-portal", token],
    queryFn: async () => {
      const res = await fetch(`/api/ticket-portal/${token}`);
      if (!res.ok) throw new Error("Ticket not found");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<TicketMessage[]>({
    queryKey: ["/api/ticket-portal", token, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/ticket-portal/${token}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!token && !!ticket,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/ticket-portal/${token}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ticket-portal", token, "messages"] });
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been sent to our support team.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock className="h-3 w-3 mr-1" /> Open</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><AlertCircle className="h-3 w-3 mr-1" /> In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Resolved</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (ticketLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white/70">Loading your support ticket...</p>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-white/10">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Ticket Not Found</h2>
            <p className="text-white/70 mb-6">
              This ticket link may have expired or is invalid. Please check your email for the correct link.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                <ArrowLeft className="h-4 w-4 mr-2" /> Return to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-white/70 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to 1stRep
            </Button>
          </Link>
        </div>

        <Card className="bg-slate-800/50 border-white/10 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">1stRep Support</CardTitle>
                  <p className="text-sm text-white/80">{ticket.ticketNumber}</p>
                </div>
              </div>
              {getStatusBadge(ticket.status)}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="p-4 border-b border-white/10 bg-slate-700/30">
              <h3 className="font-medium text-white mb-1">{ticket.subject}</h3>
              <p className="text-sm text-white/60">
                Created {format(new Date(ticket.createdAt), "d MMM yyyy 'at' h:mm a")}
              </p>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-slate-700/50 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-white/50" />
                      <span className="text-xs text-white/50">{ticket.customerName}</span>
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap">{ticket.description}</p>
                    <p className="text-xs text-white/40 mt-2">
                      {format(new Date(ticket.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isStaff ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.isStaff
                          ? "bg-gradient-to-r from-blue-600/80 to-purple-600/80 border border-white/20"
                          : "bg-slate-700/50 border border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.isStaff ? (
                          <Headphones className="h-3 w-3 text-white/70" />
                        ) : (
                          <User className="h-3 w-3 text-white/50" />
                        )}
                        <span className="text-xs text-white/70">
                          {message.isStaff ? "1stRep Support" : message.senderName}
                        </span>
                      </div>
                      <p className="text-sm text-white whitespace-pre-wrap">{message.message}</p>
                      <p className="text-xs text-white/40 mt-2">
                        {format(new Date(message.createdAt), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}

                {messagesLoading && (
                  <div className="flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {ticket.status !== "closed" && ticket.status !== "resolved" ? (
              <div className="p-4 border-t border-white/10 bg-slate-800/50">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-h-[60px] max-h-[120px] bg-slate-700/50 border-white/20 text-white placeholder:text-white/50 resize-none"
                    data-testid="input-ticket-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 self-end"
                    data-testid="button-send-ticket-message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            ) : (
              <div className="p-4 border-t border-white/10 bg-slate-800/50 text-center">
                <p className="text-white/60 text-sm">
                  This ticket has been {ticket.status}. Need more help?{" "}
                  <Link href="/contact-support" className="text-blue-400 hover:underline">
                    Open a new ticket
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-white/40 text-xs mt-4">
          Secure support portal powered by 1stRep
        </p>
      </div>
    </div>
  );
}
