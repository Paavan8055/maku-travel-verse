import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export async function handler(req: Request, supabaseClient?: any): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingReference, email, accessToken } = await req.json();

    if (!bookingReference || !email) {
      throw new Error('Booking reference and email are required');
    }

    // Initialize Supabase client with service role to bypass RLS
    const client =
      supabaseClient ??
      createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

    logger.info('Looking up booking:', { bookingReference, email });

    // Get booking by reference
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select('*')
      .eq('booking_reference', bookingReference)
      .single();

    if (bookingError || !booking) {
      logger.error('Booking not found:', bookingError?.message);
      throw new Error('Booking not found');
    }

    // Verify guest access using the RPC function
    const { data: hasAccess, error: verifyError } = await client
      .rpc('verify_guest_booking_access', {
        _booking_id: booking.id,
        _email: email,
        _token: accessToken || null
      });

    if (verifyError || !hasAccess) {
      logger.error('Access verification failed:', verifyError?.message);
      
      // Log failed access attempt
      await client.rpc('log_booking_access', {
        _booking_id: booking.id,
        _access_type: 'guest_lookup',
        _access_method: accessToken ? 'token' : 'email',
        _success: false,
        _failure_reason: 'Invalid credentials'
      });
      
      throw new Error('Access denied - invalid credentials');
    }

    // Log successful access
    await client.rpc('log_booking_access', {
      _booking_id: booking.id,
      _access_type: 'guest_lookup',
      _access_method: accessToken ? 'token' : 'email',
      _success: true
    });

    // Get booking items
    const { data: bookingItems, error: itemsError } = await client
      .from('booking_items')
      .select('*')
      .eq('booking_id', booking.id);

    if (itemsError) {
      logger.error('Failed to fetch booking items:', itemsError);
    }

    // Get latest payment
    const { data: latestPayment, error: paymentError } = await client
      .from('payments')
      .select('*')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      logger.error('Failed to fetch payment:', paymentError);
    }

    // Prepare response data
    const responseData = {
      id: booking.id,
      booking_reference: booking.booking_reference,
      status: booking.status,
      booking_type: booking.booking_type,
      total_amount: booking.total_amount,
      currency: booking.currency,
      booking_data: booking.booking_data,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      items: bookingItems || [],
      latest_payment: latestPayment || null
    };

    logger.info('Booking lookup successful:', booking.booking_reference);

    return new Response(
      JSON.stringify({
        success: true,
        booking: responseData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Guest booking lookup error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Use built-in Deno.serve when available
if (import.meta.main && typeof Deno !== 'undefined' && 'serve' in Deno) {
  Deno.serve(handler);
}