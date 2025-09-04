import { useEffect, useCallback, useRef } from 'react';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';

interface ImagePerformanceConfig {
  enableTracking?: boolean;
  slowLoadThreshold?: number; // milliseconds
  reportToAnalytics?: boolean;
}

interface ImageMetrics {
  loadTime: number;
  size: number;
  format: string;
  isOptimized: boolean;
}

export const useImagePerformance = (config: ImagePerformanceConfig = {}) => {
  const {
    enableTracking = true,
    slowLoadThreshold = 1000,
    reportToAnalytics = true
  } = config;

  const { measureAsync } = usePerformanceMonitoring('ImagePerformance');

  const imageCache = useRef<Map<string, ImageMetrics>>(new Map());
  const pendingLoads = useRef<Map<string, Promise<ImageMetrics>>>(new Map());

  // Track image loading performance
  const trackImageLoad = useCallback(async (
    src: string,
    element?: HTMLImageElement
  ): Promise<ImageMetrics> => {
    if (!enableTracking) {
      return { loadTime: 0, size: 0, format: 'unknown', isOptimized: false };
    }

    // Check cache first
    const cached = imageCache.current.get(src);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const pending = pendingLoads.current.get(src);
    if (pending) {
      return pending;
    }

    // Start new load tracking
    const loadPromise = measureAsync('image-load-tracking', async () => {
      const startTime = performance.now();

      return new Promise<ImageMetrics>((resolve) => {
        const img = element || new Image();
        
        const handleLoad = () => {
          const loadTime = performance.now() - startTime;
          
          // Estimate image size and format
          const format = src.split('.').pop()?.toLowerCase() || 'unknown';
          const isOptimized = format === 'webp' || format === 'avif' || src.includes('q_');
          
          // Get natural dimensions for size estimation
          const estimatedSize = (img.naturalWidth || 0) * (img.naturalHeight || 0) * 
            (format === 'webp' ? 0.8 : format === 'avif' ? 0.6 : 1.0);

          const metrics: ImageMetrics = {
            loadTime,
            size: estimatedSize,
            format,
            isOptimized
          };

          // Cache the result
          imageCache.current.set(src, metrics);
          pendingLoads.current.delete(src);

          // Report slow loads
          if (loadTime > slowLoadThreshold) {
            console.warn(`Slow image load detected: ${src} (${loadTime.toFixed(2)}ms)`);
          }

          // Report to analytics if configured
          if (reportToAnalytics && (window as any).gtag) {
            (window as any).gtag('event', 'image_performance', {
              event_category: 'Performance',
              event_label: format,
              value: Math.round(loadTime),
              custom_map: {
                dimension1: isOptimized ? 'optimized' : 'unoptimized',
                dimension2: loadTime > slowLoadThreshold ? 'slow' : 'fast'
              }
            });
          }

          resolve(metrics);
        };

        const handleError = () => {
          const errorMetrics: ImageMetrics = {
            loadTime: performance.now() - startTime,
            size: 0,
            format: 'error',
            isOptimized: false
          };
          
          imageCache.current.set(src, errorMetrics);
          pendingLoads.current.delete(src);
          resolve(errorMetrics);
        };

        if (element) {
          // Use existing element
          if (img.complete) {
            handleLoad();
          } else {
            img.addEventListener('load', handleLoad, { once: true });
            img.addEventListener('error', handleError, { once: true });
          }
        } else {
          // Create new image for preloading
          img.addEventListener('load', handleLoad, { once: true });
          img.addEventListener('error', handleError, { once: true });
          img.src = src;
        }
      });
    }, { imageUrl: src });

    pendingLoads.current.set(src, loadPromise);
    return loadPromise;
  }, [enableTracking, slowLoadThreshold, reportToAnalytics, measureAsync]);

  // Preload critical images
  const preloadImage = useCallback((src: string): Promise<ImageMetrics> => {
    return trackImageLoad(src);
  }, [trackImageLoad]);

  // Get cached metrics
  const getImageMetrics = useCallback((src: string): ImageMetrics | null => {
    return imageCache.current.get(src) || null;
  }, []);

  // Calculate image performance score
  const calculateImageScore = useCallback((metrics: ImageMetrics): number => {
    if (metrics.format === 'error') return 0;

    let score = 100;
    
    // Deduct points for slow loading
    if (metrics.loadTime > slowLoadThreshold) {
      score -= Math.min(50, (metrics.loadTime - slowLoadThreshold) / 100);
    }

    // Bonus points for optimization
    if (metrics.isOptimized) {
      score += 10;
    }

    // Deduct points for large unoptimized images
    if (metrics.size > 500000 && !metrics.isOptimized) { // 500KB
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }, [slowLoadThreshold]);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    const allMetrics = Array.from(imageCache.current.values());
    
    if (allMetrics.length === 0) {
      return {
        totalImages: 0,
        averageLoadTime: 0,
        optimizedCount: 0,
        slowLoadCount: 0,
        overallScore: 100
      };
    }

    const totalLoadTime = allMetrics.reduce((sum, m) => sum + m.loadTime, 0);
    const optimizedCount = allMetrics.filter(m => m.isOptimized).length;
    const slowLoadCount = allMetrics.filter(m => m.loadTime > slowLoadThreshold).length;
    
    const averageScore = allMetrics.reduce((sum, m) => sum + calculateImageScore(m), 0) / allMetrics.length;

    return {
      totalImages: allMetrics.length,
      averageLoadTime: totalLoadTime / allMetrics.length,
      optimizedCount,
      slowLoadCount,
      overallScore: Math.round(averageScore)
    };
  }, [slowLoadThreshold, calculateImageScore]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      imageCache.current.clear();
      pendingLoads.current.clear();
    };
  }, []);

  return {
    trackImageLoad,
    preloadImage,
    getImageMetrics,
    calculateImageScore,
    getPerformanceReport
  };
};