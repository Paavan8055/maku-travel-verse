import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  provider: string;
}

async function processStripeWebhook(event: Stripe.Event, supabase: any): Promise<void> {
  console.log('Processing Stripe webhook:', event.type);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.booking_id;

      if (bookingId) {
        // Update booking status to confirmed
        await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString() 
          })
          .eq('id', bookingId);

        // Update payment status
        await supabase
          .from('payments')
          .update({ 
            status: 'succeeded',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        console.log(`✅ Booking ${bookingId} confirmed via Stripe webhook`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata.booking_id;

      if (bookingId) {
        // Update booking status to failed
        await supabase
          .from('bookings')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString() 
          })
          .eq('id', bookingId);

        // Update payment status
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        console.log(`❌ Booking ${bookingId} failed via Stripe webhook`);
      }
      break;
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = dispute.charge;

      // Log dispute for admin review
      console.log(`🚨 Dispute created for charge ${chargeId}`);
      
      // You could send notifications to admins here
      break;
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
}

async function processAmadeusWebhook(event: any, supabase: any): Promise<void> {
  console.log('Processing Amadeus webhook:', event.type);

  switch (event.type) {
    case 'booking.confirmed': {
      const bookingData = event.data;
      const ourBookingId = bookingData.reference; // Assuming we store our booking ID as reference

      // Update our booking with Amadeus confirmation
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          booking_data: supabase.raw(`booking_data || '${JSON.stringify({
            amadeusConfirmation: bookingData,
            confirmedAt: new Date().toISOString()
          })}'::jsonb`),
          updated_at: new Date().toISOString()
        })
        .eq('booking_reference', ourBookingId);

      console.log(`✅ Amadeus booking confirmed: ${ourBookingId}`);
      break;
    }

    case 'booking.cancelled': {
      const bookingData = event.data;
      const ourBookingId = bookingData.reference;

      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          booking_data: supabase.raw(`booking_data || '${JSON.stringify({
            amadeusCancel: bookingData,
            cancelledAt: new Date().toISOString()
          })}'::jsonb`),
          updated_at: new Date().toISOString()
        })
        .eq('booking_reference', ourBookingId);

      console.log(`❌ Amadeus booking cancelled: ${ourBookingId}`);
      break;
    }

    default:
      console.log(`Unhandled Amadeus event type: ${event.type}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const amadeusSignature = req.headers.get('amadeus-signature');
    
    let provider: string;
    let webhookEvent: any;

    if (signature) {
      // Stripe webhook
      provider = 'stripe';
      const body = await req.text();
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      try {
        webhookEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Stripe webhook signature verification failed:', err);
        return new Response('Webhook signature verification failed', { status: 400 });
      }

    } else if (amadeusSignature) {
      // Amadeus webhook (hypothetical - Amadeus doesn't have webhooks in reality)
      provider = 'amadeus';
      webhookEvent = await req.json();
      
      // In a real implementation, you'd verify the Amadeus signature here
      console.log('Amadeus webhook received (simulated)');

    } else {
      return new Response('No valid webhook signature found', { status: 400 });
    }

    // Check for idempotency
    const idempotencyResult = await supabaseService.rpc('process_webhook_event', {
      p_event_id: webhookEvent.id,
      p_event_type: webhookEvent.type,
      p_provider: provider,
      p_payload: webhookEvent
    });

    if (idempotencyResult.data?.already_processed) {
      console.log(`Webhook ${webhookEvent.id} already processed`);
      return new Response('OK', { status: 200 });
    }

    // Process the webhook
    try {
      if (provider === 'stripe') {
        await processStripeWebhook(webhookEvent, supabaseService);
      } else if (provider === 'amadeus') {
        await processAmadeusWebhook(webhookEvent, supabaseService);
      }

      // Mark webhook as processed
      await supabaseService
        .from('webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('event_id', webhookEvent.id)
        .eq('provider', provider);

      console.log(`✅ Webhook ${webhookEvent.id} processed successfully`);

    } catch (processingError) {
      console.error('Webhook processing error:', processingError);
      
      // Update webhook event with error
      await supabaseService
        .from('webhook_events')
        .update({
          error_message: processingError.message,
          retry_count: supabaseService.raw('retry_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('event_id', webhookEvent.id)
        .eq('provider', provider);

      // Return 500 to trigger webhook retry from provider
      return new Response('Webhook processing failed', { status: 500 });
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Webhook processing failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});