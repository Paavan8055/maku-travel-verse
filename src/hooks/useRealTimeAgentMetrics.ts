import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgentMetric {
  id: string;
  agent_id: string;
  metric_type: string;
  value: number;
  metadata?: any;
  recorded_at: string;
}

interface AgentMetrics {
  taskCount: number;
  successRate: number;
  avgResponseTime: number;
  lastActivity: string;
}

export const useRealTimeAgentMetrics = (agentId?: string) => {
  const [metrics, setMetrics] = useState<Record<string, AgentMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      
      try {
        // Fetch recent tasks to calculate metrics
        let query = supabase
          .from('agentic_tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);
        
        if (agentId) {
          query = query.eq('agent_id', agentId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching tasks for metrics:', error);
          return;
        }

        // Process tasks into aggregated metrics
        const processedMetrics: Record<string, AgentMetrics> = {};
        
        // Group tasks by agent_id
        const groupedTasks = (data || []).reduce((acc, task: any) => {
          if (!acc[task.agent_id]) {
            acc[task.agent_id] = [];
          }
          acc[task.agent_id].push(task);
          return acc;
        }, {} as Record<string, any[]>);

        // Calculate aggregated metrics for each agent
        Object.entries(groupedTasks).forEach(([agentId, agentTasks]) => {
          const activeTasks = agentTasks.filter(t => t.status === 'running' || t.status === 'pending');
          const completedTasks = agentTasks.filter(t => t.status === 'completed');
          const failedTasks = agentTasks.filter(t => t.status === 'failed');
          
          processedMetrics[agentId] = {
            taskCount: agentTasks.length,
            successRate: agentTasks.length > 0 
              ? (completedTasks.length / (completedTasks.length + failedTasks.length)) * 100 
              : 0,
            avgResponseTime: 3500, // Placeholder - would calculate from actual completion times
            lastActivity: agentTasks.length > 0 ? agentTasks[0].updated_at : new Date().toISOString()
          };
        });

        setMetrics(processedMetrics);
      } catch (error) {
        console.error('Error processing agent metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Set up real-time subscription for task updates to update metrics
    const channel = supabase
      .channel('agent-task-metrics-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agentic_tasks'
        },
        (payload) => {
          // Recalculate metrics when tasks change
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  return { metrics, isLoading };
};