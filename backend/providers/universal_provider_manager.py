"""
Universal Provider Manager
Configuration-driven provider rotation with plugin architecture
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import importlib
import asyncio

logger = logging.getLogger(__name__)

class UniversalProviderManager:
    """
    Manages all providers using configuration from Supabase registry
    Supports dynamic provider addition without code changes
    """
    
    def __init__(self):
        self.providers = {}  # Loaded provider instances
        self.registry = []  # Provider configurations from DB
        self.provider_adapters = {}  # Provider class mappings
        
        # Register available provider adapters
        self._register_default_adapters()
    
    def _register_default_adapters(self):
        """Register built-in provider adapters"""
        self.provider_adapters = {
            'sabre': 'providers.sabre_adapter.SabreProvider',
            'hotelbeds': 'providers.hotelbeds_adapter.HotelBedsProvider',
            'amadeus': 'providers.amadeus_adapter.AmadeusProvider',
            'expedia_taap': 'providers.expedia_adapter.ExpediaProvider',
            'booking_com': 'providers.booking_adapter.BookingProvider',
            'viator': 'providers.viator_adapter.ViatorProvider',
            'getyourguide': 'providers.getyourguide_adapter.GetYourGuideProvider'
        }
    
    async def load_providers_from_registry(self, supabase_client):
        """
        Load active providers from Supabase registry
        This allows adding providers without code changes
        """
        try:
            # Fetch active providers ordered by priority
            response = await supabase_client.table('provider_registry').select('*').eq('is_active', True).order('priority').execute()
            
            self.registry = response.data if response.data else []
            
            # Load each provider
            for provider_config in self.registry:
                await self._load_provider(provider_config, supabase_client)
            
            logger.info(f"✅ Loaded {len(self.providers)} active providers from registry")
            
        except Exception as e:
            logger.error(f"Failed to load provider registry: {e}")
            # Fallback to hardcoded config (not implemented yet)
            # self._load_fallback_providers()
            logger.warning("No fallback providers configured - continuing with empty provider list")
    
    async def _load_provider(self, config: Dict[str, Any], supabase_client):
        """Load individual provider instance"""
        try:
            provider_name = config['provider_name']
            
            # Get adapter class path
            adapter_path = self.provider_adapters.get(provider_name)
            if not adapter_path:
                logger.warning(f"No adapter found for provider: {provider_name}")
                return
            
            # Dynamically import provider class
            module_path, class_name = adapter_path.rsplit('.', 1)
            module = importlib.import_module(module_path)
            ProviderClass = getattr(module, class_name)
            
            # Get credentials from Supabase Vault
            credentials = await self._get_provider_credentials(config['id'], supabase_client)
            
            # Instantiate provider
            provider_instance = ProviderClass(config, credentials)
            
            # Authenticate
            if config['requires_authentication']:
                auth_success = await provider_instance.authenticate()
                if not auth_success:
                    logger.warning(f"Provider {provider_name} authentication failed")
                    return
            
            # Store in active providers
            self.providers[provider_name] = provider_instance
            logger.info(f"✅ Provider {provider_name} loaded and authenticated")
            
        except Exception as e:
            logger.error(f"Failed to load provider {config.get('provider_name')}: {e}")
    
    async def _get_provider_credentials(self, provider_id: str, supabase_client) -> Dict[str, str]:
        """
        Retrieve provider credentials from Supabase Vault
        """
        try:
            response = await supabase_client.table('provider_credentials').select('*').eq('provider_id', provider_id).eq('is_active', True).execute()
            
            credentials = {}
            for cred in response.data:
                # TODO: Decrypt from Supabase Vault
                # For now, return placeholder
                credentials[cred['credential_key']] = 'VAULT_SECRET_' + cred['credential_value_vault_id']
            
            return credentials
            
        except Exception as e:
            logger.error(f"Failed to retrieve credentials: {e}")
            return {}
    
    async def search_with_rotation(
        self,
        service_type: str,
        search_criteria: Dict[str, Any],
        region: Optional[str] = None,
        eco_priority: bool = True
    ) -> Dict[str, Any]:
        """
        Execute search with intelligent provider rotation
        
        Args:
            service_type: 'hotel', 'flight', 'activity', 'car'
            search_criteria: Search parameters
            region: Target region for regional preference
            eco_priority: Prioritize eco-friendly providers
        
        Returns:
            Search results with provider metadata
        """
        
        # Get eligible providers
        eligible_providers = self._get_eligible_providers(service_type, region, eco_priority)
        
        if not eligible_providers:
            return {
                "success": False,
                "error": "No providers available for this search",
                "provider": None
            }
        
        rotation_log = []
        
        # Try each provider in priority order
        for provider_name in eligible_providers:
            provider = self.providers.get(provider_name)
            if not provider:
                continue
            
            try:
                start_time = datetime.now()
                
                # Execute search
                result = await provider.search(search_criteria)
                
                response_time = (datetime.now() - start_time).total_seconds() * 1000
                
                rotation_log.append({
                    "provider": provider_name,
                    "success": result.success,
                    "response_time_ms": response_time,
                    "results_count": len(result.results) if result.success else 0
                })
                
                if result.success and len(result.results) > 0:
                    logger.info(f"✅ Search successful via {provider_name} ({response_time:.0f}ms)")
                    
                    return {
                        "success": True,
                        "provider": provider_name,
                        "results": result.results,
                        "total_results": result.total_results,
                        "response_time_ms": response_time,
                        "rotation_log": rotation_log
                    }
                
            except Exception as e:
                logger.warning(f"Provider {provider_name} failed: {e}")
                rotation_log.append({
                    "provider": provider_name,
                    "success": False,
                    "error": str(e)
                })
                continue
        
        # All providers failed
        return {
            "success": False,
            "error": "All providers failed",
            "provider": None,
            "rotation_log": rotation_log
        }
    
    def _get_eligible_providers(
        self,
        service_type: str,
        region: Optional[str],
        eco_priority: bool
    ) -> List[str]:
        """
        Get sorted list of eligible providers based on criteria
        """
        eligible = []
        
        for provider_name, provider in self.providers.items():
            # Check if supports service type
            if not provider.supports_search_type(service_type):
                continue
            
            # Check region if specified
            if region and region not in provider.config.supported_regions:
                continue
            
            # Check health
            if not provider.is_healthy():
                continue
            
            eligible.append({
                'name': provider_name,
                'priority': provider.config.priority,
                'eco_rating': provider.config.eco_rating,
                'fee_transparency': provider.config.fee_transparency_score
            })
        
        # Sort by criteria
        if eco_priority:
            # Eco-friendly first, then priority
            eligible.sort(key=lambda x: (-x['eco_rating'], x['priority']))
        else:
            # Priority only
            eligible.sort(key=lambda x: x['priority'])
        
        return [p['name'] for p in eligible]
    
    async def health_check_all(self) -> Dict[str, Any]:
        """Run health check on all providers"""
        health_results = {}
        
        tasks = [
            self._check_provider_health(name, provider)
            for name, provider in self.providers.items()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for (name, _), result in zip(self.providers.items(), results):
            if isinstance(result, Exception):
                health_results[name] = {'status': 'error', 'message': str(result)}
            else:
                health_results[name] = result
        
        return health_results
    
    async def _check_provider_health(self, name: str, provider) -> Dict[str, Any]:
        """Check individual provider health"""
        try:
            result = await provider.health_check()
            return {
                'provider': name,
                'status': result.get('status', 'unknown'),
                'response_time_ms': result.get('response_time_ms', 0),
                'last_check': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'provider': name,
                'status': 'down',
                'error': str(e)
            }

# Global instance
universal_provider_manager = UniversalProviderManager()
