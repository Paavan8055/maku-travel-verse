import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      console.error("No Stripe signature found");
      return new Response("No signature", { status: 400 });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("No webhook secret configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle checkout.session.completed for fund top-ups
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if this is a fund top-up
      if (session.metadata?.fund_topup === "true") {
        const userId = session.metadata.user_id;
        const amount = parseFloat(session.metadata.amount || "0");
        
        if (userId && amount > 0) {
          // Update transaction status to completed
          const { error: updateError } = await supabase
            .from("fund_transactions")
            .update({ status: "completed" })
            .eq("stripe_session_id", session.id)
            .eq("user_id", userId);

          if (updateError) {
            console.error("Error updating fund transaction:", updateError);
          } else {
            console.log(`Fund top-up completed for user ${userId}: $${amount}`);
          }
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 500 });
  }
});