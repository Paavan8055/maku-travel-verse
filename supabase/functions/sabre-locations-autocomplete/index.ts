import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";
...
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('Sabre locations autocomplete request received');
    
    const body = await req.json();
    const { query, limit = 10 } = body;

    // Validate required parameters
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Query parameter must be at least 2 characters long' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Getting Sabre access token...');
    const accessToken = await getSabreAccessToken();
    
    logger.info(`Searching locations for query: ${query}`);
    const sabreResults = await searchLocations(query, limit, accessToken);
    
    logger.info('Sabre location data received, transforming...');
    const transformedLocations = transformSabreLocationResponse(sabreResults);
    
    return new Response(
      JSON.stringify({
        success: true,
        suggestions: transformedLocations,
        source: 'sabre',
        query: query,
        count: transformedLocations.length,
        rawData: sabreResults // Include for debugging
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error in sabre-locations-autocomplete:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        source: 'sabre'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});