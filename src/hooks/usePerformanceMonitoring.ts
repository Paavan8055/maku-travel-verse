import { useEffect, useCallback, useRef } from 'react';
import { useErrorReporting } from './useErrorReporting';

interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  warning: number;
  critical: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  warning: 3000, // 3 seconds
  critical: 5000  // 5 seconds
};

export const usePerformanceMonitoring = (
  componentName: string,
  thresholds: Partial<PerformanceThresholds> = {}
) => {
  const { reportError, reportEvent } = useErrorReporting();
  const metricsRef = useRef<Map<string, number>>(new Map());
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Start timing an operation
  const startTiming = useCallback((operationName: string) => {
    const key = `${componentName}-${operationName}`;
    metricsRef.current.set(key, performance.now());
  }, [componentName]);

  // End timing and report metrics
  const endTiming = useCallback((
    operationName: string,
    metadata?: Record<string, any>
  ) => {
    const key = `${componentName}-${operationName}`;
    const startTime = metricsRef.current.get(key);
    
    if (!startTime) {
      console.warn(`No start time found for operation: ${key}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const metrics: PerformanceMetrics = {
      name: key,
      duration,
      startTime,
      endTime,
      metadata
    };

    // Determine severity based on thresholds
    let severity: 'info' | 'warning' | 'error' = 'info';
    if (duration > finalThresholds.critical) {
      severity = 'error';
    } else if (duration > finalThresholds.warning) {
      severity = 'warning';
    }

    // Report the performance metric
    reportEvent('performance_metric', {
      component: componentName,
      operation: operationName,
      duration,
      severity,
      thresholds: finalThresholds,
      ...metadata
    }, severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info');

    // Report as error if critical threshold exceeded
    if (severity === 'error') {
      reportError(
        new Error(`Performance critical: ${key} took ${duration.toFixed(2)}ms`),
        {
          section: 'performance',
          ...metadata
        },
        'high'
      );
    }

    metricsRef.current.delete(key);
    return metrics;
  }, [componentName, finalThresholds, reportError, reportEvent]);

  // Measure async operations
  const measureAsync = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    startTiming(operationName);
    try {
      const result = await operation();
      endTiming(operationName, { ...metadata, success: true });
      return result;
    } catch (error) {
      endTiming(operationName, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, [startTiming, endTiming]);

  // Measure sync operations
  const measureSync = useCallback(<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T => {
    startTiming(operationName);
    try {
      const result = operation();
      endTiming(operationName, { ...metadata, success: true });
      return result;
    } catch (error) {
      endTiming(operationName, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, [startTiming, endTiming]);

  // Monitor component mount/unmount
  useEffect(() => {
    const mountStart = performance.now();
    
    return () => {
      const mountDuration = performance.now() - mountStart;
      reportEvent('component_lifecycle', {
        component: componentName,
        event: 'unmount',
        mountDuration,
        severity: mountDuration > 1000 ? 'warning' : 'info'
      });
    };
  }, [componentName, reportEvent]);

  // Monitor Web Vitals
  const measureWebVitals = useCallback(() => {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    const fcpEntries = performance.getEntriesByName('first-contentful-paint');
    if (fcpEntries.length > 0) {
      const fcp = fcpEntries[0].startTime;
      reportEvent('web_vital', {
        metric: 'first_contentful_paint',
        value: fcp,
        component: componentName,
        good: fcp < 1800,
        needs_improvement: fcp >= 1800 && fcp < 3000
      });
    }

    // Largest Contentful Paint
    const lcpEntries = performance.getEntriesByName('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lcp = lcpEntries[lcpEntries.length - 1].startTime;
      reportEvent('web_vital', {
        metric: 'largest_contentful_paint',
        value: lcp,
        component: componentName,
        good: lcp < 2500,
        needs_improvement: lcp >= 2500 && lcp < 4000
      });
    }

    // Cumulative Layout Shift would require a PerformanceObserver
    // which is more complex and should be implemented at app level
  }, [componentName, reportEvent]);

  // Monitor API calls
  const measureApiCall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return measureAsync(
      `api_call_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
      apiCall,
      {
        endpoint,
        type: 'api_call',
        ...metadata
      }
    );
  }, [measureAsync]);

  return {
    startTiming,
    endTiming,
    measureAsync,
    measureSync,
    measureWebVitals,
    measureApiCall,
    // Helper for common patterns
    measureRender: useCallback((renderFunction: () => void, metadata?: Record<string, any>) => {
      return measureSync('render', renderFunction, metadata);
    }, [measureSync]),
    measureEffect: useCallback((effectFunction: () => void | (() => void), metadata?: Record<string, any>) => {
      return measureSync('effect', effectFunction, metadata);
    }, [measureSync])
  };
};