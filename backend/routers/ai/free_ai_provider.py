# Free AI API Integration for Development Cost Reduction
# Uses Hugging Face Free APIs and OpenAI Free Tier instead of Emergent credits

import os
import httpx
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class FreeAIProvider:
    def __init__(self):
        self.environment = os.environ.get('ENVIRONMENT', 'development')
        self.use_free_ai = os.environ.get('USE_FREE_AI', 'true').lower() == 'true'
        self.development_mode = os.environ.get('DEVELOPMENT_MODE', 'true').lower() == 'true'
        
        # Free API configurations
        self.huggingface_token = os.environ.get('HUGGINGFACE_TOKEN', '')  # Free HF token
        self.openai_key = os.environ.get('OPENAI_FREE_KEY', '')  # Free OpenAI key
        
        # Free models to use
        self.free_models = {
            'chat': 'microsoft/DialoGPT-medium',
            'text_generation': 'gpt2',
            'conversational': 'facebook/blenderbot-400M-distill'
        }
        
        logger.info(f"🆓 FREE AI Provider initialized - Development mode: {self.development_mode}")

    async def get_travel_dna_response(self, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate travel DNA analysis using free APIs or intelligent mocks"""
        
        if self.development_mode:
            # FREE DEVELOPMENT: Use intelligent mock
            logger.info("🆓 Using FREE mock Travel DNA analysis (0 credits)")
            
            return {
                "travel_dna": {
                    "user_id": user_id,
                    "primary_type": "cultural_explorer",
                    "confidence_score": 0.87,
                    "personality_factors": [
                        {"factor": "culture", "weight": 0.9, "confidence": 0.92, "source": "free_analysis"},
                        {"factor": "photography", "weight": 0.8, "confidence": 0.85, "source": "free_analysis"},
                        {"factor": "food", "weight": 0.7, "confidence": 0.78, "source": "free_analysis"}
                    ],
                    "analysis_source": "free_development_api",
                    "cost": 0.0
                },
                "confidence_breakdown": {
                    "overall_confidence": 0.87
                },
                "development_note": "Using free mock analysis - no credits consumed"
            }
        else:
            # PRODUCTION: Use paid Emergent LLM Key
            return await self.use_emergent_api(user_id, preferences)

    async def get_recommendations_response(self, user_id: str, max_results: int = 3) -> Dict[str, Any]:
        """Generate travel recommendations using free APIs"""
        
        if self.development_mode:
            logger.info("🆓 Using FREE mock recommendations (0 credits)")
            
            # Simulate intelligent recommendations without AI costs
            mock_destinations = [
                {
                    "destination_id": "florence_italy",
                    "destination_name": "Florence, Italy", 
                    "country": "Italy",
                    "recommendation_score": 94,
                    "ai_insights": [{
                        "insight_text": "Perfect cultural destination with world-class art museums and Renaissance architecture",
                        "confidence": 0.91
                    }],
                    "optimal_timing": {
                        "best_months": [4, 5, 9, 10],
                        "price_optimal_window": {"savings_percentage": 25}
                    }
                },
                {
                    "destination_id": "kyoto_japan",
                    "destination_name": "Kyoto, Japan",
                    "country": "Japan", 
                    "recommendation_score": 92,
                    "ai_insights": [{
                        "insight_text": "Exceptional cultural immersion with traditional temples and authentic Japanese experiences",
                        "confidence": 0.89
                    }]
                }
            ]
            
            return {
                "recommendations": mock_destinations[:max_results],
                "total_recommendations": len(mock_destinations),
                "processing_metadata": {
                    "analysis_source": "free_development_mock",
                    "cost": 0.0,
                    "ai_model_version": "free_mock_v1"
                },
                "development_note": "Using free mock recommendations - no credits consumed"
            }
        else:
            return await self.use_emergent_recommendations(user_id, max_results)

    async def get_chat_response(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate chat response using free APIs"""
        
        if self.development_mode:
            # Try free alternatives first
            response = await self.try_free_apis(query, context)
            if response:
                return response
            
            # Fallback to intelligent mock
            logger.info("🆓 Using FREE intelligent mock chat (0 credits)")
            return self.generate_intelligent_mock_response(query, context)
        else:
            return await self.use_emergent_chat(query, context)

    async def try_free_apis(self, query: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Try free API alternatives in order"""
        
        # Option B: Try Hugging Face Free API
        if self.huggingface_token:
            try:
                hf_response = await self.huggingface_chat(query)
                if hf_response:
                    logger.info("🆓 SUCCESS: Using Hugging Face free API (0 credits)")
                    return {
                        "response": hf_response,
                        "source": "huggingface_free",
                        "cost": 0.0,
                        "confidence": 0.85
                    }
            except Exception as e:
                logger.warning(f"Hugging Face free API failed: {e}")
        
        # Option C: Try OpenAI Free Tier
        if self.openai_key:
            try:
                openai_response = await self.openai_free_chat(query)
                if openai_response:
                    logger.info("🆓 SUCCESS: Using OpenAI free tier (0 Emergent credits)")
                    return {
                        "response": openai_response,
                        "source": "openai_free",
                        "cost": 0.0,
                        "confidence": 0.9
                    }
            except Exception as e:
                logger.warning(f"OpenAI free tier failed: {e}")
        
        return None

    async def huggingface_chat(self, query: str) -> Optional[str]:
        """Call Hugging Face free inference API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api-inference.huggingface.co/models/{self.free_models['conversational']}",
                    headers={"Authorization": f"Bearer {self.huggingface_token}"},
                    json={
                        "inputs": f"Travel assistant helping with: {query[:100]}",
                        "parameters": {"max_length": 200, "temperature": 0.7}
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get('generated_text', '').strip()
                        
        except Exception as e:
            logger.error(f"Hugging Face API error: {e}")
        
        return None

    async def openai_free_chat(self, query: str) -> Optional[str]:
        """Call OpenAI free tier API"""
        try:
            import openai
            openai.api_key = self.openai_key
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Travel assistant. Helpful, concise responses."},
                    {"role": "user", "content": query[:150]}
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI free tier error: {e}")
            
        return None

    def generate_intelligent_mock_response(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate high-quality mock response without any API calls"""
        
        query_lower = query.lower()
        user_tier = context.get('current_tier', 'Explorer')
        reward_value = context.get('nft_count', 0) * 67
        
        # Travel DNA simulation
        if 'dna' in query_lower or 'personality' in query_lower:
            response = f"FREE DEVELOPMENT MODE: Simulating AI Travel DNA analysis...\n\nYour travel personality appears to be Cultural Explorer (87% confidence). Key traits:\n• Culture enthusiast (90% weight)\n• Photography lover (80% weight)\n• Food explorer (70% weight)\n\nRecommended destinations: Florence, Kyoto, Istanbul\nAs a {user_tier} member with ${reward_value} rewards, book through Expedia or Amadeus for maximum benefits."
        
        # Recommendations simulation  
        elif 'recommend' in query_lower or 'suggest' in query_lower:
            response = f"FREE DEVELOPMENT MODE: AI recommendation engine suggests...\n\nTop destination: Santorini, Greece (92% match)\nWhy it's perfect: Beautiful sunsets, cultural sites, photography opportunities\nBest timing: April-May or September-October\nWith your ${reward_value} rewards as {user_tier} member, estimated cost after discounts: $850\nProvider recommendation: Expedia (15% bonus) or Amadeus (10% bonus)"
        
        # Planning simulation
        elif 'plan' in query_lower or 'trip' in query_lower:
            response = f"FREE DEVELOPMENT MODE: AI trip planner activated...\n\nIntelligent itinerary suggestions:\n• Day 1-2: Cultural exploration\n• Day 3-4: Local experiences\n• Day 5: Photography and relaxation\n\nBudget optimization with your ${reward_value} rewards:\nOriginal cost: $1,200\nWith {user_tier} discounts: -$120\nUsing your rewards: -${reward_value}\nFinal cost: ${1200 - 120 - reward_value}"
        
        # Default helpful response
        else:
            response = f"FREE DEVELOPMENT MODE: I'm your development travel assistant (no credits used).\n\nI can help you with:\n🏨 Hotel bookings (mock Expedia/Amadeus integration)\n✈️ Flight searches (mock provider comparison)\n🎁 Reward optimization (your ${reward_value} available)\n📋 Trip planning (AI-style recommendations)\n\nAs a {user_tier} member, you get enhanced benefits. What would you like to explore?"
        
        return {
            "response": response,
            "source": "intelligent_mock",
            "cost": 0.0,
            "confidence": 0.85,
            "development_note": "No credits consumed - using free development mode"
        }

    async def use_emergent_api(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Use Emergent LLM Key for production (costs credits)"""
        logger.warning("💰 PRODUCTION MODE: Using Emergent credits")
        
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                return {"error": "Emergent LLM Key not configured"}
            
            chat = LlmChat(
                api_key=api_key,
                session_id=f"prod_{user_id}",
                system_message="Travel assistant. Concise responses."
            ).with_model("openai", "gpt-4o-mini")
            
            user_message = UserMessage(text=f"Analyze travel for user {user_id}")
            ai_response = await chat.send_message(user_message)
            
            logger.warning("💰 EMERGENT CREDITS USED for production call")
            
            return {
                "response": ai_response,
                "source": "emergent_paid",
                "cost": 0.2,
                "note": "Production mode - credits consumed"
            }
            
        except Exception as e:
            logger.error(f"Emergent API failed: {e}")
            return {"error": "Emergent API unavailable"}

# Global free AI provider instance
free_ai_provider = FreeAIProvider()