import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  File,
  Download,
  Trash2,
  Search,
  Filter,
  CloudUpload,
  Eye,
  ExternalLink,
  Calendar,
  User,
  HardDrive,
  ArrowLeft,
  FolderOpen,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import type { TeamDocument } from "@shared/schema";

const CATEGORIES = [
  { id: "all", label: "All Documents", color: "bg-blue-500" },
  { id: "future-plans", label: "Future Plans", color: "bg-purple-500" },
  { id: "guidelines", label: "Guidelines", color: "bg-green-500" },
  { id: "reports", label: "Reports", color: "bg-amber-500" },
  { id: "images", label: "Images & Media", color: "bg-pink-500" },
  { id: "legal", label: "Legal & Contracts", color: "bg-red-500" },
  { id: "general", label: "General", color: "bg-gray-500" },
];

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return Image;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return FileSpreadsheet;
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return Presentation;
  if (fileType.includes("pdf") || fileType.includes("word") || fileType.includes("document") || fileType.includes("text")) return FileText;
  return File;
}

function getFileTypeLabel(fileType: string): string {
  if (fileType.startsWith("image/")) return "Image";
  if (fileType.includes("pdf")) return "PDF";
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "Spreadsheet";
  if (fileType.includes("csv")) return "CSV";
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "Presentation";
  if (fileType.includes("word") || fileType.includes("document")) return "Document";
  if (fileType.includes("text/plain")) return "Text";
  if (fileType.includes("zip") || fileType.includes("rar")) return "Archive";
  return "File";
}

function getFileTypeColor(fileType: string): string {
  if (fileType.startsWith("image/")) return "bg-pink-500/15 text-pink-400 border-pink-500/20";
  if (fileType.includes("pdf")) return "bg-red-500/15 text-red-400 border-red-500/20";
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv")) return "bg-green-500/15 text-green-400 border-green-500/20";
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  if (fileType.includes("word") || fileType.includes("document")) return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  return "bg-muted text-muted-foreground";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDocuments() {
  const { toast } = useToast();
  const { data: authUser } = useQuery<{ id: string; email: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });
  const isAdmin = authUser?.role === "admin";

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<TeamDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading } = useQuery<TeamDocument[]>({
    queryKey: ["/api/admin/documents", activeCategory],
    queryFn: async () => {
      const url = activeCategory === "all"
        ? "/api/admin/documents"
        : `/api/admin/documents?category=${activeCategory}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Document uploaded successfully" });
      setUploadOpen(false);
      resetUploadForm();
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Document deleted" });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const reseedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/seed-documents");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: `Documents synced — ${data.count} document(s) registered` });
    },
    onError: () => {
      toast({ title: "Sync failed", variant: "destructive" });
    },
  });

  const resetUploadForm = () => {
    setUploadTitle("");
    setUploadDescription("");
    setUploadCategory("general");
    setSelectedFile(null);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadTitle((prev) => prev || file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
    }
  }, []);

  const handleUploadSubmit = () => {
    if (!selectedFile || !uploadTitle.trim()) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", uploadTitle.trim());
    formData.append("description", uploadDescription.trim());
    formData.append("category", uploadCategory);
    uploadMutation.mutate(formData);
  };

  const handleDownload = (doc: TeamDocument) => {
    window.open(`/api/admin/documents/${doc.id}/download`, "_blank");
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q) ||
      doc.fileName.toLowerCase().includes(q) ||
      doc.uploadedByName?.toLowerCase().includes(q)
    );
  });

  const categoryCounts = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/overview">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Team Document Library</h1>
                  <p className="text-sm text-muted-foreground">
                    {documents.length} {documents.length === 1 ? "document" : "documents"} stored
                  </p>
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => reseedMutation.mutate()}
                  disabled={reseedMutation.isPending}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${reseedMutation.isPending ? "animate-spin" : ""}`} />
                  Sync from Storage
                </Button>
                <Button onClick={() => setUploadOpen(true)} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar: Categories */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">Categories</p>
              {CATEGORIES.map((cat) => {
                const count = cat.id === "all" ? documents.length : (categoryCounts[cat.id] || 0);
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors hover-elevate ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Search bar */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents by title, description, or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Results count */}
            {searchQuery && (
              <p className="text-sm text-muted-foreground mb-4">
                {filteredDocuments.length} result{filteredDocuments.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
              </p>
            )}

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-muted rounded-lg" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded mb-2" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                    <div className="h-8 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {searchQuery ? "No results found" : "No documents yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery
                    ? "Try a different search term or clear the filter."
                    : isAdmin
                    ? "Upload your first document using the button above."
                    : "No documents have been uploaded in this category yet."}
                </p>
                {isAdmin && !searchQuery && (
                  <Button className="mt-5 gap-2" onClick={() => setUploadOpen(true)}>
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDocuments.map((doc) => {
                  const IconComp = getFileIcon(doc.fileType);
                  const categoryMeta = CATEGORIES.find((c) => c.id === doc.category);
                  const isImage = doc.fileType.startsWith("image/");

                  return (
                    <div key={doc.id} className="bg-card border border-border rounded-xl overflow-hidden hover-elevate transition-all group">
                      {/* Colour accent bar by category */}
                      <div className={`h-1 ${categoryMeta?.color || "bg-gray-500"}`} />

                      <div className="p-5">
                        {/* File type icon + title */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getFileTypeColor(doc.fileType)} border`}>
                            <IconComp className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                              {doc.title}
                            </h3>
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${getFileTypeColor(doc.fileType)}`}>
                              {getFileTypeLabel(doc.fileType)}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {doc.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                            {doc.description}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(doc.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate">{doc.uploadedByName || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <HardDrive className="h-3 w-3" />
                            <span>{formatFileSize(doc.fileSize)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {(() => {
                            const WEB_GUIDES: Record<string, string> = {
                              "platform-overview.pdf": "/admin/docs/platform-overview",
                              "customer-storefront-guide.pdf": "/admin/docs/customer-storefront",
                              "orders-fulfilment-guide.pdf": "/admin/docs/orders-fulfilment",
                              "products-inventory-guide.pdf": "/admin/docs/products-inventory",
                              "reseller-b2b-licence-guide.pdf": "/admin/docs/reseller-b2b",
                              "influencer-programme-guide.pdf": "/admin/docs/influencer-programme",
                              "crm-marketing-support-guide.pdf": "/admin/docs/crm-marketing",
                              "platform-admin-settings-guide.pdf": "/admin/docs/platform-admin-settings",
                            };
                            const webUrl = WEB_GUIDES[doc.fileName];
                            return webUrl ? (
                              <Link href={webUrl}>
                                <a>
                                  <Button size="sm" variant="outline" className="gap-1.5">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Web Guide
                                  </Button>
                                </a>
                              </Link>
                            ) : null;
                          })()}
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                          {isImage && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setPreviewDoc(doc)}
                              title="Preview image"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setDeleteTarget(doc)}
                              className="text-destructive hover:text-destructive"
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(o) => { setUploadOpen(o); if (!o) resetUploadForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-primary" />
              Upload Document
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drag-and-drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-green-500 bg-green-500/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              {selectedFile ? (
                <div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <File className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="font-medium text-foreground text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatFileSize(selectedFile.size)}</p>
                  <p className="text-xs text-primary mt-2">Click to change file</p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <CloudUpload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground text-sm">Drag and drop a file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">PDF, Word, Excel, PowerPoint, Images, ZIP — max 50 MB</p>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="doc-title"
                placeholder="Document title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-description">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="doc-description"
                placeholder="Brief description of this document..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); resetUploadForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || !uploadTitle.trim() || uploadMutation.isPending}
              className="gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={`/api/admin/documents/${previewDoc.id}/download`}
                alt={previewDoc.title}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
              <Button onClick={() => handleDownload(previewDoc)} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>&quot;{deleteTarget?.title}&quot;</strong> and remove it from storage. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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
