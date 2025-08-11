import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, sessionId, paymentIntentId } = await req.json();

    if (!bookingId || (!sessionId && !paymentIntentId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing bookingId or payment identifier" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, supabaseAnon);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await userClient.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Verify booking belongs to user (or exists)
    const serviceClient = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
    const { data: bookingRows, error: bookingErr } = await serviceClient
      .from("bookings")
      .select("id, user_id, status, currency")
      .eq("id", bookingId)
      .limit(1);

    if (bookingErr) throw bookingErr;
    const booking = bookingRows?.[0];

    if (!booking || booking.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Booking not found or not owned by user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    let paid = false;
    let amountTotal = 0; // cents
    let currency = booking.currency ?? "USD";
    let derivedPaymentIntentId: string | undefined = undefined;
    let paymentStatus = "processing";

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
      paid = session.payment_status === "paid" || (session.status === "complete" && session.mode === "payment");
      amountTotal = session.amount_total ?? 0;
      currency = session.currency?.toUpperCase() ?? currency;
      derivedPaymentIntentId = typeof session.payment_intent === "object" && session.payment_intent
        ? (session.payment_intent as any).id
        : undefined;
      paymentStatus = session.payment_status || "processing";
    } else if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      paid = pi.status === "succeeded";
      amountTotal = pi.amount_received || pi.amount || 0;
      currency = (pi.currency || currency).toUpperCase();
      derivedPaymentIntentId = pi.id;
      paymentStatus = pi.status;
    }

    // Insert payment record (idempotent-ish via unique combo could be added in DB)
    const { error: paymentErr } = await serviceClient.from("payments").insert({
      booking_id: bookingId,
      amount: amountTotal / 100,
      currency,
      status: paid ? "succeeded" : paymentStatus,
      stripe_payment_intent_id: derivedPaymentIntentId,
    });
    if (paymentErr) {
      console.error("Payment insert error:", paymentErr);
    }

    if (paid) {
      const { error: bookingUpdateErr } = await serviceClient
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);
      if (bookingUpdateErr) {
        console.error("Booking update error:", bookingUpdateErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: { id: bookingId, status: paid ? "confirmed" : booking.status },
        payment: { status: paid ? "succeeded" : paymentStatus },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("verify-booking-payment error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
