import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserPreferences {
  preferredCategories: string[];
  priceRange: [number, number];
  preferredDuration: string[];
  previousDestinations: string[];
  bookingHistory: any[];
}

interface RecommendationContext {
  destination?: string;
  travelDates?: [string, string];
  groupSize?: number;
  occasion?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, preferences, context, limit = 10 } = await req.json();

    console.log('Generating recommendations for user:', userId);

    // Get activities from provider rotation
    const destination = context.destination || 'sydney';
    const { data: activitiesResponse } = await supabaseClient.functions.invoke('provider-rotation', {
      body: {
        searchType: 'activity',
        params: {
          destination,
          date: new Date().toISOString().split('T')[0],
          participants: context.groupSize || 2
        }
      }
    });

    const activities = activitiesResponse?.activities || [];
    
    // Score and rank activities based on user preferences
    const recommendations = activities.map((activity: any) => {
      let score = 0.5; // Base score
      const reasons: string[] = [];
      
      // Category preference scoring
      if (preferences.preferredCategories?.includes(activity.category)) {
        score += 0.3;
        reasons.push(`Matches your interest in ${activity.category}`);
      }
      
      // Price range scoring
      const activityPrice = activity.price?.total || activity.totalPrice || 0;
      if (activityPrice >= preferences.priceRange[0] && activityPrice <= preferences.priceRange[1]) {
        score += 0.2;
        reasons.push('Within your price range');
      }
      
      // Rating boost for highly rated activities
      if (activity.rating >= 4.5) {
        score += 0.15;
        reasons.push('Highly rated by other travelers');
      }
      
      // Popular activities boost
      if (activity.reviewCount > 100) {
        score += 0.1;
        reasons.push('Popular choice');
      }
      
      // Duration preference
      if (preferences.preferredDuration?.length > 0) {
        const duration = activity.duration?.toLowerCase() || '';
        const matchesDuration = preferences.preferredDuration.some(prefDuration => {
          switch (prefDuration) {
            case '1-2 hours': return duration.includes('1 hour') || duration.includes('2 hour');
            case '3-4 hours': return duration.includes('3 hour') || duration.includes('4 hour');
            case '5-6 hours': return duration.includes('5 hour') || duration.includes('6 hour');
            case 'Full day': return duration.includes('full day') || duration.includes('8 hour');
            case 'Multi-day': return duration.includes('multi') || duration.includes('days');
            default: return false;
          }
        });
        
        if (matchesDuration) {
          score += 0.15;
          reasons.push('Matches your preferred duration');
        }
      }
      
      // Novelty bonus for new destinations
      if (!preferences.previousDestinations?.includes(destination.toLowerCase())) {
        score += 0.1;
        reasons.push('Explore a new destination');
      }
      
      // Context-based scoring
      if (context.occasion) {
        if (context.occasion === 'romantic' && activity.category === 'Food & Drink') {
          score += 0.2;
          reasons.push('Perfect for a romantic occasion');
        }
        if (context.occasion === 'adventure' && activity.category === 'Adventure') {
          score += 0.2;
          reasons.push('Great for adventure seekers');
        }
        if (context.occasion === 'family' && activity.groupSize?.max >= 4) {
          score += 0.15;
          reasons.push('Family-friendly activity');
        }
      }
      
      // Ensure score doesn't exceed 1.0
      score = Math.min(score, 1.0);
      
      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      if (score >= 0.8) confidence = 'high';
      else if (score <= 0.4) confidence = 'low';
      
      return {
        activity,
        score,
        reasons: reasons.slice(0, 3), // Limit to top 3 reasons
        confidence
      };
    });
    
    // Sort by score and limit results
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations.slice(0, limit);
    
    // Log recommendation generation for analytics
    await supabaseClient
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        activity_type: 'recommendation_generated',
        item_type: 'activity_recommendations',
        item_data: {
          count: topRecommendations.length,
          destination,
          context,
          averageScore: topRecommendations.reduce((sum, r) => sum + r.score, 0) / topRecommendations.length
        }
      })
      .select();

    return new Response(JSON.stringify({
      success: true,
      recommendations: topRecommendations,
      metadata: {
        totalActivities: activities.length,
        destination,
        generatedAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Recommendation engine error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate recommendations',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});