"""
Universal Provider Interface
All providers must implement this interface for plugin architecture
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class ProviderCapabilities(BaseModel):
    """What this provider can do"""
    supports_hotels: bool = False
    supports_flights: bool = False
    supports_activities: bool = False
    supports_cars: bool = False
    supports_packages: bool = False
    supports_real_time_availability: bool = False
    supports_cancellation: bool = False
    supports_modifications: bool = False

class ProviderConfig(BaseModel):
    """Provider configuration from registry"""
    provider_id: str
    provider_name: str
    display_name: str
    api_base_url: str
    priority: int
    eco_rating: int
    fee_transparency_score: int
    is_active: bool
    is_test_mode: bool
    capabilities: ProviderCapabilities
    supported_regions: List[str]
    commission_rate: Optional[float] = 0.15  # Default 15%

class SearchRequest(BaseModel):
    """Universal search request"""
    search_type: str  # 'hotel', 'flight', 'activity', 'car'
    destination: Optional[str] = None
    origin: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    guests: int = 2
    rooms: int = 1
    currency: str = 'USD'
    locale: str = 'en-US'

class SearchResponse(BaseModel):
    """Universal search response"""
    success: bool
    provider: str
    results: List[Dict[str, Any]]
    total_results: int
    response_time_ms: int
    cached: bool = False
    metadata: Dict[str, Any] = {}

class BaseProvider(ABC):
    """
    Universal Provider Interface
    All providers MUST implement these methods
    """
    
    def __init__(self, config: ProviderConfig, credentials: Dict[str, str]):
        self.config = config
        self.credentials = credentials
        self.is_authenticated = False
    
    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Authenticate with provider API
        Returns: True if successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        Execute search based on type
        Returns: SearchResponse with results
        """
        pass
    
    @abstractmethod
    async def get_availability(self, item_id: str, dates: Dict[str, str]) -> Dict[str, Any]:
        """
        Check real-time availability for specific item
        """
        pass
    
    @abstractmethod
    async def get_quote(self, item_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get detailed pricing quote
        """
        pass
    
    @abstractmethod
    async def book(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute booking
        """
        pass
    
    @abstractmethod
    async def cancel(self, booking_id: str, reason: str) -> Dict[str, Any]:
        """
        Cancel existing booking
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Provider health check
        Returns: {\"status\": \"healthy|degraded|down\", \"response_time_ms\": 123, \"details\": {}}
        """
        pass
    
    # Helper methods (implemented in base class)
    def is_healthy(self) -> bool:
        """Check if provider is currently healthy"""
        return self.config.is_active and self.config.priority < 100
    
    def supports_search_type(self, search_type: str) -> bool:
        """Check if provider supports this search type"""
        if search_type == 'hotel':
            return self.config.capabilities.supports_hotels
        elif search_type == 'flight':
            return self.config.capabilities.supports_flights
        elif search_type == 'activity':
            return self.config.capabilities.supports_activities
        elif search_type == 'car':
            return self.config.capabilities.supports_cars
        return False
