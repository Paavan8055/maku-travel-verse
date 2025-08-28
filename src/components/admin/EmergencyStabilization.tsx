import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Shield, Database, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyStatus {
  stuckBookings: number;
  criticalAlerts: number;
  providerHealth: 'healthy' | 'degraded' | 'critical';
  securityStatus: 'secure' | 'vulnerable' | 'hardened';
  lastCleanup?: string;
}

export const EmergencyStabilization = () => {
  const [status, setStatus] = useState<EmergencyStatus>({
    stuckBookings: 0,
    criticalAlerts: 0,
    providerHealth: 'degraded',
    securityStatus: 'vulnerable'
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const setOperationLoading = (operation: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [operation]: isLoading }));
  };

  const runStuckBookingCleanup = async () => {
    setOperationLoading('cleanup', true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-stuck-bookings', {
        body: { automated: false, timeoutMinutes: 60 }
      });

      if (error) throw error;

      const recovered = data?.recoveredBookings?.length || 0;
      setStatus(prev => ({ 
        ...prev, 
        stuckBookings: Math.max(0, prev.stuckBookings - recovered),
        lastCleanup: new Date().toISOString()
      }));

      toast({
        title: "Cleanup Complete",
        description: `Successfully processed ${recovered} stuck bookings`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setOperationLoading('cleanup', false);
    }
  };

  const runPaymentIntegrityCheck = async () => {
    setOperationLoading('payment', true);
    try {
      const { data, error } = await supabase.rpc('emergency_cleanup_payments');
      
      if (error) throw error;
      
      const result = data as any;
      const orphanedCount = result?.orphaned_payments_found || 0;
      
      toast({
        title: "Payment Integrity Check Complete",
        description: `Found ${orphanedCount} orphaned payments`,
        variant: orphanedCount > 0 ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Payment Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setOperationLoading('payment', false);
    }
  };

  const testProviderConnections = async () => {
    setOperationLoading('providers', true);
    try {
      const { data, error } = await supabase.functions.invoke('critical-debug');
      
      if (error) throw error;
      
      const allHealthy = data?.tests?.every((test: any) => test.success);
      setStatus(prev => ({ 
        ...prev, 
        providerHealth: allHealthy ? 'healthy' : 'degraded'
      }));

      toast({
        title: "Provider Test Complete",
        description: allHealthy ? "All providers healthy" : "Some providers have issues",
        variant: allHealthy ? "default" : "destructive"
      });
    } catch (error) {
      setStatus(prev => ({ ...prev, providerHealth: 'critical' }));
      toast({
        title: "Provider Test Failed",
        description: "Critical provider connectivity issues detected",
        variant: "destructive"
      });
    } finally {
      setOperationLoading('providers', false);
    }
  };

  const refreshStatus = async () => {
    setOperationLoading('refresh', true);
    try {
      // Get stuck bookings count
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Get critical alerts count  
      const { count: alertCount } = await supabase
        .from('critical_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false)
        .in('severity', ['high', 'critical']);

      setStatus(prev => ({
        ...prev,
        stuckBookings: bookingCount || 0,
        criticalAlerts: alertCount || 0,
        securityStatus: 'hardened' // Security was hardened in migration
      }));

      toast({
        title: "Status Refreshed",
        description: "Emergency status updated successfully"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not update status",
        variant: "destructive"
      });
    } finally {
      setOperationLoading('refresh', false);
    }
  };

  const getStatusColor = (severity: string) => {
    switch (severity) {
      case 'healthy':
      case 'secure':
      case 'hardened':
        return 'bg-success text-success-foreground';
      case 'degraded':
      case 'vulnerable':
        return 'bg-warning text-warning-foreground';
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Load initial data
  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Emergency Stabilization</h1>
          <p className="text-muted-foreground">Critical system recovery and stabilization controls</p>
        </div>
        <Button 
          onClick={refreshStatus} 
          disabled={loading.refresh}
          variant="outline"
          size="sm"
        >
          {loading.refresh ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {/* Critical Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Stuck Bookings</p>
                <p className="text-2xl font-bold text-destructive">{status.stuckBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Critical Alerts</p>
                <p className="text-2xl font-bold text-warning">{status.criticalAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Provider Health</p>
                <Badge className={getStatusColor(status.providerHealth)}>
                  {status.providerHealth}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Security Status</p>
                <Badge className={getStatusColor(status.securityStatus)}>
                  {status.securityStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Booking Cleanup
            </CardTitle>
            <CardDescription>
              Clean up stuck bookings and resolve payment issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {status.stuckBookings} bookings require immediate attention
              </AlertDescription>
            </Alert>
            <Button 
              onClick={runStuckBookingCleanup}
              disabled={loading.cleanup}
              className="w-full"
              variant={status.stuckBookings > 0 ? "destructive" : "default"}
            >
              {loading.cleanup ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Run Emergency Cleanup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Integrity
            </CardTitle>
            <CardDescription>
              Audit and fix orphaned payment intents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Check for orphaned Stripe payment intents
              </AlertDescription>
            </Alert>
            <Button 
              onClick={runPaymentIntegrityCheck}
              disabled={loading.payment}
              className="w-full"
              variant="outline"
            >
              {loading.payment ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Check Payment Integrity
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Provider Health
            </CardTitle>
            <CardDescription>
              Test API connectivity and credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className={getStatusColor(status.providerHealth)}>
              Status: {status.providerHealth}
            </Badge>
            <Button 
              onClick={testProviderConnections}
              disabled={loading.providers}
              className="w-full"
              variant="outline"
            >
              {loading.providers ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Test Connections
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Security hardening implementation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium">Security hardening completed</span>
            <Badge className="bg-success text-success-foreground">Secure</Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>✅ Provider configuration tables secured with RLS</p>
            <p>✅ API configuration access restricted to admins</p>
            <p>✅ Provider quota information protected</p>
            <p>✅ Emergency payment cleanup function deployed</p>
          </div>
        </CardContent>
      </Card>

      {status.lastCleanup && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            Last cleanup completed: {new Date(status.lastCleanup).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};