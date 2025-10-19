"""
Email Queue System for Off-Season Occupancy Engine
Logs email events without actual sending (production will integrate SendGrid/Twilio)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

# Create router
email_router = APIRouter(prefix="/api", tags=["Email System"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class EmailQueueRequest(BaseModel):
    """Request model for queuing emails"""
    template: str = Field(..., description="Template name (dream_match, campaign_ledger, cashback)")
    user_id: str = Field(..., description="User UUID")
    recipient_email: EmailStr = Field(..., description="Recipient email address")
    data: Dict = Field(..., description="Template data")

class EmailQueueResponse(BaseModel):
    """Response model for email queue"""
    queued: bool
    email_id: str
    log_entry: str
    scheduled_at: str

# ============================================================================
# EMAIL TEMPLATES (HTML)
# ============================================================================

DREAM_MATCH_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: white; padding: 30px; border: 1px solid #e5e7eb; }}
        .deal-card {{ background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }}
        .cta-button {{ display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 Your Dream Matches!</h1>
        </div>
        <div class="content">
            <p>Hi {first_name},</p>
            <p>Great news! We found an amazing match for your <strong>{destination}</strong> dream:</p>
            
            <div class="deal-card">
                <h2>🏨 {hotel_name}</h2>
                <p><strong>📅 Available:</strong> {start_date} - {end_date}</p>
                <p><strong>💰 Your Price:</strong> ${price} ({discount}% off - Save ${savings}!)</p>
                <p><strong>🎯 Match Score:</strong> {score}/100</p>
            </div>
            
            <p>This exclusive off-season deal includes:</p>
            <ul>
                <li>✓ {perks_1}</li>
                <li>✓ {perks_2}</li>
                <li>✓ {perks_3}</li>
            </ul>
            
            <p>⏰ <strong>This offer expires in 48 hours.</strong></p>
            
            <center>
                <a href="{booking_url}" class="cta-button">Book Now</a>
                <a href="{all_deals_url}" class="cta-button" style="background: white; color: #f97316; border: 2px solid #f97316;">View All Deals</a>
            </center>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Questions? Reply to this email or visit our <a href="{help_url}">help center</a>.</p>
        </div>
        <div class="footer">
            <p>Happy travels,<br>The MAKU Team 🐕</p>
            <p>We Make U Travel</p>
        </div>
    </div>
</body>
</html>
"""

CAMPAIGN_LEDGER_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f97316; color: white; padding: 20px; text-align: center; }}
        .stats {{ display: flex; justify-content: space-around; padding: 20px; background: #fef3c7; margin: 20px 0; border-radius: 8px; }}
        .stat {{ text-align: center; }}
        .stat-value {{ font-size: 24px; font-weight: bold; color: #f97316; }}
        .table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        .table th, .table td {{ padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }}
        .alert {{ background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Your "{campaign_title}" Campaign - Daily Update</h1>
        </div>
        
        <p>Hi {partner_name},</p>
        <p>Here's today's update for your campaign:</p>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">{rooms_booked_today}</div>
                <div>Rooms Booked Today</div>
            </div>
            <div class="stat">
                <div class="stat-value">{total_filled}/{total_available}</div>
                <div>Total Progress</div>
            </div>
            <div class="stat">
                <div class="stat-value">${revenue}</div>
                <div>Revenue Generated</div>
            </div>
        </div>
        
        <h3>🎯 Top Performing Dates:</h3>
        <table class="table">
            <tr>
                <th>Date Range</th>
                <th>Bookings</th>
            </tr>
            <tr><td>{top_date_1}</td><td>{top_bookings_1} bookings</td></tr>
            <tr><td>{top_date_2}</td><td>{top_bookings_2} bookings</td></tr>
            <tr><td>{top_date_3}</td><td>{top_bookings_3} bookings</td></tr>
        </table>
        
        <div class="alert">
            <strong>🔔 Alert:</strong> You're {rooms_remaining} rooms away from full capacity! Consider:
            <ul>
                <li>Creating another campaign window</li>
                <li>Adjusting discount for peak dates</li>
                <li>Expanding audience targeting</li>
            </ul>
        </div>
        
        <center>
            <a href="{ledger_url}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px;">View Full Ledger</a>
            <a href="{create_campaign_url}" style="display: inline-block; background: white; color: #f97316; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; border: 2px solid #f97316;">Create New Campaign</a>
        </center>
        
        <p style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            Best regards,<br>
            MAKU Partner Success Team
        </p>
    </div>
</body>
</html>
"""

CASHBACK_NOTIFICATION_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .cashback-card {{ background: #d1fae5; padding: 30px; text-align: center; border-radius: 8px; margin: 20px 0; }}
        .cashback-amount {{ font-size: 48px; font-weight: bold; color: #10b981; }}
        .wallet-balance {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; }}
        .how-to-use {{ background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Congrats on Your {destination} Booking!</h1>
        </div>
        
        <p>Hi {first_name},</p>
        <p>Your booking is confirmed, and here's your reward:</p>
        
        <div class="cashback-card">
            <div>💵 Cashback Earned</div>
            <div class="cashback-amount">${cashback_amount}</div>
            <div style="color: #059669; font-size: 18px; margin-top: 10px;">
                {cashback_percentage}% cashback applied
            </div>
        </div>
        
        <div class="wallet-balance">
            <h3>🏆 Your LAXMI Wallet</h3>
            <p><strong>Current Balance:</strong> ${wallet_balance}</p>
            <p><strong>Tier:</strong> {tier} ⭐</p>
            <p><strong>Total Earned:</strong> ${total_earned}</p>
        </div>
        
        <div class="how-to-use">
            <h3>How to Use Your Balance:</h3>
            <ul>
                <li>💳 Apply to your next off-season booking</li>
                <li>🎁 Combine with ongoing discounts</li>
                <li>👨‍👩‍👧 Share with family via wallet transfer</li>
            </ul>
            <p><strong>Your wallet balance never expires!</strong></p>
        </div>
        
        <center>
            <a href="{wallet_url}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px;">View Wallet</a>
            <a href="{browse_deals_url}" style="display: inline-block; background: white; color: #10b981; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; border: 2px solid #10b981;">Browse Deals</a>
        </center>
        
        <p style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            Keep traveling smart,<br>
            The MAKU Team 🐕
        </p>
    </div>
</body>
</html>
"""

# ============================================================================
# EMAIL TEMPLATE FUNCTIONS
# ============================================================================

def render_template(template_name: str, data: Dict) -> str:
    """
    Render email template with data
    
    Args:
        template_name: Name of template (dream_match, campaign_ledger, cashback)
        data: Dictionary of template variables
    
    Returns:
        Rendered HTML string
    """
    templates = {
        'dream_match': DREAM_MATCH_TEMPLATE,
        'campaign_ledger': CAMPAIGN_LEDGER_TEMPLATE,
        'cashback': CASHBACK_NOTIFICATION_TEMPLATE
    }
    
    template = templates.get(template_name)
    if not template:
        raise ValueError(f"Unknown template: {template_name}")
    
    try:
        return template.format(**data)
    except KeyError as e:
        raise ValueError(f"Missing template variable: {e}")

# ============================================================================
# ENDPOINT: Queue Email
# ============================================================================

@email_router.post("/emails/queue", response_model=EmailQueueResponse)
async def queue_email(request: EmailQueueRequest):
    """
    Queue an email for sending (logging only in MVP)
    
    In production, this would integrate with SendGrid/Twilio/etc.
    For now, we log the email event and return success.
    
    Templates available:
    - dream_match: Notify user of matched deal
    - campaign_ledger: Daily campaign update for partners
    - cashback: Cashback earned notification
    """
    try:
        email_id = str(uuid.uuid4())
        scheduled_at = datetime.utcnow()
        
        # Validate template exists
        valid_templates = ['dream_match', 'campaign_ledger', 'cashback']
        if request.template not in valid_templates:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid template. Must be one of: {', '.join(valid_templates)}"
            )
        
        # Render template (validates data completeness)
        try:
            html_content = render_template(request.template, request.data)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Log email event
        log_entry = f"Email queued: {request.template} to {request.recipient_email} (user: {request.user_id})"
        logger.info(log_entry)
        logger.info(f"Email ID: {email_id}")
        logger.info(f"Data keys: {list(request.data.keys())}")
        
        # In production, this would call:
        # await sendgrid_client.send(to=request.recipient_email, html=html_content)
        # For now, we just log
        
        return EmailQueueResponse(
            queued=True,
            email_id=email_id,
            log_entry=log_entry,
            scheduled_at=scheduled_at.isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to queue email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Email queue failed: {str(e)}")

# ============================================================================
# ENDPOINT: Email Templates List
# ============================================================================

@email_router.get("/emails/templates")
async def list_email_templates():
    """
    List available email templates with required data fields
    """
    templates = {
        "dream_match": {
            "description": "Notify user when their dream matches an off-season campaign",
            "required_fields": [
                "first_name", "destination", "hotel_name", "start_date", "end_date",
                "price", "discount", "savings", "score", "perks_1", "perks_2", "perks_3",
                "booking_url", "all_deals_url", "help_url"
            ],
            "trigger": "When deal_candidates entry created with score > 85"
        },
        "campaign_ledger": {
            "description": "Daily campaign performance update for partners",
            "required_fields": [
                "partner_name", "campaign_title", "rooms_booked_today", "total_filled",
                "total_available", "revenue", "top_date_1", "top_bookings_1", "top_date_2",
                "top_bookings_2", "top_date_3", "top_bookings_3", "rooms_remaining",
                "ledger_url", "create_campaign_url"
            ],
            "trigger": "Daily at 9 AM for each active campaign"
        },
        "cashback": {
            "description": "Cashback earned notification after booking",
            "required_fields": [
                "first_name", "destination", "cashback_amount", "cashback_percentage",
                "wallet_balance", "tier", "total_earned", "wallet_url", "browse_deals_url"
            ],
            "trigger": "After booking confirmation and wallet deposit"
        }
    }
    
    return {
        "templates": templates,
        "count": len(templates),
        "production_note": "Emails are logged only. Production will integrate SendGrid/Twilio."
    }

# ============================================================================
# ENDPOINT: Test Email Rendering
# ============================================================================

@email_router.post("/emails/test-render")
async def test_email_render(template: str, data: Dict):
    """
    Test email template rendering with provided data
    Returns rendered HTML for preview
    """
    try:
        html = render_template(template, data)
        return {
            "success": True,
            "template": template,
            "html": html,
            "data_keys": list(data.keys())
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
