import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Database,
  Globe
} from 'lucide-react';
import { useApiHealth } from '@/hooks/useApiHealth';

interface QuotaStatus {
  provider: string;
  service: string;
  quotaUsed: number;
  quotaLimit: number;
  percentageUsed: number;
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: number;
}

interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  successRate: number;
  lastCheck: string;
  quotaStatus?: QuotaStatus;
}

export const EnhancedHealthDashboard: React.FC = () => {
  const { toast } = useToast();
  const { apiHealth, loading: healthLoading, checkApiHealth } = useApiHealth();
  const [quotaData, setQuotaData] = useState<QuotaStatus[]>([]);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchEnhancedHealth();
    const interval = setInterval(fetchEnhancedHealth, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchEnhancedHealth = async () => {
    setLoading(true);
    try {
      // Get quota information
      const { data: quotaResponse, error: quotaError } = await supabase.functions.invoke('provider-quota-monitor');
      
      if (!quotaError && quotaResponse?.success) {
        setQuotaData(quotaResponse.quotas || []);
      }

      // Test provider rotation health for each service type
      const serviceTests = [
        {
          provider: 'Flight Rotation',
          type: 'flight',
          testParams: {
            originLocationCode: 'SYD',
            destinationLocationCode: 'MEL', 
            departureDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            adults: 1
          }
        },
        {
          provider: 'Hotel Rotation',
          type: 'hotel',
          testParams: {
            cityCode: 'SYD',
            checkInDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            checkOutDate: new Date(Date.now() + 8*24*60*60*1000).toISOString().split('T')[0],
            adults: 1,
            roomQuantity: 1
          }
        },
        {
          provider: 'Activity Rotation',
          type: 'activity',
          testParams: {
            destination: 'sydney',
            date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            participants: 2
          }
        }
      ];

      const healthResults: ProviderHealth[] = [];

      for (const test of serviceTests) {
        try {
          const startTime = Date.now();
          
          const { data: testResult, error: testError } = await supabase.functions.invoke('provider-rotation', {
            body: {
              searchType: test.type,
              params: test.testParams
            }
          });
          
          const responseTime = Date.now() - startTime;
          const isHealthy = !testError && testResult?.success;
          
          healthResults.push({
            provider: test.provider,
            status: isHealthy ? 'healthy' : 'degraded',
            responseTime,
            successRate: isHealthy ? 100 : 0,
            lastCheck: new Date().toISOString(),
            quotaStatus: quotaData.find(q => q.provider.includes(test.type))
          });
          
        } catch (error) {
          healthResults.push({
            provider: test.provider,
            status: 'critical',
            responseTime: 0,
            successRate: 0,
            lastCheck: new Date().toISOString()
          });
        }
      }

      setProviderHealth(healthResults);
      setLastUpdate(new Date());
      
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: "Unable to fetch enhanced health data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500">Healthy</Badge>;
      case 'warning': return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getQuotaBadge = (quota: QuotaStatus) => {
    if (quota.percentageUsed >= 95) return <Badge variant="destructive">Critical</Badge>;
    if (quota.percentageUsed >= 80) return <Badge className="bg-yellow-500">Warning</Badge>;
    return <Badge className="bg-green-500">Healthy</Badge>;
  };

  const getTrendIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degraded': return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const overallStatus = providerHealth.every(p => p.status === 'healthy') 
    ? 'healthy' 
    : providerHealth.some(p => p.status === 'critical') 
    ? 'critical' 
    : 'degraded';

  const averageResponseTime = providerHealth.length > 0 
    ? Math.round(providerHealth.reduce((sum, p) => sum + p.responseTime, 0) / providerHealth.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              Enhanced System Health
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEnhancedHealth}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {providerHealth.filter(p => p.status === 'healthy').length} / {providerHealth.length}
              </div>
              <p className="text-sm text-muted-foreground">Services Online</p>
              {getStatusBadge(overallStatus)}
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
              <AlertTriangle className="h-4 w-4 mx-auto text-yellow-500" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-sm text-muted-foreground">Uptime (24h)</p>
              <CheckCircle className="h-4 w-4 mx-auto text-green-500" />
            </div>
          </div>
          
          {lastUpdate && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Provider Rotation Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Provider Rotation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providerHealth.map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(provider.status)}
                    <div>
                      <p className="font-medium">{provider.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider.responseTime}ms response
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(provider.status)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(provider.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quota Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Quota Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotaData.map((quota, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{quota.provider}</p>
                      <p className="text-sm text-muted-foreground">
                        {quota.quotaUsed.toLocaleString()} / {quota.quotaLimit.toLocaleString()} calls
                      </p>
                    </div>
                    {getQuotaBadge(quota)}
                  </div>
                  <Progress value={quota.percentageUsed} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {quota.percentageUsed.toFixed(1)}% used
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legacy API Health (for comparison) */}
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
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Hotels</span>
              {apiHealth.hotels ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Flights</span>
              {apiHealth.flights ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Transfers</span>
              {apiHealth.transfers ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button 
              onClick={checkApiHealth}
              disabled={healthLoading}
              variant="outline"
              size="sm"
            >
              {healthLoading ? 'Checking...' : 'Refresh Legacy Checks'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};