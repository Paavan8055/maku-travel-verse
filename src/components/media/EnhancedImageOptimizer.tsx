import React from 'react';
import { ImageOptimizer } from './ImageOptimizer';
import { cn } from '@/lib/utils';

// Hero image component with optimal settings for above-the-fold content
export const HeroImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}> = ({ src, alt, className, containerClassName }) => (
  <ImageOptimizer
    src={src}
    alt={alt}
    priority={true}
    lazy={false}
    quality={90}
    aspectRatio="wide"
    sizes="100vw"
    className={cn("w-full h-full object-cover", className)}
    containerClassName={cn("w-full h-[60vh] lg:h-[70vh]", containerClassName)}
    enablePerformanceTracking={true}
  />
);

// Card image optimized for grid layouts
export const CardImage: React.FC<{
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait';
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}> = ({ 
  src, 
  alt, 
  aspectRatio = 'video', 
  className, 
  containerClassName,
  priority = false 
}) => (
  <ImageOptimizer
    src={src}
    alt={alt}
    priority={priority}
    lazy={!priority}
    quality={80}
    aspectRatio={aspectRatio}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className={cn("w-full h-full object-cover", className)}
    containerClassName={containerClassName}
    enablePerformanceTracking={true}
  />
);

// Gallery image with progressive loading and high quality
export const GalleryImage: React.FC<{
  src: string;
  alt: string;
  blurDataURL?: string;
  className?: string;
  containerClassName?: string;
}> = ({ src, alt, blurDataURL, className, containerClassName }) => (
  <ImageOptimizer
    src={src}
    alt={alt}
    priority={false}
    lazy={true}
    quality={85}
    blurDataURL={blurDataURL}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
    className={cn("w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform", className)}
    containerClassName={containerClassName}
    enablePerformanceTracking={true}
  />
);

// Thumbnail image for lists and previews
export const ThumbnailImage: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  containerClassName?: string;
}> = ({ src, alt, size = 'md', className, containerClassName }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  return (
    <ImageOptimizer
      src={src}
      alt={alt}
      priority={false}
      lazy={true}
      quality={70}
      aspectRatio="square"
      sizes="128px"
      className={cn("w-full h-full object-cover rounded-md", className)}
      containerClassName={cn(sizeClasses[size], "rounded-md", containerClassName)}
      enablePerformanceTracking={false} // Disable for small images to reduce noise
    />
  );
};

// Avatar image with fallback and optimal loading
export const AvatarImage: React.FC<{
  src?: string;
  alt: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, alt, fallback, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  if (!src) {
    return (
      <div className={cn(
        "bg-muted flex items-center justify-center rounded-full text-muted-foreground font-medium",
        sizeClasses[size],
        className
      )}>
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <ImageOptimizer
      src={src}
      alt={alt}
      fallback={fallback || '/placeholder.svg'}
      priority={false}
      lazy={true}
      quality={75}
      aspectRatio="square"
      sizes="128px"
      className={cn("w-full h-full object-cover", className)}
      containerClassName={cn(sizeClasses[size], "rounded-full overflow-hidden")}
      enablePerformanceTracking={false}
    />
  );
};

// Map preview image with specific optimizations for geographic content
export const MapPreviewImage: React.FC<{
  src: string;
  alt: string;
  destination?: string;
  className?: string;
  containerClassName?: string;
}> = ({ src, alt, destination, className, containerClassName }) => (
  <ImageOptimizer
    src={src}
    alt={alt}
    priority={false}
    lazy={true}
    quality={80}
    aspectRatio="wide"
    sizes="(max-width: 768px) 100vw, 400px"
    className={cn("w-full h-full object-cover", className)}
    containerClassName={cn("h-40", containerClassName)}
    enablePerformanceTracking={true}
  />
);