import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface ProviderHealthData {
  provider: string;
  status: string;
  last_checked: string;
  response_time_ms: number;
  error_count: number;
  failure_count: number;
  quota_usage: number;
  quota_status: string;
}

interface ProviderRotationError {
  timestamp: string;
  provider: string;
  error_message: string;
  search_type: string;
  response_time: number;
}

export function ProviderHealthMonitor() {
  const [providers, setProviders] = useState<ProviderHealthData[]>([]);
  const [recentErrors, setRecentErrors] = useState<ProviderRotationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchProviderHealth = async () => {
    setIsLoading(true);
    try {
      // Fetch provider health data
      const { data: healthData, error: healthError } = await supabase
        .from('provider_health')
        .select('*')
        .order('last_checked', { ascending: false });

      if (healthError) throw healthError;

      // Fetch quota information
      const { data: quotaData, error: quotaError } = await supabase
        .from('provider_quotas')
        .select('*');

      if (quotaError) throw quotaError;

      // Combine health and quota data
      const combinedData = healthData?.map(health => {
        const quota = quotaData?.find(q => q.provider_id === health.provider);
        return {
          ...health,
          quota_usage: quota?.percentage_used || 0,
          quota_status: quota?.status || 'healthy'
        };
      }) || [];

      setProviders(combinedData);

      // Fetch recent rotation errors from system logs
      const { data: errorLogs, error: errorLogsError } = await supabase
        .from('system_logs')
        .select('*')
        .eq('service_name', 'provider-rotation')
        .eq('log_level', 'error')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (!errorLogsError && errorLogs) {
        const parsedErrors = errorLogs.map(log => {
          const metadata = typeof log.metadata === 'object' && log.metadata !== null ? log.metadata : {};
          return {
            timestamp: log.created_at,
            provider: (metadata as any)?.provider || 'unknown',
            error_message: log.message,
            search_type: (metadata as any)?.searchType || 'unknown',
            response_time: log.duration_ms || 0
          };
        });
        setRecentErrors(parsedErrors);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch provider health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'down':
      case 'critical':
      case 'exceeded':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
      case 'warning':
        return 'secondary';
      case 'down':
      case 'critical':
      case 'exceeded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    fetchProviderHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProviderHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Provider Health Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time monitoring of travel API providers and quota usage
          </p>
        </div>
        <Button 
          onClick={fetchProviderHealth} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Critical Errors Alert */}
      {recentErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Issue Detected:</strong> Multiple provider rotation failures in the last 24 hours.
            <br />
            Latest error: {recentErrors[0]?.error_message}
            <br />
            <em>This may impact search functionality and user experience.</em>
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card key={provider.provider}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{provider.provider}</span>
                {getStatusIcon(provider.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={getStatusColor(provider.status)}>
                    {provider.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className={`text-sm font-medium ${
                    provider.response_time_ms < 1000 ? 'text-success' :
                    provider.response_time_ms < 3000 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {provider.response_time_ms}ms
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Count</span>
                  <span className={`text-sm font-medium ${
                    provider.error_count === 0 ? 'text-success' :
                    provider.error_count < 5 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {provider.error_count}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Quota Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{provider.quota_usage}%</span>
                    <Badge variant={getStatusColor(provider.quota_status)}>
                      {provider.quota_status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Last checked: {new Date(provider.last_checked).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Provider Rotation Errors (Last 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="border-l-4 border-destructive pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="destructive">{error.provider}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{error.error_message}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Type: {error.search_type}</span>
                    {error.response_time > 0 && (
                      <span>Response: {error.response_time}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {providers.filter(p => p.status === 'healthy').length}
              </p>
              <p className="text-sm text-muted-foreground">Healthy Providers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                {providers.filter(p => p.status === 'degraded').length}
              </p>
              <p className="text-sm text-muted-foreground">Degraded Providers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {providers.filter(p => p.status === 'down').length}
              </p>
              <p className="text-sm text-muted-foreground">Down Providers</p>
            </div>
          </div>
          
          {lastUpdate && (
            <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {lastUpdate.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}