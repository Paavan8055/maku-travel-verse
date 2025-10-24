"""
Smart Dreams AI Scoring Service
Hybrid approach: ChatGPT Pro AI + 24-hour caching
Replaces all Math.random() with deterministic, explainable scoring
"""

import os
import json
import hashlib
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from openai_service import openai_service
import logging

logger = logging.getLogger(__name__)

# In-memory cache (use Redis in production)
AI_SCORE_CACHE = {}
CACHE_TTL_HOURS = 24

class SmartDreamsAIScoring:
    """AI-powered scoring with caching and deterministic fallback"""
    
    def __init__(self):
        self.ai_enabled = openai_service.enabled
        logger.info(f"Smart Dreams AI Scoring initialized (AI enabled: {self.ai_enabled})")
    
    def _generate_cache_key(self, destination: str, user_preferences: Dict) -> str:
        """Generate cache key for scoring results"""
        cache_data = f"{destination}_{json.dumps(user_preferences, sort_keys=True)}"
        return hashlib.md5(cache_data.encode()).hexdigest()
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cached score is still valid (< 24 hours old)"""
        if not cache_entry:
            return False
        
        cached_at = datetime.fromisoformat(cache_entry['cached_at'])
        age_hours = (datetime.utcnow() - cached_at).total_seconds() / 3600
        
        return age_hours < CACHE_TTL_HOURS
    
    async def calculate_personality_match(
        self,
        destination: Dict[str, Any],
        user_preferences: Dict[str, Any],
        user_context: Dict[str, Any],
        use_ai: bool = True
    ) -> Dict[str, Any]:
        """
        Calculate personality match score
        
        Returns:
            {
                "personality_match": 0-100,
                "is_dream_destination": boolean,
                "match_reasons": ["reason1", "reason2"],
                "ai_confidence": 0-100,
                "scoring_method": "ai" | "deterministic" | "cached"
            }
        """
        
        # Check cache first
        cache_key = self._generate_cache_key(
            destination.get('name', destination.get('destination', '')),
            user_preferences
        )
        
        cached_result = AI_SCORE_CACHE.get(cache_key)
        if cached_result and self._is_cache_valid(cached_result):
            logger.info(f"Using cached AI score for {destination.get('name', 'unknown')}")
            return {
                **cached_result['score'],
                "scoring_method": "cached",
                "cache_age_hours": round((datetime.utcnow() - datetime.fromisoformat(cached_result['cached_at'])).total_seconds() / 3600, 1)
            }
        
        # Try AI scoring if enabled and requested
        if use_ai and self.ai_enabled:
            try:
                ai_score = await self._get_ai_score(
                    destination,
                    user_preferences,
                    user_context
                )
                
                # Cache the AI result
                AI_SCORE_CACHE[cache_key] = {
                    "score": ai_score,
                    "cached_at": datetime.utcnow().isoformat()
                }
                
                return {
                    **ai_score,
                    "scoring_method": "ai"
                }
            except Exception as e:
                logger.error(f"AI scoring failed: {e}, falling back to deterministic")
                # Fall through to deterministic scoring
        
        # Deterministic scoring (fallback or when AI disabled)
        deterministic_score = self._calculate_deterministic_score(
            destination,
            user_preferences
        )
        
        # Cache deterministic result too
        AI_SCORE_CACHE[cache_key] = {
            "score": deterministic_score,
            "cached_at": datetime.utcnow().isoformat()
        }
        
        return {
            **deterministic_score,
            "scoring_method": "deterministic"
        }
    
    async def _get_ai_score(
        self,
        destination: Dict[str, Any],
        user_preferences: Dict[str, Any],
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get AI-powered personality match score from ChatGPT Pro
        """
        
        # Prepare AI prompt
        user_input = f"""
Analyze destination match for Smart Dreams:

Destination: {destination.get('name', destination.get('destination', 'Unknown'))}
Location: {destination.get('location', destination.get('city', ''))}, {destination.get('country', '')}
Price: ${destination.get('price', 0)}
Rating: {destination.get('rating', 0)}/5
Amenities: {', '.join(destination.get('amenities', []))}
Tags: {', '.join(destination.get('tags', []))}

User Preferences:
- Budget: ${user_preferences.get('budget', 0)}
- Duration: {user_preferences.get('duration', 7)} days
- Interests: {', '.join(user_preferences.get('interests', []))}
- Travel Style: {user_preferences.get('travelStyle', 'balanced')}
- Companion: {user_preferences.get('companion', 'solo')}

Provide analysis in this EXACT JSON format:
{{
  "personality_match": 0-100,
  "is_dream_destination": true/false,
  "match_reasons": ["reason1", "reason2", "reason3"],
  "ai_confidence": 0-100,
  "budget_fit": "excellent" | "good" | "tight" | "over_budget",
  "interest_alignment": 0-100,
  "companion_suitability": 0-100
}}
"""
        
        # Call ChatGPT Pro
        ai_response = await openai_service.smart_dreams_analysis(
            user_input=user_input,
            user_context=user_context,
            model='gpt-4o'  # Fast model for scoring
        )
        
        # Parse AI response
        response_text = ai_response.get('response', '')
        
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{[^}]+\}', response_text, re.DOTALL)
            if json_match:
                ai_data = json.loads(json_match.group())
            else:
                # Fallback parsing
                ai_data = self._parse_ai_text_response(response_text)
            
            return {
                "personality_match": min(100, max(0, ai_data.get('personality_match', 75))),
                "is_dream_destination": ai_data.get('is_dream_destination', False),
                "match_reasons": ai_data.get('match_reasons', ['AI analysis pending']),
                "ai_confidence": min(100, max(0, ai_data.get('ai_confidence', 80))),
                "budget_fit": ai_data.get('budget_fit', 'good'),
                "interest_alignment": ai_data.get('interest_alignment', 75),
                "companion_suitability": ai_data.get('companion_suitability', 75)
            }
        except Exception as e:
            logger.error(f"Failed to parse AI response: {e}")
            # Return reasonable defaults based on response sentiment
            return self._estimate_from_text(response_text, destination, user_preferences)
    
    def _parse_ai_text_response(self, text: str) -> Dict:
        """Parse AI response when JSON extraction fails"""
        # Simple heuristic parsing
        score = 75  # Default
        
        # Look for score indicators in text
        if 'excellent match' in text.lower() or 'perfect' in text.lower():
            score = 90
        elif 'good match' in text.lower() or 'suitable' in text.lower():
            score = 80
        elif 'moderate' in text.lower() or 'decent' in text.lower():
            score = 70
        elif 'poor' in text.lower() or 'not ideal' in text.lower():
            score = 50
        
        is_dream = 'dream destination' in text.lower() or 'highly recommend' in text.lower()
        
        return {
            "personality_match": score,
            "is_dream_destination": is_dream,
            "match_reasons": ["Based on AI analysis"],
            "ai_confidence": 75
        }
    
    def _estimate_from_text(self, text: str, destination: Dict, preferences: Dict) -> Dict:
        """Estimate scores from AI text when parsing fails"""
        text_lower = text.lower()
        
        # Sentiment analysis
        positive_words = ['excellent', 'perfect', 'ideal', 'great', 'wonderful', 'highly recommend']
        negative_words = ['poor', 'not ideal', 'avoid', 'not recommended', 'expensive']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        base_score = 70
        score = base_score + (positive_count * 5) - (negative_count * 10)
        score = min(100, max(30, score))
        
        return {
            "personality_match": score,
            "is_dream_destination": score >= 85,
            "match_reasons": ["Based on AI analysis"],
            "ai_confidence": 70
        }
    
    def _calculate_deterministic_score(
        self,
        destination: Dict[str, Any],
        user_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deterministic scoring when AI unavailable
        Replaces Math.random() with explainable logic
        """
        
        score = 50  # Base score
        reasons = []
        
        # 1. Interest Alignment (0-20 points)
        dest_tags = set(destination.get('tags', []))
        user_interests = set(user_preferences.get('interests', []))
        interest_overlap = len(dest_tags & user_interests)
        
        if interest_overlap >= 3:
            score += 20
            reasons.append(f"Strong interest match ({interest_overlap} shared interests)")
        elif interest_overlap >= 1:
            score += 10
            reasons.append(f"Moderate interest match ({interest_overlap} shared interests)")
        
        # 2. Budget Fit (0-20 points)
        dest_price = destination.get('price', 0)
        user_budget = user_preferences.get('budget', 0)
        
        if dest_price <= user_budget * 0.8:  # 20% under budget
            score += 20
            reasons.append(f"Excellent value (${dest_price} vs ${user_budget} budget)")
        elif dest_price <= user_budget:
            score += 15
            reasons.append(f"Within budget (${dest_price})")
        elif dest_price <= user_budget * 1.1:  # 10% over
            score += 5
            reasons.append(f"Slightly over budget but manageable")
        else:
            reasons.append(f"Above budget (${dest_price} vs ${user_budget})")
        
        # 3. Rating Quality (0-15 points)
        rating = destination.get('rating', 0)
        if rating >= 4.5:
            score += 15
            reasons.append(f"Highly rated ({rating}/5 stars)")
        elif rating >= 4.0:
            score += 10
            reasons.append(f"Well rated ({rating}/5)")
        elif rating >= 3.5:
            score += 5
        
        # 4. Companion Suitability (0-15 points)
        dest_companion_types = destination.get('companionTypes', [])
        user_companion = user_preferences.get('companion', 'solo')
        
        if user_companion in dest_companion_types:
            score += 15
            reasons.append(f"Perfect for {user_companion} travelers")
        
        # 5. Travel Style Match (0-10 points)
        dest_style = destination.get('travelStyle', '')
        user_style = user_preferences.get('travelStyle', 'balanced')
        
        if dest_style == user_style:
            score += 10
            reasons.append(f"Matches your {user_style} travel style")
        
        # Normalize to 0-100
        final_score = min(100, max(0, score))
        
        # Determine if dream destination (threshold: 85+)
        is_dream = final_score >= 85
        
        return {
            "personality_match": final_score,
            "is_dream_destination": is_dream,
            "match_reasons": reasons if reasons else ["Basic compatibility match"],
            "ai_confidence": 60,  # Lower confidence for deterministic
            "budget_fit": self._categorize_budget_fit(dest_price, user_budget),
            "interest_alignment": min(100, interest_overlap * 25),
            "companion_suitability": 100 if user_companion in dest_companion_types else 50
        }
    
    def _categorize_budget_fit(self, price: float, budget: float) -> str:
        """Categorize how well price fits budget"""
        if budget == 0:
            return "unknown"
        
        ratio = price / budget
        
        if ratio <= 0.8:
            return "excellent"
        elif ratio <= 1.0:
            return "good"
        elif ratio <= 1.1:
            return "tight"
        else:
            return "over_budget"
    
    async def batch_score_destinations(
        self,
        destinations: List[Dict],
        user_preferences: Dict,
        user_context: Dict,
        use_ai_for_top_n: int = 5
    ) -> List[Dict]:
        """
        Score multiple destinations efficiently
        
        Strategy:
        - Use AI for top N destinations (by initial deterministic score)
        - Use deterministic for the rest
        - This balances quality with performance/cost
        """
        
        # First pass: Score all with deterministic
        scored_destinations = []
        for dest in destinations:
            deterministic = self._calculate_deterministic_score(dest, user_preferences)
            scored_destinations.append({
                **dest,
                "initial_score": deterministic['personality_match'],
                "deterministic_scoring": deterministic
            })
        
        # Sort by initial score
        scored_destinations.sort(key=lambda x: x['initial_score'], reverse=True)
        
        # Second pass: Enhance top N with AI
        for i, dest in enumerate(scored_destinations[:use_ai_for_top_n]):
            try:
                ai_scoring = await self.calculate_personality_match(
                    dest,
                    user_preferences,
                    user_context,
                    use_ai=True
                )
                
                # Update with AI score
                dest['personality_match'] = ai_scoring['personality_match']
                dest['is_dream_destination'] = ai_scoring['is_dream_destination']
                dest['match_reasons'] = ai_scoring['match_reasons']
                dest['ai_confidence'] = ai_scoring['ai_confidence']
                dest['scoring_method'] = ai_scoring.get('scoring_method', 'ai')
                
            except Exception as e:
                logger.error(f"AI scoring failed for {dest.get('name')}: {e}")
                # Keep deterministic scores
                dest['personality_match'] = dest['initial_score']
                dest['scoring_method'] = 'deterministic'
        
        # Bottom destinations keep deterministic scores
        for dest in scored_destinations[use_ai_for_top_n:]:
            dest['personality_match'] = dest['initial_score']
            dest['scoring_method'] = 'deterministic'
        
        # Re-sort by final scores
        scored_destinations.sort(key=lambda x: x.get('personality_match', 0), reverse=True)
        
        return scored_destinations
    
    def clear_cache(self, destination: Optional[str] = None):
        """Clear cache (all or specific destination)"""
        if destination:
            # Clear specific destination
            keys_to_remove = [k for k in AI_SCORE_CACHE.keys() if destination.lower() in k.lower()]
            for key in keys_to_remove:
                del AI_SCORE_CACHE[key]
            logger.info(f"Cleared cache for {destination}: {len(keys_to_remove)} entries")
        else:
            # Clear all
            count = len(AI_SCORE_CACHE)
            AI_SCORE_CACHE.clear()
            logger.info(f"Cleared entire AI score cache: {count} entries")
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        valid_entries = sum(1 for entry in AI_SCORE_CACHE.values() if self._is_cache_valid(entry))
        expired_entries = len(AI_SCORE_CACHE) - valid_entries
        
        return {
            "total_cached": len(AI_SCORE_CACHE),
            "valid_entries": valid_entries,
            "expired_entries": expired_entries,
            "cache_ttl_hours": CACHE_TTL_HOURS
        }

# Singleton instance
smart_dreams_scorer = SmartDreamsAIScoring()
