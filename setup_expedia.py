#!/usr/bin/env python3
"""
Expedia Group API Configuration Setup Script
============================================

This script helps configure Expedia Group API credentials for the Maku.Travel platform.
It stores credentials securely in Supabase and validates the configuration.

Usage:
    python setup_expedia.py --api-key YOUR_API_KEY --shared-secret YOUR_SHARED_SECRET
    python setup_expedia.py --test-mode  # For sandbox testing
"""

import os
import sys
import argparse
import asyncio
import httpx
from datetime import datetime

# Add parent directory to path to import server modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def setup_expedia_credentials(api_key, shared_secret, test_mode=True):
    """Setup Expedia credentials using the backend API"""
    
    # Get backend URL from environment
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    setup_url = f"{backend_url}/api/expedia/setup"
    
    print("🏨 Setting up Expedia Group API integration...")
    print(f"   Backend URL: {backend_url}")
    print(f"   Test Mode: {test_mode}")
    
    # Prepare credentials
    credentials = {
        "api_key": api_key,
        "shared_secret": shared_secret,
        "test_mode": test_mode,
        "base_url": "https://api.expediagroup.com",
        "sandbox_url": "https://api.sandbox.expediagroup.com"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("📤 Sending credentials to backend...")
            response = await client.post(setup_url, json=credentials)
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Expedia credentials configured successfully!")
                print(f"   Provider: {data.get('provider')}")
                print(f"   Test Mode: {data.get('test_mode')}")
                print(f"   Message: {data.get('message')}")
                
                # Test health check
                await test_health_check(backend_url)
                
                return True
            else:
                print(f"❌ Setup failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('error', 'Unknown error')}")
                except:
                    print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Failed to setup credentials: {e}")
        return False

async def test_health_check(backend_url):
    """Test Expedia health check endpoint"""
    health_url = f"{backend_url}/api/expedia/health"
    
    try:
        print("\n🏥 Testing Expedia service health...")
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(health_url)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                authenticated = data.get('authenticated', False)
                
                if status == 'healthy' and authenticated:
                    print("✅ Expedia service is healthy and authenticated!")
                elif status == 'unhealthy':
                    print("⚠️  Expedia service is unhealthy:")
                    print(f"   Error: {data.get('error', 'Unknown error')}")
                else:
                    print(f"📊 Expedia service status: {status}")
                    print(f"   Authenticated: {authenticated}")
            else:
                print(f"❌ Health check failed: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Health check error: {e}")

async def test_provider_registry():
    """Test that Expedia is in the provider registry"""
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    registry_url = f"{backend_url}/api/smart-dreams/providers"
    
    try:
        print("\n🌟 Checking provider registry integration...")
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(registry_url)
            
            if response.status_code == 200:
                data = response.json()
                providers = data.get('providers', [])
                
                # Find Expedia provider
                expedia_provider = None
                for provider in providers:
                    if provider.get('name') == 'Expedia Group':
                        expedia_provider = provider
                        break
                
                if expedia_provider:
                    score = expedia_provider.get('performance_score', 0)
                    print(f"✅ Expedia Group found in provider registry!")
                    print(f"   Performance Score: {score}")
                    print(f"   Status: {expedia_provider.get('status', 'unknown')}")
                    print(f"   Type: {expedia_provider.get('type', 'unknown')}")
                else:
                    print("⚠️  Expedia Group not found in provider registry")
            else:
                print(f"❌ Provider registry check failed: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Provider registry error: {e}")

def check_environment():
    """Check if required environment variables are set"""
    print("🔍 Checking environment configuration...")
    
    required_vars = ['REACT_APP_BACKEND_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("   Please ensure these are set in your backend .env file")
        return False
    else:
        print("✅ Environment configuration looks good!")
        return True

async def main():
    parser = argparse.ArgumentParser(description='Setup Expedia Group API credentials')
    parser.add_argument('--api-key', required=True, help='Expedia API Key')
    parser.add_argument('--shared-secret', required=True, help='Expedia Shared Secret')
    parser.add_argument('--test-mode', action='store_true', default=True, 
                       help='Use sandbox environment (default: True)')
    parser.add_argument('--production', action='store_true', 
                       help='Use production environment')
    parser.add_argument('--check-only', action='store_true',
                       help='Only check current configuration without updating')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🚀 EXPEDIA GROUP API CONFIGURATION SETUP")
    print("=" * 60)
    print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check environment
    if not check_environment():
        print("\n❌ Environment check failed. Please fix configuration before continuing.")
        sys.exit(1)
    
    # Determine test mode
    test_mode = not args.production
    if args.production:
        print("⚠️  PRODUCTION MODE: Using live Expedia API endpoints")
        confirm = input("Are you sure you want to use production mode? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Setup cancelled.")
            sys.exit(0)
    
    if args.check_only:
        print("🔍 Running configuration check only...")
        await test_provider_registry()
        backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
        await test_health_check(backend_url)
    else:
        # Setup credentials
        success = await setup_expedia_credentials(
            args.api_key, 
            args.shared_secret, 
            test_mode
        )
        
        if success:
            await test_provider_registry()
            print("\n🎉 Expedia Group API integration setup complete!")
            print("   You can now use all Expedia services:")
            print("   • Hotels: 700,000+ properties")
            print("   • Flights: Global airline partnerships") 
            print("   • Cars: 110+ rental brands")
            print("   • Activities: 170,000+ experiences")
        else:
            print("\n❌ Setup failed. Please check your credentials and try again.")
            sys.exit(1)
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(main())