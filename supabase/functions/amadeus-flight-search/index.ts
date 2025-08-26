import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";
import { getAmadeusAccessToken } from "../_shared/amadeus.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[AMADEUS-FLIGHT] Request received', { method: req.method });
    
    const { 
      originLocationCode, 
      destinationLocationCode, 
      departureDate, 
      returnDate,
      adults = 1, 
      children = 0, 
      infants = 0, 
      travelClass = 'ECONOMY',
      nonStop = false 
    } = await req.json();

    logger.info('Flight search parameters:', {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults
    });

    // Credentials check
    logger.info('Amadeus flight search credentials check:', {
      clientIdExists: !!ENV_CONFIG.AMADEUS_CLIENT_ID,
      clientSecretExists: !!ENV_CONFIG.AMADEUS_CLIENT_SECRET
    });

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    logger.info('✅ Successfully obtained Amadeus token');

    // Build search parameters
    const searchParams = new URLSearchParams({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: adults.toString(),
      nonStop: nonStop.toString(),
      currencyCode: 'AUD',
      max: '10'
    });

    if (returnDate) {
      searchParams.append('returnDate', returnDate);
    }
    if (children > 0) {
      searchParams.append('children', children.toString());
    }
    if (infants > 0) {
      searchParams.append('infants', infants.toString());
    }
    if (travelClass && travelClass !== 'ECONOMY') {
      searchParams.append('travelClass', travelClass);
    }

    // Search for flights
    const searchUrl = `${ENV_CONFIG.amadeus?.baseUrl || 'https://test.api.amadeus.com'}/v2/shopping/flight-offers?${searchParams}`;
    
    logger.info('Making Amadeus API request to:', searchUrl);

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Amadeus API error:', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Flight search failed: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info('✅ Successfully retrieved flight offers', { 
      count: data.data?.length || 0 
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: data.data || [],
        meta: data.meta || {},
        dictionaries: data.dictionaries || {}
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    logger.error('Amadeus flight search error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Flight search failed',
        details: 'Unable to search for flights at this time'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});