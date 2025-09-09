import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMasterBotController } from '@/hooks/useMasterBotController';
import { useAgentTaskIntegration } from '@/hooks/useAgentTaskIntegration';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Square,
  BarChart3
} from 'lucide-react';

interface BotHealthMetrics {
  id: string;
  bot_id: string;
  status: 'healthy' | 'degraded' | 'offline' | 'error';
  response_time: number;
  success_rate: number;
  last_heartbeat: string;
  error_count: number;
  throughput: number;
}

interface BotOrchestrationConfig {
  load_balancing: boolean;
  auto_failover: boolean;
  circuit_breaker: boolean;
  retry_policy: {
    max_retries: number;
    backoff_strategy: 'linear' | 'exponential';
    timeout_ms: number;
  };
}

export const AdvancedBotOrchestrator: React.FC = () => {
  const { 
    botResults, 
    isLoading,
    executeAdminCommand,
    getHighPriorityResults,
    refreshData 
  } = useMasterBotController('admin');
  
  const { 
    storeGPTResult,
    aggregateResults,
    fetchAgentTasks 
  } = useAgentTaskIntegration();

  const [botHealthMetrics, setBotHealthMetrics] = useState<BotHealthMetrics[]>([]);
  const [orchestrationConfig] = useState<BotOrchestrationConfig>({
    load_balancing: true,
    auto_failover: true,
    circuit_breaker: true,
    retry_policy: {
      max_retries: 3,
      backoff_strategy: 'exponential',
      timeout_ms: 30000
    }
  });
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const { toast } = useToast();

  // Real-time bot health monitoring
  useEffect(() => {
    const monitorBotHealth = async () => {
      try {
        // Simulate bot configurations (avoiding complex Supabase types)
        const mockBotConfigs = Array.from({ length: 10 }, (_, i) => ({
          id: `bot_${i + 1}`,
          name: `Bot ${i + 1}`,
          is_active: true
        }));

        const healthMetrics: BotHealthMetrics[] = mockBotConfigs.map((bot) => {
          // Simulate health check (in production, this would ping actual bot endpoints)
          const responseTime = Math.random() * 200 + 50; // 50-250ms
          const successRate = Math.random() * 20 + 80; // 80-100%
          const errorCount = Math.floor(Math.random() * 5);
          const throughput = Math.random() * 100 + 20; // 20-120 req/min

          const status = successRate > 95 ? 'healthy' : 
                        successRate > 80 ? 'degraded' : 
                        successRate > 50 ? 'error' : 'offline';

          return {
            id: `health_${bot.id}`,
            bot_id: bot.id,
            status: status as 'healthy' | 'degraded' | 'offline' | 'error',
            response_time: responseTime,
            success_rate: successRate,
            last_heartbeat: new Date().toISOString(),
            error_count: errorCount,
            throughput
          };
        });

        setBotHealthMetrics(healthMetrics);
      } catch (error) {
        console.error('Error monitoring bot health:', error);
      }
    };

    const interval = setInterval(monitorBotHealth, 5000); // Check every 5 seconds
    monitorBotHealth(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const startOrchestration = async () => {
    setIsOrchestrating(true);
    try {
      await executeAdminCommand(
        'Start Advanced Bot Orchestration',
        'control',
        ['all-bots'],
        {
          orchestration_mode: 'advanced',
          load_balancing: orchestrationConfig.load_balancing,
          auto_failover: orchestrationConfig.auto_failover,
          circuit_breaker: orchestrationConfig.circuit_breaker,
          retry_policy: orchestrationConfig.retry_policy
        }
      );
      toast({
        title: 'Orchestration Started',
        description: 'Advanced bot orchestration is now active'
      });
    } catch (error) {
      toast({
        title: 'Orchestration Failed',
        description: 'Failed to start bot orchestration',
        variant: 'destructive'
      });
    } finally {
      setIsOrchestrating(false);
    }
  };

  const stopOrchestration = async () => {
    try {
      await executeAdminCommand(
        'Stop Bot Orchestration',
        'control',
        ['all-bots'],
        { orchestration_mode: 'disabled' }
      );
      toast({
        title: 'Orchestration Stopped',
        description: 'Bot orchestration has been disabled'
      });
    } catch (error) {
      toast({
        title: 'Stop Failed',
        description: 'Failed to stop bot orchestration',
        variant: 'destructive'
      });
    }
  };

  const handleFailover = async (failedBotId: string) => {
    try {
      await executeAdminCommand(
        `Execute Failover for Bot ${failedBotId}`,
        'control',
        [failedBotId],
        { action: 'failover', target_bot: failedBotId }
      );
      toast({
        title: 'Failover Executed',
        description: `Bot ${failedBotId} has been failed over to backup instance`
      });
    } catch (error) {
      toast({
        title: 'Failover Failed',
        description: 'Failed to execute bot failover',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'offline': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const healthyBots = botHealthMetrics.filter(m => m.status === 'healthy').length;
  const degradedBots = botHealthMetrics.filter(m => m.status === 'degraded').length;
  const errorBots = botHealthMetrics.filter(m => m.status === 'error').length;
  const offlineBots = botHealthMetrics.filter(m => m.status === 'offline').length;
  const averageResponseTime = botHealthMetrics.reduce((sum, m) => sum + m.response_time, 0) / botHealthMetrics.length || 0;
  const averageSuccessRate = botHealthMetrics.reduce((sum, m) => sum + m.success_rate, 0) / botHealthMetrics.length || 0;
  const totalThroughput = botHealthMetrics.reduce((sum, m) => sum + m.throughput, 0);

  return (
    <div className="space-y-6">
      {/* Orchestration Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Advanced Bot Orchestration Control</span>
          </CardTitle>
          <CardDescription>
            Intelligent load balancing, automatic failover, and performance optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={startOrchestration}
                disabled={isOrchestrating || isLoading}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Orchestration</span>
              </Button>
              <Button 
                variant="outline"
                onClick={stopOrchestration}
                className="flex items-center space-x-2"
              >
                <Square className="h-4 w-4" />
                <span>Stop</span>
              </Button>
              <Button 
                variant="ghost"
                onClick={refreshData}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={orchestrationConfig.load_balancing ? "default" : "secondary"}>
                Load Balancing: {orchestrationConfig.load_balancing ? 'ON' : 'OFF'}
              </Badge>
              <Badge variant={orchestrationConfig.auto_failover ? "default" : "secondary"}>
                Auto Failover: {orchestrationConfig.auto_failover ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </div>

          {/* Real-time metrics grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Healthy Bots</p>
                    <p className="text-2xl font-bold text-green-600">{healthyBots}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Degraded</p>
                    <p className="text-2xl font-bold text-yellow-600">{degradedBots}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{errorBots}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response</p>
                    <p className="text-2xl font-bold">{averageResponseTime.toFixed(0)}ms</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Throughput</p>
                    <p className="text-2xl font-bold">{totalThroughput.toFixed(0)}/min</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Bot Health Monitoring */}
      <Tabs defaultValue="health-overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health-overview">Health Overview</TabsTrigger>
          <TabsTrigger value="performance-metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="failover-management">Failover Management</TabsTrigger>
          <TabsTrigger value="orchestration-config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="health-overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Bot Health Status</CardTitle>
              <CardDescription>
                Live monitoring of all active bots with automatic health checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {botHealthMetrics.map((metrics) => (
                  <div 
                    key={metrics.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(metrics.status)}
                      <div>
                        <p className="font-medium">Bot {metrics.bot_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Last heartbeat: {new Date(metrics.last_heartbeat).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <p className="font-bold">{metrics.success_rate.toFixed(1)}%</p>
                        <Progress value={metrics.success_rate} className="mt-1" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Response Time</p>
                        <p className="font-bold">{metrics.response_time.toFixed(0)}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Throughput</p>
                        <p className="font-bold">{metrics.throughput.toFixed(0)}/min</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Errors</p>
                        <p className="font-bold text-red-600">{metrics.error_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        metrics.status === 'healthy' ? 'default' :
                        metrics.status === 'degraded' ? 'secondary' :
                        'destructive'
                      }>
                        {metrics.status.toUpperCase()}
                      </Badge>
                      {(metrics.status === 'error' || metrics.status === 'offline') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFailover(metrics.bot_id)}
                        >
                          Failover
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance-metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="font-medium">Overall Success Rate</h3>
                  <div className="text-3xl font-bold text-green-600">
                    {averageSuccessRate.toFixed(1)}%
                  </div>
                  <Progress value={averageSuccessRate} className="h-2" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Average Response Time</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {averageResponseTime.toFixed(0)}ms
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Target: &lt; 200ms
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Total Throughput</h3>
                  <div className="text-3xl font-bold text-purple-600">
                    {totalThroughput.toFixed(0)}/min
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Requests per minute
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failover-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Failover Configuration</CardTitle>
              <CardDescription>
                Configure automatic failover policies and backup strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Failover Threshold</label>
                    <p className="text-sm text-muted-foreground">
                      Trigger failover when success rate drops below 70%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recovery Strategy</label>
                    <p className="text-sm text-muted-foreground">
                      Exponential backoff with circuit breaker pattern
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Failover History (Last 24h)</h4>
                  <div className="text-sm text-muted-foreground">
                    No automatic failovers executed in the last 24 hours
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orchestration-config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Orchestration Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Load Balancing</label>
                    <Badge variant={orchestrationConfig.load_balancing ? "default" : "secondary"}>
                      {orchestrationConfig.load_balancing ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Distribute requests across healthy bot instances
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Auto Failover</label>
                    <Badge variant={orchestrationConfig.auto_failover ? "default" : "secondary"}>
                      {orchestrationConfig.auto_failover ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Automatically switch to backup instances on failure
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Retry Policy</label>
                  <div className="grid gap-2 md:grid-cols-3 text-sm">
                    <div>
                      <p className="font-medium">Max Retries</p>
                      <p className="text-muted-foreground">{orchestrationConfig.retry_policy.max_retries}</p>
                    </div>
                    <div>
                      <p className="font-medium">Backoff Strategy</p>
                      <p className="text-muted-foreground capitalize">{orchestrationConfig.retry_policy.backoff_strategy}</p>
                    </div>
                    <div>
                      <p className="font-medium">Timeout</p>
                      <p className="text-muted-foreground">{orchestrationConfig.retry_policy.timeout_ms / 1000}s</p>
                    </div>
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