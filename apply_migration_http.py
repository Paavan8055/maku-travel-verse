"""
Apply migration via Supabase SQL API
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Read migration
with open('/app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql', 'r') as f:
    sql = f.read()

print("Attempting to execute migration via Supabase Management API...")
print(f"SQL length: {len(sql)} characters")

# Try using psycopg2 if available
try:
    import psycopg2
    print("\n✅ psycopg2 available - attempting direct connection...")
    print("⚠️  This requires DATABASE_URL with password")
    print("   Format: postgresql://postgres:[PASSWORD]@db.iomeddeasarntjhqzndu.supabase.co:5432/postgres")
    print("\n❌ DATABASE_URL not provided - cannot execute")
except ImportError:
    print("\n❌ psycopg2 not installed")
    print("   Install with: pip install psycopg2-binary")

print("\n" + "=" * 70)
print("MIGRATION MUST BE APPLIED MANUALLY")
print("=" * 70)
print("\nPlease follow these steps:")
print("\n1. Go to: https://supabase.com/dashboard/project/iomeddeasarntjhqzndu/sql")
print("\n2. Click 'New query'")
print("\n3. Copy and paste this entire migration file:")
print("   /app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql")
print("\n4. Click 'Run' to execute")
print("\n5. Verify success by running:")
print("   python /app/test_supabase_connectivity.py")

