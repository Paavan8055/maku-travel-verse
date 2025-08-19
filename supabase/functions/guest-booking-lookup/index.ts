import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { bookingReference, email, accessToken } = await req.json();

    if (!bookingReference || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing bookingReference or email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Use service role to bypass RLS for guest bookings
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false }
    });

    // First try to find booking by reference
    let { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select("*")
      .or(`booking_reference.eq.${bookingReference},id.eq.${bookingReference}`)
      .single();

    if (bookingError || !booking) {
      console.log("Booking not found by reference:", bookingError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Booking not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Verify guest access using the database function
    const { data: hasAccess, error: accessError } = await supabaseClient
      .rpc('verify_guest_booking_access', {
        _booking_id: booking.id,
        _email: email,
        _token: accessToken || null
      });

    if (accessError || !hasAccess) {
      console.log("Access verification failed:", accessError?.message);
      
      // Log the access attempt
      await supabaseClient.rpc('log_booking_access', {
        _booking_id: booking.id,
        _access_type: 'guest_lookup',
        _access_method: accessToken ? 'token' : 'email',
        _success: false,
        _failure_reason: 'Email verification failed'
      });

      return new Response(
        JSON.stringify({ success: false, error: "Access denied. Email does not match booking." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Log successful access
    await supabaseClient.rpc('log_booking_access', {
      _booking_id: booking.id,
      _access_type: 'guest_lookup',
      _access_method: accessToken ? 'token' : 'email',
      _success: true
    });

    // Get booking items for complete details
    const { data: bookingItems } = await supabaseClient
      .from("booking_items")
      .select("*")
      .eq("booking_id", booking.id);

    // Get payment information
    const { data: payments } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          booking_reference: booking.booking_reference,
          status: booking.status,
          booking_type: booking.booking_type,
          total_amount: booking.total_amount,
          currency: booking.currency,
          booking_data: booking.booking_data,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          items: bookingItems || [],
          latest_payment: payments?.[0] || null
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Guest booking lookup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});