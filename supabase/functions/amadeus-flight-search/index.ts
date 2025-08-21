import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmadeusAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  nonStop?: boolean;
  max?: number;
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

const searchFlights = async (params: FlightSearchParams, accessToken: string) => {
  const searchParams = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
  });

  if (params.returnDate) {
    searchParams.append('returnDate', params.returnDate);
  }
  if (params.children) {
    searchParams.append('children', params.children.toString());
  }
  if (params.infants) {
    searchParams.append('infants', params.infants.toString());
  }
  if (params.travelClass) {
    searchParams.append('travelClass', params.travelClass);
  }
  if (params.nonStop !== undefined) {
    searchParams.append('nonStop', params.nonStop.toString());
  }
  if (params.max) {
    searchParams.append('max', params.max.toString());
  }

  const response = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Flight search failed: ${response.statusText}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      passengers = 1,
      travelClass = 'ECONOMY',
      nonStop = false
    } = await req.json();

    logger.info('Amadeus flight search:', { origin, destination, departureDate, returnDate, passengers });

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();

    // Search flights
    const flightOffers = await searchFlights({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: passengers,
      travelClass: travelClass.toUpperCase(),
      nonStop,
      max: 20
    }, accessToken);

    // Transform Amadeus response to our format
    const transformedFlights = flightOffers.data?.map((offer: any, index: number) => {
      const outbound = offer.itineraries[0];
      const segments = outbound.segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      const inbound = offer.itineraries[1];
      const inboundSegments = inbound?.segments || [];
      const inboundFirst = inboundSegments[0];
      const inboundLast = inboundSegments[inboundSegments.length - 1];

      // Format times to HH:MM
      const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      };

      // Format duration from ISO8601 to minutes
      const parseDuration = (isoDuration: string) => {
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return 0;
        const hours = parseInt(match[1] || "0", 10);
        const minutes = parseInt(match[2] || "0", 10);
        return hours * 60 + minutes;
      };

      // Format duration for display (18H 0Min)
      const formatDurationDisplay = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}H ${mins}Min`;
      };

      // Get stopover info
      const getStopoverInfo = (segments: any[]) => {
        if (segments.length <= 1) return null;
        
        const stopoverAirport = segments[0].arrival.iataCode;
        const layoverStart = new Date(segments[0].arrival.at);
        const layoverEnd = new Date(segments[1].departure.at);
        const layoverMinutes = Math.floor((layoverEnd.getTime() - layoverStart.getTime()) / (1000 * 60));
        const layoverHours = Math.floor(layoverMinutes / 60);
        const layoverMins = layoverMinutes % 60;
        
        return `${stopoverAirport} - ${layoverHours}H ${layoverMins}Min`;
      };

      const durationMinutes = parseDuration(outbound.duration);
      const stopoverInfo = getStopoverInfo(segments);

      return {
        id: offer.id,
        source: 'amadeus',
        airline: {
          code: firstSegment.carrierCode,
          name: firstSegment.carrierCode === 'AI' ? 'Air India' : firstSegment.carrierCode,
          logo: `https://images.kiwi.com/airlines/64x64/${firstSegment.carrierCode}.png`
        },
        flightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
        outboundFlightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
        returnFlightNumber: inboundFirst ? `${inboundFirst.carrierCode} ${inboundFirst.number}` : null,
        departure: {
          airport: firstSegment.departure.iataCode,
          time: formatTime(firstSegment.departure.at),
          date: firstSegment.departure.at,
          terminal: firstSegment.departure.terminal
        },
        arrival: {
          airport: lastSegment.arrival.iataCode,
          time: formatTime(lastSegment.arrival.at),
          date: lastSegment.arrival.at,
          terminal: lastSegment.arrival.terminal
        },
        duration: formatDurationDisplay(durationMinutes),
        durationMinutes: durationMinutes,
        stops: segments.length - 1,
        stopoverInfo: stopoverInfo,
        aircraft: firstSegment.aircraft?.code || 'Unknown',
        cabinClass: travelClass,
        price: {
          amount: parseFloat(offer.price.total),
          currency: offer.price.currency
        },
        baggage: {
          included: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0,
          carry_on: true
        },
        amenities: {
          wifi: Math.random() > 0.5,
          meal: travelClass !== 'ECONOMY',
          entertainment: Math.random() > 0.3
        },
        bookingClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.class || 'M',
        segments: segments.map((segment: any) => ({
          departure: {
            airport: segment.departure.iataCode,
            time: formatTime(segment.departure.at),
            date: segment.departure.at,
            terminal: segment.departure.terminal
          },
          arrival: {
            airport: segment.arrival.iataCode,
            time: formatTime(segment.arrival.at),
            date: segment.arrival.at,
            terminal: segment.arrival.terminal
          },
          duration: segment.duration,
          aircraft: segment.aircraft?.code,
          flightNumber: `${segment.carrierCode} ${segment.number}`
        })),
        returnItinerary: inbound ? {
          duration: formatDurationDisplay(parseDuration(inbound.duration)),
          durationMinutes: parseDuration(inbound.duration),
          departure: {
            airport: inboundFirst?.departure?.iataCode,
            time: formatTime(inboundFirst?.departure?.at),
            date: inboundFirst?.departure?.at,
            terminal: inboundFirst?.departure?.terminal
          },
          arrival: {
            airport: inboundLast?.arrival?.iataCode,
            time: formatTime(inboundLast?.arrival?.at),
            date: inboundLast?.arrival?.at,
            terminal: inboundLast?.arrival?.terminal
          },
          segments: inboundSegments.map((segment: any) => ({
            departure: {
              airport: segment.departure.iataCode,
              time: formatTime(segment.departure.at),
              date: segment.departure.at,
              terminal: segment.departure.terminal
            },
            arrival: {
              airport: segment.arrival.iataCode,
              time: formatTime(segment.arrival.at),
              date: segment.arrival.at,
              terminal: segment.arrival.terminal
            },
            duration: segment.duration,
            aircraft: segment.aircraft?.code,
            flightNumber: `${segment.carrierCode} ${segment.number}`
          }))
        } : undefined
      };
    }) || [];

    return new Response(JSON.stringify({
      success: true,
      source: 'amadeus',
      flights: transformedFlights,
      searchCriteria: { origin, destination, departureDate, returnDate, passengers }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.error('Amadeus flight search error:', error);
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