import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { StripeClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'activity-booking-assistant');
  
  try {
    const { 
      activityOffer,
      participants = [],
      activityDate,
      timeSlot,
      quantity = 1,
      paymentMethod,
      contactInfo,
      specialRequests = [],
      accessibilityNeeds = []
    } = params;

    if (!activityOffer || !activityDate || participants.length === 0) {
      return {
        success: false,
        error: 'Missing required parameters: activity offer, date, or participant information'
      };
    }

    // Validate participant data
    for (const participant of participants) {
      if (!participant.firstName || !participant.lastName) {
        return {
          success: false,
          error: 'Incomplete participant information. First name and last name required.'
        };
      }
    }

    const stripeClient = new StripeClient(
      Deno.env.get('STRIPE_SECRET_KEY') || 'test'
    );

    // Create booking record
    const bookingData = {
      user_id: userId,
      booking_type: 'activity',
      booking_data: {
        activityOffer,
        participants,
        activityDate,
        timeSlot,
        quantity,
        contactInfo,
        specialRequests,
        accessibilityNeeds
      },
      total_amount: activityOffer.price?.total || 0,
      currency: activityOffer.price?.currency || 'USD',
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
          Math.round(parseFloat(activityOffer.price?.total || '0') * 100),
          activityOffer.price?.currency?.toLowerCase() || 'usd',
          {
            booking_id: booking.id,
            user_id: userId,
            service_type: 'activity',
            activity_date: activityDate,
            time_slot: timeSlot
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
    const confirmationCode = `MKA${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    // Update booking with confirmation
    await supabaseClient
      .from('bookings')
      .update({
        status: paymentMethod ? 'confirmed' : 'pending_payment',
        booking_reference: confirmationCode,
        provider_confirmation_code: `ACT${confirmationCode}`
      })
      .eq('id', booking.id);

    await agent.logActivity(userId, 'activity_booking_created', {
      bookingId: booking.id,
      confirmationCode,
      activityName: activityOffer.activity?.name,
      activityDate,
      timeSlot,
      participantCount: participants.length
    });

    // Store booking in memory
    await memory?.setMemory(
      'activity-booking-assistant',
      userId,
      'recent_booking',
      {
        bookingId: booking.id,
        confirmationCode,
        activityDate,
        timeSlot,
        activityName: activityOffer.activity?.name
      },
      undefined,
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
    );

    return {
      success: true,
      result: {
        bookingConfirmation: {
          bookingId: booking.id,
          confirmationCode,
          status: paymentMethod ? 'confirmed' : 'pending_payment',
          totalAmount: activityOffer.price?.total,
          currency: activityOffer.price?.currency
        },
        activityDetails: {
          name: activityOffer.activity?.name,
          description: activityOffer.activity?.description,
          date: activityDate,
          timeSlot,
          duration: activityOffer.activity?.duration,
          location: activityOffer.activity?.location,
          meetingPoint: activityOffer.activity?.meetingPoint
        },
        participants: participants.map(p => ({
          name: `${p.firstName} ${p.lastName}`,
          age: p.age,
          type: p.participantType || 'adult'
        })),
        specialRequests,
        accessibilityNeeds,
        paymentStatus: paymentResult ? 'processed' : 'pending',
        nextSteps: paymentMethod 
          ? ['Activity voucher will be emailed shortly', `Arrive at meeting point 15 minutes early`, 'Bring confirmation code and ID']
          : ['Complete payment to confirm your booking', 'Payment link will be sent via email'],
        cancellationPolicy: activityOffer.cancellationPolicy || 'Standard cancellation policy applies'
      }
    };

  } catch (error) {
    console.error('Activity booking error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process activity booking'
    };
  }
};