import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PARTNER-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Parse request body
    const { business_type, onboarding_choice, user_id } = await req.json();
    logStep("Request parsed", { business_type, onboarding_choice, user_id });

    // Validate input
    if (!business_type || !onboarding_choice || !user_id) {
      throw new Error("Missing required fields: business_type, onboarding_choice, user_id");
    }

    // Use service role key for secure database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user data
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (userError || !userData?.user?.email) {
      throw new Error(`User not found: ${userError?.message}`);
    }
    logStep("User found", { email: userData.user.email });

    // Set pricing based on business type
    const pricingMap = {
      hotel: 33300, // A$333 in cents
      activity: 33300, // A$333 in cents  
      airline: 999900 // A$9999 in cents
    };

    const amount = pricingMap[business_type as keyof typeof pricingMap];
    if (!amount) {
      throw new Error(`Invalid business type: ${business_type}`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: userData.user.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    if (onboarding_choice === "trial") {
      // Create customer if one doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData.user.email,
          metadata: {
            user_id: user_id,
            business_type: business_type
          }
        });
        customerId = customer.id;
        logStep("New customer created", { customerId });
      }

      // Create setup intent for trial (secure payment method, charge later)
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        usage: "off_session", // For future payments
        metadata: {
          user_id: user_id,
          business_type: business_type,
          amount: amount.toString(),
          type: "trial_setup"
        }
      });

      logStep("Setup intent created for trial", { setupIntentId: setupIntent.id });

      // Record the trial setup in database
      await supabaseClient.from("partner_onboarding_payments").insert({
        partner_id: null, // Will be updated when partner profile is created
        stripe_setup_intent_id: setupIntent.id,
        amount: amount,
        currency: "AUD",
        payment_type: "trial_setup",
        status: "pending"
      });

      return new Response(JSON.stringify({ 
        client_secret: setupIntent.client_secret,
        type: "setup_intent"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (onboarding_choice === "immediate_payment") {
      // Create customer if one doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData.user.email,
          metadata: {
            user_id: user_id,
            business_type: business_type
          }
        });
        customerId = customer.id;
        logStep("New customer created", { customerId });
      }

      // Create payment intent for immediate payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "aud",
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          user_id: user_id,
          business_type: business_type,
          type: "immediate_onboarding"
        }
      });

      logStep("Payment intent created for immediate payment", { paymentIntentId: paymentIntent.id });

      // Record the immediate payment in database
      await supabaseClient.from("partner_onboarding_payments").insert({
        partner_id: null, // Will be updated when partner profile is created
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        currency: "AUD", 
        payment_type: "immediate",
        status: "pending"
      });

      return new Response(JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        type: "payment_intent"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error(`Invalid onboarding choice: ${onboarding_choice}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});