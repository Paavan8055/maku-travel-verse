# MAKU.TRAVEL PRODUCTION DEPLOYMENT CHECKLIST
## Based on Preview vs Production Testing (Oct 25, 2025)

---

## EXECUTIVE SUMMARY

**Preview Build Status**: ✅ All major features functional
**Production Status**: ⚠️ Missing new features (behind preview)
**Action Required**: Deploy preview → production with data seeding & backend integration

---

## 1. DATABASE MIGRATIONS ✅ READY TO APPLY

### Apply Supabase Migrations

```bash
cd /app/supabase
supabase db push

# Verify tables created
supabase db pull
```

**Expected Tables Created:**
- provider_registry
- provider_credentials  
- provider_health_logs
- provider_rotation_logs
- partner_registry
- partner_documents
- partner_inventory
- partner_bids

**Verification:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%provider%' OR table_name LIKE '%partner%';
```

---

## 2. DATA SEEDING REQUIRED ⚠️

### A. Provider Registry (Admin can do via UI at /admin/providers)

**Insert Core Providers:**
```sql
INSERT INTO provider_registry (
  provider_name, display_name, provider_type, api_base_url,
  supports_hotels, supports_flights, supports_activities,
  priority, eco_rating, fee_transparency_score, is_active, is_test_mode
) VALUES
('sabre', 'Sabre GDS', 'flight', 'https://api.sabre.com', true, true, false, 10, 75, 85, true, true),
('hotelbeds', 'HotelBeds', 'hotel', 'https://api.hotelbeds.com', true, false, false, 20, 80, 90, true, true),
('amadeus', 'Amadeus', 'hotel', 'https://api.amadeus.com', true, true, false, 15, 85, 95, true, true),
('expedia_taap', 'Expedia TAAP', 'package', 'https://api.expedia.com', true, true, true, 25, 70, 80, true, true),
('viator', 'Viator', 'activity', 'https://api.viator.com', false, false, true, 5, 80, 90, true, true),
('getyourguide', 'GetYourGuide', 'activity', 'https://api.getyourguide.com', false, false, true, 10, 85, 95, true, true);
```

### B. Local Businesses for Destination Deep Dive

**India Example:**
```sql
INSERT INTO local_businesses (
  name, type, destination, verified, insider_tip, price_range, contact
) VALUES
('Delhi Heritage Walks', 'guide', 'India', true, 'Local historian guides, family-run since 1985', '₹₹', '{"whatsapp": "+91-9876543210"}'),
('Kashmir Shawl Artisans', 'shop', 'India', true, 'Direct from weavers, authentic pashmina', '₹₹₹', '{"location": "Old Delhi, in-person only"}'),
('Varanasi Boat Sunrise', 'experience', 'India', true, 'Family boat business 3 generations', '₹', '{"booking": "Via guesthouse"}');
```

**Repeat for all 40+ destinations** or create seeding script.

### C. Destination Deep Dive Content

Create comprehensive JSON/database entries for each destination with:
- Spiritual/cultural sites
- Hidden gems
- Activities
- Restaurants
- Airlines routes

**Seeding Script Needed**: `/app/backend/scripts/seed_destinations.py`

---

## 3. BACKEND PROVIDER MANAGER DEPLOYMENT ✅

### A. Install Provider Dependencies

```bash
cd /app/backend
pip install --upgrade pip
pip install -r requirements.txt

# Add new provider libraries if needed
pip install sabre-sdk hotelbeds-sdk amadeus-sdk
```

### B. Update Environment Variables

**Backend `.env` additions needed:**
```env
# Provider Registry
PROVIDER_REGISTRY_ENABLED=true
SUPABASE_VAULT_ENABLED=true

# Sabre
SABRE_CLIENT_ID=your_sabre_client_id
SABRE_CLIENT_SECRET=your_sabre_secret
SABRE_BASE_URL=https://api.sabre.com

# HotelBeds
HOTELBEDS_API_KEY=your_hotelbeds_key
HOTELBEDS_SECRET=your_hotelbeds_secret
HOTELBEDS_BASE_URL=https://api.hotelbeds.com

# Amadeus
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret
AMADEUS_BASE_URL=https://api.amadeus.com

# Expedia TAAP
EXPEDIA_TAAP_API_KEY=your_expedia_key
EXPEDIA_TAAP_SECRET=your_expedia_secret

# Booking.com
BOOKING_COM_API_KEY=your_booking_key
```

### C. Initialize Universal Provider Manager

**In `/app/backend/server.py`:**
```python
from providers.universal_provider_manager import universal_provider_manager

@app.on_event(\"startup\")
async def startup_event():
    # Load providers from Supabase registry
    await universal_provider_manager.load_providers_from_registry(supabase_client)
    logger.info(\"✅ Universal Provider Manager initialized\")
```

---

## 4. SUPABASE CONFIGURATION ✅

### A. Row-Level Security Policies

**Verify RLS is enabled:**
```sql
ALTER TABLE provider_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_bids ENABLE ROW LEVEL SECURITY;
```

**Admin Access Policy:**
```sql
CREATE POLICY \"Admin full access provider_registry\" ON provider_registry
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
```

**Partner Access Policy:**
```sql
CREATE POLICY \"Partners view own data\" ON partner_registry
  FOR SELECT USING (
    id::text = auth.jwt() ->> 'partner_id' OR
    primary_contact_email = auth.jwt() ->> 'email'
  );
```

### B. Storage Buckets

**Create Buckets:**
```bash
supabase storage create partner-docs
supabase storage create partner-inventory
```

**Set Bucket Policies:**
```sql
-- Partners can upload to their own folder
CREATE POLICY \"Partners upload own docs\" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### C. Supabase Vault Setup

**Store sensitive credentials:**
```bash
# Via Supabase Dashboard:
# Settings → Vault → Add Secret
# Name: SABRE_CLIENT_SECRET
# Value: actual_secret_value
```

---

## 5. ADMIN AUTHENTICATION SETUP ⚠️

### Configure Admin Users in Supabase

```sql
-- Update user metadata to grant admin role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '\"admin\"'
)
WHERE email IN ('admin@maku.travel', 'cto@maku.travel');
```

**Or via Supabase Dashboard:**
1. Go to Authentication → Users
2. Select user
3. Edit Raw User Meta Data
4. Add: `{\"role\": \"admin\"}`

---

## 6. MISSING DATA TO SEED ⚠️

### A. Local Businesses Directory

**For Each Destination (40+), Add:**
- 3-5 local businesses (cafes, guides, shops)
- Contact information
- Price ranges
- Insider tips

**Create Seeding Script:**
```python
# /app/backend/scripts/seed_local_businesses.py
businesses = [
  {\"name\": \"Delhi Heritage Walks\", \"type\": \"guide\", \"destination\": \"India\", ...},
  # ... 200+ entries
]
```

### B. Partner Inventory

**For Testing Partners:**
```sql
-- Sample inventory for next 90 days
INSERT INTO partner_inventory (partner_id, property_id, room_type, date, available_rooms, base_price)
SELECT 
  'partner-uuid',
  'prop-001',
  'Deluxe Room',
  generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', '1 day'),
  FLOOR(RANDOM() * 20 + 10), -- 10-30 rooms
  200 + FLOOR(RANDOM() * 100); -- $200-300
```

### C. Mock Partner Bids

**For Dream Marketplace Testing:**
```sql
INSERT INTO partner_bids (partner_id, user_dream_id, bid_type, offer_price, original_price, discount_percent, valid_until)
VALUES
('partner-1', 'dream-123', 'package', 5625, 7500, 25, NOW() + INTERVAL '30 days'),
('partner-2', 'dream-123', 'package', 6000, 7500, 20, NOW() + INTERVAL '30 days');
```

---

## 7. FRONTEND ENVIRONMENT VARIABLES ✅

**Verify `.env` has:**
```env
VITE_REACT_APP_BACKEND_URL=https://smart-dreams-hub.preview.emergentagent.com
VITE_SUPABASE_URL=https://iomeddeasarntjhqzndu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OFFSEASON_FEATURES=true
```

**For Production:**
```env
VITE_REACT_APP_BACKEND_URL=https://api.maku.travel
```

---

## 8. DEPLOYMENT STEPS 📋

### Pre-Deployment Checklist

- [ ] Apply Supabase migrations (`supabase db push`)
- [ ] Seed provider registry (via admin UI)
- [ ] Seed local businesses data
- [ ] Configure admin user roles
- [ ] Set up Supabase Storage buckets
- [ ] Store provider credentials in Vault
- [ ] Configure RLS policies
- [ ] Test admin authentication
- [ ] Verify backend `/healthz` endpoint
- [ ] Build frontend successfully
- [ ] Test all 5 new pages in preview

### Deployment to Production

```bash
# 1. Merge to main
git add .
git commit -m \"feat: Enterprise provider system, partner dashboards, Smart Dreams marketplace\"
git push origin main

# 2. Verify Netlify build
# Monitor: https://app.netlify.com/sites/maku-travel/deploys

# 3. Verify production deployment
curl https://maku.travel/smart-dreams
curl https://maku.travel/partner-onboarding
curl https://api.maku.travel/healthz
```

### Post-Deployment Verification

- [ ] Smart Dreams loads on production
- [ ] Destination deep dive accessible
- [ ] Partner onboarding wizard functional
- [ ] Partner dashboard displays analytics
- [ ] Provider rotation working (check backend logs)
- [ ] Admin provider management accessible
- [ ] Supabase tables populated
- [ ] Storage buckets working
- [ ] No console errors

---

## 9. PERFORMANCE OPTIMIZATIONS 🚀

### A. Lazy Loading

**Already Implemented** ✅
- Dream cards lazy load
- Images optimized with Unsplash parameters
- Charts render on-demand per tab

### B. SEO Meta Tags

**Add to each new page:**
```tsx
// DestinationDeepDive.tsx
<Head>
  <title>{country} Travel Guide | Hidden Gems, Hotels & Activities | Maku.Travel</title>
  <meta name=\"description\" content={`Discover ${country} hidden gems, local cafes, authentic restaurants. Real pricing, expert itineraries, provider bids.`} />
</Head>
```

### C. Analytics Integration

**Add tracking:**
```typescript
// Track page views
gtag('event', 'page_view', {
  page_path: '/smart-dreams',
  page_title: 'Smart Dreams Marketplace'
});
```

---

## 10. MONITORING & ALERTS 📊

### Health Check Endpoints

**Verify all return 200 OK:**
- `GET /api/healthz` - Backend health
- `GET /api/providers/health` - All provider status
- `GET /api/partner/health` - Partner system status

### Logging

**Monitor for:**
- Provider rotation failures
- Failed bids
- Onboarding drop-offs
- Settlement processing errors

### Alerts Setup

**Configure:**
- Sentry for error tracking (already configured)
- Provider downtime alerts (>5 min)
- Low occupancy notifications
- Bid deadline reminders

---

## 11. DOCUMENTATION UPDATES 📚

### User Documentation

**Create:**
- Partner Onboarding Guide
- How to Submit Bids
- Occupancy Optimizer Tutorial
- Settlement & Invoicing FAQ

### Developer Documentation

**Update:**
- Provider Adapter Implementation Guide
- Adding New Providers (via admin UI)
- Database Schema Reference
- API Endpoints Reference

### Business Operations

**Document:**
- Partner Approval Workflow
- KYC Verification Process
- Commission Calculation Rules
- Dispute Resolution Process

---

## 12. TESTING BEFORE PRODUCTION 🧪

### Functional Testing

- [ ] All 40+ dream packages load
- [ ] Filters work (category, price, search)
- [ ] Dream selection → Travel Fund Manager
- [ ] Destination deep dive all 7 tabs
- [ ] Related dreams display
- [ ] Route builder calculates correctly
- [ ] Partner wizard all 5 steps
- [ ] Document upload works
- [ ] Partner dashboard KPIs display
- [ ] Occupancy calendar renders
- [ ] Bidding interface functional

### Integration Testing

- [ ] Provider rotation backend responds
- [ ] Supabase queries work
- [ ] Storage uploads succeed
- [ ] Vault credentials decrypt
- [ ] RLS policies enforce correctly
- [ ] Admin auth works
- [ ] Partner auth works

### Performance Testing

- [ ] Page load <3s
- [ ] Images optimized
- [ ] Charts render smoothly
- [ ] Mobile responsive
- [ ] No memory leaks

---

## 13. ROLLOUT STRATEGY 🎯

### Phase 1: Soft Launch (Week 1)
- Enable for internal team only
- Test with 3-5 pilot partners
- Monitor errors closely
- Gather feedback

### Phase 2: Partner Beta (Week 2-3)
- Invite 20-30 partners to onboard
- Test bidding marketplace
- Validate occupancy optimizer
- Refine UI based on feedback

### Phase 3: Public Launch (Week 4)
- Enable Smart Dreams for all users
- Promote destination deep dives
- Market to travelers
- Scale providers

---

## 14. KNOWN ISSUES & MITIGATION ⚠️

### Issue 1: Local Businesses Tab Blank
**Mitigation**: Seed data for top 10 destinations first, hide tab for others

### Issue 2: Inventory Tab Empty
**Mitigation**: Partners must upload inventory before visible

### Issue 3: Admin Routes 403
**Mitigation**: Configure admin user roles in Supabase (see section 5)

### Issue 4: Some Unsplash Images Block (CORS)
**Mitigation**: Cache images to Supabase Storage or use CDN proxy

---

## 15. SUCCESS METRICS 📈

### Week 1
- 5 partners onboarded
- 10 user dreams created
- 20 provider bids submitted
- Zero critical errors

### Month 1
- 50 partners active
- 100 dreams created
- 500 bids submitted
- 10% occupancy improvement for partners
- $50K revenue generated

### Quarter 1
- 200 partners
- 1000 dreams
- 5000 bids
- 15% avg occupancy improvement
- $500K revenue

---

## 16. EMERGENCY ROLLBACK PLAN 🆘

**If Critical Issues:**

```bash
# 1. Rollback frontend
git revert HEAD
git push origin main

# 2. Rollback database
supabase db reset --db-url <production-url>
supabase db push --db-url <production-url> # Use previous migration

# 3. Disable features via flags
VITE_SMART_DREAMS_ENABLED=false
VITE_PARTNER_PORTAL_ENABLED=false
```

---

## FINAL CHECKLIST BEFORE GOING LIVE ✅

**Infrastructure:**
- [ ] Supabase migrations applied
- [ ] All tables created successfully
- [ ] RLS policies configured
- [ ] Storage buckets created
- [ ] Vault secrets configured

**Data:**
- [ ] Provider registry populated
- [ ] Local businesses seeded (top 10 destinations minimum)
- [ ] Admin users configured
- [ ] Test partner accounts created

**Backend:**
- [ ] Universal provider manager deployed
- [ ] Health check endpoints responding
- [ ] Provider rotation functional
- [ ] Logging configured
- [ ] Error tracking active

**Frontend:**
- [ ] Build successful
- [ ] All routes working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SEO meta tags added

**Testing:**
- [ ] End-to-end testing complete
- [ ] Admin flows tested
- [ ] Partner flows tested
- [ ] User flows tested
- [ ] Performance benchmarks met

**Documentation:**
- [ ] User guides published
- [ ] API docs updated
- [ ] Partner handbook ready
- [ ] Support articles created

**Monitoring:**
- [ ] Sentry configured
- [ ] Health checks automated
- [ ] Alert rules set
- [ ] Dashboard monitoring active

---

## PRODUCTION DEPLOYMENT COMMAND

```bash
# Once all checkboxes above are ✅

git checkout main
git pull origin main
git merge preview-branch
git push origin main

# Netlify auto-deploys
# Monitor: https://app.netlify.com/sites/maku-travel/deploys

# Verify
curl https://maku.travel/smart-dreams
curl https://maku.travel/partner-dashboard
curl https://api.maku.travel/api/providers/health
```

---

**Status**: ✅ Preview fully functional, ready for production with data seeding & backend deployment
