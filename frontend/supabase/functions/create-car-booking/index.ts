import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";


interface CarBookingParams {
  carOffer: {
    id: string;
    vehicleInfo: {
      category: string;
      type: string;
      make: string;
      model: string;
      transmission: string;
      fuel: string;
      airConditioning: boolean;
      doors: number;
      seats: number;
    };
    rateInfo: {
      totalPrice: number;
      currency: string;
      dailyRate: number;
    };
    pickupLocation: {
      code: string;
      name: string;
      address: string;
    };
    dropoffLocation: {
      code: string;
      name: string;
      address: string;
    };
    pickupDateTime: string;
    dropoffDateTime: string;
  };
  driverDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    licenseNumber: string;
    licenseCountry: string;
    licenseExpiry: string;
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
    const params: CarBookingParams = await req.json();
    
    logger.info('Creating car booking:', {
      carOfferId: params.carOffer.id,
      pickupDate: params.carOffer.pickupDateTime,
      dropoffDate: params.carOffer.dropoffDateTime,
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
    const bookingReference = 'CR' + Math.random().toString(36).substring(2, 10).toUpperCase();

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

    // Step 1: Validate car availability with Sabre
    logger.info('Validating car availability with Sabre');
    const availabilityResponse = await supabaseService.functions.invoke('sabre-car-search', {
      body: {
        pickupLocation: params.carOffer.pickupLocation.code,
        dropoffLocation: params.carOffer.dropoffLocation.code,
        pickupDateTime: params.carOffer.pickupDateTime,
        dropoffDateTime: params.carOffer.dropoffDateTime,
        carId: params.carOffer.id
      }
    });

    if (availabilityResponse.error) {
      throw new Error(`Car availability check failed: ${availabilityResponse.error.message}`);
    }

    logger.info('Car availability confirmed');

    // Step 2: Store booking in Supabase
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'car',
        booking_reference: bookingReference,
        status: 'pending',
        total_amount: params.amount,
        currency: params.currency,
        booking_data: {
          customerInfo: params.customerInfo,
          carOffer: params.carOffer,
          driverDetails: params.driverDetails,
          pickupDateTime: params.carOffer.pickupDateTime,
          dropoffDateTime: params.carOffer.dropoffDateTime,
          pickupLocation: params.carOffer.pickupLocation,
          dropoffLocation: params.carOffer.dropoffLocation,
          vehicleInfo: params.carOffer.vehicleInfo,
          bookingConfirmation: null // Will be updated after provider booking
        }
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to store booking: ${bookingError.message}`);
    }

    logger.info('Car booking stored in database:', { bookingId: booking.id });

    // Step 3: Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      metadata: {
        booking_id: booking.id,
        booking_type: 'car',
        booking_reference: bookingReference,
        user_id: userId || 'guest',
        car_offer_id: params.carOffer.id,
        pickup_location: params.carOffer.pickupLocation.name,
        dropoff_location: params.carOffer.dropoffLocation.name
      },
      description: `Car rental booking ${bookingReference} - ${params.carOffer.vehicleInfo.make} ${params.carOffer.vehicleInfo.model}`,
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

    logger.info('Car booking process completed successfully');

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        reference: bookingReference,
        status: 'pending',
        amount: params.amount,
        currency: params.currency,
        vehicleInfo: params.carOffer.vehicleInfo,
        pickupDateTime: params.carOffer.pickupDateTime,
        dropoffDateTime: params.carOffer.dropoffDateTime,
        pickupLocation: params.carOffer.pickupLocation,
        dropoffLocation: params.carOffer.dropoffLocation
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
    logger.error('Car booking error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Car booking failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});