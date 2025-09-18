import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  lazy?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  fallback?: string;
  blurDataURL?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait';
  sizes?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  enablePerformanceTracking?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  lazy = true,
  priority = false,
  quality = 80,
  placeholder,
  fallback = '/placeholder.svg',
  blurDataURL,
  aspectRatio,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fetchPriority = 'auto',
  enablePerformanceTracking = true,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [currentSrc, setCurrentSrc] = useState(blurDataURL || fallback);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadStartTime = useRef<number>(0);

  // Generate optimized image URL
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // Check if this is a Vite-processed local asset (contains hash)
    const isViteAsset = originalSrc.includes('-') && /[a-f0-9]{8}/.test(originalSrc) && originalSrc.startsWith('/assets/');
    
    // For Vite-processed local assets, use as-is (already optimized)
    if (isViteAsset) {
      return originalSrc;
    }
    
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
      url.searchParams.set('q', '65'); // More aggressive compression
      url.searchParams.set('fm', 'webp'); // Force WebP format
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('auto', 'format,compress'); // Auto optimize
      url.searchParams.set('cs', 'tinysrgb'); // Smaller color space
      // Remove DPR to avoid oversizing - use exact dimensions
      url.searchParams.delete('dpr');
      return url.toString();
    }

    // For other local assets (non-Vite processed)
    if (originalSrc.startsWith('/') || originalSrc.includes(window.location.origin)) {
      // Don't modify URLs for local assets that might not support query params
      return originalSrc;
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
    // Check if this is a Vite-processed local asset (contains hash)
    const isViteAsset = originalSrc.includes('-') && /[a-f0-9]{8}/.test(originalSrc) && originalSrc.startsWith('/assets/');
    
    // For Vite-processed local assets, use as-is (no WebP conversion available)
    if (isViteAsset) {
      return originalSrc;
    }
    
    // For Unsplash URLs, ensure WebP format is explicitly requested
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      // Use exact display dimensions to avoid waste - round to match display
      if (width) url.searchParams.set('w', Math.round(width).toString());
      if (height) url.searchParams.set('h', Math.round(height).toString());
      url.searchParams.set('q', '65'); // More aggressive compression for WebP
      url.searchParams.set('fm', 'webp'); // Explicit WebP format
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('auto', 'format,compress'); // Auto optimize
      url.searchParams.set('cs', 'tinysrgb'); // Smaller color space
      // Remove DPR to avoid oversizing - use exact dimensions for best file size
      url.searchParams.delete('dpr');
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
    
    // For other local assets, don't attempt WebP conversion
    if (originalSrc.startsWith('/') || originalSrc.includes(window.location.origin)) {
      return originalSrc;
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

  // Intersection Observer for lazy loading with performance tracking
  useEffect(() => {
    if (!lazy || priority) {
      setIsInView(true);
      return;
    }
    
    if (isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          loadStartTime.current = performance.now();
          if (enablePerformanceTracking) {
            console.log(`Image loading started: ${src}`);
          }
          observerRef.current?.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Increased for better UX
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [lazy, priority, isInView, src, enablePerformanceTracking]);

  const handleLoad = useCallback(() => {
    setCurrentSrc(getOptimizedSrc(src));
    setIsLoading(false);
    
    if (enablePerformanceTracking && loadStartTime.current) {
      const loadTime = performance.now() - loadStartTime.current;
      console.log(`Image loaded in ${loadTime.toFixed(2)}ms: ${src}`);
      
      // Report slow loads
      if (loadTime > 1000) {
        console.warn(`Slow image load detected: ${src} (${loadTime.toFixed(2)}ms)`);
      }
    }
    
    onLoad?.();
  }, [onLoad, src, enablePerformanceTracking, getOptimizedSrc]);

  const handleError = useCallback(() => {
    setHasError(true);
    setCurrentSrc(fallback);
    setIsLoading(false);
    onError?.();
  }, [onError, fallback]);

  // Get aspect ratio classes
  const aspectClasses = aspectRatio ? {
    square: 'aspect-square',
    video: 'aspect-video', 
    wide: 'aspect-[16/9]',
    portrait: 'aspect-[3/4]'
  }[aspectRatio] : '';

  const optimizedSrc = getOptimizedSrc(src);
  const webpSrc = getWebPSrc(src);

  // For priority images, render immediately
  if (priority || !lazy) {
    return (
      <div 
        className={cn(
          "relative overflow-hidden",
          aspectClasses,
          containerClassName
        )}
        style={!aspectRatio ? { width, height } : undefined}
      >
        <picture>
          <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
          <img
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            loading="eager"
            {...({ fetchpriority: fetchPriority } as any)}
            decoding="sync"
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      </div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectClasses,
        containerClassName
      )}
      style={!aspectRatio ? { width, height } : undefined}
    >
      {/* Blur placeholder */}
      {blurDataURL && isLoading && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && !hasError ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
          <img
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            loading="lazy"
            {...({ fetchpriority: fetchPriority } as any)}
            decoding="async"
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      ) : hasError ? (
        <div className="absolute inset-0 bg-muted/90 flex items-center justify-center">
          <div className="text-center text-muted-foreground p-4">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm">Failed to load image</div>
          </div>
        </div>
      ) : (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          role="img"
          aria-label={`Loading ${alt}`}
        >
          {placeholder && (
            <img 
              src={placeholder} 
              alt="" 
              className="w-full h-full object-cover opacity-50 blur-sm"
            />
          )}
        </div>
      )}

      {/* Performance indicator for development */}
      {enablePerformanceTracking && !isLoading && !hasError && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded opacity-50">
          ✓ Optimized
        </div>
      )}
    </div>
  );
};

export default ImageOptimizer;