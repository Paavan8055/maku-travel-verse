"""
Off-Season Occupancy Engine API Endpoints
MAKU.Travel "Zero Empty Beds" Initiative

Provides REST API endpoints for:
- Partner campaign management
- Smart Dreams suggestion matching
- LAXMI wallet operations
- Yield optimization
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from supabase import create_client, Client
import os
import uuid
import logging

logger = logging.getLogger(__name__)

# Create router
offseason_router = APIRouter(prefix="/api", tags=["Off-Season Engine"])

# Supabase client initialization
def get_supabase_client() -> Client:
    """Get Supabase client from environment"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        )
    
    return create_client(supabase_url, supabase_key)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CampaignCreate(BaseModel):
    """Model for creating/updating partner campaigns"""
    partner_id: str = Field(..., description="UUID of partner")
    title: str = Field(..., min_length=3, max_length=200, description="Campaign title")
    description: Optional[str] = Field(None, max_length=1000, description="Campaign description")
    start_date: date = Field(..., description="Campaign start date (YYYY-MM-DD)")
    end_date: date = Field(..., description="Campaign end date (YYYY-MM-DD)")
    min_allocation: int = Field(..., ge=1, description="Minimum rooms to fill")
    max_allocation: int = Field(..., ge=1, description="Maximum rooms available")
    discount: float = Field(..., ge=0.01, le=100.0, description="Discount percentage (0.01-100)")
    blackout: Optional[List[str]] = Field(default=[], description="Blackout dates ['YYYY-MM-DD']")
    audience_tags: Optional[List[str]] = Field(default=[], description="Target audience tags")
    status: Optional[str] = Field(default="draft", description="Campaign status")
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v
    
    @validator('max_allocation')
    def validate_allocation(cls, v, values):
        if 'min_allocation' in values and v < values['min_allocation']:
            raise ValueError('max_allocation must be >= min_allocation')
        return v

class CampaignResponse(BaseModel):
    """Response model for campaign operations"""
    success: bool
    campaign_id: str
    message: str
    status: str

class DailyAllocation(BaseModel):
    """Daily allocation data"""
    date: str
    allocated: int
    available: int
    utilization: float

class CampaignLedger(BaseModel):
    """Campaign ledger response"""
    campaign_id: str
    title: str
    daily_allocation: List[DailyAllocation]
    total_allocated: int
    total_available: int

class DreamIntentCreate(BaseModel):
    """Model for creating dream intents"""
    destination: str = Field(..., min_length=2, max_length=200)
    budget: float = Field(..., gt=0, description="Maximum budget")
    tags: Optional[List[str]] = Field(default=[], description="Preference tags")
    flexible_dates: Optional[bool] = Field(default=False)
    preferred_start_date: Optional[date] = None
    preferred_end_date: Optional[date] = None
    adults: Optional[int] = Field(default=1, ge=1)
    children: Optional[int] = Field(default=0, ge=0)

class Deal(BaseModel):
    """Model for deal candidate"""
    campaign_id: str
    campaign_title: str
    partner_name: str
    discount: float
    price: float
    original_price: float
    score: float
    start_date: str
    end_date: str
    expires_at: str

class DreamSuggestionResponse(BaseModel):
    """Response for dream suggestion"""
    dream_id: str
    suggested_deals: List[Deal]

class WalletActivateResponse(BaseModel):
    """Response for wallet activation"""
    wallet_id: str
    balance: float
    tier: str
    status: str

class WalletDepositRequest(BaseModel):
    """Request for wallet deposit"""
    user_id: str
    amount: float = Field(..., gt=0)
    type: str = Field(default="cashback")
    booking_id: Optional[str] = None
    description: Optional[str] = None

class WalletRedeemRequest(BaseModel):
    """Request for wallet redemption"""
    amount: float = Field(..., gt=0)
    booking_id: str

class WalletTransactionResponse(BaseModel):
    """Response for wallet transaction"""
    success: bool
    transaction_id: str
    new_balance: float

class OptimizedDeal(BaseModel):
    """Optimized deal model"""
    deal_id: str
    campaign_id: str
    dream_id: str
    score: float
    price: float
    savings: float

class YieldOptimizeResponse(BaseModel):
    """Response for yield optimization"""
    user_id: str
    optimized_deals: List[OptimizedDeal]
    total_deals_found: int
    optimization_time_ms: int

# ============================================================================
# ENDPOINT: Create/Update Partner Campaign
# ============================================================================

@offseason_router.post("/partners/campaigns", response_model=CampaignResponse)
async def create_partner_campaign(campaign: CampaignCreate):
    """
    Create or update off-season partner campaign
    
    - **partner_id**: UUID of the partner creating the campaign
    - **title**: Campaign title (3-200 chars)
    - **start_date/end_date**: Campaign date range
    - **min_allocation/max_allocation**: Room inventory range
    - **discount**: Percentage discount (0.01-100)
    - **blackout**: Optional list of excluded dates
    - **audience_tags**: Optional targeting tags (e.g., ["family", "beach"])
    - **status**: Campaign status (draft/active/paused/completed/cancelled)
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare campaign data
        campaign_data = {
            "partner_id": campaign.partner_id,
            "title": campaign.title,
            "description": campaign.description,
            "start_date": campaign.start_date.isoformat(),
            "end_date": campaign.end_date.isoformat(),
            "min_allocation": campaign.min_allocation,
            "max_allocation": campaign.max_allocation,
            "current_allocation": 0,
            "discount": campaign.discount,
            "blackout": campaign.blackout,
            "audience_tags": campaign.audience_tags,
            "status": campaign.status,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase
        result = supabase.table("offseason_campaigns").insert(campaign_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create campaign")
        
        campaign_id = result.data[0]["id"]
        
        logger.info(f"Created campaign {campaign_id} for partner {campaign.partner_id}")
        
        return CampaignResponse(
            success=True,
            campaign_id=campaign_id,
            message="Campaign created successfully",
            status=campaign.status
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Campaign creation failed: {str(e)}")

# ============================================================================
# ENDPOINT: Get Campaign Ledger
# ============================================================================

@offseason_router.get("/partners/campaigns/{campaign_id}/ledger", response_model=CampaignLedger)
async def get_campaign_ledger(campaign_id: str):
    """
    Get daily allocation ledger for a campaign
    
    Returns daily breakdown of allocated vs available rooms, utilization rates,
    and total campaign statistics.
    """
    try:
        supabase = get_supabase_client()
        
        # Get campaign details
        campaign_result = supabase.table("offseason_campaigns").select("*").eq("id", campaign_id).execute()
        
        if not campaign_result.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        campaign = campaign_result.data[0]
        
        # Calculate daily allocation (simplified - in production would query actual bookings)
        start_date = datetime.fromisoformat(campaign["start_date"])
        end_date = datetime.fromisoformat(campaign["end_date"])
        total_days = (end_date - start_date).days + 1
        
        daily_data = []
        current_allocated = campaign.get("current_allocation", 0)
        max_allocation = campaign["max_allocation"]
        
        # Distribute allocation across days (simplified model)
        avg_per_day = current_allocated // total_days if total_days > 0 else 0
        
        current_date = start_date
        for i in range(total_days):
            date_str = current_date.strftime("%Y-%m-%d")
            allocated = avg_per_day if i < (total_days - 1) else (current_allocated - avg_per_day * (total_days - 1))
            available = max_allocation - allocated
            utilization = allocated / max_allocation if max_allocation > 0 else 0
            
            daily_data.append(DailyAllocation(
                date=date_str,
                allocated=allocated,
                available=available,
                utilization=round(utilization, 2)
            ))
            
            current_date += timedelta(days=1)
        
        return CampaignLedger(
            campaign_id=campaign_id,
            title=campaign["title"],
            daily_allocation=daily_data,
            total_allocated=current_allocated,
            total_available=max_allocation
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get campaign ledger: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ledger retrieval failed: {str(e)}")

# ============================================================================
# ENDPOINT: Smart Dreams Suggest
# ============================================================================

@offseason_router.post("/smart-dreams/suggest", response_model=DreamSuggestionResponse)
async def suggest_smart_dreams(dream: DreamIntentCreate, user_id: str = Query(..., description="User UUID")):
    """
    Submit dream intent and get matched off-season deals
    
    Creates a dream_intents entry and returns top scored deals from active campaigns.
    """
    try:
        supabase = get_supabase_client()
        
        # Create dream intent
        dream_data = {
            "user_id": user_id,
            "destination": dream.destination,
            "budget": dream.budget,
            "tags": dream.tags,
            "flexible_dates": dream.flexible_dates,
            "preferred_start_date": dream.preferred_start_date.isoformat() if dream.preferred_start_date else None,
            "preferred_end_date": dream.preferred_end_date.isoformat() if dream.preferred_end_date else None,
            "adults": dream.adults,
            "children": dream.children,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        dream_result = supabase.table("dream_intents").insert(dream_data).execute()
        
        if not dream_result.data:
            raise HTTPException(status_code=500, detail="Failed to create dream intent")
        
        dream_id = dream_result.data[0]["id"]
        
        # Call RPC function to get deals
        deals_result = supabase.rpc("get_offseason_deals", {"user_uuid": user_id}).execute()
        
        suggested_deals = []
        for deal_data in deals_result.data[:10]:  # Top 10 deals
            # Calculate pricing
            original_price = dream.budget  # Simplified
            discount_pct = deal_data.get("discount", 0)
            price = original_price * (1 - discount_pct / 100)
            
            suggested_deals.append(Deal(
                campaign_id=deal_data["campaign_id"],
                campaign_title=deal_data["campaign_title"],
                partner_name=deal_data["partner_name"],
                discount=discount_pct,
                price=round(price, 2),
                original_price=round(original_price, 2),
                score=deal_data.get("score", 0),
                start_date=deal_data["start_date"],
                end_date=deal_data["end_date"],
                expires_at=(datetime.utcnow() + timedelta(hours=48)).isoformat()
            ))
        
        logger.info(f"Created dream {dream_id} for user {user_id}, found {len(suggested_deals)} deals")
        
        return DreamSuggestionResponse(
            dream_id=dream_id,
            suggested_deals=suggested_deals
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to suggest dreams: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dream suggestion failed: {str(e)}")

# ============================================================================
# ENDPOINT: Activate LAXMI Wallet
# ============================================================================

@offseason_router.post("/wallets/activate", response_model=WalletActivateResponse)
async def activate_wallet(user_id: str = Query(..., description="User UUID")):
    """
    Activate LAXMI wallet for user (creates if doesn't exist)
    
    Returns wallet details including balance, tier, and status.
    """
    try:
        supabase = get_supabase_client()
        
        # Check if wallet already exists
        existing = supabase.table("wallet_accounts").select("*").eq("owner_id", user_id).execute()
        
        if existing.data:
            wallet = existing.data[0]
            return WalletActivateResponse(
                wallet_id=wallet["id"],
                balance=float(wallet["balance"]),
                tier=wallet["tier"],
                status=wallet["status"]
            )
        
        # Create new wallet
        wallet_data = {
            "owner_id": user_id,
            "balance": 0.00,
            "tier": "bronze",
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "metadata": {
                "total_earned": 0,
                "total_spent": 0,
                "bookings_count": 0
            }
        }
        
        result = supabase.table("wallet_accounts").insert(wallet_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create wallet")
        
        wallet = result.data[0]
        
        logger.info(f"Activated wallet for user {user_id}")
        
        return WalletActivateResponse(
            wallet_id=wallet["id"],
            balance=float(wallet["balance"]),
            tier=wallet["tier"],
            status=wallet["status"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to activate wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wallet activation failed: {str(e)}")

# ============================================================================
# ENDPOINT: Deposit to Wallet
# ============================================================================

@offseason_router.post("/wallets/deposit", response_model=WalletTransactionResponse)
async def deposit_to_wallet(request: WalletDepositRequest):
    """
    Credit wallet (admin/system use - typically for cashback)
    
    Requires: user_id, amount, type (cashback/credit/refund)
    """
    try:
        supabase = get_supabase_client()
        
        # Get wallet
        wallet_result = supabase.table("wallet_accounts").select("*").eq("owner_id", request.user_id).execute()
        
        if not wallet_result.data:
            raise HTTPException(status_code=404, detail="Wallet not found. Please activate first.")
        
        wallet = wallet_result.data[0]
        wallet_id = wallet["id"]
        current_balance = float(wallet["balance"])
        new_balance = current_balance + request.amount
        
        # Create transaction
        txn_data = {
            "wallet_id": wallet_id,
            "type": request.type,
            "amount": request.amount,
            "balance_before": current_balance,
            "balance_after": new_balance,
            "booking_id": request.booking_id,
            "description": request.description or f"{request.type.capitalize()} deposit",
            "created_at": datetime.utcnow().isoformat(),
            "meta": {}
        }
        
        txn_result = supabase.table("wallet_txns").insert(txn_data).execute()
        
        if not txn_result.data:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        
        # Update wallet balance
        supabase.table("wallet_accounts").update({
            "balance": new_balance,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", wallet_id).execute()
        
        transaction_id = txn_result.data[0]["id"]
        
        logger.info(f"Deposited {request.amount} to wallet {wallet_id} (user {request.user_id})")
        
        return WalletTransactionResponse(
            success=True,
            transaction_id=transaction_id,
            new_balance=round(new_balance, 2)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deposit to wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wallet deposit failed: {str(e)}")

# ============================================================================
# ENDPOINT: Redeem from Wallet
# ============================================================================

@offseason_router.post("/wallets/redeem", response_model=WalletTransactionResponse)
async def redeem_from_wallet(request: WalletRedeemRequest, user_id: str = Query(..., description="User UUID")):
    """
    Deduct from wallet for booking payment
    
    Requires: amount, booking_id
    """
    try:
        supabase = get_supabase_client()
        
        # Get wallet
        wallet_result = supabase.table("wallet_accounts").select("*").eq("owner_id", user_id).execute()
        
        if not wallet_result.data:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        wallet = wallet_result.data[0]
        wallet_id = wallet["id"]
        current_balance = float(wallet["balance"])
        
        # Check sufficient balance
        if current_balance < request.amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. Available: {current_balance}, Required: {request.amount}"
            )
        
        new_balance = current_balance - request.amount
        
        # Create transaction
        txn_data = {
            "wallet_id": wallet_id,
            "type": "debit",
            "amount": -request.amount,  # Negative for debit
            "balance_before": current_balance,
            "balance_after": new_balance,
            "booking_id": request.booking_id,
            "description": f"Redemption for booking {request.booking_id}",
            "created_at": datetime.utcnow().isoformat(),
            "meta": {}
        }
        
        txn_result = supabase.table("wallet_txns").insert(txn_data).execute()
        
        if not txn_result.data:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        
        # Update wallet balance
        supabase.table("wallet_accounts").update({
            "balance": new_balance,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", wallet_id).execute()
        
        transaction_id = txn_result.data[0]["id"]
        
        logger.info(f"Redeemed {request.amount} from wallet {wallet_id} (user {user_id})")
        
        return WalletTransactionResponse(
            success=True,
            transaction_id=transaction_id,
            new_balance=round(new_balance, 2)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to redeem from wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Wallet redemption failed: {str(e)}")

# ============================================================================
# ENDPOINT: Yield Optimizer
# ============================================================================

@offseason_router.post("/yield/optimize/{user_id}", response_model=YieldOptimizeResponse)
async def optimize_yield(user_id: str):
    """
    Run yield optimizer for user's active dreams
    
    Fetches active dreams, matches with campaigns, scores deals, and creates deal_candidates.
    Returns top 5 optimized deals.
    
    **Note**: This is a simplified v1 implementation. Full scoring algorithm to be added in Phase 4.
    """
    try:
        start_time = datetime.utcnow()
        supabase = get_supabase_client()
        
        # Get user's active dreams
        dreams_result = supabase.table("dream_intents").select("*").eq("user_id", user_id).eq("status", "active").execute()
        
        if not dreams_result.data:
            return YieldOptimizeResponse(
                user_id=user_id,
                optimized_deals=[],
                total_deals_found=0,
                optimization_time_ms=0
            )
        
        # Get active campaigns
        campaigns_result = supabase.table("offseason_campaigns").select("*").eq("status", "active").execute()
        
        optimized_deals = []
        
        # Simple matching (full scoring algorithm in Phase 4)
        for dream in dreams_result.data:
            for campaign in campaigns_result.data[:5]:  # Limit to 5 campaigns
                # Simple score calculation (placeholder for Phase 4)
                base_score = 75.0
                discount_bonus = campaign["discount"] * 0.2  # Up to 20 points from discount
                score = min(base_score + discount_bonus, 100.0)
                
                original_price = dream["budget"]
                discount_pct = campaign["discount"]
                price = original_price * (1 - discount_pct / 100)
                savings = original_price - price
                
                # Create deal candidate
                deal_data = {
                    "dream_id": dream["id"],
                    "campaign_id": campaign["id"],
                    "provider_mix": ["partner_direct"],
                    "score": score,
                    "price": price,
                    "original_price": original_price,
                    "discount_amount": savings,
                    "expires_at": (datetime.utcnow() + timedelta(hours=48)).isoformat(),
                    "status": "pending",
                    "created_at": datetime.utcnow().isoformat(),
                    "metadata": {"scoring_version": "v1_simplified"}
                }
                
                deal_result = supabase.table("deal_candidates").insert(deal_data).execute()
                
                if deal_result.data:
                    deal_id = deal_result.data[0]["id"]
                    optimized_deals.append(OptimizedDeal(
                        deal_id=deal_id,
                        campaign_id=campaign["id"],
                        dream_id=dream["id"],
                        score=round(score, 2),
                        price=round(price, 2),
                        savings=round(savings, 2)
                    ))
        
        # Sort by score and take top 5
        optimized_deals.sort(key=lambda x: x.score, reverse=True)
        top_deals = optimized_deals[:5]
        
        end_time = datetime.utcnow()
        optimization_time = int((end_time - start_time).total_seconds() * 1000)
        
        logger.info(f"Optimized {len(top_deals)} deals for user {user_id} in {optimization_time}ms")
        
        return YieldOptimizeResponse(
            user_id=user_id,
            optimized_deals=top_deals,
            total_deals_found=len(optimized_deals),
            optimization_time_ms=optimization_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to optimize yield: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Yield optimization failed: {str(e)}")

# ============================================================================
# ENDPOINT: Health Check with Off-Season Version
# ============================================================================

@offseason_router.get("/healthz")
async def health_check_offseason():
    """
    Health check endpoint for off-season engine
    
    Returns service status, version, database connectivity
    """
    try:
        # Test Supabase connection
        supabase = get_supabase_client()
        _ = supabase.table("partners").select("id").limit(1).execute()
        db_status = "up"
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        db_status = "down"
    
    return {
        "ok": db_status == "up",
        "version": "0.1.0-offseason",
        "db": db_status,
        "timestamp": datetime.utcnow().isoformat(),
        "features": ["partner_campaigns", "smart_dreams", "laxmi_wallet", "yield_optimizer"]
    }
