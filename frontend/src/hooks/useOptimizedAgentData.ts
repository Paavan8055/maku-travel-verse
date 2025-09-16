/**
 * Optimized Agent Data Hook - Week 2 Performance Implementation
 * Provides high-performance access to consolidated agent data with caching
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCacheManager } from './useCacheManager';
import { cacheManager } from '@/services/core/CacheManager';

export interface ConsolidatedAgentRuntime {
  id: string;
  agent_id: string;
  display_name: string;
  status: 'active' | 'inactive' | 'maintenance';
  category: string;
  tier: number;
  tier_name: string;
  health_status: 'healthy' | 'degraded' | 'critical';
  last_health_check: string;
  configuration: Record<string, any>;
  capabilities: string[];
  permissions: Record<string, any>;
  performance_settings: Record<string, any>;
  current_metrics: {
    total_tasks: number;
    successful_tasks: number;
    failed_tasks: number;
    average_response_time_ms: number;
    error_rate: number;
    throughput_per_hour: number;
    last_updated: string | null;
  };
  active_contexts: number;
  memory_usage_mb: number;
  created_at: string;
  updated_at: string;
}

export interface ConsolidatedAgentTask {
  id: string;
  task_type: string;
  agent_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  user_id?: string;
  session_id?: string;
  correlation_id?: string;
  intent?: string;
  params: Record<string, any>;
  task_data: Record<string, any>;
  result?: Record<string, any>;
  progress: number;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  manager_id?: string;
  delegation_status?: string;
  delegation_result?: Record<string, any>;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  assigned_at: string;
}

export interface OptimizedAgentDataOptions {
  enableRealTimeUpdates?: boolean;
  cacheTimeout?: number;
  maxCacheSize?: number;
  preloadRelatedData?: boolean;
}

export const useOptimizedAgentData = (options: OptimizedAgentDataOptions = {}) => {
  const {
    enableRealTimeUpdates = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    maxCacheSize = 100,
    preloadRelatedData = true
  } = options;

  // State management with performance optimization
  const [agents, setAgents] = useState<ConsolidatedAgentRuntime[]>([]);
  const [tasks, setTasks] = useState<ConsolidatedAgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Enhanced caching with dual layer (memory + localStorage)
  const { 
    cachedFetch, 
    get: getCached, 
    set: setCached, 
    getStats: getCacheStats 
  } = useCacheManager({
    ttl: cacheTimeout,
    maxSize: maxCacheSize,
    storage: 'memory',
    keyPrefix: 'optimized_agent_'
  });

  // Performance metrics tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    queryTime: 0,
    cacheHitRate: 0,
    dataFreshness: 0,
    totalRequests: 0
  });

  /**
   * Optimized agent data fetcher with intelligent caching
   */
  const fetchAgentsOptimized = useCallback(async (forceRefresh = false) => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      setError(null);

      // Try consolidated cache first
      const cachedData = await cacheManager.get<ConsolidatedAgentRuntime[]>('agents-consolidated', 'api-responses');
      
      if (cachedData && !forceRefresh) {
        setAgents(cachedData);
        setLastUpdate(new Date());
        
        // Update performance metrics
        const queryTime = performance.now() - startTime;
        setPerformanceMetrics(prev => ({
          ...prev,
          queryTime,
          cacheHitRate: prev.cacheHitRate + 1,
          totalRequests: prev.totalRequests + 1
        }));
        
        return cachedData;
      }

      // Fetch from consolidated table with optimized query
      const { data: agentData, error: agentError } = await supabase
        .from('agent_runtime_consolidated')
        .select(`
          id, agent_id, display_name, status, category, tier, tier_name,
          health_status, last_health_check, configuration, capabilities,
          permissions, performance_settings, current_metrics,
          active_contexts, memory_usage_mb, created_at, updated_at
        `)
        .eq('status', 'active')
        .order('tier', { ascending: true })
        .order('display_name', { ascending: true });

      if (agentError) throw agentError;

      const optimizedAgents = (agentData || []).map(agent => ({
        ...agent,
        status: agent.status as 'active' | 'inactive' | 'maintenance',
        health_status: agent.health_status as 'healthy' | 'degraded' | 'critical',
        configuration: (agent.configuration as any) || {},
        capabilities: (agent.capabilities as any) || [],
        permissions: (agent.permissions as any) || {},
        performance_settings: (agent.performance_settings as any) || {},
        current_metrics: (agent.current_metrics as any) || {
          total_tasks: 0,
          successful_tasks: 0,
          failed_tasks: 0,
          average_response_time_ms: 0,
          error_rate: 0,
          throughput_per_hour: 0,
          last_updated: null
        }
      }));

      // Cache the result with correlation ID
      await cacheManager.set('agents-consolidated', optimizedAgents, 'api-responses', {
        source: 'database',
        correlationId: `agents-${Date.now()}`
      });

      setAgents(optimizedAgents);
      setLastUpdate(new Date());

      // Update performance metrics
      const queryTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        queryTime,
        totalRequests: prev.totalRequests + 1,
        dataFreshness: Date.now()
      }));

      return optimizedAgents;

    } catch (err) {
      console.error('Failed to fetch optimized agent data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Optimized task data fetcher with pagination and filtering
   */
  const fetchTasksOptimized = useCallback(async (filters: {
    agentId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    const { agentId, status, limit = 50, offset = 0 } = filters;
    const cacheKey = `tasks-${agentId || 'all'}-${status || 'all'}-${limit}-${offset}`;
    
    try {
      // Use advanced caching with retry logic
      const tasksData = await cacheManager.getWithRetry(
        cacheKey,
        async () => {
          let query = supabase
            .from('agent_tasks_consolidated')
            .select(`
              id, task_type, agent_id, status, priority, user_id, session_id,
              correlation_id, intent, params, task_data, result, progress,
              estimated_duration_minutes, actual_duration_minutes, manager_id,
              delegation_status, delegation_result, error_message, retry_count,
              max_retries, created_at, updated_at, started_at, completed_at, assigned_at
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (agentId) {
            query = query.eq('agent_id', agentId);
          }

          if (status) {
            query = query.eq('status', status);
          }

          const { data, error } = await query;
          if (error) throw error;
          return (data || []).map(task => ({
            ...task,
            status: task.status as 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled',
            params: (task.params as any) || {},
            task_data: (task.task_data as any) || {},
            result: (task.result as any) || undefined,
            delegation_result: (task.delegation_result as any) || undefined
          }));
        },
        'api-responses',
        { maxRetries: 2, baseDelay: 1000 }
      );

      setTasks(tasksData);
      return tasksData;

    } catch (err) {
      console.error('Failed to fetch optimized tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      return [];
    }
  }, []);

  /**
   * Real-time subscription with intelligent debouncing
   */
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    let debounceTimer: NodeJS.Timeout;
    
    const handleRealTimeUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchAgentsOptimized(true); // Force refresh on real-time updates
      }, 1000); // 1 second debounce
    };

    // Subscribe to agent runtime changes
    const agentSubscription = supabase
      .channel('agent_runtime_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_runtime_consolidated'
        },
        handleRealTimeUpdate
      )
      .subscribe();

    // Subscribe to task changes
    const taskSubscription = supabase
      .channel('agent_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_tasks_consolidated'
        },
        handleRealTimeUpdate
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      agentSubscription.unsubscribe();
      taskSubscription.unsubscribe();
    };
  }, [enableRealTimeUpdates, fetchAgentsOptimized]);

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    fetchAgentsOptimized();
  }, [fetchAgentsOptimized]);

  /**
   * Memoized computed values for performance
   */
  const computedStats = useMemo(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const healthyAgents = agents.filter(a => a.health_status === 'healthy').length;
    const criticalAgents = agents.filter(a => a.health_status === 'critical').length;
    
    const averageResponseTime = agents.reduce((acc, agent) => {
      return acc + (agent.current_metrics?.average_response_time_ms || 0);
    }, 0) / (totalAgents || 1);

    const totalTasks = agents.reduce((acc, agent) => {
      return acc + (agent.current_metrics?.total_tasks || 0);
    }, 0);

    const averageErrorRate = agents.reduce((acc, agent) => {
      return acc + (agent.current_metrics?.error_rate || 0);
    }, 0) / (totalAgents || 1);

    return {
      totalAgents,
      activeAgents,
      healthyAgents,
      criticalAgents,
      averageResponseTime: Math.round(averageResponseTime),
      totalTasks,
      averageErrorRate: Math.round(averageErrorRate * 100) / 100,
      healthPercentage: Math.round((healthyAgents / (totalAgents || 1)) * 100)
    };
  }, [agents]);

  /**
   * Performance optimization utilities
   */
  const optimizationUtils = {
    clearCache: async () => {
      await cacheManager.clear();
      setPerformanceMetrics(prev => ({ ...prev, cacheHitRate: 0, totalRequests: 0 }));
    },
    
    preloadData: async () => {
      if (preloadRelatedData) {
        await Promise.allSettled([
          fetchAgentsOptimized(true),
          fetchTasksOptimized({ limit: 100 })
        ]);
      }
    },
    
    getCacheStats: () => {
      const cacheStats = getCacheStats();
      return {
        ...cacheStats,
        ...performanceMetrics
      };
    },
    
    invalidateCache: async (pattern: string) => {
      await cacheManager.invalidate(pattern);
    }
  };

  return {
    // Data
    agents,
    tasks,
    computedStats,
    
    // State
    loading,
    error,
    lastUpdate,
    performanceMetrics,
    
    // Actions
    fetchAgentsOptimized,
    fetchTasksOptimized,
    refetch: () => fetchAgentsOptimized(true),
    
    // Optimization utilities
    ...optimizationUtils
  };
};