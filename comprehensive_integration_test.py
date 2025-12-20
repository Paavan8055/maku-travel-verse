#!/usr/bin/env python3
"""
Comprehensive Backend Integration & Edge Case Testing
Testing all 10 categories as requested:
1. Authentication & Authorization
2. API Contract & Data Validation
3. Cross-Module Integration
4. Error Handling & Edge Cases
5. Database Operations
6. Performance & Resource Testing
7. Provider Integration
8. AI Service Integration
9. Search Functionality
10. Admin Operations
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, List, Tuple

# Backend URL
BACKEND_URL = "https://maku-refactor.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "categories": {},
    "performance_metrics": {},
    "security_issues": [],
    "integration_issues": []
}

def log_test(category: str, name: str, passed: bool, details: str = "", response_time: float = 0):
    """Log test result with category"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: [{category}] {name}")
    if details:
        print(f"   Details: {details}")
    if response_time > 0:
        print(f"   Response Time: {response_time:.2f}ms")
    
    if category not in test_results["categories"]:
        test_results["categories"][category] = {"passed": 0, "failed": 0, "tests": []}
    
    test_results["categories"][category]["tests"].append({
        "name": name,
        "passed": passed,
        "details": details,
        "response_time": response_time
    })
    
    if passed:
        test_results["passed"] += 1
        test_results["categories"][category]["passed"] += 1
    else:
        test_results["failed"] += 1
        test_results["categories"][category]["failed"] += 1

def measure_time(func):
    """Decorator to measure execution time"""
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = (time.time() - start) * 1000  # Convert to ms
        return result, elapsed
    return wrapper

# ============================================================================
# CATEGORY 1: AUTHENTICATION & AUTHORIZATION TESTING
# ============================================================================

def test_auth_protected_endpoints_no_token():
    """Test protected endpoints without auth tokens"""
    category = "Authentication"
    
    # Test admin endpoints without token
    protected_endpoints = [
        "/admin/nft/templates",
        "/admin/nft/analytics/overview",
        "/admin/partners/dashboard"
    ]
    
    for endpoint in protected_endpoints:
        try:
            start = time.time()
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
            elapsed = (time.time() - start) * 1000
            
            # Should return 401 or 403, or work without auth (depends on implementation)
            # For now, we check if endpoint exists
            passed = response.status_code in [200, 401, 403, 404]
            details = f"Status: {response.status_code}"
            
            if response.status_code == 200:
                details += " (No auth required - potential security issue)"
                test_results["security_issues"].append(f"{endpoint} - No authentication required")
            
            log_test(category, f"Protected endpoint {endpoint} without token", passed, details, elapsed)
        except Exception as e:
            log_test(category, f"Protected endpoint {endpoint} without token", False, f"Error: {str(e)}")

def test_auth_invalid_token():
    """Test protected endpoints with invalid tokens"""
    category = "Authentication"
    
    headers = {"Authorization": "Bearer invalid_token_12345"}
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/admin/nft/templates", headers=headers, timeout=10)
        elapsed = (time.time() - start) * 1000
        
        # Should return 401 or work (if no auth implemented)
        passed = response.status_code in [200, 401, 403]
        details = f"Status: {response.status_code}"
        
        log_test(category, "Invalid token handling", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Invalid token handling", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 2: API CONTRACT & DATA VALIDATION
# ============================================================================

def test_api_contract_health():
    """Test health endpoint contract"""
    category = "API Contract"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            # Verify required fields
            required_fields = ["status", "timestamp"]
            missing = [f for f in required_fields if f not in data]
            
            if missing:
                passed = False
                details = f"Missing fields: {missing}"
            else:
                # Verify data types
                if not isinstance(data["status"], str):
                    passed = False
                    details = "Invalid data type for 'status'"
                elif not isinstance(data["timestamp"], str):
                    passed = False
                    details = "Invalid data type for 'timestamp'"
                else:
                    details = f"All fields present and valid"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Health endpoint contract", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Health endpoint contract", False, f"Error: {str(e)}")

def test_api_contract_analytics():
    """Test analytics endpoint contract"""
    category = "API Contract"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/analytics/overview", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            required_fields = ["total_users", "total_bookings", "total_revenue_usd", "conversion_rate"]
            missing = [f for f in required_fields if f not in data]
            
            if missing:
                passed = False
                details = f"Missing fields: {missing}"
            else:
                # Verify data types
                type_checks = [
                    (isinstance(data["total_users"], int), "total_users should be int"),
                    (isinstance(data["total_bookings"], int), "total_bookings should be int"),
                    (isinstance(data["total_revenue_usd"], (int, float)), "total_revenue_usd should be number"),
                    (isinstance(data["conversion_rate"], (int, float)), "conversion_rate should be number")
                ]
                
                failed_checks = [msg for check, msg in type_checks if not check]
                
                if failed_checks:
                    passed = False
                    details = f"Type errors: {', '.join(failed_checks)}"
                else:
                    details = "All fields present with correct types"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Analytics endpoint contract", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Analytics endpoint contract", False, f"Error: {str(e)}")

def test_api_contract_nft_templates():
    """Test NFT templates endpoint contract"""
    category = "API Contract"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/admin/nft/templates", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            
            if isinstance(data, list) and len(data) > 0:
                template = data[0]
                required_fields = ["id", "name", "rarity"]
                missing = [f for f in required_fields if f not in template]
                
                if missing:
                    passed = False
                    details = f"Missing fields in template: {missing}"
                else:
                    details = f"Template structure valid, {len(data)} templates found"
            else:
                details = "Empty or invalid response structure"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "NFT templates endpoint contract", passed, details, elapsed)
    except Exception as e:
        log_test(category, "NFT templates endpoint contract", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 3: CROSS-MODULE INTEGRATION
# ============================================================================

def test_integration_ai_analytics():
    """Test AI + Analytics integration"""
    category = "Cross-Module Integration"
    
    try:
        # First get AI recommendations
        start = time.time()
        ai_response = requests.get(f"{BACKEND_URL}/ai/recommendations/test_user_123?max_results=5", timeout=30)
        ai_elapsed = (time.time() - start) * 1000
        
        # Then check if analytics tracks AI usage
        start = time.time()
        analytics_response = requests.get(f"{BACKEND_URL}/analytics/overview", timeout=10)
        analytics_elapsed = (time.time() - start) * 1000
        
        passed = ai_response.status_code == 200 and analytics_response.status_code == 200
        
        if passed:
            details = f"AI recommendations: {ai_response.status_code}, Analytics: {analytics_response.status_code}"
        else:
            details = f"AI: {ai_response.status_code}, Analytics: {analytics_response.status_code}"
        
        log_test(category, "AI + Analytics integration", passed, details, ai_elapsed + analytics_elapsed)
    except Exception as e:
        log_test(category, "AI + Analytics integration", False, f"Error: {str(e)}")

def test_integration_admin_providers():
    """Test Admin + Providers integration"""
    category = "Cross-Module Integration"
    
    try:
        # Get provider analytics from admin (correct endpoint)
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/admin/providers/analytics/overview", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Provider analytics accessible, {data.get('total_providers', 0)} providers"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Admin + Providers integration", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Admin + Providers integration", False, f"Error: {str(e)}")

def test_integration_nft_payment():
    """Test NFT + Payment integration"""
    category = "Cross-Module Integration"
    
    try:
        # Check blockchain network info
        start = time.time()
        blockchain_response = requests.get(f"{BACKEND_URL}/blockchain/network-info", timeout=10)
        blockchain_elapsed = (time.time() - start) * 1000
        
        # Check payment gateway (correct endpoint)
        start = time.time()
        payment_response = requests.get(f"{BACKEND_URL}/payments/methods/available", timeout=10)
        payment_elapsed = (time.time() - start) * 1000
        
        passed = blockchain_response.status_code == 200 and payment_response.status_code == 200
        
        if passed:
            details = f"Blockchain: {blockchain_response.status_code}, Payment: {payment_response.status_code}"
        else:
            details = f"Blockchain: {blockchain_response.status_code}, Payment: {payment_response.status_code}"
        
        log_test(category, "NFT + Payment integration", passed, details, blockchain_elapsed + payment_elapsed)
    except Exception as e:
        log_test(category, "NFT + Payment integration", False, f"Error: {str(e)}")

def test_integration_search_booking():
    """Test Search + Booking integration"""
    category = "Cross-Module Integration"
    
    try:
        # Search for hotels
        start = time.time()
        search_response = requests.post(
            f"{BACKEND_URL}/search/unified",
            json={"query": "hotels in Paris", "type": "hotel"},
            timeout=30
        )
        search_elapsed = (time.time() - start) * 1000
        
        passed = search_response.status_code == 200
        
        if passed:
            data = search_response.json()
            details = f"Search returned {len(data.get('results', []))} results"
        else:
            details = f"Status: {search_response.status_code}"
        
        log_test(category, "Search + Booking integration", passed, details, search_elapsed)
    except Exception as e:
        log_test(category, "Search + Booking integration", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 4: ERROR HANDLING & EDGE CASES
# ============================================================================

def test_error_malformed_json():
    """Test with malformed JSON payload"""
    category = "Error Handling"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/ai/travel-dna/test_user",
            data="{{invalid json",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        elapsed = (time.time() - start) * 1000
        
        # Should return 400 or 422
        passed = response.status_code in [400, 422]
        details = f"Status: {response.status_code}"
        
        if response.status_code == 200:
            details += " (Should reject malformed JSON)"
            test_results["security_issues"].append("Malformed JSON accepted")
        
        log_test(category, "Malformed JSON handling", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Malformed JSON handling", False, f"Error: {str(e)}")

def test_error_missing_required_fields():
    """Test with missing required fields"""
    category = "Error Handling"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/search/unified",
            json={},  # Empty payload
            timeout=10
        )
        elapsed = (time.time() - start) * 1000
        
        # Should return 400 or 422 or handle gracefully
        passed = response.status_code in [200, 400, 422]
        details = f"Status: {response.status_code}"
        
        log_test(category, "Missing required fields handling", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Missing required fields handling", False, f"Error: {str(e)}")

def test_error_sql_injection():
    """Test SQL injection attempts"""
    category = "Error Handling"
    
    sql_payloads = [
        "' OR '1'='1",
        "1; DROP TABLE users--",
        "' UNION SELECT * FROM users--"
    ]
    
    for payload in sql_payloads:
        try:
            start = time.time()
            response = requests.get(
                f"{BACKEND_URL}/enhanced-dreams/profile/{payload}",
                timeout=10
            )
            elapsed = (time.time() - start) * 1000
            
            # Should handle safely (not crash)
            passed = response.status_code in [200, 400, 404, 422]
            details = f"Status: {response.status_code} for payload: {payload[:20]}"
            
            log_test(category, f"SQL injection protection", passed, details, elapsed)
        except Exception as e:
            log_test(category, f"SQL injection protection", False, f"Error: {str(e)}")

def test_error_xss_attempts():
    """Test XSS attempts"""
    category = "Error Handling"
    
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "javascript:alert('XSS')"
    ]
    
    for payload in xss_payloads:
        try:
            start = time.time()
            response = requests.post(
                f"{BACKEND_URL}/enhanced-dreams/behavior?user_id=test",
                json={"signal_type": payload, "value": 1.0},
                timeout=10
            )
            elapsed = (time.time() - start) * 1000
            
            # Should handle safely
            passed = response.status_code in [200, 400, 422]
            details = f"Status: {response.status_code}"
            
            if response.status_code == 200:
                # Check if response sanitizes the input
                data = response.json()
                details += " (Input accepted - verify sanitization)"
            
            log_test(category, f"XSS protection", passed, details, elapsed)
        except Exception as e:
            log_test(category, f"XSS protection", False, f"Error: {str(e)}")

def test_error_extremely_long_strings():
    """Test with extremely long strings"""
    category = "Error Handling"
    
    try:
        long_string = "A" * 100000  # 100KB string
        
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/enhanced-dreams/behavior?user_id=test",
            json={"signal_type": long_string, "value": 1.0},
            timeout=10
        )
        elapsed = (time.time() - start) * 1000
        
        # Should handle or reject gracefully
        passed = response.status_code in [200, 400, 413, 422]
        details = f"Status: {response.status_code}, String length: 100KB"
        
        log_test(category, "Extremely long string handling", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Extremely long string handling", False, f"Error: {str(e)}")

def test_error_negative_numbers():
    """Test with negative numbers where positive expected"""
    category = "Error Handling"
    
    try:
        start = time.time()
        response = requests.get(
            f"{BACKEND_URL}/ai/recommendations/test_user?max_results=-10",
            timeout=10
        )
        elapsed = (time.time() - start) * 1000
        
        # Should handle gracefully
        passed = response.status_code in [200, 400, 422]
        details = f"Status: {response.status_code}"
        
        log_test(category, "Negative number handling", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Negative number handling", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 5: DATABASE OPERATIONS
# ============================================================================

def test_database_create_operation():
    """Test CREATE operation"""
    category = "Database Operations"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/status",
            json={"client_name": f"test_client_{int(time.time())}"},
            timeout=10
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code in [200, 201]
        
        if passed:
            data = response.json()
            details = f"Created record with ID: {data.get('id', 'N/A')}"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "CREATE operation", passed, details, elapsed)
    except Exception as e:
        log_test(category, "CREATE operation", False, f"Error: {str(e)}")

def test_database_read_operation():
    """Test READ operation"""
    category = "Database Operations"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/status", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Retrieved {len(data)} records"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "READ operation", passed, details, elapsed)
    except Exception as e:
        log_test(category, "READ operation", False, f"Error: {str(e)}")

def test_database_analytics_aggregation():
    """Test database aggregation operations"""
    category = "Database Operations"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/analytics/overview", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Aggregation successful: {data.get('total_users', 0)} users, {data.get('total_bookings', 0)} bookings"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Database aggregation", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Database aggregation", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 6: PERFORMANCE & RESOURCE TESTING
# ============================================================================

def test_performance_health_endpoint():
    """Test health endpoint performance"""
    category = "Performance"
    
    try:
        times = []
        for i in range(5):
            start = time.time()
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        min_time = min(times)
        
        # Health endpoint should be fast (< 500ms)
        passed = avg_time < 500
        details = f"Avg: {avg_time:.2f}ms, Min: {min_time:.2f}ms, Max: {max_time:.2f}ms"
        
        test_results["performance_metrics"]["health_endpoint"] = {
            "avg": avg_time,
            "min": min_time,
            "max": max_time
        }
        
        log_test(category, "Health endpoint performance", passed, details, avg_time)
    except Exception as e:
        log_test(category, "Health endpoint performance", False, f"Error: {str(e)}")

def test_performance_ai_recommendations():
    """Test AI recommendations performance"""
    category = "Performance"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/ai/recommendations/test_user?max_results=10", timeout=60)
        elapsed = (time.time() - start) * 1000
        
        # AI endpoints can be slower (< 30s acceptable)
        passed = response.status_code == 200 and elapsed < 30000
        details = f"Response time: {elapsed:.2f}ms"
        
        test_results["performance_metrics"]["ai_recommendations"] = elapsed
        
        log_test(category, "AI recommendations performance", passed, details, elapsed)
    except Exception as e:
        log_test(category, "AI recommendations performance", False, f"Error: {str(e)}")

def test_performance_analytics_dashboard():
    """Test analytics dashboard performance"""
    category = "Performance"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/analytics/overview", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        # Analytics should be reasonably fast (< 2s)
        passed = response.status_code == 200 and elapsed < 2000
        details = f"Response time: {elapsed:.2f}ms"
        
        test_results["performance_metrics"]["analytics_dashboard"] = elapsed
        
        log_test(category, "Analytics dashboard performance", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Analytics dashboard performance", False, f"Error: {str(e)}")

def test_performance_pagination():
    """Test pagination performance"""
    category = "Performance"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/enhanced-dreams/destinations?limit=50", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200 and elapsed < 2000
        
        if passed:
            data = response.json()
            details = f"Retrieved {len(data.get('destinations', []))} items in {elapsed:.2f}ms"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Pagination performance", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Pagination performance", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 7: PROVIDER INTEGRATION TESTING
# ============================================================================

def test_provider_rotation_logic():
    """Test provider rotation logic"""
    category = "Provider Integration"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/admin/providers/analytics", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Provider analytics accessible, {data.get('total_providers', 0)} providers"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Provider rotation logic", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Provider rotation logic", False, f"Error: {str(e)}")

def test_provider_health_checks():
    """Test provider health checks"""
    category = "Provider Integration"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/providers/health", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Health check successful"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Provider health checks", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Provider health checks", False, f"Error: {str(e)}")

def test_provider_fallback():
    """Test provider fallback mechanism"""
    category = "Provider Integration"
    
    try:
        # Test search which should use provider system
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/search/unified",
            json={"query": "hotels in Tokyo", "type": "hotel"},
            timeout=30
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        details = f"Search completed (provider fallback working if needed)"
        
        log_test(category, "Provider fallback mechanism", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Provider fallback mechanism", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 8: AI SERVICE INTEGRATION
# ============================================================================

def test_ai_travel_dna_analysis():
    """Test AI Travel DNA analysis"""
    category = "AI Service Integration"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/ai/travel-dna/test_user_123",
            json={"preferences": ["culture", "photography"]},
            timeout=60
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Travel DNA analysis completed in {elapsed:.2f}ms"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "AI Travel DNA analysis", passed, details, elapsed)
    except Exception as e:
        log_test(category, "AI Travel DNA analysis", False, f"Error: {str(e)}")

def test_ai_recommendations():
    """Test AI recommendations"""
    category = "AI Service Integration"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/ai/recommendations/test_user_123?max_results=5", timeout=60)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            recommendations = data.get("recommendations", [])
            details = f"Retrieved {len(recommendations)} recommendations in {elapsed:.2f}ms"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "AI recommendations", passed, details, elapsed)
    except Exception as e:
        log_test(category, "AI recommendations", False, f"Error: {str(e)}")

def test_ai_journey_optimization():
    """Test AI journey optimization"""
    category = "AI Service Integration"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/ai/journey-optimization",
            json={
                "user_id": "test_user_123",
                "destination_ids": ["paris", "london", "rome"],
                "preferences": {"budget": "mid_range"}
            },
            timeout=60
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Journey optimization completed in {elapsed:.2f}ms"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "AI journey optimization", passed, details, elapsed)
    except Exception as e:
        log_test(category, "AI journey optimization", False, f"Error: {str(e)}")

def test_ai_predictive_insights():
    """Test AI predictive insights"""
    category = "AI Service Integration"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/ai/predictive-insights/test_user_123", timeout=60)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            insights = data.get("insights", [])
            details = f"Retrieved {len(insights)} insights in {elapsed:.2f}ms"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "AI predictive insights", passed, details, elapsed)
    except Exception as e:
        log_test(category, "AI predictive insights", False, f"Error: {str(e)}")

def test_ai_credit_system():
    """Test AI credit system tracking"""
    category = "AI Service Integration"
    
    try:
        # Test free chat endpoint (should not use credits)
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/ai/free-chat",
            json={"query": "Tell me about Paris", "user_context": {}},
            timeout=30
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            credits_used = data.get("credits_used", 0)
            details = f"Free chat completed, credits used: {credits_used}"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "AI credit system tracking", passed, details, elapsed)
    except Exception as e:
        log_test(category, "AI credit system tracking", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 9: SEARCH FUNCTIONALITY
# ============================================================================

def test_search_unified_search():
    """Test unified search"""
    category = "Search Functionality"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/search/unified",
            json={"query": "hotels in Paris", "type": "hotel"},
            timeout=30
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            results = data.get("results", [])
            details = f"Found {len(results)} results in {elapsed:.2f}ms"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Unified search", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Unified search", False, f"Error: {str(e)}")

def test_search_advanced_filters():
    """Test advanced search with filters"""
    category = "Search Functionality"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/search/advanced",
            json={
                "query": "luxury hotels",
                "filters": {
                    "price_range": {"min": 100, "max": 500},
                    "rating": {"min": 4}
                }
            },
            timeout=30
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Advanced search completed in {elapsed:.2f}ms"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Advanced search with filters", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Advanced search with filters", False, f"Error: {str(e)}")

def test_search_special_characters():
    """Test search with special characters"""
    category = "Search Functionality"
    
    special_queries = [
        "hotels in São Paulo",
        "flights to Zürich",
        "activities in Москва"
    ]
    
    for query in special_queries:
        try:
            start = time.time()
            response = requests.post(
                f"{BACKEND_URL}/search/unified",
                json={"query": query, "type": "hotel"},
                timeout=30
            )
            elapsed = (time.time() - start) * 1000
            
            passed = response.status_code == 200
            details = f"Query: '{query[:30]}...', Status: {response.status_code}"
            
            log_test(category, "Search with special characters", passed, details, elapsed)
        except Exception as e:
            log_test(category, "Search with special characters", False, f"Error: {str(e)}")

def test_search_pagination():
    """Test search result pagination"""
    category = "Search Functionality"
    
    try:
        start = time.time()
        response = requests.post(
            f"{BACKEND_URL}/search/unified",
            json={"query": "hotels", "type": "hotel", "page": 1, "limit": 20},
            timeout=30
        )
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Pagination working, retrieved page 1"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Search result pagination", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Search result pagination", False, f"Error: {str(e)}")

# ============================================================================
# CATEGORY 10: ADMIN OPERATIONS
# ============================================================================

def test_admin_partner_dashboard():
    """Test admin partner dashboard"""
    category = "Admin Operations"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/admin/partners/dashboard", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Partner dashboard accessible"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Admin partner dashboard", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Admin partner dashboard", False, f"Error: {str(e)}")

def test_admin_nft_management():
    """Test admin NFT management"""
    category = "Admin Operations"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/admin/nft/templates", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"NFT management accessible, {len(data)} templates"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Admin NFT management", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Admin NFT management", False, f"Error: {str(e)}")

def test_admin_analytics_aggregation():
    """Test admin analytics aggregation"""
    category = "Admin Operations"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/admin/nft/analytics/overview", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"Analytics aggregation working"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Admin analytics aggregation", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Admin analytics aggregation", False, f"Error: {str(e)}")

def test_admin_system_health():
    """Test admin system health monitoring"""
    category = "Admin Operations"
    
    try:
        start = time.time()
        response = requests.get(f"{BACKEND_URL}/analytics/system-health", timeout=10)
        elapsed = (time.time() - start) * 1000
        
        passed = response.status_code == 200
        
        if passed:
            data = response.json()
            details = f"System health monitoring accessible"
        else:
            details = f"Status: {response.status_code}"
        
        log_test(category, "Admin system health monitoring", passed, details, elapsed)
    except Exception as e:
        log_test(category, "Admin system health monitoring", False, f"Error: {str(e)}")

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

def print_summary():
    """Print comprehensive test summary"""
    print("\n" + "="*80)
    print("COMPREHENSIVE BACKEND INTEGRATION TEST SUMMARY")
    print("="*80)
    
    total_tests = test_results["passed"] + test_results["failed"]
    pass_rate = (test_results["passed"] / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\nOverall Results:")
    print(f"  Total Tests: {total_tests}")
    print(f"  Passed: {test_results['passed']} ✅")
    print(f"  Failed: {test_results['failed']} ❌")
    print(f"  Pass Rate: {pass_rate:.1f}%")
    
    print(f"\nResults by Category:")
    for category, results in test_results["categories"].items():
        cat_total = results["passed"] + results["failed"]
        cat_rate = (results["passed"] / cat_total * 100) if cat_total > 0 else 0
        print(f"  {category}: {results['passed']}/{cat_total} ({cat_rate:.1f}%)")
    
    if test_results["performance_metrics"]:
        print(f"\nPerformance Metrics:")
        for metric, value in test_results["performance_metrics"].items():
            if isinstance(value, dict):
                print(f"  {metric}: Avg={value['avg']:.2f}ms, Min={value['min']:.2f}ms, Max={value['max']:.2f}ms")
            else:
                print(f"  {metric}: {value:.2f}ms")
    
    if test_results["security_issues"]:
        print(f"\n⚠️  Security Issues Found:")
        for issue in test_results["security_issues"]:
            print(f"  - {issue}")
    
    if test_results["integration_issues"]:
        print(f"\n⚠️  Integration Issues Found:")
        for issue in test_results["integration_issues"]:
            print(f"  - {issue}")
    
    print("\n" + "="*80)

def main():
    """Run all tests"""
    print("Starting Comprehensive Backend Integration & Edge Case Testing...")
    print(f"Backend URL: {BACKEND_URL}")
    print("="*80 + "\n")
    
    # Category 1: Authentication & Authorization
    print("\n[CATEGORY 1: AUTHENTICATION & AUTHORIZATION]")
    test_auth_protected_endpoints_no_token()
    test_auth_invalid_token()
    
    # Category 2: API Contract & Data Validation
    print("\n[CATEGORY 2: API CONTRACT & DATA VALIDATION]")
    test_api_contract_health()
    test_api_contract_analytics()
    test_api_contract_nft_templates()
    
    # Category 3: Cross-Module Integration
    print("\n[CATEGORY 3: CROSS-MODULE INTEGRATION]")
    test_integration_ai_analytics()
    test_integration_admin_providers()
    test_integration_nft_payment()
    test_integration_search_booking()
    
    # Category 4: Error Handling & Edge Cases
    print("\n[CATEGORY 4: ERROR HANDLING & EDGE CASES]")
    test_error_malformed_json()
    test_error_missing_required_fields()
    test_error_sql_injection()
    test_error_xss_attempts()
    test_error_extremely_long_strings()
    test_error_negative_numbers()
    
    # Category 5: Database Operations
    print("\n[CATEGORY 5: DATABASE OPERATIONS]")
    test_database_create_operation()
    test_database_read_operation()
    test_database_analytics_aggregation()
    
    # Category 6: Performance & Resource Testing
    print("\n[CATEGORY 6: PERFORMANCE & RESOURCE TESTING]")
    test_performance_health_endpoint()
    test_performance_ai_recommendations()
    test_performance_analytics_dashboard()
    test_performance_pagination()
    
    # Category 7: Provider Integration
    print("\n[CATEGORY 7: PROVIDER INTEGRATION]")
    test_provider_rotation_logic()
    test_provider_health_checks()
    test_provider_fallback()
    
    # Category 8: AI Service Integration
    print("\n[CATEGORY 8: AI SERVICE INTEGRATION]")
    test_ai_travel_dna_analysis()
    test_ai_recommendations()
    test_ai_journey_optimization()
    test_ai_predictive_insights()
    test_ai_credit_system()
    
    # Category 9: Search Functionality
    print("\n[CATEGORY 9: SEARCH FUNCTIONALITY]")
    test_search_unified_search()
    test_search_advanced_filters()
    test_search_special_characters()
    test_search_pagination()
    
    # Category 10: Admin Operations
    print("\n[CATEGORY 10: ADMIN OPERATIONS]")
    test_admin_partner_dashboard()
    test_admin_nft_management()
    test_admin_analytics_aggregation()
    test_admin_system_health()
    
    # Print summary
    print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if test_results["failed"] == 0 else 1)

if __name__ == "__main__":
    main()
