import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type GPTBotRecord = Database['public']['Tables']['gpt_bot_registry']['Row'];
type GPTBotWorkflowRecord = Database['public']['Tables']['gpt_bot_workflows']['Row'];

interface GPTBot extends Omit<GPTBotRecord, 'capabilities' | 'usage_metrics' | 'configuration'> {
  capabilities: string[];
  usage_metrics: Record<string, any>;
  configuration: Record<string, any>;
}

interface GPTBotWorkflow extends Omit<GPTBotWorkflowRecord, 'bot_sequence' | 'trigger_conditions'> {
  bot_sequence: any[];
  trigger_conditions: Record<string, any>;
}

interface UseGPTBotIntegrationReturn {
  bots: GPTBot[];
  workflows: GPTBotWorkflow[];
  loading: boolean;
  error: string | null;
  loadBots: () => Promise<void>;
  loadWorkflows: () => Promise<void>;
  activateBot: (botId: string) => Promise<void>;
  deactivateBot: (botId: string) => Promise<void>;
  interactWithBot: (botId: string, prompt: string, context?: Record<string, any>) => Promise<any>;
  createWorkflow: (workflow: Partial<GPTBotWorkflow>) => Promise<void>;
  updateWorkflow: (workflowId: string, updates: Partial<GPTBotWorkflow>) => Promise<void>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
  executeWorkflow: (workflowId: string, context?: Record<string, any>) => Promise<void>;
}

export const useGPTBotIntegration = (): UseGPTBotIntegrationReturn => {
  const [bots, setBots] = useState<GPTBot[]>([]);
  const [workflows, setWorkflows] = useState<GPTBotWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadBots = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('gpt_bot_registry')
        .select('*')
        .order('bot_name');

      if (fetchError) throw fetchError;
      
      const transformedBots: GPTBot[] = (data || []).map(bot => ({
        ...bot,
        capabilities: Array.isArray(bot.capabilities) ? bot.capabilities as string[] : [],
        usage_metrics: typeof bot.usage_metrics === 'object' ? bot.usage_metrics as Record<string, any> : {},
        configuration: typeof bot.configuration === 'object' ? bot.configuration as Record<string, any> : {},
      }));
      
      setBots(transformedBots);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bots';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error loading bots',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('gpt_bot_workflows')
        .select('*')
        .order('workflow_name');

      if (fetchError) throw fetchError;
      
      const transformedWorkflows: GPTBotWorkflow[] = (data || []).map(workflow => ({
        ...workflow,
        bot_sequence: Array.isArray(workflow.bot_sequence) ? workflow.bot_sequence : [],
        trigger_conditions: typeof workflow.trigger_conditions === 'object' ? workflow.trigger_conditions as Record<string, any> : {},
      }));
      
      setWorkflows(transformedWorkflows);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workflows';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error loading workflows',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const activateBot = useCallback(async (botId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('gpt_bot_registry')
        .update({ integration_status: 'active' })
        .eq('id', botId);

      if (updateError) throw updateError;
      
      await loadBots();
      toast({
        title: 'Bot activated',
        description: 'The bot has been successfully activated.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate bot';
      toast({
        variant: 'destructive',
        title: 'Error activating bot',
        description: errorMessage,
      });
    }
  }, [loadBots, toast]);

  const deactivateBot = useCallback(async (botId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('gpt_bot_registry')
        .update({ integration_status: 'inactive' })
        .eq('id', botId);

      if (updateError) throw updateError;
      
      await loadBots();
      toast({
        title: 'Bot deactivated',
        description: 'The bot has been successfully deactivated.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate bot';
      toast({
        variant: 'destructive',
        title: 'Error deactivating bot',
        description: errorMessage,
      });
    }
  }, [loadBots, toast]);

  const interactWithBot = useCallback(async (botId: string, prompt: string, context: Record<string, any> = {}) => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke('gpt-bot-connector', {
        body: {
          botId,
          prompt,
          sessionId: crypto.randomUUID(),
          context
        }
      });

      if (functionError) throw functionError;
      if (!data.success) throw new Error(data.error || 'Bot interaction failed');

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to interact with bot';
      toast({
        variant: 'destructive',
        title: 'Error interacting with bot',
        description: errorMessage,
      });
      throw err;
    }
  }, [toast]);

  const createWorkflow = useCallback(async (workflow: Partial<GPTBotWorkflow>) => {
    try {
      const workflowData = {
        workflow_name: workflow.workflow_name || '',
        description: workflow.description,
        bot_sequence: workflow.bot_sequence || [],
        trigger_conditions: workflow.trigger_conditions || {},
        is_active: workflow.is_active ?? true,
      };
      
      const { error: insertError } = await supabase
        .from('gpt_bot_workflows')
        .insert(workflowData);

      if (insertError) throw insertError;
      
      await loadWorkflows();
      toast({
        title: 'Workflow created',
        description: 'The workflow has been successfully created.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      toast({
        variant: 'destructive',
        title: 'Error creating workflow',
        description: errorMessage,
      });
    }
  }, [loadWorkflows, toast]);

  const updateWorkflow = useCallback(async (workflowId: string, updates: Partial<GPTBotWorkflow>) => {
    try {
      const { error: updateError } = await supabase
        .from('gpt_bot_workflows')
        .update(updates)
        .eq('id', workflowId);

      if (updateError) throw updateError;
      
      await loadWorkflows();
      toast({
        title: 'Workflow updated',
        description: 'The workflow has been successfully updated.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workflow';
      toast({
        variant: 'destructive',
        title: 'Error updating workflow',
        description: errorMessage,
      });
    }
  }, [loadWorkflows, toast]);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('gpt_bot_workflows')
        .delete()
        .eq('id', workflowId);

      if (deleteError) throw deleteError;
      
      await loadWorkflows();
      toast({
        title: 'Workflow deleted',
        description: 'The workflow has been successfully deleted.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workflow';
      toast({
        variant: 'destructive',
        title: 'Error deleting workflow',
        description: errorMessage,
      });
    }
  }, [loadWorkflows, toast]);

  const executeWorkflow = useCallback(async (workflowId: string, context: Record<string, any> = {}) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) throw new Error('Workflow not found');

      if (!workflow.is_active) throw new Error('Workflow is not active');

      // Execute each bot in the sequence
      for (const botStep of workflow.bot_sequence) {
        await interactWithBot(botStep.botId, botStep.prompt, { ...context, ...botStep.context });
      }

      toast({
        title: 'Workflow executed',
        description: 'The workflow has been successfully executed.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute workflow';
      toast({
        variant: 'destructive',
        title: 'Error executing workflow',
        description: errorMessage,
      });
    }
  }, [workflows, interactWithBot, toast]);

  return {
    bots,
    workflows,
    loading,
    error,
    loadBots,
    loadWorkflows,
    activateBot,
    deactivateBot,
    interactWithBot,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
  };
};