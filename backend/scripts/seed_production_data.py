"""
Comprehensive Data Seeding Script
Seeds: Providers, Local Businesses, Test Partners, Inventory
"""

import os
import sys
from supabase import create_client
from datetime import datetime, timedelta
import random

# Supabase setup
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://iomeddeasarntjhqzndu.supabase.co')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_SERVICE_KEY:
    print("❌ SUPABASE_SERVICE_ROLE_KEY not found in environment")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def seed_providers():
    """Seed provider registry with all major providers"""
    print("\n🌍 Seeding Provider Registry...")
    
    providers = [
        {
            'provider_name': 'sabre',
            'display_name': 'Sabre GDS',
            'provider_type': 'flight',
            'api_base_url': 'https://api.sabre.com',
            'supports_hotels': True,
            'supports_flights': True,
            'supports_activities': False,
            'supported_regions': ['north_america', 'europe', 'asia'],
            'priority': 10,
            'eco_rating': 75,
            'fee_transparency_score': 85,
            'is_active': True,
            'is_test_mode': True
        },
        {
            'provider_name': 'hotelbeds',
            'display_name': 'HotelBeds',
            'provider_type': 'hotel',
            'api_base_url': 'https://api.hotelbeds.com',
            'supports_hotels': True,
            'supports_flights': False,
            'supports_activities': False,
            'supported_regions': ['europe', 'americas', 'asia'],
            'priority': 20,
            'eco_rating': 80,
            'fee_transparency_score': 90,
            'is_active': True,
            'is_test_mode': True
        },
        {
            'provider_name': 'amadeus',
            'display_name': 'Amadeus',
            'provider_type': 'package',
            'api_base_url': 'https://api.amadeus.com',
            'supports_hotels': True,
            'supports_flights': True,
            'supports_activities': True,
            'supported_regions': ['europe', 'asia', 'africa', 'americas'],
            'priority': 15,
            'eco_rating': 85,
            'fee_transparency_score': 95,
            'is_active': True,
            'is_test_mode': True
        },
        {
            'provider_name': 'viator',
            'display_name': 'Viator',
            'provider_type': 'activity',
            'api_base_url': 'https://api.viator.com',
            'supports_hotels': False,
            'supports_flights': False,
            'supports_activities': True,
            'supported_regions': ['americas', 'europe', 'asia'],
            'priority': 5,
            'eco_rating': 80,
            'fee_transparency_score': 90,
            'is_active': True,
            'is_test_mode': True
        },
        {
            'provider_name': 'getyourguide',
            'display_name': 'GetYourGuide',
            'provider_type': 'activity',
            'api_base_url': 'https://api.getyourguide.com',
            'supports_hotels': False,
            'supports_flights': False,
            'supports_activities': True,
            'supported_regions': ['europe', 'asia', 'americas'],
            'priority': 10,
            'eco_rating': 85,
            'fee_transparency_score': 95,
            'is_active': True,
            'is_test_mode': True
        },
        {
            'provider_name': 'expedia_taap',
            'display_name': 'Expedia TAAP',
            'provider_type': 'package',
            'api_base_url': 'https://api.expedia.com',
            'supports_hotels': True,
            'supports_flights': True,
            'supports_activities': True,
            'supported_regions': ['americas', 'europe', 'asia', 'oceania'],
            'priority': 25,
            'eco_rating': 70,
            'fee_transparency_score': 80,
            'is_active': True,
            'is_test_mode': True
        }
    ]
    
    try:
        result = supabase.table('provider_registry').insert(providers).execute()
        print(f"✅ Seeded {len(providers)} providers")
        return result.data
    except Exception as e:
        print(f"⚠️ Provider seeding error (may already exist): {e}")
        return []

def seed_local_businesses():
    """Seed local businesses for destination deep dive"""
    print("\n🏪 Seeding Local Businesses...")
    
    businesses = [
        # India
        {'name': 'Delhi Heritage Walks', 'type': 'guide', 'destination': 'India', 'verified': True, 'insider_tip': 'Local historian guides, family-run since 1985. Book 2 days ahead.', 'price_range': '₹₹', 'contact': '{"whatsapp": "+91-9876543210", "email": "info@delhiwalks.com"}'},
        {'name': 'Kashmir Shawl Artisans Co-op', 'type': 'shop', 'destination': 'India', 'verified': True, 'insider_tip': 'Direct from weavers, authentic pashmina. Negotiate prices, cash preferred.', 'price_range': '₹₹₹', 'contact': '{"location": "Old Delhi Chandni Chowk", "hours": "10am-7pm"}'},
        {'name': 'Varanasi Family Boat Service', 'type': 'experience', 'destination': 'India', 'verified': True, 'insider_tip': '3 generations boat business. Sunrise Ganga arti best experience. Book via guesthouse.', 'price_range': '₹', 'contact': '{"booking": "Ask any guesthouse in Assi Ghat"}'},
        
        # Thailand
        {'name': 'Bangkok Tuk-Tuk Tours by Somchai', 'type': 'guide', 'destination': 'Thailand', 'verified': True, 'insider_tip': 'Licensed guide 20 years. Knows all hidden food spots. Speaks fluent English.', 'price_range': '฿฿', 'contact': '{"phone": "+66-812345678", "whatsapp": "Same"}'},
        {'name': 'Chiang Mai Hill Tribe Artisans', 'type': 'shop', 'destination': 'Thailand', 'verified': True, 'insider_tip': 'Direct from Karen tribe. Handwoven scarves. Fair trade certified.', 'price_range': '฿฿', 'contact': '{"location": "Night Bazaar stall #47"}'},
        
        # Japan
        {'name': 'Tokyo Local Experience by Yuki', 'type': 'guide', 'destination': 'Japan', 'verified': True, 'insider_tip': 'Born & raised Tokyo. Photography included. Max 4 people. Book 1 week ahead.', 'price_range': '¥¥¥', 'contact': '{"email": "yuki.tours@gmail.com", "instagram": "@tokyowithlocalyuki"}'},
        {'name': 'Kyoto Tea Ceremony Master', 'type': 'experience', 'destination': 'Japan', 'verified': True, 'insider_tip': 'Tea master 40 years. Private ceremony in traditional machiya house.', 'price_range': '¥¥¥¥', 'contact': '{"booking": "Book via Airbnb Experiences"}'},
        
        # Add more destinations...
    ]
    
    try:
        result = supabase.table('local_businesses').insert(businesses).execute()
        print(f"✅ Seeded {len(businesses)} local businesses")
        return result.data
    except Exception as e:
        print(f"⚠️ Local business seeding error: {e}")
        return []

def seed_test_partners():
    """Create test partner accounts"""
    print("\n🏨 Creating Test Partner Accounts...")
    
    partners = [
        {
            'partner_type': 'hotel',
            'business_name': 'Paradise Resort & Spa',
            'legal_entity_name': 'Paradise Hotels Pvt Ltd',
            'tax_id': 'TAX-IND-12345',
            'primary_contact_name': 'Raj Kumar',
            'primary_contact_email': 'raj@paradise-resort.com',
            'primary_contact_phone': '+91-9988776655',
            'address': '123 Beach Road, Goa, India',
            'country': 'India',
            'integration_type': 'api',
            'properties_count': 2,
            'total_rooms': 150,
            'star_rating': 4.5,
            'property_types': ['resort', 'spa'],
            'commission_model': 'percentage',
            'commission_rate': 15.0,
            'currency_preference': 'USD',
            'payment_terms': 'net_30',
            'kyc_status': 'verified',
            'onboarding_status': 'active',
            'onboarding_step': 5,
            'is_active': True
        }
    ]
    
    try:
        result = supabase.table('partner_registry').insert(partners).execute()
        print(f"✅ Created {len(partners)} test partners")
        return result.data
    except Exception as e:
        print(f"⚠️ Partner seeding error: {e}")
        return []

def seed_partner_inventory(partner_id):
    """Generate 90 days of inventory for test partner"""
    print(f"\n📅 Generating inventory for partner {partner_id}...")
    
    inventory = []
    base_date = datetime.now().date()
    
    for day_offset in range(90):
        date = base_date + timedelta(days=day_offset)
        
        # Vary occupancy - lower in mid-week, higher weekends
        is_weekend = date.weekday() >= 5
        base_rooms = 30 if is_weekend else 45  # More available mid-week
        available = base_rooms + random.randint(-10, 10)
        
        # Dynamic pricing
        base_price = 250
        if is_weekend:
            base_price *= 1.3
        
        inventory.append({
            'partner_id': partner_id,
            'property_id': 'paradise-goa-001',
            'room_type': 'Deluxe Ocean View',
            'date': date.isoformat(),
            'available_rooms': available,
            'base_price': base_price,
            'dynamic_price': base_price * random.uniform(0.85, 1.15),
            'min_stay_nights': 2 if is_weekend else 1,
            'is_blackout': False
        })
    
    try:
        result = supabase.table('partner_inventory').insert(inventory).execute()
        print(f"✅ Generated {len(inventory)} inventory records")
    except Exception as e:
        print(f"⚠️ Inventory seeding error: {e}")

def main():
    """Run all seeding operations"""
    print("="*60)
    print("MAKU.TRAVEL DATA SEEDING SCRIPT")
    print("="*60)
    
    # 1. Seed providers
    provider_data = seed_providers()
    
    # 2. Seed local businesses
    seed_local_businesses()
    
    # 3. Create test partners
    partner_data = seed_test_partners()
    
    # 4. Seed inventory if partners created
    if partner_data and len(partner_data) > 0:
        for partner in partner_data:
            seed_partner_inventory(partner['id'])
    
    print("\n" + "="*60)
    print("✅ SEEDING COMPLETE")
    print("="*60)
    print("\nNext steps:")
    print("1. Verify data in Supabase dashboard")
    print("2. Configure Vault secrets for providers")
    print("3. Test provider rotation API")
    print("4. Deploy to production")

if __name__ == "__main__":
    main()
