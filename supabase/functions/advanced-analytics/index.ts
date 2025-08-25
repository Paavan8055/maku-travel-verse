import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

interface AnalyticsQuery {
  type: 'performance' | 'health' | 'correlation' | 'predictions';
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  providers?: string[];
  metrics?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const query: AnalyticsQuery = await req.json();
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    console.log(`[ANALYTICS] [${correlationId}] Processing query: ${query.type} for ${query.timeRange}`);

    let analyticsResult = {};

    switch (query.type) {
      case 'performance':
        analyticsResult = await generatePerformanceAnalytics(supabase, query);
        break;
      
      case 'health':
        analyticsResult = await generateHealthAnalytics(supabase, query);
        break;
      
      case 'correlation':
        analyticsResult = await generateCorrelationAnalytics(supabase, query);
        break;
      
      case 'predictions':
        analyticsResult = await generatePredictiveAnalytics(supabase, query);
        break;
      
      default:
        throw new Error(`Unknown analytics type: ${query.type}`);
    }

    // Store analytics snapshot
    await supabase.from('system_logs').insert({
      correlation_id: correlationId,
      service_name: 'advanced_analytics',
      log_level: 'info',
      message: `Analytics generated: ${query.type}`,
      metadata: {
        query,
        resultSummary: {
          dataPoints: Array.isArray(analyticsResult.data) ? analyticsResult.data.length : 0,
          timeRange: query.timeRange,
          providers: query.providers?.length || 'all'
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: analyticsResult,
        correlationId,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[ANALYTICS] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Analytics generation failed',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function generatePerformanceAnalytics(supabase: any, query: AnalyticsQuery) {
  const timeFilter = getTimeFilter(query.timeRange);
  
  // Get performance metrics from provider health
  const { data: healthData, error: healthError } = await supabase
    .from('provider_health')
    .select('provider, response_time_ms, status, last_checked')
    .gte('last_checked', timeFilter)
    .order('last_checked', { ascending: true });

  if (healthError) throw healthError;

  // Get system performance from logs
  const { data: logData, error: logError } = await supabase
    .from('system_logs')
    .select('service_name, duration_ms, created_at, log_level')
    .gte('created_at', timeFilter)
    .not('duration_ms', 'is', null)
    .order('created_at', { ascending: true });

  if (logError) throw logError;

  // Process performance data
  const performanceMetrics = {
    responseTimesByProvider: calculateProviderResponseTimes(healthData),
    responseTimeTrends: calculateTimeTrends(healthData, 'response_time_ms'),
    servicePerformance: calculateServicePerformance(logData),
    healthScores: calculateHealthScores(healthData),
    throughputMetrics: calculateThroughputMetrics(logData),
    bottleneckAnalysis: identifyBottlenecks(healthData, logData)
  };

  return {
    type: 'performance',
    timeRange: query.timeRange,
    data: performanceMetrics,
    summary: {
      avgResponseTime: performanceMetrics.responseTimesByProvider.overall || 0,
      healthyProviders: performanceMetrics.healthScores.healthy || 0,
      totalProviders: performanceMetrics.healthScores.total || 0,
      bottlenecks: performanceMetrics.bottleneckAnalysis.length
    }
  };
}

async function generateHealthAnalytics(supabase: any, query: AnalyticsQuery) {
  const timeFilter = getTimeFilter(query.timeRange);
  
  // Get health data
  const { data: healthData, error: healthError } = await supabase
    .from('provider_health')
    .select('*')
    .gte('last_checked', timeFilter)
    .order('last_checked', { ascending: true });

  if (healthError) throw healthError;

  // Get quota data
  const { data: quotaData, error: quotaError } = await supabase
    .from('provider_quotas')
    .select('*')
    .gte('updated_at', timeFilter);

  if (quotaError) throw quotaError;

  // Get circuit breaker events
  const { data: configData, error: configError } = await supabase
    .from('provider_configs')
    .select('*');

  if (configError) throw configError;

  const healthMetrics = {
    availabilityTrends: calculateAvailabilityTrends(healthData),
    quotaUtilization: calculateQuotaUtilization(quotaData),
    circuitBreakerHistory: calculateCircuitBreakerHistory(configData),
    errorPatterns: identifyErrorPatterns(healthData),
    recoveryTimes: calculateRecoveryTimes(healthData),
    healthDistribution: calculateHealthDistribution(healthData)
  };

  return {
    type: 'health',
    timeRange: query.timeRange,
    data: healthMetrics,
    summary: {
      overallHealth: healthMetrics.healthDistribution.healthyPercentage || 0,
      criticalProviders: healthMetrics.healthDistribution.critical || 0,
      avgRecoveryTime: healthMetrics.recoveryTimes.average || 0
    }
  };
}

async function generateCorrelationAnalytics(supabase: any, query: AnalyticsQuery) {
  const timeFilter = getTimeFilter(query.timeRange);
  
  // Get correlation tracking data
  const { data: correlationData, error: correlationError } = await supabase
    .from('correlation_tracking')
    .select('*')
    .gte('created_at', timeFilter)
    .order('created_at', { ascending: true });

  if (correlationError) throw correlationError;

  const correlationMetrics = {
    requestTypeDistribution: calculateRequestDistribution(correlationData),
    completionRates: calculateCompletionRates(correlationData),
    durationAnalysis: analyzeDurations(correlationData),
    userJourneyAnalysis: analyzeUserJourneys(correlationData),
    failurePatterns: identifyFailurePatterns(correlationData),
    correlationFlow: mapCorrelationFlow(correlationData)
  };

  return {
    type: 'correlation',
    timeRange: query.timeRange,
    data: correlationMetrics,
    summary: {
      totalRequests: correlationData.length,
      completionRate: correlationMetrics.completionRates.overall || 0,
      avgDuration: correlationMetrics.durationAnalysis.average || 0
    }
  };
}

async function generatePredictiveAnalytics(supabase: any, query: AnalyticsQuery) {
  const timeFilter = getTimeFilter(query.timeRange);
  
  // Get historical data for predictions
  const { data: healthData, error: healthError } = await supabase
    .from('provider_health')
    .select('*')
    .gte('last_checked', timeFilter)
    .order('last_checked', { ascending: true });

  if (healthError) throw healthError;

  const { data: quotaData, error: quotaError } = await supabase
    .from('provider_quotas')
    .select('*')
    .gte('updated_at', timeFilter);

  if (quotaError) throw quotaError;

  const predictions = {
    quotaProjections: predictQuotaUsage(quotaData),
    healthForecasts: predictHealthTrends(healthData),
    capacityRecommendations: generateCapacityRecommendations(healthData, quotaData),
    riskAssessment: assessSystemRisks(healthData, quotaData),
    optimizationSuggestions: generateOptimizationSuggestions(healthData, quotaData),
    alertPredictions: predictFutureAlerts(healthData, quotaData)
  };

  return {
    type: 'predictions',
    timeRange: query.timeRange,
    data: predictions,
    summary: {
      riskLevel: predictions.riskAssessment.overallRisk || 'low',
      criticalAlerts: predictions.alertPredictions.critical || 0,
      optimizationOpportunities: predictions.optimizationSuggestions.length || 0
    }
  };
}

// Helper functions for calculations
function getTimeFilter(timeRange: string): string {
  const now = new Date();
  switch (timeRange) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

function calculateProviderResponseTimes(healthData: any[]) {
  const byProvider: Record<string, number[]> = {};
  
  healthData.forEach(entry => {
    if (!byProvider[entry.provider]) byProvider[entry.provider] = [];
    if (entry.response_time_ms) byProvider[entry.provider].push(entry.response_time_ms);
  });

  const result: Record<string, number> = {};
  Object.entries(byProvider).forEach(([provider, times]) => {
    result[provider] = times.reduce((sum, time) => sum + time, 0) / times.length;
  });

  const allTimes = Object.values(byProvider).flat();
  result.overall = allTimes.length > 0 ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length : 0;

  return result;
}

function calculateTimeTrends(data: any[], field: string) {
  // Simplified trend calculation - in production would use more sophisticated algorithms
  const points = data.map(entry => ({
    timestamp: entry.last_checked || entry.created_at,
    value: entry[field]
  })).filter(point => point.value !== null);

  return {
    points,
    trend: points.length > 1 ? (points[points.length - 1].value - points[0].value) / points.length : 0
  };
}

function calculateServicePerformance(logData: any[]) {
  const byService: Record<string, number[]> = {};
  
  logData.forEach(log => {
    if (!byService[log.service_name]) byService[log.service_name] = [];
    if (log.duration_ms) byService[log.service_name].push(log.duration_ms);
  });

  return Object.entries(byService).map(([service, durations]) => ({
    service,
    avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    totalCalls: durations.length,
    p95: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)] || 0
  }));
}

function calculateHealthScores(healthData: any[]) {
  const latest = healthData.reduce((acc, entry) => {
    if (!acc[entry.provider] || new Date(entry.last_checked) > new Date(acc[entry.provider].last_checked)) {
      acc[entry.provider] = entry;
    }
    return acc;
  }, {});

  const providers = Object.values(latest);
  const healthy = providers.filter((p: any) => p.status === 'healthy').length;

  return {
    total: providers.length,
    healthy,
    degraded: providers.filter((p: any) => p.status === 'degraded').length,
    outage: providers.filter((p: any) => p.status === 'outage').length,
    healthyPercentage: providers.length > 0 ? (healthy / providers.length) * 100 : 0
  };
}

function calculateThroughputMetrics(logData: any[]) {
  const timeWindows = groupByTimeWindow(logData, 60000); // 1-minute windows
  return timeWindows.map(window => ({
    timestamp: window.timestamp,
    requestCount: window.logs.length,
    avgDuration: window.logs.reduce((sum: number, log: any) => sum + (log.duration_ms || 0), 0) / window.logs.length
  }));
}

function identifyBottlenecks(healthData: any[], logData: any[]) {
  const bottlenecks = [];
  
  // Identify slow providers
  const avgResponseTimes = calculateProviderResponseTimes(healthData);
  Object.entries(avgResponseTimes).forEach(([provider, avgTime]) => {
    if (avgTime > 2000) { // > 2 seconds
      bottlenecks.push({
        type: 'slow_provider',
        provider,
        metric: 'response_time',
        value: avgTime,
        severity: avgTime > 5000 ? 'critical' : 'high'
      });
    }
  });

  return bottlenecks;
}

function groupByTimeWindow(data: any[], windowMs: number) {
  const windows: Record<number, any> = {};
  
  data.forEach(item => {
    const timestamp = new Date(item.created_at).getTime();
    const windowStart = Math.floor(timestamp / windowMs) * windowMs;
    
    if (!windows[windowStart]) {
      windows[windowStart] = { timestamp: windowStart, logs: [] };
    }
    windows[windowStart].logs.push(item);
  });

  return Object.values(windows);
}

// Additional helper functions would continue with similar patterns...
function calculateAvailabilityTrends(data: any[]) { return {}; }
function calculateQuotaUtilization(data: any[]) { return {}; }
function calculateCircuitBreakerHistory(data: any[]) { return {}; }
function identifyErrorPatterns(data: any[]) { return {}; }
function calculateRecoveryTimes(data: any[]) { return { average: 0 }; }
function calculateHealthDistribution(data: any[]) { return { healthyPercentage: 0, critical: 0 }; }
function calculateRequestDistribution(data: any[]) { return {}; }
function calculateCompletionRates(data: any[]) { return { overall: 0 }; }
function analyzeDurations(data: any[]) { return { average: 0 }; }
function analyzeUserJourneys(data: any[]) { return {}; }
function identifyFailurePatterns(data: any[]) { return {}; }
function mapCorrelationFlow(data: any[]) { return {}; }
function predictQuotaUsage(data: any[]) { return {}; }
function predictHealthTrends(data: any[]) { return {}; }
function generateCapacityRecommendations(healthData: any[], quotaData: any[]) { return {}; }
function assessSystemRisks(healthData: any[], quotaData: any[]) { return { overallRisk: 'low' }; }
function generateOptimizationSuggestions(healthData: any[], quotaData: any[]) { return []; }
function predictFutureAlerts(healthData: any[], quotaData: any[]) { return { critical: 0 }; }