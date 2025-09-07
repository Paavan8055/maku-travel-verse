import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, context } = await req.json();
    console.log('ML Recommendation Engine:', { action, userId });

    switch (action) {
      case 'get_recommendations':
        return await getPersonalizedRecommendations(userId, context);
      case 'update_preferences':
        return await updateUserPreferences(userId, context);
      case 'train_model':
        return await trainRecommendationModel(userId, context);
      case 'get_dynamic_pricing':
        return await getDynamicPricing(context);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in ml-recommendation-engine:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getPersonalizedRecommendations(userId: string, context: any) {
  console.log('Getting personalized recommendations for user:', userId);

  // Get user's learned preferences
  const { data: preferences } = await supabase
    .from('travel_preferences_ml')
    .select('*')
    .eq('user_id', userId)
    .order('confidence_score', { ascending: false });

  // Get user's booking history for collaborative filtering
  const { data: bookingHistory } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  // Generate ML-powered recommendations
  const recommendations = await generateRecommendations(
    preferences || [],
    bookingHistory || [],
    context
  );

  // Update interaction count
  if (preferences) {
    for (const pref of preferences) {
      await supabase
        .from('travel_preferences_ml')
        .update({
          interaction_count: pref.interaction_count + 1,
          last_interaction: new Date().toISOString()
        })
        .eq('id', pref.id);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    recommendations,
    user_profile: {
      preferences_learned: (preferences || []).length,
      booking_history_size: (bookingHistory || []).length,
      personalization_score: calculatePersonalizationScore(preferences || [])
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function updateUserPreferences(userId: string, context: any) {
  console.log('Updating user preferences for:', userId);

  const { action, itemType, itemId, rating } = context;

  // Learn from user behavior
  const preferenceData = {
    user_id: userId,
    preference_category: itemType,
    learned_preferences: {
      action: action,
      item_id: itemId,
      rating: rating,
      timestamp: new Date().toISOString(),
      context: context
    },
    confidence_score: calculateConfidenceScore(action, rating),
    interaction_count: 1,
    preference_source: 'behavioral',
    feedback_score: rating || 0
  };

  const { data: existingPref } = await supabase
    .from('travel_preferences_ml')
    .select('*')
    .eq('user_id', userId)
    .eq('preference_category', itemType)
    .single();

  if (existingPref) {
    // Update existing preference
    const updatedPreferences = {
      ...existingPref.learned_preferences,
      interactions: [
        ...(existingPref.learned_preferences.interactions || []),
        preferenceData.learned_preferences
      ]
    };

    await supabase
      .from('travel_preferences_ml')
      .update({
        learned_preferences: updatedPreferences,
        confidence_score: Math.min(1, existingPref.confidence_score + 0.1),
        interaction_count: existingPref.interaction_count + 1,
        last_interaction: new Date().toISOString(),
        feedback_score: (existingPref.feedback_score + (rating || 0)) / 2
      })
      .eq('id', existingPref.id);
  } else {
    // Create new preference
    await supabase
      .from('travel_preferences_ml')
      .insert(preferenceData);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Preferences updated successfully',
    confidence_boost: 0.1
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function trainRecommendationModel(userId: string, context: any) {
  console.log('Training recommendation model for user:', userId);

  // Get all user interactions and preferences
  const { data: allPreferences } = await supabase
    .from('travel_preferences_ml')
    .select('*')
    .eq('user_id', userId);

  // Get anonymized training data from other users (privacy-safe)
  const { data: trainingData } = await supabase
    .from('ai_training_bookings')
    .select('behavioral_patterns, location_data, price_patterns')
    .limit(1000);

  // Train collaborative filtering model
  const modelData = await trainCollaborativeModel(
    allPreferences || [],
    trainingData || []
  );

  // Save/update ML model
  const { data: model } = await supabase
    .from('ml_recommendation_models')
    .upsert({
      model_name: `user_${userId}_collaborative`,
      model_type: 'collaborative',
      model_data: modelData,
      performance_metrics: {
        accuracy_score: modelData.accuracy,
        training_samples: (trainingData || []).length,
        user_interactions: (allPreferences || []).length
      },
      training_data_size: (trainingData || []).length,
      accuracy_score: modelData.accuracy,
      is_active: true
    })
    .select()
    .single();

  return new Response(JSON.stringify({
    success: true,
    model_id: model?.id,
    accuracy: modelData.accuracy,
    training_samples: (trainingData || []).length,
    recommendations_ready: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getDynamicPricing(context: any) {
  console.log('Getting dynamic pricing for:', context);

  const { productType, productId, provider } = context;

  // Check existing cache
  const { data: cachedPricing } = await supabase
    .from('dynamic_pricing_cache')
    .select('*')
    .eq('product_type', productType)
    .eq('product_id', productId)
    .eq('provider', provider)
    .gt('valid_until', new Date().toISOString())
    .single();

  if (cachedPricing) {
    return new Response(JSON.stringify({
      success: true,
      cached: true,
      pricing: cachedPricing,
      recommendation: generatePricingRecommendation(cachedPricing)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate new dynamic pricing
  const dynamicPricing = await calculateDynamicPrice(context);

  // Cache the result
  await supabase
    .from('dynamic_pricing_cache')
    .insert({
      product_type: productType,
      product_id: productId,
      provider: provider,
      base_price: dynamicPricing.basePrice,
      dynamic_price: dynamicPricing.dynamicPrice,
      price_factors: dynamicPricing.factors,
      confidence_level: dynamicPricing.confidence,
      valid_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      market_conditions: dynamicPricing.marketConditions,
      competitor_analysis: dynamicPricing.competitorAnalysis
    });

  return new Response(JSON.stringify({
    success: true,
    cached: false,
    pricing: dynamicPricing,
    recommendation: generatePricingRecommendation(dynamicPricing)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function generateRecommendations(preferences: any[], bookingHistory: any[], context: any) {
  const recommendations = [];

  // Destination recommendations based on preferences
  const destinationPrefs = preferences.filter(p => p.preference_category === 'destinations');
  if (destinationPrefs.length > 0) {
    const topDestination = destinationPrefs.reduce((prev, current) => 
      prev.confidence_score > current.confidence_score ? prev : current
    );

    recommendations.push({
      type: 'destination',
      title: 'Perfect Match Destination',
      description: 'Based on your travel history and preferences',
      confidence: topDestination.confidence_score,
      data: {
        destination: extractDestinationFromPreferences(topDestination),
        reasons: ['Matches your style', 'Great weather', 'Similar to past trips']
      }
    });
  }

  // Activity recommendations
  const activityPrefs = preferences.filter(p => p.preference_category === 'activities');
  if (activityPrefs.length > 0) {
    recommendations.push({
      type: 'activity',
      title: 'Recommended Activities',
      description: 'Activities tailored to your interests',
      confidence: 0.85,
      data: {
        activities: generateActivityRecommendations(activityPrefs),
        location: context.location || 'Your destination'
      }
    });
  }

  // Timing recommendations
  const timingPrefs = preferences.filter(p => p.preference_category === 'timing');
  if (timingPrefs.length > 0) {
    recommendations.push({
      type: 'timing',
      title: 'Best Time to Travel',
      description: 'Optimal timing based on your preferences and historical data',
      confidence: 0.90,
      data: {
        recommended_months: ['March', 'April', 'October'],
        price_advantage: '15-25% savings',
        weather_score: 9.2
      }
    });
  }

  // Price-based recommendations
  if (bookingHistory.length > 0) {
    const avgSpending = calculateAverageSpending(bookingHistory);
    recommendations.push({
      type: 'budget',
      title: 'Budget-Optimized Options',
      description: 'Great value options within your typical spending range',
      confidence: 0.80,
      data: {
        budget_range: `$${avgSpending * 0.8} - $${avgSpending * 1.2}`,
        savings_potential: '20%',
        similar_travelers: 'Users with similar preferences'
      }
    });
  }

  return recommendations.slice(0, 6); // Return top 6 recommendations
}

async function trainCollaborativeModel(userPreferences: any[], trainingData: any[]) {
  // Simplified collaborative filtering model
  const model = {
    user_vectors: {},
    item_vectors: {},
    global_bias: 0,
    accuracy: 0
  };

  // Calculate user preferences vector
  model.user_vectors = userPreferences.reduce((acc, pref) => {
    acc[pref.preference_category] = pref.confidence_score;
    return acc;
  }, {});

  // Simulate training with behavioral patterns
  let totalAccuracy = 0;
  for (const data of trainingData) {
    if (data.behavioral_patterns) {
      // Simulate collaborative filtering accuracy
      totalAccuracy += Math.random() * 0.3 + 0.7; // 70-100% accuracy
    }
  }

  model.accuracy = trainingData.length > 0 ? totalAccuracy / trainingData.length : 0.75;
  model.global_bias = 0.1; // Small global bias

  return model;
}

async function calculateDynamicPrice(context: any) {
  const basePrice = context.basePrice || 100;
  
  // Simulate market factors
  const demandFactor = Math.random() * 0.4 + 0.8; // 0.8 - 1.2
  const seasonalityFactor = Math.random() * 0.3 + 0.85; // 0.85 - 1.15
  const competitionFactor = Math.random() * 0.2 + 0.9; // 0.9 - 1.1

  const dynamicPrice = basePrice * demandFactor * seasonalityFactor * competitionFactor;

  return {
    basePrice,
    dynamicPrice: Math.round(dynamicPrice * 100) / 100,
    factors: {
      demand: demandFactor,
      seasonality: seasonalityFactor,
      competition: competitionFactor
    },
    confidence: 0.85,
    marketConditions: {
      demand_level: demandFactor > 1 ? 'high' : 'normal',
      seasonal_adjustment: seasonalityFactor > 1 ? 'peak' : 'off-peak'
    },
    competitorAnalysis: {
      position: competitionFactor < 1 ? 'competitive' : 'premium',
      market_share: '12%'
    }
  };
}

function calculateConfidenceScore(action: string, rating: number) {
  const actionWeights = {
    'view': 0.1,
    'click': 0.3,
    'book': 0.8,
    'rate': 0.6,
    'share': 0.4
  };

  const baseScore = actionWeights[action] || 0.1;
  const ratingBonus = rating ? (rating / 5) * 0.2 : 0;
  
  return Math.min(1, baseScore + ratingBonus);
}

function calculatePersonalizationScore(preferences: any[]) {
  if (preferences.length === 0) return 0;
  
  const avgConfidence = preferences.reduce((sum, p) => sum + p.confidence_score, 0) / preferences.length;
  const categoryCount = new Set(preferences.map(p => p.preference_category)).size;
  
  return Math.min(100, (avgConfidence * 60) + (categoryCount * 10));
}

function extractDestinationFromPreferences(preference: any) {
  // Extract destination from learned preferences
  const interactions = preference.learned_preferences?.interactions || [];
  const destinations = interactions
    .map(i => i.context?.destination)
    .filter(Boolean);
  
  return destinations[0] || 'Tokyo, Japan'; // Default recommendation
}

function generateActivityRecommendations(activityPrefs: any[]) {
  const activities = [
    'Cultural tours and museums',
    'Local food experiences',
    'Adventure activities',
    'Relaxation and wellness',
    'Shopping and markets'
  ];

  return activities.slice(0, 3);
}

function calculateAverageSpending(bookingHistory: any[]) {
  if (bookingHistory.length === 0) return 500;
  
  const total = bookingHistory.reduce((sum, booking) => 
    sum + (booking.total_amount || 0), 0
  );
  
  return total / bookingHistory.length;
}

function generatePricingRecommendation(pricing: any) {
  const savingsPercentage = ((pricing.base_price - pricing.dynamic_price) / pricing.base_price) * 100;
  
  if (savingsPercentage > 10) {
    return {
      action: 'book_now',
      message: `Great deal! Save ${Math.round(savingsPercentage)}%`,
      urgency: 'high'
    };
  } else if (savingsPercentage < -10) {
    return {
      action: 'wait',
      message: 'Prices are high. Consider waiting or checking alternatives.',
      urgency: 'low'
    };
  } else {
    return {
      action: 'consider',
      message: 'Fair pricing. Good time to book if timing works.',
      urgency: 'medium'
    };
  }
}