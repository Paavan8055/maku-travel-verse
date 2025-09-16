// Advanced analytics for issue resolution and predictive maintenance
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogger';

export interface IssueResolutionMetrics {
  avgResolutionTime: number;
  resolutionTimeByType: Record<string, number>;
  resolutionRateByAgent: Record<string, number>;
  criticalIssuesTrend: Array<{ date: string; count: number; severity: string }>;
  escalationRate: number;
  firstCallResolutionRate: number;
}

export interface PredictiveAlert {
  id: string;
  type: 'capacity' | 'performance' | 'failure' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  prediction: string;
  confidence: number;
  estimatedTime: string;
  recommendations: string[];
  historicalData: any;
  createdAt: string;
}

export interface SystemHealthCorrelation {
  correlationId: string;
  primaryMetric: string;
  correlatedMetrics: Array<{
    metric: string;
    correlation: number;
    impact: 'positive' | 'negative';
  }>;
  anomalies: Array<{
    timestamp: string;
    metric: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
  }>;
  recommendations: string[];
}

class AdvancedAnalytics {
  private static instance: AdvancedAnalytics;
  private metricsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  static getInstance(): AdvancedAnalytics {
    if (!AdvancedAnalytics.instance) {
      AdvancedAnalytics.instance = new AdvancedAnalytics();
    }
    return AdvancedAnalytics.instance;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.metricsCache.set(key, { data, timestamp: Date.now() });
  }

  // Issue Resolution Analytics
  async getIssueResolutionMetrics(): Promise<IssueResolutionMetrics> {
    const cacheKey = 'issue_resolution_metrics';
    const cached = this.getCachedData<IssueResolutionMetrics>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('admin-metrics', {
        body: { action: 'get_issue_resolution_metrics' }
      });

      if (error) throw error;

      const metrics: IssueResolutionMetrics = {
        avgResolutionTime: data?.avgResolutionTime || 0,
        resolutionTimeByType: data?.resolutionTimeByType || {},
        resolutionRateByAgent: data?.resolutionRateByAgent || {},
        criticalIssuesTrend: data?.criticalIssuesTrend || [],
        escalationRate: data?.escalationRate || 0,
        firstCallResolutionRate: data?.firstCallResolutionRate || 0
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      secureLogger.error('Failed to fetch issue resolution metrics', error as Error, {
        component: 'AdvancedAnalytics'
      });
      
      // Return default metrics on error
      return {
        avgResolutionTime: 0,
        resolutionTimeByType: {},
        resolutionRateByAgent: {},
        criticalIssuesTrend: [],
        escalationRate: 0,
        firstCallResolutionRate: 0
      };
    }
  }

  // Predictive Maintenance & Alerts
  async generatePredictiveAlerts(): Promise<PredictiveAlert[]> {
    const cacheKey = 'predictive_alerts';
    const cached = this.getCachedData<PredictiveAlert[]>(cacheKey);
    if (cached) return cached;

    try {
      // Analyze historical patterns
      const systemMetrics = await this.getSystemMetrics();
      const performanceData = await this.getPerformanceData();
      const errorPatterns = await this.getErrorPatterns();

      const alerts: PredictiveAlert[] = [];

      // Capacity prediction
      const capacityAlert = this.analyzeCapacityTrends(systemMetrics);
      if (capacityAlert) alerts.push(capacityAlert);

      // Performance degradation prediction
      const performanceAlert = this.analyzeBasicPerformanceTrends(performanceData);
      if (performanceAlert) alerts.push(performanceAlert);

      // Failure prediction based on error patterns
      const failureAlert = this.analyzeFailurePatterns(errorPatterns);
      if (failureAlert) alerts.push(failureAlert);

      // Security anomaly detection
      const securityAlert = await this.analyzeSecurityPatterns();
      if (securityAlert) alerts.push(securityAlert);

      this.setCachedData(cacheKey, alerts);
      return alerts;
    } catch (error) {
      secureLogger.error('Failed to generate predictive alerts', error as Error, {
        component: 'AdvancedAnalytics'
      });
      return [];
    }
  }

  // System Health Correlation Analysis
  async analyzeSystemHealthCorrelations(): Promise<SystemHealthCorrelation[]> {
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: { 
          action: 'analyze_correlations',
          timeRange: '7d' 
        }
      });

      if (error) throw error;
      return data?.correlations || [];
    } catch (error) {
      secureLogger.error('Failed to analyze system health correlations', error as Error);
      return [];
    }
  }

  // Performance Trend Analysis (Enhanced)
  async analyzeDetailedPerformanceTrends(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    try {
      const { data: tasks } = await supabase
        .from('agentic_tasks')
        .select('created_at, updated_at, status, agent_id')
        .gte('created_at', new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString())
        .order('created_at', { ascending: false });

      if (!tasks) return null;

      // Analyze completion time trends
      const completionTimes = tasks
        .filter(task => task.status === 'completed' && task.created_at && task.updated_at)
        .map(task => {
          const start = new Date(task.created_at).getTime();
          const end = new Date(task.updated_at).getTime();
          return { duration: end - start, agent: task.agent_id, timestamp: task.created_at };
        });

      // Detect trends
      const avgCompletionTime = completionTimes.reduce((sum, t) => sum + t.duration, 0) / completionTimes.length;
      const recentCompletionTime = completionTimes.slice(0, Math.floor(completionTimes.length / 4))
        .reduce((sum, t) => sum + t.duration, 0) / Math.floor(completionTimes.length / 4);

      const performanceDegradation = recentCompletionTime > avgCompletionTime * 1.2;

      if (performanceDegradation) {
        return {
          id: crypto.randomUUID(),
          type: 'performance' as const,
          severity: recentCompletionTime > avgCompletionTime * 1.5 ? 'high' as const : 'medium' as const,
          prediction: `Performance degradation detected. Recent tasks taking ${((recentCompletionTime / avgCompletionTime - 1) * 100).toFixed(1)}% longer than average.`,
          confidence: 0.85,
          estimatedTime: '2-4 hours',
          recommendations: [
            'Scale up compute resources',
            'Analyze slow-performing agents',
            'Review recent code deployments',
            'Check database performance'
          ],
          historicalData: { avgCompletionTime, recentCompletionTime },
          createdAt: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      secureLogger.error('Performance trend analysis failed', error as Error);
      return null;
    }
  }

  private analyzeCapacityTrends(metrics: any): PredictiveAlert | null {
    // Analyze task volume trends
    const taskGrowthRate = metrics?.taskGrowthRate || 0;
    const currentUtilization = metrics?.currentUtilization || 0;

    if (taskGrowthRate > 0.2 && currentUtilization > 0.7) {
      return {
        id: crypto.randomUUID(),
        type: 'capacity',
        severity: currentUtilization > 0.9 ? 'critical' : 'high',
        prediction: `System approaching capacity limits. Current utilization: ${(currentUtilization * 100).toFixed(1)}%`,
        confidence: 0.9,
        estimatedTime: currentUtilization > 0.9 ? '1-2 hours' : '6-12 hours',
        recommendations: [
          'Scale up agent capacity',
          'Implement task prioritization',
          'Review resource allocation',
          'Consider load balancing improvements'
        ],
        historicalData: metrics,
        createdAt: new Date().toISOString()
      };
    }

    return null;
  }

  private analyzeBasicPerformanceTrends(data: any): PredictiveAlert | null {
    // Basic performance analysis for predictive alerts
    return null;
  }

  private analyzeFailurePatterns(patterns: any): PredictiveAlert | null {
    const errorRate = patterns?.recentErrorRate || 0;
    const historicalErrorRate = patterns?.historicalErrorRate || 0;

    if (errorRate > historicalErrorRate * 2 && errorRate > 0.1) {
      return {
        id: crypto.randomUUID(),
        type: 'failure',
        severity: errorRate > 0.2 ? 'critical' : 'high',
        prediction: `Elevated error rate detected: ${(errorRate * 100).toFixed(1)}% (${((errorRate / historicalErrorRate - 1) * 100).toFixed(1)}% increase)`,
        confidence: 0.8,
        estimatedTime: '30 minutes - 2 hours',
        recommendations: [
          'Review recent deployments',
          'Check external service dependencies',
          'Analyze error logs for patterns',
          'Implement circuit breakers if needed'
        ],
        historicalData: patterns,
        createdAt: new Date().toISOString()
      };
    }

    return null;
  }

  private async analyzeSecurityPatterns(): Promise<PredictiveAlert | null> {
    try {
      const { data: recentFailures } = await supabase
        .from('agentic_tasks')
        .select('error_message, created_at')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

      const securityKeywords = ['unauthorized', 'authentication', 'permission', 'token', 'forbidden'];
      const securityRelatedFailures = recentFailures?.filter(task => 
        task.error_message && securityKeywords.some(keyword => 
          task.error_message.toLowerCase().includes(keyword)
        )
      ) || [];

      if (securityRelatedFailures.length > 5) {
        return {
          id: crypto.randomUUID(),
          type: 'security',
          severity: 'high',
          prediction: `Multiple security-related failures detected: ${securityRelatedFailures.length} incidents in the last hour`,
          confidence: 0.7,
          estimatedTime: 'Immediate attention required',
          recommendations: [
            'Review authentication logs',
            'Check for credential issues',
            'Analyze access patterns',
            'Consider rate limiting'
          ],
          historicalData: { securityRelatedFailures: securityRelatedFailures.length },
          createdAt: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      secureLogger.error('Security pattern analysis failed', error as Error);
      return null;
    }
  }

  private async getSystemMetrics() {
    // Placeholder for system metrics collection
    return { taskGrowthRate: 0.1, currentUtilization: 0.6 };
  }

  private async getPerformanceData() {
    // Placeholder for performance data collection
    return {};
  }

  private async getErrorPatterns() {
    try {
      const { data: recentTasks } = await supabase
        .from('agentic_tasks')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 86400000).toISOString()); // Last 24 hours

      const { data: historicalTasks } = await supabase
        .from('agentic_tasks')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 604800000).toISOString()) // Last 7 days
        .lt('created_at', new Date(Date.now() - 86400000).toISOString()); // Exclude last 24 hours

      const recentErrorRate = recentTasks ? 
        recentTasks.filter(t => t.status === 'failed').length / recentTasks.length : 0;
      
      const historicalErrorRate = historicalTasks ? 
        historicalTasks.filter(t => t.status === 'failed').length / historicalTasks.length : 0;

      return { recentErrorRate, historicalErrorRate };
    } catch (error) {
      secureLogger.error('Error pattern analysis failed', error as Error);
      return { recentErrorRate: 0, historicalErrorRate: 0 };
    }
  }

  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 3600000;
      case '24h': return 86400000;
      case '7d': return 604800000;
      case '30d': return 2592000000;
      default: return 86400000;
    }
  }

  // Real-time monitoring
  startRealTimeMonitoring() {
    // Set up real-time monitoring for critical metrics
    setInterval(async () => {
      try {
        const alerts = await this.generatePredictiveAlerts();
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
        
        if (criticalAlerts.length > 0) {
          secureLogger.warn(`${criticalAlerts.length} critical predictive alerts generated`, {
            component: 'AdvancedAnalytics',
            alertCount: criticalAlerts.length,
            alerts: criticalAlerts.map(a => ({ type: a.type, prediction: a.prediction }))
          });
          
          // In production, this would trigger notifications
          // await this.triggerCriticalAlertNotifications(criticalAlerts);
        }
      } catch (error) {
        secureLogger.error('Real-time monitoring failed', error as Error);
      }
    }, 300000); // Every 5 minutes
  }
}

export const advancedAnalytics = AdvancedAnalytics.getInstance();
export default advancedAnalytics;