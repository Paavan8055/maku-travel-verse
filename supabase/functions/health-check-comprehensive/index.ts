import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getAmadeusAccessToken, validateAmadeusCredentials } from "../_shared/amadeus.ts";
import { getSabreAccessToken, validateSabreCredentials } from "../_shared/sabre.ts";
import { validateHotelBedsCredentials, generateHotelBedsSignature } from "../_shared/hotelbeds.ts";
import { ApiClient } from "../_shared/apiClient.ts";

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'outage';
  response_time: number;
  error?: string;
  details?: any;
}

interface HealthReport {
  overall_status: 'healthy' | 'degraded' | 'outage';
  timestamp: string;
  services: HealthCheckResult[];
  api_endpoints: HealthCheckResult[];
  booking_flow_status: 'operational' | 'impaired' | 'down';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const report: HealthReport = {
      overall_status: 'healthy',
      timestamp: new Date().toISOString(),
      services: [],
      api_endpoints: [],
      booking_flow_status: 'operational'
    };

    // Test Amadeus API
    const amadeusStart = Date.now();
    try {
      if (validateAmadeusCredentials()) {
        const token = await getAmadeusAccessToken();
        const amadeusClient = new ApiClient({
          baseUrl: 'https://test.api.amadeus.com/v2',
          timeout: 10000,
          retries: 1
        });
        
        // Test flight search endpoint
        const flightResponse = await amadeusClient.get('/shopping/flight-offers', {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        report.services.push({
          service: 'Amadeus',
          status: flightResponse.success ? 'healthy' : 'degraded',
          response_time: Date.now() - amadeusStart,
          details: { endpoint: 'flight-offers', authenticated: true }
        });
      } else {
        throw new Error('Amadeus credentials not configured');
      }
    } catch (error) {
      report.services.push({
        service: 'Amadeus',
        status: 'outage',
        response_time: Date.now() - amadeusStart,
        error: error.message
      });
    }

    // Test Sabre API
    const sabreStart = Date.now();
    try {
      if (validateSabreCredentials()) {
        const token = await getSabreAccessToken();
        const sabreClient = new ApiClient({
          baseUrl: 'https://api.test.sabre.com/v1',
          timeout: 10000,
          retries: 1
        });

        // Test availability endpoint
        const sabreResponse = await sabreClient.get('/shop/flights', {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        report.services.push({
          service: 'Sabre',
          status: sabreResponse.success ? 'healthy' : 'degraded',
          response_time: Date.now() - sabreStart,
          details: { endpoint: 'flights', authenticated: true }
        });
      } else {
        throw new Error('Sabre credentials not configured');
      }
    } catch (error) {
      report.services.push({
        service: 'Sabre',
        status: 'outage',
        response_time: Date.now() - sabreStart,
        error: error.message
      });
    }

    // Test HotelBeds API
    const hotelbedsStart = Date.now();
    try {
      if (validateHotelBedsCredentials('hotel')) {
        const { signature, timestamp, apiKey } = await generateHotelBedsSignature('hotel');
        const hotelbedsClient = new ApiClient({
          baseUrl: 'https://api.test.hotelbeds.com/hotel-api/1.0',
          timeout: 10000,
          retries: 1
        });

        // Test hotel search endpoint
        const hotelResponse = await hotelbedsClient.get('/hotels', {
          'Api-key': apiKey,
          'X-Signature': signature,
          'Content-Type': 'application/json'
        });

        report.services.push({
          service: 'HotelBeds',
          status: hotelResponse.success ? 'healthy' : 'degraded',
          response_time: Date.now() - hotelbedsStart,
          details: { endpoint: 'hotels', authenticated: true }
        });
      } else {
        throw new Error('HotelBeds credentials not configured');
      }
    } catch (error) {
      report.services.push({
        service: 'HotelBeds',
        status: 'outage',
        response_time: Date.now() - hotelbedsStart,
        error: error.message
      });
    }

    // Test Stripe API
    const stripeStart = Date.now();
    try {
      const stripeClient = new ApiClient({
        baseUrl: 'https://api.stripe.com/v1',
        timeout: 10000,
        retries: 1
      });

      const stripeResponse = await stripeClient.get('/payment_methods', {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/json'
      });

      report.api_endpoints.push({
        service: 'Stripe',
        status: stripeResponse.success ? 'healthy' : 'degraded',
        response_time: Date.now() - stripeStart,
        details: { endpoint: 'payment_methods', authenticated: true }
      });
    } catch (error) {
      report.api_endpoints.push({
        service: 'Stripe',
        status: 'outage',
        response_time: Date.now() - stripeStart,
        error: error.message
      });
    }

    // Test Database Connection
    const dbStart = Date.now();
    try {
      // Simple query to test DB connectivity
      const { data, error } = await supabase
        .from('bookings')
        .select('count(*)')
        .limit(1);

      if (error) throw error;

      report.api_endpoints.push({
        service: 'Database',
        status: 'healthy',
        response_time: Date.now() - dbStart,
        details: { connection: 'successful' }
      });
    } catch (error) {
      report.api_endpoints.push({
        service: 'Database',
        status: 'outage',
        response_time: Date.now() - dbStart,
        error: error.message
      });
    }

    // Determine overall status
    const allServices = [...report.services, ...report.api_endpoints];
    const outages = allServices.filter(s => s.status === 'outage').length;
    const degraded = allServices.filter(s => s.status === 'degraded').length;

    if (outages > 0) {
      report.overall_status = 'outage';
      report.booking_flow_status = 'down';
    } else if (degraded > 0) {
      report.overall_status = 'degraded';
      report.booking_flow_status = 'impaired';
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      overall_status: 'outage',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});