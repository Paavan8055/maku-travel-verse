import { useState, useEffect } from 'react';
import { AgentOrchestrator } from '@/features/agents/lib/orchestrator/agent-orchestrator';
import { WorkflowOrchestrator } from '@/features/agents/lib/orchestrator/workflow-orchestrator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAgentOrchestration() {
  const [agentOrchestrator] = useState(() => new AgentOrchestrator());
  const [workflowOrchestrator] = useState(() => new WorkflowOrchestrator());
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsInitialized(true);
    toast({
      title: "Agent Orchestration Initialized",
      description: "Multi-agent coordination system is ready"
    });
  }, [toast]);

  return {
    agentOrchestrator,
    workflowOrchestrator,
    isInitialized,
    
    // Agent Management
    createAgent: agentOrchestrator.createAgent.bind(agentOrchestrator),
    terminateAgent: agentOrchestrator.terminateAgent.bind(agentOrchestrator),
    handoffToSpecialist: agentOrchestrator.handoffToSpecialist.bind(agentOrchestrator),
    
    // Workflow Management
    executeWorkflow: workflowOrchestrator.executeWorkflow.bind(workflowOrchestrator),
    pauseWorkflow: workflowOrchestrator.pauseWorkflow.bind(workflowOrchestrator),
    cancelWorkflow: workflowOrchestrator.cancelWorkflow.bind(workflowOrchestrator),
    
    // System Metrics
    getSystemMetrics: agentOrchestrator.getSystemMetrics.bind(agentOrchestrator),
    getAvailableAgents: agentOrchestrator.getAvailableAgents.bind(agentOrchestrator)
  };
}