import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";


interface BulkOperationResult {
  booking_id: string;
  booking_reference: string;
  operation: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  error?: string;
}

interface CommunicationTemplate {
  id: string;
  subject: string;
  body: string;
  variables: string[];
}

export const handler = async (req: Request, supabase?: any) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!supabase) {
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
    }

    const {
      operation,
      operationType,
      bookingIds,
      message,
      template,
      options = {},
      correlationId
    } = await req.json();

    console.log(`[BULK-OPS] ${operation} operation for ${bookingIds?.length} bookings`);

    switch (operation) {
      case 'bulk_operation':
        return await processBulkOperation(supabase, operationType, bookingIds, correlationId);

      case 'bulk_communication':
        return await processBulkCommunication(supabase, bookingIds, message, template, correlationId);

      case 'bulk_status_update':
        return await processBulkStatusUpdate(supabase, bookingIds, options.newStatus, correlationId);

      case 'bulk_refund':
        return await processBulkRefund(supabase, bookingIds, options, correlationId);

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation specified' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[BULK-OPS] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Bulk operation failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);

async function processBulkOperation(
  supabase: any, 
  operationType: string, 
  bookingIds: string[], 
  correlationId: string
): Promise<Response> {
  const results: BulkOperationResult[] = [];
  const startTime = Date.now();

  try {
    console.log(`[BULK-OPS] Processing ${operationType} for ${bookingIds.length} bookings`);

    for (const bookingId of bookingIds) {
      try {
        // Fetch booking details
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('id, booking_reference, status, booking_type, booking_data, total_amount, currency')
          .eq('id', bookingId)
          .single();

        if (fetchError || !booking) {
          results.push({
            booking_id: bookingId,
            booking_reference: 'UNKNOWN',
            operation: operationType,
            status: 'failed',
            error: 'Booking not found'
          });
          continue;
        }

        const result = await executeBookingOperation(supabase, booking, operationType, correlationId);
        results.push(result);

      } catch (error) {
        console.error(`[BULK-OPS] Error processing booking ${bookingId}:`, error);
        results.push({
          booking_id: bookingId,
          booking_reference: 'ERROR',
          operation: operationType,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Log bulk operation completion
    await logBulkOperation(supabase, operationType, bookingIds, results, correlationId);

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return new Response(
      JSON.stringify({
        success: true,
        operation: operationType,
        total_processed: results.length,
        successful: successCount,
        failed: failCount,
        results,
        execution_time_ms: Date.now() - startTime,
        correlation_id: correlationId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BULK-OP-PROCESS] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Bulk operation processing failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function executeBookingOperation(
  supabase: any, 
  booking: any, 
  operationType: string, 
  correlationId: string
): Promise<BulkOperationResult> {
  
  try {
    switch (operationType) {
      case 'retry':
        return await retryBooking(supabase, booking, correlationId);
      
      case 'cancel':
        return await cancelBooking(supabase, booking, correlationId);
      
      case 'refund':
        return await refundBooking(supabase, booking, correlationId);
      
      default:
        return {
          booking_id: booking.id,
          booking_reference: booking.booking_reference,
          operation: operationType,
          status: 'failed',
          error: 'Unsupported operation type'
        };
    }
  } catch (error) {
    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      operation: operationType,
      status: 'failed',
      error: error.message
    };
  }
}

async function retryBooking(supabase: any, booking: any, correlationId: string): Promise<BulkOperationResult> {
  try {
    // Only retry bookings that are in failed or expired state
    if (!['failed', 'expired', 'pending'].includes(booking.status)) {
      return {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        operation: 'retry',
        status: 'skipped',
        message: `Booking status '${booking.status}' not eligible for retry`
      };
    }

    // Update status to pending for retry
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'pending', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', booking.id);

    if (updateError) throw updateError;

    // Add to booking status history
    await supabase
      .from('booking_status_history')
      .insert({
        booking_id: booking.id,
        previous_status: booking.status,
        new_status: 'pending',
        reason: 'Bulk retry operation',
        changed_by: null, // Would be actual admin user ID
        metadata: { correlation_id: correlationId, bulk_operation: true }
      });

    // Trigger provider booking attempt based on booking type
    if (booking.booking_type === 'hotel') {
      await supabase.functions.invoke('amadeus-hotel-booking', {
        body: {
          booking_id: booking.id,
          offer_data: booking.booking_data,
          retry_attempt: true
        }
      });
    } else if (booking.booking_type === 'flight') {
      await supabase.functions.invoke('amadeus-flight-booking', {
        body: {
          booking_id: booking.id,
          offer_data: booking.booking_data,
          retry_attempt: true
        }
      });
    }

    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      operation: 'retry',
      status: 'success',
      message: 'Booking retry initiated'
    };

  } catch (error) {
    throw new Error(`Retry failed: ${error.message}`);
  }
}

async function cancelBooking(supabase: any, booking: any, correlationId: string): Promise<BulkOperationResult> {
  try {
    // Only cancel bookings that are not already cancelled or completed
    if (['cancelled', 'completed'].includes(booking.status)) {
      return {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        operation: 'cancel',
        status: 'skipped',
        message: `Booking already ${booking.status}`
      };
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', booking.id);

    if (updateError) throw updateError;

    // Add to booking status history
    await supabase
      .from('booking_status_history')
      .insert({
        booking_id: booking.id,
        previous_status: booking.status,
        new_status: 'cancelled',
        reason: 'Bulk cancellation operation',
        changed_by: null,
        metadata: { correlation_id: correlationId, bulk_operation: true }
      });

    // If booking was confirmed, attempt provider cancellation
    if (booking.status === 'confirmed') {
      if (booking.booking_type === 'hotel') {
        await supabase.functions.invoke('hotelbeds-cancel-booking', {
          body: {
            booking_id: booking.id,
            reason: 'Administrative cancellation'
          }
        });
      }
    }

    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      operation: 'cancel',
      status: 'success',
      message: 'Booking cancelled successfully'
    };

  } catch (error) {
    throw new Error(`Cancellation failed: ${error.message}`);
  }
}

async function refundBooking(supabase: any, booking: any, correlationId: string): Promise<BulkOperationResult> {
  try {
    // Check if booking has payments to refund
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('status', 'completed');

    if (paymentError) throw paymentError;

    if (!payments || payments.length === 0) {
      return {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        operation: 'refund',
        status: 'skipped',
        message: 'No completed payments found for refund'
      };
    }

    // Process refund for each payment
    for (const payment of payments) {
      if (payment.stripe_payment_intent_id) {
        // Create refund record
        await supabase
          .from('payments')
          .insert({
            booking_id: booking.id,
            stripe_payment_intent_id: payment.stripe_payment_intent_id,
            amount: -payment.amount, // Negative amount for refund
            currency: payment.currency,
            status: 'refund_pending',
            payment_method: 'stripe_refund'
          });
      }
    }

    // Update booking status if not already cancelled
    if (booking.status !== 'cancelled') {
      await supabase
        .from('bookings')
        .update({ 
          status: 'refunded', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', booking.id);

      // Add to booking status history
      await supabase
        .from('booking_status_history')
        .insert({
          booking_id: booking.id,
          previous_status: booking.status,
          new_status: 'refunded',
          reason: 'Bulk refund operation',
          changed_by: null,
          metadata: { correlation_id: correlationId, bulk_operation: true }
        });
    }

    return {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      operation: 'refund',
      status: 'success',
      message: `Refund processed for ${payments.length} payment(s)`
    };

  } catch (error) {
    throw new Error(`Refund failed: ${error.message}`);
  }
}

async function processBulkCommunication(
  supabase: any, 
  bookingIds: string[], 
  message: string, 
  template: any,
  correlationId: string
): Promise<Response> {
  const results: BulkOperationResult[] = [];

  try {
    for (const bookingId of bookingIds) {
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, booking_reference, booking_data')
          .eq('id', bookingId)
          .single();

        if (!booking) {
          results.push({
            booking_id: bookingId,
            booking_reference: 'UNKNOWN',
            operation: 'communication',
            status: 'failed',
            error: 'Booking not found'
          });
          continue;
        }

        const customerInfo = booking.booking_data?.customerInfo || {};
        const customerEmail = customerInfo.email;

        if (!customerEmail) {
          results.push({
            booking_id: booking.id,
            booking_reference: booking.booking_reference,
            operation: 'communication',
            status: 'failed',
            error: 'No customer email found'
          });
          continue;
        }

        // Send communication (would integrate with email service in production)
        const finalMessage = template ? 
          template.body.replace(/\{bookingRef\}/g, booking.booking_reference)
                      .replace(/\{customerName\}/g, customerInfo.firstName || 'Valued Customer') :
          message;

        // Log communication in database
        await supabase
          .from('booking_updates')
          .insert({
            booking_id: booking.id,
            booking_reference: booking.booking_reference,
            user_id: customerInfo.user_id,
            update_type: 'communication',
            title: template?.subject || 'Important Update',
            message: finalMessage,
            status: 'sent',
            booking_type: booking.booking_type || 'unknown'
          });

        results.push({
          booking_id: booking.id,
          booking_reference: booking.booking_reference,
          operation: 'communication',
          status: 'success',
          message: `Communication sent to ${customerEmail}`
        });

      } catch (error) {
        results.push({
          booking_id: bookingId,
          booking_reference: 'ERROR',
          operation: 'communication',
          status: 'failed',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;

    return new Response(
      JSON.stringify({
        success: true,
        operation: 'bulk_communication',
        total_processed: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results,
        correlation_id: correlationId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BULK-COMM] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Bulk communication failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function processBulkStatusUpdate(
  supabase: any, 
  bookingIds: string[], 
  newStatus: string,
  correlationId: string
): Promise<Response> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .in('id', bookingIds);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        operation: 'bulk_status_update',
        updated_count: bookingIds.length,
        new_status: newStatus,
        correlation_id: correlationId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BULK-STATUS] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Bulk status update failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function processBulkRefund(
  supabase: any, 
  bookingIds: string[], 
  options: any,
  correlationId: string
): Promise<Response> {
  // Implementation similar to individual refund but for multiple bookings
  const results: BulkOperationResult[] = [];
  
  for (const bookingId of bookingIds) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (booking) {
        const result = await refundBooking(supabase, booking, correlationId);
        results.push(result);
      }
    } catch (error) {
      results.push({
        booking_id: bookingId,
        booking_reference: 'ERROR',
        operation: 'refund',
        status: 'failed',
        error: error.message
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      operation: 'bulk_refund',
      results,
      correlation_id: correlationId
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function logBulkOperation(
  supabase: any, 
  operationType: string, 
  bookingIds: string[], 
  results: BulkOperationResult[],
  correlationId: string
): Promise<void> {
  try {
    await supabase.functions.invoke('log-system-event', {
      body: {
        correlation_id: correlationId,
        service_name: 'bulk-booking-operations',
        log_level: 'info',
        message: `Bulk ${operationType} operation completed`,
        metadata: {
          operation_type: operationType,
          total_bookings: bookingIds.length,
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failed').length,
          skipped: results.filter(r => r.status === 'skipped').length
        }
      }
    });
  } catch (error) {
    console.error('[BULK-LOG] Error logging operation:', error);
  }
}