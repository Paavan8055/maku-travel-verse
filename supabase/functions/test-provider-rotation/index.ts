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
    console.log('🧪 Testing provider rotation for all services...');
    
    const testResults = [];
    
    // Test hotel search
    console.log('Testing hotel search...');
    const hotelTest = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType: 'hotel',
        params: {
          destination: 'Sydney',
          checkIn: '2025-08-25',
          checkOut: '2025-08-26',
          guests: 2,
          rooms: 1
        }
      }
    });
    
    testResults.push({
      service: 'hotel',
      success: !hotelTest.error,
      provider: hotelTest.data?.provider,
      results: hotelTest.data?.data?.hotels?.length || 0,
      error: hotelTest.error?.message
    });
    
    // Test activity search  
    console.log('Testing activity search...');
    const activityTest = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType: 'activity',
        params: {
          destination: 'Sydney',
          from: '2025-08-25',
          to: '2025-08-31',
          language: 'en'
        }
      }
    });
    
    testResults.push({
      service: 'activity',
      success: !activityTest.error,
      provider: activityTest.data?.provider,
      results: activityTest.data?.data?.activities?.length || 0,
      error: activityTest.error?.message
    });
    
    // Test flight search
    console.log('Testing flight search...');
    const flightTest = await supabase.functions.invoke('provider-rotation', {
      body: {
        searchType: 'flight',
        params: {
          origin: 'SYD',
          destination: 'LAX',
          departure_date: '2025-08-25',
          passengers: 2,
          travelClass: 'ECONOMY'
        }
      }
    });
    
    testResults.push({
      service: 'flight',
      success: !flightTest.error,
      provider: flightTest.data?.provider,
      results: flightTest.data?.data?.flights?.length || 0,
      error: flightTest.error?.message
    });

    console.log('🏁 Test results:', testResults);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      testResults,
      summary: {
        total: testResults.length,
        successful: testResults.filter(r => r.success).length,
        failed: testResults.filter(r => !r.success).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});