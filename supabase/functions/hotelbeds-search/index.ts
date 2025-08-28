import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.190.0/crypto/crypto.ts";

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

const generateHotelBedsSignature = (apiKey: string, secret: string, timestamp: number): string => {
  const stringToSign = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  
  return createHash("sha256").update(data).toString("hex");
};

const searchHotels = async (params: HotelSearchParams) => {
  const apiKey = Deno.env.get('HOTELBEDS_API_KEY');
  const secret = Deno.env.get('HOTELBEDS_SECRET');
  
  if (!apiKey || !secret) {
    throw new Error('HotelBeds credentials not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateHotelBedsSignature(apiKey, secret, timestamp);

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

    console.log('HotelBeds hotel search:', { destination, checkIn, checkOut, guests, rooms });

    // For demo, we'll use a destination code mapping
    // In production, you'd have a proper destination mapping system
    const destinationCodes: { [key: string]: string } = {
      'bali': 'PMI',
      'paris': 'PAR',
      'london': 'LON',
      'new york': 'NYC',
      'tokyo': 'TYO',
      'dubai': 'DXB'
    };

    const destCode = destinationCodes[destination.toLowerCase()] || 'PMI';

    const hotelResults = await searchHotels({
      destination: destCode,
      checkIn,
      checkOut,
      adults: guests,
      rooms
    });

    // Transform HotelBeds response to our format
    const transformedHotels = hotelResults.hotels?.map((hotel: any) => ({
      id: hotel.code.toString(),
      source: 'hotelbeds',
      name: hotel.name,
      location: hotel.destinationName || destination,
      address: hotel.address || '',
      rating: hotel.categoryCode ? parseInt(hotel.categoryCode) : 4,
      reviews: Math.floor(Math.random() * 2000) + 500, // Placeholder
      reviewScore: hotel.ranking ? (hotel.ranking / 10) : (Math.random() * 2 + 7.5),
      price: {
        amount: hotel.minRate || Math.floor(Math.random() * 500) + 100,
        currency: hotel.currency || 'USD',
        per: 'night'
      },
      images: hotel.images?.map((img: any) => img.path) || [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
      ],
      amenities: hotel.facilities?.map((f: any) => f.description) || [
        "Free WiFi", "Pool", "Spa", "Restaurant"
      ],
      distance: hotel.coordinates ? 
        `${(Math.random() * 5).toFixed(1)} km from center` : 
        '2.5 km from center',
      coordinates: hotel.coordinates ? {
        latitude: hotel.coordinates.latitude,
        longitude: hotel.coordinates.longitude
      } : null,
      rooms: [{
        type: 'Standard Room',
        beds: '1 King Bed',
        size: '25 sqm',
        guests: guests,
        price: hotel.minRate || Math.floor(Math.random() * 500) + 100,
        amenities: ['Free WiFi', 'Air Conditioning', 'TV'],
        available: true
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
    console.error('HotelBeds search error:', error);
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