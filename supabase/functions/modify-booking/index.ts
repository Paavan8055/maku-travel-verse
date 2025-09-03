import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


interface ModificationRequest {
  booking_id: string;
  modification_type: 'date_change' | 'guest_change' | 'room_upgrade' | 'service_addition' | 'cancellation';
  new_data: {
    check_in_date?: string;
    check_out_date?: string;
    guest_count?: number;
    room_type?: string;
    additional_services?: string[];
    passenger_details?: any[];
    flight_segments?: any[];
  };
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, modification_type, new_data, reason }: ModificationRequest = await req.json();
    
    logger.info('Processing booking modification:', {
      booking_id,
      modification_type,
      reason
    });

    // Initialize Supabase client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get current booking details
    const { data: booking, error: bookingError } = await supabaseService
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Check if booking can be modified
    if (booking.status === 'cancelled') {
      throw new Error('Cannot modify cancelled booking');
    }

    // Calculate modification fees based on booking type and change type
    let modificationFee = 0;
    let feeDescription = '';

    switch (modification_type) {
      case 'date_change':
        modificationFee = booking.booking_type === 'flight' ? 50 : 25;
        feeDescription = 'Date change fee';
        break;
      case 'guest_change':
        modificationFee = 15;
        feeDescription = 'Guest details change fee';
        break;
      case 'room_upgrade':
        // Fee will be calculated based on room price difference
        feeDescription = 'Room upgrade fee';
        break;
      case 'service_addition':
        feeDescription = 'Additional services fee';
        break;
      case 'cancellation':
        modificationFee = booking.total_amount * 0.1; // 10% cancellation fee
        feeDescription = 'Cancellation fee';
        break;
    }

    // Update booking data with modifications
    const updatedBookingData = {
      ...booking.booking_data,
      ...new_data,
      modification_history: [
        ...(booking.booking_data?.modification_history || []),
        {
          timestamp: new Date().toISOString(),
          type: modification_type,
          changes: new_data,
          fee: modificationFee,
          reason: reason || `${modification_type.replace('_', ' ')} requested`
        }
      ]
    };

    // Special handling for different booking types
    if (booking.booking_type === 'hotel') {
      // For hotel bookings, check availability for new dates
      if (modification_type === 'date_change' && new_data.check_in_date && new_data.check_out_date) {
        logger.info('Checking hotel availability for new dates');
        
        const availabilityResponse = await supabaseService.functions.invoke('amadeus-hotel-search', {
          body: {
            cityCode: booking.booking_data?.destination?.code || 'SYD',
            checkInDate: new_data.check_in_date,
            checkOutDate: new_data.check_out_date,
            adults: new_data.guest_count || booking.booking_data?.guests?.adults || 1,
            hotelIds: [booking.booking_data?.hotelId]
          }
        });

        if (availabilityResponse.error) {
          throw new Error('Hotel not available for new dates');
        }
      }
    }

    if (booking.booking_type === 'flight') {
      // For flight bookings, check if new flight segments are available
      if (modification_type === 'date_change' && new_data.flight_segments) {
        logger.info('Validating new flight segments');
        // Add flight availability validation logic here
      }
    }

    // Update booking in database
    const { data: updatedBooking, error: updateError } = await supabaseService
      .from('bookings')
      .update({
        booking_data: updatedBookingData,
        status: modification_type === 'cancellation' ? 'cancelled' : booking.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    // Create modification fee charge if applicable
    if (modificationFee > 0 && modification_type !== 'cancellation') {
      const { error: feeError } = await supabaseService
        .from('booking_fees')
        .insert({
          booking_id,
          fee_type: modification_type,
          amount: modificationFee,
          currency: booking.currency,
          description: feeDescription,
          status: 'pending'
        });

      if (feeError) {
        logger.error('Failed to create modification fee record:', feeError);
      }
    }

    // Create notification for customer
    const { error: notificationError } = await supabaseService
      .from('booking_notifications')
      .insert({
        booking_id,
        type: 'modification_processed',
        title: `Booking Modified - ${booking.booking_reference}`,
        message: `Your ${modification_type.replace('_', ' ')} request has been processed. ${modificationFee > 0 ? `A modification fee of $${modificationFee.toFixed(2)} applies.` : ''}`,
        customer_email: booking.booking_data?.customerInfo?.email,
        status: 'pending'
      });

    if (notificationError) {
      logger.error('Failed to create modification notification:', notificationError);
    }

    logger.info('Booking modification completed successfully');

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking_id,
        reference: booking.booking_reference,
        status: updatedBooking.status,
        modification_fee: modificationFee,
        fee_description: feeDescription
      },
      changes: new_data,
      message: `Booking ${modification_type.replace('_', ' ')} processed successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('Booking modification error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to modify booking'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});