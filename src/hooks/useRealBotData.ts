import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BotData {
  id: string;
  name: string;
  bot_name: string;
  category: string;
  status: 'active' | 'inactive' | 'training';
  bot_type: string;
  capabilities: any;
  configuration: any;
  created_at: string;
  updated_at: string;
}

export interface BotHealthMetrics {
  id: string;
  bot_id: string;
  status: 'healthy' | 'degraded' | 'offline' | 'error';
  response_time: number;
  success_rate: number;
  last_heartbeat: string;
  error_count: number;
  throughput: number;
}

export interface BotPerformanceData {
  agent_id: string;
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  error_rate: number;
  average_response_time_ms: number;
  throughput_per_hour: number;
  cost_per_task: number;
  user_satisfaction_score: number;
  metadata: any;
  updated_at: string;
}

export interface TaskData {
  id: string;
  agent_id: string;
  intent: string;
  status: string;
  progress: number;
  result: any;
  params: any;
  user_id?: string;
  session_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useRealBotData = () => {
  const [bots, setBots] = useState<BotData[]>([]);
  const [botHealthMetrics, setBotHealthMetrics] = useState<BotHealthMetrics[]>([]);
  const [performanceData, setPerformanceData] = useState<BotPerformanceData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch bot registry data
  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('gpt_bot_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database fields to interface
      const mappedBots: BotData[] = (data || []).map(bot => ({
        id: bot.id,
        name: bot.bot_name,
        bot_name: bot.bot_name,
        category: bot.category || 'general',
        status: 'active' as const, // Default to active since we don't have status field
        bot_type: bot.bot_type,
        capabilities: bot.capabilities,
        configuration: bot.configuration,
        created_at: bot.created_at,
        updated_at: bot.updated_at
      }));

      setBots(mappedBots);
    } catch (err) {
      console.error('Error fetching bots:', err);
      setError('Failed to fetch bot data');
    }
  };

  // Fetch agent performance metrics
  const fetchPerformanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_performance_metrics')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setPerformanceData(data || []);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to fetch performance data');
    }
  };

  // Fetch agent tasks
  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('agentic_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch task data');
    }
  };

  // Generate health metrics from performance data
  const generateHealthMetrics = () => {
    const healthMetrics: BotHealthMetrics[] = performanceData.map((perf) => {
      const successRate = perf.total_tasks > 0 
        ? ((perf.successful_tasks / perf.total_tasks) * 100) 
        : 0;
      
      const status = successRate > 95 ? 'healthy' : 
                    successRate > 80 ? 'degraded' : 
                    successRate > 50 ? 'error' : 'offline';

      return {
        id: `health_${perf.agent_id}`,
        bot_id: perf.agent_id,
        status: status as 'healthy' | 'degraded' | 'offline' | 'error',
        response_time: perf.average_response_time_ms,
        success_rate: successRate,
        last_heartbeat: perf.updated_at,
        error_count: perf.failed_tasks,
        throughput: perf.throughput_per_hour
      };
    });

    setBotHealthMetrics(healthMetrics);
  };

  // Set up real-time subscriptions
  useEffect(() => {
    const setupRealtimeSubscriptions = () => {
      // Subscribe to bot registry changes
      const botChannel = supabase
        .channel('bot-registry-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gpt_bot_registry'
          },
          () => {
            fetchBots();
          }
        )
        .subscribe();

      // Subscribe to performance metrics changes
      const performanceChannel = supabase
        .channel('performance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agent_performance_metrics'
          },
          () => {
            fetchPerformanceData();
          }
        )
        .subscribe();

      // Subscribe to task changes
      const taskChannel = supabase
        .channel('task-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agentic_tasks'
          },
          () => {
            fetchTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(botChannel);
        supabase.removeChannel(performanceChannel);
        supabase.removeChannel(taskChannel);
      };
    };

    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  // Generate health metrics when performance data changes
  useEffect(() => {
    generateHealthMetrics();
  }, [performanceData]);

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchBots(),
          fetchPerformanceData(),
          fetchTasks()
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load data');
        toast({
          title: 'Data Loading Error',
          description: 'Failed to load bot data from database',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [toast]);

  // Utility functions
  const getBotsByCategory = (category: string) => {
    return bots.filter(bot => bot.category?.toLowerCase() === category.toLowerCase());
  };

  const getBotHealth = (botId: string) => {
    return botHealthMetrics.find(metric => metric.bot_id === botId);
  };

  const getBotPerformance = (botId: string) => {
    return performanceData.find(perf => perf.agent_id === botId);
  };

  const getActiveBots = () => {
    return bots.filter(bot => bot.status === 'active');
  };

  const getHealthyBots = () => {
    return botHealthMetrics.filter(metric => metric.status === 'healthy');
  };

  const getDegradedBots = () => {
    return botHealthMetrics.filter(metric => metric.status === 'degraded');
  };

  const getErrorBots = () => {
    return botHealthMetrics.filter(metric => metric.status === 'error');
  };

  const getOfflineBots = () => {
    return botHealthMetrics.filter(metric => metric.status === 'offline');
  };

  const getAverageResponseTime = () => {
    if (botHealthMetrics.length === 0) return 0;
    return botHealthMetrics.reduce((sum, metric) => sum + metric.response_time, 0) / botHealthMetrics.length;
  };

  const getAverageSuccessRate = () => {
    if (botHealthMetrics.length === 0) return 0;
    return botHealthMetrics.reduce((sum, metric) => sum + metric.success_rate, 0) / botHealthMetrics.length;
  };

  const getTotalThroughput = () => {
    return botHealthMetrics.reduce((sum, metric) => sum + metric.throughput, 0);
  };

  const getRecentTasks = (limit: number = 10) => {
    return tasks.slice(0, limit);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return {
    // Data
    bots,
    botHealthMetrics,
    performanceData,
    tasks,
    isLoading,
    error,

    // Utility functions
    getBotsByCategory,
    getBotHealth,
    getBotPerformance,
    getActiveBots,
    getHealthyBots,
    getDegradedBots,
    getErrorBots,
    getOfflineBots,
    getAverageResponseTime,
    getAverageSuccessRate,
    getTotalThroughput,
    getRecentTasks,
    getTasksByStatus,

    // Refresh functions
    refreshData: () => {
      fetchBots();
      fetchPerformanceData();
      fetchTasks();
    }
  };
};