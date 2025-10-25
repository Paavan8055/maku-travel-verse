"""
Local Supplier Adapter Template
For integrating local businesses, guides, and experiences directly
"""

import httpx
from datetime import datetime
from typing import Dict, List, Any, Optional
from providers.base_provider import (
    BaseProvider, ProviderConfig, SearchRequest, 
    SearchResponse, ProviderCapabilities
)
import logging

logger = logging.getLogger(__name__)


class LocalSupplierProvider(BaseProvider):
    """
    Local Supplier Integration Template
    
    Use cases:
    - Direct bookings with local guides
    - Community-based tourism
    - Small hotel owners
    - Local activity providers
    - Artisan experiences
    
    Features:
    - No API required (manual booking coordination)
    - WhatsApp/email confirmation
    - Commission tracking
    - Community impact metrics
    """
    
    def __init__(self, config: ProviderConfig, credentials: Dict[str, str]):
        super().__init__(config, credentials)
        
        # Local supplier configuration
        self.supplier_contact = credentials.get('contact_info', {})
        self.commission_rate = config.commission_rate or 0.15  # 15% default
        self.payment_method = credentials.get('payment_method', 'manual')  # manual, stripe, local_bank
        
        # No HTTP client needed for manual suppliers
        self.is_authenticated = True  # Always authenticated (manual process)
    
    async def authenticate(self) -> bool:
        """
        Local suppliers don't require API authentication
        
        Returns:
            bool: Always True (manual coordination)
        """
        logger.info(f"✅ Local supplier {self.config.display_name} ready (manual coordination)")
        self.is_authenticated = True
        return True
    
    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        Search local supplier inventory
        
        Note: This would typically query a local database or spreadsheet
        of available dates/slots
        
        Args:
            request: Universal search request
            
        Returns:
            SearchResponse with available offerings
        """
        start_time = datetime.now()
        
        try:
            # In a real implementation, this would:
            # 1. Check local database/calendar
            # 2. Query WhatsApp Business API for availability
            # 3. Or return static offerings with "check availability" flag
            
            results = self._get_local_offerings(request)
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return SearchResponse(
                success=True,
                provider=self.config.provider_name,
                results=results,
                total_results=len(results),
                response_time_ms=response_time,
                cached=False,
                metadata={
                    "type": "local_supplier",
                    "booking_method": "manual",
                    "confirmation_type": "whatsapp_email",
                    "community_impact": True
                }
            )
            
        except Exception as e:
            logger.error(f"❌ Local supplier search error: {e}")
            return SearchResponse(
                success=False,
                provider=self.config.provider_name,
                results=[],
                total_results=0,
                response_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                metadata={"error": str(e)}
            )
    
    def _get_local_offerings(self, request: SearchRequest) -> List[Dict[str, Any]]:
        """
        Get local supplier offerings
        
        This is a template - actual implementation would:
        1. Query local database
        2. Check Google Sheets
        3. Query WhatsApp Business API
        4. Or return static catalog
        """
        
        # Example offering structure
        offerings = [
            {
                "id": f"{self.config.provider_name}_001",
                "name": self.config.display_name,
                "provider": self.config.provider_name,
                "type": request.search_type,
                "description": f"Authentic local experience with {self.config.display_name}",
                "location": {
                    "destination": request.destination,
                    "local_area": "City center",
                    "meeting_point": "Details provided upon booking"
                },
                "price": {
                    "amount": 50.00,  # Base price
                    "currency": request.currency,
                    "includes": ["Guide", "Materials", "Refreshments"],
                    "commission_to_maku": self.commission_rate * 100  # Percentage
                },
                "availability": "check_with_supplier",
                "booking_method": "manual",
                "contact": self.supplier_contact,
                "local_owned": True,
                "community_impact": {
                    "direct_to_local": True,
                    "employs_local_guides": True,
                    "sustainable_practices": True
                },
                "reviews": {
                    "rating": 4.9,
                    "count": 127,
                    "source": "google_reviews"
                },
                "cancellation_policy": "Flexible (free cancellation 24h)",
                "insider_tips": [
                    "Best time is early morning",
                    "Bring comfortable shoes",
                    "Ask about family discount"
                ]
            }
        ]
        
        return offerings
    
    async def get_availability(self, item_id: str, dates: Dict[str, str]) -> Dict[str, Any]:
        """
        Check availability (manual coordination)
        
        Returns:
            Availability info with manual confirmation note
        """
        return {
            "available": "requires_confirmation",
            "item_id": item_id,
            "dates": dates,
            "provider": self.config.provider_name,
            "confirmation_method": "whatsapp",
            "response_time": "Usually within 2 hours",
            "contact": self.supplier_contact
        }
    
    async def get_quote(self, item_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get detailed pricing quote
        
        Returns:
            Pricing breakdown with commission details
        """
        base_price = 50.00  # Would fetch from database
        commission = base_price * self.commission_rate
        supplier_receives = base_price - commission
        
        return {
            "item_id": item_id,
            "provider": self.config.provider_name,
            "quote": {
                "base_price": base_price,
                "commission_to_maku": commission,
                "supplier_receives": supplier_receives,
                "currency": "USD",
                "breakdown": details
            }
        }
    
    async def book(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute booking (manual coordination workflow)
        
        Process:
        1. Create booking record in database
        2. Send WhatsApp message to supplier
        3. Send confirmation email to customer
        4. Await supplier confirmation
        
        Returns:
            Booking confirmation with pending status
        """
        booking_id = f"LOCAL_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # In real implementation:
        # 1. Insert booking to database
        # 2. Send WhatsApp to supplier via Twilio API
        # 3. Send email to customer
        # 4. Create task for admin to follow up
        
        logger.info(f"📱 Local booking created: {booking_id}")
        logger.info(f"   Supplier contact: {self.supplier_contact}")
        logger.info(f"   Awaiting manual confirmation")
        
        return {
            "success": True,
            "booking_id": booking_id,
            "provider": self.config.provider_name,
            "status": "pending_confirmation",
            "confirmation_method": "whatsapp",
            "expected_confirmation": "Within 2 hours",
            "next_steps": [
                "Supplier will be contacted via WhatsApp",
                "You will receive confirmation email",
                "Booking will be confirmed within 2 hours"
            ],
            "contact_info": self.supplier_contact,
            "confirmation": booking_details
        }
    
    async def cancel(self, booking_id: str, reason: str) -> Dict[str, Any]:
        """
        Cancel booking (manual coordination)
        
        Returns:
            Cancellation confirmation
        """
        # In real implementation:
        # 1. Update booking status
        # 2. Send WhatsApp cancellation to supplier
        # 3. Process refund if applicable
        
        return {
            "success": True,
            "booking_id": booking_id,
            "cancelled": True,
            "provider": self.config.provider_name,
            "refund_status": "processing",
            "refund_policy": "Full refund for cancellations 24h+ before"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Health check for local supplier
        
        For manual suppliers, this checks:
        1. Contact info is valid
        2. Supplier is active
        3. Recent booking activity
        """
        start_time = datetime.now()
        
        try:
            # Check if supplier has valid contact info
            has_contact = bool(self.supplier_contact)
            
            # Check if active (would query recent bookings)
            is_active = self.config.is_active
            
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            if has_contact and is_active:
                return {
                    "status": "healthy",
                    "response_time_ms": response_time,
                    "details": {
                        "type": "local_supplier",
                        "booking_method": "manual",
                        "contact_verified": has_contact,
                        "active": is_active
                    }
                }
            else:
                return {
                    "status": "degraded",
                    "response_time_ms": response_time,
                    "details": {
                        "issue": "Contact info or active status missing"
                    }
                }
                
        except Exception as e:
            return {
                "status": "down",
                "response_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
                "details": {"error": str(e)}
            }


# Example usage documentation
"""
To onboard a local supplier:

1. Create provider record in provider_registry:
   INSERT INTO provider_registry (
       provider_name, display_name, provider_type,
       supports_activities, priority, eco_rating, 
       fee_transparency_score, commission_rate,
       is_active, is_test_mode
   ) VALUES (
       'delhi_heritage_walks',
       'Delhi Heritage Walks',
       'activity',
       true,
       5,  # Highest priority for local
       95,  # Very eco-friendly
       100,  # Full transparency
       0.15,  # 15% commission
       true,
       false
   );

2. Add credentials with contact info:
   INSERT INTO provider_credentials (
       provider_id,
       credential_key,
       credential_value_vault_id
   ) VALUES (
       provider_id,
       'contact_info',
       '{"whatsapp": "+91-xxx", "email": "delhi@heritage.com"}'
   );

3. Register adapter in universal_provider_manager.py:
   self.provider_adapters['delhi_heritage_walks'] = 
       'providers.local_supplier_adapter.LocalSupplierProvider'

4. System will automatically include in rotation with highest priority (local-first)
"""
