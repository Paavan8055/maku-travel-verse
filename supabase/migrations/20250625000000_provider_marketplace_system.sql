-- Provider Registry & Management System
-- Universal provider configuration with plugin architecture

-- Provider Registry Table
CREATE TABLE IF NOT EXISTS provider_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(100) UNIQUE NOT NULL,
  provider_type VARCHAR(50) NOT NULL, -- 'hotel', 'flight', 'activity', 'car', 'package'
  display_name VARCHAR(200) NOT NULL,
  api_base_url VARCHAR(500),
  api_version VARCHAR(50),
  
  -- Capabilities
  supports_hotels BOOLEAN DEFAULT false,
  supports_flights BOOLEAN DEFAULT false,
  supports_activities BOOLEAN DEFAULT false,
  supports_cars BOOLEAN DEFAULT false,
  supported_regions TEXT[], -- ['north_america', 'europe', 'asia', 'africa', 'oceania', 'middle_east']
  
  -- Configuration
  priority INTEGER DEFAULT 50, -- Lower = higher priority
  is_active BOOLEAN DEFAULT true,
  is_test_mode BOOLEAN DEFAULT true,
  eco_rating INTEGER CHECK (eco_rating >= 0 AND eco_rating <= 100),
  fee_transparency_score INTEGER CHECK (fee_transparency_score >= 0 AND fee_transparency_score <= 100),
  
  -- API Configuration (stored in Supabase Vault, only reference here)
  credentials_vault_id VARCHAR(200), -- Reference to Supabase Vault secret
  requires_authentication BOOLEAN DEFAULT true,
  auth_type VARCHAR(50), -- 'oauth2', 'api_key', 'basic', 'custom'
  
  -- Health Monitoring
  health_status VARCHAR(50) DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
  last_health_check TIMESTAMP,
  avg_response_time_ms INTEGER,
  success_rate_percent DECIMAL(5,2),
  error_rate_percent DECIMAL(5,2),
  
  -- Metadata
  contact_email VARCHAR(255),
  support_url VARCHAR(500),
  documentation_url VARCHAR(500),
  contract_start_date DATE,
  contract_end_date DATE,
  commission_rate DECIMAL(5,2),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Provider Credentials (Encrypted in Supabase Vault)
CREATE TABLE IF NOT EXISTS provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES provider_registry(id) ON DELETE CASCADE,
  credential_key VARCHAR(100) NOT NULL, -- 'api_key', 'client_id', 'client_secret', etc
  credential_value_vault_id VARCHAR(200) NOT NULL, -- Supabase Vault secret ID
  environment VARCHAR(50) DEFAULT 'production', -- 'development', 'staging', 'production'
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  UNIQUE(provider_id, credential_key, environment)
);

-- Provider Health Logs
CREATE TABLE IF NOT EXISTS provider_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES provider_registry(id) ON DELETE CASCADE,
  check_time TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50), -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_message TEXT,
  endpoint_tested VARCHAR(500),
  metadata JSONB
);

-- Provider Rotation Logs
CREATE TABLE IF NOT EXISTS provider_rotation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL,
  service_type VARCHAR(50) NOT NULL, -- 'hotel', 'flight', 'activity'
  provider_id UUID REFERENCES provider_registry(id),
  attempt_order INTEGER,
  success BOOLEAN,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  search_criteria JSONB,
  result_count INTEGER
);

-- Partner Registry (Hotels/Airlines joining platform)
CREATE TABLE IF NOT EXISTS partner_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type VARCHAR(50) NOT NULL, -- 'hotel', 'airline', 'activity_provider', 'dmс', 'influencer'
  business_name VARCHAR(255) NOT NULL,
  legal_entity_name VARCHAR(255),
  tax_id VARCHAR(100),
  
  -- Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  address TEXT,
  country VARCHAR(100),
  
  -- Integration
  integration_type VARCHAR(50), -- 'api', 'channel_manager', 'manual', 'xml'
  channel_manager VARCHAR(100), -- 'opera', 'cloudbeds', 'mews', etc.
  api_endpoint VARCHAR(500),
  inventory_sync_method VARCHAR(50), -- 'real_time', 'daily', 'manual'
  
  -- Business Details
  properties_count INTEGER DEFAULT 1,
  total_rooms INTEGER,
  star_rating DECIMAL(2,1),
  property_types TEXT[], -- ['hotel', 'resort', 'apartment', 'villa']
  
  -- Financial
  commission_model VARCHAR(50), -- 'percentage', 'fixed', 'hybrid'
  commission_rate DECIMAL(5,2),
  currency_preference VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(50), -- 'net_30', 'net_60', 'weekly'
  bank_details_vault_id VARCHAR(200), -- Supabase Vault
  
  -- Verification
  kyc_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  kyc_verified_at TIMESTAMP,
  kyc_verified_by UUID,
  documents_uploaded BOOLEAN DEFAULT false,
  
  -- Status
  onboarding_status VARCHAR(50) DEFAULT 'initiated', -- 'initiated', 'in_progress', 'completed', 'active', 'suspended'
  onboarding_step INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  activation_date TIMESTAMP,
  
  -- Analytics
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_rating DECIMAL(3,2),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Partner Documents
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_registry(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- 'business_license', 'tax_certificate', 'id_proof', 'bank_statement', 'property_deed'
  file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
  file_name VARCHAR(255),
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verified_at TIMESTAMP,
  verified_by UUID,
  notes TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Partner Inventory (for hotels)
CREATE TABLE IF NOT EXISTS partner_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_registry(id) ON DELETE CASCADE,
  property_id VARCHAR(100),
  room_type VARCHAR(100),
  date DATE NOT NULL,
  available_rooms INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  dynamic_price DECIMAL(10,2),
  min_stay_nights INTEGER DEFAULT 1,
  is_blackout BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, property_id, room_type, date)
);

-- Partner Bids (for dream marketplace)
CREATE TABLE IF NOT EXISTS partner_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_registry(id) ON DELETE CASCADE,
  user_dream_id UUID NOT NULL, -- References user dreams
  bid_type VARCHAR(50), -- 'hotel', 'flight', 'package', 'activity'
  
  -- Offer Details
  offer_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount_percent INTEGER,
  inclusions JSONB,
  conditions JSONB,
  valid_until TIMESTAMP NOT NULL,
  
  -- Status
  bid_status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'accepted', 'rejected', 'expired', 'withdrawn'
  bid_rank INTEGER, -- Calculated rank among all bids
  
  -- Occupancy Context
  is_off_season_offer BOOLEAN DEFAULT false,
  occupancy_period VARCHAR(50), -- Reference to low-occupancy period
  expected_occupancy_improvement DECIMAL(5,2),
  
  -- Audit
  submitted_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  auto_generated BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_provider_registry_active ON provider_registry(is_active, priority);
CREATE INDEX idx_provider_registry_type ON provider_registry(provider_type, is_active);
CREATE INDEX idx_provider_health_logs_provider ON provider_health_logs(provider_id, check_time DESC);
CREATE INDEX idx_partner_registry_status ON partner_registry(onboarding_status, is_active);
CREATE INDEX idx_partner_bids_dream ON partner_bids(user_dream_id, bid_status);
CREATE INDEX idx_partner_inventory_date ON partner_inventory(partner_id, date);

-- Row Level Security
ALTER TABLE provider_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_bids ENABLE ROW LEVEL SECURITY;

-- Admin-only access to provider registry
CREATE POLICY "Admin full access provider_registry" ON provider_registry
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Partners can view their own data
CREATE POLICY "Partners view own registry" ON partner_registry
  FOR SELECT USING (id = (auth.jwt() ->> 'partner_id')::UUID);

-- Partners can view their own bids
CREATE POLICY "Partners view own bids" ON partner_bids
  FOR SELECT USING (partner_id = (auth.jwt() ->> 'partner_id')::UUID);

-- Partners can insert their own bids
CREATE POLICY "Partners insert own bids" ON partner_bids
  FOR INSERT WITH CHECK (partner_id = (auth.jwt() ->> 'partner_id')::UUID);

COMMENT ON TABLE provider_registry IS 'Universal provider configuration for plugin architecture';
COMMENT ON TABLE partner_registry IS 'Hotels/airlines/activities joining Maku.Travel marketplace';
COMMENT ON TABLE partner_bids IS 'Competitive bids on user dreams for occupancy optimization';
