import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivitySearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
  adults?: number;
  children?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const searchParams: ActivitySearchParams = await req.json();
    console.log('Amadeus activity search request:', searchParams);

    // Get Amadeus credentials from environment
    const amadeusClientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const amadeusClientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');

    if (!amadeusClientId || !amadeusClientSecret) {
      console.warn('Amadeus credentials not configured, using mock data');
      return getMockActivityResponse(searchParams);
    }

    try {
      // Get Amadeus access token
      const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: amadeusClientId,
          client_secret: amadeusClientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Amadeus auth failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Build Amadeus activity search URL
      const searchUrl = new URL('https://test.api.amadeus.com/v1/shopping/activities');
      searchUrl.searchParams.append('latitude', searchParams.latitude.toString());
      searchUrl.searchParams.append('longitude', searchParams.longitude.toString());
      
      if (searchParams.radius) {
        searchUrl.searchParams.append('radius', searchParams.radius.toString());
      }

      console.log('Searching activities with Amadeus:', searchUrl.toString());

      // Call Amadeus Activities API
      const activitiesResponse = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!activitiesResponse.ok) {
        console.error('Amadeus API error:', activitiesResponse.status);
        throw new Error(`Amadeus activities search failed: ${activitiesResponse.status}`);
      }

      const activitiesData = await activitiesResponse.json();
      
      // Process activities data
      const formattedActivities = (activitiesData.data || []).map((activity: any) => ({
        id: activity.id || `activity-${Date.now()}`,
        name: activity.name || 'Activity',
        shortDescription: activity.shortDescription || '',
        description: activity.description || '',
        price: activity.price ? {
          amount: activity.price.amount,
          currency: activity.price.currencyCode
        } : null,
        location: {
          latitude: activity.geoCode?.latitude || searchParams.latitude,
          longitude: activity.geoCode?.longitude || searchParams.longitude,
          address: activity.location?.address || 'Location'
        },
        pictures: activity.pictures || [],
        rating: activity.rating || 0,
        categories: activity.categories || [],
        bookingLink: activity.bookingLink || '',
        provider: 'amadeus'
      }));

      console.log(`Found ${formattedActivities.length} activities from Amadeus`);

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'amadeus',
          count: formattedActivities.length,
          activities: formattedActivities,
          searchParams,
          meta: {
            timestamp: new Date().toISOString(),
            source: 'amadeus-api'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (amadeusError) {
      console.error('Amadeus API error:', amadeusError);
      return getMockActivityResponse(searchParams);
    }

  } catch (error) {
    console.error('Activity search error:', error);
    return getMockActivityResponse(searchParams);
  }
});

function getMockActivityResponse(searchParams: ActivitySearchParams) {
  const mockActivities = [
    {
      id: 'mock-activity-1',
      name: 'City Walking Tour',
      shortDescription: 'Explore the city on foot with a local guide',
      description: 'Join our experienced local guide for a comprehensive walking tour of the city\'s most iconic landmarks and hidden gems.',
      price: { amount: '25.00', currency: 'USD' },
      location: { 
        latitude: searchParams.latitude, 
        longitude: searchParams.longitude, 
        address: 'City Center' 
      },
      pictures: [],
      rating: 4.5,
      categories: ['SIGHTSEEING', 'WALKING'],
      bookingLink: '',
      provider: 'mock'
    },
    {
      id: 'mock-activity-2',
      name: 'Museum Visit',
      shortDescription: 'Discover local history and culture',
      description: 'Visit the local museum to learn about the rich history and culture of the area.',
      price: { amount: '15.00', currency: 'USD' },
      location: { 
        latitude: searchParams.latitude + 0.001, 
        longitude: searchParams.longitude + 0.001, 
        address: 'Museum District' 
      },
      pictures: [],
      rating: 4.2,
      categories: ['CULTURE', 'MUSEUM'],
      bookingLink: '',
      provider: 'mock'
    }
  ];

  return new Response(
    JSON.stringify({
      success: true,
      provider: 'mock',
      count: mockActivities.length,
      activities: mockActivities,
      searchParams,
      meta: {
        timestamp: new Date().toISOString(),
        source: 'mock-data'
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}