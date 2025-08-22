import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentIntentParams {
  booking_type: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  // Legacy support for existing signature
  bookingId?: string;
  customerInfo?: { email?: string };
  paymentMethod?: string;
  correlationId?: string;
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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header (optional for guest bookings)
    let user = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data } = await supabaseClient.auth.getUser(token);
        user = data.user;
        logger.info('Authenticated user found:', user?.id);
      } catch (authError) {
        logger.info('No authenticated user, proceeding as guest booking');
      }
    }

    const requestData: CreatePaymentIntentParams = await req.json();
    
    // Support both new and legacy signatures
    const {
      booking_type,
      amount,
      currency,
      metadata = {},
      // Legacy support
      bookingId,
      customerInfo,
      paymentMethod = 'card',
      correlationId
    } = requestData;

    // Determine if this is the new signature or legacy
    const isNewSignature = booking_type && !bookingId;
    
    if (isNewSignature) {
      // New signature - create booking first
      if (!booking_type || !amount || !currency) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: booking_type, amount, currency' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      logger.info('Creating payment intent (new signature):', { booking_type, amount, currency, userType: user ? 'authenticated' : 'guest' });

      const totalAmount = amount;
      const amountCents = Math.round(totalAmount * 100);

      // Create booking record using service role client for RLS bypass
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const bookingData = {
        user_id: user?.id || null,
        booking_reference: `${booking_type.toUpperCase()}${Date.now()}`,
        status: 'pending',
        booking_type,
        total_amount: totalAmount,
        currency: currency.toUpperCase(),
        booking_data: {
          ...metadata,
          customerInfo: user ? {
            email: user.email,
            userId: user.id
          } : {
            email: null,
            userId: null
          }
        }
      };

      const { data: booking, error: bookingError } = await supabaseService
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        logger.error('Booking creation error:', bookingError);
        throw new Error(`Failed to create booking record: ${bookingError.message}`);
      }

      logger.info('✅ Booking record created:', booking.id);

      // Create Stripe Payment Intent
      const paymentIntentData = new URLSearchParams({
        amount: amountCents.toString(),
        currency: currency.toLowerCase(),
        'automatic_payment_methods[enabled]': 'true',
        'metadata[booking_id]': booking.id,
        'metadata[booking_type]': booking_type,
        'metadata[user_id]': user?.id || 'guest'
      });

      // Add any additional metadata
      Object.entries(metadata).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          paymentIntentData.append(`metadata[${key}]`, value.toString());
        }
      });

      if (user?.email) {
        paymentIntentData.append('receipt_email', user.email);
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

      // Store payment record using service role
      const { error: paymentError } = await supabaseService
        .from('payments')
        .insert({
          booking_id: booking.id,
          stripe_payment_intent_id: paymentIntent.id,
          amount: totalAmount,
          currency: currency.toUpperCase(),
          status: paymentIntent.status
        });

      if (paymentError) {
        logger.error('Payment record error:', paymentError);
        // Don't fail the entire process for payment record error
      }

      logger.info(`✅ Created ${booking_type} booking ${booking.id} with payment intent ${paymentIntent.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          clientSecret: paymentIntent.client_secret,
          booking_id: booking.id,
          amount_cents: amountCents,
          currency: currency.toUpperCase(),
          total_amount: totalAmount
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      // Legacy signature - existing implementation
      logger.info('Creating payment intent (legacy signature):', { bookingId, amount, correlationId });

      const amountCents = Math.round(amount * 100);

      // Generate idempotency key to prevent duplicate payments
      const idempotencyKey = correlationId || `booking_${bookingId}_${Date.now()}`;

      const paymentIntentData = new URLSearchParams({
        amount: amountCents.toString(),
        currency: currency.toLowerCase(),
        'automatic_payment_methods[enabled]': 'true',
        'metadata[booking_id]': bookingId,
        'metadata[payment_method]': paymentMethod,
        'metadata[correlation_id]': correlationId || 'none'
      });

      if (customerInfo?.email) {
        paymentIntentData.append('receipt_email', customerInfo.email);
      }

      const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': idempotencyKey,
        },
        body: paymentIntentData,
      });

      const paymentIntent = await stripeResponse.json();

      if (!stripeResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      // Store payment record
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseService
        .from('payments')
        .insert({
          booking_id: bookingId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: amount,
          currency: currency.toUpperCase(),
          status: paymentIntent.status
        });

      return new Response(
        JSON.stringify({
          success: true,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    logger.error('Create payment intent error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});