# Expedia Group API Integration Examples

This document provides practical examples of how to use the Expedia Group API integration endpoints.

## Setup and Configuration

### 1. Using the Setup Script

```bash
# Setup with test credentials (sandbox)
python setup_expedia.py --api-key YOUR_TEST_API_KEY --shared-secret YOUR_TEST_SECRET --test-mode

# Setup for production
python setup_expedia.py --api-key YOUR_PROD_API_KEY --shared-secret YOUR_PROD_SECRET --production

# Check current configuration
python setup_expedia.py --check-only --api-key dummy --shared-secret dummy
```

### 2. Manual Setup via API

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/setup \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your-expedia-api-key",
    "shared_secret": "your-expedia-shared-secret",
    "test_mode": true
  }'
```

## API Usage Examples

### 1. Health Check

```bash
curl -X GET https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/health
```

Response:
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

### 2. Hotel Search

#### Basic Hotel Search

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-03-15",
    "checkout": "2024-03-17",
    "occupancy": [
      {
        "adults": 2,
        "children": 0
      }
    ]
  }'
```

#### Advanced Hotel Search with Filters

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/hotels/search \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2024-03-15",
    "checkout": "2024-03-17",
    "occupancy": [
      {
        "adults": 2,
        "children": 1
      }
    ],
    "region_id": "6054439",
    "include": ["property_ids", "room_types", "rate_plans", "amenities"]
  }'
```

### 3. Flight Search

#### One-Way Flight

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LAX",
    "destination": "JFK",
    "departure_date": "2024-03-15",
    "passengers": {
      "adults": 1,
      "children": 0,
      "infants": 0
    },
    "cabin_class": "economy"
  }'
```

#### Round-Trip Flight

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LAX",
    "destination": "JFK",
    "departure_date": "2024-03-15",
    "return_date": "2024-03-22",
    "passengers": {
      "adults": 2,
      "children": 1,
      "infants": 0
    },
    "cabin_class": "premium"
  }'
```

### 4. Car Rental Search

#### Same Location Pickup/Dropoff

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/cars/search \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_location": "LAX",
    "pickup_date": "2024-03-15T10:00:00Z",
    "dropoff_date": "2024-03-22T10:00:00Z",
    "driver_age": 25
  }'
```

#### One-Way Car Rental

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/cars/search \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_location": "LAX",
    "pickup_date": "2024-03-15T10:00:00Z",
    "dropoff_location": "SFO",
    "dropoff_date": "2024-03-22T10:00:00Z",
    "driver_age": 30
  }'
```

### 5. Activities Search

#### Basic Activity Search

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/activities/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "New York",
    "start_date": "2024-03-15",
    "adults": 2
  }'
```

#### Filtered Activity Search

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/activities/search \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris",
    "start_date": "2024-03-15",
    "end_date": "2024-03-17",
    "adults": 2,
    "children": 1,
    "category": "tours"
  }'
```

### 6. Hotel Booking

```bash
curl -X POST https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/hotels/book \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## JavaScript/React Examples

### Using fetch API

```javascript
// Hotel search example
const searchHotels = async (searchParams) => {
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/expedia/hotels/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchParams)
  });
  
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    const error = await response.json();
    throw new Error(error.error || 'Search failed');
  }
};

// Usage
const hotelResults = await searchHotels({
  checkin: '2024-03-15',
  checkout: '2024-03-17',
  occupancy: [{ adults: 2, children: 0 }]
});
```

### React Hook Example

```jsx
import { useState, useEffect } from 'react';

const useExpediaSearch = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const searchHotels = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/expedia/hotels/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { searchHotels, loading, results, error };
};

// Component usage
const HotelSearch = () => {
  const { searchHotels, loading, results, error } = useExpediaSearch();
  
  const handleSearch = () => {
    searchHotels({
      checkin: '2024-03-15',
      checkout: '2024-03-17',
      occupancy: [{ adults: 2, children: 0 }]
    });
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search Hotels'}
      </button>
      {error && <p>Error: {error}</p>}
      {results && (
        <div>
          <h3>Found {results.total_results} hotels</h3>
          {results.properties.map(hotel => (
            <div key={hotel.property_id}>
              <h4>{hotel.name}</h4>
              <p>{hotel.address.city}, {hotel.address.state}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Python Examples

### Using httpx

```python
import httpx
import asyncio
from datetime import date, timedelta

async def search_expedia_hotels(checkin: date, checkout: date, adults: int = 2):
    """Search for hotels using Expedia API"""
    
    search_params = {
        "checkin": checkin.isoformat(),
        "checkout": checkout.isoformat(),
        "occupancy": [{"adults": adults, "children": 0}]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://travel-ai-platform-2.preview.emergentagent.com/api/expedia/hotels/search",
            json=search_params,
            timeout=30.0
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Search failed: {response.status_code} {response.text}")

# Usage
async def main():
    checkin = date.today() + timedelta(days=30)
    checkout = checkin + timedelta(days=2)
    
    results = await search_expedia_hotels(checkin, checkout)
    print(f"Found {results['total_results']} hotels")
    
    for hotel in results['properties']:
        print(f"- {hotel['name']}")

asyncio.run(main())
```

## Error Handling Examples

### JavaScript Error Handling

```javascript
const searchWithErrorHandling = async (params) => {
  try {
    const response = await fetch('/api/expedia/hotels/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 400:
          throw new Error(`Invalid request: ${errorData.error}`);
        case 401:
          throw new Error('Authentication failed - please check API credentials');
        case 429:
          throw new Error('Rate limit exceeded - please try again later');
        case 500:
          throw new Error('Service unavailable - please try again');
        default:
          throw new Error(`Unexpected error: ${errorData.error || 'Unknown error'}`);
      }
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Expedia search error:', error);
    throw error;
  }
};
```

### Python Error Handling

```python
import httpx
from typing import Dict, Any

class ExpediaAPIError(Exception):
    """Custom exception for Expedia API errors"""
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

async def safe_expedia_request(endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Make a safe request to Expedia API with proper error handling"""
    
    base_url = "https://travel-ai-platform-2.preview.emergentagent.com/api/expedia"
    url = f"{base_url}{endpoint}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 400:
                error_data = response.json()
                raise ExpediaAPIError(f"Invalid request: {error_data.get('error')}", 400)
            elif response.status_code == 401:
                raise ExpediaAPIError("Authentication failed", 401)
            elif response.status_code == 429:
                raise ExpediaAPIError("Rate limit exceeded", 429)
            elif response.status_code == 500:
                raise ExpediaAPIError("Service unavailable", 500)
            else:
                raise ExpediaAPIError(f"Unexpected error: {response.status_code}", response.status_code)
                
    except httpx.TimeoutException:
        raise ExpediaAPIError("Request timeout - service may be slow")
    except httpx.ConnectError:
        raise ExpediaAPIError("Unable to connect to Expedia service")
    except Exception as e:
        if isinstance(e, ExpediaAPIError):
            raise
        raise ExpediaAPIError(f"Unexpected error: {str(e)}")

# Usage with error handling
async def search_with_retry(params: Dict[str, Any], max_retries: int = 3):
    """Search with automatic retry on failures"""
    
    for attempt in range(max_retries):
        try:
            return await safe_expedia_request("/hotels/search", params)
        except ExpediaAPIError as e:
            if e.status_code == 429 and attempt < max_retries - 1:
                # Rate limited, wait and retry
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                continue
            elif attempt == max_retries - 1:
                # Last attempt, raise the error
                raise
            else:
                # Non-retryable error
                raise
```

## Testing Examples

### Unit Test Example

```python
import pytest
import httpx
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_hotel_search():
    """Test hotel search endpoint"""
    
    search_params = {
        "checkin": "2024-03-15",
        "checkout": "2024-03-17",
        "occupancy": [{"adults": 2, "children": 0}]
    }
    
    mock_response = {
        "provider": "expedia",
        "properties": [
            {
                "property_id": "123456",
                "name": "Test Hotel",
                "address": {"city": "Test City"}
            }
        ],
        "total_results": 1
    }
    
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = mock_response
        
        result = await search_expedia_hotels(
            date(2024, 3, 15), 
            date(2024, 3, 17)
        )
        
        assert result['provider'] == 'expedia'
        assert result['total_results'] == 1
        assert len(result['properties']) == 1
```

## Best Practices

### 1. Rate Limiting

```javascript
// Implement request queuing to respect rate limits
class ExpediaAPIClient {
  constructor() {
    this.requestQueue = [];
    this.processing = false;
    this.lastRequest = 0;
    this.minInterval = 100; // 100ms between requests
  }

  async makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, data, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }
      
      const { endpoint, data, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await this.actualRequest(endpoint, data);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      this.lastRequest = Date.now();
    }
    
    this.processing = false;
  }
}
```

### 2. Caching

```javascript
// Implement caching for search results
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const cachedRequest = async (endpoint, params) => {
  const cacheKey = getCacheKey(endpoint, params);
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await makeExpediaRequest(endpoint, params);
  searchCache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
};
```

### 3. Configuration Management

```python
# Use environment-based configuration
import os
from dataclasses import dataclass

@dataclass
class ExpediaConfig:
    base_url: str
    api_key: str
    shared_secret: str
    test_mode: bool
    timeout: int = 30
    max_retries: int = 3

def get_expedia_config() -> ExpediaConfig:
    """Get Expedia configuration from environment"""
    return ExpediaConfig(
        base_url=os.getenv('EXPEDIA_BASE_URL', 'https://travel-ai-platform-2.preview.emergentagent.com'),
        api_key=os.getenv('EXPEDIA_API_KEY', ''),
        shared_secret=os.getenv('EXPEDIA_SHARED_SECRET', ''),
        test_mode=os.getenv('EXPEDIA_TEST_MODE', 'true').lower() == 'true',
        timeout=int(os.getenv('EXPEDIA_TIMEOUT', '30')),
        max_retries=int(os.getenv('EXPEDIA_MAX_RETRIES', '3'))
    )
```

This comprehensive examples file provides practical guidance for integrating with the Expedia Group API across different programming languages and scenarios.