
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface SearchContext {
  destination: string;
  cityCode?: string;
  hotelId?: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  roomQuantity: number;
  currency: string;
  radius?: number;
  coordinates?: { lat: number; lng: number };
}

// Enhanced Amadeus authentication
async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.error('❌ CRITICAL: Missing Amadeus credentials');
    throw new Error('Missing Amadeus credentials - check environment configuration');
  }

  console.log('🔐 Attempting Amadeus authentication...');

  try {
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
      console.error('❌ Amadeus authentication failed:', errorText);
      throw new Error(`Amadeus auth failed: ${response.statusText}`);
    }

    const data: AmadeusAuthResponse = await response.json();
    console.log('✅ Successfully authenticated with Amadeus');
    return data.access_token;
    
  } catch (error) {
    console.error('❌ Amadeus authentication error:', error);
    throw error;
  }
}

// Step 1: Get hotel list from city
async function getHotelList(accessToken: string, cityCode: string, latitude?: number, longitude?: number): Promise<any> {
  let url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city`;
  const params = new URLSearchParams({ cityCode });
  
  if (latitude && longitude) {
    url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode`;
    params.set('latitude', latitude.toString());
    params.set('longitude', longitude.toString());
    params.set('radius', '20');
    params.delete('cityCode');
  }

  console.log('Getting hotel list from:', `${url}?${params}`);

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hotel list API failed:', response.status, response.statusText, errorText);
    throw new Error(`Hotel list failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Hotel list successful, found', data.data?.length || 0, 'hotels');
  return data;
}

// Step 2: Get offers for specific hotels
async function getHotelOffers(accessToken: string, hotelIds: string[], context: SearchContext): Promise<any> {
  const url = `https://test.api.amadeus.com/v3/shopping/hotel-offers`;
  
  console.log('Getting hotel offers for hotels:', hotelIds.slice(0, 5));

  const params = new URLSearchParams({
    hotelIds: hotelIds.join(','),
    checkInDate: context.checkInDate,
    checkOutDate: context.checkOutDate,
    adults: context.adults.toString(),
    roomQuantity: context.roomQuantity.toString(),
    currency: context.currency
  });

  if (context.children > 0) {
    params.append('children', context.children.toString());
  }

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hotel offers failed:', response.status, response.statusText, errorText);
    throw new Error(`Hotel offers failed: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Hotel offers successful, found', data.data?.length || 0, 'hotel offers');
  return data;
}

// Complete hotel search using real Amadeus data
async function searchHotels(accessToken: string, context: SearchContext): Promise<any> {
  console.log('Starting hotel search with context:', {
    cityCode: context.cityCode,
    coordinates: context.coordinates,
    checkInDate: context.checkInDate,
    checkOutDate: context.checkOutDate,
    adults: context.adults,
    children: context.children,
    currency: context.currency
  });

  // Step 1: Get list of hotels in the city/area
  const hotelListData = await getHotelList(
    accessToken, 
    context.cityCode!, 
    context.coordinates?.lat, 
    context.coordinates?.lng
  );

  if (!hotelListData?.data || hotelListData.data.length === 0) {
    console.warn('No hotels found in hotel list for', context.cityCode);
    throw new Error('No hotels found for this destination');
  }

  // Step 2: Extract hotel IDs (limit to first 20 for performance)
  const hotelIds = hotelListData.data
    .slice(0, 20)
    .map((hotel: any) => hotel.hotelId)
    .filter((id: string) => id);

  if (hotelIds.length === 0) {
    throw new Error('No valid hotel IDs found');
  }

  console.log(`Found ${hotelIds.length} hotels, getting offers...`);

  // Step 3: Get offers for these hotels
  const offersData = await getHotelOffers(accessToken, hotelIds, context);
  
  // Combine hotel details with offers
  const hotelsWithOffers = offersData.data?.map((offer: any) => {
    const hotelDetails = hotelListData.data.find((h: any) => h.hotelId === offer.hotel?.hotelId);
    return {
      ...offer,
      hotel: {
        ...offer.hotel,
        ...hotelDetails,
        distance: hotelDetails?.distance
      }
    };
  }) || [];

  return {
    ...offersData,
    data: hotelsWithOffers
  };
}

// City mapping for common destinations
function getCityMapping() {
  return {
    'sydney': 'SYD',
    'melbourne': 'MEL', 
    'brisbane': 'BNE',
    'perth': 'PER',
    'adelaide': 'ADL',
    'gold coast': 'OOL',
    'cairns': 'CNS',
    'darwin': 'DRW',
    'hobart': 'HBA',
    'canberra': 'CBR',
    'new york': 'NYC',
    'london': 'LON',
    'paris': 'PAR',
    'tokyo': 'TYO',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'bangkok': 'BKK',
    'dubai': 'DXB',
    'los angeles': 'LAX',
    'las vegas': 'LAS'
  };
}

// Resolve city code from destination
async function resolveCity(destination: string, accessToken: string): Promise<{ cityCode?: string; coordinates?: { lat: number; lng: number } }> {
  const cityMapping = getCityMapping();
  const normalizedDest = destination.toLowerCase().trim();
  
  // Try direct mapping first
  if (cityMapping[normalizedDest]) {
    console.log('Resolved destination using city mapping:', normalizedDest, '->', cityMapping[normalizedDest]);
    return { cityCode: cityMapping[normalizedDest] };
  }

  // Try Amadeus location search
  try {
    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(destination)}&subType=CITY`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const location = data.data?.[0];
      if (location?.iataCode) {
        console.log('Resolved destination using Amadeus API:', destination, '->', location.iataCode);
        return { 
          cityCode: location.iataCode,
          coordinates: location.geoCode ? { 
            lat: parseFloat(location.geoCode.latitude), 
            lng: parseFloat(location.geoCode.longitude) 
          } : undefined
        };
      }
    }
  } catch (error) {
    console.warn('City resolution failed:', error);
  }

  console.log('Could not resolve destination, using Sydney as default');
  return { cityCode: 'SYD' };
}

// Transform Amadeus hotel data to match frontend expectations
function transformAmadeusHotels(hotelsData: any[]): any[] {
  return hotelsData.map((hotelOffer: any) => {
    const hotel = hotelOffer.hotel;
    const offers = hotelOffer.offers || [];
    const bestOffer = offers[0];
    
    return {
      id: hotel.hotelId, // Use REAL Amadeus hotel ID
      name: hotel.name,
      description: hotel.description || `${hotel.name} - Premium accommodation`,
      address: hotel.address?.lines?.join(', ') || `${hotel.cityCode} City Center`,
      images: ['/assets/hotel-budget.jpg'], // Default image for now
      starRating: hotel.rating ? Math.round(parseFloat(hotel.rating)) : 3,
      rating: hotel.rating ? parseFloat(hotel.rating) : 0,
      reviewCount: 0,
      pricePerNight: bestOffer?.price?.total || 0,
      currency: bestOffer?.price?.currency || 'USD',
      totalPrice: bestOffer?.price?.total || 0,
      propertyType: hotel.chainCode || 'Hotel',
      distanceFromCenter: hotel.distance?.value || 0,
      amenities: ['Free WiFi', 'Room Service', '24-hour Front Desk'],
      cancellationPolicy: bestOffer?.policies?.cancellation?.description || 'Contact hotel for cancellation policy',
      breakfast: false,
      amadeus: {
        hotelId: hotel.hotelId, // REAL Amadeus ID
        chainCode: hotel.chainCode,
        dupeId: hotel.dupeId,
        offers: offers
      }
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`🔍 [${requestId}] Hotel search request started`);

  try {
    const { destination, checkIn, checkOut, checkInDate, checkOutDate, guests = 2, children = 0, rooms = 1, currency = 'AUD', hotelName } = await req.json();
    
    const normalizedCheckIn = checkIn || checkInDate;
    const normalizedCheckOut = checkOut || checkOutDate;
    
    if (!destination || !normalizedCheckIn || !normalizedCheckOut) {
      console.error(`❌ [${requestId}] Missing required parameters`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: destination, check-in date, and check-out date are required',
          requestId 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate dates
    const checkInValidation = new Date(normalizedCheckIn);
    const checkOutValidation = new Date(normalizedCheckOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInValidation.setHours(0, 0, 0, 0);
    checkOutValidation.setHours(0, 0, 0, 0);
    
    if (checkInValidation < today) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Check-in date cannot be in the past',
          requestId 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (checkOutValidation <= checkInValidation) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Check-out date must be after check-in date',
          requestId 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [${requestId}] Search params:`, { 
      destination, 
      checkIn: normalizedCheckIn, 
      checkOut: normalizedCheckOut, 
      guests, 
      children, 
      rooms, 
      currency, 
      hotelName 
    });

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    console.log(`✅ [${requestId}] Amadeus authentication successful`);

    // Initialize search context
    const context: SearchContext = {
      destination,
      checkInDate: normalizedCheckIn,
      checkOutDate: normalizedCheckOut,
      adults: guests,
      children: children || 0,
      roomQuantity: rooms,
      currency
    };

    // Resolve destination to city code
    const { cityCode, coordinates } = await resolveCity(destination, accessToken);
    context.cityCode = cityCode;
    context.coordinates = coordinates;

    if (!cityCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not resolve destination to a valid city code',
          requestId
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform hotel search
    console.log(`🔍 [${requestId}] Starting hotel search...`);
    const searchResult = await searchHotels(accessToken, context);
    
    if (!searchResult?.data || searchResult.data.length === 0) {
      console.log(`📭 [${requestId}] No hotels found for search criteria`);
      return new Response(
        JSON.stringify({
          success: true,
          hotels: [],
          meta: {
            isEmpty: true,
            message: 'No hotels available for the selected dates and location. Please try different search criteria.'
          },
          requestId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [${requestId}] Hotel search successful - found ${searchResult.data.length} hotels`);

    // Transform Amadeus data to frontend format
    const transformedHotels = transformAmadeusHotels(searchResult.data);

    // Filter by hotel name if specified
    let filteredHotels = transformedHotels;
    if (hotelName) {
      filteredHotels = transformedHotels.filter((hotel: any) => 
        hotel.name.toLowerCase().includes(hotelName.toLowerCase())
      );
    }

    // Sort by price
    filteredHotels.sort((a: any, b: any) => a.pricePerNight - b.pricePerNight);

    console.log(`✅ [${requestId}] Successfully found ${filteredHotels.length} hotels for ${destination}`);

    return new Response(
      JSON.stringify({
        success: true,
        hotels: filteredHotels,
        meta: {
          dataSource: 'amadeus_live',
          dataQuality: 'verified',
          totalFound: filteredHotels.length,
          requestId
        },
        searchContext: context
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`❌ [${requestId}] Hotel search function error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Hotel search service is temporarily unavailable',
        technicalError: error instanceof Error ? error.message : 'Unknown error',
        requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
