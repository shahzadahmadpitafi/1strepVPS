import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, ArrowLeft, Plus, Pencil, Trash2, Play, Check, X,
  Mail, Monitor, AlertTriangle, TrendingUp, DollarSign,
  Award, Clock, Eye, EyeOff, Settings, Zap, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface NotificationRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  conditions: string;
  recipients: string;
  channel: string;
  emailSubject: string | null;
  emailBody: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface NotificationLog {
  id: string;
  ruleId: string | null;
  ruleType: string;
  partnerType: string | null;
  resellerId: string | null;
  vendorId: string | null;
  orderId: number | null;
  title: string;
  message: string;
  channel: string;
  emailSentAt: string | null;
  inAppCreatedAt: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationStats {
  totalRules: number;
  activeRules: number;
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Array<{ type: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

const RULE_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  high_value_order: { label: "High Value Order", icon: DollarSign, color: "text-green-500" },
  low_performance: { label: "Low Performance", icon: AlertTriangle, color: "text-amber-500" },
  payout_reminder: { label: "Payout Reminder", icon: Clock, color: "text-blue-500" },
  commission_milestone: { label: "Commission Milestone", icon: Award, color: "text-purple-500" },
  tier_upgrade: { label: "Tier Upgrade", icon: TrendingUp, color: "text-emerald-500" },
  anomaly_detection: { label: "Anomaly Detection", icon: Zap, color: "text-red-500" },
};

const CHANNEL_LABELS: Record<string, { label: string; icon: any }> = {
  in_app: { label: "In-App", icon: Monitor },
  email: { label: "Email", icon: Mail },
  both: { label: "Both", icon: Bell },
};

export default function AdminSmartNotifications() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("rules");
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const { toast } = useToast();

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<NotificationStats>({
    queryKey: ["/api/admin/smart-notification-stats"],
    enabled: authUser?.role === "admin",
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery<NotificationRule[]>({
    queryKey: ["/api/admin/smart-notification-rules"],
    enabled: authUser?.role === "admin",
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<NotificationLog[]>({
    queryKey: ["/api/admin/smart-notification-log"],
    enabled: authUser?.role === "admin",
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: Partial<NotificationRule>) => 
      apiRequest("POST", "/api/admin/smart-notification-rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-stats"] });
      setIsRuleDialogOpen(false);
      setEditingRule(null);
      toast({ title: "Rule created", description: "Notification rule has been created successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create notification rule.", variant: "destructive" });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationRule> }) => 
      apiRequest("PATCH", `/api/admin/smart-notification-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-stats"] });
      setIsRuleDialogOpen(false);
      setEditingRule(null);
      toast({ title: "Rule updated", description: "Notification rule has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update notification rule.", variant: "destructive" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/smart-notification-rules/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-rules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-stats"] });
      toast({ title: "Rule deleted", description: "Notification rule has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete notification rule.", variant: "destructive" });
    },
  });

  const testRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/smart-notification-rules/${id}/test`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-stats"] });
      toast({ title: "Test sent", description: "Test notification has been sent successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send test notification.", variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/smart-notification-log/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-notification-stats"] });
    },
  });

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsRuleDialogOpen(true);
  };

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule);
    setIsRuleDialogOpen(true);
  };

  const handleToggleActive = (rule: NotificationRule) => {
    updateRuleMutation.mutate({ id: rule.id, data: { isActive: !rule.isActive } });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/admin/commission-analytics")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Smart Notifications</h1>
            <p className="text-muted-foreground">Manage automated alerts and notification rules</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card data-testid="card-total-rules">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRules || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeRules || 0} active
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-notifications-sent">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
              <Send className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.totalNotifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-unread">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Bell className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats?.unreadNotifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                Pending review
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-rules">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalRules ? Math.round((stats.activeRules / stats.totalRules) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Rules enabled
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="rules" data-testid="tab-rules">Notification Rules</TabsTrigger>
              <TabsTrigger value="logs" data-testid="tab-logs">Activity Log</TabsTrigger>
            </TabsList>
            
            {activeTab === "rules" && (
              <Button onClick={handleCreateRule} data-testid="button-create-rule">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            )}
          </div>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Rules</CardTitle>
                <CardDescription>Configure automated alerts based on partner activity</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : rules.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4 opacity-50" />
                    <p>No notification rules configured</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreateRule}>
                      Create your first rule
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => {
                        const typeInfo = RULE_TYPE_LABELS[rule.ruleType] || { label: rule.ruleType, icon: Bell, color: "text-gray-500" };
                        const channelInfo = CHANNEL_LABELS[rule.channel] || { label: rule.channel, icon: Bell };
                        const TypeIcon = typeInfo.icon;
                        const ChannelIcon = channelInfo.icon;
                        
                        return (
                          <TableRow key={rule.id} data-testid={`rule-row-${rule.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{rule.name}</p>
                                {rule.description && (
                                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                                <span className="text-sm">{typeInfo.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{channelInfo.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{rule.recipients}</Badge>
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={rule.isActive}
                                onCheckedChange={() => handleToggleActive(rule)}
                                data-testid={`switch-active-${rule.id}`}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => testRuleMutation.mutate(rule.id)}
                                  disabled={testRuleMutation.isPending}
                                  data-testid={`button-test-${rule.id}`}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditRule(rule)}
                                  data-testid={`button-edit-${rule.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => deleteRuleMutation.mutate(rule.id)}
                                  disabled={deleteRuleMutation.isPending}
                                  data-testid={`button-delete-${rule.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>History of all sent notifications</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <Clock className="h-12 w-12 mb-4 opacity-50" />
                    <p>No notifications sent yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => {
                        const typeInfo = RULE_TYPE_LABELS[log.ruleType] || { label: log.ruleType, icon: Bell, color: "text-gray-500" };
                        const channelInfo = CHANNEL_LABELS[log.channel] || { label: log.channel, icon: Bell };
                        const TypeIcon = typeInfo.icon;
                        const ChannelIcon = channelInfo.icon;
                        
                        return (
                          <TableRow 
                            key={log.id} 
                            data-testid={`log-row-${log.id}`}
                            className={log.isRead ? "opacity-60" : ""}
                          >
                            <TableCell>
                              <div>
                                <p className={`font-medium ${!log.isRead ? 'text-foreground' : ''}`}>
                                  {log.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {log.message}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                                <span className="text-sm">{typeInfo.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{channelInfo.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.isRead ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Read
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Unread
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {!log.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => markReadMutation.mutate(log.id)}
                                  data-testid={`button-mark-read-${log.id}`}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <RuleDialog 
          open={isRuleDialogOpen}
          onOpenChange={setIsRuleDialogOpen}
          rule={editingRule}
          onSave={(data) => {
            if (editingRule) {
              updateRuleMutation.mutate({ id: editingRule.id, data });
            } else {
              createRuleMutation.mutate(data);
            }
          }}
          isPending={createRuleMutation.isPending || updateRuleMutation.isPending}
        />
      </div>
    </div>
  );
}

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: NotificationRule | null;
  onSave: (data: Partial<NotificationRule>) => void;
  isPending: boolean;
}

function RuleDialog({ open, onOpenChange, rule, onSave, isPending }: RuleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState("high_value_order");
  const [channel, setChannel] = useState("in_app");
  const [recipients, setRecipients] = useState("admin");
  const [threshold, setThreshold] = useState("500");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const resetForm = () => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description || "");
      setRuleType(rule.ruleType);
      setChannel(rule.channel);
      setRecipients(rule.recipients);
      const conditions = JSON.parse(rule.conditions || "{}");
      setThreshold(conditions.threshold?.toString() || "500");
      setEmailSubject(rule.emailSubject || "");
      setEmailBody(rule.emailBody || "");
    } else {
      setName("");
      setDescription("");
      setRuleType("high_value_order");
      setChannel("in_app");
      setRecipients("admin");
      setThreshold("500");
      setEmailSubject("");
      setEmailBody("");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    const conditions = JSON.stringify({
      threshold: parseFloat(threshold) || 500,
      comparison: "greater_than"
    });

    onSave({
      name,
      description: description || null,
      ruleType,
      channel,
      recipients,
      conditions,
      emailSubject: channel !== "in_app" ? emailSubject : null,
      emailBody: channel !== "in_app" ? emailBody : null,
      isActive: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Rule" : "Create Notification Rule"}</DialogTitle>
          <DialogDescription>
            Configure when and how to send automated notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value Order Alert"
              data-testid="input-rule-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              data-testid="input-rule-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger data-testid="select-rule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_value_order">High Value Order</SelectItem>
                  <SelectItem value="low_performance">Low Performance</SelectItem>
                  <SelectItem value="payout_reminder">Payout Reminder</SelectItem>
                  <SelectItem value="commission_milestone">Commission Milestone</SelectItem>
                  <SelectItem value="tier_upgrade">Tier Upgrade</SelectItem>
                  <SelectItem value="anomaly_detection">Anomaly Detection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger data-testid="select-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App Only</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select value={recipients} onValueChange={setRecipients}>
                <SelectTrigger data-testid="select-recipients">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin Only</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold Value</Label>
              <Input
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="500"
                data-testid="input-threshold"
              />
            </div>
          </div>

          {channel !== "in_app" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailSubject">Email Subject</Label>
                <Input
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Notification: {{event_type}}"
                  data-testid="input-email-subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailBody">Email Body</Label>
                <Textarea
                  id="emailBody"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Dear Admin, a {{event_type}} event has occurred..."
                  rows={4}
                  data-testid="input-email-body"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !name} data-testid="button-save-rule">
            {isPending ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
