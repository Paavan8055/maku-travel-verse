"""
Supabase Configuration Module

This module provides centralized configuration management for the Maku.Travel platform.
It reads from both environment tables and environment_configs tables in Supabase,
providing a unified interface for both Emergent and Lovable backends.

Usage:
    config = SupabaseConfig()
    
    # Get API keys
    amadeus_key = await config.get_secret('AMADEUS_CLIENT_ID')
    
    # Get provider base URLs
    base_url = await config.get_config('amadeus_base_url')
    
    # Get all provider configurations
    provider_configs = await config.get_provider_configs()
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, List
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

class SupabaseConfig:
    """Centralized configuration manager using Supabase"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.supabase_anon_key = os.getenv('SUPABASE_ANON_KEY')
        self.environment = os.getenv('ENVIRONMENT', 'development')
        
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        
        # Use service key if available (for server-side), otherwise anon key
        key = self.supabase_service_key or self.supabase_anon_key
        if not key:
            raise ValueError("Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required")
        
        self.client: Client = create_client(self.supabase_url, key)
        
        # Cache for configurations
        self._config_cache: Dict[str, Any] = {}
        self._secret_cache: Dict[str, str] = {}
        self._cache_ttl = 300  # 5 minutes cache TTL
        self._cache_timestamp = 0
        
        logger.info(f"SupabaseConfig initialized for environment: {self.environment}")
    
    async def _is_cache_valid(self) -> bool:
        """Check if cache is still valid"""
        import time
        return (time.time() - self._cache_timestamp) < self._cache_ttl
    
    async def _update_cache(self):
        """Update configuration cache"""
        import time
        try:
            # Refresh both config and secret caches
            await self._load_configs()
            await self._load_secrets()
            self._cache_timestamp = time.time()
            logger.info("Configuration cache updated")
        except Exception as e:
            logger.error(f"Failed to update cache: {e}")
    
    async def _load_configs(self):
        """Load configurations from environment_configs table"""
        try:
            response = self.client.table('environment_configs').select('*').eq(
                'environment', self.environment
            ).eq('is_active', True).execute()
            
            self._config_cache = {}
            for config in response.data:
                key = config['config_key']
                value = config['config_value']
                # Handle JSON values
                if isinstance(value, str) and value.startswith('"') and value.endswith('"'):
                    value = json.loads(value)
                self._config_cache[key] = value
                
            logger.info(f"Loaded {len(self._config_cache)} configurations")
        except Exception as e:
            logger.error(f"Failed to load configurations: {e}")
    
    async def _load_secrets(self):
        """Load secrets from environment table"""
        try:
            response = self.client.table('environment').select('*').eq(
                'environment', self.environment
            ).eq('is_active', True).execute()
            
            self._secret_cache = {}
            for secret in response.data:
                key = secret['key']
                value = secret['value']
                self._secret_cache[key] = value
                
            logger.info(f"Loaded {len(self._secret_cache)} secrets")
        except Exception as e:
            logger.error(f"Failed to load secrets: {e}")
            # If secrets table doesn't exist yet, that's okay
            pass
    
    async def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get a secret value by key"""
        if not await self._is_cache_valid():
            await self._update_cache()
        
        value = self._secret_cache.get(key, default)
        if value and value.startswith(('your-', 'sk-test-', 'pk-test-')):
            logger.warning(f"Secret {key} appears to be a placeholder value")
        return value
    
    async def get_config(self, key: str, default: Optional[Any] = None) -> Optional[Any]:
        """Get a configuration value by key"""
        if not await self._is_cache_valid():
            await self._update_cache()
        
        return self._config_cache.get(key, default)
    
    async def get_provider_config(self, provider: str) -> Dict[str, Any]:
        """Get configuration for a specific provider"""
        provider_configs = {
            'amadeus': {
                'client_id': await self.get_secret('AMADEUS_CLIENT_ID'),
                'client_secret': await self.get_secret('AMADEUS_CLIENT_SECRET'),
                'base_url': await self.get_config('amadeus_base_url', 
                    'https://test.api.amadeus.com' if self.environment == 'development' 
                    else 'https://api.amadeus.com')
            },
            'sabre': {
                'client_id': await self.get_secret('SABRE_CLIENT_ID'),
                'client_secret': await self.get_secret('SABRE_CLIENT_SECRET'),
                'base_url': await self.get_config('sabre_base_url',
                    'https://api-crt.cert.havail.sabre.com' if self.environment == 'development'
                    else 'https://api.havail.sabre.com')
            },
            'viator': {
                'api_key': await self.get_secret('VIATOR_API_KEY'),
                'base_url': 'https://api.sandbox-viatorapi.com' if self.environment == 'development'
                           else 'https://api.viatorapi.com'
            },
            'duffle': {
                'api_key': await self.get_secret('DUFFLE_API_KEY'),
                'base_url': 'https://api.duffel.com'
            },
            'ratehawk': {
                'api_key': await self.get_secret('RATEHAWK_API_KEY'),
                'base_url': 'https://api.ratehawk.com'
            },
            'expedia': {
                'api_key': await self.get_secret('EXPEDIA_API_KEY'),
                'base_url': 'https://api.ean.com'
            },
            'stripe': {
                'publishable_key': await self.get_secret('STRIPE_PUBLISHABLE_KEY'),
                'secret_key': await self.get_secret('STRIPE_SECRET_KEY'),
                'mode': await self.get_config('stripe_mode', 'test')
            }
        }
        
        return provider_configs.get(provider, {})
    
    async def get_all_provider_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get configuration for all providers"""
        providers = ['amadeus', 'sabre', 'viator', 'duffle', 'ratehawk', 'expedia', 'stripe']
        configs = {}
        
        for provider in providers:
            configs[provider] = await self.get_provider_config(provider)
        
        return configs
    
    async def get_ai_config(self) -> Dict[str, Any]:
        """Get AI/LLM provider configurations"""
        return {
            'openai': {
                'api_key': await self.get_secret('OPENAI_API_KEY'),
                'base_url': 'https://api.openai.com/v1'
            },
            'anthropic': {
                'api_key': await self.get_secret('ANTHROPIC_API_KEY'),
                'base_url': 'https://api.anthropic.com'
            },
            'gemini': {
                'api_key': await self.get_secret('GEMINI_API_KEY'),
                'base_url': 'https://generativelanguage.googleapis.com'
            }
        }
    
    async def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment == 'production'
    
    async def validate_configuration(self) -> Dict[str, Any]:
        """Validate that all required configurations are present"""
        validation_results = {
            'valid': True,
            'missing_configs': [],
            'missing_secrets': [],
            'environment': self.environment
        }
        
        # Required configurations
        required_configs = [
            'amadeus_base_url',
            'sabre_base_url',
            'stripe_mode'
        ]
        
        # Required secrets
        required_secrets = [
            'AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET',
            'SABRE_CLIENT_ID', 'SABRE_CLIENT_SECRET',
            'STRIPE_SECRET_KEY'
        ]
        
        # Check configurations
        for config_key in required_configs:
            config_value = await self.get_config(config_key)
            if not config_value:
                validation_results['missing_configs'].append(config_key)
                validation_results['valid'] = False
        
        # Check secrets
        for secret_key in required_secrets:
            secret_value = await self.get_secret(secret_key)
            if not secret_value or secret_value.startswith('your-'):
                validation_results['missing_secrets'].append(secret_key)
                validation_results['valid'] = False
        
        return validation_results

# Global instance
_config_instance = None

def get_config_instance() -> SupabaseConfig:
    """Get global configuration instance"""
    global _config_instance
    if _config_instance is None:
        _config_instance = SupabaseConfig()
    return _config_instance

# Convenience functions
async def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """Get a secret value"""
    config = get_config_instance()
    return await config.get_secret(key, default)

async def get_config(key: str, default: Optional[Any] = None) -> Optional[Any]:
    """Get a configuration value"""
    config = get_config_instance()
    return await config.get_config(key, default)

async def get_provider_config(provider: str) -> Dict[str, Any]:
    """Get provider configuration"""
    config = get_config_instance()
    return await config.get_provider_config(provider)

async def get_all_provider_configs() -> Dict[str, Dict[str, Any]]:
    """Get all provider configurations"""
    config = get_config_instance()
    return await config.get_all_provider_configs()

async def validate_configuration() -> Dict[str, Any]:
    """Validate configuration"""
    config = get_config_instance()
    return await config.validate_configuration()