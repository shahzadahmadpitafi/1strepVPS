import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanBarcode, Volume2, VolumeX, CheckCircle, AlertCircle, Package } from "lucide-react";

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

interface HardwareBarcodeScannerProps {
  onProductScanned: (product: ScannedProduct, quantity: number) => void;
  onError?: (error: string) => void;
  autoFocus?: boolean;
  showPackInfo?: boolean;
}

export default function HardwareBarcodeScanner({ 
  onProductScanned, 
  onError,
  autoFocus = true,
  showPackInfo = true
}: HardwareBarcodeScannerProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState<ScannedProduct | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    successAudioRef.current = new Audio("data:audio/wav;base64,UklGRl9vT19NkRBU");
    errorAudioRef.current = new Audio("data:audio/wav;base64,UklGRl9vT19NkRBU");
  }, []);

  const playSound = useCallback((type: 'success' | 'error') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [soundEnabled]);

  const processBarcode = useCallback(async (scannedBarcode: string) => {
    if (!scannedBarcode.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/admin/inventory/search?query=${encodeURIComponent(scannedBarcode.trim())}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        playSound('error');
        const errorMsg = `Product not found: ${scannedBarcode}`;
        toast({
          title: "Product Not Found",
          description: errorMsg,
          variant: "destructive"
        });
        onError?.(errorMsg);
        setLastScanned(null);
        return;
      }
      
      const product: ScannedProduct = await response.json();
      const packQty = product.packQuantity || 1;
      
      playSound('success');
      setLastScanned(product);
      setScanCount(prev => prev + 1);
      
      toast({
        title: "Product Scanned",
        description: `${product.productName} - ${packQty > 1 ? `Pack of ${packQty}` : 'Single item'}`
      });
      
      onProductScanned(product, packQty);
      
    } catch (error) {
      playSound('error');
      const errorMsg = error instanceof Error ? error.message : "Failed to process barcode";
      toast({
        title: "Scan Error",
        description: errorMsg,
        variant: "destructive"
      });
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      setBarcode("");
      inputRef.current?.focus();
    }
  }, [isProcessing, onProductScanned, onError, playSound, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 3) {
        processBarcode(value);
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      processBarcode(barcode);
    }
  };

  const handleManualSubmit = () => {
    if (barcode.trim()) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      processBarcode(barcode);
    }
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !e.ctrlKey && !e.metaKey && !e.altKey
      ) {
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Hardware Barcode Scanner</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              {scanCount} scanned
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSoundEnabled(!soundEnabled)}
              data-testid="button-toggle-sound"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          Connect your USB or Bluetooth barcode scanner and scan products. The scanner types barcodes like a keyboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="barcode-input">Scan or Enter Barcode/SKU</Label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              id="barcode-input"
              value={barcode}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ready for scan... (or type manually)"
              className="font-mono text-lg"
              disabled={isProcessing}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-testid="input-hardware-barcode"
            />
            <Button 
              onClick={handleManualSubmit}
              disabled={isProcessing || !barcode.trim()}
              data-testid="button-manual-lookup"
            >
              {isProcessing ? "Processing..." : "Look Up"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Just scan - the barcode will be processed automatically. Press Enter for manual entry.
          </p>
        </div>

        {lastScanned && showPackInfo && (
          <div className="p-4 rounded-lg bg-accent/50 border border-accent space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">{lastScanned.productName}</h4>
                <p className="text-sm text-muted-foreground">
                  SKU: {lastScanned.sku}
                  {lastScanned.size && ` | Size: ${lastScanned.size}`}
                  {lastScanned.color && ` | Colour: ${lastScanned.color}`}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {lastScanned.packQuantity > 1 ? (
                    <Badge variant="default" className="gap-1">
                      Pack of {lastScanned.packQuantity}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Single Item</Badge>
                  )}
                </span>
              </div>
              <div className="text-sm">
                Current Stock: <span className="font-semibold">{lastScanned.stockQuantity}</span>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Processing barcode...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
