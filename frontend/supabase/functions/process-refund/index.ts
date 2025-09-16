import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";


interface RefundRequest {
  booking_id: string;
  refund_amount?: number; // If not provided, full refund
  reason?: string;
  refund_type: 'full' | 'partial' | 'cancellation_fee';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, refund_amount, reason, refund_type }: RefundRequest = await req.json();
    
    logger.info('Processing refund request:', {
      booking_id,
      refund_amount,
      reason,
      refund_type
    });

    // Initialize clients
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get booking and payment details
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select('*, payments(*)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Find the most recent successful payment
    const successfulPayment = booking.payments?.find((p: any) => p.status === 'succeeded');
    if (!successfulPayment) {
      throw new Error('No successful payment found for this booking');
    }

    // Calculate refund amount
    let refundAmountCents: number;
    if (refund_amount) {
      refundAmountCents = Math.round(refund_amount * 100);
    } else {
      // Full refund
      refundAmountCents = Math.round(successfulPayment.amount * 100);
    }

    // Process refund with Stripe
    logger.info('Creating refund with Stripe:', {
      payment_intent_id: successfulPayment.stripe_payment_intent_id,
      amount: refundAmountCents
    });

    const refund = await stripe.refunds.create({
      payment_intent: successfulPayment.stripe_payment_intent_id,
      amount: refundAmountCents,
      reason: reason || 'requested_by_customer',
      metadata: {
        booking_id,
        booking_type: booking.booking_type,
        refund_type,
        original_amount: successfulPayment.amount
      }
    });

    logger.info('Stripe refund created:', { refund_id: refund.id });

    // Update payment record
    const { error: paymentUpdateError } = await supabaseService
      .from('payments')
      .update({
        status: refund_type === 'full' ? 'refunded' : 'partially_refunded',
        refund_amount: refund_amount || successfulPayment.amount,
        refund_reason: reason,
        stripe_refund_id: refund.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', successfulPayment.id);

    if (paymentUpdateError) {
      logger.error('Failed to update payment record:', paymentUpdateError);
    }

    // Update booking status
    let newBookingStatus = booking.status;
    if (refund_type === 'full') {
      newBookingStatus = 'cancelled';
    } else if (refund_type === 'partial') {
      newBookingStatus = 'confirmed'; // Booking still valid, just partial refund
    }

    const { error: bookingUpdateError } = await supabaseService
      .from('bookings')
      .update({
        status: newBookingStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (bookingUpdateError) {
      logger.error('Failed to update booking status:', bookingUpdateError);
    }

    // Create refund notification record
    const { error: notificationError } = await supabaseService
      .from('booking_notifications')
      .insert({
        booking_id,
        type: 'refund_processed',
        title: `Refund Processed - ${booking.booking_reference}`,
        message: `Your ${refund_type} refund of $${(refundAmountCents / 100).toFixed(2)} has been processed and will appear in your account within 5-10 business days.`,
        customer_email: booking.booking_data?.customerInfo?.email,
        status: 'pending'
      });

    if (notificationError) {
      logger.error('Failed to create refund notification:', notificationError);
    }

    logger.info('Refund processed successfully');

    return new Response(JSON.stringify({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmountCents / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason
      },
      booking: {
        id: booking_id,
        reference: booking.booking_reference,
        status: newBookingStatus
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('Refund processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to process refund'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});