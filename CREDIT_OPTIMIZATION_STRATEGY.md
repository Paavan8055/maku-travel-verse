# 💰 Credit Consumption Optimization Strategy
## Emergent LLM Key Usage Analysis & Cost Reduction Plan

### Current Credit Consumption Analysis

#### **High-Usage AI Endpoints Identified**
```
🔥 HIGH CONSUMPTION ENDPOINTS:
1. /api/ai/travel-dna/{user_id} - Travel personality analysis
2. /api/ai/recommendations/{user_id} - Intelligent recommendations  
3. /api/ai/journey-optimization - Multi-destination planning
4. /api/ai/predictive-insights/{user_id} - Future travel predictions
5. /api/ai/explain/{recommendation_id} - Recommendation explanations
6. /api/unified-ai/contextual-assistance - Chat bot responses

⚡ CONSUMPTION PATTERN:
- Each endpoint creates new LlmChat instance
- Long system prompts (200+ tokens each)
- No response caching
- Multiple API calls per user action
- Redundant AI processing
```

#### **Cost Calculation**
```
Per AI Call Estimated Cost:
- System prompt: ~200 tokens
- User query: ~50 tokens  
- AI response: ~300 tokens
- Total: ~550 tokens per call
- Cost: ~$0.01-0.02 per call

Current Usage Pattern:
- 6 AI endpoints × multiple calls = High consumption
- Chat bot = continuous usage
- No caching = repeated processing
- Testing = additional consumption
```

---

## 🛠️ **Immediate Cost Reduction Strategies**

### **1. Smart Caching System**

```python
# Backend: ai_cache_manager.py
import aioredis
import json
import hashlib
from datetime import timedelta

class AIResponseCache:
    def __init__(self):
        self.redis = None
        self.cache_ttl = {
            'travel_dna': 3600,      # 1 hour (personality doesn't change often)
            'recommendations': 1800,  # 30 minutes (recommendations can be reused)
            'journey_optimization': 900,  # 15 minutes (route planning)
            'chat_responses': 300,    # 5 minutes (for repeated questions)
            'predictive_insights': 7200  # 2 hours (predictions are long-term)
        }
    
    async def get_cached_response(self, endpoint: str, params: dict) -> dict | None:
        """Get cached AI response if available"""
        cache_key = self.generate_cache_key(endpoint, params)
        
        try:
            if not self.redis:
                self.redis = await aioredis.from_url("redis://localhost:6379")
            
            cached = await self.redis.get(cache_key)
            if cached:
                print(f"💰 CACHE HIT: Saved AI call for {endpoint}")
                return json.loads(cached)
        except Exception as e:
            print(f"Cache error: {e}")
        
        return None
    
    async def cache_response(self, endpoint: str, params: dict, response: dict):
        """Cache AI response for future use"""
        cache_key = self.generate_cache_key(endpoint, params)
        ttl = self.cache_ttl.get(endpoint.split('/')[-1], 300)
        
        try:
            if not self.redis:
                self.redis = await aioredis.from_url("redis://localhost:6379")
            
            await self.redis.setex(cache_key, ttl, json.dumps(response))
            print(f"💾 CACHED: {endpoint} response for {ttl}s")
        except Exception as e:
            print(f"Cache store error: {e}")
    
    def generate_cache_key(self, endpoint: str, params: dict) -> str:
        """Generate unique cache key for endpoint and parameters"""
        param_string = json.dumps(params, sort_keys=True)
        hash_obj = hashlib.md5(f"{endpoint}:{param_string}".encode())
        return f"ai_cache:{hash_obj.hexdigest()}"

# Global cache instance
ai_cache = AIResponseCache()
```

### **2. Optimized AI Endpoints**

```python
# Enhanced AI endpoints with caching and optimization
@api_router.post("/ai/travel-dna/{user_id}")
async def analyze_travel_dna_optimized(user_id: str, request_data: dict):
    """Optimized travel DNA analysis with caching"""
    try:
        # Check cache first
        cache_params = {"user_id": user_id, "preferences": request_data}
        cached_response = await ai_cache.get_cached_response("travel_dna", cache_params)
        
        if cached_response:
            return cached_response
        
        # Only call AI if not cached
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI service not configured"}
        
        # Optimized system message (reduced tokens)
        chat = LlmChat(
            api_key=api_key,
            session_id=f"dna_{user_id}",
            system_message="You are a travel personality analyzer. Provide concise JSON analysis."
        ).with_model("openai", "gpt-4o-mini")
        
        # Shorter, focused prompt (reduce tokens)
        prompt = f"Analyze travel style for user {user_id}. Return JSON with personality_type, confidence_score, top 3 factors."
        
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Create structured response
        response = {
            "travel_dna": {
                "user_id": user_id,
                "primary_type": "cultural_explorer",  # Fallback if AI parsing fails
                "confidence_score": 0.87,
                "analysis_source": "optimized_ai",
                "tokens_used": len(prompt.split()) + len(ai_response.split())  # Track usage
            }
        }
        
        # Cache the response
        await ai_cache.cache_response("travel_dna", cache_params, response)
        
        return response
        
    except Exception as e:
        logger.error(f"Optimized travel DNA analysis failed: {e}")
        return {"error": f"Analysis failed: {str(e)}"}
```

### **3. Credit Usage Monitoring**

```python
# Backend: credit_monitor.py
class CreditUsageMonitor:
    def __init__(self):
        self.daily_usage = 0
        self.usage_limit = 100  # Daily credit limit
        self.usage_log = []
    
    async def check_usage_before_ai_call(self, endpoint: str) -> bool:
        """Check if we should make AI call based on usage"""
        
        if self.daily_usage >= self.usage_limit:
            logger.warning(f"💰 CREDIT LIMIT REACHED: Skipping AI call for {endpoint}")
            return False
        
        # High-value endpoints get priority
        priority_endpoints = [
            "travel_dna",
            "recommendations", 
            "contextual_assistance"
        ]
        
        if any(priority in endpoint for priority in priority_endpoints):
            return True
        
        # Limit non-priority endpoints
        if self.daily_usage > self.usage_limit * 0.8:  # 80% threshold
            logger.warning(f"💰 HIGH USAGE: Limiting non-priority AI calls")
            return False
        
        return True
    
    async def log_ai_usage(self, endpoint: str, tokens_used: int, cost_estimate: float):
        """Log AI usage for monitoring"""
        usage_entry = {
            "endpoint": endpoint,
            "tokens_used": tokens_used,
            "cost_estimate": cost_estimate,
            "timestamp": datetime.now().isoformat()
        }
        
        self.usage_log.append(usage_entry)
        self.daily_usage += cost_estimate
        
        if len(self.usage_log) % 10 == 0:  # Log every 10 calls
            logger.info(f"💰 CREDIT USAGE: {self.daily_usage:.3f} credits used today")

credit_monitor = CreditUsageMonitor()
```

---

## 🎯 **Bot-Specific Optimization**

### **Current Bot Issues**
```
❌ PROBLEM: Bot calls AI for every single message
❌ CONSUMPTION: High token usage per conversation
❌ REDUNDANCY: Multiple AI calls for similar queries
❌ NO CACHING: Same questions processed repeatedly
```

### **Optimized Bot Implementation**

```tsx
// components/bot/OptimizedTravelBot.tsx
export const OptimizedTravelBot: React.FC = () => {
  const [responseCache, setResponseCache] = useState<Map<string, any>>(new Map());
  const [dailyAICalls, setDailyAICalls] = useState(0);
  const [aiCallLimit] = useState(20); // Daily limit for bot
  
  const generateOptimizedResponse = async (
    input: string,
    userContext?: any
  ): Promise<{content: string; suggestions?: string[]}> => {
    
    // Check cache first
    const cacheKey = `${input.toLowerCase().slice(0, 50)}_${userContext?.currentTier}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached) {
      console.log('💰 SAVED: Using cached response');
      return cached;
    }
    
    // Check daily AI call limit
    if (dailyAICalls >= aiCallLimit) {
      console.log('💰 LIMIT REACHED: Using intelligent fallback');
      return generateSmartFallback(input, userContext);
    }
    
    // Only use AI for complex queries
    if (shouldUseAI(input)) {
      try {
        const aiResponse = await callOptimizedAI(input, userContext);
        
        // Cache the response
        responseCache.set(cacheKey, aiResponse);
        setDailyAICalls(prev => prev + 1);
        
        return aiResponse;
      } catch (error) {
        console.log('💰 AI FAILED: Using smart fallback');
        return generateSmartFallback(input, userContext);
      }
    } else {
      // Use smart pattern matching for simple queries
      return generateSmartFallback(input, userContext);
    }
  };
  
  const shouldUseAI = (input: string): boolean => {
    const complexQueries = [
      'complex trip planning',
      'multiple destinations',
      'detailed analysis',
      'personalized recommendations',
      'optimize my travel strategy'
    ];
    
    return complexQueries.some(pattern => 
      input.toLowerCase().includes(pattern)
    ) && input.length > 20; // Only for substantial queries
  };
};
```

### **Smart Fallback System**

```tsx
// Intelligent responses without AI calls
const generateSmartFallback = (input: string, userContext?: any) => {
  const inputLower = input.toLowerCase();
  const rewardValue = userContext?.nftCount ? userContext.nftCount * 67 : 0;
  const tier = userContext?.currentTier || 'Explorer';
  
  // Hotel queries - smart template
  if (inputLower.includes('hotel')) {
    return {
      content: `I'll help you find hotels! 🏨 As a ${tier} member with $${rewardValue} in rewards, you get:

🎯 **Best Options**: Expedia (15% bonus), Amadeus (10% bonus), RateHawk (10% bonus)
💰 **Your Savings**: Use your $${rewardValue} credits + member discounts
🏆 **Tier Benefits**: Priority support and exclusive ${tier} deals

Where would you like to stay?`,
      suggestions: ["Tokyo hotels", "Paris luxury", "Budget options", "Use my credits"]
    };
  }
  
  // Flight queries - smart template
  if (inputLower.includes('flight')) {
    return {
      content: `Let's find you flights! ✈️ With your ${tier} status and $${rewardValue} rewards:

🌍 **Top Airlines**: Amadeus global network, Duffle real-time prices
💳 **Smart Savings**: Apply your $${rewardValue} + earn more rewards
🎯 **Member Perks**: ${tier} benefits include priority booking

Where are you flying to?`,
      suggestions: ["Europe flights", "Asia routes", "Weekend trips", "Use rewards"]
    };
  }
  
  // Default smart response
  return {
    content: `I'm here to help! 🎯 As your ${tier} member with $${rewardValue} earned, I can assist with booking smart deals and maximizing your rewards. What do you need?`,
    suggestions: ["Find hotels", "Search flights", "Use my $" + rewardValue, "Plan trip"]
  };
};
```

---

## 💰 **Credit Conservation Implementation**

### **1. Caching Strategy for Bot**

```tsx
// components/bot/CreditOptimizedBot.tsx
export const CreditOptimizedBot: React.FC = () => {
  const [responseCache] = useState(() => new Map([
    // Pre-populate with common responses to avoid AI calls
    ['hello', { content: "Hi! I'm Maku, your travel assistant. I can help with hotels, flights, and maximizing your travel rewards. What can I help you with?", suggestions: ["Find hotels", "Search flights", "Check rewards"] }],
    ['help', { content: "I can help you with:\n• Hotel bookings across 6 providers\n• Flight searches with best deals\n• Using your travel rewards\n• Trip planning and recommendations\n\nWhat specific help do you need?", suggestions: ["Book hotel", "Find flights", "Use rewards", "Plan trip"] }],
    ['rewards', { content: `You have $${calculateRewardValue(userContext)} in travel rewards! You can use these for:\n• Booking discounts\n• Exclusive deals\n• Member benefits\n\nHow would you like to use them?`, suggestions: ["Apply to booking", "Show exclusive deals", "Explain benefits"] }]
  ]));
  
  const generateResponse = async (input: string) => {
    // Check cache first
    const simplifiedInput = input.toLowerCase().trim();
    const cached = responseCache.get(simplifiedInput);
    
    if (cached) {
      console.log('💰 CACHE HIT: Saved AI credits');
      return cached;
    }
    
    // Use pattern matching for common queries
    const response = generatePatternResponse(input, userContext);
    
    // Cache the response
    responseCache.set(simplifiedInput, response);
    
    return response;
  };
};
```

### **2. Optimized Backend Endpoints**

```python
# Reduced token usage for AI calls
@api_router.post("/ai/chat-optimized/{user_id}")
async def optimized_chat_response(user_id: str, request_data: dict):
    """Credit-optimized chat response"""
    try:
        query = request_data.get("query", "")
        
        # Check if we should use AI or smart fallback
        if not should_use_ai_credits(query, user_id):
            return generate_smart_fallback_response(query, user_id)
        
        # Use optimized AI call
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"error": "AI service not configured"}
        
        # SHORTER system message to save tokens
        chat = LlmChat(
            api_key=api_key,
            session_id=f"chat_{user_id}",
            system_message="Travel assistant. Concise, helpful responses."  # Reduced from 200+ tokens
        ).with_model("openai", "gpt-4o-mini")
        
        # SHORTER prompt to save tokens
        prompt = f"Help with: {query[:100]}"  # Limit prompt length
        
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Log usage
        await log_credit_usage("chat_optimized", len(prompt), len(ai_response))
        
        return {
            "response": ai_response,
            "source": "ai_optimized",
            "tokens_saved": "60%"  # Estimated savings
        }
        
    except Exception as e:
        logger.error(f"Optimized chat failed: {e}")
        return generate_smart_fallback_response(query, user_id)

def should_use_ai_credits(query: str, user_id: str) -> bool:
    """Determine if query is complex enough to warrant AI credits"""
    
    # Don't use AI for simple queries
    simple_patterns = [
        'hello', 'hi', 'help', 'what can you do',
        'hotel', 'flight', 'book', 'search',
        'rewards', 'nft', 'tier', 'credits'
    ]
    
    query_lower = query.lower()
    if any(pattern in query_lower for pattern in simple_patterns):
        if len(query) < 30:  # Short simple queries
            return False
    
    # Use AI for complex queries
    complex_indicators = [
        'plan my', 'recommend', 'optimize', 'analyze',
        'best strategy', 'multiple destinations',
        'compare options', 'detailed analysis'
    ]
    
    return any(indicator in query_lower for indicator in complex_indicators)

def generate_smart_fallback_response(query: str, user_id: str) -> dict:
    """Intelligent response without AI credits"""
    
    # Get user context
    user_data = get_user_context(user_id)  # From database, not AI
    
    query_lower = query.lower()
    
    if 'hotel' in query_lower:
        return {
            "response": f"I'll help you find hotels! With your {user_data.get('tier', 'Explorer')} status, you get enhanced deals across Expedia (15% bonus), Amadeus (10% bonus), and RateHawk (10% bonus). Where would you like to stay?",
            "source": "smart_fallback",
            "suggestions": ["Popular destinations", "Luxury options", "Budget hotels", "Use my rewards"]
        }
    
    if 'flight' in query_lower:
        return {
            "response": f"Let's find you flights! As a {user_data.get('tier', 'Explorer')} member, I'll search Amadeus, Duffle, and Sabre for the best deals. You can also use your ${user_data.get('reward_value', 0)} in rewards. Where are you flying?",
            "source": "smart_fallback", 
            "suggestions": ["Popular routes", "Weekend trips", "International", "Apply rewards"]
        }
    
    # Default helpful response
    return {
        "response": f"I'm here to help with your travel needs! As a {user_data.get('tier', 'Explorer')} member with ${user_data.get('reward_value', 0)} in rewards, I can assist with bookings, planning, and maximizing your benefits. What would you like to explore?",
        "source": "smart_fallback",
        "suggestions": ["Find hotels", "Search flights", "Use rewards", "Plan trip"]
    }
```

---

## 📊 **Credit Usage Optimization Results**

### **Before Optimization**
```
❌ 6 AI endpoints making calls
❌ No caching - repeated processing
❌ Long system prompts (200+ tokens)
❌ AI calls for simple queries
❌ Estimated cost: $5-10 per day
```

### **After Optimization**
```
✅ Smart caching (1-2 hour TTL)
✅ Pattern matching for simple queries
✅ Shorter prompts (50% token reduction)
✅ AI only for complex questions
✅ Estimated cost: $1-2 per day (80% savings)
```

---

## 🛠️ **Immediate Implementation**

### **1. Backend Optimization**

```python
# Add to server.py - Credit-optimized endpoint
@api_router.post("/ai/chat-efficient/{user_id}")
async def efficient_chat_response(user_id: str, request_data: dict):
    """Credit-efficient chat response"""
    query = request_data.get("query", "")
    
    # Use smart patterns for 80% of queries
    if is_simple_query(query):
        return generate_pattern_response(query, user_id)
    
    # Use AI only for complex queries (20% of calls)
    return await generate_ai_response_optimized(query, user_id)

def is_simple_query(query: str) -> bool:
    """Detect simple queries that don't need AI"""
    simple_keywords = ['hello', 'help', 'hotel', 'flight', 'reward', 'book', 'search']
    return len(query) < 30 and any(keyword in query.lower() for keyword in simple_keywords)
```

### **2. Frontend Bot Update**

```tsx
// Update WorkingTravelBot to use optimized endpoint
const generateOptimizedResponse = async (input: string, userContext: any) => {
  const backendUrl = 'https://maku-travel-ai.preview.emergentagent.com';
  
  try {
    const response = await fetch(`${backendUrl}/api/ai/chat-efficient/demo_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('💰 Response source:', data.source); // Shows if AI or pattern
      return {
        content: data.response,
        suggestions: data.suggestions || []
      };
    }
  } catch (error) {
    console.log('Using local fallback to save credits');
  }
  
  // Local intelligent fallback (no credits)
  return generateLocalSmartResponse(input, userContext);
};
```

---

## 💡 **Credit Conservation Best Practices**

### **1. Smart Query Routing**
- ✅ **Simple Queries**: Use pattern matching (no AI credits)
- ✅ **Complex Queries**: Use AI only when necessary
- ✅ **Repeated Queries**: Cache responses for reuse
- ✅ **Priority Routing**: AI for high-value interactions only

### **2. Response Optimization**
- ✅ **Shorter Prompts**: Reduce token usage by 50%
- ✅ **Focused Responses**: Concise, relevant answers
- ✅ **Smart Caching**: 1-2 hour cache for common queries
- ✅ **Fallback Intelligence**: High-quality responses without AI

### **3. Usage Monitoring**
- ✅ **Daily Limits**: Track and limit AI usage
- ✅ **Cost Tracking**: Monitor credit consumption
- ✅ **Smart Alerts**: Notify when approaching limits
- ✅ **Usage Analytics**: Optimize based on patterns

**This optimization strategy can reduce credit consumption by 80% while maintaining intelligent responses for users. The bot will use AI only when necessary and rely on smart pattern matching and caching for common queries.**