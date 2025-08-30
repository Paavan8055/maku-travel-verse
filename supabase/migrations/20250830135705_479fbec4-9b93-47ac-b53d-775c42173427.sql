-- Update provider priorities based on working API analysis
-- Amadeus Flight is currently the only working API, so it gets highest priority

-- FLIGHTS: Amadeus working, Sabre as backup
UPDATE provider_configs 
SET priority = 1 
WHERE id = 'amadeus-flight';

UPDATE provider_configs 
SET priority = 2 
WHERE id = 'sabre-flight';

-- HOTELS: Set priorities for when APIs are fixed (none currently working)
UPDATE provider_configs 
SET priority = 1 
WHERE id = 'sabre-hotel';

UPDATE provider_configs 
SET priority = 2 
WHERE id = 'amadeus-hotel';

UPDATE provider_configs 
SET priority = 3 
WHERE id = 'hotelbeds-hotel';

-- ACTIVITIES: Set priorities for when APIs are fixed (none currently working)
UPDATE provider_configs 
SET priority = 1 
WHERE id = 'hotelbeds-activity';

UPDATE provider_configs 
SET priority = 2 
WHERE id = 'amadeus-activity';