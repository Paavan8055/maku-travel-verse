import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  blurDataURL?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  containerClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  blurDataURL,
  priority = false,
  onLoad,
  onError,
  className,
  containerClassName,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(blurDataURL || fallback);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Load the actual image when in view
  useEffect(() => {
    if (!isInView || isLoaded) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      setCurrentSrc(fallback);
      onError?.();
    };
    img.src = src;
  }, [isInView, src, fallback, onLoad, onError, isLoaded]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallback);
      onError?.();
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        containerClassName
      )}
    >
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleImageError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-70",
          hasError ? "opacity-50" : "",
          className
        )}
        {...props}
      />
      
      {/* Loading overlay */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="text-xs text-muted-foreground text-center p-2">
            Failed to load image
          </div>
        </div>
      )}
    </div>
  );
};

// Optimized image with responsive sizing
export const ResponsiveImage: React.FC<LazyImageProps & {
  sizes?: string;
  srcSet?: string;
}> = ({
  src,
  srcSet,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  ...props
}) => {
  return (
    <LazyImage
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      {...props}
    />
  );
};

// Hero image with optimized loading
export const HeroImage: React.FC<LazyImageProps> = (props) => {
  return (
    <LazyImage
      priority={true}
      containerClassName="w-full h-full"
      className="w-full h-full object-cover"
      {...props}
    />
  );
};

// Card image with aspect ratio
export const CardImage: React.FC<LazyImageProps & {
  aspectRatio?: 'square' | 'video' | 'wide';
}> = ({
  aspectRatio = 'video',
  containerClassName,
  ...props
}) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[16/9]'
  };

  return (
    <LazyImage
      containerClassName={cn(
        aspectClasses[aspectRatio],
        containerClassName
      )}
      className="w-full h-full object-cover"
      {...props}
    />
  );
};