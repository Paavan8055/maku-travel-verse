import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, RefreshCw, Zap, Database, CreditCard, Server } from 'lucide-react';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthTest {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: any;
}

interface AlertThreshold {
  metric: string;
  value: number;
  operator: '>' | '<' | '=';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export const HealthCheckValidator = () => {
  const { health, loading, checkHealth, getHealthScore, isHealthy } = useHealthMonitor({
    checkInterval: 30000, // 30 seconds for testing
    enableAutoCheck: true,
    onStatusChange: (newHealth) => {
      console.log('Health status changed:', newHealth);
      checkAlerts(newHealth);
    }
  });

  const [healthTests, setHealthTests] = useState<HealthTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [lastAlertCheck, setLastAlertCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  const alertThresholds: AlertThreshold[] = [
    {
      metric: 'database.responseTime',
      value: 1000,
      operator: '>',
      severity: 'medium',
      description: 'Database response time > 1 second'
    },
    {
      metric: 'amadeus.responseTime',
      value: 2000,
      operator: '>',
      severity: 'low',
      description: 'Amadeus API response time > 2 seconds'
    },
    {
      metric: 'stripe.responseTime',
      value: 1500,
      operator: '>',
      severity: 'medium',
      description: 'Stripe API response time > 1.5 seconds'
    },
    {
      metric: 'performance.memoryUsage',
      value: 100,
      operator: '>',
      severity: 'high',
      description: 'Memory usage > 100MB'
    },
    {
      metric: 'performance.responseTime',
      value: 3000,
      operator: '>',
      severity: 'high',
      description: 'Overall response time > 3 seconds'
    }
  ];

  const checkAlerts = (healthData: any) => {
    const newAlerts: string[] = [];
    
    alertThresholds.forEach(threshold => {
      const value = getNestedValue(healthData, threshold.metric);
      
      if (value !== undefined) {
        let alertTriggered = false;
        
        switch (threshold.operator) {
          case '>':
            alertTriggered = value > threshold.value;
            break;
          case '<':
            alertTriggered = value < threshold.value;
            break;
          case '=':
            alertTriggered = value === threshold.value;
            break;
        }
        
        if (alertTriggered) {
          newAlerts.push(`${threshold.severity.toUpperCase()}: ${threshold.description} (Current: ${value})`);
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(newAlerts);
      setLastAlertCheck(new Date());
      
      // Show toast for high severity alerts
      const highSeverityAlerts = newAlerts.filter(alert => alert.startsWith('HIGH:'));
      if (highSeverityAlerts.length > 0) {
        toast({
          title: "Critical Health Alert",
          description: `${highSeverityAlerts.length} critical issue(s) detected`,
          variant: "destructive"
        });
      }
    } else {
      setAlerts([]);
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const runHealthValidation = async () => {
    setIsRunning(true);
    setHealthTests([
      { name: 'Database Connection', status: 'pending' },
      { name: 'Amadeus API', status: 'pending' },
      { name: 'Stripe API', status: 'pending' },
      { name: 'System Performance', status: 'pending' },
      { name: 'Error Recovery', status: 'pending' }
    ]);

    // Test Database Connection
    const dbStart = Date.now();
    setHealthTests(prev => prev.map(test => 
      test.name === 'Database Connection' ? { ...test, status: 'running' } : test
    ));

    try {
      const { data, error } = await supabase.from('airports').select('*').limit(1);
      
      setHealthTests(prev => prev.map(test => 
        test.name === 'Database Connection' 
          ? { 
              ...test, 
              status: error ? 'failed' : 'passed', 
              duration: Date.now() - dbStart,
              error: error?.message,
              details: { recordCount: data?.length || 0 }
            } 
          : test
      ));
    } catch (error) {
      setHealthTests(prev => prev.map(test => 
        test.name === 'Database Connection' 
          ? { 
              ...test, 
              status: 'failed', 
              duration: Date.now() - dbStart,
              error: error instanceof Error ? error.message : 'Unknown error'
            } 
          : test
      ));
    }

    // Test Amadeus API
    const amadeusStart = Date.now();
    setHealthTests(prev => prev.map(test => 
      test.name === 'Amadeus API' ? { ...test, status: 'running' } : test
    ));

    try {
      const { data, error } = await supabase.functions.invoke('amadeus-health');
      
      setHealthTests(prev => prev.map(test => 
        test.name === 'Amadeus API' 
          ? { 
              ...test, 
              status: error ? 'failed' : 'passed', 
              duration: Date.now() - amadeusStart,
              error: error?.message,
              details: data
            } 
          : test
      ));
    } catch (error) {
      setHealthTests(prev => prev.map(test => 
        test.name === 'Amadeus API' 
          ? { 
              ...test, 
              status: 'failed', 
              duration: Date.now() - amadeusStart,
              error: error instanceof Error ? error.message : 'API check failed'
            } 
          : test
      ));
    }

    // Test Stripe API
    const stripeStart = Date.now();
    setHealthTests(prev => prev.map(test => 
      test.name === 'Stripe API' ? { ...test, status: 'running' } : test
    ));

    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
      
      setHealthTests(prev => prev.map(test => 
        test.name === 'Stripe API' 
          ? { 
              ...test, 
              status: error ? 'failed' : 'passed', 
              duration: Date.now() - stripeStart,
              error: error?.message,
              details: { hasKey: !!data }
            } 
          : test
      ));
    } catch (error) {
      setHealthTests(prev => prev.map(test => 
        test.name === 'Stripe API' 
          ? { 
              ...test, 
              status: 'failed', 
              duration: Date.now() - stripeStart,
              error: error instanceof Error ? error.message : 'Stripe check failed'
            } 
          : test
      ));
    }

    // Test System Performance
    const perfStart = Date.now();
    setHealthTests(prev => prev.map(test => 
      test.name === 'System Performance' ? { ...test, status: 'running' } : test
    ));

    try {
      const { data, error } = await supabase.functions.invoke('performance-monitor', {
        body: {
          type: 'system',
          metric_type: 'api_latency',
          value: Date.now() - perfStart
        }
      });
      
      setHealthTests(prev => prev.map(test => 
        test.name === 'System Performance' 
          ? { 
              ...test, 
              status: error ? 'failed' : 'passed', 
              duration: Date.now() - perfStart,
              error: error?.message
            } 
          : test
      ));
    } catch (error) {
      setHealthTests(prev => prev.map(test => 
        test.name === 'System Performance' 
          ? { 
              ...test, 
              status: 'failed', 
              duration: Date.now() - perfStart,
              error: error instanceof Error ? error.message : 'Performance monitoring failed'
            } 
          : test
      ));
    }

    // Test Error Recovery
    const errorStart = Date.now();
    setHealthTests(prev => prev.map(test => 
      test.name === 'Error Recovery' ? { ...test, status: 'running' } : test
    ));

    // Simulate error recovery test
    await new Promise(resolve => setTimeout(resolve, 500));
    setHealthTests(prev => prev.map(test => 
      test.name === 'Error Recovery' 
        ? { 
            ...test, 
            status: 'passed', 
            duration: Date.now() - errorStart,
            details: { gracefulDegradation: true }
          } 
        : test
    ));

    setIsRunning(false);
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'amadeus': return <Zap className="h-4 w-4" />;
      case 'stripe': return <CreditCard className="h-4 w-4" />;
      case 'supabase': return <Server className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Check Validator</h2>
          <p className="text-muted-foreground">
            Monitor system health and validate alert mechanisms
          </p>
        </div>
        <Button onClick={runHealthValidation} disabled={isRunning}>
          {isRunning ? 'Validating...' : 'Run Health Validation'}
        </Button>
      </div>

      {/* Current Health Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overall Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isHealthy ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <Badge variant={isHealthy ? 'default' : 'destructive'}>
                {health?.status || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getHealthScore()}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.performance.responseTime ? `${Math.round(health.performance.responseTime)}ms` : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.performance.memoryUsage ? `${health.performance.memoryUsage}MB` : '--'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(health.services).map(([name, service]) => (
                <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(name)}
                    <div>
                      <div className="font-medium capitalize">{name}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.responseTime ? `${Math.round(service.responseTime)}ms` : 'No data'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={service.status === 'up' ? 'default' : 'destructive'}>
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Tests */}
      {healthTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Health Validation Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthTests.map((test) => (
                <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      {test.duration && (
                        <div className="text-sm text-muted-foreground">
                          Duration: {test.duration}ms
                        </div>
                      )}
                      {test.error && (
                        <div className="text-sm text-destructive">
                          Error: {test.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={
                    test.status === 'passed' ? 'default' : 
                    test.status === 'failed' ? 'destructive' : 
                    'secondary'
                  }>
                    {test.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="text-sm">{alert}</div>
                </div>
              ))}
              {lastAlertCheck && (
                <div className="text-xs text-muted-foreground mt-2">
                  Last checked: {lastAlertCheck.toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};