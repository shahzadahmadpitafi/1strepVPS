import { useState, useEffect, useRef, useCallback } from 'react';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface ARCameraState {
  isLoading: boolean;
  isActive: boolean;
  error: string | null;
  landmarks: PoseLandmark[] | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

// Declare MediaPipe types on window
declare global {
  interface Window {
    Pose?: any;
    Camera?: any;
  }
}

export function useARCamera() {
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const scriptsLoadedRef = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load MediaPipe scripts dynamically
  const loadMediaPipeScripts = useCallback(async () => {
    if (scriptsLoadedRef.current) {
      console.log('[AR] MediaPipe scripts already loaded');
      return;
    }

    console.log('[AR] Loading MediaPipe scripts...');
    
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MediaPipe scripts failed to load. Please check your internet connection and try again.'));
      }, 10000);

      // Load camera_utils first
      const cameraScript = document.createElement('script');
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      cameraScript.crossOrigin = 'anonymous';
      
      cameraScript.onload = () => {
        console.log('[AR] Camera utils loaded');
        // Then load pose
        const poseScript = document.createElement('script');
        poseScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        poseScript.crossOrigin = 'anonymous';
        
        poseScript.onload = () => {
          console.log('[AR] Pose loaded');
          clearTimeout(timeout);
          scriptsLoadedRef.current = true;
          resolve();
        };
        
        poseScript.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load MediaPipe Pose library. Please check your internet connection.'));
        };
        
        document.head.appendChild(poseScript);
      };
      
      cameraScript.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load MediaPipe Camera library. Please check your internet connection.'));
      };
      
      document.head.appendChild(cameraScript);
    });
  }, []);

  const onResults = useCallback((results: any) => {
    if (results.poseLandmarks) {
      setLandmarks(results.poseLandmarks as PoseLandmark[]);
    }

    // Draw pose on canvas
    if (canvasRef.current) {
      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx && videoRef.current) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Draw video frame
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        // Draw pose landmarks (optional - can be toggled)
        if (results.poseLandmarks) {
          drawLandmarks(canvasCtx, results.poseLandmarks, canvasRef.current);
        }

        canvasCtx.restore();
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    console.log('[AR] Starting camera initialization...');
    setIsLoading(true);
    setError(null);

    // Set a master timeout for the entire initialization
    initTimeoutRef.current = setTimeout(() => {
      console.error('[AR] Master timeout reached');
      setError('Camera initialization timed out. Please grant camera permissions and try again.');
      setIsLoading(false);
    }, 20000); // 20 second master timeout

    try {
      // Check if MediaPipe is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device or browser. Please use a modern browser like Chrome, Edge, or Safari.');
      }

      console.log('[AR] Browser supports camera');

      // Load MediaPipe scripts
      await loadMediaPipeScripts();
      console.log('[AR] Scripts loaded successfully');

      // Wait a bit for scripts to fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if Pose is available
      if (!window.Pose) {
        throw new Error('MediaPipe Pose library failed to initialize. Please refresh the page and try again.');
      }

      // Check if Camera is available
      if (!window.Camera) {
        throw new Error('MediaPipe Camera library failed to initialize. Please refresh the page and try again.');
      }

      console.log('[AR] Initializing Pose detector...');

      // Initialize MediaPipe Pose
      const pose = new window.Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      await pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onResults);
      poseRef.current = pose;

      console.log('[AR] Pose detector initialized');

      // Ensure video element exists
      if (!videoRef.current) {
        console.error('[AR] Video element is null');
        throw new Error('Video element not ready. Please try again.');
      }

      console.log('[AR] Video element ready:', videoRef.current);
      console.log('[AR] window.Camera available:', !!window.Camera);

      if (!window.Camera) {
        console.error('[AR] window.Camera is not available');
        throw new Error('MediaPipe Camera library not loaded. Please refresh and try again.');
      }

      console.log('[AR] Creating Camera instance...');
      
      let camera;
      try {
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && poseRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });
        console.log('[AR] Camera instance created successfully');
      } catch (createErr) {
        console.error('[AR] Failed to create Camera instance:', createErr);
        throw new Error('Failed to create camera instance. Please refresh the page and try again.');
      }

      try {
        await camera.start();
        console.log('[AR] Camera started successfully!');
        
        // Clear timeout on success
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }

        cameraRef.current = camera;
        setIsActive(true);
        setIsLoading(false);
      } catch (cameraErr: any) {
        console.error('[AR] Camera start error:', cameraErr);
        
        // Provide specific error messages based on the error type
        if (cameraErr.name === 'NotAllowedError' || cameraErr.name === 'PermissionDeniedError') {
          throw new Error('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else if (cameraErr.name === 'NotFoundError' || cameraErr.name === 'DevicesNotFoundError') {
          throw new Error('No camera found on this device. Please connect a camera and try again.');
        } else if (cameraErr.name === 'NotReadableError' || cameraErr.name === 'TrackStartError') {
          throw new Error('Camera is already in use by another application. Please close other apps using the camera and try again.');
        } else {
          throw new Error('Failed to access camera. Please grant camera permissions in your browser settings and try again.');
        }
      }
    } catch (err) {
      console.error('[AR] Initialization error:', err);
      
      // Clear timeout on error
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera. Please refresh the page and try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [onResults, loadMediaPipeScripts]);

  const stopCamera = useCallback(() => {
    console.log('[AR] Stopping camera...');
    
    // Clear any pending timeouts
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (e) {
        console.error('[AR] Error stopping camera:', e);
      }
      cameraRef.current = null;
    }
    
    if (poseRef.current) {
      try {
        poseRef.current.close();
      } catch (e) {
        console.error('[AR] Error closing pose:', e);
      }
      poseRef.current = null;
    }
    
    setIsActive(false);
    setLandmarks(null);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isLoading,
    isActive,
    error,
    landmarks,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
  };
}

// Helper function to draw landmarks
function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  canvas: HTMLCanvasElement
) {
  // Draw connections between landmarks
  const connections = [
    [11, 12], // Shoulders
    [11, 13], // Left shoulder to elbow
    [13, 15], // Left elbow to wrist
    [12, 14], // Right shoulder to elbow
    [14, 16], // Right elbow to wrist
    [11, 23], // Left shoulder to hip
    [12, 24], // Right shoulder to hip
    [23, 24], // Hips
    [23, 25], // Left hip to knee
    [25, 27], // Left knee to ankle
    [24, 26], // Right hip to knee
    [26, 28], // Right knee to ankle
  ];

  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;

  connections.forEach(([start, end]) => {
    const startPoint = landmarks[start];
    const endPoint = landmarks[end];

    if (startPoint && endPoint) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
      ctx.stroke();
    }
  });

  // Draw landmark points
  ctx.fillStyle = '#FF0000';
  landmarks.forEach((landmark) => {
    if (landmark.visibility && landmark.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(
        landmark.x * canvas.width,
        landmark.y * canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  });
}
