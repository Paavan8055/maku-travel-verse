"""
Supabase Migration Executor via REST API
Uses Supabase Python client to execute SQL via RPC
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials")
    print("   SUPABASE_URL:", SUPABASE_URL)
    print("   SUPABASE_SERVICE_ROLE_KEY:", "Set" if SUPABASE_SERVICE_KEY else "Missing")
    sys.exit(1)

try:
    from supabase import create_client, Client
    print("✅ supabase-py available")
except ImportError:
    print("⚠️  supabase-py not found, installing...")
    os.system("pip install supabase")
    try:
        from supabase import create_client, Client
        print("✅ supabase-py installed successfully")
    except ImportError:
        print("❌ Failed to install supabase-py")
        sys.exit(1)

def read_migration_file(migration_file):
    """Read and parse migration file"""
    print(f"\n📄 Reading migration file: {migration_file}")
    
    if not Path(migration_file).exists():
        print(f"❌ Migration file not found: {migration_file}")
        return None
    
    with open(migration_file, 'r') as f:
        sql_content = f.read()
    
    print(f"✅ Loaded {len(sql_content)} characters of SQL")
    return sql_content

def execute_via_sql_editor_instructions():
    """Provide instructions for manual SQL execution"""
    print("\n" + "=" * 70)
    print("📋 MANUAL MIGRATION INSTRUCTIONS")
    print("=" * 70)
    print(f"""
Due to Supabase API limitations, please execute the migration manually:

1. Open Supabase SQL Editor:
   {SUPABASE_URL.replace('//', '//supabase.com/dashboard/project/')}/editor

2. Create new query and paste the contents of:
   /app/supabase/migrations/20250625000000_provider_marketplace_system.sql

3. Click "Run" to execute the migration

4. Verify tables were created in the Table Editor:
   - provider_registry
   - provider_credentials  
   - provider_health_logs
   - provider_rotation_logs
   - partner_registry
   - partner_documents
   - partner_bidding
   - local_businesses

5. Return here and run the seeding script:
   python backend/scripts/seed_production_data.py

Alternative: If you have Supabase CLI installed, run:
   supabase db push --linked
    """)
    print("=" * 70)

def execute_via_http_api(sql_content):
    """Attempt to execute SQL via Supabase HTTP API"""
    import requests
    
    print("\n🚀 Attempting to execute via HTTP API...")
    
    # Try using the SQL endpoint (may not work for CREATE TABLE)
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Split SQL into individual statements
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    print(f"   Found {len(statements)} SQL statements")
    
    # Try PostgREST's rpc endpoint
    # This requires a stored procedure, which we don't have
    # So this method won't work without first creating a migration helper function
    
    print("⚠️  HTTP API execution not supported for DDL statements")
    print("   Supabase requires CLI or SQL Editor for schema changes")
    
    return False

def check_tables_exist():
    """Check if migration tables already exist"""
    try:
        from supabase import create_client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        print("\n🔍 Checking if tables already exist...")
        
        # Try to query each table
        tables_to_check = [
            'provider_registry',
            'provider_credentials',
            'provider_health_logs',
            'provider_rotation_logs',
            'partner_registry',
            'partner_documents',
            'partner_bidding',
            'local_businesses'
        ]
        
        existing_tables = []
        missing_tables = []
        
        for table in tables_to_check:
            try:
                # Try to count rows (will fail if table doesn't exist)
                response = supabase.table(table).select('*', count='exact').limit(0).execute()
                existing_tables.append(table)
                print(f"   ✅ {table} exists")
            except Exception as e:
                missing_tables.append(table)
                print(f"   ❌ {table} missing")
        
        print(f"\n📊 Summary:")
        print(f"   Existing tables: {len(existing_tables)}/8")
        print(f"   Missing tables: {len(missing_tables)}/8")
        
        if len(missing_tables) == 0:
            print("\n✅ All tables already exist! Migration may have been applied.")
            print("   You can proceed directly to seeding:")
            print("   python backend/scripts/seed_production_data.py")
            return True
        
        return False
        
    except Exception as e:
        print(f"⚠️  Could not check tables: {e}")
        return False

def main():
    """Main execution"""
    print("=" * 70)
    print("🔧 SUPABASE MIGRATION EXECUTOR (REST API)")
    print("=" * 70)
    
    migration_file = '/app/supabase/migrations/20250625000000_provider_marketplace_system.sql'
    
    # First check if tables already exist
    if check_tables_exist():
        return 0
    
    # Read migration file
    sql_content = read_migration_file(migration_file)
    if not sql_content:
        return 1
    
    # Try HTTP API (will likely fail)
    success = execute_via_http_api(sql_content)
    
    if not success:
        # Provide manual instructions
        execute_via_sql_editor_instructions()
        
        print("\n💡 Quick Copy Command:")
        print(f"   cat {migration_file}")
        print("\n   Copy the output and paste it into Supabase SQL Editor")
        
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
