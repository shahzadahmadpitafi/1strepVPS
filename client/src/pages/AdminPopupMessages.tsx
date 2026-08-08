import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, MessageSquare, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type PopupMessage = {
  id: string;
  title: string;
  content: string;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  buttonColor: string | null;
  isActive: boolean;
  showOnce: boolean;
  displayDelay: number | null;
  priority: number | null;
  startDate: string | null;
  endDate: string | null;
  targetPages: string[] | null;
  createdAt: string;
  updatedAt: string;
};

const PAGE_OPTIONS = [
  { value: "all", label: "All Pages" },
  { value: "homepage", label: "Homepage" },
  { value: "products", label: "Products Page" },
  { value: "cart", label: "Cart Page" },
  { value: "checkout", label: "Checkout Page" },
  { value: "account", label: "Account Page" },
  { value: "wishlist", label: "Wishlist Page" },
];

type PopupFormData = {
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  isActive: boolean;
  showOnce: boolean;
  displayDelay: number;
  priority: number;
  startDate: string;
  endDate: string;
  targetPages: string[];
};

function PopupForm({ 
  popup, 
  onSuccess 
}: { 
  popup?: PopupMessage; 
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PopupFormData>({
    title: popup?.title || "",
    content: popup?.content || "",
    buttonText: popup?.buttonText || "Got it",
    buttonLink: popup?.buttonLink || "",
    imageUrl: popup?.imageUrl || "",
    backgroundColor: popup?.backgroundColor || "#1a1a2e",
    textColor: popup?.textColor || "#ffffff",
    buttonColor: popup?.buttonColor || "#3b82f6",
    isActive: popup?.isActive ?? true,
    showOnce: popup?.showOnce ?? true,
    displayDelay: popup?.displayDelay || 1000,
    priority: popup?.priority || 0,
    startDate: popup?.startDate ? popup.startDate.split('T')[0] : "",
    endDate: popup?.endDate ? popup.endDate.split('T')[0] : "",
    targetPages: popup?.targetPages || ["all"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<PopupFormData>) => 
      apiRequest("POST", "/api/admin/popup-messages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popup-messages"] });
      toast({
        title: "Popup created",
        description: "Your popup message has been created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create popup message",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PopupFormData>) => 
      apiRequest("PATCH", `/api/admin/popup-messages/${popup?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popup-messages"] });
      toast({
        title: "Popup updated",
        description: "Your popup message has been updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update popup message",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    };

    if (popup) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Welcome to our store!"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">Higher priority shows first</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Message Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Get 20% off your first order with code WELCOME20!"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buttonText">Button Text</Label>
          <Input
            id="buttonText"
            value={formData.buttonText}
            onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
            placeholder="Got it"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buttonLink">Button Link (optional)</Label>
          <Input
            id="buttonLink"
            value={formData.buttonLink}
            onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
            placeholder="/shop or https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Colour</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              type="color"
              value={formData.backgroundColor}
              onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.backgroundColor}
              onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="textColor">Text Colour</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              type="color"
              value={formData.textColor}
              onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.textColor}
              onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="buttonColor">Button Colour</Label>
          <div className="flex gap-2">
            <Input
              id="buttonColor"
              type="color"
              value={formData.buttonColor}
              onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={formData.buttonColor}
              onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="displayDelay">Display Delay (ms)</Label>
          <Input
            id="displayDelay"
            type="number"
            value={formData.displayDelay}
            onChange={(e) => setFormData({ ...formData, displayDelay: parseInt(e.target.value) || 1000 })}
            placeholder="1000"
          />
          <p className="text-xs text-muted-foreground">How long to wait before showing (1000 = 1 second)</p>
        </div>
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-muted-foreground">Show this popup to visitors</p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showOnce">Show Once</Label>
              <p className="text-xs text-muted-foreground">Only show once per visitor session</p>
            </div>
            <Switch
              id="showOnce"
              checked={formData.showOnce}
              onCheckedChange={(checked) => setFormData({ ...formData, showOnce: checked })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date (optional)</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date (optional)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Pages</Label>
        <p className="text-xs text-muted-foreground mb-2">Select which pages should display this popup</p>
        <div className="flex flex-wrap gap-2">
          {PAGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={formData.targetPages.includes(option.value) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (option.value === "all") {
                  setFormData({ ...formData, targetPages: ["all"] });
                } else {
                  const newPages = formData.targetPages.filter(p => p !== "all");
                  if (formData.targetPages.includes(option.value)) {
                    const filtered = newPages.filter(p => p !== option.value);
                    setFormData({ ...formData, targetPages: filtered.length > 0 ? filtered : ["all"] });
                  } else {
                    setFormData({ ...formData, targetPages: [...newPages, option.value] });
                  }
                }
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg border" style={{ backgroundColor: formData.backgroundColor }}>
        <h4 className="font-semibold mb-2" style={{ color: formData.textColor }}>
          Preview: {formData.title || "Your Title"}
        </h4>
        <p className="text-sm mb-3" style={{ color: formData.textColor }}>
          {formData.content || "Your message content will appear here..."}
        </p>
        <Button 
          type="button" 
          size="sm"
          style={{ backgroundColor: formData.buttonColor, color: '#ffffff' }}
        >
          {formData.buttonText || "Button"}
        </Button>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : popup ? "Update Popup" : "Create Popup"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AdminPopupMessages() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupMessage | null>(null);
  const [deletingPopup, setDeletingPopup] = useState<PopupMessage | null>(null);
  const { toast } = useToast();

  const { data: popups = [], isLoading } = useQuery<PopupMessage[]>({
    queryKey: ["/api/admin/popup-messages"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/popup-messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popup-messages"] });
      toast({
        title: "Popup deleted",
        description: "Popup message has been deleted successfully",
      });
      setDeletingPopup(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete popup message",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest("PATCH", `/api/admin/popup-messages/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popup-messages"] });
      toast({
        title: "Status updated",
        description: "Popup visibility has been updated",
      });
    },
  });

  const isCurrentlyActive = (popup: PopupMessage) => {
    if (!popup.isActive) return false;
    const now = new Date();
    if (popup.startDate && new Date(popup.startDate) > now) return false;
    if (popup.endDate && new Date(popup.endDate) < now) return false;
    return true;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Popup Messages</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage welcome popups that appear when visitors enter your website
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-popup">
              <Plus className="w-4 h-4 mr-2" />
              Create Popup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Popup Message</DialogTitle>
              <DialogDescription>
                Set up a welcome popup that visitors will see when they enter your website
              </DialogDescription>
            </DialogHeader>
            <PopupForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            All Popup Messages
          </CardTitle>
          <CardDescription>
            {popups.length} {popups.length === 1 ? 'popup' : 'popups'} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-muted-foreground">Loading popup messages...</p>
            </div>
          ) : popups.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No popup messages yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first popup to welcome visitors to your website
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Popup
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Pages</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups.map((popup) => (
                  <TableRow key={popup.id}>
                    <TableCell>
                      <div className="font-medium">{popup.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {popup.content}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isCurrentlyActive(popup) ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {popup.showOnce && (
                          <Badge variant="outline" className="text-xs">
                            Once
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(popup.targetPages || ["all"]).map((page) => {
                          const pageOption = PAGE_OPTIONS.find(p => p.value === page);
                          return (
                            <Badge key={page} variant="outline" className="text-xs">
                              {pageOption?.label || page}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{popup.priority || 0}</TableCell>
                    <TableCell>
                      {popup.startDate || popup.endDate ? (
                        <div className="text-sm">
                          {popup.startDate && (
                            <div>From: {format(new Date(popup.startDate), "dd MMM yyyy")}</div>
                          )}
                          {popup.endDate && (
                            <div>To: {format(new Date(popup.endDate), "dd MMM yyyy")}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Always</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(popup.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: popup.id, 
                            isActive: !popup.isActive 
                          })}
                          title={popup.isActive ? "Deactivate" : "Activate"}
                        >
                          {popup.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPopup(popup)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPopup(popup)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingPopup} onOpenChange={(open) => !open && setEditingPopup(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Popup Message</DialogTitle>
            <DialogDescription>
              Update your popup message settings
            </DialogDescription>
          </DialogHeader>
          {editingPopup && (
            <PopupForm 
              popup={editingPopup} 
              onSuccess={() => setEditingPopup(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPopup} onOpenChange={(open) => !open && setDeletingPopup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Popup Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPopup?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPopup && deleteMutation.mutate(deletingPopup.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
