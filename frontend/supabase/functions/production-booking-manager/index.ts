import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const bookingRequest = await req.json();
    const bookingReference = `MAKU-${Date.now()}`;
    
    // Create booking record
    const { data: booking, error } = await supabaseClient
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        booking_type: bookingRequest.booking_type || 'hotel',
        status: 'confirmed',
        total_amount: bookingRequest.total_amount || 0,
        currency: bookingRequest.currency || 'AUD',
        booking_data: bookingRequest
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({
      booking_id: booking.id,
      booking_reference: bookingReference,
      status: 'confirmed'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Booking failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});