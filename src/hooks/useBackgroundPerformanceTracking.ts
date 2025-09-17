import { useEffect, useRef } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useWebVitals } from '@/hooks/usePerformanceMonitor';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceData {
  componentName: string;
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
  route: string;
  webVitals: {
    lcp?: number;
    fcp?: number;
    cls?: number;
    fid?: number;
  };
}

export const useBackgroundPerformanceTracking = (componentName: string) => {
  const { metrics, measureInteraction } = usePerformanceMonitor('FlightSearchPage');
  const webVitals = useWebVitals();
  const lastReported = useRef<number>(0);
  const collectedMetrics = useRef<PerformanceData[]>([]);

  // Silent performance data collection
  useEffect(() => {
    const collectPerformanceData = () => {
      const currentRoute = window.location.pathname;
      const performanceData: PerformanceData = {
        componentName,
        renderTime: metrics.renderTime || 0,
        memoryUsage: metrics.memoryUsage || 0,
        timestamp: Date.now(),
        route: currentRoute,
        webVitals: {
          lcp: webVitals.LCP,
          fcp: webVitals.FCP,
          cls: webVitals.CLS,
          fid: webVitals.FID
        }
      };

      collectedMetrics.current.push(performanceData);

      // Send metrics every 30 seconds or when 10 metrics are collected
      if (
        collectedMetrics.current.length >= 10 ||
        Date.now() - lastReported.current > 30000
      ) {
        sendMetricsToAnalytics();
      }
    };

    const interval = setInterval(collectPerformanceData, 5000);
    return () => clearInterval(interval);
  }, [componentName, metrics, webVitals]);

  const sendMetricsToAnalytics = async () => {
    if (collectedMetrics.current.length === 0) return;

    try {
      // Send to admin analytics (not user-facing)
      await supabase.functions.invoke('track-performance', {
        body: {
          metrics: collectedMetrics.current,
          source: 'background_tracking',
          user_facing: false
        }
      });

      // Clear collected metrics
      collectedMetrics.current = [];
      lastReported.current = Date.now();
    } catch (error) {
      console.debug('Background analytics collection failed:', error);
      // Fail silently - this should not affect user experience
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (collectedMetrics.current.length > 0) {
        sendMetricsToAnalytics();
      }
    };
  }, []);

  return {
    measureInteraction,
    // Only for admin debugging - not for production traveler tracking
    getCollectedMetrics: () => collectedMetrics.current,
    sendMetrics: sendMetricsToAnalytics
  };
};