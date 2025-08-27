import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Activity, 
  Clock, 
  Zap, 
  Database,
  AlertTriangle,
  TrendingUp,
  Monitor,
  Gauge
} from 'lucide-react';
import { PerformanceValidationDashboard } from '@/components/testing/PerformanceValidationDashboard';

interface PerformanceMetrics {
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
  };
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
    errorRate: number;
  };
  databaseMetrics: {
    queryTime: number;
    connectionCount: number;
    slowQueries: number;
    cacheHitRate: number;
  };
}

export default function PerformanceMonitoringPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Simulate loading performance metrics
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real implementation, this would come from your monitoring service
      const mockMetrics: PerformanceMetrics = {
        webVitals: {
          lcp: 1200 + Math.random() * 800,
          fid: 50 + Math.random() * 100,
          cls: Math.random() * 0.2,
          fcp: 800 + Math.random() * 400
        },
        systemMetrics: {
          memoryUsage: 60 + Math.random() * 30,
          cpuUsage: 30 + Math.random() * 40,
          responseTime: 150 + Math.random() * 100,
          errorRate: Math.random() * 2
        },
        databaseMetrics: {
          queryTime: 10 + Math.random() * 20,
          connectionCount: 15 + Math.random() * 10,
          slowQueries: Math.floor(Math.random() * 5),
          cacheHitRate: 85 + Math.random() * 10
        }
      };

      setMetrics(mockMetrics);
      setLastUpdated(new Date());
      
      toast({
        title: "Metrics Updated",
        description: "Performance metrics have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Failed to Load Metrics",
        description: "Could not retrieve performance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number, thresholds: { good: number; poor: number }) => {
    if (score <= thresholds.good) return 'text-green-600';
    if (score <= thresholds.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentageColor = (percentage: number, reverse = false) => {
    const good = reverse ? percentage < 70 : percentage > 90;
    const medium = reverse ? percentage < 90 : percentage > 70;
    
    if (good) return 'text-green-600';
    if (medium) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics and system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={loadMetrics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {metrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* LCP */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    LCP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(metrics.webVitals.lcp, { good: 2500, poor: 4000 })}`}>
                    {Math.round(metrics.webVitals.lcp)}ms
                  </div>
                  <div className="text-xs text-muted-foreground">Largest Contentful Paint</div>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Memory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPercentageColor(metrics.systemMetrics.memoryUsage, true)}`}>
                    {Math.round(metrics.systemMetrics.memoryUsage)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Memory Usage</div>
                  <Progress value={metrics.systemMetrics.memoryUsage} className="mt-2" />
                </CardContent>
              </Card>

              {/* Database Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    DB Query
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(metrics.databaseMetrics.queryTime, { good: 50, poor: 100 })}`}>
                    {Math.round(metrics.databaseMetrics.queryTime)}ms
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Query Time</div>
                </CardContent>
              </Card>

              {/* Error Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPercentageColor(metrics.systemMetrics.errorRate, true)}`}>
                    {metrics.systemMetrics.errorRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Error Rate</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Status Alerts */}
          {metrics && (
            <div className="space-y-2">
              {metrics.webVitals.lcp > 4000 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Poor LCP detected: {Math.round(metrics.webVitals.lcp)}ms (target: &lt;2.5s)
                  </AlertDescription>
                </Alert>
              )}
              
              {metrics.systemMetrics.memoryUsage > 90 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High memory usage: {Math.round(metrics.systemMetrics.memoryUsage)}%
                  </AlertDescription>
                </Alert>
              )}
              
              {metrics.databaseMetrics.slowQueries > 3 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {metrics.databaseMetrics.slowQueries} slow queries detected
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="web-vitals" className="space-y-4">
          <PerformanceValidationDashboard />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {metrics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm font-medium">{Math.round(metrics.systemMetrics.cpuUsage)}%</span>
                    </div>
                    <Progress value={metrics.systemMetrics.cpuUsage} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm font-medium">{Math.round(metrics.systemMetrics.memoryUsage)}%</span>
                    </div>
                    <Progress value={metrics.systemMetrics.memoryUsage} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-medium">{Math.round(metrics.systemMetrics.responseTime)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Response Time</span>
                      <Badge variant="outline">{Math.round(metrics.systemMetrics.responseTime)}ms</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant={metrics.systemMetrics.errorRate > 1 ? 'destructive' : 'outline'}>
                        {metrics.systemMetrics.errorRate.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Uptime</span>
                      <Badge variant="outline">99.9%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          {metrics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Query Time</span>
                    <Badge variant="outline">{Math.round(metrics.databaseMetrics.queryTime)}ms</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="outline">{Math.round(metrics.databaseMetrics.connectionCount)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slow Queries</span>
                    <Badge variant={metrics.databaseMetrics.slowQueries > 3 ? 'destructive' : 'outline'}>
                      {metrics.databaseMetrics.slowQueries}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Hit Rate</span>
                    <Badge variant="outline">{Math.round(metrics.databaseMetrics.cacheHitRate)}%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <PerformanceValidationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
