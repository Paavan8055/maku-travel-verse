import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Zap, Eye, Gauge } from 'lucide-react';
import { usePerformanceMonitor, useWebVitals, useResourcePerformance } from '@/hooks/usePerformanceMonitor';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
  description: string;
}

export const PerformanceValidationDashboard = () => {
  const { metrics } = usePerformanceMonitor('PerformanceValidationDashboard');
  const vitals = useWebVitals();
  const { resources, getSlowResources } = useResourcePerformance();
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const calculateMetrics = () => {
    const metricsData: PerformanceMetric[] = [];

    // Web Vitals
    if (vitals.LCP) {
      metricsData.push({
        name: 'Largest Contentful Paint (LCP)',
        value: vitals.LCP,
        threshold: 2500,
        unit: 'ms',
        status: vitals.LCP <= 2500 ? 'good' : vitals.LCP <= 4000 ? 'warning' : 'poor',
        description: 'Time to render the largest visible element'
      });
    }

    if (vitals.FID) {
      metricsData.push({
        name: 'First Input Delay (FID)',
        value: vitals.FID,
        threshold: 100,
        unit: 'ms',
        status: vitals.FID <= 100 ? 'good' : vitals.FID <= 300 ? 'warning' : 'poor',
        description: 'Time from first interaction to browser response'
      });
    }

    if (vitals.CLS !== undefined) {
      metricsData.push({
        name: 'Cumulative Layout Shift (CLS)',
        value: vitals.CLS,
        threshold: 0.1,
        unit: '',
        status: vitals.CLS <= 0.1 ? 'good' : vitals.CLS <= 0.25 ? 'warning' : 'poor',
        description: 'Visual stability of the page'
      });
    }

    if (vitals.FCP) {
      metricsData.push({
        name: 'First Contentful Paint (FCP)',
        value: vitals.FCP,
        threshold: 1800,
        unit: 'ms',
        status: vitals.FCP <= 1800 ? 'good' : vitals.FCP <= 3000 ? 'warning' : 'poor',
        description: 'Time to render first text or image'
      });
    }

    // Memory Usage
    if (metrics.memoryUsage) {
      const memoryMB = metrics.memoryUsage / (1024 * 1024);
      metricsData.push({
        name: 'Memory Usage',
        value: memoryMB,
        threshold: 50,
        unit: 'MB',
        status: memoryMB <= 50 ? 'good' : memoryMB <= 100 ? 'warning' : 'poor',
        description: 'JavaScript heap memory usage'
      });
    }

    // Render Time
    if (metrics.renderTime) {
      metricsData.push({
        name: 'Component Render Time',
        value: metrics.renderTime,
        threshold: 16,
        unit: 'ms',
        status: metrics.renderTime <= 16 ? 'good' : metrics.renderTime <= 50 ? 'warning' : 'poor',
        description: 'Time to render this component'
      });
    }

    // Network Performance
    const slowResources = getSlowResources(1000);
    if (resources.length > 0) {
      const avgLoadTime = resources.reduce((sum, r) => sum + r.duration, 0) / resources.length;
      metricsData.push({
        name: 'Average Resource Load Time',
        value: avgLoadTime,
        threshold: 500,
        unit: 'ms',
        status: avgLoadTime <= 500 ? 'good' : avgLoadTime <= 1000 ? 'warning' : 'poor',
        description: 'Average time to load external resources'
      });

      metricsData.push({
        name: 'Slow Resources',
        value: slowResources.length,
        threshold: 0,
        unit: 'count',
        status: slowResources.length === 0 ? 'good' : slowResources.length <= 2 ? 'warning' : 'poor',
        description: 'Number of resources taking >1s to load'
      });
    }

    setPerformanceMetrics(metricsData);
    
    // Calculate overall score
    const scores = metricsData.map(metric => {
      switch (metric.status) {
        case 'good': return 100;
        case 'warning': return 60;
        case 'poor': return 20;
        default: return 0;
      }
    });
    
    const avgScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    setOverallScore(Math.round(avgScore));
  };

  const runPerformanceAudit = async () => {
    setIsRunning(true);
    
    // Simulate performance testing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    calculateMetrics();
    setIsRunning(false);
  };

  useEffect(() => {
    if (Object.keys(vitals).length > 0 || metrics.renderTime) {
      calculateMetrics();
    }
  }, [vitals, metrics, resources]);

  const getStatusIcon = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: 'good' | 'warning' | 'poor') => {
    const variants = {
      good: 'default' as const,
      warning: 'secondary' as const,
      poor: 'destructive' as const
    };
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Validation Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor Core Web Vitals and application performance metrics
          </p>
        </div>
        <Button onClick={runPerformanceAudit} disabled={isRunning}>
          {isRunning ? 'Auditing...' : 'Run Performance Audit'}
        </Button>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}/100
              </div>
              <div className="text-sm text-muted-foreground">
                {overallScore >= 90 ? 'Excellent' : 
                 overallScore >= 70 ? 'Good' : 
                 overallScore >= 50 ? 'Needs Improvement' : 'Poor'}
              </div>
            </div>
            <div className="w-24 h-24">
              <Progress 
                value={overallScore} 
                className="w-full h-full rounded-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              LCP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vitals.LCP ? `${Math.round(vitals.LCP)}ms` : '--'}
            </div>
            <div className="text-xs text-muted-foreground">Largest Contentful Paint</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              FID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vitals.FID ? `${Math.round(vitals.FID)}ms` : '--'}
            </div>
            <div className="text-xs text-muted-foreground">First Input Delay</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              CLS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vitals.CLS !== undefined ? vitals.CLS.toFixed(3) : '--'}
            </div>
            <div className="text-xs text-muted-foreground">Cumulative Layout Shift</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              FCP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vitals.FCP ? `${Math.round(vitals.FCP)}ms` : '--'}
            </div>
            <div className="text-xs text-muted-foreground">First Contentful Paint</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      {performanceMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(metric.status)}
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-muted-foreground">{metric.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {metric.value.toFixed(metric.unit === '' ? 3 : 0)}{metric.unit}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Target: {metric.threshold}{metric.unit}
                      </span>
                      {getStatusBadge(metric.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Performance */}
      {resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Resources</div>
                  <div className="text-2xl">{resources.length}</div>
                </div>
                <div>
                  <div className="font-medium">Slow Resources</div>
                  <div className="text-2xl text-warning">{getSlowResources().length}</div>
                </div>
                <div>
                  <div className="font-medium">Avg Load Time</div>
                  <div className="text-2xl">
                    {Math.round(resources.reduce((sum, r) => sum + r.duration, 0) / resources.length)}ms
                  </div>
                </div>
              </div>
              
              {getSlowResources().length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Slow Resources (&gt;1s)</h4>
                  <div className="space-y-1">
                    {getSlowResources().slice(0, 5).map((resource, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span className="truncate">{resource.name.split('/').pop()}</span>
                        <span className="text-warning">{Math.round(resource.duration)}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};