-- Update provider priorities to make Sabre primary for hotels
UPDATE public.provider_configs 
SET priority = CASE 
  WHEN id = 'sabre-hotel' THEN 1
  WHEN id = 'hotelbeds-hotel' THEN 2
  WHEN id = 'amadeus-hotel' THEN 3
  ELSE priority
END
WHERE type = 'hotel' AND id IN ('sabre-hotel', 'hotelbeds-hotel', 'amadeus-hotel');