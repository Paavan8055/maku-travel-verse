import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateHotelBookingParams {
  hotelId: string;
  offerId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  addons?: string[];
  currency?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      throw new Error('Invalid authentication token');
    }

    const user = userData.user;
    const body: CreateHotelBookingParams = await req.json();
    const { hotelId, offerId, checkIn, checkOut, guests, addons = [], currency = 'AUD' } = body;

    // Validate required parameters
    if (!hotelId || !offerId || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating hotel booking for user:', user.id);
    console.log('Booking details:', { hotelId, offerId, checkIn, checkOut, guests, addons });

    // Calculate room price (in a real implementation, re-fetch from Amadeus to prevent tampering)
    // For demo purposes, using a fixed price calculation
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    const baseRoomPrice = 200; // Base price per night in AUD
    const roomTotalCents = Math.round(baseRoomPrice * nights * 100);

    // Fetch addon prices from database
    let addonsTotalCents = 0;
    if (addons.length > 0) {
      const { data: addonData, error: addonError } = await supabase
        .from('hotel_addons')
        .select('*')
        .in('id', addons)
        .eq('active', true);

      if (addonError) {
        console.error('Error fetching addons:', addonError);
      } else {
        addonsTotalCents = addonData?.reduce((total, addon) => {
          const multiplier = addon.per_person ? guests : 1;
          return total + (addon.price_cents * multiplier);
        }, 0) || 0;
      }
    }

    const totalAmountCents = roomTotalCents + addonsTotalCents;
    console.log('Calculated pricing:', { roomTotalCents, addonsTotalCents, totalAmountCents });

    // Generate booking reference
    const bookingReference = 'BK' + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        booking_reference: bookingReference,
        booking_type: 'hotel',
        status: 'pending',
        supplier: 'amadeus',
        total_amount: totalAmountCents / 100,
        currency,
        booking_data: {
          hotelId,
          offerId,
          checkIn,
          checkOut,
          guests,
          nights,
          basePrice: roomTotalCents / 100,
          addonsPrice: addonsTotalCents / 100,
          customerInfo: {
            email: user.email,
            userId: user.id
          }
        }
      })
      .select('*')
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw new Error('Failed to create booking record');
    }

    console.log('Created booking:', booking.id);

    // Create Stripe Payment Intent
    const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: totalAmountCents.toString(),
        currency: currency.toLowerCase(),
        automatic_payment_methods: JSON.stringify({ enabled: true }),
        metadata: JSON.stringify({
          booking_id: booking.id,
          booking_reference: bookingReference,
          user_id: user.id,
          booking_type: 'hotel'
        })
      }),
    });

    if (!paymentIntentResponse.ok) {
      const errorData = await paymentIntentResponse.text();
      console.error('Stripe Payment Intent creation failed:', errorData);
      throw new Error('Failed to create payment intent');
    }

    const paymentIntent = await paymentIntentResponse.json();
    console.log('Created Stripe Payment Intent:', paymentIntent.id);

    // Store payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: totalAmountCents / 100,
        currency,
        status: paymentIntent.status
      });

    if (paymentError) {
      console.error('Error storing payment record:', paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        bookingId: booking.id,
        bookingReference,
        amount_cents: totalAmountCents,
        currency
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Create hotel booking error:', error);
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