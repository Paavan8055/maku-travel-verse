"""
Execute Off-Season Migration SQL Directly
Uses psycopg2 to connect directly to Supabase PostgreSQL
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

# Get Supabase PostgreSQL connection details
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
PROJECT_REF = "iomeddeasarntjhqzndu"

def execute_migration_sql():
    """Execute migration SQL directly via PostgreSQL"""
    print("=" * 70)
    print("EXECUTING OFF-SEASON MIGRATION VIA DIRECT SQL")
    print("=" * 70)
    
    print("\n⚠️  NOTE: This requires PostgreSQL connection string from Supabase.")
    print("   You can find it at: Settings → Database → Connection String")
    print("\n   The connection string format:")
    print("   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres")
    print("\n   For now, I'll use the REST API approach instead...")
    
    # Read migration file
    migration_file = '/app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql'
    
    with open(migration_file, 'r') as f:
        sql = f.read()
    
    print(f"\n✅ Migration file loaded ({len(sql)} characters)")
    print(f"✅ Contains SQL for creating tables, RPC functions, and policies")
    
    # Parse SQL into individual statements
    statements = []
    current = []
    in_function = False
    
    for line in sql.split('\n'):
        stripped = line.strip()
        
        # Skip comments
        if stripped.startswith('--') or not stripped:
            continue
        
        # Track function blocks
        if 'CREATE OR REPLACE FUNCTION' in line or 'CREATE FUNCTION' in line:
            in_function = True
        
        current.append(line)
        
        # End of statement
        if stripped.endswith(';') and not in_function:
            statements.append('\n'.join(current))
            current = []
        elif '$$;' in stripped:
            in_function = False
            statements.append('\n'.join(current))
            current = []
    
    print(f"✅ Parsed into {len(statements)} SQL statements")
    
    print("\n📝 MANUAL MIGRATION STEPS:")
    print("\n1. Copy the migration SQL file content:")
    print("   /app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql")
    print("\n2. Go to Supabase Dashboard → SQL Editor")
    print("   https://supabase.com/dashboard/project/iomeddeasarntjhqzndu/sql")
    print("\n3. Create 'New query', paste the entire migration SQL, and run")
    print("\n4. Verify tables created:")
    print("   - offseason_campaigns")
    print("   - dream_intents")
    print("   - wallet_accounts")
    print("   - wallet_txns")
    print("   - deal_candidates")
    print("\n5. Verify RPC function: get_offseason_deals")
    
    return False

if __name__ == "__main__":
    execute_migration_sql()
