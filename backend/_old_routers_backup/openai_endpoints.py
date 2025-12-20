"""
API Endpoints for ChatGPT Pro Integration
Supports GPT-4o, o1, o3, GPT-5 series with cost tracking
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import asyncio

from openai_service import openai_service
from cost_monitor import cost_monitor
from rollout_manager import rollout_manager

logger = logging.getLogger(__name__)

openai_router = APIRouter(prefix="/api/ai-pro", tags=["OpenAI ChatGPT Pro"])

# ============================================================================
# Pydantic Models
# ============================================================================

class SmartDreamsRequest(BaseModel):
    user_input: str = Field(..., description="User's travel query")
    user_id: str
    context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict]] = None
    force_model: Optional[str] = None  # Override model selection

class TravelDNARequest(BaseModel):
    user_id: str
    bookings: List[Dict] = []
    searches: List[Dict] = []
    preferences: Dict[str, Any] = {}
    budget_range: Dict[str, float] = {"min": 0, "max": 10000}

class RecommendationsRequest(BaseModel):
    user_id: str
    budget: Optional[float] = 2000
    interests: List[str] = []
    duration: Optional[int] = 7
    travel_style: Optional[str] = "balanced"

class JourneyOptimizationRequest(BaseModel):
    user_id: str
    destination: str
    duration_days: int
    budget: float
    interests: List[str]

class CustomerSupportRequest(BaseModel):
    user_id: str
    message: str
    conversation_history: List[Dict] = []
    user_context: Dict[str, Any] = {}
    session_id: Optional[str] = None

class RolloutConfigUpdate(BaseModel):
    phase: str = Field(..., description="Phase name: admin_only, nft_holders, all_users")
    enabled: bool = True
    models_config: Optional[Dict[str, str]] = None  # Renamed from model_config

# ============================================================================
# Helper Functions
# ============================================================================

async def check_user_access(user_id: str, user_context: Dict = None) -> Dict[str, Any]:
    """
    Check if user has access to ChatGPT Pro features
    Returns access info and recommended model
    """
    # Get user role and tier from context or database
    user_role = user_context.get('role', 'user') if user_context else 'user'
    nft_tier = user_context.get('nft_tier', 'Bronze') if user_context else 'Bronze'
    
    # Check rollout phase
    access_granted = rollout_manager.check_user_access(
        user_id=user_id,
        user_role=user_role,
        nft_tier=nft_tier
    )
    
    if not access_granted['has_access']:
        return {
            'has_access': False,
            'reason': access_granted['reason'],
            'fallback_to_legacy': True
        }
    
    # Get recommended model based on tier
    recommended_model = rollout_manager.get_model_for_user(
        user_role=user_role,
        nft_tier=nft_tier
    )
    
    return {
        'has_access': True,
        'recommended_model': recommended_model,
        'phase': access_granted['phase'],
        'user_tier': nft_tier
    }

async def log_usage_and_cost(
    user_id: str,
    endpoint: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    response_time: float
):
    """
    Log usage metrics and calculate cost
    """
    try:
        cost_info = await cost_monitor.track_usage(
            user_id=user_id,
            endpoint=endpoint,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            response_time=response_time
        )
        logger.info(f"Usage tracked: {user_id} | {endpoint} | {model} | Cost: ${cost_info['cost']:.4f}")
    except Exception as e:
        logger.error(f"Failed to log usage: {e}")

# ============================================================================
# API Endpoints
# ============================================================================

@openai_router.post("/smart-dreams")
async def smart_dreams_chat(
    request: SmartDreamsRequest,
    x_user_role: Optional[str] = Header(None),
    x_nft_tier: Optional[str] = Header(None)
):
    """
    Smart Dreams AI-powered trip planning with GPT-4o
    
    **Features:**
    - Personalized trip planning
    - Budget breakdown with cashback
    - Activity recommendations
    - Contextual suggestions
    
    **Models Used:**
    - Admin/Platinum: GPT-4o or o1
    - Gold: GPT-4o
    - Silver/Bronze: GPT-4o-mini
    """
    start_time = datetime.utcnow()
    
    try:
        # Prepare user context
        user_context = request.context or {}
        user_context['role'] = x_user_role or user_context.get('role', 'user')
        user_context['nft_tier'] = x_nft_tier or user_context.get('nft_tier', 'Bronze')
        
        # Check access
        access_info = await check_user_access(request.user_id, user_context)
        
        if not access_info['has_access']:
            return {
                "success": False,
                "error": "ChatGPT Pro not available",
                "reason": access_info['reason'],
                "fallback_message": "Using standard AI assistant"
            }
        
        # Use forced model or recommended model
        model = request.force_model or access_info['recommended_model']
        
        # Call OpenAI service
        result = await openai_service.smart_dreams_analysis(
            user_input=request.user_input,
            user_context=user_context,
            conversation_history=request.conversation_history,
            model=model
        )
        
        # Calculate response time
        response_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Log usage (mock token counts for now)
        await log_usage_and_cost(
            user_id=request.user_id,
            endpoint="smart_dreams",
            model=model,
            prompt_tokens=len(request.user_input.split()) * 1.3,  # Rough estimate
            completion_tokens=len(str(result.get('response', '')).split()) * 1.3,
            response_time=response_time
        )
        
        return {
            "success": True,
            **result,
            "access_info": {
                "phase": access_info['phase'],
                "user_tier": access_info['user_tier'],
                "model_used": model
            },
            "performance": {
                "response_time_seconds": response_time
            }
        }
        
    except Exception as e:
        logger.error(f"Smart Dreams error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/travel-dna")
async def analyze_travel_dna(
    request: TravelDNARequest,
    x_user_role: Optional[str] = Header(None),
    x_nft_tier: Optional[str] = Header(None)
):
    """
    Deep Travel DNA analysis using o1 reasoning
    
    **Features:**
    - Personality profiling
    - Travel style analysis
    - Destination matching
    - Confidence scores
    
    **Best For:** Gold and Platinum tier users (uses o1 model)
    """
    start_time = datetime.utcnow()
    
    try:
        # Check access
        user_context = {'role': x_user_role or 'user', 'nft_tier': x_nft_tier or 'Bronze'}
        access_info = await check_user_access(request.user_id, user_context)
        
        if not access_info['has_access']:
            return {
                "success": False,
                "error": "Travel DNA analysis not available in current rollout phase"
            }
        
        # Prepare user data
        user_data = {
            "user_id": request.user_id,
            "bookings": request.bookings,
            "searches": request.searches,
            "preferences": request.preferences,
            "min_budget": request.budget_range.get("min", 0),
            "max_budget": request.budget_range.get("max", 10000)
        }
        
        # Call OpenAI service (always use o1 for deep analysis)
        result = await openai_service.travel_dna_analysis(user_data)
        
        # Calculate response time
        response_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Log usage
        await log_usage_and_cost(
            user_id=request.user_id,
            endpoint="travel_dna",
            model=result.get('model_used', 'o1'),
            prompt_tokens=500,  # Rough estimate
            completion_tokens=800,
            response_time=response_time
        )
        
        return {
            "success": True,
            **result,
            "performance": {
                "response_time_seconds": response_time
            }
        }
        
    except Exception as e:
        logger.error(f"Travel DNA error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/recommendations")
async def get_recommendations(
    request: RecommendationsRequest,
    x_user_role: Optional[str] = Header(None)
):
    """
    Fast recommendations using GPT-4o-mini
    
    **Features:**
    - Quick destination suggestions
    - Match scoring
    - Budget-aware filtering
    - Best time to visit
    
    **Performance:** <2 seconds response time
    """
    start_time = datetime.utcnow()
    
    try:
        context = {
            "budget": request.budget,
            "interests": request.interests,
            "duration": request.duration,
            "travel_style": request.travel_style
        }
        
        result = await openai_service.get_recommendations(
            user_id=request.user_id,
            context=context
        )
        
        response_time = (datetime.utcnow() - start_time).total_seconds()
        
        await log_usage_and_cost(
            user_id=request.user_id,
            endpoint="recommendations",
            model=result.get('model_used', 'gpt-4o-mini'),
            prompt_tokens=100,
            completion_tokens=300,
            response_time=response_time
        )
        
        return {
            "success": True,
            **result,
            "performance": {
                "response_time_seconds": response_time
            }
        }
        
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/journey-optimization")
async def optimize_journey(
    request: JourneyOptimizationRequest,
    x_nft_tier: Optional[str] = Header(None)
):
    """
    Complex journey optimization using o1
    
    **Features:**
    - Day-by-day itinerary
    - Budget optimization
    - Time management
    - Local insights
    
    **Best For:** Multi-day trips, complex planning
    **Note:** o1 model requires 45-75 seconds processing time
    """
    start_time = datetime.utcnow()
    
    try:
        result = await openai_service.optimize_journey(
            destination=request.destination,
            duration_days=request.duration_days,
            budget=request.budget,
            interests=request.interests
        )
        
        response_time = (datetime.utcnow() - start_time).total_seconds()
        
        await log_usage_and_cost(
            user_id=request.user_id,
            endpoint="journey_optimization",
            model=result.get('model_used', 'o1'),
            prompt_tokens=400,
            completion_tokens=1200,
            response_time=response_time
        )
        
        return {
            "success": True,
            **result,
            "performance": {
                "response_time_seconds": response_time,
                "note": "o1 model requires extended processing (45-75s) for deep reasoning"
            }
        }
        
    except Exception as e:
        logger.error(f"Journey optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/customer-support")
async def customer_support_chat(
    request: CustomerSupportRequest
):
    """
    Customer support chat with GPT-4o
    
    **Features:**
    - Natural conversation
    - Context-aware responses
    - User-specific help
    - Escalation support
    
    **Available:** All users (part of core support)
    """
    start_time = datetime.utcnow()
    
    try:
        response = await openai_service.customer_support_chat(
            user_message=request.message,
            conversation_history=request.conversation_history,
            user_context=request.user_context
        )
        
        response_time = (datetime.utcnow() - start_time).total_seconds()
        
        await log_usage_and_cost(
            user_id=request.user_id,
            endpoint="customer_support",
            model="gpt-4o",
            prompt_tokens=150,
            completion_tokens=200,
            response_time=response_time
        )
        
        return {
            "success": True,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "performance": {
                "response_time_seconds": response_time
            }
        }
        
    except Exception as e:
        logger.error(f"Customer support error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Admin / Monitoring Endpoints
# ============================================================================

@openai_router.get("/health")
async def health_check():
    """
    Check OpenAI integration health
    """
    rollout_status = rollout_manager.get_status()
    
    return {
        "status": "healthy" if openai_service.enabled else "disabled",
        "service": "OpenAI ChatGPT Pro",
        "default_model": openai_service.default_model,
        "api_key_configured": bool(openai_service.api_key),
        "rollout_phase": rollout_status['current_phase'],
        "enabled_for": rollout_status['enabled_for'],
        "total_users_with_access": rollout_status.get('estimated_users', 'N/A')
    }

@openai_router.get("/cost-summary")
async def get_cost_summary(
    period: str = "today",  # today, week, month, all
    user_id: Optional[str] = None
):
    """
    Get cost usage summary
    
    **Admin Only**
    """
    try:
        summary = await cost_monitor.get_summary(
            period=period,
            user_id=user_id
        )
        
        return {
            "success": True,
            "period": period,
            **summary
        }
    except Exception as e:
        logger.error(f"Cost summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.get("/cost-breakdown")
async def get_cost_breakdown(
    group_by: str = "model"  # model, endpoint, user, date
):
    """
    Get detailed cost breakdown
    
    **Admin Only**
    """
    try:
        breakdown = await cost_monitor.get_breakdown(group_by=group_by)
        
        return {
            "success": True,
            "group_by": group_by,
            **breakdown
        }
    except Exception as e:
        logger.error(f"Cost breakdown error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.get("/rollout-status")
async def get_rollout_status():
    """
    Get current rollout phase status
    
    **Admin Only**
    """
    status = rollout_manager.get_status()
    
    return {
        "success": True,
        **status
    }

@openai_router.post("/rollout-config")
async def update_rollout_config(
    config: RolloutConfigUpdate
):
    """
    Update rollout configuration
    
    **Admin Only**
    """
    try:
        result = rollout_manager.update_phase(
            phase=config.phase,
            enabled=config.enabled,
            model_config=config.models_config  # Fixed reference
        )
        
        return {
            "success": True,
            "message": f"Rollout phase '{config.phase}' updated",
            **result
        }
    except Exception as e:
        logger.error(f"Rollout config error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@openai_router.get("/usage-stats")
async def get_usage_stats(
    metric: str = "all"  # all, requests, tokens, cost, performance
):
    """
    Get usage statistics
    
    **Admin Only**
    """
    try:
        stats = await cost_monitor.get_stats(metric=metric)
        
        return {
            "success": True,
            "metric": metric,
            **stats
        }
    except Exception as e:
        logger.error(f"Usage stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
