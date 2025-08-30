import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
  quality?: number;
  placeholder?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width,
  height,
  className,
  lazy = true,
  quality = 80,
  placeholder,
  fetchPriority = 'auto',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URL
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // For Cloudinary URLs
    if (originalSrc.includes('cloudinary.com')) {
      const parts = originalSrc.split('/upload/');
      if (parts.length === 2) {
        const transforms = [];
        if (width) transforms.push(`w_${Math.round(width)}`);
        if (height) transforms.push(`h_${Math.round(height)}`);
        transforms.push(`c_fill`); // Crop to exact dimensions
        transforms.push(`q_${quality}`);
        transforms.push('f_auto'); // Auto format (WebP when supported)
        
        return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
      }
    }

    // For Unsplash URLs - improve optimization with exact sizing
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      // Use exact display dimensions to avoid waste - round to match display
      if (width) url.searchParams.set('w', Math.round(width).toString());
      if (height) url.searchParams.set('h', Math.round(height).toString());
      url.searchParams.set('q', '75'); // Better compression for file size
      url.searchParams.set('fm', 'webp'); // Force WebP format
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('auto', 'compress'); // Focus on compression
      // Remove DPR to avoid oversizing - use exact dimensions
      return url.toString();
    }

    // For local assets, add responsive sizing parameters
    if (originalSrc.startsWith('/') || originalSrc.includes(window.location.origin)) {
      const url = new URL(originalSrc, window.location.origin);
      if (width) url.searchParams.set('w', Math.round(width).toString());
      if (height) url.searchParams.set('h', Math.round(height).toString());
      url.searchParams.set('q', quality.toString());
      return url.toString();
    }

    // For other CDNs or basic optimization
    try {
      const url = new URL(originalSrc);
      if (width) url.searchParams.set('w', Math.round(width).toString());
      if (height) url.searchParams.set('h', Math.round(height).toString());
      url.searchParams.set('q', quality.toString());
      return url.toString();
    } catch {
      return originalSrc;
    }
  }, [width, height, quality]);

  // Generate WebP source for modern browsers
  const getWebPSrc = useCallback((originalSrc: string) => {
    // For Unsplash URLs, ensure WebP format is explicitly requested
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      // Use exact display dimensions to avoid waste - round to match display
      if (width) url.searchParams.set('w', Math.round(width).toString());
      if (height) url.searchParams.set('h', Math.round(height).toString());
      url.searchParams.set('q', '75'); // Better compression
      url.searchParams.set('fm', 'webp'); // Explicit WebP format
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('auto', 'compress'); // Focus on compression
      // Remove DPR to avoid oversizing - use exact dimensions for best file size
      return url.toString();
    }
    
    // For Cloudinary, add WebP format
    if (originalSrc.includes('cloudinary.com')) {
      const parts = originalSrc.split('/upload/');
      if (parts.length === 2) {
        const transforms = [];
        if (width) transforms.push(`w_${Math.round(width)}`);
        if (height) transforms.push(`h_${Math.round(height)}`);
        transforms.push(`c_fill`);
        transforms.push(`q_${quality}`);
        transforms.push('f_webp'); // Explicit WebP format
        
        return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
      }
    }
    
    // For local assets, return the same source (browser will use WebP if available via picture element)
    if (originalSrc.startsWith('/') || originalSrc.includes(window.location.origin)) {
      return getOptimizedSrc(originalSrc);
    }
    
    // For other sources, try to add WebP format parameter
    try {
      const url = new URL(originalSrc);
      if (width) url.searchParams.set('w', Math.round(width).toString());
      if (height) url.searchParams.set('h', Math.round(height).toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('format', 'webp');
      return url.toString();
    } catch {
      return getOptimizedSrc(originalSrc);
    }
  }, [width, height, quality, getOptimizedSrc]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) {
      setIsInView(true);
      return;
    }
    
    if (isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [lazy, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  const optimizedSrc = getOptimizedSrc(src);
  const webpSrc = getWebPSrc(src);

  // For non-lazy images, render immediately without conditional logic
  if (!lazy) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          loading="eager"
          {...{ fetchpriority: fetchPriority }}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      </picture>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={{ width, height }}
    >
      {(!lazy || isInView) && !hasError ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? "lazy" : "eager"}
            fetchPriority={fetchPriority}
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      ) : hasError ? (
        <div className="flex items-center justify-center h-full bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full bg-muted">
          {placeholder ? (
            <img 
              src={placeholder} 
              alt="" 
              className="object-cover opacity-50 blur-sm"
            />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageOptimizer;