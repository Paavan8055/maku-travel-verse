import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAgentTaskIntegration } from '@/hooks/useAgentTaskIntegration';
import { useRealTimeBotData } from '@/hooks/useRealTimeBotData';
import { 
  Bot, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  BarChart3,
  Settings
} from 'lucide-react';

interface BotConnectorHubProps {
  dashboardType: 'user' | 'partner' | 'admin';
  userId?: string;
}

// Simulated GPT Bot Types for demonstration
const GPT_BOT_TYPES = [
  { id: 'travel-planner', name: 'Travel Planner', category: 'planning' },
  { id: 'price-monitor', name: 'Price Monitor', category: 'monitoring' },
  { id: 'booking-assistant', name: 'Booking Assistant', category: 'assistance' },
  { id: 'recommendation-engine', name: 'Recommendation Engine', category: 'analytics' },
  { id: 'customer-support', name: 'Customer Support', category: 'support' },
  { id: 'fraud-detector', name: 'Fraud Detector', category: 'security' },
  { id: 'sentiment-analyzer', name: 'Sentiment Analyzer', category: 'analytics' },
  { id: 'review-processor', name: 'Review Processor', category: 'processing' }
];

export const BotConnectorHub: React.FC<BotConnectorHubProps> = ({ 
  dashboardType, 
  userId 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  
  const {
    storeGPTResult,
    storeAgenticResult,
    botResults,
    getHighPriorityResults,
    getRecentResults,
    isLoading
  } = useAgentTaskIntegration();

  const {
    metrics,
    performance,
    isConnected,
    getBotHealth,
    getTrendingBots,
    getActiveAlerts,
    refreshData
  } = useRealTimeBotData(dashboardType, userId);

  // Simulate GPT bot execution for testing
  const simulateGPTBotExecution = async (botType: string) => {
    try {
      const mockResult = {
        bot_type: botType,
        output_data: {
          recommendations: [`Sample recommendation from ${botType}`],
          insights: [`Key insight from ${botType}`],
          actions: [`Suggested action from ${botType}`],
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
          timestamp: new Date().toISOString()
        },
        actionability_rating: (['low', 'medium', 'high', 'critical'] as const)[
          Math.floor(Math.random() * 4)
        ],
        confidence_score: Math.random() * 0.3 + 0.7,
        result_type: 'gpt_analysis',
        user_id: userId,
        session_id: `session_${Date.now()}`,
        correlation_id: `corr_${Date.now()}`,
        metadata: {
          execution_time_ms: Math.floor(Math.random() * 2000) + 500,
          model_version: 'gpt-5-2025-08-07',
          tokens_used: Math.floor(Math.random() * 1000) + 100
        }
      };

      await storeGPTResult(mockResult);
      console.log(`Simulated ${botType} execution completed`);
    } catch (error) {
      console.error(`Failed to simulate ${botType} execution:`, error);
    }
  };

  // Simulate agentic task execution
  const simulateAgenticExecution = async (agentId: string) => {
    try {
      const mockTask = {
        agent_id: agentId,
        intent: `sample_task_${agentId}`,
        status: 'completed',
        result: {
          success: true,
          data: `Result from agent ${agentId}`,
          metrics: {
            processing_time: Math.floor(Math.random() * 5000) + 1000,
            accuracy: Math.random() * 0.2 + 0.8
          }
        },
        user_id: userId,
        session_id: `agent_session_${Date.now()}`,
        params: {
          mode: 'test',
          priority: 'normal'
        }
      };

      await storeAgenticResult(mockTask);
      console.log(`Simulated agent ${agentId} execution completed`);
    } catch (error) {
      console.error(`Failed to simulate agent ${agentId} execution:`, error);
    }
  };

  const alerts = getActiveAlerts();
  const trendingBots = getTrendingBots();
  const highPriorityResults = getHighPriorityResults();
  const recentResults = getRecentResults(1);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Connector Hub
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage and monitor all AI bots and agents across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metrics.active_bots}</div>
              <div className="text-sm text-muted-foreground">Active Bots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.total_results_today}</div>
              <div className="text-sm text-muted-foreground">Results Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.high_priority_alerts}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.success_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={refreshData} size="sm" disabled={isLoading}>
              <Activity className="h-4 w-4 mr-1" />
              Refresh Data
            </Button>
            <Button 
              onClick={() => simulateGPTBotExecution('travel-planner')} 
              size="sm" 
              variant="outline"
              disabled={isLoading}
            >
              <Zap className="h-4 w-4 mr-1" />
              Test GPT Bot
            </Button>
            <Button 
              onClick={() => simulateAgenticExecution('test-agent')} 
              size="sm" 
              variant="outline"
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-1" />
              Test Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gpt-bots">GPT Bots</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentResults.length > 0 ? (
                    recentResults.slice(0, 5).map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <div className="font-medium text-sm">{result.bot_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(result.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge variant={
                          result.actionability_rating === 'critical' ? 'destructive' :
                          result.actionability_rating === 'high' ? 'default' :
                          'secondary'
                        }>
                          {result.actionability_rating}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trending Bots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Performing Bots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendingBots.slice(0, 5).map((bot) => (
                    <div key={bot.bot_type} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <div className="font-medium text-sm">{bot.bot_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {bot.total_executions} executions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {bot.success_rate.toFixed(1)}%
                        </div>
                        <Badge variant={getBotHealth(bot.bot_type) === 'excellent' ? 'default' : 'secondary'}>
                          {getBotHealth(bot.bot_type)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gpt-bots">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GPT_BOT_TYPES.map((bot) => {
              const botPerf = performance.find(p => p.bot_type === bot.id);
              const health = getBotHealth(bot.id);
              
              return (
                <Card key={bot.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <CardDescription className="capitalize">{bot.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Status</span>
                        <Badge variant={health === 'excellent' ? 'default' : 'secondary'}>
                          {health}
                        </Badge>
                      </div>
                      
                      {botPerf && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Success Rate</span>
                            <span className="text-sm font-medium">
                              {botPerf.success_rate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={botPerf.success_rate} className="h-2" />
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Executions</span>
                            <span className="text-sm font-medium">{botPerf.total_executions}</span>
                          </div>
                        </>
                      )}
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => simulateGPTBotExecution(bot.id)}
                        disabled={isLoading}
                      >
                        Execute Bot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agentic Task Management</CardTitle>
              <CardDescription>
                Monitor and control autonomous agents across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => simulateAgenticExecution('booking-agent')}
                    disabled={isLoading}
                  >
                    Test Booking Agent
                  </Button>
                  <Button 
                    onClick={() => simulateAgenticExecution('analytics-agent')}
                    disabled={isLoading}
                  >
                    Test Analytics Agent
                  </Button>
                  <Button 
                    onClick={() => simulateAgenticExecution('support-agent')}
                    disabled={isLoading}
                  >
                    Test Support Agent
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground mt-4">
                  Agents will automatically store their results in the aggregation system.
                  Monitor their performance in the Performance tab.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Bot Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.map((bot) => (
                    <div key={bot.bot_type} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{bot.bot_type}</h4>
                          <p className="text-sm text-muted-foreground">
                            Last execution: {new Date(bot.last_execution).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={getBotHealth(bot.bot_type) === 'excellent' ? 'default' : 'secondary'}>
                          {getBotHealth(bot.bot_type)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Executions</div>
                          <div className="font-medium">{bot.total_executions}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Success Rate</div>
                          <div className="font-medium">{bot.success_rate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Confidence</div>
                          <div className="font-medium">{bot.average_confidence.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Errors</div>
                          <div className="font-medium">{bot.error_count}</div>
                        </div>
                      </div>
                      
                      <Progress value={bot.success_rate} className="mt-2 h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            Type: {alert.type.replace('_', ' ')}
                          </div>
                        </div>
                        <Badge variant={
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <div>No active alerts</div>
                    <div className="text-sm">All systems operating normally</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};