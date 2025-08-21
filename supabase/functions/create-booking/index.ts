import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      bookingType,
      bookingData,
      amount,
      currency,
      customerInfo,
      correlationId
    } = await req.json();

    console.log('Creating booking:', { bookingType, correlationId });

    const bookingRecord = {
      user_id: null, // Will be set by authentication if available
      booking_reference: `${bookingType.toUpperCase()}${Date.now()}`,
      status: 'pending',
      booking_type: bookingType,
      total_amount: amount,
      currency: currency.toUpperCase(),
      booking_data: {
        ...bookingData,
        customerInfo
      }
    };

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert(bookingRecord)
      .select()
      .single();

    if (bookingError) {
      throw new Error('Failed to create booking record');
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        confirmationNumber: booking.booking_reference,
        metadata: {
          supplierBookingId: booking.id,
          supplierConfirmation: booking.booking_reference
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Create booking error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});