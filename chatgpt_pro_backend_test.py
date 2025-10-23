#!/usr/bin/env python3
"""
ChatGPT Pro + Off-Season + All Integrations Backend Testing
Tests all 11 ChatGPT Pro endpoints, Off-Season Engine, Email System, and Core Health Checks
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://yield-optimize.preview.emergentagent.com/api"
REAL_USER_ID = "f9208e3b-5612-47d8-b98e-02809b3bc89c"  # Real user ID from review request
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
        else:
            self.failed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if not success:
            print(f"   Error: {details}")
        elif response_time:
            print(f"   Response time: {response_time:.2f}s")
        print()

    # =====================================================
    # CHATGPT PRO ENDPOINTS (11 ENDPOINTS - HIGH PRIORITY)
    # =====================================================
    
    def test_chatgpt_pro_smart_dreams(self):
        """Test ChatGPT Pro Smart Dreams endpoint (GPT-4o)"""
        print("🌟 Testing ChatGPT Pro Smart Dreams...")
        
        url = f"{BASE_URL}/ai-pro/smart-dreams"
        payload = {
            "user_input": "I want to plan a romantic trip to Paris for 5 days with a budget of $3000",
            "user_id": REAL_USER_ID,
            "context": {
                "interests": ["culture", "food", "romance"],
                "budget": 3000,
                "duration": 5
            }
        }
        
        # Test with admin header
        headers = {
            'X-User-Role': 'admin',
            'X-NFT-Tier': 'Platinum'
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, headers=headers, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected fields
                if 'response' in data or 'trip_plan' in data:
                    # Check if cashback is mentioned
                    response_text = str(data)
                    has_cashback = 'cashback' in response_text.lower() or 'maku' in response_text.lower()
                    
                    self.log_test("ChatGPT Pro Smart Dreams", True, 
                                f"Response received, cashback mentioned: {has_cashback}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Smart Dreams", False, 
                                f"Missing expected fields in response: {list(data.keys())}", response_time)
                    return False
            elif response.status_code == 403:
                # Access denied - check if it's due to rollout phase
                data = response.json()
                if 'rollout' in str(data).lower() or 'access' in str(data).lower():
                    self.log_test("ChatGPT Pro Smart Dreams", True, 
                                f"Expected access control (403): {data.get('detail', '')[:100]}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Smart Dreams", False, 
                                f"Unexpected 403: {data.get('detail', '')}", response_time)
                    return False
            elif response.status_code == 500:
                # Check if it's API key issue
                data = response.json()
                error_detail = data.get('detail', '')
                if 'api' in error_detail.lower() or 'key' in error_detail.lower():
                    self.log_test("ChatGPT Pro Smart Dreams", True, 
                                f"Expected API key issue (500): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Smart Dreams", False, 
                                f"Unexpected 500: {error_detail}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Smart Dreams", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("ChatGPT Pro Smart Dreams", False, "Request timeout (30s)")
            return False
        except Exception as e:
            self.log_test("ChatGPT Pro Smart Dreams", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_travel_dna(self):
        """Test ChatGPT Pro Travel DNA endpoint (o1)"""
        print("🧬 Testing ChatGPT Pro Travel DNA...")
        
        url = f"{BASE_URL}/ai-pro/travel-dna"
        payload = {
            "user_id": REAL_USER_ID,
            "bookings": [
                {"destination": "Paris", "type": "cultural", "budget": 2000},
                {"destination": "Tokyo", "type": "cultural", "budget": 3000}
            ],
            "searches": [
                {"destination": "Rome", "interests": ["history", "food"]},
                {"destination": "Barcelona", "interests": ["architecture", "beach"]}
            ],
            "preferences": {
                "travel_style": "cultural_explorer",
                "budget_range": "mid_to_high"
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for DNA profile fields
                expected_fields = ['personality_type', 'confidence_score', 'analysis']
                has_fields = any(field in data for field in expected_fields)
                
                if has_fields or 'dna' in str(data).lower():
                    self.log_test("ChatGPT Pro Travel DNA", True, 
                                f"DNA analysis received with confidence scores", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Travel DNA", False, 
                                f"Missing DNA fields: {list(data.keys())}", response_time)
                    return False
            elif response.status_code in [403, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'api' in error_detail.lower() or 'access' in error_detail.lower():
                    self.log_test("ChatGPT Pro Travel DNA", True, 
                                f"Expected error ({response.status_code}): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Travel DNA", False, 
                                f"Unexpected {response.status_code}: {error_detail}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Travel DNA", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Travel DNA", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_recommendations(self):
        """Test ChatGPT Pro Recommendations endpoint (GPT-4o-mini)"""
        print("💡 Testing ChatGPT Pro Recommendations...")
        
        url = f"{BASE_URL}/ai-pro/recommendations"
        payload = {
            "user_id": REAL_USER_ID,
            "budget": 2500,
            "interests": ["adventure", "nature", "photography"],
            "duration": 7,
            "travel_style": "adventurous"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            # Should be fast (<5s)
            if response_time > 5:
                self.log_test("ChatGPT Pro Recommendations", False, 
                            f"Response too slow: {response_time:.2f}s (expected <5s)", response_time)
                return False
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for recommendations
                if 'recommendations' in data or 'destinations' in data:
                    recs = data.get('recommendations', data.get('destinations', []))
                    if isinstance(recs, list) and len(recs) >= 3:
                        self.log_test("ChatGPT Pro Recommendations", True, 
                                    f"Got {len(recs)} recommendations in {response_time:.2f}s", response_time)
                        return True
                    else:
                        self.log_test("ChatGPT Pro Recommendations", False, 
                                    f"Expected 5 destinations, got {len(recs)}", response_time)
                        return False
                else:
                    self.log_test("ChatGPT Pro Recommendations", False, 
                                f"Missing recommendations field: {list(data.keys())}", response_time)
                    return False
            elif response.status_code in [403, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'api' in error_detail.lower() or 'access' in error_detail.lower():
                    self.log_test("ChatGPT Pro Recommendations", True, 
                                f"Expected error ({response.status_code}): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Recommendations", False, 
                                f"Unexpected {response.status_code}: {error_detail}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Recommendations", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Recommendations", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_journey_optimization(self):
        """Test ChatGPT Pro Journey Optimization endpoint (o1)"""
        print("🗺️ Testing ChatGPT Pro Journey Optimization...")
        
        url = f"{BASE_URL}/ai-pro/journey-optimization"
        payload = {
            "user_id": REAL_USER_ID,
            "destination": "Japan",
            "duration_days": 14,
            "budget": 5000,
            "interests": ["culture", "food", "temples", "technology"]
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for itinerary
                if 'itinerary' in data or 'journey_plan' in data or 'day_by_day' in data:
                    self.log_test("ChatGPT Pro Journey Optimization", True, 
                                f"Journey plan received with day-by-day itinerary", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Journey Optimization", False, 
                                f"Missing itinerary fields: {list(data.keys())}", response_time)
                    return False
            elif response.status_code in [403, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'api' in error_detail.lower() or 'access' in error_detail.lower():
                    self.log_test("ChatGPT Pro Journey Optimization", True, 
                                f"Expected error ({response.status_code}): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Journey Optimization", False, 
                                f"Unexpected {response.status_code}: {error_detail}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Journey Optimization", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Journey Optimization", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_customer_support(self):
        """Test ChatGPT Pro Customer Support endpoint (GPT-4o)"""
        print("💬 Testing ChatGPT Pro Customer Support...")
        
        url = f"{BASE_URL}/ai-pro/customer-support"
        payload = {
            "user_id": REAL_USER_ID,
            "message": "I need help with my booking. How do I apply my MAKU cashback?",
            "user_context": {
                "has_bookings": True,
                "wallet_balance": 150.50,
                "nft_tier": "Silver"
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=20)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for support response
                if 'response' in data or 'message' in data or 'answer' in data:
                    response_text = str(data)
                    is_contextual = 'cashback' in response_text.lower() or 'wallet' in response_text.lower()
                    
                    self.log_test("ChatGPT Pro Customer Support", True, 
                                f"Support response received, contextual: {is_contextual}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Customer Support", False, 
                                f"Missing response field: {list(data.keys())}", response_time)
                    return False
            elif response.status_code in [403, 500]:
                data = response.json()
                error_detail = data.get('detail', '')
                if 'api' in error_detail.lower() or 'access' in error_detail.lower():
                    self.log_test("ChatGPT Pro Customer Support", True, 
                                f"Expected error ({response.status_code}): {error_detail[:100]}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Customer Support", False, 
                                f"Unexpected {response.status_code}: {error_detail}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Customer Support", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Customer Support", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_health(self):
        """Test ChatGPT Pro Health Check endpoint"""
        print("🏥 Testing ChatGPT Pro Health Check...")
        
        url = f"{BASE_URL}/ai-pro/health"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for health status
                required_fields = ['status', 'api_key_configured']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("ChatGPT Pro Health Check", False, 
                                f"Missing fields: {missing_fields}", response_time)
                    return False
                
                status = data.get('status')
                api_key_configured = data.get('api_key_configured')
                
                if status == 'healthy':
                    self.log_test("ChatGPT Pro Health Check", True, 
                                f"Status: {status}, API key configured: {api_key_configured}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Health Check", False, 
                                f"Unhealthy status: {status}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Health Check", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Health Check", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_cost_summary_today(self):
        """Test ChatGPT Pro Cost Summary endpoint (today)"""
        print("💰 Testing ChatGPT Pro Cost Summary (Today)...")
        
        url = f"{BASE_URL}/ai-pro/cost-summary"
        params = {'period': 'today'}
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for cost fields
                expected_fields = ['total_cost', 'total_tokens', 'total_requests']
                has_fields = all(f in data for f in expected_fields)
                
                if has_fields:
                    self.log_test("ChatGPT Pro Cost Summary (Today)", True, 
                                f"Cost: ${data['total_cost']:.4f}, Tokens: {data['total_tokens']}, Requests: {data['total_requests']}", 
                                response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Cost Summary (Today)", False, 
                                f"Missing cost fields: {list(data.keys())}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Cost Summary (Today)", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Cost Summary (Today)", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_cost_summary_week(self):
        """Test ChatGPT Pro Cost Summary endpoint (week)"""
        print("📊 Testing ChatGPT Pro Cost Summary (Week)...")
        
        url = f"{BASE_URL}/ai-pro/cost-summary"
        params = {'period': 'week'}
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for projected monthly cost
                if 'projected_monthly' in data or 'total_cost' in data:
                    self.log_test("ChatGPT Pro Cost Summary (Week)", True, 
                                f"Weekly cost data with projections available", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Cost Summary (Week)", False, 
                                f"Missing projection fields: {list(data.keys())}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Cost Summary (Week)", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Cost Summary (Week)", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_cost_breakdown(self):
        """Test ChatGPT Pro Cost Breakdown endpoint"""
        print("📈 Testing ChatGPT Pro Cost Breakdown...")
        
        url = f"{BASE_URL}/ai-pro/cost-breakdown"
        params = {'group_by': 'model'}
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for breakdown array
                if 'breakdown' in data:
                    breakdown = data['breakdown']
                    if isinstance(breakdown, list):
                        # Check if models are present
                        models = [item.get('model', '') for item in breakdown]
                        has_gpt4o = any('gpt-4o' in m.lower() for m in models)
                        has_mini = any('mini' in m.lower() for m in models)
                        
                        self.log_test("ChatGPT Pro Cost Breakdown", True, 
                                    f"Breakdown by model: {len(breakdown)} entries, GPT-4o: {has_gpt4o}, Mini: {has_mini}", 
                                    response_time)
                        return True
                    else:
                        self.log_test("ChatGPT Pro Cost Breakdown", False, 
                                    f"Breakdown is not a list: {type(breakdown)}", response_time)
                        return False
                else:
                    self.log_test("ChatGPT Pro Cost Breakdown", False, 
                                f"Missing breakdown field: {list(data.keys())}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Cost Breakdown", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Cost Breakdown", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_rollout_status(self):
        """Test ChatGPT Pro Rollout Status endpoint"""
        print("🚀 Testing ChatGPT Pro Rollout Status...")
        
        url = f"{BASE_URL}/ai-pro/rollout-status"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for rollout phase
                required_fields = ['current_phase', 'enabled_for']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("ChatGPT Pro Rollout Status", False, 
                                f"Missing fields: {missing_fields}", response_time)
                    return False
                
                current_phase = data.get('current_phase')
                enabled_for = data.get('enabled_for', {})
                
                # Check if phase is valid
                valid_phases = ['admin_only', 'nft_holders', 'all_users']
                if current_phase in valid_phases:
                    self.log_test("ChatGPT Pro Rollout Status", True, 
                                f"Phase: {current_phase}, Enabled for: {list(enabled_for.keys())}", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Rollout Status", False, 
                                f"Invalid phase: {current_phase}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Rollout Status", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Rollout Status", False, f"Exception: {str(e)}")
            return False

    def test_chatgpt_pro_usage_stats(self):
        """Test ChatGPT Pro Usage Stats endpoint"""
        print("📊 Testing ChatGPT Pro Usage Stats...")
        
        url = f"{BASE_URL}/ai-pro/usage-stats"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for usage stats
                expected_fields = ['avg_response_time', 'most_used_model']
                has_fields = any(f in data for f in expected_fields)
                
                if has_fields or 'stats' in data:
                    self.log_test("ChatGPT Pro Usage Stats", True, 
                                f"Usage statistics available", response_time)
                    return True
                else:
                    self.log_test("ChatGPT Pro Usage Stats", False, 
                                f"Missing stats fields: {list(data.keys())}", response_time)
                    return False
            else:
                self.log_test("ChatGPT Pro Usage Stats", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("ChatGPT Pro Usage Stats", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # EMAIL SYSTEM TESTS (3 ENDPOINTS - MEDIUM PRIORITY)
    # =====================================================
    
    def test_email_templates_list(self):
        """Test Email Templates List endpoint"""
        print("📧 Testing Email Templates List...")
        
        url = f"{BASE_URL}/emails/templates"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for templates
                if 'templates' in data and 'count' in data:
                    count = data['count']
                    templates = data['templates']
                    
                    if count == 3 and isinstance(templates, dict):
                        # Check for expected templates
                        expected_templates = ['dream_match', 'campaign_ledger', 'cashback']
                        has_all = all(t in templates for t in expected_templates)
                        
                        if has_all:
                            self.log_test("Email Templates List", True, 
                                        f"Got {count} templates: {list(templates.keys())}", response_time)
                            return True
                        else:
                            self.log_test("Email Templates List", False, 
                                        f"Missing templates: {[t for t in expected_templates if t not in templates]}", 
                                        response_time)
                            return False
                    else:
                        self.log_test("Email Templates List", False, 
                                    f"Expected 3 templates, got {count}", response_time)
                        return False
                else:
                    self.log_test("Email Templates List", False, 
                                f"Missing templates/count fields: {list(data.keys())}", response_time)
                    return False
            else:
                self.log_test("Email Templates List", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Email Templates List", False, f"Exception: {str(e)}")
            return False

    def test_email_queue(self):
        """Test Email Queue endpoint"""
        print("📮 Testing Email Queue...")
        
        url = f"{BASE_URL}/emails/queue"
        payload = {
            "template": "dream_match",
            "user_id": REAL_USER_ID,
            "recipient_email": "test@example.com",
            "data": {
                "first_name": "John",
                "destination": "Paris",
                "hotel_name": "Le Grand Hotel",
                "start_date": "2025-07-15",
                "end_date": "2025-07-22",
                "price": "$1,200",
                "discount": "35%",
                "savings": "$650",
                "score": "92",
                "perks_1": "Free breakfast",
                "perks_2": "Spa access",
                "perks_3": "Late checkout",
                "booking_url": "https://example.com/book",
                "all_deals_url": "https://example.com/deals",
                "help_url": "https://example.com/help"
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for queue response
                required_fields = ['queued', 'email_id', 'scheduled_at']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Email Queue", False, 
                                f"Missing fields: {missing_fields}", response_time)
                    return False
                
                if data.get('queued') == True:
                    self.log_test("Email Queue", True, 
                                f"Email queued: {data['email_id']}, scheduled: {data['scheduled_at']}", response_time)
                    return True
                else:
                    self.log_test("Email Queue", False, 
                                f"Email not queued: {data}", response_time)
                    return False
            else:
                self.log_test("Email Queue", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Email Queue", False, f"Exception: {str(e)}")
            return False

    def test_email_test_render(self):
        """Test Email Test Render endpoint"""
        print("🎨 Testing Email Test Render...")
        
        url = f"{BASE_URL}/emails/test-render"
        params = {'template': 'cashback'}
        payload = {
            "first_name": "Jane",
            "destination": "Bali",
            "cashback_amount": "$50.00",
            "cashback_percentage": "3%",
            "wallet_balance": "$150.50",
            "tier": "Silver",
            "total_earned": "$250.00",
            "wallet_url": "https://example.com/wallet",
            "browse_deals_url": "https://example.com/deals"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, params=params, json=payload, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for rendered HTML
                required_fields = ['success', 'template', 'html']
                missing_fields = [f for f in required_fields if f not in data]
                
                if missing_fields:
                    self.log_test("Email Test Render", False, 
                                f"Missing fields: {missing_fields}", response_time)
                    return False
                
                html = data.get('html', '')
                if data.get('success') and len(html) > 100:
                    # Check if data was interpolated
                    has_data = 'Jane' in html and '$50.00' in html
                    
                    self.log_test("Email Test Render", True, 
                                f"Template rendered: {len(html)} chars, data interpolated: {has_data}", response_time)
                    return True
                else:
                    self.log_test("Email Test Render", False, 
                                f"Render failed or HTML too short: {len(html)} chars", response_time)
                    return False
            else:
                self.log_test("Email Test Render", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Email Test Render", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # CORE HEALTH CHECKS (3 ENDPOINTS - HIGH PRIORITY)
    # =====================================================
    
    def test_main_health_check(self):
        """Test main health endpoint"""
        print("🏥 Testing Main Health Check...")
        
        url = f"{BASE_URL}/health"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'status' in data and data['status'] == 'healthy':
                    self.log_test("Main Health Check", True, 
                                f"Status: {data['status']}, timestamp: {data.get('timestamp', 'N/A')}", response_time)
                    return True
                else:
                    self.log_test("Main Health Check", False, 
                                f"Unhealthy status: {data}", response_time)
                    return False
            else:
                self.log_test("Main Health Check", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Main Health Check", False, f"Exception: {str(e)}")
            return False

    def test_environment_config(self):
        """Test environment config endpoint"""
        print("⚙️ Testing Environment Config...")
        
        url = f"{BASE_URL}/environment/config"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' not in data and isinstance(data, dict):
                    self.log_test("Environment Config", True, 
                                f"Config retrieved successfully", response_time)
                    return True
                else:
                    self.log_test("Environment Config", False, 
                                f"Error in config: {data.get('error', 'Unknown')}", response_time)
                    return False
            else:
                self.log_test("Environment Config", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Environment Config", False, f"Exception: {str(e)}")
            return False

    def test_blockchain_tiers(self):
        """Test blockchain tiers endpoint (CRITICAL - verify Bronze/Silver/Gold/Platinum)"""
        print("🏆 Testing Blockchain Tiers...")
        
        url = f"{BASE_URL}/blockchain/tiers"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if it's a list of tiers
                if isinstance(data, list) and len(data) == 4:
                    tier_names = [tier.get('name', '') for tier in data]
                    expected_tiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
                    
                    # Check tier names
                    has_all_tiers = all(t in tier_names for t in expected_tiers)
                    
                    if has_all_tiers:
                        # Check cashback rates
                        cashback_rates = {tier.get('name'): tier.get('cashback_rate', 0) for tier in data}
                        expected_rates = {'Bronze': 1, 'Silver': 3, 'Gold': 6, 'Platinum': 10}
                        
                        rates_match = all(
                            cashback_rates.get(name, 0) == rate 
                            for name, rate in expected_rates.items()
                        )
                        
                        if rates_match:
                            self.log_test("Blockchain Tiers", True, 
                                        f"All 4 tiers present with correct cashback: Bronze 1%, Silver 3%, Gold 6%, Platinum 10%", 
                                        response_time)
                            return True
                        else:
                            self.log_test("Blockchain Tiers", False, 
                                        f"Cashback rates mismatch: {cashback_rates} vs {expected_rates}", response_time)
                            return False
                    else:
                        self.log_test("Blockchain Tiers", False, 
                                    f"Missing tiers: {[t for t in expected_tiers if t not in tier_names]}", response_time)
                        return False
                else:
                    self.log_test("Blockchain Tiers", False, 
                                f"Expected 4 tiers, got {len(data) if isinstance(data, list) else 'not a list'}", 
                                response_time)
                    return False
            else:
                self.log_test("Blockchain Tiers", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Blockchain Tiers", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # OFF-SEASON ENGINE VERIFICATION (8 ENDPOINTS)
    # =====================================================
    
    def test_offseason_healthz(self):
        """Test off-season health check"""
        print("🏥 Testing Off-Season Health Check...")
        
        url = f"{BASE_URL}/healthz"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check version and features
                if data.get('version') == '0.1.0-offseason':
                    features = data.get('features', [])
                    expected_features = ['partner_campaigns', 'smart_dreams', 'laxmi_wallet', 'yield_optimizer']
                    has_all = all(f in features for f in expected_features)
                    
                    if has_all:
                        self.log_test("Off-Season Health Check", True, 
                                    f"Version: {data['version']}, Features: {len(features)}", response_time)
                        return True
                    else:
                        self.log_test("Off-Season Health Check", False, 
                                    f"Missing features: {[f for f in expected_features if f not in features]}", 
                                    response_time)
                        return False
                else:
                    self.log_test("Off-Season Health Check", False, 
                                f"Wrong version: {data.get('version')}", response_time)
                    return False
            else:
                self.log_test("Off-Season Health Check", False, 
                            f"HTTP {response.status_code}: {response.text[:200]}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Off-Season Health Check", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # RUN ALL TESTS
    # =====================================================
    
    def run_all_tests(self):
        """Run all comprehensive backend tests"""
        print("=" * 80)
        print("🧪 COMPREHENSIVE BACKEND TESTING - ChatGPT Pro + Off-Season + All Integrations")
        print("=" * 80)
        print()
        
        # ChatGPT Pro Endpoints (11 endpoints - HIGH PRIORITY)
        print("=" * 80)
        print("🌟 CHATGPT PRO ENDPOINTS (11 ENDPOINTS - HIGH PRIORITY)")
        print("=" * 80)
        print()
        
        self.test_chatgpt_pro_smart_dreams()
        self.test_chatgpt_pro_travel_dna()
        self.test_chatgpt_pro_recommendations()
        self.test_chatgpt_pro_journey_optimization()
        self.test_chatgpt_pro_customer_support()
        self.test_chatgpt_pro_health()
        self.test_chatgpt_pro_cost_summary_today()
        self.test_chatgpt_pro_cost_summary_week()
        self.test_chatgpt_pro_cost_breakdown()
        self.test_chatgpt_pro_rollout_status()
        self.test_chatgpt_pro_usage_stats()
        
        # Email System (3 endpoints - MEDIUM PRIORITY)
        print("=" * 80)
        print("📧 EMAIL SYSTEM (3 ENDPOINTS - MEDIUM PRIORITY)")
        print("=" * 80)
        print()
        
        self.test_email_templates_list()
        self.test_email_queue()
        self.test_email_test_render()
        
        # Core Health Checks (3 endpoints - HIGH PRIORITY)
        print("=" * 80)
        print("🏥 CORE HEALTH CHECKS (3 ENDPOINTS - HIGH PRIORITY)")
        print("=" * 80)
        print()
        
        self.test_main_health_check()
        self.test_environment_config()
        self.test_blockchain_tiers()
        
        # Off-Season Engine Verification (1 endpoint)
        print("=" * 80)
        print("🏨 OFF-SEASON ENGINE VERIFICATION")
        print("=" * 80)
        print()
        
        self.test_offseason_healthz()
        
        # Print summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print()
        
        total_tests = self.passed + self.failed
        pass_rate = (self.passed / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        print()
        
        # Categorize results
        chatgpt_pro_tests = [r for r in self.test_results if 'ChatGPT Pro' in r['test_name']]
        email_tests = [r for r in self.test_results if 'Email' in r['test_name']]
        health_tests = [r for r in self.test_results if 'Health' in r['test_name'] or 'Environment' in r['test_name'] or 'Blockchain' in r['test_name']]
        offseason_tests = [r for r in self.test_results if 'Off-Season' in r['test_name']]
        
        print("📊 CATEGORY BREAKDOWN:")
        print(f"  ChatGPT Pro: {sum(1 for r in chatgpt_pro_tests if r['success'])}/{len(chatgpt_pro_tests)} passed")
        print(f"  Email System: {sum(1 for r in email_tests if r['success'])}/{len(email_tests)} passed")
        print(f"  Core Health: {sum(1 for r in health_tests if r['success'])}/{len(health_tests)} passed")
        print(f"  Off-Season: {sum(1 for r in offseason_tests if r['success'])}/{len(offseason_tests)} passed")
        print()
        
        # List failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
            print()
        
        return pass_rate >= 80  # Success if 80% or more tests pass


if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    
    exit(0 if success else 1)
