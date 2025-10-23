"""
OpenAI ChatGPT Pro Integration Service
Supports GPT-4o, o1, o3, GPT-5 series
"""

import os
from typing import Optional, List, Dict, Any
import uuid
import json
from datetime import datetime
import logging

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:
    raise ImportError(
        "emergentintegrations not installed. Run: "
        "pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/"
    )

logger = logging.getLogger(__name__)

class OpenAIService:
    """Enhanced OpenAI integration for Maku.Travel"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.default_model = os.getenv('OPENAI_MODEL', 'gpt-4o')
        self.temperature = float(os.getenv('OPENAI_TEMPERATURE', '0.7'))
        self.max_tokens = int(os.getenv('OPENAI_MAX_TOKENS', '4000'))
        
        if not self.api_key:
            logger.warning("OPENAI_API_KEY not configured in .env")
            self.enabled = False
        else:
            self.enabled = True
            logger.info(f"OpenAI Service initialized with model: {self.default_model}")
    
    def create_chat_session(
        self, 
        system_message: str,
        model: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> LlmChat:
        """
        Create new chat session
        
        Args:
            system_message: System prompt for the AI
            model: Model to use (default: from .env)
            session_id: Unique session ID (auto-generated if None)
        
        Returns:
            LlmChat instance
        """
        if not self.enabled:
            raise ValueError("OpenAI service not enabled. Add OPENAI_API_KEY to .env")
        
        if session_id is None:
            session_id = str(uuid.uuid4())
        
        model = model or self.default_model
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", model)
        
        return chat
    
    async def smart_dreams_analysis(
        self,
        user_input: str,
        user_context: Dict[str, Any],
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Smart Dreams AI-powered trip planning
        Uses GPT-4o for balanced quality + speed
        """
        if not self.enabled:
            return {"error": "OpenAI service not configured"}
        
        model = os.getenv('SMART_DREAMS_MODEL', 'gpt-4o')
        
        system_message = f"""
You are Maku Travel's Smart Dreams AI assistant specializing in personalized trip planning.

User Context:
- Travel DNA: {user_context.get('travel_dna', 'Unknown')}
- Budget: ${user_context.get('budget', 'Not specified')}
- Interests: {', '.join(user_context.get('interests', ['general travel']))}
- NFT Tier: {user_context.get('nft_tier', 'Bronze')} ({user_context.get('cashback_rate', '1')}% cashback)

Your role:
1. Understand user's travel dreams and preferences
2. Suggest destinations matching their personality
3. Provide budget breakdowns with cashback calculations
4. Offer activity recommendations
5. Explain why each suggestion fits their travel DNA

Be conversational, enthusiastic, and detail-oriented.
"""
        
        try:
            chat = self.create_chat_session(system_message, model)
            user_message = UserMessage(text=user_input)
            response = await chat.send_message(user_message)
            
            return {
                "response": response,
                "model_used": model,
                "session_id": chat.session_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Smart Dreams error: {e}")
            return {"error": str(e)}
    
    async def travel_dna_analysis(
        self,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deep Travel DNA analysis using o1 for reasoning
        """
        if not self.enabled:
            return {"error": "OpenAI service not configured"}
        
        model = os.getenv('TRAVEL_DNA_MODEL', 'o1')
        
        system_message = """
You are a travel psychologist analyzing user personality to create their Travel DNA profile.

Analyze:
1. Travel style (adventurer, luxury, budget, culture)
2. Personality traits (spontaneous vs planner, solo vs social)
3. Preferences (beach, mountains, cities, nature)
4. Budget consciousness (splurge, moderate, frugal)
5. Experience level (first-timer, experienced, expert)

Provide:
- Overall DNA category (e.g., "Urban Explorer", "Beach Seeker")
- Confidence score (0-100%)
- Key personality factors
- Recommended destinations
- Travel tips

Be insightful and data-driven.
"""
        
        try:
            chat = self.create_chat_session(system_message, model)
            
            analysis_prompt = f"""
Analyze this traveler's DNA:

Booking History: {json.dumps(user_data.get('bookings', []), indent=2)}
Search Patterns: {json.dumps(user_data.get('searches', []), indent=2)}
Preferences: {json.dumps(user_data.get('preferences', {}), indent=2)}
Budget Range: ${user_data.get('min_budget', 0)} - ${user_data.get('max_budget', 10000)}

Provide comprehensive Travel DNA analysis in JSON format.
"""
            
            user_message = UserMessage(text=analysis_prompt)
            response = await chat.send_message(user_message)
            
            # Try to parse JSON response
            try:
                dna_data = json.loads(response)
            except:
                dna_data = {"raw_analysis": response}
            
            return {
                "dna_profile": dna_data,
                "model_used": model,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Travel DNA error: {e}")
            return {"error": str(e)}

# Singleton instance
openai_service = OpenAIService()
