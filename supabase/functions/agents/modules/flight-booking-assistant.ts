import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { AmadeusClient, StripeClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'flight-booking-assistant');
  
  try {
    const { 
      flightOffer,
      passengers = [],
      paymentMethod,
      contactInfo,
      seatPreferences = {},
      mealPreferences = {},
      specialRequests = []
    } = params;

    if (!flightOffer || passengers.length === 0) {
      return {
        success: false,
        error: 'Missing required parameters: flight offer or passenger information'
      };
    }

    // Validate passenger data
    for (const passenger of passengers) {
      if (!passenger.firstName || !passenger.lastName || !passenger.dateOfBirth) {
        return {
          success: false,
          error: 'Incomplete passenger information. First name, last name, and date of birth required.'
        };
      }
    }

    const amadeusClient = new AmadeusClient(
      Deno.env.get('AMADEUS_CLIENT_ID') || 'test',
      Deno.env.get('AMADEUS_CLIENT_SECRET') || 'test'
    );

    const stripeClient = new StripeClient(
      Deno.env.get('STRIPE_SECRET_KEY') || 'test'
    );

    // Create booking record
    const bookingData = {
      user_id: userId,
      booking_type: 'flight',
      booking_data: {
        flightOffer,
        passengers,
        contactInfo,
        seatPreferences,
        mealPreferences,
        specialRequests
      },
      total_amount: flightOffer.price?.total || 0,
      currency: flightOffer.price?.currency || 'USD',
      status: 'pending'
    };

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Process payment if payment method provided
    let paymentResult = null;
    if (paymentMethod) {
      try {
        paymentResult = await stripeClient.createPaymentIntent(
          Math.round(parseFloat(flightOffer.price?.total || '0') * 100),
          flightOffer.price?.currency?.toLowerCase() || 'usd',
          {
            booking_id: booking.id,
            user_id: userId,
            service_type: 'flight'
          }
        );
      } catch (paymentError) {
        console.error('Payment processing error:', paymentError);
        // Update booking status to failed
        await supabaseClient
          .from('bookings')
          .update({ status: 'payment_failed' })
          .eq('id', booking.id);
        
        return {
          success: false,
          error: 'Payment processing failed. Please try again.'
        };
      }
    }

    // TODO: In production, would call Amadeus booking API here
    // For now, simulate booking confirmation
    const confirmationCode = `MKU${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    // Update booking with confirmation
    await supabaseClient
      .from('bookings')
      .update({
        status: paymentMethod ? 'confirmed' : 'pending_payment',
        booking_reference: confirmationCode,
        provider_confirmation_code: `AM${confirmationCode}`
      })
      .eq('id', booking.id);

    await agent.logActivity(userId, 'flight_booking_created', {
      bookingId: booking.id,
      confirmationCode,
      totalAmount: flightOffer.price?.total,
      passengerCount: passengers.length
    });

    // Store booking in memory for follow-up actions
    await memory?.setMemory(
      'flight-booking-assistant',
      userId,
      'recent_booking',
      {
        bookingId: booking.id,
        confirmationCode,
        status: paymentMethod ? 'confirmed' : 'pending_payment'
      },
      undefined,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    );

    return {
      success: true,
      result: {
        bookingConfirmation: {
          bookingId: booking.id,
          confirmationCode,
          status: paymentMethod ? 'confirmed' : 'pending_payment',
          totalAmount: flightOffer.price?.total,
          currency: flightOffer.price?.currency
        },
        flightDetails: flightOffer,
        passengers: passengers.map(p => ({
          name: `${p.firstName} ${p.lastName}`,
          type: p.travelerType || 'adult'
        })),
        paymentStatus: paymentResult ? 'processed' : 'pending',
        nextSteps: paymentMethod 
          ? ['Check-in will be available 24 hours before departure', 'E-tickets will be emailed shortly']
          : ['Complete payment to confirm your booking', 'Payment link will be sent via email']
      }
    };

  } catch (error) {
    console.error('Flight booking error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process flight booking'
    };
  }
};