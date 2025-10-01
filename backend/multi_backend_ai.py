"""
Multi-Backend AI Assistant
Coordinates multiple AI providers with intelligent routing and fallback
"""

import asyncio
import json
import logging
import os
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import random

# Try to import different AI providers
try:
    from emergentintegrations import LLMProvider
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)

class AIProviderType(Enum):
    EMERGENT = "emergent"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    HUGGINGFACE = "huggingface"
    LOCAL = "local"

@dataclass
class AIRequest:
    prompt: str
    context: Dict[str, Any] = None
    system_prompt: str = None
    max_tokens: int = 2000
    temperature: float = 0.7
    model: str = None
    user_id: str = None
    session_id: str = None

@dataclass 
class AIResponse:
    provider: str
    model: str
    content: str
    success: bool = True
    error_message: str = None
    response_time_ms: int = 0
    tokens_used: int = 0
    cost_estimate: float = 0.0
    metadata: Dict[str, Any] = None

class AIProviderConfig:
    def __init__(self, provider_type: AIProviderType, api_key: str = "", model: str = "", 
                 is_free: bool = False, priority: int = 1, rate_limit: int = 60):
        self.provider_type = provider_type
        self.api_key = api_key
        self.model = model
        self.is_free = is_free
        self.priority = priority
        self.rate_limit = rate_limit
        self.is_available = self._check_availability()

    def _check_availability(self) -> bool:
        if self.provider_type == AIProviderType.EMERGENT:
            return EMERGENT_AVAILABLE and bool(self.api_key)
        elif self.provider_type == AIProviderType.OPENAI:
            return OPENAI_AVAILABLE and bool(self.api_key)
        elif self.provider_type == AIProviderType.HUGGINGFACE:
            return TRANSFORMERS_AVAILABLE
        else:
            return bool(self.api_key)

class MultiBackendAIAssistant:
    """Multi-backend AI assistant with intelligent provider routing"""
    
    def __init__(self):
        self.providers: Dict[str, AIProviderConfig] = {}
        self.usage_stats: Dict[str, Dict[str, Any]] = {}
        self.fallback_responses = self._load_fallback_responses()
        self._initialize_providers()

    def _initialize_providers(self):
        """Initialize all available AI providers"""
        
        # Emergent provider (unified access to multiple LLMs)
        emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if emergent_key:
            self.providers["emergent_gpt4"] = AIProviderConfig(
                provider_type=AIProviderType.EMERGENT,
                api_key=emergent_key,
                model="gpt-4o-mini",
                is_free=False,
                priority=1
            )
        
        # OpenAI direct access
        openai_key = os.environ.get("OPENAI_API_KEY", "")
        if openai_key:
            self.providers["openai_gpt4"] = AIProviderConfig(
                provider_type=AIProviderType.OPENAI,
                api_key=openai_key,
                model="gpt-4o-mini",
                is_free=False,
                priority=2
            )
        
        # Hugging Face free models
        self.providers["huggingface_free"] = AIProviderConfig(
            provider_type=AIProviderType.HUGGINGFACE,
            model="microsoft/DialoGPT-medium",
            is_free=True,
            priority=3
        )
        
        # Local fallback (rule-based responses)
        self.providers["local_fallback"] = AIProviderConfig(
            provider_type=AIProviderType.LOCAL,
            model="rule_based",
            is_free=True,
            priority=10
        )

        # Initialize usage stats
        for provider_id in self.providers.keys():
            self.usage_stats[provider_id] = {
                "requests": 0,
                "successes": 0,
                "failures": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "avg_response_time": 0.0
            }

    def _load_fallback_responses(self) -> Dict[str, List[str]]:
        """Load fallback responses for when AI providers are unavailable"""
        return {
            "greeting": [
                "Hello! I'm your Maku travel assistant. How can I help you plan your next adventure?",
                "Hi there! Ready to explore the world with Maku? What destination are you dreaming of?",
                "Welcome to Maku Travel! I'm here to help you discover amazing travel experiences."
            ],
            "hotel_search": [
                "I'll help you find the perfect hotel! Let me search our partner networks for the best options.",
                "Great choice! I'm checking our hotel providers for availability and great deals.",
                "Searching for hotels... Our AI is analyzing thousands of options to find you the best matches."
            ],
            "flight_search": [
                "Let me find you the best flight options! Searching across multiple airlines...",
                "Looking for flights... I'm comparing prices and schedules from our travel partners.",
                "Flight search initiated! I'll find you the most convenient and affordable options."
            ],
            "activity_search": [
                "Exciting! Let me find amazing activities and experiences for your trip.",
                "I'm searching for the best activities and tours at your destination...",
                "Great idea! I'll find unique experiences that match your interests."
            ],
            "travel_advice": [
                "Based on our travel expertise, here are some recommendations for your trip...",
                "Let me share some insider travel tips and suggestions...",
                "Here's what our travel AI recommends for an amazing experience..."
            ],
            "error": [
                "I'm currently experiencing some technical difficulties. Please try again in a moment.",
                "My AI systems are temporarily unavailable. I'll get back to you shortly!",
                "I'm having trouble connecting to my knowledge base. Please refresh and try again."
            ]
        }

    def _get_available_providers(self, prefer_free: bool = False) -> List[str]:
        """Get list of available providers, optionally preferring free ones"""
        available = []
        for provider_id, config in self.providers.items():
            if config.is_available:
                available.append(provider_id)
        
        # Sort by priority and free preference
        available.sort(key=lambda p: (
            self.providers[p].priority,
            not (self.providers[p].is_free and prefer_free)
        ))
        
        return available

    async def generate_response(self, request: AIRequest, prefer_free: bool = None) -> AIResponse:
        """Generate AI response with provider fallback"""
        
        # Determine if we should prefer free providers
        if prefer_free is None:
            prefer_free = os.environ.get("USE_FREE_AI", "false").lower() == "true"
        
        providers = self._get_available_providers(prefer_free)
        
        for provider_id in providers:
            try:
                response = await self._generate_with_provider(provider_id, request)
                if response.success:
                    self._update_usage_stats(provider_id, response, success=True)
                    return response
            except Exception as e:
                logger.warning(f"Provider {provider_id} failed: {e}")
                self._update_usage_stats(provider_id, None, success=False)
                continue
        
        # All providers failed - return fallback response
        return self._generate_fallback_response(request)

    async def _generate_with_provider(self, provider_id: str, request: AIRequest) -> AIResponse:
        """Generate response using specific provider"""
        start_time = datetime.utcnow()
        config = self.providers[provider_id]
        
        if config.provider_type == AIProviderType.EMERGENT:
            return await self._generate_emergent(config, request, start_time)
        elif config.provider_type == AIProviderType.OPENAI:
            return await self._generate_openai(config, request, start_time)
        elif config.provider_type == AIProviderType.HUGGINGFACE:
            return await self._generate_huggingface(config, request, start_time)
        elif config.provider_type == AIProviderType.LOCAL:
            return await self._generate_local_fallback(config, request, start_time)
        else:
            raise Exception(f"Unsupported provider type: {config.provider_type}")

    async def _generate_emergent(self, config: AIProviderConfig, request: AIRequest, start_time: datetime) -> AIResponse:
        """Generate response using Emergent LLM service"""
        if not EMERGENT_AVAILABLE:
            raise Exception("Emergent integrations not available")
        
        try:
            llm = LLMProvider(api_key=config.api_key)
            
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            messages.append({"role": "user", "content": request.prompt})
            
            response = llm.complete(
                model=config.model,
                messages=messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature
            )
            
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return AIResponse(
                provider="emergent",
                model=config.model,
                content=response["choices"][0]["message"]["content"],
                success=True,
                response_time_ms=response_time,
                tokens_used=response.get("usage", {}).get("total_tokens", 0),
                cost_estimate=response.get("cost_estimate", 0.0)
            )
            
        except Exception as e:
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            return AIResponse(
                provider="emergent",
                model=config.model,
                content="",
                success=False,
                error_message=str(e),
                response_time_ms=response_time
            )

    async def _generate_openai(self, config: AIProviderConfig, request: AIRequest, start_time: datetime) -> AIResponse:
        """Generate response using OpenAI API"""
        if not OPENAI_AVAILABLE:
            raise Exception("OpenAI not available")
        
        try:
            client = openai.OpenAI(api_key=config.api_key)
            
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            messages.append({"role": "user", "content": request.prompt})
            
            response = client.chat.completions.create(
                model=config.model,
                messages=messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature
            )
            
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return AIResponse(
                provider="openai",
                model=config.model,
                content=response.choices[0].message.content,
                success=True,
                response_time_ms=response_time,
                tokens_used=response.usage.total_tokens,
                cost_estimate=self._estimate_openai_cost(response.usage.total_tokens, config.model)
            )
            
        except Exception as e:
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            return AIResponse(
                provider="openai", 
                model=config.model,
                content="",
                success=False,
                error_message=str(e),
                response_time_ms=response_time
            )

    async def _generate_huggingface(self, config: AIProviderConfig, request: AIRequest, start_time: datetime) -> AIResponse:
        """Generate response using Hugging Face transformers (free)"""
        if not TRANSFORMERS_AVAILABLE:
            raise Exception("Transformers not available")
        
        try:
            # Use a simple conversational model
            generator = pipeline("text-generation", model="microsoft/DialoGPT-medium")
            
            # Simple text generation
            prompt_text = request.prompt
            if len(prompt_text) > 500:
                prompt_text = prompt_text[:500]  # Truncate for free models
            
            result = generator(
                prompt_text,
                max_length=min(request.max_tokens, 200),  # Limit for free model
                temperature=request.temperature,
                do_sample=True,
                pad_token_id=generator.tokenizer.eos_token_id
            )
            
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            generated_text = result[0]['generated_text']
            # Remove the prompt from the generated text
            if generated_text.startswith(prompt_text):
                generated_text = generated_text[len(prompt_text):].strip()
            
            return AIResponse(
                provider="huggingface",
                model=config.model,
                content=generated_text or "I'm still learning. Could you rephrase your question?",
                success=True,
                response_time_ms=response_time,
                tokens_used=len(generated_text.split()),
                cost_estimate=0.0  # Free
            )
            
        except Exception as e:
            response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            return AIResponse(
                provider="huggingface",
                model=config.model,
                content="",
                success=False,
                error_message=str(e),
                response_time_ms=response_time
            )

    async def _generate_local_fallback(self, config: AIProviderConfig, request: AIRequest, start_time: datetime) -> AIResponse:
        """Generate response using local rule-based fallback"""
        response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Simple keyword-based response selection
        prompt_lower = request.prompt.lower()
        
        if any(word in prompt_lower for word in ["hello", "hi", "hey", "start"]):
            responses = self.fallback_responses["greeting"]
        elif any(word in prompt_lower for word in ["hotel", "stay", "accommodation"]):
            responses = self.fallback_responses["hotel_search"]
        elif any(word in prompt_lower for word in ["flight", "fly", "airline"]):
            responses = self.fallback_responses["flight_search"]
        elif any(word in prompt_lower for word in ["activity", "tour", "experience", "things to do"]):
            responses = self.fallback_responses["activity_search"]
        elif any(word in prompt_lower for word in ["advice", "tip", "recommend", "suggest"]):
            responses = self.fallback_responses["travel_advice"]
        else:
            # Generic travel assistant response
            responses = [
                f"I understand you're asking about travel planning. While my AI systems are optimizing, I can still help you search for hotels, flights, and activities through our partner networks.",
                f"Thanks for your question! I'm currently running in offline mode, but I can still assist you with finding great travel deals and experiences.",
                f"I'm here to help with your travel needs! Let me connect you with our booking partners to find the best options for your trip."
            ]
        
        selected_response = random.choice(responses)
        
        return AIResponse(
            provider="local",
            model=config.model,
            content=selected_response,
            success=True,
            response_time_ms=response_time,
            tokens_used=len(selected_response.split()),
            cost_estimate=0.0,
            metadata={"fallback_mode": True}
        )

    def _generate_fallback_response(self, request: AIRequest) -> AIResponse:
        """Generate fallback response when all providers fail"""
        error_responses = self.fallback_responses["error"]
        selected_response = random.choice(error_responses)
        
        return AIResponse(
            provider="fallback",
            model="rule_based",
            content=selected_response,
            success=True,
            response_time_ms=100,
            tokens_used=0,
            cost_estimate=0.0,
            metadata={"all_providers_failed": True}
        )

    def _estimate_openai_cost(self, total_tokens: int, model: str) -> float:
        """Estimate OpenAI API cost"""
        # Rough cost estimates (as of 2024)
        cost_per_1k = {
            "gpt-4": 0.06,
            "gpt-4o-mini": 0.0015,
            "gpt-3.5-turbo": 0.002
        }
        
        rate = cost_per_1k.get(model, 0.002)  # Default to GPT-3.5 rate
        return (total_tokens / 1000) * rate

    def _update_usage_stats(self, provider_id: str, response: AIResponse = None, success: bool = True):
        """Update usage statistics for provider"""
        stats = self.usage_stats[provider_id]
        stats["requests"] += 1
        
        if success and response:
            stats["successes"] += 1
            stats["total_tokens"] += response.tokens_used
            stats["total_cost"] += response.cost_estimate
            
            # Update average response time
            if stats["avg_response_time"] == 0:
                stats["avg_response_time"] = response.response_time_ms
            else:
                stats["avg_response_time"] = (stats["avg_response_time"] * 0.8) + (response.response_time_ms * 0.2)
        else:
            stats["failures"] += 1

    async def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all AI providers"""
        status = {}
        
        for provider_id, config in self.providers.items():
            stats = self.usage_stats[provider_id]
            total_requests = stats["requests"]
            
            status[provider_id] = {
                "provider_type": config.provider_type.value,
                "model": config.model,
                "is_available": config.is_available,
                "is_free": config.is_free,
                "priority": config.priority,
                "total_requests": total_requests,
                "success_rate": stats["successes"] / total_requests if total_requests > 0 else 0,
                "avg_response_time_ms": round(stats["avg_response_time"], 2),
                "total_tokens_used": stats["total_tokens"],
                "total_cost_usd": round(stats["total_cost"], 4)
            }
        
        return status

    async def optimize_costs(self) -> Dict[str, Any]:
        """Analyze and suggest cost optimizations"""
        status = await self.get_provider_status()
        
        total_cost = sum(provider["total_cost_usd"] for provider in status.values())
        total_requests = sum(provider["total_requests"] for provider in status.values())
        
        # Calculate potential savings by using more free providers
        free_providers = [pid for pid, config in self.providers.items() if config.is_free]
        paid_providers = [pid for pid, config in self.providers.items() if not config.is_free]
        
        recommendations = []
        
        if free_providers and paid_providers:
            free_success_rate = sum(status[pid]["success_rate"] for pid in free_providers if pid in status) / len(free_providers)
            paid_success_rate = sum(status[pid]["success_rate"] for pid in paid_providers if pid in status) / len(paid_providers)
            
            if free_success_rate > 0.7:  # If free providers work well
                recommendations.append("Consider using free providers more frequently to reduce costs")
        
        return {
            "total_cost_usd": round(total_cost, 4),
            "total_requests": total_requests,
            "cost_per_request": round(total_cost / total_requests, 6) if total_requests > 0 else 0,
            "recommendations": recommendations,
            "provider_breakdown": status
        }

# Global assistant instance
assistant = MultiBackendAIAssistant()

async def get_ai_assistant() -> MultiBackendAIAssistant:
    """Get the global AI assistant instance"""
    return assistant