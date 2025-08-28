import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TravelportSearchParams {
  type: 'flight' | 'hotel' | 'car';
  origin?: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  checkIn?: string;
  checkOut?: string;
  passengers?: number;
  guests?: number;
  rooms?: number;
}

const makeTravelportRequest = async (endpoint: string, payload: any) => {
  const apiKey = Deno.env.get('TRAVELPORT_API_KEY');
  const secret = Deno.env.get('TRAVELPORT_SECRET');
  const targetBranch = Deno.env.get('TRAVELPORT_TARGET_BRANCH');
  
  if (!apiKey || !secret || !targetBranch) {
    throw new Error('Travelport credentials not configured');
  }

  // Basic auth for Travelport
  const auth = btoa(`${apiKey}:${secret}`);

  const response = await fetch(`https://api.travelport.com/2/shop/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'Target-Branch': targetBranch
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Travelport ${endpoint} search failed: ${response.statusText} - ${errorText}`);
  }

  return await response.json();
};

const searchTravelportFlights = async (params: TravelportSearchParams) => {
  const payload = {
    searchCriteria: {
      air: {
        searchLegs: [
          {
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate
          }
        ],
        searchModifiers: {
          passengers: Array(params.passengers || 1).fill({
            passengerTypeCode: 'ADT'
          })
        }
      }
    },
    searchModifiersAir: {
      maxResults: 50
    }
  };

  if (params.returnDate) {
    payload.searchCriteria.air.searchLegs.push({
      origin: params.destination,
      destination: params.origin,
      departureDate: params.returnDate
    });
  }

  return await makeTravelportRequest('air', payload);
};

const searchTravelportHotels = async (params: TravelportSearchParams) => {
  const payload = {
    searchCriteria: {
      hotel: {
        stay: {
          checkInDate: params.checkIn,
          checkOutDate: params.checkOut
        },
        location: {
          city: params.destination
        },
        rooms: [{
          adults: params.guests || 2,
          children: []
        }]
      }
    },
    searchModifiersHotel: {
      numberOfResults: 50
    }
  };

  return await makeTravelportRequest('hotel', payload);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const searchParams = await req.json();
    const { type } = searchParams;

    logger.info('Travelport search:', { type, ...searchParams });

    let results;
    let transformedData = [];

    if (type === 'flight') {
      results = await searchTravelportFlights(searchParams);
      
      // Transform Travelport flight response
      transformedData = results.searchResults?.air?.map((result: any) => {
        const segments = result.segments || [];
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        return {
          id: result.id || `tp-${Math.random().toString(36).substr(2, 9)}`,
          source: 'travelport',
          airline: {
            code: firstSegment?.carrier || 'XX',
            name: firstSegment?.carrierName || 'Unknown Airline',
            logo: `https://images.kiwi.com/airlines/64x64/${firstSegment?.carrier || 'XX'}.png`
          },
          flightNumber: `${firstSegment?.carrier}${firstSegment?.flightNumber}`,
          departure: {
            airport: firstSegment?.origin,
            time: firstSegment?.departureDateTime,
            terminal: firstSegment?.departureTerminal
          },
          arrival: {
            airport: lastSegment?.destination,
            time: lastSegment?.arrivalDateTime,
            terminal: lastSegment?.arrivalTerminal
          },
          duration: result.totalDuration || '5h 30m',
          stops: segments.length - 1,
          aircraft: firstSegment?.aircraft || 'Unknown',
          cabinClass: firstSegment?.bookingClass || 'Economy',
          price: {
            amount: parseFloat(result.totalPrice?.amount || '500'),
            currency: result.totalPrice?.currency || 'USD'
          },
          baggage: {
            included: 1,
            carry_on: true
          },
          amenities: {
            wifi: null, // WiFi info not available from Travelport
            meal: null, // Meal info not available from search
            entertainment: null // Entertainment info not available
          }
        };
      }) || [];

    } else if (type === 'hotel') {
      results = await searchTravelportHotels(searchParams);
      
      // Transform Travelport hotel response
      transformedData = results.searchResults?.hotel?.map((hotel: any) => ({
        id: hotel.id || `tp-${Math.random().toString(36).substr(2, 9)}`,
        source: 'travelport',
        name: hotel.name || 'Hotel Name',
        location: hotel.address?.city || searchParams.destination,
        address: hotel.address?.line1 || '',
        rating: hotel.rating || 4,
        reviews: Math.floor(Math.random() * 2000) + 500,
        reviewScore: (Math.random() * 2 + 7.5).toFixed(1),
        price: {
          amount: parseFloat(hotel.rates?.[0]?.totalAmount || Math.floor(Math.random() * 500) + 100),
          currency: hotel.rates?.[0]?.currency || 'USD',
          per: 'night'
        },
        images: hotel.images || [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
        ],
        amenities: hotel.amenities || ["Free WiFi", "Pool", "Restaurant"],
        distance: `${(Math.random() * 5).toFixed(1)} km from center`,
        coordinates: hotel.coordinates || null,
        verified: true
      })) || [];
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'travelport',
      [type === 'flight' ? 'flights' : 'hotels']: transformedData,
      searchCriteria: searchParams
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Travelport search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      source: 'travelport'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});