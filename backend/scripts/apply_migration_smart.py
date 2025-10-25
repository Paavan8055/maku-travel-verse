"""
Smart Supabase Migration Executor
Creates a helper function first, then executes migration through it
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials")
    sys.exit(1)

def create_migration_helper():
    """
    Create a stored procedure that can execute DDL statements
    This is a workaround for Supabase's REST API limitations
    """
    print("\n🔧 Creating migration helper function...")
    
    # SQL to create the helper function
    helper_sql = """
CREATE OR REPLACE FUNCTION public.execute_migration(migration_sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE migration_sql;
    result := json_build_object('success', true, 'message', 'Migration executed successfully');
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object('success', false, 'error', SQLERRM);
        RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.execute_migration TO service_role;
"""
    
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    # Use PostgREST to execute the helper creation
    # This still requires manual SQL execution or CLI for the first time
    # This approach won't work without CLI either
    
    print("⚠️  This approach also requires manual SQL Editor access")
    print("   The helper function itself needs to be created via SQL Editor")
    
    return False

def display_migration_content():
    """Display the migration SQL for easy copying"""
    migration_file = '/app/supabase/migrations/20250625000000_provider_marketplace_system.sql'
    
    print("\n" + "=" * 80)
    print("📋 MIGRATION SQL CONTENT")
    print("=" * 80)
    print("\nCopy the content below and paste into Supabase SQL Editor:")
    print("URL: https://supabase.com/dashboard/project/iomeddeasarntjhqzndu/editor\n")
    print("-" * 80)
    
    with open(migration_file, 'r') as f:
        content = f.read()
        print(content)
    
    print("-" * 80)
    print("\n✅ After executing in SQL Editor, run:")
    print("   python backend/scripts/seed_production_data.py")
    print("=" * 80)

def check_migration_status():
    """Check which tables exist"""
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        print("\n🔍 Checking migration status...")
        
        tables = [
            'provider_registry',
            'provider_credentials',
            'provider_rotation_logs',
            'partner_registry',
            'partner_documents',
            'partner_bidding',
            'local_businesses'
        ]
        
        existing = []
        missing = []
        
        for table in tables:
            try:
                supabase.table(table).select('*', count='exact').limit(0).execute()
                existing.append(table)
            except:
                missing.append(table)
        
        print(f"\n📊 Migration Status:")
        print(f"   ✅ Existing: {len(existing)}/7 tables")
        print(f"   ❌ Missing: {len(missing)}/7 tables")
        
        if missing:
            print(f"\n   Missing tables:")
            for table in missing:
                print(f"      - {table}")
        
        return len(missing) == 0
        
    except Exception as e:
        print(f"⚠️  Status check failed: {e}")
        return False

def main():
    """Main execution"""
    print("=" * 80)
    print("🚀 SUPABASE MIGRATION TOOL")
    print("=" * 80)
    
    # Check current status
    if check_migration_status():
        print("\n✅ All tables exist! Proceeding to seeding...")
        print("   Run: python backend/scripts/seed_production_data.py")
        return 0
    
    print("\n" + "=" * 80)
    print("⚠️  MANUAL MIGRATION REQUIRED")
    print("=" * 80)
    print("""
Due to Supabase security restrictions, schema migrations cannot be executed
programmatically via the REST API. You have two options:

OPTION 1 - SQL Editor (Recommended for this fork):
  1. Run: cat /app/supabase/migrations/20250625000000_provider_marketplace_system.sql
  2. Copy the output
  3. Open: https://supabase.com/dashboard/project/iomeddeasarntjhqzndu/editor
  4. Paste and click "Run"

OPTION 2 - Supabase CLI (If available):
  1. supabase link --project-ref iomeddeasarntjhqzndu
  2. supabase db push

After completing either option, verify tables were created and then run:
  python backend/scripts/seed_production_data.py
""")
    
    # Ask user if they want to see the SQL content
    print("\n" + "=" * 80)
    response = input("Display migration SQL for copying? (y/N): ").strip().lower()
    
    if response == 'y':
        display_migration_content()
    else:
        print("\n💡 To display migration SQL, run:")
        print("   cat /app/supabase/migrations/20250625000000_provider_marketplace_system.sql")
    
    return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n👋 Migration tool interrupted")
        sys.exit(1)
