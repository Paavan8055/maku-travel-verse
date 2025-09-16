-- Add Duffel provider to provider_configs table
INSERT INTO public.provider_configs (
  id,
  name,
  type,
  enabled,
  priority,
  credentials_required,
  config
) VALUES (
  'duffel-flight',
  'Duffel Flight Search',
  'flight',
  true,
  2, -- Lower priority than Amadeus/Sabre initially
  jsonb_build_object(
    'DUFFEL_ACCESS_TOKEN', true,
    'DUFFEL_API_BASE', true
  ),
  jsonb_build_object(
    'baseUrl', 'https://api.duffel.com',
    'timeout', 30000,
    'retries', 3,
    'rateLimit', jsonb_build_object(
      'requestsPerSecond', 10,
      'requestsPerMinute', 600,
      'requestsPerHour', 36000
    ),
    'features', jsonb_build_array(
      'flight_search',
      'order_create',
      'order_cancel',
      'seat_maps',
      'baggage_allowance'
    ),
    'supportedMarkets', jsonb_build_array(
      'AU', 'US', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'CA'
    )
  )
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  credentials_required = EXCLUDED.credentials_required,
  config = EXCLUDED.config,
  updated_at = now();