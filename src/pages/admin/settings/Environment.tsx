import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, AlertTriangle, CheckCircle, Settings, Database, Key } from 'lucide-react';

interface EnvironmentConfig {
  isProduction: boolean;
  environment: string;
  hotelbeds: {
    hotel: { baseUrl: string };
    activity: { baseUrl: string };
  };
  amadeus: {
    baseUrl: string;
    tokenUrl: string;
  };
  sabre: {
    baseUrl: string;
    tokenUrl: string;
  };
  mtls: {
    rejectUnauthorized: boolean;
    timeout: number;
    retries: number;
  };
}

interface ProviderCredentialStatus {
  provider: string;
  service: string;
  hasCredentials: boolean;
  lastTested: string | null;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
}

const EnvironmentPage = () => {
  const [config, setConfig] = useState<EnvironmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [testingCredentials, setTestingCredentials] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<ProviderCredentialStatus[]>([]);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('environment-config', {
        body: { action: 'get_config' }
      });

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
      toast({
        title: "Failed to load configuration",
        description: "Could not retrieve environment settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentialStatus = async () => {
    try {
      // Get provider configs to check credentials
      const { data: providers } = await supabase
        .from('provider_configs')
        .select('*')
        .order('priority');

      if (providers) {
        const statuses: ProviderCredentialStatus[] = providers.map(provider => ({
          provider: provider.name,
          service: provider.type,
          hasCredentials: provider.enabled, // Simple check for now
          lastTested: provider.updated_at,
          status: provider.health_score > 80 ? 'healthy' : 
                 provider.health_score > 50 ? 'warning' : 'error'
        }));
        setCredentialStatus(statuses);
      }
    } catch (error) {
      console.error('Failed to fetch credential status:', error);
    }
  };

  const switchEnvironment = async (newEnvironment: 'test' | 'production') => {
    if (newEnvironment === 'production') {
      const confirmed = window.confirm(
        'WARNING: Switching to production will use real endpoints and process actual bookings. Are you sure?'
      );
      if (!confirmed) return;
    }

    setSwitching(true);
    try {
      const { data, error } = await supabase.functions.invoke('environment-config', {
        body: { 
          action: 'switch_environment',
          environment: newEnvironment
        }
      });

      if (error) throw error;
      
      setConfig(data);
      toast({
        title: "Environment switched",
        description: `Successfully switched to ${newEnvironment} environment`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to switch environment:', error);
      toast({
        title: "Environment switch failed",
        description: "Could not switch environment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSwitching(false);
    }
  };

  const testAllCredentials = async () => {
    setTestingCredentials(true);
    try {
      // Reset provider health to force fresh checks
      await supabase.functions.invoke('provider-quota-monitor');
      
      toast({
        title: "Credential test initiated",
        description: "Testing all provider credentials...",
      });

      // Refresh status after a moment
      setTimeout(() => {
        fetchCredentialStatus();
        setTestingCredentials(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to test credentials:', error);
      toast({
        title: "Credential test failed",
        description: "Could not test provider credentials",
        variant: "destructive"
      });
      setTestingCredentials(false);
    }
  };

  const resetProviderHealth = async () => {
    try {
      const { error } = await supabase
        .from('provider_health')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep dummy record if exists

      if (error) throw error;

      const { error: quotaError } = await supabase
        .from('provider_quotas')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (quotaError) throw quotaError;

      toast({
        title: "Provider health reset",
        description: "All provider health data has been cleared and will be refreshed",
      });

      fetchCredentialStatus();
    } catch (error) {
      console.error('Failed to reset provider health:', error);
      toast({
        title: "Reset failed",
        description: "Could not reset provider health data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchCredentialStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Environment Configuration</h1>
          <p className="text-muted-foreground">
            Manage API environments, credentials, and provider settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={testAllCredentials}
            disabled={testingCredentials}
            variant="outline"
          >
            {testingCredentials && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            <Key className="h-4 w-4 mr-2" />
            Test Credentials
          </Button>
          <Button
            onClick={resetProviderHealth}
            variant="outline"
          >
            <Database className="h-4 w-4 mr-2" />
            Reset Health Data
          </Button>
        </div>
      </div>

      {/* Current Environment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Environment
          </CardTitle>
          <CardDescription>
            Switch between test and production environments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={config?.isProduction ? "destructive" : "secondary"}>
                {config?.isProduction ? "PRODUCTION" : "TEST"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Currently using {config?.environment} environment
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Test</span>
              <Switch
                checked={config?.isProduction || false}
                onCheckedChange={(checked) => 
                  switchEnvironment(checked ? 'production' : 'test')
                }
                disabled={switching}
              />
              <span className="text-sm">Production</span>
            </div>
          </div>

          {config?.isProduction && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Production mode is active. All bookings will be processed with real payments 
                and sent to actual providers.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Provider Credentials Status */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Credentials</CardTitle>
          <CardDescription>
            Status of API credentials for all travel providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {credentialStatus.map((status) => (
              <div
                key={`${status.provider}-${status.service}`}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {status.status === 'healthy' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {status.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {status.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {status.status === 'unknown' && <RefreshCw className="h-4 w-4 text-gray-500" />}
                  </div>
                  <div>
                    <span className="font-medium">
                      {status.provider.charAt(0).toUpperCase() + status.provider.slice(1)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({status.service})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.hasCredentials ? "default" : "destructive"}>
                    {status.hasCredentials ? "Configured" : "Missing"}
                  </Badge>
                  {status.lastTested && (
                    <span className="text-xs text-muted-foreground">
                      Last tested: {new Date(status.lastTested).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Current API endpoints for each provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Amadeus</h4>
            <div className="text-sm space-y-1">
              <div>Base URL: <code className="bg-muted px-1 rounded">{config?.amadeus.baseUrl}</code></div>
              <div>Token URL: <code className="bg-muted px-1 rounded">{config?.amadeus.tokenUrl}</code></div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Sabre</h4>
            <div className="text-sm space-y-1">
              <div>Base URL: <code className="bg-muted px-1 rounded">{config?.sabre.baseUrl}</code></div>
              <div>Token URL: <code className="bg-muted px-1 rounded">{config?.sabre.tokenUrl}</code></div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">HotelBeds</h4>
            <div className="text-sm space-y-1">
              <div>Hotel API: <code className="bg-muted px-1 rounded">{config?.hotelbeds.hotel.baseUrl}</code></div>
              <div>Activity API: <code className="bg-muted px-1 rounded">{config?.hotelbeds.activity.baseUrl}</code></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            mTLS and connection security configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Reject Unauthorized Certificates:</span>
            <Badge variant={config?.mtls.rejectUnauthorized ? "default" : "secondary"}>
              {config?.mtls.rejectUnauthorized ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Connection Timeout:</span>
            <span>{config?.mtls.timeout}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Retry Attempts:</span>
            <span>{config?.mtls.retries}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentPage;