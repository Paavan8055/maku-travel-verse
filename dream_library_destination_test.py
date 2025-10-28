"""
Comprehensive Testing for Enhanced Dream Library and Destination Content APIs
Tests all 16 endpoints with validation requirements
"""

import requests
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://dream-marketplace.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test_header(title):
    print(f"\n{'='*80}")
    print(f"{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{'='*80}")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}ℹ {message}{Colors.RESET}")

# Test Results Storage
test_results = {
    "dream_library": [],
    "destination_content": [],
    "total_tests": 0,
    "passed": 0,
    "failed": 0
}

def record_test(category, test_name, passed, details=""):
    test_results[category].append({
        "test": test_name,
        "passed": passed,
        "details": details
    })
    test_results["total_tests"] += 1
    if passed:
        test_results["passed"] += 1
        print_success(f"{test_name}: {details}")
    else:
        test_results["failed"] += 1
        print_error(f"{test_name}: {details}")


# ============================================================================
# ENHANCED DREAM LIBRARY API TESTS (9 endpoints)
# ============================================================================

def test_dream_library_featured():
    """Test GET /api/dream-library/featured with region and category filters"""
    print_test_header("TEST 1: Enhanced Dream Library - Featured Dreams")
    
    # Test 1.1: Get all featured dreams
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/featured", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            dreams_count = len(data.get('dreams', []))
            record_test("dream_library", "Featured Dreams (All)", True, 
                       f"Retrieved {dreams_count} dreams")
        else:
            record_test("dream_library", "Featured Dreams (All)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Featured Dreams (All)", False, str(e))
    
    # Test 1.2: Filter by region=Asia
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/featured?region=Asia", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            asia_dreams = data.get('dreams', [])
            all_asia = all(d.get('region') == 'Asia' for d in asia_dreams)
            record_test("dream_library", "Featured Dreams (region=Asia)", all_asia, 
                       f"Retrieved {len(asia_dreams)} Asia dreams")
        else:
            record_test("dream_library", "Featured Dreams (region=Asia)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Featured Dreams (region=Asia)", False, str(e))
    
    # Test 1.3: Filter by region=Middle East
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/featured?region=Middle East", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            me_dreams = data.get('dreams', [])
            all_me = all(d.get('region') == 'Middle East' for d in me_dreams)
            record_test("dream_library", "Featured Dreams (region=Middle East)", all_me, 
                       f"Retrieved {len(me_dreams)} Middle East dreams")
        else:
            record_test("dream_library", "Featured Dreams (region=Middle East)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Featured Dreams (region=Middle East)", False, str(e))
    
    # Test 1.4: Filter by category=wellness
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/featured?category=wellness", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            wellness_dreams = data.get('dreams', [])
            has_wellness = all('wellness' in d.get('category', '').lower() for d in wellness_dreams)
            record_test("dream_library", "Featured Dreams (category=wellness)", has_wellness, 
                       f"Retrieved {len(wellness_dreams)} wellness dreams")
        else:
            record_test("dream_library", "Featured Dreams (category=wellness)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Featured Dreams (category=wellness)", False, str(e))
    
    # Test 1.5: Filter by category=cultural
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/featured?category=cultural", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            cultural_dreams = data.get('dreams', [])
            has_cultural = all('cultural' in d.get('category', '').lower() for d in cultural_dreams)
            record_test("dream_library", "Featured Dreams (category=cultural)", has_cultural, 
                       f"Retrieved {len(cultural_dreams)} cultural dreams")
        else:
            record_test("dream_library", "Featured Dreams (category=cultural)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Featured Dreams (category=cultural)", False, str(e))


def test_dream_library_details():
    """Test GET /api/dream-library/{dream_id}"""
    print_test_header("TEST 2: Enhanced Dream Library - Dream Details")
    
    # Test 2.1: India Golden Triangle
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/india-golden-triangle", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            dream = data.get('dream', {})
            
            # Validate complete itinerary (3+ days)
            itinerary = dream.get('itinerary', [])
            has_complete_itinerary = len(itinerary) >= 3
            
            # Validate Viator activities
            viator_activities = dream.get('viator_activities_real', [])
            has_viator = len(viator_activities) > 0
            all_have_product_codes = all('product_code' in a for a in viator_activities)
            all_have_ratings = all('rating' in a for a in viator_activities)
            
            # Validate Expedia hotels
            expedia_hotels = dream.get('expedia_hotels_real', [])
            has_expedia = len(expedia_hotels) > 0
            all_have_price = all('price_per_night' in h for h in expedia_hotels)
            all_have_amenities = all('amenities' in h for h in expedia_hotels)
            
            # Validate promotions
            promotions = dream.get('promotions', [])
            has_promotions = len(promotions) > 0
            all_have_discount = all('discount_percent' in p for p in promotions)
            all_have_codes = all('code' in p or 'bonus' in p for p in promotions)
            
            all_valid = (has_complete_itinerary and has_viator and all_have_product_codes and 
                        all_have_ratings and has_expedia and all_have_price and all_have_amenities and
                        has_promotions and all_have_discount and all_have_codes)
            
            details = f"Itinerary: {len(itinerary)} days, Viator: {len(viator_activities)}, Expedia: {len(expedia_hotels)}, Promos: {len(promotions)}"
            record_test("dream_library", "Dream Details (india-golden-triangle)", all_valid, details)
        else:
            record_test("dream_library", "Dream Details (india-golden-triangle)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Dream Details (india-golden-triangle)", False, str(e))
    
    # Test 2.2: Jordan Petra Wadi Rum
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/jordan-petra-wadi-rum", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            dream = data.get('dream', {})
            itinerary = dream.get('itinerary', [])
            viator_activities = dream.get('viator_activities_real', [])
            expedia_hotels = dream.get('expedia_hotels_real', [])
            
            has_complete_data = (len(itinerary) >= 3 and len(viator_activities) > 0 and 
                                len(expedia_hotels) > 0)
            
            details = f"Itinerary: {len(itinerary)} days, Viator: {len(viator_activities)}, Expedia: {len(expedia_hotels)}"
            record_test("dream_library", "Dream Details (jordan-petra-wadi-rum)", has_complete_data, details)
        else:
            record_test("dream_library", "Dream Details (jordan-petra-wadi-rum)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Dream Details (jordan-petra-wadi-rum)", False, str(e))


def test_dream_library_promotions():
    """Test GET /api/dream-library/promotions/active"""
    print_test_header("TEST 3: Enhanced Dream Library - Active Promotions")
    
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/promotions/active", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            promotions = data.get('promotions', [])
            
            # Validate all promotions have required fields
            all_have_discount = all('discount_percent' in p for p in promotions)
            all_have_codes = all('code' in p or 'bonus' in p for p in promotions)
            all_have_dream_id = all('dream_id' in p for p in promotions)
            
            all_valid = all_have_discount and all_have_codes and all_have_dream_id
            
            details = f"Retrieved {len(promotions)} promotions, all have discount_percent and codes"
            record_test("dream_library", "Active Promotions", all_valid, details)
        else:
            record_test("dream_library", "Active Promotions", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Active Promotions", False, str(e))


def test_dream_library_curated_lists():
    """Test GET /api/dream-library/curated-lists"""
    print_test_header("TEST 4: Enhanced Dream Library - Curated Lists")
    
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/curated-lists", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            curated_lists = data.get('curated_lists', {})
            
            # Check for required categories
            has_wellness = 'wellness_retreats' in curated_lists
            has_adventure = 'adventure_journeys' in curated_lists
            has_budget = 'budget_friendly' in curated_lists
            has_spiritual = 'spiritual_paths' in curated_lists
            
            all_categories = has_wellness and has_adventure and has_budget and has_spiritual
            
            details = f"Categories: wellness={has_wellness}, adventure={has_adventure}, budget={has_budget}, spiritual={has_spiritual}"
            record_test("dream_library", "Curated Lists", all_categories, details)
        else:
            record_test("dream_library", "Curated Lists", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Curated Lists", False, str(e))


def test_dream_library_viator_search():
    """Test POST /api/dream-library/viator/activities/search"""
    print_test_header("TEST 5: Enhanced Dream Library - Viator Activities Search")
    
    # Test 5.1: Search for India
    try:
        response = requests.post(
            f"{BACKEND_URL}/dream-library/viator/activities/search?destination=India",
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            activities = data.get('activities', [])
            
            # Validate activities have real product codes and ratings
            all_have_product_codes = all('product_code' in a for a in activities)
            all_have_ratings = all('rating' in a for a in activities)
            all_have_price = all('price' in a for a in activities)
            
            all_valid = all_have_product_codes and all_have_ratings and all_have_price
            
            details = f"Found {len(activities)} activities for India, all have product_code, rating, price"
            record_test("dream_library", "Viator Search (destination=India)", all_valid, details)
        else:
            record_test("dream_library", "Viator Search (destination=India)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Viator Search (destination=India)", False, str(e))
    
    # Test 5.2: Search for Dubai
    try:
        response = requests.post(
            f"{BACKEND_URL}/dream-library/viator/activities/search?destination=Dubai",
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            activities = data.get('activities', [])
            has_activities = len(activities) > 0
            
            details = f"Found {len(activities)} activities for Dubai"
            record_test("dream_library", "Viator Search (destination=Dubai)", has_activities, details)
        else:
            record_test("dream_library", "Viator Search (destination=Dubai)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Viator Search (destination=Dubai)", False, str(e))


def test_dream_library_expedia_search():
    """Test POST /api/dream-library/expedia/hotels/search"""
    print_test_header("TEST 6: Enhanced Dream Library - Expedia Hotels Search")
    
    # Test 6.1: Search for Jaipur
    try:
        response = requests.post(
            f"{BACKEND_URL}/dream-library/expedia/hotels/search?destination=Jaipur",
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            hotels = data.get('hotels', [])
            
            # Validate hotels have price_per_night and amenities
            all_have_price = all('price_per_night' in h for h in hotels)
            all_have_amenities = all('amenities' in h for h in hotels)
            all_have_rating = all('rating' in h for h in hotels)
            
            all_valid = all_have_price and all_have_amenities and all_have_rating
            
            details = f"Found {len(hotels)} hotels for Jaipur, all have price_per_night and amenities"
            record_test("dream_library", "Expedia Search (destination=Jaipur)", all_valid, details)
        else:
            record_test("dream_library", "Expedia Search (destination=Jaipur)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Expedia Search (destination=Jaipur)", False, str(e))
    
    # Test 6.2: Search for Jordan
    try:
        response = requests.post(
            f"{BACKEND_URL}/dream-library/expedia/hotels/search?destination=Jordan",
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            hotels = data.get('hotels', [])
            has_hotels = len(hotels) > 0
            
            details = f"Found {len(hotels)} hotels for Jordan"
            record_test("dream_library", "Expedia Search (destination=Jordan)", has_hotels, details)
        else:
            record_test("dream_library", "Expedia Search (destination=Jordan)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Expedia Search (destination=Jordan)", False, str(e))


def test_dream_library_widgets():
    """Test GET /api/dream-library/widgets/trending and /widgets/seasonal"""
    print_test_header("TEST 7: Enhanced Dream Library - Widgets")
    
    # Test 7.1: Trending Widget
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/widgets/trending", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            dreams = data.get('dreams', [])
            
            # Validate widget returns formatted data
            all_have_id = all('id' in d for d in dreams)
            all_have_title = all('title' in d for d in dreams)
            all_have_quick_facts = all('quick_facts' in d for d in dreams)
            
            all_valid = all_have_id and all_have_title and all_have_quick_facts
            
            details = f"Trending widget returns {len(dreams)} dreams with formatted data"
            record_test("dream_library", "Trending Widget", all_valid, details)
        else:
            record_test("dream_library", "Trending Widget", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Trending Widget", False, str(e))
    
    # Test 7.2: Seasonal Widget
    try:
        response = requests.get(f"{BACKEND_URL}/dream-library/widgets/seasonal", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            deals = data.get('deals', [])
            
            # Validate seasonal deals have discount info
            all_have_discount = all('discount_percent' in d for d in deals)
            all_have_promo_code = all('promo_code' in d for d in deals)
            all_have_season = all('season' in d for d in deals)
            
            all_valid = all_have_discount and all_have_promo_code and all_have_season
            
            details = f"Seasonal widget returns {len(deals)} deals with discount info"
            record_test("dream_library", "Seasonal Widget", all_valid, details)
        else:
            record_test("dream_library", "Seasonal Widget", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("dream_library", "Seasonal Widget", False, str(e))


# ============================================================================
# DESTINATION CONTENT API TESTS (7 endpoints)
# ============================================================================

def test_destinations_all():
    """Test GET /api/destinations/all"""
    print_test_header("TEST 8: Destination Content - All Destinations")
    
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/all", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            destinations = data.get('destinations', [])
            stats = data.get('statistics', {})
            
            # Validate 66 destinations
            has_66_destinations = len(destinations) == 66
            
            # Validate 267 total experiences
            total_experiences = stats.get('total_experiences', 0)
            has_267_experiences = total_experiences == 267
            
            details = f"Destinations: {len(destinations)}, Total Experiences: {total_experiences}"
            record_test("destination_content", "All Destinations", 
                       has_66_destinations and has_267_experiences, details)
        else:
            record_test("destination_content", "All Destinations", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "All Destinations", False, str(e))


def test_destination_details():
    """Test GET /api/destinations/{destination_name}"""
    print_test_header("TEST 9: Destination Content - Destination Details")
    
    # Test 9.1: India
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/India", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            destination = data.get('destination', {})
            
            has_spiritual_sites = len(destination.get('spiritual_sites', [])) > 0
            has_hidden_gems = len(destination.get('hidden_gems', [])) > 0
            has_local_businesses = len(destination.get('local_businesses', [])) > 0
            
            all_valid = has_spiritual_sites and has_hidden_gems and has_local_businesses
            
            details = f"Spiritual: {len(destination.get('spiritual_sites', []))}, Gems: {len(destination.get('hidden_gems', []))}, Businesses: {len(destination.get('local_businesses', []))}"
            record_test("destination_content", "Destination Details (India)", all_valid, details)
        else:
            record_test("destination_content", "Destination Details (India)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "Destination Details (India)", False, str(e))
    
    # Test 9.2: Jordan
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/Jordan", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            destination = data.get('destination', {})
            has_content = destination.get('total_experiences', 0) > 0
            
            details = f"Total experiences: {destination.get('total_experiences', 0)}"
            record_test("destination_content", "Destination Details (Jordan)", has_content, details)
        else:
            record_test("destination_content", "Destination Details (Jordan)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "Destination Details (Jordan)", False, str(e))


def test_destinations_by_region():
    """Test GET /api/destinations/search/by-region"""
    print_test_header("TEST 10: Destination Content - Search by Region")
    
    # Test 10.1: Asia
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/search/by-region?region=Asia", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            destinations = data.get('destinations', [])
            has_destinations = len(destinations) > 0
            
            details = f"Found {len(destinations)} destinations in Asia"
            record_test("destination_content", "Search by Region (Asia)", has_destinations, details)
        else:
            record_test("destination_content", "Search by Region (Asia)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "Search by Region (Asia)", False, str(e))
    
    # Test 10.2: Middle East
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/search/by-region?region=Middle East", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            destinations = data.get('destinations', [])
            has_destinations = len(destinations) > 0
            
            details = f"Found {len(destinations)} destinations in Middle East"
            record_test("destination_content", "Search by Region (Middle East)", has_destinations, details)
        else:
            record_test("destination_content", "Search by Region (Middle East)", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "Search by Region (Middle East)", False, str(e))


def test_spiritual_sites():
    """Test GET /api/destinations/spiritual-sites/all"""
    print_test_header("TEST 11: Destination Content - All Spiritual Sites")
    
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/spiritual-sites/all", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            sites = data.get('spiritual_sites', [])
            
            # Validate 58 spiritual sites
            has_58_sites = len(sites) == 58
            
            details = f"Retrieved {len(sites)} spiritual sites (expected 58)"
            record_test("destination_content", "All Spiritual Sites", has_58_sites, details)
        else:
            record_test("destination_content", "All Spiritual Sites", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "All Spiritual Sites", False, str(e))


def test_hidden_gems():
    """Test GET /api/destinations/hidden-gems/all"""
    print_test_header("TEST 12: Destination Content - All Hidden Gems")
    
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/hidden-gems/all", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            gems = data.get('hidden_gems', [])
            
            # Validate 120 hidden gems
            has_120_gems = len(gems) == 120
            
            details = f"Retrieved {len(gems)} hidden gems (expected 120)"
            record_test("destination_content", "All Hidden Gems", has_120_gems, details)
        else:
            record_test("destination_content", "All Hidden Gems", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "All Hidden Gems", False, str(e))


def test_local_businesses():
    """Test GET /api/destinations/local-businesses/all"""
    print_test_header("TEST 13: Destination Content - All Local Businesses")
    
    try:
        response = requests.get(f"{BACKEND_URL}/destinations/local-businesses/all", timeout=10)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            businesses = data.get('local_businesses', [])
            
            # Validate 89 local businesses
            has_89_businesses = len(businesses) == 89
            
            details = f"Retrieved {len(businesses)} local businesses (expected 89)"
            record_test("destination_content", "All Local Businesses", has_89_businesses, details)
        else:
            record_test("destination_content", "All Local Businesses", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "All Local Businesses", False, str(e))


def test_personalized_recommendations():
    """Test GET /api/destinations/recommendations/for-user"""
    print_test_header("TEST 14: Destination Content - Personalized Recommendations")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/destinations/recommendations/for-user?user_preferences=spiritual&budget=mid-range",
            timeout=10
        )
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            recommendations = data.get('recommendations', [])
            
            # Validate recommendations have scores and reasons
            all_have_score = all('score' in r for r in recommendations)
            all_have_reasons = all('reasons' in r for r in recommendations)
            
            all_valid = all_have_score and all_have_reasons
            
            details = f"Retrieved {len(recommendations)} personalized recommendations"
            record_test("destination_content", "Personalized Recommendations", all_valid, details)
        else:
            record_test("destination_content", "Personalized Recommendations", False, 
                       f"Status {response.status_code}")
    except Exception as e:
        record_test("destination_content", "Personalized Recommendations", False, str(e))


# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

def run_all_tests():
    """Execute all tests"""
    print(f"\n{Colors.BLUE}{'='*80}")
    print(f"COMPREHENSIVE TESTING: Enhanced Dream Library & Destination Content APIs")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"{'='*80}{Colors.RESET}\n")
    
    # Enhanced Dream Library Tests (9 endpoints)
    test_dream_library_featured()
    test_dream_library_details()
    test_dream_library_promotions()
    test_dream_library_curated_lists()
    test_dream_library_viator_search()
    test_dream_library_expedia_search()
    test_dream_library_widgets()
    
    # Destination Content Tests (7 endpoints)
    test_destinations_all()
    test_destination_details()
    test_destinations_by_region()
    test_spiritual_sites()
    test_hidden_gems()
    test_local_businesses()
    test_personalized_recommendations()
    
    # Print Summary
    print_test_header("TEST SUMMARY")
    print(f"\n{Colors.BLUE}Enhanced Dream Library API:{Colors.RESET}")
    for test in test_results["dream_library"]:
        status = f"{Colors.GREEN}✓{Colors.RESET}" if test["passed"] else f"{Colors.RED}✗{Colors.RESET}"
        print(f"  {status} {test['test']}: {test['details']}")
    
    print(f"\n{Colors.BLUE}Destination Content API:{Colors.RESET}")
    for test in test_results["destination_content"]:
        status = f"{Colors.GREEN}✓{Colors.RESET}" if test["passed"] else f"{Colors.RED}✗{Colors.RESET}"
        print(f"  {status} {test['test']}: {test['details']}")
    
    print(f"\n{'='*80}")
    print(f"{Colors.BLUE}FINAL RESULTS:{Colors.RESET}")
    print(f"  Total Tests: {test_results['total_tests']}")
    print(f"  {Colors.GREEN}Passed: {test_results['passed']}{Colors.RESET}")
    print(f"  {Colors.RED}Failed: {test_results['failed']}{Colors.RESET}")
    
    pass_rate = (test_results['passed'] / test_results['total_tests'] * 100) if test_results['total_tests'] > 0 else 0
    print(f"  Pass Rate: {pass_rate:.1f}%")
    print(f"{'='*80}\n")
    
    return test_results


if __name__ == "__main__":
    results = run_all_tests()
    
    # Exit with appropriate code
    exit(0 if results['failed'] == 0 else 1)
