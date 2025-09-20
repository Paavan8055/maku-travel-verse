#!/usr/bin/env python3
"""
Comprehensive Backend API Testing Suite for Maku.Travel
Tests all backend endpoints including Health, Environment, Enhanced Dreams, Gamification, and AI Intelligence
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://smartjourney-6.preview.emergentagent.com/api"
TEST_USER_ID = "traveler_alex_2024"

class MakuTravelBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        
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
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if not success:
            print(f"   Error: {details}")
        elif response_time:
            print(f"   Response time: {response_time:.2f}s")
        print()

    # =====================================================
    # HEALTH CHECK TESTS
    # =====================================================
    
    def test_health_check(self):
        """Test basic health check to verify API connectivity"""
        print("🏥 Testing API Health Check...")
        
        url = f"{BASE_URL}/health"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'healthy':
                    self.log_test("Health Check", True, "API is healthy", response_time)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unhealthy status: {data}", response_time)
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Health Check", False, "Request timeout (10s)")
            return False
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_root_endpoint(self):
        """Test root endpoint"""
        print("🏠 Testing Root Endpoint...")
        
        url = f"{BASE_URL}/"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    self.log_test("Root Endpoint", True, f"Message: {data['message']}", response_time)
                    return True
                else:
                    self.log_test("Root Endpoint", False, f"No message field: {data}", response_time)
                    return False
            else:
                self.log_test("Root Endpoint", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # ENVIRONMENT MANAGEMENT TESTS
    # =====================================================
    
    def test_environment_config(self):
        """Test environment configuration endpoint"""
        print("⚙️ Testing Environment Configuration...")
        
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
                
                # Check for expected config structure
                if isinstance(data, dict):
                    self.log_test("Environment Config", True, "Configuration retrieved successfully", response_time)
                    return True
                else:
                    self.log_test("Environment Config", False, f"Invalid config format: {type(data)}", response_time)
                    return False
            else:
                self.log_test("Environment Config", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Environment Config", False, f"Exception: {str(e)}")
            return False

    def test_environment_status(self):
        """Test environment status endpoint"""
        print("📊 Testing Environment Status...")
        
        url = f"{BASE_URL}/environment/status"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'error' in data:
                    self.log_test("Environment Status", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Check for expected status structure
                required_fields = ['config', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Environment Status", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                self.log_test("Environment Status", True, "Status retrieved successfully", response_time)
                return True
            else:
                self.log_test("Environment Status", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Environment Status", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # ENHANCED DREAMS API TESTS
    # =====================================================
    
    def test_enhanced_destinations(self):
        """Test enhanced destinations endpoint"""
        print("🌟 Testing Enhanced Destinations...")
        
        url = f"{BASE_URL}/enhanced-dreams/destinations"
        params = {
            'user_id': TEST_USER_ID,
            'limit': 10,
            'include_ai_context': True
        }
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' in data:
                    self.log_test("Enhanced Destinations", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['destinations', 'metadata']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Enhanced Destinations", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                destinations = data['destinations']
                if not isinstance(destinations, list):
                    self.log_test("Enhanced Destinations", False, "Destinations is not a list", response_time)
                    return False
                
                if len(destinations) == 0:
                    self.log_test("Enhanced Destinations", False, "No destinations returned", response_time)
                    return False
                
                # Validate first destination structure
                dest = destinations[0]
                dest_required = ['id', 'name', 'country', 'category', 'rarity_score']
                dest_missing = [field for field in dest_required if field not in dest]
                
                if dest_missing:
                    self.log_test("Enhanced Destinations", False, f"Missing destination fields: {dest_missing}", response_time)
                    return False
                
                self.log_test("Enhanced Destinations", True, f"Got {len(destinations)} destinations, first: {dest['name']}, {dest['country']}", response_time)
                return True
                
            else:
                self.log_test("Enhanced Destinations", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Enhanced Destinations", False, f"Exception: {str(e)}")
            return False

    def test_user_profile(self):
        """Test user profile endpoint"""
        print("👤 Testing User Profile...")
        
        url = f"{BASE_URL}/enhanced-dreams/profile/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' in data:
                    self.log_test("User Profile", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate profile structure
                required_fields = ['user_id', 'travel_personality', 'gamification_metrics']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("User Profile", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check travel personality
                personality = data['travel_personality']
                if 'primary_type' not in personality or 'confidence_score' not in personality:
                    self.log_test("User Profile", False, "Invalid travel_personality structure", response_time)
                    return False
                
                self.log_test("User Profile", True, f"Profile for {data['user_id']}, type: {personality['primary_type']}", response_time)
                return True
                
            else:
                self.log_test("User Profile", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("User Profile", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # GAMIFICATION SYSTEM TESTS
    # =====================================================
    
    def test_user_game_stats(self):
        """Test user gamification stats endpoint"""
        print("🎮 Testing User Game Stats...")
        
        url = f"{BASE_URL}/gamification/stats/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' in data:
                    self.log_test("User Game Stats", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate stats structure
                required_fields = ['user_id', 'level', 'total_points', 'destinations_collected', 'achievements_unlocked']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("User Game Stats", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check numeric values are reasonable
                level = data.get('level', 0)
                points = data.get('total_points', 0)
                destinations = data.get('destinations_collected', 0)
                
                if level < 0 or points < 0 or destinations < 0:
                    self.log_test("User Game Stats", False, f"Invalid negative values: level={level}, points={points}, destinations={destinations}", response_time)
                    return False
                
                self.log_test("User Game Stats", True, f"Level {level}, {points} points, {destinations} destinations", response_time)
                return True
                
            else:
                self.log_test("User Game Stats", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("User Game Stats", False, f"Exception: {str(e)}")
            return False

    def test_user_achievements(self):
        """Test user achievements endpoint"""
        print("🏆 Testing User Achievements...")
        
        url = f"{BASE_URL}/gamification/achievements/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' in data:
                    self.log_test("User Achievements", False, f"API Error: {data['error']}", response_time)
                    return False
                
                if not isinstance(data, list):
                    self.log_test("User Achievements", False, "Achievements is not a list", response_time)
                    return False
                
                if len(data) == 0:
                    self.log_test("User Achievements", False, "No achievements returned", response_time)
                    return False
                
                # Validate first achievement structure
                achievement = data[0]
                ach_required = ['id', 'name', 'description', 'category', 'progress', 'unlocked']
                ach_missing = [field for field in ach_required if field not in achievement]
                
                if ach_missing:
                    self.log_test("User Achievements", False, f"Missing achievement fields: {ach_missing}", response_time)
                    return False
                
                unlocked_count = sum(1 for ach in data if ach.get('unlocked', False))
                self.log_test("User Achievements", True, f"Got {len(data)} achievements, {unlocked_count} unlocked", response_time)
                return True
                
            else:
                self.log_test("User Achievements", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("User Achievements", False, f"Exception: {str(e)}")
            return False

    def test_leaderboards(self):
        """Test leaderboards endpoint"""
        print("📊 Testing Leaderboards...")
        
        url = f"{BASE_URL}/gamification/leaderboards"
        params = {'types': 'global,weekly'}
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' in data:
                    self.log_test("Leaderboards", False, f"API Error: {data['error']}", response_time)
                    return False
                
                if not isinstance(data, list):
                    self.log_test("Leaderboards", False, "Leaderboards is not a list", response_time)
                    return False
                
                if len(data) == 0:
                    self.log_test("Leaderboards", False, "No leaderboards returned", response_time)
                    return False
                
                # Validate first leaderboard structure
                leaderboard = data[0]
                lb_required = ['id', 'name', 'type', 'entries']
                lb_missing = [field for field in lb_required if field not in leaderboard]
                
                if lb_missing:
                    self.log_test("Leaderboards", False, f"Missing leaderboard fields: {lb_missing}", response_time)
                    return False
                
                entries = leaderboard.get('entries', [])
                if not isinstance(entries, list):
                    self.log_test("Leaderboards", False, "Leaderboard entries is not a list", response_time)
                    return False
                
                self.log_test("Leaderboards", True, f"Got {len(data)} leaderboards, first has {len(entries)} entries", response_time)
                return True
                
            else:
                self.log_test("Leaderboards", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Leaderboards", False, f"Exception: {str(e)}")
            return False

    def test_user_challenges(self):
        """Test user challenges endpoint"""
        print("🎯 Testing User Challenges...")
        
        url = f"{BASE_URL}/gamification/challenges/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' in data:
                    self.log_test("User Challenges", False, f"API Error: {data['error']}", response_time)
                    return False
                
                if not isinstance(data, list):
                    self.log_test("User Challenges", False, "Challenges is not a list", response_time)
                    return False
                
                if len(data) == 0:
                    self.log_test("User Challenges", False, "No challenges returned", response_time)
                    return False
                
                # Validate first challenge structure
                challenge = data[0]
                ch_required = ['id', 'title', 'description', 'type', 'target_value', 'current_progress']
                ch_missing = [field for field in ch_required if field not in challenge]
                
                if ch_missing:
                    self.log_test("User Challenges", False, f"Missing challenge fields: {ch_missing}", response_time)
                    return False
                
                active_count = sum(1 for ch in data if ch.get('status') == 'active')
                self.log_test("User Challenges", True, f"Got {len(data)} challenges, {active_count} active", response_time)
                return True
                
            else:
                self.log_test("User Challenges", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("User Challenges", False, f"Exception: {str(e)}")
            return False

    def test_social_activity(self):
        """Test social activity endpoint"""
        print("👥 Testing Social Activity...")
        
        url = f"{BASE_URL}/social/activity/{TEST_USER_ID}"
        params = {'limit': 10}
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'error' in data:
                    self.log_test("Social Activity", False, f"API Error: {data['error']}", response_time)
                    return False
                
                if not isinstance(data, list):
                    self.log_test("Social Activity", False, "Social activity is not a list", response_time)
                    return False
                
                if len(data) == 0:
                    self.log_test("Social Activity", False, "No social activities returned", response_time)
                    return False
                
                # Validate first activity structure
                activity = data[0]
                act_required = ['id', 'user_id', 'username', 'activity_type', 'created_at']
                act_missing = [field for field in act_required if field not in activity]
                
                if act_missing:
                    self.log_test("Social Activity", False, f"Missing activity fields: {act_missing}", response_time)
                    return False
                
                self.log_test("Social Activity", True, f"Got {len(data)} activities, first: {activity['activity_type']}", response_time)
                return True
                
            else:
                self.log_test("Social Activity", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Social Activity", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # AI INTELLIGENCE LAYER TESTS
    # =====================================================
    
    def test_travel_dna_analysis(self):
        """Test Travel DNA Analysis endpoint"""
        print("🧬 Testing Travel DNA Analysis...")
        
        url = f"{BASE_URL}/ai/travel-dna/{TEST_USER_ID}"
        payload = {
            "user_preferences": {
                "travel_style": "cultural_explorer",
                "budget_range": "mid_range",
                "group_size": "solo",
                "interests": ["photography", "local_cuisine", "historical_sites", "art_museums"]
            },
            "behavioral_data": {
                "browsing_patterns": ["cultural sites", "photography spots", "local cuisine"],
                "dream_destinations": ["Florence", "Kyoto", "Marrakech", "Prague", "Istanbul"],
                "seasonal_preferences": ["spring", "fall"]
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for error in response
                if "error" in data:
                    self.log_test("Travel DNA Analysis", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['travel_dna', 'confidence_breakdown']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Travel DNA Analysis", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Validate travel_dna structure
                travel_dna = data['travel_dna']
                dna_required = ['user_id', 'primary_type', 'confidence_score', 'personality_factors']
                dna_missing = [field for field in dna_required if field not in travel_dna]
                
                if dna_missing:
                    self.log_test("Travel DNA Analysis", False, f"Missing travel_dna fields: {dna_missing}", response_time)
                    return False
                
                # Check confidence score is valid
                confidence = travel_dna.get('confidence_score', 0)
                if not (0 <= confidence <= 1):
                    self.log_test("Travel DNA Analysis", False, f"Invalid confidence score: {confidence}", response_time)
                    return False
                
                # Check personality factors
                factors = travel_dna.get('personality_factors', [])
                if not factors or len(factors) == 0:
                    self.log_test("Travel DNA Analysis", False, "No personality factors returned", response_time)
                    return False
                
                self.log_test("Travel DNA Analysis", True, f"Primary type: {travel_dna['primary_type']}, Confidence: {confidence:.2f}", response_time)
                return True
                
            else:
                self.log_test("Travel DNA Analysis", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Travel DNA Analysis", False, "Request timeout (30s)")
            return False
        except Exception as e:
            self.log_test("Travel DNA Analysis", False, f"Exception: {str(e)}")
            return False

    def test_intelligent_recommendations(self):
        """Test Intelligent Recommendations endpoint"""
        print("🎯 Testing Intelligent Recommendations...")
        
        url = f"{BASE_URL}/ai/recommendations/{TEST_USER_ID}"
        params = {
            'max_results': 5,
            'include_social_proof': True
        }
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Intelligent Recommendations", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                if 'recommendations' not in data:
                    self.log_test("Intelligent Recommendations", False, "Missing recommendations field", response_time)
                    return False
                
                recommendations = data['recommendations']
                if not isinstance(recommendations, list):
                    self.log_test("Intelligent Recommendations", False, "Recommendations is not a list", response_time)
                    return False
                
                if len(recommendations) == 0:
                    self.log_test("Intelligent Recommendations", False, "No recommendations returned", response_time)
                    return False
                
                # Validate first recommendation structure
                rec = recommendations[0]
                rec_required = ['destination_name', 'recommendation_score', 'recommendation_reasons']
                rec_missing = [field for field in rec_required if field not in rec]
                
                if rec_missing:
                    self.log_test("Intelligent Recommendations", False, f"Missing recommendation fields: {rec_missing}", response_time)
                    return False
                
                # Check recommendation score
                score = rec.get('recommendation_score', 0)
                if not (0 <= score <= 100):
                    self.log_test("Intelligent Recommendations", False, f"Invalid recommendation score: {score}", response_time)
                    return False
                
                self.log_test("Intelligent Recommendations", True, f"Got {len(recommendations)} recommendations, top: {rec['destination_name']} (score: {score})", response_time)
                return True
                
            else:
                self.log_test("Intelligent Recommendations", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Intelligent Recommendations", False, "Request timeout (30s)")
            return False
        except Exception as e:
            self.log_test("Intelligent Recommendations", False, f"Exception: {str(e)}")
            return False

    def test_journey_optimization(self):
        """Test Journey Optimization endpoint"""
        print("🗺️ Testing Journey Optimization...")
        
        url = f"{BASE_URL}/ai/journey-optimization"
        payload = {
            "user_id": TEST_USER_ID,
            "destination_ids": ["florence_italy", "prague_czech", "vienna_austria"],
            "preferences": {
                "optimization_priority": "cost",
                "travel_style": "cultural",
                "duration_days": 14,
                "budget_max": 3000,
                "travel_pace": "moderate"
            },
            "constraints": {
                "start_date": "2024-05-01",
                "end_date": "2024-05-15",
                "departure_city": "london"
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Journey Optimization", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                if 'optimized_journey' not in data:
                    self.log_test("Journey Optimization", False, "Missing optimized_journey field", response_time)
                    return False
                
                journey = data['optimized_journey']
                journey_required = ['journey_id', 'user_id', 'optimized_route', 'total_estimated_cost']
                journey_missing = [field for field in journey_required if field not in journey]
                
                if journey_missing:
                    self.log_test("Journey Optimization", False, f"Missing journey fields: {journey_missing}", response_time)
                    return False
                
                # Check route structure
                route = journey.get('optimized_route', {})
                if 'route_segments' not in route:
                    self.log_test("Journey Optimization", False, "Missing route_segments in optimized_route", response_time)
                    return False
                
                segments = route['route_segments']
                if not isinstance(segments, list) or len(segments) == 0:
                    self.log_test("Journey Optimization", False, "No route segments found", response_time)
                    return False
                
                # Check cost is reasonable
                cost = journey.get('total_estimated_cost', 0)
                if cost <= 0:
                    self.log_test("Journey Optimization", False, f"Invalid total cost: {cost}", response_time)
                    return False
                
                self.log_test("Journey Optimization", True, f"Journey optimized with {len(segments)} segments, total cost: ${cost}", response_time)
                return True
                
            else:
                self.log_test("Journey Optimization", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Journey Optimization", False, "Request timeout (30s)")
            return False
        except Exception as e:
            self.log_test("Journey Optimization", False, f"Exception: {str(e)}")
            return False

    def test_predictive_insights(self):
        """Test Predictive Insights endpoint"""
        print("🔮 Testing Predictive Insights...")
        
        url = f"{BASE_URL}/ai/predictive-insights/{TEST_USER_ID}"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Predictive Insights", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['insights', 'total_insights']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Predictive Insights", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                insights = data['insights']
                if not isinstance(insights, list):
                    self.log_test("Predictive Insights", False, "Insights is not a list", response_time)
                    return False
                
                if len(insights) == 0:
                    self.log_test("Predictive Insights", False, "No insights returned", response_time)
                    return False
                
                # Validate first insight structure
                insight = insights[0]
                insight_required = ['insight_type', 'title', 'description', 'confidence', 'urgency']
                insight_missing = [field for field in insight_required if field not in insight]
                
                if insight_missing:
                    self.log_test("Predictive Insights", False, f"Missing insight fields: {insight_missing}", response_time)
                    return False
                
                # Check confidence score
                confidence = insight.get('confidence', 0)
                if not (0 <= confidence <= 100):
                    self.log_test("Predictive Insights", False, f"Invalid confidence score: {confidence}", response_time)
                    return False
                
                self.log_test("Predictive Insights", True, f"Got {len(insights)} insights, first: {insight['title']} (confidence: {confidence}%)", response_time)
                return True
                
            else:
                self.log_test("Predictive Insights", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Predictive Insights", False, "Request timeout (30s)")
            return False
        except Exception as e:
            self.log_test("Predictive Insights", False, f"Exception: {str(e)}")
            return False

    def test_ai_feedback(self):
        """Test AI Feedback endpoint"""
        print("💬 Testing AI Feedback...")
        
        url = f"{BASE_URL}/ai/feedback"
        payload = {
            "user_id": TEST_USER_ID,
            "feedback_type": "recommendation_rating",
            "target_id": "florence_italy",
            "rating": 4,
            "feedback_text": "Great recommendation! Florence was perfect for my cultural interests and photography passion."
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("AI Feedback", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Check success response
                if not data.get('success', False):
                    self.log_test("AI Feedback", False, f"Feedback submission failed: {data.get('message', 'Unknown error')}", response_time)
                    return False
                
                self.log_test("AI Feedback", True, "Feedback submitted successfully", response_time)
                return True
                
            else:
                self.log_test("AI Feedback", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("AI Feedback", False, "Request timeout (30s)")
            return False
        except Exception as e:
            self.log_test("AI Feedback", False, f"Exception: {str(e)}")
            return False

    def test_recommendation_explanation(self):
        """Test Recommendation Explanation endpoint"""
        print("💡 Testing Recommendation Explanation...")
        
        recommendation_id = "florence_italy"
        url = f"{BASE_URL}/ai/explain/{recommendation_id}"
        params = {'user_id': TEST_USER_ID}
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Recommendation Explanation", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                if 'explanation' not in data:
                    self.log_test("Recommendation Explanation", False, "Missing explanation field", response_time)
                    return False
                
                explanation = data['explanation']
                if not explanation or len(explanation.strip()) == 0:
                    self.log_test("Recommendation Explanation", False, "Empty explanation returned", response_time)
                    return False
                
                # Check confidence if present
                confidence = data.get('confidence', 0)
                if confidence and not (0 <= confidence <= 1):
                    self.log_test("Recommendation Explanation", False, f"Invalid confidence score: {confidence}", response_time)
                    return False
                
                self.log_test("Recommendation Explanation", True, f"Explanation received ({len(explanation)} chars)", response_time)
                return True
                
            else:
                self.log_test("Recommendation Explanation", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("Recommendation Explanation", False, "Request timeout (30s)")
            return False
        except Exception as e:
            self.log_test("Recommendation Explanation", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # SMART DREAMS PROVIDER MANAGEMENT TESTS - Phase 5
    # =====================================================
    
    def test_smart_dreams_providers_registry(self):
        """Test Smart Dreams Provider Registry endpoint"""
        print("🏢 Testing Smart Dreams Provider Registry...")
        
        url = f"{BASE_URL}/smart-dreams/providers"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Provider Registry", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['providers', 'total_count', 'active_count', 'healthy_count', 'auto_discovered_count']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Provider Registry", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                providers = data['providers']
                if not isinstance(providers, list):
                    self.log_test("Provider Registry", False, "Providers is not a list", response_time)
                    return False
                
                if len(providers) == 0:
                    self.log_test("Provider Registry", False, "No providers returned", response_time)
                    return False
                
                # Validate first provider structure
                provider = providers[0]
                provider_required = ['id', 'name', 'type', 'status', 'health_status', 'performance_score']
                provider_missing = [field for field in provider_required if field not in provider]
                
                if provider_missing:
                    self.log_test("Provider Registry", False, f"Missing provider fields: {provider_missing}", response_time)
                    return False
                
                # Check performance score is valid
                score = provider.get('performance_score', 0)
                if not (0 <= score <= 100):
                    self.log_test("Provider Registry", False, f"Invalid performance score: {score}", response_time)
                    return False
                
                active_count = data.get('active_count', 0)
                healthy_count = data.get('healthy_count', 0)
                auto_discovered = data.get('auto_discovered_count', 0)
                
                self.log_test("Provider Registry", True, f"Got {len(providers)} providers, {active_count} active, {healthy_count} healthy, {auto_discovered} auto-discovered", response_time)
                return True
                
            else:
                self.log_test("Provider Registry", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Provider Registry", False, f"Exception: {str(e)}")
            return False

    def test_smart_dreams_providers_discover(self):
        """Test Smart Dreams Provider Auto-Discovery endpoint"""
        print("🔍 Testing Smart Dreams Provider Auto-Discovery...")
        
        url = f"{BASE_URL}/smart-dreams/providers/discover"
        
        try:
            start_time = time.time()
            response = self.session.post(url, json={}, timeout=20)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Provider Auto-Discovery", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['discovered_providers', 'discovery_summary', 'recommendations']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Provider Auto-Discovery", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                discovered = data['discovered_providers']
                if not isinstance(discovered, list):
                    self.log_test("Provider Auto-Discovery", False, "Discovered providers is not a list", response_time)
                    return False
                
                # Validate discovery summary
                summary = data['discovery_summary']
                summary_required = ['total_discovered', 'processing_time_ms', 'discovery_methods']
                summary_missing = [field for field in summary_required if field not in summary]
                
                if summary_missing:
                    self.log_test("Provider Auto-Discovery", False, f"Missing summary fields: {summary_missing}", response_time)
                    return False
                
                # Check if discovered providers have auto_discovered flag
                if len(discovered) > 0:
                    first_provider = discovered[0]
                    if not first_provider.get('auto_discovered', False):
                        self.log_test("Provider Auto-Discovery", False, "Discovered provider missing auto_discovered flag", response_time)
                        return False
                    
                    # Check discovery metadata
                    if 'discovery_date' not in first_provider:
                        self.log_test("Provider Auto-Discovery", False, "Missing discovery_date in discovered provider", response_time)
                        return False
                
                total_discovered = summary.get('total_discovered', 0)
                processing_time = summary.get('processing_time_ms', 0)
                
                self.log_test("Provider Auto-Discovery", True, f"Discovered {total_discovered} providers in {processing_time:.0f}ms", response_time)
                return True
                
            else:
                self.log_test("Provider Auto-Discovery", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Provider Auto-Discovery", False, f"Exception: {str(e)}")
            return False

    def test_smart_dreams_providers_analytics(self):
        """Test Smart Dreams Provider Analytics endpoint"""
        print("📊 Testing Smart Dreams Provider Analytics...")
        
        url = f"{BASE_URL}/smart-dreams/providers/analytics"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Provider Analytics", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['summary', 'performance_by_type', 'top_performers', 'integration_pipeline', 'cost_analytics']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Provider Analytics", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Validate summary structure
                summary = data['summary']
                summary_required = ['total_providers', 'active_providers', 'healthy_providers', 'avg_performance_score']
                summary_missing = [field for field in summary_required if field not in summary]
                
                if summary_missing:
                    self.log_test("Provider Analytics", False, f"Missing summary fields: {summary_missing}", response_time)
                    return False
                
                # Check performance metrics are reasonable
                avg_score = summary.get('avg_performance_score', 0)
                if not (0 <= avg_score <= 100):
                    self.log_test("Provider Analytics", False, f"Invalid average performance score: {avg_score}", response_time)
                    return False
                
                # Validate performance by type
                perf_by_type = data['performance_by_type']
                if not isinstance(perf_by_type, dict):
                    self.log_test("Provider Analytics", False, "Performance by type is not a dict", response_time)
                    return False
                
                # Check top performers
                top_performers = data['top_performers']
                if not isinstance(top_performers, list):
                    self.log_test("Provider Analytics", False, "Top performers is not a list", response_time)
                    return False
                
                total_providers = summary.get('total_providers', 0)
                active_providers = summary.get('active_providers', 0)
                
                self.log_test("Provider Analytics", True, f"Analytics: {total_providers} total, {active_providers} active, avg score: {avg_score:.1f}", response_time)
                return True
                
            else:
                self.log_test("Provider Analytics", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Provider Analytics", False, f"Exception: {str(e)}")
            return False

    def test_smart_dreams_provider_health_check(self):
        """Test Smart Dreams Provider Health Check endpoint"""
        print("🏥 Testing Smart Dreams Provider Health Check...")
        
        provider_id = "amadeus-001"
        url = f"{BASE_URL}/smart-dreams/providers/{provider_id}/health-check"
        
        try:
            start_time = time.time()
            response = self.session.post(url, json={}, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Provider Health Check", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['provider_id', 'timestamp', 'status', 'response_time_ms', 'success_rate']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Provider Health Check", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check provider ID matches
                if data.get('provider_id') != provider_id:
                    self.log_test("Provider Health Check", False, f"Provider ID mismatch: expected {provider_id}, got {data.get('provider_id')}", response_time)
                    return False
                
                # Check status is valid
                status = data.get('status')
                valid_statuses = ['healthy', 'degraded', 'offline']
                if status not in valid_statuses:
                    self.log_test("Provider Health Check", False, f"Invalid status: {status}", response_time)
                    return False
                
                # Check success rate is valid
                success_rate = data.get('success_rate', 0)
                if not (0 <= success_rate <= 100):
                    self.log_test("Provider Health Check", False, f"Invalid success rate: {success_rate}", response_time)
                    return False
                
                # Check response time is reasonable
                resp_time_ms = data.get('response_time_ms', 0)
                if resp_time_ms <= 0:
                    self.log_test("Provider Health Check", False, f"Invalid response time: {resp_time_ms}ms", response_time)
                    return False
                
                self.log_test("Provider Health Check", True, f"Provider {provider_id}: {status}, {success_rate}% success, {resp_time_ms}ms response", response_time)
                return True
                
            else:
                self.log_test("Provider Health Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Provider Health Check", False, f"Exception: {str(e)}")
            return False

    def test_smart_dreams_provider_activate(self):
        """Test Smart Dreams Provider Activation endpoint"""
        print("⚡ Testing Smart Dreams Provider Activation...")
        
        provider_id = "expedia-taap-001"
        url = f"{BASE_URL}/smart-dreams/providers/{provider_id}/activate"
        
        try:
            start_time = time.time()
            response = self.session.post(url, json={}, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Provider Activation", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['provider_id', 'activation_status', 'new_status', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Provider Activation", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check provider ID matches
                if data.get('provider_id') != provider_id:
                    self.log_test("Provider Activation", False, f"Provider ID mismatch: expected {provider_id}, got {data.get('provider_id')}", response_time)
                    return False
                
                # Check activation status
                activation_status = data.get('activation_status')
                if activation_status != 'success':
                    self.log_test("Provider Activation", False, f"Activation failed: {activation_status}", response_time)
                    return False
                
                # Check new status
                new_status = data.get('new_status')
                if new_status != 'active':
                    self.log_test("Provider Activation", False, f"Expected active status, got: {new_status}", response_time)
                    return False
                
                # Check integration steps if present
                if 'integration_steps_completed' in data:
                    steps = data['integration_steps_completed']
                    if not isinstance(steps, list) or len(steps) == 0:
                        self.log_test("Provider Activation", False, "No integration steps completed", response_time)
                        return False
                
                self.log_test("Provider Activation", True, f"Provider {provider_id} activated successfully, status: {new_status}", response_time)
                return True
                
            else:
                self.log_test("Provider Activation", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Provider Activation", False, f"Exception: {str(e)}")
            return False

    def test_smart_dreams_provider_credentials(self):
        """Test Smart Dreams Provider Credentials endpoint"""
        print("🔐 Testing Smart Dreams Provider Credentials...")
        
        provider_id = "amadeus-001"
        url = f"{BASE_URL}/smart-dreams/providers/{provider_id}/credentials"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Provider Credentials", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['provider_id', 'has_api_key', 'credentials_status']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Provider Credentials", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check provider ID matches
                if data.get('provider_id') != provider_id:
                    self.log_test("Provider Credentials", False, f"Provider ID mismatch: expected {provider_id}, got {data.get('provider_id')}", response_time)
                    return False
                
                # Check credentials status
                cred_status = data.get('credentials_status')
                valid_statuses = ['valid', 'invalid', 'expired', 'missing']
                if cred_status not in valid_statuses:
                    self.log_test("Provider Credentials", False, f"Invalid credentials status: {cred_status}", response_time)
                    return False
                
                # Check boolean flags
                has_api_key = data.get('has_api_key')
                if not isinstance(has_api_key, bool):
                    self.log_test("Provider Credentials", False, f"has_api_key should be boolean, got: {type(has_api_key)}", response_time)
                    return False
                
                # Check masked info if present
                if 'masked_info' in data:
                    masked = data['masked_info']
                    if not isinstance(masked, dict):
                        self.log_test("Provider Credentials", False, "masked_info should be a dict", response_time)
                        return False
                    
                    # Ensure credentials are properly masked
                    for key, value in masked.items():
                        if not isinstance(value, str) or '****' not in value:
                            self.log_test("Provider Credentials", False, f"Credential {key} not properly masked: {value}", response_time)
                            return False
                
                self.log_test("Provider Credentials", True, f"Provider {provider_id}: {cred_status}, API key: {has_api_key}", response_time)
                return True
                
            else:
                self.log_test("Provider Credentials", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Provider Credentials", False, f"Exception: {str(e)}")
            return False

    def test_existing_enhanced_providers_integration(self):
        """Test integration with existing Smart Dreams system"""
        print("🔗 Testing Integration with Existing Smart Dreams System...")
        
        # Test the existing enhanced-dreams endpoints to ensure they still work
        url = f"{BASE_URL}/enhanced-dreams/destinations"
        params = {
            'user_id': TEST_USER_ID,
            'limit': 5,
            'include_ai_context': True
        }
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Enhanced Dreams Integration", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Check that enhanced dreams still works
                if 'destinations' not in data:
                    self.log_test("Enhanced Dreams Integration", False, "Missing destinations field", response_time)
                    return False
                
                destinations = data['destinations']
                if not isinstance(destinations, list) or len(destinations) == 0:
                    self.log_test("Enhanced Dreams Integration", False, "No destinations returned", response_time)
                    return False
                
                # Check that AI context is included
                if 'user_context' in data:
                    user_context = data['user_context']
                    if 'personality_match_scores' not in user_context:
                        self.log_test("Enhanced Dreams Integration", False, "Missing personality match scores in user context", response_time)
                        return False
                
                self.log_test("Enhanced Dreams Integration", True, f"Enhanced Dreams API working with {len(destinations)} destinations", response_time)
                return True
                
            else:
                self.log_test("Enhanced Dreams Integration", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Enhanced Dreams Integration", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # MAIN TEST RUNNER
    # =====================================================
    
    def run_all_tests(self):
        """Run comprehensive backend tests"""
        print("🚀 Starting Comprehensive Maku.Travel Backend Tests")
        print("=" * 70)
        print(f"Base URL: {BASE_URL}")
        print(f"Test User ID: {TEST_USER_ID}")
        print("=" * 70)
        print()
        
        # Define test categories and their tests
        test_categories = [
            ("Health Check", [
                self.test_health_check,
                self.test_root_endpoint
            ]),
            ("Environment Management", [
                self.test_environment_config,
                self.test_environment_status
            ]),
            ("Enhanced Dreams API", [
                self.test_enhanced_destinations,
                self.test_user_profile
            ]),
            ("Gamification System", [
                self.test_user_game_stats,
                self.test_user_achievements,
                self.test_leaderboards,
                self.test_user_challenges,
                self.test_social_activity
            ]),
            ("AI Intelligence Layer", [
                self.test_travel_dna_analysis,
                self.test_intelligent_recommendations,
                self.test_journey_optimization,
                self.test_predictive_insights,
                self.test_ai_feedback,
                self.test_recommendation_explanation
            ])
        ]
        
        total_passed = 0
        total_tests = 0
        category_results = {}
        
        for category_name, tests in test_categories:
            print(f"\n🔍 {category_name} Tests")
            print("-" * 50)
            
            category_passed = 0
            category_total = len(tests)
            
            for test_func in tests:
                if test_func():
                    category_passed += 1
                total_tests += 1
            
            total_passed += category_passed
            category_results[category_name] = (category_passed, category_total)
            
            print(f"📊 {category_name}: {category_passed}/{category_total} tests passed")
        
        # Final summary
        print("\n" + "=" * 70)
        print("🏁 COMPREHENSIVE TEST RESULTS")
        print("=" * 70)
        
        for category_name, (passed, total) in category_results.items():
            status = "✅" if passed == total else "❌"
            print(f"{status} {category_name}: {passed}/{total}")
        
        print("-" * 70)
        print(f"🎯 OVERALL: {total_passed}/{total_tests} tests passed ({total_passed/total_tests*100:.1f}%)")
        
        if total_passed == total_tests:
            print("🎉 ALL TESTS PASSED! Maku.Travel backend is fully functional!")
        else:
            failed_tests = total_tests - total_passed
            print(f"⚠️  {failed_tests} tests failed. See details above.")
            
            print("\n❌ Failed Tests Summary:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test_name']}: {result['details']}")
        
        print("=" * 70)
        return total_passed == total_tests

if __name__ == "__main__":
    tester = MakuTravelBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)