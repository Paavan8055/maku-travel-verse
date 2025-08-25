import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HealthStatus {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  responseTime: number;
  errorRate: number;
}

interface CriticalIssue {
  type: 'error' | 'booking' | 'provider';
  severity: 'high' | 'medium' | 'low';
  message: string;
  count?: number;
  lastOccurrence: string;
}

export const ProductionHealthMonitor: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [criticalIssues, setCriticalIssues] = useState<CriticalIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      // Check provider health
      const { data: healthData } = await supabase.functions.invoke('health-check');
      
      if (healthData?.services) {
        const providers: HealthStatus[] = Object.entries(healthData.services).map(([name, service]: [string, any]) => ({
          provider: name,
          status: service.status === 'up' ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
          responseTime: service.responseTime || 0,
          errorRate: 0
        }));
        setHealthStatus(providers);
      }

      // Check for critical issues
      const issues: CriticalIssue[] = [];

      // Check unresolved errors
      const { data: errorData } = await supabase
        .from('error_tracking')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (errorData && errorData.length > 0) {
        const errorGroups = errorData.reduce((acc, error) => {
          const key = error.error_type;
          if (!acc[key]) {
            acc[key] = { count: 0, latest: error.created_at };
          }
          acc[key].count++;
          if (error.created_at > acc[key].latest) {
            acc[key].latest = error.created_at;
          }
          return acc;
        }, {} as Record<string, { count: number; latest: string }>);

        Object.entries(errorGroups).forEach(([errorType, data]) => {
          issues.push({
            type: 'error',
            severity: data.count > 5 ? 'high' : 'medium',
            message: `${data.count} unresolved ${errorType} errors`,
            count: data.count,
            lastOccurrence: data.latest
          });
        });
      }

      // Check pending bookings
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('status')
        .eq('status', 'pending');

      if (bookingData && bookingData.length > 10) {
        issues.push({
          type: 'booking',
          severity: 'high',
          message: `${bookingData.length} bookings stuck in pending status`,
          count: bookingData.length,
          lastOccurrence: new Date().toISOString()
        });
      }

      // Check provider failures
      const failedProviders = healthStatus.filter(p => p.status === 'unhealthy');
      if (failedProviders.length > 0) {
        issues.push({
          type: 'provider',
          severity: failedProviders.length > 1 ? 'high' : 'medium',
          message: `${failedProviders.length} provider(s) unhealthy: ${failedProviders.map(p => p.provider).join(', ')}`,
          count: failedProviders.length,
          lastOccurrence: new Date().toISOString()
        });
      }

      setCriticalIssues(issues);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveError = async (errorType: string) => {
    try {
      await supabase
        .from('error_tracking')
        .update({ resolved: true })
        .eq('error_type', errorType)
        .eq('resolved', false);
      
      await checkSystemHealth();
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Production Health Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of critical system components
          </p>
        </div>
        <Button onClick={checkSystemHealth} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {lastUpdate && (
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalIssues.length} critical issue(s) detected</strong>
            <ul className="mt-2 space-y-1">
              {criticalIssues.map((issue, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>{issue.message}</span>
                  {issue.type === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveError(issue.message.split(' ')[2])}
                      className="ml-2"
                    >
                      Mark Resolved
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Health Status</CardTitle>
          <CardDescription>
            Current status of all external service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {healthStatus.map((provider) => (
              <div key={provider.provider} className="flex items-center space-x-2">
                {getStatusIcon(provider.status)}
                <div className="flex-1">
                  <p className="font-medium capitalize">{provider.provider}</p>
                  <p className="text-xs text-muted-foreground">
                    {provider.responseTime}ms response
                  </p>
                </div>
                <Badge variant={provider.status === 'healthy' ? 'default' : 'destructive'}>
                  {provider.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Bookings
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {criticalIssues.find(i => i.type === 'booking')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Bookings awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unresolved Errors
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {criticalIssues.filter(i => i.type === 'error').reduce((acc, issue) => acc + (issue.count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Errors requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Provider Uptime
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((healthStatus.filter(p => p.status === 'healthy').length / Math.max(healthStatus.length, 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Services operational
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};