import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Updating provider configurations for system recovery...');

    // Enable Amadeus and update priorities for better performance
    const { error: amadeusError } = await supabase
      .from('provider_configs')
      .update({ 
        enabled: true, 
        priority: 1, 
        health_score: 95,
        response_time: 300
      })
      .eq('id', 'amadeus');

    if (amadeusError) {
      console.error('Failed to update Amadeus config:', amadeusError);
    } else {
      console.log('✅ Amadeus provider enabled and priority updated');
    }

    // Update Sabre providers to better priorities and health scores
    const { error: sabreFlightError } = await supabase
      .from('provider_configs')
      .update({ 
        enabled: true, 
        priority: 2, 
        health_score: 85,
        response_time: 500
      })
      .eq('id', 'sabre-flight');

    const { error: sabreHotelError } = await supabase
      .from('provider_configs')
      .update({ 
        enabled: true, 
        priority: 3, 
        health_score: 80,
        response_time: 600
      })
      .eq('id', 'sabre-hotel');

    // Update HotelBeds providers
    const { error: hotelbedsHotelError } = await supabase
      .from('provider_configs')
      .update({ 
        enabled: true, 
        priority: 2, 
        health_score: 90,
        response_time: 400
      })
      .eq('id', 'hotelbeds-hotel');

    const { error: hotelbedsActivityError } = await supabase
      .from('provider_configs')
      .update({ 
        enabled: true, 
        priority: 1, 
        health_score: 88,
        response_time: 450
      })
      .eq('id', 'hotelbeds-activity');

    // Reset circuit breaker states to closed for all providers
    const { error: circuitBreakerError } = await supabase
      .from('provider_configs')
      .update({ 
        circuit_breaker_state: 'closed',
        circuit_breaker: {
          failureCount: 0,
          lastFailure: null,
          state: 'closed',
          timeout: 30000
        }
      })
      .neq('id', 'invalid-provider'); // Update all providers

    const results = {
      amadeus: !amadeusError,
      sabreFlight: !sabreFlightError,
      sabreHotel: !sabreHotelError,
      hotelbedsHotel: !hotelbedsHotelError,
      hotelbedsActivity: !hotelbedsActivityError,
      circuitBreakerReset: !circuitBreakerError,
      timestamp: new Date().toISOString()
    };

    // Get updated provider configs for verification
    const { data: updatedConfigs } = await supabase
      .from('provider_configs')
      .select('*')
      .order('priority');

    console.log('✅ Provider configuration update completed:', results);

    return new Response(JSON.stringify({
      success: true,
      message: 'Provider configurations updated successfully',
      results,
      updatedConfigs: updatedConfigs || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Provider configuration update failed:', error);
    
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