import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

interface UnifiedHealthData {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting comprehensive provider health check from database...');

    // Fetch provider configurations
    const { data: providerConfigs, error: configError } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('enabled', true);

    if (configError) {
      throw new Error(`Failed to fetch provider configs: ${configError.message}`);
    }

    // Fetch provider health data
    const { data: providerHealth, error: healthError } = await supabase
      .from('provider_health')
      .select('*');

    if (healthError) {
      throw new Error(`Failed to fetch provider health: ${healthError.message}`);
    }

    // Fetch provider quotas
    const { data: providerQuotas, error: quotaError } = await supabase
      .from('provider_quotas')
      .select('*');

    if (quotaError) {
      throw new Error(`Failed to fetch provider quotas: ${quotaError.message}`);
    }

    const timestamp = Date.now();
    const recommendations: string[] = [];

    // Build comprehensive provider status from database
    const providers: ProviderHealthStatus[] = providerConfigs.map(config => {
      const health = providerHealth.find(h => h.provider === config.id);
      const quota = providerQuotas.find(q => q.provider_id === config.id);
      const circuitBreaker = config.circuit_breaker as any;

      // Map status values correctly
      let status: 'healthy' | 'degraded' | 'outage' = 'outage';
      if (health?.status === 'healthy') status = 'healthy';
      else if (health?.status === 'degraded') status = 'degraded';
      else if (health?.status === 'unhealthy') status = 'outage';

      return {
        providerId: config.id,
        providerName: config.name,
        status,
        responseTime: health?.response_time_ms || 0,
        lastChecked: health?.last_checked ? new Date(health.last_checked).getTime() : timestamp,
        circuitBreakerState: circuitBreaker?.state || 'closed',
        failureCount: health?.failure_count || 0,
        quotaStatus: quota?.status || 'healthy',
        quotaPercentage: quota?.percentage_used || 0,
        credentialsValid: true, // Assume valid unless proven otherwise
        serviceTypes: [config.type]
      };
    });

    // Calculate overall summary
    const healthyProviders = providers.filter(p => p.status === 'healthy').length;
    const degradedProviders = providers.filter(p => p.status === 'degraded').length;
    const outageProviders = providers.filter(p => p.status === 'outage').length;
    const criticalQuotaProviders = providers
      .filter(p => p.quotaPercentage >= 90)
      .map(p => p.providerName);
    const circuitBreakersOpen = providers
      .filter(p => p.circuitBreakerState === 'open')
      .map(p => p.providerName);

    const overallStatus: 'healthy' | 'degraded' | 'critical' = 
      outageProviders > 0 || circuitBreakersOpen.length > 0 ? 'critical' :
      degradedProviders > 0 || criticalQuotaProviders.length > 0 ? 'degraded' : 
      'healthy';

    // Add quota-based recommendations
    if (criticalQuotaProviders.length > 0) {
      recommendations.push(`Critical quota levels detected for: ${criticalQuotaProviders.join(', ')}`);
    }

    if (overallStatus === 'healthy' && recommendations.length === 0) {
      recommendations.push('All providers are operating optimally');
    }

    const response: UnifiedHealthData = {
      overallStatus,
      timestamp,
      providers,
      summary: {
        totalProviders: providers.length,
        healthyProviders,
        degradedProviders,
        outageProviders,
        criticalQuotaProviders,
        circuitBreakersOpen
      },
      recommendations
    };

    console.log(`Provider health check completed: ${overallStatus} (${healthyProviders}/${providers.length} healthy)`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unified health monitor failed:', error);
    
    const fallbackResponse: UnifiedHealthData = {
      overallStatus: 'critical',
      timestamp: Date.now(),
      providers: [{
        providerId: 'health-monitor',
        providerName: 'Health Monitor',
        status: 'outage',
        responseTime: 0,
        lastChecked: Date.now(),
        circuitBreakerState: 'open',
        failureCount: 1,
        quotaStatus: 'unknown',
        quotaPercentage: 0,
        credentialsValid: false,
        serviceTypes: ['monitoring']
      }],
      summary: {
        totalProviders: 1,
        healthyProviders: 0,
        degradedProviders: 0,
        outageProviders: 1,
        criticalQuotaProviders: [],
        circuitBreakersOpen: ['Health Monitor']
      },
      recommendations: ['Health monitoring system is experiencing issues']
    };
    
    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});