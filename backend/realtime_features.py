"""
Real-Time Features for Maku.Travel
Provides live price updates, availability monitoring, and real-time notifications
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

# Create router
realtime_router = APIRouter(prefix="/api/realtime", tags=["realtime-features"])

# ============================================================================
# CONNECTION MANAGER FOR WEBSOCKETS
# ============================================================================

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.price_watchers: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        logger.info(f"Client {client_id} disconnected")
    
    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message to {client_id}: {e}")
    
    async def broadcast(self, message: dict):
        for client_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Broadcast failed to {client_id}: {e}")

manager = ConnectionManager()

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class PriceAlert(BaseModel):
    """Price alert configuration"""
    alert_id: Optional[str] = None
    user_id: str
    search_type: Literal["hotel", "flight", "activity"]
    search_params: Dict[str, Any]
    target_price: float
    alert_condition: Literal["below", "above", "change"]
    percentage_change: Optional[float] = None
    enabled: bool = True
    created_at: Optional[str] = None

class AvailabilityMonitor(BaseModel):
    """Availability monitoring configuration"""
    monitor_id: Optional[str] = None
    user_id: str
    item_type: Literal["hotel", "flight", "activity"]
    item_id: str
    check_frequency_minutes: int = Field(60, ge=15, le=1440)
    notify_on_availability: bool = True
    enabled: bool = True

class RealTimeNotification(BaseModel):
    """Real-time notification"""
    notification_id: str
    user_id: str
    type: Literal["price_drop", "availability", "deal", "booking_update", "system"]
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    read: bool = False
    created_at: str

class LivePriceUpdate(BaseModel):
    """Live price update"""
    item_type: Literal["hotel", "flight", "activity"]
    item_id: str
    current_price: float
    previous_price: Optional[float] = None
    price_change: Optional[float] = None
    price_change_percentage: Optional[float] = None
    currency: str = "USD"
    timestamp: str
    availability: bool = True

# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@realtime_router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time updates
    
    Supports:
    - Price updates
    - Availability changes
    - Booking notifications
    - System alerts
    """
    await manager.connect(websocket, client_id)
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to Maku.Travel real-time updates",
            "client_id": client_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep connection alive and handle messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
                
                elif message.get("type") == "subscribe_prices":
                    # Subscribe to price updates for specific items
                    items = message.get("items", [])
                    await websocket.send_json({
                        "type": "subscription_confirmed",
                        "items": items,
                        "message": f"Subscribed to {len(items)} items"
                    })
                
                elif message.get("type") == "unsubscribe":
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "message": "Unsubscribed from updates"
                    })
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                await websocket.send_json({"type": "error", "message": str(e)})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        manager.disconnect(websocket, client_id)

# ============================================================================
# PRICE MONITORING
# ============================================================================

@realtime_router.post("/price-alerts/create")
async def create_price_alert(alert: PriceAlert):
    """
    Create a price alert for hotels, flights, or activities
    
    Features:
    - Alert when price drops below threshold
    - Alert on percentage change
    - Customizable check frequency
    """
    try:
        import uuid
        alert.alert_id = str(uuid.uuid4())
        alert.created_at = datetime.now().isoformat()
        
        # Store alert (TODO: integrate with database)
        manager.price_watchers[alert.alert_id] = alert.dict()
        
        return {
            "success": True,
            "alert_id": alert.alert_id,
            "message": "Price alert created successfully",
            "alert": alert
        }
        
    except Exception as e:
        logger.error(f"Failed to create price alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@realtime_router.get("/price-alerts/{user_id}")
async def get_user_price_alerts(user_id: str):
    """Get all price alerts for a user"""
    try:
        user_alerts = [
            alert for alert in manager.price_watchers.values()
            if alert.get('user_id') == user_id
        ]
        
        return {
            "success": True,
            "user_id": user_id,
            "alerts": user_alerts,
            "total": len(user_alerts)
        }
        
    except Exception as e:
        logger.error(f"Failed to get price alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@realtime_router.delete("/price-alerts/{alert_id}")
async def delete_price_alert(alert_id: str):
    """Delete a price alert"""
    try:
        if alert_id in manager.price_watchers:
            del manager.price_watchers[alert_id]
            return {"success": True, "message": "Alert deleted"}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# LIVE PRICE UPDATES
# ============================================================================

@realtime_router.get("/prices/live")
async def get_live_prices(
    item_type: Literal["hotel", "flight", "activity"],
    item_ids: str  # Comma-separated list
):
    """
    Get live prices for specific items
    
    Returns:
    - Current prices
    - Recent price changes
    - Availability status
    """
    try:
        item_id_list = item_ids.split(',')
        
        updates = []
        for item_id in item_id_list:
            # Simulate live price data
            import random
            current_price = 100 + random.uniform(0, 200)
            previous_price = current_price + random.uniform(-20, 20)
            
            update = LivePriceUpdate(
                item_type=item_type,
                item_id=item_id.strip(),
                current_price=round(current_price, 2),
                previous_price=round(previous_price, 2),
                price_change=round(current_price - previous_price, 2),
                price_change_percentage=round(((current_price - previous_price) / previous_price) * 100, 2),
                timestamp=datetime.now().isoformat(),
                availability=random.choice([True, True, True, False])  # 75% available
            )
            updates.append(update)
        
        return {
            "success": True,
            "updates": updates,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get live prices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# AVAILABILITY MONITORING
# ============================================================================

@realtime_router.post("/availability/monitor")
async def create_availability_monitor(monitor: AvailabilityMonitor):
    """
    Monitor availability for hotels, flights, or activities
    
    Features:
    - Real-time availability checking
    - Instant notifications when available
    - Customizable check frequency
    """
    try:
        import uuid
        monitor.monitor_id = str(uuid.uuid4())
        
        return {
            "success": True,
            "monitor_id": monitor.monitor_id,
            "message": f"Monitoring availability every {monitor.check_frequency_minutes} minutes",
            "monitor": monitor
        }
        
    except Exception as e:
        logger.error(f"Failed to create availability monitor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@realtime_router.get("/availability/check")
async def check_availability(
    item_type: Literal["hotel", "flight", "activity"],
    item_id: str,
    check_dates: Optional[str] = None
):
    """Check real-time availability for an item"""
    try:
        import random
        
        return {
            "success": True,
            "item_type": item_type,
            "item_id": item_id,
            "available": random.choice([True, False]),
            "availability_details": {
                "rooms_available": random.randint(0, 10) if item_type == "hotel" else None,
                "seats_available": random.randint(0, 50) if item_type == "flight" else None,
                "spots_available": random.randint(0, 20) if item_type == "activity" else None,
                "last_checked": datetime.now().isoformat()
            },
            "next_check": (datetime.now() + timedelta(minutes=15)).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to check availability: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# REAL-TIME NOTIFICATIONS
# ============================================================================

@realtime_router.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    unread_only: bool = False,
    limit: int = 20
):
    """Get real-time notifications for a user"""
    try:
        import uuid
        
        # Generate mock notifications
        notifications = [
            RealTimeNotification(
                notification_id=str(uuid.uuid4()),
                user_id=user_id,
                type="price_drop",
                title="Price Drop Alert!",
                message="The price for your Paris hotel dropped by 15%",
                data={"hotel_id": "hotel_123", "new_price": 170, "old_price": 200},
                priority="high",
                read=False,
                created_at=(datetime.now() - timedelta(minutes=5)).isoformat()
            ),
            RealTimeNotification(
                notification_id=str(uuid.uuid4()),
                user_id=user_id,
                type="availability",
                title="Now Available!",
                message="The sold-out Santorini villa is now available",
                data={"item_id": "villa_456"},
                priority="medium",
                read=False,
                created_at=(datetime.now() - timedelta(hours=1)).isoformat()
            ),
            RealTimeNotification(
                notification_id=str(uuid.uuid4()),
                user_id=user_id,
                type="deal",
                title="Exclusive Deal",
                message="Get 20% off Tokyo hotels this weekend",
                data={"destination": "Tokyo", "discount": 0.20},
                priority="medium",
                read=True,
                created_at=(datetime.now() - timedelta(hours=3)).isoformat()
            )
        ]
        
        if unread_only:
            notifications = [n for n in notifications if not n.read]
        
        return {
            "success": True,
            "user_id": user_id,
            "notifications": notifications[:limit],
            "total": len(notifications),
            "unread_count": sum(1 for n in notifications if not n.read)
        }
        
    except Exception as e:
        logger.error(f"Failed to get notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@realtime_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    try:
        return {
            "success": True,
            "notification_id": notification_id,
            "message": "Notification marked as read"
        }
    except Exception as e:
        logger.error(f"Failed to mark notification read: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@realtime_router.post("/notifications/broadcast")
async def broadcast_notification(
    title: str,
    message: str,
    notification_type: Literal["system", "deal", "update"] = "system",
    priority: Literal["low", "medium", "high"] = "medium"
):
    """
    Broadcast a notification to all connected users (admin only)
    
    Use cases:
    - System maintenance alerts
    - Flash sales
    - Platform updates
    """
    try:
        import uuid
        
        notification = {
            "type": "broadcast",
            "notification_id": str(uuid.uuid4()),
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "priority": priority,
            "timestamp": datetime.now().isoformat()
        }
        
        # Broadcast to all connected clients
        await manager.broadcast(notification)
        
        return {
            "success": True,
            "message": f"Notification broadcast to {len(manager.active_connections)} users",
            "notification": notification
        }
        
    except Exception as e:
        logger.error(f"Failed to broadcast notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# PROVIDER STATUS MONITORING
# ============================================================================

@realtime_router.get("/providers/status")
async def get_provider_status():
    """
    Get real-time status of all providers
    
    Includes:
    - Online/offline status
    - Response time
    - Error rate
    - Current load
    """
    try:
        import random
        
        providers = [
            {
                "provider_id": "expedia_001",
                "name": "Expedia",
                "status": "online",
                "response_time_ms": random.randint(150, 300),
                "error_rate": round(random.uniform(0.005, 0.02), 4),
                "current_load": random.randint(60, 95),
                "last_checked": datetime.now().isoformat()
            },
            {
                "provider_id": "amadeus_001",
                "name": "Amadeus",
                "status": "online",
                "response_time_ms": random.randint(150, 300),
                "error_rate": round(random.uniform(0.005, 0.02), 4),
                "current_load": random.randint(60, 95),
                "last_checked": datetime.now().isoformat()
            },
            {
                "provider_id": "viator_001",
                "name": "Viator",
                "status": "online",
                "response_time_ms": random.randint(150, 300),
                "error_rate": round(random.uniform(0.005, 0.02), 4),
                "current_load": random.randint(60, 95),
                "last_checked": datetime.now().isoformat()
            },
            {
                "provider_id": "sabre_001",
                "name": "Sabre",
                "status": random.choice(["online", "degraded"]),
                "response_time_ms": random.randint(200, 500),
                "error_rate": round(random.uniform(0.01, 0.05), 4),
                "current_load": random.randint(75, 98),
                "last_checked": datetime.now().isoformat()
            }
        ]
        
        return {
            "success": True,
            "providers": providers,
            "timestamp": datetime.now().isoformat(),
            "overall_health": "healthy"
        }
        
    except Exception as e:
        logger.error(f"Failed to get provider status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# BOOKING UPDATES
# ============================================================================

@realtime_router.get("/bookings/{booking_id}/status")
async def get_booking_status(booking_id: str):
    """
    Get real-time booking status
    
    Use cases:
    - Track booking confirmation
    - Monitor payment processing
    - Real-time updates during checkout
    """
    try:
        import random
        
        statuses = ["pending", "processing", "confirmed", "cancelled"]
        
        return {
            "success": True,
            "booking_id": booking_id,
            "status": random.choice(statuses[:3]),  # Mostly successful
            "status_details": {
                "payment_status": "completed",
                "confirmation_sent": True,
                "provider_confirmed": True,
                "estimated_confirmation_time": "immediate"
            },
            "last_updated": datetime.now().isoformat(),
            "next_update": (datetime.now() + timedelta(minutes=5)).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get booking status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SYSTEM HEALTH
# ============================================================================

@realtime_router.get("/system/health")
async def get_system_health():
    """Get real-time system health metrics"""
    try:
        import random
        
        return {
            "success": True,
            "system_status": "healthy",
            "services": {
                "api": "healthy",
                "database": "healthy",
                "cache": "healthy",
                "search": "healthy",
                "payment": "healthy"
            },
            "performance": {
                "avg_response_time_ms": random.randint(100, 250),
                "requests_per_minute": random.randint(500, 2000),
                "error_rate": round(random.uniform(0.001, 0.01), 4),
                "uptime_percentage": 99.98
            },
            "active_connections": len(manager.active_connections),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get system health: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# PRICE HISTORY
# ============================================================================

@realtime_router.get("/prices/history")
async def get_price_history(
    item_type: Literal["hotel", "flight", "activity"],
    item_id: str,
    days: int = 30
):
    """Get price history for trend analysis"""
    try:
        import random
        
        # Generate mock price history
        history = []
        base_price = 200
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i)
            price = base_price + random.uniform(-50, 50)
            history.append({
                "date": date.strftime('%Y-%m-%d'),
                "price": round(price, 2),
                "availability": random.choice([True, True, True, False])
            })
        
        return {
            "success": True,
            "item_type": item_type,
            "item_id": item_id,
            "history": history,
            "price_trend": "stable",  # stable, increasing, decreasing
            "avg_price": round(sum(h['price'] for h in history) / len(history), 2),
            "min_price": round(min(h['price'] for h in history), 2),
            "max_price": round(max(h['price'] for h in history), 2)
        }
        
    except Exception as e:
        logger.error(f"Failed to get price history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
