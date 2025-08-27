// Provider Performance Analytics & Real-time Monitoring
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import logger from "../_shared/logger.ts";
import { CircuitBreakerManager } from "../_shared/provider-circuit-breakers.ts";
import { ProviderAuthFactory } from "../_shared/provider-authentication.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProviderMetrics {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  uptime: number;
  quotaUsage: number;
  costPerRequest: number;
  lastHealthCheck: Date;
  circuitBreakerState: string;
  authenticationStatus: 'healthy' | 'degraded' | 'failed';
}

interface SystemHealthReport {
  overallHealth: 'healthy' | 'degraded' | 'critical';
  totalProviders: number;
  healthyProviders: number;
  degradedProviders: number;
  failedProviders: number;
  averageResponseTime: number;
  totalRequests: number;
  successRate: number;
  providerMetrics: Record<string, ProviderMetrics>;
  recommendations: string[];
  alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    providerId?: string;
    timestamp: Date;
  }>;
}

const metricsCache = new Map<string, ProviderMetrics>();
const responseTimeHistory = new Map<string, number[]>();
const alertHistory: Array<any> = [];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'health_report';

    switch (action) {
      case 'health_report':
        return await generateHealthReport(supabase);
      
      case 'provider_metrics':
        const providerId = url.searchParams.get('provider_id');
        return await getProviderMetrics(supabase, providerId);
      
      case 'performance_trend':
        const timeRange = url.searchParams.get('time_range') || '24h';
        return await getPerformanceTrend(supabase, timeRange);
      
      case 'cost_analysis':
        return await getCostAnalysis(supabase);
      
      case 'predictive_scaling':
        return await getPredictiveScaling(supabase);
      
      case 'real_time_monitoring':
        return await getRealTimeMonitoring(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    logger.error('[PROVIDER-ANALYTICS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateHealthReport(supabase: any): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Get all provider configurations
    const { data: providers, error } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('enabled', true);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const healthReport: SystemHealthReport = {
      overallHealth: 'healthy',
      totalProviders: providers.length,
      healthyProviders: 0,
      degradedProviders: 0,
      failedProviders: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      successRate: 0,
      providerMetrics: {},
      recommendations: [],
      alerts: []
    };

    let totalResponseTime = 0;
    let totalRequests = 0;
    let totalSuccessfulRequests = 0;

    // Analyze each provider
    for (const provider of providers) {
      const metrics = await analyzeProviderMetrics(provider, supabase);
      healthReport.providerMetrics[provider.id] = metrics;

      // Aggregate statistics
      totalResponseTime += metrics.averageResponseTime * metrics.totalRequests;
      totalRequests += metrics.totalRequests;
      totalSuccessfulRequests += metrics.successfulRequests;

      // Categorize provider health
      if (metrics.errorRate > 20 || metrics.uptime < 80) {
        healthReport.failedProviders++;
        healthReport.alerts.push({
          level: 'critical',
          message: `Provider ${provider.id} is experiencing high error rate (${metrics.errorRate.toFixed(1)}%) or low uptime (${metrics.uptime.toFixed(1)}%)`,
          providerId: provider.id,
          timestamp: new Date()
        });
      } else if (metrics.errorRate > 5 || metrics.uptime < 95 || metrics.averageResponseTime > 2000) {
        healthReport.degradedProviders++;
        healthReport.alerts.push({
          level: 'warning',
          message: `Provider ${provider.id} performance is degraded`,
          providerId: provider.id,
          timestamp: new Date()
        });
      } else {
        healthReport.healthyProviders++;
      }

      // Check for quota warnings
      if (metrics.quotaUsage > 80) {
        healthReport.alerts.push({
          level: 'warning',
          message: `Provider ${provider.id} quota usage is high (${metrics.quotaUsage.toFixed(1)}%)`,
          providerId: provider.id,
          timestamp: new Date()
        });
      }

      // Check authentication status
      if (metrics.authenticationStatus === 'failed') {
        healthReport.alerts.push({
          level: 'critical',
          message: `Provider ${provider.id} authentication failed`,
          providerId: provider.id,
          timestamp: new Date()
        });
      }
    }

    // Calculate overall metrics
    healthReport.averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    healthReport.totalRequests = totalRequests;
    healthReport.successRate = totalRequests > 0 ? (totalSuccessfulRequests / totalRequests) * 100 : 0;

    // Determine overall health
    const failureRate = healthReport.failedProviders / healthReport.totalProviders;
    const degradationRate = healthReport.degradedProviders / healthReport.totalProviders;

    if (failureRate > 0.5 || healthReport.successRate < 80) {
      healthReport.overallHealth = 'critical';
    } else if (failureRate > 0.2 || degradationRate > 0.3 || healthReport.successRate < 95) {
      healthReport.overallHealth = 'degraded';
    }

    // Generate recommendations
    healthReport.recommendations = generateRecommendations(healthReport);

    const responseTime = Date.now() - startTime;
    
    logger.info('[PROVIDER-ANALYTICS] Health report generated', {
      responseTime,
      overallHealth: healthReport.overallHealth,
      totalProviders: healthReport.totalProviders,
      alertCount: healthReport.alerts.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        healthReport,
        metadata: {
          generatedAt: new Date().toISOString(),
          responseTime,
          version: '2.0'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('[PROVIDER-ANALYTICS] Health report generation failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function analyzeProviderMetrics(provider: any, supabase: any): Promise<ProviderMetrics> {
  try {
    // Get circuit breaker state
    let circuitBreakerState = 'unknown';
    let authenticationStatus: 'healthy' | 'degraded' | 'failed' = 'healthy';
    
    try {
      const circuitBreaker = CircuitBreakerManager.getCircuitBreaker(provider.id);
      circuitBreakerState = circuitBreaker.getState();
    } catch (error) {
      logger.warn(`[PROVIDER-ANALYTICS] Could not get circuit breaker state for ${provider.id}:`, error);
    }

    // Test authentication
    try {
      const providerType = provider.id.split('-')[0];
      switch (providerType) {
        case 'sabre':
          await ProviderAuthFactory.getSabreAuth().getValidToken();
          break;
        case 'amadeus':
          await ProviderAuthFactory.getAmadeusAuth().getValidToken();
          break;
        case 'hotelbeds':
          await ProviderAuthFactory.getHotelBedsAuth().authenticate();
          break;
      }
    } catch (error) {
      authenticationStatus = 'failed';
      logger.warn(`[PROVIDER-ANALYTICS] Authentication test failed for ${provider.id}:`, error);
    }

    // Get historical metrics from database
    const { data: metrics, error: metricsError } = await supabase
      .from('provider_metrics')
      .select('*')
      .eq('provider_id', provider.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    let providerMetrics: ProviderMetrics = {
      providerId: provider.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: provider.response_time || 500,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      uptime: 0,
      quotaUsage: provider.quota_usage || 0,
      costPerRequest: 0.02,
      lastHealthCheck: new Date(),
      circuitBreakerState,
      authenticationStatus
    };

    if (!metricsError && metrics && metrics.length > 0) {
      // Calculate metrics from historical data
      const responseTimes = metrics.map(m => m.response_time || 500).filter(rt => rt > 0);
      const totalRequests = metrics.reduce((sum, m) => sum + (m.request_count || 0), 0);
      const successfulRequests = metrics.reduce((sum, m) => sum + (m.successful_requests || 0), 0);

      if (responseTimes.length > 0) {
        responseTimes.sort((a, b) => a - b);
        providerMetrics.averageResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
        providerMetrics.p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
        providerMetrics.p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
      }

      providerMetrics.totalRequests = totalRequests;
      providerMetrics.successfulRequests = successfulRequests;
      providerMetrics.failedRequests = totalRequests - successfulRequests;
      providerMetrics.errorRate = totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0;
      providerMetrics.uptime = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    }

    // Cache metrics
    metricsCache.set(provider.id, providerMetrics);
    
    return providerMetrics;
  } catch (error) {
    logger.error(`[PROVIDER-ANALYTICS] Error analyzing metrics for ${provider.id}:`, error);
    
    return {
      providerId: provider.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 999999,
      p95ResponseTime: 999999,
      p99ResponseTime: 999999,
      errorRate: 100,
      uptime: 0,
      quotaUsage: 100,
      costPerRequest: 0.1,
      lastHealthCheck: new Date(),
      circuitBreakerState: 'open',
      authenticationStatus: 'failed'
    };
  }
}

async function getProviderMetrics(supabase: any, providerId: string | null): Promise<Response> {
  try {
    if (!providerId) {
      return new Response(
        JSON.stringify({ error: 'Provider ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metrics = metricsCache.get(providerId);
    if (!metrics) {
      return new Response(
        JSON.stringify({ error: 'Provider not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get detailed historical data
    const { data: history, error } = await supabase
      .from('provider_metrics')
      .select('*')
      .eq('provider_id', providerId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        history: history || [],
        responseTimeHistory: responseTimeHistory.get(providerId) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('[PROVIDER-ANALYTICS] Get provider metrics failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getPerformanceTrend(supabase: any, timeRange: string): Promise<Response> {
  try {
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
    
    const { data: trends, error } = await supabase
      .from('provider_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Group data by time intervals
    const intervalData = processPerformanceTrends(trends || [], hours);

    return new Response(
      JSON.stringify({
        success: true,
        trends: intervalData,
        timeRange,
        totalDataPoints: trends?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('[PROVIDER-ANALYTICS] Get performance trend failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getCostAnalysis(supabase: any): Promise<Response> {
  try {
    const costAnalysis = {
      totalCost: 0,
      costByProvider: {} as Record<string, number>,
      costTrend: [] as Array<{ date: string; cost: number }>,
      recommendations: [] as string[]
    };

    // Calculate costs based on usage
    for (const [providerId, metrics] of metricsCache) {
      const dailyCost = metrics.totalRequests * metrics.costPerRequest;
      costAnalysis.totalCost += dailyCost;
      costAnalysis.costByProvider[providerId] = dailyCost;
    }

    // Generate cost optimization recommendations
    if (costAnalysis.totalCost > 100) {
      costAnalysis.recommendations.push('Consider implementing request caching to reduce API calls');
    }
    
    const highCostProviders = Object.entries(costAnalysis.costByProvider)
      .filter(([_, cost]) => cost > costAnalysis.totalCost * 0.4)
      .map(([providerId, _]) => providerId);
    
    if (highCostProviders.length > 0) {
      costAnalysis.recommendations.push(`High cost providers detected: ${highCostProviders.join(', ')}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        costAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('[PROVIDER-ANALYTICS] Cost analysis failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getPredictiveScaling(supabase: any): Promise<Response> {
  try {
    const predictions = {
      nextHourDemand: 0,
      next24HourDemand: 0,
      peakTimes: [] as string[],
      scalingRecommendations: [] as string[]
    };

    // Simple prediction based on historical patterns
    const totalCurrentRequests = Array.from(metricsCache.values())
      .reduce((sum, metrics) => sum + metrics.totalRequests, 0);

    predictions.nextHourDemand = Math.round(totalCurrentRequests * 1.2);
    predictions.next24HourDemand = Math.round(totalCurrentRequests * 24 * 1.1);

    // Mock peak times (in production, this would be based on historical data)
    predictions.peakTimes = ['09:00-11:00', '14:00-16:00', '20:00-22:00'];

    if (predictions.nextHourDemand > totalCurrentRequests * 2) {
      predictions.scalingRecommendations.push('Consider enabling additional providers for expected high demand');
    }

    return new Response(
      JSON.stringify({
        success: true,
        predictions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('[PROVIDER-ANALYTICS] Predictive scaling failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getRealTimeMonitoring(supabase: any): Promise<Response> {
  try {
    const realTimeData = {
      timestamp: new Date().toISOString(),
      activeProviders: metricsCache.size,
      totalRequestsPerMinute: 0,
      averageResponseTime: 0,
      errorRate: 0,
      healthyProviders: 0,
      alerts: alertHistory.slice(-10) // Last 10 alerts
    };

    // Calculate real-time metrics
    const metrics = Array.from(metricsCache.values());
    if (metrics.length > 0) {
      realTimeData.totalRequestsPerMinute = metrics.reduce((sum, m) => sum + (m.totalRequests / 60), 0);
      realTimeData.averageResponseTime = metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length;
      realTimeData.errorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
      realTimeData.healthyProviders = metrics.filter(m => m.errorRate < 5 && m.uptime > 95).length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        realTimeData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('[PROVIDER-ANALYTICS] Real-time monitoring failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function generateRecommendations(healthReport: SystemHealthReport): string[] {
  const recommendations: string[] = [];

  if (healthReport.overallHealth === 'critical') {
    recommendations.push('URGENT: System is in critical state. Consider enabling all available providers and investigate failures immediately.');
  }

  if (healthReport.failedProviders > 0) {
    recommendations.push(`${healthReport.failedProviders} provider(s) have failed. Check authentication credentials and connectivity.`);
  }

  if (healthReport.averageResponseTime > 2000) {
    recommendations.push('High average response time detected. Consider provider load balancing optimization.');
  }

  if (healthReport.successRate < 95) {
    recommendations.push('Low success rate detected. Review circuit breaker configurations and error handling.');
  }

  const highQuotaProviders = Object.entries(healthReport.providerMetrics)
    .filter(([_, metrics]) => metrics.quotaUsage > 80)
    .map(([providerId, _]) => providerId);

  if (highQuotaProviders.length > 0) {
    recommendations.push(`High quota usage for providers: ${highQuotaProviders.join(', ')}. Consider quota optimization or upgrading plans.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('System is operating optimally. Continue monitoring for any changes.');
  }

  return recommendations;
}

function processPerformanceTrends(data: any[], hours: number): any[] {
  // Group data into time intervals
  const intervalMinutes = hours <= 1 ? 5 : hours <= 24 ? 60 : 360; // 5min, 1hour, or 6hour intervals
  const intervals: Record<string, any[]> = {};

  for (const record of data) {
    const timestamp = new Date(record.created_at);
    const intervalKey = new Date(
      Math.floor(timestamp.getTime() / (intervalMinutes * 60 * 1000)) * intervalMinutes * 60 * 1000
    ).toISOString();

    if (!intervals[intervalKey]) {
      intervals[intervalKey] = [];
    }
    intervals[intervalKey].push(record);
  }

  // Aggregate data for each interval
  return Object.entries(intervals).map(([interval, records]) => {
    const avgResponseTime = records.reduce((sum, r) => sum + (r.response_time || 0), 0) / records.length;
    const totalRequests = records.reduce((sum, r) => sum + (r.request_count || 0), 0);
    const successfulRequests = records.reduce((sum, r) => sum + (r.successful_requests || 0), 0);
    const errorRate = totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0;

    return {
      timestamp: interval,
      averageResponseTime: avgResponseTime,
      totalRequests,
      errorRate,
      providersActive: new Set(records.map(r => r.provider_id)).size
    };
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}