-- Update provider priorities to make HotelBeds primary for hotels
UPDATE provider_configs 
SET priority = 1, updated_at = NOW() 
WHERE id = 'hotelbeds-hotel' AND type = 'hotel';

UPDATE provider_configs 
SET priority = 2, updated_at = NOW() 
WHERE id = 'sabre-hotel' AND type = 'hotel';

UPDATE provider_configs 
SET priority = 3, updated_at = NOW() 
WHERE id = 'amadeus-hotel' AND type = 'hotel';