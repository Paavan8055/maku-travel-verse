import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params = await req.json();
    
    // Test-safe stub for Amadeus activity search
    // Returns demo data for testing purposes
    const demoData = [
      {
        id: "amadeus-activity-demo-1",
        name: "Sydney Harbour Bridge Climb",
        description: "Iconic bridge climbing experience with panoramic views",
        location: params.destination || "Sydney",
        date: params.date || "2025-09-20",
        duration: "3 hours",
        price: { amount: 374, currency: "AUD" },
        category: "Adventure",
        rating: 4.8
      },
      {
        id: "amadeus-activity-demo-2",
        name: "Sydney Opera House Tour", 
        description: "Guided tour of the world-famous opera house",
        location: params.destination || "Sydney",
        date: params.date || "2025-09-20",
        duration: "1 hour",
        price: { amount: 43, currency: "AUD" },
        category: "Cultural",
        rating: 4.6
      },
      {
        id: "amadeus-activity-demo-3",
        name: "Blue Mountains Day Trip",
        description: "Full day scenic tour to the Blue Mountains",
        location: params.destination || "Sydney",
        date: params.date || "2025-09-20", 
        duration: "8 hours",
        price: { amount: 139, currency: "AUD" },
        category: "Nature",
        rating: 4.7
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: demoData,
      count: demoData.length,
      provider: "Amadeus (Test Mode)",
      responseTime: Math.floor(Math.random() * 400) + 300
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Amadeus activity search failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});