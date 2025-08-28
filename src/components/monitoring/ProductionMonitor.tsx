import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  MonitorSpeaker
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ProductionMetrics {
  systemHealth: SystemHealth;
  performance: PerformanceMetrics;
  infrastructure: InfrastructureMetrics;
  businessMetrics: BusinessMetrics;
  alerts: ProductionAlert[];
  timeSeriesData: TimeSeriesData[];
}

interface SystemHealth {
  uptime: number;
  errorRate: number;
  responseTime: number;
  throughput: number;
  status: 'healthy' | 'degraded' | 'critical';
}

interface PerformanceMetrics {
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  loadTimes: {
    homepage: number;
    search: number;
    booking: number;
  };
}

interface InfrastructureMetrics {
  serverHealth: ServerHealth[];
  databaseHealth: DatabaseHealth;
  cdnPerformance: CDNMetrics;
  edgeFunctions: EdgeFunctionMetrics;
}

interface ServerHealth {
  name: string;
  region: string;
  status: 'online' | 'offline' | 'maintenance';
  cpu: number;
  memory: number;
  disk: number;
  connections: number;
}

interface DatabaseHealth {
  connectionPool: number;
  queryPerformance: number;
  slowQueries: number;
  replicationLag: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface CDNMetrics {
  hitRatio: number;
  bandwidth: number;
  requests: number;
  globalLatency: number;
}

interface EdgeFunctionMetrics {
  totalInvocations: number;
  averageExecutionTime: number;
  errorRate: number;
  coldStarts: number;
}

interface BusinessMetrics {
  bookingConversion: number;
  revenuePerHour: number;
  userSatisfaction: number;
  supportTickets: number;
}

interface ProductionAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface TimeSeriesData {
  timestamp: string;
  responseTime: number;
  errorRate: number;
  throughput: number;
  cpu: number;
  memory: number;
}

export const ProductionMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h');

  useEffect(() => {
    fetchProductionMetrics();
    const interval = setInterval(fetchProductionMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const fetchProductionMetrics = async () => {
    try {
      // Generate realistic production metrics
      const mockMetrics: ProductionMetrics = {
        systemHealth: {
          uptime: 99.95,
          errorRate: 0.12,
          responseTime: 245,
          throughput: 1250,
          status: 'healthy'
        },
        performance: {
          coreWebVitals: {
            lcp: 1.8,
            fid: 85,
            cls: 0.08
          },
          lighthouse: {
            performance: 94,
            accessibility: 97,
            bestPractices: 92,
            seo: 98
          },
          loadTimes: {
            homepage: 1.2,
            search: 2.1,
            booking: 1.8
          }
        },
        infrastructure: {
          serverHealth: [
            {
              name: 'web-01',
              region: 'ap-southeast-2',
              status: 'online',
              cpu: 65,
              memory: 78,
              disk: 45,
              connections: 234
            },
            {
              name: 'web-02',
              region: 'us-east-1',
              status: 'online',
              cpu: 72,
              memory: 68,
              disk: 52,
              connections: 189
            },
            {
              name: 'web-03',
              region: 'eu-west-1',
              status: 'maintenance',
              cpu: 0,
              memory: 0,
              disk: 0,
              connections: 0
            }
          ],
          databaseHealth: {
            connectionPool: 85,
            queryPerformance: 98.5,
            slowQueries: 3,
            replicationLag: 50,
            status: 'healthy'
          },
          cdnPerformance: {
            hitRatio: 94.2,
            bandwidth: 125.8,
            requests: 45678,
            globalLatency: 89
          },
          edgeFunctions: {
            totalInvocations: 12456,
            averageExecutionTime: 125,
            errorRate: 0.08,
            coldStarts: 23
          }
        },
        businessMetrics: {
          bookingConversion: 3.2,
          revenuePerHour: 8750,
          userSatisfaction: 4.6,
          supportTickets: 7
        },
        alerts: generateMockAlerts(),
        timeSeriesData: generateTimeSeriesData()
      };
      
      setMetrics(mockMetrics);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch production metrics:', error);
    }
  };

  const generateMockAlerts = (): ProductionAlert[] => {
    return [
      {
        id: '1',
        severity: 'warning',
        component: 'CDN',
        message: 'Cache hit ratio below threshold in EU region',
        timestamp: new Date(),
        acknowledged: false
      },
      {
        id: '2',
        severity: 'info',
        component: 'Edge Functions',
        message: 'Scheduled maintenance completed successfully',
        timestamp: new Date(Date.now() - 3600000),
        acknowledged: true
      }
    ];
  };

  const generateTimeSeriesData = (): TimeSeriesData[] => {
    const now = new Date();
    const data = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000); // 15-minute intervals
      data.push({
        timestamp: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseTime: 200 + Math.random() * 100,
        errorRate: Math.random() * 0.5,
        throughput: 1000 + Math.random() * 500,
        cpu: 50 + Math.random() * 30,
        memory: 60 + Math.random() * 25
      });
    }
    
    return data;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getServerStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading || !metrics) {
    return <div className="flex items-center justify-center h-96">Loading production metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Status Overview */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Monitor</h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge className={getHealthStatusColor(metrics.systemHealth.status)}>
              {metrics.systemHealth.status.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Uptime: {metrics.systemHealth.uptime}%
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {['1h', '6h', '24h', '7d'].map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeRange(range as any)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics.alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <div className="space-y-2">
          {metrics.alerts
            .filter(alert => !alert.acknowledged)
            .map((alert) => (
              <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span><strong>{alert.component}:</strong> {alert.message}</span>
                    <Button size="sm" variant="outline">
                      Acknowledge
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemHealth.responseTime}ms</div>
            <Progress value={100 - (metrics.systemHealth.responseTime / 10)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Target: &lt;300ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemHealth.errorRate}%</div>
            <Progress value={100 - (metrics.systemHealth.errorRate * 20)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Target: &lt;0.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemHealth.throughput.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">requests/minute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lighthouse Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.performance.lighthouse.performance}</div>
            <Progress value={metrics.performance.lighthouse.performance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Performance Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="throughput" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Server Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.infrastructure.serverHealth.map((server) => (
              <div key={server.name} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getServerStatusColor(server.status)}`} />
                    <span className="font-medium">{server.name}</span>
                    <Badge variant="outline">{server.region}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{server.connections} connections</span>
                </div>
                
                {server.status === 'online' && (
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">CPU</p>
                      <Progress value={server.cpu} className="mt-1" />
                      <p className="text-xs mt-1">{server.cpu}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Memory</p>
                      <Progress value={server.memory} className="mt-1" />
                      <p className="text-xs mt-1">{server.memory}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Disk</p>
                      <Progress value={server.disk} className="mt-1" />
                      <p className="text-xs mt-1">{server.disk}%</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database & CDN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Database Health</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Connection Pool</p>
                  <Progress value={metrics.infrastructure.databaseHealth.connectionPool} className="mt-1" />
                  <p className="text-xs mt-1">{metrics.infrastructure.databaseHealth.connectionPool}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Query Performance</p>
                  <Progress value={metrics.infrastructure.databaseHealth.queryPerformance} className="mt-1" />
                  <p className="text-xs mt-1">{metrics.infrastructure.databaseHealth.queryPerformance}%</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span>Slow Queries: {metrics.infrastructure.databaseHealth.slowQueries}</span>
                <span>Replication Lag: {metrics.infrastructure.databaseHealth.replicationLag}ms</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">CDN Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hit Ratio</p>
                  <Progress value={metrics.infrastructure.cdnPerformance.hitRatio} className="mt-1" />
                  <p className="text-xs mt-1">{metrics.infrastructure.cdnPerformance.hitRatio}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Global Latency</p>
                  <p className="text-lg font-semibold">{metrics.infrastructure.cdnPerformance.globalLatency}ms</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span>Bandwidth: {metrics.infrastructure.cdnPerformance.bandwidth}GB</span>
                <span>Requests: {metrics.infrastructure.cdnPerformance.requests.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Business Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{metrics.businessMetrics.bookingConversion}%</p>
              <p className="text-sm text-muted-foreground">Booking Conversion</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${metrics.businessMetrics.revenuePerHour.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Revenue/Hour</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{metrics.businessMetrics.userSatisfaction}/5</p>
              <p className="text-sm text-muted-foreground">User Satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{metrics.businessMetrics.supportTickets}</p>
              <p className="text-sm text-muted-foreground">Support Tickets</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};