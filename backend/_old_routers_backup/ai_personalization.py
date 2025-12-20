"""
AI Personalization Engine for Maku.Travel
Provides persona-based recommendations, smart pre-fill, and journey type detection
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# Create router
personalization_router = APIRouter(prefix="/api/personalization", tags=["ai-personalization"])

# ============================================================================
# ENUMS & PERSONA DEFINITIONS
# ============================================================================

class TravelPersona(str, Enum):
    BUDGET_TRAVELER = "budget_traveler"
    LUXURY_SEEKER = "luxury_seeker"
    ADVENTURER = "adventurer"
    CULTURE_ENTHUSIAST = "culture_enthusiast"
    FAMILY_TRAVELER = "family_traveler"
    BUSINESS_TRAVELER = "business_traveler"
    WELLNESS_SEEKER = "wellness_seeker"
    FOODIE = "foodie"
    DIGITAL_NOMAD = "digital_nomad"

class JourneyType(str, Enum):
    SOLO = "solo"
    ROMANTIC = "romantic"
    FAMILY = "family"
    FRIENDS = "friends"
    BUSINESS = "business"
    GROUP = "group"

# Persona characteristics
PERSONA_PROFILES = {
    TravelPersona.BUDGET_TRAVELER: {
        "name": "Budget Traveler",
        "description": "Seeks maximum value, loves deals and off-season travel",
        "price_sensitivity": "high",
        "preferred_accommodations": ["hostel", "budget_hotel", "airbnb"],
        "avg_budget_per_day": 50,
        "preferred_activities": ["free_walking_tours", "local_markets", "hiking"],
        "booking_window_days": 90,  # Books far in advance
        "flexibility": "high"
    },
    TravelPersona.LUXURY_SEEKER: {
        "name": "Luxury Seeker",
        "description": "Prioritizes comfort, premium experiences, and exclusivity",
        "price_sensitivity": "low",
        "preferred_accommodations": ["5_star_hotel", "luxury_resort", "boutique"],
        "avg_budget_per_day": 500,
        "preferred_activities": ["fine_dining", "spa", "private_tours", "yacht"],
        "booking_window_days": 60,
        "flexibility": "medium"
    },
    TravelPersona.ADVENTURER: {
        "name": "Adventurer",
        "description": "Seeks thrills, outdoor activities, and unique experiences",
        "price_sensitivity": "medium",
        "preferred_accommodations": ["lodge", "camping", "unique_stays"],
        "avg_budget_per_day": 150,
        "preferred_activities": ["hiking", "diving", "rafting", "safari", "climbing"],
        "booking_window_days": 45,
        "flexibility": "high"
    },
    TravelPersona.CULTURE_ENTHUSIAST: {
        "name": "Culture Enthusiast",
        "description": "Loves museums, history, art, and local culture immersion",
        "price_sensitivity": "medium",
        "preferred_accommodations": ["boutique_hotel", "historic_inn", "local_guesthouse"],
        "avg_budget_per_day": 120,
        "preferred_activities": ["museums", "cultural_tours", "cooking_class", "language_exchange"],
        "booking_window_days": 60,
        "flexibility": "medium"
    },
    TravelPersona.FAMILY_TRAVELER: {
        "name": "Family Traveler",
        "description": "Travels with children, seeks family-friendly options",
        "price_sensitivity": "medium",
        "preferred_accommodations": ["family_hotel", "resort", "vacation_rental"],
        "avg_budget_per_day": 250,
        "preferred_activities": ["theme_parks", "aquarium", "zoo", "beach", "kids_activities"],
        "booking_window_days": 90,
        "flexibility": "low"  # Less flexible with kids
    },
    TravelPersona.BUSINESS_TRAVELER: {
        "name": "Business Traveler",
        "description": "Travels for work, values efficiency and convenience",
        "price_sensitivity": "low",
        "preferred_accommodations": ["business_hotel", "serviced_apartment"],
        "avg_budget_per_day": 300,
        "preferred_activities": ["networking_events", "coworking", "quick_dining"],
        "booking_window_days": 14,  # Books last minute
        "flexibility": "low"
    },
    TravelPersona.WELLNESS_SEEKER: {
        "name": "Wellness Seeker",
        "description": "Focuses on health, relaxation, and rejuvenation",
        "price_sensitivity": "medium",
        "preferred_accommodations": ["wellness_resort", "spa_hotel", "yoga_retreat"],
        "avg_budget_per_day": 200,
        "preferred_activities": ["yoga", "meditation", "spa", "hiking", "healthy_dining"],
        "booking_window_days": 60,
        "flexibility": "medium"
    },
    TravelPersona.FOODIE: {
        "name": "Foodie",
        "description": "Travels for culinary experiences and local cuisine",
        "price_sensitivity": "medium",
        "preferred_accommodations": ["boutique_hotel", "central_location"],
        "avg_budget_per_day": 180,
        "preferred_activities": ["food_tours", "cooking_class", "wine_tasting", "markets"],
        "booking_window_days": 45,
        "flexibility": "high"
    },
    TravelPersona.DIGITAL_NOMAD: {
        "name": "Digital Nomad",
        "description": "Works remotely while traveling, needs reliable wifi",
        "price_sensitivity": "medium",
        "preferred_accommodations": ["coworking_hotel", "long_term_rental", "coliving"],
        "avg_budget_per_day": 100,
        "preferred_activities": ["coworking", "cafes", "networking", "local_culture"],
        "booking_window_days": 30,
        "flexibility": "very_high"
    }
}

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class UserBehaviorData(BaseModel):
    """User behavior data for persona detection"""
    user_id: str
    past_bookings: List[Dict[str, Any]] = Field(default_factory=list)
    search_history: List[Dict[str, Any]] = Field(default_factory=list)
    price_range_searches: List[Dict[str, float]] = Field(default_factory=list)
    preferred_destinations: List[str] = Field(default_factory=list)
    activity_interactions: List[str] = Field(default_factory=list)
    avg_booking_window_days: Optional[int] = None
    avg_trip_duration_days: Optional[int] = None

class PersonaDetectionResult(BaseModel):
    """Result of persona detection"""
    primary_persona: TravelPersona
    secondary_persona: Optional[TravelPersona] = None
    confidence: float = Field(..., ge=0, le=1, description="Confidence score 0-1")
    characteristics: Dict[str, Any]
    recommendations: List[str]
    detected_at: str

class SmartPreFillRequest(BaseModel):
    """Request for smart pre-fill suggestions"""
    user_id: str
    search_type: Literal["hotel", "flight", "activity"]
    context: Optional[Dict[str, Any]] = None

class SmartPreFillResponse(BaseModel):
    """Smart pre-fill suggestions"""
    user_id: str
    search_type: str
    suggestions: Dict[str, Any]
    confidence: float
    reasoning: str
    based_on: List[str]  # What data was used

class JourneyTypeDetectionRequest(BaseModel):
    """Request for journey type detection"""
    user_id: Optional[str] = None
    search_params: Dict[str, Any]  # Current search context
    past_trips: Optional[List[Dict[str, Any]]] = None

class JourneyTypeDetectionResponse(BaseModel):
    """Journey type detection result"""
    journey_type: JourneyType
    confidence: float
    indicators: List[str]
    personalized_suggestions: List[Dict[str, Any]]

class PersonalizedRecommendationsRequest(BaseModel):
    """Request for personalized destination recommendations"""
    user_id: str
    max_results: int = Field(10, ge=1, le=50)
    filters: Optional[Dict[str, Any]] = None
    include_reasoning: bool = True

# ============================================================================
# PERSONA DETECTION
# ============================================================================

@personalization_router.post("/persona/detect")
async def detect_persona(behavior_data: UserBehaviorData) -> PersonaDetectionResult:
    """
    Detect user's travel persona based on behavior data
    
    Analyzes:
    - Booking history (price points, accommodation types)
    - Search patterns (destinations, dates, flexibility)
    - Activity preferences
    - Booking lead time
    """
    try:
        # Analyze behavior patterns
        persona_scores = {}
        
        # Price sensitivity analysis
        if behavior_data.price_range_searches:
            avg_max_price = sum(s.get('max', 0) for s in behavior_data.price_range_searches) / len(behavior_data.price_range_searches)
            if avg_max_price < 100:
                persona_scores[TravelPersona.BUDGET_TRAVELER] = persona_scores.get(TravelPersona.BUDGET_TRAVELER, 0) + 0.3
            elif avg_max_price > 400:
                persona_scores[TravelPersona.LUXURY_SEEKER] = persona_scores.get(TravelPersona.LUXURY_SEEKER, 0) + 0.3
        
        # Activity preferences analysis
        adventure_activities = ['hiking', 'diving', 'rafting', 'climbing', 'safari']
        cultural_activities = ['museum', 'art', 'history', 'cultural_tour']
        wellness_activities = ['yoga', 'spa', 'meditation', 'wellness']
        
        for activity in behavior_data.activity_interactions:
            activity_lower = activity.lower()
            if any(adv in activity_lower for adv in adventure_activities):
                persona_scores[TravelPersona.ADVENTURER] = persona_scores.get(TravelPersona.ADVENTURER, 0) + 0.2
            if any(cult in activity_lower for cult in cultural_activities):
                persona_scores[TravelPersona.CULTURE_ENTHUSIAST] = persona_scores.get(TravelPersona.CULTURE_ENTHUSIAST, 0) + 0.2
            if any(well in activity_lower for well in wellness_activities):
                persona_scores[TravelPersona.WELLNESS_SEEKER] = persona_scores.get(TravelPersona.WELLNESS_SEEKER, 0) + 0.2
        
        # Booking window analysis
        if behavior_data.avg_booking_window_days:
            if behavior_data.avg_booking_window_days > 60:
                persona_scores[TravelPersona.BUDGET_TRAVELER] = persona_scores.get(TravelPersona.BUDGET_TRAVELER, 0) + 0.2
            elif behavior_data.avg_booking_window_days < 21:
                persona_scores[TravelPersona.BUSINESS_TRAVELER] = persona_scores.get(TravelPersona.BUSINESS_TRAVELER, 0) + 0.2
        
        # Default if no clear signals
        if not persona_scores:
            persona_scores[TravelPersona.CULTURE_ENTHUSIAST] = 0.5
        
        # Get top 2 personas
        sorted_personas = sorted(persona_scores.items(), key=lambda x: x[1], reverse=True)
        primary_persona = sorted_personas[0][0]
        secondary_persona = sorted_personas[1][0] if len(sorted_personas) > 1 else None
        
        # Calculate confidence
        total_score = sum(persona_scores.values())
        confidence = sorted_personas[0][1] / total_score if total_score > 0 else 0.5
        
        # Get characteristics
        characteristics = PERSONA_PROFILES[primary_persona]
        
        # Generate recommendations
        recommendations = [
            f"Consider destinations popular with {characteristics['name']}s",
            f"Your typical budget: ${characteristics['avg_budget_per_day']}/day",
            f"Recommended booking window: {characteristics['booking_window_days']} days in advance"
        ]
        
        return PersonaDetectionResult(
            primary_persona=primary_persona,
            secondary_persona=secondary_persona,
            confidence=confidence,
            characteristics=characteristics,
            recommendations=recommendations,
            detected_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Persona detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SMART PRE-FILL
# ============================================================================

@personalization_router.post("/smart-prefill")
async def smart_prefill(request: SmartPreFillRequest) -> SmartPreFillResponse:
    """
    Generate smart pre-fill suggestions based on user history
    
    Features:
    - Destination suggestions from past searches
    - Date range suggestions (preferred travel times)
    - Guest count suggestions (typical group size)
    - Budget suggestions (typical spending)
    """
    try:
        # TODO: Fetch actual user data from database
        # For now, generate intelligent mock suggestions
        
        suggestions = {}
        reasoning_parts = []
        based_on = []
        
        if request.search_type == "hotel":
            # Hotel pre-fill suggestions
            suggestions = {
                "destination": "Paris",
                "checkin": (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d'),
                "checkout": (datetime.now() + timedelta(days=67)).strftime('%Y-%m-%d'),
                "guests": {"adults": 2, "children": 0},
                "rooms": 1,
                "price_range": {"min": 100, "max": 250, "currency": "USD"},
                "star_rating": [4, 5],
                "amenities": ["wifi", "breakfast"]
            }
            reasoning_parts.append("Based on your past 5 Paris searches")
            reasoning_parts.append("You typically book 7-night stays")
            reasoning_parts.append("Your usual budget is $100-$250/night")
            based_on = ["search_history", "booking_patterns", "price_preferences"]
            
        elif request.search_type == "flight":
            # Flight pre-fill suggestions
            suggestions = {
                "search_type": "round-trip",
                "origin": "NYC",
                "destination": "LON",
                "departure_date": (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d'),
                "return_date": (datetime.now() + timedelta(days=67)).strftime('%Y-%m-%d'),
                "passengers": {"adults": 2, "children": 0, "infants": 0},
                "cabin_class": "economy",
                "max_stops": 1,
                "preferred_airlines": ["Delta", "United"]
            }
            reasoning_parts.append("You frequently search NYC-LON routes")
            reasoning_parts.append("You prefer direct or 1-stop flights")
            reasoning_parts.append("You typically fly economy with Delta/United")
            based_on = ["search_history", "airline_preferences", "route_patterns"]
            
        elif request.search_type == "activity":
            # Activity pre-fill suggestions
            suggestions = {
                "destination": "Paris",
                "start_date": (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d'),
                "end_date": (datetime.now() + timedelta(days=67)).strftime('%Y-%m-%d'),
                "participants": {"adults": 2, "children": 0},
                "categories": ["cultural", "food"],
                "price_range": {"min": 0, "max": 150, "currency": "USD"},
                "duration_hours": {"min": 2, "max": 6}
            }
            reasoning_parts.append("You enjoy cultural and food experiences")
            reasoning_parts.append("You prefer 2-6 hour activities")
            reasoning_parts.append("Your typical activity budget: $0-$150")
            based_on = ["activity_history", "category_preferences", "duration_patterns"]
        
        reasoning = ". ".join(reasoning_parts)
        confidence = 0.85  # High confidence with sufficient history
        
        return SmartPreFillResponse(
            user_id=request.user_id,
            search_type=request.search_type,
            suggestions=suggestions,
            confidence=confidence,
            reasoning=reasoning,
            based_on=based_on
        )
        
    except Exception as e:
        logger.error(f"Smart pre-fill failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# JOURNEY TYPE DETECTION
# ============================================================================

@personalization_router.post("/journey-type/detect")
async def detect_journey_type(request: JourneyTypeDetectionRequest) -> JourneyTypeDetectionResponse:
    """
    Detect journey type (solo, romantic, family, etc.) based on search params
    
    Analyzes:
    - Guest/passenger counts
    - Activity preferences
    - Accommodation searches
    - Past trip patterns
    """
    try:
        indicators = []
        confidence = 0.7
        
        # Analyze guest counts
        guests = request.search_params.get('guests', {})
        adults = guests.get('adults', 1)
        children = guests.get('children', 0)
        
        # Determine journey type
        if children > 0:
            journey_type = JourneyType.FAMILY
            indicators.append(f"Traveling with {children} child(ren)")
            confidence = 0.9
        elif adults == 1:
            journey_type = JourneyType.SOLO
            indicators.append("Single traveler")
            confidence = 0.85
        elif adults == 2:
            # Check for romantic indicators
            destination = request.search_params.get('destination', '').lower()
            romantic_destinations = ['paris', 'santorini', 'bali', 'maldives', 'venice']
            if any(dest in destination for dest in romantic_destinations):
                journey_type = JourneyType.ROMANTIC
                indicators.append("Romantic destination")
                indicators.append("2 adults")
                confidence = 0.8
            else:
                journey_type = JourneyType.FRIENDS
                indicators.append("2 travelers")
                confidence = 0.6
        elif adults >= 5:
            journey_type = JourneyType.GROUP
            indicators.append(f"Large group ({adults} adults)")
            confidence = 0.85
        else:
            journey_type = JourneyType.FRIENDS
            indicators.append(f"{adults} travelers")
            confidence = 0.7
        
        # Generate personalized suggestions
        suggestions = []
        
        if journey_type == JourneyType.ROMANTIC:
            suggestions = [
                {"type": "activity", "suggestion": "Couples spa treatment", "relevance": 0.9},
                {"type": "accommodation", "suggestion": "Romantic hotel with views", "relevance": 0.85},
                {"type": "dining", "suggestion": "Fine dining reservations", "relevance": 0.8}
            ]
        elif journey_type == JourneyType.FAMILY:
            suggestions = [
                {"type": "activity", "suggestion": "Family-friendly attractions", "relevance": 0.95},
                {"type": "accommodation", "suggestion": "Hotel with kids club", "relevance": 0.9},
                {"type": "dining", "suggestion": "Restaurants with kids menu", "relevance": 0.85}
            ]
        elif journey_type == JourneyType.SOLO:
            suggestions = [
                {"type": "activity", "suggestion": "Group tours for solo travelers", "relevance": 0.85},
                {"type": "accommodation", "suggestion": "Social hostels or boutique hotels", "relevance": 0.8},
                {"type": "experience", "suggestion": "Meet local travelers", "relevance": 0.75}
            ]
        elif journey_type == JourneyType.GROUP:
            suggestions = [
                {"type": "activity", "suggestion": "Group activities and adventures", "relevance": 0.9},
                {"type": "accommodation", "suggestion": "Vacation rentals for groups", "relevance": 0.85},
                {"type": "transportation", "suggestion": "Group transfer options", "relevance": 0.8}
            ]
        
        return JourneyTypeDetectionResponse(
            journey_type=journey_type,
            confidence=confidence,
            indicators=indicators,
            personalized_suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"Journey type detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# PERSONALIZED RECOMMENDATIONS
# ============================================================================

@personalization_router.post("/recommendations/personalized")
async def get_personalized_recommendations(request: PersonalizedRecommendationsRequest):
    """
    Get personalized destination recommendations based on user persona and history
    
    Features:
    - AI-powered destination matching
    - Persona-aligned suggestions
    - Budget-appropriate options
    - Season-aware recommendations
    """
    try:
        # TODO: Integrate with Smart Dreams V2 AI scoring for real personalization
        
        # Generate mock personalized recommendations
        recommendations = []
        
        for i in range(1, request.max_results + 1):
            destination = {
                "destination_id": f"dest_{i}",
                "name": ["Paris", "Tokyo", "Bali", "Santorini", "New York", "Barcelona", "Dubai", "Iceland", "Thailand", "Portugal"][i - 1],
                "country": ["France", "Japan", "Indonesia", "Greece", "USA", "Spain", "UAE", "Iceland", "Thailand", "Portugal"][i - 1],
                "personalization_score": 0.95 - (i * 0.03),
                "match_reasons": [
                    "Matches your culture enthusiast profile",
                    "Within your typical budget range",
                    "Popular in your preferred season"
                ],
                "estimated_budget": {
                    "daily_min": 80 + (i * 10),
                    "daily_max": 200 + (i * 20),
                    "currency": "USD"
                },
                "best_time_to_visit": "April-October",
                "persona_fit": "high",
                "similar_travelers_rating": 4.5 + (i * 0.05)
            }
            
            if request.include_reasoning:
                destination["reasoning"] = f"Based on your past trips and interests, {destination['name']} offers similar experiences you've enjoyed before. The budget aligns with your typical spending, and the cultural activities match your preferences."
            
            recommendations.append(destination)
        
        return {
            "success": True,
            "user_id": request.user_id,
            "recommendations": recommendations[:request.max_results],
            "personalization_applied": True,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Personalized recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# PERSONA UTILITIES
# ============================================================================

@personalization_router.get("/personas/all")
async def get_all_personas():
    """Get all available travel personas with descriptions"""
    try:
        return {
            "success": True,
            "personas": [
                {
                    "id": persona.value,
                    "profile": PERSONA_PROFILES[persona]
                }
                for persona in TravelPersona
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get personas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@personalization_router.get("/journey-types/all")
async def get_all_journey_types():
    """Get all available journey types"""
    try:
        return {
            "success": True,
            "journey_types": [
                {
                    "id": jt.value,
                    "name": jt.value.replace('_', ' ').title(),
                    "description": f"Travel as {jt.value.replace('_', ' ')}"
                }
                for jt in JourneyType
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get journey types: {e}")
        raise HTTPException(status_code=500, detail=str(e))
