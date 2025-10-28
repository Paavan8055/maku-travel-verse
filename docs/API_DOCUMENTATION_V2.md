# MAKU.TRAVEL API DOCUMENTATION
## Complete Endpoint Reference (v2.1.0)

**Last Updated**: January 25, 2026  
**Base URL**: https://dream-marketplace.preview.emergentagent.com/api  
**API Version**: 2.1.0

---

## API CATEGORIES

1. **Provider & Partner Marketplace** - 14 endpoints
2. **Provider Analytics Dashboard** - 5 endpoints
3. **Cross-Chain Bridge** - 6 endpoints
4. **Unified Search** - 3 endpoints
5. **Destination Content** - 7 endpoints
6. **Advanced Search** - 5 endpoints
7. **AI Personalization** - 6 endpoints
8. **Analytics Dashboard** - 11 endpoints
9. **Real-Time Features** - 10 endpoints
10. **Payment Gateway** - 9 endpoints
11. **Blockchain** - 9 endpoints
12. **Travel Fund** - 8 endpoints
13. **Smart Dreams** - 7 endpoints
14. **Off-Season Engine** - 8 endpoints

**Total**: 108+ API endpoints

---

## NEWLY IMPLEMENTED ENDPOINTS (Phase 2-7)

### Provider & Partner Marketplace (14 endpoints) ✅

```
GET    /api/providers/registry                    # List all providers
GET    /api/providers/active                       # List active providers
GET    /api/providers/{provider_id}               # Get provider details
GET    /api/providers/rotation/{service_type}     # Get rotation order
GET    /api/partners/registry                     # List all partners
GET    /api/partners/{partner_id}                 # Get partner details
GET    /api/partners/{partner_id}/inventory       # Get inventory
POST   /api/partners/{partner_id}/bids            # Create bid
GET    /api/partners/{partner_id}/bids            # List bids
PATCH  /api/partners/{partner_id}/bids/{bid_id}   # Update bid
GET    /api/marketplace/health                    # Marketplace health
GET    /api/marketplace/stats                     # Marketplace stats
```

### Provider Analytics Dashboard (6 endpoints) ✅

```
GET    /api/admin/providers/analytics/overview                    # Analytics overview
GET    /api/admin/providers/analytics/{provider_id}/detailed     # Detailed analytics
GET    /api/admin/providers/rotation/logs                        # Rotation logs
POST   /api/admin/providers/analytics/{provider_id}/toggle-active # Toggle active
POST   /api/admin/providers/analytics/{provider_id}/update-priority # Update priority
GET    /api/admin/providers/health/summary                       # Health summary
```

### Cross-Chain Bridge (6 endpoints) ✅

```
GET    /api/bridge/supported-chains              # List supported chains
POST   /api/bridge/quote                         # Get bridge quote
POST   /api/bridge/execute                       # Execute bridge
GET    /api/bridge/status/{bridge_tx_id}         # Get bridge status
GET    /api/bridge/history/{wallet_address}     # Bridge history
GET    /api/bridge/liquidity                     # Bridge liquidity
```

### Unified Search (3 endpoints) ✅

```
POST   /api/search/unified                        # Unified search with rotation
GET    /api/search/rotation/simulate             # Simulate rotation
GET    /api/search/test/provider/{provider_name} # Test individual provider
```

### Destination Content (7 endpoints) ✅

```
GET    /api/destinations/all                      # List all destinations
GET    /api/destinations/{destination_name}       # Get destination details
GET    /api/destinations/search/by-region         # Search by region
GET    /api/destinations/spiritual-sites/all      # All spiritual sites
GET    /api/destinations/hidden-gems/all          # All hidden gems
GET    /api/destinations/local-businesses/all     # All local businesses
GET    /api/destinations/recommendations/for-user # Personalized recommendations
```

---

## PROVIDER ADAPTER COVERAGE

### Sabre GDS
```python
# Coverage: 650K hotels + 400 airlines
# Regions: Global (160+ countries)
# Authentication: OAuth 2.0 (1-hour tokens)

POST /api/search/test/provider/sabre?search_type=hotel&destination=NYC
POST /api/search/test/provider/sabre?search_type=flight&destination=LAX
```

### HotelBeds
```python
# Coverage: 300K hotels (directly contracted)
# Regions: Europe, Americas, Asia
# Authentication: Signature-based (per-request)

POST /api/search/test/provider/hotelbeds?search_type=hotel&destination=PAR
```

### Amadeus
```python
# Coverage: 650K hotels + 400 airlines + activities
# Regions: Global (190+ markets)
# Authentication: OAuth 2.0 (30-min tokens)

POST /api/search/test/provider/amadeus?search_type=hotel&destination=LON
POST /api/search/test/provider/amadeus?search_type=flight&destination=NYC
POST /api/search/test/provider/amadeus?search_type=activity&destination=PAR
```

### Local Suppliers
```python
# Coverage: Unlimited local businesses
# Regions: 66 destinations
# Authentication: Manual coordination

POST /api/search/test/provider/local_delhi?search_type=activity&destination=India
```

---

## ROTATION LOGIC EXAMPLES

### Example 1: Hotel Search in India (Eco-Priority ON)

```json
POST /api/search/unified
{
  "search_type": "hotel",
  "destination": "India",
  "check_in": "2026-03-01",
  "check_out": "2026-03-05",
  "guests": 2,
  "eco_priority": true
}

Response:
{
  "provider_used": "local_delhi_hotel",  // Local supplier tried first
  "rotation_summary": {
    "providers_tried": 3,
    "rotation_order": [
      "local_delhi_hotel (priority: 5, eco: 95)",  // Tried first
      "amadeus (priority: 15, eco: 85)",           // Tried second
      "hotelbeds (priority: 20, eco: 80)"          // Tried third
    ]
  }
}
```

### Example 2: Flight Search Global (Eco-Priority OFF)

```json
POST /api/search/unified
{
  "search_type": "flight",
  "destination": "LON",
  "origin": "NYC",
  "check_in": "2026-03-01",
  "eco_priority": false
}

Response:
{
  "provider_used": "sabre",  // Lowest priority (10)
  "rotation_summary": {
    "providers_tried": 1,
    "rotation_order": [
      "sabre (priority: 10)",     // Tried first (best for flights)
      "amadeus (priority: 15)",   // Would try if sabre failed
    ]
  }
}
```

---

## DESTINATION CONTENT USAGE

### Get All Destinations
```bash
GET /api/destinations/all

Response:
{
  "destinations": [
    {"name": "India", "spiritual_sites_count": 4, "hidden_gems_count": 3, ...},
    {"name": "Japan", "spiritual_sites_count": 3, "hidden_gems_count": 2, ...},
    ...
  ],
  "total_count": 66,
  "statistics": {
    "total_spiritual_sites": 58,
    "total_hidden_gems": 120,
    "total_local_businesses": 89,
    "total_experiences": 267
  }
}
```

### Get Destination Details
```bash
GET /api/destinations/India

Response:
{
  "destination": {
    "name": "India",
    "spiritual_sites": [
      {"name": "Varanasi Ghats", "significance": "...", "best_time": "Oct-Mar"},
      ...
    ],
    "hidden_gems": [
      {"name": "Hampi Ruins", "description": "...", "crowd_level": "low"},
      ...
    ],
    "local_businesses": [
      {"name": "Delhi Heritage Walks", "type": "guide", "price": 30},
      ...
    ]
  }
}
```

### Search by Region
```bash
GET /api/destinations/search/by-region?region=Asia

Response:
{
  "region": "Asia",
  "destinations": [
    {"name": "India", "experiences_count": 11},
    {"name": "Thailand", "experiences_count": 8},
    ...
  ],
  "count": 19  // 19 Asian destinations
}
```

### Get Personalized Recommendations
```bash
GET /api/destinations/recommendations/for-user
    ?user_preferences=spiritual
    &budget=mid-range
    &crowd_preference=low

Response:
{
  "recommendations": [
    {
      "destination": "Nepal",
      "score": 85,
      "reasons": ["2 spiritual sites", "Mid-range pricing", "1 low crowd spots"]
    },
    ...
  ]
}
```

---

## CROSS-CHAIN BRIDGE USAGE

### Get Supported Chains
```bash
GET /api/bridge/supported-chains

Response:
{
  "chains": [
    {
      "chain_id": "polygon",
      "network_id": 137,
      "avg_bridge_time_seconds": 30,
      "avg_fee_usd": 0.01
    },
    {
      "chain_id": "sui",
      "network_id": 101,
      "avg_bridge_time_seconds": 10,
      "avg_fee_usd": 0.001
    },
    ...
  ]
}
```

### Get Bridge Quote
```bash
POST /api/bridge/quote
{
  "from_chain": "polygon",
  "to_chain": "sui",
  "amount": 100,
  "recipient_address": "0x123...",
  "user_wallet": "0x456..."
}

Response:
{
  "quote": {
    "estimated_fee_usd": 0.01,
    "estimated_time_seconds": 60,
    "bridge_method": "agglayer"
  }
}
```

---

## PROVIDER ROTATION SIMULATION

### Simulate Rotation Order
```bash
GET /api/search/rotation/simulate
    ?search_type=hotel
    &region=Asia
    &eco_priority=true

Response:
{
  "rotation_order": [
    {
      "order": 1,
      "provider_name": "local_delhi",
      "priority": 5,
      "eco_rating": 95,
      "reason": "Highest priority (local supplier)"
    },
    {
      "order": 2,
      "provider_name": "amadeus",
      "priority": 15,
      "eco_rating": 85,
      "reason": "Second choice (backup provider)"
    },
    ...
  ],
  "explanation": {
    "local_first": "Local suppliers always prioritized (priority 1-9)",
    "eco_priority": "Eco-rating considered when eco_priority=true",
    "fallback": "Global providers if local unavailable"
  }
}
```

---

## ERROR HANDLING

All endpoints return consistent error format:

```json
{
  "detail": "Error message here",
  "status_code": 400/404/500
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `404` - Not found
- `500` - Internal server error

---

## RATE LIMITING

- **Default**: 100 requests/minute per IP
- **Authenticated**: 1000 requests/minute
- **Admin**: Unlimited

---

## AUTHENTICATION

Most endpoints require authentication via Supabase JWT:

```http
Authorization: Bearer {supabase_jwt_token}
```

Admin endpoints require admin role:
```json
{
  "role": "admin"  // In JWT payload
}
```

Partner endpoints require partner_id in JWT:
```json
{
  "partner_id": "uuid-here"  // In JWT payload
}
```

---

## CHANGELOG

### v2.1.0 (January 25, 2026) - Provider Marketplace Release

**Added**:
- 35 new endpoints (provider marketplace, analytics, bridge, destinations)
- 4 provider adapters (Sabre, HotelBeds, Amadeus, Local)
- Health monitoring system
- Cross-chain bridge infrastructure
- 66 destinations with 267 experiences

**Changed**:
- Provider rotation now configuration-driven
- Local-first priority implemented
- Eco-rating prioritization added

**Fixed**:
- None (new features)

---

## SUPPORT

- **Documentation**: /app/docs/
- **Issues**: Contact admin
- **Sandbox Testing**: Use test_ prefixed credentials

---

END OF API DOCUMENTATION
