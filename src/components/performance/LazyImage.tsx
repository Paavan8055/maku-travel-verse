import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholderSrc,
  onLoad,
  onError,
  width,
  height,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before image enters viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate placeholder with proper dimensions
  const getPlaceholderStyles = () => {
    const styles: React.CSSProperties = {
      backgroundColor: 'hsl(var(--muted))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: height || 200,
    };

    if (width && height) {
      styles.aspectRatio = `${width} / ${height}`;
    }

    return styles;
  };

  // Fallback placeholder
  const renderPlaceholder = () => (
    <div
      className={cn(
        "animate-pulse bg-muted flex items-center justify-center text-muted-foreground text-sm",
        className
      )}
      style={getPlaceholderStyles()}
    >
      {hasError ? 'Failed to load image' : 'Loading...'}
    </div>
  );

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {!isInView && !priority ? (
        renderPlaceholder()
      ) : (
        <>
          {/* Placeholder shown while loading */}
          {!isLoaded && !hasError && (
            <div
              className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center text-muted-foreground text-sm"
              style={getPlaceholderStyles()}
            >
              {placeholderSrc ? (
                <img
                  src={placeholderSrc}
                  alt=""
                  className="w-full h-full object-cover opacity-50 blur-sm"
                />
              ) : (
                'Loading...'
              )}
            </div>
          )}
          
          {/* Main image */}
          {!hasError ? (
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              className={cn(
                "transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0",
                className
              )}
              onLoad={handleLoad}
              onError={handleError}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            renderPlaceholder()
          )}
        </>
      )}
    </div>
  );
};