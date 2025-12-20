"""
Provider & Partner Marketplace API
REST endpoints for provider registry, partner management, inventory, and bidding
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from supabase import create_client, Client
import os
import random

router = APIRouter(prefix="/api", tags=["Provider & Partner Marketplace"])

# Supabase client initialization
def get_supabase_client() -> Client:
    """Get Supabase client from environment"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        )
    
    return create_client(supabase_url, supabase_key)

# ============================================================================
# Pydantic Models
# ============================================================================

class ProviderBase(BaseModel):
    provider_name: str
    provider_type: str
    display_name: str
    supports_hotels: bool = False
    supports_flights: bool = False
    supports_activities: bool = False
    supported_regions: List[str] = []
    priority: int = 50
    is_active: bool = True
    eco_rating: Optional[int] = None
    fee_transparency_score: Optional[int] = None

class ProviderDetail(ProviderBase):
    id: str
    api_base_url: Optional[str] = None
    health_status: str = "unknown"
    avg_response_time_ms: Optional[int] = None
    success_rate_percent: Optional[float] = None
    commission_rate: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class PartnerBase(BaseModel):
    partner_type: str
    business_name: str
    legal_entity_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    country: Optional[str] = None
    properties_count: int = 1
    total_rooms: Optional[int] = None
    star_rating: Optional[float] = None

class PartnerDetail(PartnerBase):
    id: str
    onboarding_status: str = "initiated"
    kyc_status: str = "pending"
    is_active: bool = False
    total_bookings: int = 0
    total_revenue: float = 0
    avg_rating: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class InventoryRecord(BaseModel):
    id: str
    partner_id: str
    property_id: Optional[str] = None
    room_type: str
    date: date
    available_rooms: int
    base_price: float
    dynamic_price: Optional[float] = None
    min_stay_nights: int = 1
    is_blackout: bool = False

class BidCreate(BaseModel):
    user_dream_id: str
    bid_type: str = Field(..., description="hotel, flight, package, activity")
    offer_price: float
    original_price: Optional[float] = None
    discount_percent: Optional[int] = None
    inclusions: Optional[Dict[str, Any]] = None
    conditions: Optional[Dict[str, Any]] = None
    valid_until: datetime

class BidDetail(BidCreate):
    id: str
    partner_id: str
    bid_status: str = "submitted"
    submitted_at: datetime
    is_off_season_offer: bool = False

# ============================================================================
# Provider Registry Endpoints
# ============================================================================

@router.get("/providers/registry", response_model=Dict[str, Any])
async def list_providers(
    provider_type: Optional[str] = Query(None, description="Filter by provider type: hotel, flight, activity"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List all providers in the registry with optional filtering"""
    try:
        supabase = get_supabase_client()
        query = supabase.table('provider_registry').select('*', count='exact')
        
        # Apply filters
        if provider_type:
            query = query.eq('provider_type', provider_type)
        if is_active is not None:
            query = query.eq('is_active', is_active)
        
        # Apply pagination and ordering
        result = query.order('priority').range(offset, offset + limit - 1).execute()
        
        return {
            "success": True,
            "count": result.count,
            "providers": result.data,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": result.count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch providers: {str(e)}")

@router.get("/providers/active", response_model=Dict[str, Any])
async def list_active_providers(
    provider_type: Optional[str] = Query(None, description="Filter by provider type"),
    supported_region: Optional[str] = Query(None, description="Filter by supported region")
):
    """List only active providers, optionally filtered by type and region"""
    try:
        supabase = get_supabase_client()
        query = supabase.table('provider_registry')\
            .select('*', count='exact')\
            .eq('is_active', True)
        
        if provider_type:
            query = query.eq('provider_type', provider_type)
        
        if supported_region:
            query = query.contains('supported_regions', [supported_region])
        
        result = query.order('priority').execute()
        
        return {
            "success": True,
            "count": result.count,
            "providers": result.data,
            "filters_applied": {
                "active_only": True,
                "provider_type": provider_type,
                "supported_region": supported_region
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch active providers: {str(e)}")

@router.get("/providers/{provider_id}", response_model=Dict[str, Any])
async def get_provider_details(provider_id: str):
    """Get detailed information about a specific provider"""
    try:
        supabase = get_supabase_client()
        result = supabase.table('provider_registry').select('*').eq('id', provider_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Provider {provider_id} not found")
        
        provider = result.data[0]
        
        # Get recent health logs
        health_logs = supabase.table('provider_health_logs')\
            .select('*')\
            .eq('provider_id', provider_id)\
            .order('check_time', desc=True)\
            .limit(10)\
            .execute()
        
        return {
            "success": True,
            "provider": provider,
            "recent_health_checks": health_logs.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch provider details: {str(e)}")

@router.get("/providers/rotation/{service_type}", response_model=Dict[str, Any])
async def get_provider_rotation(
    service_type: str,
    region: Optional[str] = Query(None, description="Filter by region")
):
    """Get provider rotation order for a specific service type (hotel, flight, activity)"""
    try:
        supabase = get_supabase_client()
        
        # Build query based on service type
        query = supabase.table('provider_registry')\
            .select('*')\
            .eq('is_active', True)
        
        # Apply service type filter
        if service_type == 'hotel':
            query = query.eq('supports_hotels', True)
        elif service_type == 'flight':
            query = query.eq('supports_flights', True)
        elif service_type == 'activity':
            query = query.eq('supports_activities', True)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid service type: {service_type}")
        
        # Apply region filter if specified
        if region:
            query = query.contains('supported_regions', [region])
        
        result = query.order('priority').execute()
        
        # Calculate rotation order
        providers_with_scores = []
        for idx, provider in enumerate(result.data):
            # Score based on priority (lower is better), health status, and eco rating
            base_score = provider['priority']
            health_bonus = 0 if provider.get('health_status') == 'healthy' else 10
            eco_bonus = -(provider.get('eco_rating', 0) / 10)  # Better eco = lower score
            
            total_score = base_score + health_bonus + eco_bonus
            
            providers_with_scores.append({
                **provider,
                "rotation_order": idx + 1,
                "rotation_score": round(total_score, 2)
            })
        
        return {
            "success": True,
            "service_type": service_type,
            "region": region,
            "provider_count": len(providers_with_scores),
            "rotation": providers_with_scores
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate provider rotation: {str(e)}")

# ============================================================================
# Partner Registry Endpoints
# ============================================================================

@router.get("/partners/registry", response_model=Dict[str, Any])
async def list_partners(
    partner_type: Optional[str] = Query(None, description="Filter by partner type: hotel, airline, activity_provider"),
    onboarding_status: Optional[str] = Query(None, description="Filter by onboarding status"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List all partners in the registry"""
    try:
        supabase = get_supabase_client()
        query = supabase.table('partner_registry').select('*', count='exact')
        
        # Apply filters
        if partner_type:
            query = query.eq('partner_type', partner_type)
        if onboarding_status:
            query = query.eq('onboarding_status', onboarding_status)
        if is_active is not None:
            query = query.eq('is_active', is_active)
        
        result = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        
        return {
            "success": True,
            "count": result.count,
            "partners": result.data,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": result.count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch partners: {str(e)}")

@router.get("/partners/{partner_id}", response_model=Dict[str, Any])
async def get_partner_details(partner_id: str):
    """Get detailed information about a specific partner"""
    try:
        supabase = get_supabase_client()
        
        # Get partner details
        result = supabase.table('partner_registry').select('*').eq('id', partner_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail=f"Partner {partner_id} not found")
        
        partner = result.data[0]
        
        # Get inventory summary
        inventory_result = supabase.table('partner_inventory')\
            .select('*', count='exact')\
            .eq('partner_id', partner_id)\
            .execute()
        
        # Get active bids
        bids_result = supabase.table('partner_bids')\
            .select('*', count='exact')\
            .eq('partner_id', partner_id)\
            .eq('bid_status', 'submitted')\
            .execute()
        
        return {
            "success": True,
            "partner": partner,
            "inventory_records": inventory_result.count,
            "active_bids": bids_result.count,
            "performance": {
                "total_bookings": partner.get('total_bookings', 0),
                "total_revenue": partner.get('total_revenue', 0),
                "avg_rating": partner.get('avg_rating', 0)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch partner details: {str(e)}")

# ============================================================================
# Partner Inventory Endpoints
# ============================================================================

@router.get("/partners/{partner_id}/inventory", response_model=Dict[str, Any])
async def get_partner_inventory(
    partner_id: str,
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    room_type: Optional[str] = Query(None, description="Filter by room type"),
    min_available_rooms: Optional[int] = Query(None, description="Minimum available rooms"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get inventory for a specific partner with date range filtering"""
    try:
        supabase = get_supabase_client()
        query = supabase.table('partner_inventory')\
            .select('*', count='exact')\
            .eq('partner_id', partner_id)
        
        # Apply date filters
        if start_date:
            query = query.gte('date', start_date.isoformat())
        if end_date:
            query = query.lte('date', end_date.isoformat())
        
        # Apply other filters
        if room_type:
            query = query.eq('room_type', room_type)
        if min_available_rooms:
            query = query.gte('available_rooms', min_available_rooms)
        
        result = query.order('date').range(offset, offset + limit - 1).execute()
        
        # Calculate summary statistics
        total_rooms = sum(r['available_rooms'] for r in result.data)
        avg_price = sum(r['base_price'] for r in result.data) / len(result.data) if result.data else 0
        
        return {
            "success": True,
            "partner_id": partner_id,
            "count": result.count,
            "inventory": result.data,
            "summary": {
                "total_available_rooms": total_rooms,
                "average_price": round(avg_price, 2),
                "date_range": {
                    "start": start_date.isoformat() if start_date else "all",
                    "end": end_date.isoformat() if end_date else "all"
                }
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": result.count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch inventory: {str(e)}")

# ============================================================================
# Partner Bidding Endpoints
# ============================================================================

@router.post("/partners/{partner_id}/bids", response_model=Dict[str, Any])
async def create_bid(partner_id: str, bid: BidCreate):
    """Create a new bid for a user's dream"""
    try:
        supabase = get_supabase_client()
        
        # Verify partner exists
        partner_result = supabase.table('partner_registry').select('id').eq('id', partner_id).execute()
        if not partner_result.data:
            raise HTTPException(status_code=404, detail=f"Partner {partner_id} not found")
        
        # Calculate discount if not provided
        discount = bid.discount_percent
        if not discount and bid.original_price:
            discount = int(((bid.original_price - bid.offer_price) / bid.original_price) * 100)
        
        # Prepare bid data
        bid_data = {
            "partner_id": partner_id,
            "user_dream_id": bid.user_dream_id,
            "bid_type": bid.bid_type,
            "offer_price": bid.offer_price,
            "original_price": bid.original_price,
            "discount_percent": discount,
            "inclusions": bid.inclusions or {},
            "conditions": bid.conditions or {},
            "valid_until": bid.valid_until.isoformat(),
            "bid_status": "submitted",
            "submitted_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('partner_bids').insert(bid_data).execute()
        
        return {
            "success": True,
            "message": "Bid created successfully",
            "bid": result.data[0] if result.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bid: {str(e)}")

@router.get("/partners/{partner_id}/bids", response_model=Dict[str, Any])
async def list_partner_bids(
    partner_id: str,
    bid_status: Optional[str] = Query(None, description="Filter by status: submitted, accepted, rejected, expired"),
    user_dream_id: Optional[str] = Query(None, description="Filter by user dream ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List all bids for a specific partner"""
    try:
        supabase = get_supabase_client()
        query = supabase.table('partner_bids')\
            .select('*', count='exact')\
            .eq('partner_id', partner_id)
        
        # Apply filters
        if bid_status:
            query = query.eq('bid_status', bid_status)
        if user_dream_id:
            query = query.eq('user_dream_id', user_dream_id)
        
        result = query.order('submitted_at', desc=True).range(offset, offset + limit - 1).execute()
        
        # Calculate statistics
        status_counts = {}
        for bid in result.data:
            status = bid['bid_status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "success": True,
            "partner_id": partner_id,
            "count": result.count,
            "bids": result.data,
            "statistics": {
                "by_status": status_counts,
                "total_bids": result.count
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": result.count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bids: {str(e)}")

@router.patch("/partners/{partner_id}/bids/{bid_id}", response_model=Dict[str, Any])
async def update_bid_status(
    partner_id: str,
    bid_id: str,
    status: str = Query(..., description="New status: accepted, rejected, withdrawn")
):
    """Update the status of a bid"""
    try:
        valid_statuses = ['accepted', 'rejected', 'withdrawn', 'expired']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        supabase = get_supabase_client()
        
        # Verify bid belongs to partner
        bid_result = supabase.table('partner_bids')\
            .select('*')\
            .eq('id', bid_id)\
            .eq('partner_id', partner_id)\
            .execute()
        
        if not bid_result.data:
            raise HTTPException(status_code=404, detail=f"Bid {bid_id} not found for partner {partner_id}")
        
        # Update bid status
        update_data = {"bid_status": status}
        if status == 'accepted':
            update_data['accepted_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('partner_bids')\
            .update(update_data)\
            .eq('id', bid_id)\
            .execute()
        
        return {
            "success": True,
            "message": f"Bid status updated to {status}",
            "bid": result.data[0] if result.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bid: {str(e)}")

# ============================================================================
# Health & Stats Endpoints
# ============================================================================

@router.get("/marketplace/health", response_model=Dict[str, Any])
async def marketplace_health():
    """Get health status of the marketplace system"""
    try:
        supabase = get_supabase_client()
        
        # Get counts
        providers = supabase.table('provider_registry').select('*', count='exact').execute()
        active_providers = supabase.table('provider_registry').select('*', count='exact').eq('is_active', True).execute()
        partners = supabase.table('partner_registry').select('*', count='exact').execute()
        active_partners = supabase.table('partner_registry').select('*', count='exact').eq('is_active', True).execute()
        inventory = supabase.table('partner_inventory').select('*', count='exact').execute()
        bids = supabase.table('partner_bids').select('*', count='exact').execute()
        
        return {
            "success": True,
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "statistics": {
                "providers": {
                    "total": providers.count,
                    "active": active_providers.count
                },
                "partners": {
                    "total": partners.count,
                    "active": active_partners.count
                },
                "inventory": {
                    "total_records": inventory.count
                },
                "bids": {
                    "total": bids.count
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.get("/marketplace/stats", response_model=Dict[str, Any])
async def marketplace_stats():
    """Get comprehensive marketplace statistics"""
    try:
        supabase = get_supabase_client()
        
        # Provider statistics
        providers = supabase.table('provider_registry').select('provider_type').execute()
        provider_types = {}
        for p in providers.data:
            ptype = p['provider_type']
            provider_types[ptype] = provider_types.get(ptype, 0) + 1
        
        # Partner statistics
        partners = supabase.table('partner_registry').select('partner_type, total_revenue, total_bookings').execute()
        partner_types = {}
        total_revenue = 0
        total_bookings = 0
        for p in partners.data:
            ptype = p['partner_type']
            partner_types[ptype] = partner_types.get(ptype, 0) + 1
            total_revenue += p.get('total_revenue', 0) or 0
            total_bookings += p.get('total_bookings', 0) or 0
        
        # Inventory statistics
        inventory = supabase.table('partner_inventory').select('available_rooms, base_price').execute()
        total_rooms = sum(i['available_rooms'] for i in inventory.data)
        avg_price = sum(i['base_price'] for i in inventory.data) / len(inventory.data) if inventory.data else 0
        
        # Bid statistics
        bids = supabase.table('partner_bids').select('bid_status, offer_price').execute()
        bid_statuses = {}
        total_bid_value = 0
        for b in bids.data:
            status = b['bid_status']
            bid_statuses[status] = bid_statuses.get(status, 0) + 1
            total_bid_value += b.get('offer_price', 0) or 0
        
        return {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "providers": {
                "by_type": provider_types,
                "total": len(providers.data)
            },
            "partners": {
                "by_type": partner_types,
                "total": len(partners.data),
                "total_revenue": round(total_revenue, 2),
                "total_bookings": total_bookings
            },
            "inventory": {
                "total_rooms_available": total_rooms,
                "average_price": round(avg_price, 2),
                "total_records": len(inventory.data)
            },
            "bids": {
                "by_status": bid_statuses,
                "total": len(bids.data),
                "total_value": round(total_bid_value, 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")
