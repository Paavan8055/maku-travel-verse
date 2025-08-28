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
    const hotelbedsHotelKey = Deno.env.get('HOTELBEDS_HOTEL_API_KEY');
    const hotelbedsHotelSecret = Deno.env.get('HOTELBEDS_HOTEL_SECRET');
    const hotelbedsActivityKey = Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY');
    const hotelbedsActivitySecret = Deno.env.get('HOTELBEDS_ACTIVITY_SECRET');
    const sabreClientId = Deno.env.get('SABRE_CLIENT_ID');
    const sabreClientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
    const sabreTestPcc = Deno.env.get('SABRE_TEST_PCC');
    const sabreProdPcc = Deno.env.get('SABRE_PROD_PCC');
    const sabreEprId = Deno.env.get('SABRE_EPR_ID');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test deployment function is working',
      timestamp: new Date().toISOString(),
      secrets_check: {
        amadeus_client_id: amadeusClientId ? 'Present' : 'Missing',
        amadeus_secret: amadeusSecret ? 'Present' : 'Missing', 
        hotelbeds_hotel_key: hotelbedsHotelKey ? 'Present' : 'Missing',
        hotelbeds_hotel_secret: hotelbedsHotelSecret ? 'Present' : 'Missing',
        hotelbeds_activity_key: hotelbedsActivityKey ? 'Present' : 'Missing',
        hotelbeds_activity_secret: hotelbedsActivitySecret ? 'Present' : 'Missing',
        sabre_client_id: sabreClientId ? 'Present' : 'Missing',
        sabre_client_secret: sabreClientSecret ? 'Present' : 'Missing',
        sabre_test_pcc: sabreTestPcc ? 'Present' : 'Missing',
        sabre_prod_pcc: sabreProdPcc ? 'Present' : 'Missing',
        sabre_epr_id: sabreEprId ? 'Present' : 'Missing'
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