import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, Database, RefreshCw, TrendingUp, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProviderHealthData {
  provider_id: string;
  provider_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  success_rate: number;
  error_count: number;
  last_checked: string;
  quota_usage?: number;
  circuit_breaker_state?: string;
}

export const UnifiedProviderHealth: React.FC = () => {
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['unified-provider-health'],
    queryFn: async () => {
      // Fetch provider health from provider_health table
      const { data: providerHealth } = await supabase
        .from('provider_health')
        .select('*')
        .order('last_checked', { ascending: false });

      // Fetch recent API health logs
      const { data: apiLogs } = await supabase
        .from('api_health_logs')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(100);

      // Fetch provider quotas
      const { data: quotas } = await supabase
        .from('provider_quotas')
        .select('*');

      // Merge and normalize data
      const mergedData: ProviderHealthData[] = (providerHealth || []).map(health => {
        const recentLogs = apiLogs?.filter(log => log.provider === health.provider) || [];
        const quota = quotas?.find(q => q.provider_id === health.provider);
        
        const avgResponseTime = recentLogs.length > 0 
          ? recentLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / recentLogs.length
          : health.response_time_ms || 0;

        const successRate = recentLogs.length > 0
          ? (recentLogs.filter(log => log.status === 'healthy').length / recentLogs.length) * 100
          : 95;

        return {
          provider_id: health.provider,
          provider_name: health.provider,
          status: health.status as 'healthy' | 'degraded' | 'unhealthy',
          response_time_ms: avgResponseTime,
          success_rate: successRate,
          error_count: health.error_count || 0,
          last_checked: health.last_checked,
          quota_usage: quota?.percentage_used || 0,
          circuit_breaker_state: quota?.status || 'closed'
        };
      });

      return mergedData;
    },
    refetchInterval: 30000 // 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'unhealthy': return 'destructive';
      default: return 'outline';
    }
  };

  const getOverallHealth = () => {
    if (!healthData?.length) return { status: 'unknown', percentage: 0 };
    
    const healthyCount = healthData.filter(p => p.status === 'healthy').length;
    const percentage = (healthyCount / healthData.length) * 100;
    
    if (percentage >= 90) return { status: 'healthy', percentage };
    if (percentage >= 70) return { status: 'degraded', percentage };
    return { status: 'unhealthy', percentage };
  };

  const overallHealth = getOverallHealth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Unified Provider Health
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring of all service providers
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Health Overview</span>
            <Badge variant={getStatusColor(overallHealth.status)}>
              {overallHealth.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Health</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(overallHealth.percentage)}% Healthy
              </span>
            </div>
            <Progress value={overallHealth.percentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {healthData?.filter(p => p.status === 'healthy').length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {healthData?.filter(p => p.status === 'degraded').length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Degraded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {healthData?.filter(p => p.status === 'unhealthy').length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Unhealthy</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Provider Status */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Provider Status</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="quotas">Quota Management</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <div className="grid gap-4">
            {healthData?.map((provider) => (
              <Card key={provider.provider_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(provider.status)}
                      <div>
                        <h4 className="font-semibold">{provider.provider_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last checked: {new Date(provider.last_checked).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {provider.response_time_ms.toFixed(0)}ms
                        </div>
                        <div className="text-xs text-muted-foreground">Response Time</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {provider.success_rate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      <Badge variant={getStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-4">
            {healthData?.map((provider) => (
              <Card key={provider.provider_id}>
                <CardHeader>
                  <CardTitle className="text-lg">{provider.provider_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Response Time</span>
                        <span className="text-sm">{provider.response_time_ms.toFixed(0)}ms</span>
                      </div>
                      <Progress value={Math.min(provider.response_time_ms / 10, 100)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-sm">{provider.success_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={provider.success_rate} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Error Count</span>
                        <span className="text-sm">{provider.error_count}</span>
                      </div>
                      <Progress value={Math.min(provider.error_count * 10, 100)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quotas">
          <div className="grid gap-4">
            {healthData?.filter(p => p.quota_usage !== undefined).map((provider) => (
              <Card key={provider.provider_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{provider.provider_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Circuit Breaker: {provider.circuit_breaker_state}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {provider.quota_usage?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Quota Used</div>
                    </div>
                  </div>
                  <Progress value={provider.quota_usage} className="mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};