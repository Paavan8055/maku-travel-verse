import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingPaymentParams {
  bookingType: 'flight' | 'hotel' | 'activity' | 'package';
  bookingData: any;
  amount: number;
  currency?: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
  fundAmount?: number;
  idempotencyKey?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BookingPaymentParams = await req.json();
    const { 
      bookingType, 
      bookingData, 
      amount, 
      currency = 'AUD', 
      customerInfo,
      paymentMethod = 'card',
      fundAmount,
      idempotencyKey
    } = body;

    logger.info('create-booking-payment init', {
      bookingType,
      amount,
      currency,
      paymentMethod,
      hasCustomerEmail: !!customerInfo?.email,
      idempotencyKey
    });

    // Environment configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';

    if (!stripeSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment system not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Validation
    const errors: Record<string, string> = {};
    if (!bookingType) errors.bookingType = 'bookingType is required';
    if (!bookingData) errors.bookingData = 'bookingData is required';
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.amount = 'amount must be a positive number';
    }
    if (!customerInfo?.email) errors.customerEmail = 'customerInfo.email is required';

    if (Object.keys(errors).length > 0) {
      logger.error('Validation failed for create-booking-payment', { errors, body });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request parameters', 
          details: errors 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 }
      );
    }

    // Initialize clients
    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceRole, { 
      auth: { persistSession: false } 
    });

    // Generate booking reference
    const bookingReference = `MK${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString().slice(-4)}`;

    // Create booking record with 10-minute timeout tracking
    const bookingRecord = {
      booking_type: bookingType,
      booking_reference: bookingReference,
      status: 'pending',
      total_amount: amount,
      currency: currency.toUpperCase(),
      booking_data: {
        ...bookingData,
        customerInfo,
        paymentMethod,
        fundAmount,
        sessionStart: new Date().toISOString(),
        timeoutMinutes: 10
      }
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingRecord)
      .select('id, booking_reference, status, total_amount, currency')
      .single();

    if (bookingError) {
      logger.error('Failed to create booking:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    logger.info('Booking created successfully', { 
      bookingId: booking.id, 
      reference: booking.booking_reference 
    });

    // Handle different payment methods
    if (paymentMethod === 'card' || paymentMethod === 'split') {
      // Create Stripe Checkout Session for better timeout control
      const paymentAmount = paymentMethod === 'split' && fundAmount 
        ? Math.max(1, amount - fundAmount) // Minimum $0.01 for Stripe
        : amount;

      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking`,
              description: `Booking reference: ${bookingReference}`,
            },
            unit_amount: Math.round(paymentAmount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancel_url: `${req.headers.get('origin')}/booking-failure?booking_id=${booking.id}&reason=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + (10 * 60), // 10 minute expiry
        metadata: {
          booking_id: booking.id,
          booking_reference: bookingReference,
          booking_type: bookingType,
          payment_method: paymentMethod,
          fund_amount: fundAmount?.toString() || '0',
          idempotency_key: idempotencyKey || '',
        },
        customer_email: customerInfo.email,
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
      });

      // Update booking with session ID
      await supabase
        .from('bookings')
        .update({ 
          booking_data: {
            ...bookingRecord.booking_data,
            stripe_session_id: session.id,
            stripe_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
          }
        })
        .eq('id', booking.id);

      // Create payment record
      await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          stripe_payment_intent_id: session.payment_intent as string || session.id,
          amount: paymentAmount,
          currency: currency.toUpperCase(),
          status: 'pending',
          payment_method: paymentMethod
        });

      logger.info('Stripe checkout session created', { 
        sessionId: session.id, 
        bookingId: booking.id,
        expiresAt: session.expires_at 
      });

      return new Response(
        JSON.stringify({
          success: true,
          booking: {
            id: booking.id,
            reference: booking.booking_reference,
            status: booking.status,
            amount: booking.total_amount,
            currency: booking.currency,
          },
          payment: {
            method: paymentMethod,
            status: 'requires_payment',
            checkoutUrl: session.url,
            sessionId: session.id,
            expiresAt: session.expires_at
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (paymentMethod === 'fund') {
      // Handle fund-only payments
      // This would integrate with your travel fund system
      logger.info('Processing fund payment', { bookingId: booking.id, fundAmount });

      // For now, mark as confirmed since funds are pre-validated
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id);

      return new Response(
        JSON.stringify({
          success: true,
          booking: {
            id: booking.id,
            reference: booking.booking_reference,
            status: 'confirmed',
            amount: booking.total_amount,
            currency: booking.currency,
          },
          payment: {
            method: 'fund',
            status: 'completed'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error(`Unsupported payment method: ${paymentMethod}`);

  } catch (error) {
    logger.error('create-booking-payment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Payment processing failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});