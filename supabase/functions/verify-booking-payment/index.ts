import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { Resend } from "npm:resend@2.0.0"
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendConfirmationEmail(booking: any, bookingId: string, supabaseClient: any) {
  try {
    // Get booking items
    const { data: bookingItems } = await supabaseClient
      .from('booking_items')
      .select('*')
      .eq('booking_id', bookingId);

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const emailContent = generateEmailContent(booking, bookingItems || []);

    const emailResponse = await resend.emails.send({
      from: 'Maku Travel <bookings@resend.dev>',
      to: [booking.booking_data?.customerInfo?.email || 'guest@example.com'],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    logger.info('Confirmation email sent:', emailResponse.data?.id);
    return emailResponse;
  } catch (error) {
    logger.error('Failed to send confirmation email:', error);
    throw error;
  }
}

function generateEmailContent(booking: any, bookingItems: any[]) {
  const customerInfo = booking.booking_data?.customerInfo || {};
  const bookingType = booking.booking_type;
  
  let subject = `Booking Confirmed - ${booking.booking_reference}`;
  let content = '';

  if (bookingType === 'hotel') {
    const hotel = booking.booking_data?.hotel || 'Hotel Booking';
    const checkIn = booking.booking_data?.checkInDate || booking.booking_data?.check_in_date;
    const checkOut = booking.booking_data?.checkOutDate || booking.booking_data?.check_out_date;
    
    subject = `Hotel Booking Confirmed - ${hotel}`;
    content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1>🏨 Hotel Booking Confirmed!</h1>
          <p>Your reservation is confirmed and ready</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <p>Dear ${customerInfo.firstName || 'Guest'},</p>
          
          <p>Thank you for your hotel booking! Here are your details:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Reference: <span style="color: #667eea;">${booking.booking_reference}</span></h3>
            <p><strong>Hotel:</strong> ${hotel}</p>
            <p><strong>Check-in:</strong> ${checkIn}</p>
            <p><strong>Check-out:</strong> ${checkOut}</p>
            <p><strong>Total:</strong> ${booking.currency}${booking.total_amount}</p>
          </div>
          
          <p>We look forward to hosting you!</p>
        </div>
      </div>
    `;
  } else if (bookingType === 'flight') {
    subject = `Flight Booking Confirmed - ${booking.booking_reference}`;
    content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1>✈️ Flight Booking Confirmed!</h1>
          <p>Your tickets are ready</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <p>Dear ${customerInfo.firstName || 'Guest'},</p>
          
          <p>Your flight booking is confirmed!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Reference: <span style="color: #667eea;">${booking.booking_reference}</span></h3>
            <p><strong>Total:</strong> ${booking.currency}${booking.total_amount}</p>
          </div>
          
          <p>Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights.</p>
        </div>
      </div>
    `;
  } else if (bookingType === 'activity') {
    subject = `Activity Booking Confirmed - ${booking.booking_reference}`;
    content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1>🎯 Activity Booking Confirmed!</h1>
          <p>Get ready for your adventure</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <p>Dear ${customerInfo.firstName || 'Guest'},</p>
          
          <p>Your activity booking is confirmed!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Reference: <span style="color: #667eea;">${booking.booking_reference}</span></h3>
            <p><strong>Total:</strong> ${booking.currency}${booking.total_amount}</p>
          </div>
          
          <p>We'll send you more details about your activity closer to the date.</p>
        </div>
      </div>
    `;
  }

  const html = `
    ${content}
    <div style="text-align: center; padding: 20px; color: #666;">
      <p>Thank you for choosing Maku Travel!</p>
      <p>© 2025 Maku Travel. All rights reserved.</p>
    </div>
  `;

  return { subject, html };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body and extract snake_case parameters from frontend
    const requestBody = await req.json();
    logger.info('Raw request body received:', requestBody);
    
    const { booking_id, session_id, payment_intent_id } = requestBody;
    
    // Convert to camelCase for internal use
    const bookingId = booking_id;
    const sessionId = session_id;
    const paymentIntentId = payment_intent_id;
    
    // Debug log the extracted parameters
    logger.info('Extracted parameters:', {
      bookingId: bookingId,
      sessionId: sessionId,
      paymentIntentId: paymentIntentId,
      bookingIdType: typeof bookingId,
      sessionIdType: typeof sessionId,
      paymentIntentIdType: typeof paymentIntentId
    });
    
    if (!bookingId || (!sessionId && !paymentIntentId)) {
      logger.error('Parameter validation failed:', {
        bookingId: bookingId,
        sessionId: sessionId,
        paymentIntentId: paymentIntentId,
        hasBookingId: !!bookingId,
        hasSessionId: !!sessionId,
        hasPaymentIntentId: !!paymentIntentId
      });
      throw new Error('Missing required parameters');
    }

    // Initialize clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    logger.info('Verifying payment for booking:', booking.booking_reference);

    // Verify payment with Stripe
    let paymentVerified = false;
    let paymentDetails: any = {};

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paymentVerified = session.payment_status === 'paid';
      paymentDetails = {
        stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
        status: session.payment_status === 'paid' ? 'succeeded' : 'failed'
      };
    } else if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentVerified = paymentIntent.status === 'succeeded';
      paymentDetails = {
        stripe_payment_intent_id: paymentIntentId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };
    }

    if (!paymentVerified) {
      throw new Error('Payment verification failed');
    }

    logger.info('Payment verified successfully');

    // Insert payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: bookingId,
        ...paymentDetails,
        created_at: new Date().toISOString()
      });

    if (paymentError) {
      logger.error('Failed to insert payment record:', paymentError);
    }

    // Update booking status to confirmed
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error('Failed to update booking status:', updateError);
    }

    // Handle travel fund balance update
    if (booking.booking_type === 'travel-fund') {
      try {
        const { fundId, depositAmount } = booking.booking_data;
        
        if (fundId && depositAmount) {
          // Update travel fund balance - First get current balance, then update
          const { data: currentFund, error: getCurrentError } = await supabaseClient
            .from('funds')
            .select('balance')
            .eq('id', fundId)
            .single();

          if (getCurrentError) {
            logger.error('Failed to get current fund balance:', getCurrentError);
          } else {
            const newBalance = (currentFund.balance || 0) + depositAmount;
            
            const { error: fundUpdateError } = await supabaseClient
              .from('funds')
              .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', fundId);

            if (fundUpdateError) {
              logger.error('Failed to update travel fund balance:', fundUpdateError);
            } else {
              logger.info(`✅ Travel fund ${fundId} balance updated with ${depositAmount} (new balance: ${newBalance})`);
            }
          }

          // Create fund transaction record
          const { error: transactionError } = await supabaseClient
            .from('fund_transactions')
            .insert({
              user_id: booking.user_id,
              amount: depositAmount,
              type: 'deposit',
              status: 'completed',
              stripe_session_id: paymentDetails.stripe_session_id
            });

          if (transactionError) {
            logger.error('Failed to create fund transaction:', transactionError);
          } else {
            logger.info('✅ Fund transaction recorded');
          }
        }
      } catch (fundError) {
        logger.error('Travel fund update error:', fundError);
        // Don't fail the entire request if fund update fails
      }
    }

    // Create provider booking confirmation (enhance existing booking)
    let providerConfirmation = null;
    
    try {
      // Call verify-payment-and-complete-booking for provider integration
      const { data: providerResult, error: providerError } = await supabaseClient.functions.invoke(
        'verify-payment-and-complete-booking',
        {
          body: {
            payment_intent_id: paymentDetails.stripe_payment_intent_id,
            booking_id: bookingId
          }
        }
      );

      if (providerResult && providerResult.success) {
        providerConfirmation = {
          confirmation_number: providerResult.confirmation_number,
          supplier_reference: providerResult.supplier_reference,
          status: providerResult.status
        };
        logger.info(`Provider booking confirmed: ${providerResult.confirmation_number}`);
      } else if (providerError) {
        logger.warn('Provider booking failed:', providerError);
        // Continue with payment confirmation even if provider fails
      }
    } catch (providerError) {
      logger.warn('Provider integration error:', providerError);
      // Continue with payment confirmation even if provider fails
    }

    // Send confirmation email
    try {
      await sendConfirmationEmail(booking, bookingId, supabaseClient);
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
      // Don't fail the entire request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          booking_reference: booking.booking_reference,
          status: 'confirmed',
          total_amount: booking.total_amount,
          currency: booking.currency,
          booking_type: booking.booking_type,
          booking_data: booking.booking_data,
          created_at: booking.created_at,
          provider_confirmation: providerConfirmation
        },
        payment_verified: true,
        provider_confirmed: !!providerConfirmation
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Payment verification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});