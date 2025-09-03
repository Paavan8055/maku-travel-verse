import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminData } from '@/hooks/useAdminData';
import { AlertTriangle, Activity, Users, Database } from 'lucide-react';
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer';

export const RealTimeMetricsCard = () => {
  const { 
    metrics, 
    criticalAlerts, 
    providerHealth, 
    isLoading,
    getHealthStatus,
    getMetricsSummary 
  } = useAdminData();
  
  const { 
    startRender, 
    endRender, 
    isHighMemoryUsage, 
    isSlowRender 
  } = usePerformanceOptimizer({
    componentName: 'RealTimeMetricsCard',
    enableMonitoring: true,
    reportToAnalytics: true
  });

  const [localMetrics, setLocalMetrics] = useState({
    totalBookings: 0,
    activeAlerts: 0,
    healthyProviders: 0,
    totalProviders: 0
  });

  useEffect(() => {
    startRender();
    
    if (metrics) {
      const summary = getMetricsSummary();
      setLocalMetrics({
        totalBookings: summary.totalBookings,
        activeAlerts: summary.totalAlerts,
        healthyProviders: summary.healthyProviders,
        totalProviders: summary.totalProviders
      });
    }

    return () => {
      endRender();
    };
  }, [metrics, startRender, endRender, getMetricsSummary]);

  const healthStatus = getHealthStatus();
  const healthPercentage = localMetrics.totalProviders > 0 
    ? (localMetrics.healthyProviders / localMetrics.totalProviders) * 100 
    : 0;

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'secondary';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <Activity className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="relative">
        <CardHeader className="space-y-0 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <div className="h-4 w-4 animate-pulse bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative transition-all duration-200 ${isSlowRender ? 'border-orange-500' : ''}`}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getHealthStatusColor(healthStatus)} className="text-xs">
              {getHealthStatusIcon(healthStatus)}
              <span className="ml-1 capitalize">{healthStatus}</span>
            </Badge>
            {isHighMemoryUsage && (
              <Badge variant="destructive" className="text-xs">
                High Memory
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Provider Health */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider Health</span>
              <span className="font-medium">{localMetrics.healthyProviders}/{localMetrics.totalProviders}</span>
            </div>
            <Progress 
              value={healthPercentage} 
              className="h-2"
              aria-label={`${healthPercentage.toFixed(1)}% providers healthy`}
            />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Bookings</span>
              </div>
              <p className="text-lg font-semibold">{localMetrics.totalBookings}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Active Alerts</span>
              </div>
              <p className="text-lg font-semibold text-destructive">{localMetrics.activeAlerts}</p>
            </div>
          </div>

          {/* Real-time Indicator */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">Real-time data</span>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600">Live</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};