import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeatMapRequest {
  flightOfferId: string;
  passengerCount?: number;
  cabinClass?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: SeatMapRequest = await req.json();
    console.log('Amadeus seat map request:', requestData);

    const { flightOfferId, passengerCount = 1, cabinClass = 'ECONOMY' } = requestData;

    if (!flightOfferId) {
      throw new Error('Flight offer ID is required');
    }

    // Get Amadeus credentials
    const amadeusClientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const amadeusClientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');

    if (!amadeusClientId || !amadeusClientSecret) {
      console.warn('Amadeus credentials not configured, using mock seat map');
      return getMockSeatMapResponse(flightOfferId);
    }

    try {
      // Get Amadeus access token
      const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: amadeusClientId,
          client_secret: amadeusClientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Amadeus auth failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Call Amadeus SeatMap API
      console.log('Requesting seat map from Amadeus for offer:', flightOfferId);
      
      const seatMapResponse = await fetch('https://test.api.amadeus.com/v1/shopping/seatmaps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [{
            type: 'flight-offer',
            flightOffers: [{
              type: 'flight-offer',
              id: flightOfferId
            }]
          }]
        })
      });

      if (!seatMapResponse.ok) {
        console.error('Amadeus seat map error:', seatMapResponse.status);
        throw new Error(`Amadeus seat map failed: ${seatMapResponse.status}`);
      }

      const seatMapData = await seatMapResponse.json();
      
      // Process seat map data
      const processedSeatMaps = (seatMapData.data || []).map((seatMap: any) => ({
        id: seatMap.id || `seatmap-${Date.now()}`,
        type: seatMap.type,
        flightOfferId: seatMap.flightOfferId,
        segmentId: seatMap.segmentId,
        carrierCode: seatMap.carrierCode,
        number: seatMap.number,
        aircraft: seatMap.aircraft ? {
          code: seatMap.aircraft.code,
          name: seatMap.aircraft.name || 'Unknown Aircraft'
        } : null,
        departure: seatMap.departure,
        arrival: seatMap.arrival,
        class: seatMap.class,
        decks: (seatMap.decks || []).map((deck: any) => ({
          deckType: deck.deckType,
          deckConfiguration: deck.deckConfiguration,
          facilities: deck.facilities || [],
          seats: (deck.seats || []).map((seat: any) => ({
            number: seat.number,
            characteristicsCodes: seat.characteristicsCodes || [],
            travelerPricing: seat.travelerPricing ? {
              travelerId: seat.travelerPricing.travelerId,
              seatAvailabilityStatus: seat.travelerPricing.seatAvailabilityStatus,
              price: seat.travelerPricing.price
            } : null,
            coordinates: seat.coordinates
          }))
        }))
      }));

      console.log(`Retrieved ${processedSeatMaps.length} seat maps from Amadeus`);

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'amadeus',
          flightOfferId,
          seatMaps: processedSeatMaps,
          meta: {
            timestamp: new Date().toISOString(),
            source: 'amadeus-api'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (amadeusError) {
      console.error('Amadeus seat map API error:', amadeusError);
      return getMockSeatMapResponse(flightOfferId);
    }

  } catch (error) {
    console.error('Seat map request error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        provider: 'error',
        flightOfferId: '',
        seatMaps: [],
        meta: {
          timestamp: new Date().toISOString(),
          source: 'error'
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getMockSeatMapResponse(flightOfferId: string): Response {
  // Generate mock seat map data
  const mockSeatMap = {
    id: `mock-seatmap-${Date.now()}`,
    type: 'seat-map',
    flightOfferId,
    segmentId: 'SEG001',
    carrierCode: 'BA',
    number: '101',
    aircraft: {
      code: '738',
      name: 'Boeing 737-800'
    },
    departure: {
      iataCode: 'LHR',
      at: new Date().toISOString()
    },
    arrival: {
      iataCode: 'JFK',
      at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    },
    class: 'ECONOMY',
    decks: [{
      deckType: 'MAIN',
      deckConfiguration: {
        width: 6,
        length: 30,
        startSeatRow: 1,
        endSeatRow: 30,
        startWingsRow: 10,
        endWingsRow: 20,
        exitRowsX: [12, 13]
      },
      facilities: [
        { code: 'LA', column: '3', row: '15', detail: 'LAVATORY' },
        { code: 'GA', column: '4', row: '15', detail: 'GALLEY' }
      ],
      seats: generateMockSeats()
    }]
  };

  return new Response(
    JSON.stringify({
      success: true,
      provider: 'mock',
      flightOfferId,
      seatMaps: [mockSeatMap],
      meta: {
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateMockSeats() {
  const seats = [];
  const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let row = 1; row <= 30; row++) {
    for (let col = 0; col < seatLetters.length; col++) {
      const seatNumber = `${row}${seatLetters[col]}`;
      const isWindow = col === 0 || col === 5;
      const isAisle = col === 2 || col === 3;
      const isExit = row === 12 || row === 13;
      const isPremium = row <= 5;
      
      let characteristics = [];
      if (isWindow) characteristics.push('W'); // Window
      if (isAisle) characteristics.push('A'); // Aisle
      if (isExit) characteristics.push('E'); // Exit row
      if (isPremium) characteristics.push('P'); // Premium
      
      seats.push({
        number: seatNumber,
        characteristicsCodes: characteristics,
        travelerPricing: {
          travelerId: '1',
          seatAvailabilityStatus: Math.random() > 0.3 ? 'AVAILABLE' : 'OCCUPIED',
          price: isPremium ? {
            amount: '25.00',
            currency: 'USD'
          } : isExit ? {
            amount: '15.00',
            currency: 'USD'
          } : null
        },
        coordinates: {
          x: col + 1,
          y: row
        }
      });
    }
  }
  
  return seats;
}