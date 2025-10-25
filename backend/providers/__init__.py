"""
Provider Adapters Module
Universal provider plugin architecture
"""

from .base_provider import (
    BaseProvider,
    ProviderConfig,
    ProviderCapabilities,
    SearchRequest,
    SearchResponse
)

from .universal_provider_manager import (
    UniversalProviderManager,
    universal_provider_manager
)

__all__ = [
    'BaseProvider',
    'ProviderConfig',
    'ProviderCapabilities',
    'SearchRequest',
    'SearchResponse',
    'UniversalProviderManager',
    'universal_provider_manager'
]
