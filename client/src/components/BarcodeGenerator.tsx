import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Barcode, Download, Search, FileImage, FileText, ChevronDown, Package } from "lucide-react";
import jsPDF from "jspdf";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcodeDescriptor?: string;
  imageUrl?: string;
};

type Variant = {
  id: string;
  sku: string;
  barcodeDescriptor?: string;
  size?: string;
  color?: string;
  price: number;
  packQuantity?: number;
};

type ProductWithVariants = {
  product: Product;
  variants: Variant[];
};

export default function BarcodeGenerator() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: productsData = [], isLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/admin/products/barcodes/list"],
  });

  const filteredData = productsData.filter((item) =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.product.barcodeDescriptor && item.product.barcodeDescriptor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.variants.some(v => 
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.barcodeDescriptor && v.barcodeDescriptor.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const fetchBarcodeSVG = async (variantId: string): Promise<string> => {
    const response = await fetch(`/api/admin/products/barcodes/${variantId}`);
    if (!response.ok) throw new Error("Failed to fetch barcode");
    return await response.text();
  };

  const downloadAsSVG = async (variant: Variant, productName: string) => {
    try {
      const svgText = await fetchBarcodeSVG(variant.id);
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `barcode-${variant.sku}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `SVG barcode downloaded for ${productName}`
      });
    } catch (error) {
      console.error("SVG download error:", error);
      toast({
        title: "Error",
        description: "Failed to download SVG barcode",
        variant: "destructive"
      });
    }
  };

  const svgToCanvas = async (svgText: string): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas not supported");
    
    const svgBase64 = btoa(unescape(encodeURIComponent(svgText)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.scale(scale, scale);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = dataUrl;
    });
    
    return canvas;
  };

  const downloadAsPNG = async (variant: Variant, productName: string) => {
    try {
      const svgText = await fetchBarcodeSVG(variant.id);
      const canvas = await svgToCanvas(svgText);
      
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `barcode-${variant.sku}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `PNG barcode downloaded for ${productName}`
      });
    } catch (error) {
      console.error("PNG download error:", error);
      toast({
        title: "Error",
        description: "Failed to download PNG barcode. Try SVG format instead.",
        variant: "destructive"
      });
    }
  };

  const downloadAsPDF = async (variant: Variant, productName: string) => {
    try {
      const svgText = await fetchBarcodeSVG(variant.id);
      const canvas = await svgToCanvas(svgText);
      const imgData = canvas.toDataURL('image/png');
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      doc.setFontSize(14);
      doc.text(`Barcode Label`, 10, 15);
      
      doc.setFontSize(10);
      doc.text(`Product: ${productName}`, 10, 25);
      doc.text(`SKU: ${variant.sku}`, 10, 32);
      if (variant.size) doc.text(`Size: ${variant.size}`, 10, 39);
      if (variant.color) doc.text(`Colour: ${variant.color}`, 10, 46);
      if (variant.packQuantity && variant.packQuantity > 1) {
        doc.text(`Pack Quantity: ${variant.packQuantity} items per box`, 10, 53);
      }
      
      const yOffset = variant.packQuantity && variant.packQuantity > 1 ? 60 : 55;
      doc.addImage(imgData, 'PNG', 20, yOffset, 170, 50);
      
      doc.save(`barcode-${variant.sku}.pdf`);
      
      toast({
        title: "Success",
        description: `PDF barcode downloaded for ${productName}`
      });
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF barcode",
        variant: "destructive"
      });
    }
  };

  const handleDownloadMultiplePDF = async () => {
    if (filteredData.length === 0) {
      toast({
        title: "No products",
        description: "Please search for products first",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let yPosition = 10;
      let successCount = 0;
      let isFirstPage = true;

      for (const item of filteredData) {
        for (const variant of item.variants) {
          if (yPosition > 230) {
            doc.addPage();
            yPosition = 10;
          }

          try {
            const svgText = await fetchBarcodeSVG(variant.id);
            const canvas = await svgToCanvas(svgText);
            const imgData = canvas.toDataURL('image/png');

            doc.setFontSize(9);
            doc.text(`${item.product.name}`, 10, yPosition);
            doc.setFontSize(7);
            doc.text(`SKU: ${variant.sku}${variant.packQuantity && variant.packQuantity > 1 ? ` | Pack: ${variant.packQuantity}` : ''}`, 10, yPosition + 5);

            doc.addImage(imgData, 'PNG', 10, yPosition + 10, 190, 40);
            yPosition += 55;
            successCount++;
          } catch (err) {
            console.error(`Failed to process barcode for ${variant.sku}:`, err);
            continue;
          }
        }
      }

      if (successCount > 0) {
        doc.save("barcodes-batch.pdf");
        toast({
          title: "Success",
          description: `Downloaded ${successCount} barcode(s) as PDF`
        });
      } else {
        toast({
          title: "Error",
          description: "No barcodes could be generated",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Batch download error:", error);
      toast({
        title: "Error",
        description: "Failed to download batch barcodes",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Generate Barcodes</CardTitle>
            <CardDescription>Loading products...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Generate Barcodes
          </CardTitle>
          <CardDescription>
            Generate and download scannable Code128 barcodes for your products. 
            These work with any standard USB, Bluetooth, or camera barcode scanner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-barcode-search"
            />
          </div>

          {filteredData.length > 0 && (
            <Button
              onClick={handleDownloadMultiplePDF}
              className="w-full"
              variant="default"
              disabled={isDownloading}
              data-testid="button-download-batch"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? "Generating PDF..." : `Download All as PDF (${filteredData.reduce((acc, item) => acc + item.variants.length, 0)} barcodes)`}
            </Button>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {filteredData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? "No products found" : "No products available"}
              </p>
            ) : (
              filteredData.map((item) => (
                <div key={item.product.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                    {item.product.barcodeDescriptor && (
                      <p className="text-sm text-primary">Barcode: {item.product.barcodeDescriptor}</p>
                    )}
                  </div>

                  {item.variants.length > 0 && (
                    <div className="space-y-2">
                      {item.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between bg-accent/30 p-3 rounded"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {variant.size && `Size: ${variant.size}`}
                                {variant.color && ` / Colour: ${variant.color}`}
                              </p>
                              {variant.packQuantity && variant.packQuantity > 1 && (
                                <Badge variant="secondary" className="gap-1">
                                  <Package className="w-3 h-3" />
                                  Pack of {variant.packQuantity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                            {variant.barcodeDescriptor && (
                              <p className="text-xs text-primary">Barcode: {variant.barcodeDescriptor}</p>
                            )}
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-download-barcode-${variant.id}`}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => downloadAsSVG(variant, item.product.name)}>
                                <FileImage className="w-4 h-4 mr-2" />
                                Download SVG (Vector)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadAsPNG(variant, item.product.name)}>
                                <FileImage className="w-4 h-4 mr-2" />
                                Download PNG (Image)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadAsPDF(variant, item.product.name)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Download PDF (Print)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Barcode Format Information</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Code128</strong> - Industry-standard barcode format</p>
              <p>Compatible with all USB and Bluetooth barcode scanners</p>
              <p>Works with camera-based scanning apps on mobile devices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
