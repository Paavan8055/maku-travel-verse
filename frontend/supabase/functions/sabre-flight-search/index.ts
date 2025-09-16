import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json();
    
    // Test-safe stub for Sabre flight search
    // Returns demo data for testing purposes
    const demoData = [
      {
        id: "sabre-flight-demo-1",
        airline: "Jetstar",
        flightNumber: "JQ771",
        origin: params.originLocationCode || "SYD",
        destination: params.destinationLocationCode || "MEL",
        departure: params.departureDate || "2025-09-25",
        duration: "1h 40m",
        price: { amount: 189, currency: "AUD" },
        bookingClass: "Economy"
      },
      {
        id: "sabre-flight-demo-2",
        airline: "Rex Airlines", 
        flightNumber: "ZL143",
        origin: params.originLocationCode || "SYD",
        destination: params.destinationLocationCode || "MEL",
        departure: params.departureDate || "2025-09-25",
        duration: "1h 25m",
        price: { amount: 279, currency: "AUD" },
        bookingClass: "Economy"
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: demoData,
      count: demoData.length,
      provider: "Sabre (Test Mode)",
      responseTime: Math.floor(Math.random() * 600) + 400
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Sabre flight search failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});