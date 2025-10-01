-- Enhanced Provider Configuration Migration
-- Adds new providers: Expedia (flights/hotels), Nuitée (hotels), GetYourGuide (activities)
-- Updates existing provider configurations with new IDs and enhanced metadata

-- Insert new enhanced provider configurations
INSERT INTO public.provider_configs (id, name, type, priority, enabled, config_data, environment) VALUES

-- Expedia Flights Provider
('expedia-flights-001', 'Expedia Flights', 'flight', 1, true, '{
  "provider_id": "expedia_flights",
  "provider_name": "Expedia Flights", 
  "provider_type": "flight",
  "base_url": "https://api.expediagroup.com",
  "api_version": "v3",
  "supports": ["flights", "multi_city", "roundtrip", "oneway"],
  "features": {
    "real_time_pricing": true,
    "seat_selection": true,
    "baggage_options": true,
    "cancellation": true,
    "airline_partnerships": "700+"
  },
  "authentication": {
    "type": "oauth2",
    "token_endpoint": "/v3/oauth2/access-token",
    "grant_type": "client_credentials"
  },
  "rate_limits": {
    "requests_per_minute": 100,
    "burst_limit": 150
  },
  "endpoints": {
    "search": "/v3/flights/search",
    "pricing": "/v3/flights/pricing",
    "booking": "/v3/flights/booking"
  },
  "demo_mode": true,
  "credentials_required": ["EXPEDIA_API_KEY", "EXPEDIA_API_SECRET"]
}', 'development'),

-- Expedia Hotels Provider  
('expedia-hotels-001', 'Expedia Hotels', 'hotel', 1, true, '{
  "provider_id": "expedia_hotels",
  "provider_name": "Expedia Hotels",
  "provider_type": "hotel", 
  "base_url": "https://api.expediagroup.com",
  "api_version": "v3",
  "supports": ["hotels", "resorts", "apartments", "vacation_rentals"],
  "features": {
    "real_time_availability": true,
    "instant_booking": true,
    "free_cancellation": true,
    "property_photos": true,
    "reviews": true,
    "property_count": "700000+"
  },
  "authentication": {
    "type": "oauth2", 
    "token_endpoint": "/v3/oauth2/access-token",
    "grant_type": "client_credentials"
  },
  "rate_limits": {
    "requests_per_minute": 100,
    "burst_limit": 150
  },
  "endpoints": {
    "search": "/v3/properties/search",
    "details": "/v3/properties/details",
    "booking": "/v3/properties/booking"
  },
  "demo_mode": true,
  "credentials_required": ["EXPEDIA_API_KEY", "EXPEDIA_API_SECRET"]
}', 'development'),

-- Nuitée Hotels Provider
('nuitee-hotels-001', 'Nuitée Hotels', 'hotel', 2, true, '{
  "provider_id": "nuitee_hotels",
  "provider_name": "Nuitée Hotels",
  "provider_type": "hotel",
  "base_url": "https://api.nuitee.com", 
  "api_version": "v1",
  "supports": ["boutique_hotels", "luxury_hotels", "unique_stays"],
  "features": {
    "curated_selection": true,
    "premium_properties": true,
    "concierge_service": true,
    "flexible_booking": true,
    "property_count": "50000+"
  },
  "authentication": {
    "type": "api_key",
    "header": "X-API-Key"
  },
  "rate_limits": {
    "requests_per_minute": 50,
    "burst_limit": 75
  },
  "endpoints": {
    "search": "/api/v1/search",
    "availability": "/api/v1/availability", 
    "booking": "/api/v1/booking"
  },
  "demo_mode": true,
  "credentials_required": ["NUITEE_API_KEY"]
}', 'development'),

-- GetYourGuide Activities Provider
('getyourguide-activities-001', 'GetYourGuide Activities', 'activity', 1, true, '{
  "provider_id": "getyourguide_activities",
  "provider_name": "GetYourGuide Activities",
  "provider_type": "activity",
  "base_url": "https://api.getyourguide.com",
  "api_version": "v1", 
  "supports": ["tours", "activities", "experiences", "attractions"],
  "features": {
    "instant_confirmation": true,
    "mobile_tickets": true,
    "expert_guides": true,
    "small_groups": true,
    "activity_count": "200000+"
  },
  "authentication": {
    "type": "bearer_token",
    "header": "Authorization"
  },
  "rate_limits": {
    "requests_per_minute": 75,
    "burst_limit": 100
  },
  "endpoints": {
    "search": "/activities/v1/search",
    "details": "/activities/v1/details",
    "booking": "/activities/v1/booking"
  },
  "demo_mode": true,
  "credentials_required": ["GETYOURGUIDE_API_KEY"]
}', 'development'),

-- Enhanced Amadeus Configuration (Updated)
('amadeus-enhanced-001', 'Amadeus Enhanced', 'multi', 1, true, '{
  "provider_id": "amadeus",
  "provider_name": "Amadeus",
  "provider_type": "multi",
  "base_url": "https://api.amadeus.com", 
  "api_version": "v2",
  "supports": ["flights", "hotels", "activities", "cars", "transfers"],
  "features": {
    "global_coverage": true,
    "real_time_data": true,
    "airline_content": true,
    "hotel_content": true,
    "comprehensive_search": true
  },
  "authentication": {
    "type": "oauth2",
    "token_endpoint": "/v1/security/oauth2/token"
  },
  "rate_limits": {
    "requests_per_minute": 200,
    "burst_limit": 300
  },
  "endpoints": {
    "flights_search": "/v2/shopping/flight-offers",
    "hotels_search": "/v3/shopping/hotel-offers",
    "activities_search": "/v1/shopping/activities"
  },
  "demo_mode": false,
  "credentials_required": ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"]
}', 'development')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  priority = EXCLUDED.priority,
  enabled = EXCLUDED.enabled,
  config_data = EXCLUDED.config_data,
  updated_at = now();

-- Update environment secrets for new providers
INSERT INTO public.environment (environment, key, value, is_secret, description) VALUES

-- Development Environment - New Provider Keys
('development', 'EXPEDIA_API_KEY', 'dev-expedia-api-key-placeholder', true, 'Expedia API Key for development'),
('development', 'EXPEDIA_API_SECRET', 'dev-expedia-secret-placeholder', true, 'Expedia API Secret for development'),
('development', 'NUITEE_API_KEY', 'dev-nuitee-api-key-placeholder', true, 'Nuitée API Key for development'),
('development', 'NUITEE_API_SECRET', 'dev-nuitee-secret-placeholder', true, 'Nuitée API Secret for development'),
('development', 'GETYOURGUIDE_API_KEY', 'dev-getyourguide-api-key-placeholder', true, 'GetYourGuide API Key for development'),
('development', 'GETYOURGUIDE_API_SECRET', 'dev-getyourguide-secret-placeholder', true, 'GetYourGuide API Secret for development'),

-- Staging Environment - New Provider Keys
('staging', 'EXPEDIA_API_KEY', 'staging-expedia-api-key', true, 'Expedia API Key for staging'),
('staging', 'EXPEDIA_API_SECRET', 'staging-expedia-secret', true, 'Expedia API Secret for staging'),
('staging', 'NUITEE_API_KEY', 'staging-nuitee-api-key', true, 'Nuitée API Key for staging'),
('staging', 'NUITEE_API_SECRET', 'staging-nuitee-secret', true, 'Nuitée API Secret for staging'),
('staging', 'GETYOURGUIDE_API_KEY', 'staging-getyourguide-api-key', true, 'GetYourGuide API Key for staging'),
('staging', 'GETYOURGUIDE_API_SECRET', 'staging-getyourguide-secret', true, 'GetYourGuide API Secret for staging'),

-- Production Environment - New Provider Keys
('production', 'EXPEDIA_API_KEY', 'prod-expedia-api-key', true, 'Expedia API Key for production'),
('production', 'EXPEDIA_API_SECRET', 'prod-expedia-secret', true, 'Expedia API Secret for production'),
('production', 'NUITEE_API_KEY', 'prod-nuitee-api-key', true, 'Nuitée API Key for production'),
('production', 'NUITEE_API_SECRET', 'prod-nuitee-secret', true, 'Nuitée API Secret for production'),
('production', 'GETYOURGUIDE_API_KEY', 'prod-getyourguide-api-key', true, 'GetYourGuide API Key for production'),
('production', 'GETYOURGUIDE_API_SECRET', 'prod-getyourguide-secret', true, 'GetYourGuide API Secret for production')

ON CONFLICT (environment, key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Add new provider base URLs to environment_configs
INSERT INTO public.environment_configs (environment, config_key, config_value, is_active) VALUES

-- Development Environment URLs
('development', 'expedia_base_url', '"https://api.sandbox.expediagroup.com"', true),
('development', 'nuitee_base_url', '"https://api.test.nuitee.com"', true),
('development', 'getyourguide_base_url', '"https://api.sandbox.getyourguide.com"', true),

-- Staging Environment URLs
('staging', 'expedia_base_url', '"https://api.sandbox.expediagroup.com"', true),
('staging', 'nuitee_base_url', '"https://api.staging.nuitee.com"', true),
('staging', 'getyourguide_base_url', '"https://api.sandbox.getyourguide.com"', true),

-- Production Environment URLs
('production', 'expedia_base_url', '"https://api.expediagroup.com"', true),
('production', 'nuitee_base_url', '"https://api.nuitee.com"', true),
('production', 'getyourguide_base_url', '"https://api.getyourguide.com"', true)

ON CONFLICT (environment, config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create provider performance tracking table
CREATE TABLE IF NOT EXISTS public.provider_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- flight, hotel, activity
  search_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms DECIMAL(10,2) DEFAULT 0,
  last_successful_search TIMESTAMPTZ,
  last_error TIMESTAMPTZ,
  date_recorded DATE DEFAULT CURRENT_DATE,
  environment TEXT DEFAULT 'production',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_type, date_recorded, environment)
);

-- Enable RLS
ALTER TABLE public.provider_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for provider performance
CREATE POLICY "Service role can manage provider performance" 
ON public.provider_performance 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can read provider performance" 
ON public.provider_performance 
FOR SELECT 
USING (is_secure_admin(auth.uid()));

-- Create indexes for performance tracking
CREATE INDEX idx_provider_performance_provider_service ON public.provider_performance (provider_id, service_type);
CREATE INDEX idx_provider_performance_date ON public.provider_performance (date_recorded DESC);
CREATE INDEX idx_provider_performance_environment ON public.provider_performance (environment);

-- Create updated_at trigger for provider_performance
CREATE TRIGGER provider_performance_updated_at_trigger
  BEFORE UPDATE ON public.provider_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_environment_updated_at();