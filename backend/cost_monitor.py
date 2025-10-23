"""
Cost Monitoring System for OpenAI API Usage
Tracks tokens, costs, and provides analytics
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# OpenAI Pricing (as of Jan 2025)
MODEL_PRICING = {
    "gpt-4o": {
        "input": 0.0000025,   # $2.50 per 1M tokens
        "output": 0.00001     # $10 per 1M tokens
    },
    "gpt-4o-mini": {
        "input": 0.00000015,  # $0.15 per 1M tokens
        "output": 0.0000006   # $0.60 per 1M tokens
    },
    "o1": {
        "input": 0.000015,    # $15 per 1M tokens
        "output": 0.00006     # $60 per 1M tokens
    },
    "o1-mini": {
        "input": 0.000003,    # $3 per 1M tokens
        "output": 0.000012    # $12 per 1M tokens
    },
    "o1-pro": {
        "input": 0.00003,     # Estimated
        "output": 0.00012     # Estimated
    },
    "o3-mini": {
        "input": 0.000005,    # Estimated
        "output": 0.00002     # Estimated
    },
    "gpt-4.5-preview": {
        "input": 0.000003,    # Estimated
        "output": 0.000012    # Estimated
    }
}

class CostMonitor:
    """Monitor and track OpenAI API costs"""
    
    def __init__(self):
        self.usage_log = []  # In-memory storage (use database in production)
        self.daily_totals = defaultdict(lambda: {"cost": 0, "tokens": 0, "requests": 0})
        self.user_totals = defaultdict(lambda: {"cost": 0, "tokens": 0, "requests": 0})
        self.model_totals = defaultdict(lambda: {"cost": 0, "tokens": 0, "requests": 0})
        self.endpoint_totals = defaultdict(lambda: {"cost": 0, "tokens": 0, "requests": 0})
        
        # Alert thresholds
        self.daily_cost_threshold = float(os.getenv('DAILY_COST_THRESHOLD', '50'))  # $50/day
        self.user_daily_threshold = float(os.getenv('USER_DAILY_THRESHOLD', '5'))   # $5/user/day
        
        logger.info("Cost Monitor initialized")
    
    def calculate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """
        Calculate cost for API call
        
        Args:
            model: Model name
            prompt_tokens: Input tokens
            completion_tokens: Output tokens
        
        Returns:
            Cost in USD
        """
        pricing = MODEL_PRICING.get(model, MODEL_PRICING['gpt-4o'])  # Default to gpt-4o
        
        input_cost = prompt_tokens * pricing['input']
        output_cost = completion_tokens * pricing['output']
        
        return input_cost + output_cost
    
    async def track_usage(
        self,
        user_id: str,
        endpoint: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        response_time: float
    ) -> Dict[str, Any]:
        """
        Track API usage and calculate cost
        """
        cost = self.calculate_cost(model, int(prompt_tokens), int(completion_tokens))
        total_tokens = int(prompt_tokens + completion_tokens)
        
        usage_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "endpoint": endpoint,
            "model": model,
            "prompt_tokens": int(prompt_tokens),
            "completion_tokens": int(completion_tokens),
            "total_tokens": total_tokens,
            "cost": cost,
            "response_time": response_time
        }
        
        # Store in memory (use database in production)
        self.usage_log.append(usage_entry)
        
        # Update aggregates
        today = datetime.utcnow().date().isoformat()
        self.daily_totals[today]['cost'] += cost
        self.daily_totals[today]['tokens'] += total_tokens
        self.daily_totals[today]['requests'] += 1
        
        self.user_totals[user_id]['cost'] += cost
        self.user_totals[user_id]['tokens'] += total_tokens
        self.user_totals[user_id]['requests'] += 1
        
        self.model_totals[model]['cost'] += cost
        self.model_totals[model]['tokens'] += total_tokens
        self.model_totals[model]['requests'] += 1
        
        self.endpoint_totals[endpoint]['cost'] += cost
        self.endpoint_totals[endpoint]['tokens'] += total_tokens
        self.endpoint_totals[endpoint]['requests'] += 1
        
        # Check thresholds and alert if needed
        await self._check_thresholds(user_id, today, cost)
        
        return {
            "cost": cost,
            "total_tokens": total_tokens,
            "logged": True
        }
    
    async def _check_thresholds(self, user_id: str, today: str, cost: float):
        """
        Check if usage exceeds thresholds and trigger alerts
        """
        # Check daily total
        if self.daily_totals[today]['cost'] > self.daily_cost_threshold:
            logger.warning(
                f"⚠️ ALERT: Daily cost threshold exceeded! "
                f"${self.daily_totals[today]['cost']:.2f} > ${self.daily_cost_threshold:.2f}"
            )
            # TODO: Send email/Slack notification
        
        # Check user total
        if self.user_totals[user_id]['cost'] > self.user_daily_threshold:
            logger.warning(
                f"⚠️ ALERT: User {user_id} exceeded daily threshold! "
                f"${self.user_totals[user_id]['cost']:.2f} > ${self.user_daily_threshold:.2f}"
            )
            # TODO: Implement rate limiting
    
    async def get_summary(self, period: str = "today", user_id: Optional[str] = None) -> Dict:
        """
        Get cost summary for specified period
        """
        if period == "today":
            today = datetime.utcnow().date().isoformat()
            data = self.daily_totals[today]
            
            return {
                "date": today,
                "total_cost": round(data['cost'], 4),
                "total_tokens": data['tokens'],
                "total_requests": data['requests'],
                "avg_cost_per_request": round(data['cost'] / max(data['requests'], 1), 4),
                "threshold": self.daily_cost_threshold,
                "threshold_usage_pct": round((data['cost'] / self.daily_cost_threshold) * 100, 1)
            }
        
        elif period == "week":
            # Calculate last 7 days
            total_cost = 0
            total_tokens = 0
            total_requests = 0
            
            for i in range(7):
                date = (datetime.utcnow().date() - timedelta(days=i)).isoformat()
                data = self.daily_totals.get(date, {"cost": 0, "tokens": 0, "requests": 0})
                total_cost += data['cost']
                total_tokens += data['tokens']
                total_requests += data['requests']
            
            return {
                "period": "last_7_days",
                "total_cost": round(total_cost, 4),
                "total_tokens": total_tokens,
                "total_requests": total_requests,
                "avg_cost_per_day": round(total_cost / 7, 4),
                "projected_monthly": round(total_cost * 4.3, 2)
            }
        
        elif period == "user" and user_id:
            data = self.user_totals.get(user_id, {"cost": 0, "tokens": 0, "requests": 0})
            
            return {
                "user_id": user_id,
                "total_cost": round(data['cost'], 4),
                "total_tokens": data['tokens'],
                "total_requests": data['requests'],
                "avg_cost_per_request": round(data['cost'] / max(data['requests'], 1), 4)
            }
        
        else:
            # All time
            total_cost = sum(data['cost'] for data in self.user_totals.values())
            total_tokens = sum(data['tokens'] for data in self.user_totals.values())
            total_requests = sum(data['requests'] for data in self.user_totals.values())
            
            return {
                "period": "all_time",
                "total_cost": round(total_cost, 4),
                "total_tokens": total_tokens,
                "total_requests": total_requests,
                "unique_users": len(self.user_totals)
            }
    
    async def get_breakdown(self, group_by: str = "model") -> Dict:
        """
        Get cost breakdown by model, endpoint, or user
        """
        if group_by == "model":
            breakdown = []
            for model, data in self.model_totals.items():
                breakdown.append({
                    "model": model,
                    "total_cost": round(data['cost'], 4),
                    "total_tokens": data['tokens'],
                    "total_requests": data['requests'],
                    "avg_cost_per_request": round(data['cost'] / max(data['requests'], 1), 4)
                })
            
            return {
                "breakdown": sorted(breakdown, key=lambda x: x['total_cost'], reverse=True)
            }
        
        elif group_by == "endpoint":
            breakdown = []
            for endpoint, data in self.endpoint_totals.items():
                breakdown.append({
                    "endpoint": endpoint,
                    "total_cost": round(data['cost'], 4),
                    "total_tokens": data['tokens'],
                    "total_requests": data['requests'],
                    "avg_cost_per_request": round(data['cost'] / max(data['requests'], 1), 4)
                })
            
            return {
                "breakdown": sorted(breakdown, key=lambda x: x['total_cost'], reverse=True)
            }
        
        elif group_by == "user":
            breakdown = []
            for user_id, data in self.user_totals.items():
                breakdown.append({
                    "user_id": user_id,
                    "total_cost": round(data['cost'], 4),
                    "total_tokens": data['tokens'],
                    "total_requests": data['requests']
                })
            
            return {
                "breakdown": sorted(breakdown, key=lambda x: x['total_cost'], reverse=True)[:50]  # Top 50
            }
        
        else:
            return {"breakdown": []}
    
    async def get_stats(self, metric: str = "all") -> Dict:
        """
        Get usage statistics
        """
        if not self.usage_log:
            return {
                "total_entries": 0,
                "message": "No usage data yet"
            }
        
        total_cost = sum(entry['cost'] for entry in self.usage_log)
        total_tokens = sum(entry['total_tokens'] for entry in self.usage_log)
        total_requests = len(self.usage_log)
        
        # Calculate averages
        avg_response_time = sum(entry['response_time'] for entry in self.usage_log) / total_requests
        avg_tokens_per_request = total_tokens / total_requests
        avg_cost_per_request = total_cost / total_requests
        
        return {
            "total_entries": total_requests,
            "total_cost_usd": round(total_cost, 4),
            "total_tokens": total_tokens,
            "avg_response_time_seconds": round(avg_response_time, 2),
            "avg_tokens_per_request": round(avg_tokens_per_request, 0),
            "avg_cost_per_request": round(avg_cost_per_request, 4),
            "most_used_model": max(self.model_totals.items(), key=lambda x: x[1]['requests'])[0] if self.model_totals else None,
            "most_used_endpoint": max(self.endpoint_totals.items(), key=lambda x: x[1]['requests'])[0] if self.endpoint_totals else None
        }
    
    def export_usage_log(self, filepath: str = "/app/logs/openai_usage.json"):
        """
        Export usage log to file
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(self.usage_log, f, indent=2)
            logger.info(f"Usage log exported to {filepath}")
        except Exception as e:
            logger.error(f"Failed to export usage log: {e}")

# Singleton instance
cost_monitor = CostMonitor()
