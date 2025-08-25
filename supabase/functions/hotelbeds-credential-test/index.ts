import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getHotelBedsCredentials, validateHotelBedsCredentials } from "../_shared/config.ts";
import logger from "../_shared/simpleLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test HotelBeds credentials without making actual API calls
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('[HOTELBEDS-CREDENTIAL-TEST] Testing HotelBeds credentials');

    const results = {
      hotel: {
        hasCredentials: validateHotelBedsCredentials('hotel'),
        credentials: getHotelBedsCredentials('hotel'),
        usingServiceSpecific: !!Deno.env.get('HOTELBEDS_HOTEL_API_KEY')
      },
      activity: {
        hasCredentials: validateHotelBedsCredentials('activity'),
        credentials: getHotelBedsCredentials('activity'),
        usingServiceSpecific: !!Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY')
      },
      generic: {
        hasGenericCredentials: !!(Deno.env.get('HOTELBEDS_API_KEY') && Deno.env.get('HOTELBEDS_SECRET')),
        apiKeyLength: Deno.env.get('HOTELBEDS_API_KEY')?.length || 0,
        secretLength: Deno.env.get('HOTELBEDS_SECRET')?.length || 0
      }
    };

    // Sanitize credentials for logging (don't expose actual values)
    const sanitizedResults = {
      hotel: {
        hasCredentials: results.hotel.hasCredentials,
        apiKeyLength: results.hotel.credentials.apiKey?.length || 0,
        secretLength: results.hotel.credentials.secret?.length || 0,
        usingServiceSpecific: results.hotel.usingServiceSpecific
      },
      activity: {
        hasCredentials: results.activity.hasCredentials,
        apiKeyLength: results.activity.credentials.apiKey?.length || 0,
        secretLength: results.activity.credentials.secret?.length || 0,
        usingServiceSpecific: results.activity.usingServiceSpecific
      },
      generic: results.generic,
      summary: {
        hotelReady: results.hotel.hasCredentials,
        activityReady: results.activity.hasCredentials,
        recommendedAction: results.hotel.hasCredentials ? 
          (results.activity.hasCredentials ? 'All credentials configured ✅' : 'Add activity-specific credentials') :
          'Add hotel-specific credentials'
      }
    };

    logger.info('[HOTELBEDS-CREDENTIAL-TEST] Results:', sanitizedResults);

    return new Response(JSON.stringify({
      success: true,
      results: sanitizedResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[HOTELBEDS-CREDENTIAL-TEST] Test failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});