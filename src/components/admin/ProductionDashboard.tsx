import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ProviderMetric {
  provider_id: string;
  success_rate: number;
  avg_response_time: number;
  total_requests: number;
  last_success: string;
  circuit_breaker_state: 'closed' | 'open' | 'half-open';
}

interface SystemMetrics {
  total_requests_24h: number;
  success_rate_24h: number;
  avg_response_time_24h: number;
  error_count_24h: number;
  providers: ProviderMetric[];
}

export const ProductionDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Load provider metrics for the last 24 hours
      const { data: providerMetrics, error } = await supabase
        .from('provider_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process metrics by provider
      const providersMap = new Map<string, any>();
      let totalRequests = 0;
      let totalSuccesses = 0;
      let totalResponseTime = 0;
      let errorCount = 0;

      providerMetrics?.forEach(metric => {
        totalRequests++;
        if (metric.success) totalSuccesses++;
        else errorCount++;
        totalResponseTime += metric.response_time;

        if (!providersMap.has(metric.provider_id)) {
          providersMap.set(metric.provider_id, {
            provider_id: metric.provider_id,
            successes: 0,
            total: 0,
            response_times: [],
            last_success: null,
            circuit_breaker_state: 'closed'
          });
        }

        const provider = providersMap.get(metric.provider_id);
        provider.total++;
        if (metric.success) {
          provider.successes++;
          provider.last_success = metric.timestamp;
        }
        provider.response_times.push(metric.response_time);
      });

      // Calculate aggregated metrics
      const providers: ProviderMetric[] = Array.from(providersMap.values()).map(p => ({
        provider_id: p.provider_id,
        success_rate: p.total > 0 ? (p.successes / p.total) * 100 : 0,
        avg_response_time: p.response_times.length > 0 ? 
          p.response_times.reduce((a, b) => a + b, 0) / p.response_times.length : 0,
        total_requests: p.total,
        last_success: p.last_success,
        circuit_breaker_state: p.successes / p.total < 0.5 ? 'open' : 'closed'
      }));

      const systemMetrics: SystemMetrics = {
        total_requests_24h: totalRequests,
        success_rate_24h: totalRequests > 0 ? (totalSuccesses / totalRequests) * 100 : 0,
        avg_response_time_24h: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        error_count_24h: errorCount,
        providers
      };

      setMetrics(systemMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderStatus = (provider: ProviderMetric) => {
    if (provider.circuit_breaker_state === 'open') return 'down';
    if (provider.success_rate >= 95) return 'healthy';
    if (provider.success_rate >= 80) return 'degraded';
    return 'unhealthy';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': 
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <Clock className="h-4 w-4" />;
      case 'unhealthy':
      case 'down': return <AlertTriangle className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please log in to access the production dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system health and API provider performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.total_requests_24h.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.success_rate_24h.toFixed(1)}%
            </div>
            <Progress value={metrics?.success_rate_24h || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics?.avg_response_time_24h || 0)}ms
            </div>
            <p className="text-xs text-muted-foreground">Average latency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Count</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {metrics?.error_count_24h || 0}
            </div>
            <p className="text-xs text-muted-foreground">Failed requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Provider Status</CardTitle>
          <CardDescription>
            Real-time health status of all integrated API providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.providers.map((provider) => {
              const status = getProviderStatus(provider);
              return (
                <div key={provider.provider_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(status)}>
                      {getStatusIcon(status)}
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">
                        {provider.provider_id.replace('-', ' ')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {provider.total_requests} requests • {Math.round(provider.avg_response_time)}ms avg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{provider.success_rate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Success rate</p>
                    </div>
                    <Badge variant={status === 'healthy' ? 'default' : status === 'degraded' ? 'secondary' : 'destructive'}>
                      {status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {metrics && metrics.success_rate_24h < 95 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System success rate is below 95% ({metrics.success_rate_24h.toFixed(1)}%). 
            Some providers may be experiencing issues.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};