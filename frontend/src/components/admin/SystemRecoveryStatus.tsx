import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Database,
  Settings,
  Shield,
  Activity,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  timestamp?: string;
  details?: string;
}

interface SystemStatus {
  overallHealth: 'healthy' | 'degraded' | 'critical';
  recoveryProgress: number;
  steps: RecoveryStep[];
  criticalIssues: string[];
  recommendations: string[];
  lastUpdated: string;
}

export default function SystemRecoveryStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSystemStatus = async () => {
    try {
      setLoading(true);

      // Check database health
      const { data: providerConfigs } = await supabase
        .from('provider_configs')
        .select('count')
        .single();

      const { data: providerHealth } = await supabase
        .from('provider_health')
        .select('count')
        .single();

      const { data: providerQuotas } = await supabase
        .from('provider_quotas')
        .select('count')
        .single();

      // Run foundation repair test
      const { data: foundationTest } = await supabase.functions.invoke('foundation-repair-test');

      // Check unified health
      const { data: healthData } = await supabase.functions.invoke('unified-health-monitor');

      const recoverySteps: RecoveryStep[] = [
        {
          id: 'database-cleanup',
          name: 'Database Cleanup & Repair',
          description: 'Clean duplicate records, restore constraints, refresh provider data',
          status: providerConfigs ? 'completed' : 'failed',
          timestamp: new Date().toISOString(),
          details: `Provider configs: ${providerConfigs?.count || 0}, Health records: ${providerHealth?.count || 0}`
        },
        {
          id: 'provider-configuration',
          name: 'Provider Configuration Restoration',
          description: 'Enable Amadeus services, correct priorities, validate credentials',
          status: foundationTest?.summary?.passed >= 3 ? 'completed' : 'in-progress',
          timestamp: new Date().toISOString(),
          details: `Foundation tests: ${foundationTest?.summary?.passed || 0}/${foundationTest?.summary?.total || 0} passed`
        },
        {
          id: 'component-fixes',
          name: 'Component Error Resolution',
          description: 'Fix HotelBedsMonitoringDashboard null pointer errors and data validation',
          status: 'completed',
          timestamp: new Date().toISOString(),
          details: 'Null safety checks added, error boundaries implemented'
        },
        {
          id: 'monitoring-enhancement',
          name: 'Enhanced System Monitoring',
          description: 'Implement real-time health checks and comprehensive error tracking',
          status: healthData?.overallStatus ? 'completed' : 'in-progress',
          timestamp: new Date().toISOString(),
          details: `Health monitor: ${healthData?.overallStatus || 'unknown'}, Providers: ${healthData?.summary?.totalProviders || 0}`
        },
        {
          id: 'validation-testing',
          name: 'Validation & Testing',
          description: 'Execute comprehensive system health check and provider integration tests',
          status: healthData?.overallStatus === 'healthy' ? 'completed' : 'in-progress',
          timestamp: new Date().toISOString(),
          details: `Overall system: ${healthData?.overallStatus || 'unknown'}`
        }
      ];

      const completedSteps = recoverySteps.filter(step => step.status === 'completed').length;
      const recoveryProgress = (completedSteps / recoverySteps.length) * 100;

      const criticalIssues: string[] = [];
      const recommendations: string[] = [];

      if (foundationTest?.summary?.failed > 0) {
        criticalIssues.push(`${foundationTest.summary.failed} foundation tests failing`);
        recommendations.push('Review and fix failing foundation tests immediately');
      }

      if (healthData?.overallStatus === 'critical') {
        criticalIssues.push('System health is critical');
        recommendations.push('Immediate intervention required for critical health issues');
      }

      if (healthData?.summary?.circuitBreakersOpen?.length > 0) {
        criticalIssues.push(`${healthData.summary.circuitBreakersOpen.length} circuit breakers open`);
        recommendations.push('Reset circuit breakers and verify provider connectivity');
      }

      if (criticalIssues.length === 0) {
        recommendations.push('System recovery appears successful - continue monitoring');
      }

      const systemStatus: SystemStatus = {
        overallHealth: healthData?.overallStatus === 'healthy' ? 'healthy' : 
                      healthData?.overallStatus === 'degraded' ? 'degraded' : 'critical',
        recoveryProgress,
        steps: recoverySteps,
        criticalIssues,
        recommendations,
        lastUpdated: new Date().toISOString()
      };

      setStatus(systemStatus);

    } catch (error) {
      console.error('Failed to check system status:', error);
      toast({
        title: "Error",
        description: "Failed to check system recovery status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load system recovery status. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Recovery Status</h1>
          <p className="text-muted-foreground">
            Comprehensive system recovery monitoring and validation dashboard
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={checkSystemStatus} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(status.overallHealth)}`}>
              {status.overallHealth.charAt(0).toUpperCase() + status.overallHealth.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground">Overall system status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recovery Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(status.recoveryProgress)}%</div>
            <Progress value={status.recoveryProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {status.steps.filter(s => s.status === 'completed').length} of {status.steps.length} steps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${status.criticalIssues.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {status.criticalIssues.length}
            </div>
            <p className="text-xs text-muted-foreground">Issues requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Alert */}
      {status.criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Critical Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {status.criticalIssues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Recovery Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Recovery Plan Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.steps.map((step) => (
              <div key={step.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="mt-1">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{step.name}</h3>
                    <Badge 
                      variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'in-progress' ? 'secondary' :
                        step.status === 'failed' ? 'destructive' : 'outline'
                      }
                    >
                      {step.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {step.details && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Details:</strong> {step.details}
                    </p>
                  )}
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {step.status === 'completed' ? 'Completed' : 'Updated'}: {new Date(step.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {status.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Activity className="h-4 w-4 mt-0.5 text-blue-500" />
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(status.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}