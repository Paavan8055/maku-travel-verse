import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";
import { 
  enhancedViatorClient,
  transformViatorToActivity, 
  VIATOR_CATEGORIES,
  type ViatorSearchParams 
} from "../_shared/enhanced-viator.ts";

interface ActivitySearchRequest {
  destination: string;
  date?: string;
  participants?: number;
  activityTypes?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: ActivitySearchRequest = await req.json();
    const { destination, date, participants = 2, activityTypes = ['sightseeing'] } = requestBody;

    logger.info('[VIATOR-ACTIVITIES] Search request', { 
      destination, 
      date, 
      participants, 
      activityTypes 
    });

    // Validate credentials
    if (!enhancedViatorClient.validateCredentials()) {
      logger.warn('[VIATOR-ACTIVITIES] API key not configured, returning empty results');
      return new Response(JSON.stringify({
        success: false,
        activities: [],
        error: 'Viator API not configured',
        searchParams: { destination, date, participants },
        status: enhancedViatorClient.getStatus()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Map activity types to Viator categories
    const primaryCategory = activityTypes[0] as keyof typeof VIATOR_CATEGORIES;
    const categoryId = VIATOR_CATEGORIES[primaryCategory] || VIATOR_CATEGORIES.sightseeing;

    // Build search parameters
    const searchParams: ViatorSearchParams = {
      destination,
      startDate: date,
      categoryId,
      sortBy: 'REVIEW_AVG_RATING_D',
      currencyCode: 'AUD',
      count: 50
    };

    // Search for products using enhanced client
    const viatorResult = await enhancedViatorClient.searchViatorProducts(searchParams);
    
    if (!viatorResult.products || viatorResult.products.length === 0) {
      logger.info('[VIATOR-ACTIVITIES] No products found');
      return new Response(JSON.stringify({
        success: true,
        activities: [],
        total: 0,
        searchParams: { destination, date, participants }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Transform products to activities
    const activities = viatorResult.products.map(transformViatorToActivity);
    
    // Filter activities based on participant capacity and other criteria
    const filteredActivities = activities.filter(activity => {
      return activity.groupSize.max >= participants && activity.price > 0;
    });

    logger.info('[VIATOR-ACTIVITIES] Search successful', { 
      totalFound: viatorResult.products.length,
      filteredCount: filteredActivities.length,
      destination,
      totalCount: viatorResult.totalCount
    });

    return new Response(JSON.stringify({
      success: true,
      activities: filteredActivities,
      total: filteredActivities.length,
      searchParams: { destination, date, participants },
      provider: 'Viator',
      metadata: {
        originalResultCount: viatorResult.products.length,
        filteredResultCount: filteredActivities.length,
        totalAvailable: viatorResult.totalCount
      },
      systemStatus: enhancedViatorClient.getStatus()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[VIATOR-ACTIVITIES] Search error', { error: error.message, stack: error.stack });
    
    return new Response(JSON.stringify({
      success: false,
      error: `Viator Activities search failed: ${error.message}`,
      activities: [],
      searchParams: {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});