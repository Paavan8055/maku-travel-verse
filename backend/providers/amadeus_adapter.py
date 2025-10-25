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
