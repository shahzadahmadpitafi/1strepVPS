import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, Camera, X, SwitchCamera, Loader2 } from "lucide-react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
}

export default function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanning = useCallback(async () => {
    try {
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setIsInitializing(true);
      
      // Configure hints for better barcode detection
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      const codeReader = new BrowserMultiFormatReader(hints);
      readerRef.current = codeReader;

      // Get available video devices
      const devices = await codeReader.listVideoInputDevices();
      setAvailableCameras(devices);
      
      // Prefer rear camera on mobile (usually has "back" or "environment" in label)
      let preferredDeviceIndex = 0;
      for (let i = 0; i < devices.length; i++) {
        const label = devices[i].label.toLowerCase();
        if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
          preferredDeviceIndex = i;
          break;
        }
      }
      
      // Use selected camera or preferred camera
      const deviceId = devices[selectedCameraIndex]?.deviceId || devices[preferredDeviceIndex]?.deviceId;

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      setIsInitializing(false);

      // Use continuous decoding for better scanning experience
      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            onScan(barcode);
            setScanning(false);
          }
          // Ignore NotFoundException - it just means no barcode in current frame
          if (err && err.name !== 'NotFoundException') {
            console.log("Scan error:", err.message);
          }
        }
      );
      
    } catch (err) {
      setIsInitializing(false);
      let errorMsg = "Failed to start camera";
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMsg = "Camera access denied. Please allow camera permissions and try again.";
        } else if (err.name === 'NotFoundError') {
          errorMsg = "No camera found on this device.";
        } else if (err.name === 'NotSupportedError') {
          errorMsg = "Camera not supported. Try using HTTPS or a different browser.";
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [onScan, onError, selectedCameraIndex]);

  const switchCamera = () => {
    if (availableCameras.length > 1) {
      setSelectedCameraIndex((prev) => (prev + 1) % availableCameras.length);
    }
  };

  useEffect(() => {
    if (scanning) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [scanning, startScanning, stopScanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="space-y-4">
        {/* Camera Scanner */}
        {scanning && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Initializing camera...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              autoPlay
              muted
            />
            {/* Scanning overlay guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-16 border-2 border-primary rounded-md">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary -translate-x-px -translate-y-px" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary translate-x-px -translate-y-px" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary -translate-x-px translate-y-px" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary translate-x-px translate-y-px" />
              </div>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                Align barcode within the frame
              </p>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-2 right-2 flex gap-2">
              {availableCameras.length > 1 && (
                <Button
                  onClick={switchCamera}
                  variant="secondary"
                  size="icon"
                  className="bg-black/50 hover:bg-black/70"
                  data-testid="button-switch-camera"
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => setScanning(false)}
                variant="destructive"
                size="icon"
                data-testid="button-close-scanner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Scanner Error</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Camera Button */}
        {!scanning && (
          <div className="space-y-2">
            <Button
              onClick={() => setScanning(true)}
              className="w-full min-h-11"
              data-testid="button-start-scanner"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera Scanner
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Tip: Printed barcodes scan more reliably than screen displays
            </p>
          </div>
        )}

        {/* Manual Input */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium mb-2 text-muted-foreground">
            Or enter barcode manually
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              placeholder="Scan or type barcode..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              autoFocus
              data-testid="input-barcode-manual"
            />
            <Button
              type="submit"
              variant="secondary"
              className="min-h-11"
              data-testid="button-submit-barcode"
            >
              Add
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
