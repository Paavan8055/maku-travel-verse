import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { ApiClient } from "../_shared/apiClient.ts";
import { getAmadeusAccessToken } from "../_shared/amadeus.ts";
import { getSabreAccessToken } from "../_shared/sabre.ts";
import { generateHotelBedsSignature } from "../_shared/hotelbeds.ts";

interface BookingFlowTest {
  test_name: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  details: any;
  error?: string;
}

interface BookingFlowReport {
  overall_status: 'operational' | 'impaired' | 'down';
  timestamp: string;
  tests: BookingFlowTest[];
  success_rate: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const report: BookingFlowReport = {
      overall_status: 'operational',
      timestamp: new Date().toISOString(),
      tests: [],
      success_rate: 0
    };

    // Test 1: Flight Search Flow
    const flightSearchStart = Date.now();
    try {
      const token = await getAmadeusAccessToken();
      const amadeusClient = new ApiClient({
        baseUrl: 'https://test.api.amadeus.com/v2',
        timeout: 15000,
        retries: 2
      });

      const searchParams = {
        originLocationCode: 'SYD',
        destinationLocationCode: 'MEL',
        departureDate: '2025-01-15',
        adults: 1
      };

      const flightResponse = await amadeusClient.get(
        `/shopping/flight-offers?${new URLSearchParams(searchParams)}`,
        { 'Authorization': `Bearer ${token}` }
      );

      report.tests.push({
        test_name: 'Flight Search',
        status: flightResponse.success ? 'passed' : 'failed',
        duration: Date.now() - flightSearchStart,
        details: {
          endpoint: 'flight-offers',
          search_params: searchParams,
          results_count: flightResponse.data?.data?.length || 0
        },
        error: flightResponse.success ? undefined : 'No flight results returned'
      });
    } catch (error) {
      report.tests.push({
        test_name: 'Flight Search',
        status: 'failed',
        duration: Date.now() - flightSearchStart,
        details: { endpoint: 'flight-offers' },
        error: error.message
      });
    }

    // Test 2: Hotel Search Flow
    const hotelSearchStart = Date.now();
    try {
      const { signature, timestamp, apiKey } = await generateHotelBedsSignature('hotel');
      const hotelbedsClient = new ApiClient({
        baseUrl: 'https://api.test.hotelbeds.com/hotel-api/1.0',
        timeout: 15000,
        retries: 2
      });

      const hotelSearchParams = {
        stay: {
          checkIn: '2025-01-15',
          checkOut: '2025-01-17'
        },
        occupancies: [{
          rooms: 1,
          adults: 2,
          children: 0
        }],
        hotels: {
          hotel: [1234] // Test hotel ID
        }
      };

      const hotelResponse = await hotelbedsClient.post('/hotels', hotelSearchParams, {
        'Api-key': apiKey,
        'X-Signature': signature,
        'Content-Type': 'application/json'
      });

      report.tests.push({
        test_name: 'Hotel Search',
        status: hotelResponse.success ? 'passed' : 'warning',
        duration: Date.now() - hotelSearchStart,
        details: {
          endpoint: 'hotels',
          search_params: hotelSearchParams,
          results_count: hotelResponse.data?.hotels?.hotels?.length || 0
        },
        error: hotelResponse.success ? undefined : 'Limited hotel results'
      });
    } catch (error) {
      report.tests.push({
        test_name: 'Hotel Search',
        status: 'failed',
        duration: Date.now() - hotelSearchStart,
        details: { endpoint: 'hotels' },
        error: error.message
      });
    }

    // Test 3: Payment Intent Creation
    const paymentStart = Date.now();
    try {
      const stripeClient = new ApiClient({
        baseUrl: 'https://api.stripe.com/v1',
        timeout: 10000,
        retries: 2
      });

      const paymentData = new URLSearchParams({
        amount: '50000',
        currency: 'aud',
        payment_method_types: 'card',
        description: 'Test booking payment'
      });

      const paymentResponse = await stripeClient.post('/payment_intents', paymentData, {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      report.tests.push({
        test_name: 'Payment Intent Creation',
        status: paymentResponse.success ? 'passed' : 'failed',
        duration: Date.now() - paymentStart,
        details: {
          endpoint: 'payment_intents',
          amount: 50000,
          currency: 'AUD',
          payment_intent_id: paymentResponse.data?.id
        },
        error: paymentResponse.success ? undefined : 'Payment intent creation failed'
      });
    } catch (error) {
      report.tests.push({
        test_name: 'Payment Intent Creation',
        status: 'failed',
        duration: Date.now() - paymentStart,
        details: { endpoint: 'payment_intents' },
        error: error.message
      });
    }

    // Test 4: Database Booking Creation
    const dbBookingStart = Date.now();
    try {
      const testBooking = {
        user_id: '00000000-0000-0000-0000-000000000000', // Test user
        booking_type: 'test',
        status: 'pending',
        total_amount: 500.00,
        currency: 'AUD',
        booking_data: {
          test: true,
          created_by: 'booking-flow-test'
        }
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(testBooking)
        .select()
        .single();

      if (error) throw error;

      // Clean up test booking
      await supabase
        .from('bookings')
        .delete()
        .eq('id', data.id);

      report.tests.push({
        test_name: 'Database Booking Creation',
        status: 'passed',
        duration: Date.now() - dbBookingStart,
        details: {
          table: 'bookings',
          test_booking_id: data.id,
          cleanup: 'completed'
        }
      });
    } catch (error) {
      report.tests.push({
        test_name: 'Database Booking Creation',
        status: 'failed',
        duration: Date.now() - dbBookingStart,
        details: { table: 'bookings' },
        error: error.message
      });
    }

    // Calculate success rate and overall status
    const passedTests = report.tests.filter(t => t.status === 'passed').length;
    const totalTests = report.tests.length;
    report.success_rate = (passedTests / totalTests) * 100;

    const failedTests = report.tests.filter(t => t.status === 'failed').length;
    const warningTests = report.tests.filter(t => t.status === 'warning').length;

    if (failedTests > totalTests / 2) {
      report.overall_status = 'down';
    } else if (failedTests > 0 || warningTests > 0) {
      report.overall_status = 'impaired';
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Booking flow test failed:', error);
    return new Response(JSON.stringify({
      overall_status: 'down',
      error: error.message,
      timestamp: new Date().toISOString(),
      tests: [],
      success_rate: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});