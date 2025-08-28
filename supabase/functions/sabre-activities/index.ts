import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSabreAccessToken, SABRE_CONFIG } from "../_shared/sabre.ts";
import logger from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SabreActivitySearchRequest {
  destination: string;
  date?: string;
  participants?: number;
  activityType?: string;
  radius?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SabreActivitySearchRequest = await req.json();
    logger.info('[SABRE-ACTIVITIES] Activity search request:', params);

    const accessToken = await getSabreAccessToken();
    
    // Build search parameters
    const searchParams = new URLSearchParams();
    searchParams.append('destination', params.destination);
    
    if (params.date) {
      searchParams.append('date', params.date);
    }
    
    if (params.participants) {
      searchParams.append('participants', params.participants.toString());
    }
    
    if (params.activityType) {
      searchParams.append('activityType', params.activityType);
    }
    
    if (params.radius) {
      searchParams.append('radius', params.radius.toString());
    }

    // Sabre Ground Content API for activities
    const response = await fetch(`${SABRE_CONFIG.baseUrl}/v1/shop/activities?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[SABRE-ACTIVITIES] API request failed:', {
        status: response.status,
        error: errorText
      });
      
      // Return fallback data for activities
      return new Response(JSON.stringify({
        success: true,
        data: {
          activities: getSabreFallbackActivities(params.destination),
          provider: 'Sabre',
          fallback: true,
          message: 'Using demo data - Sabre activities temporarily unavailable'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const data = await response.json();
    logger.info('[SABRE-ACTIVITIES] Search successful:', { 
      activityCount: data.Activities?.length || 0 
    });

    // Normalize Sabre activity data
    const activities = (data.Activities || []).map((activity: any) => ({
      id: activity.ActivityID || `sabre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: activity.Name || activity.Title,
      description: activity.Description || activity.ShortDescription,
      location: {
        destination: params.destination,
        address: activity.Address,
        coordinates: activity.Coordinates
      },
      price: {
        amount: activity.Price?.Amount || activity.BasePrice || 0,
        currency: activity.Price?.Currency || 'USD',
        priceType: 'per_person'
      },
      duration: activity.Duration || '2-4 hours',
      category: activity.Category || 'General',
      provider: 'Sabre',
      images: activity.Images || [],
      rating: activity.Rating || null,
      availability: {
        date: params.date,
        participants: params.participants || 1,
        status: 'available'
      },
      bookingInfo: {
        cancellationPolicy: activity.CancellationPolicy || 'Free cancellation up to 24 hours',
        instantConfirmation: activity.InstantConfirmation || true,
        bookingReference: activity.ProductCode || activity.ActivityID
      },
      highlights: activity.Highlights || [],
      inclusions: activity.Inclusions || [],
      exclusions: activity.Exclusions || []
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        activities,
        totalResults: activities.length,
        provider: 'Sabre',
        searchCriteria: params,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('[SABRE-ACTIVITIES] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Activity search failed',
      data: {
        activities: [],
        provider: 'Sabre',
        fallback: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function getSabreFallbackActivities(destination: string) {
  return [
    {
      id: 'sabre-demo-city-tour',
      title: `${destination} City Walking Tour`,
      description: 'Explore the highlights of the city with a knowledgeable local guide.',
      location: {
        destination,
        address: 'City Center',
        coordinates: null
      },
      price: {
        amount: 45,
        currency: 'USD',
        priceType: 'per_person'
      },
      duration: '3 hours',
      category: 'Tours & Sightseeing',
      provider: 'Sabre',
      images: [],
      rating: 4.5,
      availability: {
        status: 'available'
      },
      bookingInfo: {
        cancellationPolicy: 'Free cancellation up to 24 hours',
        instantConfirmation: true
      },
      highlights: ['Local guide', 'Small group experience', 'Historical insights'],
      inclusions: ['Professional guide', 'Walking tour'],
      exclusions: ['Transportation', 'Food & drinks']
    },
    {
      id: 'sabre-demo-cultural-experience',
      title: `${destination} Cultural Experience`,
      description: 'Immerse yourself in local culture and traditions.',
      location: {
        destination,
        address: 'Cultural District',
        coordinates: null
      },
      price: {
        amount: 75,
        currency: 'USD',
        priceType: 'per_person'
      },
      duration: '4 hours',
      category: 'Cultural',
      provider: 'Sabre',
      images: [],
      rating: 4.7,
      availability: {
        status: 'available'
      },
      bookingInfo: {
        cancellationPolicy: 'Free cancellation up to 48 hours',
        instantConfirmation: true
      },
      highlights: ['Authentic experience', 'Local interactions', 'Cultural insights'],
      inclusions: ['Cultural guide', 'Local refreshments', 'Activity materials'],
      exclusions: ['Transportation to meeting point']
    }
  ];
}