import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'reservations-manager');
  
  try {
    const { 
      operation = 'orchestrate_booking',
      bookingType,
      reservationData,
      customerInfo,
      paymentInfo,
      modifications,
      cancellationRequest
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);

    switch (operation) {
      case 'orchestrate_booking':
        return await orchestrateMultiServiceBooking(agent, userId, reservationData, customerInfo, paymentInfo, supabaseClient);
      
      case 'manage_modification':
        return await handleReservationModification(agent, userId, modifications, supabaseClient);
      
      case 'process_cancellation':
        return await processCancellation(agent, userId, cancellationRequest, supabaseClient);
      
      case 'check_status':
        return await checkReservationStatus(agent, userId, params.reservationId, supabaseClient);
      
      case 'generate_confirmation':
        return await generateConfirmationDocument(agent, userId, params.bookingId, supabaseClient);
      
      case 'coordinate_payments':
        return await coordinatePayments(agent, userId, params.paymentRequests, supabaseClient);
      
      default:
        return await orchestrateMultiServiceBooking(agent, userId, reservationData, customerInfo, paymentInfo, supabaseClient);
    }
  } catch (error) {
    console.error('Error in reservations-manager:', error);
    return {
      success: false,
      error: 'Failed to process reservation request',
      details: error.message
    };
  }
};

async function orchestrateMultiServiceBooking(
  agent: BaseAgent, 
  userId: string, 
  reservationData: any, 
  customerInfo: any, 
  paymentInfo: any,
  supabaseClient: any
) {
  const orchestrationId = crypto.randomUUID();
  
  // Create orchestration record
  const { data: orchestration, error: orchestrationError } = await supabaseClient
    .from('reservation_orchestrations')
    .insert({
      id: orchestrationId,
      user_id: userId,
      status: 'processing',
      reservation_type: reservationData.type || 'multi_service',
      customer_info: customerInfo,
      orchestration_data: reservationData,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (orchestrationError) {
    throw new Error(`Failed to create orchestration: ${orchestrationError.message}`);
  }

  const results = {
    orchestrationId,
    bookings: [],
    payments: [],
    confirmations: [],
    errors: []
  };

  // Process each service in the reservation
  const services = reservationData.services || [];
  
  for (const service of services) {
    try {
      let bookingResult;
      
      switch (service.type) {
        case 'flight':
          bookingResult = await supabaseClient.functions.invoke('agents', {
            body: {
              agent_id: 'flight-booking-assistant',
              intent: 'book_flight',
              params: {
                flightOffer: service.offer,
                passengers: service.passengers || customerInfo.passengers,
                paymentMethod: paymentInfo,
                orchestrationId
              }
            }
          });
          break;
          
        case 'hotel':
          bookingResult = await supabaseClient.functions.invoke('agents', {
            body: {
              agent_id: 'hotel-booking-assistant',
              intent: 'book_hotel',
              params: {
                hotelOffer: service.offer,
                guests: service.guests || customerInfo.guests,
                paymentMethod: paymentInfo,
                orchestrationId
              }
            }
          });
          break;
          
        case 'activity':
          bookingResult = await supabaseClient.functions.invoke('agents', {
            body: {
              agent_id: 'activity-booking-assistant',
              intent: 'book_activity',
              params: {
                activityOffer: service.offer,
                participants: service.participants || customerInfo.participants,
                paymentMethod: paymentInfo,
                orchestrationId
              }
            }
          });
          break;
          
        default:
          throw new Error(`Unsupported service type: ${service.type}`);
      }

      if (bookingResult.data?.success) {
        results.bookings.push({
          serviceType: service.type,
          bookingId: bookingResult.data.result.bookingId,
          confirmationCode: bookingResult.data.result.confirmationCode,
          status: 'confirmed'
        });
      } else {
        results.errors.push({
          serviceType: service.type,
          error: bookingResult.data?.error || 'Unknown booking error'
        });
      }
    } catch (error) {
      results.errors.push({
        serviceType: service.type,
        error: error.message
      });
    }
  }

  // Update orchestration status
  const finalStatus = results.errors.length === 0 ? 'completed' : 
                     results.bookings.length > 0 ? 'partial' : 'failed';

  await supabaseClient
    .from('reservation_orchestrations')
    .update({
      status: finalStatus,
      results: results,
      completed_at: new Date().toISOString()
    })
    .eq('id', orchestrationId);

  // Log orchestration activity
  await agent.logActivity(userId, 'reservation_orchestration', {
    orchestrationId,
    servicesRequested: services.length,
    successfulBookings: results.bookings.length,
    errors: results.errors.length,
    finalStatus
  });

  // Store in memory for follow-up actions
  await memory.setMemory('reservations-manager', userId, 'recent_orchestration', {
    orchestrationId,
    timestamp: new Date().toISOString(),
    status: finalStatus,
    summary: results
  });

  return {
    success: finalStatus !== 'failed',
    orchestrationId,
    status: finalStatus,
    results,
    message: generateOrchestrationMessage(finalStatus, results)
  };
}

async function handleReservationModification(
  agent: BaseAgent,
  userId: string,
  modifications: any,
  supabaseClient: any
) {
  const { reservationId, changes, reason } = modifications;

  // Get existing reservation
  const { data: reservation } = await supabaseClient
    .from('bookings')
    .select('*')
    .eq('id', reservationId)
    .eq('user_id', userId)
    .single();

  if (!reservation) {
    throw new Error('Reservation not found or unauthorized');
  }

  // Process modification based on booking type
  let modificationResult;
  
  try {
    modificationResult = await supabaseClient.functions.invoke('agents', {
      body: {
        agent_id: 'booking-modification',
        intent: 'modify_booking',
        params: {
          bookingId: reservationId,
          modificationType: changes.type,
          newDetails: changes.details,
          reason
        }
      }
    });

    // Log modification
    await agent.logActivity(userId, 'reservation_modification', {
      reservationId,
      modificationType: changes.type,
      success: modificationResult.data?.success || false
    });

    return {
      success: modificationResult.data?.success || false,
      modificationId: crypto.randomUUID(),
      originalReservation: reservationId,
      changes: changes,
      fee: modificationResult.data?.result?.modificationFee || 0,
      newConfirmation: modificationResult.data?.result?.newDetails || {}
    };
  } catch (error) {
    throw new Error(`Modification failed: ${error.message}`);
  }
}

async function processCancellation(
  agent: BaseAgent,
  userId: string,
  cancellationRequest: any,
  supabaseClient: any
) {
  const { reservationId, reason, refundType } = cancellationRequest;

  // Update reservation status
  const { error: updateError } = await supabaseClient
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    })
    .eq('id', reservationId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to cancel reservation: ${updateError.message}`);
  }

  // Process refund if applicable
  let refundAmount = 0;
  if (refundType !== 'no_refund') {
    // Calculate refund based on cancellation policy
    // This would integrate with payment systems
    refundAmount = calculateRefund(refundType);
  }

  await agent.logActivity(userId, 'reservation_cancellation', {
    reservationId,
    reason,
    refundAmount,
    refundType
  });

  return {
    success: true,
    cancellationId: crypto.randomUUID(),
    reservationId,
    refundAmount,
    refundType,
    message: `Reservation cancelled successfully. ${refundAmount > 0 ? `Refund of $${refundAmount} will be processed.` : 'No refund applicable.'}`
  };
}

async function checkReservationStatus(
  agent: BaseAgent,
  userId: string,
  reservationId: string,
  supabaseClient: any
) {
  const { data: reservation } = await supabaseClient
    .from('bookings')
    .select('*')
    .eq('id', reservationId)
    .eq('user_id', userId)
    .single();

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  return {
    success: true,
    reservationId,
    status: reservation.status,
    bookingReference: reservation.booking_reference,
    details: reservation.booking_data,
    lastUpdated: reservation.updated_at
  };
}

async function generateConfirmationDocument(
  agent: BaseAgent,
  userId: string,
  bookingId: string,
  supabaseClient: any
) {
  // This would integrate with document generation services
  return {
    success: true,
    documentId: crypto.randomUUID(),
    documentType: 'confirmation',
    downloadUrl: `https://documents.example.com/confirmations/${bookingId}.pdf`,
    generatedAt: new Date().toISOString()
  };
}

async function coordinatePayments(
  agent: BaseAgent,
  userId: string,
  paymentRequests: any[],
  supabaseClient: any
) {
  const results = [];
  
  for (const payment of paymentRequests) {
    // Process each payment through the payment system
    results.push({
      paymentId: crypto.randomUUID(),
      amount: payment.amount,
      currency: payment.currency,
      status: 'processed',
      serviceType: payment.serviceType
    });
  }

  return {
    success: true,
    paymentCoordinationId: crypto.randomUUID(),
    payments: results,
    totalAmount: paymentRequests.reduce((sum, p) => sum + p.amount, 0)
  };
}

function generateOrchestrationMessage(status: string, results: any): string {
  switch (status) {
    case 'completed':
      return `All ${results.bookings.length} services booked successfully! Your complete reservation is confirmed.`;
    case 'partial':
      return `${results.bookings.length} out of ${results.bookings.length + results.errors.length} services booked. Some bookings failed and may need attention.`;
    case 'failed':
      return `Reservation failed. No services were successfully booked. Please review the errors and try again.`;
    default:
      return 'Reservation processing status unknown.';
  }
}

function calculateRefund(refundType: string): number {
  // Simplified refund calculation
  switch (refundType) {
    case 'full_refund':
      return 1000; // Placeholder amount
    case 'partial_refund':
      return 750;
    case 'credit_only':
      return 0;
    default:
      return 0;
  }
}