import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAgentTaskIntegration } from './useAgentTaskIntegration';

interface RealTimeMetrics {
  active_bots: number;
  total_results_today: number;
  high_priority_alerts: number;
  average_response_time: number;
  success_rate: number;
  last_updated: string;
}

interface BotPerformance {
  bot_type: string;
  total_executions: number;
  success_rate: number;
  average_confidence: number;
  last_execution: string;
  error_count: number;
}

export const useRealTimeBotData = (dashboardType: 'user' | 'partner' | 'admin', userId?: string) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    active_bots: 0,
    total_results_today: 0,
    high_priority_alerts: 0,
    average_response_time: 0,
    success_rate: 0,
    last_updated: new Date().toISOString()
  });
  
  const [performance, setPerformance] = useState<BotPerformance[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const { 
    botResults, 
    getDashboardData, 
    getHighPriorityResults, 
    getRecentResults 
  } = useAgentTaskIntegration();

  // Calculate real-time metrics
  const calculateMetrics = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayResults = botResults.filter(r => 
      new Date(r.created_at) >= today
    );
    
    const highPriorityResults = getHighPriorityResults();
    const recentResults = getRecentResults(1); // Last hour
    
    // Calculate bot performance
    const botTypeMap = new Map<string, {
      executions: number;
      successCount: number;
      confidenceSum: number;
      lastExecution: string;
      errorCount: number;
    }>();

    botResults.forEach(result => {
      const existing = botTypeMap.get(result.bot_type) || {
        executions: 0,
        successCount: 0,
        confidenceSum: 0,
        lastExecution: result.created_at,
        errorCount: 0
      };

      existing.executions++;
      existing.confidenceSum += result.confidence_score;
      
      if (result.actionability_rating !== 'critical') {
        existing.successCount++;
      } else {
        existing.errorCount++;
      }
      
      if (new Date(result.created_at) > new Date(existing.lastExecution)) {
        existing.lastExecution = result.created_at;
      }
      
      botTypeMap.set(result.bot_type, existing);
    });

    const performanceData: BotPerformance[] = Array.from(botTypeMap.entries()).map(
      ([botType, data]) => ({
        bot_type: botType,
        total_executions: data.executions,
        success_rate: data.executions > 0 ? (data.successCount / data.executions) * 100 : 0,
        average_confidence: data.executions > 0 ? data.confidenceSum / data.executions : 0,
        last_execution: data.lastExecution,
        error_count: data.errorCount
      })
    );

    const newMetrics: RealTimeMetrics = {
      active_bots: botTypeMap.size,
      total_results_today: todayResults.length,
      high_priority_alerts: highPriorityResults.length,
      average_response_time: Math.random() * 1000 + 500, // Simulated for now
      success_rate: botResults.length > 0 ? 
        (botResults.filter(r => r.actionability_rating !== 'critical').length / botResults.length) * 100 : 100,
      last_updated: new Date().toISOString()
    };

    setMetrics(newMetrics);
    setPerformance(performanceData);
    setLastUpdate(new Date());
  }, [botResults, getHighPriorityResults, getRecentResults]);

  // Initialize and refresh data
  const refreshData = useCallback(async () => {
    try {
      await getDashboardData(dashboardType, userId);
      calculateMetrics();
    } catch (error) {
      console.error('Failed to refresh real-time data:', error);
    }
  }, [dashboardType, userId, getDashboardData, calculateMetrics]);

  // Set up real-time subscriptions
  useEffect(() => {
    let channel: any;
    
    const setupRealTime = async () => {
      try {
        // Initial data load
        await refreshData();
        
        // Set up real-time channel
        channel = supabase
          .channel(`realtime-bot-data-${dashboardType}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bot_result_aggregation'
            },
            (payload) => {
              console.log('Real-time bot result update:', payload);
              refreshData();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'agentic_tasks'
            },
            (payload) => {
              console.log('Real-time agent task update:', payload);
              refreshData();
            }
          )
          .subscribe((status) => {
            console.log('Real-time subscription status:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

      } catch (error) {
        console.error('Failed to setup real-time connection:', error);
        setIsConnected(false);
      }
    };

    setupRealTime();

    // Set up periodic refresh as fallback
    const interval = setInterval(refreshData, 30000); // Every 30 seconds

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(interval);
    };
  }, [dashboardType, userId, refreshData]);

  // Recalculate metrics when botResults change
  useEffect(() => {
    calculateMetrics();
  }, [botResults, calculateMetrics]);

  // Bot health monitoring
  const getBotHealth = useCallback((botType: string) => {
    const botPerf = performance.find(p => p.bot_type === botType);
    if (!botPerf) return 'unknown';
    
    if (botPerf.success_rate >= 95 && botPerf.error_count === 0) return 'excellent';
    if (botPerf.success_rate >= 85 && botPerf.error_count <= 2) return 'good';
    if (botPerf.success_rate >= 70 && botPerf.error_count <= 5) return 'fair';
    return 'poor';
  }, [performance]);

  // Get trending bots
  const getTrendingBots = useCallback(() => {
    return performance
      .filter(p => p.total_executions > 0)
      .sort((a, b) => {
        // Sort by recent activity and success rate
        const aScore = a.success_rate * (a.total_executions / 100);
        const bScore = b.success_rate * (b.total_executions / 100);
        return bScore - aScore;
      })
      .slice(0, 10);
  }, [performance]);

  // Get alerts
  const getActiveAlerts = useCallback(() => {
    const alerts = [];
    
    // High error rate alert
    performance.forEach(bot => {
      if (bot.success_rate < 70 && bot.total_executions > 5) {
        alerts.push({
          type: 'error_rate',
          message: `${bot.bot_type} has low success rate: ${bot.success_rate.toFixed(1)}%`,
          severity: 'high',
          bot_type: bot.bot_type
        });
      }
    });

    // High priority results alert
    const highPriorityCount = getHighPriorityResults().length;
    if (highPriorityCount > 5) {
      alerts.push({
        type: 'high_priority',
        message: `${highPriorityCount} high priority results require attention`,
        severity: 'medium',
        count: highPriorityCount
      });
    }

    // No recent activity alert
    const recentActivity = getRecentResults(2); // Last 2 hours
    if (recentActivity.length === 0 && performance.length > 0) {
      alerts.push({
        type: 'no_activity',
        message: 'No bot activity detected in the last 2 hours',
        severity: 'low'
      });
    }

    return alerts;
  }, [performance, getHighPriorityResults, getRecentResults]);

  return {
    // Real-time data
    metrics,
    performance,
    isConnected,
    lastUpdate,
    
    // Actions
    refreshData,
    
    // Analytics
    getBotHealth,
    getTrendingBots,
    getActiveAlerts,
    
    // Computed values
    totalBots: performance.length,
    activeBots: performance.filter(p => 
      new Date(p.last_execution) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
    avgConfidence: performance.length > 0 ? 
      performance.reduce((sum, p) => sum + p.average_confidence, 0) / performance.length : 0,
    topPerformingBot: performance.length > 0 ? 
      performance.reduce((top, current) => 
        current.success_rate > top.success_rate ? current : top
      ) : null
  };
};