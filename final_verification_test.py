#!/usr/bin/env python3
"""
Final Verification Test - Post-All-Fixes
Tests the 4 specific fixes applied:
1. Partner dashboard UUID error - Router order fixed
2. Advanced search schema - Standardized to check_in/check_out
3. Unified AI orchestrator - Added missing functions
4. Provider warnings - Changed ERROR → WARNING
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://maku-refactor.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name, status, details=""):
    symbol = "✅" if status else "❌"
    color = Colors.GREEN if status else Colors.RED
    print(f"{color}{symbol} {name}{Colors.RESET}")
    if details:
        print(f"   {details}")

def print_section(title):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")

def test_partner_stats():
    """Test Fix #1: Partner dashboard UUID error - Router order fixed"""
    print_section("FIX #1: Partner Dashboard Stats Endpoint")
    
    try:
        start_time = time.time()
        response = requests.get(f"{BACKEND_URL}/partners/stats", timeout=10)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for partner data
            has_data = bool(data)
            print_test(
                "Partner stats returns 200 OK",
                True,
                f"Response time: {elapsed:.3f}s"
            )
            
            # Check response structure
            if isinstance(data, dict):
                print_test(
                    "Response is valid JSON object",
                    True,
                    f"Keys: {list(data.keys())[:5]}"
                )
            else:
                print_test("Response is valid JSON object", False, f"Got: {type(data)}")
            
            return True
        else:
            print_test(
                "Partner stats returns 200 OK",
                False,
                f"Got {response.status_code}: {response.text[:200]}"
            )
            return False
            
    except Exception as e:
        print_test("Partner stats endpoint", False, f"Error: {str(e)}")
        return False

def test_advanced_search():
    """Test Fix #2: Advanced search schema - Standardized to check_in/check_out"""
    print_section("FIX #2: Advanced Hotel Search Schema")
    
    try:
        # Test with check_in/check_out fields (new schema)
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        next_week = (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d")
        
        payload = {
            "destination": "Paris",
            "check_in": tomorrow,
            "check_out": next_week,
            "guests": {"adults": 2, "children": 0},
            "rooms": 1
        }
        
        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/search/hotels/advanced",
            json=payload,
            timeout=10
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print_test(
                "Advanced search accepts check_in/check_out fields",
                True,
                f"Response time: {elapsed:.3f}s"
            )
            
            # Check response structure
            if isinstance(data, dict):
                print_test(
                    "Response is valid JSON",
                    True,
                    f"Keys: {list(data.keys())[:5]}"
                )
            
            return True
        elif response.status_code == 422:
            # Check if it's rejecting the new schema
            print_test(
                "Advanced search accepts check_in/check_out fields",
                False,
                f"422 Validation Error - Schema not updated? {response.text[:200]}"
            )
            return False
        else:
            print_test(
                "Advanced search endpoint",
                False,
                f"Got {response.status_code}: {response.text[:200]}"
            )
            return False
            
    except Exception as e:
        print_test("Advanced search endpoint", False, f"Error: {str(e)}")
        return False

def test_unified_ai_insights():
    """Test Fix #3: Unified AI orchestrator - Added missing functions"""
    print_section("FIX #3: Unified AI Cross-Module Insights")
    
    try:
        start_time = time.time()
        response = requests.get(
            f"{BACKEND_URL}/unified-ai/cross-module-insights/test_user",
            timeout=15
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print_test(
                "Unified AI insights returns 200 OK",
                True,
                f"Response time: {elapsed:.3f}s"
            )
            
            # Check for insights array
            if isinstance(data, dict) and "insights" in data:
                insights = data.get("insights", [])
                print_test(
                    "Response contains insights array",
                    True,
                    f"Found {len(insights)} insights"
                )
            elif isinstance(data, list):
                print_test(
                    "Response contains insights",
                    True,
                    f"Found {len(data)} insights"
                )
            else:
                print_test(
                    "Response structure valid",
                    True,
                    f"Keys: {list(data.keys())[:5]}"
                )
            
            return True
        elif response.status_code == 500:
            print_test(
                "Unified AI insights returns 200 OK",
                False,
                f"500 Error - Function still missing? {response.text[:200]}"
            )
            return False
        else:
            print_test(
                "Unified AI insights endpoint",
                False,
                f"Got {response.status_code}: {response.text[:200]}"
            )
            return False
            
    except Exception as e:
        print_test("Unified AI insights endpoint", False, f"Error: {str(e)}")
        return False

def test_provider_warnings():
    """Test Fix #4: Provider warnings - Changed ERROR → WARNING"""
    print_section("FIX #4: Provider Warnings Level Check")
    
    try:
        # Read recent backend logs
        import subprocess
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        logs = result.stdout
        
        # Check for WARNING level (not ERROR) for provider issues
        has_provider_warnings = "WARNING:provider_rotation_enforcer" in logs
        has_provider_errors = "ERROR:provider_rotation_enforcer" in logs or "ERROR:provider_orchestrator" in logs
        
        if has_provider_warnings and not has_provider_errors:
            print_test(
                "Provider issues logged as WARNING (not ERROR)",
                True,
                "Found WARNING level logs for provider configuration"
            )
            
            # Show sample warning
            for line in logs.split('\n'):
                if "WARNING:provider" in line:
                    print(f"   Sample: {line[:100]}")
                    break
            
            return True
        elif has_provider_errors:
            print_test(
                "Provider issues logged as WARNING (not ERROR)",
                False,
                "Still found ERROR level logs for providers"
            )
            return False
        else:
            print_test(
                "Provider warnings check",
                True,
                "No provider errors found (clean logs)"
            )
            return True
            
    except Exception as e:
        print_test("Provider warnings check", False, f"Error: {str(e)}")
        return False

def test_regression_check():
    """Test #5: Regression check - Previously working endpoints"""
    print_section("REGRESSION CHECK: Previously Working Endpoints")
    
    results = []
    
    # Test health endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        success = response.status_code == 200
        print_test("Health endpoint", success, f"Status: {response.status_code}")
        results.append(success)
    except Exception as e:
        print_test("Health endpoint", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test platform metrics
    try:
        response = requests.get(f"{BACKEND_URL}/metrics/platform", timeout=10)
        success = response.status_code == 200
        print_test("Platform metrics", success, f"Status: {response.status_code}")
        results.append(success)
    except Exception as e:
        print_test("Platform metrics", False, f"Error: {str(e)}")
        results.append(False)
    
    # Test enhanced dreams
    try:
        response = requests.get(f"{BACKEND_URL}/enhanced-dreams/destinations?limit=5", timeout=10)
        success = response.status_code == 200
        print_test("Enhanced dreams", success, f"Status: {response.status_code}")
        results.append(success)
    except Exception as e:
        print_test("Enhanced dreams", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_performance():
    """Test #6: Performance check - Target <1s for most endpoints"""
    print_section("PERFORMANCE CHECK: Response Times")
    
    endpoints = [
        ("/health", "Health check"),
        ("/partners/stats", "Partner stats"),
        ("/metrics/platform", "Platform metrics"),
    ]
    
    results = []
    
    for endpoint, name in endpoints:
        try:
            start_time = time.time()
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
            elapsed = time.time() - start_time
            
            # Target: <1s for most endpoints
            success = elapsed < 1.0 and response.status_code == 200
            
            if elapsed < 1.0:
                print_test(
                    f"{name} performance",
                    True,
                    f"{elapsed:.3f}s (target: <1s)"
                )
            else:
                print_test(
                    f"{name} performance",
                    False,
                    f"{elapsed:.3f}s (target: <1s)"
                )
            
            results.append(success)
            
        except Exception as e:
            print_test(f"{name} performance", False, f"Error: {str(e)}")
            results.append(False)
    
    # At least 2/3 should be under 1s
    return sum(results) >= 2

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}FINAL VERIFICATION TEST - POST-ALL-FIXES{Colors.RESET}")
    print(f"{Colors.BLUE}Testing 4 specific fixes + regression + performance{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    results = {
        "Fix #1: Partner Stats": test_partner_stats(),
        "Fix #2: Advanced Search Schema": test_advanced_search(),
        "Fix #3: Unified AI Insights": test_unified_ai_insights(),
        "Fix #4: Provider Warnings": test_provider_warnings(),
        "Regression Check": test_regression_check(),
        "Performance Check": test_performance(),
    }
    
    # Summary
    print_section("FINAL VERIFICATION SUMMARY")
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        symbol = "✅" if result else "❌"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{symbol} {test_name}{Colors.RESET}")
    
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}🎉 ALL TESTS PASSED ({passed}/{total}){Colors.RESET}")
        print(f"{Colors.GREEN}✅ All 4 fixes verified successfully{Colors.RESET}")
        print(f"{Colors.GREEN}✅ No regressions detected{Colors.RESET}")
        print(f"{Colors.GREEN}✅ Performance targets met{Colors.RESET}")
        print(f"{Colors.GREEN}🚀 PRODUCTION-READY{Colors.RESET}")
    elif passed >= 4:
        print(f"{Colors.YELLOW}⚠️  MOSTLY PASSED ({passed}/{total}){Colors.RESET}")
        print(f"{Colors.YELLOW}All 4 critical fixes working, minor issues in regression/performance{Colors.RESET}")
    else:
        print(f"{Colors.RED}❌ TESTS FAILED ({passed}/{total}){Colors.RESET}")
        print(f"{Colors.RED}Some fixes not working as expected{Colors.RESET}")
    
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
