"""
Destination Content API
Serves spiritual sites, hidden gems, and local businesses
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any, Optional
import sys
sys.path.append('/app/backend/data')
from destinations_database import DESTINATIONS_EXPANDED, get_destination_stats

router = APIRouter(prefix="/api/destinations", tags=["Destination Content"])


@router.get("/all")
async def get_all_destinations():
    """
    Get list of all destinations
    
    Returns:
        List of destinations with basic info
    """
    destinations = []
    
    for name, data in DESTINATIONS_EXPANDED.items():
        destinations.append({
            "name": name,
            "country_code": data['country_code'],
            "region": data['region'],
            "currency": data['currency'],
            "spiritual_sites_count": len(data.get('spiritual_sites', [])),
            "hidden_gems_count": len(data.get('hidden_gems', [])),
            "local_businesses_count": len(data.get('local_businesses', []))
        })
    
    # Sort by region, then name
    destinations.sort(key=lambda x: (x['region'], x['name']))
    
    stats = get_destination_stats()
    
    return {
        "success": True,
        "destinations": destinations,
        "total_count": len(destinations),
        "statistics": stats
    }


@router.get("/{destination_name}")
async def get_destination_details(destination_name: str):
    """
    Get comprehensive details for specific destination
    
    Args:
        destination_name: Destination name (e.g., "India", "Japan", "Peru")
        
    Returns:
        Full destination content including spiritual sites, hidden gems, local businesses
    """
    destination = DESTINATIONS_EXPANDED.get(destination_name)
    
    if not destination:
        raise HTTPException(status_code=404, detail=f"Destination '{destination_name}' not found")
    
    return {
        "success": True,
        "destination": {
            "name": destination_name,
            "country_code": destination['country_code'],
            "region": destination['region'],
            "currency": destination['currency'],
            "spiritual_sites": destination.get('spiritual_sites', []),
            "hidden_gems": destination.get('hidden_gems', []),
            "local_businesses": destination.get('local_businesses', []),
            "total_experiences": (
                len(destination.get('spiritual_sites', [])) +
                len(destination.get('hidden_gems', [])) +
                len(destination.get('local_businesses', []))
            )
        }
    }


@router.get("/search/by-region")
async def search_destinations_by_region(
    region: str = Query(..., description="Region name: Asia, Europe, Africa, Middle East, etc.")
):
    """
    Find all destinations in a specific region
    
    Args:
        region: Region name
        
    Returns:
        List of destinations in that region
    """
    matching_destinations = []
    
    for name, data in DESTINATIONS_EXPANDED.items():
        if data['region'].lower() == region.lower():
            matching_destinations.append({
                "name": name,
                "country_code": data['country_code'],
                "currency": data['currency'],
                "experiences_count": (
                    len(data.get('spiritual_sites', [])) +
                    len(data.get('hidden_gems', [])) +
                    len(data.get('local_businesses', []))
                )
            })
    
    return {
        "success": True,
        "region": region,
        "destinations": matching_destinations,
        "count": len(matching_destinations)
    }


@router.get("/spiritual-sites/all")
async def get_all_spiritual_sites():
    """
    Get all spiritual sites across all destinations
    
    Returns:
        Comprehensive list of spiritual/cultural sites
    """
    all_sites = []
    
    for destination_name, data in DESTINATIONS_EXPANDED.items():
        for site in data.get('spiritual_sites', []):
            all_sites.append({
                **site,
                "destination": destination_name,
                "region": data['region']
            })
    
    return {
        "success": True,
        "spiritual_sites": all_sites,
        "total_count": len(all_sites),
        "by_type": _count_by_field(all_sites, 'type')
    }


@router.get("/hidden-gems/all")
async def get_all_hidden_gems():
    """
    Get all hidden gems across all destinations
    
    Returns:
        Comprehensive list of off-the-beaten-path experiences
    """
    all_gems = []
    
    for destination_name, data in DESTINATIONS_EXPANDED.items():
        for gem in data.get('hidden_gems', []):
            all_gems.append({
                **gem,
                "destination": destination_name,
                "region": data['region']
            })
    
    # Sort by crowd level (very_low first)
    crowd_order = {'very_low': 0, 'low': 1, 'medium': 2, 'high': 3}
    all_gems.sort(key=lambda x: crowd_order.get(x.get('crowd_level', 'high'), 4))
    
    return {
        "success": True,
        "hidden_gems": all_gems,
        "total_count": len(all_gems),
        "by_crowd_level": _count_by_field(all_gems, 'crowd_level')
    }


@router.get("/local-businesses/all")
async def get_all_local_businesses():
    """
    Get all local businesses across all destinations
    
    Returns:
        Comprehensive list of local experiences
    """
    all_businesses = []
    
    for destination_name, data in DESTINATIONS_EXPANDED.items():
        for business in data.get('local_businesses', []):
            all_businesses.append({
                **business,
                "destination": destination_name,
                "region": data['region'],
                "currency": data['currency']
            })
    
    # Sort by price (lowest first)
    all_businesses.sort(key=lambda x: x.get('price', 999))
    
    return {
        "success": True,
        "local_businesses": all_businesses,
        "total_count": len(all_businesses),
        "by_type": _count_by_field(all_businesses, 'type'),
        "avg_price": sum(b.get('price', 0) for b in all_businesses) / len(all_businesses) if all_businesses else 0
    }


@router.get("/recommendations/for-user")
async def get_destination_recommendations(
    user_preferences: Optional[str] = Query(None, description="spiritual, adventure, food, culture"),
    budget: Optional[str] = Query(None, description="budget, mid-range, luxury"),
    crowd_preference: Optional[str] = Query(None, description="very_low, low, medium, high")
):
    """
    Get personalized destination recommendations
    
    Args:
        user_preferences: User interest type
        budget: Budget category
        crowd_preference: Crowd level preference
        
    Returns:
        Recommended destinations matching criteria
    """
    recommendations = []
    
    for destination_name, data in DESTINATIONS_EXPANDED.items():
        score = 0
        reasons = []
        
        # Score based on spiritual sites if user prefers spiritual
        if user_preferences == 'spiritual':
            spiritual_count = len(data.get('spiritual_sites', []))
            if spiritual_count > 0:
                score += spiritual_count * 10
                reasons.append(f"{spiritual_count} spiritual sites")
        
        # Score based on hidden gems if user prefers adventure
        if user_preferences == 'adventure':
            gems_count = len(data.get('hidden_gems', []))
            if gems_count > 0:
                score += gems_count * 10
                reasons.append(f"{gems_count} hidden gems")
        
        # Score based on local businesses if user prefers food/culture
        if user_preferences in ['food', 'culture']:
            business_count = len(data.get('local_businesses', []))
            if business_count > 0:
                score += business_count * 10
                reasons.append(f"{business_count} local experiences")
        
        # Budget matching
        if budget:
            avg_price = sum(b.get('price', 0) for b in data.get('local_businesses', [])) / max(len(data.get('local_businesses', [])), 1)
            
            if budget == 'budget' and avg_price < 50:
                score += 20
                reasons.append("Budget-friendly")
            elif budget == 'mid-range' and 50 <= avg_price <= 100:
                score += 20
                reasons.append("Mid-range pricing")
            elif budget == 'luxury' and avg_price > 100:
                score += 20
                reasons.append("Luxury experiences")
        
        # Crowd preference matching
        if crowd_preference:
            gems = data.get('hidden_gems', [])
            matching_crowd = len([g for g in gems if g.get('crowd_level') == crowd_preference])
            if matching_crowd > 0:
                score += matching_crowd * 15
                reasons.append(f"{matching_crowd} {crowd_preference} crowd spots")
        
        if score > 0:
            recommendations.append({
                "destination": destination_name,
                "score": score,
                "reasons": reasons,
                "region": data['region'],
                "currency": data['currency']
            })
    
    # Sort by score
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    
    return {
        "success": True,
        "recommendations": recommendations[:10],  # Top 10
        "criteria": {
            "user_preferences": user_preferences,
            "budget": budget,
            "crowd_preference": crowd_preference
        }
    }


def _count_by_field(items: List[Dict], field: str) -> Dict[str, int]:
    """Helper to count items by field value"""
    counts = {}
    for item in items:
        value = item.get(field, 'unknown')
        counts[value] = counts.get(value, 0) + 1
    return counts
