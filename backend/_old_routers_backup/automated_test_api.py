from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import asyncio
import httpx
import time
from datetime import datetime

router = APIRouter(prefix="/api/automated-tests", tags=["automated-tests"])

class TestResult(BaseModel):
    name: str
    endpoint: str
    status: str
    duration_ms: int
    http_status: int
    error: str = None
    response_sample: Any = None

class TestSuiteResult(BaseModel):
    suite_name: str
    total_tests: int
    passed: int
    failed: int
    duration_ms: int
    tests: List[TestResult]

class AutomatedTestReport(BaseModel):
    timestamp: str
    total_tests: int
    total_passed: int
    total_failed: int
    success_rate: float
    total_duration_ms: int
    suites: List[TestSuiteResult]

@router.post("/run-all", response_model=AutomatedTestReport)
async def run_all_automated_tests():
    """Run comprehensive automated test suite"""
    start_time = time.time()
    
    # Define test suites
    test_config = [
        {
            "suite_name": "System Health",
            "tests": [
                {"name": "Health Check", "endpoint": "/api/health"},
                {"name": "System Status", "endpoint": "/api/status"},
                {"name": "Real-time Health", "endpoint": "/api/realtime/system/health"}
            ]
        },
        {
            "suite_name": "Analytics",
            "tests": [
                {"name": "Platform Overview", "endpoint": "/api/analytics/overview"},
                {"name": "Real-time Metrics", "endpoint": "/api/analytics/realtime"},
                {"name": "Booking Funnel", "endpoint": "/api/analytics/booking-funnel"},
                {"name": "Provider Performance", "endpoint": "/api/analytics/providers/performance"}
            ]
        },
        {
            "suite_name": "Provider System",
            "tests": [
                {"name": "Provider Analytics", "endpoint": "/api/admin/providers/analytics/overview"},
                {"name": "Provider Health", "endpoint": "/api/admin/providers/health/summary"},
                {"name": "Provider Registry", "endpoint": "/api/providers/registry"},
                {"name": "Active Providers", "endpoint": "/api/providers/active"}
            ]
        },
        {
            "suite_name": "Partner Dashboard",
            "tests": [
                {"name": "Partner Stats", "endpoint": "/api/partners/stats"},
                {"name": "Opportunities", "endpoint": "/api/partners/opportunities"},
                {"name": "Campaigns", "endpoint": "/api/partners/campaigns"},
                {"name": "Settlements", "endpoint": "/api/partners/settlements"}
            ]
        },
        {
            "suite_name": "Payment & Booking",
            "tests": [
                {"name": "Payment Methods", "endpoint": "/api/payments/methods/available?currency=usd"},
                {"name": "Gateway Info", "endpoint": "/api/payments/gateways/info"},
                {"name": "Bookings", "endpoint": "/api/bookings"}
            ]
        },
        {
            "suite_name": "Search & AI",
            "tests": [
                {"name": "Unified Search", "endpoint": "/api/unified-search?search_type=hotel&destination=Paris"},
                {"name": "Search Suggestions", "endpoint": "/api/advanced-search/suggestions?query=paris"}
            ]
        }
    ]
    
    results_suites = []
    total_tests = 0
    total_passed = 0
    total_failed = 0
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for suite_config in test_config:
            suite_start = time.time()
            test_results = []
            suite_passed = 0
            suite_failed = 0
            
            for test_def in suite_config["tests"]:
                test_start = time.time()
                total_tests += 1
                
                try:
                    response = await client.get(
                        f"http://localhost:8001{test_def['endpoint']}"
                    )
                    duration_ms = int((time.time() - test_start) * 1000)
                    
                    if 200 <= response.status_code < 400:
                        status = "passed"
                        suite_passed += 1
                        total_passed += 1
                    else:
                        status = "failed"
                        suite_failed += 1
                        total_failed += 1
                    
                    # Get sample of response
                    try:
                        response_json = response.json()
                        if isinstance(response_json, dict):
                            sample = {k: v for k, v in list(response_json.items())[:3]}
                        elif isinstance(response_json, list):
                            sample = {"count": len(response_json), "sample": response_json[:2] if response_json else []}
                        else:
                            sample = str(response_json)[:100]
                    except:
                        sample = None
                    
                    test_results.append(TestResult(
                        name=test_def["name"],
                        endpoint=test_def["endpoint"],
                        status=status,
                        duration_ms=duration_ms,
                        http_status=response.status_code,
                        response_sample=sample
                    ))
                    
                except Exception as e:
                    duration_ms = int((time.time() - test_start) * 1000)
                    suite_failed += 1
                    total_failed += 1
                    
                    test_results.append(TestResult(
                        name=test_def["name"],
                        endpoint=test_def["endpoint"],
                        status="failed",
                        duration_ms=duration_ms,
                        http_status=0,
                        error=str(e)
                    ))
            
            suite_duration = int((time.time() - suite_start) * 1000)
            results_suites.append(TestSuiteResult(
                suite_name=suite_config["suite_name"],
                total_tests=len(test_results),
                passed=suite_passed,
                failed=suite_failed,
                duration_ms=suite_duration,
                tests=test_results
            ))
    
    total_duration_ms = int((time.time() - start_time) * 1000)
    success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    return AutomatedTestReport(
        timestamp=datetime.utcnow().isoformat(),
        total_tests=total_tests,
        total_passed=total_passed,
        total_failed=total_failed,
        success_rate=round(success_rate, 2),
        total_duration_ms=total_duration_ms,
        suites=results_suites
    )

@router.get("/health")
async def test_runner_health():
    """Health check for test runner"""
    return {"status": "healthy", "message": "Automated test runner is operational"}
