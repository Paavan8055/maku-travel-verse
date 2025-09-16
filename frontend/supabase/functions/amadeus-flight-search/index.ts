import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  includeAirlineCodes?: string[];
  excludeAirlineCodes?: string[];
  nonStop?: boolean;
  currencyCode?: string;
  maxPrice?: number;
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  const baseUrl = Deno.env.get('AMADEUS_BASE_URL') || 'https://test.api.amadeus.com';
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Amadeus access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function searchFlights(params: FlightSearchParams, accessToken: string) {
  const baseUrl = Deno.env.get('AMADEUS_BASE_URL') || 'https://test.api.amadeus.com';
  
  const searchParams = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
  });

  if (params.returnDate) {
    searchParams.append('returnDate', params.returnDate);
  }
  if (params.children) {
    searchParams.append('children', params.children.toString());
  }
  if (params.infants) {
    searchParams.append('infants', params.infants.toString());
  }
  if (params.travelClass) {
    searchParams.append('travelClass', params.travelClass);
  }
  if (params.includeAirlineCodes) {
    searchParams.append('includedAirlineCodes', params.includeAirlineCodes.join(','));
  }
  if (params.excludeAirlineCodes) {
    searchParams.append('excludedAirlineCodes', params.excludeAirlineCodes.join(','));
  }
  if (params.nonStop !== undefined) {
    searchParams.append('nonStop', params.nonStop.toString());
  }
  if (params.currencyCode) {
    searchParams.append('currencyCode', params.currencyCode);
  }
  if (params.maxPrice) {
    searchParams.append('maxPrice', params.maxPrice.toString());
  }

  const response = await fetch(`${baseUrl}/v2/shopping/flight-offers?${searchParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Amadeus flight search failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

function generateMockFlightOffers(params: FlightSearchParams) {
  const airlines = ['BA', 'LH', 'AF', 'KL', 'VS', 'EK'];
  const mockOffers = [];
  
  for (let i = 0; i < 5; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const basePrice = 200 + Math.random() * 800;
    const duration = `PT${Math.floor(2 + Math.random() * 10)}H${Math.floor(Math.random() * 60)}M`;
    
    mockOffers.push({
      type: "flight-offer",
      id: `mock_${i + 1}`,
      source: "GDS",
      instantTicketing: false,
      nonHomogeneous: false,
      oneWay: !params.returnDate,
      lastTicketingDate: "2024-03-15",
      numberOfBookableSeats: Math.floor(1 + Math.random() * 9),
      itineraries: [
        {
          duration: duration,
          segments: [
            {
              departure: {
                iataCode: params.originLocationCode,
                terminal: "1",
                at: `${params.departureDate}T${String(6 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
              },
              arrival: {
                iataCode: params.destinationLocationCode,
                terminal: "2",
                at: `${params.departureDate}T${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
              },
              carrierCode: airline,
              number: `${Math.floor(100 + Math.random() * 8000)}`,
              aircraft: {
                code: "320"
              },
              operating: {
                carrierCode: airline
              },
              duration: duration,
              id: `${i + 1}`,
              numberOfStops: 0,
              blacklistedInEU: false
            }
          ]
        }
      ],
      price: {
        currency: params.currencyCode || "USD",
        total: basePrice.toFixed(2),
        base: (basePrice * 0.8).toFixed(2),
        fees: [
          {
            amount: (basePrice * 0.1).toFixed(2),
            type: "SUPPLIER"
          },
          {
            amount: (basePrice * 0.1).toFixed(2),
            type: "TICKETING"
          }
        ],
        grandTotal: basePrice.toFixed(2)
      },
      pricingOptions: {
        fareType: ["PUBLISHED"],
        includedCheckedBagsOnly: true
      },
      validatingAirlineCodes: [airline],
      travelerPricings: [
        {
          travelerId: "1",
          fareOption: "STANDARD",
          travelerType: "ADULT",
          price: {
            currency: params.currencyCode || "USD",
            total: basePrice.toFixed(2),
            base: (basePrice * 0.8).toFixed(2)
          },
          fareDetailsBySegment: [
            {
              segmentId: `${i + 1}`,
              cabin: params.travelClass || "ECONOMY",
              fareBasis: "UU1YXII",
              class: "U",
              includedCheckedBags: {
                quantity: 1
              }
            }
          ]
        }
      ]
    });
  }

  return {
    meta: {
      count: mockOffers.length,
      links: {
        self: "https://test.api.amadeus.com/v2/shopping/flight-offers"
      }
    },
    data: mockOffers,
    dictionaries: {
      locations: {
        [params.originLocationCode]: {
          cityCode: params.originLocationCode,
          countryCode: "US"
        },
        [params.destinationLocationCode]: {
          cityCode: params.destinationLocationCode,
          countryCode: "GB"
        }
      },
      aircraft: {
        "320": "AIRBUS A320"
      },
      currencies: {
        [params.currencyCode || "USD"]: params.currencyCode || "USD"
      },
      carriers: Object.fromEntries(airlines.map(code => [code, `${code} Airlines`]))
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: FlightSearchParams = await req.json();

    console.log('Flight search request:', {
      origin: params.originLocationCode,
      destination: params.destinationLocationCode,
      departure: params.departureDate,
      return: params.returnDate,
      adults: params.adults
    });

    // Validate required parameters
    if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate || !params.adults) {
      throw new Error('Missing required search parameters');
    }

    // Initialize Supabase client for caching
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let flightData;
    let usedMockData = false;

    try {
      // Try to get Amadeus access token and search
      const accessToken = await getAmadeusAccessToken();
      flightData = await searchFlights(params, accessToken);
      
      console.log('Amadeus flight search successful:', {
        resultCount: flightData.data?.length || 0
      });
    } catch (error) {
      console.warn('Amadeus API failed, using mock data:', error.message);
      flightData = generateMockFlightOffers(params);
      usedMockData = true;
    }

    // Cache the search results
    try {
      const searchKey = `${params.originLocationCode}-${params.destinationLocationCode}-${params.departureDate}-${params.returnDate || 'oneway'}-${params.adults}`;
      const ttlExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes cache

      await supabaseService.rpc('save_flight_search', {
        p_search_key: searchKey,
        p_origin: params.originLocationCode,
        p_destination: params.destinationLocationCode,
        p_departure: params.departureDate,
        p_return: params.returnDate || null,
        p_adults: params.adults,
        p_children: params.children || 0,
        p_infants: params.infants || 0,
        p_cabin: params.travelClass || 'ECONOMY',
        p_currency: params.currencyCode || 'USD',
        p_offers: flightData.data || [],
        p_ttl: ttlExpires.toISOString()
      });
    } catch (cacheError) {
      console.warn('Failed to cache flight search results:', cacheError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      data: flightData.data || [],
      meta: flightData.meta || { count: 0 },
      dictionaries: flightData.dictionaries || {},
      usedMockData,
      searchParams: params
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Flight search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to search flights',
      usedMockData: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});