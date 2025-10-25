"""
Provider & Partner Marketplace API Backend Testing
Tests all endpoints for provider registry, partner management, inventory, and bidding
"""

import requests
import json
from datetime import datetime, date, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
BASE_URL = f"{BACKEND_URL}/api"

print(f"\n{'='*80}")
print(f"PROVIDER & PARTNER MARKETPLACE API TESTING")
print(f"Backend URL: {BACKEND_URL}")
print(f"{'='*80}\n")

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

def test_endpoint(name, method, endpoint, expected_status=200, data=None, params=None, check_fields=None):
    """Test an API endpoint and validate response"""
    test_results["total"] += 1
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, params=params, timeout=30)
        elif method == "PATCH":
            response = requests.patch(url, json=data, params=params, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        # Check status code
        status_match = response.status_code == expected_status
        
        # Parse response
        try:
            response_data = response.json()
        except:
            response_data = {"error": "Could not parse JSON response"}
        
        # Check required fields if specified
        fields_valid = True
        missing_fields = []
        if check_fields and status_match:
            for field in check_fields:
                if '.' in field:
                    # Nested field check
                    parts = field.split('.')
                    current = response_data
                    for part in parts:
                        if isinstance(current, dict) and part in current:
                            current = current[part]
                        else:
                            fields_valid = False
                            missing_fields.append(field)
                            break
                else:
                    if field not in response_data:
                        fields_valid = False
                        missing_fields.append(field)
        
        # Determine pass/fail
        passed = status_match and fields_valid
        
        if passed:
            test_results["passed"] += 1
            status_icon = "✅"
        else:
            test_results["failed"] += 1
            status_icon = "❌"
        
        # Log result
        print(f"{status_icon} {name}")
        print(f"   Method: {method} {endpoint}")
        print(f"   Status: {response.status_code} (expected {expected_status})")
        
        if not status_match:
            print(f"   ⚠️  Status code mismatch!")
        
        if missing_fields:
            print(f"   ⚠️  Missing fields: {', '.join(missing_fields)}")
        
        # Show key response data
        if isinstance(response_data, dict):
            if 'success' in response_data:
                print(f"   Success: {response_data['success']}")
            if 'count' in response_data:
                print(f"   Count: {response_data['count']}")
            if 'providers' in response_data and isinstance(response_data['providers'], list):
                print(f"   Providers returned: {len(response_data['providers'])}")
            if 'partners' in response_data and isinstance(response_data['partners'], list):
                print(f"   Partners returned: {len(response_data['partners'])}")
            if 'inventory' in response_data and isinstance(response_data['inventory'], list):
                print(f"   Inventory records: {len(response_data['inventory'])}")
            if 'bids' in response_data and isinstance(response_data['bids'], list):
                print(f"   Bids returned: {len(response_data['bids'])}")
            if 'detail' in response_data:
                print(f"   Detail: {response_data['detail'][:100]}")
        
        print()
        
        test_results["tests"].append({
            "name": name,
            "passed": passed,
            "status_code": response.status_code,
            "response_preview": str(response_data)[:200]
        })
        
        return response_data
        
    except requests.exceptions.Timeout:
        test_results["failed"] += 1
        print(f"❌ {name}")
        print(f"   Method: {method} {endpoint}")
        print(f"   Error: Request timeout after 30 seconds")
        print()
        test_results["tests"].append({
            "name": name,
            "passed": False,
            "error": "Timeout"
        })
        return None
        
    except Exception as e:
        test_results["failed"] += 1
        print(f"❌ {name}")
        print(f"   Method: {method} {endpoint}")
        print(f"   Error: {str(e)}")
        print()
        test_results["tests"].append({
            "name": name,
            "passed": False,
            "error": str(e)
        })
        return None

# ============================================================================
# PROVIDER REGISTRY TESTS
# ============================================================================

print("\n" + "="*80)
print("PROVIDER REGISTRY ENDPOINTS")
print("="*80 + "\n")

# Test 1: List all providers
print("Test 1: List All Providers")
providers_response = test_endpoint(
    "GET /api/providers/registry - List all providers",
    "GET",
    "/providers/registry",
    expected_status=200,
    check_fields=["success", "count", "providers"]
)

# Verify 6 providers exist
if providers_response and providers_response.get('count') == 6:
    print("   ✅ Verified: 6 providers exist (Sabre, HotelBeds, Amadeus, Viator, GetYourGuide, Expedia TAAP)")
else:
    print(f"   ⚠️  Expected 6 providers, got {providers_response.get('count') if providers_response else 'N/A'}")

# Check for required provider fields
if providers_response and providers_response.get('providers'):
    sample_provider = providers_response['providers'][0]
    required_fields = ['provider_name', 'display_name', 'provider_type', 'priority', 'is_active', 'eco_rating', 'fee_transparency_score']
    missing = [f for f in required_fields if f not in sample_provider]
    if missing:
        print(f"   ⚠️  Sample provider missing fields: {', '.join(missing)}")
    else:
        print(f"   ✅ Sample provider has all required fields")
        print(f"   Provider: {sample_provider.get('provider_name')} - {sample_provider.get('display_name')}")

print()

# Test 2: List active providers only
print("Test 2: List Active Providers")
active_providers_response = test_endpoint(
    "GET /api/providers/active - List only active providers",
    "GET",
    "/providers/active",
    expected_status=200,
    check_fields=["success", "count", "providers"]
)

if active_providers_response and active_providers_response.get('providers'):
    all_active = all(p.get('is_active') == True for p in active_providers_response['providers'])
    if all_active:
        print(f"   ✅ All returned providers are active")
    else:
        print(f"   ⚠️  Some providers are not active")

print()

# Test 3: Provider rotation for hotel service
print("Test 3: Provider Rotation - Hotel Service")
hotel_rotation_response = test_endpoint(
    "GET /api/providers/rotation/hotel - Get hotel provider rotation",
    "GET",
    "/providers/rotation/hotel",
    expected_status=200,
    check_fields=["success", "service_type", "provider_count", "rotation"]
)

if hotel_rotation_response:
    if hotel_rotation_response.get('service_type') == 'hotel':
        print(f"   ✅ Service type is 'hotel'")
    if hotel_rotation_response.get('rotation'):
        print(f"   ✅ Rotation order returned with {len(hotel_rotation_response['rotation'])} providers")
        # Check rotation order fields
        if hotel_rotation_response['rotation']:
            sample = hotel_rotation_response['rotation'][0]
            if 'rotation_order' in sample and 'rotation_score' in sample:
                print(f"   ✅ Rotation includes order and score")

print()

# Test 4: Provider rotation for flight service
print("Test 4: Provider Rotation - Flight Service")
flight_rotation_response = test_endpoint(
    "GET /api/providers/rotation/flight - Get flight provider rotation",
    "GET",
    "/providers/rotation/flight",
    expected_status=200,
    check_fields=["success", "service_type", "rotation"]
)

print()

# Test 5: Provider rotation for activity service
print("Test 5: Provider Rotation - Activity Service")
activity_rotation_response = test_endpoint(
    "GET /api/providers/rotation/activity - Get activity provider rotation",
    "GET",
    "/providers/rotation/activity",
    expected_status=200,
    check_fields=["success", "service_type", "rotation"]
)

print()

# ============================================================================
# PARTNER REGISTRY TESTS
# ============================================================================

print("\n" + "="*80)
print("PARTNER REGISTRY ENDPOINTS")
print("="*80 + "\n")

# Test 6: List all partners
print("Test 6: List All Partners")
partners_response = test_endpoint(
    "GET /api/partners/registry - List all partners",
    "GET",
    "/partners/registry",
    expected_status=200,
    check_fields=["success", "count", "partners"]
)

# Verify 1 partner exists (Paradise Resort & Spa)
if partners_response and partners_response.get('count') == 1:
    print("   ✅ Verified: 1 partner exists (Paradise Resort & Spa)")
    if partners_response.get('partners'):
        partner = partners_response['partners'][0]
        print(f"   Partner: {partner.get('business_name')}")
        print(f"   Type: {partner.get('partner_type')}")
        print(f"   Status: {partner.get('onboarding_status')}")
        print(f"   Active: {partner.get('is_active')}")
        print(f"   Total Rooms: {partner.get('total_rooms')}")
        
        # Save partner_id for later tests
        partner_id = partner.get('id')
else:
    print(f"   ⚠️  Expected 1 partner, got {partners_response.get('count') if partners_response else 'N/A'}")
    partner_id = None

print()

# Test 7: Get specific partner details
if partner_id:
    print("Test 7: Get Partner Details")
    partner_detail_response = test_endpoint(
        f"GET /api/partners/{partner_id} - Get specific partner",
        "GET",
        f"/partners/{partner_id}",
        expected_status=200,
        check_fields=["success", "partner", "inventory_records", "active_bids"]
    )
    
    if partner_detail_response:
        print(f"   Inventory Records: {partner_detail_response.get('inventory_records')}")
        print(f"   Active Bids: {partner_detail_response.get('active_bids')}")
    
    print()
else:
    print("⚠️  Skipping partner detail test - no partner_id available\n")

# ============================================================================
# PARTNER INVENTORY TESTS
# ============================================================================

print("\n" + "="*80)
print("PARTNER INVENTORY ENDPOINTS")
print("="*80 + "\n")

if partner_id:
    # Test 8: Get all inventory
    print("Test 8: Get Partner Inventory - All Records")
    inventory_response = test_endpoint(
        f"GET /api/partners/{partner_id}/inventory - Get all inventory",
        "GET",
        f"/partners/{partner_id}/inventory",
        expected_status=200,
        check_fields=["success", "count", "inventory", "summary"]
    )
    
    # Verify 90 records
    if inventory_response and inventory_response.get('count') == 90:
        print("   ✅ Verified: 90 inventory records exist")
    else:
        print(f"   ⚠️  Expected 90 records, got {inventory_response.get('count') if inventory_response else 'N/A'}")
    
    # Check inventory fields
    if inventory_response and inventory_response.get('inventory'):
        sample_inv = inventory_response['inventory'][0]
        required_fields = ['date', 'room_type', 'available_rooms', 'base_price', 'dynamic_price']
        missing = [f for f in required_fields if f not in sample_inv]
        if missing:
            print(f"   ⚠️  Sample inventory missing fields: {', '.join(missing)}")
        else:
            print(f"   ✅ Inventory records have all required fields")
            print(f"   Sample: {sample_inv.get('room_type')} - ${sample_inv.get('base_price')} on {sample_inv.get('date')}")
    
    # Check summary
    if inventory_response and inventory_response.get('summary'):
        summary = inventory_response['summary']
        print(f"   Total Available Rooms: {summary.get('total_available_rooms')}")
        print(f"   Average Price: ${summary.get('average_price')}")
    
    print()
    
    # Test 9: Filter by date range
    print("Test 9: Get Inventory - Date Range Filter")
    start_date = (date.today() + timedelta(days=30)).isoformat()
    end_date = (date.today() + timedelta(days=60)).isoformat()
    
    date_filtered_response = test_endpoint(
        f"GET /api/partners/{partner_id}/inventory - Date range filter",
        "GET",
        f"/partners/{partner_id}/inventory",
        params={"start_date": start_date, "end_date": end_date},
        expected_status=200,
        check_fields=["success", "inventory"]
    )
    
    if date_filtered_response:
        print(f"   Date range: {start_date} to {end_date}")
        print(f"   Records returned: {date_filtered_response.get('count')}")
    
    print()
    
    # Test 10: Filter by room type
    print("Test 10: Get Inventory - Room Type Filter")
    room_type_response = test_endpoint(
        f"GET /api/partners/{partner_id}/inventory - Room type filter",
        "GET",
        f"/partners/{partner_id}/inventory",
        params={"room_type": "Deluxe Ocean View"},
        expected_status=200,
        check_fields=["success", "inventory"]
    )
    
    if room_type_response and room_type_response.get('inventory'):
        all_deluxe = all(inv.get('room_type') == 'Deluxe Ocean View' for inv in room_type_response['inventory'])
        if all_deluxe:
            print(f"   ✅ All returned records are 'Deluxe Ocean View'")
        print(f"   Records returned: {room_type_response.get('count')}")
    
    print()
else:
    print("⚠️  Skipping inventory tests - no partner_id available\n")

# ============================================================================
# PARTNER BIDDING TESTS
# ============================================================================

print("\n" + "="*80)
print("PARTNER BIDDING ENDPOINTS")
print("="*80 + "\n")

if partner_id:
    # Test 11: Create a new bid
    print("Test 11: Create New Bid")
    import uuid
    bid_data = {
        "user_dream_id": str(uuid.uuid4()),  # Use valid UUID format
        "bid_type": "hotel",
        "offer_price": 250.00,
        "original_price": 350.00,
        "discount_percent": 29,
        "inclusions": {
            "breakfast": True,
            "wifi": True,
            "airport_transfer": False
        },
        "conditions": {
            "min_nights": 3,
            "cancellation_policy": "flexible"
        },
        "valid_until": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }
    
    create_bid_response = test_endpoint(
        f"POST /api/partners/{partner_id}/bids - Create bid",
        "POST",
        f"/partners/{partner_id}/bids",
        data=bid_data,
        expected_status=200,
        check_fields=["success", "message", "bid"]
    )
    
    bid_id = None
    if create_bid_response and create_bid_response.get('bid'):
        bid_id = create_bid_response['bid'].get('id')
        print(f"   ✅ Bid created with ID: {bid_id}")
        print(f"   Offer Price: ${create_bid_response['bid'].get('offer_price')}")
        print(f"   Discount: {create_bid_response['bid'].get('discount_percent')}%")
    
    print()
    
    # Test 12: List all bids for partner
    print("Test 12: List Partner Bids")
    list_bids_response = test_endpoint(
        f"GET /api/partners/{partner_id}/bids - List all bids",
        "GET",
        f"/partners/{partner_id}/bids",
        expected_status=200,
        check_fields=["success", "count", "bids", "statistics"]
    )
    
    if list_bids_response:
        print(f"   Total Bids: {list_bids_response.get('count')}")
        if list_bids_response.get('statistics'):
            stats = list_bids_response['statistics']
            print(f"   By Status: {stats.get('by_status')}")
    
    print()
else:
    print("⚠️  Skipping bidding tests - no partner_id available\n")

# ============================================================================
# HEALTH & STATS TESTS
# ============================================================================

print("\n" + "="*80)
print("HEALTH & STATS ENDPOINTS")
print("="*80 + "\n")

# Test 13: Marketplace health check
print("Test 13: Marketplace Health Check")
health_response = test_endpoint(
    "GET /api/marketplace/health - Health check",
    "GET",
    "/marketplace/health",
    expected_status=200,
    check_fields=["success", "status", "statistics"]
)

if health_response and health_response.get('statistics'):
    stats = health_response['statistics']
    print(f"   Providers: {stats.get('providers', {}).get('total')} total, {stats.get('providers', {}).get('active')} active")
    print(f"   Partners: {stats.get('partners', {}).get('total')} total, {stats.get('partners', {}).get('active')} active")
    print(f"   Inventory Records: {stats.get('inventory', {}).get('total_records')}")
    print(f"   Total Bids: {stats.get('bids', {}).get('total')}")

print()

# Test 14: Comprehensive marketplace stats
print("Test 14: Marketplace Statistics")
stats_response = test_endpoint(
    "GET /api/marketplace/stats - Comprehensive stats",
    "GET",
    "/marketplace/stats",
    expected_status=200,
    check_fields=["success", "providers", "partners", "inventory", "bids"]
)

if stats_response:
    if stats_response.get('providers'):
        print(f"   Providers by Type: {stats_response['providers'].get('by_type')}")
        print(f"   Total Providers: {stats_response['providers'].get('total')}")
    
    if stats_response.get('partners'):
        print(f"   Partners by Type: {stats_response['partners'].get('by_type')}")
        print(f"   Total Revenue: ${stats_response['partners'].get('total_revenue')}")
        print(f"   Total Bookings: {stats_response['partners'].get('total_bookings')}")
    
    if stats_response.get('inventory'):
        print(f"   Total Rooms Available: {stats_response['inventory'].get('total_rooms_available')}")
        print(f"   Average Price: ${stats_response['inventory'].get('average_price')}")
    
    if stats_response.get('bids'):
        print(f"   Bids by Status: {stats_response['bids'].get('by_status')}")
        print(f"   Total Bid Value: ${stats_response['bids'].get('total_value')}")

print()

# ============================================================================
# FINAL SUMMARY
# ============================================================================

print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80 + "\n")

print(f"Total Tests: {test_results['total']}")
print(f"Passed: {test_results['passed']} ✅")
print(f"Failed: {test_results['failed']} ❌")
print(f"Success Rate: {(test_results['passed'] / test_results['total'] * 100):.1f}%")

print("\n" + "="*80)
print("DETAILED RESULTS")
print("="*80 + "\n")

for test in test_results['tests']:
    status = "✅ PASS" if test['passed'] else "❌ FAIL"
    print(f"{status} - {test['name']}")
    if not test['passed'] and 'error' in test:
        print(f"       Error: {test['error']}")

print("\n" + "="*80)
print("TESTING COMPLETE")
print("="*80 + "\n")
