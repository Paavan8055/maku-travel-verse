import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, TrendingUp, Shield, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemLog {
  id: string;
  correlation_id: string;
  service_name: string;
  log_level: string;
  message: string;
  metadata: any;
  status_code?: number;
  duration_ms?: number;
  created_at: string;
}

interface PerformanceMetric {
  id: string;
  correlation_id: string;
  operation: string;
  duration_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  details: any;
  created_at: string;
}

export const ProductionMonitoringDashboard: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch recent system logs
      const { data: logsData, error: logsError } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Fetch performance metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (metricsError) throw metricsError;
      setMetrics(metricsData || []);

      // Fetch security events
      const { data: securityData, error: securityError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (securityError) throw securityError;
      setSecurityEvents(securityData || []);

    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getLogLevelColor = (level: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const errorLogs = logs.filter(log => log.log_level === 'error');
  const avgResponseTime = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.duration_ms, 0) / metrics.length)
    : 0;
  const successRate = metrics.length > 0 
    ? Math.round((metrics.filter(m => m.success).length / metrics.length) * 100)
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <Button 
          onClick={fetchData} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {errorLogs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              errors in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              across all services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {successRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              successful requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {securityEvents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              events detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Latest system errors and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {errorLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={getLogLevelColor(log.log_level)}>
                          {log.log_level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.service_name}</p>
                      <p className="text-xs text-muted-foreground">{log.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Health</CardTitle>
                <CardDescription>Current status of all services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['amadeus-flight-search', 'amadeus-hotel-search', 'hotelbeds-activities', 'stripe-payment'].map((service) => {
                    const serviceMetrics = metrics.filter(m => m.operation.includes(service));
                    const isHealthy = serviceMetrics.length === 0 || serviceMetrics.every(m => m.success);
                    
                    return (
                      <div key={service} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium">{service}</span>
                        <Badge variant={isHealthy ? 'default' : 'destructive'}>
                          <Activity className="h-3 w-3 mr-1" />
                          {isHealthy ? 'Healthy' : 'Issues'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Real-time application logs with correlation tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getLogLevelColor(log.log_level)}>
                          {log.log_level}
                        </Badge>
                        <span className="text-sm font-medium">{log.service_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mb-1">{log.message}</p>
                    {log.correlation_id && (
                      <p className="text-xs text-muted-foreground">
                        Correlation ID: {log.correlation_id}
                      </p>
                    )}
                    {log.status_code && (
                      <p className="text-xs text-muted-foreground">
                        Status: {log.status_code} | Duration: {log.duration_ms}ms
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>API response times and success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {metrics.map((metric) => (
                  <div key={metric.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{metric.operation}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={metric.success ? 'default' : 'destructive'}>
                          {metric.success ? 'Success' : 'Failed'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {metric.duration_ms}ms
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(metric.created_at).toLocaleString()}
                      </span>
                      {metric.correlation_id && (
                        <span className="text-xs text-muted-foreground">
                          ID: {metric.correlation_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    {metric.error_message && (
                      <p className="text-xs text-destructive mt-1">{metric.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Authentication failures and security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {securityEvents.map((event) => (
                  <div key={event.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="text-sm font-medium">{event.event_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                    {event.details.message && (
                      <p className="text-sm text-muted-foreground">{event.details.message}</p>
                    )}
                    {event.details.correlation_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Correlation: {event.details.correlation_id}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};