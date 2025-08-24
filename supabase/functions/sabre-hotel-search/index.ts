import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SabreAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface HotelSearchParams {
  cityCode: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children?: number;
  };
  rooms: number;
  currency?: string;
}

// Get Sabre access token
async function getSabreAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SABRE_CLIENT_ID');
  const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api.sabre.com';

  if (!clientId || !clientSecret) {
    throw new Error('Missing Sabre API credentials');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Sabre auth error:', errorText);
    throw new Error('Failed to authenticate with Sabre API');
  }

  const data: SabreAuthResponse = await response.json();
  return data.access_token;
}

// Search hotels using Sabre API
async function searchHotels(params: HotelSearchParams, accessToken: string): Promise<any> {
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api.sabre.com';
  
  const requestBody = {
    "GetHotelAvailRQ": {
      "SearchCriteria": {
        "OffSet": 1,
        "SortBy": "TotalRate",
        "SortOrder": "ASC",
        "PageSize": 50,
        "TierLabels": false,
        "GeoSearch": {
          "GeoRef": {
            "Radius": 50,
            "UOM": "MI",
            "RefPoint": {
              "Value": params.cityCode,
              "ValueContext": "CODE",
              "RefPointType": "6"
            }
          }
        },
        "RateInfoRef": {
          "ConvertedRateInfoOnly": false,
          "CurrencyCode": params.currency || "USD",
          "BestOnly": "2",
          "PrepaidQualifier": "IncludePrepaid",
          "StayDateTimeRange": {
            "StartDate": params.checkIn,
            "EndDate": params.checkOut
          },
          "Rooms": {
            "Room": Array.from({ length: params.rooms }, () => ({
              "Index": 1,
              "Adults": params.guests.adults,
              "Children": params.guests.children || 0
            }))
          }
        }
      }
    }
  };

  const response = await fetch(`${baseUrl}/v3.0.0/get/hotelavail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Sabre hotel search error:', errorText);
    throw new Error(`Sabre API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Transform Sabre hotel response to standardized format
function transformSabreHotelResponse(sabreData: any): any[] {
  try {
    const hotels: any[] = [];
    
    if (!sabreData?.GetHotelAvailRS?.HotelAvailInfos?.HotelAvailInfo) {
      logger.info('No hotels found in Sabre response');
      return hotels;
    }

    const hotelInfos = Array.isArray(sabreData.GetHotelAvailRS.HotelAvailInfos.HotelAvailInfo) 
      ? sabreData.GetHotelAvailRS.HotelAvailInfos.HotelAvailInfo 
      : [sabreData.GetHotelAvailRS.HotelAvailInfos.HotelAvailInfo];

    for (const hotelInfo of hotelInfos) {
      const hotelData = hotelInfo.HotelInfo || {};
      const rateInfo = hotelInfo.HotelRateInfo?.RateInfos?.RateInfo?.[0] || {};
      const roomRates = rateInfo.RoomRates?.RoomRate || [];
      const firstRoomRate = Array.isArray(roomRates) ? roomRates[0] : roomRates;
      
      const transformedHotel = {
        id: `sabre-${hotelData.HotelCode || Math.random()}`,
        source: 'sabre',
        hotelId: hotelData.HotelCode || 'unknown',
        name: hotelData.HotelName || 'Unknown Hotel',
        chainCode: hotelData.ChainCode || null,
        chainName: hotelData.ChainName || null,
        description: hotelData.Description || 'Hotel description not available',
        address: {
          street: hotelData.LocationDescription || '',
          city: hotelData.LocationDescription?.split(',')?.[0] || '',
          country: hotelData.CountryCode || '',
          postalCode: null,
          coordinates: hotelData.Position ? {
            latitude: parseFloat(hotelData.Position.Latitude || '0'),
            longitude: parseFloat(hotelData.Position.Longitude || '0')
          } : null
        },
        contact: {
          phone: hotelData.ContactNumbers?.ContactNumber?.[0]?.Phone || null,
          fax: null,
          email: null
        },
        starRating: parseInt(hotelData.Award?.Rating || '0'),
        rating: {
          overall: parseFloat(hotelData.Award?.Rating || '0'),
          reviews: 0,
          source: 'sabre'
        },
        images: hotelData.MediaItems?.MediaItem?.map((media: any) => ({
          url: media.ImageItems?.ImageItem?.[0]?.URL || '',
          caption: media.Caption || '',
          category: 'exterior'
        })) || [],
        amenities: hotelData.PropertyAmenity?.map((amenity: any) => amenity.Description || amenity.Code) || [],
        policies: {
          checkIn: rateInfo.CheckInTime || '15:00',
          checkOut: rateInfo.CheckOutTime || '11:00',
          cancellation: rateInfo.CancelPolicy || 'Standard cancellation policy applies',
          petPolicy: null,
          childPolicy: null
        },
        location: {
          distance: hotelData.DirectConnect ? 0 : null,
          transportation: [],
          landmarks: []
        },
        offers: firstRoomRate ? [{
          id: `sabre-offer-${hotelData.HotelCode}-${Math.random()}`,
          roomType: firstRoomRate.RoomTypeCode || 'Standard Room',
          boardType: firstRoomRate.MealPlanCode || 'Room Only',
          refundable: rateInfo.CancelPolicy?.includes('refundable') || false,
          price: {
            total: parseFloat(firstRoomRate.Total?.AmountAfterTax || '0'),
            perNight: parseFloat(firstRoomRate.Total?.AmountAfterTax || '0'),
            currency: firstRoomRate.Total?.CurrencyCode || 'USD',
            breakdown: {
              base: parseFloat(firstRoomRate.Total?.AmountBeforeTax || '0'),
              taxes: parseFloat(firstRoomRate.Total?.Taxes?.Tax?.[0]?.Amount || '0'),
              fees: 0
            }
          },
          cancellationPolicy: rateInfo.CancelPolicy || 'Standard policy',
          availability: {
            available: true,
            roomsLeft: parseInt(firstRoomRate.InventoryAvailable || '1')
          },
          inclusions: [],
          restrictions: []
        }] : [],
        priceRange: firstRoomRate ? {
          min: parseFloat(firstRoomRate.Total?.AmountAfterTax || '0'),
          max: parseFloat(firstRoomRate.Total?.AmountAfterTax || '0'),
          currency: firstRoomRate.Total?.CurrencyCode || 'USD'
        } : {
          min: 0,
          max: 0,
          currency: 'USD'
        }
      };

      hotels.push(transformedHotel);
    }

    return hotels.slice(0, 50); // Limit to 50 results
  } catch (error) {
    logger.error('Error transforming Sabre hotel response:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info('Sabre hotel search request received');
    
    const body = await req.json();
    const {
      cityCode,
      checkIn,
      checkOut,
      guests = { adults: 1 },
      rooms = 1,
      currency = 'USD'
    } = body;

    // Validate required parameters
    if (!cityCode || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: cityCode, checkIn, or checkOut' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logger.info('Getting Sabre access token...');
    const accessToken = await getSabreAccessToken();
    
    logger.info('Searching hotels with Sabre...');
    const searchParams: HotelSearchParams = {
      cityCode,
      checkIn,
      checkOut,
      guests,
      rooms,
      currency
    };

    const sabreData = await searchHotels(searchParams, accessToken);
    logger.info('Sabre hotel data received, transforming...');
    
    const transformedHotels = transformSabreHotelResponse(sabreData);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: transformedHotels,
        source: 'sabre',
        searchCriteria: searchParams,
        resultCount: transformedHotels.length,
        rawData: sabreData // Include for debugging
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    logger.error('Error in sabre-hotel-search:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        source: 'sabre'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});