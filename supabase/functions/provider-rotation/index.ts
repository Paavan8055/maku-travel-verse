import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/simpleLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    id: 'sabre-flight',
    name: 'Sabre',
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
    id: 'amadeus-hotel',
    name: 'Amadeus',
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
    id: 'hotelbeds-hotel',
    name: 'HotelBeds',
    type: 'hotel',
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
    id: 'sabre-hotel',
    name: 'Sabre',
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
    id: 'amadeus-activity',
    name: 'Amadeus',
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
    id: 'hotelbeds-activity',
    name: 'HotelBeds',
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
        fallbackData: await getFallbackData(searchType)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503
      });
    }

    // Try providers in order until one succeeds
    let lastError: any = null;
    for (const provider of providers) {
      try {
        logger.info('[PROVIDER-ROTATION] Trying provider', { providerId: provider.id });
        
        const result = await callProvider(supabase, provider, params);
        
        if (result.success) {
          // Update provider success metrics
          await updateProviderMetrics(supabase, provider.id, true, result.responseTime);
          
          logger.info('[PROVIDER-ROTATION] Provider succeeded', { 
            providerId: provider.id, 
            responseTime: result.responseTime 
          });
          
          return new Response(JSON.stringify({
            success: true,
            data: result.data,
            provider: provider.name,
            providerId: provider.id,
            responseTime: result.responseTime,
            fallbackUsed: false
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        lastError = error;
        logger.warn('[PROVIDER-ROTATION] Provider failed', { 
          providerId: provider.id, 
          error: error.message 
        });
        
        // Update provider failure metrics
        await updateProviderMetrics(supabase, provider.id, false, 5000);
      }
    }

    // All providers failed, return fallback data
    logger.error('[PROVIDER-ROTATION] All providers failed', { lastError: lastError?.message });
    
    return new Response(JSON.stringify({
      success: true,
      data: await getFallbackData(searchType),
      provider: 'Fallback Data',
      providerId: 'fallback',
      fallbackUsed: true,
      error: `All providers failed. Last error: ${lastError?.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    logger.error('[PROVIDER-ROTATION] Request failed', { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
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
    // Try to get providers from database
    const { data: dbProviders } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('type', searchType)
      .eq('enabled', true)
      .not('id', 'in', `(${excludedProviders.join(',')})`)
      .order('priority');
    
    if (dbProviders && dbProviders.length > 0) {
      return dbProviders.map((p: any) => ({
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
  
  // Fallback to default providers
  return DEFAULT_PROVIDERS
    .filter(p => p.type === searchType && p.enabled && !excludedProviders.includes(p.id))
    .filter(p => isCircuitBreakerClosed(p))
    .sort((a, b) => a.priority - b.priority);
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
    'amadeus-hotel': 'amadeus-hotel-offers',
    'hotelbeds-hotel': 'hotelbeds-search',
    'sabre-hotel': 'sabre-hotel-search',
    'amadeus-activity': 'amadeus-activity-search',
    'hotelbeds-activity': 'hotelbeds-activities'
  };
  
  const functionName = functionMap[provider.id];
  if (!functionName) {
    throw new Error(`Unknown provider function: ${provider.id}`);
  }
  
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: params
  });
  
  const responseTime = Date.now() - startTime;
  
  if (error) {
    throw new Error(`Provider ${provider.id} failed: ${error.message}`);
  }
  
  return {
    success: true,
    data,
    responseTime
  };
}

async function updateProviderMetrics(
  supabase: any, 
  providerId: string, 
  success: boolean, 
  responseTime: number
) {
  try {
    await supabase
      .from('provider_metrics')
      .insert({
        provider_id: providerId,
        success,
        response_time: responseTime,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    logger.warn('[PROVIDER-ROTATION] Failed to update metrics', { providerId, error: error.message });
  }
}

async function getFallbackData(searchType: string): Promise<any> {
  // Return sample/demo data based on search type
  switch (searchType) {
    case 'flight':
      return {
        offers: [
          {
            id: 'fallback-flight-1',
            price: { total: '299.00', currency: 'AUD' },
            itineraries: [{
              segments: [{
                departure: { iataCode: 'SYD', at: '2025-12-01T09:00:00' },
                arrival: { iataCode: 'MEL', at: '2025-12-01T10:30:00' },
                carrierCode: 'JQ',
                number: '123'
              }]
            }],
            fallback: true
          }
        ],
        meta: { fallbackData: true }
      };
    
    case 'hotel':
      return {
        offers: [
          {
            id: 'fallback-hotel-1',
            name: 'Sample Hotel',
            price: { total: '150.00', currency: 'AUD' },
            location: { city: 'Melbourne', country: 'Australia' },
            rating: 4,
            fallback: true
          }
        ],
        meta: { fallbackData: true }
      };
    
    case 'activity':
      return {
        offers: [
          {
            id: 'fallback-activity-1',
            name: 'City Walking Tour',
            price: { total: '45.00', currency: 'AUD' },
            duration: '3 hours',
            rating: 4.5,
            fallback: true
          }
        ],
        meta: { fallbackData: true }
      };
    
    default:
      return { offers: [], meta: { fallbackData: true } };
  }
}