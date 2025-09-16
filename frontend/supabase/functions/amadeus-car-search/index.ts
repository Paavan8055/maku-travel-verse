import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";


interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CarSearchParams {
  pickUpLocationCode: string;
  dropOffLocationCode?: string;
  pickUpDate: string;
  pickUpTime: string;
  dropOffDate: string;
  dropOffTime: string;
  driverAge?: number;
  currencyCode?: string;
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
    throw new Error(`Amadeus auth failed: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
};

const searchCars = async (params: CarSearchParams, accessToken: string) => {
  const searchParams = new URLSearchParams({
    pickUpLocationCode: params.pickUpLocationCode,
    pickUpDate: params.pickUpDate,
    pickUpTime: params.pickUpTime,
    dropOffDate: params.dropOffDate,
    dropOffTime: params.dropOffTime,
  });

  if (params.dropOffLocationCode) {
    searchParams.append('dropOffLocationCode', params.dropOffLocationCode);
  }
  if (params.driverAge) {
    searchParams.append('driverAge', params.driverAge.toString());
  }
  if (params.currencyCode) {
    searchParams.append('currencyCode', params.currencyCode);
  }

  const response = await fetch(`https://test.api.amadeus.com/v1/shopping/car-offers?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Amadeus car search error:', errorText);
    throw new Error(`Car search failed: ${response.statusText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const searchParams: CarSearchParams = await req.json();
    
    logger.info('Searching cars with Amadeus:', searchParams);

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    
    // Search for cars
    const carResults = await searchCars(searchParams, accessToken);
    
    logger.info('Car search successful:', carResults.data?.length || 0, 'offers found');

    // Transform the response to our format
    const cars = carResults.data?.map((offer: any) => ({
      id: offer.id,
      vehicle: {
        category: offer.vehicle?.category,
        description: offer.vehicle?.description,
        imageURL: offer.vehicle?.imageURL,
        seats: offer.vehicle?.seats,
        doors: offer.vehicle?.doors,
        fuelType: offer.vehicle?.fuelType,
        transmission: offer.vehicle?.transmission,
        airConditioning: offer.vehicle?.airConditioning,
        navigationSystem: offer.vehicle?.navigationSystem
      },
      vendor: {
        name: offer.vendor?.name,
        code: offer.vendor?.code,
        logoUrl: offer.vendor?.logoUrl,
        contactNumber: offer.vendor?.contactNumber
      },
      pickUp: {
        location: offer.pickUp?.location,
        address: offer.pickUp?.address,
        coordinates: offer.pickUp?.coordinates,
        dateTime: offer.pickUp?.dateTime
      },
      dropOff: {
        location: offer.dropOff?.location,
        address: offer.dropOff?.address,
        coordinates: offer.dropOff?.coordinates,
        dateTime: offer.dropOff?.dateTime
      },
      price: {
        currency: offer.price?.currency,
        amount: offer.price?.amount,
        convertedAmount: offer.price?.convertedAmount,
        taxes: offer.price?.taxes,
        inclusions: offer.price?.inclusions
      },
      policies: {
        cancellation: offer.policies?.cancellation,
        paymentType: offer.policies?.paymentType,
        guarantee: offer.policies?.guarantee
      },
      extras: offer.extras || []
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      cars: cars,
      searchCriteria: searchParams,
      totalResults: cars.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('Car search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Car search failed',
      cars: [] // Return empty array as fallback
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});