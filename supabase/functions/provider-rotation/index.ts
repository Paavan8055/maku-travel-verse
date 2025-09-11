import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";
import { 
  validateProviderCredentials, 
  validateHotelBedsCredentials,
  getAvailableHotelBedsServices 
} from "../_shared/config.ts";


interface ProviderConfig {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'activity';
  enabled: boolean;
  priority: number;
  circuitBreaker: {
    failureCount: number;
    lastFailure: number | null;
    timeout: number;
    state: 'closed' | 'open' | 'half-open';
  };
  healthScore: number;
  responseTime: number;
}

interface RotationRequest {
  searchType: 'flight' | 'hotel' | 'activity';
  params: any;
  excludedProviders?: string[];
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'amadeus-flight',
    name: 'Amadeus',
    type: 'flight',
    enabled: true,
    priority: 2,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'sabre-flight',
    name: 'Sabre',
    type: 'flight',
    enabled: true,
    priority: 1,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'duffel-flight',
    name: 'Duffel',
    type: 'flight',
    enabled: true,
    priority: 2,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'hotelbeds-hotel',
    name: 'HotelBeds',
    type: 'hotel',
    enabled: true,
    priority: 1,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 45000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'sabre-hotel',
    name: 'Sabre',
    type: 'hotel',
    enabled: true,
    priority: 1,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'amadeus-hotel',
    name: 'Amadeus',
    type: 'hotel',
    enabled: true,
    priority: 3,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'hotelbeds-activity',
    name: 'HotelBeds',
    type: 'activity',
    enabled: true,
    priority: 1,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'sabre-activity',
    name: 'Sabre',
    type: 'activity',
    enabled: true,
    priority: 2,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  },
  {
    id: 'amadeus-activity',
    name: 'Amadeus',
    type: 'activity',
    enabled: true,
    priority: 3,
    circuitBreaker: {
      failureCount: 0,
      lastFailure: null,
      timeout: 30000,
      state: 'closed'
    },
    healthScore: 100,
    responseTime: 0
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { searchType, params, excludedProviders = [] }: RotationRequest = await req.json();
    
    logger.info('[PROVIDER-ROTATION] Starting provider rotation', { searchType, excludedProviders });

    // Get available providers for this search type
    const providers = await getAvailableProviders(supabase, searchType, excludedProviders);
    
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

    // Try providers in order until one succeeds
    let lastError: any = null;
    let credentialErrors: string[] = [];
    
    for (const provider of providers) {
      try {
        logger.info('[PROVIDER-ROTATION] Trying provider', { providerId: provider.id });
        
        const result = await callProvider(supabase, provider, params);
        
        if (result.success && result.data && (!Array.isArray(result.data) || result.data.length > 0)) {
          // Update provider success metrics
          await updateProviderMetrics(supabase, provider.id, true, result.responseTime);
          
          logger.info('[PROVIDER-ROTATION] Provider succeeded', { 
            providerId: provider.id, 
            responseTime: result.responseTime,
            dataCount: Array.isArray(result.data) ? result.data.length : 1
          });
          
          return new Response(JSON.stringify({
            success: true,
            data: result.data,
            provider: provider.name,
            providerId: provider.id,
            responseTime: result.responseTime,
            fallbackUsed: false,
            ...(credentialErrors.length > 0 && { 
              warnings: [`Some providers unavailable: ${credentialErrors.join(', ')}`] 
            })
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        lastError = error;
        const errorMessage = error.message || 'Unknown error';
        
        // Track credential-related errors separately
        if (errorMessage.includes('403') || errorMessage.includes('401') || 
            errorMessage.includes('credentials') || errorMessage.includes('authentication')) {
          credentialErrors.push(`${provider.name}: credential issue`);
          logger.warn(`[PROVIDER-ROTATION] Provider ${provider.id} has credential issues:`, errorMessage);
        } else {
          logger.error(`[PROVIDER-ROTATION] Provider ${provider.id} failed:`, error);
        }
        
        // Update provider failure metrics
        await updateProviderMetrics(supabase, provider.id, false, 5000);
      }
    }

    // All providers failed, return fallback data with success=false for UI handling
    logger.warn('[PROVIDER-ROTATION] All providers failed, returning fallback data', { 
      lastError: lastError?.message,
      credentialErrors: credentialErrors.length,
      totalProviders: providers.length
    });
    
    return new Response(JSON.stringify({
      success: false,
      data: await getFallbackData(searchType),
      provider: 'None Available',
      providerId: 'none',
      fallbackUsed: false,
      error: 'All providers are temporarily unavailable. Please try again later.',
      details: {
        providersAttempted: providers.length,
        credentialIssues: credentialErrors.length,
        lastError: lastError?.message || 'Unknown error'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 502
    });

  } catch (error) {
    logger.error('[PROVIDER-ROTATION] Request failed', { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: await getFallbackData('flight'), // Default fallback
      provider: 'Error',
      providerId: 'error',
      fallbackUsed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function getAvailableProviders(
  supabase: any, 
  searchType: string, 
  excludedProviders: string[]
): Promise<ProviderConfig[]> {
  try {
    // Try to get quota-aware providers from database function
    const { data: quotaAwareProviders, error: functionError } = await supabase
      .rpc('get_quota_aware_providers', {
        p_search_type: searchType,
        p_excluded_providers: excludedProviders
      });
    
    if (!functionError && quotaAwareProviders && quotaAwareProviders.length > 0) {
      logger.info('[PROVIDER-ROTATION] Using quota-aware provider selection', { 
        providerCount: quotaAwareProviders.length,
        quotaStatuses: quotaAwareProviders.map((p: any) => ({ id: p.provider_id, status: p.quota_status, usage: p.percentage_used }))
      });
      
      // Filter providers based on credential availability and convert to ProviderConfig format
      const validProviders = quotaAwareProviders
        .filter((p: any) => isProviderCredentialsValid(p.provider_id))
        .map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          type: searchType,
          enabled: true,
          priority: p.priority,
          circuitBreaker: {
            failureCount: 0,
            lastFailure: null,
            timeout: 30000,
            state: 'closed'
          },
          healthScore: p.quota_status === 'healthy' ? 100 : 
                       p.quota_status === 'warning' ? 75 :
                       p.quota_status === 'critical' ? 50 : 25,
          responseTime: 0,
          quotaStatus: p.quota_status,
          quotaUsage: p.percentage_used
        }));
      
      return validProviders;
    }
    
    logger.warn('[PROVIDER-ROTATION] Quota-aware selection failed, falling back to standard method', { functionError });
    
    // Fallback to standard provider selection
    const { data: dbProviders } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('type', searchType)
      .eq('enabled', true)
      .not('id', 'in', `(${excludedProviders.join(',')})`)
      .order('priority');
    
    if (dbProviders && dbProviders.length > 0) {
      // Filter providers based on credential availability
      const validProviders = dbProviders.filter((p: any) => isProviderCredentialsValid(p.id));
      return validProviders.map((p: any) => ({
        ...p,
        circuitBreaker: p.circuit_breaker || {
          failureCount: 0,
          lastFailure: null,
          timeout: 30000,
          state: 'closed'
        }
      }));
    }
  } catch (error) {
    logger.warn('[PROVIDER-ROTATION] Failed to load providers from DB, using defaults', { error: error.message });
  }
  
  // Final fallback to default providers with credential filtering
  return DEFAULT_PROVIDERS
    .filter(p => p.type === searchType && p.enabled && !excludedProviders.includes(p.id))
    .filter(p => isCircuitBreakerClosed(p))
    .filter(p => isProviderCredentialsValid(p.id))
    .sort((a, b) => a.priority - b.priority);
}

// Check if a provider has valid credentials
function isProviderCredentialsValid(providerId: string): boolean {
  try {
    switch (providerId) {
      case 'amadeus-flight':
      case 'amadeus-hotel':
      case 'amadeus-activity':
        return validateProviderCredentials('amadeus');
      
      case 'sabre-flight':
      case 'sabre-hotel':
      case 'sabre-activity':
        return validateProviderCredentials('sabre');
      
      case 'hotelbeds-hotel':
        return validateHotelBedsCredentials('hotel');
      
      case 'hotelbeds-activity':
        return validateHotelBedsCredentials('activity');
      
      case 'hotelbeds-transfer':
        return validateHotelBedsCredentials('hotel');
      
      case 'duffel-flight':
        return validateProviderCredentials('duffel');
      
      default:
        logger.warn(`[PROVIDER-ROTATION] Unknown provider ID: ${providerId}`);
        return false;
    }
  } catch (error) {
    logger.error(`[PROVIDER-ROTATION] Error checking credentials for ${providerId}:`, error);
    return false;
  }
}

function isCircuitBreakerClosed(provider: ProviderConfig): boolean {
  if (provider.circuitBreaker.state === 'closed') return true;
  if (provider.circuitBreaker.state === 'half-open') return true;
  
  // Check if timeout has passed for open circuit breaker
  if (provider.circuitBreaker.state === 'open' && provider.circuitBreaker.lastFailure) {
    const timeSinceFailure = Date.now() - provider.circuitBreaker.lastFailure;
    return timeSinceFailure > provider.circuitBreaker.timeout;
  }
  
  return false;
}

async function callProvider(supabase: any, provider: ProviderConfig, params: any) {
  const startTime = Date.now();
  
  // Map provider ID to function name
  const functionMap: Record<string, string> = {
    'amadeus-flight': 'amadeus-flight-search',
    'sabre-flight': 'sabre-flight-search',
    'duffel-flight': 'duffel-flight-search',
    'amadeus-hotel': 'amadeus-hotel-search',
    'hotelbeds-hotel': 'hotelbeds-search',
    'sabre-hotel': 'sabre-hotel-search',
    'amadeus-activity': 'amadeus-activity-search',
    'hotelbeds-activity': 'hotelbeds-activities',
    'sabre-activity': 'sabre-activities'
  };
  
  const functionName = functionMap[provider.id];
  if (!functionName) {
    throw new Error(`Unknown provider function: ${provider.id}`);
  }

  // Enhanced credential check with detailed logging
  const credentialCheck = isProviderCredentialsValid(provider.id);
  if (!credentialCheck) {
    logger.error(`[PROVIDER-ROTATION] Provider ${provider.id} credentials missing or invalid`);
    throw new Error(`Provider ${provider.id} credentials not configured`);
  }
  
  // Enhanced timeout based on provider type
  const timeoutMs = provider.circuitBreaker?.timeout || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    logger.info(`[PROVIDER-ROTATION] Calling ${functionName} with params:`, {
      ...params,
      timeout: timeoutMs,
      providerId: provider.id
    });
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: params,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    logger.info(`[PROVIDER-ROTATION] ${functionName} response:`, { 
      success: !error, 
      responseTime, 
      dataType: typeof data,
      hasData: !!data,
      errorMessage: error?.message || null
    });
    
    if (error) {
      logger.error(`[PROVIDER-ROTATION] Provider ${provider.id} failed:`, error);
      throw new Error(`Provider ${provider.id} failed: ${error.message}`);
    }
    
    // Validate response data
    if (!data) {
      logger.warn(`[PROVIDER-ROTATION] Provider ${provider.id} returned no data`);
      throw new Error(`Provider ${provider.id} returned empty response`);
    }
    
    // Standardize response format for different providers
    let standardizedData;
    if (data?.data && Array.isArray(data.data)) {
      standardizedData = data.data;
    } else if (data?.flights) {
      standardizedData = data.flights;
    } else if (data?.hotels) {
      standardizedData = data.hotels;
    } else if (data?.activities) {
      standardizedData = data.activities;
    } else if (Array.isArray(data)) {
      standardizedData = data;
    } else {
      standardizedData = data;
      logger.warn(`[PROVIDER-ROTATION] Unexpected data structure from ${provider.id}:`, typeof data);
    }
    
    return {
      success: true,
      data: standardizedData,
      responseTime
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function updateProviderMetrics(
  supabase: any, 
  providerId: string, 
  success: boolean, 
  responseTime: number
) {
  try {
    const { error } = await supabase
      .from('provider_health')
      .upsert({
        provider: providerId,
        status: success ? 'healthy' : 'unhealthy',
        last_checked: new Date().toISOString(),
        response_time_ms: responseTime,
        error_count: success ? 0 : 1
      });

    if (error) {
      logger.warn(`[PROVIDER-ROTATION] Failed to update metrics for ${providerId}:`, error);
    }
  } catch (error) {
    logger.warn(`[PROVIDER-ROTATION] Error updating provider metrics:`, error);
  }
}

async function getFallbackData(searchType: string): Promise<any> {
  switch (searchType) {
    case 'flight':
      return {
        flights: [
          {
            id: 'demo-flight-1',
            airline: 'Demo Airways',
            flightNumber: 'DM101',
            departure: { airport: 'SYD', city: 'Sydney', time: '08:00' },
            arrival: { airport: 'MEL', city: 'Melbourne', time: '09:30' },
            duration: '1h 30m',
            price: { amount: 249, currency: 'AUD' },
            isDemoData: true
          }
        ],
        meta: {
          isDemoData: true,
          message: 'Live flight data temporarily unavailable. Showing sample results.'
        }
      };
    
    case 'hotel':
      return {
        hotels: [
          {
            id: 'demo-hotel-1',
            name: 'Grand Demo Hotel',
            address: '123 Sample Street, Sydney NSW 2000',
            starRating: 4,
            price: { amount: 185, currency: 'AUD', period: 'per night' },
            rating: { score: 4.2, reviews: 1205 },
            isDemoData: true
          }
        ],
        meta: {
          isDemoData: true,
          message: 'Live hotel data temporarily unavailable. Showing sample results.'
        }
      };
    
    case 'activity':
      return {
        activities: [
          {
            id: 'demo-activity-1',
            name: 'Sydney Harbour Bridge Climb',
            description: 'Experience breathtaking 360-degree views of Sydney from the top of the iconic Harbour Bridge.',
            duration: '3.5 hours',
            price: { amount: 185, currency: 'AUD' },
            rating: { score: 4.8, reviews: 12540 },
            isDemoData: true
          }
        ],
        meta: {
          isDemoData: true,
          message: 'Live activity data temporarily unavailable. Showing sample results.'
        }
      };
    
    default:
      return { error: 'Unknown search type' };
  }
}