import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";
import { 
  searchFoursquarePlaces, 
  transformFoursquareToActivity, 
  validateFoursquareCredentials,
  ACTIVITY_CATEGORIES,
  type FoursquareSearchParams 
} from "../_shared/foursquare.ts";

interface ActivitySearchRequest {
  destination: string;
  date?: string;
  participants?: number;
  activityTypes?: string[];
  radius?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: ActivitySearchRequest = await req.json();
    const { destination, date, participants = 2, activityTypes = ['sightseeing'], radius = 5000 } = requestBody;

    logger.info('[FOURSQUARE-ACTIVITIES] Search request', { 
      destination, 
      date, 
      participants, 
      activityTypes,
      radius 
    });

    // Validate credentials
    if (!validateFoursquareCredentials()) {
      logger.warn('[FOURSQUARE-ACTIVITIES] API key not configured, returning empty results');
      return new Response(JSON.stringify({
        success: false,
        activities: [],
        error: 'Foursquare API not configured',
        searchParams: { destination, date, participants }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Map activity types to Foursquare categories
    const categories = activityTypes
      .map(type => ACTIVITY_CATEGORIES[type as keyof typeof ACTIVITY_CATEGORIES])
      .filter(Boolean)
      .join(',');

    // Build search parameters
    const searchParams: FoursquareSearchParams = {
      near: destination,
      categories: categories || ACTIVITY_CATEGORIES.sightseeing,
      radius,
      limit: 50,
      sort: 'POPULARITY'
    };

    // Search for places
    const foursquareResult = await searchFoursquarePlaces(searchParams);
    
    if (!foursquareResult.results || foursquareResult.results.length === 0) {
      logger.info('[FOURSQUARE-ACTIVITIES] No places found');
      return new Response(JSON.stringify({
        success: true,
        activities: [],
        total: 0,
        searchParams: { destination, date, participants }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transform places to activities
    const activities = foursquareResult.results.map(transformFoursquareToActivity);
    
    // Filter activities based on participant capacity and other criteria
    const filteredActivities = activities.filter(activity => {
      return activity.groupSize.max >= participants;
    });

    logger.info('[FOURSQUARE-ACTIVITIES] Search successful', { 
      totalFound: foursquareResult.results.length,
      filteredCount: filteredActivities.length,
      destination 
    });

    return new Response(JSON.stringify({
      success: true,
      activities: filteredActivities,
      total: filteredActivities.length,
      searchParams: { destination, date, participants },
      provider: 'Foursquare',
      metadata: {
        originalResultCount: foursquareResult.results.length,
        filteredResultCount: filteredActivities.length,
        searchRadius: radius
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[FOURSQUARE-ACTIVITIES] Search error', { error: error.message, stack: error.stack });
    
    return new Response(JSON.stringify({
      success: false,
      error: `Foursquare Activities search failed: ${error.message}`,
      activities: [],
      searchParams: {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});