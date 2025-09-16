import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowStep {
  bot_id: string;
  step_name: string;
  description: string;
}

export interface WorkflowExecution {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  current_step: number;
  step_results: any[];
  started_at: string;
  completed_at?: string;
  total_execution_time_ms?: number;
  error_message?: string;
}

export interface UseWorkflowOrchestratorReturn {
  isExecuting: boolean;
  currentExecution: WorkflowExecution | null;
  startWorkflow: (steps: WorkflowStep[], prompt: string, workflowId?: string) => Promise<any>;
  getExecutionStatus: (executionId: string) => Promise<WorkflowExecution | null>;
  cancelExecution: (executionId: string) => Promise<void>;
  getWorkflowTemplates: () => Promise<any[]>;
}

export const useWorkflowOrchestrator = (): UseWorkflowOrchestratorReturn => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const { toast } = useToast();

  const startWorkflow = useCallback(async (steps: WorkflowStep[], prompt: string, workflowId?: string) => {
    try {
      setIsExecuting(true);
      
      const { data, error } = await supabase.functions.invoke('gpt-workflow-orchestrator', {
        body: {
          action: 'start',
          workflowId,
          workflowSteps: steps,
          prompt,
          userId: (await supabase.auth.getUser()).data.user?.id,
          sessionId: crypto.randomUUID()
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Workflow execution failed');
      }

      toast({
        title: "Workflow Started",
        description: `Executing ${steps.length} bot interactions...`,
      });

      return data;
    } catch (error) {
      console.error('Error starting workflow:', error);
      toast({
        title: "Workflow Error",
        description: error.message || 'Failed to start workflow',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [toast]);

  const getExecutionStatus = useCallback(async (executionId: string): Promise<WorkflowExecution | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('gpt-workflow-orchestrator', {
        body: {
          action: 'status',
          workflowId: executionId
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get execution status');
      }

      setCurrentExecution(data.execution);
      return data.execution;
    } catch (error) {
      console.error('Error getting execution status:', error);
      return null;
    }
  }, []);

  const cancelExecution = useCallback(async (executionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gpt-workflow-orchestrator', {
        body: {
          action: 'cancel',
          workflowId: executionId
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel execution');
      }

      toast({
        title: "Workflow Cancelled",
        description: "The workflow execution has been cancelled.",
      });

      setCurrentExecution(null);
    } catch (error) {
      console.error('Error cancelling execution:', error);
      toast({
        title: "Cancellation Error",
        description: error.message || 'Failed to cancel workflow',
        variant: "destructive"
      });
    }
  }, [toast]);

  const getWorkflowTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gpt_bot_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error loading workflow templates:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load workflow templates",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  return {
    isExecuting,
    currentExecution,
    startWorkflow,
    getExecutionStatus,
    cancelExecution,
    getWorkflowTemplates
  };
};