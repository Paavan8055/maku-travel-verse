-- Add Duffel provider to provider_configs table
INSERT INTO public.provider_configs (
  id,
  name,
  type,
  enabled,
  priority,
  base_url
) VALUES (
  'duffel-flight',
  'Duffel Flight Search',
  'flight',
  true,
  2, -- Lower priority than Amadeus/Sabre initially
  'https://api.duffel.com'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  base_url = EXCLUDED.base_url,
  updated_at = now();