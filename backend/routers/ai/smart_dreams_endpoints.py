"""
Smart Dreams API Endpoints
Real AI scoring + Provider rotation enforcement
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from smart_dreams_ai_scoring import smart_dreams_scorer
from provider_rotation_enforcer import rotation_enforcer

logger = logging.getLogger(__name__)

smart_dreams_router = APIRouter(prefix="/api/smart-dreams-v2", tags=["Smart Dreams V2"])

# ============================================================================
# Pydantic Models
# ============================================================================

class DestinationScoringRequest(BaseModel):
    destination: Dict[str, Any]
    user_preferences: Dict[str, Any]
    user_context: Dict[str, Any]
    use_ai: bool = True

class BatchScoringRequest(BaseModel):
    destinations: List[Dict[str, Any]]
    user_preferences: Dict[str, Any]
    user_context: Dict[str, Any]
    use_ai_for_top_n: int = 5

class SearchWithRotationRequest(BaseModel):
    service_type: str = Field(..., description="hotels, flights, or activities")
    search_criteria: Dict[str, Any]
    correlation_id: Optional[str] = None

# ============================================================================
# Endpoints
# ============================================================================

@smart_dreams_router.post("/score-destination")
async def score_destination(request: DestinationScoringRequest):
    """
    Score a single destination using AI or deterministic logic
    
    **Features:**
    - AI-powered personality matching (GPT-4o)
    - 24-hour caching
    - Deterministic fallback
    - Explainable scores
    """
    try:
        result = await smart_dreams_scorer.calculate_personality_match(
            destination=request.destination,
            user_preferences=request.user_preferences,
            user_context=request.user_context,
            use_ai=request.use_ai
        )
        
        return {
            "success": True,
            **result
        }
    except Exception as e:
        logger.error(f"Destination scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@smart_dreams_router.post("/score-batch")
async def score_batch_destinations(request: BatchScoringRequest):
    """
    Score multiple destinations efficiently
    
    **Strategy:**
    - Deterministic scoring for all
    - AI scoring for top N (default: 5)
    - Cache all results for 24 hours
    
    **Returns:** Sorted list with AI scores for top destinations
    """
    try:
        scored = await smart_dreams_scorer.batch_score_destinations(
            destinations=request.destinations,
            user_preferences=request.user_preferences,
            user_context=request.user_context,
            use_ai_for_top_n=request.use_ai_for_top_n
        )
        
        return {
            "success": True,
            "destinations": scored,
            "total_count": len(scored),
            "ai_scored_count": min(request.use_ai_for_top_n, len(scored))
        }
    except Exception as e:
        logger.error(f"Batch scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@smart_dreams_router.post("/search-with-rotation")
async def search_with_rotation(request: SearchWithRotationRequest):
    """
    Search with enforced provider rotation
    
    **MAKU Strategy:**
    - Hotels: Sabre → HotelBeds → Amadeus → Expedia TAAP → Booking.com
    - Flights: Amadeus → Sabre → Expedia TAAP
    - Activities: Viator → GetYourGuide → Expedia TAAP
    
    **This is the ONLY allowed search method - no direct provider calls**
    """
    try:
        result = await rotation_enforcer.search_with_rotation(
            service_type=request.service_type,
            search_criteria=request.search_criteria,
            correlation_id=request.correlation_id
        )
        
        if "error" in result:
            return {
                "success": False,
                **result
            }
        
        return {
            "success": True,
            **result
        }
    except Exception as e:
        logger.error(f"Rotation search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@smart_dreams_router.get("/cache-stats")
async def get_cache_stats():
    """
    Get AI scoring cache statistics
    
    **Admin Only**
    """
    stats = smart_dreams_scorer.get_cache_stats()
    
    return {
        "success": True,
        **stats
    }

@smart_dreams_router.delete("/cache")
async def clear_cache(destination: Optional[str] = None):
    """
    Clear AI scoring cache
    
    **Admin Only**
    """
    smart_dreams_scorer.clear_cache(destination)
    
    return {
        "success": True,
        "message": f"Cache cleared for {destination or 'all destinations'}"
    }

@smart_dreams_router.get("/rotation-stats")
async def get_rotation_stats():
    """
    Get provider rotation statistics
    
    **Admin Only**
    """
    stats = rotation_enforcer.get_rotation_stats()
    
    return {
        "success": True,
        **stats
    }

@smart_dreams_router.get("/health")
async def health_check():
    """
    Smart Dreams service health check
    """
    return {
        "status": "healthy",
        "service": "Smart Dreams AI Scoring + Provider Rotation",
        "ai_enabled": smart_dreams_scorer.ai_enabled,
        "cache_stats": smart_dreams_scorer.get_cache_stats(),
        "rotation_enforced": True,
        "version": "2.0.0"
    }
