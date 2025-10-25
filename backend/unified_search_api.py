"""
Unified Search API with Provider Rotation
Integrates all provider adapters with intelligent rotation
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime, date
from providers.universal_provider_manager import universal_provider_manager
from providers.base_provider import SearchRequest
from supabase import create_client
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["Unified Search"])


def get_supabase_client():
    """Get Supabase client"""
    return create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )


class UnifiedSearchRequest(BaseModel):
    """Unified search request model"""
    search_type: str  # 'hotel', 'flight', 'activity'
    destination: str
    origin: Optional[str] = None
    check_in: str  # ISO format date
    check_out: Optional[str] = None
    guests: int = 2
    rooms: int = 1
    currency: str = 'USD'
    locale: str = 'en-US'
    eco_priority: bool = True
    region: Optional[str] = None


@router.post("/unified")
async def unified_search(search_request: UnifiedSearchRequest):
    """
    Unified search across all providers with intelligent rotation
    
    Features:
    - Automatic provider rotation
    - Eco-rating prioritization
    - Local suppliers first
    - Failover handling
    - Performance tracking
    
    Args:
        search_request: Search parameters
        
    Returns:
        Search results with provider metadata
    """
    try:
        logger.info(f"🔍 Unified search: {search_request.search_type} in {search_request.destination}")
        
        # Load providers from registry if not already loaded
        supabase = get_supabase_client()
        
        if len(universal_provider_manager.providers) == 0:
            logger.info("📥 Loading providers from registry...")
            await universal_provider_manager.load_providers_from_registry(supabase)
        
        # Create search request for provider adapters
        provider_search_request = SearchRequest(
            search_type=search_request.search_type,
            destination=search_request.destination,
            origin=search_request.origin,
            check_in=search_request.check_in,
            check_out=search_request.check_out,
            guests=search_request.guests,
            rooms=search_request.rooms,
            currency=search_request.currency,
            locale=search_request.locale
        )
        
        # Execute search with rotation
        result = await universal_provider_manager.search_with_rotation(
            service_type=search_request.search_type,
            search_criteria=provider_search_request,
            region=search_request.region,
            eco_priority=search_request.eco_priority
        )
        
        # Log rotation to database
        if result.get('rotation_log'):
            for log_entry in result['rotation_log']:
                try:
                    # Get provider ID
                    provider_name = log_entry.get('provider')
                    provider_result = supabase.table('provider_registry')\
                        .select('id')\
                        .eq('provider_name', provider_name)\
                        .execute()
                    
                    if provider_result.data:
                        provider_id = provider_result.data[0]['id']
                        
                        # Insert rotation log
                        import uuid
                        correlation_id = str(uuid.uuid4())
                        
                        rotation_log_data = {
                            'correlation_id': correlation_id,
                            'service_type': search_request.search_type,
                            'provider_id': provider_id,
                            'attempt_order': result['rotation_log'].index(log_entry) + 1,
                            'success': log_entry.get('success', False),
                            'response_time_ms': log_entry.get('response_time_ms', 0),
                            'error_message': log_entry.get('error'),
                            'search_criteria': search_request.dict(),
                            'result_count': log_entry.get('results_count', 0)
                        }
                        
                        supabase.table('provider_rotation_logs').insert(rotation_log_data).execute()
                        
                except Exception as e:
                    logger.warning(f"Failed to log rotation for {provider_name}: {e}")
        
        return {
            "success": result.get('success', False),
            "search_type": search_request.search_type,
            "destination": search_request.destination,
            "provider_used": result.get('provider'),
            "results": result.get('results', []),
            "total_results": result.get('total_results', 0),
            "response_time_ms": result.get('response_time_ms', 0),
            "rotation_summary": {
                "providers_tried": len(result.get('rotation_log', [])),
                "successful_provider": result.get('provider'),
                "eco_priority_enabled": search_request.eco_priority
            },
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "rotation_log": result.get('rotation_log', [])
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Unified search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/test/provider/{provider_name}")
async def test_provider_search(
    provider_name: str,
    search_type: str = Query('hotel', description="hotel, flight, or activity"),
    destination: str = Query('NYC', description="Destination city/code")
):
    """
    Test individual provider adapter
    
    Useful for debugging and validation
    
    Args:
        provider_name: Provider to test (sabre, hotelbeds, amadeus, local)
        search_type: Type of search
        destination: Destination
        
    Returns:
        Provider-specific search results
    """
    try:
        # Load providers
        supabase = get_supabase_client()
        
        if len(universal_provider_manager.providers) == 0:
            await universal_provider_manager.load_providers_from_registry(supabase)
        
        # Get specific provider
        provider = universal_provider_manager.providers.get(provider_name)
        
        if not provider:
            raise HTTPException(status_code=404, detail=f"Provider {provider_name} not found or not loaded")
        
        # Create test search request
        test_request = SearchRequest(
            search_type=search_type,
            destination=destination,
            check_in=(date.today() + timedelta(days=30)).isoformat(),
            check_out=(date.today() + timedelta(days=33)).isoformat(),
            guests=2,
            rooms=1
        )
        
        # Execute search
        start_time = datetime.now()
        result = await provider.search(test_request)
        response_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return {
            "success": result.success,
            "provider": provider_name,
            "search_type": search_type,
            "destination": destination,
            "results": result.results,
            "total_results": result.total_results,
            "response_time_ms": response_time,
            "metadata": result.metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Provider test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Provider test failed: {str(e)}")


@router.get("/rotation/simulate")
async def simulate_rotation(
    search_type: str = Query('hotel', description="hotel, flight, or activity"),
    region: Optional[str] = Query(None, description="Target region"),
    eco_priority: bool = Query(True, description="Enable eco-priority")
):
    """
    Simulate provider rotation without executing search
    
    Shows which providers would be tried in which order
    
    Args:
        search_type: Type of search
        region: Target region filter
        eco_priority: Enable eco-rating prioritization
        
    Returns:
        Simulated rotation order
    """
    try:
        supabase = get_supabase_client()
        
        # Load providers
        if len(universal_provider_manager.providers) == 0:
            await universal_provider_manager.load_providers_from_registry(supabase)
        
        # Get eligible providers (using internal method)
        eligible = universal_provider_manager._get_eligible_providers(
            search_type,
            region,
            eco_priority
        )
        
        # Get full details for each provider
        rotation_order = []
        for idx, provider_name in enumerate(eligible):
            provider = universal_provider_manager.providers.get(provider_name)
            if provider:
                rotation_order.append({
                    "order": idx + 1,
                    "provider_name": provider_name,
                    "display_name": provider.config.display_name,
                    "priority": provider.config.priority,
                    "eco_rating": provider.config.eco_rating,
                    "fee_transparency": provider.config.fee_transparency_score,
                    "health_status": provider.config.is_active,
                    "reason": self._get_selection_reason(idx, eco_priority)
                })
        
        return {
            "success": True,
            "search_type": search_type,
            "region": region,
            "eco_priority": eco_priority,
            "rotation_order": rotation_order,
            "total_eligible_providers": len(rotation_order),
            "explanation": {
                "local_first": "Local suppliers are always prioritized (priority 1-9)",
                "eco_priority": "Eco-rating considered when eco_priority=true" if eco_priority else "Eco-rating not considered",
                "fallback": "Global providers used if local suppliers unavailable"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Rotation simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
    
    def _get_selection_reason(self, order, eco_priority):
        """Get reason for provider selection order"""
        if order == 0:
            return "Highest priority (local supplier or best eco-rating)" if eco_priority else "Highest priority"
        elif order == 1:
            return "Second choice (backup provider)"
        else:
            return f"Fallback option #{order + 1}"
