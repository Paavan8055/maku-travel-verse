-- Add missing columns to hotel_addons table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_addons' AND column_name = 'per_person') THEN
        ALTER TABLE public.hotel_addons ADD COLUMN per_person boolean NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_addons' AND column_name = 'category') THEN
        ALTER TABLE public.hotel_addons ADD COLUMN category text NOT NULL DEFAULT 'general';
    END IF;
END $$;

-- Insert sample hotel addons for testing
INSERT INTO public.hotel_addons (hotel_id, code, name, description, price_cents, currency, category, per_person, active) VALUES
('SYDMGB', 'WIFI_PREMIUM', 'Premium WiFi', 'High-speed internet access', 1500, 'AUD', 'connectivity', false, true),
('SYDMGB', 'PARKING', 'Valet Parking', 'Secure valet parking service', 3500, 'AUD', 'parking', false, true),
('SYDMGB', 'BREAKFAST', 'Continental Breakfast', 'Daily breakfast buffet', 2500, 'AUD', 'dining', true, true),
('SYDMGB', 'SPA_ACCESS', 'Spa Access', 'Access to hotel spa facilities', 5000, 'AUD', 'wellness', true, true),
('SYDMGB', 'LATE_CHECKOUT', 'Late Checkout', 'Check out up to 2pm', 5000, 'AUD', 'convenience', false, true)
ON CONFLICT (hotel_id, code) DO NOTHING;

-- Update the existing RLS policy to allow authenticated users to view addons
DROP POLICY IF EXISTS "Anyone can view active hotel addons" ON public.hotel_addons;
CREATE POLICY "Authenticated users can view active hotel addons" ON public.hotel_addons
FOR SELECT USING (auth.uid() IS NOT NULL AND active = true);