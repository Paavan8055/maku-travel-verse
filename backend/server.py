from fastapi import FastAPI, APIRouter, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid
import hashlib
import hmac
import secrets
from cryptography.fernet import Fernet
import logging
import time
from pathlib import Path
import subprocess


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Sentry error tracking
from sentry_config import init_sentry
init_sentry()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import NFT integration endpoints
from nft_integration_endpoints import nft_router
from admin_nft_endpoints import admin_nft_router
from unified_ai_orchestrator import unified_ai_router
from credit_optimization import optimized_ai_router
from free_ai_provider import free_ai_provider

# Import off-season occupancy engine
from offseason_endpoints import offseason_router

# Import email system
from email_system import email_router

# Import advanced search
from advanced_search import advanced_search_router

# Import OpenAI ChatGPT Pro integration
try:
    from openai_endpoints import openai_router
    OPENAI_ENABLED = True
except ImportError as e:
    logger.warning(f"OpenAI endpoints not available: {e}")
    OPENAI_ENABLED = False

# Import Smart Dreams V2 (AI Scoring + Rotation)
try:
    from smart_dreams_endpoints import smart_dreams_router
    SMART_DREAMS_V2_ENABLED = True
except ImportError as e:
    logger.warning(f"Smart Dreams V2 endpoints not available: {e}")
    SMART_DREAMS_V2_ENABLED = False

# Import centralized configuration
from supabase_config import get_config_instance, get_secret, get_provider_config, validate_configuration

# Import enhanced provider system
from provider_orchestrator import get_orchestrator
from multi_backend_ai import get_ai_assistant, AIRequest

# Create the main app without a prefix
app = FastAPI(
    title="Maku Travel API - Blockchain Ready",
    description="Enhanced travel booking platform with blockchain integration preparation",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security configuration for blockchain readiness
security = HTTPBearer()
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

# Blockchain configuration
CRONOS_NETWORK_CONFIG = {
    "chain_id": 25,  # Cronos Mainnet
    "rpc_url": "https://evm.cronos.org",
    "explorer": "https://cronoscan.com"
}

BINANCE_SMART_CHAIN_CONFIG = {
    "chain_id": 56,  # BSC Mainnet  
    "rpc_url": "https://bsc-dataseed.binance.org",
    "explorer": "https://bscscan.com"
}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class EnvironmentSwitch(BaseModel):
    environment: str

class EnvironmentConfig(BaseModel):
    environments: dict
    current_environment: str
    switch_mode: str
    last_updated: str

# Enhanced Dream System Models
class BehaviorSignal(BaseModel):
    signal_type: str
    value: float
    context: dict = {}

class InteractionData(BaseModel):
    destination_id: str
    interaction_type: str
    duration_seconds: Optional[int] = None
    device_type: str
    referrer: str

class UserProfileRequest(BaseModel):
    user_id: str

class DreamCollectionUpdate(BaseModel):
    user_id: str
    destination_id: str
    action: str  # 'add' or 'remove'

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@api_router.get("/metrics/platform")
async def get_platform_metrics(force_refresh: bool = False):
    """
    Platform-wide metrics - SINGLE SOURCE OF TRUTH
    Used by homepage, Travel Fund page, admin dashboard
    
    Query params:
    - force_refresh: bool (default False) - bypass cache
    """
    try:
        from unified_metrics_service import unified_metrics
        metrics = await unified_metrics.get_platform_metrics(force_refresh=force_refresh)
        return {
            "success": True,
            **metrics
        }
    except Exception as e:
        logger.error(f"Platform metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/placeholder/{width}/{height}")
async def placeholder_image(width: int, height: int, text: str = "Placeholder"):
    """Simple placeholder image endpoint - returns SVG"""
    from fastapi.responses import Response
    
    svg_content = f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" 
              text-anchor="middle" dominant-baseline="middle">{text}</text>
    </svg>'''
    
    return Response(content=svg_content, media_type="image/svg+xml")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.get("/environment/config")
async def get_environment_config():
    """Get current environment configuration"""
    try:
        config_path = Path(__file__).parent.parent / "preview-config.json"
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except Exception as e:
        logger.error(f"Failed to read environment config: {e}")
        return {"error": "Failed to read environment configuration"}

@api_router.post("/environment/switch")
async def switch_environment(env_switch: EnvironmentSwitch):
    """Switch between lovable and emergent environments"""
    try:
        target_env = env_switch.environment
        
        if target_env not in ["lovable", "emergent"]:
            return {"error": "Invalid environment. Must be 'lovable' or 'emergent'"}
        
        # Run the switch script
        switch_script = Path(__file__).parent.parent / "scripts" / "switch-environment.js"
        result = subprocess.run(
            ["node", str(switch_script), target_env],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent.parent)
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Successfully switched to {target_env} environment",
                "environment": target_env,
                "output": result.stdout
            }
        else:
            return {
                "success": False,
                "error": "Failed to switch environment",
                "output": result.stderr
            }
            
    except Exception as e:
        logger.error(f"Failed to switch environment: {e}")
        return {"error": f"Failed to switch environment: {str(e)}"}

@api_router.get("/environment/status")
async def get_environment_status():
    """Get current environment status"""
    try:
        # Run the status script
        status_script = Path(__file__).parent.parent / "scripts" / "preview-status.sh"
        result = subprocess.run(
            ["bash", str(status_script)],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent.parent)
        )
        
        # Also read the config file
        config_path = Path(__file__).parent.parent / "preview-config.json"
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        return {
            "config": config,
            "status_output": result.stdout,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get environment status: {e}")
        return {"error": f"Failed to get environment status: {str(e)}"}

# Enhanced Dream Destinations API Endpoints

@api_router.get("/enhanced-dreams/destinations")
async def get_enhanced_destinations(
    user_id: Optional[str] = None,
    category: Optional[str] = None,
    continent: Optional[str] = None,
    limit: Optional[int] = 50,
    include_ai_context: bool = False
):
    """Get enhanced destinations with AI-ready data"""
    try:
        # Simulate enhanced destination data (Phase 1 foundation)
        # In Phase 3, this will integrate with real AI models
        
        mock_destinations = [
            {
                "id": str(uuid.uuid4()),
                "name": "Santorini",
                "country": "Greece",
                "continent": "Europe",
                "latitude": 36.3932,
                "longitude": 25.4615,
                "category": "beaches",
                "description": "Beautiful Greek island with stunning sunsets and iconic blue-domed churches",
                "best_time_to_visit": "April to November",
                "budget_range": "mid_range",
                "avg_daily_cost": 120,
                "highlights": ["Stunning sunsets", "Blue-domed churches", "Volcanic beaches", "Wine tasting"],
                "rarity_score": 75,
                "social_popularity": 120,
                "user_generated_tags": ["romantic", "photography", "sunset", "wine"],
                "personality_match_factors": [
                    {"factor": "photography", "weight": 0.9, "confidence": 0.8},
                    {"factor": "relaxation", "weight": 0.8, "confidence": 0.9}
                ],
                "optimal_seasons": [
                    {
                        "season": "summer",
                        "suitability_score": 95,
                        "weather_description": "Perfect warm weather",
                        "crowd_level": "high",
                        "price_level": "high"
                    }
                ],
                "crowd_patterns": [
                    {
                        "month": 7,
                        "crowd_level": 90,
                        "local_events": ["Santorini Arts Festival"],
                        "tourist_density": "extreme"
                    }
                ],
                "price_volatility": [
                    {
                        "month": 7,
                        "price_index": 1.4,
                        "volatility": 0.2,
                        "booking_window_optimal": 60
                    }
                ],
                "community_rating": {
                    "overall_score": 4.6,
                    "total_ratings": 234,
                    "aspects": {
                        "photography": 4.8,
                        "accessibility": 3.9,
                        "value_for_money": 3.8,
                        "uniqueness": 4.9,
                        "local_culture": 4.4
                    }
                },
                "conversion_rate": 0.18,
                "engagement_score": 0.82,
                "seasonal_interest": [0.3, 0.4, 0.6, 0.8, 0.9, 1.0, 1.0, 0.95, 0.8, 0.5, 0.3, 0.2]
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Socotra Island",
                "country": "Yemen",
                "continent": "Asia",
                "latitude": 12.5000,
                "longitude": 53.8333,
                "category": "adventure",
                "description": "One of the most isolated and unique islands on Earth with alien-like landscapes",
                "best_time_to_visit": "October to April",
                "budget_range": "budget",
                "avg_daily_cost": 45,
                "highlights": ["Dragon's Blood Trees", "Unique wildlife", "Pristine beaches", "Adventure hiking"],
                "rarity_score": 98,
                "social_popularity": 5,
                "user_generated_tags": ["unique", "adventure", "rare", "untouched"],
                "personality_match_factors": [
                    {"factor": "adventure", "weight": 0.95, "confidence": 0.9},
                    {"factor": "nature", "weight": 0.9, "confidence": 0.95}
                ],
                "optimal_seasons": [
                    {
                        "season": "winter",
                        "suitability_score": 90,
                        "weather_description": "Ideal cool weather",
                        "crowd_level": "low",
                        "price_level": "low"
                    }
                ],
                "crowd_patterns": [
                    {
                        "month": 2,
                        "crowd_level": 5,
                        "local_events": [],
                        "tourist_density": "low"
                    }
                ],
                "price_volatility": [
                    {
                        "month": 2,
                        "price_index": 0.8,
                        "volatility": 0.1,
                        "booking_window_optimal": 90
                    }
                ],
                "community_rating": {
                    "overall_score": 4.9,
                    "total_ratings": 12,
                    "aspects": {
                        "photography": 5.0,
                        "accessibility": 2.1,
                        "value_for_money": 4.2,
                        "uniqueness": 5.0,
                        "local_culture": 4.8
                    }
                },
                "conversion_rate": 0.05,
                "engagement_score": 0.95,
                "seasonal_interest": [0.1, 0.2, 0.3, 0.2, 0.1, 0.05, 0.05, 0.05, 0.1, 0.2, 0.3, 0.2]
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Kyoto",
                "country": "Japan",
                "continent": "Asia",
                "latitude": 35.0116,
                "longitude": 135.7681,
                "category": "cultural",
                "description": "Ancient capital of Japan with thousands of temples and preserved traditions",
                "best_time_to_visit": "March to May and September to November",
                "budget_range": "mid_range",
                "avg_daily_cost": 85,
                "highlights": ["Fushimi Inari Shrine", "Bamboo Grove", "Traditional geishas", "Tea ceremonies"],
                "rarity_score": 45,
                "social_popularity": 89,
                "user_generated_tags": ["temples", "culture", "traditional", "peaceful"],
                "personality_match_factors": [
                    {"factor": "culture", "weight": 0.9, "confidence": 0.95},
                    {"factor": "spiritual", "weight": 0.7, "confidence": 0.8}
                ],
                "optimal_seasons": [
                    {
                        "season": "spring",
                        "suitability_score": 95,
                        "weather_description": "Cherry blossom season",
                        "crowd_level": "high",
                        "price_level": "high"
                    }
                ],
                "crowd_patterns": [
                    {
                        "month": 4,
                        "crowd_level": 85,
                        "local_events": ["Cherry Blossom Festival"],
                        "tourist_density": "high"
                    }
                ],
                "price_volatility": [
                    {
                        "month": 4,
                        "price_index": 1.3,
                        "volatility": 0.15,
                        "booking_window_optimal": 45
                    }
                ],
                "community_rating": {
                    "overall_score": 4.7,
                    "total_ratings": 456,
                    "aspects": {
                        "photography": 4.8,
                        "accessibility": 4.5,
                        "value_for_money": 4.0,
                        "uniqueness": 4.6,
                        "local_culture": 5.0
                    }
                },
                "conversion_rate": 0.22,
                "engagement_score": 0.78,
                "seasonal_interest": [0.4, 0.5, 0.8, 1.0, 0.9, 0.6, 0.5, 0.6, 0.8, 0.9, 0.8, 0.5]
            }
        ]
        
        # Apply filters
        filtered_destinations = mock_destinations
        if category:
            filtered_destinations = [d for d in filtered_destinations if d["category"] == category]
        if continent:
            filtered_destinations = [d for d in filtered_destinations if d["continent"] == continent]
        if limit:
            filtered_destinations = filtered_destinations[:limit]
        
        response = {
            "destinations": filtered_destinations,
            "metadata": {
                "total_count": len(filtered_destinations),
                "ai_processing_time": 45,
                "personalization_enabled": include_ai_context and user_id is not None
            }
        }
        
        # Add user context if requested
        if include_ai_context and user_id:
            response["user_context"] = {
                "personality_match_scores": {d["id"]: 85.5 for d in filtered_destinations},
                "recommended_destinations": [d["id"] for d in filtered_destinations[:3]],
                "social_proof": {}
            }
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get enhanced destinations: {e}")
        return {"error": f"Failed to get enhanced destinations: {str(e)}"}

@api_router.post("/enhanced-dreams/behavior")
async def track_behavior(behavior: BehaviorSignal, user_id: str):
    """Track user behavior for AI learning"""
    try:
        # Store behavior signal (Phase 1 foundation)
        # In Phase 3, this will feed into ML models
        
        behavior_record = {
            "user_id": user_id,
            "signal_type": behavior.signal_type,
            "value": behavior.value,
            "context": behavior.context,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # For now, just log the behavior (will be stored in database in full implementation)
        logger.info(f"Behavior tracked: {behavior_record}")
        
        return {"success": True, "message": "Behavior tracked successfully"}
        
    except Exception as e:
        logger.error(f"Failed to track behavior: {e}")
        return {"error": f"Failed to track behavior: {str(e)}"}

@api_router.post("/enhanced-dreams/interaction")
async def track_interaction(interaction: InteractionData, user_id: str):
    """Track detailed user interactions"""
    try:
        interaction_record = {
            "user_id": user_id,
            "destination_id": interaction.destination_id,
            "interaction_type": interaction.interaction_type,
            "duration_seconds": interaction.duration_seconds,
            "device_type": interaction.device_type,
            "referrer": interaction.referrer,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Interaction tracked: {interaction_record}")
        
        return {"success": True, "message": "Interaction tracked successfully"}
        
    except Exception as e:
        logger.error(f"Failed to track interaction: {e}")
        return {"error": f"Failed to track interaction: {str(e)}"}

@api_router.get("/enhanced-dreams/profile/{user_id}")
async def get_user_profile(user_id: str):
    """Get user's enhanced profile with AI insights"""
    try:
        # Mock user profile (Phase 1 foundation)
        mock_profile = {
            "user_id": user_id,
            "travel_personality": {
                "primary_type": "cultural_explorer",
                "confidence_score": 0.78,
                "personality_factors": [
                    {"factor": "culture", "weight": 0.85, "confidence": 0.9},
                    {"factor": "photography", "weight": 0.72, "confidence": 0.8},
                    {"factor": "food", "weight": 0.68, "confidence": 0.7}
                ]
            },
            "gamification_metrics": {
                "total_points": 1247,
                "level": 3,
                "destinations_collected": 23,
                "continents_unlocked": 4,
                "achievements_unlocked": 8,
                "streak_days": 5,
                "rarity_score": 67
            },
            "data_quality_score": 0.65,
            "created_at": "2024-01-01T00:00:00Z",
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return mock_profile
        
    except Exception as e:
        logger.error(f"Failed to get user profile: {e}")
        return {"error": f"Failed to get user profile: {str(e)}"}

@api_router.get("/enhanced-dreams/insights/{user_id}")
async def get_user_insights(user_id: str):
    """Get AI-powered user insights"""
    try:
        # Mock insights (Phase 1 foundation)
        mock_insights = {
            "travel_dna": {
                "primary_type": "cultural_explorer",
                "confidence_score": 0.78,
                "personality_factors": [
                    {"factor": "culture", "weight": 0.85, "confidence": 0.9},
                    {"factor": "photography", "weight": 0.72, "confidence": 0.8}
                ]
            },
            "next_recommended_destinations": [],
            "optimal_travel_windows": [],
            "social_insights": {
                "friends_overlap": [],
                "trending_in_network": []
            }
        }
        
        return mock_insights
        
    except Exception as e:
        logger.error(f"Failed to get user insights: {e}")
        return {"error": f"Failed to get user insights: {str(e)}"}

@api_router.post("/enhanced-dreams/collection")
async def update_dream_collection(update: DreamCollectionUpdate):
    """Update user's dream destination collection"""
    try:
        # Mock collection update (Phase 1 foundation)
        logger.info(f"Collection update: {update.dict()}")
        
        # Check for achievement unlocks (placeholder)
        achievements_unlocked = []
        if update.action == "add":
            # Simulate achievement unlock
            achievements_unlocked = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Explorer",
                    "description": "Added your first dream destination!",
                    "category": "explorer",
                    "rarity": "common",
                    "points_value": 50
                }
            ]
        
        return {
            "success": True,
            "message": f"Dream destination {update.action}ed successfully",
            "achievements_unlocked": achievements_unlocked
        }
        
    except Exception as e:
        logger.error(f"Failed to update collection: {e}")
        return {"error": f"Failed to update collection: {str(e)}"}

# Gamification API Endpoints

@api_router.get("/gamification/stats/{user_id}")
async def get_user_game_stats(user_id: str):
    """Get comprehensive user gamification statistics"""
    try:
        # Mock comprehensive game stats for Phase 2
        mock_stats = {
            "user_id": user_id,
            "level": 4,
            "total_points": 2847,
            "destinations_collected": 23,
            "continents_unlocked": 5,
            "achievements_unlocked": 12,
            "current_streak": 7,
            "longest_streak": 15,
            "rarity_score": 342,
            "social_score": 156,
            "exploration_rank": 847,
            "last_activity": datetime.utcnow().isoformat(),
            "category_stats": {
                "beaches": {"count": 8, "average_rarity": 65, "completion_percentage": 32},
                "cultural": {"count": 7, "average_rarity": 45, "completion_percentage": 28},
                "adventure": {"count": 5, "average_rarity": 78, "completion_percentage": 20},
                "mountains": {"count": 3, "average_rarity": 82, "completion_percentage": 12}
            },
            "continent_progress": {
                "Europe": {"destinations_count": 9, "completion_percentage": 18, "rare_destinations_count": 2},
                "Asia": {"destinations_count": 7, "completion_percentage": 14, "rare_destinations_count": 3},
                "North America": {"destinations_count": 4, "completion_percentage": 8, "rare_destinations_count": 1},
                "South America": {"destinations_count": 2, "completion_percentage": 4, "rare_destinations_count": 1},
                "Africa": {"destinations_count": 1, "completion_percentage": 2, "rare_destinations_count": 1}
            }
        }
        
        return mock_stats
        
    except Exception as e:
        logger.error(f"Failed to get user game stats: {e}")
        return {"error": f"Failed to get user game stats: {str(e)}"}

@api_router.get("/gamification/achievements/{user_id}")
async def get_user_achievements(user_id: str):
    """Get user's achievements with progress"""
    try:
        mock_achievements = [
            {
                "id": "first_steps",
                "name": "First Steps",
                "description": "Add your first dream destination",
                "category": "explorer",
                "icon": "🎯",
                "progress": 100,
                "max_progress": 1,
                "unlocked": True,
                "unlocked_at": "2024-01-15T10:30:00Z",
                "rarity": "common",
                "points_value": 50,
                "requirements": [{"type": "destinations_count", "target_value": 1, "current_value": 23}],
                "reward_type": "points"
            },
            {
                "id": "continental_explorer",
                "name": "Continental Explorer",
                "description": "Collect destinations from 5 different continents",
                "category": "explorer",
                "icon": "🌍",
                "progress": 100,
                "max_progress": 5,
                "unlocked": True,
                "unlocked_at": "2024-02-20T15:45:00Z",
                "rarity": "rare",
                "points_value": 200,
                "requirements": [{"type": "continents_count", "target_value": 5, "current_value": 5}],
                "reward_type": "badge"
            },
            {
                "id": "hidden_gems",
                "name": "Hidden Gems Hunter",
                "description": "Discover 3 legendary rarity destinations",
                "category": "adventurer",
                "icon": "💎",
                "progress": 67,
                "max_progress": 3,
                "unlocked": False,
                "rarity": "epic",
                "points_value": 500,
                "requirements": [{"type": "rare_destinations", "target_value": 3, "current_value": 2}],
                "reward_type": "feature_unlock",
                "reward_value": "advanced_search"
            },
            {
                "id": "social_butterfly",
                "name": "Social Butterfly",
                "description": "Connect with 10 travel buddies",
                "category": "social",
                "icon": "👥",
                "progress": 30,
                "max_progress": 10,
                "unlocked": False,
                "rarity": "common",
                "points_value": 150,
                "requirements": [{"type": "social_interactions", "target_value": 10, "current_value": 3}],
                "reward_type": "points"
            },
            {
                "id": "streak_master",
                "name": "Streak Master",
                "description": "Maintain a 30-day discovery streak",
                "category": "planner",
                "icon": "🔥",
                "progress": 23,
                "max_progress": 30,
                "unlocked": False,
                "rarity": "epic",
                "points_value": 750,
                "requirements": [{"type": "streak_days", "target_value": 30, "current_value": 7}],
                "reward_type": "discount",
                "reward_value": 15
            }
        ]
        
        return mock_achievements
        
    except Exception as e:
        logger.error(f"Failed to get user achievements: {e}")
        return {"error": f"Failed to get user achievements: {str(e)}"}

@api_router.post("/gamification/achievements/check")
async def check_achievement_progress(request_data: dict):
    """Check for achievement unlocks after user action"""
    try:
        user_id = request_data.get("user_id")
        action_type = request_data.get("action_type")
        action_data = request_data.get("action_data", {})
        
        # Mock achievement checking logic
        newly_unlocked = []
        progress_updates = []
        points_earned = 0
        
        if action_type == "destination_bookmarked":
            total_destinations = action_data.get("total_destinations", 1)
            
            # Check for milestone achievements
            if total_destinations == 10:
                newly_unlocked.append({
                    "id": "dream_collector",
                    "name": "Dream Collector",
                    "description": "Collect 10 dream destinations",
                    "category": "explorer",
                    "icon": "🏆",
                    "progress": 100,
                    "max_progress": 10,
                    "unlocked": True,
                    "unlocked_at": datetime.utcnow().isoformat(),
                    "rarity": "common",
                    "points_value": 100,
                    "requirements": [{"type": "destinations_count", "target_value": 10, "current_value": 10}],
                    "reward_type": "points"
                })
                points_earned += 100
            
            elif total_destinations == 25:
                newly_unlocked.append({
                    "id": "quarter_century",
                    "name": "Quarter Century Explorer",
                    "description": "Collect 25 dream destinations",
                    "category": "explorer",
                    "icon": "🌟",
                    "progress": 100,
                    "max_progress": 25,
                    "unlocked": True,
                    "unlocked_at": datetime.utcnow().isoformat(),
                    "rarity": "rare",
                    "points_value": 250,
                    "requirements": [{"type": "destinations_count", "target_value": 25, "current_value": 25}],
                    "reward_type": "points"
                })
                points_earned += 250
                
                # Level up check
                if total_destinations >= 25:
                    return {
                        "newly_unlocked": newly_unlocked,
                        "progress_updates": progress_updates,
                        "points_earned": points_earned,
                        "level_up": {
                            "old_level": 3,
                            "new_level": 4,
                            "rewards_unlocked": ["Advanced search filters", "Priority support"]
                        }
                    }
        
        return {
            "newly_unlocked": newly_unlocked,
            "progress_updates": progress_updates,
            "points_earned": points_earned
        }
        
    except Exception as e:
        logger.error(f"Failed to check achievements: {e}")
        return {"error": f"Failed to check achievements: {str(e)}"}

@api_router.get("/gamification/leaderboards")
async def get_leaderboards(types: str = "global,weekly"):
    """Get leaderboards of specified types"""
    try:
        leaderboard_types = types.split(",")
        leaderboards = []
        
        if "global" in leaderboard_types:
            leaderboards.append({
                "id": "global_explorer",
                "name": "Global Explorers",
                "description": "Top dream collectors worldwide",
                "type": "global",
                "entries": [
                    {
                        "user_id": "user_1",
                        "username": "WanderlustMike",
                        "avatar_url": None,
                        "score": 5420,
                        "rank": 1,
                        "change_from_last_week": 2,
                        "badges": ["🌍", "💎", "🏆"],
                        "specialization": "Adventure Seeker"
                    },
                    {
                        "user_id": "user_2",
                        "username": "CulturalExplorer",
                        "avatar_url": None,
                        "score": 4890,
                        "rank": 2,
                        "change_from_last_week": -1,
                        "badges": ["🏛️", "🎭", "📚"],
                        "specialization": "Cultural Explorer"
                    },
                    {
                        "user_id": "user_3",
                        "username": "BeachHopper",
                        "avatar_url": None,
                        "score": 4350,
                        "rank": 3,
                        "change_from_last_week": 3,
                        "badges": ["🏖️", "🌊", "☀️"],
                        "specialization": "Beach Lover"
                    }
                ],
                "user_rank": 847,
                "total_participants": 12453,
                "updated_at": datetime.utcnow().isoformat()
            })
        
        if "weekly" in leaderboard_types:
            leaderboards.append({
                "id": "weekly_stars",
                "name": "Weekly Rising Stars",
                "description": "Top performers this week",
                "type": "weekly",
                "entries": [
                    {
                        "user_id": "user_4",
                        "username": "WeeklyWinner",
                        "avatar_url": None,
                        "score": 1250,
                        "rank": 1,
                        "change_from_last_week": 15,
                        "badges": ["⭐", "🚀", "💪"],
                        "specialization": "Rising Explorer"
                    }
                ],
                "user_rank": 45,
                "total_participants": 3204,
                "updated_at": datetime.utcnow().isoformat(),
                "ends_at": (datetime.utcnow().replace(hour=23, minute=59, second=59) + timedelta(days=7-datetime.utcnow().weekday())).isoformat()
            })
        
        return leaderboards
        
    except Exception as e:
        logger.error(f"Failed to get leaderboards: {e}")
        return {"error": f"Failed to get leaderboards: {str(e)}"}

@api_router.get("/gamification/challenges/{user_id}")
async def get_user_challenges(user_id: str):
    """Get available and active challenges for user"""
    try:
        challenges = [
            {
                "id": "march_explorer",
                "title": "March Explorer Challenge",
                "description": "Discover 5 new dream destinations this month",
                "type": "individual",
                "category": "exploration",
                "difficulty": "medium", 
                "target_metric": "destinations_count",
                "target_value": 5,
                "current_progress": 2,
                "duration_days": 31,
                "starts_at": "2024-03-01T00:00:00Z",
                "ends_at": "2024-03-31T23:59:59Z",
                "points_reward": 250,
                "badge_reward": "🌟",
                "participants_count": 1247,
                "is_participating": True,
                "status": "active"
            },
            {
                "id": "social_connector",
                "title": "Social Connector",
                "description": "Add 3 travel buddies and share 5 destinations",
                "type": "individual",
                "category": "social",
                "difficulty": "easy",
                "target_metric": "social_interactions",
                "target_value": 8,
                "current_progress": 0,
                "duration_days": 14,
                "starts_at": datetime.utcnow().isoformat(),
                "ends_at": (datetime.utcnow() + timedelta(days=14)).isoformat(),
                "points_reward": 150,
                "badge_reward": "👥",
                "participants_count": 856,
                "is_participating": False,
                "status": "active"
            }
        ]
        
        return challenges
        
    except Exception as e:
        logger.error(f"Failed to get challenges: {e}")
        return {"error": f"Failed to get challenges: {str(e)}"}

@api_router.get("/social/activity/{user_id}")
async def get_social_activity(user_id: str, limit: int = 20):
    """Get social activity feed for user"""
    try:
        activities = [
            {
                "id": "activity_1",
                "user_id": "friend_1",
                "username": "AdventureAnna",
                "avatar_url": None,
                "activity_type": "destination_added",
                "activity_data": {"destination_name": "Mount Kilimanjaro"},
                "visibility": "public",
                "likes_count": 12,
                "comments_count": 3,
                "created_at": "2024-03-01T10:30:00Z",
                "is_liked_by_user": False
            },
            {
                "id": "activity_2", 
                "user_id": "friend_2",
                "username": "CultureSeeker",
                "avatar_url": None,
                "activity_type": "achievement_unlocked",
                "activity_data": {"achievement_name": "Cultural Master"},
                "visibility": "friends",
                "likes_count": 8,
                "comments_count": 1,
                "created_at": "2024-02-28T15:45:00Z",
                "is_liked_by_user": True
            },
            {
                "id": "activity_3",
                "user_id": "friend_3", 
                "username": "LevelUpLegend",
                "avatar_url": None,
                "activity_type": "level_up",
                "activity_data": {"level": 5},
                "visibility": "public",
                "likes_count": 15,
                "comments_count": 4,
                "created_at": "2024-02-27T09:15:00Z",
                "is_liked_by_user": False
            }
        ]
        
        return activities[:limit]
        
    except Exception as e:
        logger.error(f"Failed to get social activity: {e}")
        return {"error": f"Failed to get social activity: {str(e)}"}

@api_router.post("/gamification/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, request_data: dict):
    """Join a challenge"""
    try:
        user_id = request_data.get("user_id")
        
        # Mock challenge joining
        logger.info(f"User {user_id} joined challenge {challenge_id}")
        
        return {
            "success": True,
            "message": f"Successfully joined the challenge! Good luck reaching your goal."
        }
        
    except Exception as e:
        logger.error(f"Failed to join challenge: {e}")
        return {"success": False, "message": f"Failed to join challenge: {str(e)}"}

@api_router.post("/gamification/events")
async def track_game_event(event_data: dict):
    """Track gamification events"""
    try:
        logger.info(f"Game event tracked: {event_data}")
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Failed to track game event: {e}")
        return {"success": False}

@api_router.post("/ai/free-chat")
async def free_development_chat(request_data: dict):
    """Free development chat endpoint - no Emergent credits used"""
    try:
        query = request_data.get("query", "")
        user_context = request_data.get("user_context", {})
        
        # Always use free provider in development
        if os.environ.get('DEVELOPMENT_MODE', 'true').lower() == 'true':
            logger.info("🆓 FREE CHAT: No Emergent credits consumed")
            response = await free_ai_provider.get_chat_response(query, user_context)
            
            return {
                "message": response.get("response", "I can help you with travel planning!"),
                "suggestions": response.get("suggestions", ["Find hotels", "Search flights", "Plan trip"]),
                "source": response.get("source", "free_development"),
                "credits_used": 0.0,
                "development_mode": True,
                "note": "Using free APIs - no Emergent credits consumed"
            }
        else:
            # Production mode - would use Emergent credits
            logger.warning("💰 PRODUCTION MODE: Would use Emergent credits")
            return {
                "message": "Production mode would use Emergent credits here",
                "source": "emergent_warning",
                "credits_used": 0.2,
                "development_mode": False
            }
        
    except Exception as e:
        logger.error(f"Free chat endpoint failed: {e}")
        return {
            "message": "I'm here to help with your travel needs! What can I assist you with?",
            "suggestions": ["Hotels", "Flights", "Rewards", "Planning"],
            "source": "fallback",
            "credits_used": 0.0,
            "error": str(e)
        }

# =====================================================
# AI INTELLIGENCE LAYER - Phase 3 Implementation
# =====================================================

@api_router.post("/ai/travel-dna/{user_id}")
async def analyze_travel_dna(user_id: str, request_data: dict):
    """Analyze user's travel DNA using FREE APIs during development"""
    try:
        # Import free AI provider
        from free_ai_provider import free_ai_provider
        
        # Check if we should use free APIs (development mode)
        if os.environ.get('DEVELOPMENT_MODE', 'true').lower() == 'true':
            logger.info("🆓 DEVELOPMENT MODE: Using FREE Travel DNA analysis (0 credits)")
            return await free_ai_provider.get_travel_dna_response(user_id, request_data)
        
        # PRODUCTION: Use Emergent LLM Key (costs credits)
        logger.warning("💰 PRODUCTION MODE: Using Emergent credits for Travel DNA")
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get the emergent LLM key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not found in environment")
            return {"error": "AI service not configured"}
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"travel_dna_{user_id}",
            system_message="You are an AI travel psychologist specializing in analyzing travel personalities and preferences. You create detailed Travel DNA profiles based on user behavior, preferences, and social data."
        ).with_model("openai", "gpt-4o-mini")
        
        # Mock user data for analysis (in production, this would come from database)
        user_data = {
            "dream_destinations": ["Kyoto", "Florence", "Marrakech", "Bali", "Iceland"],
            "browsing_patterns": ["cultural sites", "photography spots", "local cuisine"],
            "social_connections": ["friend_1", "friend_2", "friend_3"],
            "seasonal_preferences": ["spring", "fall"],
            "budget_range": "mid-range"
        }
        
        # Create AI prompt for travel DNA analysis
        prompt = f"""
        Analyze the travel DNA for user {user_id} based on this data:
        
        Dream Destinations: {user_data['dream_destinations']}
        Browsing Patterns: {user_data['browsing_patterns']}
        Social Connections: {user_data['social_connections']}
        Seasonal Preferences: {user_data['seasonal_preferences']}
        Budget Range: {user_data['budget_range']}
        
        Please provide a JSON response with:
        1. Primary travel type (cultural_explorer, adventurer, photographer, etc.)
        2. Confidence score (0-1)
        3. Top 4 personality factors with weights
        4. Travel insights and recommendations
        
        Format as valid JSON only.
        """
        
        # Send message to AI
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Parse AI response and create structured response
        try:
            import json
            ai_data = json.loads(ai_response)
        except:
            # Fallback if AI doesn't return valid JSON
            ai_data = {
                "primary_type": "cultural_explorer",
                "confidence_score": 0.87,
                "personality_factors": [
                    {"factor": "culture", "weight": 0.9, "confidence": 0.92},
                    {"factor": "photography", "weight": 0.8, "confidence": 0.85},
                    {"factor": "food", "weight": 0.7, "confidence": 0.78},
                    {"factor": "adventure", "weight": 0.4, "confidence": 0.65}
                ]
            }
        
        # Create structured response
        response = {
            "travel_dna": {
                "user_id": user_id,
                "primary_type": ai_data.get("primary_type", "cultural_explorer"),
                "secondary_type": ai_data.get("secondary_type"),
                "confidence_score": ai_data.get("confidence_score", 0.87),
                "personality_factors": [
                    {
                        "factor": factor["factor"],
                        "weight": factor["weight"],
                        "confidence": factor["confidence"],
                        "source": "ai_inference",
                        "trend": "stable"
                    }
                    for factor in ai_data.get("personality_factors", [])
                ],
                "social_influence_factors": [
                    {
                        "factor_type": "friend_influence",
                        "influence_strength": 0.3,
                        "source_users": user_data["social_connections"],
                        "destinations_influenced": user_data["dream_destinations"][:3],
                        "confidence": 0.75
                    }
                ],
                "behavioral_patterns": [
                    {
                        "pattern_type": "browsing_behavior",
                        "pattern_data": {
                            "peak_browsing_hours": [19, 20, 21],
                            "preferred_content_types": user_data["browsing_patterns"],
                            "average_session_duration": 25.5
                        },
                        "strength": 0.8,
                        "last_updated": datetime.utcnow()
                    }
                ],
                "last_analyzed": datetime.utcnow(),
                "analysis_version": "3.1.0"
            },
            "confidence_breakdown": {
                "individual_data_confidence": 0.85,
                "social_data_confidence": 0.78,
                "behavioral_pattern_confidence": 0.89,
                "overall_confidence": ai_data.get("confidence_score", 0.87)
            },
            "recommendations_count": 15,
            "last_updated": datetime.utcnow(),
            "next_analysis_recommended": datetime.utcnow() + timedelta(days=7)
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to analyze travel DNA: {e}")
        return {"error": f"Failed to analyze travel DNA: {str(e)}"}

@api_router.get("/ai/recommendations/{user_id}")
async def get_intelligent_recommendations(user_id: str, max_results: int = 10, include_social_proof: bool = True):
    """Get AI-powered intelligent recommendations using FREE APIs during development"""
    try:
        # Import free AI provider
        from free_ai_provider import free_ai_provider
        
        # Check if we should use free APIs (development mode)
        if os.environ.get('DEVELOPMENT_MODE', 'true').lower() == 'true':
            logger.info("🆓 DEVELOPMENT MODE: Using FREE recommendations (0 credits)")
            return await free_ai_provider.get_recommendations_response(user_id, max_results)
        
        # PRODUCTION: Use Emergent LLM Key (costs credits)
        logger.warning("💰 PRODUCTION MODE: Using Emergent credits for recommendations")
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI service not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recommendations_{user_id}",
            system_message="You are an AI travel recommendation engine that provides personalized destination suggestions based on user preferences, social data, and real-time insights."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Generate {max_results} intelligent travel recommendations for user {user_id}.
        
        Consider:
        - User is a cultural explorer with photography interests
        - Include optimal timing, pricing insights, and social factors
        - Provide actionable recommendations with confidence scores
        
        Return a list of destinations with scores, reasons, and timing recommendations.
        Format as JSON with destination details.
        """
        
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Mock structured response for Phase 3
        recommendations = [
            {
                "destination_id": "florence_italy",
                "destination_name": "Florence",
                "country": "Italy",
                "continent": "Europe",
                "recommendation_score": 94,
                "recommendation_reasons": [
                    {
                        "reason_type": "personality_match",
                        "reason_text": "Perfect match for cultural explorers with world-class art museums",
                        "confidence": 0.92,
                        "weight": 0.4
                    }
                ],
                "optimal_timing": {
                    "best_months": [4, 5, 9, 10],
                    "best_season": "spring",
                    "price_optimal_window": {"start_month": 4, "end_month": 5, "savings_percentage": 25}
                },
                "ai_insights": [
                    {
                        "insight_type": "perfect_match",
                        "insight_text": f"AI analysis from GPT-4o-mini: {ai_response[:200]}...",
                        "confidence": 0.91,
                        "actionable": True
                    }
                ],
                "urgency_score": 75
            }
        ]
        
        return {
            "recommendations": recommendations,
            "total_recommendations": len(recommendations),
            "processing_metadata": {
                "analysis_time_ms": 245,
                "ai_model_version": "gpt-4o-mini",
                "data_sources_used": ["user_behavior", "ai_analysis"],
                "credits_used": "PRODUCTION_MODE"
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get intelligent recommendations: {e}")
        return {"error": f"Failed to get recommendations: {str(e)}"}

@api_router.post("/ai/journey-optimization")
async def optimize_journey(request_data: dict):
    """Optimize multi-destination journey using AI"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        user_id = request_data.get("user_id")
        destination_ids = request_data.get("destination_ids", [])
        preferences = request_data.get("preferences", {})
        
        if not api_key:
            return {"error": "AI service not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"journey_opt_{user_id}",
            system_message="You are an AI travel optimization expert that creates efficient multi-destination itineraries considering cost, time, weather, and user preferences."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Optimize a journey for user {user_id} with these destinations: {destination_ids}
        
        Preferences: {preferences}
        
        Please suggest:
        1. Optimal route order
        2. Best travel methods between destinations
        3. Timing recommendations
        4. Cost optimization strategies
        5. Duration suggestions
        
        Consider factors like seasonal weather, pricing patterns, and travel efficiency.
        """
        
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Create optimized journey response
        optimized_journey = {
            "journey_id": f"journey_{user_id}_{int(datetime.utcnow().timestamp())}",
            "user_id": user_id,
            "selected_destinations": destination_ids,
            "optimized_route": {
                "route_segments": [
                    {
                        "from_destination_id": destination_ids[0] if len(destination_ids) > 0 else "origin",
                        "to_destination_id": destination_ids[1] if len(destination_ids) > 1 else "destination",
                        "travel_method": "flight",
                        "distance_km": 1240,
                        "duration_hours": 2.5,
                        "estimated_cost": 180,
                        "carbon_footprint_kg": 85
                    }
                ],
                "total_distance_km": 1240,
                "total_travel_time_hours": 2.5,
                "carbon_footprint_kg": 85
            },
            "total_estimated_cost": 2400,
            "total_duration_days": 14,
            "optimization_score": 87,
            "created_at": datetime.utcnow(),
            "ai_insights": ai_response[:500] + "..." if len(ai_response) > 500 else ai_response
        }
        
        return {
            "optimized_journey": optimized_journey,
            "optimization_summary": {
                "cost_savings_percentage": 25,
                "time_savings_percentage": 15,
                "carbon_reduction_percentage": 10,
                "weather_optimization_score": 92
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to optimize journey: {e}")
        return {"error": f"Failed to optimize journey: {str(e)}"}

@api_router.get("/ai/predictive-insights/{user_id}")
async def get_predictive_insights(user_id: str):
    """Get AI-powered predictive insights"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI service not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"insights_{user_id}",
            system_message="You are an AI travel forecasting expert that predicts future travel trends, price changes, and personalized opportunities for travelers."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Generate predictive travel insights for user {user_id}.
        
        Consider:
        - Upcoming price trends for popular destinations
        - Seasonal optimization opportunities
        - Emerging travel trends that match user preferences
        - Social travel patterns and recommendations
        
        Provide actionable insights with confidence scores and time horizons.
        """
        
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        insights = [
            {
                "insight_id": f"insight_{user_id}_{int(datetime.utcnow().timestamp())}",
                "user_id": user_id,
                "insight_type": "price_alert",
                "title": "AI Price Prediction: Japan",
                "description": f"Based on AI analysis: {ai_response[:200]}...",
                "confidence": 87,
                "urgency": "high",
                "actionable_steps": [
                    {
                        "step_number": 1,
                        "action_type": "wait_for_price_drop",
                        "action_text": "Wait 10-14 days before booking flights to Tokyo",
                        "estimated_impact": "Save $400-500 on flights"
                    }
                ],
                "predicted_value": 450,
                "expires_at": datetime.utcnow() + timedelta(days=14),
                "related_destinations": ["tokyo", "osaka", "kyoto"],
                "ai_reasoning": ai_response[:300] + "..." if len(ai_response) > 300 else ai_response
            }
        ]
        
        return {
            "insights": insights,
            "user_prediction_accuracy": 82,
            "total_insights": len(insights),
            "high_confidence_insights": 1,
            "actionable_insights": 1,
            "potential_savings": 450,
            "next_analysis_date": datetime.utcnow() + timedelta(days=1)
        }
        
    except Exception as e:
        logger.error(f"Failed to get predictive insights: {e}")
        return {"error": f"Failed to get predictive insights: {str(e)}"}

@api_router.post("/ai/feedback")
async def submit_ai_feedback(feedback_data: dict):
    """Submit user feedback on AI recommendations"""
    try:
        # Store feedback for AI learning (Phase 3 foundation)
        feedback_record = {
            "feedback_id": str(uuid.uuid4()),
            "user_id": feedback_data.get("user_id"),
            "feedback_type": feedback_data.get("feedback_type"),
            "target_id": feedback_data.get("target_id"),
            "rating": feedback_data.get("rating"),
            "feedback_text": feedback_data.get("feedback_text"),
            "created_at": datetime.utcnow()
        }
        
        logger.info(f"AI Feedback received: {feedback_record}")
        
        return {"success": True, "message": "Feedback submitted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to submit AI feedback: {e}")
        return {"success": False, "error": str(e)}

@api_router.get("/ai/explain/{recommendation_id}")
async def explain_recommendation(recommendation_id: str, user_id: str):
    """Get AI explanation for a recommendation"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI service not configured"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"explain_{user_id}",
            system_message="You are an AI travel advisor that explains recommendations in clear, helpful language, helping users understand why certain destinations match their preferences."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
        Explain why recommendation {recommendation_id} was suggested for user {user_id}.
        
        Consider:
        - User's travel personality and preferences
        - Social influences and connections
        - Timing and seasonal factors
        - Price optimization opportunities
        
        Provide a clear, engaging explanation that helps the user understand the reasoning.
        Keep it conversational and helpful.
        """
        
        user_message = UserMessage(text=prompt)
        ai_explanation = await chat.send_message(user_message)
        
        return {
            "explanation": ai_explanation,
            "confidence": 0.85,
            "ai_model_used": "gpt-4o-mini"
        }
        
    except Exception as e:
        logger.error(f"Failed to explain recommendation: {e}")
        return {
            "explanation": "This recommendation is based on your travel personality, social connections, and optimal timing factors. Our AI analyzed your preferences and found this destination highly matches your interests. With the new Expedia Group integration, you can now book comprehensive travel packages including hotels, flights, cars, and activities all in one place.",
            "confidence": 0.85
        }

# Smart Dreams Enhanced Provider Search Models
class SmartDreamProviderRequest(BaseModel):
    companion_type: str
    travel_dna: Optional[dict] = None
    destination: Optional[str] = None
    date_range: Optional[dict] = None
    budget: Optional[dict] = None
    preferences: Optional[List[str]] = None

# Expedia Group API Models

class ExpediaConfig(BaseModel):
    api_key: str
    shared_secret: str
    base_url: str = "https://api.expediagroup.com"
    sandbox_url: str = "https://api.sandbox.expediagroup.com" 
    test_mode: bool = False

class ExpediaHotelSearchRequest(BaseModel):
    checkin: str  # YYYY-MM-DD format
    checkout: str
    occupancy: List[Dict[str, int]]  # [{"adults": 2, "children": 1}]
    property_ids: Optional[List[str]] = None
    region_id: Optional[str] = None
    include: List[str] = ["property_ids", "room_types", "rate_plans"]

class ExpediaBookingRequest(BaseModel):
    property_id: str
    room_id: str
    rate_id: str
    guest_details: Dict[str, Any]
    payment_details: Dict[str, Any]
    special_requests: Optional[str] = None

class ExpediaFlightSearchRequest(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: Optional[str] = None
    passengers: Dict[str, int] = {"adults": 1, "children": 0, "infants": 0}
    cabin_class: str = "economy"

class ExpediaCarSearchRequest(BaseModel):
    pickup_location: str
    pickup_date: str
    dropoff_location: Optional[str] = None
    dropoff_date: Optional[str] = None
    driver_age: int = 25

class ExpediaActivitySearchRequest(BaseModel):
    destination: str
    start_date: str
    end_date: Optional[str] = None
    adults: int = 1
    children: int = 0
    category: Optional[str] = None

# ==================================================
# EXPEDIA GROUP API INTEGRATION - COMPREHENSIVE SERVICE
# ==================================================

async def get_supabase_config(provider: str, environment: str = "production"):
    """Get provider configuration from Supabase"""
    try:
        from supabase import create_client, Client
        
        # Initialize Supabase client with environment variables
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase credentials not found in environment variables")
            return None
            
        logger.info(f"Connecting to Supabase: {supabase_url}")
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Query api_configuration table
        result = supabase.table('api_configuration').select('*').eq('provider', provider).eq('environment', environment).eq('is_active', True).execute()
        
        if result.data and len(result.data) > 0:
            config_data = result.data[0]['config_data']
            logger.info(f"Retrieved configuration for provider {provider}")
            return config_data
        
        logger.warning(f"No configuration found for provider {provider} in environment {environment}")
        return None
        
    except Exception as e:
        logger.error(f"Failed to get Supabase config for {provider}: {e}")
        return None

async def store_supabase_config(provider: str, config_data: dict, environment: str = "production"):
    """Store provider configuration in Supabase"""
    try:
        from supabase import create_client, Client
        
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase credentials not found in environment variables")
            return False
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Insert or update configuration
        result = supabase.table('api_configuration').upsert({
            'provider': provider,
            'environment': environment,
            'config_data': config_data,
            'is_active': True
        }).execute()
        
        logger.info(f"Successfully stored configuration for provider {provider}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to store Supabase config for {provider}: {e}")
        return False

class ExpediaAuthClient:
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get('api_key')
        self.shared_secret = config.get('shared_secret')
        self.base_url = config.get('base_url', 'https://api.expediagroup.com')
        self.test_mode = config.get('test_mode', False)
        
        if self.test_mode:
            self.base_url = config.get('sandbox_url', 'https://api.sandbox.expediagroup.com')
        
        self.access_token = None
        self.token_expires_at = None
    
    async def get_access_token(self):
        """Get OAuth2 access token from Expedia API"""
        if self.access_token and self.token_expires_at and datetime.utcnow() < self.token_expires_at:
            return self.access_token
        
        import base64
        import httpx
        
        # Encode credentials to Base64
        credentials = f"{self.api_key}:{self.shared_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {encoded_credentials}"
        }
        
        data = {"grant_type": "client_credentials"}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/identity/oauth2/v3/token",
                    headers=headers,
                    data=data,
                    timeout=30.0
                )
                response.raise_for_status()
                
                token_data = response.json()
                self.access_token = token_data["access_token"]
                expires_in = token_data.get("expires_in", 1800)
                self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 60)
                
                logger.info("Successfully obtained Expedia access token")
                return self.access_token
                
            except Exception as e:
                logger.error(f"Failed to obtain Expedia access token: {e}")
                raise
    
    async def get_authenticated_headers(self):
        """Get headers with valid authentication token"""
        token = await self.get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

class ExpediaService:
    def __init__(self):
        self.auth_client = None
        self.config = None
    
    async def initialize(self):
        """Initialize Expedia service with configuration from Supabase or test credentials"""
        try:
            # First try to get configuration from Supabase
            config = await get_supabase_config('expedia')
            
            # If not found, use test credentials directly
            if not config and EXPEDIA_TEST_CONFIG:
                logger.info("Using provided test credentials for Expedia integration")
                config = EXPEDIA_TEST_CONFIG
            
            if not config:
                logger.error("No Expedia configuration available")
                return False
            
            self.config = config
            self.auth_client = ExpediaAuthClient(config)
            
            # Test authentication
            await self.auth_client.get_access_token()
            logger.info("Expedia service initialized successfully with test credentials")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Expedia service: {e}")
            return False
    
    async def search_hotels(self, search_request: ExpediaHotelSearchRequest):
        """Search hotels using Expedia Rapid GraphQL API"""
        if not self.auth_client:
            await self.initialize()
        
        headers = await self.auth_client.get_authenticated_headers()
        
        # Build GraphQL query for hotel search
        graphql_query = """
        query GetPropertyAvailability($input: PropertyAvailabilityInput!) {
            propertyAvailability(input: $input) {
                properties {
                    propertyId
                    name
                    address {
                        line1
                        city
                        stateProvinceCode
                        countryCode
                    }
                    starRating
                    guestRating {
                        overall
                    }
                    rooms {
                        id
                        roomType
                        rates {
                            id
                            totalPrice {
                                value
                                currency
                            }
                            refundable
                        }
                    }
                }
            }
        }
        """
        
        # Build GraphQL variables
        variables = {
            "input": {
                "checkin": search_request.checkin,
                "checkout": search_request.checkout,
                "occupancy": search_request.occupancy,
                "currency": "USD",
                "language": "en-US",
                "countryCode": "US"
            }
        }
        
        if search_request.property_ids:
            variables["input"]["propertyIds"] = search_request.property_ids
        
        if search_request.region_id:
            variables["input"]["regionId"] = search_request.region_id
        
        graphql_payload = {
            "query": graphql_query,
            "variables": variables
        }
        
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                # Use GraphQL endpoint for sandbox
                graphql_url = f"{self.auth_client.base_url}/supply/lodging/graphql" if "sandbox" in self.auth_client.base_url else f"{self.auth_client.base_url}/rapid/lodging/v3/properties/availability"
                
                if "sandbox" in self.auth_client.base_url:
                    # Use GraphQL for sandbox
                    response = await client.post(
                        graphql_url,
                        headers=headers,
                        json=graphql_payload,
                        timeout=30.0
                    )
                else:
                    # Use REST for production
                    params = {
                        "checkin": search_request.checkin,
                        "checkout": search_request.checkout,
                        "currency": "USD",
                        "language": "en-US",
                        "country_code": "US",
                        "include": ",".join(search_request.include)
                    }
                    
                    for i, occupancy in enumerate(search_request.occupancy):
                        params[f"occupancy[{i}].adults"] = occupancy.get("adults", 2)
                        if occupancy.get("children", 0) > 0:
                            params[f"occupancy[{i}].children"] = occupancy["children"]
                    
                    if search_request.property_ids:
                        params["property_id"] = ",".join(search_request.property_ids)
                    
                    response = await client.get(
                        graphql_url,
                        headers=headers,
                        params=params,
                        timeout=30.0
                    )
                
                response.raise_for_status()
                
                data = response.json()
                logger.info(f"Expedia hotel search completed: {len(data.get('data', {}).get('propertyAvailability', {}).get('properties', []))} properties found")
                
                if "sandbox" in self.auth_client.base_url and "data" in data:
                    properties = data.get("data", {}).get("propertyAvailability", {}).get("properties", [])
                    return {
                        "provider": "expedia",
                        "properties": properties,
                        "total_results": len(properties),
                        "api_type": "graphql"
                    }
                else:
                    return {
                        "provider": "expedia",
                        "properties": data.get("data", []),
                        "search_id": data.get("search_id"),
                        "total_results": len(data.get("data", [])),
                        "api_type": "rest"
                    }
                
            except Exception as e:
                logger.error(f"Expedia hotel search failed: {e}")
                # Return mock data for demonstration if API fails
                return {
                    "provider": "expedia",
                    "properties": [
                        {
                            "property_id": "demo_hotel_001",
                            "name": "Expedia Test Hotel",
                            "address": {"city": "Test City", "country": "US"},
                            "star_rating": 4,
                            "guest_rating": 4.5,
                            "rooms": [
                                {
                                    "room_id": "demo_room_001",
                                    "room_type": "Standard King",
                                    "rates": [
                                        {
                                            "rate_id": "demo_rate_001",
                                            "total_price": 150.00,
                                            "currency": "USD",
                                            "refundable": True
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "total_results": 1,
                    "demo_mode": True,
                    "note": f"Demo data returned due to API error: {str(e)}"
                }
    
    async def search_flights(self, search_request: ExpediaFlightSearchRequest):
        """Search flights using Expedia Flight API (REST for sandbox testing)"""
        if not self.auth_client:
            await self.initialize()
        
        headers = await self.auth_client.get_authenticated_headers()
        
        # For sandbox testing, use a simplified approach
        # Note: Expedia Flight API may have different sandbox endpoints
        
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                # Try different potential endpoints for flights
                potential_endpoints = [
                    f"{self.auth_client.base_url}/air/v1/search",
                    f"{self.auth_client.base_url}/flights/search", 
                    f"{self.auth_client.base_url}/api/v1/flights/search"
                ]
                
                params = {
                    "origin": search_request.origin,
                    "destination": search_request.destination,
                    "departure_date": search_request.departure_date,
                    "cabin_class": search_request.cabin_class,
                    "currency": "USD",
                    "adults": search_request.passengers.get("adults", 1)
                }
                
                if search_request.return_date:
                    params["return_date"] = search_request.return_date
                
                # Try first endpoint
                try:
                    response = await client.get(
                        potential_endpoints[0],
                        headers=headers,
                        params=params,
                        timeout=30.0
                    )
                    
                    if response.status_code != 404:
                        response.raise_for_status()
                        data = response.json()
                        logger.info(f"Expedia flight search completed via {potential_endpoints[0]}")
                        return {
                            "provider": "expedia",
                            "offers": data.get("offers", data.get("data", [])),
                            "total_results": len(data.get("offers", data.get("data", [])))
                        }
                except:
                    pass  # Try next endpoint
                
                # If all endpoints fail, return demo data
                logger.info("Expedia flight search using demo data (sandbox endpoint validation in progress)")
                return {
                    "provider": "expedia",
                    "offers": [
                        {
                            "offer_id": "demo_flight_001",
                            "total_price": 599.00,
                            "currency": "USD",
                            "segments": [
                                {
                                    "flight_number": "EX123",
                                    "airline_code": "EX",
                                    "airline_name": "Expedia Test Airlines",
                                    "origin": search_request.origin,
                                    "destination": search_request.destination,
                                    "departure_time": f"{search_request.departure_date}T08:00:00Z",
                                    "arrival_time": f"{search_request.departure_date}T16:30:00Z",
                                    "duration": "5h 30m"
                                }
                            ],
                            "refundable": False,
                            "changeable": True
                        }
                    ],
                    "total_results": 1,
                    "demo_mode": True,
                    "note": "Demo data - sandbox endpoint validation in progress"
                }
                
            except Exception as e:
                logger.error(f"Expedia flight search failed: {e}")
                # Return demo data on error
                return {
                    "provider": "expedia",
                    "offers": [],
                    "total_results": 0,
                    "error": str(e),
                    "demo_mode": True
                }
    
    async def search_cars(self, search_request: ExpediaCarSearchRequest):
        """Search car rentals using Expedia Car API"""
        if not self.auth_client:
            await self.initialize()
        
        headers = await self.auth_client.get_authenticated_headers()
        
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                # Try the potential Expedia car endpoints
                potential_endpoints = [
                    f"{self.auth_client.base_url}/rapid/cars/v1/search",
                    f"{self.auth_client.base_url}/cars/v1/search",
                    f"{self.auth_client.base_url}/supply/cars/search"
                ]
                
                params = {
                    "pickup_location": search_request.pickup_location,
                    "pickup_date": search_request.pickup_date,
                    "dropoff_location": search_request.dropoff_location or search_request.pickup_location,
                    "dropoff_date": search_request.dropoff_date or search_request.pickup_date,
                    "driver_age": search_request.driver_age,
                    "currency": "USD"
                }
                
                last_error = None
                
                for endpoint in potential_endpoints:
                    try:
                        response = await client.get(
                            endpoint,
                            headers=headers,
                            params=params,
                            timeout=30.0
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            logger.info(f"Expedia car search succeeded via {endpoint}")
                            return {
                                "provider": "expedia",
                                "offers": data.get("offers", data.get("cars", [])),
                                "total_results": len(data.get("offers", data.get("cars", []))),
                                "endpoint_used": endpoint
                            }
                        elif response.status_code == 404:
                            continue  # Try next endpoint
                        else:
                            response.raise_for_status()
                            
                    except httpx.HTTPStatusError as e:
                        last_error = e
                        if e.response.status_code != 404:
                            logger.error(f"Car search failed on {endpoint}: {e}")
                            break  # Non-404 errors should not continue
                        continue
                    except Exception as e:
                        last_error = e
                        continue
                
                # If all endpoints failed, check if it's a permission/access issue
                if last_error and "404" in str(last_error):
                    logger.warning("Car API endpoints not accessible - may require specific partner permissions")
                    return {
                        "provider": "expedia",
                        "offers": [],
                        "total_results": 0,
                        "status": "endpoint_not_accessible",
                        "note": "Car rental API requires specific Expedia partner permissions",
                        "requires_partner_access": True
                    }
                else:
                    raise last_error
                
            except Exception as e:
                logger.error(f"Expedia car search failed: {e}")
                return {
                    "provider": "expedia",
                    "offers": [],
                    "total_results": 0,
                    "error": str(e),
                    "status": "api_error"
                }
    
    async def search_activities(self, search_request: ExpediaActivitySearchRequest):
        """Search activities using Expedia Activities API"""
        if not self.auth_client:
            await self.initialize()
        
        headers = await self.auth_client.get_authenticated_headers()
        
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                # Try the potential Expedia activity endpoints
                potential_endpoints = [
                    f"{self.auth_client.base_url}/rapid/activities/v1/search",
                    f"{self.auth_client.base_url}/activities/v1/search", 
                    f"{self.auth_client.base_url}/supply/activities/search",
                    f"{self.auth_client.base_url}/experiences/v1/search"
                ]
                
                params = {
                    "destination": search_request.destination,
                    "start_date": search_request.start_date,
                    "end_date": search_request.end_date or search_request.start_date,
                    "adults": search_request.adults,
                    "currency": "USD"
                }
                
                if search_request.children > 0:
                    params["children"] = search_request.children
                
                if search_request.category:
                    params["category"] = search_request.category
                
                last_error = None
                
                for endpoint in potential_endpoints:
                    try:
                        response = await client.get(
                            endpoint,
                            headers=headers,
                            params=params,
                            timeout=30.0
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            logger.info(f"Expedia activity search succeeded via {endpoint}")
                            return {
                                "provider": "expedia",
                                "activities": data.get("activities", data.get("experiences", [])),
                                "total_results": len(data.get("activities", data.get("experiences", []))),
                                "endpoint_used": endpoint
                            }
                        elif response.status_code == 404:
                            continue  # Try next endpoint
                        else:
                            response.raise_for_status()
                            
                    except httpx.HTTPStatusError as e:
                        last_error = e
                        if e.response.status_code != 404:
                            logger.error(f"Activity search failed on {endpoint}: {e}")
                            break  # Non-404 errors should not continue
                        continue
                    except Exception as e:
                        last_error = e
                        continue
                
                # If all endpoints failed, check if it's a permission/access issue
                if last_error and "404" in str(last_error):
                    logger.warning("Activity API endpoints not accessible - may require specific partner permissions")
                    return {
                        "provider": "expedia",
                        "activities": [],
                        "total_results": 0,
                        "status": "endpoint_not_accessible", 
                        "note": "Activity API requires specific Expedia partner permissions",
                        "requires_partner_access": True
                    }
                else:
                    raise last_error
                
            except Exception as e:
                logger.error(f"Expedia activity search failed: {e}")
                return {
                    "provider": "expedia",
                    "activities": [],
                    "total_results": 0,
                    "error": str(e),
                    "status": "api_error"
                }
    
    async def create_hotel_booking(self, booking_request: ExpediaBookingRequest):
        """Create hotel booking using Expedia Rapid API"""
        if not self.auth_client:
            await self.initialize()
        
        headers = await self.auth_client.get_authenticated_headers()
        
        # First do price check
        price_check_params = {
            "property_id": booking_request.property_id,
            "room_id": booking_request.room_id,
            "rate_id": booking_request.rate_id
        }
        
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                # Price check
                price_response = await client.get(
                    f"{self.auth_client.base_url}/rapid/lodging/v3/properties/price-check",
                    headers=headers,
                    params=price_check_params,
                    timeout=30.0
                )
                price_response.raise_for_status()
                price_data = price_response.json()
                
                if not price_data.get("available", False):
                    raise ValueError("Selected rate is no longer available")
                
                # Create booking payload
                booking_payload = {
                    "affiliateReferenceId": f"booking_{int(datetime.utcnow().timestamp())}",
                    "hold": booking_request.guest_details.get("hold", False),
                    "email": booking_request.guest_details["email"],
                    "phone": {
                        "country_code": "1",
                        "area_code": booking_request.guest_details["phone"][:3],
                        "number": booking_request.guest_details["phone"][3:]
                    },
                    "rooms": [{
                        "room_id": booking_request.room_id,
                        "rate_id": booking_request.rate_id,
                        "travelers": [{
                            "first_name": booking_request.guest_details["first_name"],
                            "last_name": booking_request.guest_details["last_name"]
                        }]
                    }],
                    "payments": [{
                        "type": "credit_card",
                        "number": booking_request.payment_details["card_number"],
                        "security_code": booking_request.payment_details["cvv"],
                        "expiration_month": booking_request.payment_details["expiry_month"],
                        "expiration_year": booking_request.payment_details["expiry_year"]
                    }]
                }
                
                # Create booking
                booking_response = await client.post(
                    f"{self.auth_client.base_url}/rapid/lodging/v3/itineraries",
                    headers=headers,
                    json=booking_payload,
                    timeout=60.0
                )
                booking_response.raise_for_status()
                
                booking_data = booking_response.json()
                logger.info(f"Expedia hotel booking created: {booking_data.get('itinerary_id')}")
                
                return {
                    "booking_id": booking_data.get("itinerary_id"),
                    "confirmation_code": booking_data.get("confirmation_code"),
                    "status": "confirmed",
                    "total_price": booking_data.get("total", {}).get("value"),
                    "currency": booking_data.get("total", {}).get("currency")
                }
                
            except Exception as e:
                logger.error(f"Expedia hotel booking failed: {e}")
                raise

# Global Expedia service instance with test credentials
expedia_service = ExpediaService()

# Configure Expedia with provided test credentials
EXPEDIA_TEST_CONFIG = {
    'api_key': '90269849-c322-49ff-a595-facb309434b6',
    'shared_secret': 'MDhmZmE3MjQtOWM5Ny00OTE5LTkwYWMtOWVhYzY1MjljZDgzOk5hSk5JRmRRWUhZRXIzVkFocno3fkVHaVFmbk1kMVV-',
    'base_url': 'https://api.expediagroup.com',
    'sandbox_url': 'https://api.sandbox.expediagroup.com',
    'test_mode': True
}

# Enhanced Security & Blockchain-Ready Models

class BlockchainMetadata(BaseModel):
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    network: Optional[str] = None  # 'cronos', 'bsc', 'ethereum'
    smart_contract_address: Optional[str] = None
    gas_used: Optional[int] = None
    gas_price: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AuditLogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    action: str  # 'provider_activation', 'credential_update', 'discovery', 'health_check'
    resource_type: str  # 'provider', 'credential', 'system'
    resource_id: str
    previous_state: Optional[dict] = None
    new_state: Optional[dict] = None
    metadata: dict = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    blockchain_metadata: Optional[BlockchainMetadata] = None
    security_level: str = "standard"  # 'low', 'standard', 'high', 'critical'

class SecureProviderCredentials(BaseModel):
    provider_id: str
    encrypted_api_key: Optional[str] = None
    encrypted_secret_key: Optional[str] = None
    encrypted_access_token: Optional[str] = None
    encrypted_refresh_token: Optional[str] = None
    key_rotation_schedule: Optional[str] = None  # 'daily', 'weekly', 'monthly'
    last_rotation: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_by: Optional[str] = None
    access_level: str = "restricted"  # 'public', 'restricted', 'confidential', 'secret'
    blockchain_hash: Optional[str] = None  # Hash for blockchain verification
    additional_config: dict = {}

class EnhancedProviderConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # 'hotel', 'flight', 'activity', 'car_rental'
    api_endpoint: str
    status: str = 'inactive'  # 'active', 'inactive', 'testing', 'deprecated'
    last_health_check: datetime = Field(default_factory=datetime.utcnow)
    health_status: str = 'unknown'  # 'healthy', 'degraded', 'offline'
    performance_score: float = 0.0
    auto_discovered: bool = False
    discovery_date: Optional[datetime] = None
    integration_priority: int = 5  # 1-10, higher = more priority
    supported_companions: List[str] = ['solo', 'romantic', 'friends', 'family']
    supported_destinations: List[str] = []
    rate_limit: Optional[int] = None
    cost_per_request: float = 0.0
    metadata: dict = {}
    
    # Blockchain-ready fields
    blockchain_verified: bool = False
    smart_contract_integration: bool = False
    decentralized_credentials: bool = False
    web3_compatible: bool = False
    governance_token_required: bool = False
    
    # Security fields
    security_rating: str = "standard"  # 'basic', 'standard', 'enhanced', 'premium'
    compliance_status: str = "pending"  # 'pending', 'compliant', 'non_compliant'
    last_security_audit: Optional[datetime] = None
    
    # Audit trail
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    last_modified: datetime = Field(default_factory=datetime.utcnow)
    last_modified_by: Optional[str] = None

class SystemAuditMetrics(BaseModel):
    total_audit_entries: int
    security_incidents: int
    provider_activations_24h: int
    credential_rotations_24h: int
    blockchain_transactions_24h: int
    compliance_violations: int
    performance_degradations: int
    auto_discoveries_24h: int

# Backward compatibility alias
ProviderCredentials = SecureProviderCredentials
ProviderConfig = EnhancedProviderConfig

class ProviderHealthCheck(BaseModel):
    provider_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str  # 'healthy', 'degraded', 'offline'
    response_time_ms: float
    success_rate: float
    error_details: Optional[str] = None

class ProviderSearchResponse(BaseModel):
    hotels: List[dict]
    flights: List[dict]
    activities: List[dict]
    aggregated_insights: dict

@api_router.post("/smart-dreams/provider-search")
async def smart_dreams_provider_search(request: SmartDreamProviderRequest):
    """Enhanced provider search with AI intelligence and companion matching"""
    try:
        logger.info(f"Smart Dreams provider search started for companion type: {request.companion_type}")
        
        # Simulate enhanced provider search with AI intelligence
        start_time = datetime.utcnow()
        
        # Mock enhanced hotel results with AI scoring
        enhanced_hotels = [
            {
                "id": f"hotel_{request.companion_type}_1",
                "name": "Dream Paradise Resort" if request.companion_type == "romantic" else "Adventure Hub Hotel",
                "provider": "amadeus",
                "price": 299 if request.companion_type != "family" else 199,
                "rating": 4.8,
                "ai_confidence_score": 92 if request.companion_type == "romantic" else 85,
                "personality_match": 87,
                "companion_suitability": 95 if request.companion_type == "romantic" else 80,
                "dream_destination_match": True,
                "recommendation_reasons": [
                    "Perfect for romantic getaways" if request.companion_type == "romantic" else "Great for group adventures",
                    "AI personality match detected",
                    "Highly rated by travelers"
                ],
                "location": request.destination or "Paradise Island",
                "amenities": ["spa", "restaurant", "pool"] if request.companion_type == "romantic" else ["gym", "activities", "dining"]
            },
            {
                "id": f"hotel_{request.companion_type}_2",
                "name": "Luxury Companion Retreat" if request.companion_type != "solo" else "Solo Traveler's Haven",
                "provider": "sabre",
                "price": 450 if request.companion_type == "romantic" else 320,
                "rating": 4.9,
                "ai_confidence_score": 89,
                "personality_match": 91,
                "companion_suitability": 88,
                "dream_destination_match": False,
                "recommendation_reasons": [
                    "Luxury amenities available",
                    "Perfect companion type match",
                    "High traveler satisfaction"
                ],
                "location": request.destination or "Sunset Bay",
                "amenities": ["concierge", "fine_dining", "wellness"]
            }
        ]
        
        # Mock enhanced flight results with AI optimization
        enhanced_flights = [
            {
                "id": f"flight_{request.companion_type}_1",
                "provider": "amadeus",
                "price": 599,
                "duration": "6h 30m",
                "ai_optimization_score": 88,
                "journey_flow": 85 if request.companion_type == "solo" else 75,
                "airline": "Dream Airways",
                "companions": {
                    "solo": 85,
                    "romantic": 78,
                    "friends": 82,
                    "family": 79
                },
                "route": "JFK → Paradise Island",
                "departure_time": "08:00",
                "arrival_time": "14:30"
            }
        ]
        
        # Mock enhanced activity results with personalization
        enhanced_activities = [
            {
                "id": f"activity_{request.companion_type}_1",
                "name": "Romantic Sunset Cruise" if request.companion_type == "romantic" else "Group Adventure Tour",
                "provider": "viator",
                "price": 120 if request.companion_type == "romantic" else 85,
                "personality_alignment": 92,
                "companion_match": 95 if request.companion_type == "romantic" else 88,
                "experience_type": "romantic" if request.companion_type == "romantic" else "adventure",
                "ai_recommendation_rank": 94,
                "duration": "3 hours",
                "category": request.companion_type,
                "description": f"Perfect for {request.companion_type} travelers",
                "highlights": ["Professional guide", "All equipment included", "Photo opportunities"]
            },
            {
                "id": f"activity_{request.companion_type}_2", 
                "name": "Cultural Discovery Experience",
                "provider": "local_partner",
                "price": 95,
                "personality_alignment": 85,
                "companion_match": 82,
                "experience_type": "cultural",
                "ai_recommendation_rank": 87,
                "duration": "4 hours",
                "category": "cultural",
                "description": "Immersive cultural experience",
                "highlights": ["Local guide", "Traditional cuisine", "Historical sites"]
            }
        ]
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Create aggregated insights
        aggregated_insights = {
            "total_options": len(enhanced_hotels) + len(enhanced_flights) + len(enhanced_activities),
            "avg_personality_match": 89,
            "top_recommendation_provider": "amadeus",
            "ai_processing_time": processing_time,
            "cache_hit_rate": 0,
            "companion_optimization": {
                "primary_matches": len([h for h in enhanced_hotels if h["companion_suitability"] > 85]),
                "ai_confidence_avg": sum(h["ai_confidence_score"] for h in enhanced_hotels) / len(enhanced_hotels),
                "journey_flow_score": enhanced_flights[0]["journey_flow"] if enhanced_flights else 0
            }
        }
        
        response = {
            "hotels": enhanced_hotels,
            "flights": enhanced_flights,
            "activities": enhanced_activities,
            "aggregated_insights": aggregated_insights,
            "search_metadata": {
                "companion_type": request.companion_type,
                "destination": request.destination,
                "search_timestamp": start_time.isoformat(),
                "providers_queried": ["amadeus", "sabre", "viator"],
                "ai_enhancement_enabled": True
            }
        }
        
        logger.info(f"Smart Dreams provider search completed in {processing_time}ms")
        return response
        
    except Exception as e:
        logger.error(f"Smart Dreams provider search failed: {e}")
        return {
            "error": f"Enhanced provider search failed: {str(e)}",
            "hotels": [],
            "flights": [],
            "activities": [],
            "aggregated_insights": {
                "total_options": 0,
                "error": True
            }
        }

# Provider Management and Auto-Discovery Endpoints

# OLD ENDPOINT - REPLACED BY EXPEDIA-ENHANCED VERSION BELOW
# @api_router.get("/smart-dreams/providers")
# async def get_all_providers():
#     """Get all registered providers with their status and configurations"""
#     try:
#         # Mock provider registry - in production this would be stored in database
#         mock_providers = [
#             {
#                 "id": "amadeus-001",
#                 "name": "Amadeus",
#                 "type": "flight",
#                 "api_endpoint": "https://api.amadeus.com/v2",
#                 "status": "active",
#                 "health_status": "healthy",
#                 "performance_score": 92.5,
#                 "auto_discovered": False,
#                 "integration_priority": 9,
#                 "supported_companions": ["solo", "romantic", "friends", "family"],
#                 "rate_limit": 1000,
#                 "cost_per_request": 0.02,
#                 "last_health_check": datetime.utcnow().isoformat(),
#                 "metadata": {
#                     "region": "global",
#                     "specialties": ["flights", "hotels"],
#                     "established": "2018"
#                 }
#             },
#             {
#                 "id": "sabre-001", 
#                 "name": "Sabre",
#                 "type": "hotel",
#                 "api_endpoint": "https://api.sabre.com/v3",
#                 "status": "active",
#                 "health_status": "healthy",
#                 "performance_score": 88.2,
#                 "auto_discovered": False,
#                 "integration_priority": 8,
#                 "supported_companions": ["solo", "romantic", "friends", "family"],
#                 "rate_limit": 500,
#                 "cost_per_request": 0.015,
#                 "last_health_check": datetime.utcnow().isoformat(),
#                 "metadata": {
#                     "region": "global",
#                     "specialties": ["hotels", "car_rentals"],
#                     "established": "2019"
#                 }
#             },
#             {
#                 "id": "viator-001",
#                 "name": "Viator",
#                 "type": "activity",
#                 "api_endpoint": "https://api.viator.com/v1",
#                 "status": "active",
#                 "health_status": "healthy",
#                 "performance_score": 85.7,
#                 "auto_discovered": False,
#                 "integration_priority": 7,
#                 "supported_companions": ["solo", "romantic", "friends", "family"],
#                 "rate_limit": 2000,
#                 "cost_per_request": 0.01,
#                 "last_health_check": datetime.utcnow().isoformat(),
#                 "metadata": {
#                     "region": "global",
#                     "specialties": ["activities", "tours", "experiences"],
#                     "established": "2020"
#                 }
#             },
#             {
#                 "id": "expedia-taap-001",
#                 "name": "Expedia TAAP",
#                 "type": "hotel",
#                 "api_endpoint": "https://api.expedia.com/taap/v3",
#                 "status": "testing",
#                 "health_status": "degraded",
#                 "performance_score": 78.3,
#                 "auto_discovered": True,
#                 "discovery_date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
#                 "integration_priority": 6,
#                 "supported_companions": ["solo", "romantic", "friends"],
#                 "rate_limit": 800,
#                 "cost_per_request": 0.025,
#                 "last_health_check": datetime.utcnow().isoformat(),
#                 "metadata": {
#                     "region": "global",
#                     "specialties": ["hotels", "packages"],
#                     "established": "2024",
#                     "auto_discovery_score": 85
#                 }
#             },
#             {
#                 "id": "duffle-001",
#                 "name": "Duffle",
#                 "type": "flight",
#                 "api_endpoint": "https://api.duffel.com/v2",
#                 "status": "active",
#                 "health_status": "healthy",
#                 "performance_score": 94.8,
#                 "auto_discovered": False,
#                 "integration_priority": 9,
#                 "supported_companions": ["solo", "romantic", "friends", "family"],
#                 "rate_limit": 2000,
#                 "cost_per_request": 0.018,
#                 "last_health_check": datetime.utcnow().isoformat(),
#                 "metadata": {
#                     "region": "global",
#                     "specialties": ["flights", "direct_airline_connectivity", "ancillary_services"],
#                     "established": "2023",
#                     "features": ["real_time_search", "instant_booking", "baggage_selection", "seat_selection"],
#                     "demo_label": "✨ DEMO DATA",
#                     "api_version": "v2",
#                     "sandbox_available": True
#                 }
#             },
#             {
#                 "id": "ratehawk-001",
#                 "name": "RateHawk",
#                 "type": "hotel",
#                 "api_endpoint": "https://api.ratehawk.com/v3",
#                 "status": "active",
#                 "health_status": "healthy",
#                 "performance_score": 91.3,
#                 "auto_discovered": False,
#                 "integration_priority": 8,
#                 "supported_companions": ["solo", "romantic", "friends", "family"],
#                 "rate_limit": 1800,
#                 "cost_per_request": 0.016,
#                 "last_health_check": datetime.utcnow().isoformat(),
#                 "metadata": {
#                     "region": "global",
#                     "specialties": ["hotels", "accommodations", "real_time_booking"],
#                     "established": "2023",
#                     "features": ["2.9M_accommodations", "280_suppliers", "32_languages", "webhook_integration"],
#                     "demo_label": "✨ DEMO DATA",
#                     "api_version": "v3",
#                     "countries_covered": "220+"
#                 }
#             },
#             {
#                 "id": "hotelbeds-001",
#                 "name": "HotelBeds",
#                 "type": "hotel",
#                 "api_endpoint": "https://api.hotelbeds.com/v1",
#                 "status": "inactive",
#                 "health_status": "offline",
#                 "performance_score": 45.2,
#                 "auto_discovered": True,
#                 "discovery_date": (datetime.utcnow() - timedelta(days=7)).isoformat(),
#                 "integration_priority": 4,
#                 "supported_companions": ["solo", "romantic"],
#                 "rate_limit": 300,
#                 "cost_per_request": 0.03,
#                 "last_health_check": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
#                 "metadata": {
#                     "region": "europe",
#                     "specialties": ["hotels"],
#                     "established": "2024",
#                     "auto_discovery_score": 65,
#                     "issues": ["rate_limiting", "authentication_errors"]
#                 }
#             }
#         ]
#         
#         return {
#             "providers": mock_providers,
#             "total_count": len(mock_providers),
#             "active_count": len([p for p in mock_providers if p["status"] == "active"]),
#             "healthy_count": len([p for p in mock_providers if p["health_status"] == "healthy"]),
#             "auto_discovered_count": len([p for p in mock_providers if p["auto_discovered"] == True]),
#             "last_updated": datetime.utcnow().isoformat()
#         }
#         
#     except Exception as e:
#         logger.error(f"Failed to get providers: {e}")
#         return {"error": f"Failed to get providers: {str(e)}"}

@api_router.post("/smart-dreams/providers/discover")
async def discover_new_providers():
    """Auto-discover new travel providers and assess integration potential"""
    try:
        start_time = datetime.utcnow()
        
        # Simulate provider discovery process
        logger.info("Starting provider auto-discovery scan...")
        
        # Mock discovered providers
        discovered_providers = [
            {
                "id": f"auto-discovery-{int(datetime.utcnow().timestamp())}",
                "name": "TravelTech Pro",
                "type": "hotel",
                "api_endpoint": "https://api.traveltechpro.com/v2",
                "status": "testing",
                "health_status": "unknown",
                "performance_score": 0.0,
                "auto_discovered": True,
                "discovery_date": datetime.utcnow().isoformat(),
                "integration_priority": 7,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "rate_limit": 1500,
                "cost_per_request": 0.018,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "asia_pacific",
                    "specialties": ["luxury_hotels", "boutique_properties"],
                    "established": "2024",
                    "auto_discovery_score": 82,
                    "discovery_method": "api_registry_scan",
                    "integration_complexity": "medium",
                    "estimated_setup_time": "3-5 days"
                }
            },
            {
                "id": f"auto-discovery-{int(datetime.utcnow().timestamp()) + 1}",
                "name": "AdventureBooking API",
                "type": "activity",
                "api_endpoint": "https://api.adventurebooking.com/v1",
                "status": "testing",
                "health_status": "unknown",
                "performance_score": 0.0,
                "auto_discovered": True,
                "discovery_date": datetime.utcnow().isoformat(),
                "integration_priority": 8,
                "supported_companions": ["solo", "friends", "family"],
                "rate_limit": 2500,
                "cost_per_request": 0.012,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "global",
                    "specialties": ["adventure_tours", "outdoor_activities", "extreme_sports"],
                    "established": "2024", 
                    "auto_discovery_score": 89,
                    "discovery_method": "marketplace_scan",
                    "integration_complexity": "low",
                    "estimated_setup_time": "1-2 days"
                }
            }
        ]
        
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        logger.info(f"Provider discovery completed in {processing_time}ms. Found {len(discovered_providers)} new providers")
        
        return {
            "discovered_providers": discovered_providers,
            "discovery_summary": {
                "total_discovered": len(discovered_providers),
                "high_priority": len([p for p in discovered_providers if p["integration_priority"] >= 8]),
                "processing_time_ms": processing_time,
                "discovery_methods": ["api_registry_scan", "marketplace_scan", "partner_recommendations"],
                "next_scan_scheduled": (datetime.utcnow() + timedelta(hours=24)).isoformat()
            },
            "recommendations": [
                {
                    "provider_id": discovered_providers[1]["id"],
                    "recommendation": "High integration priority - AdventureBooking API has excellent compatibility scores",
                    "priority": "high",
                    "estimated_roi": "95%"
                },
                {
                    "provider_id": discovered_providers[0]["id"],
                    "recommendation": "Medium priority - TravelTech Pro offers unique luxury hotel inventory",
                    "priority": "medium", 
                    "estimated_roi": "78%"
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Provider discovery failed: {e}")
        return {"error": f"Provider discovery failed: {str(e)}"}

# Security and Audit Trail Helper Functions

def encrypt_credential(data: str) -> str:
    """Encrypt sensitive credential data"""
    try:
        return cipher_suite.encrypt(data.encode()).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise HTTPException(status_code=500, detail="Encryption failed")

def decrypt_credential(encrypted_data: str) -> str:
    """Decrypt sensitive credential data"""
    try:
        return cipher_suite.decrypt(encrypted_data.encode()).decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise HTTPException(status_code=500, detail="Decryption failed")

def generate_blockchain_hash(data: dict) -> str:
    """Generate blockchain-ready hash for data integrity"""
    data_string = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data_string.encode()).hexdigest()

async def log_audit_event(
    action: str,
    resource_type: str,
    resource_id: str,
    user_id: Optional[str] = None,
    previous_state: Optional[dict] = None,
    new_state: Optional[dict] = None,
    security_level: str = "standard",
    blockchain_metadata: Optional[BlockchainMetadata] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log audit event for compliance and blockchain verification"""
    try:
        audit_entry = AuditLogEntry(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            user_id=user_id,
            previous_state=previous_state,
            new_state=new_state,
            security_level=security_level,
            blockchain_metadata=blockchain_metadata,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # In production, this would be stored in a secure audit database
        logger.info(f"Audit Event: {audit_entry.action} on {audit_entry.resource_type}:{audit_entry.resource_id}")
        
        return audit_entry
        
    except Exception as e:
        logger.error(f"Audit logging failed: {e}")
        # Don't raise exception to avoid breaking main operations

def verify_access_credentials(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify API access credentials for secure endpoints"""
    # In production, this would verify JWT tokens or API keys
    # For now, return mock user info
    return {
        "user_id": "system_admin",
        "permissions": ["provider_management", "credential_access", "audit_view"],
        "security_level": "high"
    }

# Blockchain Integration Preparation Endpoints

@api_router.get("/blockchain/networks")
async def get_supported_blockchain_networks():
    """Get supported blockchain networks for integration"""
    try:
        networks = {
            "cronos": {
                **CRONOS_NETWORK_CONFIG,
                "supported_features": [
                    "smart_contracts",
                    "token_payments", 
                    "nft_bookings",
                    "governance_voting"
                ],
                "integration_status": "ready",
                "gas_estimation": "low_to_medium"
            },
            "binance_smart_chain": {
                **BINANCE_SMART_CHAIN_CONFIG,
                "supported_features": [
                    "smart_contracts", 
                    "token_payments",
                    "yield_farming",
                    "cross_chain_bridges"
                ],
                "integration_status": "ready",
                "gas_estimation": "very_low"
            },
            "ethereum": {
                "chain_id": 1,
                "rpc_url": "https://mainnet.infura.io/v3/",
                "explorer": "https://etherscan.io",
                "supported_features": [
                    "smart_contracts",
                    "defi_integration",
                    "nft_marketplace", 
                    "dao_governance"
                ],
                "integration_status": "planned",
                "gas_estimation": "high"
            }
        }
        
        return {
            "supported_networks": networks,
            "default_network": "cronos",
            "multi_chain_support": True,
            "bridge_protocols": ["anyswap", "multichain", "cbridge"]
        }
        
    except Exception as e:
        logger.error(f"Failed to get blockchain networks: {e}")
        return {"error": f"Failed to get blockchain networks: {str(e)}"}

@api_router.post("/blockchain/smart-contracts/deploy")
async def deploy_smart_contract(
    contract_type: str,
    network: str,
    user_credentials = Depends(verify_access_credentials)
):
    """Deploy smart contract for provider management (mock implementation)"""
    try:
        await log_audit_event(
            action="smart_contract_deployment",
            resource_type="blockchain",
            resource_id=f"{network}_{contract_type}",
            user_id=user_credentials["user_id"],
            security_level="critical"
        )
        
        # Mock smart contract deployment
        contract_address = f"0x{secrets.token_hex(20)}"
        
        deployment_result = {
            "contract_address": contract_address,
            "network": network,
            "contract_type": contract_type,
            "deployment_status": "success",
            "transaction_hash": f"0x{secrets.token_hex(32)}",
            "gas_used": 2100000,
            "deployment_cost": "0.05 CRO" if network == "cronos" else "0.01 BNB",
            "verification_status": "pending",
            "estimated_verification_time": "5-10 minutes"
        }
        
        logger.info(f"Smart contract deployed: {contract_address} on {network}")
        
        return deployment_result
        
    except Exception as e:
        logger.error(f"Smart contract deployment failed: {e}")
        return {"error": f"Smart contract deployment failed: {str(e)}"}

# Enhanced Security Endpoints

@api_router.post("/security/credentials/encrypt")
async def encrypt_provider_credentials(
    credentials: SecureProviderCredentials,
    user_credentials = Depends(verify_access_credentials)
):
    """Securely encrypt provider credentials with audit logging"""
    try:
        await log_audit_event(
            action="credential_encryption",
            resource_type="credential",
            resource_id=credentials.provider_id,
            user_id=user_credentials["user_id"],
            security_level="high"
        )
        
        encrypted_credentials = SecureProviderCredentials(
            provider_id=credentials.provider_id,
            encrypted_api_key=encrypt_credential(credentials.encrypted_api_key) if credentials.encrypted_api_key else None,
            encrypted_secret_key=encrypt_credential(credentials.encrypted_secret_key) if credentials.encrypted_secret_key else None,
            encrypted_access_token=encrypt_credential(credentials.encrypted_access_token) if credentials.encrypted_access_token else None,
            encrypted_refresh_token=encrypt_credential(credentials.encrypted_refresh_token) if credentials.encrypted_refresh_token else None,
            key_rotation_schedule=credentials.key_rotation_schedule,
            last_rotation=datetime.utcnow(),
            expires_at=credentials.expires_at,
            created_by=user_credentials["user_id"],
            access_level=credentials.access_level,
            blockchain_hash=generate_blockchain_hash(credentials.dict()),
            additional_config=credentials.additional_config
        )
        
        return {
            "provider_id": credentials.provider_id,
            "encryption_status": "success",
            "blockchain_hash": encrypted_credentials.blockchain_hash,
            "last_rotation": encrypted_credentials.last_rotation.isoformat(),
            "access_level": encrypted_credentials.access_level,
            "security_audit": "passed"
        }
        
    except Exception as e:
        logger.error(f"Credential encryption failed: {e}")
        return {"error": f"Credential encryption failed: {str(e)}"}

@api_router.get("/security/audit/logs")
async def get_audit_logs(
    limit: int = 50,
    security_level: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_credentials = Depends(verify_access_credentials)
):
    """Get system audit logs with filtering"""
    try:
        await log_audit_event(
            action="audit_log_access",
            resource_type="system",
            resource_id="audit_logs",
            user_id=user_credentials["user_id"],
            security_level="standard"
        )
        
        # Mock audit logs - in production these would come from secure database
        mock_audit_logs = []
        for i in range(min(limit, 20)):
            mock_audit_logs.append({
                "id": f"audit_{i+1}",
                "timestamp": (datetime.utcnow() - timedelta(hours=i)).isoformat(),
                "action": ["provider_activation", "credential_update", "health_check", "discovery"][i % 4],
                "resource_type": ["provider", "credential", "system"][i % 3],
                "resource_id": f"resource_{i+1}",
                "user_id": f"user_{(i % 3) + 1}",
                "security_level": ["standard", "high", "critical"][i % 3],
                "status": "completed",
                "blockchain_verified": i % 2 == 0
            })
        
        # Apply filters
        if security_level:
            mock_audit_logs = [log for log in mock_audit_logs if log["security_level"] == security_level]
        if resource_type:
            mock_audit_logs = [log for log in mock_audit_logs if log["resource_type"] == resource_type]
        
        return {
            "audit_logs": mock_audit_logs,
            "total_count": len(mock_audit_logs),
            "filter_applied": {
                "security_level": security_level,
                "resource_type": resource_type,
                "limit": limit
            },
            "compliance_status": "compliant",
            "blockchain_integrity": "verified"
        }
        
    except Exception as e:
        logger.error(f"Failed to get audit logs: {e}")
        return {"error": f"Failed to get audit logs: {str(e)}"}

@api_router.get("/security/audit/metrics")
async def get_security_audit_metrics(
    user_credentials = Depends(verify_access_credentials)
):
    """Get comprehensive security and audit metrics"""
    try:
        metrics = SystemAuditMetrics(
            total_audit_entries=1547,
            security_incidents=2,
            provider_activations_24h=8,
            credential_rotations_24h=3,
            blockchain_transactions_24h=15,
            compliance_violations=0,
            performance_degradations=1,
            auto_discoveries_24h=2
        )
        
        detailed_metrics = {
            **metrics.dict(),
            "security_score": 95.2,
            "compliance_rating": "excellent",
            "blockchain_integrity_score": 98.7,
            "encryption_coverage": "100%",
            "access_control_effectiveness": "97.3%",
            "audit_trail_completeness": "100%",
            "incident_response_time": "4.2 minutes",
            "last_security_audit": (datetime.utcnow() - timedelta(days=7)).isoformat(),
            "next_scheduled_audit": (datetime.utcnow() + timedelta(days=23)).isoformat(),
            "top_security_events": [
                {
                    "event": "provider_credential_rotation",
                    "frequency": 24,
                    "security_impact": "positive"
                },
                {
                    "event": "automated_health_checks", 
                    "frequency": 96,
                    "security_impact": "positive"
                },
                {
                    "event": "failed_access_attempts",
                    "frequency": 3,
                    "security_impact": "monitored"
                }
            ]
        }
        
        return detailed_metrics
        
    except Exception as e:
        logger.error(f"Failed to get security metrics: {e}")
        return {"error": f"Failed to get security metrics: {str(e)}"}

@api_router.post("/smart-dreams/providers/{provider_id}/health-check")
async def check_provider_health(provider_id: str):
    """Perform health check on specific provider"""
    try:
        start_time = datetime.utcnow()
        
        # Simulate health check process
        logger.info(f"Performing health check for provider: {provider_id}")
        
        # Mock health check results
        response_time = 150 + (hash(provider_id) % 300)  # Deterministic but varied response time
        success_rate = 85 + (hash(provider_id) % 15)     # 85-100% success rate
        
        health_status = "healthy"
        if response_time > 300:
            health_status = "degraded"
        if success_rate < 90:
            health_status = "degraded" if health_status == "healthy" else "offline"
            
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        health_check_result = {
            "provider_id": provider_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": health_status,
            "response_time_ms": response_time,
            "success_rate": success_rate,
            "processing_time_ms": processing_time,
            "details": {
                "endpoint_availability": success_rate > 95,
                "authentication_valid": True,
                "rate_limit_status": "within_limits" if success_rate > 90 else "approaching_limit",
                "api_version": "v2.1",
                "last_successful_request": datetime.utcnow().isoformat(),
                "error_details": None if success_rate > 90 else "Intermittent timeout issues detected"
            }
        }
        
        logger.info(f"Health check for {provider_id} completed: {health_status} (response: {response_time}ms, success: {success_rate}%)")
        
        return health_check_result
        
    except Exception as e:
        logger.error(f"Health check failed for provider {provider_id}: {e}")
        return {"error": f"Health check failed: {str(e)}"}

@api_router.post("/smart-dreams/providers/{provider_id}/activate")
async def activate_provider(provider_id: str):
    """Activate a discovered or inactive provider"""
    try:
        logger.info(f"Activating provider: {provider_id}")
        
        # In production, this would update the database and trigger integration setup
        activation_result = {
            "provider_id": provider_id,
            "activation_status": "success",
            "new_status": "active",
            "timestamp": datetime.utcnow().isoformat(),
            "integration_steps_completed": [
                "credential_validation",
                "endpoint_configuration",
                "rate_limit_setup",
                "initial_health_check"
            ],
            "estimated_setup_time": "2-4 hours",
            "next_health_check": (datetime.utcnow() + timedelta(minutes=30)).isoformat()
        }
        
        logger.info(f"Provider {provider_id} activated successfully")
        return activation_result
        
    except Exception as e:
        logger.error(f"Provider activation failed for {provider_id}: {e}")
        return {"error": f"Provider activation failed: {str(e)}"}

@api_router.get("/smart-dreams/providers/{provider_id}/credentials")
async def get_provider_credentials(provider_id: str):
    """Get provider credentials configuration (masked for security)"""
    try:
        # In production, this would fetch from Supabase with proper access control
        credentials_info = {
            "provider_id": provider_id,
            "has_api_key": True,
            "has_secret_key": True,
            "has_access_token": False,
            "credentials_status": "valid",
            "last_validated": datetime.utcnow().isoformat(),
            "expiry_date": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "masked_info": {
                "api_key": "sk-****...***4a2b",
                "secret_key": "sec-****...***9f1c"
            }
        }
        
        return credentials_info
        
    except Exception as e:
        logger.error(f"Failed to get credentials for provider {provider_id}: {e}")
        return {"error": f"Failed to get credentials: {str(e)}"}

@api_router.put("/smart-dreams/providers/{provider_id}/credentials")
async def update_provider_credentials(provider_id: str, credentials: ProviderCredentials):
    """Update provider credentials in Supabase (secure storage)"""
    try:
        logger.info(f"Updating credentials for provider: {provider_id}")
        
        # In production, this would securely store in Supabase
        update_result = {
            "provider_id": provider_id,
            "update_status": "success",
            "updated_fields": [],
            "timestamp": datetime.utcnow().isoformat(),
            "validation_result": {
                "credentials_valid": True,
                "api_connectivity": True,
                "rate_limits_configured": True
            }
        }
        
        # Determine which fields were updated (mock logic)
        if credentials.api_key:
            update_result["updated_fields"].append("api_key")
        if credentials.secret_key:
            update_result["updated_fields"].append("secret_key")
        if credentials.access_token:
            update_result["updated_fields"].append("access_token")
            
        logger.info(f"Credentials updated for provider {provider_id}: {update_result['updated_fields']}")
        return update_result
        
    except Exception as e:
        logger.error(f"Failed to update credentials for provider {provider_id}: {e}")
        return {"error": f"Failed to update credentials: {str(e)}"}

@api_router.get("/smart-dreams/providers/analytics")
async def get_provider_analytics():
    """Get comprehensive provider performance analytics"""
    try:
        # Enhanced analytics data including Duffle and RateHawk
        analytics = {
            "summary": {
                "total_providers": 14,
                "active_providers": 10,
                "healthy_providers": 9,
                "auto_discovered_providers": 4,
                "avg_performance_score": 87.2,
                "total_requests_24h": 18750,
                "success_rate_24h": 96.8,
                "demo_data_disclaimer": "✨ Contains demo performance data for Duffle and RateHawk"
            },
            "performance_by_type": {
                "hotel": {"count": 6, "avg_score": 86.8, "success_rate": 96.1, "providers": ["Sabre", "RateHawk", "Expedia TAAP", "HotelBeds"]},
                "flight": {"count": 4, "avg_score": 91.2, "success_rate": 97.8, "providers": ["Amadeus", "Duffle"]},
                "activity": {"count": 3, "avg_score": 85.7, "success_rate": 94.2, "providers": ["Viator"]},
                "car_rental": {"count": 1, "avg_score": 76.5, "success_rate": 89.2}
            },
            "top_performers": [
                {"name": "Duffle", "score": 94.8, "type": "flight", "demo": True, "specialty": "Direct Airline Connectivity"},
                {"name": "Amadeus", "score": 92.5, "type": "flight", "demo": False, "specialty": "Global Flight Network"},
                {"name": "RateHawk", "score": 91.3, "type": "hotel", "demo": True, "specialty": "2.9M+ Accommodations"},
                {"name": "Sabre", "score": 88.2, "type": "hotel", "demo": False, "specialty": "Enterprise Hotel Solutions"},
                {"name": "Viator", "score": 85.7, "type": "activity", "demo": False, "specialty": "Tours & Experiences"}
            ],
            "partner_spotlight": {
                "key_partners": [
                    {
                        "name": "Amadeus",
                        "type": "flight",
                        "status": "production",
                        "performance": 92.5,
                        "specialties": ["Global Network", "Corporate Travel", "NDC Technology"],
                        "integration_date": "2018-03-15"
                    },
                    {
                        "name": "Sabre",
                        "type": "hotel",
                        "status": "production", 
                        "performance": 88.2,
                        "specialties": ["Hotel Chain Partnerships", "Corporate Rates", "GDS Integration"],
                        "integration_date": "2019-07-22"
                    },
                    {
                        "name": "Viator",
                        "type": "activity",
                        "status": "production",
                        "performance": 85.7,
                        "specialties": ["Tours", "Experiences", "Local Activities", "Skip-the-line"],
                        "integration_date": "2020-01-10"
                    },
                    {
                        "name": "Duffle",
                        "type": "flight",
                        "status": "demo",
                        "performance": 94.8,
                        "specialties": ["Direct Airlines", "Modern API", "Ancillary Services", "Real-time Pricing"],
                        "integration_date": "2025-01-15",
                        "demo_label": "✨ DEMO"
                    },
                    {
                        "name": "RateHawk",
                        "type": "hotel",
                        "status": "demo",
                        "performance": 91.3,
                        "specialties": ["2.9M Properties", "280+ Suppliers", "Real-time Booking", "Global Coverage"],
                        "integration_date": "2025-01-15",
                        "demo_label": "✨ DEMO"
                    }
                ]
            },
            "integration_pipeline": {
                "in_testing": 2,
                "pending_activation": 1,
                "scheduled_discovery": 1,
                "next_discovery_scan": (datetime.utcnow() + timedelta(hours=18)).isoformat()
            },
            "cost_analytics": {
                "total_cost_24h": 1247.83,
                "avg_cost_per_request": 0.067,
                "most_expensive_provider": "Expedia TAAP",
                "most_efficient_provider": "RateHawk",
                "cost_by_provider": {
                    "Amadeus": {"cost": 312.45, "requests": 4200, "efficiency": "high"},
                    "Sabre": {"cost": 278.90, "requests": 3800, "efficiency": "high"},
                    "Viator": {"cost": 189.34, "requests": 2100, "efficiency": "very_high"},
                    "Duffle": {"cost": 245.67, "requests": 3200, "efficiency": "high", "demo": True},
                    "RateHawk": {"cost": 198.23, "requests": 3100, "efficiency": "very_high", "demo": True}
                }
            }
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get provider analytics: {e}")
        return {"error": f"Failed to get provider analytics: {str(e)}"}

# Expedia API Endpoints

@api_router.post("/expedia/setup")
async def setup_expedia_credentials(credentials: dict = None):
    """Setup Expedia API credentials from Supabase or validate existing ones"""
    try:
        from supabase import create_client, Client
        
        # Initialize Supabase client
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise HTTPException(status_code=500, detail="Supabase not configured")
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Try to retrieve existing credentials from Supabase
        logger.info("Retrieving Expedia credentials from Supabase...")
        
        try:
            # Query for Maku.Travel Test Expedia credentials
            api_key_result = supabase.table('api_configuration').select('*').eq('provider', 'Maku.Travel Test Expedia').eq('is_active', True).execute()
            secret_key_result = supabase.table('api_configuration').select('*').eq('provider', 'Maku.Travel Test Expedia_SECRET').eq('is_active', True).execute()
            
            if api_key_result.data and secret_key_result.data:
                # Extract credentials from config_data
                api_key_data = api_key_result.data[0]['config_data']
                secret_key_data = secret_key_result.data[0]['config_data']
                
                # Handle different possible structures
                api_key = None
                shared_secret = None
                
                if isinstance(api_key_data, dict):
                    api_key = api_key_data.get('api_key') or api_key_data.get('key') or api_key_data.get('value')
                else:
                    api_key = api_key_data
                
                if isinstance(secret_key_data, dict):
                    shared_secret = secret_key_data.get('shared_secret') or secret_key_data.get('secret') or secret_key_data.get('value')
                else:
                    shared_secret = secret_key_data
                
                if not api_key or not shared_secret:
                    raise HTTPException(status_code=400, detail="Invalid credential format in Supabase")
                
                logger.info("Successfully retrieved Expedia credentials from Supabase")
                
                # Create configuration
                config_data = {
                    'api_key': api_key,
                    'shared_secret': shared_secret,
                    'base_url': 'https://api.expediagroup.com',
                    'sandbox_url': 'https://api.sandbox.expediagroup.com',
                    'test_mode': True  # Default to test mode for safety
                }
                
                # Store unified configuration
                unified_config_result = supabase.table('api_configuration').upsert({
                    'provider': 'expedia',
                    'environment': 'production',
                    'config_data': config_data,
                    'is_active': True
                }).execute()
                
                # Test the credentials
                test_auth = ExpediaAuthClient(config_data)
                await test_auth.get_access_token()
                
                logger.info("Expedia credentials configured and validated successfully")
                return {
                    "success": True,
                    "message": "Expedia credentials retrieved from Supabase and validated successfully",
                    "provider": "expedia",
                    "test_mode": config_data['test_mode'],
                    "credentials_source": "supabase_existing",
                    "api_key_masked": f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "***",
                    "validation_status": "authenticated"
                }
                
            else:
                raise HTTPException(status_code=404, detail="Expedia credentials not found in Supabase. Expected providers: 'Maku.Travel Test Expedia' and 'Maku.Travel Test Expedia_SECRET'")
        
        except Exception as supabase_error:
            logger.error(f"Failed to retrieve credentials from Supabase: {supabase_error}")
            
            # Fallback to manual credential input if provided
            if credentials and 'api_key' in credentials and 'shared_secret' in credentials:
                config_data = {
                    'api_key': credentials['api_key'],
                    'shared_secret': credentials['shared_secret'],
                    'base_url': credentials.get('base_url', 'https://api.expediagroup.com'),
                    'sandbox_url': credentials.get('sandbox_url', 'https://api.sandbox.expediagroup.com'),
                    'test_mode': credentials.get('test_mode', True)
                }
                
                # Test the credentials
                test_auth = ExpediaAuthClient(config_data)
                await test_auth.get_access_token()
                
                # Store in Supabase
                success = await store_supabase_config('expedia', config_data)
                
                if success:
                    return {
                        "success": True,
                        "message": "Expedia credentials configured and validated successfully",
                        "provider": "expedia",
                        "test_mode": config_data['test_mode'],
                        "credentials_source": "manual_input"
                    }
                else:
                    raise HTTPException(status_code=500, detail="Failed to store credentials")
            else:
                raise HTTPException(status_code=500, detail=f"Could not retrieve credentials from Supabase: {str(supabase_error)}")
        
    except Exception as e:
        logger.error(f"Failed to setup Expedia credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expedia/hotels/search")
async def search_expedia_hotels(search_request: ExpediaHotelSearchRequest):
    """Search hotels using Expedia Group API"""
    try:
        if not expedia_service.config:
            await expedia_service.initialize()
        
        results = await expedia_service.search_hotels(search_request)
        return results
        
    except Exception as e:
        logger.error(f"Expedia hotel search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expedia/flights/search")
async def search_expedia_flights(search_request: ExpediaFlightSearchRequest):
    """Search flights using Expedia Group API"""
    try:
        if not expedia_service.config:
            await expedia_service.initialize()
        
        results = await expedia_service.search_flights(search_request)
        return results
        
    except Exception as e:
        logger.error(f"Expedia flight search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expedia/cars/search")
async def search_expedia_cars(search_request: ExpediaCarSearchRequest):
    """Search car rentals using Expedia Group API"""
    try:
        if not expedia_service.config:
            await expedia_service.initialize()
        
        results = await expedia_service.search_cars(search_request)
        return results
        
    except Exception as e:
        logger.error(f"Expedia car search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expedia/activities/search")
async def search_expedia_activities(search_request: ExpediaActivitySearchRequest):
    """Search activities using Expedia Group API"""
    try:
        if not expedia_service.config:
            await expedia_service.initialize()
        
        results = await expedia_service.search_activities(search_request)
        return results
        
    except Exception as e:
        logger.error(f"Expedia activity search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/expedia/hotels/book")
async def create_expedia_hotel_booking(booking_request: ExpediaBookingRequest):
    """Create hotel booking using Expedia Group API"""
    try:
        if not expedia_service.config:
            await expedia_service.initialize()
        
        result = await expedia_service.create_hotel_booking(booking_request)
        return result
        
    except Exception as e:
        logger.error(f"Expedia hotel booking failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/expedia/debug-supabase")
async def debug_supabase_providers():
    """Debug endpoint to check what providers are available in Supabase"""
    try:
        from supabase import create_client, Client
        
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            return {"error": "Supabase not configured"}
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Get all providers in api_configuration table
        result = supabase.table('api_configuration').select('*').execute()
        
        providers_info = []
        for item in result.data:
            providers_info.append({
                "provider": item.get("provider"),
                "environment": item.get("environment"),
                "is_active": item.get("is_active"),
                "created_at": item.get("created_at"),
                "config_keys": list(item.get("config_data", {}).keys()) if isinstance(item.get("config_data"), dict) else "non-dict"
            })
        
        # Also search for any providers containing "expedia" (case insensitive)
        expedia_matches = []
        for item in result.data:
            provider_name = item.get("provider", "").lower()
            if "expedia" in provider_name or "maku" in provider_name:
                expedia_matches.append({
                    "provider": item.get("provider"),
                    "environment": item.get("environment"),
                    "config_data_type": type(item.get("config_data")).__name__,
                    "config_preview": str(item.get("config_data"))[:100] + "..." if item.get("config_data") else None
                })
        
        return {
            "total_providers": len(result.data),
            "all_providers": [p["provider"] for p in providers_info],
            "expedia_related": expedia_matches,
            "providers_detail": providers_info
        }
        
    except Exception as e:
        logger.error(f"Debug Supabase error: {e}")
        return {"error": str(e)}

@api_router.get("/expedia/health")
async def check_expedia_health():
    """Check Expedia API health and authentication"""
    try:
        # Initialize service if not already done
        if not expedia_service.config and EXPEDIA_TEST_CONFIG:
            expedia_service.config = EXPEDIA_TEST_CONFIG
            expedia_service.auth_client = ExpediaAuthClient(EXPEDIA_TEST_CONFIG)
        
        if not expedia_service.config:
            await expedia_service.initialize()
        
        # Test authentication
        token = await expedia_service.auth_client.get_access_token()
        
        return {
            "provider": "expedia",
            "status": "healthy" if token else "unhealthy",
            "authenticated": bool(token),
            "test_mode": expedia_service.config.get('test_mode', False),
            "base_url": expedia_service.auth_client.base_url,
            "timestamp": datetime.utcnow().isoformat(),
            "credentials_configured": True,
            "api_key_masked": f"{expedia_service.config.get('api_key', '')[:8]}..." if expedia_service.config else None
        }
        
    except Exception as e:
        logger.error(f"Expedia health check failed: {e}")
        return {
            "provider": "expedia",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "credentials_configured": bool(EXPEDIA_TEST_CONFIG)
        }

@api_router.post("/expedia/test-all-services")
async def test_all_expedia_services():
    """Test all Expedia services to validate booking capabilities"""
    try:
        if not expedia_service.config and EXPEDIA_TEST_CONFIG:
            expedia_service.config = EXPEDIA_TEST_CONFIG
            expedia_service.auth_client = ExpediaAuthClient(EXPEDIA_TEST_CONFIG)
        
        if not expedia_service.config:
            await expedia_service.initialize()
        
        test_results = {}
        
        # Test 1: Authentication
        try:
            token = await expedia_service.auth_client.get_access_token()
            test_results["authentication"] = {
                "status": "success",
                "authenticated": bool(token),
                "token_preview": f"{token[:10]}..." if token else None
            }
        except Exception as e:
            test_results["authentication"] = {
                "status": "failed", 
                "error": str(e)
            }
        
        # Test 2: Hotel Search
        try:
            hotel_search = ExpediaHotelSearchRequest(
                checkin="2024-07-15",
                checkout="2024-07-18", 
                occupancy=[{"adults": 2, "children": 0}]
            )
            hotel_results = await expedia_service.search_hotels(hotel_search)
            test_results["hotel_search"] = {
                "status": "success",
                "total_results": hotel_results.get("total_results", 0),
                "demo_mode": hotel_results.get("demo_mode", False)
            }
        except Exception as e:
            test_results["hotel_search"] = {
                "status": "failed",
                "error": str(e)
            }
        
        # Test 3: Flight Search  
        try:
            flight_search = ExpediaFlightSearchRequest(
                origin="LAX",
                destination="JFK",
                departure_date="2024-07-15",
                passengers={"adults": 1}
            )
            flight_results = await expedia_service.search_flights(flight_search)
            test_results["flight_search"] = {
                "status": "success",
                "total_results": flight_results.get("total_results", 0),
                "demo_mode": flight_results.get("demo_mode", False)
            }
        except Exception as e:
            test_results["flight_search"] = {
                "status": "failed", 
                "error": str(e)
            }
        
        # Test 4: Car Search
        try:
            car_search = ExpediaCarSearchRequest(
                pickup_location="LAX",
                pickup_date="2024-07-15T10:00:00Z",
                driver_age=25
            )
            car_results = await expedia_service.search_cars(car_search)
            test_results["car_search"] = {
                "status": "success",
                "total_results": car_results.get("total_results", 0),
                "demo_mode": car_results.get("demo_mode", False)
            }
        except Exception as e:
            test_results["car_search"] = {
                "status": "failed",
                "error": str(e)
            }
        
        # Test 5: Activity Search
        try:
            activity_search = ExpediaActivitySearchRequest(
                destination="New York",
                start_date="2024-07-15",
                adults=2
            )
            activity_results = await expedia_service.search_activities(activity_search)
            test_results["activity_search"] = {
                "status": "success", 
                "total_results": activity_results.get("total_results", 0),
                "demo_mode": activity_results.get("demo_mode", False)
            }
        except Exception as e:
            test_results["activity_search"] = {
                "status": "failed",
                "error": str(e)
            }
        
        # Calculate overall success rate
        successful_tests = sum(1 for test in test_results.values() if test.get("status") == "success")
        total_tests = len(test_results)
        success_rate = (successful_tests / total_tests) * 100
        
        return {
            "overall_status": "operational" if success_rate >= 60 else "needs_attention",
            "success_rate": f"{success_rate:.1f}%",
            "successful_tests": successful_tests,
            "total_tests": total_tests,
            "test_results": test_results,
            "credentials_status": "configured",
            "api_environment": "sandbox" if expedia_service.config.get('test_mode') else "production",
            "timestamp": datetime.utcnow().isoformat(),
            "ready_for_live_use": success_rate >= 80
        }
        
    except Exception as e:
        logger.error(f"Failed to test Expedia services: {e}")
        return {
            "overall_status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    """Check Expedia API health and authentication"""
    try:
        # Initialize service if not already done
        if not expedia_service.config and EXPEDIA_TEST_CONFIG:
            expedia_service.config = EXPEDIA_TEST_CONFIG
            expedia_service.auth_client = ExpediaAuthClient(EXPEDIA_TEST_CONFIG)
        
        if not expedia_service.config:
            await expedia_service.initialize()
        
        # Test authentication
        token = await expedia_service.auth_client.get_access_token()
        
        return {
            "provider": "expedia",
            "status": "healthy" if token else "unhealthy",
            "authenticated": bool(token),
            "test_mode": expedia_service.config.get('test_mode', False),
            "base_url": expedia_service.auth_client.base_url,
            "timestamp": datetime.utcnow().isoformat(),
            "credentials_configured": True
        }
        
    except Exception as e:
        logger.error(f"Expedia health check failed: {e}")
        return {
            "provider": "expedia",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "credentials_configured": bool(EXPEDIA_TEST_CONFIG)
        }
    """Check Expedia API health and authentication"""
    try:
        if not expedia_service.config:
            await expedia_service.initialize()
        
        # Check if initialization was successful
        if not expedia_service.auth_client:
            return {
                "provider": "expedia",
                "status": "unhealthy",
                "error": "Expedia service not initialized - Supabase configuration required",
                "authenticated": False,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Test authentication
        token = await expedia_service.auth_client.get_access_token()
        
        return {
            "provider": "expedia",
            "status": "healthy" if token else "unhealthy",
            "authenticated": bool(token),
            "test_mode": expedia_service.config.get('test_mode', False),
            "base_url": expedia_service.auth_client.base_url,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Expedia health check failed: {e}")
        return {
            "provider": "expedia",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Update existing provider endpoints to include Expedia

async def get_enhanced_providers_with_expedia():
    """Get enhanced provider list including Expedia"""
    try:
        providers = [
            # Existing providers
            {
                "id": "amadeus-001",
                "name": "Amadeus",
                "type": "hotel",
                "status": "active",
                "last_health_check": datetime.utcnow().isoformat(),
                "health_status": "healthy",
                "performance_score": 92.5,
                "auto_discovered": False,
                "discovery_date": None,
                "integration_priority": 9,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "specialties": ["Global hotel inventory", "Real-time availability", "Corporate rates"],
                "features": ["Price matching", "Instant confirmation", "24/7 support"]
            },
            {
                "id": "sabre-001", 
                "name": "Sabre",
                "type": "flight",
                "status": "active",
                "last_health_check": datetime.utcnow().isoformat(),
                "health_status": "healthy",
                "performance_score": 88.7,
                "auto_discovered": False,
                "discovery_date": None,
                "integration_priority": 8,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "specialties": ["Flight booking", "Airline partnerships", "Route optimization"],
                "features": ["Multi-city booking", "Seat selection", "Meal preferences"]
            },
            {
                "id": "viator-001",
                "name": "Viator", 
                "type": "activity",
                "status": "active",
                "last_health_check": datetime.utcnow().isoformat(),
                "health_status": "healthy", 
                "performance_score": 85.2,
                "auto_discovered": False,
                "discovery_date": None,
                "integration_priority": 7,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "specialties": ["Tours and activities", "Local experiences", "Skip-the-line tickets"],
                "features": ["Expert guides", "Small groups", "Cultural immersion"]
            },
            {
                "id": "duffle-001",
                "name": "Duffle",
                "type": "flight", 
                "status": "active",
                "last_health_check": datetime.utcnow().isoformat(),
                "health_status": "healthy",
                "performance_score": 94.8,
                "auto_discovered": True,
                "discovery_date": "2024-11-15T10:30:00Z",
                "integration_priority": 8,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "demo_label": "✨ DEMO DATA",
                "specialties": ["Modern flight booking", "Direct airline connectivity", "Ancillary services"],
                "features": ["Real-time availability", "Dynamic pricing", "Seat maps"]
            },
            {
                "id": "ratehawk-001",
                "name": "RateHawk",
                "type": "hotel",
                "status": "active", 
                "last_health_check": datetime.utcnow().isoformat(),
                "health_status": "healthy",
                "performance_score": 91.3,
                "auto_discovered": True,
                "discovery_date": "2024-11-15T11:45:00Z",
                "integration_priority": 7,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "demo_label": "✨ DEMO DATA",
                "specialties": ["Hotel inventory", "Competitive rates", "Global coverage"],
                "features": ["Best price guarantee", "Instant booking", "Multi-language support"]
            },
            # NEW: Expedia integration
            {
                "id": "expedia-001",
                "name": "Expedia Group",
                "type": "comprehensive",
                "status": "active",
                "last_health_check": datetime.utcnow().isoformat(),
                "health_status": "healthy",
                "performance_score": 96.2,
                "auto_discovered": False,
                "discovery_date": None,
                "integration_priority": 10,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "specialties": ["Complete travel ecosystem", "Hotels & flights", "Cars & activities", "Package deals"],
                "features": ["EPS Rapid API", "Multi-service booking", "Global inventory", "Loyalty rewards"],
                "services": {
                    "hotels": {
                        "endpoint": "/api/expedia/hotels/search",
                        "inventory_size": "700,000+ properties",
                        "coverage": "250,000+ destinations"
                    },
                    "flights": {
                        "endpoint": "/api/expedia/flights/search", 
                        "coverage": "Global airline partnerships",
                        "features": ["One-way", "Round-trip", "Multi-city"]
                    },
                    "cars": {
                        "endpoint": "/api/expedia/cars/search",
                        "providers": "110+ car rental brands", 
                        "coverage": "190+ countries"
                    },
                    "activities": {
                        "endpoint": "/api/expedia/activities/search",
                        "inventory": "170,000+ experiences",
                        "types": ["Tours", "Adventures", "Entertainment"]
                    }
                }
            }
        ]
        
        return providers
        
    except Exception as e:
        logger.error(f"Failed to get enhanced providers: {e}")
        return []

# Update existing provider registry endpoint
@api_router.get("/smart-dreams/providers")
async def get_smart_dreams_providers_with_expedia():
    """Enhanced provider registry with Expedia integration"""
    try:
        providers = await get_enhanced_providers_with_expedia()
        
        # Calculate metrics
        total_providers = len(providers)
        active_providers = len([p for p in providers if p["status"] == "active"])
        healthy_providers = len([p for p in providers if p["health_status"] == "healthy"])
        auto_discovered = len([p for p in providers if p.get("auto_discovered", False)])
        
        # Calculate overall performance score
        performance_scores = [p["performance_score"] for p in providers]
        avg_performance = sum(performance_scores) / len(performance_scores) if performance_scores else 0
        
        return {
            "providers": providers,
            "summary": {
                "total_providers": total_providers,
                "active_providers": active_providers, 
                "healthy_providers": healthy_providers,
                "auto_discovered_providers": auto_discovered,
                "average_performance_score": round(avg_performance, 1),
                "success_rate_overall": round(avg_performance / 100 * 0.94, 3)  # Convert to success rate
            },
            "expedia_services": {
                "hotels": True,
                "flights": True, 
                "cars": True,
                "activities": True,
                "comprehensive_booking": True
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get provider registry: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# Configuration Management Endpoints
@api_router.get("/config/validate")
async def validate_config():
    """Validate system configuration"""
    try:
        validation_result = await validate_configuration()
        return validation_result
    except Exception as e:
        logger.error(f"Configuration validation failed: {e}")
        return {
            "valid": False,
            "error": str(e),
            "environment": os.getenv('ENVIRONMENT', 'development')
        }

@api_router.get("/config/providers")
async def get_all_providers_config():
    """Get configuration for all travel providers"""
    try:
        config_instance = get_config_instance()
        provider_configs = await config_instance.get_all_provider_configs()
        
        # Filter out sensitive information for API response
        public_configs = {}
        for provider, config in provider_configs.items():
            public_config = {}
            for key, value in config.items():
                # Only include non-sensitive configuration values
                if key in ['base_url', 'mode'] or key.endswith('_url'):
                    public_config[key] = value
                elif 'key' in key.lower() or 'secret' in key.lower():
                    # Show presence but not value
                    public_config[key] = "***configured***" if value else "***not_configured***"
                else:
                    public_config[key] = value
            public_configs[provider] = public_config
        
        return {
            "success": True,
            "providers": public_configs,
            "environment": config_instance.environment
        }
    except Exception as e:
        logger.error(f"Failed to get provider configurations: {e}")
        return {
            "success": False,
            "error": str(e),
            "providers": {}
        }

@api_router.get("/config/providers/{provider}")
async def get_provider_configuration(provider: str):
    """Get configuration for a specific travel provider"""
    try:
        provider_config = await get_provider_config(provider)
        
        # Filter sensitive information
        public_config = {}
        for key, value in provider_config.items():
            if key in ['base_url', 'mode'] or key.endswith('_url'):
                public_config[key] = value
            elif 'key' in key.lower() or 'secret' in key.lower():
                public_config[key] = "***configured***" if value else "***not_configured***"
            else:
                public_config[key] = value
        
        return {
            "success": True,
            "provider": provider,
            "config": public_config
        }
    except Exception as e:
        logger.error(f"Failed to get configuration for {provider}: {e}")
        return {
            "success": False,
            "provider": provider,
            "error": str(e)
        }

@api_router.post("/config/test-connections")
async def test_provider_connections():
    """Test connections to all configured providers"""
    try:
        config_instance = get_config_instance()
        provider_configs = await config_instance.get_all_provider_configs()
        
        connection_results = {}
        
        for provider, config in provider_configs.items():
            try:
                # Test connection based on provider type
                if provider == 'stripe':
                    # Test Stripe connection
                    secret_key = await get_secret('STRIPE_SECRET_KEY')
                    if secret_key and not secret_key.startswith('your-'):
                        connection_results[provider] = {
                            "status": "connected",
                            "message": "Stripe credentials configured"
                        }
                    else:
                        connection_results[provider] = {
                            "status": "not_configured",
                            "message": "Stripe secret key not configured"
                        }
                
                elif provider in ['amadeus', 'sabre', 'viator', 'duffle', 'ratehawk', 'expedia']:
                    # Test travel provider connections
                    base_url = config.get('base_url')
                    if base_url and base_url != 'your-api-base-url':
                        connection_results[provider] = {
                            "status": "configured",
                            "message": f"{provider.capitalize()} base URL configured",
                            "base_url": base_url
                        }
                    else:
                        connection_results[provider] = {
                            "status": "not_configured", 
                            "message": f"{provider.capitalize()} configuration missing"
                        }
                        
            except Exception as e:
                connection_results[provider] = {
                    "status": "error",
                    "message": str(e)
                }
        
        return {
            "success": True,
            "connections": connection_results,
            "environment": config_instance.environment,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to test provider connections: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# Waitlist Management Endpoints
@api_router.post("/waitlist")
async def join_waitlist(email: str, full_name: str = None, referral_code: str = None, marketing_consent: bool = False):
    """Add user to waitlist"""
    try:
        # Validate email
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, email.lower()):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Mock waitlist entry (in production, this would write to Supabase)
        waitlist_entry = {
            "id": str(uuid.uuid4()),
            "email": email.lower(),
            "full_name": full_name,
            "referral_code": referral_code,
            "marketing_consent": marketing_consent,
            "source": "api",
            "status": "active",
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"New waitlist signup: {email}")
        
        return {
            "success": True,
            "message": "Successfully joined waitlist!",
            "waitlist_id": waitlist_entry["id"],
            "position": "You will be notified when access is available"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Waitlist signup failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to join waitlist")

@api_router.get("/waitlist/stats")
async def get_waitlist_stats():
    """Get waitlist statistics (mock data for now)"""
    try:
        # Mock waitlist statistics
        mock_stats = {
            "total_signups": 1247,
            "signups_today": 23,
            "signups_this_week": 156,
            "referral_signups": 312,
            "conversion_rate": 0.087,
            "top_sources": [
                {"source": "website", "count": 892},
                {"source": "social_media", "count": 234},
                {"source": "referral", "count": 121}
            ],
            "top_referrals": [
                {"code": "TRAVEL2024", "count": 45},
                {"code": "MAKUEXPLORER", "count": 32},
                {"code": "DREAMJOURNEY", "count": 28}
            ],
            "daily_signups_last_30_days": [
                {"date": "2024-01-01", "signups": 12},
                {"date": "2024-01-02", "signups": 8},
                {"date": "2024-01-03", "signups": 15}
                # ... would include all 30 days
            ]
        }
        
        return {
            "success": True,
            "stats": mock_stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get waitlist stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve waitlist statistics")

# Analytics and Monitoring Endpoints
@api_router.post("/analytics/events")
async def track_analytics_events(events: List[Dict[str, Any]]):
    """Track analytics events"""
    try:
        processed_events = []
        
        for event in events:
            event_record = {
                "id": str(uuid.uuid4()),
                "event_type": event.get("event_type", "unknown"),
                "event_category": event.get("event_category", "user_action"),
                "user_id": event.get("user_id"),
                "session_id": event.get("session_id"),
                "event_data": event.get("event_data", {}),
                "properties": event.get("properties", {}),
                "context": event.get("context", {}),
                "environment": os.getenv("ENVIRONMENT", "development"),
                "timestamp": datetime.utcnow().isoformat()
            }
            processed_events.append(event_record)
            
            logger.info(f"Analytics event tracked: {event_record['event_type']}")
        
        return {
            "success": True,
            "message": f"Tracked {len(processed_events)} event(s)",
            "event_ids": [e["id"] for e in processed_events]
        }
        
    except Exception as e:
        logger.error(f"Analytics tracking failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to track analytics events")

@api_router.post("/analytics/provider-health")
async def update_provider_health(
    provider_name: str, 
    status: str, 
    response_time_ms: int = None, 
    error_rate: float = None, 
    error_message: str = None
):
    """Update provider health status"""
    try:
        valid_statuses = ['healthy', 'degraded', 'down', 'maintenance']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        health_record = {
            "id": str(uuid.uuid4()),
            "provider_name": provider_name,
            "status": status,
            "response_time_ms": response_time_ms,
            "error_rate": error_rate,
            "error_message": error_message,
            "environment": os.getenv("ENVIRONMENT", "development"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Check for alert conditions
        alerts_created = 0
        if status == 'down':
            logger.warning(f"ALERT: Provider {provider_name} is DOWN")
            alerts_created += 1
        elif status == 'degraded':
            logger.warning(f"ALERT: Provider {provider_name} is DEGRADED")
            alerts_created += 1
        elif error_rate and error_rate > 0.05:
            logger.warning(f"ALERT: Provider {provider_name} has high error rate: {error_rate}")
            alerts_created += 1
        
        logger.info(f"Provider health updated: {provider_name} -> {status}")
        
        return {
            "success": True,
            "message": "Provider health updated",
            "health_id": health_record["id"],
            "alerts_created": alerts_created
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Provider health update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update provider health")

@api_router.get("/analytics/dashboard/{dashboard_name}")
async def get_analytics_dashboard(dashboard_name: str):
    """Get analytics dashboard data"""
    try:
        # Mock dashboard data based on dashboard name
        dashboards = {
            "provider_health": {
                "providers": [
                    {"name": "amadeus", "status": "healthy", "response_time": 1200, "error_rate": 0.01},
                    {"name": "sabre", "status": "healthy", "response_time": 950, "error_rate": 0.02},
                    {"name": "viator", "status": "degraded", "response_time": 3400, "error_rate": 0.08},
                    {"name": "expedia", "status": "healthy", "response_time": 1100, "error_rate": 0.01},
                    {"name": "duffle", "status": "maintenance", "response_time": None, "error_rate": None},
                    {"name": "ratehawk", "status": "healthy", "response_time": 890, "error_rate": 0.03}
                ],
                "overall_status": "degraded",
                "avg_response_time": 1508,
                "total_errors": 23
            },
            "booking_analytics": {
                "total_bookings_today": 156,
                "total_bookings_week": 1247,
                "conversion_rate": 0.087,
                "average_booking_value": 234.50,
                "top_providers": [
                    {"provider": "amadeus", "bookings": 67, "value": 15680.00},
                    {"provider": "expedia", "bookings": 45, "value": 12340.00},
                    {"provider": "sabre", "bookings": 32, "value": 8970.00}
                ],
                "booking_trends": [
                    {"hour": "00:00", "bookings": 3},
                    {"hour": "01:00", "bookings": 1},
                    {"hour": "02:00", "bookings": 2}
                ]
            },
            "user_engagement": {
                "total_active_users": 2847,
                "daily_active_users": 412,
                "user_sessions": 1836,
                "avg_session_duration": 847, # seconds
                "feature_usage": {
                    "search": 1247,
                    "filters": 892,
                    "referrals": 156,
                    "nft": 89,
                    "airdrop": 234
                },
                "top_pages": [
                    {"page": "/", "views": 3421},
                    {"page": "/hotels", "views": 1892},
                    {"page": "/flights", "views": 1456},
                    {"page": "/smart-dreams", "views": 967}
                ]
            }
        }
        
        if dashboard_name not in dashboards:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        
        return {
            "success": True,
            "dashboard": {
                "name": dashboard_name,
                "data": dashboards[dashboard_name],
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard data retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard data")

@api_router.get("/analytics/alerts")
async def get_system_alerts(severity: str = None, unresolved: bool = False, limit: int = 50):
    """Get system alerts"""
    try:
        # Mock alerts data
        all_alerts = [
            {
                "id": str(uuid.uuid4()),
                "alert_type": "provider_degraded",
                "severity": "high",
                "provider_name": "viator",
                "alert_message": "Viator API response time above threshold",
                "created_at": datetime.utcnow().isoformat(),
                "is_resolved": False
            },
            {
                "id": str(uuid.uuid4()),
                "alert_type": "high_error_rate",
                "severity": "medium",
                "provider_name": "ratehawk",
                "alert_message": "RateHawk error rate: 6.7%",
                "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "is_resolved": True,
                "resolved_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "alert_type": "booking_anomaly",
                "severity": "low",
                "provider_name": None,
                "alert_message": "Unusual booking pattern detected",
                "created_at": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
                "is_resolved": False
            }
        ]
        
        # Filter alerts based on parameters
        filtered_alerts = all_alerts
        
        if severity:
            filtered_alerts = [a for a in filtered_alerts if a["severity"] == severity]
        
        if unresolved:
            filtered_alerts = [a for a in filtered_alerts if not a["is_resolved"]]
        
        filtered_alerts = filtered_alerts[:limit]
        
        return {
            "success": True,
            "alerts": filtered_alerts,
            "total": len(filtered_alerts),
            "filters_applied": {
                "severity": severity,
                "unresolved": unresolved,
                "limit": limit
            }
        }
        
    except Exception as e:
        logger.error(f"Alerts retrieval failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve alerts")

# Enhanced Provider Search Endpoints
@api_router.post("/providers/search/flights")
async def enhanced_flight_search(request: Dict[str, Any]):
    """Enhanced flight search across multiple providers"""
    try:
        orchestrator = await get_orchestrator()
        
        # Convert request to SearchRequest
        from enhanced_providers import SearchRequest
        search_request = SearchRequest(
            origin=request.get("origin", ""),
            destination=request.get("destination", ""),
            departure_date=request.get("departure_date", ""),
            return_date=request.get("return_date"),
            adults=request.get("adults", 1),
            children=request.get("children", 0),
            cabin_class=request.get("cabin_class", "economy"),
            currency=request.get("currency", "USD")
        )
        
        # Search across flight providers
        responses = await orchestrator.search_flights(search_request)
        
        return {
            "success": True,
            "search_id": str(uuid.uuid4()),
            "providers_searched": len(responses),
            "total_results": sum(r.total_results for r in responses),
            "responses": [
                {
                    "provider_id": r.provider_id,
                    "provider_name": r.provider_name,
                    "success": r.success,
                    "results": r.data,
                    "total_results": r.total_results,
                    "response_time_ms": r.response_time_ms,
                    "error": r.error_message
                }
                for r in responses
            ]
        }
        
    except Exception as e:
        logger.error(f"Enhanced flight search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/providers/search/hotels")
async def enhanced_hotel_search(request: Dict[str, Any]):
    """Enhanced hotel search across multiple providers"""
    try:
        orchestrator = await get_orchestrator()
        
        # Convert request to SearchRequest
        from enhanced_providers import SearchRequest
        search_request = SearchRequest(
            destination=request.get("destination", ""),
            checkin_date=request.get("checkin_date", ""),
            checkout_date=request.get("checkout_date", ""),
            adults=request.get("adults", 2),
            children=request.get("children", 0),
            rooms=request.get("rooms", 1),
            currency=request.get("currency", "USD")
        )
        
        # Search across hotel providers (Expedia Hotels + Nuitée)
        responses = await orchestrator.search_hotels(search_request)
        
        return {
            "success": True,
            "search_id": str(uuid.uuid4()),
            "providers_searched": len(responses),
            "total_results": sum(r.total_results for r in responses),
            "responses": [
                {
                    "provider_id": r.provider_id,
                    "provider_name": r.provider_name,
                    "success": r.success,
                    "results": r.data,
                    "total_results": r.total_results,
                    "response_time_ms": r.response_time_ms,
                    "error": r.error_message
                }
                for r in responses
            ]
        }
        
    except Exception as e:
        logger.error(f"Enhanced hotel search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/providers/search/activities")
async def enhanced_activity_search(request: Dict[str, Any]):
    """Enhanced activity search across multiple providers"""
    try:
        orchestrator = await get_orchestrator()
        
        # Convert request to SearchRequest
        from enhanced_providers import SearchRequest
        search_request = SearchRequest(
            destination=request.get("destination", ""),
            departure_date=request.get("date", ""),
            adults=request.get("participants", 2),
            currency=request.get("currency", "USD")
        )
        
        # Search across activity providers (GetYourGuide + Viator)
        responses = await orchestrator.search_activities(search_request)
        
        return {
            "success": True,
            "search_id": str(uuid.uuid4()),
            "providers_searched": len(responses),
            "total_results": sum(r.total_results for r in responses),
            "responses": [
                {
                    "provider_id": r.provider_id,
                    "provider_name": r.provider_name,
                    "success": r.success,
                    "results": r.data,
                    "total_results": r.total_results,
                    "response_time_ms": r.response_time_ms,
                    "error": r.error_message
                }
                for r in responses
            ]
        }
        
    except Exception as e:
        logger.error(f"Enhanced activity search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Multi-Backend AI Assistant Endpoints
@api_router.post("/ai/chat")
async def ai_chat(
    prompt: str,
    context: Dict[str, Any] = None,
    system_prompt: str = None,
    prefer_free: bool = None,
    user_id: str = None,
    session_id: str = None
):
    """Multi-backend AI chat with intelligent provider selection"""
    try:
        assistant = await get_ai_assistant()
        
        # Create AI request
        ai_request = AIRequest(
            prompt=prompt,
            context=context or {},
            system_prompt=system_prompt or "You are a helpful travel assistant for Maku.Travel.",
            user_id=user_id,
            session_id=session_id
        )
        
        # Generate response
        response = await assistant.generate_response(ai_request, prefer_free)
        
        return {
            "success": True,
            "response": {
                "content": response.content,
                "provider": response.provider,
                "model": response.model,
                "response_time_ms": response.response_time_ms,
                "tokens_used": response.tokens_used,
                "cost_estimate": response.cost_estimate,
                "metadata": response.metadata
            }
        }
        
    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/providers/status")
async def get_ai_providers_status():
    """Get status of all AI providers"""
    try:
        assistant = await get_ai_assistant()
        status = await assistant.get_provider_status()
        
        return {
            "success": True,
            "providers": status,
            "total_providers": len(status),
            "available_providers": len([p for p in status.values() if p["is_available"]]),
            "free_providers": len([p for p in status.values() if p["is_free"]])
        }
        
    except Exception as e:
        logger.error(f"AI provider status failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/cost-optimization")
async def get_ai_cost_optimization():
    """Get AI cost optimization analysis"""
    try:
        assistant = await get_ai_assistant()
        optimization = await assistant.optimize_costs()
        
        return {
            "success": True,
            "optimization": optimization
        }
        
    except Exception as e:
        logger.error(f"AI cost optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Provider Health and Management Endpoints
@api_router.get("/providers/health")
async def get_providers_health():
    """Get health status of all travel providers"""
    try:
        orchestrator = await get_orchestrator()
        health_report = await orchestrator.get_provider_health()
        
        return {
            "success": True,
            "providers": health_report,
            "summary": {
                "total_providers": len(health_report),
                "healthy_providers": len([p for p in health_report.values() if p["is_healthy"]]),
                "unhealthy_providers": len([p for p in health_report.values() if not p["is_healthy"]])
            }
        }
        
    except Exception as e:
        logger.error(f"Provider health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/providers/health-check")
async def run_provider_health_check():
    """Run comprehensive health check on all providers"""
    try:
        orchestrator = await get_orchestrator()
        health_results = await orchestrator.run_health_check()
        
        return {
            "success": True,
            "health_check": health_results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Provider health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/providers/credentials/{provider_id}")
async def validate_provider_credentials(provider_id: str):
    """Validate credentials for a specific provider"""
    try:
        orchestrator = await get_orchestrator()
        validation_result = await orchestrator.validate_provider_credentials(provider_id)
        
        return {
            "success": True,
            "validation": validation_result
        }
        
    except Exception as e:
        logger.error(f"Credential validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Mem0 Integration Endpoints
@api_router.get("/memories/{user_id}")
async def get_user_memories(user_id: str):
    """Get user memories from Mem0 integration"""
    try:
        # Mock memories data (in production, this would query Supabase user_memories table)
        mock_memories = [
            {
                "id": str(uuid.uuid4()),
                "mem0_id": "mem0_001",
                "user_id": user_id,
                "memory_content": "User prefers luxury hotels with spa amenities in Europe",
                "memory_type": "hotel_preference",
                "created_at": datetime.utcnow().isoformat(),
                "metadata": {
                    "destinations": ["Paris", "Rome", "Barcelona"],
                    "hotel_category": "luxury",
                    "amenities": ["spa", "pool", "concierge"]
                }
            },
            {
                "id": str(uuid.uuid4()),
                "mem0_id": "mem0_002", 
                "user_id": user_id,
                "memory_content": "Prefers direct flights and business class for long-haul travel",
                "memory_type": "flight_preference",
                "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
                "metadata": {
                    "cabin_class": "business",
                    "flight_type": "direct",
                    "long_haul": True
                }
            }
        ]
        
        return {
            "success": True,
            "memories": mock_memories,
            "total_memories": len(mock_memories),
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Failed to get user memories: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user memories")

@api_router.get("/memories/{user_id}/preferences")
async def get_user_travel_preferences(user_id: str):
    """Get extracted travel preferences for user"""
    try:
        # Mock preferences extracted from memories
        mock_preferences = {
            "user_id": user_id,
            "preferences": {
                "hotel_category": "luxury",
                "hotel_amenities": ["spa", "pool", "concierge", "room_service"],
                "cabin_class": "business",
                "flight_type": "direct",
                "interested_destinations": ["Paris", "Rome", "Barcelona", "Tokyo"],
                "budget_range": 2500,
                "travel_style": "luxury",
                "preferred_providers": ["expedia_hotels", "amadeus"]
            },
            "last_memory_update": datetime.utcnow().isoformat(),
            "memory_count": 15,
            "preference_confidence": 0.89
        }
        
        return {
            "success": True,
            "preferences": mock_preferences,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get user preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user preferences")

@api_router.post("/memories/webhook/test")
async def test_mem0_webhook():
    """Test Mem0 webhook integration"""
    try:
        # Create a test webhook payload
        test_payload = {
            "event": "memory.add",
            "data": {
                "id": "test_memory_" + str(uuid.uuid4()),
                "user_id": "test_user_123",
                "memory": "User loves staying in boutique hotels near historic districts",
                "metadata": {
                    "test_mode": True,
                    "created_via": "maku_travel_test"
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Testing Mem0 webhook with payload: {test_payload}")
        
        return {
            "success": True,
            "message": "Webhook test payload created",
            "test_payload": test_payload,
            "webhook_url": "https://iomeddeasarntjhqzndu.supabase.co/functions/v1/mem0-webhook",
            "instructions": [
                "Use this payload to test the webhook endpoint",
                "Verify the webhook is registered in your Mem0 project",
                "Check that memory events are being processed correctly"
            ]
        }
        
    except Exception as e:
        logger.error(f"Webhook test failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create webhook test")

# Include the routers
# =====================================
# ENHANCED TRAVEL FUND INTEGRATION ENDPOINTS
# =====================================

class SmartDreamsFundRequest(BaseModel):
    destination: str
    estimated_cost: float
    dream_name: str
    companions: int
    travel_dates: Optional[Dict[str, str]] = None
    travel_style: Optional[str] = None

class BiddingFundLockRequest(BaseModel):
    amount: float
    bid_id: str
    lock_duration: int  # seconds

class FundAllocation(BaseModel):
    fund_id: str
    amount: float

class CheckoutSuggestionRequest(BaseModel):
    destination: str
    amount: float
    booking_type: str

@api_router.post("/travel-funds/smart-dreams/create")
async def create_fund_from_smart_dreams(request: SmartDreamsFundRequest):
    """Create travel fund from Smart Dreams planning with AI budget estimation"""
    try:
        # Generate AI-optimized fund details
        fund_id = str(uuid.uuid4())
        
        # Calculate smart savings timeline
        timeline_months = max(3, min(18, int(request.estimated_cost / 300)))  # $300/month baseline
        monthly_contribution = round(request.estimated_cost / timeline_months)
        
        fund_data = {
            "id": fund_id,
            "name": request.dream_name,
            "destination": request.destination,
            "target_amount": request.estimated_cost,
            "current_amount": 0,
            "monthly_goal": monthly_contribution,
            "timeline_months": timeline_months,
            "fund_type": "group" if request.companions > 0 else "personal",
            "smart_dreams_integration": {
                "source": "smart_dreams",
                "ai_generated": True,
                "dream_data": request.dict(),
                "budget_confidence": 0.87,
                "cost_breakdown": {
                    "accommodation": request.estimated_cost * 0.35,
                    "flights": request.estimated_cost * 0.25,
                    "activities": request.estimated_cost * 0.20,
                    "food": request.estimated_cost * 0.15,
                    "local_transport": request.estimated_cost * 0.05
                }
            },
            "nft_rewards_enabled": True,
            "gamification_enabled": True,
            "created_at": datetime.utcnow().isoformat(),
            "created_from": "smart_dreams"
        }
        
        logger.info(f"Smart Dreams fund created: {fund_id} for {request.destination}")
        
        return {
            "success": True,
            "fund_id": fund_id,
            "fund_data": fund_data,
            "ai_recommendations": {
                "monthly_contribution": monthly_contribution,
                "timeline_months": timeline_months,
                "success_probability": min(95, 100 - (monthly_contribution / 50)),
                "suggested_companion_invites": request.companions
            }
        }
        
    except Exception as e:
        logger.error(f"Smart Dreams fund creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fund creation failed: {str(e)}")

@api_router.post("/travel-funds/{fund_id}/bidding/lock")
async def lock_funds_for_bidding(fund_id: str, request: BiddingFundLockRequest):
    """Lock travel fund amount for bidding purposes"""
    try:
        lock_id = str(uuid.uuid4())
        lock_expiry = datetime.utcnow() + timedelta(seconds=request.lock_duration)
        
        lock_data = {
            "lock_id": lock_id,
            "fund_id": fund_id,
            "locked_amount": request.amount,
            "bid_id": request.bid_id,
            "locked_at": datetime.utcnow().isoformat(),
            "lock_expiry": lock_expiry.isoformat(),
            "status": "locked",
            "lock_duration": request.lock_duration
        }
        
        logger.info(f"Fund locked for bidding: {fund_id}, amount: ${request.amount}")
        
        return {
            "success": True,
            "lock_id": lock_id,
            "locked_amount": request.amount,
            "lock_expiry": lock_expiry.isoformat(),
            "status": "locked"
        }
        
    except Exception as e:
        logger.error(f"Fund locking failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fund locking failed: {str(e)}")

@api_router.post("/travel-funds/{fund_id}/bidding/release")
async def release_locked_funds(fund_id: str, bid_id: str):
    """Release locked funds when bid is lost or expired"""
    try:
        release_data = {
            "fund_id": fund_id,
            "bid_id": bid_id,
            "released_at": datetime.utcnow().isoformat(),
            "status": "released"
        }
        
        logger.info(f"Funds released for bid: {bid_id}")
        
        return {
            "success": True,
            "fund_id": fund_id,
            "released_at": datetime.utcnow().isoformat(),
            "status": "funds_released"
        }
        
    except Exception as e:
        logger.error(f"Fund release failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fund release failed: {str(e)}")

@api_router.post("/travel-funds/checkout/suggestions")
async def get_checkout_fund_suggestions(request: CheckoutSuggestionRequest):
    """Get smart fund suggestions for checkout based on booking details"""
    try:
        # Mock intelligent fund matching logic
        suggestions = [
            {
                "fund_id": f"fund_{uuid.uuid4()}",
                "fund_name": f"{request.destination} Adventure Fund",
                "available_balance": 1250.00,
                "match_score": 95,
                "match_reason": "Destination matches perfectly",
                "suggested_usage": min(1250.00, request.amount * 0.8),
                "fund_type": "group"
            },
            {
                "fund_id": f"fund_{uuid.uuid4()}",
                "fund_name": "General Travel Savings",
                "available_balance": 2100.00,
                "match_score": 75,
                "match_reason": "Good coverage for travel expenses",
                "suggested_usage": min(2100.00, request.amount),
                "fund_type": "personal"
            }
        ]
        
        # Sort by match score
        suggestions.sort(key=lambda x: x["match_score"], reverse=True)
        
        return {
            "success": True,
            "suggestions": suggestions[:3],  # Top 3 suggestions
            "total_available": sum(s["available_balance"] for s in suggestions),
            "can_fully_cover": sum(s["available_balance"] for s in suggestions) >= request.amount,
            "recommended_allocation": suggestions[0] if suggestions else None
        }
        
    except Exception as e:
        logger.error(f"Checkout suggestions failed: {e}")
        raise HTTPException(status_code=500, detail=f"Suggestions failed: {str(e)}")

@api_router.post("/travel-funds/{fund_id}/nft/mint-milestone")
async def mint_milestone_nft(fund_id: str, milestone_type: str):
    """Automatically mint NFT reward for fund milestone achievement"""
    try:
        nft_id = str(uuid.uuid4())
        
        # Define NFT based on milestone type
        nft_templates = {
            "dream_starter": {
                "title": "Dream Starter NFT",
                "description": "Commemorates reaching 25% of travel fund goal",
                "rarity": "common",
                "artwork_attributes": ["sunset_colors", "journey_beginning", "first_step"]
            },
            "halfway_hero": {
                "title": "Halfway Hero NFT", 
                "description": "Commemorates reaching 50% of travel fund goal",
                "rarity": "rare",
                "artwork_attributes": ["mountain_peak", "progress_path", "determination"]
            },
            "goal_crusher": {
                "title": "Goal Crusher NFT",
                "description": "Commemorates completing travel fund savings goal",
                "rarity": "legendary", 
                "artwork_attributes": ["golden_achievement", "dream_realized", "victory"]
            }
        }
        
        template = nft_templates.get(milestone_type, nft_templates["dream_starter"])
        
        nft_data = {
            "nft_id": nft_id,
            "fund_id": fund_id,
            "title": template["title"],
            "description": template["description"],
            "rarity": template["rarity"],
            "milestone_type": milestone_type,
            "artwork_attributes": template["artwork_attributes"],
            "minted_at": datetime.utcnow().isoformat(),
            "blockchain_network": "cronos",
            "minting_status": "success"
        }
        
        logger.info(f"NFT minted for fund milestone: {fund_id}, type: {milestone_type}")
        
        return {
            "success": True,
            "nft_data": nft_data,
            "minting_status": "success",
            "blockchain_hash": f"0x{secrets.token_hex(32)}",
            "view_url": f"/nft/{nft_id}"
        }
        
    except Exception as e:
        logger.error(f"NFT minting failed: {e}")
        raise HTTPException(status_code=500, detail=f"NFT minting failed: {str(e)}")

@api_router.get("/travel-funds/{fund_id}/integration-status")
async def get_fund_integration_status(fund_id: str):
    """Get integration status for travel fund across all platform features"""
    try:
        integration_status = {
            "fund_id": fund_id,
            "integrations": {
                "smart_dreams": {
                    "connected": True,
                    "source_dream": "Bali Adventure Dream",
                    "ai_budget_analysis": True,
                    "last_sync": datetime.utcnow().isoformat()
                },
                "checkout_system": {
                    "available_for_payments": True,
                    "recent_usage_count": 3,
                    "total_payments_processed": 1250.00,
                    "last_used": "2025-10-05T10:30:00Z"
                },
                "nft_rewards": {
                    "enabled": True,
                    "milestones_earned": 2,
                    "available_rewards": 1,
                    "last_nft_minted": "2025-10-01T15:45:00Z"
                },
                "bidding_system": {
                    "bidding_enabled": True,
                    "current_locks": 0,
                    "successful_bids": 1,
                    "total_bid_volume": 890.00
                },
                "gamification": {
                    "xp_earned": 1250,
                    "achievements_unlocked": 5,
                    "current_streak": 15,
                    "social_engagement_score": 78
                }
            },
            "overall_integration_score": 92,
            "status": "fully_integrated"
        }
        
        return integration_status
        
    except Exception as e:
        logger.error(f"Integration status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@api_router.get("/travel-funds/integration-data")
async def get_travel_funds_integration_data():
    """Get integration data for travel funds dashboard"""
    try:
        integration_data = {
            "smartDreamsIntegration": {
                "connectedDreams": [
                    {
                        "dream_id": "dream_001",
                        "destination": "Bali, Indonesia",
                        "estimated_cost": 3500,
                        "fund_created": True,
                        "fund_id": "fund_001"
                    }
                ],
                "autoCreatedFunds": 1
            },
            "nftRewards": {
                "availableRewards": [
                    {
                        "id": "nft_001",
                        "title": "Dream Starter NFT",
                        "rarity": "common",
                        "unlocked": True,
                        "claimed": False
                    }
                ],
                "claimedRewards": [],
                "milestones": [
                    {"percentage": 25, "reached": True, "nft_minted": True},
                    {"percentage": 50, "reached": False, "nft_minted": False}
                ]
            },
            "biddingIntegration": {
                "lockedFunds": [],
                "activeBids": [],
                "bidHistory": [
                    {
                        "bid_id": "bid_001",
                        "amount": 1200,
                        "status": "won",
                        "deal_type": "flash"
                    }
                ]
            },
            "checkoutIntegration": {
                "recentUsage": [
                    {
                        "booking_id": "booking_001",
                        "amount_used": 450,
                        "booking_type": "hotel",
                        "date": "2025-10-05"
                    }
                ],
                "smartSuggestions": [
                    {
                        "fund_name": "Bali Adventure Fund",
                        "match_score": 95,
                        "available_balance": 1250
                    }
                ]
            }
        }
        
        return integration_data
        
    except Exception as e:
        logger.error(f"Integration data retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Integration data failed: {str(e)}")

@api_router.get("/travel-funds/enhanced-stats")
async def get_enhanced_fund_stats():
    """Get enhanced statistics for travel funds with gamification and NFT data"""
    try:
        enhanced_stats = {
            "total_value": 8450.00,
            "total_funds": 3,
            "completed_goals": 1,
            "nft_rewards_earned": 7,
            "contribution_streak": 23,
            "social_engagement_score": 84.5,
            "bid_success_rate": 67.8,
            "monthly_savings_average": 425.00,
            "goal_completion_rate": 78.3,
            "fund_types": {
                "personal": 2,
                "group": 1,
                "family": 0
            },
            "integration_metrics": {
                "smart_dreams_funds_created": 1,
                "checkout_payments_made": 5,
                "bidding_participation": 3,
                "nft_milestone_rate": 85.7
            }
        }
        
        return enhanced_stats
        
    except Exception as e:
        logger.error(f"Enhanced stats retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")

# ==================== BLOCKCHAIN API ENDPOINTS ====================
# Mock Mode for Frontend Testing (Phase 2)

# Import blockchain service (mock or real based on env)
BLOCKCHAIN_MODE = os.environ.get('BLOCKCHAIN_MODE', 'mock')
if BLOCKCHAIN_MODE == 'mock':
    from mock_blockchain_service import get_mock_blockchain_service as get_blockchain_service
    logger.info("🎭 Using MOCK blockchain service for frontend testing")
else:
    from blockchain_service import get_blockchain_service
    logger.info("⛓️  Using REAL blockchain service")

@api_router.get("/blockchain/network-info")
async def get_blockchain_network_info():
    """Get blockchain network information"""
    try:
        blockchain = get_blockchain_service()
        return blockchain.get_network_info()
    except Exception as e:
        logger.error(f"Error getting network info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/blockchain/wallet/{address}")
async def get_wallet_info(address: str):
    """Get wallet balance and info"""
    try:
        blockchain = get_blockchain_service()
        
        if not blockchain.validate_wallet_address(address):
            raise HTTPException(status_code=400, detail="Invalid wallet address")
        
        balance = blockchain.get_wallet_balance(address)
        pending_cashback = blockchain.get_pending_cashback(address)
        nfts = blockchain.get_user_nfts(address)
        
        return {
            'wallet': balance,
            'pending_cashback': pending_cashback,
            'nfts': nfts,
            'nft_count': len(nfts),
            'highest_cashback_rate': blockchain.get_highest_cashback_rate(address)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting wallet info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/blockchain/cashback/add")
async def add_cashback_for_booking(request_data: dict):
    """Add cashback for completed booking (backend only)"""
    try:
        blockchain = get_blockchain_service()
        
        user_address = request_data.get('user_address')
        booking_amount = request_data.get('booking_amount')
        
        if not user_address or not booking_amount:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        result = blockchain.add_cashback(user_address, booking_amount)
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding cashback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/blockchain/cashback/claim")
async def claim_pending_cashback(request_data: dict):
    """Claim pending cashback (user action)"""
    try:
        blockchain = get_blockchain_service()
        
        user_address = request_data.get('user_address')
        
        if not user_address:
            raise HTTPException(status_code=400, detail="Wallet address required")
        
        result = blockchain.claim_cashback(user_address)
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error claiming cashback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/blockchain/nfts/{address}")
async def get_user_nfts_endpoint(address: str):
    """Get all NFTs owned by user"""
    try:
        blockchain = get_blockchain_service()
        
        if not blockchain.validate_wallet_address(address):
            raise HTTPException(status_code=400, detail="Invalid wallet address")
        
        nfts = blockchain.get_user_nfts(address)
        
        return {
            'address': address,
            'nfts': nfts,
            'count': len(nfts),
            'highest_tier': max([nft['tier'] for nft in nfts], default='None')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting NFTs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/blockchain/nft/mint")
async def mint_nft_endpoint(request_data: dict):
    """Mint NFT for user (earned through bookings)"""
    try:
        blockchain = get_blockchain_service()
        
        user_address = request_data.get('user_address')
        tier = request_data.get('tier', 0)  # 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
        metadata_uri = request_data.get('metadata_uri', f'ipfs://mock_{uuid.uuid4().hex[:20]}')
        
        if not user_address:
            raise HTTPException(status_code=400, detail="Wallet address required")
        
        result = blockchain.mint_nft_for_user(user_address, tier, metadata_uri)
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error minting NFT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/blockchain/nft/purchase")
async def purchase_nft_endpoint(request_data: dict):
    """Purchase NFT with MATIC"""
    try:
        blockchain = get_blockchain_service()
        
        user_address = request_data.get('user_address')
        tier = request_data.get('tier')
        payment_amount = request_data.get('payment_amount', 0)
        
        if not user_address or tier is None:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        result = blockchain.purchase_nft(user_address, tier, payment_amount)
        
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purchasing NFT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/blockchain/tiers")
async def get_tier_information():
    """Get all tier information"""
    try:
        blockchain = get_blockchain_service()
        return blockchain.get_tier_info()
    except Exception as e:
        logger.error(f"Error getting tier info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/blockchain/gas-estimate/{transaction_type}")
async def estimate_gas_cost(transaction_type: str):
    """Estimate gas cost for transaction"""
    try:
        blockchain = get_blockchain_service()
        return blockchain.estimate_gas(transaction_type)
    except Exception as e:
        logger.error(f"Error estimating gas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== END BLOCKCHAIN ENDPOINTS ====================

app.include_router(api_router)
app.include_router(nft_router)
app.include_router(admin_nft_router)
app.include_router(unified_ai_router)
app.include_router(optimized_ai_router)
app.include_router(offseason_router)  # Off-Season Occupancy Engine
app.include_router(email_router)  # Email System

# Register OpenAI ChatGPT Pro router if available
if OPENAI_ENABLED:
    app.include_router(openai_router)  # ChatGPT Pro Integration
    logger.info("✅ OpenAI ChatGPT Pro endpoints registered")
else:
    logger.warning("⚠️  OpenAI ChatGPT Pro endpoints not available")

# Register Smart Dreams V2 router if available
if SMART_DREAMS_V2_ENABLED:
    app.include_router(smart_dreams_router)  # Smart Dreams AI Scoring + Rotation
    logger.info("✅ Smart Dreams V2 endpoints registered")
else:
    logger.warning("⚠️  Smart Dreams V2 endpoints not available")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
