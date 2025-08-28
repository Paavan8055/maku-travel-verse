import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityBookingParams {
  activityId: string;
  activityData: {
    name: string;
    description: string;
    duration: string;
    location: string;
    provider: string;
    images: string[];
  };
  selectedDate: string;
  selectedTime: string;
  participants: {
    adults: number;
    children: number;
    infants?: number;
  };
  participantDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age?: number;
    specialRequirements?: string;
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
    const params: ActivityBookingParams = await req.json();
    
    logger.info('Creating activity booking:', {
      activityId: params.activityId,
      selectedDate: params.selectedDate,
      participantsCount: params.participantDetails?.length,
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
    const bookingReference = 'AC' + Math.random().toString(36).substring(2, 10).toUpperCase();

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

    // Step 1: Validate activity availability with HotelBeds
    logger.info('Validating activity availability with HotelBeds');
    const availabilityResponse = await supabaseService.functions.invoke('hotelbeds-activities', {
      body: {
        destination: params.activityData.location,
        from: params.selectedDate,
        to: params.selectedDate,
        activityId: params.activityId
      }
    });

    if (availabilityResponse.error) {
      throw new Error(`Activity availability check failed: ${availabilityResponse.error.message}`);
    }

    logger.info('Activity availability confirmed');

    // Step 2: Store booking in Supabase
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .insert({
        user_id: userId,
        booking_type: 'activity',
        booking_reference: bookingReference,
        status: 'pending',
        total_amount: params.amount,
        currency: params.currency,
        booking_data: {
          customerInfo: params.customerInfo,
          activityId: params.activityId,
          activityData: params.activityData,
          selectedDate: params.selectedDate,
          selectedTime: params.selectedTime,
          participants: params.participants,
          participantDetails: params.participantDetails,
          bookingConfirmation: null // Will be updated after provider booking
        }
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to store booking: ${bookingError.message}`);
    }

    logger.info('Activity booking stored in database:', { bookingId: booking.id });

    // Step 3: Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      metadata: {
        booking_id: booking.id,
        booking_type: 'activity',
        booking_reference: bookingReference,
        user_id: userId || 'guest',
        activity_id: params.activityId
      },
      description: `Activity booking ${bookingReference} - ${params.activityData.name}`,
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

    logger.info('Activity booking process completed successfully');

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        reference: bookingReference,
        status: 'pending',
        amount: params.amount,
        currency: params.currency,
        activityName: params.activityData.name,
        selectedDate: params.selectedDate,
        selectedTime: params.selectedTime
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
    logger.error('Activity booking error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Activity booking failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});