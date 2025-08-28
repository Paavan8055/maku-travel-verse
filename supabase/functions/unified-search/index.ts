import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

interface SearchParams {
  type: 'flight' | 'hotel' | 'activity';
  origin?: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  checkIn?: string;
  checkOut?: string;
  passengers?: number;
  guests?: number;
  rooms?: number;
  providers?: string[]; // ['amadeus', 'hotelbeds', 'travelport']
}

const callEdgeFunction = async (functionName: string, payload: any) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload
  });

  if (error) {
    console.warn(`${functionName} search failed:`, error);
    return null;
  }

  return data;
};

const aggregateResults = (results: any[], type: string) => {
  const allItems = results
    .filter(result => result && result.success)
    .flatMap(result => result[type === 'flight' ? 'flights' : 'hotels'] || []);

  // Sort by price (lowest first) and add source diversity
  const sortedItems = allItems.sort((a, b) => {
    const priceA = a.price?.amount || 0;
    const priceB = b.price?.amount || 0;
    return priceA - priceB;
  });

  // Ensure we have a good mix of sources
  const diversifiedResults = [];
  const sourceTracking = { amadeus: 0, hotelbeds: 0, travelport: 0 };
  
  for (const item of sortedItems) {
    const source = item.source || 'unknown';
    if (sourceTracking[source] < 10) { // Max 10 results per source
      diversifiedResults.push(item);
      sourceTracking[source]++;
    }
    
    if (diversifiedResults.length >= 50) break; // Max total results
  }

  return diversifiedResults;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SearchParams = await req.json();
    const { type, providers = ['amadeus', 'hotelbeds', 'travelport'] } = params;

    console.log('Unified search:', { type, providers, ...params });

    const searchPromises = [];

    // Flight search
    if (type === 'flight') {
      if (providers.includes('amadeus')) {
        searchPromises.push(
          callEdgeFunction('amadeus-flight-search', {
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            passengers: params.passengers || 1,
            travelClass: 'ECONOMY'
          })
        );
      }

      if (providers.includes('travelport')) {
        searchPromises.push(
          callEdgeFunction('travelport-search', {
            type: 'flight',
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            passengers: params.passengers || 1
          })
        );
      }
    }

    // Hotel search
    if (type === 'hotel') {
      if (providers.includes('hotelbeds')) {
        searchPromises.push(
          callEdgeFunction('hotelbeds-search', {
            destination: params.destination,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            guests: params.guests || 2,
            rooms: params.rooms || 1
          })
        );
      }

      if (providers.includes('travelport')) {
        searchPromises.push(
          callEdgeFunction('travelport-search', {
            type: 'hotel',
            destination: params.destination,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            guests: params.guests || 2,
            rooms: params.rooms || 1
          })
        );
      }
    }

    // Execute all searches in parallel
    const results = await Promise.allSettled(searchPromises);
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value
      )
      .map(result => result.value);

    // Aggregate and sort results
    const aggregatedResults = aggregateResults(successfulResults, type);

    const responseKey = type === 'flight' ? 'flights' : 'hotels';

    return new Response(JSON.stringify({
      success: true,
      source: 'unified',
      [responseKey]: aggregatedResults,
      searchCriteria: params,
      providers: providers,
      resultCounts: {
        total: aggregatedResults.length,
        amadeus: aggregatedResults.filter(r => r.source === 'amadeus').length,
        hotelbeds: aggregatedResults.filter(r => r.source === 'hotelbeds').length,
        travelport: aggregatedResults.filter(r => r.source === 'travelport').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unified search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'unified'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});