import { useState, useEffect } from 'react';
import { useARCamera } from '@/hooks/useARCamera';
import ARGarmentOverlay from './ARGarmentOverlay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Camera,
  RotateCw,
  Shirt,
  Minimize2,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface VirtualTryOnProps {
  productId?: string;
  productName?: string;
  defaultGarmentType?: 'tshirt' | 'leggings' | 'jacket' | 'sports-bra';
  defaultColor?: string;
  onClose: () => void;
}

export default function VirtualTryOn({
  productId,
  productName,
  defaultGarmentType = 'tshirt',
  defaultColor = '#000000',
  onClose,
}: VirtualTryOnProps) {
  const {
    isLoading,
    isActive,
    error,
    landmarks,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
  } = useARCamera();

  const [garmentType, setGarmentType] = useState<'tshirt' | 'leggings' | 'jacket' | 'sports-bra' | null>(
    defaultGarmentType
  );
  const [garmentColor, setGarmentColor] = useState(defaultColor);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 720 });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);

  // Start camera on mount (wait for video element to be ready)
  useEffect(() => {
    // Small delay to ensure video element is mounted in the DOM
    const timer = setTimeout(() => {
      startCamera();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Update canvas size based on window
  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(window.innerWidth, 1280);
      const height = Math.min(window.innerHeight, 720);
      setCanvasSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleCapture = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setCapturedImage(dataUrl);
      setIsCaptured(true);

      // Auto-hide capture confirmation after 2 seconds
      setTimeout(() => setIsCaptured(false), 2000);
    }
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `1stRep-AR-TryOn-${Date.now()}.png`;
      link.href = capturedImage;
      link.click();
    }
  };

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-white">AR Virtual Try-On</h2>
              {productName && (
                <p className="text-sm text-white/80 mt-1">{productName}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              data-testid="button-close-ar"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Main AR View */}
        <div className="flex-1 flex items-center justify-center relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
              <Card className="p-6 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">Initializing AR Camera...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please allow camera access
                </p>
              </Card>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30 p-4">
              <Card className="p-6 max-w-lg max-h-[90vh] overflow-y-auto">
                <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    <strong>Camera Error</strong>
                    <p className="mt-2">{error}</p>
                  </AlertDescription>
                </Alert>

                {/* Camera Permission Instructions */}
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">📸 How to Enable Camera Access:</h3>
                    <div className="space-y-3 text-sm">
                      {/* Chrome/Edge Instructions */}
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium mb-1">Chrome / Edge / Brave:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Click the camera icon 🎥 in the address bar (top right)</li>
                          <li>Select "Allow" for camera access</li>
                          <li>Click "Retry" below</li>
                        </ol>
                      </div>

                      {/* Firefox Instructions */}
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium mb-1">Firefox:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Click the permissions icon in the address bar</li>
                          <li>Find "Use the Camera" and select "Allow"</li>
                          <li>Click "Retry" below</li>
                        </ol>
                      </div>

                      {/* Safari Instructions */}
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium mb-1">Safari:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Go to Safari → Settings → Websites → Camera</li>
                          <li>Set this website to "Allow"</li>
                          <li>Refresh the page and try again</li>
                        </ol>
                      </div>

                      {/* Mobile Instructions */}
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="font-medium mb-1">Mobile (iOS/Android):</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Go to your phone Settings → Apps → Browser</li>
                          <li>Tap Permissions → Camera → Allow</li>
                          <li>Return to this page and click "Retry"</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Tip:</strong> After granting permission, you may need to refresh the page or click "Retry" below.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={startCamera} 
                    variant="default" 
                    className="flex-1"
                    data-testid="button-retry-camera"
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button 
                    onClick={onClose} 
                    variant="outline"
                    className="flex-1" 
                    data-testid="button-close-error"
                  >
                    Close
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Single Video Element - always rendered, visibility controlled */}
          <div className="relative">
            {/* Canvas for MediaPipe pose overlay */}
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="max-w-full max-h-screen rounded-lg shadow-2xl"
              style={{
                display: showLandmarks ? 'block' : 'none',
              }}
              data-testid="ar-canvas-pose"
            />

            {/* Video Element - always rendered, styled based on mode */}
            <div 
              className="relative" 
              style={{ 
                width: canvasSize.width, 
                height: canvasSize.height,
                display: (!isActive || showLandmarks) ? 'none' : 'block'
              }}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full rounded-lg shadow-2xl"
                playsInline
                muted
                autoPlay
                style={{ transform: 'scaleX(-1)' }}
                data-testid="ar-video-element"
              />
              {isActive && videoRef.current && (
                <ARGarmentOverlay
                  landmarks={landmarks}
                  garmentType={garmentType}
                  garmentColor={garmentColor}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  videoElement={videoRef.current}
                />
              )}
            </div>
          </div>

          {/* Capture Success Notification */}
          {isCaptured && (
            <div className="absolute top-24 right-8 z-30">
              <Card className="p-4 bg-green-500 text-white border-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Photo Captured!</span>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Garment Selection */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge className="text-xs text-white/60">Select Garment:</Badge>
              <Button
                variant={garmentType === 'tshirt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGarmentType('tshirt')}
                className={garmentType === 'tshirt' ? '' : 'text-white border-white/30'}
                data-testid="button-select-tshirt"
              >
                <Shirt className="w-4 h-4 mr-2" />
                T-Shirt
              </Button>
              <Button
                variant={garmentType === 'leggings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGarmentType('leggings')}
                className={garmentType === 'leggings' ? '' : 'text-white border-white/30'}
                data-testid="button-select-leggings"
              >
                Leggings
              </Button>
              <Button
                variant={garmentType === 'jacket' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGarmentType('jacket')}
                className={garmentType === 'jacket' ? '' : 'text-white border-white/30'}
                data-testid="button-select-jacket"
              >
                Jacket
              </Button>
              <Button
                variant={garmentType === 'sports-bra' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGarmentType('sports-bra')}
                className={garmentType === 'sports-bra' ? '' : 'text-white border-white/30'}
                data-testid="button-select-sportsbra"
              >
                Sports Bra
              </Button>
            </div>

            {/* Colour Selection */}
            <div className="flex flex-wrap gap-2 justify-center items-center">
              <Badge className="text-xs text-white/60">Colour:</Badge>
              {['#000000', '#FFFFFF', '#1E3A8A', '#DC2626', '#16A34A', '#9333EA'].map((color) => (
                <button
                  key={color}
                  onClick={() => setGarmentColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    garmentColor === color ? 'border-white scale-110' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: color }}
                  data-testid={`button-color-${color}`}
                  aria-label={`Select colour ${color}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleCapture}
                disabled={!isActive}
                className="text-white border-white/30 hover:bg-white/20"
                data-testid="button-capture"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
              {capturedImage && (
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="text-white border-white/30 hover:bg-white/20"
                  data-testid="button-download"
                >
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowLandmarks(!showLandmarks)}
                className="text-white border-white/30 hover:bg-white/20"
                data-testid="button-toggle-landmarks"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                {showLandmarks ? 'Hide' : 'Show'} Pose
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-center">
              <p className="text-sm text-white/60">
                Stand 2-3 feet from camera • Ensure good lighting • Select garment and color
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
