import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    console.log('Test deployment function called successfully');
    
    // Test if secrets are available
    const amadeusClientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const amadeusSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
    const hotelbedsKey = Deno.env.get('HOTELBEDS_API_KEY');
    const hotelbedsSecret = Deno.env.get('HOTELBEDS_SECRET');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test deployment function is working',
      timestamp: new Date().toISOString(),
      secrets_check: {
        amadeus_client_id: amadeusClientId ? 'Present' : 'Missing',
        amadeus_secret: amadeusSecret ? 'Present' : 'Missing', 
        hotelbeds_key: hotelbedsKey ? 'Present' : 'Missing',
        hotelbeds_secret: hotelbedsSecret ? 'Present' : 'Missing'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Test deployment function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});