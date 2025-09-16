import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOperationalExcellence } from '@/hooks/useOperationalExcellence';
import { 
  Activity, 
  Shield, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

export const OperationalDashboard = () => {
  const {
    metrics,
    healingActions,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    collectMetrics,
    executeHealingAction
  } = useOperationalExcellence();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Start monitoring on component mount
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await collectMetrics();
    setRefreshing(false);
  };

  const getHealthColor = (value: number, reverse = false) => {
    if (reverse) {
      return value < 20 ? 'text-success' : value < 50 ? 'text-warning' : 'text-destructive';
    }
    return value > 80 ? 'text-success' : value > 50 ? 'text-warning' : 'text-destructive';
  };

  const getProgressColor = (value: number, reverse = false) => {
    if (reverse) {
      return value < 20 ? 'bg-success' : value < 50 ? 'bg-warning' : 'bg-destructive';
    }
    return value > 80 ? 'bg-success' : value > 50 ? 'bg-warning' : 'bg-destructive';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-accent';
      case 'low': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operational Excellence</h1>
          <p className="text-muted-foreground">
            Advanced analytics, correlation tracking, and self-healing systems
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Availability</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(metrics?.availability || 0)}>
                {metrics?.availability?.toFixed(1) || '0'}%
              </span>
            </div>
            <Progress 
              value={metrics?.availability || 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Provider health status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(2000 - (metrics?.responseTime || 0), true)}>
                {metrics?.responseTime?.toFixed(0) || '0'}ms
              </span>
            </div>
            <Progress 
              value={Math.min((metrics?.responseTime || 0) / 20, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Cross-provider average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getHealthColor(metrics?.errorRate || 0, true)}>
                {metrics?.errorRate?.toFixed(1) || '0'}%
              </span>
            </div>
            <Progress 
              value={metrics?.errorRate || 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Failed requests percentage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healing Actions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healingActions.filter(a => a.executed).length}
              <span className="text-sm text-muted-foreground">
                /{healingActions.length}
              </span>
            </div>
            <Progress 
              value={healingActions.length > 0 ? (healingActions.filter(a => a.executed).length / healingActions.length) * 100 : 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Self-healing executed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="circuit-breakers">
        <TabsList>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="quota-usage">Quota Usage</TabsTrigger>
          <TabsTrigger value="healing-actions">Self-Healing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="circuit-breakers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breaker States</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(metrics?.circuitBreakerStates || {}).map(([provider, state]) => (
                  <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{provider}</p>
                      <p className="text-sm text-muted-foreground">Provider status</p>
                    </div>
                    <Badge className={
                      state === 'closed' ? 'bg-success' : 
                      state === 'half-open' ? 'bg-warning' : 
                      'bg-destructive'
                    }>
                      {state}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quota-usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Quota Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics?.quotaUsage || {}).map(([provider, usage]) => (
                  <div key={provider} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{provider}</span>
                      <span className={`font-bold ${getHealthColor(usage, true)}`}>
                        {usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={usage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="healing-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Self-Healing Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healingActions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No healing actions detected. System is running optimally.
                  </p>
                ) : (
                  healingActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityColor(action.severity)}>
                            {action.severity}
                          </Badge>
                          <Badge variant="outline">
                            {action.type}
                          </Badge>
                          <span className="font-medium">{action.provider}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                        {action.executedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Executed: {new Date(action.executedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {action.executed ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : action.automated ? (
                          <Clock className="h-5 w-5 text-warning animate-spin" />
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => executeHealingAction(action)}
                          >
                            Execute
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Performance Trends</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Response Time Trend</span>
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Error Rate Trend</span>
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Availability Trend</span>
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">System Health Score</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-success mb-2">
                      {metrics ? Math.round(
                        (metrics.availability * 0.4) + 
                        ((100 - metrics.errorRate) * 0.3) + 
                        (Math.max(0, 100 - metrics.responseTime / 20) * 0.3)
                      ) : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Overall health score
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