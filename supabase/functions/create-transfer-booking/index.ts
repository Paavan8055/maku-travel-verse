import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";


interface TransferBookingParams {
  transferOffer: {
    id: string;
    type: 'PRIVATE' | 'SHARED' | 'SHUTTLE';
    vehicle: {
      category: string;
      description: string;
      maxPassengers: number;
      maxLuggage: number;
    };
    price: {
      totalAmount: number;
      currency: string;
    };
    pickup: {
      location: string;
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      time: string;
      instructions?: string;
    };
    dropoff: {
      location: string;
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      instructions?: string;
    };
    duration: string;
    distance: string;
  };
  passengerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passengers: number;
    luggage: number;
    specialRequirements?: string;
    flightNumber?: string;
  };
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
    const params: TransferBookingParams = await req.json();
    
    logger.info('Creating transfer booking:', {
      transferOfferId: params.transferOffer.id,
      transferType: params.transferOffer.type,
      pickupTime: params.transferOffer.pickup.time,
      passengers: params.passengerDetails.passengers,
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
    const bookingReference = 'TR' + Math.random().toString(36).substring(2, 10).toUpperCase();

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

    // Step 1: Validate transfer availability with HotelBeds
    logger.info('Validating transfer availability with HotelBeds');
    const availabilityResponse = await supabaseService.functions.invoke('hotelbeds-transfers', {
      body: {
        pickup: params.transferOffer.pickup,
        dropoff: params.transferOffer.dropoff,
        pickupDateTime: params.transferOffer.pickup.time,
        passengers: params.passengerDetails.passengers,
        transferId: params.transferOffer.id
      }
    });

    if (availabilityResponse.error) {
      throw new Error(`Transfer availability check failed: ${availabilityResponse.error.message}`);
    }

    logger.info('Transfer availability confirmed');

    // Step 2: Store booking in Supabase
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'transfer',
        booking_reference: bookingReference,
        status: 'pending',
        total_amount: params.amount,
        currency: params.currency,
        booking_data: {
          customerInfo: params.customerInfo,
          transferOffer: params.transferOffer,
          passengerDetails: params.passengerDetails,
          pickupTime: params.transferOffer.pickup.time,
          pickupLocation: params.transferOffer.pickup,
          dropoffLocation: params.transferOffer.dropoff,
          vehicleInfo: params.transferOffer.vehicle,
          bookingConfirmation: null // Will be updated after provider booking
        }
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to store booking: ${bookingError.message}`);
    }

    logger.info('Transfer booking stored in database:', { bookingId: booking.id });

    // Step 3: Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      metadata: {
        booking_id: booking.id,
        booking_type: 'transfer',
        booking_reference: bookingReference,
        user_id: userId || 'guest',
        transfer_offer_id: params.transferOffer.id,
        pickup_location: params.transferOffer.pickup.location,
        dropoff_location: params.transferOffer.dropoff.location
      },
      description: `Transfer booking ${bookingReference} - ${params.transferOffer.pickup.location} to ${params.transferOffer.dropoff.location}`,
    });

    // Step 4: Store payment record
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

    logger.info('Transfer booking process completed successfully');

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        reference: bookingReference,
        status: 'pending',
        amount: params.amount,
        currency: params.currency,
        transferType: params.transferOffer.type,
        pickupTime: params.transferOffer.pickup.time,
        pickupLocation: params.transferOffer.pickup,
        dropoffLocation: params.transferOffer.dropoff,
        vehicleInfo: params.transferOffer.vehicle
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
    logger.error('Transfer booking error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Transfer booking failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});