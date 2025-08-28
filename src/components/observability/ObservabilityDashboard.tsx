import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface ErrorMetrics {
  total: number;
  critical: number;
  bySection: Record<string, number>;
  recentErrors: Array<{
    id: string;
    message: string;
    section: string;
    timestamp: string;
    correlation_id: string;
  }>;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  errorRate: number;
  totalRequests: number;
  slowestEndpoints: Array<{
    endpoint: string;
    avgTime: number;
    requestCount: number;
  }>;
}

const ObservabilityDashboard: React.FC = () => {
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics>({
    total: 0,
    critical: 0,
    bySection: {},
    recentErrors: []
  });
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    avgResponseTime: 0,
    errorRate: 0,
    totalRequests: 0,
    slowestEndpoints: []
  });
  
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchObservabilityData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchObservabilityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchObservabilityData = async () => {
    try {
      setLoading(true);
      
      // Fetch correlation tracking data
      const { data: correlations, error: corrError } = await supabase
        .from('correlation_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (corrError) throw corrError;

      setCorrelationData(correlations || []);

      // Analyze error patterns from correlation data
      const errorData = (correlations || []).filter(c => 
        c.status === 'error' || c.request_type?.includes('error')
      );

      const sectionCounts: Record<string, number> = {};
      errorData.forEach(error => {
        const requestData = error.request_data as any;
        const section = requestData?.section || 'unknown';
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      });

      setErrorMetrics({
        total: errorData.length,
        critical: errorData.filter(e => (e.request_data as any)?.severity === 'critical').length,
        bySection: sectionCounts,
        recentErrors: errorData.slice(0, 10).map(e => ({
          id: e.id,
          message: (e.request_data as any)?.error || 'Unknown error',
          section: (e.request_data as any)?.section || 'unknown',
          timestamp: e.created_at,
          correlation_id: e.correlation_id
        }))
      });

      // Calculate performance metrics
      const completedRequests = (correlations || []).filter(c => 
        c.status === 'completed' && c.duration_ms
      );

      const avgTime = completedRequests.length > 0 ? 
        completedRequests.reduce((sum, r) => sum + r.duration_ms, 0) / completedRequests.length : 0;

      const errorRate = correlations?.length > 0 ? 
        (errorData.length / correlations.length) * 100 : 0;

      setPerformanceMetrics({
        avgResponseTime: Math.round(avgTime),
        errorRate: Math.round(errorRate * 100) / 100,
        totalRequests: correlations?.length || 0,
        slowestEndpoints: [] // TODO: Implement endpoint analysis
      });

      setLastRefresh(new Date());
      logger.info('Observability data refreshed');
      
    } catch (error) {
      logger.error('Error fetching observability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = () => {
    if (errorMetrics.critical > 0) return { status: 'critical', color: 'text-red-600', icon: AlertTriangle };
    if (performanceMetrics.errorRate > 5) return { status: 'warning', color: 'text-orange-600', icon: AlertTriangle };
    return { status: 'healthy', color: 'text-green-600', icon: CheckCircle };
  };

  const health = getHealthStatus();
  const HealthIcon = health.icon;

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className={`text-lg font-bold ${health.color} capitalize`}>
                  {health.status}
                </p>
              </div>
              <HealthIcon className={`h-6 w-6 ${health.color}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{performanceMetrics.totalRequests}</p>
              </div>
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{performanceMetrics.avgResponseTime}ms</p>
              </div>
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{performanceMetrics.errorRate}%</p>
              </div>
              {performanceMetrics.errorRate > 5 ? 
                <TrendingUp className="h-6 w-6 text-red-600" /> : 
                <TrendingDown className="h-6 w-6 text-green-600" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {errorMetrics.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{errorMetrics.critical} critical error{errorMetrics.critical > 1 ? 's' : ''}</strong> detected. 
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="errors" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="correlation">Request Tracking</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" onClick={fetchObservabilityData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="errors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Section</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(errorMetrics.bySection).map(([section, count]) => (
                    <div key={section} className="flex items-center justify-between">
                      <span className="capitalize">{section}</span>
                      <Badge variant={count > 5 ? "destructive" : "secondary"}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                  {Object.keys(errorMetrics.bySection).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No errors detected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Errors */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {errorMetrics.recentErrors.map((error) => (
                    <div key={error.id} className="border-l-4 border-red-500 pl-3 py-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{error.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {error.section}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(error.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <code className="text-xs text-muted-foreground block mt-1">
                        {error.correlation_id}
                      </code>
                    </div>
                  ))}
                  {errorMetrics.recentErrors.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent errors</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Performance metrics dashboard coming soon...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Current average response time: {performanceMetrics.avgResponseTime}ms
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation">
          <Card>
            <CardHeader>
              <CardTitle>Request Correlation Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {correlationData.slice(0, 20).map((request) => (
                  <div key={request.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={request.status === 'completed' ? 'default' : 
                                  request.status === 'error' ? 'destructive' : 'secondary'}
                        >
                          {request.status}
                        </Badge>
                        <span className="font-medium">{request.request_type}</span>
                      </div>
                      {request.duration_ms && (
                        <span className="text-sm text-muted-foreground">
                          {request.duration_ms}ms
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-muted-foreground">
                      {request.correlation_id}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {lastRefresh.toLocaleString()}
      </div>
    </div>
  );
};

export { ObservabilityDashboard };
export default ObservabilityDashboard;