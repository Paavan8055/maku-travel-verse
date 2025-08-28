import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";
import { ProviderAuthFactory } from "../_shared/provider-authentication.ts";
import { CircuitBreakerManager } from "../_shared/provider-circuit-breakers.ts";
import { ResponseTransformer } from "../_shared/unified-response-transformer.ts";

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
  const correlationId = crypto.randomUUID();

  try {
    // Get independent circuit breaker for this provider
    const circuitBreaker = CircuitBreakerManager.getCircuitBreaker(provider.providerId);
    
    // Execute with circuit breaker protection
    const result = await circuitBreaker.execute(async () => {
      return await executeProviderRequest(provider, params, correlationId);
    });

    const responseTime = Date.now() - startTime;
    
    // Transform response to unified format
    let transformedData = result.data;
    try {
      const providerType = provider.providerId.split('-')[0] as 'amadeus' | 'sabre' | 'hotelbeds';
      const serviceType = provider.providerId.split('-')[1] as 'flight' | 'hotel' | 'activity';
      
      transformedData = ResponseTransformer.transformResponse(
        result.data,
        providerType,
        serviceType,
        provider.providerId,
        responseTime
      );
    } catch (transformError) {
      logger.warn(`[ENHANCED-PROVIDER-ROTATION] Response transformation failed for ${provider.providerId}:`, transformError);
      // Keep original data if transformation fails
    }

    return {
      success: true,
      data: transformedData,
      responseTime,
      quotaUsage: provider.quotaUsage
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error(`[ENHANCED-PROVIDER-ROTATION] Provider ${provider.providerId} failed:`, {
      error: error.message,
      responseTime,
      correlationId
    });
    
    return {
      success: false,
      error: error.message,
      responseTime
    };
  }
}

async function executeProviderRequest(provider: ProviderMetrics, params: any, correlationId: string): Promise<{ data: any }> {
  // Use independent authentication for each provider
  let authHeader = {};
  
  const providerType = provider.providerId.split('-')[0];
  
  try {
    switch (providerType) {
      case 'sabre': {
        const auth = ProviderAuthFactory.getSabreAuth();
        const token = await auth.getValidToken();
        authHeader = { 'Authorization': `Bearer ${token}` };
        break;
      }
      case 'amadeus': {
        const auth = ProviderAuthFactory.getAmadeusAuth();
        const token = await auth.getValidToken();
        authHeader = { 'Authorization': `Bearer ${token}` };
        break;
      }
      case 'hotelbeds': {
        const auth = ProviderAuthFactory.getHotelBedsAuth();
        const serviceType = provider.providerId.split('-')[1] as 'hotel' | 'activity';
        const signature = await auth.generateSignature(serviceType);
        authHeader = {
          'Api-key': signature.apiKey,
          'X-Signature': signature.signature
        };
        break;
      }
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  } catch (authError) {
    logger.error(`[ENHANCED-PROVIDER-ROTATION] Authentication failed for ${provider.providerId}:`, authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  // Direct API call with independent authentication
  const apiResponse = await makeDirectProviderCall(provider, params, authHeader, correlationId);
  
  return { data: apiResponse };
}

async function makeDirectProviderCall(
  provider: ProviderMetrics, 
  params: any, 
  authHeader: any, 
  correlationId: string
): Promise<any> {
  const providerType = provider.providerId.split('-')[0];
  const serviceType = provider.providerId.split('-')[1];
  
  // Provider-specific endpoint mapping
  const endpointMap: Record<string, string> = {
    'sabre-flight': 'https://api-crt.cert.havail.sabre.com/v1/shop/flights',
    'sabre-hotel': 'https://api-crt.cert.havail.sabre.com/v1/shop/hotels',
    'amadeus-flight': 'https://test.api.amadeus.com/v2/shopping/flight-offers',
    'amadeus-hotel': 'https://test.api.amadeus.com/v3/shopping/hotel-offers',
    'hotelbeds-hotel': 'https://api.test.hotelbeds.com/hotel-api/1.0/hotels',
    'hotelbeds-activity': 'https://api.test.hotelbeds.com/activity-api/3.0/activities'
  };

  const endpoint = endpointMap[provider.providerId];
  if (!endpoint) {
    throw new Error(`No endpoint configured for provider: ${provider.providerId}`);
  }

  // Build query parameters based on service type
  const queryParams = buildQueryParams(serviceType, params);
  const url = `${endpoint}${queryParams ? '?' + queryParams : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Correlation-ID': correlationId,
        ...authHeader
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Provider API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`[ENHANCED-PROVIDER-ROTATION] Direct API call failed for ${provider.providerId}:`, {
      error: error.message,
      endpoint: endpoint.split('?')[0], // Log URL without params for security
      correlationId
    });
    throw error;
  }
}

function buildQueryParams(serviceType: string, params: any): string {
  const searchParams = new URLSearchParams();
  
  switch (serviceType) {
    case 'flight':
      if (params.originLocationCode) searchParams.set('originLocationCode', params.originLocationCode);
      if (params.destinationLocationCode) searchParams.set('destinationLocationCode', params.destinationLocationCode);
      if (params.departureDate) searchParams.set('departureDate', params.departureDate);
      if (params.returnDate) searchParams.set('returnDate', params.returnDate);
      if (params.adults) searchParams.set('adults', params.adults.toString());
      break;
    
    case 'hotel':
      if (params.cityCode) searchParams.set('cityCode', params.cityCode);
      if (params.checkInDate) searchParams.set('checkInDate', params.checkInDate);
      if (params.checkOutDate) searchParams.set('checkOutDate', params.checkOutDate);
      if (params.adults) searchParams.set('adults', params.adults.toString());
      if (params.roomQuantity) searchParams.set('roomQuantity', params.roomQuantity.toString());
      break;
    
    case 'activity':
      if (params.destination) searchParams.set('destination', params.destination);
      if (params.date) searchParams.set('date', params.date);
      if (params.participants) searchParams.set('participants', params.participants.toString());
      break;
  }
  
  return searchParams.toString();
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