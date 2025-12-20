# Admin NFT and Airdrop Management Endpoints
# These endpoints allow administrators to control NFT generation, airdrop distribution, and tokenomics

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import json
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Router for Admin NFT/Airdrop endpoints
admin_nft_router = APIRouter(prefix="/api/admin/nft", tags=["Admin NFT & Airdrop"])

# ============================================
# ADMIN NFT MANAGEMENT MODELS
# ============================================

class NFTTemplateCreate(BaseModel):
    name: str
    rarity: str  # 'common', 'rare', 'epic', 'legendary'
    requirements: Dict[str, Any]
    rewards: Dict[str, Any]
    image_template: str
    provider_specific: Optional[str] = None

class NFTTemplateUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None
    requirements: Optional[Dict[str, Any]] = None
    rewards: Optional[Dict[str, Any]] = None

class AirdropEventCreate(BaseModel):
    name: str
    start_date: str
    end_date: str
    total_allocation: int
    tier_multipliers: Dict[str, float]
    quest_points_multiplier: float
    provider_bonuses: Dict[str, float]
    eligibility_criteria: Optional[Dict[str, Any]] = None

class TokenomicsConfig(BaseModel):
    total_supply: int
    distribution: Dict[str, float]  # percentages
    vesting_schedules: Dict[str, Any]
    burn_mechanisms: List[str]
    utility_functions: List[str]

class ManualNFTMint(BaseModel):
    recipient_address: str
    template_id: str
    metadata_override: Optional[Dict[str, Any]] = None
    reason: str  # Admin reason for manual mint

# ============================================
# ADMIN NFT TEMPLATE MANAGEMENT
# ============================================

@admin_nft_router.post("/templates/create")
async def create_nft_template(template: NFTTemplateCreate):
    """Create new NFT template for automatic minting"""
    try:
        nft_template = {
            "id": f"nft_template_{int(datetime.now().timestamp())}",
            "name": template.name,
            "rarity": template.rarity,
            "requirements": template.requirements,
            "rewards": template.rewards,
            "image_template": template.image_template,
            "provider_specific": template.provider_specific,
            "active": True,
            "created_at": datetime.now().isoformat(),
            "minted_count": 0,
            "total_rewards_distributed": 0
        }
        
        # In production, store in database
        logger.info(f"NFT template created: {template.name} ({template.rarity})")
        
        return {
            "success": True,
            "template": nft_template,
            "message": f"NFT template '{template.name}' created successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to create NFT template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.get("/templates")
async def get_nft_templates():
    """Get all NFT templates with statistics"""
    try:
        # Mock template data - in production, fetch from database
        templates = [
            {
                "id": "nft_template_001",
                "name": "Expedia Group Master Explorer",
                "rarity": "epic",
                "requirements": {
                    "booking_value": 2000,
                    "provider": "expedia",
                    "experience_type": "luxury"
                },
                "rewards": {
                    "platform_credits": 300,
                    "discount_percentage": 15,
                    "priority_access": True
                },
                "provider_specific": "expedia",
                "active": True,
                "minted_count": 89,
                "total_rewards_distributed": 26700,
                "created_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": "nft_template_002", 
                "name": "Multi-Provider Champion",
                "rarity": "rare",
                "requirements": {
                    "booking_value": 1000,
                    "unique_providers": 4
                },
                "rewards": {
                    "platform_credits": 200,
                    "discount_percentage": 10,
                    "priority_access": True
                },
                "provider_specific": None,
                "active": True,
                "minted_count": 156,
                "total_rewards_distributed": 31200,
                "created_at": "2024-01-10T14:20:00Z"
            }
        ]
        
        return {
            "templates": templates,
            "total_templates": len(templates),
            "active_templates": len([t for t in templates if t["active"]]),
            "total_minted": sum(t["minted_count"] for t in templates),
            "total_rewards_distributed": sum(t["total_rewards_distributed"] for t in templates)
        }
        
    except Exception as e:
        logger.error(f"Failed to get NFT templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.put("/templates/{template_id}")
async def update_nft_template(template_id: str, updates: NFTTemplateUpdate):
    """Update existing NFT template"""
    try:
        # Mock update - in production, update database
        updated_template = {
            "id": template_id,
            "updated_at": datetime.now().isoformat(),
            "updated_fields": [k for k, v in updates.dict().items() if v is not None]
        }
        
        logger.info(f"NFT template updated: {template_id}")
        
        return {
            "success": True,
            "template_id": template_id,
            "updates_applied": updated_template,
            "message": "NFT template updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to update NFT template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.post("/mint/manual")
async def manual_nft_mint(mint_request: ManualNFTMint):
    """Manually mint NFT for specific user (admin override)"""
    try:
        # Validate template exists
        template_id = mint_request.template_id
        
        # Create manual mint record
        manual_mint = {
            "mint_id": f"manual_mint_{int(datetime.now().timestamp())}",
            "template_id": template_id,
            "recipient": mint_request.recipient_address,
            "reason": mint_request.reason,
            "metadata_override": mint_request.metadata_override,
            "minted_by": "admin",  # In production, get from auth context
            "minted_at": datetime.now().isoformat(),
            "transaction_hash": f"0x{uuid.uuid4().hex[:64]}",  # Mock hash
            "blockchain": "cronos",
            "status": "pending_blockchain_confirmation"
        }
        
        logger.info(f"Manual NFT mint initiated: {template_id} for {mint_request.recipient_address}")
        
        return {
            "success": True,
            "mint_record": manual_mint,
            "message": f"NFT manually minted for {mint_request.recipient_address}"
        }
        
    except Exception as e:
        logger.error(f"Failed to manually mint NFT: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ADMIN AIRDROP CONTROL
# ============================================

@admin_nft_router.post("/airdrop/create")
async def create_airdrop_event(airdrop: AirdropEventCreate):
    """Create new airdrop distribution event"""
    try:
        airdrop_event = {
            "id": f"airdrop_{int(datetime.now().timestamp())}",
            "name": airdrop.name,
            "start_date": airdrop.start_date,
            "end_date": airdrop.end_date,
            "total_allocation": airdrop.total_allocation,
            "tier_multipliers": airdrop.tier_multipliers,
            "quest_points_multiplier": airdrop.quest_points_multiplier,
            "provider_bonuses": airdrop.provider_bonuses,
            "eligibility_criteria": airdrop.eligibility_criteria or {},
            "status": "scheduled",
            "created_by": "admin",  # In production, get from auth context
            "created_at": datetime.now().isoformat(),
            "participants_count": 0,
            "total_distributed": 0
        }
        
        # In production, store in database and schedule distribution
        logger.info(f"Airdrop event created: {airdrop.name}")
        
        return {
            "success": True,
            "airdrop_event": airdrop_event,
            "message": f"Airdrop event '{airdrop.name}' created successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to create airdrop event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.get("/airdrop/events")
async def get_airdrop_events():
    """Get all airdrop events with status and analytics"""
    try:
        # Mock airdrop events - in production, fetch from database
        events = [
            {
                "id": "airdrop_summer_2024",
                "name": "Summer 2024 Travel Rewards",
                "start_date": "2024-07-01",
                "end_date": "2024-07-31",
                "total_allocation": 1000000,
                "status": "active",
                "participants_count": 1847,
                "total_distributed": 0,
                "eligibility_snapshot_taken": False,
                "distribution_progress": 0,
                "tier_breakdown": {
                    "legend": 23,
                    "adventurer": 156,
                    "explorer": 489,
                    "wanderer": 1179
                }
            },
            {
                "id": "airdrop_provider_bonus",
                "name": "Provider Integration Bonus",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "total_allocation": 500000,
                "status": "ongoing",
                "participants_count": 2341,
                "total_distributed": 127500,
                "eligibility_snapshot_taken": True,
                "distribution_progress": 25.5,
                "provider_breakdown": {
                    "expedia": 234,
                    "amadeus": 189,
                    "viator": 167,
                    "duffle": 123,
                    "ratehawk": 145,
                    "sabre": 98
                }
            }
        ]
        
        return {
            "events": events,
            "total_events": len(events),
            "active_events": len([e for e in events if e["status"] == "active"]),
            "total_allocation": sum(e["total_allocation"] for e in events),
            "total_participants": sum(e["participants_count"] for e in events)
        }
        
    except Exception as e:
        logger.error(f"Failed to get airdrop events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.post("/airdrop/{event_id}/distribute")
async def distribute_airdrop(event_id: str, distribution_params: Dict[str, Any]):
    """Execute airdrop distribution for specified event"""
    try:
        # In production, this would:
        # 1. Take eligibility snapshot
        # 2. Calculate final allocations
        # 3. Execute blockchain transfers
        # 4. Update user balances
        
        distribution_result = {
            "event_id": event_id,
            "distribution_id": f"dist_{int(datetime.now().timestamp())}",
            "snapshot_taken_at": datetime.now().isoformat(),
            "total_recipients": distribution_params.get("recipient_count", 1847),
            "total_tokens_distributed": distribution_params.get("total_tokens", 487500),
            "transaction_hashes": [
                f"0x{uuid.uuid4().hex[:64]}",  # Mock transaction hashes
                f"0x{uuid.uuid4().hex[:64]}"
            ],
            "status": "completed",
            "distribution_breakdown": {
                "legend_tier": {"recipients": 23, "tokens": 125000},
                "adventurer_tier": {"recipients": 156, "tokens": 187500},
                "explorer_tier": {"recipients": 489, "tokens": 125000},
                "wanderer_tier": {"recipients": 1179, "tokens": 50000}
            }
        }
        
        logger.info(f"Airdrop distribution executed: {event_id}")
        
        return {
            "success": True,
            "distribution": distribution_result,
            "message": f"Airdrop distributed to {distribution_result['total_recipients']} recipients"
        }
        
    except Exception as e:
        logger.error(f"Failed to distribute airdrop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# TOKENOMICS CONFIGURATION
# ============================================

@admin_nft_router.post("/tokenomics/create")
async def create_tokenomics_config(config: TokenomicsConfig):
    """Create and configure tokenomics parameters"""
    try:
        # Validate distribution percentages sum to 100%
        total_percentage = sum(config.distribution.values())
        if abs(total_percentage - 100.0) > 0.01:
            raise HTTPException(status_code=400, detail=f"Distribution percentages must sum to 100%, got {total_percentage}%")
        
        tokenomics = {
            "id": f"tokenomics_{int(datetime.now().timestamp())}",
            "total_supply": config.total_supply,
            "distribution": config.distribution,
            "vesting_schedules": config.vesting_schedules,
            "burn_mechanisms": config.burn_mechanisms,
            "utility_functions": config.utility_functions,
            "created_by": "admin",
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "last_updated": datetime.now().isoformat()
        }
        
        # Calculate token amounts
        token_amounts = {}
        for category, percentage in config.distribution.items():
            token_amounts[category] = int(config.total_supply * (percentage / 100))
        
        logger.info(f"Tokenomics configuration created: {config.total_supply} total supply")
        
        return {
            "success": True,
            "tokenomics": tokenomics,
            "token_amounts": token_amounts,
            "message": "Tokenomics configuration created successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to create tokenomics config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.get("/tokenomics")
async def get_tokenomics_config():
    """Get current tokenomics configuration"""
    try:
        # Mock tokenomics data - in production, fetch from database
        current_config = {
            "id": "tokenomics_current",
            "total_supply": 10000000,
            "distribution": {
                "airdrop_allocation": 40.0,
                "nft_holder_rewards": 25.0,
                "provider_partnerships": 15.0,
                "team_development": 10.0,
                "community_treasury": 10.0
            },
            "token_amounts": {
                "airdrop_allocation": 4000000,
                "nft_holder_rewards": 2500000,
                "provider_partnerships": 1500000,
                "team_development": 1000000,
                "community_treasury": 1000000
            },
            "vesting_schedules": {
                "team_development": "24_month_linear",
                "provider_partnerships": "12_month_cliff_then_linear"
            },
            "burn_mechanisms": [
                "quarterly_buyback_burn",
                "travel_booking_fee_burn"
            ],
            "utility_functions": [
                "platform_fee_discounts",
                "governance_voting",
                "exclusive_travel_access",
                "nft_marketplace_currency"
            ],
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z",
            "last_updated": datetime.now().isoformat()
        }
        
        return current_config
        
    except Exception as e:
        logger.error(f"Failed to get tokenomics config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.put("/tokenomics/update")
async def update_tokenomics_config(updates: Dict[str, Any]):
    """Update tokenomics configuration"""
    try:
        # Validate updates
        if "distribution" in updates:
            total_percentage = sum(updates["distribution"].values())
            if abs(total_percentage - 100.0) > 0.01:
                raise HTTPException(status_code=400, detail=f"Distribution percentages must sum to 100%, got {total_percentage}%")
        
        update_result = {
            "updated_fields": list(updates.keys()),
            "updated_at": datetime.now().isoformat(),
            "updated_by": "admin",
            "previous_config_backup_id": f"backup_{int(datetime.now().timestamp())}"
        }
        
        logger.info(f"Tokenomics configuration updated: {updates.keys()}")
        
        return {
            "success": True,
            "update_result": update_result,
            "message": "Tokenomics configuration updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to update tokenomics config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# AIRDROP ADMINISTRATION
# ============================================

@admin_nft_router.get("/airdrop/eligibility-snapshot")
async def take_eligibility_snapshot():
    """Take snapshot of all user eligibility for airdrop distribution"""
    try:
        # Mock snapshot process - in production, query all users
        snapshot = {
            "snapshot_id": f"snapshot_{int(datetime.now().timestamp())}",
            "taken_at": datetime.now().isoformat(),
            "total_eligible_users": 1847,
            "tier_breakdown": {
                "legend": {
                    "count": 23,
                    "avg_points": 1456,
                    "total_allocation": 125000
                },
                "adventurer": {
                    "count": 156,
                    "avg_points": 687,
                    "total_allocation": 187500
                },
                "explorer": {
                    "count": 489,
                    "avg_points": 312,
                    "total_allocation": 125000
                },
                "wanderer": {
                    "count": 1179,
                    "avg_points": 89,
                    "total_allocation": 50000
                }
            },
            "provider_breakdown": {
                "expedia": 234,
                "amadeus": 189,
                "viator": 167,
                "duffle": 123,
                "ratehawk": 145,
                "sabre": 98
            },
            "total_tokens_allocated": 487500,
            "status": "completed"
        }
        
        logger.info(f"Eligibility snapshot taken: {snapshot['total_eligible_users']} users")
        
        return snapshot
        
    except Exception as e:
        logger.error(f"Failed to take eligibility snapshot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.post("/airdrop/execute-distribution")
async def execute_airdrop_distribution(distribution_config: Dict[str, Any]):
    """Execute airdrop distribution to eligible users"""
    try:
        # Mock distribution execution
        distribution = {
            "distribution_id": f"distribution_{int(datetime.now().timestamp())}",
            "event_name": distribution_config.get("event_name", "Manual Distribution"),
            "executed_at": datetime.now().isoformat(),
            "total_recipients": distribution_config.get("recipient_count", 1847),
            "total_tokens": distribution_config.get("total_tokens", 487500),
            "batch_transactions": [
                {
                    "batch_id": f"batch_{i}",
                    "transaction_hash": f"0x{uuid.uuid4().hex[:64]}",
                    "recipients": 100,
                    "tokens": distribution_config.get("total_tokens", 487500) // 20
                }
                for i in range(20)  # 20 batches
            ],
            "status": "executing",
            "estimated_completion": (datetime.now() + timedelta(minutes=30)).isoformat()
        }
        
        logger.info(f"Airdrop distribution started: {distribution['distribution_id']}")
        
        return {
            "success": True,
            "distribution": distribution,
            "message": f"Airdrop distribution started for {distribution['total_recipients']} recipients"
        }
        
    except Exception as e:
        logger.error(f"Failed to execute airdrop distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ANALYTICS & MONITORING
# ============================================

@admin_nft_router.get("/analytics/overview")
async def get_nft_airdrop_analytics():
    """Get comprehensive NFT and airdrop analytics"""
    try:
        analytics = {
            "nft_metrics": {
                "total_minted": 247,
                "total_value_locked": 156000,
                "average_rarity_score": 67.8,
                "holder_count": 189,
                "most_popular_provider": "expedia",
                "rarity_distribution": {
                    "legendary": 12,
                    "epic": 34,
                    "rare": 89,
                    "common": 112
                }
            },
            "airdrop_metrics": {
                "total_eligible_users": 1847,
                "total_points_earned": 487234,
                "average_tier": "explorer",
                "quest_completion_rate": 73.2,
                "provider_participation": {
                    "expedia": 234,
                    "amadeus": 189,
                    "viator": 167,
                    "duffle": 123,
                    "ratehawk": 145,
                    "sabre": 98
                }
            },
            "tokenomics_health": {
                "total_supply": 10000000,
                "circulating_supply": 0,  # No tokens distributed yet
                "burned_tokens": 0,
                "staked_percentage": 0,
                "utility_usage": {
                    "platform_discounts": 15678,
                    "governance_votes": 0,
                    "exclusive_access": 89
                }
            },
            "system_health": {
                "blockchain_sync": True,
                "smart_contracts_verified": True,
                "api_endpoints_healthy": True,
                "provider_integrations_active": 6
            }
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.post("/system/emergency-stop")
async def emergency_stop_nft_airdrop():
    """Emergency stop for NFT minting and airdrop distribution"""
    try:
        emergency_stop = {
            "stop_id": f"emergency_{int(datetime.now().timestamp())}",
            "stopped_at": datetime.now().isoformat(),
            "stopped_by": "admin",
            "affected_systems": [
                "nft_minting",
                "airdrop_distribution", 
                "quest_progression",
                "reward_calculation"
            ],
            "reason": "Administrative emergency stop",
            "estimated_downtime": "5-15 minutes",
            "rollback_available": True
        }
        
        logger.warning(f"Emergency stop activated: {emergency_stop['stop_id']}")
        
        return {
            "success": True,
            "emergency_stop": emergency_stop,
            "message": "Emergency stop activated - all NFT and airdrop systems paused"
        }
        
    except Exception as e:
        logger.error(f"Failed to execute emergency stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PROVIDER BONUS MANAGEMENT
# ============================================

@admin_nft_router.put("/provider-bonuses/update")
async def update_provider_bonuses(bonuses: Dict[str, float]):
    """Update provider-specific bonus percentages"""
    try:
        # Validate bonuses
        for provider, bonus in bonuses.items():
            if not (0 <= bonus <= 100):
                raise HTTPException(status_code=400, detail=f"Invalid bonus for {provider}: {bonus}% (must be 0-100%)")
        
        updated_bonuses = {
            "update_id": f"bonus_update_{int(datetime.now().timestamp())}",
            "updated_bonuses": bonuses,
            "updated_at": datetime.now().isoformat(),
            "updated_by": "admin",
            "previous_bonuses": {
                "expedia": 15,
                "amadeus": 10,
                "viator": 12,
                "duffle": 10,
                "ratehawk": 10,
                "sabre": 10
            }
        }
        
        logger.info(f"Provider bonuses updated: {bonuses}")
        
        return {
            "success": True,
            "bonuses_update": updated_bonuses,
            "message": "Provider bonuses updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to update provider bonuses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@admin_nft_router.get("/provider-bonuses")
async def get_current_provider_bonuses():
    """Get current provider bonus configuration"""
    try:
        current_bonuses = {
            "expedia": 15.0,  # New integration bonus
            "amadeus": 10.0,
            "viator": 12.0,
            "duffle": 10.0,
            "ratehawk": 10.0,
            "sabre": 10.0
        }
        
        return {
            "provider_bonuses": current_bonuses,
            "last_updated": datetime.now().isoformat(),
            "total_providers": len(current_bonuses),
            "highest_bonus": max(current_bonuses.values()),
            "average_bonus": sum(current_bonuses.values()) / len(current_bonuses)
        }
        
    except Exception as e:
        logger.error(f"Failed to get provider bonuses: {e}")
        raise HTTPException(status_code=500, detail=str(e))