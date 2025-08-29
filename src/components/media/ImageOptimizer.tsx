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
    // Check if it's already an optimized URL
    if (originalSrc.includes('w_') || originalSrc.includes('q_')) {
      return originalSrc;
    }

    // For Cloudinary URLs
    if (originalSrc.includes('cloudinary.com')) {
      const parts = originalSrc.split('/upload/');
      if (parts.length === 2) {
        const transforms = [];
        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        transforms.push(`q_${quality}`);
        transforms.push('f_auto'); // Auto format (WebP when supported)
        
        return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
      }
    }

    // For other CDNs or basic optimization
    const url = new URL(originalSrc, window.location.origin);
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    url.searchParams.set('q', quality.toString());
    
    return url.toString();
  }, [width, height, quality]);

  // Generate WebP source for modern browsers
  const getWebPSrc = useCallback((originalSrc: string) => {
    const optimizedSrc = getOptimizedSrc(originalSrc);
    
    // For Cloudinary, add WebP format
    if (optimizedSrc.includes('cloudinary.com')) {
      return optimizedSrc.replace('f_auto', 'f_webp');
    }
    
    // For other sources, add WebP format parameter
    const url = new URL(optimizedSrc, window.location.origin);
    url.searchParams.set('format', 'webp');
    return url.toString();
  }, [getOptimizedSrc]);

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

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={{ width, height }}
    >
      {isInView && !hasError ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={optimizedSrc}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? 'lazy' : 'eager'}
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