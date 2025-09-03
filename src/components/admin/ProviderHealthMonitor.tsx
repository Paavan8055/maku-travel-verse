import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useProviderHealth } from '@/hooks/useProviderHealth';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

const ProviderHealthMonitorContent = () => {
  const { providerHealth, isLoading, getProvidersByType, getOverallHealth, refresh } = useProviderHealth();
  const [emergencyRecoveryRunning, setEmergencyRecoveryRunning] = useState(false);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const runEmergencyRecovery = async () => {
    setEmergencyRecoveryRunning(true);
    
    try {
      toast.info('Starting emergency provider recovery...');
      
      // Step 1: Run emergency provider fix
      const { error: fixError } = await supabase.functions.invoke('emergency-provider-fix', {
        body: { action: 'force_reset_health' }
      });
      
      if (fixError) {
        throw new Error(`Recovery failed: ${fixError.message}`);
      }
      
      // Step 2: Test authentication
      const { error: authError } = await supabase.functions.invoke('emergency-provider-fix', {
        body: { action: 'test_auth' }
      });
      
      if (authError) {
        console.warn('Auth test failed, but continuing recovery:', authError);
      }
      
      // Step 3: Refresh health status
      await refresh();
      
      toast.success('Emergency recovery completed');
      
    } catch (error) {
      console.error('Emergency recovery failed:', error);
      toast.error(`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEmergencyRecoveryRunning(false);
    }
  };

  const overallHealth = getOverallHealth();
  const criticalProviders = (providerHealth || []).filter(p => p?.status === 'unhealthy');
  const degradedProviders = (providerHealth || []).filter(p => p?.status === 'degraded');

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Provider Health Monitor
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={refresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                onClick={runEmergencyRecovery}
                disabled={emergencyRecoveryRunning}
                variant="destructive"
                size="sm"
              >
                {emergencyRecoveryRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                Emergency Recovery
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getHealthIcon(overallHealth)}
              <Badge 
                variant={overallHealth === 'healthy' ? 'default' : 'destructive'}
                className={overallHealth === 'healthy' ? 'bg-green-500' : ''}
              >
                Overall: {overallHealth.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {(providerHealth || []).length} providers monitored
            </div>
          </div>

          {(criticalProviders.length > 0 || degradedProviders.length > 0) && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {criticalProviders.length > 0 && (
                  <span className="text-red-600 font-medium">
                    {criticalProviders.length} provider{criticalProviders.length > 1 ? 's' : ''} down
                  </span>
                )}
                {criticalProviders.length > 0 && degradedProviders.length > 0 && ', '}
                {degradedProviders.length > 0 && (
                  <span className="text-yellow-600 font-medium">
                    {degradedProviders.length} degraded
                  </span>
                )}
                . Emergency recovery recommended.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Provider Details by Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['hotel', 'flight', 'activity'].map((type) => {
          const providers = getProvidersByType(type as 'hotel' | 'flight' | 'activity');
          const healthyCount = providers.filter(p => p.status === 'healthy').length;
          const totalCount = providers.length;
          
          return (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg capitalize">
                  {type} Providers
                  <Badge variant="outline">
                    {healthyCount}/{totalCount}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <div key={provider.provider} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getHealthIcon(provider.status)}
                        <span className="text-sm font-medium">
                          {provider.provider.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {provider.responseTime}ms
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getHealthColor(provider.status)}`} />
                      </div>
                    </div>
                  ))}
                  {providers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No providers configured
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Provider Response Times */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(providerHealth || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No provider health data available
              </p>
            ) : (
              (providerHealth || []).map((provider) => (
                <div key={provider?.provider || 'unknown'} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(provider?.status || 'unknown')}
                    <div>
                      <h4 className="font-medium">{(provider?.provider || 'unknown').replace('-', ' ').toUpperCase()}</h4>
                      <p className="text-sm text-muted-foreground">
                        Last checked: {provider?.lastChecked ? new Date(provider.lastChecked).toLocaleTimeString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{provider?.responseTime || 0}ms</div>
                      <div className="text-muted-foreground">Response</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{provider?.errorCount || 0}</div>
                      <div className="text-muted-foreground">Errors</div>
                    </div>
                    <Badge 
                      variant={provider?.status === 'healthy' ? 'default' : 'destructive'}
                      className={provider?.status === 'healthy' ? 'bg-green-500' : ''}
                    >
                      {provider?.status || 'unknown'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ProviderHealthMonitor = () => {
  return (
    <ErrorBoundary
      fallback={
        <Alert className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Provider health monitoring is temporarily unavailable. Please refresh the page or try again later.
          </AlertDescription>
        </Alert>
      }
    >
      <ProviderHealthMonitorContent />
    </ErrorBoundary>
  );
};