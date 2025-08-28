import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingFlowRequest {
  step: 'initiate' | 'confirm' | 'complete' | 'cancel';
  bookingType: 'flight' | 'hotel' | 'activity' | 'package';
  bookingData: any;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
  fundAmount?: number;
  selectedAddons?: string[];
  crossSellItems?: {
    insurance?: boolean;
    transfers?: boolean;
    activities?: any[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  });

  try {
    const request: BookingFlowRequest = await req.json();
    logger.info('[BOOKING-FLOW] Processing request', { step: request.step, bookingType: request.bookingType });

    switch (request.step) {
      case 'initiate':
        return await initiateBooking(supabase, stripe, request);
      case 'confirm':
        return await confirmBooking(supabase, stripe, request);
      case 'complete':
        return await completeBooking(supabase, stripe, request);
      case 'cancel':
        return await cancelBooking(supabase, stripe, request);
      default:
        throw new Error('Invalid booking step');
    }

  } catch (error) {
    logger.error('[BOOKING-FLOW] Request failed', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function initiateBooking(supabase: any, stripe: Stripe, request: BookingFlowRequest) {
  // Generate booking reference
  const bookingReference = `MAKU${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  // Calculate total amount including cross-sells and addons
  let totalAmount = request.bookingData.price?.amount || request.bookingData.totalPrice || 0;
  
  // Add cross-sell items
  if (request.crossSellItems?.insurance) {
    totalAmount += 49; // $49 travel insurance
  }
  if (request.crossSellItems?.transfers) {
    totalAmount += 85; // $85 airport transfers
  }
  if (request.crossSellItems?.activities?.length) {
    totalAmount += request.crossSellItems.activities.reduce((sum, activity) => sum + (activity.price || 0), 0);
  }

  // Add selected addons
  if (request.selectedAddons?.length) {
    // Fetch addon prices from database
    const { data: addons } = await supabase
      .from('booking_addons_catalog')
      .select('*')
      .in('id', request.selectedAddons);
    
    if (addons) {
      totalAmount += addons.reduce((sum: number, addon: any) => sum + addon.price, 0);
    }
  }

  // Create booking record
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_reference: bookingReference,
      booking_type: request.bookingType,
      status: 'initiated',
      total_amount: totalAmount,
      currency: 'AUD',
      booking_data: {
        ...request.bookingData,
        customerInfo: request.customerInfo,
        crossSellItems: request.crossSellItems,
        selectedAddons: request.selectedAddons
      }
    })
    .select()
    .single();

  if (bookingError) {
    throw new Error(`Failed to create booking: ${bookingError.message}`);
  }

  // Handle payment method
  let paymentResponse;
  
  if (request.paymentMethod === 'fund' && request.fundAmount && request.fundAmount >= totalAmount) {
    // Pure fund payment
    paymentResponse = await processFundPayment(supabase, booking.id, totalAmount);
  } else if (request.paymentMethod === 'split' && request.fundAmount && request.fundAmount > 0) {
    // Split payment: fund + card
    const cardAmount = totalAmount - request.fundAmount;
    paymentResponse = await createSplitPayment(supabase, stripe, booking.id, cardAmount, request.fundAmount);
  } else {
    // Pure card payment
    paymentResponse = await createCardPayment(stripe, booking.id, totalAmount, request.customerInfo);
  }

  logger.info('[BOOKING-FLOW] Booking initiated', { 
    bookingId: booking.id, 
    reference: bookingReference,
    totalAmount,
    paymentMethod: request.paymentMethod
  });

  return new Response(JSON.stringify({
    success: true,
    booking: {
      id: booking.id,
      reference: bookingReference,
      status: 'initiated',
      totalAmount,
      currency: 'AUD'
    },
    payment: paymentResponse
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function confirmBooking(supabase: any, stripe: Stripe, request: BookingFlowRequest) {
  // This step handles provider confirmation after payment success
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', request.bookingData.bookingId)
    .single();

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Call appropriate provider booking function
  let providerResult;
  
  switch (request.bookingType) {
    case 'flight':
      providerResult = await supabase.functions.invoke('amadeus-flight-booking', {
        body: booking.booking_data
      });
      break;
    case 'hotel':
      providerResult = await supabase.functions.invoke('hotelbeds-hotel-booking', {
        body: booking.booking_data
      });
      break;
    case 'activity':
      providerResult = await supabase.functions.invoke('hotelbeds-activity-booking', {
        body: booking.booking_data
      });
      break;
    default:
      throw new Error('Unsupported booking type');
  }

  if (providerResult.error || !providerResult.data?.success) {
    // Update booking status to failed
    await supabase
      .from('bookings')
      .update({ 
        status: 'failed',
        provider_response: providerResult.data || providerResult.error
      })
      .eq('id', booking.id);

    throw new Error('Provider booking failed');
  }

  // Update booking with provider confirmation
  await supabase
    .from('bookings')
    .update({ 
      status: 'confirmed',
      provider_response: providerResult.data,
      confirmed_at: new Date().toISOString()
    })
    .eq('id', booking.id);

  // Send confirmation email
  await supabase.functions.invoke('send-booking-confirmation', {
    body: {
      bookingId: booking.id,
      customerEmail: booking.booking_data.customerInfo.email
    }
  });

  return new Response(JSON.stringify({
    success: true,
    booking: {
      id: booking.id,
      reference: booking.booking_reference,
      status: 'confirmed',
      providerConfirmation: providerResult.data
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function completeBooking(supabase: any, stripe: Stripe, request: BookingFlowRequest) {
  // Final step - mark booking as complete and process loyalty points
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', request.bookingData.bookingId)
    .single();

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Calculate loyalty points (1 point per $1 spent)
  const loyaltyPoints = Math.floor(booking.total_amount);

  // Award loyalty points if user is logged in
  if (booking.user_id) {
    await supabase
      .from('loyalty_points')
      .upsert({
        user_id: booking.user_id,
        points_earned: loyaltyPoints,
        transaction_type: 'booking',
        reference_id: booking.id
      });
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', booking.id);

  return new Response(JSON.stringify({
    success: true,
    booking: {
      id: booking.id,
      reference: booking.booking_reference,
      status: 'completed',
      loyaltyPointsEarned: loyaltyPoints
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function cancelBooking(supabase: any, stripe: Stripe, request: BookingFlowRequest) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', request.bookingData.bookingId)
    .single();

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Process refund if payment was made
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', booking.id)
    .eq('status', 'succeeded')
    .single();

  if (payment?.stripe_payment_intent_id) {
    await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      reason: 'requested_by_customer'
    });

    await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', payment.id);
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({ 
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', booking.id);

  return new Response(JSON.stringify({
    success: true,
    booking: {
      id: booking.id,
      reference: booking.booking_reference,
      status: 'cancelled',
      refundProcessed: !!payment?.stripe_payment_intent_id
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function processFundPayment(supabase: any, bookingId: string, amount: number) {
  // Process fund payment
  const { error } = await supabase
    .from('fund_transactions')
    .insert({
      booking_id: bookingId,
      type: 'payment',
      amount: -amount,
      status: 'completed'
    });

  if (error) {
    throw new Error(`Fund payment failed: ${error.message}`);
  }

  return {
    method: 'fund',
    status: 'completed'
  };
}

async function createSplitPayment(supabase: any, stripe: Stripe, bookingId: string, cardAmount: number, fundAmount: number) {
  // Process fund portion
  await processFundPayment(supabase, bookingId, fundAmount);

  // Create payment intent for card portion
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(cardAmount * 100), // Convert to cents
    currency: 'aud',
    metadata: {
      booking_id: bookingId,
      payment_type: 'split',
      fund_amount: fundAmount.toString()
    }
  });

  return {
    method: 'split',
    status: 'requires_payment_method',
    clientSecret: paymentIntent.client_secret,
    cardAmount,
    fundAmount
  };
}

async function createCardPayment(stripe: Stripe, bookingId: string, amount: number, customerInfo: any) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'aud',
    metadata: {
      booking_id: bookingId,
      customer_email: customerInfo.email,
      customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`
    }
  });

  return {
    method: 'card',
    status: 'requires_payment_method',
    clientSecret: paymentIntent.client_secret
  };
}