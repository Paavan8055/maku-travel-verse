import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentTask {
  id: string;
  agent_id: string;
  intent: string;
  status: string;
  result?: any;
  user_id?: string;
  session_id?: string;
  params?: any;
  created_at?: string;
  updated_at?: string;
}

interface BotResult {
  id: string;
  bot_type: string;
  output_data?: any;
  actionability_rating: string;
  confidence_score: number;
  result_type: string;
  user_id?: string;
  session_id?: string;
  correlation_id?: string;
  metadata?: any;
  created_at: string;
  bot_id?: string;
  expires_at?: string;
  priority_score?: number;
  updated_at?: string;
}

export const useAgentTaskIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [botResults, setBotResults] = useState<BotResult[]>([]);
  const { toast } = useToast();

  // Store GPT Bot Result
  const storeGPTResult = useCallback(async (resultData: {
    bot_type: string;
    output_data: any;
    actionability_rating: 'low' | 'medium' | 'high' | 'critical';
    confidence_score: number;
    result_type: string;
    user_id?: string;
    session_id?: string;
    correlation_id?: string;
    metadata?: any;
  }) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('gpt-bot-aggregator', {
        body: {
          action: 'store_gpt_result',
          data: resultData
        }
      });

      if (error) throw error;

      console.log('GPT result stored successfully:', data);
      
      // Refresh bot results
      await fetchBotResults();
      
      return data;
    } catch (error) {
      console.error('Error storing GPT result:', error);
      toast({
        title: "Error",
        description: "Failed to store GPT result",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Store Agentic Task Result
  const storeAgenticResult = useCallback(async (taskData: {
    agent_id: string;
    intent: string;
    status: string;
    result?: any;
    user_id?: string;
    session_id?: string;
    params?: any;
  }) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('gpt-bot-aggregator', {
        body: {
          action: 'store_agentic_result',
          data: taskData
        }
      });

      if (error) throw error;

      console.log('Agentic result stored successfully:', data);
      
      // Refresh both agent tasks and bot results
      await Promise.all([
        fetchAgentTasks(),
        fetchBotResults()
      ]);
      
      return data;
    } catch (error) {
      console.error('Error storing agentic result:', error);
      toast({
        title: "Error",
        description: "Failed to store agentic task result",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch Agent Tasks
  const fetchAgentTasks = useCallback(async (filters?: {
    user_id?: string;
    agent_id?: string;
    status?: string;
  }) => {
    try {
      let query = supabase
        .from('agentic_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      if (filters?.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAgentTasks(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching agent tasks:', error);
      return [];
    }
  }, []);

  // Fetch Bot Results
  const fetchBotResults = useCallback(async (filters?: {
    user_id?: string;
    bot_type?: string;
    timeframe?: '24h' | '7d' | '30d';
  }) => {
    try {
      let query = supabase
        .from('bot_result_aggregation')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      if (filters?.bot_type) {
        query = query.eq('bot_type', filters.bot_type);
      }

      if (filters?.timeframe) {
        const hours = filters.timeframe === '24h' ? 24 : 
                     filters.timeframe === '7d' ? 168 : 720;
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', cutoff);
      }

      const { data, error } = await query;

      if (error) throw error;

      setBotResults(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching bot results:', error);
      return [];
    }
  }, []);

  // Aggregate Results
  const aggregateResults = useCallback(async (options?: {
    timeframe?: '24h' | '7d' | '30d';
    user_id?: string;
    bot_types?: string[];
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('gpt-bot-aggregator', {
        body: {
          action: 'aggregate_results',
          data: options || {}
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error aggregating results:', error);
      throw error;
    }
  }, []);

  // Get Dashboard Data
  const getDashboardData = useCallback(async (dashboardType: 'user' | 'partner' | 'admin', userId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gpt-bot-aggregator', {
        body: {
          action: 'get_dashboard_data',
          data: {
            dashboard_type: dashboardType,
            user_id: userId
          }
        }
      });

      if (error) throw error;

      if (data.results) {
        // Map the data to ensure compatibility
        const mappedResults = data.results.map((result: any) => ({
          id: result.id,
          bot_type: result.bot_type,
          output_data: result.output_data,
          actionability_rating: result.actionability_rating,
          confidence_score: result.confidence_score,
          result_type: result.result_type,
          user_id: result.user_id,
          session_id: result.session_id,
          correlation_id: result.correlation_id,
          metadata: result.metadata,
          created_at: result.created_at,
          bot_id: result.bot_id,
          expires_at: result.expires_at,
          priority_score: result.priority_score,
          updated_at: result.updated_at
        }));
        setBotResults(mappedResults);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }, []);

  // Real-time subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('agent-task-integration')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agentic_tasks'
        },
        (payload) => {
          console.log('Agent task change detected:', payload);
          fetchAgentTasks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bot_result_aggregation'
        },
        (payload) => {
          console.log('Bot result change detected:', payload);
          fetchBotResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAgentTasks, fetchBotResults]);

  return {
    // State
    isLoading,
    agentTasks,
    botResults,
    
    // Actions
    storeGPTResult,
    storeAgenticResult,
    fetchAgentTasks,
    fetchBotResults,
    aggregateResults,
    getDashboardData,
    
    // Utilities
    getHighPriorityResults: () => botResults.filter(r => ['high', 'critical'].includes(r.actionability_rating)),
    getRecentResults: (hours = 24) => botResults.filter(r => 
      new Date(r.created_at) > new Date(Date.now() - hours * 60 * 60 * 1000)
    ),
    getResultsByType: (type: string) => botResults.filter(r => r.result_type === type),
    getTasksByAgent: (agentId: string) => agentTasks.filter(t => t.agent_id === agentId),
    getTasksByStatus: (status: string) => agentTasks.filter(t => t.status === status)
  };
};