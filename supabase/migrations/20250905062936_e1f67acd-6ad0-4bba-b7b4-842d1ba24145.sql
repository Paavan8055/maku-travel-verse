-- Enable Amadeus providers using the correct names from the database
UPDATE provider_configs 
SET 
  enabled = true,
  priority = 1,
  updated_at = now()
WHERE name IN ('Amadeus', 'Amadeus Flight', 'Amadeus Hotels');

-- Ensure other providers remain disabled  
UPDATE provider_configs 
SET 
  enabled = false,
  priority = 999,
  updated_at = now()
WHERE name IN ('Sabre Flight', 'Sabre Hotel', 'HotelBeds Hotel', 'HotelBeds Activity');