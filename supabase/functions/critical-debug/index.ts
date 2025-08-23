import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CRITICAL DEBUG FUNCTION CALLED ===');
    
    // Test environment variables
    const amadeusClientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const amadeusSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
    const hotelbedsKey = Deno.env.get('HOTELBEDS_API_KEY');
    const hotelbedsSecret = Deno.env.get('HOTELBEDS_SECRET');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    console.log('Environment check:', {
      amadeus_client_id: amadeusClientId ? `Present (${amadeusClientId.substring(0, 4)}...)` : 'MISSING',
      amadeus_secret: amadeusSecret ? `Present (${amadeusSecret.substring(0, 4)}...)` : 'MISSING',
      hotelbeds_key: hotelbedsKey ? `Present (${hotelbedsKey.substring(0, 4)}...)` : 'MISSING',
      hotelbeds_secret: hotelbedsSecret ? `Present (${hotelbedsSecret.substring(0, 4)}...)` : 'MISSING',
      stripe_key: stripeKey ? `Present (${stripeKey.substring(0, 4)}...)` : 'MISSING'
    });

    // Test Amadeus API connectivity
    let amadeusTest = 'Not tested';
    if (amadeusClientId && amadeusSecret) {
      try {
        const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: amadeusClientId,
            client_secret: amadeusSecret,
          }),
        });
        amadeusTest = tokenResponse.ok ? 'SUCCESS' : `FAILED: ${tokenResponse.status}`;
      } catch (error) {
        amadeusTest = `ERROR: ${error.message}`;
      }
    } else {
      amadeusTest = 'SKIPPED: Missing credentials';
    }

    const result = {
      success: true,
      message: 'Critical debug function is working!',
      timestamp: new Date().toISOString(),
      environment_status: {
        amadeus_client_id: amadeusClientId ? 'Present' : 'MISSING',
        amadeus_secret: amadeusSecret ? 'Present' : 'MISSING',
        hotelbeds_key: hotelbedsKey ? 'Present' : 'MISSING',
        hotelbeds_secret: hotelbedsSecret ? 'Present' : 'MISSING',
        stripe_key: stripeKey ? 'Present' : 'MISSING'
      },
      amadeus_api_test: amadeusTest,
      deployment_status: 'DEPLOYED AND CALLABLE'
    };

    console.log('=== DEBUG RESULT ===', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== CRITICAL DEBUG ERROR ===', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      deployment_status: 'DEPLOYED BUT ERRORING'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});