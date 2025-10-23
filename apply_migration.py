"""
Apply Off-Season Occupancy Engine Migration
Executes the SQL migration file directly using Supabase service role key
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment
load_dotenv('/app/backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def apply_migration():
    """Apply the off-season migration SQL"""
    print("=" * 70)
    print("APPLYING OFF-SEASON OCCUPANCY ENGINE MIGRATION")
    print("=" * 70)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ ERROR: Missing Supabase credentials")
        return False
    
    try:
        # Create client with service role
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✅ Connected to: {SUPABASE_URL}")
        
        # Read migration file
        migration_file = '/app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql'
        print(f"\n📄 Reading migration: {migration_file}")
        
        with open(migration_file, 'r') as f:
            sql = f.read()
        
        print(f"✅ Migration file loaded ({len(sql)} characters)")
        
        # Execute SQL
        print("\n🚀 Executing migration...")
        print("   This may take 30-60 seconds...")
        
        # Note: Supabase Python client doesn't have direct SQL execution
        # We need to use the REST API or psycopg2
        # For now, let me use a workaround by executing via RPC or direct connection
        
        print("\n⚠️  MIGRATION METHOD:")
        print("   The Supabase Python client doesn't support raw SQL execution.")
        print("   You need to apply the migration via Supabase CLI or Dashboard.")
        print("\n📝 OPTIONS:")
        print("\n   Option 1: Supabase CLI (Recommended)")
        print("   ----------------------------------------")
        print("   cd /app/frontend/supabase")
        print("   supabase db push")
        print("\n   Option 2: Supabase Dashboard")
        print("   ----------------------------------------")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select project: iomeddeasarntjhqzndu")
        print("   3. Go to SQL Editor")
        print("   4. Paste migration SQL and run")
        print("\n   Option 3: Direct PostgreSQL Connection")
        print("   ----------------------------------------")
        print("   Use connection string from Supabase dashboard")
        
        return False
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def list_users():
    """List all users in auth.users table"""
    print("\n" + "=" * 70)
    print("LISTING USERS IN AUTH.USERS TABLE")
    print("=" * 70)
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # List users using admin API
        response = supabase.auth.admin.list_users()
        
        if hasattr(response, 'users'):
            users = response.users
            print(f"\n✅ Found {len(users)} users in database:")
            for i, user in enumerate(users[:10], 1):  # Show first 10
                print(f"\n{i}. Email: {user.email}")
                print(f"   ID: {user.id}")
                print(f"   Created: {user.created_at}")
                print(f"   Confirmed: {user.email_confirmed_at is not None}")
            
            if len(users) > 10:
                print(f"\n... and {len(users) - 10} more users")
            
            return True
        else:
            print("❌ Unexpected response format")
            print(response)
            return False
            
    except Exception as e:
        print(f"❌ Error listing users: {str(e)}")
        return False

if __name__ == "__main__":
    # First, list users to see what's in the database
    list_users()
    
    # Then show migration instructions
    print("\n")
    apply_migration()
