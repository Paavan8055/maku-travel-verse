import { corsHeaders } from '../_shared/cors.ts';
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';


interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
}

interface ProviderHealthResult {
  providerId: string;
  status: 'healthy' | 'degraded' | 'outage';
  responseTime: number;
  errorCount: number;
  lastChecked: string;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  credentialsValid: boolean;
  serviceEndpoints: Record<string, boolean>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, providerId } = await req.json().catch(() => ({}));

    // Handle circuit breaker reset
    if (action === 'reset-circuit-breaker' && providerId) {
      console.log(`[ENHANCED-HEALTH] Resetting circuit breaker for ${providerId}`);
      
      // Update provider health to reset circuit breaker
      const { error: updateError } = await supabase
        .from('provider_health')
        .update({
          status: 'healthy',
          error_count: 0,
          last_checked: new Date().toISOString()
        })
        .eq('provider', providerId);

      if (updateError) {
        throw new Error(`Failed to reset circuit breaker: ${updateError.message}`);
      }

      // Log the reset action
      await supabase.from('system_logs').insert({
        correlation_id: crypto.randomUUID(),
        service_name: 'enhanced-provider-health',
        log_level: 'info',
        message: `Circuit breaker reset for provider ${providerId}`,
        metadata: { providerId, action: 'circuit_breaker_reset' }
      });

      return new Response(
        JSON.stringify({ success: true, message: `Circuit breaker reset for ${providerId}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced health check for all providers
    console.log('[ENHANCED-HEALTH] Starting enhanced provider health check');

    // Get all enabled providers
    const { data: providers, error: providersError } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('enabled', true);

    if (providersError) {
      throw new Error(`Failed to fetch providers: ${providersError.message}`);
    }

    const healthResults: ProviderHealthResult[] = [];

    for (const provider of providers || []) {
      try {
        const healthResult = await checkProviderHealth(provider, supabase);
        healthResults.push(healthResult);
      } catch (error) {
        console.error(`[ENHANCED-HEALTH] Failed to check ${provider.id}:`, error);
        
        // Create failed health result
        healthResults.push({
          providerId: provider.id,
          status: 'outage',
          responseTime: 0,
          errorCount: 999,
          lastChecked: new Date().toISOString(),
          circuitBreakerState: 'open',
          credentialsValid: false,
          serviceEndpoints: {}
        });
      }
    }

    // Update provider health table
    for (const result of healthResults) {
      await supabase
        .from('provider_health')
        .upsert({
          provider: result.providerId,
          status: result.status,
          response_time_ms: result.responseTime,
          error_count: result.errorCount,
          last_checked: result.lastChecked,
          circuit_breaker_state: result.circuitBreakerState,
          credentials_valid: result.credentialsValid,
          service_endpoints: result.serviceEndpoints
        });
    }

    // Calculate overall system health
    const totalProviders = healthResults.length;
    const healthyCount = healthResults.filter(r => r.status === 'healthy').length;
    const degradedCount = healthResults.filter(r => r.status === 'degraded').length;
    const outageCount = healthResults.filter(r => r.status === 'outage').length;

    const overallStatus = 
      outageCount > totalProviders / 2 ? 'critical' :
      degradedCount > 0 || outageCount > 0 ? 'degraded' : 'healthy';

    // Generate recommendations
    const recommendations: string[] = [];
    if (outageCount > 0) {
      recommendations.push(`${outageCount} provider(s) are experiencing outages. Check credentials and endpoints.`);
    }
    if (degradedCount > 0) {
      recommendations.push(`${degradedCount} provider(s) are degraded. Monitor response times and error rates.`);
    }
    
    const openCircuitBreakers = healthResults.filter(r => r.circuitBreakerState === 'open');
    if (openCircuitBreakers.length > 0) {
      recommendations.push(`${openCircuitBreakers.length} circuit breaker(s) are open. Consider manual reset if issues are resolved.`);
    }

    console.log(`[ENHANCED-HEALTH] Completed health check: ${healthyCount}/${totalProviders} healthy`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: Date.now(),
        overallStatus,
        totalProviders,
        healthyProviders: healthyCount,
        degradedProviders: degradedCount,
        outageProviders: outageCount,
        providers: healthResults,
        recommendations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ENHANCED-HEALTH] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: Date.now()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function checkProviderHealth(provider: ProviderConfig, supabase: any): Promise<ProviderHealthResult> {
  const startTime = Date.now();
  
  try {
    // Check credentials validity by attempting a basic API call
    let credentialsValid = false;
    const serviceEndpoints: Record<string, boolean> = {};

    // Test provider-specific endpoints
    if (provider.id.includes('amadeus')) {
      credentialsValid = await testAmadeusCredentials();
      serviceEndpoints['authentication'] = credentialsValid;
      serviceEndpoints['flight_search'] = credentialsValid;
      serviceEndpoints['hotel_search'] = credentialsValid;
    } else if (provider.id.includes('sabre')) {
      credentialsValid = await testSabreCredentials();
      serviceEndpoints['authentication'] = credentialsValid;
      serviceEndpoints['flight_search'] = credentialsValid;
      serviceEndpoints['hotel_search'] = credentialsValid;
    } else if (provider.id.includes('hotelbeds')) {
      credentialsValid = await testHotelBedsCredentials();
      serviceEndpoints['authentication'] = credentialsValid;
      serviceEndpoints['hotel_search'] = credentialsValid;
      serviceEndpoints['activity_search'] = credentialsValid;
    }

    const responseTime = Date.now() - startTime;
    
    // Determine status based on response time and credentials
    let status: 'healthy' | 'degraded' | 'outage';
    let circuitBreakerState: 'closed' | 'open' | 'half-open';
    
    if (!credentialsValid) {
      status = 'outage';
      circuitBreakerState = 'open';
    } else if (responseTime > 5000) {
      status = 'degraded';
      circuitBreakerState = 'half-open';
    } else {
      status = 'healthy';
      circuitBreakerState = 'closed';
    }

    // Get error count from database
    const { data: healthData } = await supabase
      .from('provider_health')
      .select('error_count')
      .eq('provider', provider.id)
      .single();

    const errorCount = healthData?.error_count || 0;

    return {
      providerId: provider.id,
      status,
      responseTime,
      errorCount,
      lastChecked: new Date().toISOString(),
      circuitBreakerState,
      credentialsValid,
      serviceEndpoints
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      providerId: provider.id,
      status: 'outage',
      responseTime,
      errorCount: 999,
      lastChecked: new Date().toISOString(),
      circuitBreakerState: 'open',
      credentialsValid: false,
      serviceEndpoints: {}
    };
  }
}

async function testAmadeusCredentials(): Promise<boolean> {
  // Simulate Amadeus credential test
  // In production, this would make a real API call to Amadeus
  return Math.random() > 0.1; // 90% success rate for demo
}

async function testSabreCredentials(): Promise<boolean> {
  // Simulate Sabre credential test
  // In production, this would make a real API call to Sabre
  return Math.random() > 0.2; // 80% success rate for demo
}

async function testHotelBedsCredentials(): Promise<boolean> {
  // Simulate HotelBeds credential test
  // In production, this would make a real API call to HotelBeds
  return Math.random() > 0.15; // 85% success rate for demo
}