import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { StripeClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'refund-processing-agent');
  
  try {
    const { 
      bookingId,
      refundReason,
      refundType = 'full', // full, partial
      refundAmount, // required for partial refunds
      adminNotes,
      expedited = false
    } = params;

    if (!bookingId || !refundReason) {
      return {
        success: false,
        error: 'Missing required parameters: booking ID or refund reason'
      };
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }

    // Verify user owns this booking (unless admin override)
    if (booking.user_id !== userId && !adminNotes) {
      return {
        success: false,
        error: 'Unauthorized: You can only request refunds for your own bookings'
      };
    }

    // Check if booking is eligible for refund
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      return {
        success: false,
        error: 'Booking has already been cancelled or refunded'
      };
    }

    // Get payment information
    const { data: payment } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) {
      return {
        success: false,
        error: 'No payment found for this booking'
      };
    }

    // Calculate refund amount based on policy
    let calculatedRefundAmount = 0;
    const originalAmount = parseFloat(booking.total_amount);

    if (refundType === 'full') {
      calculatedRefundAmount = originalAmount;
    } else if (refundType === 'partial' && refundAmount) {
      calculatedRefundAmount = Math.min(parseFloat(refundAmount), originalAmount);
    } else {
      return {
        success: false,
        error: 'Invalid refund type or amount'
      };
    }

    // Apply cancellation fees based on booking type and timing
    let cancellationFee = 0;
    const bookingDate = new Date(booking.created_at);
    const now = new Date();
    const daysFromBooking = Math.floor((now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));

    // Basic cancellation policy (would be more complex in production)
    if (booking.booking_type === 'flight') {
      if (daysFromBooking < 1) cancellationFee = 0; // 24hr free cancellation
      else if (daysFromBooking < 7) cancellationFee = originalAmount * 0.1; // 10% fee
      else cancellationFee = originalAmount * 0.25; // 25% fee
    } else if (booking.booking_type === 'hotel') {
      if (daysFromBooking < 2) cancellationFee = 0; // 48hr free cancellation
      else cancellationFee = originalAmount * 0.15; // 15% fee
    } else if (booking.booking_type === 'activity') {
      if (daysFromBooking < 1) cancellationFee = 0; // 24hr free cancellation
      else cancellationFee = originalAmount * 0.2; // 20% fee
    }

    const finalRefundAmount = Math.max(0, calculatedRefundAmount - cancellationFee);

    // Process refund through Stripe
    const stripeClient = new StripeClient(
      Deno.env.get('STRIPE_SECRET_KEY') || 'test'
    );

    let refundResult = null;
    try {
      if (finalRefundAmount > 0) {
        refundResult = await stripeClient.processRefund(
          payment.stripe_payment_intent_id,
          Math.round(finalRefundAmount * 100) // Convert to cents
        );
      }
    } catch (refundError) {
      console.error('Stripe refund failed:', refundError);
      return {
        success: false,
        error: 'Payment refund processing failed. Please contact support.'
      };
    }

    // Create refund record
    const refundData = {
      booking_id: bookingId,
      user_id: booking.user_id,
      original_amount: originalAmount,
      refund_amount: finalRefundAmount,
      cancellation_fee: cancellationFee,
      refund_reason: refundReason,
      refund_type: refundType,
      stripe_refund_id: refundResult?.id,
      status: finalRefundAmount > 0 ? 'processed' : 'no_refund_due',
      processed_by: adminNotes ? userId : booking.user_id,
      admin_notes: adminNotes,
      expedited
    };

    const { data: refundRecord, error: refundError } = await supabaseClient
      .from('refunds')
      .insert(refundData)
      .select()
      .single();

    if (refundError) {
      console.error('Refund record creation failed:', refundError);
    }

    // Update booking status
    await supabaseClient
      .from('bookings')
      .update({ 
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    await agent.logActivity(booking.user_id, 'refund_processed', {
      bookingId,
      refundAmount: finalRefundAmount,
      cancellationFee,
      refundReason,
      refundType,
      processedBy: adminNotes ? 'admin' : 'user'
    });

    // Store refund in memory for follow-up
    await memory?.setMemory(
      'refund-processing-agent',
      booking.user_id,
      'recent_refund',
      {
        bookingId,
        refundAmount: finalRefundAmount,
        cancellationFee,
        processedAt: new Date().toISOString(),
        estimatedDelivery: expedited ? '3-5 business days' : '5-10 business days'
      },
      undefined,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    );

    return {
      success: true,
      result: {
        refundConfirmation: {
          refundId: refundRecord?.id || 'pending',
          bookingReference: booking.booking_reference,
          originalAmount,
          cancellationFee,
          refundAmount: finalRefundAmount,
          currency: booking.currency
        },
        refundDetails: {
          reason: refundReason,
          type: refundType,
          processedAt: new Date().toISOString(),
          estimatedDelivery: expedited ? '3-5 business days' : '5-10 business days',
          refundMethod: 'Original payment method'
        },
        nextSteps: finalRefundAmount > 0 ? [
          'Refund will be processed to your original payment method',
          expedited ? 'Expedited processing: 3-5 business days' : 'Standard processing: 5-10 business days',
          'You will receive an email confirmation',
          'Contact support if you have questions'
        ] : [
          'No refund amount due after cancellation fees',
          'Booking has been cancelled',
          'Contact support if you have questions about the cancellation policy'
        ]
      }
    };

  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process refund request'
    };
  }
};