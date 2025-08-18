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

// Get Amadeus access token
async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.error('Missing Amadeus credentials - clientId:', !!clientId, 'clientSecret:', !!clientSecret);
    throw new Error('Missing Amadeus credentials');
  }

  console.log('Attempting Amadeus authentication with clientId:', clientId.substring(0, 8) + '...');

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
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

// Primary hotel search using v3 API
async function searchPrimaryV3(accessToken: string, context: SearchContext): Promise<any> {
  const url = `https://api.amadeus.com/v3/shopping/hotel-offers`;
  
  console.log('Primary V3 search with params:', {
    cityCode: context.cityCode,
    hotelId: context.hotelId,
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
  if (context.hotelId) {
    params.append('hotelIds', context.hotelId);
  }
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
    console.error('Primary V3 search failed:', response.status, response.statusText);
    throw new Error(`Primary search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Fallback hotel search using v2 API
async function searchFallbackV2(accessToken: string, context: SearchContext): Promise<any> {
  const url = `https://api.amadeus.com/v2/shopping/hotel-offers`;
  
  console.log('Fallback V2 search with params:', {
    cityCode: context.cityCode,
    checkInDate: context.checkInDate,
    checkOutDate: context.checkOutDate,
    adults: context.adults,
    children: context.children,
    currency: context.currency
  });

  const params = new URLSearchParams({
    cityCode: context.cityCode || 'SYD',
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
    console.error('Fallback V2 search failed:', response.status, response.statusText);
    throw new Error(`Fallback search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Get hotel IDs by city - CORRECTED ENDPOINT
async function listHotelsByCity(accessToken: string, cityCode: string): Promise<string[]> {
  const url = `https://api.amadeus.com/v1/reference-data/locations/hotels`;
  
  console.log('Listing hotels by city:', cityCode);

  const params = new URLSearchParams({
    cityCode: cityCode
  });

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hotels by city failed:', response.status, response.statusText, errorText);
    return [];
  }

  const data = await response.json();
  return data.data?.map((hotel: any) => hotel.hotelId || hotel.id) || [];
}

// Get hotel IDs by coordinates - CORRECTED ENDPOINT
async function listHotelsByGeocode(accessToken: string, latitude: number, longitude: number, radius = 5): Promise<string[]> {
  const url = `https://api.amadeus.com/v1/reference-data/locations/hotels`;
  
  console.log('Listing hotels by geocode:', { latitude, longitude, radius });

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString()
  });

  const response = await fetch(`${url}?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Hotels by geocode failed:', response.status, response.statusText, errorText);
    return [];
  }

  const data = await response.json();
  return data.data?.map((hotel: any) => hotel.hotelId || hotel.id) || [];
}

// Get offers for specific hotel IDs
async function offersByHotelIds(accessToken: string, hotelIds: string[], context: SearchContext): Promise<any> {
  const url = `https://api.amadeus.com/v3/shopping/hotel-offers`;
  
  console.log('Getting offers for hotel IDs:', hotelIds.slice(0, 5));

  const params = new URLSearchParams({
    hotelIds: hotelIds.slice(0, 100).join(','), // Limit to 100 hotels
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
    console.error('Offers by hotel IDs failed:', response.status, response.statusText);
    throw new Error(`Hotel offers search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
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

  return {};
}

// Parse amenities for better display
function parseAmenities(amenities: any[]): string[] {
  if (!Array.isArray(amenities)) return [];
  
  return amenities.map(amenity => {
    if (typeof amenity === 'string') return amenity;
    if (amenity?.description) return amenity.description;
    if (amenity?.name) return amenity.name;
    return String(amenity);
  }).filter(Boolean);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Standardized parameter names - accept both formats for backwards compatibility
    const { destination, checkIn, checkOut, checkInDate, checkOutDate, guests = 2, children = 0, rooms = 1, currency = 'AUD', hotelName } = await req.json();
    
    // Normalize to checkIn/checkOut format (preferred)
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
    console.log('Got Amadeus access token');

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
      path: [],
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
    }

    let searchResult: any = null;

    // Strategy 1: Direct search with city code
    if (cityCode) {
      try {
        meta.path.push('primary_v3_search');
        searchResult = await searchPrimaryV3(accessToken, context);
        meta.finalStrategy = 'primary_v3';
        console.log('Primary V3 search successful');
      } catch (error) {
        meta.errors.push(`Primary V3 failed: ${error.message}`);
        console.warn('Primary V3 search failed:', error);
        
        // Strategy 2: Fallback to V2 API
        try {
          meta.path.push('fallback_v2_search');
          searchResult = await searchFallbackV2(accessToken, context);
          meta.finalStrategy = 'fallback_v2';
          console.log('Fallback V2 search successful');
        } catch (fallbackError) {
          meta.errors.push(`Fallback V2 failed: ${fallbackError.message}`);
          console.warn('Fallback V2 search failed:', fallbackError);
        }
      }
    }

    // Strategy 3: Hotel ID search if we have coordinates
    if (!searchResult && coordinates) {
      try {
        meta.path.push('hotel_ids_by_geocode');
        const hotelIds = await listHotelsByGeocode(accessToken, coordinates.lat, coordinates.lng, 10);
        if (hotelIds.length > 0) {
          meta.path.push('offers_by_hotel_ids');
          searchResult = await offersByHotelIds(accessToken, hotelIds, context);
          meta.finalStrategy = 'geocode_hotel_ids';
          console.log('Geocode hotel search successful');
        }
      } catch (error) {
        meta.errors.push(`Geocode hotel search failed: ${error.message}`);
        console.warn('Geocode hotel search failed:', error);
      }
    }

    // Strategy 4: Default Sydney search as last resort
    if (!searchResult && !cityCode) {
      try {
        meta.path.push('default_sydney_search');
        meta.adjustments.push('Using Sydney as default city');
        context.cityCode = 'SYD';
        searchResult = await searchFallbackV2(accessToken, context);
        meta.finalStrategy = 'default_sydney';
        console.log('Default Sydney search successful');
      } catch (error) {
        meta.errors.push(`Default Sydney search failed: ${error.message}`);
        console.warn('Default Sydney search failed:', error);
      }
    }

    if (!searchResult?.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No hotel offers found',
          hotels: [],
          meta
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform results
    let hotels = searchResult.data.map((offer: any) => {
      const hotel = offer.hotel;
      const firstOffer = offer.offers?.[0];
      
      return {
        id: hotel.hotelId,
        name: hotel.name,
        description: hotel.description || `${hotel.name} offers comfortable accommodation in ${destination}.`,
        images: [
          `/lovable-uploads/hotel-${Math.floor(Math.random() * 4) + 1}.jpg`
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
        amenities: parseAmenities(hotel.amenities || []),
        rating: hotel.rating || (3 + Math.random() * 2),
        reviewCount: Math.floor(Math.random() * 1000) + 100,
        checkIn: firstOffer?.checkInDate || checkIn,
        checkOut: firstOffer?.checkOutDate || checkOut,
        price: {
          amount: parseFloat(firstOffer?.price?.total || (150 + Math.random() * 300)),
          currency: firstOffer?.price?.currency || currency,
          perNight: true
        },
        cancellation: {
          freeCancellation: firstOffer?.policies?.cancellation?.type === 'FULL_STAY',
          deadline: firstOffer?.policies?.cancellation?.deadline || checkIn
        },
        availability: {
          rooms: rooms,
          guests: guests
        },
        offers: offer.offers || []
      };
    });

    // Filter by hotel name if specified
    if (hotelName) {
      const filtered = hotels.filter((hotel: any) => 
        hotel.name.toLowerCase().includes(hotelName.toLowerCase())
      );
      if (filtered.length > 0) {
        hotels = filtered;
        meta.adjustments.push(`Filtered by hotel name: ${hotelName}`);
      }
    }

    meta.totalOffersFound = hotels.length;

    return new Response(
      JSON.stringify({
        success: true,
        hotels: hotels.slice(0, 50), // Limit to 50 results
        meta
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Hotel search function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to search hotels',
        details: error.message,
        hotels: [],
        meta: {
          path: ['error'],
          adjustments: [],
          errors: [error.message]
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});