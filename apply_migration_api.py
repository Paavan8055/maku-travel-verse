"""
Execute Off-Season Migration SQL via Supabase REST API
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Read migration SQL
with open('/app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql', 'r') as f:
    sql = f.read()

print("=" * 70)
print("APPLYING OFF-SEASON MIGRATION VIA SUPABASE API")
print("=" * 70)

# Try using Supabase Management API
# The REST API doesn't support raw SQL execution, but we can try the SQL endpoint
api_url = f"{SUPABASE_URL}/rest/v1/rpc"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

print(f"\n✅ Supabase URL: {SUPABASE_URL}")
print(f"✅ Service role key configured")
print(f"✅ Migration SQL loaded ({len(sql)} characters)")

# Since Supabase REST API doesn't support raw SQL, let me use supabase-py query builder
# But actually, the best approach is to execute each statement individually

from supabase import create_client, Client

supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# Split SQL into statements
statements = []
current_statement = []
in_function = False

for line in sql.split('\n'):
    stripped = line.strip()
    
    # Skip empty lines and comments
    if not stripped or stripped.startswith('--'):
        continue
    
    # Track function/trigger blocks
    if 'CREATE' in line and ('FUNCTION' in line or 'TRIGGER' in line):
        in_function = True
    
    current_statement.append(line)
    
    # End of statement
    if stripped.endswith(';'):
        if '$$;' in stripped or not in_function:
            statements.append('\n'.join(current_statement))
            current_statement = []
            in_function = False

print(f"\n📊 Parsed into {len(statements)} SQL statements")

# Execute using RPC (if available) or fallback message
print("\n⚠️  Supabase Python client cannot execute raw SQL directly.")
print("   Migration must be applied via Supabase Dashboard SQL Editor.")
print("\n📝 INSTRUCTIONS:")
print("\n1. Go to: https://supabase.com/dashboard/project/iomeddeasarntjhqzndu/sql")
print("2. Click 'New query'")
print("3. Copy the migration SQL (already provided to you)")
print("4. Paste and click 'Run'")
print("\n✅ Service role key is now configured in backend/.env")
print("✅ After you apply migration, run: python /app/test_supabase_connectivity.py")
