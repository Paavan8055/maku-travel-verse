import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Zap, 
  Activity, 
  Users, 
  Workflow,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface EnhancedAgenticWidgetProps {
  onTaskUpdate?: (tasks: any[]) => void;
  dashboardType?: 'admin' | 'user' | 'partner';
}

export const EnhancedAgenticWidget: React.FC<EnhancedAgenticWidgetProps> = ({
  onTaskUpdate,
  dashboardType = 'user'
}) => {
  const {
    agentOrchestrator,
    workflowOrchestrator,
    isInitialized,
    getSystemMetrics,
    getAvailableAgents
  } = useAgentOrchestration();

  const [metrics, setMetrics] = useState<any>(null);
  const [activeAgents, setActiveAgents] = useState<any[]>([]);
  const [runningWorkflows, setRunningWorkflows] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      loadMetrics();
      loadActiveAgents();
      loadRunningWorkflows();
      
      // Set up real-time updates
      const interval = setInterval(() => {
        loadMetrics();
        loadActiveAgents();
        loadRunningWorkflows();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  const loadMetrics = async () => {
    try {
      const systemMetrics = await getSystemMetrics();
      setMetrics(systemMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const loadActiveAgents = async () => {
    try {
      const agents = await getAvailableAgents();
      setActiveAgents(agents);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadRunningWorkflows = async () => {
    try {
      const { data: workflows } = await supabase
        .from('agent_tasks_consolidated')
        .select('*')
        .eq('task_type', 'workflow_execution')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      setRunningWorkflows(workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const handleStartTravelWorkflow = async (workflowType: string) => {
    try {
      const agent = await agentOrchestrator.createAgent('workflow-agent', 'user-session', 'general');
      await workflowOrchestrator.executeWorkflow(agent, workflowType, {
        user_id: 'current-user',
        started_at: new Date().toISOString()
      });
      loadRunningWorkflows();
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  };

  const handleCreateSpecializedAgent = async (specialization: string) => {
    try {
      const agentType: 'travel-expert' | 'booking-specialist' | 'payment-handler' | 'customer-service' | 'general' = 
        specialization === 'flight-expert' ? 'travel-expert' :
        specialization === 'hotel-specialist' ? 'travel-expert' :
        specialization === 'booking-coordinator' ? 'booking-specialist' :
        'general';
      
      await agentOrchestrator.createAgent('specialized-agent', 'user-session', agentType);
      loadActiveAgents();
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  if (!isInitialized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 animate-pulse" />
          <span className="text-sm">Initializing agent system...</span>
        </div>
      </Card>
    );
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full h-14 w-14 shadow-lg relative"
          size="icon"
        >
          <Bot className="h-6 w-6" />
          {metrics?.activeAgents > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {metrics.activeAgents}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[32rem] z-50 shadow-xl border-2 border-primary/20">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">Agent Orchestration</h3>
          <Badge variant="outline" className="text-xs">
            {dashboardType}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(false)}
          className="h-6 w-6"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      <Tabs defaultValue="agents" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 p-2">
          <TabsTrigger value="agents" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            <Workflow className="h-3 w-3 mr-1" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="agents" className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Active Agents</span>
              <Badge variant="secondary">{activeAgents.length}</Badge>
            </div>
            
            <div className="space-y-2">
              {activeAgents.slice(0, 3).map((agent, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' : 
                    agent.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="flex-1">{agent.id || `Agent ${index + 1}`}</span>
                  <Badge variant="outline" className="text-[10px] px-1">
                    {agent.specialization || 'general'}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium">Quick Actions</div>
              {['flight-expert', 'hotel-specialist', 'booking-coordinator'].map(spec => (
                <Button
                  key={spec}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateSpecializedAgent(spec)}
                  className="w-full justify-start text-xs h-8"
                >
                  <Zap className="h-3 w-3 mr-2" />
                  Create {spec.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Running Workflows</span>
              <Badge variant="secondary">{runningWorkflows.length}</Badge>
            </div>

            <div className="space-y-2">
              {runningWorkflows.map((workflow, index) => (
                <div key={workflow.id || index} className="p-2 bg-muted/50 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{workflow.params?.workflowId || 'Unknown Workflow'}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {workflow.status}
                    </Badge>
                  </div>
                  <Progress 
                    value={workflow.progress || 25} 
                    className="h-1"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium">Travel Workflows</div>
              {[
                { id: 'travel_booking_complete', name: 'Complete Booking' },
                { id: 'multi_provider_search', name: 'Multi-Provider Search' },
                { id: 'customer_support_escalation', name: 'Support Escalation' }
              ].map(workflow => (
                <Button
                  key={workflow.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartTravelWorkflow(workflow.id)}
                  className="w-full justify-start text-xs h-8"
                >
                  <ArrowRight className="h-3 w-3 mr-2" />
                  {workflow.name}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="p-4 space-y-3">
            {metrics && (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Success Rate</span>
                    <Badge variant="outline">{metrics.successRate?.toFixed(1) || 0}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Tasks</span>
                    <Badge variant="outline">{metrics.completedTasks || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>System Load</span>
                    <Badge variant="outline">{metrics.performance?.systemLoad?.toFixed(0) || 0}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Response</span>
                    <Badge variant="outline">{metrics.performance?.averageResponseTime || 0}ms</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium">Agent Specializations</div>
                  {Object.entries(metrics.specializations || {}).map(([spec, count]) => (
                    <div key={spec} className="flex items-center justify-between text-xs">
                      <span className="capitalize">{spec.replace('-', ' ')}</span>
                      <Badge variant="secondary">{count as number}</Badge>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>System Health: Optimal</span>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default EnhancedAgenticWidget;