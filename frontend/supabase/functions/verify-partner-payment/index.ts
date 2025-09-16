import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  logger.info(`[VERIFY-PARTNER-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { session_id, setup_intent_id, payment_intent_id } = await req.json();
    logStep("Request parsed", { session_id, setup_intent_id, payment_intent_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Use service role key for secure database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let paymentData;
    let stripeObject;

    if (setup_intent_id) {
      // Verify setup intent (trial)
      stripeObject = await stripe.setupIntents.retrieve(setup_intent_id);
      logStep("Setup intent retrieved", { status: stripeObject.status });

      if (stripeObject.status === 'succeeded') {
        // Update database record
        const { data, error } = await supabaseClient
          .from('partner_onboarding_payments')
          .update({ 
            status: 'trial_secured',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_setup_intent_id', setup_intent_id)
          .select()
          .single();

        if (error) throw error;

        // Create or update partner profile with trial info
        const userId = stripeObject.metadata?.user_id;
        if (userId) {
          await supabaseClient
            .from('partner_profiles')
            .update({
              trial_status: 'active',
              trial_start_date: new Date().toISOString(),
              trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              payment_status: 'trial_secured',
              stripe_setup_intent_id: setup_intent_id,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }

        paymentData = {
          ...data,
          type: 'trial_setup',
          business_type: stripeObject.metadata?.business_type,
          trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      }

    } else if (payment_intent_id) {
      // Verify payment intent (immediate payment)
      stripeObject = await stripe.paymentIntents.retrieve(payment_intent_id);
      logStep("Payment intent retrieved", { status: stripeObject.status });

      if (stripeObject.status === 'succeeded') {
        // Update database record
        const { data, error } = await supabaseClient
          .from('partner_onboarding_payments')
          .update({ 
            status: 'succeeded',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', payment_intent_id)
          .select()
          .single();

        if (error) throw error;

        // Create or update partner profile with payment info
        const userId = stripeObject.metadata?.user_id;
        if (userId) {
          await supabaseClient
            .from('partner_profiles')
            .update({
              onboarding_fee_paid: true,
              payment_status: 'paid',
              stripe_payment_intent_id: payment_intent_id,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }

        paymentData = {
          ...data,
          type: 'immediate',
          business_type: stripeObject.metadata?.business_type
        };
      }

    } else if (session_id) {
      // Handle checkout session (fallback)
      const session = await stripe.checkout.sessions.retrieve(session_id);
      logStep("Checkout session retrieved", { status: session.payment_status });

      if (session.payment_status === 'paid') {
        // Handle successful session payment
        paymentData = {
          session_id: session_id,
          amount: session.amount_total,
          currency: session.currency?.toUpperCase(),
          status: 'succeeded',
          type: 'session_payment'
        };
      }
    }

    if (!paymentData) {
      throw new Error("No valid payment found or payment not successful");
    }

    logStep("Payment verification successful", { paymentData });

    return new Response(JSON.stringify(paymentData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});