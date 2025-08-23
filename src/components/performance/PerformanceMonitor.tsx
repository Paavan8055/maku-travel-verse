import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Clock, Users } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  coreWebVitals: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
    fid: number; // First Input Delay
  };
  apiResponseTimes: {
    average: number;
    p95: number;
    failures: number;
  };
  userMetrics: {
    bounceRate: number;
    conversionRate: number;
    pageViews: number;
  };
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
  componentName?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  componentName = "Unknown"
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const collectMetrics = async () => {
      try {
        // Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          // Process performance entries
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });

        // Simulate metrics collection (replace with real implementation)
        const mockMetrics: PerformanceMetrics = {
          loadTime: Math.random() * 2000 + 500,
          renderTime: Math.random() * 100 + 50,
          memoryUsage: Math.random() * 50 + 10,
          coreWebVitals: {
            fcp: Math.random() * 1000 + 500,
            lcp: Math.random() * 2000 + 1000,
            cls: Math.random() * 0.1,
            fid: Math.random() * 50 + 10
          },
          apiResponseTimes: {
            average: Math.random() * 500 + 200,
            p95: Math.random() * 1000 + 500,
            failures: Math.floor(Math.random() * 5)
          },
          userMetrics: {
            bounceRate: Math.random() * 30 + 20,
            conversionRate: Math.random() * 10 + 2,
            pageViews: Math.floor(Math.random() * 1000 + 100)
          }
        };

        setMetrics(mockMetrics);
        setIsLoading(false);
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
        setIsLoading(false);
      }
    };

    collectMetrics();

    // Update metrics every 10 seconds
    const interval = setInterval(collectMetrics, 10000);
    return () => clearInterval(interval);
  }, [componentName]);

  const getPerformanceScore = (value: number, thresholds: [number, number]): 'good' | 'needs-improvement' | 'poor' => {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  if (!isVisible || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
            <Badge variant="outline" className="text-xs">
              {componentName}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Core Web Vitals */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Core Web Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>FCP:</span>
                <span className={getScoreColor(getPerformanceScore(metrics.coreWebVitals.fcp, [1800, 3000]))}>
                  {metrics.coreWebVitals.fcp.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>LCP:</span>
                <span className={getScoreColor(getPerformanceScore(metrics.coreWebVitals.lcp, [2500, 4000]))}>
                  {metrics.coreWebVitals.lcp.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>CLS:</span>
                <span className={getScoreColor(getPerformanceScore(metrics.coreWebVitals.cls, [0.1, 0.25]))}>
                  {metrics.coreWebVitals.cls.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>FID:</span>
                <span className={getScoreColor(getPerformanceScore(metrics.coreWebVitals.fid, [100, 300]))}>
                  {metrics.coreWebVitals.fid.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>

          {/* API Performance */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              API Performance
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Avg Response:</span>
                <span>{metrics.apiResponseTimes.average.toFixed(0)}ms</span>
              </div>
              <Progress value={(1000 - metrics.apiResponseTimes.average) / 10} className="h-1" />
            </div>
          </div>

          {/* User Metrics */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Conversion
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Bounce:</span>
                <span>{metrics.userMetrics.bounceRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Convert:</span>
                <span>{metrics.userMetrics.conversionRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;