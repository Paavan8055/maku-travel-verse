"""
Apply migration using direct PostgreSQL connection
Uses Supabase connection pooler with psycopg2
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

# Supabase PostgreSQL connection via pooler
# Format: postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
PROJECT_REF = "iomeddeasarntjhqzndu"

print("=" * 70)
print("APPLYING OFF-SEASON MIGRATION VIA DIRECT POSTGRESQL")
print("=" * 70)

print("\n⚠️  NOTE: Direct PostgreSQL connection requires database password.")
print("   This is different from the API keys.")
print("\n📍 To get the connection string:")
print("   1. Go to Supabase Dashboard → Settings → Database")
print("   2. Find 'Connection string' section")
print("   3. Use 'Connection pooling' → 'Transaction' mode")
print("   4. The password is your Supabase project database password")

print("\n🔄 ALTERNATIVE: I'll prepare SQL for manual execution...")

# Read migration
with open('/app/frontend/supabase/migrations/20250101000000_offseason_occupancy_engine.sql', 'r') as f:
    sql = f.read()

print(f"\n✅ Migration SQL ready ({len(sql)} characters)")
print("\n" + "=" * 70)
print("MANUAL APPLICATION REQUIRED")
print("=" * 70)
print("\nPlease apply via Supabase Dashboard SQL Editor:")
print("1. Visit: https://supabase.com/dashboard/project/iomeddeasarntjhqzndu/sql")
print("2. Click 'New query'")
print("3. Paste the migration SQL I provided")
print("4. Click 'Run'")
print("\nAfter successful execution, run:")
print("   python /app/test_supabase_connectivity.py")
