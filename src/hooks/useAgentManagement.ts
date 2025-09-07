import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Agent {
  id: string;
  agent_id: string;
  display_name: string;
  description: string;
  category: string;
  status: string;
  version: string;
  capabilities: string[];
  health_status: string;
  last_health_check: string;
  tier: number;
  tier_name: string;
  department?: string;
  reports_to_agent_id?: string;
  is_department_head?: boolean;
  configuration: any;
  permissions: any;
  performance_settings: any;
}

export interface AgentTask {
  id: string;
  agent_id: string;
  intent: string;
  params: any;
  status: string;
  result: any;
  created_at: string;
  updated_at: string;
}

export interface AgentPerformance {
  agent_id: string;
  metric_date: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  average_response_time_ms: number;
  error_rate: number;
  throughput_per_hour: number;
}

export const useAgentManagement = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: agentsData, error: agentsError } = await supabase
        .from('agent_management')
        .select('*')
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      const formattedAgents: Agent[] = (agentsData || []).map(agent => ({
        id: agent.id,
        display_name: agent.display_name,
        agent_id: agent.agent_id,
        status: agent.status,
        health_status: agent.health_status,
        category: agent.category,
        version: agent.version,
        tier: agent.tier || 4,
        tier_name: agent.tier_name || 'support',
        department: agent.department,
        reports_to_agent_id: agent.reports_to_agent_id,
        is_department_head: agent.is_department_head || false,
        capabilities: Array.isArray(agent.capabilities) 
          ? agent.capabilities.filter(cap => typeof cap === 'string') as string[]
          : [],
        last_health_check: agent.last_health_check || agent.updated_at,
        description: agent.description,
        configuration: agent.configuration,
        permissions: agent.permissions,
        performance_settings: agent.performance_settings,
      }));
      
      setAgents(formattedAgents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agents';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAgent = async (agentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.functions.invoke('agent-management', {
        body: { 
          action: 'get_agent',
          agentId
        }
      });

      if (funcError) throw funcError;
      
      if (data.success) {
        setSelectedAgent(data.data.agent);
        setAgentTasks(data.data.tasks || []);
        setAgentPerformance(data.data.metrics || []);
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to load agent details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agent details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateAgentConfig = async (agentId: string, config: any) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.functions.invoke('agent-management', {
        body: { 
          action: 'update_agent_config',
          agentId,
          taskData: config
        }
      });

      if (funcError) throw funcError;
      
      if (data.success) {
        toast.success('Agent configuration updated successfully');
        await loadAgents(); // Refresh agents list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update agent configuration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent configuration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (agentId: string, taskData: { intent: string; params?: any }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('agentic_tasks')
        .insert({
          agent_id: agentId,
          intent: taskData.intent,
          params: taskData.params || {},
          status: 'pending',
          progress: 0,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Task assigned successfully');
      
      // Refresh task list if viewing agent details
      if (selectedAgent?.agent_id === agentId) {
        await getAgent(agentId);
      }
      
      return { success: true, data, taskId: data.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign task';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const bulkAssignTask = async (agentIds: string[], taskConfig: any, operationName: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.functions.invoke('agent-management', {
        body: { 
          action: 'bulk_assign_task',
          batchData: {
            name: operationName,
            agentIds,
            taskConfig
          }
        }
      });

      if (funcError) throw funcError;
      
      if (data.success) {
        toast.success(`Task assigned to ${data.data.completed} agents`);
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to bulk assign task');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk assign task';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const emergencyStop = async (agentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.functions.invoke('agent-management', {
        body: { 
          action: 'emergency_stop',
          agentId
        }
      });

      if (funcError) throw funcError;
      
      if (data.success) {
        toast.success('Agent emergency stopped');
        await loadAgents(); // Refresh agents list
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to emergency stop agent');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to emergency stop agent';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const scheduleTask = async (scheduleData: any) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.functions.invoke('agent-management', {
        body: { 
          action: 'schedule_task',
          scheduleData
        }
      });

      if (funcError) throw funcError;
      
      if (data.success) {
        toast.success('Task scheduled successfully');
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to schedule task');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule task';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAgentPerformance = async (agentId: string) => {
    try {
      const { data, error: funcError } = await supabase.functions.invoke('agent-management', {
        body: { 
          action: 'get_agent_performance',
          agentId
        }
      });

      if (funcError) throw funcError;
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get agent performance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get agent performance';
      toast.error(errorMessage);
      return [];
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return {
    agents,
    selectedAgent,
    agentTasks,
    agentPerformance,
    loading,
    error,
    loadAgents,
    getAgent,
    updateAgentConfig,
    assignTask,
    bulkAssignTask,
    emergencyStop,
    scheduleTask,
    getAgentPerformance,
    setSelectedAgent
  };
};