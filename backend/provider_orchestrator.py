"""
Enhanced Provider Orchestrator
Manages multi-provider integration with rotation, failover, and performance monitoring
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import random
import logging
from datetime import datetime, timedelta

from enhanced_providers import (
    ProviderConfig, SearchRequest, ProviderResponse,
    ExpediaProvider, NuiteeProvider, GetYourGuideProvider
)

logger = logging.getLogger(__name__)

@dataclass
class ProviderHealth:
    provider_id: str
    is_healthy: bool = True
    last_success: datetime = None
    last_failure: datetime = None
    failure_count: int = 0
    success_count: int = 0
    avg_response_time: float = 0.0
    error_rate: float = 0.0

class ProviderOrchestrator:
    """Enhanced provider orchestrator with rotation and monitoring"""
    
    def __init__(self):
        self.providers: Dict[str, Any] = {}
        self.health_status: Dict[str, ProviderHealth] = {}
        self.rotation_index: Dict[str, int] = {}
        self.config: Dict[str, ProviderConfig] = {}
        
        # Initialize default configurations
        self._initialize_default_configs()
        self._initialize_providers()

    def _initialize_default_configs(self):
        """Initialize default provider configurations"""
        self.config = {
            "expedia_flights": ProviderConfig(
                provider_id="expedia_flights",
                provider_name="Expedia Flights",
                provider_type="flight",
                base_url="https://api.expediagroup.com",
                api_key=os.environ.get("EXPEDIA_API_KEY", ""),
                api_secret=os.environ.get("EXPEDIA_API_SECRET", ""),
                rate_limit=100,
                timeout=30,
                metadata={"priority": 1, "supports": ["flights"]}
            ),
            "expedia_hotels": ProviderConfig(
                provider_id="expedia_hotels", 
                provider_name="Expedia Hotels",
                provider_type="hotel",
                base_url="https://api.expediagroup.com",
                api_key=os.environ.get("EXPEDIA_API_KEY", ""),
                api_secret=os.environ.get("EXPEDIA_API_SECRET", ""),
                rate_limit=100,
                timeout=30,
                metadata={"priority": 1, "supports": ["hotels"]}
            ),
            "nuitee_hotels": ProviderConfig(
                provider_id="nuitee_hotels",
                provider_name="Nuitée Hotels", 
                provider_type="hotel",
                base_url="https://api.nuitee.com",
                api_key=os.environ.get("NUITEE_API_KEY", ""),
                api_secret=os.environ.get("NUITEE_API_SECRET", ""),
                rate_limit=50,
                timeout=25,
                metadata={"priority": 2, "supports": ["hotels"]}
            ),
            "getyourguide_activities": ProviderConfig(
                provider_id="getyourguide_activities",
                provider_name="GetYourGuide Activities",
                provider_type="activity", 
                base_url="https://api.getyourguide.com",
                api_key=os.environ.get("GETYOURGUIDE_API_KEY", ""),
                api_secret=os.environ.get("GETYOURGUIDE_API_SECRET", ""),
                rate_limit=75,
                timeout=20,
                metadata={"priority": 1, "supports": ["activities"]}
            ),
            # Legacy providers for backward compatibility
            "amadeus": ProviderConfig(
                provider_id="amadeus",
                provider_name="Amadeus",
                provider_type="multi",
                base_url="https://api.amadeus.com",
                api_key=os.environ.get("AMADEUS_CLIENT_ID", ""),
                api_secret=os.environ.get("AMADEUS_CLIENT_SECRET", ""),
                rate_limit=200,
                timeout=30,
                metadata={"priority": 1, "supports": ["flights", "hotels", "activities"]}
            ),
            "sabre": ProviderConfig(
                provider_id="sabre",
                provider_name="Sabre",
                provider_type="multi",
                base_url="https://api.sabre.com",
                api_key=os.environ.get("SABRE_CLIENT_ID", ""),
                api_secret=os.environ.get("SABRE_CLIENT_SECRET", ""),
                rate_limit=150,
                timeout=35,
                metadata={"priority": 2, "supports": ["flights", "hotels"]}
            ),
            "viator": ProviderConfig(
                provider_id="viator",
                provider_name="Viator",
                provider_type="activity",
                base_url="https://api.viator.com",
                api_key=os.environ.get("VIATOR_API_KEY", ""),
                rate_limit=100,
                timeout=25,
                metadata={"priority": 1, "supports": ["activities"]}
            )
        }

    def _initialize_providers(self):
        """Initialize provider instances"""
        # New enhanced providers
        self.providers["expedia_flights"] = ExpediaProvider(self.config["expedia_flights"])
        self.providers["expedia_hotels"] = ExpediaProvider(self.config["expedia_hotels"])
        self.providers["nuitee_hotels"] = NuiteeProvider(self.config["nuitee_hotels"])
        self.providers["getyourguide_activities"] = GetYourGuideProvider(self.config["getyourguide_activities"])
        
        # Initialize health status for all providers
        for provider_id in self.config.keys():
            self.health_status[provider_id] = ProviderHealth(provider_id=provider_id)
            self.rotation_index[provider_id] = 0

    def get_providers_by_type(self, service_type: str) -> List[str]:
        """Get providers that support a specific service type"""
        providers = []
        for provider_id, config in self.config.items():
            if service_type in config.metadata.get("supports", []):
                providers.append(provider_id)
        
        # Sort by priority and health
        providers.sort(key=lambda p: (
            self.config[p].metadata.get("priority", 999),
            not self.health_status[p].is_healthy,
            self.health_status[p].error_rate
        ))
        
        return providers

    def get_next_provider(self, service_type: str) -> Optional[str]:
        """Get next provider using rotation strategy"""
        providers = self.get_providers_by_type(service_type)
        healthy_providers = [p for p in providers if self.health_status[p].is_healthy]
        
        if not healthy_providers:
            # If no healthy providers, try the best available
            healthy_providers = providers[:1] if providers else []
        
        if not healthy_providers:
            return None
        
        # Round-robin within healthy providers
        rotation_key = f"{service_type}_rotation"
        current_index = self.rotation_index.get(rotation_key, 0)
        provider = healthy_providers[current_index % len(healthy_providers)]
        self.rotation_index[rotation_key] = current_index + 1
        
        return provider

    async def search_flights(self, request: SearchRequest, max_providers: int = 3) -> List[ProviderResponse]:
        """Search flights across multiple providers"""
        providers = self.get_providers_by_type("flights")[:max_providers]
        responses = []
        
        tasks = []
        for provider_id in providers:
            if provider_id in ["expedia_flights"]:
                task = self._search_with_provider(provider_id, "flights", request)
                tasks.append(task)
        
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, ProviderResponse):
                    responses.append(result)
                    
        return responses

    async def search_hotels(self, request: SearchRequest, max_providers: int = 3) -> List[ProviderResponse]:
        """Search hotels across multiple providers"""
        providers = self.get_providers_by_type("hotels")[:max_providers]
        responses = []
        
        tasks = []
        for provider_id in providers:
            if provider_id in ["expedia_hotels", "nuitee_hotels"]:
                task = self._search_with_provider(provider_id, "hotels", request)
                tasks.append(task)
        
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, ProviderResponse):
                    responses.append(result)
                    
        return responses

    async def search_activities(self, request: SearchRequest, max_providers: int = 2) -> List[ProviderResponse]:
        """Search activities across multiple providers"""
        providers = self.get_providers_by_type("activities")[:max_providers]
        responses = []
        
        tasks = []
        for provider_id in providers:
            if provider_id in ["getyourguide_activities", "viator"]:
                task = self._search_with_provider(provider_id, "activities", request)
                tasks.append(task)
        
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if isinstance(result, ProviderResponse):
                    responses.append(result)
                    
        return responses

    async def _search_with_provider(self, provider_id: str, service_type: str, request: SearchRequest) -> ProviderResponse:
        """Search with a specific provider and track performance"""
        start_time = time.time()
        health = self.health_status[provider_id]
        
        try:
            provider = self.providers.get(provider_id)
            if not provider:
                raise Exception(f"Provider {provider_id} not initialized")
            
            # Execute search based on service type
            if service_type == "flights":
                response = await provider.search_flights(request)
            elif service_type == "hotels":
                response = await provider.search_hotels(request)
            elif service_type == "activities":
                response = await provider.search_activities(request)
            else:
                raise Exception(f"Unsupported service type: {service_type}")
            
            # Update health metrics on success
            self._update_health_success(provider_id, time.time() - start_time)
            return response
            
        except Exception as e:
            # Update health metrics on failure
            self._update_health_failure(provider_id, str(e))
            
            # Return error response
            return ProviderResponse(
                provider_id=provider_id,
                provider_name=self.config[provider_id].provider_name,
                success=False,
                error_message=str(e),
                response_time_ms=int((time.time() - start_time) * 1000)
            )

    def _update_health_success(self, provider_id: str, response_time: float):
        """Update provider health on successful request"""
        health = self.health_status[provider_id]
        health.last_success = datetime.utcnow()
        health.success_count += 1
        health.is_healthy = True
        
        # Update average response time
        if health.avg_response_time == 0:
            health.avg_response_time = response_time * 1000  # Convert to ms
        else:
            health.avg_response_time = (health.avg_response_time * 0.8) + (response_time * 1000 * 0.2)
        
        # Update error rate
        total_requests = health.success_count + health.failure_count
        health.error_rate = health.failure_count / total_requests if total_requests > 0 else 0

    def _update_health_failure(self, provider_id: str, error_message: str):
        """Update provider health on failed request"""
        health = self.health_status[provider_id]
        health.last_failure = datetime.utcnow()
        health.failure_count += 1
        
        # Mark as unhealthy if too many recent failures
        if health.failure_count > 5:
            health.is_healthy = False
        
        # Update error rate
        total_requests = health.success_count + health.failure_count
        health.error_rate = health.failure_count / total_requests if total_requests > 0 else 0
        
        logger.warning(f"Provider {provider_id} failed: {error_message}")

    async def get_provider_health(self) -> Dict[str, Dict[str, Any]]:
        """Get health status of all providers"""
        health_report = {}
        for provider_id, health in self.health_status.items():
            health_report[provider_id] = {
                "provider_name": self.config[provider_id].provider_name,
                "provider_type": self.config[provider_id].provider_type,
                "is_healthy": health.is_healthy,
                "success_count": health.success_count,
                "failure_count": health.failure_count,
                "error_rate": round(health.error_rate, 4),
                "avg_response_time_ms": round(health.avg_response_time, 2),
                "last_success": health.last_success.isoformat() if health.last_success else None,
                "last_failure": health.last_failure.isoformat() if health.last_failure else None,
                "supports": self.config[provider_id].metadata.get("supports", [])
            }
        return health_report

    async def validate_provider_credentials(self, provider_id: str) -> Dict[str, Any]:
        """Validate credentials for a specific provider"""
        if provider_id not in self.providers:
            return {"valid": False, "error": "Provider not found"}
        
        try:
            provider = self.providers[provider_id]
            is_authenticated = await provider.authenticate()
            
            return {
                "valid": is_authenticated,
                "provider_id": provider_id,
                "provider_name": self.config[provider_id].provider_name,
                "has_credentials": bool(self.config[provider_id].api_key),
                "base_url": self.config[provider_id].base_url
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}

    async def run_health_check(self) -> Dict[str, Any]:
        """Run comprehensive health check on all providers"""
        health_results = {}
        
        for provider_id in self.config.keys():
            try:
                # Basic credential validation
                credentials_check = await self.validate_provider_credentials(provider_id)
                
                # Quick test search (if credentials are valid)
                test_response = None
                if credentials_check.get("valid"):
                    test_request = SearchRequest(
                        destination="New York",
                        checkin_date="2024-12-01",
                        checkout_date="2024-12-03",
                        departure_date="2024-12-01"
                    )
                    
                    if provider_id in ["expedia_flights"]:
                        test_response = await self._search_with_provider(provider_id, "flights", test_request)
                    elif provider_id in ["expedia_hotels", "nuitee_hotels"]:
                        test_response = await self._search_with_provider(provider_id, "hotels", test_request)
                    elif provider_id in ["getyourguide_activities", "viator"]:
                        test_response = await self._search_with_provider(provider_id, "activities", test_request)
                
                health_results[provider_id] = {
                    "provider_name": self.config[provider_id].provider_name,
                    "credentials_valid": credentials_check.get("valid", False),
                    "api_accessible": test_response.success if test_response else False,
                    "response_time_ms": test_response.response_time_ms if test_response else None,
                    "error_message": test_response.error_message if test_response and not test_response.success else None,
                    "health_status": self.health_status[provider_id].is_healthy
                }
                
            except Exception as e:
                health_results[provider_id] = {
                    "provider_name": self.config[provider_id].provider_name,
                    "credentials_valid": False,
                    "api_accessible": False,
                    "error_message": str(e),
                    "health_status": False
                }
        
        return health_results

# Global orchestrator instance
orchestrator = ProviderOrchestrator()

async def get_orchestrator() -> ProviderOrchestrator:
    """Get the global provider orchestrator instance"""
    return orchestrator