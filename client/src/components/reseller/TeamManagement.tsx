import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Plus, Edit, Trash2, Shield, Mail, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  resellerId: string;
  userId: string;
  permission: "view_only" | "can_order" | "can_approve" | "admin";
  isActive: boolean;
  jobTitle: string | null;
  department: string | null;
  canApproveUpTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function TeamManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [addPermission, setAddPermission] = useState("view_only");
  const [editPermission, setEditPermission] = useState("view_only");
  const [editStatus, setEditStatus] = useState("true");

  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/reseller/team"]
  });

  // Sync edit states when editingMember changes
  useEffect(() => {
    if (editingMember) {
      setEditPermission(editingMember.permission);
      setEditStatus(editingMember.isActive ? "true" : "false");
    }
  }, [editingMember]);

  const addMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/reseller/team", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/team"] });
      toast({ title: "Team member added successfully!" });
      setIsAddDialogOpen(false);
      setAddPermission("view_only");
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
      return await apiRequest("PATCH", `/api/reseller/team/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/team"] });
      toast({ title: "Team member updated successfully!" });
      setEditingMember(null);
    },
    onError: () => {
      toast({ title: "Failed to update team member", variant: "destructive" });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/reseller/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/team"] });
      toast({ title: "Team member removed" });
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
      permission: addPermission,
      jobTitle: formData.get("jobTitle") as string || null,
      department: formData.get("department") as string || null,
      canApproveUpTo: formData.get("canApproveUpTo") as string || null,
    };
    addMemberMutation.mutate(data);
  };

  const handleUpdateMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      permission: editPermission,
      jobTitle: formData.get("jobTitle") as string || null,
      department: formData.get("department") as string || null,
      canApproveUpTo: formData.get("canApproveUpTo") as string || null,
      isActive: editStatus === "true",
    };
    updateMemberMutation.mutate({ id: editingMember.id, data });
  };

  const getPermissionBadge = (permission: string) => {
    const variants: Record<string, string> = {
      view_only: "bg-gray-500",
      can_order: "bg-blue-500",
      can_approve: "bg-purple-500",
      admin: "bg-red-500"
    };
    return variants[permission] || "bg-gray-500";
  };

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      view_only: "View Only",
      can_order: "Can Order",
      can_approve: "Can Approve",
      admin: "Admin"
    };
    return labels[permission] || permission;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage team members and their access permissions
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-team-member">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a team member to your B2B account. They must already have a user account.
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
                  placeholder="team.member@company.com"
                  data-testid="input-member-email"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  User must have an existing account
                </p>
              </div>

              <div>
                <Label htmlFor="permission">Permission Level *</Label>
                <Select value={addPermission} onValueChange={setAddPermission} required>
                  <SelectTrigger data-testid="select-permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view_only">View Only - Can view data only</SelectItem>
                    <SelectItem value="can_order">Can Order - Can place orders</SelectItem>
                    <SelectItem value="can_approve">Can Approve - Can approve large orders</SelectItem>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  placeholder="Sales Manager"
                  data-testid="input-job-title"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  placeholder="Sales"
                  data-testid="input-department"
                />
              </div>

              <div>
                <Label htmlFor="canApproveUpTo">Spending Limit (£)</Label>
                <Input
                  id="canApproveUpTo"
                  name="canApproveUpTo"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  data-testid="input-spending-limit"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum order value this user can approve
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={addMemberMutation.isPending}
                data-testid="button-submit-add-member"
              >
                {addMemberMutation.isPending ? "Adding..." : "Add Team Member"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add team members to collaborate on your B2B account
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-member">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <Card key={member.id} data-testid={`card-member-${member.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {member.user.firstName} {member.user.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {member.user.email}
                    </CardDescription>
                  </div>
                  <Badge className={getPermissionBadge(member.permission)}>
                    {getPermissionLabel(member.permission)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {member.jobTitle && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{member.jobTitle}</span>
                  </div>
                )}
                {member.department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{member.department}</span>
                  </div>
                )}
                {member.canApproveUpTo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Can approve up to £{member.canApproveUpTo}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Added {format(new Date(member.createdAt), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingMember(member)}
                    data-testid={`button-edit-${member.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
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
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member permissions and details
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editingMember.user.email} disabled />
              </div>

              <div>
                <Label htmlFor="edit-permission">Permission Level *</Label>
                <Select value={editPermission} onValueChange={setEditPermission} required>
                  <SelectTrigger data-testid="select-edit-permission">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view_only">View Only - Can view data only</SelectItem>
                    <SelectItem value="can_order">Can Order - Can place orders</SelectItem>
                    <SelectItem value="can_approve">Can Approve - Can approve large orders</SelectItem>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-jobTitle">Job Title</Label>
                <Input
                  id="edit-jobTitle"
                  name="jobTitle"
                  defaultValue={editingMember.jobTitle || ""}
                  placeholder="Sales Manager"
                  data-testid="input-edit-job-title"
                />
              </div>

              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  name="department"
                  defaultValue={editingMember.department || ""}
                  placeholder="Sales"
                  data-testid="input-edit-department"
                />
              </div>

              <div>
                <Label htmlFor="edit-canApproveUpTo">Spending Limit (£)</Label>
                <Input
                  id="edit-canApproveUpTo"
                  name="canApproveUpTo"
                  type="number"
                  step="0.01"
                  defaultValue={editingMember.canApproveUpTo || ""}
                  placeholder="1000.00"
                  data-testid="input-edit-spending-limit"
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={updateMemberMutation.isPending}
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
