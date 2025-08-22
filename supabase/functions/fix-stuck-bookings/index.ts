import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error('Missing required configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    logger.info('Starting stuck bookings recovery process');

    // Find stuck bookings (pending for more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: stuckBookings, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id, 
        booking_reference, 
        status, 
        booking_data, 
        created_at,
        payments(stripe_payment_intent_id, status)
      `)
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch stuck bookings: ${fetchError.message}`);
    }

    logger.info(`Found ${stuckBookings?.length || 0} stuck bookings to process`);

    const recoveryResults = [];
    
    for (const booking of stuckBookings || []) {
      try {
        const result = await recoverStuckBooking(booking, stripe, supabase);
        recoveryResults.push(result);
        logger.info('Processed stuck booking:', result);
      } catch (error) {
        logger.error('Failed to recover booking:', { bookingId: booking.id, error: error.message });
        recoveryResults.push({
          booking_id: booking.id,
          booking_reference: booking.booking_reference,
          status: 'recovery_failed',
          error: error.message
        });
      }
    }

    const summary = {
      total_processed: recoveryResults.length,
      recovered: recoveryResults.filter(r => r.status === 'recovered').length,
      confirmed: recoveryResults.filter(r => r.status === 'confirmed').length,
      failed: recoveryResults.filter(r => r.status === 'failed').length,
      recovery_failed: recoveryResults.filter(r => r.status === 'recovery_failed').length
    };

    logger.info('Stuck bookings recovery completed:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results: recoveryResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    logger.error('Error in fix-stuck-bookings:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function recoverStuckBooking(booking: any, stripe: Stripe, supabase: any) {
  const paymentIntentId = booking.booking_data?.stripe_payment_intent_id;
  
  if (!paymentIntentId) {
    // No payment intent found, mark as failed
    await supabase
      .from('bookings')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);
      
    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      status: 'failed',
      reason: 'No payment intent found'
    };
  }

  try {
    // Check payment intent status in Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    let newStatus: string;
    let reason: string;
    
    switch (paymentIntent.status) {
      case 'succeeded':
        newStatus = 'confirmed';
        reason = 'Payment succeeded in Stripe, confirming booking';
        
        // Update payment record if exists
        await supabase
          .from('payments')
          .update({ 
            status: 'succeeded',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntentId);
        break;
        
      case 'processing':
        newStatus = 'processing';
        reason = 'Payment is still processing in Stripe';
        break;
        
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        newStatus = 'pending';
        reason = `Payment requires action: ${paymentIntent.status}`;
        break;
        
      case 'canceled':
      case 'payment_failed':
        newStatus = 'failed';
        reason = `Payment failed in Stripe: ${paymentIntent.status}`;
        break;
        
      default:
        newStatus = 'pending';
        reason = `Unknown payment status: ${paymentIntent.status}`;
    }

    // Update booking status
    if (newStatus !== 'pending') {
      await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
    }

    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      status: newStatus === 'confirmed' ? 'recovered' : newStatus,
      reason,
      stripe_status: paymentIntent.status
    };
    
  } catch (stripeError) {
    logger.error('Failed to check Stripe payment intent:', { 
      paymentIntentId, 
      error: stripeError.message 
    });
    
    // If payment intent doesn't exist in Stripe, mark booking as failed
    if (stripeError.code === 'resource_missing') {
      await supabase
        .from('bookings')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
        
      return {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        status: 'failed',
        reason: 'Payment intent not found in Stripe'
      };
    }
    
    throw stripeError;
  }
}