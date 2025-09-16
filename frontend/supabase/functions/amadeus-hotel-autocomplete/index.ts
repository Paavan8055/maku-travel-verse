import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, subType, countryCode, page } = await req.json();
    console.log('Hotel autocomplete request:', { keyword, subType, countryCode });

    if (!keyword || keyword.length < 2) {
      throw new Error('Keyword must be at least 2 characters long');
    }

    // Get Amadeus credentials
    const amadeusClientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const amadeusClientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');

    if (!amadeusClientId || !amadeusClientSecret) {
      console.warn('Amadeus credentials not configured, using mock data');
      return getMockResponse(keyword);
    }

    try {
      // Get access token
      const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: amadeusClientId,
          client_secret: amadeusClientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Auth failed: ${tokenResponse.status}`);
      }

      const { access_token } = await tokenResponse.json();

      // Build search URL
      const url = new URL('https://test.api.amadeus.com/v1/reference-data/locations/hotel');
      url.searchParams.append('keyword', keyword);
      
      if (subType) {
        subType.forEach((type: string) => url.searchParams.append('subType', type));
      }
      if (countryCode) url.searchParams.append('countryCode', countryCode);
      if (page?.limit) url.searchParams.append('page[limit]', page.limit.toString());

      // Call Amadeus API
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      const locations = (data.data || []).map((location: any) => ({
        id: location.id,
        name: location.name,
        iataCode: location.iataCode,
        subType: location.subType,
        relevance: location.relevance || 0,
        address: location.address ? {
          cityName: location.address.cityName,
          countryName: location.address.countryName,
          countryCode: location.address.countryCode
        } : null,
        geoCode: location.geoCode,
        hotelIds: location.hotelIds || []
      }));

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'amadeus',
          keyword,
          count: locations.length,
          locations,
          meta: {
            timestamp: new Date().toISOString(),
            source: 'amadeus-api'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (amadeusError) {
      console.error('Amadeus API error:', amadeusError);
      return getMockResponse(keyword);
    }

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        locations: [],
        meta: { timestamp: new Date().toISOString(), source: 'error' }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getMockResponse(keyword: string) {
  const mockLocations = [
    {
      id: `MOCK_${keyword.toUpperCase()}_001`,
      name: `${keyword} City Center`,
      iataCode: 'LON',
      subType: 'HOTEL_LEISURE',
      relevance: 95,
      address: {
        cityName: keyword,
        countryName: 'United Kingdom',
        countryCode: 'GB'
      },
      geoCode: {
        latitude: 51.5074,
        longitude: -0.1278
      },
      hotelIds: ['HOTEL_001', 'HOTEL_002']
    },
    {
      id: `MOCK_${keyword.toUpperCase()}_002`,
      name: `${keyword} Downtown`,
      iataCode: 'NYC',
      subType: 'HOTEL_LEISURE',
      relevance: 90,
      address: {
        cityName: keyword,
        countryName: 'United States',
        countryCode: 'US'
      },
      geoCode: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      hotelIds: ['HOTEL_003']
    }
  ];

  return new Response(
    JSON.stringify({
      success: true,
      provider: 'mock',
      keyword,
      count: mockLocations.length,
      locations: mockLocations,
      meta: {
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}