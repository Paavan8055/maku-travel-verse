import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RecoveryStatus {
  healthCheck: 'healthy' | 'degraded' | 'critical' | 'unknown';
  providerRotation: 'healthy' | 'degraded' | 'critical' | 'unknown';
  authentication: 'healthy' | 'degraded' | 'critical' | 'unknown';
  circuitBreakers: 'healthy' | 'degraded' | 'critical' | 'unknown';
  lastChecked: string;
}

interface ProviderStatus {
  id: string;
  name: string;
  enabled: boolean;
  health_score: number;
  priority: number;
  circuit_breaker_state: string;
  response_time: number;
}

export const SystemRecoveryDashboard: React.FC = () => {
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>({
    healthCheck: 'unknown',
    providerRotation: 'unknown',
    authentication: 'unknown',
    circuitBreakers: 'unknown',
    lastChecked: 'Never'
  });
  
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      // Check health check function
      const healthCheck = await testHealthCheck();
      
      // Check provider configurations
      const { data: providerData } = await supabase
        .from('provider_configs')
        .select('*')
        .order('priority');
      
      if (providerData) {
        setProviders(providerData);
      }

      // Test provider rotation
      const providerRotationStatus = await testProviderRotation();
      
      // Test authentication
      const authStatus = await testAuthentication();
      
      // Check circuit breakers
      const circuitBreakerStatus = checkCircuitBreakers(providerData || []);

      const status: RecoveryStatus = {
        healthCheck: healthCheck ? 'healthy' : 'critical',
        providerRotation: providerRotationStatus ? 'healthy' : 'critical',
        authentication: authStatus ? 'healthy' : 'degraded',
        circuitBreakers: circuitBreakerStatus ? 'healthy' : 'degraded',
        lastChecked: new Date().toISOString()
      };

      setRecoveryStatus(status);
      setLastUpdate(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('System status check failed:', error);
      toast.error('Failed to check system status');
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      return !error && data;
    } catch (error) {
      console.error('Health check test failed:', error);
      return false;
    }
  };

  const testProviderRotation = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('provider-rotation', {
        body: {
          searchType: 'flight',
          params: {
            originLocationCode: 'SYD',
            destinationLocationCode: 'MEL',
            departureDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            adults: 1
          }
        }
      });
      return !error && data && (data.success || data.fallbackUsed);
    } catch (error) {
      console.error('Provider rotation test failed:', error);
      return false;
    }
  };

  const testAuthentication = async (): Promise<boolean> => {
    try {
      // Test Sabre credentials
      const { data } = await supabase.functions.invoke('debug-sabre-credentials');
      return data && data.authenticated;
    } catch (error) {
      console.error('Authentication test failed:', error);
      return false;
    }
  };

  const checkCircuitBreakers = (providerData: ProviderStatus[]): boolean => {
    const openBreakers = providerData.filter(p => p.circuit_breaker_state === 'open').length;
    return openBreakers === 0;
  };

  const runSystemRecovery = async () => {
    setLoading(true);
    try {
      toast.info('Starting system recovery process...');

      // Step 1: Update provider configurations
      const { data: configUpdate } = await supabase.functions.invoke('update-provider-configs');
      
      if (configUpdate && configUpdate.success) {
        toast.success('✅ Provider configurations updated');
      } else {
        toast.error('❌ Failed to update provider configurations');
      }

      // Step 2: Reset circuit breakers (client-side)
      localStorage.removeItem('lastKnownHealth');
      
      // Step 3: Test quota monitor
      const { data: quotaCheck } = await supabase.functions.invoke('provider-quota-monitor');
      
      if (quotaCheck && quotaCheck.success) {
        toast.success('✅ Quota monitoring operational');
      }

      // Step 4: Re-check system status
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for changes to propagate
      await checkSystemStatus();
      
      toast.success('🎉 System recovery process completed');

    } catch (error) {
      console.error('System recovery failed:', error);
      toast.error('❌ System recovery failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <Clock className="w-4 h-4" />;
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            System Recovery Dashboard
            {lastUpdate && <span className="text-sm text-muted-foreground">Last updated: {lastUpdate}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(recoveryStatus.healthCheck)}`} />
              {getStatusIcon(recoveryStatus.healthCheck)}
              <span>Health Check</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(recoveryStatus.providerRotation)}`} />
              {getStatusIcon(recoveryStatus.providerRotation)}
              <span>Provider Rotation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(recoveryStatus.authentication)}`} />
              {getStatusIcon(recoveryStatus.authentication)}
              <span>Authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(recoveryStatus.circuitBreakers)}`} />
              {getStatusIcon(recoveryStatus.circuitBreakers)}
              <span>Circuit Breakers</span>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <Button 
              onClick={runSystemRecovery} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Run System Recovery
            </Button>
            <Button 
              onClick={checkSystemStatus} 
              disabled={loading}
              variant="outline"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Refresh Status
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Provider Status</h3>
            <div className="grid gap-2">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={provider.enabled ? "default" : "secondary"}
                      className={provider.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {provider.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <span className="font-medium">{provider.name}</span>
                    <span className="text-sm text-muted-foreground">({provider.id})</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Priority: {provider.priority}</span>
                    <span>Health: {provider.health_score}%</span>
                    <span>Response: {provider.response_time}ms</span>
                    <Badge variant={provider.circuit_breaker_state === 'closed' ? "default" : "destructive"}>
                      {provider.circuit_breaker_state}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};