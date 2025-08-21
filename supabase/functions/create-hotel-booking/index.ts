import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateHotelBookingParams {
  hotelId: string;
  offerId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  addons?: string[];
  bedPref?: string;
  note?: string;
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    const {
      hotelId,
      offerId,
      checkIn,
      checkOut,
      adults,
      children = 0,
      rooms = 1,
      addons = [],
      bedPref,
      note
    }: CreateHotelBookingParams = await req.json();

    if (!hotelId || !offerId || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Creating hotel booking:', { hotelId, offerId, checkIn, checkOut, adults, children, rooms });

    // Re-fetch the offer from Amadeus to get accurate pricing
    const { data: hotelData, error: hotelError } = await supabaseClient.functions.invoke(
      'amadeus-hotel-details',
      {
        body: { hotelId, checkIn, checkOut, adults, children, rooms }
      }
    );

    if (hotelError || !hotelData?.success) {
      throw new Error('Failed to fetch current hotel pricing');
    }

    // Find the selected offer
    const selectedOffer = hotelData.offers?.find((offer: any) => offer.id === offerId);
    if (!selectedOffer) {
      throw new Error('Selected room offer no longer available');
    }

    const roomPrice = parseFloat(selectedOffer.price?.total || '0');
    const currency = selectedOffer.price?.currency || 'AUD';

    // Calculate addon costs
    let addonsPrice = 0;
    if (addons.length > 0) {
      const { data: addonData, error: addonError } = await supabaseClient
        .from('hotel_addons')
        .select('*')
        .in('id', addons)
        .eq('active', true);

      if (!addonError && addonData) {
        addonsPrice = addonData.reduce((total: number, addon: any) => {
          const basePrice = addon.price_cents / 100;
          const multiplier = addon.per_person ? (adults + children) : 1;
          return total + (basePrice * multiplier);
        }, 0);
      }
    }

    const totalAmount = roomPrice + addonsPrice;
    const amountCents = Math.round(totalAmount * 100);

    // Create booking record
    const bookingData = {
      user_id: user?.id || null,
      booking_reference: `BK${Date.now()}`,
      status: 'pending',
      booking_type: 'hotel',
      total_amount: totalAmount,
      currency,
      booking_data: {
        hotelId,
        offerId,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        bedPref,
        note,
        addons,
        selectedOffer,
        roomPrice,
        addonsPrice,
        customerInfo: user ? {
          email: user.email,
          userId: user.id
        } : null
      }
    };

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      logger.error('Booking creation error:', bookingError);
      throw new Error('Failed to create booking record');
    }

    // Create Stripe Payment Intent
    const paymentIntentData = new URLSearchParams({
      amount: amountCents.toString(),
      currency: currency.toLowerCase(),
      'automatic_payment_methods[enabled]': 'true',
      'metadata[booking_id]': booking.id,
      'metadata[hotel_id]': hotelId,
      'metadata[user_id]': user?.id || 'guest'
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

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        booking_id: booking.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        currency,
        status: paymentIntent.status
      });

    if (paymentError) {
      logger.error('Payment record error:', paymentError);
    }

    logger.info(`✅ Created hotel booking ${booking.id} with payment intent ${paymentIntent.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        booking_id: booking.id,
        amount_cents: amountCents,
        currency,
        total_amount: totalAmount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logger.error('Create hotel booking error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create hotel booking'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});