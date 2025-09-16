import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";


interface FlightBookingParams {
  flightOffers: any[];
  passengers: {
    id: string;
    dateOfBirth: string;
    name: {
      firstName: string;
      lastName: string;
    };
    gender: string;
    contact: {
      emailAddress: string;
      phones: {
        deviceType: string;
        countryCallingCode: string;
        number: string;
      }[];
    };
    documents: {
      documentType: string;
      number: string;
      expiryDate: string;
      issuanceCountry: string;
      nationality: string;
      holder: boolean;
    }[];
  }[];
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  amount: number;
  currency: string;
  paymentMethod?: 'card' | 'fund' | 'split';
  fundAmount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: FlightBookingParams = await req.json();
    
    logger.info('Creating flight booking:', {
      passengersCount: params.passengers?.length,
      flightOffersCount: params.flightOffers?.length,
      amount: params.amount,
      currency: params.currency
    });

    // Initialize clients
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Generate booking reference
    const bookingReference = 'FL' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Get authenticated user (optional for guest bookings)
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabaseService.auth.getUser(token);
        userId = userData.user?.id || null;
      } catch (error) {
        logger.info('No authenticated user found, proceeding as guest booking');
      }
    }

    // Step 1: Price confirmation with Amadeus
    logger.info('Confirming flight prices with Amadeus');
    const priceConfirmResponse = await supabaseService.functions.invoke('amadeus-flight-price-confirm', {
      body: {
        flightOfferId: params.flightOffers[0]?.id,
        pricingOptions: {
          includedCheckedBagsOnly: false
        }
      }
    });

    if (priceConfirmResponse.error) {
      throw new Error(`Price confirmation failed: ${priceConfirmResponse.error.message}`);
    }

    const confirmedOffer = priceConfirmResponse.data.flightOffer;
    logger.info('Price confirmed successfully');

    // Step 2: Create Amadeus flight booking
    logger.info('Creating flight booking with Amadeus');
    const amadeuBookingResponse = await supabaseService.functions.invoke('amadeus-flight-booking', {
      body: {
        flightOffers: [confirmedOffer],
        passengers: params.passengers,
        contacts: [{
          addresseeName: {
            firstName: params.customerInfo.firstName,
            lastName: params.customerInfo.lastName
          },
          purpose: 'STANDARD',
          phones: [{
            deviceType: 'MOBILE',
            countryCallingCode: '61',
            number: params.customerInfo.phone || '0400000000'
          }],
          emailAddress: params.customerInfo.email,
          address: {
            lines: ['123 Main St'],
            postalCode: '2000',
            cityName: 'Sydney',
            countryCode: 'AU'
          }
        }]
      }
    });

    if (amadeuBookingResponse.error) {
      throw new Error(`Amadeus booking failed: ${amadeuBookingResponse.error.message}`);
    }

    const amadeusBooking = amadeuBookingResponse.data.booking;
    logger.info('Amadeus booking created:', { bookingId: amadeusBooking.id });

    // Step 3: Store booking in Supabase
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'flight',
        booking_reference: bookingReference,
        status: 'pending',
        total_amount: params.amount,
        currency: params.currency,
        booking_data: {
          customerInfo: params.customerInfo,
          passengers: params.passengers,
          flightOffers: [confirmedOffer],
          amadeusBookingId: amadeusBooking.id,
          pnr: amadeusBooking.reference,
          contacts: params.passengers.map(p => p.contact)
        }
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to store booking: ${bookingError.message}`);
    }

    logger.info('Booking stored in database:', { bookingId: booking.id });

    // Step 4: Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      metadata: {
        booking_id: booking.id,
        booking_type: 'flight',
        booking_reference: bookingReference,
        user_id: userId || 'guest',
        amadeus_booking_id: amadeusBooking.id
      },
      description: `Flight booking ${bookingReference}`,
    });

    // Step 5: Store payment record
    const { error: paymentError } = await supabaseService
      .from('payments')
      .insert({
        booking_id: booking.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        payment_method: params.paymentMethod || 'card'
      });

    if (paymentError) {
      logger.error('Failed to store payment record:', paymentError);
    }

    logger.info('Flight booking process completed successfully');

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        reference: bookingReference,
        status: 'pending',
        amadeusBookingId: amadeusBooking.id,
        pnr: amadeusBooking.reference,
        amount: params.amount,
        currency: params.currency
      },
      payment: {
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('Flight booking error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Flight booking failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});