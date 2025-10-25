"""
Supabase Migration Executor
Applies SQL migrations directly to Supabase PostgreSQL database
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials")
    print("   SUPABASE_URL:", SUPABASE_URL)
    print("   SUPABASE_SERVICE_ROLE_KEY:", "Set" if SUPABASE_SERVICE_KEY else "Missing")
    sys.exit(1)

# Extract project reference from URL
# Format: https://[ref].supabase.co
try:
    ref = SUPABASE_URL.split('//')[1].split('.')[0]
    print(f"✅ Project reference: {ref}")
except Exception as e:
    print(f"❌ Failed to parse Supabase URL: {e}")
    sys.exit(1)

# Try installing psycopg2 if not available
try:
    import psycopg2
    from psycopg2 import sql
    print("✅ psycopg2 available")
except ImportError:
    print("⚠️  psycopg2 not found, attempting to install...")
    os.system("pip install psycopg2-binary")
    try:
        import psycopg2
        from psycopg2 import sql
        print("✅ psycopg2 installed successfully")
    except ImportError:
        print("❌ Failed to install psycopg2")
        sys.exit(1)

def get_db_connection():
    """
    Connect to Supabase PostgreSQL database
    Using direct connection pooler
    """
    # Supabase connection string format
    # postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
    
    # For Supabase, we can use the service role key as password with postgres user
    # Connection string: postgresql://postgres:[[email protected]]:[SERVICE_KEY]@db.[ref].supabase.co:5432/postgres
    
    connection_params = {
        'host': f'db.{ref}.supabase.co',
        'port': 5432,
        'database': 'postgres',
        'user': 'postgres',
        'password': SUPABASE_SERVICE_KEY.split('.')[1] if '.' in SUPABASE_SERVICE_KEY else SUPABASE_SERVICE_KEY
    }
    
    print(f"\n🔌 Attempting connection to Supabase PostgreSQL...")
    print(f"   Host: {connection_params['host']}")
    print(f"   Port: {connection_params['port']}")
    print(f"   Database: {connection_params['database']}")
    
    try:
        conn = psycopg2.connect(**connection_params)
        print("✅ Successfully connected to Supabase PostgreSQL")
        return conn
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Alternative: Use Supabase SQL Editor")
        print(f"   1. Go to: {SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/editor")
        print(f"   2. Open SQL Editor")
        print(f"   3. Copy contents of: /app/supabase/migrations/20250625000000_provider_marketplace_system.sql")
        print(f"   4. Paste and click 'Run'")
        return None

def execute_migration(conn, migration_file):
    """Execute SQL migration file"""
    print(f"\n📄 Reading migration file: {migration_file}")
    
    if not Path(migration_file).exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    with open(migration_file, 'r') as f:
        sql_content = f.read()
    
    print(f"✅ Loaded {len(sql_content)} characters of SQL")
    
    try:
        cursor = conn.cursor()
        
        # Execute the entire migration
        print("\n🚀 Executing migration...")
        cursor.execute(sql_content)
        conn.commit()
        
        print("✅ Migration executed successfully")
        
        # Verify tables were created
        print("\n🔍 Verifying tables...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'provider_registry',
                'provider_credentials',
                'provider_health_logs',
                'provider_rotation_logs',
                'partner_registry',
                'partner_documents',
                'partner_bidding',
                'local_businesses'
            )
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"✅ Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False

def main():
    """Main execution"""
    print("=" * 60)
    print("🔧 SUPABASE MIGRATION EXECUTOR")
    print("=" * 60)
    
    migration_file = '/app/supabase/migrations/20250625000000_provider_marketplace_system.sql'
    
    # Connect to database
    conn = get_db_connection()
    
    if not conn:
        print("\n❌ Cannot proceed without database connection")
        print("   Please use manual SQL editor method described above")
        sys.exit(1)
    
    # Execute migration
    success = execute_migration(conn, migration_file)
    
    # Close connection
    conn.close()
    print("\n🔌 Database connection closed")
    
    if success:
        print("\n" + "=" * 60)
        print("✅ MIGRATION COMPLETE!")
        print("=" * 60)
        print("\n📋 Next Steps:")
        print("   1. Run seeding script: python backend/scripts/seed_production_data.py")
        print("   2. Verify data in Supabase dashboard")
        print("   3. Run backend tests: pytest backend/")
        return 0
    else:
        print("\n" + "=" * 60)
        print("❌ MIGRATION FAILED")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
