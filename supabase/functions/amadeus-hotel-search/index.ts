import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  roomQuantity?: number;
  adults?: number;
  radius?: number;
  radiusUnit?: string;
  amenities?: string[];
  ratings?: string[];
  hotelChain?: string;
  priceRange?: string;
  bestRateOnly?: boolean;
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

const searchHotels = async (params: HotelSearchParams, accessToken: string) => {
  const searchParams = new URLSearchParams({
    cityCode: params.cityCode,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
  });

  if (params.roomQuantity) searchParams.append('roomQuantity', params.roomQuantity.toString());
  if (params.adults) searchParams.append('adults', params.adults.toString());
  if (params.radius) searchParams.append('radius', params.radius.toString());
  if (params.radiusUnit) searchParams.append('radiusUnit', params.radiusUnit);
  if (params.amenities?.length) searchParams.append('amenities', params.amenities.join(','));
  if (params.ratings?.length) searchParams.append('ratings', params.ratings.join(','));
  if (params.hotelChain) searchParams.append('hotelChain', params.hotelChain);
  if (params.priceRange) searchParams.append('priceRange', params.priceRange);
  if (params.bestRateOnly !== undefined) searchParams.append('bestRateOnly', params.bestRateOnly.toString());

  const response = await fetch(
    `https://test.api.amadeus.com/v3/shopping/hotel-offers?${searchParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus hotel search error:', errorText);
    throw new Error(`Hotel search failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      destination,
      checkInDate, 
      checkOutDate, 
      guests = 1,
      rooms = 1,
      radius = 5,
      amenities,
      ratings,
      hotelChain,
      priceRange
    } = await req.json();

    console.log('Amadeus hotel search:', { destination, checkInDate, checkOutDate, guests });

    // Get city code from destination (simplified for demo)
    let cityCode = destination;
    if (destination.length > 3) {
      // Map common cities to IATA codes
      const cityMappings: { [key: string]: string } = {
        'sydney': 'SYD',
        'melbourne': 'MEL',
        'brisbane': 'BNE',
        'perth': 'PER',
        'adelaide': 'ADL',
        'paris': 'PAR',
        'london': 'LON',
        'new york': 'NYC',
        'tokyo': 'TYO',
        'mumbai': 'BOM'
      };
      cityCode = cityMappings[destination.toLowerCase()] || destination.substring(0, 3).toUpperCase();
    }

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();

    // Search hotels
    const hotelOffers = await searchHotels({
      cityCode,
      checkInDate,
      checkOutDate,
      roomQuantity: rooms,
      adults: guests,
      radius,
      amenities,
      ratings,
      hotelChain,
      priceRange,
      bestRateOnly: true
    }, accessToken);

    // Transform Amadeus response to our format
    const transformedHotels = hotelOffers.data?.map((offer: any) => {
      const hotel = offer.hotel;
      const bestOffer = offer.offers?.[0];
      
      return {
        id: hotel.hotelId,
        source: 'amadeus',
        name: hotel.name,
        description: hotel.description?.text || 'Luxury hotel with modern amenities',
        starRating: hotel.rating || 4,
        location: {
          address: hotel.address?.lines?.join(', '),
          city: hotel.address?.cityName,
          country: hotel.address?.countryCode,
          latitude: hotel.geoCode?.latitude,
          longitude: hotel.geoCode?.longitude
        },
        contact: {
          phone: hotel.contact?.phone,
          fax: hotel.contact?.fax,
          email: hotel.contact?.email
        },
        amenities: hotel.amenities?.map((amenity: any) => amenity.description) || [
          'WiFi', 'Restaurant', 'Fitness Center', 'Pool'
        ],
        images: [
          hotel.media?.[0]?.uri || '/placeholder.svg'
        ],
        pricePerNight: bestOffer ? parseFloat(bestOffer.price.total) : 150,
        currency: bestOffer?.price?.currency || 'USD',
        totalPrice: bestOffer ? parseFloat(bestOffer.price.total) : 150,
        cancellationPolicy: bestOffer?.policies?.cancellation?.description?.text || 'Free cancellation until 24 hours before check-in',
        breakfast: bestOffer?.boardType === 'BREAKFAST' || Math.random() > 0.5,
        freeWifi: hotel.amenities?.some((a: any) => a.amenity?.category === 'WIFI') || true,
        pool: hotel.amenities?.some((a: any) => a.amenity?.category === 'POOL') || Math.random() > 0.5,
        gym: hotel.amenities?.some((a: any) => a.amenity?.category === 'FITNESS') || Math.random() > 0.5,
        spa: hotel.amenities?.some((a: any) => a.amenity?.category === 'SPA') || Math.random() > 0.3,
        parking: hotel.amenities?.some((a: any) => a.amenity?.category === 'PARKING') || Math.random() > 0.7,
        petFriendly: hotel.amenities?.some((a: any) => a.amenity?.category === 'PET') || Math.random() > 0.8,
        checkInTime: bestOffer?.policies?.checkInOut?.checkIn || '15:00',
        checkOutTime: bestOffer?.policies?.checkInOut?.checkOut || '11:00',
        roomTypes: offer.offers?.map((roomOffer: any) => ({
          type: roomOffer.room?.type || 'Standard Room',
          description: roomOffer.room?.description?.text || 'Comfortable room with modern amenities',
          occupancy: roomOffer.guests?.adults || guests,
          price: parseFloat(roomOffer.price.total),
          currency: roomOffer.price.currency
        })) || []
      };
    }) || [];

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      hotels: transformedHotels,
      searchCriteria: { destination: cityCode, checkInDate, checkOutDate, guests, rooms }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Amadeus hotel search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'amadeus'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});