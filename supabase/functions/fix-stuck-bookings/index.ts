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

  const startTime = Date.now();
  let auditData = {
    bookings_processed: 0,
    bookings_expired: 0,
    payments_cancelled: 0,
    errors_encountered: 0,
    triggered_by: 'manual'
  };

  try {
    // Parse request body for automated cleanup parameters
    const body = req.method === 'POST' ? await req.json() : {};
    const isAutomated = body.automated || false;
    const timeoutMinutes = body.timeout_minutes || 2; // Reduced from 60 to 2 minutes
    
    if (isAutomated) {
      auditData.triggered_by = 'automated';
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error('Missing required configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    logger.info('Starting stuck bookings recovery process', { 
      automated: isAutomated, 
      timeoutMinutes 
    });

    // Find stuck bookings (pending for more than specified timeout)
    const timeoutAgo = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
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
      .lt('created_at', timeoutAgo.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch stuck bookings: ${fetchError.message}`);
    }

    logger.info(`Found ${stuckBookings?.length || 0} stuck bookings to process`);

    const recoveryResults = [];
    auditData.bookings_processed = stuckBookings?.length || 0;
    
    for (const booking of stuckBookings || []) {
      try {
        const result = await recoverStuckBooking(booking, stripe, supabase, isAutomated);
        recoveryResults.push(result);
        
        // Track cleanup metrics
        if (result.status === 'failed' || result.status === 'expired') {
          auditData.bookings_expired++;
        }
        if (result.payment_cancelled) {
          auditData.payments_cancelled++;
        }
        
        logger.info('Processed stuck booking:', result);
      } catch (error) {
        auditData.errors_encountered++;
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
      expired: recoveryResults.filter(r => r.status === 'expired').length,
      recovery_failed: recoveryResults.filter(r => r.status === 'recovery_failed').length
    };

    // Log cleanup audit
    const executionTime = Date.now() - startTime;
    await supabase
      .from('cleanup_audit')
      .insert({
        cleanup_type: 'stuck_bookings',
        ...auditData,
        execution_time_ms: executionTime,
        details: { summary, timeout_minutes: timeoutMinutes }
      });

    logger.info('Stuck bookings recovery completed:', { summary, executionTime });

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

async function recoverStuckBooking(booking: any, stripe: Stripe, supabase: any, isAutomated = false) {
  const paymentIntentId = booking.booking_data?.stripe_payment_intent_id;
  let paymentCancelled = false;
  
  if (!paymentIntentId) {
    // No payment intent found, mark as expired for automated cleanup
    const newStatus = isAutomated ? 'expired' : 'failed';
    await supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);
      
    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      status: newStatus,
      reason: 'No payment intent found',
      payment_cancelled: paymentCancelled
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
        newStatus = isAutomated ? 'expired' : 'failed';
        reason = `Payment failed in Stripe: ${paymentIntent.status}`;
        
        // Cancel payment intent if automated cleanup and still cancelable
        if (isAutomated && ['requires_payment_method', 'requires_confirmation'].includes(paymentIntent.status)) {
          try {
            await stripe.paymentIntents.cancel(paymentIntentId);
            paymentCancelled = true;
            logger.info('Cancelled payment intent during automated cleanup', { paymentIntentId });
          } catch (cancelError) {
            logger.warn('Failed to cancel payment intent', { paymentIntentId, error: cancelError.message });
          }
        }
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
      stripe_status: paymentIntent.status,
      payment_cancelled: paymentCancelled
    };
    
  } catch (stripeError) {
    logger.error('Failed to check Stripe payment intent:', { 
      paymentIntentId, 
      error: stripeError.message 
    });
    
    // If payment intent doesn't exist in Stripe, mark booking as expired/failed
    if (stripeError.code === 'resource_missing') {
      const newStatus = isAutomated ? 'expired' : 'failed';
      await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
        
      return {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        status: newStatus,
        reason: 'Payment intent not found in Stripe',
        payment_cancelled: paymentCancelled
      };
    }
    
    throw stripeError;
  }
}