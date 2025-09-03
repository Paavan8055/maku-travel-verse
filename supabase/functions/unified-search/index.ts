import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";
import SecurityValidator from "../_shared/securityUtils.ts";

// Currency utilities (moved from src/utils/currency.ts for edge function compatibility)
export const DEFAULT_CURRENCY = 'USD';

interface RateCacheEntry {
  rate: number;
  timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const RATE_CACHE: Record<string, RateCacheEntry> = (globalThis as any).RATE_CACHE || ((globalThis as any).RATE_CACHE = {});

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const now = Date.now();
  const cached = RATE_CACHE[cacheKey];
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return amount * cached.rate;
  }

  const fetchRate = async (): Promise<number> => {
    const apiKey = Deno.env.get('OPEN_EXCHANGE_RATES_API_KEY');
    try {
      if (apiKey) {
        const url = `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&symbols=${fromCurrency},${toCurrency}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`OpenExchangeRates error: ${res.status}`);
        const data = await res.json();
        const rates = data.rates || {};
        const fromRate = fromCurrency === 'USD' ? 1 : rates[fromCurrency];
        const toRate = toCurrency === 'USD' ? 1 : rates[toCurrency];
        if (!fromRate || !toRate) throw new Error('Missing rate');
        return toRate / fromRate;
      }
      throw new Error('Missing OPEN_EXCHANGE_RATES_API_KEY');
    } catch (err) {
      logger.warn('Primary currency API failed, falling back', err);
      const url = `https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`exchangerate.host error: ${res.status}`);
      const data = await res.json();
      if (typeof data.result !== 'number') {
        throw new Error('No conversion result');
      }
      return data.result / amount; // since result = amount * rate
    }
  };

  try {
    const rate = await fetchRate();
    RATE_CACHE[cacheKey] = { rate, timestamp: now };
    return amount * rate;
  } catch (err) {
    logger.warn('Currency conversion failed, using fallback', err);
    if (cached) {
      return amount * cached.rate;
    }
    return amount; // final fallback
  }
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

export const aggregateResults = async (results: any[], type: string) => {
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

  const itemsWithCurrency = await Promise.all(allItems.map(async (item) => {
    const amount = item.price?.amount ?? item.pricePerNight ?? item.totalPrice ?? 0;
    const originalCurrency = item.price?.currency || item.currency || item.price?.currencyCode || DEFAULT_CURRENCY;

    let normalizedAmount = amount;
    try {
      normalizedAmount = await convertCurrency(amount, originalCurrency, DEFAULT_CURRENCY);
    } catch (err) {
      logger.warn('Currency conversion failed:', err);
    }

    return {
      ...item,
      originalCurrency,
      normalizedPrice: normalizedAmount,
      normalizedCurrency: DEFAULT_CURRENCY
    };
  }));

  const sortedItems = itemsWithCurrency.sort((a, b) => {
    const priceA = a.normalizedPrice ?? 0;
    const priceB = b.normalizedPrice ?? 0;
    return priceA - priceB;
  });

  const diversifiedResults = [];
  const sourceTracking: Record<string, number> = { amadeus: 0, hotelbeds: 0, sabre: 0, travelport: 0 };

  for (const item of sortedItems) {
    const source = item.source || 'unknown';
    if (!sourceTracking[source]) {
      sourceTracking[source] = 0;
    }
    if (sourceTracking[source] < 15) {
      diversifiedResults.push(item);
      sourceTracking[source]++;
    }

    if (diversifiedResults.length >= 60) break;
  }

  return diversifiedResults;
};

if (import.meta.main) {
  serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ip =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('cf-connecting-ip') ??
    'anonymous';
  const rate = SecurityValidator.checkRateLimit(ip, 60, 60_000);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const requestData = await req.json().catch(() => ({}));
    const { valid, errors, sanitizedData } = SecurityValidator.validateInput(
      requestData,
      {
        type: { required: true, type: 'string', enum: ['flight', 'hotel', 'activity', 'car', 'transfer'] },
        origin: { type: 'string', minLength: 2, maxLength: 100 },
        destination: { required: true, type: 'string', minLength: 2, maxLength: 100 },
        departureDate: { type: 'date' },
        returnDate: { type: 'date' },
        checkIn: { type: 'date' },
        checkOut: { type: 'date' },
        passengers: { type: 'number', min: 1, max: 9 },
        guests: { type: 'number', min: 1, max: 9 },
        rooms: { type: 'number', min: 1, max: 9 },
        providers: { type: 'array' }
      }
    );

    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid input', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params: SearchParams = sanitizedData as SearchParams;
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
    const aggregatedResults = await aggregateResults(successfulResults, type);

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
}