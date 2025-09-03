import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  rerenderCount: number;
  lastRenderTime: number;
}

interface UsePerformanceOptimizerOptions {
  componentName: string;
  enableMonitoring?: boolean;
  reportToAnalytics?: boolean;
  memoryThreshold?: number;
}

export const usePerformanceOptimizer = (options: UsePerformanceOptimizerOptions) => {
  const {
    componentName,
    enableMonitoring = false, // EMERGENCY: Disabled by default
    reportToAnalytics = false,
    memoryThreshold = 80 // EMERGENCY: Increased threshold
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    rerenderCount: 0,
    lastRenderTime: 0
  });

  const startTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const memoryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMemoryMonitoringDisabled = useRef<boolean>(false);

  const startRender = useCallback(() => {
    if (!enableMonitoring) return;
    startTimeRef.current = performance.now();
  }, [enableMonitoring]);

  const endRender = useCallback(() => {
    if (!enableMonitoring || startTimeRef.current === 0) return;
    
    const renderTime = performance.now() - startTimeRef.current;
    renderCountRef.current += 1;

    setMetrics(prev => ({
      ...prev,
      renderTime,
      lastRenderTime: renderTime,
      rerenderCount: renderCountRef.current
    }));

    // Report to analytics if enabled and render time is significant
    if (reportToAnalytics && renderTime > 100) {
      reportPerformanceMetrics(renderTime);
    }

    startTimeRef.current = 0;
  }, [enableMonitoring, reportToAnalytics, componentName]);

  const checkMemoryUsage = useCallback(() => {
    // EMERGENCY: Circuit breaker pattern - disable if memory already high
    if (isMemoryMonitoringDisabled.current) return;
    
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);
      
      // EMERGENCY: Auto-disable monitoring if memory is critically high
      if (memoryUsage > 90) {
        isMemoryMonitoringDisabled.current = true;
        if (memoryCheckIntervalRef.current) {
          clearInterval(memoryCheckIntervalRef.current);
          memoryCheckIntervalRef.current = null;
        }
        console.error(`CRITICAL: Memory usage ${memoryUsage}% - disabling monitoring for ${componentName}`);
        return;
      }
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage
      }));

      // EMERGENCY: Enhanced warnings
      if (memoryUsage > memoryThreshold) {
        console.warn(`High memory usage in ${componentName}: ${memoryUsage}%`);
        
        // Auto-disable at 85%
        if (memoryUsage > 85) {
          isMemoryMonitoringDisabled.current = true;
          if (memoryCheckIntervalRef.current) {
            clearInterval(memoryCheckIntervalRef.current);
            memoryCheckIntervalRef.current = null;
          }
        }
      }
    }
  }, [componentName, memoryThreshold]);

  const reportPerformanceMetrics = async (renderTime: number) => {
    try {
      await supabase.functions.invoke('track-performance', {
        body: {
          component: componentName,
          renderTime,
          memoryUsage: metrics.memoryUsage,
          rerenderCount: renderCountRef.current,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  };

  const optimizeComponent = useCallback(() => {
    // Force garbage collection if available (dev mode)
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }

    // Reset render count
    renderCountRef.current = 0;
    
    // Clear any pending timers
    if (memoryCheckIntervalRef.current) {
      clearInterval(memoryCheckIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    // EMERGENCY: Only monitor if explicitly enabled and memory not already high
    if (!enableMonitoring || isMemoryMonitoringDisabled.current) {
      // Force cleanup any existing intervals
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current);
        memoryCheckIntervalRef.current = null;
      }
      return;
    }

    // EMERGENCY: Debounced memory checking - reduce frequency to every 10 seconds
    memoryCheckIntervalRef.current = setInterval(checkMemoryUsage, 10000);

    return () => {
      if (memoryCheckIntervalRef.current) {
        clearInterval(memoryCheckIntervalRef.current);
        memoryCheckIntervalRef.current = null;
      }
    };
  }, [enableMonitoring, checkMemoryUsage]);

  const optimizeImage = useCallback((imgElement: HTMLImageElement) => {
    // Add lazy loading and optimize image
    imgElement.loading = 'lazy';
    imgElement.decoding = 'async';
  }, []);

  const createLazyLoader = useCallback(() => {
    // Create intersection observer for lazy loading
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        }
      });
    });
  }, []);

  const cleanup = useCallback(() => {
    optimizeComponent();
    // Additional cleanup if needed
  }, [optimizeComponent]);

  return {
    metrics,
    startRender,
    endRender,
    optimizeComponent,
    optimizeImage,
    createLazyLoader,
    cleanup,
    isHighMemoryUsage: metrics.memoryUsage > memoryThreshold,
    isSlowRender: metrics.lastRenderTime > 16.67 // 60fps threshold
  };
};