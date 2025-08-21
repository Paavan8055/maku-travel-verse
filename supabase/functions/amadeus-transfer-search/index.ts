import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferSearchParams {
  startLocationCode: string;
  endLocationCode: string;
  transferType: 'PRIVATE' | 'SHARED' | 'TAXI' | 'HOURLY';
  startDateTime: string;
  endDateTime?: string;
  passengers: number;
  startConnectedSegment?: {
    transportationType: string;
    transportationNumber: string;
    departure?: {
      localDateTime: string;
      iataCode: string;
    };
  };
  endConnectedSegment?: {
    transportationType: string;
    transportationNumber: string;
    arrival?: {
      localDateTime: string;
      iataCode: string;
    };
  };
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

async function searchTransfers(params: TransferSearchParams, accessToken: string) {
  const requestBody = {
    startLocationCode: params.startLocationCode,
    endLocationCode: params.endLocationCode,
    transferType: params.transferType,
    startDateTime: params.startDateTime,
    passengers: params.passengers,
  };

  if (params.endDateTime) {
    requestBody['endDateTime'] = params.endDateTime;
  }

  if (params.startConnectedSegment) {
    requestBody['startConnectedSegment'] = params.startConnectedSegment;
  }

  if (params.endConnectedSegment) {
    requestBody['endConnectedSegment'] = params.endConnectedSegment;
  }

  const response = await fetch('https://test.api.amadeus.com/v1/shopping/transfer-offers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Transfer search API error:', errorText);
    throw new Error(`Transfer search failed: ${response.statusText}`);
  }

  return await response.json();
}

function generateSearchKey(params: TransferSearchParams): string {
  const keyData = {
    start: params.startLocationCode,
    end: params.endLocationCode,
    type: params.transferType,
    startTime: params.startDateTime,
    endTime: params.endDateTime || null,
    passengers: params.passengers,
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

    const params: TransferSearchParams = await req.json();
    logger.info('[TRANSFER-SEARCH] Search params:', params);

    const searchKey = generateSearchKey(params);
    
    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('transfers_offers_cache')
      .select('*')
      .eq('search_key', searchKey)
      .gt('ttl_expires_at', new Date().toISOString())
      .single();

    if (cached && !cacheError) {
      logger.info('[TRANSFER-SEARCH] Cache hit');
      return new Response(JSON.stringify({
        success: true,
        data: cached.offers,
        source: 'cache'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache miss - call Amadeus
    logger.info('[TRANSFER-SEARCH] Cache miss, calling Amadeus');
    const accessToken = await getAmadeusAccessToken();
    const amadeusData = await searchTransfers(params, accessToken);

    // Save to cache via RPC
    const ttlExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await supabase.rpc('save_transfer_search', {
      p_search_key: searchKey,
      p_origin: { locationCode: params.startLocationCode },
      p_destination: { locationCode: params.endLocationCode },
      p_pickup: params.startDateTime,
      p_passengers: params.passengers,
      p_luggage: {},
      p_offers: amadeusData,
      p_ttl: ttlExpires.toISOString()
    });

    logger.info('[TRANSFER-SEARCH] Search completed, offers:', amadeusData.data?.length || 0);

    return new Response(JSON.stringify({
      success: true,
      data: amadeusData,
      source: 'amadeus'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('[TRANSFER-SEARCH] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});