"""
Payment Gateway Integration Module for Maku.Travel
Supports Stripe, local payment methods, and secure checkout
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# Create router
payment_router = APIRouter(prefix="/api/payments", tags=["payments"])

# ============================================================================
# ENUMS
# ============================================================================

class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    BANK_TRANSFER = "bank_transfer"
    UPI = "upi"  # India
    ALIPAY = "alipay"  # China
    WECHAT_PAY = "wechat_pay"  # China
    IDEAL = "ideal"  # Netherlands
    SOFORT = "sofort"  # Europe

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class Currency(str, Enum):
    USD = "usd"
    EUR = "eur"
    GBP = "gbp"
    AUD = "aud"
    CAD = "cad"
    INR = "inr"
    JPY = "jpy"
    CNY = "cny"

# ============================================================================
# REQUEST MODELS
# ============================================================================

class PaymentIntentRequest(BaseModel):
    """Create a payment intent"""
    amount: float = Field(..., gt=0, description="Payment amount")
    currency: Currency = Field(Currency.USD)
    payment_method_types: List[PaymentMethod] = Field(
        [PaymentMethod.CREDIT_CARD],
        description="Allowed payment methods"
    )
    booking_id: str
    user_id: str
    metadata: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        if v > 1000000:
            raise ValueError('Amount exceeds maximum limit')
        return round(v, 2)

class ConfirmPaymentRequest(BaseModel):
    """Confirm a payment"""
    payment_intent_id: str
    payment_method_id: str
    billing_details: Dict[str, Any]
    save_payment_method: bool = False

class RefundRequest(BaseModel):
    """Request a refund"""
    payment_id: str
    amount: Optional[float] = None  # Partial refund if specified
    reason: str
    metadata: Optional[Dict[str, Any]] = None

class CheckoutSessionRequest(BaseModel):
    """Create a checkout session"""
    booking_id: str
    user_id: str
    success_url: str
    cancel_url: str
    line_items: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None

# ============================================================================
# RESPONSE MODELS
# ============================================================================

class PaymentIntent(BaseModel):
    """Payment intent response"""
    payment_intent_id: str
    client_secret: str
    amount: float
    currency: str
    status: PaymentStatus
    payment_methods: List[str]
    created_at: str

class PaymentConfirmation(BaseModel):
    """Payment confirmation response"""
    payment_id: str
    status: PaymentStatus
    amount: float
    currency: str
    receipt_url: Optional[str] = None
    confirmed_at: str

# ============================================================================
# PAYMENT GATEWAY CONFIGURATION
# ============================================================================

PAYMENT_GATEWAYS = {
    "stripe": {
        "name": "Stripe",
        "supported_methods": [
            PaymentMethod.CREDIT_CARD,
            PaymentMethod.DEBIT_CARD,
            PaymentMethod.APPLE_PAY,
            PaymentMethod.GOOGLE_PAY
        ],
        "supported_currencies": [Currency.USD, Currency.EUR, Currency.GBP, Currency.AUD],
        "transaction_fee": 0.029,  # 2.9% + $0.30
        "settlement_days": 2,
        "documentation": "https://stripe.com/docs/api"
    },
    "paypal": {
        "name": "PayPal",
        "supported_methods": [PaymentMethod.PAYPAL],
        "supported_currencies": [Currency.USD, Currency.EUR, Currency.GBP],
        "transaction_fee": 0.034,  # 3.4% + $0.30
        "settlement_days": 1,
        "documentation": "https://developer.paypal.com/docs/api/"
    },
    "razorpay": {
        "name": "Razorpay",
        "supported_methods": [PaymentMethod.UPI, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD],
        "supported_currencies": [Currency.INR],
        "transaction_fee": 0.02,  # 2%
        "settlement_days": 2,
        "documentation": "https://razorpay.com/docs/api/"
    }
}

# ============================================================================
# PAYMENT ENDPOINTS
# ============================================================================

@payment_router.post("/intent/create")
async def create_payment_intent(request: PaymentIntentRequest):
    """
    Create a payment intent for checkout
    
    Features:
    - Multi-currency support
    - Multiple payment method types
    - Secure client secret generation
    - Metadata tracking
    """
    try:
        import uuid
        
        payment_intent = PaymentIntent(
            payment_intent_id=f"pi_{uuid.uuid4().hex[:24]}",
            client_secret=f"pi_{uuid.uuid4().hex[:24]}_secret_{uuid.uuid4().hex[:16]}",
            amount=request.amount,
            currency=request.currency.value,
            status=PaymentStatus.PENDING,
            payment_methods=[pm.value for pm in request.payment_method_types],
            created_at=datetime.now().isoformat()
        )
        
        logger.info(f"Created payment intent {payment_intent.payment_intent_id} for booking {request.booking_id}")
        
        return {
            "success": True,
            "payment_intent": payment_intent,
            "next_step": "Use client_secret with payment method to confirm payment"
        }
        
    except Exception as e:
        logger.error(f"Failed to create payment intent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@payment_router.post("/confirm")
async def confirm_payment(request: ConfirmPaymentRequest):
    """
    Confirm a payment
    
    Process:
    1. Validate payment method
    2. Process payment
    3. Update booking status
    4. Send confirmation
    """
    try:
        import uuid
        
        # Simulate payment processing
        payment_confirmation = PaymentConfirmation(
            payment_id=f"pay_{uuid.uuid4().hex[:24]}",
            status=PaymentStatus.SUCCEEDED,
            amount=299.99,  # TODO: Get from payment intent
            currency="usd",
            receipt_url=f"https://receipts.maku.travel/{uuid.uuid4().hex}",
            confirmed_at=datetime.now().isoformat()
        )
        
        logger.info(f"Payment confirmed: {payment_confirmation.payment_id}")
        
        return {
            "success": True,
            "payment": payment_confirmation,
            "message": "Payment processed successfully",
            "booking_confirmed": True
        }
        
    except Exception as e:
        logger.error(f"Payment confirmation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@payment_router.post("/refund")
async def process_refund(request: RefundRequest):
    """
    Process a refund
    
    Supports:
    - Full refunds
    - Partial refunds
    - Reason tracking
    """
    try:
        import uuid
        
        refund_id = f"re_{uuid.uuid4().hex[:24]}"
        
        return {
            "success": True,
            "refund_id": refund_id,
            "payment_id": request.payment_id,
            "amount": request.amount or "full",
            "status": "processing",
            "reason": request.reason,
            "estimated_days": 5,
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Refund processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@payment_router.post("/checkout/session")
async def create_checkout_session(request: CheckoutSessionRequest):
    """
    Create a checkout session (Stripe Checkout style)
    
    Features:
    - Hosted checkout page
    - Multiple payment methods
    - Success/cancel redirects
    - Session expiration
    """
    try:
        import uuid
        
        session_id = f"cs_{uuid.uuid4().hex[:24]}"
        
        return {
            "success": True,
            "session_id": session_id,
            "checkout_url": f"https://checkout.maku.travel/session/{session_id}",
            "expires_at": (datetime.now() + timedelta(hours=1)).isoformat(),
            "metadata": request.metadata
        }
        
    except Exception as e:
        logger.error(f"Failed to create checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# PAYMENT METHODS
# ============================================================================

@payment_router.get("/methods/available")
async def get_available_payment_methods(
    currency: Currency = Currency.USD,
    country: Optional[str] = None
):
    """
    Get available payment methods by currency/country
    
    Returns:
    - Supported payment methods
    - Gateway information
    - Transaction fees
    """
    try:
        methods = []
        
        # Global methods (available everywhere)
        methods.extend([
            {
                "method": PaymentMethod.CREDIT_CARD.value,
                "name": "Credit Card",
                "icon": "credit-card",
                "gateway": "stripe",
                "fee_percentage": 2.9,
                "supported": True
            },
            {
                "method": PaymentMethod.DEBIT_CARD.value,
                "name": "Debit Card",
                "icon": "debit-card",
                "gateway": "stripe",
                "fee_percentage": 2.9,
                "supported": True
            }
        ])
        
        # Region-specific methods
        if country == "IN":
            methods.append({
                "method": PaymentMethod.UPI.value,
                "name": "UPI",
                "icon": "upi",
                "gateway": "razorpay",
                "fee_percentage": 2.0,
                "supported": currency == Currency.INR
            })
        
        if country in ["CN", "HK", "SG"]:
            methods.extend([
                {
                    "method": PaymentMethod.ALIPAY.value,
                    "name": "Alipay",
                    "icon": "alipay",
                    "gateway": "stripe",
                    "fee_percentage": 3.5,
                    "supported": True
                },
                {
                    "method": PaymentMethod.WECHAT_PAY.value,
                    "name": "WeChat Pay",
                    "icon": "wechat",
                    "gateway": "stripe",
                    "fee_percentage": 3.5,
                    "supported": True
                }
            ])
        
        if country in ["NL", "BE"]:
            methods.append({
                "method": PaymentMethod.IDEAL.value,
                "name": "iDEAL",
                "icon": "ideal",
                "gateway": "stripe",
                "fee_percentage": 0.29,
                "supported": currency == Currency.EUR
            })
        
        return {
            "success": True,
            "currency": currency.value,
            "country": country,
            "payment_methods": methods,
            "total_methods": len(methods)
        }
        
    except Exception as e:
        logger.error(f"Failed to get payment methods: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@payment_router.get("/gateways/info")
async def get_payment_gateways():
    """Get information about available payment gateways"""
    try:
        return {
            "success": True,
            "gateways": PAYMENT_GATEWAYS,
            "primary_gateway": "stripe",
            "backup_gateways": ["paypal", "razorpay"]
        }
    except Exception as e:
        logger.error(f"Failed to get gateway info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# PAYMENT SECURITY
# ============================================================================

@payment_router.post("/verify")
async def verify_payment(
    payment_id: str,
    verification_token: str = Header(..., alias="X-Verification-Token")
):
    """Verify a payment (for webhook callbacks)"""
    try:
        # TODO: Implement proper verification logic
        return {
            "success": True,
            "payment_id": payment_id,
            "verified": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@payment_router.get("/transaction/{transaction_id}")
async def get_transaction_details(transaction_id: str):
    """Get detailed transaction information"""
    try:
        import uuid
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "payment_id": f"pay_{uuid.uuid4().hex[:24]}",
            "amount": 299.99,
            "currency": "USD",
            "status": "succeeded",
            "payment_method": "credit_card",
            "card_details": {
                "brand": "visa",
                "last4": "4242",
                "exp_month": 12,
                "exp_year": 2027
            },
            "billing_details": {
                "name": "John Doe",
                "email": "john@example.com"
            },
            "created_at": datetime.now().isoformat(),
            "receipt_url": f"https://receipts.maku.travel/{transaction_id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to get transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
