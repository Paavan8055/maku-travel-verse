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
    const { destination, checkIn, checkOut, guests } = await req.json();

    console.log('Hotel search request:', {
      destination,
      checkIn,
      checkOut,
      guests
    });

    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

    // In a real implementation, this would integrate with HotelBeds API
    // For now, return a structure that matches the expected format
    
    const mockHotels = [
      {
        id: "hotel-hotelbeds-1",
        name: "Shangri-La Sydney",
        description: "Experience luxury and comfort at Shangri-La Sydney, perfectly located in the heart of Sydney Harbour.",
        address: "176 Cumberland Street, The Rocks, Sydney",
        images: ["/placeholder.svg"],
        starRating: 5,
        rating: 4.8,
        reviewCount: 2847,
        pricePerNight: 320,
        currency: "$",
        totalPrice: 320 * nights,
        propertyType: "Hotel",
        distanceFromCenter: 0.8,
        amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar"],
        cancellationPolicy: "Free cancellation",
        breakfast: true,
        deals: {
          type: "Member Price",
          description: "Save with member pricing",
          savings: 48
        }
      },
      {
        id: "hotel-hotelbeds-2",
        name: "Park Hyatt Sydney",
        description: "Iconic waterfront luxury hotel with stunning Opera House and Harbour Bridge views.",
        address: "7 Hickson Road, The Rocks, Sydney",
        images: ["/placeholder.svg"],
        starRating: 5,
        rating: 4.9,
        reviewCount: 1923,
        pricePerNight: 495,
        currency: "$",
        totalPrice: 495 * nights,
        propertyType: "Hotel",
        distanceFromCenter: 0.5,
        amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Parking"],
        cancellationPolicy: "Free cancellation up to 2 days",
        breakfast: false
      }
    ];

    return new Response(
      JSON.stringify({
        success: true,
        hotels: mockHotels,
        searchCriteria: {
          destination,
          checkIn,
          checkOut,
          guests,
          nights
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Hotel search error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to search hotels'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});