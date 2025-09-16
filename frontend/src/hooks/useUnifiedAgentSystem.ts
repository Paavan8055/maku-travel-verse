import { useState, useCallback, useEffect } from 'react';
import { UnifiedAgentOrchestrator, AgentTask, UnifiedAgent } from '../features/agents/lib/unifiedAgentOrchestrator';
import { IntelligentRouter, TaskContext, RoutingDecision } from '../features/agents/lib/intelligentRouter';
import { WorkflowTemplateManager, WorkflowTemplate } from '../features/agents/lib/workflowTemplates';
import { useToast } from '@/hooks/use-toast';

interface UseUnifiedAgentSystemReturn {
  // State
  orchestrator: UnifiedAgentOrchestrator | null;
  router: IntelligentRouter | null;
  workflowManager: WorkflowTemplateManager | null;
  agents: UnifiedAgent[];
  isInitializing: boolean;
  
  // Agent Operations
  routeTask: (context: TaskContext) => Promise<RoutingDecision>;
  executeTask: (task: AgentTask) => Promise<any>;
  getAgentStatus: (agentId: string) => UnifiedAgent | undefined;
  
  // Workflow Operations
  executeWorkflow: (templateId: string, context: Record<string, any>) => Promise<string>;
  getWorkflowStatus: (executionId: string) => Promise<any>;
  cancelWorkflow: (executionId: string) => Promise<void>;
  getWorkflowTemplates: () => WorkflowTemplate[];
  
  // System Management
  refreshAgents: () => Promise<void>;
  getSystemMetrics: () => Promise<any>;
}

export const useUnifiedAgentSystem = (): UseUnifiedAgentSystemReturn => {
  const [orchestrator, setOrchestrator] = useState<UnifiedAgentOrchestrator | null>(null);
  const [router, setRouter] = useState<IntelligentRouter | null>(null);
  const [workflowManager, setWorkflowManager] = useState<WorkflowTemplateManager | null>(null);
  const [agents, setAgents] = useState<UnifiedAgent[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  // Initialize the system
  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // Initialize orchestrator
      const orch = new UnifiedAgentOrchestrator('openai-key-placeholder');
      await orch.initialize();
      setOrchestrator(orch);
      
      // Initialize router
      const rt = new IntelligentRouter();
      setRouter(rt);
      
      // Initialize workflow manager
      const wm = new WorkflowTemplateManager();
      setWorkflowManager(wm);
      
      // Load agents
      const allAgents = orch.getAllAgents();
      setAgents(allAgents);
      
      toast({
        title: "System Initialized",
        description: "Unified agent system is ready",
      });
      
    } catch (error) {
      console.error('Failed to initialize unified agent system:', error);
      toast({
        title: "Initialization Failed",
        description: "Could not initialize the agent system",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  const routeTask = useCallback(async (context: TaskContext): Promise<RoutingDecision> => {
    if (!router) {
      throw new Error('Router not initialized');
    }
    
    try {
      const decision = await router.route(context);
      
      toast({
        title: "Task Routed",
        description: `Assigned to ${decision.agentId} (${decision.confidence.toFixed(2)} confidence)`,
      });
      
      return decision;
    } catch (error) {
      console.error('Task routing failed:', error);
      toast({
        title: "Routing Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [router, toast]);

  const executeTask = useCallback(async (task: AgentTask): Promise<any> => {
    if (!orchestrator) {
      throw new Error('Orchestrator not initialized');
    }
    
    try {
      // Route the task first
      const agentId = await orchestrator.routeTask(task);
      
      // Execute the task
      const result = await orchestrator.executeTask(task.id, agentId);
      
      toast({
        title: "Task Completed",
        description: `Task ${task.intent} completed successfully`,
      });
      
      return result;
    } catch (error) {
      console.error('Task execution failed:', error);
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [orchestrator, toast]);

  const getAgentStatus = useCallback((agentId: string): UnifiedAgent | undefined => {
    return orchestrator?.getAgentStatus(agentId);
  }, [orchestrator]);

  const executeWorkflow = useCallback(async (templateId: string, context: Record<string, any>): Promise<string> => {
    if (!workflowManager) {
      throw new Error('Workflow manager not initialized');
    }
    
    try {
      const executionId = await workflowManager.executeWorkflow(templateId, context);
      
      toast({
        title: "Workflow Started",
        description: `Workflow ${templateId} is now running`,
      });
      
      return executionId;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      toast({
        title: "Workflow Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [workflowManager, toast]);

  const getWorkflowStatus = useCallback(async (executionId: string): Promise<any> => {
    if (!workflowManager) {
      throw new Error('Workflow manager not initialized');
    }
    
    try {
      return await workflowManager.getWorkflowStatus(executionId);
    } catch (error) {
      console.error('Failed to get workflow status:', error);
      toast({
        title: "Status Check Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [workflowManager, toast]);

  const cancelWorkflow = useCallback(async (executionId: string): Promise<void> => {
    if (!workflowManager) {
      throw new Error('Workflow manager not initialized');
    }
    
    try {
      await workflowManager.cancelWorkflow(executionId);
      
      toast({
        title: "Workflow Cancelled",
        description: `Workflow ${executionId} has been cancelled`,
      });
    } catch (error) {
      console.error('Failed to cancel workflow:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [workflowManager, toast]);

  const getWorkflowTemplates = useCallback((): WorkflowTemplate[] => {
    return workflowManager?.getAllTemplates() || [];
  }, [workflowManager]);

  const refreshAgents = useCallback(async (): Promise<void> => {
    if (!orchestrator) {
      throw new Error('Orchestrator not initialized');
    }
    
    try {
      await orchestrator.initialize();
      const allAgents = orchestrator.getAllAgents();
      setAgents(allAgents);
      
      toast({
        title: "Agents Refreshed",
        description: `Loaded ${allAgents.length} agents`,
      });
    } catch (error) {
      console.error('Failed to refresh agents:', error);
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [orchestrator, toast]);

  const getSystemMetrics = useCallback(async (): Promise<any> => {
    if (!orchestrator) {
      throw new Error('Orchestrator not initialized');
    }
    
    try {
      const allAgents = orchestrator.getAllAgents();
      const activeAgents = allAgents.filter(a => a.status === 'active');
      
      return {
        totalAgents: allAgents.length,
        activeAgents: activeAgents.length,
        gptBots: allAgents.filter(a => a.type === 'gpt_bot').length,
        internalAgents: allAgents.filter(a => a.type === 'internal_agent').length,
        avgSuccessRate: allAgents.reduce((sum, a) => sum + a.performance_metrics.success_rate, 0) / allAgents.length,
        avgResponseTime: allAgents.reduce((sum, a) => sum + a.performance_metrics.avg_response_time, 0) / allAgents.length,
        totalCost: allAgents.reduce((sum, a) => sum + a.performance_metrics.cost_per_task, 0)
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      throw error;
    }
  }, [orchestrator]);

  return {
    // State
    orchestrator,
    router,
    workflowManager,
    agents,
    isInitializing,
    
    // Agent Operations
    routeTask,
    executeTask,
    getAgentStatus,
    
    // Workflow Operations
    executeWorkflow,
    getWorkflowStatus,
    cancelWorkflow,
    getWorkflowTemplates,
    
    // System Management
    refreshAgents,
    getSystemMetrics
  };
};