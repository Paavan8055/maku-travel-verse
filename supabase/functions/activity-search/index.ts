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
    const { destination, date, participants } = await req.json();

    console.log('Activity search request:', {
      destination,
      date,
      participants
    });

    // In a real implementation, this would integrate with activity providers APIs
    // For now, return a structure that matches the expected format
    
    const mockActivities = [
      {
        id: "activity-provider-1",
        title: "Sydney Harbour Bridge Climb",
        description: "Join us for an unforgettable Sydney Harbour Bridge climb experience. Perfect for adventure enthusiasts of all levels.",
        provider: "BridgeClimb Sydney",
        location: "Sydney Harbour Bridge, Sydney, NSW",
        images: ["/placeholder.svg"],
        category: "Adventure",
        price: 174,
        currency: "$",
        duration: "3.5 hours",
        durationHours: 3.5,
        difficulty: "Moderate",
        rating: 4.8,
        reviewCount: 12847,
        groupSize: {
          min: 1,
          max: 14
        },
        availability: ["Daily"],
        highlights: [
          "Climb the iconic Sydney Harbour Bridge",
          "360-degree views of Sydney",
          "Professional guide and safety equipment",
          "Commemorative certificate"
        ],
        included: [
          "Professional guide",
          "Safety equipment",
          "Commemorative photo",
          "Certificate of completion"
        ],
        cancellationPolicy: "Free cancellation up to 48 hours",
        instantConfirmation: true
      },
      {
        id: "activity-provider-2",
        title: "Blue Mountains Day Tour",
        description: "Discover the stunning Blue Mountains with scenic views, charming towns, and wildlife encounters.",
        provider: "Blue Mountains Explorer",
        location: "Blue Mountains, NSW",
        images: ["/placeholder.svg"],
        category: "Nature",
        price: 89,
        currency: "$",
        duration: "Full day",
        durationHours: 8,
        difficulty: "Easy",
        rating: 4.6,
        reviewCount: 3241,
        groupSize: {
          min: 2,
          max: 20
        },
        availability: ["Daily"],
        highlights: [
          "Three Sisters rock formation",
          "Scenic railway and skyway",
          "Charming mountain towns",
          "Wildlife spotting opportunities"
        ],
        included: [
          "Transportation from Sydney",
          "Professional guide",
          "Scenic railway tickets",
          "Light refreshments"
        ],
        cancellationPolicy: "Free cancellation up to 24 hours",
        instantConfirmation: true
      }
    ];

    return new Response(
      JSON.stringify({
        success: true,
        activities: mockActivities,
        searchCriteria: {
          destination,
          date,
          participants
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Activity search error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to search activities'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});