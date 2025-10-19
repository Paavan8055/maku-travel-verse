"""
Phase 1 Diagnostic Script
Analyzes AI performance, achievements data, and rewards system
"""

import asyncio
import time
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001/api"

async def test_ai_performance():
    """Test AI endpoint response times"""
    print("\n" + "="*80)
    print("🔍 PHASE 1.1: AI PERFORMANCE DIAGNOSTICS")
    print("="*80)
    
    endpoints = [
        {
            "name": "Travel DNA Analysis",
            "url": f"{BASE_URL}/ai/travel-dna/test_user_123",
            "method": "POST",
            "data": {"preferences": ["culture", "food", "photography"]}
        },
        {
            "name": "Intelligent Recommendations",
            "url": f"{BASE_URL}/ai/intelligent-recommendations/test_user_123",
            "method": "POST",
            "data": {"destination": "Paris", "interests": ["museums", "cuisine"]}
        },
        {
            "name": "Predictive Insights",
            "url": f"{BASE_URL}/ai/predictive-insights/test_user_123",
            "method": "POST",
            "data": {}
        }
    ]
    
    results = []
    
    for endpoint in endpoints:
        print(f"\n📊 Testing: {endpoint['name']}")
        print(f"   URL: {endpoint['url']}")
        
        try:
            start_time = time.time()
            
            if endpoint['method'] == 'POST':
                response = requests.post(endpoint['url'], json=endpoint['data'], timeout=30)
            else:
                response = requests.get(endpoint['url'], timeout=30)
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                results.append({
                    "endpoint": endpoint['name'],
                    "response_time": elapsed,
                    "status": "✅ SUCCESS",
                    "data_size": len(json.dumps(data))
                })
                
                print(f"   ✅ Status: {response.status_code}")
                print(f"   ⏱️  Response Time: {elapsed:.2f}s")
                print(f"   📦 Data Size: {len(json.dumps(data))} bytes")
                
                # Performance analysis
                if elapsed > 15:
                    print(f"   ⚠️  SLOW: Response time exceeds 15s")
                elif elapsed > 10:
                    print(f"   ⚠️  MODERATE: Response time exceeds 10s")
                else:
                    print(f"   ✅ GOOD: Response time under 10s")
                    
            else:
                results.append({
                    "endpoint": endpoint['name'],
                    "response_time": elapsed,
                    "status": f"❌ FAILED: {response.status_code}",
                    "error": response.text[:200]
                })
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                
        except requests.exceptions.Timeout:
            results.append({
                "endpoint": endpoint['name'],
                "status": "❌ TIMEOUT (>30s)",
                "response_time": 30
            })
            print(f"   ❌ Timeout: Request exceeded 30s")
            
        except Exception as e:
            results.append({
                "endpoint": endpoint['name'],
                "status": f"❌ ERROR: {str(e)}",
                "response_time": 0
            })
            print(f"   ❌ Error: {str(e)}")
    
    # Summary
    print("\n" + "-"*80)
    print("📈 AI PERFORMANCE SUMMARY:")
    print("-"*80)
    
    total_tests = len(results)
    successful = len([r for r in results if "SUCCESS" in r['status']])
    avg_response_time = sum([r.get('response_time', 0) for r in results if r.get('response_time')]) / max(successful, 1)
    
    print(f"   Total Endpoints Tested: {total_tests}")
    print(f"   Successful: {successful}/{total_tests}")
    print(f"   Average Response Time: {avg_response_time:.2f}s")
    
    if avg_response_time > 10:
        print(f"\n   ⚠️  ISSUE IDENTIFIED: Average response time ({avg_response_time:.2f}s) exceeds target (5s)")
        print(f"   💡 RECOMMENDATIONS:")
        print(f"      - Implement Redis caching for common queries")
        print(f"      - Optimize prompt length and complexity")
        print(f"      - Consider faster models (gpt-4o-nano, gemini-2.0-flash-lite)")
        print(f"      - Add streaming responses for better UX")
    else:
        print(f"   ✅ Performance is within acceptable range")
    
    return results


async def test_achievements_data():
    """Test achievements for duplicates and placeholders"""
    print("\n" + "="*80)
    print("🔍 PHASE 1.2: ACHIEVEMENTS DATA DIAGNOSTICS")
    print("="*80)
    
    test_user_id = "test_user_123"
    url = f"{BASE_URL}/gamification/achievements/{test_user_id}"
    
    print(f"\n📊 Testing: Achievements Endpoint")
    print(f"   URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            achievements = response.json()
            
            print(f"\n   ✅ Status: {response.status_code}")
            print(f"   📦 Total Achievements: {len(achievements)}")
            
            # Check for duplicates
            achievement_ids = [a.get('id') for a in achievements]
            duplicates = [id for id in achievement_ids if achievement_ids.count(id) > 1]
            
            if duplicates:
                print(f"\n   ❌ DUPLICATES FOUND:")
                for dup_id in set(duplicates):
                    count = achievement_ids.count(dup_id)
                    print(f"      - '{dup_id}' appears {count} times")
            else:
                print(f"   ✅ No duplicates detected")
            
            # Check for placeholder data
            placeholder_indicators = [
                'mock', 'test', 'placeholder', 'demo', 'sample',
                'TODO', 'TBD', 'FIXME'
            ]
            
            placeholder_issues = []
            for achievement in achievements:
                for key, value in achievement.items():
                    if isinstance(value, str):
                        for indicator in placeholder_indicators:
                            if indicator.lower() in value.lower():
                                placeholder_issues.append({
                                    'achievement_id': achievement.get('id'),
                                    'field': key,
                                    'issue': f"Contains '{indicator}'"
                                })
            
            if placeholder_issues:
                print(f"\n   ⚠️  PLACEHOLDER DATA FOUND ({len(placeholder_issues)} issues):")
                for issue in placeholder_issues[:5]:  # Show first 5
                    print(f"      - {issue['achievement_id']}.{issue['field']}: {issue['issue']}")
                if len(placeholder_issues) > 5:
                    print(f"      ... and {len(placeholder_issues) - 5} more")
            else:
                print(f"   ✅ No obvious placeholder data detected")
            
            # Check for real booking data connection
            has_real_data = False
            for achievement in achievements:
                requirements = achievement.get('requirements', [])
                for req in requirements:
                    current_value = req.get('current_value', 0)
                    if current_value > 0 and current_value != req.get('target_value'):
                        has_real_data = True
                        break
            
            if has_real_data:
                print(f"   ✅ Achievements appear to use real progress data")
            else:
                print(f"   ⚠️  All achievements show static values (may be mock data)")
            
            # Summary
            print(f"\n" + "-"*80)
            print(f"📈 ACHIEVEMENTS SUMMARY:")
            print(f"-"*80)
            print(f"   Total Achievements: {len(achievements)}")
            print(f"   Duplicates: {len(set(duplicates))}")
            print(f"   Placeholder Issues: {len(placeholder_issues)}")
            print(f"   Real Data Connection: {'✅ Yes' if has_real_data else '❌ No'}")
            
            if duplicates or placeholder_issues or not has_real_data:
                print(f"\n   💡 RECOMMENDATIONS:")
                if duplicates:
                    print(f"      - Implement deduplication logic in achievement query")
                if placeholder_issues:
                    print(f"      - Replace mock data with real booking history")
                if not has_real_data:
                    print(f"      - Connect achievements to MongoDB bookings collection")
                    print(f"      - Implement real-time progress calculation")
            
            return {
                "total": len(achievements),
                "duplicates": len(set(duplicates)),
                "placeholder_issues": len(placeholder_issues),
                "has_real_data": has_real_data
            }
            
        else:
            print(f"   ❌ Failed: {response.status_code}")
            return {"error": response.status_code}
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return {"error": str(e)}


async def test_rewards_data():
    """Test rewards section for demo data"""
    print("\n" + "="*80)
    print("🔍 PHASE 1.3: REWARDS DATA DIAGNOSTICS")
    print("="*80)
    
    # Check NFT endpoints
    endpoints = [
        f"{BASE_URL}/nft/collection/test_user_123",
        f"{BASE_URL}/nft/airdrop/eligibility/test_user_123"
    ]
    
    demo_data_found = []
    
    for url in endpoints:
        print(f"\n📊 Testing: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for demo indicators
                demo_indicators = ['demo', 'mock', 'test', 'sample', 'placeholder']
                
                data_str = json.dumps(data).lower()
                found_indicators = [ind for ind in demo_indicators if ind in data_str]
                
                if found_indicators:
                    print(f"   ⚠️  Demo data indicators found: {', '.join(found_indicators)}")
                    demo_data_found.append({
                        'endpoint': url,
                        'indicators': found_indicators
                    })
                else:
                    print(f"   ✅ No obvious demo data indicators")
                    
                # Check for hardcoded values
                if isinstance(data, dict):
                    # Look for suspiciously round numbers
                    for key, value in data.items():
                        if isinstance(value, (int, float)):
                            if value in [100, 500, 1000, 5000, 10000]:
                                print(f"   ⚠️  Suspiciously round value: {key}={value}")
                                
            else:
                print(f"   ⚠️  Status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    # Summary
    print(f"\n" + "-"*80)
    print(f"📈 REWARDS DATA SUMMARY:")
    print(f"-"*80)
    print(f"   Endpoints Checked: {len(endpoints)}")
    print(f"   Demo Data Found: {len(demo_data_found)}")
    
    if demo_data_found:
        print(f"\n   💡 RECOMMENDATIONS:")
        print(f"      - Replace demo/mock data with real cashback calculations")
        print(f"      - Implement formula: cashback = booking_amount * tier_rate (1-10%)")
        print(f"      - Connect to real booking history for accurate rewards")
        print(f"      - Remove hardcoded test values")
    else:
        print(f"   ✅ No obvious demo data detected")
    
    return demo_data_found


async def main():
    """Run all Phase 1 diagnostics"""
    print("\n" + "="*80)
    print("🚀 MAKU.TRAVEL PHASE 1 DIAGNOSTICS")
    print("   Date: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*80)
    
    # Test AI Performance
    ai_results = await test_ai_performance()
    
    # Test Achievements
    achievements_results = await test_achievements_data()
    
    # Test Rewards
    rewards_results = await test_rewards_data()
    
    # Final Summary
    print("\n" + "="*80)
    print("📊 PHASE 1 DIAGNOSTIC SUMMARY")
    print("="*80)
    
    print("\n1️⃣  AI PERFORMANCE:")
    if ai_results:
        avg_time = sum([r.get('response_time', 0) for r in ai_results]) / max(len(ai_results), 1)
        if avg_time > 10:
            print(f"   ⚠️  NEEDS OPTIMIZATION: {avg_time:.2f}s average response time")
        else:
            print(f"   ✅ ACCEPTABLE: {avg_time:.2f}s average response time")
    
    print("\n2️⃣  ACHIEVEMENTS:")
    if isinstance(achievements_results, dict):
        if achievements_results.get('duplicates', 0) > 0:
            print(f"   ❌ NEEDS FIX: {achievements_results['duplicates']} duplicates found")
        else:
            print(f"   ✅ NO DUPLICATES")
            
        if achievements_results.get('placeholder_issues', 0) > 0:
            print(f"   ⚠️  NEEDS FIX: {achievements_results['placeholder_issues']} placeholder issues")
        
        if not achievements_results.get('has_real_data', False):
            print(f"   ⚠️  NEEDS CONNECTION: Not using real booking data")
    
    print("\n3️⃣  REWARDS:")
    if rewards_results:
        print(f"   ⚠️  NEEDS FIX: Demo data found in {len(rewards_results)} endpoints")
    else:
        print(f"   ✅ NO DEMO DATA DETECTED")
    
    print("\n" + "="*80)
    print("✅ DIAGNOSTIC COMPLETE")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(main())
