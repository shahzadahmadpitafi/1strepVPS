import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface ImageUploaderProps {
  label: string;
  name: string;
  defaultValue?: string | null;
  defaultImageUrl?: string;
  testId?: string;
  description?: string;
  useDefaultInitially?: boolean;
}

export default function ImageUploader({
  label,
  name,
  defaultValue,
  defaultImageUrl,
  testId,
  description,
  useDefaultInitially = false
}: ImageUploaderProps) {
  // Auto-use 1stRep default branding when no custom image is set
  const shouldUseDefault = Boolean(useDefaultInitially && defaultImageUrl);
  const [useDefault, setUseDefault] = useState<boolean>(shouldUseDefault);
  const [imageUrl, setImageUrl] = useState(shouldUseDefault ? (defaultImageUrl || "") : (defaultValue || ""));
  const [previewUrl, setPreviewUrl] = useState(shouldUseDefault ? (defaultImageUrl || "") : (defaultValue || ""));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      setPreviewUrl(dataUrl);
      setUseDefault(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setPreviewUrl(url);
    setUseDefault(false);
  };

  const handleUseDefaultChange = (checked: boolean) => {
    setUseDefault(checked);
    if (checked && defaultImageUrl) {
      setImageUrl(defaultImageUrl);
      setPreviewUrl(defaultImageUrl);
    } else {
      setImageUrl("");
      setPreviewUrl("");
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setPreviewUrl("");
    setUseDefault(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={`${name}-url`}>{label}</Label>
      
      {/* Preview */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="max-h-32 rounded-md border"
            onError={() => setPreviewUrl("")}
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Default branding option */}
      {defaultImageUrl && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${name}-default`}
            checked={useDefault}
            onCheckedChange={handleUseDefaultChange}
            data-testid={`${testId}-default`}
          />
          <label
            htmlFor={`${name}-default`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Use 1stRep default {label.toLowerCase()}
          </label>
        </div>
      )}

      {/* URL Input */}
      {!useDefault && (
        <div className="space-y-2">
          <Input
            id={`${name}-url`}
            type="url"
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={handleUrlChange}
            placeholder={`https://example.com/${name}.png`}
            disabled={useDefault}
            data-testid={`${testId}-url`}
          />
          
          {/* File Upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id={`${name}-file`}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={useDefault}
              data-testid={`${testId}-upload`}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
            <span className="text-sm text-muted-foreground">
              or enter URL above
            </span>
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Hidden input to submit the actual value */}
      <input
        type="hidden"
        name={name}
        value={imageUrl}
      />
    </div>
  );
}
