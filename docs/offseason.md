# MAKU.TRAVEL OFF-SEASON OCCUPANCY ENGINE
## "Zero Empty Beds" Initiative - Complete Documentation

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Data Model](#data-model)
3. [API Endpoints](#api-endpoints)
4. [Feature Flag](#feature-flag)
5. [Deployment Runbook](#deployment-runbook)
6. [KPI Snapshot](#kpi-snapshot)
7. [Yield Optimizer Logic](#yield-optimizer-logic)
8. [Email Templates](#email-templates)

---

## 🎯 Overview

The Off-Season Occupancy Engine is MAKU's strategic solution to maximize hotel occupancy during low-demand periods by intelligently matching traveler dreams with partner inventory allocations.

### Key Components:
1. **Partner Campaign Management**: Hotels define off-season windows, allocations, and discounts
2. **Smart Dreams Integration**: User travel intents capture flexible booking opportunities
3. **LAXMI Wallet System**: Cashback and rewards to incentivize off-season bookings
4. **Yield Optimizer**: AI-powered matching algorithm with scoring
5. **Admin Dashboard**: Real-time KPI tracking and campaign performance

### Business Value:
- **For Hotels**: Fill empty rooms during off-season (38-65% discount range)
- **For Travelers**: Access premium deals matching their dream destinations
- **For MAKU**: Increased booking volume + wallet activation + partner loyalty

---

## 🗄️ Data Model

### Table Relationships
```
partners (EXTENDED)
├── offseason_campaigns (1:N)
│   └── deal_candidates (1:N)
│       └── dream_intents (N:1)
│           └── auth.users (N:1)
│               └── wallet_accounts (1:1)
│                   └── wallet_txns (1:N)
```

### Core Tables

#### 1. `partners` (EXTENDED - Not Duplicated)
Extended existing table with off-season specific fields:
```sql
-- New columns added:
- offseason_enabled: BOOLEAN (default false)
- offseason_allocation: JSONB (min_rooms, max_rooms, seasonal_windows)
- offseason_discount_range: JSONB (min_discount, max_discount)
- blackout_dates: JSONB (array of excluded dates)
```

**Index**: `idx_partners_offseason_enabled` (WHERE offseason_enabled = true)

#### 2. `offseason_campaigns`
Partner-defined off-season inventory windows.

**Schema**:
```sql
id: UUID (PK)
partner_id: UUID (FK → partners.id)
title: TEXT (e.g., "Summer Off-Season Special")
description: TEXT
start_date: DATE (campaign start)
end_date: DATE (campaign end)
min_allocation: INTEGER (minimum rooms to fill)
max_allocation: INTEGER (maximum available)
current_allocation: INTEGER (rooms booked so far)
discount: NUMERIC(5,2) (percentage off, 0-100)
blackout: JSONB (specific excluded dates within window)
audience_tags: TEXT[] (targeting: ["family", "spiritual", "pet-friendly"])
status: TEXT (draft|active|paused|completed|cancelled)
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
created_by: UUID (FK → auth.users.id)
metadata: JSONB
```

**Constraints**:
- `valid_date_range`: end_date >= start_date
- `valid_allocation`: max_allocation >= min_allocation > 0
- `valid_discount`: discount > 0

**Indexes**:
- `idx_offseason_campaigns_partner` (partner_id)
- `idx_offseason_campaigns_dates` (start_date, end_date)
- `idx_offseason_campaigns_status` (status)
- `idx_offseason_campaigns_audience_tags` (GIN on audience_tags)
- `idx_offseason_campaigns_active` (partner_id, status, start_date, end_date) WHERE status = 'active'

**RLS Policies**:
- Partners can only manage their own campaigns
- Admins/service role can manage all
- Public can view active campaigns

#### 3. `dream_intents`
User travel desires captured for matching.

**Schema**:
```sql
id: UUID (PK)
user_id: UUID (FK → auth.users.id)
destination: TEXT (e.g., "Bali", "Paris")
budget: NUMERIC(12,2) (max spending)
tags: TEXT[] (preferences: ["family", "adventure", "spiritual"])
flexible_dates: BOOLEAN (willing to adjust dates)
preferred_start_date: DATE (optional)
preferred_end_date: DATE (optional)
adults: INTEGER (default 1, min 1)
children: INTEGER (default 0, min 0)
status: TEXT (active|matched|booked|expired)
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
expires_at: TIMESTAMPTZ (default NOW() + 90 days)
metadata: JSONB
```

**Indexes**:
- `idx_dream_intents_user` (user_id)
- `idx_dream_intents_destination` (destination)
- `idx_dream_intents_tags` (GIN on tags)
- `idx_dream_intents_status` (status) WHERE status = 'active'
- `idx_dream_intents_budget` (budget)

**RLS Policies**:
- Users can only manage their own dream intents
- Service role can manage all

#### 4. `wallet_accounts` (LAXMI Wallet)
User rewards wallet (separate from blockchain wallet).

**Schema**:
```sql
id: UUID (PK)
owner_id: UUID (FK → auth.users.id, UNIQUE)
balance: NUMERIC(12,2) (current balance, min 0)
tier: TEXT (bronze|silver|gold|platinum)
status: TEXT (active|suspended|closed)
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
metadata: JSONB (total_earned, total_spent, bookings_count)
```

**Constraint**: `unique_owner_wallet` - one wallet per user

**Indexes**:
- `idx_wallet_accounts_owner` (owner_id)
- `idx_wallet_accounts_tier` (tier)
- `idx_wallet_accounts_status` (status)

**RLS Policies**:
- Users can only access their own wallet
- Service role can access all

#### 5. `wallet_txns`
Transaction ledger for LAXMI Wallet.

**Schema**:
```sql
id: UUID (PK)
wallet_id: UUID (FK → wallet_accounts.id)
type: TEXT (credit|debit|cashback|refund|transfer)
amount: NUMERIC(12,2) (transaction value)
balance_before: NUMERIC(12,2) (snapshot before txn)
balance_after: NUMERIC(12,2) (snapshot after txn)
booking_id: UUID (optional, FK → bookings.id)
campaign_id: UUID (optional, FK → offseason_campaigns.id)
description: TEXT
created_at: TIMESTAMPTZ
meta: JSONB
```

**Indexes**:
- `idx_wallet_txns_wallet` (wallet_id)
- `idx_wallet_txns_type` (type)
- `idx_wallet_txns_booking` (booking_id) WHERE booking_id IS NOT NULL
- `idx_wallet_txns_campaign` (campaign_id) WHERE campaign_id IS NOT NULL
- `idx_wallet_txns_created` (created_at DESC)

**RLS Policies**:
- Users can view their own transactions
- Service role can manage all

#### 6. `deal_candidates`
Scored matches between dreams and campaigns.

**Schema**:
```sql
id: UUID (PK)
dream_id: UUID (FK → dream_intents.id)
campaign_id: UUID (FK → offseason_campaigns.id)
provider_mix: JSONB (array of providers used)
score: NUMERIC(5,2) (0-100, match quality)
price: NUMERIC(12,2) (final price after discount)
original_price: NUMERIC(12,2) (pre-discount price)
discount_amount: NUMERIC(12,2)
expires_at: TIMESTAMPTZ (default NOW() + 48 hours)
status: TEXT (pending|presented|accepted|rejected|expired)
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
metadata: JSONB (scoring breakdown)
```

**Indexes**:
- `idx_deal_candidates_dream` (dream_id)
- `idx_deal_candidates_campaign` (campaign_id)
- `idx_deal_candidates_score` (score DESC)
- `idx_deal_candidates_status` (status)
- `idx_deal_candidates_expires` (expires_at) WHERE status = 'pending'

**RLS Policies**:
- Users can view deals for their own dreams
- Service role can manage all

### RPC Functions

#### `get_offseason_deals(user_uuid UUID)`
Returns top 10 scored deals for a user.

**Returns**:
```typescript
{
  campaign_id: UUID,
  campaign_title: string,
  partner_name: string,
  destination: string,
  discount: number,
  start_date: Date,
  end_date: Date,
  score: number,
  price: number,
  dream_id: UUID
}[]
```

**Logic**:
- Filters active campaigns and dreams
- Joins with deal candidates
- Sorts by score DESC, price ASC
- Limits to 10 results
- Only includes campaigns within next 6 months

---

## 🔌 API Endpoints

### Backend: FastAPI (Railway)

All endpoints prefixed with `/api` for Kubernetes ingress routing.

#### Partner Campaign Management

##### `POST /api/partners/campaigns`
Create or update partner campaign.

**Authentication**: Partner role or admin

**Request Body**:
```json
{
  "partner_id": "uuid",
  "title": "Summer Special",
  "description": "40% off June-August",
  "start_date": "2025-06-01",
  "end_date": "2025-08-31",
  "min_allocation": 10,
  "max_allocation": 50,
  "discount": 40.00,
  "blackout": ["2025-07-04", "2025-07-15"],
  "audience_tags": ["family", "beach"]
}
```

**Response**:
```json
{
  "success": true,
  "campaign_id": "uuid",
  "message": "Campaign created successfully",
  "status": "active"
}
```

**Validation**:
- Date range valid (end >= start)
- Discount 0-100
- Allocation min <= max

##### `GET /api/partners/campaigns/:id/ledger`
View daily allocation for campaign.

**Authentication**: Partner or admin

**Response**:
```json
{
  "campaign_id": "uuid",
  "title": "Summer Special",
  "daily_allocation": [
    {
      "date": "2025-06-01",
      "allocated": 2,
      "available": 48,
      "utilization": 0.04
    }
  ],
  "total_allocated": 45,
  "total_available": 50
}
```

#### Smart Dreams Suggestion

##### `POST /api/smart-dreams/suggest`
Submit dream intent and get top deals.

**Authentication**: User token

**Request Body**:
```json
{
  "destination": "Bali",
  "budget": 2500.00,
  "tags": ["spiritual", "wellness"],
  "flexible_dates": true,
  "adults": 2,
  "children": 0
}
```

**Response**:
```json
{
  "dream_id": "uuid",
  "suggested_deals": [
    {
      "campaign_id": "uuid",
      "campaign_title": "Bali Wellness Retreat",
      "partner_name": "Ubud Serenity Resort",
      "discount": 45.00,
      "price": 1375.00,
      "original_price": 2500.00,
      "score": 94.5,
      "start_date": "2025-06-15",
      "end_date": "2025-09-15",
      "expires_at": "2025-06-03T12:00:00Z"
    }
  ]
}
```

#### LAXMI Wallet Operations

##### `POST /api/wallets/activate`
Activate user wallet (auto-created if doesn't exist).

**Authentication**: User token

**Response**:
```json
{
  "wallet_id": "uuid",
  "balance": 0.00,
  "tier": "bronze",
  "status": "active"
}
```

##### `POST /api/wallets/deposit`
Credit wallet (admin only or via booking cashback).

**Authentication**: Admin or system

**Request Body**:
```json
{
  "user_id": "uuid",
  "amount": 50.00,
  "type": "cashback",
  "booking_id": "uuid",
  "description": "Off-season booking cashback"
}
```

##### `POST /api/wallets/redeem`
Deduct from wallet for booking payment.

**Authentication**: User token

**Request Body**:
```json
{
  "amount": 100.00,
  "booking_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "transaction_id": "uuid",
  "new_balance": 150.00
}
```

#### Yield Optimizer

##### `POST /api/yield/optimize/{user_id}`
Run yield optimizer for user's dreams.

**Authentication**: System or admin

**Process**:
1. Fetch active dreams for user
2. Fetch active campaigns matching destination/tags
3. Score each campaign-dream pair
4. Create deal_candidates entries
5. Return top 5 deals

**Response**:
```json
{
  "user_id": "uuid",
  "optimized_deals": [
    {
      "deal_id": "uuid",
      "campaign_id": "uuid",
      "dream_id": "uuid",
      "score": 96.3,
      "price": 1200.00,
      "savings": 800.00
    }
  ],
  "total_deals_found": 12,
  "optimization_time_ms": 234
}
```

#### Health Check

##### `GET /api/healthz`
Service health status.

**Response**:
```json
{
  "ok": true,
  "version": "0.1.0-offseason",
  "db": "up",
  "timestamp": "2025-06-01T10:30:00Z"
}
```

---

## 🚩 Feature Flag

### Environment Variable
```bash
OFFSEASON_FEATURES=true  # Enable in staging
OFFSEASON_FEATURES=false # Disable in production (until ready)
```

### Frontend Usage
```typescript
// In React components
const OFFSEASON_ENABLED = import.meta.env.VITE_OFFSEASON_FEATURES === 'true';

{OFFSEASON_ENABLED && (
  <OffseasonPartnersPage />
)}
```

### Routes (when enabled)
- `/offseason-partners` - Landing page for partners
- `/dashboard/partners` - Partner campaign management
- `/admin/offseason` - Admin analytics dashboard

---

## 📦 Deployment Runbook

### Manual Deployment Steps (DO NOT AUTO-DEPLOY)

#### Step 1: Supabase Migration
```bash
# Navigate to Supabase directory
cd /app/frontend/supabase

# Apply migration
supabase db push

# Verify tables created
supabase db reset --dry-run

# Test RPC function
supabase db functions test get_offseason_deals
```

#### Step 2: Railway Backend Deploy
```bash
# Set environment variables in Railway dashboard
SUPABASE_URL=https://iomeddeasarntjhqzndu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from_supabase_dashboard>
OFFSEASON_FEATURES=true  # Staging only

# Deploy backend
railway up

# Check health
curl https://smart-dreams-hub.preview.emergentagent.com/api/healthz
```

#### Step 3: Netlify Frontend Build
```bash
# Set environment variables in Netlify dashboard
VITE_API_BASE=https://smart-dreams-hub.preview.emergentagent.com
VITE_OFFSEASON_FEATURES=true  # Staging only

# Trigger build
netlify deploy --prod

# Verify feature flag
# Visit /offseason-partners (should be accessible)
```

#### Step 4: Verification Checklist
- [ ] ✅ Migration applied in Supabase
- [ ] ✅ Railway env variables set and `/api/healthz` returns 200
- [ ] ✅ Netlify env `VITE_API_BASE` set correctly
- [ ] ✅ Feature flag enabled for staging only
- [ ] ✅ Test campaign creation via `/api/partners/campaigns`
- [ ] ✅ Test dream submission via `/api/smart-dreams/suggest`
- [ ] ✅ Test wallet activation via `/api/wallets/activate`
- [ ] ✅ Admin dashboard loads at `/admin/offseason`

---

## 📊 KPI Snapshot

### Admin Dashboard Metrics

#### Primary KPIs
1. **Occupancy Uplift %**
   - Formula: `(Rooms Filled / Total Off-Season Inventory) * 100`
   - Target: 40% uplift in off-season periods
   - Display: Donut chart with percentage

2. **Rooms Filled**
   - Formula: `SUM(current_allocation)` from active campaigns
   - Display: Counter with trend line

3. **Wallet Activations**
   - Formula: `COUNT(*)` from wallet_accounts WHERE status = 'active'
   - Display: Growth chart (monthly)

4. **Revenue Generated**
   - Formula: `SUM(price)` from deal_candidates WHERE status = 'accepted'
   - Display: Currency format with comparison to target

5. **Average Discount**
   - Formula: `AVG(discount)` from offseason_campaigns WHERE status = 'active'
   - Display: Percentage with range indicator

6. **Dream Match Rate**
   - Formula: `(Matched Dreams / Total Dreams) * 100`
   - Display: Success rate gauge

### Secondary KPIs
- Active campaigns count
- Partner participation rate
- Average deal score
- Wallet redemption rate
- Email click-through rate (CTR)

### Export Options
- **CSV**: Daily/weekly/monthly data dumps
- **PDF**: Executive summary report with charts

### KPI Snapshot Script
```bash
# Run KPI snapshot (cron job or manual)
curl -X GET https://smart-dreams-hub.preview.emergentagent.com/api/admin/offseason/kpi-snapshot

# Response
{
  "snapshot_date": "2025-06-01",
  "occupancy_uplift_pct": 42.3,
  "rooms_filled": 1847,
  "wallet_activations": 3421,
  "revenue_generated_usd": 892341.50,
  "avg_discount_pct": 41.2,
  "dream_match_rate_pct": 67.8,
  "active_campaigns": 89,
  "partner_participation_rate_pct": 73.4
}
```

---

## 🧮 Yield Optimizer Logic (v1)

### Scoring Formula
```
score = seasonality_gap_weight
      + discount_weight
      + dream_match_weight
      + wallet_tier_weight
      - blackout_penalty
```

### Weight Breakdown

#### 1. Seasonality Gap Weight (0-30 points)
- **Purpose**: Prefer dates with lowest occupancy
- **Logic**:
  ```python
  if occupancy_rate < 20%: weight = 30
  elif occupancy_rate < 40%: weight = 20
  elif occupancy_rate < 60%: weight = 10
  else: weight = 0
  ```
- **Data Source**: Partner-provided "low" tag or regional season index

#### 2. Discount Weight (0-25 points)
- **Purpose**: Higher discounts = higher scores
- **Logic**:
  ```python
  weight = (discount / 100) * 25
  # 40% discount = 10 points
  # 65% discount = 16.25 points
  ```

#### 3. Dream Match Weight (0-35 points)
- **Purpose**: Tag overlap and budget fit
- **Logic**:
  ```python
  tag_overlap = len(campaign.audience_tags & dream.tags) / len(dream.tags)
  budget_fit = 1 - abs(price - dream.budget) / dream.budget
  weight = (tag_overlap * 20) + (budget_fit * 15)
  ```
- **Example**:
  - Dream tags: ["family", "beach", "summer"]
  - Campaign tags: ["family", "summer"]
  - Overlap: 2/3 = 0.67 → 13.4 points
  - Budget fit: 0.90 → 13.5 points
  - Total: 26.9 points

#### 4. Wallet Tier Weight (0-10 points)
- **Purpose**: Encourage wallet usage
- **Logic**:
  ```python
  if tier == 'platinum': weight = 10
  elif tier == 'gold': weight = 7
  elif tier == 'silver': weight = 4
  else: weight = 0  # bronze
  ```

#### 5. Blackout Penalty (-20 points)
- **Purpose**: Penalize campaigns with many blackout dates
- **Logic**:
  ```python
  blackout_ratio = len(campaign.blackout) / total_days_in_window
  penalty = blackout_ratio * 20
  ```

### Total Score Range: 0-100

### Deal Presentation
- Top 5 deals per user (highest score)
- Ties broken by lowest price
- Expires in 48 hours

### Unit Tests Required
```python
def test_perfect_match():
    # All tags match, perfect budget, platinum tier, no blackouts
    assert score == 100

def test_no_match():
    # No tag overlap, budget too high, bronze tier, many blackouts
    assert score < 20

def test_discount_impact():
    # Higher discount should increase score
    score_40 = calculate_score(discount=40)
    score_65 = calculate_score(discount=65)
    assert score_65 > score_40
```

---

## 📧 Email Templates

### Template 1: Dream Match Notification
**Subject**: 🌟 Your Dream Fits a 38% Off Window in Bali (12-26 Aug)

**Body**:
```html
Hi [First Name],

Great news! We found an amazing match for your Bali wellness retreat dream:

🏨 Ubud Serenity Resort
📅 Available: August 12-26, 2025
💰 Your Price: $1,375 (38% off - Save $875!)
🎯 Match Score: 94/100

This exclusive off-season deal includes:
✓ Wellness spa access
✓ Daily yoga sessions
✓ Spiritual tour packages
✓ Pet-friendly accommodations

⏰ This offer expires in 48 hours.

[Book Now] [View All Deals]

Questions? Reply to this email or visit our help center.

Happy travels,
The MAKU Team
```

**Triggers**:
- When deal_candidates entry created with score > 85
- When dream_intents matches active campaign
- Max 1 email per day per user

### Template 2: Campaign Ledger Update (Partners)
**Subject**: 📊 Your Summer Special Campaign - Daily Update

**Body**:
```html
Hi [Partner Name],

Here's today's update for your "Summer Special" campaign:

📈 Performance Summary:
- Rooms Booked Today: 3
- Total Rooms Filled: 45 / 50 (90%)
- Remaining Inventory: 5 rooms
- Revenue Generated: $67,500

🎯 Top Performing Dates:
1. Aug 15-17: 8 bookings
2. Jul 20-22: 6 bookings
3. Jun 30-Jul 2: 5 bookings

🔔 Alert: You're 5 rooms away from full capacity! Consider:
- Creating another campaign window
- Adjusting discount for peak dates
- Expanding audience targeting

[View Full Ledger] [Create New Campaign]

Best regards,
MAKU Partner Success Team
```

### Template 3: Wallet Cashback Notification
**Subject**: 💰 $50 Cashback Earned from Your Bali Booking!

**Body**:
```html
Hi [First Name],

Congrats on your Bali booking! Here's your reward:

💵 Cashback Earned: $50.00
🏆 Wallet Balance: $150.00
⭐ Tier: Silver

How to Use Your Balance:
- Apply to your next off-season booking
- Combine with ongoing discounts
- Share with family via wallet transfer

Your wallet balance never expires!

[View Wallet] [Browse Deals]

Keep traveling smart,
The MAKU Team
```

### Email Queue API
```python
# Backend endpoint (logging only, no actual email send)
POST /api/emails/queue
{
  "template": "dream_match",
  "user_id": "uuid",
  "data": {
    "first_name": "John",
    "destination": "Bali",
    "discount": 38,
    "price": 1375,
    "expires_at": "2025-06-03T12:00:00Z"
  }
}

# Response (logs only, production will integrate SendGrid/etc)
{
  "queued": true,
  "email_id": "uuid",
  "log_entry": "Email queued for user_id: uuid, template: dream_match"
}
```

---

## 🔒 Security Considerations

### Partner Access Control
- Partners can only create campaigns for their own properties
- RLS enforces partner_id matching
- Admin override for support scenarios

### User Data Privacy
- Dream intents are private (user_id scoped)
- Wallet balances encrypted at rest
- Transaction history audit trail

### Rate Limiting
- Campaign creation: 10/hour per partner
- Dream submission: 5/day per user
- Yield optimizer: System-triggered only (no public access)

---

## 🧪 Testing Strategy

### Phase 1: Schema Testing
```bash
# Test migration
supabase db reset
supabase db push

# Test RPC function
SELECT * FROM get_offseason_deals('<test_user_uuid>');

# Verify indexes
EXPLAIN ANALYZE SELECT * FROM offseason_campaigns WHERE status = 'active';
```

### Phase 2: Backend Testing
```bash
# Unit tests
pytest backend/tests/test_offseason_endpoints.py

# Integration tests
pytest backend/tests/test_yield_optimizer.py

# Load test campaigns API
hey -n 100 -c 10 https://api/partners/campaigns
```

### Phase 3: Frontend Testing
```bash
# E2E tests (Playwright)
npx playwright test tests/offseason-flow.spec.ts

# Visual regression
npm run test:visual

# Accessibility
npm run test:a11y
```

---

## 📈 Roadmap (Post-MVP)

### v0.2 Enhancements
- Real-time occupancy data from PMS integrations
- Machine learning scoring model (replace rule-based)
- Multi-destination dream bundles
- Group booking deals

### v0.3 Enhancements
- Dynamic pricing based on demand
- Partner bidding system for dream matches
- Wallet transfers between users
- Referral rewards program

---

## 🆘 Support & Troubleshooting

### Common Issues

**Issue**: Campaign not showing in deals
- **Check**: status = 'active', date range valid, allocation not full
- **Fix**: `UPDATE offseason_campaigns SET status = 'active' WHERE id = '<uuid>'`

**Issue**: Yield optimizer returns no deals
- **Check**: User has active dream_intents, campaigns match destination
- **Fix**: Add more campaigns or relax tag matching logic

**Issue**: Wallet balance not updating
- **Check**: RLS policies, transaction_type correct
- **Fix**: Review wallet_txns for failed entries, check balance snapshots

### Contact
- **Slack**: #maku-offseason-engine
- **Email**: dev@maku.travel
- **Docs**: https://docs.maku.travel/offseason

---

## ✅ Release Checklist (v0.1.0-offseason)

### Pre-Deployment
- [ ] Migration file reviewed and tested
- [ ] All backend endpoints have unit tests (>80% coverage)
- [ ] Frontend components feature-flagged
- [ ] RLS policies tested with test users
- [ ] KPI dashboard wire frames approved
- [ ] Email templates drafted (no live sending)

### Deployment
- [ ] ✅ Migration applied in Supabase
- [ ] ✅ Railway env set and /healthz OK
- [ ] ✅ Netlify env VITE_API_BASE set
- [ ] ✅ Feature flag enabled for staging only
- [ ] ✅ Admin dashboard accessible
- [ ] ✅ Sample data loaded for testing

### Post-Deployment
- [ ] Smoke tests passed (campaign CRUD, dream submission, wallet ops)
- [ ] No regressions in existing booking flows
- [ ] Partner training materials shared
- [ ] User docs published
- [ ] KPI dashboard showing live data

---

**Document Version**: 1.0  
**Last Updated**: 2025-06-01  
**Maintained By**: MAKU Engineering Team  
**Status**: Production Ready (Staging)
