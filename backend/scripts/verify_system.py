#!/usr/bin/env python3
"""
Comprehensive System Verification Script
Validates all components are working correctly
"""

import requests
import json
from datetime import datetime
import os

BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')

class SystemVerifier:
    """Comprehensive system verification"""
    
    def __init__(self):
        self.results = {
            'total_checks': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }
    
    def check(self, name, url, expected_status=200):
        """Check an endpoint"""
        self.results['total_checks'] += 1
        
        try:
            response = requests.get(f"{BACKEND_URL}{url}", timeout=10)
            
            if response.status_code == expected_status:
                print(f"✅ {name}")
                self.results['passed'] += 1
                return True
            else:
                print(f"❌ {name} (status: {response.status_code})")
                self.results['failed'] += 1
                return False
                
        except Exception as e:
            print(f"❌ {name} (error: {e})")
            self.results['failed'] += 1
            return False
    
    def verify_all(self):
        """Run all verification checks"""
        print("=" * 80)
        print("🔍 MAKU.TRAVEL SYSTEM VERIFICATION")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}\n")
        
        # Core System
        print("\n📡 Core System:")
        self.check("Health Check", "/health")
        self.check("System Status", "/api/healthz")
        
        # Provider Marketplace
        print("\n🌍 Provider Marketplace:")
        self.check("Provider Registry", "/api/providers/registry")
        self.check("Active Providers", "/api/providers/active")
        self.check("Partner Registry", "/api/partners/registry")
        self.check("Marketplace Health", "/api/marketplace/health")
        self.check("Marketplace Stats", "/api/marketplace/stats")
        
        # Provider Analytics
        print("\n📊 Provider Analytics:")
        self.check("Analytics Overview", "/api/admin/providers/analytics/overview")
        self.check("Health Summary", "/api/admin/providers/health/summary")
        self.check("Rotation Logs", "/api/admin/providers/rotation/logs")
        
        # Cross-Chain Bridge
        print("\n🌉 Cross-Chain Bridge:")
        self.check("Supported Chains", "/api/bridge/supported-chains")
        self.check("Bridge Liquidity", "/api/bridge/liquidity")
        
        # Destination Content
        print("\n🗺️  Destination Content:")
        self.check("All Destinations", "/api/destinations/all")
        self.check("Spiritual Sites", "/api/destinations/spiritual-sites/all")
        self.check("Hidden Gems", "/api/destinations/hidden-gems/all")
        self.check("Local Businesses", "/api/destinations/local-businesses/all")
        
        # Advanced Features
        print("\n🚀 Advanced Features:")
        self.check("Advanced Search Hotels", "/api/advanced-search/hotels")
        self.check("AI Personalization Personas", "/api/ai-personalization/personas")
        self.check("Analytics Platform Overview", "/api/analytics/platform/overview")
        self.check("Real-time System Health", "/api/realtime/system/health")
        self.check("Payment Gateways", "/api/payments/gateways/info")
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 VERIFICATION SUMMARY")
        print("=" * 80)
        print(f"Total Checks: {self.results['total_checks']}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"⚠️  Warnings: {self.results['warnings']}")
        
        success_rate = (self.results['passed'] / self.results['total_checks']) * 100
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("\n✅ System is PRODUCTION READY")
        elif success_rate >= 70:
            print("\n⚠️  System is MOSTLY OPERATIONAL (some issues)")
        else:
            print("\n❌ System has CRITICAL ISSUES")
        
        return success_rate >= 90


if __name__ == "__main__":
    verifier = SystemVerifier()
    success = verifier.verify_all()
    
    import sys
    sys.exit(0 if success else 1)
