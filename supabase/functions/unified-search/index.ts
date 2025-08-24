import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";

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
  type: 'flight' | 'hotel' | 'activity' | 'car' | 'transfer';
  origin?: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  checkIn?: string;
  checkOut?: string;
  passengers?: number;
  guests?: number;
  rooms?: number;
  pickUpLocationCode?: string;
  dropOffLocationCode?: string;
  pickUpDate?: string;
  pickUpTime?: string;
  dropOffDate?: string;
  dropOffTime?: string;
  driverAge?: number;
  fromType?: string;
  fromCode?: string;
  toType?: string;
  toCode?: string;
  providers?: string[]; // ['amadeus', 'hotelbeds', 'sabre', 'travelport']
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
    logger.warn(`${functionName} search failed:`, error);
    return null;
  }

  return data;
};

const aggregateResults = (results: any[], type: string) => {
  const resultKey = {
    'flight': 'flights',
    'hotel': 'hotels', 
    'activity': 'activities',
    'car': 'cars',
    'transfer': 'transfers'
  }[type] || 'items';

  const allItems = results
    .filter(result => result && result.success)
    .flatMap(result => result[resultKey] || []);

  // Sort by price (lowest first) and add source diversity
  const sortedItems = allItems.sort((a, b) => {
    const priceA = a.price?.amount || a.pricePerNight || 0;
    const priceB = b.price?.amount || b.pricePerNight || 0;
    return priceA - priceB;
  });

  // Ensure we have a good mix of sources
  const diversifiedResults = [];
  const sourceTracking = { amadeus: 0, hotelbeds: 0, sabre: 0, travelport: 0 };
  
  for (const item of sortedItems) {
    const source = item.source || 'unknown';
    if (sourceTracking[source] < 15) { // Max 15 results per source
      diversifiedResults.push(item);
      sourceTracking[source]++;
    }
    
    if (diversifiedResults.length >= 60) break; // Max total results
  }

  return diversifiedResults;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SearchParams = await req.json();
    const { type, providers = ['amadeus', 'hotelbeds', 'sabre', 'travelport'] } = params;

    logger.info('Unified search:', { type, providers, ...params });

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

    // Hotel search - Use provider rotation for enhanced search capabilities
    if (type === 'hotel') {
      logger.info('[UNIFIED-SEARCH] Hotel search using provider-rotation with params:', {
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests || 2,
        rooms: params.rooms || 1
      });
      
      searchPromises.push(
        callEdgeFunction('provider-rotation', {
          searchType: 'hotel',
          params: {
            destination: params.destination,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            guests: params.guests || 2,
            rooms: params.rooms || 1,
            currency: params.currency || 'AUD'
          }
        })
      );

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

    // Activity search
    if (type === 'activity') {
      if (providers.includes('amadeus')) {
        searchPromises.push(
          callEdgeFunction('activity-search', {
            destination: params.destination,
            date: params.departureDate,
            participants: params.passengers || 2
          })
        );
      }

      if (providers.includes('hotelbeds')) {
        searchPromises.push(
          callEdgeFunction('hotelbeds-activities', {
            destination: params.destination,
            from: params.departureDate,
            to: params.returnDate,
            language: 'en'
          })
        );
      }
    }

    // Car search
    if (type === 'car') {
      if (providers.includes('amadeus')) {
        searchPromises.push(
          callEdgeFunction('amadeus-car-search', {
            pickUpLocationCode: params.pickUpLocationCode || params.origin,
            dropOffLocationCode: params.dropOffLocationCode || params.destination,
            pickUpDate: params.pickUpDate || params.departureDate,
            pickUpTime: params.pickUpTime || '10:00',
            dropOffDate: params.dropOffDate || params.returnDate,
            dropOffTime: params.dropOffTime || '10:00',
            driverAge: params.driverAge || 25
          })
        );
      }

      if (providers.includes('sabre')) {
        searchPromises.push(
          callEdgeFunction('sabre-car-search', {
            pickUpLocationCode: params.pickUpLocationCode || params.origin,
            dropOffLocationCode: params.dropOffLocationCode || params.destination,
            pickUpDate: params.pickUpDate || params.departureDate,
            pickUpTime: params.pickUpTime || '10:00',
            dropOffDate: params.dropOffDate || params.returnDate,
            dropOffTime: params.dropOffTime || '10:00',
            driverAge: params.driverAge || 25
          })
        );
      }
    }

    // Transfer search
    if (type === 'transfer') {
      if (providers.includes('hotelbeds')) {
        searchPromises.push(
          callEdgeFunction('hotelbeds-transfers', {
            fromType: params.fromType || 'IATA',
            fromCode: params.fromCode || params.origin,
            toType: params.toType || 'IATA', 
            toCode: params.toCode || params.destination,
            outbound: {
              date: params.departureDate,
              time: params.pickUpTime || '10:00'
            },
            inbound: params.returnDate ? {
              date: params.returnDate,
              time: params.dropOffTime || '10:00'
            } : undefined,
            occupancy: [{ adults: params.passengers || 2, children: 0, infants: 0 }],
            language: 'en'
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

    const responseKey = {
      'flight': 'flights',
      'hotel': 'hotels',
      'activity': 'activities', 
      'car': 'cars',
      'transfer': 'transfers'
    }[type] || 'items';

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
        sabre: aggregatedResults.filter(r => r.source === 'sabre').length,
        travelport: aggregatedResults.filter(r => r.source === 'travelport').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Unified search error:', error);
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