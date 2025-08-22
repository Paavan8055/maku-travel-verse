import { useEffect, useCallback, useRef } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface PerformanceMetrics {
  component: string;
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

interface UsePerformanceOptimizerOptions {
  componentName: string;
  enableMonitoring?: boolean;
  memoryThreshold?: number; // MB
  reportToAnalytics?: boolean;
}

export const usePerformanceOptimizer = ({
  componentName,
  enableMonitoring = true,
  memoryThreshold = 50,
  reportToAnalytics = false
}: UsePerformanceOptimizerOptions) => {
  const { handleError } = useErrorHandler();
  const renderStart = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const lastReportTime = useRef<number>(0);

  // Performance measurement
  const startRender = useCallback(() => {
    if (!enableMonitoring) return;
    renderStart.current = performance.now();
  }, [enableMonitoring]);

  const endRender = useCallback(() => {
    if (!enableMonitoring || !renderStart.current) return;
    
    const renderTime = performance.now() - renderStart.current;
    renderCount.current += 1;
    
    // Get memory usage if available
    const memory = (performance as any).memory;
    const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : undefined;
    
    const metrics: PerformanceMetrics = {
      component: componentName,
      renderTime,
      memoryUsage,
      timestamp: Date.now()
    };

    // Log performance issues
    if (renderTime > 100) {
      console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    if (memoryUsage && memoryUsage > memoryThreshold) {
      console.warn(`[Performance] High memory usage in ${componentName}: ${memoryUsage}MB`);
    }

    // Report to analytics (throttled to once per minute)
    if (reportToAnalytics && Date.now() - lastReportTime.current > 60000) {
      lastReportTime.current = Date.now();
      reportMetrics(metrics);
    }

    renderStart.current = 0;
  }, [componentName, enableMonitoring, memoryThreshold, reportToAnalytics]);

  // Report metrics to backend
  const reportMetrics = useCallback(async (metrics: PerformanceMetrics) => {
    try {
      // Send to analytics endpoint (if implemented)
      fetch('/api/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      }).catch(() => {
        // Silently fail - don't disrupt user experience
      });
    } catch (error) {
      // Log but don't throw
      console.debug('Failed to report performance metrics:', error);
    }
  }, []);

  // Memory cleanup helper
  const cleanup = useCallback(() => {
    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && (window as any).gc && process.env.NODE_ENV === 'development') {
      (window as any).gc();
    }
  }, []);

  // Lazy loading helper
  const createLazyLoader = useCallback(<T,>(
    loader: () => Promise<T>,
    fallback?: T
  ) => {
    return async (): Promise<T> => {
      try {
        const start = performance.now();
        const result = await loader();
        const loadTime = performance.now() - start;
        
        if (loadTime > 1000) {
          console.warn(`[Performance] Slow lazy load in ${componentName}: ${loadTime.toFixed(2)}ms`);
        }
        
        return result;
      } catch (error) {
        handleError({
          error,
          options: {
            context: `lazy-load-${componentName}`,
            showToast: false
          }
        });
        
        if (fallback !== undefined) {
          return fallback;
        }
        throw error;
      }
    };
  }, [componentName, handleError]);

  // Image optimization helper
  const optimizeImage = useCallback((src: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg';
  }) => {
    const { width, height, quality = 80, format = 'webp' } = options || {};
    
    // If using a CDN like Imagekit or Cloudinary, construct optimized URL
    if (src.includes('imagekit.io') || src.includes('cloudinary.com')) {
      let optimizedSrc = src;
      
      if (width || height) {
        const dimensions = `w_${width || 'auto'},h_${height || 'auto'}`;
        optimizedSrc = src.replace(/\/upload\//, `/upload/${dimensions},q_${quality},f_${format}/`);
      }
      
      return optimizedSrc;
    }
    
    // Fallback to original
    return src;
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    startRender,
    endRender,
    cleanup,
    createLazyLoader,
    optimizeImage,
    metrics: {
      renderCount: renderCount.current,
      componentName
    }
  };
};