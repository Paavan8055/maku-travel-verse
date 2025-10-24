"""
Provider Rotation Enforcer
Implements MAKU provider rotation strategy
ENFORCES rotation - no direct provider calls allowed
"""

import os
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Provider rotation configuration per MAKU strategy
PROVIDER_ROTATION_CONFIG = {
    "hotels": [
        {"provider": "sabre", "priority": 1, "type": "local"},
        {"provider": "hotelbeds", "priority": 2, "type": "local"},
        {"provider": "amadeus", "priority": 3, "type": "global"},
        {"provider": "expedia_taap", "priority": 4, "type": "global"},  # To be added
        {"provider": "booking_com", "priority": 5, "type": "global"}  # To be added
    ],
    "flights": [
        {"provider": "amadeus", "priority": 1, "type": "global"},
        {"provider": "sabre", "priority": 2, "type": "global"},
        {"provider": "expedia_taap", "priority": 3, "type": "global"}
    ],
    "activities": [
        {"provider": "viator", "priority": 1, "type": "global"},
        {"provider": "getyourguide", "priority": 2, "type": "global"},
        {"provider": "expedia_taap", "priority": 3, "type": "global"}
    ]
}

# Required provider keys (fail fast on boot if missing)
REQUIRED_PROVIDER_KEYS = {
    "sabre": ["SABRE_CLIENT_ID", "SABRE_CLIENT_SECRET"],
    "hotelbeds": ["HOTELBEDS_API_KEY", "HOTELBEDS_SECRET"],
    "amadeus": ["AMADEUS_API_KEY", "AMADEUS_API_SECRET"],
    "viator": ["VIATOR_API_KEY"],
    "getyourguide": ["GETYOURGUIDE_API_KEY"]
}

class ProviderRotationEnforcer:
    """Enforce provider rotation strategy - no direct calls allowed"""
    
    def __init__(self):
        self.rotation_logs = []  # Track rotation attempts
        self.provider_health = {}  # Track provider health
        self.validate_on_boot()  # Fail fast if keys missing
    
    def validate_on_boot(self):
        """Validate provider configuration on startup - FAIL FAST"""
        missing_keys = []
        
        for provider, keys in REQUIRED_PROVIDER_KEYS.items():
            for key in keys:
                if not os.getenv(key):
                    missing_keys.append(f"{provider}: {key}")
        
        if missing_keys:
            error_msg = f"PROVIDER CONFIGURATION ERROR - Missing required keys:\n" + "\n".join(f"  - {k}" for k in missing_keys)
            logger.error(error_msg)
            logger.warning("Some providers will be unavailable. Add missing keys to .env to enable full rotation.")
        else:
            logger.info("✅ All provider keys configured - full rotation enabled")
    
    async def search_with_rotation(
        self,
        service_type: str,  # "hotels", "flights", "activities"
        search_criteria: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute search with provider rotation
        This is the ONLY allowed way to search - enforces rotation
        
        Returns:
            {
                "results": [...],
                "provider_used": "sabre",
                "attempts": 2,
                "correlation_id": "uuid",
                "rotation_log": [...]
            }
        """
        
        correlation_id = correlation_id or str(uuid.uuid4())
        rotation_config = PROVIDER_ROTATION_CONFIG.get(service_type, [])
        
        if not rotation_config:
            return {
                "error": f"No rotation config for {service_type}",
                "correlation_id": correlation_id
            }
        
        rotation_log = []
        
        # Try each provider in priority order
        for provider_config in rotation_config:
            provider_name = provider_config['provider']
            priority = provider_config['priority']
            
            log_entry = {
                "provider": provider_name,
                "priority": priority,
                "attempted_at": datetime.utcnow().isoformat(),
                "correlation_id": correlation_id
            }
            
            try:
                # Check if provider is healthy
                if not self._is_provider_healthy(provider_name):
                    log_entry['result'] = 'skipped_unhealthy'
                    rotation_log.append(log_entry)
                    logger.warning(f"Skipping unhealthy provider: {provider_name}")
                    continue
                
                # Attempt search
                logger.info(f"🔄 Attempting {service_type} search with {provider_name} (priority {priority})")
                
                results = await self._execute_provider_search(
                    provider_name,
                    service_type,
                    search_criteria
                )
                
                if results and results.get('count', 0) > 0:
                    # Success! Return immediately
                    log_entry['result'] = 'success'
                    log_entry['result_count'] = results['count']
                    rotation_log.append(log_entry)
                    
                    logger.info(f"✅ {provider_name} returned {results['count']} results")
                    
                    # Log rotation success
                    self.rotation_logs.append({
                        "service_type": service_type,
                        "provider_used": provider_name,
                        "attempts": len(rotation_log),
                        "correlation_id": correlation_id,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    return {
                        "results": results['results'],
                        "provider_used": provider_name,
                        "provider_type": provider_config['type'],
                        "attempts": len(rotation_log),
                        "correlation_id": correlation_id,
                        "rotation_log": rotation_log
                    }
                else:
                    # No results, try next provider
                    log_entry['result'] = 'no_results'
                    rotation_log.append(log_entry)
                    logger.warning(f"⚠️  {provider_name} returned 0 results, rotating to next")
                    continue
                    
            except Exception as e:
                # Error, try next provider
                log_entry['result'] = 'error'
                log_entry['error'] = str(e)
                rotation_log.append(log_entry)
                
                logger.error(f"❌ {provider_name} failed: {e}, rotating to next")
                
                # Mark provider as unhealthy
                self._mark_provider_unhealthy(provider_name)
                continue
        
        # All providers failed
        logger.error(f"❌ All providers failed for {service_type}")
        
        return {
            "error": "All providers failed or returned no results",
            "attempts": len(rotation_log),
            "correlation_id": correlation_id,
            "rotation_log": rotation_log
        }
    
    async def _execute_provider_search(
        self,
        provider_name: str,
        service_type: str,
        criteria: Dict
    ) -> Optional[Dict]:
        """Execute search with specific provider"""
        
        # Import provider classes dynamically
        if provider_name == "sabre":
            from enhanced_providers import SabreProvider
            provider = SabreProvider()
        elif provider_name == "amadeus":
            from enhanced_providers import AmadeusProvider
            provider = AmadeusProvider()
        elif provider_name == "viator":
            from enhanced_providers import ViatorProvider
            provider = ViatorProvider()
        else:
            logger.warning(f"Provider {provider_name} not yet implemented")
            return None
        
        # Execute search based on service type
        if service_type == "hotels":
            return await provider.search_hotels(criteria)
        elif service_type == "flights":
            return await provider.search_flights(criteria)
        elif service_type == "activities":
            return await provider.search_activities(criteria)
        else:
            return None
    
    def _is_provider_healthy(self, provider_name: str) -> bool:
        """Check if provider is healthy (not recently failed)"""
        health = self.provider_health.get(provider_name, {})
        
        if not health:
            return True  # Unknown = healthy
        
        # If marked unhealthy, check if cooldown period passed
        if health.get('status') == 'unhealthy':
            marked_at = datetime.fromisoformat(health['marked_at'])
            cooldown_minutes = 5  # 5 minute cooldown
            
            age_minutes = (datetime.utcnow() - marked_at).total_seconds() / 60
            
            if age_minutes < cooldown_minutes:
                return False  # Still in cooldown
            else:
                # Cooldown passed, try again
                self.provider_health[provider_name] = {'status': 'recovering'}
                return True
        
        return True
    
    def _mark_provider_unhealthy(self, provider_name: str):
        """Mark provider as unhealthy (temporary)"""
        self.provider_health[provider_name] = {
            "status": "unhealthy",
            "marked_at": datetime.utcnow().isoformat()
        }
    
    def get_rotation_stats(self) -> Dict:
        """Get rotation statistics"""
        if not self.rotation_logs:
            return {"total_rotations": 0}
        
        # Aggregate stats
        by_provider = {}
        by_service = {}
        
        for log in self.rotation_logs:
            provider = log['provider_used']
            service = log['service_type']
            
            by_provider[provider] = by_provider.get(provider, 0) + 1
            by_service[service] = by_service.get(service, 0) + 1
        
        return {
            "total_rotations": len(self.rotation_logs),
            "by_provider": by_provider,
            "by_service_type": by_service,
            "avg_attempts": sum(log['attempts'] for log in self.rotation_logs) / len(self.rotation_logs)
        }

# Singleton instance
rotation_enforcer = ProviderRotationEnforcer()
