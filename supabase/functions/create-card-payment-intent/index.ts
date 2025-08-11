import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BookingPaymentParams = {
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
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BookingPaymentParams = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnon);

    // Attempt to identify user (optional)
    let userId: string | null = null;
    try {
      const authHeader = req.headers.get('Authorization') ?? '';
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        const { data } = await userClient.auth.getUser(token);
        userId = data.user?.id ?? null;
      }
    } catch (_) {}

    const { bookingType, bookingData, amount, currency = 'USD', customerInfo } = body;

    if (!bookingType || !bookingData || !amount || !customerInfo?.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing STRIPE_SECRET_KEY' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

    // Create booking first (pending)
    const serviceClient = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });

    const bookingReference = `MK${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString().slice(-4)}`;

    const { data: bookingRows, error: bookingErr } = await serviceClient
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: bookingType,
        booking_data: bookingData,
        total_amount: amount,
        currency,
        status: 'pending',
        booking_reference: bookingReference,
      })
      .select('id, booking_reference, status, total_amount, currency')
      .limit(1);

    if (bookingErr) throw bookingErr;
    const booking = bookingRows?.[0];

    if (!booking) {
      throw new Error('Failed to create booking');
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: String(currency).toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        user_id: userId ?? 'guest',
        booking_type: bookingType,
      },
      receipt_email: customerInfo.email,
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
          method: 'card',
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('create-card-payment-intent error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
