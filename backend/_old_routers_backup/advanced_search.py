"""
Advanced Search Module for Maku.Travel
Provides enhanced search capabilities with multi-city, flexible dates, and advanced filtering
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# Create router
advanced_search_router = APIRouter(prefix="/api/search", tags=["advanced-search"])

# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"

class HotelSortBy(str, Enum):
    PRICE = "price"
    RATING = "rating"
    DISTANCE = "distance"
    POPULARITY = "popularity"
    REVIEW_COUNT = "review_count"

class FlightSortBy(str, Enum):
    PRICE = "price"
    DURATION = "duration"
    DEPARTURE_TIME = "departure_time"
    STOPS = "stops"
    AIRLINE = "airline"

class ActivitySortBy(str, Enum):
    PRICE = "price"
    RATING = "rating"
    DURATION = "duration"
    POPULARITY = "popularity"

class PriceRange(BaseModel):
    min: Optional[float] = Field(None, ge=0, description="Minimum price")
    max: Optional[float] = Field(None, ge=0, description="Maximum price")
    currency: str = Field("USD", description="Currency code")

# ============================================================================
# ADVANCED SEARCH REQUEST MODELS
# ============================================================================

class FlexibleDateRange(BaseModel):
    """Flexible date search (±days from target date)"""
    target_date: str = Field(..., description="Target date in YYYY-MM-DD format")
    flexibility_days: int = Field(3, ge=0, le=7, description="Days before/after target (±3 default)")

class MultiCityFlight(BaseModel):
    """Single leg of multi-city flight"""
    origin: str = Field(..., description="Origin airport code (e.g., NYC)")
    destination: str = Field(..., description="Destination airport code (e.g., LON)")
    departure_date: str = Field(..., description="Departure date YYYY-MM-DD")

class AdvancedHotelSearchRequest(BaseModel):
    """Enhanced hotel search with advanced filters"""
    # Basic search
    destination: str = Field(..., description="Destination city or region")
    checkin: str = Field(..., description="Check-in date YYYY-MM-DD")
    checkout: str = Field(..., description="Check-out date YYYY-MM-DD")
    guests: Dict[str, int] = Field({"adults": 2, "children": 0}, description="Guest counts")
    rooms: int = Field(1, ge=1, le=10, description="Number of rooms")
    
    # Advanced filters
    price_range: Optional[PriceRange] = None
    star_rating: Optional[List[int]] = Field(None, description="Filter by star rating [3, 4, 5]")
    guest_rating: Optional[float] = Field(None, ge=0, le=10, description="Minimum guest rating")
    amenities: Optional[List[str]] = Field(None, description="Required amenities: wifi, pool, gym, etc")
    property_types: Optional[List[str]] = Field(None, description="hotel, resort, apartment, etc")
    neighborhood: Optional[str] = Field(None, description="Specific neighborhood filter")
    distance_from_center: Optional[float] = Field(None, description="Max km from city center")
    
    # Sort & pagination
    sort_by: HotelSortBy = Field(HotelSortBy.PRICE, description="Sort criterion")
    sort_order: SortOrder = Field(SortOrder.ASC, description="Sort direction")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Results per page")
    
    # Flexible dates
    flexible_dates: bool = Field(False, description="Enable flexible date search")
    date_flexibility_days: int = Field(3, ge=0, le=7, description="Days flexibility ±")
    
    # Cache control
    use_cache: bool = Field(True, description="Use cached results if available")
    
    @validator('checkin', 'checkout')
    def validate_dates(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')

class AdvancedFlightSearchRequest(BaseModel):
    """Enhanced flight search with multi-city and flexible dates"""
    # Search type
    search_type: Literal["one-way", "round-trip", "multi-city"] = Field("round-trip")
    
    # Basic search (for one-way and round-trip)
    origin: Optional[str] = Field(None, description="Origin airport code")
    destination: Optional[str] = Field(None, description="Destination airport code")
    departure_date: Optional[str] = Field(None, description="Departure date YYYY-MM-DD")
    return_date: Optional[str] = Field(None, description="Return date YYYY-MM-DD (round-trip only)")
    
    # Multi-city search
    multi_city_legs: Optional[List[MultiCityFlight]] = Field(None, description="Multi-city flight legs")
    
    # Passengers
    passengers: Dict[str, int] = Field({"adults": 1, "children": 0, "infants": 0})
    cabin_class: Literal["economy", "premium_economy", "business", "first"] = Field("economy")
    
    # Advanced filters
    price_range: Optional[PriceRange] = None
    max_stops: Optional[int] = Field(None, ge=0, le=3, description="Maximum number of stops (0=nonstop)")
    preferred_airlines: Optional[List[str]] = Field(None, description="Preferred airline codes")
    excluded_airlines: Optional[List[str]] = Field(None, description="Excluded airline codes")
    max_duration_hours: Optional[float] = Field(None, ge=0, description="Maximum flight duration")
    departure_time_range: Optional[Dict[str, str]] = Field(None, description="{'min': 'HH:MM', 'max': 'HH:MM'}")
    
    # Sort & pagination
    sort_by: FlightSortBy = Field(FlightSortBy.PRICE, description="Sort criterion")
    sort_order: SortOrder = Field(SortOrder.ASC, description="Sort direction")
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
    
    # Flexible dates
    flexible_dates: bool = Field(False, description="Enable flexible date search")
    date_flexibility_days: int = Field(3, ge=0, le=7)
    
    # Cache control
    use_cache: bool = Field(True)
    
    @validator('multi_city_legs')
    def validate_multi_city(cls, v, values):
        if values.get('search_type') == 'multi-city':
            if not v or len(v) < 2:
                raise ValueError('Multi-city search requires at least 2 legs')
        return v

class AdvancedActivitySearchRequest(BaseModel):
    """Enhanced activity search with advanced filters"""
    # Basic search
    destination: str = Field(..., description="Destination city or region")
    start_date: str = Field(..., description="Activity start date YYYY-MM-DD")
    end_date: Optional[str] = Field(None, description="Activity end date YYYY-MM-DD")
    participants: Dict[str, int] = Field({"adults": 2, "children": 0})
    
    # Advanced filters
    price_range: Optional[PriceRange] = None
    categories: Optional[List[str]] = Field(None, description="tours, activities, attractions, etc")
    duration_hours: Optional[Dict[str, float]] = Field(None, description="{'min': 2, 'max': 8}")
    activity_types: Optional[List[str]] = Field(None, description="adventure, cultural, food, etc")
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    languages: Optional[List[str]] = Field(None, description="Preferred tour languages")
    accessibility: Optional[bool] = Field(None, description="Wheelchair accessible")
    
    # Sort & pagination
    sort_by: ActivitySortBy = Field(ActivitySortBy.POPULARITY)
    sort_order: SortOrder = Field(SortOrder.DESC)
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
    
    # Cache control
    use_cache: bool = Field(True)

# ============================================================================
# RESPONSE MODELS
# ============================================================================

class SearchMetadata(BaseModel):
    """Search metadata and stats"""
    total_results: int
    page: int
    per_page: int
    total_pages: int
    search_duration_ms: float
    from_cache: bool
    filters_applied: Dict[str, Any]

class HotelResult(BaseModel):
    """Enhanced hotel search result"""
    hotel_id: str
    name: str
    star_rating: float
    guest_rating: float
    review_count: int
    price_per_night: float
    total_price: float
    currency: str
    location: Dict[str, Any]
    amenities: List[str]
    property_type: str
    images: List[str]
    distance_from_center_km: float
    cancellation_policy: str
    provider: str
    availability: bool

class FlightResult(BaseModel):
    """Enhanced flight search result"""
    flight_id: str
    airline: str
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    stops: int
    stop_cities: List[str]
    cabin_class: str
    price: float
    currency: str
    seats_available: int
    baggage_allowance: Dict[str, Any]
    provider: str

class ActivityResult(BaseModel):
    """Enhanced activity search result"""
    activity_id: str
    title: str
    description: str
    category: str
    activity_type: str
    duration_hours: float
    price: float
    currency: str
    rating: float
    review_count: int
    location: Dict[str, Any]
    images: List[str]
    languages: List[str]
    accessibility: bool
    provider: str

# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@advanced_search_router.post("/hotels/advanced")
async def advanced_hotel_search(request: AdvancedHotelSearchRequest):
    """
    Advanced hotel search with flexible dates and comprehensive filtering
    
    Features:
    - Flexible date ranges (±3-7 days)
    - Price, rating, and amenity filters
    - Distance from center filtering
    - Multiple sort options
    - Pagination support
    - Result caching
    """
    try:
        start_time = datetime.now()
        
        # TODO: Integrate with real provider APIs (Expedia, Amadeus, etc.)
        # For now, return enhanced mock data
        
        # Simulate filtering and sorting
        mock_results = [
            HotelResult(
                hotel_id=f"hotel_{i}",
                name=f"Hotel {i} - {request.destination}",
                star_rating=float(4 + (i % 2)),
                guest_rating=8.5 + (i * 0.1),
                review_count=500 + (i * 50),
                price_per_night=100.0 + (i * 20),
                total_price=300.0 + (i * 60),
                currency="USD",
                location={
                    "address": f"123 Main St, {request.destination}",
                    "latitude": 40.7128 + (i * 0.01),
                    "longitude": -74.0060 + (i * 0.01)
                },
                amenities=["wifi", "pool", "gym", "restaurant"] if i % 2 == 0 else ["wifi", "breakfast"],
                property_type="hotel" if i % 3 == 0 else "resort",
                images=[f"https://example.com/hotel{i}.jpg"],
                distance_from_center_km=1.5 + (i * 0.5),
                cancellation_policy="Free cancellation until 24 hours before check-in",
                provider="Expedia",
                availability=True
            )
            for i in range(1, 21)  # Generate 20 results
        ]
        
        # Apply filters
        filtered_results = mock_results
        
        if request.price_range:
            if request.price_range.min:
                filtered_results = [r for r in filtered_results if r.price_per_night >= request.price_range.min]
            if request.price_range.max:
                filtered_results = [r for r in filtered_results if r.price_per_night <= request.price_range.max]
        
        if request.star_rating:
            filtered_results = [r for r in filtered_results if r.star_rating in request.star_rating]
        
        if request.guest_rating:
            filtered_results = [r for r in filtered_results if r.guest_rating >= request.guest_rating]
        
        if request.amenities:
            filtered_results = [r for r in filtered_results if all(a in r.amenities for a in request.amenities)]
        
        # Sort results
        sort_key_map = {
            HotelSortBy.PRICE: lambda x: x.price_per_night,
            HotelSortBy.RATING: lambda x: x.guest_rating,
            HotelSortBy.DISTANCE: lambda x: x.distance_from_center_km,
            HotelSortBy.POPULARITY: lambda x: x.review_count,
            HotelSortBy.REVIEW_COUNT: lambda x: x.review_count
        }
        
        filtered_results.sort(
            key=sort_key_map[request.sort_by],
            reverse=(request.sort_order == SortOrder.DESC)
        )
        
        # Pagination
        start_idx = (request.page - 1) * request.per_page
        end_idx = start_idx + request.per_page
        paginated_results = filtered_results[start_idx:end_idx]
        
        # Calculate metadata
        search_duration = (datetime.now() - start_time).total_seconds() * 1000
        
        metadata = SearchMetadata(
            total_results=len(filtered_results),
            page=request.page,
            per_page=request.per_page,
            total_pages=(len(filtered_results) + request.per_page - 1) // request.per_page,
            search_duration_ms=search_duration,
            from_cache=False,
            filters_applied={
                "price_range": request.price_range.dict() if request.price_range else None,
                "star_rating": request.star_rating,
                "guest_rating": request.guest_rating,
                "amenities": request.amenities,
                "sort_by": request.sort_by,
                "sort_order": request.sort_order
            }
        )
        
        return {
            "success": True,
            "results": paginated_results,
            "metadata": metadata,
            "flexible_dates_available": request.flexible_dates
        }
        
    except Exception as e:
        logger.error(f"Advanced hotel search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@advanced_search_router.post("/flights/advanced")
async def advanced_flight_search(request: AdvancedFlightSearchRequest):
    """
    Advanced flight search with multi-city and flexible dates
    
    Features:
    - One-way, round-trip, and multi-city searches
    - Flexible date ranges
    - Stop count filtering (nonstop, 1 stop, etc.)
    - Airline preferences
    - Duration filtering
    - Multiple sort options
    """
    try:
        start_time = datetime.now()
        
        # Validate search type specific requirements
        if request.search_type == "multi-city" and not request.multi_city_legs:
            raise HTTPException(status_code=400, detail="Multi-city search requires flight legs")
        
        if request.search_type in ["one-way", "round-trip"] and (not request.origin or not request.destination):
            raise HTTPException(status_code=400, detail="Origin and destination required")
        
        # Generate mock results based on search type
        num_results = 15
        mock_results = []
        
        for i in range(1, num_results + 1):
            flight = FlightResult(
                flight_id=f"flight_{i}",
                airline=["United", "Delta", "American", "Emirates", "Lufthansa"][i % 5],
                flight_number=f"UA{1000 + i}",
                origin=request.origin or request.multi_city_legs[0].origin if request.multi_city_legs else "NYC",
                destination=request.destination or request.multi_city_legs[0].destination if request.multi_city_legs else "LON",
                departure_time=f"2025-06-{10 + (i % 20):02d}T{8 + (i % 12):02d}:00:00",
                arrival_time=f"2025-06-{10 + (i % 20):02d}T{20 + (i % 4):02d}:00:00",
                duration_minutes=360 + (i * 30),
                stops=i % 3,
                stop_cities=["ATL"] if i % 3 == 1 else [] if i % 3 == 0 else ["ATL", "FRA"],
                cabin_class=request.cabin_class,
                price=500.0 + (i * 50),
                currency="USD",
                seats_available=20 + i,
                baggage_allowance={"checked": "2 bags", "carry_on": "1 bag"},
                provider="Expedia"
            )
            mock_results.append(flight)
        
        # Apply filters
        filtered_results = mock_results
        
        if request.max_stops is not None:
            filtered_results = [f for f in filtered_results if f.stops <= request.max_stops]
        
        if request.preferred_airlines:
            filtered_results = [f for f in filtered_results if f.airline in request.preferred_airlines]
        
        if request.price_range:
            if request.price_range.min:
                filtered_results = [f for f in filtered_results if f.price >= request.price_range.min]
            if request.price_range.max:
                filtered_results = [f for f in filtered_results if f.price <= request.price_range.max]
        
        # Sort
        sort_key_map = {
            FlightSortBy.PRICE: lambda x: x.price,
            FlightSortBy.DURATION: lambda x: x.duration_minutes,
            FlightSortBy.STOPS: lambda x: x.stops,
            FlightSortBy.AIRLINE: lambda x: x.airline,
            FlightSortBy.DEPARTURE_TIME: lambda x: x.departure_time
        }
        
        filtered_results.sort(
            key=sort_key_map[request.sort_by],
            reverse=(request.sort_order == SortOrder.DESC)
        )
        
        # Pagination
        start_idx = (request.page - 1) * request.per_page
        end_idx = start_idx + request.per_page
        paginated_results = filtered_results[start_idx:end_idx]
        
        search_duration = (datetime.now() - start_time).total_seconds() * 1000
        
        metadata = SearchMetadata(
            total_results=len(filtered_results),
            page=request.page,
            per_page=request.per_page,
            total_pages=(len(filtered_results) + request.per_page - 1) // request.per_page,
            search_duration_ms=search_duration,
            from_cache=False,
            filters_applied={
                "search_type": request.search_type,
                "max_stops": request.max_stops,
                "cabin_class": request.cabin_class,
                "price_range": request.price_range.dict() if request.price_range else None
            }
        )
        
        return {
            "success": True,
            "results": paginated_results,
            "metadata": metadata,
            "search_type": request.search_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Advanced flight search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@advanced_search_router.post("/activities/advanced")
async def advanced_activity_search(request: AdvancedActivitySearchRequest):
    """
    Advanced activity search with comprehensive filtering
    
    Features:
    - Category and type filtering
    - Duration ranges
    - Language preferences
    - Accessibility options
    - Rating filters
    """
    try:
        start_time = datetime.now()
        
        # Generate mock activity results
        mock_results = [
            ActivityResult(
                activity_id=f"activity_{i}",
                title=f"Amazing {request.destination} Tour {i}",
                description=f"Experience the best of {request.destination} with this curated tour",
                category=["tours", "activities", "attractions"][i % 3],
                activity_type=["cultural", "adventure", "food", "nature"][i % 4],
                duration_hours=2.0 + (i * 0.5),
                price=50.0 + (i * 15),
                currency="USD",
                rating=4.0 + (i * 0.1),
                review_count=100 + (i * 20),
                location={
                    "address": f"{request.destination} Center",
                    "latitude": 40.7128,
                    "longitude": -74.0060
                },
                images=[f"https://example.com/activity{i}.jpg"],
                languages=["English", "Spanish"] if i % 2 == 0 else ["English"],
                accessibility=i % 3 == 0,
                provider="Viator"
            )
            for i in range(1, 16)
        ]
        
        # Apply filters
        filtered_results = mock_results
        
        if request.categories:
            filtered_results = [a for a in filtered_results if a.category in request.categories]
        
        if request.activity_types:
            filtered_results = [a for a in filtered_results if a.activity_type in request.activity_types]
        
        if request.min_rating:
            filtered_results = [a for a in filtered_results if a.rating >= request.min_rating]
        
        if request.price_range:
            if request.price_range.min:
                filtered_results = [a for a in filtered_results if a.price >= request.price_range.min]
            if request.price_range.max:
                filtered_results = [a for a in filtered_results if a.price <= request.price_range.max]
        
        if request.accessibility is not None:
            filtered_results = [a for a in filtered_results if a.accessibility == request.accessibility]
        
        # Sort
        sort_key_map = {
            ActivitySortBy.PRICE: lambda x: x.price,
            ActivitySortBy.RATING: lambda x: x.rating,
            ActivitySortBy.DURATION: lambda x: x.duration_hours,
            ActivitySortBy.POPULARITY: lambda x: x.review_count
        }
        
        filtered_results.sort(
            key=sort_key_map[request.sort_by],
            reverse=(request.sort_order == SortOrder.DESC)
        )
        
        # Pagination
        start_idx = (request.page - 1) * request.per_page
        end_idx = start_idx + request.per_page
        paginated_results = filtered_results[start_idx:end_idx]
        
        search_duration = (datetime.now() - start_time).total_seconds() * 1000
        
        metadata = SearchMetadata(
            total_results=len(filtered_results),
            page=request.page,
            per_page=request.per_page,
            total_pages=(len(filtered_results) + request.per_page - 1) // request.per_page,
            search_duration_ms=search_duration,
            from_cache=False,
            filters_applied={
                "categories": request.categories,
                "activity_types": request.activity_types,
                "min_rating": request.min_rating,
                "accessibility": request.accessibility
            }
        )
        
        return {
            "success": True,
            "results": paginated_results,
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Advanced activity search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SEARCH HISTORY & SUGGESTIONS
# ============================================================================

@advanced_search_router.get("/history/{user_id}")
async def get_search_history(user_id: str, limit: int = 10):
    """Get user's recent search history"""
    try:
        # TODO: Integrate with database
        mock_history = [
            {
                "search_id": f"search_{i}",
                "type": ["hotel", "flight", "activity"][i % 3],
                "query": f"Search {i}",
                "timestamp": datetime.now().isoformat(),
                "result_count": 15 + i
            }
            for i in range(1, limit + 1)
        ]
        
        return {
            "success": True,
            "history": mock_history,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"Failed to get search history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@advanced_search_router.get("/suggestions")
async def get_search_suggestions(
    query: str = Query(..., min_length=2),
    type: Literal["destination", "hotel", "activity"] = "destination"
):
    """Get autocomplete suggestions for search"""
    try:
        # TODO: Integrate with real suggestion API
        mock_suggestions = [
            {"id": f"sug_{i}", "text": f"{query} {i}", "type": type}
            for i in range(1, 6)
        ]
        
        return {
            "success": True,
            "query": query,
            "suggestions": mock_suggestions
        }
        
    except Exception as e:
        logger.error(f"Failed to get suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
