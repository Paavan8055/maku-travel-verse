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

    // In a real implementation, this would integrate with activity providers APIs like:
    // - Viator API for activities and tours
    // - GetYourGuide API for experiences
    // - Amadeus Tours and Activities API
    // For now, return enhanced mock data with proper image references
    
    const mockActivities = [
      {
        id: "activity-provider-1",
        title: "Sydney Harbour Bridge Climb",
        description: "Experience breathtaking views from the top of the iconic bridge with professional guidance and safety equipment.",
        provider: "BridgeClimb Sydney",
        location: "Sydney Harbour Bridge, Sydney, NSW",
        images: ["/src/assets/activity-bridge-climb.jpg"],
        category: "Adventure",
        price: 174,
        currency: "$",
        duration: "half-day",
        durationHours: 3.5,
        difficulty: "moderate",
        rating: 4.8,
        reviewCount: 12847,
        groupSize: { min: 1, max: 14 },
        availability: ["Daily"],
        highlights: ["Climb the iconic bridge", "360-degree views", "Professional guide"],
        included: ["Professional guide", "Safety equipment", "Certificate"],
        cancellationPolicy: "Free cancellation up to 48 hours",
        instantConfirmation: true,
        ageGroup: "adult",
        meetingPoint: "Bridge Climb Base, 3 Cumberland St"
      },
      {
        id: "activity-provider-2",
        title: "Blue Mountains Wildlife Safari",
        description: "Discover native Australian wildlife in their natural habitat with expert guides.",
        provider: "Blue Mountains Explorer",
        location: "Blue Mountains, NSW",
        images: ["/src/assets/activity-blue-mountains.jpg"],
        category: "Nature",
        price: 89,
        currency: "$",
        duration: "full-day",
        durationHours: 8,
        difficulty: "easy",
        rating: 4.6,
        reviewCount: 3241,
        groupSize: { min: 2, max: 20 },
        availability: ["Daily"],
        highlights: ["Wildlife spotting", "Three Sisters views", "Mountain towns"],
        included: ["Transportation", "Guide", "Lunch"],
        cancellationPolicy: "Free cancellation up to 24 hours",
        instantConfirmation: true,
        ageGroup: "family",
        meetingPoint: "Central Station, Platform 1"
      },
      {
        id: "activity-provider-3",
        title: "Wine Tasting Hunter Valley",
        description: "Sample premium wines at boutique vineyards with expert sommelier guidance.",
        provider: "Hunter Valley Tours",
        location: "Hunter Valley, NSW",
        images: ["/src/assets/activity-wine-tasting.jpg"],
        category: "Food & Drink",
        price: 145,
        currency: "$",
        duration: "full-day",
        durationHours: 8,
        difficulty: "easy",
        rating: 4.7,
        reviewCount: 1876,
        groupSize: { min: 2, max: 16 },
        availability: ["Daily"],
        highlights: ["Premium wine tastings", "Vineyard tours", "Gourmet lunch"],
        included: ["Wine tastings", "Lunch", "Transportation"],
        cancellationPolicy: "Free cancellation up to 24 hours",
        instantConfirmation: true,
        ageGroup: "adult",
        meetingPoint: "Central Station, Platform 1"
      },
      {
        id: "activity-provider-4",
        title: "Kids Adventure Park",
        description: "Fun-filled adventure activities designed specially for children with safety supervision.",
        provider: "Sydney Kids Adventures",
        location: "Adventure Park, Sydney",
        images: ["/src/assets/activity-surfing.jpg"],
        category: "Adventure",
        price: 45,
        currency: "$",
        duration: "short",
        durationHours: 2,
        difficulty: "easy",
        rating: 4.5,
        reviewCount: 892,
        groupSize: { min: 1, max: 12 },
        availability: ["Daily"],
        highlights: ["Safe playground", "Supervised activities", "Age-appropriate challenges"],
        included: ["Supervision", "Safety equipment", "Snacks"],
        cancellationPolicy: "Free cancellation up to 2 hours",
        instantConfirmation: true,
        ageGroup: "kids",
        meetingPoint: "Adventure Park Main Entrance"
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