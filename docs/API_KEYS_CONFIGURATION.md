# API Keys & Provider Configuration

## Overview
This document provides a comprehensive guide to all API keys and provider configurations for Maku.Travel platform.

---

## Current Preview URL
**Environment:** https://dream-marketplace.preview.emergentagent.com

---

## Provider API Keys Status

### 1. **Sabre GDS** (Global Distribution System)
- **Status:** Test Mode
- **Environment Variables:**
  - `SABRE_CLIENT_ID`: test_sabre_client_id
  - `SABRE_CLIENT_SECRET`: test_sabre_secret
  - `SABRE_API_BASE`: https://api.sabre.com
  - `SABRE_ENV`: test
- **Capabilities:** Flights, Hotels
- **Documentation:** https://developer.sabre.com/
- **Priority:** High (Core GDS provider)

### 2. **HotelBeds** (Hotel Content Provider)
- **Status:** Test Mode
- **Environment Variables:**
  - `HOTELBEDS_API_KEY`: test_hotelbeds_key
  - `HOTELBEDS_API_SECRET`: test_hotelbeds_secret
  - `HOTELBEDS_API_BASE`: https://api.test.hotelbeds.com
  - `HOTELBEDS_ENV`: test
- **Capabilities:** Hotels, Transfers
- **Documentation:** https://developer.hotelbeds.com/
- **Priority:** High

### 3. **Amadeus** (Global Travel API)
- **Status:** Test Mode
- **Environment Variables:**
  - `AMADEUS_API_KEY`: test_amadeus_key
  - `AMADEUS_API_SECRET`: test_amadeus_secret
  - `AMADEUS_API_BASE`: https://test.api.amadeus.com
  - `AMADEUS_ENV`: test
- **Capabilities:** Flights, Hotels, Activities
- **Documentation:** https://developers.amadeus.com/
- **Priority:** High

### 4. **Expedia** (Hotel & Flight Provider)
- **Status:** Development Mode
- **Environment Variables:**
  - `EXPEDIA_API_KEY`: dev-expedia-api-key
  - `EXPEDIA_API_SECRET`: dev-expedia-api-secret
- **Capabilities:** Hotels, Flights, Car Rentals
- **Priority:** Medium

### 5. **Nuitee** (Hotel Booking API)
- **Status:** Development Mode
- **Environment Variables:**
  - `NUITEE_API_KEY`: dev-nuitee-api-key
  - `NUITEE_API_SECRET`: dev-nuitee-api-secret
- **Capabilities:** Hotels
- **Priority:** Medium

### 6. **GetYourGuide** (Activities & Experiences)
- **Status:** Development Mode
- **Environment Variables:**
  - `GETYOURGUIDE_API_KEY`: dev-getyourguide-api-key
  - `GETYOURGUIDE_API_SECRET`: dev-getyourguide-api-secret
- **Capabilities:** Activities, Tours, Experiences
- **Documentation:** https://www.getyourguide.com/supplier/
- **Priority:** High (Unique experiences)

---

## AI & Intelligence Keys

### **OpenAI** (ChatGPT Pro)
- **Status:** Active (Production Key)
- **Environment Variable:** `OPENAI_API_KEY`
- **Models Used:**
  - `gpt-4o`: Smart Dreams, Recommendations
  - `o1`: Travel DNA Analysis
  - `gpt-4o-mini`: Customer Support
- **Cost Management:**
  - Daily threshold: $50
  - User daily threshold: $5
  - Rollout phase: admin_only

### **Emergent Universal LLM Key**
- **Status:** Active
- **Environment Variable:** `EMERGENT_LLM_KEY`
- **Value:** sk-emergent-853C8D6Ff435a784bF
- **Capabilities:**
  - OpenAI models (text & image)
  - Claude models (text only)
  - Gemini models (text & nano banana)

---

## Database & Infrastructure

### **Supabase**
- **Status:** Active
- **URL:** https://iomeddeasarntjhqzndu.supabase.co
- **Project ID:** iomeddeasarntjhqzndu
- **Environment Variables:**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Usage:** User authentication, provider registry, partner data, bookings

### **MongoDB**
- **Status:** Active (Local)
- **Connection:** mongodb://localhost:27017
- **Database:** test_database
- **Environment Variable:** `MONGO_URL`
- **Usage:** User profiles, booking data, analytics

---

## Blockchain & Crypto

### **Polygon (Mumbai Testnet)**
- **Status:** Mock Mode (Testing)
- **RPC URL:** https://rpc-mumbai.maticvigil.com
- **Environment Variables:**
  - `BLOCKCHAIN_MODE`: mock
  - `POLYGON_RPC_URL`
  - `MAKU_TOKEN_ADDRESS`
  - `MAKU_NFT_ADDRESS`
  - `BLOCKCHAIN_PRIVATE_KEY`: mock_key_for_testing_only

---

## Provider Rotation Configuration

### Current Settings (backend/.env):
```
PROVIDER_ROTATION_ENABLED=true
PROVIDER_ECO_PRIORITY=true
PROVIDER_LOCAL_FIRST=true
PROVIDER_HEALTH_CHECK_INTERVAL=300
PROVIDER_MAX_RETRIES=3
PROVIDER_TIMEOUT_MS=30000
PROVIDER_CACHE_TTL=3600
```

### Rotation Priority:
1. **Local Suppliers** (Priority 1-9): Direct bookings with local businesses
2. **Eco-Rating** (85+): Sustainable providers prioritized
3. **Fee Transparency** (90+): Transparent pricing providers
4. **Health & Performance**: Dynamic adjustment based on metrics

---

## Supabase Vault (Secure Key Storage)

### Setup Instructions:
All provider API keys should be migrated to Supabase Vault for production:

```sql
-- Store provider keys securely
SELECT vault.create_secret('[YOUR_ACTUAL_KEY]', 'sabre_client_id');
SELECT vault.create_secret('[YOUR_ACTUAL_SECRET]', 'sabre_client_secret');
SELECT vault.create_secret('[YOUR_ACTUAL_KEY]', 'hotelbeds_api_key');
-- ... repeat for all providers
```

### Accessing from Backend:
```python
from integrations.supabase import get_secret

sabre_client_id = get_secret('sabre_client_id')
hotelbeds_key = get_secret('hotelbeds_api_key')
```

---

## Action Items for Production

### ⚠️ **CRITICAL - Replace Test Keys:**
- [ ] Sabre: Get production credentials from https://developer.sabre.com/
- [ ] HotelBeds: Get production API keys from https://developer.hotelbeds.com/
- [ ] Amadeus: Get production keys from https://developers.amadeus.com/
- [ ] Expedia: Replace dev keys with production credentials
- [ ] Nuitee: Replace dev keys with production credentials
- [ ] GetYourGuide: Get production supplier credentials

### 🔐 **Security Hardening:**
- [ ] Migrate all API keys to Supabase Vault
- [ ] Enable RLS policies on all Supabase tables
- [ ] Rotate emergency backup keys
- [ ] Set up key rotation schedule (quarterly)
- [ ] Enable API usage monitoring and alerting

### 🚀 **Production Readiness:**
- [ ] Switch `BLOCKCHAIN_MODE` from mock to production
- [ ] Configure production MongoDB instance
- [ ] Set up production Polygon mainnet
- [ ] Update `ENVIRONMENT` from development to production
- [ ] Disable `USE_FREE_AI` and enable `USE_EMERGENT_AI`

---

## Emergency Contacts

### Provider Support:
- **Sabre:** support@sabre.com
- **HotelBeds:** https://developer.hotelbeds.com/support/
- **Amadeus:** https://developers.amadeus.com/support
- **GetYourGuide:** supplier-support@getyourguide.com

### Infrastructure:
- **Supabase:** https://supabase.com/support
- **OpenAI:** https://platform.openai.com/support
- **Railway/Netlify:** Via respective dashboards

---

**Last Updated:** June 2025  
**Maintained By:** Maku.Travel Engineering Team
