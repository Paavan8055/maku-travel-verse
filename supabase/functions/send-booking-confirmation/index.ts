import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Generate hotel booking confirmation email content
function generateHotelConfirmationEmail(booking: any): { subject: string; html: string } {
  const bookingData = booking.booking_data;
  const amadeusBooking = bookingData.amadeus_booking;
  const hotel = bookingData.hotel;
  const customerInfo = bookingData.customerInfo;
  
  const subject = `Hotel Booking Confirmation - ${booking.booking_reference}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hotel Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1976d2; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; color: #1976d2; }
        .success { background: #4caf50; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Hotel Booking Confirmed!</h1>
          <p>Thank you for booking with MAKU Travel</p>
        </div>
        
        <div class="content">
          <div class="success">
            <h2>✅ Your reservation is confirmed</h2>
            <p><strong>Booking Reference: ${booking.booking_reference}</strong></p>
            ${amadeusBooking?.confirmationNumber ? `<p><strong>Hotel Confirmation Number: ${amadeusBooking.confirmationNumber}</strong></p>` : ''}
            ${amadeusBooking?.confirmation_number ? `<p><strong>Hotel Reference: ${amadeusBooking.confirmation_number}</strong></p>` : ''}
          </div>

          <div class="booking-details">
            <h3>Hotel Details</h3>
            <div class="detail-row">
              <span>Hotel Name:</span>
              <span><strong>${hotel?.name || amadeusBooking?.hotel_details?.name || 'Hotel'}</strong></span>
            </div>
            ${amadeusBooking?.hotel_details?.address ? `
            <div class="detail-row">
              <span>Address:</span>
              <span>${amadeusBooking.hotel_details.address}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span>Room Type:</span>
              <span>${hotel?.roomType || 'Standard Room'}</span>
            </div>
            <div class="detail-row">
              <span>Check-in:</span>
              <span><strong>${new Date(hotel?.checkIn || '').toLocaleDateString()}</strong></span>
            </div>
            <div class="detail-row">
              <span>Check-out:</span>
              <span><strong>${new Date(hotel?.checkOut || '').toLocaleDateString()}</strong></span>
            </div>
            <div class="detail-row">
              <span>Guests:</span>
              <span>${hotel?.guests || 1} guest${(hotel?.guests || 1) > 1 ? 's' : ''}</span>
            </div>
            ${bookingData.specialRequests ? `
            <div class="detail-row">
              <span>Special Requests:</span>
              <span>${bookingData.specialRequests}</span>
            </div>
            ` : ''}
          </div>

          <div class="booking-details">
            <h3>Guest Information</h3>
            <div class="detail-row">
              <span>Guest Name:</span>
              <span><strong>${customerInfo.firstName} ${customerInfo.lastName}</strong></span>
            </div>
            <div class="detail-row">
              <span>Email:</span>
              <span>${customerInfo.email}</span>
            </div>
            ${customerInfo.phone ? `
            <div class="detail-row">
              <span>Phone:</span>
              <span>${customerInfo.phone}</span>
            </div>
            ` : ''}
          </div>

          <div class="booking-details">
            <h3>Payment Summary</h3>
            <div class="detail-row">
              <span>Total Amount:</span>
              <span class="total">${booking.currency} ${booking.total_amount}</span>
            </div>
            <div class="detail-row">
              <span>Status:</span>
              <span><strong style="color: #4caf50;">Confirmed & Paid</strong></span>
            </div>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
            <h3>Important Information</h3>
            <ul>
              <li><strong>Check-in Time:</strong> Usually 3:00 PM (contact hotel to confirm)</li>
              <li><strong>Check-out Time:</strong> Usually 11:00 AM (contact hotel to confirm)</li>
              <li><strong>Cancellation:</strong> Please review your booking terms for cancellation policies</li>
              <li><strong>Contact Hotel:</strong> For special requests or room preferences, contact the hotel directly</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background: white; border-radius: 8px;">
            <p><strong>Need Help?</strong></p>
            <p>Contact our support team: <a href="mailto:support@makutravel.com">support@makutravel.com</a></p>
            <p>Booking Reference: <strong>${booking.booking_reference}</strong></p>
            ${amadeusBooking?.confirmationNumber ? `<p>Hotel Confirmation Number: <strong>${amadeusBooking.confirmationNumber}</strong></p>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    const customerInfo = booking.booking_data?.customerInfo;
    if (!customerInfo?.email) {
      throw new Error('Customer email not found in booking');
    }

    console.log('Sending confirmation email for booking:', booking.booking_reference);

    let emailContent;
    if (booking.booking_type === 'hotel') {
      emailContent = generateHotelConfirmationEmail(booking);
    } else {
      // Generic booking confirmation for other types
      emailContent = {
        subject: `Booking Confirmation - ${booking.booking_reference}`,
        html: `
          <h1>Booking Confirmed!</h1>
          <p>Your ${booking.booking_type} booking has been confirmed.</p>
          <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
          <p><strong>Total Amount:</strong> ${booking.currency} ${booking.total_amount}</p>
          <p>Thank you for booking with MAKU Travel!</p>
        `
      };
    }

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: "MAKU Travel <bookings@makutravel.com>",
      to: [customerInfo.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.id,
      message: "Confirmation email sent successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});