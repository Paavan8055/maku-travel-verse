# Expedia Group API Integration Documentation

## Overview

The Expedia Group API integration provides comprehensive travel services including hotels, flights, car rentals, and activities through Expedia's extensive global network. This integration supports over 700,000 properties, global airline partnerships, 110+ car rental brands, and 170,000+ experiences worldwide.

## Authentication

All Expedia API endpoints use OAuth2 authentication with automatic token management. Credentials are securely stored in Supabase and retrieved on-demand.

## Base URL

```
Production: https://travel-dna.preview.emergentagent.com/api/expedia
Development: http://localhost:8001/api/expedia
```

---

## Endpoints

### 1. Setup Expedia Credentials

**POST** `/expedia/setup`

Configure and validate Expedia API credentials.

#### Request Body

```json
{
  "api_key": "your-expedia-api-key",
  "shared_secret": "your-expedia-shared-secret",
  "base_url": "https://api.expediagroup.com",
  "sandbox_url": "https://api.sandbox.expediagroup.com",
  "test_mode": true
}
```

#### Required Fields
- `api_key` (string): Your Expedia Partner Solutions API key
- `shared_secret` (string): Your Expedia Partner Solutions shared secret

#### Optional Fields
- `base_url` (string): Production API URL (default: "https://api.expediagroup.com")
- `sandbox_url` (string): Sandbox API URL (default: "https://api.sandbox.expediagroup.com")
- `test_mode` (boolean): Whether to use sandbox environment (default: true)

#### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Expedia credentials configured and validated successfully",
  "provider": "expedia",
  "test_mode": true
}
```

**Error (400/500)**
```json
{
  "success": false,
  "error": "Missing required field: api_key"
}
```

---

### 2. Health Check

**GET** `/expedia/health`

Check Expedia API health and authentication status.

#### Response

**Success (200)**
```json
{
  "provider": "expedia",
  "status": "healthy",
  "authenticated": true,
  "test_mode": true,
  "base_url": "https://api.sandbox.expediagroup.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error (500)**
```json
{
  "provider": "expedia",
  "status": "unhealthy",
  "error": "Authentication failed: Invalid credentials",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. Hotel Search

**POST** `/expedia/hotels/search`

Search for hotel availability and rates using Expedia's EPS Rapid API.

#### Request Body

```json
{
  "checkin": "2024-03-15",
  "checkout": "2024-03-17",
  "occupancy": [
    {
      "adults": 2,
      "children": 1
    }
  ],
  "property_ids": ["123456", "789012"],
  "region_id": "6054439",
  "include": ["property_ids", "room_types", "rate_plans"]
}
```

#### Required Fields
- `checkin` (string): Check-in date in YYYY-MM-DD format
- `checkout` (string): Check-out date in YYYY-MM-DD format
- `occupancy` (array): Room occupancy details

#### Optional Fields
- `property_ids` (array): Specific property IDs to search
- `region_id` (string): Geographic region identifier
- `include` (array): Data to include in response

#### Response

**Success (200)**
```json
{
  "provider": "expedia",
  "properties": [
    {
      "property_id": "123456",
      "name": "Grand Hotel Example",
      "address": {
        "line1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "US"
      },
      "star_rating": 4,
      "guest_rating": 4.5,
      "images": [
        {
          "url": "https://example.com/image1.jpg",
          "caption": "Hotel exterior"
        }
      ],
      "rooms": [
        {
          "room_id": "room_1",
          "room_type": "Standard King",
          "rates": [
            {
              "rate_id": "rate_1",
              "total_price": 150.00,
              "currency": "USD",
              "refundable": true,
              "breakfast_included": false
            }
          ]
        }
      ]
    }
  ],
  "search_id": "search_12345",
  "total_results": 1
}
```

---

### 4. Flight Search

**POST** `/expedia/flights/search`

Search for flight options with flexible itinerary support.

#### Request Body

```json
{
  "origin": "LAX",
  "destination": "JFK",
  "departure_date": "2024-03-15",
  "return_date": "2024-03-22",
  "passengers": {
    "adults": 1,
    "children": 0,
    "infants": 0
  },
  "cabin_class": "economy"
}
```

#### Required Fields
- `origin` (string): Origin airport IATA code
- `destination` (string): Destination airport IATA code
- `departure_date` (string): Departure date in YYYY-MM-DD format

#### Optional Fields
- `return_date` (string): Return date for round-trip flights
- `passengers` (object): Passenger count details
- `cabin_class` (string): Preferred cabin class (economy, premium, business, first)

#### Response

**Success (200)**
```json
{
  "provider": "expedia",
  "offers": [
    {
      "offer_id": "flight_12345",
      "total_price": 599.00,
      "currency": "USD",
      "segments": [
        {
          "flight_number": "AA123",
          "airline_code": "AA",
          "airline_name": "American Airlines",
          "origin": "LAX",
          "destination": "JFK",
          "departure_time": "2024-03-15T08:00:00Z",
          "arrival_time": "2024-03-15T16:30:00Z",
          "duration": "5h 30m",
          "aircraft_type": "Boeing 737"
        }
      ],
      "baggage_allowance": {
        "carry_on": "1 piece",
        "checked": "1 piece up to 50lbs"
      },
      "refundable": false,
      "changeable": true
    }
  ],
  "total_results": 1
}
```

---

### 5. Car Rental Search

**POST** `/expedia/cars/search`

Search for car rental options from 110+ brands across 190+ countries.

#### Request Body

```json
{
  "pickup_location": "LAX",
  "pickup_date": "2024-03-15T10:00:00Z",
  "dropoff_location": "LAX",
  "dropoff_date": "2024-03-22T10:00:00Z",
  "driver_age": 25
}
```

#### Required Fields
- `pickup_location` (string): Pickup location code
- `pickup_date` (string): Pickup date/time in ISO format
- `driver_age` (number): Primary driver age

#### Optional Fields
- `dropoff_location` (string): Dropoff location (defaults to pickup location)
- `dropoff_date` (string): Dropoff date/time (defaults to pickup + 1 day)

#### Response

**Success (200)**
```json
{
  "provider": "expedia",
  "offers": [
    {
      "offer_id": "car_12345",
      "vehicle": {
        "category": "Economy",
        "type": "Compact Car",
        "make_model": "Toyota Corolla or similar",
        "passenger_capacity": 5,
        "luggage_capacity": 2,
        "transmission": "automatic",
        "air_conditioning": true,
        "image_url": "https://example.com/car.jpg"
      },
      "vendor": {
        "name": "Enterprise",
        "logo": "https://example.com/logo.png"
      },
      "rate": {
        "base_rate": 45.00,
        "total_rate": 52.50,
        "currency": "USD",
        "rate_type": "daily",
        "taxes_and_fees": 7.50,
        "cancellable": true
      },
      "pickup_location": {
        "name": "LAX Airport",
        "address": "1 World Way, Los Angeles, CA 90045"
      }
    }
  ],
  "total_results": 1
}
```

---

### 6. Activities Search

**POST** `/expedia/activities/search`

Search activities and experiences from 170,000+ bookable options worldwide.

#### Request Body

```json
{
  "destination": "New York",
  "start_date": "2024-03-15",
  "end_date": "2024-03-17",
  "adults": 2,
  "children": 0,
  "category": "tours"
}
```

#### Required Fields
- `destination` (string): Destination city or region
- `start_date` (string): Activity start date in YYYY-MM-DD format

#### Optional Fields
- `end_date` (string): Activity end date (defaults to start_date)
- `adults` (number): Number of adult participants (default: 1)
- `children` (number): Number of child participants (default: 0)
- `category` (string): Activity category filter

#### Response

**Success (200)**
```json
{
  "provider": "expedia",
  "activities": [
    {
      "activity_id": "activity_12345",
      "name": "Statue of Liberty & Ellis Island Tour",
      "category": "tours",
      "subcategory": "historical",
      "description": "Visit two of New York's most iconic landmarks...",
      "duration": "4 hours",
      "rating": {
        "overall": 4.8,
        "total_reviews": 1234
      },
      "images": [
        {
          "url": "https://example.com/activity.jpg",
          "caption": "Statue of Liberty view"
        }
      ],
      "pricing": {
        "adult_price": 35.00,
        "child_price": 25.00,
        "currency": "USD"
      },
      "availability": {
        "available_dates": ["2024-03-15", "2024-03-16"],
        "time_slots": ["09:00", "13:00"]
      },
      "meeting_point": {
        "name": "Battery Park",
        "address": "Battery Park, New York, NY 10004"
      },
      "included": ["Ferry tickets", "Audio guide", "Entry fees"],
      "excluded": ["Hotel pickup", "Meals"]
    }
  ],
  "total_results": 1
}
```

---

### 7. Hotel Booking

**POST** `/expedia/hotels/book`

Create a hotel booking with price verification and confirmation.

#### Request Body

```json
{
  "property_id": "123456",
  "room_id": "room_1",
  "rate_id": "rate_1",
  "guest_details": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890"
  },
  "payment_details": {
    "card_number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2025",
    "cvv": "123",
    "cardholder_name": "John Doe",
    "billing_address": {
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"
    }
  },
  "special_requests": "Late check-in requested"
}
```

#### Required Fields
- `property_id` (string): Hotel property identifier
- `room_id` (string): Room type identifier
- `rate_id` (string): Rate plan identifier
- `guest_details` (object): Primary guest information
- `payment_details` (object): Payment and billing information

#### Response

**Success (200)**
```json
{
  "booking_id": "booking_12345",
  "confirmation_code": "ABC123XYZ",
  "status": "confirmed",
  "total_price": 150.00,
  "currency": "USD",
  "property_name": "Grand Hotel Example",
  "checkin_date": "2024-03-15",
  "checkout_date": "2024-03-17",
  "guest_name": "John Doe",
  "booking_date": "2024-01-15T10:30:00.000Z"
}
```

**Error (400)**
```json
{
  "error": "Selected rate is no longer available",
  "booking_id": null
}
```

---

## Error Handling

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters or missing required fields |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Access denied or rate limit exceeded |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |
| 503 | Service Unavailable - Expedia API temporarily unavailable |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "checkin",
      "issue": "Date must be in YYYY-MM-DD format"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/expedia/hotels/search"
  }
}
```

---

## Rate Limits

- **Search Operations**: 100 requests per minute
- **Booking Operations**: 10 requests per minute
- **Health Checks**: 200 requests per minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Reset time for current window

---

## Testing

### Using Sandbox Environment

Set `test_mode: true` in the setup configuration to use Expedia's sandbox environment for testing. Sandbox provides:

- Test properties and inventory
- Simulated booking flows
- Safe payment processing
- Accelerated testing scenarios

### Sample Test Data

**Test Property IDs:**
- `test_property_1`: Standard hotel for testing
- `test_property_2`: Resort with multiple room types
- `test_property_3`: Boutique hotel with limited availability

**Test Flight Routes:**
- LAX → JFK: Transcontinental flights
- DFW → ORD: Domestic connections
- SFO → LHR: International routes

---

## Support

For technical support or API issues:

1. **Documentation**: Review this API documentation
2. **Health Check**: Use `/expedia/health` endpoint to verify service status
3. **Error Logs**: Check application logs for detailed error information
4. **Expedia Partner Support**: Contact Expedia Partner Solutions for API-specific issues

---

## Changelog

### Version 1.0.0 (Current)
- Initial implementation of Expedia Group API integration
- Support for hotels, flights, cars, and activities
- OAuth2 authentication with automatic token management
- Comprehensive error handling and rate limiting
- Supabase-based credential management

---

*Last updated: January 15, 2024*