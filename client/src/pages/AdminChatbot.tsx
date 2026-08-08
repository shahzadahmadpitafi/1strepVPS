import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MessageSquare, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

type KnowledgeEntry = {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isActive: boolean;
  priority: number;
  createdAt: string;
};

type UnansweredQuery = {
  id: string;
  question: string;
  userEmail: string;
  userName: string;
  status: string;
  emailSent: boolean;
  createdAt: string;
};

export default function AdminChatbot() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "general",
    tags: "",
    isActive: true,
    priority: 0,
  });

  const { data: knowledge = [], isLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ["/api/chatbot/knowledge"],
  });

  const { data: queries = [] } = useQuery<UnansweredQuery[]>({
    queryKey: ["/api/chatbot/unanswered-queries"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("POST", "/api/chatbot/knowledge", {
        ...data,
        tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/knowledge"] });
      toast({
        title: "Knowledge Added",
        description: "New knowledge entry has been created successfully.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create knowledge entry.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KnowledgeEntry> }) =>
      apiRequest("PATCH", `/api/chatbot/knowledge/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/knowledge"] });
      toast({
        title: "Knowledge Updated",
        description: "Knowledge entry has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingEntry(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update knowledge entry.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/chatbot/knowledge/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/knowledge"] });
      toast({
        title: "Knowledge Deleted",
        description: "Knowledge entry has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete knowledge entry.",
        variant: "destructive",
      });
    },
  });

  const resolveQueryMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/chatbot/unanswered-queries/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/unanswered-queries"] });
      toast({
        title: "Query Resolved",
        description: "Query has been marked as resolved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve query.",
        variant: "destructive",
      });
    },
  });

  const seedKnowledgeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/chatbot/seed-knowledge", {}),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/knowledge"] });
      toast({
        title: "Knowledge Base Seeded",
        description: response.message || `Created ${response.created} entries`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to seed knowledge base.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "general",
      tags: "",
      isActive: true,
      priority: 0,
    });
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      question: entry.question,
      answer: entry.answer,
      category: entry.category,
      tags: entry.tags?.join(", ") || "",
      isActive: entry.isActive,
      priority: entry.priority,
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.question || !formData.answer) {
      toast({
        title: "Missing Information",
        description: "Please provide both question and answer.",
        variant: "destructive",
      });
      return;
    }

    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        data: {
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categories = ["general", "products", "shipping", "returns", "sizing", "orders", "payments"];

  return (
    <div className="p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Chatbot Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Train and manage your AI customer service assistant
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => seedKnowledgeMutation.mutate()}
              disabled={seedKnowledgeMutation.isPending}
              data-testid="button-seed-knowledge"
            >
              {seedKnowledgeMutation.isPending ? "Seeding..." : "Seed Knowledge Base"}
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-knowledge">
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge
            </Button>
          </div>
        </div>

        <Tabs defaultValue="knowledge" className="space-y-6">
          <TabsList>
            <TabsTrigger value="knowledge" data-testid="tab-knowledge">
              Knowledge Base ({knowledge.length})
            </TabsTrigger>
            <TabsTrigger value="queries" data-testid="tab-queries">
              Unanswered Queries ({queries.filter((q) => q.status === "pending").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading knowledge base...</p>
              </div>
            ) : knowledge.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Knowledge Entries Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start training your chatbot by adding Q&A pairs
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Entry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="grid gap-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {knowledge.map((entry) => (
                  <motion.div key={entry.id} variants={staggerItem}>
                    <Card data-testid={`knowledge-entry-${entry.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={entry.isActive ? "default" : "secondary"}>
                                {entry.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">{entry.category}</Badge>
                              {entry.priority > 0 && (
                                <Badge variant="outline">Priority: {entry.priority}</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{entry.question}</CardTitle>
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {entry.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(entry)}
                              data-testid={`button-edit-${entry.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(entry.id)}
                              data-testid={`button-delete-${entry.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {entry.answer}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="queries">
            {queries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    No unanswered queries at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                className="grid gap-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {queries.map((query) => (
                  <motion.div key={query.id} variants={staggerItem}>
                    <Card data-testid={`query-${query.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={query.status === "pending" ? "default" : "secondary"}
                              >
                                {query.status}
                              </Badge>
                              {query.emailSent && (
                                <Badge variant="outline">Email Sent</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{query.question}</CardTitle>
                            <CardDescription className="mt-2">
                              From: {query.userName || "Anonymous"} ({query.userEmail})
                              <br />
                              {new Date(query.createdAt).toLocaleString()}
                            </CardDescription>
                          </div>
                          {query.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => resolveQueryMutation.mutate(query.id)}
                              data-testid={`button-resolve-${query.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingEntry(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-knowledge-form">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Knowledge Entry" : "Add Knowledge Entry"}
            </DialogTitle>
            <DialogDescription>
              Train your chatbot by adding Q&A pairs that it can use to assist customers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="What is your return policy?"
                data-testid="input-question"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="We offer a 30-day return policy for all unused items..."
                rows={6}
                data-testid="textarea-answer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  data-testid="select-category"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority (0-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                  }
                  data-testid="input-priority"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="returns, refunds, exchange"
                data-testid="input-tags"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
                data-testid="checkbox-active"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (chatbot will use this entry)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingEntry(null);
                resetForm();
              }}
              data-testid="button-cancel-form"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-knowledge"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
