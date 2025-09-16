import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";

interface GuestLookupRequest {
  email: string;
  booking_reference?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, email, bookingReference, accessToken }: GuestLookupParams = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let booking = null;

    // Method 1: Direct booking lookup by ID
    if (bookingId) {
      const { data, error } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (data && !error) {
        booking = data;
      }
    }

    // Method 2: Guest booking token verification
    if (!booking && bookingId && email && accessToken) {
      const hasAccess = await supabaseClient.rpc('verify_guest_booking_access', {
        _booking_id: bookingId,
        _email: email,
        _token: accessToken
      });

      if (hasAccess.data) {
        const { data } = await supabaseClient
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        booking = data;
      }
    }

    // Method 3: Lookup by email and booking reference
    if (!booking && email && bookingReference) {
      const { data } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('booking_reference', bookingReference)
        .eq('booking_data->customerInfo->>email', email)
        .single();

      booking = data;
    }

    if (!booking) {
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log successful access
    await supabaseClient.rpc('log_booking_access', {
      _booking_id: booking.id,
      _access_type: 'guest_lookup',
      _access_method: accessToken ? 'token' : 'email_reference',
      _success: true
    });

    logger.info(`Guest booking lookup successful: ${booking.booking_reference}`);

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          booking_reference: booking.booking_reference,
          status: booking.status,
          total_amount: booking.total_amount,
          currency: booking.currency,
          booking_type: booking.booking_type,
          booking_data: booking.booking_data,
          created_at: booking.created_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Guest booking lookup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to lookup booking'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});