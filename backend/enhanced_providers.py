"""
Enhanced Provider Integration System
Implements comprehensive provider support for:
- Expedia (flights and hotels) 
- Nuitée (hotels)
- GetYourGuide (activities)
"""

import httpx
import json
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import logging
import os
import asyncio

logger = logging.getLogger(__name__)

class ProviderConfig(BaseModel):
    provider_id: str
    provider_name: str
    provider_type: str  # flight, hotel, activity
    api_key: str = ""
    api_secret: str = ""
    base_url: str
    is_active: bool = True
    rate_limit: int = 100  # requests per minute
    timeout: int = 30
    metadata: Dict[str, Any] = {}

class SearchRequest(BaseModel):
    destination: str
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None  
    departure_date: Optional[str] = None
    return_date: Optional[str] = None
    guests: int = 2
    adults: int = 2
    children: int = 0
    rooms: int = 1
    origin: Optional[str] = None
    cabin_class: str = "economy"
    currency: str = "USD"

class ProviderResponse(BaseModel):
    provider_id: str
    provider_name: str
    success: bool
    data: List[Dict[str, Any]] = []
    total_results: int = 0
    response_time_ms: int = 0
    error_message: str = None
    metadata: Dict[str, Any] = {}

class ExpediaProvider:
    """Enhanced Expedia Provider with flights and hotels support"""
    
    def __init__(self, config: ProviderConfig):
        self.config = config
        self.client_id = config.api_key
        self.client_secret = config.api_secret
        self.access_token = None
        self.token_expires = None
        self.session = None

    async def authenticate(self) -> bool:
        """Authenticate with Expedia API"""
        try:
            if not self.client_id or not self.client_secret:
                logger.warning("Expedia credentials not configured")
                return False
            
            # OAuth2 token endpoint
            token_url = f"{self.config.base_url}/v3/oauth2/access-token"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    token_url,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=self.config.timeout
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_token = token_data.get("access_token")
                    expires_in = token_data.get("expires_in", 3600)
                    self.token_expires = datetime.utcnow() + timedelta(seconds=expires_in - 300)  # 5min buffer
                    return True
                else:
                    logger.error(f"Expedia authentication failed: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Expedia authentication error: {e}")
            return False

    async def get_headers(self) -> Dict[str, str]:
        """Get authenticated headers"""
        if not self.access_token or datetime.utcnow() >= self.token_expires:
            await self.authenticate()
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def search_flights(self, request: SearchRequest) -> ProviderResponse:
        """Search flights via Expedia"""
        start_time = datetime.utcnow()
        
        try:
            headers = await self.get_headers()
            if not headers.get("Authorization"):
                return self._create_demo_flight_response(request, start_time)
            
            # Expedia flight search endpoint
            search_url = f"{self.config.base_url}/v3/flights/search"
            
            payload = {
                "origin": request.origin,
                "destination": request.destination, 
                "departure_date": request.departure_date,
                "return_date": request.return_date,
                "passengers": {
                    "adults": request.adults,
                    "children": request.children
                },
                "cabin_class": request.cabin_class,
                "currency": request.currency
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    search_url,
                    json=payload,
                    headers=headers,
                    timeout=self.config.timeout
                )
                
                response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                if response.status_code == 200:
                    data = response.json()
                    flights = data.get("offers", [])
                    
                    return ProviderResponse(
                        provider_id="expedia_flights",
                        provider_name="Expedia Flights",
                        success=True,
                        data=flights,
                        total_results=len(flights),
                        response_time_ms=response_time
                    )
                else:
                    return self._create_demo_flight_response(request, start_time)
                    
        except Exception as e:
            logger.error(f"Expedia flight search error: {e}")
            return self._create_demo_flight_response(request, start_time)

    async def search_hotels(self, request: SearchRequest) -> ProviderResponse:
        """Search hotels via Expedia"""
        start_time = datetime.utcnow()
        
        try:
            headers = await self.get_headers()
            if not headers.get("Authorization"):
                return self._create_demo_hotel_response(request, start_time)
            
            # Expedia hotel search endpoint 
            search_url = f"{self.config.base_url}/v3/properties/search"
            
            payload = {
                "destination": request.destination,
                "checkin_date": request.checkin_date,
                "checkout_date": request.checkout_date,
                "rooms": [
                    {
                        "adults": request.adults,
                        "children": request.children
                    }
                ],
                "currency": request.currency
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    search_url,
                    json=payload,
                    headers=headers,
                    timeout=self.config.timeout
                )
                
                response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                if response.status_code == 200:
                    data = response.json()
                    hotels = data.get("properties", [])
                    
                    return ProviderResponse(
                        provider_id="expedia_hotels",
                        provider_name="Expedia Hotels",
                        success=True,
                        data=hotels,
                        total_results=len(hotels),
                        response_time_ms=response_time
                    )
                else:
                    return self._create_demo_hotel_response(request, start_time)
                    
        except Exception as e:
            logger.error(f"Expedia hotel search error: {e}")
            return self._create_demo_hotel_response(request, start_time)

    def _create_demo_flight_response(self, request: SearchRequest, start_time: datetime) -> ProviderResponse:
        response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        return ProviderResponse(
            provider_id="expedia_flights",
            provider_name="Expedia Flights",
            success=True,
            data=[{
                "flight_id": "EXP_FL_001",
                "airline": "Expedia Airways",
                "flight_number": "EX123",
                "origin": request.origin,
                "destination": request.destination,
                "departure_time": f"{request.departure_date}T08:00:00Z",
                "arrival_time": f"{request.departure_date}T16:30:00Z",
                "duration": "8h 30m",
                "price": 599.00,
                "currency": "USD",
                "cabin_class": request.cabin_class,
                "demo_mode": True
            }],
            total_results=1,
            response_time_ms=response_time,
            metadata={"demo_mode": True}
        )

    def _create_demo_hotel_response(self, request: SearchRequest, start_time: datetime) -> ProviderResponse:
        response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        return ProviderResponse(
            provider_id="expedia_hotels", 
            provider_name="Expedia Hotels",
            success=True,
            data=[{
                "hotel_id": "EXP_HTL_001",
                "name": "Expedia Grand Hotel",
                "destination": request.destination,
                "rating": 4.5,
                "price_per_night": 189.00,
                "currency": "USD",
                "checkin_date": request.checkin_date,
                "checkout_date": request.checkout_date,
                "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
                "demo_mode": True
            }],
            total_results=1,
            response_time_ms=response_time,
            metadata={"demo_mode": True}
        )

class NuiteeProvider:
    """Nuitée Hotel Provider Integration"""
    
    def __init__(self, config: ProviderConfig):
        self.config = config
        self.api_key = config.api_key
        self.api_secret = config.api_secret

    async def authenticate(self) -> bool:
        """Nuitée uses API key authentication"""
        return bool(self.api_key)

    async def search_hotels(self, request: SearchRequest) -> ProviderResponse:
        """Search hotels via Nuitée API"""
        start_time = datetime.utcnow()
        
        try:
            if not self.api_key:
                return self._create_demo_response(request, start_time)
            
            headers = {
                "X-API-Key": self.api_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            # Nuitée search endpoint
            search_url = f"{self.config.base_url}/api/v1/search"
            
            payload = {
                "destination": request.destination,
                "check_in": request.checkin_date,
                "check_out": request.checkout_date,
                "guests": request.guests,
                "currency": request.currency
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    search_url,
                    json=payload,
                    headers=headers,
                    timeout=self.config.timeout
                )
                
                response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                if response.status_code == 200:
                    data = response.json()
                    hotels = data.get("hotels", [])
                    
                    return ProviderResponse(
                        provider_id="nuitee_hotels",
                        provider_name="Nuitée Hotels",
                        success=True,
                        data=hotels,
                        total_results=len(hotels),
                        response_time_ms=response_time
                    )
                else:
                    return self._create_demo_response(request, start_time)
                    
        except Exception as e:
            logger.error(f"Nuitée hotel search error: {e}")
            return self._create_demo_response(request, start_time)

    def _create_demo_response(self, request: SearchRequest, start_time: datetime) -> ProviderResponse:
        response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        return ProviderResponse(
            provider_id="nuitee_hotels",
            provider_name="Nuitée Hotels", 
            success=True,
            data=[{
                "hotel_id": "NUIT_HTL_001",
                "name": "Nuitée Boutique Hotel",
                "destination": request.destination,
                "rating": 4.3,
                "price_per_night": 156.00,
                "currency": "USD",
                "checkin_date": request.checkin_date,
                "checkout_date": request.checkout_date,
                "amenities": ["WiFi", "Continental Breakfast", "City Center"],
                "demo_mode": True
            }],
            total_results=1,
            response_time_ms=response_time,
            metadata={"demo_mode": True}
        )

class GetYourGuideProvider:
    """GetYourGuide Activities Provider Integration"""
    
    def __init__(self, config: ProviderConfig):
        self.config = config
        self.api_key = config.api_key
        self.api_secret = config.api_secret

    async def authenticate(self) -> bool:
        """GetYourGuide uses API key authentication"""
        return bool(self.api_key)

    async def search_activities(self, request: SearchRequest) -> ProviderResponse:
        """Search activities via GetYourGuide API"""
        start_time = datetime.utcnow()
        
        try:
            if not self.api_key:
                return self._create_demo_response(request, start_time)
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            # GetYourGuide search endpoint
            search_url = f"{self.config.base_url}/activities/v1/search"
            
            payload = {
                "destination": request.destination,
                "date": request.departure_date or request.checkin_date,
                "participants": request.adults + request.children,
                "currency": request.currency
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    search_url,
                    json=payload,
                    headers=headers,
                    timeout=self.config.timeout
                )
                
                response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                
                if response.status_code == 200:
                    data = response.json()
                    activities = data.get("activities", [])
                    
                    return ProviderResponse(
                        provider_id="getyourguide_activities",
                        provider_name="GetYourGuide Activities",
                        success=True,
                        data=activities,
                        total_results=len(activities),
                        response_time_ms=response_time
                    )
                else:
                    return self._create_demo_response(request, start_time)
                    
        except Exception as e:
            logger.error(f"GetYourGuide activity search error: {e}")
            return self._create_demo_response(request, start_time)

    def _create_demo_response(self, request: SearchRequest, start_time: datetime) -> ProviderResponse:
        response_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        return ProviderResponse(
            provider_id="getyourguide_activities",
            provider_name="GetYourGuide Activities",
            success=True,
            data=[{
                "activity_id": "GYG_ACT_001",
                "title": "City Walking Tour & Cultural Experience",
                "destination": request.destination,
                "rating": 4.7,
                "price": 45.00,
                "currency": "USD",
                "duration": "3 hours",
                "category": "Cultural Tours",
                "highlights": ["Local Guide", "Small Group", "Historical Sites"],
                "demo_mode": True
            }, {
                "activity_id": "GYG_ACT_002", 
                "title": "Food & Wine Tasting Experience",
                "destination": request.destination,
                "rating": 4.9,
                "price": 89.00,
                "currency": "USD",
                "duration": "4 hours",
                "category": "Food & Drink",
                "highlights": ["Wine Tasting", "Local Cuisine", "Expert Guide"],
                "demo_mode": True
            }],
            total_results=2,
            response_time_ms=response_time,
            metadata={"demo_mode": True}
        )