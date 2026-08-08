import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminReferralProgram from "@/components/admin/AdminReferralProgram";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Mail,
  Send,
  CalendarClock,
  Users,
  Target,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Settings,
  Crown,
  Star,
  Zap,
  Gift,
  TrendingUp,
  Clock,
  Eye,
  MousePointerClick,
  UserPlus,
  ShoppingCart,
  RefreshCw,
  Filter,
  Tag,
  Sparkles,
  Copy,
  ArrowLeft,
  FileText,
  CreditCard,
  Download,
  Search,
  Printer,
  Loader2,
  Upload,
  AtSign,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type EmailCampaign = {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  htmlContent: string | null;
  textContent: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  segmentId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpens: number;
  totalClicks: number;
  totalUnsubscribes: number;
  createdAt: string;
};

type CustomerSegment = {
  id: string;
  name: string;
  description: string | null;
  criteria: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  lastRefreshed: string | null;
};

type MarketingAutomation = {
  id: string;
  name: string;
  description: string | null;
  triggerType: 'welcome' | 'abandoned_cart' | 'post_purchase' | 'birthday' | 'win_back' | 'loyalty_upgrade';
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  createdAt: string;
};

type LoyaltyTierBenefit = {
  id: string;
  tier: string;
  discountPercent: number;
  freeShippingThreshold: number | null;
  earlyAccess: boolean;
  exclusiveProducts: boolean;
  birthdayBonus: number;
  pointsMultiplier: number;
  freeReturns: boolean;
  prioritySupport: boolean;
};

type MarketingTag = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  customerCount: number;
};

type WeeklyEmailCfg = {
  enabled: boolean;
  sendDayOfWeek: number;
  sendHour: number;
  newProductsDays: number;
  maxNewProducts: number;
  subjectTemplate: string;
  lastSentAt: string | null;
  lastSentCount: number | null;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  previewText: string | null;
  htmlContent: string;
  textContent: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
};

type LoyaltyReward = {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  rewardType: 'discount_percentage' | 'discount_fixed' | 'free_shipping' | 'free_product' | 'exclusive_access';
  rewardValue: string;
  minTier: string;
  isActive: boolean;
  expiryDays: number | null;
  usageLimit: number | null;
  totalAvailable: number | null;
  totalRedeemed: number;
  imageUrl: string | null;
  createdAt: string;
};

export default function AdminMarketing() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<MarketingAutomation | null>(null);
  const [editingTier, setEditingTier] = useState<LoyaltyTierBenefit | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    fromName: "1stRep",
    fromEmail: "noreply@1strep.com",
    htmlContent: "",
    textContent: "",
    segmentId: "all",
    scheduledAt: "",
  });

  const [segmentForm, setSegmentForm] = useState({
    name: "",
    description: "",
    criteria: {
      minOrders: 0,
      minSpend: 0,
      tier: "any",
      hasOrderedInDays: 0,
      tags: [] as string[],
    },
  });

  const [automationForm, setAutomationForm] = useState({
    name: "",
    description: "",
    triggerType: "welcome" as string,
    delay: 0,
    emailTemplateId: "",
  });

  const [tierForm, setTierForm] = useState({
    tier: "",
    discountPercent: 0,
    freeShippingThreshold: 0,
    earlyAccess: false,
    exclusiveProducts: false,
    birthdayBonus: 0,
    pointsMultiplier: 1,
    freeReturns: false,
    prioritySupport: false,
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    previewText: "",
    htmlContent: "",
    textContent: "",
    category: "general",
  });

  // ── Weekly Email Digest state ────────────────────────────────────────────
  const [weeklyForm, setWeeklyForm] = useState<WeeklyEmailCfg>({
    enabled: false,
    sendDayOfWeek: 2,
    sendHour: 19,
    newProductsDays: 14,
    maxNewProducts: 6,
    subjectTemplate: "Your Weekly 1stRep Update",
    lastSentAt: null,
    lastSentCount: null,
  });
  const [weeklySending, setWeeklySending] = useState(false);
  const [weeklyDirty, setWeeklyDirty] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────

  // Loyalty rewards state
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    pointsCost: 500,
    rewardType: "discount_fixed" as string,
    rewardValue: "5",
    minTier: "bronze",
    isActive: true,
    expiryDays: 30,
    usageLimit: null as number | null,
    totalAvailable: null as number | null,
  });

  // ── Outreach tab state ──────────────────────────────────────────────────────
  const [outreachSubTab, setOutreachSubTab] = useState<"compose" | "broadcast" | "templates">("compose");

  // Compose sub-tab
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeResults, setComposeResults] = useState<Array<{ email: string; status: "sent" | "failed" }> | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  // Broadcast sub-tab
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastRecipients, setBroadcastRecipients] = useState<Array<{ email: string; firstName: string; lastName: string }>>([]);
  const [broadcastCsvError, setBroadcastCsvError] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number; failedAddresses: string[] } | null>(null);
  const [broadcastAppliedTemplateId, setBroadcastAppliedTemplateId] = useState<string | null>(null);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number } | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Save-as-Template modal (shared between Compose + Broadcast)
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [saveAsTemplateName, setSaveAsTemplateName] = useState("");
  const [saveAsTemplateSource, setSaveAsTemplateSource] = useState<"compose" | "broadcast">("compose");

  // Template picker popover (shared)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templatePickerTarget, setTemplatePickerTarget] = useState<"compose" | "broadcast">("compose");

  // Templates sub-tab form/dialog
  const [outreachTemplateForm, setOutreachTemplateForm] = useState({ name: "", subject: "", body: "" });
  const [editingOutreachTemplate, setEditingOutreachTemplate] = useState<{ id: string; name: string; subject: string; body: string } | null>(null);
  const [showOutreachTemplateDialog, setShowOutreachTemplateDialog] = useState(false);

  const sendDirectMutation = useMutation({
    mutationFn: async (data: { recipients: string[]; subject: string; body: string; templateId?: string }) => {
      const res = await apiRequest("POST", "/api/admin/email/send-direct", data);
      return res.json() as Promise<{ sent: number; failed: number; results: Array<{ email: string; status: "sent" | "failed" }> }>;
    },
    onSuccess: (data) => {
      setComposeResults(data.results);
      if (data.failed === 0) {
        toast({ title: "Sent", description: `${data.sent} email${data.sent !== 1 ? "s" : ""} delivered` });
      } else {
        toast({ title: "Partial send", description: `${data.sent} sent, ${data.failed} failed`, variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outreach-log"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to send email", variant: "destructive" }),
  });

  const BROADCAST_BATCH_SIZE = 10;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const runBroadcast = async (opts: {
    recipients: Array<{ email: string; firstName: string; lastName: string }>;
    subject: string;
    body: string;
    templateId?: string;
  }) => {
    setIsBroadcasting(true);
    setBroadcastResult(null);
    setBroadcastProgress({ current: 0, total: opts.recipients.length });
    // Single broadcast ID shared across all batches so history groups correctly
    const broadcastId = crypto.randomUUID();
    const allSent: string[] = [];
    const allFailed: string[] = [];
    const batches: Array<typeof opts.recipients> = [];
    for (let i = 0; i < opts.recipients.length; i += BROADCAST_BATCH_SIZE) {
      batches.push(opts.recipients.slice(i, i + BROADCAST_BATCH_SIZE));
    }
    let processed = 0;
    for (const batch of batches) {
      try {
        const res = await apiRequest("POST", "/api/admin/email/broadcast", {
          recipients: batch,
          subject: opts.subject,
          body: opts.body,
          templateId: opts.templateId,
          broadcastId,
        });
        const data = await res.json() as { sent: number; failed: number; failedAddresses: string[] };
        allSent.push(...Array(data.sent).fill(""));
        allFailed.push(...(data.failedAddresses || []));
      } catch {
        allFailed.push(...batch.map(r => r.email));
      }
      processed += batch.length;
      setBroadcastProgress({ current: processed, total: opts.recipients.length });
    }
    if (opts.templateId) {
      apiRequest("POST", `/api/admin/email/outreach-templates/${opts.templateId}/touch`).catch(() => {});
    }
    queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outreach-log"] });
    setBroadcastResult({ sent: allSent.length, failed: allFailed.length, failedAddresses: allFailed });
    setBroadcastProgress(null);
    setIsBroadcasting(false);
  };

  const createOutreachTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; subject: string; body: string }) =>
      apiRequest("POST", "/api/admin/email/outreach-templates", data),
    onSuccess: () => {
      toast({ title: "Saved", description: "Template created" });
      setShowOutreachTemplateDialog(false);
      setShowSaveAsTemplate(false);
      setSaveAsTemplateName("");
      setOutreachTemplateForm({ name: "", subject: "", body: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outreach-templates"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save template", variant: "destructive" }),
  });

  const updateOutreachTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; subject: string; body: string } }) =>
      apiRequest("PATCH", `/api/admin/email/outreach-templates/${id}`, data),
    onSuccess: () => {
      toast({ title: "Saved", description: "Template updated" });
      setShowOutreachTemplateDialog(false);
      setEditingOutreachTemplate(null);
      setOutreachTemplateForm({ name: "", subject: "", body: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outreach-templates"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update template", variant: "destructive" }),
  });

  const duplicateOutreachTemplateMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/admin/email/outreach-templates/${id}/duplicate`),
    onSuccess: () => {
      toast({ title: "Duplicated", description: "Template copied" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outreach-templates"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to duplicate template", variant: "destructive" }),
  });

  const deleteOutreachTemplateMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/email/outreach-templates/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted", description: "Template removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outreach-templates"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete template", variant: "destructive" }),
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBroadcastCsvError("");
    import("papaparse").then(({ default: Papa }) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,        // auto-detect header row
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
        complete: (result) => {
          const rows = result.data as Record<string, string>[];
          if (!rows.length) {
            // No header row detected — fall back to treating first column as email list
            Papa.parse<string[]>(file, {
              skipEmptyLines: true,
              complete: (r2) => {
                const recipients = (r2.data as string[][])
                  .map(row => (row[0] || "").trim().toLowerCase())
                  .filter(em => EMAIL_REGEX.test(em))
                  .map(em => ({ email: em, firstName: "", lastName: "" }));
                if (!recipients.length) {
                  setBroadcastCsvError("No valid email addresses found in the first column.");
                } else {
                  setBroadcastRecipients(recipients);
                }
              },
            });
            return;
          }
          // Map standard column name variants → normalised keys
          const sample = rows[0];
          const keys = Object.keys(sample);
          const emailKey = keys.find(k => k === "email" || k === "email_address") ?? keys[0];
          const firstKey = keys.find(k => k === "first_name" || k === "firstname" || k === "first");
          const lastKey  = keys.find(k => k === "last_name"  || k === "lastname"  || k === "last");
          const recipients = rows
            .map(row => ({
              email: (row[emailKey] || "").trim().toLowerCase(),
              firstName: firstKey ? (row[firstKey] || "").trim() : "",
              lastName:  lastKey  ? (row[lastKey]  || "").trim() : "",
            }))
            .filter(r => EMAIL_REGEX.test(r.email));
          if (!recipients.length) {
            setBroadcastCsvError("No valid email addresses found. Ensure the file has an 'email' column or emails in the first column.");
            return;
          }
          setBroadcastRecipients(recipients);
        },
        error: () => setBroadcastCsvError("Failed to parse CSV. Please check the file format."),
      });
    });
    e.target.value = "";
  };

  const handleApplyOutreachTemplate = (tpl: { id: string; name: string; subject: string; body: string }, target: "compose" | "broadcast") => {
    if (target === "compose") {
      setComposeSubject(tpl.subject);
      setComposeBody(tpl.body);
      setAppliedTemplateId(tpl.id);
    } else {
      setBroadcastSubject(tpl.subject);
      setBroadcastBody(tpl.body);
      setBroadcastAppliedTemplateId(tpl.id);
    }
    // Touch last_used_at
    apiRequest("POST", `/api/admin/email/outreach-templates/${tpl.id}/touch`).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["/api/admin/email/outreach-templates"] });
    setShowTemplatePicker(false);
    toast({ title: "Template applied", description: `"${tpl.name}" loaded` });
  };
  // ── End outreach state ──────────────────────────────────────────────────────

  // Loyalty card generator state
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    tier: string;
    points: number;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    tier: string;
    points: number;
  } | null>(null);
  const [loyaltyCardSvg, setLoyaltyCardSvg] = useState<string | null>(null);
  const [isLoadingCard, setIsLoadingCard] = useState(false);

  const searchCustomers = async () => {
    if (customerSearch.length < 2) return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Customer search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const generateLoyaltyCard = async (customerId: string) => {
    setIsLoadingCard(true);
    try {
      const response = await fetch(`/api/admin/loyalty-card/${customerId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const svgText = await response.text();
        setLoyaltyCardSvg(svgText);
      }
    } catch (error) {
      console.error("Card generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate loyalty card",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCard(false);
    }
  };

  const downloadLoyaltyCard = (format: 'svg' | 'png') => {
    if (!loyaltyCardSvg || !selectedCustomer) return;
    
    const customerName = `${selectedCustomer.firstName || ''}-${selectedCustomer.lastName || ''}`.trim() || selectedCustomer.email.split('@')[0];
    
    if (format === 'svg') {
      const blob = new Blob([loyaltyCardSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `loyalty-card-${customerName}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      const svgBase64 = btoa(unescape(encodeURIComponent(loyaltyCardSvg)));
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `loyalty-card-${customerName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = `data:image/svg+xml;base64,${svgBase64}`;
    }
    
    toast({
      title: "Downloaded",
      description: `Loyalty card saved as ${format.toUpperCase()}`
    });
  };

  const printLoyaltyCard = () => {
    if (!loyaltyCardSvg) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Loyalty Card</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            ${loyaltyCardSvg}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; email: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== "admin")) {
      setLocation("/");
    }
  }, [authUser, authLoading, setLocation]);

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/admin/campaigns"],
    enabled: authUser?.role === "admin",
  });

  const { data: segments = [], isLoading: segmentsLoading } = useQuery<CustomerSegment[]>({
    queryKey: ["/api/admin/segments"],
    enabled: authUser?.role === "admin",
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    enabled: authUser?.role === "admin",
  });

  const { data: automations = [], isLoading: automationsLoading } = useQuery<MarketingAutomation[]>({
    queryKey: ["/api/admin/automations"],
    enabled: authUser?.role === "admin",
  });

  const { data: tierBenefits = [], isLoading: tierBenefitsLoading } = useQuery<LoyaltyTierBenefit[]>({
    queryKey: ["/api/admin/loyalty-tiers"],
    enabled: authUser?.role === "admin",
  });

  const { data: loyaltyRewards = [], isLoading: rewardsLoading } = useQuery<LoyaltyReward[]>({
    queryKey: ["/api/admin/loyalty/rewards"],
    enabled: authUser?.role === "admin",
  });

  const { data: outreachLog = [], isLoading: outreachLogLoading, refetch: refetchLog } = useQuery<Array<{ id: string; to_email: string; subject: string; status: string; sent_at: string; sent_by_email: string | null; broadcast_id: string | null }>>({
    queryKey: ["/api/admin/email/outreach-log"],
    enabled: authUser?.role === "admin" && activeTab === "outreach",
  });

  const { data: outreachTemplatesList = [], isLoading: outreachTemplatesLoading } = useQuery<Array<{ id: string; name: string; subject: string; body: string; created_at: string }>>({
    queryKey: ["/api/admin/email/outreach-templates"],
    enabled: authUser?.role === "admin" && activeTab === "outreach",
  });

  // ── Weekly Email Digest queries & mutations ──────────────────────────────
  const { data: weeklyConfigData, refetch: refetchWeeklyConfig } = useQuery<WeeklyEmailCfg>({
    queryKey: ["/api/admin/weekly-email/config"],
    enabled: authUser?.role === "admin" && activeTab === "automations",
  });

  useEffect(() => {
    if (weeklyConfigData) {
      setWeeklyForm(weeklyConfigData);
      setWeeklyDirty(false);
    }
  }, [weeklyConfigData]);

  const saveWeeklyConfigMutation = useMutation({
    mutationFn: async (data: WeeklyEmailCfg) =>
      apiRequest("PUT", "/api/admin/weekly-email/config", data),
    onSuccess: () => {
      toast({ title: "Saved", description: "Weekly digest settings saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/weekly-email/config"] });
      setWeeklyDirty(false);
    },
    onError: () => toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" }),
  });
  // ─────────────────────────────────────────────────────────────────────────

  const createRewardMutation = useMutation({
    mutationFn: async (data: typeof rewardForm) => {
      return apiRequest("POST", "/api/admin/loyalty/rewards", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Reward created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty/rewards"] });
      setShowRewardDialog(false);
      resetRewardForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create reward", variant: "destructive" });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof rewardForm }) => {
      return apiRequest("PATCH", `/api/admin/loyalty/rewards/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Reward updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty/rewards"] });
      setShowRewardDialog(false);
      setEditingReward(null);
      resetRewardForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update reward", variant: "destructive" });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/loyalty/rewards/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Reward deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty/rewards"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete reward", variant: "destructive" });
    },
  });

  const resetRewardForm = () => {
    setRewardForm({
      name: "",
      description: "",
      pointsCost: 500,
      rewardType: "discount_fixed",
      rewardValue: "5",
      minTier: "bronze",
      isActive: true,
      expiryDays: 30,
      usageLimit: null,
      totalAvailable: null,
    });
  };

  const openEditReward = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      minTier: reward.minTier,
      isActive: reward.isActive,
      expiryDays: reward.expiryDays || 30,
      usageLimit: reward.usageLimit,
      totalAvailable: reward.totalAvailable,
    });
    setShowRewardDialog(true);
  };

  const handleSaveReward = () => {
    if (editingReward) {
      updateRewardMutation.mutate({ id: editingReward.id, data: rewardForm });
    } else {
      createRewardMutation.mutate(rewardForm);
    }
  };

  const { data: marketingTags = [] } = useQuery<MarketingTag[]>({
    queryKey: ["/api/admin/marketing-tags"],
    enabled: authUser?.role === "admin",
  });

  const { data: dashboardStats } = useQuery<{
    totalSubscribers: number;
    totalCampaignsSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    totalAutomationsActive: number;
    recentCampaignPerformance: { date: string; opens: number; clicks: number }[];
  }>({
    queryKey: ["/api/admin/marketing/dashboard"],
    enabled: authUser?.role === "admin",
  });

  const { data: referralStats } = useQuery<{
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalRewardsEarned: number;
  }>({
    queryKey: ["/api/admin/referral-stats"],
    enabled: authUser?.role === "admin",
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof campaignForm) => {
      return apiRequest("POST", "/api/admin/campaigns", data);
    },
    onSuccess: () => {
      toast({ title: "Campaign created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setShowCampaignDialog(false);
      resetCampaignForm();
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof campaignForm> }) => {
      return apiRequest("PATCH", `/api/admin/campaigns/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Campaign updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setShowCampaignDialog(false);
      setEditingCampaign(null);
      resetCampaignForm();
    },
    onError: () => {
      toast({ title: "Failed to update campaign", variant: "destructive" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/campaigns/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Campaign deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
    },
    onError: () => {
      toast({ title: "Failed to delete campaign", variant: "destructive" });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/campaigns/${id}/send`);
    },
    onSuccess: () => {
      toast({ title: "Campaign is being sent" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
    },
    onError: () => {
      toast({ title: "Failed to send campaign", variant: "destructive" });
    },
  });

  const createSegmentMutation = useMutation({
    mutationFn: async (data: typeof segmentForm) => {
      return apiRequest("POST", "/api/admin/segments", {
        name: data.name,
        description: data.description,
        criteria: JSON.stringify(data.criteria),
      });
    },
    onSuccess: () => {
      toast({ title: "Segment created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/segments"] });
      setShowSegmentDialog(false);
      resetSegmentForm();
    },
    onError: () => {
      toast({ title: "Failed to create segment", variant: "destructive" });
    },
  });

  const refreshSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/segments/${id}/refresh`);
    },
    onSuccess: () => {
      toast({ title: "Segment refreshed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/segments"] });
    },
    onError: () => {
      toast({ title: "Failed to refresh segment", variant: "destructive" });
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/segments/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Segment deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/segments"] });
    },
    onError: () => {
      toast({ title: "Failed to delete segment", variant: "destructive" });
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (data: typeof automationForm) => {
      return apiRequest("POST", "/api/admin/automations", data);
    },
    onSuccess: () => {
      toast({ title: "Automation created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automations"] });
      setShowAutomationDialog(false);
      resetAutomationForm();
    },
    onError: () => {
      toast({ title: "Failed to create automation", variant: "destructive" });
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/automations/${id}`, { isActive });
    },
    onSuccess: () => {
      toast({ title: "Automation updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/automations"] });
    },
    onError: () => {
      toast({ title: "Failed to update automation", variant: "destructive" });
    },
  });

  const upsertTierBenefitsMutation = useMutation({
    mutationFn: async (data: typeof tierForm) => {
      return apiRequest("POST", "/api/admin/loyalty-tiers", data);
    },
    onSuccess: () => {
      toast({ title: "Tier benefits saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/loyalty-tiers"] });
      setShowTierDialog(false);
      setEditingTier(null);
    },
    onError: () => {
      toast({ title: "Failed to save tier benefits", variant: "destructive" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      return apiRequest("POST", "/api/admin/email-templates", data);
    },
    onSuccess: () => {
      toast({ title: "Template created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setShowTemplateDialog(false);
      resetTemplateForm();
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof templateForm }) => {
      return apiRequest("PATCH", `/api/admin/email-templates/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Template updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      resetTemplateForm();
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    },
  });

  const resetCampaignForm = () => {
    setCampaignForm({
      name: "",
      subject: "",
      fromName: "1stRep",
      fromEmail: "noreply@1strep.com",
      htmlContent: "",
      textContent: "",
      segmentId: "all",
      scheduledAt: "",
    });
    setEditingCampaign(null);
  };

  const resetSegmentForm = () => {
    setSegmentForm({
      name: "",
      description: "",
      criteria: {
        minOrders: 0,
        minSpend: 0,
        tier: "any",
        hasOrderedInDays: 0,
        tags: [],
      },
    });
    setEditingSegment(null);
  };

  const resetAutomationForm = () => {
    setAutomationForm({
      name: "",
      description: "",
      triggerType: "welcome",
      delay: 0,
      emailTemplateId: "",
    });
    setEditingAutomation(null);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      subject: "",
      previewText: "",
      htmlContent: "",
      textContent: "",
      category: "general",
    });
    setEditingTemplate(null);
  };

  const openEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      previewText: template.previewText || "",
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      category: template.category,
    });
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const openEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      subject: campaign.subject,
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail,
      htmlContent: campaign.htmlContent || "",
      textContent: campaign.textContent || "",
      segmentId: campaign.segmentId || "all",
      scheduledAt: campaign.scheduledAt || "",
    });
    setShowCampaignDialog(true);
  };

  const openEditTier = (tier: LoyaltyTierBenefit) => {
    setEditingTier(tier);
    setTierForm({
      tier: tier.tier,
      discountPercent: tier.discountPercent,
      freeShippingThreshold: tier.freeShippingThreshold || 0,
      earlyAccess: tier.earlyAccess,
      exclusiveProducts: tier.exclusiveProducts,
      birthdayBonus: tier.birthdayBonus,
      pointsMultiplier: tier.pointsMultiplier,
      freeReturns: tier.freeReturns,
      prioritySupport: tier.prioritySupport,
    });
    setShowTierDialog(true);
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-amber-700 text-white';
      case 'silver': return 'bg-slate-400 text-white';
      case 'gold': return 'bg-yellow-500 text-black';
      case 'platinum': return 'bg-slate-700 text-white';
      case 'vip': return 'bg-purple-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAutomationTriggerIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <UserPlus className="h-4 w-4" />;
      case 'abandoned_cart': return <ShoppingCart className="h-4 w-4" />;
      case 'post_purchase': return <Gift className="h-4 w-4" />;
      case 'birthday': return <Sparkles className="h-4 w-4" />;
      case 'win_back': return <RefreshCw className="h-4 w-4" />;
      case 'loyalty_upgrade': return <Crown className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'VIP'];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Marketing & CRM</h1>
              <p className="text-muted-foreground">Comprehensive customer engagement platform</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { resetCampaignForm(); setShowCampaignDialog(true); }} data-testid="button-quick-campaign">
              <Mail className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("segments")} data-testid="button-quick-segment">
              <Target className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden" data-testid="card-total-subscribers">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                  <p className="text-3xl font-bold mt-1" data-testid="text-subscribers-count">{dashboardStats?.totalSubscribers?.toLocaleString() || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">+12% this month</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden" data-testid="card-campaigns-sent">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaigns Sent</p>
                  <p className="text-3xl font-bold mt-1" data-testid="text-campaigns-count">{dashboardStats?.totalCampaignsSent || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{campaigns.filter(c => c.status === 'draft').length} drafts</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Send className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden" data-testid="card-open-rate">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Open Rate</p>
                  <p className="text-3xl font-bold mt-1" data-testid="text-open-rate">{(dashboardStats?.avgOpenRate || 0).toFixed(1)}%</p>
                  <Progress value={dashboardStats?.avgOpenRate || 0} className="h-1.5 mt-2 w-24" />
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden" data-testid="card-click-rate">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Click Rate</p>
                  <p className="text-3xl font-bold mt-1" data-testid="text-click-rate">{(dashboardStats?.avgClickRate || 0).toFixed(1)}%</p>
                  <Progress value={(dashboardStats?.avgClickRate || 0) * 2} className="h-1.5 mt-2 w-24" />
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card data-testid="card-active-automations">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold" data-testid="text-automations-count">{automations.filter(a => a.isActive).length}</p>
                  <p className="text-xs text-muted-foreground">Active Automations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-customer-segments">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xl font-bold" data-testid="text-segments-count">{segments.length}</p>
                  <p className="text-xs text-muted-foreground">Customer Segments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-email-templates">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-xl font-bold" data-testid="text-templates-count">{templates.length}</p>
                  <p className="text-xs text-muted-foreground">Email Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-loyalty-tiers">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-bold" data-testid="text-tiers-count">{tierBenefits.length}</p>
                  <p className="text-xs text-muted-foreground">Loyalty Tiers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-total-referrals">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-xl font-bold" data-testid="text-referrals-count">{referralStats?.totalReferrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 md:grid-cols-9 gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2" data-testid="tab-campaigns">
              <Mail className="h-4 w-4" />
              <span className="hidden md:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-templates">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="segments" className="flex items-center gap-2" data-testid="tab-segments">
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Segments</span>
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2" data-testid="tab-automations">
              <Zap className="h-4 w-4" />
              <span className="hidden md:inline">Automations</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2" data-testid="tab-loyalty">
              <Crown className="h-4 w-4" />
              <span className="hidden md:inline">Loyalty</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2" data-testid="tab-referrals">
              <Gift className="h-4 w-4" />
              <span className="hidden md:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="outreach" className="flex items-center gap-2" data-testid="tab-outreach">
              <AtSign className="h-4 w-4" />
              <span className="hidden md:inline">Outreach</span>
            </TabsTrigger>
          </TabsList>

          {/* Comprehensive Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Getting Started Guide - Show when marketing is empty */}
            {campaigns.length === 0 && automations.length === 0 && segments.length === 0 && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Getting Started with Marketing
                  </CardTitle>
                  <CardDescription>
                    Welcome to your marketing hub! Here's how to make the most of your marketing tools.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-background border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Target className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">1. Create Segments</h4>
                          <p className="text-xs text-muted-foreground">Group your customers</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Start by creating customer segments based on purchase behaviour, VIP status, or location. This helps you send targeted messages.
                      </p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("segments")}>
                        <Plus className="h-3 w-3 mr-2" />
                        Create First Segment
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-background border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">2. Build Templates</h4>
                          <p className="text-xs text-muted-foreground">Design reusable emails</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create email templates for common messages like welcome emails, promotions, and newsletters. Templates save time and ensure consistency.
                      </p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("templates")}>
                        <Plus className="h-3 w-3 mr-2" />
                        Create Template
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-background border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">3. Launch Campaigns</h4>
                          <p className="text-xs text-muted-foreground">Send targeted emails</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create email campaigns to engage customers. Schedule campaigns in advance or send immediately. Track opens and clicks.
                      </p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => { resetCampaignForm(); setShowCampaignDialog(true); }}>
                        <Plus className="h-3 w-3 mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Automation Ideas
                    </h4>
                    <div className="grid md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">Welcome Series</p>
                        <p className="text-xs text-muted-foreground">Send a welcome email when new customers register</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">Abandoned Cart</p>
                        <p className="text-xs text-muted-foreground">Remind customers about items left in their cart</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">Win-Back Campaign</p>
                        <p className="text-xs text-muted-foreground">Re-engage customers who haven't purchased recently</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p className="font-medium">VIP Rewards</p>
                        <p className="text-xs text-muted-foreground">Thank your best customers with exclusive offers</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marketing Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Marketing Funnel Performance
                </CardTitle>
                <CardDescription>Track your customer journey from awareness to conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Funnel Visualization */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20" data-testid="funnel-subscribers">
                      <div className="h-12 w-12 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-total-subscribers">{dashboardStats?.totalSubscribers?.toLocaleString() || 0}</p>
                      <p className="text-sm text-muted-foreground">Subscribers</p>
                      <p className="text-xs text-blue-500 mt-1">100%</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20" data-testid="funnel-opens">
                      <div className="h-12 w-12 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                        <Eye className="h-6 w-6 text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-total-opens">{campaigns.reduce((sum, c) => sum + c.totalOpens, 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Email Opens</p>
                      <p className="text-xs text-purple-500 mt-1">{(dashboardStats?.avgOpenRate || 0).toFixed(1)}% rate</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20" data-testid="funnel-clicks">
                      <div className="h-12 w-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                        <MousePointerClick className="h-6 w-6 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-total-clicks">{campaigns.reduce((sum, c) => sum + c.totalClicks, 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Click-throughs</p>
                      <p className="text-xs text-green-500 mt-1">{(dashboardStats?.avgClickRate || 0).toFixed(1)}% rate</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/20" data-testid="funnel-segments">
                      <div className="h-12 w-12 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                        <Crown className="h-6 w-6 text-amber-500" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="text-segmented-customers">{segments.reduce((sum, s) => sum + (s.memberCount || 0), 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Segmented Customers</p>
                      <p className="text-xs text-amber-500 mt-1">Targeted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights Row */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Top Performing Campaigns */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Top Performing Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {campaigns.filter(c => c.status === 'sent').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No sent campaigns yet</p>
                  ) : (
                    <div className="space-y-3">
                      {campaigns
                        .filter(c => c.status === 'sent' && c.totalSent > 0)
                        .sort((a, b) => (b.totalOpens / b.totalSent) - (a.totalOpens / a.totalSent))
                        .slice(0, 3)
                        .map((campaign, i) => (
                          <div key={campaign.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{campaign.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {((campaign.totalOpens / campaign.totalSent) * 100).toFixed(1)}% open rate
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Automations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Active Automations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {automations.filter(a => a.isActive).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No active automations</p>
                  ) : (
                    <div className="space-y-3">
                      {automations.filter(a => a.isActive).slice(0, 4).map((automation) => (
                        <div key={automation.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getAutomationTriggerIcon(automation.triggerType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{automation.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {automation.triggerType.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Segment Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    Customer Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {segments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No segments created</p>
                  ) : (
                    <div className="space-y-3">
                      {segments.slice(0, 4).map((segment) => (
                        <div key={segment.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-sm font-medium truncate max-w-[120px]">{segment.name}</span>
                          </div>
                          <Badge variant="secondary" data-testid={`badge-segment-count-${segment.id}`}>{segment.memberCount || 0} customers</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No campaigns yet</p>
                  ) : (
                    <div className="space-y-3">
                      {campaigns.slice(0, 5).map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{campaign.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge className={getCampaignStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => { resetCampaignForm(); setShowCampaignDialog(true); }}>
                      <Mail className="h-5 w-5" />
                      <span className="text-xs">New Campaign</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("segments")}>
                      <Target className="h-5 w-5" />
                      <span className="text-xs">Create Segment</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("automations")}>
                      <Zap className="h-5 w-5" />
                      <span className="text-xs">New Automation</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("templates")}>
                      <FileText className="h-5 w-5" />
                      <span className="text-xs">Email Template</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("loyalty")}>
                      <Crown className="h-5 w-5" />
                      <span className="text-xs">Loyalty Tiers</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("referrals")}>
                      <Gift className="h-5 w-5" />
                      <span className="text-xs">Referral Program</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Marketing Tips & Best Practices */}
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Marketing Tips & Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Mail className="h-3 w-3 text-blue-500" />
                      Email Subject Lines
                    </h5>
                    <p className="text-xs text-muted-foreground">Keep subject lines under 50 characters. Use personalisation and create urgency to boost open rates.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Clock className="h-3 w-3 text-purple-500" />
                      Timing Matters
                    </h5>
                    <p className="text-xs text-muted-foreground">Send emails Tuesday-Thursday between 10am-2pm for best engagement. Avoid weekends for B2B.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Target className="h-3 w-3 text-green-500" />
                      Segmentation
                    </h5>
                    <p className="text-xs text-muted-foreground">Segmented campaigns get 14% higher open rates. Target customers by behaviour, not just demographics.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h5 className="font-medium text-sm mb-1 flex items-center gap-2">
                      <Zap className="h-3 w-3 text-amber-500" />
                      Automation ROI
                    </h5>
                    <p className="text-xs text-muted-foreground">Automated emails generate 320% more revenue than non-automated. Start with welcome series and abandoned cart.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Email Campaigns</CardTitle>
                  <CardDescription>Create and manage marketing email campaigns</CardDescription>
                </div>
                <Button onClick={() => { resetCampaignForm(); setShowCampaignDialog(true); }} data-testid="button-create-campaign">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first email campaign to engage with customers</p>
                    <Button onClick={() => setShowCampaignDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Recipients</TableHead>
                        <TableHead className="hidden md:table-cell">Performance</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCampaignStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {campaign.totalRecipients > 0 ? (
                              <span>{campaign.totalSent}/{campaign.totalRecipients}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {campaign.status === 'sent' && campaign.totalSent > 0 ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {((campaign.totalOpens / campaign.totalSent) * 100).toFixed(1)}%
                                </span>
                                <span className="flex items-center gap-1">
                                  <MousePointerClick className="h-3 w-3" />
                                  {((campaign.totalClicks / campaign.totalSent) * 100).toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {campaign.status === 'draft' && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openEditCampaign(campaign)}
                                    data-testid={`button-edit-campaign-${campaign.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => sendCampaignMutation.mutate(campaign.id)}
                                    data-testid={`button-send-campaign-${campaign.id}`}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                                data-testid={`button-delete-campaign-${campaign.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
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
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>Reusable email templates for campaigns and automations</CardDescription>
                </div>
                <Button onClick={() => { resetTemplateForm(); setShowTemplateDialog(true); }} data-testid="button-create-template">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                    <p className="text-muted-foreground mb-4">Create reusable email templates for your campaigns</p>
                    <Button onClick={() => { resetTemplateForm(); setShowTemplateDialog(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border rounded-md p-6 hover-elevate cursor-pointer"
                        onClick={() => openEditTemplate(template)}
                        data-testid={`card-template-${template.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-xs text-muted-foreground">{template.category}</p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this template?')) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm font-medium mb-1">{template.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.previewText || "No preview text"}
                        </p>
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>Created {format(new Date(template.createdAt), "MMM d, yyyy")}</span>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Customer Segments</CardTitle>
                  <CardDescription>Create targeted customer groups for personalised marketing</CardDescription>
                </div>
                <Button onClick={() => { resetSegmentForm(); setShowSegmentDialog(true); }} data-testid="button-create-segment">
                  <Plus className="h-4 w-4 mr-2" />
                  New Segment
                </Button>
              </CardHeader>
              <CardContent>
                {segmentsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : segments.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No segments yet</h3>
                    <p className="text-muted-foreground mb-4">Create segments to target specific customer groups</p>
                    <Button onClick={() => setShowSegmentDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Segment
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {segments.map((segment) => (
                      <Card key={segment.id} className="hover-elevate">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">{segment.name}</h3>
                              <p className="text-sm text-muted-foreground">{segment.description || "No description"}</p>
                            </div>
                            <Badge variant={segment.isActive ? "default" : "secondary"}>
                              {segment.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {segment.memberCount || 0} members
                            </span>
                            {segment.lastRefreshed && (
                              <span className="text-muted-foreground">
                                Updated {formatDistanceToNow(new Date(segment.lastRefreshed), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => refreshSegmentMutation.mutate(segment.id)}
                              data-testid={`button-refresh-segment-${segment.id}`}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Refresh
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSegmentMutation.mutate(segment.id)}
                              data-testid={`button-delete-segment-${segment.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automations" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>Marketing Automations</CardTitle>
                  <CardDescription>Set up automated email workflows to engage customers</CardDescription>
                </div>
                <Button onClick={() => { resetAutomationForm(); setShowAutomationDialog(true); }} data-testid="button-create-automation">
                  <Plus className="h-4 w-4 mr-2" />
                  New Automation
                </Button>
              </CardHeader>
              <CardContent>
                {automationsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : automations.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
                    <p className="text-muted-foreground mb-4">Create automated workflows to nurture customers</p>
                    <Button onClick={() => setShowAutomationDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Automation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {automations.map((automation) => (
                      <div key={automation.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-muted">
                            {getAutomationTriggerIcon(automation.triggerType)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{automation.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {automation.description || `Triggered by: ${automation.triggerType.replace('_', ' ')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <p className="text-sm font-medium">{automation.totalEnrolled} enrolled</p>
                            <p className="text-sm text-muted-foreground">{automation.totalCompleted} completed</p>
                          </div>
                          <Switch
                            checked={automation.isActive}
                            onCheckedChange={(isActive) => toggleAutomationMutation.mutate({ id: automation.id, isActive })}
                            data-testid={`switch-automation-${automation.id}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover-elevate cursor-pointer" onClick={() => {
                setAutomationForm({ ...automationForm, name: "Welcome Series", triggerType: "welcome" });
                setShowAutomationDialog(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                      <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold">Welcome Series</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Greet new subscribers with a warm welcome sequence</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate cursor-pointer" onClick={() => {
                setAutomationForm({ ...automationForm, name: "Abandoned Cart Recovery", triggerType: "abandoned_cart" });
                setShowAutomationDialog(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                      <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-semibold">Abandoned Cart</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Recover lost sales with cart reminder emails</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate cursor-pointer" onClick={() => {
                setAutomationForm({ ...automationForm, name: "Win-Back Campaign", triggerType: "win_back" });
                setShowAutomationDialog(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                      <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold">Win-Back</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Re-engage inactive customers with special offers</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Weekly Email Digest ─────────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                      <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Weekly Customer Email Digest</CardTitle>
                      <CardDescription className="text-sm">
                        Automatically emails all customers a digest featuring the top product of the week and newly added items.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{weeklyForm.enabled ? "Enabled" : "Disabled"}</span>
                    <Switch
                      checked={weeklyForm.enabled}
                      onCheckedChange={(v) => { setWeeklyForm(f => ({ ...f, enabled: v })); setWeeklyDirty(true); }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>Send day</Label>
                    <Select
                      value={String(weeklyForm.sendDayOfWeek)}
                      onValueChange={(v) => { setWeeklyForm(f => ({ ...f, sendDayOfWeek: parseInt(v) })); setWeeklyDirty(true); }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d,i) => (
                          <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Send hour (UK time)</Label>
                    <Select
                      value={String(weeklyForm.sendHour)}
                      onValueChange={(v) => { setWeeklyForm(f => ({ ...f, sendHour: parseInt(v) })); setWeeklyDirty(true); }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, h) => (
                          <SelectItem key={h} value={String(h)}>
                            {String(h).padStart(2,"0")}:00 {h < 12 ? "AM" : "PM"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>New products window (days)</Label>
                    <Input
                      type="number" min={1} max={90}
                      value={weeklyForm.newProductsDays}
                      onChange={(e) => { setWeeklyForm(f => ({ ...f, newProductsDays: parseInt(e.target.value) || 14 })); setWeeklyDirty(true); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max new products shown</Label>
                    <Input
                      type="number" min={1} max={12}
                      value={weeklyForm.maxNewProducts}
                      onChange={(e) => { setWeeklyForm(f => ({ ...f, maxNewProducts: parseInt(e.target.value) || 6 })); setWeeklyDirty(true); }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email subject line</Label>
                  <Input
                    value={weeklyForm.subjectTemplate}
                    onChange={(e) => { setWeeklyForm(f => ({ ...f, subjectTemplate: e.target.value })); setWeeklyDirty(true); }}
                    placeholder="Your Weekly 1stRep Update"
                    maxLength={200}
                  />
                </div>

                {weeklyForm.lastSentAt && (
                  <p className="text-sm text-muted-foreground">
                    Last sent: {format(new Date(weeklyForm.lastSentAt), "EEE d MMM yyyy 'at' HH:mm")}
                    {weeklyForm.lastSentCount != null && ` — ${weeklyForm.lastSentCount} recipient${weeklyForm.lastSentCount !== 1 ? "s" : ""}`}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!weeklyDirty || saveWeeklyConfigMutation.isPending}
                    onClick={() => saveWeeklyConfigMutation.mutate(weeklyForm)}
                  >
                    {saveWeeklyConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Settings
                  </Button>
                  <Button
                    variant="outline"
                    disabled={weeklySending}
                    onClick={async () => {
                      setWeeklySending(true);
                      try {
                        const r = await apiRequest("POST", "/api/admin/weekly-email/send-now");
                        const data = await r.json();
                        toast({
                          title: "Weekly digest sent",
                          description: `Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.failed ? ` (${data.failed} failed)` : ""}.`,
                        });
                        refetchWeeklyConfig();
                      } catch {
                        toast({ title: "Error", description: "Failed to send digest.", variant: "destructive" });
                      } finally {
                        setWeeklySending(false);
                      }
                    }}
                  >
                    {weeklySending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open("/api/admin/weekly-email/preview", "_blank")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Email
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* ──────────────────────────────────────────────────────────────── */}
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Loyalty Tier Benefits
                </CardTitle>
                <CardDescription>Configure benefits and rewards for each loyalty tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {tiers.map((tierName) => {
                    const benefit = tierBenefits.find(b => b.tier.toLowerCase() === tierName.toLowerCase());
                    return (
                      <Card key={tierName} className="hover-elevate">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge className={getTierColor(tierName)}>
                              {tierName === 'VIP' && <Crown className="h-3 w-3 mr-1" />}
                              {tierName}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditTier(benefit || {
                                id: '',
                                tier: tierName,
                                discountPercent: 0,
                                freeShippingThreshold: null,
                                earlyAccess: false,
                                exclusiveProducts: false,
                                birthdayBonus: 0,
                                pointsMultiplier: 1,
                                freeReturns: false,
                                prioritySupport: false,
                              })}
                              data-testid={`button-edit-tier-${tierName}`}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                          {benefit ? (
                            <div className="space-y-2 text-sm">
                              {benefit.discountPercent > 0 && (
                                <div className="flex items-center gap-2">
                                  <Tag className="h-3 w-3 text-green-500" />
                                  <span>{benefit.discountPercent}% discount</span>
                                </div>
                              )}
                              {benefit.freeShippingThreshold !== null && (
                                <div className="flex items-center gap-2">
                                  <Gift className="h-3 w-3 text-blue-500" />
                                  <span>Free shipping over £{benefit.freeShippingThreshold}</span>
                                </div>
                              )}
                              {benefit.pointsMultiplier > 1 && (
                                <div className="flex items-center gap-2">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span>{benefit.pointsMultiplier}x points</span>
                                </div>
                              )}
                              {benefit.earlyAccess && (
                                <div className="flex items-center gap-2">
                                  <Zap className="h-3 w-3 text-purple-500" />
                                  <span>Early access</span>
                                </div>
                              )}
                              {benefit.prioritySupport && (
                                <div className="flex items-center gap-2">
                                  <Crown className="h-3 w-3 text-amber-500" />
                                  <span>Priority support</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No benefits configured</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Tier Point Thresholds</h3>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="text-center p-4 border rounded-lg">
                      <Badge className={getTierColor('Bronze')}>Bronze</Badge>
                      <p className="mt-2 font-medium">0 - 999</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Badge className={getTierColor('Silver')}>Silver</Badge>
                      <p className="mt-2 font-medium">1,000 - 2,499</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Badge className={getTierColor('Gold')}>Gold</Badge>
                      <p className="mt-2 font-medium">2,500 - 4,999</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Badge className={getTierColor('Platinum')}>Platinum</Badge>
                      <p className="mt-2 font-medium">5,000 - 9,999</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Badge className={getTierColor('VIP')}>
                        <Crown className="h-3 w-3 mr-1" />
                        VIP
                      </Badge>
                      <p className="mt-2 font-medium">10,000+</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Card Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Loyalty Card Generator
                </CardTitle>
                <CardDescription>
                  Generate printable loyalty cards with scannable barcodes for customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Customer Search */}
                  <div className="space-y-4">
                    <div>
                      <Label>Search Customer</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="Search by name or email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
                          data-testid="input-customer-search"
                        />
                        <Button 
                          onClick={searchCustomers} 
                          disabled={isSearching || customerSearch.length < 2}
                          data-testid="button-search-customers"
                        >
                          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {searchResults.map((customer) => (
                          <div
                            key={customer.id}
                            className={`p-3 cursor-pointer border-b last:border-b-0 hover-elevate ${
                              selectedCustomer?.id === customer.id ? 'bg-accent' : ''
                            }`}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              generateLoyaltyCard(customer.id);
                            }}
                            data-testid={`customer-result-${customer.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {customer.firstName || customer.lastName 
                                    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                                    : customer.email.split('@')[0]}
                                </p>
                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={getTierColor(customer.tier)}>{customer.tier}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">{customer.points.toLocaleString()} pts</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedCustomer && (
                      <div className="p-4 border rounded-lg bg-accent/50">
                        <p className="text-sm text-muted-foreground">Selected Customer</p>
                        <p className="font-medium">
                          {selectedCustomer.firstName || selectedCustomer.lastName 
                            ? `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim()
                            : selectedCustomer.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTierColor(selectedCustomer.tier)}>{selectedCustomer.tier}</Badge>
                          <span className="text-sm text-muted-foreground">{selectedCustomer.points.toLocaleString()} points</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Preview */}
                  <div className="space-y-4">
                    <Label>Card Preview</Label>
                    <div className="border rounded-lg p-4 bg-muted/50 min-h-[280px] flex items-center justify-center">
                      {isLoadingCard ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Generating card...</p>
                        </div>
                      ) : loyaltyCardSvg ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: loyaltyCardSvg }} 
                          className="max-w-full"
                          data-testid="loyalty-card-preview"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Search and select a customer to generate their loyalty card</p>
                        </div>
                      )}
                    </div>

                    {loyaltyCardSvg && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => downloadLoyaltyCard('svg')}
                          className="flex-1"
                          data-testid="button-download-svg"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          SVG
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => downloadLoyaltyCard('png')}
                          className="flex-1"
                          data-testid="button-download-png"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PNG
                        </Button>
                        <Button 
                          onClick={printLoyaltyCard}
                          className="flex-1"
                          data-testid="button-print-card"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Barcode Scanning at EPOS</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Printed loyalty cards can be scanned at the EPOS checkout to automatically look up the customer 
                    and apply their loyalty tier benefits. The barcode contains a unique identifier for each member.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Rewards Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Loyalty Rewards
                    </CardTitle>
                    <CardDescription>Create rewards that customers can redeem with their loyalty points</CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      resetRewardForm();
                      setEditingReward(null);
                      setShowRewardDialog(true);
                    }}
                    data-testid="button-add-reward"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reward
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rewardsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : loyaltyRewards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rewards created yet</p>
                    <p className="text-sm">Create rewards that customers can redeem with their loyalty points</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reward</TableHead>
                        <TableHead>Points Cost</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Min Tier</TableHead>
                        <TableHead>Redeemed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loyaltyRewards.map((reward) => (
                        <TableRow key={reward.id} data-testid={`row-reward-${reward.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reward.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{reward.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{reward.pointsCost.toLocaleString()} pts</Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {reward.rewardType.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell>
                            {reward.rewardType === 'discount_percentage' ? `${reward.rewardValue}%` :
                             reward.rewardType === 'discount_fixed' ? `£${reward.rewardValue}` :
                             reward.rewardType === 'free_shipping' ? 'Free' :
                             reward.rewardValue}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTierColor(reward.minTier)}>{reward.minTier}</Badge>
                          </TableCell>
                          <TableCell>{reward.totalRedeemed}</TableCell>
                          <TableCell>
                            <Badge variant={reward.isActive ? "default" : "secondary"}>
                              {reward.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => openEditReward(reward)}
                                data-testid={`button-edit-reward-${reward.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => deleteRewardMutation.mutate(reward.id)}
                                data-testid={`button-delete-reward-${reward.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">How Points Value Works</h4>
                  <p className="text-sm text-muted-foreground">
                    The value of loyalty points is determined by the rewards you create. For example, if you create a "£5 Off" reward that costs 500 points, the effective value is 100 points = £1. You control the value by setting the points cost for each reward.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <AdminReferralProgram />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + c.totalSent, 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Emails Sent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                      <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {campaigns.length > 0
                          ? (campaigns.reduce((sum, c) => sum + c.totalOpens, 0) / Math.max(campaigns.reduce((sum, c) => sum + c.totalSent, 0), 1) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                      <MousePointerClick className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {campaigns.length > 0
                          ? (campaigns.reduce((sum, c) => sum + c.totalClicks, 0) / Math.max(campaigns.reduce((sum, c) => sum + c.totalSent, 0), 1) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                      <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{automations.filter(a => a.isActive).length}/{automations.length}</p>
                      <p className="text-sm text-muted-foreground">Active Automations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Opens and clicks by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.filter(c => c.status === 'sent').length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No campaign data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={campaigns.filter(c => c.status === 'sent').slice(0, 6).map(c => ({
                        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
                        opens: c.totalSent > 0 ? ((c.totalOpens / c.totalSent) * 100) : 0,
                        clicks: c.totalSent > 0 ? ((c.totalClicks / c.totalSent) * 100) : 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                        <Bar dataKey="opens" fill="hsl(var(--primary))" name="Open Rate" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="clicks" fill="hsl(var(--secondary))" name="Click Rate" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Status</CardTitle>
                  <CardDescription>Distribution by status</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No campaigns yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Draft', value: campaigns.filter(c => c.status === 'draft').length, fill: '#6b7280' },
                            { name: 'Scheduled', value: campaigns.filter(c => c.status === 'scheduled').length, fill: '#3b82f6' },
                            { name: 'Sending', value: campaigns.filter(c => c.status === 'sending').length, fill: '#f59e0b' },
                            { name: 'Sent', value: campaigns.filter(c => c.status === 'sent').length, fill: '#22c55e' },
                            { name: 'Paused', value: campaigns.filter(c => c.status === 'paused').length, fill: '#f97316' },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {[
                            { name: 'Draft', value: campaigns.filter(c => c.status === 'draft').length, fill: '#6b7280' },
                            { name: 'Scheduled', value: campaigns.filter(c => c.status === 'scheduled').length, fill: '#3b82f6' },
                            { name: 'Sending', value: campaigns.filter(c => c.status === 'sending').length, fill: '#f59e0b' },
                            { name: 'Sent', value: campaigns.filter(c => c.status === 'sent').length, fill: '#22c55e' },
                            { name: 'Paused', value: campaigns.filter(c => c.status === 'paused').length, fill: '#f97316' },
                          ].filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Segment Sizes</CardTitle>
                  <CardDescription>Customer count by segment</CardDescription>
                </CardHeader>
                <CardContent>
                  {segments.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No segments created</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={segments.map(s => ({
                        name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
                        customers: s.customerCount,
                      }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                        <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                        <Tooltip />
                        <Bar dataKey="customers" fill="hsl(var(--primary))" name="Customers" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Marketing overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Send className="h-5 w-5 text-muted-foreground" />
                        <span>Total Campaigns</span>
                      </div>
                      <span className="font-bold">{campaigns.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span>Email Templates</span>
                      </div>
                      <span className="font-bold">{templates.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <span>Customer Segments</span>
                      </div>
                      <span className="font-bold">{segments.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                        <span>Automation Triggers</span>
                      </div>
                      <span className="font-bold">{automations.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <span>Total Unsubscribes</span>
                      </div>
                      <span className="font-bold">{campaigns.reduce((sum, c) => sum + c.totalUnsubscribes, 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Campaign Performance</CardTitle>
                <CardDescription>Detailed metrics for sent campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.filter(c => c.status === 'sent').length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No campaign data yet</h3>
                    <p className="text-muted-foreground">Send your first campaign to see performance metrics</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Opens</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Unsubscribes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.filter(c => c.status === 'sent').slice(0, 10).map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>{campaign.totalSent.toLocaleString()}</TableCell>
                          <TableCell>
                            {campaign.totalSent > 0 ? (
                              <div className="flex items-center gap-2">
                                <span>{campaign.totalDelivered.toLocaleString()}</span>
                                <Progress value={(campaign.totalDelivered / campaign.totalSent) * 100} className="w-16 h-2" />
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {campaign.totalSent > 0 ? (
                              <div className="flex items-center gap-2">
                                <span>{campaign.totalOpens.toLocaleString()}</span>
                                <span className="text-muted-foreground">({((campaign.totalOpens / campaign.totalSent) * 100).toFixed(1)}%)</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {campaign.totalSent > 0 ? (
                              <div className="flex items-center gap-2">
                                <span>{campaign.totalClicks.toLocaleString()}</span>
                                <span className="text-muted-foreground">({((campaign.totalClicks / campaign.totalSent) * 100).toFixed(1)}%)</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{campaign.totalUnsubscribes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Outreach Tab ──────────────────────────────────────────────── */}
          <TabsContent value="outreach" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-semibold">Outreach</h2>
                <p className="text-sm text-muted-foreground">Send emails to anyone — individually, in bulk via CSV, or from saved templates</p>
              </div>
            </div>

            {/* Sub-tab switcher */}
            <div className="flex gap-2 flex-wrap">
              {(["compose", "broadcast", "templates"] as const).map(sub => (
                <Button
                  key={sub}
                  variant={outreachSubTab === sub ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOutreachSubTab(sub)}
                  data-testid={`outreach-subtab-${sub}`}
                >
                  {sub === "compose" && <Mail className="h-4 w-4 mr-1" />}
                  {sub === "broadcast" && <Users className="h-4 w-4 mr-1" />}
                  {sub === "templates" && <FileText className="h-4 w-4 mr-1" />}
                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                </Button>
              ))}
            </div>

            {/* ── Compose sub-tab ── */}
            {outreachSubTab === "compose" && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-2 flex-wrap pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Compose Email</CardTitle>
                    <CardDescription>Send to one or more recipients (comma-separated addresses)</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setTemplatePickerTarget("compose"); setShowTemplatePicker(true); }}
                    data-testid="outreach-use-template"
                  >
                    <FileText className="h-4 w-4 mr-1" /> Use Template
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>To <span className="text-muted-foreground text-xs">(comma-separate multiple addresses)</span></Label>
                    <Input
                      placeholder="alice@example.com, bob@example.com"
                      value={composeTo}
                      onChange={e => { setComposeTo(e.target.value); setComposeResults(null); }}
                      data-testid="outreach-to"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      placeholder="Email subject line"
                      value={composeSubject}
                      onChange={e => setComposeSubject(e.target.value)}
                      data-testid="outreach-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder={"Write your message here. You can use {{firstName}}, {{lastName}}, {{email}} placeholders.\nWrapped in the 1stRep branded template."}
                      value={composeBody}
                      onChange={e => setComposeBody(e.target.value)}
                      className="min-h-[200px] resize-y"
                      data-testid="outreach-body"
                    />
                  </div>

                  {composeResults && (
                    <div className="rounded-md border divide-y">
                      {composeResults.map(r => (
                        <div key={r.email} className="flex items-center justify-between px-3 py-2 text-sm gap-2 flex-wrap">
                          <span className="font-mono text-xs">{r.email}</span>
                          <Badge variant={r.status === "sent" ? "secondary" : "destructive"} className="flex items-center gap-1">
                            {r.status === "sent" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {r.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => {
                        const recipients = composeTo.split(",").map(s => s.trim()).filter(Boolean);
                        setComposeResults(null);
                        sendDirectMutation.mutate({ recipients, subject: composeSubject, body: composeBody, templateId: appliedTemplateId || undefined });
                      }}
                      disabled={sendDirectMutation.isPending || !composeTo.trim() || !composeSubject || !composeBody}
                      data-testid="outreach-send"
                    >
                      {sendDirectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setSaveAsTemplateSource("compose"); setSaveAsTemplateName(""); setShowSaveAsTemplate(true); }}
                      disabled={!composeSubject || !composeBody}
                      data-testid="outreach-save-template"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Save as Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Broadcast sub-tab ── */}
            {outreachSubTab === "broadcast" && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-2 flex-wrap pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> CSV Broadcast</CardTitle>
                    <CardDescription>Upload a CSV with <code className="text-xs bg-muted px-1 rounded">email</code>, optional <code className="text-xs bg-muted px-1 rounded">first_name</code> / <code className="text-xs bg-muted px-1 rounded">last_name</code> columns</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setTemplatePickerTarget("broadcast"); setShowTemplatePicker(true); }}
                    data-testid="broadcast-use-template"
                  >
                    <FileText className="h-4 w-4 mr-1" /> Use Template
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* CSV upload */}
                  <div className="space-y-2">
                    <Label>Recipients CSV</Label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="cursor-pointer">
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} data-testid="broadcast-csv-upload" />
                        <span className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover-elevate cursor-pointer">
                          <Upload className="h-4 w-4" /> Upload CSV
                        </span>
                      </label>
                      {broadcastRecipients.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{broadcastRecipients.length} recipient{broadcastRecipients.length !== 1 ? "s" : ""} loaded</Badge>
                          <Button size="sm" variant="ghost" onClick={() => { setBroadcastRecipients([]); setBroadcastResult(null); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {broadcastCsvError && <p className="text-sm text-destructive">{broadcastCsvError}</p>}
                    <p className="text-xs text-muted-foreground">Header row detected automatically. Columns: <strong>email</strong> (required), <strong>first_name</strong>, <strong>last_name</strong> (optional).</p>
                  </div>

                  {/* Preview table */}
                  {broadcastRecipients.length > 0 && (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Email</TableHead>
                            <TableHead className="text-xs">First Name</TableHead>
                            <TableHead className="text-xs">Last Name</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {broadcastRecipients.slice(0, 10).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-mono">{r.email}</TableCell>
                              <TableCell className="text-xs">{r.firstName || <span className="text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-xs">{r.lastName || <span className="text-muted-foreground">—</span>}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {broadcastRecipients.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-2">…and {broadcastRecipients.length - 10} more</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      placeholder="Email subject line"
                      value={broadcastSubject}
                      onChange={e => setBroadcastSubject(e.target.value)}
                      data-testid="broadcast-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder={"Write your broadcast message. Use {{firstName}}, {{lastName}}, {{email}} for personalisation.\nWrapped in the 1stRep branded template."}
                      value={broadcastBody}
                      onChange={e => setBroadcastBody(e.target.value)}
                      className="min-h-[180px] resize-y"
                      data-testid="broadcast-body"
                    />
                  </div>

                  {/* Live progress bar */}
                  {broadcastProgress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                        </span>
                        <span className="text-muted-foreground tabular-nums">{broadcastProgress.current} / {broadcastProgress.total}</span>
                      </div>
                      <Progress value={broadcastProgress.total > 0 ? Math.round((broadcastProgress.current / broadcastProgress.total) * 100) : 0} className="h-2" />
                    </div>
                  )}

                  {/* Result summary */}
                  {broadcastResult && (
                    <div className="p-4 rounded-md bg-muted/50 space-y-2">
                      <p className="text-sm font-medium">Broadcast complete</p>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400"><CheckCircle2 className="h-4 w-4" /> {broadcastResult.sent} sent</span>
                        {broadcastResult.failed > 0 && (
                          <span className="flex items-center gap-1 text-sm text-destructive"><XCircle className="h-4 w-4" /> {broadcastResult.failed} failed</span>
                        )}
                      </div>
                      {broadcastResult.failedAddresses.length > 0 && (
                        <p className="text-xs text-muted-foreground">Failed: {broadcastResult.failedAddresses.join(", ")}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => runBroadcast({
                        recipients: broadcastRecipients,
                        subject: broadcastSubject,
                        body: broadcastBody,
                        templateId: broadcastAppliedTemplateId || undefined,
                      })}
                      disabled={isBroadcasting || broadcastRecipients.length === 0 || !broadcastSubject || !broadcastBody}
                      data-testid="broadcast-send"
                    >
                      {isBroadcasting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      {isBroadcasting
                        ? broadcastProgress
                          ? `Sending ${broadcastProgress.current}/${broadcastProgress.total}…`
                          : "Preparing…"
                        : `Send to all ${broadcastRecipients.length} recipient${broadcastRecipients.length !== 1 ? "s" : ""}`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setSaveAsTemplateSource("broadcast"); setSaveAsTemplateName(""); setShowSaveAsTemplate(true); }}
                      disabled={!broadcastSubject || !broadcastBody}
                      data-testid="broadcast-save-template"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Save as Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Templates sub-tab ── */}
            {outreachSubTab === "templates" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-muted-foreground">Reusable subject + body combinations — use <strong>{"{{firstName}}"}</strong>, <strong>{"{{lastName}}"}</strong>, <strong>{"{{email}}"}</strong> as placeholders</p>
                  <Button size="sm" onClick={() => { setEditingOutreachTemplate(null); setOutreachTemplateForm({ name: "", subject: "", body: "" }); setShowOutreachTemplateDialog(true); }} data-testid="new-outreach-template">
                    <Plus className="h-4 w-4 mr-1" /> New Template
                  </Button>
                </div>

                {outreachTemplatesLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading templates…</div>
                ) : outreachTemplatesList.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <h3 className="font-semibold mb-1">No outreach templates yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">Create templates to speed up the compose and broadcast flows</p>
                      <Button size="sm" onClick={() => setShowOutreachTemplateDialog(true)}>Create your first template</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {outreachTemplatesList.map((tpl: { id: string; name: string; subject: string; body: string; created_at: string; last_used_at?: string | null }) => (
                      <Card key={tpl.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <CardTitle className="text-sm">{tpl.name}</CardTitle>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" title="Edit" onClick={() => { setEditingOutreachTemplate({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body }); setOutreachTemplateForm({ name: tpl.name, subject: tpl.subject, body: tpl.body }); setShowOutreachTemplateDialog(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" title="Duplicate" onClick={() => duplicateOutreachTemplateMutation.mutate(tpl.id)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" title="Delete" onClick={() => deleteOutreachTemplateMutation.mutate(tpl.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Subject:</p>
                          <p className="text-xs">{tpl.subject}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-2">Body preview:</p>
                          <p className="text-xs text-muted-foreground line-clamp-3">{tpl.body}</p>
                          {tpl.last_used_at && (
                            <p className="text-xs text-muted-foreground mt-1">Last used: {format(new Date(tpl.last_used_at), "dd MMM yyyy")}</p>
                          )}
                          <div className="flex gap-2 pt-2 flex-wrap">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setOutreachSubTab("compose"); handleApplyOutreachTemplate({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body }, "compose"); }}>
                              Load in Compose
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setOutreachSubTab("broadcast"); handleApplyOutreachTemplate({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body }, "broadcast"); }}>
                              Load in Broadcast
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Outreach History panel (always visible at bottom) ── */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Send History</CardTitle>
                  <CardDescription>Last 200 outreach emails sent from this tool</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetchLog()}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {outreachLogLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
                ) : outreachLog.length === 0 ? (
                  <div className="text-center py-10">
                    <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No outreach emails sent yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Broadcast</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead>By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outreachLog.map((entry: { id: string; to_email: string; subject: string; status: string; sent_at: string; sent_by_email: string | null; broadcast_id: string | null }) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-sm font-mono text-xs">{entry.to_email}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{entry.subject}</TableCell>
                            <TableCell>
                              <Badge variant={entry.status === "sent" ? "secondary" : "destructive"} className="flex items-center gap-1 w-fit">
                                {entry.status === "sent" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {entry.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{entry.broadcast_id ? entry.broadcast_id.slice(0, 8) + "…" : "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(entry.sent_at), "dd MMM yyyy HH:mm")}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{entry.sent_by_email || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* ── End Outreach Tab ──────────────────────────────────────────────── */}

        </Tabs>

        {/* Outreach Template Edit/Create Dialog */}
        <Dialog open={showOutreachTemplateDialog} onOpenChange={setShowOutreachTemplateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingOutreachTemplate ? "Edit Template" : "New Outreach Template"}</DialogTitle>
              <DialogDescription>Save a reusable subject and body. Use {"{{firstName}}"}, {"{{lastName}}"}, {"{{email}}"} as placeholders.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g. Win-back campaign"
                  value={outreachTemplateForm.name}
                  onChange={e => setOutreachTemplateForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Email subject"
                  value={outreachTemplateForm.subject}
                  onChange={e => setOutreachTemplateForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  placeholder="Email body text…"
                  value={outreachTemplateForm.body}
                  onChange={e => setOutreachTemplateForm(f => ({ ...f, body: e.target.value }))}
                  className="min-h-[160px] resize-y"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowOutreachTemplateDialog(false); setEditingOutreachTemplate(null); setOutreachTemplateForm({ name: "", subject: "", body: "" }); }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingOutreachTemplate) {
                    updateOutreachTemplateMutation.mutate({ id: editingOutreachTemplate.id, data: outreachTemplateForm });
                  } else {
                    createOutreachTemplateMutation.mutate(outreachTemplateForm);
                  }
                }}
                disabled={
                  createOutreachTemplateMutation.isPending || updateOutreachTemplateMutation.isPending ||
                  !outreachTemplateForm.name || !outreachTemplateForm.subject || !outreachTemplateForm.body
                }
              >
                {editingOutreachTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save-as-Template Dialog (from Compose or Broadcast) */}
        <Dialog open={showSaveAsTemplate} onOpenChange={setShowSaveAsTemplate}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>Name this template so you can reuse it later</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g. Follow-up email"
                value={saveAsTemplateName}
                onChange={e => setSaveAsTemplateName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && saveAsTemplateName.trim()) {
                    const src = saveAsTemplateSource === "compose"
                      ? { subject: composeSubject, body: composeBody }
                      : { subject: broadcastSubject, body: broadcastBody };
                    createOutreachTemplateMutation.mutate({ name: saveAsTemplateName.trim(), ...src });
                  }
                }}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowSaveAsTemplate(false); setSaveAsTemplateName(""); }}>Cancel</Button>
              <Button
                onClick={() => {
                  const src = saveAsTemplateSource === "compose"
                    ? { subject: composeSubject, body: composeBody }
                    : { subject: broadcastSubject, body: broadcastBody };
                  createOutreachTemplateMutation.mutate({ name: saveAsTemplateName.trim(), ...src });
                }}
                disabled={!saveAsTemplateName.trim() || createOutreachTemplateMutation.isPending}
              >
                {createOutreachTemplateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Picker Dialog */}
        <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
              <DialogDescription>Click a template to load it into the {templatePickerTarget} form</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto py-1">
              {outreachTemplatesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              ) : outreachTemplatesList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No templates yet. Create one in the Templates tab.</p>
              ) : (
                outreachTemplatesList.map((tpl: { id: string; name: string; subject: string; body: string; created_at: string; last_used_at?: string | null }) => (
                  <div
                    key={tpl.id}
                    className="p-3 rounded-md border hover-elevate cursor-pointer space-y-1"
                    onClick={() => handleApplyOutreachTemplate({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body }, templatePickerTarget)}
                  >
                    <p className="text-sm font-medium">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tpl.subject}</p>
                    {tpl.last_used_at && (
                      <p className="text-xs text-muted-foreground">Last used: {format(new Date(tpl.last_used_at), "dd MMM yyyy")}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
              <DialogDescription>Configure your email campaign settings and content</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="Summer Sale Campaign"
                    data-testid="input-campaign-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    placeholder="Don't miss our biggest sale!"
                    data-testid="input-campaign-subject"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={campaignForm.fromName}
                    onChange={(e) => setCampaignForm({ ...campaignForm, fromName: e.target.value })}
                    data-testid="input-campaign-from-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    value={campaignForm.fromEmail}
                    onChange={(e) => setCampaignForm({ ...campaignForm, fromEmail: e.target.value })}
                    data-testid="input-campaign-from-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Segment (Optional)</Label>
                <Select
                  value={campaignForm.segmentId}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, segmentId: value })}
                >
                  <SelectTrigger data-testid="select-campaign-segment">
                    <SelectValue placeholder="All subscribers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subscribers</SelectItem>
                    {segments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name} ({segment.memberCount || 0} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email Content (HTML)</Label>
                <Textarea
                  value={campaignForm.htmlContent}
                  onChange={(e) => setCampaignForm({ ...campaignForm, htmlContent: e.target.value })}
                  placeholder="<h1>Hello {{firstName}}!</h1><p>Check out our latest products...</p>"
                  rows={8}
                  data-testid="textarea-campaign-content"
                />
                <p className="text-xs text-muted-foreground">Use variables like {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}</p>
              </div>
              <div className="space-y-2">
                <Label>Plain Text Version</Label>
                <Textarea
                  value={campaignForm.textContent}
                  onChange={(e) => setCampaignForm({ ...campaignForm, textContent: e.target.value })}
                  placeholder="Hello {{firstName}}! Check out our latest products..."
                  rows={4}
                  data-testid="textarea-campaign-text"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowCampaignDialog(false); resetCampaignForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingCampaign) {
                    updateCampaignMutation.mutate({ id: editingCampaign.id, data: campaignForm });
                  } else {
                    createCampaignMutation.mutate(campaignForm);
                  }
                }}
                disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                data-testid="button-save-campaign"
              >
                {editingCampaign ? "Save Changes" : "Create Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSegment ? "Edit Segment" : "Create Segment"}</DialogTitle>
              <DialogDescription>Define criteria to group customers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Segment Name</Label>
                <Input
                  value={segmentForm.name}
                  onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  placeholder="VIP Customers"
                  data-testid="input-segment-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={segmentForm.description}
                  onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                  placeholder="Customers with high lifetime value"
                  data-testid="textarea-segment-description"
                />
              </div>
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Criteria
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Minimum Orders</Label>
                    <Input
                      type="number"
                      value={segmentForm.criteria.minOrders}
                      onChange={(e) => setSegmentForm({
                        ...segmentForm,
                        criteria: { ...segmentForm.criteria, minOrders: parseInt(e.target.value) || 0 }
                      })}
                      data-testid="input-segment-min-orders"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Spend (£)</Label>
                    <Input
                      type="number"
                      value={segmentForm.criteria.minSpend}
                      onChange={(e) => setSegmentForm({
                        ...segmentForm,
                        criteria: { ...segmentForm.criteria, minSpend: parseInt(e.target.value) || 0 }
                      })}
                      data-testid="input-segment-min-spend"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Loyalty Tier</Label>
                    <Select
                      value={segmentForm.criteria.tier}
                      onValueChange={(value) => setSegmentForm({
                        ...segmentForm,
                        criteria: { ...segmentForm.criteria, tier: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-segment-tier">
                        <SelectValue placeholder="Any tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any tier</SelectItem>
                        {tiers.map((tier) => (
                          <SelectItem key={tier} value={tier.toLowerCase()}>{tier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ordered in last (days)</Label>
                    <Input
                      type="number"
                      value={segmentForm.criteria.hasOrderedInDays}
                      onChange={(e) => setSegmentForm({
                        ...segmentForm,
                        criteria: { ...segmentForm.criteria, hasOrderedInDays: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="30"
                      data-testid="input-segment-ordered-days"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowSegmentDialog(false); resetSegmentForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={() => createSegmentMutation.mutate(segmentForm)}
                disabled={createSegmentMutation.isPending}
                data-testid="button-save-segment"
              >
                {editingSegment ? "Save Changes" : "Create Segment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAutomationDialog} onOpenChange={setShowAutomationDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAutomation ? "Edit Automation" : "Create Automation"}</DialogTitle>
              <DialogDescription>Set up automated email workflows</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Automation Name</Label>
                <Input
                  value={automationForm.name}
                  onChange={(e) => setAutomationForm({ ...automationForm, name: e.target.value })}
                  placeholder="Welcome Email Series"
                  data-testid="input-automation-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={automationForm.description}
                  onChange={(e) => setAutomationForm({ ...automationForm, description: e.target.value })}
                  placeholder="Sends a welcome email to new subscribers"
                  data-testid="textarea-automation-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select
                  value={automationForm.triggerType}
                  onValueChange={(value) => setAutomationForm({ ...automationForm, triggerType: value })}
                >
                  <SelectTrigger data-testid="select-automation-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">New Signup (Welcome)</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                    <SelectItem value="post_purchase">Post Purchase</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="win_back">Win Back (Inactive)</SelectItem>
                    <SelectItem value="loyalty_upgrade">Loyalty Tier Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delay (hours after trigger)</Label>
                <Input
                  type="number"
                  value={automationForm.delay}
                  onChange={(e) => setAutomationForm({ ...automationForm, delay: parseInt(e.target.value) || 0 })}
                  data-testid="input-automation-delay"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowAutomationDialog(false); resetAutomationForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={() => createAutomationMutation.mutate(automationForm)}
                disabled={createAutomationMutation.isPending}
                data-testid="button-save-automation"
              >
                {editingAutomation ? "Save Changes" : "Create Automation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure {editingTier?.tier || ''} Tier Benefits</DialogTitle>
              <DialogDescription>Set up rewards and perks for this loyalty tier</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Percentage</Label>
                  <Input
                    type="number"
                    value={tierForm.discountPercent}
                    onChange={(e) => setTierForm({ ...tierForm, discountPercent: parseInt(e.target.value) || 0 })}
                    data-testid="input-tier-discount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free Shipping Threshold (£)</Label>
                  <Input
                    type="number"
                    value={tierForm.freeShippingThreshold}
                    onChange={(e) => setTierForm({ ...tierForm, freeShippingThreshold: parseInt(e.target.value) || 0 })}
                    placeholder="0 = always free"
                    data-testid="input-tier-shipping"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Points Multiplier</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={tierForm.pointsMultiplier}
                    onChange={(e) => setTierForm({ ...tierForm, pointsMultiplier: parseFloat(e.target.value) || 1 })}
                    data-testid="input-tier-multiplier"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Birthday Bonus Points</Label>
                  <Input
                    type="number"
                    value={tierForm.birthdayBonus}
                    onChange={(e) => setTierForm({ ...tierForm, birthdayBonus: parseInt(e.target.value) || 0 })}
                    data-testid="input-tier-birthday"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Additional Benefits</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Early Access to Sales</Label>
                    <Switch
                      checked={tierForm.earlyAccess}
                      onCheckedChange={(checked) => setTierForm({ ...tierForm, earlyAccess: checked })}
                      data-testid="switch-tier-early-access"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Exclusive Products</Label>
                    <Switch
                      checked={tierForm.exclusiveProducts}
                      onCheckedChange={(checked) => setTierForm({ ...tierForm, exclusiveProducts: checked })}
                      data-testid="switch-tier-exclusive"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Free Returns</Label>
                    <Switch
                      checked={tierForm.freeReturns}
                      onCheckedChange={(checked) => setTierForm({ ...tierForm, freeReturns: checked })}
                      data-testid="switch-tier-returns"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="font-normal">Priority Support</Label>
                    <Switch
                      checked={tierForm.prioritySupport}
                      onCheckedChange={(checked) => setTierForm({ ...tierForm, prioritySupport: checked })}
                      data-testid="switch-tier-support"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowTierDialog(false); setEditingTier(null); }}>
                Cancel
              </Button>
              <Button
                onClick={() => upsertTierBenefitsMutation.mutate(tierForm)}
                disabled={upsertTierBenefitsMutation.isPending}
                data-testid="button-save-tier"
              >
                Save Benefits
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showTemplateDialog} onOpenChange={(open) => { if (!open) { setShowTemplateDialog(false); setEditingTemplate(null); } else { setShowTemplateDialog(true); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
              <DialogDescription>
                {editingTemplate ? "Update this email template" : "Create a reusable email template for campaigns and automations"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Welcome Email"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={templateForm.category}
                    onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                  >
                    <SelectTrigger data-testid="select-template-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  placeholder="e.g., Welcome to 1stRep!"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  data-testid="input-template-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-preview">Preview Text</Label>
                <Input
                  id="template-preview"
                  placeholder="Text shown in email preview"
                  value={templateForm.previewText}
                  onChange={(e) => setTemplateForm({ ...templateForm, previewText: e.target.value })}
                  data-testid="input-template-preview"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-html">HTML Content</Label>
                <Textarea
                  id="template-html"
                  placeholder="<html><body>Your email content here...</body></html>"
                  value={templateForm.htmlContent}
                  onChange={(e) => setTemplateForm({ ...templateForm, htmlContent: e.target.value })}
                  className="min-h-[200px] font-mono text-sm"
                  data-testid="textarea-template-html"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-text">Plain Text Content (optional)</Label>
                <Textarea
                  id="template-text"
                  placeholder="Plain text version of the email"
                  value={templateForm.textContent}
                  onChange={(e) => setTemplateForm({ ...templateForm, textContent: e.target.value })}
                  className="min-h-[100px]"
                  data-testid="textarea-template-text"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowTemplateDialog(false); setEditingTemplate(null); resetTemplateForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending || !templateForm.name || !templateForm.subject || !templateForm.htmlContent}
                data-testid="button-save-template"
              >
                {editingTemplate ? "Save Changes" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Loyalty Reward Dialog */}
        <Dialog open={showRewardDialog} onOpenChange={(open) => { 
          if (!open) { 
            setShowRewardDialog(false); 
            setEditingReward(null); 
            resetRewardForm(); 
          } else { 
            setShowRewardDialog(true); 
          } 
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReward ? "Edit Reward" : "Create New Reward"}</DialogTitle>
              <DialogDescription>
                {editingReward ? "Update this loyalty reward" : "Create a reward that customers can redeem with their loyalty points"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-name">Reward Name</Label>
                <Input
                  id="reward-name"
                  placeholder="e.g., £5 Off Your Order"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  data-testid="input-reward-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward-description">Description</Label>
                <Textarea
                  id="reward-description"
                  placeholder="Describe what this reward offers..."
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  data-testid="textarea-reward-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-points">Points Cost</Label>
                  <Input
                    id="reward-points"
                    type="number"
                    min={1}
                    value={rewardForm.pointsCost}
                    onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: parseInt(e.target.value) || 0 })}
                    data-testid="input-reward-points"
                  />
                  <p className="text-xs text-muted-foreground">How many points to redeem</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward-type">Reward Type</Label>
                  <Select
                    value={rewardForm.rewardType}
                    onValueChange={(value) => setRewardForm({ ...rewardForm, rewardType: value })}
                  >
                    <SelectTrigger data-testid="select-reward-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount_fixed">Fixed Discount (£)</SelectItem>
                      <SelectItem value="discount_percentage">Percentage Discount (%)</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                      <SelectItem value="exclusive_access">Exclusive Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-value">Reward Value</Label>
                  <Input
                    id="reward-value"
                    type="number"
                    min={0}
                    value={rewardForm.rewardValue}
                    onChange={(e) => setRewardForm({ ...rewardForm, rewardValue: e.target.value })}
                    data-testid="input-reward-value"
                  />
                  <p className="text-xs text-muted-foreground">
                    {rewardForm.rewardType === 'discount_percentage' ? 'Percentage off' : 
                     rewardForm.rewardType === 'discount_fixed' ? 'Amount in £' : 
                     'Value'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward-tier">Minimum Tier</Label>
                  <Select
                    value={rewardForm.minTier}
                    onValueChange={(value) => setRewardForm({ ...rewardForm, minTier: value })}
                  >
                    <SelectTrigger data-testid="select-reward-tier">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-expiry">Expiry Days</Label>
                  <Input
                    id="reward-expiry"
                    type="number"
                    min={1}
                    value={rewardForm.expiryDays}
                    onChange={(e) => setRewardForm({ ...rewardForm, expiryDays: parseInt(e.target.value) || 30 })}
                    data-testid="input-reward-expiry"
                  />
                  <p className="text-xs text-muted-foreground">Days until reward expires after redemption</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward-limit">Usage Limit (optional)</Label>
                  <Input
                    id="reward-limit"
                    type="number"
                    min={0}
                    placeholder="Unlimited"
                    value={rewardForm.usageLimit || ''}
                    onChange={(e) => setRewardForm({ ...rewardForm, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                    data-testid="input-reward-limit"
                  />
                  <p className="text-xs text-muted-foreground">Max per customer (leave empty for unlimited)</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-sm text-muted-foreground">Make this reward available for redemption</p>
                </div>
                <Switch
                  checked={rewardForm.isActive}
                  onCheckedChange={(checked) => setRewardForm({ ...rewardForm, isActive: checked })}
                  data-testid="switch-reward-active"
                />
              </div>

              {rewardForm.pointsCost > 0 && parseFloat(rewardForm.rewardValue) > 0 && rewardForm.rewardType === 'discount_fixed' && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/30">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Effective Value: {Math.round(rewardForm.pointsCost / parseFloat(rewardForm.rewardValue))} points = £1
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowRewardDialog(false); setEditingReward(null); resetRewardForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveReward}
                disabled={createRewardMutation.isPending || updateRewardMutation.isPending || !rewardForm.name || !rewardForm.description || rewardForm.pointsCost <= 0}
                data-testid="button-save-reward"
              >
                {editingReward ? "Save Changes" : "Create Reward"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
