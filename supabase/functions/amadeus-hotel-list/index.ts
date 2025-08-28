import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const getAmadeusAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
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
    const errorText = await response.text();
    logger.error('Amadeus auth failed:', errorText);
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const getHotelList = async (params: any, accessToken: string) => {
  const searchParams = new URLSearchParams();
  
  if (params.cityCode) searchParams.append('cityCode', params.cityCode);
  if (params.latitude && params.longitude) {
    searchParams.append('latitude', params.latitude.toString());
    searchParams.append('longitude', params.longitude.toString());
  }
  if (params.radius) searchParams.append('radius', params.radius.toString());
  if (params.radiusUnit) searchParams.append('radiusUnit', params.radiusUnit);
  if (params.chainCodes) searchParams.append('chainCodes', params.chainCodes);
  if (params.amenities) searchParams.append('amenities', params.amenities);
  if (params.ratings) searchParams.append('ratings', params.ratings);

  logger.info('Amadeus Hotel List API call:', `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?${searchParams}`);

  const response = await fetch(
    `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?${searchParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Amadeus hotel list error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      params: params
    });
    throw new Error(`Hotel list failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  logger.info('Amadeus Hotel List API response:', {
    dataCount: result.data?.length || 0,
    meta: result.meta
  });

  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      cityCode,
      latitude,
      longitude,
      radius = 5,
      radiusUnit = 'KM',
      chainCodes,
      amenities,
      ratings
    } = await req.json();

    logger.info('=== Amadeus Hotel List Request ===', {
      cityCode,
      latitude,
      longitude,
      radius
    });

    if (!cityCode && (!latitude || !longitude)) {
      throw new Error('Either cityCode or latitude/longitude coordinates are required');
    }

    const accessToken = await getAmadeusAccessToken();

    const hotelList = await getHotelList({
      cityCode,
      latitude,
      longitude,
      radius,
      radiusUnit,
      chainCodes,
      amenities,
      ratings
    }, accessToken);

    const transformedHotels = hotelList.data?.map((hotel: any) => ({
      id: hotel.hotelId,
      source: 'amadeus',
      name: hotel.name,
      chainCode: hotel.chainCode,
      iataCode: hotel.iataCode,
      location: {
        latitude: hotel.geoCode?.latitude,
        longitude: hotel.geoCode?.longitude,
        address: hotel.address?.lines?.join(', '),
        city: hotel.address?.cityName,
        country: hotel.address?.countryCode,
        postalCode: hotel.address?.postalCode,
        stateCode: hotel.address?.stateCode
      },
      distance: hotel.distance ? {
        value: hotel.distance.value,
        unit: hotel.distance.unit
      } : null,
      lastUpdate: hotel.lastUpdate
    })) || [];

    logger.info(`=== Hotel List Complete ===`, {
      hotelsFound: transformedHotels.length,
      searchSuccess: true
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      hotels: transformedHotels,
      searchCriteria: { cityCode, latitude, longitude, radius },
      meta: {
        totalResults: transformedHotels.length,
        apiProvider: 'Amadeus Hotel List',
        searchId: crypto.randomUUID()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('=== Amadeus Hotel List Error ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'amadeus',
      details: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});