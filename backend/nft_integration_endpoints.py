# NFT and Airdrop Integration Endpoints for Maku.Travel
# This file contains comprehensive NFT/Airdrop endpoints that integrate with travel booking

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import hashlib
import json
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Router for NFT/Airdrop endpoints
nft_router = APIRouter(prefix="/api/nft", tags=["NFT & Airdrop"])

# ============================================
# NFT & AIRDROP DATA MODELS
# ============================================

class TravelNFTMetadata(BaseModel):
    destination: str
    provider: str  # 'expedia', 'amadeus', 'viator', etc.
    booking_value: float
    trip_date: str
    experience_type: str  # 'hotel', 'flight', 'activity', 'car', 'package'
    rarity_score: int = Field(ge=1, le=100)
    booking_id: Optional[str] = None
    
class TravelNFT(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    token_id: int
    name: str
    image: str
    metadata: TravelNFTMetadata
    blockchain: str = "cronos"  # Default to Cronos
    contract_address: Optional[str] = None
    owner: str
    minted_at: datetime = Field(default_factory=datetime.utcnow)
    rewards: Dict[str, Any] = {}

class AirdropQuest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    points: int
    category: str  # 'travel', 'social', 'provider', 'milestone'
    requirements: Dict[str, Any]
    progress: float = 0.0  # 0-100
    completed: bool = False
    deadline: Optional[datetime] = None
    provider: Optional[str] = None

class AirdropEligibility(BaseModel):
    user_id: str
    total_points: int
    current_tier: str
    estimated_allocation: int
    completion_percentage: float
    last_calculated: datetime = Field(default_factory=datetime.utcnow)

class QuestProgress(BaseModel):
    user_id: str
    quest_id: str
    progress: float
    completed: bool
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

# ============================================
# NFT MINTING & MANAGEMENT
# ============================================

@nft_router.post("/mint-travel-nft")
async def mint_travel_nft(
    booking_data: Dict[str, Any],
    user_id: str
):
    """Mint a travel NFT based on completed booking"""
    try:
        # Calculate rarity based on booking characteristics
        rarity_score = calculate_travel_rarity(booking_data)
        
        # Generate NFT metadata
        metadata = TravelNFTMetadata(
            destination=booking_data.get('destination', 'Unknown'),
            provider=booking_data.get('provider', 'unknown'),
            booking_value=float(booking_data.get('total_price', 0)),
            trip_date=booking_data.get('trip_date', datetime.now().isoformat()),
            experience_type=booking_data.get('type', 'travel'),
            rarity_score=rarity_score,
            booking_id=booking_data.get('booking_id')
        )
        
        # Create NFT record
        travel_nft = TravelNFT(
            token_id=generate_token_id(),
            name=f"{metadata.destination} {metadata.experience_type.title()} Experience",
            image=f"/api/nft/image/{metadata.destination.replace(' ', '_').lower()}",
            metadata=metadata,
            owner=user_id,
            rewards=calculate_nft_rewards(rarity_score, metadata.booking_value)
        )
        
        # In production, this would:
        # 1. Deploy to blockchain (Cronos/BSC)
        # 2. Store in database
        # 3. Update user's NFT collection
        
        logger.info(f"Travel NFT minted for user {user_id}: {travel_nft.name}")
        
        return {
            "success": True,
            "nft": travel_nft.dict(),
            "transaction_hash": f"0x{hashlib.sha256(f'{travel_nft.id}{user_id}'.encode()).hexdigest()}",
            "message": f"Successfully minted {travel_nft.name}!"
        }
        
    except Exception as e:
        logger.error(f"Failed to mint travel NFT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@nft_router.get("/collection/{user_id}")
async def get_user_nft_collection(user_id: str):
    """Get user's travel NFT collection"""
    try:
        # Mock collection data - in production, fetch from blockchain/database
        mock_collection = [
            {
                "id": "nft_001",
                "token_id": 1001,
                "name": "Santorini Sunset Explorer",
                "image": "/api/placeholder/400/600",
                "metadata": {
                    "destination": "Santorini, Greece",
                    "provider": "expedia",
                    "booking_value": 1500,
                    "trip_date": "2024-06-15",
                    "experience_type": "luxury_stay",
                    "rarity_score": 85
                },
                "blockchain": "cronos",
                "contract_address": "0x742d35Cc6346C4C75eE21F7bA0C9a3De5C4B6aAe",
                "owner": user_id,
                "minted_at": "2024-06-20T10:30:00Z",
                "rewards": {
                    "platform_credits": 200,
                    "priority_access": True,
                    "exclusive_offers": True,
                    "discount_percentage": 15
                }
            }
        ]
        
        return {
            "user_id": user_id,
            "collection": mock_collection,
            "total_nfts": len(mock_collection),
            "total_value": sum(nft["metadata"]["booking_value"] for nft in mock_collection),
            "total_credits": sum(nft["rewards"]["platform_credits"] for nft in mock_collection)
        }
        
    except Exception as e:
        logger.error(f"Failed to get NFT collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# AIRDROP SYSTEM
# ============================================

@nft_router.get("/airdrop/eligibility/{user_id}")
async def get_airdrop_eligibility(user_id: str):
    """Calculate user's airdrop eligibility and tier"""
    try:
        # Get user's activity data
        user_stats = await calculate_user_stats(user_id)
        
        # Calculate points from various sources
        booking_points = user_stats.get('total_booking_value', 0) // 10  # 1 point per $10
        nft_points = user_stats.get('nft_count', 0) * 50  # 50 points per NFT
        provider_points = user_stats.get('unique_providers', 0) * 100  # 100 points per provider
        social_points = user_stats.get('social_actions', 0) * 5  # 5 points per social action
        streak_points = user_stats.get('activity_streak', 0) * 10  # 10 points per day streak
        
        total_points = booking_points + nft_points + provider_points + social_points + streak_points
        
        # Determine tier
        tier = determine_airdrop_tier(total_points)
        
        # Calculate estimated allocation
        estimated_allocation = int(total_points * 2.5)  # Convert to integer
        
        eligibility = AirdropEligibility(
            user_id=user_id,
            total_points=total_points,
            current_tier=tier,
            estimated_allocation=estimated_allocation,
            completion_percentage=min(100, (total_points / 1000) * 100)
        )
        
        return eligibility.dict()
        
    except Exception as e:
        logger.error(f"Failed to calculate airdrop eligibility: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@nft_router.get("/quests/{user_id}")
async def get_user_quests(user_id: str):
    """Get available and active quests for user"""
    try:
        # Mock quest data integrated with travel providers
        base_quests = [
            {
                "id": "expedia_integration_quest",
                "title": "Expedia Group Explorer",
                "description": "Complete your first booking using our new Expedia Group integration",
                "points": 150,
                "category": "provider",
                "requirements": {
                    "provider": "expedia",
                    "booking_count": 1,
                    "min_value": 100
                },
                "progress": 0,
                "completed": False,
                "provider": "expedia",
                "deadline": (datetime.now() + timedelta(days=30)).isoformat()
            },
            {
                "id": "multi_provider_master",
                "title": "Multi-Provider Master",
                "description": "Use 4 different providers: Expedia, Amadeus, Viator, and Duffle",
                "points": 200,
                "category": "provider", 
                "requirements": {
                    "unique_providers": 4,
                    "providers_list": ["expedia", "amadeus", "viator", "duffle"]
                },
                "progress": 50,  # Assume user has used 2 providers
                "completed": False,
                "provider": "multi"
            },
            {
                "id": "smart_dreams_collector",
                "title": "Smart Dreams Collector",
                "description": "Add 20 destinations to your Smart Dreams collection",
                "points": 100,
                "category": "travel",
                "requirements": {
                    "destinations_count": 20
                },
                "progress": 65,
                "completed": False
            },
            {
                "id": "ai_intelligence_master",
                "title": "AI Intelligence Master",
                "description": "Use all AI features: Travel DNA, Recommendations, Journey Optimizer",
                "points": 80,
                "category": "milestone",
                "requirements": {
                    "ai_features_used": 3,
                    "features_list": ["travel_dna", "recommendations", "journey_optimizer"]
                },
                "progress": 100,
                "completed": True
            },
            {
                "id": "social_travel_ambassador",
                "title": "Social Travel Ambassador",
                "description": "Share 15 travel experiences and get 100 social interactions",
                "points": 120,
                "category": "social",
                "requirements": {
                    "shares_count": 15,
                    "social_interactions": 100
                },
                "progress": 30,
                "completed": False
            }
        ]
        
        return {
            "user_id": user_id,
            "quests": base_quests,
            "total_available_points": sum(q["points"] for q in base_quests if not q["completed"]),
            "completed_quests": sum(1 for q in base_quests if q["completed"]),
            "in_progress_quests": sum(1 for q in base_quests if not q["completed"] and q["progress"] > 0)
        }
        
    except Exception as e:
        logger.error(f"Failed to get user quests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@nft_router.post("/quest/{quest_id}/progress")
async def update_quest_progress(
    quest_id: str,
    user_id: str,
    action_data: Dict[str, Any]
):
    """Update quest progress based on user actions"""
    try:
        # This would integrate with booking confirmations, social actions, etc.
        quest_updates = {
            "expedia_integration_quest": {
                "trigger": "expedia_booking_completed",
                "points_awarded": 150
            },
            "multi_provider_master": {
                "trigger": "provider_booking_completed", 
                "points_calculation": "unique_providers_count * 50"
            },
            "smart_dreams_collector": {
                "trigger": "destination_added",
                "points_calculation": "destinations_count * 5"
            }
        }
        
        # Mock progress update
        updated_progress = {
            "quest_id": quest_id,
            "user_id": user_id,
            "previous_progress": action_data.get("previous_progress", 0),
            "new_progress": min(100, action_data.get("previous_progress", 0) + 25),
            "points_earned": action_data.get("points", 0),
            "completed": False,
            "updated_at": datetime.now().isoformat()
        }
        
        if updated_progress["new_progress"] >= 100:
            updated_progress["completed"] = True
            updated_progress["completion_date"] = datetime.now().isoformat()
        
        logger.info(f"Quest progress updated: {quest_id} for user {user_id}")
        
        return updated_progress
        
    except Exception as e:
        logger.error(f"Failed to update quest progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# AIRDROP CALCULATION & DISTRIBUTION
# ============================================

@nft_router.get("/airdrop/calculate/{user_id}")
async def calculate_airdrop_allocation(user_id: str):
    """Calculate user's airdrop allocation based on activity and NFTs"""
    try:
        # Get user data from various sources
        nft_collection = await get_user_nft_data(user_id)
        quest_data = await get_user_quest_data(user_id)
        booking_history = await get_user_booking_history(user_id)
        
        # Points calculation
        base_points = sum(booking.get('value', 0) for booking in booking_history) // 10
        nft_bonus = len(nft_collection) * 50
        quest_bonus = sum(quest.get('points', 0) for quest in quest_data if quest.get('completed'))
        provider_bonus = len(set(booking.get('provider') for booking in booking_history)) * 100
        
        total_points = base_points + nft_bonus + quest_bonus + provider_bonus
        
        # Tier determination
        tier_info = {
            "tier": determine_airdrop_tier(total_points),
            "multiplier": get_tier_multiplier(total_points),
            "benefits": get_tier_benefits(total_points)
        }
        
        # Final allocation calculation
        base_allocation = total_points * 2.5  # Base rate: 2.5 tokens per point
        final_allocation = base_allocation * tier_info["multiplier"]
        
        return {
            "user_id": user_id,
            "total_points": total_points,
            "tier_info": tier_info,
            "estimated_allocation": round(final_allocation),
            "breakdown": {
                "booking_points": base_points,
                "nft_bonus": nft_bonus,
                "quest_bonus": quest_bonus,
                "provider_bonus": provider_bonus
            },
            "calculation_date": datetime.now().isoformat(),
            "next_snapshot": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to calculate airdrop allocation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# INTEGRATION WITH TRAVEL PROVIDERS
# ============================================

@nft_router.post("/booking-reward")
async def process_booking_reward(booking_data: Dict[str, Any]):
    """Process NFT and airdrop rewards for completed bookings"""
    try:
        user_id = booking_data.get('user_id')
        booking_value = float(booking_data.get('total_price', 0))
        provider = booking_data.get('provider', 'unknown')
        
        rewards_earned = []
        
        # Check if booking qualifies for NFT minting
        if should_mint_nft(booking_data):
            nft_result = await mint_travel_nft(booking_data, user_id)
            if nft_result.get('success'):
                rewards_earned.append({
                    "type": "nft",
                    "name": nft_result['nft']['name'],
                    "rarity": get_nft_rarity(nft_result['nft']['metadata']['rarity_score'])
                })
        
        # Award quest progress points
        quest_points = calculate_booking_quest_points(booking_data)
        if quest_points > 0:
            rewards_earned.append({
                "type": "quest_points",
                "points": quest_points,
                "description": f"Booking completion with {provider}"
            })
        
        # Provider-specific bonuses
        provider_bonus = get_provider_bonus(provider, booking_value)
        if provider_bonus:
            rewards_earned.append({
                "type": "provider_bonus",
                "provider": provider,
                "bonus": provider_bonus
            })
        
        return {
            "booking_id": booking_data.get('booking_id'),
            "user_id": user_id,
            "rewards_earned": rewards_earned,
            "total_points_awarded": sum(r.get('points', 0) for r in rewards_earned),
            "processed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to process booking reward: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_travel_rarity(booking_data: Dict[str, Any]) -> int:
    """Calculate rarity score based on booking characteristics"""
    base_score = 50
    
    # Higher value bookings get rarity boost
    booking_value = float(booking_data.get('total_price', 0))
    if booking_value > 2000: base_score += 30
    elif booking_value > 1000: base_score += 20
    elif booking_value > 500: base_score += 10
    
    # Provider diversity bonus
    provider = booking_data.get('provider', 'unknown')
    if provider == 'expedia': base_score += 15  # New integration bonus
    elif provider in ['amadeus', 'viator']: base_score += 10
    
    # Experience type bonus
    experience_type = booking_data.get('type', 'hotel')
    if experience_type in ['package', 'luxury']: base_score += 15
    elif experience_type in ['activity', 'experience']: base_score += 10
    
    return min(100, base_score)

def calculate_nft_rewards(rarity_score: int, booking_value: float) -> Dict[str, Any]:
    """Calculate NFT holder rewards based on rarity and value"""
    base_credits = max(50, booking_value * 0.1)  # 10% of booking value as credits
    
    if rarity_score >= 90:  # Legendary
        return {
            "platform_credits": int(base_credits * 2.0),
            "priority_access": True,
            "exclusive_offers": True,
            "discount_percentage": 20
        }
    elif rarity_score >= 75:  # Epic
        return {
            "platform_credits": int(base_credits * 1.5),
            "priority_access": True,
            "exclusive_offers": True,
            "discount_percentage": 15
        }
    elif rarity_score >= 60:  # Rare
        return {
            "platform_credits": int(base_credits * 1.2),
            "priority_access": False,
            "exclusive_offers": True,
            "discount_percentage": 10
        }
    else:  # Common
        return {
            "platform_credits": int(base_credits),
            "priority_access": False,
            "exclusive_offers": False,
            "discount_percentage": 5
        }

def determine_airdrop_tier(points: int) -> str:
    """Determine airdrop tier based on total points"""
    if points >= 1000: return "Legend"
    elif points >= 500: return "Adventurer"
    elif points >= 200: return "Explorer"
    else: return "Wanderer"

def get_tier_multiplier(points: int) -> float:
    """Get airdrop allocation multiplier based on tier"""
    tier = determine_airdrop_tier(points)
    multipliers = {
        "Legend": 2.5,
        "Adventurer": 2.0,
        "Explorer": 1.5,
        "Wanderer": 1.0
    }
    return multipliers.get(tier, 1.0)

def should_mint_nft(booking_data: Dict[str, Any]) -> bool:
    """Determine if a booking qualifies for NFT minting"""
    booking_value = float(booking_data.get('total_price', 0))
    experience_type = booking_data.get('type', 'hotel')
    
    # Criteria for NFT minting
    if booking_value >= 500:  # High-value bookings
        return True
    if experience_type in ['package', 'luxury', 'activity']:  # Special experiences
        return True
    if booking_data.get('provider') == 'expedia' and booking_value >= 200:  # New provider bonus
        return True
        
    return False

def generate_token_id() -> int:
    """Generate unique token ID for NFT"""
    import time
    return int(time.time() * 1000) % 100000000  # Use timestamp for uniqueness

async def get_user_nft_data(user_id: str) -> List[Dict[str, Any]]:
    """Get user's NFT data (mock for now)"""
    return []

async def get_user_quest_data(user_id: str) -> List[Dict[str, Any]]:
    """Get user's quest data (mock for now)"""
    return []

async def get_user_booking_history(user_id: str) -> List[Dict[str, Any]]:
    """Get user's booking history (mock for now)"""
    return [
        {"value": 1500, "provider": "expedia", "type": "hotel"},
        {"value": 800, "provider": "amadeus", "type": "flight"}
    ]

async def calculate_user_stats(user_id: str) -> Dict[str, Any]:
    """Calculate comprehensive user statistics"""
    return {
        "total_booking_value": 2300,
        "nft_count": 2,
        "unique_providers": 3,
        "social_actions": 45,
        "activity_streak": 12
    }

def get_tier_benefits(points: int) -> List[str]:
    """Get benefits for current tier"""
    tier = determine_airdrop_tier(points)
    benefits_map = {
        "Legend": ["Maximum airdrop allocation", "25% platform credits", "VIP treatment", "NFT guarantees"],
        "Adventurer": ["High airdrop multiplier", "15% platform credits", "Exclusive offers", "Early access"],
        "Explorer": ["Enhanced airdrop weight", "10% platform credits", "Priority support"],
        "Wanderer": ["Basic airdrop eligibility", "5% platform credits"]
    }
    return benefits_map.get(tier, [])

def calculate_booking_quest_points(booking_data: Dict[str, Any]) -> int:
    """Calculate quest points for booking completion"""
    provider = booking_data.get('provider', 'unknown')
    booking_value = float(booking_data.get('total_price', 0))
    
    base_points = 25  # Base points for any booking
    
    # Provider-specific bonuses
    if provider == 'expedia': base_points += 50  # New integration bonus
    elif provider in ['amadeus', 'viator', 'duffle', 'ratehawk']: base_points += 25
    
    # Value-based bonuses
    if booking_value > 1000: base_points += 25
    elif booking_value > 500: base_points += 15
    
    return base_points

def get_provider_bonus(provider: str, booking_value: float) -> Dict[str, Any]:
    """Get provider-specific bonuses"""
    bonuses = {
        "expedia": {
            "type": "integration_launch_bonus",
            "credits": int(booking_value * 0.15),  # 15% credits for Expedia
            "description": "Expedia Group launch celebration bonus"
        },
        "amadeus": {
            "type": "global_network_bonus", 
            "credits": int(booking_value * 0.10),
            "description": "Global network coverage bonus"
        },
        "viator": {
            "type": "experience_bonus",
            "credits": int(booking_value * 0.12),
            "description": "Unique experience discovery bonus"
        }
    }
    
    return bonuses.get(provider)

def get_nft_rarity(rarity_score: int) -> str:
    """Convert rarity score to rarity name"""
    if rarity_score >= 90: return "legendary"
    elif rarity_score >= 75: return "epic"
    elif rarity_score >= 60: return "rare"
    else: return "common"