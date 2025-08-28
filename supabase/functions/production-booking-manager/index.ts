import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface BookingRequest {
  bookingType: 'flight' | 'hotel' | 'activity' | 'car';
  bookingData: {
    offerId: string;
    offerData: any;
    passengers?: any[];
    guests?: any[];
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  amount: number;
  currency: string;
  useRealProvider: boolean;
}

interface ProviderBookingResult {
  success: boolean;
  bookingId?: string;
  confirmationCode?: string;
  pnr?: string;
  providerResponse?: any;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData: BookingRequest = await req.json()
    const { bookingType, bookingData, customerInfo, amount, currency, useRealProvider } = requestData

    // Generate unique booking reference
    const bookingReference = `BK${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    const correlationId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`

    console.log(`Processing ${bookingType} booking:`, { bookingReference, correlationId, useRealProvider })

    // Create initial booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_reference: bookingReference,
        booking_type: bookingType,
        status: 'pending',
        total_amount: amount,
        currency: currency,
        booking_data: {
          ...bookingData,
          correlationId,
          useRealProvider
        },
        user_id: null // Guest booking initially
      })
      .select()
      .single()

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`)
    }

    console.log('Booking record created:', booking.id)

    // Attempt provider booking with proper rotation
    let providerResult: ProviderBookingResult = { success: false }

    try {
      if (useRealProvider) {
        providerResult = await createProviderBooking(supabase, bookingType, bookingData, booking.id)
      } else {
        // Demo/test booking - simulate success
        providerResult = {
          success: true,
          confirmationCode: `DEMO_${bookingReference}`,
          pnr: bookingType === 'flight' ? `${Math.random().toString(36).substr(2, 6).toUpperCase()}` : undefined
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (providerError) {
      console.error('Provider booking failed:', providerError)
      providerResult = {
        success: false,
        error: providerError instanceof Error ? providerError.message : 'Provider booking failed'
      }
    }

    // Update booking with provider result
    const finalStatus = providerResult.success ? 'confirmed' : 'failed'
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: finalStatus,
        provider_confirmation_code: providerResult.confirmationCode,
        provider_booking_id: providerResult.bookingId,
        booking_data: {
          ...booking.booking_data,
          providerResponse: providerResult.providerResponse,
          pnr: providerResult.pnr
        }
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Failed to update booking:', updateError)
    }

    // Log booking completion
    await supabase.rpc('log_system_event', {
      p_correlation_id: correlationId,
      p_service_name: 'production_booking_manager',
      p_log_level: providerResult.success ? 'INFO' : 'ERROR',
      p_message: `Booking ${finalStatus}: ${bookingReference}`,
      p_metadata: {
        booking_id: booking.id,
        booking_type: bookingType,
        provider_result: providerResult,
        amount,
        currency
      }
    })

    // Create booking update record for real-time notifications (only for authenticated users)
    if (providerResult.success && booking.user_id) {
      await supabase
        .from('booking_updates')
        .insert({
          booking_id: booking.id,
          booking_reference: bookingReference,
          update_type: 'confirmation',
          title: 'Booking Confirmed',
          message: `Your ${bookingType} booking has been confirmed`,
          status: 'confirmed',
          booking_type: bookingType,
          user_id: booking.user_id,
          metadata: {
            confirmation_code: providerResult.confirmationCode,
            pnr: providerResult.pnr
          }
        })
    }

    return new Response(
      JSON.stringify({
        success: providerResult.success,
        bookingId: booking.id,
        bookingReference,
        confirmationCode: providerResult.confirmationCode,
        pnr: providerResult.pnr,
        status: finalStatus,
        totalAmount: amount,
        currency,
        correlationId,
        error: providerResult.error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: providerResult.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Booking manager error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function createProviderBooking(
  supabase: any,
  bookingType: string,
  bookingData: any,
  bookingId: string
): Promise<ProviderBookingResult> {
  try {
    // Route to appropriate provider function
    const providerFunctions = {
      flight: 'amadeus-flight-booking',
      hotel: 'hotelbeds-booking', 
      activity: 'hotelbeds-booking',
      car: 'amadeus-transfer-booking'
    }

    const functionName = providerFunctions[bookingType as keyof typeof providerFunctions]
    if (!functionName) {
      throw new Error(`No provider function found for booking type: ${bookingType}`)
    }

    console.log(`Calling provider function: ${functionName}`)

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        ...bookingData,
        bookingId
      }
    })

    if (error) {
      throw new Error(`Provider function error: ${error.message}`)
    }

    if (data?.success) {
      // Handle different response formats from providers
      let confirmationCode = data.confirmationCode || data.confirmation;
      let bookingId = data.bookingId || data.providerBookingId;
      
      // Handle amadeus-flight-booking response format
      if (data.booking?.reference && data.booking?.id) {
        confirmationCode = data.booking.reference;
        bookingId = data.booking.id;
      }
      
      // Handle hotelbeds-booking response format  
      if (data.booking?.reference && !data.booking?.id) {
        confirmationCode = data.booking.reference;
        bookingId = data.booking.reference; // HotelBeds uses reference as ID
      }
      
      return {
        success: true,
        bookingId: bookingId,
        confirmationCode: confirmationCode,
        pnr: data.pnr || data.booking?.pnr,
        providerResponse: data
      }
    } else {
      return {
        success: false,
        error: data?.error || 'Provider booking failed'
      }
    }

  } catch (error) {
    console.error('Provider booking error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Provider booking failed'
    }
  }
}