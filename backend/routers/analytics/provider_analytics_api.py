"""
Provider Analytics Dashboard API
Real-time provider performance metrics and insights
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
import os

router = APIRouter(prefix="/api/admin/providers", tags=["Provider Analytics"])

def get_supabase_client() -> Client:
    """Get Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    return create_client(supabase_url, supabase_key)


@router.get("/analytics/overview")
async def provider_analytics_overview():
    """
    Provider analytics overview dashboard
    
    Returns:
        - Total providers (active/inactive)
        - Health status distribution
        - Average response times
        - Success rates
        - Top performers
    """
    try:
        supabase = get_supabase_client()
        
        # Get all providers
        providers = supabase.table('provider_registry').select('*').execute()
        
        total_providers = len(providers.data)
        active_providers = len([p for p in providers.data if p.get('is_active')])
        
        # Health status distribution
        health_distribution = {}
        for provider in providers.data:
            status = provider.get('health_status', 'unknown')
            health_distribution[status] = health_distribution.get(status, 0) + 1
        
        # Calculate averages (handle None values)
        avg_response_time = sum([p.get('avg_response_time_ms') or 0 for p in providers.data]) / total_providers if total_providers > 0 else 0
        avg_success_rate = sum([p.get('success_rate_percent') or 0 for p in providers.data]) / total_providers if total_providers > 0 else 0
        
        # Top performers (by success rate, handle None values)
        top_performers = sorted(
            providers.data,
            key=lambda x: (x.get('success_rate_percent') or 0, -(x.get('avg_response_time_ms') or 9999)),
            reverse=True
        )[:5]
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "overview": {
                "total_providers": total_providers,
                "active_providers": active_providers,
                "inactive_providers": total_providers - active_providers,
                "health_distribution": health_distribution,
                "avg_response_time_ms": round(avg_response_time),
                "avg_success_rate_percent": round(avg_success_rate, 2)
            },
            "top_performers": [
                {
                    "provider_name": p.get('provider_name'),
                    "display_name": p.get('display_name'),
                    "success_rate": p.get('success_rate_percent') or 0,
                    "avg_response_time_ms": p.get('avg_response_time_ms') or 0,
                    "health_status": p.get('health_status', 'unknown')
                }
                for p in top_performers
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")


@router.get("/analytics/{provider_id}/detailed")
async def provider_detailed_analytics(
    provider_id: str,
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze")
):
    """
    Detailed analytics for specific provider
    
    Returns:
        - Health check history
        - Response time trends
        - Success rate over time
        - Error analysis
    """
    try:
        supabase = get_supabase_client()
        
        # Get provider info
        provider_result = supabase.table('provider_registry').select('*').eq('id', provider_id).execute()
        
        if not provider_result.data:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        provider = provider_result.data[0]
        
        # Get health logs for specified period
        since_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        health_logs = supabase.table('provider_health_logs')\
            .select('*')\
            .eq('provider_id', provider_id)\
            .gte('check_time', since_date)\
            .order('check_time')\
            .execute()
        
        # Analyze health logs
        total_checks = len(health_logs.data)
        healthy_checks = len([log for log in health_logs.data if log.get('status') == 'healthy'])
        degraded_checks = len([log for log in health_logs.data if log.get('status') == 'degraded'])
        down_checks = len([log for log in health_logs.data if log.get('status') == 'down'])
        
        # Response time trend
        response_times = [
            {
                "timestamp": log.get('check_time'),
                "response_time_ms": log.get('response_time_ms', 0)
            }
            for log in health_logs.data
        ]
        
        # Error analysis
        errors = {}
        for log in health_logs.data:
            if log.get('error_message'):
                error_type = log.get('error_message')[:50]  # First 50 chars
                errors[error_type] = errors.get(error_type, 0) + 1
        
        return {
            "success": True,
            "provider": {
                "id": provider.get('id'),
                "name": provider.get('provider_name'),
                "display_name": provider.get('display_name'),
                "provider_type": provider.get('provider_type'),
                "is_active": provider.get('is_active'),
                "priority": provider.get('priority'),
                "eco_rating": provider.get('eco_rating'),
                "fee_transparency_score": provider.get('fee_transparency_score')
            },
            "period": {
                "days": days,
                "from": since_date,
                "to": datetime.now().isoformat()
            },
            "health_summary": {
                "total_checks": total_checks,
                "healthy": healthy_checks,
                "degraded": degraded_checks,
                "down": down_checks,
                "uptime_percent": round((healthy_checks / total_checks) * 100, 2) if total_checks > 0 else 0
            },
            "response_time_trend": response_times,
            "error_analysis": errors,
            "current_metrics": {
                "health_status": provider.get('health_status'),
                "avg_response_time_ms": provider.get('avg_response_time_ms'),
                "success_rate_percent": provider.get('success_rate_percent'),
                "error_rate_percent": provider.get('error_rate_percent'),
                "last_health_check": provider.get('last_health_check')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch detailed analytics: {str(e)}")


@router.get("/rotation/logs")
async def provider_rotation_logs(
    service_type: Optional[str] = Query(None, description="Filter by service type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """
    Provider rotation logs
    
    Shows how providers are being rotated for searches
    """
    try:
        supabase = get_supabase_client()
        
        query = supabase.table('provider_rotation_logs').select('*', count='exact')
        
        if service_type:
            query = query.eq('service_type', service_type)
        
        result = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        
        # Calculate rotation statistics
        rotation_stats = {}
        for log in result.data:
            provider_id = log.get('provider_id')
            if provider_id:
                if provider_id not in rotation_stats:
                    rotation_stats[provider_id] = {
                        'total_attempts': 0,
                        'successful': 0,
                        'failed': 0
                    }
                
                rotation_stats[provider_id]['total_attempts'] += 1
                if log.get('success'):
                    rotation_stats[provider_id]['successful'] += 1
                else:
                    rotation_stats[provider_id]['failed'] += 1
        
        return {
            "success": True,
            "count": result.count,
            "logs": result.data,
            "rotation_statistics": rotation_stats,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": result.count
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rotation logs: {str(e)}")


@router.post("/analytics/{provider_id}/toggle-active")
async def toggle_provider_active(provider_id: str):
    """
    Toggle provider active status
    
    Admin endpoint to enable/disable providers
    """
    try:
        supabase = get_supabase_client()
        
        # Get current status
        provider_result = supabase.table('provider_registry').select('is_active').eq('id', provider_id).execute()
        
        if not provider_result.data:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        current_status = provider_result.data[0].get('is_active', False)
        new_status = not current_status
        
        # Update status
        update_result = supabase.table('provider_registry')\
            .update({'is_active': new_status, 'updated_at': datetime.now().isoformat()})\
            .eq('id', provider_id)\
            .execute()
        
        return {
            "success": True,
            "provider_id": provider_id,
            "previous_status": current_status,
            "new_status": new_status,
            "message": f"Provider {'activated' if new_status else 'deactivated'} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle provider status: {str(e)}")


@router.post("/analytics/{provider_id}/update-priority")
async def update_provider_priority(
    provider_id: str,
    priority: int = Query(..., ge=1, le=100, description="Priority (lower = higher priority)")
):
    """
    Update provider priority
    
    Allows dynamic adjustment of provider rotation order
    """
    try:
        supabase = get_supabase_client()
        
        # Update priority
        update_result = supabase.table('provider_registry')\
            .update({'priority': priority, 'updated_at': datetime.now().isoformat()})\
            .eq('id', provider_id)\
            .execute()
        
        if not update_result.data:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        return {
            "success": True,
            "provider_id": provider_id,
            "new_priority": priority,
            "message": "Provider priority updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update priority: {str(e)}")


@router.get("/health/summary")
async def provider_health_summary():
    """
    Real-time provider health summary
    
    Quick overview of all provider health statuses
    """
    try:
        supabase = get_supabase_client()
        
        providers = supabase.table('provider_registry').select('*').eq('is_active', True).execute()
        
        health_summary = []
        
        for provider in providers.data:
            health_summary.append({
                "provider_name": provider.get('provider_name'),
                "display_name": provider.get('display_name'),
                "health_status": provider.get('health_status', 'unknown'),
                "avg_response_time_ms": provider.get('avg_response_time_ms', 0),
                "success_rate_percent": provider.get('success_rate_percent', 0),
                "last_check": provider.get('last_health_check'),
                "priority": provider.get('priority'),
                "eco_rating": provider.get('eco_rating')
            })
        
        # Sort by priority
        health_summary.sort(key=lambda x: x['priority'])
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "total_providers": len(health_summary),
            "providers": health_summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch health summary: {str(e)}")
