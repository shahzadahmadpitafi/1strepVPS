import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import {
  Ticket,
  Plus,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type SupportTicket = {
  id: string;
  ticketNumber: string;
  userId: string | null;
  customerEmail: string;
  customerName: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  orderId: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  userId: string | null;
  senderName: string;
  senderEmail: string;
  isStaff: boolean;
  message: string;
  createdAt: string;
};

export default function AdminSupportTickets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicketForm, setNewTicketForm] = useState({
    customerEmail: "",
    customerName: "",
    subject: "",
    description: "",
    priority: "medium",
  });
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support-tickets"],
  });

  const { data: ticketMessages = [] } = useQuery<TicketMessage[]>({
    queryKey: [`/api/admin/support-tickets/${selectedTicket?.id}/messages`],
    enabled: !!selectedTicket,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: typeof newTicketForm) =>
      apiRequest("POST", "/api/admin/support-tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setShowCreateDialog(false);
      setNewTicketForm({
        customerEmail: "",
        customerName: "",
        subject: "",
        description: "",
        priority: "medium",
      });
      toast({
        title: "Ticket Created",
        description: "Support ticket has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SupportTicket> }) =>
      apiRequest("PATCH", `/api/admin/support-tickets/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      toast({
        title: "Ticket Updated",
        description: "Support ticket has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      apiRequest("POST", `/api/admin/support-tickets/${ticketId}/messages`, { message }),
    onSuccess: () => {
      if (selectedTicket) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/support-tickets/${selectedTicket.id}/messages`] });
      }
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your response has been sent to the customer.",
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; color: string }> = {
      open: { icon: AlertCircle, color: "bg-red-500" },
      in_progress: { icon: Clock, color: "bg-blue-500" },
      resolved: { icon: CheckCircle2, color: "bg-green-500" },
      closed: { icon: CheckCircle2, color: "bg-gray-500" },
    };
    const { icon: Icon, color } = variants[status] || variants.open;
    return (
      <Badge className={`${color} hover:${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-600",
    };
    return <Badge className={colors[priority]}>{priority}</Badge>;
  };

  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards with Enhanced Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-blue-500/20 relative group hover-elevate active-elevate-2 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Tickets</p>
                <div className="text-4xl font-extrabold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent" data-testid="stat-total-tickets">
                  {tickets.length}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10">
                <Ticket className="w-7 h-7 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 relative group hover-elevate active-elevate-2 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Open</p>
                <div className="text-4xl font-extrabold bg-gradient-to-br from-red-600 to-red-400 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent" data-testid="stat-open-tickets">
                  {openTicketsCount}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center ring-1 ring-red-500/20 shadow-lg shadow-red-500/10">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 relative group hover-elevate active-elevate-2 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">In Progress</p>
                <div className="text-4xl font-extrabold bg-gradient-to-br from-yellow-600 to-yellow-400 dark:from-yellow-400 dark:to-yellow-500 bg-clip-text text-transparent" data-testid="stat-in-progress-tickets">
                  {inProgressCount}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 flex items-center justify-center ring-1 ring-yellow-500/20 shadow-lg shadow-yellow-500/10">
                <Clock className="w-7 h-7 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 relative group hover-elevate active-elevate-2 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl group-hover:w-40 group-hover:h-40 transition-all duration-500" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resolved</p>
                <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-green-400 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent" data-testid="stat-resolved-tickets">
                  {resolvedCount}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center ring-1 ring-green-500/20 shadow-lg shadow-green-500/10">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Support Tickets</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-8 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-tickets"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-ticket">
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tickets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.customerName}</div>
                        <div className="text-sm text-muted-foreground">{ticket.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                        data-testid={`button-view-ticket-${ticket.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Create a new support ticket on behalf of a customer</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name"
                value={newTicketForm.customerName}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                data-testid="input-ticket-customer-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Customer Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="customer@example.com"
                value={newTicketForm.customerEmail}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, customerEmail: e.target.value })}
                data-testid="input-ticket-customer-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                data-testid="input-ticket-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue..."
                rows={4}
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                data-testid="textarea-ticket-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTicketForm.priority}
                onValueChange={(value) => setNewTicketForm({ ...newTicketForm, priority: value })}
              >
                <SelectTrigger id="priority" data-testid="select-ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              data-testid="button-cancel-ticket"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTicketMutation.mutate(newTicketForm)}
              disabled={
                createTicketMutation.isPending ||
                !newTicketForm.customerName ||
                !newTicketForm.customerEmail ||
                !newTicketForm.subject ||
                !newTicketForm.description
              }
              data-testid="button-submit-ticket"
            >
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTicket?.ticketNumber}</span>
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Ticket Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer</Label>
                <p className="text-sm font-medium">{selectedTicket?.customerName}</p>
                <p className="text-sm text-muted-foreground">{selectedTicket?.customerEmail}</p>
              </div>
              <div>
                <Label>Priority</Label>
                <div className="mt-1">{selectedTicket && getPriorityBadge(selectedTicket.priority)}</div>
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm">
                  {selectedTicket && format(new Date(selectedTicket.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <div>
                <Label>Last Updated</Label>
                <p className="text-sm">
                  {selectedTicket && format(new Date(selectedTicket.updatedAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>

            {/* Status Update */}
            <div className="space-y-2">
              <Label>Update Status</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedTicket?.status}
                  onValueChange={(value) =>
                    selectedTicket &&
                    updateTicketMutation.mutate({
                      id: selectedTicket.id,
                      updates: { status: value as any },
                    })
                  }
                >
                  <SelectTrigger className="w-full" data-testid="select-update-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedTicket?.priority}
                  onValueChange={(value) =>
                    selectedTicket &&
                    updateTicketMutation.mutate({
                      id: selectedTicket.id,
                      updates: { priority: value as any },
                    })
                  }
                >
                  <SelectTrigger className="w-full" data-testid="select-update-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Original Description */}
            <div>
              <Label>Original Description</Label>
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket?.description}</p>
                </CardContent>
              </Card>
            </div>

            {/* Messages */}
            <div>
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages ({ticketMessages.length})
              </Label>
              <div className="space-y-3 mt-2 max-h-64 overflow-y-auto">
                {ticketMessages.map((msg) => (
                  <Card key={msg.id} className={msg.isStaff ? "bg-primary/5" : ""}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{msg.senderName}</p>
                          <p className="text-xs text-muted-foreground">{msg.senderEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {msg.isStaff && <Badge variant="secondary">Staff</Badge>}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Send Message */}
            <div className="space-y-2">
              <Label htmlFor="new-message">Send Response</Label>
              <Textarea
                id="new-message"
                placeholder="Type your response..."
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                data-testid="textarea-ticket-message"
              />
              <Button
                onClick={() => {
                  if (selectedTicket) {
                    sendMessageMutation.mutate({
                      ticketId: selectedTicket.id,
                      message: newMessage,
                    });
                  }
                }}
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? "Sending..." : "Send Response"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
