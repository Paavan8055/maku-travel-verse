import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";
...
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    // Create Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { payment_intent_id, booking_id }: VerifyPaymentParams = await req.json();

    if (!payment_intent_id || !booking_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Verifying payment and completing booking:', { payment_intent_id, booking_id });

    // Step 1: Verify payment with Stripe
    const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${payment_intent_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    const paymentIntent = await stripeResponse.json();

    if (!stripeResponse.ok) {
      logger.error('Stripe verification error:', paymentIntent);
      throw new Error('Failed to verify payment with Stripe');
    }

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment not completed',
          payment_status: paymentIntent.status 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Step 3: Complete booking with supplier (only if not already confirmed)
    if (booking.status === 'confirmed') {
      logger.info('Booking already confirmed:', booking_id);
      return new Response(
        JSON.stringify({
          success: true,
          booking_id,
          status: 'already_confirmed',
          confirmation_number: booking.booking_data?.confirmation?.confirmationNumber
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const accessToken = await getAmadeusAccessToken();
    const supplierResult = await completeHotelBookingWithSupplier(booking.booking_data, accessToken);

    if (!supplierResult.success) {
      // Payment succeeded but supplier booking failed - mark for refund
      await supabaseClient
        .from('bookings')
        .update({ 
          status: 'failed_after_payment',
          booking_data: {
            ...booking.booking_data,
            failureReason: 'Supplier booking failed after payment',
            needsRefund: true,
            failedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString() 
        })
        .eq('id', booking_id);

      throw new Error('Hotel booking failed with supplier after payment. Refund will be processed.');
    }

    // Step 4: Update booking with supplier confirmation
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        status: 'confirmed',
        booking_data: {
          ...booking.booking_data,
          confirmation: supplierResult.confirmation,
          confirmedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (updateError) {
      logger.error('Booking update error:', updateError);
      throw new Error('Failed to update booking confirmation');
    }

    // Step 5: Update payment status
    await supabaseClient
      .from('payments')
      .update({ 
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', booking_id)
      .eq('stripe_payment_intent_id', payment_intent_id);

    logger.info(`✅ Payment verified and booking confirmed: ${booking_id} with confirmation: ${supplierResult.confirmation.confirmationNumber}`);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id,
        confirmation_number: supplierResult.confirmation.confirmationNumber,
        supplier_reference: supplierResult.confirmation.supplierReference,
        status: 'confirmed'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Payment verification and booking completion error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment and complete booking'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});