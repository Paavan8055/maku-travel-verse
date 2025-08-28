import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

class WebhookProcessor {
  private supabase: any;
  private stripe: Stripe;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    this.stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  async ensureIdempotency(eventId: string, eventType: string): Promise<boolean> {
    try {
      // Check if we've already processed this event
      const { data: existingEvent, error } = await this.supabase
        .from('webhook_events')
        .select('id, processed')
        .eq('stripe_event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (existingEvent) {
        if (existingEvent.processed) {
          console.log(`Event ${eventId} already processed, skipping`);
          return false; // Already processed
        }
        // Event exists but not processed, continue processing
        return true;
      }

      // Create new event record
      const { error: insertError } = await this.supabase
        .from('webhook_events')
        .insert({
          stripe_event_id: eventId,
          event_type: eventType,
          processed: false,
          processing_attempts: 1,
          last_attempt_at: new Date().toISOString(),
        });

      if (insertError) {
        // If insert fails due to unique constraint, another instance is processing
        if (insertError.code === '23505') { // Unique constraint violation
          console.log(`Event ${eventId} being processed by another instance`);
          return false;
        }
        throw insertError;
      }

      return true; // Safe to process
    } catch (error) {
      console.error('Idempotency check failed:', error);
      throw error;
    }
  }

  async markEventProcessed(eventId: string, success: boolean, errorMessage?: string): Promise<void> {
    try {
      await this.supabase
        .from('webhook_events')
        .update({
          processed: success,
          error_message: errorMessage,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('stripe_event_id', eventId);
    } catch (error) {
      console.error('Failed to mark event as processed:', error);
    }
  }

  async incrementProcessingAttempts(eventId: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_processing_attempts', { event_id: eventId });
    } catch (error) {
      console.error('Failed to increment processing attempts:', error);
    }
  }

  async processPaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    const bookingId = paymentIntent.metadata?.booking_id;
    if (!bookingId) {
      throw new Error('No booking_id in payment intent metadata');
    }

    console.log(`Processing successful payment for booking: ${bookingId}`);

    // Get the booking transaction
    const { data: transaction, error: txError } = await this.supabase
      .from('booking_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (txError || !transaction) {
      throw new Error(`Booking transaction not found: ${bookingId}`);
    }

    if (transaction.status !== 'payment_processing') {
      console.warn(`Unexpected transaction status: ${transaction.status} for booking: ${bookingId}`);
      return; // Already processed or invalid state
    }

    // Update transaction to payment confirmed
    const { error: updateError } = await this.supabase
      .from('booking_transactions')
      .update({
        status: 'payment_confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', bookingId);

    if (updateError) {
      throw new Error(`Failed to update transaction status: ${updateError.message}`);
    }

    // Update booking status
    const { error: bookingError } = await this.supabase
      .from('bookings')
      .update({
        status: 'payment_confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      throw new Error(`Failed to update booking status: ${bookingError.message}`);
    }

    // Trigger booking confirmation with supplier
    try {
      await this.supabase.functions.invoke('booking-integrity-manager', {
        body: {
          action: 'confirm_booking',
          booking_id: bookingId,
          provider_confirmation: {
            payment_confirmed: true,
            stripe_payment_intent_id: paymentIntent.id,
            amount_received: paymentIntent.amount_received,
          }
        }
      });
    } catch (supplierError) {
      console.error('Failed to confirm booking with supplier:', supplierError);
      
      // Create critical alert for manual intervention
      await this.supabase
        .from('critical_alerts')
        .insert({
          booking_id: bookingId,
          alert_type: 'supplier_confirmation_failed',
          message: `Payment successful but supplier confirmation failed: ${supplierError.message}`,
          severity: 'critical',
          requires_manual_action: true,
        });
    }

    console.log(`Payment processing completed for booking: ${bookingId}`);
  }

  async processPaymentIntentFailed(paymentIntent: any): Promise<void> {
    const bookingId = paymentIntent.metadata?.booking_id;
    if (!bookingId) {
      console.warn('Payment intent failed without booking_id metadata:', paymentIntent.id);
      return;
    }

    console.log(`Processing failed payment for booking: ${bookingId}`);

    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    // Update transaction to failed
    const { error: txError } = await this.supabase
      .from('booking_transactions')
      .update({
        status: 'failed',
        failure_reason: failureReason,
        rollback_required: false, // No rollback needed for failed payment
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', bookingId);

    if (txError) {
      console.error('Failed to update transaction:', txError);
    }

    // Update booking status
    const { error: bookingError } = await this.supabase
      .from('bookings')
      .update({
        status: 'payment_failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Failed to update booking:', bookingError);
    }

    console.log(`Payment failure processing completed for booking: ${bookingId}`);
  }

  async processChargeDispute(charge: any): Promise<void> {
    const paymentIntentId = charge.payment_intent;
    if (!paymentIntentId) return;

    // Find the booking associated with this charge
    const { data: transaction, error } = await this.supabase
      .from('booking_transactions')
      .select('booking_id, status')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error || !transaction) {
      console.warn('No booking found for disputed charge:', charge.id);
      return;
    }

    // Create critical alert for dispute handling
    await this.supabase
      .from('critical_alerts')
      .insert({
        booking_id: transaction.booking_id,
        alert_type: 'payment_dispute',
        message: `Payment dispute initiated for charge ${charge.id}. Manual review required.`,
        severity: 'high',
        requires_manual_action: true,
      });

    console.log(`Dispute alert created for booking: ${transaction.booking_id}`);
  }

  async processEvent(event: StripeWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.processPaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.processPaymentIntentFailed(event.data.object);
        break;

      case 'charge.dispute.created':
        await this.processChargeDispute(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        // Handle subscription payments if needed
        console.log('Invoice payment succeeded:', event.data.object.id);
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellations if needed
        console.log('Subscription cancelled:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return new Response('Webhook signature required', { status: 400 });
    }

    // Verify the webhook signature
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    let event: StripeWebhookEvent;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as StripeWebhookEvent;
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type} (${event.id})`);

    const processor = new WebhookProcessor();

    // Ensure idempotency
    const shouldProcess = await processor.ensureIdempotency(event.id, event.type);
    if (!shouldProcess) {
      return new Response('Event already processed or being processed', { status: 200 });
    }

    try {
      // Process the event
      await processor.processEvent(event);
      
      // Mark as successfully processed
      await processor.markEventProcessed(event.id, true);
      
      console.log(`Successfully processed event: ${event.id}`);
      return new Response('Webhook processed successfully', { status: 200 });

    } catch (processingError) {
      console.error(`Error processing event ${event.id}:`, processingError);
      
      // Mark as failed and increment attempts
      await processor.markEventProcessed(event.id, false, processingError.message);
      await processor.incrementProcessingAttempts(event.id);
      
      // Return success to Stripe to avoid retries for application errors
      // Stripe will retry only for 5xx errors
      return new Response('Webhook received but processing failed', { status: 200 });
    }

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    // Return 500 to trigger Stripe retry
    return new Response('Internal server error', { status: 500 });
  }
});