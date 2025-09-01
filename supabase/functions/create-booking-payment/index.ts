import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingPaymentPayload {
  bookingId?: string;
  bookingType: 'hotel' | 'flight' | 'activity' | 'package' | 'travel-fund';
  bookingData?: any;
  amount: number;
  currency: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  selectedAddOns?: Array<{
    id: string;
    name: string;
    price: number;
    quantity?: number;
  }>;
  addOnsTotal?: number;
  paymentMethod?: 'card' | 'fund' | 'split';
  // Travel fund specific fields
  fundId?: string;
  fundName?: string;
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
      selectedAddOns = [],
      addOnsTotal = 0,
      paymentMethod = 'card',
      fundId,
      fundName
    }: BookingPaymentPayload = await req.json();

    // For travel-fund payments, bookingData is optional
    if (!bookingType || !amount || !customerInfo?.email || 
        (bookingType !== 'travel-fund' && !bookingData)) {
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
        booking_data: bookingType === 'travel-fund' 
          ? {
              fundId,
              fundName,
              customerInfo,
              depositAmount: amount
            }
          : {
              ...bookingData,
              customerInfo,
              selectedAddOns,
              addOnsTotal
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

    // Generate idempotency key to prevent duplicate payments
    const idempotencyKey = `booking_${finalBookingId}_${Date.now()}_${user?.id || 'guest'}`;

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || 'https://iomeddeasarntjhqzndu.supabase.co';

    // Create Stripe Checkout Session
    const productName = bookingType === 'travel-fund' 
      ? `Travel Fund Deposit - ${fundName || 'Fund'}`
      : `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking`;
      
    const checkoutSessionData = new URLSearchParams({
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': productName,
      'line_items[0][price_data][unit_amount]': amountCents.toString(),
      'line_items[0][quantity]': '1',
      mode: 'payment',
      'success_url': `${origin}/booking-success?booking_id=${finalBookingId}&session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${origin}/booking-failure?booking_id=${finalBookingId}&error=payment_cancelled`,
      'metadata[booking_id]': finalBookingId,
      'metadata[booking_type]': bookingType,
      'metadata[user_id]': user?.id || 'guest',
      'metadata[payment_method]': paymentMethod
    });
    
    if (bookingType === 'travel-fund' && fundId) {
      checkoutSessionData.append('metadata[fund_id]', fundId);
    }

    if (customerInfo.email) {
      checkoutSessionData.append('customer_email', customerInfo.email);
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': idempotencyKey,
      },
      body: checkoutSessionData,
    });

    const checkoutSession = await stripeResponse.json();

    if (!stripeResponse.ok) {
      logger.error('Stripe error:', checkoutSession);
      throw new Error('Failed to create checkout session');
    }

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: finalBookingId,
        stripe_session_id: checkoutSession.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'requires_payment'
      });

    if (paymentError) {
      logger.error('Payment record error:', paymentError);
    }

    logger.info(`✅ Created ${bookingType} booking payment ${finalBookingId} with session ${checkoutSession.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: finalBookingId,
        url: checkoutSession.url, // Changed from checkoutUrl for consistency
        sessionId: checkoutSession.id,
        payment: {
          method: paymentMethod,
          status: 'pending'
        },
        booking: {
          id: finalBookingId,
          reference: `${bookingType.toUpperCase()}${Date.now()}`,
          status: 'pending',
          amount: amount,
          currency: currency.toUpperCase(),
          ...(bookingType === 'travel-fund' && { fundId, fundName })
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