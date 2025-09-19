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
from datetime import datetime
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
