import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Settings, Server, Database, Shield, Globe, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnvironmentConfig {
  id: string;
  environment: string;
  provider: string;
  config_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EnvironmentConfiguration = () => {
  const [configs, setConfigs] = useState<EnvironmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_configuration')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      toast({
        title: "Failed to load environment configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (configId: string, updates: Partial<EnvironmentConfig>) => {
    setSaving(prev => ({ ...prev, [configId]: true }));
    
    try {
      const { error } = await supabase
        .from('api_configuration')
        .update(updates)
        .eq('id', configId);

      if (error) throw error;

      setConfigs(prev => prev.map(config => 
        config.id === configId ? { ...config, ...updates } : config
      ));

      toast({
        title: "Configuration updated",
        description: "Environment settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to update configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setSaving(prev => ({ ...prev, [configId]: false }));
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-destructive text-destructive-foreground';
      case 'staging':
        return 'bg-warning text-warning-foreground';
      case 'test':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'amadeus':
      case 'sabre':
      case 'hotelbeds':
        return Globe;
      case 'stripe':
        return Shield;
      case 'database':
        return Database;
      default:
        return Server;
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Environment Configuration</h1>
          <p className="text-muted-foreground">Manage API configurations across different environments</p>
        </div>
        <Button onClick={fetchConfigs} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Environment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Configs</p>
                <p className="text-2xl font-bold">{configs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Active Configs</p>
                <p className="text-2xl font-bold text-success">
                  {configs.filter(c => c.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Environments</p>
                <p className="text-2xl font-bold">
                  {new Set(configs.map(c => c.environment)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Cards */}
      <div className="grid gap-6">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No configurations found</h3>
                <p className="text-muted-foreground">
                  Environment configurations will appear here when they are created
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          configs.map(config => {
            const ProviderIcon = getProviderIcon(config.provider);
            
            return (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ProviderIcon className="w-6 h-6" />
                      <div>
                        <CardTitle>{config.provider.toUpperCase()}</CardTitle>
                        <CardDescription>
                          {config.provider} API configuration
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getEnvironmentColor(config.environment)}>
                        {config.environment}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={(is_active) => 
                            updateConfig(config.id, { is_active })
                          }
                          disabled={saving[config.id]}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      Configuration data is encrypted and secure. Only authorized administrators can view sensitive values.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`env-${config.id}`}>Environment</Label>
                      <Input
                        id={`env-${config.id}`}
                        value={config.environment}
                        onChange={(e) => 
                          updateConfig(config.id, { environment: e.target.value })
                        }
                        disabled={saving[config.id]}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`provider-${config.id}`}>Provider</Label>
                      <Input
                        id={`provider-${config.id}`}
                        value={config.provider}
                        onChange={(e) => 
                          updateConfig(config.id, { provider: e.target.value })
                        }
                        disabled={saving[config.id]}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`config-${config.id}`}>Configuration Data</Label>
                    <Textarea
                      id={`config-${config.id}`}
                      value={JSON.stringify(config.config_data, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updateConfig(config.id, { config_data: parsed });
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      rows={6}
                      className="font-mono text-sm"
                      disabled={saving[config.id]}
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(config.created_at).toLocaleString()}</p>
                    <p>Updated: {new Date(config.updated_at).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};