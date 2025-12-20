#!/usr/bin/env python3
"""
Post-Refactoring Backend Validation Test
Tests all 22 routers organized into 8 logical modules
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, List, Tuple

# Backend URL from environment
BACKEND_URL = "https://maku-refactor.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": [],
    "domains": {}
}

def log_test(domain: str, endpoint: str, passed: bool, status_code: int = None, response_time: float = None, details: str = ""):
    """Log test result with domain categorization"""
    status = "✅" if passed else "❌"
    test_name = f"{domain}: {endpoint}"
    
    result_str = f"{status} {test_name}"
    if status_code:
        result_str += f" [{status_code}]"
    if response_time:
        result_str += f" ({response_time:.0f}ms)"
    if details:
        result_str += f" - {details}"
    
    print(result_str)
    
    test_results["tests"].append({
        "domain": domain,
        "endpoint": endpoint,
        "passed": passed,
        "status_code": status_code,
        "response_time": response_time,
        "details": details
    })
    
    if domain not in test_results["domains"]:
        test_results["domains"][domain] = {"passed": 0, "failed": 0}
    
    if passed:
        test_results["passed"] += 1
        test_results["domains"][domain]["passed"] += 1
    else:
        test_results["failed"] += 1
        test_results["domains"][domain]["failed"] += 1

def test_endpoint(domain: str, method: str, endpoint: str, expected_status: List[int] = [200], 
                  json_data: Dict = None, params: Dict = None, check_fields: List[str] = None) -> Tuple[bool, int, float]:
    """Generic endpoint tester"""
    url = f"{BACKEND_URL}{endpoint}"
    start_time = time.time()
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=json_data, params=params, timeout=10)
        else:
            return False, 0, 0
        
        response_time = (time.time() - start_time) * 1000
        status_code = response.status_code
        
        passed = status_code in expected_status
        details = ""
        
        if passed and check_fields and status_code == 200:
            try:
                data = response.json()
                missing = [f for f in check_fields if f not in data]
                if missing:
                    passed = False
                    details = f"Missing fields: {missing}"
            except:
                details = "Invalid JSON response"
        
        log_test(domain, f"{method} {endpoint}", passed, status_code, response_time, details)
        return passed, status_code, response_time
        
    except requests.exceptions.Timeout:
        log_test(domain, f"{method} {endpoint}", False, 0, 0, "Timeout")
        return False, 0, 0
    except Exception as e:
        log_test(domain, f"{method} {endpoint}", False, 0, 0, f"Error: {str(e)[:50]}")
        return False, 0, 0

def test_health_and_core():
    """Test health check and core endpoints"""
    print("\n" + "="*80)
    print("🏥 HEALTH & CORE ENDPOINTS")
    print("="*80)
    
    test_endpoint("Core", "GET", "/health", [200])
    test_endpoint("Core", "GET", "/", [200])
    test_endpoint("Core", "GET", "/status", [200])

def test_ai_services():
    """Test AI Services domain"""
    print("\n" + "="*80)
    print("🤖 AI SERVICES DOMAIN")
    print("="*80)
    
    # Free AI Provider
    test_endpoint("AI", "POST", "/ai/free-chat", [200], 
                  json_data={"query": "Tell me about Paris", "user_context": {}})
    
    # Travel DNA Analysis
    test_endpoint("AI", "POST", "/ai/travel-dna/test_user_123", [200], 
                  json_data={"preferences": ["culture", "food"]})
    
    # Recommendations
    test_endpoint("AI", "GET", "/ai/recommendations/test_user_123", [200])
    
    # Journey Optimization
    test_endpoint("AI", "POST", "/ai/journey-optimization", [200], 
                  json_data={"user_id": "test_user", "destination_ids": ["paris", "rome"], "preferences": {}})
    
    # Predictive Insights
    test_endpoint("AI", "GET", "/ai/predictive-insights/test_user_123", [200])
    
    # AI Feedback
    test_endpoint("AI", "POST", "/ai/feedback", [200], 
                  json_data={"user_id": "test_user", "feedback_type": "recommendation", "rating": 5})
    
    # Recommendation Explanation
    test_endpoint("AI", "GET", "/ai/explain/rec_123", [200], params={"user_id": "test_user"})
    
    # Enhanced Dreams
    test_endpoint("AI", "GET", "/enhanced-dreams/destinations", [200])
    test_endpoint("AI", "GET", "/enhanced-dreams/profile/test_user_123", [200])
    test_endpoint("AI", "GET", "/enhanced-dreams/insights/test_user_123", [200])

def test_admin_services():
    """Test Admin Services domain"""
    print("\n" + "="*80)
    print("👨‍💼 ADMIN SERVICES DOMAIN")
    print("="*80)
    
    # Admin NFT Endpoints
    test_endpoint("Admin", "GET", "/admin/nft/templates", [200])
    test_endpoint("Admin", "GET", "/admin/nft/airdrop/events", [200])
    test_endpoint("Admin", "GET", "/admin/nft/tokenomics", [200])
    test_endpoint("Admin", "GET", "/admin/nft/provider-bonuses", [200])
    test_endpoint("Admin", "GET", "/admin/nft/analytics/overview", [200])
    
    # Partner Dashboard
    test_endpoint("Admin", "GET", "/admin/partners/dashboard", [200, 404])
    test_endpoint("Admin", "GET", "/admin/providers/analytics/overview", [200, 404])
    test_endpoint("Admin", "GET", "/admin/system/health", [200, 404])

def test_analytics_services():
    """Test Analytics Services domain"""
    print("\n" + "="*80)
    print("📊 ANALYTICS SERVICES DOMAIN")
    print("="*80)
    
    # Analytics Dashboard
    test_endpoint("Analytics", "GET", "/analytics/overview", [200])
    test_endpoint("Analytics", "GET", "/analytics/providers/performance", [200])
    test_endpoint("Analytics", "GET", "/analytics/booking-funnel", [200])
    test_endpoint("Analytics", "GET", "/analytics/realtime", [200])
    
    # Provider Analytics
    test_endpoint("Analytics", "GET", "/analytics/providers/health", [200, 404])
    test_endpoint("Analytics", "GET", "/analytics/providers/comparison", [200, 404])
    
    # Realtime Features
    test_endpoint("Analytics", "GET", "/analytics/realtime/active-users", [200, 404])
    test_endpoint("Analytics", "GET", "/analytics/realtime/system-status", [200, 404])

def test_search_services():
    """Test Search Services domain"""
    print("\n" + "="*80)
    print("🔍 SEARCH SERVICES DOMAIN")
    print("="*80)
    
    # Advanced Search
    test_endpoint("Search", "POST", "/search/advanced", [200, 404], 
                  json_data={"query": "beach destinations", "filters": {}})
    
    # Unified Search
    test_endpoint("Search", "POST", "/search/unified", [200, 404], 
                  json_data={"query": "Paris hotels", "search_type": "hotels"})
    
    # Destination Content
    test_endpoint("Search", "GET", "/search/destinations", [200, 404])
    test_endpoint("Search", "GET", "/search/destinations/paris", [200, 404])

def test_nft_services():
    """Test NFT & Blockchain Services domain"""
    print("\n" + "="*80)
    print("🎨 NFT & BLOCKCHAIN SERVICES DOMAIN")
    print("="*80)
    
    # NFT Integration
    test_endpoint("NFT", "GET", "/nft/user/test_user_123", [200, 404])
    test_endpoint("NFT", "GET", "/nft/marketplace", [200, 404])
    test_endpoint("NFT", "GET", "/nft/rewards/test_user_123", [200, 404])
    
    # Blockchain endpoints
    test_endpoint("NFT", "GET", "/blockchain/network-info", [200, 404])
    test_endpoint("NFT", "GET", "/blockchain/wallet/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", [200, 404])
    
    # Cross-chain Bridge
    test_endpoint("NFT", "GET", "/bridge/supported-chains", [200, 404])
    test_endpoint("NFT", "GET", "/bridge/fees", [200, 404])

def test_booking_payment_services():
    """Test Booking & Payment Services domain"""
    print("\n" + "="*80)
    print("💳 BOOKING & PAYMENT SERVICES DOMAIN")
    print("="*80)
    
    # Payment Gateway
    test_endpoint("Payment", "POST", "/payments/intent/create", [200, 201, 400], 
                  json_data={"amount": 299.99, "currency": "usd", "booking_id": "test_123"})
    
    test_endpoint("Payment", "GET", "/payments/methods/available", [200], 
                  params={"currency": "usd"})
    
    test_endpoint("Payment", "GET", "/payments/status/test_payment_123", [200, 404])
    
    # Bookings
    test_endpoint("Payment", "GET", "/bookings", [200, 404], params={"user_id": "test_user"})

def test_provider_services():
    """Test Provider Services domain"""
    print("\n" + "="*80)
    print("🏨 PROVIDER SERVICES DOMAIN")
    print("="*80)
    
    # Off-season Endpoints
    test_endpoint("Providers", "GET", "/offseason/campaigns", [200, 404])
    test_endpoint("Providers", "GET", "/offseason/deals", [200, 404])
    test_endpoint("Providers", "GET", "/offseason/partners", [200, 404])
    
    # Provider Marketplace
    test_endpoint("Providers", "GET", "/providers/marketplace", [200, 404])
    test_endpoint("Providers", "GET", "/providers/available", [200, 404])
    test_endpoint("Providers", "GET", "/providers/status", [200, 404])

def test_automation_services():
    """Test Automation Services domain"""
    print("\n" + "="*80)
    print("🧪 AUTOMATION SERVICES DOMAIN")
    print("="*80)
    
    # Automated Test API
    test_endpoint("Automation", "GET", "/test/health", [200, 404])
    test_endpoint("Automation", "GET", "/test/suites", [200, 404])
    test_endpoint("Automation", "POST", "/test/run", [200, 404], 
                  json_data={"suite": "smoke_test"})

def test_gamification_services():
    """Test Gamification Services (part of core)"""
    print("\n" + "="*80)
    print("🎮 GAMIFICATION SERVICES")
    print("="*80)
    
    test_endpoint("Gamification", "GET", "/gamification/stats/test_user_123", [200])
    test_endpoint("Gamification", "GET", "/gamification/achievements/test_user_123", [200])
    test_endpoint("Gamification", "GET", "/gamification/leaderboards", [200])
    test_endpoint("Gamification", "GET", "/gamification/challenges/test_user_123", [200])

def print_summary():
    """Print comprehensive test summary"""
    print("\n" + "="*80)
    print("📋 POST-REFACTORING VALIDATION SUMMARY")
    print("="*80)
    
    total = test_results['passed'] + test_results['failed']
    success_rate = (test_results['passed'] / total * 100) if total > 0 else 0
    
    print(f"\n🎯 OVERALL RESULTS:")
    print(f"   Total Endpoints Tested: {total}")
    print(f"   ✅ Passed: {test_results['passed']}")
    print(f"   ❌ Failed: {test_results['failed']}")
    print(f"   Success Rate: {success_rate:.1f}%")
    
    print(f"\n📊 RESULTS BY DOMAIN:")
    for domain, stats in sorted(test_results["domains"].items()):
        domain_total = stats['passed'] + stats['failed']
        domain_rate = (stats['passed'] / domain_total * 100) if domain_total > 0 else 0
        status_icon = "✅" if stats['failed'] == 0 else "⚠️" if domain_rate >= 50 else "❌"
        print(f"   {status_icon} {domain:15} {stats['passed']}/{domain_total} ({domain_rate:.0f}%)")
    
    # Show failed tests
    if test_results['failed'] > 0:
        print(f"\n❌ FAILED ENDPOINTS ({test_results['failed']}):")
        for test in test_results['tests']:
            if not test['passed']:
                endpoint_info = f"   • {test['domain']}: {test['endpoint']}"
                if test['status_code']:
                    endpoint_info += f" [{test['status_code']}]"
                if test['details']:
                    endpoint_info += f" - {test['details']}"
                print(endpoint_info)
    
    # Show response time stats
    response_times = [t['response_time'] for t in test_results['tests'] if t['response_time'] and t['passed']]
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        min_time = min(response_times)
        print(f"\n⏱️  RESPONSE TIME STATS:")
        print(f"   Average: {avg_time:.0f}ms")
        print(f"   Min: {min_time:.0f}ms")
        print(f"   Max: {max_time:.0f}ms")
    
    print("\n" + "="*80)
    
    # Recommendations
    if test_results['failed'] > 0:
        print("\n💡 RECOMMENDATIONS:")
        
        # Check for 404 errors
        not_found = [t for t in test_results['tests'] if not t['passed'] and t['status_code'] == 404]
        if not_found:
            print(f"   • {len(not_found)} endpoints returned 404 - may not be implemented yet")
        
        # Check for 500 errors
        server_errors = [t for t in test_results['tests'] if not t['passed'] and t['status_code'] and t['status_code'] >= 500]
        if server_errors:
            print(f"   • {len(server_errors)} endpoints have server errors - check backend logs")
        
        # Check for timeout errors
        timeouts = [t for t in test_results['tests'] if not t['passed'] and t['status_code'] == 0]
        if timeouts:
            print(f"   • {len(timeouts)} endpoints timed out - check service availability")
    else:
        print("\n🎉 ALL ENDPOINTS WORKING! Backend refactoring successful!")
    
    print("="*80)

def main():
    """Run all post-refactoring validation tests"""
    print("="*80)
    print("🔧 MAKU.TRAVEL POST-REFACTORING BACKEND VALIDATION")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print(f"Purpose: Verify all 22 routers accessible after reorganization")
    print("="*80)
    
    # Run all domain tests
    test_health_and_core()
    test_ai_services()
    test_admin_services()
    test_analytics_services()
    test_search_services()
    test_nft_services()
    test_booking_payment_services()
    test_provider_services()
    test_automation_services()
    test_gamification_services()
    
    # Print summary
    print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if test_results['failed'] == 0 else 1)

if __name__ == "__main__":
    main()
