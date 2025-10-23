"""
Test script to debug auth error
Checks if is_admin RPC function exists in Supabase
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

print("="*80)
print("🔍 AUTH ERROR DIAGNOSTIC")
print("="*80)

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Supabase credentials not found")
    exit(1)

print(f"\n✅ Supabase URL: {SUPABASE_URL}")
print(f"✅ Service key configured: {SUPABASE_SERVICE_KEY[:20]}...")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("\n✅ Supabase client created")
    
    # Test 1: Check if is_admin function exists
    print("\n" + "="*80)
    print("TEST 1: Check is_admin RPC function")
    print("="*80)
    
    # Get a real user ID first
    users_response = supabase.auth.admin.list_users()
    if users_response:
        print(f"\n✅ Found {len(users_response)} users")
        
        if len(users_response) > 0:
            test_user_id = users_response[0].id
            test_user_email = users_response[0].email
            print(f"\n📧 Testing with user: {test_user_email}")
            print(f"   User ID: {test_user_id}")
            
            # Try calling is_admin RPC
            try:
                result = supabase.rpc('is_admin', {'user_id_param': test_user_id}).execute()
                print(f"\n✅ is_admin RPC call successful!")
                print(f"   Result: {result.data}")
            except Exception as e:
                print(f"\n❌ is_admin RPC call failed!")
                print(f"   Error: {e}")
                print(f"\n💡 SOLUTION: The is_admin function doesn't exist or has RLS issues")
                print(f"   This is causing the auth error and page reload loop")
        else:
            print("\n⚠️  No users found in database")
    
    # Test 2: Check auth.users table
    print("\n" + "="*80)
    print("TEST 2: Check auth.users access")
    print("="*80)
    
    try:
        # Try to query users
        response = supabase.table('profiles').select('*').limit(1).execute()
        print(f"\n✅ Profiles table accessible")
        print(f"   Records: {len(response.data)}")
    except Exception as e:
        print(f"\n⚠️  Profiles table: {e}")
    
    print("\n" + "="*80)
    print("DIAGNOSTIC COMPLETE")
    print("="*80)
    print("\n📋 FINDINGS:")
    print("1. If is_admin RPC fails → Auth error on login")
    print("2. Frontend tries to check admin status → Error thrown")
    print("3. GlobalErrorBoundary catches it → Shows error page")
    print("4. User clicks reload → Loop continues")
    print("\n💡 FIX: Add error handling in AuthContext to gracefully handle missing RPC")
    
except Exception as e:
    print(f"\n❌ Connection error: {e}")
    print("\n💡 Check:")
    print("1. SUPABASE_URL correct?")
    print("2. SUPABASE_SERVICE_ROLE_KEY valid?")
    print("3. Network connectivity OK?")
