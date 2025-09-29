#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append('/app/backend')

from supabase_config import get_config_instance, validate_configuration

async def test_configuration():
    """Test the Supabase configuration system"""
    try:
        print("🔧 Testing Supabase Configuration System")
        print("=" * 50)
        
        # Test configuration instance
        config = get_config_instance()
        print(f"✅ Configuration instance created")
        print(f"📍 Environment: {config.environment}")
        
        # Test validation
        validation = await validate_configuration()
        print(f"\n🔍 Configuration Validation:")
        print(f"   Valid: {validation['valid']}")
        print(f"   Environment: {validation['environment']}")
        
        if validation['missing_configs']:
            print(f"❌ Missing Configs: {validation['missing_configs']}")
        if validation['missing_secrets']:
            print(f"❌ Missing Secrets: {validation['missing_secrets']}")
            
        if validation['valid']:
            print("✅ Configuration is valid!")
        else:
            print("⚠️  Configuration has issues")
            
        # Test provider configs
        print(f"\n🚀 Testing Provider Configurations:")
        all_configs = await config.get_all_provider_configs()
        for provider, provider_config in all_configs.items():
            has_config = bool(provider_config)
            print(f"   {provider}: {'✅' if has_config else '❌'}")
        
        return validation['valid']
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_configuration())
    sys.exit(0 if success else 1)