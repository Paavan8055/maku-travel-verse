
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/simpleLogger.ts";

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
  
  logger.info('Amadeus credentials check:', {
    clientIdExists: !!clientId,
    clientSecretExists: !!clientSecret,
    clientIdLength: clientId ? clientId.length : 0
  });
  
  if (!clientId || !clientSecret) {
    logger.error('Amadeus credentials missing:', {
      clientId: clientId ? 'Present' : 'Missing',
      clientSecret: clientSecret ? 'Present' : 'Missing'
    });
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

const getHotelOffers = async (
  accessToken: string, 
  hotelId: string, 
  checkIn: string, 
  checkOut: string, 
  adults: number, 
  children: number, 
  rooms: number, 
  currency: string
): Promise<any> => {
  // Build URL with query parameters for hotel shopping API
  const params = new URLSearchParams({
    hotelIds: hotelId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: adults.toString(),
    roomQuantity: rooms.toString(),
    currency: currency,
  });

  if (children > 0) {
    params.append('children', children.toString());
  }

  const url = `https://test.api.amadeus.com/v3/shopping/hotel-offers?${params.toString()}`;
  logger.info('Amadeus Hotel Offers API call:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Amadeus hotel offers error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      hotelId: hotelId
    });
    throw new Error(`Hotel offers failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  logger.info('Amadeus Hotel Offers API response:', {
    dataExists: !!result.data,
    dataLength: result.data?.length || 0,
    hotelExists: !!result.data?.[0]?.hotel,
    offersCount: result.data?.[0]?.offers?.length || 0,
    available: result.data?.[0]?.available,
    fullResponse: JSON.stringify(result, null, 2)
  });

  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, checkIn, checkOut, adults = 2, children = 0, rooms = 1, currency = 'USD' } = await req.json();

    logger.info('=== Amadeus Hotel Offers Request ===', {
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      currency
    });

    if (!hotelId || !checkIn || !checkOut) {
      throw new Error('Hotel ID, check-in and check-out dates are required');
    }

    const accessToken = await getAmadeusAccessToken();

    const offersData = await getHotelOffers(
      accessToken,
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      currency
    );

    // Handle the response structure - Amadeus returns data as an array
    const hotelData = offersData.data?.[0];
    const hotel = hotelData?.hotel;
    const offers = hotelData?.offers || [];

    // Check if hotel was found
    if (!hotel) {
      logger.info('=== Hotel Not Found ===', {
        hotelId,
        responseStructure: Object.keys(offersData),
        dataExists: !!offersData.data,
        dataLength: offersData.data?.length || 0
      });

      return new Response(JSON.stringify({
        success: false,
        error: `Hotel with ID "${hotelId}" not found or not available`,
        details: {
          hotelId,
          possibleReasons: [
            'Hotel ID may not exist in Amadeus system',
            'Hotel may not be bookable through Amadeus',
            'Hotel may be temporarily unavailable'
          ]
        },
        source: 'amadeus',
        meta: {
          apiProvider: 'Amadeus Hotel Offers',
          searchId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract ancillary services from offers
    const ancillaryServices = [];
    
    // Parse potential add-ons from offer data
    offers.forEach((offer: any) => {
      // Check for breakfast in rate family or room description
      const hasBreakfast = offer.rateFamilyEstimated?.type?.includes('BREAKFAST') || 
                          offer.room?.description?.toLowerCase().includes('breakfast');
      
      if (hasBreakfast && !ancillaryServices.find(s => s.id === 'breakfast')) {
        ancillaryServices.push({
          id: 'breakfast',
          name: 'Continental Breakfast',
          description: 'Daily breakfast buffet for all guests',
          price: 25.00,
          currency: offer.price?.currency || 'USD',
          category: 'meal',
          perNight: true,
          required: false
        });
      }
    });

    // Add standard ancillary services
    const standardAddOns = [
      {
        id: 'parking',
        name: 'Parking',
        description: 'Self-parking at the hotel',
        price: 15.00,
        currency: currency,
        category: 'transport',
        perNight: true,
        required: false
      },
      {
        id: 'wifi',
        name: 'Premium WiFi',
        description: 'High-speed internet access',
        price: 12.00,
        currency: currency,
        category: 'amenity',
        perNight: true,
        required: false
      },
      {
        id: 'late-checkout',
        name: 'Late Check-out',
        description: 'Check out until 2 PM',
        price: 35.00,
        currency: currency,
        category: 'service',
        perNight: false,
        required: false
      }
    ];

    ancillaryServices.push(...standardAddOns);

    // Transform offers to match frontend expectations
    const transformedOffers = offers.map((offer: any) => ({
      id: offer.id,
      checkInDate: offer.checkInDate,
      checkOutDate: offer.checkOutDate,
      rateCode: offer.rateCode,
      rateFamilyEstimated: offer.rateFamilyEstimated,
      room: {
        type: offer.room?.type,
        typeEstimated: offer.room?.typeEstimated,
        description: offer.room?.description,
        capacity: offer.guests?.adults || adults
      },
      guests: offer.guests,
      price: {
        currency: offer.price?.currency,
        base: offer.price?.base,
        total: offer.price?.total,
        taxes: offer.price?.taxes,
        markups: offer.price?.markups,
        variations: offer.price?.variations
      },
      policies: {
        paymentType: offer.policies?.paymentType,
        cancellation: offer.policies?.cancellation,
        guarantee: offer.policies?.guarantee,
        deposit: offer.policies?.deposit
      },
      self: offer.self
    }));

    logger.info(`=== Hotel Offers Complete ===`, {
      hotelId: hotel?.hotelId,
      hotelName: hotel?.name,
      offersFound: transformedOffers.length,
      available: hotelData?.available
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      hotel: {
        hotelId: hotel?.hotelId,
        chainCode: hotel?.chainCode,
        dupeId: hotel?.dupeId,
        name: hotel?.name,
        cityCode: hotel?.cityCode,
        latitude: hotel?.latitude,
        longitude: hotel?.longitude
      },
      offers: transformedOffers,
      ancillaryServices,
      available: hotelData?.available,
      meta: {
        apiProvider: 'Amadeus Hotel Offers',
        searchId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ancillaryServicesCount: ancillaryServices.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('=== Amadeus Hotel Offers Error ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorInstance: error instanceof Error ? 'Error' : 'Other'
    });

    // Enhanced error response with more details for debugging
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      source: 'amadeus',
      details: {
        errorType: error.name || 'UnknownError',
        timestamp: new Date().toISOString(),
        environment: 'production',
        functionName: 'amadeus-hotel-offers'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
