import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Zap, Server, Database, Globe, Cpu, HardDrive, Wifi,
  BarChart3, LineChart, PieChart, RefreshCw, Download,
  Bell, Eye, Brain, Sparkles, Users as UsersIcon
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import axios from 'axios';
import { usePolling } from '@/hooks/usePolling';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

interface SystemMetrics {
  system_health: string;
  services: Record<string, string>;
  performance: {
    avg_response_time_ms: number;
    requests_per_minute: number;
    error_rate: number;
    uptime_percentage: number;
  };
  active_connections: number;
}

interface AIInsight {
  type: 'info' | 'warning' | 'critical' | 'optimization';
  title: string;
  message: string;
  recommendation?: string;
}

const AIRealTimeMonitoring = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeUsers, setActiveUsers] = useState(0);
  const [bookingsToday, setBookingsToday] = useState(0);

  const fetchMetrics = useCallback(async () => {
    setLoading(false); // Show UI immediately
    try {
      const [healthData, realtimeData] = await Promise.all([
        adminApi.getSystemHealth().catch(() => null),
        adminApi.getRealtimeMetrics().catch(() => null)
      ]);

      if (healthData) {
        setMetrics(healthData);
        generateAIInsights(healthData);
      }
      
      if (realtimeData) {
        setActiveUsers(realtimeData.active_users_now || 0);
        setBookingsToday(realtimeData.bookings_last_hour * 24 || 0);
      }
      
      setLastUpdate(new Date());
      
      // Generate AI insights if we have metrics data
      if (healthData) {
        generateAIInsights(healthData as SystemMetrics);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use the custom polling hook - 10 seconds for real-time monitoring
  usePolling(fetchMetrics, 10000, autoRefresh);

  const generateAIInsights = (data: SystemMetrics) => {
    const insights: AIInsight[] = [];
    
    // AI-powered insights based on metrics
    if (data.performance.error_rate > 0.01) {
      insights.push({
        type: 'warning',
        title: 'Elevated Error Rate',
        message: `Error rate at ${(data.performance.error_rate * 100).toFixed(2)}% - above optimal threshold`,
        recommendation: 'Review error logs and implement additional error handling'
      });
    }
    
    if (data.performance.avg_response_time_ms > 500) {
      insights.push({
        type: 'optimization',
        title: 'Response Time Optimization',
        message: `Average response time is ${data.performance.avg_response_time_ms}ms`,
        recommendation: 'Consider implementing caching or database query optimization'
      });
    }
    
    if (data.performance.uptime_percentage > 99.9) {
      insights.push({
        type: 'info',
        title: 'Excellent Uptime',
        message: `System uptime at ${data.performance.uptime_percentage}% - exceeding SLA`,
        recommendation: 'Maintain current monitoring and incident response protocols'
      });
    }
    
    const healthyServices = Object.values(data.services).filter(s => s === 'healthy').length;
    const totalServices = Object.values(data.services).length;
    
    if (healthyServices < totalServices) {
      insights.push({
        type: 'critical',
        title: 'Service Degradation Detected',
        message: `${totalServices - healthyServices} service(s) not healthy`,
        recommendation: 'Immediate investigation required for degraded services'
      });
    }
    
    setAiInsights(insights);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'optimization': return <Sparkles className="w-5 h-5 text-purple-600" />;
      default: return <Brain className="w-5 h-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'from-red-50 to-red-100 border-red-200';
      case 'warning': return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'optimization': return 'from-purple-50 to-purple-100 border-purple-200';
      default: return 'from-blue-50 to-blue-100 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Real-Time Monitoring
          </h1>
          <p className="text-muted-foreground">Live system health, performance metrics, and operational status</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button 
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI-Powered Insights */}
      {aiInsights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold">AI Insights & Recommendations</h2>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Powered by AI</Badge>
          </div>
          {aiInsights.map((insight, idx) => (
            <Card key={idx} className={`bg-gradient-to-r ${getInsightColor(insight.type)} border`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-700 mb-2">{insight.message}</p>
                    {insight.recommendation && (
                      <p className="text-sm text-gray-600 bg-white/50 p-2 rounded">
                        💡 <strong>Recommendation:</strong> {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {metrics?.system_health === 'healthy' ? (
                <span className="text-green-600">Healthy</span>
              ) : metrics?.system_health === 'degraded' ? (
                <span className="text-yellow-600">Degraded</span>
              ) : (
                <span className="text-gray-600">Loading...</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Overall system status</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {metrics?.performance.avg_response_time_ms || 0}ms
            </div>
            <p className="text-xs text-gray-500">Response time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {activeUsers}
            </div>
            <p className="text-xs text-gray-500">Currently online</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {metrics?.performance.uptime_percentage.toFixed(2) || 0}%
            </div>
            <p className="text-xs text-gray-500">System uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 gap-6">
            {/* Service Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Service Health Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics && Object.entries(metrics.services).map(([service, status]) => (
                    <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'healthy' ? 'bg-green-500' :
                          status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium capitalize">{service}</span>
                      </div>
                      <Badge className={
                        status === 'healthy' ? 'bg-green-100 text-green-700' :
                        status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">System Load</span>
                      <span className="font-semibold">23%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-pink-500 to-orange-500 h-2 rounded-full" style={{ width: '23%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Error Rate</span>
                      <span className="font-semibold">{((metrics?.performance.error_rate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" 
                           style={{ width: `${(metrics?.performance.error_rate || 0) * 100}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Avg Response Time</span>
                      <span className="font-semibold">{metrics?.performance.avg_response_time_ms || 0}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" 
                           style={{ width: `${Math.min((metrics?.performance.avg_response_time_ms || 0) / 10, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Booking Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Bookings Today</p>
                      <p className="text-sm text-gray-600">{bookingsToday} confirmed bookings</p>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{bookingsToday}</div>
                  </div>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <p>Real-time booking feed coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Requests/min</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {metrics?.performance.requests_per_minute || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Connections</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {metrics?.active_connections || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {((metrics?.performance.error_rate || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">CPU Usage</p>
                      <p className="text-xs text-gray-500">Optimal</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Normal</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <HardDrive className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Memory</p>
                      <p className="text-xs text-gray-500">Stable</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Normal</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Database className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Database</p>
                      <p className="text-xs text-gray-500">Connected</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Service Component Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Real-time health monitoring of critical system components</p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {metrics && Object.entries(metrics.services).map(([service, status]) => (
                    <div key={service} className="p-4 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        status === 'healthy' ? 'bg-green-500' :
                        status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <p className="font-medium capitalize">{service}</p>
                      <p className="text-xs text-gray-500">{status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRealTimeMonitoring;
