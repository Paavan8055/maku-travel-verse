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
        description: "Experience luxury and comfort at Shangri-La Sydney, perfectly located in the heart of Sydney Harbour with world-class amenities.",
        address: "176 Cumberland Street, The Rocks, Sydney",
        images: ["/placeholder.svg"],
        starRating: 5,
        rating: 4.8,
        reviewCount: 2847,
        pricePerNight: 320,
        currency: "$",
        totalPrice: 320 * nights,
        propertyType: "hotel",
        distanceFromCenter: 0.8,
        amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar", "Room Service", "Concierge"],
        cancellationPolicy: "Free cancellation",
        breakfast: true,
        mealPlan: "breakfast",
        deals: {
          type: "Member Price",
          description: "Save with member pricing",
          savings: 48
        }
      },
      {
        id: "hotel-hotelbeds-2",
        name: "Park Hyatt Sydney",
        description: "Iconic waterfront luxury hotel with stunning Opera House and Harbour Bridge views and premium facilities.",
        address: "7 Hickson Road, The Rocks, Sydney",
        images: ["/placeholder.svg"],
        starRating: 5,
        rating: 4.9,
        reviewCount: 1923,
        pricePerNight: 495,
        currency: "$",
        totalPrice: 495 * nights,
        propertyType: "hotel",
        distanceFromCenter: 0.5,
        amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Parking", "Room Service", "Concierge"],
        cancellationPolicy: "Free cancellation up to 2 days",
        breakfast: false,
        mealPlan: "room-only"
      },
      {
        id: "hotel-hotelbeds-3",
        name: "The Langham, Sydney",
        description: "Elegant luxury hotel in the heart of Sydney offering sophisticated accommodation and exceptional service.",
        address: "89-113 Kent Street, Sydney",
        images: ["/placeholder.svg"],
        starRating: 5,
        rating: 4.7,
        reviewCount: 1456,
        pricePerNight: 280,
        currency: "$",
        totalPrice: 280 * nights,
        propertyType: "hotel",
        distanceFromCenter: 1.2,
        amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Business Center"],
        cancellationPolicy: "Free cancellation",
        breakfast: true,
        mealPlan: "breakfast"
      },
      {
        id: "hotel-hotelbeds-4",
        name: "Sydney Harbour YHA",
        description: "Modern hostel with spectacular harbour views, perfect for budget-conscious travelers.",
        address: "110 Cumberland Street, The Rocks, Sydney",
        images: ["/placeholder.svg"],
        starRating: 2,
        rating: 8.2,
        reviewCount: 3421,
        pricePerNight: 45,
        currency: "$",
        totalPrice: 45 * nights,
        propertyType: "hostel",
        distanceFromCenter: 0.9,
        amenities: ["WiFi", "Parking"],
        cancellationPolicy: "Free cancellation",
        breakfast: false,
        mealPlan: "room-only"
      },
      {
        id: "hotel-hotelbeds-5",
        name: "Pullman Sydney Harbour",
        description: "Contemporary hotel with spacious rooms and stunning harbour views in a prime location.",
        address: "55 Harrington Street, The Rocks, Sydney",
        images: ["/placeholder.svg"],
        starRating: 4,
        rating: 4.4,
        reviewCount: 892,
        pricePerNight: 185,
        currency: "$",
        totalPrice: 185 * nights,
        propertyType: "hotel",
        distanceFromCenter: 0.7,
        amenities: ["WiFi", "Pool", "Gym", "Restaurant", "Parking"],
        cancellationPolicy: "Free cancellation up to 1 day",
        breakfast: false,
        mealPlan: "room-only"
      },
      {
        id: "hotel-hotelbeds-6",
        name: "Little Albion Guesthouse",
        description: "Charming boutique guesthouse with personalized service and unique character.",
        address: "39 Albion Street, Surry Hills, Sydney",
        images: ["/placeholder.svg"],
        starRating: 4,
        rating: 8.9,
        reviewCount: 567,
        pricePerNight: 165,
        currency: "$",
        totalPrice: 165 * nights,
        propertyType: "boutique",
        distanceFromCenter: 2.1,
        amenities: ["WiFi", "Restaurant", "Business Center"],
        cancellationPolicy: "Free cancellation",
        breakfast: true,
        mealPlan: "breakfast"
      },
      {
        id: "hotel-hotelbeds-7",
        name: "Sydney Harbour Villa",
        description: "Exclusive waterfront villa with private facilities and panoramic harbour views.",
        address: "Marina Drive, Watsons Bay, Sydney",
        images: ["/placeholder.svg"],
        starRating: 5,
        rating: 9.1,
        reviewCount: 234,
        pricePerNight: 750,
        currency: "$",
        totalPrice: 750 * nights,
        propertyType: "villa",
        distanceFromCenter: 8.5,
        amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Parking", "Room Service", "Concierge", "Pet Friendly"],
        cancellationPolicy: "Free cancellation up to 7 days",
        breakfast: false,
        mealPlan: "all-inclusive"
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