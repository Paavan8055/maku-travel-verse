import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, TestTube, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
}

interface ProviderHealth {
  provider: string;
  status: string;
  error_count: number;
  response_time_ms: number;
  last_checked: string;
}

interface ProviderQuota {
  provider_id: string;
  provider_name: string;
  service_type: string;
  quota_used: number;
  quota_limit: number;
  percentage_used: number;
  status: string;
}

export const ProviderConfiguration = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [health, setHealth] = useState<ProviderHealth[]>([]);
  const [quotas, setQuotas] = useState<ProviderQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      const [configRes, healthRes, quotaRes] = await Promise.all([
        supabase.from('provider_configs').select('*').order('priority'),
        supabase.from('provider_health').select('*'),
        supabase.from('provider_quotas').select('*')
      ]);

      if (configRes.data) setProviders(configRes.data);
      if (healthRes.data) setHealth(healthRes.data);
      if (quotaRes.data) setQuotas(quotaRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch provider data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProviderEnabled = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('provider_configs')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;

      setProviders(prev => 
        prev.map(p => p.id === id ? { ...p, enabled } : p)
      );

      toast({
        title: "Success",
        description: `Provider ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update provider status",
        variant: "destructive"
      });
    }
  };

  const updateProviderPriority = async (id: string, priority: number) => {
    try {
      const { error } = await supabase
        .from('provider_configs')
        .update({ priority })
        .eq('id', id);

      if (error) throw error;

      setProviders(prev => 
        prev.map(p => p.id === id ? { ...p, priority } : p)
      );

      toast({
        title: "Success",
        description: "Provider priority updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update provider priority",
        variant: "destructive"
      });
    }
  };

  const testProvider = async (providerId: string) => {
    setTesting(providerId);
    try {
      const { data, error } = await supabase.functions.invoke('provider-credential-test', {
        body: { provider: providerId }
      });

      if (error) throw error;

      toast({
        title: data.success ? "Test Successful" : "Test Failed",
        description: data.message || "Provider test completed",
        variant: data.success ? "default" : "destructive"
      });

      // Refresh health data after test
      fetchProviderData();
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test provider credentials",
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  const getHealthStatus = (providerId: string) => {
    const providerHealth = health.find(h => h.provider === providerId);
    if (!providerHealth) return { status: 'unknown', color: 'secondary' };

    switch (providerHealth.status) {
      case 'healthy':
        return { status: 'healthy', color: 'success', icon: CheckCircle };
      case 'degraded':
        return { status: 'degraded', color: 'warning', icon: AlertTriangle };
      case 'unhealthy':
        return { status: 'unhealthy', color: 'destructive', icon: XCircle };
      default:
        return { status: 'unknown', color: 'secondary', icon: Activity };
    }
  };

  const getQuotaInfo = (providerId: string) => {
    return quotas.find(q => q.provider_id === providerId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Loading provider configuration...</span>
        </div>
      </div>
    );
  }

  const flightProviders = providers.filter(p => p.type === 'flight');
  const hotelProviders = providers.filter(p => p.type === 'hotel');
  const activityProviders = providers.filter(p => p.type === 'activity');

  const ProviderSection = ({ title, providers: sectionProviders }: { title: string, providers: ProviderConfig[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {title} Providers
        </CardTitle>
        <CardDescription>
          Configure and manage {title.toLowerCase()} search providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sectionProviders.map((provider) => {
          const healthStatus = getHealthStatus(provider.id);
          const quotaInfo = getQuotaInfo(provider.id);
          const HealthIcon = healthStatus.icon;

          return (
            <div key={provider.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <HealthIcon className="h-4 w-4" />
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <Badge variant={healthStatus.color as any}>{healthStatus.status}</Badge>
                  {quotaInfo && (
                    <Badge variant={quotaInfo.percentage_used > 80 ? "destructive" : "secondary"}>
                      {quotaInfo.percentage_used.toFixed(1)}% used
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(enabled) => updateProviderEnabled(provider.id, enabled)}
                  />
                  <Label className="text-sm">Enabled</Label>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`priority-${provider.id}`}>Priority</Label>
                  <Input
                    id={`priority-${provider.id}`}
                    type="number"
                    min="1"
                    max="10"
                    value={provider.priority}
                    onChange={(e) => updateProviderPriority(provider.id, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {quotaInfo && (
                  <div className="space-y-2">
                    <Label>Quota Usage</Label>
                    <div className="text-sm space-y-1">
                      <div>Used: {quotaInfo.quota_used.toLocaleString()}</div>
                      <div>Limit: {quotaInfo.quota_limit.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Actions</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(provider.id)}
                    disabled={testing === provider.id}
                    className="w-full"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testing === provider.id ? 'Testing...' : 'Test Credentials'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <ProviderSection title="Flight" providers={flightProviders} />
      <ProviderSection title="Hotel" providers={hotelProviders} />
      <ProviderSection title="Activity" providers={activityProviders} />
    </div>
  );
};