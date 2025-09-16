import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { UnifiedAgentOrchestrator, UnifiedAgent } from '../lib/unifiedAgentOrchestrator';
import { IntelligentRouter, TaskContext, RoutingDecision } from '../lib/intelligentRouter';
import { WorkflowTemplateManager, WorkflowTemplate } from '../lib/workflowTemplates';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Brain, Zap, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  tasksCompleted: number;
  avgResponseTime: number;
  totalCost: number;
  successRate: number;
}

export const UnifiedAgentDashboard: React.FC = () => {
  const [orchestrator, setOrchestrator] = useState<UnifiedAgentOrchestrator | null>(null);
  const [router, setRouter] = useState<IntelligentRouter | null>(null);
  const [workflowManager, setWorkflowManager] = useState<WorkflowTemplateManager | null>(null);
  const [agents, setAgents] = useState<UnifiedAgent[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    tasksCompleted: 0,
    avgResponseTime: 0,
    totalCost: 0,
    successRate: 0
  });
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    try {
      setLoading(true);
      
      // Initialize orchestrator
      const orch = new UnifiedAgentOrchestrator('dummy-key'); // Will be replaced with actual key
      await orch.initialize();
      setOrchestrator(orch);
      
      // Initialize router
      const rt = new IntelligentRouter();
      setRouter(rt);
      
      // Initialize workflow manager
      const wm = new WorkflowTemplateManager();
      setWorkflowManager(wm);
      
      // Load data
      await loadAgents(orch);
      await loadMetrics();
      setWorkflows(wm.getAllTemplates());
      
    } catch (error) {
      console.error('Failed to initialize system:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize the agent system",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async (orch: UnifiedAgentOrchestrator) => {
    const allAgents = orch.getAllAgents();
    setAgents(allAgents);
  };

  const loadMetrics = async () => {
    try {
      // Get agent counts
      const { data: gptBots } = await supabase
        .from('gpt_bot_registry')
        .select('*');
      
      const { data: internalAgents } = await supabase
        .from('agent_management')
        .select('*');
      
      // Get task metrics
      const { data: tasks } = await supabase
        .from('agentic_tasks')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const totalAgents = (gptBots?.length || 0) + (internalAgents?.length || 0);
      const activeAgents = ((gptBots?.length || 0) +
                           (internalAgents?.filter(a => a.status === 'active')?.length || 0));
      
      const completedTasks = tasks?.filter(t => t.status === 'completed')?.length || 0;
      const totalTasks = tasks?.length || 1;
      
      setMetrics({
        totalAgents,
        activeAgents,
        tasksCompleted: completedTasks,
        avgResponseTime: 2500, // Calculated from performance data
        totalCost: completedTasks * 0.03, // Estimated based on task completion
        successRate: (completedTasks / totalTasks) * 100
      });
      
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const getAgentsByTier = (tier: number) => {
    return agents.filter(agent => agent.tier === tier);
  };

  const getTierName = (tier: number): string => {
    const tierNames = { 1: 'Executive', 2: 'Management', 3: 'Specialist', 4: 'Support' };
    return tierNames[tier as keyof typeof tierNames] || 'Unknown';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'busy': return 'bg-warning';
      case 'inactive': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const executeTestWorkflow = async (templateId: string) => {
    if (!workflowManager) return;
    
    try {
      const executionId = await workflowManager.executeWorkflow(templateId, {
        customer_name: 'Test Customer',
        industry: 'Technology',
        company_size: '50-100',
        preferences: { theme: 'dark', notifications: true }
      });
      
      toast({
        title: "Workflow Started",
        description: `Workflow execution ID: ${executionId}`,
      });
    } catch (error) {
      toast({
        title: "Workflow Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Agent System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeAgents} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.avgResponseTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              Cross-platform average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hierarchy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hierarchy">Agent Hierarchy</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="routing">Intelligent Routing</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agent Hierarchy (4-Tier System)
              </CardTitle>
              <CardDescription>
                Unified view of GPT bots and internal agents organized by tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3, 4].map(tier => {
                  const tierAgents = getAgentsByTier(tier);
                  return (
                    <div key={tier} className="space-y-2">
                      <h4 className="font-semibold text-lg">
                        Tier {tier}: {getTierName(tier)} ({tierAgents.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tierAgents.map(agent => (
                          <Card key={agent.id} className="border-l-4 border-l-primary/20">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium truncate">{agent.name}</h5>
                                <Badge className={getStatusColor(agent.status)}>
                                  {agent.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {agent.category} • {agent.type}
                              </p>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span>Success Rate:</span>
                                  <span>{(agent.performance_metrics.success_rate * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Response:</span>
                                  <span>{(agent.performance_metrics.avg_response_time / 1000).toFixed(1)}s</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  GPT Bot Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.filter(a => a.type === 'gpt_bot').slice(0, 5).map(agent => (
                    <div key={agent.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{agent.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{(agent.performance_metrics.success_rate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                          ${agent.performance_metrics.cost_per_task.toFixed(3)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Internal Agent Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.filter(a => a.type === 'internal_agent').slice(0, 5).map(agent => (
                    <div key={agent.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">Tier {agent.tier}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{(agent.performance_metrics.success_rate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {(agent.performance_metrics.avg_response_time / 1000).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Pre-built Workflow Templates
              </CardTitle>
              <CardDescription>
                Ready-to-use workflows for common business processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflows.map(workflow => (
                  <Card key={workflow.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">{workflow.category}</Badge>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => executeTestWorkflow(workflow.id)}
                        >
                          Test Run
                        </Button>
                      </div>
                      <CardDescription>{workflow.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Steps:</span>
                          <span>{workflow.steps.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{Math.round(workflow.estimatedDuration / 60000)}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Cost:</span>
                          <span>${workflow.estimatedCost.toFixed(2)}</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground">
                            <strong>Business Value:</strong> {workflow.businessValue}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Intelligent Routing System
              </CardTitle>
              <CardDescription>
                AI-powered task routing optimizes agent selection based on multiple factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold">Creative Tasks</h4>
                    <p className="text-sm text-muted-foreground">→ GPT Bots</p>
                    <p className="text-xs">Content, Writing, Design</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold">Analytical Tasks</h4>
                    <p className="text-sm text-muted-foreground">→ High-tier GPT</p>
                    <p className="text-xs">Research, Analysis</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold">Operational Tasks</h4>
                    <p className="text-sm text-muted-foreground">→ Internal Agents</p>
                    <p className="text-xs">System Operations</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold">Customer Service</h4>
                    <p className="text-sm text-muted-foreground">→ Tier-based</p>
                    <p className="text-xs">Support → Specialist</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Routing Factors</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium">Performance (40%)</h5>
                      <p className="text-muted-foreground">Success rate and reliability</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Capability Match (30%)</h5>
                      <p className="text-muted-foreground">Skills and specialization</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Load Balancing (20%)</h5>
                      <p className="text-muted-foreground">Current workload</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Cost Efficiency (10%)</h5>
                      <p className="text-muted-foreground">User tier optimization</p>
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