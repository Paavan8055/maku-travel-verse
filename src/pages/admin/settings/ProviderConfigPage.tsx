import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Database, 
  Plane, 
  Hotel, 
  Activity,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Save
} from 'lucide-react';

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  base_url: string;
  circuit_breaker: any;
  circuit_breaker_state: string;
  health_score: number;
  response_time: number;
  created_at: string;
  updated_at: string;
}

interface ProviderStatus {
  provider: string;
  credentialsValid: boolean;
  authSuccess: boolean;
  error?: string;
}

export default function ProviderConfigPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_configs')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      toast({
        title: "Error",
        description: "Failed to load provider configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-credential-test');
      
      if (error) throw error;
      
      setProviderStatus(data.detailed_results || []);
      
      toast({
        title: "Credential Test Complete",
        description: `${data.summary.working_providers}/${data.summary.total_providers} providers working`,
        variant: data.summary.working_providers === data.summary.total_providers ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Credential test failed:', error);
      toast({
        title: "Test Failed",
        description: "Failed to test provider credentials",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const updateProvider = async (id: string, updates: Partial<ProviderConfig>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('provider_configs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setProviders(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ));

      toast({
        title: "Provider Updated",
        description: "Configuration saved successfully",
      });
    } catch (error) {
      console.error('Failed to update provider:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'activity': return <Activity className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (provider: string) => {
    const status = providerStatus.find(p => p.provider.toLowerCase() === provider.toLowerCase());
    if (!status) return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    
    if (status.authSuccess) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (status.credentialsValid) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (provider: string) => {
    const status = providerStatus.find(p => p.provider.toLowerCase() === provider.toLowerCase());
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    if (status.authSuccess) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>;
    } else if (status.credentialsValid) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Auth Failed</Badge>;
    } else {
      return <Badge variant="destructive">No Credentials</Badge>;
    }
  };

  useEffect(() => {
    fetchProviders();
    testCredentials();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading provider configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Configuration</h1>
          <p className="text-muted-foreground">
            Manage API provider settings, credentials, and priorities
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={testCredentials} 
            disabled={testing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Test Credentials
          </Button>
        </div>
      </div>

      {/* Provider Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Provider Status Overview
          </CardTitle>
          <CardDescription>
            Current status of all configured providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider.type)}
                  <div>
                    <h4 className="font-medium">{provider.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">{provider.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(provider.name)}
                  {getStatusBadge(provider.name)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Provider Configurations */}
      <div className="grid gap-6">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getProviderIcon(provider.type)}
                {provider.name}
                <Badge variant="outline" className="ml-auto">
                  Priority: {provider.priority}
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure {provider.name} API settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Provider</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow this provider to handle requests
                  </p>
                </div>
                <Switch
                  checked={provider.enabled}
                  onCheckedChange={(enabled) => updateProvider(provider.id, { enabled })}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={provider.priority}
                    onChange={(e) => updateProvider(provider.id, { priority: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers = higher priority
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Input
                    value={provider.type}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Provider Health Metrics */}
              <Separator />
              <div className="space-y-2">
                <Label>Health Metrics</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Health Score:</span>
                    <span className="ml-2 font-medium">{provider.health_score}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Response:</span>
                    <span className="ml-2 font-medium">{provider.response_time}ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Circuit Breaker:</span>
                    <span className="ml-2 font-medium capitalize">{provider.circuit_breaker_state}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base URL:</span>
                    <span className="ml-2 font-medium text-xs">{provider.base_url}</span>
                  </div>
                </div>
              </div>

              {/* Error messages */}
              {providerStatus.find(p => p.provider.toLowerCase() === provider.name.toLowerCase())?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    {providerStatus.find(p => p.provider.toLowerCase() === provider.name.toLowerCase())?.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Providers Configured</h3>
            <p className="text-muted-foreground">
              Provider configurations will appear here when they are set up.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
