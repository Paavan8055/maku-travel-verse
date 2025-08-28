import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('🔧 CRITICAL DEBUG: Testing real hotel search params...');
    
    const testParams = {
      destination: 'Sydney',
      destinationCode: 'SYD',
      cityIata: 'SYD',
      checkIn: '2025-08-25',
      checkOut: '2025-08-26',
      guests: 2,
      rooms: 1,
      adults: 2,
      children: 0
    };

    console.log('Testing parameters:', testParams);

    // Test 1: Provider Rotation
    console.log('🔄 Testing provider-rotation function...');
    const rotationTest = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType: 'hotel',
        params: testParams
      }
    });

    console.log('Provider Rotation Result:', {
      success: !rotationTest.error,
      error: rotationTest.error?.message,
      data: rotationTest.data
    });

    // Test 2: Direct Amadeus Test
    console.log('🏨 Testing amadeus-hotel-search directly...');
    const amadeusTest = await supabase.functions.invoke('amadeus-hotel-search', {
      body: testParams
    });

    console.log('Amadeus Direct Result:', {
      success: !amadeusTest.error,
      error: amadeusTest.error?.message,
      dataKeys: amadeusTest.data ? Object.keys(amadeusTest.data) : null
    });

    // Test 3: Direct HotelBeds Test
    console.log('🛏️ Testing hotelbeds-search directly...');
    const hotelbedsTest = await supabase.functions.invoke('hotelbeds-search', {
      body: testParams
    });

    console.log('HotelBeds Direct Result:', {
      success: !hotelbedsTest.error,
      error: hotelbedsTest.error?.message,
      dataKeys: hotelbedsTest.data ? Object.keys(hotelbedsTest.data) : null
    });

    // Test 4: Check API credentials
    console.log('🔑 Checking API credentials...');
    const credentials = {
      AMADEUS_CLIENT_ID: !!Deno.env.get('AMADEUS_CLIENT_ID'),
      AMADEUS_CLIENT_SECRET: !!Deno.env.get('AMADEUS_CLIENT_SECRET'),
      HOTELBEDS_HOTEL_API_KEY: !!Deno.env.get('HOTELBEDS_HOTEL_API_KEY'),
      HOTELBEDS_HOTEL_SECRET: !!Deno.env.get('HOTELBEDS_HOTEL_SECRET'),
      HOTELBEDS_ACTIVITY_API_KEY: !!Deno.env.get('HOTELBEDS_ACTIVITY_API_KEY'),
      HOTELBEDS_ACTIVITY_SECRET: !!Deno.env.get('HOTELBEDS_ACTIVITY_SECRET'),
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    };

    console.log('Credentials Status:', credentials);

    // Test 5: Check provider configs in DB
    const { data: providers } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('type', 'hotel')
      .eq('enabled', true);

    console.log('Active Hotel Providers:', providers?.length || 0);

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      testResults: {
        providerRotation: {
          success: !rotationTest.error,
          error: rotationTest.error?.message,
          data: rotationTest.data
        },
        amadeusDirectTest: {
          success: !amadeusTest.error,
          error: amadeusTest.error?.message,
          hasData: !!amadeusTest.data
        },
        hotelbedsDirectTest: {
          success: !hotelbedsTest.error,
          error: hotelbedsTest.error?.message,
          hasData: !!hotelbedsTest.data
        },
        credentials,
        activeProviders: providers?.length || 0
      },
      recommendations: [
        'Check if all provider edge functions are deployed correctly',
        'Verify API credentials are valid and not expired',
        'Ensure provider endpoints are accessible from Supabase',
        'Check if rate limits are being hit on external APIs'
      ]
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Critical debug failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});