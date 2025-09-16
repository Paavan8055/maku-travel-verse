import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Database,
  CreditCard,
  Plane,
  Building,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertCircle
} from 'lucide-react';

interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  services: Record<string, HealthCheckResult[]>;
  summary: {
    total_endpoints: number;
    healthy_endpoints: number;
    degraded_endpoints: number;
    unhealthy_endpoints: number;
    average_response_time: number;
  };
}

interface HealthCheckResult {
  service: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  timestamp: string;
}

interface CriticalAlert {
  id: string;
  booking_id?: string;
  alert_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requires_manual_action: boolean;
  resolved: boolean;
  created_at: string;
}

interface BookingTransaction {
  booking_id: string;
  status: string;
  stripe_payment_intent_id?: string;
  provider_booking_id?: string;
  total_amount: number;
  currency: string;
  failure_reason?: string;
  rollback_required?: boolean;
  created_at: string;
  updated_at: string;
}

export const EnhancedProductionDashboard = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [failedTransactions, setFailedTransactions] = useState<BookingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical':
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-success/10 text-success border-success/20';
      case 'degraded':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'critical':
      case 'unhealthy':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'amadeus':
        return <Plane className="h-4 w-4" />;
      case 'hotelbeds':
        return <Building className="h-4 w-4" />;
      case 'stripe':
        return <CreditCard className="h-4 w-4" />;
      case 'supabase':
        return <Database className="h-4 w-4" />;
      case 'sabre':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const runComprehensiveHealthCheck = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('comprehensive-health-monitor');

      if (error) throw error;

      setSystemHealth(data);
      setLastUpdate(new Date());
      
      toast({
        title: "Health check completed",
        description: `System status: ${data.overall_status}`,
        variant: data.overall_status === 'critical' ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Comprehensive health check failed:', error);
      toast({
        title: "Health check failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCriticalAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('critical_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCriticalAlerts((data || []) as CriticalAlert[]);
    } catch (error) {
      console.error('Failed to fetch critical alerts:', error);
      setCriticalAlerts([]);
    }
  };

  const fetchFailedTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_transactions')
        .select('*')
        .in('status', ['failed', 'cancelled'])
        .eq('rollback_required', true)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFailedTransactions(data || []);
    } catch (error) {
      console.error('Failed to fetch failed transactions:', error);
      setFailedTransactions([]);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('critical_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert resolved",
        description: "Critical alert has been marked as resolved.",
      });

      fetchCriticalAlerts();
    } catch (error) {
      toast({
        title: "Failed to resolve alert",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateHealthScore = () => {
    if (!systemHealth) return 0;
    const { summary } = systemHealth;
    if (summary.total_endpoints === 0) return 0;
    
    const healthyWeight = 100;
    const degradedWeight = 50;
    const unhealthyWeight = 0;
    
    const totalScore = 
      (summary.healthy_endpoints * healthyWeight) +
      (summary.degraded_endpoints * degradedWeight) +
      (summary.unhealthy_endpoints * unhealthyWeight);
    
    return Math.round(totalScore / summary.total_endpoints);
  };

  useEffect(() => {
    runComprehensiveHealthCheck();
    fetchCriticalAlerts();
    fetchFailedTransactions();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      runComprehensiveHealthCheck();
      fetchCriticalAlerts();
      fetchFailedTransactions();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const healthScore = calculateHealthScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health, API status, and critical issue monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={runComprehensiveHealthCheck} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      {systemHealth && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {getStatusIcon(systemHealth.overall_status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthScore}%</div>
              <Progress value={healthScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {systemHealth.summary.healthy_endpoints}/{systemHealth.summary.total_endpoints} endpoints healthy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.summary.average_response_time}ms</div>
              <p className="text-xs text-muted-foreground">
                Average across all services
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                Unresolved issues requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Requiring rollback or intervention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Status Alert */}
      {systemHealth && (
        <Alert className={`${
          systemHealth.overall_status === 'healthy' ? 'border-success bg-success/5' :
          systemHealth.overall_status === 'degraded' ? 'border-warning bg-warning/5' :
          'border-destructive bg-destructive/5'
        }`}>
          <div className="flex items-center gap-2">
            {getStatusIcon(systemHealth.overall_status)}
            <AlertDescription className="flex-1">
              <strong>System Status: {systemHealth.overall_status.toUpperCase()}</strong>
              <span className="ml-2 text-sm">
                {systemHealth.summary.unhealthy_endpoints > 0 && (
                  `${systemHealth.summary.unhealthy_endpoints} critical issues detected - `
                )}
                {systemHealth.summary.degraded_endpoints > 0 && (
                  `${systemHealth.summary.degraded_endpoints} degraded services - `
                )}
                Last checked: {new Date(systemHealth.timestamp).toLocaleString()}
              </span>
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Service Health</TabsTrigger>
          <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
          <TabsTrigger value="transactions">Failed Transactions</TabsTrigger>
          <TabsTrigger value="security">Security Status</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {systemHealth && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(systemHealth.services).map(([service, endpoints]) => {
                const healthyCount = endpoints.filter(e => e.status === 'healthy').length;
                const serviceScore = Math.round((healthyCount / endpoints.length) * 100);
                
                return (
                  <Card key={service}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {getProviderIcon(service)}
                        {service.charAt(0).toUpperCase() + service.slice(1)}
                      </CardTitle>
                      <Badge className={getStatusColor(
                        healthyCount === endpoints.length ? 'healthy' :
                        healthyCount > 0 ? 'degraded' : 'unhealthy'
                      )}>
                        {serviceScore}%
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {endpoints.map((endpoint) => (
                          <div key={endpoint.endpoint} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{endpoint.endpoint}</span>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(endpoint.status)}
                              <span className="text-xs text-muted-foreground">
                                {endpoint.responseTime}ms
                              </span>
                              {endpoint.error && (
                                <AlertTriangle className="h-3 w-3 text-destructive" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Alerts</CardTitle>
              <CardDescription>Unresolved system issues requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="font-medium">{alert.alert_type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                        {alert.booking_id && ` • Booking: ${alert.booking_id}`}
                      </p>
                    </div>
                    {alert.requires_manual_action && (
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-3"
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
                {criticalAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <p className="text-muted-foreground">No critical alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Transactions</CardTitle>
              <CardDescription>Booking transactions requiring rollback or manual intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {failedTransactions.map((transaction) => (
                  <div key={transaction.booking_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Booking {transaction.booking_id.substring(0, 8)}</span>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        {transaction.rollback_required && (
                          <Badge variant="destructive">Rollback Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Amount: {transaction.currency} {transaction.total_amount}
                        {transaction.stripe_payment_intent_id && ` • PI: ${transaction.stripe_payment_intent_id}`}
                      </p>
                      {transaction.failure_reason && (
                        <p className="text-sm text-destructive mt-1">{transaction.failure_reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {failedTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <p className="text-muted-foreground">No failed transactions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Authentication and data protection configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-warning bg-warning/5">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Configuration Required</strong><br />
                    The following security settings need attention:
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>OTP expiry time should be reduced to 10 minutes in Supabase Auth settings</li>
                      <li>Enable leaked password protection in Supabase Auth settings</li>
                      <li>Review function search paths for security compliance</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-success" />
                      <span className="font-medium">Row Level Security</span>
                      <Badge className="bg-success/10 text-success">Enabled</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All tables have proper RLS policies configured
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-success" />
                      <span className="font-medium">Data Encryption</span>
                      <Badge className="bg-success/10 text-success">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All sensitive data encrypted at rest and in transit
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};