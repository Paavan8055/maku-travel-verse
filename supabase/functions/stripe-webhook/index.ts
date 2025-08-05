import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header found");

    // Get the request body
    const body = await req.text();
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment succeeded", { paymentIntentId: paymentIntent.id });

        // Update payment status
        const { error: paymentError } = await supabaseClient
          .from("payments")
          .update({ 
            status: "succeeded",
            payment_method_id: paymentIntent.payment_method as string,
            updated_at: new Date().toISOString()
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (paymentError) {
          logStep("Failed to update payment", { error: paymentError.message });
          throw new Error(`Failed to update payment: ${paymentError.message}`);
        }

        // Update booking status to confirmed
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          const { error: bookingError } = await supabaseClient
            .from("bookings")
            .update({ 
              status: "confirmed",
              updated_at: new Date().toISOString()
            })
            .eq("id", bookingId);

          if (bookingError) {
            logStep("Failed to update booking", { error: bookingError.message });
            throw new Error(`Failed to update booking: ${bookingError.message}`);
          }
          
          logStep("Booking confirmed", { bookingId });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", { paymentIntentId: paymentIntent.id });

        // Update payment status
        const { error: paymentError } = await supabaseClient
          .from("payments")
          .update({ 
            status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (paymentError) {
          logStep("Failed to update payment", { error: paymentError.message });
        }
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment processing", { paymentIntentId: paymentIntent.id });

        // Update payment status
        const { error: paymentError } = await supabaseClient
          .from("payments")
          .update({ 
            status: "processing",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (paymentError) {
          logStep("Failed to update payment", { error: paymentError.message });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});