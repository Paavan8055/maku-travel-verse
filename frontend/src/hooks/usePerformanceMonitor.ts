import { useEffect, useRef, useState } from 'react';
import { trackPerformance } from '@/utils/errorReporting';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  loadTime?: number;
  interactionDelay?: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now());
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0
  });

  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    
    // Track component render time
    trackPerformance(`${componentName}_render`, renderTime, {
      component: componentName,
      timestamp: new Date().toISOString()
    });

    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      memoryUsage
    }));
  }, [componentName]);

  // Measure interaction delays
  const measureInteraction = (interactionName: string) => {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const delay = endTime - startTime;
      
      trackPerformance(`${componentName}_${interactionName}`, delay, {
        component: componentName,
        interaction: interactionName,
        timestamp: new Date().toISOString()
      });

      setMetrics(prev => ({
        ...prev,
        interactionDelay: delay
      }));
    };
  };

  return {
    metrics,
    measureInteraction
  };
};

// Web Vitals monitoring
export const useWebVitals = () => {
  const [vitals, setVitals] = useState<{
    CLS?: number;
    FID?: number;
    FCP?: number;
    LCP?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    // Largest Contentful Paint
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        setVitals(prev => ({ ...prev, LCP: lastEntry.startTime }));
        trackPerformance('web_vital_lcp', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      return observer;
    };

    // First Contentful Paint
    const observeFCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint') as any;
        if (fcpEntry) {
          setVitals(prev => ({ ...prev, FCP: fcpEntry.startTime }));
          trackPerformance('web_vital_fcp', fcpEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      return observer;
    };

    // Cumulative Layout Shift
    const observeCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        setVitals(prev => ({ ...prev, CLS: clsValue }));
        trackPerformance('web_vital_cls', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      return observer;
    };

    // First Input Delay
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0] as any;
        if (firstInput) {
          const fid = firstInput.processingStart - firstInput.startTime;
          setVitals(prev => ({ ...prev, FID: fid }));
          trackPerformance('web_vital_fid', fid);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
      return observer;
    };

    const observers = [
      observeLCP(),
      observeFCP(),
      observeCLS(),
      observeFID()
    ];

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  return vitals;
};

// Resource loading performance
export const useResourcePerformance = () => {
  const [resources, setResources] = useState<PerformanceResourceTiming[]>([]);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      setResources(prev => [...prev, ...entries]);
      
      // Track slow resources
      entries.forEach(entry => {
        if (entry.duration > 1000) { // Slower than 1 second
          trackPerformance('slow_resource', entry.duration, {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  const getResourcesByType = (type: string) => {
    return resources.filter(resource => resource.initiatorType === type);
  };

  const getSlowResources = (threshold = 1000) => {
    return resources.filter(resource => resource.duration > threshold);
  };

  return {
    resources,
    getResourcesByType,
    getSlowResources
  };
};