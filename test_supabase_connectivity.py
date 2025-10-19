"""
Supabase Connectivity Test for Off-Season Occupancy Engine
Tests connection to Supabase and validates schema after migration
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from backend .env
load_dotenv('/app/backend/.env')

def test_supabase_connection():
    """Test basic Supabase connectivity"""
    print("🔍 Testing Supabase Connection...")
    
    # Get credentials from environment
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ ERROR: SUPABASE_URL or SUPABASE_KEY not set in environment")
        print(f"   SUPABASE_URL: {supabase_url}")
        print(f"   Key available: {bool(supabase_key)}")
        return False
    
    try:
        # Create client
        supabase: Client = create_client(supabase_url, supabase_key)
        print(f"✅ Connected to Supabase: {supabase_url}")
        
        # Test query - check if partners table exists
        result = supabase.table("partners").select("id").limit(1).execute()
        print(f"✅ Partners table accessible (found {len(result.data)} records)")
        
        return True
    
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def test_offseason_tables():
    """Test if off-season tables exist after migration"""
    print("\n🔍 Testing Off-Season Tables...")
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Skipping table tests (no credentials)")
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        tables_to_check = [
            "offseason_campaigns",
            "dream_intents",
            "wallet_accounts",
            "wallet_txns",
            "deal_candidates"
        ]
        
        all_exist = True
        for table in tables_to_check:
            try:
                result = supabase.table(table).select("id").limit(1).execute()
                print(f"✅ Table '{table}' exists")
            except Exception as e:
                print(f"❌ Table '{table}' not found or not accessible: {str(e)}")
                all_exist = False
        
        return all_exist
    
    except Exception as e:
        print(f"❌ Table check failed: {str(e)}")
        return False

def test_rpc_function():
    """Test get_offseason_deals RPC function"""
    print("\n🔍 Testing RPC Function: get_offseason_deals...")
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Skipping RPC test (no credentials)")
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test with dummy UUID
        test_uuid = "00000000-0000-0000-0000-000000000000"
        result = supabase.rpc("get_offseason_deals", {"user_uuid": test_uuid}).execute()
        
        print(f"✅ RPC function 'get_offseason_deals' is callable")
        print(f"   Returned {len(result.data)} deals for test user")
        
        return True
    
    except Exception as e:
        error_msg = str(e)
        if "function public.get_offseason_deals" in error_msg and "does not exist" in error_msg:
            print(f"⚠️  RPC function not yet created (migration pending)")
        else:
            print(f"❌ RPC test failed: {error_msg}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("MAKU Off-Season Occupancy Engine - Supabase Connectivity Test")
    print("=" * 70)
    
    # Run all tests
    connection_ok = test_supabase_connection()
    tables_ok = test_offseason_tables() if connection_ok else False
    rpc_ok = test_rpc_function() if connection_ok else False
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Connection:        {'✅ PASS' if connection_ok else '❌ FAIL'}")
    print(f"Off-Season Tables: {'✅ PASS' if tables_ok else '⚠️  PENDING (migration required)'}")
    print(f"RPC Functions:     {'✅ PASS' if rpc_ok else '⚠️  PENDING (migration required)'}")
    print("=" * 70)
    
    if connection_ok and not (tables_ok and rpc_ok):
        print("\n📝 NEXT STEP: Apply migration with: supabase db push")
        print("   Migration file: /app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql")
    
    sys.exit(0 if connection_ok else 1)
