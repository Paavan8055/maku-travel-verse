import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import logger from "../_shared/logger.ts";
import { ENV_CONFIG } from "../_shared/config.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";

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
    logger.info('[SABRE-FLIGHT] Request received', { method: req.method });
    
    const { 
      originLocationCode, 
      destinationLocationCode, 
      departureDate, 
      returnDate,
      adults = 1 
    } = await req.json();

    logger.info('Sabre flight search parameters:', {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults
    });

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();
    logger.info('✅ Successfully obtained Sabre token');

    // Build search URL with query parameters for InstaFlights Search API
    const searchUrl = new URL('/v1/shop/flights', ENV_CONFIG.sabre?.baseUrl || 'https://api-crt.cert.havail.sabre.com');
    
    // Add query parameters for InstaFlights Search API
    searchUrl.searchParams.append('origin', originLocationCode);
    searchUrl.searchParams.append('destination', destinationLocationCode);
    searchUrl.searchParams.append('departuredate', departureDate);
    searchUrl.searchParams.append('passengercount', adults.toString());
    searchUrl.searchParams.append('limit', '50');
    searchUrl.searchParams.append('offset', '1');
    
    if (returnDate) {
      searchUrl.searchParams.append('returndate', returnDate);
    }
    
    logger.info('Making Sabre API request to:', searchUrl.toString());

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Sabre API error:', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Sabre API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.info('✅ Successfully retrieved Sabre flight offers');

    // Transform Sabre InstaFlights response to standard format
    const flights = data.PricedItineries || data.PricedItineraries || [];
    const transformedData = {
      data: flights,
      meta: {
        count: flights.length || 0,
        currency: data.Links?.LinkCurrency || 'USD'
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...transformedData
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    logger.error('Sabre flight search error:', error);
    
    // Enhanced error handling with specific status codes
    let status = 500;
    let errorDetails = 'Unable to search for flights at this time';
    
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
      status = 401;
      errorDetails = 'Sabre API authentication failed - please check credentials';
    } else if (error.message?.includes('403')) {
      status = 403;
      errorDetails = 'Sabre API access denied - insufficient permissions';
    } else if (error.message?.includes('429')) {
      status = 429;
      errorDetails = 'Sabre API rate limit exceeded - please try again later';
    } else if (error.message?.includes('credentials not configured')) {
      status = 503;
      errorDetails = 'Sabre API credentials not configured';
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Sabre flight search failed',
        details: errorDetails,
        provider: 'sabre',
        timestamp: new Date().toISOString()
      }),
      { 
        status,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});