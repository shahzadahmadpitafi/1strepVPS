export function convertToDirectUrl(url: string | undefined, width?: number): string {
  if (!url) return '';
  
  // Handle old Replit dev domain URLs - convert to relative paths
  // Match patterns like: https://xxx.spock.replit.dev/... or https://xxx.replit.dev/...
  if (url.includes('.replit.dev/') || url.includes('.replit.app/')) {
    try {
      const urlObj = new URL(url);
      let objectPath = urlObj.pathname + urlObj.search;
      // Ensure path starts with /
      if (!objectPath.startsWith('/')) {
        objectPath = '/' + objectPath;
      }
      return objectPath;
    } catch {
      // If URL parsing fails, continue with other handlers
    }
  }
  
  // For local object storage URLs (both relative and absolute), handle properly
  // Match: /public-objects/... OR public-objects/... OR https://domain.com/public-objects/...
  if (url.includes('public-objects/')) {
    // Extract the path part for relative URLs
    let objectPath = url;
    
    // If it's an absolute URL, convert to relative for consistency
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        objectPath = urlObj.pathname + urlObj.search;
      } catch {
        // If URL parsing fails, use original
        objectPath = url;
      }
    }
    
    // Ensure path starts with / for relative URLs
    if (!objectPath.startsWith('/') && !objectPath.startsWith('http')) {
      objectPath = '/' + objectPath;
    }
    
    // Add width parameter for optimization if requested
    if (width && width > 0) {
      const separator = objectPath.includes('?') ? '&' : '?';
      return `${objectPath}${separator}w=${width}`;
    }
    
    return objectPath;
  }
  
  // Handle Dropbox URLs - convert to raw format for direct image embedding
  // Note: Dropbox may block some requests; consider migrating to Object Storage
  if (url.includes('dropbox.com')) {
    // For new Dropbox format with /scl/fi/ path, use raw=1 parameter
    // This serves images with correct content-type for browser embedding
    let directUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    // Replace dl=0 with raw=1 for inline display (not download)
    directUrl = directUrl.replace(/[?&]dl=0/, '');
    directUrl = directUrl.replace(/[?&]dl=1/, '');
    // Remove st parameter which can cause caching issues
    directUrl = directUrl.replace(/&st=[^&]+/, '');
    directUrl = directUrl.replace(/\?st=[^&]+&/, '?');
    directUrl = directUrl.replace(/\?st=[^&]+$/, '');
    // Add raw=1 for direct image serving
    if (!directUrl.includes('raw=1')) {
      directUrl = directUrl + (directUrl.includes('?') ? '&' : '?') + 'raw=1';
    }
    return directUrl;
  }
  
  // Handle Google Drive URLs - multiple formats
  if (url.includes('drive.google.com')) {
    // Format: drive.google.com/file/d/{id}/view
    const fileIdMatch = url.match(/\/file\/d\/([^/]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
    // Format: drive.google.com/open?id={id}
    const openIdMatch = url.match(/[?&]id=([^&]+)/);
    if (openIdMatch) {
      return `https://drive.google.com/uc?export=view&id=${openIdMatch[1]}`;
    }
    // Format: drive.google.com/uc?id={id} - already correct format
    if (url.includes('/uc?') && url.includes('id=')) {
      if (!url.includes('export=view')) {
        return url.replace('/uc?', '/uc?export=view&');
      }
      return url;
    }
  }
  
  // Handle lh3.googleusercontent.com URLs (already direct)
  if (url.includes('lh3.googleusercontent.com') || url.includes('googleusercontent.com')) {
    return url;
  }
  
  return url;
}

export const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23374151" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="system-ui" font-size="14"%3EImage unavailable%3C/text%3E%3C/svg%3E';

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_IMAGE) {
    img.src = FALLBACK_IMAGE;
  }
}
