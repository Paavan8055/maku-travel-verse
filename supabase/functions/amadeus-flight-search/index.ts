import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json();
    
    // Test-safe stub for Amadeus flight search
    // Returns demo data for testing purposes
    const demoData = [
      {
        id: "amadeus-flight-demo-1",
        airline: "Qantas",
        flightNumber: "QF123",
        origin: params.originLocationCode || "SYD",
        destination: params.destinationLocationCode || "MEL",
        departure: params.departureDate || "2025-09-25",
        duration: "1h 30m",
        price: { amount: 299, currency: "AUD" },
        bookingClass: "Economy"
      },
      {
        id: "amadeus-flight-demo-2", 
        airline: "Virgin Australia",
        flightNumber: "VA456",
        origin: params.originLocationCode || "SYD",
        destination: params.destinationLocationCode || "MEL", 
        departure: params.departureDate || "2025-09-25",
        duration: "1h 35m",
        price: { amount: 259, currency: "AUD" },
        bookingClass: "Economy"
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: demoData,
      count: demoData.length,
      provider: "Amadeus (Test Mode)",
      responseTime: Math.floor(Math.random() * 500) + 200
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Amadeus flight search failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});