import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { 
  validateProviderCredentials, 
  validateHotelBedsCredentials 
} from "../_shared/config.ts";

interface ProviderHealthStatus {
  providerId: string;
  providerName: string;
  status: 'healthy' | 'degraded' | 'outage';
  responseTime: number;
  lastChecked: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  failureCount: number;
  quotaStatus: string;
  quotaPercentage: number;
  credentialsValid: boolean;
  serviceTypes: string[];
}

interface UnifiedHealthResponse {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  timestamp: number;
  providers: ProviderHealthStatus[];
  summary: {
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    outageProviders: number;
    criticalQuotaProviders: string[];
    circuitBreakersOpen: string[];
  };
  recommendations: string[];
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[UNIFIED-HEALTH] Starting comprehensive health check');
    
    const healthData = await performUnifiedHealthCheck();
    
    // Store health data in database for historical tracking
    await storeHealthData(healthData);
    
    // Update circuit breaker states if needed
    await updateCircuitBreakers(healthData.providers);
    
    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[UNIFIED-HEALTH] Health check failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Health check failed', 
        details: error.message,
        overallStatus: 'critical',
        timestamp: Date.now()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function performUnifiedHealthCheck(): Promise<UnifiedHealthResponse> {
  const timestamp = Date.now();
  const providers: ProviderHealthStatus[] = [];
  
  // Get provider configurations and current quotas
  const { data: providerConfigs } = await supabase
    .from('provider_configs')
    .select('*');
    
  const { data: quotaData } = await supabase
    .from('provider_quotas')
    .select('*');
    
  const quotaMap = new Map(quotaData?.map(q => [q.provider_id, q]) || []);
  
  // Check each provider
  for (const config of providerConfigs || []) {
    const quota = quotaMap.get(config.id);
    const healthStatus = await checkProviderHealth(config, quota);
    providers.push(healthStatus);
  }
  
  // Calculate overall health
  const summary = calculateHealthSummary(providers);
  const overallStatus = determineOverallStatus(summary);
  const recommendations = generateRecommendations(providers, summary);
  
  return {
    overallStatus,
    timestamp,
    providers,
    summary,
    recommendations
  };
}

async function checkProviderHealth(
  config: any, 
  quota: any
): Promise<ProviderHealthStatus> {
  const startTime = Date.now();
  let status: 'healthy' | 'degraded' | 'outage' = 'healthy';
  let responseTime = 0;
  let failureCount = 0;
  
  try {
    // Get circuit breaker state from database
    const { data: circuitData } = await supabase
      .from('provider_health')
      .select('*')
      .eq('provider', config.id)
      .order('last_checked', { ascending: false })
      .limit(1)
      .single();
    
    // Validate credentials based on provider type
    const credentialsValid = config.id.includes('hotelbeds') ? 
      validateHotelBedsCredentials() : 
      validateProviderCredentials(config.id);
    
    // Perform actual health check based on provider type
    const healthResult = await performProviderHealthCheck(config.id);
    status = healthResult.status;
    responseTime = Date.now() - startTime;
    failureCount = healthResult.failureCount || 0;
    
    // Store health check result
    await supabase
      .from('provider_health')
      .insert({
        provider: config.id,
        status,
        response_time_ms: responseTime,
        last_checked: new Date().toISOString(),
        metadata: {
          credentialsValid,
          quotaStatus: quota?.status || 'unknown',
          serviceTypes: getProviderServiceTypes(config.id)
        }
      });
      
  } catch (error) {
    logger.error(`[UNIFIED-HEALTH] Provider ${config.id} health check failed:`, error);
    status = 'outage';
    responseTime = Date.now() - startTime;
    failureCount = (failureCount || 0) + 1;
  }
  
  return {
    providerId: config.id,
    providerName: config.name,
    status,
    responseTime,
    lastChecked: Date.now(),
    circuitBreakerState: determineCircuitBreakerState(config.id, status, failureCount),
    failureCount,
    quotaStatus: quota?.status || 'unknown',
    quotaPercentage: quota?.percentage_used || 0,
    credentialsValid: config.id.includes('hotelbeds') ? 
      validateHotelBedsCredentials() : 
      validateProviderCredentials(config.id),
    serviceTypes: getProviderServiceTypes(config.id)
  };
}

async function performProviderHealthCheck(providerId: string): Promise<{ status: 'healthy' | 'degraded' | 'outage', failureCount?: number }> {
  // Use the provider-rotation function to perform actual health checks
  try {
    const response = await supabase.functions.invoke('provider-rotation', {
      body: {
        action: 'health-check',
        providerId: providerId
      }
    });
    
    if (response.error) {
      return { status: 'outage', failureCount: 1 };
    }
    
    return { status: 'healthy', failureCount: 0 };
  } catch (error) {
    logger.warn(`[UNIFIED-HEALTH] Direct health check failed for ${providerId}, marking as degraded`);
    return { status: 'degraded', failureCount: 1 };
  }
}

function getProviderServiceTypes(providerId: string): string[] {
  const serviceMap: { [key: string]: string[] } = {
    'amadeus-hotel': ['hotel'],
    'amadeus-flight': ['flight'],
    'amadeus-activity': ['activity'],
    'hotelbeds-hotel': ['hotel'],
    'hotelbeds-activity': ['activity'],
    'sabre-flight': ['flight'],
    'sabre-hotel': ['hotel']
  };
  
  return serviceMap[providerId] || [];
}

function determineCircuitBreakerState(
  providerId: string, 
  status: string, 
  failureCount: number
): 'closed' | 'open' | 'half-open' {
  if (status === 'outage' || failureCount >= 5) {
    return 'open';
  }
  if (status === 'degraded' || failureCount > 0) {
    return 'half-open';
  }
  return 'closed';
}

function calculateHealthSummary(providers: ProviderHealthStatus[]) {
  const totalProviders = providers.length;
  const healthyProviders = providers.filter(p => p.status === 'healthy').length;
  const degradedProviders = providers.filter(p => p.status === 'degraded').length;
  const outageProviders = providers.filter(p => p.status === 'outage').length;
  const criticalQuotaProviders = providers
    .filter(p => p.quotaStatus === 'critical' || p.quotaPercentage >= 90)
    .map(p => p.providerId);
  const circuitBreakersOpen = providers
    .filter(p => p.circuitBreakerState === 'open')
    .map(p => p.providerId);
  
  return {
    totalProviders,
    healthyProviders,
    degradedProviders,
    outageProviders,
    criticalQuotaProviders,
    circuitBreakersOpen
  };
}

function determineOverallStatus(summary: any): 'healthy' | 'degraded' | 'critical' {
  if (summary.outageProviders > 0 || summary.circuitBreakersOpen.length > 0) {
    return 'critical';
  }
  if (summary.degradedProviders > 0 || summary.criticalQuotaProviders.length > 0) {
    return 'degraded';
  }
  return 'healthy';
}

function generateRecommendations(providers: ProviderHealthStatus[], summary: any): string[] {
  const recommendations: string[] = [];
  
  if (summary.criticalQuotaProviders.length > 0) {
    recommendations.push(`Critical quota levels detected for: ${summary.criticalQuotaProviders.join(', ')}. Consider implementing throttling or switching providers.`);
  }
  
  if (summary.circuitBreakersOpen.length > 0) {
    recommendations.push(`Circuit breakers open for: ${summary.circuitBreakersOpen.join(', ')}. Manual intervention may be required.`);
  }
  
  if (summary.outageProviders > 0) {
    recommendations.push(`${summary.outageProviders} provider(s) experiencing outages. Check provider status pages and consider failover.`);
  }
  
  if (summary.healthyProviders < summary.totalProviders * 0.5) {
    recommendations.push('Less than 50% of providers are healthy. Consider emergency maintenance mode.');
  }
  
  // Check for slow response times
  const slowProviders = providers.filter(p => p.responseTime > 5000);
  if (slowProviders.length > 0) {
    recommendations.push(`Slow response times detected: ${slowProviders.map(p => p.providerId).join(', ')}. Monitor for performance issues.`);
  }
  
  return recommendations;
}

async function storeHealthData(healthData: UnifiedHealthResponse): Promise<void> {
  try {
    // Store summary health data
    await supabase
      .from('system_health_snapshots')
      .insert({
        timestamp: new Date(healthData.timestamp).toISOString(),
        overall_status: healthData.overallStatus,
        total_providers: healthData.summary.totalProviders,
        healthy_providers: healthData.summary.healthyProviders,
        degraded_providers: healthData.summary.degradedProviders,
        outage_providers: healthData.summary.outageProviders,
        critical_quota_providers: healthData.summary.criticalQuotaProviders,
        circuit_breakers_open: healthData.summary.circuitBreakersOpen,
        recommendations: healthData.recommendations
      });
      
    logger.info('[UNIFIED-HEALTH] Health data stored successfully');
  } catch (error) {
    logger.error('[UNIFIED-HEALTH] Failed to store health data:', error);
  }
}

async function updateCircuitBreakers(providers: ProviderHealthStatus[]): Promise<void> {
  for (const provider of providers) {
    try {
      await supabase
        .from('provider_configs')
        .update({
          circuit_breaker_state: provider.circuitBreakerState,
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.providerId);
    } catch (error) {
      logger.error(`[UNIFIED-HEALTH] Failed to update circuit breaker for ${provider.providerId}:`, error);
    }
  }
}