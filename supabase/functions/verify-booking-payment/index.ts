import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

async function sendConfirmationEmail(booking: any, bookingId: string, supabaseClient: any) {
  try {
    // Get booking items for detailed confirmation
    const { data: bookingItems } = await supabaseClient
      .from("booking_items")
      .select("*")
      .eq("booking_id", bookingId);

    const customerEmail = booking.booking_data?.customerInfo?.email;
    if (!customerEmail) {
      console.warn("No customer email found for booking:", bookingId);
      return;
    }

    const bookingType = booking.booking_type;
    const subject = `Booking Confirmed - ${booking.booking_reference}`;
    
    let emailContent = generateEmailContent(booking, bookingItems || []);

    const { error } = await resend.emails.send({
      from: "Maku Travel <bookings@maku.travel>",
      to: [customerEmail],
      subject: subject,
      html: emailContent,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Confirmation email sent successfully to:", customerEmail);
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
}

function generateEmailContent(booking: any, bookingItems: any[]): string {
  const customerInfo = booking.booking_data?.customerInfo || {};
  const bookingType = booking.booking_type;
  
  let itemsHtml = '';
  
  if (bookingType === 'flight') {
    const flightSegments = bookingItems.filter(item => item.item_type === 'flight_segment');
    const passengers = bookingItems.filter(item => item.item_type === 'passenger');
    
    itemsHtml = `
      <h3>Flight Details</h3>
      ${flightSegments.map(segment => `
        <div style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <strong>${segment.item_details.type.toUpperCase()} FLIGHT</strong><br>
          <strong>Route:</strong> ${segment.item_details.route}<br>
          <strong>Date:</strong> ${new Date(segment.item_details.date).toLocaleDateString()}<br>
          <strong>Flight:</strong> ${segment.item_details.flight} (${segment.item_details.airline})<br>
          <strong>Class:</strong> ${segment.item_details.class}<br>
          <strong>Duration:</strong> ${segment.item_details.duration}<br>
          <strong>Passengers:</strong> ${segment.quantity}
        </div>
      `).join('')}
      
      <h3>Passenger Information</h3>
      ${passengers.map((passenger, index) => `
        <div style="margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
          <strong>Passenger ${index + 1}:</strong> ${passenger.item_details.name}<br>
          ${passenger.item_details.seat ? `<strong>Seat:</strong> ${passenger.item_details.seat}<br>` : ''}
          ${passenger.item_details.meal ? `<strong>Meal:</strong> ${passenger.item_details.meal}<br>` : ''}
          ${passenger.item_details.baggage ? `<strong>Baggage:</strong> ${passenger.item_details.baggage}` : ''}
        </div>
      `).join('')}
    `;
  } else if (bookingType === 'hotel') {
    const hotelNights = bookingItems.filter(item => item.item_type === 'hotel_night');
    const extras = bookingItems.filter(item => item.item_type === 'hotel_extra');
    
    itemsHtml = `
      <h3>Hotel Booking Details</h3>
      <div style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <strong>Hotel:</strong> ${hotelNights[0]?.item_details.hotel_name}<br>
        <strong>Room Type:</strong> ${hotelNights[0]?.item_details.room_type}<br>
        <strong>Check-in:</strong> ${new Date(hotelNights[0]?.item_details.date).toLocaleDateString()}<br>
        <strong>Check-out:</strong> ${new Date(hotelNights[hotelNights.length - 1]?.item_details.date).toLocaleDateString()}<br>
        <strong>Nights:</strong> ${hotelNights.length}<br>
        <strong>Guests:</strong> ${hotelNights[0]?.item_details.guests}
      </div>
      
      ${extras.length > 0 ? `
        <h3>Extras & Add-ons</h3>
        ${extras.map(extra => `
          <div style="margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
            <strong>${extra.item_details.name}</strong><br>
            ${extra.item_details.description}<br>
            <strong>Quantity:</strong> ${extra.quantity} × $${extra.unit_price} = $${extra.total_price}
          </div>
        `).join('')}
      ` : ''}
    `;
  } else if (bookingType === 'activity') {
    const participants = bookingItems.filter(item => item.item_type === 'activity_participant');
    const addOns = bookingItems.filter(item => item.item_type === 'activity_addon');
    
    itemsHtml = `
      <h3>Activity Details</h3>
      <div style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
        <strong>Activity:</strong> ${participants[0]?.item_details.activity_name}<br>
        <strong>Date:</strong> ${new Date(participants[0]?.item_details.date).toLocaleDateString()}<br>
        <strong>Time:</strong> ${participants[0]?.item_details.time}<br>
        <strong>Duration:</strong> ${participants[0]?.item_details.duration}<br>
        <strong>Location:</strong> ${participants[0]?.item_details.location}
      </div>
      
      <h3>Participants</h3>
      ${participants.map((participant, index) => `
        <div style="margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
          <strong>Participant ${index + 1}:</strong> ${participant.item_details.participant_name}<br>
          <strong>Type:</strong> ${participant.item_details.participant_type}<br>
          ${participant.item_details.special_requirements ? `<strong>Special Requirements:</strong> ${participant.item_details.special_requirements}` : ''}
        </div>
      `).join('')}
      
      ${addOns.length > 0 ? `
        <h3>Add-ons</h3>
        ${addOns.map(addOn => `
          <div style="margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 5px;">
            <strong>${addOn.item_details.name}</strong><br>
            ${addOn.item_details.description}<br>
            <strong>Quantity:</strong> ${addOn.quantity} × $${addOn.unit_price} = $${addOn.total_price}
          </div>
        `).join('')}
      ` : ''}
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb;">🌟 Booking Confirmed!</h1>
        <p style="font-size: 18px; color: #666;">Thank you for choosing Maku Travel</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #2563eb;">Booking Information</h2>
        <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
        <p><strong>Customer:</strong> ${customerInfo.firstName} ${customerInfo.lastName}</p>
        <p><strong>Email:</strong> ${customerInfo.email}</p>
        <p><strong>Total Amount:</strong> ${booking.currency} ${booking.total_amount}</p>
        <p><strong>Booking Date:</strong> ${new Date(booking.created_at).toLocaleDateString()}</p>
      </div>
      
      ${itemsHtml}
      
      <div style="margin-top: 30px; padding: 20px; background: #e8f4fd; border-radius: 10px;">
        <h3 style="color: #2563eb; margin-top: 0;">Important Information</h3>
        <ul>
          <li>Please save this email as your booking confirmation</li>
          <li>Arrive at least 30 minutes before your scheduled time</li>
          <li>Bring a valid ID matching the booking name</li>
          <li>For any changes or cancellations, contact our support team</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #666;">Questions? Contact us at <a href="mailto:support@maku.travel">support@maku.travel</a></p>
        <p style="color: #666;">Safe travels! 🌎</p>
      </div>
    </body>
    </html>
  `;
}

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
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Service client (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });

    // Optional authentication for guest bookings
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userErr } = await serviceClient.auth.getUser(token);
        if (!userErr && userData?.user?.id) {
          userId = userData.user.id;
        }
      } catch (err) {
        console.warn("Auth validation failed, proceeding as guest:", err);
      }
    }

    // Load booking with extra fields for the confirmation letter
    const { data: bookingRows, error: bookingErr } = await serviceClient
      .from("bookings")
      .select("id, user_id, status, currency, booking_reference, booking_data, total_amount, created_at")
      .eq("id", bookingId)
      .limit(1);

    if (bookingErr) throw bookingErr;
    const booking = bookingRows?.[0];

    if (!booking) {
      return new Response(
        JSON.stringify({ success: false, error: "Booking not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
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
      
      // Send confirmation email
      try {
        await sendConfirmationEmail(booking, bookingId, serviceClient);
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Don't fail the whole process if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: bookingId,
          booking_reference: booking.booking_reference,
          status: paid ? "confirmed" : booking.status,
          total_amount: (booking.total_amount ?? (amountTotal / 100)) || 0,
          currency,
          booking_data: booking.booking_data,
          created_at: booking.created_at,
        },
        payment: {
          status: paid ? "succeeded" : paymentStatus,
          amount: amountTotal / 100,
          currency,
          intent_id: derivedPaymentIntentId,
        },
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
