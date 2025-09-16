import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProductionOptimizations } from '@/hooks/useProductionOptimizations';
import ProductionErrorBoundary from '@/components/error/ProductionErrorBoundary';
import { secureLogger } from '@/utils/secureLogger';

interface AgentMetricsData {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  avgCompletionTime: number;
  successRate: number;
  tasksByAgent: Record<string, number>;
  tasksByStatus: Record<string, number>;
  recentTasks: Array<{
    id: string;
    agent_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    progress: number;
  }>;
}

const AgentMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<AgentMetricsData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [issueResolutionMetrics, setIssueResolutionMetrics] = useState<any>(null);
  const [predictiveAlerts, setPredictiveAlerts] = useState<any[]>([]);
  const { usePaginatedData, useOptimizedSubscription, trackPerformance, metrics: perfMetrics } = useProductionOptimizations();
  
  const {
    data: paginatedTasks,
    loading,
    error,
    totalCount,
    totalPages,
    refetch
  } = usePaginatedData('agentic_tasks', {
    page: currentPage,
    limit: 10,
    orderBy: { column: 'created_at', ascending: false },
    cacheTtl: 60000 // Cache for 1 minute
  });

  useEffect(() => {
    fetchMetrics();
    fetchIssueResolutionMetrics();
    fetchPredictiveAlerts();
  }, [paginatedTasks]);

  // Optimized real-time subscription with debouncing
  useOptimizedSubscription('agentic_tasks', () => {
    refetch();
    fetchMetrics();
  }, 2000);

  const fetchMetrics = async () => {
    const startTime = Date.now();
    try {
      
      // Fetch all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('agentic_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      if (!tasks) {
        setMetrics({
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          runningTasks: 0,
          avgCompletionTime: 0,
          successRate: 0,
          tasksByAgent: {},
          tasksByStatus: {},
          recentTasks: []
        });
        return;
      }

      // Calculate metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const failedTasks = tasks.filter(t => t.status === 'failed').length;
      const runningTasks = tasks.filter(t => t.status === 'running' || t.status === 'pending').length;
      
      // Calculate average completion time for completed tasks
      const completedTasksWithTimes = tasks.filter(t => 
        t.status === 'completed' && t.created_at && t.updated_at
      );
      
      const avgCompletionTime = completedTasksWithTimes.length > 0
        ? completedTasksWithTimes.reduce((sum, task) => {
            const start = new Date(task.created_at).getTime();
            const end = new Date(task.updated_at).getTime();
            return sum + (end - start);
          }, 0) / completedTasksWithTimes.length / 1000 // Convert to seconds
        : 0;

      const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Group by agent
      const tasksByAgent = tasks.reduce((acc, task) => {
        acc[task.agent_id] = (acc[task.agent_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by status
      const tasksByStatus = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Recent tasks (last 10)
      const recentTasks = tasks.slice(0, 10);

      setMetrics({
        totalTasks,
        completedTasks,
        failedTasks,
        runningTasks,
        avgCompletionTime,
        successRate,
        tasksByAgent,
        tasksByStatus,
        recentTasks
      });

    } catch (err) {
      secureLogger.error('Error fetching metrics', err as Error, {
        component: 'AgentMetrics',
        operation: 'fetchMetrics'
      });
    } finally {
      trackPerformance('fetchMetrics', startTime);
    }
  };

  const fetchIssueResolutionMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-metrics', {
        body: { action: 'get_issue_resolution_metrics' }
      });
      
      if (error) throw error;
      setIssueResolutionMetrics(data);
    } catch (err) {
      secureLogger.error('Failed to fetch issue resolution metrics', err as Error);
    }
  };

  const fetchPredictiveAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-metrics', {
        body: { action: 'get_predictive_alerts' }
      });
      
      if (error) throw error;
      setPredictiveAlerts(data || []);
    } catch (err) {
      secureLogger.error('Failed to fetch predictive alerts', err as Error);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'running': return <Activity className="h-4 w-4 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <ProductionErrorBoundary>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              {error || 'Failed to load metrics'}
              <Button onClick={refetch} className="ml-4" variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </ProductionErrorBoundary>
    );
  }

  return (
    <ProductionErrorBoundary>
      <div className="space-y-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              System Performance
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cache Hit Rate</p>
                <p className="font-bold text-green-600">
                  {perfMetrics.totalRequests > 0 
                    ? ((perfMetrics.cacheHits / perfMetrics.totalRequests) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Response Time</p>
                <p className="font-bold">{perfMetrics.avgResponseTime.toFixed(0)}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Requests</p>
                <p className="font-bold">{perfMetrics.totalRequests}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cache Size</p>
                <p className="font-bold">{perfMetrics.totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{metrics.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">{formatDuration(metrics.avgCompletionTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">{metrics.runningTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="agents">By Agent</TabsTrigger>
          <TabsTrigger value="recent">Recent Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.tasksByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                      </span>
                      <span className="capitalize font-medium">{status}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(metrics.tasksByAgent)
                  .sort(([,a], [,b]) => b - a)
                  .map(([agentId, count]) => (
                    <div key={agentId} className="flex items-center justify-between">
                      <span className="font-medium">{agentId}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / metrics.totalTasks) * 100}%` }}
                          />
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: {totalCount} tasks
                  </div>
                </div>
                {paginatedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                      </span>
                      <div>
                        <p className="font-medium">{task.agent_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(task.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      {task.status === 'running' && (
                        <Badge variant="secondary">{task.progress}%</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </ProductionErrorBoundary>
  );
};

export default AgentMetrics;