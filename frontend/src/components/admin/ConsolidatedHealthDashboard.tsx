import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Monitor,
  Database,
  Zap,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useApiHealth } from '@/hooks/useApiHealth';

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

interface QuotaStatus {
  provider: string;
  service: string;
  quotaUsed: number;
  quotaLimit: number;
  percentageUsed: number;
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: number;
}

export const ConsolidatedHealthDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { apiHealth, loading: legacyHealthLoading, checkApiHealth } = useApiHealth();
  const [quotaData, setQuotaData] = useState<QuotaStatus[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Unified health data from enhanced monitoring
  const { data: healthData, isLoading, error, refetch } = useQuery({
    queryKey: ['consolidated-health'],
    queryFn: async (): Promise<UnifiedHealthData> => {
      const { data, error } = await supabase.functions.invoke('unified-health-monitor');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    fetchQuotaData();
    const interval = setInterval(fetchQuotaData, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchQuotaData = async () => {
    try {
      const { data: quotaResponse, error: quotaError } = await supabase.functions.invoke('provider-quota-monitor');
      
      if (!quotaError && quotaResponse?.success) {
        setQuotaData(quotaResponse.quotas || []);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch quota data:', error);
    }
  };

  const handleManualRefresh = async () => {
    try {
      await Promise.all([refetch(), fetchQuotaData(), checkApiHealth()]);
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
      
      queryClient.invalidateQueries({ queryKey: ['consolidated-health'] });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: `Failed to reset circuit breaker for ${providerId}.`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'critical': 
      case 'outage': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-success';
      case 'degraded': return 'bg-warning';
      case 'critical':
      case 'outage': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default">Healthy</Badge>;
      case 'warning': 
      case 'degraded': return <Badge variant="secondary">Warning</Badge>;
      case 'critical': 
      case 'outage': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getQuotaBadge = (quota: QuotaStatus) => {
    if (quota.percentageUsed >= 95) return <Badge variant="destructive">Critical</Badge>;
    if (quota.percentageUsed >= 80) return <Badge variant="secondary">Warning</Badge>;
    return <Badge variant="default">Healthy</Badge>;
  };

  const getQuotaColor = (percentage: number, status: string) => {
    if (status === 'critical' || percentage >= 90) return 'destructive';
    if (status === 'warning' || percentage >= 75) return 'secondary';
    return 'outline';
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case 'closed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'open': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'half-open': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'degraded': return <Minus className="h-4 w-4 text-warning" />;
      case 'critical': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const overallStatus = healthData?.overallStatus || 'unknown';
  const averageResponseTime = healthData?.providers?.length > 0 
    ? Math.round(healthData.providers.reduce((sum, p) => sum + p.responseTime, 0) / healthData.providers.length)
    : 0;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive provider health, quota, and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {healthData ? new Date(healthData.timestamp).toLocaleString() : lastUpdate?.toLocaleTimeString() || 'Never'}
          </div>
          <Button variant="outline" size="sm" onClick={handleManualRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getStatusColor(overallStatus)}`}>
                {getStatusIcon(overallStatus)}
              </div>
              <p className="mt-2 font-semibold capitalize">{overallStatus}</p>
              <p className="text-sm text-muted-foreground">Overall Status</p>
              {getStatusBadge(overallStatus)}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {healthData?.summary?.healthyProviders || 0} / {healthData?.summary?.totalProviders || 0}
              </div>
              <p className="text-sm text-muted-foreground">Services Online</p>
              {getTrendIcon(overallStatus)}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{averageResponseTime}ms</div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              {getTrendIcon(averageResponseTime < 1000 ? 'healthy' : averageResponseTime < 2000 ? 'degraded' : 'critical')}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {quotaData.filter(q => q.status === 'critical').length}
              </div>
              <p className="text-sm text-muted-foreground">Critical Quotas</p>
              <AlertTriangle className="h-4 w-4 mx-auto text-warning" />
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="quotas">Quotas</TabsTrigger>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Health</TabsTrigger>
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
                    {getStatusBadge(provider.status)}
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
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
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
            {quotaData.length > 0 ? quotaData.map((quota, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="capitalize">{quota.provider}</span>
                    <Database className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quota Status:</span>
                    {getQuotaBadge(quota)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Usage:</span>
                    <span className="text-sm font-mono">{quota.percentageUsed.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Used / Limit:</span>
                    <span className="text-sm font-mono">
                      {quota.quotaUsed.toLocaleString()} / {quota.quotaLimit.toLocaleString()}
                    </span>
                  </div>
                  
                  <Progress value={quota.percentageUsed} className="h-2" />
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
                  Response Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthData?.providers?.length > 0 ? healthData.providers.map((provider) => (
                    <div key={provider.providerId} className="flex justify-between items-center">
                      <span className="text-sm">{provider.providerName}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              provider.responseTime > 5000 ? 'bg-destructive' :
                              provider.responseTime > 2000 ? 'bg-warning' : 'bg-success'
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
                  
                  {(!healthData?.summary?.criticalQuotaProviders?.length && !healthData?.summary?.circuitBreakersOpen?.length) && (
                    <div className="text-center py-4 text-muted-foreground">
                      No active alerts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="legacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Legacy API Health Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Activities</span>
                  {apiHealth.activities ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Hotels</span>
                  {apiHealth.hotels ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Flights</span>
                  {apiHealth.flights ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Transfers</span>
                  {apiHealth.transfers ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Button 
                  onClick={checkApiHealth}
                  disabled={legacyHealthLoading}
                  variant="outline"
                  size="sm"
                >
                  {legacyHealthLoading ? 'Checking...' : 'Refresh Legacy Checks'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};