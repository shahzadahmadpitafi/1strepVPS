import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "./RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  X, 
  Image as ImageIcon, 
  Video, 
  Star,
  Package,
  Tag,
  Palette,
  Ruler,
  Sparkles,
  FileText,
  Info,
  Users,
  Save,
  Trash2,
  Cloud,
  CloudOff,
  Warehouse as WarehouseIcon,
  MapPin,
  GripVertical
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
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

// Draft storage key
const PRODUCT_DRAFT_KEY = 'product_form_draft';

// Size ordering for consistent display (S, M, L, XL, etc.)
const SIZE_ORDER: Record<string, number> = {
  'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'XXL': 7, 'XXXL': 8, '3XL': 8,
  // Numeric sizes
  '4': 10, '6': 11, '8': 12, '10': 13, '12': 14, '14': 15, '16': 16, '18': 17, '20': 18,
  // UK sizes
  'UK4': 20, 'UK6': 21, 'UK8': 22, 'UK10': 23, 'UK12': 24, 'UK14': 25, 'UK16': 26, 'UK18': 27,
};

const sortSizes = (sizes: string[]): string[] => {
  return [...sizes].sort((a, b) => {
    const upperA = a.toUpperCase();
    const upperB = b.toUpperCase();
    const orderA = SIZE_ORDER[upperA] ?? 999;
    const orderB = SIZE_ORDER[upperB] ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
};

// Type for draft data
type ProductDraft = {
  formData: any;
  additionalImages: string[];
  colorImages: Record<string, string>;
  colorHoverImages: Record<string, string>;
  colorSizeAvailability: Record<string, string[]>;
  variantPricing: Record<string, any>;
  savedAt: number;
};

type Product = {
  id?: string;
  name: string;
  description: string;
  detailedDescription?: string;
  retailPrice: string;
  salePrice?: string;
  wholesalePrice: string;
  wholesaleSalePrice?: string;
  costPrice: string;
  partnerCommissionRate?: string;
  partnerStorefrontPrice?: string;
  category: string;
  activityType?: 'training' | 'yoga' | 'running' | 'studio' | 'general';
  gender?: 'men' | 'women' | 'unisex';
  imageUrl: string;
  hoverImageUrl?: string;
  videoUrl?: string;
  sku: string;
  barcodeDescriptor?: string;
  sizes: string[];
  colors: string[];
  features?: string[];
  materials?: string;
  careInstructions?: string;
  modelInfo?: string;
  isActive: boolean;
  isHeroProduct?: boolean;
  collections?: string[];
  availabilityStatus: 'available' | 'upcoming' | 'out_of_stock' | 'discontinued';
  pairedProductId?: string;
};

type ModernProductFormProps = {
  product?: Product | null;
  onSuccess: () => void;
};

// Auto-convert Dropbox, Google Drive, and other cloud URLs to direct image format
const convertToDirectImageUrl = (url: string): string => {
  if (!url) return url;
  
  // Handle Object Storage URLs - convert full URLs to relative paths
  // This ensures images work on any domain (development or production)
  if (url.includes('public-objects/')) {
    // If it's already a proper relative URL with leading slash, return as-is
    if (url.startsWith('/public-objects/')) {
      return url;
    }
    // Convert full URL to relative path
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname; // Returns /public-objects/filename.jpg
      } catch {
        return url;
      }
    }
    // Add leading slash if missing
    if (url.startsWith('public-objects/')) {
      return '/' + url;
    }
    return url;
  }
  
  // Handle Dropbox URLs
  if (url.includes('dropbox.com')) {
    // New Dropbox format: /scl/fi/ URLs need rlkey parameter preserved
    // Old format: /s/ or /sh/ URLs just need dl=1 or raw=1
    
    // Remove trailing & or ? if present
    let cleanUrl = url.replace(/[&?]+$/, '');
    
    // Remove dl=0, dl=1, raw=0, raw=1 parameters (we'll add our own)
    cleanUrl = cleanUrl
      .replace(/[?&]dl=[01]/g, '')
      .replace(/[?&]raw=[01]/g, '');
    
    // Remove st= parameter (session token - not needed for direct access)
    cleanUrl = cleanUrl.replace(/[?&]st=[^&]*/g, '');
    
    // Clean up any double & or trailing & or ?
    cleanUrl = cleanUrl.replace(/[&?]+$/, '').replace(/&&+/g, '&').replace(/\?&/g, '?');
    
    // Add dl=1 for direct download (works better than raw=1 for new format)
    if (cleanUrl.includes('?')) {
      cleanUrl = cleanUrl + '&dl=1';
    } else {
      cleanUrl = cleanUrl + '?dl=1';
    }
    
    return cleanUrl;
  }
  
  // Handle Google Drive URLs
  if (url.includes('drive.google.com')) {
    // Extract file ID from various Google Drive URL formats
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
  }
  
  return url;
};

export default function ModernProductForm({ product, onSuccess }: ModernProductFormProps) {
  // Fetch dynamic product sections
  const { data: productSections = [] } = useQuery<any[]>({
    queryKey: ["/api/product-sections"]
  });

  // Fetch dynamic activity types
  const { data: activityTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/activity-types"]
  });

  // Fetch warehouses for stock assignment
  type Warehouse = {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    isPrimary: boolean;
  };
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/admin/warehouses"]
  });

  // Fetch all products for pairing selector (bra + leggings outfits)
  type ProductForPairing = {
    id: string;
    name: string;
    category: string;
  };
  const { data: allProducts = [] } = useQuery<ProductForPairing[]>({
    queryKey: ["/api/products"],
  });

  // Default fallback values for sections and activity types
  const defaultSections = ["Hoodies and Jumpers", "T-Shirts", "Leggings", "Vests", "Shorts", "Jackets", "Hats", "Accessories"];
  const defaultActivityTypes = ["general", "training", "yoga", "running", "studio"];
  
  // Use dynamic sections if available, fallback to defaults
  const availableSections = productSections.length > 0 
    ? productSections.map((s: any) => s.name)
    : defaultSections;
  
  const availableActivityTypes = activityTypes.length > 0
    ? activityTypes.map((t: any) => ({ name: t.name, slug: t.slug }))
    : defaultActivityTypes.map(t => ({ name: t.charAt(0).toUpperCase() + t.slice(1), slug: t }));

  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    detailedDescription: "",
    retailPrice: "",
    salePrice: "",
    wholesalePrice: "",
    wholesaleSalePrice: "",
    costPrice: "",
    partnerCommissionRate: "10.00",
    partnerStorefrontPrice: "",
    category: "T-Shirts",
    activityType: "general",
    imageUrl: "",
    hoverImageUrl: "",
    videoUrl: "",
    sku: "",
    barcodeDescriptor: "",
    sizes: [],
    colors: [],
    features: [],
    materials: "",
    careInstructions: "",
    modelInfo: "",
    isActive: true,
    isHeroProduct: false,
    gender: "unisex",
    collections: [],
    availabilityStatus: "available",
    pairedProductId: "",
  });

  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  const [colorHoverImages, setColorHoverImages] = useState<Record<string, string>>({});
  const [colorAdditionalImages, setColorAdditionalImages] = useState<Record<string, string[]>>({});
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newImage, setNewImage] = useState("");
  const [draggedFeatureIndex, setDraggedFeatureIndex] = useState<number | null>(null);
  
  // Color-Size availability matrix: { "Black": ["S", "XL"], "Blue": ["S", "M", "L", "XL"] }
  const [colorSizeAvailability, setColorSizeAvailability] = useState<Record<string, string[]>>({});
  
  // Variant-specific pricing, status, and barcode descriptors: { "Black|S": { retailPrice: "29.99", wholesalePrice: "19.99", status: "coming_soon" } }
  type VariantPricing = {
    retailPrice?: string;
    wholesalePrice?: string;
    costPrice?: string;
    barcodeDescriptor?: string;
    status?: 'available' | 'coming_soon' | 'out_of_stock' | 'pre_order';
    expectedDate?: string;
  };
  const [variantPricing, setVariantPricing] = useState<Record<string, VariantPricing>>({});
  
  // Warehouse stock assignment: { "warehouse-id-1": { quantity: 50, location: "A1-B3" } }
  type WarehouseStock = {
    quantity: number;
    location: string;
    minStockLevel: number;
  };
  const [warehouseStock, setWarehouseStock] = useState<Record<string, WarehouseStock>>({});
  
  // Store existing variants with their IDs for deletion
  type ExistingVariant = {
    id: string;
    color: string;
    size: string;
    sku?: string;
    retailPrice?: string;
    stock?: number;
  };
  const [existingVariants, setExistingVariants] = useState<ExistingVariant[]>([]);
  
  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [variantToDelete, setVariantToDelete] = useState<{id: string; color: string; size: string} | null>(null);

  // Draft auto-save state
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'loaded'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const draftJustLoadedRef = useRef(false);

  const { toast } = useToast();

  // Helper function to save draft to localStorage
  const saveDraft = useCallback(() => {
    if (product?.id) return; // Don't save drafts when editing existing products
    
    const draft = {
      formData,
      additionalImages,
      colorImages,
      colorHoverImages,
      colorAdditionalImages,
      colorSizeAvailability,
      variantPricing,
      warehouseStock,
      savedAt: Date.now()
    };
    
    try {
      localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draft));
      setLastSavedAt(new Date());
      setDraftStatus('saved');
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData, additionalImages, colorImages, colorHoverImages, colorAdditionalImages, colorSizeAvailability, variantPricing, warehouseStock, product?.id]);

  // Helper function to load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(PRODUCT_DRAFT_KEY);
      if (savedDraft) {
        const draft: ProductDraft = JSON.parse(savedDraft);
        return draft;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, []);

  // Helper function to clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(PRODUCT_DRAFT_KEY);
      setHasDraft(false);
      setDraftStatus('idle');
      setLastSavedAt(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Restore draft on component mount (only for new products)
  useEffect(() => {
    if (!product && isInitialLoadRef.current) {
      const draft = loadDraft();
      if (draft) {
        // Check if draft is less than 7 days old
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (draft.savedAt > sevenDaysAgo) {
          draftJustLoadedRef.current = true;
          setFormData(draft.formData);
          setAdditionalImages(draft.additionalImages || []);
          setColorImages(draft.colorImages || {});
          setColorHoverImages(draft.colorHoverImages || {});
          setColorAdditionalImages((draft as any).colorAdditionalImages || {});
          setColorSizeAvailability(draft.colorSizeAvailability || {});
          setVariantPricing(draft.variantPricing || {});
          setWarehouseStock((draft as any).warehouseStock || {});
          setLastSavedAt(new Date(draft.savedAt));
          setDraftStatus('loaded');
          setHasDraft(true);
          
          toast({
            title: "Draft Restored",
            description: `Your previous work has been restored from ${new Date(draft.savedAt).toLocaleString()}`,
          });
        } else {
          // Draft is too old, clear it
          clearDraft();
        }
      }
      isInitialLoadRef.current = false;
    }
  }, [product, loadDraft, clearDraft, toast]);

  // Auto-save draft with debounce (1 second after last change)
  useEffect(() => {
    // Skip auto-save during initial load or when editing existing product
    if (isInitialLoadRef.current || product?.id) return;
    
    // Only save if there's actual content
    const hasContent = formData.name || formData.description || formData.retailPrice || 
                       formData.imageUrl || formData.sizes.length > 0 || formData.colors.length > 0;
    
    if (!hasContent) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setDraftStatus('saving');
    
    // Set new timeout to save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, additionalImages, colorImages, colorHoverImages, colorAdditionalImages, colorSizeAvailability, variantPricing, warehouseStock, product?.id, saveDraft]);

  // Load product data if editing
  useEffect(() => {
    // Skip reset if a draft was just loaded (to preserve draft data)
    if (draftJustLoadedRef.current) {
      draftJustLoadedRef.current = false;
      return;
    }
    
    // Reset all state when product changes (or when closing form)
    setAdditionalImages([]);
    setColorImages({});
    setColorHoverImages({});
    setColorAdditionalImages({});
    setColorSizeAvailability({});
    setVariantPricing({});
    setWarehouseStock({});
    
    if (product) {
      setFormData({
        ...product,
        features: product.features || [],
        materials: product.materials || "",
        careInstructions: product.careInstructions || "",
        modelInfo: (product as any).modelInfo || "",
        detailedDescription: product.detailedDescription || "",
        hoverImageUrl: product.hoverImageUrl || "",
        videoUrl: product.videoUrl || "",
        barcodeDescriptor: product.barcodeDescriptor || "",
        isHeroProduct: product.isHeroProduct || false,
        gender: product.gender || "unisex",
        collections: product.collections || [],
        pairedProductId: (product as any).pairedProductId || "",
      });
      
      // Load color images, hover images, and additional gallery images if editing existing product
      if (product.id) {
        fetch(`/api/products/${product.id}/color-images`)
          .then(res => res.json())
          .then(data => {
            if (data && typeof data === 'object' && !data.error) {
              // data contains { images: { color: url }, hoverImages: { color: hoverUrl }, additionalImages: { color: [urls] } }
              if (data.images) {
                setColorImages(data.images);
              } else {
                // Fallback for old format (direct color -> url mapping)
                setColorImages(data);
              }
              if (data.hoverImages) {
                setColorHoverImages(data.hoverImages);
              }
              if (data.additionalImages) {
                setColorAdditionalImages(data.additionalImages);
              }
            }
          })
          .catch(err => console.log('No color images found'));
        
        // Load color-size availability and variant pricing from variants
        fetch(`/api/products/${product.id}/variants`)
          .then(res => res.json())
          .then((variants: Array<{ id: string; color: string; size: string; isActive: boolean; retailPrice?: string; wholesalePrice?: string; costPrice?: string; barcodeDescriptor?: string; sku?: string; stock?: number; status?: 'available' | 'coming_soon' | 'out_of_stock' | 'pre_order' }>) => {
            if (Array.isArray(variants)) {
              const availability: Record<string, string[]> = {};
              const pricing: Record<string, VariantPricing> = {};
              
              // Store all variants with their IDs for management
              setExistingVariants(variants.map(v => ({
                id: v.id,
                color: v.color,
                size: v.size,
                sku: v.sku,
                retailPrice: v.retailPrice,
                stock: v.stock
              })));
              
              variants.filter(v => v.isActive !== false).forEach(v => {
                // Build availability map
                if (!availability[v.color]) {
                  availability[v.color] = [];
                }
                if (!availability[v.color].includes(v.size)) {
                  availability[v.color].push(v.size);
                }
                
                // Populate pricing for ALL active variants
                // Show custom values if they differ from product defaults, empty otherwise
                const key = `${v.color}|${v.size}`;
                const hasCustomRetail = v.retailPrice && v.retailPrice !== product.retailPrice;
                const hasCustomWholesale = v.wholesalePrice && v.wholesalePrice !== product.wholesalePrice;
                const hasCustomCost = v.costPrice && v.costPrice !== product.costPrice;
                const hasCustomBarcode = v.barcodeDescriptor && v.barcodeDescriptor.trim() !== '';
                
                // Add entry for every active variant - empty values mean "use default"
                pricing[key] = {
                  retailPrice: hasCustomRetail ? v.retailPrice : '',
                  wholesalePrice: hasCustomWholesale ? v.wholesalePrice : '',
                  costPrice: hasCustomCost ? v.costPrice : '',
                  barcodeDescriptor: hasCustomBarcode ? v.barcodeDescriptor : '',
                  status: v.status || 'available',
                };
              });
              
              setColorSizeAvailability(availability);
              setVariantPricing(pricing);
            }
          })
          .catch(err => console.log('No variants found'));
        
        // Load additional product images (from product_images table)
        fetch(`/api/admin/products/${product.id}/images`)
          .then(res => res.json())
          .then((images: Array<{ url: string; isPrimary?: boolean; sortOrder?: number }>) => {
            if (Array.isArray(images)) {
              // Filter out primary image (it's shown in main imageUrl field)
              // Get non-primary images as additional images
              const additionalImgs = images
                .filter(img => !img.isPrimary)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map(img => img.url);
              
              setAdditionalImages(additionalImgs);
            }
          })
          .catch(err => console.log('No additional images found'));
        
        // Load warehouse stock assignments for this product
        fetch(`/api/admin/products/${product.id}/warehouse-stock`)
          .then(res => res.json())
          .then((stockData: Record<string, { quantity: number; location: string; minStockLevel: number }>) => {
            console.log('📦 Warehouse stock response:', stockData);
            if (stockData && typeof stockData === 'object' && !stockData.error) {
              console.log('📦 Setting warehouse stock:', Object.keys(stockData).length, 'warehouses');
              setWarehouseStock(stockData);
            } else {
              console.log('📦 No valid warehouse stock data');
            }
          })
          .catch(err => console.log('No warehouse stock found:', err));
      }
    } else {
      // Reset form data for new product
      setFormData({
        name: "",
        description: "",
        detailedDescription: "",
        retailPrice: "",
        wholesalePrice: "",
        costPrice: "",
        category: "T-Shirts",
        activityType: "general",
        imageUrl: "",
        hoverImageUrl: "",
        videoUrl: "",
        sku: "",
        barcodeDescriptor: "",
        sizes: [],
        colors: [],
        features: [],
        materials: "",
        careInstructions: "",
        modelInfo: "",
        isActive: true,
        isHeroProduct: false,
        gender: "unisex",
        collections: [],
        availabilityStatus: "available",
      });
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: (data: Product) => {
      if (product?.id) {
        return apiRequest("PATCH", `/api/admin/products/${product.id}`, data);
      }
      return apiRequest("POST", "/api/admin/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      // Clear the draft on successful creation (not on update)
      if (!product?.id) {
        clearDraft();
      }
      toast({
        title: product ? "Product updated" : "Product created",
        description: product ? "Product has been updated successfully" : "New product has been added to catalogue",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete individual variants
  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) => {
      return apiRequest("DELETE", `/api/product-variants/${variantId}`);
    },
    onSuccess: (_, variantId) => {
      // Remove from local state
      setExistingVariants(prev => prev.filter(v => v.id !== variantId));
      toast({
        title: "Variant deleted",
        description: "The variant has been removed successfully",
      });
      // Invalidate product queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete variant",
        variant: "destructive",
      });
    },
  });

  // Opens the delete confirmation dialog
  const handleDeleteVariant = (variantId: string, color: string, size: string) => {
    setVariantToDelete({ id: variantId, color, size });
    setDeleteConfirmText("");
    setDeleteConfirmOpen(true);
  };

  // Actually performs the deletion after confirmation
  const confirmDeleteVariant = () => {
    if (!variantToDelete || deleteConfirmText !== "DELETE") return;
    
    deleteVariantMutation.mutate(variantToDelete.id, {
      onSuccess: () => {
        const { color, size } = variantToDelete;
        // Also remove from colorSizeAvailability to prevent re-creation on save
        setColorSizeAvailability(prev => {
          const updated = { ...prev };
          if (updated[color]) {
            updated[color] = updated[color].filter(s => s !== size);
            // If no sizes left for this color, remove the color entry
            if (updated[color].length === 0) {
              delete updated[color];
            }
          }
          return updated;
        });
        
        // Also remove from variantPricing
        const pricingKey = `${color}|${size}`;
        setVariantPricing(prev => {
          const updated = { ...prev };
          delete updated[pricingKey];
          return updated;
        });
        
        // Close dialog and reset state
        setDeleteConfirmOpen(false);
        setVariantToDelete(null);
        setDeleteConfirmText("");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields and scroll to first missing one
    const requiredFields = [
      { field: 'name', label: 'Product Name', value: formData.name },
      { field: 'sku', label: 'SKU', value: formData.sku },
      { field: 'category', label: 'Category', value: formData.category },
      { field: 'retailPrice', label: 'Retail Price', value: formData.retailPrice },
      { field: 'wholesalePrice', label: 'Wholesale Price', value: formData.wholesalePrice },
      { field: 'costPrice', label: 'Cost Price', value: formData.costPrice },
    ];
    
    for (const { field, label, value } of requiredFields) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        toast({
          title: "Missing Required Field",
          description: `Please fill in the ${label} field`,
          variant: "destructive",
        });
        // Find and scroll to the input element
        const element = document.querySelector(`[data-field="${field}"]`) || 
                       document.querySelector(`[name="${field}"]`) ||
                       document.querySelector(`#${field}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLInputElement).focus?.();
        }
        return;
      }
    }
    
    // Validate sizes and colors
    if (!formData.sizes || formData.sizes.length === 0) {
      toast({
        title: "Missing Required Field",
        description: "Please add at least one size",
        variant: "destructive",
      });
      const sizesSection = document.querySelector('[data-section="sizes"]');
      if (sizesSection) {
        sizesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    if (!formData.colors || formData.colors.length === 0) {
      toast({
        title: "Missing Required Field",
        description: "Please add at least one color",
        variant: "destructive",
      });
      const colorsSection = document.querySelector('[data-section="colors"]');
      if (colorsSection) {
        colorsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Send all variant pricing entries, including empty ones
    // Empty values signal the backend to reset to product defaults
    // Entries not in variantPricing will keep their existing values
    saveMutation.mutate({
      ...formData,
      colorImages: colorImages, // Send color-specific images to backend
      colorHoverImages: colorHoverImages, // Send color-specific hover images to backend
      colorAdditionalImages: colorAdditionalImages, // Send additional gallery images per color
      colorSizeAvailability: colorSizeAvailability, // Send which sizes are available per color
      variantPricing: variantPricing, // Send all variant pricing entries
      additionalImages: additionalImages, // Send additional product images to backend
      warehouseStock: warehouseStock, // Send warehouse stock assignments
    } as any);
  };

  const addSize = () => {
    if (newSize && !formData.sizes.includes(newSize)) {
      setFormData({ ...formData, sizes: [...formData.sizes, newSize] });
      setNewSize("");
    }
  };

  const removeSize = (size: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({ ...formData, colors: [...formData.colors, newColor] });
      // Initialize this color with all available sizes by default
      setColorSizeAvailability(prev => ({
        ...prev,
        [newColor]: [...formData.sizes]
      }));
      setNewColor("");
    }
  };

  const removeColor = (color: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
    // Also remove the color image, hover image, additional images, and color-size availability
    const updatedColorImages = { ...colorImages };
    delete updatedColorImages[color];
    setColorImages(updatedColorImages);
    
    const updatedColorHoverImages = { ...colorHoverImages };
    delete updatedColorHoverImages[color];
    setColorHoverImages(updatedColorHoverImages);
    
    const updatedColorAdditionalImages = { ...colorAdditionalImages };
    delete updatedColorAdditionalImages[color];
    setColorAdditionalImages(updatedColorAdditionalImages);
    
    const updatedAvailability = { ...colorSizeAvailability };
    delete updatedAvailability[color];
    setColorSizeAvailability(updatedAvailability);
  };

  // Toggle a size for a specific color
  const toggleSizeForColor = (color: string, size: string) => {
    setColorSizeAvailability(prev => {
      const currentSizes = prev[color] || [];
      if (currentSizes.includes(size)) {
        // Remove size from this color
        return {
          ...prev,
          [color]: currentSizes.filter(s => s !== size)
        };
      } else {
        // Add size to this color
        return {
          ...prev,
          [color]: [...currentSizes, size]
        };
      }
    });
  };

  // Toggle all sizes for a color (select all / deselect all)
  const toggleAllSizesForColor = (color: string) => {
    const currentSizes = colorSizeAvailability[color] || [];
    if (currentSizes.length === formData.sizes.length) {
      // All selected, so deselect all
      setColorSizeAvailability(prev => ({
        ...prev,
        [color]: []
      }));
    } else {
      // Some or none selected, so select all
      setColorSizeAvailability(prev => ({
        ...prev,
        [color]: [...formData.sizes]
      }));
    }
  };

  const updateColorImage = (color: string, imageUrl: string) => {
    setColorImages({ ...colorImages, [color]: convertToDirectImageUrl(imageUrl) });
  };

  const updateColorHoverImage = (color: string, imageUrl: string) => {
    setColorHoverImages({ ...colorHoverImages, [color]: convertToDirectImageUrl(imageUrl) });
  };

  const addFeature = () => {
    if (newFeature && !(formData.features || []).includes(newFeature)) {
      setFormData({ ...formData, features: [...(formData.features || []), newFeature] });
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({ ...formData, features: (formData.features || []).filter(f => f !== feature) });
  };

  const moveFeature = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const features = [...(formData.features || [])];
    const [movedItem] = features.splice(fromIndex, 1);
    features.splice(toIndex, 0, movedItem);
    setFormData({ ...formData, features });
  };

  const handleFeatureDragStart = (e: React.DragEvent, index: number) => {
    setDraggedFeatureIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleFeatureDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFeatureDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = draggedFeatureIndex;
    if (fromIndex !== null && fromIndex !== toIndex) {
      moveFeature(fromIndex, toIndex);
    }
    setDraggedFeatureIndex(null);
  };

  const handleFeatureDragEnd = () => {
    setDraggedFeatureIndex(null);
  };

  const addImage = () => {
    if (newImage) {
      const convertedUrl = convertToDirectImageUrl(newImage);
      if (!additionalImages.includes(convertedUrl)) {
        setAdditionalImages([...additionalImages, convertedUrl]);
        setNewImage("");
      }
    }
  };

  const removeImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Draft Status Indicator - Only show for new products */}
      {!product?.id && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {draftStatus === 'saving' && (
              <>
                <CloudOff className="w-4 h-4 text-muted-foreground animate-pulse" />
                <span className="text-sm text-muted-foreground">Saving draft...</span>
              </>
            )}
            {draftStatus === 'saved' && (
              <>
                <Cloud className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  Draft saved {lastSavedAt && `at ${lastSavedAt.toLocaleTimeString()}`}
                </span>
              </>
            )}
            {draftStatus === 'loaded' && (
              <>
                <Save className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Draft restored from {lastSavedAt && lastSavedAt.toLocaleString()}
                </span>
              </>
            )}
            {draftStatus === 'idle' && !hasDraft && (
              <>
                <Save className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Changes will auto-save as draft
                </span>
              </>
            )}
          </div>
          {hasDraft && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                clearDraft();
                // Reset form to defaults
                setFormData({
                  name: "",
                  description: "",
                  detailedDescription: "",
                  retailPrice: "",
                  wholesalePrice: "",
                  costPrice: "",
                  category: "T-Shirts",
                  activityType: "general",
                  imageUrl: "",
                  hoverImageUrl: "",
                  videoUrl: "",
                  sku: "",
                  barcodeDescriptor: "",
                  sizes: [],
                  colors: [],
                  features: [],
                  materials: "",
                  careInstructions: "",
                  modelInfo: "",
                  isActive: true,
                  isHeroProduct: false,
                  gender: "unisex",
                  collections: [],
                  availabilityStatus: "available",
                });
                setAdditionalImages([]);
                setColorImages({});
                setColorHoverImages({});
                setColorAdditionalImages({});
                setColorSizeAvailability({});
                setVariantPricing({});
                toast({
                  title: "Draft Cleared",
                  description: "Form has been reset to defaults",
                });
              }}
              className="text-destructive hover:text-destructive"
              data-testid="button-clear-draft"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Draft
            </Button>
          )}
        </div>
      )}

      {/* Category Guide */}
      <div className="flex gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-medium">Product Section Guide</p>
          <p className="text-sm text-muted-foreground">
            Choose the correct product section below to ensure your product appears in the right place on the homepage:
          </p>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div><strong>Hoodies & Jumpers:</strong> Hoodies, sweatshirts, pullovers</div>
            <div><strong>T-Shirts:</strong> Short & long sleeve shirts, tanks</div>
            <div><strong>Leggings:</strong> Full-length, capri, printed leggings</div>
            <div><strong>Vests & Crop Tops:</strong> Sports vests, crop tops, bras</div>
            <div><strong>Shorts:</strong> Athletic shorts, running shorts</div>
            <div><strong>Jackets:</strong> Windbreakers, track jackets, outerwear</div>
            <div><strong>Hats:</strong> Beanies, caps, headwear</div>
            <div><strong>Accessories:</strong> Bags, bottles, equipment</div>
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>
            Core product details and identification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                data-field="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="1st Rep Performance T-Shirt"
                data-testid="input-product-name"
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-medium">
                SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                data-field="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                placeholder="1REP-TSH-001"
                data-testid="input-product-sku"
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcodeDescriptor" className="text-sm font-medium">
                Barcode Descriptor
              </Label>
              <Input
                id="barcodeDescriptor"
                value={formData.barcodeDescriptor}
                onChange={(e) => setFormData({ ...formData, barcodeDescriptor: e.target.value })}
                placeholder="Custom barcode text/code"
                data-testid="input-product-barcode-descriptor"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">
                Custom text to display on barcodes (optional)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Short Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Premium athletic wear designed for peak performance..."
              data-testid="input-product-description"
            />
            <p className="text-xs text-muted-foreground">
              Brief description shown on product cards (1-2 sentences)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detailedDescription" className="text-sm font-medium">
              Detailed Description
            </Label>
            <RichTextEditor
              content={formData.detailedDescription || ''}
              onChange={(html) => setFormData({ ...formData, detailedDescription: html })}
              placeholder="Full product description with features, benefits, and technical details..."
            />
            <p className="text-xs text-muted-foreground">
              Use the toolbar to add headlines, text colors, highlights, and formatting. Content will be displayed on the product details page.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category & Classification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <CardTitle>Category & Classification</CardTitle>
          </div>
          <CardDescription>
            Select the product section and activity type for proper organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Product Section <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-product-category" data-field="category" className="min-h-11">
                  <SelectValue placeholder="Select where this product appears..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((section: string) => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the homepage section where this product will appear
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityType" className="text-sm font-medium">
                Activity Type
              </Label>
              <Select
                value={formData.activityType}
                onValueChange={(value: any) => 
                  setFormData({ ...formData, activityType: value })
                }
              >
                <SelectTrigger data-testid="select-activity-type" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableActivityTypes.map((type: any) => (
                    <SelectItem key={type.slug} value={type.slug}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="isHeroProduct" className="text-sm font-medium cursor-pointer">
                  Hero Product
                </Label>
                <p className="text-xs text-muted-foreground">
                  Feature this product prominently in its category
                </p>
              </div>
            </div>
            <Switch
              id="isHeroProduct"
              checked={formData.isHeroProduct}
              onCheckedChange={(checked) => setFormData({ ...formData, isHeroProduct: checked })}
              data-testid="switch-hero-product"
            />
          </div>

          <Separator />

          {/* Gender Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Target Gender</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Select which gender section(s) this product should appear in
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'men' as const, label: "Men's" },
                { id: 'women' as const, label: "Women's" },
                { id: 'unisex' as const, label: 'Both (Unisex)' }
              ].map((option) => (
                <div 
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.gender === option.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, gender: option.id })}
                  data-testid={`gender-option-${option.id}`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    formData.gender === option.id 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/50'
                  }`}>
                    {formData.gender === option.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Product Pairing (Outfit Matching) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Pair with Product (Outfit Matching)</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Link this product with a matching item (e.g., pair a sports bra with leggings) so they appear together in the shop
            </p>
            <Select
              value={formData.pairedProductId || "none"}
              onValueChange={(value) => setFormData({ ...formData, pairedProductId: value === "none" ? "" : value })}
            >
              <SelectTrigger className="min-h-11" data-testid="select-paired-product">
                <SelectValue placeholder="Select a product to pair with" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No pairing</SelectItem>
                {allProducts
                  .filter((p) => p.id !== product?.id) // Exclude current product
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {formData.pairedProductId && (
              <p className="text-xs text-primary">
                This product will appear next to its paired item in product listings
              </p>
            )}
          </div>

          <Separator />

          {/* Collections Assignment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Assign to Collections</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Select which collection pages should display this product
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: '1r-collection', label: '1R Collection' },
                { id: 'active-range', label: 'Active Range' }
              ].map((collection) => (
                <div 
                  key={collection.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.collections?.includes(collection.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    const currentCollections = formData.collections || [];
                    if (currentCollections.includes(collection.id)) {
                      setFormData({ 
                        ...formData, 
                        collections: currentCollections.filter(c => c !== collection.id) 
                      });
                    } else {
                      setFormData({ 
                        ...formData, 
                        collections: [...currentCollections, collection.id] 
                      });
                    }
                  }}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    formData.collections?.includes(collection.id) 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/50'
                  }`}>
                    {formData.collections?.includes(collection.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium">{collection.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media & Visuals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <CardTitle>Media & Visuals</CardTitle>
          </div>
          <CardDescription>
            Add product images and videos to showcase your product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Image */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-sm font-medium">
              Primary Image URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              onBlur={(e) => setFormData({ ...formData, imageUrl: convertToDirectImageUrl(e.target.value) })}
              onPaste={(e) => {
                e.preventDefault();
                const pastedUrl = e.clipboardData.getData('text');
                setFormData({ ...formData, imageUrl: convertToDirectImageUrl(pastedUrl) });
              }}
              required
              placeholder="https://example.com/product-image.jpg"
              data-testid="input-image-url"
              className="min-h-11"
            />
            {formData.imageUrl && (
              <div className="mt-2 p-2 border border-border rounded-lg bg-muted/30">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                  }}
                />
              </div>
            )}
          </div>

          {/* Hover Image */}
          <div className="space-y-2">
            <Label htmlFor="hoverImageUrl" className="text-sm font-medium">
              Hover Image URL
            </Label>
            <Input
              id="hoverImageUrl"
              value={formData.hoverImageUrl}
              onChange={(e) => setFormData({ ...formData, hoverImageUrl: e.target.value })}
              onBlur={(e) => setFormData({ ...formData, hoverImageUrl: convertToDirectImageUrl(e.target.value) })}
              onPaste={(e) => {
                e.preventDefault();
                const pastedUrl = e.clipboardData.getData('text');
                setFormData({ ...formData, hoverImageUrl: convertToDirectImageUrl(pastedUrl) });
              }}
              placeholder="https://example.com/product-hover-image.jpg"
              data-testid="input-hover-image-url"
              className="min-h-11"
            />
            <p className="text-xs text-muted-foreground">
              Image shown when users hover over the product card
            </p>
            {formData.hoverImageUrl && (
              <div className="mt-2 p-2 border border-border rounded-lg bg-muted/30">
                <img 
                  src={formData.hoverImageUrl} 
                  alt="Hover image preview"
                  className="max-w-[200px] max-h-[200px] object-contain rounded mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  data-testid="preview-hover-image"
                />
                <p className="text-xs text-center text-muted-foreground mt-1">Hover Image Preview</p>
              </div>
            )}
          </div>

          {/* Additional Images Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Additional Product Images</Label>
            <div className="flex gap-2">
              <Input
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                placeholder="https://example.com/additional-image.jpg"
                className="min-h-11"
                data-testid="input-new-additional-image"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={addImage}
                variant="outline"
                className="min-h-11"
                data-testid="button-add-image"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {additionalImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {additionalImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Additional ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/200x150?text=Invalid+URL";
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity min-h-8 min-w-8"
                      onClick={() => removeImage(index)}
                      data-testid={`button-remove-image-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add multiple images to create a gallery (coming soon: will be stored separately)
            </p>
          </div>

          <Separator />

          {/* Video URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="videoUrl" className="text-sm font-medium">
                Product Video URL
              </Label>
            </div>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              data-testid="input-video-url"
              className="min-h-11"
            />
            <p className="text-xs text-muted-foreground">
              YouTube, Vimeo, or direct video URL for product demonstration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Variants - Sizes & Colors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle>Product Variants</CardTitle>
          </div>
          <CardDescription>
            Define available sizes and colors for this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sizes */}
          <div className="space-y-3" data-section="sizes">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Available Sizes <span className="text-destructive">*</span></Label>
            </div>
            <div className="flex gap-2">
              <Input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="e.g., S, M, L, XL"
                className="min-h-11"
                data-testid="input-new-size"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSize();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={addSize}
                variant="outline"
                className="min-h-11"
                data-testid="button-add-size"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortSizes(formData.sizes).map((size) => (
                <Badge
                  key={size}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                  data-testid={`badge-size-${size}`}
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removeSize(size)}
                    className="ml-2 hover:text-destructive"
                    data-testid={`button-remove-size-${size}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Colors */}
          <div className="space-y-3" data-section="colors">
            <Label className="text-sm font-medium">Available Colours <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="e.g., Black, White, Navy Blue"
                className="min-h-11"
                data-testid="input-new-color"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addColor();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={addColor}
                variant="outline"
                className="min-h-11"
                data-testid="button-add-color"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color) => (
                <Badge
                  key={color}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                  data-testid={`badge-color-${color}`}
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    className="ml-2 hover:text-destructive"
                    data-testid={`button-remove-color-${color}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Color-Specific Images Section */}
            {formData.colors.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Colour-Specific Images</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Add a specific image for each colour. When customers select a colour, this image will be shown.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {formData.colors.map((color) => (
                    <div key={color} className="space-y-3 p-3 bg-background rounded-md border border-border">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-border" 
                          style={{ 
                            backgroundColor: color.toLowerCase().includes('white') ? '#ffffff' :
                                           color.toLowerCase().includes('black') ? '#000000' :
                                           color.toLowerCase().includes('navy') ? '#001f3f' :
                                           color.toLowerCase().includes('red') ? '#dc3545' :
                                           color.toLowerCase().includes('blue') ? '#007bff' :
                                           color.toLowerCase().includes('green') ? '#28a745' :
                                           color.toLowerCase().includes('grey') || color.toLowerCase().includes('gray') ? '#6c757d' :
                                           color.toLowerCase().includes('pink') ? '#e83e8c' :
                                           color.toLowerCase().includes('purple') ? '#6f42c1' :
                                           color.toLowerCase().includes('orange') ? '#fd7e14' :
                                           color.toLowerCase().includes('yellow') ? '#ffc107' :
                                           '#6c757d'
                          }}
                        />
                        <Label className="text-sm font-medium">{color}</Label>
                        {colorImages[color] && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            Image
                          </Badge>
                        )}
                        {colorHoverImages[color] && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                            Hover
                          </Badge>
                        )}
                      </div>
                      
                      {/* Main Image */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Main Image</Label>
                        <Input
                          value={colorImages[color] || ''}
                          onChange={(e) => updateColorImage(color, e.target.value)}
                          placeholder={`Image URL for ${color}`}
                          className="min-h-9 text-sm"
                          data-testid={`input-color-image-${color}`}
                        />
                      </div>
                      
                      {/* Hover Image */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Hover Image (shown on mouseover)</Label>
                        <Input
                          value={colorHoverImages[color] || ''}
                          onChange={(e) => updateColorHoverImage(color, e.target.value)}
                          placeholder={`Hover image URL for ${color}`}
                          className="min-h-9 text-sm"
                          data-testid={`input-color-hover-image-${color}`}
                        />
                      </div>
                      
                      {/* Additional Gallery Images */}
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Additional Gallery Images</Label>
                          <Badge variant="outline" className="text-xs">
                            {(colorAdditionalImages[color] || []).length} images
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id={`add-gallery-${color}`}
                            placeholder={`Add gallery image URL for ${color}`}
                            className="min-h-9 text-sm flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const url = input.value.trim();
                                if (url) {
                                  const currentImages = colorAdditionalImages[color] || [];
                                  setColorAdditionalImages({
                                    ...colorAdditionalImages,
                                    [color]: [...currentImages, convertToDirectImageUrl(url)]
                                  });
                                  input.value = '';
                                }
                              }
                            }}
                            data-testid={`input-add-gallery-${color}`}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById(`add-gallery-${color}`) as HTMLInputElement;
                              const url = input?.value.trim();
                              if (url) {
                                const currentImages = colorAdditionalImages[color] || [];
                                setColorAdditionalImages({
                                  ...colorAdditionalImages,
                                  [color]: [...currentImages, convertToDirectImageUrl(url)]
                                });
                                input.value = '';
                              }
                            }}
                            data-testid={`button-add-gallery-${color}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {/* Gallery Images Preview */}
                        {(colorAdditionalImages[color] || []).length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {(colorAdditionalImages[color] || []).map((imgUrl, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={imgUrl}
                                  alt={`${color} gallery ${idx + 1}`}
                                  className="w-full h-16 object-cover rounded-md border border-border"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/100x60?text=Invalid";
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-1 -right-1 h-5 w-5"
                                  onClick={() => {
                                    const currentImages = colorAdditionalImages[color] || [];
                                    setColorAdditionalImages({
                                      ...colorAdditionalImages,
                                      [color]: currentImages.filter((_, i) => i !== idx)
                                    });
                                  }}
                                  data-testid={`button-remove-gallery-${color}-${idx}`}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Image Previews */}
                      {(colorImages[color] || colorHoverImages[color]) && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {colorImages[color] && (
                            <div className="relative">
                              <p className="text-xs text-muted-foreground mb-1">Main</p>
                              <img
                                src={colorImages[color]}
                                alt={`${color} variant`}
                                className="w-full h-20 object-cover rounded-md border border-border"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/200x100?text=Invalid+URL";
                                }}
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute top-5 right-1 h-5 w-5"
                                onClick={() => updateColorImage(color, '')}
                                data-testid={`button-remove-color-image-${color}`}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {colorHoverImages[color] && (
                            <div className="relative">
                              <p className="text-xs text-muted-foreground mb-1">Hover</p>
                              <img
                                src={colorHoverImages[color]}
                                alt={`${color} hover variant`}
                                className="w-full h-20 object-cover rounded-md border border-blue-200"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/200x100?text=Invalid+URL";
                                }}
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute top-5 right-1 h-5 w-5"
                                onClick={() => updateColorHoverImage(color, '')}
                                data-testid={`button-remove-color-hover-image-${color}`}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Color-Size Availability Matrix */}
            {formData.colors.length > 0 && formData.sizes.length > 0 && (
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Size Availability Per Colour</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Select which sizes are available for each colour. For example, if Black is only available in Small and XL, only check those sizes for Black.
                </p>
                <div className="space-y-4">
                  {formData.colors.map((color) => {
                    const colorSizes = colorSizeAvailability[color] || [];
                    const allSelected = colorSizes.length === formData.sizes.length;
                    const someSelected = colorSizes.length > 0 && colorSizes.length < formData.sizes.length;
                    
                    return (
                      <div key={color} className="p-3 bg-background rounded-md border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-border" 
                              style={{ 
                                backgroundColor: color.toLowerCase().includes('white') ? '#ffffff' :
                                               color.toLowerCase().includes('black') ? '#000000' :
                                               color.toLowerCase().includes('navy') ? '#001f3f' :
                                               color.toLowerCase().includes('red') ? '#dc3545' :
                                               color.toLowerCase().includes('blue') ? '#007bff' :
                                               color.toLowerCase().includes('green') ? '#28a745' :
                                               color.toLowerCase().includes('grey') || color.toLowerCase().includes('gray') ? '#6c757d' :
                                               color.toLowerCase().includes('pink') ? '#e83e8c' :
                                               color.toLowerCase().includes('purple') ? '#6f42c1' :
                                               color.toLowerCase().includes('orange') ? '#fd7e14' :
                                               color.toLowerCase().includes('yellow') ? '#ffc107' :
                                               '#6c757d'
                              }}
                            />
                            <Label className="text-sm font-medium">{color}</Label>
                            <Badge variant="outline" className="text-xs">
                              {colorSizes.length} of {formData.sizes.length} sizes
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAllSizesForColor(color)}
                            className="text-xs"
                            data-testid={`button-toggle-all-sizes-${color}`}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {sortSizes(formData.sizes).map((size) => {
                            const isSelected = colorSizes.includes(size);
                            return (
                              <Button
                                key={`${color}-${size}`}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSizeForColor(color, size)}
                                className={`min-w-[3rem] ${isSelected ? '' : 'opacity-50'}`}
                                data-testid={`button-size-${color}-${size}`}
                              >
                                {size}
                              </Button>
                            );
                          })}
                        </div>
                        
                        {/* Variant-specific pricing for selected sizes */}
                        {colorSizes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-3">
                              Custom pricing for {color} variants (leave blank to use default product price):
                            </p>
                            <div className="space-y-3">
                              {colorSizes.map((size) => {
                                const variantKey = `${color}|${size}`;
                                const pricing = variantPricing[variantKey] || {};
                                return (
                                  <div key={variantKey} className="p-2 bg-muted/30 rounded border border-border/30">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="text-xs">{color} - {size}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Retail £</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder={formData.retailPrice || "Default"}
                                          value={pricing.retailPrice || ''}
                                          onChange={(e) => setVariantPricing(prev => ({
                                            ...prev,
                                            [variantKey]: { ...prev[variantKey], retailPrice: e.target.value }
                                          }))}
                                          className="h-8 text-sm"
                                          data-testid={`input-variant-retail-${color}-${size}`}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground text-green-600">Sale £</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="No sale"
                                          value={pricing.salePrice || ''}
                                          onChange={(e) => setVariantPricing(prev => ({
                                            ...prev,
                                            [variantKey]: { ...prev[variantKey], salePrice: e.target.value }
                                          }))}
                                          className="h-8 text-sm border-green-500/30"
                                          data-testid={`input-variant-sale-${color}-${size}`}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Wholesale £</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder={formData.wholesalePrice || "Default"}
                                          value={pricing.wholesalePrice || ''}
                                          onChange={(e) => setVariantPricing(prev => ({
                                            ...prev,
                                            [variantKey]: { ...prev[variantKey], wholesalePrice: e.target.value }
                                          }))}
                                          className="h-8 text-sm"
                                          data-testid={`input-variant-wholesale-${color}-${size}`}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground text-blue-600">Reseller Sale £</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="No sale"
                                          value={pricing.wholesaleSalePrice || ''}
                                          onChange={(e) => setVariantPricing(prev => ({
                                            ...prev,
                                            [variantKey]: { ...prev[variantKey], wholesaleSalePrice: e.target.value }
                                          }))}
                                          className="h-8 text-sm border-blue-500/30"
                                          data-testid={`input-variant-wholesale-sale-${color}-${size}`}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Cost £</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder={formData.costPrice || "Default"}
                                          value={pricing.costPrice || ''}
                                          onChange={(e) => setVariantPricing(prev => ({
                                            ...prev,
                                            [variantKey]: { ...prev[variantKey], costPrice: e.target.value }
                                          }))}
                                          className="h-8 text-sm"
                                          data-testid={`input-variant-cost-${color}-${size}`}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Barcode ID</Label>
                                        <Input
                                          type="text"
                                          placeholder="Auto"
                                          value={pricing.barcodeDescriptor || ''}
                                          onChange={(e) => setVariantPricing(prev => ({
                                            ...prev,
                                            [variantKey]: { ...prev[variantKey], barcodeDescriptor: e.target.value }
                                          }))}
                                          className="h-8 text-sm"
                                          data-testid={`input-variant-barcode-${color}-${size}`}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Availability</Label>
                                        <Select
                                          value={pricing.status || 'available'}
                                          onValueChange={(value) => setVariantPricing(prev => ({
                                            ...prev,
                                            [variantKey]: { ...prev[variantKey], status: value as any }
                                          }))}
                                        >
                                          <SelectTrigger className={`h-8 text-sm ${
                                            pricing.status === 'coming_soon' ? 'border-amber-500/50 text-amber-400' :
                                            pricing.status === 'pre_order' ? 'border-blue-500/50 text-blue-400' :
                                            pricing.status === 'out_of_stock' ? 'border-red-500/50 text-red-400' :
                                            ''
                                          }`} data-testid={`select-variant-status-${color}-${size}`}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="available">
                                              <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                In Stock
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="coming_soon">
                                              <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                Coming Soon
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="pre_order">
                                              <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                Pre-Order
                                              </span>
                                            </SelectItem>
                                            <SelectItem value="out_of_stock">
                                              <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                Out of Stock
                                              </span>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <CardTitle>Pricing</CardTitle>
          </div>
          <CardDescription>
            Set retail, wholesale, and cost prices for this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retailPrice" className="text-sm font-medium">
                Retail Price (£) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="retailPrice"
                data-field="retailPrice"
                type="number"
                step="0.01"
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                required
                placeholder="29.99"
                data-testid="input-retail-price"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">Full price</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-sm font-medium">
                Sale Price (£)
              </Label>
              <Input
                id="salePrice"
                data-field="salePrice"
                type="number"
                step="0.01"
                value={formData.salePrice || ""}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value || undefined })}
                placeholder="24.99"
                data-testid="input-sale-price"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">
                {formData.salePrice && formData.retailPrice && parseFloat(formData.retailPrice) > 0 && parseFloat(formData.salePrice) < parseFloat(formData.retailPrice) ? (
                  <span className="text-green-600 font-medium">
                    {Math.round((1 - parseFloat(formData.salePrice) / parseFloat(formData.retailPrice)) * 100)}% OFF
                  </span>
                ) : (
                  "Leave empty if not on sale"
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesalePrice" className="text-sm font-medium">
                Wholesale Price (£) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wholesalePrice"
                data-field="wholesalePrice"
                type="number"
                step="0.01"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                required
                placeholder="19.99"
                data-testid="input-wholesale-price"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">Reseller price</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesaleSalePrice" className="text-sm font-medium">
                Wholesale Sale Price (£)
              </Label>
              <Input
                id="wholesaleSalePrice"
                data-field="wholesaleSalePrice"
                type="number"
                step="0.01"
                value={formData.wholesaleSalePrice || ""}
                onChange={(e) => setFormData({ ...formData, wholesaleSalePrice: e.target.value || undefined })}
                placeholder="17.99"
                data-testid="input-wholesale-sale-price"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">
                {formData.wholesaleSalePrice && formData.wholesalePrice && parseFloat(formData.wholesalePrice) > 0 && parseFloat(formData.wholesaleSalePrice) < parseFloat(formData.wholesalePrice) ? (
                  <span className="text-green-600 font-medium">
                    {Math.round((1 - parseFloat(formData.wholesaleSalePrice) / parseFloat(formData.wholesalePrice)) * 100)}% OFF for resellers
                  </span>
                ) : (
                  "Leave empty if no reseller sale"
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice" className="text-sm font-medium">
                Cost Price (£) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="costPrice"
                data-field="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                required
                placeholder="12.99"
                data-testid="input-cost-price"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">Your cost</p>
            </div>
          </div>

          {/* Profit Margin Indicator */}
          {formData.retailPrice && formData.costPrice && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Retail Margin:</span>
                <span className="text-sm font-medium">
                  {((parseFloat(formData.retailPrice) - parseFloat(formData.costPrice)) / parseFloat(formData.retailPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Wholesale Margin:</span>
                <span className="text-sm font-medium">
                  {((parseFloat(formData.wholesalePrice) - parseFloat(formData.costPrice)) / parseFloat(formData.wholesalePrice) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Partner Storefront Pricing */}
          <Separator className="my-4" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Partner Storefront Settings</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Set the commission rate and preset price for resellers and vendors selling this product
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partnerCommissionRate" className="text-sm font-medium">
                Partner Commission Rate (%)
              </Label>
              <Input
                id="partnerCommissionRate"
                data-field="partnerCommissionRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.partnerCommissionRate || "10.00"}
                onChange={(e) => setFormData({ ...formData, partnerCommissionRate: e.target.value })}
                placeholder="10.00"
                data-testid="input-partner-commission-rate"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">Commission % partners earn when selling this product</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerStorefrontPrice" className="text-sm font-medium">
                Partner Storefront Price (£)
              </Label>
              <Input
                id="partnerStorefrontPrice"
                data-field="partnerStorefrontPrice"
                type="number"
                step="0.01"
                value={formData.partnerStorefrontPrice || ""}
                onChange={(e) => setFormData({ ...formData, partnerStorefrontPrice: e.target.value })}
                placeholder={formData.retailPrice || "Use retail price"}
                data-testid="input-partner-storefront-price"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">Preset price for partner stores (leave empty to use retail price)</p>
            </div>
          </div>

          {/* Partner Earnings Preview */}
          {formData.partnerCommissionRate && (formData.partnerStorefrontPrice || formData.retailPrice) && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Partner earns per sale:</span>
                <span className="text-sm font-medium text-primary">
                  £{(parseFloat(formData.partnerStorefrontPrice || formData.retailPrice) * parseFloat(formData.partnerCommissionRate) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details & Features */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Product Details & Features</CardTitle>
          </div>
          <CardDescription>
            Additional information about materials, care, and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Key Features</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="e.g., Moisture-wicking fabric"
                className="min-h-11"
                data-testid="input-new-feature"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={addFeature}
                variant="outline"
                className="min-h-11"
                data-testid="button-add-feature"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {(formData.features || []).map((feature, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleFeatureDragStart(e, index)}
                  onDragOver={(e) => handleFeatureDragOver(e, index)}
                  onDrop={(e) => handleFeatureDrop(e, index)}
                  onDragEnd={handleFeatureDragEnd}
                  className={`flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 cursor-move transition-all duration-200 ${
                    draggedFeatureIndex === index ? 'opacity-50 border-primary' : 'hover:border-primary/50'
                  }`}
                  data-testid={`feature-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{feature}</span>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFeature(feature)}
                    className="min-h-8 min-w-8"
                    data-testid={`button-remove-feature-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Materials */}
          <div className="space-y-2">
            <Label htmlFor="materials" className="text-sm font-medium">
              Materials & Fabric Composition
            </Label>
            <Textarea
              id="materials"
              value={formData.materials}
              onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
              rows={2}
              placeholder="e.g., 92% Polyester, 8% Elastane"
              data-testid="input-materials"
            />
          </div>

          {/* Care Instructions */}
          <div className="space-y-2">
            <Label htmlFor="careInstructions" className="text-sm font-medium">
              Care Instructions
            </Label>
            <Textarea
              id="careInstructions"
              value={formData.careInstructions}
              onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
              rows={3}
              placeholder="Machine wash cold, tumble dry low..."
              data-testid="input-care-instructions"
            />
          </div>

          <Separator />

          {/* Model Information */}
          <div className="space-y-2">
            <Label htmlFor="modelInfo" className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Model Information
            </Label>
            <Textarea
              id="modelInfo"
              value={formData.modelInfo || ""}
              onChange={(e) => setFormData({ ...formData, modelInfo: e.target.value })}
              rows={2}
              placeholder="Model is 6'1&quot; / 185cm, chest 40&quot; / 102cm, wearing size L"
              data-testid="input-model-info"
            />
            <p className="text-xs text-muted-foreground">
              Add details about the model in the product photos (height, measurements, size worn)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Existing Variants Management - Only show when editing */}
      {product?.id && existingVariants.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle>Existing Variants</CardTitle>
            </div>
            <CardDescription>
              Manage existing product variants. You can delete unwanted variants here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
                <span>Colour</span>
                <span>Size</span>
                <span>SKU</span>
                <span>Price</span>
                <span className="text-right">Actions</span>
              </div>
              {[...existingVariants].sort((a, b) => {
                // First sort by color, then by size order
                const colorCompare = a.color.localeCompare(b.color);
                if (colorCompare !== 0) return colorCompare;
                const sizeOrderA = SIZE_ORDER[a.size.toUpperCase()] ?? 999;
                const sizeOrderB = SIZE_ORDER[b.size.toUpperCase()] ?? 999;
                return sizeOrderA - sizeOrderB;
              }).map((variant) => (
                <div 
                  key={variant.id} 
                  className="grid grid-cols-5 gap-4 items-center py-2 border-b border-border/50 last:border-0"
                  data-testid={`variant-row-${variant.id}`}
                >
                  <span className="text-sm font-medium">{variant.color}</span>
                  <span className="text-sm">{variant.size}</span>
                  <span className="text-sm text-muted-foreground">{variant.sku || '-'}</span>
                  <span className="text-sm">£{variant.retailPrice || '-'}</span>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVariant(variant.id, variant.color, variant.size)}
                      disabled={deleteVariantMutation.isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`button-delete-variant-${variant.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Warning: Deleting a variant will permanently remove it and any associated stock data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status & Availability */}      {/* Status & Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle>Status & Availability</CardTitle>
          </div>
          <CardDescription>
            Control product visibility and availability status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availabilityStatus" className="text-sm font-medium">
                Availability Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.availabilityStatus}
                onValueChange={(value: 'available' | 'upcoming' | 'out_of_stock' | 'discontinued') => 
                  setFormData({ ...formData, availabilityStatus: value })
                }
              >
                <SelectTrigger data-testid="select-availability-status" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div>
                <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                  Product Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show product on website
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          data-testid="button-cancel-product"
          className="min-h-11"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saveMutation.isPending}
          data-testid="button-save-product"
          className="min-h-11"
        >
          {saveMutation.isPending ? (
            <>
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
              Saving...
            </>
          ) : (
            <>
              {product ? "Update Product" : "Create Product"}
            </>
          )}
        </Button>
      </div>

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete Variant Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to permanently delete the{" "}
                <strong>{variantToDelete?.color} - {variantToDelete?.size}</strong> variant.
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone. All associated stock data will be lost.
              </p>
              <p>
                To confirm, please type <strong>DELETE</strong> below:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE to confirm"
                className="mt-2"
                data-testid="input-delete-confirm"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteConfirmOpen(false);
                setVariantToDelete(null);
                setDeleteConfirmText("");
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVariant}
              disabled={deleteConfirmText !== "DELETE" || deleteVariantMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteVariantMutation.isPending ? "Deleting..." : "Delete Variant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
