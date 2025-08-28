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
        airlineLogo: "https://logos-world.net/wp-content/uploads/2023/01/Qantas-Logo.png",
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
        airlineLogo: "https://logos-world.net/wp-content/uploads/2023/01/Virgin-Australia-Logo.png",
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
      },
      {
        id: "flight-amadeus-3",
        airline: "Emirates",
        airlineCode: "EK",
        airlineLogo: "https://logos-world.net/wp-content/uploads/2023/01/Emirates-Logo.png",
        flightNumber: "EK413",
        aircraft: "Airbus A380",
        origin,
        destination,
        departureTime: "22:15",
        arrivalTime: "05:45+1",
        duration: 450,
        stops: "1",
        price: 1299,
        currency: "$",
        availableSeats: 24,
        cabin: "Business",
        baggage: {
          carry: true,
          checked: true
        }
      },
      {
        id: "flight-amadeus-4",
        airline: "Singapore Airlines",
        airlineCode: "SQ",
        airlineLogo: "https://logos-world.net/wp-content/uploads/2023/01/Singapore-Airlines-Logo.png",
        flightNumber: "SQ231",
        aircraft: "Boeing 777",
        origin,
        destination,
        departureTime: "10:30",
        arrivalTime: "16:20",
        duration: 350,
        stops: "0",
        price: 899,
        currency: "$",
        availableSeats: 16,
        cabin: "Premium Economy",
        baggage: {
          carry: true,
          checked: true
        }
      },
      {
        id: "flight-amadeus-5",
        airline: "Jetstar",
        airlineCode: "JQ",
        airlineLogo: "https://logos-world.net/wp-content/uploads/2023/01/Jetstar-Logo.png",
        flightNumber: "JQ506",
        aircraft: "Airbus A321",
        origin,
        destination,
        departureTime: "06:45",
        arrivalTime: "11:00",
        duration: 255,
        stops: "0",
        price: 299,
        currency: "$",
        availableSeats: 45,
        cabin: "Economy",
        baggage: {
          carry: true,
          checked: false
        }
      },
      {
        id: "flight-amadeus-6",
        airline: "Cathay Pacific",
        airlineCode: "CX",
        airlineLogo: "https://logos-world.net/wp-content/uploads/2023/01/Cathay-Pacific-Logo.png",
        flightNumber: "CX162",
        aircraft: "Boeing 777",
        origin,
        destination,
        departureTime: "16:55",
        arrivalTime: "23:10",
        duration: 375,
        stops: "1",
        price: 756,
        currency: "$",
        availableSeats: 19,
        cabin: "Economy",
        baggage: {
          carry: true,
          checked: true
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