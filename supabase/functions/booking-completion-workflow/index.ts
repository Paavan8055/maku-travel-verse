import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingCompletionRequest {
  bookingId: string;
  paymentIntentId: string;
  correlationId?: string;
}

interface ProviderBookingRequest {
  provider: string;
  bookingData: any;
  paymentConfirmed: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  });

  try {
    const { bookingId, paymentIntentId, correlationId }: BookingCompletionRequest = await req.json();
    
    const finalCorrelationId = correlationId || `booking-completion-${Date.now()}`;
    
    logger.info('[BOOKING-COMPLETION] Starting booking completion workflow', {
      bookingId,
      paymentIntentId,
      correlationId: finalCorrelationId
    });

    // Step 1: Verify payment status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      logger.error('[BOOKING-COMPLETION] Payment not successful', {
        paymentIntentId,
        status: paymentIntent.status,
        correlationId: finalCorrelationId
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment not completed',
        paymentStatus: paymentIntent.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Step 2: Get booking details from database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      logger.error('[BOOKING-COMPLETION] Booking not found', {
        bookingId,
        error: bookingError,
        correlationId: finalCorrelationId
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Booking not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Step 3: Create provider booking based on booking type
    let providerResult;
    try {
      providerResult = await createProviderBooking(supabase, booking, finalCorrelationId);
    } catch (error) {
      logger.error('[BOOKING-COMPLETION] Provider booking failed', {
        bookingId,
        error: error.message,
        correlationId: finalCorrelationId
      });
      
      // Handle provider booking failure - should we refund?
      await handleProviderBookingFailure(supabase, stripe, booking, paymentIntentId, error, finalCorrelationId);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Provider booking failed',
        details: error.message,
        refundInitiated: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Step 4: Update booking status to confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
        booking_data: {
          ...booking.booking_data,
          providerConfirmation: providerResult,
          paymentConfirmation: {
            paymentIntentId,
            status: paymentIntent.status,
            confirmedAt: new Date().toISOString()
          }
        }
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error('[BOOKING-COMPLETION] Failed to update booking status', {
        bookingId,
        error: updateError,
        correlationId: finalCorrelationId
      });
    }

    // Step 5: Send confirmation notifications
    await sendBookingConfirmation(supabase, booking, providerResult, finalCorrelationId);

    // Step 6: Log successful completion
    logger.info('[BOOKING-COMPLETION] Booking completion successful', {
      bookingId,
      providerBookingId: providerResult?.bookingId,
      confirmationNumber: providerResult?.confirmationNumber,
      correlationId: finalCorrelationId
    });

    return new Response(JSON.stringify({
      success: true,
      bookingId,
      status: 'confirmed',
      providerBookingId: providerResult?.bookingId,
      confirmationNumber: providerResult?.confirmationNumber,
      correlationId: finalCorrelationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    logger.error('[BOOKING-COMPLETION] Workflow failed', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Booking completion workflow failed',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function createProviderBooking(supabase: any, booking: any, correlationId: string) {
  const bookingType = booking.booking_type;
  const bookingData = booking.booking_data;
  
  logger.info(`[BOOKING-COMPLETION] Creating ${bookingType} booking with provider`, {
    bookingType,
    correlationId
  });

  switch (bookingType) {
    case 'flight':
      return await createFlightBooking(supabase, bookingData, correlationId);
    case 'hotel':
      return await createHotelBooking(supabase, bookingData, correlationId);
    case 'activity':
      return await createActivityBooking(supabase, bookingData, correlationId);
    default:
      throw new Error(`Unsupported booking type: ${bookingType}`);
  }
}

async function createFlightBooking(supabase: any, bookingData: any, correlationId: string) {
  // Determine which provider to use based on the original search data
  const provider = bookingData?.selectedFlight?.provider || 'amadeus';
  
  const functionMap: Record<string, string> = {
    'amadeus': 'amadeus-flight-booking',
    'sabre': 'sabre-flight-booking'
  };
  
  const functionName = functionMap[provider.toLowerCase()];
  if (!functionName) {
    throw new Error(`Unsupported flight provider: ${provider}`);
  }

  logger.info(`[BOOKING-COMPLETION] Creating flight booking with ${provider}`, {
    functionName,
    correlationId
  });

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      flightOffer: bookingData.selectedFlight,
      passengers: bookingData.passengers,
      contactInfo: bookingData.contactInfo,
      correlationId
    }
  });

  if (error) {
    throw new Error(`Flight booking failed: ${error.message}`);
  }

  return {
    provider,
    bookingId: data?.bookingId || data?.pnr,
    confirmationNumber: data?.confirmationNumber || data?.locator,
    tickets: data?.tickets,
    status: data?.status || 'confirmed'
  };
}

async function createHotelBooking(supabase: any, bookingData: any, correlationId: string) {
  const provider = bookingData?.selectedHotel?.provider || 'hotelbeds';
  
  const functionMap: Record<string, string> = {
    'hotelbeds': 'hotelbeds-booking',
    'amadeus': 'amadeus-hotel-booking',
    'sabre': 'sabre-hotel-booking'
  };
  
  const functionName = functionMap[provider.toLowerCase()];
  if (!functionName) {
    throw new Error(`Unsupported hotel provider: ${provider}`);
  }

  logger.info(`[BOOKING-COMPLETION] Creating hotel booking with ${provider}`, {
    functionName,
    correlationId
  });

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      hotelOffer: bookingData.selectedHotel,
      guests: bookingData.guests,
      contactInfo: bookingData.contactInfo,
      correlationId
    }
  });

  if (error) {
    throw new Error(`Hotel booking failed: ${error.message}`);
  }

  return {
    provider,
    bookingId: data?.bookingId || data?.reference,
    confirmationNumber: data?.confirmationNumber,
    voucher: data?.voucher,
    status: data?.status || 'confirmed'
  };
}

async function createActivityBooking(supabase: any, bookingData: any, correlationId: string) {
  const provider = bookingData?.selectedActivity?.provider || 'hotelbeds';
  
  const functionMap: Record<string, string> = {
    'hotelbeds': 'create-activity-booking',
    'amadeus': 'amadeus-activity-booking'
  };
  
  const functionName = functionMap[provider.toLowerCase()];
  if (!functionName) {
    throw new Error(`Unsupported activity provider: ${provider}`);
  }

  logger.info(`[BOOKING-COMPLETION] Creating activity booking with ${provider}`, {
    functionName,
    correlationId
  });

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      activityOffer: bookingData.selectedActivity,
      participants: bookingData.participants,
      contactInfo: bookingData.contactInfo,
      correlationId
    }
  });

  if (error) {
    throw new Error(`Activity booking failed: ${error.message}`);
  }

  return {
    provider,
    bookingId: data?.bookingId || data?.reference,
    confirmationNumber: data?.confirmationNumber,
    voucher: data?.voucher,
    status: data?.status || 'confirmed'
  };
}

async function handleProviderBookingFailure(
  supabase: any,
  stripe: Stripe,
  booking: any,
  paymentIntentId: string,
  error: any,
  correlationId: string
) {
  logger.warn('[BOOKING-COMPLETION] Handling provider booking failure', {
    bookingId: booking.id,
    error: error.message,
    correlationId
  });

  try {
    // Initiate refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        booking_id: booking.id,
        reason: 'provider_booking_failed',
        correlation_id: correlationId
      }
    });

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
        booking_data: {
          ...booking.booking_data,
          refund: {
            refundId: refund.id,
            amount: refund.amount,
            status: refund.status,
            reason: 'Provider booking failed',
            processedAt: new Date().toISOString()
          },
          providerError: {
            message: error.message,
            timestamp: new Date().toISOString()
          }
        }
      })
      .eq('id', booking.id);

    logger.info('[BOOKING-COMPLETION] Refund processed successfully', {
      bookingId: booking.id,
      refundId: refund.id,
      correlationId
    });

  } catch (refundError) {
    logger.error('[BOOKING-COMPLETION] Failed to process refund', {
      bookingId: booking.id,
      refundError: refundError.message,
      correlationId
    });
    
    // Log critical alert for manual intervention
    await supabase
      .from('critical_alerts')
      .insert({
        alert_type: 'refund_failure',
        severity: 'high',
        message: `Failed to process refund for booking ${booking.id} after provider booking failure`,
        booking_id: booking.id,
        requires_manual_action: true
      });
  }
}

async function sendBookingConfirmation(supabase: any, booking: any, providerResult: any, correlationId: string) {
  try {
    logger.info('[BOOKING-COMPLETION] Sending booking confirmation', {
      bookingId: booking.id,
      correlationId
    });

    const { error } = await supabase.functions.invoke('send-booking-confirmation', {
      body: {
        booking,
        providerResult,
        correlationId
      }
    });

    if (error) {
      logger.warn('[BOOKING-COMPLETION] Failed to send confirmation email', {
        bookingId: booking.id,
        error: error.message,
        correlationId
      });
    }
  } catch (error) {
    logger.warn('[BOOKING-COMPLETION] Confirmation email error', {
      bookingId: booking.id,
      error: error.message,
      correlationId
    });
  }
}