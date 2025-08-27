import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { ProviderRecoveryPanel } from './ProviderRecoveryPanel';

interface SystemMetrics {
  critical_alerts: number;
  provider_health: {
    healthy: number;
    unhealthy: number;
    total: number;
  };
  recent_bookings: number;
  system_status: 'healthy' | 'degraded' | 'critical';
}

export const SystemRecoveryDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  const loadSystemMetrics = async () => {
    setIsLoading(true);
    try {
      // Get critical alerts
      const { data: alerts } = await supabase
        .from('critical_alerts')
        .select('*')
        .eq('resolved', false);

      // Get provider health
      const { data: health } = await supabase
        .from('provider_health')
        .select('status');

      // Get recent bookings (last 24h)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const healthyCounts = health?.reduce((acc, item) => {
        acc[item.status === 'healthy' ? 'healthy' : 'unhealthy']++;
        acc.total++;
        return acc;
      }, { healthy: 0, unhealthy: 0, total: 0 }) || { healthy: 0, unhealthy: 0, total: 0 };

      const systemStatus = alerts?.length ? 'critical' : 
                          healthyCounts.unhealthy > 0 ? 'degraded' : 'healthy';

      setMetrics({
        critical_alerts: alerts?.length || 0,
        provider_health: healthyCounts,
        recent_bookings: bookings?.length || 0,
        system_status: systemStatus
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load system metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load system metrics",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const runSecurityScan = async () => {
    setIsLoading(true);
    try {
      // Use the Security Scanner functions instead of RPC
      const response = await fetch('/api/security-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Security scan failed');
      
      toast({
        title: "Security Scan Complete",
        description: "Security vulnerabilities have been checked",
        variant: "default"
      });
    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Security scan encountered an error",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'healthy' ? 'default' : 
                   status === 'degraded' ? 'secondary' : 'destructive';
    return <Badge variant={variant} className="capitalize">{status}</Badge>;
  };

  useEffect(() => {
    loadSystemMetrics();
    const interval = setInterval(loadSystemMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Recovery Status
          </CardTitle>
          <CardDescription>
            Real-time monitoring of system health and recovery progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              {metrics && getStatusIcon(metrics.system_status)}
              <div>
                <p className="text-sm font-medium">System Status</p>
                {metrics && getStatusBadge(metrics.system_status)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics?.critical_alerts || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Provider Health</p>
              <p className="text-lg">
                <span className="text-green-600 font-semibold">
                  {metrics?.provider_health.healthy || 0}
                </span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-red-600 font-semibold">
                  {metrics?.provider_health.unhealthy || 0}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Recent Bookings (24h)</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.recent_bookings || 0}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={runSecurityScan}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Security Scan
              </Button>
              <Button 
                onClick={loadSystemMetrics}
                disabled={isLoading}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Recovery Panel */}
      <ProviderRecoveryPanel />
    </div>
  );
};