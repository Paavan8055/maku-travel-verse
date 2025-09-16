import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  BarChart3, 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Users,
  Activity,
  Workflow
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UnifiedAgent {
  id: string;
  agent_id: string;
  display_name: string;
  type: 'internal' | 'gpt_bot';
  status: string;
  tier: number;
  category: string;
  performance_score: number;
  cost_per_task: number;
  tasks_completed: number;
  last_activity: string;
  health_status: string;
  capabilities: string[];
}

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  avgPerformanceScore: number;
  totalCost: number;
  tasksProcessed: number;
  systemHealth: number;
}

export function ConsolidatedAgentDashboard() {
  const [agents, setAgents] = useState<UnifiedAgent[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScalingEnabled, setAutoScalingEnabled] = useState(false);

  useEffect(() => {
    loadConsolidatedData();
    const interval = setInterval(loadConsolidatedData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadConsolidatedData = async () => {
    try {
      setLoading(true);
      
      // Load unified agent data
      const { data: agentData, error: agentError } = await supabase
        .from('agent_management')
        .select(`
          id,
          agent_id,
          display_name,
          status,
          tier,
          category,
          health_status,
          capabilities,
          performance_settings,
          created_at,
          updated_at
        `)
        .order('tier')
        .order('display_name');

      if (agentError) throw agentError;

      // Transform and enrich data
      const enrichedAgents: UnifiedAgent[] = (agentData || []).map(agent => ({
        ...agent,
        type: agent.agent_id.startsWith('gpt-') ? 'gpt_bot' : 'internal',
        performance_score: Math.floor(Math.random() * 40 + 60), // Mock data
        cost_per_task: Math.random() * 0.5 + 0.1,
        tasks_completed: Math.floor(Math.random() * 1000 + 100),
        last_activity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        capabilities: Array.isArray(agent.capabilities) 
          ? agent.capabilities.map(cap => String(cap))
          : []
      }));

      setAgents(enrichedAgents);

      // Calculate system metrics
      const totalAgents = enrichedAgents.length;
      const activeAgents = enrichedAgents.filter(a => a.status === 'active').length;
      const avgPerformanceScore = enrichedAgents.reduce((sum, a) => sum + a.performance_score, 0) / totalAgents;
      const totalCost = enrichedAgents.reduce((sum, a) => sum + (a.cost_per_task * a.tasks_completed), 0);
      const tasksProcessed = enrichedAgents.reduce((sum, a) => sum + a.tasks_completed, 0);
      const healthyAgents = enrichedAgents.filter(a => a.health_status === 'healthy').length;
      const systemHealth = (healthyAgents / totalAgents) * 100;

      setMetrics({
        totalAgents,
        activeAgents,
        avgPerformanceScore,
        totalCost,
        tasksProcessed,
        systemHealth
      });

    } catch (error) {
      console.error('Failed to load consolidated data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoScaling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('agent-orchestration', {
        body: { 
          action: 'toggle_auto_scaling',
          enabled: !autoScalingEnabled 
        }
      });

      if (error) throw error;
      
      setAutoScalingEnabled(!autoScalingEnabled);
      toast.success(`Auto-scaling ${!autoScalingEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle auto-scaling:', error);
      toast.error('Failed to update auto-scaling');
    }
  };

  const optimizeAgentAllocation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('agent-orchestration', {
        body: { action: 'optimize_allocation' }
      });

      if (error) throw error;
      
      toast.success('Agent allocation optimized');
      loadConsolidatedData();
    } catch (error) {
      console.error('Failed to optimize allocation:', error);
      toast.error('Failed to optimize allocation');
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesTier = selectedTier === 'all' || agent.tier.toString() === selectedTier;
    const matchesSearch = agent.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTierBadgeVariant = (tier: number) => {
    switch (tier) {
      case 1: return 'default';
      case 2: return 'secondary';
      case 3: return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-pulse text-primary" />
        <span className="ml-2">Loading consolidated dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consolidated Agent System</h1>
          <p className="text-muted-foreground">
            Unified management of internal agents and GPT bots
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={toggleAutoScaling}
            variant={autoScalingEnabled ? "default" : "outline"}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-scaling {autoScalingEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={optimizeAgentAllocation} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Optimize
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {metrics && metrics.systemHealth < 80 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System health is at {metrics.systemHealth.toFixed(1)}%. 
            Consider reviewing agent configurations and performance.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                  <p className="text-xl font-bold">{metrics.totalAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">{metrics.activeAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-xl font-bold">{metrics.avgPerformanceScore.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Processed</p>
                  <p className="text-xl font-bold">{metrics.tasksProcessed.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-xl font-bold">${metrics.totalCost.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">System Health</p>
                  <p className="text-xl font-bold">{metrics.systemHealth.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agent Directory</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
          <TabsTrigger value="orchestration">Smart Orchestration</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          {/* Filters */}
          <div className="flex space-x-4">
            <Input 
              placeholder="Search agents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="1">Tier 1 (Executive)</SelectItem>
                <SelectItem value="2">Tier 2 (Manager)</SelectItem>
                <SelectItem value="3">Tier 3 (Specialist)</SelectItem>
                <SelectItem value="4">Tier 4 (Support)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agent Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAgents.map(agent => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={getTierBadgeVariant(agent.tier)}>
                      Tier {agent.tier}
                    </Badge>
                    <Badge variant={agent.type === 'gpt_bot' ? 'secondary' : 'default'}>
                      {agent.type === 'gpt_bot' ? 'GPT Bot' : 'Internal'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{agent.display_name}</CardTitle>
                  <CardDescription>{agent.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Health</span>
                    {getHealthIcon(agent.health_status)}
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Performance</span>
                      <span>{agent.performance_score}%</span>
                    </div>
                    <Progress value={agent.performance_score} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tasks</p>
                      <p className="font-medium">{agent.tasks_completed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cost/Task</p>
                      <p className="font-medium">${agent.cost_per_task.toFixed(3)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 2).map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.capabilities.length - 2}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Real-time performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Advanced performance analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization</CardTitle>
              <CardDescription>
                Intelligent cost management and optimization strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Cost optimization dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orchestration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Orchestration</CardTitle>
              <CardDescription>
                Intelligent task routing and workflow automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Smart orchestration interface coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}