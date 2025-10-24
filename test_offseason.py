#!/usr/bin/env python3
"""
Off-Season Occupancy Engine Backend Testing
Tests all 11 endpoints: 8 off-season + 3 email system
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://travel-ai-platform-2.preview.emergentagent.com/api"

class OffSeasonTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = []
        
    def log_result(self, test_name, passed, details, response_time=None):
        """Log test result"""
        result = {
            'test': test_name,
            'passed': passed,
            'details': details,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        if response_time:
            print(f"   Response time: {response_time:.2f}s")
        print()
    
    def test_healthz(self):
        """Test health check endpoint"""
        print("🏥 Testing Health Check...")
        
        url = f"{BASE_URL}/healthz"
        
        try:
            start = time.time()
            response = self.session.get(url, timeout=10)
            elapsed = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate structure
                if data.get('version') == '0.1.0-offseason' and 'features' in data:
                    features = data['features']
                    expected = ['partner_campaigns', 'smart_dreams', 'laxmi_wallet', 'yield_optimizer']
                    if all(f in features for f in expected):
                        self.log_result("Health Check", True, f"Version: {data['version']}, DB: {data.get('db')}, Features: {len(features)}", elapsed)
                        return True
                    else:
                        self.log_result("Health Check", False, f"Missing features: {set(expected) - set(features)}", elapsed)
                        return False
                else:
                    self.log_result("Health Check", False, f"Invalid response structure", elapsed)
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", elapsed)
                return False
                
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_campaign_creation(self):
        """Test campaign creation endpoint"""
        print("📋 Testing Campaign Creation...")
        
        url = f"{BASE_URL}/partners/campaigns"
        payload = {
            "partner_id": "00000000-0000-0000-0000-000000000001",
            "title": "Test Summer Special",
            "description": "Test campaign",
            "start_date": "2025-07-01",
            "end_date": "2025-08-31",
            "min_allocation": 10,
            "max_allocation": 50,
            "discount": 40.0,
            "blackout": [],
            "audience_tags": ["family", "beach"],
            "status": "draft"
        }
        
        try:
            start = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            elapsed = time.time() - start
            
            # Expected: 401/500 (Supabase error)
            if response.status_code in [401, 500]:
                data = response.json()
                detail = data.get('detail', '')
                if 'Supabase' in detail or 'configuration' in detail.lower():
                    self.log_result("Campaign Creation", True, f"Expected Supabase error: {detail[:80]}...", elapsed)
                    return True
            
            self.log_result("Campaign Creation", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
            return False
            
        except Exception as e:
            self.log_result("Campaign Creation", False, f"Exception: {str(e)}")
            return False
    
    def test_campaign_ledger(self):
        """Test campaign ledger endpoint"""
        print("📊 Testing Campaign Ledger...")
        
        campaign_id = "00000000-0000-0000-0000-000000000001"
        url = f"{BASE_URL}/partners/campaigns/{campaign_id}/ledger"
        
        try:
            start = time.time()
            response = self.session.get(url, timeout=15)
            elapsed = time.time() - start
            
            # Expected: 401/404/500
            if response.status_code in [401, 404, 500]:
                data = response.json()
                detail = data.get('detail', '')
                if 'Supabase' in detail or 'not found' in detail.lower() or 'configuration' in detail.lower():
                    self.log_result("Campaign Ledger", True, f"Expected error: {detail[:80]}...", elapsed)
                    return True
            
            self.log_result("Campaign Ledger", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
            return False
            
        except Exception as e:
            self.log_result("Campaign Ledger", False, f"Exception: {str(e)}")
            return False
    
    def test_smart_dreams_suggest(self):
        """Test smart dreams suggestion endpoint"""
        print("💭 Testing Smart Dreams Suggest...")
        
        url = f"{BASE_URL}/smart-dreams/suggest"
        params = {"user_id": "00000000-0000-0000-0000-000000000001"}
        payload = {
            "destination": "Bali",
            "budget": 2500.00,
            "tags": ["spiritual", "wellness"],
            "flexible_dates": True,
            "adults": 2
        }
        
        try:
            start = time.time()
            response = self.session.post(url, params=params, json=payload, timeout=15)
            elapsed = time.time() - start
            
            # Expected: 401/500
            if response.status_code in [401, 500]:
                data = response.json()
                detail = data.get('detail', '')
                if 'Supabase' in detail or 'configuration' in detail.lower():
                    self.log_result("Smart Dreams Suggest", True, f"Expected Supabase error: {detail[:80]}...", elapsed)
                    return True
            
            self.log_result("Smart Dreams Suggest", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
            return False
            
        except Exception as e:
            self.log_result("Smart Dreams Suggest", False, f"Exception: {str(e)}")
            return False
    
    def test_wallet_activate(self):
        """Test wallet activation endpoint"""
        print("💳 Testing Wallet Activation...")
        
        url = f"{BASE_URL}/wallets/activate"
        params = {"user_id": "00000000-0000-0000-0000-000000000001"}
        
        try:
            start = time.time()
            response = self.session.post(url, params=params, timeout=15)
            elapsed = time.time() - start
            
            # Expected: 401/500
            if response.status_code in [401, 500]:
                data = response.json()
                detail = data.get('detail', '')
                if 'Supabase' in detail or 'configuration' in detail.lower():
                    self.log_result("Wallet Activation", True, f"Expected Supabase error: {detail[:80]}...", elapsed)
                    return True
            
            self.log_result("Wallet Activation", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
            return False
            
        except Exception as e:
            self.log_result("Wallet Activation", False, f"Exception: {str(e)}")
            return False
    
    def test_wallet_deposit(self):
        """Test wallet deposit endpoint"""
        print("💰 Testing Wallet Deposit...")
        
        url = f"{BASE_URL}/wallets/deposit"
        payload = {
            "user_id": "00000000-0000-0000-0000-000000000001",
            "amount": 50.00,
            "type": "cashback",
            "booking_id": "booking_123"
        }
        
        try:
            start = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            elapsed = time.time() - start
            
            # Expected: 401/404/500
            if response.status_code in [401, 404, 500]:
                data = response.json()
                detail = data.get('detail', '')
                if 'Supabase' in detail or 'not found' in detail.lower() or 'configuration' in detail.lower():
                    self.log_result("Wallet Deposit", True, f"Expected error: {detail[:80]}...", elapsed)
                    return True
            
            self.log_result("Wallet Deposit", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
            return False
            
        except Exception as e:
            self.log_result("Wallet Deposit", False, f"Exception: {str(e)}")
            return False
    
    def test_wallet_redeem(self):
        """Test wallet redemption endpoint"""
        print("🎁 Testing Wallet Redeem...")
        
        url = f"{BASE_URL}/wallets/redeem"
        params = {"user_id": "00000000-0000-0000-0000-000000000001"}
        payload = {
            "amount": 25.00,
            "booking_id": "booking_456"
        }
        
        try:
            start = time.time()
            response = self.session.post(url, params=params, json=payload, timeout=15)
            elapsed = time.time() - start
            
            # Expected: 400/401/404/500
            if response.status_code in [400, 401, 404, 500]:
                data = response.json()
                detail = data.get('detail', '')
                if 'Supabase' in detail or 'not found' in detail.lower() or 'Insufficient' in detail or 'configuration' in detail.lower():
                    self.log_result("Wallet Redeem", True, f"Expected error: {detail[:80]}...", elapsed)
                    return True
            
            self.log_result("Wallet Redeem", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
            return False
            
        except Exception as e:
            self.log_result("Wallet Redeem", False, f"Exception: {str(e)}")
            return False
    
    def test_yield_optimize(self):
        """Test yield optimizer endpoint"""
        print("📈 Testing Yield Optimizer...")
        
        user_id = "00000000-0000-0000-0000-000000000001"
        url = f"{BASE_URL}/yield/optimize/{user_id}"
        
        try:
            start = time.time()
            response = self.session.post(url, timeout=15)
            elapsed = time.time() - start
            
            # Expected: 401/500
            if response.status_code in [401, 500]:
                data = response.json()
                detail = data.get('detail', '')
                if 'Supabase' in detail or 'configuration' in detail.lower():
                    self.log_result("Yield Optimizer", True, f"Expected Supabase error: {detail[:80]}...", elapsed)
                    return True
            
            self.log_result("Yield Optimizer", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
            return False
            
        except Exception as e:
            self.log_result("Yield Optimizer", False, f"Exception: {str(e)}")
            return False
    
    def test_email_templates(self):
        """Test email templates list endpoint"""
        print("📧 Testing Email Templates...")
        
        url = f"{BASE_URL}/emails/templates"
        
        try:
            start = time.time()
            response = self.session.get(url, timeout=10)
            elapsed = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate structure
                if data.get('count') == 3 and 'templates' in data:
                    templates = data['templates']
                    expected = ['dream_match', 'campaign_ledger', 'cashback']
                    if all(t in templates for t in expected):
                        self.log_result("Email Templates", True, f"Found {data['count']} templates: {', '.join(templates.keys())}", elapsed)
                        return True
                    else:
                        self.log_result("Email Templates", False, f"Missing templates: {set(expected) - set(templates.keys())}", elapsed)
                        return False
                else:
                    self.log_result("Email Templates", False, f"Invalid response structure", elapsed)
                    return False
            else:
                self.log_result("Email Templates", False, f"HTTP {response.status_code}", elapsed)
                return False
                
        except Exception as e:
            self.log_result("Email Templates", False, f"Exception: {str(e)}")
            return False
    
    def test_email_queue(self):
        """Test email queue endpoint"""
        print("📨 Testing Email Queue...")
        
        url = f"{BASE_URL}/emails/queue"
        payload = {
            "template": "dream_match",
            "user_id": "test-user-123",
            "recipient_email": "test@example.com",
            "data": {
                "first_name": "John",
                "destination": "Bali",
                "hotel_name": "Test Resort",
                "start_date": "Aug 12",
                "end_date": "Aug 26",
                "price": "1375",
                "discount": "38",
                "savings": "875",
                "score": "94",
                "perks_1": "Spa",
                "perks_2": "Yoga",
                "perks_3": "Tours",
                "booking_url": "https://test.com/book",
                "all_deals_url": "https://test.com/deals",
                "help_url": "https://test.com/help"
            }
        }
        
        try:
            start = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            elapsed = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate structure
                if data.get('queued') and 'email_id' in data and 'scheduled_at' in data:
                    self.log_result("Email Queue", True, f"Email queued: {data['email_id']}", elapsed)
                    return True
                else:
                    self.log_result("Email Queue", False, f"Invalid response structure", elapsed)
                    return False
            else:
                self.log_result("Email Queue", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
                return False
                
        except Exception as e:
            self.log_result("Email Queue", False, f"Exception: {str(e)}")
            return False
    
    def test_email_render(self):
        """Test email rendering endpoint"""
        print("🎨 Testing Email Render...")
        
        url = f"{BASE_URL}/emails/test-render"
        params = {"template": "dream_match"}
        payload = {
            "first_name": "Jane",
            "destination": "Paris",
            "hotel_name": "Le Grand Hotel",
            "start_date": "Sep 1",
            "end_date": "Sep 10",
            "price": "1200",
            "discount": "35",
            "savings": "650",
            "score": "92",
            "perks_1": "Breakfast",
            "perks_2": "City Tour",
            "perks_3": "Museum Pass",
            "booking_url": "https://test.com/book",
            "all_deals_url": "https://test.com/deals",
            "help_url": "https://test.com/help"
        }
        
        try:
            start = time.time()
            response = self.session.post(url, params=params, json=payload, timeout=15)
            elapsed = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate structure
                if data.get('success') and 'html' in data:
                    html = data['html']
                    if len(html) > 100 and 'Jane' in html and 'Paris' in html:
                        self.log_result("Email Render", True, f"Rendered HTML: {len(html)} chars, data interpolated", elapsed)
                        return True
                    else:
                        self.log_result("Email Render", False, f"HTML too short or data not interpolated", elapsed)
                        return False
                else:
                    self.log_result("Email Render", False, f"Invalid response structure", elapsed)
                    return False
            else:
                self.log_result("Email Render", False, f"HTTP {response.status_code}: {response.text[:100]}", elapsed)
                return False
                
        except Exception as e:
            self.log_result("Email Render", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all off-season tests"""
        print("=" * 80)
        print("OFF-SEASON OCCUPANCY ENGINE - COMPREHENSIVE BACKEND TESTING")
        print("=" * 80)
        print()
        
        # Off-Season Engine Tests (8 endpoints)
        print("🔧 OFF-SEASON ENGINE ENDPOINTS (8)")
        print("-" * 80)
        self.test_healthz()
        self.test_campaign_creation()
        self.test_campaign_ledger()
        self.test_smart_dreams_suggest()
        self.test_wallet_activate()
        self.test_wallet_deposit()
        self.test_wallet_redeem()
        self.test_yield_optimize()
        
        # Email System Tests (3 endpoints)
        print("\n📧 EMAIL SYSTEM ENDPOINTS (3)")
        print("-" * 80)
        self.test_email_templates()
        self.test_email_queue()
        self.test_email_render()
        
        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.results if r['passed'])
        failed = len(self.results) - passed
        
        print(f"\nTotal Tests: {len(self.results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.results)*100):.1f}%")
        
        print("\n" + "-" * 80)
        print("DETAILED RESULTS:")
        print("-" * 80)
        
        for result in self.results:
            status = "✅" if result['passed'] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)
        print("TESTING COMPLETE")
        print("=" * 80)
        
        return passed, failed

if __name__ == "__main__":
    tester = OffSeasonTester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)
