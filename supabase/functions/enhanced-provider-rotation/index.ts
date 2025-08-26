import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CircuitBreakerState {
  failureCount: number;
  lastFailure: number | null;
  timeout: number;
  state: 'closed' | 'open' | 'half-open';
}

interface ProviderMetrics {
  providerId: string;
  healthScore: number;
  successRate: number;
  averageResponseTime: number;
  quotaUsage: number;
  costPerRequest: number;
  weight: number;
  circuitBreaker: CircuitBreakerState;
}

interface EnhancedRotationRequest {
  searchType: 'flight' | 'hotel' | 'activity';
  params: any;
  excludedProviders?: string[];
  selectionCriteria?: {
    prioritizeSpeed?: boolean;
    prioritizeCost?: boolean;
    prioritizeReliability?: boolean;
    maxResponseTime?: number;
    minSuccessRate?: number;
  };
}

const providerMetrics = new Map<string, ProviderMetrics>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { searchType, params, excludedProviders = [], selectionCriteria = {} }: EnhancedRotationRequest = await req.json();
    
    logger.info('[ENHANCED-PROVIDER-ROTATION] Starting enhanced provider selection', { 
      searchType, 
      excludedProviders,
      criteria: selectionCriteria 
    });

    // Get available providers with circuit breaker check
    const providers = await getAvailableProvidersWithCircuitBreaker(supabase, searchType, excludedProviders);
    
    if (providers.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No available providers',
        data: await getFallbackData(searchType),
        provider: 'Fallback',
        providerId: 'fallback',
        fallbackUsed: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Apply weighted selection with criteria
    const selectedProvider = selectProviderWithWeighting(providers, selectionCriteria);
    
    if (!selectedProvider) {
      throw new Error('No suitable provider found after weighted selection');
    }

    logger.info('[ENHANCED-PROVIDER-ROTATION] Selected provider with weighting', { 
      selectedProvider: selectedProvider.id,
      weight: selectedProvider.weight,
      healthScore: selectedProvider.healthScore
    });

    // Execute request with circuit breaker
    const result = await executeWithCircuitBreaker(supabase, selectedProvider, params);
    
    if (result.success) {
      // Update success metrics
      updateProviderMetrics(selectedProvider.id, true, result.responseTime, result.quotaUsage || 0);
      
      return new Response(JSON.stringify({
        success: true,
        data: result.data,
        provider: selectedProvider.name,
        providerId: selectedProvider.id,
        responseTime: result.responseTime,
        fallbackUsed: false,
        weight: selectedProvider.weight,
        healthScore: selectedProvider.healthScore
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error(result.error || 'Provider request failed');
    }

  } catch (error) {
    logger.error('[ENHANCED-PROVIDER-ROTATION] Request failed', { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: await getFallbackData('flight'),
      provider: 'Error',
      providerId: 'error',
      fallbackUsed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function getAvailableProvidersWithCircuitBreaker(
  supabase: any, 
  searchType: string, 
  excludedProviders: string[]
): Promise<ProviderMetrics[]> {
  try {
    // Get providers from database with quota awareness
    const { data: dbProviders, error } = await supabase
      .rpc('get_quota_aware_providers', {
        p_search_type: searchType,
        p_excluded_providers: excludedProviders
      });

    if (error) {
      logger.warn('[ENHANCED-PROVIDER-ROTATION] Database query failed, using defaults', { error });
      return getDefaultProviders(searchType, excludedProviders);
    }

    // Convert to provider metrics with circuit breaker state
    const providers = dbProviders
      .filter((p: any) => isProviderCredentialsValid(p.provider_id))
      .map((p: any) => {
        const existing = providerMetrics.get(p.provider_id);
        return {
          providerId: p.provider_id,
          name: p.provider_name,
          type: searchType,
          priority: p.priority,
          healthScore: existing?.healthScore || (p.quota_status === 'healthy' ? 95 : 70),
          successRate: existing?.successRate || 98,
          averageResponseTime: existing?.averageResponseTime || 500,
          quotaUsage: p.percentage_used || 0,
          costPerRequest: existing?.costPerRequest || 0.015,
          weight: existing?.weight || 100,
          circuitBreaker: existing?.circuitBreaker || {
            failureCount: 0,
            lastFailure: null,
            timeout: 60000,
            state: 'closed'
          }
        };
      })
      .filter((provider: ProviderMetrics) => isCircuitBreakerClosed(provider.circuitBreaker));

    return providers;

  } catch (error) {
    logger.error('[ENHANCED-PROVIDER-ROTATION] Failed to get providers', { error });
    return getDefaultProviders(searchType, excludedProviders);
  }
}

function selectProviderWithWeighting(
  providers: ProviderMetrics[], 
  criteria: any
): ProviderMetrics | null {
  if (providers.length === 0) return null;

  // Apply criteria-based weight adjustments
  const weightedProviders = providers.map(provider => {
    let adjustedWeight = provider.weight;

    // Speed optimization
    if (criteria.prioritizeSpeed) {
      adjustedWeight *= (2000 / Math.max(provider.averageResponseTime, 100));
    }
    
    // Cost optimization
    if (criteria.prioritizeCost) {
      adjustedWeight *= (0.1 / Math.max(provider.costPerRequest, 0.001));
    }
    
    // Reliability optimization
    if (criteria.prioritizeReliability) {
      adjustedWeight *= (provider.successRate / 100);
    }

    // Apply filters
    if (criteria.maxResponseTime && provider.averageResponseTime > criteria.maxResponseTime) {
      adjustedWeight = 0;
    }
    
    if (criteria.minSuccessRate && provider.successRate < criteria.minSuccessRate) {
      adjustedWeight = 0;
    }

    return { ...provider, weight: Math.max(adjustedWeight, 0) };
  }).filter(p => p.weight > 0);

  if (weightedProviders.length === 0) return null;

  // Weighted random selection
  const totalWeight = weightedProviders.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const provider of weightedProviders) {
    random -= provider.weight;
    if (random <= 0) {
      return provider;
    }
  }

  return weightedProviders[0];
}

async function executeWithCircuitBreaker(
  supabase: any, 
  provider: ProviderMetrics, 
  params: any
): Promise<{ success: boolean; data?: any; error?: string; responseTime: number; quotaUsage?: number }> {
  const startTime = Date.now();

  try {
    // Check circuit breaker
    if (!isCircuitBreakerClosed(provider.circuitBreaker)) {
      throw new Error(`Circuit breaker is ${provider.circuitBreaker.state} for provider ${provider.providerId}`);
    }

    // Map provider to function
    const functionMap: Record<string, string> = {
      'amadeus-flight': 'amadeus-flight-search',
      'sabre-flight': 'sabre-flight-search',
      'amadeus-hotel': 'amadeus-hotel-search',
      'hotelbeds-hotel': 'hotelbeds-search',
      'sabre-hotel': 'sabre-hotel-search',
      'amadeus-activity': 'amadeus-activity-search',
      'hotelbeds-activity': 'hotelbeds-activities'
    };

    const functionName = functionMap[provider.providerId];
    if (!functionName) {
      throw new Error(`Unknown provider function: ${provider.providerId}`);
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: params
    });

    const responseTime = Date.now() - startTime;

    if (error) {
      updateCircuitBreakerOnFailure(provider.providerId);
      throw new Error(`Provider ${provider.providerId} failed: ${error.message}`);
    }

    // Success - reset circuit breaker if needed
    if (provider.circuitBreaker.state === 'half-open') {
      resetCircuitBreaker(provider.providerId);
    }

    return {
      success: true,
      data: data?.data || data,
      responseTime,
      quotaUsage: provider.quotaUsage
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    updateCircuitBreakerOnFailure(provider.providerId);
    
    return {
      success: false,
      error: error.message,
      responseTime
    };
  }
}

function updateProviderMetrics(
  providerId: string,
  success: boolean,
  responseTime: number,
  quotaUsage: number
): void {
  const existing = providerMetrics.get(providerId) || createDefaultMetrics(providerId);
  
  // Exponential moving average
  const alpha = 0.3;
  existing.successRate = (alpha * (success ? 100 : 0)) + ((1 - alpha) * existing.successRate);
  existing.averageResponseTime = (alpha * responseTime) + ((1 - alpha) * existing.averageResponseTime);
  existing.quotaUsage = quotaUsage;
  
  // Update health score
  existing.healthScore = calculateHealthScore(existing);
  
  // Update weight
  existing.weight = calculateWeight(existing);
  
  providerMetrics.set(providerId, existing);
}

function updateCircuitBreakerOnFailure(providerId: string): void {
  const provider = providerMetrics.get(providerId);
  if (!provider) return;

  provider.circuitBreaker.failureCount++;
  provider.circuitBreaker.lastFailure = Date.now();

  if (provider.circuitBreaker.failureCount >= 5) {
    provider.circuitBreaker.state = 'open';
    logger.warn(`Circuit breaker opened for provider ${providerId}`, {
      failureCount: provider.circuitBreaker.failureCount
    });
  }

  providerMetrics.set(providerId, provider);
}

function resetCircuitBreaker(providerId: string): void {
  const provider = providerMetrics.get(providerId);
  if (!provider) return;

  provider.circuitBreaker.state = 'closed';
  provider.circuitBreaker.failureCount = 0;
  provider.circuitBreaker.lastFailure = null;

  providerMetrics.set(providerId, provider);
  
  logger.info(`Circuit breaker reset for provider ${providerId}`);
}

function isCircuitBreakerClosed(circuitBreaker: CircuitBreakerState): boolean {
  if (circuitBreaker.state === 'closed') return true;
  if (circuitBreaker.state === 'half-open') return true;
  
  // Check if timeout has passed for open circuit breaker
  if (circuitBreaker.state === 'open' && circuitBreaker.lastFailure) {
    const timeSinceFailure = Date.now() - circuitBreaker.lastFailure;
    if (timeSinceFailure > circuitBreaker.timeout) {
      // Transition to half-open
      circuitBreaker.state = 'half-open';
      return true;
    }
  }
  
  return false;
}

function calculateHealthScore(provider: ProviderMetrics): number {
  const responseTimeFactor = Math.max(0, 100 - (provider.averageResponseTime / 50));
  const successRateFactor = provider.successRate;
  const quotaFactor = Math.max(0, 100 - provider.quotaUsage);
  
  return (
    responseTimeFactor * 0.3 +
    successRateFactor * 0.4 +
    quotaFactor * 0.3
  );
}

function calculateWeight(provider: ProviderMetrics): number {
  const baseWeight = Math.max(1, provider.healthScore);
  
  if (provider.successRate < 50) {
    return baseWeight * 0.1;
  } else if (provider.successRate < 80) {
    return baseWeight * 0.5;
  }
  
  return baseWeight;
}

function createDefaultMetrics(providerId: string): ProviderMetrics {
  return {
    providerId,
    healthScore: 95,
    successRate: 98,
    averageResponseTime: 500,
    quotaUsage: 0,
    costPerRequest: 0.015,
    weight: 100,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 60000,
      state: 'closed'
    }
  };
}

function getDefaultProviders(searchType: string, excludedProviders: string[]): ProviderMetrics[] {
  const defaultProviders = {
    flight: ['amadeus-flight', 'sabre-flight'],
    hotel: ['hotelbeds-hotel', 'sabre-hotel', 'amadeus-hotel'],
    activity: ['amadeus-activity', 'hotelbeds-activity']
  };

  return (defaultProviders[searchType as keyof typeof defaultProviders] || [])
    .filter(id => !excludedProviders.includes(id))
    .map(id => createDefaultMetrics(id));
}

function isProviderCredentialsValid(providerId: string): boolean {
  // Simplified credential validation
  switch (providerId) {
    case 'amadeus-flight':
    case 'amadeus-hotel':
    case 'amadeus-activity':
      return !!(Deno.env.get('AMADEUS_CLIENT_ID') && Deno.env.get('AMADEUS_CLIENT_SECRET'));
    
    case 'sabre-flight':
    case 'sabre-hotel':
      return !!(Deno.env.get('SABRE_CLIENT_ID') && Deno.env.get('SABRE_CLIENT_SECRET'));
    
    case 'hotelbeds-hotel':
      return !!(Deno.env.get('HOTELBEDS_HOTEL_API_KEY') && Deno.env.get('HOTELBEDS_HOTEL_SECRET'));
    
    case 'hotelbeds-activity':
      return !!(Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY') && Deno.env.get('HOTELBEDS_ACTIVITY_SECRET'));
    
    default:
      return false;
  }
}

async function getFallbackData(searchType: string): Promise<any> {
  // Return demo data as fallback
  return { [`${searchType}s`]: [], message: 'Demo data - providers unavailable' };
}