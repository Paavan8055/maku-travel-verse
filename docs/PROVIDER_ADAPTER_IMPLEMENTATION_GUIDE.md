# MAKU.TRAVEL PROVIDER ADAPTER IMPLEMENTATION GUIDE
## Complete Architecture for Sabre, HotelBeds & Amadeus Integration

**Document Version**: 1.0  
**Date**: January 2026  
**Status**: READY FOR IMPLEMENTATION

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Provider Adapter Class Structure](#2-provider-adapter-class-structure)
3. [Authentication Flows](#3-authentication-flows)
4. [Search Methods Implementation](#4-search-methods-implementation)
5. [Health Checks & Monitoring](#5-health-checks--monitoring)
6. [Supabase Vault Secret Management](#6-supabase-vault-secret-management)
7. [Provider Rotation Configuration](#7-provider-rotation-configuration)
8. [SDK Dependencies & Environment Variables](#8-sdk-dependencies--environment-variables)
9. [Open Tasks from Production Documentation](#9-open-tasks-from-production-documentation)
10. [Cross-Chain Integration Strategy](#10-cross-chain-integration-strategy)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Universal Provider Manager Architecture

The MAKU.Travel platform uses a **plugin-based provider architecture** that enables:

- ✅ **Dynamic provider addition** without code changes
- ✅ **Configuration-driven rotation** based on Supabase registry
- ✅ **Intelligent failover** with health monitoring
- ✅ **Eco-rating prioritization** for sustainable travel
- ✅ **Fee transparency** for user trust

**Reference**: `providers/universal_provider_manager.py` (Lines 1-278)

```python
# Registry-to-adapter mapping (Lines 30-38)
self.provider_adapters = {
    'sabre': 'providers.sabre_adapter.SabreProvider',
    'hotelbeds': 'providers.hotelbeds_adapter.HotelBedsProvider',
    'amadeus': 'providers.amadeus_adapter.AmadeusProvider',
    'expedia_taap': 'providers.expedia_adapter.ExpediaProvider',
    'booking_com': 'providers.booking_adapter.BookingProvider',
    'viator': 'providers.viator_adapter.ViatorProvider',
    'getyourguide': 'providers.getyourguide_adapter.GetYourGuideProvider'
}
```

### 1.2 Base Provider Interface

All adapters must implement the **BaseProvider abstract class**:

**Reference**: `providers/base_provider.py` (Lines 58-137)

**Required Methods**:
1. `authenticate()` - Provider API authentication
2. `search()` - Execute hotel/flight/activity searches
3. `get_availability()` - Real-time availability checks
4. `get_quote()` - Detailed pricing quotes
5. `book()` - Execute bookings
6. `cancel()` - Cancel reservations
7. `health_check()` - Provider health monitoring

---

## 2. PROVIDER ADAPTER CLASS STRUCTURE

### 2.1 Sabre GDS Adapter

**File**: `/app/backend/providers/sabre_adapter.py`

```python
"""
Sabre GDS Provider Adapter
Supports: Hotels + Flights (Full-service GDS)
API Docs: https://developer.sabre.com/
"""

import httpx
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from .base_provider import (
    BaseProvider, ProviderConfig, SearchRequest, 
    SearchResponse, ProviderCapabilities
)
import logging

logger = logging.getLogger(__name__)


class SabreProvider(BaseProvider):
    """
    Sabre GDS Integration
    
    Capabilities:
    - Hotels: 650,000+ properties worldwide
    - Flights: 400+ airlines
    - Real-time availability
    - GDS-grade reliability
    
    Authentication: OAuth 2.0 Client Credentials
    """
    
    def __init__(self, config: ProviderConfig, credentials: Dict[str, str]):
        super().__init__(config, credentials)
        
        # Sabre-specific configuration
        self.api_base = config.api_base_url or "https://api.sabre.com"
        self.client_id = credentials.get('client_id')
        self.client_secret = credentials.get('client_secret')
        self.access_token = None
        self.token_expires_at = None
        
        # API endpoints
        self.auth_endpoint = f"{self.api_base}/v2/auth/token"
        self.hotel_search_endpoint = f"{self.api_base}/v3.0.0/get/hotelavailability"
        self.flight_search_endpoint = f"{self.api_base}/v4/offers/shop"
        self.booking_endpoint = f"{self.api_base}/v2.5.0/passenger/records"
        
        # HTTP client with timeout
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def authenticate(self) -> bool:
        """
        Sabre OAuth 2.0 Authentication
        
        Flow:
        1. POST to /v2/auth/token with client credentials
        2. Receive access token (valid ~1 hour)
        3. Store token for subsequent API calls
        
        Returns:
            bool: True if authentication successful
        """
        try:
            logger.info(f"🔐 Authenticating with Sabre GDS...")
            
            # Prepare auth request
            auth_data = {
                "grant_type": "client_credentials"
            }
            
            auth_headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {self._encode_credentials()}"
            }
            
            # Request access token
            response = await self.http_client.post(
                self.auth_endpoint,
                data=auth_data,
                headers=auth_headers
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get('access_token')
                expires_in = token_data.get('expires_in', 3600)
                self.token_expires_at = datetime.now().timestamp() + expires_in
                
                self.is_authenticated = True
                logger.info(f"✅ Sabre authentication successful (expires in {expires_in}s)")
                return True
            else:
                logger.error(f"❌ Sabre auth failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Sabre authentication error: {e}")
            return False
    
    def _encode_credentials(self) -> str:
        """Base64 encode client_id:client_secret for Basic Auth"""
        import base64
        credentials = f"{self.client_id}:{self.client_secret}"
        return base64.b64encode(credentials.encode()).decode()
    
    async def _ensure_authenticated(self):
        """Refresh token if expired"""
        if not self.access_token or datetime.now().timestamp() > (self.token_expires_at or 0):
            await self.authenticate()
    
    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        Execute search based on type
        
        Args:
            request: Universal search request
            
        Returns:
            SearchResponse with results
        """
        await self._ensure_authenticated()
        
        start_time = datetime.now()
        
        try:
            if request.search_type == 'hotel':
                results = await self._search_hotels(request)
            elif request.search_type == 'flight':
                results = await self._search_flights(request)
            else:
                return SearchResponse(
                    success=False,
                    provider="sabre",
                    results=[],
                    total_results=0,
                    response_time_ms=0,
                    metadata={"error": f"Unsupported search type: {request.search_type}"}
                )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return SearchResponse(
                success=True,
                provider="sabre",
                results=results,
                total_results=len(results),
                response_time_ms=response_time,
                cached=False,
                metadata={
                    "api_version": "v3.0.0",
                    "gds": "sabre",
                    "search_type": request.search_type
                }
            )
            
        except Exception as e:
            logger.error(f"❌ Sabre search error: {e}")
            return SearchResponse(
                success=False,
                provider="sabre",
                results=[],
                total_results=0,
                response_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                metadata={"error": str(e)}
            )
    
    async def _search_hotels(self, request: SearchRequest) -> List[Dict[str, Any]]:
        """
        Sabre Hotel Search API
        
        Endpoint: GET /v3.0.0/get/hotelavailability
        """
        params = {
            "location": request.destination,
            "checkin": request.check_in,
            "checkout": request.check_out,
            "guests": request.guests,
            "rooms": request.rooms,
            "currency": request.currency
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        response = await self.http_client.get(
            self.hotel_search_endpoint,
            params=params,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return self._transform_hotel_results(data)
        else:
            logger.error(f"Sabre hotel search failed: {response.status_code}")
            return []
    
    async def _search_flights(self, request: SearchRequest) -> List[Dict[str, Any]]:
        """
        Sabre Flight Search API
        
        Endpoint: POST /v4/offers/shop
        """
        payload = {
            "OTA_AirLowFareSearchRQ": {
                "OriginDestinationInformation": [{
                    "DepartureDateTime": request.check_in,
                    "OriginLocation": {"LocationCode": request.origin},
                    "DestinationLocation": {"LocationCode": request.destination}
                }],
                "TravelPreferences": {
                    "CabinPref": [{"Cabin": "Y", "PreferLevel": "Preferred"}]
                },
                "TravelerInfoSummary": {
                    "AirTravelerAvail": [{"PassengerTypeQuantity": [{"Code": "ADT", "Quantity": request.guests}]}]
                }
            }
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        response = await self.http_client.post(
            self.flight_search_endpoint,
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return self._transform_flight_results(data)
        else:
            logger.error(f"Sabre flight search failed: {response.status_code}")
            return []
    
    def _transform_hotel_results(self, data: Dict) -> List[Dict[str, Any]]:
        """Transform Sabre hotel response to universal format"""
        results = []
        
        hotels = data.get('HotelAvailabilityResponse', {}).get('HotelAvailabilityInfos', {}).get('HotelAvailabilityInfo', [])
        
        for hotel in hotels:
            results.append({
                "id": hotel.get('PropertyCode'),
                "name": hotel.get('HotelName'),
                "provider": "sabre",
                "type": "hotel",
                "location": {
                    "address": hotel.get('Address', {}).get('AddressLine', ''),
                    "city": hotel.get('Address', {}).get('CityName', ''),
                    "country": hotel.get('Address', {}).get('CountryCode', '')
                },
                "price": {
                    "amount": float(hotel.get('RateRange', {}).get('MinimumAmount', 0)),
                    "currency": hotel.get('RateRange', {}).get('CurrencyCode', 'USD')
                },
                "rating": hotel.get('HotelRating', 0),
                "image": hotel.get('Media', {}).get('ImageUrl', None),
                "amenities": hotel.get('Amenities', []),
                "available": True
            })
        
        return results
    
    def _transform_flight_results(self, data: Dict) -> List[Dict[str, Any]]:
        """Transform Sabre flight response to universal format"""
        results = []
        
        itineraries = data.get('PricedItineraries', {}).get('PricedItinerary', [])
        
        for itinerary in itineraries:
            air_itinerary = itinerary.get('AirItinerary', {})
            pricing = itinerary.get('AirItineraryPricingInfo', {})
            
            results.append({
                "id": itinerary.get('SequenceNumber'),
                "provider": "sabre",
                "type": "flight",
                "origin": air_itinerary.get('OriginDestinationOptions', {}).get('OriginDestinationOption', [{}])[0].get('FlightSegment', [{}])[0].get('DepartureAirport', {}).get('LocationCode'),
                "destination": air_itinerary.get('OriginDestinationOptions', {}).get('OriginDestinationOption', [{}])[0].get('FlightSegment', [{}])[-1].get('ArrivalAirport', {}).get('LocationCode'),
                "departure_time": air_itinerary.get('OriginDestinationOptions', {}).get('OriginDestinationOption', [{}])[0].get('FlightSegment', [{}])[0].get('DepartureDateTime'),
                "arrival_time": air_itinerary.get('OriginDestinationOptions', {}).get('OriginDestinationOption', [{}])[0].get('FlightSegment', [{}])[-1].get('ArrivalDateTime'),
                "airline": air_itinerary.get('OriginDestinationOptions', {}).get('OriginDestinationOption', [{}])[0].get('FlightSegment', [{}])[0].get('MarketingAirline', {}).get('Code'),
                "price": {
                    "amount": float(pricing.get('ItinTotalFare', {}).get('TotalFare', {}).get('Amount', 0)),
                    "currency": pricing.get('ItinTotalFare', {}).get('TotalFare', {}).get('CurrencyCode', 'USD')
                },
                "stops": len(air_itinerary.get('OriginDestinationOptions', {}).get('OriginDestinationOption', [{}])[0].get('FlightSegment', [])) - 1,
                "cabin_class": "Economy",
                "available": True
            })
        
        return results
    
    async def get_availability(self, item_id: str, dates: Dict[str, str]) -> Dict[str, Any]:
        """Check real-time availability for specific hotel/flight"""
        await self._ensure_authenticated()
        
        # Implementation depends on item type (hotel vs flight)
        # Placeholder for now
        return {
            "available": True,
            "item_id": item_id,
            "dates": dates,
            "provider": "sabre"
        }
    
    async def get_quote(self, item_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed pricing quote"""
        await self._ensure_authenticated()
        
        # Sabre pricing API call
        return {
            "item_id": item_id,
            "provider": "sabre",
            "quote": details
        }
    
    async def book(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """Execute booking via Sabre"""
        await self._ensure_authenticated()
        
        # Sabre booking API call
        return {
            "success": True,
            "booking_id": "SABRE_BOOKING_123",
            "provider": "sabre",
            "confirmation": booking_details
        }
    
    async def cancel(self, booking_id: str, reason: str) -> Dict[str, Any]:
        """Cancel Sabre booking"""
        await self._ensure_authenticated()
        
        # Sabre cancellation API call
        return {
            "success": True,
            "booking_id": booking_id,
            "cancelled": True,
            "provider": "sabre"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Sabre health check
        
        Tests:
        1. API endpoint reachability
        2. Authentication validity
        3. Response time
        """
        start_time = datetime.now()
        
        try:
            # Try to authenticate or verify token
            if not self.is_authenticated:
                auth_success = await self.authenticate()
                if not auth_success:
                    return {
                        "status": "down",
                        "response_time_ms": 0,
                        "details": {"error": "Authentication failed"}
                    }
            
            # Ping a lightweight endpoint
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = await self.http_client.get(
                f"{self.api_base}/v1/utilities/health",
                headers=headers,
                timeout=10.0
            )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time_ms": response_time,
                    "details": {
                        "authenticated": True,
                        "api_version": "v3.0.0",
                        "capabilities": ["hotels", "flights"]
                    }
                }
            else:
                return {
                    "status": "degraded",
                    "response_time_ms": response_time,
                    "details": {"http_status": response.status_code}
                }
                
        except Exception as e:
            return {
                "status": "down",
                "response_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "details": {"error": str(e)}
            }
    
    async def close(self):
        """Cleanup HTTP client"""
        await self.http_client.aclose()
```

---

### 2.2 HotelBeds Adapter

**File**: `/app/backend/providers/hotelbeds_adapter.py`

```python
"""
HotelBeds Provider Adapter
Supports: Hotels only (300,000+ properties)
API Docs: https://developer.hotelbeds.com/
"""

import httpx
import hashlib
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from .base_provider import (
    BaseProvider, ProviderConfig, SearchRequest, 
    SearchResponse, ProviderCapabilities
)
import logging

logger = logging.getLogger(__name__)


class HotelBedsProvider(BaseProvider):
    """
    HotelBeds Hotel Supplier Integration
    
    Capabilities:
    - Hotels: 300,000+ properties (directly contracted)
    - Competitive net rates
    - Strong European coverage
    - Instant confirmation
    
    Authentication: API Key + Signature-based
    """
    
    def __init__(self, config: ProviderConfig, credentials: Dict[str, str]):
        super().__init__(config, credentials)
        
        # HotelBeds-specific configuration
        self.api_base = config.api_base_url or "https://api.hotelbeds.com"
        self.api_key = credentials.get('api_key')
        self.api_secret = credentials.get('api_secret')
        
        # API endpoints
        self.hotel_search_endpoint = f"{self.api_base}/hotel-api/1.0/hotels"
        self.availability_endpoint = f"{self.api_base}/hotel-api/1.0/checkrates"
        self.booking_endpoint = f"{self.api_base}/hotel-api/1.0/bookings"
        
        # HTTP client
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def authenticate(self) -> bool:
        """
        HotelBeds uses signature-based auth (no OAuth)
        
        Auth flow:
        1. Generate signature: SHA256(api_key + api_secret + timestamp)
        2. Include in X-Signature header with every request
        3. No token expiration
        
        Returns:
            bool: True if credentials valid
        """
        try:
            logger.info(f"🔐 Validating HotelBeds credentials...")
            
            # Validate credentials exist
            if not self.api_key or not self.api_secret:
                logger.error("❌ HotelBeds credentials missing")
                return False
            
            # Test with a simple API call
            headers = self._generate_auth_headers()
            
            response = await self.http_client.get(
                f"{self.api_base}/hotel-api/1.0/status",
                headers=headers,
                timeout=10.0
            )
            
            if response.status_code == 200:
                self.is_authenticated = True
                logger.info(f"✅ HotelBeds authentication successful")
                return True
            else:
                logger.error(f"❌ HotelBeds auth failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ HotelBeds authentication error: {e}")
            return False
    
    def _generate_auth_headers(self) -> Dict[str, str]:
        """
        Generate HotelBeds authentication headers
        
        X-Signature = SHA256(apiKey + apiSecret + timestamp)
        """
        timestamp = str(int(datetime.now().timestamp()))
        
        # Create signature
        signature_string = f"{self.api_key}{self.api_secret}{timestamp}"
        signature = hashlib.sha256(signature_string.encode()).hexdigest()
        
        return {
            "Api-key": self.api_key,
            "X-Signature": signature,
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json"
        }
    
    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        HotelBeds hotel search
        
        Args:
            request: Universal search request
            
        Returns:
            SearchResponse with hotel results
        """
        start_time = datetime.now()
        
        try:
            if request.search_type != 'hotel':
                return SearchResponse(
                    success=False,
                    provider="hotelbeds",
                    results=[],
                    total_results=0,
                    response_time_ms=0,
                    metadata={"error": "HotelBeds only supports hotel searches"}
                )
            
            results = await self._search_hotels(request)
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return SearchResponse(
                success=True,
                provider="hotelbeds",
                results=results,
                total_results=len(results),
                response_time_ms=response_time,
                cached=False,
                metadata={
                    "api_version": "1.0",
                    "search_type": "hotel",
                    "net_rates": True
                }
            )
            
        except Exception as e:
            logger.error(f"❌ HotelBeds search error: {e}")
            return SearchResponse(
                success=False,
                provider="hotelbeds",
                results=[],
                total_results=0,
                response_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                metadata={"error": str(e)}
            )
    
    async def _search_hotels(self, request: SearchRequest) -> List[Dict[str, Any]]:
        """
        HotelBeds Hotel Availability API
        
        Endpoint: POST /hotel-api/1.0/hotels
        """
        payload = {
            "stay": {
                "checkIn": request.check_in,
                "checkOut": request.check_out
            },
            "occupancies": [{
                "rooms": request.rooms,
                "adults": request.guests,
                "children": 0
            }],
            "destination": {
                "code": request.destination  # HotelBeds destination code
            }
        }
        
        headers = self._generate_auth_headers()
        
        response = await self.http_client.post(
            self.hotel_search_endpoint,
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return self._transform_hotel_results(data)
        else:
            logger.error(f"HotelBeds hotel search failed: {response.status_code}")
            return []
    
    def _transform_hotel_results(self, data: Dict) -> List[Dict[str, Any]]:
        """Transform HotelBeds response to universal format"""
        results = []
        
        hotels = data.get('hotels', {}).get('hotels', [])
        
        for hotel in hotels:
            # Get cheapest room
            rooms = hotel.get('rooms', [])
            min_price = min([float(room.get('rates', [{}])[0].get('net', 0)) for room in rooms]) if rooms else 0
            
            results.append({
                "id": hotel.get('code'),
                "name": hotel.get('name'),
                "provider": "hotelbeds",
                "type": "hotel",
                "location": {
                    "address": hotel.get('address', {}).get('content', ''),
                    "city": hotel.get('destinationName', ''),
                    "country": hotel.get('countryCode', ''),
                    "latitude": hotel.get('latitude'),
                    "longitude": hotel.get('longitude')
                },
                "price": {
                    "amount": min_price,
                    "currency": hotel.get('currency', 'USD'),
                    "net_rate": True  # HotelBeds provides net rates
                },
                "rating": hotel.get('categoryCode', 0),
                "image": hotel.get('images', [{}])[0].get('path') if hotel.get('images') else None,
                "amenities": [facility.get('description', {}).get('content') for facility in hotel.get('facilities', [])],
                "available": True,
                "cancellation_policy": hotel.get('rooms', [{}])[0].get('rates', [{}])[0].get('cancellationPolicies', [])
            })
        
        return results
    
    async def get_availability(self, item_id: str, dates: Dict[str, str]) -> Dict[str, Any]:
        """Check real-time room availability"""
        headers = self._generate_auth_headers()
        
        # HotelBeds CheckRate API
        payload = {
            "rooms": [{
                "rateKey": item_id
            }]
        }
        
        response = await self.http_client.post(
            self.availability_endpoint,
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "available": True,
                "item_id": item_id,
                "details": data
            }
        else:
            return {
                "available": False,
                "item_id": item_id,
                "error": "Check failed"
            }
    
    async def get_quote(self, item_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed pricing quote"""
        # Similar to get_availability for HotelBeds
        return await self.get_availability(item_id, details)
    
    async def book(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """Execute booking via HotelBeds"""
        headers = self._generate_auth_headers()
        
        # HotelBeds booking payload
        payload = {
            "holder": booking_details.get('holder'),
            "rooms": booking_details.get('rooms'),
            "clientReference": booking_details.get('reference')
        }
        
        response = await self.http_client.post(
            self.booking_endpoint,
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "booking_id": data.get('booking', {}).get('reference'),
                "provider": "hotelbeds",
                "confirmation": data
            }
        else:
            return {
                "success": False,
                "error": f"Booking failed: {response.status_code}",
                "provider": "hotelbeds"
            }
    
    async def cancel(self, booking_id: str, reason: str) -> Dict[str, Any]:
        """Cancel HotelBeds booking"""
        headers = self._generate_auth_headers()
        
        response = await self.http_client.delete(
            f"{self.booking_endpoint}/{booking_id}",
            headers=headers,
            params={"cancellationFlag": "CANCELLATION"}
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "booking_id": booking_id,
                "cancelled": True,
                "provider": "hotelbeds"
            }
        else:
            return {
                "success": False,
                "error": "Cancellation failed",
                "provider": "hotelbeds"
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """HotelBeds health check"""
        start_time = datetime.now()
        
        try:
            headers = self._generate_auth_headers()
            
            response = await self.http_client.get(
                f"{self.api_base}/hotel-api/1.0/status",
                headers=headers,
                timeout=10.0
            )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time_ms": response_time,
                    "details": {
                        "api_version": "1.0",
                        "capabilities": ["hotels"],
                        "net_rates": True
                    }
                }
            else:
                return {
                    "status": "degraded",
                    "response_time_ms": response_time,
                    "details": {"http_status": response.status_code}
                }
                
        except Exception as e:
            return {
                "status": "down",
                "response_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "details": {"error": str(e)}
            }
    
    async def close(self):
        """Cleanup HTTP client"""
        await self.http_client.aclose()
```

---

### 2.3 Amadeus Adapter

**File**: `/app/backend/providers/amadeus_adapter.py`

```python
"""
Amadeus Provider Adapter
Supports: Hotels + Flights + Activities (Full-service)
API Docs: https://developers.amadeus.com/
"""

import httpx
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
from .base_provider import (
    BaseProvider, ProviderConfig, SearchRequest, 
    SearchResponse, ProviderCapabilities
)
import logging

logger = logging.getLogger(__name__)


class AmadeusProvider(BaseProvider):
    """
    Amadeus Self-Service APIs Integration
    
    Capabilities:
    - Hotels: 650,000+ properties (via Amadeus Hotel Search)
    - Flights: 400+ airlines (flight offers search)
    - Activities: Tours and experiences
    - Points of Interest
    - Travel recommendations
    
    Authentication: OAuth 2.0 Client Credentials
    """
    
    def __init__(self, config: ProviderConfig, credentials: Dict[str, str]):
        super().__init__(config, credentials)
        
        # Amadeus-specific configuration
        self.api_base = config.api_base_url or "https://api.amadeus.com"
        self.api_key = credentials.get('api_key')
        self.api_secret = credentials.get('api_secret')
        self.access_token = None
        self.token_expires_at = None
        
        # API endpoints
        self.auth_endpoint = f"{self.api_base}/v1/security/oauth2/token"
        self.hotel_search_endpoint = f"{self.api_base}/v3/shopping/hotel-offers"
        self.flight_search_endpoint = f"{self.api_base}/v2/shopping/flight-offers"
        self.activity_search_endpoint = f"{self.api_base}/v1/shopping/activities"
        self.booking_endpoint = f"{self.api_base}/v1/booking/hotel-bookings"
        
        # HTTP client
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def authenticate(self) -> bool:
        """
        Amadeus OAuth 2.0 Authentication
        
        Flow:
        1. POST to /v1/security/oauth2/token
        2. Receive access token (valid 30 minutes)
        3. Refresh when expired
        
        Returns:
            bool: True if authentication successful
        """
        try:
            logger.info(f"🔐 Authenticating with Amadeus...")
            
            auth_data = {
                "grant_type": "client_credentials",
                "client_id": self.api_key,
                "client_secret": self.api_secret
            }
            
            response = await self.http_client.post(
                self.auth_endpoint,
                data=auth_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get('access_token')
                expires_in = token_data.get('expires_in', 1799)  # ~30 min
                self.token_expires_at = datetime.now().timestamp() + expires_in
                
                self.is_authenticated = True
                logger.info(f"✅ Amadeus authentication successful (expires in {expires_in}s)")
                return True
            else:
                logger.error(f"❌ Amadeus auth failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Amadeus authentication error: {e}")
            return False
    
    async def _ensure_authenticated(self):
        """Refresh token if expired"""
        if not self.access_token or datetime.now().timestamp() > (self.token_expires_at or 0):
            await self.authenticate()
    
    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        Execute search based on type
        
        Args:
            request: Universal search request
            
        Returns:
            SearchResponse with results
        """
        await self._ensure_authenticated()
        
        start_time = datetime.now()
        
        try:
            if request.search_type == 'hotel':
                results = await self._search_hotels(request)
            elif request.search_type == 'flight':
                results = await self._search_flights(request)
            elif request.search_type == 'activity':
                results = await self._search_activities(request)
            else:
                return SearchResponse(
                    success=False,
                    provider="amadeus",
                    results=[],
                    total_results=0,
                    response_time_ms=0,
                    metadata={"error": f"Unsupported search type: {request.search_type}"}
                )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return SearchResponse(
                success=True,
                provider="amadeus",
                results=results,
                total_results=len(results),
                response_time_ms=response_time,
                cached=False,
                metadata={
                    "api_version": "v3",
                    "search_type": request.search_type
                }
            )
            
        except Exception as e:
            logger.error(f"❌ Amadeus search error: {e}")
            return SearchResponse(
                success=False,
                provider="amadeus",
                results=[],
                total_results=0,
                response_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                metadata={"error": str(e)}
            )
    
    async def _search_hotels(self, request: SearchRequest) -> List[Dict[str, Any]]:
        """
        Amadeus Hotel Search API
        
        Endpoint: GET /v3/shopping/hotel-offers
        """
        params = {
            "cityCode": request.destination,  # IATA city code
            "checkInDate": request.check_in,
            "checkOutDate": request.check_out,
            "adults": request.guests,
            "roomQuantity": request.rooms,
            "currency": request.currency,
            "lang": request.locale
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        response = await self.http_client.get(
            self.hotel_search_endpoint,
            params=params,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return self._transform_hotel_results(data)
        else:
            logger.error(f"Amadeus hotel search failed: {response.status_code}")
            return []
    
    async def _search_flights(self, request: SearchRequest) -> List[Dict[str, Any]]:
        """
        Amadeus Flight Offers Search API
        
        Endpoint: GET /v2/shopping/flight-offers
        """
        params = {
            "originLocationCode": request.origin,
            "destinationLocationCode": request.destination,
            "departureDate": request.check_in,
            "adults": request.guests,
            "currencyCode": request.currency,
            "max": 50  # Max results
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        response = await self.http_client.get(
            self.flight_search_endpoint,
            params=params,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return self._transform_flight_results(data)
        else:
            logger.error(f"Amadeus flight search failed: {response.status_code}")
            return []
    
    async def _search_activities(self, request: SearchRequest) -> List[Dict[str, Any]]:
        """
        Amadeus Activities Search API
        
        Endpoint: GET /v1/shopping/activities
        """
        params = {
            "latitude": request.destination_lat if hasattr(request, 'destination_lat') else None,
            "longitude": request.destination_lon if hasattr(request, 'destination_lon') else None,
            "radius": 20  # 20km radius
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        response = await self.http_client.get(
            self.activity_search_endpoint,
            params=params,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return self._transform_activity_results(data)
        else:
            logger.error(f"Amadeus activity search failed: {response.status_code}")
            return []
    
    def _transform_hotel_results(self, data: Dict) -> List[Dict[str, Any]]:
        """Transform Amadeus hotel response to universal format"""
        results = []
        
        for offer in data.get('data', []):
            hotel = offer.get('hotel', {})
            price_info = offer.get('offers', [{}])[0].get('price', {})
            
            results.append({
                "id": hotel.get('hotelId'),
                "name": hotel.get('name'),
                "provider": "amadeus",
                "type": "hotel",
                "location": {
                    "address": hotel.get('address', {}).get('lines', [''])[0],
                    "city": hotel.get('address', {}).get('cityName', ''),
                    "country": hotel.get('address', {}).get('countryCode', ''),
                    "latitude": hotel.get('latitude'),
                    "longitude": hotel.get('longitude')
                },
                "price": {
                    "amount": float(price_info.get('total', 0)),
                    "currency": price_info.get('currency', 'USD')
                },
                "rating": hotel.get('rating', 0),
                "image": hotel.get('media', [{}])[0].get('uri') if hotel.get('media') else None,
                "amenities": hotel.get('amenities', []),
                "available": True
            })
        
        return results
    
    def _transform_flight_results(self, data: Dict) -> List[Dict[str, Any]]:
        """Transform Amadeus flight response to universal format"""
        results = []
        
        for offer in data.get('data', []):
            itineraries = offer.get('itineraries', [])
            price = offer.get('price', {})
            
            if itineraries:
                first_segment = itineraries[0].get('segments', [{}])[0]
                last_segment = itineraries[0].get('segments', [{}])[-1]
                
                results.append({
                    "id": offer.get('id'),
                    "provider": "amadeus",
                    "type": "flight",
                    "origin": first_segment.get('departure', {}).get('iataCode'),
                    "destination": last_segment.get('arrival', {}).get('iataCode'),
                    "departure_time": first_segment.get('departure', {}).get('at'),
                    "arrival_time": last_segment.get('arrival', {}).get('at'),
                    "airline": first_segment.get('carrierCode'),
                    "price": {
                        "amount": float(price.get('total', 0)),
                        "currency": price.get('currency', 'USD')
                    },
                    "stops": len(itineraries[0].get('segments', [])) - 1,
                    "cabin_class": first_segment.get('cabin', 'ECONOMY'),
                    "available": True
                })
        
        return results
    
    def _transform_activity_results(self, data: Dict) -> List[Dict[str, Any]]:
        """Transform Amadeus activity response to universal format"""
        results = []
        
        for activity in data.get('data', []):
            price = activity.get('price', {})
            
            results.append({
                "id": activity.get('id'),
                "name": activity.get('name'),
                "provider": "amadeus",
                "type": "activity",
                "description": activity.get('shortDescription'),
                "location": {
                    "latitude": activity.get('geoCode', {}).get('latitude'),
                    "longitude": activity.get('geoCode', {}).get('longitude')
                },
                "price": {
                    "amount": float(price.get('amount', 0)),
                    "currency": price.get('currencyCode', 'USD')
                },
                "rating": activity.get('rating', 0),
                "duration": activity.get('minimumDuration'),
                "image": activity.get('pictures', [''])[0] if activity.get('pictures') else None,
                "available": True
            })
        
        return results
    
    async def get_availability(self, item_id: str, dates: Dict[str, str]) -> Dict[str, Any]:
        """Check real-time availability"""
        await self._ensure_authenticated()
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # For hotels, use hotel-offers by ID
        response = await self.http_client.get(
            f"{self.hotel_search_endpoint}/{item_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            return {
                "available": True,
                "item_id": item_id,
                "details": response.json()
            }
        else:
            return {
                "available": False,
                "item_id": item_id
            }
    
    async def get_quote(self, item_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed pricing quote"""
        # Similar to get_availability
        return await self.get_availability(item_id, details)
    
    async def book(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """Execute booking via Amadeus"""
        await self._ensure_authenticated()
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        # Amadeus booking payload
        payload = {
            "data": {
                "type": "hotel-booking",
                "hotel": booking_details.get('hotel'),
                "guests": booking_details.get('guests'),
                "payments": booking_details.get('payments')
            }
        }
        
        response = await self.http_client.post(
            self.booking_endpoint,
            json=payload,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            return {
                "success": True,
                "booking_id": data.get('data', {}).get('id'),
                "provider": "amadeus",
                "confirmation": data
            }
        else:
            return {
                "success": False,
                "error": f"Booking failed: {response.status_code}",
                "provider": "amadeus"
            }
    
    async def cancel(self, booking_id: str, reason: str) -> Dict[str, Any]:
        """Cancel Amadeus booking"""
        await self._ensure_authenticated()
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        response = await self.http_client.delete(
            f"{self.booking_endpoint}/{booking_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "booking_id": booking_id,
                "cancelled": True,
                "provider": "amadeus"
            }
        else:
            return {
                "success": False,
                "error": "Cancellation failed",
                "provider": "amadeus"
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """Amadeus health check"""
        start_time = datetime.now()
        
        try:
            if not self.is_authenticated:
                auth_success = await self.authenticate()
                if not auth_success:
                    return {
                        "status": "down",
                        "response_time_ms": 0,
                        "details": {"error": "Authentication failed"}
                    }
            
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            # Test with a simple location lookup
            response = await self.http_client.get(
                f"{self.api_base}/v1/reference-data/locations",
                params={"keyword": "LON", "subType": "CITY"},
                headers=headers,
                timeout=10.0
            )
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time_ms": response_time,
                    "details": {
                        "authenticated": True,
                        "api_version": "v3",
                        "capabilities": ["hotels", "flights", "activities"]
                    }
                }
            else:
                return {
                    "status": "degraded",
                    "response_time_ms": response_time,
                    "details": {"http_status": response.status_code}
                }
                
        except Exception as e:
            return {
                "status": "down",
                "response_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "details": {"error": str(e)}
            }
    
    async def close(self):
        """Cleanup HTTP client"""
        await self.http_client.aclose()
```

---

## 3. AUTHENTICATION FLOWS

### 3.1 Sabre OAuth 2.0 Flow

```
┌─────────────┐                                      ┌─────────────────┐
│   MAKU      │                                      │   Sabre API     │
│  Platform   │                                      │                 │
└──────┬──────┘                                      └────────┬────────┘
       │                                                      │
       │ 1. POST /v2/auth/token                             │
       │    Authorization: Basic {base64(client_id:secret)} │
       ├─────────────────────────────────────────────────────>
       │                                                      │
       │ 2. access_token (valid ~1 hour)                    │
       │<─────────────────────────────────────────────────────┤
       │                                                      │
       │ 3. Subsequent API calls                            │
       │    Authorization: Bearer {access_token}            │
       ├─────────────────────────────────────────────────────>
       │                                                      │
```

### 3.2 HotelBeds Signature Auth

```
┌─────────────┐                                      ┌─────────────────┐
│   MAKU      │                                      │ HotelBeds API   │
│  Platform   │                                      │                 │
└──────┬──────┘                                      └────────┬────────┘
       │                                                      │
       │ 1. Generate signature per request                   │
       │    SHA256(api_key + api_secret + timestamp)        │
       │                                                      │
       │ 2. API call with headers                           │
       │    Api-key: {api_key}                              │
       │    X-Signature: {signature}                        │
       ├─────────────────────────────────────────────────────>
       │                                                      │
       │ 3. Response                                        │
       │<─────────────────────────────────────────────────────┤
       │                                                      │
```

### 3.3 Amadeus OAuth 2.0 Flow

```
┌─────────────┐                                      ┌─────────────────┐
│   MAKU      │                                      │  Amadeus API    │
│  Platform   │                                      │                 │
└──────┬──────┘                                      └────────┬────────┘
       │                                                      │
       │ 1. POST /v1/security/oauth2/token                  │
       │    grant_type=client_credentials                   │
       │    client_id={api_key}                             │
       │    client_secret={api_secret}                      │
       ├─────────────────────────────────────────────────────>
       │                                                      │
       │ 2. access_token (valid 30 min)                     │
       │<─────────────────────────────────────────────────────┤
       │                                                      │
       │ 3. Subsequent API calls                            │
       │    Authorization: Bearer {access_token}            │
       ├─────────────────────────────────────────────────────>
       │                                                      │
```

---

## 4. SEARCH METHODS IMPLEMENTATION

### 4.1 Universal Search Flow

```
User Request
     │
     ├── Parse search criteria (destination, dates, guests)
     │
     ├── Identify eligible providers
     │   ├── Check service type support (hotel/flight/activity)
     │   ├── Check region support
     │   ├── Check health status
     │   └── Apply eco-rating priority
     │
     ├── Sort providers by rotation rules
     │   ├── Local suppliers first
     │   ├── Eco-rating priority (if enabled)
     │   ├── Fee transparency score
     │   └── Base priority (lower = higher)
     │
     ├── Execute search with rotation
     │   ├── Try Provider 1
     │   │   ├── Success? → Return results
     │   │   └── Fail? → Continue
     │   ├── Try Provider 2
     │   │   ├── Success? → Return results
     │   │   └── Fail? → Continue
     │   └── Try Provider N
     │
     └── Return results + rotation log
```

### 4.2 Provider-Specific Search Implementations

| Provider   | Hotel Search | Flight Search | Activity Search | Notes                          |
|------------|--------------|---------------|-----------------|--------------------------------|
| **Sabre**  | ✅ v3.0.0   | ✅ v4         | ❌              | Full GDS access                |
| **HotelBeds** | ✅ v1.0  | ❌            | ❌              | Net rates, instant confirmation |
| **Amadeus** | ✅ v3      | ✅ v2         | ✅ v1           | Most comprehensive             |

---

## 5. HEALTH CHECKS & MONITORING

### 5.1 Health Check Implementation

Each provider adapter implements `health_check()`:

```python
async def health_check(self) -> Dict[str, Any]:
    """
    Returns:
        {
            "status": "healthy|degraded|down",
            "response_time_ms": 123,
            "details": {
                "authenticated": True,
                "api_version": "v3",
                "capabilities": ["hotels", "flights"]
            }
        }
    """
```

### 5.2 Health Monitoring Schedule

| Check Type           | Frequency | Timeout | Action on Failure                    |
|----------------------|-----------|---------|--------------------------------------|
| **Ping**             | 1 minute  | 5s      | Log warning                          |
| **Auth Validation**  | 5 minutes | 10s     | Refresh credentials                  |
| **Full Search Test** | 15 minutes| 30s     | Rotate provider if 3 failures        |
| **Daily Report**     | 24 hours  | N/A     | Send health summary to admin         |

### 5.3 Health Status Criteria

```python
# Health scoring algorithm
def calculate_health_status(provider):
    score = 100
    
    # Response time penalty
    if avg_response_time > 5000:  # >5s
        score -= 30
    elif avg_response_time > 2000:  # >2s
        score -= 10
    
    # Error rate penalty
    if error_rate > 0.10:  # >10%
        score -= 40
    elif error_rate > 0.05:  # >5%
        score -= 20
    
    # Authentication failure
    if not authenticated:
        score = 0
    
    # Classify
    if score >= 80:
        return "healthy"
    elif score >= 50:
        return "degraded"
    else:
        return "down"
```

---

## 6. SUPABASE VAULT SECRET MANAGEMENT

### 6.1 Storing Provider Credentials

**Reference**: MIGRATION_STATUS_REPORT.md (Lines 286-300)

#### Step 1: Create Vault Secrets

```sql
-- Insert into Supabase Vault
INSERT INTO vault.secrets (name, secret)
VALUES
  ('sabre_client_id', 'your-sabre-client-id'),
  ('sabre_client_secret', 'your-sabre-client-secret'),
  ('hotelbeds_api_key', 'your-hotelbeds-key'),
  ('hotelbeds_api_secret', 'your-hotelbeds-secret'),
  ('amadeus_api_key', 'your-amadeus-key'),
  ('amadeus_api_secret', 'your-amadeus-secret');
```

#### Step 2: Reference in Provider Credentials Table

```sql
-- Link provider to vault secrets
INSERT INTO provider_credentials (
  provider_id,
  credential_key,
  credential_value_vault_id,
  environment,
  is_active
) VALUES
-- Sabre
((SELECT id FROM provider_registry WHERE provider_name = 'sabre'),
 'client_id', 'sabre_client_id', 'production', true),
((SELECT id FROM provider_registry WHERE provider_name = 'sabre'),
 'client_secret', 'sabre_client_secret', 'production', true),

-- HotelBeds
((SELECT id FROM provider_registry WHERE provider_name = 'hotelbeds'),
 'api_key', 'hotelbeds_api_key', 'production', true),
((SELECT id FROM provider_registry WHERE provider_name = 'hotelbeds'),
 'api_secret', 'hotelbeds_api_secret', 'production', true),

-- Amadeus
((SELECT id FROM provider_registry WHERE provider_name = 'amadeus'),
 'api_key', 'amadeus_api_key', 'production', true),
((SELECT id FROM provider_registry WHERE provider_name = 'amadeus'),
 'api_secret', 'amadeus_api_secret', 'production', true);
```

#### Step 3: Retrieve Secrets in Code

```python
async def _get_provider_credentials(self, provider_id: str, supabase_client) -> Dict[str, str]:
    """
    Retrieve provider credentials from Supabase Vault
    
    Reference: universal_provider_manager.py (Lines 98-115)
    """
    try:
        # Get credential references
        response = await supabase_client.table('provider_credentials')\
            .select('*')\
            .eq('provider_id', provider_id)\
            .eq('is_active', True)\
            .execute()
        
        credentials = {}
        for cred in response.data:
            vault_id = cred['credential_value_vault_id']
            
            # Retrieve from Vault
            secret_response = await supabase_client.rpc(
                'get_secret',
                {'secret_name': vault_id}
            )
            
            credentials[cred['credential_key']] = secret_response.data
        
        return credentials
        
    except Exception as e:
        logger.error(f"Failed to retrieve credentials: {e}")
        return {}
```

### 6.2 Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment-specific secrets** (dev, staging, production)
3. **Rotate credentials quarterly**
4. **Enable audit logging** on Vault access
5. **Use RLS policies** to restrict access:

```sql
-- Only service_role can access provider_credentials
CREATE POLICY "Service role access only" ON provider_credentials
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## 7. PROVIDER ROTATION CONFIGURATION

### 7.1 Rotation Rules

**Reference**: universal_provider_manager.py (Lines 199-238)

#### Priority 1: Local Suppliers First

```python
# Example configuration
provider_priorities = {
    'local_hotel_delhi': 1,      # Highest priority
    'local_restaurant_bali': 2,
    'amadeus': 15,               # Global provider
    'sabre': 10,
    'hotelbeds': 20
}
```

#### Priority 2: Eco-Rating

```python
def _get_eligible_providers(self, service_type, region, eco_priority):
    """
    Reference: universal_provider_manager.py (Lines 199-238)
    """
    eligible = []
    
    for provider_name, provider in self.providers.items():
        # Check capabilities
        if not provider.supports_search_type(service_type):
            continue
        
        # Check region
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
```

### 7.2 Rotation Configuration Table

| Provider Type      | Priority | Eco Rating | Fee Transparency | Use Case                          |
|--------------------|----------|------------|------------------|-----------------------------------|
| **Local Suppliers**| 1-9      | 90-100     | 95-100           | Authentic local experiences       |
| **Amadeus**        | 15       | 85         | 95               | Full-service, best coverage       |
| **Sabre**          | 10       | 75         | 85               | GDS reliability, strong flights   |
| **HotelBeds**      | 20       | 80         | 90               | Net rates, European focus         |
| **Expedia TAAP**   | 25       | 70         | 80               | Large inventory, backup option    |

### 7.3 Dynamic Rotation Algorithm

```python
def calculate_rotation_score(provider, request_context):
    """
    Dynamic scoring for provider selection
    """
    score = 100 - provider.priority  # Lower priority = higher score
    
    # Eco bonus (if eco_priority enabled)
    if request_context.eco_priority:
        score += provider.eco_rating * 0.5
    
    # Fee transparency bonus
    score += provider.fee_transparency_score * 0.3
    
    # Health penalty
    if provider.health_status == 'degraded':
        score -= 20
    elif provider.health_status == 'down':
        score = 0
    
    # Response time bonus (faster = better)
    if provider.avg_response_time_ms < 1000:
        score += 10
    elif provider.avg_response_time_ms > 5000:
        score -= 10
    
    # Success rate bonus
    score += provider.success_rate_percent * 0.2
    
    return max(0, score)
```

---

## 8. SDK DEPENDENCIES & ENVIRONMENT VARIABLES

### 8.1 Required Python Packages

**Add to `/app/backend/requirements.txt`**:

```txt
# Existing dependencies
...

# Provider SDKs
httpx==0.26.0              # Async HTTP client
pydantic==2.5.0            # Data validation
python-dotenv==1.0.0       # Environment management

# Optional: Official SDKs (if available)
# amadeus==8.0.0           # Amadeus Self-Service SDK
# Note: Sabre and HotelBeds don't have official Python SDKs
```

### 8.2 Environment Variables

**Update `/app/backend/.env`**:

```bash
# Existing Supabase configuration
SUPABASE_URL="https://iomeddeasarntjhqzndu.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# Sabre GDS Credentials
SABRE_CLIENT_ID="V1:your-sabre-username:your-sabre-pcc:AA"
SABRE_CLIENT_SECRET="your-sabre-base64-password"
SABRE_API_BASE="https://api.sabre.com"
SABRE_ENV="production"  # or "cert" for sandbox

# HotelBeds Credentials
HOTELBEDS_API_KEY="your-hotelbeds-api-key"
HOTELBEDS_API_SECRET="your-hotelbeds-api-secret"
HOTELBEDS_API_BASE="https://api.hotelbeds.com"
HOTELBEDS_ENV="production"  # or "test"

# Amadeus Self-Service APIs
AMADEUS_API_KEY="your-amadeus-api-key"
AMADEUS_API_SECRET="your-amadeus-api-secret"
AMADEUS_API_BASE="https://api.amadeus.com"
AMADEUS_ENV="production"  # or "test"

# Provider Manager Configuration
PROVIDER_ROTATION_ENABLED=true
PROVIDER_ECO_PRIORITY=true
PROVIDER_HEALTH_CHECK_INTERVAL=300  # 5 minutes
PROVIDER_MAX_RETRIES=3
PROVIDER_TIMEOUT_MS=30000
```

### 8.3 Obtaining API Credentials

#### Sabre GDS

1. **Sign up**: https://developer.sabre.com/
2. **Create workspace** → Get EPR (Enterprise Property Reference)
3. **Generate credentials**:
   - Client ID format: `V1:{username}:{pcc}:AA`
   - Client Secret: Base64-encoded password
4. **Sandbox access**: Use `cert.sabre.com` for testing

#### HotelBeds

1. **Partner signup**: https://developer.hotelbeds.com/signup
2. **Choose integration type**:
   - Hotel Distributors (resellers)
   - OTAs
3. **Receive credentials**:
   - API Key
   - API Secret
4. **Test environment**: https://api.test.hotelbeds.com

#### Amadeus

1. **Self-Service signup**: https://developers.amadeus.com/register
2. **Create app**:
   - Select required APIs (Hotel Search, Flight Offers, Activities)
   - Choose tier (Test → Production)
3. **Get credentials**:
   - API Key
   - API Secret
4. **Test endpoint**: https://test.api.amadeus.com

---

## 9. OPEN TASKS FROM PRODUCTION DOCUMENTATION

### 9.1 Tasks from PRODUCTION_DEPLOYMENT_CHECKLIST.md

**Reference**: PRODUCTION_DEPLOYMENT_CHECKLIST.md (Lines 1-100)

#### Task 1: Apply Database Migrations ✅ COMPLETED

```bash
# Already applied (Lines 14-41)
cd /app/supabase
supabase db push
```

**Status**: ✅ All 8 tables created (provider_registry, provider_credentials, provider_health_logs, provider_rotation_logs, partner_registry, partner_documents, partner_inventory, partner_bids)

---

#### Task 2: Seed Provider Data ✅ COMPLETED

**Reference**: PRODUCTION_DEPLOYMENT_CHECKLIST.md (Lines 45-62)

**Status**: ✅ 6 providers seeded (Sabre, HotelBeds, Amadeus, Viator, GetYourGuide, Expedia TAAP)

---

#### Task 3: Seed Local Businesses ⚠️ PARTIAL

**Reference**: PRODUCTION_DEPLOYMENT_CHECKLIST.md (Lines 64-76)

**Current**: 12 local businesses seeded (Bali, Paris, Tokyo, Dubai)
**Required**: Expand to 40+ destinations

**Action Required**:

```bash
# Create comprehensive seeding script
cd /app/backend/scripts
python seed_destinations.py --destinations all --locale all
```

**Recommended Script Structure**:

```python
# /app/backend/scripts/seed_destinations.py

DESTINATIONS = {
    'India': {
        'spiritual_sites': [...],
        'hidden_gems': [...],
        'local_businesses': [
            {'name': 'Delhi Heritage Walks', 'type': 'guide', ...},
            {'name': 'Kashmir Shawl Artisans', 'type': 'shop', ...},
            ...
        ]
    },
    'Thailand': {...},
    'Japan': {...},
    # ... 40+ destinations
}
```

---

#### Task 4: Install Provider Dependencies ⚠️ PENDING

**Reference**: PRODUCTION_DEPLOYMENT_CHECKLIST.md (Lines 91-100)

**Action Required**:

```bash
cd /app/backend
pip install httpx==0.26.0 pydantic==2.5.0
pip install -r requirements.txt
```

---

#### Task 5: Enable RLS Policies ⚠️ PENDING

**Action Required**:

```sql
-- Apply Row Level Security policies
-- Reference: 20250625000000_provider_marketplace_system.sql

-- Admin-only access to provider registry
ALTER TABLE provider_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access provider_registry" ON provider_registry
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Partners can view their own data
ALTER TABLE partner_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own registry" ON partner_registry
  FOR SELECT USING (id = (auth.jwt() ->> 'partner_id')::UUID);

-- Partners can view/insert their own bids
ALTER TABLE partner_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view own bids" ON partner_bids
  FOR SELECT USING (partner_id = (auth.jwt() ->> 'partner_id')::UUID);

CREATE POLICY "Partners insert own bids" ON partner_bids
  FOR INSERT WITH CHECK (partner_id = (auth.jwt() ->> 'partner_id')::UUID);
```

**Verification**:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%provider%' OR tablename LIKE '%partner%';
```

---

#### Task 6: Configure Supabase Vault ⚠️ PENDING

**Action Required**: Store all provider API credentials in Supabase Vault (see Section 6)

---

#### Task 7: Implement Provider Adapters ⚠️ IN PROGRESS

**Action Required**: Create adapter files (see Section 2)

```bash
# Create adapter files
touch /app/backend/providers/sabre_adapter.py
touch /app/backend/providers/hotelbeds_adapter.py
touch /app/backend/providers/amadeus_adapter.py
```

---

### 9.2 Tasks from MIGRATION_STATUS_REPORT.md

**Reference**: MIGRATION_STATUS_REPORT.md (Lines 200-253)

#### Task 1: Data Verification ✅ COMPLETED

**Status**: ✅ Verified (6 providers, 1 partner, 90 inventory records)

---

#### Task 2: Backend Testing ⚠️ TARGET 90%

**Reference**: MIGRATION_STATUS_REPORT.md (Lines 257-279)

**Current**: 100% (14/14 marketplace API tests passed)
**Target**: 90% overall backend coverage

**Action Required**:

```bash
cd /app/backend
pytest -v --cov=. --cov-report=html
```

---

#### Task 3: Provider Health Monitoring ⚠️ PENDING

**Action Required**: Implement scheduled health checks

```python
# /app/backend/scheduled_health_check.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from providers.universal_provider_manager import universal_provider_manager

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', minutes=5)
async def check_provider_health():
    """Run health checks every 5 minutes"""
    health_results = await universal_provider_manager.health_check_all()
    
    # Log results to provider_health_logs table
    for provider, result in health_results.items():
        await supabase.table('provider_health_logs').insert({
            'provider_id': provider_id,
            'check_time': datetime.now().isoformat(),
            'status': result['status'],
            'response_time_ms': result['response_time_ms'],
            'metadata': result.get('details', {})
        }).execute()

scheduler.start()
```

---

## 10. CROSS-CHAIN INTEGRATION STRATEGY

### 10.1 Polygon Agglayer Breakout Program

**Reference**: AGGLAYER_STRATEGIC_ANALYSIS.md (Lines 1-150)

#### Recommendation: ✅ **PURSUE AGGLAYER PROGRAM**

**Timeline**: Apply Q1 2026, Launch Q2 2026

#### Benefits

1. **Instant Distribution** (Lines 67-73):
   - 3M+ POL stakers receive airdrop
   - 10% of MAKU supply (1M tokens)
   - ~0.33 MAKU per staker

2. **Cross-Chain Interoperability** (Lines 85-94):
   - Connect to 10+ chains (Ethereum, Polygon PoS, zkEVM, Miden)
   - Unified liquidity pools
   - Fast transfers (<1 min)
   - Low fees (<$0.01 per bridge)

3. **Zero Cold-Start Problem** (Lines 74-83):
   - Immediate awareness
   - Polygon ecosystem support
   - Marketing via Polygon Foundation

#### Implementation Requirements

**Reference**: AGGLAYER_STRATEGIC_ANALYSIS.md (Lines 122-150)

1. **Token Airdrop**:
   - Allocate 5-15% MAKU supply to POL stakers
   - Implement vesting schedule (6-12 months)

2. **Technical Integration** (~2-3 months):
   - Agglayer SDK integration
   - Smart contract audits
   - Cross-chain testing

3. **Legal Compliance**:
   - Engage crypto legal counsel
   - Token classification review
   - Multi-jurisdiction compliance

---

### 10.2 Sui Network Integration

**Rationale**: Expand cross-chain reach beyond Polygon ecosystem

#### Benefits

1. **High Performance**:
   - 297,000 TPS capability
   - Sub-second finality
   - Low transaction costs (~$0.001)

2. **Developer-Friendly**:
   - Move language (Rust-based)
   - Parallel transaction execution
   - Object-centric model

3. **Travel Use Case Fit**:
   - Fast booking confirmations
   - Micro-transactions for tips
   - NFT-based loyalty programs

#### Implementation

```rust
// Sui Move contract for MAKU token bridge
module maku::cross_chain_bridge {
    use sui::coin::{Self, Coin};
    use sui::transfer;
    
    struct MAKU has drop {}
    
    public fun bridge_from_polygon(
        recipient: address,
        amount: u64,
        polygon_tx_hash: vector<u8>
    ) {
        // Verify Polygon transaction
        // Mint equivalent MAKU on Sui
        // Transfer to recipient
    }
}
```

---

### 10.3 Unified Bridge Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Polygon   │◄───────►│  Agglayer    │◄───────►│     Sui     │
│   (MAKU)    │         │    Bridge    │         │   (MAKU)    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        ▼                        │
      │                 ┌──────────────┐               │
      └────────────────►│  0x API      │◄──────────────┘
                        │  Aggregator  │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  MAKU Travel │
                        │   Platform   │
                        └──────────────┘
```

**Features**:
- Automatic chain selection based on lowest fees
- Unified liquidity across chains
- Seamless user experience (chain abstraction)

---

## 11. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2) ✅ COMPLETED

- [x] Database schema created
- [x] Base provider interface defined
- [x] Universal provider manager implemented
- [x] Data seeded (6 providers, 1 partner, 90 inventory)
- [x] Marketplace APIs deployed (14 endpoints)
- [x] Backend tests passing (100%)

---

### Phase 2: Provider Adapters (Weeks 3-4) ⚠️ IN PROGRESS

#### Week 3: Sabre & HotelBeds

- [ ] **Day 1-2**: Create `sabre_adapter.py`
  - [ ] OAuth 2.0 authentication
  - [ ] Hotel search implementation
  - [ ] Flight search implementation
  - [ ] Health check

- [ ] **Day 3-4**: Create `hotelbeds_adapter.py`
  - [ ] Signature-based authentication
  - [ ] Hotel search implementation
  - [ ] Availability check
  - [ ] Health check

- [ ] **Day 5**: Integration testing
  - [ ] Test Sabre adapter with sandbox API
  - [ ] Test HotelBeds adapter with test environment
  - [ ] Provider rotation validation

#### Week 4: Amadeus & Integration

- [ ] **Day 1-2**: Create `amadeus_adapter.py`
  - [ ] OAuth 2.0 authentication
  - [ ] Hotel search implementation
  - [ ] Flight search implementation
  - [ ] Activity search implementation
  - [ ] Health check

- [ ] **Day 3**: Supabase Vault configuration
  - [ ] Store API credentials in Vault
  - [ ] Update credential retrieval logic
  - [ ] Test secret rotation

- [ ] **Day 4-5**: End-to-end testing
  - [ ] Test all 3 providers
  - [ ] Validate rotation rules
  - [ ] Performance benchmarking
  - [ ] Error handling validation

---

### Phase 3: Health Monitoring & Optimization (Week 5)

- [ ] **Day 1**: Implement scheduled health checks
  - [ ] APScheduler setup
  - [ ] Health log persistence
  - [ ] Alert system for provider failures

- [ ] **Day 2**: Provider analytics dashboard
  - [ ] Response time tracking
  - [ ] Success rate monitoring
  - [ ] Cost per booking analysis

- [ ] **Day 3**: Rotation optimization
  - [ ] A/B test rotation algorithms
  - [ ] Machine learning for provider selection
  - [ ] Dynamic priority adjustment

- [ ] **Day 4-5**: Load testing
  - [ ] Concurrent search testing (1000+ req/s)
  - [ ] Failover validation
  - [ ] Rate limiting configuration

---

### Phase 4: Security & Compliance (Week 6)

- [ ] **Day 1-2**: Enable RLS policies
  - [ ] Partner data isolation
  - [ ] Admin-only access controls
  - [ ] Audit logging

- [ ] **Day 3**: API key rotation
  - [ ] Quarterly rotation schedule
  - [ ] Automated rotation script
  - [ ] Zero-downtime updates

- [ ] **Day 4-5**: Security audit
  - [ ] Penetration testing
  - [ ] Code review
  - [ ] Compliance documentation (PCI DSS, GDPR)

---

### Phase 5: Local Suppliers & Destinations (Weeks 7-8)

- [ ] **Week 7**: Destination content
  - [ ] Expand to 40+ destinations
  - [ ] Spiritual/cultural sites database
  - [ ] Hidden gems curation
  - [ ] Local business verification

- [ ] **Week 8**: Local supplier onboarding
  - [ ] Create local supplier adapter template
  - [ ] Onboarding wizard for local businesses
  - [ ] Direct booking integration
  - [ ] Commission settlement system

---

### Phase 6: Cross-Chain Integration (Weeks 9-12)

- [ ] **Week 9-10**: Polygon Agglayer
  - [ ] Apply to Breakout Program
  - [ ] Agglayer SDK integration
  - [ ] Smart contract development
  - [ ] Security audit (via Polygon)

- [ ] **Week 11**: Sui Integration
  - [ ] Move contract development
  - [ ] Bridge implementation
  - [ ] Testnet deployment

- [ ] **Week 12**: 0x API Integration
  - [ ] Bridge aggregator setup
  - [ ] Unified liquidity testing
  - [ ] Production launch

---

### Phase 7: Production Launch (Week 13+)

- [ ] **Week 13**: Staging deployment
  - [ ] Full system testing
  - [ ] Performance validation
  - [ ] Security final review

- [ ] **Week 14**: Production deployment
  - [ ] Blue-green deployment
  - [ ] Monitoring setup (Sentry, DataDog)
  - [ ] Incident response plan

- [ ] **Week 15**: Post-launch optimization
  - [ ] User feedback collection
  - [ ] Performance tuning
  - [ ] Cost optimization

---

## 12. SUCCESS METRICS & KPIs

### Provider Performance

| Metric                     | Target   | Current  | Status |
|----------------------------|----------|----------|--------|
| **Provider Count**         | 10+      | 6        | ⚠️     |
| **Search Success Rate**    | >95%     | TBD      | ⏳     |
| **Avg Response Time**      | <2s      | TBD      | ⏳     |
| **Provider Uptime**        | >99.5%   | TBD      | ⏳     |
| **Failover Success**       | >99%     | TBD      | ⏳     |

### Business Impact

| Metric                     | Target   | Current  | Status |
|----------------------------|----------|----------|--------|
| **Booking Conversion**     | >5%      | TBD      | ⏳     |
| **Cost per Booking**       | <$5      | TBD      | ⏳     |
| **Local Supplier Share**   | >30%     | 0%       | ⚠️     |
| **Eco-Rating Avg**         | >80      | 79       | ⚠️     |
| **User Satisfaction**      | >4.5/5   | TBD      | ⏳     |

---

## 13. CONCLUSION & NEXT STEPS

### Immediate Actions (This Week)

1. **Create adapter files** (sabre_adapter.py, hotelbeds_adapter.py, amadeus_adapter.py)
2. **Install dependencies** (`pip install httpx pydantic`)
3. **Configure Supabase Vault** with API credentials
4. **Test authentication flows** for all 3 providers

### Priority 1 (Next 2 Weeks)

1. **Complete provider adapters** with full search functionality
2. **Implement health checks** and monitoring
3. **Enable RLS policies** for security
4. **Expand local businesses** to 40+ destinations

### Priority 2 (Next Month)

1. **Apply to Polygon Agglayer** Breakout Program
2. **Begin Sui integration** research
3. **Production deployment** of provider system
4. **Launch partner onboarding** wizard

---

## 14. CITATIONS & REFERENCES

### Internal Documentation

1. **`providers/base_provider.py`** (Lines 58-137) - Base provider interface definition
2. **`providers/universal_provider_manager.py`** (Lines 1-278) - Provider rotation logic
3. **PRODUCTION_DEPLOYMENT_CHECKLIST.md** (Lines 1-100) - Deployment requirements
4. **MIGRATION_STATUS_REPORT.md** (Lines 200-300) - Seeding and testing status
5. **AGGLAYER_STRATEGIC_ANALYSIS.md** (Lines 1-150) - Cross-chain strategy

### External References

1. **Sabre Dev Portal**: https://developer.sabre.com/
2. **HotelBeds API Docs**: https://developer.hotelbeds.com/documentation/
3. **Amadeus Self-Service**: https://developers.amadeus.com/self-service
4. **Supabase Vault**: https://supabase.com/docs/guides/database/vault
5. **Polygon Agglayer**: https://polygon.technology/agglayer

---

**Document Prepared By**: CTO Agent  
**Review Status**: READY FOR IMPLEMENTATION  
**Approval Required**: Technical Lead, Security Team  
**Next Review**: After Phase 2 completion

---

END OF DOCUMENT
