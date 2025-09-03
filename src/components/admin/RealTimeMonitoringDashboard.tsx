import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  Monitor,
  Database,
  Zap,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MonitoringMetrics {
  timestamp: number;
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'critical';
    providers: {
      healthy: number;
      degraded: number;
      outage: number;
    };
    bookingOperations: {
      active: number;
      completed: number;
      failed: number;
    };
    alerts: {
      critical: number;
      warning: number;
    };
  };
  performance: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  realTimeData: {
    activeBookings: number;
    currentUsers: number;
    systemLoad: number;
  };
}

interface LiveAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export const RealTimeMonitoringDashboard: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Initial load
    loadMonitoringData();

    // Set up real-time updates every 5 seconds
    const interval = setInterval(loadMonitoringData, 5000);

    // Set up real-time alerts subscription
    const alertsSubscription = supabase
      .channel('monitoring-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'critical_alerts'
      }, (payload) => {
        handleNewAlert(payload.new as any);
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(alertsSubscription);
    };
  }, []);

  const loadMonitoringData = async () => {
    try {
      // Load current system metrics
      const { data: systemData, error: systemError } = await supabase.functions.invoke('enhanced-provider-health');
      
      if (systemError) throw systemError;

      // Load recent alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('critical_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      // Load booking operations status
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (bookingsError) throw bookingsError;

      // Process and structure the data
      const processedMetrics: MonitoringMetrics = {
        timestamp: Date.now(),
        systemHealth: {
          overall: systemData?.overallStatus || 'unknown',
          providers: {
            healthy: systemData?.healthyProviders || 0,
            degraded: systemData?.degradedProviders || 0,
            outage: systemData?.outageProviders || 0
          },
          bookingOperations: {
            active: bookingsData?.filter((b: any) => b.status === 'pending').length || 0,
            completed: bookingsData?.filter((b: any) => b.status === 'confirmed').length || 0,
            failed: bookingsData?.filter((b: any) => b.status === 'failed').length || 0
          },
          alerts: {
            critical: alertsData?.filter((a: any) => a.severity === 'critical').length || 0,
            warning: alertsData?.filter((a: any) => a.severity === 'medium').length || 0
          }
        },
        performance: {
          avgResponseTime: systemData?.providers?.reduce((sum: number, p: any) => sum + (p.responseTime || 0), 0) / (systemData?.providers?.length || 1) || 0,
          throughput: bookingsData?.length || 0,
          errorRate: (bookingsData?.filter((b: any) => b.status === 'failed').length || 0) / (bookingsData?.length || 1) * 100
        },
        realTimeData: {
          activeBookings: bookingsData?.filter((b: any) => b.status === 'pending').length || 0,
          currentUsers: Math.floor(Math.random() * 50) + 10, // Simulated
          systemLoad: Math.floor(Math.random() * 30) + 20 // Simulated
        }
      };

      setMetrics(processedMetrics);
      setAlerts(alertsData?.map((alert: any) => ({
        id: alert.id,
        type: alert.severity === 'critical' ? 'critical' : 'warning',
        message: alert.message,
        timestamp: alert.created_at,
        acknowledged: alert.resolved
      })) || []);

      setLastUpdate(new Date());
      setIsLoading(false);

    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to load real-time monitoring data.",
        variant: "destructive",
      });
    }
  };

  const handleNewAlert = (alert: any) => {
    const newAlert: LiveAlert = {
      id: alert.id,
      type: alert.severity === 'critical' ? 'critical' : 'warning',
      message: alert.message,
      timestamp: alert.created_at,
      acknowledged: false
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);

    // Show toast notification for critical alerts
    if (alert.severity === 'critical') {
      toast({
        title: "Critical Alert",
        description: alert.message,
        variant: "destructive",
      });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('critical_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been marked as resolved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Monitoring</h1>
          <p className="text-muted-foreground">
            Live system health and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={loadMonitoringData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(metrics?.systemHealth.overall || 'unknown')}
                  <p className={`text-2xl font-bold ${getStatusColor(metrics?.systemHealth.overall || 'unknown')}`}>
                    {metrics?.systemHealth.overall || 'Unknown'}
                  </p>
                </div>
              </div>
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                <p className="text-2xl font-bold">{metrics?.realTimeData.activeBookings || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{Math.round(metrics?.performance.avgResponseTime || 0)}ms</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-destructive">{metrics?.systemHealth.alerts.critical || 0}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Live Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      {alert.type === 'critical' ? 
                        <XCircle className="h-4 w-4 mt-0.5" /> : 
                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                      }
                      <div>
                        <AlertDescription>{alert.message}</AlertDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Healthy</span>
                    <Badge variant="default">{metrics?.systemHealth.providers.healthy || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Degraded</span>
                    <Badge variant="secondary">{metrics?.systemHealth.providers.degraded || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Outage</span>
                    <Badge variant="destructive">{metrics?.systemHealth.providers.outage || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span>{metrics?.realTimeData.systemLoad || 0}%</span>
                    </div>
                    <Progress value={metrics?.realTimeData.systemLoad || 0} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Current Users</span>
                      <span>{metrics?.realTimeData.currentUsers || 0}</span>
                    </div>
                    <Progress value={(metrics?.realTimeData.currentUsers || 0) * 2} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Error Rate</span>
                      <span>{metrics?.performance.errorRate.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={metrics?.performance.errorRate || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Provider Status Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Enhanced provider monitoring active. See Unified Health Dashboard for detailed provider status.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Response Time</span>
                    <span className="font-mono text-sm">{Math.round(metrics?.performance.avgResponseTime || 0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Throughput (24h)</span>
                    <span className="font-mono text-sm">{metrics?.performance.throughput || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-mono text-sm">{metrics?.performance.errorRate.toFixed(2) || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Performance trend charts will be displayed here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Booking Operations Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{metrics?.systemHealth.bookingOperations.active || 0}</div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{metrics?.systemHealth.bookingOperations.completed || 0}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{metrics?.systemHealth.bookingOperations.failed || 0}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};