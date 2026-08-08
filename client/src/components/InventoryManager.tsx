import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader } from "@zxing/library";
import Papa from "papaparse";
import { Camera, Upload, Edit, Package, Scan, FileSpreadsheet, Plus, ScanBarcode, CheckCircle, BookOpen, Lightbulb, AlertTriangle, CheckCircle2, ArrowRight, Box, BarChart3, Warehouse, RefreshCw, Shield, Zap } from "lucide-react";
import HardwareBarcodeScanner from "./HardwareBarcodeScanner";

interface InventoryItem {
  sku: string;
  quantity: number;
  supplier?: string;
  location?: string;
  costPerUnit?: string;
  batchNumber?: string;
  notes?: string;
}

interface ScannedProduct {
  id: string;
  sku: string;
  productName: string;
  size?: string;
  color?: string;
  stockQuantity: number;
  packQuantity: number;
  barcodeDescriptor?: string;
}

export default function InventoryManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("guide");
  
  // Hardware scanner state
  const [hardwareScanQueue, setHardwareScanQueue] = useState<{product: ScannedProduct, quantity: number}[]>([]);
  const [usePackQuantity, setUsePackQuantity] = useState(true);
  
  // Camera barcode scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [scanQuantity, setScanQuantity] = useState("1");
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  
  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<InventoryItem[]>([]);
  const [csvPreview, setCsvPreview] = useState<string>("");
  
  // Manual entry state
  const [manualSku, setManualSku] = useState("");
  const [manualQuantity, setManualQuantity] = useState("");
  const [manualSupplier, setManualSupplier] = useState("");
  const [manualLocation, setManualLocation] = useState("Main Warehouse");
  const [manualCost, setManualCost] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  
  // Product search state for manual entry
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ScannedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ScannedProduct | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Initialize camera barcode scanner
  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  // Start actual camera scanning once video element is mounted
  useEffect(() => {
    if (!isScanning || !videoRef.current || !codeReader.current) return;

    const initializeScanning = async () => {
      try {
        try {
          await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
        } catch (permissionError) {
          console.error("Camera permission error:", permissionError);
          toast({
            title: "Camera permission denied",
            description: "Please allow camera access to use the barcode scanner",
            variant: "destructive"
          });
          setIsScanning(false);
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          toast({
            title: "No camera found",
            description: "Please connect a camera or use the hardware scanner / manual entry",
            variant: "destructive"
          });
          setIsScanning(false);
          return;
        }

        const selectedDeviceId = videoDevices[0]?.deviceId;
        await codeReader.current?.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          async (result, error) => {
            if (result) {
              const barcode = result.getText();
              toast({
                title: "Barcode scanned!",
                description: `SKU: ${barcode}`
              });
              
              try {
                const response = await fetch(`/api/admin/inventory/search?query=${encodeURIComponent(barcode)}`, {
                  credentials: 'include'
                });
                if (response.ok) {
                  const product = await response.json();
                  setScannedProduct(product);
                  setScanQuantity(product.packQuantity?.toString() || "1");
                  stopScanning();
                } else {
                  toast({
                    title: "Product not found",
                    description: `No product found with SKU: ${barcode}`,
                    variant: "destructive"
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to search for product",
                  variant: "destructive"
                });
              }
            }
            if (error && error.name !== 'NotFoundException') {
              console.error("Scanner error:", error);
            }
          }
        );
      } catch (error) {
        console.error("Error initializing scanner:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: "Camera error",
          description: `Could not start camera: ${errorMessage}. Try using the hardware scanner instead.`,
          variant: "destructive"
        });
        setIsScanning(false);
      }
    };

    initializeScanning();
  }, [isScanning, toast]);

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  // Add inventory mutation
  const addInventoryMutation = useMutation({
    mutationFn: async (data: {
      variantId: string;
      quantity: number;
      supplier?: string;
      location?: string;
      costPerUnit?: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", "/api/admin/inventory/add", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory/variants"] });
      setScannedProduct(null);
      setScanQuantity("1");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive"
      });
    }
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (items: InventoryItem[]) => {
      return await apiRequest("POST", "/api/admin/inventory/bulk-import", { items });
    },
    onSuccess: (data: any) => {
      const successCount = data.success?.length || 0;
      const failedCount = data.failed?.length || 0;
      
      toast({
        title: "Bulk import completed",
        description: `${successCount} items imported successfully. ${failedCount} items failed.`,
        variant: failedCount > 0 ? "destructive" : "default"
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory/variants"] });
      setCsvFile(null);
      setCsvData([]);
      setCsvPreview("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import inventory",
        variant: "destructive"
      });
    }
  });

  // Handle hardware scanner product scan
  const handleHardwareProductScanned = (product: ScannedProduct, quantity: number) => {
    const actualQuantity = usePackQuantity ? quantity : 1;
    
    setHardwareScanQueue(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + actualQuantity }
            : item
        );
      }
      return [...prev, { product, quantity: actualQuantity }];
    });
  };

  // Submit all hardware scanned items
  const submitHardwareScannedItems = async () => {
    if (hardwareScanQueue.length === 0) return;
    
    let successCount = 0;
    let failCount = 0;
    
    for (const item of hardwareScanQueue) {
      try {
        await apiRequest("POST", "/api/admin/inventory/add", {
          variantId: item.product.id,
          quantity: item.quantity,
          location: "Main Warehouse"
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to add inventory for ${item.product.sku}:`, error);
      }
    }
    
    toast({
      title: failCount > 0 ? "Partial Success" : "Success",
      description: `Added ${successCount} items to inventory. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      variant: failCount > 0 ? "destructive" : "default"
    });
    
    queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory/variants"] });
    setHardwareScanQueue([]);
  };

  // Handle camera scanned product submission
  const handleAddScannedInventory = () => {
    if (!scannedProduct) return;
    
    addInventoryMutation.mutate({
      variantId: scannedProduct.id,
      quantity: parseInt(scanQuantity),
      location: "Main Warehouse"
    });
  };

  // Handle CSV file upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const items = results.data as InventoryItem[];
        setCsvData(items);
        setCsvPreview(`${items.length} items ready to import`);
      },
      error: (error) => {
        toast({
          title: "CSV parse error",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  const handleBulkImport = () => {
    if (csvData.length === 0) return;
    bulkImportMutation.mutate(csvData);
  };

  // Search for products as user types
  const handleProductSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedProduct(null);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchDropdown(true);
    
    try {
      const response = await fetch(`/api/admin/inventory/search-variants?query=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const variants = await response.json();
        setSearchResults(variants);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Select a product from search results
  const handleSelectProduct = (product: ScannedProduct) => {
    setSelectedProduct(product);
    setSearchQuery(`${product.productName} - ${product.color || ''} ${product.size || ''}`);
    setShowSearchDropdown(false);
    setSearchResults([]);
  };

  // Handle manual entry with selected product
  const handleManualEntry = async () => {
    if (!selectedProduct) {
      toast({
        title: "No product selected",
        description: "Please search and select a product first",
        variant: "destructive"
      });
      return;
    }
    
    if (!manualQuantity) {
      toast({
        title: "Missing quantity",
        description: "Please enter the quantity to add",
        variant: "destructive"
      });
      return;
    }

    addInventoryMutation.mutate({
      variantId: selectedProduct.id,
      quantity: parseInt(manualQuantity),
      supplier: manualSupplier || undefined,
      location: manualLocation,
      costPerUnit: manualCost || undefined,
      notes: manualNotes || undefined
    });

    // Clear form
    setSearchQuery("");
    setSelectedProduct(null);
    setManualQuantity("");
    setManualSupplier("");
    setManualLocation("Main Warehouse");
    setManualCost("");
    setManualNotes("");
  };

  const totalQueuedItems = hardwareScanQueue.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">
            Add, track, and manage incoming inventory using barcode scanners
          </p>
        </div>
        <Package className="w-12 h-12 text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="guide" data-testid="tab-guide">
            <BookOpen className="w-4 h-4 mr-2" />
            Guide
          </TabsTrigger>
          <TabsTrigger value="hardware" data-testid="tab-hardware-scanner">
            <ScanBarcode className="w-4 h-4 mr-2" />
            Hardware Scanner
          </TabsTrigger>
          <TabsTrigger value="camera" data-testid="tab-camera-scan">
            <Camera className="w-4 h-4 mr-2" />
            Camera Scanner
          </TabsTrigger>
          <TabsTrigger value="csv" data-testid="tab-csv-upload">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual-entry">
            <Edit className="w-4 h-4 mr-2" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* Comprehensive Inventory Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          {/* Welcome Section */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Inventory Management Guide</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Your complete reference for managing stock efficiently
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to the 1stRep Inventory Management System. This comprehensive guide will walk you through 
                every feature available to help you maintain accurate stock levels, process incoming shipments, 
                and keep your warehouse operations running smoothly.
              </p>
            </CardContent>
          </Card>

          {/* Quick Start Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>Get up and running in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold">Choose Your Input Method</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select from Hardware Scanner, Camera Scanner, CSV Upload, or Manual Entry based on your needs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold">Scan or Enter Products</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scan barcodes or enter SKUs to identify products. The system auto-fills product details.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold">Set Quantities</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter the quantity being added. Use pack quantities for boxed items to save time.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold">Submit to Inventory</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confirm your entries. Stock levels update instantly across all systems.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Methods Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanBarcode className="w-5 h-5 text-blue-500" />
                Input Methods Explained
              </CardTitle>
              <CardDescription>Choose the right method for your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hardware Scanner */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <ScanBarcode className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-lg">Hardware Scanner (Recommended)</h4>
                  <Badge variant="secondary">Fastest</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Connect a USB or Bluetooth barcode scanner for the fastest, most reliable scanning experience. 
                  Perfect for processing large shipments.
                </p>
                <div className="bg-accent/30 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    How It Works:
                  </h5>
                  <ul className="text-sm space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Plug in your USB scanner or pair via Bluetooth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Click in the scan input field to focus it</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Scan barcodes - items are added to the queue automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Review the queue and click "Add All to Inventory" when done</span>
                    </li>
                  </ul>
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500" />
                      <span><strong>Pro Tip:</strong> Enable "Use pack quantity" to automatically add the full box/pack quantity with each scan. Great for receiving pallets of stock!</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Camera Scanner */}
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-lg">Camera Scanner</h4>
                  <Badge variant="outline">Mobile Friendly</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Use your device's camera to scan barcodes. Ideal for mobile devices and quick spot-checks 
                  on the warehouse floor.
                </p>
                <div className="bg-accent/30 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    How It Works:
                  </h5>
                  <ul className="text-sm space-y-2 ml-6">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Click "Start Camera Scanner" and allow camera access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Point your camera at the barcode - keep it steady</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Product details appear automatically when detected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <span>Adjust quantity if needed, then add to inventory</span>
                    </li>
                  </ul>
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 mt-0.5 text-blue-500" />
                      <span><strong>Best Practice:</strong> Ensure good lighting and hold the barcode about 15-20cm from the camera for optimal scanning.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* CSV Upload */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-lg">CSV Bulk Upload</h4>
                  <Badge variant="outline">Bulk Import</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Import hundreds or thousands of inventory records at once using a spreadsheet. 
                  Perfect for initial stock setup or supplier deliveries with manifests.
                </p>
                <div className="bg-accent/30 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    CSV File Format:
                  </h5>
                  <div className="bg-background rounded border p-3 font-mono text-xs overflow-x-auto">
                    <div className="text-muted-foreground mb-1"># Required columns: sku, quantity</div>
                    <div className="text-muted-foreground mb-2"># Optional: supplier, location, costPerUnit, batchNumber, notes</div>
                    <div className="text-foreground">sku,quantity,supplier,location,costPerUnit,notes</div>
                    <div className="text-foreground">PROD-001-BLK-M,50,Supplier A,Main Warehouse,12.50,Spring delivery</div>
                    <div className="text-foreground">PROD-002-WHT-L,25,Supplier B,Secondary,15.00,Restock order</div>
                  </div>
                  <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-sm flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500" />
                      <span><strong>Important:</strong> SKUs must match existing products in your catalogue. Items with unrecognised SKUs will be skipped.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold text-lg">Manual Entry</h4>
                  <Badge variant="outline">Flexible</Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  Type in product SKUs and quantities manually. Useful when barcodes are damaged or 
                  for adding custom notes and supplier information.
                </p>
                <div className="bg-accent/30 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Available Fields:
                  </h5>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">Required</Badge>
                      <span><strong>SKU:</strong> The unique product identifier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">Required</Badge>
                      <span><strong>Quantity:</strong> Number of units to add</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                      <span><strong>Supplier:</strong> Where the stock came from</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                      <span><strong>Location:</strong> Warehouse or shelf location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                      <span><strong>Cost Per Unit:</strong> Your purchase price for profit tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                      <span><strong>Notes:</strong> Any additional information</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pack Quantities Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-500" />
                Understanding Pack Quantities
              </CardTitle>
              <CardDescription>Speed up receiving with box/pack tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Products can have a defined "pack quantity" - the number of individual units in a standard box or pack. 
                This feature dramatically speeds up inventory receiving for boxed goods.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h5 className="font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    With Pack Quantity Enabled
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    Scanning a box of 12 t-shirts adds 12 units to inventory with a single scan. 
                    Scan 10 boxes = 120 items added instantly.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h5 className="font-semibold flex items-center gap-2 mb-2">
                    <Box className="w-4 h-4" />
                    With Pack Quantity Disabled
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    Each scan adds exactly 1 unit regardless of pack size. 
                    Useful when receiving partial boxes or individual items.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-accent/30 rounded-lg">
                <h5 className="font-medium mb-2">Example Scenario:</h5>
                <p className="text-sm text-muted-foreground">
                  You receive a shipment of 5 boxes, each containing 24 water bottles (pack quantity = 24).
                </p>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Pack Mode ON</Badge>
                    <span>5 scans = 120 bottles added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pack Mode OFF</Badge>
                    <span>5 scans = 5 bottles added (would need 120 scans)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Types Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-cyan-500" />
                Supported Barcode Types
              </CardTitle>
              <CardDescription>Compatible with all major barcode formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 rounded-lg bg-accent/30 text-center">
                  <h5 className="font-semibold">Code 128</h5>
                  <p className="text-xs text-muted-foreground mt-1">High-density, alphanumeric</p>
                  <Badge variant="secondary" className="mt-2">Primary Format</Badge>
                </div>
                <div className="p-3 rounded-lg bg-accent/30 text-center">
                  <h5 className="font-semibold">EAN-13 / UPC-A</h5>
                  <p className="text-xs text-muted-foreground mt-1">Retail product codes</p>
                  <Badge variant="outline" className="mt-2">Supported</Badge>
                </div>
                <div className="p-3 rounded-lg bg-accent/30 text-center">
                  <h5 className="font-semibold">QR Codes</h5>
                  <p className="text-xs text-muted-foreground mt-1">2D matrix codes</p>
                  <Badge variant="outline" className="mt-2">Supported</Badge>
                </div>
                <div className="p-3 rounded-lg bg-accent/30 text-center">
                  <h5 className="font-semibold">Code 39</h5>
                  <p className="text-xs text-muted-foreground mt-1">Industrial standard</p>
                  <Badge variant="outline" className="mt-2">Supported</Badge>
                </div>
                <div className="p-3 rounded-lg bg-accent/30 text-center">
                  <h5 className="font-semibold">ITF / Interleaved 2 of 5</h5>
                  <p className="text-xs text-muted-foreground mt-1">Shipping cartons</p>
                  <Badge variant="outline" className="mt-2">Supported</Badge>
                </div>
                <div className="p-3 rounded-lg bg-accent/30 text-center">
                  <h5 className="font-semibold">Data Matrix</h5>
                  <p className="text-xs text-muted-foreground mt-1">Small items, electronics</p>
                  <Badge variant="outline" className="mt-2">Supported</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Best Practices
              </CardTitle>
              <CardDescription>Tips for accurate inventory management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <div className="p-2 rounded-full bg-emerald-500/10">
                    <RefreshCw className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h5 className="font-semibold">Regular Stock Counts</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      Perform cycle counts weekly for high-velocity items and monthly for slower-moving stock. 
                      This catches discrepancies before they become major issues.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <Warehouse className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h5 className="font-semibold">Use Location Tracking</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      Always specify warehouse locations when adding stock. This makes picking orders 
                      faster and helps identify where stock is located during audits.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <div className="p-2 rounded-full bg-orange-500/10">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h5 className="font-semibold">Track Cost Prices</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter cost per unit when receiving stock to enable profit margin analytics. 
                      This data powers the profit reports in your admin dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <div className="p-2 rounded-full bg-purple-500/10">
                    <Package className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h5 className="font-semibold">Verify Before Submitting</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      Always review the scan queue before adding to inventory. It's easier to remove 
                      an item from the queue than to correct a stock count after submission.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Troubleshooting Common Issues
              </CardTitle>
              <CardDescription>Solutions to frequently encountered problems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-accent/30">
                  <h5 className="font-semibold text-red-500">Scanner not detecting barcodes?</h5>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Ensure good lighting - avoid shadows on the barcode</li>
                    <li>Clean the barcode surface if dirty or damaged</li>
                    <li>Hold the scanner 15-30cm from the barcode</li>
                    <li>For camera scanning, keep the device steady</li>
                    <li>Try the Hardware Scanner if camera scanning fails</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-accent/30">
                  <h5 className="font-semibold text-red-500">Product not found error?</h5>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Verify the SKU exists in your product catalogue</li>
                    <li>Check for typos in manually entered SKUs</li>
                    <li>Ensure the barcode is linked to the correct product variant</li>
                    <li>Contact admin to add missing products to the system</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-accent/30">
                  <h5 className="font-semibold text-red-500">CSV import failing?</h5>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Ensure the file is saved as .csv format (not .xlsx)</li>
                    <li>Check column headers match exactly: sku, quantity, etc.</li>
                    <li>Remove any special characters from data fields</li>
                    <li>Verify all SKUs exist in the product catalogue</li>
                    <li>Check for empty rows at the end of the file</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-accent/30">
                  <h5 className="font-semibold text-red-500">Hardware scanner not working?</h5>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Check USB connection or Bluetooth pairing</li>
                    <li>Click inside the scan input field to focus it</li>
                    <li>Ensure scanner is configured for keyboard emulation mode</li>
                    <li>Try unplugging and reconnecting the scanner</li>
                    <li>Test the scanner in a text editor to verify it works</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Get Started CTA */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Ready to Manage Your Inventory?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Choose your preferred method and start adding stock. For fastest results, 
                  we recommend using a hardware barcode scanner with pack quantities enabled.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button onClick={() => setActiveTab("hardware")} data-testid="button-goto-hardware">
                    <ScanBarcode className="w-4 h-4 mr-2" />
                    Start with Hardware Scanner
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("csv")} data-testid="button-goto-csv">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Import CSV File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hardware Scanner Tab (USB/Bluetooth) */}
        <TabsContent value="hardware" className="space-y-4">
          <HardwareBarcodeScanner 
            onProductScanned={handleHardwareProductScanned}
            autoFocus={activeTab === "hardware"}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                <span>Scan Queue</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="use-pack-qty" className="text-sm font-normal cursor-pointer">
                    Use pack quantity
                  </Label>
                  <input 
                    type="checkbox" 
                    id="use-pack-qty"
                    checked={usePackQuantity}
                    onChange={(e) => setUsePackQuantity(e.target.checked)}
                    className="w-4 h-4"
                    data-testid="checkbox-use-pack-quantity"
                  />
                </div>
              </CardTitle>
              <CardDescription>
                {usePackQuantity 
                  ? "Each scan adds the full pack quantity (e.g., box of 12 adds 12 items)"
                  : "Each scan adds 1 item regardless of pack size"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hardwareScanQueue.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No items scanned yet. Scan barcodes to add items to the queue.
                </p>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {hardwareScanQueue.map((item, index) => (
                      <div key={`${item.product.id}-${index}`} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.product.sku} {item.product.size && `| ${item.product.size}`} {item.product.color && `| ${item.product.color}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-lg">
                            x{item.quantity}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setHardwareScanQueue(prev => prev.filter((_, i) => i !== index));
                            }}
                            data-testid={`button-remove-queue-${index}`}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-semibold">Total: {totalQueuedItems} items</p>
                      <p className="text-sm text-muted-foreground">{hardwareScanQueue.length} products</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setHardwareScanQueue([])}
                        data-testid="button-clear-queue"
                      >
                        Clear All
                      </Button>
                      <Button
                        onClick={submitHardwareScannedItems}
                        data-testid="button-submit-queue"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Add All to Inventory
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Scanner Tab */}
        <TabsContent value="camera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Camera Barcode Scanner
              </CardTitle>
              <CardDescription>
                Scan product barcodes using your device camera. Works best on mobile devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isScanning && !scannedProduct && (
                <Button 
                  onClick={startScanning} 
                  size="lg" 
                  className="w-full"
                  data-testid="button-start-scanning"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Camera Scanner
                </Button>
              )}

              {isScanning && (
                <div className="space-y-4">
                  <video 
                    ref={videoRef} 
                    className="w-full h-64 bg-black rounded-lg"
                    autoPlay
                    playsInline
                  />
                  <Button 
                    onClick={stopScanning} 
                    variant="destructive" 
                    className="w-full"
                    data-testid="button-stop-scanning"
                  >
                    Stop Scanner
                  </Button>
                </div>
              )}

              {scannedProduct && (
                <div className="space-y-4 p-4 bg-accent rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{scannedProduct.productName}</h3>
                      {scannedProduct.packQuantity > 1 && (
                        <Badge variant="secondary">
                          <Package className="w-3 h-3 mr-1" />
                          Pack of {scannedProduct.packQuantity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SKU: {scannedProduct.sku} | Size: {scannedProduct.size} | Colour: {scannedProduct.color}
                    </p>
                    <p className="text-sm">
                      Current Stock: <span className="font-semibold">{scannedProduct.stockQuantity}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scan-quantity">Quantity to Add</Label>
                    <Input
                      id="scan-quantity"
                      type="number"
                      min="1"
                      value={scanQuantity}
                      onChange={(e) => setScanQuantity(e.target.value)}
                      data-testid="input-scan-quantity"
                    />
                    {scannedProduct.packQuantity > 1 && (
                      <p className="text-xs text-muted-foreground">
                        Default set to pack quantity ({scannedProduct.packQuantity} items)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddScannedInventory}
                      disabled={addInventoryMutation.isPending}
                      className="flex-1"
                      data-testid="button-add-scanned-inventory"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {addInventoryMutation.isPending ? "Adding..." : "Add to Inventory"}
                    </Button>
                    <Button 
                      onClick={() => {
                        setScannedProduct(null);
                        setScanQuantity("1");
                      }}
                      variant="outline"
                      data-testid="button-scan-another"
                    >
                      Scan Another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Bulk Upload Tab */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                CSV Bulk Upload
              </CardTitle>
              <CardDescription>
                Upload a CSV file with multiple items to import inventory in bulk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CSV File Format</Label>
                <p className="text-sm text-muted-foreground">
                  Required columns: <strong>sku, quantity</strong><br />
                  Optional columns: supplier, location, costPerUnit, batchNumber, notes
                </p>
                <div className="bg-accent p-3 rounded text-sm font-mono">
                  sku,quantity,supplier,location,costPerUnit<br />
                  TANK-001,100,Supplier A,Main Warehouse,15.50<br />
                  SHORT-002,50,Supplier B,Main Warehouse,25.00
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  data-testid="input-csv-file"
                />
              </div>

              {csvPreview && (
                <div className="p-4 bg-accent rounded-lg">
                  <p className="font-semibold">{csvPreview}</p>
                  <Button
                    onClick={handleBulkImport}
                    disabled={bulkImportMutation.isPending}
                    className="mt-4 w-full"
                    data-testid="button-bulk-import"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {bulkImportMutation.isPending ? "Importing..." : "Import All Items"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Quick Manual Entry
              </CardTitle>
              <CardDescription>
                Search for a product by name, colour, or SKU and add inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search with Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="product-search">Search Product *</Label>
                <div className="relative">
                  <Input
                    id="product-search"
                    value={searchQuery}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                    placeholder="Type product name, colour, or SKU to search..."
                    data-testid="input-product-search"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* Search Results Dropdown */}
                  {showSearchDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-accent/50 flex items-center gap-3 border-b border-border/50 last:border-b-0"
                          onClick={() => handleSelectProduct(product)}
                          data-testid={`search-result-${product.id}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.color && <span className="mr-2">Colour: {product.color}</span>}
                              {product.size && <span className="mr-2">Size: {product.size}</span>}
                              <span className="text-xs opacity-70">SKU: {product.sku}</span>
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Stock: {product.stockQuantity || 0}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showSearchDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
                      No products found matching "{searchQuery}"
                    </div>
                  )}
                </div>
                
                {/* Selected Product Display */}
                {selectedProduct && (
                  <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">{selectedProduct.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProduct.color && `Colour: ${selectedProduct.color}`}
                        {selectedProduct.color && selectedProduct.size && ' | '}
                        {selectedProduct.size && `Size: ${selectedProduct.size}`}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null);
                        setSearchQuery("");
                      }}
                      data-testid="button-clear-selection"
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-quantity">Quantity *</Label>
                  <Input
                    id="manual-quantity"
                    type="number"
                    min="1"
                    value={manualQuantity}
                    onChange={(e) => setManualQuantity(e.target.value)}
                    placeholder="100"
                    data-testid="input-manual-quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-supplier">Supplier</Label>
                  <Input
                    id="manual-supplier"
                    value={manualSupplier}
                    onChange={(e) => setManualSupplier(e.target.value)}
                    placeholder="Supplier name"
                    data-testid="input-manual-supplier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-location">Location</Label>
                  <Input
                    id="manual-location"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="Main Warehouse"
                    data-testid="input-manual-location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-cost">Cost Per Unit</Label>
                  <Input
                    id="manual-cost"
                    type="number"
                    step="0.01"
                    value={manualCost}
                    onChange={(e) => setManualCost(e.target.value)}
                    placeholder="15.50"
                    data-testid="input-manual-cost"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-notes">Notes</Label>
                <Textarea
                  id="manual-notes"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Additional notes about this inventory batch"
                  rows={3}
                  data-testid="textarea-manual-notes"
                />
              </div>

              <Button
                onClick={handleManualEntry}
                disabled={addInventoryMutation.isPending}
                className="w-full"
                data-testid="button-manual-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addInventoryMutation.isPending ? "Adding..." : "Add to Inventory"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
