import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination, departureDate, returnDate, passengers } = await req.json();

    console.log('Flight search request:', {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers
    });

    // In a real implementation, this would integrate with Amadeus API
    // For now, return a structure that matches the expected format
    
    const mockFlights = [
      {
        id: "flight-amadeus-1",
        airline: "Qantas",
        airlineCode: "QF",
        flightNumber: "QF123",
        aircraft: "Boeing 737",
        origin,
        destination,
        departureTime: "08:30",
        arrivalTime: "12:45",
        duration: 255,
        stops: "0",
        price: 489,
        currency: "$",
        availableSeats: 12,
        cabin: "Economy",
        baggage: {
          carry: true,
          checked: true
        }
      },
      {
        id: "flight-amadeus-2",
        airline: "Virgin Australia",
        airlineCode: "VA",
        flightNumber: "VA456",
        aircraft: "Airbus A320",
        origin,
        destination,
        departureTime: "14:15",
        arrivalTime: "18:30",
        duration: 255,
        stops: "0",
        price: 425,
        currency: "$",
        availableSeats: 8,
        cabin: "Economy",
        baggage: {
          carry: true,
          checked: false
        }
      }
    ];

    return new Response(
      JSON.stringify({
        success: true,
        flights: mockFlights,
        searchCriteria: {
          origin,
          destination,
          departureDate,
          returnDate,
          passengers
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Flight search error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to search flights'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});