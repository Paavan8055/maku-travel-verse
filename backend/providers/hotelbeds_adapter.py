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
