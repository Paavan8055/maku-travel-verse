import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingPaymentPayload {
  bookingId?: string;
  bookingType: 'hotel' | 'flight' | 'activity' | 'package';
  bookingData: any;
  amount: number;
  currency: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header if available
    const authHeader = req.headers.get('Authorization');
    let user = null;
    if (authHeader) {
      const anonClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      const token = authHeader.replace('Bearer ', '');
      const { data } = await anonClient.auth.getUser(token);
      user = data.user;
    }

    const {
      bookingId,
      bookingType,
      bookingData,
      amount,
      currency,
      customerInfo,
      paymentMethod = 'card'
    }: BookingPaymentPayload = await req.json();

    if (!bookingType || !bookingData || !amount || !customerInfo?.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Creating booking payment:', { bookingType, amount, currency, paymentMethod });

    let finalBookingId = bookingId;

    // If bookingId is missing, create new booking record
    if (!finalBookingId) {
      const bookingRecord = {
        user_id: user?.id || null,
        booking_reference: `${bookingType.toUpperCase()}${Date.now()}`,
        status: 'pending',
        booking_type: bookingType,
        total_amount: amount,
        currency: currency.toUpperCase(),
        booking_data: {
          ...bookingData,
          customerInfo
        }
      };

      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .insert(bookingRecord)
        .select()
        .single();

      if (bookingError) {
        logger.error('Booking creation error:', bookingError);
        throw new Error('Failed to create booking record');
      }

      finalBookingId = booking.id;
      logger.info(`Created new booking ${finalBookingId}`);
    }

    const amountCents = Math.round(amount * 100);

    // Create Stripe Payment Intent
    const paymentIntentData = new URLSearchParams({
      amount: amountCents.toString(),
      currency: currency.toLowerCase(),
      'automatic_payment_methods[enabled]': 'true',
      'metadata[booking_id]': finalBookingId,
      'metadata[booking_type]': bookingType,
      'metadata[user_id]': user?.id || 'guest',
      'metadata[payment_method]': paymentMethod
    });

    if (customerInfo.email) {
      paymentIntentData.append('receipt_email', customerInfo.email);
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paymentIntentData,
    });

    const paymentIntent = await stripeResponse.json();

    if (!stripeResponse.ok) {
      logger.error('Stripe error:', paymentIntent);
      throw new Error('Failed to create payment intent');
    }

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: finalBookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: paymentIntent.status
      });

    if (paymentError) {
      logger.error('Payment record error:', paymentError);
    }

    logger.info(`✅ Created ${bookingType} booking payment ${finalBookingId} with intent ${paymentIntent.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: finalBookingId,
        clientSecret: paymentIntent.client_secret,
        payment: {
          method: paymentMethod,
          status: paymentIntent.status
        },
        booking: {
          id: finalBookingId,
          reference: `${bookingType.toUpperCase()}${Date.now()}`,
          status: 'pending',
          amount: amount,
          currency: currency.toUpperCase()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Create booking payment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking payment'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});