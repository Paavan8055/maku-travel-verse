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

    console.log('Starting comprehensive provider health check...');

    const providers: ProviderHealthStatus[] = [];
    const timestamp = Date.now();
    const recommendations: string[] = [];

    // Check Amadeus Provider
    const amadeusStart = Date.now();
    try {
      const { data: amadeusResponse, error } = await supabase.functions.invoke('amadeus-health');
      const responseTime = Date.now() - amadeusStart;
      
      let status: 'healthy' | 'degraded' | 'outage' = 'healthy';
      let credentialsValid = true;
      
      if (error || !amadeusResponse?.success) {
        status = 'outage';
        credentialsValid = false;
        recommendations.push('Amadeus API credentials may be invalid or service is down');
      }

      // Get quota info for Amadeus
      const { data: amadeusQuota } = await supabase
        .from('provider_quotas')
        .select('*')
        .like('provider_id', 'amadeus%')
        .limit(1)
        .single();

      const quotaPercentage = amadeusQuota?.percentage_used || 0;
      const quotaStatus = amadeusQuota?.status || 'healthy';

      providers.push({
        providerId: 'amadeus',
        providerName: 'Amadeus',
        status,
        responseTime,
        lastChecked: timestamp,
        circuitBreakerState: 'closed',
        failureCount: 0,
        quotaStatus,
        quotaPercentage,
        credentialsValid,
        serviceTypes: ['flight', 'hotel', 'activity']
      });
    } catch (error) {
      providers.push({
        providerId: 'amadeus',
        providerName: 'Amadeus',
        status: 'outage',
        responseTime: Date.now() - amadeusStart,
        lastChecked: timestamp,
        circuitBreakerState: 'open',
        failureCount: 1,
        quotaStatus: 'unknown',
        quotaPercentage: 0,
        credentialsValid: false,
        serviceTypes: ['flight', 'hotel', 'activity']
      });
      recommendations.push('Amadeus provider is completely unavailable');
    }

    // Check Stripe Provider (Payment System)
    const stripeStart = Date.now();
    try {
      // Simple health check - just verify we can access basic info
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      const credentialsValid = !!stripeKey;
      
      providers.push({
        providerId: 'stripe',
        providerName: 'Stripe',
        status: credentialsValid ? 'healthy' : 'degraded',
        responseTime: Date.now() - stripeStart,
        lastChecked: timestamp,
        circuitBreakerState: 'closed',
        failureCount: 0,
        quotaStatus: 'healthy',
        quotaPercentage: 0,
        credentialsValid,
        serviceTypes: ['payment']
      });

      if (!credentialsValid) {
        recommendations.push('Stripe credentials are missing or invalid');
      }
    } catch (error) {
      providers.push({
        providerId: 'stripe',
        providerName: 'Stripe',
        status: 'outage',
        responseTime: Date.now() - stripeStart,
        lastChecked: timestamp,
        circuitBreakerState: 'open',
        failureCount: 1,
        quotaStatus: 'unknown',
        quotaPercentage: 0,
        credentialsValid: false,
        serviceTypes: ['payment']
      });
      recommendations.push('Stripe payment system is unavailable');
    }

    // Check HotelBeds Provider
    const hotelbedsStart = Date.now();
    try {
      const hotelbedsKey = Deno.env.get('HOTELBEDS_API_KEY');
      const credentialsValid = !!hotelbedsKey;
      
      // Get quota info for HotelBeds
      const { data: hotelbedsQuota } = await supabase
        .from('provider_quotas')
        .select('*')
        .like('provider_id', 'hotelbeds%')
        .limit(1)
        .single();

      const quotaPercentage = hotelbedsQuota?.percentage_used || 0;
      const quotaStatus = hotelbedsQuota?.status || 'healthy';

      providers.push({
        providerId: 'hotelbeds',
        providerName: 'HotelBeds',
        status: credentialsValid ? 'healthy' : 'degraded',
        responseTime: Date.now() - hotelbedsStart,
        lastChecked: timestamp,
        circuitBreakerState: 'closed',
        failureCount: 0,
        quotaStatus,
        quotaPercentage,
        credentialsValid,
        serviceTypes: ['hotel', 'activity']
      });

      if (!credentialsValid) {
        recommendations.push('HotelBeds credentials need verification');
      }
    } catch (error) {
      providers.push({
        providerId: 'hotelbeds',
        providerName: 'HotelBeds',
        status: 'outage',
        responseTime: Date.now() - hotelbedsStart,
        lastChecked: timestamp,
        circuitBreakerState: 'open',
        failureCount: 1,
        quotaStatus: 'unknown',
        quotaPercentage: 0,
        credentialsValid: false,
        serviceTypes: ['hotel', 'activity']
      });
      recommendations.push('HotelBeds provider is unavailable');
    }

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