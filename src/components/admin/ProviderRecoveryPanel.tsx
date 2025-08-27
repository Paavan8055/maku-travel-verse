import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Clock, PlayCircle, RefreshCw } from 'lucide-react';

interface ProviderStatus {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  health?: {
    status: string;
    response_time_ms?: number;
    last_checked?: string;
    error_count?: number;
  };
  quota?: {
    status: string;
    percentage_used: number;
  };
}

export const ProviderRecoveryPanel = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<any>(null);
  const { toast } = useToast();

  const loadProviderStatus = async () => {
    setIsLoading(true);
    try {
      // Get provider configs
      const { data: configs } = await supabase
        .from('provider_configs')
        .select('*')
        .order('type, priority');

      // Get provider health
      const { data: health } = await supabase
        .from('provider_health')
        .select('*');

      // Get provider quotas
      const { data: quotas } = await supabase
        .from('provider_quotas')
        .select('*');

      // Combine data
      const combinedData = configs?.map(config => ({
        ...config,
        health: health?.find(h => h.id === config.id),
        quota: quotas?.find(q => q.provider_id === config.id)
      })) || [];

      setProviders(combinedData);
    } catch (error) {
      console.error('Failed to load provider status:', error);
      toast({
        title: "Error",
        description: "Failed to load provider status",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const runCredentialTest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-credential-test');
      
      if (error) throw error;
      
      setRecoveryStatus(data);
      toast({
        title: "Credential Test Complete",
        description: "Provider credentials have been tested",
        variant: "default"
      });
      
      await loadProviderStatus();
    } catch (error) {
      console.error('Credential test failed:', error);
      toast({
        title: "Test Failed",
        description: "Credential test encountered an error",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const runEmergencyFix = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-provider-fix');
      
      if (error) throw error;
      
      setRecoveryStatus(data);
      toast({
        title: "Emergency Fix Complete",
        description: "Provider systems have been reset and fixed",
        variant: "default"
      });
      
      await loadProviderStatus();
    } catch (error) {
      console.error('Emergency fix failed:', error);
      toast({
        title: "Fix Failed",
        description: "Emergency fix encountered an error",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'healthy' ? 'default' : 
                   status === 'warning' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  React.useEffect(() => {
    loadProviderStatus();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Provider Recovery Control Panel
          </CardTitle>
          <CardDescription>
            Execute Phase 3 Recovery Plan - Restore Live API Connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runCredentialTest}
              disabled={isLoading}
              variant="outline"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Test Credentials
            </Button>
            <Button 
              onClick={runEmergencyFix}
              disabled={isLoading}
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Emergency Fix
            </Button>
            <Button 
              onClick={loadProviderStatus}
              disabled={isLoading}
              variant="ghost"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {recoveryStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Recovery Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
              {JSON.stringify(recoveryStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Provider Status Overview</CardTitle>
          <CardDescription>
            Current status of all travel providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{provider.name}</h4>
                  {provider.health?.status && getStatusIcon(provider.health.status)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline">{provider.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Enabled:</span>
                    <Badge variant={provider.enabled ? "default" : "secondary"}>
                      {provider.enabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {provider.health?.status && (
                    <div className="flex justify-between">
                      <span>Health:</span>
                      {getStatusBadge(provider.health.status)}
                    </div>
                  )}
                  {provider.quota?.percentage_used !== undefined && (
                    <div className="flex justify-between">
                      <span>Quota Used:</span>
                      <span>{provider.quota.percentage_used}%</span>
                    </div>
                  )}
                  {provider.health?.response_time_ms && (
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span>{provider.health.response_time_ms}ms</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};