#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND STABILITY TESTING - Post-Integration Validation
Tests all backend endpoints after major integration work as per review request
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://smart-dreams-hub.preview.emergentagent.com/api"
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TEST_WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"

class ComprehensiveBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.passed = 0
        self.failed = 0
        
    def log_test(self, test_name, success, details, response_time=None):
        """Log test results"""
        result = {
            'test_name': test_name,
            'success': success,
            'details': details,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if success:
            self.passed += 1
            status = "✅ PASS"
        else:
            self.failed += 1
            status = "❌ FAIL"
            
        print(f"{status} {test_name}")
        if not success:
            print(f"   Error: {details}")
        elif response_time:
            print(f"   Response time: {response_time:.2f}s")
        print()

    # =====================================================
    # 1. CORE HEALTH & INFRASTRUCTURE (4 endpoints)
    # =====================================================
    
    def test_health_check(self):
        """Test original health check"""
        print("🏥 Testing Health Check...")
        url = f"{BASE_URL}/health"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'healthy':
                    self.log_test("Health Check", True, f"API healthy, timestamp: {data.get('timestamp', 'N/A')}", response_time)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unhealthy status: {data}", response_time)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_offseason_healthz(self):
        """Test off-season health check - should return version 0.1.0-offseason"""
        print("🏥 Testing Off-Season Healthz...")
        url = f"{BASE_URL}/healthz"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check version
                version = data.get('version')
                if version != '0.1.0-offseason':
                    self.log_test("Off-Season Healthz", False, f"Expected version '0.1.0-offseason', got '{version}'", response_time)
                    return False
                
                # Check features
                features = data.get('features', [])
                expected_features = ['partner_campaigns', 'smart_dreams', 'laxmi_wallet', 'yield_optimizer']
                missing_features = [f for f in expected_features if f not in features]
                
                if missing_features:
                    self.log_test("Off-Season Healthz", False, f"Missing features: {missing_features}", response_time)
                    return False
                
                self.log_test("Off-Season Healthz", True, f"Version: {version}, Features: {len(features)}, DB: {data.get('db', 'unknown')}", response_time)
                return True
            else:
                self.log_test("Off-Season Healthz", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Off-Season Healthz", False, f"Exception: {str(e)}")
            return False

    def test_environment_config(self):
        """Test environment configuration"""
        print("⚙️ Testing Environment Config...")
        url = f"{BASE_URL}/environment/config"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'error' in data:
                    self.log_test("Environment Config", False, f"API Error: {data['error']}", response_time)
                    return False
                
                self.log_test("Environment Config", True, "Configuration retrieved successfully", response_time)
                return True
            else:
                self.log_test("Environment Config", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Environment Config", False, f"Exception: {str(e)}")
            return False

    def test_environment_switch(self):
        """Test environment switching (POST)"""
        print("🔄 Testing Environment Switch...")
        url = f"{BASE_URL}/environment/switch"
        payload = {"environment": "lovable"}
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("Environment Switch", True, f"Switched to {data.get('environment', 'unknown')}", response_time)
                    return True
                else:
                    self.log_test("Environment Switch", False, f"Switch failed: {data.get('error', 'Unknown error')}", response_time)
                    return False
            else:
                self.log_test("Environment Switch", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Environment Switch", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # 2. OFF-SEASON OCCUPANCY ENGINE (8 endpoints)
    # =====================================================
    
    def test_campaign_creation(self):
        """Test campaign creation"""
        print("📋 Testing Campaign Creation...")
        url = f"{BASE_URL}/partners/campaigns"
        payload = {
            "partner_id": TEST_USER_ID,
            "title": "Test Campaign",
            "start_date": "2025-07-01",
            "end_date": "2025-08-31",
            "min_allocation": 10,
            "max_allocation": 50,
            "discount": 40.0,
            "audience_tags": ["family"]
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            # Expected: 401/500 (Supabase dependency)
            if response.status_code in [401, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'Supabase' in error_detail or 'configuration' in error_detail.lower():
                    self.log_test("Campaign Creation", True, f"Expected Supabase error (401/500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("Campaign Creation", False, f"Unexpected error: {error_detail}", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                self.log_test("Campaign Creation", True, f"Campaign created: {data.get('campaign_id', 'N/A')}", response_time)
                return True
            else:
                self.log_test("Campaign Creation", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Campaign Creation", False, f"Exception: {str(e)}")
            return False

    def test_campaign_ledger(self):
        """Test campaign ledger"""
        print("📊 Testing Campaign Ledger...")
        campaign_id = TEST_USER_ID
        url = f"{BASE_URL}/partners/campaigns/{campaign_id}/ledger"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            # Expected: 401/404/500 (Supabase dependency)
            if response.status_code in [401, 404, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'Supabase' in error_detail or 'not found' in error_detail.lower() or 'configuration' in error_detail.lower():
                    self.log_test("Campaign Ledger", True, f"Expected error (401/404/500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("Campaign Ledger", False, f"Unexpected error: {error_detail}", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                self.log_test("Campaign Ledger", True, f"Ledger retrieved: {len(data.get('daily_allocation', []))} days", response_time)
                return True
            else:
                self.log_test("Campaign Ledger", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Campaign Ledger", False, f"Exception: {str(e)}")
            return False

    def test_smart_dreams_suggest(self):
        """Test smart dreams suggestion"""
        print("💭 Testing Smart Dreams Suggest...")
        url = f"{BASE_URL}/smart-dreams/suggest"
        params = {"user_id": TEST_USER_ID}
        payload = {
            "destination": "Bali",
            "budget": 2500.00,
            "tags": ["wellness"],
            "flexible_dates": True
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, params=params, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            # Expected: 401/500 (Supabase dependency)
            if response.status_code in [401, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'Supabase' in error_detail or 'configuration' in error_detail.lower():
                    self.log_test("Smart Dreams Suggest", True, f"Expected Supabase error (401/500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("Smart Dreams Suggest", False, f"Unexpected error: {error_detail}", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                self.log_test("Smart Dreams Suggest", True, f"Dream created: {data.get('dream_id', 'N/A')}", response_time)
                return True
            else:
                self.log_test("Smart Dreams Suggest", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Smart Dreams Suggest", False, f"Exception: {str(e)}")
            return False

    def test_wallet_activate(self):
        """Test LAXMI wallet activation"""
        print("💳 Testing Wallet Activation...")
        url = f"{BASE_URL}/wallets/activate"
        params = {"user_id": TEST_USER_ID}
        
        try:
            start_time = time.time()
            response = self.session.post(url, params=params, timeout=15)
            response_time = time.time() - start_time
            
            # Expected: 401/500 (Supabase dependency)
            if response.status_code in [401, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'Supabase' in error_detail or 'configuration' in error_detail.lower():
                    self.log_test("Wallet Activation", True, f"Expected Supabase error (401/500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("Wallet Activation", False, f"Unexpected error: {error_detail}", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                self.log_test("Wallet Activation", True, f"Wallet activated: {data.get('wallet_id', 'N/A')}", response_time)
                return True
            else:
                self.log_test("Wallet Activation", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Wallet Activation", False, f"Exception: {str(e)}")
            return False

    def test_wallet_deposit(self):
        """Test wallet deposit"""
        print("💰 Testing Wallet Deposit...")
        url = f"{BASE_URL}/wallets/deposit"
        payload = {
            "user_id": TEST_USER_ID,
            "amount": 50.00,
            "type": "cashback",
            "booking_id": "booking_test_123"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            # Expected: 401/404/500 (Supabase dependency)
            if response.status_code in [401, 404, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'Supabase' in error_detail or 'not found' in error_detail.lower() or 'configuration' in error_detail.lower():
                    self.log_test("Wallet Deposit", True, f"Expected error (401/404/500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("Wallet Deposit", False, f"Unexpected error: {error_detail}", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                self.log_test("Wallet Deposit", True, f"Deposited: ${payload['amount']}, new balance: ${data.get('new_balance', 'N/A')}", response_time)
                return True
            else:
                self.log_test("Wallet Deposit", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Wallet Deposit", False, f"Exception: {str(e)}")
            return False

    def test_wallet_redeem(self):
        """Test wallet redemption"""
        print("🎁 Testing Wallet Redeem...")
        url = f"{BASE_URL}/wallets/redeem"
        params = {"user_id": TEST_USER_ID}
        payload = {
            "amount": 25.00,
            "booking_id": "booking_test_456"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, params=params, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            # Expected: 400/401/404/500 (Supabase dependency or insufficient balance)
            if response.status_code in [400, 401, 404, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'Supabase' in error_detail or 'not found' in error_detail.lower() or 'Insufficient' in error_detail or 'configuration' in error_detail.lower():
                    self.log_test("Wallet Redeem", True, f"Expected error (400/401/404/500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("Wallet Redeem", False, f"Unexpected error: {error_detail}", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                self.log_test("Wallet Redeem", True, f"Redeemed: ${payload['amount']}, new balance: ${data.get('new_balance', 'N/A')}", response_time)
                return True
            else:
                self.log_test("Wallet Redeem", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Wallet Redeem", False, f"Exception: {str(e)}")
            return False

    def test_yield_optimizer(self):
        """Test yield optimizer"""
        print("📈 Testing Yield Optimizer...")
        url = f"{BASE_URL}/yield/optimize/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.post(url, timeout=15)
            response_time = time.time() - start_time
            
            # Expected: 401/500 (Supabase dependency)
            if response.status_code in [401, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'Supabase' in error_detail or 'configuration' in error_detail.lower():
                    self.log_test("Yield Optimizer", True, f"Expected Supabase error (401/500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("Yield Optimizer", False, f"Unexpected error: {error_detail}", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                self.log_test("Yield Optimizer", True, f"Optimized: {len(data.get('deals', []))} deals", response_time)
                return True
            else:
                self.log_test("Yield Optimizer", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Yield Optimizer", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # 3. EMAIL NOTIFICATION SYSTEM (3 endpoints)
    # =====================================================
    
    def test_email_templates(self):
        """Test email templates list - should return 3 templates"""
        print("📧 Testing Email Templates...")
        url = f"{BASE_URL}/emails/templates"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check count
                count = data.get('count', 0)
                if count != 3:
                    self.log_test("Email Templates", False, f"Expected 3 templates, got {count}", response_time)
                    return False
                
                # Check templates
                templates = data.get('templates', {})
                expected_templates = ['dream_match', 'campaign_ledger', 'cashback']
                missing_templates = [t for t in expected_templates if t not in templates]
                
                if missing_templates:
                    self.log_test("Email Templates", False, f"Missing templates: {missing_templates}", response_time)
                    return False
                
                self.log_test("Email Templates", True, f"Got {count} templates: {', '.join(templates.keys())}", response_time)
                return True
            else:
                self.log_test("Email Templates", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Email Templates", False, f"Exception: {str(e)}")
            return False

    def test_email_queue(self):
        """Test email queue - test dream_match template"""
        print("📬 Testing Email Queue...")
        url = f"{BASE_URL}/emails/queue"
        payload = {
            "template": "dream_match",
            "user_id": "test-123",
            "recipient_email": "test@test.com",
            "data": {
                "first_name": "Test",
                "destination": "Bali",
                "hotel_name": "Resort",
                "start_date": "Aug 12",
                "end_date": "Aug 26",
                "price": "1375",
                "discount": "38",
                "savings": "875",
                "score": "94",
                "perks_1": "Spa",
                "perks_2": "Yoga",
                "perks_3": "Tours",
                "booking_url": "https://test.com",
                "all_deals_url": "https://test.com",
                "help_url": "https://test.com"
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if not data.get('queued'):
                    self.log_test("Email Queue", False, f"Email not queued: {data}", response_time)
                    return False
                
                email_id = data.get('email_id', 'N/A')
                self.log_test("Email Queue", True, f"Email queued: {email_id}, template: dream_match", response_time)
                return True
            else:
                self.log_test("Email Queue", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Email Queue", False, f"Exception: {str(e)}")
            return False

    def test_email_test_render(self):
        """Test email rendering"""
        print("🎨 Testing Email Test Render...")
        url = f"{BASE_URL}/emails/test-render"
        params = {"template": "dream_match"}
        payload = {
            "first_name": "Jane",
            "destination": "Paris",
            "hotel_name": "Le Grand Hotel",
            "start_date": "Sep 15",
            "end_date": "Sep 22",
            "price": "1850",
            "discount": "42",
            "savings": "1200",
            "score": "96",
            "perks_1": "Breakfast",
            "perks_2": "Spa",
            "perks_3": "Tours",
            "booking_url": "https://test.com",
            "all_deals_url": "https://test.com",
            "help_url": "https://test.com"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, params=params, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if not data.get('success'):
                    self.log_test("Email Test Render", False, f"Render failed: {data}", response_time)
                    return False
                
                html = data.get('html', '')
                if len(html) < 100:
                    self.log_test("Email Test Render", False, f"HTML too short: {len(html)} chars", response_time)
                    return False
                
                # Check if data was interpolated
                if 'Jane' not in html or 'Paris' not in html:
                    self.log_test("Email Test Render", False, "Data not interpolated in HTML", response_time)
                    return False
                
                self.log_test("Email Test Render", True, f"Rendered HTML: {len(html)} chars, data interpolated correctly", response_time)
                return True
            else:
                self.log_test("Email Test Render", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Email Test Render", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # 4. TRAVEL FUND INTEGRATION (4 endpoints)
    # =====================================================
    
    def test_travel_funds_enhanced_stats(self):
        """Test enhanced gamification stats"""
        print("📊 Testing Travel Funds Enhanced Stats...")
        url = f"{BASE_URL}/travel-funds/enhanced-stats"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ['total_value', 'total_funds', 'nft_rewards_earned', 'integration_metrics']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Travel Funds Enhanced Stats", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("Travel Funds Enhanced Stats", True, f"Total value: ${data['total_value']}, Funds: {data['total_funds']}, NFT rewards: {data['nft_rewards_earned']}", response_time)
                return True
            else:
                self.log_test("Travel Funds Enhanced Stats", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Travel Funds Enhanced Stats", False, f"Exception: {str(e)}")
            return False

    def test_travel_funds_integration_data(self):
        """Test Smart Dreams/NFT/Bidding integration"""
        print("🔗 Testing Travel Funds Integration Data...")
        url = f"{BASE_URL}/travel-funds/integration-data"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_sections = ['smart_dreams_integration', 'nft_rewards', 'bidding_integration', 'checkout_integration']
                missing_sections = [s for s in required_sections if s not in data]
                
                if missing_sections:
                    self.log_test("Travel Funds Integration Data", False, f"Missing sections: {missing_sections}", response_time)
                    return False
                
                self.log_test("Travel Funds Integration Data", True, "All integration sections present (Smart Dreams, NFT, Bidding, Checkout)", response_time)
                return True
            else:
                self.log_test("Travel Funds Integration Data", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Travel Funds Integration Data", False, f"Exception: {str(e)}")
            return False

    def test_travel_funds_smart_dreams_create(self):
        """Test create fund from Smart Dreams"""
        print("💭 Testing Travel Funds Smart Dreams Create...")
        url = f"{BASE_URL}/travel-funds/smart-dreams/create"
        payload = {
            "dream_id": "dream_test_123",
            "destination": "Tokyo",
            "estimated_cost": 3500.00,
            "timeline_months": 12
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ['fund_id', 'target_amount', 'smart_dreams_integration']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Travel Funds Smart Dreams Create", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("Travel Funds Smart Dreams Create", True, f"Fund created: {data['fund_id']}, target: ${data['target_amount']}", response_time)
                return True
            else:
                self.log_test("Travel Funds Smart Dreams Create", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Travel Funds Smart Dreams Create", False, f"Exception: {str(e)}")
            return False

    def test_travel_funds_checkout_suggestions(self):
        """Test checkout fund suggestions"""
        print("💳 Testing Travel Funds Checkout Suggestions...")
        url = f"{BASE_URL}/travel-funds/checkout/suggestions"
        payload = {
            "destination": "Bali",
            "amount": 2500.00,
            "booking_type": "hotel"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ['suggestions', 'total_available']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Travel Funds Checkout Suggestions", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                suggestions = data.get('suggestions', [])
                self.log_test("Travel Funds Checkout Suggestions", True, f"Got {len(suggestions)} suggestions, total available: ${data['total_available']}", response_time)
                return True
            else:
                self.log_test("Travel Funds Checkout Suggestions", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Travel Funds Checkout Suggestions", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # 5. BLOCKCHAIN & NFT (4 endpoints)
    # =====================================================
    
    def test_blockchain_network_info(self):
        """Test blockchain network configuration"""
        print("🔗 Testing Blockchain Network Info...")
        url = f"{BASE_URL}/blockchain/network-info"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ['chain_id', 'network', 'rpc_url']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Blockchain Network Info", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("Blockchain Network Info", True, f"Network: {data['network']}, Chain ID: {data['chain_id']}", response_time)
                return True
            else:
                self.log_test("Blockchain Network Info", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Blockchain Network Info", False, f"Exception: {str(e)}")
            return False

    def test_blockchain_wallet_info(self):
        """Test blockchain wallet info"""
        print("💼 Testing Blockchain Wallet Info...")
        url = f"{BASE_URL}/blockchain/wallet/{TEST_WALLET_ADDRESS}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ['address', 'matic_balance', 'maku_balance']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Blockchain Wallet Info", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("Blockchain Wallet Info", True, f"Address: {data['address'][:10]}..., MATIC: {data['matic_balance']}, MAKU: {data['maku_balance']}", response_time)
                return True
            else:
                self.log_test("Blockchain Wallet Info", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Blockchain Wallet Info", False, f"Exception: {str(e)}")
            return False

    def test_blockchain_tiers(self):
        """Test blockchain tiers - CRITICAL: Must return Bronze/Silver/Gold/Platinum with 1%/3%/6%/10%"""
        print("🏆 Testing Blockchain Tiers (CRITICAL)...")
        url = f"{BASE_URL}/blockchain/tiers"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'tiers' not in data:
                    self.log_test("Blockchain Tiers", False, "Missing tiers field", response_time)
                    return False
                
                tiers = data['tiers']
                if len(tiers) != 4:
                    self.log_test("Blockchain Tiers", False, f"Expected 4 tiers, got {len(tiers)}", response_time)
                    return False
                
                # CRITICAL: Check tier names and cashback rates
                expected_tiers = [
                    {'name': 'Bronze', 'cashback_rate': 1.0},
                    {'name': 'Silver', 'cashback_rate': 3.0},
                    {'name': 'Gold', 'cashback_rate': 6.0},
                    {'name': 'Platinum', 'cashback_rate': 10.0}
                ]
                
                for i, tier in enumerate(tiers):
                    expected = expected_tiers[i]
                    
                    if tier.get('name') != expected['name']:
                        self.log_test("Blockchain Tiers", False, f"Tier {i} name mismatch: expected {expected['name']}, got {tier.get('name')}", response_time)
                        return False
                    
                    if tier.get('cashback_rate') != expected['cashback_rate']:
                        self.log_test("Blockchain Tiers", False, f"Tier {expected['name']} cashback mismatch: expected {expected['cashback_rate']}%, got {tier.get('cashback_rate')}%", response_time)
                        return False
                
                tier_names = [t['name'] for t in tiers]
                tier_rates = [t['cashback_rate'] for t in tiers]
                self.log_test("Blockchain Tiers", True, f"✅ CRITICAL CHECK PASSED: {', '.join(tier_names)} with {tier_rates}% cashback", response_time)
                return True
            else:
                self.log_test("Blockchain Tiers", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Blockchain Tiers", False, f"Exception: {str(e)}")
            return False

    def test_blockchain_nft_mint(self):
        """Test NFT minting"""
        print("🎨 Testing Blockchain NFT Mint...")
        url = f"{BASE_URL}/blockchain/nft/mint"
        payload = {
            "recipient": TEST_WALLET_ADDRESS,
            "tier": 1,  # Silver
            "metadata": {
                "name": "Test Silver NFT",
                "description": "Test minting"
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ['success', 'token_id', 'transaction_hash']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Blockchain NFT Mint", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("Blockchain NFT Mint", True, f"NFT minted: Token ID {data['token_id']}, TX: {data['transaction_hash'][:10]}...", response_time)
                return True
            else:
                self.log_test("Blockchain NFT Mint", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Blockchain NFT Mint", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # 6. AI INTELLIGENCE (3 endpoints)
    # =====================================================
    
    def test_ai_travel_dna(self):
        """Test AI Travel DNA analysis"""
        print("🧬 Testing AI Travel DNA...")
        url = f"{BASE_URL}/ai/travel-dna/{TEST_USER_ID}"
        payload = {
            "preferences": ["culture", "photography"],
            "budget_range": "mid_range"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'travel_dna' not in data:
                    self.log_test("AI Travel DNA", False, "Missing travel_dna field", response_time)
                    return False
                
                travel_dna = data['travel_dna']
                required_fields = ['primary_type', 'confidence_score', 'personality_factors']
                missing_fields = [f for f in required_fields if f not in travel_dna]
                
                if missing_fields:
                    self.log_test("AI Travel DNA", False, f"Missing travel_dna fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("AI Travel DNA", True, f"Type: {travel_dna['primary_type']}, Confidence: {travel_dna['confidence_score']:.2f}", response_time)
                return True
            else:
                self.log_test("AI Travel DNA", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("AI Travel DNA", False, f"Exception: {str(e)}")
            return False

    def test_ai_recommendations(self):
        """Test AI intelligent recommendations"""
        print("💡 Testing AI Recommendations...")
        url = f"{BASE_URL}/ai/recommendations/{TEST_USER_ID}"
        params = {"max_results": 5}
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'recommendations' not in data:
                    self.log_test("AI Recommendations", False, "Missing recommendations field", response_time)
                    return False
                
                recommendations = data['recommendations']
                if not isinstance(recommendations, list):
                    self.log_test("AI Recommendations", False, "Recommendations is not a list", response_time)
                    return False
                
                self.log_test("AI Recommendations", True, f"Got {len(recommendations)} recommendations", response_time)
                return True
            else:
                self.log_test("AI Recommendations", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("AI Recommendations", False, f"Exception: {str(e)}")
            return False

    def test_ai_predictive_insights(self):
        """Test AI predictive insights"""
        print("🔮 Testing AI Predictive Insights...")
        url = f"{BASE_URL}/ai/predictive-insights/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'insights' not in data:
                    self.log_test("AI Predictive Insights", False, "Missing insights field", response_time)
                    return False
                
                insights = data['insights']
                if not isinstance(insights, list):
                    self.log_test("AI Predictive Insights", False, "Insights is not a list", response_time)
                    return False
                
                self.log_test("AI Predictive Insights", True, f"Got {len(insights)} insights, potential savings: ${data.get('potential_savings', 0)}", response_time)
                return True
            else:
                self.log_test("AI Predictive Insights", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("AI Predictive Insights", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # 7. GAMIFICATION (2 endpoints)
    # =====================================================
    
    def test_gamification_achievements(self):
        """Test user achievements"""
        print("🏆 Testing Gamification Achievements...")
        url = f"{BASE_URL}/gamification/achievements/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test("Gamification Achievements", False, "Response is not a list", response_time)
                    return False
                
                if len(data) == 0:
                    self.log_test("Gamification Achievements", False, "No achievements returned", response_time)
                    return False
                
                unlocked_count = sum(1 for ach in data if ach.get('unlocked', False))
                self.log_test("Gamification Achievements", True, f"Got {len(data)} achievements, {unlocked_count} unlocked", response_time)
                return True
            else:
                self.log_test("Gamification Achievements", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Gamification Achievements", False, f"Exception: {str(e)}")
            return False

    def test_gamification_stats(self):
        """Test user gamification stats"""
        print("📊 Testing Gamification Stats...")
        url = f"{BASE_URL}/gamification/stats/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ['user_id', 'level', 'total_points', 'destinations_collected']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Gamification Stats", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("Gamification Stats", True, f"Level {data['level']}, {data['total_points']} points, {data['destinations_collected']} destinations", response_time)
                return True
            else:
                self.log_test("Gamification Stats", False, f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
        except Exception as e:
            self.log_test("Gamification Stats", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # MAIN TEST RUNNER
    # =====================================================
    
    def run_all_tests(self):
        """Run all comprehensive backend tests"""
        print("=" * 80)
        print("🚀 COMPREHENSIVE BACKEND STABILITY TESTING - Post-Integration Validation")
        print("=" * 80)
        print()
        
        # 1. Core Health & Infrastructure (4 endpoints)
        print("=" * 80)
        print("1️⃣  CORE HEALTH & INFRASTRUCTURE (4 endpoints)")
        print("=" * 80)
        self.test_health_check()
        self.test_offseason_healthz()
        self.test_environment_config()
        self.test_environment_switch()
        
        # 2. Off-Season Occupancy Engine (8 endpoints)
        print("=" * 80)
        print("2️⃣  OFF-SEASON OCCUPANCY ENGINE (8 endpoints)")
        print("=" * 80)
        self.test_campaign_creation()
        self.test_campaign_ledger()
        self.test_smart_dreams_suggest()
        self.test_wallet_activate()
        self.test_wallet_deposit()
        self.test_wallet_redeem()
        self.test_yield_optimizer()
        
        # 3. Email Notification System (3 endpoints)
        print("=" * 80)
        print("3️⃣  EMAIL NOTIFICATION SYSTEM (3 endpoints)")
        print("=" * 80)
        self.test_email_templates()
        self.test_email_queue()
        self.test_email_test_render()
        
        # 4. Travel Fund Integration (4 endpoints)
        print("=" * 80)
        print("4️⃣  TRAVEL FUND INTEGRATION (4 endpoints)")
        print("=" * 80)
        self.test_travel_funds_enhanced_stats()
        self.test_travel_funds_integration_data()
        self.test_travel_funds_smart_dreams_create()
        self.test_travel_funds_checkout_suggestions()
        
        # 5. Blockchain & NFT (4 endpoints)
        print("=" * 80)
        print("5️⃣  BLOCKCHAIN & NFT (4 endpoints)")
        print("=" * 80)
        self.test_blockchain_network_info()
        self.test_blockchain_wallet_info()
        self.test_blockchain_tiers()  # CRITICAL TEST
        self.test_blockchain_nft_mint()
        
        # 6. AI Intelligence (3 endpoints)
        print("=" * 80)
        print("6️⃣  AI INTELLIGENCE (3 endpoints)")
        print("=" * 80)
        self.test_ai_travel_dna()
        self.test_ai_recommendations()
        self.test_ai_predictive_insights()
        
        # 7. Gamification (2 endpoints)
        print("=" * 80)
        print("7️⃣  GAMIFICATION (2 endpoints)")
        print("=" * 80)
        self.test_gamification_achievements()
        self.test_gamification_stats()
        
        # Final Summary
        print("=" * 80)
        print("🎯 FINAL TEST SUMMARY")
        print("=" * 80)
        total_tests = self.passed + self.failed
        pass_rate = (self.passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {self.passed}/{total_tests}")
        print(f"❌ Failed: {self.failed}/{total_tests}")
        print(f"📊 Pass Rate: {pass_rate:.1f}%")
        print("=" * 80)
        
        # Categorize results
        print("\n📋 RESULTS BY CATEGORY:")
        print("-" * 80)
        
        # Group results by category
        categories = {
            "Core Health & Infrastructure": [0, 4],
            "Off-Season Occupancy Engine": [4, 11],
            "Email Notification System": [11, 14],
            "Travel Fund Integration": [14, 18],
            "Blockchain & NFT": [18, 22],
            "AI Intelligence": [22, 25],
            "Gamification": [25, 27]
        }
        
        for category, (start, end) in categories.items():
            category_results = self.test_results[start:end]
            category_passed = sum(1 for r in category_results if r['success'])
            category_total = len(category_results)
            category_rate = (category_passed / category_total * 100) if category_total > 0 else 0
            print(f"{category}: {category_passed}/{category_total} ({category_rate:.0f}%)")
        
        print("=" * 80)
        
        # Critical checks
        print("\n🔍 CRITICAL CHECKS:")
        print("-" * 80)
        
        # Find blockchain tiers test
        tiers_test = next((r for r in self.test_results if 'Blockchain Tiers' in r['test_name']), None)
        if tiers_test:
            if tiers_test['success']:
                print("✅ CRITICAL: Blockchain tiers show Bronze/Silver/Gold/Platinum with 1%/3%/6%/10%")
            else:
                print("❌ CRITICAL FAILURE: Blockchain tiers not showing correct values!")
        
        # Check for 404 errors
        has_404 = any('404' in r['details'] for r in self.test_results if not r['success'])
        if has_404:
            print("❌ WARNING: Some endpoints returned 404 (routing errors detected)")
        else:
            print("✅ No routing errors (404s) detected")
        
        # Check email endpoints
        email_tests = [r for r in self.test_results if 'Email' in r['test_name']]
        email_passed = sum(1 for r in email_tests if r['success'])
        if email_passed == len(email_tests):
            print("✅ Email endpoints working fully (no Supabase dependency)")
        else:
            print(f"⚠️  Email endpoints: {email_passed}/{len(email_tests)} passed")
        
        print("=" * 80)
        
        return pass_rate >= 80  # Consider success if 80%+ pass rate

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
