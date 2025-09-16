import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProviderStatus {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  lastCheck?: string;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  responseTime?: number;
  errorMessage?: string;
}

interface HealthCheckResult {
  provider: string;
  endpoint: string;
  success: boolean;
  responseTime?: number;
  error?: string;
}

export const ProviderHealthDashboard = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadProviderStatus = async () => {
    try {
      const { data: providerConfigs } = await supabase
        .from('provider_configs')
        .select('id, name, type, enabled, priority')
        .eq('enabled', true)
        .order('priority');

      if (providerConfigs) {
        const statusData: ProviderStatus[] = providerConfigs.map(config => ({
          ...config,
          status: 'unknown'
        }));
        setProviders(statusData);
      }
    } catch (error) {
      console.error('Failed to load provider configs:', error);
    }
  };

  const runHealthChecks = async () => {
    setLoading(true);
    try {
      // Run comprehensive health check
      const { data, error } = await supabase.functions.invoke('critical-debug');
      
      if (error) throw error;

      const results: HealthCheckResult[] = [];
      
      // Parse health check results
      if (data?.tests) {
        data.tests.forEach((test: any) => {
          results.push({
            provider: test.name || 'unknown',
            endpoint: test.endpoint || 'unknown',
            success: test.success || false,
            responseTime: test.responseTime,
            error: test.error
          });
        });
      }

      setHealthChecks(results);

      // Update provider status based on health checks
      setProviders(prev => prev.map(provider => {
        const healthCheck = results.find(r => 
          r.provider.toLowerCase().includes(provider.name.toLowerCase()) ||
          r.provider.toLowerCase().includes(provider.type.toLowerCase())
        );

        if (healthCheck) {
          return {
            ...provider,
            status: healthCheck.success ? 'healthy' : 'failed',
            responseTime: healthCheck.responseTime,
            errorMessage: healthCheck.error,
            lastCheck: new Date().toISOString()
          };
        }

        return { ...provider, status: 'unknown' };
      }));

      setLastUpdate(new Date());
      
      const healthyCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      toast({
        title: "Health Check Complete",
        description: `${healthyCount}/${totalCount} providers healthy`,
        variant: healthyCount === totalCount ? "default" : "destructive"
      });

    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviderStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-success text-success-foreground',
      degraded: 'bg-warning text-warning-foreground', 
      failed: 'bg-destructive text-destructive-foreground',
      unknown: 'bg-muted text-muted-foreground'
    };
    
    return <Badge className={variants[status as keyof typeof variants] || variants.unknown}>{status}</Badge>;
  };

  const healthyProviders = providers.filter(p => p.status === 'healthy').length;
  const totalProviders = providers.length;
  const overallHealth = healthyProviders === totalProviders ? 'healthy' : 
                       healthyProviders > totalProviders / 2 ? 'degraded' : 'critical';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Provider Health Dashboard</h2>
          <p className="text-muted-foreground">Real-time monitoring of API provider connectivity</p>
        </div>
        <Button 
          onClick={runHealthChecks} 
          disabled={loading}
          size="sm"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Run Health Check
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(overallHealth)}
              <div>
                <h3 className="text-lg font-semibold">Overall Provider Health</h3>
                <p className="text-sm text-muted-foreground">
                  {healthyProviders} of {totalProviders} providers operational
                </p>
              </div>
            </div>
            {getStatusBadge(overallHealth)}
          </div>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {lastUpdate.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{provider.name}</CardTitle>
                {getStatusIcon(provider.status)}
              </div>
              <CardDescription className="text-xs">
                {provider.type} • Priority {provider.priority}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {getStatusBadge(provider.status)}
                
                {provider.responseTime && (
                  <p className="text-xs text-muted-foreground">
                    Response: {provider.responseTime}ms
                  </p>
                )}
                
                {provider.lastCheck && (
                  <p className="text-xs text-muted-foreground">
                    Checked: {new Date(provider.lastCheck).toLocaleTimeString()}
                  </p>
                )}
                
                {provider.errorMessage && (
                  <Alert className="mt-2">
                    <AlertTriangle className="w-3 h-3" />
                    <AlertDescription className="text-xs">
                      {provider.errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Health Check Results */}
      {healthChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Health Check Results</CardTitle>
            <CardDescription>
              Latest API connectivity test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.success ? 'healthy' : 'failed')}
                    <div>
                      <p className="font-medium text-sm">{check.provider}</p>
                      <p className="text-xs text-muted-foreground">{check.endpoint}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {check.responseTime && (
                      <p className="text-xs text-muted-foreground">
                        {check.responseTime}ms
                      </p>
                    )}
                    {check.error && (
                      <p className="text-xs text-destructive max-w-xs truncate">
                        {check.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Actions */}
      {overallHealth === 'critical' && (
        <Alert className="border-destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Critical Provider Issues Detected</strong>
            <br />
            Multiple providers are failing. This may impact booking functionality.
            Consider switching to backup providers or contacting provider support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};