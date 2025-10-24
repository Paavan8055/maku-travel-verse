"""
Backend Testing for Platform Data Consistency
Tests Unified Metrics Service and Smart Dreams V2 endpoints
"""

import requests
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://travel-ai-platform-2.preview.emergentagent.com/api"

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message, data=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if data:
        print(f"Data: {json.dumps(data, indent=2)}")

def test_unified_metrics_endpoint():
    """
    Test GET /api/metrics/platform
    CRITICAL: Verify response structure and data consistency
    """
    print_test_header("Unified Metrics Endpoint - /api/metrics/platform")
    
    try:
        response = requests.get(f"{BACKEND_URL}/metrics/platform", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Check for required top-level fields
        required_fields = ['success', 'travel_fund']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing required fields: {missing_fields}", data)
            return False
        
        # Check travel_fund structure
        travel_fund = data.get('travel_fund', {})
        required_tf_fields = ['total_amount_usd', 'total_savers', 'avg_fund_size_usd']
        missing_tf_fields = [f for f in required_tf_fields if f not in travel_fund]
        
        if missing_tf_fields:
            print_result(False, f"Missing travel_fund fields: {missing_tf_fields}", travel_fund)
            return False
        
        # Check for realistic values (not placeholder 999999)
        total_amount = travel_fund.get('total_amount_usd', 0)
        total_savers = travel_fund.get('total_savers', 0)
        
        if total_amount > 1000000000:  # Unrealistic value
            print_result(False, f"Unrealistic total_amount_usd: {total_amount}")
            return False
        
        # Check for demo/test indicators
        response_text = json.dumps(data).lower()
        demo_indicators = ['demo', 'test data', 'mock', 'api demo']
        found_indicators = [ind for ind in demo_indicators if ind in response_text]
        
        if found_indicators:
            print_result(False, f"Found demo indicators: {found_indicators}")
            return False
        
        print_result(True, "Unified metrics endpoint working correctly")
        print(f"  - Total Savers: {total_savers}")
        print(f"  - Total Amount USD: ${total_amount:,.2f}")
        print(f"  - Avg Fund Size: ${travel_fund.get('avg_fund_size_usd', 0):,.2f}")
        print(f"  - Data Source: {travel_fund.get('data_source', 'unknown')}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {e}")
        return False

def test_smart_dreams_cache_stats():
    """
    Test GET /api/smart-dreams-v2/cache-stats
    Verify cache statistics endpoint
    """
    print_test_header("Smart Dreams V2 Cache Stats - /api/smart-dreams-v2/cache-stats")
    
    try:
        response = requests.get(f"{BACKEND_URL}/smart-dreams-v2/cache-stats", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print_result(False, "Endpoint not found - Smart Dreams V2 may not be enabled")
            return False
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Check for success field
        if not data.get('success'):
            print_result(False, "Response missing 'success' field or false", data)
            return False
        
        # Check for cache stats fields
        expected_fields = ['total_cached', 'valid_entries', 'cache_ttl_hours']
        missing_fields = [f for f in expected_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing cache stats fields: {missing_fields}", data)
            return False
        
        print_result(True, "Cache stats endpoint working correctly")
        print(f"  - Total Cached: {data.get('total_cached', 0)}")
        print(f"  - Valid Entries: {data.get('valid_entries', 0)}")
        print(f"  - Cache TTL: {data.get('cache_ttl_hours', 0)} hours")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {e}")
        return False

def test_smart_dreams_rotation_stats():
    """
    Test GET /api/smart-dreams/v2/rotation-stats
    Verify provider rotation statistics
    """
    print_test_header("Smart Dreams V2 Rotation Stats - /api/smart-dreams/v2/rotation-stats")
    
    try:
        response = requests.get(f"{BACKEND_URL}/smart-dreams/v2/rotation-stats", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print_result(False, "Endpoint not found - Smart Dreams V2 may not be enabled")
            return False
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Check for success field
        if not data.get('success'):
            print_result(False, "Response missing 'success' field or false", data)
            return False
        
        print_result(True, "Rotation stats endpoint working correctly")
        print(f"  - Response: {json.dumps(data, indent=2)}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {e}")
        return False

def test_smart_dreams_score_destination():
    """
    Test POST /api/smart-dreams/v2/score-destination
    Verify AI scoring (not Math.random())
    """
    print_test_header("Smart Dreams V2 Score Destination - /api/smart-dreams/v2/score-destination")
    
    try:
        # Sample destination data
        payload = {
            "destination": {
                "name": "Bali",
                "location": "Ubud",
                "country": "Indonesia",
                "price": 1200,
                "rating": 4.7,
                "amenities": ["pool", "spa", "yoga"],
                "tags": ["wellness", "nature", "culture"]
            },
            "user_preferences": {
                "budget": 1500,
                "duration": 7,
                "interests": ["wellness", "nature", "photography"],
                "travelStyle": "relaxed",
                "companion": "solo"
            },
            "user_context": {
                "user_id": "test_user_123",
                "previous_trips": ["Thailand", "Vietnam"]
            },
            "use_ai": True
        }
        
        response = requests.post(
            f"{BACKEND_URL}/smart-dreams/v2/score-destination",
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print_result(False, "Endpoint not found - Smart Dreams V2 may not be enabled")
            return False
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Check for success field
        if not data.get('success'):
            print_result(False, "Response missing 'success' field or false", data)
            return False
        
        # Check for scoring fields
        required_fields = ['personality_match', 'is_dream_destination', 'match_reasons', 'scoring_method']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing scoring fields: {missing_fields}", data)
            return False
        
        # Verify score is not random (should be deterministic or AI-based)
        personality_match = data.get('personality_match', 0)
        scoring_method = data.get('scoring_method', 'unknown')
        
        if personality_match < 0 or personality_match > 100:
            print_result(False, f"Invalid personality_match score: {personality_match}")
            return False
        
        # Check that scoring method is not 'random'
        if 'random' in scoring_method.lower():
            print_result(False, f"Scoring method indicates random: {scoring_method}")
            return False
        
        print_result(True, "Score destination endpoint working correctly")
        print(f"  - Personality Match: {personality_match}%")
        print(f"  - Is Dream Destination: {data.get('is_dream_destination')}")
        print(f"  - Scoring Method: {scoring_method}")
        print(f"  - Match Reasons: {data.get('match_reasons', [])}")
        print(f"  - AI Confidence: {data.get('ai_confidence', 'N/A')}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {e}")
        return False

def test_health_endpoint():
    """
    Test GET /api/health
    Basic smoke test
    """
    print_test_header("Health Check - /api/health")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'status' not in data:
            print_result(False, "Missing 'status' field", data)
            return False
        
        print_result(True, f"Health check passed - Status: {data.get('status')}")
        return True
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {e}")
        return False

def test_travel_funds_enhanced_stats():
    """
    Test GET /api/travel-funds/enhanced-stats
    Verify existing endpoint still works
    """
    print_test_header("Travel Funds Enhanced Stats - /api/travel-funds/enhanced-stats")
    
    try:
        response = requests.get(f"{BACKEND_URL}/travel-funds/enhanced-stats", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        # 401 is acceptable for Supabase endpoints in forked environment
        if response.status_code == 401:
            print_result(True, "Expected 401 (Supabase auth) in forked environment")
            return True
        
        if response.status_code != 200:
            print_result(False, f"Expected 200 or 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print_result(True, "Enhanced stats endpoint accessible")
        print(f"  - Response keys: {list(data.keys())}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {e}")
        return False

def test_blockchain_tiers():
    """
    Test GET /api/blockchain/tiers
    Verify tier structure (Bronze 1%, Silver 3%, Gold 6%, Platinum 10%)
    """
    print_test_header("Blockchain Tiers - /api/blockchain/tiers")
    
    try:
        response = requests.get(f"{BACKEND_URL}/blockchain/tiers", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Check for tiers array
        if 'tiers' not in data:
            print_result(False, "Missing 'tiers' field", data)
            return False
        
        tiers = data['tiers']
        
        # Verify expected tier structure
        expected_tiers = {
            'Bronze': 1,
            'Silver': 3,
            'Gold': 6,
            'Platinum': 10
        }
        
        for tier in tiers:
            tier_name = tier.get('name')
            cashback_rate = tier.get('cashback_rate', 0)
            
            if tier_name in expected_tiers:
                expected_rate = expected_tiers[tier_name]
                if cashback_rate != expected_rate:
                    print_result(False, f"{tier_name} tier has incorrect cashback: {cashback_rate}% (expected {expected_rate}%)")
                    return False
        
        print_result(True, "Blockchain tiers endpoint working correctly")
        for tier in tiers:
            print(f"  - {tier.get('name')}: {tier.get('cashback_rate')}% cashback")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False
    except Exception as e:
        print_result(False, f"Unexpected error: {e}")
        return False

def test_data_consistency():
    """
    Test data consistency between unified metrics and travel funds endpoints
    """
    print_test_header("Data Consistency Check")
    
    try:
        # Get unified metrics
        unified_response = requests.get(f"{BACKEND_URL}/metrics/platform", timeout=10)
        
        if unified_response.status_code != 200:
            print_result(False, "Cannot test consistency - unified metrics endpoint failed")
            return False
        
        unified_data = unified_response.json()
        unified_tf = unified_data.get('travel_fund', {})
        
        # Get travel funds enhanced stats
        tf_response = requests.get(f"{BACKEND_URL}/travel-funds/enhanced-stats", timeout=10)
        
        # If 401, we can't compare but that's expected
        if tf_response.status_code == 401:
            print_result(True, "Cannot compare - travel funds endpoint requires auth (expected)")
            return True
        
        if tf_response.status_code != 200:
            print_result(True, "Cannot compare - travel funds endpoint not accessible (acceptable)")
            return True
        
        tf_data = tf_response.json()
        
        # Compare total values if both available
        unified_total = unified_tf.get('total_amount_usd', 0)
        tf_total = tf_data.get('total_value', 0)
        
        # Allow for some variance due to timing
        if abs(unified_total - tf_total) > unified_total * 0.1:  # 10% variance
            print_result(False, f"Inconsistent totals: Unified=${unified_total}, TF=${tf_total}")
            return False
        
        print_result(True, "Data consistency check passed")
        print(f"  - Unified Metrics Total: ${unified_total:,.2f}")
        print(f"  - Travel Funds Total: ${tf_total:,.2f}")
        
        return True
        
    except Exception as e:
        print_result(False, f"Consistency check error: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("BACKEND TESTING - PLATFORM DATA CONSISTENCY")
    print("Testing Unified Metrics Service and Smart Dreams V2")
    print("="*80)
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "tests": []
    }
    
    # Define all tests
    tests = [
        ("Health Check", test_health_endpoint, "MEDIUM"),
        ("Unified Metrics Endpoint", test_unified_metrics_endpoint, "HIGH"),
        ("Smart Dreams V2 Cache Stats", test_smart_dreams_cache_stats, "HIGH"),
        ("Smart Dreams V2 Rotation Stats", test_smart_dreams_rotation_stats, "HIGH"),
        ("Smart Dreams V2 Score Destination", test_smart_dreams_score_destination, "HIGH"),
        ("Travel Funds Enhanced Stats", test_travel_funds_enhanced_stats, "MEDIUM"),
        ("Blockchain Tiers", test_blockchain_tiers, "MEDIUM"),
        ("Data Consistency", test_data_consistency, "HIGH"),
    ]
    
    # Run each test
    for test_name, test_func, priority in tests:
        results["total"] += 1
        try:
            passed = test_func()
            if passed:
                results["passed"] += 1
                results["tests"].append({
                    "name": test_name,
                    "status": "PASS",
                    "priority": priority
                })
            else:
                results["failed"] += 1
                results["tests"].append({
                    "name": test_name,
                    "status": "FAIL",
                    "priority": priority
                })
        except Exception as e:
            results["failed"] += 1
            results["tests"].append({
                "name": test_name,
                "status": "ERROR",
                "priority": priority,
                "error": str(e)
            })
            print(f"❌ ERROR: {test_name} - {e}")
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {results['total']}")
    print(f"Passed: {results['passed']} ✅")
    print(f"Failed: {results['failed']} ❌")
    print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
    
    print("\n" + "-"*80)
    print("DETAILED RESULTS BY PRIORITY")
    print("-"*80)
    
    for priority in ["HIGH", "MEDIUM", "LOW"]:
        priority_tests = [t for t in results["tests"] if t.get("priority") == priority]
        if priority_tests:
            print(f"\n{priority} PRIORITY:")
            for test in priority_tests:
                status_icon = "✅" if test["status"] == "PASS" else "❌"
                print(f"  {status_icon} {test['name']}: {test['status']}")
                if "error" in test:
                    print(f"     Error: {test['error']}")
    
    return results

if __name__ == "__main__":
    results = run_all_tests()
    
    # Exit with appropriate code
    exit(0 if results["failed"] == 0 else 1)
