import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentIntentId, reason = 'user_cancelled' } = await req.json();

    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'paymentIntentId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error('Supabase configuration missing');
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceRole, { 
      auth: { persistSession: false } 
    });

    logger.info('Cancelling payment intent', { paymentIntentId, reason });

    let cancelled = false;
    let stripeStatus = '';

    try {
      // Try to retrieve and cancel the payment intent in Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      stripeStatus = paymentIntent.status;

      if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status)) {
        await stripe.paymentIntents.cancel(paymentIntentId);
        cancelled = true;
        logger.info('Payment intent cancelled in Stripe', { paymentIntentId });
      } else {
        logger.info('Payment intent cannot be cancelled', { 
          paymentIntentId, 
          status: paymentIntent.status 
        });
      }
    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        logger.warn('Payment intent not found in Stripe', { paymentIntentId });
        cancelled = true; // Consider it cancelled if it doesn't exist
      } else {
        logger.error('Stripe cancellation error:', stripeError);
        throw stripeError;
      }
    }

    // Update related booking status
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_reference, status')
      .or(`booking_data->>stripe_payment_intent_id.eq.${paymentIntentId},booking_data->>stripe_session_id.eq.${paymentIntentId}`);

    if (bookings && bookings.length > 0) {
      for (const booking of bookings) {
        if (booking.status === 'pending') {
          await supabase
            .from('bookings')
            .update({ 
              status: reason === 'timeout' ? 'expired' : 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          logger.info('Booking status updated', { 
            bookingId: booking.id, 
            reference: booking.booking_reference,
            newStatus: reason === 'timeout' ? 'expired' : 'cancelled'
          });
        }
      }
    }

    // Update payment records
    await supabase
      .from('payments')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    return new Response(
      JSON.stringify({
        success: true,
        cancelled,
        reason,
        stripeStatus,
        bookingsUpdated: bookings?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    logger.error('cancel-payment-intent error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Cancellation failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});