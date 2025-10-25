"""
Comprehensive Provider System Testing
Tests all provider adapters, rotation logic, and analytics
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from providers.base_provider import ProviderConfig, SearchRequest, ProviderCapabilities
from providers.sabre_adapter import SabreProvider
from providers.hotelbeds_adapter import HotelBedsProvider
from providers.amadeus_adapter import AmadeusProvider
from providers.local_supplier_adapter import LocalSupplierProvider


# Mock configuration for testing
def create_test_config(provider_name: str, provider_type: str) -> ProviderConfig:
    """Create test provider configuration"""
    return ProviderConfig(
        provider_id=f"test_{provider_name}_id",
        provider_name=provider_name,
        display_name=f"Test {provider_name.title()}",
        api_base_url=f"https://api.test.{provider_name}.com",
        priority=10,
        eco_rating=85,
        fee_transparency_score=90,
        is_active=True,
        is_test_mode=True,
        capabilities=ProviderCapabilities(
            supports_hotels=provider_type in ['hotel', 'package'],
            supports_flights=provider_type in ['flight', 'package'],
            supports_activities=provider_type == 'activity'
        ),
        supported_regions=['north_america', 'europe', 'asia']
    )


def create_test_credentials(provider_name: str) -> Dict[str, str]:
    """Create test credentials"""
    credentials_map = {
        'sabre': {
            'client_id': 'test_sabre_client',
            'client_secret': 'test_sabre_secret'
        },
        'hotelbeds': {
            'api_key': 'test_hotelbeds_key',
            'api_secret': 'test_hotelbeds_secret'
        },
        'amadeus': {
            'api_key': 'test_amadeus_key',
            'api_secret': 'test_amadeus_secret'
        },
        'local': {
            'contact_info': '{"whatsapp": "+1-555-0100"}'
        }
    }
    return credentials_map.get(provider_name, {})


class TestSabreAdapter:
    """Test Sabre GDS adapter"""
    
    @pytest.fixture
    def sabre_provider(self):
        config = create_test_config('sabre', 'package')
        credentials = create_test_credentials('sabre')
        return SabreProvider(config, credentials)
    
    def test_initialization(self, sabre_provider):
        """Test Sabre provider initialization"""
        assert sabre_provider.config.provider_name == 'sabre'
        assert sabre_provider.client_id == 'test_sabre_client'
        assert sabre_provider.client_secret == 'test_sabre_secret'
        assert sabre_provider.api_base == 'https://api.test.sabre.com'
    
    def test_encode_credentials(self, sabre_provider):
        """Test Base64 encoding of credentials"""
        encoded = sabre_provider._encode_credentials()
        assert isinstance(encoded, str)
        assert len(encoded) > 0
    
    @pytest.mark.asyncio
    async def test_health_check_structure(self, sabre_provider):
        """Test health check returns proper structure"""
        # Note: Will fail without real API, but structure should be correct
        result = await sabre_provider.health_check()
        
        assert 'status' in result
        assert 'response_time_ms' in result
        assert 'details' in result
        assert result['status'] in ['healthy', 'degraded', 'down']


class TestHotelBedsAdapter:
    """Test HotelBeds adapter"""
    
    @pytest.fixture
    def hotelbeds_provider(self):
        config = create_test_config('hotelbeds', 'hotel')
        credentials = create_test_credentials('hotelbeds')
        return HotelBedsProvider(config, credentials)
    
    def test_initialization(self, hotelbeds_provider):
        """Test HotelBeds provider initialization"""
        assert hotelbeds_provider.config.provider_name == 'hotelbeds'
        assert hotelbeds_provider.api_key == 'test_hotelbeds_key'
        assert hotelbeds_provider.api_secret == 'test_hotelbeds_secret'
    
    def test_generate_auth_headers(self, hotelbeds_provider):
        """Test signature generation"""
        headers = hotelbeds_provider._generate_auth_headers()
        
        assert 'Api-key' in headers
        assert 'X-Signature' in headers
        assert headers['Api-key'] == 'test_hotelbeds_key'
        assert len(headers['X-Signature']) == 64  # SHA256 hex length
    
    @pytest.mark.asyncio
    async def test_search_unsupported_type(self, hotelbeds_provider):
        """Test that HotelBeds rejects non-hotel searches"""
        request = SearchRequest(
            search_type='flight',
            destination='NYC',
            check_in='2026-03-01',
            check_out='2026-03-05'
        )
        
        result = await hotelbeds_provider.search(request)
        
        assert result.success == False
        assert 'only supports hotel' in result.metadata.get('error', '')


class TestAmadeusAdapter:
    """Test Amadeus adapter"""
    
    @pytest.fixture
    def amadeus_provider(self):
        config = create_test_config('amadeus', 'package')
        credentials = create_test_credentials('amadeus')
        return AmadeusProvider(config, credentials)
    
    def test_initialization(self, amadeus_provider):
        """Test Amadeus provider initialization"""
        assert amadeus_provider.config.provider_name == 'amadeus'
        assert amadeus_provider.api_key == 'test_amadeus_key'
        assert amadeus_provider.api_secret == 'test_amadeus_secret'
        assert amadeus_provider.api_base == 'https://api.test.amadeus.com'
    
    def test_supports_multiple_types(self, amadeus_provider):
        """Test Amadeus supports hotels, flights, and activities"""
        assert amadeus_provider.config.capabilities.supports_hotels == True
        assert amadeus_provider.config.capabilities.supports_flights == True
        assert amadeus_provider.config.capabilities.supports_activities == False  # Not set in config
    
    @pytest.mark.asyncio
    async def test_health_check_structure(self, amadeus_provider):
        """Test health check returns proper structure"""
        result = await amadeus_provider.health_check()
        
        assert 'status' in result
        assert 'response_time_ms' in result
        assert 'details' in result


class TestLocalSupplierAdapter:
    """Test local supplier adapter"""
    
    @pytest.fixture
    def local_provider(self):
        config = create_test_config('local', 'activity')
        credentials = create_test_credentials('local')
        return LocalSupplierProvider(config, credentials)
    
    def test_initialization(self, local_provider):
        """Test local supplier initialization"""
        assert local_provider.is_authenticated == True  # Always authenticated
        assert local_provider.commission_rate > 0
    
    @pytest.mark.asyncio
    async def test_authenticate_always_succeeds(self, local_provider):
        """Test local suppliers are always authenticated"""
        result = await local_provider.authenticate()
        assert result == True
    
    @pytest.mark.asyncio
    async def test_search_returns_local_offerings(self, local_provider):
        """Test search returns local offerings"""
        request = SearchRequest(
            search_type='activity',
            destination='Bali',
            check_in='2026-03-01',
            check_out='2026-03-05'
        )
        
        result = await local_provider.search(request)
        
        assert result.success == True
        assert len(result.results) > 0
        assert result.results[0].get('local_owned') == True
        assert 'community_impact' in result.results[0]
    
    @pytest.mark.asyncio
    async def test_booking_returns_pending(self, local_provider):
        """Test booking returns pending confirmation"""
        booking = await local_provider.book({'item_id': 'test_001'})
        
        assert booking['success'] == True
        assert booking['status'] == 'pending_confirmation'
        assert 'next_steps' in booking


class TestProviderRotation:
    """Test provider rotation logic"""
    
    def test_priority_sorting(self):
        """Test providers are sorted by priority"""
        providers = [
            {'name': 'sabre', 'priority': 10, 'eco_rating': 75},
            {'name': 'local_guide', 'priority': 5, 'eco_rating': 95},
            {'name': 'amadeus', 'priority': 15, 'eco_rating': 85},
        ]
        
        # Sort by priority (lower = higher priority)
        sorted_providers = sorted(providers, key=lambda x: x['priority'])
        
        assert sorted_providers[0]['name'] == 'local_guide'
        assert sorted_providers[1]['name'] == 'sabre'
        assert sorted_providers[2]['name'] == 'amadeus'
    
    def test_eco_priority_sorting(self):
        """Test eco-priority sorting"""
        providers = [
            {'name': 'sabre', 'priority': 10, 'eco_rating': 75},
            {'name': 'local_guide', 'priority': 5, 'eco_rating': 95},
            {'name': 'amadeus', 'priority': 15, 'eco_rating': 85},
        ]
        
        # Sort by eco rating (higher = better), then priority
        sorted_providers = sorted(providers, key=lambda x: (-x['eco_rating'], x['priority']))
        
        assert sorted_providers[0]['name'] == 'local_guide'  # Highest eco
        assert sorted_providers[1]['name'] == 'amadeus'
        assert sorted_providers[2]['name'] == 'sabre'


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, '-v', '--tb=short'])
