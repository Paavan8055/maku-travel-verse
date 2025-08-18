-- Clean all Amadeus cache data for fresh search results
DELETE FROM hotel_offers_cache;
DELETE FROM flight_offers_cache; 
DELETE FROM activities_offers_cache;
DELETE FROM transfers_offers_cache;