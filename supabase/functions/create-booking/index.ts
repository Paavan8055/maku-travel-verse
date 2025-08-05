import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOOKING] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { bookingData, items, totalAmount, currency = "USD" } = await req.json();
    logStep("Request parsed", { totalAmount, currency, itemCount: items?.length });

    // Validate required fields
    if (!bookingData || !items || !totalAmount || !Array.isArray(items) || items.length === 0) {
      throw new Error("Missing required fields: bookingData, items, totalAmount");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create booking in database
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        currency: currency,
        booking_data: bookingData,
        check_in_date: bookingData.checkInDate,
        check_out_date: bookingData.checkOutDate,
        guest_count: bookingData.guestCount || 1
      })
      .select()
      .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);
    logStep("Booking created", { bookingId: booking.id });

    // Create booking items
    const bookingItems = items.map((item: any) => ({
      booking_id: booking.id,
      item_type: item.type,
      item_details: item.details,
      quantity: item.quantity || 1,
      unit_price: item.unitPrice,
      total_price: item.totalPrice || (item.unitPrice * (item.quantity || 1))
    }));

    const { error: itemsError } = await supabaseClient
      .from("booking_items")
      .insert(bookingItems);

    if (itemsError) throw new Error(`Failed to create booking items: ${itemsError.message}`);
    logStep("Booking items created", { itemCount: bookingItems.length });

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        user_id: user.id
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    logStep("Stripe Payment Intent created", { paymentIntentId: paymentIntent.id });

    // Record payment in database
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        booking_id: booking.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        currency: currency,
        status: "requires_payment"
      });

    if (paymentError) throw new Error(`Failed to record payment: ${paymentError.message}`);
    logStep("Payment recorded");

    // Return response
    const response = {
      success: true,
      booking: {
        id: booking.id,
        reference: booking.booking_reference,
        status: booking.status
      },
      payment: {
        client_secret: paymentIntent.client_secret,
        amount: totalAmount,
        currency: currency
      }
    };

    logStep("Response prepared", response);
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});