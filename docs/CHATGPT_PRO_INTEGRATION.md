# ChatGPT Pro Integration Guide for Maku.Travel
**Updated:** January 2025
**Models Available:** GPT-4o, GPT-4.5-preview, o1, o1-pro, o3, o3-mini, GPT-5 series

## 🎯 Overview

This guide integrates OpenAI's latest ChatGPT Pro models into Maku.Travel to enhance:
- **Smart Dreams AI** - More intelligent trip planning
- **Travel DNA Analysis** - Deeper personality insights
- **Recommendations** - Better destination matching
- **Journey Optimization** - Advanced itinerary planning
- **Customer Support** - Conversational travel assistant

**Current State:** Using GPT-4o-mini via Emergent LLM Key
**Upgrade To:** Direct OpenAI API with latest models (GPT-4o, o1, GPT-5)

---

## 📋 Prerequisites

### 1. Get OpenAI API Key

Since admin has ChatGPT Pro access:

**Option A: Use Existing OpenAI Account**
1. Visit: https://platform.openai.com/api-keys
2. Log in with your ChatGPT Pro account
3. Click "Create new secret key"
4. Name: "Maku Travel Production"
5. Copy the key (starts with `sk-proj-...` or `sk-...`)
6. **CRITICAL:** Save it securely (shown only once)

**Option B: New API Account**
1. Visit: https://platform.openai.com/signup
2. Create account (can use same email as ChatGPT Pro)
3. Add payment method
4. Create API key

**Pricing (Pay-as-you-go):**
- GPT-4o: $2.50 per 1M input tokens, $10 per 1M output tokens
- GPT-4o-mini: $0.150 per 1M input tokens, $0.600 per 1M output tokens
- o1: $15 per 1M input tokens, $60 per 1M output tokens
- GPT-5 (when available): TBD

**Estimated Monthly Cost:**
- Light usage (1K conversations): $10-30
- Medium usage (10K conversations): $100-300
- Heavy usage (100K conversations): $500-1500

### 2. Choose Models

**Recommendation for Maku.Travel:**

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| **Smart Dreams** | GPT-4o | Best balance of quality + speed + cost |
| **Travel DNA** | o1 | Deep reasoning for personality analysis |
| **Recommendations** | GPT-4o-mini | Fast, cheap, good quality |
| **Customer Support** | GPT-4o | Natural conversation, multimodal |
| **Journey Optimization** | o1 | Complex planning requires reasoning |
| **Content Generation** | GPT-4.5-preview | Creative writing for blogs |

---

## 🔧 Implementation

### Step 1: Install Dependencies (5 minutes)

```bash
cd /app/backend

# Install emergentintegrations library
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Add to requirements.txt
echo "emergentintegrations" >> requirements.txt
```

### Step 2: Configure Environment (2 minutes)

Add to `/app/backend/.env`:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o  # or o1, gpt-4.5-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=4000

# Optional: Different models for different features
SMART_DREAMS_MODEL=gpt-4o
TRAVEL_DNA_MODEL=o1
RECOMMENDATIONS_MODEL=gpt-4o-mini
CUSTOMER_SUPPORT_MODEL=gpt-4o
```

### Step 3: Create OpenAI Service (15 minutes)

File: `/app/backend/openai_service.py`

```python
"""
OpenAI ChatGPT Pro Integration Service
Supports GPT-4o, o1, GPT-5 series
"""

import os
from typing import Optional, List, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
import uuid
import json
from datetime import datetime

class OpenAIService:
    """Enhanced OpenAI integration for Maku.Travel"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.default_model = os.getenv('OPENAI_MODEL', 'gpt-4o')
        self.temperature = float(os.getenv('OPENAI_TEMPERATURE', '0.7'))
        self.max_tokens = int(os.getenv('OPENAI_MAX_TOKENS', '4000'))
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not configured in .env")
    
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
        
        chat = self.create_chat_session(system_message, model)
        
        # Add conversation history if provided
        if conversation_history:
            # Note: You'll need to manage history in your database
            pass
        
        user_message = UserMessage(text=user_input)
        response = await chat.send_message(user_message)
        
        return {
            "response": response,
            "model_used": model,
            "session_id": chat.session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def travel_dna_analysis(
        self,
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deep Travel DNA analysis using o1 for reasoning
        Uses o1 for complex personality analysis
        """
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
        
        chat = self.create_chat_session(system_message, model)
        
        analysis_prompt = f"""
Analyze this traveler's DNA:

Booking History: {json.dumps(user_data.get('bookings', []), indent=2)}
Search Patterns: {json.dumps(user_data.get('searches', []), indent=2)}
Preferences: {json.dumps(user_data.get('preferences', {}), indent=2)}
Budget Range: ${user_data.get('min_budget', 0)} - ${user_data.get('max_budget', 10000)}

Provide comprehensive Travel DNA analysis in JSON format:
{{
  "dna_type": "category name",
  "confidence": 0-100,
  "traits": ["trait1", "trait2"],
  "recommendations": ["destination1", "destination2"],
  "insights": "detailed analysis"
}}
"""
        
        user_message = UserMessage(text=analysis_prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            dna_data = json.loads(response)
        except:
            # Fallback if not JSON
            dna_data = {"raw_analysis": response}
        
        return {
            "dna_profile": dna_data,
            "model_used": model,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_recommendations(
        self,
        user_id: str,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Fast destination recommendations
        Uses GPT-4o-mini for cost-effective speed
        """
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
        
        session_id = user_context.get('session_id', str(uuid.uuid4()))
        chat = self.create_chat_session(system_message, model, session_id)
        
        # TODO: Load conversation history from database
        
        user_msg = UserMessage(text=user_message)
        response = await chat.send_message(user_msg)
        
        return response

# Singleton instance
openai_service = OpenAIService()
```

### Step 4: Create API Endpoints (20 minutes)

File: `/app/backend/openai_endpoints.py`

```python
"""
API Endpoints for ChatGPT Pro Integration
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from openai_service import openai_service
import logging

logger = logging.getLogger(__name__)

openai_router = APIRouter(prefix="/api/ai-pro", tags=["OpenAI ChatGPT Pro"])

# Pydantic Models
class SmartDreamsRequest(BaseModel):
    user_input: str = Field(..., description="User's travel query")
    user_id: str
    context: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[Dict]] = None

class TravelDNARequest(BaseModel):
    user_id: str
    bookings: List[Dict] = []
    searches: List[Dict] = []
    preferences: Dict[str, Any] = {}
    budget_range: Dict[str, float] = {"min": 0, "max": 10000}

class RecommendationsRequest(BaseModel):
    user_id: str
    budget: Optional[float] = 2000
    interests: List[str] = []
    duration: Optional[int] = 7
    travel_style: Optional[str] = "balanced"

class JourneyOptimizationRequest(BaseModel):
    destination: str
    duration_days: int
    budget: float
    interests: List[str]

class CustomerSupportRequest(BaseModel):
    user_id: str
    message: str
    conversation_history: List[Dict] = []
    user_context: Dict[str, Any] = {}

# Endpoints
@openai_router.post("/smart-dreams")
async def smart_dreams_chat(
    request: SmartDreamsRequest
):
    """
    Smart Dreams AI-powered trip planning with GPT-4o
    """
    try:
        result = await openai_service.smart_dreams_analysis(
            user_input=request.user_input,
            user_context=request.context or {},
            conversation_history=request.conversation_history
        )
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Smart Dreams error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/travel-dna")
async def analyze_travel_dna(
    request: TravelDNARequest
):
    """
    Deep Travel DNA analysis using o1 reasoning
    """
    try:
        user_data = {
            "user_id": request.user_id,
            "bookings": request.bookings,
            "searches": request.searches,
            "preferences": request.preferences,
            "min_budget": request.budget_range.get("min", 0),
            "max_budget": request.budget_range.get("max", 10000)
        }
        
        result = await openai_service.travel_dna_analysis(user_data)
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Travel DNA error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/recommendations")
async def get_recommendations(
    request: RecommendationsRequest
):
    """
    Fast recommendations using GPT-4o-mini
    """
    try:
        context = {
            "budget": request.budget,
            "interests": request.interests,
            "duration": request.duration,
            "travel_style": request.travel_style
        }
        
        result = await openai_service.get_recommendations(
            user_id=request.user_id,
            context=context
        )
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/journey-optimization")
async def optimize_journey(
    request: JourneyOptimizationRequest
):
    """
    Complex journey optimization using o1
    """
    try:
        result = await openai_service.optimize_journey(
            destination=request.destination,
            duration_days=request.duration_days,
            budget=request.budget,
            interests=request.interests
        )
        
        return {
            "success": True,
            **result
        }
        
    except Exception as e:
        logger.error(f"Journey optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.post("/customer-support")
async def customer_support_chat(
    request: CustomerSupportRequest
):
    """
    Customer support chat with GPT-4o
    """
    try:
        response = await openai_service.customer_support_chat(
            user_message=request.message,
            conversation_history=request.conversation_history,
            user_context=request.user_context
        )
        
        return {
            "success": True,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Customer support error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@openai_router.get("/health")
async def health_check():
    """
    Check OpenAI integration health
    """
    return {
        "status": "healthy",
        "service": "OpenAI ChatGPT Pro",
        "default_model": openai_service.default_model,
        "api_key_configured": bool(openai_service.api_key)
    }
```

### Step 5: Register Router in Server (2 minutes)

Edit `/app/backend/server.py`:

```python
# Add import at top
from openai_endpoints import openai_router

# Register router (add with other routers)
app.include_router(openai_router)
```

### Step 6: Restart Backend (1 minute)

```bash
sudo supervisorctl restart backend

# Verify
sudo supervisorctl status backend
# Should show: backend    RUNNING
```

---

## 🧪 Testing

### Test 1: Health Check
```bash
curl https://dream-marketplace.preview.emergentagent.com/api/ai-pro/health

# Expected:
{
  "status": "healthy",
  "service": "OpenAI ChatGPT Pro",
  "default_model": "gpt-4o",
  "api_key_configured": true
}
```

### Test 2: Smart Dreams
```bash
curl -X POST https://dream-marketplace.preview.emergentagent.com/api/ai-pro/smart-dreams \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "I want to plan a beach vacation for 7 days under $2000",
    "user_id": "test_user_123",
    "context": {
      "travel_dna": "Beach Seeker",
      "budget": 2000,
      "interests": ["beach", "relaxation", "snorkeling"],
      "nft_tier": "Gold",
      "cashback_rate": "6"
    }
  }'
```

### Test 3: Travel DNA
```bash
curl -X POST https://dream-marketplace.preview.emergentagent.com/api/ai-pro/travel-dna \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "bookings": [
      {"destination": "Bali", "type": "beach", "budget": 1500},
      {"destination": "Tokyo", "type": "city", "budget": 2500}
    ],
    "searches": [
      {"destination": "Maldives", "date": "2024-06-01"},
      {"destination": "Paris", "date": "2024-08-15"}
    ],
    "preferences": {
      "accommodation": "hotel",
      "activities": ["beach", "culture", "food"]
    }
  }'
```

---

## 🎨 Frontend Integration

### Update Smart Dreams Component

File: `/app/frontend/src/services/openai-api.ts`

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_URL || '';

export interface SmartDreamsRequest {
  user_input: string;
  user_id: string;
  context?: Record<string, any>;
  conversation_history?: Array<any>;
}

export interface SmartDreamsResponse {
  success: boolean;
  response: string;
  model_used: string;
  session_id: string;
  timestamp: string;
}

export const smartDreamsChat = async (
  request: SmartDreamsRequest
): Promise<SmartDreamsResponse> => {
  const response = await axios.post(
    `${API_BASE}/api/ai-pro/smart-dreams`,
    request
  );
  return response.data;
};

export const analyzeTravelDNA = async (
  userId: string,
  userData: any
) => {
  const response = await axios.post(
    `${API_BASE}/api/ai-pro/travel-dna`,
    {
      user_id: userId,
      ...userData
    }
  );
  return response.data;
};

export const getRecommendations = async (
  userId: string,
  context: any
) => {
  const response = await axios.post(
    `${API_BASE}/api/ai-pro/recommendations`,
    {
      user_id: userId,
      ...context
    }
  );
  return response.data;
};
```

---

## 💰 Cost Optimization

### 1. Model Selection Strategy

```python
# In openai_service.py, add:

def get_optimal_model(task_complexity: str) -> str:
    """
    Choose model based on task complexity
    """
    if task_complexity == 'simple':  # Quick recommendations
        return 'gpt-4o-mini'  # Cheapest
    elif task_complexity == 'moderate':  # Smart Dreams
        return 'gpt-4o'  # Balanced
    elif task_complexity == 'complex':  # Journey optimization
        return 'o1'  # Best reasoning
    else:
        return 'gpt-4o'  # Default
```

### 2. Caching Strategy

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
async def get_cached_recommendation(destination: str, budget: float):
    """
    Cache common recommendations
    """
    cache_key = hashlib.md5(f"{destination}_{budget}".encode()).hexdigest()
    # Check Redis/database cache
    # Return cached result if < 24 hours old
    pass
```

### 3. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@openai_router.post("/smart-dreams")
@limiter.limit("10/minute")  # Max 10 requests per minute per user
async def smart_dreams_chat(request: SmartDreamsRequest):
    # ...
```

---

## 📊 Monitoring & Analytics

### Track Usage

```python
# Add to each endpoint
from datetime import datetime

async def log_ai_usage(
    user_id: str,
    model: str,
    tokens_used: int,
    cost_usd: float
):
    """
    Track AI usage for billing/analytics
    """
    await db.ai_usage.insert_one({
        "user_id": user_id,
        "model": model,
        "tokens": tokens_used,
        "cost": cost_usd,
        "timestamp": datetime.utcnow()
    })
```

---

## 🚀 Gradual Rollout

### Phase 1: Admin Testing (Week 1)
```python
# Enable only for admin users
if user.role != 'admin':
    # Use old GPT-4o-mini
    return await legacy_ai_service.process()
else:
    # Use new ChatGPT Pro
    return await openai_service.smart_dreams_analysis()
```

### Phase 2: Beta Users (Week 2-3)
```python
# Enable for NFT holders
if user.nft_tier in ['Gold', 'Platinum']:
    return await openai_service.smart_dreams_analysis()
```

### Phase 3: Full Rollout (Week 4)
```python
# Enable for all users
return await openai_service.smart_dreams_analysis()
```

---

## 🎯 Success Metrics

**Track These KPIs:**
- **AI Response Quality:** User ratings (1-5 stars)
- **Response Time:** Target <3 seconds
- **Cost per Conversation:** Target <$0.10
- **User Satisfaction:** NPS score
- **Booking Conversion:** AI-assisted bookings

---

## 🔒 Security Best Practices

1. **API Key Protection:**
   - Store in .env only
   - Never commit to Git
   - Rotate monthly

2. **Rate Limiting:**
   - 10 requests/minute per user
   - 1000 requests/hour platform-wide

3. **Content Filtering:**
   - Validate user inputs
   - Filter sensitive data from logs
   - Moderate AI responses

4. **Audit Logging:**
   - Log all AI interactions
   - Track costs per user
   - Monitor for abuse

---

## 📚 Additional Resources

- **OpenAI Docs:** https://platform.openai.com/docs
- **Model Comparison:** https://platform.openai.com/docs/models
- **Pricing:** https://openai.com/api/pricing/
- **Best Practices:** https://platform.openai.com/docs/guides/production-best-practices

---

**Document Status:** Ready for implementation
**Estimated Setup Time:** 1-2 hours
**Expected Cost:** $10-30/month (light usage) to $500-1500/month (heavy usage)
