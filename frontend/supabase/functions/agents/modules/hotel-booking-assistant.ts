import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { HotelBedsClient, StripeClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'hotel-booking-assistant');
  
  try {
    const { 
      hotelOffer,
      guests = [],
      checkInDate,
      checkOutDate,
      roomCount = 1,
      roomType,
      paymentMethod,
      contactInfo,
      specialRequests = []
    } = params;

    if (!hotelOffer || !checkInDate || !checkOutDate || guests.length === 0) {
      return {
        success: false,
        error: 'Missing required parameters: hotel offer, dates, or guest information'
      };
    }

    // Validate guest data
    const primaryGuest = guests[0];
    if (!primaryGuest?.firstName || !primaryGuest?.lastName) {
      return {
        success: false,
        error: 'Primary guest information incomplete. First name and last name required.'
      };
    }

    const hotelBedsClient = new HotelBedsClient(
      Deno.env.get('HOTELBEDS_API_KEY') || 'test',
      Deno.env.get('HOTELBEDS_SECRET') || 'test'
    );

    const stripeClient = new StripeClient(
      Deno.env.get('STRIPE_SECRET_KEY') || 'test'
    );

    // Calculate total nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Create booking record
    const bookingData = {
      user_id: userId,
      booking_type: 'hotel',
      booking_data: {
        hotelOffer,
        guests,
        checkInDate,
        checkOutDate,
        roomCount,
        roomType,
        contactInfo,
        specialRequests,
        nights
      },
      total_amount: hotelOffer.price?.total || 0,
      currency: hotelOffer.price?.currency || 'USD',
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
          Math.round(parseFloat(hotelOffer.price?.total || '0') * 100),
          hotelOffer.price?.currency?.toLowerCase() || 'usd',
          {
            booking_id: booking.id,
            user_id: userId,
            service_type: 'hotel',
            check_in: checkInDate,
            check_out: checkOutDate
          }
        );
      } catch (paymentError) {
        console.error('Payment processing error:', paymentError);
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

    // Generate confirmation code
    const confirmationCode = `MKH${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    // Update booking with confirmation
    await supabaseClient
      .from('bookings')
      .update({
        status: paymentMethod ? 'confirmed' : 'pending_payment',
        booking_reference: confirmationCode,
        provider_confirmation_code: `HB${confirmationCode}`
      })
      .eq('id', booking.id);

    await agent.logActivity(userId, 'hotel_booking_created', {
      bookingId: booking.id,
      confirmationCode,
      hotelName: hotelOffer.hotel?.name,
      checkInDate,
      checkOutDate,
      nights,
      guestCount: guests.length
    });

    // Store booking in memory
    await memory?.setMemory(
      'hotel-booking-assistant',
      userId,
      'recent_booking',
      {
        bookingId: booking.id,
        confirmationCode,
        checkInDate,
        checkOutDate,
        hotelName: hotelOffer.hotel?.name
      },
      undefined,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    );

    return {
      success: true,
      result: {
        bookingConfirmation: {
          bookingId: booking.id,
          confirmationCode,
          status: paymentMethod ? 'confirmed' : 'pending_payment',
          totalAmount: hotelOffer.price?.total,
          currency: hotelOffer.price?.currency
        },
        hotelDetails: {
          name: hotelOffer.hotel?.name,
          address: hotelOffer.hotel?.address,
          checkInDate,
          checkOutDate,
          nights,
          roomCount,
          roomType
        },
        guests: guests.map(g => ({
          name: `${g.firstName} ${g.lastName}`,
          type: g.guestType || 'adult'
        })),
        specialRequests,
        paymentStatus: paymentResult ? 'processed' : 'pending',
        nextSteps: paymentMethod 
          ? ['Hotel voucher will be emailed shortly', 'Check-in time is typically 3:00 PM', 'Present confirmation code at reception']
          : ['Complete payment to confirm your reservation', 'Payment link will be sent via email']
      }
    };

  } catch (error) {
    console.error('Hotel booking error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process hotel booking'
    };
  }
};