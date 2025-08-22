import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import logger from "../_shared/logger.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      hotelId, 
      offerId, 
      checkIn, 
      checkOut, 
      adults = 2, 
      children = 0, 
      rooms = 1,
      addons = [],
      bedPref = '',
      note = ''
    } = await req.json();

    logger.info('Creating hotel booking with params:', { 
      hotelId, offerId, checkIn, checkOut, adults, children, rooms 
    });

    // Validate required parameters
    if (!hotelId || !offerId || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required booking parameters' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      logger.error('Stripe secret key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment system not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate nights and estimated price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Base price calculation (this would normally come from HotelBeds API)
    const basePrice = 150; // AUD per night
    const totalAmount = basePrice * nights * rooms;
    const currency = 'AUD';

    // Create booking record
    const bookingReference = 'BK' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const bookingData = {
      booking_reference: bookingReference,
      booking_type: 'hotel',
      status: 'pending',
      total_amount: totalAmount,
      currency: currency,
      booking_data: {
        hotel: {
          hotelId,
          offerId,
          checkIn,
          checkOut,
          adults,
          children,
          rooms,
          nights,
          addons,
          bedPref,
          note
        },
        customerInfo: {
          // Will be filled when guest completes form
        }
      }
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      logger.error('Error creating booking:', bookingError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create booking record' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        booking_id: booking.id,
        booking_type: 'hotel',
        hotel_id: hotelId,
        offer_id: offerId
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info('Payment intent created:', paymentIntent.id);

    // Update booking with payment intent ID
    await supabase
      .from('bookings')
      .update({ 
        booking_data: {
          ...bookingData.booking_data,
          stripe_payment_intent_id: paymentIntent.id
        }
      })
      .eq('id', booking.id);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: booking.id,
        booking_reference: bookingReference,
        clientSecret: paymentIntent.client_secret,
        total_amount: totalAmount,
        currency: currency,
        amount_cents: Math.round(totalAmount * 100)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error in create-hotel-booking:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});