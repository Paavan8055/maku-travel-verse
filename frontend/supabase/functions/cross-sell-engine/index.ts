import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


interface CrossSellRequest {
  bookingType: 'flight' | 'hotel' | 'activity';
  bookingData: any;
  customerProfile?: {
    userId?: string;
    preferences?: any;
    bookingHistory?: any[];
  };
  location: {
    destination: string;
    departureDate?: string;
    returnDate?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const request: CrossSellRequest = await req.json();
    logger.info('[CROSS-SELL] Processing request', { 
      bookingType: request.bookingType, 
      destination: request.location.destination 
    });

    const recommendations = await generateRecommendations(supabase, request);

    return new Response(JSON.stringify({
      success: true,
      recommendations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[CROSS-SELL] Request failed', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function generateRecommendations(supabase: any, request: CrossSellRequest) {
  const recommendations: any = {
    bundles: [],
    insurance: null,
    transfers: null,
    activities: [],
    upgrades: [],
    addons: []
  };

  // Generate bundle recommendations
  if (request.bookingType === 'flight') {
    recommendations.bundles.push({
      type: 'flight_hotel',
      title: 'Flight + Hotel Package',
      description: 'Save 15% when you book accommodation with your flight',
      discount: 0.15,
      savings: Math.round((request.bookingData.price?.amount || 0) * 0.15),
      hotelSuggestions: await getHotelSuggestions(supabase, request.location)
    });

    recommendations.bundles.push({
      type: 'complete_package',
      title: 'Complete Travel Package',
      description: 'Flight + Hotel + Activities - Save up to 25%',
      discount: 0.25,
      savings: Math.round((request.bookingData.price?.amount || 0) * 0.25),
      includes: ['accommodation', 'activities', 'transfers']
    });
  }

  if (request.bookingType === 'hotel') {
    recommendations.bundles.push({
      type: 'hotel_activities',
      title: 'Stay + Play Package',
      description: 'Add activities to your hotel stay and save 10%',
      discount: 0.10,
      savings: Math.round((request.bookingData.price?.amount || 0) * 0.10),
      activitySuggestions: await getActivitySuggestions(supabase, request.location)
    });
  }

  // Travel insurance recommendation
  recommendations.insurance = {
    type: 'comprehensive',
    title: 'Comprehensive Travel Insurance',
    description: 'Protect your trip with comprehensive coverage',
    price: 49,
    currency: 'AUD',
    coverage: ['trip_cancellation', 'medical_expenses', 'baggage_loss', 'flight_delays'],
    recommended: request.bookingData.price?.amount > 500, // Recommend for expensive trips
    urgency: 'Limited time: Add insurance now for full coverage'
  };

  // Airport transfers
  if (request.bookingType === 'flight' || request.bookingType === 'hotel') {
    recommendations.transfers = {
      type: 'airport_transfer',
      title: 'Private Airport Transfer',
      description: 'Skip the taxi queue with pre-booked airport transfers',
      price: 85,
      currency: 'AUD',
      options: [
        { type: 'shared', price: 35, duration: '45-60 min' },
        { type: 'private', price: 85, duration: '30-40 min' },
        { type: 'luxury', price: 150, duration: '30-35 min' }
      ]
    };
  }

  // Activity recommendations
  if (request.bookingType !== 'activity') {
    recommendations.activities = await getActivitySuggestions(supabase, request.location);
  }

  // Flight-specific upgrades and addons
  if (request.bookingType === 'flight') {
    recommendations.upgrades = [
      {
        type: 'seat_selection',
        title: 'Choose Your Seat',
        description: 'Select your preferred seat for a comfortable journey',
        price: 25,
        options: ['window', 'aisle', 'extra_legroom']
      },
      {
        type: 'cabin_upgrade',
        title: 'Premium Economy Upgrade',
        description: 'Enjoy extra space and premium service',
        price: 299,
        benefits: ['priority_boarding', 'extra_legroom', 'premium_meals']
      }
    ];

    recommendations.addons = [
      {
        type: 'extra_baggage',
        title: 'Extra Baggage',
        description: 'Add extra checked baggage to your booking',
        price: 45,
        weight: '23kg'
      },
      {
        type: 'priority_boarding',
        title: 'Priority Boarding',
        description: 'Board early and settle in first',
        price: 15
      },
      {
        type: 'meal_selection',
        title: 'Special Meal',
        description: 'Pre-order your preferred meal',
        price: 25,
        options: ['vegetarian', 'vegan', 'halal', 'kosher']
      }
    ];
  }

  // Hotel-specific upgrades
  if (request.bookingType === 'hotel') {
    recommendations.upgrades = [
      {
        type: 'room_upgrade',
        title: 'Suite Upgrade',
        description: 'Upgrade to a larger room with premium amenities',
        price: 150,
        benefits: ['ocean_view', 'balcony', 'premium_amenities']
      },
      {
        type: 'breakfast_package',
        title: 'Breakfast Included',
        description: 'Start your day with a delicious breakfast',
        price: 35,
        per: 'person per day'
      }
    ];

    recommendations.addons = [
      {
        type: 'spa_package',
        title: 'Spa & Wellness Package',
        description: 'Relax and rejuvenate with spa treatments',
        price: 180
      },
      {
        type: 'late_checkout',
        title: 'Late Checkout',
        description: 'Extend your stay until 2 PM',
        price: 50
      }
    ];
  }

  // Personalize based on customer profile
  if (request.customerProfile?.preferences) {
    recommendations = personalizeRecommendations(recommendations, request.customerProfile);
  }

  return recommendations;
}

async function getHotelSuggestions(supabase: any, location: any) {
  try {
    // Try to get real hotel data
    const { data } = await supabase.functions.invoke('amadeus-hotel-search', {
      body: {
        cityCode: location.destination,
        checkInDate: location.departureDate,
        checkOutDate: location.returnDate || getDefaultReturnDate(location.departureDate),
        adults: 1,
        roomQuantity: 1
      }
    });

    if (data?.hotels && data.hotels.length > 0) {
      return data.hotels.slice(0, 3).map((hotel: any) => ({
        id: hotel.id,
        name: hotel.name,
        starRating: hotel.starRating,
        price: hotel.price,
        image: hotel.images?.[0],
        distance: hotel.distance
      }));
    }
  } catch (error) {
    logger.warn('[CROSS-SELL] Failed to fetch real hotels, using fallback', error);
  }

  // Fallback to demo hotels
  return [
    {
      id: 'demo-hotel-1',
      name: 'Luxury Harbor Hotel',
      starRating: 5,
      price: { amount: 295, currency: 'AUD', period: 'per night' },
      distance: '2km from city center',
      amenities: ['pool', 'spa', 'restaurant']
    },
    {
      id: 'demo-hotel-2',
      name: 'Business Central Hotel',
      starRating: 4,
      price: { amount: 185, currency: 'AUD', period: 'per night' },
      distance: '500m from business district',
      amenities: ['gym', 'business_center', 'wifi']
    }
  ];
}

async function getActivitySuggestions(supabase: any, location: any) {
  try {
    // Try to get real activity data
    const { data } = await supabase.functions.invoke('hotelbeds-activities', {
      body: {
        destination: location.destination,
        date: location.departureDate,
        participants: 1
      }
    });

    if (data?.activities && data.activities.length > 0) {
      return data.activities.slice(0, 4).map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description,
        duration: activity.duration,
        price: activity.price,
        rating: activity.rating,
        category: activity.category
      }));
    }
  } catch (error) {
    logger.warn('[CROSS-SELL] Failed to fetch real activities, using fallback', error);
  }

  // Fallback to demo activities
  return [
    {
      id: 'demo-activity-1',
      name: 'Harbor Bridge Climb',
      description: 'Iconic bridge climb with stunning city views',
      duration: '3.5 hours',
      price: { amount: 185, currency: 'AUD' },
      rating: { score: 4.8, reviews: 12540 },
      category: 'adventure'
    },
    {
      id: 'demo-activity-2',
      name: 'Opera House Tour',
      description: 'Guided tour of the world-famous Opera House',
      duration: '1 hour',
      price: { amount: 45, currency: 'AUD' },
      rating: { score: 4.6, reviews: 8932 },
      category: 'cultural'
    },
    {
      id: 'demo-activity-3',
      name: 'Blue Mountains Day Trip',
      description: 'Full day adventure in the Blue Mountains',
      duration: '8 hours',
      price: { amount: 129, currency: 'AUD' },
      rating: { score: 4.7, reviews: 5621 },
      category: 'nature'
    }
  ];
}

function personalizeRecommendations(recommendations: any, customerProfile: any) {
  // Boost certain recommendations based on customer preferences
  if (customerProfile.preferences?.travel_style === 'luxury') {
    recommendations.upgrades.forEach((upgrade: any) => {
      upgrade.recommended = true;
      upgrade.priority = 'high';
    });
  }

  if (customerProfile.preferences?.interests?.includes('adventure')) {
    recommendations.activities = recommendations.activities.filter((activity: any) => 
      activity.category === 'adventure' || activity.category === 'nature'
    );
  }

  if (customerProfile.bookingHistory?.length > 5) {
    // Loyal customer - offer premium insurance
    recommendations.insurance.discount = 0.20;
    recommendations.insurance.title = 'VIP Travel Insurance (20% off)';
  }

  return recommendations;
}

function getDefaultReturnDate(departureDate: string): string {
  const departure = new Date(departureDate);
  departure.setDate(departure.getDate() + 3); // Default 3-day stay
  return departure.toISOString().split('T')[0];
}