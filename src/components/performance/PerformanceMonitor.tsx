
import { useEffect, useState } from 'react';
import logger from '@/utils/logger';

interface PerformanceMetrics {
  navigation?: PerformanceNavigationTiming;
  paint?: PerformanceEntry[];
  resources?: PerformanceResourceTiming[];
  vitals?: {
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay
    cls: number | null; // Cumulative Layout Shift
    fcp: number | null; // First Contentful Paint
    ttfb: number | null; // Time to First Byte
  };
}

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

export const PerformanceMonitor = ({ children }: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  // Monitor Core Web Vitals
  useEffect(() => {
    const vitals = {
      lcp: null as number | null,
      fid: null as number | null,
      cls: null as number | null,
      fcp: null as number | null,
      ttfb: null as number | null,
    };

    // Largest Contentful Paint
    const observeLCP = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime;
              setMetrics(prev => ({ ...prev, vitals }));
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Clean up observer after 10 seconds
          setTimeout(() => observer.disconnect(), 10000);
        } catch (error) {
          logger.warn('LCP observation failed:', error);
        }
      }
    };

    // First Input Delay
    const observeFID = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.name === 'first-input') {
                vitals.fid = entry.processingStart - entry.startTime;
                setMetrics(prev => ({ ...prev, vitals }));
              }
            });
          });
          observer.observe({ entryTypes: ['first-input'] });
        } catch (error) {
          logger.warn('FID observation failed:', error);
        }
      }
    };

    // Time to First Byte
    const measureTTFB = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          vitals.ttfb = navigation.responseStart - navigation.requestStart;
          setMetrics(prev => ({ ...prev, vitals }));
        }
      }
    };

    // Start observations
    observeLCP();
    observeFID();
    measureTTFB();

    return () => {
      // Cleanup is handled by individual observers
    };
  }, []);

  // Monitor navigation performance
  useEffect(() => {
    const collectNavigationMetrics = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        setMetrics(prev => ({
          ...prev,
          navigation,
          paint,
          resources: resources.slice(-50) // Keep last 50 resources
        }));
      }
    };

    // Collect metrics when the page is fully loaded
    if (document.readyState === 'complete') {
      collectNavigationMetrics();
    } else {
      window.addEventListener('load', collectNavigationMetrics);
      return () => window.removeEventListener('load', collectNavigationMetrics);
    }
  }, []);

  // Report performance metrics
  useEffect(() => {
    const reportMetrics = () => {
      if (metrics.vitals && Object.values(metrics.vitals).some(v => v !== null)) {
        const performanceData = {
          url: window.location.href,
          timestamp: Date.now(),
          vitals: metrics.vitals,
        };

        // Log performance data
        logger.info('Performance metrics:', performanceData);

        // Send to analytics if available
        if ((window as any).gtag) {
          (window as any).gtag('event', 'performance_measurement', {
            custom_parameter: performanceData,
            lcp: metrics.vitals.lcp,
            fid: metrics.vitals.fid,
            cls: metrics.vitals.cls,
            fcp: metrics.vitals.fcp,
            ttfb: metrics.vitals.ttfb
          });
        }
      }
    };

    // Report metrics after 5 seconds
    const timer = setTimeout(reportMetrics, 5000);
    return () => clearTimeout(timer);
  }, [metrics]);

  return <>{children}</>;
};
