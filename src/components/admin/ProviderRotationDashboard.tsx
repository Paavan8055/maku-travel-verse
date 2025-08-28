import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  RefreshCw,
  Settings,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RotationStats {
  providerId: string;
  providerName: string;
  type: string;
  priority: number;
  enabled: boolean;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  lastUsed: string;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  quotaUsage: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

interface RotationMetrics {
  totalRotations: number;
  successRate: number;
  avgResponseTime: number;
  providerStats: RotationStats[];
  recentRotations: Array<{
    id: string;
    timestamp: string;
    searchType: string;
    selectedProvider: string;
    responseTime: number;
    success: boolean;
    fallbackUsed: boolean;
  }>;
}

export default function ProviderRotationDashboard() {
  const [metrics, setMetrics] = useState<RotationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRotationMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch provider statistics
      const { data: providerConfigs } = await supabase
        .from('provider_configs')
        .select('*')
        .order('priority');

      const { data: providerHealth } = await supabase
        .from('provider_health')
        .select('*');

      const { data: providerQuotas } = await supabase
        .from('provider_quotas')
        .select('*');

      // Build rotation metrics
      const providerStats: RotationStats[] = (providerConfigs || []).map(config => {
        const health = providerHealth?.find(h => h.provider === config.id);
        const quota = providerQuotas?.find(q => q.provider_id === config.id);
        const circuitBreaker = config.circuit_breaker as any;

        return {
          providerId: config.id,
          providerName: config.name,
          type: config.type,
          priority: config.priority,
          enabled: config.enabled,
          totalRequests: 150, // Mock data - would come from logs
          successfulRequests: 142,
          failedRequests: 8,
          avgResponseTime: health?.response_time_ms || 0,
          lastUsed: health?.last_checked || new Date().toISOString(),
          circuitBreakerState: circuitBreaker?.state || 'closed',
          quotaUsage: quota?.percentage_used || 0,
          status: (health?.status as 'healthy' | 'degraded' | 'unhealthy') || 'unhealthy'
        };
      });

      const mockMetrics: RotationMetrics = {
        totalRotations: 1247,
        successRate: 94.2,
        avgResponseTime: 850,
        providerStats,
        recentRotations: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            searchType: 'flight',
            selectedProvider: 'amadeus-flight',
            responseTime: 150,
            success: true,
            fallbackUsed: false
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            searchType: 'hotel',
            selectedProvider: 'sabre-hotel',
            responseTime: 780,
            success: true,
            fallbackUsed: false
          }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch rotation metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load rotation metrics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRotationMetrics();
    const interval = setInterval(fetchRotationMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case 'closed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'open': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'half-open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load rotation metrics. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Rotation Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor provider selection, rotation logic, and circuit breaker status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRotationMetrics} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRotations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">Successful rotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Across all providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.providerStats.filter(p => p.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently enabled</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Provider Status</TabsTrigger>
          <TabsTrigger value="rotation-history">Rotation History</TabsTrigger>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.providerStats.map((provider) => (
              <Card key={provider.providerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{provider.providerName}</span>
                    {getStatusIcon(provider.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Type:</span>
                    <Badge variant="outline">{provider.type}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Priority:</span>
                    <span className="text-sm font-mono">#{provider.priority}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate:</span>
                    <span className="text-sm font-mono">
                      {provider.totalRequests > 0 
                        ? Math.round((provider.successfulRequests / provider.totalRequests) * 100)
                        : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quota Usage:</span>
                    <span className="text-sm font-mono">{provider.quotaUsage}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Enabled:</span>
                    <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                      {provider.enabled ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rotation-history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Rotations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentRotations.map((rotation) => (
                  <div key={rotation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={rotation.success ? 'default' : 'destructive'}>
                        {rotation.searchType}
                      </Badge>
                      <span className="text-sm font-medium">{rotation.selectedProvider}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(rotation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">{rotation.responseTime}ms</span>
                      {rotation.fallbackUsed && (
                        <Badge variant="secondary">Fallback</Badge>
                      )}
                      {rotation.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circuit-breakers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.providerStats.map((provider) => (
              <Card key={provider.providerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{provider.providerName}</span>
                    <Zap className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">State:</span>
                    <div className="flex items-center gap-2">
                      {getCircuitBreakerIcon(provider.circuitBreakerState)}
                      <span className="text-sm capitalize">{provider.circuitBreakerState}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failed Requests:</span>
                    <span className="text-sm font-mono">{provider.failedRequests}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time:</span>
                    <span className="text-sm font-mono">{provider.avgResponseTime}ms</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Provider Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.providerStats.map((provider) => (
                  <div key={provider.providerId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{provider.providerName}</span>
                      <span>{provider.avgResponseTime}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          provider.avgResponseTime > 2000 ? 'bg-red-500' :
                          provider.avgResponseTime > 1000 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min((provider.avgResponseTime / 3000) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}