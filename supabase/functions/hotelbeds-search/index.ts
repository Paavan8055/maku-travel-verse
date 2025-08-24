import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
}

const generateHotelBedsSignature = async (apiKey: string, secret: string, timestamp: number): Promise<string> => {
  const stringToSign = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const searchHotels = async (params: HotelSearchParams) => {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET');
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateHotelBedsSignature(apiKey, secret, timestamp);

  const requestBody = {
    stay: {
      checkIn: params.checkIn,
      checkOut: params.checkOut
    },
    occupancies: [
      {
        rooms: params.rooms || 1,
        adults: params.adults,
        children: params.children || 0
      }
    ],
    destination: {
      code: params.destination // This should be a destination code
    },
    filter: {
      maxHotels: 50
    }
  };

  const response = await fetch('https://api.test.hotelbeds.com/hotel-api/1.0/hotels', {
    method: 'POST',
    headers: {
      'Api-key': apiKey,
      'X-Signature': signature,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`HotelBeds search failed: ${response.statusText}`);
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
      checkIn, 
      checkOut, 
      guests = 2, 
      rooms = 1 
    } = await req.json();

    logger.info('HotelBeds hotel search:', { destination, checkIn, checkOut, guests, rooms });

    // Enhanced destination code mapping
    const getCityMapping = () => {
      return {
        // Major cities
        'sydney': 'SYD',
        'melbourne': 'MEL',
        'brisbane': 'BNE',
        'perth': 'PER',
        'adelaide': 'ADL',
        'canberra': 'CBR',
        'paris': 'PAR',
        'london': 'LON',
        'new york': 'NYC',
        'tokyo': 'TYO',
        'singapore': 'SIN',
        'hong kong': 'HKG',
        'bangkok': 'BKK',
        'dubai': 'DXB',
        'bali': 'DPS',
        'jakarta': 'CGK',
        'kuala lumpur': 'KUL',
        'manila': 'MNL',
        'delhi': 'DEL',
        'mumbai': 'BOM',
        'istanbul': 'IST',
        'rome': 'ROM',
        'madrid': 'MAD',
        'barcelona': 'BCN',
        'amsterdam': 'AMS',
        'frankfurt': 'FRA',
        'zurich': 'ZUR',
        'vienna': 'VIE',
        'prague': 'PRG',
        'budapest': 'BUD',
        'warsaw': 'WAW',
        'stockholm': 'STO',
        'oslo': 'OSL',
        'copenhagen': 'CPH',
        'helsinki': 'HEL',
        'moscow': 'MOW',
        'cairo': 'CAI',
        'johannesburg': 'JNB',
        'cape town': 'CPT',
        'casablanca': 'CAS',
        'nairobi': 'NBO',
        'los angeles': 'LAX',
        'san francisco': 'SFO',
        'chicago': 'CHI',
        'miami': 'MIA',
        'las vegas': 'LAS',
        'toronto': 'YYZ',
        'vancouver': 'YVR',
        'montreal': 'YUL',
        'mexico city': 'MEX',
        'rio de janeiro': 'RIO',
        'sao paulo': 'SAO',
        'buenos aires': 'BUE',
        'lima': 'LIM',
        'bogota': 'BOG',
        'santiago': 'SCL'
      };
    };

    const cityMapping = getCityMapping();
    const destCode = cityMapping[destination.toLowerCase()];
    
    if (!destCode) {
      logger.warn('Destination not found in mapping:', destination);
      return new Response(JSON.stringify({
        success: false,
        error: `Destination "${destination}" is not supported. Please try a major city.`,
        source: 'hotelbeds',
        supportedDestinations: Object.keys(cityMapping).slice(0, 20) // Show some examples
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const hotelResults = await searchHotels({
      destination: destCode,
      checkIn,
      checkOut,
      adults: guests,
      rooms
    });

    // Check if hotelResults has the expected structure
    if (!hotelResults || !hotelResults.hotels || !Array.isArray(hotelResults.hotels)) {
      logger.warn('No hotels found in HotelBeds response or invalid structure:', hotelResults);
      return new Response(JSON.stringify({
        success: true,
        source: 'hotelbeds',
        hotels: [],
        searchCriteria: { destination, checkIn, checkOut, guests, rooms },
        message: 'No hotels found for this destination and dates'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform HotelBeds response to our format
    const transformedHotels = hotelResults.hotels.map((hotel: any) => ({
      id: hotel.code.toString(),
      source: 'hotelbeds',
      name: hotel.name,
      location: hotel.destinationName || destination,
      address: hotel.address || '',
      rating: hotel.categoryCode ? parseInt(hotel.categoryCode) : null,
      reviews: null, // No review data available from HotelBeds
      reviewScore: hotel.ranking ? (hotel.ranking / 10) : null,
      price: {
        amount: hotel.minRate || null,
        currency: hotel.currency || 'USD',
        per: 'night'
      },
      images: hotel.images?.map((img: any) => img.path) || [],
      amenities: hotel.facilities?.map((f: any) => f.description) || [],
      distance: null, // Distance calculation requires destination coordinates
      coordinates: hotel.coordinates ? {
        latitude: hotel.coordinates.latitude,
        longitude: hotel.coordinates.longitude
      } : null,
      rooms: [{
        type: 'Standard Room',
        beds: '1 King Bed',
        size: null, // Size not available from HotelBeds
        guests: guests,
        price: hotel.minRate || null,
        amenities: [], // Room amenities not available from search
        available: !!hotel.minRate
      }],
      policies: {
        checkIn: '15:00',
        checkOut: '11:00',
        cancellation: 'Free cancellation until 24 hours before check-in'
      },
      verified: true
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      source: 'hotelbeds',
      hotels: transformedHotels,
      searchCriteria: { destination, checkIn, checkOut, guests, rooms }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('HotelBeds search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'hotelbeds'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});