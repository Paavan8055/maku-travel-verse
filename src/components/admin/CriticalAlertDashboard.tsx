import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  Activity,
  Settings,
  Bell,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CriticalAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  metadata: any;
  requires_manual_action: boolean;
}

interface AlertConfiguration {
  id: string;
  alert_type: string;
  enabled: boolean;
  thresholds: Record<string, number>;
  notification_channels: string[];
  auto_actions: string[];
}

export const CriticalAlertDashboard = () => {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [configurations, setConfigurations] = useState<AlertConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    fetchConfigurations();
    setupRealtimeUpdates();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('critical_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts((data || []).map(alert => ({
        ...alert,
        metadata: alert.metadata || {}
      })));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch critical alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigurations = async () => {
    try {
      // Mock configurations since table doesn't exist yet
      setConfigurations([
        {
          id: '1',
          alert_type: 'provider_failure',
          enabled: true,
          thresholds: { consecutive_failures: 3 },
          notification_channels: ['email'],
          auto_actions: ['rotate_provider']
        }
      ]);
    } catch (error) {
      console.error('Error fetching configurations:', error);
    }
  };

  const setupRealtimeUpdates = () => {
    const channel = supabase
      .channel('critical-alerts-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'critical_alerts'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAlerts(prev => [payload.new as CriticalAlert, ...prev.slice(0, 49)]);
          toast({
            title: "New Critical Alert",
            description: (payload.new as CriticalAlert).message,
            variant: "destructive"
          });
        } else if (payload.eventType === 'UPDATE') {
          setAlerts(prev => prev.map(alert => 
            alert.id === payload.new?.id ? payload.new as CriticalAlert : alert
          ));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('critical-alert-system', {
        body: {
          action: 'resolve_alert',
          data: { alertId, userId: 'current-user-id' } // Replace with actual user ID
        }
      });

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolved_at: new Date().toISOString() }
          : alert
      ));

      toast({
        title: "Success",
        description: "Alert resolved successfully"
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      });
    }
  };

  const triggerTestAlert = async (alertType: string) => {
    try {
      await supabase.functions.invoke('critical-alert-system', {
        body: {
          action: 'process_alert',
          alertType,
          data: { test: true, provider: 'test-provider' }
        }
      });

      toast({
        title: "Test Alert Triggered",
        description: `Test ${alertType} alert has been triggered`
      });
    } catch (error) {
      console.error('Error triggering test alert:', error);
      toast({
        title: "Error",
        description: "Failed to trigger test alert",
        variant: "destructive"
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'blue';
      default:
        return 'secondary';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-destructive">
                  {activeAlerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-orange-500">
                  {activeAlerts.filter(a => a.severity === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Medium</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {activeAlerts.filter(a => a.severity === 'medium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved (24h)</p>
                <p className="text-2xl font-bold text-green-500">
                  {resolvedAlerts.filter(a => 
                    new Date(a.resolved_at!).getTime() > Date.now() - 86400000
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No active alerts. System is operating normally.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={getSeverityColor(alert.severity) as any}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.alert_type}</Badge>
                            {alert.requires_manual_action && (
                              <Badge variant="destructive">Manual Action Required</Badge>
                            )}
                          </div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => resolveAlert(alert.id)}
                        size="sm"
                        variant="outline"
                      >
                        Resolve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedAlerts.slice(0, 20).map((alert) => (
            <Card key={alert.id} className="opacity-75">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{alert.severity.toUpperCase()}</Badge>
                      <Badge variant="outline">{alert.alert_type}</Badge>
                      <Badge variant="secondary">RESOLVED</Badge>
                    </div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Resolved: {new Date(alert.resolved_at!).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Alert Configurations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['provider_failure', 'high_error_rate', 'quota_exceeded', 'payment_failure'].map((alertType) => (
                  <div key={alertType} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h4 className="font-medium">{alertType.replace('_', ' ').toUpperCase()}</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitor for {alertType.replace('_', ' ')} incidents
                      </p>
                    </div>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Alert Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['provider_failure', 'high_error_rate', 'quota_exceeded', 'payment_failure'].map((alertType) => (
                  <Button
                    key={alertType}
                    onClick={() => triggerTestAlert(alertType)}
                    variant="outline"
                    className="justify-start"
                  >
                    Test {alertType.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};