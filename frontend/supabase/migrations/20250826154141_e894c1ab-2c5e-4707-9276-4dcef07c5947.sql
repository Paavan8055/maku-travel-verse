-- Clear existing cache to force fresh data loading
DELETE FROM admin_metrics_cache;

-- Add some test bookings for the dashboard to display (using allowed booking types only)
INSERT INTO bookings (
  booking_reference,
  booking_type,
  status,
  total_amount,
  currency,
  booking_data,
  created_at
) VALUES 
(
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'hotel',
  'confirmed',
  299.99,
  'USD',
  '{"customerInfo": {"email": "test@example.com", "firstName": "John", "lastName": "Doe"}, "hotelName": "Grand Hotel Sydney", "checkInDate": "2025-01-15", "checkOutDate": "2025-01-18", "nights": 3}',
  NOW() - INTERVAL '2 hours'
),
(
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'flight',
  'confirmed',
  599.50,
  'USD',
  '{"customerInfo": {"email": "jane@example.com", "firstName": "Jane", "lastName": "Smith"}, "origin": "SYD", "destination": "LAX", "departureDate": "2025-02-01", "passengers": 1}',
  NOW() - INTERVAL '4 hours'
),
(
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'package',
  'confirmed',
  1149.75,
  'USD',
  '{"customerInfo": {"email": "bob@example.com", "firstName": "Bob", "lastName": "Wilson"}, "packageName": "Sydney Adventure Package", "date": "2024-12-20", "participants": 2, "includes": ["hotel", "activities", "transfers"]}',
  NOW() - INTERVAL '1 day'
),
(
  'BK' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8)),
  'hotel',
  'pending',
  450.00,
  'USD',
  '{"customerInfo": {"email": "alice@example.com", "firstName": "Alice", "lastName": "Brown"}, "hotelName": "Luxury Resort Cairns", "checkInDate": "2025-03-10", "checkOutDate": "2025-03-15", "nights": 5}',
  NOW() - INTERVAL '30 minutes'
);