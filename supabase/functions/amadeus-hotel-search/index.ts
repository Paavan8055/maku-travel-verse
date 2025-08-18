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

interface SearchMeta {
  path: string[];
  adjustments: string[];
  errors: string[];
  finalStrategy?: string;
  totalOffersFound?: number;
}

// Get Amadeus access token with enhanced error handling
async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.error('Missing Amadeus credentials - clientId:', !!clientId, 'clientSecret:', !!clientSecret);
    throw new Error('Missing Amadeus credentials');
  }

  console.log('Attempting Amadeus authentication with clientId:', clientId.substring(0, 8) + '...');

  try {
    const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
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
      console.error('Amadeus auth failed:', response.status, response.statusText, errorText);
      throw new Error(`Failed to get access token: ${response.statusText} - ${errorText}`);
    }

    const data: AmadeusAuthResponse = await response.json();
    console.log('Successfully authenticated with Amadeus');
    return data.access_token;
  } catch (error) {
    console.error('Amadeus authentication error:', error);
    throw error;
  }
}

// Enhanced hotel search using correct Amadeus endpoints
async function searchHotels(accessToken: string, context: SearchContext): Promise<any> {
  const url = `https://api.amadeus.com/v3/shopping/hotel-offers`;
  
  console.log('Searching hotels with params:', {
    cityCode: context.cityCode,
    checkInDate: context.checkInDate,
    checkOutDate: context.checkOutDate,
    adults: context.adults,
    children: context.children,
    currency: context.currency
  });

  const params = new URLSearchParams({
    checkInDate: context.checkInDate,
    checkOutDate: context.checkOutDate,
    adults: context.adults.toString(),
    roomQuantity: context.roomQuantity.toString(),
    currency: context.currency
  });

  if (context.cityCode) {
    params.append('cityCode', context.cityCode);
  }
  if (context.children > 0) {
    params.append('children', context.children.toString());
  }

  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hotel search failed:', response.status, response.statusText, errorText);
      throw new Error(`Hotel search failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Hotel search successful, found', data.data?.length || 0, 'hotels');
    return data;
  } catch (error) {
    console.error('Hotel search error:', error);
    throw error;
  }
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
    'las vegas': 'LAS',
    'hilton': 'SYD', // Default Hilton search to Sydney
    'marriott': 'SYD',
    'hyatt': 'SYD'
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
      `https://api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(destination)}&subType=CITY`,
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, checkIn, checkOut, checkInDate, checkOutDate, guests = 2, children = 0, rooms = 1, currency = 'AUD', hotelName } = await req.json();
    
    // Normalize to checkIn/checkOut format
    const normalizedCheckIn = checkIn || checkInDate;
    const normalizedCheckOut = checkOut || checkOutDate;
    
    if (!destination || !normalizedCheckIn || !normalizedCheckOut) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: destination, check-in date, and check-out date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Hotel search request:', { destination, checkIn: normalizedCheckIn, checkOut: normalizedCheckOut, guests, children, rooms, currency, hotelName });

    // Get access token
    const accessToken = await getAmadeusAccessToken();

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

    const meta: SearchMeta = {
      path: ['hotel_search_start'],
      adjustments: [],
      errors: []
    };

    // Resolve destination to city code
    const { cityCode, coordinates } = await resolveCity(destination, accessToken);
    context.cityCode = cityCode;
    context.coordinates = coordinates;
    
    if (cityCode) {
      meta.path.push(`resolved_city:${cityCode}`);
    } else {
      meta.errors.push('Could not resolve destination to city code');
      context.cityCode = 'SYD'; // Fallback to Sydney
    }

    // Search for hotels
    let searchResult: any = null;
    try {
      meta.path.push('hotel_search_api');
      searchResult = await searchHotels(accessToken, context);
      meta.finalStrategy = 'amadeus_v3';
      meta.totalOffersFound = searchResult.data?.length || 0;
    } catch (error) {
      meta.errors.push(`Hotel search failed: ${error.message}`);
      console.error('Hotel search failed:', error);
    }

    if (!searchResult?.data || searchResult.data.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No hotel offers found for this destination and dates',
          hotels: [],
          meta,
          message: 'Try different dates or a nearby location'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform results to match frontend interface
    const hotels = searchResult.data.map((offer: any) => {
      const hotel = offer.hotel;
      const firstOffer = offer.offers?.[0];
      const price = firstOffer?.price;
      
      return {
        id: hotel.hotelId,
        name: hotel.name,
        description: hotel.description || `${hotel.name} offers comfortable accommodation in ${destination}.`,
        images: [
          `/assets/hotel-${Math.floor(Math.random() * 4) + 1}.jpg` // Use existing hotel images
        ],
        address: {
          street: hotel.address?.lines?.join(', ') || '',
          city: hotel.address?.cityName || destination,
          country: hotel.address?.countryCode || 'AU',
          postalCode: hotel.address?.postalCode || ''
        },
        coordinates: hotel.latitude && hotel.longitude ? {
          lat: parseFloat(hotel.latitude),
          lng: parseFloat(hotel.longitude)
        } : coordinates,
        amenities: hotel.amenities?.map((a: any) => a.description || a.name || a) || ['WiFi', 'Parking'],
        starRating: parseInt(hotel.rating) || 4,
        rating: 4.2 + Math.random() * 0.6, // Mock guest rating
        reviewCount: Math.floor(Math.random() * 1000) + 100,
        pricePerNight: parseFloat(price?.total || (150 + Math.random() * 300)),
        currency: price?.currency || currency,
        propertyType: hotel.type || 'Hotel',
        distanceFromCenter: Math.random() * 10, // Mock distance
        checkIn: normalizedCheckIn,
        checkOut: normalizedCheckOut,
        cancellation: {
          freeCancellation: firstOffer?.policies?.cancellation?.type === 'FULL_STAY',
          deadline: firstOffer?.policies?.cancellation?.deadline || normalizedCheckIn
        },
        availability: {
          rooms: rooms,
          guests: guests
        },
        offers: offer.offers || [],
        // Add booking data for room selection
        hotelOfferId: firstOffer?.id,
        amadeus: {
          hotelId: hotel.hotelId,
          chainCode: hotel.chainCode,
          offers: offer.offers
        }
      };
    });

    // Filter by hotel name if specified
    let filteredHotels = hotels;
    if (hotelName) {
      filteredHotels = hotels.filter((hotel: any) => 
        hotel.name.toLowerCase().includes(hotelName.toLowerCase())
      );
      meta.adjustments.push(`Filtered by hotel name: ${hotelName}`);
    }

    // Sort by price
    filteredHotels.sort((a: any, b: any) => a.pricePerNight - b.pricePerNight);

    console.log(`Successfully found ${filteredHotels.length} hotels for ${destination}`);

    return new Response(
      JSON.stringify({
        success: true,
        hotels: filteredHotels,
        meta,
        searchContext: context
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Hotel search function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        hotels: [],
        meta: {
          path: ['error'],
          errors: [error.message || 'Unknown error'],
          adjustments: []
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});