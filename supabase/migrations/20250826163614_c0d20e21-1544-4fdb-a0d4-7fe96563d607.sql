-- Reset provider configurations to proper defaults and fix booking pipeline

-- First, reset provider priorities to normal values
UPDATE provider_configs SET 
    priority = CASE 
        WHEN id = 'amadeus-flight' THEN 1
        WHEN id = 'sabre-flight' THEN 2
        WHEN id = 'amadeus-hotel' THEN 1
        WHEN id = 'sabre-hotel' THEN 2
        WHEN id = 'hotelbeds-hotel' THEN 3
        WHEN id = 'amadeus-activity' THEN 1
        WHEN id = 'hotelbeds-activity' THEN 2
        ELSE priority
    END,
    health_score = 100,
    circuit_breaker_state = 'closed',
    circuit_breaker = jsonb_build_object(
        'state', 'closed',
        'failureCount', 0,
        'lastFailure', null,
        'timeout', 30000
    ),
    response_time = 0,
    updated_at = NOW()
WHERE id IN ('amadeus-flight', 'sabre-flight', 'amadeus-hotel', 'sabre-hotel', 'hotelbeds-hotel', 'amadeus-activity', 'hotelbeds-activity');

-- Clear all fake quota data and provider health data
DELETE FROM provider_quotas WHERE created_at > '2025-08-26 00:00:00';
DELETE FROM provider_health WHERE created_at > '2025-08-26 00:00:00';

-- Add environment configuration table if not exists
CREATE TABLE IF NOT EXISTS public.api_configuration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    environment TEXT NOT NULL DEFAULT 'test',
    provider TEXT NOT NULL,
    config_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(environment, provider)
);

-- Insert default configurations
INSERT INTO public.api_configuration (environment, provider, config_data) VALUES
('test', 'amadeus', jsonb_build_object(
    'baseUrl', 'https://test.api.amadeus.com',
    'tokenUrl', 'https://test.api.amadeus.com/v1/security/oauth2/token'
)),
('production', 'amadeus', jsonb_build_object(
    'baseUrl', 'https://api.amadeus.com',
    'tokenUrl', 'https://api.amadeus.com/v1/security/oauth2/token'
)),
('test', 'sabre', jsonb_build_object(
    'baseUrl', 'https://api-crt.cert.havail.sabre.com',
    'tokenUrl', 'https://api-crt.cert.havail.sabre.com/v2/auth/token'
)),
('production', 'sabre', jsonb_build_object(
    'baseUrl', 'https://api.sabre.com',
    'tokenUrl', 'https://api.sabre.com/v2/auth/token'
)),
('test', 'hotelbeds', jsonb_build_object(
    'hotelBaseUrl', 'https://api.test.hotelbeds.com',
    'activityBaseUrl', 'https://api.test.hotelbeds.com'
)),
('production', 'hotelbeds', jsonb_build_object(
    'hotelBaseUrl', 'https://api.hotelbeds.com',
    'activityBaseUrl', 'https://api.hotelbeds.com'
))
ON CONFLICT (environment, provider) DO UPDATE SET
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

-- Enable RLS on api_configuration
ALTER TABLE public.api_configuration ENABLE ROW LEVEL SECURITY;

-- Create policy for api_configuration
CREATE POLICY "Admins can manage API configuration" ON public.api_configuration
    FOR ALL USING (is_secure_admin(auth.uid()));

-- Create updated_at trigger for api_configuration
CREATE OR REPLACE FUNCTION update_api_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_configuration_updated_at
    BEFORE UPDATE ON public.api_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_api_configuration_updated_at();