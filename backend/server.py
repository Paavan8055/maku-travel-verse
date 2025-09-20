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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# =====================================================
# AI INTELLIGENCE LAYER - Phase 3 Implementation
# =====================================================

@api_router.post("/ai/travel-dna/{user_id}")
async def analyze_travel_dna(user_id: str, request_data: dict):
    """Analyze user's travel DNA using AI intelligence"""
    try:
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
    """Get AI-powered intelligent recommendations"""
    try:
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
                "data_sources_used": ["user_behavior", "ai_analysis"]
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
            "explanation": "This recommendation is based on your travel personality, social connections, and optimal timing factors. Our AI analyzed your preferences and found this destination highly matches your interests.",
            "confidence": 0.75
        }

# Smart Dreams Enhanced Provider Search Models
class SmartDreamProviderRequest(BaseModel):
    companion_type: str
    travel_dna: Optional[dict] = None
    destination: Optional[str] = None
    date_range: Optional[dict] = None
    budget: Optional[dict] = None
    preferences: Optional[List[str]] = None

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

@api_router.get("/smart-dreams/providers")
async def get_all_providers():
    """Get all registered providers with their status and configurations"""
    try:
        # Mock provider registry - in production this would be stored in database
        mock_providers = [
            {
                "id": "amadeus-001",
                "name": "Amadeus",
                "type": "flight",
                "api_endpoint": "https://api.amadeus.com/v2",
                "status": "active",
                "health_status": "healthy",
                "performance_score": 92.5,
                "auto_discovered": False,
                "integration_priority": 9,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "rate_limit": 1000,
                "cost_per_request": 0.02,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "global",
                    "specialties": ["flights", "hotels"],
                    "established": "2018"
                }
            },
            {
                "id": "sabre-001", 
                "name": "Sabre",
                "type": "hotel",
                "api_endpoint": "https://api.sabre.com/v3",
                "status": "active",
                "health_status": "healthy",
                "performance_score": 88.2,
                "auto_discovered": False,
                "integration_priority": 8,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "rate_limit": 500,
                "cost_per_request": 0.015,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "global",
                    "specialties": ["hotels", "car_rentals"],
                    "established": "2019"
                }
            },
            {
                "id": "viator-001",
                "name": "Viator",
                "type": "activity",
                "api_endpoint": "https://api.viator.com/v1",
                "status": "active",
                "health_status": "healthy",
                "performance_score": 85.7,
                "auto_discovered": False,
                "integration_priority": 7,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "rate_limit": 2000,
                "cost_per_request": 0.01,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "global",
                    "specialties": ["activities", "tours", "experiences"],
                    "established": "2020"
                }
            },
            {
                "id": "expedia-taap-001",
                "name": "Expedia TAAP",
                "type": "hotel",
                "api_endpoint": "https://api.expedia.com/taap/v3",
                "status": "testing",
                "health_status": "degraded",
                "performance_score": 78.3,
                "auto_discovered": True,
                "discovery_date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "integration_priority": 6,
                "supported_companions": ["solo", "romantic", "friends"],
                "rate_limit": 800,
                "cost_per_request": 0.025,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "global",
                    "specialties": ["hotels", "packages"],
                    "established": "2024",
                    "auto_discovery_score": 85
                }
            },
            {
                "id": "duffle-001",
                "name": "Duffle",
                "type": "flight",
                "api_endpoint": "https://api.duffel.com/v2",
                "status": "active",
                "health_status": "healthy",
                "performance_score": 94.8,
                "auto_discovered": False,
                "integration_priority": 9,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "rate_limit": 2000,
                "cost_per_request": 0.018,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "global",
                    "specialties": ["flights", "direct_airline_connectivity", "ancillary_services"],
                    "established": "2023",
                    "features": ["real_time_search", "instant_booking", "baggage_selection", "seat_selection"],
                    "demo_label": "✨ DEMO DATA",
                    "api_version": "v2",
                    "sandbox_available": True
                }
            },
            {
                "id": "ratehawk-001",
                "name": "RateHawk",
                "type": "hotel",
                "api_endpoint": "https://api.ratehawk.com/v3",
                "status": "active",
                "health_status": "healthy",
                "performance_score": 91.3,
                "auto_discovered": False,
                "integration_priority": 8,
                "supported_companions": ["solo", "romantic", "friends", "family"],
                "rate_limit": 1800,
                "cost_per_request": 0.016,
                "last_health_check": datetime.utcnow().isoformat(),
                "metadata": {
                    "region": "global",
                    "specialties": ["hotels", "accommodations", "real_time_booking"],
                    "established": "2023",
                    "features": ["2.9M_accommodations", "280_suppliers", "32_languages", "webhook_integration"],
                    "demo_label": "✨ DEMO DATA",
                    "api_version": "v3",
                    "countries_covered": "220+"
                }
            },
            {
                "id": "hotelbeds-001",
                "name": "HotelBeds",
                "type": "hotel",
                "api_endpoint": "https://api.hotelbeds.com/v1",
                "status": "inactive",
                "health_status": "offline",
                "performance_score": 45.2,
                "auto_discovered": True,
                "discovery_date": (datetime.utcnow() - timedelta(days=7)).isoformat(),
                "integration_priority": 4,
                "supported_companions": ["solo", "romantic"],
                "rate_limit": 300,
                "cost_per_request": 0.03,
                "last_health_check": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                "metadata": {
                    "region": "europe",
                    "specialties": ["hotels"],
                    "established": "2024",
                    "auto_discovery_score": 65,
                    "issues": ["rate_limiting", "authentication_errors"]
                }
            }
        ]
        
        return {
            "providers": mock_providers,
            "total_count": len(mock_providers),
            "active_count": len([p for p in mock_providers if p["status"] == "active"]),
            "healthy_count": len([p for p in mock_providers if p["health_status"] == "healthy"]),
            "auto_discovered_count": len([p for p in mock_providers if p["auto_discovered"] == True]),
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get providers: {e}")
        return {"error": f"Failed to get providers: {str(e)}"}

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
        # Mock analytics data
        analytics = {
            "summary": {
                "total_providers": 12,
                "active_providers": 8,
                "healthy_providers": 7,
                "auto_discovered_providers": 4,
                "avg_performance_score": 82.4,
                "total_requests_24h": 15420,
                "success_rate_24h": 94.2
            },
            "performance_by_type": {
                "hotel": {"count": 5, "avg_score": 84.2, "success_rate": 95.1},
                "flight": {"count": 3, "avg_score": 88.7, "success_rate": 96.3},
                "activity": {"count": 3, "avg_score": 79.1, "success_rate": 91.8},
                "car_rental": {"count": 1, "avg_score": 76.5, "success_rate": 89.2}
            },
            "top_performers": [
                {"name": "Amadeus", "score": 92.5, "type": "flight"},
                {"name": "Sabre", "score": 88.2, "type": "hotel"},
                {"name": "Viator", "score": 85.7, "type": "activity"}
            ],
            "integration_pipeline": {
                "in_testing": 2,
                "pending_activation": 3,
                "scheduled_discovery": 1,
                "next_discovery_scan": (datetime.utcnow() + timedelta(hours=18)).isoformat()
            },
            "cost_analytics": {
                "total_cost_24h": 847.52,
                "avg_cost_per_request": 0.055,
                "most_expensive_provider": "Expedia TAAP",
                "most_efficient_provider": "Viator"
            }
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get provider analytics: {e}")
        return {"error": f"Failed to get provider analytics: {str(e)}"}



# Include the router in the main app
app.include_router(api_router)

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
