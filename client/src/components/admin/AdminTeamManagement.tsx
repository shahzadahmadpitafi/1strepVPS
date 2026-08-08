import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, UserPlus, Users, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AdminTeamMember = {
  id: string;
  userId: string;
  departments: string[];
  jobTitle: string | null;
  isActive: boolean;
  createdAt: string;
  notifyNewOrders: boolean;
  notifyShipping: boolean;
  notifyDelivery: boolean;
  notifyLowStock: boolean;
  notifySupportTickets: boolean;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
};

const NOTIFICATION_OPTIONS = [
  { value: "notifyNewOrders", label: "New Orders", description: "Receive email when a new order is placed" },
  { value: "notifyShipping", label: "Shipping Updates", description: "Receive email when an order is dispatched" },
  { value: "notifyDelivery", label: "Deliveries", description: "Receive email when an order is delivered" },
  { value: "notifyLowStock", label: "Low Stock Alerts", description: "Receive email when stock is low" },
  { value: "notifySupportTickets", label: "Support Tickets", description: "Receive email for new support tickets" },
];

const DEPARTMENT_OPTIONS = [
  { value: "full_access", label: "Full Access", description: "Complete admin access to all areas" },
  { value: "products", label: "Products", description: "Manage products and catalogue" },
  { value: "inventory", label: "Inventory", description: "Manage stock and inventory" },
  { value: "orders", label: "Orders", description: "Manage customer orders" },
  { value: "customers", label: "Customers (CRM)", description: "Manage customer data and relationships" },
  { value: "resellers", label: "Resellers", description: "Manage reseller accounts" },
  { value: "support", label: "Support Tickets", description: "Handle customer support" },
  { value: "coupons", label: "Coupons", description: "Manage discounts and promotions" },
  { value: "chatbot", label: "Chatbot", description: "Manage AI chatbot" },
  { value: "settings", label: "Settings", description: "Configure site settings" },
];

export default function AdminTeamManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminTeamMember | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [editDepartments, setEditDepartments] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("true");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [editNotifications, setEditNotifications] = useState<string[]>([]);

  const { data: teamMembers = [], isLoading } = useQuery<AdminTeamMember[]>({
    queryKey: ["/api/admin/team"]
  });

  // Sync edit states when editingMember changes
  useEffect(() => {
    if (editingMember) {
      setEditDepartments(editingMember.departments || []);
      setEditStatus(editingMember.isActive ? "true" : "false");
      const notifications: string[] = [];
      if (editingMember.notifyNewOrders) notifications.push("notifyNewOrders");
      if (editingMember.notifyShipping) notifications.push("notifyShipping");
      if (editingMember.notifyDelivery) notifications.push("notifyDelivery");
      if (editingMember.notifyLowStock) notifications.push("notifyLowStock");
      if (editingMember.notifySupportTickets) notifications.push("notifySupportTickets");
      setEditNotifications(notifications);
    }
  }, [editingMember]);

  const toggleNotification = (value: string, isEdit = false) => {
    if (isEdit) {
      setEditNotifications(prev => 
        prev.includes(value) ? prev.filter(n => n !== value) : [...prev, value]
      );
    } else {
      setSelectedNotifications(prev => 
        prev.includes(value) ? prev.filter(n => n !== value) : [...prev, value]
      );
    }
  };

  const addMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/team", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      
      let title = "Team member added successfully!";
      let description = "";
      
      if (response.isNewUser) {
        title = "✨ New team member invited!";
        if (response.emailSent) {
          description = "Account created and invitation email sent with login credentials.";
        } else {
          description = "Account created. Email could not be sent - credentials logged to server console.";
        }
      } else {
        description = "Existing user promoted to admin team.";
      }
      
      toast({ 
        title, 
        description,
        duration: 5000,
      });
      setIsAddDialogOpen(false);
      setSelectedDepartments([]);
      setSelectedNotifications([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to add team member",
        variant: "destructive" 
      });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/team/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      toast({ title: "Team member updated successfully!" });
      setEditingMember(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update team member",
        variant: "destructive" 
      });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/team/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      toast({ title: "Team member removed successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to remove team member", variant: "destructive" });
    }
  });

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      departments: selectedDepartments,
      jobTitle: formData.get("jobTitle") as string || null,
      notifyNewOrders: selectedNotifications.includes("notifyNewOrders"),
      notifyShipping: selectedNotifications.includes("notifyShipping"),
      notifyDelivery: selectedNotifications.includes("notifyDelivery"),
      notifyLowStock: selectedNotifications.includes("notifyLowStock"),
      notifySupportTickets: selectedNotifications.includes("notifySupportTickets"),
    };
    addMemberMutation.mutate(data);
  };

  const handleUpdateMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      departments: editDepartments,
      jobTitle: formData.get("jobTitle") as string || null,
      isActive: editStatus === "true",
      notifyNewOrders: editNotifications.includes("notifyNewOrders"),
      notifyShipping: editNotifications.includes("notifyShipping"),
      notifyDelivery: editNotifications.includes("notifyDelivery"),
      notifyLowStock: editNotifications.includes("notifyLowStock"),
      notifySupportTickets: editNotifications.includes("notifySupportTickets"),
    };
    updateMemberMutation.mutate({ id: editingMember.id, data });
  };

  const toggleDepartment = (dept: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditDepartments(prev => 
        prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
      );
    } else {
      setSelectedDepartments(prev => 
        prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
      );
    }
  };

  const getDepartmentBadges = (departments: string[]) => {
    return departments.map(dept => {
      const option = DEPARTMENT_OPTIONS.find(o => o.value === dept);
      const colorClass = dept === "full_access" ? "bg-purple-500" : 
                        dept === "products" ? "bg-blue-500" :
                        dept === "inventory" ? "bg-green-500" :
                        dept === "orders" ? "bg-orange-500" :
                        dept === "support" ? "bg-red-500" :
                        "bg-gray-500";
      
      return (
        <Badge key={dept} className={`${colorClass} text-white text-xs`}>
          {option?.label || dept}
        </Badge>
      );
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Team Management
              </CardTitle>
              <CardDescription>
                Manage your admin team and assign department-specific access
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-team-member">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Invite a new admin team member. If they don't have an account, one will be created automatically and they'll receive an email with login credentials.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="user@example.com"
                      data-testid="input-email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      An invitation email will be sent with login credentials if creating a new account
                    </p>
                  </div>

                  <div>
                    <Label>Department Access *</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select all departments this team member can access
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {DEPARTMENT_OPTIONS.map((dept) => (
                        <div
                          key={dept.value}
                          className="flex items-start space-x-3 p-3 rounded-md border hover-elevate"
                          data-testid={`dept-option-${dept.value}`}
                        >
                          <Checkbox
                            id={dept.value}
                            checked={selectedDepartments.includes(dept.value)}
                            onCheckedChange={() => toggleDepartment(dept.value)}
                          />
                          <div className="flex-1">
                            <label htmlFor={dept.value} className="text-sm font-medium cursor-pointer">
                              {dept.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{dept.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedDepartments.length === 0 && (
                      <p className="text-xs text-destructive mt-2">Please select at least one department</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      placeholder="e.g., Products Manager, Support Specialist"
                      data-testid="input-job-title"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select which email notifications this team member should receive
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {NOTIFICATION_OPTIONS.map((notif) => (
                        <div
                          key={notif.value}
                          className="flex items-start space-x-3 p-3 rounded-md border hover-elevate"
                          data-testid={`notif-option-${notif.value}`}
                        >
                          <Checkbox
                            id={notif.value}
                            checked={selectedNotifications.includes(notif.value)}
                            onCheckedChange={() => toggleNotification(notif.value)}
                          />
                          <div className="flex-1">
                            <label htmlFor={notif.value} className="text-sm font-medium cursor-pointer">
                              {notif.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{notif.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addMemberMutation.isPending || selectedDepartments.length === 0}
                    data-testid="button-submit-add-member"
                  >
                    {addMemberMutation.isPending ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Team Member
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading team members...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-4">
                Add team members to help manage different areas of the platform
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} data-testid={`team-member-${member.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {member.user.firstName} {member.user.lastName}
                          </h4>
                          {!member.isActive && (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{member.user.email}</p>
                        {member.jobTitle && (
                          <p className="text-sm text-muted-foreground mb-2">{member.jobTitle}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {getDepartmentBadges(member.departments)}
                        </div>
                        {(member.notifyNewOrders || member.notifyShipping || member.notifyDelivery || member.notifyLowStock || member.notifySupportTickets) && (
                          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                            <Bell className="h-3 w-3" />
                            <span>Receives:</span>
                            {member.notifyNewOrders && <Badge variant="outline" className="text-xs py-0 px-1">Orders</Badge>}
                            {member.notifyShipping && <Badge variant="outline" className="text-xs py-0 px-1">Shipping</Badge>}
                            {member.notifyDelivery && <Badge variant="outline" className="text-xs py-0 px-1">Delivery</Badge>}
                            {member.notifyLowStock && <Badge variant="outline" className="text-xs py-0 px-1">Low Stock</Badge>}
                            {member.notifySupportTickets && <Badge variant="outline" className="text-xs py-0 px-1">Support</Badge>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMember(member)}
                          data-testid={`button-edit-${member.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this team member?")) {
                              deleteMemberMutation.mutate(member.id);
                            }
                          }}
                          data-testid={`button-delete-${member.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member department access and details
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editingMember.user.email} disabled />
              </div>

              <div>
                <Label>Department Access *</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select all departments this team member can access
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <div
                      key={dept.value}
                      className="flex items-start space-x-3 p-3 rounded-md border hover-elevate"
                      data-testid={`edit-dept-option-${dept.value}`}
                    >
                      <Checkbox
                        id={`edit-${dept.value}`}
                        checked={editDepartments.includes(dept.value)}
                        onCheckedChange={() => toggleDepartment(dept.value, true)}
                      />
                      <div className="flex-1">
                        <label htmlFor={`edit-${dept.value}`} className="text-sm font-medium cursor-pointer">
                          {dept.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{dept.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-jobTitle">Job Title</Label>
                <Input
                  id="edit-jobTitle"
                  name="jobTitle"
                  defaultValue={editingMember.jobTitle || ""}
                  placeholder="e.g., Products Manager, Support Specialist"
                  data-testid="input-edit-job-title"
                />
              </div>

              <div>
                <Label htmlFor="edit-isActive">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus} required>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select which email notifications this team member should receive
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {NOTIFICATION_OPTIONS.map((notif) => (
                    <div
                      key={notif.value}
                      className="flex items-start space-x-3 p-3 rounded-md border hover-elevate"
                      data-testid={`edit-notif-option-${notif.value}`}
                    >
                      <Checkbox
                        id={`edit-${notif.value}`}
                        checked={editNotifications.includes(notif.value)}
                        onCheckedChange={() => toggleNotification(notif.value, true)}
                      />
                      <div className="flex-1">
                        <label htmlFor={`edit-${notif.value}`} className="text-sm font-medium cursor-pointer">
                          {notif.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={updateMemberMutation.isPending || editDepartments.length === 0}
                data-testid="button-submit-edit-member"
              >
                {updateMemberMutation.isPending ? "Updating..." : "Update Team Member"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
