"""
Email System Testing Script
Tests all 3 email templates and queue endpoint
"""

import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_list_templates():
    """Test listing available templates"""
    print("\n🔍 Testing: List Email Templates")
    response = requests.get(f"{BASE_URL}/emails/templates")
    data = response.json()
    
    if response.status_code == 200:
        print(f"✅ PASS - Found {data['count']} templates")
        for name, info in data['templates'].items():
            print(f"   - {name}: {info['description']}")
        return True
    else:
        print(f"❌ FAIL - Status: {response.status_code}")
        return False

def test_queue_dream_match_email():
    """Test dream match email queue"""
    print("\n🔍 Testing: Queue Dream Match Email")
    
    payload = {
        "template": "dream_match",
        "user_id": "user-123",
        "recipient_email": "traveler@example.com",
        "data": {
            "first_name": "Sarah",
            "destination": "Bali",
            "hotel_name": "Ubud Serenity Resort",
            "start_date": "August 12, 2025",
            "end_date": "August 26, 2025",
            "price": "1,375",
            "discount": "38",
            "savings": "875",
            "score": "94",
            "perks_1": "Wellness spa access",
            "perks_2": "Daily yoga sessions",
            "perks_3": "Spiritual tour packages",
            "booking_url": "https://maku.travel/book/12345",
            "all_deals_url": "https://maku.travel/deals",
            "help_url": "https://maku.travel/help"
        }
    }
    
    response = requests.post(f"{BASE_URL}/emails/queue", json=payload)
    data = response.json()
    
    if response.status_code == 200 and data.get('queued'):
        print(f"✅ PASS - Email queued: {data['email_id']}")
        print(f"   Log: {data['log_entry']}")
        return True
    else:
        print(f"❌ FAIL - Status: {response.status_code}")
        print(f"   Error: {data.get('detail', 'Unknown error')}")
        return False

def test_queue_campaign_ledger_email():
    """Test campaign ledger email queue"""
    print("\n🔍 Testing: Queue Campaign Ledger Email")
    
    payload = {
        "template": "campaign_ledger",
        "user_id": "partner-456",
        "recipient_email": "partner@hotel.com",
        "data": {
            "partner_name": "Grand Beach Resort",
            "campaign_title": "Summer Off-Season Special",
            "rooms_booked_today": "3",
            "total_filled": "45",
            "total_available": "50",
            "revenue": "67,500",
            "top_date_1": "Aug 15-17",
            "top_bookings_1": "8",
            "top_date_2": "Jul 20-22",
            "top_bookings_2": "6",
            "top_date_3": "Jun 30-Jul 2",
            "top_bookings_3": "5",
            "rooms_remaining": "5",
            "ledger_url": "https://maku.travel/dashboard/campaigns/123/ledger",
            "create_campaign_url": "https://maku.travel/dashboard/campaigns/new"
        }
    }
    
    response = requests.post(f"{BASE_URL}/emails/queue", json=payload)
    data = response.json()
    
    if response.status_code == 200 and data.get('queued'):
        print(f"✅ PASS - Email queued: {data['email_id']}")
        print(f"   Log: {data['log_entry']}")
        return True
    else:
        print(f"❌ FAIL - Status: {response.status_code}")
        print(f"   Error: {data.get('detail', 'Unknown error')}")
        return False

def test_queue_cashback_email():
    """Test cashback notification email queue"""
    print("\n🔍 Testing: Queue Cashback Email")
    
    payload = {
        "template": "cashback",
        "user_id": "user-789",
        "recipient_email": "traveler2@example.com",
        "data": {
            "first_name": "John",
            "destination": "Bali",
            "cashback_amount": "50.00",
            "cashback_percentage": "3",
            "wallet_balance": "150.00",
            "tier": "Silver",
            "total_earned": "200.00",
            "wallet_url": "https://maku.travel/wallet",
            "browse_deals_url": "https://maku.travel/deals"
        }
    }
    
    response = requests.post(f"{BASE_URL}/emails/queue", json=payload)
    data = response.json()
    
    if response.status_code == 200 and data.get('queued'):
        print(f"✅ PASS - Email queued: {data['email_id']}")
        print(f"   Log: {data['log_entry']}")
        return True
    else:
        print(f"❌ FAIL - Status: {response.status_code}")
        print(f"   Error: {data.get('detail', 'Unknown error')}")
        return False

def test_invalid_template():
    """Test invalid template handling"""
    print("\n🔍 Testing: Invalid Template Error Handling")
    
    payload = {
        "template": "nonexistent",
        "user_id": "user-123",
        "recipient_email": "test@example.com",
        "data": {}
    }
    
    response = requests.post(f"{BASE_URL}/emails/queue", json=payload)
    
    if response.status_code == 400:
        print(f"✅ PASS - Correctly rejected invalid template")
        return True
    else:
        print(f"❌ FAIL - Should return 400 for invalid template")
        return False

def test_missing_data():
    """Test missing template data handling"""
    print("\n🔍 Testing: Missing Template Data Error Handling")
    
    payload = {
        "template": "dream_match",
        "user_id": "user-123",
        "recipient_email": "test@example.com",
        "data": {
            "first_name": "Test"
            # Missing all other required fields
        }
    }
    
    response = requests.post(f"{BASE_URL}/emails/queue", json=payload)
    
    if response.status_code == 400:
        print(f"✅ PASS - Correctly rejected incomplete data")
        return True
    else:
        print(f"❌ FAIL - Should return 400 for incomplete data")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("MAKU Off-Season Engine - Email System Testing")
    print("=" * 80)
    print("\n⚠️  NOTE: Emails are logged only (no actual sending in MVP)")
    print("   Production will integrate with SendGrid/Twilio\n")
    
    tests = [
        ("List Templates", test_list_templates),
        ("Dream Match Email", test_queue_dream_match_email),
        ("Campaign Ledger Email", test_queue_campaign_ledger_email),
        ("Cashback Email", test_queue_cashback_email),
        ("Invalid Template", test_invalid_template),
        ("Missing Data", test_missing_data),
    ]
    
    results = []
    for test_name, test_func in tests:
        result = test_func()
        results.append(result)
    
    # Summary
    passed = sum(results)
    total = len(results)
    
    print("\n" + "=" * 80)
    print(f"SUMMARY: {passed}/{total} tests passed")
    print("=" * 80)
    
    if passed == total:
        print("\n✅ All email system tests passed!")
        print("   Email templates are ready for production integration")
    else:
        print("\n⚠️  Some tests failed. Check implementation.")
    
    print("\n📝 NEXT STEPS FOR PRODUCTION:")
    print("   1. Integrate SendGrid API key in backend/.env")
    print("   2. Replace logging with actual sendgrid_client.send() calls")
    print("   3. Set up email scheduling (cron jobs for daily ledgers)")
    print("   4. Add email preferences/unsubscribe functionality")
