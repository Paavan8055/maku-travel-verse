/**
 * Agentic System Dashboard
 * Comprehensive monitoring and control interface for the enhanced agent system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Cpu, 
  Database, 
  Network, 
  Shield, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Settings,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useEnhancedAgentSystem, AgentSystemConfig, SystemMetrics } from '@/hooks/useEnhancedAgentSystem';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface AgenticSystemDashboardProps {
  config?: Partial<AgentSystemConfig>;
}

export const AgenticSystemDashboard: React.FC<AgenticSystemDashboardProps> = ({
  config: propConfig
}) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const defaultConfig: AgentSystemConfig = {
    userId: user?.id || 'demo-user',
    systemLevel: 'advanced',
    safetyLevel: 'standard',
    learningEnabled: true,
    crossAgentMemory: true,
    ...propConfig
  };

  const {
    promptEngine,
    memorySystem,
    coordinationSystem,
    reasoningSystem,
    isInitialized,
    isProcessing,
    systemHealth,
    metrics,
    getSystemMetrics,
    refreshSystems,
    resetSystem,
    exportKnowledge,
    importKnowledge,
    optimizePerformance
  } = useEnhancedAgentSystem(defaultConfig);

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;

    const interval = setInterval(async () => {
      await getSystemMetrics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isInitialized, getSystemMetrics]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleExportKnowledge = async () => {
    try {
      const knowledge = await exportKnowledge();
      const blob = new Blob([JSON.stringify(knowledge, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-knowledge-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportKnowledge = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const knowledge = JSON.parse(text);
      await importKnowledge(knowledge);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  if (!isInitialized) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Initializing Enhanced Agent System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <div className="space-y-2">
              <p>Loading advanced agentic patterns...</p>
              <Progress value={75} className="w-[300px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Enhanced Agent System
              </CardTitle>
              <CardDescription>
                Advanced agentic design patterns with reasoning, memory, and coordination
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={systemHealth === 'healthy' ? 'default' : 'destructive'}
                className={`flex items-center gap-1 ${getHealthColor(systemHealth)}`}
              >
                {getHealthIcon(systemHealth)}
                {systemHealth.toUpperCase()}
              </Badge>
              {isProcessing && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Processing
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Health Alert */}
      {systemHealth !== 'healthy' && (
        <Alert variant={systemHealth === 'critical' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {systemHealth === 'critical' 
              ? 'Critical system issues detected. Some functionality may be unavailable.'
              : 'System performance is degraded. Consider running optimization.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* System Components */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">System Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Prompt Engine</span>
                  <CheckCircle className={`h-4 w-4 ${promptEngine ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory System</span>
                  <CheckCircle className={`h-4 w-4 ${memorySystem ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Coordination</span>
                  <CheckCircle className={`h-4 w-4 ${coordinationSystem ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reasoning</span>
                  <CheckCircle className={`h-4 w-4 ${reasoningSystem ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            {metrics && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-medium">{(metrics.performance.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.performance.successRate * 100} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avg Response: {metrics.performance.averageResponseTime}ms</span>
                      <span>Utilization: {(metrics.performance.resourceUtilization * 100).toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Accuracy</span>
                      <span className="text-sm font-medium">{(metrics.quality.accuracyScore * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.quality.accuracyScore * 100} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Consistency: {(metrics.quality.consistencyScore * 100).toFixed(0)}%</span>
                      <span>Satisfaction: {(metrics.quality.userSatisfaction * 100).toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Safety & Learning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Compliance</span>
                      <span className="text-sm font-medium">{(metrics.safety.complianceScore * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.safety.complianceScore * 100} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Knowledge Growth: {(metrics.learning.knowledgeGrowth * 100).toFixed(0)}%</span>
                      <span>Violations: {metrics.safety.violationCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Response Time</span>
                      <span>{metrics.performance.averageResponseTime}ms</span>
                    </div>
                    <Progress value={Math.min(100, (300 - metrics.performance.averageResponseTime) / 3)} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span>{(metrics.performance.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.performance.successRate * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Resource Utilization</span>
                      <span>{(metrics.performance.resourceUtilization * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.performance.resourceUtilization * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy Score</span>
                      <span>{(metrics.quality.accuracyScore * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.quality.accuracyScore * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Consistency Score</span>
                      <span>{(metrics.quality.consistencyScore * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.quality.consistencyScore * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User Satisfaction</span>
                      <span>{(metrics.quality.userSatisfaction * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.quality.userSatisfaction * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Memory System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(metrics.learning.memoryEfficiency * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Memory Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(metrics.learning.knowledgeGrowth * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Knowledge Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(metrics.learning.patternRecognition * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Pattern Recognition</div>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                The memory system stores episodic, semantic, and procedural knowledge with automatic consolidation and cross-agent sharing capabilities.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coordination Tab */}
        <TabsContent value="coordination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Multi-Agent Coordination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Advanced coordination patterns with conflict resolution, resource optimization, and human-in-the-loop escalation.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reasoning Tab */}
        <TabsContent value="reasoning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Enhanced Reasoning System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Multi-step logical reasoning with causal analysis, counterfactual thinking, and abstract pattern recognition.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">System Control</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={refreshSystems} 
                      disabled={isProcessing}
                      className="w-full"
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Systems
                    </Button>
                    <Button 
                      onClick={optimizePerformance} 
                      disabled={isProcessing}
                      className="w-full"
                      variant="outline"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Optimize Performance
                    </Button>
                    <Button 
                      onClick={resetSystem} 
                      disabled={isProcessing}
                      className="w-full"
                      variant="destructive"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reset System
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Knowledge Management</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={handleExportKnowledge} 
                      disabled={isProcessing}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Knowledge
                    </Button>
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportKnowledge}
                        style={{ display: 'none' }}
                        id="import-knowledge"
                      />
                      <Button 
                        onClick={() => document.getElementById('import-knowledge')?.click()}
                        disabled={isProcessing}
                        className="w-full"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Knowledge
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Auto-refresh Settings</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-refresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="auto-refresh" className="text-sm">
                    Auto-refresh metrics every 30 seconds
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};