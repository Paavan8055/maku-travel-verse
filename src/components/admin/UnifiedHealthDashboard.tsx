import React from 'react';
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
  Database,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ProviderHealthStatus {
  providerId: string;
  providerName: string;
  status: 'healthy' | 'degraded' | 'outage';
  responseTime: number;
  lastChecked: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  failureCount: number;
  quotaStatus: string;
  quotaPercentage: number;
  credentialsValid: boolean;
  serviceTypes: string[];
}

interface UnifiedHealthData {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  timestamp: number;
  providers: ProviderHealthStatus[];
  summary: {
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    outageProviders: number;
    criticalQuotaProviders: string[];
    circuitBreakersOpen: string[];
  };
  recommendations: string[];
}

export const UnifiedHealthDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: healthData, isLoading, error, refetch } = useQuery({
    queryKey: ['unified-health'],
    queryFn: async (): Promise<UnifiedHealthData> => {
      const { data, error } = await supabase.functions.invoke('unified-health-monitor');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleManualRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Health Status Refreshed",
        description: "Latest provider health data has been loaded.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh health status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCircuitBreakerReset = async (providerId: string) => {
    try {
      const { error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          action: 'reset-circuit-breaker',
          providerId: providerId
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Circuit Breaker Reset",
        description: `Circuit breaker for ${providerId} has been reset.`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['unified-health'] });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: `Failed to reset circuit breaker for ${providerId}.`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load health status: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'outage': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'outage': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getQuotaColor = (percentage: number, status: string) => {
    if (status === 'critical' || percentage >= 90) return 'destructive';
    if (status === 'warning' || percentage >= 75) return 'secondary';
    return 'outline';
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case 'closed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'open': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'half-open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unified Health Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive provider health, quota, and circuit breaker monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {healthData ? new Date(healthData.timestamp).toLocaleString() : 'Never'}
          </div>
          <Button variant="outline" size="sm" onClick={handleManualRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getStatusColor(healthData?.overallStatus || 'unknown')}`}>
                {getStatusIcon(healthData?.overallStatus || 'unknown')}
              </div>
              <p className="mt-2 font-semibold capitalize">{healthData?.overallStatus || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">Overall Status</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{healthData?.summary?.healthyProviders || 0}</div>
              <p className="text-sm text-muted-foreground">Healthy Providers</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{healthData?.summary?.degradedProviders || 0}</div>
              <p className="text-sm text-muted-foreground">Degraded Providers</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{healthData?.summary?.outageProviders || 0}</div>
              <p className="text-sm text-muted-foreground">Outage Providers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {healthData?.recommendations && healthData.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1">
                {healthData.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Details */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Provider Status</TabsTrigger>
          <TabsTrigger value="quotas">Quota Management</TabsTrigger>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData?.providers?.length > 0 ? healthData.providers.map((provider) => (
              <Card key={provider.providerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{provider.providerName}</span>
                    {getStatusIcon(provider.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status:</span>
                    <Badge variant={provider.status === 'healthy' ? 'default' : 'destructive'}>
                      {provider.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time:</span>
                    <span className="text-sm font-mono">{provider.responseTime}ms</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Services:</span>
                    <div className="flex gap-1">
                      {provider.serviceTypes?.map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      )) || <Badge variant="outline" className="text-xs">Unknown</Badge>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Credentials:</span>
                    {provider.credentialsValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No provider data available
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quotas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData?.providers?.length > 0 ? healthData.providers.map((provider) => (
              <Card key={provider.providerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{provider.providerName}</span>
                    <Database className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quota Status:</span>
                    <Badge variant={getQuotaColor(provider.quotaPercentage, provider.quotaStatus)}>
                      {provider.quotaStatus}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Usage:</span>
                    <span className="text-sm font-mono">{provider.quotaPercentage}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        provider.quotaPercentage >= 90 ? 'bg-red-500' :
                        provider.quotaPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(provider.quotaPercentage, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No quota data available
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="circuit-breakers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData?.providers?.length > 0 ? healthData.providers.map((provider) => (
              <Card key={provider.providerId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{provider.providerName}</span>
                    <Zap className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Circuit Breaker:</span>
                    <div className="flex items-center gap-2">
                      {getCircuitBreakerIcon(provider.circuitBreakerState)}
                      <span className="text-sm capitalize">{provider.circuitBreakerState}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failure Count:</span>
                    <span className="text-sm font-mono">{provider.failureCount}</span>
                  </div>
                  
                  {provider.circuitBreakerState === 'open' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleCircuitBreakerReset(provider.providerId)}
                    >
                      Reset Circuit Breaker
                    </Button>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No circuit breaker data available
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthData?.providers?.length > 0 ? healthData.providers.map((provider) => (
                    <div key={provider.providerId} className="flex justify-between items-center">
                      <span className="text-sm">{provider.providerName}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              provider.responseTime > 5000 ? 'bg-red-500' :
                              provider.responseTime > 2000 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((provider.responseTime / 5000) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono w-16 text-right">{provider.responseTime}ms</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {healthData?.summary?.criticalQuotaProviders?.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Critical quota: {healthData.summary.criticalQuotaProviders.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {healthData?.summary?.circuitBreakersOpen?.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Circuit breakers open: {healthData.summary.circuitBreakersOpen.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {(healthData?.summary?.outageProviders || 0) > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        {healthData?.summary?.outageProviders || 0} provider(s) experiencing outages
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {(!healthData?.summary?.criticalQuotaProviders?.length || healthData.summary.criticalQuotaProviders.length === 0) && 
                   (!healthData?.summary?.circuitBreakersOpen?.length || healthData.summary.circuitBreakersOpen.length === 0) && 
                   (!healthData?.summary?.outageProviders || healthData.summary.outageProviders === 0) && (
                     <Alert>
                       <CheckCircle className="h-4 w-4" />
                       <AlertDescription>
                         All systems operating normally
                       </AlertDescription>
                     </Alert>
                   )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};