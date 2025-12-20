from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/partners", tags=["partners"])

class PartnerStats(BaseModel):
    occupancy_rate: float
    adr: float
    revpar: float
    bookings_this_month: int
    revenue_this_month: float
    avg_lead_time: int
    bid_win_rate: float
    active_dreams: int
    your_active_bids: int
    won_this_month: int

class DreamOpportunity(BaseModel):
    dream_id: str
    user_id: str
    destination: str
    budget_min: float
    budget_max: float
    date_start: str
    date_end: str
    flexible_dates: bool
    travelers: int
    preferences: List[str]
    urgency: str
    savings_progress: float
    active_bids: int
    your_bid_rank: Optional[int] = None

class Campaign(BaseModel):
    id: str
    title: str
    start_date: str
    end_date: str
    discount: int
    min_allocation: int
    max_allocation: int
    current_allocation: int
    status: str
    revenue: float

@router.get("/stats", response_model=PartnerStats)
async def get_partner_stats():
    """Get partner dashboard statistics"""
    return PartnerStats(
        occupancy_rate=72.5,
        adr=245.0,
        revpar=177.6,
        bookings_this_month=47,
        revenue_this_month=45230.0,
        avg_lead_time=23,
        bid_win_rate=67.0,
        active_dreams=47,
        your_active_bids=12,
        won_this_month=23
    )

@router.get("/opportunities", response_model=List[DreamOpportunity])
async def get_dream_opportunities():
    """Get available dream bidding opportunities"""
    return [
        DreamOpportunity(
            dream_id="dream-user-123",
            user_id="user-456",
            destination="Maldives",
            budget_min=5000.0,
            budget_max=7500.0,
            date_start="2025-05-15",
            date_end="2025-05-22",
            flexible_dates=True,
            travelers=2,
            preferences=["Overwater villa", "Spa", "Diving"],
            urgency="high",
            savings_progress=65.0,
            active_bids=8,
            your_bid_rank=3
        ),
        DreamOpportunity(
            dream_id="dream-user-789",
            user_id="user-012",
            destination="Bali",
            budget_min=2000.0,
            budget_max=3500.0,
            date_start="2025-06-01",
            date_end="2025-06-10",
            flexible_dates=True,
            travelers=4,
            preferences=["Family-friendly", "Beach", "Cultural tours"],
            urgency="medium",
            savings_progress=40.0,
            active_bids=5
        ),
        DreamOpportunity(
            dream_id="dream-user-345",
            user_id="user-678",
            destination="Santorini",
            budget_min=3000.0,
            budget_max=5000.0,
            date_start="2025-07-10",
            date_end="2025-07-17",
            flexible_dates=False,
            travelers=2,
            preferences=["Sunset views", "Wine tasting", "Photography"],
            urgency="low",
            savings_progress=80.0,
            active_bids=12
        )
    ]

@router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns():
    """Get partner campaigns"""
    return [
        Campaign(
            id="camp-001",
            title="Summer Off-Season Special",
            start_date="2025-06-01",
            end_date="2025-08-31",
            discount=40,
            min_allocation=10,
            max_allocation=50,
            current_allocation=35,
            status="active",
            revenue=67500.0
        ),
        Campaign(
            id="camp-002",
            title="Winter Escape",
            start_date="2025-12-01",
            end_date="2026-02-28",
            discount=35,
            min_allocation=15,
            max_allocation=60,
            current_allocation=12,
            status="active",
            revenue=28400.0
        ),
        Campaign(
            id="camp-003",
            title="Spring Break Alternative",
            start_date="2025-04-15",
            end_date="2025-05-15",
            discount=45,
            min_allocation=5,
            max_allocation=30,
            current_allocation=30,
            status="completed",
            revenue=45000.0
        )
    ]

@router.post("/campaigns", response_model=Dict[str, Any])
async def create_campaign(campaign: Dict[str, Any]):
    """Create new campaign"""
    return {
        "success": True,
        "campaign_id": f"camp-{random.randint(1000, 9999)}",
        "message": "Campaign created successfully"
    }

@router.get("/occupancy/alerts", response_model=List[Dict[str, Any]])
async def get_occupancy_alerts():
    """Get low occupancy alerts"""
    return [
        {
            "period": "May 15-30, 2025",
            "occupancy": 38,
            "matching_dreams": 15,
            "recommended_discount": 30,
            "estimated_improvement": 12
        }
    ]

@router.get("/settlements", response_model=List[Dict[str, Any]])
async def get_settlements():
    """Get settlement history"""
    return [
        {"date": "Apr 1-15, 2025", "amount": 12450, "status": "Paid", "color": "green"},
        {"date": "Apr 16-30, 2025", "amount": 15680, "status": "Processing", "color": "yellow"},
        {"date": "May 1-15, 2025", "amount": 17100, "status": "Pending", "color": "slate"}
    ]

@router.post("/bids/{dream_id}", response_model=Dict[str, Any])
async def submit_bid(dream_id: str, bid_data: Dict[str, Any]):
    """Submit bid for dream opportunity"""
    return {
        "success": True,
        "bid_id": f"bid-{random.randint(1000, 9999)}",
        "dream_id": dream_id,
        "status": "submitted",
        "message": "Bid submitted successfully"
    }
