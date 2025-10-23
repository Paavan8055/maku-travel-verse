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
        conversation_history: Optional[List[Dict]] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Smart Dreams AI-powered trip planning
        Uses GPT-4o for balanced quality + speed
        """
        if not self.enabled:
            return {"error": "OpenAI service not configured"}
        
        # Use specified model or get from env
        model = model or os.getenv('SMART_DREAMS_MODEL', 'gpt-4o')
        
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
            
    
    async def get_recommendations(
        self,
        user_id: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Fast destination recommendations
        Uses GPT-4o-mini for cost-effective speed
        """
        if not self.enabled:
            return {"error": "OpenAI service not configured"}
        
        model = os.getenv('RECOMMENDATIONS_MODEL', 'gpt-4o-mini')
        
        system_message = """
You provide quick, relevant travel destination recommendations.

Output JSON array of 5 destinations:
[
  {
    "destination": "city, country",
    "match_score": 0-100,
    "reason": "why it matches",
    "estimated_cost": "budget range",
    "best_time": "season"
  }
]
"""
        
        try:
            chat = self.create_chat_session(system_message, model)
            
            prompt = f"""
Recommend destinations for:
- Budget: ${context.get('budget', 2000)}
- Interests: {', '.join(context.get('interests', ['general']))}
- Duration: {context.get('duration', '7')} days
- Travel style: {context.get('travel_style', 'balanced')}
"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            try:
                recommendations = json.loads(response)
            except:
                recommendations = []
            
            return {
                "recommendations": recommendations,
                "model_used": model,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Recommendations error: {e}")
            return {"error": str(e)}
    
    async def optimize_journey(
        self,
        destination: str,
        duration_days: int,
        budget: float,
        interests: List[str]
    ) -> Dict[str, Any]:
        """
        Complex journey optimization
        Uses o1 for deep reasoning about itinerary
        """
        if not self.enabled:
            return {"error": "OpenAI service not configured"}
        
        model = os.getenv('JOURNEY_OPTIMIZER_MODEL', 'o1')
        
        system_message = """
You are an expert travel planner optimizing multi-day itineraries.

Optimize for:
1. Logical flow (minimize backtracking)
2. Budget allocation (accommodation, food, activities)
3. Time management (avoid over-scheduling)
4. Interest matching
5. Local insights

Provide day-by-day itinerary with:
- Morning/afternoon/evening activities
- Transportation between locations
- Cost breakdown per day
- Pro tips for each location
"""
        
        try:
            chat = self.create_chat_session(system_message, model)
            
            prompt = f"""
Optimize {duration_days}-day itinerary for {destination}:

Budget: ${budget}
Interests: {', '.join(interests)}

Provide JSON:
{{
  "daily_plan": [
    {{
      "day": 1,
      "morning": {{"activity": "", "cost": 0}},
      "afternoon": {{"activity": "", "cost": 0}},
      "evening": {{"activity": "", "cost": 0}},
      "accommodation": {{"name": "", "cost": 0}},
      "daily_total": 0
    }}
  ],
  "total_cost": 0,
  "savings_tips": [],
  "must_book_advance": []
}}
"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            try:
                journey_plan = json.loads(response)
            except:
                journey_plan = {"raw_plan": response}
            
            return {
                "journey_plan": journey_plan,
                "model_used": model,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Journey optimization error: {e}")
            return {"error": str(e)}
    
    async def customer_support_chat(
        self,
        user_message: str,
        conversation_history: List[Dict],
        user_context: Dict[str, Any]
    ) -> str:
        """
        Conversational customer support
        Uses GPT-4o for natural dialogue
        """
        if not self.enabled:
            return "Customer support AI is currently unavailable."
        
        model = os.getenv('CUSTOMER_SUPPORT_MODEL', 'gpt-4o')
        
        system_message = f"""
You are Maku Travel's customer support assistant.

User Info:
- User ID: {user_context.get('user_id', 'guest')}
- NFT Tier: {user_context.get('nft_tier', 'Bronze')}
- Active Bookings: {user_context.get('active_bookings', 0)}
- Wallet Balance: ${user_context.get('wallet_balance', 0)}

You can help with:
1. Booking questions
2. Cashback inquiries
3. NFT membership info
4. Travel recommendations
5. Platform navigation
6. Technical issues

Be friendly, helpful, and professional.
Always offer to escalate to human support if needed.
"""
        
        try:
            session_id = user_context.get('session_id', str(uuid.uuid4()))
            chat = self.create_chat_session(system_message, model, session_id)
            
            user_msg = UserMessage(text=user_message)
            response = await chat.send_message(user_msg)
            
            return response
        except Exception as e:
            logger.error(f"Customer support error: {e}")
            return f"I apologize, but I'm experiencing technical difficulties. Please try again or contact support@maku.travel for immediate assistance."

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
