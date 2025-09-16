-- Enforce core provider IDs and schedule cleanup

-- 1. Prevent inserts of unknown provider IDs
ALTER TABLE public.provider_configs
  ADD CONSTRAINT provider_configs_core_ids_check
    CHECK (id IN ('amadeus','sabre-flight','sabre-hotel','hotelbeds-hotel','hotelbeds-activity'));

-- 2. Schedule periodic cleanup of non-core providers
SELECT cron.schedule(
  'provider-config-cleanup',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://iomeddeasarntjhqzndu.supabase.co/functions/v1/provider-config-cleanup',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbWVkZGVhc2FybnRqaHF6bmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4OTQ2OSwiZXhwIjoyMDY5OTY1NDY5fQ.d6CdnpT5BkVJLjhVZvyQFCPEIFhH0xQWf6XNjQNjqJM"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Trigger to provide clear error message on invalid provider IDs
CREATE OR REPLACE FUNCTION public.check_core_provider_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id NOT IN ('amadeus','sabre-flight','sabre-hotel','hotelbeds-hotel','hotelbeds-activity') THEN
    RAISE EXCEPTION 'Unknown provider id: %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_core_provider_id ON public.provider_configs;
CREATE TRIGGER enforce_core_provider_id
  BEFORE INSERT ON public.provider_configs
  FOR EACH ROW EXECUTE FUNCTION public.check_core_provider_id();
