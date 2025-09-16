import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@2.0.0";


interface BookingConfirmationRequest {
  bookingId: string;
  customerEmail: string;
  bookingType: 'flight' | 'hotel' | 'activity' | 'transfer';
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, customerEmail, bookingType }: BookingConfirmationRequest = await req.json();
    console.log(`[BOOKING-CONFIRMATION] Processing booking ID: ${bookingId}`);

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_items (*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('[BOOKING-CONFIRMATION] Booking not found:', bookingError);
      throw new Error('Booking not found');
    }

    // Use provided email or extract from booking data
    const emailToUse = customerEmail || 
                       booking.booking_data?.customerInfo?.email || 
                       booking.booking_data?.customer?.email ||
                       booking.booking_data?.email;

    if (!emailToUse) {
      console.error('[BOOKING-CONFIRMATION] No customer email found');
      throw new Error('Customer email not found');
    }

    // Generate confirmation email content based on booking type
    const emailContent = generateEmailContent(booking);
    const subject = `Booking Confirmation - ${booking.booking_reference}`;

    console.log(`[BOOKING-CONFIRMATION] Sending email to: ${emailToUse}`);

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: "MAKU Travel <bookings@maku.travel>",
      to: [emailToUse],
      subject: subject,
      html: emailContent.html,
    });

    console.log('[BOOKING-CONFIRMATION] Email sent successfully:', emailResponse);

    // Generate voucher/e-ticket if applicable
    let voucherData = null;
    if (booking.booking_type === 'hotel' || booking.booking_type === 'activity') {
      voucherData = await generateVoucher(booking);
    } else if (booking.booking_type === 'flight') {
      voucherData = await generateETicket(booking);
    }

    // Store confirmation in database
    await supabase
      .from('booking_updates')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        booking_reference: booking.booking_reference,
        update_type: 'confirmation_sent',
        title: 'Booking Confirmed',
        message: `Confirmation email sent to ${emailToUse}`,
        status: 'completed',
        booking_type: booking.booking_type,
        metadata: {
          email_id: emailResponse.data?.id,
          voucher_generated: !!voucherData
        }
      });

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse.data?.id,
      voucherGenerated: !!voucherData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[BOOKING-CONFIRMATION] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

function generateEmailContent(booking: any): { html: string } {
  const bookingData = booking.booking_data || {};
  const customerInfo = bookingData.customerInfo || bookingData.customer || {};
  const itemData = bookingData.hotel || bookingData.flight || bookingData.activity || {};

  const baseHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .total { font-size: 18px; font-weight: bold; color: #2c5aa0; }
        .footer { background: #f1f3f4; padding: 15px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Booking Confirmed!</h1>
        <p>Your ${booking.booking_type} booking is confirmed</p>
      </div>
      <div class="content">
        <h2>Hello ${customerInfo.firstName || 'Valued Customer'}!</h2>
        <p>Thank you for booking with MAKU Travel. Your booking has been confirmed and processed successfully.</p>
        
        <div class="booking-details">
          <h3>Booking Details</h3>
          <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
          <p><strong>Booking Type:</strong> ${booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1)}</p>
          <p><strong>Status:</strong> ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</p>
          ${getBookingTypeSpecificDetails(booking)}
          <p class="total"><strong>Total Amount:</strong> ${formatCurrency(booking.total_amount, booking.currency)}</p>
        </div>

        <p><strong>Important:</strong> Please keep this confirmation email for your records. You may need to present it during check-in.</p>
        
        <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 8px;">
          <h4>What's Next?</h4>
          <ul>
            <li>Check your email for any additional vouchers or e-tickets</li>
            <li>Review the cancellation policy in your booking terms</li>
            <li>Contact us if you need to make any changes</li>
            <li>Access your booking anytime in the "My Trips" section</li>
          </ul>
        </div>
      </div>
      <div class="footer">
        <p>© 2025 MAKU Travel. All rights reserved.</p>
        <p>Questions? Contact us at support@maku.travel</p>
      </div>
    </body>
    </html>
  `;

  return { html: baseHtml };
}

function getBookingTypeSpecificDetails(booking: any): string {
  const data = booking.booking_data || {};
  
  switch (booking.booking_type) {
    case 'hotel':
      const hotel = data.hotel || {};
      return `
        <p><strong>Hotel:</strong> ${hotel.name || hotel.hotel || 'Hotel Name'}</p>
        <p><strong>Check-in:</strong> ${hotel.checkIn || hotel.check_in_date || 'N/A'}</p>
        <p><strong>Check-out:</strong> ${hotel.checkOut || hotel.check_out_date || 'N/A'}</p>
        <p><strong>Guests:</strong> ${hotel.guests || data.guestCount || 1}</p>
        <p><strong>Rooms:</strong> ${hotel.rooms || 1}</p>
      `;
    
    case 'flight':
      const flight = data.flight || {};
      return `
        <p><strong>Route:</strong> ${flight.origin || 'N/A'} → ${flight.destination || 'N/A'}</p>
        <p><strong>Departure:</strong> ${flight.departureDate || flight.departure_date || 'N/A'}</p>
        <p><strong>Passengers:</strong> ${flight.passengers || data.passengerCount || 1}</p>
        <p><strong>Class:</strong> ${flight.travelClass || flight.cabin || 'Economy'}</p>
      `;
    
    case 'activity':
      const activity = data.activity || {};
      return `
        <p><strong>Activity:</strong> ${activity.name || activity.title || 'Activity'}</p>
        <p><strong>Date:</strong> ${activity.date || activity.scheduled_date || 'N/A'}</p>
        <p><strong>Participants:</strong> ${activity.participants || data.participantCount || 1}</p>
        <p><strong>Location:</strong> ${activity.location || activity.destination || 'N/A'}</p>
      `;
    
    default:
      return `<p><strong>Service:</strong> ${booking.booking_type}</p>`;
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency || 'AUD'
  }).format(amount || 0);
}

async function generateVoucher(booking: any): Promise<any> {
  // Generate voucher for hotel/activity bookings
  const voucherData = {
    type: 'voucher',
    bookingReference: booking.booking_reference,
    bookingType: booking.booking_type,
    generatedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    qrCode: `MAKU-${booking.booking_reference}-${Date.now()}`
  };

  console.log('[BOOKING-CONFIRMATION] Voucher generated:', voucherData);
  return voucherData;
}

async function generateETicket(booking: any): Promise<any> {
  // Generate e-ticket for flight bookings
  const ticketData = {
    type: 'e_ticket',
    bookingReference: booking.booking_reference,
    ticketNumber: `TKT${booking.booking_reference}${Date.now()}`,
    generatedAt: new Date().toISOString(),
    validForCheckIn: true
  };

  console.log('[BOOKING-CONFIRMATION] E-ticket generated:', ticketData);
  return ticketData;
}

serve(handler);