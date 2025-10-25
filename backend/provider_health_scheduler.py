"""
Provider Health Monitoring Scheduler
Scheduled health checks every 5 minutes with Supabase logging
"""

import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from providers.universal_provider_manager import universal_provider_manager
from supabase import create_client, Client
import os

logger = logging.getLogger(__name__)

# Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')


def get_supabase_client() -> Client:
    """Get Supabase client"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise Exception("Supabase credentials not configured")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


async def run_health_checks():
    """
    Run health checks on all providers
    Log results to provider_health_logs table
    """
    try:
        logger.info("🏥 Running scheduled provider health checks...")
        
        # Run health checks
        health_results = await universal_provider_manager.health_check_all()
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Log each result to database
        for provider_name, result in health_results.items():
            try:
                # Get provider ID from registry
                provider_response = supabase.table('provider_registry')\
                    .select('id')\
                    .eq('provider_name', provider_name)\
                    .execute()
                
                if not provider_response.data:
                    logger.warning(f"Provider {provider_name} not found in registry")
                    continue
                
                provider_id = provider_response.data[0]['id']
                
                # Insert health log
                log_data = {
                    'provider_id': provider_id,
                    'check_time': datetime.now().isoformat(),
                    'status': result.get('status', 'unknown'),
                    'response_time_ms': result.get('response_time_ms', 0),
                    'error_message': result.get('details', {}).get('error'),
                    'metadata': result.get('details', {})
                }
                
                supabase.table('provider_health_logs').insert(log_data).execute()
                
                # Update provider_registry with latest health
                update_data = {
                    'health_status': result.get('status', 'unknown'),
                    'last_health_check': datetime.now().isoformat(),
                    'avg_response_time_ms': result.get('response_time_ms', 0)
                }
                
                supabase.table('provider_registry')\
                    .update(update_data)\
                    .eq('id', provider_id)\
                    .execute()
                
                status_icon = "✅" if result.get('status') == 'healthy' else "⚠️" if result.get('status') == 'degraded' else "❌"
                logger.info(f"   {status_icon} {provider_name}: {result.get('status')} ({result.get('response_time_ms', 0)}ms)")
                
            except Exception as e:
                logger.error(f"Failed to log health check for {provider_name}: {e}")
        
        logger.info(f"✅ Health check complete for {len(health_results)} providers")
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")


async def calculate_provider_metrics():
    """
    Calculate and update provider performance metrics
    Run every hour
    """
    try:
        logger.info("📊 Calculating provider metrics...")
        
        supabase = get_supabase_client()
        
        # Get all active providers
        providers = supabase.table('provider_registry')\
            .select('id, provider_name')\
            .eq('is_active', True)\
            .execute()
        
        for provider in providers.data:
            provider_id = provider['id']
            provider_name = provider['provider_name']
            
            # Calculate metrics from logs (last 24 hours)
            logs = supabase.table('provider_health_logs')\
                .select('*')\
                .eq('provider_id', provider_id)\
                .gte('check_time', (datetime.now() - timedelta(hours=24)).isoformat())\
                .execute()
            
            if logs.data:
                total_checks = len(logs.data)
                healthy_checks = len([log for log in logs.data if log['status'] == 'healthy'])
                total_response_time = sum([log['response_time_ms'] for log in logs.data])
                
                success_rate = (healthy_checks / total_checks) * 100 if total_checks > 0 else 0
                avg_response_time = total_response_time / total_checks if total_checks > 0 else 0
                error_rate = ((total_checks - healthy_checks) / total_checks) * 100 if total_checks > 0 else 0
                
                # Update provider registry
                update_data = {
                    'success_rate_percent': round(success_rate, 2),
                    'avg_response_time_ms': round(avg_response_time),
                    'error_rate_percent': round(error_rate, 2)
                }
                
                supabase.table('provider_registry')\
                    .update(update_data)\
                    .eq('id', provider_id)\
                    .execute()
                
                logger.info(f"   📈 {provider_name}: {success_rate:.1f}% success, {avg_response_time:.0f}ms avg")
        
        logger.info("✅ Metrics calculation complete")
        
    except Exception as e:
        logger.error(f"❌ Metrics calculation failed: {e}")


# Create scheduler
scheduler = AsyncIOScheduler()


def start_health_monitoring():
    """Start health monitoring scheduler"""
    logger.info("🚀 Starting provider health monitoring scheduler...")
    
    # Health checks every 5 minutes
    scheduler.add_job(
        run_health_checks,
        trigger=IntervalTrigger(minutes=5),
        id='provider_health_check',
        name='Provider Health Check',
        replace_existing=True
    )
    
    # Metrics calculation every hour
    scheduler.add_job(
        calculate_provider_metrics,
        trigger=IntervalTrigger(hours=1),
        id='provider_metrics',
        name='Provider Metrics Calculation',
        replace_existing=True
    )
    
    # Start scheduler
    scheduler.start()
    logger.info("✅ Health monitoring scheduler started")


def stop_health_monitoring():
    """Stop health monitoring scheduler"""
    logger.info("🛑 Stopping provider health monitoring scheduler...")
    scheduler.shutdown()
    logger.info("✅ Health monitoring scheduler stopped")


# Run immediately on module import if configured
if __name__ == "__main__":
    import asyncio
    from datetime import timedelta
    
    # Run health check once
    asyncio.run(run_health_checks())
