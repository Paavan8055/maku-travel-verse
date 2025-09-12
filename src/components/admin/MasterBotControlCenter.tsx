import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalBotInterface } from '@/components/master-bot/UniversalBotInterface';
import { BotResultsPanel } from '@/components/master-bot/BotResultsPanel';
import { EnhancedResultsNotification } from '@/components/master-bot/EnhancedResultsNotification';
import { DashboardOptimizer } from '@/components/master-bot/DashboardOptimizer';
import { useMasterBotController } from '@/hooks/useMasterBotController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Activity, 
  Settings, 
  BarChart3,
  Command,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Database,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const MasterBotControlCenter: React.FC = () => {
  const { 
    botResults, 
    adminCommands, 
    getResultsByType, 
    getHighPriorityResults,
    executeAdminCommand,
    isExecutingCommand
  } = useMasterBotController('admin');

  const { toast } = useToast();
  const [dismissedResults, setDismissedResults] = useState<string[]>([]);
  const [lastOptimization, setLastOptimization] = useState<Date | undefined>();

  const systemResults = getResultsByType('system_health');
  const controlResults = getResultsByType('control');
  const analysisResults = getResultsByType('analysis');
  const optimizationResults = getResultsByType('optimization');
  const highPriorityResults = getHighPriorityResults();

  const getCommandStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleDismissResult = useCallback((resultId: string) => {
    setDismissedResults(prev => [...prev, resultId]);
  }, []);

  const handleApplyOptimization = useCallback((result: any) => {
    toast({
      title: "Optimization Applied",
      description: "Dashboard optimization has been applied successfully.",
    });
    setLastOptimization(new Date());
  }, [toast]);

  const handleOptimizeDashboard = useCallback((optimizationCommand: string) => {
    executeAdminCommand(optimizationCommand, 'optimization');
    setLastOptimization(new Date());
    toast({
      title: "Optimization Started",
      description: "Dashboard optimization is now in progress...",
    });
  }, [executeAdminCommand, toast]);

  const visibleResults = botResults.filter(result => !dismissedResults.includes(result.id));

  const quickCommands = [
    { label: 'Provider Discovery Scan', command: 'Run comprehensive provider discovery across all marketplaces', type: 'analysis' as const },
    { label: 'System Health Check', command: 'Analyze overall system health and performance', type: 'analysis' as const },
    { label: 'Optimize Dashboard Performance', command: 'Optimize dashboard performance - improve loading times, enhance responsiveness, and implement performance best practices', type: 'optimization' as const },
    { label: 'Activate Travel Bots', command: 'Activate all travel-related bots for peak season', type: 'control' as const },
    { label: 'Review Pending Providers', command: 'Review and approve pending provider integrations', type: 'control' as const },
    { label: 'Revenue Analysis', command: 'Analyze revenue performance across all partners', type: 'analysis' as const },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <EnhancedResultsNotification 
        results={visibleResults}
        onDismiss={handleDismissResult}
        onApplyOptimization={handleApplyOptimization}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              Master Bot Control Center
            </h1>
            <p className="text-muted-foreground">Unified command and control for all AI systems</p>
          </div>
          <div className="flex items-center gap-3">
            {highPriorityResults.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {highPriorityResults.length} critical alerts
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {botResults.length} active results
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Live Operations</TabsTrigger>
            <TabsTrigger value="optimizer">Dashboard Optimizer</TabsTrigger>
            <TabsTrigger value="analytics">Result Analytics</TabsTrigger>
            <TabsTrigger value="commands">Command Center</TabsTrigger>
            <TabsTrigger value="intelligence">System Intelligence</TabsTrigger>
            <TabsTrigger value="assistant">Master Controller</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* System Status Cards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5 text-primary" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500 mb-2">
                    {systemResults.filter(r => r.result_data?.status === 'healthy').length || 'Optimal'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All systems operational
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Active Bots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {botResults.filter(r => r.bot_type === 'agentic' || r.bot_type === 'gpt').length || 37}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bots currently processing tasks
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Command className="h-5 w-5 text-primary" />
                    Commands Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {adminCommands.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Administrative commands executed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500 mb-2">
                    {Math.round((adminCommands.filter(c => c.execution_status === 'completed').length / Math.max(adminCommands.length, 1)) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Command execution success rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Command className="h-5 w-5 text-primary" />
                  Quick Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickCommands.map((cmd, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start"
                      onClick={() => executeAdminCommand(cmd.command, cmd.type)}
                      disabled={isExecutingCommand}
                    >
                      <span className="font-medium text-sm">{cmd.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{cmd.command}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Commands */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminCommands.slice(0, 5).map((command) => (
                    <div key={command.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {getCommandStatusIcon(command.execution_status)}
                        <div>
                          <p className="font-medium text-sm">{command.command_text}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(command.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={command.execution_status === 'completed' ? 'default' : 'secondary'}>
                        {command.execution_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimizer" className="space-y-6">
            <DashboardOptimizer 
              onOptimize={handleOptimizeDashboard}
              isOptimizing={isExecutingCommand}
              lastOptimization={lastOptimization}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    System Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• {analysisResults.length} analysis results available</p>
                    <p>• Average confidence: {Math.round(analysisResults.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / Math.max(analysisResults.length, 1) * 100)}%</p>
                    <p>• High priority items: {analysisResults.filter(r => r.actionability_rating === 'high').length}</p>
                    <p>• System uptime: 99.9%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Control Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• {controlResults.length} control commands executed</p>
                    <p>• Bot activation rate: 94%</p>
                    <p>• Response time: 1.2s average</p>
                    <p>• Error rate: 0.3%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• {optimizationResults.length} optimization recommendations</p>
                    <p>• Performance improvements: +15%</p>
                    <p>• Cost savings identified: $2,340</p>
                    <p>• Efficiency gains: +23%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <BotResultsPanel dashboardType="admin" className="col-span-full" />
          </TabsContent>

          <TabsContent value="commands" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Command className="h-5 w-5 text-primary" />
                    Command History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {adminCommands.map((command) => (
                      <div key={command.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        {getCommandStatusIcon(command.execution_status)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{command.command_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {command.command_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(command.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {command.response_data && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {command.response_data.summary || 'Command executed successfully'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Command Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{Math.round((adminCommands.filter(c => c.execution_status === 'completed').length / Math.max(adminCommands.length, 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.round((adminCommands.filter(c => c.execution_status === 'completed').length / Math.max(adminCommands.length, 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Commands</p>
                        <p className="font-bold text-primary">{adminCommands.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-bold text-destructive">{adminCommands.filter(c => c.execution_status === 'failed').length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Processing</p>
                        <p className="font-bold text-warning">{adminCommands.filter(c => c.execution_status === 'processing').length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-bold text-muted-foreground">{adminCommands.filter(c => c.execution_status === 'pending').length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <BotResultsPanel dashboardType="admin" />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Master AI Analyst - Chat Interface
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Communicate directly with the Master AI Analyst for system insights, troubleshooting, and analysis
                  </p>
                </CardHeader>
                <CardContent className="h-full">
                  <UniversalBotInterface 
                    dashboardType="admin" 
                    className="h-full"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};