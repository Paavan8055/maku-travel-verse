-- Clear existing cache to force fresh data loading
DELETE FROM admin_metrics_cache;

-- Add some test bookings for the dashboard to display (using allowed booking types only)
INSERT INTO bookings (
  id,
  booking_reference,
  booking_type,
  status,
  total_amount,
  currency,
  booking_data,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'hotel',
  'confirmed',
  299.99,
  'USD',
  '{"customerInfo": {"email": "test@example.com", "firstName": "John", "lastName": "Doe"}, "hotelName": "Grand Hotel Sydney", "checkInDate": "2025-01-15", "checkOutDate": "2025-01-18", "nights": 3}',
  NOW() - INTERVAL '2 hours'
),
(
  gen_random_uuid(),
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'flight',
  'confirmed',
  599.50,
  'USD',
  '{"customerInfo": {"email": "jane@example.com", "firstName": "Jane", "lastName": "Smith"}, "origin": "SYD", "destination": "LAX", "departureDate": "2025-02-01", "passengers": 1}',
  NOW() - INTERVAL '4 hours'
),
(
  gen_random_uuid(),
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'package',
  'confirmed',
  1149.75,
  'USD',
  '{"customerInfo": {"email": "bob@example.com", "firstName": "Bob", "lastName": "Wilson"}, "packageName": "Sydney Adventure Package", "date": "2024-12-20", "participants": 2, "includes": ["hotel", "activities", "transfers"]}',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'hotel',
  'pending',
  450.00,
  'USD',
  '{"customerInfo": {"email": "alice@example.com", "firstName": "Alice", "lastName": "Brown"}, "hotelName": "Luxury Resort Cairns", "checkInDate": "2025-03-10", "checkOutDate": "2025-03-15", "nights": 5}',
  NOW() - INTERVAL '30 minutes'
),
(
  gen_random_uuid(),
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'flight',
  'confirmed',
  1299.99,
  'USD',
  '{"customerInfo": {"email": "charlie@example.com", "firstName": "Charlie", "lastName": "Davis"}, "origin": "MEL", "destination": "NRT", "departureDate": "2025-04-15", "passengers": 2}',
  NOW() - INTERVAL '6 hours'
);

-- Add some partner properties for the active properties count (using valid partner_type)
INSERT INTO partner_properties (
  id,
  partner_id,
  property_name,
  property_type,
  status,
  description,
  location,
  created_at
) VALUES 
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Sydney Harbor Hotel',
  'hotel',
  'active',
  'Luxury hotel with harbor views',
  '{"city": "Sydney", "country": "Australia", "address": "123 Harbor St"}',
  NOW() - INTERVAL '30 days'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Melbourne CBD Apartments',
  'hotel',
  'active',
  'Modern serviced apartments in the city center',
  '{"city": "Melbourne", "country": "Australia", "address": "456 Collins St"}',
  NOW() - INTERVAL '15 days'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Brisbane Adventure Tours',
  'activity_provider',
  'active',
  'Guided adventure tours around Brisbane',
  '{"city": "Brisbane", "country": "Australia", "address": "789 Queen St"}',
  NOW() - INTERVAL '7 days'
);