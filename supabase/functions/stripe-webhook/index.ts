import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com;",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY", 
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
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

        // Update booking status and create real Amadeus booking
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          // Get booking details
          const { data: booking, error: fetchError } = await supabaseClient
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

          if (fetchError || !booking) {
            logStep("Failed to fetch booking", { error: fetchError?.message });
            throw new Error(`Failed to fetch booking: ${fetchError?.message}`);
          }

          // If this is a hotel booking, create real Amadeus reservation
          if (booking.booking_type === 'hotel' && booking.booking_data?.amadeus?.hotelOfferId) {
            try {
              logStep("Creating real Amadeus hotel booking", { bookingId });
              
              const { data: amadeusBooking, error: amadeusError } = await supabaseClient.functions.invoke('amadeus-hotel-booking', {
                body: {
                  hotelOfferId: booking.booking_data.amadeus.hotelOfferId,
                  guestDetails: booking.booking_data.customerInfo,
                  roomDetails: {
                    roomType: booking.booking_data.hotel?.roomType || 'Standard Room',
                    boardType: booking.booking_data.hotel?.boardType || 'ROOM_ONLY',
                    checkIn: booking.booking_data.hotel?.checkIn,
                    checkOut: booking.booking_data.hotel?.checkOut,
                    guests: booking.booking_data.hotel?.guests || 1
                  },
                  specialRequests: booking.booking_data.specialRequests
                }
              });

              if (amadeusError || !amadeusBooking?.success) {
                logStep("Amadeus booking failed", { error: amadeusError || amadeusBooking?.error });
                // Still confirm the booking but note the Amadeus failure
                await supabaseClient
                  .from("bookings")
                  .update({ 
                    status: "confirmed",
                    booking_data: {
                      ...booking.booking_data,
                      amadeus_booking_failed: true,
                      amadeus_error: amadeusError || amadeusBooking?.error
                    },
                    updated_at: new Date().toISOString()
                  })
                  .eq("id", bookingId);
              } else {
                // Update booking with real Amadeus booking data
                await supabaseClient
                  .from("bookings")
                  .update({ 
                    status: "confirmed",
                    booking_data: {
                      ...booking.booking_data,
                      amadeus_booking: amadeusBooking.booking,
                      pnr_code: amadeusBooking.booking?.pnr,
                      confirmation_number: amadeusBooking.booking?.reference,
                      amadeus_booking_id: amadeusBooking.booking?.id
                    },
                    updated_at: new Date().toISOString()
                  })
                  .eq("id", bookingId);

                logStep("Real Amadeus booking created", { 
                  bookingId, 
                  amadeusId: amadeusBooking.booking?.id,
                  pnr: amadeusBooking.booking?.pnr 
                });

                // Send confirmation email
                try {
                  await supabaseClient.functions.invoke('send-booking-confirmation', {
                    body: { bookingId }
                  });
                  logStep("Confirmation email sent", { bookingId });
                } catch (emailError) {
                  logStep("Failed to send confirmation email", { error: emailError });
                  // Don't fail the booking if email fails
                }
              }
            } catch (amadeusError) {
              logStep("Amadeus booking creation failed", { error: amadeusError });
              // Still confirm the booking but note the failure
              await supabaseClient
                .from("bookings")
                .update({ 
                  status: "confirmed",
                  booking_data: {
                    ...booking.booking_data,
                    amadeus_booking_failed: true,
                    amadeus_error: amadeusError.message
                  },
                  updated_at: new Date().toISOString()
                })
                .eq("id", bookingId);

              // Still send confirmation email for the booking
              try {
                await supabaseClient.functions.invoke('send-booking-confirmation', {
                  body: { bookingId }
                });
                logStep("Confirmation email sent despite Amadeus failure", { bookingId });
              } catch (emailError) {
                logStep("Failed to send confirmation email", { error: emailError });
              }
            }
          } else {
            // For non-hotel bookings, just confirm
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