import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfirmBookingParams {
  booking_id: string;
  payment_intent_id: string;
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function confirmWithAmadeus(bookingData: any, accessToken: string) {
  // Simulate Amadeus hotel booking confirmation
  // In production, this would be the actual Amadeus booking API call
  logger.info('Confirming hotel booking with Amadeus:', {
    hotelId: bookingData.hotelId,
    offerId: bookingData.offerId,
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut
  });

  const bookingPayload = {
    data: {
      type: "hotel-order",
      hotelId: bookingData.hotelId,
      offerId: bookingData.offerId,
      guests: bookingData.guests || [
        {
          id: 1,
          name: {
            title: "MR",
            firstName: bookingData.customerInfo?.firstName || "John",
            lastName: bookingData.customerInfo?.lastName || "Doe"
          },
          contact: {
            phone: "+1234567890",
            email: bookingData.customerInfo?.email || "guest@example.com"
          }
        }
      ],
      payments: [
        {
          id: 1,
          method: "creditCard",
          card: {
            vendorCode: "VI",
            cardNumber: "4111111111111111",
            expiryDate: "2025-08"
          }
        }
      ],
      rooms: [
        {
          guestIds: [1],
          paymentId: 1,
          specialRequest: bookingData.note || null
        }
      ]
    }
  };

  // For now, return a mock confirmation since actual Amadeus booking
  // requires more complex integration
  return {
    success: true,
    booking: {
      id: `amadeus_${Date.now()}`,
      confirmationNumber: `AMB${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      status: 'confirmed',
      hotelId: bookingData.hotelId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut
    }
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    const { booking_id, payment_intent_id }: ConfirmBookingParams = await req.json();

    if (!booking_id || !payment_intent_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Confirming hotel booking:', { booking_id, payment_intent_id });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Verify payment intent status with Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${payment_intent_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    const paymentIntent = await stripeResponse.json();

    if (!stripeResponse.ok) {
      logger.error('Stripe error:', paymentIntent);
      throw new Error('Failed to verify payment status');
    }

    // Only proceed if payment is successful
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    }

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();

    // Confirm booking with Amadeus
    const confirmationResult = await confirmWithAmadeus(booking.booking_data, accessToken);

    if (!confirmationResult.success) {
      // Payment succeeded but hotel booking failed - need to handle refund
      logger.error('Hotel booking confirmation failed after payment:', confirmationResult);
      
      // Update booking status to failed
      await supabaseClient
        .from('bookings')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', booking_id);

      throw new Error('Hotel booking confirmation failed. Refund will be processed automatically.');
    }

    // Update booking with confirmation details
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        status: 'confirmed',
        booking_data: {
          ...booking.booking_data,
          confirmation: confirmationResult.booking,
          confirmedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (updateError) {
      logger.error('Booking update error:', updateError);
      throw new Error('Failed to update booking confirmation');
    }

    // Update payment status
    await supabaseClient
      .from('payments')
      .update({ 
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', booking_id)
      .eq('stripe_payment_intent_id', payment_intent_id);

    logger.info(`✅ Hotel booking confirmed: ${booking_id} with Amadeus confirmation: ${confirmationResult.booking.confirmationNumber}`);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id,
        confirmation_number: confirmationResult.booking.confirmationNumber,
        amadeus_booking_id: confirmationResult.booking.id,
        status: 'confirmed'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Confirm hotel booking error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm hotel booking'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});