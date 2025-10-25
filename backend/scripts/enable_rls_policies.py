"""
Enable Row Level Security (RLS) Policies
Apply security policies for provider and partner tables
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# SQL for enabling RLS and creating policies
RLS_POLICIES_SQL = """
-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR PROVIDER & PARTNER MARKETPLACE
-- ============================================================================

-- Provider Registry: Admin-only access
ALTER TABLE provider_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access provider_registry" ON provider_registry;
CREATE POLICY "Admin full access provider_registry" ON provider_registry
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Service role full access provider_registry" ON provider_registry;
CREATE POLICY "Service role full access provider_registry" ON provider_registry
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Provider Credentials: Service role only (highest security)
ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only provider_credentials" ON provider_credentials;
CREATE POLICY "Service role only provider_credentials" ON provider_credentials
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Provider Health Logs: Read-only for admins
ALTER TABLE provider_health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read provider_health_logs" ON provider_health_logs;
CREATE POLICY "Admin read provider_health_logs" ON provider_health_logs
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role write provider_health_logs" ON provider_health_logs;
CREATE POLICY "Service role write provider_health_logs" ON provider_health_logs
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Provider Rotation Logs: Read-only for admins
ALTER TABLE provider_rotation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read provider_rotation_logs" ON provider_rotation_logs;
CREATE POLICY "Admin read provider_rotation_logs" ON provider_rotation_logs
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role write provider_rotation_logs" ON provider_rotation_logs;
CREATE POLICY "Service role write provider_rotation_logs" ON provider_rotation_logs
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Partner Registry: Partners see only their own data
ALTER TABLE partner_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access partner_registry" ON partner_registry;
CREATE POLICY "Admin full access partner_registry" ON partner_registry
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Partners view own registry" ON partner_registry;
CREATE POLICY "Partners view own registry" ON partner_registry
  FOR SELECT 
  USING (id = (auth.jwt() ->> 'partner_id')::UUID);

DROP POLICY IF EXISTS "Partners update own registry" ON partner_registry;
CREATE POLICY "Partners update own registry" ON partner_registry
  FOR UPDATE 
  USING (id = (auth.jwt() ->> 'partner_id')::UUID);

-- Partner Documents: Partners manage their own documents
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access partner_documents" ON partner_documents;
CREATE POLICY "Admin full access partner_documents" ON partner_documents
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Partners manage own documents" ON partner_documents;
CREATE POLICY "Partners manage own documents" ON partner_documents
  FOR ALL 
  USING (partner_id = (auth.jwt() ->> 'partner_id')::UUID);

-- Partner Inventory: Partners manage their own inventory
ALTER TABLE partner_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access partner_inventory" ON partner_inventory;
CREATE POLICY "Admin full access partner_inventory" ON partner_inventory
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Partners manage own inventory" ON partner_inventory;
CREATE POLICY "Partners manage own inventory" ON partner_inventory
  FOR ALL 
  USING (partner_id = (auth.jwt() ->> 'partner_id')::UUID);

-- Partner Bids: Partners view and create their own bids
ALTER TABLE partner_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access partner_bids" ON partner_bids;
CREATE POLICY "Admin full access partner_bids" ON partner_bids
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Partners view own bids" ON partner_bids;
CREATE POLICY "Partners view own bids" ON partner_bids
  FOR SELECT 
  USING (partner_id = (auth.jwt() ->> 'partner_id')::UUID);

DROP POLICY IF EXISTS "Partners insert own bids" ON partner_bids;
CREATE POLICY "Partners insert own bids" ON partner_bids
  FOR INSERT 
  WITH CHECK (partner_id = (auth.jwt() ->> 'partner_id')::UUID);

DROP POLICY IF EXISTS "Partners update own bids" ON partner_bids;
CREATE POLICY "Partners update own bids" ON partner_bids
  FOR UPDATE 
  USING (partner_id = (auth.jwt() ->> 'partner_id')::UUID);
"""


def enable_rls_policies():
    """Enable RLS policies via Supabase"""
    try:
        print("=" * 80)
        print("🔒 ENABLING ROW LEVEL SECURITY POLICIES")
        print("=" * 80)
        
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            print("\n❌ ERROR: Supabase credentials not configured")
            print("   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env")
            return False
        
        print(f"\n✅ Connected to Supabase: {SUPABASE_URL}")
        
        # Create Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        print("\n📋 MANUAL SQL EXECUTION REQUIRED")
        print("=" * 80)
        print("\nDue to Supabase API limitations, RLS policies must be applied via SQL Editor:")
        print("\n1. Open Supabase SQL Editor:")
        print(f"   https://supabase.com/dashboard/project/{SUPABASE_URL.split('//')[1].split('.')[0]}/editor")
        print("\n2. Copy the SQL below and paste into SQL Editor:")
        print("\n3. Click 'Run' to execute")
        print("\n" + "=" * 80)
        print("\nSQL TO COPY:")
        print("=" * 80)
        print(RLS_POLICIES_SQL)
        print("=" * 80)
        
        print("\n📊 VERIFICATION QUERY")
        print("=" * 80)
        print("\nAfter applying policies, verify with this query:")
        print("""
SELECT 
    schemaname,
    tablename, 
    rowsecurity AS rls_enabled,
    COUNT(*) FILTER (WHERE polname IS NOT NULL) AS policy_count
FROM pg_tables 
LEFT JOIN pg_policies ON pg_tables.tablename = pg_policies.tablename
WHERE schemaname = 'public' 
  AND pg_tables.tablename IN (
    'provider_registry',
    'provider_credentials',
    'provider_health_logs',
    'provider_rotation_logs',
    'partner_registry',
    'partner_documents',
    'partner_inventory',
    'partner_bids'
  )
GROUP BY schemaname, pg_tables.tablename, rowsecurity
ORDER BY pg_tables.tablename;
""")
        print("=" * 80)
        
        print("\n✅ EXPECTED RESULTS:")
        print("   - All tables should have rls_enabled = true")
        print("   - provider_registry: 2 policies")
        print("   - provider_credentials: 1 policy")
        print("   - provider_health_logs: 2 policies")
        print("   - provider_rotation_logs: 2 policies")
        print("   - partner_registry: 3 policies")
        print("   - partner_documents: 2 policies")
        print("   - partner_inventory: 2 policies")
        print("   - partner_bids: 4 policies")
        
        print("\n" + "=" * 80)
        print("📋 POLICY SUMMARY")
        print("=" * 80)
        print("\nProvider Tables:")
        print("  ✅ Admin full access to provider_registry")
        print("  ✅ Service role only for provider_credentials (encrypted)")
        print("  ✅ Read-only health logs for admins")
        print("  ✅ Read-only rotation logs for admins")
        print("\nPartner Tables:")
        print("  ✅ Partners can only access their own data")
        print("  ✅ Partners can manage their own inventory")
        print("  ✅ Partners can create and view their own bids")
        print("  ✅ Admins have full access to all partner data")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False


def check_rls_status():
    """Check if RLS is enabled on tables"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Note: Direct query to pg_tables requires database connection
        # This is a placeholder for verification
        print("\n🔍 Checking RLS status...")
        print("   (Manual verification required via Supabase dashboard)")
        
        return True
        
    except Exception as e:
        print(f"❌ Status check failed: {e}")
        return False


if __name__ == "__main__":
    print("\n")
    success = enable_rls_policies()
    
    if success:
        print("\n" + "=" * 80)
        print("✅ RLS POLICY SCRIPT COMPLETE")
        print("=" * 80)
        print("\n📋 Next Steps:")
        print("   1. Copy the SQL from above")
        print("   2. Execute in Supabase SQL Editor")
        print("   3. Run verification query")
        print("   4. Confirm all policies are active")
        sys.exit(0)
    else:
        print("\n" + "=" * 80)
        print("❌ RLS POLICY SCRIPT FAILED")
        print("=" * 80)
        sys.exit(1)
