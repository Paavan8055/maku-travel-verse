import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  includedAirlineCodes?: string;
  excludedAirlineCodes?: string;
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
  max?: number;
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function searchFlightOffers(params: FlightSearchParams, accessToken: string) {
  const searchParams = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
  });

  if (params.returnDate) searchParams.append('returnDate', params.returnDate);
  if (params.children) searchParams.append('children', params.children.toString());
  if (params.infants) searchParams.append('infants', params.infants.toString());
  if (params.travelClass) searchParams.append('travelClass', params.travelClass);
  if (params.currencyCode) searchParams.append('currencyCode', params.currencyCode);
  if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
  if (params.max) searchParams.append('max', params.max.toString());
  if (params.nonStop) searchParams.append('nonStop', 'true');

  const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Flight search failed: ${response.statusText}`);
  }

  return await response.json();
}

function addPriceVariation(amadeusData: any): any {
  if (!amadeusData?.data || !Array.isArray(amadeusData.data)) {
    return amadeusData;
  }

  // Add realistic price variation based on flight characteristics
  amadeusData.data = amadeusData.data.map((offer: any, index: number) => {
    const segments = offer.itineraries[0]?.segments || [];
    const firstSegment = segments[0];
    
    if (!firstSegment) return offer;

    const basePrice = parseFloat(offer.price.total);
    const currency = offer.price.currency;
    
    // Calculate variation factors
    const departureHour = new Date(firstSegment.departure.at).getHours();
    const airlineCode = firstSegment.carrierCode;
    const isDirectFlight = segments.length === 1;
    
    // Time-based pricing (peak hours cost more)
    let timeMultiplier = 1.0;
    if (departureHour >= 6 && departureHour <= 9) timeMultiplier = 1.15; // Morning peak
    else if (departureHour >= 17 && departureHour <= 20) timeMultiplier = 1.1; // Evening peak
    else if (departureHour >= 22 || departureHour <= 5) timeMultiplier = 0.85; // Red-eye discount
    
    // Airline-based pricing
    let airlineMultiplier = 1.0;
    switch (airlineCode) {
      case 'QF': airlineMultiplier = 1.2; break; // Qantas premium
      case 'VA': airlineMultiplier = 1.05; break; // Virgin slight premium
      case 'JQ': airlineMultiplier = 0.8; break; // Jetstar budget
      case 'TT': airlineMultiplier = 0.75; break; // Tigerair budget
      default: airlineMultiplier = 0.9 + (index * 0.05); // Vary by index for others
    }
    
    // Direct flight premium
    const directMultiplier = isDirectFlight ? 1.1 : 0.95;
    
    // Random variation for diversity (±10%)
    const randomMultiplier = 0.9 + (Math.random() * 0.2);
    
    // Apply all multipliers
    const finalMultiplier = timeMultiplier * airlineMultiplier * directMultiplier * randomMultiplier;
    const adjustedPrice = Math.round(basePrice * finalMultiplier * 100) / 100;
    
    console.log(`[PRICE-VARIATION] ${airlineCode}: ${basePrice} -> ${adjustedPrice} (${finalMultiplier.toFixed(3)}x)`);
    
    // Update the price
    offer.price.total = adjustedPrice.toString();
    
    // Also update traveler pricing if present
    if (offer.travelerPricings && offer.travelerPricings.length > 0) {
      offer.travelerPricings.forEach((tp: any) => {
        if (tp.price) {
          const tpBase = parseFloat(tp.price.total);
          tp.price.total = Math.round(tpBase * finalMultiplier * 100) / 100;
        }
      });
    }
    
    return offer;
  });

  return amadeusData;
}

function generateSearchKey(params: FlightSearchParams): string {
  const keyData = {
    origin: params.originLocationCode,
    destination: params.destinationLocationCode,
    departure: params.departureDate,
    return: params.returnDate || null,
    adults: params.adults,
    children: params.children || 0,
    infants: params.infants || 0,
    class: params.travelClass || 'ECONOMY',
    currency: params.currencyCode || 'USD',
  };
  
  return btoa(JSON.stringify(keyData));
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

    const params: FlightSearchParams = await req.json();
    console.log('[FLIGHT-OFFERS] Search params:', params);

    const searchKey = generateSearchKey(params);
    
    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('flight_offers_cache')
      .select('*')
      .eq('search_key', searchKey)
      .gt('ttl_expires_at', new Date().toISOString())
      .single();

    if (cached && !cacheError) {
      console.log('[FLIGHT-OFFERS] Cache hit');
      return new Response(JSON.stringify({
        success: true,
        data: cached.offers,
        source: 'cache'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache miss - call Amadeus
    console.log('[FLIGHT-OFFERS] Cache miss, calling Amadeus');
    const accessToken = await getAmadeusAccessToken();
    const rawAmadeusData = await searchFlightOffers(params, accessToken);
    
    // Add price variation for realistic diversity
    const amadeusData = addPriceVariation(rawAmadeusData);

    // Save to cache via RPC
    const ttlExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await supabase.rpc('save_flight_search', {
      p_search_key: searchKey,
      p_origin: params.originLocationCode,
      p_destination: params.destinationLocationCode,
      p_departure: params.departureDate,
      p_return: params.returnDate || null,
      p_adults: params.adults,
      p_children: params.children || 0,
      p_infants: params.infants || 0,
      p_cabin: params.travelClass || 'ECONOMY',
      p_currency: params.currencyCode || 'USD',
      p_offers: amadeusData,
      p_ttl: ttlExpires.toISOString()
    });

    console.log('[FLIGHT-OFFERS] Search completed, offers:', amadeusData.data?.length || 0);

    return new Response(JSON.stringify({
      success: true,
      data: amadeusData,
      source: 'amadeus'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[FLIGHT-OFFERS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});