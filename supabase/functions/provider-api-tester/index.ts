import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  provider: string;
  testData: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { provider, testData }: TestRequest = await req.json();

    // Log the test attempt
    await supabase.from('system_logs').insert({
      correlation_id: crypto.randomUUID(),
      service_name: 'provider-api-tester',
      log_level: 'info',
      message: `Testing provider API: ${provider}`,
      metadata: { provider, testData }
    });

    let result;

    switch (provider) {
      case 'amadeus-flight-search':
        result = await testAmadeusFlights(testData);
        break;
      case 'hotelbeds-hotel-search':
        result = await testHotelBedsHotels(testData);
        break;
      case 'hotelbeds-activity-search':
        result = await testHotelBedsActivities(testData);
        break;
      case 'sabre-availability':
        result = await testSabreAvailability(testData);
        break;
      case 'stripe-test-payment':
        result = await testStripePayment(testData);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    // Log the test result
    await supabase.from('system_logs').insert({
      correlation_id: crypto.randomUUID(),
      service_name: 'provider-api-tester',
      log_level: result.success ? 'info' : 'error',
      message: `Provider test ${result.success ? 'passed' : 'failed'}: ${provider}`,
      metadata: { provider, result }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Provider API test error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function testAmadeusFlights(testData: any) {
  try {
    const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Amadeus credentials not configured');
    }

    // Test authentication endpoint
    const authResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });

    if (!authResponse.ok) {
      throw new Error(`Amadeus auth failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    
    // Test a simple flight offers search
    const searchResponse = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${testData.origin}&destinationLocationCode=${testData.destination}&departureDate=${testData.departureDate}&adults=${testData.adults}&max=5`,
      {
        headers: {
          'Authorization': `Bearer ${authData.access_token}`,
        },
      }
    );

    const searchData = await searchResponse.json();

    return {
      success: searchResponse.ok,
      message: searchResponse.ok ? 'Amadeus API connection successful' : 'Amadeus API search failed',
      data: {
        authenticated: true,
        searchResults: searchData.data?.length || 0,
        offers: searchData.data?.slice(0, 2) || []
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Amadeus test failed: ${error.message}`,
      data: null
    };
  }
}

async function testHotelBedsHotels(testData: any) {
  try {
    const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
    const secret = Deno.env.get('HOTELBEDS_SECRET');
    
    if (!apiKey || !secret) {
      throw new Error('HotelBeds credentials not configured');
    }

    // Generate signature
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);

    const response = await fetch('https://api.test.hotelbeds.com/hotel-api/1.0/hotels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-key': apiKey,
        'X-Signature': signature,
      },
      body: JSON.stringify({
        stay: {
          checkIn: testData.checkIn,
          checkOut: testData.checkOut
        },
        occupancies: [{
          rooms: 1,
          adults: testData.adults,
          children: 0
        }],
        destination: {
          code: testData.cityCode
        }
      })
    });

    const responseData = await response.json();

    return {
      success: response.ok,
      message: response.ok ? 'HotelBeds Hotels API connection successful' : 'HotelBeds Hotels API failed',
      data: {
        hotelsFound: responseData.hotels?.total || 0,
        sampleHotels: responseData.hotels?.hotels?.slice(0, 2) || []
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `HotelBeds Hotels test failed: ${error.message}`,
      data: null
    };
  }
}

async function testHotelBedsActivities(testData: any) {
  try {
    const apiKey = Deno.env.get('HOTELBEDS_ACTIVITY_KEY');
    const secret = Deno.env.get('HOTELBEDS_ACTIVITY_SECRET');
    
    if (!apiKey || !secret) {
      throw new Error('HotelBeds Activities credentials not configured');
    }

    // Generate signature
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);

    const response = await fetch('https://api.test.hotelbeds.com/activity-api/3.0/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-key': apiKey,
        'X-Signature': signature,
      },
      body: JSON.stringify({
        filters: [{
          searchFilterItems: [{
            type: 'destination',
            value: testData.cityCode
          }]
        }],
        from: testData.dateFrom,
        to: testData.dateTo,
        language: 'en'
      })
    });

    const responseData = await response.json();

    return {
      success: response.ok,
      message: response.ok ? 'HotelBeds Activities API connection successful' : 'HotelBeds Activities API failed',
      data: {
        activitiesFound: responseData.activities?.length || 0,
        sampleActivities: responseData.activities?.slice(0, 2) || []
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `HotelBeds Activities test failed: ${error.message}`,
      data: null
    };
  }
}

async function testSabreAvailability(testData: any) {
  try {
    const clientId = Deno.env.get('SABRE_CLIENT_ID');
    const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
    const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api-crt.cert.sabre.com';
    
    if (!clientId || !clientSecret) {
      throw new Error('Sabre credentials not configured');
    }

    // Test authentication
    const authResponse = await fetch(`${baseUrl}/v2/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      throw new Error(`Sabre auth failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();

    // Test a simple availability search
    const availResponse = await fetch(`${baseUrl}/v4/offers/shop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`,
      },
      body: JSON.stringify({
        OTA_AirLowFareSearchRQ: {
          OriginDestinationInformation: [{
            DepartureDateTime: testData.departureDate,
            OriginLocation: { LocationCode: testData.origin },
            DestinationLocation: { LocationCode: testData.destination }
          }],
          TravelPreferences: {
            MaxStopsQuantity: 3
          },
          TravelerInfoSummary: {
            AirTravelerAvail: [{
              PassengerTypeQuantity: [{
                Code: 'ADT',
                Quantity: 1
              }]
            }]
          }
        }
      })
    });

    const availData = await availResponse.json();

    return {
      success: availResponse.ok,
      message: availResponse.ok ? 'Sabre API connection successful' : 'Sabre API search failed',
      data: {
        authenticated: true,
        offersFound: availData.OTA_AirLowFareSearchRS?.PricedItineraries?.length || 0,
        sampleOffers: availData.OTA_AirLowFareSearchRS?.PricedItineraries?.slice(0, 2) || []
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Sabre test failed: ${error.message}`,
      data: null
    };
  }
}

async function testStripePayment(testData: any) {
  try {
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Test creating a payment intent
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `amount=${testData.amount}&currency=${testData.currency}&description=Test payment for API connectivity`
    });

    const responseData = await response.json();

    return {
      success: response.ok,
      message: response.ok ? 'Stripe API connection successful' : 'Stripe API failed',
      data: {
        paymentIntentCreated: response.ok,
        paymentIntentId: responseData.id,
        status: responseData.status
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Stripe test failed: ${error.message}`,
      data: null
    };
  }
}

async function generateHotelBedsSignature(apiKey: string, secret: string, timestamp: number): Promise<string> {
  const message = apiKey + secret + timestamp;
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}