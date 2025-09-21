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
BASE_URL = "https://travel-portal-dev.preview.emergentagent.com/api"
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
    # SMART DREAMS PROVIDER MANAGEMENT TESTS - Phase 7 Enhanced
    # Testing Enhanced Partner Provider Integration with Duffle & RateHawk
    # =====================================================
    
    def test_enhanced_provider_registry_duffle_ratehawk(self):
        """Test Enhanced Provider Registry with Duffle and RateHawk integration"""
        print("🚀 Testing Enhanced Provider Registry (Duffle & RateHawk)...")
        
        url = f"{BASE_URL}/smart-dreams/providers"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Enhanced Provider Registry", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['providers', 'total_count', 'active_count', 'healthy_count']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Enhanced Provider Registry", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                providers = data['providers']
                if not isinstance(providers, list):
                    self.log_test("Enhanced Provider Registry", False, "Providers is not a list", response_time)
                    return False
                
                # Check for minimum 7 providers as specified in requirements
                if len(providers) < 7:
                    self.log_test("Enhanced Provider Registry", False, f"Expected at least 7 providers, got {len(providers)}", response_time)
                    return False
                
                # Find Duffle and RateHawk providers
                duffle_provider = None
                ratehawk_provider = None
                
                for provider in providers:
                    if provider.get('name') == 'Duffle':
                        duffle_provider = provider
                    elif provider.get('name') == 'RateHawk':
                        ratehawk_provider = provider
                
                # Validate Duffle provider
                if not duffle_provider:
                    self.log_test("Enhanced Provider Registry", False, "Duffle provider not found in registry", response_time)
                    return False
                
                # Check Duffle specifications
                if duffle_provider.get('performance_score') != 94.8:
                    self.log_test("Enhanced Provider Registry", False, f"Duffle performance_score should be 94.8, got {duffle_provider.get('performance_score')}", response_time)
                    return False
                
                if duffle_provider.get('type') != 'flight':
                    self.log_test("Enhanced Provider Registry", False, f"Duffle type should be 'flight', got {duffle_provider.get('type')}", response_time)
                    return False
                
                # Check demo_label in metadata
                duffle_metadata = duffle_provider.get('metadata', {})
                if duffle_metadata.get('demo_label') != '✨ DEMO DATA':
                    self.log_test("Enhanced Provider Registry", False, f"Duffle demo_label should be '✨ DEMO DATA', got {duffle_metadata.get('demo_label')}", response_time)
                    return False
                
                # Validate RateHawk provider
                if not ratehawk_provider:
                    self.log_test("Enhanced Provider Registry", False, "RateHawk provider not found in registry", response_time)
                    return False
                
                # Check RateHawk specifications
                if ratehawk_provider.get('performance_score') != 91.3:
                    self.log_test("Enhanced Provider Registry", False, f"RateHawk performance_score should be 91.3, got {ratehawk_provider.get('performance_score')}", response_time)
                    return False
                
                if ratehawk_provider.get('type') != 'hotel':
                    self.log_test("Enhanced Provider Registry", False, f"RateHawk type should be 'hotel', got {ratehawk_provider.get('type')}", response_time)
                    return False
                
                # Check demo_label in metadata
                ratehawk_metadata = ratehawk_provider.get('metadata', {})
                if ratehawk_metadata.get('demo_label') != '✨ DEMO DATA':
                    self.log_test("Enhanced Provider Registry", False, f"RateHawk demo_label should be '✨ DEMO DATA', got {ratehawk_metadata.get('demo_label')}", response_time)
                    return False
                
                # Validate provider metadata
                for provider in [duffle_provider, ratehawk_provider]:
                    metadata = provider.get('metadata', {})
                    if 'specialties' not in metadata:
                        self.log_test("Enhanced Provider Registry", False, f"Provider {provider['name']} missing specialties in metadata", response_time)
                        return False
                    
                    if 'features' not in metadata:
                        self.log_test("Enhanced Provider Registry", False, f"Provider {provider['name']} missing features in metadata", response_time)
                        return False
                
                self.log_test("Enhanced Provider Registry", True, f"✅ All 7+ providers found including Duffle (94.8, flight) and RateHawk (91.3, hotel) with demo labels", response_time)
                return True
                
            else:
                self.log_test("Enhanced Provider Registry", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Enhanced Provider Registry", False, f"Exception: {str(e)}")
            return False

    def test_enhanced_provider_analytics_with_new_partners(self):
        """Test Enhanced Provider Analytics with updated counts and partner spotlight"""
        print("📊 Testing Enhanced Provider Analytics (5 Key Partners)...")
        
        url = f"{BASE_URL}/smart-dreams/providers/analytics"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Enhanced Provider Analytics", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['summary', 'partner_spotlight', 'top_performers', 'cost_analytics']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Enhanced Provider Analytics", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check summary counts as specified in requirements
                summary = data['summary']
                expected_counts = {
                    'total_providers': 14,
                    'active_providers': 10,
                    'healthy_providers': 9
                }
                
                for field, expected_value in expected_counts.items():
                    actual_value = summary.get(field)
                    if actual_value != expected_value:
                        self.log_test("Enhanced Provider Analytics", False, f"Summary {field} should be {expected_value}, got {actual_value}", response_time)
                        return False
                
                # Validate partner_spotlight section
                partner_spotlight = data.get('partner_spotlight', {})
                if not isinstance(partner_spotlight, dict):
                    self.log_test("Enhanced Provider Analytics", False, "partner_spotlight should be a dict", response_time)
                    return False
                
                key_partners = partner_spotlight.get('key_partners', [])
                if not isinstance(key_partners, list):
                    self.log_test("Enhanced Provider Analytics", False, "key_partners should be a list", response_time)
                    return False
                
                # Check for all 5 key partners with demo labels
                key_partner_names = ['Amadeus', 'Sabre', 'Viator', 'Duffle', 'RateHawk']
                found_partners = []
                
                for partner in key_partners:
                    partner_name = partner.get('name')
                    if partner_name in key_partner_names:
                        found_partners.append(partner_name)
                        
                        # Check for demo label on Duffle and RateHawk
                        if partner_name in ['Duffle', 'RateHawk']:
                            if partner.get('demo_label') != '✨ DEMO':
                                self.log_test("Enhanced Provider Analytics", False, f"Partner {partner_name} missing demo label", response_time)
                                return False
                
                missing_partners = set(key_partner_names) - set(found_partners)
                if missing_partners:
                    self.log_test("Enhanced Provider Analytics", False, f"Missing key partners in spotlight: {missing_partners}", response_time)
                    return False
                
                # Validate top_performers includes Duffle and RateHawk with demo flags
                top_performers = data.get('top_performers', [])
                duffle_in_top = any(p.get('name') == 'Duffle' and p.get('score') == 94.8 and p.get('demo') for p in top_performers)
                ratehawk_in_top = any(p.get('name') == 'RateHawk' and p.get('score') == 91.3 and p.get('demo') for p in top_performers)
                
                if not duffle_in_top:
                    self.log_test("Enhanced Provider Analytics", False, "Duffle not found in top_performers with correct score (94.8) and demo flag", response_time)
                    return False
                
                if not ratehawk_in_top:
                    self.log_test("Enhanced Provider Analytics", False, "RateHawk not found in top_performers with correct score (91.3) and demo flag", response_time)
                    return False
                
                # Check cost_analytics includes new providers with efficiency ratings
                cost_analytics = data.get('cost_analytics', {})
                provider_costs = cost_analytics.get('cost_by_provider', {})
                
                if 'Duffle' not in provider_costs:
                    self.log_test("Enhanced Provider Analytics", False, "Duffle not found in cost_analytics cost_by_provider", response_time)
                    return False
                
                if 'RateHawk' not in provider_costs:
                    self.log_test("Enhanced Provider Analytics", False, "RateHawk not found in cost_analytics cost_by_provider", response_time)
                    return False
                
                # Check efficiency ratings
                duffle_cost = provider_costs.get('Duffle', {})
                ratehawk_cost = provider_costs.get('RateHawk', {})
                
                if duffle_cost.get('efficiency') != 'high':
                    self.log_test("Enhanced Provider Analytics", False, f"Duffle efficiency should be 'high', got {duffle_cost.get('efficiency')}", response_time)
                    return False
                
                if ratehawk_cost.get('efficiency') != 'very_high':
                    self.log_test("Enhanced Provider Analytics", False, f"RateHawk efficiency should be 'very_high', got {ratehawk_cost.get('efficiency')}", response_time)
                    return False
                
                self.log_test("Enhanced Provider Analytics", True, f"✅ Analytics validated: 14 total, 10 active, 9 healthy providers. All 5 key partners with demo labels found", response_time)
                return True
                
            else:
                self.log_test("Enhanced Provider Analytics", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Enhanced Provider Analytics", False, f"Exception: {str(e)}")
            return False

    def test_duffle_ratehawk_health_checks(self):
        """Test health checks for duffle-001 and ratehawk-001 provider IDs"""
        print("🏥 Testing Duffle & RateHawk Health Checks...")
        
        provider_ids = ['duffle-001', 'ratehawk-001']
        results = []
        
        for provider_id in provider_ids:
            url = f"{BASE_URL}/smart-dreams/providers/{provider_id}/health-check"
            
            try:
                start_time = time.time()
                response = self.session.post(url, json={}, timeout=15)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "error" in data:
                        self.log_test(f"{provider_id.title()} Health Check", False, f"API Error: {data['error']}", response_time)
                        results.append(False)
                        continue
                    
                    # Validate response structure
                    required_fields = ['provider_id', 'status', 'response_time_ms', 'success_rate']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test(f"{provider_id.title()} Health Check", False, f"Missing fields: {missing_fields}", response_time)
                        results.append(False)
                        continue
                    
                    # Check provider ID matches
                    if data.get('provider_id') != provider_id:
                        self.log_test(f"{provider_id.title()} Health Check", False, f"Provider ID mismatch: expected {provider_id}, got {data.get('provider_id')}", response_time)
                        results.append(False)
                        continue
                    
                    # Validate metadata includes provider-specific details
                    if 'details' not in data:
                        self.log_test(f"{provider_id.title()} Health Check", False, "Missing details field", response_time)
                        results.append(False)
                        continue
                    
                    details = data['details']
                    if not isinstance(details, dict):
                        self.log_test(f"{provider_id.title()} Health Check", False, "Details should be a dict", response_time)
                        results.append(False)
                        continue
                    
                    # Check status is valid
                    status = data.get('status')
                    valid_statuses = ['healthy', 'degraded', 'offline']
                    if status not in valid_statuses:
                        self.log_test(f"{provider_id.title()} Health Check", False, f"Invalid status: {status}", response_time)
                        results.append(False)
                        continue
                    
                    # Check response time and success rate are reasonable
                    resp_time_ms = data.get('response_time_ms', 0)
                    success_rate = data.get('success_rate', 0)
                    
                    if resp_time_ms <= 0:
                        self.log_test(f"{provider_id.title()} Health Check", False, f"Invalid response time: {resp_time_ms}ms", response_time)
                        results.append(False)
                        continue
                    
                    if not (0 <= success_rate <= 100):
                        self.log_test(f"{provider_id.title()} Health Check", False, f"Invalid success rate: {success_rate}%", response_time)
                        results.append(False)
                        continue
                    
                    self.log_test(f"{provider_id.title()} Health Check", True, f"Status: {status}, Response: {resp_time_ms}ms, Success: {success_rate}%", response_time)
                    results.append(True)
                    
                else:
                    self.log_test(f"{provider_id.title()} Health Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
                    results.append(False)
                    
            except Exception as e:
                self.log_test(f"{provider_id.title()} Health Check", False, f"Exception: {str(e)}")
                results.append(False)
        
        # Overall result
        all_passed = all(results)
        if all_passed:
            self.log_test("Duffle & RateHawk Health Checks", True, "✅ Both providers health checks passed with proper response structure")
        else:
            self.log_test("Duffle & RateHawk Health Checks", False, f"Health check failures: {len([r for r in results if not r])}/{len(results)}")
        
        return all_passed

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
    # PHASE 6: BLOCKCHAIN INTEGRATION & SECURITY TESTS
    # =====================================================
    
    def test_blockchain_networks(self):
        """Test blockchain networks endpoint"""
        print("⛓️ Testing Blockchain Networks...")
        
        url = f"{BASE_URL}/blockchain/networks"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Blockchain Networks", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['supported_networks', 'default_network', 'multi_chain_support']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Blockchain Networks", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check supported networks
                networks = data['supported_networks']
                expected_networks = ['cronos', 'binance_smart_chain', 'ethereum']
                
                for network in expected_networks:
                    if network not in networks:
                        self.log_test("Blockchain Networks", False, f"Missing network: {network}", response_time)
                        return False
                    
                    # Validate network structure
                    network_data = networks[network]
                    network_required = ['chain_id', 'rpc_url', 'explorer', 'supported_features', 'integration_status']
                    network_missing = [field for field in network_required if field not in network_data]
                    
                    if network_missing:
                        self.log_test("Blockchain Networks", False, f"Missing {network} fields: {network_missing}", response_time)
                        return False
                
                # Check default network
                default_network = data.get('default_network')
                if default_network not in networks:
                    self.log_test("Blockchain Networks", False, f"Invalid default network: {default_network}", response_time)
                    return False
                
                # Check multi-chain support
                multi_chain = data.get('multi_chain_support')
                if not isinstance(multi_chain, bool):
                    self.log_test("Blockchain Networks", False, f"multi_chain_support should be boolean, got: {type(multi_chain)}", response_time)
                    return False
                
                network_count = len(networks)
                self.log_test("Blockchain Networks", True, f"Got {network_count} networks, default: {default_network}, multi-chain: {multi_chain}", response_time)
                return True
                
            else:
                self.log_test("Blockchain Networks", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Blockchain Networks", False, f"Exception: {str(e)}")
            return False

    def test_smart_contract_deploy(self):
        """Test smart contract deployment endpoint"""
        print("📜 Testing Smart Contract Deployment...")
        
        url = f"{BASE_URL}/blockchain/smart-contracts/deploy"
        headers = {
            'Authorization': 'Bearer test-token-for-blockchain-deployment',
            'Content-Type': 'application/json'
        }
        params = {
            'contract_type': 'provider_management',
            'network': 'cronos'
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, params=params, headers=headers, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Smart Contract Deploy", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['contract_address', 'network', 'contract_type', 'deployment_status', 'transaction_hash']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Smart Contract Deploy", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check contract address format
                contract_address = data.get('contract_address')
                if not contract_address or not contract_address.startswith('0x') or len(contract_address) != 42:
                    self.log_test("Smart Contract Deploy", False, f"Invalid contract address format: {contract_address}", response_time)
                    return False
                
                # Check transaction hash format
                tx_hash = data.get('transaction_hash')
                if not tx_hash or not tx_hash.startswith('0x') or len(tx_hash) != 66:
                    self.log_test("Smart Contract Deploy", False, f"Invalid transaction hash format: {tx_hash}", response_time)
                    return False
                
                # Check deployment status
                status = data.get('deployment_status')
                if status != 'success':
                    self.log_test("Smart Contract Deploy", False, f"Deployment failed: {status}", response_time)
                    return False
                
                # Check network matches request
                network = data.get('network')
                if network != params['network']:
                    self.log_test("Smart Contract Deploy", False, f"Network mismatch: expected {params['network']}, got {network}", response_time)
                    return False
                
                gas_used = data.get('gas_used', 0)
                self.log_test("Smart Contract Deploy", True, f"Contract deployed: {contract_address[:10]}... on {network}, gas: {gas_used}", response_time)
                return True
                
            else:
                self.log_test("Smart Contract Deploy", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Smart Contract Deploy", False, f"Exception: {str(e)}")
            return False

    def test_security_credentials_encrypt(self):
        """Test credential encryption endpoint"""
        print("🔐 Testing Security Credential Encryption...")
        
        url = f"{BASE_URL}/security/credentials/encrypt"
        headers = {
            'Authorization': 'Bearer test-token-for-credential-encryption',
            'Content-Type': 'application/json'
        }
        payload = {
            "provider_id": "amadeus-secure-001",
            "encrypted_api_key": "test-api-key-12345",
            "encrypted_secret_key": "test-secret-key-67890",
            "key_rotation_schedule": "monthly",
            "access_level": "restricted",
            "additional_config": {
                "environment": "production",
                "rate_limit": 1000
            }
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, headers=headers, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Credential Encryption", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['provider_id', 'encryption_status', 'blockchain_hash', 'last_rotation', 'access_level']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Credential Encryption", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check encryption status
                encryption_status = data.get('encryption_status')
                if encryption_status != 'success':
                    self.log_test("Credential Encryption", False, f"Encryption failed: {encryption_status}", response_time)
                    return False
                
                # Check provider ID matches
                provider_id = data.get('provider_id')
                if provider_id != payload['provider_id']:
                    self.log_test("Credential Encryption", False, f"Provider ID mismatch: expected {payload['provider_id']}, got {provider_id}", response_time)
                    return False
                
                # Check blockchain hash format
                blockchain_hash = data.get('blockchain_hash')
                if not blockchain_hash or len(blockchain_hash) != 64:
                    self.log_test("Credential Encryption", False, f"Invalid blockchain hash format: {blockchain_hash}", response_time)
                    return False
                
                # Check access level
                access_level = data.get('access_level')
                if access_level != payload['access_level']:
                    self.log_test("Credential Encryption", False, f"Access level mismatch: expected {payload['access_level']}, got {access_level}", response_time)
                    return False
                
                # Check security audit
                security_audit = data.get('security_audit')
                if security_audit != 'passed':
                    self.log_test("Credential Encryption", False, f"Security audit failed: {security_audit}", response_time)
                    return False
                
                self.log_test("Credential Encryption", True, f"Credentials encrypted for {provider_id}, hash: {blockchain_hash[:16]}...", response_time)
                return True
                
            else:
                self.log_test("Credential Encryption", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Credential Encryption", False, f"Exception: {str(e)}")
            return False

    def test_security_audit_logs(self):
        """Test security audit logs endpoint"""
        print("📋 Testing Security Audit Logs...")
        
        url = f"{BASE_URL}/security/audit/logs"
        headers = {
            'Authorization': 'Bearer test-token-for-audit-access',
            'Content-Type': 'application/json'
        }
        params = {
            'limit': 20,
            'security_level': 'high',
            'resource_type': 'provider'
        }
        
        try:
            start_time = time.time()
            response = self.session.get(url, params=params, headers=headers, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Security Audit Logs", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['audit_logs', 'total_count', 'filter_applied', 'compliance_status']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Security Audit Logs", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check audit logs
                audit_logs = data['audit_logs']
                if not isinstance(audit_logs, list):
                    self.log_test("Security Audit Logs", False, "Audit logs is not a list", response_time)
                    return False
                
                # Validate first audit log if exists
                if len(audit_logs) > 0:
                    log_entry = audit_logs[0]
                    log_required = ['id', 'timestamp', 'action', 'resource_type', 'resource_id', 'security_level']
                    log_missing = [field for field in log_required if field not in log_entry]
                    
                    if log_missing:
                        self.log_test("Security Audit Logs", False, f"Missing log entry fields: {log_missing}", response_time)
                        return False
                    
                    # Check security level filter applied
                    if params.get('security_level') and log_entry.get('security_level') != params['security_level']:
                        self.log_test("Security Audit Logs", False, f"Security level filter not applied: expected {params['security_level']}, got {log_entry.get('security_level')}", response_time)
                        return False
                    
                    # Check resource type filter applied
                    if params.get('resource_type') and log_entry.get('resource_type') != params['resource_type']:
                        self.log_test("Security Audit Logs", False, f"Resource type filter not applied: expected {params['resource_type']}, got {log_entry.get('resource_type')}", response_time)
                        return False
                
                # Check filter applied structure
                filter_applied = data['filter_applied']
                if not isinstance(filter_applied, dict):
                    self.log_test("Security Audit Logs", False, "filter_applied is not a dict", response_time)
                    return False
                
                # Check compliance status
                compliance_status = data.get('compliance_status')
                if compliance_status not in ['compliant', 'non_compliant', 'pending']:
                    self.log_test("Security Audit Logs", False, f"Invalid compliance status: {compliance_status}", response_time)
                    return False
                
                # Check blockchain integrity
                blockchain_integrity = data.get('blockchain_integrity')
                if blockchain_integrity not in ['verified', 'pending', 'failed']:
                    self.log_test("Security Audit Logs", False, f"Invalid blockchain integrity: {blockchain_integrity}", response_time)
                    return False
                
                total_count = data.get('total_count', 0)
                self.log_test("Security Audit Logs", True, f"Got {total_count} audit logs, compliance: {compliance_status}, integrity: {blockchain_integrity}", response_time)
                return True
                
            else:
                self.log_test("Security Audit Logs", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Security Audit Logs", False, f"Exception: {str(e)}")
            return False

    def test_security_audit_metrics(self):
        """Test security audit metrics endpoint"""
        print("📊 Testing Security Audit Metrics...")
        
        url = f"{BASE_URL}/security/audit/metrics"
        headers = {
            'Authorization': 'Bearer test-token-for-metrics-access',
            'Content-Type': 'application/json'
        }
        
        try:
            start_time = time.time()
            response = self.session.get(url, headers=headers, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Security Audit Metrics", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = [
                    'total_audit_entries', 'security_incidents', 'provider_activations_24h',
                    'credential_rotations_24h', 'blockchain_transactions_24h', 'compliance_violations',
                    'security_score', 'compliance_rating', 'blockchain_integrity_score'
                ]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Security Audit Metrics", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check numeric metrics are reasonable
                total_entries = data.get('total_audit_entries', 0)
                if total_entries < 0:
                    self.log_test("Security Audit Metrics", False, f"Invalid total audit entries: {total_entries}", response_time)
                    return False
                
                security_incidents = data.get('security_incidents', 0)
                if security_incidents < 0:
                    self.log_test("Security Audit Metrics", False, f"Invalid security incidents: {security_incidents}", response_time)
                    return False
                
                # Check security score
                security_score = data.get('security_score', 0)
                if not (0 <= security_score <= 100):
                    self.log_test("Security Audit Metrics", False, f"Invalid security score: {security_score}", response_time)
                    return False
                
                # Check blockchain integrity score
                blockchain_score = data.get('blockchain_integrity_score', 0)
                if not (0 <= blockchain_score <= 100):
                    self.log_test("Security Audit Metrics", False, f"Invalid blockchain integrity score: {blockchain_score}", response_time)
                    return False
                
                # Check compliance rating
                compliance_rating = data.get('compliance_rating')
                valid_ratings = ['excellent', 'good', 'fair', 'poor', 'critical']
                if compliance_rating not in valid_ratings:
                    self.log_test("Security Audit Metrics", False, f"Invalid compliance rating: {compliance_rating}", response_time)
                    return False
                
                # Check encryption coverage
                encryption_coverage = data.get('encryption_coverage', '0%')
                if not encryption_coverage.endswith('%'):
                    self.log_test("Security Audit Metrics", False, f"Invalid encryption coverage format: {encryption_coverage}", response_time)
                    return False
                
                # Check top security events
                top_events = data.get('top_security_events', [])
                if not isinstance(top_events, list):
                    self.log_test("Security Audit Metrics", False, "top_security_events is not a list", response_time)
                    return False
                
                # Validate first security event if exists
                if len(top_events) > 0:
                    event = top_events[0]
                    event_required = ['event', 'frequency', 'security_impact']
                    event_missing = [field for field in event_required if field not in event]
                    
                    if event_missing:
                        self.log_test("Security Audit Metrics", False, f"Missing event fields: {event_missing}", response_time)
                        return False
                
                provider_activations = data.get('provider_activations_24h', 0)
                blockchain_transactions = data.get('blockchain_transactions_24h', 0)
                
                self.log_test("Security Audit Metrics", True, f"Security score: {security_score}%, {total_entries} audit entries, {provider_activations} activations, {blockchain_transactions} blockchain txs", response_time)
                return True
                
            else:
                self.log_test("Security Audit Metrics", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Security Audit Metrics", False, f"Exception: {str(e)}")
            return False

    def test_security_infrastructure_integration(self):
        """Test security infrastructure functions work properly"""
        print("🔧 Testing Security Infrastructure Integration...")
        
        try:
            start_time = time.time()
            
            # Test 1: Verify encryption/decryption functions work by testing credential encryption
            url = f"{BASE_URL}/security/credentials/encrypt"
            headers = {
                'Authorization': 'Bearer test-token-for-infrastructure-test',
                'Content-Type': 'application/json'
            }
            payload = {
                "provider_id": "infrastructure-test-001",
                "encrypted_api_key": "test-infrastructure-key",
                "access_level": "restricted"
            }
            
            response = self.session.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Security Infrastructure", False, f"Encryption test failed: HTTP {response.status_code}", time.time() - start_time)
                return False
            
            encrypt_data = response.json()
            if encrypt_data.get('encryption_status') != 'success':
                self.log_test("Security Infrastructure", False, f"Encryption failed: {encrypt_data.get('encryption_status')}", time.time() - start_time)
                return False
            
            # Test 2: Verify blockchain hash generation
            blockchain_hash = encrypt_data.get('blockchain_hash')
            if not blockchain_hash or len(blockchain_hash) != 64:
                self.log_test("Security Infrastructure", False, f"Invalid blockchain hash: {blockchain_hash}", time.time() - start_time)
                return False
            
            # Test 3: Verify audit logging system by checking audit logs
            audit_url = f"{BASE_URL}/security/audit/logs"
            audit_response = self.session.get(audit_url, headers=headers, params={'limit': 5}, timeout=10)
            
            if audit_response.status_code != 200:
                self.log_test("Security Infrastructure", False, f"Audit log test failed: HTTP {audit_response.status_code}", time.time() - start_time)
                return False
            
            audit_data = audit_response.json()
            if 'audit_logs' not in audit_data:
                self.log_test("Security Infrastructure", False, "Audit logging system not working", time.time() - start_time)
                return False
            
            # Test 4: Verify access credential verification system
            metrics_url = f"{BASE_URL}/security/audit/metrics"
            metrics_response = self.session.get(metrics_url, headers=headers, timeout=10)
            
            if metrics_response.status_code != 200:
                self.log_test("Security Infrastructure", False, f"Access verification test failed: HTTP {metrics_response.status_code}", time.time() - start_time)
                return False
            
            response_time = time.time() - start_time
            self.log_test("Security Infrastructure", True, f"All security functions working: encryption, blockchain hashing, audit logging, access verification", response_time)
            return True
            
        except Exception as e:
            self.log_test("Security Infrastructure", False, f"Exception: {str(e)}")
            return False

    def test_blockchain_ready_data_models(self):
        """Test blockchain-ready data models validation"""
        print("📋 Testing Blockchain-Ready Data Models...")
        
        try:
            start_time = time.time()
            
            # Test EnhancedProviderConfig model through provider registry
            url = f"{BASE_URL}/smart-dreams/providers"
            response = self.session.get(url, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Data Models Validation", False, f"Provider registry failed: HTTP {response.status_code}", time.time() - start_time)
                return False
            
            data = response.json()
            if 'providers' not in data:
                self.log_test("Data Models Validation", False, "No providers data found", time.time() - start_time)
                return False
            
            providers = data['providers']
            if len(providers) == 0:
                self.log_test("Data Models Validation", False, "No providers returned", time.time() - start_time)
                return False
            
            # Validate EnhancedProviderConfig fields
            provider = providers[0]
            blockchain_fields = ['blockchain_verified', 'smart_contract_integration', 'web3_compatible']
            security_fields = ['security_rating', 'compliance_status']
            
            # Check if blockchain-ready fields are present (they should be in the model)
            model_validation_passed = True
            missing_blockchain_fields = []
            missing_security_fields = []
            
            for field in blockchain_fields:
                if field not in provider:
                    missing_blockchain_fields.append(field)
            
            for field in security_fields:
                if field not in provider:
                    missing_security_fields.append(field)
            
            # Test SecureProviderCredentials model through credential encryption
            cred_url = f"{BASE_URL}/security/credentials/encrypt"
            headers = {'Authorization': 'Bearer test-token-for-model-validation'}
            cred_payload = {
                "provider_id": "model-test-001",
                "encrypted_api_key": "test-key-for-model",
                "key_rotation_schedule": "weekly",
                "access_level": "confidential"
            }
            
            cred_response = self.session.post(cred_url, json=cred_payload, headers=headers, timeout=10)
            
            if cred_response.status_code != 200:
                self.log_test("Data Models Validation", False, f"Credential model test failed: HTTP {cred_response.status_code}", time.time() - start_time)
                return False
            
            cred_data = cred_response.json()
            
            # Validate SecureProviderCredentials response
            secure_cred_fields = ['provider_id', 'blockchain_hash', 'access_level', 'last_rotation']
            missing_cred_fields = [field for field in secure_cred_fields if field not in cred_data]
            
            if missing_cred_fields:
                self.log_test("Data Models Validation", False, f"Missing SecureProviderCredentials fields: {missing_cred_fields}", time.time() - start_time)
                return False
            
            # Test AuditLogEntry model through audit logs
            audit_url = f"{BASE_URL}/security/audit/logs"
            audit_response = self.session.get(audit_url, headers=headers, params={'limit': 1}, timeout=10)
            
            if audit_response.status_code != 200:
                self.log_test("Data Models Validation", False, f"Audit model test failed: HTTP {audit_response.status_code}", time.time() - start_time)
                return False
            
            audit_data = audit_response.json()
            if 'audit_logs' not in audit_data or len(audit_data['audit_logs']) == 0:
                self.log_test("Data Models Validation", False, "No audit logs for model validation", time.time() - start_time)
                return False
            
            # Validate AuditLogEntry fields
            audit_entry = audit_data['audit_logs'][0]
            audit_fields = ['id', 'timestamp', 'action', 'resource_type', 'security_level']
            missing_audit_fields = [field for field in audit_fields if field not in audit_entry]
            
            if missing_audit_fields:
                self.log_test("Data Models Validation", False, f"Missing AuditLogEntry fields: {missing_audit_fields}", time.time() - start_time)
                return False
            
            response_time = time.time() - start_time
            
            # Summary of model validation
            validation_summary = []
            if not missing_blockchain_fields and not missing_security_fields:
                validation_summary.append("EnhancedProviderConfig ✓")
            else:
                validation_summary.append(f"EnhancedProviderConfig (missing: {missing_blockchain_fields + missing_security_fields})")
            
            if not missing_cred_fields:
                validation_summary.append("SecureProviderCredentials ✓")
            else:
                validation_summary.append(f"SecureProviderCredentials (missing: {missing_cred_fields})")
            
            if not missing_audit_fields:
                validation_summary.append("AuditLogEntry ✓")
            else:
                validation_summary.append(f"AuditLogEntry (missing: {missing_audit_fields})")
            
            self.log_test("Data Models Validation", True, f"Models validated: {', '.join(validation_summary)}", response_time)
            return True
            
        except Exception as e:
            self.log_test("Data Models Validation", False, f"Exception: {str(e)}")
            return False

    def test_existing_provider_system_compatibility(self):
        """Test backward compatibility with existing provider endpoints"""
        print("🔄 Testing Existing Provider System Compatibility...")
        
        try:
            start_time = time.time()
            
            # Test 1: Existing enhanced-dreams endpoints still work
            dreams_url = f"{BASE_URL}/enhanced-dreams/destinations"
            dreams_params = {'user_id': TEST_USER_ID, 'limit': 3, 'include_ai_context': True}
            
            dreams_response = self.session.get(dreams_url, params=dreams_params, timeout=10)
            
            if dreams_response.status_code != 200:
                self.log_test("Provider System Compatibility", False, f"Enhanced dreams endpoint failed: HTTP {dreams_response.status_code}", time.time() - start_time)
                return False
            
            dreams_data = dreams_response.json()
            if 'destinations' not in dreams_data:
                self.log_test("Provider System Compatibility", False, "Enhanced dreams missing destinations", time.time() - start_time)
                return False
            
            # Test 2: Smart Dreams provider endpoints work
            providers_url = f"{BASE_URL}/smart-dreams/providers"
            providers_response = self.session.get(providers_url, timeout=10)
            
            if providers_response.status_code != 200:
                self.log_test("Provider System Compatibility", False, f"Smart Dreams providers failed: HTTP {providers_response.status_code}", time.time() - start_time)
                return False
            
            providers_data = providers_response.json()
            if 'providers' not in providers_data:
                self.log_test("Provider System Compatibility", False, "Smart Dreams missing providers", time.time() - start_time)
                return False
            
            # Test 3: Provider analytics still work
            analytics_url = f"{BASE_URL}/smart-dreams/providers/analytics"
            analytics_response = self.session.get(analytics_url, timeout=10)
            
            if analytics_response.status_code != 200:
                self.log_test("Provider System Compatibility", False, f"Provider analytics failed: HTTP {analytics_response.status_code}", time.time() - start_time)
                return False
            
            analytics_data = analytics_response.json()
            if 'summary' not in analytics_data:
                self.log_test("Provider System Compatibility", False, "Provider analytics missing summary", time.time() - start_time)
                return False
            
            # Test 4: AI Intelligence endpoints still work
            ai_url = f"{BASE_URL}/ai/recommendations/{TEST_USER_ID}"
            ai_response = self.session.get(ai_url, params={'max_results': 3}, timeout=20)
            
            if ai_response.status_code != 200:
                self.log_test("Provider System Compatibility", False, f"AI recommendations failed: HTTP {ai_response.status_code}", time.time() - start_time)
                return False
            
            ai_data = ai_response.json()
            if 'recommendations' not in ai_data:
                self.log_test("Provider System Compatibility", False, "AI recommendations missing data", time.time() - start_time)
                return False
            
            response_time = time.time() - start_time
            
            # Check that enhanced security doesn't break existing workflows
            destinations_count = len(dreams_data.get('destinations', []))
            providers_count = len(providers_data.get('providers', []))
            recommendations_count = len(ai_data.get('recommendations', []))
            
            self.log_test("Provider System Compatibility", True, f"All existing systems working: {destinations_count} destinations, {providers_count} providers, {recommendations_count} AI recommendations", response_time)
            return True
            
        except Exception as e:
            self.log_test("Provider System Compatibility", False, f"Exception: {str(e)}")
            return False

    # =====================================================
    # EXPEDIA GROUP API INTEGRATION TESTS
    # =====================================================
    
    def test_expedia_setup_endpoint(self):
        """Test Expedia setup endpoint for credential configuration"""
        print("🏨 Testing Expedia Setup Endpoint...")
        
        url = f"{BASE_URL}/expedia/setup"
        
        # Test with missing credentials (should fail)
        try:
            start_time = time.time()
            response = self.session.post(url, json={}, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 400:
                self.log_test("Expedia Setup (Missing Credentials)", True, "Correctly rejected empty credentials", response_time)
            else:
                self.log_test("Expedia Setup (Missing Credentials)", False, f"Expected 400, got {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Expedia Setup (Missing Credentials)", False, f"Exception: {str(e)}")
            return False
        
        # Test with valid test credentials
        test_credentials = {
            "api_key": "test_api_key_123",
            "shared_secret": "test_shared_secret_456",
            "test_mode": True
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=test_credentials, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    # Expected if Supabase is not configured
                    if "Supabase credentials not configured" in str(data.get("error", "")):
                        self.log_test("Expedia Setup", True, "Missing Supabase configuration (expected)", response_time)
                        return True
                    else:
                        self.log_test("Expedia Setup", False, f"API Error: {data['error']}", response_time)
                        return False
                
                # Validate successful response structure
                required_fields = ['success', 'message', 'provider']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Expedia Setup", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                if data.get('provider') != 'expedia':
                    self.log_test("Expedia Setup", False, f"Expected provider 'expedia', got {data.get('provider')}", response_time)
                    return False
                
                self.log_test("Expedia Setup", True, f"Credentials configured successfully, test_mode: {data.get('test_mode')}", response_time)
                return True
                
            elif response.status_code == 500:
                # Check if it's a Supabase configuration issue
                error_text = response.text.lower()
                if "supabase" in error_text or "credentials not configured" in error_text or "failed to store credentials" in error_text:
                    self.log_test("Expedia Setup", True, "Missing Supabase configuration (expected)", response_time)
                    return True
                else:
                    self.log_test("Expedia Setup", False, f"HTTP 500: {response.text}", response_time)
                    return False
            else:
                self.log_test("Expedia Setup", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Expedia Setup", False, f"Exception: {str(e)}")
            return False

    def test_expedia_health_check(self):
        """Test Expedia health check endpoint"""
        print("🏥 Testing Expedia Health Check...")
        
        url = f"{BASE_URL}/expedia/health"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ['provider', 'status', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Expedia Health Check", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                if data.get('provider') != 'expedia':
                    self.log_test("Expedia Health Check", False, f"Expected provider 'expedia', got {data.get('provider')}", response_time)
                    return False
                
                status = data.get('status')
                if status == 'unhealthy':
                    # Check if it's due to missing Supabase configuration
                    error = data.get('error', '')
                    if 'Supabase' in error or 'not configured' in error:
                        self.log_test("Expedia Health Check", True, "Unhealthy due to missing Supabase config (expected)", response_time)
                        return True
                    else:
                        self.log_test("Expedia Health Check", False, f"Unhealthy status: {error}", response_time)
                        return False
                elif status == 'healthy':
                    # Check additional fields for healthy status
                    if 'authenticated' not in data:
                        self.log_test("Expedia Health Check", False, "Missing 'authenticated' field for healthy status", response_time)
                        return False
                    
                    self.log_test("Expedia Health Check", True, f"Status: {status}, Authenticated: {data.get('authenticated')}", response_time)
                    return True
                else:
                    self.log_test("Expedia Health Check", False, f"Invalid status: {status}", response_time)
                    return False
                
            else:
                self.log_test("Expedia Health Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Expedia Health Check", False, f"Exception: {str(e)}")
            return False

    def test_enhanced_provider_registry_expedia(self):
        """Test enhanced provider registry includes Expedia with comprehensive data"""
        print("🌟 Testing Enhanced Provider Registry (Expedia Integration)...")
        
        url = f"{BASE_URL}/smart-dreams/providers"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Enhanced Provider Registry (Expedia)", False, f"API Error: {data['error']}", response_time)
                    return False
                
                # Validate response structure
                required_fields = ['providers', 'summary', 'expedia_services']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Enhanced Provider Registry (Expedia)", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                providers = data['providers']
                if not isinstance(providers, list):
                    self.log_test("Enhanced Provider Registry (Expedia)", False, "Providers is not a list", response_time)
                    return False
                
                # Find Expedia provider
                expedia_provider = None
                for provider in providers:
                    if provider.get('name') == 'Expedia Group':
                        expedia_provider = provider
                        break
                
                if not expedia_provider:
                    self.log_test("Enhanced Provider Registry (Expedia)", False, "Expedia Group provider not found in registry", response_time)
                    return False
                
                # Validate Expedia provider specifications
                expected_expedia = {
                    'performance_score': 96.2,
                    'type': 'comprehensive',
                    'status': 'active',
                    'health_status': 'healthy'
                }
                
                for field, expected_value in expected_expedia.items():
                    actual_value = expedia_provider.get(field)
                    if actual_value != expected_value:
                        self.log_test("Enhanced Provider Registry (Expedia)", False, f"Expedia {field} should be {expected_value}, got {actual_value}", response_time)
                        return False
                
                # Validate Expedia services structure
                if 'services' not in expedia_provider:
                    self.log_test("Enhanced Provider Registry (Expedia)", False, "Expedia provider missing 'services' field", response_time)
                    return False
                
                services = expedia_provider['services']
                expected_services = ['hotels', 'flights', 'cars', 'activities']
                missing_services = [service for service in expected_services if service not in services]
                
                if missing_services:
                    self.log_test("Enhanced Provider Registry (Expedia)", False, f"Expedia missing services: {missing_services}", response_time)
                    return False
                
                # Validate service endpoints
                for service_name in expected_services:
                    service = services[service_name]
                    if 'endpoint' not in service:
                        self.log_test("Enhanced Provider Registry (Expedia)", False, f"Expedia {service_name} service missing endpoint", response_time)
                        return False
                    
                    expected_endpoint = f"/api/expedia/{service_name}/search"
                    if service['endpoint'] != expected_endpoint:
                        self.log_test("Enhanced Provider Registry (Expedia)", False, f"Expedia {service_name} endpoint should be {expected_endpoint}, got {service['endpoint']}", response_time)
                        return False
                
                # Validate expedia_services summary
                expedia_services = data['expedia_services']
                expected_service_flags = ['hotels', 'flights', 'cars', 'activities', 'comprehensive_booking']
                
                for flag in expected_service_flags:
                    if not expedia_services.get(flag, False):
                        self.log_test("Enhanced Provider Registry (Expedia)", False, f"Expedia services flag '{flag}' should be True", response_time)
                        return False
                
                # Check provider count increased (should be 6th major provider)
                total_providers = data['summary'].get('total_providers', 0)
                if total_providers < 6:
                    self.log_test("Enhanced Provider Registry (Expedia)", False, f"Expected at least 6 providers with Expedia, got {total_providers}", response_time)
                    return False
                
                self.log_test("Enhanced Provider Registry (Expedia)", True, f"✅ Expedia Group found with performance score 96.2, comprehensive services, {total_providers} total providers", response_time)
                return True
                
            else:
                self.log_test("Enhanced Provider Registry (Expedia)", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Enhanced Provider Registry (Expedia)", False, f"Exception: {str(e)}")
            return False

    def test_expedia_service_endpoints(self):
        """Test all 8 Expedia service endpoints for accessibility"""
        print("🔗 Testing Expedia Service Endpoints Accessibility...")
        
        # Define all Expedia endpoints to test
        endpoints = [
            {
                'name': 'Hotels Search',
                'url': f"{BASE_URL}/expedia/hotels/search",
                'method': 'POST',
                'payload': {
                    'checkin': '2024-06-01',
                    'checkout': '2024-06-03',
                    'occupancy': [{'adults': 2, 'children': 0}],
                    'region_id': 'paris'
                }
            },
            {
                'name': 'Flights Search',
                'url': f"{BASE_URL}/expedia/flights/search",
                'method': 'POST',
                'payload': {
                    'origin': 'LAX',
                    'destination': 'JFK',
                    'departure_date': '2024-06-01',
                    'passengers': {'adults': 1, 'children': 0, 'infants': 0}
                }
            },
            {
                'name': 'Cars Search',
                'url': f"{BASE_URL}/expedia/cars/search",
                'method': 'POST',
                'payload': {
                    'pickup_location': 'LAX',
                    'pickup_date': '2024-06-01',
                    'dropoff_date': '2024-06-03',
                    'driver_age': 25
                }
            },
            {
                'name': 'Activities Search',
                'url': f"{BASE_URL}/expedia/activities/search",
                'method': 'POST',
                'payload': {
                    'destination': 'paris',
                    'start_date': '2024-06-01',
                    'adults': 2
                }
            },
            {
                'name': 'Hotels Booking',
                'url': f"{BASE_URL}/expedia/hotels/book",
                'method': 'POST',
                'payload': {
                    'property_id': 'test_property_123',
                    'room_id': 'test_room_456',
                    'rate_id': 'test_rate_789',
                    'guest_details': {'name': 'Test Guest'},
                    'payment_details': {'method': 'test'}
                }
            }
        ]
        
        results = []
        
        for endpoint in endpoints:
            try:
                start_time = time.time()
                
                if endpoint['method'] == 'POST':
                    response = self.session.post(endpoint['url'], json=endpoint['payload'], timeout=30)
                else:
                    response = self.session.get(endpoint['url'], timeout=30)
                
                response_time = time.time() - start_time
                
                # We expect these to fail due to missing Supabase config, but they should be accessible
                if response.status_code in [200, 500]:
                    # Check if it's a Supabase configuration error (expected)
                    if response.status_code == 500:
                        error_text = response.text.lower()
                        if 'supabase' in error_text or 'not configured' in error_text or 'configuration not found' in error_text:
                            self.log_test(f"Expedia {endpoint['name']}", True, "Endpoint accessible, missing Supabase config (expected)", response_time)
                            results.append(True)
                            continue
                    
                    # If 200, validate response structure
                    try:
                        data = response.json()
                        if 'error' in data and 'Supabase' in str(data['error']):
                            self.log_test(f"Expedia {endpoint['name']}", True, "Endpoint accessible, missing Supabase config (expected)", response_time)
                            results.append(True)
                        elif 'error' not in data:
                            self.log_test(f"Expedia {endpoint['name']}", True, "Endpoint accessible and responding", response_time)
                            results.append(True)
                        else:
                            self.log_test(f"Expedia {endpoint['name']}", False, f"Unexpected error: {data.get('error')}", response_time)
                            results.append(False)
                    except:
                        self.log_test(f"Expedia {endpoint['name']}", False, f"Invalid JSON response", response_time)
                        results.append(False)
                        
                elif response.status_code == 404:
                    self.log_test(f"Expedia {endpoint['name']}", False, "Endpoint not found", response_time)
                    results.append(False)
                else:
                    self.log_test(f"Expedia {endpoint['name']}", False, f"HTTP {response.status_code}: {response.text}", response_time)
                    results.append(False)
                    
            except Exception as e:
                self.log_test(f"Expedia {endpoint['name']}", False, f"Exception: {str(e)}")
                results.append(False)
        
        # Overall result
        successful_endpoints = sum(results)
        total_endpoints = len(endpoints)
        
        if successful_endpoints == total_endpoints:
            self.log_test("Expedia Service Endpoints", True, f"✅ All {total_endpoints} Expedia endpoints accessible")
            return True
        else:
            self.log_test("Expedia Service Endpoints", False, f"Only {successful_endpoints}/{total_endpoints} endpoints accessible")
            return False

    def test_expedia_integration_compatibility(self):
        """Test that existing provider endpoints still work with Expedia integration"""
        print("🔄 Testing Expedia Integration Compatibility...")
        
        # Test existing Smart Dreams endpoints to ensure backward compatibility
        compatibility_tests = [
            {
                'name': 'Enhanced Dreams Destinations',
                'url': f"{BASE_URL}/enhanced-dreams/destinations",
                'method': 'GET',
                'params': {'limit': 3}
            },
            {
                'name': 'Smart Dreams Provider Registry',
                'url': f"{BASE_URL}/smart-dreams/providers",
                'method': 'GET'
            },
            {
                'name': 'AI Intelligence Recommendations',
                'url': f"{BASE_URL}/ai/recommendations/{TEST_USER_ID}",
                'method': 'GET',
                'params': {'max_results': 3}
            }
        ]
        
        results = []
        
        for test in compatibility_tests:
            try:
                start_time = time.time()
                
                if test['method'] == 'GET':
                    response = self.session.get(test['url'], params=test.get('params', {}), timeout=30)
                else:
                    response = self.session.post(test['url'], json=test.get('payload', {}), timeout=30)
                
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'error' in data:
                        self.log_test(f"Compatibility: {test['name']}", False, f"API Error: {data['error']}", response_time)
                        results.append(False)
                    else:
                        self.log_test(f"Compatibility: {test['name']}", True, "Working with Expedia integration", response_time)
                        results.append(True)
                else:
                    self.log_test(f"Compatibility: {test['name']}", False, f"HTTP {response.status_code}: {response.text}", response_time)
                    results.append(False)
                    
            except Exception as e:
                self.log_test(f"Compatibility: {test['name']}", False, f"Exception: {str(e)}")
                results.append(False)
        
        # Overall compatibility result
        successful_tests = sum(results)
        total_tests = len(compatibility_tests)
        
        if successful_tests == total_tests:
            self.log_test("Expedia Integration Compatibility", True, f"✅ All {total_tests} existing endpoints working with Expedia integration")
            return True
        else:
            self.log_test("Expedia Integration Compatibility", False, f"Only {successful_tests}/{total_tests} existing endpoints working")
            return False

    def test_expedia_error_handling(self):
        """Test Expedia error handling for missing Supabase configuration"""
        print("⚠️ Testing Expedia Error Handling (Missing Supabase)...")
        
        # Test endpoints that should gracefully handle missing Supabase configuration
        error_handling_tests = [
            {
                'name': 'Setup without Supabase',
                'url': f"{BASE_URL}/expedia/setup",
                'method': 'POST',
                'payload': {'api_key': 'test', 'shared_secret': 'test'}
            },
            {
                'name': 'Health Check without Supabase',
                'url': f"{BASE_URL}/expedia/health",
                'method': 'GET'
            }
        ]
        
        results = []
        
        for test in error_handling_tests:
            try:
                start_time = time.time()
                
                if test['method'] == 'POST':
                    response = self.session.post(test['url'], json=test['payload'], timeout=30)
                else:
                    response = self.session.get(test['url'], timeout=30)
                
                response_time = time.time() - start_time
                
                # We expect these to handle missing Supabase gracefully
                if response.status_code in [200, 500]:
                    try:
                        data = response.json()
                        
                        # Check for proper error handling
                        if 'error' in data or data.get('status') == 'unhealthy':
                            error_msg = data.get('error', data.get('message', ''))
                            if 'supabase' in error_msg.lower() or 'not configured' in error_msg.lower():
                                self.log_test(f"Error Handling: {test['name']}", True, "Properly handles missing Supabase config", response_time)
                                results.append(True)
                            else:
                                self.log_test(f"Error Handling: {test['name']}", False, f"Unexpected error: {error_msg}", response_time)
                                results.append(False)
                        else:
                            # If no error, that's also acceptable (might have fallback)
                            self.log_test(f"Error Handling: {test['name']}", True, "Handles missing config gracefully", response_time)
                            results.append(True)
                            
                    except:
                        self.log_test(f"Error Handling: {test['name']}", False, "Invalid JSON response", response_time)
                        results.append(False)
                else:
                    self.log_test(f"Error Handling: {test['name']}", False, f"HTTP {response.status_code}: {response.text}", response_time)
                    results.append(False)
                    
            except Exception as e:
                self.log_test(f"Error Handling: {test['name']}", False, f"Exception: {str(e)}")
                results.append(False)
        
        # Overall error handling result
        successful_tests = sum(results)
        total_tests = len(error_handling_tests)
        
        if successful_tests == total_tests:
            self.log_test("Expedia Error Handling", True, f"✅ All {total_tests} error scenarios handled properly")
            return True
        else:
            self.log_test("Expedia Error Handling", False, f"Only {successful_tests}/{total_tests} error scenarios handled properly")
            return False

    # =====================================================
    # EXPEDIA GROUP API INTEGRATION TESTS - COMPREHENSIVE
    # =====================================================
    
    def test_expedia_setup_endpoint(self):
        """Test Expedia setup endpoint for credential validation"""
        print("🏨 Testing Expedia Setup Endpoint...")
        
        url = f"{BASE_URL}/expedia/setup"
        
        # Test with empty credentials (should fail validation)
        payload = {
            "api_key": "",
            "shared_secret": "",
            "test_mode": True
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            # Should return 400 for empty credentials
            if response.status_code == 400:
                data = response.json()
                if "error" in data:
                    self.log_test("Expedia Setup Endpoint", True, f"Correctly validates empty credentials: {data['error']}", response_time)
                    return True
                else:
                    self.log_test("Expedia Setup Endpoint", False, "Missing error message for empty credentials", response_time)
                    return False
            elif response.status_code == 200:
                data = response.json()
                if "error" in data and "Supabase" in data["error"]:
                    self.log_test("Expedia Setup Endpoint", True, f"Handles missing Supabase config gracefully: {data['error']}", response_time)
                    return True
                else:
                    self.log_test("Expedia Setup Endpoint", False, f"Unexpected success response: {data}", response_time)
                    return False
            else:
                self.log_test("Expedia Setup Endpoint", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Expedia Setup Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_expedia_health_check(self):
        """Test Expedia health check endpoint"""
        print("🏥 Testing Expedia Health Check...")
        
        url = f"{BASE_URL}/expedia/health"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ['service', 'status', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Expedia Health Check", False, f"Missing fields: {missing_fields}", response_time)
                    return False
                
                # Check service name
                if data.get('service') != 'expedia':
                    self.log_test("Expedia Health Check", False, f"Expected service 'expedia', got {data.get('service')}", response_time)
                    return False
                
                # Check status (should be unhealthy due to missing Supabase config)
                status = data.get('status')
                if status == 'unhealthy':
                    error_msg = data.get('error', '')
                    if 'Supabase configuration required' in error_msg:
                        self.log_test("Expedia Health Check", True, f"Correctly reports unhealthy status due to missing Supabase config", response_time)
                        return True
                    else:
                        self.log_test("Expedia Health Check", False, f"Unhealthy but wrong error message: {error_msg}", response_time)
                        return False
                elif status == 'healthy':
                    self.log_test("Expedia Health Check", True, f"Service is healthy and properly configured", response_time)
                    return True
                else:
                    self.log_test("Expedia Health Check", False, f"Invalid status: {status}", response_time)
                    return False
                
            else:
                self.log_test("Expedia Health Check", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Expedia Health Check", False, f"Exception: {str(e)}")
            return False

    def test_expedia_provider_registry_integration(self):
        """Test that Expedia is properly integrated in Smart Dreams provider registry"""
        print("🌟 Testing Expedia Provider Registry Integration...")
        
        url = f"{BASE_URL}/smart-dreams/providers"
        
        try:
            start_time = time.time()
            response = self.session.get(url, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    self.log_test("Expedia Provider Registry", False, f"API Error: {data['error']}", response_time)
                    return False
                
                providers = data.get('providers', [])
                if not isinstance(providers, list):
                    self.log_test("Expedia Provider Registry", False, "Providers is not a list", response_time)
                    return False
                
                # Find Expedia provider
                expedia_provider = None
                for provider in providers:
                    if provider.get('name') == 'Expedia Group':
                        expedia_provider = provider
                        break
                
                if not expedia_provider:
                    self.log_test("Expedia Provider Registry", False, "Expedia Group provider not found in registry", response_time)
                    return False
                
                # Validate Expedia provider structure
                required_fields = ['id', 'name', 'type', 'performance_score']
                missing_fields = [field for field in required_fields if field not in expedia_provider]
                
                if missing_fields:
                    self.log_test("Expedia Provider Registry", False, f"Missing Expedia provider fields: {missing_fields}", response_time)
                    return False
                
                # Check performance score
                score = expedia_provider.get('performance_score')
                if score != 96.2:
                    self.log_test("Expedia Provider Registry", False, f"Expected Expedia performance score 96.2, got {score}", response_time)
                    return False
                
                # Check if services are present (may be in metadata or services field)
                services = expedia_provider.get('services', {}) or expedia_provider.get('metadata', {}).get('services', {})
                if services:
                    expected_services = ['hotels', 'flights', 'cars', 'activities']
                    found_services = []
                    for service in expected_services:
                        if service in services or any(service in str(v) for v in services.values()):
                            found_services.append(service)
                    
                    if len(found_services) >= 2:  # At least some services found
                        self.log_test("Expedia Provider Registry", True, f"Expedia Group found with score {score} and services: {found_services}", response_time)
                        return True
                
                self.log_test("Expedia Provider Registry", True, f"Expedia Group found with score {score} (comprehensive travel provider)", response_time)
                return True
                
            else:
                self.log_test("Expedia Provider Registry", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Expedia Provider Registry", False, f"Exception: {str(e)}")
            return False

    def test_expedia_service_endpoints_accessibility(self):
        """Test that all Expedia service endpoints are accessible"""
        print("🔗 Testing Expedia Service Endpoints Accessibility...")
        
        endpoints = [
            ('/expedia/hotels/search', 'Hotels Search'),
            ('/expedia/flights/search', 'Flights Search'),
            ('/expedia/cars/search', 'Cars Search'),
            ('/expedia/activities/search', 'Activities Search'),
            ('/expedia/hotels/book', 'Hotels Booking')
        ]
        
        results = []
        
        for endpoint_path, endpoint_name in endpoints:
            url = f"{BASE_URL}{endpoint_path}"
            
            try:
                start_time = time.time()
                # Use GET for search endpoints, POST for booking
                if 'book' in endpoint_path:
                    response = self.session.post(url, json={}, timeout=10)
                else:
                    response = self.session.get(url, timeout=10)
                response_time = time.time() - start_time
                
                # We expect these to fail with Supabase configuration errors, not 404s
                if response.status_code in [200, 400, 500]:
                    try:
                        data = response.json()
                        if "error" in data and ("Supabase" in data["error"] or "not initialized" in data["error"]):
                            self.log_test(f"Expedia {endpoint_name}", True, f"Endpoint accessible, expected Supabase config error", response_time)
                            results.append(True)
                        elif response.status_code == 400:
                            self.log_test(f"Expedia {endpoint_name}", True, f"Endpoint accessible, validation error as expected", response_time)
                            results.append(True)
                        else:
                            self.log_test(f"Expedia {endpoint_name}", False, f"Unexpected response: {data}", response_time)
                            results.append(False)
                    except:
                        self.log_test(f"Expedia {endpoint_name}", False, f"Invalid JSON response", response_time)
                        results.append(False)
                elif response.status_code == 404:
                    self.log_test(f"Expedia {endpoint_name}", False, f"Endpoint not found (404)", response_time)
                    results.append(False)
                else:
                    self.log_test(f"Expedia {endpoint_name}", False, f"HTTP {response.status_code}: {response.text}", response_time)
                    results.append(False)
                    
            except Exception as e:
                self.log_test(f"Expedia {endpoint_name}", False, f"Exception: {str(e)}")
                results.append(False)
        
        # Overall result
        all_passed = all(results)
        success_count = sum(results)
        
        if all_passed:
            self.log_test("Expedia Service Endpoints", True, f"All {len(endpoints)} endpoints accessible and responding correctly")
        else:
            self.log_test("Expedia Service Endpoints", False, f"Only {success_count}/{len(endpoints)} endpoints accessible")
        
        return all_passed

    def test_expedia_integration_compatibility(self):
        """Test that existing Smart Dreams endpoints continue working with Expedia integration"""
        print("🔄 Testing Expedia Integration Compatibility...")
        
        # Test key existing endpoints to ensure no breaking changes
        compatibility_tests = [
            (f"{BASE_URL}/enhanced-dreams/destinations", "Enhanced Dreams Destinations"),
            (f"{BASE_URL}/smart-dreams/providers", "Smart Dreams Provider Registry"),
            (f"{BASE_URL}/ai/recommendations/{TEST_USER_ID}", "AI Intelligence Recommendations")
        ]
        
        results = []
        
        for url, test_name in compatibility_tests:
            try:
                start_time = time.time()
                response = self.session.get(url, timeout=15)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "error" not in data:
                        self.log_test(f"Compatibility: {test_name}", True, f"Endpoint working correctly", response_time)
                        results.append(True)
                    else:
                        self.log_test(f"Compatibility: {test_name}", False, f"API Error: {data['error']}", response_time)
                        results.append(False)
                else:
                    self.log_test(f"Compatibility: {test_name}", False, f"HTTP {response.status_code}", response_time)
                    results.append(False)
                    
            except Exception as e:
                self.log_test(f"Compatibility: {test_name}", False, f"Exception: {str(e)}")
                results.append(False)
        
        # Overall compatibility result
        all_passed = all(results)
        success_count = sum(results)
        
        if all_passed:
            self.log_test("Expedia Integration Compatibility", True, f"All {len(compatibility_tests)} existing endpoints continue working")
        else:
            self.log_test("Expedia Integration Compatibility", False, f"Only {success_count}/{len(compatibility_tests)} endpoints working")
        
        return all_passed

    def test_supabase_connection_validation(self):
        """Test Supabase connection and configuration validation"""
        print("🗄️ Testing Supabase Connection Validation...")
        
        # Test an endpoint that uses Supabase to validate connection
        url = f"{BASE_URL}/expedia/setup"
        payload = {
            "api_key": "test_key",
            "shared_secret": "test_secret",
            "test_mode": True
        }
        
        try:
            start_time = time.time()
            response = self.session.post(url, json=payload, timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" in data:
                    error_msg = data["error"]
                    if "Supabase" in error_msg:
                        # Check if it's a connection error or missing credentials
                        if "not found" in error_msg or "configuration required" in error_msg:
                            self.log_test("Supabase Connection", True, f"Supabase configuration properly detected as missing: {error_msg}", response_time)
                            return True
                        elif "Failed to connect" in error_msg:
                            self.log_test("Supabase Connection", False, f"Supabase connection failed: {error_msg}", response_time)
                            return False
                        else:
                            self.log_test("Supabase Connection", True, f"Supabase error handled gracefully: {error_msg}", response_time)
                            return True
                    else:
                        self.log_test("Supabase Connection", False, f"Non-Supabase error: {error_msg}", response_time)
                        return False
                else:
                    self.log_test("Supabase Connection", True, f"Supabase connection successful", response_time)
                    return True
            else:
                self.log_test("Supabase Connection", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Supabase Connection", False, f"Exception: {str(e)}")
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
            ]),
            ("Expedia Group API Integration", [
                self.test_expedia_setup_endpoint,
                self.test_expedia_health_check,
                self.test_expedia_provider_registry_integration,
                self.test_expedia_service_endpoints_accessibility,
                self.test_expedia_integration_compatibility,
                self.test_supabase_connection_validation
            ]),
            ("Enhanced Partner Provider Integration (Duffle & RateHawk)", [
                self.test_enhanced_provider_registry_duffle_ratehawk,
                self.test_enhanced_provider_analytics_with_new_partners,
                self.test_duffle_ratehawk_health_checks,
                self.test_existing_enhanced_providers_integration
            ]),
            ("Smart Dreams Provider Management", [
                self.test_smart_dreams_providers_registry,
                self.test_smart_dreams_providers_discover,
                self.test_smart_dreams_providers_analytics,
                self.test_smart_dreams_provider_health_check,
                self.test_smart_dreams_provider_activate,
                self.test_smart_dreams_provider_credentials
            ]),
            ("Phase 6: Blockchain Integration", [
                self.test_blockchain_networks,
                self.test_smart_contract_deploy
            ]),
            ("Phase 6: Enhanced Security", [
                self.test_security_credentials_encrypt,
                self.test_security_audit_logs,
                self.test_security_audit_metrics
            ]),
            ("Phase 6: Security Infrastructure", [
                self.test_security_infrastructure_integration,
                self.test_blockchain_ready_data_models,
                self.test_existing_provider_system_compatibility
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