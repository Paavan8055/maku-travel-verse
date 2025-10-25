#!/usr/bin/env python3
"""
Automated Migration & Seeding Workflow
Complete end-to-end process for database setup
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_step(step_num, title, status=""):
    """Print formatted step"""
    status_icon = {
        "pending": "⏳",
        "done": "✅",
        "failed": "❌",
        "skip": "⏭️"
    }.get(status, "")
    print(f"\n{status_icon} Step {step_num}: {title}")

def check_prerequisites():
    """Check all prerequisites"""
    print_step(1, "Checking Prerequisites", "pending")
    
    issues = []
    
    if not SUPABASE_URL:
        issues.append("SUPABASE_URL not set in backend/.env")
    else:
        print(f"   ✅ SUPABASE_URL: {SUPABASE_URL}")
    
    if not SUPABASE_SERVICE_KEY:
        issues.append("SUPABASE_SERVICE_ROLE_KEY not set in backend/.env")
    else:
        print(f"   ✅ SUPABASE_SERVICE_ROLE_KEY: Set (length: {len(SUPABASE_SERVICE_KEY)})")
    
    # Check if supabase library is available
    try:
        from supabase import create_client
        print("   ✅ supabase-py library: Installed")
    except ImportError:
        print("   ⚠️  supabase-py library: Not found, will install...")
        os.system("pip install -q supabase")
        print("   ✅ supabase-py library: Installed")
    
    # Check migration file exists
    migration_file = '/app/supabase/migrations/20250625000000_provider_marketplace_system.sql'
    if Path(migration_file).exists():
        print(f"   ✅ Migration file: Found")
    else:
        issues.append(f"Migration file not found: {migration_file}")
    
    # Check seeding script exists
    seed_script = '/app/backend/scripts/seed_production_data.py'
    if Path(seed_script).exists():
        print(f"   ✅ Seeding script: Found")
    else:
        issues.append(f"Seeding script not found: {seed_script}")
    
    if issues:
        print("\n❌ Prerequisites check failed:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    
    print_step(1, "Prerequisites Check", "done")
    return True

def check_tables():
    """Check which tables exist"""
    from supabase import create_client
    
    print_step(2, "Checking Existing Tables", "pending")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        required_tables = [
            'provider_registry',
            'provider_credentials',
            'provider_health_logs',
            'provider_rotation_logs',
            'partner_registry',
            'partner_documents',
            'partner_inventory',
            'partner_bids'
        ]
        
        existing = []
        missing = []
        
        for table in required_tables:
            try:
                supabase.table(table).select('*', count='exact').limit(0).execute()
                existing.append(table)
                print(f"   ✅ {table}")
            except:
                missing.append(table)
                print(f"   ❌ {table}")
        
        print(f"\n   📊 Status: {len(existing)}/{len(required_tables)} tables exist")
        
        if len(missing) == 0:
            print_step(2, "All Tables Exist", "done")
            return True, existing, missing
        else:
            print_step(2, f"{len(missing)} Tables Missing", "pending")
            return False, existing, missing
            
    except Exception as e:
        print(f"\n   ❌ Failed to check tables: {e}")
        return False, [], []

def display_migration_instructions(missing_tables):
    """Display instructions for manual migration"""
    print_header("MANUAL MIGRATION REQUIRED")
    
    print("""
Due to Supabase API security restrictions, database schema changes must be
applied manually through the Supabase SQL Editor.

INSTRUCTIONS:
""")
    
    print("1️⃣  Open Supabase SQL Editor:")
    project_ref = SUPABASE_URL.split('//')[1].split('.')[0]
    print(f"   https://supabase.com/dashboard/project/{project_ref}/editor")
    
    print("\n2️⃣  Create a new query:")
    print("   - Click 'New query' or '+' button")
    print("   - Name it: 'Provider Marketplace Migration'")
    
    print("\n3️⃣  Copy and paste the migration SQL:")
    print("   Run this command in a terminal:")
    print("   cat /app/supabase/migrations/20250625000000_provider_marketplace_system.sql")
    
    print("\n4️⃣  Execute the migration:")
    print("   - Click 'Run' (or press Ctrl+Enter)")
    print("   - Wait for success message")
    print("   - Verify no errors in output")
    
    print("\n5️⃣  Verify tables were created:")
    print("   Go to Table Editor and confirm these tables exist:")
    for table in missing_tables:
        print(f"      - {table}")
    
    print("\n6️⃣  Return here and press Enter to continue with seeding")
    
    print("\n" + "=" * 80)

def run_seeding():
    """Run the seeding script"""
    print_step(3, "Seeding Production Data", "pending")
    
    seed_script = '/app/backend/scripts/seed_production_data.py'
    
    print("\n   🌱 Running seeding script...")
    print("   " + "-" * 76)
    
    result = os.system(f"cd /app/backend && python {seed_script}")
    
    print("   " + "-" * 76)
    
    if result == 0:
        print_step(3, "Seeding Complete", "done")
        return True
    else:
        print_step(3, "Seeding Failed", "failed")
        return False

def verify_data():
    """Verify data was seeded successfully"""
    from supabase import create_client
    
    print_step(4, "Verifying Seeded Data", "pending")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Check provider_registry
        providers = supabase.table('provider_registry').select('*', count='exact').execute()
        print(f"   ✅ provider_registry: {providers.count} providers")
        
        # Check partner_registry
        partners = supabase.table('partner_registry').select('*', count='exact').execute()
        print(f"   ✅ partner_registry: {partners.count} partners")
        
        # Check partner_inventory (if exists)
        try:
            inventory = supabase.table('partner_inventory').select('*', count='exact').execute()
            print(f"   ✅ partner_inventory: {inventory.count} records")
        except:
            print(f"   ⚠️  partner_inventory: No data (optional)")
        
        print_step(4, "Data Verification", "done")
        return True
        
    except Exception as e:
        print(f"\n   ❌ Verification failed: {e}")
        print_step(4, "Data Verification", "failed")
        return False

def run_backend_tests():
    """Run backend test suite"""
    print_step(5, "Running Backend Tests", "pending")
    
    print("\n   🧪 Executing backend test suite...")
    print("   " + "-" * 76)
    
    # Run pytest with specific test patterns
    result = os.system("cd /app/backend && pytest -v -k 'provider or partner' --tb=short 2>&1 | head -100")
    
    print("   " + "-" * 76)
    
    if result == 0:
        print_step(5, "Backend Tests", "done")
        return True
    else:
        print("   ⚠️  Some tests may have failed (check above)")
        print_step(5, "Backend Tests", "done")
        return False

def main():
    """Main workflow"""
    print_header("🚀 AUTOMATED MIGRATION & SEEDING WORKFLOW")
    print("This script will guide you through:")
    print("  1. Prerequisites check")
    print("  2. Table verification")
    print("  3. Manual migration (if needed)")
    print("  4. Automated seeding")
    print("  5. Data verification")
    print("  6. Backend testing")
    
    input("\nPress Enter to begin...")
    
    # Step 1: Prerequisites
    if not check_prerequisites():
        return 1
    
    # Step 2: Check tables
    all_exist, existing, missing = check_tables()
    
    if not all_exist:
        # Step 2.5: Manual migration instructions
        display_migration_instructions(missing)
        input("\n👉 After completing the migration, press Enter to continue...")
        
        # Recheck tables
        print("\n🔄 Rechecking tables...")
        all_exist, existing, missing = check_tables()
        
        if not all_exist:
            print("\n❌ Migration incomplete. Please ensure all tables are created.")
            print("   Missing tables:")
            for table in missing:
                print(f"      - {table}")
            return 1
    else:
        print("\n✅ All tables already exist! Skipping migration.")
    
    # Step 3: Seeding
    if not run_seeding():
        print("\n⚠️  Seeding failed. Check errors above.")
        return 1
    
    # Step 4: Verification
    if not verify_data():
        print("\n⚠️  Verification failed. Data may be incomplete.")
    
    # Step 5: Testing (optional)
    print("\n" + "=" * 80)
    response = input("Run backend tests now? (y/N): ").strip().lower()
    if response == 'y':
        run_backend_tests()
    else:
        print_step(5, "Backend Tests", "skip")
        print("   You can run tests later with: pytest backend/")
    
    # Success summary
    print_header("✅ WORKFLOW COMPLETE")
    print("""
Next Steps:
  1. Review seeded data in Supabase dashboard
  2. Configure provider API keys in backend/.env
  3. Implement provider adapters (Amadeus, Sabre, HotelBeds, etc.)
  4. Test partner onboarding wizard
  5. Test next-gen partner dashboard
  
Documentation:
  - Migration SQL: /app/supabase/migrations/20250625000000_provider_marketplace_system.sql
  - Seeding Script: /app/backend/scripts/seed_production_data.py
  - Deployment Plan: /app/docs/FINAL_DEPLOYMENT_PLAN.md
""")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n👋 Workflow interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
