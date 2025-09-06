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
        // Fetch performance metrics directly
        let metricsQuery = supabase
          .from('agent_performance_metrics')
          .select('*')
          .gte('metric_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        
        if (agentId) {
          metricsQuery = metricsQuery.eq('agent_id', agentId);
        }

        const { data: metricsData, error: metricsError } = await metricsQuery;

        if (metricsError) {
          console.error('Error fetching performance metrics:', metricsError);
          return;
        }

        // Also fetch recent tasks for real-time activity
        let tasksQuery = supabase
          .from('agentic_tasks')
          .select('agent_id, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(500);
        
        if (agentId) {
          tasksQuery = tasksQuery.eq('agent_id', agentId);
        }

        const { data: tasksData, error: tasksError } = await tasksQuery;

        if (tasksError) {
          console.error('Error fetching tasks for metrics:', tasksError);
          return;
        }

        // Process metrics data
        const processedMetrics: Record<string, AgentMetrics> = {};
        
        // Group metrics by agent_id
        const groupedMetrics = (metricsData || []).reduce((acc, metric: any) => {
          if (!acc[metric.agent_id]) {
            acc[metric.agent_id] = [];
          }
          acc[metric.agent_id].push(metric);
          return acc;
        }, {} as Record<string, any[]>);

        // Group tasks by agent_id for last activity
        const groupedTasks = (tasksData || []).reduce((acc, task: any) => {
          if (!acc[task.agent_id]) {
            acc[task.agent_id] = [];
          }
          acc[task.agent_id].push(task);
          return acc;
        }, {} as Record<string, any[]>);

        // Calculate aggregated metrics for each agent
        Object.entries(groupedMetrics).forEach(([agentId, agentMetrics]) => {
          const totalTasks = agentMetrics.reduce((sum, m) => sum + m.total_tasks, 0);
          const successfulTasks = agentMetrics.reduce((sum, m) => sum + m.successful_tasks, 0);
          const avgResponseTime = agentMetrics.reduce((sum, m) => sum + m.average_response_time_ms, 0) / agentMetrics.length;
          
          const agentTasks = groupedTasks[agentId] || [];
          const lastActivity = agentTasks.length > 0 ? agentTasks[0].updated_at : new Date().toISOString();
          
          processedMetrics[agentId] = {
            taskCount: totalTasks,
            successRate: totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0,
            avgResponseTime: Math.round(avgResponseTime) || 0,
            lastActivity
          };
        });

        // For agents without metrics, use task data
        Object.entries(groupedTasks).forEach(([agentId, agentTasks]) => {
          if (!processedMetrics[agentId]) {
            const completedTasks = agentTasks.filter(t => t.status === 'completed');
            const failedTasks = agentTasks.filter(t => t.status === 'failed');
            
            processedMetrics[agentId] = {
              taskCount: agentTasks.length,
              successRate: agentTasks.length > 0 
                ? (completedTasks.length / (completedTasks.length + failedTasks.length)) * 100 
                : 0,
              avgResponseTime: 2500, // Default placeholder
              lastActivity: agentTasks.length > 0 ? agentTasks[0].updated_at : new Date().toISOString()
            };
          }
        });

        setMetrics(processedMetrics);
      } catch (error) {
        console.error('Error processing agent metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Set up real-time subscription for both metrics and task updates
    const channel = supabase
      .channel('agent-metrics-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agentic_tasks'
        },
        (payload) => {
          fetchMetrics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_performance_metrics'
        },
        (payload) => {
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