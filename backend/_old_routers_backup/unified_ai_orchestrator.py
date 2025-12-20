# Unified AI Orchestrator - Consolidates all AI/LLM functionality into single service
# Provides contextual AI assistance across all platform modules

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import json
import logging
import os

logger = logging.getLogger(__name__)

# Router for unified AI services
unified_ai_router = APIRouter(prefix="/api/unified-ai", tags=["Unified AI"])

# ============================================
# UNIFIED AI DATA MODELS
# ============================================

class AIRequest(BaseModel):
    query: str
    context: Dict[str, Any]
    user_id: Optional[str] = None
    module: str = "general"  # smart-dreams, nft, airdrop, booking, admin
    intent: Optional[str] = None

class AIResponse(BaseModel):
    response: str
    confidence: float
    context_used: List[str]
    recommendations: List[Dict[str, Any]]
    cross_module_insights: List[Dict[str, Any]]

class PlatformContext(BaseModel):
    user_profile: Optional[Dict[str, Any]] = None
    current_module: str = "general"
    recent_actions: List[Dict[str, Any]] = []
    travel_data: Optional[Dict[str, Any]] = None
    rewards_data: Optional[Dict[str, Any]] = None

class ExternalAIQuery(BaseModel):
    agent_id: str
    query_type: str
    query: str
    credentials: Optional[Dict[str, str]] = None

# ============================================
# UNIFIED AI ORCHESTRATOR SERVICE
# ============================================

class UnifiedAIOrchestrator:
    def __init__(self):
        self.llm_client = None
        self.context_cache = {}
        self.knowledge_base = self.initialize_knowledge_base()
        
    def initialize_knowledge_base(self):
        """Initialize platform knowledge base for AI context"""
        return {
            "platform_capabilities": {
                "travel_booking": "6-provider ecosystem (Expedia, Amadeus, Viator, Duffle, RateHawk, Sabre)",
                "ai_intelligence": "Travel DNA analysis, recommendations, journey optimization",
                "blockchain_rewards": "NFT collection, airdrop tiers, gamification",
                "smart_features": "Smart Dreams planning, AI-powered insights"
            },
            "user_journey_patterns": {
                "new_user": "Browse → Learn → Connect → Book → Earn",
                "existing_user": "Check Rewards → Plan Trip → Book → Track Progress",
                "power_user": "Optimize Routes → Multi-Provider → Maximize Rewards"
            },
            "cross_module_relationships": {
                "booking_affects": ["NFT eligibility", "Tier progression", "Quest completion", "AI learning"],
                "rewards_affect": ["Smart Dreams access", "Provider benefits", "Feature unlocks"],
                "ai_affects": ["Recommendation quality", "Journey optimization", "Personalization"]
            }
        }
    
    async def initialize_llm(self):
        """Initialize LLM client with unified context"""
        if not self.llm_client:
            try:
                from emergentintegrations.llm.chat import LlmChat
                
                api_key = os.environ.get('EMERGENT_LLM_KEY')
                if not api_key:
                    raise Exception("EMERGENT_LLM_KEY not configured")
                
                self.llm_client = LlmChat(
                    api_key=api_key,
                    session_id="unified_ai_orchestrator",
                    system_message="You are the unified AI assistant for Maku.Travel, an intelligent travel platform with blockchain rewards. You help users across all modules: travel booking, Smart Dreams planning, NFT rewards, airdrop progression, and platform features."
                ).with_model("openai", "gpt-4o-mini")
                
                return True
            except Exception as e:
                logger.error(f"Failed to initialize LLM: {e}")
                return False
        return True
    
    async def process_unified_query(self, request: AIRequest, platform_context: PlatformContext) -> AIResponse:
        """Process AI query with full platform context"""
        
        if not await self.initialize_llm():
            raise Exception("AI service not available")
        
        # Build comprehensive context
        context_prompt = await self.build_context_prompt(request, platform_context)
        
        # Generate AI response
        ai_response = await self.llm_client.send_message(context_prompt)
        
        # Parse and enhance response
        enhanced_response = await self.enhance_ai_response(ai_response, request, platform_context)
        
        return enhanced_response
    
    async def build_context_prompt(self, request: AIRequest, context: PlatformContext) -> str:
        """Build comprehensive context prompt for AI"""
        
        prompt_parts = [
            f"User Query: {request.query}",
            f"Current Module: {request.module}",
            f"Platform Context: {json.dumps(self.knowledge_base['platform_capabilities'], indent=2)}"
        ]
        
        # Add user-specific context
        if context.user_profile:
            travel_dna = context.user_profile.get('travel_dna', {})
            prompt_parts.append(f"User Travel DNA: {travel_dna.get('personality_type', 'unknown')} with confidence {travel_dna.get('confidence_score', 0)}")
        
        # Add module-specific context
        if request.module == "smart-dreams" and context.travel_data:
            prompt_parts.append(f"Smart Dreams Context: {len(context.travel_data.get('destinations', []))} dream destinations")
        
        if request.module in ["nft", "airdrop"] and context.rewards_data:
            tier_info = context.rewards_data.get('airdrop_status', {})
            prompt_parts.append(f"Rewards Context: {tier_info.get('current_tier', 'unknown')} tier with {tier_info.get('total_points', 0)} points")
        
        # Add cross-module relationships
        prompt_parts.append(f"Cross-Module Relationships: {json.dumps(self.knowledge_base['cross_module_relationships'], indent=2)}")
        
        return "\n\n".join(prompt_parts)
    
    async def enhance_ai_response(self, ai_response: str, request: AIRequest, context: PlatformContext) -> AIResponse:
        """Enhance AI response with cross-module insights and recommendations"""
        
        # Generate cross-module insights
        cross_insights = await self.generate_cross_module_insights(request, context)
        
        # Generate actionable recommendations
        recommendations = await self.generate_actionable_recommendations(request, context)
        
        # Calculate confidence based on available context
        confidence = self.calculate_response_confidence(request, context)
        
        return AIResponse(
            response=ai_response,
            confidence=confidence,
            context_used=self.get_context_sources(context),
            recommendations=recommendations,
            cross_module_insights=cross_insights
        )
    
    async def generate_cross_module_insights(self, request: AIRequest, context: PlatformContext) -> List[Dict[str, Any]]:
        """Generate insights that span multiple modules"""
        insights = []
        
        # Travel + Rewards insights
        if context.travel_data and context.rewards_data:
            booking_value = sum(b.get('total_value', 0) for b in context.travel_data.get('bookings', []))
            current_tier = context.rewards_data.get('airdrop_status', {}).get('current_tier', 'wanderer')
            
            if booking_value > 1000 and current_tier == 'wanderer':
                insights.append({
                    "type": "tier_opportunity",
                    "message": f"With ${booking_value} in bookings, you could be an Explorer tier member with 50% more rewards",
                    "action": "Complete one more quest to advance tiers",
                    "potential_benefit": "Additional 150+ platform credits"
                })
        
        # Smart Dreams + Provider insights
        if request.module == "smart-dreams" and context.travel_data:
            unused_providers = self.get_unused_providers(context.travel_data.get('bookings', []))
            if unused_providers:
                insights.append({
                    "type": "provider_opportunity",
                    "message": f"Try {unused_providers[0]} for {self.get_provider_bonus(unused_providers[0])}% extra rewards",
                    "action": f"Search {unused_providers[0]} for your dream destinations",
                    "cross_module_benefit": "Unlocks provider-specific NFT collections"
                })
        
        return insights
    
    def get_unused_providers(self, bookings: List[Dict]) -> List[str]:
        """Get providers user hasn't used yet"""
        used_providers = set(b.get('provider', '').lower() for b in bookings)
        all_providers = {'expedia', 'amadeus', 'viator', 'duffle', 'ratehawk', 'sabre'}
        return list(all_providers - used_providers)
    
    def get_provider_bonus(self, provider: str) -> int:
        """Get provider bonus percentage"""
        bonuses = {
            'expedia': 15,
            'amadeus': 10,
            'viator': 12,
            'duffle': 10,
            'ratehawk': 10,
            'sabre': 10
        }
        return bonuses.get(provider.lower(), 10)

# Global orchestrator instance
unified_ai_orchestrator = UnifiedAIOrchestrator()

# ============================================
# UNIFIED AI API ENDPOINTS
# ============================================

@unified_ai_router.post("/query")
async def process_unified_ai_query(request: AIRequest, context: PlatformContext):
    """Process AI query with full platform context"""
    try:
        response = await unified_ai_orchestrator.process_unified_query(request, context)
        return response.dict()
    except Exception as e:
        logger.error(f"Unified AI query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@unified_ai_router.get("/capabilities")
async def get_ai_capabilities():
    """Get comprehensive AI capabilities for external agents"""
    return {
        "ai_services": {
            "travel_intelligence": {
                "travel_dna_analysis": "Personality-based travel recommendations",
                "journey_optimization": "Multi-destination trip planning",
                "predictive_insights": "Price and timing predictions"
            },
            "rewards_intelligence": {
                "nft_optimization": "Maximize NFT earning potential",
                "tier_advancement": "Strategic tier progression advice",
                "quest_recommendations": "Personalized quest selection"
            },
            "booking_intelligence": {
                "provider_comparison": "Real-time provider analysis",
                "reward_preview": "Booking reward calculations",
                "timing_optimization": "Best booking timing advice"
            }
        },
        "cross_module_capabilities": {
            "unified_context": "AI understands user state across all modules",
            "predictive_modeling": "Anticipates user needs and opportunities",
            "automated_optimization": "Continuously improves user experience",
            "intelligent_notifications": "Context-aware alerts and recommendations"
        },
        "integration_endpoints": {
            "query_processing": "/api/unified-ai/query",
            "external_agents": "/api/unified-ai/external",
            "context_update": "/api/unified-ai/context/update",
            "capability_discovery": "/api/unified-ai/capabilities"
        }
    }

@unified_ai_router.post("/external")
async def process_external_ai_agent(query: ExternalAIQuery):
    """Process queries from external AI agents with structured responses"""
    try:
        # Validate external agent (in production, implement proper auth)
        if not query.agent_id:
            raise HTTPException(status_code=400, detail="Agent ID required")
        
        # Route query based on type
        if query.query_type == "platform_discovery":
            return await generate_platform_discovery_response()
        elif query.query_type == "capability_analysis":
            return await generate_capability_analysis()
        elif query.query_type == "integration_guidance":
            return await generate_integration_guidance(query.query)
        elif query.query_type == "schema_request":
            return await generate_schema_documentation()
        else:
            return await generate_general_platform_info(query.query)
            
    except Exception as e:
        logger.error(f"External AI agent query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_platform_discovery_response():
    """Generate platform overview for external AI discovery"""
    return {
        "platform_overview": {
            "name": "Maku.Travel",
            "description": "AI-powered travel platform with blockchain rewards",
            "core_modules": [
                {
                    "name": "Travel Booking",
                    "description": "Multi-provider travel booking (hotels, flights, activities, cars)",
                    "providers": ["Expedia", "Amadeus", "Viator", "Duffle", "RateHawk", "Sabre"],
                    "ai_enhancement": "Travel DNA-based recommendations"
                },
                {
                    "name": "Smart Dreams",
                    "description": "AI-powered travel planning and destination discovery",
                    "features": ["Travel DNA analysis", "Journey optimization", "Personalized recommendations"],
                    "ai_integration": "GPT-4o-mini via Emergent LLM Key"
                },
                {
                    "name": "NFT Rewards",
                    "description": "Blockchain-based travel rewards system",
                    "features": ["Travel experience NFTs", "Platform credits", "Tier progression"],
                    "blockchain": "Cronos network"
                },
                {
                    "name": "Airdrop System",
                    "description": "Token distribution based on travel activity",
                    "tiers": ["Wanderer", "Explorer", "Adventurer", "Legend"],
                    "multipliers": [1.0, 1.5, 2.0, 2.5]
                }
            ]
        },
        "user_journey_flows": {
            "new_user_flow": [
                "Browse platform features",
                "Explore Smart Dreams for inspiration",
                "Complete first booking",
                "Earn first NFT reward",
                "Advance to Explorer tier",
                "Unlock enhanced benefits"
            ],
            "power_user_flow": [
                "Check airdrop progress",
                "Review active quests",
                "Optimize multi-provider bookings",
                "Maximize tier advancement",
                "Access exclusive NFT collections"
            ]
        },
        "ai_integration_points": {
            "travel_dna": "Personality analysis for personalized recommendations",
            "smart_recommendations": "AI-powered destination and timing suggestions",
            "journey_optimization": "Multi-destination trip planning with cost/time optimization",
            "reward_optimization": "Strategic advice for maximizing rewards and tier progression"
        }
    }

async def generate_capability_analysis():
    """Analyze platform capabilities for external AI agents"""
    return {
        "technical_capabilities": {
            "api_endpoints": {
                "count": "50+",
                "categories": ["travel", "ai", "rewards", "admin"],
                "authentication": "Bearer token + API key",
                "rate_limits": "100 requests/minute standard"
            },
            "data_access": {
                "user_profiles": "Full travel and reward history",
                "booking_data": "Real-time booking status and history",
                "ai_insights": "Travel DNA and predictive analytics",
                "reward_data": "NFT collections and airdrop progress"
            },
            "real_time_features": {
                "live_updates": "WebSocket connections for dashboard sync",
                "notifications": "Cross-module notification system",
                "ai_processing": "Real-time AI assistance and insights"
            }
        },
        "business_logic": {
            "reward_calculation": {
                "base_rate": "10% of booking value in platform credits",
                "tier_multipliers": {"wanderer": 1.0, "explorer": 1.5, "adventurer": 2.0, "legend": 2.5},
                "provider_bonuses": {"expedia": "15%", "amadeus": "10%", "viator": "12%"},
                "nft_eligibility": "Bookings $500+ or special experiences"
            },
            "ai_personalization": {
                "travel_dna_factors": ["culture", "adventure", "luxury", "budget", "social"],
                "confidence_thresholds": "Minimum 70% confidence for recommendations",
                "learning_adaptation": "Continuous improvement based on user feedback"
            }
        },
        "integration_opportunities": {
            "external_ai_agents": [
                "Custom travel recommendations based on platform data",
                "Automated quest generation and completion tracking",
                "Cross-platform loyalty program integration",
                "Advanced analytics and predictive modeling"
            ],
            "webhook_events": [
                "booking_completed",
                "nft_minted", 
                "tier_advanced",
                "quest_completed",
                "ai_insight_generated"
            ]
        }
    }

# ============================================
# CONTEXT-AWARE AI ENDPOINTS
# ============================================

@unified_ai_router.post("/contextual-assistance")
async def provide_contextual_assistance(request: AIRequest, context: PlatformContext):
    """Provide AI assistance based on current module and user context"""
    try:
        # Initialize AI if needed
        if not await unified_ai_orchestrator.initialize_llm():
            raise HTTPException(status_code=503, detail="AI service unavailable")
        
        # Process with full context
        response = await unified_ai_orchestrator.process_unified_query(request, context)
        
        return {
            "response": response.response,
            "confidence": response.confidence,
            "context_used": response.context_used,
            "recommendations": response.recommendations,
            "cross_module_insights": response.cross_module_insights,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Contextual AI assistance failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@unified_ai_router.get("/cross-module-insights/{user_id}")
async def generate_cross_module_insights(user_id: str):
    """Generate insights that span multiple platform modules"""
    try:
        # Gather data from all modules
        user_data = await gather_unified_user_data(user_id)
        
        # Generate cross-module insights
        insights = []
        
        # Travel + Rewards optimization
        if user_data.get('booking_history') and user_data.get('rewards_data'):
            insights.extend(await generate_travel_rewards_insights(user_data))
        
        # Smart Dreams + AI recommendations
        if user_data.get('smart_dreams_data'):
            insights.extend(await generate_smart_dreams_ai_insights(user_data))
        
        # Provider + Tier optimization
        insights.extend(await generate_provider_tier_insights(user_data))
        
        return {
            "user_id": user_id,
            "insights": insights,
            "generated_at": datetime.now().isoformat(),
            "confidence_score": calculate_insights_confidence(insights)
        }
        
    except Exception as e:
        logger.error(f"Cross-module insights generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def gather_unified_user_data(user_id: str) -> Dict[str, Any]:
    """Gather user data from all platform modules"""
    try:
        # This would gather data from all modules
        # For now, return mock unified data structure
        return {
            "user_id": user_id,
            "booking_history": await get_user_booking_history(user_id),
            "rewards_data": await get_user_rewards_data(user_id),
            "smart_dreams_data": await get_user_smart_dreams_data(user_id),
            "ai_context": await get_user_ai_context(user_id),
            "engagement_data": await get_user_engagement_data(user_id)
        }
    except Exception as e:
        logger.error(f"Failed to gather unified user data: {e}")
        return {}

# Helper functions (mock implementations)
async def get_user_booking_history(user_id: str):
    return [{"provider": "expedia", "value": 1200, "type": "hotel"}]

async def get_user_rewards_data(user_id: str):
    return {"current_tier": "explorer", "total_points": 485, "nft_count": 3}

async def get_user_smart_dreams_data(user_id: str):
    return {"destinations": ["tokyo", "santorini"], "ai_usage": True}

async def get_user_ai_context(user_id: str):
    return {"travel_dna": {"type": "cultural_explorer", "confidence": 0.87}}

async def get_user_engagement_data(user_id: str):
    return {"daily_active": True, "feature_usage": ["smart-dreams", "nft", "booking"]}

def calculate_insights_confidence(insights: List[Dict]) -> float:
    return min(0.95, 0.6 + (len(insights) * 0.1))