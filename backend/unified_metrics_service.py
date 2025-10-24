"""
Unified Metrics Service - Single Source of Truth
All platform metrics served from this service
Updates daily, ensures consistency across all pages
"""

import os
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

class UnifiedMetricsService:
    """Centralized metrics for platform-wide consistency"""
    
    def __init__(self):
        self.metrics_cache = {}
        self.last_updated = None
        self.cache_ttl_minutes = 60  # 1 hour cache
        
        if SUPABASE_URL and SUPABASE_SERVICE_KEY:
            self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            self.enabled = True
            logger.info("✅ Unified Metrics Service initialized with Supabase")
        else:
            self.enabled = False
            logger.warning("⚠️  Unified Metrics Service: Supabase not configured")
    
    def _is_cache_valid(self) -> bool:
        """Check if cached metrics are still fresh"""
        if not self.last_updated:
            return False
        
        age_minutes = (datetime.utcnow() - self.last_updated).total_seconds() / 60
        return age_minutes < self.cache_ttl_minutes
    
    async def _get_aud_exchange_rate(self) -> float:
        """Get live USD to AUD exchange rate"""
        try:
            # Use a free exchange rate API
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.exchangerate.host/latest?base=USD&symbols=AUD",
                    timeout=5.0
                )
                data = response.json()
                return data['rates']['AUD']
        except Exception as e:
            logger.warning(f"Failed to fetch live AUD rate: {e}, using fallback")
            return 1.52  # Fallback approximate rate
    
    async def get_travel_fund_metrics(self, force_refresh: bool = False) -> Dict:
        """
        Get Travel Fund metrics - SINGLE SOURCE OF TRUTH
        
        Returns:
            {
                "total_amount_usd": float,
                "total_amount_aud": float,
                "total_savers": int,
                "total_groups": int,
                "avg_fund_size_usd": float,
                "success_rate_percent": float,
                "monthly_growth_percent": float
            }
        """
        
        # Check cache first
        if not force_refresh and self._is_cache_valid() and 'travel_fund' in self.metrics_cache:
            return self.metrics_cache['travel_fund']
        
        if not self.enabled:
            # Return placeholder when Supabase not available
            return self._get_placeholder_travel_fund_metrics()
        
        try:
            # Query real Supabase data
            # Note: Adjust table/column names to match your schema
            
            # Get total funds (sum of all fund targets)
            funds_response = self.supabase.table('travel_funds') \
                .select('target_amount, currency, status, user_id, created_at') \
                .execute()
            
            if not funds_response.data:
                return self._get_placeholder_travel_fund_metrics()
            
            # Calculate totals
            total_amount_usd = 0
            unique_users = set()
            group_funds = 0
            completed_funds = 0
            
            for fund in funds_response.data:
                amount = fund.get('target_amount', 0)
                # Convert to USD if needed
                if fund.get('currency') == 'AUD':
                    amount = amount / 1.52  # Approximate conversion
                
                total_amount_usd += amount
                unique_users.add(fund.get('user_id'))
                
                if fund.get('is_group_fund', False):
                    group_funds += 1
                
                if fund.get('status') == 'completed':
                    completed_funds += 1
            
            total_savers = len(unique_users)
            
            # Get AUD rate
            aud_rate = await self._get_aud_exchange_rate()
            total_amount_aud = total_amount_usd * aud_rate
            
            # Calculate averages
            avg_fund_size_usd = total_amount_usd / max(total_savers, 1)
            avg_fund_size_aud = avg_fund_size_usd * aud_rate
            
            # Success rate
            success_rate = (completed_funds / max(total_savers, 1)) * 100 if total_savers > 0 else 0
            
            # Monthly growth
            last_month = datetime.utcnow() - timedelta(days=30)
            new_funds_this_month = sum(
                1 for fund in funds_response.data 
                if fund.get('created_at') and datetime.fromisoformat(fund['created_at'].replace('Z', '+00:00')) >= last_month
            )
            monthly_growth = (new_funds_this_month / max(total_savers - new_funds_this_month, 1)) * 100 if total_savers > new_funds_this_month else 0
            
            metrics = {
                "currency_primary": "USD",
                "total_amount_usd": round(total_amount_usd, 2),
                "total_amount_aud": round(total_amount_aud, 2),
                "aud_exchange_rate": round(aud_rate, 4),
                "total_savers": total_savers,
                "total_groups": group_funds,
                "avg_fund_size_usd": round(avg_fund_size_usd, 2),
                "avg_fund_size_aud": round(avg_fund_size_aud, 2),
                "success_rate_percent": round(success_rate, 1),
                "monthly_growth_percent": round(monthly_growth, 1),
                "last_updated": datetime.utcnow().isoformat(),
                "data_source": "supabase_live"
            }
            
            # Cache the result
            self.metrics_cache['travel_fund'] = metrics
            self.last_updated = datetime.utcnow()
            
            logger.info(f"✅ Travel Fund metrics updated: {total_savers} savers, USD ${total_amount_usd:.2f}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to fetch Travel Fund metrics: {e}")
            return self._get_placeholder_travel_fund_metrics()
    
    def _get_placeholder_travel_fund_metrics(self) -> Dict:
        """Fallback metrics when database unavailable"""
        return {
            "currency_primary": "USD",
            "total_amount_usd": 0,
            "total_amount_aud": 0,
            "aud_exchange_rate": 1.52,
            "total_savers": 0,
            "total_groups": 0,
            "avg_fund_size_usd": 0,
            "avg_fund_size_aud": 0,
            "success_rate_percent": 0,
            "monthly_growth_percent": 0,
            "last_updated": datetime.utcnow().isoformat(),
            "data_source": "placeholder"
        }
    
    async def get_platform_metrics(self, force_refresh: bool = False) -> Dict:
        """
        Get all platform metrics for admin dashboard
        Includes: Travel Fund, NFT, Bookings, Smart Dreams
        """
        
        travel_fund = await self.get_travel_fund_metrics(force_refresh)
        
        if not self.enabled:
            return {
                "travel_fund": travel_fund,
                "nft": {"total_minted": 0},
                "bookings": {"total": 0},
                "smart_dreams": {"total_journeys": 0}
            }
        
        try:
            # NFT metrics
            nft_response = self.supabase.table('nft_memberships').select('tier', count='exact').execute()
            total_nft = nft_response.count or 0
            
            # Bookings
            bookings_response = self.supabase.table('bookings').select('id', count='exact').execute()
            total_bookings = bookings_response.count or 0
            
            # Smart Dreams journeys (if table exists)
            try:
                journeys_response = self.supabase.table('smart_dreams_journeys').select('id', count='exact').execute()
                total_journeys = journeys_response.count or 0
            except:
                total_journeys = 0
            
            return {
                "travel_fund": travel_fund,
                "nft": {
                    "total_minted": total_nft,
                },
                "bookings": {
                    "total": total_bookings,
                },
                "smart_dreams": {
                    "total_journeys": total_journeys,
                },
                "last_updated": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to fetch platform metrics: {e}")
            return {
                "travel_fund": travel_fund,
                "nft": {"total_minted": 0},
                "bookings": {"total": 0},
                "smart_dreams": {"total_journeys": 0}
            }

# Singleton instance
unified_metrics = UnifiedMetricsService()
