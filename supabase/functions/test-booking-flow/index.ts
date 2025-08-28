import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface TestBookingRequest {
  bookingType: 'flight' | 'hotel' | 'activity';
  useRealProvider: boolean;
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

    const { bookingType, useRealProvider }: TestBookingRequest = await req.json()

    console.log(`🧪 Testing ${bookingType} booking flow (useRealProvider: ${useRealProvider})`)

    // Create test booking data based on type
    const testBookingData = {
      flight: {
        bookingType: 'flight',
        bookingData: {
          offerId: 'test-flight-offer-123',
          offerData: {
            origin: 'SYD',
            destination: 'MEL',
            departureTime: '2025-01-15T10:00:00Z',
            flightNumber: 'QF123',
            airline: 'QF',
            totalPrice: 250,
            currency: 'AUD'
          },
          passengers: [{
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            dateOfBirth: '1990-01-01'
          }],
          customerInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@maku.travel',
            phone: '+61400000000'
          }
        },
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@maku.travel',
          phone: '+61400000000'
        },
        amount: 250,
        currency: 'AUD',
        useRealProvider
      },
      hotel: {
        bookingType: 'hotel',
        bookingData: {
          offerId: 'test-hotel-offer-123',
          offerData: {
            hotelId: 'TEST_HOTEL_001',
            checkIn: '2025-01-15',
            checkOut: '2025-01-17',
            rooms: 1,
            totalPrice: 300,
            currency: 'AUD'
          },
          guests: [{
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com'
          }],
          customerInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@maku.travel',
            phone: '+61400000000'
          }
        },
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@maku.travel',
          phone: '+61400000000'
        },
        amount: 300,
        currency: 'AUD',
        useRealProvider
      },
      activity: {
        bookingType: 'activity',
        bookingData: {
          offerId: 'test-activity-offer-123',
          offerData: {
            activityId: 'TEST_ACTIVITY_001',
            date: '2025-01-15',
            participants: 2,
            totalPrice: 150,
            currency: 'AUD'
          },
          participants: [{
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com'
          }],
          customerInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@maku.travel',
            phone: '+61400000000'
          }
        },
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@maku.travel',
          phone: '+61400000000'
        },
        amount: 150,
        currency: 'AUD',
        useRealProvider
      }
    }

    const bookingRequest = testBookingData[bookingType]

    console.log(`📋 Test booking request:`, JSON.stringify(bookingRequest, null, 2))

    // Call production-booking-manager
    const { data, error } = await supabase.functions.invoke('production-booking-manager', {
      body: bookingRequest
    })

    console.log(`📈 Booking manager response:`, JSON.stringify({ data, error }, null, 2))

    if (error) {
      throw new Error(`Booking manager error: ${error.message}`)
    }

    // Log the complete test result
    await supabase.rpc('log_system_event', {
      p_correlation_id: `test_${Date.now()}`,
      p_service_name: 'test_booking_flow',
      p_log_level: 'INFO',
      p_message: `${bookingType} booking test completed`,
      p_metadata: {
        bookingType,
        useRealProvider,
        success: data?.success,
        bookingId: data?.bookingId,
        confirmationCode: data?.confirmationCode,
        error: data?.error
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        testType: `${bookingType}_booking_flow`,
        useRealProvider,
        result: data,
        message: `${bookingType} booking test completed successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Test booking flow error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Test booking flow failed',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})