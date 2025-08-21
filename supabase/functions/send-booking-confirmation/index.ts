import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@2.0.0"
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

function generateHotelConfirmationEmail(booking: any) {
  const { booking_data } = booking;
  const customerInfo = booking_data.customerInfo || {};
  const hotel = booking_data.hotel || 'Hotel Booking';
  const checkIn = booking_data.checkInDate || booking_data.check_in_date;
  const checkOut = booking_data.checkOutDate || booking_data.check_out_date;
  
  const subject = `Booking Confirmed - ${hotel}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 1.2em; color: #667eea; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏨 Booking Confirmed!</h1>
          <p>Your reservation is confirmed and ready</p>
        </div>
        
        <div class="content">
          <p>Dear ${customerInfo.firstName || 'Guest'},</p>
          
          <p>Thank you for your booking! We're excited to welcome you. Here are your booking details:</p>
          
          <div class="booking-details">
            <h3>Booking Reference: <span style="color: #667eea;">${booking.booking_reference}</span></h3>
            
            <div class="detail-row">
              <span><strong>Hotel:</strong></span>
              <span>${hotel}</span>
            </div>
            
            <div class="detail-row">
              <span><strong>Check-in:</strong></span>
              <span>${checkIn}</span>
            </div>
            
            <div class="detail-row">
              <span><strong>Check-out:</strong></span>
              <span>${checkOut}</span>
            </div>
            
            <div class="detail-row">
              <span><strong>Guest Name:</strong></span>
              <span>${customerInfo.firstName} ${customerInfo.lastName}</span>
            </div>
            
            <div class="detail-row">
              <span><strong>Email:</strong></span>
              <span>${customerInfo.email}</span>
            </div>
            
            <div class="detail-row total">
              <span><strong>Total Amount:</strong></span>
              <span>${booking.currency || '$'}${booking.total_amount}</span>
            </div>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li>You'll receive a separate email with check-in instructions 24 hours before arrival</li>
            <li>Please bring a valid ID and the credit card used for booking</li>
            <li>Check-in time is typically 3:00 PM, check-out at 11:00 AM</li>
          </ul>
          
          <p>If you need to make any changes or have questions, please contact us with your booking reference.</p>
          
          <p>We look forward to hosting you!</p>
          
          <p>Best regards,<br>
          The Maku Travel Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
          <p>© 2025 Maku Travel. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    const customerEmail = booking.booking_data?.customerInfo?.email;
    if (!customerEmail) {
      throw new Error('Customer email not found in booking data');
    }

    // Generate email content based on booking type
    let emailContent;
    if (booking.booking_type === 'hotel') {
      emailContent = generateHotelConfirmationEmail(booking);
    } else {
      // Generic confirmation for other booking types
      emailContent = {
        subject: `Booking Confirmed - ${booking.booking_reference}`,
        html: `
          <h1>Booking Confirmed!</h1>
          <p>Your booking ${booking.booking_reference} has been confirmed.</p>
          <p>Total: ${booking.currency}${booking.total_amount}</p>
          <p>Thank you for booking with Maku Travel!</p>
        `
      };
    }

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: 'Maku Travel <bookings@resend.dev>',
      to: [customerEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    logger.info('Confirmation email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: 'Confirmation email sent successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error sending confirmation email:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});