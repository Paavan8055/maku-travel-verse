// frontend/src/services/smart-dreams-v2-orchestrator.ts
// NEW: Replaces mock orchestrator with real AI scoring + provider rotation
import { v4 as uuid } from "uuid";
import { searchWithRotation, scoreBatchDestinations } from "./smart-dreams-ai-api";

export interface SmartDreamProviderRequest {
  companionType: "solo" | "romantic" | "friends" | "family";
  destination?: string;
  dateRange?: { start: Date; end: Date };
  budget?: { min: number; max: number };
  preferences?: string[];
  travelDNA?: any;
}

export async function searchProvidersV2(request: SmartDreamProviderRequest) {
  const correlation_id = `sd_${Date.now()}_${uuid()}`;

  const search_criteria = {
    destination: request.destination || "Paris",  // Default destination
    check_in: request.dateRange?.start?.toISOString(),
    check_out: request.dateRange?.end?.toISOString(),
    guests: request.companionType === 'family' ? 4 : request.companionType === 'friends' ? 3 : 2,
    budget: request.budget,
  };

  try {
    // 1) Provider rotation (server chooses the provider)
    const rot = await searchWithRotation("hotels", search_criteria, correlation_id);

    if (!rot.success || !rot.results) {
      // Return error with correlation ID for debugging
      return {
        hotels: [],
        searchMetadata: {
          correlationId: correlation_id,
          error: rot.error || "No results from providers",
          rotationLog: rot.rotation_log || [],
        },
        aggregatedInsights: {},
      };
    }

    // 2) AI scoring for results (batch)
    const user_preferences = {
      budget: request.budget?.max || 5000,
      interests: request.preferences || [],
      companion: request.companionType,
      travelStyle: "balanced",  // TODO: wire from user profile
      duration: request.dateRange ? 
        Math.ceil((request.dateRange.end.getTime() - request.dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) : 7
    };

    const user_context = {
      travelDNA: request.travelDNA || "Explorer",
      nftTier: "Gold", // TODO: wire from auth context
    };

    const scored = await scoreBatchDestinations(rot.results || [], user_preferences, user_context);

    return {
      hotels: (scored.destinations || []).map((x: any) => ({
        id: x.id || `hotel_${Math.random().toString(36).substr(2, 9)}`,
        name: x.name || x.hotel_name || "Hotel",
        location: x.location || request.destination || "",
        price: x.price || 0,
        rating: x.rating || 0,
        aiConfidenceScore: x.personality_match || 0,
        companionSuitability: x.companion_suitability || 0,
        recommendationReasons: x.match_reasons || [],
        provider: rot.provider_used || "unknown",
        isDreamDestination: x.is_dream_destination || false,
        budgetFit: x.budget_fit || "good",
        interestAlignment: x.interest_alignment || 0,
        scoringMethod: x.scoring_method || "deterministic",
      })),
      searchMetadata: {
        correlationId: correlation_id,
        rotationLog: rot.rotation_log || [],
        providersQueried: rot.rotation_log?.map((e: any) => e.provider) || [],
        providerUsed: rot.provider_used,
        providerType: rot.provider_type,
        aiProcessingTime: 0,  // TODO: track from batch scoring
      },
      aggregatedInsights: {
        totalResults: scored.total_count || 0,
        aiScoredCount: scored.ai_scored_count || 0,
        avgPersonalityMatch: scored.destinations?.reduce((sum: number, d: any) => sum + (d.personality_match || 0), 0) / (scored.destinations?.length || 1) || 0,
        dreamDestinationsCount: scored.destinations?.filter((d: any) => d.is_dream_destination).length || 0,
      },
    };
  } catch (error: any) {
    console.error("Smart Dreams V2 search error:", error);
    
    return {
      hotels: [],
      searchMetadata: {
        correlationId: correlation_id,
        error: error.message || "Search failed",
        rotationLog: [],
      },
      aggregatedInsights: {},
    };
  }
}
