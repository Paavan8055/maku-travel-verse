from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime, timedelta
import json
import subprocess
from typing import Optional, List, Dict, Any


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

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
