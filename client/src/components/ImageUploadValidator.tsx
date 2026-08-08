import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, XCircle, AlertTriangle, Download, Loader2, Info, Link, Copy, ExternalLink, Image, HelpCircle, Cloud, Search, RefreshCw, Video, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { convertToDirectUrl } from '@/lib/imageUtils';
import { apiRequest } from '@/lib/queryClient';

interface ImageSpec {
  type: string;
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  maxFileSize: number;
  formats: string[];
  description: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    originalWidth: number;
    originalHeight: number;
    originalSize: number;
    format: string;
    aspectRatio: string;
  };
  suggestions?: {
    shouldCompress: boolean;
    shouldResize: boolean;
    targetWidth?: number;
    targetHeight?: number;
  };
}

interface UrlValidation {
  originalUrl: string;
  convertedUrl: string;
  isDropbox: boolean;
  isGoogleDrive: boolean;
  isValid: boolean;
  errorMessage?: string;
  previewLoaded: boolean;
}

interface MultiUploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  publicUrl?: string;
  error?: string;
}

export function ImageUploadValidator() {
  const [specs, setSpecs] = useState<ImageSpec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState(85);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('cloud-upload');
  const [urlInput, setUrlInput] = useState('');
  const [urlValidation, setUrlValidation] = useState<UrlValidation | null>(null);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [cloudFile, setCloudFile] = useState<File | null>(null);
  const [cloudUploadProgress, setCloudUploadProgress] = useState(0);
  const [isCloudUploading, setIsCloudUploading] = useState(false);
  const [cloudUploadResult, setCloudUploadResult] = useState<{publicUrl: string; filename: string} | null>(null);
  const [cloudSelectedSpec, setCloudSelectedSpec] = useState<string>('');
  const [storageStatus, setStorageStatus] = useState<{configured: boolean; message: string} | null>(null);
  const [imageSearch, setImageSearch] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Array<{name: string; objectPath: string; publicUrl: string; size: number; updatedAt: string}>>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [multiUploadFiles, setMultiUploadFiles] = useState<MultiUploadFile[]>([]);
  const [isMultiUploading, setIsMultiUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadResult, setVideoUploadResult] = useState<{publicUrl: string; filename: string} | null>(null);
  const [isSavingToHero, setIsSavingToHero] = useState(false);
  const [heroVideoTitle, setHeroVideoTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudFileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const response = await fetch('/api/admin/image-specs', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSpecs(data);
          if (data.length > 0) {
            setSelectedSpec(data[0].type);
          }
        }
      } catch (error) {
        console.error('Failed to fetch specs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load image specifications',
          variant: 'destructive'
        });
      }
    };
    fetchSpecs();

    const fetchStorageStatus = async () => {
      try {
        const response = await fetch('/api/admin/storage-status', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setStorageStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch storage status:', error);
        setStorageStatus({ configured: false, message: 'Unable to check storage status' });
      }
    };
    fetchStorageStatus();
  }, []);

  const searchUploadedImages = async (query?: string) => {
    setIsLoadingImages(true);
    try {
      const searchParam = query !== undefined ? query : imageSearch;
      const response = await fetch(`/api/admin/uploaded-images?search=${encodeURIComponent(searchParam)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUploadedImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to search images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      validateImage(droppedFile);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
    }
  }, [selectedSpec]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateImage(selectedFile);
    }
  };

  const validateImage = async (imageFile: File) => {
    if (!selectedSpec) {
      toast({
        title: 'No specification selected',
        description: 'Please select an image type first',
        variant: 'destructive'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('imageType', selectedSpec);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => resolve(new Response(xhr.response, { status: xhr.status }));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', '/api/admin/validate-image');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(formData);
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
        
        if (result.valid) {
          toast({
            title: 'Validation successful',
            description: 'Image meets all specifications',
          });
        } else {
          toast({
            title: 'Validation failed',
            description: `Found ${result.errors.length} error(s)`,
            variant: 'destructive'
          });
        }
      } else {
        throw new Error('Validation request failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Validation error',
        description: 'Failed to validate image',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
      setUploadProgress(0);
    }
  };

  const compressImage = async () => {
    if (!file || !selectedSpec) return;

    setIsCompressing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('imageType', selectedSpec);
      formData.append('quality', compressionQuality.toString());

      const response = await fetch('/api/admin/compress-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
        const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0');
        const compressionRatio = response.headers.get('X-Compression-Ratio');
        const originalDims = response.headers.get('X-Original-Dimensions');
        const outputDims = response.headers.get('X-Output-Dimensions');

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'optimised-image.webp';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Image optimised successfully',
          description: `Reduced from ${Math.round(originalSize / 1024)}KB to ${Math.round(compressedSize / 1024)}KB (${compressionRatio}% reduction)\nDimensions: ${originalDims} → ${outputDims}`,
        });
      } else {
        throw new Error('Compression failed');
      }
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: 'Compression error',
        description: 'Failed to compress image',
        variant: 'destructive'
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const testImageUrl = async () => {
    if (!urlInput.trim()) {
      toast({
        title: 'No URL provided',
        description: 'Please enter an image URL to test',
        variant: 'destructive'
      });
      return;
    }

    setIsTestingUrl(true);
    const isDropbox = urlInput.includes('dropbox.com');
    const isGoogleDrive = urlInput.includes('drive.google.com');
    const convertedUrl = convertToDirectUrl(urlInput);

    setUrlValidation({
      originalUrl: urlInput,
      convertedUrl,
      isDropbox,
      isGoogleDrive,
      isValid: false,
      previewLoaded: false
    });

    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          setUrlValidation(prev => prev ? {
            ...prev,
            isValid: true,
            previewLoaded: true
          } : null);
          resolve();
        };
        img.onerror = () => {
          setUrlValidation(prev => prev ? {
            ...prev,
            isValid: false,
            errorMessage: 'Failed to load image. The URL may be invalid, expired, or not publicly accessible.',
            previewLoaded: false
          } : null);
          reject(new Error('Image failed to load'));
        };
        img.src = convertedUrl;
      });

      toast({
        title: 'URL is valid',
        description: 'The image loaded successfully'
      });
    } catch (error) {
      toast({
        title: 'URL validation failed',
        description: 'Could not load the image from this URL',
        variant: 'destructive'
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The URL has been copied'
    });
  };

  const handleCloudFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setCloudFile(selectedFile);
      setCloudUploadResult(null);
    }
  };

  const uploadToCloud = async () => {
    if (!cloudFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an image to upload',
        variant: 'destructive'
      });
      return;
    }

    setIsCloudUploading(true);
    setCloudUploadProgress(0);
    setCloudUploadResult(null);

    try {
      // Use proxy endpoint to avoid CORS issues with custom domains
      const formData = new FormData();
      formData.append('file', cloudFile);
      formData.append('filename', cloudFile.name);
      formData.append('imageType', cloudSelectedSpec || 'product-main');

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setCloudUploadProgress(progress);
        }
      });

      const result = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Invalid response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed - network error'));
        xhr.open('POST', '/api/admin/objects/upload-file');
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      setCloudUploadResult({
        publicUrl: result.publicUrl,
        filename: cloudFile.name
      });

      toast({
        title: 'Upload successful',
        description: 'Your image is now hosted in the cloud with a permanent URL'
      });
    } catch (error: any) {
      console.error('Cloud upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image to cloud storage',
        variant: 'destructive'
      });
    } finally {
      setIsCloudUploading(false);
      setCloudUploadProgress(0);
    }
  };

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: MultiUploadFile[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      status: 'pending' as const,
      progress: 0
    }));

    setMultiUploadFiles(prev => [...prev, ...newFiles]);
    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
    }
  };

  const removeMultiFile = (id: string) => {
    setMultiUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompletedFiles = () => {
    setMultiUploadFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const uploadSingleFile = async (uploadFile: MultiUploadFile): Promise<void> => {
    setMultiUploadFiles(prev => 
      prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f)
    );

    try {
      // Use proxied upload to avoid CORS issues with custom domains
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('filename', uploadFile.file.name);
      formData.append('imageType', cloudSelectedSpec || 'product-main');

      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setMultiUploadFiles(prev =>
              prev.map(f => f.id === uploadFile.id ? { ...f, progress } : f)
            );
          }
        });
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Invalid response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Network error - upload failed'));
        xhr.open('POST', '/api/admin/objects/upload-file');
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      setMultiUploadFiles(prev =>
        prev.map(f => f.id === uploadFile.id ? { 
          ...f, 
          status: 'success' as const, 
          progress: 100,
          publicUrl: response.publicUrl 
        } : f)
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      setMultiUploadFiles(prev =>
        prev.map(f => f.id === uploadFile.id ? { 
          ...f, 
          status: 'error' as const, 
          error: error.message || 'Upload failed' 
        } : f)
      );
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = multiUploadFiles.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast({
        title: 'No files to upload',
        description: 'Add some images first',
        variant: 'destructive'
      });
      return;
    }

    setIsMultiUploading(true);

    const concurrencyLimit = 3;
    const queue = [...pendingFiles];
    const uploading: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      if (queue.length === 0) return;
      const file = queue.shift()!;
      await uploadSingleFile(file);
      await processNext();
    };

    for (let i = 0; i < Math.min(concurrencyLimit, queue.length); i++) {
      uploading.push(processNext());
    }

    await Promise.all(uploading);

    setIsMultiUploading(false);
    
    const results = multiUploadFiles.filter(f => pendingFiles.some(p => p.id === f.id));
    const successCount = results.filter(f => f.status === 'success').length;
    const errorCount = results.filter(f => f.status === 'error').length;

    toast({
      title: 'Batch upload complete',
      description: `${successCount} succeeded, ${errorCount} failed`,
      variant: errorCount > 0 ? 'destructive' : 'default'
    });
  };

  // Video upload functions
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a video file
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a video file (MP4, WebM, MOV, etc.)',
          variant: 'destructive'
        });
        return;
      }
      // Check file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (selectedFile.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Video files must be under 500MB',
          variant: 'destructive'
        });
        return;
      }
      setVideoFile(selectedFile);
      setVideoUploadResult(null);
    }
  };

  const uploadVideoToCloud = async () => {
    if (!videoFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a video to upload',
        variant: 'destructive'
      });
      return;
    }

    setIsVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoUploadResult(null);

    try {
      const uploadRes = await apiRequest('POST', '/api/admin/objects/upload', {
        filename: videoFile.name
      });
      const { uploadURL, objectPath } = await uploadRes.json();

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setVideoUploadProgress(progress);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadURL);
        xhr.setRequestHeader('Content-Type', videoFile.type);
        xhr.send(videoFile);
      });

      const confirmRes = await apiRequest('POST', '/api/admin/objects/confirm', {
        objectPath,
        filename: videoFile.name,
        imageType: 'video'
      });
      const confirmData = await confirmRes.json();

      setVideoUploadResult({
        publicUrl: confirmData.publicUrl,
        filename: videoFile.name
      });

      toast({
        title: 'Video upload successful',
        description: 'Your video is now hosted in the cloud with a permanent URL'
      });
    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload video to cloud storage',
        variant: 'destructive'
      });
    } finally {
      setIsVideoUploading(false);
      setVideoUploadProgress(0);
    }
  };

  const saveToHeroVideos = async () => {
    if (!videoUploadResult || !heroVideoTitle.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a title for the hero video',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingToHero(true);
    try {
      const response = await apiRequest('POST', '/api/admin/hero-videos', {
        title: heroVideoTitle.trim(),
        videoUrl: videoUploadResult.publicUrl
      });

      if (response.ok) {
        toast({
          title: 'Hero video saved',
          description: 'The video has been added to your homepage hero section'
        });
        setHeroVideoTitle('');
        setVideoUploadResult(null);
        setVideoFile(null);
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save hero video');
      }
    } catch (error: any) {
      console.error('Save hero video error:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save video to hero section',
        variant: 'destructive'
      });
    } finally {
      setIsSavingToHero(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedSpecData = specs.find(s => s.type === selectedSpec);
  const cloudSelectedSpecData = specs.find(s => s.type === cloudSelectedSpec);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-6 h-6" />
            Media Manager
          </CardTitle>
          <CardDescription>
            Upload, validate, and manage images and videos for your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="cloud-upload" data-testid="tab-cloud-upload">
                <Cloud className="w-4 h-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="video-upload" data-testid="tab-video-upload">
                <Video className="w-4 h-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload">
                <Upload className="w-4 h-4 mr-2" />
                Validate
              </TabsTrigger>
              <TabsTrigger value="url-test" data-testid="tab-url-test">
                <Link className="w-4 h-4 mr-2" />
                Test URL
              </TabsTrigger>
              <TabsTrigger value="best-practices" data-testid="tab-best-practices">
                <HelpCircle className="w-4 h-4 mr-2" />
                Tips
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cloud-upload" className="space-y-6">
              {storageStatus && !storageStatus.configured ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cloud Storage Not Configured</strong>
                    <br />
                    {storageStatus.message}
                    <br />
                    <span className="text-sm mt-2 block">
                      Use the "Validate & Optimise" tab to download optimised images, then host them on Dropbox or Google Drive.
                    </span>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <strong>Recommended:</strong> Upload images directly to cloud storage for permanent, 
                    fast-loading URLs that never expire. Perfect for product images.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="cloud-image-type">Image Type (Optional)</Label>
                <Select value={cloudSelectedSpec} onValueChange={setCloudSelectedSpec}>
                  <SelectTrigger id="cloud-image-type" data-testid="select-cloud-image-type">
                    <SelectValue placeholder="Select image type for metadata" />
                  </SelectTrigger>
                  <SelectContent>
                    {specs.map((spec) => (
                      <SelectItem key={spec.type} value={spec.type} data-testid={`cloud-option-${spec.type}`}>
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cloudSelectedSpecData && (
                  <p className="text-sm text-muted-foreground">
                    Recommended: {cloudSelectedSpecData.width}x{cloudSelectedSpecData.height}px, 
                    Max {Math.round(cloudSelectedSpecData.maxFileSize / 1024)}KB
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => cloudFileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-select-cloud-file"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {cloudFile ? cloudFile.name : 'Select Image'}
                  </Button>
                  <input
                    ref={cloudFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCloudFileSelect}
                    className="hidden"
                    data-testid="input-cloud-file"
                  />
                </div>

                {cloudFile && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 border rounded overflow-hidden bg-muted flex items-center justify-center">
                          <img
                            src={URL.createObjectURL(cloudFile)}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 space-y-1 text-sm">
                          <p><strong>Name:</strong> {cloudFile.name}</p>
                          <p><strong>Size:</strong> {Math.round(cloudFile.size / 1024)}KB</p>
                          <p><strong>Type:</strong> {cloudFile.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isCloudUploading && cloudUploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading to cloud...</span>
                      <span>{Math.round(cloudUploadProgress)}%</span>
                    </div>
                    <Progress value={cloudUploadProgress} />
                  </div>
                )}

                <Button
                  onClick={uploadToCloud}
                  disabled={!cloudFile || isCloudUploading || Boolean(storageStatus && !storageStatus.configured)}
                  className="w-full"
                  data-testid="button-upload-cloud"
                >
                  {isCloudUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 mr-2" />
                      Upload to Cloud Storage
                    </>
                  )}
                </Button>
              </div>

              {cloudUploadResult && (
                <Card className="border-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Upload Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Relative URL <Badge variant="outline" className="text-green-600 border-green-600">Recommended</Badge>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={cloudUploadResult.publicUrl}
                          readOnly
                          className="flex-1 text-xs font-mono"
                          data-testid="input-cloud-url"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(cloudUploadResult.publicUrl)}
                          data-testid="button-copy-cloud-url"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use this URL for product images. Works on any domain (development or production).
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Full URL (for external sharing)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}${cloudUploadResult.publicUrl}`}
                          readOnly
                          className="flex-1 text-xs font-mono text-muted-foreground"
                          data-testid="input-cloud-full-url"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(`${window.location.origin}${cloudUploadResult.publicUrl}`)}
                          data-testid="button-copy-cloud-full-url"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => window.open(cloudUploadResult.publicUrl, '_blank')}
                          data-testid="button-open-cloud-url"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <img
                        src={cloudUploadResult.publicUrl}
                        alt="Uploaded preview"
                        className="max-h-48 mx-auto rounded"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {storageStatus?.configured && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Upload className="w-5 h-5" />
                      Batch Upload Multiple Images
                    </CardTitle>
                    <CardDescription>
                      Upload many images at once - perfect for bulk product uploads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        onClick={() => multiFileInputRef.current?.click()}
                        variant="outline"
                        disabled={isMultiUploading}
                        data-testid="button-select-multi-files"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Multiple Images
                      </Button>
                      <input
                        ref={multiFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMultiFileSelect}
                        className="hidden"
                        data-testid="input-multi-files"
                      />
                      {multiUploadFiles.length > 0 && (
                        <>
                          <Button
                            onClick={uploadAllFiles}
                            disabled={isMultiUploading || multiUploadFiles.filter(f => f.status === 'pending' || f.status === 'error').length === 0}
                            data-testid="button-upload-all"
                          >
                            {isMultiUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Cloud className="w-4 h-4 mr-2" />
                                Upload All ({multiUploadFiles.filter(f => f.status === 'pending' || f.status === 'error').length})
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={clearCompletedFiles}
                            disabled={isMultiUploading || multiUploadFiles.filter(f => f.status === 'success').length === 0}
                            data-testid="button-clear-completed"
                          >
                            Clear Completed
                          </Button>
                        </>
                      )}
                    </div>

                    {multiUploadFiles.length > 0 && (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {multiUploadFiles.map((uploadFile) => (
                          <div
                            key={uploadFile.id}
                            className="flex items-center gap-3 p-2 border rounded-lg"
                            data-testid={`multi-file-${uploadFile.id}`}
                          >
                            <div className="w-12 h-12 border rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                              <img
                                src={URL.createObjectURL(uploadFile.file)}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(uploadFile.file.size / 1024)}KB
                                </span>
                                {uploadFile.status === 'pending' && (
                                  <Badge variant="secondary">Pending</Badge>
                                )}
                                {uploadFile.status === 'uploading' && (
                                  <Badge variant="outline" className="text-blue-500 border-blue-500">
                                    {Math.round(uploadFile.progress)}%
                                  </Badge>
                                )}
                                {uploadFile.status === 'success' && (
                                  <Badge variant="outline" className="text-green-500 border-green-500">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Done
                                  </Badge>
                                )}
                                {uploadFile.status === 'error' && (
                                  <Badge variant="destructive">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                              {uploadFile.status === 'uploading' && (
                                <Progress value={uploadFile.progress} className="h-1" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {uploadFile.status === 'success' && uploadFile.publicUrl && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(uploadFile.publicUrl!);
                                  }}
                                  data-testid={`copy-url-${uploadFile.id}`}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              )}
                              {(uploadFile.status === 'pending' || uploadFile.status === 'error') && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeMultiFile(uploadFile.id)}
                                  disabled={isMultiUploading}
                                  data-testid={`remove-file-${uploadFile.id}`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {multiUploadFiles.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Select multiple images to upload them all at once
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {storageStatus?.configured && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Search className="w-5 h-5" />
                      Browse Uploaded Images
                    </CardTitle>
                    <CardDescription>
                      Search and find previously uploaded images
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by filename..."
                        value={imageSearch}
                        onChange={(e) => setImageSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchUploadedImages()}
                        className="flex-1"
                        data-testid="input-image-search"
                      />
                      <Button
                        onClick={() => searchUploadedImages()}
                        disabled={isLoadingImages}
                        data-testid="button-search-images"
                      >
                        {isLoadingImages ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImageSearch('');
                          searchUploadedImages('');
                        }}
                        disabled={isLoadingImages}
                        data-testid="button-refresh-images"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>

                    {uploadedImages.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Click any image to copy its relative URL (e.g., /public-objects/filename.jpg)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {uploadedImages.map((img) => (
                            <div
                              key={img.objectPath}
                              className="border rounded-lg p-2 space-y-2 hover-elevate cursor-pointer"
                              onClick={() => copyToClipboard(img.objectPath)}
                              title={`Click to copy: ${img.objectPath}`}
                              data-testid={`image-item-${img.name}`}
                            >
                              <div className="aspect-square bg-muted rounded overflow-hidden flex items-center justify-center">
                                <img
                                  src={img.objectPath}
                                  alt={img.name}
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">Error</text></svg>';
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-medium truncate" title={img.name}>
                                  {img.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.round(img.size / 1024)}KB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {uploadedImages.length === 0 && !isLoadingImages && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No images found. Upload some images or adjust your search.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="video-upload" className="space-y-6">
              {storageStatus && !storageStatus.configured ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cloud Storage Not Configured</strong>
                    <br />
                    {storageStatus.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-blue-500">
                  <Video className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    <strong>Video Upload:</strong> Upload videos directly to cloud storage for hero backgrounds, 
                    product videos, and promotional content. Max file size: 500MB.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => videoFileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-select-video-file"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {videoFile ? videoFile.name : 'Select Video'}
                  </Button>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileSelect}
                    className="hidden"
                    data-testid="input-video-file"
                  />
                </div>

                {videoFile && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="w-32 h-24 border rounded overflow-hidden bg-muted flex items-center justify-center">
                          <video
                            src={URL.createObjectURL(videoFile)}
                            className="max-w-full max-h-full object-contain"
                            muted
                          />
                        </div>
                        <div className="flex-1 space-y-1 text-sm">
                          <p><strong>Name:</strong> {videoFile.name}</p>
                          <p><strong>Size:</strong> {formatFileSize(videoFile.size)}</p>
                          <p><strong>Type:</strong> {videoFile.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {isVideoUploading && videoUploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading video to cloud...</span>
                      <span>{Math.round(videoUploadProgress)}%</span>
                    </div>
                    <Progress value={videoUploadProgress} />
                  </div>
                )}

                <Button
                  onClick={uploadVideoToCloud}
                  disabled={!videoFile || isVideoUploading || Boolean(storageStatus && !storageStatus.configured)}
                  className="w-full"
                  data-testid="button-upload-video"
                >
                  {isVideoUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 mr-2" />
                      Upload Video to Cloud Storage
                    </>
                  )}
                </Button>
              </div>

              {videoUploadResult && (
                <Card className="border-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Video Upload Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Permanent Video URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={videoUploadResult.publicUrl}
                          readOnly
                          className="flex-1 text-xs font-mono"
                          data-testid="input-video-url"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(videoUploadResult.publicUrl)}
                          data-testid="button-copy-video-url"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => window.open(videoUploadResult.publicUrl, '_blank')}
                          data-testid="button-open-video-url"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Copy this URL and paste it into your hero video or product video field. This URL will never expire.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <video
                        src={videoUploadResult.publicUrl}
                        controls
                        className="max-h-48 mx-auto rounded w-full"
                      />
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <Label className="font-medium">Save to Homepage Hero</Label>
                      <p className="text-xs text-muted-foreground">
                        Add this video directly to your homepage hero section
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={heroVideoTitle}
                          onChange={(e) => setHeroVideoTitle(e.target.value)}
                          placeholder="Enter video title (e.g., Summer Collection)"
                          className="flex-1"
                          data-testid="input-hero-video-title"
                        />
                        <Button
                          onClick={saveToHeroVideos}
                          disabled={isSavingToHero || !heroVideoTitle.trim()}
                          data-testid="button-save-to-hero"
                        >
                          {isSavingToHero ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Save to Hero
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="w-5 h-5" />
                    Supported Video Formats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <Badge variant="outline">MP4</Badge>
                      <p className="text-muted-foreground text-xs">Best for web</p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline">WebM</Badge>
                      <p className="text-muted-foreground text-xs">Good compression</p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline">MOV</Badge>
                      <p className="text-muted-foreground text-xs">Apple format</p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline">AVI</Badge>
                      <p className="text-muted-foreground text-xs">Legacy format</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    For best results, use MP4 format with H.264 codec. Maximum file size: 500MB.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image-type">Image Type</Label>
                <Select value={selectedSpec} onValueChange={setSelectedSpec}>
                  <SelectTrigger id="image-type" data-testid="select-image-type">
                    <SelectValue placeholder="Select image type" />
                  </SelectTrigger>
                  <SelectContent>
                    {specs.map((spec) => (
                      <SelectItem key={spec.type} value={spec.type} data-testid={`option-${spec.type}`}>
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSpecData && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{selectedSpecData.name}</strong> - {selectedSpecData.description}
                      <br />
                      Expected: {selectedSpecData.width}×{selectedSpecData.height}px ({selectedSpecData.aspectRatio}), 
                      Max {Math.round(selectedSpecData.maxFileSize / 1024)}KB, 
                      Formats: {selectedSpecData.formats.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-accent/50'}
                `}
                data-testid="drop-zone"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">Drop image here or click to upload</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSpecData
                    ? `Supports: ${selectedSpecData.formats.join(', ').toUpperCase()}`
                    : 'Select an image type first'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file"
                />
              </div>

              {isValidating && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {file && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Selected File</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {file.name}</p>
                      <p><strong>Size:</strong> {Math.round(file.size / 1024)}KB</p>
                      <p><strong>Type:</strong> {file.type}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {validationResult && (
                <Card className={validationResult.valid ? 'border-green-500' : 'border-red-500'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {validationResult.valid ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Validation Passed
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500" />
                          Validation Failed
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1 text-sm">
                      <p><strong>Dimensions:</strong> {validationResult.metadata.originalWidth}×{validationResult.metadata.originalHeight}px</p>
                      <p><strong>Aspect Ratio:</strong> {validationResult.metadata.aspectRatio}</p>
                      <p><strong>Format:</strong> {validationResult.metadata.format}</p>
                      <p><strong>File Size:</strong> {Math.round(validationResult.metadata.originalSize / 1024)}KB</p>
                    </div>

                    {validationResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-500 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Errors
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.errors.map((error, i) => (
                            <li key={i} className="text-red-600">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResult.warnings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-yellow-600 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Warnings
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.warnings.map((warning, i) => (
                            <li key={i} className="text-yellow-700">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResult.suggestions && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          {validationResult.suggestions.shouldCompress && (
                            <p>Compression recommended to reduce file size</p>
                          )}
                          {validationResult.suggestions.shouldResize && (
                            <p>Resizing recommended to {validationResult.suggestions.targetWidth}×{validationResult.suggestions.targetHeight}px</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {file && validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Optimise Image</CardTitle>
                    <CardDescription>
                      Automatically resize and compress the image to meet specifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Compression Quality: {compressionQuality}%</Label>
                      <Slider
                        value={[compressionQuality]}
                        onValueChange={([value]) => setCompressionQuality(value)}
                        min={60}
                        max={100}
                        step={5}
                        data-testid="slider-quality"
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher quality = larger file size. 85% is recommended for most images.
                      </p>
                    </div>

                    <Button
                      onClick={compressImage}
                      disabled={isCompressing}
                      className="w-full"
                      data-testid="button-compress"
                    >
                      {isCompressing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Optimising...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download Optimised Image
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="url-test" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Test if your Dropbox or Google Drive image URLs will work on the platform.
                  The tool automatically converts sharing links to direct download links.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url-input">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Paste your Dropbox or Google Drive link here..."
                      className="flex-1"
                      data-testid="input-url"
                    />
                    <Button 
                      onClick={testImageUrl} 
                      disabled={isTestingUrl}
                      data-testid="button-test-url"
                    >
                      {isTestingUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Test URL'
                      )}
                    </Button>
                  </div>
                </div>

                {urlValidation && (
                  <Card className={urlValidation.isValid ? 'border-green-500' : 'border-red-500'}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {urlValidation.isValid ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            URL Works
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            URL Failed
                          </>
                        )}
                        {urlValidation.isDropbox && <Badge variant="secondary">Dropbox</Badge>}
                        {urlValidation.isGoogleDrive && <Badge variant="secondary">Google Drive</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {urlValidation.errorMessage && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{urlValidation.errorMessage}</AlertDescription>
                        </Alert>
                      )}

                      {urlValidation.convertedUrl !== urlValidation.originalUrl && (
                        <div className="space-y-2">
                          <Label>Converted Direct URL</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={urlValidation.convertedUrl} 
                              readOnly 
                              className="flex-1 text-xs"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(urlValidation.convertedUrl)}
                              data-testid="button-copy-url"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => window.open(urlValidation.convertedUrl, '_blank')}
                              data-testid="button-open-url"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Use this converted URL in your product images
                          </p>
                        </div>
                      )}

                      {urlValidation.isValid && urlValidation.previewLoaded && (
                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <div className="border rounded-lg p-4 bg-muted/50">
                            <img 
                              src={urlValidation.convertedUrl} 
                              alt="Preview"
                              className="max-h-64 mx-auto rounded"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="best-practices" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-green-500/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Recommended: Direct Upload
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <p className="font-medium">Advantages:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Images are optimised automatically</li>
                        <li>Fastest loading times</li>
                        <li>No expired links</li>
                        <li>Consistent quality</li>
                        <li>Works reliably everywhere</li>
                      </ul>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">How to use:</p>
                      <p className="text-muted-foreground">
                        Use the "Upload & Optimise" tab above to upload and optimise your images,
                        then use the downloaded file in your products.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Alternative: External Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <p className="font-medium">Considerations:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Links can expire</li>
                        <li>May load slower</li>
                        <li>Requires public sharing settings</li>
                        <li>Platform may change URL formats</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="dropbox">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">Dropbox</Badge>
                      How to get working Dropbox links
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Right-click your file in Dropbox</li>
                      <li>Select "Copy link" or "Share"</li>
                      <li>Make sure "Anyone with link can view" is enabled</li>
                      <li>Copy the link - it will look like:<br />
                        <code className="text-xs bg-muted px-1 rounded">https://www.dropbox.com/scl/fi/xxxxx/image.jpg?...</code>
                      </li>
                      <li>Paste it in the "Test URL" tab to verify it works</li>
                    </ol>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important:</strong> The platform automatically converts Dropbox sharing links 
                        to direct download links. If your image still doesn't load, the link may have expired
                        or sharing settings may have changed.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="google-drive">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">Google Drive</Badge>
                      How to get working Google Drive links
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Right-click your file in Google Drive</li>
                      <li>Select "Share" → "Get link"</li>
                      <li>Change to "Anyone with the link" can view</li>
                      <li>Copy the link - it will look like:<br />
                        <code className="text-xs bg-muted px-1 rounded">https://drive.google.com/file/d/xxxxx/view</code>
                      </li>
                      <li>Paste it in the "Test URL" tab to verify it works</li>
                    </ol>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Note:</strong> Google Drive has bandwidth limits. If your store has high traffic,
                        images may temporarily stop loading. Direct upload is recommended for better reliability.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="image-specs">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">Specs</Badge>
                      Image specifications by type
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-2">
                      {specs.map(spec => (
                        <div key={spec.type} className="flex items-center justify-between p-2 border rounded text-sm">
                          <div>
                            <span className="font-medium">{spec.name}</span>
                            <span className="text-muted-foreground ml-2">- {spec.description}</span>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <span>{spec.width}×{spec.height}px</span>
                            <span className="ml-2">Max {Math.round(spec.maxFileSize / 1024)}KB</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="troubleshooting">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">Help</Badge>
                      Troubleshooting image issues
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Image not loading?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Check if the sharing link is set to "Anyone with link"</li>
                        <li>Try the "Test URL" tab to see the converted link</li>
                        <li>Dropbox links may have expired - try creating a new link</li>
                        <li>Google Drive has bandwidth limits - consider direct upload</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Image looks blurry?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Upload a higher resolution image (at least match the recommended dimensions)</li>
                        <li>Use the "Upload & Optimise" tab to check dimensions</li>
                        <li>Avoid upscaling small images</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Image loads slowly?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Optimise large images using the "Upload & Optimise" tab</li>
                        <li>Use WebP format for best compression</li>
                        <li>Keep file sizes under the recommended maximums</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
