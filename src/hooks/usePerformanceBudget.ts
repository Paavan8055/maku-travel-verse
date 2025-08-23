import { useEffect, useState } from 'react';

interface PerformanceBudget {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
}

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  isWithinBudget: boolean;
  violations: string[];
}

const PERFORMANCE_BUDGETS: PerformanceBudget = {
  lcp: 2500, // Good: < 2.5s
  fid: 100,  // Good: < 100ms
  cls: 0.1,  // Good: < 0.1
  fcp: 1800, // Good: < 1.8s
  ttfb: 800  // Good: < 800ms
};

export const usePerformanceBudget = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const measurePerformance = () => {
      // Wait for page load to complete
      if (document.readyState !== 'complete') {
        window.addEventListener('load', measurePerformance, { once: true });
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const currentMetrics: Partial<PerformanceMetrics> = {};
        const violations: string[] = [];

        entries.forEach((entry) => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              currentMetrics.lcp = entry.startTime;
              if (entry.startTime > PERFORMANCE_BUDGETS.lcp) {
                violations.push(`LCP (${entry.startTime.toFixed(0)}ms) exceeds budget (${PERFORMANCE_BUDGETS.lcp}ms)`);
              }
              break;
              
            case 'first-input':
              const fidEntry = entry as any;
              currentMetrics.fid = fidEntry.processingStart - fidEntry.startTime;
              if (fidEntry.processingStart - fidEntry.startTime > PERFORMANCE_BUDGETS.fid) {
                violations.push(`FID (${(fidEntry.processingStart - fidEntry.startTime).toFixed(0)}ms) exceeds budget (${PERFORMANCE_BUDGETS.fid}ms)`);
              }
              break;
              
            case 'layout-shift':
              const clsEntry = entry as any;
              if (!clsEntry.hadRecentInput) {
                currentMetrics.cls = (currentMetrics.cls || 0) + clsEntry.value;
                if (currentMetrics.cls > PERFORMANCE_BUDGETS.cls) {
                  violations.push(`CLS (${currentMetrics.cls.toFixed(3)}) exceeds budget (${PERFORMANCE_BUDGETS.cls})`);
                }
              }
              break;
              
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                currentMetrics.fcp = entry.startTime;
                if (entry.startTime > PERFORMANCE_BUDGETS.fcp) {
                  violations.push(`FCP (${entry.startTime.toFixed(0)}ms) exceeds budget (${PERFORMANCE_BUDGETS.fcp}ms)`);
                }
              }
              break;
              
            case 'navigation':
              const navEntry = entry as PerformanceNavigationTiming;
              currentMetrics.ttfb = navEntry.responseStart - navEntry.requestStart;
              if (currentMetrics.ttfb > PERFORMANCE_BUDGETS.ttfb) {
                violations.push(`TTFB (${currentMetrics.ttfb.toFixed(0)}ms) exceeds budget (${PERFORMANCE_BUDGETS.ttfb}ms)`);
              }
              break;
          }
        });

        // Update metrics state
        setMetrics(prev => {
          const updated = { ...prev, ...currentMetrics };
          return {
            lcp: updated.lcp || 0,
            fid: updated.fid || 0,
            cls: updated.cls || 0,
            fcp: updated.fcp || 0,
            ttfb: updated.ttfb || 0,
            isWithinBudget: violations.length === 0,
            violations: Array.from(new Set([...(prev?.violations || []), ...violations]))
          };
        });
      });

      // Observe Core Web Vitals
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (e) {
        console.warn('Some performance observers not supported:', e);
      }

      // Observe paint metrics
      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('Paint observer not supported:', e);
      }

      // Observe navigation timing
      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Navigation observer not supported:', e);
      }

      // Fallback to performance.timing for older browsers
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          setMetrics(prev => ({
            lcp: prev?.lcp || 0,
            fid: prev?.fid || 0,
            cls: prev?.cls || 0,
            fcp: prev?.fcp || 0,
            ttfb,
            isWithinBudget: prev?.isWithinBudget !== false && ttfb <= PERFORMANCE_BUDGETS.ttfb,
            violations: prev?.violations || []
          }));
        }
        setIsLoading(false);
      }, 2000);

      return () => {
        observer.disconnect();
      };
    };

    measurePerformance();
  }, []);

  const reportViolations = () => {
    if (metrics?.violations.length) {
      console.group('🚨 Performance Budget Violations');
      metrics.violations.forEach(violation => {
        console.warn(violation);
      });
      console.groupEnd();

      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // Example: analytics.track('performance_budget_violation', { violations: metrics.violations });
      }
    }
  };

  const getScoreColor = (metric: keyof PerformanceBudget, value: number): string => {
    const budget = PERFORMANCE_BUDGETS[metric];
    
    if (metric === 'cls') {
      // CLS scoring is different (lower is better)
      if (value <= 0.1) return 'text-green-600';
      if (value <= 0.25) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // For time-based metrics (lower is better)
    const ratio = value / budget;
    if (ratio <= 0.75) return 'text-green-600';
    if (ratio <= 1.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceGrade = (): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (!metrics) return 'F';
    
    let score = 100;
    
    // Deduct points for each violation
    if (metrics.lcp > PERFORMANCE_BUDGETS.lcp) score -= 20;
    if (metrics.fid > PERFORMANCE_BUDGETS.fid) score -= 20;
    if (metrics.cls > PERFORMANCE_BUDGETS.cls) score -= 20;
    if (metrics.fcp > PERFORMANCE_BUDGETS.fcp) score -= 20;
    if (metrics.ttfb > PERFORMANCE_BUDGETS.ttfb) score -= 20;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return {
    metrics,
    isLoading,
    budgets: PERFORMANCE_BUDGETS,
    reportViolations,
    getScoreColor,
    getPerformanceGrade
  };
};